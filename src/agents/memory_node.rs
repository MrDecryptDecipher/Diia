//! Memory Node Agent
//!
//! This agent is responsible for storing and retrieving trade memory and metadata,
//! forming the core of the system's recursive intelligence loop.

use std::sync::Arc;
use std::collections::{HashMap, VecDeque};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use anyhow::Result;
use tracing::{info, debug, warn};
use async_trait::async_trait;
use tokio::sync::RwLock;

use crate::engine::agent_trait::{Agent, AgentContext, AgentConfig};
use crate::engine::message_bus::{BusMessage, MessageBus, MessageType, TradeDirection};

/// Maximum number of memories to store
const MAX_MEMORIES: usize = 10000;

/// Memory entry for a trade
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TradeMemory {
    /// Unique ID for the memory
    pub id: String,

    /// Symbol
    pub symbol: String,

    /// Entry timestamp
    pub entry_time: DateTime<Utc>,

    /// Exit timestamp (if trade is closed)
    pub exit_time: Option<DateTime<Utc>>,

    /// Trade direction
    pub direction: TradeDirection,

    /// Entry price
    pub entry_price: f64,

    /// Exit price (if trade is closed)
    pub exit_price: Option<f64>,

    /// Position size
    pub position_size: f64,

    /// Leverage used
    pub leverage: f64,

    /// Profit/loss amount
    pub pnl: Option<f64>,

    /// ROI percentage
    pub roi: Option<f64>,

    /// Duration in seconds
    pub duration_seconds: Option<u64>,

    /// Agents that contributed to the trade decision
    pub contributing_agents: Vec<String>,

    /// Agent confidence scores
    pub agent_confidence: HashMap<String, f64>,

    /// Market conditions at entry
    pub market_conditions: MarketConditions,

    /// Trade outcome classification
    pub outcome: Option<TradeOutcome>,

    /// Fractal pattern signature
    pub fractal_signature: Option<Vec<f64>>,

    /// Metadata tags
    pub tags: Vec<String>,

    /// Reinforcement learning feedback
    pub reinforcement: Option<ReinforcementFeedback>,
}

/// Market conditions at trade entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarketConditions {
    /// Market trend
    pub trend: Option<MarketTrend>,

    /// Volatility
    pub volatility: Option<f64>,

    /// Volume
    pub volume: Option<f64>,

    /// Liquidity
    pub liquidity: Option<f64>,

    /// Funding rate
    pub funding_rate: Option<f64>,

    /// Open interest
    pub open_interest: Option<f64>,

    /// Orderbook imbalance
    pub orderbook_imbalance: Option<f64>,
}

impl Default for MarketConditions {
    fn default() -> Self {
        Self {
            trend: None,
            volatility: None,
            volume: None,
            liquidity: None,
            funding_rate: None,
            open_interest: None,
            orderbook_imbalance: None,
        }
    }
}

/// Market trend
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum MarketTrend {
    /// Uptrend
    Up,

    /// Downtrend
    Down,

    /// Sideways/ranging
    Sideways,

    /// Choppy/volatile
    Choppy,
}

/// Trade struct for storing trade information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Trade {
    /// Trade ID
    pub id: String,

    /// Symbol
    pub symbol: String,

    /// Entry time
    pub entry_time: DateTime<Utc>,

    /// Exit time
    pub exit_time: Option<DateTime<Utc>>,

    /// Entry price
    pub entry_price: f64,

    /// Exit price
    pub exit_price: Option<f64>,

    /// Direction
    pub direction: TradeDirection,

    /// Position size
    pub position_size: f64,

    /// PnL
    pub pnl: Option<f64>,

    /// ROI
    pub roi: Option<f64>,

    /// Contributing agents
    pub contributing_agents: Vec<String>,

    /// Agent confidence
    pub agent_confidence: HashMap<String, f64>,

    /// Strategy
    pub strategy: String,

    /// Tags
    pub tags: Vec<String>,

    /// Metadata
    pub metadata: HashMap<String, String>,
}

/// Trade outcome classification
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TradeOutcome {
    /// Profitable trade
    Win,

    /// Loss trade
    Loss,

    /// Breakeven trade
    Breakeven,

    /// Trade was stopped out
    StopLoss,

    /// Trade hit take profit
    TakeProfit,

    /// Trade was manually closed
    ManualClose,

    /// Unknown outcome
    Unknown,
}

