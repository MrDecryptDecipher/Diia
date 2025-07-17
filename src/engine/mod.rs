//! Trading Engine Module for OMNI Trading System
//!
//! This module provides the core trading engine infrastructure including
//! message bus, agent coordination, and system orchestration.

pub mod message_bus;
pub mod agent_trait;
pub mod orchestrator;
pub mod coordinator;

pub use message_bus::*;
pub use agent_trait::*;
pub use orchestrator::*;
pub use coordinator::*;
