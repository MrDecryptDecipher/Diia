//! Advanced Multi-Factor Trading Strategy
//!
//! This strategy integrates multiple analysis factors including technical indicators,
//! quantum predictions, hyperdimensional patterns, and market microstructure.

use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use anyhow::Result;
use tracing::{info, debug, warn, error};
use chrono::{DateTime, Utc};

use crate::strategy::simple_strategy::Candle;
use crate::agents::quantum_predictor::{QuantumPredictor, QuantumPrediction};
use crate::agents::hyperdimensional_pattern_recognizer::{HyperdimensionalPatternRecognizer, PatternRecognition};
use crate::quantum::spectral_tree_engine::SpectralTreeEngine;
use crate::quantum::hyperdimensional_computing::HyperdimensionalComputing;

/// Multi-factor analysis result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MultiFactorAnalysis {
    /// Symbol analyzed
    pub symbol: String,
    
    /// Analysis timestamp
    pub timestamp: DateTime<Utc>,
    
    /// Technical analysis score (0-100)
    pub technical_score: f64,
    
    /// Quantum prediction score (0-100)
    pub quantum_score: f64,
    
    /// Hyperdimensional pattern score (0-100)
    pub pattern_score: f64,
    
    /// Spectral analysis score (0-100)
    pub spectral_score: f64,
    
    /// Market microstructure score (0-100)
    pub microstructure_score: f64,
    
    /// Volume profile score (0-100)
    pub volume_score: f64,
    
    /// Composite score (weighted average)
    pub composite_score: f64,
    
    /// Confidence level (0-100)
    pub confidence: f64,
    
    /// Recommended action
    pub action: TradingAction,
    
    /// Factor breakdown
    pub factors: FactorBreakdown,
    
    /// Risk assessment
    pub risk_assessment: RiskAssessment,
}

/// Trading action recommendation
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum TradingAction {
    StrongBuy,
    Buy,
    Hold,
    Sell,
    StrongSell,
}

/// Factor breakdown for transparency
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FactorBreakdown {
    /// Technical indicators
    pub technical_indicators: HashMap<String, f64>,
    
    /// Quantum predictions
    pub quantum_predictions: HashMap<String, f64>,
    
    /// Pattern recognition results
    pub patterns: Vec<String>,
    
    /// Spectral analysis components
    pub spectral_components: HashMap<String, f64>,
    
    /// Market microstructure metrics
    pub microstructure_metrics: HashMap<String, f64>,
    
    /// Volume analysis
    pub volume_analysis: HashMap<String, f64>,
}

/// Risk assessment
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RiskAssessment {
    /// Volatility risk (0-100)
    pub volatility_risk: f64,
    
    /// Liquidity risk (0-100)
    pub liquidity_risk: f64,
    
    /// Market regime risk (0-100)
    pub market_regime_risk: f64,
    
    /// Correlation risk (0-100)
    pub correlation_risk: f64,
    
    /// Overall risk score (0-100)
    pub overall_risk: f64,
    
    /// Maximum recommended position size (% of capital)
    pub max_position_size: f64,
    
    /// Recommended stop loss distance (%)
    pub stop_loss_distance: f64,
    
    /// Recommended take profit distance (%)
    pub take_profit_distance: f64,
}

/// Advanced multi-factor trading strategy
pub struct AdvancedMultiFactorStrategy {
    /// Quantum predictor
    quantum_predictor: QuantumPredictor,
    
    /// Hyperdimensional pattern recognizer
    pattern_recognizer: HyperdimensionalPatternRecognizer,
    
    /// Spectral tree engine
    spectral_engine: SpectralTreeEngine,
    
    /// Hyperdimensional computing engine
    hyperdimensional_engine: HyperdimensionalComputing,
    
    /// Strategy configuration
    config: StrategyConfig,
    
    /// Analysis cache
    analysis_cache: HashMap<String, MultiFactorAnalysis>,
}

/// Strategy configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StrategyConfig {
    /// Minimum composite score for trading (0-100)
    pub min_composite_score: f64,
    
    /// Minimum confidence for trading (0-100)
    pub min_confidence: f64,
    
    /// Factor weights
    pub factor_weights: FactorWeights,
    
    /// Risk management settings
    pub risk_settings: RiskSettings,
    
    /// Technical indicator settings
    pub technical_settings: TechnicalSettings,
}

