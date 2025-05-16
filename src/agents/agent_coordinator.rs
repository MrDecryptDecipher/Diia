//! Agent Coordinator
//!
//! This module coordinates the actions of all trading agents to make final trading decisions.

use std::collections::HashMap;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use anyhow::Result;
use tracing::{info, debug, error, warn};

use crate::engine::message_bus::TradeDirection;
use crate::exchange::bybit::adapter::BybitAdapter;
use crate::strategy::simple_strategy::Candle;
use crate::agents::market_analyzer::{MarketAnalyzer, MarketAnalysis};
use crate::agents::sentiment_analyzer::{SentimentAnalyzer, SentimentAnalysis};
use crate::agents::risk_manager::{RiskManager, RiskAssessment};
use crate::agents::trade_executor::{TradeExecutor, TradeExecution, ExecutionStatus};
use crate::agents::zero_loss_enforcer::{ZeroLossEnforcer, ZeroLossAssessment};
use crate::agents::quantum_predictor::{QuantumPredictor, QuantumPrediction};
use crate::agents::hyperdimensional_pattern_recognizer::{HyperdimensionalPatternRecognizer, PatternRecognition, PatternType};

/// Trading decision with superintelligent analysis
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TradingDecision {
    /// Symbol
    pub symbol: String,

    /// Decision timestamp
    pub timestamp: DateTime<Utc>,

    /// Decision type
    pub decision_type: DecisionType,

    /// Confidence level (0-100)
    pub confidence: f64,

    /// Market analysis
    pub market_analysis: Option<MarketAnalysis>,

    /// Sentiment analysis
    pub sentiment_analysis: Option<SentimentAnalysis>,

    /// Risk assessment
    pub risk_assessment: Option<RiskAssessment>,

    /// Zero-loss assessment
    pub zero_loss_assessment: Option<ZeroLossAssessment>,

    /// Quantum prediction
    pub quantum_prediction: Option<QuantumPrediction>,

    /// Pattern recognition
    pub pattern_recognition: Option<PatternRecognition>,

    /// Trade execution
    pub trade_execution: Option<TradeExecution>,

    /// Reasoning
    pub reasoning: String,

    /// Superintelligence score (0-100)
    pub superintelligence_score: f64,
}

/// Decision type
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DecisionType {
    /// Enter long position
    EnterLong,

    /// Enter short position
    EnterShort,

    /// Exit position
    Exit,

    /// Hold (no action)
    Hold,

    /// Insufficient data
    InsufficientData,
}

/// Superintelligent Agent Coordinator
pub struct AgentCoordinator {
    /// Market analyzer
    market_analyzer: MarketAnalyzer,

    /// Sentiment analyzer
    sentiment_analyzer: SentimentAnalyzer,

    /// Risk manager
    risk_manager: RiskManager,

    /// Trade executor
    trade_executor: TradeExecutor,

    /// Zero-loss enforcer
    zero_loss_enforcer: ZeroLossEnforcer,

    /// Quantum predictor
    quantum_predictor: QuantumPredictor,

    /// Hyperdimensional pattern recognizer
    pattern_recognizer: HyperdimensionalPatternRecognizer,

    /// Decision cache
    decision_cache: HashMap<String, TradingDecision>,

    /// Minimum confidence threshold
    min_confidence: f64,

    /// Minimum opportunity score threshold
    min_opportunity_score: f64,

    /// Maximum risk score threshold
    max_risk_score: f64,

    /// Exponential growth mode
    exponential_growth_mode: bool,

    /// Superintelligence level (1-10)
    superintelligence_level: u8,

    /// Quantum entanglement factor
    quantum_entanglement_factor: f64,

    /// Hyperdimensional projection factor
    hyperdimensional_factor: f64,
}

