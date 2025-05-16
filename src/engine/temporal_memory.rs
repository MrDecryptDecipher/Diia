//! Temporal Memory Engine
//!
//! This module provides long-term pattern intelligence and fractal fingerprint matching
//! capabilities for the trading system.

use std::collections::{HashMap, VecDeque};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use anyhow::Result;
use tracing::{info, debug, warn};

use crate::agents::memory_node::{TradeMemory, TradeOutcome};
use crate::engine::message_bus::TradeDirection;

/// Maximum number of patterns to store
const MAX_PATTERNS: usize = 5000;

/// Temporal pattern
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TemporalPattern {
    /// Unique ID for the pattern
    pub id: String,

    /// Symbol
    pub symbol: String,

    /// Pattern timestamp
    pub timestamp: DateTime<Utc>,

    /// Pattern vector
    pub pattern: Vec<f64>,

    /// Pattern length in candles
    pub length: usize,

    /// Pattern timeframe in minutes
    pub timeframe: usize,

    /// Pattern classification
    pub classification: PatternClassification,

    /// Pattern strength (0-1)
    pub strength: f64,

    /// Associated trades
    pub trades: Vec<String>,

    /// Success rate
    pub success_rate: f64,

    /// Average ROI
    pub average_roi: f64,

    /// Pattern metadata
    pub metadata: HashMap<String, String>,
}

/// Pattern classification
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum PatternClassification {
    /// Bullish reversal
    BullishReversal,

    /// Bearish reversal
    BearishReversal,

    /// Bullish continuation
    BullishContinuation,

    /// Bearish continuation
    BearishContinuation,

    /// Consolidation
    Consolidation,

    /// Breakout
    Breakout,

    /// Breakdown
    Breakdown,

    /// Unknown
    Unknown,
}

/// Pattern match result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PatternMatch {
    /// Pattern ID
    pub pattern_id: String,

    /// Similarity score (0-1)
    pub similarity: f64,

    /// Expected direction
    pub expected_direction: TradeDirection,

    /// Expected ROI
    pub expected_roi: f64,

    /// Success probability
    pub success_probability: f64,

    /// Expected duration in seconds
    pub expected_duration: u64,

    /// Recommended stop loss percentage
    pub recommended_sl_pct: f64,

    /// Recommended take profit percentage
    pub recommended_tp_pct: f64,
}

/// Temporal memory state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TemporalMemoryState {
    /// Number of patterns stored
    pub pattern_count: usize,

    /// Number of successful patterns
    pub successful_patterns: usize,

    /// Number of failed patterns
    pub failed_patterns: usize,

    /// Overall success rate
    pub overall_success_rate: f64,

    /// Average ROI across all patterns
    pub average_roi: f64,

    /// Best performing patterns
    pub best_patterns: Vec<String>,
}

/// Temporal Memory Engine
pub struct TemporalMemory {
    /// Patterns by ID
    patterns: HashMap<String, TemporalPattern>,

    /// Patterns by symbol
    symbol_patterns: HashMap<String, Vec<String>>,

    /// Pattern queue (for enforcing capacity)
    pattern_queue: VecDeque<String>,

    /// Engine state
    state: TemporalMemoryState,
}

impl TemporalMemory {
    /// Create a new temporal memory engine
    pub fn new() -> Self {
        Self {
            patterns: HashMap::new(),
            symbol_patterns: HashMap::new(),
            pattern_queue: VecDeque::with_capacity(MAX_PATTERNS),
            state: TemporalMemoryState {
                pattern_count: 0,
                successful_patterns: 0,
                failed_patterns: 0,
                overall_success_rate: 0.0,
                average_roi: 0.0,
                best_patterns: Vec::new(),
            },
        }
    }

