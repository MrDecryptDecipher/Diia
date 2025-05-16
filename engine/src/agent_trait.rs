use async_trait::async_trait;
use anyhow::Result;

use crate::message_bus::Message;

/// The Agent trait defines the interface for all agents in the system.
/// Each agent is responsible for a specific aspect of the trading system
/// and communicates with other agents through the message bus.
#[async_trait]
pub trait Agent: Send + Sync {
    /// Process the agent's logic and return any messages to be sent to other agents.
    /// This is the main entry point for agent execution.
    async fn process(&mut self) -> Result<Vec<Message>>;
    
    /// Get the name of the agent.
    fn name(&self) -> &str;
    
    /// Check if the agent is currently active.
    fn is_active(&self) -> bool;
    
    /// Set the active state of the agent.
    fn set_active(&mut self, active: bool);
}
