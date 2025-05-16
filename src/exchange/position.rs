//! Position module
//!
//! This module provides the Position struct for representing trading positions.

use serde::{Deserialize, Serialize};

/// Position
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Position {
    /// Symbol
    pub symbol: String,
    
    /// Side (Buy or Sell)
    pub side: String,
    
    /// Entry price
    pub entry_price: f64,
    
    /// Size/quantity
    pub size: f64,
    
    /// Current price
    pub current_price: f64,
    
    /// Unrealized PnL
    pub unrealized_pnl: f64,
    
    /// Unrealized ROI
    pub unrealized_roi: f64,
    
    /// Leverage
    pub leverage: f64,
    
    /// Margin
    pub margin: f64,
    
    /// Liquidation price
    pub liquidation_price: Option<f64>,
    
    /// Take profit price
    pub take_profit: Option<f64>,
    
    /// Stop loss price
    pub stop_loss: Option<f64>,
    
    /// Position ID
    pub position_id: Option<String>,
    
    /// Creation time
    pub created_at: Option<i64>,
    
    /// Update time
    pub updated_at: Option<i64>,
}

impl Position {
    /// Create a new position
    pub fn new(
        symbol: String,
        side: String,
        entry_price: f64,
        size: f64,
        current_price: f64,
    ) -> Self {
        let unrealized_pnl = if side == "Buy" {
            (current_price - entry_price) * size
        } else {
            (entry_price - current_price) * size
        };
        
        let unrealized_roi = if entry_price > 0.0 {
            unrealized_pnl / (entry_price * size)
        } else {
            0.0
        };
        
        Self {
            symbol,
            side,
            entry_price,
            size,
            current_price,
            unrealized_pnl,
            unrealized_roi,
            leverage: 1.0,
            margin: size * entry_price,
            liquidation_price: None,
            take_profit: None,
            stop_loss: None,
            position_id: None,
            created_at: None,
            updated_at: None,
        }
    }
    
    /// Update position with current price
    pub fn update_price(&mut self, current_price: f64) {
        self.current_price = current_price;
        
        // Recalculate PnL and ROI
        self.unrealized_pnl = if self.side == "Buy" {
            (current_price - self.entry_price) * self.size
        } else {
            (self.entry_price - current_price) * self.size
        };
        
        self.unrealized_roi = if self.entry_price > 0.0 {
            self.unrealized_pnl / (self.entry_price * self.size)
        } else {
            0.0
        };
    }
}