/// Market trend direction
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TrendDirection {
    /// Uptrend
    Up,

    /// Downtrend
    Down,

    /// Sideways/ranging
    Sideways,

    /// Choppy/volatile
    Choppy,
}

/// Reinforcement learning feedback
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReinforcementFeedback {
    /// Reward value
    pub reward: f64,

    /// Agent adjustments
    pub agent_adjustments: HashMap<String, f64>,

    /// Strategy adjustments
    pub strategy_adjustments: HashMap<String, f64>,

    /// Learning rate
    pub learning_rate: f64,
}

/// Memory query parameters
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryQuery {
    /// Symbol filter
    pub symbol: Option<String>,

    /// Minimum ROI
    pub min_roi: Option<f64>,

    /// Maximum ROI
    pub max_roi: Option<f64>,

    /// Trade outcome
    pub outcome: Option<TradeOutcome>,

    /// Time range start
    pub time_start: Option<DateTime<Utc>>,

    /// Time range end
    pub time_end: Option<DateTime<Utc>>,

    /// Contributing agent
    pub agent: Option<String>,

    /// Tags to match (any)
    pub tags_any: Option<Vec<String>>,

    /// Tags to match (all)
    pub tags_all: Option<Vec<String>>,

    /// Trend direction
    pub trend: Option<TrendDirection>,

    /// Limit number of results
    pub limit: Option<usize>,
}

/// Memory node state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryNodeState {
    /// Whether the agent is active
    pub active: bool,

    /// Number of memories stored
    pub memory_count: usize,

    /// Total profit/loss
    pub total_pnl: f64,

    /// Win rate
    pub win_rate: f64,

    /// Average ROI
    pub average_roi: f64,

    /// Best performing symbols
    pub best_symbols: Vec<(String, f64)>,

    /// Best performing agents
    pub best_agents: Vec<(String, f64)>,
}

/// Memory Node Agent
/// Memory Node configuration
#[derive(Debug, Clone)]
pub struct MemoryNodeConfig {
    /// Maximum memory size
    pub max_memory_size: usize,
}

impl Default for MemoryNodeConfig {
    fn default() -> Self {
        Self {
            max_memory_size: 1000,
        }
    }
}

pub struct MemoryNode {
    /// Configuration
    config: MemoryNodeConfig,

    /// Message bus
    message_bus: Arc<MessageBus>,

    /// Agent state
    state: MemoryNodeState,

    /// Trade memories
    trade_memories: Vec<TradeMemory>,

    /// Symbol performance index
    symbol_performance: HashMap<String, f64>,

    /// Agent performance index
    agent_performance: HashMap<String, f64>,

    /// Pattern memory index
    pattern_memory: HashMap<String, Vec<TradeMemory>>,

    /// Running flag
    running: bool,
}

impl MemoryNode {
    /// Store a trade in memory
    pub fn store_trade(&mut self, trade: Trade) -> Result<()> {
        // Convert trade to memory
        let memory = TradeMemory {
            id: trade.id.clone(),
            symbol: trade.symbol.clone(),
            entry_time: trade.entry_time,
            exit_time: trade.exit_time,
            entry_price: trade.entry_price,
            exit_price: trade.exit_price,
            direction: trade.direction,
            position_size: trade.position_size,
            leverage: 1.0,
            pnl: trade.pnl,
            roi: trade.roi,
            outcome: if let Some(roi) = trade.roi {
                if roi > 0.0 {
                    Some(TradeOutcome::Win)
                } else if roi < 0.0 {
                    Some(TradeOutcome::Loss)
                } else {
                    Some(TradeOutcome::Breakeven)
                }
            } else {
                Some(TradeOutcome::Unknown)
            },
            contributing_agents: trade.contributing_agents.clone(),
            agent_confidence: trade.agent_confidence.clone(),
            market_conditions: MarketConditions::default(),
            fractal_signature: None,
            reinforcement: None,
            tags: trade.tags.clone(),
            duration_seconds: None,
        };

        // Store memory
        self.store_memory(memory);

        Ok(())
    }
    /// Create a new memory node
    pub fn new(config: MemoryNodeConfig, message_bus: Arc<MessageBus>) -> Self {
        Self {
            config,
            message_bus,
            state: MemoryNodeState {
                active: true,
                memory_count: 0,
                total_pnl: 0.0,
                win_rate: 0.0,
                average_roi: 0.0,
                best_symbols: Vec::new(),
                best_agents: Vec::new(),
            },
            trade_memories: Vec::new(),
            symbol_performance: HashMap::new(),
            agent_performance: HashMap::new(),
            pattern_memory: HashMap::new(),
            running: false,
        }
    }

