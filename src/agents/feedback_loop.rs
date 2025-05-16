//! Feedback Loop Agent
//!
//! This agent is responsible for agent reinforcement and mutation eligibility
//! based on trade performance.

use std::collections::{HashMap, VecDeque};
use chrono::{DateTime, Utc, Duration};
use serde::{Deserialize, Serialize};
use anyhow::Result;
use tracing::{info, debug, warn};
use async_trait::async_trait;

use crate::engine::agent_trait::{Agent, AgentContext, AgentConfig};
use crate::engine::message_bus::{BusMessage, Message, MessageBus, MessageType};
use std::sync::Arc;
use tokio::sync::RwLock;
use crate::agents::memory_node::{TradeMemory, TradeOutcome, ReinforcementFeedback};

/// Maximum number of agent performance records to keep
const MAX_AGENT_RECORDS: usize = 100;

/// Feedback loop state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FeedbackLoopState {
    /// Whether the agent is active
    pub active: bool,

    /// Number of trades processed
    pub trades_processed: usize,

    /// Number of agents tracked
    pub agents_tracked: usize,

    /// Number of mutations triggered
    pub mutations_triggered: usize,

    /// Number of agents killed
    pub agents_killed: usize,
}

/// Agent performance record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentPerformance {
    /// Agent name
    pub agent_name: String,

    /// Performance score (-1.0 to 1.0)
    pub score: f64,

    /// Confidence score (0.0 to 1.0)
    pub confidence: f64,

    /// Number of trades
    pub trade_count: usize,

    /// Success rate
    pub success_rate: f64,

    /// Average ROI contribution
    pub avg_roi_contribution: f64,

    /// Last updated
    pub last_updated: DateTime<Utc>,

    /// Recent trade IDs
    pub recent_trades: VecDeque<String>,

    /// Mutation eligibility
    pub mutation_eligible: bool,

    /// Kill eligibility
    pub kill_eligible: bool,

    /// Consecutive failures
    pub consecutive_failures: usize,
}

/// Mutation record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MutationRecord {
    /// Mutation ID
    pub id: String,

    /// Parent agent
    pub parent_agent: String,

    /// Mutated agent
    pub mutated_agent: String,

    /// Mutation timestamp
    pub timestamp: DateTime<Utc>,

    /// Mutation parameters
    pub parameters: HashMap<String, f64>,

    /// Mutation description
    pub description: String,

    /// Performance before mutation
    pub performance_before: f64,

    /// Performance after mutation
    pub performance_after: Option<f64>,

    /// Success flag
    pub success: Option<bool>,
}

/// Feedback Loop configuration
#[derive(Debug, Clone)]
pub struct FeedbackLoopConfig {
    /// Learning rate
    pub learning_rate: f64,

    /// Mutation threshold
    pub mutation_threshold: f64,

    /// Kill threshold
    pub kill_threshold: f64,

    /// Consecutive failure threshold
    pub consecutive_failure_threshold: usize,
}

impl Default for FeedbackLoopConfig {
    fn default() -> Self {
        Self {
            learning_rate: 0.01,
            mutation_threshold: 0.6,
            kill_threshold: 0.3,
            consecutive_failure_threshold: 5,
        }
    }
}

/// Feedback Loop Agent
pub struct FeedbackLoop {
    /// Configuration
    config: FeedbackLoopConfig,

    /// Message bus
    message_bus: Arc<MessageBus>,

    /// Agent state
    state: FeedbackLoopState,

    /// Agent performance records
    agent_performance: HashMap<String, AgentPerformance>,

    /// Mutation records
    mutations: Vec<MutationRecord>,

    /// Running flag
    running: bool,
}

impl FeedbackLoop {
    /// Create a new feedback loop
    pub fn new(config: FeedbackLoopConfig, message_bus: Arc<MessageBus>) -> Self {
        Self {
            config,
            message_bus,
            state: FeedbackLoopState {
                active: true,
                trades_processed: 0,
                agents_tracked: 0,
                mutations_triggered: 0,
                agents_killed: 0,
            },
            agent_performance: HashMap::new(),
            mutations: Vec::new(),
            running: false,
        }
    }

