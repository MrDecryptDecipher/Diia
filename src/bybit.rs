//! Bybit Integration Module for OMNI Trading System
//!
//! This module provides direct integration with Bybit exchange APIs
//! and serves as a compatibility layer for the exchange module.

// Re-export everything from the exchange::bybit module for backwards compatibility
pub use crate::exchange::bybit::*;

use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use anyhow::Result;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BybitConfig {
    pub api_key: String,
    pub api_secret: String,
    pub testnet: bool,
    pub base_url: String,
    pub timeout_seconds: u64,
}

impl BybitConfig {
    pub fn new(api_key: String, api_secret: String, testnet: bool) -> Self {
        let base_url = if testnet {
            "https://api-testnet.bybit.com".to_string()
        } else {
            "https://api.bybit.com".to_string()
        };

        Self {
            api_key,
            api_secret,
            testnet,
            base_url,
            timeout_seconds: 30,
        }
    }

    pub fn demo() -> Self {
        Self::new(
            "demo_key".to_string(),
            "demo_secret".to_string(),
            true,
        )
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BybitMarketData {
    pub symbol: String,
    pub last_price: f64,
    pub bid_price: f64,
    pub ask_price: f64,
    pub volume_24h: f64,
    pub price_change_24h: f64,
    pub price_change_percent_24h: f64,
    pub high_24h: f64,
    pub low_24h: f64,
    pub timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BybitOrderRequest {
    pub symbol: String,
    pub side: String, // "Buy" or "Sell"
    pub order_type: String, // "Market" or "Limit"
    pub qty: f64,
    pub price: Option<f64>,
    pub time_in_force: String, // "GTC", "IOC", "FOK"
    pub reduce_only: bool,
    pub close_on_trigger: bool,
}

impl BybitOrderRequest {
    pub fn market_buy(symbol: String, qty: f64) -> Self {
        Self {
            symbol,
            side: "Buy".to_string(),
            order_type: "Market".to_string(),
            qty,
            price: None,
            time_in_force: "GTC".to_string(),
            reduce_only: false,
            close_on_trigger: false,
        }
    }

    pub fn market_sell(symbol: String, qty: f64) -> Self {
        Self {
            symbol,
            side: "Sell".to_string(),
            order_type: "Market".to_string(),
            qty,
            price: None,
            time_in_force: "GTC".to_string(),
            reduce_only: false,
            close_on_trigger: false,
        }
    }

    pub fn limit_buy(symbol: String, qty: f64, price: f64) -> Self {
        Self {
            symbol,
            side: "Buy".to_string(),
            order_type: "Limit".to_string(),
            qty,
            price: Some(price),
            time_in_force: "GTC".to_string(),
            reduce_only: false,
            close_on_trigger: false,
        }
    }

    pub fn limit_sell(symbol: String, qty: f64, price: f64) -> Self {
        Self {
            symbol,
            side: "Sell".to_string(),
            order_type: "Limit".to_string(),
            qty,
            price: Some(price),
            time_in_force: "GTC".to_string(),
            reduce_only: false,
            close_on_trigger: false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BybitOrderResponse {
    pub order_id: String,
    pub symbol: String,
    pub side: String,
    pub order_type: String,
    pub qty: f64,
    pub price: Option<f64>,
    pub status: String,
    pub created_time: u64,
    pub updated_time: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BybitPosition {
    pub symbol: String,
    pub side: String,
    pub size: f64,
    pub entry_price: f64,
    pub mark_price: f64,
    pub unrealized_pnl: f64,
    pub realized_pnl: f64,
    pub leverage: f64,
    pub position_value: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BybitBalance {
    pub coin: String,
    pub wallet_balance: f64,
    pub available_balance: f64,
    pub used_margin: f64,
    pub order_margin: f64,
    pub position_margin: f64,
}

#[derive(Debug, Clone)]
pub struct BybitClient {
    config: BybitConfig,
    http_client: reqwest::Client,
}

impl BybitClient {
    pub fn new(config: BybitConfig) -> Self {
        let http_client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(config.timeout_seconds))
            .build()
            .expect("Failed to create HTTP client");

        Self {
            config,
            http_client,
        }
    }

    pub async fn get_market_data(&self, symbol: &str) -> Result<BybitMarketData> {
        // Simulate API call for demo purposes
        let market_data = BybitMarketData {
            symbol: symbol.to_string(),
            last_price: 45000.0,
            bid_price: 44995.0,
            ask_price: 45005.0,
            volume_24h: 1000000.0,
            price_change_24h: 500.0,
            price_change_percent_24h: 1.12,
            high_24h: 45500.0,
            low_24h: 44000.0,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        };

        Ok(market_data)
    }

    pub async fn place_order(&self, order: BybitOrderRequest) -> Result<BybitOrderResponse> {
        // Simulate order placement for demo purposes
        let order_response = BybitOrderResponse {
            order_id: format!("order_{}", rand::random::<u32>()),
            symbol: order.symbol,
            side: order.side,
            order_type: order.order_type,
            qty: order.qty,
            price: order.price,
            status: "Filled".to_string(),
            created_time: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            updated_time: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        };

        Ok(order_response)
    }

    pub async fn get_positions(&self) -> Result<Vec<BybitPosition>> {
        // Simulate positions for demo purposes
        let positions = vec![
            BybitPosition {
                symbol: "BTCUSDT".to_string(),
                side: "Buy".to_string(),
                size: 0.1,
                entry_price: 44500.0,
                mark_price: 45000.0,
                unrealized_pnl: 50.0,
                realized_pnl: 0.0,
                leverage: 10.0,
                position_value: 4500.0,
            }
        ];

        Ok(positions)
    }

    pub async fn get_balance(&self) -> Result<Vec<BybitBalance>> {
        // Simulate balance for demo purposes
        let balances = vec![
            BybitBalance {
                coin: "USDT".to_string(),
                wallet_balance: 1000.0,
                available_balance: 950.0,
                used_margin: 50.0,
                order_margin: 0.0,
                position_margin: 50.0,
            }
        ];

        Ok(balances)
    }

    pub async fn cancel_order(&self, symbol: &str, order_id: &str) -> Result<bool> {
        // Simulate order cancellation
        println!("Cancelling order {} for symbol {}", order_id, symbol);
        Ok(true)
    }

    pub async fn get_order_history(&self, symbol: &str, limit: Option<u32>) -> Result<Vec<BybitOrderResponse>> {
        let limit = limit.unwrap_or(50);
        let mut orders = Vec::new();

        // Simulate order history
        for i in 0..limit.min(10) {
            orders.push(BybitOrderResponse {
                order_id: format!("hist_order_{}", i),
                symbol: symbol.to_string(),
                side: if i % 2 == 0 { "Buy".to_string() } else { "Sell".to_string() },
                order_type: "Market".to_string(),
                qty: 0.1,
                price: Some(45000.0 + (i as f64 * 10.0)),
                status: "Filled".to_string(),
                created_time: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs() - (i as u64 * 3600),
                updated_time: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs() - (i as u64 * 3600),
            });
        }

        Ok(orders)
    }

    pub async fn set_leverage(&self, symbol: &str, leverage: f64) -> Result<bool> {
        println!("Setting leverage for {} to {}x", symbol, leverage);
        Ok(true)
    }

    pub async fn get_symbols(&self) -> Result<Vec<String>> {
        // Return common trading symbols
        Ok(vec![
            "BTCUSDT".to_string(),
            "ETHUSDT".to_string(),
            "ADAUSDT".to_string(),
            "DOTUSDT".to_string(),
            "LINKUSDT".to_string(),
            "LTCUSDT".to_string(),
            "XRPUSDT".to_string(),
            "SOLUSDT".to_string(),
        ])
    }

    pub fn is_testnet(&self) -> bool {
        self.config.testnet
    }

    pub fn get_base_url(&self) -> &str {
        &self.config.base_url
    }
}

/// Utility functions for Bybit integration
pub mod bybit_utils {
    use super::*;

    pub fn calculate_position_size(
        balance: f64,
        risk_percentage: f64,
        entry_price: f64,
        stop_loss_price: f64,
        leverage: f64,
    ) -> f64 {
        let risk_amount = balance * (risk_percentage / 100.0);
        let price_risk = (entry_price - stop_loss_price).abs();
        
        if price_risk > 0.0 {
            let position_size = (risk_amount / price_risk) * leverage;
            position_size.max(0.001) // Minimum position size
        } else {
            0.0
        }
    }

    pub fn calculate_liquidation_price(
        entry_price: f64,
        leverage: f64,
        side: &str,
        maintenance_margin_rate: f64,
    ) -> f64 {
        let margin_ratio = 1.0 / leverage;
        let liquidation_distance = entry_price * (margin_ratio - maintenance_margin_rate);

        match side.to_lowercase().as_str() {
            "buy" | "long" => entry_price - liquidation_distance,
            "sell" | "short" => entry_price + liquidation_distance,
            _ => entry_price,
        }
    }

    pub fn format_symbol(base: &str, quote: &str) -> String {
        format!("{}{}", base.to_uppercase(), quote.to_uppercase())
    }

    pub fn parse_symbol(symbol: &str) -> Option<(String, String)> {
        if symbol.ends_with("USDT") {
            let base = symbol.strip_suffix("USDT")?;
            Some((base.to_string(), "USDT".to_string()))
        } else if symbol.ends_with("USD") {
            let base = symbol.strip_suffix("USD")?;
            Some((base.to_string(), "USD".to_string()))
        } else {
            None
        }
    }

    pub fn validate_order_size(size: f64, min_size: f64, max_size: f64, step_size: f64) -> Result<f64> {
        if size < min_size {
            return Err(anyhow::anyhow!("Order size {} is below minimum {}", size, min_size));
        }
        
        if size > max_size {
            return Err(anyhow::anyhow!("Order size {} exceeds maximum {}", size, max_size));
        }

        // Round to step size
        let rounded_size = (size / step_size).round() * step_size;
        Ok(rounded_size)
    }
}
