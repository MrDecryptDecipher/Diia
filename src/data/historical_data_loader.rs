use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use chrono::{DateTime, Duration, Utc};
use serde::{Deserialize, Serialize};
use tracing::{debug, info, warn, error};
use anyhow::Result;

use crate::exchange::bybit::adapter::BybitAdapter;
use crate::exchange::bybit::types::{KlineInterval, MarketCategory};
use crate::strategy::simple_strategy::Candle;

/// Historical data cache
#[derive(Debug, Clone, Default)]
pub struct HistoricalDataCache {
    /// Candles by symbol and interval
    candles: HashMap<String, HashMap<KlineInterval, Vec<Candle>>>,
    /// Last update time by symbol and interval
    last_update: HashMap<String, HashMap<KlineInterval, DateTime<Utc>>>,
}

/// Historical data loader
pub struct HistoricalDataLoader {
    /// Exchange adapter
    adapter: Arc<Mutex<BybitAdapter>>,
    /// Data cache
    cache: Arc<Mutex<HistoricalDataCache>>,
    /// Market category
    category: MarketCategory,
    /// Cache duration in hours
    cache_duration: i64,
}

impl HistoricalDataLoader {
    /// Create a new historical data loader
    pub fn new(adapter: Arc<Mutex<BybitAdapter>>, category: MarketCategory) -> Self {
        Self {
            adapter,
            cache: Arc::new(Mutex::new(HistoricalDataCache::default())),
            category,
            cache_duration: 1, // Cache data for 1 hour by default
        }
    }

    /// Set cache duration in hours
    pub fn set_cache_duration(&mut self, hours: i64) {
        self.cache_duration = hours;
    }

    /// Get historical candles for a symbol and interval
    pub async fn get_candles(
        &self,
        symbol: &str,
        interval: KlineInterval,
        limit: usize,
    ) -> Result<Vec<Candle>> {
        let now = Utc::now();
        let symbol = symbol.to_uppercase();
        
        // Check cache first
        let should_fetch = {
            let cache = self.cache.lock().await;
            
            !cache.candles.contains_key(&symbol)
                || !cache.candles.get(&symbol).unwrap().contains_key(&interval)
                || cache.candles.get(&symbol).unwrap().get(&interval).unwrap().len() < limit
                || !cache.last_update.contains_key(&symbol)
                || !cache.last_update.get(&symbol).unwrap().contains_key(&interval)
                || now.signed_duration_since(*cache.last_update.get(&symbol).unwrap().get(&interval).unwrap()).num_hours() > self.cache_duration
        };
        
        if should_fetch {
            // Fetch new data
            debug!("Fetching historical data for {} ({})", symbol, interval);
            
            // Calculate start time based on interval and limit
            let interval_minutes = match interval {
                KlineInterval::Min1 => 1,
                KlineInterval::Min3 => 3,
                KlineInterval::Min5 => 5,
                KlineInterval::Min15 => 15,
                KlineInterval::Min30 => 30,
                KlineInterval::Hour1 => 60,
                KlineInterval::Hour2 => 120,
                KlineInterval::Hour4 => 240,
                KlineInterval::Hour6 => 360,
                KlineInterval::Hour12 => 720,
                KlineInterval::Day1 => 1440,
                KlineInterval::Week1 => 10080,
                KlineInterval::Month1 => 43200,
            };
            
            let start_time = now - Duration::minutes(interval_minutes as i64 * limit as i64);
            let start_timestamp = start_time.timestamp_millis();
            
            // Fetch data from exchange
            let mut adapter = self.adapter.lock().await;
            let klines = adapter.get_klines(
                self.category.clone(),
                &symbol,
                interval.clone(),
                Some(start_timestamp),
                None,
                Some(limit as i32),
            ).await?;
            
            // Convert to candles
            let mut candles = Vec::with_capacity(klines.list.len());
            for kline in klines.list {
                let timestamp = DateTime::from_timestamp(kline.start_time / 1000, 0)
                    .unwrap_or_else(|| Utc::now());
                
                let candle = Candle {
                    timestamp,
                    open: kline.open.parse().unwrap_or(0.0),
                    high: kline.high.parse().unwrap_or(0.0),
                    low: kline.low.parse().unwrap_or(0.0),
                    close: kline.close.parse().unwrap_or(0.0),
                    volume: kline.volume.parse().unwrap_or(0.0),
                };
                
                candles.push(candle);
            }
            
            // Sort candles by timestamp (oldest first)
            candles.sort_by(|a, b| a.timestamp.cmp(&b.timestamp));
            
            // Update cache
            let mut cache = self.cache.lock().await;
            
            if !cache.candles.contains_key(&symbol) {
                cache.candles.insert(symbol.clone(), HashMap::new());
            }
            
            if !cache.last_update.contains_key(&symbol) {
                cache.last_update.insert(symbol.clone(), HashMap::new());
            }
            
            cache.candles.get_mut(&symbol).unwrap().insert(interval.clone(), candles.clone());
            cache.last_update.get_mut(&symbol).unwrap().insert(interval.clone(), now);
            
            info!("Fetched {} candles for {} ({})", candles.len(), symbol, interval);
            
            Ok(candles)
        } else {
            // Return cached data
            let cache = self.cache.lock().await;
            let candles = cache.candles.get(&symbol).unwrap().get(&interval).unwrap().clone();
            
            // Return only the requested number of candles (most recent)
            if candles.len() > limit {
                Ok(candles[candles.len() - limit..].to_vec())
            } else {
                Ok(candles)
            }
        }
    }
    
    /// Preload historical data for multiple symbols
    pub async fn preload_data(
        &self,
        symbols: &[String],
        intervals: &[KlineInterval],
        limit: usize,
    ) -> Result<()> {
        info!("Preloading historical data for {} symbols", symbols.len());
        
        for symbol in symbols {
            for interval in intervals {
                match self.get_candles(symbol, interval.clone(), limit).await {
                    Ok(candles) => {
                        debug!("Preloaded {} candles for {} ({})", candles.len(), symbol, interval);
                    }
                    Err(e) => {
                        warn!("Failed to preload data for {} ({}): {}", symbol, interval, e);
                    }
                }
            }
        }
        
        info!("Finished preloading historical data");
        Ok(())
    }
    
    /// Clear the cache
    pub async fn clear_cache(&self) {
        let mut cache = self.cache.lock().await;
        cache.candles.clear();
        cache.last_update.clear();
        info!("Historical data cache cleared");
    }
}
