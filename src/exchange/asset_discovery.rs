use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use anyhow::{Result, anyhow};
use tracing::{debug, info, warn, error};

use crate::exchange::bybit::adapter::BybitAdapter;
use crate::exchange::bybit::types::{MarketCategory, InstrumentInfo};

/// Asset filter criteria
#[derive(Debug, Clone)]
pub struct AssetFilterCriteria {
    /// Minimum price in USD
    pub min_price: Option<f64>,
    /// Maximum price in USD
    pub max_price: Option<f64>,
    /// Minimum 24h volume in USD
    pub min_volume: Option<f64>,
    /// Minimum market cap in USD
    pub min_market_cap: Option<f64>,
    /// Minimum volatility (24h price change %)
    pub min_volatility: Option<f64>,
    /// Maximum volatility (24h price change %)
    pub max_volatility: Option<f64>,
    /// Include only base currencies (e.g., BTC, ETH)
    pub base_currencies_only: bool,
    /// Include only quote currencies (e.g., USDT, USD)
    pub quote_currencies: Vec<String>,
    /// Exclude specific assets
    pub exclude_assets: Vec<String>,
}

impl Default for AssetFilterCriteria {
    fn default() -> Self {
        Self {
            min_price: None,
            max_price: None,
            min_volume: None,
            min_market_cap: None,
            min_volatility: None,
            max_volatility: None,
            base_currencies_only: false,
            quote_currencies: vec!["USDT".to_string()],
            exclude_assets: Vec::new(),
        }
    }
}

/// Asset discovery service
pub struct AssetDiscovery {
    /// Exchange adapter
    adapter: Arc<Mutex<BybitAdapter>>,
    /// Market category
    category: MarketCategory,
    /// Discovered assets
    assets: HashMap<String, InstrumentInfo>,
    /// Last update time
    last_update: chrono::DateTime<chrono::Utc>,
}

impl AssetDiscovery {
    /// Create a new asset discovery service
    pub fn new(adapter: Arc<Mutex<BybitAdapter>>, category: MarketCategory) -> Self {
        Self {
            adapter,
            category,
            assets: HashMap::new(),
            last_update: chrono::Utc::now() - chrono::Duration::hours(24), // Force initial update
        }
    }
    
    /// Discover assets
    pub async fn discover_assets(&mut self) -> Result<Vec<String>> {
        let now = chrono::Utc::now();
        
        // Only update once per hour
        if now.signed_duration_since(self.last_update).num_minutes() < 60 && !self.assets.is_empty() {
            debug!("Using cached asset list ({} assets)", self.assets.len());
            return Ok(self.assets.keys().cloned().collect());
        }
        
        info!("Discovering tradable assets");
        
        // Get instrument info
        let mut adapter = self.adapter.lock().await;
        let instruments = adapter.get_instruments(&self.category.to_string()).await?;
        
        // Store assets
        self.assets.clear();
        for bybit_instrument in instruments.list {
            // Convert BybitInstrument to InstrumentInfo
            let instrument = InstrumentInfo {
                symbol: bybit_instrument.symbol.clone(),
                base_currency: "".to_string(), // BybitInstrument doesn't have this field
                quote_currency: "USDT".to_string(), // Default to USDT
                status: "Trading".to_string(), // Default status
                lot_size_filter: crate::exchange::bybit::types::LotSizeFilter {
                    min_trading_qty: bybit_instrument.lot_size_filter.min_trading_qty,
                    max_trading_qty: bybit_instrument.lot_size_filter.max_trading_qty,
                    qty_step: bybit_instrument.lot_size_filter.qty_step,
                },
                price_filter: crate::exchange::bybit::types::PriceFilter {
                    min_price: bybit_instrument.price_filter.min_price,
                    max_price: bybit_instrument.price_filter.max_price,
                    tick_size: bybit_instrument.price_filter.tick_size,
                },
                leverage_filter: crate::exchange::bybit::types::LeverageFilter {
                    min_leverage: bybit_instrument.leverage_filter.min_leverage as i32,
                    max_leverage: bybit_instrument.leverage_filter.max_leverage as i32,
                    leverage_step: bybit_instrument.leverage_filter.leverage_step,
                },
                last_price: "0".to_string(), // Default
                volume_24h: "0".to_string(), // Default
                price_change_24h: "0".to_string(), // Default
            };
            self.assets.insert(instrument.symbol.clone(), instrument);
        }
        
        self.last_update = now;
        
        info!("Discovered {} tradable assets", self.assets.len());
        
        Ok(self.assets.keys().cloned().collect())
    }
    
