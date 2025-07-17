//! Asset Scanner Module
//!
//! This module provides functionality for scanning and analyzing trading assets.

use std::collections::HashMap;
use std::sync::Arc;
use anyhow::Result;
use chrono::Utc;
use tracing::{info, debug, warn};
use serde::{Serialize, Deserialize};

use crate::exchange::bybit::adapter::BybitAdapter;
use crate::exchange::bybit::types::BybitKline;
use crate::exchange::types::Candle;
use crate::strategy::indicators::*;
use crate::agents::quantum_predictor::QuantumPredictor;

/// Trading opportunity
#[derive(Debug, Clone)]
pub struct TradingOpportunity {
    /// Symbol
    pub symbol: String,

    /// Action (buy/sell)
    pub action: String,

    /// Price
    pub price: f64,

    /// Score (0.0-1.0)
    pub score: f64,

    /// Reason
    pub reason: String,

    /// Timestamp
    pub timestamp: chrono::DateTime<Utc>,
}

/// Asset metadata
#[derive(Debug, Clone)]
pub struct AssetMetadata {
    /// Symbol
    pub symbol: String,

    /// Base asset
    pub base_asset: String,

    /// Quote asset
    pub quote_asset: String,

    /// Minimum quantity
    pub min_qty: f64,

    /// Maximum quantity
    pub max_qty: f64,

    /// Quantity precision
    pub qty_precision: i32,

    /// Price precision
    pub price_precision: i32,

    /// Minimum price
    pub min_price: f64,

    /// Maximum price
    pub max_price: f64,

    /// Maximum leverage
    pub max_leverage: f64,

    /// Funding rate
    pub funding_rate: f64,

    /// Fee rate
    pub fee_rate: f64,
}

impl Default for AssetMetadata {
    fn default() -> Self {
        Self {
            symbol: String::new(),
            base_asset: String::new(),
            quote_asset: String::new(),
            min_qty: 0.0,
            max_qty: 0.0,
            qty_precision: 0,
            price_precision: 0,
            min_price: 0.0,
            max_price: 0.0,
            max_leverage: 10.0,
            funding_rate: 0.0001,
            fee_rate: 0.0006,
        }
    }
}

/// Asset scanner
pub struct AssetScanner {
    /// Exchange adapter
    exchange: Arc<BybitAdapter>,

    /// Maximum assets to analyze
    max_assets: usize,

    /// Timeframes to analyze
    timeframes: Vec<String>,

    /// Asset metadata cache
    asset_metadata: HashMap<String, AssetMetadata>,

    /// Quantum predictor
    quantum_predictor: QuantumPredictor,
}

impl AssetScanner {
    /// Create a new asset scanner
    pub fn new(exchange: Arc<BybitAdapter>, max_assets: usize, timeframes: Vec<String>) -> Self {
        Self {
            exchange,
            max_assets,
            timeframes,
            asset_metadata: HashMap::new(),
            quantum_predictor: QuantumPredictor::new(),
        }
    }

    /// Scan all assets
    pub async fn scan_all_assets(&mut self) -> Result<Vec<TradingOpportunity>> {
        debug!("Scanning all assets...");

        // Get all instruments
        let instrument_info = self.exchange.get_instruments("linear").await?;

        // Filter USDT pairs
        let usdt_pairs: Vec<_> = instrument_info.list
            .into_iter()
            .filter(|i| i.symbol.ends_with("USDT"))
            .take(self.max_assets)
            .collect();

        debug!("Found {} USDT pairs", usdt_pairs.len());

        // Scan each asset
        let mut opportunities = Vec::new();

        for instrument in usdt_pairs {
            let symbol = instrument.symbol.clone();
            
            // Get klines for the shortest timeframe
            if let Some(timeframe) = self.timeframes.first() {
                match self.exchange.get_klines(&symbol, timeframe, 100, "linear").await {
                    Ok(klines) => {
                        if let Some(opportunity) = self.analyze_asset(&symbol, &klines).await? {
                            opportunities.push(opportunity);
                        }
                    }
                    Err(e) => {
                        warn!("Failed to get klines for {}: {}", symbol, e);
                        continue;
                    }
                }
            }
        }

        // Sort by score (descending)
        opportunities.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap_or(std::cmp::Ordering::Equal));

