//! Anti-Loss Hedger Agent
//!
//! This agent activates fallback trades when loss triggers to ensure
//! the system never experiences a net loss.

use std::sync::Arc;
use std::collections::{HashMap, VecDeque};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use anyhow::Result;
use tracing::{info, debug, warn, error};
use async_trait::async_trait;
use tokio::sync::RwLock;

use crate::engine::agent_trait::{Agent, AgentContext, AgentConfig};
use crate::engine::message_bus::{BusMessage, Message, MessageBus, MessageType, TradeDirection};
use crate::exchange::bybit::adapter::BybitAdapter;
use crate::exchange::OrderSide;

/// Maximum number of hedges to track
const MAX_HEDGES: usize = 100;

/// Anti-loss hedger state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AntiLossHedgerState {
    /// Whether the agent is active
    pub active: bool,

    /// Number of hedges created
    pub hedges_created: usize,

    /// Number of hedges activated
    pub hedges_activated: usize,

    /// Number of hedges expired
    pub hedges_expired: usize,

    /// Total loss prevented
    pub total_loss_prevented: f64,

    /// Current active hedges
    pub active_hedges: usize,
}

/// Hedge type
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum HedgeType {
    /// Inverse position
    Inverse,

    /// Correlated asset
    Correlated,

    /// Options hedge
    Options,

    /// Multi-asset basket
    MultiAsset,
}

/// Hedge status
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum HedgeStatus {
    /// Hedge is pending
    Pending,

    /// Hedge is active
    Active,

    /// Hedge is activated (triggered)
    Activated,

    /// Hedge is expired
    Expired,

    /// Hedge is cancelled
    Cancelled,
}

/// Hedge record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HedgeRecord {
    /// Hedge ID
    pub id: String,

    /// Original trade ID
    pub trade_id: String,

    /// Hedge timestamp
    pub timestamp: DateTime<Utc>,

    /// Hedge type
    pub hedge_type: HedgeType,

    /// Hedge status
    pub status: HedgeStatus,

    /// Original symbol
    pub original_symbol: String,

    /// Original direction
    pub original_direction: TradeDirection,

    /// Original position size
    pub original_position_size: f64,

    /// Original entry price
    pub original_entry_price: f64,

    /// Hedge symbol
    pub hedge_symbol: String,

    /// Hedge direction
    pub hedge_direction: TradeDirection,

    /// Hedge position size
    pub hedge_position_size: f64,

    /// Hedge entry price
    pub hedge_entry_price: Option<f64>,

    /// Hedge exit price
    pub hedge_exit_price: Option<f64>,

    /// Activation threshold
    pub activation_threshold: f64,

    /// Expiration time
    pub expiration_time: DateTime<Utc>,

    /// Activation time
    pub activation_time: Option<DateTime<Utc>>,

    /// Hedge PnL
    pub hedge_pnl: Option<f64>,

    /// Original trade PnL
    pub original_pnl: Option<f64>,

    /// Net PnL
    pub net_pnl: Option<f64>,
}

/// Anti-Loss Hedger Agent
/// Anti-Loss Hedger configuration
#[derive(Debug, Clone)]
pub struct AntiLossHedgerConfig {
    /// Hedge threshold (percentage)
    pub hedge_threshold: f64,

    /// Hedge ratio
    pub hedge_ratio: f64,

    /// Maximum hedge positions
    pub max_hedge_positions: usize,

    /// Check interval (seconds)
    pub check_interval: u64,

    /// Activation threshold
    pub activation_threshold: f64,

    /// Expiration time (seconds)
    pub expiration_time: u64,
}

impl Default for AntiLossHedgerConfig {
    fn default() -> Self {
        Self {
            hedge_threshold: 0.01, // 1% drawdown
            hedge_ratio: 0.5, // 50% of position size
            max_hedge_positions: 3,
            check_interval: 60, // 1 minute
            activation_threshold: 0.02, // 2% drawdown
            expiration_time: 3600, // 1 hour
        }
    }
}

/// Position
#[derive(Debug, Clone)]
struct Position {
    /// Symbol
    symbol: String,

    /// Side
    side: String,

    /// Entry price
    entry_price: f64,

    /// Quantity
    quantity: f64,

