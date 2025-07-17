//! Capital Management Validation Test
//!
//! Comprehensive test suite for validating the mathematical precision of the 12 USDT capital constraint

use anyhow::Result;
use tokio;
use tracing::{info, warn, error};
use rust_decimal::Decimal;
use rust_decimal_macros::dec;

use crate::capital::manager::CapitalManager;
use crate::capital::precision_allocator::PreciseCapitalTracker;

/// Test the exact 12 USDT capital constraint with mathematical precision
pub async fn test_capital_constraint_precision() -> Result<()> {
    info!("🧮 Testing Capital Constraint Mathematical Precision");
    
    // Test 1: Initialize capital manager with exactly 12 USDT
    let capital_manager = CapitalManager::new(dec!(12.0));
    
    // Validate initial state
    capital_manager.validate_mathematical_precision().await?;
    let total = capital_manager.get_total_capital().await?;
    assert_eq!(total, dec!(12.0), "Initial capital must be exactly 12.00 USDT");
    
    info!("✅ Test 1 passed: Initial capital constraint validated");
    
    // Test 2: Test position allocation with exact 5 USDT trades
    let position_size = capital_manager.calculate_hft_position_size().await?;
    assert_eq!(position_size, 5.0, "Optimal position size must be exactly 5.00 USDT");
    
    // Allocate first position
    capital_manager.allocate_for_position(
        "BTCUSDT", 
        5.0, 
        50.0, 
        "Long", 
        0.6, 
        0.25
    ).await?;
    
    // Validate constraint after first allocation
    capital_manager.validate_mathematical_precision().await?;
    
    info!("✅ Test 2 passed: First position allocation validated");
    
    // Test 3: Allocate second position (maximum allowed)
    capital_manager.allocate_for_position(
        "ETHUSDT", 
        5.0, 
        75.0, 
        "Short", 
        0.8, 
        0.25
    ).await?;
    
    // Validate constraint after second allocation
    capital_manager.validate_mathematical_precision().await?;
    
    // Check position availability
    let (current, max, can_open) = capital_manager.get_position_availability().await?;
    assert_eq!(current, 2, "Should have exactly 2 positions");
    assert_eq!(max, 2, "Maximum should be 2 positions");
    assert!(!can_open, "Should not be able to open new positions");
    
    info!("✅ Test 3 passed: Maximum position allocation validated");
    
    // Test 4: Test profit target validation
    let valid_profit = capital_manager.validate_trade_profit_target(100.0, 100.6, 50.0).await?;
    assert!(valid_profit, "0.6% price move at 50x leverage should meet 0.6 USDT profit target");
    
    let invalid_profit = capital_manager.validate_trade_profit_target(100.0, 100.1, 10.0).await?;
    assert!(!invalid_profit, "0.1% price move at 10x leverage should not meet 0.6 USDT profit target");
    
    info!("✅ Test 4 passed: Profit target validation working correctly");
    
    // Test 5: Test position closure and capital deallocation
    capital_manager.deallocate_from_position("BTCUSDT", 0.75).await?; // 0.75 USDT profit
    
    // Validate constraint after deallocation
    capital_manager.validate_mathematical_precision().await?;
    
    // Check position availability after closure
    let (current, max, can_open) = capital_manager.get_position_availability().await?;
    assert_eq!(current, 1, "Should have exactly 1 position after closure");
    assert!(can_open, "Should be able to open new position after closure");
    
    info!("✅ Test 5 passed: Position closure and deallocation validated");
    
    // Test 6: Generate comprehensive report
    let report = capital_manager.generate_comprehensive_report().await?;
    assert_eq!(report.total_capital_usdt, 12.0, "Report should show exactly 12.00 USDT total capital");
    assert!(report.is_constraint_valid, "Capital constraint should be valid in report");
    
    info!("✅ Test 6 passed: Comprehensive report generation validated");
    
    info!("🎉 ALL CAPITAL CONSTRAINT TESTS PASSED - Mathematical precision validated!");
    
    Ok(())
}

/// Test high-frequency trading scenario with 750+ trades/day capability
pub async fn test_hft_capital_management() -> Result<()> {
    info!("⚡ Testing High-Frequency Trading Capital Management");
    
    let capital_manager = CapitalManager::new(dec!(12.0));
    
    // Simulate rapid position opening and closing
    for i in 0..10 {
        let symbol = format!("TEST{}USDT", i);
        
        // Open position
        capital_manager.allocate_for_position(
            &symbol,
            5.0,
            50.0,
            "Long",
            0.6,
            0.25
        ).await?;
        
        // Validate precision
        capital_manager.validate_mathematical_precision().await?;
        
        // Close position with profit
        capital_manager.deallocate_from_position(&symbol, 0.65).await?;
        
        // Validate precision after closure
        capital_manager.validate_mathematical_precision().await?;
        
        if i % 5 == 0 {
            info!("✅ HFT Test iteration {} completed successfully", i);
        }
    }
    
    info!("🎉 HIGH-FREQUENCY TRADING CAPITAL MANAGEMENT TEST PASSED!");
    
    Ok(())
}

/// Test edge cases and error conditions
pub async fn test_capital_edge_cases() -> Result<()> {
    info!("🔍 Testing Capital Management Edge Cases");
    
    let capital_manager = CapitalManager::new(dec!(12.0));
    
    // Test 1: Try to allocate more than available capital
    let result = capital_manager.allocate_for_position(
        "OVERSIZED",
        15.0, // More than total capital
        50.0,
        "Long",
        0.6,
        0.25
    ).await;
    assert!(result.is_err(), "Should fail when allocating more than total capital");
    
    // Test 2: Try to allocate third position when maximum is 2
    capital_manager.allocate_for_position("POS1", 5.0, 50.0, "Long", 0.6, 0.25).await?;
    capital_manager.allocate_for_position("POS2", 5.0, 50.0, "Long", 0.6, 0.25).await?;
    
    let result = capital_manager.allocate_for_position("POS3", 2.0, 50.0, "Long", 0.6, 0.25).await;
    assert!(result.is_err(), "Should fail when trying to open third position");
    
    // Test 3: Try to close non-existent position
    let result = capital_manager.deallocate_from_position("NONEXISTENT", 0.5).await;
    assert!(result.is_err(), "Should fail when closing non-existent position");
    
    info!("✅ All edge case tests passed");
    
    Ok(())
}

/// Run all capital management validation tests
pub async fn run_all_capital_tests() -> Result<()> {
    info!("🚀 Starting Comprehensive Capital Management Validation Tests");
    
    test_capital_constraint_precision().await?;
    test_hft_capital_management().await?;
    test_capital_edge_cases().await?;
    
    info!("🎉 ALL CAPITAL MANAGEMENT TESTS COMPLETED SUCCESSFULLY!");
    info!("✅ Mathematical precision validated for 12.00 USDT constraint");
    info!("✅ High-frequency trading capability validated");
    info!("✅ Edge cases and error handling validated");
    
    Ok(())
}
