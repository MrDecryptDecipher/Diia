//! Market Simulator
//!
//! This module provides a market simulator for backtesting and simulation
//! of the OMNI-ALPHA VΩ∞∞ trading system.

use std::collections::{HashMap, VecDeque};
use std::path::Path;
use chrono::{DateTime, Utc, Duration, TimeZone};
use serde::{Deserialize, Serialize};
use anyhow::Result;
use rand::prelude::*;
use rand_distr::{Normal, Distribution};
use tracing::{info, debug, warn, error};

use crate::trading_system::MarketData;

/// Maximum number of candles to generate
const MAX_CANDLES: usize = 10000;

/// Market simulator mode
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum SimulatorMode {
    /// Generate synthetic data
    Synthetic,

    /// Use historical data
    Historical,

    /// Replay recorded data
    Replay,
}

/// Market simulator configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarketSimulatorConfig {
    /// Simulator mode
    pub mode: SimulatorMode,

    /// Data directory for historical data
    pub data_dir: String,

    /// Start date for simulation
    pub start_date: Option<DateTime<Utc>>,

    /// End date for simulation
    pub end_date: Option<DateTime<Utc>>,

    /// Volatility for synthetic data
    pub volatility: f64,

    /// Drift for synthetic data
    pub drift: f64,

    /// Random seed for synthetic data
    pub seed: Option<u64>,
}

impl Default for MarketSimulatorConfig {
    fn default() -> Self {
        Self {
            mode: SimulatorMode::Synthetic,
            data_dir: "data".to_string(),
            start_date: None,
            end_date: None,
            volatility: 0.01,
            drift: 0.0001,
            seed: None,
        }
    }
}

/// Market simulator
pub struct MarketSimulator {
    /// Simulator configuration
    config: MarketSimulatorConfig,

    /// Market data by symbol and timeframe
    data: HashMap<String, HashMap<u64, VecDeque<MarketData>>>,

    /// Current position in data
    position: HashMap<String, HashMap<u64, usize>>,

    /// Random number generator
    rng: std::sync::Mutex<ThreadRng>,

    /// Base prices for synthetic data
    base_prices: HashMap<String, f64>,

    /// Current timestamp
    current_timestamp: DateTime<Utc>,
}

impl MarketSimulator {
    /// Create a new market simulator
    pub fn new() -> Self {
        Self {
            config: MarketSimulatorConfig::default(),
            data: HashMap::new(),
            position: HashMap::new(),
            rng: std::sync::Mutex::new(thread_rng()),
            base_prices: HashMap::new(),
            current_timestamp: Utc::now(),
        }
    }

    /// Create a new market simulator with configuration
    pub fn with_config(config: MarketSimulatorConfig) -> Self {
        let current_timestamp = config.start_date.unwrap_or_else(Utc::now);

        Self {
            config,
            data: HashMap::new(),
            position: HashMap::new(),
            rng: std::sync::Mutex::new(thread_rng()),
            base_prices: HashMap::new(),
            current_timestamp,
        }
    }

    /// Initialize the simulator
    pub fn initialize(&mut self, symbols: &[String], timeframes: &[u64]) -> Result<()> {
        info!("Initializing market simulator in {:?} mode", self.config.mode);

        match self.config.mode {
            SimulatorMode::Synthetic => {
                // Initialize synthetic data
                self.initialize_synthetic(symbols, timeframes)?;
            },
            SimulatorMode::Historical => {
                // Load historical data
                self.load_historical_data(symbols, timeframes)?;
            },
            SimulatorMode::Replay => {
                // Load replay data
                self.load_replay_data(symbols, timeframes)?;
            },
        }

        Ok(())
    }