/// Factor weights for composite score calculation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FactorWeights {
    pub technical: f64,
    pub quantum: f64,
    pub pattern: f64,
    pub spectral: f64,
    pub microstructure: f64,
    pub volume: f64,
}

/// Risk management settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RiskSettings {
    /// Maximum risk per trade (% of capital)
    pub max_risk_per_trade: f64,
    
    /// Maximum portfolio risk (% of capital)
    pub max_portfolio_risk: f64,
    
    /// Volatility adjustment factor
    pub volatility_adjustment: f64,
    
    /// Correlation adjustment factor
    pub correlation_adjustment: f64,
}

/// Technical indicator settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TechnicalSettings {
    /// RSI period
    pub rsi_period: usize,
    
    /// MACD fast period
    pub macd_fast: usize,
    
    /// MACD slow period
    pub macd_slow: usize,
    
    /// MACD signal period
    pub macd_signal: usize,
    
    /// Bollinger Bands period
    pub bb_period: usize,
    
    /// Bollinger Bands standard deviations
    pub bb_std_dev: f64,
    
    /// ATR period
    pub atr_period: usize,
}

impl Default for StrategyConfig {
    fn default() -> Self {
        Self {
            min_composite_score: 75.0,
            min_confidence: 80.0,
            factor_weights: FactorWeights {
                technical: 0.25,
                quantum: 0.20,
                pattern: 0.20,
                spectral: 0.15,
                microstructure: 0.10,
                volume: 0.10,
            },
            risk_settings: RiskSettings {
                max_risk_per_trade: 1.0, // 1% per trade
                max_portfolio_risk: 5.0, // 5% total portfolio risk
                volatility_adjustment: 1.5,
                correlation_adjustment: 1.2,
            },
            technical_settings: TechnicalSettings {
                rsi_period: 14,
                macd_fast: 12,
                macd_slow: 26,
                macd_signal: 9,
                bb_period: 20,
                bb_std_dev: 2.0,
                atr_period: 14,
            },
        }
    }
}

impl AdvancedMultiFactorStrategy {
    /// Create new advanced multi-factor strategy
    pub fn new(config: StrategyConfig) -> Result<Self> {
        Ok(Self {
            quantum_predictor: QuantumPredictor::new(),
            pattern_recognizer: HyperdimensionalPatternRecognizer::new(),
            spectral_engine: SpectralTreeEngine::new(),
            hyperdimensional_engine: HyperdimensionalComputing::new(),
            config,
            analysis_cache: HashMap::new(),
        })
    }
    
    /// Perform comprehensive multi-factor analysis
    pub async fn analyze(&mut self, symbol: &str, candles: &[Candle]) -> Result<MultiFactorAnalysis> {
        info!("Starting multi-factor analysis for {}", symbol);
        
        if candles.len() < 50 {
            return Err(anyhow::anyhow!("Insufficient candle data for analysis"));
        }
        
        // 1. Technical Analysis
        let technical_score = self.calculate_technical_score(candles)?;
        let technical_indicators = self.calculate_technical_indicators(candles)?;
        
        // 2. Quantum Prediction
        let quantum_prediction = self.quantum_predictor.predict(symbol, candles)?;
        let quantum_score = quantum_prediction.confidence;
        let quantum_predictions = self.extract_quantum_metrics(&quantum_prediction);
        
        // 3. Hyperdimensional Pattern Recognition
        let pattern_recognition = self.pattern_recognizer.recognize_patterns(symbol, candles)?;
        let pattern_score = pattern_recognition.confluence_score;
        let patterns = self.extract_pattern_names(&pattern_recognition);
        
        // 4. Spectral Analysis
        let spectral_score = self.calculate_spectral_score(symbol, candles).await?;
        let spectral_components = self.calculate_spectral_components(candles)?;
        
        // 5. Market Microstructure Analysis
        let microstructure_score = self.calculate_microstructure_score(candles)?;
        let microstructure_metrics = self.calculate_microstructure_metrics(candles)?;
        
        // 6. Volume Profile Analysis
        let volume_score = self.calculate_volume_score(candles)?;
        let volume_analysis = self.calculate_volume_metrics(candles)?;
        
        // 7. Calculate Composite Score
        let composite_score = self.calculate_composite_score(
            technical_score,
            quantum_score,
            pattern_score,
            spectral_score,
            microstructure_score,
            volume_score,
        );
        
        // 8. Calculate Confidence
        let confidence = self.calculate_confidence(
            &technical_indicators,
            &quantum_prediction,
            &pattern_recognition,
        );
        
        // 9. Determine Trading Action
        let action = self.determine_trading_action(composite_score, confidence);
        
        // 10. Risk Assessment
        let risk_assessment = self.assess_risk(candles, composite_score)?;
        
        // Create factor breakdown
        let factors = FactorBreakdown {
            technical_indicators,
            quantum_predictions,
            patterns,
            spectral_components,
            microstructure_metrics,
            volume_analysis,
        };
        
        let analysis = MultiFactorAnalysis {
            symbol: symbol.to_string(),
            timestamp: Utc::now(),
            technical_score,
            quantum_score,
            pattern_score,
            spectral_score,
            microstructure_score,
            volume_score,
            composite_score,
            confidence,
            action,
            factors,
            risk_assessment,
        };
        
        // Cache the analysis
        self.analysis_cache.insert(symbol.to_string(), analysis.clone());
        
        info!(
            "Multi-factor analysis complete for {}: composite_score={:.1}, confidence={:.1}, action={:?}",
            symbol, composite_score, confidence, action
        );
        
        Ok(analysis)
    }
    
