//! Asset Discovery for 12 USDT Capital Constraint
//!
//! This program scans Bybit's available instruments to find assets
//! with minimum order sizes compatible with 12 USDT capital allocation

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
struct AssetInfo {
    symbol: String,
    price: f64,
    min_order_qty: f64,
    min_notional: f64,
    tick_size: f64,
}

#[derive(Debug)]
struct BybitScanner {
    client: reqwest::Client,
}

impl BybitScanner {
    fn new() -> Self {
        Self {
            client: reqwest::Client::new(),
        }
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

    async fn get_all_instruments(&self) -> Result<Vec<String>> {
        let mut params = HashMap::new();
        params.insert("category".to_string(), "linear".to_string());
        params.insert("limit".to_string(), "1000".to_string());
        
        let response = self.get_public_request("/v5/market/instruments-info", params).await?;
        
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

    async fn get_instrument_details(&self, symbol: &str) -> Result<(f64, f64)> {
        let mut params = HashMap::new();
        params.insert("category".to_string(), "linear".to_string());
        params.insert("symbol".to_string(), symbol.to_string());
        
        let response = self.get_public_request("/v5/market/instruments-info", params).await?;
        
        if let Some(list) = response["result"]["list"].as_array() {
            if let Some(instrument) = list.first() {
                let min_order_qty = instrument["lotSizeFilter"]["minOrderQty"]
                    .as_str()
                    .unwrap_or("0")
                    .parse::<f64>()
                    .unwrap_or(0.0);
                
                let tick_size = instrument["priceFilter"]["tickSize"]
                    .as_str()
                    .unwrap_or("0")
                    .parse::<f64>()
                    .unwrap_or(0.0);
                
                return Ok((min_order_qty, tick_size));
            }
        }
        
        Err(anyhow!("Failed to get instrument details for {}", symbol))
    }

    async fn find_suitable_assets(&self, max_capital: f64) -> Result<Vec<AssetInfo>> {
        println!("🔍 SCANNING BYBIT FOR ASSETS COMPATIBLE WITH {:.2} USDT CAPITAL...", max_capital);
        println!("📊 This will analyze minimum order sizes vs capital constraint");
        println!();

        let instruments = self.get_all_instruments().await?;
        println!("📋 Found {} total instruments to analyze", instruments.len());
        
        let mut suitable_assets = Vec::new();
        let mut processed = 0;
        
        for symbol in instruments.iter() {
            processed += 1;
            
            if processed % 50 == 0 {
                println!("   Processed {}/{} instruments...", processed, instruments.len());
            }
            
            // Get current price
            if let Ok(price) = self.get_ticker(symbol).await {
                // Get instrument details
                if let Ok((min_qty, tick_size)) = self.get_instrument_details(symbol).await {
                    let min_notional = min_qty * price;
                    
                    // Check if minimum order fits within our capital constraint
                    if min_notional <= max_capital && min_notional > 0.0 && price > 0.0 {
                        let asset = AssetInfo {
                            symbol: symbol.clone(),
                            price,
                            min_order_qty: min_qty,
                            min_notional,
                            tick_size,
                        };
                        suitable_assets.push(asset);
                    }
                }
            }
            
            // Small delay to avoid rate limits
            tokio::time::sleep(tokio::time::Duration::from_millis(50)).await;
        }
        
        // Sort by minimum notional value (ascending)
        suitable_assets.sort_by(|a, b| a.min_notional.partial_cmp(&b.min_notional).unwrap());
        
        Ok(suitable_assets)
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    println!("🚀 BYBIT ASSET SCANNER FOR 12 USDT CAPITAL CONSTRAINT");
    println!("{}", "=".repeat(80));
    println!("🎯 Objective: Find assets with minimum order sizes ≤ 12 USDT");
    println!("🔗 Environment: Bybit Demo (api-demo.bybit.com)");
    println!("💰 Capital Constraint: 12.0000 USDT");
    println!("{}", "=".repeat(80));

    let scanner = BybitScanner::new();
    
    // Find suitable assets for 12 USDT
    let suitable_assets = scanner.find_suitable_assets(12.0).await?;
    
    println!("\n{}", "=".repeat(80));
    println!("📊 ANALYSIS RESULTS");
    println!("{}", "=".repeat(80));
    
    if suitable_assets.is_empty() {
        println!("❌ No assets found with minimum order sizes ≤ 12 USDT");
        println!("💡 Consider:");
        println!("   1. Increasing capital allocation");
        println!("   2. Using spot trading instead of linear perpetuals");
        println!("   3. Finding alternative exchanges with lower minimums");
    } else {
        println!("✅ Found {} suitable assets for 12 USDT capital!", suitable_assets.len());
        println!();
        
        println!("🏆 TOP 20 MOST AFFORDABLE ASSETS:");
        println!("{:<20} {:<12} {:<15} {:<12} {:<10}", "Symbol", "Price", "Min Order Qty", "Min Notional", "% of 12 USDT");
        println!("{}", "-".repeat(80));
        
        for (i, asset) in suitable_assets.iter().take(20).enumerate() {
            let percentage = (asset.min_notional / 12.0) * 100.0;
            println!("{:<3} {:<17} ${:<11.6} {:<15.8} ${:<11.4} {:<10.1}%", 
                    i + 1, asset.symbol, asset.price, asset.min_order_qty, asset.min_notional, percentage);
        }
        
        println!();
        println!("💡 CAPITAL ALLOCATION STRATEGIES:");
        
        // Strategy 1: Single asset with maximum allocation
        if let Some(cheapest) = suitable_assets.first() {
            let max_positions = (12.0 / cheapest.min_notional).floor() as i32;
            let total_allocation = max_positions as f64 * cheapest.min_notional;
            println!("   1. Max positions in {}: {} positions = ${:.4} allocated", 
                    cheapest.symbol, max_positions, total_allocation);
        }
        
        // Strategy 2: Diversified portfolio
        let mut portfolio_allocation = 0.0;
        let mut portfolio_count = 0;
        println!("   2. Diversified portfolio:");
        
        for asset in suitable_assets.iter().take(5) {
            if portfolio_allocation + asset.min_notional <= 12.0 {
                portfolio_allocation += asset.min_notional;
                portfolio_count += 1;
                println!("      - {} (${:.4})", asset.symbol, asset.min_notional);
            }
        }
        println!("      Total: {} assets, ${:.4} allocated, ${:.4} remaining", 
                portfolio_count, portfolio_allocation, 12.0 - portfolio_allocation);
    }
    
    println!("\n{}", "=".repeat(80));
    println!("🎯 RECOMMENDATION FOR OMNI TRADING SYSTEM:");
    
    if !suitable_assets.is_empty() {
        println!("✅ Use the identified assets for actual trade execution");
        println!("✅ Implement portfolio allocation across multiple suitable assets");
        println!("✅ System is ready for live trading with proper asset selection");
    } else {
        println!("⚠️  Consider alternative approaches:");
        println!("   - Increase capital allocation beyond 12 USDT");
        println!("   - Use spot trading category instead of linear");
        println!("   - Implement fractional position sizing");
    }
    
    println!("{}", "=".repeat(80));
    
    Ok(())
}
