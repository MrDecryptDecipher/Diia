//! Risk Manager Agent
//!
//! This agent is responsible for managing risk and determining position sizes.

use std::collections::HashMap;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use anyhow::Result;
use tracing::{info, debug};

use crate::agents::market_analyzer::MarketAnalysis;
use crate::agents::sentiment_analyzer::SentimentAnalysis;

/// Risk assessment result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RiskAssessment {
    /// Symbol
    pub symbol: String,

    /// Assessment timestamp
    pub timestamp: DateTime<Utc>,

    /// Maximum position size (in quote currency)
    pub max_position_size: f64,

    /// Recommended leverage
    pub recommended_leverage: f64,

    /// Stop loss percentage
    pub stop_loss_percent: f64,

    /// Take profit percentage
    pub take_profit_percent: f64,

    /// Risk-to-reward ratio
    pub risk_reward_ratio: f64,

    /// Risk score (0-100, higher is riskier)
    pub risk_score: f64,

    /// Confidence level (0-100)
    pub confidence: f64,
}

/// Risk Manager Agent
pub struct RiskManager {
    /// Total capital
    total_capital: f64,

    /// Maximum risk per trade (as percentage of capital)
    max_risk_per_trade: f64,

    /// Maximum portfolio risk (as percentage of capital)
    max_portfolio_risk: f64,

    /// Assessment cache
    assessment_cache: HashMap<String, RiskAssessment>,

    /// Active positions
    active_positions: HashMap<String, f64>,
}

impl RiskManager {
    /// Create a new risk manager
    pub fn new(total_capital: f64) -> Self {
        Self {
            total_capital,
            max_risk_per_trade: 0.02, // 2% per trade
            max_portfolio_risk: 0.10, // 10% total
            assessment_cache: HashMap::new(),
            active_positions: HashMap::new(),
        }
    }

    /// Assess risk for a symbol
    pub fn assess_risk(
        &mut self,
        symbol: &str,
        market_analysis: &MarketAnalysis,
        sentiment_analysis: &SentimentAnalysis,
        current_price: f64,
    ) -> Result<RiskAssessment> {
        debug!("Assessing risk for {}", symbol);

        // Calculate risk score based on market and sentiment analysis
        let risk_score = self.calculate_risk_score(market_analysis, sentiment_analysis);

        // Calculate position size based on risk score and capital
        let max_position_size = self.calculate_position_size(symbol, risk_score);

        // Calculate recommended leverage based on risk score
        let recommended_leverage = self.calculate_leverage(risk_score);

        // Calculate stop loss and take profit levels
        let (stop_loss_percent, take_profit_percent) = self.calculate_stop_loss_take_profit(
            market_analysis,
            sentiment_analysis,
            risk_score,
        );

        // Calculate risk-to-reward ratio
        let risk_reward_ratio = take_profit_percent / stop_loss_percent;

        // Calculate confidence level
        let confidence = self.calculate_confidence(market_analysis, sentiment_analysis);

        // Create assessment result
        let assessment = RiskAssessment {
            symbol: symbol.to_string(),
            timestamp: Utc::now(),
            max_position_size,
            recommended_leverage,
            stop_loss_percent,
            take_profit_percent,
            risk_reward_ratio,
            risk_score,
            confidence,
        };

        // Cache the assessment
        self.assessment_cache.insert(symbol.to_string(), assessment.clone());

        Ok(assessment)
    }

    /// Calculate risk score
    fn calculate_risk_score(
        &self,
        market_analysis: &MarketAnalysis,
        sentiment_analysis: &SentimentAnalysis,
    ) -> f64 {
        // Start with a base risk score
        let mut risk_score = 50.0;

        // Adjust based on market factors

        // Volatility (higher volatility = higher risk)
        risk_score += market_analysis.volatility * 2.0;

        // Trend strength and direction (strong trend = lower risk)
        risk_score -= market_analysis.trend_strength * 0.2 * market_analysis.trend_direction as f64;

        // Proximity to support/resistance (closer = higher risk)
        if !market_analysis.support_levels.is_empty() || !market_analysis.resistance_levels.is_empty() {
            let current_price = market_analysis.current_price;

            // Find closest support and resistance
            let closest_support = market_analysis.support_levels.iter()
                .filter(|s| **s < current_price)
                .max_by(|a, b| a.partial_cmp(b).unwrap())
                .unwrap_or(&0.0);

            let closest_resistance = market_analysis.resistance_levels.iter()
                .filter(|r| **r > current_price)
                .min_by(|a, b| a.partial_cmp(b).unwrap())
                .unwrap_or(&f64::MAX);

            // Calculate distance to support and resistance as percentage of price
            let support_distance = if *closest_support > 0.0 {
                (current_price - closest_support) / current_price * 100.0
            } else {
                100.0
            };

            let resistance_distance = if *closest_resistance < f64::MAX {
                (closest_resistance - current_price) / current_price * 100.0
            } else {
                100.0
            };

            // Adjust risk based on distance (closer = higher risk)
            if support_distance < 2.0 || resistance_distance < 2.0 {
                risk_score += 10.0;
            } else if support_distance < 5.0 || resistance_distance < 5.0 {
                risk_score += 5.0;
            }
        }

        // Adjust based on sentiment factors

        // Overall sentiment (negative sentiment = higher risk)
        if sentiment_analysis.sentiment_score < 0.0 {
            risk_score += sentiment_analysis.sentiment_score.abs() * 0.5;
        } else {
            risk_score -= sentiment_analysis.sentiment_score * 0.3;
        }

        // Sentiment momentum (negative momentum = higher risk)
        if sentiment_analysis.sentiment_momentum < 0.0 {
            risk_score += sentiment_analysis.sentiment_momentum.abs() * 0.5;
        } else {
            risk_score -= sentiment_analysis.sentiment_momentum * 0.3;
        }

        // Sentiment confidence (lower confidence = higher risk)
        risk_score += (100.0 - sentiment_analysis.confidence) * 0.2;

        // Ensure risk score is within 0-100 range
        risk_score.max(0.0).min(100.0)
    }

