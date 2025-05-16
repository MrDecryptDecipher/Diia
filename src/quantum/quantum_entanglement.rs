//! Quantum Entanglement
//!
//! This module provides quantum entanglement for correlated assets.

use std::collections::{HashMap, VecDeque};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use anyhow::Result;

use crate::trading_system::MarketData;

/// Entangled pair
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EntangledPair {
    /// Pair ID
    pub id: String,

    /// Symbol 1
    pub symbol1: String,

    /// Symbol 2
    pub symbol2: String,

    /// Correlation
    pub correlation: f64,

    /// Entanglement strength
    pub strength: f64,

    /// Creation time
    pub creation_time: DateTime<Utc>,

    /// Last update time
    pub last_update_time: DateTime<Utc>,

    /// Price ratio
    pub price_ratio: f64,

    /// Volatility ratio
    pub volatility_ratio: f64,

    /// Historical ratio
    pub historical_ratio: f64,

    /// Arbitrage threshold
    pub arbitrage_threshold: f64,
}

/// Entanglement result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EntanglementResult {
    /// Result ID
    pub id: String,

    /// Entangled pair ID
    pub pair_id: String,

    /// Symbol 1
    pub symbol1: String,

    /// Symbol 2
    pub symbol2: String,

    /// Price 1
    pub price1: f64,

    /// Price 2
    pub price2: f64,

    /// Expected price 1
    pub expected_price1: f64,

    /// Expected price 2
    pub expected_price2: f64,

    /// Deviation
    pub deviation: f64,

    /// Arbitrage opportunity
    pub arbitrage_opportunity: bool,

    /// Arbitrage size
    pub arbitrage_size: f64,

    /// Timestamp
    pub timestamp: DateTime<Utc>,
}

/// Quantum entanglement
pub struct QuantumEntanglement {
    /// Entangled pairs
    pairs: HashMap<String, EntangledPair>,

    /// Entanglement results
    results: VecDeque<EntanglementResult>,

    /// Market data cache
    market_data_cache: HashMap<String, VecDeque<MarketData>>,

    /// Correlation matrix
    correlation_matrix: HashMap<String, HashMap<String, f64>>,

    /// Maximum results
    max_results: usize,
}

impl QuantumEntanglement {
    /// Create a new quantum entanglement
    pub fn new() -> Self {
        Self {
            pairs: HashMap::new(),
            results: VecDeque::new(),
            market_data_cache: HashMap::new(),
            correlation_matrix: HashMap::new(),
            max_results: 1000,
        }
    }

    /// Initialize the entanglement
    pub fn initialize(&mut self) -> Result<()> {
        // Initialize correlation matrix with some common correlations
        let mut btc_correlations = HashMap::new();
        btc_correlations.insert("ETHUSDT".to_string(), 0.85);
        btc_correlations.insert("SOLUSDT".to_string(), 0.75);
        btc_correlations.insert("BNBUSDT".to_string(), 0.8);
        btc_correlations.insert("ADAUSDT".to_string(), 0.7);
        self.correlation_matrix.insert("BTCUSDT".to_string(), btc_correlations);

        let mut eth_correlations = HashMap::new();
        eth_correlations.insert("BTCUSDT".to_string(), 0.85);
        eth_correlations.insert("SOLUSDT".to_string(), 0.8);
        eth_correlations.insert("BNBUSDT".to_string(), 0.75);
        eth_correlations.insert("ADAUSDT".to_string(), 0.7);
        self.correlation_matrix.insert("ETHUSDT".to_string(), eth_correlations);

        Ok(())
    }

    /// Add market data
    pub fn add_market_data(&mut self, data: MarketData) {
        let cache = self.market_data_cache
            .entry(data.symbol.clone())
            .or_insert_with(VecDeque::new);

        cache.push_back(data);

        // Limit cache size
        if cache.len() > 1000 {
            cache.pop_front();
        }

        // Update entangled pairs
        self.update_entangled_pairs();
    }

    /// Create entangled pair
    pub fn create_entangled_pair(&mut self, symbol1: &str, symbol2: &str) -> Result<EntangledPair> {
        // Check if symbols exist
        if !self.market_data_cache.contains_key(symbol1) || !self.market_data_cache.contains_key(symbol2) {
            return Err(anyhow::anyhow!("Market data not available for one or both symbols"));
        }

        // Get correlation
        let correlation = self.get_correlation(symbol1, symbol2);

        // Calculate price ratio
        let price1 = self.get_current_price(symbol1).unwrap_or(0.0);
        let price2 = self.get_current_price(symbol2).unwrap_or(0.0);

        let price_ratio = if price2 > 0.0 {
            price1 / price2
        } else {
            0.0
        };

        // Calculate volatility ratio
        let volatility1 = self.calculate_volatility(symbol1);
        let volatility2 = self.calculate_volatility(symbol2);

        let volatility_ratio = if volatility2 > 0.0 {
            volatility1 / volatility2
        } else {
            0.0
        };

        // Create pair ID
        let pair_id = format!("pair-{}-{}", symbol1, symbol2);

        // Create entangled pair
        let pair = EntangledPair {
            id: pair_id.clone(),
            symbol1: symbol1.to_string(),
            symbol2: symbol2.to_string(),
            correlation,
            strength: correlation.abs(),
            creation_time: Utc::now(),
            last_update_time: Utc::now(),
            price_ratio,
            volatility_ratio,
            historical_ratio: price_ratio,
            arbitrage_threshold: 0.02,
        };

        // Store pair
        self.pairs.insert(pair_id, pair.clone());

        Ok(pair)
    }

