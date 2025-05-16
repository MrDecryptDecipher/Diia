//! God Kernel Agent
//!
//! This agent is responsible for breeding/killing agents and evolving the system.
//! It acts as the central intelligence that manages the entire agent ecosystem.

use std::collections::{HashMap, VecDeque};
use chrono::{DateTime, Utc, Duration};
use serde::{Deserialize, Serialize};
use anyhow::Result;
use tracing::{info, debug, warn, error};
use async_trait::async_trait;
use rand::Rng;

use crate::engine::agent_trait::{Agent, AgentContext, AgentConfig};
use crate::engine::message_bus::{BusMessage, Message, MessageBus, MessageType};
use std::sync::Arc;
use tokio::sync::RwLock;
use crate::agents::feedback_loop::{AgentPerformance, MutationRecord};

/// Maximum number of mutations to track
const MAX_MUTATIONS: usize = 100;

/// Maximum number of agent generations to track
const MAX_GENERATIONS: usize = 10;

/// God kernel state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GodKernelState {
    /// Whether the agent is active
    pub active: bool,

    /// Current evolution generation
    pub current_generation: usize,

    /// Number of agents created
    pub agents_created: usize,

    /// Number of agents killed
    pub agents_killed: usize,

    /// Number of mutations performed
    pub mutations_performed: usize,

    /// Number of active agents
    pub active_agents: usize,

    /// System evolution score (0-100)
    pub evolution_score: f64,

    /// System health score (0-100)
    pub health_score: f64,

    /// System diversity score (0-100)
    pub diversity_score: f64,

    /// Last evolution time
    pub last_evolution: DateTime<Utc>,
}

/// Agent metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentMetadata {
    /// Agent name
    pub name: String,

    /// Agent type
    pub agent_type: String,

    /// Agent generation
    pub generation: usize,

    /// Parent agent (if mutated)
    pub parent: Option<String>,

    /// Creation time
    pub creation_time: DateTime<Utc>,

    /// Last active time
    pub last_active: DateTime<Utc>,

    /// Performance score
    pub performance_score: f64,

    /// Health score
    pub health_score: f64,

    /// Mutation count
    pub mutation_count: usize,

    /// Parameters
    pub parameters: HashMap<String, f64>,

    /// Tags
    pub tags: Vec<String>,

    /// Is active
    pub active: bool,
}

/// Evolution event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EvolutionEvent {
    /// Event ID
    pub id: String,

    /// Event timestamp
    pub timestamp: DateTime<Utc>,

    /// Event type
    pub event_type: EvolutionEventType,

    /// Affected agent
    pub agent: String,

    /// Event description
    pub description: String,

    /// Event data
    pub data: serde_json::Value,
}

/// Evolution event type
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum EvolutionEventType {
    /// Agent created
    AgentCreated,

    /// Agent killed
    AgentKilled,

    /// Agent mutated
    AgentMutated,

    /// Agent promoted
    AgentPromoted,

    /// Agent demoted
    AgentDemoted,

    /// System evolved
    SystemEvolved,
}

/// God Kernel configuration
#[derive(Debug, Clone)]
pub struct GodKernelConfig {
    /// Evolution interval in seconds
    pub evolution_interval: u64,

    /// Mutation probability
    pub mutation_probability: f64,

    /// Kill threshold
    pub kill_threshold: f64,

    /// Promotion threshold
    pub promotion_threshold: f64,
}

impl Default for GodKernelConfig {
    fn default() -> Self {
        Self {
            evolution_interval: 3600, // 1 hour
            mutation_probability: 0.1, // 10% chance
            kill_threshold: -0.5, // Kill agents with performance below -50%
            promotion_threshold: 0.7, // Promote agents with performance above 70%
        }
    }
}

/// God Kernel Agent
pub struct GodKernel {
    /// Configuration
    config: GodKernelConfig,

    /// Message bus
    message_bus: Arc<MessageBus>,

    /// Agent state
    state: GodKernelState,

    /// Agent metadata
    agent_metadata: HashMap<String, AgentMetadata>,

    /// Evolution events
    evolution_events: VecDeque<EvolutionEvent>,

    /// Mutation history
    mutations: VecDeque<MutationRecord>,

    /// Running flag
    running: bool,
}

