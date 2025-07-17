//! Bybit API Types
//!
//! Type definitions for Bybit API integration

use serde::{Serialize, Deserialize};
use rust_decimal::Decimal;

/// Order side
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum OrderSide {
    Buy,
    Sell,
}

impl OrderSide {
    pub fn as_str(&self) -> &'static str {
        match self {
            OrderSide::Buy => "Buy",
            OrderSide::Sell => "Sell",
        }
    }
}

/// Order type
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum OrderType {
    Market,
    Limit,
}

impl OrderType {
    pub fn as_str(&self) -> &'static str {
        match self {
            OrderType::Market => "Market",
            OrderType::Limit => "Limit",
        }
    }
}

/// Time in force
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TimeInForce {
    GTC, // Good Till Cancel
    IOC, // Immediate Or Cancel
    FOK, // Fill Or Kill
    PostOnly,
}

impl TimeInForce {
    pub fn as_str(&self) -> &'static str {
        match self {
            TimeInForce::GTC => "GTC",
            TimeInForce::IOC => "IOC",
            TimeInForce::FOK => "FOK",
            TimeInForce::PostOnly => "PostOnly",
        }
    }
}

/// Order response from Bybit
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrderResponse {
    pub order_id: String,
    pub symbol: String,
    pub side: OrderSide,
    pub order_type: OrderType,
    pub quantity: Decimal,
    pub price: Option<Decimal>,
    pub status: String,
}

/// Order status response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrderStatus {
    pub order_id: String,
    pub status: String,
    pub avg_price: Decimal,
    pub cum_exec_qty: Decimal,
    pub cum_exec_fee: Decimal,
}

/// Ticker information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Ticker {
    pub symbol: String,
    pub last_price: Decimal,
    pub volume_24h: Decimal,
    pub price_change_24h: Decimal,
}

/// Orderbook entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrderbookEntry {
    pub price: Decimal,
    pub size: Decimal,
}

/// Orderbook
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Orderbook {
    pub symbol: String,
    pub bids: Vec<OrderbookEntry>,
    pub asks: Vec<OrderbookEntry>,
}

/// Instrument information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstrumentInfo {
    pub symbol: String,
    pub min_order_qty: Decimal,
    pub qty_step: Decimal,
}

/// Account balance
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Balance {
    pub total_balance: Decimal,
    pub available_balance: Decimal,
    pub currency: String,
}