    /// Calculate technical analysis score
    fn calculate_technical_score(&self, candles: &[Candle]) -> Result<f64> {
        let mut score: f64 = 50.0; // Start neutral
        
        // RSI analysis
        let rsi = self.calculate_rsi(candles, self.config.technical_settings.rsi_period)?;
        if rsi < 30.0 {
            score += 15.0; // Oversold - bullish
        } else if rsi > 70.0 {
            score -= 15.0; // Overbought - bearish
        }
        
        // MACD analysis
        let (macd_line, signal_line, _) = self.calculate_macd(candles)?;
        if macd_line > signal_line && macd_line > 0.0 {
            score += 10.0; // Bullish MACD
        } else if macd_line < signal_line && macd_line < 0.0 {
            score -= 10.0; // Bearish MACD
        }
        
        // Moving average trend
        let sma_20 = self.calculate_sma(candles, 20)?;
        let sma_50 = self.calculate_sma(candles, 50)?;
        if sma_20 > sma_50 {
            score += 10.0; // Uptrend
        } else {
            score -= 10.0; // Downtrend
        }
        
        // Bollinger Bands position
        let (upper, middle, lower) = self.calculate_bollinger_bands(candles)?;
        let current_price = candles.last().unwrap().close;
        let bb_position = (current_price - lower) / (upper - lower);
        
        if bb_position < 0.2 {
            score += 8.0; // Near lower band - potential bounce
        } else if bb_position > 0.8 {
            score -= 8.0; // Near upper band - potential reversal
        }
        
        Ok(score.max(0.0).min(100.0))
    }

    /// Calculate technical indicators
    fn calculate_technical_indicators(&self, candles: &[Candle]) -> Result<HashMap<String, f64>> {
        let mut indicators = HashMap::new();

        // RSI
        let rsi = self.calculate_rsi(candles, self.config.technical_settings.rsi_period)?;
        indicators.insert("rsi".to_string(), rsi);

        // MACD
        let (macd_line, signal_line, histogram) = self.calculate_macd(candles)?;
        indicators.insert("macd".to_string(), macd_line);
        indicators.insert("macd_signal".to_string(), signal_line);
        indicators.insert("macd_histogram".to_string(), histogram);

        // Moving averages
        indicators.insert("sma_20".to_string(), self.calculate_sma(candles, 20)?);
        indicators.insert("sma_50".to_string(), self.calculate_sma(candles, 50)?);
        indicators.insert("sma_200".to_string(), self.calculate_sma(candles, 200)?);

        // Bollinger Bands
        let (upper, middle, lower) = self.calculate_bollinger_bands(candles)?;
        indicators.insert("bb_upper".to_string(), upper);
        indicators.insert("bb_middle".to_string(), middle);
        indicators.insert("bb_lower".to_string(), lower);

        // ATR
        indicators.insert("atr".to_string(), self.calculate_atr(candles)?);

        // Stochastic
        let (stoch_k, stoch_d) = self.calculate_stochastic(candles)?;
        indicators.insert("stoch_k".to_string(), stoch_k);
        indicators.insert("stoch_d".to_string(), stoch_d);

        Ok(indicators)
    }

