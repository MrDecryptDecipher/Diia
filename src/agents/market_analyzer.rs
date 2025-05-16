//! Market Analyzer Agent
//! 
//! This agent is responsible for analyzing market data and identifying potential trading opportunities.

use std::collections::HashMap;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use anyhow::Result;
use tracing::{info, debug};

use crate::strategy::simple_strategy::Candle;

/// Market analysis result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarketAnalysis {
    /// Symbol
    pub symbol: String,
    
    /// Analysis timestamp
    pub timestamp: DateTime<Utc>,
    
    /// Current price
    pub current_price: f64,
    
    /// Price change percentage (24h)
    pub price_change_24h: f64,
    
    /// Volume change percentage (24h)
    pub volume_change_24h: f64,
    
    /// Volatility (standard deviation of returns)
    pub volatility: f64,
    
    /// Trend strength (0-100)
    pub trend_strength: f64,
    
    /// Trend direction (1 = up, -1 = down, 0 = sideways)
    pub trend_direction: i8,
    
    /// Support levels
    pub support_levels: Vec<f64>,
    
    /// Resistance levels
    pub resistance_levels: Vec<f64>,
    
    /// Technical indicators
    pub indicators: HashMap<String, f64>,
    
    /// Trading opportunity score (0-100)
    pub opportunity_score: f64,
}

/// Market Analyzer Agent
pub struct MarketAnalyzer {
    /// Analysis cache
    analysis_cache: HashMap<String, MarketAnalysis>,
}

impl MarketAnalyzer {
    /// Create a new market analyzer
    pub fn new() -> Self {
        Self {
            analysis_cache: HashMap::new(),
        }
    }
    
    /// Analyze market data for a symbol
    pub fn analyze(&mut self, symbol: &str, candles: &[Candle]) -> Result<MarketAnalysis> {
        if candles.is_empty() {
            return Err(anyhow::anyhow!("No candles provided for analysis"));
        }
        
        debug!("Analyzing {} candles for {}", candles.len(), symbol);
        
        // Get the latest candle
        let latest_candle = &candles[candles.len() - 1];
        
        // Calculate price change
        let price_change_24h = if candles.len() > 24 {
            let prev_candle = &candles[candles.len() - 25];
            (latest_candle.close - prev_candle.close) / prev_candle.close * 100.0
        } else {
            0.0
        };
        
        // Calculate volume change
        let volume_change_24h = if candles.len() > 24 {
            let prev_candle = &candles[candles.len() - 25];
            (latest_candle.volume - prev_candle.volume) / prev_candle.volume * 100.0
        } else {
            0.0
        };
        
        // Calculate volatility (standard deviation of returns)
        let returns: Vec<f64> = candles.windows(2)
            .map(|w| (w[1].close - w[0].close) / w[0].close)
            .collect();
        
        let mean_return = returns.iter().sum::<f64>() / returns.len() as f64;
        let volatility = (returns.iter()
            .map(|r| (r - mean_return).powi(2))
            .sum::<f64>() / returns.len() as f64)
            .sqrt() * 100.0;
        
        // Determine trend
        let (trend_strength, trend_direction) = self.calculate_trend(candles);
        
        // Find support and resistance levels
        let (support_levels, resistance_levels) = self.find_support_resistance(candles);
        
        // Calculate technical indicators
        let indicators = self.calculate_indicators(candles);
        
        // Calculate opportunity score
        let opportunity_score = self.calculate_opportunity_score(
            price_change_24h,
            volume_change_24h,
            volatility,
            trend_strength,
            trend_direction,
            &support_levels,
            &resistance_levels,
            &indicators,
            latest_candle.close,
        );
        
        // Create analysis result
        let analysis = MarketAnalysis {
            symbol: symbol.to_string(),
            timestamp: Utc::now(),
            current_price: latest_candle.close,
            price_change_24h,
            volume_change_24h,
            volatility,
            trend_strength,
            trend_direction,
            support_levels,
            resistance_levels,
            indicators,
            opportunity_score,
        };
        
        // Cache the analysis
        self.analysis_cache.insert(symbol.to_string(), analysis.clone());
        
        Ok(analysis)
    }
    
    /// Calculate trend strength and direction
    fn calculate_trend(&self, candles: &[Candle]) -> (f64, i8) {
        if candles.len() < 10 {
            return (0.0, 0);
        }
        
        // Use simple moving averages to determine trend
        let short_ma = self.calculate_sma(candles, 5);
        let long_ma = self.calculate_sma(candles, 20);
        
        // Trend direction
        let direction = if short_ma > long_ma {
            1 // Uptrend
        } else if short_ma < long_ma {
            -1 // Downtrend
        } else {
            0 // Sideways
        };
        
        // Trend strength (distance between MAs relative to price)
        let latest_price = candles.last().unwrap().close;
        let strength = (short_ma - long_ma).abs() / latest_price * 100.0;
        
        // Normalize strength to 0-100 scale
        let normalized_strength = (strength * 5.0).min(100.0);
        
        (normalized_strength, direction)
    }
    
