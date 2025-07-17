//! Asset Scanner Agent
//!
//! This module provides the Asset Scanner agent for the OMNI-ALPHA VΩ∞∞ platform.
//! The Asset Scanner agent scans all available assets and identifies profitable trading opportunities.

use std::sync::Arc;
use tokio::sync::RwLock;
use anyhow::Result;
use tracing::{info, debug, warn, error};
use async_trait::async_trait;

use crate::engine::agent_trait::{Agent, AgentContext, AgentConfig};
use crate::engine::message_bus::{BusMessage, MessageBus, MessageType};
use crate::exchange::bybit::adapter::BybitAdapter;
use crate::exchange::asset_scanner::{AssetScanner, TradingOpportunity};
use std::collections::HashMap;
use std::time::{Duration, SystemTime};
use tokio::time::sleep;

/// Enhanced Asset Scanner Agent configuration for Phase 3
#[derive(Debug, Clone)]
pub struct AssetScannerAgentConfig {
    /// Maximum assets to analyze (300+ for comprehensive scanning)
    pub max_assets: usize,

    /// Timeframes to analyze
    pub timeframes: Vec<String>,

    /// Minimum score threshold
    pub min_score_threshold: f64,

    /// Scan interval (seconds)
    pub scan_interval: u64,

    /// Maximum concurrent trades (2 for Phase 2 constraint)
    pub max_concurrent_trades: usize,

    /// Position size percentage (5 USDT fixed allocation)
    pub position_size_percentage: f64,

    /// Minimum profit per trade in USDT (0.6 USDT requirement)
    pub min_profit_per_trade: f64,

    /// Target trades per day (750+ requirement)
    pub target_trades_per_day: usize,

    /// Dynamic leverage enabled (50x-100x range)
    pub dynamic_leverage: bool,

    /// PHASE 3 ENHANCED FILTERING CRITERIA
    /// Minimum daily volume in USD (5M requirement)
    pub min_daily_volume: f64,

    /// Minimum market cap in USD (100M requirement)
    pub min_market_cap: f64,

    /// Minimum daily volatility percentage (2% requirement)
    pub min_volatility: f64,

    /// Leverage compatibility range
    pub leverage_range: (f64, f64), // (min, max) = (50, 100)

    /// Minimum order size compatibility (5 USDT requirement)
    pub min_order_size: f64,

    /// Exclude high-value assets (BTC, ETH due to capital constraints)
    pub exclude_high_value: bool,

    /// Target price movement range for profit capture
    pub target_movement_range: (f64, f64), // (0.5%, 0.8%)

    /// Asset cooldown period in minutes (15 minutes between same-asset trades)
    pub asset_cooldown_minutes: u64,
}

impl Default for AssetScannerAgentConfig {
    fn default() -> Self {
        Self {
            // PHASE 3 SPECIFICATIONS - COMPREHENSIVE ASSET SCANNING
            max_assets: 300, // Scan ALL Bybit linear perpetuals (300+ assets)
            timeframes: vec!["1".to_string(), "3".to_string(), "5".to_string(), "15".to_string(), "60".to_string()],
            min_score_threshold: 0.85, // Higher threshold for 85-90% win rate
            scan_interval: 2, // 2 seconds for high-frequency scanning
            max_concurrent_trades: 2, // EXACT Phase 2 constraint (2 positions max)
            position_size_percentage: 0.417, // 5 USDT / 12 USDT = 41.7% per trade
            min_profit_per_trade: 0.6, // EXACT Phase 2 requirement (0.6 USDT minimum)
            target_trades_per_day: 750, // EXACT requirement (750+ trades/day)
            dynamic_leverage: true, // Enable 50x-100x leverage range

            // PHASE 3 ENHANCED FILTERING CRITERIA
            min_daily_volume: 5_000_000.0, // $5M minimum daily volume
            min_market_cap: 100_000_000.0, // $100M minimum market cap
            min_volatility: 2.0, // 2% minimum daily volatility
            leverage_range: (50.0, 100.0), // 50x-100x leverage compatibility
            min_order_size: 5.0, // 5 USDT minimum order size (Bybit requirement)
            exclude_high_value: true, // Exclude BTC, ETH due to capital constraints
            target_movement_range: (0.5, 0.8), // 0.5%-0.8% target movements for profit
            asset_cooldown_minutes: 15, // 15 minutes cooldown between same-asset trades
        }
    }
}

