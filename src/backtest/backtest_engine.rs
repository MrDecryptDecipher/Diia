use std::collections::HashMap;
use chrono::{DateTime, Utc, TimeZone};
use tracing::{info, warn, error, debug};
use serde::{Serialize, Deserialize};

use crate::exchange::types::Candle;
use crate::position::position_manager::{PositionManager, Position, PositionDirection, PositionStatus};
use crate::strategy::advanced_strategy::AdvancedStrategy;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BacktestConfig {
    pub initial_capital: f64,
    pub symbols: Vec<String>,
    pub start_date: DateTime<Utc>,
    pub end_date: DateTime<Utc>,
    pub risk_per_trade: f64,
    pub max_positions: usize,
    pub commission_rate: f64,
    pub slippage: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BacktestResult {
    pub initial_capital: f64,
    pub final_capital: f64,
    pub total_return: f64,
    pub total_return_pct: f64,
    pub total_trades: usize,
    pub winning_trades: usize,
    pub losing_trades: usize,
    pub win_rate: f64,
    pub max_drawdown: f64,
    pub max_drawdown_pct: f64,
    pub sharpe_ratio: f64,
    pub profit_factor: f64,
    pub trades: Vec<BacktestTrade>,
    pub equity_curve: Vec<(DateTime<Utc>, f64)>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BacktestTrade {
    pub symbol: String,
    pub direction: PositionDirection,
    pub entry_price: f64,
    pub entry_time: DateTime<Utc>,
    pub exit_price: f64,
    pub exit_time: DateTime<Utc>,
    pub quantity: f64,
    pub profit_loss: f64,
    pub profit_loss_pct: f64,
    pub commission: f64,
    pub slippage: f64,
    pub net_profit_loss: f64,
}

pub struct BacktestEngine {
    config: BacktestConfig,
    position_manager: PositionManager,
    strategy: AdvancedStrategy,
    current_capital: f64,
    equity_curve: Vec<(DateTime<Utc>, f64)>,
    trades: Vec<BacktestTrade>,
    candle_data: HashMap<String, Vec<Candle>>,
    current_prices: HashMap<String, f64>,
    max_capital: f64,
    min_capital: f64,
}

impl BacktestEngine {
    pub fn new(config: BacktestConfig) -> Self {
        let position_manager = PositionManager::new(config.max_positions, config.risk_per_trade);
        let strategy = AdvancedStrategy::new("Backtest", config.risk_per_trade, 1.5);

        Self {
            current_capital: config.initial_capital,
            max_capital: config.initial_capital,
            min_capital: config.initial_capital,
            equity_curve: vec![(Utc::now(), config.initial_capital)],
            trades: Vec::new(),
            candle_data: HashMap::new(),
            current_prices: HashMap::new(),
            config,
            position_manager,
            strategy,
        }
    }

    pub fn load_candle_data(&mut self, symbol: &str, candles: Vec<Candle>) {
        // Filter candles by date range
        let filtered_candles: Vec<Candle> = candles.into_iter()
            .filter(|c| c.timestamp >= self.config.start_date && c.timestamp <= self.config.end_date)
            .collect();

        if filtered_candles.is_empty() {
            warn!("No candles found for {} in the specified date range", symbol);
            return;
        }

        info!("Loaded {} candles for {} in the date range", filtered_candles.len(), symbol);
        self.candle_data.insert(symbol.to_string(), filtered_candles);
    }

    pub fn run_backtest(&mut self) -> BacktestResult {
        info!("Starting backtest with initial capital: ${:.2}", self.current_capital);

        // Get all timestamps from all symbols
        let mut all_timestamps = Vec::new();
        for candles in self.candle_data.values() {
            for candle in candles {
                if !all_timestamps.contains(&candle.timestamp) {
                    all_timestamps.push(candle.timestamp);
                }
            }
        }

        // Sort timestamps
        all_timestamps.sort();

        // Iterate through each timestamp
        for timestamp in all_timestamps {
            debug!("Processing timestamp: {}", timestamp);

            // Update current prices for all symbols
            for (symbol, candles) in &self.candle_data {
                if let Some(candle) = candles.iter().find(|c| c.timestamp == timestamp) {
                    self.current_prices.insert(symbol.clone(), candle.close);
                }
            }

            // Update existing positions
            self.position_manager.update_positions(&self.current_prices);

            // Process signals for each symbol
            for (symbol, candles) in &self.candle_data {
                // Find candles up to current timestamp
                let current_candles: Vec<Candle> = candles.iter()
                    .filter(|c| c.timestamp <= timestamp)
                    .cloned()
                    .collect();

                if current_candles.len() >= 50 {  // Ensure enough data for analysis
                    // Generate trading signals
                    if let Some(signal) = self.strategy.analyze(symbol, &current_candles, self.current_capital) {
                        match signal {
                            crate::engine::message_bus::Message::TradeSignal {
                                symbol,
                                direction,
                                entry_price,
                                stop_loss_price,
                                take_profit_price,
                                ..
                            } => {
                                let position_direction = match direction {
                                    crate::engine::message_bus::TradeDirection::Long => PositionDirection::Long,
                                    crate::engine::message_bus::TradeDirection::Short => PositionDirection::Short,
                                    crate::engine::message_bus::TradeDirection::Neutral => {
                                        // Skip neutral signals
                                        debug!("Skipping neutral signal for {}", symbol);
                                        continue;
                                    }
                                };

                                // Calculate position size
                                let position_size = self.position_manager.calculate_position_size(
                                    self.current_capital,
                                    entry_price,
                                    stop_loss_price,
                                );

                                // Apply slippage to entry price
                                let adjusted_entry_price = match position_direction {
                                    PositionDirection::Long => entry_price * (1.0 + self.config.slippage),
                                    PositionDirection::Short => entry_price * (1.0 - self.config.slippage),
                                };

                                // Open position
                                if let Ok(position_id) = self.position_manager.open_position(
                                    &symbol,
                                    position_direction,
                                    adjusted_entry_price,
                                    position_size,
                                    stop_loss_price,
                                    take_profit_price,
                                ) {
                                    info!("Opened backtest position: {} for {} at ${:.2}",
                                          position_id, symbol, adjusted_entry_price);
                                }
                            },
                            _ => {}
                        }
                    }
                }
            }

            // Check for closed positions and record trades
            for position in self.position_manager.get_closed_positions() {
                if let (Some(exit_price), Some(exit_time)) = (position.exit_price, position.exit_time) {
                    if exit_time.date_naive() == timestamp.date_naive() {
                        // Calculate commission
                        let entry_commission = position.entry_price * position.quantity * self.config.commission_rate;
                        let exit_commission = exit_price * position.quantity * self.config.commission_rate;
                        let total_commission = entry_commission + exit_commission;

                        // Calculate slippage
                        let slippage_amount = match position.direction {
                            PositionDirection::Long => exit_price * position.quantity * self.config.slippage,
                            PositionDirection::Short => exit_price * position.quantity * self.config.slippage,
                        };

                        // Calculate net profit/loss
                        let gross_pnl = position.realized_pnl.unwrap_or(0.0);
                        let net_pnl = gross_pnl - total_commission - slippage_amount;

                        // Update capital
                        self.current_capital += net_pnl;

                        // Update max/min capital
                        self.max_capital = self.max_capital.max(self.current_capital);
                        self.min_capital = self.min_capital.min(self.current_capital);

                        // Record trade
                        let trade = BacktestTrade {
                            symbol: position.symbol.clone(),
                            direction: position.direction.clone(),
                            entry_price: position.entry_price,
                            entry_time: position.entry_time,
                            exit_price,
                            exit_time,
                            quantity: position.quantity,
                            profit_loss: gross_pnl,
                            profit_loss_pct: gross_pnl / (position.entry_price * position.quantity),
                            commission: total_commission,
                            slippage: slippage_amount,
                            net_profit_loss: net_pnl,
                        };

                        self.trades.push(trade);

                        info!("Recorded backtest trade for {}: PnL=${:.2}, Net=${:.2}",
                              position.symbol, gross_pnl, net_pnl);
                    }
                }
            }

            // Record equity curve point
            self.equity_curve.push((timestamp, self.current_capital));
        }

        // Calculate backtest results
        self.calculate_results()
    }

    fn calculate_results(&self) -> BacktestResult {
        let total_trades = self.trades.len();
        let winning_trades = self.trades.iter().filter(|t| t.net_profit_loss > 0.0).count();
        let losing_trades = self.trades.iter().filter(|t| t.net_profit_loss <= 0.0).count();

        let win_rate = if total_trades > 0 {
            winning_trades as f64 / total_trades as f64
        } else {
            0.0
        };

        let total_profit = self.trades.iter()
            .filter(|t| t.net_profit_loss > 0.0)
            .map(|t| t.net_profit_loss)
            .sum::<f64>();

        let total_loss = self.trades.iter()
            .filter(|t| t.net_profit_loss <= 0.0)
            .map(|t| t.net_profit_loss.abs())
            .sum::<f64>();

        let profit_factor = if total_loss > 0.0 {
            total_profit / total_loss
        } else {
            if total_profit > 0.0 { f64::INFINITY } else { 0.0 }
        };

        // Calculate max drawdown
        let max_drawdown = self.max_capital - self.min_capital;
        let max_drawdown_pct = if self.max_capital > 0.0 {
            max_drawdown / self.max_capital
        } else {
            0.0
        };

        // Calculate Sharpe ratio (simplified)
        let returns: Vec<f64> = self.equity_curve.windows(2)
            .map(|w| (w[1].1 - w[0].1) / w[0].1)
            .collect();

        let avg_return = if returns.is_empty() {
            0.0
        } else {
            returns.iter().sum::<f64>() / returns.len() as f64
        };

        let std_dev = if returns.len() > 1 {
            let variance = returns.iter()
                .map(|r| (r - avg_return).powi(2))
                .sum::<f64>() / (returns.len() - 1) as f64;
            variance.sqrt()
        } else {
            0.0
        };

        let sharpe_ratio = if std_dev > 0.0 {
            avg_return / std_dev
        } else {
            0.0
        };

        BacktestResult {
            initial_capital: self.config.initial_capital,
            final_capital: self.current_capital,
            total_return: self.current_capital - self.config.initial_capital,
            total_return_pct: (self.current_capital / self.config.initial_capital) - 1.0,
            total_trades,
            winning_trades,
            losing_trades,
            win_rate,
            max_drawdown,
            max_drawdown_pct,
            sharpe_ratio,
            profit_factor,
            trades: self.trades.clone(),
            equity_curve: self.equity_curve.clone(),
        }
    }
}
