//! Comprehensive Asset Discovery System
//!
//! This module provides complete asset discovery across ALL Bybit markets with pagination support.

use std::collections::{HashMap, HashSet};
use serde::{Deserialize, Serialize};
use anyhow::{Result, anyhow};
use tracing::{info, debug, warn, error};
use tokio::time::{sleep, Duration};

use crate::exchange::bybit::adapter::BybitAdapter;
use crate::exchange::bybit::types::{BybitInstrumentInfo, InstrumentStatus};

/// Market categories supported by Bybit
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum MarketCategory {
    /// Spot trading
    Spot,
    /// Linear perpetual contracts
    Linear,
    /// Inverse perpetual contracts
    Inverse,
    /// Options contracts
    Option,
}

impl MarketCategory {
    /// Convert to Bybit API string
    pub fn to_api_string(&self) -> &'static str {
        match self {
            MarketCategory::Spot => "spot",
            MarketCategory::Linear => "linear",
            MarketCategory::Inverse => "inverse",
            MarketCategory::Option => "option",
        }
    }
    
    /// Get all supported categories
    pub fn all() -> Vec<MarketCategory> {
        vec![
            MarketCategory::Spot,
            MarketCategory::Linear,
            MarketCategory::Inverse,
            MarketCategory::Option,
        ]
    }
}

/// Comprehensive asset discovery configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetDiscoveryConfig {
    /// Categories to scan
    pub categories: Vec<MarketCategory>,
    
    /// Only include trading status instruments
    pub trading_only: bool,
    
    /// Minimum 24h volume filter (USDT)
    pub min_volume_24h: Option<f64>,
    
    /// Base coins to filter by
    pub base_coin_filter: Option<Vec<String>>,
    
    /// Quote coins to filter by  
    pub quote_coin_filter: Option<Vec<String>>,
    
    /// Maximum instruments per category (0 = no limit)
    pub max_instruments_per_category: usize,
    
    /// Rate limit delay between API calls (ms)
    pub rate_limit_delay_ms: u64,
}

impl Default for AssetDiscoveryConfig {
    fn default() -> Self {
        Self {
            categories: MarketCategory::all(),
            trading_only: true,
            min_volume_24h: Some(100_000.0), // 100k USDT minimum volume
            base_coin_filter: None,
            quote_coin_filter: Some(vec!["USDT".to_string(), "USDC".to_string()]),
            max_instruments_per_category: 0, // No limit
            rate_limit_delay_ms: 100, // 100ms between calls
        }
    }
}

/// Discovered trading instrument with enhanced metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscoveredInstrument {
    /// Symbol (e.g., "BTCUSDT")
    pub symbol: String,
    
    /// Market category
    pub category: MarketCategory,
    
    /// Base coin (e.g., "BTC")
    pub base_coin: String,
    
    /// Quote coin (e.g., "USDT")
    pub quote_coin: String,
    
    /// Trading status
    pub status: InstrumentStatus,
    
    /// Contract type (for derivatives)
    pub contract_type: Option<String>,
    
    /// Minimum order quantity
    pub min_order_qty: f64,
    
    /// Maximum order quantity
    pub max_order_qty: f64,
    
    /// Quantity precision
    pub qty_step: f64,
    
    /// Price precision
    pub price_scale: i32,
    
    /// Minimum order value (quote currency)
    pub min_order_amt: f64,
    
    /// Maximum leverage (for derivatives)
    pub max_leverage: Option<f64>,
    
    /// 24h volume (quote currency)
    pub volume_24h: Option<f64>,
    
    /// 24h price change percentage
    pub price_change_24h: Option<f64>,
    
    /// Current price
    pub last_price: Option<f64>,
    
    /// Discovery timestamp
    pub discovered_at: chrono::DateTime<chrono::Utc>,
}

/// Comprehensive asset discovery results
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetDiscoveryResult {
    /// Total instruments discovered
    pub total_instruments: usize,
    
    /// Instruments by category
    pub instruments_by_category: HashMap<MarketCategory, Vec<DiscoveredInstrument>>,
    
    /// Discovery statistics
    pub stats: DiscoveryStats,
    
    /// Discovery timestamp
    pub discovered_at: chrono::DateTime<chrono::Utc>,
}

/// Discovery statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscoveryStats {
    /// Total API calls made
    pub total_api_calls: usize,
    
    /// Total discovery time (seconds)
    pub discovery_time_seconds: f64,
    
    /// Instruments by status
    pub instruments_by_status: HashMap<String, usize>,
    
    /// Top base coins by count
    pub top_base_coins: Vec<(String, usize)>,
    
    /// Top quote coins by count
    pub top_quote_coins: Vec<(String, usize)>,
    
    /// Volume distribution
    pub volume_stats: VolumeStats,
}

/// Volume statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VolumeStats {
    pub total_volume_24h: f64,
    pub average_volume_24h: f64,
    pub median_volume_24h: f64,
    pub high_volume_instruments: usize, // > 1M USDT
    pub medium_volume_instruments: usize, // 100k - 1M USDT
    pub low_volume_instruments: usize, // < 100k USDT
}