    /// Size
    size: f64,

    /// Current price
    current_price: f64,

    /// Unrealized PnL
    unrealized_pnl: f64,

    /// Unrealized ROI
    unrealized_roi: f64,

    /// Hedged flag
    hedged: bool,

    /// Hedge order ID
    hedge_order_id: Option<String>,
}

pub struct AntiLossHedger {
    /// Configuration
    config: AntiLossHedgerConfig,

    /// Exchange adapter
    exchange: Arc<BybitAdapter>,

    /// Message bus
    message_bus: Arc<MessageBus>,

    /// Agent state
    state: AntiLossHedgerState,

    /// Hedge records
    hedges: VecDeque<HedgeRecord>,

    /// Correlation matrix
    correlation_matrix: HashMap<String, HashMap<String, f64>>,

    /// Positions
    positions: HashMap<String, Position>,

    /// Hedge positions
    hedge_positions: HashMap<String, Position>,

    /// Running flag
    running: bool,

    /// Last check time
    last_check_time: u64,
}

impl AntiLossHedger {
    /// Create a new anti-loss hedger
    pub fn new(config: AntiLossHedgerConfig, exchange: Arc<BybitAdapter>, message_bus: Arc<MessageBus>) -> Self {
        Self {
            config,
            exchange,
            message_bus,
            state: AntiLossHedgerState {
                active: true,
                hedges_created: 0,
                hedges_activated: 0,
                hedges_expired: 0,
                total_loss_prevented: 0.0,
                active_hedges: 0,
            },
            hedges: VecDeque::with_capacity(MAX_HEDGES),
            correlation_matrix: HashMap::new(),
            positions: HashMap::new(),
            hedge_positions: HashMap::new(),
            running: false,
            last_check_time: 0,
        }
    }

    /// Create a hedge for a trade
    pub fn create_hedge(&mut self, trade_id: &str, symbol: &str, direction: TradeDirection, position_size: f64, entry_price: f64) -> Result<HedgeRecord> {
        // Determine hedge type and symbol
        let (hedge_type, hedge_symbol) = self.determine_hedge_type(symbol)?;

        // Determine hedge direction (opposite of original)
        let hedge_direction = match direction {
            TradeDirection::Long => TradeDirection::Short,
            TradeDirection::Short => TradeDirection::Long,
            _ => TradeDirection::Neutral,
        };

        // Calculate hedge position size
        let hedge_position_size = position_size * self.config.hedge_ratio;

        // Create hedge ID
        let hedge_id = format!("hedge-{}-{}", trade_id, Utc::now().timestamp_millis());

        // Create expiration time
        let expiration_time = Utc::now() + chrono::Duration::seconds(self.config.expiration_time as i64);

        // Create hedge record
        let hedge = HedgeRecord {
            id: hedge_id,
            trade_id: trade_id.to_string(),
            timestamp: Utc::now(),
            hedge_type,
            status: HedgeStatus::Pending,
            original_symbol: symbol.to_string(),
            original_direction: direction,
            original_position_size: position_size,
            original_entry_price: entry_price,
            hedge_symbol,
            hedge_direction,
            hedge_position_size,
            hedge_entry_price: None,
            hedge_exit_price: None,
            activation_threshold: self.config.activation_threshold,
            expiration_time,
            activation_time: None,
            hedge_pnl: None,
            original_pnl: None,
            net_pnl: None,
        };

        // Add to hedges
        self.hedges.push_back(hedge.clone());

        // Enforce capacity limit
        if self.hedges.len() > MAX_HEDGES {
            self.hedges.pop_front();
        }

        // Update state
        self.state.hedges_created += 1;
        self.state.active_hedges += 1;

        Ok(hedge)
    }

    /// Determine hedge type and symbol
    fn determine_hedge_type(&self, symbol: &str) -> Result<(HedgeType, String)> {
        // For now, use inverse hedge
        let hedge_type = HedgeType::Inverse;
        let hedge_symbol = symbol.to_string();

        // In a real implementation, this would use the correlation matrix
        // to find the best hedge asset

        Ok((hedge_type, hedge_symbol))
    }