    /// Calculate position size
    fn calculate_position_size(&self, symbol: &str, risk_score: f64) -> f64 {
        // Calculate available capital
        let available_capital = self.calculate_available_capital();

        // Calculate maximum position size based on risk score
        // Higher risk score = smaller position size
        let risk_factor = 1.0 - (risk_score / 200.0); // 0.5 to 1.0

        // Base position size (without considering risk)
        let base_position_size = available_capital * self.max_risk_per_trade * 2.0;

        // Adjust position size based on risk
        let position_size = base_position_size * risk_factor;

        // Ensure position size is not too large
        position_size.min(available_capital * 0.5)
    }

    /// Calculate available capital
    fn calculate_available_capital(&self) -> f64 {
        // Calculate total position value
        let total_position_value = self.active_positions.values().sum::<f64>();

        // Calculate available capital
        (self.total_capital - total_position_value).max(0.0)
    }

    /// Calculate recommended leverage - optimized for exponential capital growth
    fn calculate_leverage(&self, risk_score: f64) -> f64 {
        // Adaptive leverage based on risk score and opportunity quality
        // For extremely confident setups with minimal risk, use maximum leverage
        if risk_score < 10.0 {
            100.0 // Maximum leverage for perfect setups
        } else if risk_score < 20.0 {
            75.0 // Very high leverage for excellent setups
        } else if risk_score < 30.0 {
            50.0 // High leverage for very good setups
        } else if risk_score < 40.0 {
            25.0 // Substantial leverage for good setups
        } else if risk_score < 50.0 {
            20.0 // Strong leverage for above-average setups
        } else if risk_score < 60.0 {
            15.0 // Moderate leverage for average setups
        } else if risk_score < 70.0 {
            10.0 // Conservative leverage for below-average setups
        } else if risk_score < 80.0 {
            5.0 // Low leverage for risky setups
        } else {
            3.0 // Minimal leverage for very risky setups
        }
    }

    /// Calculate stop loss and take profit levels - optimized for zero-loss and exponential growth
    fn calculate_stop_loss_take_profit(
        &self,
        market_analysis: &MarketAnalysis,
        sentiment_analysis: &SentimentAnalysis,
        risk_score: f64,
    ) -> (f64, f64) {
        // Hyper-optimized stop loss and take profit percentages
        let base_stop_loss = 0.5; // Tight 0.5% stop loss for minimal capital loss
        let base_take_profit = 5.0; // 5% minimum take profit

        // Identify key support/resistance levels for precise stop placement
        let (optimal_stop, optimal_take_profit) = self.calculate_optimal_levels(market_analysis, risk_score);

        // Adjust based on volatility - tighter stops for higher volatility
        let volatility_factor = market_analysis.volatility / 5.0;
        let volatility_adjusted_stop = if optimal_stop > 0.0 {
            optimal_stop
        } else {
            base_stop_loss * (1.0 + volatility_factor * 0.5)
        };

        // Exponentially increase take profit based on setup quality
        let quality_factor = (100.0 - risk_score) / 100.0; // 0 to 1, higher for better setups
        let quality_adjusted_take_profit = if optimal_take_profit > 0.0 {
            optimal_take_profit
        } else {
            base_take_profit * (1.0 + quality_factor * 5.0) // Up to 6x higher for perfect setups
        };

        // Adjust based on trend strength - ride strong trends longer
        let trend_factor = market_analysis.trend_strength / 100.0;
        let trend_adjusted_stop = volatility_adjusted_stop * (1.0 - trend_factor * 0.3);
        let trend_adjusted_take_profit = quality_adjusted_take_profit * (1.0 + trend_factor * 2.0);

        // Adjust based on sentiment - more aggressive with positive sentiment
        let sentiment_factor = (sentiment_analysis.sentiment_score + 100.0) / 200.0; // 0 to 1
        let final_stop_loss = trend_adjusted_stop * (1.0 - sentiment_factor * 0.2);
        let final_take_profit = trend_adjusted_take_profit * (1.0 + sentiment_factor * 1.5);

        // Ensure minimum values and maintain excellent risk-reward ratio
        let min_stop_loss = 0.5; // 0.5% minimum stop loss
        let min_take_profit = 5.0; // 5% minimum take profit
        let min_risk_reward = 10.0; // Minimum 10:1 risk-reward ratio

        let stop_loss = final_stop_loss.max(min_stop_loss);
        let take_profit = final_take_profit.max(min_take_profit);

        // Ensure minimum risk-reward ratio is maintained
        let actual_risk_reward = take_profit / stop_loss;
        let adjusted_take_profit = if actual_risk_reward < min_risk_reward {
            stop_loss * min_risk_reward
        } else {
            take_profit
        };

        (stop_loss, adjusted_take_profit)
    }