    /// Process trade feedback
    pub fn process_trade(&mut self, trade: &TradeMemory, feedback: &ReinforcementFeedback) -> Result<Vec<Message>> {
        let mut messages = Vec::new();

        // Update agent performance records
        for (agent_name, adjustment) in &feedback.agent_adjustments {
            self.update_agent_performance(agent_name, trade, *adjustment)?;
        }

        // Check for mutation eligibility
        let mutation_candidates = self.find_mutation_candidates();
        for agent_name in mutation_candidates {
            if let Some(performance) = self.agent_performance.get(&agent_name) {
                // Create mutation message
                let message = Message::Custom(
                    "mutation_request".to_string(),
                    serde_json::json!({
                        "agent_name": agent_name,
                        "performance": performance,
                        "timestamp": Utc::now(),
                    }),
                );

                messages.push(message);

                // Record mutation
                let mutation_id = format!("mutation-{}-{}", agent_name, Utc::now().timestamp_millis());
                let mutation = MutationRecord {
                    id: mutation_id,
                    parent_agent: agent_name.clone(),
                    mutated_agent: format!("{}-mutated", agent_name),
                    timestamp: Utc::now(),
                    parameters: HashMap::new(),
                    description: "Mutation requested due to high performance".to_string(),
                    performance_before: performance.score,
                    performance_after: None,
                    success: None,
                };

                self.mutations.push(mutation);
                self.state.mutations_triggered += 1;
            }
        }

        // Check for kill eligibility
        let kill_candidates = self.find_kill_candidates();
        for agent_name in kill_candidates {
            if let Some(performance) = self.agent_performance.get(&agent_name) {
                // Create kill message
                let message = Message::Custom(
                    "kill_request".to_string(),
                    serde_json::json!({
                        "agent_name": agent_name,
                        "performance": performance,
                        "timestamp": Utc::now(),
                        "reason": "Poor performance or consecutive failures",
                    }),
                );

                messages.push(message);
                self.state.agents_killed += 1;
            }
        }

        // Update state
        self.state.trades_processed += 1;
        self.state.agents_tracked = self.agent_performance.len();

        Ok(messages)
    }

    /// Update agent performance
    fn update_agent_performance(&mut self, agent_name: &str, trade: &TradeMemory, adjustment: f64) -> Result<()> {
        // Get or create agent performance record
        let performance = self.agent_performance.entry(agent_name.to_string())
            .or_insert_with(|| AgentPerformance {
                agent_name: agent_name.to_string(),
                score: 0.0,
                confidence: 0.5,
                trade_count: 0,
                success_rate: 0.0,
                avg_roi_contribution: 0.0,
                last_updated: Utc::now(),
                recent_trades: VecDeque::with_capacity(MAX_AGENT_RECORDS),
                mutation_eligible: false,
                kill_eligible: false,
                consecutive_failures: 0,
            });

        // Update performance score with adjustment
        performance.score = (performance.score * (1.0 - self.config.learning_rate)) + (adjustment * self.config.learning_rate);
        performance.score = performance.score.max(-1.0).min(1.0);

        // Update trade count
        performance.trade_count += 1;

        // Update success rate
        let is_success = trade.outcome == Some(TradeOutcome::Win) || trade.outcome == Some(TradeOutcome::TakeProfit);
        let success_value = if is_success { 1.0 } else { 0.0 };

        if performance.trade_count == 1 {
            performance.success_rate = success_value;
        } else {
            performance.success_rate = ((performance.success_rate * (performance.trade_count as f64 - 1.0)) + success_value) / performance.trade_count as f64;
        }

        // Update ROI contribution
        let roi_contribution = trade.roi.unwrap_or(0.0) * adjustment;

        if performance.trade_count == 1 {
            performance.avg_roi_contribution = roi_contribution;
        } else {
            performance.avg_roi_contribution = ((performance.avg_roi_contribution * (performance.trade_count as f64 - 1.0)) + roi_contribution) / performance.trade_count as f64;
        }

        // Update confidence
        if let Some(confidence) = trade.agent_confidence.get(agent_name) {
            performance.confidence = (performance.confidence * 0.9) + (confidence * 0.1);
        }

        // Update recent trades
        performance.recent_trades.push_back(trade.id.clone());
        if performance.recent_trades.len() > MAX_AGENT_RECORDS {
            performance.recent_trades.pop_front();
        }

        // Update consecutive failures
        if is_success {
            performance.consecutive_failures = 0;
        } else {
            performance.consecutive_failures += 1;
        }

        // Update eligibility flags
        performance.mutation_eligible = performance.score >= self.config.mutation_threshold && performance.trade_count >= 10;
        performance.kill_eligible = (performance.score <= self.config.kill_threshold && performance.trade_count >= 10) ||
                                   (performance.consecutive_failures >= self.config.consecutive_failure_threshold);

        // Update timestamp
        performance.last_updated = Utc::now();

        Ok(())
    }

    /// Find agents eligible for mutation
    fn find_mutation_candidates(&self) -> Vec<String> {
        self.agent_performance.iter()
            .filter(|(_, p)| p.mutation_eligible)
            .map(|(name, _)| name.clone())
            .collect()
    }

    /// Find agents eligible for killing
    fn find_kill_candidates(&self) -> Vec<String> {
        self.agent_performance.iter()
            .filter(|(_, p)| p.kill_eligible)
            .map(|(name, _)| name.clone())
            .collect()
    }

    /// Record mutation result
    pub fn record_mutation_result(&mut self, mutation_id: &str, success: bool, performance: f64) -> Result<()> {
        if let Some(mutation) = self.mutations.iter_mut().find(|m| m.id == mutation_id) {
            mutation.performance_after = Some(performance);
            mutation.success = Some(success);
        } else {
            return Err(anyhow::anyhow!("Mutation not found: {}", mutation_id));
        }

        Ok(())
    }

    /// Get agent performance
    pub fn get_agent_performance(&self, agent_name: &str) -> Option<&AgentPerformance> {
        self.agent_performance.get(agent_name)
    }

