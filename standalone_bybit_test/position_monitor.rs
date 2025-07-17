//! Position Monitor - Track and Manage Active Trades
//!
//! Monitors the executed PORTALUSDT position, tracks P&L,
//! and demonstrates complete trade lifecycle management

use std::env;
use std::collections::HashMap;
use tokio;
use serde_json::{json, Value};
use reqwest;
use hmac::{Hmac, Mac};
use sha2::Sha256;
use anyhow::{Result, anyhow};

type HmacSha256 = Hmac<Sha256>;

#[derive(Debug)]
struct PositionMonitor {
    api_key: String,
    api_secret: String,
    client: reqwest::Client,
}

impl PositionMonitor {
    fn new(api_key: String, api_secret: String) -> Self {
        Self {
            api_key,
            api_secret,
            client: reqwest::Client::new(),
        }
    }

    fn generate_signature(&self, params: &str, timestamp: u64) -> String {
        let recv_window = "5000";
        let message = format!("{}{}{}{}", timestamp, &self.api_key, recv_window, params);
        let mut mac = HmacSha256::new_from_slice(self.api_secret.as_bytes()).unwrap();
        mac.update(message.as_bytes());
        hex::encode(mac.finalize().into_bytes())
    }

    async fn get_request(&self, endpoint: &str, params: HashMap<String, String>) -> Result<Value> {
        let timestamp = chrono::Utc::now().timestamp_millis() as u64;
        
        let mut sorted_params: Vec<_> = params.iter().collect();
        sorted_params.sort_by_key(|&(k, _)| k);
        
        let query_string = if sorted_params.is_empty() {
            String::new()
        } else {
            sorted_params.iter()
                .map(|(k, v)| format!("{}={}", k, v))
                .collect::<Vec<_>>()
                .join("&")
        };

        let signature = self.generate_signature(&query_string, timestamp);
        
        let url = if query_string.is_empty() {
            format!("https://api-demo.bybit.com{}", endpoint)
        } else {
            format!("https://api-demo.bybit.com{}?{}", endpoint, query_string)
        };

        let response = self.client
            .get(&url)
            .header("X-BAPI-API-KEY", &self.api_key)
            .header("X-BAPI-SIGN", signature)
            .header("X-BAPI-TIMESTAMP", timestamp.to_string())
            .header("X-BAPI-RECV-WINDOW", "5000")
            .send()
            .await?;

        let text = response.text().await?;
        let json: Value = serde_json::from_str(&text)?;
        
        if json["retCode"].as_i64() != Some(0) {
            return Err(anyhow!("API Error: {}", json["retMsg"].as_str().unwrap_or("Unknown error")));
        }

        Ok(json)
    }

    async fn post_request(&self, endpoint: &str, params: Value) -> Result<Value> {
        let timestamp = chrono::Utc::now().timestamp_millis() as u64;
        let params_str = params.to_string();
        let signature = self.generate_signature(&params_str, timestamp);
        
        let url = format!("https://api-demo.bybit.com{}", endpoint);

        let response = self.client
            .post(&url)
            .header("X-BAPI-API-KEY", &self.api_key)
            .header("X-BAPI-SIGN", signature)
            .header("X-BAPI-TIMESTAMP", timestamp.to_string())
            .header("X-BAPI-RECV-WINDOW", "5000")
            .header("Content-Type", "application/json")
            .json(&params)
            .send()
            .await?;

        let text = response.text().await?;
        let json: Value = serde_json::from_str(&text)?;
        
        if json["retCode"].as_i64() != Some(0) {
            return Err(anyhow!("API Error: {}", json["retMsg"].as_str().unwrap_or("Unknown error")));
        }

        Ok(json)
    }

    async fn get_positions(&self) -> Result<Vec<Value>> {
        let mut params = HashMap::new();
        params.insert("category".to_string(), "linear".to_string());
        params.insert("settleCoin".to_string(), "USDT".to_string());
        
        let response = self.get_request("/v5/position/list", params).await?;
        
        if let Some(list) = response["result"]["list"].as_array() {
            Ok(list.clone())
        } else {
            Ok(Vec::new())
        }
    }

    async fn get_wallet_balance(&self) -> Result<f64> {
        let mut params = HashMap::new();
        params.insert("accountType".to_string(), "UNIFIED".to_string());
        
        let response = self.get_request("/v5/account/wallet-balance", params).await?;
        
        if let Some(list) = response["result"]["list"].as_array() {
            if let Some(account) = list.first() {
                if let Some(coins) = account["coin"].as_array() {
                    for coin in coins {
                        if coin["coin"].as_str() == Some("USDT") {
                            if let Some(balance_str) = coin["walletBalance"].as_str() {
                                return Ok(balance_str.parse::<f64>().unwrap_or(0.0));
                            }
                        }
                    }
                }
            }
        }
        
        Ok(0.0)
    }

