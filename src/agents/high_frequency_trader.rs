//! High Frequency Trader Agent
//!
//! This module provides the High Frequency Trader agent for the OMNI-ALPHA VΩ∞∞ platform.
//! The High Frequency Trader agent executes trades at high frequency to achieve the target
//! of 750 profitable trades per day.

use std::sync::Arc;
use std::collections::HashMap;
use std::time::{Duration, SystemTime};
use tokio::sync::RwLock;
use tokio::time::sleep;
use anyhow::Result;
use tracing::{info, debug, warn, error};
use async_trait::async_trait;
use chrono::Utc;
use uuid::Uuid;

use crate::engine::agent_trait::{Agent, AgentContext, AgentConfig};
use crate::engine::message_bus::{BusMessage, MessageBus, MessageType, TradeDirection};
use crate::exchange::bybit::adapter::BybitAdapter;
use crate::exchange::bybit::types::{OrderSide, OrderType, TimeInForce};
use crate::exchange::asset_scanner::{AssetScanner, TradingOpportunity};
use crate::agents::main_strategy_controller::{TradingCommand, CommandType, ExecutionResponse};
use crate::agents::trade_executor::ExecutionStatus;

/// High Frequency Trader Agent configuration
#[derive(Debug, Clone)]
pub struct HighFrequencyTraderConfig {
    /// Initial capital
    pub initial_capital: f64,

    /// Target trades per day
    pub target_trades_per_day: usize,

    /// Minimum profit per trade in USDT
    pub min_profit_per_trade: f64,

    /// Maximum concurrent trades
    pub max_concurrent_trades: usize,

    /// Timeframes to analyze
    pub timeframes: Vec<String>,

    /// Maximum assets to analyze
    pub max_assets: usize,

    /// Dynamic leverage enabled
    pub dynamic_leverage: bool,

    /// Trade interval in milliseconds
    pub trade_interval_ms: u64,
}

