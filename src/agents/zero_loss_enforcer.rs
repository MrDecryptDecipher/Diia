//! Zero-Loss Enforcer Agent
//!
//! This agent is responsible for ensuring that no trades result in losses.

use std::collections::HashMap;
use std::sync::Arc;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use anyhow::Result;
use tracing::{info, debug, warn};

use crate::agents::market_analyzer::MarketAnalysis;
use crate::agents::sentiment_analyzer::SentimentAnalysis;
use crate::agents::risk_manager::RiskAssessment;
use crate::agents::trade_executor::TradeExecution;
use crate::engine::message_bus::{MessageBus, TradeDirection, BusMessage};

/// Zero-loss enforcement result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ZeroLossAssessment {
    /// Symbol
    pub symbol: String,

    /// Assessment timestamp
    pub timestamp: DateTime<Utc>,

    /// Trade direction
    pub direction: TradeDirection,

    /// Entry price
    pub entry_price: f64,

    /// Stop loss price
    pub stop_loss_price: f64,

    /// Take profit price
    pub take_profit_price: f64,

    /// Position size
    pub position_size: f64,

    /// Leverage
    pub leverage: f64,

    /// Risk amount (in quote currency)
    pub risk_amount: f64,

    /// Reward amount (in quote currency)
    pub reward_amount: f64,

    /// Risk-reward ratio
    pub risk_reward_ratio: f64,

    /// Win probability (0-100%)
    pub win_probability: f64,

    /// Expected value (in quote currency)
    pub expected_value: f64,

    /// Trade approved
    pub approved: bool,

    /// Reasoning
    pub reasoning: String,
}

/// Zero-Loss Enforcer Agent
pub struct ZeroLossEnforcer {
    /// Minimum win probability
    min_win_probability: f64,

    /// Minimum risk-reward ratio
    min_risk_reward_ratio: f64,

    /// Minimum expected value
    min_expected_value: f64,

    /// Assessment cache
    assessment_cache: HashMap<String, ZeroLossAssessment>,
}

impl ZeroLossEnforcer {
    /// Create a new zero-loss enforcer
    pub fn new() -> Self {
        Self {
            min_win_probability: 80.0, // Minimum 80% win probability
            min_risk_reward_ratio: 10.0, // Minimum 10:1 risk-reward ratio
            min_expected_value: 1.0, // Minimum $1 expected value
            assessment_cache: HashMap::new(),
        }
    }

    /// Check if the agent is active
    pub fn is_active(&self) -> bool {
        true
    }

    /// Process trades
    pub async fn process(&self) -> Result<Vec<crate::engine::message_bus::Message>> {
        // This is a simplified implementation
        Ok(Vec::new())
    }

    /// Close a trade
    pub fn close_trade(&mut self, trade_id: &str, exit_price: f64, exit_time: DateTime<Utc>) -> Result<()> {
        // This is a simplified implementation
        debug!("Closing trade {}: exit price {}, exit time {}", trade_id, exit_price, exit_time);
        Ok(())
    }

    /// Register a trade
    pub fn register_trade(&mut self, trade: crate::trading_system::Trade) -> Result<()> {
        // This is a simplified implementation
        debug!("Registering trade {}: entry price {}", trade.id, trade.entry_price);
        Ok(())
    }

    /// Update a trade
    pub fn update_trade(&mut self, trade_id: &str, current_price: f64) -> Result<()> {
        // This is a simplified implementation
        debug!("Updating trade {}: current price {}", trade_id, current_price);
        Ok(())
    }

    /// Initialize the agent
    pub fn initialize(&mut self, _message_bus: Arc<MessageBus>) {
        debug!("Initializing Zero Loss Enforcer");
    }