    /// Get all agent performance records
    pub fn get_all_agent_performance(&self) -> &HashMap<String, AgentPerformance> {
        &self.agent_performance
    }

    /// Get mutation records
    pub fn get_mutations(&self) -> &[MutationRecord] {
        &self.mutations
    }

    /// Get state
    pub fn get_state(&self) -> &FeedbackLoopState {
        &self.state
    }

    /// Set learning rate
    pub fn set_learning_rate(&mut self, rate: f64) {
        self.config.learning_rate = rate.max(0.0).min(1.0);
    }

    /// Set mutation threshold
    pub fn set_mutation_threshold(&mut self, threshold: f64) {
        self.config.mutation_threshold = threshold;
    }

    /// Set kill threshold
    pub fn set_kill_threshold(&mut self, threshold: f64) {
        self.config.kill_threshold = threshold;
    }

    /// Set consecutive failure threshold
    pub fn set_consecutive_failure_threshold(&mut self, threshold: usize) {
        self.config.consecutive_failure_threshold = threshold;
    }
}

#[async_trait]
impl Agent for FeedbackLoop {
    async fn initialize(&mut self, _context: Arc<RwLock<AgentContext>>) -> Result<()> {
        info!("Initializing Feedback Loop");

        // Send initialization message
        let message = BusMessage {
            message_type: MessageType::AgentInitialized,
            content: "Feedback Loop initialized".to_string(),
            timestamp: chrono::Utc::now(),
        };

        self.message_bus.publish(message).await;

        Ok(())
    }

    async fn start(&mut self) -> Result<()> {
        info!("Starting Feedback Loop");

        self.running = true;

        // Send start message
        let message = BusMessage {
            message_type: MessageType::AgentStarted,
            content: "Feedback Loop started".to_string(),
            timestamp: chrono::Utc::now(),
        };

        self.message_bus.publish(message).await;

        Ok(())
    }

    async fn stop(&mut self) -> Result<()> {
        info!("Stopping Feedback Loop");

        self.running = false;

        // Send stop message
        let message = BusMessage {
            message_type: MessageType::AgentStopped,
            content: "Feedback Loop stopped".to_string(),
            timestamp: chrono::Utc::now(),
        };

        self.message_bus.publish(message).await;

        Ok(())
    }

    async fn update(&mut self) -> Result<()> {
        if !self.running {
            return Ok(());
        }

        debug!("Updating Feedback Loop");

        Ok(())
    }

    async fn handle_message(&mut self, message: BusMessage) -> Result<()> {
        match message.message_type {
            MessageType::TradeCompleted => {
                // Process trade completion
                info!("Received trade completion message: {}", message.content);
            },
            _ => {
                // Ignore other message types
            }
        }

        Ok(())
    }

    fn get_name(&self) -> &str {
        "FeedbackLoop"
    }

    fn get_config(&self) -> Box<dyn AgentConfig> {
        Box::new(self.config.clone())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;

    #[test]
    fn test_agent_performance_update() {
        let mut feedback_loop = FeedbackLoop::new();

        // Create a test trade
        let trade = TradeMemory {
            id: "test-1".to_string(),
            symbol: "BTCUSDT".to_string(),
            entry_time: Utc::now(),
            exit_time: Some(Utc::now()),
            direction: crate::engine::message_bus::TradeDirection::Long,
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
            market_conditions: crate::agents::memory_node::MarketConditions {
                volatility: 0.5,
                volume: 1000000.0,
                trend: crate::agents::memory_node::TrendDirection::Up,
                support_levels: vec![49000.0, 48000.0],
                resistance_levels: vec![51000.0, 52000.0],
                sentiment_score: 0.7,
                funding_rate: Some(0.01),
                open_interest: Some(500000000.0),
                orderbook_imbalance: Some(0.2),
            },
            outcome: Some(TradeOutcome::Profit),
            fractal_signature: Some(vec![0.1, 0.2, 0.3, 0.4, 0.5]),
            tags: vec!["strategy:breakout".to_string(), "volatility:high".to_string()],
            reinforcement: None,
        };

        // Create feedback
        let feedback = ReinforcementFeedback {
            reward: 2.0,
            agent_adjustments: {
                let mut map = HashMap::new();
                map.insert("agent1".to_string(), 0.2);
                map.insert("agent2".to_string(), 0.1);
                map
            },
            strategy_adjustments: {
                let mut map = HashMap::new();
                map.insert("strategy:breakout".to_string(), 0.2);
                map
            },
            learning_rate: 0.1,
        };

        // Process trade
        let messages = feedback_loop.process_trade(&trade, &feedback).unwrap();

        // Check agent performance
        let agent1 = feedback_loop.get_agent_performance("agent1").unwrap();
        assert_eq!(agent1.agent_name, "agent1");
        assert_eq!(agent1.trade_count, 1);
        assert_eq!(agent1.success_rate, 1.0);
        assert!(agent1.score > 0.0);

        // Check state
        assert_eq!(feedback_loop.get_state().trades_processed, 1);
        assert_eq!(feedback_loop.get_state().agents_tracked, 2);
    }
}
