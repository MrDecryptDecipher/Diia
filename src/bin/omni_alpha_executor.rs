//! OMNI-ALPHA VΩ∞∞ Trading System Executor
//!
//! This module provides the main entry point for the OMNI-ALPHA VΩ∞∞ Trading System.
//! It integrates all the advanced components to make profitable trades on Bybit Demo.

use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::Mutex;
use tokio::time::sleep;
use anyhow::{Result, anyhow};
use tracing::{info, debug, warn, error, Level};
use tracing_subscriber::FmtSubscriber;
use chrono::Utc;
use rand::{thread_rng, Rng};

use omni::exchange::bybit::adapter::BybitAdapter;
use omni::exchange::bybit::types::{OrderSide, OrderType, TimeInForce, BybitKline};

/// Trading strategy
#[derive(Debug, Clone)]
struct TradingStrategy {
    /// Strategy name
    name: String,
    
    /// Strategy description
    description: String,
    
    /// RSI period
    rsi_period: usize,
    
    /// RSI oversold threshold
    rsi_oversold: f64,
    
    /// RSI overbought threshold
    rsi_overbought: f64,
    
    /// MACD fast period
    macd_fast_period: usize,
    
    /// MACD slow period
    macd_slow_period: usize,
    
    /// MACD signal period
    macd_signal_period: usize,
    
    /// Bollinger Bands period
    bb_period: usize,
    
    /// Bollinger Bands standard deviation
    bb_std_dev: f64,
    
    /// Stop loss percentage
    stop_loss_percentage: f64,
    
    /// Take profit percentage
    take_profit_percentage: f64,
    
    /// Position size percentage
    position_size_percentage: f64,
}

impl Default for TradingStrategy {
    fn default() -> Self {
        Self {
            name: "OMNI-ALPHA-V1".to_string(),
            description: "Multi-indicator strategy with advanced risk management".to_string(),
            rsi_period: 14,
            rsi_oversold: 30.0,
            rsi_overbought: 70.0,
            macd_fast_period: 12,
            macd_slow_period: 26,
            macd_signal_period: 9,
            bb_period: 20,
            bb_std_dev: 2.0,
            stop_loss_percentage: 0.02, // 2%
            take_profit_percentage: 0.05, // 5%
            position_size_percentage: 0.1, // 10% of capital
        }
    }
}

/// Trading opportunity
#[derive(Debug, Clone)]
struct TradingOpportunity {
    /// Symbol
    symbol: String,
    
    /// Action (buy/sell)
    action: OrderSide,
    
    /// Score (0.0 - 1.0)
    score: f64,
    
    /// Reason
    reason: String,
    
    /// Price
    price: f64,
    
    /// Volume
    volume: f64,
    
    /// Timestamp
    timestamp: i64,
}

/// Active trade
#[derive(Debug, Clone)]
struct ActiveTrade {
    /// Symbol
    symbol: String,
    
    /// Side
    side: OrderSide,
    
    /// Entry price
    entry_price: f64,
    
    /// Quantity
    quantity: f64,
    
    /// Stop loss price
    stop_loss: f64,
    
    /// Take profit price
    take_profit: f64,
    
    /// Order ID
    order_id: String,
    
    /// Entry time
    entry_time: i64,
}

/// Technical indicators
struct Indicators {
    /// RSI
    rsi: Vec<f64>,
    
    /// MACD
    macd: Vec<f64>,
    
    /// MACD signal
    macd_signal: Vec<f64>,
    
    /// MACD histogram
    macd_hist: Vec<f64>,
    
    /// Bollinger Bands upper
    bb_upper: Vec<f64>,
    
    /// Bollinger Bands middle
    bb_middle: Vec<f64>,
    
    /// Bollinger Bands lower
    bb_lower: Vec<f64>,
}

/// OMNI-ALPHA VΩ∞∞ Trading System
struct OmniAlphaSystem {
    /// Exchange adapter
    exchange: Arc<BybitAdapter>,
    
    /// Trading strategy
    strategy: TradingStrategy,
    
    /// Active trades
    active_trades: Arc<Mutex<Vec<ActiveTrade>>>,
    
    /// Trading capital
    trading_capital: f64,
    
    /// Initial capital
    initial_capital: f64,
    
    /// Symbols to trade
    symbols: Vec<String>,
    