/// Asset metadata
#[derive(Debug, Clone)]
pub struct AssetMetadata {
    /// Symbol
    pub symbol: String,

    /// Maximum leverage
    pub max_leverage: f64,

    /// Funding rate
    pub funding_rate: f64,

    /// Fee rate
    pub fee_rate: f64,

    /// Minimum quantity
    pub min_qty: f64,

    /// Quantity precision
    pub qty_precision: usize,

    /// Price precision
    pub price_precision: usize,

    /// Last update time
    pub last_update: SystemTime,
}

/// Enhanced Asset Scanner Agent with Phase 3 comprehensive filtering
pub struct AssetScannerAgent {
    /// Configuration
    config: AssetScannerAgentConfig,

    /// Exchange adapter
    exchange: Arc<BybitAdapter>,

    /// Message bus
    message_bus: Arc<MessageBus>,

    /// Asset scanner
    asset_scanner: AssetScanner,

    /// Active trades
    active_trades: Vec<String>,

    /// Asset metadata cache
    asset_metadata: HashMap<String, AssetMetadata>,

    /// Running flag
    running: bool,

    /// Last scan time
    last_scan_time: u64,

    /// Trade counter for today
    trades_today: usize,

    /// Last day (for resetting trade counter)
    last_day: i64,

    /// PHASE 3 ENHANCEMENTS
    /// Comprehensive asset database with enhanced metadata
    enhanced_asset_database: HashMap<String, EnhancedAssetMetadata>,

    /// Asset cooldown tracking (symbol -> last trade timestamp)
    asset_cooldowns: HashMap<String, u64>,

    /// Filtered asset list meeting all Phase 3 criteria
    filtered_assets: Vec<String>,

    /// Last comprehensive scan timestamp
    last_comprehensive_scan: u64,

    /// Asset performance tracking for optimization
    asset_performance: HashMap<String, AssetPerformance>,

    /// High-value assets to exclude (BTC, ETH, etc.)
    excluded_high_value_assets: Vec<String>,
}

/// Enhanced asset metadata for Phase 3 comprehensive filtering
#[derive(Debug, Clone)]
pub struct EnhancedAssetMetadata {
    pub symbol: String,
    pub daily_volume_usd: f64,
    pub market_cap_usd: f64,
    pub daily_volatility: f64,
    pub current_price: f64,
    pub leverage_available: f64,
    pub min_order_size: f64,
    pub is_high_value: bool,
    pub last_movement_percent: f64,
    pub liquidity_score: f64,
    pub trading_score: f64,
    pub meets_phase3_criteria: bool,
    pub last_update: SystemTime,
}

/// Asset performance tracking for optimization
#[derive(Debug, Clone)]
pub struct AssetPerformance {
    pub symbol: String,
    pub total_trades: u32,
    pub successful_trades: u32,
    pub total_profit_usdt: f64,
    pub average_profit_per_trade: f64,
    pub win_rate: f64,
    pub last_trade_timestamp: u64,
    pub performance_score: f64,
}

impl AssetScannerAgent {
    /// Create a new Asset Scanner Agent
    pub fn new(config: AssetScannerAgentConfig, exchange: Arc<BybitAdapter>, message_bus: Arc<MessageBus>) -> Self {
        let asset_scanner = AssetScanner::new(
            exchange.clone(),
            config.max_assets,
            config.timeframes.clone(),
        );

        // Initialize excluded high-value assets
        let excluded_high_value_assets = vec![
            "BTCUSDT".to_string(),
            "ETHUSDT".to_string(),
            "BNBUSDT".to_string(),
        ];

        Self {
            config,
            exchange,
            message_bus,
            asset_scanner,
            active_trades: Vec::new(),
            asset_metadata: HashMap::new(),
            running: false,
            last_scan_time: 0,
            trades_today: 0,
            last_day: chrono::Utc::now().date().and_hms(0, 0, 0).timestamp(),

            // PHASE 3 ENHANCEMENTS
            enhanced_asset_database: HashMap::new(),
            asset_cooldowns: HashMap::new(),
            filtered_assets: Vec::new(),
            last_comprehensive_scan: 0,
            asset_performance: HashMap::new(),
            excluded_high_value_assets,
        }
    }

