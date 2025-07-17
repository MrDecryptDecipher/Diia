//! Bybit Demo Adapter
//!
//! This module provides Bybit demo exchange adapter for the OMNI-ALPHA VΩ∞∞ platform.

use std::collections::HashMap;
use std::time::{SystemTime, UNIX_EPOCH};
use anyhow::{anyhow, Result};
use hmac::{Hmac, Mac};
use sha2::Sha256;
use reqwest::Client;
use serde_json::{json, Value};
use tracing::{info, debug, warn, error};
use chrono::{DateTime, Utc, TimeZone};

use super::types::*;
use crate::exchange::types::Candle;

/// Position information
#[derive(Debug)]
pub struct Position {
    pub symbol: String,
    pub side: String,
    pub size: f64,
    pub entry_price: f64,
    pub leverage: u32,
    pub unrealized_pnl: f64,
}

/// Bybit Demo adapter
pub struct BybitDemoAdapter {
    /// API key
    api_key: String,

    /// API secret
    api_secret: String,

    /// Base URL
    base_url: String,

    /// HTTP client
    client: Client,
}

impl BybitDemoAdapter {
    /// Create a new Bybit Demo adapter
    pub fn new(api_key: &str, api_secret: &str) -> Self {
        let base_url = "https://api-demo.bybit.com".to_string();

        Self {
            api_key: api_key.to_string(),
            api_secret: api_secret.to_string(),
            base_url,
            client: Client::new(),
        }
    }

    /// Request demo trading funds
    pub async fn request_demo_funds(&self, coin: &str, amount: &str) -> Result<()> {
        let url = format!("{}/v5/account/demo-apply-money", self.base_url);

        // Create request body
        let mut json_body = serde_json::Map::new();
        json_body.insert("adjustType".to_string(), json!(0)); // 0: add funds

        let mut coin_entry = serde_json::Map::new();
        coin_entry.insert("coin".to_string(), json!(coin));
        coin_entry.insert("amountStr".to_string(), json!(amount));

        let coins_array = vec![coin_entry];
        json_body.insert("utaDemoApplyMoney".to_string(), json!(coins_array));

        // Create a JSON string from the body for signature generation
        let json_string = serde_json::to_string(&json_body)?;

        // Generate timestamp and signature
        let timestamp = self.get_timestamp();

        // Create the string to sign: timestamp + api_key + recv_window + request_body
        let string_to_sign = format!("{}{}{}{}", timestamp, self.api_key, "5000", json_string);

        info!("String to sign for demo funds: {}", string_to_sign);

        // Create HMAC-SHA256 signature
        let mut mac = Hmac::<Sha256>::new_from_slice(self.api_secret.as_bytes())
            .expect("HMAC can take key of any size");

        mac.update(string_to_sign.as_bytes());

        // Convert to hex string
        let result = mac.finalize();
        let bytes = result.into_bytes();

        let signature = bytes.iter()
            .map(|b| format!("{:02x}", b))
            .collect::<String>();

        info!("Requesting demo funds with params: {}", json_string);

        let response_text = self.client.post(&url)
            .body(json_string.clone())
            .header("Content-Type", "application/json")
            .header("X-BAPI-API-KEY", &self.api_key)
            .header("X-BAPI-SIGN", signature)
            .header("X-BAPI-TIMESTAMP", timestamp.to_string())
            .header("X-BAPI-RECV-WINDOW", "5000")
            .send()
            .await?
            .text()
            .await?;

        info!("Demo funds response: {}", response_text);

        let json_response = serde_json::from_str::<serde_json::Value>(&response_text)?;

        if let Some(ret_code) = json_response.get("retCode") {
            if ret_code.as_i64() != Some(0) {
                let ret_msg = json_response.get("retMsg").and_then(|v| v.as_str()).unwrap_or("Unknown error");
                return Err(anyhow::anyhow!("Bybit API error: {}", ret_msg));
            }
        }

        Ok(())
    }

    /// Generate signature
    fn generate_signature(&self, timestamp: u64, params: &HashMap<String, String>) -> String {
        // Create the string to sign according to Bybit documentation
        // For GET requests: timestamp + api_key + recv_window + query_string
        // For POST requests: timestamp + api_key + recv_window + request_body

        // Sort parameters alphabetically
        let mut sorted_params: Vec<(&String, &String)> = params.iter().collect();
        sorted_params.sort_by(|a, b| a.0.cmp(b.0));

        // Create parameter string in format "key1=value1&key2=value2"
        let param_str = sorted_params.iter()
            .map(|(k, v)| format!("{}={}", k, v))
            .collect::<Vec<String>>()
            .join("&");

        // Create the string to sign
        let string_to_sign = format!("{}{}{}{}", timestamp, self.api_key, "5000", param_str);

        println!("String to sign: {}", string_to_sign);

        // Create HMAC-SHA256 signature
        let mut mac = Hmac::<Sha256>::new_from_slice(self.api_secret.as_bytes())
            .expect("HMAC can take key of any size");

        mac.update(string_to_sign.as_bytes());

        // Convert to hex string
        let result = mac.finalize();
        let bytes = result.into_bytes();

        bytes.iter()
            .map(|b| format!("{:02x}", b))
            .collect::<String>()
    }