    /// Filter assets based on criteria
    pub async fn filter_assets(&mut self, criteria: AssetFilterCriteria) -> Result<Vec<String>> {
        // Ensure we have assets
        if self.assets.is_empty() {
            self.discover_assets().await?;
        }
        
        let mut filtered = Vec::new();
        
        for (symbol, info) in &self.assets {
            // Skip excluded assets
            if criteria.exclude_assets.contains(symbol) {
                continue;
            }
            
            // Filter by quote currency
            if !criteria.quote_currencies.is_empty() {
                let mut match_found = false;
                for quote in &criteria.quote_currencies {
                    if symbol.ends_with(quote) {
                        match_found = true;
                        break;
                    }
                }
                
                if !match_found {
                    continue;
                }
            }
            
            // Filter by base currency
            if criteria.base_currencies_only {
                // Typically base currencies are BTC, ETH, etc.
                if symbol.starts_with("BTC") || symbol.starts_with("ETH") {
                    continue;
                }
            }
            
            // Filter by price
            if let Some(min_price) = criteria.min_price {
                let last_price = info.last_price.parse::<f64>().unwrap_or(0.0);
                if last_price < min_price {
                    continue;
                }
            }
            
            if let Some(max_price) = criteria.max_price {
                let last_price = info.last_price.parse::<f64>().unwrap_or(0.0);
                if last_price > max_price {
                    continue;
                }
            }
            
            // Filter by volume
            if let Some(min_volume) = criteria.min_volume {
                let volume_24h = info.volume_24h.parse::<f64>().unwrap_or(0.0);
                if volume_24h < min_volume {
                    continue;
                }
            }
            
            // Filter by volatility
            if let Some(min_volatility) = criteria.min_volatility {
                let price_change_24h = info.price_change_24h.parse::<f64>().unwrap_or(0.0).abs();
                if price_change_24h < min_volatility {
                    continue;
                }
            }
            
            if let Some(max_volatility) = criteria.max_volatility {
                let price_change_24h = info.price_change_24h.parse::<f64>().unwrap_or(0.0).abs();
                if price_change_24h > max_volatility {
                    continue;
                }
            }
            
            // Add to filtered list
            filtered.push(symbol.clone());
        }
        
        info!("Filtered to {} assets matching criteria", filtered.len());
        
        Ok(filtered)
    }
    
    /// Find optimal assets for trading with given capital
    pub async fn find_optimal_assets(&mut self, capital: f64, max_assets: usize) -> Result<Vec<String>> {
        // Ensure we have assets
        if self.assets.is_empty() {
            self.discover_assets().await?;
        }
        
        // Create criteria for initial filtering
        let criteria = AssetFilterCriteria {
            min_volume: Some(1000000.0), // $1M daily volume
            quote_currencies: vec!["USDT".to_string()],
            ..Default::default()
        };
        
        // Get filtered assets
        let filtered = self.filter_assets(criteria).await?;
        
        // Calculate score for each asset
        let mut scored_assets = Vec::new();
        
        for symbol in filtered {
            if let Some(info) = self.assets.get(&symbol) {
                let last_price = info.last_price.parse::<f64>().unwrap_or(0.0);
                let volume_24h = info.volume_24h.parse::<f64>().unwrap_or(0.0);
                let price_change_24h = info.price_change_24h.parse::<f64>().unwrap_or(0.0).abs();
                
                // Skip assets that are too expensive for our capital
                if last_price > capital {
                    continue;
                }
                
                // Calculate score based on volume and volatility
                // Higher volume and moderate volatility are preferred
                let volume_score = (volume_24h.ln() / 20.0).min(1.0);
                let volatility_score = if price_change_24h < 0.5 {
                    price_change_24h / 0.5
                } else if price_change_24h < 5.0 {
                    1.0
                } else {
                    5.0 / price_change_24h
                };
                
                let score = volume_score * 0.7 + volatility_score * 0.3;
                
                scored_assets.push((symbol, score));
            }
        }
        
        // Sort by score (descending)
        scored_assets.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
        
        // Take top N assets
        let optimal: Vec<String> = scored_assets.into_iter()
            .take(max_assets)
            .map(|(symbol, _)| symbol)
            .collect();
        
        info!("Found {} optimal assets for trading with ${:.2} capital", optimal.len(), capital);
        
        Ok(optimal)
    }
    
    /// Get instrument info for a symbol
    pub fn get_instrument_info(&self, symbol: &str) -> Option<InstrumentInfo> {
        self.assets.get(symbol).cloned()
    }
}
