//! Testing Framework Module for OMNI Trading System
//!
//! This module provides comprehensive testing utilities, mock data generation,
//! and test automation capabilities.

use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use anyhow::Result;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TestType {
    Unit,
    Integration,
    Performance,
    EndToEnd,
    Load,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TestStatus {
    Pending,
    Running,
    Passed,
    Failed,
    Skipped,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestResult {
    pub test_name: String,
    pub test_type: TestType,
    pub status: TestStatus,
    pub duration_ms: u64,
    pub error_message: Option<String>,
    pub assertions_passed: u32,
    pub assertions_failed: u32,
    pub timestamp: u64,
}

impl TestResult {
    pub fn new(test_name: String, test_type: TestType) -> Self {
        Self {
            test_name,
            test_type,
            status: TestStatus::Pending,
            duration_ms: 0,
            error_message: None,
            assertions_passed: 0,
            assertions_failed: 0,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        }
    }

    pub fn mark_passed(&mut self, duration_ms: u64, assertions_passed: u32) {
        self.status = TestStatus::Passed;
        self.duration_ms = duration_ms;
        self.assertions_passed = assertions_passed;
    }

    pub fn mark_failed(&mut self, duration_ms: u64, error_message: String, assertions_failed: u32) {
        self.status = TestStatus::Failed;
        self.duration_ms = duration_ms;
        self.error_message = Some(error_message);
        self.assertions_failed = assertions_failed;
    }

    pub fn mark_skipped(&mut self, reason: String) {
        self.status = TestStatus::Skipped;
        self.error_message = Some(reason);
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestSuite {
    pub name: String,
    pub description: String,
    pub tests: Vec<TestResult>,
    pub setup_duration_ms: u64,
    pub teardown_duration_ms: u64,
    pub total_duration_ms: u64,
}

impl TestSuite {
    pub fn new(name: String, description: String) -> Self {
        Self {
            name,
            description,
            tests: Vec::new(),
            setup_duration_ms: 0,
            teardown_duration_ms: 0,
            total_duration_ms: 0,
        }
    }

    pub fn add_test(&mut self, test: TestResult) {
        self.tests.push(test);
    }

    pub fn get_summary(&self) -> TestSummary {
        let total_tests = self.tests.len();
        let passed = self.tests.iter().filter(|t| matches!(t.status, TestStatus::Passed)).count();
        let failed = self.tests.iter().filter(|t| matches!(t.status, TestStatus::Failed)).count();
        let skipped = self.tests.iter().filter(|t| matches!(t.status, TestStatus::Skipped)).count();
        let running = self.tests.iter().filter(|t| matches!(t.status, TestStatus::Running)).count();

        TestSummary {
            suite_name: self.name.clone(),
            total_tests,
            passed,
            failed,
            skipped,
            running,
            success_rate: if total_tests > 0 { (passed as f64 / total_tests as f64) * 100.0 } else { 0.0 },
            total_duration_ms: self.total_duration_ms,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestSummary {
    pub suite_name: String,
    pub total_tests: usize,
    pub passed: usize,
    pub failed: usize,
    pub skipped: usize,
    pub running: usize,
    pub success_rate: f64,
    pub total_duration_ms: u64,
}

#[derive(Debug, Clone)]
pub struct MockDataGenerator {
    seed: u64,
}

impl MockDataGenerator {
    pub fn new() -> Self {
        Self {
            seed: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        }
    }

    pub fn with_seed(seed: u64) -> Self {
        Self { seed }
    }

    pub fn generate_market_data(&self, symbol: &str, count: usize) -> Vec<MockMarketData> {
        let mut data = Vec::new();
        let mut price = 45000.0; // Starting price
        let mut timestamp = self.seed;

        for i in 0..count {
            // Generate pseudo-random price movement
            let random_factor = ((self.seed + i as u64) as f64 * 0.1).sin();
            let price_change = random_factor * 100.0; // Max 100 unit change
            price += price_change;
            price = price.max(1000.0); // Minimum price

            let volume = 1000.0 + (random_factor.abs() * 5000.0);

            data.push(MockMarketData {
                symbol: symbol.to_string(),
                timestamp,
                price,
                volume,
                high: price + (random_factor.abs() * 50.0),
                low: price - (random_factor.abs() * 50.0),
                open: price - (price_change * 0.5),
                close: price,
            });

            timestamp += 3600; // 1 hour intervals
        }

        data
    }

    pub fn generate_trade_signals(&self, count: usize) -> Vec<MockTradeSignal> {
        let mut signals = Vec::new();
        let symbols = vec!["BTCUSDT", "ETHUSDT", "ADAUSDT", "DOTUSDT"];

        for i in 0..count {
            let symbol_index = i % symbols.len();
            let random_factor = ((self.seed + i as u64) as f64 * 0.1).sin();
            
            signals.push(MockTradeSignal {
                symbol: symbols[symbol_index].to_string(),
                direction: if random_factor > 0.0 { "buy".to_string() } else { "sell".to_string() },
                confidence: (random_factor.abs() * 100.0).min(100.0),
                quantity: 0.1 + (random_factor.abs() * 2.0),
                timestamp: self.seed + (i as u64 * 300), // 5 minute intervals
            });
        }

        signals
    }

    pub fn generate_agent_performance(&self, agent_id: &str) -> MockAgentPerformance {
        let random_factor = ((self.seed + agent_id.len() as u64) as f64 * 0.1).sin();
        
        MockAgentPerformance {
            agent_id: agent_id.to_string(),
            total_trades: (50.0 + random_factor.abs() * 200.0) as u32,
            winning_trades: (25.0 + random_factor.abs() * 100.0) as u32,
            total_profit: random_factor * 1000.0,
            win_rate: 50.0 + (random_factor * 30.0),
            sharpe_ratio: 1.0 + (random_factor * 2.0),
            max_drawdown: random_factor.abs() * 20.0,
        }
    }
}

impl Default for MockDataGenerator {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MockMarketData {
    pub symbol: String,
    pub timestamp: u64,
    pub price: f64,
    pub volume: f64,
    pub high: f64,
    pub low: f64,
    pub open: f64,
    pub close: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MockTradeSignal {
    pub symbol: String,
    pub direction: String,
    pub confidence: f64,
    pub quantity: f64,
    pub timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MockAgentPerformance {
    pub agent_id: String,
    pub total_trades: u32,
    pub winning_trades: u32,
    pub total_profit: f64,
    pub win_rate: f64,
    pub sharpe_ratio: f64,
    pub max_drawdown: f64,
}

#[derive(Debug, Clone)]
pub struct TestRunner {
    suites: Vec<TestSuite>,
    current_suite: Option<TestSuite>,
    config: TestConfig,
}

#[derive(Debug, Clone)]
pub struct TestConfig {
    pub parallel_execution: bool,
    pub timeout_seconds: u64,
    pub retry_count: u32,
    pub verbose_output: bool,
    pub generate_report: bool,
}

impl TestConfig {
    pub fn new() -> Self {
        Self {
            parallel_execution: false,
            timeout_seconds: 300, // 5 minutes
            retry_count: 0,
            verbose_output: true,
            generate_report: true,
        }
    }
}

impl Default for TestConfig {
    fn default() -> Self {
        Self::new()
    }
}

impl TestRunner {
    pub fn new(config: TestConfig) -> Self {
        Self {
            suites: Vec::new(),
            current_suite: None,
            config,
        }
    }

    pub fn start_suite(&mut self, name: String, description: String) {
        if self.config.verbose_output {
            println!("🧪 Starting test suite: {}", name);
        }
        
        self.current_suite = Some(TestSuite::new(name, description));
    }

    pub fn run_test<F>(&mut self, test_name: String, test_type: TestType, test_fn: F) -> Result<()>
    where
        F: FnOnce() -> Result<u32>, // Returns number of assertions passed
    {
        if self.current_suite.is_none() {
            return Err(anyhow::anyhow!("No active test suite"));
        }

        let mut test_result = TestResult::new(test_name.clone(), test_type);
        test_result.status = TestStatus::Running;

        if self.config.verbose_output {
            println!("  ▶️  Running test: {}", test_name);
        }

        let start_time = std::time::Instant::now();
        
        match test_fn() {
            Ok(assertions_passed) => {
                let duration = start_time.elapsed().as_millis() as u64;
                test_result.mark_passed(duration, assertions_passed);
                
                if self.config.verbose_output {
                    println!("  ✅ Test passed: {} ({} ms)", test_name, duration);
                }
            }
            Err(error) => {
                let duration = start_time.elapsed().as_millis() as u64;
                test_result.mark_failed(duration, error.to_string(), 1);
                
                if self.config.verbose_output {
                    println!("  ❌ Test failed: {} - {} ({} ms)", test_name, error, duration);
                }
            }
        }

        if let Some(suite) = &mut self.current_suite {
            suite.add_test(test_result);
        }

        Ok(())
    }

    pub fn finish_suite(&mut self) -> Result<TestSummary> {
        if let Some(suite) = self.current_suite.take() {
            let summary = suite.get_summary();
            
            if self.config.verbose_output {
                println!("📊 Test suite completed: {}", suite.name);
                println!("   Total: {}, Passed: {}, Failed: {}, Success Rate: {:.1}%", 
                    summary.total_tests, summary.passed, summary.failed, summary.success_rate);
            }

            self.suites.push(suite);
            Ok(summary)
        } else {
            Err(anyhow::anyhow!("No active test suite to finish"))
        }
    }

    pub fn get_overall_summary(&self) -> HashMap<String, f64> {
        let mut summary = HashMap::new();
        
        let total_suites = self.suites.len() as f64;
        let total_tests: usize = self.suites.iter().map(|s| s.tests.len()).sum();
        let total_passed: usize = self.suites.iter()
            .flat_map(|s| &s.tests)
            .filter(|t| matches!(t.status, TestStatus::Passed))
            .count();
        let total_failed: usize = self.suites.iter()
            .flat_map(|s| &s.tests)
            .filter(|t| matches!(t.status, TestStatus::Failed))
            .count();

        summary.insert("total_suites".to_string(), total_suites);
        summary.insert("total_tests".to_string(), total_tests as f64);
        summary.insert("total_passed".to_string(), total_passed as f64);
        summary.insert("total_failed".to_string(), total_failed as f64);
        
        if total_tests > 0 {
            summary.insert("overall_success_rate".to_string(), (total_passed as f64 / total_tests as f64) * 100.0);
        } else {
            summary.insert("overall_success_rate".to_string(), 0.0);
        }

        summary
    }

    pub fn generate_report(&self) -> String {
        let mut report = String::new();
        
        report.push_str("# OMNI Trading System Test Report\n\n");
        
        let overall = self.get_overall_summary();
        report.push_str(&format!("## Overall Summary\n"));
        report.push_str(&format!("- Total Test Suites: {}\n", overall.get("total_suites").unwrap_or(&0.0)));
        report.push_str(&format!("- Total Tests: {}\n", overall.get("total_tests").unwrap_or(&0.0)));
        report.push_str(&format!("- Passed: {}\n", overall.get("total_passed").unwrap_or(&0.0)));
        report.push_str(&format!("- Failed: {}\n", overall.get("total_failed").unwrap_or(&0.0)));
        report.push_str(&format!("- Success Rate: {:.1}%\n\n", overall.get("overall_success_rate").unwrap_or(&0.0)));

        for suite in &self.suites {
            let summary = suite.get_summary();
            report.push_str(&format!("## Test Suite: {}\n", suite.name));
            report.push_str(&format!("{}\n\n", suite.description));
            report.push_str(&format!("- Total: {}\n", summary.total_tests));
            report.push_str(&format!("- Passed: {}\n", summary.passed));
            report.push_str(&format!("- Failed: {}\n", summary.failed));
            report.push_str(&format!("- Success Rate: {:.1}%\n", summary.success_rate));
            report.push_str(&format!("- Duration: {} ms\n\n", summary.total_duration_ms));

            if summary.failed > 0 {
                report.push_str("### Failed Tests:\n");
                for test in &suite.tests {
                    if matches!(test.status, TestStatus::Failed) {
                        report.push_str(&format!("- {}: {}\n", 
                            test.test_name, 
                            test.error_message.as_ref().unwrap_or(&"Unknown error".to_string())
                        ));
                    }
                }
                report.push_str("\n");
            }
        }

        report
    }
}

/// Utility functions for testing
pub mod test_utils {
    use super::*;

    pub fn assert_eq<T: PartialEq + std::fmt::Debug>(actual: T, expected: T, message: &str) -> Result<()> {
        if actual == expected {
            Ok(())
        } else {
            Err(anyhow::anyhow!("{}: expected {:?}, got {:?}", message, expected, actual))
        }
    }

    pub fn assert_true(condition: bool, message: &str) -> Result<()> {
        if condition {
            Ok(())
        } else {
            Err(anyhow::anyhow!("{}: condition was false", message))
        }
    }

    pub fn assert_false(condition: bool, message: &str) -> Result<()> {
        if !condition {
            Ok(())
        } else {
            Err(anyhow::anyhow!("{}: condition was true", message))
        }
    }

    pub fn assert_near(actual: f64, expected: f64, tolerance: f64, message: &str) -> Result<()> {
        if (actual - expected).abs() <= tolerance {
            Ok(())
        } else {
            Err(anyhow::anyhow!("{}: expected {:.6} ± {:.6}, got {:.6}", message, expected, tolerance, actual))
        }
    }
}
