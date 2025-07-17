//! Monitoring and Performance Management Module
//!
//! This module provides comprehensive monitoring, performance tracking,
//! and system health management for the OMNI-ALPHA VΩ∞∞ trading system.

pub mod performance_monitor;
pub mod unified_error_manager;
pub mod real_time_monitor;
pub mod alerting_system;

pub use performance_monitor::{
    PerformanceMonitor, PerformanceMetrics, PerformanceThresholds,
    PerformanceAlert, AlertType, AlertSeverity, PerformanceSummary
};

pub use unified_error_manager::{
    UnifiedErrorManager, ErrorSeverity, ErrorCategory, ErrorEvent,
    RecoveryAction, SystemHealthStatus
};

pub use real_time_monitor::{
    RealTimeMonitor, MonitoringEvent, SystemMetrics, AlertRule
};
