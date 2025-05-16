use std::env;
use std::time::Duration;
use clap::{Parser, Subcommand};
use tracing::{info, error};
use tracing_subscriber::fmt::format::FmtSpan;
use dotenv::dotenv;
use tokio::time;

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
    }

    Ok(())
}

async fn run_simulation(capital: f64, duration: u64) -> anyhow::Result<()> {
    info!("Starting OMNI-ALPHA VΩ∞∞ in simulation mode");
    info!("Initial capital: ${:.2}", capital);
    info!("Duration: {} minutes", duration);

    // Define assets to trade
    let assets = vec![
        "BTCUSDT".to_string(), 
        "ETHUSDT".to_string(),
        "SOLUSDT".to_string(),
        "BNBUSDT".to_string(),
        "ADAUSDT".to_string(),
    ];
    
    info!("Trading assets: {:?}", assets);
    
    // Simulate market data
    let mut prices = std::collections::HashMap::new();
    prices.insert("BTCUSDT".to_string(), 50000.0);
    prices.insert("ETHUSDT".to_string(), 3000.0);
    prices.insert("SOLUSDT".to_string(), 100.0);
    prices.insert("BNBUSDT".to_string(), 500.0);
    prices.insert("ADAUSDT".to_string(), 0.5);
    
    // Simulate trading
    let mut portfolio = std::collections::HashMap::new();
    let mut cash = capital;
    let mut total_value = capital;
    
    // Run for specified duration
    let duration_secs = duration * 60;
    info!("Running for {} minutes ({} seconds)", duration, duration_secs);
    
    let mut interval = time::interval(Duration::from_secs(1));
    let start_time = std::time::Instant::now();
    
    while start_time.elapsed().as_secs() < duration_secs {
        interval.tick().await;
        
        // Update prices with random movements
        for (symbol, price) in prices.iter_mut() {
            let change_pct = (rand::random::<f64>() - 0.5) * 0.002; // -0.1% to +0.1%
            *price *= 1.0 + change_pct;
        }
        
        // Calculate portfolio value
        let mut portfolio_value = cash;
        for (symbol, amount) in &portfolio {
            portfolio_value += amount * prices.get(symbol).unwrap();
        }
        
        // Every 10 seconds, make a trading decision
        if start_time.elapsed().as_secs() % 10 == 0 {
            // Simple trading strategy: buy if we have cash, sell if we have assets
            if cash > 1.0 {
                // Find the best asset to buy based on a simple momentum strategy
                let mut best_asset = None;
                let mut best_score = 0.0;
                
                for symbol in &assets {
                    let price = *prices.get(symbol).unwrap();
                    let score = rand::random::<f64>(); // Simulate a trading signal
                    
                    if score > best_score && price < cash {
                        best_score = score;
                        best_asset = Some(symbol);
                    }
                }
                
                if let Some(symbol) = best_asset {
                    if best_score > 0.7 { // Only trade if signal is strong enough
                        let price = *prices.get(symbol).unwrap();
                        let amount = cash * 0.5 / price; // Use 50% of available cash
                        
                        // Update portfolio
                        *portfolio.entry(symbol.clone()).or_insert(0.0) += amount;
                        cash -= amount * price;
                        
                        info!("Bought {} {} at ${:.2} for ${:.2}", amount, symbol, price, amount * price);
                    }
                }
            } else if !portfolio.is_empty() {
                // Sell an asset if we have any
                let mut assets_to_sell = Vec::new();
                
                for (symbol, amount) in &portfolio {
                    if *amount > 0.0 {
                        let price = *prices.get(symbol).unwrap();
                        let score = rand::random::<f64>(); // Simulate a trading signal
                        
                        if score > 0.8 { // Only sell if signal is strong enough
                            assets_to_sell.push((symbol.clone(), *amount, price));
                        }
                    }
                }
                
                for (symbol, amount, price) in assets_to_sell {
                    // Update portfolio
                    *portfolio.get_mut(&symbol).unwrap() = 0.0;
                    cash += amount * price;
                    
                    info!("Sold {} {} at ${:.2} for ${:.2}", amount, symbol, price, amount * price);
                }
            }
            
            // Recalculate portfolio value
            portfolio_value = cash;
            for (symbol, amount) in &portfolio {
                portfolio_value += amount * prices.get(symbol).unwrap();
            }
            
            // Print portfolio status
            info!("Portfolio value: ${:.2} (Cash: ${:.2}, Assets: ${:.2})", 
                portfolio_value, cash, portfolio_value - cash);
            
            // Calculate profit/loss
            let pnl = portfolio_value - capital;
            let roi = pnl / capital * 100.0;
            
            info!("P&L: ${:.2} (ROI: {:.2}%)", pnl, roi);
        }
        
        // Update total value
        total_value = portfolio_value;
    }
    
    // Print final results
    info!("Simulation completed");
    info!("Initial capital: ${:.2}", capital);
    info!("Final portfolio value: ${:.2}", total_value);
    info!("P&L: ${:.2} (ROI: {:.2}%)", total_value - capital, (total_value - capital) / capital * 100.0);
    
    Ok(())
}
