//! Bybit Types
//!
//! This module provides Bybit exchange types for the OMNI-ALPHA VΩ∞∞ platform.

use serde::{Deserialize, Deserializer, Serialize};
use std::fmt;

/// Helper function to deserialize string to f64
fn deserialize_string_to_f64<'de, D>(deserializer: D) -> Result<f64, D::Error>
where
    D: Deserializer<'de>,
{
    let s = String::deserialize(deserializer)?;
    s.parse::<f64>().map_err(serde::de::Error::custom)
}

/// Helper function to deserialize optional string to f64
fn deserialize_optional_string_to_f64<'de, D>(deserializer: D) -> Result<Option<f64>, D::Error>
where
    D: Deserializer<'de>,
{
    let s = Option::<String>::deserialize(deserializer)?;
    match s {
        Some(s) if !s.is_empty() => s.parse::<f64>().map(Some).map_err(serde::de::Error::custom),
        _ => Ok(None),
    }
}

/// Order side
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum OrderSide {
    /// Buy order
    Buy,

    /// Sell order
    Sell,
}

impl fmt::Display for OrderSide {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            OrderSide::Buy => write!(f, "Buy"),
            OrderSide::Sell => write!(f, "Sell"),
        }
    }
}

/// Order type
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum OrderType {
    /// Market order
    Market,

    /// Limit order
    Limit,
}

/// Time in force
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum TimeInForce {
    /// Good till canceled
    GoodTillCancel,

    /// Immediate or cancel
    ImmediateOrCancel,

    /// Fill or kill
    FillOrKill,

    /// Post only
    PostOnly,
}

/// Order status
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum OrderStatus {
    /// Created
    Created,

    /// New
    New,

    /// Rejected
    Rejected,

    /// Partially filled
    PartiallyFilled,

    /// Filled
    Filled,

    /// Cancelled
    Cancelled,

    /// Pending cancel
    PendingCancel,
}

/// Position mode
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum PositionMode {
    /// One-way mode
    OneWay,

    /// Hedge mode
    Hedge,
}

/// Market category
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum MarketCategory {
    /// Spot
    Spot,

    /// Linear futures
    Linear,

    /// Inverse futures
    Inverse,

    /// Options
    Option,
}

impl fmt::Display for MarketCategory {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            MarketCategory::Spot => write!(f, "spot"),
            MarketCategory::Linear => write!(f, "linear"),
            MarketCategory::Inverse => write!(f, "inverse"),
            MarketCategory::Option => write!(f, "option"),
        }
    }
}

impl From<&str> for MarketCategory {
    fn from(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "spot" => MarketCategory::Spot,
            "linear" => MarketCategory::Linear,
            "inverse" => MarketCategory::Inverse,
            "option" => MarketCategory::Option,
            _ => MarketCategory::Linear, // Default to linear
        }
    }
}

/// Instrument info
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstrumentInfo {
    /// Symbol
    pub symbol: String,

    /// Base currency
    pub base_currency: String,

    /// Quote currency
    pub quote_currency: String,

    /// Status
    pub status: String,

    /// Lot size filter
    pub lot_size_filter: LotSizeFilter,

    /// Price filter
    pub price_filter: PriceFilter,

    /// Leverage filter
    pub leverage_filter: LeverageFilter,

    /// Last price
    pub last_price: String,

    /// 24h volume
    pub volume_24h: String,

    /// 24h price change
    pub price_change_24h: String,
}

/// Lot size filter
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LotSizeFilter {
    /// Minimum trading quantity
    pub min_trading_qty: f64,

    /// Maximum trading quantity
    pub max_trading_qty: f64,

    /// Quantity step
    pub qty_step: f64,
}

/// Price filter
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PriceFilter {
    /// Minimum price
    pub min_price: f64,

    /// Maximum price
    pub max_price: f64,

    /// Tick size
    pub tick_size: f64,
}

