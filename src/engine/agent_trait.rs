//! Agent Trait Module for OMNI Trading System
//!
//! This module defines the core Agent trait that all trading agents must implement.

use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use anyhow::Result;
use async_trait::async_trait;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentContext {
    pub agent_id: String,
    pub trading_capital: f64,
    pub max_position_size: f64,
    pub risk_tolerance: f64,
    pub active_positions: HashMap<String, f64>,
    pub performance_metrics: HashMap<String, f64>,
    pub market_data: HashMap<String, f64>,
}

impl AgentContext {
    pub fn new(agent_id: String) -> Self {
        Self {
            agent_id,
            trading_capital: 0.0,
            max_position_size: 0.0,
            risk_tolerance: 0.1,
            active_positions: HashMap::new(),
            performance_metrics: HashMap::new(),
            market_data: HashMap::new(),
        }
    }

    pub fn set_value(&mut self, key: String, value: String) {
        if let Ok(float_value) = value.parse::<f64>() {
            match key.as_str() {
                "trading_capital" => self.trading_capital = float_value,
                "max_position_size" => self.max_position_size = float_value,
                "risk_tolerance" => self.risk_tolerance = float_value,
                _ => {
                    self.performance_metrics.insert(key, float_value);
                }
            }
        }
    }

    pub fn get_value(&self, key: &str) -> Option<f64> {
        match key {
            "trading_capital" => Some(self.trading_capital),
            "max_position_size" => Some(self.max_position_size),
            "risk_tolerance" => Some(self.risk_tolerance),
            _ => self.performance_metrics.get(key).copied(),
        }
    }

    pub fn update_position(&mut self, symbol: String, size: f64) {
        if size == 0.0 {
            self.active_positions.remove(&symbol);
        } else {
            self.active_positions.insert(symbol, size);
        }
    }

    pub fn get_position(&self, symbol: &str) -> f64 {
        self.active_positions.get(symbol).copied().unwrap_or(0.0)
    }

    pub fn update_market_data(&mut self, symbol: String, price: f64) {
        self.market_data.insert(symbol, price);
    }

    pub fn get_market_price(&self, symbol: &str) -> Option<f64> {
        self.market_data.get(symbol).copied()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentDecision {
    pub action: String,
    pub symbol: String,
    pub quantity: f64,
    pub price: f64,
    pub confidence: f64,
    pub reasoning: String,
    pub timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentPerformance {
    pub total_trades: u32,
    pub winning_trades: u32,
    pub total_profit: f64,
    pub win_rate: f64,
    pub sharpe_ratio: f64,
    pub max_drawdown: f64,
    pub last_updated: u64,
}

impl AgentPerformance {
    pub fn new() -> Self {
        Self {
            total_trades: 0,
            winning_trades: 0,
            total_profit: 0.0,
            win_rate: 0.0,
            sharpe_ratio: 0.0,
            max_drawdown: 0.0,
            last_updated: 0,
        }
    }

    pub fn update_trade(&mut self, profit: f64) {
        self.total_trades += 1;
        if profit > 0.0 {
            self.winning_trades += 1;
        }
        self.total_profit += profit;
        self.win_rate = (self.winning_trades as f64 / self.total_trades as f64) * 100.0;
        self.last_updated = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();
    }
}

impl Default for AgentPerformance {
    fn default() -> Self {
        Self::new()
    }
}

/// Core trait that all trading agents must implement
#[async_trait]
pub trait Agent: Send + Sync {
    /// Get the agent's unique identifier
    fn get_id(&self) -> String;

    /// Get the agent's name
    fn get_name(&self) -> String;

    /// Get the agent's description
    fn get_description(&self) -> String;

    /// Initialize the agent with context
    async fn initialize(&mut self, context: &mut AgentContext) -> Result<()>;

    /// Process market data and make trading decisions
    async fn process_market_data(
        &mut self,
        context: &mut AgentContext,
        market_data: &HashMap<String, f64>,
    ) -> Result<Vec<AgentDecision>>;

    /// Update the agent with trade execution results
    async fn update_trade_result(
        &mut self,
        context: &mut AgentContext,
        decision: &AgentDecision,
        executed_price: f64,
        executed_quantity: f64,
        profit_loss: f64,
    ) -> Result<()>;

    /// Get the agent's current performance metrics
    async fn get_performance(&self) -> Result<AgentPerformance>;

    /// Check if the agent is ready to trade
    async fn is_ready(&self) -> bool;

    /// Get the agent's risk tolerance (0.0 to 1.0)
    async fn get_risk_tolerance(&self) -> f64;

    /// Get the agent's preferred trading symbols
    async fn get_preferred_symbols(&self) -> Vec<String>;

    /// Shutdown the agent gracefully
    async fn shutdown(&mut self) -> Result<()>;

    /// Get agent-specific configuration
    async fn get_config(&self) -> Result<HashMap<String, String>>;

    /// Update agent configuration
    async fn update_config(&mut self, config: HashMap<String, String>) -> Result<()>;

    /// Validate a trading decision before execution
    async fn validate_decision(
        &self,
        context: &AgentContext,
        decision: &AgentDecision,
    ) -> Result<bool>;

    /// Get the agent's current status
    async fn get_status(&self) -> String;

    /// Handle emergency stop signal
    async fn emergency_stop(&mut self) -> Result<()>;
}

/// Utility functions for agent implementations
pub mod agent_utils {
    use super::*;

    pub fn calculate_position_size(
        capital: f64,
        risk_tolerance: f64,
        price: f64,
        stop_loss_percentage: f64,
    ) -> f64 {
        let risk_amount = capital * risk_tolerance;
        let price_risk = price * stop_loss_percentage;
        if price_risk > 0.0 {
            risk_amount / price_risk
        } else {
            0.0
        }
    }

    pub fn calculate_stop_loss(entry_price: f64, risk_percentage: f64, is_long: bool) -> f64 {
        if is_long {
            entry_price * (1.0 - risk_percentage)
        } else {
            entry_price * (1.0 + risk_percentage)
        }
    }

    pub fn calculate_take_profit(entry_price: f64, profit_percentage: f64, is_long: bool) -> f64 {
        if is_long {
            entry_price * (1.0 + profit_percentage)
        } else {
            entry_price * (1.0 - profit_percentage)
        }
    }

    pub fn validate_trade_size(size: f64, max_size: f64, min_size: f64) -> bool {
        size >= min_size && size <= max_size && size > 0.0
    }

    pub fn calculate_profit_loss(
        entry_price: f64,
        exit_price: f64,
        quantity: f64,
        is_long: bool,
    ) -> f64 {
        if is_long {
            (exit_price - entry_price) * quantity
        } else {
            (entry_price - exit_price) * quantity
        }
    }
}
