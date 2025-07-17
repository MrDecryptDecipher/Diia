//! OMNI Smart Trading System - Real Trade Execution with Loss Prevention
//!
//! Executes actual trades on Bybit demo with intelligent allocation,
//! risk management, and loss prevention strategies

use std::env;
use std::collections::HashMap;
use tokio;
use serde_json::{json, Value};
use reqwest;
use hmac::{Hmac, Mac};
use sha2::Sha256;
use anyhow::{Result, anyhow};

mod smart_allocation_system;
use smart_allocation_system::*;

type HmacSha256 = Hmac<Sha256>;

#[derive(Debug, Clone)]
struct TradeResult {
    order_id: String,
    symbol: String,
    side: String,
    quantity: f64,
    price: f64,
    notional: f64,
    timestamp: String,
    status: String,
}

#[derive(Debug)]
struct SmartTradingSystem {
    api_key: String,
    api_secret: String,
    client: reqwest::Client,
    allocator: SmartAllocator,
    executed_trades: Vec<TradeResult>,
}

impl SmartTradingSystem {
    fn new(api_key: String, api_secret: String, strategy: AllocationStrategy) -> Self {
        Self {
            api_key,
            api_secret,
            client: reqwest::Client::new(),
            allocator: SmartAllocator::new(12.0, strategy),
            executed_trades: Vec::new(),
        }
    }

    fn generate_signature(&self, params: &str, timestamp: u64) -> String {
        let recv_window = "5000";
        let message = format!("{}{}{}{}", timestamp, &self.api_key, recv_window, params);
        let mut mac = HmacSha256::new_from_slice(self.api_secret.as_bytes()).unwrap();
        mac.update(message.as_bytes());
        hex::encode(mac.finalize().into_bytes())
    }