/// Leverage filter
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LeverageFilter {
    /// Minimum leverage
    pub min_leverage: i32,

    /// Maximum leverage
    pub max_leverage: i32,

    /// Leverage step
    pub leverage_step: f64,
}

/// Position side
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum PositionSide {
    /// Buy side
    Buy,

    /// Sell side
    Sell,

    /// None
    None,
}

impl fmt::Display for PositionSide {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            PositionSide::Buy => write!(f, "Buy"),
            PositionSide::Sell => write!(f, "Sell"),
            PositionSide::None => write!(f, "None"),
        }
    }
}

/// Bybit order
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BybitOrder {
    /// Order ID
    pub order_id: String,

    /// Symbol
    pub symbol: String,

    /// Order side
    pub side: OrderSide,

    /// Order type
    pub order_type: OrderType,

    /// Price
    pub price: Option<f64>,

    /// Quantity
    pub qty: f64,

    /// Time in force
    pub time_in_force: TimeInForce,

    /// Order status
    pub order_status: OrderStatus,

    /// Last executed price
    pub last_exec_price: Option<f64>,

    /// Cumulative executed quantity
    pub cum_exec_qty: f64,

    /// Cumulative executed value
    pub cum_exec_value: f64,

    /// Cumulative executed fee
    pub cum_exec_fee: f64,

    /// Created time
    pub created_time: String,

    /// Updated time
    pub updated_time: String,

    /// Take profit price
    pub take_profit: Option<f64>,

    /// Stop loss price
    pub stop_loss: Option<f64>,

    /// Trigger price
    pub trigger_price: Option<f64>,

    /// Reduce only
    pub reduce_only: bool,

    /// Close on trigger
    pub close_on_trigger: bool,

    /// Position idx
    pub position_idx: u8,
}

/// Bybit position
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BybitPosition {
    /// Position ID
    pub position_idx: u8,

    /// Symbol
    pub symbol: String,

    /// Side
    pub side: PositionSide,

    /// Size
    pub size: f64,

    /// Entry price
    pub entry_price: f64,

    /// Leverage
    pub leverage: f64,

    /// Mark price
    pub mark_price: f64,

    /// Position value
    pub position_value: f64,

    /// Unrealized PnL
    pub unrealised_pnl: f64,

    /// Take profit price
    pub take_profit: Option<f64>,

    /// Stop loss price
    pub stop_loss: Option<f64>,

    /// Created time
    pub created_time: String,

    /// Updated time
    pub updated_time: String,
}

/// Bybit balance
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BybitBalance {
    /// Coin
    pub coin: String,

    /// Equity
    pub equity: f64,

    /// Available balance
    pub available_balance: f64,

    /// Used margin
    pub used_margin: f64,

    /// Order margin
    pub order_margin: f64,

    /// Position margin
    pub position_margin: f64,

    /// Unrealized PnL
    pub unrealised_pnl: f64,

    /// Realized PnL
    pub realised_pnl: f64,

    /// Cumulative realized PnL
    pub cum_realised_pnl: f64,
}

/// Bybit kline
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BybitKline {
    /// Start time
    pub start_time: i64,

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

    /// Turnover
    pub turnover: f64,
}

/// Bybit ticker
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BybitTicker {
    /// Symbol
    pub symbol: String,

    /// Last price
    #[serde(rename = "lastPrice")]
    #[serde(deserialize_with = "deserialize_string_to_f64")]
    pub last_price: f64,

    /// Index price (optional for spot)
    #[serde(rename = "indexPrice")]
    #[serde(deserialize_with = "deserialize_optional_string_to_f64")]
    #[serde(default)]
    pub index_price: Option<f64>,

    /// Mark price (optional for spot)
    #[serde(rename = "markPrice")]
    #[serde(deserialize_with = "deserialize_optional_string_to_f64")]
    #[serde(default)]
    pub mark_price: Option<f64>,

    /// Prev 24h price
    #[serde(rename = "prevPrice24h")]
    #[serde(deserialize_with = "deserialize_string_to_f64")]
    pub prev_price_24h: f64,

    /// Price 24h change percentage
    #[serde(rename = "price24hPcnt")]
    #[serde(deserialize_with = "deserialize_string_to_f64")]
    pub price_24h_pcnt: f64,

    /// High price 24h
    #[serde(rename = "highPrice24h")]
    #[serde(deserialize_with = "deserialize_string_to_f64")]
    pub high_price_24h: f64,

    /// Low price 24h
    #[serde(rename = "lowPrice24h")]
    #[serde(deserialize_with = "deserialize_string_to_f64")]
    pub low_price_24h: f64,

    /// Volume 24h
    #[serde(rename = "volume24h")]
    #[serde(deserialize_with = "deserialize_string_to_f64")]
    pub volume_24h: f64,

    /// Turnover 24h
    #[serde(rename = "turnover24h")]
    #[serde(deserialize_with = "deserialize_string_to_f64")]
    pub turnover_24h: f64,
}

