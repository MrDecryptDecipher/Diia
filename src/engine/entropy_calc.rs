//! Entropy Calculator
//!
//! This module provides tools for calculating entropy and volatility
//! in market data, which is used for risk assessment and decision making.

use serde::{Deserialize, Serialize};
use anyhow::Result;

/// Entropy level
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum EntropyLevel {
    /// Very low entropy (highly predictable)
    VeryLow,
    
    /// Low entropy
    Low,
    
    /// Medium entropy
    Medium,
    
    /// High entropy
    High,
    
    /// Very high entropy (highly unpredictable)
    VeryHigh,
}

impl EntropyLevel {
    /// Convert from numeric entropy
    pub fn from_numeric(entropy: f64) -> Self {
        if entropy < 0.2 {
            Self::VeryLow
        } else if entropy < 0.4 {
            Self::Low
        } else if entropy < 0.6 {
            Self::Medium
        } else if entropy < 0.8 {
            Self::High
        } else {
            Self::VeryHigh
        }
    }
    
    /// Convert to numeric entropy
    pub fn to_numeric(&self) -> f64 {
        match self {
            Self::VeryLow => 0.1,
            Self::Low => 0.3,
            Self::Medium => 0.5,
            Self::High => 0.7,
            Self::VeryHigh => 0.9,
        }
    }
}

/// Volatility profile
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VolatilityProfile {
    /// Symbol
    pub symbol: String,
    
    /// Short-term volatility (1-minute)
    pub volatility_1m: f64,
    
    /// Medium-term volatility (5-minute)
    pub volatility_5m: f64,
    
    /// Long-term volatility (15-minute)
    pub volatility_15m: f64,
    
    /// Very long-term volatility (1-hour)
    pub volatility_1h: f64,
    
    /// Entropy level
    pub entropy_level: EntropyLevel,
    
    /// Normalized entropy (0-1)
    pub normalized_entropy: f64,
    
    /// Volatility trend (increasing/decreasing)
    pub volatility_trend: f64,
    
    /// Is volatility spiking?
    pub is_volatility_spiking: bool,
    
    /// Is volatility contracting?
    pub is_volatility_contracting: bool,
}

/// Entropy calculator
pub struct EntropyCalculator {
    /// Lookback window for calculations
    lookback_window: usize,
    
    /// Volatility profiles by symbol
    volatility_profiles: std::collections::HashMap<String, VolatilityProfile>,
}

impl EntropyCalculator {
    /// Create a new entropy calculator
    pub fn new(lookback_window: usize) -> Self {
        Self {
            lookback_window,
            volatility_profiles: std::collections::HashMap::new(),
        }
    }
    
    /// Calculate entropy from price data
    pub fn calculate_entropy(&self, prices: &[f64]) -> f64 {
        if prices.len() < 2 {
            return 0.0;
        }
        
        // Calculate returns
        let mut returns = Vec::with_capacity(prices.len() - 1);
        for i in 1..prices.len() {
            returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
        }
        
        // Calculate entropy using Shannon entropy formula
        self.shannon_entropy(&returns)
    }
    
    /// Calculate Shannon entropy
    fn shannon_entropy(&self, data: &[f64]) -> f64 {
        if data.is_empty() {
            return 0.0;
        }
        
        // Bin the data
        let num_bins = (data.len() as f64).sqrt().ceil() as usize;
        let mut bins = vec![0; num_bins];
        
        // Find min and max
        let min_val = data.iter().fold(f64::INFINITY, |a, &b| a.min(b));
        let max_val = data.iter().fold(f64::NEG_INFINITY, |a, &b| a.max(b));
        
        let range = max_val - min_val;
        if range <= 0.0 {
            return 0.0;
        }
        
        // Bin the data
        for &val in data {
            let bin_idx = ((val - min_val) / range * (num_bins as f64 - 1.0)).floor() as usize;
            bins[bin_idx.min(num_bins - 1)] += 1;
        }
        
        // Calculate probabilities
        let total = data.len() as f64;
        let mut entropy = 0.0;
        
        for &count in &bins {
            if count > 0 {
                let p = count as f64 / total;
                entropy -= p * p.log2();
            }
        }
        
        // Normalize to 0-1 range
        entropy / num_bins as f64
    }
    
    /// Calculate volatility
    pub fn calculate_volatility(&self, prices: &[f64]) -> f64 {
        if prices.len() < 2 {
            return 0.0;
        }
        
        // Calculate returns
        let mut returns = Vec::with_capacity(prices.len() - 1);
        for i in 1..prices.len() {
            returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
        }
        
        // Calculate standard deviation of returns
        let mean = returns.iter().sum::<f64>() / returns.len() as f64;
        let variance = returns.iter().map(|x| (x - mean).powi(2)).sum::<f64>() / returns.len() as f64;
        
        variance.sqrt()
    }
    
    /// Update volatility profile
    pub fn update_volatility_profile(&mut self, symbol: &str, prices_1m: &[f64], prices_5m: &[f64], prices_15m: &[f64], prices_1h: &[f64]) -> Result<VolatilityProfile> {
        // Calculate volatilities
        let vol_1m = self.calculate_volatility(prices_1m);
        let vol_5m = self.calculate_volatility(prices_5m);
        let vol_15m = self.calculate_volatility(prices_15m);
        let vol_1h = self.calculate_volatility(prices_1h);
        
        // Calculate entropy
        let entropy = self.calculate_entropy(prices_1m);
        let entropy_level = EntropyLevel::from_numeric(entropy);
        
        // Calculate volatility trend
        let volatility_trend = if let Some(profile) = self.volatility_profiles.get(symbol) {
            (vol_1m - profile.volatility_1m) / profile.volatility_1m
        } else {
            0.0
        };
        
        // Determine if volatility is spiking or contracting
        let is_volatility_spiking = volatility_trend > 0.2;
        let is_volatility_contracting = volatility_trend < -0.2;
        
        // Create profile
        let profile = VolatilityProfile {
            symbol: symbol.to_string(),
            volatility_1m: vol_1m,
            volatility_5m: vol_5m,
            volatility_15m: vol_15m,
            volatility_1h: vol_1h,
            entropy_level,
            normalized_entropy: entropy,
            volatility_trend,
            is_volatility_spiking,
            is_volatility_contracting,
        };
        
        // Update profiles
        self.volatility_profiles.insert(symbol.to_string(), profile.clone());
        
        Ok(profile)
    }
    
    /// Get volatility profile
    pub fn get_volatility_profile(&self, symbol: &str) -> Option<&VolatilityProfile> {
        self.volatility_profiles.get(symbol)
    }
    
    /// Get all volatility profiles
    pub fn get_all_volatility_profiles(&self) -> &std::collections::HashMap<String, VolatilityProfile> {
        &self.volatility_profiles
    }
    
    /// Set lookback window
    pub fn set_lookback_window(&mut self, window: usize) {
        self.lookback_window = window;
    }
}
