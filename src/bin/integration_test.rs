//! Comprehensive Integration Test Binary
//!
//! This binary runs a comprehensive end-to-end integration test of the OMNI trading system
//! with real demo account integration and validation.

use std::env;
use std::process;
use anyhow::Result;
use tracing::{info, error, Level};
use tracing_subscriber;

use omni::tests::{IntegrationTestRunner, IntegrationTestConfig};

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize logging
    tracing_subscriber::fmt()
        .with_max_level(Level::INFO)
        .with_target(false)
        .with_thread_ids(true)
        .init();

    info!("🚀 OMNI-ALPHA VΩ∞∞ Comprehensive Integration Test");
    info!("================================================");

    // Parse command line arguments
    let args: Vec<String> = env::args().collect();
    let test_config = parse_test_config(&args);

    info!("📋 Test Configuration:");
    info!("   Duration: {} seconds", test_config.test_duration);
    info!("   Min Asset Discoveries: {}", test_config.min_asset_discoveries);
    info!("   Min Trading Attempts: {}", test_config.min_trading_attempts);
    info!("   Max Error Rate: {:.2}%", test_config.max_error_rate);
    info!("   Capital Tolerance: {:.6} USDT", test_config.capital_tolerance);
    info!("================================================");

    // Create and run integration test
    let mut test_runner = IntegrationTestRunner::new(test_config);
    
    match test_runner.run_comprehensive_test().await {
        Ok(results) => {
            if results.test_passed {
                info!("🎉 INTEGRATION TEST COMPLETED SUCCESSFULLY! ✅");
                process::exit(0);
            } else {
                error!("💥 INTEGRATION TEST FAILED! ❌");
                for reason in &results.failure_reasons {
                    error!("   - {}", reason);
                }
                process::exit(1);
            }
        }
        Err(e) => {
            error!("💥 INTEGRATION TEST ERROR: {}", e);
            process::exit(1);
        }
    }
}

/// Parse test configuration from command line arguments
fn parse_test_config(args: &[String]) -> IntegrationTestConfig {
    let mut config = IntegrationTestConfig::default();
    
    let mut i = 1;
    while i < args.len() {
        match args[i].as_str() {
            "--duration" | "-d" => {
                if i + 1 < args.len() {
                    if let Ok(duration) = args[i + 1].parse::<u64>() {
                        config.test_duration = duration;
                    }
                    i += 2;
                } else {
                    i += 1;
                }
            }
            "--min-assets" | "-a" => {
                if i + 1 < args.len() {
                    if let Ok(min_assets) = args[i + 1].parse::<usize>() {
                        config.min_asset_discoveries = min_assets;
                    }
                    i += 2;
                } else {
                    i += 1;
                }
            }
            "--min-trades" | "-t" => {
                if i + 1 < args.len() {
                    if let Ok(min_trades) = args[i + 1].parse::<usize>() {
                        config.min_trading_attempts = min_trades;
                    }
                    i += 2;
                } else {
                    i += 1;
                }
            }
            "--max-error-rate" | "-e" => {
                if i + 1 < args.len() {
                    if let Ok(max_error_rate) = args[i + 1].parse::<f64>() {
                        config.max_error_rate = max_error_rate;
                    }
                    i += 2;
                } else {
                    i += 1;
                }
            }
            "--capital-tolerance" | "-c" => {
                if i + 1 < args.len() {
                    if let Ok(tolerance) = args[i + 1].parse::<f64>() {
                        config.capital_tolerance = tolerance;
                    }
                    i += 2;
                } else {
                    i += 1;
                }
            }
            "--help" | "-h" => {
                print_help();
                process::exit(0);
            }
            _ => {
                i += 1;
            }
        }
    }
    
    config
}

/// Print help message
fn print_help() {
    println!("OMNI-ALPHA VΩ∞∞ Comprehensive Integration Test");
    println!();
    println!("USAGE:");
    println!("    integration_test [OPTIONS]");
    println!();
    println!("OPTIONS:");
    println!("    -d, --duration <SECONDS>         Test duration in seconds [default: 300]");
    println!("    -a, --min-assets <COUNT>         Minimum asset discoveries required [default: 10]");
    println!("    -t, --min-trades <COUNT>         Minimum trading attempts required [default: 5]");
    println!("    -e, --max-error-rate <PERCENT>   Maximum allowed error rate [default: 50.0]");
    println!("    -c, --capital-tolerance <USDT>   Capital constraint tolerance [default: 0.000001]");
    println!("    -h, --help                       Print this help message");
    println!();
    println!("EXAMPLES:");
    println!("    integration_test --duration 600 --min-assets 20");
    println!("    integration_test -d 180 -a 5 -t 3 -e 30.0");
    println!();
}
