//! Performance Optimization Module
//!
//! This module provides comprehensive performance optimization, memory management,
//! and resource monitoring for the OMNI trading system.

pub mod memory_manager;
pub mod cache_manager;
pub mod connection_pool;
pub mod async_optimizer;

pub use memory_manager::{MemoryManager, MemoryPool, PerformanceMetrics, MemoryStats};
pub use cache_manager::{CacheManager, CacheEntry, CacheStats};
pub use connection_pool::{ConnectionPool, PooledConnection};
pub use async_optimizer::{AsyncOptimizer, TaskPriority, OptimizedTask};
