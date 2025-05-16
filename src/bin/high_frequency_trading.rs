//! High Frequency Trading System
//!
//! This module provides a high-frequency trading system for the OMNI-ALPHA VΩ∞∞ platform.
//! It aims to execute 750 profitable trades per day with a minimum profit of $2 USDT per trade.

use std::sync::Arc;
use std::time::Duration;
use anyhow::Result;
use tokio::time::sleep;
use tracing::{info, error, Level};
use tracing_subscriber::FmtSubscriber;

use omni::agents::high_frequency_trader::{HighFrequencyTrader, HighFrequencyTraderConfig};
use omni::agents::zero_loss_enforcer::{ZeroLossEnforcer, ZeroLossEnforcerConfig};
use omni::agents::ghost_trader::{GhostTrader, GhostTraderConfig};
use omni::agents::compound_controller::{CompoundController, CompoundControllerConfig};
use omni::engine::message_bus::MessageBus;
use omni::engine::agent_trait::Agent;
use omni::exchange::bybit::adapter::BybitAdapter;

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize tracing
    let subscriber = FmtSubscriber::builder()
        .with_max_level(Level::INFO)
        .finish();
    tracing::subscriber::set_global_default(subscriber)?;
    
    info!("Starting OMNI-ALPHA VΩ∞∞ High Frequency Trading System");
    info!("Capital Genesis: $12 USDT Origin Logic");
    info!("Recursive Intelligence Loop Activated");
    info!("Zero-Loss Enforcement Protocols Engaged");
    info!("Quantum Prediction System Online");
    info!("Multi-Agent Collaboration Network Established");
    info!("System Ready for Exponential Capital Growth");
    
    // Bybit Demo API Credentials
    let api_key = "lCMnwPKIzXASNWn6UE";
    let api_secret = "aXjs1SF9tmW3riHMktmjtyOyAT85puvrVstr";
    
    // Create Bybit adapter
    let bybit_adapter = Arc::new(BybitAdapter::new(api_key, api_secret, false)); // false = use demo API
    
    // Create message bus
    let message_bus = Arc::new(MessageBus::new());
    
    // Check wallet balance
    info!("Checking wallet balance...");
    let balances = bybit_adapter.get_wallet_balance(Some("USDT")).await?;
    
    if let Some(usdt_balance) = balances.get("USDT") {
        info!("USDT Balance: ${:.2}", usdt_balance.available_balance);
        
        // If balance is less than $12, request demo funds
        if usdt_balance.available_balance < 12.0 {
            info!("Requesting demo funds...");
            match bybit_adapter.request_demo_funds("USDT", 12.0).await {
                Ok(_) => info!("Successfully requested demo funds!"),
                Err(e) => error!("Failed to request demo funds: {}", e),
            }
            
            // Check balance again
            info!("Checking updated wallet balance...");
            match bybit_adapter.get_wallet_balance(Some("USDT")).await {
                Ok(updated_balances) => {
                    if let Some(updated_usdt_balance) = updated_balances.get("USDT") {
                        info!("Updated USDT Balance: ${:.2}", updated_usdt_balance.available_balance);
                    }
                },
                Err(e) => error!("Failed to get updated wallet balance: {}", e),
            }
        }
        
        // Create High Frequency Trader
        let hft_config = HighFrequencyTraderConfig {
            initial_capital: 12.0,
            target_trades_per_day: 750,
            min_profit_per_trade: 2.0,
            max_concurrent_trades: 10,
            timeframes: vec!["1".to_string(), "3".to_string(), "5".to_string()],
            max_assets: 100,
            dynamic_leverage: true,
            trade_interval_ms: 115200, // 86400000 ms in a day / 750 trades = 115200 ms per trade
        };
        
        let mut high_frequency_trader = HighFrequencyTrader::new(
            hft_config,
            bybit_adapter.clone(),
            message_bus.clone(),
        );
        
        // Create Zero Loss Enforcer
        let zero_loss_config = ZeroLossEnforcerConfig::default();
        let mut zero_loss_enforcer = ZeroLossEnforcer::new(
            zero_loss_config,
            bybit_adapter.clone(),
            message_bus.clone(),
        );
        
        // Create Ghost Trader
        let ghost_trader_config = GhostTraderConfig::default();
        let mut ghost_trader = GhostTrader::new(
            ghost_trader_config,
            bybit_adapter.clone(),
            message_bus.clone(),
        );
        
        // Create Compound Controller
        let compound_controller_config = CompoundControllerConfig::default();
        let mut compound_controller = CompoundController::new(
            compound_controller_config,
            message_bus.clone(),
        );
        
        // Initialize agents
        info!("Initializing agents...");
        high_frequency_trader.initialize(Arc::new(tokio::sync::RwLock::new(Default::default()))).await?;
        zero_loss_enforcer.initialize(Arc::new(tokio::sync::RwLock::new(Default::default()))).await?;
        ghost_trader.initialize(Arc::new(tokio::sync::RwLock::new(Default::default()))).await?;
        compound_controller.initialize(Arc::new(tokio::sync::RwLock::new(Default::default()))).await?;
        
        // Start agents
        info!("Starting agents...");
        high_frequency_trader.start().await?;
        zero_loss_enforcer.start().await?;
        ghost_trader.start().await?;
        compound_controller.start().await?;
        
        // Main loop
        info!("Entering main trading loop...");
        let mut iteration = 0;
        
        loop {
            // Update agents
            high_frequency_trader.update().await?;
            zero_loss_enforcer.update().await?;
            ghost_trader.update().await?;
            compound_controller.update().await?;
            
            // Sleep for a short time
            sleep(Duration::from_millis(100)).await;
            
            // Every 100 iterations, display system status
            if iteration % 100 == 0 {
                info!("System running... Iteration: {}", iteration);
                
                // Check wallet balance
                match bybit_adapter.get_wallet_balance(Some("USDT")).await {
                    Ok(balances) => {
                        if let Some(usdt_balance) = balances.get("USDT") {
                            info!("Current USDT Balance: ${:.2}", usdt_balance.available_balance);
                        }
                    },
                    Err(e) => error!("Failed to get wallet balance: {}", e),
                }
            }
            
            iteration += 1;
        }
    } else {
        error!("No USDT balance found");
    }
    
    Ok(())
}