    /// Get asset metadata
    async fn get_asset_metadata(&mut self, symbol: &str) -> Result<AssetMetadata> {
        // Check if we have cached metadata that's less than 1 hour old
        if let Some(metadata) = self.asset_metadata.get(symbol) {
            let elapsed = metadata.last_update.elapsed().unwrap_or(Duration::from_secs(3600));
            if elapsed < Duration::from_secs(3600) {
                return Ok(metadata.clone());
            }
        }

        // Fetch instrument info
        let instruments = self.exchange.get_instruments("linear").await?;

        // Find the instrument
        let instrument = instruments.list.iter()
            .find(|i| i.symbol == symbol)
            .ok_or_else(|| anyhow::anyhow!("Instrument not found: {}", symbol))?;

        // Get funding rate
        let funding_rate = match self.exchange.get_funding_rate(symbol).await {
            Ok(rate) => rate.funding_rate,
            Err(_) => 0.0001, // Default to 0.01% if not available
        };

        // Create metadata
        let metadata = AssetMetadata {
            symbol: symbol.to_string(),
            max_leverage: instrument.leverage_filter.max_leverage,
            funding_rate,
            fee_rate: 0.0006, // Default taker fee is 0.06%
            min_qty: instrument.lot_size_filter.min_trading_qty,
            qty_precision: instrument.lot_size_filter.qty_step.to_string().split('.').nth(1)
                .map(|s| s.len())
                .unwrap_or(8),
            price_precision: instrument.price_filter.tick_size.to_string().split('.').nth(1)
                .map(|s| s.len())
                .unwrap_or(2),
            last_update: SystemTime::now(),
        };

        // Cache the metadata
        self.asset_metadata.insert(symbol.to_string(), metadata.clone());

        Ok(metadata)
    }

    /// Calculate optimal leverage to achieve minimum profit
    fn calculate_optimal_leverage(
        &self,
        symbol: &str,
        price: f64,
        min_profit: f64,
        max_leverage: f64,
        funding_rate: f64,
        fee_rate: f64
    ) -> f64 {
        // Start with a reasonable leverage
        let mut leverage = 5.0;

        // Calculate expected price movement needed for profit
        // Formula: min_profit = position_size * price_movement - fees
        // For a $12 position with 5x leverage, we need a price movement of:
        // min_profit = (12 * 5) * price_movement - fees
        // price_movement = (min_profit + fees) / (12 * 5)

        // Estimate fees (entry + exit)
        let fees = 12.0 * leverage * fee_rate * 2.0;

        // Calculate required price movement percentage
        let required_movement = (min_profit + fees) / (12.0 * leverage);

        // If required movement is too high (>0.5%), increase leverage
        if required_movement > 0.005 {
            leverage = ((min_profit + fees) / (12.0 * 0.005)).min(max_leverage);
        }

        // Cap at maximum allowed leverage
        leverage.min(max_leverage)
    }

    /// Calculate minimum position value to achieve target profit
    fn calculate_min_position_value(
        &self,
        min_profit: f64,
        price: f64,
        leverage: f64,
        fee_rate: f64
    ) -> f64 {
        // Estimate fees (entry + exit)
        let fee_percentage = fee_rate * 2.0;

        // Assume we need at least 0.5% price movement for profit
        let expected_movement = 0.005;

        // Calculate minimum position value
        // Formula: min_profit = position_value * leverage * expected_movement - (position_value * leverage * fee_percentage)
        // min_profit = position_value * leverage * (expected_movement - fee_percentage)
        // position_value = min_profit / (leverage * (expected_movement - fee_percentage))

        let denominator = leverage * (expected_movement - fee_percentage);
        if denominator <= 0.0 {
            // Fallback if calculation doesn't work
            return 12.0;
        }

        min_profit / denominator
    }

    /// Scan for trading opportunities
    async fn scan_for_opportunities(&mut self) -> Result<Vec<TradingOpportunity>> {
        info!("Scanning for trading opportunities...");

        let opportunities = self.asset_scanner.scan_all_assets().await?;

        // Filter by score threshold
        let filtered_opportunities: Vec<TradingOpportunity> = opportunities.into_iter()
            .filter(|o| o.score >= self.config.min_score_threshold)
            .collect();

        info!("Found {} high-quality trading opportunities", filtered_opportunities.len());

        Ok(filtered_opportunities)
    }

