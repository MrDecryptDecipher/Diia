//! Deployment and Production Management Module
//!
//! This module provides comprehensive deployment management including
//! production configuration, health monitoring, and system lifecycle management.

pub mod production_manager;
pub mod config_manager;
pub mod health_checker;
pub mod deployment_manager;

pub use production_manager::{
    ProductionManager, ProductionConfig, ApiConfig, TradingConfig,
    MonitoringConfig, SafetyConfig, LoggingConfig, SystemHealth,
    HealthStatus, ComponentHealth
};

pub use config_manager::{
    ConfigManager, ConfigSummary
};