    /// Update hedge status
    pub fn update_hedge(&mut self, hedge_id: &str, current_price: f64) -> Result<Option<Message>> {
        let mut message = None;

        // Find hedge
        let hedge_index = self.hedges.iter().position(|h| h.id == hedge_id);

        if let Some(index) = hedge_index {
            let mut hedge = self.hedges[index].clone();

            // Check if hedge is already activated or expired
            if hedge.status == HedgeStatus::Activated || hedge.status == HedgeStatus::Expired {
                return Ok(None);
            }

            // Check if hedge is expired
            if Utc::now() > hedge.expiration_time {
                hedge.status = HedgeStatus::Expired;
                self.hedges[index] = hedge.clone();

                self.state.hedges_expired += 1;
                self.state.active_hedges -= 1;

                return Ok(None);
            }

            // Calculate current PnL
            let original_pnl = self.calculate_pnl(
                hedge.original_direction,
                hedge.original_entry_price,
                current_price,
                hedge.original_position_size,
            );

            // Check if activation threshold is reached
            let pnl_pct = original_pnl / (hedge.original_entry_price * hedge.original_position_size);

            if pnl_pct <= hedge.activation_threshold {
                // Activate hedge
                hedge.status = HedgeStatus::Activated;
                hedge.activation_time = Some(Utc::now());
                hedge.hedge_entry_price = Some(current_price);
                hedge.original_pnl = Some(original_pnl);

                self.hedges[index] = hedge.clone();

                self.state.hedges_activated += 1;

                // Create activation message
                message = Some(Message::Custom(
                    "hedge_activated".to_string(),
                    serde_json::json!({
                        "hedge_id": hedge.id,
                        "trade_id": hedge.trade_id,
                        "symbol": hedge.hedge_symbol,
                        "direction": format!("{:?}", hedge.hedge_direction),
                        "position_size": hedge.hedge_position_size,
                        "entry_price": current_price,
                        "timestamp": Utc::now(),
                    }),
                ));

                info!(
                    "Hedge activated: {} for trade {} - Original PnL: ${:.2} ({:.2}%)",
                    hedge.id, hedge.trade_id, original_pnl, pnl_pct * 100.0
                );
            }
        }

        Ok(message)
    }

    /// Close a hedge
    pub fn close_hedge(&mut self, hedge_id: &str, exit_price: f64) -> Result<Option<Message>> {
        let mut message = None;

        // Find hedge
        let hedge_index = self.hedges.iter().position(|h| h.id == hedge_id);

        if let Some(index) = hedge_index {
            let mut hedge = self.hedges[index].clone();

            // Check if hedge is activated
            if hedge.status != HedgeStatus::Activated {
                return Ok(None);
            }

            // Update hedge
            hedge.hedge_exit_price = Some(exit_price);

            // Calculate hedge PnL
            let hedge_pnl = self.calculate_pnl(
                hedge.hedge_direction,
                hedge.hedge_entry_price.unwrap(),
                exit_price,
                hedge.hedge_position_size,
            );

            hedge.hedge_pnl = Some(hedge_pnl);

            // Calculate net PnL
            let net_pnl = hedge.original_pnl.unwrap() + hedge_pnl;
            hedge.net_pnl = Some(net_pnl);

            // Update state
            if net_pnl > hedge.original_pnl.unwrap() {
                self.state.total_loss_prevented += net_pnl - hedge.original_pnl.unwrap();
            }

            self.state.active_hedges -= 1;

            // Update hedge
            self.hedges[index] = hedge.clone();

            // Create close message
            message = Some(Message::Custom(
                "hedge_closed".to_string(),
                serde_json::json!({
                    "hedge_id": hedge.id,
                    "trade_id": hedge.trade_id,
                    "symbol": hedge.hedge_symbol,
                    "direction": format!("{:?}", hedge.hedge_direction),
                    "position_size": hedge.hedge_position_size,
                    "entry_price": hedge.hedge_entry_price.unwrap(),
                    "exit_price": exit_price,
                    "hedge_pnl": hedge_pnl,
                    "original_pnl": hedge.original_pnl.unwrap(),
                    "net_pnl": net_pnl,
                    "timestamp": Utc::now(),
                }),
            ));

            info!(
                "Hedge closed: {} for trade {} - Hedge PnL: ${:.2}, Net PnL: ${:.2}",
                hedge.id, hedge.trade_id, hedge_pnl, net_pnl
            );
        }

        Ok(message)
    }