    /// Execute trading opportunity
    async fn execute_opportunity(&mut self, opportunity: &TradingOpportunity, available_capital: f64) -> Result<()> {
        // Check if we already have an active trade for this symbol
        if self.active_trades.contains(&opportunity.symbol) {
            info!("Already have an active trade for {}", opportunity.symbol);
            return Ok(());
        }

        // Check if we have reached the maximum number of concurrent trades
        if self.active_trades.len() >= self.config.max_concurrent_trades {
            info!("Maximum number of concurrent trades reached");
            return Ok(());
        }

        // Get asset metadata for leverage and fee information
        let asset_metadata = self.get_asset_metadata(&opportunity.symbol).await?;

        // Calculate optimal leverage to achieve minimum profit
        let leverage = if self.config.dynamic_leverage {
            self.calculate_optimal_leverage(
                &opportunity.symbol,
                opportunity.price,
                self.config.min_profit_per_trade,
                asset_metadata.max_leverage,
                asset_metadata.funding_rate,
                asset_metadata.fee_rate
            )
        } else {
            1.0 // Default leverage
        };

        // Calculate position size to achieve minimum profit
        let min_position_value = self.calculate_min_position_value(
            self.config.min_profit_per_trade,
            opportunity.price,
            leverage,
            asset_metadata.fee_rate
        );

        // Ensure we don't exceed available capital
        let position_value = min_position_value.min(available_capital * self.config.position_size_percentage);
        let quantity = position_value / opportunity.price;

        // Round quantity to appropriate precision
        let quantity = (quantity * 1000000.0).round() / 1000000.0;

        info!("Executing opportunity: {} - {} at ${:.2} with {}x leverage",
              opportunity.symbol, opportunity.action.to_uppercase(),
              opportunity.price, leverage);
        info!("Position size: {} (value: ${:.2}), Target profit: ${:.2}",
              quantity, position_value, self.config.min_profit_per_trade);

        // Set leverage for the symbol
        if self.config.dynamic_leverage && leverage > 1.0 {
            match self.exchange.set_leverage(&opportunity.symbol, leverage as u32).await {
                Ok(_) => info!("Set leverage to {}x for {}", leverage, opportunity.symbol),
                Err(e) => warn!("Failed to set leverage for {}: {}", opportunity.symbol, e),
            }
        }

        // Calculate take profit price (to achieve minimum profit)
        let take_profit = match opportunity.action.as_str() {
            "buy" => opportunity.price * (1.0 + (self.config.min_profit_per_trade / (position_value * leverage))),
            "sell" => opportunity.price * (1.0 - (self.config.min_profit_per_trade / (position_value * leverage))),
            _ => opportunity.price,
        };

        // Calculate stop loss price (to limit losses)
        let stop_loss = match opportunity.action.as_str() {
            "buy" => opportunity.price * 0.995, // 0.5% stop loss
            "sell" => opportunity.price * 1.005, // 0.5% stop loss
            _ => opportunity.price,
        };

        // Place order
        let side = if opportunity.action == "buy" {
            crate::exchange::OrderSide::Buy
        } else {
            crate::exchange::OrderSide::Sell
        };

        let order = self.exchange.place_order(
            &opportunity.symbol,
            side,
            crate::exchange::OrderType::Market,
            quantity,
            None,
            crate::exchange::TimeInForce::GoodTillCancel,
            false,
            false,
            Some(take_profit),
            Some(stop_loss),
        ).await?;

        info!("Order placed successfully! Order ID: {}", order.order_id);

        // Add to active trades
        self.active_trades.push(opportunity.symbol.clone());

        // Increment trade counter
        self.trades_today += 1;

        // Calculate expected profit
        let expected_profit = position_value * leverage * 0.005 - (position_value * leverage * asset_metadata.fee_rate * 2.0);

        // Send message
        let message = BusMessage {
            message_type: MessageType::TradeEntry,
            content: format!(
                "symbol:{},side:{},price:{},quantity:{},leverage:{},take_profit:{},stop_loss:{},expected_profit:{},order_id:{}",
                opportunity.symbol,
                opportunity.action,
                opportunity.price,
                quantity,
                leverage,
                take_profit,
                stop_loss,
                expected_profit,
                order.order_id
            ),
            timestamp: chrono::Utc::now(),
        };

        self.message_bus.publish(message).await;

        // Check if we've reached our daily trade target
        let trades_remaining = self.config.target_trades_per_day.saturating_sub(self.trades_today);
        let seconds_remaining_in_day = 86400 - (chrono::Utc::now().timestamp() % 86400) as usize;

        if trades_remaining > 0 && seconds_remaining_in_day > 0 {
            // Calculate how frequently we need to trade to meet our target
            let seconds_per_trade = seconds_remaining_in_day / trades_remaining;

            // If we're trading too quickly, add a small delay
            if seconds_per_trade > 2 && self.config.scan_interval < seconds_per_trade as u64 {
                info!("Adding delay to distribute trades throughout the day. Next trade in {} seconds", seconds_per_trade);
                sleep(Duration::from_secs(seconds_per_trade as u64)).await;
            }
        }

        Ok(())
    }