impl AgentCoordinator {
    /// Create a new superintelligent agent coordinator
    pub fn new(total_capital: f64) -> Self {
        info!("Initializing SUPERINTELLIGENT Agent Coordinator with ${:.2} capital", total_capital);

        Self {
            market_analyzer: MarketAnalyzer::new(),
            sentiment_analyzer: SentimentAnalyzer::new(),
            risk_manager: RiskManager::new(total_capital),
            trade_executor: TradeExecutor::new(),
            zero_loss_enforcer: ZeroLossEnforcer::new(),
            quantum_predictor: QuantumPredictor::new(),
            pattern_recognizer: HyperdimensionalPatternRecognizer::new(),
            decision_cache: HashMap::new(),
            min_confidence: 90.0, // Minimum 90% confidence for exceptional trades
            min_opportunity_score: 90.0, // Minimum 90% opportunity score for exceptional trades
            max_risk_score: 30.0, // Maximum 30% risk score for ultra-safe trades
            exponential_growth_mode: true, // Enable exponential growth mode
            superintelligence_level: 10, // Maximum superintelligence
            quantum_entanglement_factor: 0.618, // Golden ratio for quantum entanglement
            hyperdimensional_factor: 1.618, // Golden ratio for hyperdimensional projection
        }
    }

    /// Process market data and make trading decisions
    pub async fn process_data(
        &mut self,
        adapter: &mut BybitAdapter,
        symbol: &str,
        candles: &[Candle],
    ) -> Result<TradingDecision> {
        debug!("Processing data for {}", symbol);

        // Step 1: Market Analysis with Superintelligence
        let market_analysis = match self.market_analyzer.analyze(symbol, candles) {
            Ok(analysis) => {
                debug!("Market analysis for {}: opportunity score = {}",
                       symbol, analysis.opportunity_score);
                Some(analysis)
            },
            Err(e) => {
                error!("Failed to analyze market data for {}: {}", symbol, e);
                None
            }
        };

        // Step 2: Sentiment Analysis with Superintelligence
        let sentiment_analysis = match self.sentiment_analyzer.analyze(symbol) {
            Ok(analysis) => {
                debug!("Sentiment analysis for {}: score = {}",
                       symbol, analysis.sentiment_score);
                Some(analysis)
            },
            Err(e) => {
                error!("Failed to analyze sentiment for {}: {}", symbol, e);
                None
            }
        };

        // Step 3: Quantum Prediction
        let quantum_prediction = match self.quantum_predictor.predict(symbol, candles) {
            Ok(prediction) => {
                debug!("Quantum prediction for {}: 1h price = ${:.2}, confidence = {:.1}%",
                       symbol, prediction.price_1h, prediction.confidence);
                Some(prediction)
            },
            Err(e) => {
                warn!("Failed to generate quantum prediction for {}: {}", symbol, e);
                None
            }
        };

        // Step 4: Hyperdimensional Pattern Recognition
        let pattern_recognition = match self.pattern_recognizer.recognize_patterns(symbol, candles) {
            Ok(recognition) => {
                debug!("Pattern recognition for {}: detected {} patterns, confluence = {:.1}%",
                       symbol, recognition.patterns.len(), recognition.confluence_score);
                Some(recognition)
            },
            Err(e) => {
                warn!("Failed to recognize patterns for {}: {}", symbol, e);
                None
            }
        };

        // Check if we have enough data
        if market_analysis.is_none() || sentiment_analysis.is_none() {
            let decision = TradingDecision {
                symbol: symbol.to_string(),
                timestamp: Utc::now(),
                decision_type: DecisionType::InsufficientData,
                confidence: 0.0,
                market_analysis: None,
                sentiment_analysis: None,
                risk_assessment: None,
                zero_loss_assessment: None,
                quantum_prediction: None,
                pattern_recognition: None,
                trade_execution: None,
                reasoning: "Insufficient data for analysis".to_string(),
                superintelligence_score: 0.0,
            };

            self.decision_cache.insert(symbol.to_string(), decision.clone());
            return Ok(decision);
        }

        let market_analysis = market_analysis.unwrap();
        let sentiment_analysis = sentiment_analysis.unwrap();

        // Step 3: Risk Assessment
        let risk_assessment = match self.risk_manager.assess_risk(
            symbol,
            &market_analysis,
            &sentiment_analysis,
            market_analysis.current_price,
        ) {
            Ok(assessment) => {
                debug!("Risk assessment for {}: risk score = {}, max position = ${:.2}",
                       symbol, assessment.risk_score, assessment.max_position_size);
                Some(assessment)
            },
            Err(e) => {
                error!("Failed to assess risk for {}: {}", symbol, e);
                None
            }
        };

        if risk_assessment.is_none() {
            let decision = TradingDecision {
                symbol: symbol.to_string(),
                timestamp: Utc::now(),
                decision_type: DecisionType::InsufficientData,
                confidence: 0.0,
                market_analysis: Some(market_analysis),
                sentiment_analysis: Some(sentiment_analysis),
                risk_assessment: None,
                zero_loss_assessment: None,
                quantum_prediction: None,
                pattern_recognition: None,
                trade_execution: None,
                reasoning: "Failed to assess risk".to_string(),
                superintelligence_score: 0.0,
            };

            self.decision_cache.insert(symbol.to_string(), decision.clone());
            return Ok(decision);
        }

        let risk_assessment = risk_assessment.unwrap();

        // Step 4: Make Trading Decision
        let (decision_type, confidence, reasoning) = self.make_decision(
            &market_analysis,
            &sentiment_analysis,
            &risk_assessment,
            quantum_prediction.as_ref(),
            pattern_recognition.as_ref(),
        );

        debug!("Trading decision for {}: {:?} (confidence: {})",
               symbol, decision_type, confidence);

        // Step 5: Zero-Loss Enforcement
        let mut zero_loss_assessment = None;
        let mut trade_execution = None;

        if confidence >= self.min_confidence {
            match decision_type {
                DecisionType::EnterLong | DecisionType::EnterShort => {
                    // Check if we already have an active position
                    if adapter.get_positions(Some(symbol)).await.unwrap_or_default().is_empty() {
                        // Convert decision type to trade direction
                        let direction = match decision_type {
                            DecisionType::EnterLong => TradeDirection::Long,
                            DecisionType::EnterShort => TradeDirection::Short,
                            _ => unreachable!(),
                        };

                        // Perform zero-loss assessment
                        match self.zero_loss_enforcer.assess_trade(
                            symbol,
                            direction,
                            market_analysis.current_price,
                            &market_analysis,
                            &sentiment_analysis,
                            &risk_assessment,
                        ) {
                            Ok(assessment) => {
                                zero_loss_assessment = Some(assessment.clone());

                                if assessment.approved {
                                    info!("Zero-loss enforcement APPROVED trade for {}: {}",
                                          symbol, assessment.reasoning);

                                    // Execute trade with zero-loss parameters
                                    // Use the same direction since Long/Short are the only variants
                                    let trade_direction = direction;

                                    match self.trade_executor.execute_trade(
                                        adapter,
                                        symbol,
                                        trade_direction,
                                        &risk_assessment,
                                        market_analysis.current_price,
                                    ).await {
                                        Ok(execution) => {
                                            info!("Executed {:?} trade for {} with {:.1}x leverage",
                                                  direction, symbol, assessment.leverage);
                                            trade_execution = Some(execution);
                                        },
                                        Err(e) => {
                                            error!("Failed to execute {:?} trade for {}: {}",
                                                  direction, symbol, e);
                                        }
                                    }
                                } else {
                                    warn!("Zero-loss enforcement REJECTED trade for {}: {}",
                                          symbol, assessment.reasoning);
                                }
                            },
                            Err(e) => {
                                error!("Failed to perform zero-loss assessment for {}: {}", symbol, e);
                            }
                        }
                    } else {
                        warn!("Already have a position for {}, skipping trade execution", symbol);
                    }
                },
                DecisionType::Exit => {
                    // Check if we have an active position
                    if !adapter.get_positions(Some(symbol)).await.unwrap_or_default().is_empty() {
                        // Close position
                        match self.trade_executor.close_position(adapter, symbol).await {
                            Ok(_) => {
                                info!("Closed position for {}", symbol);
                            },
                            Err(e) => {
                                error!("Failed to close position for {}: {}", symbol, e);
                            }
                        }
                    } else {
                        debug!("No position to exit for {}", symbol);
                    }
                },
                _ => {
                    // No action needed
                }
            }
        } else {
            debug!("Confidence too low for trade execution: {}", confidence);
        }

        // Calculate superintelligence score
        let superintelligence_score = self.calculate_superintelligence_score(
            &market_analysis,
            &sentiment_analysis,
            quantum_prediction.as_ref(),
            pattern_recognition.as_ref(),
            zero_loss_assessment.as_ref(),
        );

        // Create decision result with superintelligence
        let decision = TradingDecision {
            symbol: symbol.to_string(),
            timestamp: Utc::now(),
            decision_type,
            confidence,
            market_analysis: Some(market_analysis),
            sentiment_analysis: Some(sentiment_analysis),
            risk_assessment: Some(risk_assessment),
            zero_loss_assessment,
            quantum_prediction,
            pattern_recognition,
            trade_execution,
            reasoning,
            superintelligence_score,
        };

        // Cache the decision
        self.decision_cache.insert(symbol.to_string(), decision.clone());

        Ok(decision)
    }

