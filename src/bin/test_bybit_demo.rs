//! Test Bybit Demo Trading
//!
//! Simple test to verify Bybit demo API integration works

use std::env;
use anyhow::Result;
use rust_decimal_macros::dec;
use tracing::{info, error};

use omni::bybit::client::BybitClient;
use omni::bybit::types::{OrderSide, OrderType, TimeInForce};

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize logging
    tracing_subscriber::fmt()
        .with_env_filter("info")
        .init();
    
    info!("🧪 Testing Bybit Demo API Integration");
    
    // Get API credentials from environment variables
    let demo_api_key = env::var("BYBIT_DEMO_API_KEY")
        .expect("BYBIT_DEMO_API_KEY environment variable not set");
    let demo_api_secret = env::var("BYBIT_DEMO_API_SECRET")
        .expect("BYBIT_DEMO_API_SECRET environment variable not set");
    
    // Create demo client
    let demo_client = BybitClient::new(demo_api_key, demo_api_secret, true);
    
    info!("✅ Created Bybit demo client");
    
    // Test 1: Get account balance
    info!("🔍 Test 1: Getting account balance...");
    match demo_client.get_balance().await {
        Ok(balance) => {
            info!("✅ Account balance: {} {}", balance.available_balance, balance.currency);
        }
        Err(e) => {
            error!("❌ Failed to get balance: {}", e);
            return Err(e);
        }
    }
    
    // Test 2: Get ticker information
    info!("🔍 Test 2: Getting ticker for BTCUSDT...");
    match demo_client.get_ticker("BTCUSDT").await {
        Ok(ticker) => {
            info!("✅ BTCUSDT ticker: price={}, volume={}", ticker.last_price, ticker.volume_24h);
        }
        Err(e) => {
            error!("❌ Failed to get ticker: {}", e);
            return Err(e);
        }
    }
    
    // Test 3: Get orderbook
    info!("🔍 Test 3: Getting orderbook for BTCUSDT...");
    match demo_client.get_orderbook("BTCUSDT", 5).await {
        Ok(orderbook) => {
            info!("✅ BTCUSDT orderbook: {} bids, {} asks", orderbook.bids.len(), orderbook.asks.len());
            if let Some(best_bid) = orderbook.bids.first() {
                info!("   Best bid: {} @ {}", best_bid.size, best_bid.price);
            }
            if let Some(best_ask) = orderbook.asks.first() {
                info!("   Best ask: {} @ {}", best_ask.size, best_ask.price);
            }
        }
        Err(e) => {
            error!("❌ Failed to get orderbook: {}", e);
            return Err(e);
        }
    }
    
    // Test 4: Get instrument info
    info!("🔍 Test 4: Getting instrument info for BTCUSDT...");
    match demo_client.get_instrument_info("BTCUSDT").await {
        Ok(info) => {
            info!("✅ BTCUSDT instrument: min_qty={}, qty_step={}", info.min_order_qty, info.qty_step);
        }
        Err(e) => {
            error!("❌ Failed to get instrument info: {}", e);
            return Err(e);
        }
    }
    
    // Test 5: Set leverage
    info!("🔍 Test 5: Setting leverage for BTCUSDT...");
    match demo_client.set_leverage("BTCUSDT", 10).await {
        Ok(_) => {
            info!("✅ Leverage set to 10x for BTCUSDT");
        }
        Err(e) => {
            error!("❌ Failed to set leverage: {}", e);
            // Don't return error as this might fail if position exists
        }
    }
    
    // Test 6: Place a small demo order
    info!("🔍 Test 6: Placing small demo market order...");
    
    // Get current price first
    let ticker = demo_client.get_ticker("BTCUSDT").await?;
    let current_price = ticker.last_price;
    
    // Calculate very small quantity (about $1 worth)
    let order_value = dec!(1.0); // $1 worth
    let quantity = order_value / current_price;
    
    info!("📊 Current BTCUSDT price: {}", current_price);
    info!("📊 Order quantity: {} BTC (${} worth)", quantity, order_value);
    
    match demo_client.place_market_order("BTCUSDT", OrderSide::Buy, quantity).await {
        Ok(order_response) => {
            info!("✅ DEMO ORDER PLACED SUCCESSFULLY!");
            info!("   Order ID: {}", order_response.order_id);
            info!("   Symbol: {}", order_response.symbol);
            info!("   Side: {}", order_response.side.as_str());
            info!("   Quantity: {}", order_response.quantity);
            info!("   Status: {}", order_response.status);
            
            // Wait a moment then check order status
            tokio::time::sleep(std::time::Duration::from_secs(2)).await;
            
            info!("🔍 Checking order status...");
            match demo_client.get_order_status("BTCUSDT", &order_response.order_id).await {
                Ok(status) => {
                    info!("✅ Order status: {}", status.status);
                    info!("   Filled quantity: {}", status.cum_exec_qty);
                    info!("   Average price: {}", status.avg_price);
                    info!("   Fees: {}", status.cum_exec_fee);
                    
                    if status.status == "Filled" {
                        info!("🎉 ORDER SUCCESSFULLY FILLED ON BYBIT DEMO!");
                    }
                }
                Err(e) => {
                    error!("❌ Failed to get order status: {}", e);
                }
            }
        }
        Err(e) => {
            error!("❌ Failed to place demo order: {}", e);
            error!("   This might be due to:");
            error!("   1. Invalid API credentials");
            error!("   2. Insufficient demo balance");
            error!("   3. API rate limits");
            error!("   4. Symbol not available");
            return Err(e);
        }
    }
    
    info!("🎉 All Bybit demo tests completed!");
    info!("✅ Bybit demo integration is working correctly");
    info!("🚀 Ready for actual demo trading!");
    
    Ok(())
}