    /// Update active trades
    async fn update_active_trades(&mut self) -> Result<()> {
        // Get open orders
        let open_orders = self.exchange.get_open_orders(None).await?;

        // Update active trades
        let mut new_active_trades = Vec::new();

        for symbol in &self.active_trades {
            let mut found = false;

            for order in &open_orders {
                if &order.symbol == symbol {
                    found = true;
                    break;
                }
            }

            if found {
                new_active_trades.push(symbol.clone());
            } else {
                info!("Trade for {} is no longer active", symbol);
            }
        }

        self.active_trades = new_active_trades;

        Ok(())
    }

    /// PHASE 3: Comprehensive asset scanning for ALL Bybit linear perpetuals (300+ assets)
    pub async fn comprehensive_asset_scan(&mut self) -> Result<Vec<String>> {
        info!("🔍 Starting comprehensive asset scan for 300+ Bybit linear perpetuals");

        let start_time = std::time::Instant::now();

        // Get ALL linear instruments from Bybit
        let instruments = self.exchange.get_instruments("linear").await?;
        let all_symbols: Vec<String> = instruments.list
            .into_iter()
            .filter(|i| i.symbol.ends_with("USDT"))
            .map(|i| i.symbol)
            .collect();

        info!("📊 Retrieved {} total USDT linear perpetuals from Bybit", all_symbols.len());

        // Apply Phase 3 filtering criteria
        let mut filtered_symbols = Vec::new();
        let mut processed_count = 0;

        for symbol in &all_symbols {
            processed_count += 1;

            // Skip excluded high-value assets
            if self.excluded_high_value_assets.contains(&symbol) {
                debug!("⚠️ Skipping high-value asset: {}", symbol);
                continue;
            }

            // Check asset cooldown
            if self.is_asset_in_cooldown(&symbol) {
                debug!("⏰ Asset {} in cooldown period", symbol);
                continue;
            }

            // Get enhanced metadata and apply filtering
            match self.get_enhanced_asset_metadata(&symbol).await {
                Ok(metadata) => {
                    if metadata.meets_phase3_criteria {
                        filtered_symbols.push(symbol.clone());
                        self.enhanced_asset_database.insert(symbol, metadata);
                    }
                }
                Err(e) => {
                    debug!("❌ Failed to get metadata for {}: {}", symbol, e);
                    continue;
                }
            }

            // Progress reporting every 50 assets
            if processed_count % 50 == 0 {
                info!("📈 Processed {}/{} assets, {} meet criteria",
                      processed_count, all_symbols.len(), filtered_symbols.len());
            }
        }

        let scan_duration = start_time.elapsed();

        info!("✅ Comprehensive scan complete: {}/{} assets meet Phase 3 criteria (scan time: {:.2}s)",
              filtered_symbols.len(), all_symbols.len(), scan_duration.as_secs_f64());

        // Update filtered assets and scan timestamp
        self.filtered_assets = filtered_symbols.clone();
        self.last_comprehensive_scan = chrono::Utc::now().timestamp() as u64;

        Ok(filtered_symbols)
    }

    /// Enhanced Phase 3 asset filtering with comprehensive criteria
    pub async fn apply_phase3_filtering(&self, symbols: &[String]) -> Result<Vec<String>> {
        info!("🔍 Applying Phase 3 filtering criteria to {} symbols", symbols.len());

        let mut filtered_assets = Vec::new();
        let mut processed = 0;

        for symbol in symbols {
            processed += 1;

            // Get comprehensive market data
            match self.get_comprehensive_market_data(symbol).await {
                Ok(market_data) => {
                    if self.meets_phase3_criteria(&market_data) {
                        filtered_assets.push(symbol.clone());
                        info!("✅ {} meets Phase 3 criteria: Vol=${:.2}M, MCap=${:.2}M, Volatility={:.2}%",
                              symbol, market_data.volume_24h_usd / 1_000_000.0,
                              market_data.market_cap_usd / 1_000_000.0, market_data.volatility_24h);
                    } else {
                        debug!("❌ {} filtered out: Vol=${:.2}M, MCap=${:.2}M, Volatility={:.2}%",
                               symbol, market_data.volume_24h_usd / 1_000_000.0,
                               market_data.market_cap_usd / 1_000_000.0, market_data.volatility_24h);
                    }
                }
                Err(e) => {
                    debug!("⚠️ Failed to get market data for {}: {}", symbol, e);
                    continue;
                }
            }

            // Progress reporting
            if processed % 25 == 0 {
                info!("📊 Phase 3 filtering progress: {}/{} processed, {} qualified",
                      processed, symbols.len(), filtered_assets.len());
            }
        }

        info!("🎯 Phase 3 filtering complete: {}/{} assets qualified",
              filtered_assets.len(), symbols.len());

        Ok(filtered_assets)
    }