    /// Calculate optimal stop loss and take profit levels based on market structure
    fn calculate_optimal_levels(&self, market_analysis: &MarketAnalysis, risk_score: f64) -> (f64, f64) {
        let current_price = market_analysis.current_price;
        let mut optimal_stop = 0.0;
        let mut optimal_take_profit = 0.0;

        // Find closest support level for stop loss
        if !market_analysis.support_levels.is_empty() {
            let closest_support = market_analysis.support_levels.iter()
                .filter(|s| **s < current_price)
                .max_by(|a, b| a.partial_cmp(b).unwrap())
                .unwrap_or(&0.0);

            if *closest_support > 0.0 {
                // Calculate stop loss percentage based on support level
                let support_stop = (current_price - closest_support) / current_price * 100.0;
                // Only use support if it's reasonably close (within 2%)
                if support_stop < 2.0 {
                    optimal_stop = support_stop * 0.95; // Place stop just below support
                }
            }
        }

        // Find closest resistance level for take profit
        if !market_analysis.resistance_levels.is_empty() {
            let closest_resistance = market_analysis.resistance_levels.iter()
                .filter(|r| **r > current_price)
                .min_by(|a, b| a.partial_cmp(b).unwrap())
                .unwrap_or(&0.0);

            if *closest_resistance > 0.0 {
                // Calculate take profit percentage based on resistance level
                let resistance_tp = (closest_resistance - current_price) / current_price * 100.0;
                // Only use resistance if it's a meaningful target (at least 3%)
                if resistance_tp > 3.0 {
                    optimal_take_profit = resistance_tp * 1.05; // Place take profit just above resistance
                }
            }
        }

        (optimal_stop, optimal_take_profit)
    }

    /// Calculate confidence level
    fn calculate_confidence(
        &self,
        market_analysis: &MarketAnalysis,
        sentiment_analysis: &SentimentAnalysis,
    ) -> f64 {
        // Weighted average of market and sentiment confidence
        let market_weight = 0.7;
        let sentiment_weight = 0.3;

        // Market confidence based on trend strength and volatility
        let market_confidence = 50.0 + market_analysis.trend_strength * 0.3 - market_analysis.volatility * 2.0;

        // Combine confidences
        let combined_confidence = market_confidence * market_weight + sentiment_analysis.confidence * sentiment_weight;

        // Ensure confidence is within 0-100 range
        combined_confidence.max(0.0).min(100.0)
    }

    /// Add an active position
    pub fn add_position(&mut self, symbol: String, position_size: f64) {
        self.active_positions.insert(symbol, position_size);
    }

    /// Remove an active position
    pub fn remove_position(&mut self, symbol: &str) {
        self.active_positions.remove(symbol);
    }

    /// Get all active positions
    pub fn get_active_positions(&self) -> &HashMap<String, f64> {
        &self.active_positions
    }

    /// Get cached assessment for a symbol
    pub fn get_cached_assessment(&self, symbol: &str) -> Option<&RiskAssessment> {
        self.assessment_cache.get(symbol)
    }

    /// Get all cached assessments
    pub fn get_all_assessments(&self) -> &HashMap<String, RiskAssessment> {
        &self.assessment_cache
    }

    /// Update total capital
    pub fn update_capital(&mut self, new_capital: f64) {
        self.total_capital = new_capital;
    }

    /// Get total capital
    pub fn get_total_capital(&self) -> f64 {
        self.total_capital
    }
}