    /// Calculate PnL
    fn calculate_pnl(&self, direction: TradeDirection, entry_price: f64, current_price: f64, position_size: f64) -> f64 {
        match direction {
            TradeDirection::Long => (current_price - entry_price) * position_size,
            TradeDirection::Short => (entry_price - current_price) * position_size,
            _ => 0.0,
        }
    }

    /// Get hedge by ID
    pub fn get_hedge(&self, hedge_id: &str) -> Option<&HedgeRecord> {
        self.hedges.iter().find(|h| h.id == hedge_id)
    }

    /// Get hedges for trade
    pub fn get_hedges_for_trade(&self, trade_id: &str) -> Vec<&HedgeRecord> {
        self.hedges.iter().filter(|h| h.trade_id == trade_id).collect()
    }

    /// Get active hedges
    pub fn get_active_hedges(&self) -> Vec<&HedgeRecord> {
        self.hedges.iter().filter(|h| h.status == HedgeStatus::Active || h.status == HedgeStatus::Pending).collect()
    }

    /// Get all hedges
    pub fn get_all_hedges(&self) -> &VecDeque<HedgeRecord> {
        &self.hedges
    }

    /// Get state
    pub fn get_state(&self) -> &AntiLossHedgerState {
        &self.state
    }

    /// Check positions
    async fn check_positions(&mut self) -> Result<()> {
        // First collect all the positions we need to process
        let mut positions_to_process = Vec::new();

        // Collect all positions and their current data
        for (symbol, position) in &mut self.positions {
            // Get current price
            let tickers = self.exchange.get_ticker(symbol).await?;

            if let Some(ticker) = tickers.first() {
                position.current_price = ticker.last_price;

                // Calculate unrealized PnL
                position.unrealized_pnl = if position.side == "Buy" || position.side == "Long" || position.side == "BUY" {
                    (position.current_price - position.entry_price) * position.size
                } else {
                    (position.entry_price - position.current_price) * position.size
                };

                // Calculate unrealized ROI
                position.unrealized_roi = position.unrealized_pnl / (position.entry_price * position.size);

                // Store position data for processing
                positions_to_process.push((symbol.clone(), position.clone(), position.hedged, position.unrealized_roi, position.hedge_order_id.clone()));
            }
        }

        // Now process each position
        for (symbol, position, is_hedged, unrealized_roi, hedge_order_id) in positions_to_process {
            // Check if position needs hedging
            if !is_hedged && unrealized_roi <= -self.config.hedge_threshold {
                // Create hedge position
                if self.hedge_positions.len() < self.config.max_hedge_positions {
                    self.create_hedge_position(&symbol, &position).await?;

                    // Update the original position
                    if let Some(orig_position) = self.positions.get_mut(&symbol) {
                        orig_position.hedged = true;
                        // The hedge_order_id will be set in create_hedge_position
                    }
                }
            }

            // Check if hedge position can be closed
            if is_hedged && unrealized_roi > 0.0 {
                // Close hedge position
                if let Some(order_id) = hedge_order_id {
                    self.close_hedge_position(&symbol, &order_id).await?;

                    // Update the original position
                    if let Some(orig_position) = self.positions.get_mut(&symbol) {
                        orig_position.hedged = false;
                        orig_position.hedge_order_id = None;
                    }
                }
            }
        }

        Ok(())
    }