    /// Store a new trade memory
    pub fn store_memory(&mut self, memory: TradeMemory) -> Result<()> {
        // Add to memories
        self.trade_memories.push(memory.clone());

        // Enforce capacity limit
        if self.trade_memories.len() > self.config.max_memory_size {
            self.trade_memories.remove(0);
        }

        // Update state
        self.state.memory_count = self.trade_memories.len();

        // Update performance indices if trade is closed
        if let (Some(pnl), Some(roi)) = (memory.pnl, memory.roi) {
            // Update total PnL
            self.state.total_pnl += pnl;

            // Update symbol performance
            *self.symbol_performance.entry(memory.symbol.clone()).or_insert(0.0) += roi;

            // Update agent performance
            for agent in &memory.contributing_agents {
                let confidence = memory.agent_confidence.get(agent).unwrap_or(&0.5);
                let agent_contribution = roi * confidence;
                *self.agent_performance.entry(agent.clone()).or_insert(0.0) += agent_contribution;
            }

            // Update pattern memory
            if let Some(signature) = &memory.fractal_signature {
                let signature_key = format!("{}-{}", memory.symbol, self.hash_signature(signature));
                self.pattern_memory.entry(signature_key).or_insert_with(Vec::new).push(memory.clone());
            }

            // Update win rate
            let win_count = self.trade_memories.iter()
                .filter(|m| m.outcome == Some(TradeOutcome::Win) || m.outcome == Some(TradeOutcome::TakeProfit))
                .count();

            let closed_trades = self.trade_memories.iter()
                .filter(|m| m.outcome.is_some())
                .count();

            if closed_trades > 0 {
                self.state.win_rate = win_count as f64 / closed_trades as f64;
            }

            // Update average ROI
            let total_roi: f64 = self.trade_memories.iter()
                .filter_map(|m| m.roi)
                .sum();

            let roi_count = self.trade_memories.iter()
                .filter(|m| m.roi.is_some())
                .count();

            if roi_count > 0 {
                self.state.average_roi = total_roi / roi_count as f64;
            }

            // Update best symbols
            let mut symbol_performance: Vec<(String, f64)> = self.symbol_performance.iter()
                .map(|(k, v)| (k.clone(), *v))
                .collect();

            symbol_performance.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));

            self.state.best_symbols = symbol_performance.into_iter()
                .take(10)
                .collect();

            // Update best agents
            let mut agent_performance: Vec<(String, f64)> = self.agent_performance.iter()
                .map(|(k, v)| (k.clone(), *v))
                .collect();

