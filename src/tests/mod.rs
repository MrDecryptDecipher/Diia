//! Test Module
//!
//! This module contains comprehensive tests for the OMNI trading system.

pub mod integration_test;

pub use integration_test::{
    IntegrationTestRunner, IntegrationTestConfig, IntegrationTestResults,
    CapitalValidation, PerformanceMetrics
};
