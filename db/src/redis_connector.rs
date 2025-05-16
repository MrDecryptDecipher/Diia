use async_trait::async_trait;
use redis::{Client, Connection, AsyncConnection, RedisResult, RedisError, aio::ConnectionManager};
use serde::{Serialize, Deserialize};
use std::sync::Arc;
use tokio::sync::Mutex;
use tracing::{info, error, warn, debug};

/// RedisConnector provides real-time pub/sub memory bus for OMNI-ALPHA
pub struct RedisConnector {
    /// Redis client
    client: Client,
    /// Connection manager for command operations
    cmd_manager: Arc<Mutex<ConnectionManager>>,
    /// Configuration
    config: RedisConfig,
}

/// Redis configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RedisConfig {
    /// Redis URL
    pub url: String,
    /// Default expiration time in seconds
    pub default_expiry: u64,
    /// Prefix for all keys
    pub key_prefix: String,
    /// Whether to use pub/sub
    pub use_pubsub: bool,
    /// Maximum number of connections
    pub max_connections: usize,
}

impl Default for RedisConfig {
    fn default() -> Self {
        Self {
            url: "redis://127.0.0.1:6379".to_string(),
            default_expiry: 3600,
            key_prefix: "omni:".to_string(),
            use_pubsub: true,
            max_connections: 10,
        }
    }
}

impl RedisConnector {
    /// Create a new RedisConnector
    pub async fn new(config: RedisConfig) -> Result<Self, RedisError> {
        let client = Client::open(config.url.clone())?;
        let conn_manager = ConnectionManager::new(client.clone()).await?;
        
        let connector = Self {
            client,
            cmd_manager: Arc::new(Mutex::new(conn_manager)),
            config,
        };
        
        info!("Redis connector initialized with URL: {}", config.url);
        Ok(connector)
    }
    
    /// Get a value from Redis
    pub async fn get<T: for<'de> Deserialize<'de>>(&self, key: &str) -> Result<Option<T>, RedisError> {
        let prefixed_key = format!("{}{}", self.config.key_prefix, key);
        let mut conn = self.cmd_manager.lock().await;
        
        let result: Option<String> = redis::cmd("GET")
            .arg(&prefixed_key)
            .query_async(&mut *conn)
            .await?;
        
        match result {
            Some(json_str) => {
                match serde_json::from_str(&json_str) {
                    Ok(value) => Ok(Some(value)),
                    Err(e) => {
                        error!("Failed to deserialize Redis value for key {}: {}", key, e);
                        Err(RedisError::from((redis::ErrorKind::TypeError, "Deserialization error")))
                    }
                }
            },
            None => Ok(None),
        }
    }
    
    /// Set a value in Redis
    pub async fn set<T: Serialize>(&self, key: &str, value: &T, expiry: Option<u64>) -> Result<(), RedisError> {
        let prefixed_key = format!("{}{}", self.config.key_prefix, key);
        let mut conn = self.cmd_manager.lock().await;
        
        let json_str = match serde_json::to_string(value) {
            Ok(s) => s,
            Err(e) => {
                error!("Failed to serialize value for key {}: {}", key, e);
                return Err(RedisError::from((redis::ErrorKind::TypeError, "Serialization error")));
            }
        };
        
        let mut cmd = redis::cmd("SET");
        cmd.arg(&prefixed_key).arg(&json_str);
        
        if let Some(exp) = expiry {
            cmd.arg("EX").arg(exp);
        } else if self.config.default_expiry > 0 {
            cmd.arg("EX").arg(self.config.default_expiry);
        }
        
        cmd.query_async(&mut *conn).await?;
        debug!("Set Redis key: {}", key);
        
        Ok(())
    }
    
    /// Delete a key from Redis
    pub async fn delete(&self, key: &str) -> Result<bool, RedisError> {
        let prefixed_key = format!("{}{}", self.config.key_prefix, key);
        let mut conn = self.cmd_manager.lock().await;
        
        let result: i64 = redis::cmd("DEL")
            .arg(&prefixed_key)
            .query_async(&mut *conn)
            .await?;
        
        Ok(result > 0)
    }
    
    /// Check if a key exists in Redis
    pub async fn exists(&self, key: &str) -> Result<bool, RedisError> {
        let prefixed_key = format!("{}{}", self.config.key_prefix, key);
        let mut conn = self.cmd_manager.lock().await;
        
        let result: i64 = redis::cmd("EXISTS")
            .arg(&prefixed_key)
            .query_async(&mut *conn)
            .await?;
        
        Ok(result > 0)
    }
    
    /// Publish a message to a channel
    pub async fn publish<T: Serialize>(&self, channel: &str, message: &T) -> Result<i64, RedisError> {
        if !self.config.use_pubsub {
            warn!("Pub/Sub is disabled in configuration");
            return Ok(0);
        }
        
        let prefixed_channel = format!("{}{}", self.config.key_prefix, channel);
        let mut conn = self.cmd_manager.lock().await;
        
        let json_str = match serde_json::to_string(message) {
            Ok(s) => s,
            Err(e) => {
                error!("Failed to serialize message for channel {}: {}", channel, e);
                return Err(RedisError::from((redis::ErrorKind::TypeError, "Serialization error")));
            }
        };
        
        let result: i64 = redis::cmd("PUBLISH")
            .arg(&prefixed_channel)
            .arg(&json_str)
            .query_async(&mut *conn)
            .await?;
        
        debug!("Published message to channel: {}", channel);
        
        Ok(result)
    }
    