            agent_performance.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));

            self.state.best_agents = agent_performance.into_iter()
                .take(10)
                .collect();
        }

        Ok(())
    }

    /// Query memories
    pub fn query_memories(&self, query: &MemoryQuery) -> Vec<TradeMemory> {
        let mut results: Vec<TradeMemory> = self.trade_memories.iter()
            .filter(|memory| {
                // Filter by symbol
                if let Some(symbol) = &query.symbol {
                    if memory.symbol != *symbol {
                        return false;
                    }
                }

                // Filter by ROI
                if let Some(min_roi) = query.min_roi {
                    if let Some(roi) = memory.roi {
                        if roi < min_roi {
                            return false;
                        }
                    } else {
                        return false;
                    }
                }

                if let Some(max_roi) = query.max_roi {
                    if let Some(roi) = memory.roi {
                        if roi > max_roi {
                            return false;
                        }
                    }
                }

                // Filter by outcome
                if let Some(outcome) = &query.outcome {
                    if memory.outcome.as_ref() != Some(outcome) {
                        return false;
                    }
                }

                // Filter by time range
                if let Some(start) = query.time_start {
                    if memory.entry_time < start {
                        return false;
                    }
                }

                if let Some(end) = query.time_end {
                    if memory.entry_time > end {
                        return false;
                    }
                }

                // Filter by agent
                if let Some(agent) = &query.agent {
                    if !memory.contributing_agents.contains(agent) {
                        return false;
                    }
                }

                // Filter by tags (any)
                if let Some(tags) = &query.tags_any {
                    if !tags.iter().any(|tag| memory.tags.contains(tag)) {
                        return false;
                    }
                }

                // Filter by tags (all)
                if let Some(tags) = &query.tags_all {
                    if !tags.iter().all(|tag| memory.tags.contains(tag)) {
                        return false;
                    }
                }

                // Filter by trend
                if let Some(trend_direction) = &query.trend {
                    if let Some(memory_trend) = &memory.market_conditions.trend {
                        // Convert MarketTrend to TrendDirection for comparison
                        let equivalent_trend = match memory_trend {
                            MarketTrend::Up => TrendDirection::Up,
                            MarketTrend::Down => TrendDirection::Down,
                            MarketTrend::Sideways => TrendDirection::Sideways,
                            MarketTrend::Choppy => TrendDirection::Choppy,
                        };

                        if &equivalent_trend != trend_direction {
                            return false;
                        }
                    } else {
                        // No trend in memory, so it doesn't match the query
                        return false;
                    }
                }

                true
            })
            .cloned()
            .collect();

        // Apply limit
        if let Some(limit) = query.limit {
            results.truncate(limit);
        }

        results
    }

    /// Find similar patterns
    pub fn find_similar_patterns(&self, symbol: &str, pattern: &[f64], threshold: f64) -> Vec<TradeMemory> {
        let mut results = Vec::new();

        // Find exact pattern matches first
        let pattern_hash = self.hash_signature(pattern);
        let signature_key = format!("{}-{}", symbol, pattern_hash);

        if let Some(memories) = self.pattern_memory.get(&signature_key) {
            results.extend(memories.clone());
        }

        // If not enough results, find similar patterns
        if results.len() < 5 {
            for memory in &self.trade_memories {
                if memory.symbol != symbol {
                    continue;
                }

                if let Some(signature) = &memory.fractal_signature {
                    if signature.len() == pattern.len() {
                        let similarity = self.calculate_similarity(pattern, signature);
                        if similarity >= threshold {
                            results.push(memory.clone());
                        }
                    }
                }
            }
        }

        results
    }

    /// Calculate similarity between two patterns
    fn calculate_similarity(&self, pattern1: &[f64], pattern2: &[f64]) -> f64 {
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

    /// Hash a pattern signature
    fn hash_signature(&self, signature: &[f64]) -> String {
        // Simple hash function for pattern signatures
        let mut hash = 0u64;
        for (i, val) in signature.iter().enumerate() {
            let val_bits = val.to_bits();
            hash = hash.wrapping_add(val_bits.wrapping_mul((i as u64).wrapping_add(1)));
        }

        format!("{:x}", hash)
    }

    /// Get memory statistics
    pub fn get_statistics(&self) -> MemoryNodeState {
        self.state.clone()
    }

    /// Generate reinforcement feedback
    pub fn generate_reinforcement(&self, memory: &TradeMemory) -> ReinforcementFeedback {
        let mut agent_adjustments = HashMap::new();
        let mut strategy_adjustments = HashMap::new();

        // Base reward on ROI
        let reward = memory.roi.unwrap_or(0.0);

        // Adjust agents based on their contribution
        for agent in &memory.contributing_agents {
            let confidence = memory.agent_confidence.get(agent).unwrap_or(&0.5);
            let adjustment = if reward > 0.0 {
                // Positive reinforcement
                reward * confidence * 0.1
            } else {
                // Negative reinforcement
                reward * confidence * 0.2
            };

            agent_adjustments.insert(agent.clone(), adjustment);
        }

        // Adjust strategies based on outcome
        if let Some(outcome) = &memory.outcome {
            match outcome {
                TradeOutcome::Win | TradeOutcome::TakeProfit => {
                    // Reinforce successful strategies
                    for tag in &memory.tags {
                        if tag.starts_with("strategy:") {
                            strategy_adjustments.insert(tag.clone(), reward * 0.1);
                        }
                    }
                },
                TradeOutcome::Loss | TradeOutcome::StopLoss => {
                    // Penalize failed strategies
                    for tag in &memory.tags {
                        if tag.starts_with("strategy:") {
                            strategy_adjustments.insert(tag.clone(), reward * 0.2);
                        }
                    }
                },
                _ => {}
            }
        }

        ReinforcementFeedback {
            reward,
            agent_adjustments,
            strategy_adjustments,
            learning_rate: 0.1,
        }
    }

    /// Add trade memory
    fn add_trade_memory(&mut self, memory: TradeMemory) {
        // Add memory
        self.trade_memories.push(memory);

        // Trim if necessary
        if self.trade_memories.len() > self.config.max_memory_size {
            self.trade_memories.remove(0);
        }

        // Update state
        self.state.memory_count = self.trade_memories.len();
    }
}