    /// Initialize synthetic data
    fn initialize_synthetic(&mut self, symbols: &[String], timeframes: &[u64]) -> Result<()> {
        debug!("Initializing synthetic data for {} symbols", symbols.len());

        // Set base prices
        for symbol in symbols {
            let base_price = match symbol.as_str() {
                "BTCUSDT" => 50000.0,
                "ETHUSDT" => 3000.0,
                "SOLUSDT" => 100.0,
                "BNBUSDT" => 500.0,
                "ADAUSDT" => 1.0,
                "DOGEUSDT" => 0.1,
                _ => 100.0,
            };

            self.base_prices.insert(symbol.clone(), base_price);

            // Initialize data structures
            let mut symbol_data = HashMap::new();
            let mut symbol_position = HashMap::new();

            for &timeframe in timeframes {
                // Generate synthetic data
                let candles = self.generate_synthetic_data(symbol, base_price, timeframe)?;

                // Store data
                symbol_data.insert(timeframe, candles);
                symbol_position.insert(timeframe, 0);
            }

            self.data.insert(symbol.clone(), symbol_data);
            self.position.insert(symbol.clone(), symbol_position);
        }

        Ok(())
    }

    /// Generate synthetic data (static version)
    fn generate_synthetic_data_static(symbol: &str, base_price: f64, timeframe: u64) -> Result<VecDeque<MarketData>> {
        let mut candles = VecDeque::with_capacity(MAX_CANDLES);

        // Set up parameters
        let volatility = 0.02; // 2% volatility
        let drift = 0.0001; // Small upward drift

        // Create random number generator
        let mut rng = rand::thread_rng();
        let normal = Normal::new(0.0, 1.0).unwrap();

        // Generate candles
        let mut price = base_price;
        let start_time = Utc::now() - chrono::Duration::seconds((MAX_CANDLES as i64) * (timeframe as i64));
        let mut timestamp = start_time;

        for _ in 0..MAX_CANDLES {
            // Generate random price movement
            let random = normal.sample(&mut rng);

            // Calculate price change
            let dt = (timeframe as f64) / (24.0 * 60.0); // Convert to days
            let price_change = price * (drift * dt + volatility * random * dt.sqrt());

            // Update price
            let open = price;
            price += price_change;
            let close = price;

            // Generate high and low
            let price_range = (close - open).abs() * 1.5;
            let high = f64::max(open, close) + price_range * rng.gen::<f64>();
            let low = f64::min(open, close) - price_range * rng.gen::<f64>();

            // Generate volume
            let volume = rng.gen_range(1000.0..10000.0) * (1.0 + price_range / price);

            // Create market data
            let data = MarketData {
                symbol: symbol.to_string(),
                timestamp,
                open,
                high,
                low,
                close,
                volume,
                timeframe,
            };

            // Add to candles
            candles.push_back(data);

            // Update timestamp
            timestamp = timestamp + chrono::Duration::seconds(timeframe as i64);
        }

        Ok(candles)
    }

    /// Generate synthetic data
    fn generate_synthetic_data(&mut self, symbol: &str, base_price: f64, timeframe: u64) -> Result<VecDeque<MarketData>> {
        let mut candles = VecDeque::with_capacity(MAX_CANDLES);

        // Set up parameters
        let volatility = self.config.volatility;
        let drift = self.config.drift;

        // Create normal distribution
        let normal = Normal::new(0.0, 1.0).unwrap();

        // Generate candles
        let mut price = base_price;
        let mut timestamp = self.current_timestamp;

        for _ in 0..MAX_CANDLES {
            // Generate random price movement
            let random;
            let high;
            let low;
            let volume;
            let new_price;

            // Use a block to limit the mutex lock scope
            {
                let mut rng = self.rng.lock().unwrap();
                random = normal.sample(&mut *rng);

                // Calculate price change
                let dt = (timeframe as f64) / (24.0 * 60.0); // Convert to days
                let price_change = price * (drift * dt + volatility * random * dt.sqrt());

                // Calculate new price
                new_price = price + price_change;

                // Generate candle
                let open = price;
                let close = new_price;
                high = open.max(close) * (1.0 + volatility * rng.gen::<f64>() * 0.1);
                low = open.min(close) * (1.0 - volatility * rng.gen::<f64>() * 0.1);
                volume = base_price * 10.0 * (1.0 + rng.gen::<f64>());
            }

            // Generate candle
            let open = price;
            let close = new_price;

            // Create market data
            let data = MarketData {
                symbol: symbol.to_string(),
                timestamp,
                open,
                high,
                low,
                close,
                volume,
                timeframe,
            };

            // Add to candles
            candles.push_back(data);

            // Update price and timestamp
            price = new_price;
            timestamp = timestamp + Duration::minutes(timeframe as i64);
        }

        Ok(candles)
    }

