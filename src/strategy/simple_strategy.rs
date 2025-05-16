//! Simple Strategy
//!
//! This module provides a simple trading strategy for the OMNI-ALPHA VΩ∞∞ platform.

use anyhow::Result;
use serde::{Deserialize, Serialize};

/// Candle
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Candle {
    /// Open time
    pub open_time: i64,
    
    /// Open price
    pub open: f64,
    
    /// High price
    pub high: f64,
    
    /// Low price
    pub low: f64,
    
    /// Close price
    pub close: f64,
    
    /// Volume
    pub volume: f64,
}

/// Strategy configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StrategyConfig {
    /// Symbol
    pub symbol: String,
    
    /// Timeframe
    pub timeframe: u64,
    
    /// Take profit percentage
    pub take_profit_percent: f64,
    
    /// Stop loss percentage
    pub stop_loss_percent: f64,
    
    /// Risk per trade
    pub risk_per_trade: f64,
}

/// Simple strategy
pub struct SimpleStrategy {
    /// Configuration
    config: StrategyConfig,
    
    /// Candles
    candles: Vec<Candle>,
}

impl SimpleStrategy {
    /// Create a new simple strategy
    pub fn new(config: StrategyConfig) -> Self {
        Self {
            config,
            candles: Vec::new(),
        }
    }
    
    /// Update candles
    pub fn update_candles(&mut self, candles: Vec<Candle>) {
        self.candles = candles;
    }
    
    /// Calculate moving average
    pub fn calculate_ma(&self, period: usize) -> Result<Vec<f64>> {
        if self.candles.len() < period {
            return Err(anyhow::anyhow!("Not enough candles for MA calculation"));
        }
        
        let mut ma = Vec::new();
        
        for i in period..self.candles.len() + 1 {
            let sum: f64 = self.candles[i - period..i].iter().map(|c| c.close).sum();
            ma.push(sum / period as f64);
        }
        
        Ok(ma)
    }
    
    /// Calculate RSI
    pub fn calculate_rsi(&self, period: usize) -> Result<Vec<f64>> {
        if self.candles.len() < period + 1 {
            return Err(anyhow::anyhow!("Not enough candles for RSI calculation"));
        }
        
        let mut gains = Vec::new();
        let mut losses = Vec::new();
        
        for i in 1..self.candles.len() {
            let diff = self.candles[i].close - self.candles[i - 1].close;
            
            if diff >= 0.0 {
                gains.push(diff);
                losses.push(0.0);
            } else {
                gains.push(0.0);
                losses.push(-diff);
            }
        }
        
        let mut avg_gains = Vec::new();
        let mut avg_losses = Vec::new();
        
        let first_avg_gain: f64 = gains[0..period].iter().sum::<f64>() / period as f64;
        let first_avg_loss: f64 = losses[0..period].iter().sum::<f64>() / period as f64;
        
        avg_gains.push(first_avg_gain);
        avg_losses.push(first_avg_loss);
        
        for i in period..gains.len() {
            let avg_gain = (avg_gains.last().unwrap() * (period - 1) as f64 + gains[i]) / period as f64;
            let avg_loss = (avg_losses.last().unwrap() * (period - 1) as f64 + losses[i]) / period as f64;
            
            avg_gains.push(avg_gain);
            avg_losses.push(avg_loss);
        }
        
        let mut rsi = Vec::new();
        
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
    
    /// Generate signals
    pub fn generate_signals(&self) -> Result<Vec<(i64, String)>> {
        if self.candles.len() < 50 {
            return Err(anyhow::anyhow!("Not enough candles for signal generation"));
        }
        
        let ma_20 = self.calculate_ma(20)?;
        let ma_50 = self.calculate_ma(50)?;
        let rsi_14 = self.calculate_rsi(14)?;
        
        let mut signals = Vec::new();
        
        for i in 0..ma_20.len() - 30 {
            let candle_index = i + 50 - 1;
            
            // Golden cross (MA20 crosses above MA50)
            if i > 0 && ma_20[i - 1] <= ma_50[i - 1] && ma_20[i] > ma_50[i] {
                signals.push((self.candles[candle_index].open_time, "BUY".to_string()));
            }
            
            // Death cross (MA20 crosses below MA50)
            if i > 0 && ma_20[i - 1] >= ma_50[i - 1] && ma_20[i] < ma_50[i] {
                signals.push((self.candles[candle_index].open_time, "SELL".to_string()));
            }
            
            // Oversold (RSI < 30)
            if rsi_14[i] < 30.0 {
                signals.push((self.candles[candle_index].open_time, "BUY".to_string()));
            }
            
            // Overbought (RSI > 70)
            if rsi_14[i] > 70.0 {
                signals.push((self.candles[candle_index].open_time, "SELL".to_string()));
            }
        }
        
        Ok(signals)
    }
}