impl GodKernel {
    /// Create a new god kernel
    pub fn new(config: GodKernelConfig, message_bus: Arc<MessageBus>) -> Self {
        Self {
            config,
            message_bus,
            state: GodKernelState {
                active: true,
                current_generation: 1,
                agents_created: 0,
                agents_killed: 0,
                mutations_performed: 0,
                active_agents: 0,
                evolution_score: 50.0,
                health_score: 100.0,
                diversity_score: 50.0,
                last_evolution: Utc::now(),
            },
            agent_metadata: HashMap::new(),
            evolution_events: VecDeque::with_capacity(MAX_MUTATIONS),
            mutations: VecDeque::with_capacity(MAX_MUTATIONS),
            running: false,
        }
    }

    /// Register a new agent
    pub fn register_agent(&mut self, name: &str, agent_type: &str, parameters: HashMap<String, f64>, tags: Vec<String>) -> Result<AgentMetadata> {
        // Create agent metadata
        let metadata = AgentMetadata {
            name: name.to_string(),
            agent_type: agent_type.to_string(),
            generation: self.state.current_generation,
            parent: None,
            creation_time: Utc::now(),
            last_active: Utc::now(),
            performance_score: 0.0,
            health_score: 100.0,
            mutation_count: 0,
            parameters,
            tags,
            active: true,
        };

        // Add to metadata
        self.agent_metadata.insert(name.to_string(), metadata.clone());

        // Update state
        self.state.agents_created += 1;
        self.state.active_agents += 1;

        // Create evolution event
        self.record_evolution_event(
            EvolutionEventType::AgentCreated,
            name,
            "Agent created",
            serde_json::json!({
                "agent_type": agent_type,
                "generation": self.state.current_generation,
            }),
        );

        Ok(metadata)
    }

    /// Update agent performance
    pub fn update_agent_performance(&mut self, name: &str, performance: &AgentPerformance) -> Result<Vec<Message>> {
        let mut messages = Vec::new();
        let mut should_kill = false;
        let mut kill_score = 0.0;
        let kill_threshold = self.config.kill_threshold;

        // First check if we need to kill the agent
        {
            // Find agent metadata
            if let Some(metadata) = self.agent_metadata.get_mut(name) {
                // Update metadata
                metadata.performance_score = performance.score;
                metadata.last_active = Utc::now();

                // Check for kill threshold
                if performance.score <= kill_threshold && metadata.active {
                    // Kill agent
                    metadata.active = false;

                    // Update state
                    self.state.agents_killed += 1;
                    self.state.active_agents -= 1;

                    // Set flag for later processing
                    should_kill = true;
                    kill_score = performance.score;
                }
            }
        }

        // Now handle the kill event if needed
        if should_kill {
            // Create evolution event
            self.record_evolution_event(
                EvolutionEventType::AgentKilled,
                name,
                "Agent killed due to poor performance",
                serde_json::json!({
                    "performance_score": kill_score,
                    "kill_threshold": kill_threshold,
                }),
            );

            // Create kill message
            let message = Message::Custom(
                "agent_killed".to_string(),
                serde_json::json!({
                    "agent_name": name,
                    "reason": "Performance below threshold",
                    "score": kill_score,
                    "threshold": kill_threshold,
                }),
            );

            messages.push(message);

            info!("Agent killed: {} - Performance score: {:.2}", name, kill_score);
        }

        // Check for promotion threshold
        let mut should_promote = false;
        let promotion_threshold = self.config.promotion_threshold;

        {
            if let Some(metadata) = self.agent_metadata.get_mut(name) {
                if performance.score >= promotion_threshold && metadata.active {
                    should_promote = true;
                }
            }
        }

        // Handle promotion if needed
        if should_promote {
            // Create evolution event
            self.record_evolution_event(
                EvolutionEventType::AgentPromoted,
                name,
                "Agent promoted due to excellent performance",
                serde_json::json!({
                    "performance_score": performance.score,
                    "promotion_threshold": promotion_threshold,
                }),
            );

            // Create promotion message
            let message = Message::Custom(
                "agent_promoted".to_string(),
                serde_json::json!({
                    "agent_name": name,
                    "reason": "Performance above threshold",
                    "score": performance.score,
                    "threshold": promotion_threshold,
                }),
            );

            messages.push(message);

            info!("Agent promoted: {} - Performance score: {:.2}", name, performance.score);
        }

        // Check for mutation
        let mut should_mutate = false;
        let mutation_probability = self.config.mutation_probability;

        {
            let mut rng = rand::thread_rng();
            if let Some(metadata) = self.agent_metadata.get_mut(name) {
                if metadata.active && rng.gen::<f64>() < mutation_probability {
                    should_mutate = true;
                }
            }
        }

        // Handle mutation if needed
        if should_mutate {
            // Create mutation
            let mutation_result = self.mutate_agent(name)?;

            if let Some(message) = mutation_result {
                messages.push(message);
            }
        }
        Ok(messages)
    }