    /// Make trading decision with hyper-intelligent algorithm for exponential capital growth
    fn make_decision(
        &self,
        market_analysis: &MarketAnalysis,
        sentiment_analysis: &SentimentAnalysis,
        risk_assessment: &RiskAssessment,
        quantum_prediction: Option<&QuantumPrediction>,
        pattern_recognition: Option<&PatternRecognition>,
    ) -> (DecisionType, f64, String) {
        // Multi-dimensional analysis with quantum-inspired decision making
        let mut reasoning = String::new();

        // 1. SUPERINTELLIGENT OPPORTUNITY ANALYSIS
        // Require exceptional setups for exponential capital growth
        let min_required_score = 90.0; // Require extraordinary setups

        if market_analysis.opportunity_score < min_required_score {
            return (
                DecisionType::Hold,
                50.0,
                format!("Opportunity score insufficient for exponential growth: {:.1} (minimum: {:.1})",
                        market_analysis.opportunity_score, min_required_score),
            );
        }

        reasoning.push_str(&format!("EXCEPTIONAL OPPORTUNITY DETECTED: Score {:.1}. ",
                                   market_analysis.opportunity_score));

        // 2. RISK ASSESSMENT - Zero-loss enforcement
        // Only take trades with extremely favorable risk-reward ratios
        if risk_assessment.risk_reward_ratio < 10.0 {
            return (
                DecisionType::Hold,
                50.0,
                format!("Risk-reward ratio insufficient: {:.1}:1 (minimum: 10:1)",
                        risk_assessment.risk_reward_ratio),
            );
        }

        reasoning.push_str(&format!("EXCELLENT RISK-REWARD: {:.1}:1. ", risk_assessment.risk_reward_ratio));

        // 3. ADVANCED SIGNAL PROCESSING - Hyper-dimensional analysis
        let mut long_score = 0.0;
        let mut short_score = 0.0;

        // 3.1 Trend Analysis - Exponentially weight strong trends
        if market_analysis.trend_direction > 0 {
            // Exponential scoring for strong uptrends
            let trend_power = (market_analysis.trend_strength / 20.0).powf(2.0) * 20.0;
            long_score += trend_power;
            reasoning.push_str(&format!("STRONG UPTREND: Power {:.1}. ", trend_power));
        } else if market_analysis.trend_direction < 0 {
            // Exponential scoring for strong downtrends
            let trend_power = (market_analysis.trend_strength / 20.0).powf(2.0) * 20.0;
            short_score += trend_power;
            reasoning.push_str(&format!("STRONG DOWNTREND: Power {:.1}. ", trend_power));
        }

        // 3.2 Technical Indicator Confluence - Look for multiple confirming signals
        let mut indicator_confirmations = 0;
        let mut indicator_score = 0.0;

        // RSI Analysis - Extreme readings with confirmation
        if let Some(rsi) = market_analysis.indicators.get("rsi") {
            if *rsi < 20.0 {
                // Extremely oversold - powerful buy signal
                long_score += (30.0 - rsi).powf(1.5);
                indicator_confirmations += 1;
                indicator_score += 25.0;
                reasoning.push_str(&format!("EXTREME OVERSOLD: RSI {:.1}. ", rsi));
            } else if *rsi > 80.0 {
                // Extremely overbought - powerful sell signal
                short_score += (rsi - 70.0).powf(1.5);
                indicator_confirmations += 1;
                indicator_score += 25.0;
                reasoning.push_str(&format!("EXTREME OVERBOUGHT: RSI {:.1}. ", rsi));
            }
        }

        // MACD Analysis - Strong crossovers and divergences
        if let (Some(macd), Some(signal), Some(histogram)) = (
            market_analysis.indicators.get("macd"),
            market_analysis.indicators.get("macd_signal"),
            market_analysis.indicators.get("macd_histogram"),
        ) {
            if *macd > *signal && *histogram > 0.0 && *histogram > histogram.abs() * 0.2 {
                // Strong bullish crossover
                long_score += 30.0;
                indicator_confirmations += 1;
                indicator_score += 30.0;
                reasoning.push_str(&format!("POWERFUL BULLISH MACD: {:.2}. ", histogram));
            } else if *macd < *signal && *histogram < 0.0 && histogram.abs() > histogram.abs() * 0.2 {
                // Strong bearish crossover
                short_score += 30.0;
                indicator_confirmations += 1;
                indicator_score += 30.0;
                reasoning.push_str(&format!("POWERFUL BEARISH MACD: {:.2}. ", histogram));
            }
        }

        // Bollinger Band Analysis - Volatility breakouts
        if let (Some(bb_upper), Some(bb_lower), Some(bb_middle)) = (
            market_analysis.indicators.get("bb_upper"),
            market_analysis.indicators.get("bb_lower"),
            market_analysis.indicators.get("bb_middle"),
        ) {
            let price = market_analysis.current_price;
            let band_width = (*bb_upper - *bb_lower) / *bb_middle * 100.0;

            // Breakout trades with expanding bands
            if price > *bb_upper && band_width > 4.0 {
                short_score += 25.0; // Potential reversal from upper band
                indicator_confirmations += 1;
                indicator_score += 25.0;
                reasoning.push_str(&format!("UPPER BB BREAKOUT: Width {:.1}%. ", band_width));
            } else if price < *bb_lower && band_width > 4.0 {
                long_score += 25.0; // Potential reversal from lower band
                indicator_confirmations += 1;
                indicator_score += 25.0;
                reasoning.push_str(&format!("LOWER BB BREAKOUT: Width {:.1}%. ", band_width));
            }
        }

        // 3.3 Support/Resistance Analysis - Precision entry points
        if !market_analysis.support_levels.is_empty() {
            let closest_support = market_analysis.support_levels.iter()
                .filter(|s| **s < market_analysis.current_price)
                .max_by(|a, b| a.partial_cmp(b).unwrap())
                .unwrap_or(&0.0);

            let support_distance = (market_analysis.current_price - *closest_support) / market_analysis.current_price * 100.0;

            if support_distance < 0.5 {
                // Price is bouncing exactly off support - extremely strong signal
                long_score += 50.0;
                indicator_confirmations += 1;
                indicator_score += 50.0;
                reasoning.push_str(&format!("PERFECT SUPPORT BOUNCE: {:.2}% from support. ", support_distance));
            } else if support_distance < 1.0 {
                // Price is very close to support
                long_score += 30.0;
                indicator_confirmations += 1;
                indicator_score += 30.0;
                reasoning.push_str(&format!("STRONG SUPPORT ZONE: {:.2}% from support. ", support_distance));
            }
        }

        if !market_analysis.resistance_levels.is_empty() {
            let closest_resistance = market_analysis.resistance_levels.iter()
                .filter(|r| **r > market_analysis.current_price)
                .min_by(|a, b| a.partial_cmp(b).unwrap())
                .unwrap_or(&f64::MAX);

            if *closest_resistance < f64::MAX {
                let resistance_distance = (*closest_resistance - market_analysis.current_price) / market_analysis.current_price * 100.0;

                if resistance_distance < 0.5 {
                    // Price is rejecting exactly at resistance - extremely strong signal
                    short_score += 50.0;
                    indicator_confirmations += 1;
                    indicator_score += 50.0;
                    reasoning.push_str(&format!("PERFECT RESISTANCE REJECTION: {:.2}% from resistance. ", resistance_distance));
                } else if resistance_distance < 1.0 {
                    // Price is very close to resistance
                    short_score += 30.0;
                    indicator_confirmations += 1;
                    indicator_score += 30.0;
                    reasoning.push_str(&format!("STRONG RESISTANCE ZONE: {:.2}% from resistance. ", resistance_distance));
                }
            }
        }

        // 3.4 Sentiment Analysis - Exponentially weight extreme sentiment
        let sentiment_power = sentiment_analysis.sentiment_score.abs().powf(1.5) *
                             sentiment_analysis.sentiment_score.signum();

        if sentiment_power > 50.0 {
            long_score += sentiment_power * 0.5;
            reasoning.push_str(&format!("EXTREMELY BULLISH SENTIMENT: Power {:.1}. ", sentiment_power));
        } else if sentiment_power < -50.0 {
            short_score += sentiment_power.abs() * 0.5;
            reasoning.push_str(&format!("EXTREMELY BEARISH SENTIMENT: Power {:.1}. ", sentiment_power.abs()));
        }

        // Sentiment momentum - accelerating trends
        if sentiment_analysis.sentiment_momentum > 20.0 {
            long_score += sentiment_analysis.sentiment_momentum * 0.8;
            reasoning.push_str(&format!("RAPIDLY IMPROVING SENTIMENT: Momentum {:.1}. ",
                                      sentiment_analysis.sentiment_momentum));
        } else if sentiment_analysis.sentiment_momentum < -20.0 {
            short_score += sentiment_analysis.sentiment_momentum.abs() * 0.8;
            reasoning.push_str(&format!("RAPIDLY DETERIORATING SENTIMENT: Momentum {:.1}. ",
                                      sentiment_analysis.sentiment_momentum.abs()));
        }

        // 4. CONFLUENCE MULTIPLIER - Reward multiple confirming signals
        // When multiple indicators confirm, exponentially increase confidence
        if indicator_confirmations >= 3 {
            let confluence_multiplier = 1.0 + (indicator_confirmations as f64 * 0.2);
            long_score *= confluence_multiplier;
            short_score *= confluence_multiplier;
            reasoning.push_str(&format!("MASSIVE SIGNAL CONFLUENCE: {:.1}x multiplier with {} confirmations. ",
                                      confluence_multiplier, indicator_confirmations));
        }

        // 5. RISK ADJUSTMENT - Zero-loss enforcement
        // Adjust final scores based on risk assessment
        let risk_factor = ((100.0 - risk_assessment.risk_score) / 100.0).powf(1.5); // Exponential risk adjustment
        long_score *= risk_factor;
        short_score *= risk_factor;

        reasoning.push_str(&format!("RISK ASSESSMENT: Score {:.1}, Factor {:.2}. ",
                                  risk_assessment.risk_score, risk_factor));

        // 6. QUANTUM ENHANCEMENT - Incorporate quantum predictions
        if let Some(quantum_pred) = quantum_prediction {
            // Adjust scores based on quantum price predictions
            let current_price = market_analysis.current_price;
            let price_1h = quantum_pred.price_1h;
            let price_change_pct = (price_1h - current_price) / current_price * 100.0;

            if price_change_pct > 2.0 {
                // Strong bullish prediction
                long_score += quantum_pred.confidence * 0.5;
                reasoning.push_str(&format!("QUANTUM BULLISH SIGNAL: Predicted +{:.2}% in 1h with {:.1}% confidence. ",
                                           price_change_pct, quantum_pred.confidence));
            } else if price_change_pct < -2.0 {
                // Strong bearish prediction
                short_score += quantum_pred.confidence * 0.5;
                reasoning.push_str(&format!("QUANTUM BEARISH SIGNAL: Predicted {:.2}% in 1h with {:.1}% confidence. ",
                                           price_change_pct, quantum_pred.confidence));
            }

            // Check for predicted reversal points
            if !quantum_pred.reversal_points.is_empty() {
                reasoning.push_str("QUANTUM REVERSAL POINTS DETECTED: ");
                for (i, (time, price)) in quantum_pred.reversal_points.iter().enumerate().take(2) {
                    let time_diff = time.signed_duration_since(Utc::now()).num_minutes();
                    let price_diff = (price - current_price) / current_price * 100.0;
                    reasoning.push_str(&format!("Point {}: {:.2}% in {} minutes. ",
                                               i+1, price_diff, time_diff));
                }
            }
        }

        // 7. HYPERDIMENSIONAL PATTERN ENHANCEMENT
        if let Some(pattern_recog) = pattern_recognition {
            if !pattern_recog.patterns.is_empty() {
                reasoning.push_str("HYPERDIMENSIONAL PATTERNS DETECTED: ");

                // Adjust scores based on detected patterns
                for (pattern, confidence) in pattern_recog.patterns.iter().take(3) {
                    match pattern {
                        PatternType::Harmonic(name) | PatternType::ElliotWave(name) => {
                            if name.contains("Bull") {
                                long_score += confidence * 0.3;
                                reasoning.push_str(&format!("{} (Bullish, {:.1}%). ", name, confidence));
                            } else if name.contains("Bear") {
                                short_score += confidence * 0.3;
                                reasoning.push_str(&format!("{} (Bearish, {:.1}%). ", name, confidence));
                            }
                        },
                        _ => {
                            reasoning.push_str(&format!("{:?} ({:.1}%). ", pattern, confidence));
                        }
                    }
                }

                // Check for price targets
                if !pattern_recog.price_targets.is_empty() {
                    reasoning.push_str("PATTERN PRICE TARGETS: ");
                    for (i, target) in pattern_recog.price_targets.iter().enumerate().take(2) {
                        let target_pct = (target - market_analysis.current_price) / market_analysis.current_price * 100.0;
                        reasoning.push_str(&format!("Target {}: ${:.2} ({:.2}%). ", i+1, target, target_pct));
                    }
                }
            }
        }

        // 8. FINAL SUPERINTELLIGENT DECISION - Only take exceptional trades
        // Normalize scores to 0-100 range
        long_score = long_score.min(100.0);
        short_score = short_score.min(100.0);

        // Set a more aggressive threshold for trading opportunities
        let decision_threshold = 70.0; // Lower threshold to find more trading opportunities

        if long_score > decision_threshold && long_score > short_score * 1.5 {
            reasoning.push_str(&format!("EXCEPTIONAL LONG OPPORTUNITY: Signal strength {:.1}.", long_score));
            (DecisionType::EnterLong, long_score, reasoning)
        } else if short_score > decision_threshold && short_score > long_score * 1.5 {
            reasoning.push_str(&format!("EXCEPTIONAL SHORT OPPORTUNITY: Signal strength {:.1}.", short_score));
            (DecisionType::EnterShort, short_score, reasoning)
        } else {
            reasoning.push_str(&format!("NO EXCEPTIONAL OPPORTUNITY: Long {:.1}, Short {:.1}, Threshold {:.1}.",
                                      long_score, short_score, decision_threshold));
            (DecisionType::Hold, 50.0, reasoning)
        }
    }