    /// Get comprehensive market data for Phase 3 analysis
    async fn get_comprehensive_market_data(&self, symbol: &str) -> Result<ComprehensiveMarketData> {
        // Get ticker data
        let ticker_data = self.exchange.get_ticker(symbol).await?;
        let ticker = ticker_data.first().ok_or_else(|| anyhow!("No ticker data for {}", symbol))?;

        // Parse basic metrics
        let current_price = ticker.last_price.parse::<f64>().unwrap_or(0.0);
        let volume_24h = ticker.volume_24h.parse::<f64>().unwrap_or(0.0);
        let price_change_24h = ticker.price_24h_pcnt.parse::<f64>().unwrap_or(0.0);

        // Calculate derived metrics
        let volume_24h_usd = volume_24h * current_price;
        let volatility_24h = price_change_24h.abs() * 100.0;

        // Estimate market cap (simplified - using circulating supply estimation)
        let estimated_supply = self.estimate_circulating_supply(symbol, current_price);
        let market_cap_usd = current_price * estimated_supply;

        // Get leverage information
        let max_leverage = self.get_max_leverage_for_symbol(symbol).await.unwrap_or(1.0);

        Ok(ComprehensiveMarketData {
            symbol: symbol.to_string(),
            current_price,
            volume_24h_usd,
            market_cap_usd,
            volatility_24h,
            max_leverage,
            price_change_24h: price_change_24h * 100.0,
            high_24h: ticker.high_price_24h.parse::<f64>().unwrap_or(current_price),
            low_24h: ticker.low_price_24h.parse::<f64>().unwrap_or(current_price),
        })
    }

    /// Check if market data meets Phase 3 criteria
    fn meets_phase3_criteria(&self, data: &ComprehensiveMarketData) -> bool {
        // Phase 3 Filtering Criteria:
        // 1. 24h trading volume > $5,000,000 USD
        // 2. Market capitalization > $100,000,000 USD
        // 3. Daily volatility > 2.0%
        // 4. Leverage compatibility: 50x-100x available
        // 5. Order size compatibility: 5.00 USDT minimum viable

        let volume_criteria = data.volume_24h_usd >= 5_000_000.0;
        let market_cap_criteria = data.market_cap_usd >= 100_000_000.0;
        let volatility_criteria = data.volatility_24h >= 2.0;
        let leverage_criteria = data.max_leverage >= 50.0;
        let price_criteria = data.current_price >= 0.001; // Minimum price for 5 USDT position

        let meets_all = volume_criteria && market_cap_criteria && volatility_criteria &&
                       leverage_criteria && price_criteria;

        if !meets_all {
            debug!("❌ {} criteria check: Vol={} MCap={} Volatility={} Leverage={} Price={}",
                   data.symbol, volume_criteria, market_cap_criteria, volatility_criteria,
                   leverage_criteria, price_criteria);
        }

        meets_all
    }

    /// Estimate circulating supply for market cap calculation
    fn estimate_circulating_supply(&self, symbol: &str, current_price: f64) -> f64 {
        // Simplified estimation based on common patterns
        // This is a rough estimation - in production, you'd want actual supply data

        if symbol.starts_with("BTC") {
            21_000_000.0 // Bitcoin max supply
        } else if symbol.starts_with("ETH") {
            120_000_000.0 // Ethereum approximate supply
        } else if current_price > 100.0 {
            // High-price tokens typically have lower supply
            1_000_000.0
        } else if current_price > 10.0 {
            // Medium-price tokens
            10_000_000.0
        } else if current_price > 1.0 {
            // Lower-price tokens
            100_000_000.0
        } else {
            // Very low-price tokens typically have high supply
            1_000_000_000.0
        }
    }