    /// Store a new pattern
    pub fn store_pattern(&mut self, pattern: TemporalPattern) -> Result<()> {
        // Add to patterns
        self.patterns.insert(pattern.id.clone(), pattern.clone());

        // Add to symbol patterns
        self.symbol_patterns.entry(pattern.symbol.clone())
            .or_insert_with(Vec::new)
            .push(pattern.id.clone());

        // Add to queue
        self.pattern_queue.push_back(pattern.id.clone());

        // Enforce capacity limit
        if self.pattern_queue.len() > MAX_PATTERNS {
            if let Some(old_id) = self.pattern_queue.pop_front() {
                if let Some(old_pattern) = self.patterns.remove(&old_id) {
                    // Remove from symbol patterns
                    if let Some(patterns) = self.symbol_patterns.get_mut(&old_pattern.symbol) {
                        patterns.retain(|id| id != &old_id);
                    }
                }
            }
        }

        // Update state
        self.update_state();

        Ok(())
    }

    /// Update a pattern with trade results
    pub fn update_pattern(&mut self, pattern_id: &str, trade_id: &str, outcome: TradeOutcome, roi: f64) -> Result<()> {
        if let Some(pattern) = self.patterns.get_mut(pattern_id) {
            // Add trade to pattern
            if !pattern.trades.contains(&trade_id.to_string()) {
                pattern.trades.push(trade_id.to_string());
            }

            // Calculate success rate
            let success_count = pattern.trades.len() as f64 * pattern.success_rate;
            let new_success = match outcome {
                TradeOutcome::Win | TradeOutcome::TakeProfit => 1.0,
                TradeOutcome::Loss | TradeOutcome::StopLoss => 0.0,
                TradeOutcome::Breakeven | TradeOutcome::ManualClose => 0.5,
                TradeOutcome::Unknown => 0.0,
            };

            pattern.success_rate = (success_count + new_success) / (pattern.trades.len() as f64);

            // Update average ROI
            let total_roi = pattern.average_roi * (pattern.trades.len() as f64 - 1.0);
            pattern.average_roi = (total_roi + roi) / pattern.trades.len() as f64;

            // Update state
            self.update_state();
        } else {
            return Err(anyhow::anyhow!("Pattern not found: {}", pattern_id));
        }

        Ok(())
    }

    /// Find matching patterns
    pub fn find_matching_patterns(&self, symbol: &str, current_pattern: &[f64], threshold: f64, limit: usize) -> Vec<PatternMatch> {
        let mut matches = Vec::new();

        // Get patterns for symbol
        if let Some(pattern_ids) = self.symbol_patterns.get(symbol) {
            for pattern_id in pattern_ids {
                if let Some(pattern) = self.patterns.get(pattern_id) {
                    // Calculate similarity
                    let similarity = self.calculate_similarity(&pattern.pattern, current_pattern);

                    if similarity >= threshold {
                        // Create match result
                        let expected_direction = match pattern.classification {
                            PatternClassification::BullishReversal |
                            PatternClassification::BullishContinuation |
                            PatternClassification::Breakout => TradeDirection::Long,

                            PatternClassification::BearishReversal |
                            PatternClassification::BearishContinuation |
                            PatternClassification::Breakdown => TradeDirection::Short,

                            _ => TradeDirection::Neutral,
                        };

                        let match_result = PatternMatch {
                            pattern_id: pattern.id.clone(),
                            similarity,
                            expected_direction,
                            expected_roi: pattern.average_roi,
                            success_probability: pattern.success_rate,
                            expected_duration: 3600, // Default 1 hour
                            recommended_sl_pct: 1.0,  // Default 1%
                            recommended_tp_pct: 2.0,  // Default 2%
                        };

                        matches.push(match_result);
                    }
                }
            }
        }

        // Sort by similarity
        matches.sort_by(|a, b| b.similarity.partial_cmp(&a.similarity).unwrap_or(std::cmp::Ordering::Equal));

        // Apply limit
        if matches.len() > limit {
            matches.truncate(limit);
        }

        matches
    }

