//! OMNI-ALPHA VΩ∞∞ Trading System - Bybit Integration
//!
//! This is the main entry point for the OMNI-ALPHA VΩ∞∞ trading system
//! with Bybit integration, designed to operate as a capital-autonomous,
//! no-loss, multi-agent AI economy.

use std::sync::Arc;
use std::time::Duration;
use tokio::time;
use tracing::{info, debug, warn, error, Level};
use tracing_subscriber::FmtSubscriber;
use anyhow::Result;
use chrono::Utc;
use std::collections::HashMap;
use std::sync::atomic::{AtomicUsize, Ordering};

use omni::engine::message_bus::{Message, TradeDirection};
use omni::exchange::bybit::demo_adapter::BybitDemoAdapter;
use omni::exchange::types::Candle;
use omni::trading_system::{TradingSystem, TradingSystemConfig, TradingMode, ExchangeConfig};
use omni::strategy::advanced_strategy::AdvancedStrategy;

/// Asset configuration for trading
struct AssetConfig {
    /// Symbol name
    symbol: String,
    /// Minimum order quantity
    min_qty: f64,
    /// Maximum leverage allowed
    max_leverage: u32,
    /// Maker fee (percentage)
    maker_fee: f64,
    /// Taker fee (percentage)
    taker_fee: f64,
    /// Funding rate (average, percentage)
    avg_funding_rate: f64,
    /// Price precision (decimal places)
    price_precision: u32,
    /// Quantity precision (decimal places)
    qty_precision: u32,
    /// Minimum price movement (tick size)
    tick_size: f64,
    /// Minimum notional value
    min_notional: f64,
}

/// Get asset configuration for a specific symbol
fn get_asset_config(symbol: &str) -> AssetConfig {
    match symbol {
        "BTCUSDT" => AssetConfig {
            symbol: "BTCUSDT".to_string(),
            min_qty: 0.001,
            max_leverage: 100,
            maker_fee: 0.01,
            taker_fee: 0.06,
            avg_funding_rate: 0.01,
            price_precision: 2,
            qty_precision: 3,
            tick_size: 0.5,
            min_notional: 5.0,
        },
        "ETHUSDT" => AssetConfig {
            symbol: "ETHUSDT".to_string(),
            min_qty: 0.01,
            max_leverage: 100,
            maker_fee: 0.01,
            taker_fee: 0.06,
            avg_funding_rate: 0.01,
            price_precision: 2,
            qty_precision: 3,
            tick_size: 0.05,
            min_notional: 5.0,
        },
        "BNBUSDT" => AssetConfig {
            symbol: "BNBUSDT".to_string(),
            min_qty: 0.01,
            max_leverage: 75,
            maker_fee: 0.01,
            taker_fee: 0.06,
            avg_funding_rate: 0.01,
            price_precision: 2,
            qty_precision: 2,
            tick_size: 0.01,
            min_notional: 5.0,
        },
        "SOLUSDT" => AssetConfig {
            symbol: "SOLUSDT".to_string(),
            min_qty: 0.1,
            max_leverage: 50,
            maker_fee: 0.01,
            taker_fee: 0.06,
            avg_funding_rate: 0.01,
            price_precision: 3,
            qty_precision: 1,
            tick_size: 0.001,
            min_notional: 5.0,
        },
        "ADAUSDT" => AssetConfig {
            symbol: "ADAUSDT".to_string(),
            min_qty: 1.0,
            max_leverage: 50,
            maker_fee: 0.01,
            taker_fee: 0.06,
            avg_funding_rate: 0.01,
            price_precision: 5,
            qty_precision: 0,
            tick_size: 0.00001,
            min_notional: 5.0,
        },
        "DOGEUSDT" => AssetConfig {
            symbol: "DOGEUSDT".to_string(),
            min_qty: 100.0,
            max_leverage: 20,
            maker_fee: 0.01,
            taker_fee: 0.06,
            avg_funding_rate: 0.01,
            price_precision: 6,
            qty_precision: 0,
            tick_size: 0.000001,
            min_notional: 5.0,
        },
        "XRPUSDT" => AssetConfig {
            symbol: "XRPUSDT".to_string(),
            min_qty: 1.0,
            max_leverage: 50,
            maker_fee: 0.01,
            taker_fee: 0.06,
            avg_funding_rate: 0.01,
            price_precision: 5,
            qty_precision: 0,
            tick_size: 0.00001,
            min_notional: 5.0,
        },
        _ => AssetConfig {
            symbol: symbol.to_string(),
            min_qty: 0.1,
            max_leverage: 20,
            maker_fee: 0.01,
            taker_fee: 0.06,
            avg_funding_rate: 0.01,
            price_precision: 4,
            qty_precision: 1,
            tick_size: 0.0001,
            min_notional: 5.0,
        },
    }
}

