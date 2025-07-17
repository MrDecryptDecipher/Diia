//! Configuration Management System
//!
//! This module provides comprehensive configuration management for different
//! deployment environments with validation and hot-reloading capabilities.

use std::fs;
use std::path::Path;
use serde::{Serialize, Deserialize};
use anyhow::{Result, anyhow};
use tracing::{info, warn, error};

use super::production_manager::{
    ProductionConfig, ApiConfig, TradingConfig, MonitoringConfig, 
    SafetyConfig, LoggingConfig
};
use crate::monitoring::PerformanceThresholds;

/// Configuration manager
pub struct ConfigManager {
    /// Current configuration
    config: ProductionConfig,
    
    /// Configuration file path
    config_path: String,
    
    /// Environment
    environment: String,
}

impl ConfigManager {
    /// Create new configuration manager
    pub fn new(environment: &str) -> Result<Self> {
        let config_path = format!("config/{}.toml", environment);
        let config = Self::load_config(&config_path)?;
        
        Ok(Self {
            config,
            config_path,
            environment: environment.to_string(),
        })
    }
    
    /// Load configuration from file
    pub fn load_config(path: &str) -> Result<ProductionConfig> {
        if !Path::new(path).exists() {
            warn!("Configuration file {} not found, creating default", path);
            let default_config = Self::create_default_config();
            Self::save_config(&default_config, path)?;
            return Ok(default_config);
        }
        
        let content = fs::read_to_string(path)?;
        let config: ProductionConfig = toml::from_str(&content)?;
        
        // Validate configuration
        Self::validate_config(&config)?;
        
        info!("Configuration loaded from {}", path);
        Ok(config)
    }
    
    /// Save configuration to file
    pub fn save_config(config: &ProductionConfig, path: &str) -> Result<()> {
        // Create directory if it doesn't exist
        if let Some(parent) = Path::new(path).parent() {
            fs::create_dir_all(parent)?;
        }
        
        let content = toml::to_string_pretty(config)?;
        fs::write(path, content)?;
        
        info!("Configuration saved to {}", path);
        Ok(())
    }
    
    /// Create default configuration
    pub fn create_default_config() -> ProductionConfig {
        ProductionConfig {
            environment: "development".to_string(),
            api_config: ApiConfig {
                bybit_api_key: "your_api_key_here".to_string(),
                bybit_api_secret: "your_api_secret_here".to_string(),
                use_demo: true,
                rate_limit_requests_per_minute: 120,
                connection_timeout: 30,
                request_timeout: 10,
            },
            trading_config: TradingConfig {
                total_capital: 12.0,
                max_risk_per_trade: 1.2, // 10% of 12 USDT = 1.2 USDT per trade
                max_portfolio_risk: 5.0,
                min_confidence: 75.0, // Lower threshold for more opportunities
                max_positions: 10, // More concurrent positions
                trading_enabled: true, // ENABLED for active trading
            },
            monitoring_config: MonitoringConfig {
                enabled: true,
                collection_interval: 60,
                health_check_interval: 300,
                alert_thresholds: PerformanceThresholds::default(),
            },
            safety_config: SafetyConfig {
                emergency_stop_enabled: true,
                max_daily_loss: 2.0, // 2 USDT max daily loss
                max_consecutive_losses: 3,
                circuit_breaker_enabled: true,
                auto_recovery_enabled: false,
            },
            logging_config: LoggingConfig {
                level: "info".to_string(),
                log_to_file: true,
                log_file_path: "logs/omni.log".to_string(),
                rotation_enabled: true,
                max_file_size_mb: 100,
            },
        }
    }
    
    /// Create production configuration
    pub fn create_production_config() -> ProductionConfig {
        let mut config = Self::create_default_config();
        
        config.environment = "production".to_string();
        config.api_config.use_demo = false; // Use live API in production
        config.trading_config.trading_enabled = true;
        config.safety_config.auto_recovery_enabled = true;
        config.logging_config.level = "warn".to_string(); // Less verbose in production
        
        config
    }
    
    /// Create staging configuration
    pub fn create_staging_config() -> ProductionConfig {
        let mut config = Self::create_default_config();
        
        config.environment = "staging".to_string();
        config.api_config.use_demo = true; // Use demo API in staging
        config.trading_config.trading_enabled = true;
        config.logging_config.level = "debug".to_string();
        
        config
    }
    