    /// Extract pattern from price data
    pub fn extract_pattern(&self, prices: &[f64], normalization: PatternNormalization) -> Vec<f64> {
        match normalization {
            PatternNormalization::None => prices.to_vec(),

            PatternNormalization::ZScore => {
                // Calculate mean
                let mean: f64 = prices.iter().sum::<f64>() / prices.len() as f64;

                // Calculate standard deviation
                let variance: f64 = prices.iter()
                    .map(|x| (*x - mean).powi(2))
                    .sum::<f64>() / prices.len() as f64;

                let std_dev = variance.sqrt();

                if std_dev > 0.0 {
                    prices.iter().map(|x| (*x - mean) / std_dev).collect()
                } else {
                    vec![0.0; prices.len()]
                }
            },

            PatternNormalization::MinMax => {
                if prices.is_empty() {
                    return Vec::new();
                }

                // Find min and max
                let min = *prices.iter().min_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal)).unwrap();
                let max = *prices.iter().max_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal)).unwrap();

                if (max - min).abs() > 0.0 {
                    prices.iter().map(|x| (*x - min) / (max - min)).collect()
                } else {
                    vec![0.5; prices.len()]
                }
            },

            PatternNormalization::Percentage => {
                if prices.is_empty() {
                    return Vec::new();
                }

                let base = prices[0];
                if base > 0.0 {
                    prices.iter().map(|x| (*x / base - 1.0) * 100.0).collect()
                } else {
                    vec![0.0; prices.len()]
                }
            },
        }
    }

    /// Calculate similarity between two patterns
    fn calculate_similarity(&self, pattern1: &[f64], pattern2: &[f64]) -> f64 {
        // Dynamic time warping would be better, but for simplicity we use Euclidean distance
        // Ensure patterns are the same length
        if pattern1.len() != pattern2.len() {
            return 0.0;
        }

        let mut sum_sq_diff = 0.0;
        for i in 0..pattern1.len() {
            sum_sq_diff += (pattern1[i] - pattern2[i]).powi(2);
        }

        let mse = sum_sq_diff / pattern1.len() as f64;
        let similarity = 1.0 / (1.0 + mse);

        similarity
    }

    /// Classify a pattern
    pub fn classify_pattern(&self, prices: &[f64]) -> PatternClassification {
        if prices.len() < 5 {
            return PatternClassification::Unknown;
        }

        // Calculate simple moving averages
        let sma5 = self.calculate_sma(&prices, 5);
        let sma10 = self.calculate_sma(&prices, 10);

        // Calculate trend
        let trend_up = sma5 > sma10;

        // Calculate volatility
        let volatility = self.calculate_volatility(&prices);

        // Check for reversal
        let first_half = &prices[0..prices.len()/2];
        let second_half = &prices[prices.len()/2..];

        let first_half_trend = self.calculate_trend(first_half);
        let second_half_trend = self.calculate_trend(second_half);

        // Reversal patterns
        if first_half_trend < -0.5 && second_half_trend > 0.5 {
            return PatternClassification::BullishReversal;
        }

        if first_half_trend > 0.5 && second_half_trend < -0.5 {
            return PatternClassification::BearishReversal;
        }

        // Continuation patterns
        if first_half_trend > 0.3 && second_half_trend > 0.3 {
            return PatternClassification::BullishContinuation;
        }

        if first_half_trend < -0.3 && second_half_trend < -0.3 {
            return PatternClassification::BearishContinuation;
        }

        // Breakout/breakdown patterns
        if volatility > 0.02 && trend_up {
            return PatternClassification::Breakout;
        }

        if volatility > 0.02 && !trend_up {
            return PatternClassification::Breakdown;
        }

        // Consolidation
        if volatility < 0.01 {
            return PatternClassification::Consolidation;
        }

        PatternClassification::Unknown
    }

    /// Calculate simple moving average
    fn calculate_sma(&self, prices: &[f64], period: usize) -> f64 {
        if prices.len() < period {
            return prices.iter().sum::<f64>() / prices.len() as f64;
        }

        let start = prices.len() - period;
        prices[start..].iter().sum::<f64>() / period as f64
    }

    /// Calculate trend strength (-1 to 1)
    fn calculate_trend(&self, prices: &[f64]) -> f64 {
        if prices.len() < 2 {
            return 0.0;
        }

        let first = prices[0];
        let last = prices[prices.len() - 1];

        let change = (last - first) / first;

        // Normalize to -1 to 1 range
        change.max(-1.0).min(1.0)
    }

    /// Calculate volatility
    fn calculate_volatility(&self, prices: &[f64]) -> f64 {
        if prices.len() < 2 {
            return 0.0;
        }

        let mut changes = Vec::with_capacity(prices.len() - 1);
        for i in 1..prices.len() {
            changes.push((prices[i] - prices[i-1]) / prices[i-1]);
        }

        let mean: f64 = changes.iter().sum::<f64>() / changes.len() as f64;

        let variance: f64 = changes.iter()
            .map(|x| (*x - mean).powi(2))
            .sum::<f64>() / changes.len() as f64;

        variance.sqrt()
    }

    /// Update state
    fn update_state(&mut self) {
        // Update pattern count
        self.state.pattern_count = self.patterns.len();

        // Calculate success/failure counts
        self.state.successful_patterns = self.patterns.values()
            .filter(|p| p.success_rate >= 0.6)
            .count();

        self.state.failed_patterns = self.patterns.values()
            .filter(|p| p.success_rate < 0.4)
            .count();

        // Calculate overall success rate
        if !self.patterns.is_empty() {
            self.state.overall_success_rate = self.patterns.values()
                .map(|p| p.success_rate)
                .sum::<f64>() / self.patterns.len() as f64;

            self.state.average_roi = self.patterns.values()
                .map(|p| p.average_roi)
                .sum::<f64>() / self.patterns.len() as f64;
        }

        // Find best patterns
        let mut patterns: Vec<(&String, &TemporalPattern)> = self.patterns.iter().collect();
        patterns.sort_by(|a, b| {
            let a_score = a.1.success_rate * a.1.average_roi;
            let b_score = b.1.success_rate * b.1.average_roi;
            b_score.partial_cmp(&a_score).unwrap_or(std::cmp::Ordering::Equal)
        });

        self.state.best_patterns = patterns.iter()
            .take(10)
            .map(|(id, _)| (*id).clone())
            .collect();
    }

    /// Get state
    pub fn get_state(&self) -> &TemporalMemoryState {
        &self.state
    }

    /// Get pattern by ID
    pub fn get_pattern(&self, id: &str) -> Option<&TemporalPattern> {
        self.patterns.get(id)
    }

    /// Get patterns by symbol
    pub fn get_patterns_by_symbol(&self, symbol: &str) -> Vec<&TemporalPattern> {
        if let Some(pattern_ids) = self.symbol_patterns.get(symbol) {
            pattern_ids.iter()
                .filter_map(|id| self.patterns.get(id))
                .collect()
        } else {
            Vec::new()
        }
    }
}