    /// Calculate Simple Moving Average
    fn calculate_sma(&self, candles: &[Candle], period: usize) -> f64 {
        if candles.len() < period {
            return candles.last().unwrap().close;
        }
        
        let start_idx = candles.len() - period;
        let sum: f64 = candles[start_idx..].iter().map(|c| c.close).sum();
        
        sum / period as f64
    }
    
    /// Find support and resistance levels
    fn find_support_resistance(&self, candles: &[Candle]) -> (Vec<f64>, Vec<f64>) {
        let mut support_levels = Vec::new();
        let mut resistance_levels = Vec::new();
        
        if candles.len() < 20 {
            return (support_levels, resistance_levels);
        }
        
        // Find local minima and maxima
        for i in 5..candles.len() - 5 {
            let current = &candles[i];
            
            // Check for local minimum (support)
            if current.low < candles[i-1].low && 
               current.low < candles[i-2].low &&
               current.low < candles[i+1].low && 
               current.low < candles[i+2].low {
                support_levels.push(current.low);
            }
            
            // Check for local maximum (resistance)
            if current.high > candles[i-1].high && 
               current.high > candles[i-2].high &&
               current.high > candles[i+1].high && 
               current.high > candles[i+2].high {
                resistance_levels.push(current.high);
            }
        }
        
        // Limit to most recent levels
        support_levels.sort_by(|a, b| b.partial_cmp(a).unwrap());
        resistance_levels.sort_by(|a, b| a.partial_cmp(b).unwrap());
        
        if support_levels.len() > 3 {
            support_levels.truncate(3);
        }
        
        if resistance_levels.len() > 3 {
            resistance_levels.truncate(3);
        }
        
        (support_levels, resistance_levels)
    }
    
    /// Calculate technical indicators
    fn calculate_indicators(&self, candles: &[Candle]) -> HashMap<String, f64> {
        let mut indicators = HashMap::new();
        
        // RSI (Relative Strength Index)
        indicators.insert("rsi".to_string(), self.calculate_rsi(candles));
        
        // MACD (Moving Average Convergence Divergence)
        let (macd, signal) = self.calculate_macd(candles);
        indicators.insert("macd".to_string(), macd);
        indicators.insert("macd_signal".to_string(), signal);
        indicators.insert("macd_histogram".to_string(), macd - signal);
        
        // Bollinger Bands
        let (upper, middle, lower) = self.calculate_bollinger_bands(candles);
        indicators.insert("bb_upper".to_string(), upper);
        indicators.insert("bb_middle".to_string(), middle);
        indicators.insert("bb_lower".to_string(), lower);
        
        // Add more indicators as needed
        
        indicators
    }
    
    /// Calculate RSI (Relative Strength Index)
    fn calculate_rsi(&self, candles: &[Candle]) -> f64 {
        if candles.len() < 15 {
            return 50.0;
        }
        
        let period = 14;
        let prices: Vec<f64> = candles.iter().map(|c| c.close).collect();
        
        let mut gains = 0.0;
        let mut losses = 0.0;
        
        // Calculate initial average gain and loss
        for i in 1..=period {
            let diff = prices[prices.len() - i] - prices[prices.len() - i - 1];
            if diff >= 0.0 {
                gains += diff;
            } else {
                losses -= diff;
            }
        }
        
        let avg_gain = gains / period as f64;
        let avg_loss = losses / period as f64;
        
        if avg_loss == 0.0 {
            return 100.0;
        }
        
        let rs = avg_gain / avg_loss;
        let rsi = 100.0 - (100.0 / (1.0 + rs));
        
        rsi
    }
    
    /// Calculate MACD (Moving Average Convergence Divergence)
    fn calculate_macd(&self, candles: &[Candle]) -> (f64, f64) {
        if candles.len() < 35 {
            return (0.0, 0.0);
        }
        
        let prices: Vec<f64> = candles.iter().map(|c| c.close).collect();
        
        // Calculate EMAs
        let ema12 = self.calculate_ema(&prices, 12);
        let ema26 = self.calculate_ema(&prices, 26);
        
        // MACD Line = EMA12 - EMA26
        let macd = ema12 - ema26;
        
        // Signal Line = 9-day EMA of MACD Line
        let signal = macd; // Simplified for now
        
        (macd, signal)
    }
    