    /// Extract quantum prediction metrics
    fn extract_quantum_metrics(&self, prediction: &QuantumPrediction) -> HashMap<String, f64> {
        let mut metrics = HashMap::new();

        metrics.insert("price_1h".to_string(), prediction.price_1h);
        metrics.insert("price_4h".to_string(), prediction.price_4h);
        metrics.insert("price_24h".to_string(), prediction.price_24h);
        metrics.insert("confidence".to_string(), prediction.confidence);
        // Note: volatility_forecast field doesn't exist in QuantumPrediction
        // metrics.insert("volatility_forecast".to_string(), prediction.volatility_forecast);

        metrics
    }

    /// Extract pattern names from recognition result
    fn extract_pattern_names(&self, recognition: &PatternRecognition) -> Vec<String> {
        recognition.patterns.iter()
            .map(|(pattern_type, _confidence)| format!("{:?}", pattern_type))
            .collect()
    }

    /// Calculate spectral analysis score using SpectralTreeEngine
    async fn calculate_spectral_score(&self, symbol: &str, candles: &[Candle]) -> Result<f64> {
        // Use SpectralTreeEngine for advanced frequency domain analysis
        match self.spectral_engine.predict_price(symbol, 3600) {
            Ok(prediction) => {
                let current_price = candles.last().unwrap().close;
                let price_change_pct = (prediction - current_price) / current_price * 100.0;

                // Convert price change to score (0-100)
                let score = 50.0 + (price_change_pct * 2.0).max(-50.0).min(50.0);
                Ok(score)
            },
            Err(_) => {
                warn!("Spectral analysis failed for {}, using neutral score", symbol);
                Ok(50.0)
            }
        }
    }

    /// Calculate spectral components
    fn calculate_spectral_components(&self, candles: &[Candle]) -> Result<HashMap<String, f64>> {
        let mut components = HashMap::new();

        // Extract price series
        let prices: Vec<f64> = candles.iter().map(|c| c.close).collect();

        // Calculate dominant frequencies (simplified)
        let trend_strength = self.calculate_trend_strength(&prices);
        let cycle_strength = self.calculate_cycle_strength(&prices);
        let noise_level = self.calculate_noise_level(&prices);

        components.insert("trend_strength".to_string(), trend_strength);
        components.insert("cycle_strength".to_string(), cycle_strength);
        components.insert("noise_level".to_string(), noise_level);
        components.insert("signal_to_noise".to_string(), trend_strength / noise_level.max(0.001));

        Ok(components)
    }

    /// Calculate market microstructure score
    fn calculate_microstructure_score(&self, candles: &[Candle]) -> Result<f64> {
        let mut score: f64 = 50.0;

        // Volume-price relationship
        let volume_price_correlation = self.calculate_volume_price_correlation(candles)?;
        if volume_price_correlation > 0.5 {
            score += 15.0; // Strong positive correlation
        } else if volume_price_correlation < -0.5 {
            score -= 15.0; // Strong negative correlation (divergence)
        }

        // Price impact analysis
        let price_impact = self.calculate_price_impact(candles)?;
        if price_impact < 0.5 {
            score += 10.0; // Low price impact - good liquidity
        } else if price_impact > 2.0 {
            score -= 10.0; // High price impact - poor liquidity
        }

        // Bid-ask spread proxy (using high-low range)
        let avg_spread = self.calculate_average_spread_proxy(candles)?;
        if avg_spread < 0.1 {
            score += 5.0; // Tight spreads
        } else if avg_spread > 0.5 {
            score -= 5.0; // Wide spreads
        }

        Ok(score.max(0.0).min(100.0))
    }

    /// Calculate microstructure metrics
    fn calculate_microstructure_metrics(&self, candles: &[Candle]) -> Result<HashMap<String, f64>> {
        let mut metrics = HashMap::new();

        metrics.insert("volume_price_correlation".to_string(),
                      self.calculate_volume_price_correlation(candles)?);
        metrics.insert("price_impact".to_string(),
                      self.calculate_price_impact(candles)?);
        metrics.insert("average_spread_proxy".to_string(),
                      self.calculate_average_spread_proxy(candles)?);
        metrics.insert("volume_weighted_price".to_string(),
                      self.calculate_vwap(candles)?);

        Ok(metrics)
    }

