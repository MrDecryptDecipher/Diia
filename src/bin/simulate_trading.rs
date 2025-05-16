use std::env;
use dotenv::dotenv;
use anyhow::{anyhow, Result};
use reqwest::Client;
use serde_json::{json, Value};
use hmac::{Hmac, Mac};
use sha2::Sha256;
use std::time::{SystemTime, UNIX_EPOCH, Duration};
use std::thread;
use std::collections::HashMap;

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
    
    // Symbols to monitor
    let symbols = vec!["BTCUSDT", "ETHUSDT", "BNBUSDT", "ADAUSDT", "SOLUSDT"];
    
    // Initial account balance (from wallet balance response)
    let mut account_balance = 50000.0;
    println!("Initial account balance: ${:.2}", account_balance);
    
    // Simulated positions
    let mut positions: HashMap<String, (String, f64, f64)> = HashMap::new(); // (symbol, (side, entry_price, quantity))
    
    // Main trading loop
    for _ in 0..10 {
        for symbol in &symbols {
            // Get market data
            let candles = get_candles(&client, base_url, symbol, "linear", "60", 100).await?;
            
            if candles.is_empty() {
                println!("No candles data for {}", symbol);
                continue;
            }
            
            // Simple trading strategy
            let current_price = candles[0][4].parse::<f64>().unwrap_or(0.0); // Close price
            
            if current_price <= 0.0 {
                continue;
            }
            
            // Calculate indicators
            let (rsi, macd, signal) = calculate_indicators(&candles);
            
            println!("{} - Price: ${:.2}, RSI: {:.2}, MACD: {:.4}, Signal: {:.4}", 
                     symbol, current_price, rsi, macd, signal);
            
            // Trading logic
            if !positions.contains_key(*symbol) {
                // No position, check for entry
                if rsi < 30.0 && macd > signal {
                    // Buy signal
                    let quantity = calculate_position_size(account_balance, current_price, 0.01);
                    let cost = quantity * current_price;
                    
                    println!("BUY SIGNAL for {} - Entry: ${:.2}, Quantity: {:.6}, Cost: ${:.2}", 
                             symbol, current_price, quantity, cost);
                    
                    // Simulate placing order
                    positions.insert(symbol.to_string(), ("Buy".to_string(), current_price, quantity));
                    account_balance -= cost;
                    
                    println!("Simulated Buy order placed for {} at ${:.2}", symbol, current_price);
                    println!("New account balance: ${:.2}", account_balance);
                } else if rsi > 70.0 && macd < signal {
                    // Sell signal (short)
                    let quantity = calculate_position_size(account_balance, current_price, 0.01);
                    let cost = quantity * current_price;
                    
                    println!("SELL SIGNAL for {} - Entry: ${:.2}, Quantity: {:.6}, Cost: ${:.2}", 
                             symbol, current_price, quantity, cost);
                    
                    // Simulate placing order
                    positions.insert(symbol.to_string(), ("Sell".to_string(), current_price, quantity));
                    account_balance -= cost;
                    
                    println!("Simulated Sell order placed for {} at ${:.2}", symbol, current_price);
                    println!("New account balance: ${:.2}", account_balance);
                }
            } else {
                // Have position, check for exit
                let (side, entry_price, quantity) = positions.get(*symbol).unwrap().clone();
                
                if side == "Buy" {
                    // Long position
                    if rsi > 70.0 || (current_price - entry_price) / entry_price > 0.02 {
                        // Take profit or exit signal
                        let profit = quantity * (current_price - entry_price);
                        account_balance += quantity * current_price;
                        
                        println!("CLOSE LONG for {} - Exit: ${:.2}, Profit: ${:.2}", 
                                 symbol, current_price, profit);
                        
                        // Remove position
                        positions.remove(*symbol);
                        
                        println!("Simulated Close order placed for {} at ${:.2}", symbol, current_price);
                        println!("New account balance: ${:.2}", account_balance);
                    }
                } else {
                    // Short position
                    if rsi < 30.0 || (entry_price - current_price) / entry_price > 0.02 {
                        // Take profit or exit signal
                        let profit = quantity * (entry_price - current_price);
                        account_balance += quantity * current_price + profit;
                        
                        println!("CLOSE SHORT for {} - Exit: ${:.2}, Profit: ${:.2}", 
                                 symbol, current_price, profit);
                        
                        // Remove position
                        positions.remove(*symbol);
                        
                        println!("Simulated Close order placed for {} at ${:.2}", symbol, current_price);
                        println!("New account balance: ${:.2}", account_balance);
                    }
                }
            }
        }
        
        // Wait for next iteration
        println!("Sleeping for 10 seconds...");
        thread::sleep(Duration::from_secs(10));
    }
    
    // Final account balance
    println!("Final account balance: ${:.2}", account_balance);
    println!("Open positions: {:?}", positions);
    
    Ok(())
}