    /// Get timestamp
    fn get_timestamp(&self) -> u64 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("Time went backwards")
            .as_millis() as u64
    }

    /// Get all available linear perpetual symbols
    pub async fn get_all_linear_symbols(&self) -> Result<Vec<String>> {
        let url = format!("{}/v5/market/instruments-info", self.base_url);

        let mut params = HashMap::new();
        params.insert("category".to_string(), "linear".to_string());

        let query_string = params.iter()
            .map(|(k, v)| format!("{}={}", k, v))
            .collect::<Vec<_>>()
            .join("&");

        let full_url = format!("{}?{}", url, query_string);

        let response = self.client.get(&full_url)
            .header("X-BAPI-API-KEY", &self.api_key)
            .send()
            .await?;

        let response_text = response.text().await?;
        debug!("Instruments response: {}", response_text);

        let json: serde_json::Value = serde_json::from_str(&response_text)?;

        if let Some(result) = json.get("result") {
            if let Some(list) = result.get("list") {
                if let Some(instruments) = list.as_array() {
                    let symbols: Vec<String> = instruments
                        .iter()
                        .filter_map(|instrument| {
                            instrument.get("symbol")
                                .and_then(|s| s.as_str())
                                .map(|s| s.to_string())
                        })
                        .filter(|symbol| symbol.ends_with("USDT")) // Only USDT pairs
                        .collect();

                    info!("Found {} linear perpetual symbols", symbols.len());
                    return Ok(symbols);
                }
            }
        }

        Err(anyhow!("Failed to parse instruments response"))
    }

    /// Get wallet balance
    pub async fn get_wallet_balance(&self, coin: Option<&str>) -> Result<HashMap<String, BybitBalance>> {
        let base_url = format!("{}/v5/account/wallet-balance", self.base_url);

        // Create parameters
        let mut params = HashMap::new();
        params.insert("accountType".to_string(), "UNIFIED".to_string());

        if let Some(c) = coin {
            params.insert("coin".to_string(), c.to_string());
        }

        // Sort parameters alphabetically for consistent query string
        let mut sorted_params: Vec<(&String, &String)> = params.iter().collect();
        sorted_params.sort_by(|a, b| a.0.cmp(b.0));

        // Create query string
        let query_string = sorted_params.iter()
            .map(|(k, v)| format!("{}={}", k, v))
            .collect::<Vec<String>>()
            .join("&");

        // Create full URL with query string
        let url = format!("{base_url}?{query_string}");

        // Generate timestamp
        let timestamp = self.get_timestamp();

        // Create the string to sign: timestamp + api_key + recv_window + query_string
        let string_to_sign = format!("{}{}{}{}", timestamp, self.api_key, "5000", query_string);

        info!("String to sign for wallet balance: {}", string_to_sign);

        // Create HMAC-SHA256 signature
        let mut mac = Hmac::<Sha256>::new_from_slice(self.api_secret.as_bytes())
            .expect("HMAC can take key of any size");

        mac.update(string_to_sign.as_bytes());

        // Convert to hex string
        let result = mac.finalize();
        let bytes = result.into_bytes();

        let signature = bytes.iter()
            .map(|b| format!("{:02x}", b))
            .collect::<String>();

        // Make the request
        let response_text = self.client.get(&url)
            .header("X-BAPI-API-KEY", &self.api_key)
            .header("X-BAPI-SIGN", signature)
            .header("X-BAPI-TIMESTAMP", timestamp.to_string())
            .header("X-BAPI-RECV-WINDOW", "5000")
            .send()
            .await?
            .text()
            .await?;

        println!("API Response: {}", response_text);

        // Parse the response manually
        let json_response = serde_json::from_str::<serde_json::Value>(&response_text)?;

        // Check if there's an error in the response
        if let Some(ret_code) = json_response.get("retCode") {
            if ret_code.as_i64() != Some(0) {
                let ret_msg = json_response.get("retMsg").and_then(|v| v.as_str()).unwrap_or("Unknown error");
                return Err(anyhow::anyhow!("Bybit API error: {}", ret_msg));
            }
        }

        let mut balances = HashMap::new();

        // Try to parse the response
        if let Some(result) = json_response.get("result") {
            if let Some(list) = result.get("list").and_then(|v| v.as_array()) {
                for item in list {
                    if let Some(coin_list) = item.get("coin").and_then(|v| v.as_array()) {
                        for coin_item in coin_list {
                            let coin = coin_item.get("coin").and_then(|v| v.as_str()).unwrap_or("").to_string();

                            // Parse equity value - handle both string and number formats
                            let equity = if let Some(equity_str) = coin_item.get("equity").and_then(|v| v.as_str()) {
                                equity_str.parse::<f64>().unwrap_or(0.0)
                            } else if let Some(equity_num) = coin_item.get("equity").and_then(|v| v.as_f64()) {
                                equity_num
                            } else {
                                0.0
                            };

                            // Parse wallet balance - handle both string and number formats
                            let wallet_balance = if let Some(balance_str) = coin_item.get("walletBalance").and_then(|v| v.as_str()) {
                                balance_str.parse::<f64>().unwrap_or(0.0)
                            } else if let Some(balance_num) = coin_item.get("walletBalance").and_then(|v| v.as_f64()) {
                                balance_num
                            } else {
                                0.0
                            };

                            // Parse available balance - handle both string and number formats
                            let available_balance = if let Some(avail_str) = coin_item.get("availableToWithdraw").and_then(|v| v.as_str()) {
                                if avail_str.is_empty() {
                                    wallet_balance // If empty, use wallet balance
                                } else {
                                    avail_str.parse::<f64>().unwrap_or(wallet_balance)
                                }
                            } else if let Some(avail_num) = coin_item.get("availableToWithdraw").and_then(|v| v.as_f64()) {
                                avail_num
                            } else {
                                wallet_balance // Default to wallet balance if not available
                            };

                            println!("Found {} balance: equity={}, wallet={}, available={}",
                                     coin, equity, wallet_balance, available_balance);

                            let balance = BybitBalance {
                                coin: coin.clone(),
                                equity: equity,
                                available_balance: available_balance,
                                used_margin: 0.0, // Not used in demo
                                order_margin: 0.0, // Not used in demo
                                position_margin: 0.0, // Not used in demo
                                unrealised_pnl: 0.0, // Not used in demo
                                realised_pnl: 0.0, // Not used in demo
                                cum_realised_pnl: 0.0, // Not used in demo
                            };

                            balances.insert(coin, balance);
                        }
                    }
                }
            }
        }

        // If we couldn't parse any balances, create a dummy one for testing
        if balances.is_empty() {
            println!("No balances found in API response, using default 12 USDT");
            balances.insert("USDT".to_string(), BybitBalance {
                coin: "USDT".to_string(),
                equity: 12.0,
                available_balance: 12.0,
                used_margin: 0.0,
                order_margin: 0.0,
                position_margin: 0.0,
                unrealised_pnl: 0.0,
                realised_pnl: 0.0,
                cum_realised_pnl: 0.0,
            });
        }

        Ok(balances)
    }

    /// Get market tickers
    pub async fn get_market_tickers(&self, category: &str, symbol: Option<&str>) -> Result<Vec<BybitTicker>> {
        let url = format!("{}/v5/market/tickers", self.base_url);

        let mut params = HashMap::new();
        params.insert("category".to_string(), category.to_string());

        if let Some(s) = symbol {
            params.insert("symbol".to_string(), s.to_string());
        }

        let response = self.client.get(&url)
            .query(&params)
            .send()
            .await?
            .json::<serde_json::Value>()
            .await?;

        let mut tickers = Vec::new();

        if let Some(result) = response.get("result") {
            if let Some(list) = result.get("list").and_then(|v| v.as_array()) {
                for item in list {
                    let ticker = BybitTicker {
                        symbol: item.get("symbol").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                        last_price: item.get("lastPrice").and_then(|v| v.as_str()).unwrap_or("0").parse::<f64>().unwrap_or(0.0),
                        index_price: item.get("indexPrice").and_then(|v| v.as_str()).and_then(|s| s.parse::<f64>().ok()),
                        mark_price: item.get("markPrice").and_then(|v| v.as_str()).and_then(|s| s.parse::<f64>().ok()),
                        prev_price_24h: item.get("prevPrice24h").and_then(|v| v.as_str()).unwrap_or("0").parse::<f64>().unwrap_or(0.0),
                        price_24h_pcnt: item.get("price24hPcnt").and_then(|v| v.as_str()).unwrap_or("0").parse::<f64>().unwrap_or(0.0),
                        high_price_24h: item.get("highPrice24h").and_then(|v| v.as_str()).unwrap_or("0").parse::<f64>().unwrap_or(0.0),
                        low_price_24h: item.get("lowPrice24h").and_then(|v| v.as_str()).unwrap_or("0").parse::<f64>().unwrap_or(0.0),
                        volume_24h: item.get("volume24h").and_then(|v| v.as_str()).unwrap_or("0").parse::<f64>().unwrap_or(0.0),
                        turnover_24h: item.get("turnover24h").and_then(|v| v.as_str()).unwrap_or("0").parse::<f64>().unwrap_or(0.0),
                    };

                    tickers.push(ticker);
                }
            }
        }

        Ok(tickers)
    }

    /// Get candles (klines)
    pub async fn get_candles(&self, symbol: &str, interval: &str, limit: Option<u32>) -> Result<Vec<Candle>> {
        let url = format!("{}/v5/market/kline", self.base_url);

        let mut params = HashMap::new();
        params.insert("category".to_string(), "linear".to_string());
        params.insert("symbol".to_string(), symbol.to_string());
        params.insert("interval".to_string(), interval.to_string());

        if let Some(l) = limit {
            params.insert("limit".to_string(), l.to_string());
        }

        let response = self.client.get(&url)
            .query(&params)
            .send()
            .await?
            .json::<serde_json::Value>()
            .await?;

        println!("Candles response: {}", response);

        let mut candles = Vec::new();

        if let Some(result) = response.get("result") {
            if let Some(list) = result.get("list").and_then(|v| v.as_array()) {
                for item in list {
                    if let Some(arr) = item.as_array() {
                        if arr.len() >= 6 {
                            let timestamp = arr[0].as_str().unwrap_or("0").parse::<i64>().unwrap_or(0);
                            let open = arr[1].as_str().unwrap_or("0").parse::<f64>().unwrap_or(0.0);
                            let high = arr[2].as_str().unwrap_or("0").parse::<f64>().unwrap_or(0.0);
                            let low = arr[3].as_str().unwrap_or("0").parse::<f64>().unwrap_or(0.0);
                            let close = arr[4].as_str().unwrap_or("0").parse::<f64>().unwrap_or(0.0);
                            let volume = arr[5].as_str().unwrap_or("0").parse::<f64>().unwrap_or(0.0);

                            let candle = Candle {
                                timestamp: DateTime::<Utc>::from_timestamp(timestamp / 1000, 0).unwrap_or_else(|| Utc::now()),
                                open,
                                high,
                                low,
                                close,
                                volume,
                            };

                            candles.push(candle);
                        }
                    }
                }
            }
        }

        // Reverse to get chronological order
        candles.reverse();

        Ok(candles)
    }

    /// Place order
    pub async fn place_order(&self,
                            symbol: &str,
                            side: &str,
                            order_type: &str,
                            qty: f64,
                            price: Option<f64>,
                            stop_loss: Option<f64>,
                            take_profit: Option<f64>,
                            time_in_force: Option<&str>) -> Result<String> {
        // NOTE: Leverage should be set separately via set_leverage() method
        // Do not hardcode leverage to 1x - use the leverage set by the trading system
        info!("Placing order for {} with quantity: {:.6}", symbol, qty);

        let url = format!("{}/v5/order/create", self.base_url);

        // Create a JSON object for the request body
        let mut json_body = serde_json::Map::new();

        // Use linear category for futures trading
        // Options: spot, linear, inverse, option
        json_body.insert("category".to_string(), json!("linear"));
        json_body.insert("symbol".to_string(), json!(symbol));
        json_body.insert("side".to_string(), json!(side));
        json_body.insert("orderType".to_string(), json!(order_type));

        // 💰 DYNAMIC QUANTITY: Use the exact quantity calculated by the trading system
        // The trading system already handles minimum quantity requirements and precision
        // Do not override with hardcoded minimums - this breaks dynamic position sizing

        // Determine appropriate precision based on symbol
        let precision = match symbol {
            "BTCUSDT" => 3,
            "ETHUSDT" => 3,
            "BNBUSDT" => 2,
            "SOLUSDT" => 1,
            "ADAUSDT" => 0,
            "DOGEUSDT" => 0,
            "XRPUSDT" => 0,
            "DOTUSDT" => 1,
            "MATICUSDT" => 0,
            "LINKUSDT" => 1,
            "UNIUSDT" => 1,
            "LTCUSDT" => 2,
            "ATOMUSDT" => 1,
            "NEARUSDT" => 0,
            s if s.contains("BTC") => 3,
            s if s.contains("ETH") => 3,
            s if s.contains("BNB") => 2,
            s if s.contains("SOL") => 1,
            s if s.contains("ADA") => 0,
            s if s.contains("XRP") => 0,
            s if s.contains("DOGE") => 0,
            s if s.contains("DOT") => 1,
            s if s.contains("AVAX") => 1,
            s if s.contains("MATIC") => 0,
            s if s.contains("LINK") => 1,
            s if s.contains("UNI") => 1,
            s if s.contains("LTC") => 2,
            s if s.contains("ATOM") => 1,
            s if s.contains("NEAR") => 0,
            _ => 3,  // Default precision
        };

        // Use the exact quantity from the trading system with appropriate precision
        let qty_str = format!("{:.prec$}", qty, prec = precision);
        info!("💰 DYNAMIC Using calculated quantity {} for {} (precision: {})", qty_str, symbol, precision);
        json_body.insert("qty".to_string(), json!(qty_str));

        if let Some(p) = price {
            // Format price with appropriate precision
            let price_str = format!("{:.2}", p);
            json_body.insert("price".to_string(), json!(price_str));
        }

        if let Some(sl) = stop_loss {
            // Format stop loss with appropriate precision
            let sl_str = format!("{:.2}", sl);
            json_body.insert("stopLoss".to_string(), json!(sl_str));
        }

        if let Some(tp) = take_profit {
            // Format take profit with appropriate precision
            let tp_str = format!("{:.2}", tp);
            json_body.insert("takeProfit".to_string(), json!(tp_str));
        }

        json_body.insert("timeInForce".to_string(), json!(time_in_force.unwrap_or("GTC")));

        // Add position mode (required for linear contracts)
        json_body.insert("positionIdx".to_string(), json!(0)); // 0: One-Way Mode

        // 💰 DYNAMIC LEVERAGE: Do not hardcode leverage in order placement
        // Leverage should be set separately via set_leverage() method
        // Remove hardcoded leverage from order placement

        // Create a JSON string from the body for signature generation
        let json_string = serde_json::to_string(&json_body)?;

        // Generate timestamp and signature
        let timestamp = self.get_timestamp();

        // Create the string to sign: timestamp + api_key + recv_window + request_body
        let string_to_sign = format!("{}{}{}{}", timestamp, self.api_key, "5000", json_string);

        info!("String to sign for order: {}", string_to_sign);

        // Create HMAC-SHA256 signature
        let mut mac = Hmac::<Sha256>::new_from_slice(self.api_secret.as_bytes())
            .expect("HMAC can take key of any size");

        mac.update(string_to_sign.as_bytes());

        // Convert to hex string
        let result = mac.finalize();
        let bytes = result.into_bytes();

        let signature = bytes.iter()
            .map(|b| format!("{:02x}", b))
            .collect::<String>();

        info!("Placing order with params: {}", json_string);
        info!("API Key: {}", self.api_key);
        info!("Timestamp: {}", timestamp);
        info!("Signature: {}", signature);

        let response_text = self.client.post(&url)
            .body(json_string.clone())
            .header("Content-Type", "application/json")
            .header("X-BAPI-API-KEY", &self.api_key)
            .header("X-BAPI-SIGN", signature)
            .header("X-BAPI-TIMESTAMP", timestamp.to_string())
            .header("X-BAPI-RECV-WINDOW", "5000")
            .send()
            .await?
            .text()
            .await?;

        info!("Order response: {}", response_text);

        let json_response = serde_json::from_str::<serde_json::Value>(&response_text)?;

        if let Some(ret_code) = json_response.get("retCode") {
            if ret_code.as_i64() != Some(0) {
                let ret_msg = json_response.get("retMsg").and_then(|v| v.as_str()).unwrap_or("Unknown error");
                return Err(anyhow::anyhow!("Bybit API error: {}", ret_msg));
            }
        }

        let order_id = json_response
            .get("result")
            .and_then(|v| v.get("orderId"))
            .and_then(|v| v.as_str())
            .unwrap_or("unknown")
            .to_string();

        // Log successful order placement with details
        println!("Successfully placed order: ID={}, Symbol={}, Side={}, Type={}, Qty={}",
                 order_id, symbol, side, order_type, qty);

        Ok(order_id)
    }

    /// Get historical candles
    pub async fn get_historical_candles(
        &self,
        symbol: &str,
        interval: &str,
        start_time: Option<i64>,
        end_time: Option<i64>,
        limit: Option<usize>,
    ) -> Result<Vec<Candle>> {
        let base_url = format!("{}/v5/market/kline", self.base_url);

        // Create parameters
        let mut params = HashMap::new();
        params.insert("category".to_string(), "spot".to_string());
        params.insert("symbol".to_string(), symbol.to_string());
        params.insert("interval".to_string(), interval.to_string());

        if let Some(st) = start_time {
            params.insert("start".to_string(), st.to_string());
        }

        if let Some(et) = end_time {
            params.insert("end".to_string(), et.to_string());
        }

        if let Some(l) = limit {
            params.insert("limit".to_string(), l.to_string());
        }

        // Sort parameters alphabetically for consistent query string
        let mut sorted_params: Vec<(&String, &String)> = params.iter().collect();
        sorted_params.sort_by(|a, b| a.0.cmp(b.0));

        // Create query string
        let query_string = sorted_params.iter()
            .map(|(k, v)| format!("{}={}", k, v))
            .collect::<Vec<String>>()
            .join("&");

        // Create full URL with query string
        let url = format!("{base_url}?{query_string}");

        // Make the request
        let response_text = self.client.get(&url)
            .send()
            .await?
            .text()
            .await?;

        // Parse the response
        let json_response = serde_json::from_str::<serde_json::Value>(&response_text)?;

        if let Some(ret_code) = json_response.get("retCode") {
            if ret_code.as_i64() != Some(0) {
                let ret_msg = json_response.get("retMsg").and_then(|v| v.as_str()).unwrap_or("Unknown error");
                return Err(anyhow::anyhow!("Bybit API error: {}", ret_msg));
            }
        }

        // Extract candles from response
        let mut candles = Vec::new();

        if let Some(result) = json_response.get("result") {
            if let Some(list) = result.get("list") {
                if let Some(list_array) = list.as_array() {
                    for item in list_array {
                        if let Some(item_array) = item.as_array() {
                            if item_array.len() >= 7 {
                                let timestamp_str = item_array[0].as_str().unwrap_or("0");
                                let timestamp = timestamp_str.parse::<i64>().unwrap_or(0) / 1000; // Convert from milliseconds to seconds

                                let open_str = item_array[1].as_str().unwrap_or("0");
                                let high_str = item_array[2].as_str().unwrap_or("0");
                                let low_str = item_array[3].as_str().unwrap_or("0");
                                let close_str = item_array[4].as_str().unwrap_or("0");
                                let volume_str = item_array[5].as_str().unwrap_or("0");

                                let open = open_str.parse::<f64>().unwrap_or(0.0);
                                let high = high_str.parse::<f64>().unwrap_or(0.0);
                                let low = low_str.parse::<f64>().unwrap_or(0.0);
                                let close = close_str.parse::<f64>().unwrap_or(0.0);
                                let volume = volume_str.parse::<f64>().unwrap_or(0.0);

                                let candle = Candle {
                                    timestamp: chrono::Utc.timestamp_opt(timestamp, 0).unwrap(),
                                    open,
                                    high,
                                    low,
                                    close,
                                    volume,
                                };

                                candles.push(candle);
                            }
                        }
                    }
                }
            }
        }

        // Sort candles by timestamp (oldest first)
        candles.sort_by(|a, b| a.timestamp.cmp(&b.timestamp));

        Ok(candles)
    }

    /// Get order status
    pub async fn get_order_status(&self, symbol: &str, order_id: &str) -> Result<String> {
        let base_url = format!("{}/v5/order/realtime", self.base_url);

        // Create parameters
        let mut params = HashMap::new();
        params.insert("category".to_string(), "linear".to_string());
        params.insert("symbol".to_string(), symbol.to_string());
        params.insert("orderId".to_string(), order_id.to_string());

        // Sort parameters alphabetically for consistent query string
        let mut sorted_params: Vec<(&String, &String)> = params.iter().collect();
        sorted_params.sort_by(|a, b| a.0.cmp(b.0));

        // Create query string
        let query_string = sorted_params.iter()
            .map(|(k, v)| format!("{}={}", k, v))
            .collect::<Vec<String>>()
            .join("&");

        // Create full URL with query string
        let url = format!("{base_url}?{query_string}");

        // Generate timestamp
        let timestamp = self.get_timestamp();

        // Create the string to sign: timestamp + api_key + recv_window + query_string
        let string_to_sign = format!("{}{}{}{}", timestamp, self.api_key, "5000", query_string);

        info!("String to sign for order status: {}", string_to_sign);

        // Create HMAC-SHA256 signature
        let mut mac = Hmac::<Sha256>::new_from_slice(self.api_secret.as_bytes())
            .expect("HMAC can take key of any size");

        mac.update(string_to_sign.as_bytes());

        // Convert to hex string
        let result = mac.finalize();
        let bytes = result.into_bytes();

        let signature = bytes.iter()
            .map(|b| format!("{:02x}", b))
            .collect::<String>();

        // Make the request
        let response_text = self.client.get(&url)
            .header("X-BAPI-API-KEY", &self.api_key)
            .header("X-BAPI-SIGN", signature)
            .header("X-BAPI-TIMESTAMP", timestamp.to_string())
            .header("X-BAPI-RECV-WINDOW", "5000")
            .send()
            .await?
            .text()
            .await?;

        println!("Order status response: {}", response_text);

        let json_response = serde_json::from_str::<serde_json::Value>(&response_text)?;

        if let Some(ret_code) = json_response.get("retCode") {
            if ret_code.as_i64() == Some(0) {
                if let Some(result) = json_response.get("result") {
                    if let Some(list) = result.get("list") {
                        if let Some(list_array) = list.as_array() {
                            if let Some(order) = list_array.get(0) {
                                if let Some(status) = order.get("orderStatus") {
                                    if let Some(status_str) = status.as_str() {
                                        return Ok(status_str.to_string());
                                    }
                                }
                            }
                        }
                    }
                }
                return Ok("Unknown".to_string());
            } else {
                let ret_msg = json_response.get("retMsg").and_then(|v| v.as_str()).unwrap_or("Unknown error");
                return Err(anyhow::anyhow!("Bybit API error: {}", ret_msg));
            }
        }

        Ok("Unknown".to_string())
    }

    /// Set leverage for a symbol
    pub async fn set_leverage(&self, symbol: &str, leverage: u32) -> Result<()> {
        let url = format!("{}/v5/position/set-leverage", self.base_url);

        // Create a JSON object for the request body
        let mut json_body = serde_json::Map::new();

        // Use linear category for futures trading
        json_body.insert("category".to_string(), json!("linear"));
        json_body.insert("symbol".to_string(), json!(symbol));
        json_body.insert("buyLeverage".to_string(), json!(leverage.to_string()));
        json_body.insert("sellLeverage".to_string(), json!(leverage.to_string()));

        // Create a JSON string from the body for signature generation
        let json_string = serde_json::to_string(&json_body)?;

        // Generate timestamp
        let timestamp = self.get_timestamp();

        // Create the string to sign: timestamp + api_key + recv_window + request_body
        let string_to_sign = format!("{}{}{}{}", timestamp, self.api_key, "5000", json_string);

        // Create HMAC-SHA256 signature
        let mut mac = Hmac::<Sha256>::new_from_slice(self.api_secret.as_bytes())
            .expect("HMAC can take key of any size");

        mac.update(string_to_sign.as_bytes());

        // Convert to hex string
        let result = mac.finalize();
        let bytes = result.into_bytes();

        let signature = bytes.iter()
            .map(|b| format!("{:02x}", b))
            .collect::<String>();

        // Send request
        let response = self.client.post(&url)
            .body(json_string.clone())
            .header("Content-Type", "application/json")
            .header("X-BAPI-API-KEY", &self.api_key)
            .header("X-BAPI-SIGN", signature)
            .header("X-BAPI-TIMESTAMP", timestamp.to_string())
            .header("X-BAPI-RECV-WINDOW", "5000")
            .send()
            .await?;

        // Get response text
        let response_text = response.text().await?;

        // Parse response
        let json_response: serde_json::Value = serde_json::from_str(&response_text)?;

        if let Some(ret_code) = json_response.get("retCode") {
            if ret_code.as_i64() == Some(0) {
                info!("Successfully set leverage for {}: {}x", symbol, leverage);
                Ok(())
            } else {
                let ret_msg = json_response.get("retMsg").and_then(|v| v.as_str()).unwrap_or("Unknown error");

                // Special case: if the leverage is already set, consider it a success
                if ret_msg.contains("leverage not modified") {
                    info!("Leverage set to {}x for {}", leverage, symbol);
                    return Ok(());
                }

                error!("Failed to set leverage: {}", ret_msg);
                Err(anyhow!("Failed to set leverage: {}", ret_msg))
            }
        } else {
            error!("Invalid response format: {}", response_text);
            Err(anyhow!("Invalid response format: {}", response_text))
        }
    }

    /// Place order with retry
    pub async fn place_order_with_retry(&self,
                                      symbol: &str,
                                      side: &str,
                                      order_type: &str,
                                      qty: f64,
                                      price: Option<f64>,
                                      stop_loss: Option<f64>,
                                      take_profit: Option<f64>,
                                      time_in_force: Option<&str>,
                                      max_retries: usize) -> Result<String> {
        let mut retries = 0;
        let mut last_error = None;

        while retries < max_retries {
            match self.place_order(symbol, side, order_type, qty, price, stop_loss, take_profit, time_in_force).await {
                Ok(order_id) => {
                    info!("Order placed successfully after {} retries", retries);
                    return Ok(order_id);
                },
                Err(e) => {
                    error!("Order placement failed (attempt {}/{}): {}", retries + 1, max_retries, e);
                    last_error = Some(e);
                    retries += 1;

                    // Wait before retrying (exponential backoff)
                    let wait_time = std::time::Duration::from_millis(500 * 2_u64.pow(retries as u32));
                    info!("Waiting {:?} before retrying...", wait_time);
                    tokio::time::sleep(wait_time).await;
                }
            }
        }

        Err(last_error.unwrap_or_else(|| anyhow::anyhow!("Failed to place order after {} retries", max_retries)))
    }



    /// Get positions
    pub async fn get_positions(&self, symbol_opt: Option<&str>) -> Result<Vec<Position>> {
        let base_url = format!("{}/v5/position/list", self.base_url);

        // Create parameters
        let mut params = HashMap::new();
        params.insert("category".to_string(), "linear".to_string());

        // Add symbol if provided, otherwise use settleCoin
        if let Some(symbol) = symbol_opt {
            params.insert("symbol".to_string(), symbol.to_string());
        } else {
            // If no specific symbol, get all USDT positions
            params.insert("settleCoin".to_string(), "USDT".to_string());
        }

        // Sort parameters alphabetically for consistent query string
        let mut sorted_params: Vec<(&String, &String)> = params.iter().collect();
        sorted_params.sort_by(|a, b| a.0.cmp(b.0));

        // Create query string
        let query_string = sorted_params.iter()
            .map(|(k, v)| format!("{k}={v}"))
            .collect::<Vec<String>>()
            .join("&");

        // Create full URL with query string
        let url = format!("{base_url}?{query_string}");

        // Generate timestamp
        let timestamp = self.get_timestamp();

        // Create the string to sign: timestamp + api_key + recv_window + query_string
        let string_to_sign = format!("{}{}{}{}", timestamp, self.api_key, "5000", query_string);

        // Create HMAC-SHA256 signature
        let mut mac = Hmac::<Sha256>::new_from_slice(self.api_secret.as_bytes())
            .expect("HMAC can take key of any size");

        mac.update(string_to_sign.as_bytes());

        // Convert to hex string
        let result = mac.finalize();
        let bytes = result.into_bytes();

        let signature = bytes.iter()
            .map(|b| format!("{:02x}", b))
            .collect::<String>();

        // Make the request
        let response_text = self.client.get(&url)
            .header("X-BAPI-API-KEY", &self.api_key)
            .header("X-BAPI-SIGN", signature)
            .header("X-BAPI-TIMESTAMP", timestamp.to_string())
            .header("X-BAPI-RECV-WINDOW", "5000")
            .send()
            .await?
            .text()
            .await?;

        // Parse response
        let json_response: serde_json::Value = serde_json::from_str(&response_text)?;

        let mut positions = Vec::new();

        if let Some(ret_code) = json_response.get("retCode") {
            if ret_code.as_i64() == Some(0) {
                if let Some(result) = json_response.get("result") {
                    if let Some(list) = result.get("list") {
                        if let Some(list_array) = list.as_array() {
                            for position in list_array {
                                // Only include positions with non-zero size
                                if let Some(size) = position.get("size") {
                                    let size_value = size.as_str().unwrap_or("0").parse::<f64>().unwrap_or(0.0);

                                    if size_value > 0.0 {
                                        let symbol = position.get("symbol")
                                            .and_then(|v| v.as_str())
                                            .unwrap_or("").to_string();

                                        let side = position.get("side")
                                            .and_then(|v| v.as_str())
                                            .unwrap_or("").to_string();

                                        let entry_price = position.get("entryPrice")
                                            .and_then(|v| v.as_str())
                                            .unwrap_or("0")
                                            .parse::<f64>()
                                            .unwrap_or(0.0);

                                        let leverage = position.get("leverage")
                                            .and_then(|v| v.as_str())
                                            .unwrap_or("1")
                                            .parse::<u32>()
                                            .unwrap_or(1);

                                        let unrealized_pnl = position.get("unrealisedPnl")
                                            .and_then(|v| v.as_str())
                                            .unwrap_or("0")
                                            .parse::<f64>()
                                            .unwrap_or(0.0);

                                        positions.push(Position {
                                            symbol,
                                            side,
                                            size: size_value,
                                            entry_price,
                                            leverage,
                                            unrealized_pnl,
                                        });
                                    }
                                }
                            }
                        }
                    }
                }

                Ok(positions)
            } else {
                let ret_msg = json_response.get("retMsg").and_then(|v| v.as_str()).unwrap_or("Unknown error");
                error!("Failed to get positions: {}", ret_msg);
                Err(anyhow!("Failed to get positions: {}", ret_msg))
            }
        } else {
            error!("Invalid response format: {}", response_text);
            Err(anyhow!("Invalid response format: {}", response_text))
        }
    }
}