/// Comprehensive asset discovery engine
pub struct ComprehensiveAssetDiscovery {
    adapter: BybitAdapter,
    config: AssetDiscoveryConfig,
}

impl ComprehensiveAssetDiscovery {
    /// Create new asset discovery engine
    pub fn new(adapter: BybitAdapter, config: AssetDiscoveryConfig) -> Self {
        Self { adapter, config }
    }
    
    /// Discover all available trading instruments
    pub async fn discover_all_instruments(&self) -> Result<AssetDiscoveryResult> {
        let start_time = std::time::Instant::now();
        let mut total_api_calls = 0;
        let mut instruments_by_category = HashMap::new();
        
        info!("Starting comprehensive asset discovery across {} categories", self.config.categories.len());
        
        // Discover instruments for each category
        for category in &self.config.categories {
            info!("Discovering instruments for category: {:?}", category);
            
            let (instruments, api_calls) = self.discover_category_instruments(*category).await?;
            total_api_calls += api_calls;
            
            info!("Discovered {} instruments in category {:?}", instruments.len(), category);
            instruments_by_category.insert(*category, instruments);
            
            // Rate limiting between categories
            if self.config.rate_limit_delay_ms > 0 {
                sleep(Duration::from_millis(self.config.rate_limit_delay_ms)).await;
            }
        }
        
        let discovery_time = start_time.elapsed().as_secs_f64();
        let total_instruments: usize = instruments_by_category.values().map(|v| v.len()).sum();
        
        // Calculate statistics
        let stats = self.calculate_discovery_stats(&instruments_by_category, total_api_calls, discovery_time);
        
        info!(
            "Asset discovery completed: {} instruments across {} categories in {:.2}s ({} API calls)",
            total_instruments,
            self.config.categories.len(),
            discovery_time,
            total_api_calls
        );
        
        Ok(AssetDiscoveryResult {
            total_instruments,
            instruments_by_category,
            stats,
            discovered_at: chrono::Utc::now(),
        })
    }
    
    /// Discover instruments for a specific category with pagination
    async fn discover_category_instruments(&self, category: MarketCategory) -> Result<(Vec<DiscoveredInstrument>, usize)> {
        let mut all_instruments = Vec::new();
        let mut cursor = None;
        let mut api_calls = 0;
        let limit = 1000; // Maximum per request
        
        loop {
            // Make API call with pagination
            let response = self.adapter.get_instruments_paginated(
                category.to_api_string(),
                cursor.as_deref(),
                limit
            ).await?;
            
            api_calls += 1;
            
            // Process instruments
            for instrument_info in response.list {
                if let Some(discovered) = self.process_instrument(instrument_info, category).await? {
                    all_instruments.push(discovered);
                    
                    // Check if we've reached the limit for this category
                    if self.config.max_instruments_per_category > 0 && 
                       all_instruments.len() >= self.config.max_instruments_per_category {
                        break;
                    }
                }
            }
            
            // Check if there are more pages
            if response.next_page_cursor.is_empty() || 
               (self.config.max_instruments_per_category > 0 && 
                all_instruments.len() >= self.config.max_instruments_per_category) {
                break;
            }
            
            cursor = Some(response.next_page_cursor);
            
            // Rate limiting between requests
            if self.config.rate_limit_delay_ms > 0 {
                sleep(Duration::from_millis(self.config.rate_limit_delay_ms)).await;
            }
        }
        
        Ok((all_instruments, api_calls))
    }
    
    /// Process a single instrument and apply filters
    async fn process_instrument(
        &self,
        instrument_info: serde_json::Value,
        category: MarketCategory
    ) -> Result<Option<DiscoveredInstrument>> {
        // Extract basic information
        let symbol = instrument_info["symbol"].as_str()
            .ok_or_else(|| anyhow!("Missing symbol in instrument info"))?;
        
        let base_coin = instrument_info["baseCoin"].as_str()
            .unwrap_or_default().to_string();
        
        let quote_coin = instrument_info["quoteCoin"].as_str()
            .unwrap_or_default().to_string();
        
        let status_str = instrument_info["status"].as_str()
            .unwrap_or("Unknown");
        
        // Apply filters
        if self.config.trading_only && status_str != "Trading" {
            return Ok(None);
        }
        
        if let Some(ref base_filter) = self.config.base_coin_filter {
            if !base_filter.contains(&base_coin) {
                return Ok(None);
            }
        }
        
        if let Some(ref quote_filter) = self.config.quote_coin_filter {
            if !quote_filter.contains(&quote_coin) {
                return Ok(None);
            }
        }
        
        // Get 24h ticker data for volume filtering
        let volume_24h = if let Some(min_vol) = self.config.min_volume_24h {
            match self.get_24h_volume(symbol).await {
                Ok(volume) => {
                    if volume < min_vol {
                        return Ok(None);
                    }
                    Some(volume)
                },
                Err(_) => None,
            }
        } else {
            None
        };
        
        // Create discovered instrument
        let discovered = DiscoveredInstrument {
            symbol: symbol.to_string(),
            category,
            base_coin,
            quote_coin,
            status: self.parse_instrument_status(status_str),
            contract_type: instrument_info["contractType"].as_str().map(|s| s.to_string()),
            min_order_qty: instrument_info["lotSizeFilter"]["minOrderQty"]
                .as_str().and_then(|s| s.parse().ok()).unwrap_or(0.0),
            max_order_qty: instrument_info["lotSizeFilter"]["maxOrderQty"]
                .as_str().and_then(|s| s.parse().ok()).unwrap_or(f64::MAX),
            qty_step: instrument_info["lotSizeFilter"]["qtyStep"]
                .as_str().and_then(|s| s.parse().ok()).unwrap_or(0.001),
            price_scale: instrument_info["priceScale"]
                .as_i64().unwrap_or(2) as i32,
            min_order_amt: instrument_info["lotSizeFilter"]["minOrderAmt"]
                .as_str().and_then(|s| s.parse().ok()).unwrap_or(0.0),
            max_leverage: instrument_info["leverageFilter"]["maxLeverage"]
                .as_str().and_then(|s| s.parse().ok()),
            volume_24h,
            price_change_24h: None, // Will be populated separately if needed
            last_price: None, // Will be populated separately if needed
            discovered_at: chrono::Utc::now(),
        };
        
        Ok(Some(discovered))
    }
    
