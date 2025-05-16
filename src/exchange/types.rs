//! Exchange Types
//!
//! This module provides common types for exchange adapters.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// Candle (OHLCV)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Candle {
    /// Timestamp
    pub timestamp: DateTime<Utc>,
    
    /// Open price
    pub open: f64,
    
    /// High price
    pub high: f64,
    
    /// Low price
    pub low: f64,
    
    /// Close price
    pub close: f64,
    
    /// Volume
    pub volume: f64,
}

/// Order side
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum OrderSide {
    /// Buy
    Buy,
    
    /// Sell
    Sell,
}

/// Order type
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum OrderType {
    /// Market order
    Market,
    
    /// Limit order
    Limit,
    
    /// Stop order
    Stop,
    
    /// Stop limit order
    StopLimit,
}

/// Order status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum OrderStatus {
    /// New
    New,
    
    /// Partially filled
    PartiallyFilled,
    
    /// Filled
    Filled,
    
    /// Canceled
    Canceled,
    
    /// Rejected
    Rejected,
}

/// Order
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Order {
    /// Order ID
    pub id: String,
    
    /// Symbol
    pub symbol: String,
    
    /// Side
    pub side: OrderSide,
    
    /// Type
    pub order_type: OrderType,
    
    /// Price
    pub price: Option<f64>,
    
    /// Quantity
    pub quantity: f64,
    
    /// Status
    pub status: OrderStatus,
    
    /// Created at
    pub created_at: DateTime<Utc>,
    
    /// Updated at
    pub updated_at: DateTime<Utc>,
}