    /// Mutate an agent
    fn mutate_agent(&mut self, name: &str) -> Result<Option<Message>> {
        // First get the metadata and clone what we need
        let mut mutation_data = None;

        if let Some(metadata) = self.agent_metadata.get(name) {
            // Create mutated parameters
            let mut mutated_params = metadata.parameters.clone();

            // Mutate parameters
            let mut rng = rand::thread_rng();
            for (_, value) in mutated_params.iter_mut() {
                // Apply random mutation
                let mutation_factor = 0.1; // 10% mutation
                let mutation = (rng.gen::<f64>() - 0.5) * 2.0 * mutation_factor;
                *value *= 1.0 + mutation;
            }

            // Create mutated agent name
            let mutated_name = format!("{}-mutated-{}", name, self.state.mutations_performed + 1);

            // Create mutated agent metadata
            let mutated_metadata = AgentMetadata {
                name: mutated_name.clone(),
                agent_type: metadata.agent_type.clone(),
                generation: self.state.current_generation + 1,
                parent: Some(name.to_string()),
                creation_time: Utc::now(),
                last_active: Utc::now(),
                performance_score: 0.0,
                health_score: 100.0,
                mutation_count: 0,
                parameters: mutated_params.clone(),
                tags: metadata.tags.clone(),
                active: true,
            };

            mutation_data = Some((mutated_name, mutated_metadata));
        }

        // Now update the metadata
        if let Some((mutated_name, mutated_metadata)) = mutation_data {
            // Add to metadata
            self.agent_metadata.insert(mutated_name.clone(), mutated_metadata);

            // Update original agent
            if let Some(metadata) = self.agent_metadata.get_mut(name) {
                metadata.mutation_count += 1;
            }

            // Update state
            self.state.agents_created += 1;
            self.state.active_agents += 1;
            self.state.mutations_performed += 1;

            // Get the original metadata for the mutation record
            let original_metadata = self.agent_metadata.get(name);

            if let Some(original_metadata) = original_metadata {
                // Create mutation record
                let mutation_id = format!("mutation-{}-{}", name, Utc::now().timestamp_millis());
                let mutation = MutationRecord {
                    id: mutation_id.clone(),
                    parent_agent: name.to_string(),
                    mutated_agent: mutated_name.clone(),
                    timestamp: Utc::now(),
                    parameters: original_metadata.parameters.clone(),
                    description: format!("Mutation of agent {}", name),
                    performance_before: original_metadata.performance_score,
                    performance_after: None,
                    success: None,
                };

                // Add to mutations
                self.mutations.push_back(mutation);
            }

            // Enforce capacity limit
            if self.mutations.len() > MAX_MUTATIONS {
                self.mutations.pop_front();
            }

            // Create evolution event
            self.record_evolution_event(
                EvolutionEventType::AgentMutated,
                name,
                &format!("Agent mutated to create {}", mutated_name),
                serde_json::json!({
                    "mutated_agent": mutated_name,
                }),
            );

            // Create mutation message
            let message = Message::Custom(
                "agent_mutated".to_string(),
                serde_json::json!({
                    "parent_agent": name,
                    "mutated_agent": mutated_name,
                    "timestamp": Utc::now(),
                }),
            );

            info!("Agent mutated: {} -> {}", name, mutated_name);

            return Ok(Some(message));
        }

        Ok(None)
    }

    /// Evolve the system
    pub async fn evolve_system(&mut self) -> Result<()> {
        let mut messages = Vec::new();

        // Check if it's time to evolve
        let now = Utc::now();
        let time_since_last_evolution = (now - self.state.last_evolution).num_seconds() as u64;

        if time_since_last_evolution < self.config.evolution_interval {
            return Ok(());
        }

        info!("Evolving system - Generation {}", self.state.current_generation);

        // Increment generation
        self.state.current_generation += 1;

        // Calculate system scores
        self.calculate_system_scores();

        // Prune old generations
        self.prune_old_generations();

        // Create evolution event
        self.record_evolution_event(
            EvolutionEventType::SystemEvolved,
            "system",
            &format!("System evolved to generation {}", self.state.current_generation),
            serde_json::json!({
                "generation": self.state.current_generation,
                "evolution_score": self.state.evolution_score,
                "health_score": self.state.health_score,
                "diversity_score": self.state.diversity_score,
            }),
        );

        // Create evolution message
        let message = Message::Custom(
            "system_evolved".to_string(),
            serde_json::json!({
                "generation": self.state.current_generation,
                "evolution_score": self.state.evolution_score,
                "health_score": self.state.health_score,
                "diversity_score": self.state.diversity_score,
                "timestamp": now,
            }),
        );

        messages.push(message);

        // Update last evolution time
        self.state.last_evolution = now;

        // Send evolution complete message
        let message = BusMessage {
            message_type: MessageType::SystemUpdate,
            content: "system_evolved".to_string(),
            timestamp: chrono::Utc::now(),
        };

        self.message_bus.publish(message).await;

        Ok(())
    }