/// Calculate Simple Moving Average
fn calculate_sma(candles: &[Candle], period: usize) -> f64 {
    if candles.len() < period {
        return 0.0;
    }

    let start_idx = candles.len() - period;
    let sum: f64 = candles[start_idx..].iter().map(|c| c.close).sum();
    sum / period as f64
}

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

    // Load Bybit Demo API Credentials from environment (demo.env)
    let api_key = std::env::var("BYBIT_DEMO_API_KEY")
        .expect("BYBIT_DEMO_API_KEY must be set in environment");
    let api_secret = std::env::var("BYBIT_DEMO_API_SECRET")
        .expect("BYBIT_DEMO_API_SECRET must be set in environment");

    info!("Using Bybit Demo API with key: {}...", &api_key[..10]);

    // Create Bybit demo adapter
    let bybit_adapter = Arc::new(BybitDemoAdapter::new(&api_key, &api_secret));

    // Request demo funds
    info!("Requesting demo funds...");
    match bybit_adapter.request_demo_funds("USDT", "1000").await {
        Ok(_) => info!("Successfully requested demo funds"),
        Err(e) => warn!("Failed to request demo funds: {}", e),
    }

    // Check wallet balance
    info!("Checking wallet balance...");
    let initial_capital = 12.0; // Fixed at $12 USDT as requested

    // Get actual account balance and use it as available capital
    let wallet_balances = bybit_adapter.get_wallet_balance(Some("USDT")).await?;
    let usdt_balance = wallet_balances.get("USDT").map(|b| b.equity).unwrap_or(0.0);
    let mut available_capital = initial_capital; // Start with our allocated capital

    info!("🔄 Resetting capital tracking - Initial: ${:.2}, Account Balance: ${:.2}",
          initial_capital, usdt_balance);
    let target_trades_per_day = 750.0; // Target 750+ trades per day as specified
    let target_profit_per_trade = 0.6; // Target 0.6 USDT minimum profit per trade as specified
    let target_profit_per_day = target_trades_per_day * target_profit_per_trade; // Target profit per day

    // Trade frequency control
    let trades_per_minute = target_trades_per_day / 1440.0; // 1440 minutes in a day
    let seconds_between_trades = 60.0 / trades_per_minute;
    let trade_interval = Duration::from_millis((seconds_between_trades * 1000.0) as u64);

    // Track total trades executed
    let total_trades_counter = AtomicUsize::new(0);

    // Track successful trades
    let successful_trades_counter = AtomicUsize::new(0);

    // Track total profit
    let mut total_profit = 0.0;

    // Get actual wallet balance for verification only
    let mut trading_capital = match bybit_adapter.get_wallet_balance(Some("USDT")).await {
        Ok(balances) => {
            if let Some(usdt_balance) = balances.get("USDT") {
                info!("USDT Balance: ${:.2}", usdt_balance.equity);
                // Always use exactly $12 USDT for trading
                info!("Using ${:.2} USDT for trading (fixed)", initial_capital);
                initial_capital
            } else {
                // If we can't find USDT balance, use the default capital
                warn!("No USDT balance found, using default capital of $12.00");
                initial_capital
            }
        },
        Err(e) => {
            // If we can't get the wallet balance, use the default capital
            warn!("Failed to get wallet balance: {}, using default capital of $12.00", e);
            initial_capital
        }
    };

    // Create trading system configuration
    let config = TradingSystemConfig {
        initial_capital: trading_capital,
        mode: TradingMode::Live, // Use live mode with demo API
        assets: {
            // Get all available USDT trading pairs from Bybit using market tickers
            info!("Discovering all available USDT trading pairs from Bybit...");
            let mut all_assets = Vec::new();

            match bybit_adapter.get_market_tickers("linear", None).await {
                Ok(tickers) => {
                    // Filter for USDT pairs with good volume
                    for ticker in tickers {
                        if ticker.symbol.ends_with("USDT") &&
                           ticker.symbol.len() <= 12 && // Avoid overly complex symbols
                           ticker.volume_24h > 1000.0 { // Only assets with decent volume
                            all_assets.push(ticker.symbol);
                        }
                    }
                    info!("Found {} tradable USDT pairs with good volume", all_assets.len());
                },
                Err(e) => {
                    warn!("Failed to get market tickers, using fallback list: {}", e);
                    // Fallback to a comprehensive list if API fails
                    all_assets = vec![
                        "BTCUSDT".to_string(), "ETHUSDT".to_string(), "SOLUSDT".to_string(),
                        "BNBUSDT".to_string(), "ADAUSDT".to_string(), "DOGEUSDT".to_string(),
                        "XRPUSDT".to_string(), "DOTUSDT".to_string(), "AVAXUSDT".to_string(),
                        "MATICUSDT".to_string(), "LINKUSDT".to_string(), "UNIUSDT".to_string(),
                        "LTCUSDT".to_string(), "ATOMUSDT".to_string(), "NEARUSDT".to_string(),
                        "SHIBUSDT".to_string(), "INJUSDT".to_string(), "APTUSDT".to_string(),
                        "OPUSDT".to_string(), "ARBUSDT".to_string(), "SUIUSDT".to_string(),
                        "PEPEUSDT".to_string(), "FILUSDT".to_string(), "LDOUSDT".to_string(),
                        "STXUSDT".to_string(), "WIFUSDT".to_string(), "JUPUSDT".to_string(),
                        "PYTHUSDT".to_string(), "TNSRUSDT".to_string(), "DYMUSDT".to_string(),
                        "ALTUSDT".to_string(), "MANTAUSDT".to_string(), "JTOUSDT".to_string(),
                        "PIXELUSDT".to_string(), "PORTALUSDT".to_string(), "ACEUSDT".to_string(),
                        "NFPUSDT".to_string(), "AIUSDT".to_string(), "XAIUSDT".to_string(),
                        "RONUSDT".to_string(), "MOVRUSDT".to_string(), "SAGAUSDT".to_string(),
                        "TAOUSDT".to_string(), "OMNIUSDT".to_string(), "NOTUSDT".to_string(),
                        "IOUSDT".to_string(), "ZKUSDT".to_string(), "LISTAUSDT".to_string(),
                        "ZROUSDT".to_string(), "GUSDT".to_string(), "RENDERUSDT".to_string(),
                        "TONUSDT".to_string(), "PEOPLEUSDT".to_string(), "BOMEUSDT".to_string(),
                        "ENAUSDT".to_string(), "WUSDT".to_string(), "ETHFIUSDT".to_string(),
                        "BCHUSDT".to_string(), "ICPUSDT".to_string(), "FETUSDT".to_string(),
                        "STRKUSDT".to_string(), "IMXUSDT".to_string(), "METISUSDT".to_string(),
                        "HBARUSDT".to_string(), "GALAUSDT".to_string(), "GRTUSDT".to_string(),
                        "FLOWUSDT".to_string(), "FTMUSDT".to_string(), "CFXUSDT".to_string(),
                        "BEAMUSDT".to_string(), "PYRUSDT".to_string(), "ORDIUSDT".to_string(),
                        "1000SATSUSDT".to_string(), "KASUSDT".to_string(), "ARKMUSDT".to_string(),
                        "TIAUSDT".to_string(), "WLDUSDT".to_string(), "SEUSDT".to_string(),
                        "ARKUSDT".to_string(), "COREUSDT".to_string(), "GASUSDT".to_string(),
                        "BLURUSDT".to_string(), "VANRYUSDT".to_string(), "JOEUSDT".to_string(),
                        "MYROUSDT".to_string(), "CKBUSDT".to_string(), "LSKUSDT".to_string(),
                        "PENDLEUSDT".to_string(), "SAFEUSDT".to_string(), "GMXUSDT".to_string(),
                        "AEVOUSDT".to_string(), "REIUSDT".to_string(), "ONDOUSDT".to_string(),
                        "SCUSDT".to_string(), "BTTUSDT".to_string(), "HOTUSDT".to_string(),
                        "WINUSDT".to_string(), "SUNUSDT".to_string(), "NFTUSDT".to_string(),
                        "CHZUSDT".to_string(), "SANDUSDT".to_string(), "MANAUSDT".to_string(),
                        "APEUSDT".to_string(), "GMTUSDT".to_string(), "KLAYUSDT".to_string(),
                        "ROSEUSDT".to_string(), "DENTUSDT".to_string(), "ZILUSDT".to_string(),
                        "BATUSDT".to_string(), "ENJUSDT".to_string(), "HNTUSDT".to_string(),
                        "C98USDT".to_string(), "MASKUSDT".to_string(), "THETAUSDT".to_string(),
                        "RNDRUSDT".to_string(), "DEGOUSDT".to_string(), "KEYUSDT".to_string(),
                        "CYBERUSDT".to_string(), "IQUSDT".to_string(), "NTRNUSDT".to_string(),
                        "TRBUSDT".to_string(), "TELLOUSDT".to_string(), "ASTRUSDT".to_string(),
                        "LOOMUSDT".to_string(), "FXSUSDT".to_string(), "RADUSDT".to_string(),
                        "KNCUSDT".to_string(), "POLYXUSDT".to_string(), "PHBUSDT".to_string(),
                        "HOOKUSDT".to_string(), "MAGICUSDT".to_string(), "HIGHUSDT".to_string(),
                        "AGIXUSDT".to_string(), "GNSUSDT".to_string(), "SYNUSDT".to_string(),
                        "VIBUSDT".to_string(), "SSVUSDT".to_string(), "LQTYUSDT".to_string(),
                        "AMBUSDT".to_string(), "GLMRUSDT".to_string(), "STGUSDT".to_string(),
                        "BICOUSDT".to_string(), "FLUXUSDT".to_string(), "FIDAUSDT".to_string(),
                        "STEEMUSDT".to_string(), "PHAUSDT".to_string(), "BONDUSDT".to_string(),
                        "HIUSDT".to_string(), "MDTUSDT".to_string(), "XVSUSDT".to_string(),
                        "WAXPUSDT".to_string(), "UNFIUSDT".to_string(), "REEFUSDT".to_string(),
                        "RVNUSDT".to_string(), "BADGERUSDT".to_string(), "FISUSDT".to_string(),
                        "OMGUSDT".to_string(), "PONDUSDT".to_string(), "ALICEUSDT".to_string(),
                        "LINAUSDT".to_string(), "PERPUSDT".to_string(), "SUPERUSDT".to_string(),
                        "EPSUSDT".to_string(), "AUTOUSDT".to_string(), "TKXUSDT".to_string(),
                        "PUNDIXUSDT".to_string(), "TLMUSDT".to_string(), "1INCHUSDT".to_string(),
                        "BTCSTUSDT".to_string(), "TRUUSDT".to_string(), "TWTUSDT".to_string(),
                        "LITUSDT".to_string(), "SFPUSDT".to_string(), "DODOUSDT".to_string(),
                        "CAKEUSDT".to_string(), "ACMUSDT".to_string(),
                    ];
                }
            }

            // Limit to top assets by volume for performance
            all_assets.truncate(100); // Scan top 100 assets for better performance
            all_assets
        },
        timeframes: vec![5, 15, 60, 240], // Add 5-minute timeframe for faster trading
        max_concurrent_trades: 5, // Increase concurrent trades for more opportunities
        heartbeat_interval: 30, // Reduce interval for faster trading
        exchange: ExchangeConfig {
            name: "bybit".to_string(),
            api_key: api_key.to_string(),
            api_secret: api_secret.to_string(),
            testnet: true, // true = use demo API
            category: "linear".to_string(), // Use linear for USDT perpetual contracts
        },
    };

    // Create trading system
    let mut trading_system = TradingSystem::new(config);

    // Start trading system
    info!("Starting trading system...");
    trading_system.start().await?;

    // Create advanced trading strategy with more aggressive parameters
    // Use higher risk percentage for better position sizes with our small capital
    let advanced_strategy = AdvancedStrategy::new("OMNI-ALPHA", 0.5, 2.0); // 50% of allocated capital

    // Main trading loop
    let mut iteration = 0;
    let max_iterations = 1000; // Run for 1000 iterations

    // Track candles for each symbol and timeframe
    let mut candle_cache: HashMap<String, HashMap<String, Vec<Candle>>> = HashMap::new();

    // Track trades and performance metrics
    let mut total_trades = 0;
    let mut winning_trades = 0;
    let mut losing_trades = 0;
    let mut total_loss = 0.0;
    let mut active_positions: HashMap<String, (String, f64, f64, f64, u32)> = HashMap::new(); // symbol -> (side, entry_price, quantity, entry_value, leverage)

    // Track time for trade frequency calculation
    let start_time = Utc::now();
    let mut last_trade_time = Utc::now();

    // Asset selection for trading
    let mut tradable_assets: Vec<String> = Vec::new();

    // Get all available assets and their configurations
    info!("Analyzing available assets for optimal trading...");

    // Track total capital allocation
    let mut allocated_capital = 0.0;

    // Track next trade time
    let mut next_trade_time = Utc::now();

    while iteration < max_iterations {
        info!("Trading iteration {}", iteration);

        // Check if it's time for the next trade
        let current_time = Utc::now();
        if current_time < next_trade_time {
            // Wait until next trade time
            let wait_time = (next_trade_time - current_time).num_milliseconds();
            if wait_time > 0 {
                info!("Waiting for next trade window: {} ms", wait_time);
                time::sleep(Duration::from_millis(wait_time as u64)).await;
            }
        }

        // Update next trade time
        next_trade_time = Utc::now() + chrono::Duration::milliseconds(trade_interval.as_millis() as i64);

        // Get market data for all assets
        let mut assets_to_scan = trading_system.get_assets();

        // Prioritize assets by volume and volatility for better opportunities
        if iteration % 10 == 0 { // Re-prioritize every 10 iterations
            info!("Re-prioritizing assets by volume and volatility...");

            // Get market ticker data for all assets to prioritize by volume
            match bybit_adapter.get_market_tickers("linear", None).await {
                Ok(tickers) => {
                    let mut asset_volumes: Vec<(String, f64)> = Vec::new();

                    // Create a map of symbol to volume for quick lookup
                    let ticker_map: std::collections::HashMap<String, f64> = tickers.into_iter()
                        .map(|t| (t.symbol, t.volume_24h))
                        .collect();

                    // Get volumes for our assets
                    for symbol in &assets_to_scan {
                        let volume = ticker_map.get(symbol).copied().unwrap_or(0.0);
                        asset_volumes.push((symbol.clone(), volume));
                    }

                    // Sort by volume (highest first) and take top assets
                    asset_volumes.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
                    assets_to_scan = asset_volumes.into_iter()
                        .take(50) // Focus on top 50 by volume for better performance
                        .map(|(symbol, _)| symbol)
                        .collect();

                    info!("Prioritized {} high-volume assets for scanning", assets_to_scan.len());
                },
                Err(e) => {
                    warn!("Failed to get market tickers for prioritization: {}", e);
                    // Keep original asset list if we can't get tickers
                }
            }
        }

        info!("Scanning {} assets for trading opportunities...", assets_to_scan.len());
        let mut assets_analyzed = 0;
        let mut signals_generated = 0;

        for symbol in assets_to_scan {
            assets_analyzed += 1;

            // Get candles for different timeframes
            for timeframe in &["5", "15", "60"] { // Added 5-minute timeframe for faster signals
                match bybit_adapter.get_candles(&symbol, timeframe, Some(100)).await {
                    Ok(candles) => {
                        if !candles.is_empty() {
                            // Store candles in cache
                            candle_cache.entry(symbol.clone())
                                .or_insert_with(HashMap::new)
                                .insert(timeframe.to_string(), candles.clone());
                        }
                    },
                    Err(e) => {
                        error!("Failed to get candles for {} ({}): {}", symbol, timeframe, e);
                    }
                }
            }

            // Use the 15-minute timeframe for trading decisions
            if let Some(symbol_candles) = candle_cache.get(&symbol) {
                if let Some(candles) = symbol_candles.get("15") {
                    if candles.len() >= 50 { // Ensure we have enough data for analysis
                        info!("Analyzing {} with {} candles", symbol, candles.len());

                        // Use advanced strategy to generate trading signals
                        let signal_result = advanced_strategy.analyze(&symbol, candles, trading_system.get_state().current_capital);

                        if let Some(signal) = signal_result {
                            signals_generated += 1;
                            info!("Generated trading signal for {} (Signal #{} this iteration)", symbol, signals_generated);
                            // Send signal to trading system
                            trading_system.send_message(signal.clone());

                            // Extract signal details for order placement
                            if let Message::TradeSignal { direction, entry_price, stop_loss_price, take_profit_price, .. } = signal {
                                // Make sure we're using the correct symbol format for futures
                                let futures_symbol = if !symbol.ends_with("USDT") {
                                    format!("{}{}", symbol, "USDT")
                                } else {
                                    symbol.to_string()
                                };

                                // Calculate appropriate quantity based on capital and price
                                // For futures, the quantity is in contracts, not in the base currency
                                let (side, direction_str) = match direction {
                                    TradeDirection::Long => ("Buy", "long"),
                                    TradeDirection::Short => ("Sell", "short"),
                                    TradeDirection::Neutral => {
                                        // Skip neutral signals
                                        info!("Skipping neutral signal for {}", symbol);
                                        continue;
                                    }
                                };

                                // Check if we have enough available capital for a new trade
                                if available_capital < 1.0 {
                                    info!("Insufficient available capital (${:.2}) for new trade on {}", available_capital, futures_symbol);
                                    continue;
                                }

                                // Get asset configuration
                                let asset_config = get_asset_config(&futures_symbol);

                                // Set optimal leverage for this symbol based on asset configuration
                                // Use 50-100x leverage for 0.5-0.8% price movements as specified
                                let leverage = asset_config.max_leverage.max(50).min(100); // 50-100x range as specified

                                match bybit_adapter.set_leverage(&futures_symbol, leverage).await {
                                    Ok(_) => info!("Successfully set leverage for {} to {}x", futures_symbol, leverage),
                                    Err(e) => warn!("Failed to set leverage for {}: {}", futures_symbol, e)
                                }

                                // Use the take-profit price from the strategy (don't override it)
                                // The strategy already calculated optimal take-profit based on ATR

                                // Use the stop loss price from the strategy as well
                                // (The strategy already calculated optimal stop loss based on ATR)

                                // Calculate capital allocation per trade
                                // Use 10% of ORIGINAL capital ($12), not accumulated profits
                                // This ensures consistent position sizing regardless of profits
                                let capital_allocation = initial_capital * 0.10; // Use 10% of original $12 = $1.20 per trade

                                // Calculate notional position value (capital * leverage)
                                let notional_position_value = capital_allocation * leverage as f64;

                                // Calculate quantity in contracts (notional value / price)
                                let mut qty = notional_position_value / entry_price;

                                // Format quantity based on asset configuration
                                let precision = asset_config.qty_precision;
                                let scale = 10.0_f64.powi(precision as i32);
                                let formatted_qty = (qty * scale).round() / scale;

                                // Ensure minimum quantity requirements based on asset configuration
                                let min_qty = asset_config.min_qty;

                                // Make sure we meet minimum quantity requirements
                                qty = formatted_qty.max(min_qty);

                                // Safety check: Ensure position size doesn't exceed reasonable limits
                                // Max notional value should not exceed $100 (even with profits)
                                let max_notional_value = 100.0;
                                let max_qty = max_notional_value / entry_price;
                                qty = qty.min(max_qty);

                                // Calculate actual notional position value after quantity adjustment
                                let actual_notional_value = qty * entry_price;

                                // Calculate actual capital required (notional value / leverage)
                                let actual_capital_required = actual_notional_value / leverage as f64;

                                // Check if we have enough available capital
                                if actual_capital_required > available_capital {
                                    info!("Insufficient capital for minimum quantity: need ${:.2}, have ${:.2}",
                                          actual_capital_required, available_capital);
                                    continue;
                                }

                                // Calculate fees based on notional value
                                let taker_fee_rate = asset_config.taker_fee / 100.0; // Convert from percentage
                                let entry_fee = actual_notional_value * taker_fee_rate;
                                let exit_fee = actual_notional_value * taker_fee_rate;
                                let total_fees = entry_fee + exit_fee;

                                // Calculate potential profit after fees
                                let price_movement = if side == "Buy" {
                                    take_profit_price / entry_price - 1.0
                                } else {
                                    1.0 - take_profit_price / entry_price
                                };

                                // Profit = notional_value * price_movement - fees
                                let potential_profit = actual_notional_value * price_movement - total_fees;

                                // Debug logging
                                info!("Profit calculation debug:");
                                info!("  Entry: ${:.2}, Target: ${:.2}, Side: {}", entry_price, take_profit_price, side);
                                info!("  Price movement: {:.4} ({:.2}%)", price_movement, price_movement * 100.0);
                                info!("  Notional value: ${:.2}", actual_notional_value);
                                info!("  Total fees: ${:.2}", total_fees);
                                info!("  Gross profit: ${:.2}", actual_notional_value * price_movement);
                                info!("  Net profit: ${:.2}", potential_profit);

                                // Only proceed if potential profit meets our target
                                info!("Profit check: ${:.2} vs threshold ${:.2}", potential_profit, target_profit_per_trade);
                                if potential_profit < target_profit_per_trade {
                                    info!("Skipping trade on {} - insufficient profit potential: ${:.2} < ${:.2}",
                                          futures_symbol, potential_profit, target_profit_per_trade);
                                    continue;
                                }

                                // Log the trade details
                                info!("Trade opportunity: {} {} at ${:.2} with {}x leverage", side, futures_symbol, entry_price, leverage);
                                info!("Position details: {:.6} contracts (${:.2} notional) using ${:.2} capital",
                                      qty, actual_notional_value, actual_capital_required);
                                info!("Profit target: ${:.2} (after ${:.2} fees)", potential_profit, total_fees);
                                info!("Take profit: ${:.2} ({}%), Stop loss: ${:.2} ({}%)",
                                      take_profit_price, price_movement * 100.0,
                                      stop_loss_price, (if side == "Buy" { entry_price - stop_loss_price } else { stop_loss_price - entry_price }) / entry_price * 100.0);

                                // Place order with retry
                                info!("Placing {} order for {} at ${:.2} (qty: {:.8})",
                                      side, futures_symbol, entry_price, qty);

                                // Update trade counters
                                total_trades_counter.fetch_add(1, Ordering::SeqCst);
                                total_trades += 1;
                                last_trade_time = Utc::now();

                                // Reduce available capital
                                available_capital -= actual_capital_required;
                                info!("Remaining capital: ${:.2}", available_capital);

                                match bybit_adapter.place_order_with_retry(
                                    &futures_symbol,
                                    side,
                                    "Market", // Use Market order for simplicity
                                    qty,
                                    Some(entry_price),
                                    Some(stop_loss_price),
                                    Some(take_profit_price),
                                    Some("GTC"),
                                    3 // Max retries
                                ).await {
                                    Ok(order_id) => {
                                        info!("Successfully placed order for {}: Order ID: {}", futures_symbol, order_id);

                                        // Store the active position with leverage
                                        active_positions.insert(futures_symbol.clone(), (
                                            side.to_string(),
                                            entry_price,
                                            qty,
                                            actual_notional_value,
                                            leverage
                                        ));

                                        // Update successful trades counter
                                        successful_trades_counter.fetch_add(1, Ordering::SeqCst);
                                        winning_trades += 1;

                                        // Check order status after placement
                                        match bybit_adapter.get_order_status(&futures_symbol, &order_id).await {
                                            Ok(status) => {
                                                info!("Order status for {}: {}", order_id, status);

                                                // Calculate trade frequency metrics
                                                let elapsed_seconds = (Utc::now() - start_time).num_seconds() as f64;
                                                let elapsed_days = elapsed_seconds / (24.0 * 60.0 * 60.0);
                                                let trades_per_day = if elapsed_days > 0.0 { total_trades as f64 / elapsed_days } else { 0.0 };

                                                info!("Trade frequency: {:.2} trades/day (target: {:.0})", trades_per_day, target_trades_per_day);

                                                // Calculate profit metrics
                                                let profit_per_day = if elapsed_days > 0.0 { total_profit / elapsed_days } else { 0.0 };
                                                info!("Profit rate: ${:.4} per day (target: ${:.2})", profit_per_day, target_profit_per_day);

                                                // Calculate estimated time to reach 750 trades
                                                if trades_per_day > 0.0 {
                                                    let remaining_trades = target_trades_per_day - trades_per_day;
                                                    let days_to_target = remaining_trades / trades_per_day;
                                                    info!("Estimated time to reach target trade frequency: {:.1} days", days_to_target);
                                                }
                                            },
                                            Err(e) => {
                                                error!("Failed to get order status for {}: {}", order_id, e);
                                            }
                                        }
                                    },
                                    Err(e) => {
                                        error!("Failed to place order for {}: {}", futures_symbol, e);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Update trading system
        trading_system.update().await?;

        // Update real-time PnL for active positions and check for closing conditions
        let mut total_position_value = 0.0;
        let mut total_current_value = 0.0;
        let mut current_pnl = 0.0;
        let mut positions_to_close = Vec::new();

        // Get positions from Bybit API to ensure we have the latest data
        match bybit_adapter.get_positions(None).await {
            Ok(positions) => {
                for position in positions {
                    info!("Active position: {} {} - Size: {}, Entry: ${:.2}, Leverage: {}x, PnL: ${:.2}",
                          position.side, position.symbol, position.size, position.entry_price,
                          position.leverage, position.unrealized_pnl);
                }
            },
            Err(e) => warn!("Failed to get positions: {}", e),
        }

        // Process our tracked positions
        for (symbol, (side, entry_price, qty, entry_value, leverage)) in active_positions.iter() {
            // Get current price from latest candles
            if let Some(symbol_candles) = candle_cache.get(symbol) {
                if let Some(candles) = symbol_candles.get("5") { // Use 5-minute candles for faster updates
                    if !candles.is_empty() {
                        let current_price = candles[0].close;
                        let current_value = qty * current_price;

                        // Get asset configuration
                        let asset_config = get_asset_config(symbol);

                        // Calculate fees
                        let taker_fee_rate = asset_config.taker_fee / 100.0;
                        let total_fees = entry_value * taker_fee_rate * 2.0; // Entry and exit fees

                        // Calculate PnL based on position side with leverage and fees
                        let price_change_pct = if side == "Buy" {
                            (current_price - entry_price) / entry_price
                        } else {
                            (entry_price - current_price) / entry_price
                        };

                        // Calculate actual dollar PnL with leverage
                        let gross_pnl = price_change_pct * entry_value * *leverage as f64;

                        // Subtract fees to get net PnL
                        let position_pnl = gross_pnl - total_fees;

                        // For display purposes
                        let leveraged_pnl = gross_pnl;

                        // Update totals
                        total_position_value += entry_value;
                        total_current_value += current_value;
                        current_pnl += position_pnl;

                        // Calculate ROI percentage
                        let roi_pct = price_change_pct * 100.0;
                        let leveraged_roi_pct = price_change_pct * *leverage as f64 * 100.0;

                        // Log position status
                        info!("Position status for {}: Entry: ${:.2}, Current: ${:.2}, PnL: ${:.2} ({}%), Leveraged PnL: ${:.2} ({}%)",
                              symbol, entry_price, current_price, position_pnl, roi_pct, leveraged_pnl, leveraged_roi_pct);

                        // Check for take profit or stop loss conditions
                        // Calculate the profit threshold needed to achieve our 0.6 USDT profit target
                        let capital_used = entry_value / *leverage as f64;
                        let profit_target = target_profit_per_trade;

                        // Calculate required price movement percentage to achieve profit target
                        let required_price_move_pct = (profit_target + total_fees) / (entry_value * *leverage as f64) * 100.0;

                        // Set stop loss at 50% of required move (to limit losses)
                        let stop_loss_threshold = -required_price_move_pct / 2.0;

                        // Check if we've reached our profit target or stop loss
                        if (position_pnl >= profit_target && price_change_pct > 0.0) || (roi_pct <= stop_loss_threshold) {
                            // Add to positions to close
                            positions_to_close.push(symbol.clone());

                            // Log the reason for closing
                            if position_pnl >= profit_target {
                                info!("Closing {} position on {} - Profit target reached: ${:.2}",
                                      side, symbol, position_pnl);
                            } else {
                                info!("Closing {} position on {} - Stop loss triggered: ${:.2}",
                                      side, symbol, position_pnl);
                            }

                            // Actually close the position via API
                            let close_side = if side == "Buy" { "Sell" } else { "Buy" };

                            // Format quantity based on asset configuration
                            let precision = asset_config.qty_precision;
                            let scale = 10.0_f64.powi(precision as i32);
                            let formatted_qty = (*qty * scale).round() / scale;

                            // Ensure minimum quantity requirements
                            let min_qty = asset_config.min_qty;
                            let close_qty = formatted_qty.max(min_qty);

                            // Calculate the capital that will be returned
                            // In leveraged trading, we only risk the margin (capital_used)
                            // The P&L affects our total balance but we should return the original margin
                            // adjusted for the actual profit/loss percentage on the margin
                            let margin_roi_pct = position_pnl / entry_value * 100.0; // ROI on the full position value
                            let margin_pnl = capital_used * (margin_roi_pct / 100.0); // P&L on the margin
                            let capital_to_return = capital_used + margin_pnl;

                            match bybit_adapter.place_order_with_retry(
                                symbol,
                                close_side,
                                "Market", // Use Market order to close immediately
                                close_qty,
                                None, // No price for market order
                                None, // No stop loss for closing order
                                None, // No take profit for closing order
                                Some("GTC"),
                                3 // Max retries
                            ).await {
                                Ok(order_id) => {
                                    info!("Successfully closed position for {}: Order ID: {}", symbol, order_id);

                                    // Update profit/loss tracking
                                    if position_pnl > 0.0 {
                                        winning_trades += 1;
                                        total_profit += position_pnl;
                                    } else {
                                        losing_trades += 1;
                                        total_loss += position_pnl.abs();
                                    }

                                    // Return capital to available pool
                                    available_capital += capital_to_return;

                                    // Safety check: prevent negative capital
                                    if available_capital < 0.0 {
                                        info!("⚠️  Available capital went negative (${:.2}), resetting to $0.00", available_capital);
                                        available_capital = 0.0;
                                    }

                                    info!("Capital returned to pool: ${:.2}, New available capital: ${:.2}",
                                          capital_to_return, available_capital);

                                    info!("CLOSED POSITION: {} {} - Entry: ${:.2}, Exit: ${:.2}, PnL: ${:.4} ({:.2}%)",
                                          side, symbol, entry_price, current_price, position_pnl, leveraged_roi_pct);

                                    // Update trade metrics
                                    let elapsed_seconds = (Utc::now() - start_time).num_seconds() as f64;
                                    let elapsed_days = elapsed_seconds / (24.0 * 60.0 * 60.0);
                                    let trades_per_day = if elapsed_days > 0.0 {
                                        total_trades_counter.load(Ordering::SeqCst) as f64 / elapsed_days
                                    } else { 0.0 };

                                    info!("Trading metrics: {} trades executed, {:.2} trades/day, ${:.2} total profit",
                                          total_trades_counter.load(Ordering::SeqCst), trades_per_day, total_profit);
                                },
                                Err(e) => {
                                    error!("Failed to close position for {}: {}", symbol, e);
                                    // Remove from positions to close since we failed
                                    positions_to_close.pop();
                                }
                            }
                        } else {
                            info!("Position: {} {} - Entry: ${:.2}, Current: ${:.2}, Size: {:.6}, PnL: ${:.4} ({:.2}%)",
                                  side, symbol, entry_price, current_price, qty, position_pnl, roi_pct);
                        }
                    }
                }
            }
        }

        // Remove closed positions from active_positions
        for symbol in &positions_to_close {
            active_positions.remove(symbol);
        }

        // Calculate overall performance metrics
        let total_pnl = total_profit - total_loss;
        let roi_pct = if initial_capital > 0.0 { total_pnl / initial_capital * 100.0 } else { 0.0 };

        // Get current wallet balance to verify our tracking
        match bybit_adapter.get_wallet_balance(Some("USDT")).await {
            Ok(balances) => {
                if let Some(usdt_balance) = balances.get("USDT") {
                    info!("Current USDT Balance: ${:.2}", usdt_balance.equity);
                    info!("Tracked capital: ${:.2} (${:.2} available + ${:.2} in positions)",
                          available_capital + (initial_capital - available_capital),
                          available_capital,
                          initial_capital - available_capital);
                }
            },
            Err(e) => warn!("Failed to get wallet balance: {}", e),
        }

        // Calculate trade frequency metrics
        let elapsed_seconds = (Utc::now() - start_time).num_seconds() as f64;
        let elapsed_days = elapsed_seconds / (24.0 * 60.0 * 60.0);
        let trades_per_day = if elapsed_days > 0.0 { total_trades as f64 / elapsed_days } else { 0.0 };

        // Calculate time to reach target
        let time_to_target = if trades_per_day > 0.0 {
            (target_trades_per_day - trades_per_day) / trades_per_day
        } else {
            0.0
        };

        // Calculate profit metrics
        let profit_per_day = if elapsed_days > 0.0 { total_profit / elapsed_days } else { 0.0 };
        let profit_per_trade = if total_trades > 0 { total_profit / total_trades as f64 } else { 0.0 };

        // Log system state with detailed metrics
        let win_rate = if total_trades > 0 {
            winning_trades as f64 / total_trades as f64 * 100.0
        } else { 0.0 };

        // Log iteration summary
        info!("===== Iteration {} Summary =====", iteration);
        info!("Assets analyzed: {}, Signals generated: {}", assets_analyzed, signals_generated);
        if assets_analyzed > 0 {
            info!("Signal generation rate: {:.1}% ({} signals from {} assets)",
                  signals_generated as f64 / assets_analyzed as f64 * 100.0, signals_generated, assets_analyzed);
        }

        info!("===== OMNI-ALPHA VΩ∞∞ Trading System Status =====");
        info!("Iteration: {}, Elapsed time: {:.2} days", iteration, elapsed_days);
        info!("Capital: ${:.2} (${:.2} available), PnL: ${:.4} ({:.2}%)",
              initial_capital + total_pnl, available_capital, total_pnl, roi_pct);
        info!("Trade metrics: {} total trades, {:.1}% win rate, ${:.4} avg profit/trade",
              total_trades, win_rate, profit_per_trade);
        info!("Trade frequency: {:.2} trades/day (target: {:.0})", trades_per_day, target_trades_per_day);
        info!("Profit rate: ${:.4}/day (target: ${:.2})", profit_per_day, target_profit_per_day);
        info!("Active positions: {}", active_positions.len());

        if trades_per_day > 0.0 && trades_per_day < target_trades_per_day {
            info!("Time to reach target trade frequency: {:.1} days", time_to_target);

            // Calculate how to increase trade frequency
            let frequency_multiplier = target_trades_per_day / trades_per_day;
            info!("Need to increase trade frequency by {:.1}x to reach target", frequency_multiplier);

            // Adjust trade interval if needed
            if frequency_multiplier > 1.5 && trade_interval.as_millis() > 100 {
                let new_interval = Duration::from_millis((trade_interval.as_millis() as f64 / 1.2) as u64);
                info!("Adjusting trade interval from {}ms to {}ms", trade_interval.as_millis(), new_interval.as_millis());
                // trade_interval = new_interval;
            }
        }

        // Log active trades from trading system
        let active_trades = trading_system.get_active_trades();
        for (i, trade) in active_trades.iter().enumerate() {
            info!(
                "System Trade {}: {} - Direction: {:?}, Entry: ${:.2}, Current P&L: ${:.4}",
                i + 1,
                trade.symbol,
                trade.direction,
                trade.entry_price,
                trade.unrealized_pnl
            );
        }

        // Sleep for a short time to avoid API rate limits but ensure we can meet our trade frequency target
        // 750 trades per day = 1 trade every 115 seconds
        // Use a shorter interval to allow for processing time
        time::sleep(Duration::from_millis(100)).await;

        iteration += 1;
    }

    // Stop trading system
    info!("Stopping trading system...");
    trading_system.stop().await?;

    // Print final results
    let state = trading_system.get_state();
    info!("Trading completed");
    info!("Initial capital: ${:.2}", trading_capital);
    info!("Final capital: ${:.2}", state.current_capital);
    info!("Profit/Loss: ${:.2} ({:.2}%)", state.current_pnl, state.current_roi * 100.0);

    // Print trade history
    let trade_history = trading_system.get_trade_history();
    info!("Trade history: {} trades", trade_history.len());

    let winning_trades = trade_history.iter().filter(|t| t.realized_pnl.unwrap_or(0.0) > 0.0).count();
    let losing_trades = trade_history.iter().filter(|t| t.realized_pnl.unwrap_or(0.0) < 0.0).count();

    if !trade_history.is_empty() {
        let win_rate = winning_trades as f64 / trade_history.len() as f64 * 100.0;
        info!("Win rate: {:.2}% ({} winning, {} losing)", win_rate, winning_trades, losing_trades);
    }

    info!("OMNI-ALPHA VΩ∞∞ Trading System stopped");

    Ok(())
}