/// Pattern normalization method
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum PatternNormalization {
    /// No normalization
    None,

    /// Z-score normalization
    ZScore,

    /// Min-max normalization
    MinMax,

    /// Percentage change from first value
    Percentage,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pattern_extraction() {
        let memory = TemporalMemory::new();

        let prices = vec![100.0, 101.0, 102.0, 103.0, 104.0];

        // Test percentage normalization
        let pattern = memory.extract_pattern(&prices, PatternNormalization::Percentage);
        assert_eq!(pattern.len(), 5);
        assert_eq!(pattern[0], 0.0);
        assert!((pattern[1] - 1.0).abs() < 0.001);
        assert!((pattern[2] - 2.0).abs() < 0.001);

        // Test min-max normalization
        let pattern = memory.extract_pattern(&prices, PatternNormalization::MinMax);
        assert_eq!(pattern.len(), 5);
        assert_eq!(pattern[0], 0.0);
        assert_eq!(pattern[4], 1.0);
    }

    #[test]
    fn test_pattern_classification() {
        let memory = TemporalMemory::new();

        // Bullish reversal
        let prices = vec![100.0, 98.0, 96.0, 94.0, 95.0, 97.0, 100.0, 103.0];
        let classification = memory.classify_pattern(&prices);
        assert_eq!(classification, PatternClassification::BullishReversal);

        // Bearish reversal
        let prices = vec![100.0, 102.0, 104.0, 106.0, 105.0, 103.0, 100.0, 97.0];
        let classification = memory.classify_pattern(&prices);
        assert_eq!(classification, PatternClassification::BearishReversal);
    }
}