impl Default for HighFrequencyTraderConfig {
    fn default() -> Self {
        Self {
            initial_capital: 12.0,
            target_trades_per_day: 750,
            min_profit_per_trade: 2.0,
            max_concurrent_trades: 10,
            timeframes: vec!["1".to_string(), "3".to_string(), "5".to_string()],
            max_assets: 100,
            dynamic_leverage: true,
            trade_interval_ms: 115200, // 86400000 ms in a day / 750 trades = 115200 ms per trade
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

/// Trade record
#[derive(Debug, Clone)]
pub struct TradeRecord {
    /// Symbol
    pub symbol: String,

    /// Order ID
    pub order_id: String,

    /// Side
    pub side: OrderSide,

    /// Entry price
    pub entry_price: f64,

    /// Quantity
    pub quantity: f64,

    /// Leverage
    pub leverage: f64,

    /// Take profit price
    pub take_profit: f64,

    /// Stop loss price
    pub stop_loss: f64,

    /// Entry time
    pub entry_time: chrono::DateTime<Utc>,

    /// Exit time
    pub exit_time: Option<chrono::DateTime<Utc>>,

    /// Exit price
    pub exit_price: Option<f64>,

    /// Profit/loss
    pub pnl: Option<f64>,
}

/// High Frequency Trader Agent
pub struct HighFrequencyTrader {
    /// Configuration
    config: HighFrequencyTraderConfig,

    /// Exchange adapter
    exchange: Arc<BybitAdapter>,

    /// Message bus
    message_bus: Arc<MessageBus>,

    /// Asset scanner
    asset_scanner: AssetScanner,

    /// Active trades
    active_trades: HashMap<String, TradeRecord>,

    /// Asset metadata cache
    asset_metadata: HashMap<String, AssetMetadata>,

    /// Running flag
    running: bool,

    /// Last trade time
    last_trade_time: u64,

    /// Trade counter for today
    trades_today: usize,

    /// Last day (for resetting trade counter)
    last_day: i64,

    /// Current capital
    current_capital: f64,

    /// Total profit
    total_profit: f64,
}

impl HighFrequencyTrader {
    /// Create a new High Frequency Trader Agent
    pub fn new(config: HighFrequencyTraderConfig, exchange: Arc<BybitAdapter>, message_bus: Arc<MessageBus>) -> Self {
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
            active_trades: HashMap::new(),
            asset_metadata: HashMap::new(),
            running: false,
            last_trade_time: 0,
            trades_today: 0,
            last_day: chrono::Utc::now().date().and_hms(0, 0, 0).timestamp(),
            current_capital: 12.0,
            total_profit: 0.0,
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
        debug!("Scanning for trading opportunities...");

        let opportunities = self.asset_scanner.scan_all_assets().await?;

        // Filter by score threshold
        let filtered_opportunities: Vec<TradingOpportunity> = opportunities.into_iter()
            .filter(|o| o.score >= 0.8)
            .collect();

        debug!("Found {} high-quality trading opportunities", filtered_opportunities.len());

        Ok(filtered_opportunities)
    }

    /// Execute trading opportunity
    async fn execute_opportunity(&mut self, opportunity: &TradingOpportunity, available_capital: f64) -> Result<()> {
        // Check if we already have an active trade for this symbol
        if self.active_trades.contains_key(&opportunity.symbol) {
            debug!("Already have an active trade for {}", opportunity.symbol);
            return Ok(());
        }

        // Check if we have reached the maximum number of concurrent trades
        if self.active_trades.len() >= self.config.max_concurrent_trades {
            debug!("Maximum number of concurrent trades reached");
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
        let position_value = min_position_value.min(available_capital * 0.9);
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
            OrderSide::Buy
        } else {
            OrderSide::Sell
        };

        let order = self.exchange.place_order(
            &opportunity.symbol,
            side,
            OrderType::Market,
            quantity,
            None,
            TimeInForce::GoodTillCancel,
            false,
            false,
            Some(take_profit),
            Some(stop_loss),
        ).await?;

        info!("Order placed successfully! Order ID: {}", order.order_id);

        // Create trade record
        let trade_record = TradeRecord {
            symbol: opportunity.symbol.clone(),
            order_id: order.order_id.clone(),
            side,
            entry_price: opportunity.price,
            quantity,
            leverage,
            take_profit,
            stop_loss,
            entry_time: Utc::now(),
            exit_time: None,
            exit_price: None,
            pnl: None,
        };

        // Add to active trades
        self.active_trades.insert(opportunity.symbol.clone(), trade_record);

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
            timestamp: Utc::now(),
        };

        self.message_bus.publish(message).await;

        // Check if we've reached our daily trade target
        let trades_remaining = self.config.target_trades_per_day.saturating_sub(self.trades_today);
        let seconds_remaining_in_day = 86400 - (Utc::now().timestamp() % 86400) as usize;

        if trades_remaining > 0 && seconds_remaining_in_day > 0 {
            // Calculate how frequently we need to trade to meet our target
            let seconds_per_trade = seconds_remaining_in_day / trades_remaining;

            // If we're trading too quickly, add a small delay
            if seconds_per_trade > 2 && self.config.trade_interval_ms < (seconds_per_trade * 1000) as u64 {
                info!("Adding delay to distribute trades throughout the day. Next trade in {} seconds", seconds_per_trade);
                sleep(Duration::from_secs(seconds_per_trade as u64)).await;
            }
        }

        Ok(())
    }

    /// Update active trades
    async fn update_active_trades(&mut self) -> Result<()> {
        // Get positions
        let positions = self.exchange.get_positions(None).await?;

        // Update active trades
        let mut closed_trades = Vec::new();

        for (symbol, trade) in &mut self.active_trades {
            // Check if position is still open
            let position = positions.iter().find(|p| &p.symbol == symbol);

            if let Some(position) = position {
                // Position is still open, update PnL
                let unrealized_pnl = position.unrealised_pnl;

                // Check if take profit or stop loss has been hit
                if position.size == 0.0 {
                    // Position has been closed
                    closed_trades.push(symbol.clone());

                    // Calculate PnL
                    let exit_price = match trade.side {
                        OrderSide::Buy => trade.take_profit,
                        OrderSide::Sell => trade.stop_loss,
                    };

                    let pnl = match trade.side {
                        OrderSide::Buy => (exit_price - trade.entry_price) * trade.quantity * trade.leverage,
                        OrderSide::Sell => (trade.entry_price - exit_price) * trade.quantity * trade.leverage,
                    };

                    // Update trade record
                    trade.exit_time = Some(Utc::now());
                    trade.exit_price = Some(exit_price);
                    trade.pnl = Some(pnl);

                    // Update capital and profit
                    self.current_capital += pnl;
                    self.total_profit += pnl;

                    info!("Trade closed for {}: PnL=${:.2}", symbol, pnl);

                    // Send message
                    let message = BusMessage {
                        message_type: MessageType::TradeExit,
                        content: format!(
                            "symbol:{},exit_price:{},pnl:{},total_profit:{}",
                            symbol,
                            exit_price,
                            pnl,
                            self.total_profit
                        ),
                        timestamp: Utc::now(),
                    };

                    self.message_bus.publish(message).await;
                }
            } else {
                // Position not found, assume it's closed
                closed_trades.push(symbol.clone());

                // Send message
                let message = BusMessage {
                    message_type: MessageType::TradeExit,
                    content: format!("symbol:{}", symbol),
                    timestamp: Utc::now(),
                };

                self.message_bus.publish(message).await;
            }
        }

        // Remove closed trades
        for symbol in closed_trades {
            self.active_trades.remove(&symbol);
            info!("Removed {} from active trades", symbol);
        }

        Ok(())
    }

    /// Handle trading command from main strategy controller
    async fn handle_trading_command(&mut self, command: TradingCommand) -> Result<()> {
        info!("🎯 Executing trading command: {} for {} - {} {:?}",
              command.id, command.symbol, command.direction, command.command_type);

        let response = match command.command_type {
            CommandType::ExecuteTrade => {
                self.execute_trade_command(&command).await
            },
            CommandType::ClosePosition => {
                self.close_position_command(&command).await
            },
            CommandType::MonitorEntry => {
                // For now, treat monitor as immediate execution
                self.execute_trade_command(&command).await
            },
            CommandType::UpdateStopLoss => {
                self.update_stop_loss_command(&command).await
            },
            CommandType::UpdateTakeProfit => {
                self.update_take_profit_command(&command).await
            },
            CommandType::CancelOrder => {
                self.cancel_order_command(&command).await
            },
            CommandType::EmergencyStop => {
                self.emergency_stop_command().await
            },
        };

        // Send response back to main strategy controller
        self.send_execution_response(command.id, response).await?;

        Ok(())
    }

    /// Execute a trade command
    async fn execute_trade_command(&mut self, command: &TradingCommand) -> Result<String> {
        // Check if we already have a position for this symbol
        if self.active_trades.contains_key(&command.symbol) {
            return Err(anyhow::anyhow!("Already have active position for {}", command.symbol));
        }

        // Check if we have reached max concurrent trades
        if self.active_trades.len() >= self.config.max_concurrent_trades {
            return Err(anyhow::anyhow!("Maximum concurrent trades reached"));
        }

        // Convert direction to OrderSide
        let side = match command.direction {
            TradeDirection::Long => OrderSide::Buy,
            TradeDirection::Short => OrderSide::Sell,
        };

        // Calculate quantity based on position size and leverage
        let quantity = (command.position_size * command.leverage) / command.entry_price;

        // Place the order
        let order_result = self.exchange.place_order(
            &command.symbol,
            side,
            OrderType::Market,
            quantity,
            None, // Market order, no price needed
            TimeInForce::IOC,
            Some(command.leverage),
            Some(command.stop_loss),
            Some(command.take_profit),
        ).await?;

        // Create trade record
        let trade_record = TradeRecord {
            symbol: command.symbol.clone(),
            order_id: order_result.order_id.clone(),
            side,
            entry_price: command.entry_price,
            quantity,
            leverage: command.leverage,
            take_profit: command.take_profit,
            stop_loss: command.stop_loss,
            entry_time: Utc::now(),
            exit_time: None,
            exit_price: None,
            pnl: None,
        };

        // Add to active trades
        self.active_trades.insert(command.symbol.clone(), trade_record);

        // Update trade counter
        self.trades_today += 1;

        info!("✅ Trade executed: {} {} {} @ {:.4} (Leverage: {}x, Order: {})",
              command.symbol, side, quantity, command.entry_price, command.leverage, order_result.order_id);

        Ok(order_result.order_id)
    }

    /// Close a position command
    async fn close_position_command(&mut self, command: &TradingCommand) -> Result<String> {
        if let Some(trade_record) = self.active_trades.get(&command.symbol) {
            // Close the position by placing opposite order
            let close_side = match trade_record.side {
                OrderSide::Buy => OrderSide::Sell,
                OrderSide::Sell => OrderSide::Buy,
            };

            let close_result = self.exchange.place_order(
                &command.symbol,
                close_side,
                OrderType::Market,
                trade_record.quantity,
                None,
                TimeInForce::IOC,
                None, // No leverage for closing
                None, // No stop loss for closing
                None, // No take profit for closing
            ).await?;

            // Remove from active trades
            self.active_trades.remove(&command.symbol);

            info!("✅ Position closed: {} (Order: {})", command.symbol, close_result.order_id);

            Ok(close_result.order_id)
        } else {
            Err(anyhow::anyhow!("No active position found for {}", command.symbol))
        }
    }

    /// Update stop loss command
    async fn update_stop_loss_command(&mut self, command: &TradingCommand) -> Result<String> {
        if let Some(trade_record) = self.active_trades.get_mut(&command.symbol) {
            trade_record.stop_loss = command.stop_loss;
            info!("✅ Stop loss updated for {}: {:.4}", command.symbol, command.stop_loss);
            Ok("stop_loss_updated".to_string())
        } else {
            Err(anyhow::anyhow!("No active position found for {}", command.symbol))
        }
    }

    /// Update take profit command
    async fn update_take_profit_command(&mut self, command: &TradingCommand) -> Result<String> {
        if let Some(trade_record) = self.active_trades.get_mut(&command.symbol) {
            trade_record.take_profit = command.take_profit;
            info!("✅ Take profit updated for {}: {:.4}", command.symbol, command.take_profit);
            Ok("take_profit_updated".to_string())
        } else {
            Err(anyhow::anyhow!("No active position found for {}", command.symbol))
        }
    }

    /// Cancel order command
    async fn cancel_order_command(&mut self, command: &TradingCommand) -> Result<String> {
        if let Some(trade_record) = self.active_trades.get(&command.symbol) {
            // Cancel the order
            self.exchange.cancel_order(&command.symbol, &trade_record.order_id).await?;

            // Remove from active trades
            self.active_trades.remove(&command.symbol);

            info!("✅ Order cancelled: {} (Order: {})", command.symbol, trade_record.order_id);
            Ok("order_cancelled".to_string())
        } else {
            Err(anyhow::anyhow!("No active position found for {}", command.symbol))
        }
    }

    /// Emergency stop command
    async fn emergency_stop_command(&mut self) -> Result<String> {
        info!("🚨 EMERGENCY STOP - Closing all positions");

        let mut closed_count = 0;
        let symbols: Vec<String> = self.active_trades.keys().cloned().collect();

        for symbol in symbols {
            if let Some(trade_record) = self.active_trades.get(&symbol) {
                let close_side = match trade_record.side {
                    OrderSide::Buy => OrderSide::Sell,
                    OrderSide::Sell => OrderSide::Buy,
                };

                if let Ok(_) = self.exchange.place_order(
                    &symbol,
                    close_side,
                    OrderType::Market,
                    trade_record.quantity,
                    None,
                    TimeInForce::IOC,
                    None,
                    None,
                    None,
                ).await {
                    self.active_trades.remove(&symbol);
                    closed_count += 1;
                    info!("✅ Emergency closed: {}", symbol);
                }
            }
        }

        // Stop the trader
        self.running = false;

        info!("🚨 Emergency stop completed. Closed {} positions", closed_count);
        Ok(format!("emergency_stop_completed_{}_positions", closed_count))
    }

    /// Handle cancel command
    async fn handle_cancel_command(&mut self, command_id: &str) -> Result<()> {
        info!("🚫 Handling cancel command: {}", command_id);
        // For now, just log the cancel command
        // In a more sophisticated implementation, we would track pending commands
        Ok(())
    }

    /// Send execution response back to main strategy controller
    async fn send_execution_response(&self, command_id: String, result: Result<String>) -> Result<()> {
        let response = match result {
            Ok(order_id) => ExecutionResponse {
                command_id,
                status: ExecutionStatus::Completed,
                order_id: Some(order_id),
                pnl: None, // PnL will be calculated when position is closed
                error_message: None,
                timestamp: Utc::now(),
            },
            Err(e) => ExecutionResponse {
                command_id,
                status: ExecutionStatus::Failed(e.to_string()),
                order_id: None,
                pnl: None,
                error_message: Some(e.to_string()),
                timestamp: Utc::now(),
            },
        };

        // Send response via message bus
        let message = BusMessage {
            id: Uuid::new_v4().to_string(),
            message_type: MessageType::ExecutionResponse,
            source: "high_frequency_trader".to_string(),
            target: "main_strategy_controller".to_string(),
            data: serde_json::to_value(&response)?,
            timestamp: Utc::now(),
        };

        self.message_bus.send(message);

        Ok(())
    }
}

#[async_trait]
impl Agent for HighFrequencyTrader {
    async fn initialize(&mut self, _context: Arc<RwLock<AgentContext>>) -> Result<()> {
        info!("Initializing High Frequency Trader Agent");

        // Send initialization message
        let message = BusMessage {
            message_type: MessageType::AgentInitialized,
            content: "High Frequency Trader Agent initialized".to_string(),
            timestamp: Utc::now(),
        };

        self.message_bus.publish(message).await;

        Ok(())
    }

    async fn start(&mut self) -> Result<()> {
        info!("Starting High Frequency Trader Agent");

        self.running = true;

        // Send start message
        let message = BusMessage {
            message_type: MessageType::AgentStarted,
            content: "High Frequency Trader Agent started".to_string(),
            timestamp: Utc::now(),
        };

        self.message_bus.publish(message).await;

        Ok(())
    }

    async fn stop(&mut self) -> Result<()> {
        info!("Stopping High Frequency Trader Agent");

        self.running = false;

        // Send stop message
        let message = BusMessage {
            message_type: MessageType::AgentStopped,
            content: "High Frequency Trader Agent stopped".to_string(),
            timestamp: Utc::now(),
        };

        self.message_bus.publish(message).await;

        Ok(())
    }

    async fn update(&mut self) -> Result<()> {
        if !self.running {
            return Ok(());
        }

        debug!("Updating High Frequency Trader Agent");

        // Get current time
        let now = Utc::now();
        let current_time = now.timestamp() as u64;

        // Reset trade counter if it's a new day
        let today = now.date().and_hms(0, 0, 0).timestamp();
        if today > self.last_day {
            info!("New day started. Resetting trade counter. Yesterday's total: {} trades", self.trades_today);
            self.trades_today = 0;
            self.last_day = today;
        }

        // Check if it's time to trade
        if current_time - self.last_trade_time >= self.config.trade_interval_ms / 1000 {
            // Update active trades
            self.update_active_trades().await?;

            // Get wallet balance
            let balances = self.exchange.get_wallet_balance(Some("USDT")).await?;

            if let Some(usdt_balance) = balances.get("USDT") {
                let available_capital = usdt_balance.available_balance;

                // Update current capital
                self.current_capital = available_capital;

                // Scan for opportunities
                let opportunities = self.scan_for_opportunities().await?;

                // Display top opportunities
                for (i, opportunity) in opportunities.iter().take(3).enumerate() {
                    debug!(
                        "Opportunity {}: {} - {} with score {:.2} at ${:.2}",
                        i + 1,
                        opportunity.symbol,
                        opportunity.action.to_uppercase(),
                        opportunity.score,
                        opportunity.price
                    );
                    debug!("  Reason: {}", opportunity.reason);
                }

                // Execute top opportunity
                if let Some(top_opportunity) = opportunities.first() {
                    self.execute_opportunity(top_opportunity, available_capital).await?;
                }
            }

            // Update last trade time
            self.last_trade_time = current_time;

            // Display trading statistics
            info!("Trading statistics:");
            info!("  Current capital: ${:.2}", self.current_capital);
            info!("  Total profit: ${:.2}", self.total_profit);
            info!("  Trades today: {}/{}", self.trades_today, self.config.target_trades_per_day);
            info!("  Active trades: {}/{}", self.active_trades.len(), self.config.max_concurrent_trades);
        }

        Ok(())
    }

    async fn handle_message(&mut self, message: BusMessage) -> Result<()> {
        match message.message_type {
            MessageType::TradingCommand => {
                info!("📥 Received trading command from main strategy controller");

                // Parse trading command
                if let Ok(command) = serde_json::from_value::<TradingCommand>(message.data) {
                    self.handle_trading_command(command).await?;
                } else {
                    warn!("⚠️ Failed to parse trading command");
                }
            },
            MessageType::CancelCommand => {
                info!("📥 Received cancel command");

                // Parse command ID to cancel
                if let Ok(command_id) = serde_json::from_value::<String>(message.data) {
                    self.handle_cancel_command(&command_id).await?;
                } else {
                    warn!("⚠️ Failed to parse cancel command");
                }
            },
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
                    if self.active_trades.remove(&symbol).is_some() {
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
        "HighFrequencyTrader"
    }

    fn get_config(&self) -> Box<dyn AgentConfig> {
        Box::new(self.config.clone())
    }
}