    /// Calculate system scores
    fn calculate_system_scores(&mut self) {
        // Calculate evolution score
        let mut total_score = 0.0;
        let mut agent_count = 0;

        for metadata in self.agent_metadata.values() {
            if metadata.active {
                total_score += metadata.performance_score;
                agent_count += 1;
            }
        }

        if agent_count > 0 {
            let avg_score = total_score / agent_count as f64;
            self.state.evolution_score = (avg_score + 1.0) * 50.0; // Convert -1..1 to 0..100
        }

        // Calculate health score
        let active_ratio = if self.state.agents_created > 0 {
            self.state.active_agents as f64 / self.state.agents_created as f64
        } else {
            1.0
        };

        self.state.health_score = active_ratio * 100.0;

        // Calculate diversity score
        let mut agent_types = std::collections::HashSet::new();
        for metadata in self.agent_metadata.values() {
            if metadata.active {
                agent_types.insert(metadata.agent_type.clone());
            }
        }

        let type_ratio = if self.state.active_agents > 0 {
            agent_types.len() as f64 / self.state.active_agents as f64
        } else {
            0.0
        };

        self.state.diversity_score = type_ratio * 100.0;
    }

    /// Prune old generations
    fn prune_old_generations(&mut self) {
        // Only keep the last MAX_GENERATIONS generations
        if self.state.current_generation > MAX_GENERATIONS {
            let cutoff_generation = self.state.current_generation - MAX_GENERATIONS;

            // Find agents to remove
            let agents_to_remove: Vec<String> = self.agent_metadata.iter()
                .filter(|(_, metadata)| metadata.generation <= cutoff_generation && !metadata.active)
                .map(|(name, _)| name.clone())
                .collect();

            // Remove agents
            for name in agents_to_remove {
                self.agent_metadata.remove(&name);
            }
        }
    }

    /// Record an evolution event
    fn record_evolution_event(&mut self, event_type: EvolutionEventType, agent: &str, description: &str, data: serde_json::Value) {
        let event = EvolutionEvent {
            id: format!("event-{}-{}", agent, Utc::now().timestamp_millis()),
            timestamp: Utc::now(),
            event_type,
            agent: agent.to_string(),
            description: description.to_string(),
            data,
        };

        self.evolution_events.push_back(event);

        // Enforce capacity limit
        if self.evolution_events.len() > MAX_MUTATIONS {
            self.evolution_events.pop_front();
        }
    }

    /// Get agent metadata
    pub fn get_agent_metadata(&self, name: &str) -> Option<&AgentMetadata> {
        self.agent_metadata.get(name)
    }

    /// Get all agent metadata
    pub fn get_all_agent_metadata(&self) -> &HashMap<String, AgentMetadata> {
        &self.agent_metadata
    }

    /// Get active agents
    pub fn get_active_agents(&self) -> Vec<&AgentMetadata> {
        self.agent_metadata.values().filter(|m| m.active).collect()
    }

    /// Get evolution events
    pub fn get_evolution_events(&self) -> &VecDeque<EvolutionEvent> {
        &self.evolution_events
    }

    /// Get mutations
    pub fn get_mutations(&self) -> &VecDeque<MutationRecord> {
        &self.mutations
    }

    /// Get state
    pub fn get_state(&self) -> &GodKernelState {
        &self.state
    }

    /// Set evolution interval
    pub fn set_evolution_interval(&mut self, seconds: u64) {
        self.config.evolution_interval = seconds;
    }

    /// Set mutation probability
    pub fn set_mutation_probability(&mut self, probability: f64) {
        self.config.mutation_probability = probability.max(0.0).min(1.0);
    }

    /// Set kill threshold
    pub fn set_kill_threshold(&mut self, threshold: f64) {
        self.config.kill_threshold = threshold;
    }

    /// Set promotion threshold
    pub fn set_promotion_threshold(&mut self, threshold: f64) {
        self.config.promotion_threshold = threshold;
    }
}