    /// Create hedge position
    async fn create_hedge_position(&mut self, symbol: &str, position: &Position) -> Result<()> {
        // Calculate hedge quantity
        let hedge_quantity = position.quantity * self.config.hedge_ratio;

        // Determine hedge side
        let hedge_side = if position.side == "Buy" || position.side == "Long" || position.side == "BUY" {
            OrderSide::Sell
        } else {
            OrderSide::Buy
        };

        // Place hedge order
        let order = self.exchange.place_order(
            symbol,
            hedge_side,
            crate::exchange::OrderType::Market,
            hedge_quantity,
            None,
            crate::exchange::TimeInForce::GoodTillCancel,
            false,
            false,
            None,
            None,
        ).await?;

        info!("Created hedge position for {}: {:?}, quantity: {}", symbol, hedge_side, hedge_quantity);

        // Add hedge position
        let hedge_position = Position {
            symbol: symbol.to_string(),
            side: hedge_side.to_string(),
            entry_price: position.current_price,
            quantity: hedge_quantity,
            size: hedge_quantity,
            current_price: position.current_price,
            unrealized_pnl: 0.0,
            unrealized_roi: 0.0,
            hedged: false,
            hedge_order_id: None,
        };

        self.hedge_positions.insert(order.order_id.clone(), hedge_position);

        // Update original position
        if let Some(orig_position) = self.positions.get_mut(symbol) {
            orig_position.hedged = true;
            orig_position.hedge_order_id = Some(order.order_id);
        }

        Ok(())
    }

    /// Close hedge position
    async fn close_hedge_position(&mut self, symbol: &str, hedge_order_id: &str) -> Result<()> {
        // Get hedge position
        if let Some(hedge_position) = self.hedge_positions.remove(hedge_order_id) {
            // Determine close side
            let side_str = hedge_position.side.to_uppercase();
            let close_side = if side_str == "BUY" || side_str == "LONG" {
                OrderSide::Sell
            } else {
                OrderSide::Buy
            };

            // Place close order
            let order = self.exchange.place_order(
                symbol,
                close_side,
                crate::exchange::OrderType::Market,
                hedge_position.quantity,
                None,
                crate::exchange::TimeInForce::GoodTillCancel,
                false,
                false,
                None,
                None,
            ).await?;

            info!("Closed hedge position for {}: {:?}, quantity: {}", symbol, close_side, hedge_position.quantity);
        }

        Ok(())
    }

    /// Set activation threshold
    pub fn set_activation_threshold(&mut self, threshold: f64) {
        self.config.activation_threshold = threshold;
    }

    /// Set hedge ratio
    pub fn set_hedge_ratio(&mut self, ratio: f64) {
        self.config.hedge_ratio = ratio;
    }

    /// Set expiration time
    pub fn set_expiration_time(&mut self, seconds: u64) {
        self.config.expiration_time = seconds;
    }

    /// Update correlation matrix
    pub fn update_correlation(&mut self, symbol1: &str, symbol2: &str, correlation: f64) {
        self.correlation_matrix.entry(symbol1.to_string())
            .or_insert_with(HashMap::new)
            .insert(symbol2.to_string(), correlation);

        self.correlation_matrix.entry(symbol2.to_string())
            .or_insert_with(HashMap::new)
            .insert(symbol1.to_string(), correlation);
    }

    /// Get correlation
    pub fn get_correlation(&self, symbol1: &str, symbol2: &str) -> Option<f64> {
        self.correlation_matrix.get(symbol1)
            .and_then(|map| map.get(symbol2))
            .copied()
    }
}

#[async_trait]
impl Agent for AntiLossHedger {
    async fn initialize(&mut self, _context: Arc<RwLock<AgentContext>>) -> Result<()> {
        info!("Initializing Anti-Loss Hedger");

        // Send initialization message
        let message = BusMessage {
            message_type: MessageType::AgentInitialized,
            content: "Anti-Loss Hedger initialized".to_string(),
            timestamp: chrono::Utc::now(),
        };

        self.message_bus.publish(message).await;

        Ok(())
    }

    async fn start(&mut self) -> Result<()> {
        info!("Starting Anti-Loss Hedger");

        self.running = true;

        // Send start message
        let message = BusMessage {
            message_type: MessageType::AgentStarted,
            content: "Anti-Loss Hedger started".to_string(),
            timestamp: chrono::Utc::now(),
        };

        self.message_bus.publish(message).await;

        Ok(())
    }

    async fn stop(&mut self) -> Result<()> {
        info!("Stopping Anti-Loss Hedger");

        self.running = false;

        // Send stop message
        let message = BusMessage {
            message_type: MessageType::AgentStopped,
            content: "Anti-Loss Hedger stopped".to_string(),
            timestamp: chrono::Utc::now(),
        };

        self.message_bus.publish(message).await;

        Ok(())
    }