    /// Update order statuses
    pub async fn update_order_statuses(&mut self, adapter: &mut BybitAdapter) -> Result<()> {
        for symbol in self.trade_executor.get_active_orders().keys().cloned().collect::<Vec<_>>() {
            match self.trade_executor.update_order_status(adapter, &symbol).await {
                Ok(status) => {
                    debug!("Updated order status for {}: {:?}", symbol, status);

                    // Update decision cache
                    if let Some(decision) = self.decision_cache.get_mut(&symbol) {
                        decision.trade_execution = self.trade_executor.get_cached_execution(&symbol).cloned();
                    }
                },
                Err(e) => {
                    error!("Failed to update order status for {}: {}", symbol, e);
                }
            }
        }

        Ok(())
    }

    /// Get cached decision for a symbol
    pub fn get_cached_decision(&self, symbol: &str) -> Option<&TradingDecision> {
        self.decision_cache.get(symbol)
    }

    /// Get all cached decisions
    pub fn get_all_decisions(&self) -> &HashMap<String, TradingDecision> {
        &self.decision_cache
    }

    /// Get market analyzer
    pub fn get_market_analyzer(&self) -> &MarketAnalyzer {
        &self.market_analyzer
    }

    /// Get sentiment analyzer
    pub fn get_sentiment_analyzer(&self) -> &SentimentAnalyzer {
        &self.sentiment_analyzer
    }