    /// Load historical data
    fn load_historical_data(&mut self, symbols: &[String], timeframes: &[u64]) -> Result<()> {
        debug!("Loading historical data for {} symbols", symbols.len());

        // Check if data directory exists
        let data_dir = Path::new(&self.config.data_dir);
        if !data_dir.exists() || !data_dir.is_dir() {
            return Err(anyhow::anyhow!("Data directory does not exist: {}", self.config.data_dir));
        }

        // Load data for each symbol and timeframe
        for symbol in symbols {
            let mut symbol_data = HashMap::new();
            let mut symbol_position = HashMap::new();

            for &timeframe in timeframes {
                // Construct file path
                let file_name = format!("{}_{}.csv", symbol, timeframe);
                let file_path = data_dir.join(file_name);

                if file_path.exists() {
                    // Load data from CSV
                    let candles = self.load_csv_data(&file_path, symbol, timeframe)?;

                    // Store data
                    symbol_data.insert(timeframe, candles);
                    symbol_position.insert(timeframe, 0);
                } else {
                    warn!("Historical data file not found: {}", file_path.display());

                    // Generate synthetic data as fallback
                    let base_price = 100.0;
                    let candles = MarketSimulator::generate_synthetic_data_static(symbol, base_price, timeframe)?;

                    // Store data
                    symbol_data.insert(timeframe, candles);
                    symbol_position.insert(timeframe, 0);
                }
            }

            self.data.insert(symbol.clone(), symbol_data);
            self.position.insert(symbol.clone(), symbol_position);
        }

        Ok(())
    }

    /// Load CSV data
    fn load_csv_data(&self, file_path: &Path, symbol: &str, timeframe: u64) -> Result<VecDeque<MarketData>> {
        let mut candles = VecDeque::with_capacity(MAX_CANDLES);

        // Open CSV file
        let file = std::fs::File::open(file_path)?;
        let mut rdr = csv::Reader::from_reader(file);

        // Read records
        for result in rdr.records() {
            let record = result?;

            // Parse record
            if record.len() >= 7 {
                let timestamp_str = &record[0];
                let open_str = &record[1];
                let high_str = &record[2];
                let low_str = &record[3];
                let close_str = &record[4];
                let volume_str = &record[5];

                // Parse timestamp
                let timestamp = if let Ok(ts) = timestamp_str.parse::<i64>() {
                    Utc.timestamp_opt(ts, 0).unwrap()
                } else {
                    // Try parsing as RFC3339
                    DateTime::parse_from_rfc3339(timestamp_str)
                        .map(|dt| dt.with_timezone(&Utc))
                        .unwrap_or_else(|_| Utc::now())
                };

                // Parse values
                let open = open_str.parse::<f64>().unwrap_or(0.0);
                let high = high_str.parse::<f64>().unwrap_or(0.0);
                let low = low_str.parse::<f64>().unwrap_or(0.0);
                let close = close_str.parse::<f64>().unwrap_or(0.0);
                let volume = volume_str.parse::<f64>().unwrap_or(0.0);

                // Create market data
                let data = MarketData {
                    symbol: symbol.to_string(),
                    timestamp,
                    open,
                    high,
                    low,
                    close,
                    volume,
                    timeframe,
                };

                // Add to candles
                candles.push_back(data);

                // Limit number of candles
                if candles.len() >= MAX_CANDLES {
                    break;
                }
            }
        }

        Ok(candles)
    }

    /// Load replay data
    fn load_replay_data(&mut self, symbols: &[String], timeframes: &[u64]) -> Result<()> {
        debug!("Loading replay data for {} symbols", symbols.len());

        // For now, just use synthetic data
        self.initialize_synthetic(symbols, timeframes)
    }

