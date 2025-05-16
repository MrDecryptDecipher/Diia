//! Trade Executor Agent
//!
//! This agent is responsible for executing trades based on decisions from other agents.

use std::collections::HashMap;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use anyhow::Result;
use tracing::{info, debug, error};

use crate::engine::message_bus::TradeDirection;
use crate::exchange::bybit::adapter::BybitAdapter;
use crate::exchange::bybit::types::{OrderSide, OrderType, TimeInForce, OrderStatus, PositionSide};
use crate::exchange::position::Position;
use crate::agents::risk_manager::RiskAssessment;

/// Trade execution result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TradeExecution {
    /// Symbol
    pub symbol: String,

    /// Execution timestamp
    pub timestamp: DateTime<Utc>,

    /// Order ID
    pub order_id: Option<String>,

    /// Direction (buy or sell)
    pub direction: TradeDirection,

    /// Quantity
    pub quantity: f64,

    /// Entry price
    pub entry_price: f64,

    /// Leverage
    pub leverage: f64,

    /// Stop loss price
    pub stop_loss: f64,

    /// Take profit price
    pub take_profit: f64,

    /// Execution status
    pub status: OrderStatus,

    /// Message
    pub message: Option<String>,
}

/// Execution status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ExecutionStatus {
    /// Pending
    Pending,

    /// Filled
    Filled,

    /// Partially filled
    PartiallyFilled(f64),

    /// Cancelled
    Cancelled,

    /// Failed
    Failed(String),
}

/// Trade Executor Agent
pub struct TradeExecutor {
    /// Execution cache
    execution_cache: HashMap<String, TradeExecution>,

    /// Active orders
    active_orders: HashMap<String, String>, // symbol -> order_id
}

impl TradeExecutor {
    /// Create a new trade executor
    pub fn new() -> Self {
        Self {
            execution_cache: HashMap::new(),
            active_orders: HashMap::new(),
        }
    }

    /// Execute a trade
    pub async fn execute_trade(
        &mut self,
        adapter: &mut BybitAdapter,
        symbol: &str,
        direction: TradeDirection,
        risk_assessment: &RiskAssessment,
        current_price: f64,
    ) -> Result<TradeExecution> {
        debug!("Executing trade for {} ({:?})", symbol, direction);

        // Calculate quantity based on position size and current price
        let position_size = risk_assessment.max_position_size;
        let leverage = risk_assessment.recommended_leverage;
        let quantity = position_size * leverage / current_price;

        // Calculate stop loss and take profit prices
        let stop_loss_price = match direction {
            TradeDirection::Long => current_price * (1.0 - risk_assessment.stop_loss_percent / 100.0),
            TradeDirection::Short => current_price * (1.0 + risk_assessment.stop_loss_percent / 100.0),
            TradeDirection::Neutral => current_price, // No stop loss for neutral direction
        };

        let take_profit_price = match direction {
            TradeDirection::Long => current_price * (1.0 + risk_assessment.take_profit_percent / 100.0),
            TradeDirection::Short => current_price * (1.0 - risk_assessment.take_profit_percent / 100.0),
            TradeDirection::Neutral => current_price, // No take profit for neutral direction
        };

        // Convert direction to order side
        let side = match direction {
            TradeDirection::Long => OrderSide::Buy,
            TradeDirection::Short => OrderSide::Sell,
            TradeDirection::Neutral => return Ok(TradeExecution {
                symbol: symbol.to_string(),
                direction,
                entry_price: current_price,
                stop_loss: stop_loss_price,
                take_profit: take_profit_price,
                quantity: 0.0,
                leverage,
                order_id: None,
                status: OrderStatus::Rejected,
                timestamp: Utc::now(),
                message: Some("Neutral direction, no trade executed".to_string()),
            }),
        };

        // Set leverage (commented out as not implemented in adapter yet)
        // match adapter.set_leverage(symbol, leverage).await {
        //     Ok(_) => debug!("Leverage set to {}x for {}", leverage, symbol),
        //     Err(e) => {
        //         error!("Failed to set leverage for {}: {}", symbol, e);
        //         return Err(anyhow::anyhow!("Failed to set leverage: {}", e));
        //     }
        // }
        debug!("Using leverage {}x for {}", leverage, symbol);

        // Place the order
        let order_result = adapter.place_order(
            symbol,
            side,
            OrderType::Market,
            quantity,
            Some(current_price),
            TimeInForce::GoodTillCancel,
            false,  // reduce_only
            false,  // close_on_trigger
            None,   // take_profit
            None,   // stop_loss
        ).await;

        match order_result {
            Ok(order) => {
                // Create execution result
                let execution = TradeExecution {
                    symbol: symbol.to_string(),
                    timestamp: Utc::now(),
                    order_id: Some(order.order_id.clone()),
                    direction,
                    quantity,
                    entry_price: current_price,
                    leverage,
                    stop_loss: stop_loss_price,
                    take_profit: take_profit_price,
                    status: OrderStatus::New,
                    message: None,
                };

                // Cache the execution
                self.execution_cache.insert(symbol.to_string(), execution.clone());

                // Add to active orders
                self.active_orders.insert(symbol.to_string(), order.order_id);

                info!("Trade executed for {}: {:?} {} at ${:.2} with {}x leverage",
                      symbol, direction, quantity, current_price, leverage);

                Ok(execution)
            },
            Err(e) => {
                error!("Failed to place order for {}: {}", symbol, e);

                // Create failed execution result
                let execution = TradeExecution {
                    symbol: symbol.to_string(),
                    timestamp: Utc::now(),
                    order_id: None,
                    direction,
                    quantity,
                    entry_price: current_price,
                    leverage,
                    stop_loss: stop_loss_price,
                    take_profit: take_profit_price,
                    status: OrderStatus::Rejected,
                    message: Some(e.to_string()),
                };

                // Cache the execution
                self.execution_cache.insert(symbol.to_string(), execution.clone());

                Err(anyhow::anyhow!("Failed to place order: {}", e))
            }
        }
    }

