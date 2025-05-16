use std::collections::HashMap;
use chrono::{DateTime, Duration, Utc};
use rand::prelude::*;
use rand_distr::{Normal, LogNormal};
use tracing::{debug, info};

use crate::strategy::simple_strategy::Candle;

/// Market volatility level
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum VolatilityLevel {
    /// Low volatility
    Low,
    /// Medium volatility
    Medium,
    /// High volatility
    High,
    /// Extreme volatility
    Extreme,
}

impl VolatilityLevel {
    /// Get volatility parameters
    pub fn get_params(&self) -> (f64, f64) {
        match self {
            VolatilityLevel::Low => (0.0001, 0.001),     // (drift, volatility)
            VolatilityLevel::Medium => (0.0002, 0.002),
            VolatilityLevel::High => (0.0003, 0.004),
            VolatilityLevel::Extreme => (0.0005, 0.008),
        }
    }
}

/// Market trend
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MarketTrend {
    /// Strongly bearish
    StronglyBearish,
    /// Bearish
    Bearish,
    /// Neutral
    Neutral,
    /// Bullish
    Bullish,
    /// Strongly bullish
    StronglyBullish,
}

impl MarketTrend {
    /// Get trend drift
    pub fn get_drift(&self) -> f64 {
        match self {
            MarketTrend::StronglyBearish => -0.0008,
            MarketTrend::Bearish => -0.0004,
            MarketTrend::Neutral => 0.0,
            MarketTrend::Bullish => 0.0004,
            MarketTrend::StronglyBullish => 0.0008,
        }
    }
}

/// Asset configuration
#[derive(Debug, Clone)]
pub struct AssetConfig {
    /// Symbol
    pub symbol: String,
    /// Initial price
    pub initial_price: f64,
    /// Volatility level
    pub volatility: VolatilityLevel,
    /// Market trend
    pub trend: MarketTrend,
    /// Minimum price
    pub min_price: f64,
    /// Maximum price
    pub max_price: f64,
}

impl Default for AssetConfig {
    fn default() -> Self {
        Self {
            symbol: "BTC".to_string(),
            initial_price: 50000.0,
            volatility: VolatilityLevel::Medium,
            trend: MarketTrend::Neutral,
            min_price: 10000.0,
            max_price: 100000.0,
        }
    }
}

/// Asset state
#[derive(Debug, Clone)]
struct AssetState {
    /// Current price
    price: f64,
    /// Current timestamp
    timestamp: DateTime<Utc>,
    /// Price history (timestamp, price)
    price_history: Vec<(DateTime<Utc>, f64)>,
    /// Candle history
    candle_history: Vec<Candle>,
    /// Random number generator
    rng: ThreadRng,
    /// Configuration
    config: AssetConfig,
}

impl AssetState {
    /// Create a new asset state
    fn new(config: AssetConfig) -> Self {
        Self {
            price: config.initial_price,
            timestamp: Utc::now(),
            price_history: vec![(Utc::now(), config.initial_price)],
            candle_history: Vec::new(),
            rng: thread_rng(),
            config,
        }
    }

    /// Update price
    fn update_price(&mut self, time_step_seconds: u64) {
        // Get volatility parameters
        let (base_drift, base_volatility) = self.config.volatility.get_params();

        // Add trend drift
        let drift = base_drift + self.config.trend.get_drift();

        // Calculate time step in years (for annualized volatility)
        let time_step_years = time_step_seconds as f64 / (365.0 * 24.0 * 60.0 * 60.0);

        // Generate random price movement using geometric Brownian motion
        let normal = Normal::new(
            drift * time_step_years,
            base_volatility * time_step_years.sqrt()
        ).unwrap();

        let random_return = normal.sample(&mut self.rng);
        let price_multiplier = (random_return).exp();

        // Update price
        self.price *= price_multiplier;

        // Ensure price stays within bounds
        self.price = self.price.max(self.config.min_price).min(self.config.max_price);

        // Update timestamp
        self.timestamp = self.timestamp + Duration::seconds(time_step_seconds as i64);

        // Add to price history
        self.price_history.push((self.timestamp, self.price));

        // Limit history size
        if self.price_history.len() > 10000 {
            self.price_history.remove(0);
        }
    }

