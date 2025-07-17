//! Real-time Market Data Feed
//!
//! Provides live market data from Bybit mainnet for trading decisions

use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::RwLock;
use anyhow::Result;
use tracing::{info, debug, error};

use crate::bybit::client::BybitClient;
use crate::bybit::types::Ticker;

/// Real-time market data feed
pub struct RealTimeMarketFeed {
    /// Bybit client for market data
    client: Arc<BybitClient>,
    
    /// Symbols to track
    symbols: Vec<String>,
    
    /// Latest ticker data
    tickers: Arc<RwLock<HashMap<String, Ticker>>>,
    
    /// Whether feed is active
    is_active: Arc<RwLock<bool>>,
}

impl RealTimeMarketFeed {
    /// Create new market data feed
    pub fn new(client: Arc<BybitClient>, symbols: Vec<String>) -> Self {
        Self {
            client,
            symbols,
            tickers: Arc::new(RwLock::new(HashMap::new())),
            is_active: Arc::new(RwLock::new(false)),
        }
    }
    
    /// Start the market data feed
    pub async fn start(&self) -> Result<()> {
        info!("📊 Starting real-time market data feed for {} symbols", self.symbols.len());
        
        {
            let mut active = self.is_active.write().await;
            *active = true;
        }
        
        // Start background data collection
        let client = Arc::clone(&self.client);
        let symbols = self.symbols.clone();
        let tickers = Arc::clone(&self.tickers);
        let is_active = Arc::clone(&self.is_active);
        
        tokio::spawn(async move {
            let mut update_interval = tokio::time::interval(Duration::from_secs(5));
            
            while *is_active.read().await {
                update_interval.tick().await;
                
                for symbol in &symbols {
                    match client.get_ticker(symbol).await {
                        Ok(ticker) => {
                            let mut tickers_guard = tickers.write().await;
                            tickers_guard.insert(symbol.clone(), ticker);
                            debug!("📊 Updated ticker for {}", symbol);
                        }
                        Err(e) => {
                            error!("Failed to get ticker for {}: {}", symbol, e);
                        }
                    }
                    
                    // Small delay between requests to avoid rate limits
                    tokio::time::sleep(Duration::from_millis(100)).await;
                }
            }
        });
        
        info!("✅ Market data feed started");
        Ok(())
    }
    
    /// Stop the market data feed
    pub async fn stop(&self) -> Result<()> {
        info!("🛑 Stopping market data feed");
        
        {
            let mut active = self.is_active.write().await;
            *active = false;
        }
        
        info!("✅ Market data feed stopped");
        Ok(())
    }
    
    /// Get latest ticker for symbol
    pub async fn get_ticker(&self, symbol: &str) -> Option<Ticker> {
        let tickers = self.tickers.read().await;
        tickers.get(symbol).cloned()
    }
    
    /// Get all latest tickers
    pub async fn get_all_tickers(&self) -> HashMap<String, Ticker> {
        self.tickers.read().await.clone()
    }
    
    /// Check if feed is active
    pub async fn is_active(&self) -> bool {
        *self.is_active.read().await
    }
}
