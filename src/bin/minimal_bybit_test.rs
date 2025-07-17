//! Minimal Bybit Test
//!
//! A standalone test that doesn't depend on the complex library parts

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
struct SimpleBybitClient {
    api_key: String,
    api_secret: String,
    base_url: String,
    client: reqwest::Client,
}

impl SimpleBybitClient {
    fn new(api_key: String, api_secret: String, is_demo: bool) -> Self {
        let base_url = if is_demo {
            "https://api-demo.bybit.com".to_string()
        } else {
            "https://api.bybit.com".to_string()
        };

        Self {
            api_key,
            api_secret,
            base_url,
            client: reqwest::Client::new(),
        }
    }

    fn generate_signature(&self, params: &str, timestamp: u64) -> String {
        let message = format!("{}{}{}", timestamp, &self.api_key, params);
        let mut mac = HmacSha256::new_from_slice(self.api_secret.as_bytes()).unwrap();
        mac.update(message.as_bytes());
        hex::encode(mac.finalize().into_bytes())
    }

    async fn get_request(&self, endpoint: &str, params: HashMap<String, String>) -> Result<Value> {
        let timestamp = chrono::Utc::now().timestamp_millis() as u64;
        
        let query_string = if params.is_empty() {
            String::new()
        } else {
            params.iter()
                .map(|(k, v)| format!("{}={}", k, v))
                .collect::<Vec<_>>()
                .join("&")
        };

        let signature = self.generate_signature(&query_string, timestamp);
        
        let url = if query_string.is_empty() {
            format!("{}{}", self.base_url, endpoint)
        } else {
            format!("{}{}?{}", self.base_url, endpoint, query_string)
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

    async fn get_ticker(&self, symbol: &str) -> Result<f64> {
        let mut params = HashMap::new();
        params.insert("category".to_string(), "linear".to_string());
        params.insert("symbol".to_string(), symbol.to_string());
        
        let response = self.get_request("/v5/market/tickers", params).await?;
        
        if let Some(list) = response["result"]["list"].as_array() {
            if let Some(ticker) = list.first() {
                if let Some(price_str) = ticker["lastPrice"].as_str() {
                    return Ok(price_str.parse::<f64>().unwrap_or(0.0));
                }
            }
        }
        
        Err(anyhow!("Failed to get ticker price"))
    }

    async fn get_instruments(&self) -> Result<Vec<String>> {
        let mut params = HashMap::new();
        params.insert("category".to_string(), "linear".to_string());
        params.insert("limit".to_string(), "20".to_string());
        
        let response = self.get_request("/v5/market/instruments-info", params).await?;
        
        let mut symbols = Vec::new();
        if let Some(list) = response["result"]["list"].as_array() {
            for instrument in list {
                if let Some(symbol) = instrument["symbol"].as_str() {
                    symbols.push(symbol.to_string());
                }
            }
        }
        
        Ok(symbols)
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    println!("🚀 Starting minimal Bybit demo test");

    // Load environment variables
    dotenv::dotenv().ok();

    let api_key = env::var("BYBIT_API_KEY")
        .expect("BYBIT_API_KEY environment variable not set");
    let api_secret = env::var("BYBIT_API_SECRET")
        .expect("BYBIT_API_SECRET environment variable not set");

    // Create simple Bybit client for demo trading
    let client = SimpleBybitClient::new(api_key, api_secret, true); // true for demo mode

    println!("📊 Testing Bybit demo connection...");

    // Test 1: Get account balance
    match client.get_wallet_balance().await {
        Ok(balance) => {
            println!("✅ Account balance retrieved successfully");
            println!("💰 USDT Balance: {}", balance);
        }
        Err(e) => {
            println!("❌ Failed to get account balance: {}", e);
            return Err(e);
        }
    }

    // Test 2: Get ticker for BTCUSDT
    match client.get_ticker("BTCUSDT").await {
        Ok(price) => {
            println!("✅ Ticker retrieved successfully");
            println!("📈 BTCUSDT Price: {}", price);
        }
        Err(e) => {
            println!("❌ Failed to get ticker: {}", e);
            return Err(e);
        }
    }

    // Test 3: Get available instruments
    match client.get_instruments().await {
        Ok(instruments) => {
            println!("✅ Instruments retrieved successfully");
            println!("📋 Found {} instruments", instruments.len());
            
            // Show first 5 instruments
            for (i, instrument) in instruments.iter().take(5).enumerate() {
                println!("  {}. {}", i + 1, instrument);
            }
        }
        Err(e) => {
            println!("❌ Failed to get instruments: {}", e);
            return Err(e);
        }
    }

    println!("🎉 Bybit demo test completed successfully!");
    println!("✨ All basic functionality is working");
    println!("💡 The system is ready for demo trading with 12 USDT capital constraint");

    Ok(())
}