    /// Calculate EMA (Exponential Moving Average)
    fn calculate_ema(&self, prices: &[f64], period: usize) -> f64 {
        if prices.len() < period {
            return prices.last().unwrap_or(&0.0).clone();
        }
        
        let mut ema = prices[0];
        let multiplier = 2.0 / (period as f64 + 1.0);
        
        for i in 1..prices.len() {
            ema = (prices[i] - ema) * multiplier + ema;
        }
        
        ema
    }
    
    /// Calculate Bollinger Bands
    fn calculate_bollinger_bands(&self, candles: &[Candle]) -> (f64, f64, f64) {
        if candles.len() < 20 {
            let price = candles.last().unwrap().close;
            return (price * 1.02, price, price * 0.98);
        }
        
        let period = 20;
        let prices: Vec<f64> = candles.iter().map(|c| c.close).collect();
        
        // Calculate SMA
        let sma = self.calculate_sma(candles, period);
        
        // Calculate standard deviation
        let variance: f64 = prices.iter()
            .map(|p| (p - sma).powi(2))
            .sum::<f64>() / period as f64;
        
        let std_dev = variance.sqrt();
        
        // Calculate bands
        let upper_band = sma + (2.0 * std_dev);
        let lower_band = sma - (2.0 * std_dev);
        
        (upper_band, sma, lower_band)
    }
    
    /// Calculate opportunity score
    fn calculate_opportunity_score(
        &self,
        price_change: f64,
        volume_change: f64,
        volatility: f64,
        trend_strength: f64,
        trend_direction: i8,
        support_levels: &[f64],
        resistance_levels: &[f64],
        indicators: &HashMap<String, f64>,
        current_price: f64,
    ) -> f64 {
        let mut score = 50.0; // Start at neutral
        
        // Trend factors
        score += trend_strength * 0.2 * trend_direction as f64;
        
        // Momentum factors
        if price_change > 0.0 && volume_change > 0.0 {
            score += 5.0;
        } else if price_change < 0.0 && volume_change > 0.0 {
            score -= 5.0;
        }
        
        // Volatility factor (prefer moderate volatility)
        if volatility > 1.0 && volatility < 5.0 {
            score += 5.0;
        } else if volatility > 10.0 {
            score -= 10.0;
        }
        
        // Support/Resistance proximity
        if !support_levels.is_empty() {
            let closest_support = support_levels.iter()
                .map(|s| (s, (current_price - s).abs() / current_price))
                .min_by(|a, b| a.1.partial_cmp(&b.1).unwrap())
                .unwrap();
            
            if closest_support.1 < 0.01 && current_price > *closest_support.0 {
                score += 10.0; // Price just bounced off support
            }
        }
        
        if !resistance_levels.is_empty() {
            let closest_resistance = resistance_levels.iter()
                .map(|r| (r, (current_price - r).abs() / current_price))
                .min_by(|a, b| a.1.partial_cmp(&b.1).unwrap())
                .unwrap();
            
            if closest_resistance.1 < 0.01 && current_price < *closest_resistance.0 {
                score -= 10.0; // Price just rejected at resistance
            }
        }
        
        // Technical indicator factors
        if let Some(rsi) = indicators.get("rsi") {
            if *rsi < 30.0 {
                score += 10.0; // Oversold
            } else if *rsi > 70.0 {
                score -= 10.0; // Overbought
            }
        }
        
        if let (Some(macd), Some(signal)) = (indicators.get("macd"), indicators.get("macd_signal")) {
            if *macd > *signal && *macd > 0.0 {
                score += 10.0; // Bullish MACD crossover
            } else if *macd < *signal && *macd < 0.0 {
                score -= 10.0; // Bearish MACD crossover
            }
        }
        
        // Ensure score is within 0-100 range
        score.max(0.0).min(100.0)
    }
    
    /// Get cached analysis for a symbol
    pub fn get_cached_analysis(&self, symbol: &str) -> Option<&MarketAnalysis> {
        self.analysis_cache.get(symbol)
    }
    
    /// Get all cached analyses
    pub fn get_all_analyses(&self) -> &HashMap<String, MarketAnalysis> {
        &self.analysis_cache
    }
    
    /// Rank assets by opportunity score
    pub fn rank_assets(&self) -> Vec<(String, f64)> {
        let mut ranked_assets: Vec<(String, f64)> = self.analysis_cache
            .iter()
            .map(|(symbol, analysis)| (symbol.clone(), analysis.opportunity_score))
            .collect();
        
        // Sort by opportunity score (descending)
        ranked_assets.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());
        
        ranked_assets
    }
}