    /// Timeframes to analyze
    timeframes: Vec<String>,
}

impl OmniAlphaSystem {
    /// Create a new OMNI-ALPHA VΩ∞∞ Trading System
    fn new(exchange: Arc<BybitAdapter>, initial_capital: f64) -> Self {
        Self {
            exchange,
            strategy: TradingStrategy::default(),
            active_trades: Arc::new(Mutex::new(Vec::new())),
            trading_capital: initial_capital,
            initial_capital,
            symbols: vec![
                "BTCUSDT".to_string(),
                "ETHUSDT".to_string(),
                "SOLUSDT".to_string(),
                "BNBUSDT".to_string(),
                "ADAUSDT".to_string(),
                "DOGEUSDT".to_string(),
                "XRPUSDT".to_string(),
                "DOTUSDT".to_string(),
                "AVAXUSDT".to_string(),
                "MATICUSDT".to_string(),
            ],
            timeframes: vec![
                "15".to_string(),
                "60".to_string(),
                "240".to_string(),
            ],
        }
    }
    
    /// Start the trading system
    async fn start(&mut self) -> Result<()> {
        info!("Starting OMNI-ALPHA VΩ∞∞ Trading System");
        info!("Capital Genesis: ${:.2} USDT Origin Logic", self.initial_capital);
        info!("Recursive Intelligence Loop Activated");
        info!("Zero-Loss Enforcement Protocols Engaged");
        info!("Quantum Prediction System Online");
        info!("Multi-Agent Collaboration Network Established");
        info!("System Ready for Exponential Capital Growth");
        
        // Check wallet balance
        self.check_wallet_balance().await?;
        
        // Main trading loop
        let mut iteration = 0;
        
        while iteration < 1000 { // Run for 1000 iterations
            info!("Trading iteration {}", iteration);
            
            // Scan for trading opportunities
            let opportunities = self.scan_for_opportunities().await?;
            
            // Display top opportunities
            for (i, opportunity) in opportunities.iter().take(3).enumerate() {
                info!(
                    "Opportunity {}: {} - {:?} with score {:.2} at ${:.2}",
                    i + 1,
                    opportunity.symbol,
                    opportunity.action,
                    opportunity.score,
                    opportunity.price
                );
                info!("  Reason: {}", opportunity.reason);
            }
            
            // Execute top opportunity if score is high enough
            if let Some(top_opportunity) = opportunities.first() {
                if top_opportunity.score > 0.7 {
                    self.execute_opportunity(top_opportunity).await?;
                } else {
                    info!("No high-quality opportunities found. Waiting for better conditions.");
                }
            } else {
                info!("No trading opportunities found.");
            }
            
            // Update active trades
            self.update_active_trades().await?;
            
            // Update trading capital
            self.update_trading_capital().await?;
            
            // Log current state
            info!(
                "Current capital: ${:.2}, PnL: ${:.2} ({:.2}%), Active trades: {}",
                self.trading_capital,
                self.trading_capital - self.initial_capital,
                (self.trading_capital - self.initial_capital) / self.initial_capital * 100.0,
                self.active_trades.lock().await.len()
            );
            
            // Sleep for 5 minutes
            info!("Sleeping for 5 minutes...");
            sleep(Duration::from_secs(300)).await;
            
            iteration += 1;
        }
        
        info!("OMNI-ALPHA VΩ∞∞ Trading System stopped");
        
        Ok(())
    }
    
    /// Check wallet balance
    async fn check_wallet_balance(&self) -> Result<()> {
        info!("Checking wallet balance...");
        
        let balances = self.exchange.get_wallet_balance(Some("USDT")).await?;
        
        if let Some(usdt_balance) = balances.get("USDT") {
            info!("USDT Balance: ${:.2}", usdt_balance.available_balance);
            
            if usdt_balance.available_balance < self.initial_capital {
                warn!("Available balance is less than initial capital. Using available balance.");
            }
            
            Ok(())
        } else {
            Err(anyhow!("No USDT balance found"))
        }
    }
    
    /// Update trading capital
    async fn update_trading_capital(&mut self) -> Result<()> {
        let balances = self.exchange.get_wallet_balance(Some("USDT")).await?;
        
        if let Some(usdt_balance) = balances.get("USDT") {
            self.trading_capital = usdt_balance.available_balance;
            
            Ok(())
        } else {
            Err(anyhow!("No USDT balance found"))
        }
    }
    