    /// Get next candle
    pub fn get_next_candle(&mut self, symbol: &str, timeframe: u64) -> Result<Option<MarketData>> {
        // Get symbol data
        if let (Some(symbol_data), Some(symbol_position)) = (self.data.get(symbol), self.position.get_mut(symbol)) {
            // Get timeframe data
            if let (Some(timeframe_data), Some(position)) = (symbol_data.get(&timeframe), symbol_position.get_mut(&timeframe)) {
                // Check if we have more data
                if *position < timeframe_data.len() {
                    // Get candle
                    let candle = timeframe_data[*position].clone();

                    // Increment position
                    *position += 1;

                    // Update current timestamp
                    self.current_timestamp = candle.timestamp;

                    return Ok(Some(candle));
                }
            }
        }

        Ok(None)
    }

    /// Get current timestamp
    pub fn get_current_timestamp(&self) -> DateTime<Utc> {
        self.current_timestamp
    }

    /// Reset simulator
    pub fn reset(&mut self) -> Result<()> {
        // Reset positions
        for symbol_position in self.position.values_mut() {
            for position in symbol_position.values_mut() {
                *position = 0;
            }
        }

        // Reset timestamp
        self.current_timestamp = self.config.start_date.unwrap_or_else(Utc::now);

        Ok(())
    }

    /// Get available symbols
    pub fn get_available_symbols(&self) -> Vec<String> {
        self.data.keys().cloned().collect()
    }

    /// Get available timeframes
    pub fn get_available_timeframes(&self, symbol: &str) -> Vec<u64> {
        if let Some(symbol_data) = self.data.get(symbol) {
            symbol_data.keys().cloned().collect()
        } else {
            Vec::new()
        }
    }

    /// Get candle at specific position
    pub fn get_candle_at(&self, symbol: &str, timeframe: u64, position: usize) -> Option<MarketData> {
        if let Some(symbol_data) = self.data.get(symbol) {
            if let Some(timeframe_data) = symbol_data.get(&timeframe) {
                if position < timeframe_data.len() {
                    return Some(timeframe_data[position].clone());
                }
            }
        }

        None
    }

    /// Get candles in range
    pub fn get_candles_in_range(&self, symbol: &str, timeframe: u64, start: usize, end: usize) -> Vec<MarketData> {
        if let Some(symbol_data) = self.data.get(symbol) {
            if let Some(timeframe_data) = symbol_data.get(&timeframe) {
                let start = start.min(timeframe_data.len());
                let end = end.min(timeframe_data.len());

                return timeframe_data.range(start..end).cloned().collect();
            }
        }

        Vec::new()
    }

    /// Get configuration
    pub fn get_config(&self) -> &MarketSimulatorConfig {
        &self.config
    }

    /// Set configuration
    pub fn set_config(&mut self, config: MarketSimulatorConfig) {
        self.config = config;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_synthetic_data_generation() {
        let mut simulator = MarketSimulator::new();

        // Initialize simulator
        let symbols = vec!["BTCUSDT".to_string()];
        let timeframes = vec![1, 5, 15];

        simulator.initialize(&symbols, &timeframes).unwrap();

        // Get next candle
        let candle = simulator.get_next_candle("BTCUSDT", 1).unwrap();

        assert!(candle.is_some());

        let candle = candle.unwrap();
        assert_eq!(candle.symbol, "BTCUSDT");
        assert_eq!(candle.timeframe, 1);
        assert!(candle.open > 0.0);
        assert!(candle.high >= candle.open);
        assert!(candle.low <= candle.open);
        assert!(candle.volume > 0.0);
    }

    #[test]
    fn test_reset() {
        let mut simulator = MarketSimulator::new();

        // Initialize simulator
        let symbols = vec!["BTCUSDT".to_string()];
        let timeframes = vec![1];

        simulator.initialize(&symbols, &timeframes).unwrap();

        // Get a few candles
        for _ in 0..5 {
            simulator.get_next_candle("BTCUSDT", 1).unwrap();
        }

        // Reset simulator
        simulator.reset().unwrap();

        // Get first candle again
        let candle1 = simulator.get_next_candle("BTCUSDT", 1).unwrap().unwrap();

        // Get candle at position 0
        let candle2 = simulator.get_candle_at("BTCUSDT", 1, 0).unwrap();

        assert_eq!(candle1.timestamp, candle2.timestamp);
        assert_eq!(candle1.open, candle2.open);
        assert_eq!(candle1.close, candle2.close);
    }
}