#[async_trait]
impl Agent for MemoryNode {
    async fn initialize(&mut self, _context: Arc<RwLock<AgentContext>>) -> Result<()> {
        info!("Initializing Memory Node");

        // Send initialization message
        let message = BusMessage {
            message_type: MessageType::AgentInitialized,
            content: "Memory Node initialized".to_string(),
            timestamp: chrono::Utc::now(),
        };

        self.message_bus.publish(message).await;

        Ok(())
    }

    async fn start(&mut self) -> Result<()> {
        info!("Starting Memory Node");

        self.running = true;

        // Send start message
        let message = BusMessage {
            message_type: MessageType::AgentStarted,
            content: "Memory Node started".to_string(),
            timestamp: chrono::Utc::now(),
        };

        self.message_bus.publish(message).await;

        Ok(())
    }

    async fn stop(&mut self) -> Result<()> {
        info!("Stopping Memory Node");

        self.running = false;

        // Send stop message
        let message = BusMessage {
            message_type: MessageType::AgentStopped,
            content: "Memory Node stopped".to_string(),
            timestamp: chrono::Utc::now(),
        };

        self.message_bus.publish(message).await;

        Ok(())
    }

    async fn update(&mut self) -> Result<()> {
        if !self.running {
            return Ok(());
        }

        debug!("Updating Memory Node");

        Ok(())
    }

    async fn handle_message(&mut self, message: BusMessage) -> Result<()> {
        match message.message_type {
            MessageType::TradeEntry => {
                info!("Received trade entry message: {}", message.content);

                // Parse trade entry message
                // Format: "symbol:BTCUSDT,side:Buy,price:50000,quantity:0.001,order_id:123456"
                let parts: Vec<&str> = message.content.split(',').collect();

                let mut symbol = String::new();
                let mut side = String::new();
                let mut price = 0.0;
                let mut quantity = 0.0;
                let mut order_id = String::new();

                for part in parts {
                    let kv: Vec<&str> = part.split(':').collect();

                    if kv.len() == 2 {
                        match kv[0] {
                            "symbol" => symbol = kv[1].to_string(),
                            "side" => side = kv[1].to_string(),
                            "price" => price = kv[1].parse::<f64>().unwrap_or(0.0),
                            "quantity" => quantity = kv[1].parse::<f64>().unwrap_or(0.0),
                            "order_id" => order_id = kv[1].to_string(),
                            _ => {}
                        }
                    }
                }

                // Create trade memory
                let memory = TradeMemory {
                    id: format!("trade-{}-{}", symbol, chrono::Utc::now().timestamp_millis()),
                    symbol,
                    entry_price: price,
                    exit_price: None,
                    position_size: quantity,
                    direction: match side.as_str() {
                        "buy" | "Buy" | "BUY" => TradeDirection::Long,
                        _ => TradeDirection::Short,
                    },
                    entry_time: chrono::Utc::now(),
                    exit_time: None,
                    pnl: None,
                    roi: None,
                    leverage: 1.0,
                    contributing_agents: Vec::new(),
                    agent_confidence: HashMap::new(),
                    market_conditions: MarketConditions::default(),
                    outcome: None,
                    fractal_signature: None,
                    tags: Vec::new(),
                    reinforcement: None,
                    duration_seconds: None,
                };

                // Add trade memory
                self.add_trade_memory(memory);

                info!("Added trade memory");
            },
            MessageType::TradeExit => {
                info!("Received trade exit message: {}", message.content);

                // Parse trade exit message
                // Format: "symbol:BTCUSDT,price:51000,order_id:123456,pnl:1.0,roi:0.02"
                let parts: Vec<&str> = message.content.split(',').collect();

                let mut symbol = String::new();
                let mut price = 0.0;
                let mut order_id = String::new();
                let mut pnl = 0.0;
                let mut roi = 0.0;

                for part in parts {
                    let kv: Vec<&str> = part.split(':').collect();

                    if kv.len() == 2 {
                        match kv[0] {
                            "symbol" => symbol = kv[1].to_string(),
                            "price" => price = kv[1].parse::<f64>().unwrap_or(0.0),
                            "order_id" => order_id = kv[1].to_string(),
                            "pnl" => pnl = kv[1].parse::<f64>().unwrap_or(0.0),
                            "roi" => roi = kv[1].parse::<f64>().unwrap_or(0.0),
                            _ => {}
                        }
                    }
                }

                // Find and update trade memory
                for memory in &mut self.trade_memories {
                    if memory.symbol == symbol && memory.exit_price.is_none() {
                        memory.exit_price = Some(price);
                        memory.exit_time = Some(chrono::Utc::now());
                        memory.pnl = Some(pnl);
                        memory.roi = Some(roi);

                        info!("Updated trade memory");
                        break;
                    }
                }
            },
            _ => {
                // Ignore other message types
            }
        }

        Ok(())
    }