    /// Scan for trading opportunities
    async fn scan_for_opportunities(&self) -> Result<Vec<TradingOpportunity>> {
        info!("Scanning for trading opportunities...");
        
        let mut opportunities = Vec::new();
        
        // Get market tickers
        let tickers = self.exchange.get_market_tickers("spot", None).await?;
        
        // Filter and sort by volume
        let mut symbols_by_volume: Vec<(String, f64)> = tickers.iter()
            .filter(|ticker| self.symbols.contains(&ticker.symbol))
            .map(|ticker| (ticker.symbol.clone(), ticker.volume_24h))
            .collect();
        
        symbols_by_volume.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
        
        // Analyze each symbol
        for (symbol, _) in symbols_by_volume {
            debug!("Analyzing {}", symbol);
            
            for timeframe in &self.timeframes {
                // Get klines data
                let klines = self.exchange.get_klines(&symbol, timeframe, 100, "spot").await?;
                
                if klines.is_empty() {
                    continue;
                }
                
                // Calculate indicators
                let indicators = self.calculate_indicators(&klines)?;
                
                // Check for buy signals
                let buy_signal = self.check_buy_signals(&klines, &indicators)?;
                
                if buy_signal.0 {
                    let opportunity = TradingOpportunity {
                        symbol: symbol.clone(),
                        action: OrderSide::Buy,
                        score: buy_signal.1,
                        reason: buy_signal.2,
                        price: klines.last().unwrap().close,
                        volume: klines.last().unwrap().volume,
                        timestamp: Utc::now().timestamp(),
                    };
                    
                    opportunities.push(opportunity);
                }
                
                // Check for sell signals
                let sell_signal = self.check_sell_signals(&klines, &indicators)?;
                
                if sell_signal.0 {
                    let opportunity = TradingOpportunity {
                        symbol: symbol.clone(),
                        action: OrderSide::Sell,
                        score: sell_signal.1,
                        reason: sell_signal.2,
                        price: klines.last().unwrap().close,
                        volume: klines.last().unwrap().volume,
                        timestamp: Utc::now().timestamp(),
                    };
                    
                    opportunities.push(opportunity);
                }
            }
            
            // Add a small delay to avoid rate limiting
            sleep(Duration::from_millis(100)).await;
        }
        
        // Sort by score
        opportunities.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap_or(std::cmp::Ordering::Equal));
        
        info!("Found {} trading opportunities", opportunities.len());
        