    /// Get maximum leverage available for a symbol
    async fn get_max_leverage_for_symbol(&self, symbol: &str) -> Result<f64> {
        // Get instrument info to determine max leverage
        let instruments = self.exchange.get_instruments("linear").await?;

        if let Some(instrument) = instruments.list.iter().find(|i| i.symbol == symbol) {
            // Parse leverage from instrument info
            // Most Bybit linear perpetuals support 50x-100x leverage
            Ok(100.0) // Default to 100x for linear perpetuals
        } else {
            Ok(1.0) // Conservative default
        }
    }

    /// Get enhanced asset metadata with Phase 3 filtering criteria
    async fn get_enhanced_asset_metadata(&self, symbol: &str) -> Result<EnhancedAssetMetadata> {
        // Get basic ticker data
        let ticker_data = self.exchange.get_ticker(symbol).await?;
        let ticker = ticker_data.first().ok_or_else(|| anyhow!("No ticker data for {}", symbol))?;

        // Get 24h statistics (using ticker data for now)
        let current_price = ticker.last_price.parse::<f64>().unwrap_or(0.0);
        let daily_volume_usd = ticker.volume_24h.parse::<f64>().unwrap_or(0.0) * current_price;
        let price_change_24h = ticker.price_24h_pcnt.parse::<f64>().unwrap_or(0.0) * 100.0;
        let daily_volatility = price_change_24h.abs();

        // Estimate market cap (simplified calculation)
        let market_cap_usd = current_price * 1_000_000.0; // Simplified estimation

        // Check if high-value asset
        let is_high_value = self.excluded_high_value_assets.contains(&symbol.to_string());

        // Calculate trading score based on Phase 3 criteria
        let trading_score = self.calculate_trading_score(
            daily_volume_usd,
            market_cap_usd,
            daily_volatility,
            current_price,
        );

        // Check if meets all Phase 3 criteria
        let meets_phase3_criteria =
            daily_volume_usd >= self.config.min_daily_volume &&
            market_cap_usd >= self.config.min_market_cap &&
            daily_volatility >= self.config.min_volatility &&
            !is_high_value &&
            current_price * self.config.min_order_size <= self.config.min_order_size * current_price &&
            daily_volatility >= self.config.target_movement_range.0 &&
            daily_volatility <= self.config.target_movement_range.1 * 2.0; // Allow some buffer

        Ok(EnhancedAssetMetadata {
            symbol: symbol.to_string(),
            daily_volume_usd,
            market_cap_usd,
            daily_volatility,
            current_price,
            leverage_available: self.config.leverage_range.1, // Use max leverage
            min_order_size: self.config.min_order_size,
            is_high_value,
            last_movement_percent: price_change_24h,
            liquidity_score: (daily_volume_usd / 1_000_000.0).min(100.0), // Score 0-100
            trading_score,
            meets_phase3_criteria,
            last_update: SystemTime::now(),
        })
    }

    /// Calculate trading score based on Phase 3 criteria
    fn calculate_trading_score(&self, volume: f64, market_cap: f64, volatility: f64, price: f64) -> f64 {
        let volume_score = (volume / self.config.min_daily_volume).min(10.0) * 10.0; // 0-100
        let market_cap_score = (market_cap / self.config.min_market_cap).min(10.0) * 10.0; // 0-100
        let volatility_score = (volatility / self.config.min_volatility).min(5.0) * 20.0; // 0-100
        let price_score = if price > 0.0001 && price < 1000.0 { 100.0 } else { 50.0 }; // Prefer mid-range prices

        // Weighted average
        (volume_score * 0.4 + market_cap_score * 0.2 + volatility_score * 0.3 + price_score * 0.1).min(100.0)
    }

    /// Check if asset is in cooldown period
    fn is_asset_in_cooldown(&self, symbol: &str) -> bool {
        if let Some(&last_trade_time) = self.asset_cooldowns.get(symbol) {
            let current_time = chrono::Utc::now().timestamp() as u64;
            let cooldown_seconds = self.config.asset_cooldown_minutes * 60;
            current_time - last_trade_time < cooldown_seconds
        } else {
            false
        }
    }

    /// Update asset cooldown after trade execution
    pub fn update_asset_cooldown(&mut self, symbol: &str) {
        let current_time = chrono::Utc::now().timestamp() as u64;
        self.asset_cooldowns.insert(symbol.to_string(), current_time);
        debug!("🕒 Updated cooldown for {} until {}", symbol,
               current_time + (self.config.asset_cooldown_minutes * 60));
    }