    /// Calculate volume analysis score
    fn calculate_volume_score(&self, candles: &[Candle]) -> Result<f64> {
        let mut score: f64 = 50.0;

        // Volume trend analysis
        let recent_volume = self.calculate_average_volume(&candles[candles.len()-10..])?;
        let historical_volume = self.calculate_average_volume(&candles[..candles.len()-10])?;

        let volume_ratio = recent_volume / historical_volume.max(0.001);

        if volume_ratio > 1.5 {
            score += 20.0; // High volume - strong conviction
        } else if volume_ratio < 0.5 {
            score -= 10.0; // Low volume - weak conviction
        }

        // Volume distribution analysis
        let volume_concentration = self.calculate_volume_concentration(candles)?;
        if volume_concentration > 0.7 {
            score += 10.0; // Concentrated volume - institutional activity
        }

        Ok(score.max(0.0).min(100.0))
    }

    /// Calculate volume metrics
    fn calculate_volume_metrics(&self, candles: &[Candle]) -> Result<HashMap<String, f64>> {
        let mut metrics = HashMap::new();

        let recent_volume = self.calculate_average_volume(&candles[candles.len()-10..])?;
        let historical_volume = self.calculate_average_volume(&candles[..candles.len()-10])?;

        metrics.insert("recent_volume".to_string(), recent_volume);
        metrics.insert("historical_volume".to_string(), historical_volume);
        metrics.insert("volume_ratio".to_string(), recent_volume / historical_volume.max(0.001));
        metrics.insert("volume_concentration".to_string(), self.calculate_volume_concentration(candles)?);
        metrics.insert("vwap".to_string(), self.calculate_vwap(candles)?);

        Ok(metrics)
    }

    /// Calculate composite score using factor weights
    fn calculate_composite_score(
        &self,
        technical: f64,
        quantum: f64,
        pattern: f64,
        spectral: f64,
        microstructure: f64,
        volume: f64,
    ) -> f64 {
        let weights = &self.config.factor_weights;

        (technical * weights.technical +
         quantum * weights.quantum +
         pattern * weights.pattern +
         spectral * weights.spectral +
         microstructure * weights.microstructure +
         volume * weights.volume) /
        (weights.technical + weights.quantum + weights.pattern +
         weights.spectral + weights.microstructure + weights.volume)
    }

    /// Calculate overall confidence
    fn calculate_confidence(
        &self,
        technical_indicators: &HashMap<String, f64>,
        quantum_prediction: &QuantumPrediction,
        pattern_recognition: &PatternRecognition,
    ) -> f64 {
        let mut confidence_factors = Vec::new();

        // Technical indicator confidence
        let rsi = technical_indicators.get("rsi").unwrap_or(&50.0);
        let rsi_confidence = if *rsi < 30.0 || *rsi > 70.0 { 80.0 } else { 40.0 };
        confidence_factors.push(rsi_confidence);

        // MACD confidence
        let macd = technical_indicators.get("macd").unwrap_or(&0.0);
        let macd_signal = technical_indicators.get("macd_signal").unwrap_or(&0.0);
        let macd_confidence = if (macd - macd_signal).abs() > 0.1 { 70.0 } else { 30.0 };
        confidence_factors.push(macd_confidence);

        // Quantum prediction confidence
        confidence_factors.push(quantum_prediction.confidence);

        // Pattern recognition confidence
        confidence_factors.push(pattern_recognition.confluence_score);

        // Calculate weighted average confidence
        confidence_factors.iter().sum::<f64>() / confidence_factors.len() as f64
    }

    /// Determine trading action based on score and confidence
    fn determine_trading_action(&self, composite_score: f64, confidence: f64) -> TradingAction {
        if confidence < self.config.min_confidence {
            return TradingAction::Hold;
        }

        if composite_score < self.config.min_composite_score {
            return TradingAction::Hold;
        }

        match composite_score {
            score if score >= 85.0 => TradingAction::StrongBuy,
            score if score >= 65.0 => TradingAction::Buy,
            score if score <= 15.0 => TradingAction::StrongSell,
            score if score <= 35.0 => TradingAction::Sell,
            _ => TradingAction::Hold,
        }
    }

