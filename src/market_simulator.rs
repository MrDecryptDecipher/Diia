//! Market Simulator Module for OMNI Trading System
//!
//! This module provides market simulation capabilities for backtesting
//! and strategy validation.

use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use anyhow::Result;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarketData {
    pub symbol: String,
    pub timestamp: u64,
    pub open: f64,
    pub high: f64,
    pub low: f64,
    pub close: f64,
    pub volume: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimulationConfig {
    pub start_time: u64,
    pub end_time: u64,
    pub initial_capital: f64,
    pub symbols: Vec<String>,
    pub timeframe: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimulationResult {
    pub total_trades: u32,
    pub winning_trades: u32,
    pub losing_trades: u32,
    pub total_profit: f64,
    pub max_drawdown: f64,
    pub sharpe_ratio: f64,
    pub win_rate: f64,
}

#[derive(Debug, Clone)]
pub struct MarketSimulator {
    config: SimulationConfig,
    market_data: HashMap<String, Vec<MarketData>>,
    current_time: u64,
    current_capital: f64,
}

impl MarketSimulator {
    pub fn new(config: SimulationConfig) -> Self {
        let initial_capital = config.initial_capital;
        Self {
            config,
            market_data: HashMap::new(),
            current_time: 0,
            current_capital: initial_capital,
        }
    }

    pub fn load_market_data(&mut self, symbol: String, data: Vec<MarketData>) {
        self.market_data.insert(symbol, data);
    }

    pub fn run_simulation(&mut self) -> Result<SimulationResult> {
        let mut total_trades = 0;
        let mut winning_trades = 0;
        let mut losing_trades = 0;
        let mut total_profit = 0.0;
        let mut max_drawdown = 0.0;

        // Simulate trading over the time period
        self.current_time = self.config.start_time;
        
        while self.current_time <= self.config.end_time {
            // Process market data for current time
            for symbol in &self.config.symbols {
                if let Some(data) = self.market_data.get(symbol) {
                    if let Some(current_data) = data.iter().find(|d| d.timestamp == self.current_time) {
                        // Simulate trading decision
                        if let Some(trade_result) = self.simulate_trade(symbol, current_data) {
                            total_trades += 1;
                            if trade_result > 0.0 {
                                winning_trades += 1;
                            } else {
                                losing_trades += 1;
                            }
                            total_profit += trade_result;
                            self.current_capital += trade_result;
                            
                            // Update max drawdown
                            let drawdown = (self.config.initial_capital - self.current_capital) / self.config.initial_capital;
                            if drawdown > max_drawdown {
                                max_drawdown = drawdown;
                            }
                        }
                    }
                }
            }
            
            // Advance time (assuming 1 hour intervals)
            self.current_time += 3600;
        }

        let win_rate = if total_trades > 0 {
            (winning_trades as f64 / total_trades as f64) * 100.0
        } else {
            0.0
        };

        let sharpe_ratio = if total_profit != 0.0 {
            total_profit / (total_profit.abs() * 0.1) // Simplified Sharpe ratio
        } else {
            0.0
        };

        Ok(SimulationResult {
            total_trades,
            winning_trades,
            losing_trades,
            total_profit,
            max_drawdown,
            sharpe_ratio,
            win_rate,
        })
    }

    fn simulate_trade(&self, _symbol: &str, data: &MarketData) -> Option<f64> {
        // Simple simulation logic - buy low, sell high
        let trade_size = self.current_capital * 0.1; // Use 10% of capital
        
        // Simulate a simple momentum strategy
        if data.close > data.open {
            // Bullish candle - simulate buy
            let profit_percentage = (data.high - data.close) / data.close;
            Some(trade_size * profit_percentage)
        } else {
            // Bearish candle - simulate sell
            let loss_percentage = (data.close - data.low) / data.close;
            Some(-trade_size * loss_percentage)
        }
    }

    pub fn get_current_capital(&self) -> f64 {
        self.current_capital
    }

    pub fn get_config(&self) -> &SimulationConfig {
        &self.config
    }
}
