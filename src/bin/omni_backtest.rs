//! OMNI-ALPHA VΩ∞∞ Backtesting System
//!
//! This is the backtesting tool for the OMNI-ALPHA VΩ∞∞ trading system,
//! designed to evaluate trading strategies on historical data.

use std::collections::HashMap;
use chrono::{DateTime, Utc, TimeZone, Duration};
use tracing::{info, debug, warn, error, Level};
use tracing_subscriber::FmtSubscriber;
use anyhow::Result;

use omni::exchange::bybit::demo_adapter::BybitDemoAdapter;
use omni::exchange::types::Candle;
use omni::backtest::backtest_engine::{BacktestEngine, BacktestConfig, BacktestResult};
use omni::prelude::BacktestTrade;
use omni::strategy::advanced_strategy::AdvancedStrategy;

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize logging
    let subscriber = FmtSubscriber::builder()
        .with_max_level(Level::INFO)
        .finish();
    tracing::subscriber::set_global_default(subscriber)?;

    info!("Starting OMNI-ALPHA VΩ∞∞ Backtesting System");

    // Load API credentials from environment variables
    let api_key = std::env::var("BYBIT_API_KEY").unwrap_or_else(|_| "lCMnwPKIzXASNWn6UE".to_string());
    let api_secret = std::env::var("BYBIT_API_SECRET").unwrap_or_else(|_| "aXjs1SF9tmW3riHMktmjtyOyAT85puvrVstr".to_string());

    // Create Bybit adapter for fetching historical data
    let bybit_adapter = BybitDemoAdapter::new(&api_key, &api_secret);

    // Define backtest parameters
    let start_date = Utc.with_ymd_and_hms(2023, 1, 1, 0, 0, 0).unwrap();
    let end_date = Utc.with_ymd_and_hms(2023, 12, 31, 23, 59, 59).unwrap();

    let backtest_config = BacktestConfig {
        initial_capital: 1000.0,
        symbols: vec![
            "BTCUSDT".to_string(),
            "ETHUSDT".to_string(),
            "SOLUSDT".to_string(),
            "BNBUSDT".to_string(),
            "ADAUSDT".to_string(),
        ],
        start_date,
        end_date,
        risk_per_trade: 0.01,
        max_positions: 5,
        commission_rate: 0.001, // 0.1%
        slippage: 0.001, // 0.1%
    };

    // Create backtest engine
    let mut backtest_engine = BacktestEngine::new(backtest_config.clone());

    // Fetch historical data for each symbol
    for symbol in &backtest_config.symbols {
        info!("Fetching historical data for {}", symbol);
        
        // We need to fetch data in chunks due to API limitations
        let mut all_candles = Vec::new();
        let mut current_date = start_date;
        
        while current_date < end_date {
            let end_chunk = current_date + Duration::days(30);
            let end_chunk = if end_chunk > end_date { end_date } else { end_chunk };
            
            match bybit_adapter.get_historical_candles(
                symbol, 
                "240", // 4-hour candles
                Some(current_date.timestamp() as i64 * 1000),
                Some(end_chunk.timestamp() as i64 * 1000),
                Some(200)
            ).await {
                Ok(candles) => {
                    info!("Fetched {} candles for {} from {} to {}", 
                          candles.len(), symbol, current_date, end_chunk);
                    all_candles.extend(candles);
                },
                Err(e) => {
                    error!("Failed to fetch candles for {}: {}", symbol, e);
                }
            }
            
            current_date = end_chunk + Duration::seconds(1);
        }
        
        if !all_candles.is_empty() {
            info!("Total candles for {}: {}", symbol, all_candles.len());
            backtest_engine.load_candle_data(symbol, all_candles);
        }
    }

    // Run backtest
    info!("Running backtest...");
    let result = backtest_engine.run_backtest();

    // Print results
    print_backtest_results(&result);

    Ok(())
}

fn print_backtest_results(result: &BacktestResult) {
    println!("\n=== OMNI-ALPHA VΩ∞∞ Backtest Results ===");
    println!("Initial Capital: ${:.2}", result.initial_capital);
    println!("Final Capital: ${:.2}", result.final_capital);
    println!("Total Return: ${:.2} ({:.2}%)", 
             result.total_return, result.total_return_pct * 100.0);
    println!("Total Trades: {}", result.total_trades);
    println!("Winning Trades: {} ({:.2}%)", 
             result.winning_trades, result.win_rate * 100.0);
    println!("Losing Trades: {}", result.losing_trades);
    println!("Max Drawdown: ${:.2} ({:.2}%)", 
             result.max_drawdown, result.max_drawdown_pct * 100.0);
    println!("Sharpe Ratio: {:.2}", result.sharpe_ratio);
    println!("Profit Factor: {:.2}", result.profit_factor);
    
    // Print top 5 winning trades
    println!("\nTop 5 Winning Trades:");
    let mut winning_trades: Vec<&BacktestTrade> = result.trades.iter()
        .filter(|t| t.net_profit_loss > 0.0)
        .collect();
    winning_trades.sort_by(|a, b| b.net_profit_loss.partial_cmp(&a.net_profit_loss).unwrap());
    
    for (i, trade) in winning_trades.iter().take(5).enumerate() {
        println!("{}. {} {}: ${:.2} ({:.2}%)", 
                 i + 1, 
                 trade.symbol, 
                 format!("{:?}", trade.direction),
                 trade.net_profit_loss,
                 trade.profit_loss_pct * 100.0);
    }
    
    // Print top 5 losing trades
    println!("\nTop 5 Losing Trades:");
    let mut losing_trades: Vec<&BacktestTrade> = result.trades.iter()
        .filter(|t| t.net_profit_loss <= 0.0)
        .collect();
    losing_trades.sort_by(|a, b| a.net_profit_loss.partial_cmp(&b.net_profit_loss).unwrap());
    
    for (i, trade) in losing_trades.iter().take(5).enumerate() {
        println!("{}. {} {}: ${:.2} ({:.2}%)", 
                 i + 1, 
                 trade.symbol, 
                 format!("{:?}", trade.direction),
                 trade.net_profit_loss,
                 trade.profit_loss_pct * 100.0);
    }
    
    println!("\n=== End of Backtest Results ===");
}