    /// Assess risk for the trading opportunity
    fn assess_risk(&self, candles: &[Candle], composite_score: f64) -> Result<RiskAssessment> {
        // Calculate volatility risk
        let atr = self.calculate_atr(candles)?;
        let current_price = candles.last().unwrap().close;
        let volatility_pct = (atr / current_price) * 100.0;
        let volatility_risk = (volatility_pct * 10.0).min(100.0);

        // Calculate liquidity risk (using volume analysis)
        let avg_volume = self.calculate_average_volume(candles)?;
        let liquidity_risk = if avg_volume > 1_000_000.0 { 20.0 } else { 80.0 };

        // Market regime risk (trend consistency)
        let trend_consistency = self.calculate_trend_consistency(candles)?;
        let market_regime_risk = (100.0 - trend_consistency).max(0.0);

        // Correlation risk (placeholder - would need multiple assets)
        let correlation_risk = 30.0; // Default moderate correlation risk

        // Overall risk score
        let overall_risk = (volatility_risk + liquidity_risk + market_regime_risk + correlation_risk) / 4.0;

        // Position sizing based on risk
        let base_position_size = self.config.risk_settings.max_risk_per_trade;
        let risk_adjusted_size = base_position_size * (100.0 - overall_risk) / 100.0;
        let max_position_size = risk_adjusted_size.max(0.1).min(base_position_size);

        // Stop loss and take profit distances
        let stop_loss_distance = (volatility_pct * self.config.risk_settings.volatility_adjustment).max(0.5).min(5.0);
        let take_profit_distance = stop_loss_distance * 2.0; // 2:1 reward-to-risk ratio

        Ok(RiskAssessment {
            volatility_risk,
            liquidity_risk,
            market_regime_risk,
            correlation_risk,
            overall_risk,
            max_position_size,
            stop_loss_distance,
            take_profit_distance,
        })
    }

    // Helper methods for technical calculations

    /// Calculate RSI
    fn calculate_rsi(&self, candles: &[Candle], period: usize) -> Result<f64> {
        if candles.len() < period + 1 {
            return Ok(50.0); // Neutral RSI
        }

        let mut gains = 0.0;
        let mut losses = 0.0;

        for i in candles.len() - period..candles.len() {
            let change = candles[i].close - candles[i - 1].close;
            if change >= 0.0 {
                gains += change;
            } else {
                losses -= change;
            }
        }

        let avg_gain = gains / period as f64;
        let avg_loss = losses / period as f64;

        if avg_loss == 0.0 {
            return Ok(100.0);
        }

        let rs = avg_gain / avg_loss;
        Ok(100.0 - (100.0 / (1.0 + rs)))
    }

    /// Calculate MACD
    fn calculate_macd(&self, candles: &[Candle]) -> Result<(f64, f64, f64)> {
        let settings = &self.config.technical_settings;

        let ema_fast = self.calculate_ema(candles, settings.macd_fast)?;
        let ema_slow = self.calculate_ema(candles, settings.macd_slow)?;
        let macd_line = ema_fast - ema_slow;

        // For signal line, we'd need to calculate EMA of MACD line
        // Simplified: use a fraction of MACD line
        let signal_line = macd_line * 0.8;
        let histogram = macd_line - signal_line;

        Ok((macd_line, signal_line, histogram))
    }

    /// Calculate Simple Moving Average
    fn calculate_sma(&self, candles: &[Candle], period: usize) -> Result<f64> {
        if candles.len() < period {
            return Err(anyhow::anyhow!("Insufficient data for SMA calculation"));
        }

        let sum: f64 = candles[candles.len() - period..]
            .iter()
            .map(|c| c.close)
            .sum();

        Ok(sum / period as f64)
    }

    /// Calculate Exponential Moving Average
    fn calculate_ema(&self, candles: &[Candle], period: usize) -> Result<f64> {
        if candles.len() < period {
            return Err(anyhow::anyhow!("Insufficient data for EMA calculation"));
        }

        let multiplier = 2.0 / (period as f64 + 1.0);
        let mut ema = candles[0].close;

        for candle in &candles[1..] {
            ema = (candle.close * multiplier) + (ema * (1.0 - multiplier));
        }

        Ok(ema)
    }