    /// Update order status
    pub async fn update_order_status(&mut self, adapter: &mut BybitAdapter, symbol: &str) -> Result<OrderStatus> {
        if let Some(order_id) = self.active_orders.get(symbol) {
            // Get order status
            let order_result = adapter.get_order(symbol, order_id).await;

            match order_result {
                Ok(order) => {
                    // Update cache
                    if let Some(execution) = self.execution_cache.get_mut(symbol) {
                        execution.status = order.order_status.clone();
                    }

                    // Remove from active orders if completed
                    if matches!(order.order_status, OrderStatus::Filled | OrderStatus::Cancelled) {
                        self.active_orders.remove(symbol);
                    }

                    Ok(order.order_status)
                },
                Err(e) => {
                    error!("Failed to get order status for {}: {}", symbol, e);
                    Err(anyhow::anyhow!("Failed to get order status: {}", e))
                }
            }
        } else {
            Err(anyhow::anyhow!("No active order for {}", symbol))
        }
    }

    /// Cancel an order
    pub async fn cancel_order(&mut self, adapter: &mut BybitAdapter, symbol: &str) -> Result<()> {
        if let Some(order_id) = self.active_orders.get(symbol) {
            // Cancel the order
            let cancel_result = adapter.cancel_order(symbol, order_id).await;

            match cancel_result {
                Ok(_) => {
                    info!("Order cancelled for {}", symbol);

                    // Update execution status
                    if let Some(execution) = self.execution_cache.get_mut(symbol) {
                        execution.status = OrderStatus::Cancelled;
                    }

                    // Remove from active orders
                    self.active_orders.remove(symbol);

                    Ok(())
                },
                Err(e) => {
                    error!("Failed to cancel order for {}: {}", symbol, e);
                    Err(anyhow::anyhow!("Failed to cancel order: {}", e))
                }
            }
        } else {
            Err(anyhow::anyhow!("No active order for {}", symbol))
        }
    }

    /// Close a position
    pub async fn close_position(&mut self, adapter: &mut BybitAdapter, symbol: &str) -> Result<()> {
        // Get current position
        let positions = adapter.get_positions(Some(symbol)).await?;
        let position = positions.iter().find(|p| p.symbol == symbol);

        if let Some(position) = position {
            // Calculate close direction (opposite of current position)
            let side = if position.side == PositionSide::Buy {
                OrderSide::Sell
            } else {
                OrderSide::Buy
            };

            // Get position size
            let size = position.size;

            if size > 0.0 {
                // Place market order to close position
                let close_result = adapter.place_order(
                    symbol,
                    side,
                    OrderType::Market,
                    size,
                    None, // Market order
                    TimeInForce::GoodTillCancel,
                    true,  // reduce_only
                    false, // close_on_trigger
                    None,  // take_profit
                    None,  // stop_loss
                ).await;

                match close_result {
                    Ok(order) => {
                        info!("Position closed for {}: {}", symbol, order.order_id);
                        Ok(())
                    },
                    Err(e) => {
                        error!("Failed to close position for {}: {}", symbol, e);
                        Err(anyhow::anyhow!("Failed to close position: {}", e))
                    }
                }
            } else {
                info!("No position to close for {}", symbol);
                Ok(())
            }
        } else {
            info!("No position found for {}", symbol);
            Ok(())
        }
    }

    /// Get cached execution for a symbol
    pub fn get_cached_execution(&self, symbol: &str) -> Option<&TradeExecution> {
        self.execution_cache.get(symbol)
    }

    /// Get all cached executions
    pub fn get_all_executions(&self) -> &HashMap<String, TradeExecution> {
        &self.execution_cache
    }

    /// Get all active orders
    pub fn get_active_orders(&self) -> &HashMap<String, String> {
        &self.active_orders
    }
}
