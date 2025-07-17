//! Capital Management Module
//!
//! This module provides precise capital allocation and management for the OMNI trading system.
//! Enhanced for Phase 2 with exact 12 USDT constraint and mathematical precision.

pub mod precision_allocator;
pub mod manager;
pub mod validation_test;
pub mod enhanced_capital_test;

pub use precision_allocator::{
    PreciseCapitalTracker,
    CapitalAllocation,
    PositionAllocation,
    AllocationValidation,
    CapitalAllocationReport
};
pub use manager::{
    CapitalManager,
    CapitalStatus,
    EnhancedCapitalStatus,
    HftPerformanceReport,
    CapitalUsage,
    CapitalOperation,
    EnhancedPosition,
    PositionStatus,
    CapitalAllocationMetrics,
    PositionSummary,
    TOTAL_CAPITAL_USDT,
    ACTIVE_TRADING_CAPITAL_USDT,
    SAFETY_BUFFER_USDT,
    POSITION_SIZE_USDT,
    MAX_CONCURRENT_POSITIONS,
    MIN_PROFIT_TARGET_USDT
};
pub use validation_test::{
    test_capital_constraint_precision,
    test_hft_capital_management,
    test_capital_edge_cases,
    run_all_capital_tests
};