    /// Calculate Bollinger Bands
    fn calculate_bollinger_bands(&self, candles: &[Candle]) -> Result<(f64, f64, f64)> {
        let period = self.config.technical_settings.bb_period;
        let std_dev = self.config.technical_settings.bb_std_dev;

        let sma = self.calculate_sma(candles, period)?;

        // Calculate standard deviation
        let variance: f64 = candles[candles.len() - period..]
            .iter()
            .map(|c| (c.close - sma).powi(2))
            .sum::<f64>() / period as f64;

        let std = variance.sqrt();

        let upper = sma + (std * std_dev);
        let lower = sma - (std * std_dev);

        Ok((upper, sma, lower))
    }

    /// Calculate Average True Range (ATR)
    fn calculate_atr(&self, candles: &[Candle]) -> Result<f64> {
        let period = self.config.technical_settings.atr_period;

        if candles.len() < period + 1 {
            return Ok(0.0);
        }

        let mut true_ranges = Vec::new();

        for i in 1..candles.len() {
            let high_low = candles[i].high - candles[i].low;
            let high_close = (candles[i].high - candles[i - 1].close).abs();
            let low_close = (candles[i].low - candles[i - 1].close).abs();

            let true_range = high_low.max(high_close).max(low_close);
            true_ranges.push(true_range);
        }

        let atr = true_ranges[true_ranges.len() - period..]
            .iter()
            .sum::<f64>() / period as f64;

        Ok(atr)
    }

    /// Calculate Stochastic oscillator
    fn calculate_stochastic(&self, candles: &[Candle]) -> Result<(f64, f64)> {
        let period = 14; // Standard stochastic period

        if candles.len() < period {
            return Ok((50.0, 50.0)); // Neutral values
        }

        let recent_candles = &candles[candles.len() - period..];
        let current_close = candles.last().unwrap().close;

        let highest_high = recent_candles.iter().map(|c| c.high).fold(0.0, f64::max);
        let lowest_low = recent_candles.iter().map(|c| c.low).fold(f64::INFINITY, f64::min);

        let k_percent = if highest_high != lowest_low {
            ((current_close - lowest_low) / (highest_high - lowest_low)) * 100.0
        } else {
            50.0
        };

        // Simplified %D calculation (3-period SMA of %K)
        let d_percent = k_percent * 0.8; // Approximation

        Ok((k_percent, d_percent))
    }

    // Additional helper methods for advanced analysis

    /// Calculate trend strength
    fn calculate_trend_strength(&self, prices: &[f64]) -> f64 {
        if prices.len() < 2 {
            return 0.0;
        }

        let mut directional_moves = 0;
        let total_moves = prices.len() - 1;

        for i in 1..prices.len() {
            if (prices[i] > prices[i - 1] && prices[0] < prices[prices.len() - 1]) ||
               (prices[i] < prices[i - 1] && prices[0] > prices[prices.len() - 1]) {
                directional_moves += 1;
            }
        }

        (directional_moves as f64 / total_moves as f64) * 100.0
    }

    /// Calculate cycle strength
    fn calculate_cycle_strength(&self, prices: &[f64]) -> f64 {
        // Simplified cycle detection using price oscillations
        if prices.len() < 10 {
            return 0.0;
        }

        let mut peaks = 0;
        let mut troughs = 0;

        for i in 1..prices.len() - 1 {
            if prices[i] > prices[i - 1] && prices[i] > prices[i + 1] {
                peaks += 1;
            } else if prices[i] < prices[i - 1] && prices[i] < prices[i + 1] {
                troughs += 1;
            }
        }

        let cycle_count = peaks + troughs;
        (cycle_count as f64 / prices.len() as f64) * 100.0
    }

    /// Calculate noise level
    fn calculate_noise_level(&self, prices: &[f64]) -> f64 {
        if prices.len() < 2 {
            return 0.0;
        }

        let mean = prices.iter().sum::<f64>() / prices.len() as f64;
        let variance = prices.iter()
            .map(|p| (p - mean).powi(2))
            .sum::<f64>() / prices.len() as f64;

        variance.sqrt() / mean * 100.0
    }

