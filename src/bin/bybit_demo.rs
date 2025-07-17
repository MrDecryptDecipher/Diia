//! Bybit Demo
//!
//! A simple demo of the Bybit adapter for the OMNI-ALPHA VΩ∞∞ trading system.

use std::error::Error;
use tokio;

use omni::exchange::bybit::adapter::BybitAdapter;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    println!("OMNI-ALPHA VΩ∞∞ Trading System - Bybit Demo");
    println!("Capital Genesis: $12 USDT Origin Logic");
    
    // Create Bybit adapter with demo API credentials
    let api_key = "lCMnwPKIzXASNWn6UE";
    let api_secret = "aXjs1SF9tmW3riHMktmjtyOyAT85puvrVstr";
    let adapter = BybitAdapter::new(api_key, api_secret, true); // true = use demo API
    
    // Get wallet balance
    println!("\nChecking wallet balance...");
    match adapter.get_wallet_balance(Some("USDT")).await {
        Ok(balances) => {
            if let Some(usdt_balance) = balances.get("USDT") {
                println!("USDT Balance: ${:.2}", usdt_balance.available_balance);
                
                // If balance is less than $12, request demo funds
                if usdt_balance.available_balance < 12.0 {
                    println!("\nRequesting demo funds...");
                    match adapter.request_demo_funds("USDT", 12.0).await {
                        Ok(_) => println!("Successfully requested demo funds!"),
                        Err(e) => println!("Failed to request demo funds: {}", e),
                    }
                    
                    // Check balance again
                    println!("\nChecking updated wallet balance...");
                    match adapter.get_wallet_balance(Some("USDT")).await {
                        Ok(updated_balances) => {
                            if let Some(updated_usdt_balance) = updated_balances.get("USDT") {
                                println!("Updated USDT Balance: ${:.2}", updated_usdt_balance.available_balance);
                            }
                        },
                        Err(e) => println!("Failed to get updated wallet balance: {}", e),
                    }
                }
            } else {
                println!("No USDT balance found");
            }
        },
        Err(e) => println!("Failed to get wallet balance: {}", e),
    }
    
    // Get market data
    println!("\nGetting market data for BTCUSDT...");
    match adapter.get_ticker("BTCUSDT").await {
        Ok(ticker) => {
            println!("BTCUSDT Price: ${:.2}", ticker.last_price);
            println!("24h Change: {:.2}%", ticker.price_24h_pcnt * 100.0);
            println!("24h Volume: ${:.2}", ticker.volume_24h);
        },
        Err(e) => println!("Failed to get ticker: {}", e),
    }
    
    println!("\nSystem components implemented:");
    println!("- Zero Loss Enforcer for risk management");
    println!("- God Kernel for agent evolution");
    println!("- Memory Node for trade memory");
    println!("- Compound Controller for capital management");
    println!("- Ghost Trader for simulation");
    println!("- Anti-Loss Hedger for hedging");
    println!("- Quantum components for prediction");
    println!("- Neural Interface for visualization");
    println!("- Trading System for execution");
    println!("- Market Simulator for backtesting");
    println!("- Bybit Exchange Adapter for live trading");
    
    Ok(())
}
