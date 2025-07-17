//! Enhanced Capital Manager Test Suite
//! 
//! PHASE 2 VALIDATION: Mathematical Precision Capital Management
//! Tests the exact 12.00 USDT constraint with high-frequency trading capabilities

#[cfg(test)]
mod tests {
    use super::super::manager::*;
    use rust_decimal_macros::dec;
    use tokio;

    #[tokio::test]
    async fn test_enhanced_capital_manager_initialization() {
        let manager = CapitalManager::new();
        
        // Verify exact 12.00 USDT constraint
        let total = manager.get_total_capital().await.unwrap();
        assert_eq!(total, dec!(12.00), "Total capital must be exactly 12.00 USDT");
        
        // Verify available capital equals active trading capital initially
        let available = manager.get_available_capital().await.unwrap();
        assert_eq!(available, dec!(10.00), "Available capital must be exactly 10.00 USDT initially");
        
        // Verify safety buffer
        let safety_buffer = manager.get_safety_buffer().await.unwrap();
        assert_eq!(safety_buffer, dec!(2.00), "Safety buffer must be exactly 2.00 USDT");
        
        // Verify can open new position initially
        let can_open = manager.can_open_new_position().await.unwrap();
        assert!(can_open, "Should be able to open new position initially");
        
        println!("✅ Enhanced Capital Manager initialization test passed");
    }

    #[tokio::test]
    async fn test_hft_position_allocation() {
        let manager = CapitalManager::new();
        
        // Test allocating first HFT position
        let position_id = manager.allocate_hft_position(
            "BTCUSDT",
            50.0, // 50x leverage
            "Long",
            50000.0, // entry price
            50300.0, // profit target price (0.6% gain)
            49750.0  // stop loss price
        ).await.unwrap();
        
        assert!(!position_id.is_empty(), "Position ID should be generated");
        
        // Verify capital allocation
        let reserved = manager.get_reserved_capital().await.unwrap();
        assert_eq!(reserved, dec!(5.00), "Should have 5.00 USDT reserved");
        
        let available = manager.get_available_capital().await.unwrap();
        assert_eq!(available, dec!(5.00), "Should have 5.00 USDT available");
        
        // Test allocating second HFT position
        let position_id_2 = manager.allocate_hft_position(
            "ETHUSDT",
            75.0, // 75x leverage
            "Short",
            3000.0, // entry price
            2982.0, // profit target price (0.6% gain)
            3015.0  // stop loss price
        ).await.unwrap();
        
        assert!(!position_id_2.is_empty(), "Second position ID should be generated");
        
        // Verify full capital allocation
        let reserved_final = manager.get_reserved_capital().await.unwrap();
        assert_eq!(reserved_final, dec!(10.00), "Should have 10.00 USDT reserved");
        
        let available_final = manager.get_available_capital().await.unwrap();
        assert_eq!(available_final, dec!(0.00), "Should have 0.00 USDT available");
        
        // Verify cannot open third position
        let can_open = manager.can_open_new_position().await.unwrap();
        assert!(!can_open, "Should not be able to open third position");
        
        println!("✅ HFT position allocation test passed");
    }

    #[tokio::test]
    async fn test_position_closing_and_profit_realization() {
        let manager = CapitalManager::new();
        
        // Allocate position
        let position_id = manager.allocate_hft_position(
            "ADAUSDT",
            60.0,
            "Long",
            0.5000,
            0.5030, // 0.6% profit target
            0.4975
        ).await.unwrap();
        
        // Close position with profit
        let realized_profit = dec!(0.75); // 0.75 USDT profit (above 0.60 target)
        manager.close_hft_position(&position_id, 0.5030, realized_profit).await.unwrap();
        
        // Verify capital released
        let reserved = manager.get_reserved_capital().await.unwrap();
        assert_eq!(reserved, dec!(0.00), "Capital should be released");
        
        let available = manager.get_available_capital().await.unwrap();
        assert_eq!(available, dec!(10.00), "Full capital should be available again");
        
        // Verify can open new position
        let can_open = manager.can_open_new_position().await.unwrap();
        assert!(can_open, "Should be able to open new position after closing");
        
        println!("✅ Position closing and profit realization test passed");
    }

    #[tokio::test]
    async fn test_mathematical_precision_validation() {
        let manager = CapitalManager::new();
        
        // Test constraint validation
        let validation_result = manager.validate_constraint().await;
        assert!(validation_result.is_ok(), "Constraint validation should pass");
        
        // Test mathematical precision validation
        let precision_result = manager.validate_mathematical_precision().await;
        assert!(precision_result.is_ok(), "Mathematical precision validation should pass");
        
        println!("✅ Mathematical precision validation test passed");
    }

    #[tokio::test]
    async fn test_enhanced_status_reporting() {
        let manager = CapitalManager::new();
        
        // Get enhanced status
        let status = manager.get_status().await;
        
        // Verify core metrics
        assert_eq!(status.total_capital, dec!(12.00));
        assert_eq!(status.active_trading_capital, dec!(10.00));
        assert_eq!(status.safety_buffer, dec!(2.00));
        assert_eq!(status.position_size, dec!(5.00));
        assert_eq!(status.max_positions, 2);
        assert_eq!(status.min_profit_target, dec!(0.60));
        assert_eq!(status.target_trades_per_day, 750);
        assert_eq!(status.target_win_rate, 85.0);
        
        // Verify validation flags
        assert!(status.is_mathematically_valid);
        assert!(status.can_open_new_position);
        
        println!("✅ Enhanced status reporting test passed");
    }

    #[tokio::test]
    async fn test_hft_performance_report() {
        let manager = CapitalManager::new();
        
        // Generate performance report
        let report = manager.generate_hft_performance_report().await.unwrap();
        
        // Verify report structure
        assert!(report.mathematical_precision_valid);
        assert!(report.capital_constraint_valid);
        assert!(report.position_allocation_valid);
        assert_eq!(report.trades_per_day_target, 750);
        assert_eq!(report.win_rate_target, 85.0);
        assert_eq!(report.profit_per_trade_target, dec!(0.60));
        
        // Verify recommendations exist
        assert!(!report.recommendations.is_empty());
        
        println!("✅ HFT performance report test passed");
    }

    #[tokio::test]
    async fn test_profit_target_validation() {
        let manager = CapitalManager::new();
        
        // Test position with insufficient profit target (should fail)
        let result = manager.allocate_hft_position(
            "DOGEUSDT",
            25.0,
            "Long",
            0.1000,
            0.1005, // Only 0.5% gain = insufficient profit
            0.0995
        ).await;
        
        assert!(result.is_err(), "Should reject position with insufficient profit target");
        
        println!("✅ Profit target validation test passed");
    }
}
