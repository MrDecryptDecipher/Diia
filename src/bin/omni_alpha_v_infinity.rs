//! OMNI-ALPHA VΩ∞∞ Trading System
//!
//! This is the main entry point for the OMNI-ALPHA VΩ∞∞ trading system.
//! It integrates all the advanced components to make profitable trades on Bybit Demo.

use std::sync::Arc;
use tokio::sync::RwLock;
use tokio::time::{sleep, Duration};
use tracing::{info, debug, warn, error, Level};
use tracing_subscriber::FmtSubscriber;
use anyhow::Result;

use omni::engine::message_bus::MessageBus;
use omni::engine::agent_trait::Agent;
use omni::exchange::bybit::adapter::BybitAdapter;
use omni::agents::zero_loss_enforcer::{ZeroLossEnforcer, ZeroLossEnforcerConfig};
use omni::agents::asset_scanner_agent::{AssetScannerAgent, AssetScannerAgentConfig};
use omni::agents::god_kernel::{GodKernel, GodKernelConfig};

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize logging
    let subscriber = FmtSubscriber::builder()
        .with_max_level(Level::INFO)
        .finish();
    tracing::subscriber::set_global_default(subscriber)?;
    
    info!("Starting OMNI-ALPHA VΩ∞∞ Trading System");
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
    let bybit_adapter = Arc::new(BybitAdapter::new(api_key, api_secret, true)); // true = use demo API
    
    // Create message bus
    let message_bus = Arc::new(MessageBus::new());
    
    // Create agent context
    let agent_context = Arc::new(RwLock::new(omni::engine::agent_trait::AgentContext::default()));
    
    // Create Zero Loss Enforcer
    let zero_loss_config = ZeroLossEnforcerConfig::default();
    let mut zero_loss_enforcer = ZeroLossEnforcer::new(zero_loss_config, bybit_adapter.clone(), message_bus.clone());
    
    // Create Asset Scanner Agent
    let asset_scanner_config = AssetScannerAgentConfig::default();
    let mut asset_scanner_agent = AssetScannerAgent::new(asset_scanner_config, bybit_adapter.clone(), message_bus.clone());
    
    // Create God Kernel
    let god_kernel_config = GodKernelConfig::default();
    let mut god_kernel = GodKernel::new(god_kernel_config, message_bus.clone());
    
    // Initialize agents
    zero_loss_enforcer.initialize(agent_context.clone()).await?;
    asset_scanner_agent.initialize(agent_context.clone()).await?;
    god_kernel.initialize(agent_context.clone()).await?;
    
    // Start agents
    zero_loss_enforcer.start().await?;
    asset_scanner_agent.start().await?;
    god_kernel.start().await?;
    
    // Check wallet balance
    info!("Checking wallet balance...");
    let balances = bybit_adapter.get_wallet_balance(Some("USDT")).await?;
    
    if let Some(usdt_balance) = balances.get("USDT") {
        info!("USDT Balance: ${:.2}", usdt_balance.available_balance);
        
        // Use $12 USDT for trading
        let trading_capital = 12.0_f64.min(usdt_balance.available_balance);
        info!("Using ${:.2} USDT for trading", trading_capital);
        
        // Update agent context with trading capital
        {
            let mut context = agent_context.write().await;
            context.set_value("trading_capital".to_string(), trading_capital.to_string());
        }
        
        // Main loop
        let mut iteration = 0;
        let max_iterations = 1000; // Run for 1000 iterations
        
        while iteration < max_iterations {
            // Update agents
            zero_loss_enforcer.update().await?;
            asset_scanner_agent.update().await?;
            god_kernel.update().await?;
            
            // Log current state every 10 iterations
            if iteration % 10 == 0 {
                // Get wallet balance
                let balances = bybit_adapter.get_wallet_balance(Some("USDT")).await?;
                
                if let Some(usdt_balance) = balances.get("USDT") {
                    let current_capital = usdt_balance.available_balance;
                    let pnl = current_capital - trading_capital;
                    let roi = pnl / trading_capital;
                    
                    info!(
                        "Iteration: {}, Capital: ${:.2}, PnL: ${:.2} ({:.2}%)",
                        iteration,
                        current_capital,
                        pnl,
                        roi * 100.0
                    );
                }
            }
            
            // Sleep for 10 seconds
            sleep(Duration::from_secs(10)).await;
            
            iteration += 1;
        }
        
        // Stop agents
        zero_loss_enforcer.stop().await?;
        asset_scanner_agent.stop().await?;
        god_kernel.stop().await?;
        
        info!("OMNI-ALPHA VΩ∞∞ Trading System stopped");
    } else {
        error!("No USDT balance found");
    }
    
    Ok(())
}