    /// Generate candle
    fn generate_candle(&mut self, interval_seconds: u64) {
        // Get relevant price history for this interval
        let start_time = self.timestamp - Duration::seconds(interval_seconds as i64);
        let prices: Vec<f64> = self.price_history.iter()
            .filter(|(ts, _)| *ts >= start_time && *ts <= self.timestamp)
            .map(|(_, price)| *price)
            .collect();

        if prices.is_empty() {
            return;
        }

        // Calculate OHLCV
        let open = prices.first().unwrap_or(&self.price).clone();
        let close = prices.last().unwrap_or(&self.price).clone();
        let high = prices.iter().fold(open, |acc, &price| acc.max(price));
        let low = prices.iter().fold(open, |acc, &price| acc.min(price));

        // Generate random volume
        let base_volume = self.price * 10.0; // Base volume proportional to price
        let volume_multiplier = LogNormal::new(0.0, 0.5).unwrap().sample(&mut self.rng);
        let volume = base_volume * volume_multiplier;

        // Create candle
        let candle = Candle {
            symbol: self.config.symbol.clone(),
            timestamp: self.timestamp,
            open,
            high,
            low,
            close,
            volume,
            timeframe: 1, // 1-minute candles
        };

        // Add to candle history
        self.candle_history.push(candle);

        // Limit history size
        if self.candle_history.len() > 1000 {
            self.candle_history.remove(0);
        }
    }

    /// Get latest candles
    fn get_candles(&self, limit: usize) -> Vec<Candle> {
        if self.candle_history.len() <= limit {
            self.candle_history.clone()
        } else {
            self.candle_history[self.candle_history.len() - limit..].to_vec()
        }
    }
}

/// Enhanced market simulator
pub struct EnhancedMarketSimulator {
    /// Asset states
    assets: HashMap<String, AssetState>,
    /// Simulation speed multiplier
    speed: f64,
    /// Last update time
    last_update: DateTime<Utc>,
}

impl EnhancedMarketSimulator {
    /// Create a new market simulator
    pub fn new() -> Self {
        Self {
            assets: HashMap::new(),
            speed: 1.0,
            last_update: Utc::now(),
        }
    }

    /// Initialize the simulator with assets
    pub fn initialize(&mut self, assets: Vec<AssetConfig>) {
        info!("Initializing enhanced market simulator with {} assets", assets.len());

        for config in assets {
            let symbol = config.symbol.clone();
            let state = AssetState::new(config);
            let price = state.price;
            self.assets.insert(symbol.clone(), state);
            info!("Added asset {} to simulator at ${:.2}", symbol, price);
        }

        self.last_update = Utc::now();
    }

    /// Set simulation speed
    pub fn set_speed(&mut self, speed: f64) {
        self.speed = speed;
        info!("Set simulation speed to {:.1}x", speed);
    }

    /// Update the simulation
    pub fn update(&mut self) {
        let now = Utc::now();
        let elapsed = now.signed_duration_since(self.last_update);
        let elapsed_seconds = elapsed.num_milliseconds() as f64 / 1000.0;

        // Apply speed multiplier
        let simulated_seconds = (elapsed_seconds * self.speed) as u64;

        if simulated_seconds == 0 {
            return;
        }

        // Update each asset
        for (symbol, state) in self.assets.iter_mut() {
            state.update_price(simulated_seconds);

            // Generate 1-minute candles
            if simulated_seconds >= 60 {
                state.generate_candle(60);
            }

            debug!("Updated {} price to ${:.2}", symbol, state.price);
        }

        self.last_update = now;
    }

    /// Get current price for a symbol
    pub fn get_price(&self, symbol: &str) -> Option<f64> {
        self.assets.get(symbol).map(|state| state.price)
    }

    /// Get candles for a symbol
    pub fn get_candles(&self, symbol: &str, limit: usize) -> Option<Vec<Candle>> {
        self.assets.get(symbol).map(|state| state.get_candles(limit))
    }

    /// Get all asset symbols
    pub fn get_symbols(&self) -> Vec<String> {
        self.assets.keys().cloned().collect()
    }

    /// Add a new asset
    pub fn add_asset(&mut self, config: AssetConfig) {
        let symbol = config.symbol.clone();
        let state = AssetState::new(config);
        let price = state.price;
        self.assets.insert(symbol.clone(), state);
        info!("Added asset {} to simulator at ${:.2}", symbol, price);
    }

    /// Remove an asset
    pub fn remove_asset(&mut self, symbol: &str) {
        if self.assets.remove(symbol).is_some() {
            info!("Removed asset {} from simulator", symbol);
        }
    }

    /// Set volatility for an asset
    pub fn set_volatility(&mut self, symbol: &str, volatility: VolatilityLevel) {
        if let Some(state) = self.assets.get_mut(symbol) {
            state.config.volatility = volatility;
            info!("Set {} volatility to {:?}", symbol, volatility);
        }
    }

    /// Set trend for an asset
    pub fn set_trend(&mut self, symbol: &str, trend: MarketTrend) {
        if let Some(state) = self.assets.get_mut(symbol) {
            state.config.trend = trend;
            info!("Set {} trend to {:?}", symbol, trend);
        }
    }
}