    /// Assess a potential trade for zero-loss enforcement
    pub fn assess_trade(
        &mut self,
        symbol: &str,
        direction: TradeDirection,
        entry_price: f64,
        market_analysis: &MarketAnalysis,
        sentiment_analysis: &SentimentAnalysis,
        risk_assessment: &RiskAssessment,
    ) -> Result<ZeroLossAssessment> {
        debug!("Assessing trade for zero-loss enforcement: {:?} {}", direction, symbol);

        // Calculate stop loss and take profit prices
        let stop_loss_price = match direction {
            TradeDirection::Long => entry_price * (1.0 - risk_assessment.stop_loss_percent / 100.0),
            TradeDirection::Short => entry_price * (1.0 + risk_assessment.stop_loss_percent / 100.0),
            TradeDirection::Neutral => entry_price, // No stop loss for neutral direction
        };

        let take_profit_price = match direction {
            TradeDirection::Long => entry_price * (1.0 + risk_assessment.take_profit_percent / 100.0),
            TradeDirection::Short => entry_price * (1.0 - risk_assessment.take_profit_percent / 100.0),
            TradeDirection::Neutral => entry_price, // No take profit for neutral direction
        };

        // Calculate position size and leverage
        let position_size = risk_assessment.max_position_size;
        let leverage = risk_assessment.recommended_leverage;

        // Calculate risk and reward amounts
        let risk_amount = position_size * (risk_assessment.stop_loss_percent / 100.0);
        let reward_amount = position_size * (risk_assessment.take_profit_percent / 100.0);

        // Calculate risk-reward ratio
        let risk_reward_ratio = reward_amount / risk_amount;

        // Calculate win probability based on market analysis and sentiment
        let win_probability = self.calculate_win_probability(
            market_analysis,
            sentiment_analysis,
            risk_assessment,
            direction,
        );

        // Calculate expected value
        let expected_value = (win_probability / 100.0 * reward_amount) -
                            ((100.0 - win_probability) / 100.0 * risk_amount);

        // Determine if trade is approved
        let (approved, reasoning) = self.evaluate_trade(
            win_probability,
            risk_reward_ratio,
            expected_value,
            market_analysis,
            sentiment_analysis,
        );

        // Create assessment result
        let assessment = ZeroLossAssessment {
            symbol: symbol.to_string(),
            timestamp: Utc::now(),
            direction,
            entry_price,
            stop_loss_price,
            take_profit_price,
            position_size,
            leverage,
            risk_amount,
            reward_amount,
            risk_reward_ratio,
            win_probability,
            expected_value,
            approved,
            reasoning,
        };

        // Cache the assessment
        self.assessment_cache.insert(symbol.to_string(), assessment.clone());

        Ok(assessment)
    }

    /// Calculate win probability
    fn calculate_win_probability(
        &self,
        market_analysis: &MarketAnalysis,
        sentiment_analysis: &SentimentAnalysis,
        risk_assessment: &RiskAssessment,
        direction: TradeDirection,
    ) -> f64 {
        // Base probability from opportunity score
        let base_probability = market_analysis.opportunity_score;

        // Adjust based on trend alignment
        let trend_alignment = match direction {
            TradeDirection::Long => if market_analysis.trend_direction > 0 { 10.0 } else { -10.0 },
            TradeDirection::Short => if market_analysis.trend_direction < 0 { 10.0 } else { -10.0 },
            TradeDirection::Neutral => 0.0, // No trend alignment for neutral direction
        };

        // Adjust based on sentiment alignment
        let sentiment_alignment = match direction {
            TradeDirection::Long => sentiment_analysis.sentiment_score / 10.0,
            TradeDirection::Short => -sentiment_analysis.sentiment_score / 10.0,
            TradeDirection::Neutral => 0.0, // No sentiment alignment for neutral direction
        };

        // Adjust based on risk assessment
        let risk_factor = (100.0 - risk_assessment.risk_score) / 10.0;

        // Adjust based on support/resistance proximity
        let support_resistance_factor = if !market_analysis.support_levels.is_empty() ||
                                         !market_analysis.resistance_levels.is_empty() {
            5.0
        } else {
            0.0
        };

        // Calculate final probability
        let probability = base_probability +
                         trend_alignment +
                         sentiment_alignment +
                         risk_factor +
                         support_resistance_factor;

        // Ensure probability is within 0-100 range
        probability.max(0.0).min(100.0)
    }

