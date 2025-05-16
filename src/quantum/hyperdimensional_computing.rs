//! Hyperdimensional Computing
//!
//! This module provides hyperdimensional computing for pattern recognition.

use std::collections::{HashMap, VecDeque};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use anyhow::Result;
use rand::prelude::*;

use crate::trading_system::Trade;
use crate::agents::god_kernel::AgentMetadata;

/// Hypervector
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Hypervector {
    /// Vector ID
    pub id: String,

    /// Vector dimensions
    pub dimensions: usize,

    /// Vector data
    pub data: Vec<f64>,

    /// Vector timestamp
    pub timestamp: DateTime<Utc>,
}

/// Hyperdimensional pattern
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HyperdimensionalPattern {
    /// Pattern ID
    pub id: String,

    /// Pattern name
    pub name: String,

    /// Pattern hypervector
    pub hypervector: Hypervector,

    /// Pattern confidence
    pub confidence: f64,

    /// Pattern timestamp
    pub timestamp: DateTime<Utc>,

    /// Pattern metadata
    pub metadata: HashMap<String, String>,
}

/// Hyperdimensional computing
pub struct HyperdimensionalComputing {
    /// Random number generator
    rng: ThreadRng,

    /// Vector dimensions
    dimensions: usize,

    /// Patterns
    patterns: HashMap<String, HyperdimensionalPattern>,

    /// Pattern history
    pattern_history: VecDeque<HyperdimensionalPattern>,

    /// Maximum history size
    max_history_size: usize,
}

impl HyperdimensionalComputing {
    /// Create a new hyperdimensional computing
    pub fn new() -> Self {
        Self {
            rng: thread_rng(),
            dimensions: 1000,
            patterns: HashMap::new(),
            pattern_history: VecDeque::new(),
            max_history_size: 1000,
        }
    }

    /// Initialize the computing
    pub fn initialize(&mut self) -> Result<()> {
        // Initialize with some basic patterns
        self.create_pattern("bullish_trend", "Bullish Trend")?;
        self.create_pattern("bearish_trend", "Bearish Trend")?;
        self.create_pattern("sideways_market", "Sideways Market")?;
        self.create_pattern("breakout", "Breakout")?;
        self.create_pattern("reversal", "Reversal")?;

        Ok(())
    }

    /// Create pattern
    pub fn create_pattern(&mut self, id: &str, name: &str) -> Result<HyperdimensionalPattern> {
        // Create hypervector
        let hypervector = self.create_random_hypervector(id)?;

        // Create pattern
        let pattern = HyperdimensionalPattern {
            id: id.to_string(),
            name: name.to_string(),
            hypervector,
            confidence: 0.5,
            timestamp: Utc::now(),
            metadata: HashMap::new(),
        };

        // Store pattern
        self.patterns.insert(id.to_string(), pattern.clone());

        Ok(pattern)
    }

    /// Create random hypervector
    fn create_random_hypervector(&mut self, id: &str) -> Result<Hypervector> {
        // Create random vector
        let mut data = Vec::with_capacity(self.dimensions);

        for _ in 0..self.dimensions {
            data.push(self.rng.gen_range(-1.0..1.0));
        }

        // Normalize vector
        let norm = data.iter().map(|x| x * x).sum::<f64>().sqrt();

        if norm > 0.0 {
            for x in &mut data {
                *x /= norm;
            }
        }

        // Create hypervector
        let hypervector = Hypervector {
            id: id.to_string(),
            dimensions: self.dimensions,
            data,
            timestamp: Utc::now(),
        };

        Ok(hypervector)
    }

    /// Create hypervector from data
    pub fn create_hypervector_from_data(&mut self, id: &str, data: &[f64]) -> Result<Hypervector> {
        if data.is_empty() {
            return Err(anyhow::anyhow!("Data is empty"));
        }

        // Create vector
        let mut vector = Vec::with_capacity(self.dimensions);

        // Fill vector with data (repeat if necessary)
        for i in 0..self.dimensions {
            vector.push(data[i % data.len()]);
        }

        // Normalize vector
        let norm = vector.iter().map(|x| x.powi(2)).sum::<f64>().sqrt();

        if norm > 0.0 {
            for x in &mut vector {
                *x /= norm;
            }
        }

        // Create hypervector
        let hypervector = Hypervector {
            id: id.to_string(),
            dimensions: self.dimensions,
            data: vector,
            timestamp: Utc::now(),
        };

        Ok(hypervector)
    }

    /// Calculate similarity
    pub fn calculate_similarity(&self, vector1: &Hypervector, vector2: &Hypervector) -> f64 {
        if vector1.dimensions != vector2.dimensions {
            return 0.0;
        }

        // Calculate dot product
        let mut dot_product = 0.0;

        for i in 0..vector1.dimensions {
            dot_product += vector1.data[i] * vector2.data[i];
        }

        // Cosine similarity
        dot_product
    }

    /// Recognize pattern
    pub fn recognize_pattern(&mut self, data: &[f64]) -> Result<Option<HyperdimensionalPattern>> {
        if data.is_empty() {
            return Err(anyhow::anyhow!("Data is empty"));
        }

        // Create hypervector from data
        let hypervector = self.create_hypervector_from_data("input", data)?;

        // Find most similar pattern
        let mut best_pattern = None;
        let mut best_similarity = 0.0;

        for pattern in self.patterns.values() {
            let similarity = self.calculate_similarity(&hypervector, &pattern.hypervector);

            if similarity > best_similarity {
                best_similarity = similarity;
                best_pattern = Some(pattern.clone());
            }
        }

        // Check if similarity is high enough
        if best_similarity > 0.7 {
            if let Some(mut pattern) = best_pattern {
                // Update confidence
                pattern.confidence = best_similarity;
                pattern.timestamp = Utc::now();

                // Add to history
                self.pattern_history.push_back(pattern.clone());

                // Limit history size
                if self.pattern_history.len() > self.max_history_size {
                    self.pattern_history.pop_front();
                }

                return Ok(Some(pattern));
            }
        }

        Ok(None)
    }

