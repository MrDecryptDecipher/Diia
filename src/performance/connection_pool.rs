//! Connection Pool Management
//!
//! Provides efficient connection pooling for HTTP clients and database connections
//! to optimize resource usage and reduce connection overhead.

use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::{Semaphore, RwLock};
use tracing::{debug, info, warn, error};
use reqwest::Client;
use anyhow::{Result, anyhow};

/// Pooled connection wrapper
pub struct PooledConnection<T> {
    /// The actual connection
    pub connection: T,
    
    /// Creation time
    pub created_at: Instant,
    
    /// Last used time
    pub last_used: Instant,
    
    /// Usage count
    pub usage_count: u64,
    
    /// Connection ID
    pub id: String,
}

impl<T> PooledConnection<T> {
    /// Create new pooled connection
    pub fn new(connection: T, id: String) -> Self {
        let now = Instant::now();
        Self {
            connection,
            created_at: now,
            last_used: now,
            usage_count: 0,
            id,
        }
    }
    
    /// Mark connection as used
    pub fn mark_used(&mut self) {
        self.last_used = Instant::now();
        self.usage_count += 1;
    }
    
    /// Check if connection is stale
    pub fn is_stale(&self, max_age: Duration) -> bool {
        self.created_at.elapsed() > max_age
    }
    
    /// Check if connection is idle
    pub fn is_idle(&self, max_idle: Duration) -> bool {
        self.last_used.elapsed() > max_idle
    }
}

/// Connection pool configuration
#[derive(Debug, Clone)]
pub struct PoolConfig {
    /// Maximum number of connections
    pub max_connections: usize,
    
    /// Minimum number of connections to maintain
    pub min_connections: usize,
    
    /// Maximum age of a connection
    pub max_connection_age: Duration,
    
    /// Maximum idle time before closing connection
    pub max_idle_time: Duration,
    
    /// Connection timeout
    pub connection_timeout: Duration,
    
    /// Health check interval
    pub health_check_interval: Duration,
}

impl Default for PoolConfig {
    fn default() -> Self {
        Self {
            max_connections: 100,
            min_connections: 10,
            max_connection_age: Duration::from_secs(3600), // 1 hour
            max_idle_time: Duration::from_secs(300),       // 5 minutes
            connection_timeout: Duration::from_secs(30),
            health_check_interval: Duration::from_secs(60),
        }
    }
}

/// Generic connection pool
pub struct ConnectionPool<T>
where
    T: Send + Sync + 'static,
{
    /// Pool of connections
    connections: Arc<RwLock<Vec<PooledConnection<T>>>>,
    
    /// Semaphore to limit concurrent connections
    semaphore: Arc<Semaphore>,
    
    /// Pool configuration
    config: PoolConfig,
    
    /// Connection factory
    factory: Arc<dyn Fn() -> Result<T> + Send + Sync>,
    
    /// Health checker
    health_checker: Arc<dyn Fn(&T) -> bool + Send + Sync>,
    
    /// Pool statistics
    stats: Arc<RwLock<PoolStats>>,
}

/// Pool statistics
#[derive(Debug, Clone)]
pub struct PoolStats {
    /// Total connections created
    pub total_created: u64,
    
    /// Total connections destroyed
    pub total_destroyed: u64,
    
    /// Current active connections
    pub active_connections: usize,
    
    /// Current idle connections
    pub idle_connections: usize,
    
    /// Total requests served
    pub total_requests: u64,
    
    /// Average wait time for connection
    pub avg_wait_time_ms: f64,
    
    /// Pool hit ratio
    pub hit_ratio: f64,
}

