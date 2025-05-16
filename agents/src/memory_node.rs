use async_trait::async_trait;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use crate::agent_trait::Agent;
use crate::message_bus::Message;

/// MemoryNode stores and manages long-term trade vector memory
pub struct MemoryNode {
    /// Current state of the agent
    state: MemoryNodeState,
    /// Configuration for the agent
    config: MemoryNodeConfig,
    /// Trade memories stored by ID
    memories: HashMap<String, TradeMemory>,
    /// Pattern memories indexed by pattern hash
    pattern_memories: HashMap<String, PatternMemory>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryNodeConfig {
    /// Maximum number of trade memories to store
    pub max_trade_memories: usize,
    /// Maximum number of pattern memories to store
    pub max_pattern_memories: usize,
    /// Memory decay factor (0-1, higher means slower decay)
    pub memory_decay_factor: f64,
    /// Minimum confidence to store a memory
    pub min_confidence_to_store: f64,
    /// Whether to persist memories to disk
    pub persist_memories: bool,
    /// Path to persist memories
    pub persistence_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryNodeState {
    /// Whether the agent is currently active
    pub active: bool,
    /// Last time memories were updated
    pub last_update: DateTime<Utc>,
    /// Number of memories stored
    pub memory_count: usize,
    /// Number of pattern memories stored
    pub pattern_memory_count: usize,
    /// Number of memory retrievals
    pub retrieval_count: u64,
    /// Number of memory reinforcements
    pub reinforcement_count: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TradeMemory {
    /// Unique ID for the memory
    pub id: String,
    /// Asset traded
    pub asset: String,
    /// Entry price
    pub entry_price: f64,
    /// Exit price
    pub exit_price: f64,
    /// Position size in USDT
    pub position_size: f64,
    /// Leverage used
    pub leverage: f64,
    /// Direction of the trade
    pub direction: TradeDirection,
    /// When the trade was entered
    pub entry_time: DateTime<Utc>,
    /// When the trade was exited
    pub exit_time: DateTime<Utc>,
    /// Profit/loss amount
    pub pnl: f64,
    /// ROI percentage
    pub roi: f64,
    /// Trade outcome
    pub outcome: TradeOutcome,
    /// Agents that contributed to the trade
    pub contributing_agents: Vec<String>,
    /// Confidence scores from each agent
    pub agent_confidence_scores: HashMap<String, f64>,
    /// Market conditions during the trade
    pub market_conditions: MarketConditions,
    /// Pattern hash for this trade
    pub pattern_hash: String,
    /// Memory strength (0-1, higher is stronger)
    pub memory_strength: f64,
    /// Last time this memory was reinforced
    pub last_reinforced: DateTime<Utc>,
    /// Number of times this memory was reinforced
    pub reinforcement_count: u64,
    /// Tags associated with this memory
    pub tags: Vec<String>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum TradeDirection {
    Long,
    Short,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TradeOutcome {
    TakeProfitHit(f64),  // ROI achieved
    StopLossHit(f64),    // Loss incurred
    ManualClose(f64),    // Manually closed with ROI
    Expired(f64),        // Time expired with ROI
    Aborted(String),     // Aborted with reason
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarketConditions {
    /// Overall market trend
    pub market_trend: MarketTrend,
    /// Market volatility (0-100)
    pub volatility: f64,
    /// Market volume relative to average
    pub volume_ratio: f64,
    /// Funding rate at time of trade
    pub funding_rate: f64,
    /// Sentiment score (-100 to 100)
    pub sentiment_score: f64,
    /// Whether any macro warnings were active
    pub macro_warnings: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MarketTrend {
    StrongBullish,
    Bullish,
    Neutral,
    Bearish,
    StrongBearish,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PatternMemory {
    /// Hash of the pattern
    pub pattern_hash: String,
    /// Description of the pattern
    pub description: String,
    /// Trade IDs associated with this pattern
    pub trade_ids: Vec<String>,
    /// Success count
    pub success_count: u64,
    /// Failure count
    pub failure_count: u64,
    /// Success rate (0-1)
    pub success_rate: f64,
    /// Average ROI
    pub average_roi: f64,
    /// Average holding time in seconds
    pub average_holding_time: u64,
    /// Memory strength (0-1, higher is stronger)
    pub memory_strength: f64,
    /// Last time this pattern was observed
    pub last_observed: DateTime<Utc>,
    /// Feature vector representing this pattern
    pub feature_vector: Vec<f64>,
}

impl MemoryNode {
    pub fn new(config: MemoryNodeConfig) -> Self {
        Self {
            state: MemoryNodeState {
                active: true,
                last_update: Utc::now(),
                memory_count: 0,
                pattern_memory_count: 0,
                retrieval_count: 0,
                reinforcement_count: 0,
            },
            config,
            memories: HashMap::new(),
            pattern_memories: HashMap::new(),
        }
    }

    /// Store a new trade memory
    pub fn store_memory(&mut self, memory: TradeMemory) -> anyhow::Result<()> {
        // Check if we need to make room
        if self.memories.len() >= self.config.max_trade_memories {
            // Find the weakest memory to replace
            if let Some((weakest_id, _)) = self.memories.iter()
                .min_by(|(_, a), (_, b)| a.memory_strength.partial_cmp(&b.memory_strength).unwrap()) {
                let weakest_id = weakest_id.clone();
                self.memories.remove(&weakest_id);
            }
        }
        
        // Store the memory
        let id = memory.id.clone();
        self.memories.insert(id, memory.clone());
        
        // Update pattern memory
        self.update_pattern_memory(&memory);
        
        // Update state
        self.state.memory_count = self.memories.len();
        self.state.pattern_memory_count = self.pattern_memories.len();
        self.state.last_update = Utc::now();
        
        // Persist memories if configured
        if self.config.persist_memories {
            self.persist_memories()?;
        }
        
        Ok(())
    }

    /// Update pattern memory based on a trade memory
    fn update_pattern_memory(&mut self, memory: &TradeMemory) {
        let pattern_hash = memory.pattern_hash.clone();
        
        // Check if pattern exists
        if let Some(pattern) = self.pattern_memories.get_mut(&pattern_hash) {
            // Update existing pattern
            pattern.trade_ids.push(memory.id.clone());
            
            // Update success/failure counts
            let is_success = match memory.outcome {
                TradeOutcome::TakeProfitHit(_) => true,
                TradeOutcome::ManualClose(roi) if roi > 0.0 => true,
                TradeOutcome::Expired(roi) if roi > 0.0 => true,
                _ => false,
            };
            
            if is_success {
                pattern.success_count += 1;
            } else {
                pattern.failure_count += 1;
            }
            
            // Update stats
            let total_trades = pattern.success_count + pattern.failure_count;
            pattern.success_rate = pattern.success_count as f64 / total_trades as f64;
            
            // Update ROI (simple average for now)
            let roi = match &memory.outcome {
                TradeOutcome::TakeProfitHit(roi) => *roi,
                TradeOutcome::StopLossHit(roi) => *roi,
                TradeOutcome::ManualClose(roi) => *roi,
                TradeOutcome::Expired(roi) => *roi,
                TradeOutcome::Aborted(_) => 0.0,
            };
            
            pattern.average_roi = (pattern.average_roi * (total_trades - 1) as f64 + roi) / total_trades as f64;
            
            // Update holding time
            let holding_time = (memory.exit_time - memory.entry_time).num_seconds() as u64;
            pattern.average_holding_time = (pattern.average_holding_time * (total_trades - 1) + holding_time) / total_trades;
            
            // Update last observed
            pattern.last_observed = Utc::now();
            
            // Update memory strength based on recency and success rate
            pattern.memory_strength = calculate_pattern_strength(pattern);
        } else {
            // Create new pattern memory
            if self.pattern_memories.len() >= self.config.max_pattern_memories {
                // Find the weakest pattern to replace
                if let Some((weakest_id, _)) = self.pattern_memories.iter()
                    .min_by(|(_, a), (_, b)| a.memory_strength.partial_cmp(&b.memory_strength).unwrap()) {
                    let weakest_id = weakest_id.clone();
                    self.pattern_memories.remove(&weakest_id);
                }
            }
            
            // Determine success/failure
            let is_success = match memory.outcome {
                TradeOutcome::TakeProfitHit(_) => true,
                TradeOutcome::ManualClose(roi) if roi > 0.0 => true,
                TradeOutcome::Expired(roi) if roi > 0.0 => true,
                _ => false,
            };
            
            let success_count = if is_success { 1 } else { 0 };
            let failure_count = if is_success { 0 } else { 1 };
            
            // Get ROI
            let roi = match &memory.outcome {
                TradeOutcome::TakeProfitHit(roi) => *roi,
                TradeOutcome::StopLossHit(roi) => *roi,
                TradeOutcome::ManualClose(roi) => *roi,
                TradeOutcome::Expired(roi) => *roi,
                TradeOutcome::Aborted(_) => 0.0,
            };
            
            // Calculate holding time
            let holding_time = (memory.exit_time - memory.entry_time).num_seconds() as u64;
            
            // Create new pattern
            let new_pattern = PatternMemory {
                pattern_hash: pattern_hash.clone(),
                description: format!("Pattern for {}", memory.asset),
                trade_ids: vec![memory.id.clone()],
                success_count,
                failure_count,
                success_rate: success_count as f64 / (success_count + failure_count) as f64,
                average_roi: roi,
                average_holding_time: holding_time,
                memory_strength: 0.5,  // Initial strength
                last_observed: Utc::now(),
                feature_vector: vec![],  // Would be populated in a real implementation
            };
            
            // Store new pattern
            self.pattern_memories.insert(pattern_hash, new_pattern);
        }
    }

    /// Retrieve memories similar to a given pattern
    pub fn retrieve_similar_memories(&mut self, pattern_hash: &str, limit: usize) -> Vec<TradeMemory> {
        self.state.retrieval_count += 1;
        
        // If exact pattern exists, return its trades
        if let Some(pattern) = self.pattern_memories.get(pattern_hash) {
            return pattern.trade_ids.iter()
                .filter_map(|id| self.memories.get(id).cloned())
                .take(limit)
                .collect();
        }
        
        // In a real implementation, this would use vector similarity search
        // For now, just return the most recent memories
        let mut memories: Vec<_> = self.memories.values().cloned().collect();
        memories.sort_by(|a, b| b.entry_time.cmp(&a.entry_time));
        memories.truncate(limit);
        
        memories
    }

    /// Reinforce a memory (increase its strength)
    pub fn reinforce_memory(&mut self, memory_id: &str) -> anyhow::Result<()> {
        if let Some(memory) = self.memories.get_mut(memory_id) {
            memory.memory_strength = (memory.memory_strength + 0.1).min(1.0);
            memory.reinforcement_count += 1;
            memory.last_reinforced = Utc::now();
            
            self.state.reinforcement_count += 1;
            self.state.last_update = Utc::now();
            
            Ok(())
        } else {
            Err(anyhow::anyhow!("Memory not found: {}", memory_id))
        }
    }

    /// Decay all memories based on time
    pub fn decay_memories(&mut self) {
        let now = Utc::now();
        
        // Decay trade memories
        for memory in self.memories.values_mut() {
            let days_since_reinforced = (now - memory.last_reinforced).num_days() as f64;
            let decay_factor = self.config.memory_decay_factor.powf(days_since_reinforced / 30.0);
            memory.memory_strength *= decay_factor;
        }
        
        // Decay pattern memories
        for pattern in self.pattern_memories.values_mut() {
            let days_since_observed = (now - pattern.last_observed).num_days() as f64;
            let decay_factor = self.config.memory_decay_factor.powf(days_since_observed / 30.0);
            pattern.memory_strength *= decay_factor;
        }
        
        self.state.last_update = now;
    }

    /// Persist memories to disk
    fn persist_memories(&self) -> anyhow::Result<()> {
        // In a real implementation, this would serialize and save memories
        // to the configured persistence path
        Ok(())
    }

    /// Load memories from disk
    pub fn load_memories(&mut self) -> anyhow::Result<()> {
        // In a real implementation, this would load serialized memories
        // from the configured persistence path
        Ok(())
    }
}

/// Calculate pattern memory strength based on various factors
fn calculate_pattern_strength(pattern: &PatternMemory) -> f64 {
    let total_trades = pattern.success_count + pattern.failure_count;
    
    // More trades = stronger memory
    let trade_count_factor = (total_trades as f64).min(20.0) / 20.0;
    
    // Higher success rate = stronger memory
    let success_factor = pattern.success_rate;
    
    // Higher ROI = stronger memory
    let roi_factor = (pattern.average_roi / 10.0).min(1.0).max(0.0);
    
    // Recency factor
    let days_since_observed = (Utc::now() - pattern.last_observed).num_days() as f64;
    let recency_factor = (-days_since_observed / 30.0).exp();
    
    // Combine factors with weights
    let strength = 0.3 * trade_count_factor + 
                   0.3 * success_factor + 
                   0.2 * roi_factor + 
                   0.2 * recency_factor;
    
    strength.min(1.0).max(0.0)
}

#[async_trait]
impl Agent for MemoryNode {
    async fn process(&mut self) -> anyhow::Result<Vec<Message>> {
        // Decay memories
        self.decay_memories();
        
        // In a real implementation, this would also handle memory consolidation,
        // pattern discovery, etc.
        
        // No messages to send in this simple implementation
        Ok(Vec::new())
    }

    fn name(&self) -> &str {
        "memory_node"
    }

    fn is_active(&self) -> bool {
        self.state.active
    }

    fn set_active(&mut self, active: bool) {
        self.state.active = active;
    }
}
