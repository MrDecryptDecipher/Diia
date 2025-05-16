use std::env;
use std::time::Duration;
use clap::{Parser, Subcommand};
use tracing::{info, error};
use tracing_subscriber::fmt::format::FmtSpan;
use dotenv::dotenv;
use tokio::time;

use omni_alpha::trading_system::{TradingSystem, TradingSystemConfig, TradingMode, ExchangeConfig};

#[derive(Parser)]
#[clap(author, version, about, long_about = None)]
struct Cli {
    #[clap(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Run the trading system in simulation mode
    Simulate {
        /// Initial capital
        #[clap(short, long, default_value = "12.0")]
        capital: f64,

        /// Duration in minutes
        #[clap(short, long, default_value = "60")]
        duration: u64,
    },
    /// Run the trading system in live mode
    Live {
        /// Initial capital
        #[clap(short, long, default_value = "12.0")]
        capital: f64,

        /// API key
        #[clap(short, long, default_value = "")]
        api_key: String,

        /// API secret
        #[clap(short, long, default_value = "")]
        api_secret: String,
    },
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Load environment variables from .env file
    dotenv().ok();

    // Initialize tracing
    tracing_subscriber::fmt()
        .with_span_events(FmtSpan::CLOSE)
        .with_env_filter(env::var("RUST_LOG").unwrap_or_else(|_| "info".to_string()))
        .init();

    // Parse command line arguments
    let cli = Cli::parse();

    // Process commands
    match cli.command {
        Commands::Simulate { capital, duration } => {
            run_simulation(capital, duration).await?
        },
        Commands::Live { capital, api_key, api_secret } => {
            // Try to get API credentials from environment variables if not provided
            let api_key_value = if api_key.is_empty() {
                env::var("BYBIT_API_KEY").unwrap_or_default()
            } else {
                api_key
            };

            let api_secret_value = if api_secret.is_empty() {
                env::var("BYBIT_API_SECRET").unwrap_or_default()
            } else {
                api_secret
            };

            if api_key_value.is_empty() || api_secret_value.is_empty() {
                error!("API key and secret are required for live trading");
                error!("Provide them as command line arguments or in the .env file");
                return Ok(());
            }

            run_live(capital, api_key_value, api_secret_value).await?
        },
    }

    Ok(())
}

async fn run_simulation(capital: f64, duration: u64) -> anyhow::Result<()> {
    info!("Starting OMNI-ALPHA VΩ∞∞ in simulation mode");
    info!("Initial capital: ${:.2}", capital);
    info!("Duration: {} minutes", duration);

    // Create trading system
    let mut trading_config = TradingSystemConfig {
        initial_capital: capital,
        mode: TradingMode::Simulation,
        assets: vec!["BTCUSDT".to_string(), "ETHUSDT".to_string()],
        timeframes: vec![1, 5, 15],
        max_concurrent_trades: 3,
        heartbeat_interval: 1,
        exchange: ExchangeConfig::default(),
    };
    
    // Add more assets for better trading opportunities
    let default_assets = vec![
        "BTCUSDT".to_string(), 
        "ETHUSDT".to_string(),
        "SOLUSDT".to_string(),
        "BNBUSDT".to_string(),
        "ADAUSDT".to_string(),
    ];
    
    // Use default assets
    trading_config.assets = default_assets;

    // Create trading system
    let mut trading_system = TradingSystem::new(trading_config);

    // Start trading system
    trading_system.start().await?;

    // Run for specified duration
    let duration_secs = duration * 60;
    info!("Running for {} minutes ({} seconds)", duration, duration_secs);
    
    let mut interval = time::interval(Duration::from_secs(1));
    let start_time = std::time::Instant::now();
    
    while start_time.elapsed().as_secs() < duration_secs {
        interval.tick().await;
        
        // Update trading system
        if let Err(e) = trading_system.update().await {
            error!("Error updating trading system: {}", e);
        }
        
        // Print progress every 10 seconds
        if start_time.elapsed().as_secs() % 10 == 0 {
            info!("Running for {} seconds...", start_time.elapsed().as_secs());
        }
    }

    // Stop trading system
    trading_system.stop().await?;

    info!("Simulation completed");

    Ok(())
}

async fn run_live(capital: f64, api_key: String, api_secret: String) -> anyhow::Result<()> {
    info!("Starting OMNI-ALPHA VΩ∞∞ in live mode");
    info!("Initial capital: ${:.2}", capital);

    // Create trading system
    let mut trading_config = TradingSystemConfig {
        initial_capital: capital,
        mode: TradingMode::Live,
        assets: vec!["BTCUSDT".to_string(), "ETHUSDT".to_string()],
        timeframes: vec![1, 5, 15],
        max_concurrent_trades: 1,
        heartbeat_interval: 1,
        exchange: ExchangeConfig {
            name: "bybit".to_string(),
            api_key,
            api_secret,
            testnet: true, // Use testnet for safety
            category: "linear".to_string(),
        },
    };

    // Create trading system
    let mut trading_system = TradingSystem::new(trading_config);

    // Start trading system
    trading_system.start().await?;

    // Run until user interrupts
    info!("Press Ctrl+C to stop");
    
    let mut interval = time::interval(Duration::from_secs(1));
    
    loop {
        interval.tick().await;
        
        // Update trading system
        if let Err(e) = trading_system.update().await {
            error!("Error updating trading system: {}", e);
        }
    }
}
