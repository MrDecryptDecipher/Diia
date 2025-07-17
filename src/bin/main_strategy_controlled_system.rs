//! Main Strategy Controlled Trading System
//!
//! This system implements the proper architecture where the main trading strategy
//! acts as the primary controller and commands the high frequency trader for execution.
//! This ensures separation of concerns while preserving all existing OMNI components.

use std::sync::Arc;
use std::time::Duration;
use anyhow::Result;
use tokio::time::sleep;
use tracing::{info, error, Level};
use tracing_subscriber::FmtSubscriber;

use omni::agents::main_strategy_controller::{MainStrategyController, MainStrategyControllerConfig};
use omni::agents::high_frequency_trader::{HighFrequencyTrader, HighFrequencyTraderConfig};
use omni::agents::zero_loss_enforcer::{ZeroLossEnforcer, ZeroLossEnforcerConfig};
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
    
    info!("🚀 Starting OMNI-ALPHA VΩ∞∞ Main Strategy Controlled Trading System");
    info!("🎯 Architecture: Main Strategy Controller → High Frequency Trader");
    info!("💰 Capital: 12 USDT (10 USDT active + 2 USDT safety buffer)");
    info!("📊 Target: 750+ trades/day with 85-90% win rate");
    info!("🔬 Analysis: All OMNI components integrated");
    
    // Bybit Demo API Credentials
    let api_key = "lCMnwPKIzXASNWn6UE";
    let api_secret = "aXjs1SF9tmW3riHMktmjtyOyAT85puvrVstr";
    
    // Create Bybit adapter
    let bybit_adapter = Arc::new(BybitAdapter::new(api_key, api_secret, true)); // true = use demo API
    
    // Create message bus
    let message_bus = Arc::new(MessageBus::new(1000)); // Capacity for 1000 messages
    
    // Check wallet balance and request demo funds if needed
    info!("💰 Checking wallet balance...");
    let balances = bybit_adapter.get_wallet_balance(Some("USDT")).await?;
    
    if let Some(usdt_balance) = balances.get("USDT") {
        info!("💰 Current USDT Balance: ${:.2}", usdt_balance.available_balance);
        
        // If balance is less than $12, request demo funds
        if usdt_balance.available_balance < 12.0 {
            info!("💰 Requesting demo funds...");
            match bybit_adapter.request_demo_funds("USDT", 12.0).await {
                Ok(_) => info!("✅ Successfully requested demo funds!"),
                Err(e) => error!("❌ Failed to request demo funds: {}", e),
            }
            
            // Check balance again
            info!("💰 Checking updated wallet balance...");
            match bybit_adapter.get_wallet_balance(Some("USDT")).await {
                Ok(updated_balances) => {
                    if let Some(updated_usdt_balance) = updated_balances.get("USDT") {
                        info!("💰 Updated USDT Balance: ${:.2}", updated_usdt_balance.available_balance);
                    }
                },
                Err(e) => error!("❌ Failed to get updated wallet balance: {}", e),
            }
        }
        
        // Create Main Strategy Controller
        info!("🎯 Initializing Main Strategy Controller...");
        let main_strategy_config = MainStrategyControllerConfig {
            total_capital: 12.0,
            safety_buffer: 2.0,
            max_positions: 2,
            position_size: 5.0,
            target_trades_per_day: 750,
            min_confidence: 85.0,
            max_leverage: 100.0,
            analysis_interval: 5, // Analyze every 5 seconds
            command_timeout: 30,  // Commands timeout after 30 seconds
        };
        
        let main_strategy_controller = MainStrategyController::new(
            main_strategy_config,
            bybit_adapter.clone(),
            message_bus.clone(),
        )?;
        
        // Create High Frequency Trader (execution component)
        info!("⚡ Initializing High Frequency Trader (Execution Component)...");
        let hft_config = HighFrequencyTraderConfig {
            initial_capital: 12.0,
            target_trades_per_day: 750,
            min_profit_per_trade: 0.6, // 0.6 USDT minimum profit
            max_concurrent_trades: 2,  // Maximum 2 positions
            timeframes: vec!["1".to_string(), "3".to_string(), "5".to_string()],
            max_assets: 100,
            dynamic_leverage: true,
            trade_interval_ms: 115200, // Will be controlled by main strategy
        };
        
        let mut high_frequency_trader = HighFrequencyTrader::new(
            hft_config,
            bybit_adapter.clone(),
            message_bus.clone(),
        );
        
        // Create Zero Loss Enforcer
        info!("🛡️ Initializing Zero Loss Enforcer...");
        let zero_loss_config = ZeroLossEnforcerConfig::default();
        let mut zero_loss_enforcer = ZeroLossEnforcer::new(
            zero_loss_config,
            bybit_adapter.clone(),
            message_bus.clone(),
        );
        
        // Initialize all components
        info!("🔧 Initializing all components...");
        
        // Initialize agents
        high_frequency_trader.initialize(Arc::new(tokio::sync::RwLock::new(Default::default()))).await?;
        zero_loss_enforcer.initialize(Arc::new(tokio::sync::RwLock::new(Default::default()))).await?;
        
        // Start agents
        high_frequency_trader.start().await?;
        zero_loss_enforcer.start().await?;
        
        info!("✅ All components initialized and started");
        info!("🎯 Main Strategy Controller will now coordinate all trading decisions");
        info!("⚡ High Frequency Trader will execute commands from Main Strategy Controller");
        info!("🛡️ Zero Loss Enforcer will monitor all trades for risk management");
        
        // Start the main strategy controller (this will run the main control loop)
        info!("🚀 Starting Main Strategy Controller...");
        
        // Run the main strategy controller in a separate task
        let main_strategy_handle = {
            let controller = Arc::new(main_strategy_controller);
            let controller_clone = controller.clone();
            tokio::spawn(async move {
                if let Err(e) = controller_clone.start().await {
                    error!("❌ Main Strategy Controller failed: {}", e);
                }
            })
        };
        
        // Run the high frequency trader update loop
        let hft_handle = tokio::spawn(async move {
            loop {
                if let Err(e) = high_frequency_trader.update().await {
                    error!("❌ High Frequency Trader update failed: {}", e);
                }
                sleep(Duration::from_millis(100)).await; // Update every 100ms
            }
        });
        
        // Run the zero loss enforcer update loop
        let zero_loss_handle = tokio::spawn(async move {
            loop {
                if let Err(e) = zero_loss_enforcer.update().await {
                    error!("❌ Zero Loss Enforcer update failed: {}", e);
                }
                sleep(Duration::from_millis(500)).await; // Update every 500ms
            }
        });
        
        info!("🎉 OMNI-ALPHA VΩ∞∞ Main Strategy Controlled Trading System is now running!");
        info!("📊 System Architecture:");
        info!("   🎯 Main Strategy Controller: Analyzes markets and makes trading decisions");
        info!("   ⚡ High Frequency Trader: Executes trades based on strategy commands");
        info!("   🛡️ Zero Loss Enforcer: Monitors and protects against losses");
        info!("   📡 Message Bus: Coordinates communication between components");
        
        // Wait for all tasks to complete (they run indefinitely)
        let _ = tokio::try_join!(main_strategy_handle, hft_handle, zero_loss_handle);
        
    } else {
        error!("❌ Failed to get USDT balance");
    }
    
    Ok(())
}