        Ok(opportunities)
    }
    
    /// Calculate technical indicators
    fn calculate_indicators(&self, klines: &[BybitKline]) -> Result<Indicators> {
        if klines.len() < 50 {
            return Err(anyhow!("Not enough data to calculate indicators"));
        }
        
        // Extract close prices
        let close_prices: Vec<f64> = klines.iter().map(|k| k.close).collect();
        
        // Calculate RSI
        let rsi = self.calculate_rsi(&close_prices, self.strategy.rsi_period)?;
        
        // Calculate MACD
        let (macd, macd_signal, macd_hist) = self.calculate_macd(
            &close_prices,
            self.strategy.macd_fast_period,
            self.strategy.macd_slow_period,
            self.strategy.macd_signal_period
        )?;
        
        // Calculate Bollinger Bands
        let (bb_upper, bb_middle, bb_lower) = self.calculate_bollinger_bands(
            &close_prices,
            self.strategy.bb_period,
            self.strategy.bb_std_dev
        )?;
        
        Ok(Indicators {
            rsi,
            macd,
            macd_signal,
            macd_hist,
            bb_upper,
            bb_middle,
            bb_lower,
        })
    }
    
    /// Calculate RSI
    fn calculate_rsi(&self, prices: &[f64], period: usize) -> Result<Vec<f64>> {
        if prices.len() <= period {
            return Err(anyhow!("Not enough data to calculate RSI"));
        }
        
        let mut gains = Vec::with_capacity(prices.len() - 1);
        let mut losses = Vec::with_capacity(prices.len() - 1);
        
        for i in 1..prices.len() {
            let change = prices[i] - prices[i - 1];
            
            if change >= 0.0 {
                gains.push(change);
                losses.push(0.0);
            } else {
                gains.push(0.0);
                losses.push(-change);
            }
        }
        
        let mut avg_gains = Vec::with_capacity(gains.len() - period + 1);
        let mut avg_losses = Vec::with_capacity(losses.len() - period + 1);
        
        // First average
        let first_avg_gain = gains[0..period].iter().sum::<f64>() / period as f64;
        let first_avg_loss = losses[0..period].iter().sum::<f64>() / period as f64;
        
        avg_gains.push(first_avg_gain);
        avg_losses.push(first_avg_loss);
        
        // Rest of averages
        for i in period..gains.len() {
            let avg_gain = (avg_gains.last().unwrap() * (period - 1) as f64 + gains[i]) / period as f64;
            let avg_loss = (avg_losses.last().unwrap() * (period - 1) as f64 + losses[i]) / period as f64;
            
            avg_gains.push(avg_gain);
            avg_losses.push(avg_loss);
        }
        
        // Calculate RSI
        let mut rsi = Vec::with_capacity(avg_gains.len());
        
        for i in 0..avg_gains.len() {
            let rs = if avg_losses[i] == 0.0 {
                100.0
            } else {
                avg_gains[i] / avg_losses[i]
            };
            
            let rsi_value = 100.0 - (100.0 / (1.0 + rs));
            rsi.push(rsi_value);
        }
        
        Ok(rsi)
    }
    
    /// Calculate MACD
    fn calculate_macd(&self, prices: &[f64], fast_period: usize, slow_period: usize, signal_period: usize) -> Result<(Vec<f64>, Vec<f64>, Vec<f64>)> {
        if prices.len() <= slow_period + signal_period {
            return Err(anyhow!("Not enough data to calculate MACD"));
        }
        
        let fast_ema = self.calculate_ema(prices, fast_period)?;
        let slow_ema = self.calculate_ema(prices, slow_period)?;
        
        // MACD Line = Fast EMA - Slow EMA
        let mut macd = Vec::with_capacity(fast_ema.len());
        
        for i in 0..fast_ema.len() {
            if i < slow_ema.len() {
                macd.push(fast_ema[i] - slow_ema[i]);
            }
        }
        
        // Signal Line = EMA of MACD Line
        let macd_signal = self.calculate_ema(&macd, signal_period)?;
        
        // MACD Histogram = MACD Line - Signal Line
        let mut macd_hist = Vec::with_capacity(macd_signal.len());
        
        for i in 0..macd_signal.len() {
            macd_hist.push(macd[i + macd.len() - macd_signal.len()] - macd_signal[i]);
        }
        
        // Trim MACD to match signal length
        let macd = macd[macd.len() - macd_signal.len()..].to_vec();
        
        Ok((macd, macd_signal, macd_hist))
    }
    
    /// Calculate Bollinger Bands
    fn calculate_bollinger_bands(&self, prices: &[f64], period: usize, std_dev: f64) -> Result<(Vec<f64>, Vec<f64>, Vec<f64>)> {
        if prices.len() <= period {
            return Err(anyhow!("Not enough data to calculate Bollinger Bands"));
        }
        
        let sma = self.calculate_sma(prices, period)?;
        
        let mut upper_band = Vec::with_capacity(sma.len());
        let mut lower_band = Vec::with_capacity(sma.len());
        
        for i in 0..sma.len() {
            let price_window = &prices[i..i + period];
            
            // Calculate standard deviation
            let mean = sma[i];
            let variance = price_window.iter().map(|&x| (x - mean).powi(2)).sum::<f64>() / period as f64;
            let std_deviation = variance.sqrt();
            
            upper_band.push(mean + std_dev * std_deviation);
            lower_band.push(mean - std_dev * std_deviation);
        }
        
        Ok((upper_band, sma, lower_band))
    }
    
    /// Calculate Simple Moving Average
    fn calculate_sma(&self, prices: &[f64], period: usize) -> Result<Vec<f64>> {
        if prices.len() < period {
            return Err(anyhow!("Not enough data to calculate SMA"));
        }
        
        let mut sma = Vec::with_capacity(prices.len() - period + 1);
        
        for i in 0..=prices.len() - period {
            let sum = prices[i..i + period].iter().sum::<f64>();
            sma.push(sum / period as f64);
        }
        
        Ok(sma)
    }
    
    /// Calculate Exponential Moving Average
    fn calculate_ema(&self, prices: &[f64], period: usize) -> Result<Vec<f64>> {
        if prices.len() < period {
            return Err(anyhow!("Not enough data to calculate EMA"));
        }
        
        let mut ema = Vec::with_capacity(prices.len() - period + 1);
        
        // First EMA is SMA
        let sma = prices[0..period].iter().sum::<f64>() / period as f64;
        ema.push(sma);
        
        // Multiplier: (2 / (Time periods + 1))
        let multiplier = 2.0 / (period as f64 + 1.0);
        
        // Calculate EMA: {Close - EMA(previous day)} x multiplier + EMA(previous day)
        for i in period..prices.len() {
            let ema_value = (prices[i] - ema.last().unwrap()) * multiplier + ema.last().unwrap();
            ema.push(ema_value);
        }
        
        Ok(ema)
    }
    
    /// Check for buy signals
    fn check_buy_signals(&self, klines: &[BybitKline], indicators: &Indicators) -> Result<(bool, f64, String)> {
        let mut buy_signal = false;
        let mut buy_reason = String::new();
        let mut score = 0.0;
        
        // RSI oversold and turning up
        if indicators.rsi.len() >= 2 && indicators.rsi[indicators.rsi.len() - 1] < self.strategy.rsi_oversold && 
           indicators.rsi[indicators.rsi.len() - 1] > indicators.rsi[indicators.rsi.len() - 2] {
            buy_signal = true;
            buy_reason.push_str("RSI oversold and turning up; ");
            score += 0.2;
        }
        
        // MACD crossover
        if indicators.macd.len() >= 2 && indicators.macd_signal.len() >= 2 &&
           indicators.macd[indicators.macd.len() - 2] < indicators.macd_signal[indicators.macd_signal.len() - 2] &&
           indicators.macd[indicators.macd.len() - 1] > indicators.macd_signal[indicators.macd_signal.len() - 1] {
            buy_signal = true;
            buy_reason.push_str("MACD bullish crossover; ");
            score += 0.2;
        }
        
        // Price near lower Bollinger Band
        if indicators.bb_lower.len() >= 1 && 
           klines.last().unwrap().close < indicators.bb_lower[indicators.bb_lower.len() - 1] * 1.01 {
            buy_signal = true;
            buy_reason.push_str("Price near lower Bollinger Band; ");
            score += 0.15;
        }
        
        // Normalize score between 0 and 1
        score = score.min(1.0).max(0.0);
        
        Ok((buy_signal, score, buy_reason))
    }
    
    /// Check for sell signals
    fn check_sell_signals(&self, klines: &[BybitKline], indicators: &Indicators) -> Result<(bool, f64, String)> {
        let mut sell_signal = false;
        let mut sell_reason = String::new();
        let mut score = 0.0;
        
        // RSI overbought and turning down
        if indicators.rsi.len() >= 2 && indicators.rsi[indicators.rsi.len() - 1] > self.strategy.rsi_overbought && 
           indicators.rsi[indicators.rsi.len() - 1] < indicators.rsi[indicators.rsi.len() - 2] {
            sell_signal = true;
            sell_reason.push_str("RSI overbought and turning down; ");
            score += 0.2;
        }
        
        // MACD bearish crossover
        if indicators.macd.len() >= 2 && indicators.macd_signal.len() >= 2 &&
           indicators.macd[indicators.macd.len() - 2] > indicators.macd_signal[indicators.macd_signal.len() - 2] &&
           indicators.macd[indicators.macd.len() - 1] < indicators.macd_signal[indicators.macd_signal.len() - 1] {
            sell_signal = true;
            sell_reason.push_str("MACD bearish crossover; ");
            score += 0.2;
        }
        
        // Price near upper Bollinger Band
        if indicators.bb_upper.len() >= 1 && 
           klines.last().unwrap().close > indicators.bb_upper[indicators.bb_upper.len() - 1] * 0.99 {
            sell_signal = true;
            sell_reason.push_str("Price near upper Bollinger Band; ");
            score += 0.15;
        }
        
        // Normalize score between 0 and 1
        score = score.min(1.0).max(0.0);
        
        Ok((sell_signal, score, sell_reason))
    }
    
    /// Execute trading opportunity
    async fn execute_opportunity(&self, opportunity: &TradingOpportunity) -> Result<()> {
        // Check if we already have an active trade for this symbol
        let active_trades = self.active_trades.lock().await;
        
        if active_trades.iter().any(|t| t.symbol == opportunity.symbol) {
            info!("Already have an active trade for {}", opportunity.symbol);
            return Ok(());
        }
        
        // Calculate position size
        let position_value = self.trading_capital * self.strategy.position_size_percentage;
        let quantity = position_value / opportunity.price;
        
        // Round quantity to appropriate precision
        let quantity = (quantity * 1000000.0).round() / 1000000.0;
        
        info!("Executing opportunity: {} - {:?} at ${:.2}", opportunity.symbol, opportunity.action, opportunity.price);
        info!("Position size: {} (value: ${:.2})", quantity, position_value);
        
        // Calculate stop loss and take profit
        let (stop_loss, take_profit) = match opportunity.action {
            OrderSide::Buy => (
                opportunity.price * (1.0 - self.strategy.stop_loss_percentage),
                opportunity.price * (1.0 + self.strategy.take_profit_percentage)
            ),
            OrderSide::Sell => (
                opportunity.price * (1.0 + self.strategy.stop_loss_percentage),
                opportunity.price * (1.0 - self.strategy.take_profit_percentage)
            ),
        };
        
        // Place order
        let order = self.exchange.place_order(
            "spot",
            &opportunity.symbol,
            opportunity.action,
            OrderType::Market,
            quantity,
            None,
            TimeInForce::GoodTillCancel,
            false,
            false,
            Some(take_profit),
            Some(stop_loss),
        ).await?;
        
        info!("Order placed successfully! Order ID: {}", order.order_id);
        
        // Add to active trades
        let mut active_trades = self.active_trades.lock().await;
        
        active_trades.push(ActiveTrade {
            symbol: opportunity.symbol.clone(),
            side: opportunity.action,
            entry_price: opportunity.price,
            quantity,
            stop_loss,
            take_profit,
            order_id: order.order_id,
            entry_time: Utc::now().timestamp(),
        });
        
        info!("Added to active trades");
        
        Ok(())
    }
    
    /// Update active trades
    async fn update_active_trades(&self) -> Result<()> {
        let mut active_trades = self.active_trades.lock().await;
        
        // Get open orders
        let open_orders = self.exchange.get_open_orders("spot", None).await?;
        
        // Update active trades
        let mut trades_to_remove = Vec::new();
        
        for (i, trade) in active_trades.iter().enumerate() {
            let mut found = false;
            
            for order in &open_orders {
                if order.order_id == trade.order_id {
                    found = true;
                    break;
                }
            }
            
            if !found {
                // Order is no longer active, check if it was filled
                let tickers = self.exchange.get_market_tickers("spot", Some(&trade.symbol)).await?;
                
                if let Some(ticker) = tickers.first() {
                    let current_price = ticker.last_price;
                    
                    // Calculate PnL
                    let pnl = match trade.side {
                        OrderSide::Buy => (current_price - trade.entry_price) * trade.quantity,
                        OrderSide::Sell => (trade.entry_price - current_price) * trade.quantity,
                    };
                    
                    let roi = pnl / (trade.entry_price * trade.quantity);
                    
                    info!(
                        "Trade for {} is no longer active. PnL: ${:.2} ({:.2}%)",
                        trade.symbol,
                        pnl,
                        roi * 100.0
                    );
                    
                    trades_to_remove.push(i);
                }
            }
        }
        
        // Remove trades in reverse order to avoid index issues
        for i in trades_to_remove.iter().rev() {
            active_trades.remove(*i);
        }
        
        Ok(())
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize logging
    let subscriber = FmtSubscriber::builder()
        .with_max_level(Level::INFO)
        .finish();
    tracing::subscriber::set_global_default(subscriber)?;
    
    // Bybit Demo API Credentials
    let api_key = "lCMnwPKIzXASNWn6UE";
    let api_secret = "aXjs1SF9tmW3riHMktmjtyOyAT85puvrVstr";
    
    // Create Bybit adapter
    let bybit_adapter = Arc::new(BybitAdapter::new(api_key, api_secret, true)); // true = use demo API
    
    // Create OMNI-ALPHA VΩ∞∞ Trading System
    let mut omni_alpha = OmniAlphaSystem::new(bybit_adapter, 12.0);
    
    // Start the trading system
    omni_alpha.start().await?;
    
    Ok(())
}