    /// Update entangled pairs
    fn update_entangled_pairs(&mut self) {
        // First collect all the symbols we need to process
        let mut pairs_data = Vec::new();

        for pair in self.pairs.values() {
            pairs_data.push((pair.symbol1.clone(), pair.symbol2.clone()));
        }

        // Process each pair
        for (symbol1, symbol2) in pairs_data {
            // Get current prices
            let price1 = self.get_current_price(&symbol1);
            let price2 = self.get_current_price(&symbol2);

            if let (Some(price1), Some(price2)) = (price1, price2) {
                // Calculate volatility
                let volatility1 = self.calculate_volatility(&symbol1);
                let volatility2 = self.calculate_volatility(&symbol2);

                // Calculate correlation
                let correlation = self.get_correlation(&symbol1, &symbol2);

                // Now update the pair
                // Create a key for the pair
                let pair_key = format!("{}-{}", symbol1, symbol2);
                if let Some(pair) = self.pairs.get_mut(&pair_key) {
                    // Update price ratio
                    if price2 > 0.0 {
                        pair.price_ratio = price1 / price2;
                    }

                    // Update volatility ratio
                    if volatility2 > 0.0 {
                        pair.volatility_ratio = volatility1 / volatility2;
                    }

                    // Update correlation
                    pair.correlation = correlation;
                    pair.strength = correlation.abs();

                    // Update timestamp
                    pair.last_update_time = Utc::now();

                    // Check for arbitrage
                    let symbol1_clone = pair.symbol1.clone();
                    let symbol2_clone = pair.symbol2.clone();
                    let price_ratio = pair.price_ratio;
                    let historical_ratio = pair.historical_ratio;
                    let threshold = pair.arbitrage_threshold;

                    self.check_arbitrage_for_pair(&symbol1_clone, &symbol2_clone, price_ratio, historical_ratio, threshold);
                }
            }
        }
    }

    /// Check for arbitrage
    fn check_arbitrage(&mut self, pair: &EntangledPair) {
        self.check_arbitrage_for_pair(&pair.symbol1, &pair.symbol2, pair.price_ratio, pair.historical_ratio, pair.arbitrage_threshold);
    }

    /// Check for arbitrage with specific parameters
    fn check_arbitrage_for_pair(&mut self, symbol1: &str, symbol2: &str, price_ratio: f64, historical_ratio: f64, threshold: f64) {
        // Get current prices
        if let (Some(price1), Some(price2)) = (
            self.get_current_price(symbol1),
            self.get_current_price(symbol2),
        ) {
            // Calculate expected prices
            let expected_price1 = price2 * price_ratio;
            let expected_price2 = price1 / price_ratio;

            // Calculate deviation
            let deviation1 = (price1 - expected_price1).abs() / expected_price1;
            let deviation2 = (price2 - expected_price2).abs() / expected_price2;

            let deviation = (deviation1 + deviation2) / 2.0;

            // Check for arbitrage opportunity
            let arbitrage_threshold = 0.01; // 1%
            let arbitrage_opportunity = deviation > arbitrage_threshold;

            // Calculate arbitrage size
            let arbitrage_size = if arbitrage_opportunity {
                (price1 - expected_price1).abs()
            } else {
                0.0
            };

            // Create a unique ID for this pair
            let pair_id = format!("{}-{}", symbol1, symbol2);

            // Create entanglement result
            let result = EntanglementResult {
                id: format!("result-{}-{}", pair_id, Utc::now().timestamp_millis()),
                pair_id: pair_id,
                symbol1: symbol1.to_string(),
                symbol2: symbol2.to_string(),
                price1,
                price2,
                expected_price1,
                expected_price2,
                deviation,
                arbitrage_opportunity,
                arbitrage_size,
                timestamp: Utc::now(),
            };

            // Store result
            self.results.push_back(result);

            // Limit results
            if self.results.len() > self.max_results {
                self.results.pop_front();
            }
        }
    }