    /// Calculate volume-price correlation
    fn calculate_volume_price_correlation(&self, candles: &[Candle]) -> Result<f64> {
        if candles.len() < 10 {
            return Ok(0.0);
        }

        let prices: Vec<f64> = candles.iter().map(|c| c.close).collect();
        let volumes: Vec<f64> = candles.iter().map(|c| c.volume).collect();

        let price_mean = prices.iter().sum::<f64>() / prices.len() as f64;
        let volume_mean = volumes.iter().sum::<f64>() / volumes.len() as f64;

        let covariance = prices.iter().zip(volumes.iter())
            .map(|(p, v)| (p - price_mean) * (v - volume_mean))
            .sum::<f64>() / prices.len() as f64;

        let price_std = (prices.iter()
            .map(|p| (p - price_mean).powi(2))
            .sum::<f64>() / prices.len() as f64).sqrt();

        let volume_std = (volumes.iter()
            .map(|v| (v - volume_mean).powi(2))
            .sum::<f64>() / volumes.len() as f64).sqrt();

        if price_std == 0.0 || volume_std == 0.0 {
            Ok(0.0)
        } else {
            Ok(covariance / (price_std * volume_std))
        }
    }

    /// Calculate price impact
    fn calculate_price_impact(&self, candles: &[Candle]) -> Result<f64> {
        if candles.len() < 2 {
            return Ok(0.0);
        }

        let mut impacts = Vec::new();

        for i in 1..candles.len() {
            let price_change = (candles[i].close - candles[i - 1].close).abs();
            let volume_ratio = candles[i].volume / candles[i - 1].volume.max(1.0);

            if volume_ratio > 0.0 {
                impacts.push(price_change / volume_ratio);
            }
        }

        if impacts.is_empty() {
            Ok(0.0)
        } else {
            Ok(impacts.iter().sum::<f64>() / impacts.len() as f64)
        }
    }

    /// Calculate average spread proxy using high-low range
    fn calculate_average_spread_proxy(&self, candles: &[Candle]) -> Result<f64> {
        let spreads: Vec<f64> = candles.iter()
            .map(|c| (c.high - c.low) / c.close * 100.0)
            .collect();

        Ok(spreads.iter().sum::<f64>() / spreads.len() as f64)
    }

    /// Calculate Volume Weighted Average Price (VWAP)
    fn calculate_vwap(&self, candles: &[Candle]) -> Result<f64> {
        let total_volume: f64 = candles.iter().map(|c| c.volume).sum();

        if total_volume == 0.0 {
            return Ok(candles.last().unwrap().close);
        }

        let weighted_sum: f64 = candles.iter()
            .map(|c| c.close * c.volume)
            .sum();

        Ok(weighted_sum / total_volume)
    }

    /// Calculate average volume
    fn calculate_average_volume(&self, candles: &[Candle]) -> Result<f64> {
        if candles.is_empty() {
            return Ok(0.0);
        }

        let total_volume: f64 = candles.iter().map(|c| c.volume).sum();
        Ok(total_volume / candles.len() as f64)
    }

    /// Calculate volume concentration
    fn calculate_volume_concentration(&self, candles: &[Candle]) -> Result<f64> {
        if candles.len() < 10 {
            return Ok(0.5);
        }

        let mut volumes: Vec<f64> = candles.iter().map(|c| c.volume).collect();
        volumes.sort_by(|a, b| b.partial_cmp(a).unwrap());

        let top_10_pct = volumes.len() / 10;
        let top_volume: f64 = volumes[..top_10_pct].iter().sum();
        let total_volume: f64 = volumes.iter().sum();

        if total_volume == 0.0 {
            Ok(0.5)
        } else {
            Ok(top_volume / total_volume)
        }
    }

    /// Calculate trend consistency
    fn calculate_trend_consistency(&self, candles: &[Candle]) -> Result<f64> {
        if candles.len() < 20 {
            return Ok(50.0);
        }

        let sma_short = self.calculate_sma(&candles[candles.len()-10..], 5)?;
        let sma_medium = self.calculate_sma(&candles[candles.len()-20..], 10)?;
        let sma_long = self.calculate_sma(candles, 20)?;

        let trend_alignment = if (sma_short > sma_medium && sma_medium > sma_long) ||
                                (sma_short < sma_medium && sma_medium < sma_long) {
            100.0
        } else if (sma_short > sma_long) == (sma_medium > sma_long) {
            70.0
        } else {
            30.0
        };

        Ok(trend_alignment)
    }

    /// Get cached analysis for a symbol
    pub fn get_cached_analysis(&self, symbol: &str) -> Option<&MultiFactorAnalysis> {
        self.analysis_cache.get(symbol)
    }

    /// Clear analysis cache
    pub fn clear_cache(&mut self) {
        self.analysis_cache.clear();
    }
}
