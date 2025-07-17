//! Execution Module
//!
//! Handles actual trade execution, order management, and position tracking
//! for the OMNI trading system.

pub mod demo_trade_executor;

pub use demo_trade_executor::{
    DemoTradeExecutor, DemoTrade, TradeStatus, Position, TradingStats, 
    ProfitBreakdown, MarketSnapshot
};
