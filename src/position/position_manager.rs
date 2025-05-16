use std::collections::HashMap;
use chrono::{DateTime, Utc};
use tracing::{info, warn, error, debug};
use serde::{Serialize, Deserialize};

use crate::exchange::types::Candle;
use crate::strategy::indicators::calculate_atr;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PositionDirection {
    Long,
    Short,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum PositionStatus {
    Open,
    Closed,
    Cancelled,
    Rejected,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Position {
    pub id: String,
    pub symbol: String,
    pub direction: PositionDirection,
    pub entry_price: f64,
    pub entry_time: DateTime<Utc>,
    pub quantity: f64,
    pub stop_loss: f64,
    pub take_profit: f64,
    pub status: PositionStatus,
    pub exit_price: Option<f64>,
    pub exit_time: Option<DateTime<Utc>>,
    pub realized_pnl: Option<f64>,
    pub unrealized_pnl: f64,
    pub trailing_stop: Option<f64>,
}

impl Position {
    pub fn new(
        id: String,
        symbol: String,
        direction: PositionDirection,
        entry_price: f64,
        quantity: f64,
        stop_loss: f64,
        take_profit: f64,
    ) -> Self {
        Self {
            id,
            symbol,
            direction,
            entry_price,
            entry_time: Utc::now(),
            quantity,
            stop_loss,
            take_profit,
            status: PositionStatus::Open,
            exit_price: None,
            exit_time: None,
            realized_pnl: None,
            unrealized_pnl: 0.0,
            trailing_stop: None,
        }
    }

    pub fn update_price(&mut self, current_price: f64) {
        // Calculate unrealized PnL
        match self.direction {
            PositionDirection::Long => {
                self.unrealized_pnl = (current_price - self.entry_price) * self.quantity;
            }
            PositionDirection::Short => {
                self.unrealized_pnl = (self.entry_price - current_price) * self.quantity;
            }
        }

        // Check if stop loss or take profit is hit
        let should_close = match self.direction {
            PositionDirection::Long => {
                current_price <= self.stop_loss || current_price >= self.take_profit
            }
            PositionDirection::Short => {
                current_price >= self.stop_loss || current_price <= self.take_profit
            }
        };

        if should_close && self.status == PositionStatus::Open {
            self.close(current_price);
        }

        // Update trailing stop if enabled
        if let Some(trailing_stop) = self.trailing_stop {
            match self.direction {
                PositionDirection::Long => {
                    // For long positions, move stop loss up as price increases
                    let new_stop = current_price - trailing_stop;
                    if new_stop > self.stop_loss {
                        debug!("Updating trailing stop for {} from ${:.2} to ${:.2}",
                               self.symbol, self.stop_loss, new_stop);
                        self.stop_loss = new_stop;
                    }
                }
                PositionDirection::Short => {
                    // For short positions, move stop loss down as price decreases
                    let new_stop = current_price + trailing_stop;
                    if new_stop < self.stop_loss {
                        debug!("Updating trailing stop for {} from ${:.2} to ${:.2}",
                               self.symbol, self.stop_loss, new_stop);
                        self.stop_loss = new_stop;
                    }
                }
            }
        }
    }

    pub fn close(&mut self, exit_price: f64) {
        self.status = PositionStatus::Closed;
        self.exit_price = Some(exit_price);
        self.exit_time = Some(Utc::now());

        // Calculate realized PnL
        match self.direction {
            PositionDirection::Long => {
                self.realized_pnl = Some((exit_price - self.entry_price) * self.quantity);
            }
            PositionDirection::Short => {
                self.realized_pnl = Some((self.entry_price - exit_price) * self.quantity);
            }
        }

        info!("Closed position {} for {} at ${:.2}, PnL: ${:.2}",
              self.id, self.symbol, exit_price, self.realized_pnl.unwrap_or(0.0));
    }

    pub fn enable_trailing_stop(&mut self, atr_multiple: f64, candles: &[Candle]) {
        if candles.len() < 14 {
            warn!("Not enough candles to calculate ATR for trailing stop");
            return;
        }

        let atr = calculate_atr(candles, 14);
        let trailing_amount = atr * atr_multiple;

        self.trailing_stop = Some(trailing_amount);
        info!("Enabled trailing stop for {} at ${:.2} (ATR: ${:.2}, Multiple: {:.1})",
              self.symbol, trailing_amount, atr, atr_multiple);
    }

    pub fn is_open(&self) -> bool {
        matches!(self.status, PositionStatus::Open)
    }

    pub fn is_closed(&self) -> bool {
        matches!(self.status, PositionStatus::Closed)
    }

    pub fn get_roi(&self) -> f64 {
        let pnl = if self.is_closed() {
            self.realized_pnl.unwrap_or(0.0)
        } else {
            self.unrealized_pnl
        };

        let investment = self.entry_price * self.quantity;
        if investment == 0.0 {
            return 0.0;
        }

        pnl / investment
    }
}

pub struct PositionManager {
    positions: HashMap<String, Position>,
    max_positions: usize,
    risk_per_trade: f64,
}

impl PositionManager {
    pub fn new(max_positions: usize, risk_per_trade: f64) -> Self {
        Self {
            positions: HashMap::new(),
            max_positions,
            risk_per_trade,
        }
    }

    pub fn open_position(
        &mut self,
        symbol: &str,
        direction: PositionDirection,
        entry_price: f64,
        quantity: f64,
        stop_loss: f64,
        take_profit: f64,
    ) -> Result<String, String> {
        // Check if we already have the maximum number of open positions
        let open_positions = self.positions.values()
            .filter(|p| p.is_open())
            .count();

        if open_positions >= self.max_positions {
            return Err(format!("Maximum number of positions ({}) reached", self.max_positions));
        }

        // Generate a unique ID for the position
        let id = format!("pos-{}-{}", symbol, Utc::now().timestamp_millis());

        // Create and store the position
        let position = Position::new(
            id.clone(),
            symbol.to_string(),
            direction,
            entry_price,
            quantity,
            stop_loss,
            take_profit,
        );

        info!("Opening position {} for {} at ${:.2}, qty: {:.6}, stop: ${:.2}, target: ${:.2}",
              id, symbol, entry_price, quantity, stop_loss, take_profit);

        self.positions.insert(id.clone(), position);

        Ok(id)
    }

    pub fn close_position(&mut self, position_id: &str, exit_price: f64) -> Result<(), String> {
        if let Some(position) = self.positions.get_mut(position_id) {
            if position.is_open() {
                position.close(exit_price);
                Ok(())
            } else {
                Err(format!("Position {} is already closed", position_id))
            }
        } else {
            Err(format!("Position {} not found", position_id))
        }
    }

    pub fn update_positions(&mut self, symbol_prices: &HashMap<String, f64>) {
        for position in self.positions.values_mut() {
            if position.is_open() {
                if let Some(price) = symbol_prices.get(&position.symbol) {
                    position.update_price(*price);
                }
            }
        }
    }

    pub fn get_position(&self, position_id: &str) -> Option<&Position> {
        self.positions.get(position_id)
    }

    pub fn get_open_positions(&self) -> Vec<&Position> {
        self.positions.values()
            .filter(|p| p.is_open())
            .collect()
    }

    pub fn get_closed_positions(&self) -> Vec<&Position> {
        self.positions.values()
            .filter(|p| p.is_closed())
            .collect()
    }

    pub fn get_positions_for_symbol(&self, symbol: &str) -> Vec<&Position> {
        self.positions.values()
            .filter(|p| p.symbol == symbol)
            .collect()
    }

    pub fn get_open_positions_for_symbol(&self, symbol: &str) -> Vec<&Position> {
        self.positions.values()
            .filter(|p| p.symbol == symbol && p.is_open())
            .collect()
    }

    pub fn enable_trailing_stop(&mut self, position_id: &str, atr_multiple: f64, candles: &[Candle]) -> Result<(), String> {
        if let Some(position) = self.positions.get_mut(position_id) {
            if position.is_open() {
                position.enable_trailing_stop(atr_multiple, candles);
                Ok(())
            } else {
                Err(format!("Position {} is not open", position_id))
            }
        } else {
            Err(format!("Position {} not found", position_id))
        }
    }

    pub fn calculate_total_pnl(&self) -> f64 {
        let realized_pnl: f64 = self.positions.values()
            .filter(|p| p.is_closed())
            .filter_map(|p| p.realized_pnl)
            .sum();

        let unrealized_pnl: f64 = self.positions.values()
            .filter(|p| p.is_open())
            .map(|p| p.unrealized_pnl)
            .sum();

        realized_pnl + unrealized_pnl
    }

    pub fn calculate_position_size(&self, capital: f64, entry_price: f64, stop_loss: f64) -> f64 {
        let risk_amount = capital * self.risk_per_trade;
        let stop_distance = (entry_price - stop_loss).abs();

        if stop_distance <= 0.0 {
            return 0.0;
        }

        let position_size = risk_amount / stop_distance;
        let units = position_size / entry_price;

        units
    }
}
