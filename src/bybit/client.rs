//! Bybit Client Implementation
//!
//! Provides actual Bybit API integration for demo and mainnet trading

use std::collections::HashMap;
use std::time::{SystemTime, UNIX_EPOCH};
use anyhow::{Result, anyhow};
use hmac::{Hmac, Mac};
use sha2::Sha256;
use reqwest::Client;
use serde::{Serialize, Deserialize};
use serde_json::{json, Value};
use tracing::{info, debug, warn, error};
use rust_decimal::Decimal;

use crate::bybit::types::*;

type HmacSha256 = Hmac<Sha256>;

/// Bybit API client for actual trading
pub struct BybitClient {
    /// API key
    api_key: String,
    
    /// API secret
    api_secret: String,
    
    /// Base URL (testnet or mainnet)
    base_url: String,
    
    /// HTTP client
    client: Client,
    
    /// Whether this is a demo/testnet client
    is_testnet: bool,
}

impl BybitClient {
    /// Create new Bybit client
    pub fn new(api_key: String, api_secret: String, is_testnet: bool) -> Self {
        let base_url = if is_testnet {
            "https://api-testnet.bybit.com".to_string()
        } else {
            "https://api.bybit.com".to_string()
        };
        
        Self {
            api_key,
            api_secret,
            base_url,
            client: Client::new(),
            is_testnet,
        }
    }
    
