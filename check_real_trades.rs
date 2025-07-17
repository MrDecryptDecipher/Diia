use std::env;
use serde_json::Value;
use reqwest;
use hmac::{Hmac, Mac};
use sha2::Sha256;
use std::time::{SystemTime, UNIX_EPOCH};

type HmacSha256 = Hmac<Sha256>;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("🔍 Checking Real Bybit Demo Account Status...");
    
    let api_key = env::var("BYBIT_API_KEY").expect("BYBIT_API_KEY not set");
    let api_secret = env::var("BYBIT_API_SECRET").expect("BYBIT_API_SECRET not set");
    
    println!("📊 API Key: {}...", &api_key[..8]);
    
    // Check account balance
    println!("\n💰 Checking Account Balance...");
    let balance = get_account_balance(&api_key, &api_secret).await?;
    println!("Balance Response: {}", balance);
    
    // Check recent orders
    println!("\n📋 Checking Recent Orders...");
    let orders = get_recent_orders(&api_key, &api_secret).await?;
    println!("Orders Response: {}", orders);
    
    // Check positions
    println!("\n📈 Checking Open Positions...");
    let positions = get_positions(&api_key, &api_secret).await?;
    println!("Positions Response: {}", positions);
    
    // Check order history
    println!("\n📜 Checking Order History...");
    let history = get_order_history(&api_key, &api_secret).await?;
    println!("Order History: {}", history);
    
    Ok(())
}

async fn get_account_balance(api_key: &str, api_secret: &str) -> Result<String, Box<dyn std::error::Error>> {
    let timestamp = SystemTime::now().duration_since(UNIX_EPOCH)?.as_millis().to_string();
    let recv_window = "5000";

    let params = "accountType=UNIFIED";
    let signature = sign_request(&timestamp, api_key, recv_window, params, api_secret);

    let url = format!("https://api-demo.bybit.com/v5/account/wallet-balance?{}", params);
    
    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .header("X-BAPI-API-KEY", api_key)
        .header("X-BAPI-TIMESTAMP", &timestamp)
        .header("X-BAPI-RECV-WINDOW", recv_window)
        .header("X-BAPI-SIGN", &signature)
        .send()
        .await?;
    
    Ok(response.text().await?)
}

async fn get_recent_orders(api_key: &str, api_secret: &str) -> Result<String, Box<dyn std::error::Error>> {
    let timestamp = SystemTime::now().duration_since(UNIX_EPOCH)?.as_millis().to_string();
    let recv_window = "5000";

    let params = "category=linear&limit=50";
    let signature = sign_request(&timestamp, api_key, recv_window, params, api_secret);

    let url = format!("https://api-demo.bybit.com/v5/order/realtime?{}", params);
    
    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .header("X-BAPI-API-KEY", api_key)
        .header("X-BAPI-TIMESTAMP", &timestamp)
        .header("X-BAPI-RECV-WINDOW", recv_window)
        .header("X-BAPI-SIGN", &signature)
        .send()
        .await?;
    
    Ok(response.text().await?)
}

async fn get_positions(api_key: &str, api_secret: &str) -> Result<String, Box<dyn std::error::Error>> {
    let timestamp = SystemTime::now().duration_since(UNIX_EPOCH)?.as_millis().to_string();
    let recv_window = "5000";

    let params = "category=linear";
    let signature = sign_request(&timestamp, api_key, recv_window, params, api_secret);

    let url = format!("https://api-demo.bybit.com/v5/position/list?{}", params);
    
    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .header("X-BAPI-API-KEY", api_key)
        .header("X-BAPI-TIMESTAMP", &timestamp)
        .header("X-BAPI-RECV-WINDOW", recv_window)
        .header("X-BAPI-SIGN", &signature)
        .send()
        .await?;
    
    Ok(response.text().await?)
}

async fn get_order_history(api_key: &str, api_secret: &str) -> Result<String, Box<dyn std::error::Error>> {
    let timestamp = SystemTime::now().duration_since(UNIX_EPOCH)?.as_millis().to_string();
    let recv_window = "5000";

    let params = "category=linear&limit=50";
    let signature = sign_request(&timestamp, api_key, recv_window, params, api_secret);

    let url = format!("https://api-demo.bybit.com/v5/order/history?{}", params);
    
    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .header("X-BAPI-API-KEY", api_key)
        .header("X-BAPI-TIMESTAMP", &timestamp)
        .header("X-BAPI-RECV-WINDOW", recv_window)
        .header("X-BAPI-SIGN", &signature)
        .send()
        .await?;
    
    Ok(response.text().await?)
}

fn sign_request(timestamp: &str, api_key: &str, recv_window: &str, params: &str, secret: &str) -> String {
    // Match OMNI adapter signature format: timestamp + api_key + recv_window + params
    let message = format!("{}{}{}{}", timestamp, api_key, recv_window, params);
    let mut mac = HmacSha256::new_from_slice(secret.as_bytes()).expect("HMAC can take key of any size");
    mac.update(message.as_bytes());
    hex::encode(mac.finalize().into_bytes())
}