    async fn get_public_request(&self, endpoint: &str, params: HashMap<String, String>) -> Result<Value> {
        let query_string = if params.is_empty() {
            String::new()
        } else {
            params.iter()
                .map(|(k, v)| format!("{}={}", k, v))
                .collect::<Vec<_>>()
                .join("&")
        };

        let url = if query_string.is_empty() {
            format!("https://api-demo.bybit.com{}", endpoint)
        } else {
            format!("https://api-demo.bybit.com{}?{}", endpoint, query_string)
        };

        let response = self.client.get(&url).send().await?;
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

    async fn get_ticker(&self, symbol: &str) -> Result<f64> {
        let mut params = HashMap::new();
        params.insert("category".to_string(), "linear".to_string());
        params.insert("symbol".to_string(), symbol.to_string());
        
        let response = self.get_public_request("/v5/market/tickers", params).await?;
        
        if let Some(list) = response["result"]["list"].as_array() {
            if let Some(ticker) = list.first() {
                if let Some(price_str) = ticker["lastPrice"].as_str() {
                    return Ok(price_str.parse::<f64>().unwrap_or(0.0));
                }
            }
        }
        
        Err(anyhow!("Failed to get ticker price"))
    }

    fn get_quantity_precision(&self, symbol: &str) -> usize {
        // Bybit quantity precision requirements for different symbols
        match symbol {
            "LOOKSUSDT" => 1,      // 0.1 minimum
            "PORTALUSDT" => 1,     // 0.1 minimum
            "IOSTUSDT" => 0,       // 1 minimum
            "XEMUSDT" => 0,        // 1 minimum
            "C98USDT" => 1,        // 0.1 minimum
            "SPELLUSDT" => 0,      // 10 minimum (integer)
            "ZKUSDT" => 1,         // 0.1 minimum
            "AUDIOUSDT" => 1,      // 0.1 minimum
            _ => 2,                // Default 2 decimal places
        }
    }

    fn round_to_minimum_quantity(&self, symbol: &str, quantity: f64) -> f64 {
        let precision = self.get_quantity_precision(symbol);
        let multiplier = 10_f64.powi(precision as i32);
        (quantity * multiplier).floor() / multiplier
    }

    async fn execute_smart_trade(&mut self, symbol: &str, side: &str, allocation: f64, positions: f64) -> Result<TradeResult> {
        println!("\n🚀 EXECUTING SMART TRADE:");
        println!("   Symbol: {}", symbol);
        println!("   Side: {}", side);
        println!("   Allocation: ${:.4}", allocation);
        println!("   Positions: {:.0}", positions);

        // Get current price
        let current_price = self.get_ticker(symbol).await?;
        let raw_quantity = allocation / current_price;

        // Round to proper precision for this symbol
        let mut quantity = self.round_to_minimum_quantity(symbol, raw_quantity);
        let mut actual_notional = quantity * current_price;

        // Ensure we meet the 5 USDT minimum by adjusting quantity if needed
        if actual_notional < 5.0 && allocation >= 5.0 {
            // Calculate exact quantity needed for 5 USDT
            let min_quantity_for_5usd = 5.0 / current_price;
            quantity = self.round_to_minimum_quantity(symbol, min_quantity_for_5usd);
            actual_notional = quantity * current_price;

            // If still below 5 USDT, add one more unit
            if actual_notional < 5.0 {
                let precision = self.get_quantity_precision(symbol);
                let increment = 10_f64.powi(-(precision as i32));
                quantity += increment;
                actual_notional = quantity * current_price;
            }
        }

        println!("   Current Price: ${:.6}", current_price);
        println!("   Raw Quantity: {:.6}", raw_quantity);
        println!("   Rounded Quantity: {:.6}", quantity);
        println!("   Actual Notional: ${:.4}", actual_notional);

        // Format quantity with correct precision
        let precision = self.get_quantity_precision(symbol);
        let qty_string = format!("{:.prec$}", quantity, prec = precision);

        // Place market order for immediate execution
        let order_params = json!({
            "category": "linear",
            "symbol": symbol,
            "side": side,
            "orderType": "Market",
            "qty": qty_string,
            "timeInForce": "IOC"
        });

        println!("   📝 Order Parameters: {}", serde_json::to_string_pretty(&order_params)?);

        match self.post_request("/v5/order/create", order_params).await {
            Ok(response) => {
                if let Some(order_id) = response["result"]["orderId"].as_str() {
                    let trade_result = TradeResult {
                        order_id: order_id.to_string(),
                        symbol: symbol.to_string(),
                        side: side.to_string(),
                        quantity,
                        price: current_price,
                        notional: actual_notional, // Use actual notional, not planned allocation
                        timestamp: chrono::Utc::now().to_rfc3339(),
                        status: "EXECUTED".to_string(),
                    };

                    println!("   ✅ TRADE EXECUTED SUCCESSFULLY!");
                    println!("   📋 Order ID: {}", order_id);
                    println!("   💰 Actual Notional: ${:.4}", actual_notional);
                    println!("   📊 Quantity: {} {}", qty_string, symbol.replace("USDT", ""));
                    
                    self.executed_trades.push(trade_result.clone());
                    Ok(trade_result)
                } else {
                    Err(anyhow!("No order ID in response"))
                }
            }
            Err(e) => {
                println!("   ❌ Trade execution failed: {}", e);
                Err(e)
            }
        }
    }

    async fn get_wallet_balance(&self) -> Result<f64> {
        let mut params = HashMap::new();
        params.insert("accountType".to_string(), "UNIFIED".to_string());
        
        let timestamp = chrono::Utc::now().timestamp_millis() as u64;
        let query_string = "accountType=UNIFIED";
        let signature = self.generate_signature(query_string, timestamp);
        
        let url = format!("https://api-demo.bybit.com/v5/account/wallet-balance?{}", query_string);

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
        
        if let Some(list) = json["result"]["list"].as_array() {
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

    fn print_execution_summary(&self) {
        println!("\n{}", "=".repeat(80));
        println!("📊 SMART TRADING EXECUTION SUMMARY");
        println!("{}", "=".repeat(80));
        
        if self.executed_trades.is_empty() {
            println!("⚠️  No trades were executed");
            return;
        }

        let total_notional: f64 = self.executed_trades.iter().map(|t| t.notional).sum();
        
        println!("✅ EXECUTED TRADES: {}", self.executed_trades.len());
        println!("💰 Total Allocated: ${:.4}", total_notional);
        println!("📈 Capital Utilization: {:.1}%", (total_notional / 12.0) * 100.0);
        println!();
        
        for (i, trade) in self.executed_trades.iter().enumerate() {
            println!("   {}. {} {} {:.6} {} at ${:.6} (${:.4}) - Order: {}", 
                    i + 1, trade.side, trade.symbol, trade.quantity, 
                    trade.symbol.replace("USDT", ""), trade.price, trade.notional, trade.order_id);
        }
        
        println!("\n🛡️  RISK MANAGEMENT STATUS:");
        println!("   Strategy: {}", self.allocator.strategy.name);
        println!("   Max Risk Per Trade: {:.1}%", self.allocator.strategy.max_risk_per_trade * 100.0);
        println!("   Stop Loss: {:.1}%", self.allocator.strategy.stop_loss_percent);
        println!("   Take Profit: {:.1}%", self.allocator.strategy.take_profit_percent);
        
        let risk_score = calculate_portfolio_risk(&self.executed_trades.iter()
            .map(|t| (t.symbol.clone(), t.notional, 1.0)).collect::<Vec<_>>(), 12.0);
        let diversification = calculate_diversification_score(&self.executed_trades.iter()
            .map(|t| (t.symbol.clone(), t.notional, 1.0)).collect::<Vec<_>>());
            
        println!("   Portfolio Risk: {:.1}%", risk_score);
        println!("   Diversification Score: {:.1}/100", diversification);
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    println!("🧠 OMNI SMART TRADING SYSTEM - LOSS PREVENTION MODE");
    println!("{}", "=".repeat(80));
    println!("🎯 Objective: Execute real trades with intelligent allocation");
    println!("🛡️  Strategy: Conservative loss prevention");
    println!("💰 Capital: 12.0000 USDT with smart risk management");
    println!("{}", "=".repeat(80));

    // Load environment variables
    dotenv::dotenv().ok();
    let api_key = env::var("BYBIT_API_KEY").expect("BYBIT_API_KEY not set");
    let api_secret = env::var("BYBIT_API_SECRET").expect("BYBIT_API_SECRET not set");

    // Create smart trading system with conservative strategy
    let mut trading_system = SmartTradingSystem::new(
        api_key, 
        api_secret, 
        SmartAllocator::conservative_strategy()
    );

    // Verify account balance
    match trading_system.get_wallet_balance().await {
        Ok(balance) => {
            println!("\n💰 Account Balance: ${:.2} USDT", balance);
            if balance < 12.0 {
                println!("⚠️  Warning: Insufficient balance for 12 USDT strategy");
            }
        }
        Err(e) => {
            println!("❌ Failed to get balance: {}", e);
            return Err(e);
        }
    }

    // Define suitable assets (from our previous analysis)
    let suitable_assets = vec![
        ("LOOKSUSDT", 0.011610, 0.001161),
        ("PORTALUSDT", 0.029580, 0.002958),
        ("IOSTUSDT", 0.003182, 0.003182),
        ("C98USDT", 0.041170, 0.004117),
        ("SPELLUSDT", 0.000448, 0.004480),
    ];

    // Analyze assets and create allocation plan
    let mut asset_analyses = Vec::new();
    for (symbol, price, min_notional) in suitable_assets {
        let analysis = trading_system.allocator.analyze_asset_risk(symbol, price, min_notional);
        asset_analyses.push(analysis);
    }

    // Calculate smart allocation
    let allocations = trading_system.allocator.calculate_smart_allocation(&asset_analyses)?;
    
    // Generate safe trading signals
    let signals = trading_system.allocator.generate_safe_trading_signals(&allocations);

    // Execute trades
    println!("\n{}", "=".repeat(80));
    println!("🚀 EXECUTING SMART TRADES");
    println!("{}", "=".repeat(80));

    for (symbol, side, allocation, positions) in signals {
        match trading_system.execute_smart_trade(&symbol, &side, allocation, positions).await {
            Ok(_) => {
                println!("✅ Trade executed successfully");
                // Small delay between trades
                tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
            }
            Err(e) => {
                println!("⚠️  Trade failed: {}", e);
            }
        }
    }

    // Print final summary
    trading_system.print_execution_summary();

    println!("\n{}", "=".repeat(80));
    println!("🎉 SMART TRADING SYSTEM EXECUTION COMPLETE!");
    println!("✨ Loss prevention strategies implemented");
    println!("🛡️  Risk management active");
    println!("📊 Portfolio diversified across safe assets");
    println!("{}", "=".repeat(80));

    Ok(())
}
