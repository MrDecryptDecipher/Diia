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

/// Asset Scanner Agent configuration
#[derive(Debug, Clone)]
pub struct AssetScannerAgentConfig {
    /// Maximum assets to analyze
    pub max_assets: usize,

    /// Timeframes to analyze
    pub timeframes: Vec<String>,

    /// Minimum score threshold
    pub min_score_threshold: f64,

    /// Scan interval (seconds)
    pub scan_interval: u64,

    /// Maximum concurrent trades
    pub max_concurrent_trades: usize,

    /// Position size percentage
    pub position_size_percentage: f64,

    /// Minimum profit per trade in USDT
    pub min_profit_per_trade: f64,

    /// Target trades per day
    pub target_trades_per_day: usize,

    /// Dynamic leverage enabled
    pub dynamic_leverage: bool,
}

impl Default for AssetScannerAgentConfig {
    fn default() -> Self {
        Self {
            max_assets: 100,
            timeframes: vec!["1".to_string(), "3".to_string(), "5".to_string(), "15".to_string(), "60".to_string()],
            min_score_threshold: 0.8, // Higher threshold for better quality trades
            scan_interval: 2, // 2 seconds for high-frequency trading
            max_concurrent_trades: 10, // More concurrent trades to achieve target
            position_size_percentage: 0.1, // 10% of capital per trade
            min_profit_per_trade: 2.0, // Minimum 2 USDT profit per trade
            target_trades_per_day: 750, // Target 750 trades per day
            dynamic_leverage: true, // Enable dynamic leverage
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

/// Asset Scanner Agent
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
}

impl AssetScannerAgent {
    /// Create a new Asset Scanner Agent
    pub fn new(config: AssetScannerAgentConfig, exchange: Arc<BybitAdapter>, message_bus: Arc<MessageBus>) -> Self {
        let asset_scanner = AssetScanner::new(
            exchange.clone(),
            config.max_assets,
            config.timeframes.clone(),
        );

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
    async fn scan_for_opportunities(&self) -> Result<Vec<TradingOpportunity>> {
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