    fn get_name(&self) -> &str {
        "MemoryNode"
    }

    fn get_config(&self) -> Box<dyn AgentConfig> {
        Box::new(self.config.clone())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_store_and_query_memory() {
        let mut memory_node = MemoryNode::new();

        // Create a test memory
        let memory = TradeMemory {
            id: "test-1".to_string(),
            symbol: "BTCUSDT".to_string(),
            entry_time: Utc::now(),
            exit_time: Some(Utc::now()),
            direction: TradeDirection::Long,
            entry_price: 50000.0,
            exit_price: Some(51000.0),
            position_size: 0.1,
            leverage: 1.0,
            pnl: Some(100.0),
            roi: Some(2.0),
            duration_seconds: Some(3600),
            contributing_agents: vec!["agent1".to_string(), "agent2".to_string()],
            agent_confidence: {
                let mut map = HashMap::new();
                map.insert("agent1".to_string(), 0.8);
                map.insert("agent2".to_string(), 0.6);
                map
            },
            market_conditions: MarketConditions {
                volatility: 0.5,
                volume: 1000000.0,
                trend: TrendDirection::Up,
                support_levels: vec![49000.0, 48000.0],
                resistance_levels: vec![51000.0, 52000.0],
                sentiment_score: 0.7,
                funding_rate: Some(0.01),
                open_interest: Some(500000000.0),
                orderbook_imbalance: Some(0.2),
            },
            outcome: Some(TradeOutcome::Win),
            fractal_signature: Some(vec![0.1, 0.2, 0.3, 0.4, 0.5]),
            tags: vec!["strategy:breakout".to_string(), "volatility:high".to_string()],
            reinforcement: None,
        };

        // Store the memory
        memory_node.store_memory(memory.clone()).unwrap();

        // Query the memory
        let query = MemoryQuery {
            symbol: Some("BTCUSDT".to_string()),
            min_roi: Some(1.0),
            max_roi: None,
            outcome: Some(TradeOutcome::Win),
            time_start: None,
            time_end: None,
            agent: Some("agent1".to_string()),
            tags_any: Some(vec!["strategy:breakout".to_string()]),
            tags_all: None,
            trend: Some(TrendDirection::Up),
            limit: None,
        };

        let results = memory_node.query_memories(&query);

        assert_eq!(results.len(), 1);
        assert_eq!(results[0].id, "test-1");

        // Test pattern matching
        let pattern = vec![0.1, 0.2, 0.3, 0.4, 0.5];
        let similar_trades = memory_node.find_similar_patterns("BTCUSDT", &pattern, 0.9);

        assert_eq!(similar_trades.len(), 1);
        assert_eq!(similar_trades[0].id, "test-1");
    }
}
