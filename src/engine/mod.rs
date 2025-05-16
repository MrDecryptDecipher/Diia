//! Trading Engine Core
//!
//! This module contains the core components of the trading engine,
//! including the agent trait, message bus, and temporal memory.

pub mod agent_trait;
pub mod message_bus;
pub mod temporal_memory;
pub mod state_machine;
pub mod inference_core;
pub mod execution_models;
pub mod entropy_calc;

// Re-export key types
pub use agent_trait::Agent;
pub use message_bus::{Message, TradeDirection};
pub use temporal_memory::{TemporalMemory, TemporalPattern, PatternClassification, PatternMatch, PatternNormalization};
pub use state_machine::{StateMachine, State, Transition, Event};
pub use inference_core::{InferenceCore, InferenceResult, ConfidenceLevel};
pub use execution_models::{ExecutionModel, StopLossType, TakeProfitType, TrailingStopParams};
pub use entropy_calc::{EntropyCalculator, EntropyLevel, VolatilityProfile};