/// Bybit orderbook
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BybitOrderbook {
    /// Symbol
    pub symbol: String,

    /// Timestamp
    pub timestamp: i64,

    /// Bids
    pub bids: Vec<(f64, f64)>,

    /// Asks
    pub asks: Vec<(f64, f64)>,
}

/// Bybit trade
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BybitTrade {
    /// Symbol
    pub symbol: String,

    /// Trade ID
    pub trade_id: String,

    /// Side
    pub side: OrderSide,

    /// Price
    pub price: f64,

    /// Size
    pub size: f64,

    /// Timestamp
    pub timestamp: i64,
}

/// Bybit leverage filter
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BybitLeverageFilter {
    /// Minimum leverage
    pub min_leverage: f64,

    /// Maximum leverage
    pub max_leverage: f64,

    /// Leverage step
    pub leverage_step: f64,
}

/// Bybit price filter
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BybitPriceFilter {
    /// Minimum price
    pub min_price: f64,

    /// Maximum price
    pub max_price: f64,

    /// Tick size
    pub tick_size: f64,
}

/// Bybit lot size filter
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BybitLotSizeFilter {
    /// Maximum trading quantity
    pub max_trading_qty: f64,

    /// Minimum trading quantity
    pub min_trading_qty: f64,

    /// Quantity step
    pub qty_step: f64,
}

/// Bybit instrument
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BybitInstrument {
    /// Symbol
    pub symbol: String,

    /// Leverage filter
    pub leverage_filter: BybitLeverageFilter,

    /// Price filter
    pub price_filter: BybitPriceFilter,

    /// Lot size filter
    pub lot_size_filter: BybitLotSizeFilter,
}

/// Bybit instrument info
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BybitInstrumentInfo {
    /// Category
    pub category: String,

    /// List of instruments
    pub list: Vec<BybitInstrument>,
}

/// Bybit instrument info with pagination
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BybitInstrumentInfoPaginated {
    /// List of instruments (raw JSON)
    pub list: Vec<serde_json::Value>,

    /// Next page cursor
    pub next_page_cursor: String,
}

/// Instrument status
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum InstrumentStatus {
    Trading,
    PreLaunch,
    Delivering,
    Closed,
    Unknown,
}

/// Bybit funding rate
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BybitFundingRate {
    /// Symbol
    pub symbol: String,

    /// Funding rate
    pub funding_rate: f64,

    /// Funding rate timestamp
    pub funding_rate_timestamp: i64,
}

/// Bybit API response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BybitResponse<T> {
    /// Return code
    #[serde(rename = "retCode")]
    pub ret_code: i32,

    /// Return message
    #[serde(rename = "retMsg")]
    pub ret_msg: String,

    /// Result
    pub result: Option<T>,

    /// Extension info
    #[serde(rename = "retExtInfo")]
    pub ret_ext_info: Option<serde_json::Value>,

    /// Time
    pub time: i64,
}

/// Bybit ticker list response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BybitTickerListResponse {
    /// Category
    pub category: String,

    /// List of tickers
    pub list: Vec<BybitTicker>,
}
