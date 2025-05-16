use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use chrono::{DateTime, Duration, Utc};
use anyhow::{Result, anyhow};
use tracing::{debug, info, warn, error};

use crate::strategy::simple_strategy::Candle;
use crate::engine::message_bus::{MessageBus, TradeSignal, TradeDirection};
use crate::data::historical_data_loader::HistoricalDataLoader;
use crate::exchange::bybit::types::KlineInterval;

/// Backtest trade
#[derive(Debug, Clone)]
pub struct BacktestTrade {
    /// Symbol
    pub symbol: String,
    /// Entry price
    pub entry_price: f64,
    /// Exit price
    pub exit_price: Option<f64>,
    /// Position size
    pub position_size: f64,
    /// Direction
    pub direction: TradeDirection,
    /// Entry time
    pub entry_time: DateTime<Utc>,
    /// Exit time
    pub exit_time: Option<DateTime<Utc>>,
    /// Profit/loss
    pub pnl: f64,
    /// Return on investment
    pub roi: f64,
}

/// Backtest result
#[derive(Debug, Clone)]
pub struct BacktestResult {
    /// Initial capital
    pub initial_capital: f64,
    /// Final capital
    pub final_capital: f64,
    /// Total profit/loss
    pub total_pnl: f64,
    /// Return on investment
    pub roi: f64,
    /// Number of trades
    pub num_trades: usize,
    /// Number of winning trades
    pub winning_trades: usize,
    /// Number of losing trades
    pub losing_trades: usize,
    /// Win rate
    pub win_rate: f64,
    /// Average profit per trade
    pub avg_profit_per_trade: f64,
    /// Average loss per trade
    pub avg_loss_per_trade: f64,
    /// Profit factor
    pub profit_factor: f64,
    /// Maximum drawdown
    pub max_drawdown: f64,
    /// Maximum drawdown percentage
    pub max_drawdown_pct: f64,
    /// Sharpe ratio
    pub sharpe_ratio: f64,
    /// Trades
    pub trades: Vec<BacktestTrade>,
    /// Equity curve
    pub equity_curve: Vec<(DateTime<Utc>, f64)>,
}

/// Backtest configuration
#[derive(Debug, Clone)]
pub struct BacktestConfig {
    /// Symbols to backtest
    pub symbols: Vec<String>,
    /// Start date
    pub start_date: DateTime<Utc>,
    /// End date
    pub end_date: DateTime<Utc>,
    /// Initial capital
    pub initial_capital: f64,
    /// Position size as percentage of capital
    pub position_size_pct: f64,
    /// Maximum number of concurrent positions
    pub max_positions: usize,
    /// Timeframe
    pub timeframe: KlineInterval,
    /// Commission rate
    pub commission_rate: f64,
    /// Slippage in percentage
    pub slippage_pct: f64,
}

impl Default for BacktestConfig {
    fn default() -> Self {
        Self {
            symbols: vec!["BTCUSDT".to_string(), "ETHUSDT".to_string()],
            start_date: Utc::now() - Duration::days(30),
            end_date: Utc::now(),
            initial_capital: 10000.0,
            position_size_pct: 0.1, // 10% of capital per position
            max_positions: 5,
            timeframe: KlineInterval::Hour1,
            commission_rate: 0.001, // 0.1%
            slippage_pct: 0.001, // 0.1%
        }
    }
}

/// Backtest engine
pub struct BacktestEngine {
    /// Configuration
    config: BacktestConfig,
    /// Historical data loader
    data_loader: Arc<HistoricalDataLoader>,
    /// Message bus
    message_bus: Arc<Mutex<MessageBus>>,
    /// Current capital
    capital: f64,
    /// Open positions
    open_positions: HashMap<String, BacktestTrade>,
    /// Closed trades
    closed_trades: Vec<BacktestTrade>,
    /// Equity curve
    equity_curve: Vec<(DateTime<Utc>, f64)>,
    /// Current timestamp
    current_time: DateTime<Utc>,
    /// Historical data cache
    historical_data: HashMap<String, Vec<Candle>>,
}

impl BacktestEngine {
    /// Create a new backtest engine
    pub fn new(config: BacktestConfig, data_loader: Arc<HistoricalDataLoader>) -> Self {
        Self {
            config: config.clone(),
            data_loader,
            message_bus: Arc::new(Mutex::new(MessageBus::new())),
            capital: config.initial_capital,
            open_positions: HashMap::new(),
            closed_trades: Vec::new(),
            equity_curve: vec![(config.start_date, config.initial_capital)],
            current_time: config.start_date,
            historical_data: HashMap::new(),
        }
    }
    
    /// Get message bus
    pub fn message_bus(&self) -> Arc<Mutex<MessageBus>> {
        self.message_bus.clone()
    }
    
