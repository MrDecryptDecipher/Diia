//! Exchange Module
//!
//! This module provides exchange adapters for the OMNI-ALPHA VΩ∞∞ platform.

pub mod bybit;
pub mod position;
pub mod types;
pub mod asset_discovery;
pub mod asset_scanner;

// Re-export key types
pub use bybit::adapter::BybitAdapter;
pub use bybit::types::{OrderSide, OrderType, TimeInForce, OrderStatus, PositionMode};
pub use position::Position;
pub use types::Candle;
pub use asset_scanner::{AssetScanner, TradingOpportunity, AssetMetadata};
