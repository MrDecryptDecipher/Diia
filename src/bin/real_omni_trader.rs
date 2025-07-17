//! Real OMNI Comprehensive Trading System
//!
//! This system uses the ACTUAL OMNI project components for comprehensive trading
//! with 12 USDT capital on Bybit demo environment.

use std::sync::Arc;
use tokio::sync::Mutex;
use std::collections::HashMap;
use chrono::{DateTime, Utc};
use anyhow::{Result, anyhow};
use tracing::{info, warn, error};

// Use REAL OMNI components
use omni::exchange::bybit::demo_adapter::BybitDemoAdapter;
use omni::exchange::types::Candle;
use omni::strategy::indicators::*;

#[derive(Debug, Clone)]
pub struct MarketData {
    pub symbol: String,
    pub price: f64,
    pub volume: f64,
    pub change_24h: f64,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct TradingOpportunity {
    pub symbol: String,
    pub direction: String,
    pub confidence: f64,
    pub entry_price: f64,
    pub stop_loss: f64,
    pub take_profit: f64,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct ActiveTrade {
    pub order_id: String,
    pub symbol: String,
    pub direction: String,
    pub entry_price: f64,
    pub quantity: f64,
    pub stop_loss: f64,
    pub take_profit: f64,
    pub allocated_capital: f64,
    pub timestamp: DateTime<Utc>,
    pub is_managed: bool,
}

#[derive(Debug, Clone)]
pub struct TradeConfig {
    pub capital_usdt: f64,
    pub position_size_usdt: f64,
    pub safety_buffer_usdt: f64,
    pub min_profit_usdt: f64,
    pub max_leverage: f64,
    pub target_win_rate: f64,
    pub max_daily_trades: u32,
}

impl Default for TradeConfig {
    fn default() -> Self {
        Self {
            capital_usdt: 12.0,
            position_size_usdt: 5.0,
            safety_buffer_usdt: 2.0,
            min_profit_usdt: 0.6,
            max_leverage: 100.0,
            target_win_rate: 0.85,
            max_daily_trades: 750,
        }
    }
}

pub struct RealOmniTrader {
    /// Real Bybit Demo Adapter from OMNI
    bybit_adapter: Arc<Mutex<BybitDemoAdapter>>,
    
    /// Trading configuration
    config: TradeConfig,
    
    /// Current market data
    current_market_data: Arc<tokio::sync::RwLock<Vec<MarketData>>>,
    
    /// Symbols to monitor (top volume USDT pairs)
    symbols_to_monitor: Vec<String>,
    
    /// Performance tracking
    total_trades: Arc<Mutex<u32>>,
    winning_trades: Arc<Mutex<u32>>,
    total_pnl: Arc<Mutex<f64>>,
    daily_trades: Arc<Mutex<u32>>,

    /// Active trades management
    active_trades: Arc<Mutex<Vec<ActiveTrade>>>,
    allocated_capital: Arc<Mutex<f64>>,
}

impl RealOmniTrader {
    /// Create new Real OMNI Trader using actual OMNI components
    pub async fn new() -> Result<Self> {
        // Get credentials from environment
        let api_key = std::env::var("BYBIT_API_KEY")
            .map_err(|_| anyhow!("BYBIT_API_KEY not set"))?;
        let api_secret = std::env::var("BYBIT_API_SECRET")
            .map_err(|_| anyhow!("BYBIT_API_SECRET not set"))?;

        // Create REAL Bybit Demo Adapter from OMNI
        let bybit_adapter = BybitDemoAdapter::new(&api_key, &api_secret);
        
        // Test connection by getting wallet balance
        info!("🔗 Testing connection to Bybit Demo API...");
        match bybit_adapter.get_wallet_balance(Some("USDT")).await {
            Ok(balance) => {
                info!("✅ Connected to Bybit Demo API successfully");
                if let Some(usdt_balance) = balance.get("USDT") {
                    info!("💰 Current USDT Balance: {:.4}", usdt_balance.available_balance);
                }
            },
            Err(e) => {
                error!("❌ Failed to connect to Bybit Demo API: {}", e);
                return Err(anyhow!("Connection test failed: {}", e));
            }
        }

        // Get top volume symbols for monitoring
        info!("📊 Fetching top volume symbols...");
        let symbols = match bybit_adapter.get_all_linear_symbols().await {
            Ok(symbols) => {
                info!("✅ Found {} linear symbols", symbols.len());
                // Filter for USDT pairs and scan ALL available assets
                let usdt_symbols: Vec<String> = symbols.into_iter()
                    .filter(|s| s.ends_with("USDT"))
                    .collect();
                info!("🔍 Scanning ALL {} USDT linear pairs", usdt_symbols.len());
                usdt_symbols
            },
            Err(e) => {
                warn!("⚠️ Failed to get symbols, using defaults: {}", e);
                vec![
                    "BTCUSDT".to_string(), "ETHUSDT".to_string(), "SOLUSDT".to_string(),
                    "ADAUSDT".to_string(), "DOTUSDT".to_string(), "LINKUSDT".to_string(),
                    "AVAXUSDT".to_string(), "MATICUSDT".to_string(), "ATOMUSDT".to_string(),
                    "NEARUSDT".to_string()
                ]
            }
        };

        info!("🎯 Monitoring {} symbols: {:?}", symbols.len(), &symbols[..5.min(symbols.len())]);

        Ok(Self {
            bybit_adapter: Arc::new(Mutex::new(bybit_adapter)),
            config: TradeConfig::default(),
            current_market_data: Arc::new(tokio::sync::RwLock::new(Vec::new())),
            symbols_to_monitor: symbols,
            total_trades: Arc::new(Mutex::new(0)),
            winning_trades: Arc::new(Mutex::new(0)),
            total_pnl: Arc::new(Mutex::new(0.0)),
            daily_trades: Arc::new(Mutex::new(0)),
            active_trades: Arc::new(Mutex::new(Vec::new())),
            allocated_capital: Arc::new(Mutex::new(0.0)),
        })
    }

    /// Start the comprehensive trading system
    pub async fn start_trading(&self) -> Result<()> {
        info!("🚀 Starting Real OMNI Comprehensive Trading System");
        info!("💰 Capital: {:.2} USDT", self.config.capital_usdt);
        info!("📊 Position Size: {:.2} USDT", self.config.position_size_usdt);
        info!("🎯 Target: {} trades/day with {:.1}% win rate", 
              self.config.max_daily_trades, self.config.target_win_rate * 100.0);

        // Start market data feed
        let market_data_task = self.start_market_data_feed();

        // Start trading analysis
        let trading_task = self.start_trading_analysis();

        // Start performance monitoring
        let monitoring_task = self.start_performance_monitoring();

        // Start trade management
        let trade_management_task = self.start_trade_management();

        // Run all tasks concurrently
        tokio::select! {
            result = market_data_task => {
                error!("Market data feed stopped: {:?}", result);
                result
            },
            result = trading_task => {
                error!("Trading analysis stopped: {:?}", result);
                result
            },
            result = monitoring_task => {
                error!("Performance monitoring stopped: {:?}", result);
                result
            },
            result = trade_management_task => {
                error!("Trade management stopped: {:?}", result);
                result
            }
        }
    }

    /// Start market data feed using real OMNI Bybit adapter
    async fn start_market_data_feed(&self) -> Result<()> {
        info!("📡 Starting real-time market data feed...");
        
        loop {
            match self.fetch_real_market_data().await {
                Ok(market_data) => {
                    let mut current_data = self.current_market_data.write().await;
                    *current_data = market_data;
                    info!("📈 Updated market data for {} symbols", current_data.len());
                },
                Err(e) => {
                    error!("❌ Failed to fetch market data: {}", e);
                }
            }
            
            // Update every 30 seconds
            tokio::time::sleep(tokio::time::Duration::from_secs(30)).await;
        }
    }

    /// Fetch real market data using OMNI Bybit adapter
    async fn fetch_real_market_data(&self) -> Result<Vec<MarketData>> {
        let adapter = self.bybit_adapter.lock().await;
        let tickers = adapter.get_market_tickers("linear", None).await?;
        
        let mut market_data = Vec::new();
        for ticker in tickers {
            // Only include symbols we're monitoring
            if self.symbols_to_monitor.contains(&ticker.symbol) {
                let data = MarketData {
                    symbol: ticker.symbol.clone(),
                    price: ticker.last_price,
                    volume: ticker.volume_24h,
                    change_24h: ticker.price_24h_pcnt,
                    timestamp: Utc::now(),
                };
                market_data.push(data);
            }
        }
        
        info!("✅ Fetched real market data for {} symbols", market_data.len());
        Ok(market_data)
    }

    /// Start trading analysis using comprehensive technical analysis
    async fn start_trading_analysis(&self) -> Result<()> {
        info!("🔍 Starting comprehensive trading analysis...");
        println!("🔍 Starting comprehensive trading analysis...");

        let mut cycle_count = 0;
        loop {
            cycle_count += 1;
            println!("🔄 Analysis cycle {} starting...", cycle_count);

            let market_data = self.current_market_data.read().await.clone();
            println!("📊 Current market data size: {}", market_data.len());

            if !market_data.is_empty() {
                info!("🔍 Analyzing {} symbols for trading opportunities", market_data.len());
                println!("🔍 Analyzing {} symbols for trading opportunities", market_data.len());

                match self.perform_comprehensive_analysis(&market_data).await {
                    Ok(opportunities) => {
                        if !opportunities.is_empty() {
                            info!("🎯 Found {} trading opportunities", opportunities.len());
                            println!("🎯 Found {} trading opportunities", opportunities.len());
                            self.execute_best_opportunities(opportunities).await?;
                        } else {
                            info!("⚖️ No strong signals found - waiting for better opportunities");
                            println!("⚖️ No strong signals found - waiting for better opportunities");
                        }
                    },
                    Err(e) => {
                        error!("❌ Analysis failed: {}", e);
                        println!("❌ Analysis failed: {}", e);
                    }
                }
            } else {
                info!("⏳ Waiting for market data...");
                println!("⏳ Waiting for market data...");
            }
            
            // Analyze every 30 seconds
            tokio::time::sleep(tokio::time::Duration::from_secs(30)).await;
        }
    }

    /// Start performance monitoring
    async fn start_performance_monitoring(&self) -> Result<()> {
        info!("📊 Starting performance monitoring...");

        loop {
            let total_trades = *self.total_trades.lock().await;
            let winning_trades = *self.winning_trades.lock().await;
            let total_pnl = *self.total_pnl.lock().await;
            let daily_trades = *self.daily_trades.lock().await;

            let win_rate = if total_trades > 0 {
                (winning_trades as f64 / total_trades as f64) * 100.0
            } else {
                0.0
            };

            info!("📊 Performance: {} trades, {:.1}% win rate, {:.4} USDT PnL, {} today",
                  total_trades, win_rate, total_pnl, daily_trades);

            // Report every 60 seconds
            tokio::time::sleep(tokio::time::Duration::from_secs(60)).await;
        }
    }

    /// Perform comprehensive analysis using real technical indicators
    async fn perform_comprehensive_analysis(&self, market_data: &[MarketData]) -> Result<Vec<TradingOpportunity>> {
        let mut opportunities = Vec::new();

        for data in market_data {
            info!("🔍 Analyzing {}", data.symbol);

            // Get historical candles using real OMNI adapter
            let adapter = self.bybit_adapter.lock().await;
            let candles = adapter.get_candles(&data.symbol, "5", Some(200)).await?;
            drop(adapter);

            if candles.len() < 50 {
                warn!("⚠️ Insufficient data for {} - need 50+ candles, got {}", data.symbol, candles.len());
                continue;
            }

            info!("📊 Got {} candles for {}, performing technical analysis", candles.len(), data.symbol);

            // Extract price data for indicators
            let closes: Vec<f64> = candles.iter().map(|c| c.close).collect();
            let highs: Vec<f64> = candles.iter().map(|c| c.high).collect();
            let lows: Vec<f64> = candles.iter().map(|c| c.low).collect();
            let volumes: Vec<f64> = candles.iter().map(|c| c.volume).collect();

            // Comprehensive technical analysis using OMNI indicators
            let confidence = self.calculate_comprehensive_confidence(&closes, &highs, &lows, &volumes).await;

            info!("📈 {} analysis complete: {:.1}% confidence", data.symbol, confidence);

            // Generate trading opportunity for strong signals
            if confidence > 75.0 || confidence < 25.0 {
                let direction = if confidence > 50.0 { "BUY" } else { "SELL" };

                // Calculate ATR for stop loss and take profit
                let atr = self.calculate_atr(&highs, &lows, &closes, 14);

                let (stop_loss, take_profit) = if confidence > 50.0 {
                    (data.price - (atr * 2.0), data.price + (atr * 3.0)) // 2:3 risk/reward for buys
                } else {
                    (data.price + (atr * 2.0), data.price - (atr * 3.0)) // 2:3 risk/reward for sells
                };

                let opportunity = TradingOpportunity {
                    symbol: data.symbol.clone(),
                    direction: direction.to_string(),
                    confidence,
                    entry_price: data.price,
                    stop_loss,
                    take_profit,
                    timestamp: Utc::now(),
                };

                info!("🎯 {} opportunity for {}: {:.1}% confidence, Entry: {:.4}, SL: {:.4}, TP: {:.4}",
                      direction, data.symbol, confidence, data.price, stop_loss, take_profit);

                opportunities.push(opportunity);
            } else {
                info!("⚖️ Neutral signal for {} - Confidence: {:.1}%", data.symbol, confidence);
            }
        }

        Ok(opportunities)
    }

    /// Calculate comprehensive confidence using multiple technical indicators
    async fn calculate_comprehensive_confidence(&self, closes: &[f64], highs: &[f64], lows: &[f64], volumes: &[f64]) -> f64 {
        let mut total_score = 0.0;
        let mut total_weight = 0.0;

        // RSI Analysis (Weight: 15%)
        if closes.len() >= 14 {
            let rsi = calculate_rsi(closes, 14);
            let rsi_score = if rsi > 70.0 { 20.0 } else if rsi < 30.0 { 80.0 } else { 50.0 };
            total_score += rsi_score * 0.15;
            total_weight += 0.15;
            info!("📊 RSI: {:.2} -> Score: {:.1}", rsi, rsi_score);
        }

        // MACD Analysis (Weight: 15%)
        if closes.len() >= 26 {
            let (macd_line, signal_line, _) = calculate_macd(closes, 12, 26, 9);
            let macd_score = if macd_line > signal_line { 70.0 } else { 30.0 };
            total_score += macd_score * 0.15;
            total_weight += 0.15;
            info!("📊 MACD: {:.4} vs Signal: {:.4} -> Score: {:.1}", macd_line, signal_line, macd_score);
        }

        // Bollinger Bands Analysis (Weight: 12%)
        if closes.len() >= 20 {
            let (upper, middle, lower) = calculate_bollinger_bands(closes, 20, 2.0);
            let current_price = closes[closes.len() - 1];
            let bb_score = if current_price < lower { 75.0 }
                          else if current_price > upper { 25.0 }
                          else { 50.0 };
            total_score += bb_score * 0.12;
            total_weight += 0.12;
            info!("📊 BB: Price {:.4} vs Bands [{:.4}, {:.4}] -> Score: {:.1}", current_price, lower, upper, bb_score);
        }

        // Moving Average Analysis (Weight: 10%)
        if closes.len() >= 50 {
            let sma_20 = calculate_sma(closes, 20);
            let sma_50 = calculate_sma(closes, 50);
            let ma_score = if sma_20 > sma_50 { 65.0 } else { 35.0 };
            total_score += ma_score * 0.10;
            total_weight += 0.10;
            info!("📊 MA: SMA20 {:.4} vs SMA50 {:.4} -> Score: {:.1}", sma_20, sma_50, ma_score);
        }

        // Volume Analysis (Weight: 10%)
        if volumes.len() >= 20 {
            let avg_volume = volumes.iter().rev().take(20).sum::<f64>() / 20.0;
            let current_volume = volumes[volumes.len() - 1];
            let volume_score = if current_volume > avg_volume * 1.5 { 65.0 } else { 45.0 };
            total_score += volume_score * 0.10;
            total_weight += 0.10;
            info!("📊 Volume: Current {:.0} vs Avg {:.0} -> Score: {:.1}", current_volume, avg_volume, volume_score);
        }

        // Stochastic Analysis (Weight: 8%)
        if closes.len() >= 14 {
            let (stoch_k, _) = calculate_stochastic(highs, lows, closes, 14);
            let stoch_score = if stoch_k > 80.0 { 25.0 } else if stoch_k < 20.0 { 75.0 } else { 50.0 };
            total_score += stoch_score * 0.08;
            total_weight += 0.08;
            info!("📊 Stochastic: {:.2} -> Score: {:.1}", stoch_k, stoch_score);
        }

        // ATR Volatility Analysis (Weight: 8%)
        if closes.len() >= 14 {
            let atr = self.calculate_atr(highs, lows, closes, 14);
            let current_price = closes[closes.len() - 1];
            let volatility_ratio = atr / current_price;
            let volatility_score = if volatility_ratio > 0.02 { 60.0 } else { 45.0 };
            total_score += volatility_score * 0.08;
            total_weight += 0.08;
            info!("📊 ATR: {:.4} ({:.2}% of price) -> Score: {:.1}", atr, volatility_ratio * 100.0, volatility_score);
        }

        // Price Momentum Analysis (Weight: 7%)
        if closes.len() >= 10 {
            let momentum = (closes[closes.len() - 1] - closes[closes.len() - 10]) / closes[closes.len() - 10];
            let momentum_score = if momentum > 0.02 { 70.0 } else if momentum < -0.02 { 30.0 } else { 50.0 };
            total_score += momentum_score * 0.07;
            total_weight += 0.07;
            info!("📊 Momentum: {:.2}% -> Score: {:.1}", momentum * 100.0, momentum_score);
        }

        // Williams %R Analysis (Weight: 7%)
        if closes.len() >= 14 {
            let williams_r = calculate_williams_r(highs, lows, closes, 14);
            let wr_score = if williams_r > -20.0 { 25.0 } else if williams_r < -80.0 { 75.0 } else { 50.0 };
            total_score += wr_score * 0.07;
            total_weight += 0.07;
            info!("📊 Williams %R: {:.2} -> Score: {:.1}", williams_r, wr_score);
        }

        // CCI Analysis (Weight: 8%)
        if closes.len() >= 20 {
            let cci = calculate_cci(highs, lows, closes, 20);
            let cci_score = if cci > 100.0 { 25.0 } else if cci < -100.0 { 75.0 } else { 50.0 };
            total_score += cci_score * 0.08;
            total_weight += 0.08;
            info!("📊 CCI: {:.2} -> Score: {:.1}", cci, cci_score);
        }

        let final_confidence = if total_weight > 0.0 { total_score / total_weight } else { 50.0 };
        info!("✅ Final Confidence: {:.1}% (based on {:.1}% of indicators)", final_confidence, total_weight * 100.0);

        final_confidence
    }

    /// Calculate ATR (Average True Range)
    fn calculate_atr(&self, highs: &[f64], lows: &[f64], closes: &[f64], period: usize) -> f64 {
        if highs.len() < period + 1 || lows.len() < period + 1 || closes.len() < period + 1 {
            return 0.0;
        }

        let mut true_ranges = Vec::new();
        for i in 1..highs.len() {
            let high_low = highs[i] - lows[i];
            let high_close = (highs[i] - closes[i - 1]).abs();
            let low_close = (lows[i] - closes[i - 1]).abs();
            let true_range = high_low.max(high_close).max(low_close);
            true_ranges.push(true_range);
        }

        if true_ranges.len() < period {
            return 0.0;
        }

        true_ranges.iter().rev().take(period).sum::<f64>() / period as f64
    }

    /// Execute the best trading opportunities with proper capital management
    async fn execute_best_opportunities(&self, opportunities: Vec<TradingOpportunity>) -> Result<()> {
        // Check daily trade limit
        let daily_trades = *self.daily_trades.lock().await;
        if daily_trades >= self.config.max_daily_trades {
            info!("🛑 Daily trade limit reached: {}/{}", daily_trades, self.config.max_daily_trades);
            return Ok(());
        }

        // Check available capital
        let allocated_capital = *self.allocated_capital.lock().await;
        let available_capital = self.config.capital_usdt - allocated_capital - self.config.safety_buffer_usdt;

        if available_capital < self.config.position_size_usdt {
            info!("💰 Insufficient capital: Available {:.2} USDT, Need {:.2} USDT",
                  available_capital, self.config.position_size_usdt);
            return Ok(());
        }

        // Check active trades count
        let active_trades = self.active_trades.lock().await;
        let max_concurrent = 2; // Max 2 concurrent trades with 5 USDT each + 2 USDT buffer = 12 USDT
        if active_trades.len() >= max_concurrent {
            info!("🔄 Max concurrent trades reached: {}/{}", active_trades.len(), max_concurrent);
            return Ok(());
        }
        drop(active_trades);

        // Sort opportunities by confidence strength
        let mut sorted_opportunities = opportunities;
        sorted_opportunities.sort_by(|a, b| {
            let a_strength = (a.confidence - 50.0).abs();
            let b_strength = (b.confidence - 50.0).abs();
            b_strength.partial_cmp(&a_strength).unwrap_or(std::cmp::Ordering::Equal)
        });

        // Execute only the best opportunity per cycle for proper management
        if let Some(opportunity) = sorted_opportunities.first() {
            let strength = (opportunity.confidence - 50.0).abs();
            if strength >= 25.0 { // Only trade very strong signals (75%+ or 25%- confidence)
                match self.execute_managed_trade(opportunity).await {
                    Ok(order_id) => {
                        info!("✅ Managed trade executed: {} {} {:.2} USDT - Order ID: {}",
                              opportunity.direction, opportunity.symbol, self.config.position_size_usdt, order_id);

                        // Update trade counters
                        let mut total_trades = self.total_trades.lock().await;
                        *total_trades += 1;
                        let mut daily_trades = self.daily_trades.lock().await;
                        *daily_trades += 1;
                    },
                    Err(e) => {
                        error!("❌ Failed to execute managed trade for {}: {}", opportunity.symbol, e);
                    }
                }
            } else {
                info!("⚖️ Signal not strong enough: {:.1}% confidence (need 75%+ or 25%-)", opportunity.confidence);
            }
        }

        Ok(())
    }

    /// Execute a single trade using real OMNI Bybit adapter
    async fn execute_trade(&self, opportunity: &TradingOpportunity) -> Result<String> {
        let adapter = self.bybit_adapter.lock().await;

        // Calculate quantity based on position size and leverage
        let leverage = 20; // Conservative leverage for demo
        let notional_value = self.config.position_size_usdt * leverage as f64;
        let quantity = notional_value / opportunity.entry_price;

        info!("📊 Trade Details: {} {} {:.6} @ {:.4} (Leverage: {}x, Notional: {:.2} USDT)",
              opportunity.direction, opportunity.symbol, quantity, opportunity.entry_price, leverage, notional_value);

        // Set leverage first
        if let Err(e) = adapter.set_leverage(&opportunity.symbol, leverage).await {
            warn!("⚠️ Failed to set leverage for {}: {}", opportunity.symbol, e);
        }

        // Place the order
        let side = if opportunity.direction == "BUY" { "Buy" } else { "Sell" };
        let order_id = adapter.place_order(
            &opportunity.symbol,
            side,
            "Market",
            quantity,
            None, // Market order, no price needed
            None, // No time in force for market orders
            None,  // No stop loss in order (will be managed separately)
            None,  // No take profit in order (will be managed separately)
        ).await?;

        info!("🎯 Order placed successfully: {} - Order ID: {}", opportunity.symbol, order_id);

        Ok(order_id)
    }

    /// Execute a managed trade with proper capital allocation and tracking
    async fn execute_managed_trade(&self, opportunity: &TradingOpportunity) -> Result<String> {
        let adapter = self.bybit_adapter.lock().await;

        // Calculate quantity based on 5 USDT position size
        let leverage = 20; // Conservative leverage for demo
        let notional_value = self.config.position_size_usdt * leverage as f64;
        let quantity = notional_value / opportunity.entry_price;

        info!("💰 Capital Management: Using {:.2}/{:.2} USDT (Buffer: {:.2} USDT)",
              self.config.position_size_usdt, self.config.capital_usdt, self.config.safety_buffer_usdt);

        info!("📊 Trade Details: {} {} {:.6} @ {:.4} (Leverage: {}x, Notional: {:.2} USDT)",
              opportunity.direction, opportunity.symbol, quantity, opportunity.entry_price, leverage, notional_value);

        // Set leverage first
        if let Err(e) = adapter.set_leverage(&opportunity.symbol, leverage).await {
            warn!("⚠️ Failed to set leverage for {}: {}", opportunity.symbol, e);
        }

        // Place the order
        let side = if opportunity.direction == "BUY" { "Buy" } else { "Sell" };
        let order_id = adapter.place_order(
            &opportunity.symbol,
            side,
            "Market",
            quantity,
            None, // Market order, no price needed
            None, // No time in force for market orders
            None,  // No stop loss in order (will be managed separately)
            None,  // No take profit in order (will be managed separately)
        ).await?;

        // Create active trade record
        let active_trade = ActiveTrade {
            order_id: order_id.clone(),
            symbol: opportunity.symbol.clone(),
            direction: opportunity.direction.clone(),
            entry_price: opportunity.entry_price,
            quantity,
            stop_loss: opportunity.stop_loss,
            take_profit: opportunity.take_profit,
            allocated_capital: self.config.position_size_usdt,
            timestamp: Utc::now(),
            is_managed: true,
        };

        // Add to active trades and update allocated capital
        let mut active_trades = self.active_trades.lock().await;
        active_trades.push(active_trade);
        drop(active_trades);

        let mut allocated_capital = self.allocated_capital.lock().await;
        *allocated_capital += self.config.position_size_usdt;
        drop(allocated_capital);

        info!("🎯 Trade {} added to management system", order_id);
        info!("💼 Active trades: {}, Allocated capital: {:.2} USDT",
              self.active_trades.lock().await.len(), *self.allocated_capital.lock().await);

        Ok(order_id)
    }

    /// Manage active trades (stop loss, take profit, trailing stops)
    async fn manage_active_trades(&self) -> Result<()> {
        let mut active_trades = self.active_trades.lock().await;
        let mut trades_to_remove = Vec::new();

        for (index, trade) in active_trades.iter().enumerate() {
            // Get current price for the symbol
            let adapter = self.bybit_adapter.lock().await;
            match adapter.get_market_tickers("linear", Some(&trade.symbol)).await {
                Ok(tickers) => {
                    if let Some(ticker) = tickers.first() {
                        let current_price = ticker.last_price;
                        drop(adapter);

                    // Check stop loss and take profit
                    let should_close = if trade.direction == "BUY" {
                        current_price <= trade.stop_loss || current_price >= trade.take_profit
                    } else {
                        current_price >= trade.stop_loss || current_price <= trade.take_profit
                    };

                    if should_close {
                        let reason = if (trade.direction == "BUY" && current_price <= trade.stop_loss) ||
                                        (trade.direction == "SELL" && current_price >= trade.stop_loss) {
                            "Stop Loss"
                        } else {
                            "Take Profit"
                        };

                        info!("🔄 Closing trade {} for {} at {:.4} ({})",
                              trade.order_id, trade.symbol, current_price, reason);

                        // Close the position
                        if let Err(e) = self.close_position(&trade.symbol, trade.quantity).await {
                            error!("❌ Failed to close position for {}: {}", trade.symbol, e);
                        } else {
                            trades_to_remove.push(index);

                            // Calculate PnL
                            let pnl = if trade.direction == "BUY" {
                                (current_price - trade.entry_price) * trade.quantity
                            } else {
                                (trade.entry_price - current_price) * trade.quantity
                            };

                            // Update performance tracking
                            let mut total_pnl = self.total_pnl.lock().await;
                            *total_pnl += pnl;
                            drop(total_pnl);

                            if pnl > 0.0 {
                                let mut winning_trades = self.winning_trades.lock().await;
                                *winning_trades += 1;
                            }

                            info!("💰 Trade closed: PnL {:.4} USDT", pnl);
                        }
                    }
                    } else {
                        warn!("⚠️ No ticker data for {}", trade.symbol);
                    }
                },
                Err(e) => {
                    warn!("⚠️ Failed to get ticker for {}: {}", trade.symbol, e);
                }
            }
        }

        // Remove closed trades and free up capital
        for &index in trades_to_remove.iter().rev() {
            let removed_trade = active_trades.remove(index);
            let mut allocated_capital = self.allocated_capital.lock().await;
            *allocated_capital -= removed_trade.allocated_capital;
            drop(allocated_capital);
            info!("🔓 Freed {:.2} USDT capital", removed_trade.allocated_capital);
        }

        Ok(())
    }

    /// Close a position
    async fn close_position(&self, symbol: &str, quantity: f64) -> Result<()> {
        let adapter = self.bybit_adapter.lock().await;

        // Place a market order to close the position
        let _order_id = adapter.place_order(
            symbol,
            "Sell", // Opposite side to close
            "Market",
            quantity,
            None,
            None,
            None,
            None,
        ).await?;

        Ok(())
    }

    /// Start trade management loop
    async fn start_trade_management(&self) -> Result<()> {
        info!("🔧 Starting trade management system...");
        println!("🔧 Starting trade management system...");

        loop {
            // Manage active trades every 5 seconds
            if let Err(e) = self.manage_active_trades().await {
                error!("❌ Trade management error: {}", e);
            }

            // Show current status
            let active_count = self.active_trades.lock().await.len();
            let allocated = *self.allocated_capital.lock().await;
            let available = self.config.capital_usdt - allocated - self.config.safety_buffer_usdt;

            if active_count > 0 {
                info!("🔄 Managing {} active trades, Allocated: {:.2} USDT, Available: {:.2} USDT",
                      active_count, allocated, available);
            }

            tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
        }
    }
}

// Helper functions for technical indicators (using OMNI-style implementations)

/// Calculate RSI (Relative Strength Index)
fn calculate_rsi(prices: &[f64], period: usize) -> f64 {
    if prices.len() < period + 1 {
        return 50.0;
    }

    let mut gains = Vec::new();
    let mut losses = Vec::new();

    for i in 1..prices.len() {
        let change = prices[i] - prices[i - 1];
        if change > 0.0 {
            gains.push(change);
            losses.push(0.0);
        } else {
            gains.push(0.0);
            losses.push(-change);
        }
    }

    if gains.len() < period {
        return 50.0;
    }

    let avg_gain = gains.iter().rev().take(period).sum::<f64>() / period as f64;
    let avg_loss = losses.iter().rev().take(period).sum::<f64>() / period as f64;

    if avg_loss == 0.0 {
        return 100.0;
    }

    let rs = avg_gain / avg_loss;
    100.0 - (100.0 / (1.0 + rs))
}

/// Calculate MACD (Moving Average Convergence Divergence)
fn calculate_macd(prices: &[f64], fast: usize, slow: usize, signal: usize) -> (f64, f64, f64) {
    if prices.len() < slow {
        return (0.0, 0.0, 0.0);
    }

    let ema_fast = calculate_ema(prices, fast);
    let ema_slow = calculate_ema(prices, slow);
    let macd_line = ema_fast - ema_slow;

    // For simplicity, using SMA for signal line (in practice, should use EMA)
    let signal_line = macd_line; // Simplified
    let histogram = macd_line - signal_line;

    (macd_line, signal_line, histogram)
}

/// Calculate EMA (Exponential Moving Average)
fn calculate_ema(prices: &[f64], period: usize) -> f64 {
    if prices.is_empty() || period == 0 {
        return 0.0;
    }

    if prices.len() < period {
        return prices.iter().sum::<f64>() / prices.len() as f64;
    }

    let multiplier = 2.0 / (period as f64 + 1.0);
    let mut ema = prices.iter().take(period).sum::<f64>() / period as f64;

    for &price in prices.iter().skip(period) {
        ema = (price * multiplier) + (ema * (1.0 - multiplier));
    }

    ema
}

/// Calculate Bollinger Bands
fn calculate_bollinger_bands(prices: &[f64], period: usize, std_dev: f64) -> (f64, f64, f64) {
    if prices.len() < period {
        let avg = prices.iter().sum::<f64>() / prices.len() as f64;
        return (avg, avg, avg);
    }

    let recent_prices: Vec<f64> = prices.iter().rev().take(period).cloned().collect();
    let sma = recent_prices.iter().sum::<f64>() / period as f64;

    let variance = recent_prices.iter()
        .map(|price| (price - sma).powi(2))
        .sum::<f64>() / period as f64;
    let std_deviation = variance.sqrt();

    let upper_band = sma + (std_deviation * std_dev);
    let lower_band = sma - (std_deviation * std_dev);

    (upper_band, sma, lower_band)
}

/// Calculate SMA (Simple Moving Average)
fn calculate_sma(prices: &[f64], period: usize) -> f64 {
    if prices.len() < period {
        return prices.iter().sum::<f64>() / prices.len() as f64;
    }

    prices.iter().rev().take(period).sum::<f64>() / period as f64
}

/// Calculate Stochastic Oscillator
fn calculate_stochastic(highs: &[f64], lows: &[f64], closes: &[f64], period: usize) -> (f64, f64) {
    if highs.len() < period || lows.len() < period || closes.len() < period {
        return (50.0, 50.0);
    }

    let recent_highs: Vec<f64> = highs.iter().rev().take(period).cloned().collect();
    let recent_lows: Vec<f64> = lows.iter().rev().take(period).cloned().collect();
    let current_close = closes[closes.len() - 1];

    let highest_high = recent_highs.iter().fold(f64::NEG_INFINITY, |a, &b| a.max(b));
    let lowest_low = recent_lows.iter().fold(f64::INFINITY, |a, &b| a.min(b));

    let k_percent = if highest_high != lowest_low {
        ((current_close - lowest_low) / (highest_high - lowest_low)) * 100.0
    } else {
        50.0
    };

    (k_percent, k_percent) // Simplified - D% would be SMA of K%
}

/// Calculate Williams %R
fn calculate_williams_r(highs: &[f64], lows: &[f64], closes: &[f64], period: usize) -> f64 {
    if highs.len() < period || lows.len() < period || closes.len() < period {
        return -50.0;
    }

    let recent_highs: Vec<f64> = highs.iter().rev().take(period).cloned().collect();
    let recent_lows: Vec<f64> = lows.iter().rev().take(period).cloned().collect();
    let current_close = closes[closes.len() - 1];

    let highest_high = recent_highs.iter().fold(f64::NEG_INFINITY, |a, &b| a.max(b));
    let lowest_low = recent_lows.iter().fold(f64::INFINITY, |a, &b| a.min(b));

    if highest_high != lowest_low {
        ((highest_high - current_close) / (highest_high - lowest_low)) * -100.0
    } else {
        -50.0
    }
}

/// Calculate CCI (Commodity Channel Index)
fn calculate_cci(highs: &[f64], lows: &[f64], closes: &[f64], period: usize) -> f64 {
    if highs.len() < period || lows.len() < period || closes.len() < period {
        return 0.0;
    }

    let mut typical_prices = Vec::new();
    for i in 0..highs.len() {
        let typical_price = (highs[i] + lows[i] + closes[i]) / 3.0;
        typical_prices.push(typical_price);
    }

    let recent_typical: Vec<f64> = typical_prices.iter().rev().take(period).cloned().collect();
    let sma_typical = recent_typical.iter().sum::<f64>() / period as f64;
    let current_typical = typical_prices[typical_prices.len() - 1];

    let mean_deviation = recent_typical.iter()
        .map(|&tp| (tp - sma_typical).abs())
        .sum::<f64>() / period as f64;

    if mean_deviation != 0.0 {
        (current_typical - sma_typical) / (0.015 * mean_deviation)
    } else {
        0.0
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    println!("🔧 Initializing Real OMNI Trader...");

    // Initialize logging
    tracing_subscriber::fmt::init();

    println!("📝 Logging initialized");
    info!("🚀 Starting Real OMNI Comprehensive Trading System");

    println!("🏗️ Creating trader instance...");
    // Create and start the real OMNI trader
    let trader = RealOmniTrader::new().await?;

    println!("▶️ Starting trading...");
    trader.start_trading().await?;

    Ok(())
}