    /// Get risk manager
    pub fn get_risk_manager(&self) -> &RiskManager {
        &self.risk_manager
    }

    /// Get trade executor
    pub fn get_trade_executor(&self) -> &TradeExecutor {
        &self.trade_executor
    }

    /// Update total capital
    pub fn update_capital(&mut self, new_capital: f64) {
        self.risk_manager.update_capital(new_capital);
    }

    /// Get total capital
    pub fn get_total_capital(&self) -> f64 {
        self.risk_manager.get_total_capital()
    }

    /// Set minimum confidence threshold
    pub fn set_min_confidence(&mut self, min_confidence: f64) {
        self.min_confidence = min_confidence;
    }

    /// Set minimum opportunity score threshold
    pub fn set_min_opportunity_score(&mut self, min_opportunity_score: f64) {
        self.min_opportunity_score = min_opportunity_score;
    }

    /// Set maximum risk score threshold
    pub fn set_max_risk_score(&mut self, max_risk_score: f64) {
        self.max_risk_score = max_risk_score;
    }

    /// Calculate superintelligence score
    fn calculate_superintelligence_score(
        &self,
        market_analysis: &MarketAnalysis,
        sentiment_analysis: &SentimentAnalysis,
        quantum_prediction: Option<&QuantumPrediction>,
        pattern_recognition: Option<&PatternRecognition>,
        zero_loss_assessment: Option<&ZeroLossAssessment>,
    ) -> f64 {
        // Base score from market analysis
        let market_score = market_analysis.opportunity_score;

        // Sentiment contribution
        let sentiment_factor = (sentiment_analysis.sentiment_score.abs() / 100.0).powf(1.5) *
                              sentiment_analysis.sentiment_score.signum();
        let sentiment_score = 50.0 + (sentiment_factor * 50.0);

        // Quantum prediction contribution
        let quantum_score = quantum_prediction
            .map(|p| p.confidence * self.quantum_entanglement_factor)
            .unwrap_or(0.0);

        // Pattern recognition contribution
        let pattern_score = pattern_recognition
            .map(|p| p.confluence_score * self.hyperdimensional_factor)
            .unwrap_or(0.0);

        // Zero-loss assessment contribution
        let zero_loss_score = zero_loss_assessment
            .map(|z| if z.approved { 100.0 } else { 0.0 })
            .unwrap_or(0.0);

        // Calculate weighted average based on superintelligence level
        let level_factor = self.superintelligence_level as f64 / 10.0;

        let weights = [
            0.2,  // Market analysis
            0.1,  // Sentiment analysis
            0.3 * level_factor,  // Quantum prediction
            0.2 * level_factor,  // Pattern recognition
            0.2,  // Zero-loss assessment
        ];

        let scores = [
            market_score,
            sentiment_score,
            quantum_score,
            pattern_score,
            zero_loss_score,
        ];

        // Calculate weighted sum
        let mut weighted_sum = 0.0;
        let mut weight_sum = 0.0;

        for i in 0..weights.len() {
            if scores[i] > 0.0 {
                weighted_sum += weights[i] * scores[i];
                weight_sum += weights[i];
            }
        }

        // Normalize to 0-100 range
        if weight_sum > 0.0 {
            (weighted_sum / weight_sum).min(100.0)
        } else {
            0.0
        }
    }
}