impl<T> ConnectionPool<T>
where
    T: Send + Sync + 'static,
{
    /// Create new connection pool
    pub fn new<F, H>(
        config: PoolConfig,
        factory: F,
        health_checker: H,
    ) -> Self
    where
        F: Fn() -> Result<T> + Send + Sync + 'static,
        H: Fn(&T) -> bool + Send + Sync + 'static,
    {
        let pool = Self {
            connections: Arc::new(RwLock::new(Vec::new())),
            semaphore: Arc::new(Semaphore::new(config.max_connections)),
            config: config.clone(),
            factory: Arc::new(factory),
            health_checker: Arc::new(health_checker),
            stats: Arc::new(RwLock::new(PoolStats {
                total_created: 0,
                total_destroyed: 0,
                active_connections: 0,
                idle_connections: 0,
                total_requests: 0,
                avg_wait_time_ms: 0.0,
                hit_ratio: 0.0,
            })),
        };
        
        // Start background maintenance task
        pool.start_maintenance_task();
        
        pool
    }
    
    /// Get connection from pool
    pub async fn get_connection(&self) -> Result<PooledConnection<T>> {
        let start_time = Instant::now();
        
        // Acquire semaphore permit
        let _permit = self.semaphore.acquire().await
            .map_err(|_| anyhow!("Failed to acquire connection permit"))?;
        
        // Try to get existing connection
        {
            let mut connections = self.connections.write().await;
            let mut stats = self.stats.write().await;
            
            // Find healthy, non-stale connection
            for i in (0..connections.len()).rev() {
                if !connections[i].is_stale(self.config.max_connection_age) &&
                   !connections[i].is_idle(self.config.max_idle_time) &&
                   (self.health_checker)(&connections[i].connection) {
                    
                    let mut conn = connections.remove(i);
                    conn.mark_used();
                    
                    stats.total_requests += 1;
                    stats.active_connections += 1;
                    stats.idle_connections = connections.len();
                    
                    // Update wait time
                    let wait_time = start_time.elapsed().as_millis() as f64;
                    stats.avg_wait_time_ms = 
                        (stats.avg_wait_time_ms * (stats.total_requests - 1) as f64 + wait_time) 
                        / stats.total_requests as f64;
                    
                    // Update hit ratio
                    stats.hit_ratio = (stats.total_requests - stats.total_created) as f64 
                        / stats.total_requests as f64;
                    
                    return Ok(conn);
                }
            }
        }
        
        // Create new connection
        let connection = (self.factory)()?;
        let conn_id = format!("conn_{}", uuid::Uuid::new_v4());
        let pooled_conn = PooledConnection::new(connection, conn_id);
        
        // Update stats
        {
            let mut stats = self.stats.write().await;
            stats.total_created += 1;
            stats.total_requests += 1;
            stats.active_connections += 1;
            
            let wait_time = start_time.elapsed().as_millis() as f64;
            stats.avg_wait_time_ms = 
                (stats.avg_wait_time_ms * (stats.total_requests - 1) as f64 + wait_time) 
                / stats.total_requests as f64;
            
            stats.hit_ratio = (stats.total_requests - stats.total_created) as f64 
                / stats.total_requests as f64;
        }
        
        debug!("🔗 Created new connection: {}", pooled_conn.id);
        Ok(pooled_conn)
    }
    
    /// Return connection to pool
    pub async fn return_connection(&self, mut connection: PooledConnection<T>) {
        connection.mark_used();
        
        // Check if connection is still healthy
        if (self.health_checker)(&connection.connection) &&
           !connection.is_stale(self.config.max_connection_age) {
            
            let mut connections = self.connections.write().await;
            let mut stats = self.stats.write().await;
            
            connections.push(connection);
            stats.active_connections = stats.active_connections.saturating_sub(1);
            stats.idle_connections = connections.len();
            
            debug!("🔄 Returned connection to pool");
        } else {
            // Connection is unhealthy, destroy it
            let mut stats = self.stats.write().await;
            stats.total_destroyed += 1;
            stats.active_connections = stats.active_connections.saturating_sub(1);
            
            debug!("🗑️ Destroyed unhealthy connection: {}", connection.id);
        }
    }
    
    /// Get pool statistics
    pub async fn get_stats(&self) -> PoolStats {
        self.stats.read().await.clone()
    }
    
    /// Get current pool size
    pub async fn pool_size(&self) -> usize {
        self.connections.read().await.len()
    }
    
    /// Close all connections
    pub async fn close_all(&self) {
        let mut connections = self.connections.write().await;
        let mut stats = self.stats.write().await;
        
        let count = connections.len();
        connections.clear();
        
        stats.total_destroyed += count as u64;
        stats.idle_connections = 0;
        
        info!("🔒 Closed {} connections", count);
    }
    
    /// Start background maintenance task
    fn start_maintenance_task(&self) {
        let connections = Arc::clone(&self.connections);
        let stats = Arc::clone(&self.stats);
        let config = self.config.clone();
        let health_checker = Arc::clone(&self.health_checker);
        
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(config.health_check_interval);
            
            loop {
                interval.tick().await;
                
                let mut connections_guard = connections.write().await;
                let mut stats_guard = stats.write().await;
                
                // Remove stale and unhealthy connections
                let initial_count = connections_guard.len();
                connections_guard.retain(|conn| {
                    let is_healthy = health_checker(&conn.connection);
                    let is_fresh = !conn.is_stale(config.max_connection_age);
                    let is_active = !conn.is_idle(config.max_idle_time);
                    
                    is_healthy && is_fresh && is_active
                });
                
                let removed_count = initial_count - connections_guard.len();
                if removed_count > 0 {
                    stats_guard.total_destroyed += removed_count as u64;
                    stats_guard.idle_connections = connections_guard.len();
                    
                    debug!("🧹 Removed {} stale connections", removed_count);
                }
                
                // Ensure minimum connections
                while connections_guard.len() < config.min_connections {
                    // This would require the factory to be available here
                    // In practice, you might want to handle this differently
                    break;
                }
            }
        });
    }
}

/// HTTP client pool for API requests
pub type HttpClientPool = ConnectionPool<Client>;

/// Create optimized HTTP client pool
pub fn create_http_client_pool() -> HttpClientPool {
    let config = PoolConfig {
        max_connections: 50,
        min_connections: 5,
        max_connection_age: Duration::from_secs(1800), // 30 minutes
        max_idle_time: Duration::from_secs(300),       // 5 minutes
        connection_timeout: Duration::from_secs(30),
        health_check_interval: Duration::from_secs(60),
    };
    
    ConnectionPool::new(
        config,
        || {
            Ok(Client::builder()
                .timeout(Duration::from_secs(30))
                .pool_max_idle_per_host(10)
                .pool_idle_timeout(Duration::from_secs(300))
                .build()?)
        },
        |_client| true, // HTTP clients are generally always healthy
    )
}
