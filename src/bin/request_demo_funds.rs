use std::env;
use dotenv::dotenv;
use anyhow::Result;
use reqwest::Client;
use serde_json::{json, Value};
use hmac::{Hmac, Mac};
use sha2::Sha256;
use std::time::{SystemTime, UNIX_EPOCH};

#[tokio::main]
async fn main() -> Result<()> {
    // Load environment variables from demo.env
    dotenv::from_path("demo.env").ok();

    // Get API credentials from environment variables
    let api_key = env::var("BYBIT_DEMO_API_KEY").expect("BYBIT_DEMO_API_KEY not set");
    let api_secret = env::var("BYBIT_DEMO_API_SECRET").expect("BYBIT_DEMO_API_SECRET not set");

    println!("Using API Key: {}", api_key);

    // Create HTTP client
    let client = Client::new();

    // Base URL for Bybit demo API
    let base_url = "https://api-demo.bybit.com";

    // Request demo funds
    let url = format!("{}/v5/account/demo-apply-money", base_url);

    // Create request body
    let mut json_body = serde_json::Map::new();
    json_body.insert("adjustType".to_string(), json!(0)); // 0: add funds

    let mut coin_entry = serde_json::Map::new();
    coin_entry.insert("coin".to_string(), json!("USDT"));
    coin_entry.insert("amountStr".to_string(), json!("10000")); // Request 10,000 USDT

    let coins_array = vec![coin_entry];
    json_body.insert("utaDemoApplyMoney".to_string(), json!(coins_array));

    // Create a JSON string from the body for signature generation
    let json_string = serde_json::to_string(&json_body)?;

    // Generate timestamp
    let timestamp_millis = SystemTime::now()
        .duration_since(UNIX_EPOCH)?
        .as_millis();
    let timestamp = timestamp_millis.to_string();

    // Create the string to sign: timestamp + api_key + recv_window + request_body
    let string_to_sign = format!("{}{}{}{}", timestamp, api_key, "5000", json_string);

    println!("String to sign: {}", string_to_sign);

    // Create HMAC-SHA256 signature
    let mut mac = Hmac::<Sha256>::new_from_slice(api_secret.as_bytes())
        .expect("HMAC can take key of any size");

    mac.update(string_to_sign.as_bytes());

    // Convert to hex string
    let result = mac.finalize();
    let bytes = result.into_bytes();

    let signature = bytes.iter()
        .map(|b| format!("{:02x}", b))
        .collect::<String>();

    println!("Signature: {}", signature);
    println!("Requesting demo funds with params: {}", json_string);

    // Send request
    let response = client.post(&url)
        .body(json_string.clone())
        .header("Content-Type", "application/json")
        .header("X-BAPI-API-KEY", &api_key)
        .header("X-BAPI-SIGN", signature)
        .header("X-BAPI-TIMESTAMP", timestamp)
        .header("X-BAPI-RECV-WINDOW", "5000")
        .send()
        .await?;

    // Get response text
    let response_text = response.text().await?;
    println!("Response: {}", response_text);

    // Parse response
    let json_response: Value = serde_json::from_str(&response_text)?;

    if let Some(ret_code) = json_response.get("retCode") {
        if ret_code.as_i64() == Some(0) {
            println!("Successfully requested demo funds!");
        } else {
            let ret_msg = json_response.get("retMsg").and_then(|v| v.as_str()).unwrap_or("Unknown error");
            println!("Failed to request demo funds: {}", ret_msg);
        }
    }

    // Now let's check the wallet balance
    let wallet_url = format!("{}/v5/account/wallet-balance", base_url);

    // Create query parameters
    let mut params = std::collections::HashMap::new();
    params.insert("accountType".to_string(), "UNIFIED".to_string());
    params.insert("coin".to_string(), "USDT".to_string());

    // Create query string
    let query_string = serde_urlencoded::to_string(&params)?;

    // Generate a new timestamp for the wallet balance request
    let wallet_timestamp_millis = SystemTime::now()
        .duration_since(UNIX_EPOCH)?
        .as_millis();
    let wallet_timestamp = wallet_timestamp_millis.to_string();

    // Create the string to sign: timestamp + api_key + recv_window + query_string
    let string_to_sign = format!("{}{}{}{}", wallet_timestamp, api_key, "5000", query_string);

    println!("String to sign for wallet balance: {}", string_to_sign);

    // Create HMAC-SHA256 signature
    let mut mac = Hmac::<Sha256>::new_from_slice(api_secret.as_bytes())
        .expect("HMAC can take key of any size");

    mac.update(string_to_sign.as_bytes());

    // Convert to hex string
    let result = mac.finalize();
    let bytes = result.into_bytes();

    let signature = bytes.iter()
        .map(|b| format!("{:02x}", b))
        .collect::<String>();

    // Send request
    let wallet_response = client.get(&format!("{}?{}", wallet_url, query_string))
        .header("Content-Type", "application/json")
        .header("X-BAPI-API-KEY", &api_key)
        .header("X-BAPI-SIGN", signature)
        .header("X-BAPI-TIMESTAMP", wallet_timestamp)
        .header("X-BAPI-RECV-WINDOW", "5000")
        .send()
        .await?;

    // Get response text
    let wallet_response_text = wallet_response.text().await?;
    println!("Wallet Balance Response: {}", wallet_response_text);

    Ok(())
}