#[async_trait]
impl Agent for GodKernel {
    async fn initialize(&mut self, _context: Arc<RwLock<AgentContext>>) -> Result<()> {
        info!("Initializing God Kernel");

        // Send initialization message
        let message = BusMessage {
            message_type: MessageType::AgentInitialized,
            content: "God Kernel initialized".to_string(),
            timestamp: chrono::Utc::now(),
        };

        self.message_bus.publish(message).await;

        Ok(())
    }

    async fn start(&mut self) -> Result<()> {
        info!("Starting God Kernel");

        self.running = true;

        // Send start message
        let message = BusMessage {
            message_type: MessageType::AgentStarted,
            content: "God Kernel started".to_string(),
            timestamp: chrono::Utc::now(),
        };

        self.message_bus.publish(message).await;

        Ok(())
    }

    async fn stop(&mut self) -> Result<()> {
        info!("Stopping God Kernel");

        self.running = false;

        // Send stop message
        let message = BusMessage {
            message_type: MessageType::AgentStopped,
            content: "God Kernel stopped".to_string(),
            timestamp: chrono::Utc::now(),
        };

        self.message_bus.publish(message).await;

        Ok(())
    }

    async fn update(&mut self) -> Result<()> {
        if !self.running {
            return Ok(());
        }

        debug!("Updating God Kernel");

        // Evolve the system
        self.evolve_system().await?;

        Ok(())
    }

    async fn handle_message(&mut self, message: BusMessage) -> Result<()> {
        match message.message_type {
            MessageType::AgentPerformance => {
                // Process agent performance update
                info!("Received agent performance message: {}", message.content);
            },
            _ => {
                // Ignore other message types
            }
        }

        Ok(())
    }

    fn get_name(&self) -> &str {
        "GodKernel"
    }

    fn get_config(&self) -> Box<dyn AgentConfig> {
        Box::new(self.config.clone())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_agent_registration_and_evolution() {
        let mut kernel = GodKernel::new();

        // Register an agent
        let params = HashMap::new();
        let tags = vec!["test".to_string()];
        let metadata = kernel.register_agent("test_agent", "test_type", params, tags).unwrap();

        assert_eq!(metadata.name, "test_agent");
        assert_eq!(metadata.generation, 1);
        assert!(metadata.active);

        // Create agent performance
        let performance = AgentPerformance {
            agent_name: "test_agent".to_string(),
            score: 0.9,
            confidence: 0.8,
            trade_count: 10,
            success_rate: 0.8,
            avg_roi_contribution: 2.0,
            last_updated: Utc::now(),
            recent_trades: VecDeque::new(),
            mutation_eligible: true,
            kill_eligible: false,
            consecutive_failures: 0,
        };

        // Update agent performance
        let messages = kernel.update_agent_performance("test_agent", &performance).unwrap();

        // Check for promotion message
        assert!(messages.iter().any(|m| match m {
            Message::Custom(topic, _) => topic == "agent_promoted",
            _ => false,
        }));

        // Check agent metadata
        let updated_metadata = kernel.get_agent_metadata("test_agent").unwrap();
        assert_eq!(updated_metadata.performance_score, 0.9);
    }

    #[test]
    fn test_agent_mutation() {
        let mut kernel = GodKernel::new();

        // Register an agent
        let mut params = HashMap::new();
        params.insert("threshold".to_string(), 0.5);

        let tags = vec!["test".to_string()];
        kernel.register_agent("test_agent", "test_type", params, tags).unwrap();

        // Force mutation by setting probability to 1.0
        kernel.set_mutation_probability(1.0);

        // Create agent performance
        let performance = AgentPerformance {
            agent_name: "test_agent".to_string(),
            score: 0.5,
            confidence: 0.8,
            trade_count: 10,
            success_rate: 0.8,
            avg_roi_contribution: 2.0,
            last_updated: Utc::now(),
            recent_trades: VecDeque::new(),
            mutation_eligible: true,
            kill_eligible: false,
            consecutive_failures: 0,
        };

        // Update agent performance (should trigger mutation)
        let messages = kernel.update_agent_performance("test_agent", &performance).unwrap();

        // Check for mutation message
        assert!(messages.iter().any(|m| match m {
            Message::Custom(topic, _) => topic == "agent_mutated",
            _ => false,
        }));

        // Check that a mutated agent was created
        let mutated_agents: Vec<&AgentMetadata> = kernel.agent_metadata.values()
            .filter(|m| m.parent.is_some())
            .collect();

        assert_eq!(mutated_agents.len(), 1);
        assert_eq!(mutated_agents[0].parent.as_ref().unwrap(), "test_agent");
    }
}