async fn get_candles(client: &Client, base_url: &str, symbol: &str, category: &str, interval: &str, limit: u32) -> Result<Vec<Vec<String>>> {
    let url = format!("{}/v5/market/kline", base_url);
    
    let mut params = HashMap::new();
    params.insert("category".to_string(), category.to_string());
    params.insert("symbol".to_string(), symbol.to_string());
    params.insert("interval".to_string(), interval.to_string());
    params.insert("limit".to_string(), limit.to_string());
    
    let response = client.get(&url)
        .query(&params)
        .send()
        .await?
        .json::<serde_json::Value>()
        .await?;
    
    let mut candles = Vec::new();
    
    if let Some(result) = response.get("result") {
        if let Some(list) = result.get("list").and_then(|v| v.as_array()) {
            for item in list {
                if let Some(candle_data) = item.as_array() {
                    let mut candle = Vec::new();
                    for value in candle_data {
                        candle.push(value.as_str().unwrap_or("0").to_string());
                    }
                    candles.push(candle);
                }
            }
        }
    }
    
    Ok(candles)
}

fn calculate_indicators(candles: &[Vec<String>]) -> (f64, f64, f64) {
    // Extract close prices
    let mut closes = Vec::new();
    for candle in candles {
        if candle.len() >= 5 {
            if let Ok(close) = candle[4].parse::<f64>() {
                closes.push(close);
            }
        }
    }
    
    // Reverse to get chronological order
    closes.reverse();
    
    // Calculate RSI
    let rsi = calculate_rsi(&closes, 14);
    
    // Calculate MACD
    let (macd, signal) = calculate_macd(&closes, 12, 26, 9);
    
    (rsi, macd, signal)
}

fn calculate_rsi(prices: &[f64], period: usize) -> f64 {
    if prices.len() <= period {
        return 50.0;
    }
    
    let mut gains = 0.0;
    let mut losses = 0.0;
    
    for i in 1..=period {
        let diff = prices[i] - prices[i - 1];
        if diff >= 0.0 {
            gains += diff;
        } else {
            losses -= diff;
        }
    }
    
    let avg_gain = gains / period as f64;
    let avg_loss = losses / period as f64;
    
    if avg_loss == 0.0 {
        return 100.0;
    }
    
    let rs = avg_gain / avg_loss;
    let rsi = 100.0 - (100.0 / (1.0 + rs));
    
    rsi
}

fn calculate_macd(prices: &[f64], fast_period: usize, slow_period: usize, signal_period: usize) -> (f64, f64) {
    if prices.len() <= slow_period + signal_period {
        return (0.0, 0.0);
    }
    
    let fast_ema = calculate_ema(prices, fast_period);
    let slow_ema = calculate_ema(prices, slow_period);
    
    let macd_line = fast_ema - slow_ema;
    
    // Calculate signal line (EMA of MACD line)
    let mut macd_values = Vec::new();
    for i in 0..prices.len() {
        let fast_ema_i = calculate_ema(&prices[0..=i], fast_period);
        let slow_ema_i = calculate_ema(&prices[0..=i], slow_period);
        macd_values.push(fast_ema_i - slow_ema_i);
    }
    
    let signal_line = calculate_ema(&macd_values, signal_period);
    
    (macd_line, signal_line)
}

fn calculate_ema(prices: &[f64], period: usize) -> f64 {
    if prices.len() <= period {
        return prices.last().unwrap_or(&0.0).clone();
    }
    
    let multiplier = 2.0 / (period as f64 + 1.0);
    let mut ema = prices[0];
    
    for i in 1..prices.len() {
        ema = (prices[i] - ema) * multiplier + ema;
    }
    
    ema
}

fn calculate_position_size(account_balance: f64, price: f64, risk_percentage: f64) -> f64 {
    let risk_amount = account_balance * risk_percentage;
    let position_size = risk_amount / price;
    
    // Round to 6 decimal places
    (position_size * 1000000.0).round() / 1000000.0
}