    /// Load historical data
    pub async fn load_data(&mut self) -> Result<()> {
        info!("Loading historical data for backtest");
        
        for symbol in &self.config.symbols {
            info!("Loading data for {}", symbol);
            
            // Calculate number of candles needed
            let duration = self.config.end_date.signed_duration_since(self.config.start_date);
            let candle_duration = match self.config.timeframe {
                KlineInterval::Min1 => Duration::minutes(1),
                KlineInterval::Min3 => Duration::minutes(3),
                KlineInterval::Min5 => Duration::minutes(5),
                KlineInterval::Min15 => Duration::minutes(15),
                KlineInterval::Min30 => Duration::minutes(30),
                KlineInterval::Hour1 => Duration::hours(1),
                KlineInterval::Hour2 => Duration::hours(2),
                KlineInterval::Hour4 => Duration::hours(4),
                KlineInterval::Hour6 => Duration::hours(6),
                KlineInterval::Hour12 => Duration::hours(12),
                KlineInterval::Day1 => Duration::days(1),
                KlineInterval::Week1 => Duration::weeks(1),
                KlineInterval::Month1 => Duration::days(30),
            };
            
            let num_candles = (duration.num_seconds() / candle_duration.num_seconds()) as usize + 100; // Add buffer
            
            // Load data
            let candles = self.data_loader.get_candles(
                symbol,
                self.config.timeframe.clone(),
                num_candles,
            ).await?;
            
            // Filter candles by date range
            let filtered_candles: Vec<Candle> = candles.into_iter()
                .filter(|c| c.timestamp >= self.config.start_date && c.timestamp <= self.config.end_date)
                .collect();
            
            if filtered_candles.is_empty() {
                return Err(anyhow!("No data available for {} in the specified date range", symbol));
            }
            
            info!("Loaded {} candles for {}", filtered_candles.len(), symbol);
            
            // Store data
            self.historical_data.insert(symbol.clone(), filtered_candles);
        }
        
        Ok(())
    }
    
    /// Run backtest
    pub async fn run(&mut self) -> Result<BacktestResult> {
        // Ensure data is loaded
        if self.historical_data.is_empty() {
            self.load_data().await?;
        }
        
        info!("Starting backtest from {} to {}", self.config.start_date, self.config.end_date);
        
        // Find the earliest timestamp across all symbols
        let mut earliest_timestamps = Vec::new();
        for candles in self.historical_data.values() {
            if let Some(first_candle) = candles.first() {
                earliest_timestamps.push(first_candle.timestamp);
            }
        }
        
        if earliest_timestamps.is_empty() {
            return Err(anyhow!("No data available for backtest"));
        }
        
        // Set current time to the latest of the earliest timestamps
        self.current_time = *earliest_timestamps.iter().max().unwrap();
        
        // Main backtest loop
        while self.current_time <= self.config.end_date {
            // Process signals
            self.process_signals().await?;
            
            // Update positions
            self.update_positions()?;
            
            // Update equity curve
            self.update_equity_curve()?;
            
            // Advance time to next candle
            self.advance_time()?;
        }
        
        // Close all open positions at the end
        self.close_all_positions()?;
        
        // Calculate results
        let result = self.calculate_results()?;
        
        info!("Backtest completed: ROI={:.2}%, Win rate={:.2}%, Profit factor={:.2}", 
            result.roi * 100.0, result.win_rate * 100.0, result.profit_factor);
        
        Ok(result)
    }
    
    /// Process signals from the message bus
    async fn process_signals(&mut self) -> Result<()> {
        let mut message_bus = self.message_bus.lock().await;
        let signals = message_bus.get_trade_signals();
        
        for signal in signals {
            match signal.direction {
                TradeDirection::Long => {
                    // Open long position
                    self.open_position(signal.symbol.clone(), TradeDirection::Long)?;
                }
                TradeDirection::Short => {
                    // Open short position
                    self.open_position(signal.symbol.clone(), TradeDirection::Short)?;
                }
                TradeDirection::Exit => {
                    // Close position
                    self.close_position(&signal.symbol)?;
                }
            }
        }
        
        // Clear signals
        message_bus.clear_trade_signals();
        
        Ok(())
    }
    