    /// Get 24h volume for a symbol
    async fn get_24h_volume(&self, symbol: &str) -> Result<f64> {
        // Make API call to get 24h ticker data
        match self.adapter.get_ticker(symbol).await {
            Ok(tickers) => {
                if let Some(ticker) = tickers.first() {
                    Ok(ticker.volume_24h)
                } else {
                    Ok(0.0)
                }
            },
            Err(_) => Ok(0.0), // Return 0 if API call fails
        }
    }
    
    /// Parse instrument status string
    fn parse_instrument_status(&self, status: &str) -> InstrumentStatus {
        match status {
            "Trading" => InstrumentStatus::Trading,
            "PreLaunch" => InstrumentStatus::PreLaunch,
            "Delivering" => InstrumentStatus::Delivering,
            "Closed" => InstrumentStatus::Closed,
            _ => InstrumentStatus::Unknown,
        }
    }
    
    /// Calculate discovery statistics
    fn calculate_discovery_stats(
        &self,
        instruments_by_category: &HashMap<MarketCategory, Vec<DiscoveredInstrument>>,
        total_api_calls: usize,
        discovery_time_seconds: f64,
    ) -> DiscoveryStats {
        let mut instruments_by_status = HashMap::new();
        let mut base_coin_counts = HashMap::new();
        let mut quote_coin_counts = HashMap::new();
        let mut volumes = Vec::new();
        
        // Collect statistics
        for instruments in instruments_by_category.values() {
            for instrument in instruments {
                // Status counts
                let status_key = format!("{:?}", instrument.status);
                *instruments_by_status.entry(status_key).or_insert(0) += 1;
                
                // Base coin counts
                *base_coin_counts.entry(instrument.base_coin.clone()).or_insert(0) += 1;
                
                // Quote coin counts
                *quote_coin_counts.entry(instrument.quote_coin.clone()).or_insert(0) += 1;
                
                // Volume data
                if let Some(volume) = instrument.volume_24h {
                    volumes.push(volume);
                }
            }
        }
        
        // Sort and get top coins
        let mut top_base_coins: Vec<_> = base_coin_counts.into_iter().collect();
        top_base_coins.sort_by(|a, b| b.1.cmp(&a.1));
        top_base_coins.truncate(10);
        
        let mut top_quote_coins: Vec<_> = quote_coin_counts.into_iter().collect();
        top_quote_coins.sort_by(|a, b| b.1.cmp(&a.1));
        top_quote_coins.truncate(10);
        
        // Calculate volume statistics
        volumes.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
        
        let total_volume_24h = volumes.iter().sum();
        let average_volume_24h = if volumes.is_empty() { 0.0 } else { total_volume_24h / volumes.len() as f64 };
        let median_volume_24h = if volumes.is_empty() { 
            0.0 
        } else { 
            volumes[volumes.len() / 2] 
        };
        
        let high_volume_instruments = volumes.iter().filter(|&&v| v > 1_000_000.0).count();
        let medium_volume_instruments = volumes.iter().filter(|&&v| v >= 100_000.0 && v <= 1_000_000.0).count();
        let low_volume_instruments = volumes.iter().filter(|&&v| v < 100_000.0).count();
        
        DiscoveryStats {
            total_api_calls,
            discovery_time_seconds,
            instruments_by_status,
            top_base_coins,
            top_quote_coins,
            volume_stats: VolumeStats {
                total_volume_24h,
                average_volume_24h,
                median_volume_24h,
                high_volume_instruments,
                medium_volume_instruments,
                low_volume_instruments,
            },
        }
    }
}
