//! Inference Core
//!
//! This module provides the core inference engine for aggregating agent decisions
//! and making final trading decisions.

use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use anyhow::Result;
use chrono::{DateTime, Utc};

use crate::engine::message_bus::TradeDirection;

/// Confidence level
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum ConfidenceLevel {
    /// Very low confidence
    VeryLow,
    
    /// Low confidence
    Low,
    
    /// Medium confidence
    Medium,
    
    /// High confidence
    High,
    
    /// Very high confidence
    VeryHigh,
}

impl ConfidenceLevel {
    /// Convert from numeric confidence
    pub fn from_numeric(confidence: f64) -> Self {
        if confidence < 0.2 {
            Self::VeryLow
        } else if confidence < 0.4 {
            Self::Low
        } else if confidence < 0.6 {
            Self::Medium
        } else if confidence < 0.8 {
            Self::High
        } else {
            Self::VeryHigh
        }
    }
    
    /// Convert to numeric confidence
    pub fn to_numeric(&self) -> f64 {
        match self {
            Self::VeryLow => 0.1,
            Self::Low => 0.3,
            Self::Medium => 0.5,
            Self::High => 0.7,
            Self::VeryHigh => 0.9,
        }
    }
}

/// Inference result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InferenceResult {
    /// Symbol
    pub symbol: String,
    
    /// Timestamp
    pub timestamp: DateTime<Utc>,
    
    /// Trade direction
    pub direction: TradeDirection,
    
    /// Confidence score (0-1)
    pub confidence: f64,
    
    /// Confidence level
    pub confidence_level: ConfidenceLevel,
    
    /// Entry price
    pub entry_price: f64,
    
    /// Stop loss price
    pub stop_loss_price: f64,
    
    /// Take profit price
    pub take_profit_price: f64,
    
    /// Expected ROI
    pub expected_roi: f64,
    
    /// Expected holding time in seconds
    pub expected_holding_time: u64,
    
    /// Agent contributions
    pub agent_contributions: HashMap<String, f64>,
    
    /// Decision rationale
    pub rationale: String,
}

/// Inference core
pub struct InferenceCore {
    /// Agent weights
    agent_weights: HashMap<String, f64>,
    
    /// Minimum confidence threshold
    min_confidence_threshold: f64,
    
    /// Minimum agent consensus
    min_agent_consensus: usize,
    
    /// Recent inference results
    recent_results: Vec<InferenceResult>,
}

impl InferenceCore {
    /// Create a new inference core
    pub fn new() -> Self {
        Self {
            agent_weights: HashMap::new(),
            min_confidence_threshold: 0.7,
            min_agent_consensus: 3,
            recent_results: Vec::new(),
        }
    }
    
    /// Set agent weight
    pub fn set_agent_weight(&mut self, agent_name: &str, weight: f64) {
        self.agent_weights.insert(agent_name.to_string(), weight);
    }
    
    /// Set minimum confidence threshold
    pub fn set_min_confidence_threshold(&mut self, threshold: f64) {
        self.min_confidence_threshold = threshold;
    }
    
    /// Set minimum agent consensus
    pub fn set_min_agent_consensus(&mut self, consensus: usize) {
        self.min_agent_consensus = consensus;
    }
    
    /// Aggregate agent decisions
    pub fn aggregate_decisions(&mut self, decisions: &HashMap<String, (TradeDirection, f64)>, symbol: &str, price: f64) -> Result<Option<InferenceResult>> {
        // Check if we have enough decisions
        if decisions.len() < self.min_agent_consensus {
            return Ok(None);
        }
        
        // Calculate weighted scores for each direction
        let mut direction_scores: HashMap<TradeDirection, f64> = HashMap::new();
        let mut total_weight = 0.0;
        let mut agent_contributions: HashMap<String, f64> = HashMap::new();
        
        for (agent_name, (direction, confidence)) in decisions {
            // Get agent weight
            let weight = self.agent_weights.get(agent_name).copied().unwrap_or(1.0);
            
            // Calculate weighted confidence
            let weighted_confidence = confidence * weight;
            
            // Add to direction scores
            *direction_scores.entry(*direction).or_insert(0.0) += weighted_confidence;
            
            // Add to total weight
            total_weight += weight;
            
            // Record agent contribution
            agent_contributions.insert(agent_name.clone(), weighted_confidence);
        }
        
        // Normalize direction scores
        for score in direction_scores.values_mut() {
            if total_weight > 0.0 {
                *score /= total_weight;
            }
        }
        
        // Find direction with highest score
        let mut best_direction = TradeDirection::Neutral;
        let mut best_score = 0.0;
        
        for (direction, score) in &direction_scores {
            if *score > best_score {
                best_direction = *direction;
                best_score = *score;
            }
        }
        
        // Check if confidence is high enough
        if best_score < self.min_confidence_threshold {
            return Ok(None);
        }
        
        // Calculate stop loss and take profit prices
        let (stop_loss_price, take_profit_price) = match best_direction {
            TradeDirection::Long => {
                let stop_loss = price * 0.99; // 1% stop loss
                let take_profit = price * 1.02; // 2% take profit
                (stop_loss, take_profit)
            },
            TradeDirection::Short => {
                let stop_loss = price * 1.01; // 1% stop loss
                let take_profit = price * 0.98; // 2% take profit
                (stop_loss, take_profit)
            },
            TradeDirection::Neutral => (price, price),
        };
        
        // Calculate expected ROI
        let expected_roi = match best_direction {
            TradeDirection::Long => (take_profit_price - price) / price * 100.0,
            TradeDirection::Short => (price - take_profit_price) / price * 100.0,
            TradeDirection::Neutral => 0.0,
        };
        
        // Create inference result
        let result = InferenceResult {
            symbol: symbol.to_string(),
            timestamp: Utc::now(),
            direction: best_direction,
            confidence: best_score,
            confidence_level: ConfidenceLevel::from_numeric(best_score),
            entry_price: price,
            stop_loss_price,
            take_profit_price,
            expected_roi,
            expected_holding_time: 3600, // 1 hour default
            agent_contributions,
            rationale: format!("Consensus decision with {:.2}% confidence", best_score * 100.0),
        };
        
        // Add to recent results
        self.recent_results.push(result.clone());
        
        // Limit recent results
        if self.recent_results.len() > 100 {
            self.recent_results.remove(0);
        }
        
        Ok(Some(result))
    }
    
    /// Get recent inference results
    pub fn get_recent_results(&self) -> &[InferenceResult] {
        &self.recent_results
    }
    
    /// Get agent weights
    pub fn get_agent_weights(&self) -> &HashMap<String, f64> {
        &self.agent_weights
    }
}