    /// Open a new position
    fn open_position(&mut self, symbol: String, direction: TradeDirection) -> Result<()> {
        // Check if we already have a position for this symbol
        if self.open_positions.contains_key(&symbol) {
            return Ok(());
        }
        
        // Check if we have reached the maximum number of positions
        if self.open_positions.len() >= self.config.max_positions {
            return Ok(());
        }
        
        // Get current price
        let current_price = self.get_current_price(&symbol)?;
        
        // Calculate position size
        let position_value = self.capital * self.config.position_size_pct;
        let position_size = position_value / current_price;
        
        // Apply slippage
        let entry_price = match direction {
            TradeDirection::Long => current_price * (1.0 + self.config.slippage_pct),
            TradeDirection::Short => current_price * (1.0 - self.config.slippage_pct),
            TradeDirection::Exit => return Err(anyhow!("Cannot open position with Exit direction")),
        };
        
        // Create trade
        let trade = BacktestTrade {
            symbol: symbol.clone(),
            entry_price,
            exit_price: None,
            position_size,
            direction,
            entry_time: self.current_time,
            exit_time: None,
            pnl: 0.0,
            roi: 0.0,
        };
        
        // Add to open positions
        self.open_positions.insert(symbol.clone(), trade);
        
        debug!("Opened {} position for {} at ${:.2}", 
            direction, symbol, entry_price);
        
        Ok(())
    }
    
    /// Close a position
    fn close_position(&mut self, symbol: &str) -> Result<()> {
        // Check if we have a position for this symbol
        if let Some(mut trade) = self.open_positions.remove(symbol) {
            // Get current price
            let current_price = self.get_current_price(symbol)?;
            
            // Apply slippage
            let exit_price = match trade.direction {
                TradeDirection::Long => current_price * (1.0 - self.config.slippage_pct),
                TradeDirection::Short => current_price * (1.0 + self.config.slippage_pct),
                TradeDirection::Exit => return Err(anyhow!("Invalid trade direction: Exit")),
            };
            
            // Calculate P&L
            let pnl = match trade.direction {
                TradeDirection::Long => (exit_price - trade.entry_price) * trade.position_size,
                TradeDirection::Short => (trade.entry_price - exit_price) * trade.position_size,
                TradeDirection::Exit => return Err(anyhow!("Invalid trade direction: Exit")),
            };
            
            // Apply commission
            let commission = exit_price * trade.position_size * self.config.commission_rate;
            let net_pnl = pnl - commission;
            
            // Calculate ROI
            let position_value = trade.entry_price * trade.position_size;
            let roi = net_pnl / position_value;
            
            // Update trade
            trade.exit_price = Some(exit_price);
            trade.exit_time = Some(self.current_time);
            trade.pnl = net_pnl;
            trade.roi = roi;
            
            // Update capital
            self.capital += net_pnl;
            
            // Add to closed trades
            self.closed_trades.push(trade.clone());
            
            debug!("Closed {} position for {} at ${:.2}, P&L=${:.2}, ROI={:.2}%", 
                trade.direction, symbol, exit_price, net_pnl, roi * 100.0);
        }
        
        Ok(())
    }
    
    /// Close all open positions
    fn close_all_positions(&mut self) -> Result<()> {
        let symbols: Vec<String> = self.open_positions.keys().cloned().collect();
        
        for symbol in symbols {
            self.close_position(&symbol)?;
        }
        
        Ok(())
    }
    
    /// Update positions
    fn update_positions(&mut self) -> Result<()> {
        // Check for stop loss and take profit
        let symbols: Vec<String> = self.open_positions.keys().cloned().collect();
        
        for symbol in symbols {
            // Get current price
            let current_price = self.get_current_price(&symbol)?;
            
            // Get trade
            if let Some(trade) = self.open_positions.get(&symbol) {
                // Calculate unrealized P&L
                let unrealized_pnl = match trade.direction {
                    TradeDirection::Long => (current_price - trade.entry_price) * trade.position_size,
                    TradeDirection::Short => (trade.entry_price - current_price) * trade.position_size,
                    TradeDirection::Exit => continue,
                };
                
                // Calculate ROI
                let position_value = trade.entry_price * trade.position_size;
                let roi = unrealized_pnl / position_value;
                
                // Check for stop loss (-5%)
                if roi < -0.05 {
                    debug!("Stop loss triggered for {}: ROI={:.2}%", symbol, roi * 100.0);
                    self.close_position(&symbol)?;
                }
                
                // Check for take profit (10%)
                if roi > 0.1 {
                    debug!("Take profit triggered for {}: ROI={:.2}%", symbol, roi * 100.0);
                    self.close_position(&symbol)?;
                }
            }
        }
        
        Ok(())
    }
    
    /// Update equity curve
    fn update_equity_curve(&mut self) -> Result<()> {
        // Calculate current equity
        let mut equity = self.capital;
        
        // Add unrealized P&L from open positions
        for (symbol, trade) in &self.open_positions {
            let current_price = self.get_current_price(symbol)?;
            
            let unrealized_pnl = match trade.direction {
                TradeDirection::Long => (current_price - trade.entry_price) * trade.position_size,
                TradeDirection::Short => (trade.entry_price - current_price) * trade.position_size,
                TradeDirection::Exit => 0.0,
            };
            
            equity += unrealized_pnl;
        }
        
        // Add to equity curve
        self.equity_curve.push((self.current_time, equity));
        
        Ok(())
    }
    