    /// Generate timestamp
    fn get_timestamp(&self) -> u64 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("Time went backwards")
            .as_millis() as u64
    }
    
    /// Generate signature for API request
    fn generate_signature(&self, timestamp: u64, recv_window: &str, params: &str) -> String {
        let message = format!("{}{}{}", timestamp, self.api_key, recv_window) + params;
        
        let mut mac = HmacSha256::new_from_slice(self.api_secret.as_bytes())
            .expect("HMAC can take key of any size");
        mac.update(message.as_bytes());
        
        hex::encode(mac.finalize().into_bytes())
    }
    
    /// Make authenticated POST request
    async fn make_post_request(&self, endpoint: &str, params: Value) -> Result<Value> {
        let url = format!("{}{}", self.base_url, endpoint);
        let params_str = params.to_string();
        
        let timestamp = self.get_timestamp();
        let recv_window = "5000";
        let signature = self.generate_signature(timestamp, recv_window, &params_str);
        
        debug!("Making POST request to: {}", url);
        debug!("Request params: {}", params_str);
        
        let response = self.client
            .post(&url)
            .header("X-BAPI-API-KEY", &self.api_key)
            .header("X-BAPI-SIGN", signature)
            .header("X-BAPI-TIMESTAMP", timestamp.to_string())
            .header("X-BAPI-RECV-WINDOW", recv_window)
            .header("Content-Type", "application/json")
            .body(params_str)
            .send()
            .await?;
        
        let response_text = response.text().await?;
        debug!("Response: {}", response_text);
        
        let response_json: Value = serde_json::from_str(&response_text)?;
        
        let ret_code = response_json["retCode"].as_i64().unwrap_or(-1);
        if ret_code != 0 {
            let ret_msg = response_json["retMsg"].as_str().unwrap_or("Unknown error");
            return Err(anyhow!("Bybit API error: {} (code: {})", ret_msg, ret_code));
        }
        
        Ok(response_json)
    }
    
    /// Make authenticated GET request
    async fn make_get_request(&self, endpoint: &str, params: &[(&str, &str)]) -> Result<Value> {
        let url = format!("{}{}", self.base_url, endpoint);
        
        let query_string = params.iter()
            .map(|(k, v)| format!("{}={}", k, v))
            .collect::<Vec<_>>()
            .join("&");
        
        let timestamp = self.get_timestamp();
        let recv_window = "5000";
        let signature = self.generate_signature(timestamp, recv_window, &query_string);
        
        debug!("Making GET request to: {}?{}", url, query_string);
        
        let response = self.client
            .get(&url)
            .query(params)
            .header("X-BAPI-API-KEY", &self.api_key)
            .header("X-BAPI-SIGN", signature)
            .header("X-BAPI-TIMESTAMP", timestamp.to_string())
            .header("X-BAPI-RECV-WINDOW", recv_window)
            .send()
            .await?;
        
        let response_text = response.text().await?;
        debug!("Response: {}", response_text);
        
        let response_json: Value = serde_json::from_str(&response_text)?;
        
        let ret_code = response_json["retCode"].as_i64().unwrap_or(-1);
        if ret_code != 0 {
            let ret_msg = response_json["retMsg"].as_str().unwrap_or("Unknown error");
            return Err(anyhow!("Bybit API error: {} (code: {})", ret_msg, ret_code));
        }
        
        Ok(response_json)
    }
    
    /// Place market order
    pub async fn place_market_order(
        &self,
        symbol: &str,
        side: OrderSide,
        quantity: Decimal,
    ) -> Result<OrderResponse> {
        info!("🎯 Placing ACTUAL market order: {} {} {}", side.as_str(), quantity, symbol);
        
        let side_str = side.as_str();
        let qty_str = quantity.to_string();
        
        let params = json!({
            "category": "linear",
            "symbol": symbol,
            "side": side_str,
            "orderType": "Market",
            "qty": qty_str,
            "timeInForce": "IOC"
        });
        
        let response = self.make_post_request("/v5/order/create", params).await?;
        
        let order_id = response["result"]["orderId"]
            .as_str()
            .ok_or_else(|| anyhow!("No order ID in response"))?
            .to_string();
        
        info!("✅ Market order placed successfully: {} (Order ID: {})", symbol, order_id);
        
        Ok(OrderResponse {
            order_id,
            symbol: symbol.to_string(),
            side,
            order_type: OrderType::Market,
            quantity,
            price: None,
            status: "New".to_string(),
        })
    }
    
    /// Place limit order
    pub async fn place_limit_order(
        &self,
        symbol: &str,
        side: OrderSide,
        quantity: Decimal,
        price: Decimal,
        time_in_force: TimeInForce,
    ) -> Result<OrderResponse> {
        info!("🎯 Placing ACTUAL limit order: {} {} {} @ {}", side.as_str(), quantity, symbol, price);
        
        let side_str = side.as_str();
        let qty_str = quantity.to_string();
        let price_str = price.to_string();
        let tif_str = time_in_force.as_str();
        
        let params = json!({
            "category": "linear",
            "symbol": symbol,
            "side": side_str,
            "orderType": "Limit",
            "qty": qty_str,
            "price": price_str,
            "timeInForce": tif_str
        });
        
        let response = self.make_post_request("/v5/order/create", params).await?;
        
        let order_id = response["result"]["orderId"]
            .as_str()
            .ok_or_else(|| anyhow!("No order ID in response"))?
            .to_string();
        
        info!("✅ Limit order placed successfully: {} (Order ID: {})", symbol, order_id);
        
        Ok(OrderResponse {
            order_id,
            symbol: symbol.to_string(),
            side,
            order_type: OrderType::Limit,
            quantity,
            price: Some(price),
            status: "New".to_string(),
        })
    }
    
    /// Get order status
    pub async fn get_order_status(&self, symbol: &str, order_id: &str) -> Result<OrderStatus> {
        let params = [
            ("category", "linear"),
            ("symbol", symbol),
            ("orderId", order_id),
        ];
        
        let response = self.make_get_request("/v5/order/realtime", &params).await?;
        
        let order_data = &response["result"]["list"][0];
        
        let status = order_data["orderStatus"]
            .as_str()
            .unwrap_or("Unknown")
            .to_string();
        
        let avg_price = order_data["avgPrice"]
            .as_str()
            .and_then(|s| s.parse::<Decimal>().ok())
            .unwrap_or_default();
        
        let cum_exec_qty = order_data["cumExecQty"]
            .as_str()
            .and_then(|s| s.parse::<Decimal>().ok())
            .unwrap_or_default();
        
        let cum_exec_fee = order_data["cumExecFee"]
            .as_str()
            .and_then(|s| s.parse::<Decimal>().ok())
            .unwrap_or_default();
        
        Ok(OrderStatus {
            order_id: order_id.to_string(),
            status,
            avg_price,
            cum_exec_qty,
            cum_exec_fee,
        })
    }
    
    /// Cancel order
    pub async fn cancel_order(&self, symbol: &str, order_id: &str) -> Result<()> {
        info!("❌ Cancelling order: {} ({})", order_id, symbol);
        
        let params = json!({
            "category": "linear",
            "symbol": symbol,
            "orderId": order_id
        });
        
        let _response = self.make_post_request("/v5/order/cancel", params).await?;
        
        info!("✅ Order cancelled successfully: {}", order_id);
        Ok(())
    }
    
    /// Set leverage for symbol
    pub async fn set_leverage(&self, symbol: &str, leverage: u32) -> Result<()> {
        info!("⚙️ Setting leverage for {}: {}x", symbol, leverage);
        
        let params = json!({
            "category": "linear",
            "symbol": symbol,
            "buyLeverage": leverage.to_string(),
            "sellLeverage": leverage.to_string()
        });
        
        let _response = self.make_post_request("/v5/position/set-leverage", params).await?;
        
        info!("✅ Leverage set successfully for {}: {}x", symbol, leverage);
        Ok(())
    }
    
    /// Get ticker information
    pub async fn get_ticker(&self, symbol: &str) -> Result<Ticker> {
        let params = [
            ("category", "linear"),
            ("symbol", symbol),
        ];
        
        let response = self.make_get_request("/v5/market/tickers", &params).await?;
        
        let ticker_data = &response["result"]["list"][0];
        
        let last_price = ticker_data["lastPrice"]
            .as_str()
            .and_then(|s| s.parse::<Decimal>().ok())
            .unwrap_or_default();
        
        let volume_24h = ticker_data["volume24h"]
            .as_str()
            .and_then(|s| s.parse::<Decimal>().ok())
            .unwrap_or_default();
        
        let price_change_24h = ticker_data["price24hPcnt"]
            .as_str()
            .and_then(|s| s.parse::<Decimal>().ok())
            .unwrap_or_default();
        
        Ok(Ticker {
            symbol: symbol.to_string(),
            last_price,
            volume_24h,
            price_change_24h,
        })
    }
    
    /// Get orderbook
    pub async fn get_orderbook(&self, symbol: &str, limit: u32) -> Result<Orderbook> {
        let params = [
            ("category", "linear"),
            ("symbol", symbol),
            ("limit", &limit.to_string()),
        ];
        
        let response = self.make_get_request("/v5/market/orderbook", &params).await?;
        
        let orderbook_data = &response["result"];
        
        let bids: Vec<OrderbookEntry> = orderbook_data["b"]
            .as_array()
            .unwrap_or(&vec![])
            .iter()
            .filter_map(|entry| {
                let array = entry.as_array()?;
                let price = array[0].as_str()?.parse::<Decimal>().ok()?;
                let size = array[1].as_str()?.parse::<Decimal>().ok()?;
                Some(OrderbookEntry { price, size })
            })
            .collect();
        
        let asks: Vec<OrderbookEntry> = orderbook_data["a"]
            .as_array()
            .unwrap_or(&vec![])
            .iter()
            .filter_map(|entry| {
                let array = entry.as_array()?;
                let price = array[0].as_str()?.parse::<Decimal>().ok()?;
                let size = array[1].as_str()?.parse::<Decimal>().ok()?;
                Some(OrderbookEntry { price, size })
            })
            .collect();
        
        Ok(Orderbook {
            symbol: symbol.to_string(),
            bids,
            asks,
        })
    }
    
    /// Get instrument info
    pub async fn get_instrument_info(&self, symbol: &str) -> Result<InstrumentInfo> {
        let params = [
            ("category", "linear"),
            ("symbol", symbol),
        ];
        
        let response = self.make_get_request("/v5/market/instruments-info", &params).await?;
        
        let instrument_data = &response["result"]["list"][0];
        
        let min_order_qty = instrument_data["lotSizeFilter"]["minOrderQty"]
            .as_str()
            .and_then(|s| s.parse::<Decimal>().ok())
            .unwrap_or_default();
        
        let qty_step = instrument_data["lotSizeFilter"]["qtyStep"]
            .as_str()
            .and_then(|s| s.parse::<Decimal>().ok())
            .unwrap_or_default();
        
        Ok(InstrumentInfo {
            symbol: symbol.to_string(),
            min_order_qty,
            qty_step,
        })
    }
    
    /// Get account balance
    pub async fn get_balance(&self) -> Result<Balance> {
        let params = [
            ("accountType", "UNIFIED"),
        ];
        
        let response = self.make_get_request("/v5/account/wallet-balance", &params).await?;
        
        let account_data = &response["result"]["list"][0];
        let coin_data = &account_data["coin"];
        
        // Find USDT balance
        let usdt_balance = coin_data
            .as_array()
            .unwrap_or(&vec![])
            .iter()
            .find(|coin| coin["coin"].as_str() == Some("USDT"))
            .and_then(|coin| coin["walletBalance"].as_str())
            .and_then(|s| s.parse::<Decimal>().ok())
            .unwrap_or_default();
        
        Ok(Balance {
            total_balance: usdt_balance,
            available_balance: usdt_balance,
            currency: "USDT".to_string(),
        })
    }
}
