//! Performance Optimization Module for OMNI Trading System
//!
//! This module provides performance optimization, caching, memory management,
//! and connection pooling capabilities.

pub mod async_optimizer;
pub mod cache_manager;
pub mod memory_manager;
pub mod connection_pool;

pub use async_optimizer::*;
pub use cache_manager::*;
pub use memory_manager::*;
pub use connection_pool::*;