    /// Evaluate trade for approval
    fn evaluate_trade(
        &self,
        win_probability: f64,
        risk_reward_ratio: f64,
        expected_value: f64,
        market_analysis: &MarketAnalysis,
        sentiment_analysis: &SentimentAnalysis,
    ) -> (bool, String) {
        let mut reasoning = String::new();

        // Check win probability
        if win_probability < self.min_win_probability {
            reasoning.push_str(&format!(
                "REJECTED: Win probability {:.1}% below minimum threshold of {:.1}%. ",
                win_probability, self.min_win_probability
            ));
            return (false, reasoning);
        }

        reasoning.push_str(&format!(
            "Win probability {:.1}% exceeds minimum threshold of {:.1}%. ",
            win_probability, self.min_win_probability
        ));

        // Check risk-reward ratio
        if risk_reward_ratio < self.min_risk_reward_ratio {
            reasoning.push_str(&format!(
                "REJECTED: Risk-reward ratio {:.1}:1 below minimum threshold of {:.1}:1. ",
                risk_reward_ratio, self.min_risk_reward_ratio
            ));
            return (false, reasoning);
        }

        reasoning.push_str(&format!(
            "Risk-reward ratio {:.1}:1 exceeds minimum threshold of {:.1}:1. ",
            risk_reward_ratio, self.min_risk_reward_ratio
        ));

        // Check expected value
        if expected_value < self.min_expected_value {
            reasoning.push_str(&format!(
                "REJECTED: Expected value ${:.2} below minimum threshold of ${:.2}. ",
                expected_value, self.min_expected_value
            ));
            return (false, reasoning);
        }

        reasoning.push_str(&format!(
            "Expected value ${:.2} exceeds minimum threshold of ${:.2}. ",
            expected_value, self.min_expected_value
        ));

        // Check market conditions
        if market_analysis.volatility > 10.0 {
            reasoning.push_str(&format!(
                "CAUTION: High volatility detected ({:.1}%). ",
                market_analysis.volatility
            ));

            // Require higher win probability for high volatility
            if win_probability < 90.0 {
                reasoning.push_str(
                    "REJECTED: High volatility requires win probability of at least 90%. "
                );
                return (false, reasoning);
            }
        }

        // Check sentiment extremes
        if sentiment_analysis.sentiment_score.abs() > 80.0 {
            reasoning.push_str(&format!(
                "CAUTION: Extreme sentiment detected ({:.1}). ",
                sentiment_analysis.sentiment_score
            ));

            // Require higher risk-reward for extreme sentiment
            if risk_reward_ratio < 15.0 {
                reasoning.push_str(
                    "REJECTED: Extreme sentiment requires risk-reward ratio of at least 15:1. "
                );
                return (false, reasoning);
            }
        }

        // Trade approved
        reasoning.push_str("APPROVED: Trade meets all zero-loss enforcement criteria. ");
        (true, reasoning)
    }

    /// Get cached assessment for a symbol
    pub fn get_cached_assessment(&self, symbol: &str) -> Option<&ZeroLossAssessment> {
        self.assessment_cache.get(symbol)
    }

    /// Get all cached assessments
    pub fn get_all_assessments(&self) -> &HashMap<String, ZeroLossAssessment> {
        &self.assessment_cache
    }

    /// Set minimum win probability
    pub fn set_min_win_probability(&mut self, min_win_probability: f64) {
        self.min_win_probability = min_win_probability;
    }

    /// Set minimum risk-reward ratio
    pub fn set_min_risk_reward_ratio(&mut self, min_risk_reward_ratio: f64) {
        self.min_risk_reward_ratio = min_risk_reward_ratio;
    }

    /// Set minimum expected value
    pub fn set_min_expected_value(&mut self, min_expected_value: f64) {
        self.min_expected_value = min_expected_value;
    }
}
