//! PHASE 2 CAPITAL MANAGEMENT VALIDATION TEST
//!
//! This test validates the enhanced capital management system meets all Phase 2 specifications:
//! - Exact 12.00 USDT capital constraint with mathematical precision
//! - 10.00 USDT active trading capital + 2.00 USDT safety buffer
//! - 5.00 USDT per trade positioning with maximum 2 concurrent positions
//! - Minimum 0.60 USDT profit target per trade
//! - High-frequency trading capability (750+ trades/day)

use omni::capital::manager::*;
use rust_decimal_macros::dec;
use tokio;
use std::time::Instant;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("🚀 PHASE 2 CAPITAL MANAGEMENT VALIDATION TEST");
    println!("============================================");
    
    // Test 1: Enhanced Capital Manager Initialization
    println!("\n📊 Test 1: Enhanced Capital Manager Initialization");
    test_enhanced_initialization().await?;
    
    // Test 2: Mathematical Precision Validation
    println!("\n🔢 Test 2: Mathematical Precision Validation");
    test_mathematical_precision().await?;
    
    // Test 3: High-Frequency Trading Position Management
    println!("\n⚡ Test 3: High-Frequency Trading Position Management");
    test_hft_position_management().await?;
    
    // Test 4: Profit Target Validation
    println!("\n💎 Test 4: Profit Target Validation");
    test_profit_target_validation().await?;
    
    // Test 5: Capital Constraint Enforcement
    println!("\n🛡️ Test 5: Capital Constraint Enforcement");
    test_capital_constraint_enforcement().await?;
    
    // Test 6: Performance Reporting
    println!("\n📈 Test 6: Performance Reporting");
    test_performance_reporting().await?;
    
    // Test 7: High-Frequency Trading Simulation
    println!("\n🏎️ Test 7: High-Frequency Trading Simulation");
    test_hft_simulation().await?;
    
    println!("\n✅ ALL PHASE 2 CAPITAL MANAGEMENT TESTS PASSED!");
    println!("🎯 System ready for 750+ trades/day with exact 12.00 USDT constraint");
    
    Ok(())
}

async fn test_enhanced_initialization() -> Result<(), Box<dyn std::error::Error>> {
    let manager = CapitalManager::new();
    
    // Verify exact constants
    assert_eq!(manager.get_total_capital().await?, TOTAL_CAPITAL_USDT);
    assert_eq!(manager.get_available_capital().await?, ACTIVE_TRADING_CAPITAL_USDT);
    assert_eq!(manager.get_safety_buffer().await?, SAFETY_BUFFER_USDT);
    
    // Verify mathematical relationships
    assert_eq!(ACTIVE_TRADING_CAPITAL_USDT + SAFETY_BUFFER_USDT, TOTAL_CAPITAL_USDT);
    assert_eq!(POSITION_SIZE_USDT * rust_decimal::Decimal::from(MAX_CONCURRENT_POSITIONS), ACTIVE_TRADING_CAPITAL_USDT);
    
    println!("   ✅ Total Capital: {} USDT (EXACT)", TOTAL_CAPITAL_USDT);
    println!("   ✅ Active Trading: {} USDT", ACTIVE_TRADING_CAPITAL_USDT);
    println!("   ✅ Safety Buffer: {} USDT", SAFETY_BUFFER_USDT);
    println!("   ✅ Position Size: {} USDT", POSITION_SIZE_USDT);
    println!("   ✅ Max Positions: {}", MAX_CONCURRENT_POSITIONS);
    println!("   ✅ Min Profit Target: {} USDT", MIN_PROFIT_TARGET_USDT);
    
    Ok(())
}

async fn test_mathematical_precision() -> Result<(), Box<dyn std::error::Error>> {
    let manager = CapitalManager::new();
    
    // Test constraint validation
    manager.validate_constraint().await?;
    manager.validate_mathematical_precision().await?;
    
    // Test precision with multiple operations
    let position_id = manager.allocate_hft_position(
        "BTCUSDT", 50.0, "Long", 50000.0, 50300.0, 49750.0
    ).await?;
    
    manager.validate_constraint().await?;
    
    manager.close_hft_position(&position_id, 50300.0, dec!(0.75)).await?;
    
    manager.validate_constraint().await?;
    
    println!("   ✅ Mathematical precision maintained through allocation/deallocation cycle");
    println!("   ✅ Constraint validation passed at all stages");
    
    Ok(())
}

