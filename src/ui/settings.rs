//! Settings
//!
//! This module provides the settings UI for the OMNI-ALPHA VΩ∞∞ platform.

use std::collections::HashMap;
use serde::{Deserialize, Serialize};

use crate::trading_system::{TradingSystemConfig, ExchangeConfig, TradingMode};

/// Settings category
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum SettingsCategory {
    /// General settings
    General,
    
    /// Trading settings
    Trading,
    
    /// Exchange settings
    Exchange,
    
    /// Agent settings
    Agent,
    
    /// UI settings
    UI,
    
    /// Advanced settings
    Advanced,
}

/// Settings
pub struct Settings {
    /// Trading system configuration
    trading_config: TradingSystemConfig,
    
    /// Agent settings
    agent_settings: HashMap<String, HashMap<String, f64>>,
    
    /// UI settings
    ui_settings: HashMap<String, String>,
    
    /// Advanced settings
    advanced_settings: HashMap<String, String>,
    
    /// Current category
    current_category: SettingsCategory,
    
    /// Modified flag
    modified: bool,
}

impl Settings {
    /// Create new settings
    pub fn new(trading_config: TradingSystemConfig) -> Self {
        Self {
            trading_config,
            agent_settings: HashMap::new(),
            ui_settings: HashMap::new(),
            advanced_settings: HashMap::new(),
            current_category: SettingsCategory::General,
            modified: false,
        }
    }
    
    /// Initialize settings
    pub fn initialize(&mut self) {
        // Initialize agent settings
        self.agent_settings.insert("zero_loss_enforcer".to_string(), HashMap::new());
        self.agent_settings.insert("memory_node".to_string(), HashMap::new());
        self.agent_settings.insert("feedback_loop".to_string(), HashMap::new());
        self.agent_settings.insert("compound_controller".to_string(), HashMap::new());
        self.agent_settings.insert("ghost_trader".to_string(), HashMap::new());
        self.agent_settings.insert("anti_loss_hedger".to_string(), HashMap::new());
        self.agent_settings.insert("god_kernel".to_string(), HashMap::new());
        
        // Initialize UI settings
        self.ui_settings.insert("theme".to_string(), "dark".to_string());
        self.ui_settings.insert("chart_style".to_string(), "candle".to_string());
        self.ui_settings.insert("refresh_rate".to_string(), "1000".to_string());
        self.ui_settings.insert("show_notifications".to_string(), "true".to_string());
        self.ui_settings.insert("show_tooltips".to_string(), "true".to_string());
        
        // Initialize advanced settings
        self.advanced_settings.insert("log_level".to_string(), "info".to_string());
        self.advanced_settings.insert("max_memory_usage".to_string(), "1024".to_string());
        self.advanced_settings.insert("max_cpu_usage".to_string(), "80".to_string());
        self.advanced_settings.insert("max_disk_usage".to_string(), "10000".to_string());
        self.advanced_settings.insert("backup_interval".to_string(), "3600".to_string());
        
        // Initialize agent-specific settings
        let zero_loss_enforcer = self.agent_settings.get_mut("zero_loss_enforcer").unwrap();
        zero_loss_enforcer.insert("max_hedge_ratio".to_string(), 1.0);
        zero_loss_enforcer.insert("min_correlation".to_string(), 0.7);
        
        let god_kernel = self.agent_settings.get_mut("god_kernel").unwrap();
        god_kernel.insert("evolution_threshold".to_string(), 0.7);
        god_kernel.insert("mutation_rate".to_string(), 0.1);
        god_kernel.insert("fusion_rate".to_string(), 0.05);
        god_kernel.insert("destruction_rate".to_string(), 0.02);
        
        let compound_controller = self.agent_settings.get_mut("compound_controller").unwrap();
        compound_controller.insert("tier1_threshold".to_string(), 12.0);
        compound_controller.insert("tier2_threshold".to_string(), 100.0);
        compound_controller.insert("tier3_threshold".to_string(), 1000.0);
        compound_controller.insert("tier4_threshold".to_string(), 10000.0);
    }
    
    /// Set trading configuration
    pub fn set_trading_config(&mut self, config: TradingSystemConfig) {
        self.trading_config = config;
        self.modified = true;
    }
    
    /// Get trading configuration
    pub fn get_trading_config(&self) -> &TradingSystemConfig {
        &self.trading_config
    }
    
    /// Get mutable trading configuration
    pub fn get_trading_config_mut(&mut self) -> &mut TradingSystemConfig {
        self.modified = true;
        &mut self.trading_config
    }
    
    /// Set agent setting
    pub fn set_agent_setting(&mut self, agent: &str, key: &str, value: f64) {
        if let Some(agent_settings) = self.agent_settings.get_mut(agent) {
            agent_settings.insert(key.to_string(), value);
            self.modified = true;
        }
    }
    
    /// Get agent setting
    pub fn get_agent_setting(&self, agent: &str, key: &str) -> Option<f64> {
        if let Some(agent_settings) = self.agent_settings.get(agent) {
            agent_settings.get(key).copied()
        } else {
            None
        }
    }
    
    /// Get agent settings
    pub fn get_agent_settings(&self, agent: &str) -> Option<&HashMap<String, f64>> {
        self.agent_settings.get(agent)
    }
    
    /// Set UI setting
    pub fn set_ui_setting(&mut self, key: &str, value: &str) {
        self.ui_settings.insert(key.to_string(), value.to_string());
        self.modified = true;
    }
    
    /// Get UI setting
    pub fn get_ui_setting(&self, key: &str) -> Option<&String> {
        self.ui_settings.get(key)
    }
    
    /// Get UI settings
    pub fn get_ui_settings(&self) -> &HashMap<String, String> {
        &self.ui_settings
    }
    
    /// Set advanced setting
    pub fn set_advanced_setting(&mut self, key: &str, value: &str) {
        self.advanced_settings.insert(key.to_string(), value.to_string());
        self.modified = true;
    }
    
    /// Get advanced setting
    pub fn get_advanced_setting(&self, key: &str) -> Option<&String> {
        self.advanced_settings.get(key)
    }
    
    /// Get advanced settings
    pub fn get_advanced_settings(&self) -> &HashMap<String, String> {
        &self.advanced_settings
    }
    
    /// Set current category
    pub fn set_current_category(&mut self, category: SettingsCategory) {
        self.current_category = category;
    }
    
    /// Get current category
    pub fn get_current_category(&self) -> SettingsCategory {
        self.current_category
    }
    
    /// Is modified
    pub fn is_modified(&self) -> bool {
        self.modified
    }
    
    /// Save settings
    pub fn save(&mut self) -> Result<(), String> {
        // In a real implementation, this would save settings to disk
        self.modified = false;
        Ok(())
    }
    
    /// Load settings
    pub fn load() -> Result<Self, String> {
        // In a real implementation, this would load settings from disk
        let config = TradingSystemConfig::default();
        let mut settings = Settings::new(config);
        settings.initialize();
        Ok(settings)
    }
    
    /// Reset to defaults
    pub fn reset_to_defaults(&mut self) {
        self.trading_config = TradingSystemConfig::default();
        self.initialize();
        self.modified = true;
    }
}