    /// Generate visualization
    pub fn generate_visualization(
        &self,
        trades: &[Trade],
        agents: &[AgentMetadata],
    ) -> Result<(Vec<f64>, Vec<usize>, Vec<String>, Vec<String>)> {
        // Generate data for visualization
        let mut data = Vec::new();
        let mut labels = Vec::new();
        let mut colors = Vec::new();

        // Add trade data
        for trade in trades {
            // Extract features
            let features = self.extract_trade_features(trade);

            // Add features to data
            data.extend(features);

            // Add label
            labels.push(format!("{} - {}", trade.id, trade.symbol));

            // Add color based on PnL
            let pnl = trade.realized_pnl.unwrap_or(trade.unrealized_pnl);
            let color = if pnl > 0.0 {
                "#00FF00".to_string() // Green
            } else {
                "#FF0000".to_string() // Red
            };

            colors.push(color);
        }

        // Add agent data
        for agent in agents {
            // Extract features
            let features = self.extract_agent_features(agent);

            // Add features to data
            data.extend(features);

            // Add label
            labels.push(format!("{}", agent.name));

            // Add color based on performance
            let color = if agent.performance_score > 50.0 {
                "#0000FF".to_string() // Blue
            } else {
                "#FF00FF".to_string() // Purple
            };

            colors.push(color);
        }

        // Set dimensions
        let dimensions = vec![trades.len() + agents.len(), 10];

        Ok((data, dimensions, labels, colors))
    }

    /// Extract trade features
    fn extract_trade_features(&self, trade: &Trade) -> Vec<f64> {
        let mut features = Vec::with_capacity(10);

        // Add entry price
        features.push(trade.entry_price);

        // Add exit price or current price
        if let Some(exit_price) = trade.exit_price {
            features.push(exit_price);
        } else {
            features.push(trade.entry_price);
        }

        // Add PnL
        features.push(trade.realized_pnl.unwrap_or(trade.unrealized_pnl));

        // Add direction
        match trade.direction {
            crate::engine::message_bus::TradeDirection::Long => features.push(1.0),
            crate::engine::message_bus::TradeDirection::Short => features.push(-1.0),
            _ => features.push(0.0),
        }

        // Add status
        match trade.status {
            crate::trading_system::TradeStatus::Pending => features.push(0.0),
            crate::trading_system::TradeStatus::Open => features.push(1.0),
            crate::trading_system::TradeStatus::Closed => features.push(2.0),
            crate::trading_system::TradeStatus::Canceled => features.push(3.0),
            crate::trading_system::TradeStatus::Failed => features.push(4.0),
        }

        // Add leverage
        features.push(trade.leverage);

        // Add size
        features.push(trade.size);

        // Add time features
        features.push(trade.entry_time.timestamp() as f64);

        if let Some(exit_time) = trade.exit_time {
            features.push(exit_time.timestamp() as f64);
            features.push((exit_time - trade.entry_time).num_seconds() as f64);
        } else {
            features.push(0.0);
            features.push(0.0);
        }

        features
    }

    /// Extract agent features
    fn extract_agent_features(&self, agent: &AgentMetadata) -> Vec<f64> {
        let mut features = Vec::with_capacity(10);

        // Add performance score
        features.push(agent.performance_score);

        // Add generation
        features.push(agent.generation as f64);

        // Add creation time
        features.push(agent.creation_time.timestamp() as f64);

        // Add version
        // Agent version is not available, use generation instead
        let version_str = format!("{}.0.0", agent.generation);
        let version_parts: Vec<&str> = version_str.split('.').collect();
        if version_parts.len() == 3 {
            if let (Ok(major), Ok(minor), Ok(patch)) = (
                version_parts[0].parse::<f64>(),
                version_parts[1].parse::<f64>(),
                version_parts[2].parse::<f64>(),
            ) {
                features.push(major);
                features.push(minor);
                features.push(patch);
            } else {
                features.push(0.0);
                features.push(0.0);
                features.push(0.0);
            }
        } else {
            features.push(0.0);
            features.push(0.0);
            features.push(0.0);
        }

        // Add number of parents
        // Parent IDs not available, use 0 or 1 based on parent existence
        features.push(if agent.parent.is_some() { 1.0 } else { 0.0 });

        // Capabilities not available, use a default value
        features.push(1.0);

        // Add number of parameters
        features.push(agent.parameters.len() as f64);

        // Add active status
        features.push(if agent.active { 1.0 } else { 0.0 });

        features
    }

    /// Set dimensions
    pub fn set_dimensions(&mut self, dimensions: usize) {
        self.dimensions = dimensions;
    }

    /// Get dimensions
    pub fn get_dimensions(&self) -> usize {
        self.dimensions
    }

    /// Get patterns
    pub fn get_patterns(&self) -> &HashMap<String, HyperdimensionalPattern> {
        &self.patterns
    }

    /// Get pattern history
    pub fn get_pattern_history(&self) -> &VecDeque<HyperdimensionalPattern> {
        &self.pattern_history
    }
}
