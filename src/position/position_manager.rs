//! Position Manager Module for OMNI Trading System
//!
//! This module provides position management, tracking, and P&L calculation capabilities.

use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use anyhow::Result;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PositionDirection {
    Long,
    Short,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PositionStatus {
    Open,
    Closed,
    PartiallyFilled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Position {
    pub id: String,
    pub symbol: String,
    pub direction: PositionDirection,
    pub size: f64,
    pub entry_price: f64,
    pub current_price: f64,
    pub stop_loss: Option<f64>,
    pub take_profit: Option<f64>,
    pub unrealized_pnl: f64,
    pub realized_pnl: f64,
    pub status: PositionStatus,
    pub open_time: u64,
    pub close_time: Option<u64>,
    pub fees: f64,
}

impl Position {
    pub fn new(
        symbol: String,
        direction: PositionDirection,
        size: f64,
        entry_price: f64,
    ) -> Self {
        let id = format!("pos_{}_{}", 
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos(),
            rand::random::<u32>()
        );
        
        let open_time = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        Self {
            id,
            symbol,
            direction,
            size,
            entry_price,
            current_price: entry_price,
            stop_loss: None,
            take_profit: None,
            unrealized_pnl: 0.0,
            realized_pnl: 0.0,
            status: PositionStatus::Open,
            open_time,
            close_time: None,
            fees: 0.0,
        }
    }

    pub fn update_price(&mut self, new_price: f64) {
        self.current_price = new_price;
        self.calculate_unrealized_pnl();
    }

    pub fn calculate_unrealized_pnl(&mut self) {
        match self.direction {
            PositionDirection::Long => {
                self.unrealized_pnl = (self.current_price - self.entry_price) * self.size;
            }
            PositionDirection::Short => {
                self.unrealized_pnl = (self.entry_price - self.current_price) * self.size;
            }
        }
    }

    pub fn close_position(&mut self, exit_price: f64) -> f64 {
        self.current_price = exit_price;
        self.calculate_unrealized_pnl();
        self.realized_pnl = self.unrealized_pnl - self.fees;
        self.unrealized_pnl = 0.0;
        self.status = PositionStatus::Closed;
        self.close_time = Some(
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs()
        );
        self.realized_pnl
    }

    pub fn set_stop_loss(&mut self, stop_loss: f64) {
        self.stop_loss = Some(stop_loss);
    }

    pub fn set_take_profit(&mut self, take_profit: f64) {
        self.take_profit = Some(take_profit);
    }

    pub fn should_trigger_stop_loss(&self) -> bool {
        if let Some(stop_loss) = self.stop_loss {
            match self.direction {
                PositionDirection::Long => self.current_price <= stop_loss,
                PositionDirection::Short => self.current_price >= stop_loss,
            }
        } else {
            false
        }
    }

    pub fn should_trigger_take_profit(&self) -> bool {
        if let Some(take_profit) = self.take_profit {
            match self.direction {
                PositionDirection::Long => self.current_price >= take_profit,
                PositionDirection::Short => self.current_price <= take_profit,
            }
        } else {
            false
        }
    }

    pub fn get_total_pnl(&self) -> f64 {
        self.realized_pnl + self.unrealized_pnl
    }

    pub fn get_return_percentage(&self) -> f64 {
        let total_pnl = self.get_total_pnl();
        let investment = self.entry_price * self.size;
        if investment > 0.0 {
            (total_pnl / investment) * 100.0
        } else {
            0.0
        }
    }
}

#[derive(Debug, Clone)]
pub struct PositionManager {
    positions: HashMap<String, Position>,
    closed_positions: Vec<Position>,
    total_realized_pnl: f64,
    total_unrealized_pnl: f64,
    max_positions: usize,
}

impl PositionManager {
    pub fn new() -> Self {
        Self {
            positions: HashMap::new(),
            closed_positions: Vec::new(),
            total_realized_pnl: 0.0,
            total_unrealized_pnl: 0.0,
            max_positions: 100,
        }
    }

    pub fn open_position(
        &mut self,
        symbol: String,
        direction: PositionDirection,
        size: f64,
        entry_price: f64,
    ) -> Result<String> {
        if self.positions.len() >= self.max_positions {
            return Err(anyhow::anyhow!("Maximum number of positions reached"));
        }

        let position = Position::new(symbol, direction, size, entry_price);
        let position_id = position.id.clone();
        self.positions.insert(position_id.clone(), position);
        
        Ok(position_id)
    }

    pub fn close_position(&mut self, position_id: &str, exit_price: f64) -> Result<f64> {
        if let Some(mut position) = self.positions.remove(position_id) {
            let realized_pnl = position.close_position(exit_price);
            self.total_realized_pnl += realized_pnl;
            self.closed_positions.push(position);
            Ok(realized_pnl)
        } else {
            Err(anyhow::anyhow!("Position not found: {}", position_id))
        }
    }

    pub fn update_position_price(&mut self, position_id: &str, new_price: f64) -> Result<()> {
        if let Some(position) = self.positions.get_mut(position_id) {
            position.update_price(new_price);
            Ok(())
        } else {
            Err(anyhow::anyhow!("Position not found: {}", position_id))
        }
    }

    pub fn update_all_positions(&mut self, market_prices: &HashMap<String, f64>) {
        for position in self.positions.values_mut() {
            if let Some(&price) = market_prices.get(&position.symbol) {
                position.update_price(price);
            }
        }
        self.calculate_total_unrealized_pnl();
    }

    pub fn get_position(&self, position_id: &str) -> Option<&Position> {
        self.positions.get(position_id)
    }

    pub fn get_positions_by_symbol(&self, symbol: &str) -> Vec<&Position> {
        self.positions.values()
            .filter(|pos| pos.symbol == symbol)
            .collect()
    }

    pub fn get_all_positions(&self) -> Vec<&Position> {
        self.positions.values().collect()
    }

    pub fn get_open_positions_count(&self) -> usize {
        self.positions.len()
    }

    pub fn calculate_total_unrealized_pnl(&mut self) {
        self.total_unrealized_pnl = self.positions.values()
            .map(|pos| pos.unrealized_pnl)
            .sum();
    }

    pub fn get_total_pnl(&self) -> f64 {
        self.total_realized_pnl + self.total_unrealized_pnl
    }

    pub fn get_total_realized_pnl(&self) -> f64 {
        self.total_realized_pnl
    }

    pub fn get_total_unrealized_pnl(&self) -> f64 {
        self.total_unrealized_pnl
    }

    pub fn check_stop_losses(&self) -> Vec<String> {
        self.positions.values()
            .filter(|pos| pos.should_trigger_stop_loss())
            .map(|pos| pos.id.clone())
            .collect()
    }

    pub fn check_take_profits(&self) -> Vec<String> {
        self.positions.values()
            .filter(|pos| pos.should_trigger_take_profit())
            .map(|pos| pos.id.clone())
            .collect()
    }

    pub fn get_position_summary(&self) -> HashMap<String, f64> {
        let mut summary = HashMap::new();
        summary.insert("total_positions".to_string(), self.positions.len() as f64);
        summary.insert("total_realized_pnl".to_string(), self.total_realized_pnl);
        summary.insert("total_unrealized_pnl".to_string(), self.total_unrealized_pnl);
        summary.insert("total_pnl".to_string(), self.get_total_pnl());
        
        let long_positions = self.positions.values()
            .filter(|pos| matches!(pos.direction, PositionDirection::Long))
            .count() as f64;
        let short_positions = self.positions.values()
            .filter(|pos| matches!(pos.direction, PositionDirection::Short))
            .count() as f64;
        
        summary.insert("long_positions".to_string(), long_positions);
        summary.insert("short_positions".to_string(), short_positions);
        
        summary
    }

    pub fn clear_closed_positions(&mut self) {
        self.closed_positions.clear();
    }

    pub fn get_closed_positions(&self) -> &Vec<Position> {
        &self.closed_positions
    }
}

impl Default for PositionManager {
    fn default() -> Self {
        Self::new()
    }
}