        Ok(opportunities)
    }

    /// Analyze asset
    async fn analyze_asset(&mut self, symbol: &str, klines: &[BybitKline]) -> Result<Option<TradingOpportunity>> {
        if klines.len() < 30 {
            return Ok(None);
        }

        // Convert to candles
        let candles: Vec<Candle> = klines.iter().map(|k| {
            Candle {
                timestamp: chrono::DateTime::from_timestamp(k.start_time, 0).unwrap_or_else(|| Utc::now()),
                open: k.open,
                high: k.high,
                low: k.low,
                close: k.close,
                volume: k.volume,
            }
        }).collect();


        // Convert to strategy candles for quantum predictor
        let simple_candles: Vec<crate::strategy::simple_strategy::Candle> = candles.iter().map(|k| {
            crate::strategy::simple_strategy::Candle {
                open_time: k.timestamp.timestamp(),
                open: k.open,
                high: k.high,
                low: k.low,
                close: k.close,
                volume: k.volume,
            }
        }).collect();
        // Calculate indicators
        let close_prices: Vec<f64> = candles.iter().map(|c| c.close).collect();
        
        let rsi_14 = calculate_rsi(&candles, 14);
        let (macd_line, signal_line, _) = calculate_macd(&candles);
        let (upper_band, middle_band, lower_band) = calculate_bollinger_bands(&candles, 20, 2.0);
        
        let current_price = candles.last().unwrap().close;

        // Get quantum prediction
        let prediction = match self.quantum_predictor.predict(symbol, &simple_candles[..]) {
            Ok(p) => p,
            Err(e) => {
                warn!("Failed to generate quantum prediction for {}: {}", symbol, e);
                return Ok(None);
            }
        };

        // Generate LONG signal (buy)
        let long_signal = (
            // Condition 1: RSI oversold + MACD bullish + price below lower BB
            (rsi_14 < 30.0 && macd_line > signal_line && current_price < lower_band) ||
            // Condition 2: Strong bullish momentum with confirmation
            (macd_line > signal_line && macd_line > 0.0 && 
             candles.windows(3).last().map_or(false, |w| w[0].close < w[1].close && w[1].close < w[2].close)) ||
            // Condition 3: Quantum predictor strongly bullish
            (prediction.confidence > 85.0 && prediction.price_4h > current_price * 1.01)
        );

        // Generate SHORT signal (sell)
        let short_signal = (
            // Condition 1: RSI overbought + MACD bearish + price above upper BB
            (rsi_14 > 70.0 && macd_line < signal_line && current_price > upper_band) ||
            // Condition 2: Strong bearish momentum with confirmation
            (macd_line < signal_line && macd_line < 0.0 && 
             candles.windows(3).last().map_or(false, |w| w[0].close > w[1].close && w[1].close > w[2].close)) ||
            // Condition 3: Quantum predictor strongly bearish
            (prediction.confidence > 85.0 && prediction.price_4h < current_price * 0.99)
        );

        // Calculate score and reason with detailed analysis
        let (action, score, reason) = if long_signal {
            // LONG position (buy)
            let confidence_boost = prediction.confidence / 100.0 * 0.2;
            let volume_boost = if candles.last().unwrap().volume > candles.iter().rev().skip(1).take(10).map(|c| c.volume).sum::<f64>() / 10.0 {
                0.1 // Volume is above 10-period average
            } else {
                0.0
            };
            
            let base_score = 0.8;
            let final_score = (base_score + confidence_boost + volume_boost).min(1.0);
            
            ("buy", final_score, format!(
                "LONG: RSI={:.1} (oversold<30), MACD={:.6}>{:.6} (bullish), Price=${:.2}<${:.2} (below lower BB), \
                Quantum confidence={:.1}%, Predicted 4h=${:.2} (+{:.2}%)", 
                rsi_14, macd_line, signal_line, current_price, lower_band, 
                prediction.confidence, prediction.price_4h, (prediction.price_4h/current_price-1.0)*100.0
            ))
        } else if short_signal {
            // SHORT position (sell)
            let confidence_boost = prediction.confidence / 100.0 * 0.2;
            let volume_boost = if candles.last().unwrap().volume > candles.iter().rev().skip(1).take(10).map(|c| c.volume).sum::<f64>() / 10.0 {
                0.1 // Volume is above 10-period average
            } else {
                0.0
            };
            
            let base_score = 0.8;
            let final_score = (base_score + confidence_boost + volume_boost).min(1.0);
            
            ("sell", final_score, format!(
                "SHORT: RSI={:.1} (overbought>70), MACD={:.6}<{:.6} (bearish), Price=${:.2}>${:.2} (above upper BB), \
                Quantum confidence={:.1}%, Predicted 4h=${:.2} ({:.2}%)", 
                rsi_14, macd_line, signal_line, current_price, upper_band, 
                prediction.confidence, prediction.price_4h, (prediction.price_4h/current_price-1.0)*100.0
            ))
        } else {
            return Ok(None);
        };

        // Create trading opportunity
        let opportunity = TradingOpportunity {
            symbol: symbol.to_string(),
            action: action.to_string(),
            price: current_price,
            score,
            reason,
            timestamp: Utc::now(),
        };

        Ok(Some(opportunity))
    }

    /// Get asset metadata
    pub async fn get_asset_metadata(&self, symbol: &str) -> Result<AssetMetadata> {
        // Check cache
        if let Some(metadata) = self.asset_metadata.get(symbol) {
            return Ok(metadata.clone());
        }

        // Get instrument info
        let instrument_info = self.exchange.get_instruments("linear").await?;
        
        if let Some(instrument) = instrument_info.list.iter().find(|i| i.symbol == symbol) {
            // Extract base and quote currencies from symbol
            let (base_currency, quote_currency) = if symbol.ends_with("USDT") {
                let base = symbol.trim_end_matches("USDT");
                (base.to_string(), "USDT".to_string())
            } else {
                // Default fallback
                (symbol.to_string(), "".to_string())
            };
            
            // Create metadata
            let metadata = AssetMetadata {
                symbol: symbol.to_string(),
                base_asset: base_currency,
                quote_asset: quote_currency,
                min_qty: instrument.lot_size_filter.min_trading_qty,
                max_qty: instrument.lot_size_filter.max_trading_qty,
                qty_precision: instrument.lot_size_filter.qty_step.to_string().split('.').nth(1).map_or(0, |s| s.len()) as i32,
                price_precision: instrument.price_filter.tick_size.to_string().split('.').nth(1).map_or(0, |s| s.len()) as i32,
                min_price: instrument.price_filter.min_price,
                max_price: instrument.price_filter.max_price,
                max_leverage: instrument.leverage_filter.max_leverage as f64,
                funding_rate: 0.0001, // Default funding rate
                fee_rate: 0.0006, // Default fee rate (0.06%)
            };

            Ok(metadata)
        } else {
            // Return default metadata
            Ok(AssetMetadata {
                symbol: symbol.to_string(),
                ..Default::default()
            })
        }
    }
}
