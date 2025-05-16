//! Execution Models
//!
//! This module provides models for trade execution, including stop loss,
//! take profit, and trailing stop logic.

use serde::{Deserialize, Serialize};
use anyhow::Result;

use crate::engine::message_bus::TradeDirection;

/// Stop loss type
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum StopLossType {
    /// Fixed price stop loss
    Fixed,
    
    /// Percentage-based stop loss
    Percentage,
    
    /// Trailing stop loss
    Trailing,
    
    /// ATR-based stop loss
    ATR,
    
    /// Volatility-based stop loss
    Volatility,
}

/// Take profit type
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum TakeProfitType {
    /// Fixed price take profit
    Fixed,
    
    /// Percentage-based take profit
    Percentage,
    
    /// Multiple take profit levels
    MultiLevel,
    
    /// Fibonacci-based take profit
    Fibonacci,
    
    /// Trailing take profit
    Trailing,
}

/// Trailing stop parameters
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrailingStopParams {
    /// Activation percentage
    pub activation_pct: f64,
    
    /// Trailing distance percentage
    pub trailing_distance_pct: f64,
    
    /// Minimum profit percentage
    pub min_profit_pct: f64,
    
    /// Maximum loss percentage
    pub max_loss_pct: f64,
    
    /// Step size percentage
    pub step_size_pct: f64,
}

/// Execution model
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionModel {
    /// Stop loss type
    pub stop_loss_type: StopLossType,
    
    /// Take profit type
    pub take_profit_type: TakeProfitType,
    
    /// Stop loss percentage
    pub stop_loss_pct: f64,
    
    /// Take profit percentage
    pub take_profit_pct: f64,
    
    /// Trailing stop parameters
    pub trailing_stop_params: Option<TrailingStopParams>,
    
    /// Take profit levels
    pub take_profit_levels: Vec<f64>,
    
    /// Position sizing percentage
    pub position_size_pct: f64,
    
    /// Maximum leverage
    pub max_leverage: f64,
    
    /// Risk-reward ratio
    pub risk_reward_ratio: f64,
    
    /// Maximum drawdown percentage
    pub max_drawdown_pct: f64,
    
    /// Maximum position size
    pub max_position_size: f64,
}

impl ExecutionModel {
    /// Create a new execution model with default parameters
    pub fn new() -> Self {
        Self {
            stop_loss_type: StopLossType::Percentage,
            take_profit_type: TakeProfitType::Percentage,
            stop_loss_pct: 1.0,
            take_profit_pct: 2.0,
            trailing_stop_params: Some(TrailingStopParams {
                activation_pct: 1.0,
                trailing_distance_pct: 0.5,
                min_profit_pct: 0.5,
                max_loss_pct: 1.0,
                step_size_pct: 0.1,
            }),
            take_profit_levels: vec![1.0, 2.0, 3.0],
            position_size_pct: 10.0,
            max_leverage: 3.0,
            risk_reward_ratio: 2.0,
            max_drawdown_pct: 5.0,
            max_position_size: 100.0,
        }
    }
    
    /// Calculate stop loss price
    pub fn calculate_stop_loss(&self, entry_price: f64, direction: TradeDirection) -> f64 {
        match (direction, self.stop_loss_type) {
            (TradeDirection::Long, StopLossType::Percentage) => {
                entry_price * (1.0 - self.stop_loss_pct / 100.0)
            },
            (TradeDirection::Short, StopLossType::Percentage) => {
                entry_price * (1.0 + self.stop_loss_pct / 100.0)
            },
            _ => entry_price, // Default for other combinations
        }
    }
    
    /// Calculate take profit price
    pub fn calculate_take_profit(&self, entry_price: f64, direction: TradeDirection) -> f64 {
        match (direction, self.take_profit_type) {
            (TradeDirection::Long, TakeProfitType::Percentage) => {
                entry_price * (1.0 + self.take_profit_pct / 100.0)
            },
            (TradeDirection::Short, TakeProfitType::Percentage) => {
                entry_price * (1.0 - self.take_profit_pct / 100.0)
            },
            (TradeDirection::Long, TakeProfitType::MultiLevel) => {
                if !self.take_profit_levels.is_empty() {
                    entry_price * (1.0 + self.take_profit_levels[0] / 100.0)
                } else {
                    entry_price * (1.0 + self.take_profit_pct / 100.0)
                }
            },
            (TradeDirection::Short, TakeProfitType::MultiLevel) => {
                if !self.take_profit_levels.is_empty() {
                    entry_price * (1.0 - self.take_profit_levels[0] / 100.0)
                } else {
                    entry_price * (1.0 - self.take_profit_pct / 100.0)
                }
            },
            _ => entry_price, // Default for other combinations
        }
    }
    
    /// Calculate position size
    pub fn calculate_position_size(&self, capital: f64, entry_price: f64, stop_loss_price: f64) -> f64 {
        // Calculate risk amount
        let risk_amount = capital * (self.position_size_pct / 100.0);
        
        // Calculate position size based on risk
        let risk_per_unit = (entry_price - stop_loss_price).abs();
        
        if risk_per_unit > 0.0 {
            let position_size = risk_amount / risk_per_unit;
            position_size.min(self.max_position_size)
        } else {
            0.0
        }
    }
    
    /// Update trailing stop
    pub fn update_trailing_stop(&self, entry_price: f64, current_price: f64, current_stop: f64, direction: TradeDirection) -> f64 {
        if self.stop_loss_type != StopLossType::Trailing || self.trailing_stop_params.is_none() {
            return current_stop;
        }
        
        let params = self.trailing_stop_params.as_ref().unwrap();
        
        match direction {
            TradeDirection::Long => {
                // Check if price has moved enough to activate trailing stop
                let activation_price = entry_price * (1.0 + params.activation_pct / 100.0);
                
                if current_price >= activation_price {
                    // Calculate new stop loss
                    let new_stop = current_price * (1.0 - params.trailing_distance_pct / 100.0);
                    
                    // Only move stop loss up
                    if new_stop > current_stop {
                        return new_stop;
                    }
                }
            },
            TradeDirection::Short => {
                // Check if price has moved enough to activate trailing stop
                let activation_price = entry_price * (1.0 - params.activation_pct / 100.0);
                
                if current_price <= activation_price {
                    // Calculate new stop loss
                    let new_stop = current_price * (1.0 + params.trailing_distance_pct / 100.0);
                    
                    // Only move stop loss down
                    if new_stop < current_stop {
                        return new_stop;
                    }
                }
            },
            _ => {},
        }
        
        current_stop
    }
    
    /// Check if stop loss is hit
    pub fn is_stop_loss_hit(&self, stop_loss_price: f64, current_price: f64, direction: TradeDirection) -> bool {
        match direction {
            TradeDirection::Long => current_price <= stop_loss_price,
            TradeDirection::Short => current_price >= stop_loss_price,
            _ => false,
        }
    }
    
    /// Check if take profit is hit
    pub fn is_take_profit_hit(&self, take_profit_price: f64, current_price: f64, direction: TradeDirection) -> bool {
        match direction {
            TradeDirection::Long => current_price >= take_profit_price,
            TradeDirection::Short => current_price <= take_profit_price,
            _ => false,
        }
    }
}
