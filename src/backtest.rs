//! Backtesting Framework Module for OMNI Trading System
//!
//! This module provides comprehensive backtesting capabilities for strategy validation.

use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use anyhow::Result;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BacktestConfig {
    pub start_date: u64,
    pub end_date: u64,
    pub initial_capital: f64,
    pub symbols: Vec<String>,
    pub timeframe: String,
    pub commission_rate: f64,
    pub slippage: f64,
    pub max_positions: usize,
}

impl BacktestConfig {
    pub fn new(
        start_date: u64,
        end_date: u64,
        initial_capital: f64,
        symbols: Vec<String>,
    ) -> Self {
        Self {
            start_date,
            end_date,
            initial_capital,
            symbols,
            timeframe: "1h".to_string(),
            commission_rate: 0.001, // 0.1%
            slippage: 0.0005, // 0.05%
            max_positions: 10,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BacktestTrade {
    pub id: String,
    pub symbol: String,
    pub entry_time: u64,
    pub exit_time: u64,
    pub entry_price: f64,
    pub exit_price: f64,
    pub quantity: f64,
    pub side: String, // "long" or "short"
    pub profit_loss: f64,
    pub commission: f64,
    pub return_percentage: f64,
}

impl BacktestTrade {
    pub fn new(
        symbol: String,
        entry_time: u64,
        entry_price: f64,
        quantity: f64,
        side: String,
    ) -> Self {
        let id = format!("trade_{}_{}", entry_time, rand::random::<u32>());
        
        Self {
            id,
            symbol,
            entry_time,
            exit_time: 0,
            entry_price,
            exit_price: 0.0,
            quantity,
            side,
            profit_loss: 0.0,
            commission: 0.0,
            return_percentage: 0.0,
        }
    }

    pub fn close_trade(&mut self, exit_time: u64, exit_price: f64, commission_rate: f64) {
        self.exit_time = exit_time;
        self.exit_price = exit_price;
        
        // Calculate P&L
        let price_diff = if self.side == "long" {
            exit_price - self.entry_price
        } else {
            self.entry_price - exit_price
        };
        
        self.profit_loss = price_diff * self.quantity;
        self.commission = (self.entry_price + exit_price) * self.quantity * commission_rate;
        self.profit_loss -= self.commission;
        
        // Calculate return percentage
        let investment = self.entry_price * self.quantity;
        self.return_percentage = if investment > 0.0 {
            (self.profit_loss / investment) * 100.0
        } else {
            0.0
        };
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BacktestResult {
    pub config: BacktestConfig,
    pub trades: Vec<BacktestTrade>,
    pub total_trades: u32,
    pub winning_trades: u32,
    pub losing_trades: u32,
    pub win_rate: f64,
    pub total_profit_loss: f64,
    pub total_return: f64,
    pub max_drawdown: f64,
    pub sharpe_ratio: f64,
    pub sortino_ratio: f64,
    pub profit_factor: f64,
    pub average_win: f64,
    pub average_loss: f64,
    pub largest_win: f64,
    pub largest_loss: f64,
    pub total_commission: f64,
    pub final_capital: f64,
    pub duration_days: f64,
}

impl BacktestResult {
    pub fn new(config: BacktestConfig, trades: Vec<BacktestTrade>) -> Self {
        let mut result = Self {
            config: config.clone(),
            trades: trades.clone(),
            total_trades: trades.len() as u32,
            winning_trades: 0,
            losing_trades: 0,
            win_rate: 0.0,
            total_profit_loss: 0.0,
            total_return: 0.0,
            max_drawdown: 0.0,
            sharpe_ratio: 0.0,
            sortino_ratio: 0.0,
            profit_factor: 0.0,
            average_win: 0.0,
            average_loss: 0.0,
            largest_win: 0.0,
            largest_loss: 0.0,
            total_commission: 0.0,
            final_capital: config.initial_capital,
            duration_days: ((config.end_date - config.start_date) as f64) / 86400.0,
        };

        result.calculate_metrics();
        result
    }

    fn calculate_metrics(&mut self) {
        if self.trades.is_empty() {
            return;
        }

        let mut wins = Vec::new();
        let mut losses = Vec::new();
        let mut running_capital = self.config.initial_capital;
        let mut peak_capital = running_capital;
        let mut max_drawdown = 0.0;

        for trade in &self.trades {
            self.total_profit_loss += trade.profit_loss;
            self.total_commission += trade.commission;
            running_capital += trade.profit_loss;

            if trade.profit_loss > 0.0 {
                self.winning_trades += 1;
                wins.push(trade.profit_loss);
                if trade.profit_loss > self.largest_win {
                    self.largest_win = trade.profit_loss;
                }
            } else if trade.profit_loss < 0.0 {
                self.losing_trades += 1;
                losses.push(trade.profit_loss.abs());
                if trade.profit_loss < self.largest_loss {
                    self.largest_loss = trade.profit_loss;
                }
            }

            // Track drawdown
            if running_capital > peak_capital {
                peak_capital = running_capital;
            } else {
                let drawdown = (peak_capital - running_capital) / peak_capital;
                if drawdown > max_drawdown {
                    max_drawdown = drawdown;
                }
            }
        }

        self.final_capital = running_capital;
        self.max_drawdown = max_drawdown * 100.0; // Convert to percentage

        // Calculate win rate
        if self.total_trades > 0 {
            self.win_rate = (self.winning_trades as f64 / self.total_trades as f64) * 100.0;
        }

        // Calculate total return
        if self.config.initial_capital > 0.0 {
            self.total_return = ((self.final_capital - self.config.initial_capital) / self.config.initial_capital) * 100.0;
        }

        // Calculate average win/loss
        if !wins.is_empty() {
            self.average_win = wins.iter().sum::<f64>() / wins.len() as f64;
        }
        if !losses.is_empty() {
            self.average_loss = losses.iter().sum::<f64>() / losses.len() as f64;
        }

        // Calculate profit factor
        let total_wins: f64 = wins.iter().sum();
        let total_losses: f64 = losses.iter().sum();
        if total_losses > 0.0 {
            self.profit_factor = total_wins / total_losses;
        }

        // Calculate Sharpe ratio (simplified)
        if self.duration_days > 0.0 {
            let daily_return = self.total_return / self.duration_days;
            let risk_free_rate = 0.02; // 2% annual risk-free rate
            let daily_risk_free = risk_free_rate / 365.0;
            
            // Simplified Sharpe calculation
            if self.max_drawdown > 0.0 {
                self.sharpe_ratio = (daily_return - daily_risk_free) / (self.max_drawdown / 100.0);
            }
        }

        // Calculate Sortino ratio (simplified)
        if !losses.is_empty() {
            let downside_deviation = (losses.iter().map(|l| l * l).sum::<f64>() / losses.len() as f64).sqrt();
            if downside_deviation > 0.0 {
                self.sortino_ratio = self.total_return / downside_deviation;
            }
        }
    }

    pub fn print_summary(&self) {
        println!("=== Backtest Results ===");
        println!("Total Trades: {}", self.total_trades);
        println!("Winning Trades: {}", self.winning_trades);
        println!("Losing Trades: {}", self.losing_trades);
        println!("Win Rate: {:.2}%", self.win_rate);
        println!("Total P&L: ${:.2}", self.total_profit_loss);
        println!("Total Return: {:.2}%", self.total_return);
        println!("Max Drawdown: {:.2}%", self.max_drawdown);
        println!("Sharpe Ratio: {:.2}", self.sharpe_ratio);
        println!("Profit Factor: {:.2}", self.profit_factor);
        println!("Average Win: ${:.2}", self.average_win);
        println!("Average Loss: ${:.2}", self.average_loss);
        println!("Final Capital: ${:.2}", self.final_capital);
    }
}

#[derive(Debug, Clone)]
pub struct BacktestEngine {
    config: BacktestConfig,
    trades: Vec<BacktestTrade>,
    current_capital: f64,
    open_positions: HashMap<String, BacktestTrade>,
}

impl BacktestEngine {
    pub fn new(config: BacktestConfig) -> Self {
        let current_capital = config.initial_capital;
        Self {
            config,
            trades: Vec::new(),
            current_capital,
            open_positions: HashMap::new(),
        }
    }

    pub fn open_position(
        &mut self,
        symbol: String,
        entry_time: u64,
        entry_price: f64,
        quantity: f64,
        side: String,
    ) -> Result<String> {
        if self.open_positions.len() >= self.config.max_positions {
            return Err(anyhow::anyhow!("Maximum positions reached"));
        }

        let position_cost = entry_price * quantity;
        if position_cost > self.current_capital {
            return Err(anyhow::anyhow!("Insufficient capital"));
        }

        let trade = BacktestTrade::new(symbol.clone(), entry_time, entry_price, quantity, side);
        let trade_id = trade.id.clone();
        
        self.open_positions.insert(trade_id.clone(), trade);
        self.current_capital -= position_cost;
        
        Ok(trade_id)
    }

    pub fn close_position(&mut self, trade_id: &str, exit_time: u64, exit_price: f64) -> Result<f64> {
        if let Some(mut trade) = self.open_positions.remove(trade_id) {
            trade.close_trade(exit_time, exit_price, self.config.commission_rate);
            
            let position_value = exit_price * trade.quantity;
            self.current_capital += position_value;
            
            let profit_loss = trade.profit_loss;
            self.trades.push(trade);
            
            Ok(profit_loss)
        } else {
            Err(anyhow::anyhow!("Trade not found: {}", trade_id))
        }
    }

    pub fn run_backtest(&mut self) -> Result<BacktestResult> {
        // Close any remaining open positions at the end
        let end_time = self.config.end_date;
        let open_trade_ids: Vec<String> = self.open_positions.keys().cloned().collect();
        
        for trade_id in open_trade_ids {
            // Use last known price (simplified)
            let exit_price = 45000.0; // This should come from actual market data
            let _ = self.close_position(&trade_id, end_time, exit_price);
        }

        Ok(BacktestResult::new(self.config.clone(), self.trades.clone()))
    }

    pub fn get_current_capital(&self) -> f64 {
        self.current_capital
    }

    pub fn get_open_positions_count(&self) -> usize {
        self.open_positions.len()
    }
}
