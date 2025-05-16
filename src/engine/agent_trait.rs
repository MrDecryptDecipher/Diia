//! Agent Trait
//!
//! This module defines the Agent trait, which is the base trait for all agents
//! in the OMNI-ALPHA system.

use std::sync::Arc;
use tokio::sync::RwLock;
use async_trait::async_trait;
use anyhow::Result;
use serde::{Serialize, Deserialize};

use crate::engine::message_bus::BusMessage;

/// Agent context
#[derive(Debug, Clone, Default)]
pub struct AgentContext {
    /// Global state
    pub global_state: std::collections::HashMap<String, String>,
}

impl AgentContext {
    /// Create a new agent context
    pub fn new() -> Self {
        Self {
            global_state: std::collections::HashMap::new(),
        }
    }
}

/// Agent configuration trait
pub trait AgentConfig: std::fmt::Debug + Send + Sync {}

impl<T: std::fmt::Debug + Send + Sync> AgentConfig for T {}

/// Agent trait
#[async_trait]
pub trait Agent: Send + Sync {
    /// Initialize the agent
    async fn initialize(&mut self, context: Arc<RwLock<AgentContext>>) -> Result<()>;

    /// Start the agent
    async fn start(&mut self) -> Result<()>;

    /// Stop the agent
    async fn stop(&mut self) -> Result<()>;

    /// Update the agent
    async fn update(&mut self) -> Result<()>;

    /// Handle a message
    async fn handle_message(&mut self, message: BusMessage) -> Result<()>;

    /// Get the agent name
    fn get_name(&self) -> &str;

    /// Get the agent configuration
    fn get_config(&self) -> Box<dyn AgentConfig>;
}