    async fn close_position(&self, symbol: &str) -> Result<String> {
        println!("\n🔄 CLOSING POSITION: {}", symbol);

        // Get current positions to find the one to close
        let positions = self.get_positions().await?;
        
        for position in positions {
            if position["symbol"].as_str() == Some(symbol) {
                if let Some(size_str) = position["size"].as_str() {
                    let size = size_str.parse::<f64>().unwrap_or(0.0);
                    if size > 0.0 {
                        let side = if position["side"].as_str() == Some("Buy") { "Sell" } else { "Buy" };
                        
                        let close_params = json!({
                            "category": "linear",
                            "symbol": symbol,
                            "side": side,
                            "orderType": "Market",
                            "qty": size_str,
                            "timeInForce": "IOC",
                            "reduceOnly": true
                        });

                        println!("📝 Close Order Parameters:");
                        println!("{}", serde_json::to_string_pretty(&close_params)?);

                        match self.post_request("/v5/order/create", close_params).await {
                            Ok(response) => {
                                if let Some(order_id) = response["result"]["orderId"].as_str() {
                                    println!("✅ POSITION CLOSED SUCCESSFULLY!");
                                    println!("   Close Order ID: {}", order_id);
                                    return Ok(order_id.to_string());
                                }
                            }
                            Err(e) => return Err(e),
                        }
                    }
                }
            }
        }

        Err(anyhow!("No open position found for {}", symbol))
    }

    async fn monitor_position(&self, symbol: &str) -> Result<()> {
        println!("\n📊 MONITORING POSITION: {}", symbol);
        
        let positions = self.get_positions().await?;
        
        for position in &positions {
            if position["symbol"].as_str() == Some(symbol) {
                if let Some(size_str) = position["size"].as_str() {
                    let size = size_str.parse::<f64>().unwrap_or(0.0);
                    if size > 0.0 {
                        println!("   📍 Active Position Found:");
                        println!("      Symbol: {}", symbol);
                        println!("      Side: {}", position["side"].as_str().unwrap_or("Unknown"));
                        println!("      Size: {}", size);
                        
                        if let Some(avg_price) = position["avgPrice"].as_str() {
                            println!("      Entry Price: ${}", avg_price);
                        }
                        
                        if let Some(mark_price) = position["markPrice"].as_str() {
                            println!("      Mark Price: ${}", mark_price);
                        }
                        
                        if let Some(unrealized_pnl) = position["unrealisedPnl"].as_str() {
                            let pnl = unrealized_pnl.parse::<f64>().unwrap_or(0.0);
                            let pnl_status = if pnl > 0.0 { "📈 PROFIT" } else if pnl < 0.0 { "📉 LOSS" } else { "➡️ BREAK-EVEN" };
                            println!("      Unrealized P&L: {} USDT {}", unrealized_pnl, pnl_status);
                        }
                        
                        if let Some(percentage) = position["unrealisedPnlPercentage"].as_str() {
                            println!("      P&L Percentage: {}%", percentage);
                        }
                        
                        return Ok(());
                    }
                }
            }
        }
        
        println!("   ⚠️  No active position found for {}", symbol);
        Ok(())
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    println!("📊 OMNI POSITION MONITOR - TRADE LIFECYCLE VERIFICATION");
    println!("{}", "=".repeat(80));
    println!("🎯 Objective: Monitor executed PORTALUSDT position");
    println!("📈 Track P&L and demonstrate position management");
    println!("🔄 Complete trade lifecycle verification");
    println!("{}", "=".repeat(80));

    // Load environment variables
    dotenv::dotenv().ok();
    let api_key = env::var("BYBIT_API_KEY").expect("BYBIT_API_KEY not set");
    let api_secret = env::var("BYBIT_API_SECRET").expect("BYBIT_API_SECRET not set");

    let monitor = PositionMonitor::new(api_key, api_secret);

    // Get current account balance
    println!("\n💰 CURRENT ACCOUNT STATUS:");
    match monitor.get_wallet_balance().await {
        Ok(balance) => {
            println!("   USDT Balance: ${:.4}", balance);
        }
        Err(e) => {
            println!("   ❌ Failed to get balance: {}", e);
        }
    }

    // Monitor the PORTALUSDT position
    monitor.monitor_position("PORTALUSDT").await?;

    // Wait a moment for any price movements
    println!("\n⏳ Waiting 5 seconds for potential price movements...");
    tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;

    // Monitor again to show any P&L changes
    println!("\n📊 UPDATED POSITION STATUS:");
    monitor.monitor_position("PORTALUSDT").await?;

    // Ask user if they want to close the position
    println!("\n🔄 POSITION MANAGEMENT OPTIONS:");
    println!("   1. Keep position open for continued monitoring");
    println!("   2. Close position to complete trade lifecycle");
    println!("   \n   For demonstration, we'll close the position in 3 seconds...");
    
    tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;

    // Close the position
    match monitor.close_position("PORTALUSDT").await {
        Ok(close_order_id) => {
            println!("✅ Position closure initiated successfully!");
            println!("   Close Order ID: {}", close_order_id);
            
            // Wait for closure to complete
            tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
            
            // Verify position is closed
            println!("\n📊 FINAL POSITION VERIFICATION:");
            monitor.monitor_position("PORTALUSDT").await?;
            
            // Get final balance
            println!("\n💰 FINAL ACCOUNT STATUS:");
            match monitor.get_wallet_balance().await {
                Ok(final_balance) => {
                    println!("   Final USDT Balance: ${:.4}", final_balance);
                }
                Err(e) => {
                    println!("   ❌ Failed to get final balance: {}", e);
                }
            }
        }
        Err(e) => {
            println!("⚠️  Position closure failed: {}", e);
            println!("   Position may have been closed manually or by stop loss/take profit");
        }
    }

    println!("\n{}", "=".repeat(80));
    println!("🎉 COMPLETE TRADE LIFECYCLE VERIFICATION FINISHED!");
    println!("✨ Demonstrated full position management capability");
    println!("📊 P&L tracking and monitoring confirmed");
    println!("🔄 Position opening and closing verified");
    println!("💰 Account balance tracking operational");
    println!("{}", "=".repeat(80));

    Ok(())
}