    /// Validate configuration
    pub fn validate_config(config: &ProductionConfig) -> Result<()> {
        // Validate API configuration
        if config.api_config.bybit_api_key.is_empty() || 
           config.api_config.bybit_api_key == "your_api_key_here" {
            return Err(anyhow!("Invalid API key configuration"));
        }
        
        if config.api_config.bybit_api_secret.is_empty() || 
           config.api_config.bybit_api_secret == "your_api_secret_here" {
            return Err(anyhow!("Invalid API secret configuration"));
        }
        
        // Validate trading configuration
        if config.trading_config.total_capital <= 0.0 {
            return Err(anyhow!("Total capital must be positive"));
        }
        
        if config.trading_config.total_capital != 12.0 {
            warn!("Total capital is not 12.0 USDT - this may not comply with system constraints");
        }
        
        if config.trading_config.max_risk_per_trade <= 0.0 || 
           config.trading_config.max_risk_per_trade > 100.0 {
            return Err(anyhow!("Max risk per trade must be between 0 and 100"));
        }
        
        if config.trading_config.max_portfolio_risk <= 0.0 || 
           config.trading_config.max_portfolio_risk > 100.0 {
            return Err(anyhow!("Max portfolio risk must be between 0 and 100"));
        }
        
        if config.trading_config.min_confidence < 0.0 || 
           config.trading_config.min_confidence > 100.0 {
            return Err(anyhow!("Min confidence must be between 0 and 100"));
        }
        
        if config.trading_config.max_positions == 0 {
            return Err(anyhow!("Max positions must be greater than 0"));
        }
        
        // Validate safety configuration
        if config.safety_config.max_daily_loss <= 0.0 {
            return Err(anyhow!("Max daily loss must be positive"));
        }
        
        if config.safety_config.max_daily_loss > config.trading_config.total_capital {
            return Err(anyhow!("Max daily loss cannot exceed total capital"));
        }
        
        // Validate monitoring configuration
        if config.monitoring_config.collection_interval == 0 {
            return Err(anyhow!("Collection interval must be greater than 0"));
        }
        
        if config.monitoring_config.health_check_interval == 0 {
            return Err(anyhow!("Health check interval must be greater than 0"));
        }
        
        // Validate logging configuration
        let valid_levels = ["trace", "debug", "info", "warn", "error"];
        if !valid_levels.contains(&config.logging_config.level.as_str()) {
            return Err(anyhow!("Invalid log level: {}", config.logging_config.level));
        }
        
        info!("Configuration validation passed");
        Ok(())
    }
    
    /// Get current configuration
    pub fn get_config(&self) -> &ProductionConfig {
        &self.config
    }
    
    /// Update configuration
    pub fn update_config(&mut self, new_config: ProductionConfig) -> Result<()> {
        // Validate new configuration
        Self::validate_config(&new_config)?;
        
        // Save to file
        Self::save_config(&new_config, &self.config_path)?;
        
        // Update current configuration
        self.config = new_config;
        
        info!("Configuration updated successfully");
        Ok(())
    }
    
    /// Reload configuration from file
    pub fn reload_config(&mut self) -> Result<()> {
        let new_config = Self::load_config(&self.config_path)?;
        self.config = new_config;
        
        info!("Configuration reloaded from file");
        Ok(())
    }
    
    /// Get environment-specific configuration path
    pub fn get_config_path(environment: &str) -> String {
        format!("config/{}.toml", environment)
    }
    
    /// Create all environment configurations
    pub fn create_all_environment_configs() -> Result<()> {
        // Create config directory
        fs::create_dir_all("config")?;
        
        // Create development config
        let dev_config = Self::create_default_config();
        Self::save_config(&dev_config, &Self::get_config_path("development"))?;
        
        // Create staging config
        let staging_config = Self::create_staging_config();
        Self::save_config(&staging_config, &Self::get_config_path("staging"))?;
        
        // Create production config
        let prod_config = Self::create_production_config();
        Self::save_config(&prod_config, &Self::get_config_path("production"))?;
        
        info!("All environment configurations created");
        Ok(())
    }
    
    /// Get configuration summary
    pub fn get_config_summary(&self) -> ConfigSummary {
        ConfigSummary {
            environment: self.config.environment.clone(),
            trading_enabled: self.config.trading_config.trading_enabled,
            use_demo: self.config.api_config.use_demo,
            total_capital: self.config.trading_config.total_capital,
            max_risk_per_trade: self.config.trading_config.max_risk_per_trade,
            monitoring_enabled: self.config.monitoring_config.enabled,
            emergency_stop_enabled: self.config.safety_config.emergency_stop_enabled,
            log_level: self.config.logging_config.level.clone(),
        }
    }
}

/// Configuration summary for display
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConfigSummary {
    /// Environment
    pub environment: String,
    
    /// Trading enabled
    pub trading_enabled: bool,
    
    /// Use demo API
    pub use_demo: bool,
    
    /// Total capital
    pub total_capital: f64,
    
    /// Max risk per trade
    pub max_risk_per_trade: f64,
    
    /// Monitoring enabled
    pub monitoring_enabled: bool,
    
    /// Emergency stop enabled
    pub emergency_stop_enabled: bool,
    
    /// Log level
    pub log_level: String,
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;
    
    #[test]
    fn test_create_default_config() {
        let config = ConfigManager::create_default_config();
        assert_eq!(config.environment, "development");
        assert_eq!(config.trading_config.total_capital, 12.0);
        assert!(config.api_config.use_demo);
        assert!(!config.trading_config.trading_enabled);
    }
    
    #[test]
    fn test_validate_config() {
        let config = ConfigManager::create_default_config();
        
        // This should fail because of placeholder API keys
        assert!(ConfigManager::validate_config(&config).is_err());
        
        // Create valid config
        let mut valid_config = config;
        valid_config.api_config.bybit_api_key = "valid_key".to_string();
        valid_config.api_config.bybit_api_secret = "valid_secret".to_string();
        
        assert!(ConfigManager::validate_config(&valid_config).is_ok());
    }
    
    #[test]
    fn test_config_serialization() {
        let config = ConfigManager::create_default_config();
        let serialized = toml::to_string(&config).unwrap();
        let deserialized: ProductionConfig = toml::from_str(&serialized).unwrap();
        
        assert_eq!(config.environment, deserialized.environment);
        assert_eq!(config.trading_config.total_capital, deserialized.trading_config.total_capital);
    }
}