    /// Advance time to next candle
    fn advance_time(&mut self) -> Result<()> {
        // Find the next candle timestamp across all symbols
        let mut next_timestamps = Vec::new();
        
        for (symbol, candles) in &self.historical_data {
            // Find the next candle after current time
            for candle in candles {
                if candle.timestamp > self.current_time {
                    next_timestamps.push(candle.timestamp);
                    break;
                }
            }
        }
        
        if next_timestamps.is_empty() {
            // No more candles, end backtest
            self.current_time = self.config.end_date + Duration::seconds(1);
            return Ok(());
        }
        
        // Set current time to the earliest of the next timestamps
        self.current_time = *next_timestamps.iter().min().unwrap();
        
        // Update message bus with current candles
        let mut message_bus = self.message_bus.lock().await;
        
        for (symbol, candles) in &self.historical_data {
            // Find the current candle
            for candle in candles {
                if candle.timestamp == self.current_time {
                    message_bus.add_candle(symbol.clone(), candle.clone());
                    break;
                }
            }
        }
        
        Ok(())
    }
    
    /// Get current price for a symbol
    fn get_current_price(&self, symbol: &str) -> Result<f64> {
        // Find the most recent candle for this symbol
        if let Some(candles) = self.historical_data.get(symbol) {
            // Find the most recent candle before or at current time
            let mut most_recent = None;
            
            for candle in candles {
                if candle.timestamp <= self.current_time {
                    most_recent = Some(candle);
                } else {
                    break;
                }
            }
            
            if let Some(candle) = most_recent {
                return Ok(candle.close);
            }
        }
        
        Err(anyhow!("No price data available for {} at {}", symbol, self.current_time))
    }
    
    /// Calculate backtest results
    fn calculate_results(&self) -> Result<BacktestResult> {
        // Calculate basic metrics
        let initial_capital = self.config.initial_capital;
        let final_capital = self.capital;
        let total_pnl = final_capital - initial_capital;
        let roi = total_pnl / initial_capital;
        
        let num_trades = self.closed_trades.len();
        let winning_trades = self.closed_trades.iter().filter(|t| t.pnl > 0.0).count();
        let losing_trades = self.closed_trades.iter().filter(|t| t.pnl <= 0.0).count();
        
        let win_rate = if num_trades > 0 {
            winning_trades as f64 / num_trades as f64
        } else {
            0.0
        };
        
        // Calculate average profit and loss
        let total_profit: f64 = self.closed_trades.iter()
            .filter(|t| t.pnl > 0.0)
            .map(|t| t.pnl)
            .sum();
        
        let total_loss: f64 = self.closed_trades.iter()
            .filter(|t| t.pnl <= 0.0)
            .map(|t| t.pnl)
            .sum();
        
        let avg_profit_per_trade = if winning_trades > 0 {
            total_profit / winning_trades as f64
        } else {
            0.0
        };
        
        let avg_loss_per_trade = if losing_trades > 0 {
            total_loss / losing_trades as f64
        } else {
            0.0
        };
        
        // Calculate profit factor
        let profit_factor = if total_loss.abs() > 0.0 {
            total_profit / total_loss.abs()
        } else {
            if total_profit > 0.0 { f64::INFINITY } else { 0.0 }
        };
        
        // Calculate maximum drawdown
        let mut max_equity = initial_capital;
        let mut max_drawdown = 0.0;
        let mut max_drawdown_pct = 0.0;
        
        for (_, equity) in &self.equity_curve {
            if *equity > max_equity {
                max_equity = *equity;
            }
            
            let drawdown = max_equity - *equity;
            let drawdown_pct = drawdown / max_equity;
            
            if drawdown > max_drawdown {
                max_drawdown = drawdown;
                max_drawdown_pct = drawdown_pct;
            }
        }
        
        // Calculate Sharpe ratio
        let returns: Vec<f64> = self.equity_curve.windows(2)
            .map(|w| (w[1].1 - w[0].1) / w[0].1)
            .collect();
        
        let avg_return = returns.iter().sum::<f64>() / returns.len() as f64;
        let std_dev = (returns.iter()
            .map(|r| (*r - avg_return).powi(2))
            .sum::<f64>() / returns.len() as f64)
            .sqrt();
        
        let sharpe_ratio = if std_dev > 0.0 {
            avg_return / std_dev * (252.0_f64).sqrt() // Annualized
        } else {
            0.0
        };
        
        Ok(BacktestResult {
            initial_capital,
            final_capital,
            total_pnl,
            roi,
            num_trades,
            winning_trades,
            losing_trades,
            win_rate,
            avg_profit_per_trade,
            avg_loss_per_trade,
            profit_factor,
            max_drawdown,
            max_drawdown_pct,
            sharpe_ratio,
            trades: self.closed_trades.clone(),
            equity_curve: self.equity_curve.clone(),
        })
    }
}