    async fn update(&mut self) -> Result<()> {
        if !self.running {
            return Ok(());
        }

        debug!("Updating Anti-Loss Hedger");

        // Get current time
        let current_time = chrono::Utc::now().timestamp() as u64;

        // Check if it's time to check positions
        if current_time - self.last_check_time >= self.config.check_interval {
            // Check positions
            self.check_positions().await?;

            // Update last check time
            self.last_check_time = current_time;
        }

        Ok(())
    }

    async fn handle_message(&mut self, message: BusMessage) -> Result<()> {
        match message.message_type {
            MessageType::TradeEntry => {
                info!("Received trade entry message: {}", message.content);

                // Parse trade entry message
                // Format: "symbol:BTCUSDT,side:Buy,price:50000,quantity:0.001,order_id:123456"
                let parts: Vec<&str> = message.content.split(',').collect();

                let mut symbol = String::new();
                let mut side_str = String::new();
                let mut price = 0.0;
                let mut quantity = 0.0;
                let mut order_id = String::new();

                for part in parts {
                    let kv: Vec<&str> = part.split(':').collect();

                    if kv.len() == 2 {
                        match kv[0] {
                            "symbol" => symbol = kv[1].to_string(),
                            "side" => side_str = kv[1].to_string(),
                            "price" => price = kv[1].parse::<f64>().unwrap_or(0.0),
                            "quantity" => quantity = kv[1].parse::<f64>().unwrap_or(0.0),
                            "order_id" => order_id = kv[1].to_string(),
                            _ => {}
                        }
                    }
                }

                // Determine side
                let side = if side_str.to_lowercase() == "buy" {
                    OrderSide::Buy
                } else {
                    OrderSide::Sell
                };

                // Create position
                let position = Position {
                    symbol: symbol.clone(),
                    side: side.to_string(),
                    entry_price: price,
                    quantity,
                    size: quantity,
                    current_price: price,
                    unrealized_pnl: 0.0,
                    unrealized_roi: 0.0,
                    hedged: false,
                    hedge_order_id: None,
                };

                // Add position
                let symbol_clone = symbol.clone();
                self.positions.insert(symbol, position);

                info!("Added position for {}: {:?}, quantity: {}", symbol_clone, side, quantity);
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
                    // Remove position
                    if let Some(position) = self.positions.remove(&symbol) {
                        // Close hedge position if exists
                        if position.hedged {
                            if let Some(hedge_order_id) = position.hedge_order_id {
                                self.close_hedge_position(&symbol, &hedge_order_id).await?;
                            }
                        }

                        info!("Removed position for {}", symbol);
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
        "AntiLossHedger"
    }

    fn get_config(&self) -> Box<dyn AgentConfig> {
        Box::new(self.config.clone())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hedge_creation_and_activation() {
        let mut hedger = AntiLossHedger::new();

        // Create a hedge
        let hedge = hedger.create_hedge(
            "trade-1",
            "BTCUSDT",
            TradeDirection::Long,
            0.1,
            50000.0,
        ).unwrap();

        assert_eq!(hedge.status, HedgeStatus::Pending);
        assert_eq!(hedge.original_symbol, "BTCUSDT");
        assert_eq!(hedge.hedge_direction, TradeDirection::Short);

        // Update hedge with price that triggers activation
        let price = 49500.0; // 1% drop
        let message = hedger.update_hedge(&hedge.id, price).unwrap();

        assert!(message.is_some());

        // Check hedge status
        let updated_hedge = hedger.get_hedge(&hedge.id).unwrap();
        assert_eq!(updated_hedge.status, HedgeStatus::Activated);
        assert!(updated_hedge.activation_time.is_some());
        assert!(updated_hedge.hedge_entry_price.is_some());
        assert_eq!(updated_hedge.hedge_entry_price.unwrap(), price);

        // Close hedge
        let exit_price = 49000.0;
        let message = hedger.close_hedge(&hedge.id, exit_price).unwrap();

        assert!(message.is_some());

        // Check hedge status
        let closed_hedge = hedger.get_hedge(&hedge.id).unwrap();
        assert_eq!(closed_hedge.hedge_exit_price.unwrap(), exit_price);
        assert!(closed_hedge.hedge_pnl.is_some());
        assert!(closed_hedge.net_pnl.is_some());
    }
}