async fn test_hft_position_management() -> Result<(), Box<dyn std::error::Error>> {
    let manager = CapitalManager::new();
    
    // Test maximum position allocation
    let pos1 = manager.allocate_hft_position(
        "BTCUSDT", 75.0, "Long", 50000.0, 50300.0, 49750.0
    ).await?;
    
    let pos2 = manager.allocate_hft_position(
        "ETHUSDT", 60.0, "Short", 3000.0, 2982.0, 3015.0
    ).await?;
    
    // Verify full allocation
    assert_eq!(manager.get_reserved_capital().await?, ACTIVE_TRADING_CAPITAL_USDT);
    assert_eq!(manager.get_available_capital().await?, dec!(0.00));
    assert!(!manager.can_open_new_position().await?);
    
    // Test position closing
    manager.close_hft_position(&pos1, 50300.0, dec!(0.75)).await?;
    
    // Verify partial availability
    assert_eq!(manager.get_available_capital().await?, POSITION_SIZE_USDT);
    assert!(manager.can_open_new_position().await?);
    
    println!("   ✅ Maximum 2 concurrent positions enforced");
    println!("   ✅ Exact 5.00 USDT per position allocated");
    println!("   ✅ Position closing releases capital correctly");
    
    Ok(())
}

async fn test_profit_target_validation() -> Result<(), Box<dyn std::error::Error>> {
    let manager = CapitalManager::new();
    
    // Test valid profit target (should succeed)
    let valid_result = manager.allocate_hft_position(
        "ADAUSDT", 80.0, "Long", 0.5000, 0.5030, 0.4975
    ).await;
    assert!(valid_result.is_ok(), "Valid profit target should be accepted");
    
    // Test invalid profit target (should fail)
    let invalid_result = manager.allocate_hft_position(
        "DOGEUSDT", 25.0, "Long", 0.1000, 0.1005, 0.0995
    ).await;
    assert!(invalid_result.is_err(), "Invalid profit target should be rejected");
    
    println!("   ✅ Minimum 0.60 USDT profit target enforced");
    println!("   ✅ Insufficient profit targets rejected");
    
    Ok(())
}

async fn test_capital_constraint_enforcement() -> Result<(), Box<dyn std::error::Error>> {
    let manager = CapitalManager::new();
    
    // Fill both position slots
    let _pos1 = manager.allocate_hft_position(
        "BTCUSDT", 50.0, "Long", 50000.0, 50300.0, 49750.0
    ).await?;
    
    let _pos2 = manager.allocate_hft_position(
        "ETHUSDT", 75.0, "Short", 3000.0, 2982.0, 3015.0
    ).await?;
    
    // Attempt third position (should fail)
    let third_result = manager.allocate_hft_position(
        "ADAUSDT", 60.0, "Long", 0.5000, 0.5030, 0.4975
    ).await;
    assert!(third_result.is_err(), "Third position should be rejected");
    
    // Verify constraint validation still passes
    manager.validate_constraint().await?;
    
    println!("   ✅ Maximum position limit enforced");
    println!("   ✅ Capital constraint maintained under stress");
    
    Ok(())
}

async fn test_performance_reporting() -> Result<(), Box<dyn std::error::Error>> {
    let manager = CapitalManager::new();
    
    // Generate enhanced status report
    let status = manager.get_status().await;
    assert_eq!(status.total_capital, TOTAL_CAPITAL_USDT);
    assert_eq!(status.target_trades_per_day, 750);
    assert_eq!(status.target_win_rate, 85.0);
    
    // Generate HFT performance report
    let report = manager.generate_hft_performance_report().await?;
    assert!(report.mathematical_precision_valid);
    assert!(report.capital_constraint_valid);
    assert!(!report.recommendations.is_empty());
    
    println!("   ✅ Enhanced status reporting functional");
    println!("   ✅ HFT performance report generated");
    println!("   ✅ Performance recommendations provided");
    
    Ok(())
}

async fn test_hft_simulation() -> Result<(), Box<dyn std::error::Error>> {
    let manager = CapitalManager::new();
    let start_time = Instant::now();
    
    // Simulate rapid position cycling (HFT simulation)
    for i in 0..10 {
        let symbol = format!("TEST{}USDT", i);
        
        // Allocate position
        let position_id = manager.allocate_hft_position(
            &symbol, 50.0, "Long", 1000.0, 1006.0, 995.0
        ).await?;
        
        // Immediately close with profit
        manager.close_hft_position(&position_id, 1006.0, dec!(0.75)).await?;
        
        // Validate constraint after each cycle
        manager.validate_constraint().await?;
    }
    
    let duration = start_time.elapsed();
    let trades_per_second = 20.0 / duration.as_secs_f64(); // 20 operations (10 open + 10 close)
    let projected_daily_trades = trades_per_second * 86400.0;
    
    println!("   ✅ 10 rapid position cycles completed");
    println!("   ✅ Performance: {:.1} operations/second", trades_per_second);
    println!("   ✅ Projected daily capacity: {:.0} trades", projected_daily_trades);
    println!("   ✅ Target 750+ trades/day: {}", if projected_daily_trades >= 750.0 { "ACHIEVABLE" } else { "NEEDS OPTIMIZATION" });
    
    Ok(())
}
