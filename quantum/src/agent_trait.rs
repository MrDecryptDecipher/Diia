//! Agent Trait
//!
//! This module defines the Agent trait for the OMNI-ALPHA VΩ∞∞ system.

use async_trait::async_trait;
use anyhow::Result;

use crate::message_bus::Message;

/// Agent trait
///
/// This trait defines the interface for all agents in the OMNI-ALPHA VΩ∞∞ system.
#[async_trait]
pub trait Agent: Send + Sync {
    /// Process agent logic
    ///
    /// This method is called periodically to process the agent's logic.
    /// It returns a list of messages to be sent to other agents.
    async fn process(&mut self) -> Result<Vec<Message>>;
    
    /// Get agent name
    ///
    /// This method returns the name of the agent.
    fn name(&self) -> &str;
    
    /// Check if agent is active
    ///
    /// This method returns whether the agent is currently active.
    fn is_active(&self) -> bool;
    
    /// Set agent active state
    ///
    /// This method sets whether the agent is currently active.
    fn set_active(&mut self, active: bool);
}