    /// Get correlation
    fn get_correlation(&self, symbol1: &str, symbol2: &str) -> f64 {
        if symbol1 == symbol2 {
            return 1.0;
        }

        if let Some(correlations) = self.correlation_matrix.get(symbol1) {
            if let Some(correlation) = correlations.get(symbol2) {
                return *correlation;
            }
        }

        if let Some(correlations) = self.correlation_matrix.get(symbol2) {
            if let Some(correlation) = correlations.get(symbol1) {
                return *correlation;
            }
        }

        // Calculate correlation
        self.calculate_correlation(symbol1, symbol2)
    }

    /// Calculate correlation
    fn calculate_correlation(&self, symbol1: &str, symbol2: &str) -> f64 {
        // Get market data
        let data1 = self.market_data_cache.get(symbol1);
        let data2 = self.market_data_cache.get(symbol2);

        if data1.is_none() || data2.is_none() {
            return 0.0;
        }

        let data1 = data1.unwrap();
        let data2 = data2.unwrap();

        if data1.is_empty() || data2.is_empty() {
            return 0.0;
        }

        // Get prices
        let prices1: Vec<f64> = data1.iter().map(|d| d.close).collect();
        let prices2: Vec<f64> = data2.iter().map(|d| d.close).collect();

        // Calculate returns
        let mut returns1 = Vec::with_capacity(prices1.len() - 1);
        let mut returns2 = Vec::with_capacity(prices2.len() - 1);

        for i in 1..prices1.len().min(prices2.len()) {
            let ret1 = (prices1[i] - prices1[i - 1]) / prices1[i - 1];
            let ret2 = (prices2[i] - prices2[i - 1]) / prices2[i - 1];

            returns1.push(ret1);
            returns2.push(ret2);
        }

        // Calculate correlation
        let n = returns1.len();

        if n == 0 {
            return 0.0;
        }

        let mean1 = returns1.iter().sum::<f64>() / n as f64;
        let mean2 = returns2.iter().sum::<f64>() / n as f64;

        let mut numerator = 0.0;
        let mut denom1 = 0.0;
        let mut denom2 = 0.0;

        for i in 0..n {
            let diff1 = returns1[i] - mean1;
            let diff2 = returns2[i] - mean2;

            numerator += diff1 * diff2;
            denom1 += diff1 * diff1;
            denom2 += diff2 * diff2;
        }

        if denom1 > 0.0 && denom2 > 0.0 {
            numerator / (denom1 * denom2).sqrt()
        } else {
            0.0
        }
    }

    /// Calculate volatility
    fn calculate_volatility(&self, symbol: &str) -> f64 {
        // Get market data
        if let Some(data) = self.market_data_cache.get(symbol) {
            if data.len() < 2 {
                return 0.01; // Default volatility
            }

            // Calculate returns
            let mut returns = Vec::with_capacity(data.len() - 1);

            for i in 1..data.len() {
                let prev_price = data[i - 1].close;
                let curr_price = data[i].close;

                let ret = (curr_price - prev_price) / prev_price;
                returns.push(ret);
            }

            // Calculate standard deviation
            let mean = returns.iter().sum::<f64>() / returns.len() as f64;
            let variance = returns.iter().map(|r| (r - mean).powi(2)).sum::<f64>() / returns.len() as f64;
            let std_dev = variance.sqrt();

            // Annualize volatility
            let annualized_volatility = std_dev * (24.0_f64 * 365.0_f64).sqrt();

            annualized_volatility
        } else {
            0.01 // Default volatility
        }
    }

    /// Get current price
    fn get_current_price(&self, symbol: &str) -> Option<f64> {
        if let Some(data) = self.market_data_cache.get(symbol) {
            if let Some(latest) = data.back() {
                return Some(latest.close);
            }
        }

        None
    }

    /// Get entangled pairs
    pub fn get_entangled_pairs(&self) -> Vec<&EntangledPair> {
        self.pairs.values().collect()
    }

    /// Get entanglement results
    pub fn get_entanglement_results(&self) -> &VecDeque<EntanglementResult> {
        &self.results
    }

    /// Get arbitrage opportunities
    pub fn get_arbitrage_opportunities(&self) -> Vec<&EntanglementResult> {
        self.results.iter()
            .filter(|r| r.arbitrage_opportunity)
            .collect()
    }

    /// Get correlation matrix
    pub fn get_correlation_matrix(&self) -> &HashMap<String, HashMap<String, f64>> {
        &self.correlation_matrix
    }

    /// Update correlation
    pub fn update_correlation(&mut self, symbol1: &str, symbol2: &str, correlation: f64) {
        self.correlation_matrix.entry(symbol1.to_string())
            .or_insert_with(HashMap::new)
            .insert(symbol2.to_string(), correlation);

        self.correlation_matrix.entry(symbol2.to_string())
            .or_insert_with(HashMap::new)
            .insert(symbol1.to_string(), correlation);
    }
}
