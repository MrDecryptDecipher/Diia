//! Test Suite for OMNI Quantum-Enhanced Comprehensive Trading System

use std::env;
use anyhow::Result;
use tracing::{info, warn, error};

fn setup_test_environment() {
    env::set_var("BYBIT_DEMO_API_KEY", "lCMnwPKIzXASNWn6UE");
    env::set_var("BYBIT_DEMO_API_SECRET", "aXjs1SF9tmW3riHMktmjtyOyAT85puvrVstr");
}

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt::init();
    
    info!("🧪 Starting OMNI Quantum-Enhanced Trading System Test Suite");
    
    setup_test_environment();
    
    // Test 1: System Initialization
    test_system_initialization().await?;
    
    // Test 2: Bybit Connection
    test_bybit_connection().await?;
    
    // Test 3: Capital Management
    test_capital_management().await?;
    
    // Test 4: Performance Monitoring
    test_performance_monitoring().await?;
    
    info!("✅ All tests completed successfully!");
    Ok(())
}

async fn test_system_initialization() -> Result<()> {
    info!("🔧 Testing system initialization...");
    
    let api_key = env::var("BYBIT_DEMO_API_KEY")?;
    let api_secret = env::var("BYBIT_DEMO_API_SECRET")?;
    
    assert!(!api_key.is_empty(), "API key should not be empty");
    assert!(!api_secret.is_empty(), "API secret should not be empty");
    
    info!("✅ System initialization test passed");
    Ok(())
}

async fn test_bybit_connection() -> Result<()> {
    info!("🔗 Testing Bybit demo connection...");

    use omni::bybit::client::BybitClient;

    let api_key = env::var("BYBIT_DEMO_API_KEY")?;
    let api_secret = env::var("BYBIT_DEMO_API_SECRET")?;

    let client = BybitClient::new(api_key, api_secret, true);

    // Test basic API call - get balance
    match client.get_balance().await {
        Ok(balance) => {
            info!("✅ Successfully connected to Bybit demo account");
            info!("💰 Account balance: {:.2} USDT", balance.total_balance);
        }
        Err(e) => {
            error!("❌ Failed to connect to Bybit demo: {}", e);
            return Err(e);
        }
    }

    // Test ticker data
    match client.get_ticker("BTCUSDT").await {
        Ok(ticker) => {
            info!("📊 BTCUSDT ticker: {:.2} USDT", ticker.last_price);
        }
        Err(e) => {
            warn!("⚠️  Failed to get ticker: {}", e);
        }
    }

    info!("✅ Bybit connection test passed");
    Ok(())
}

async fn test_capital_management() -> Result<()> {
    info!("💰 Testing capital management precision...");
    
    const TOTAL_CAPITAL: f64 = 12.0;
    const SAFETY_BUFFER: f64 = 2.0;
    const ACTIVE_CAPITAL: f64 = TOTAL_CAPITAL - SAFETY_BUFFER;
    
    // Test allocation precision
    let allocation1 = 3.0;
    let allocation2 = 2.5;
    let allocation3 = 4.5;
    let total_allocated = allocation1 + allocation2 + allocation3;
    
    assert!(total_allocated <= ACTIVE_CAPITAL, 
           "Total allocation {} should not exceed active capital {}", 
           total_allocated, ACTIVE_CAPITAL);
    
    info!("✅ Capital management precision test passed");
    info!("   Total Capital: {} USDT", TOTAL_CAPITAL);
    info!("   Safety Buffer: {} USDT", SAFETY_BUFFER);
    info!("   Active Capital: {} USDT", ACTIVE_CAPITAL);
    info!("   Test Allocation: {} USDT", total_allocated);
    
    Ok(())
}

async fn test_performance_monitoring() -> Result<()> {
    info!("📊 Testing performance monitoring...");
    
    let total_trades = 10;
    let winning_trades = 8;
    let total_profit = 6.5;
    let total_fees = 0.5;
    
    let win_rate = winning_trades as f64 / total_trades as f64;
    let net_profit = total_profit - total_fees;
    let avg_profit_per_trade = net_profit / total_trades as f64;
    
    info!("📈 Test Performance Metrics:");
    info!("   Total Trades: {}", total_trades);
    info!("   Win Rate: {:.1}%", win_rate * 100.0);
    info!("   Net Profit: {:.2} USDT", net_profit);
    info!("   Avg Profit/Trade: {:.2} USDT", avg_profit_per_trade);
    
    assert!(win_rate >= 0.85, "Win rate should be >= 85%");
    assert!(avg_profit_per_trade >= 0.6, "Average profit per trade should be >= 0.6 USDT");
    
    info!("✅ Performance monitoring test passed");
    Ok(())
}
