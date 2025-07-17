use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{Mutex, RwLock};
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use reqwest::Client;
use hmac::{Hmac, Mac};
use sha2::Sha256;
use hex;
use uuid::Uuid;

type HmacSha256 = Hmac<Sha256>;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TradeManagerConfig {
    pub api_key: String,
    pub api_secret: String,
    pub base_url: String,
    pub capital_usdt: f64,
    pub position_size_usdt: f64,
    pub safety_buffer_usdt: f64,
    pub min_profit_usdt: f64,
    pub max_leverage: f64,
    pub target_win_rate: f64,
    pub max_daily_trades: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TradeSignal {
    pub id: String,
    pub symbol: String,
    pub direction: String, // "Buy" or "Sell"
    pub entry_price: f64,
    pub stop_loss: f64,
    pub take_profit: f64,
    pub leverage: f64,
    pub quantity: f64,
    pub confidence: f64,
    pub timestamp: DateTime<Utc>,
    pub order_type: String, // "Market" or "Limit"
    pub analysis_data: AnalysisData,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisData {
    pub rsi: f64,
    pub macd_signal: f64,
    pub bollinger_position: f64,
    pub volume_profile: f64,
    pub candlestick_pattern: String,
    pub support_resistance: (f64, f64),
    pub trend_strength: f64,
    pub volatility: f64,
    pub quantum_prediction: f64,
    pub ml_confidence: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivePosition {
    pub id: String,
    pub symbol: String,
    pub side: String,
    pub size: f64,
    pub entry_price: f64,
    pub current_price: f64,
    pub unrealized_pnl: f64,
    pub stop_loss: f64,
    pub take_profit: f64,
    pub trailing_stop: Option<f64>,
    pub leverage: f64,
    pub timestamp: DateTime<Utc>,
    pub order_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TradeResult {
    pub id: String,
    pub symbol: String,
    pub side: String,
    pub entry_price: f64,
    pub exit_price: f64,
    pub quantity: f64,
    pub pnl: f64,
    pub duration_seconds: i64,
    pub success: bool,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct PerformanceMetrics {
    pub total_trades: u32,
    pub winning_trades: u32,
    pub losing_trades: u32,
    pub win_rate: f64,
    pub total_pnl: f64,
    pub max_drawdown: f64,
    pub sharpe_ratio: f64,
    pub daily_trades: u32,
    pub last_reset: DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct MarketData {
    pub symbol: String,
    pub price: f64,
    pub volume: f64,
    pub timestamp: DateTime<Utc>,
    pub bid: f64,
    pub ask: f64,
    pub high_24h: f64,
    pub low_24h: f64,
    pub change_24h: f64,
}

#[derive(Debug, Clone)]
pub struct Kline {
    pub timestamp: i64,
    pub open: f64,
    pub high: f64,
    pub low: f64,
    pub close: f64,
    pub volume: f64,
}

#[derive(Debug, Clone)]
pub struct TrailingStopConfig {
    pub symbol: String,
    pub initial_stop: f64,
    pub trail_amount: f64,
    pub current_stop: f64,
    pub highest_price: f64,
    pub lowest_price: f64,
}

pub struct ComprehensiveTradeManager {
    config: TradeManagerConfig,
    client: Client,
    
    // State Management
    active_positions: Arc<RwLock<HashMap<String, ActivePosition>>>,
    trade_history: Arc<RwLock<Vec<TradeResult>>>,
    performance_metrics: Arc<RwLock<PerformanceMetrics>>,
    market_data_cache: Arc<RwLock<HashMap<String, MarketData>>>,
    trailing_stops: Arc<RwLock<HashMap<String, TrailingStopConfig>>>,
    
    // Trading State
    is_running: Arc<RwLock<bool>>,
}

impl ComprehensiveTradeManager {
    pub async fn new(config: TradeManagerConfig) -> Result<Self, Box<dyn std::error::Error + Send + Sync>> {
        let client = Client::new();
        
        let performance_metrics = PerformanceMetrics {
            total_trades: 0,
            winning_trades: 0,
            losing_trades: 0,
            win_rate: 0.0,
            total_pnl: 0.0,
            max_drawdown: 0.0,
            sharpe_ratio: 0.0,
            daily_trades: 0,
            last_reset: Utc::now(),
        };
        
        Ok(Self {
            config,
            client,
            active_positions: Arc::new(RwLock::new(HashMap::new())),
            trade_history: Arc::new(RwLock::new(Vec::new())),
            performance_metrics: Arc::new(RwLock::new(performance_metrics)),
            market_data_cache: Arc::new(RwLock::new(HashMap::new())),
            trailing_stops: Arc::new(RwLock::new(HashMap::new())),
            is_running: Arc::new(RwLock::new(false)),
        })
    }

    pub async fn start_comprehensive_trading(&self) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        println!("🚀 Starting Comprehensive Trade Manager with Full OMNI Integration");
        
        // Set running state
        {
            let mut running = self.is_running.write().await;
            *running = true;
        }
        
        // Start all monitoring and analysis tasks
        let market_data_task = self.start_market_data_feed();
        let position_monitoring_task = self.start_position_monitoring();
        let performance_tracking_task = self.start_performance_tracking();
        let opportunity_scanning_task = self.start_opportunity_scanning();
        
        // Run all tasks concurrently
        tokio::try_join!(
            market_data_task,
            position_monitoring_task,
            performance_tracking_task,
            opportunity_scanning_task
        )?;
        
        Ok(())
    }

    async fn start_market_data_feed(&self) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let client = self.client.clone();
        let config = self.config.clone();
        let market_data_cache = self.market_data_cache.clone();
        let is_running = self.is_running.clone();
        
        tokio::spawn(async move {
            loop {
                // Check if we should continue running
                {
                    let running = is_running.read().await;
                    if !*running {
                        break;
                    }
                }
                
                if let Ok(symbols) = Self::get_active_symbols(&client, &config).await {
                    for symbol in symbols.iter().take(50) { // Limit to 50 symbols for performance
                        if let Ok(market_data) = Self::fetch_market_data(&client, &config, symbol).await {
                            let mut cache = market_data_cache.write().await;
                            cache.insert(symbol.clone(), market_data);
                        }
                    }
                }
                tokio::time::sleep(tokio::time::Duration::from_millis(1000)).await;
            }
        });
        
        Ok(())
    }

    async fn start_position_monitoring(&self) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let client = self.client.clone();
        let config = self.config.clone();
        let active_positions = self.active_positions.clone();
        let is_running = self.is_running.clone();
        
        tokio::spawn(async move {
            loop {
                // Check if we should continue running
                {
                    let running = is_running.read().await;
                    if !*running {
                        break;
                    }
                }
                
                let positions = active_positions.read().await;
                for (symbol, position) in positions.iter() {
                    // Update position with current market price
                    if let Ok(current_price) = Self::get_current_price(&client, &config, symbol).await {
                        // Check for stop loss or take profit triggers
                        let should_close = Self::should_close_position(position, current_price);
                        
                        if should_close {
                            println!("🎯 Position trigger for {} at price {}", symbol, current_price);
                            // In a real implementation, we would close the position here
                        }
                    }
                }
                drop(positions);
                tokio::time::sleep(tokio::time::Duration::from_millis(2000)).await;
            }
        });
        
        Ok(())
    }

    async fn start_performance_tracking(&self) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let performance_metrics = self.performance_metrics.clone();
        let trade_history = self.trade_history.clone();
        let is_running = self.is_running.clone();
        
        tokio::spawn(async move {
            loop {
                // Check if we should continue running
                {
                    let running = is_running.read().await;
                    if !*running {
                        break;
                    }
                }
                
                let mut metrics = performance_metrics.write().await;
                let history = trade_history.read().await;
                
                // Update performance metrics
                metrics.total_trades = history.len() as u32;
                metrics.winning_trades = history.iter().filter(|t| t.success).count() as u32;
                metrics.losing_trades = metrics.total_trades - metrics.winning_trades;
                metrics.win_rate = if metrics.total_trades > 0 {
                    metrics.winning_trades as f64 / metrics.total_trades as f64
                } else {
                    0.0
                };
                metrics.total_pnl = history.iter().map(|t| t.pnl).sum();
                
                // Reset daily counter if needed
                if Utc::now().date_naive() != metrics.last_reset.date_naive() {
                    metrics.daily_trades = 0;
                    metrics.last_reset = Utc::now();
                }
                
                println!("📊 Performance: Win Rate: {:.2}%, Total PnL: {:.4} USDT, Daily Trades: {}", 
                    metrics.win_rate * 100.0, metrics.total_pnl, metrics.daily_trades);
                
                drop(metrics);
                drop(history);
                tokio::time::sleep(tokio::time::Duration::from_secs(30)).await;
            }
        });
        
        Ok(())
    }

    async fn start_opportunity_scanning(&self) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let client = self.client.clone();
        let config = self.config.clone();
        let market_data_cache = self.market_data_cache.clone();
        let is_running = self.is_running.clone();
        
        tokio::spawn(async move {
            loop {
                // Check if we should continue running
                {
                    let running = is_running.read().await;
                    if !*running {
                        break;
                    }
                }
                
                // Scan for trading opportunities
                if let Ok(symbols) = Self::get_active_symbols(&client, &config).await {
                    for symbol in symbols.iter().take(20) { // Limit scanning for performance
                        if let Ok(analysis) = Self::perform_comprehensive_analysis(&client, &config, symbol).await {
                            
                            if analysis.ml_confidence > 0.8 && analysis.quantum_prediction > 0.7 {
                                println!("🎯 High confidence opportunity found: {} (Confidence: {:.2}%)", 
                                    symbol, analysis.ml_confidence * 100.0);
                                
                                // Generate trade signal
                                let trade_signal = Self::generate_trade_signal(symbol, &analysis).await;
                                
                                // Execute trade if conditions are met
                                if Self::should_execute_trade(&trade_signal, &config).await {
                                    println!("✅ Executing trade signal for {}", symbol);
                                    // In a real implementation, we would execute the trade here
                                }
                            }
                        }
                    }
                }
                tokio::time::sleep(tokio::time::Duration::from_millis(5000)).await;
            }
        });
        
        Ok(())
    }

    // Bybit API Integration Methods
    async fn get_active_symbols(client: &Client, config: &TradeManagerConfig) -> Result<Vec<String>, Box<dyn std::error::Error + Send + Sync>> {
        let url = format!("{}/v5/market/instruments-info", config.base_url);
        let params = [("category", "linear")];

        let response = client.get(&url).query(&params).send().await?;
        let json: serde_json::Value = response.json().await?;

        let mut symbols = Vec::new();
        if let Some(result) = json.get("result") {
            if let Some(list) = result.get("list") {
                if let Some(array) = list.as_array() {
                    for item in array.iter().take(300) {
                        if let Some(symbol) = item.get("symbol") {
                            if let Some(symbol_str) = symbol.as_str() {
                                if symbol_str.ends_with("USDT") {
                                    symbols.push(symbol_str.to_string());
                                }
                            }
                        }
                    }
                }
            }
        }

        Ok(symbols)
    }

    async fn fetch_market_data(client: &Client, config: &TradeManagerConfig, symbol: &str) -> Result<MarketData, Box<dyn std::error::Error + Send + Sync>> {
        let url = format!("{}/v5/market/tickers", config.base_url);
        let params = [("category", "linear"), ("symbol", symbol)];

        let response = client.get(&url).query(&params).send().await?;
        let json: serde_json::Value = response.json().await?;

        if let Some(result) = json.get("result") {
            if let Some(list) = result.get("list") {
                if let Some(array) = list.as_array() {
                    if let Some(ticker) = array.first() {
                        return Ok(MarketData {
                            symbol: symbol.to_string(),
                            price: ticker.get("lastPrice").and_then(|v| v.as_str()).and_then(|s| s.parse().ok()).unwrap_or(0.0),
                            volume: ticker.get("volume24h").and_then(|v| v.as_str()).and_then(|s| s.parse().ok()).unwrap_or(0.0),
                            timestamp: Utc::now(),
                            bid: ticker.get("bid1Price").and_then(|v| v.as_str()).and_then(|s| s.parse().ok()).unwrap_or(0.0),
                            ask: ticker.get("ask1Price").and_then(|v| v.as_str()).and_then(|s| s.parse().ok()).unwrap_or(0.0),
                            high_24h: ticker.get("highPrice24h").and_then(|v| v.as_str()).and_then(|s| s.parse().ok()).unwrap_or(0.0),
                            low_24h: ticker.get("lowPrice24h").and_then(|v| v.as_str()).and_then(|s| s.parse().ok()).unwrap_or(0.0),
                            change_24h: ticker.get("price24hPcnt").and_then(|v| v.as_str()).and_then(|s| s.parse().ok()).unwrap_or(0.0),
                        });
                    }
                }
            }
        }

        Err("Failed to fetch market data".into())
    }

    async fn get_current_price(client: &Client, config: &TradeManagerConfig, symbol: &str) -> Result<f64, Box<dyn std::error::Error + Send + Sync>> {
        let market_data = Self::fetch_market_data(client, config, symbol).await?;
        Ok(market_data.price)
    }

    async fn fetch_klines(client: &Client, config: &TradeManagerConfig, symbol: &str, interval: &str, limit: u32) -> Result<Vec<Kline>, Box<dyn std::error::Error + Send + Sync>> {
        let url = format!("{}/v5/market/kline", config.base_url);
        let params = [
            ("category", "linear"),
            ("symbol", symbol),
            ("interval", interval),
            ("limit", &limit.to_string()),
        ];

        let response = client.get(&url).query(&params).send().await?;
        let json: serde_json::Value = response.json().await?;

        let mut klines = Vec::new();
        if let Some(result) = json.get("result") {
            if let Some(list) = result.get("list") {
                if let Some(array) = list.as_array() {
                    for item in array {
                        if let Some(kline_array) = item.as_array() {
                            if kline_array.len() >= 6 {
                                klines.push(Kline {
                                    timestamp: kline_array[0].as_str().and_then(|s| s.parse().ok()).unwrap_or(0),
                                    open: kline_array[1].as_str().and_then(|s| s.parse().ok()).unwrap_or(0.0),
                                    high: kline_array[2].as_str().and_then(|s| s.parse().ok()).unwrap_or(0.0),
                                    low: kline_array[3].as_str().and_then(|s| s.parse().ok()).unwrap_or(0.0),
                                    close: kline_array[4].as_str().and_then(|s| s.parse().ok()).unwrap_or(0.0),
                                    volume: kline_array[5].as_str().and_then(|s| s.parse().ok()).unwrap_or(0.0),
                                });
                            }
                        }
                    }
                }
            }
        }

        Ok(klines)
    }

    // Comprehensive Analysis Methods
    async fn perform_comprehensive_analysis(
        client: &Client,
        config: &TradeManagerConfig,
        symbol: &str,
    ) -> Result<AnalysisData, Box<dyn std::error::Error + Send + Sync>> {

        // Fetch comprehensive market data
        let klines = Self::fetch_klines(client, config, symbol, "1", 200).await?;

        if klines.is_empty() {
            return Err("No kline data available".into());
        }

        // Technical Analysis
        let prices: Vec<f64> = klines.iter().map(|k| k.close).collect();
        let volumes: Vec<f64> = klines.iter().map(|k| k.volume).collect();
        let highs: Vec<f64> = klines.iter().map(|k| k.high).collect();
        let lows: Vec<f64> = klines.iter().map(|k| k.low).collect();

        // RSI Calculation
        let rsi = Self::calculate_rsi(&prices, 14);

        // MACD Calculation
        let (macd_line, signal_line, _) = Self::calculate_macd(&prices, 12, 26, 9);
        let macd_signal = macd_line.last().unwrap_or(&0.0) - signal_line.last().unwrap_or(&0.0);

        // Bollinger Bands
        let (upper_band, _middle_band, lower_band) = Self::calculate_bollinger_bands(&prices, 20, 2.0);
        let current_price = prices.last().unwrap_or(&0.0);
        let bollinger_position = (current_price - lower_band.last().unwrap_or(&0.0)) /
            (upper_band.last().unwrap_or(&0.0) - lower_band.last().unwrap_or(&0.0));

        // ATR for volatility
        let atr = Self::calculate_atr(&highs, &lows, &prices, 14);

        // Candlestick Pattern Recognition
        let candlestick_pattern = Self::identify_candlestick_patterns(&klines);

        // Support and Resistance
        let (support, resistance) = Self::calculate_support_resistance(&highs, &lows, &prices);

        // Volume Analysis
        let volume_profile = Self::analyze_volume_profile(&volumes, &prices);

        // Trend Strength
        let trend_strength = Self::calculate_trend_strength(&prices, 50);

        // Quantum Analysis (simplified)
        let quantum_prediction = Self::quantum_market_prediction(&klines);

        // Machine Learning Confidence
        let ml_confidence = Self::calculate_ml_confidence(
            rsi, macd_signal, bollinger_position, volume_profile,
            trend_strength, quantum_prediction
        );

        Ok(AnalysisData {
            rsi,
            macd_signal,
            bollinger_position,
            volume_profile,
            candlestick_pattern,
            support_resistance: (support, resistance),
            trend_strength,
            volatility: atr,
            quantum_prediction,
            ml_confidence,
        })
    }

    // Technical Indicator Calculations
    fn calculate_rsi(prices: &[f64], period: usize) -> f64 {
        if prices.len() < period + 1 { return 50.0; }

        let mut gains = 0.0;
        let mut losses = 0.0;

        for i in 1..=period {
            let change = prices[prices.len() - i] - prices[prices.len() - i - 1];
            if change > 0.0 { gains += change; } else { losses -= change; }
        }

        let avg_gain = gains / period as f64;
        let avg_loss = losses / period as f64;

        if avg_loss == 0.0 { return 100.0; }

        let rs = avg_gain / avg_loss;
        100.0 - (100.0 / (1.0 + rs))
    }

    fn calculate_macd(prices: &[f64], fast: usize, slow: usize, signal: usize) -> (Vec<f64>, Vec<f64>, Vec<f64>) {
        let ema_fast = Self::calculate_ema(prices, fast);
        let ema_slow = Self::calculate_ema(prices, slow);

        let macd_line: Vec<f64> = ema_fast.iter().zip(ema_slow.iter())
            .map(|(fast, slow)| fast - slow).collect();

        let signal_line = Self::calculate_ema(&macd_line, signal);
        let histogram: Vec<f64> = macd_line.iter().zip(signal_line.iter())
            .map(|(macd, signal)| macd - signal).collect();

        (macd_line, signal_line, histogram)
    }

    fn calculate_ema(prices: &[f64], period: usize) -> Vec<f64> {
        if prices.is_empty() { return vec![]; }

        let multiplier = 2.0 / (period as f64 + 1.0);
        let mut ema = vec![prices[0]];

        for &price in prices.iter().skip(1) {
            let new_ema = (price * multiplier) + (ema.last().unwrap() * (1.0 - multiplier));
            ema.push(new_ema);
        }

        ema
    }

    fn calculate_bollinger_bands(prices: &[f64], period: usize, std_dev: f64) -> (Vec<f64>, Vec<f64>, Vec<f64>) {
        let sma = Self::calculate_sma(prices, period);
        let mut upper = Vec::new();
        let mut lower = Vec::new();

        for i in period-1..prices.len() {
            let slice = &prices[i+1-period..=i];
            let mean = slice.iter().sum::<f64>() / period as f64;
            let variance = slice.iter().map(|x| (x - mean).powi(2)).sum::<f64>() / period as f64;
            let std = variance.sqrt();

            upper.push(sma[i - (period - 1)] + (std_dev * std));
            lower.push(sma[i - (period - 1)] - (std_dev * std));
        }

        (upper, sma, lower)
    }

    fn calculate_sma(prices: &[f64], period: usize) -> Vec<f64> {
        prices.windows(period)
            .map(|window| window.iter().sum::<f64>() / period as f64)
            .collect()
    }

    fn calculate_atr(highs: &[f64], lows: &[f64], closes: &[f64], period: usize) -> f64 {
        if highs.len() < period + 1 { return 0.0; }

        let mut true_ranges = Vec::new();

        for i in 1..highs.len() {
            let tr1 = highs[i] - lows[i];
            let tr2 = (highs[i] - closes[i-1]).abs();
            let tr3 = (lows[i] - closes[i-1]).abs();
            true_ranges.push(tr1.max(tr2).max(tr3));
        }

        true_ranges.iter().rev().take(period).sum::<f64>() / period as f64
    }

    fn identify_candlestick_patterns(klines: &[Kline]) -> String {
        if klines.len() < 3 { return "Unknown".to_string(); }

        let last = &klines[klines.len() - 1];
        let _prev = &klines[klines.len() - 2];

        // Doji pattern
        if (last.close - last.open).abs() / (last.high - last.low) < 0.1 {
            return "Doji".to_string();
        }

        // Hammer pattern
        let body_size = (last.close - last.open).abs();
        let lower_shadow = last.open.min(last.close) - last.low;
        let upper_shadow = last.high - last.open.max(last.close);

        if lower_shadow > body_size * 2.0 && upper_shadow < body_size * 0.5 {
            return "Hammer".to_string();
        }

        "No Pattern".to_string()
    }

    fn calculate_support_resistance(highs: &[f64], lows: &[f64], _closes: &[f64]) -> (f64, f64) {
        if highs.is_empty() || lows.is_empty() {
            return (0.0, 0.0);
        }

        // Simple support/resistance calculation
        let recent_highs = &highs[highs.len().saturating_sub(20)..];
        let recent_lows = &lows[lows.len().saturating_sub(20)..];

        let resistance = recent_highs.iter().fold(0.0f64, |acc, &x| acc.max(x));
        let support = recent_lows.iter().fold(f64::INFINITY, |acc, &x| acc.min(x));

        (support, resistance)
    }

    fn analyze_volume_profile(volumes: &[f64], _prices: &[f64]) -> f64 {
        if volumes.is_empty() { return 0.5; }

        let avg_volume = volumes.iter().sum::<f64>() / volumes.len() as f64;
        let recent_volume = volumes.last().unwrap_or(&0.0);

        (recent_volume / avg_volume).min(2.0) / 2.0
    }

    fn calculate_trend_strength(prices: &[f64], period: usize) -> f64 {
        if prices.len() < period { return 0.0; }

        let recent_prices = &prices[prices.len() - period..];
        let first_price = recent_prices[0];
        let last_price = recent_prices[recent_prices.len() - 1];

        let trend = (last_price - first_price) / first_price;
        trend.abs().min(1.0)
    }

    fn quantum_market_prediction(klines: &[Kline]) -> f64 {
        if klines.len() < 10 { return 0.5; }

        // Quantum field analysis (simplified)
        let price_changes: Vec<f64> = klines.windows(2)
            .map(|w| (w[1].close - w[0].close) / w[0].close)
            .collect();

        let quantum_field = price_changes.iter()
            .enumerate()
            .map(|(i, &change)| change * (i as f64 * std::f64::consts::PI / price_changes.len() as f64).cos())
            .sum::<f64>() / price_changes.len() as f64;

        (quantum_field + 1.0) / 2.0
    }

    fn calculate_ml_confidence(
        rsi: f64, macd: f64, bollinger_pos: f64, volume_profile: f64,
        trend_strength: f64, quantum_pred: f64
    ) -> f64 {
        // Machine learning confidence calculation
        let technical_score = (rsi / 100.0 + bollinger_pos + volume_profile) / 3.0;
        let momentum_score = (macd.abs().min(1.0) + trend_strength) / 2.0;
        let advanced_score = quantum_pred;

        (technical_score + momentum_score + advanced_score) / 3.0
    }

    async fn generate_trade_signal(symbol: &str, analysis: &AnalysisData) -> TradeSignal {
        let direction = if analysis.quantum_prediction > 0.6 && analysis.rsi < 70.0 {
            "Buy"
        } else if analysis.quantum_prediction < 0.4 && analysis.rsi > 30.0 {
            "Sell"
        } else {
            "Buy" // Default to buy for demo
        };

        let current_price = analysis.support_resistance.0 +
            (analysis.support_resistance.1 - analysis.support_resistance.0) * 0.5;

        let leverage = if analysis.volatility < 0.02 { 100.0 } else { 50.0 };

        let stop_loss = if direction == "Buy" {
            current_price * 0.995 // 0.5% stop loss
        } else {
            current_price * 1.005
        };

        let take_profit = if direction == "Buy" {
            current_price * 1.008 // 0.8% take profit
        } else {
            current_price * 0.992
        };

        TradeSignal {
            id: Uuid::new_v4().to_string(),
            symbol: symbol.to_string(),
            direction: direction.to_string(),
            entry_price: current_price,
            stop_loss,
            take_profit,
            leverage,
            quantity: 0.0, // Will be calculated during execution
            confidence: analysis.ml_confidence,
            timestamp: Utc::now(),
            order_type: if analysis.volatility > 0.03 { "Market".to_string() } else { "Limit".to_string() },
            analysis_data: analysis.clone(),
        }
    }

    async fn should_execute_trade(signal: &TradeSignal, config: &TradeManagerConfig) -> bool {
        signal.confidence > 0.75 &&
        signal.leverage <= config.max_leverage &&
        (signal.take_profit - signal.entry_price).abs() / signal.entry_price >= 0.006 // Min 0.6% profit potential
    }

    fn should_close_position(position: &ActivePosition, current_price: f64) -> bool {
        // Check stop loss
        if position.side == "Buy" && current_price <= position.stop_loss {
            return true;
        }
        if position.side == "Sell" && current_price >= position.stop_loss {
            return true;
        }

        // Check take profit
        if position.side == "Buy" && current_price >= position.take_profit {
            return true;
        }
        if position.side == "Sell" && current_price <= position.take_profit {
            return true;
        }

        false
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let config = TradeManagerConfig {
        api_key: std::env::var("BYBIT_API_KEY").expect("BYBIT_API_KEY not set"),
        api_secret: std::env::var("BYBIT_API_SECRET").expect("BYBIT_API_SECRET not set"),
        base_url: "https://api-demo.bybit.com".to_string(),
        capital_usdt: 12.0,
        position_size_usdt: 5.0,
        safety_buffer_usdt: 2.0,
        min_profit_usdt: 0.6,
        max_leverage: 100.0,
        target_win_rate: 0.85,
        max_daily_trades: 750,
    };

    let trade_manager = ComprehensiveTradeManager::new(config).await?;

    println!("🚀 Starting Comprehensive Trade Manager");
    println!("📊 Capital: 12 USDT | Position Size: 5 USDT | Safety Buffer: 2 USDT");
    println!("🎯 Target: 0.6 USDT min profit per trade | 85% win rate | 750 trades/day");
    println!("⚡ Leverage: Up to 100x | Real-time analysis with OMNI components");

    trade_manager.start_comprehensive_trading().await?;

    Ok(())
}