    /// Subscribe to a channel
    pub async fn subscribe(&self, channels: &[&str]) -> Result<SubscriptionHandler, RedisError> {
        if !self.config.use_pubsub {
            warn!("Pub/Sub is disabled in configuration");
            return Err(RedisError::from((redis::ErrorKind::ClientError, "Pub/Sub is disabled")));
        }
        
        let prefixed_channels: Vec<String> = channels
            .iter()
            .map(|c| format!("{}{}", self.config.key_prefix, c))
            .collect();
        
        let mut pubsub = self.client.get_async_connection().await?.into_pubsub();
        
        for channel in &prefixed_channels {
            pubsub.subscribe(channel).await?;
        }
        
        info!("Subscribed to channels: {:?}", channels);
        
        Ok(SubscriptionHandler { pubsub })
    }
    
    /// Increment a counter in Redis
    pub async fn increment(&self, key: &str, amount: i64) -> Result<i64, RedisError> {
        let prefixed_key = format!("{}{}", self.config.key_prefix, key);
        let mut conn = self.cmd_manager.lock().await;
        
        let result: i64 = redis::cmd("INCRBY")
            .arg(&prefixed_key)
            .arg(amount)
            .query_async(&mut *conn)
            .await?;
        
        debug!("Incremented key {} by {}", key, amount);
        
        Ok(result)
    }
    
    /// Add a value to a set in Redis
    pub async fn add_to_set(&self, key: &str, member: &str) -> Result<bool, RedisError> {
        let prefixed_key = format!("{}{}", self.config.key_prefix, key);
        let mut conn = self.cmd_manager.lock().await;
        
        let result: i64 = redis::cmd("SADD")
            .arg(&prefixed_key)
            .arg(member)
            .query_async(&mut *conn)
            .await?;
        
        Ok(result > 0)
    }
    
    /// Get all members of a set in Redis
    pub async fn get_set_members(&self, key: &str) -> Result<Vec<String>, RedisError> {
        let prefixed_key = format!("{}{}", self.config.key_prefix, key);
        let mut conn = self.cmd_manager.lock().await;
        
        let result: Vec<String> = redis::cmd("SMEMBERS")
            .arg(&prefixed_key)
            .query_async(&mut *conn)
            .await?;
        
        Ok(result)
    }
    
    /// Add a value to a sorted set in Redis
    pub async fn add_to_sorted_set(&self, key: &str, member: &str, score: f64) -> Result<bool, RedisError> {
        let prefixed_key = format!("{}{}", self.config.key_prefix, key);
        let mut conn = self.cmd_manager.lock().await;
        
        let result: i64 = redis::cmd("ZADD")
            .arg(&prefixed_key)
            .arg(score)
            .arg(member)
            .query_async(&mut *conn)
            .await?;
        
        Ok(result > 0)
    }
    
    /// Get members of a sorted set in Redis by score range
    pub async fn get_sorted_set_by_score(&self, key: &str, min: f64, max: f64) -> Result<Vec<String>, RedisError> {
        let prefixed_key = format!("{}{}", self.config.key_prefix, key);
        let mut conn = self.cmd_manager.lock().await;
        
        let result: Vec<String> = redis::cmd("ZRANGEBYSCORE")
            .arg(&prefixed_key)
            .arg(min)
            .arg(max)
            .query_async(&mut *conn)
            .await?;
        
        Ok(result)
    }
    
    /// Ping Redis to check connection
    pub async fn ping(&self) -> Result<String, RedisError> {
        let mut conn = self.cmd_manager.lock().await;
        
        let result: String = redis::cmd("PING")
            .query_async(&mut *conn)
            .await?;
        
        Ok(result)
    }
}

/// Handler for Redis subscriptions
pub struct SubscriptionHandler {
    /// Redis pubsub connection
    pubsub: redis::aio::PubSub,
}

impl SubscriptionHandler {
    /// Get the next message from the subscription
    pub async fn get_message(&mut self) -> Result<(String, String), RedisError> {
        let msg = self.pubsub.get_message().await?;
        let channel: String = msg.get_channel()?;
        let payload: String = msg.get_payload()?;
        
        Ok((channel, payload))
    }
    
    /// Unsubscribe from a channel
    pub async fn unsubscribe(&mut self, channel: &str) -> Result<(), RedisError> {
        self.pubsub.unsubscribe(channel).await?;
        debug!("Unsubscribed from channel: {}", channel);
        Ok(())
    }
    
    /// Unsubscribe from all channels
    pub async fn unsubscribe_all(&mut self) -> Result<(), RedisError> {
        self.pubsub.unsubscribe(&[]).await?;
        debug!("Unsubscribed from all channels");
        Ok(())
    }
}
