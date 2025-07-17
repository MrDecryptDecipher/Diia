//! Capital Management Module for OMNI Trading System
//!
//! This module provides capital management, position sizing, and risk
//! management capabilities for the trading system.

pub mod manager;
pub mod position_sizing;
pub mod risk_calculator;

pub use manager::*;
pub use position_sizing::*;
pub use risk_calculator::*;
