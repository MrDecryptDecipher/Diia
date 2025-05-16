use std::env;
use dotenv::dotenv;
use anyhow::{anyhow, Result};
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
    
    // Check account info
    let account_url = format!("{}/v5/account/info", base_url);
    
    // Generate timestamp
    let timestamp_millis = SystemTime::now()
        .duration_since(UNIX_EPOCH)?
        .as_millis();
    let timestamp = timestamp_millis.to_string();
    
    // Create the string to sign: timestamp + api_key + recv_window + query_string
    let string_to_sign = format!("{}{}{}", timestamp, api_key, "5000");
    
    println!("String to sign for account info: {}", string_to_sign);
    
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
    let account_response = client.get(&account_url)
        .header("Content-Type", "application/json")
        .header("X-BAPI-API-KEY", &api_key)
        .header("X-BAPI-SIGN", signature)
        .header("X-BAPI-TIMESTAMP", timestamp)
        .header("X-BAPI-RECV-WINDOW", "5000")
        .send()
        .await?;
    
    // Get response text
    let account_response_text = account_response.text().await?;
    println!("Account Info Response: {}", account_response_text);
    
    // Check API key info
    let api_key_url = format!("{}/v5/user/query-api", base_url);
    
    // Generate a new timestamp for the API key info request
    let api_key_timestamp_millis = SystemTime::now()
        .duration_since(UNIX_EPOCH)?
        .as_millis();
    let api_key_timestamp = api_key_timestamp_millis.to_string();
    
    // Create the string to sign: timestamp + api_key + recv_window + query_string
    let api_key_string_to_sign = format!("{}{}{}", api_key_timestamp, api_key, "5000");
    
    println!("String to sign for API key info: {}", api_key_string_to_sign);
    
    // Create HMAC-SHA256 signature
    let mut api_key_mac = Hmac::<Sha256>::new_from_slice(api_secret.as_bytes())
        .expect("HMAC can take key of any size");
    
    api_key_mac.update(api_key_string_to_sign.as_bytes());
    
    // Convert to hex string
    let api_key_result = api_key_mac.finalize();
    let api_key_bytes = api_key_result.into_bytes();
    
    let api_key_signature = api_key_bytes.iter()
        .map(|b| format!("{:02x}", b))
        .collect::<String>();
    
    // Send request
    let api_key_response = client.get(&api_key_url)
        .header("Content-Type", "application/json")
        .header("X-BAPI-API-KEY", &api_key)
        .header("X-BAPI-SIGN", api_key_signature)
        .header("X-BAPI-TIMESTAMP", api_key_timestamp)
        .header("X-BAPI-RECV-WINDOW", "5000")
        .send()
        .await?;
    
    // Get response text
    let api_key_response_text = api_key_response.text().await?;
    println!("API Key Info Response: {}", api_key_response_text);
    
    Ok(())
}
