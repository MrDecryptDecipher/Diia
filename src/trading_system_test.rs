//! Trading System Tests
//!
//! This module contains tests for the OMNI-ALPHA VΩ∞∞ trading system.

#[cfg(test)]
mod tests {
    use super::*;
    use crate::trading_system::{TradingSystem, TradingSystemConfig, TradingMode, ExchangeConfig};
    use crate::engine::message_bus::TradeDirection;
    
    #[tokio::test]
    async fn test_trading_system_initialization() {
        // Create configuration
        let config = TradingSystemConfig {
            initial_capital: 12.0,
            mode: TradingMode::Simulation,
            assets: vec!["BTCUSDT".to_string(), "ETHUSDT".to_string()],
            timeframes: vec![1, 5, 15],
            max_concurrent_trades: 1,
            heartbeat_interval: 1,
            exchange: ExchangeConfig::default(),
        };
        
        // Create trading system
        let mut system = TradingSystem::new(config);
        
        // Start system
        system.start().await.unwrap();
        
        // Check state
        let state = system.get_state();
        assert!(state.running);
        assert_eq!(state.current_capital, 12.0);
        assert_eq!(state.initial_capital, 12.0);
        assert_eq!(state.current_pnl, 0.0);
        assert_eq!(state.current_roi, 0.0);
        assert_eq!(state.active_trades_count, 0);
        assert_eq!(state.completed_trades_count, 0);
        
        // Stop system
        system.stop().await.unwrap();
        
        // Check state
        let state = system.get_state();
        assert!(!state.running);
    }
    
    #[tokio::test]
    async fn test_trading_system_update() {
        // Create configuration
        let config = TradingSystemConfig {
            initial_capital: 12.0,
            mode: TradingMode::Simulation,
            assets: vec!["BTCUSDT".to_string()],
            timeframes: vec![1],
            max_concurrent_trades: 1,
            heartbeat_interval: 1,
            exchange: ExchangeConfig::default(),
        };
        
        // Create trading system
        let mut system = TradingSystem::new(config);
        
        // Start system
        system.start().await.unwrap();
        
        // Update system
        system.update().await.unwrap();
        
        // Check state
        let state = system.get_state();
        assert!(state.running);
        
        // Stop system
        system.stop().await.unwrap();
    }
    
    #[tokio::test]
    async fn test_position_sizing() {
        // Create configuration
        let config = TradingSystemConfig {
            initial_capital: 100.0,
            mode: TradingMode::Simulation,
            assets: vec!["BTCUSDT".to_string()],
            timeframes: vec![1],
            max_concurrent_trades: 1,
            heartbeat_interval: 1,
            exchange: ExchangeConfig::default(),
        };
        
        // Create trading system
        let system = TradingSystem::new(config);
        
        // Calculate position size
        let position_size = system.calculate_position_size("BTCUSDT", 50000.0, 49500.0);
        
        // Check position size
        assert!(position_size > 0.0);
        assert!(position_size <= 0.1); // 10% of capital
    }
    
    #[tokio::test]
    async fn test_trade_execution() {
        // Create configuration
        let config = TradingSystemConfig {
            initial_capital: 100.0,
            mode: TradingMode::Simulation,
            assets: vec!["BTCUSDT".to_string()],
            timeframes: vec![1],
            max_concurrent_trades: 1,
            heartbeat_interval: 1,
            exchange: ExchangeConfig::default(),
        };
        
        // Create trading system
        let mut system = TradingSystem::new(config);
        
        // Start system
        system.start().await.unwrap();
        
        // Execute trade
        system.execute_trade(
            "BTCUSDT",
            TradeDirection::Long,
            50000.0,
            49500.0,
            51000.0,
            "test",
        ).await.unwrap();
        
        // Check active trades
        let active_trades = system.get_active_trades();
        assert_eq!(active_trades.len(), 1);
        assert_eq!(active_trades[0].symbol, "BTCUSDT");
        assert_eq!(active_trades[0].direction, TradeDirection::Long);
        assert_eq!(active_trades[0].entry_price, 50000.0);
        
        // Stop system
        system.stop().await.unwrap();
    }
    
    #[tokio::test]
    async fn test_trade_closing() {
        // Create configuration
        let config = TradingSystemConfig {
            initial_capital: 100.0,
            mode: TradingMode::Simulation,
            assets: vec!["BTCUSDT".to_string()],
            timeframes: vec![1],
            max_concurrent_trades: 1,
            heartbeat_interval: 1,
            exchange: ExchangeConfig::default(),
        };
        
        // Create trading system
        let mut system = TradingSystem::new(config);
        
        // Start system
        system.start().await.unwrap();
        
        // Execute trade
        system.execute_trade(
            "BTCUSDT",
            TradeDirection::Long,
            50000.0,
            49500.0,
            51000.0,
            "test",
        ).await.unwrap();
        
        // Get trade ID
        let active_trades = system.get_active_trades();
        let trade_id = active_trades[0].id.clone();
        
        // Close trade
        system.close_trade(&trade_id, 51000.0).await.unwrap();
        
        // Check active trades
        let active_trades = system.get_active_trades();
        assert_eq!(active_trades.len(), 0);
        
        // Check trade history
        let trade_history = system.get_trade_history();
        assert_eq!(trade_history.len(), 1);
        assert_eq!(trade_history[0].symbol, "BTCUSDT");
        assert_eq!(trade_history[0].entry_price, 50000.0);
        assert_eq!(trade_history[0].exit_price.unwrap(), 51000.0);
        
        // Check realized PnL
        let realized_pnl = trade_history[0].realized_pnl.unwrap();
        assert!(realized_pnl > 0.0);
        
        // Check capital
        let capital = system.get_capital();
        assert!(capital > 100.0);
        
        // Stop system
        system.stop().await.unwrap();
    }
}