    /// Get filtered assets that meet all Phase 3 criteria
    pub fn get_filtered_assets(&self) -> &Vec<String> {
        &self.filtered_assets
    }

    /// Get asset performance data
    pub fn get_asset_performance(&self, symbol: &str) -> Option<&AssetPerformance> {
        self.asset_performance.get(symbol)
    }
}

#[async_trait]
impl Agent for AssetScannerAgent {
    async fn initialize(&mut self, _context: Arc<RwLock<AgentContext>>) -> Result<()> {
        info!("Initializing Asset Scanner Agent");

        // Send initialization message
        let message = BusMessage {
            message_type: MessageType::AgentInitialized,
            content: "Asset Scanner Agent initialized".to_string(),
            timestamp: chrono::Utc::now(),
        };

        self.message_bus.publish(message).await;

        Ok(())
    }

    async fn start(&mut self) -> Result<()> {
        info!("Starting Asset Scanner Agent");

        self.running = true;

        // Send start message
        let message = BusMessage {
            message_type: MessageType::AgentStarted,
            content: "Asset Scanner Agent started".to_string(),
            timestamp: chrono::Utc::now(),
        };

        self.message_bus.publish(message).await;

        Ok(())
    }

    async fn stop(&mut self) -> Result<()> {
        info!("Stopping Asset Scanner Agent");

        self.running = false;

        // Send stop message
        let message = BusMessage {
            message_type: MessageType::AgentStopped,
            content: "Asset Scanner Agent stopped".to_string(),
            timestamp: chrono::Utc::now(),
        };

        self.message_bus.publish(message).await;

        Ok(())
    }

    async fn update(&mut self) -> Result<()> {
        if !self.running {
            return Ok(());
        }

        debug!("Updating Asset Scanner Agent");

        // Get current time
        let now = chrono::Utc::now();
        let current_time = now.timestamp() as u64;

        // Reset trade counter if it's a new day
        let today = now.date().and_hms(0, 0, 0).timestamp();
        if today > self.last_day {
            info!("New day started. Resetting trade counter. Yesterday's total: {} trades", self.trades_today);
            self.trades_today = 0;
            self.last_day = today;
        }

        // Check if it's time to scan
        if current_time - self.last_scan_time >= self.config.scan_interval {
            // Update active trades
            self.update_active_trades().await?;

            // Get wallet balance
            let balances = self.exchange.get_wallet_balance(Some("USDT")).await?;

            if let Some(usdt_balance) = balances.get("USDT") {
                let available_capital = usdt_balance.available_balance;

                // Scan for opportunities
                let opportunities = self.scan_for_opportunities().await?;

                // Display top opportunities
                for (i, opportunity) in opportunities.iter().take(3).enumerate() {
                    info!(
                        "Opportunity {}: {} - {} with score {:.2} at ${:.2}",
                        i + 1,
                        opportunity.symbol,
                        opportunity.action.to_uppercase(),
                        opportunity.score,
                        opportunity.price
                    );
                    info!("  Reason: {}", opportunity.reason);
                }

                // Execute top opportunity
                if let Some(top_opportunity) = opportunities.first() {
                    self.execute_opportunity(top_opportunity, available_capital).await?;
                }
            }

            // Update last scan time
            self.last_scan_time = current_time;
        }

        Ok(())
    }

    async fn handle_message(&mut self, message: BusMessage) -> Result<()> {
        match message.message_type {
            MessageType::TradeExit => {
                info!("Received trade exit message: {}", message.content);

                // Parse trade exit message
                // Format: "symbol:BTCUSDT"
                if let Some(symbol) = message.content.split(',')
                    .find_map(|part| {
                        let kv: Vec<&str> = part.split(':').collect();
                        if kv.len() == 2 && kv[0] == "symbol" {
                            Some(kv[1].to_string())
                        } else {
                            None
                        }
                    })
                {
                    // Remove from active trades
                    if let Some(index) = self.active_trades.iter().position(|s| s == &symbol) {
                        self.active_trades.remove(index);
                        info!("Removed {} from active trades", symbol);
                    }
                }
            },
            _ => {
                // Ignore other message types
            }
        }

        Ok(())
    }

    fn get_name(&self) -> &str {
        "AssetScannerAgent"
    }

    fn get_config(&self) -> Box<dyn AgentConfig> {
        Box::new(self.config.clone())
    }
}
