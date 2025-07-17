//! Execution Module for OMNI Trading System
//!
//! This module provides trade execution, order management, and position
//! tracking capabilities.

pub mod order_manager;
pub mod position_tracker;
pub mod risk_calculator;
pub mod executor;

pub use order_manager::*;
pub use position_tracker::*;
pub use risk_calculator::*;
pub use executor::*;
