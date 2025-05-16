//! Compound Controller Agent
//!
//! This agent is responsible for capital allocation, leverage control,
//! and agent priority based on the current capital level.

use std::sync::Arc;
use std::collections::HashMap;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use anyhow::Result;
use tracing::{info, debug, warn};
use async_trait::async_trait;
use tokio::sync::RwLock;

use crate::engine::agent_trait::{Agent, AgentContext, AgentConfig};
use crate::engine::message_bus::{BusMessage, MessageBus, MessageType};

/// Capital tier
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum CapitalTier {
    /// Tier 1: $12-$25
    Tier1,

    /// Tier 2: $25-$100
    Tier2,

    /// Tier 3: $100-$500
    Tier3,

    /// Tier 4: $500+
    Tier4,
}

/// Capital allocation strategy
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CapitalAllocationStrategy {
    /// Capital tier
    pub tier: CapitalTier,

    /// Maximum leverage
    pub max_leverage: f64,

    /// Position size percentage
    pub position_size_pct: f64,

    /// Maximum concurrent trades
    pub max_concurrent_trades: usize,

    /// Minimum confidence threshold
    pub min_confidence: f64,

    /// Minimum ROI threshold
    pub min_roi: f64,

    /// Maximum drawdown percentage
    pub max_drawdown_pct: f64,

    /// Preferred strategies
    pub preferred_strategies: Vec<String>,

    /// Preferred timeframes
    pub preferred_timeframes: Vec<usize>,

    /// Agent priorities
    pub agent_priorities: HashMap<String, f64>,
}

/// Compound controller state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompoundControllerState {
    /// Whether the agent is active
    pub active: bool,

    /// Current capital
    pub current_capital: f64,

    /// Initial capital
    pub initial_capital: f64,

    /// Current tier
    pub current_tier: CapitalTier,

    /// Current allocation strategy
    pub current_strategy: CapitalAllocationStrategy,

    /// Peak capital
    pub peak_capital: f64,

    /// Current drawdown percentage
    pub current_drawdown_pct: f64,

    /// Current open positions
    pub open_positions: usize,

    /// Total profit
    pub total_profit: f64,

    /// ROI percentage
    pub roi_pct: f64,
}

/// Compound Controller Agent
/// Compound Controller configuration
#[derive(Debug, Clone)]
pub struct CompoundControllerConfig {
    /// Tier 1 position size percentage
    pub tier1_position_size: f64,

    /// Tier 2 position size percentage
    pub tier2_position_size: f64,

    /// Tier 3 position size percentage
    pub tier3_position_size: f64,

    /// Tier 4 position size percentage
    pub tier4_position_size: f64,

    /// Tier 1 max concurrent trades
    pub tier1_max_trades: usize,

    /// Tier 2 max concurrent trades
    pub tier2_max_trades: usize,

    /// Tier 3 max concurrent trades
    pub tier3_max_trades: usize,

    /// Tier 4 max concurrent trades
    pub tier4_max_trades: usize,
}

impl Default for CompoundControllerConfig {
    fn default() -> Self {
        Self {
            tier1_position_size: 0.1, // 10% of capital per trade
            tier2_position_size: 0.05, // 5% of capital per trade
            tier3_position_size: 0.03, // 3% of capital per trade
            tier4_position_size: 0.02, // 2% of capital per trade
            tier1_max_trades: 1,
            tier2_max_trades: 3,
            tier3_max_trades: 5,
            tier4_max_trades: 10,
        }
    }
}

pub struct CompoundController {
    /// Configuration
    config: CompoundControllerConfig,

    /// Message bus
    message_bus: Arc<MessageBus>,

    /// Agent state
    state: CompoundControllerState,

    /// Allocation strategies by tier
    allocation_strategies: HashMap<CapitalTier, CapitalAllocationStrategy>,

    /// Running flag
    running: bool,
}

impl CompoundController {
    /// Create a new compound controller
    pub fn new(config: CompoundControllerConfig, message_bus: Arc<MessageBus>, initial_capital: f64) -> Self {
        // Create default allocation strategies
        let mut strategies = HashMap::new();

        // Tier 1: $12-$25
        strategies.insert(CapitalTier::Tier1, CapitalAllocationStrategy {
            tier: CapitalTier::Tier1,
            max_leverage: 3.0,
            position_size_pct: 10.0,
            max_concurrent_trades: 1,
            min_confidence: 0.95,
            min_roi: 0.5,
            max_drawdown_pct: 5.0,
            preferred_strategies: vec!["trap_reversal".to_string(), "vwap_flip".to_string(), "breakout_trap".to_string()],
            preferred_timeframes: vec![1, 5],
            agent_priorities: {
                let mut map = HashMap::new();
                map.insert("market_analyzer".to_string(), 1.0);
                map.insert("orderbook_depth".to_string(), 0.9);
                map.insert("zero_loss_enforcer".to_string(), 1.0);
                map
            },
        });

        // Tier 2: $25-$100
        strategies.insert(CapitalTier::Tier2, CapitalAllocationStrategy {
            tier: CapitalTier::Tier2,
            max_leverage: 5.0,
            position_size_pct: 15.0,
            max_concurrent_trades: 2,
            min_confidence: 0.9,
            min_roi: 0.4,
            max_drawdown_pct: 7.0,
            preferred_strategies: vec!["momentum_spoof".to_string(), "ob_rotation".to_string(), "mid_volume_scalp".to_string()],
            preferred_timeframes: vec![5, 15],
            agent_priorities: {
                let mut map = HashMap::new();
                map.insert("market_analyzer".to_string(), 0.9);
                map.insert("orderbook_depth".to_string(), 1.0);
                map.insert("volume_igniter".to_string(), 0.8);
                map.insert("zero_loss_enforcer".to_string(), 1.0);
                map
            },
        });

        // Tier 3: $100-$500
        strategies.insert(CapitalTier::Tier3, CapitalAllocationStrategy {
            tier: CapitalTier::Tier3,
            max_leverage: 10.0,
            position_size_pct: 20.0,
            max_concurrent_trades: 3,
            min_confidence: 0.85,
            min_roi: 0.3,
            max_drawdown_pct: 10.0,
            preferred_strategies: vec!["sfp".to_string(), "sr_anchor".to_string(), "macro_fractal".to_string(), "trend_pull".to_string()],
            preferred_timeframes: vec![15, 60],
            agent_priorities: {
                let mut map = HashMap::new();
                map.insert("market_analyzer".to_string(), 0.8);
                map.insert("orderbook_depth".to_string(), 0.9);
                map.insert("volume_igniter".to_string(), 1.0);
                map.insert("funding_watch".to_string(), 0.7);
                map.insert("zero_loss_enforcer".to_string(), 1.0);
                map
            },
        });

        // Tier 4: $500+
        strategies.insert(CapitalTier::Tier4, CapitalAllocationStrategy {
            tier: CapitalTier::Tier4,
            max_leverage: 20.0,
            position_size_pct: 25.0,
            max_concurrent_trades: 5,
            min_confidence: 0.8,
            min_roi: 0.2,
            max_drawdown_pct: 15.0,
            preferred_strategies: vec!["multi_wave".to_string(), "spectral_signal".to_string(), "multi_confirmed".to_string()],
            preferred_timeframes: vec![60, 240],
            agent_priorities: {
                let mut map = HashMap::new();
                map.insert("market_analyzer".to_string(), 0.7);
                map.insert("orderbook_depth".to_string(), 0.8);
                map.insert("volume_igniter".to_string(), 0.9);
                map.insert("funding_watch".to_string(), 1.0);
                map.insert("whale_pulse".to_string(), 0.9);
                map.insert("zero_loss_enforcer".to_string(), 1.0);
                map
            },
        });

        // Determine initial tier
        let initial_tier = if initial_capital < 25.0 {
            CapitalTier::Tier1
        } else if initial_capital < 100.0 {
            CapitalTier::Tier2
        } else if initial_capital < 500.0 {
            CapitalTier::Tier3
        } else {
            CapitalTier::Tier4
        };

        // Create state
        let state = CompoundControllerState {
            active: true,
            current_capital: initial_capital,
            initial_capital,
            current_tier: initial_tier,
            current_strategy: strategies[&initial_tier].clone(),
            peak_capital: initial_capital,
            current_drawdown_pct: 0.0,
            open_positions: 0,
            total_profit: 0.0,
            roi_pct: 0.0,
        };

        Self {
            config,
            message_bus,
            state,
            allocation_strategies: strategies,
            running: false,
        }
    }

    /// Update capital
    pub fn update_capital(&mut self, new_capital: f64) {

        // Update state
        self.state.current_capital = new_capital;

        // Update peak capital
        if new_capital > self.state.peak_capital {
            self.state.peak_capital = new_capital;
        }

        // Calculate drawdown
        if self.state.peak_capital > 0.0 {
            self.state.current_drawdown_pct = (self.state.peak_capital - new_capital) / self.state.peak_capital * 100.0;
        }

        // Calculate ROI
        if self.state.initial_capital > 0.0 {
            self.state.roi_pct = (new_capital - self.state.initial_capital) / self.state.initial_capital * 100.0;
        }

        // Calculate total profit
        self.state.total_profit = new_capital - self.state.initial_capital;

        // Check for tier change
        let new_tier = if new_capital < 25.0 {
            CapitalTier::Tier1
        } else if new_capital < 100.0 {
            CapitalTier::Tier2
        } else if new_capital < 500.0 {
            CapitalTier::Tier3
        } else {
            CapitalTier::Tier4
        };

        if new_tier != self.state.current_tier {
            // Tier has changed
            self.state.current_tier = new_tier;
            self.state.current_strategy = self.allocation_strategies[&new_tier].clone();

            // Log tier change
            info!(
                "Capital tier changed to {:?}: ${:.2} - Max leverage: {}x, Position size: {}%, Max trades: {}",
                new_tier,
                new_capital,
                self.state.current_strategy.max_leverage,
                self.state.current_strategy.position_size_pct,
                self.state.current_strategy.max_concurrent_trades
            );

            // No need to create a message here anymore
        }

        // No return value
    }

    /// Calculate position size
    pub fn calculate_position_size(&self, confidence: f64, risk_factor: f64) -> f64 {
        // Base position size as percentage of capital
        let base_pct = self.state.current_strategy.position_size_pct;

        // Adjust based on confidence and risk
        let adjusted_pct = base_pct * confidence * risk_factor;

        // Calculate actual position size
        let position_size = self.state.current_capital * (adjusted_pct / 100.0);

        position_size
    }

    /// Calculate leverage
    pub fn calculate_leverage(&self, volatility: f64, timeframe: usize) -> f64 {
        // Base leverage from current tier
        let base_leverage = self.state.current_strategy.max_leverage;

        // Adjust based on volatility (higher volatility = lower leverage)
        let volatility_factor = 1.0 - (volatility * 2.0).min(0.8);

        // Adjust based on timeframe (higher timeframe = lower leverage)
        let timeframe_factor = match timeframe {
            1 => 1.0,    // 1m
            5 => 0.9,    // 5m
            15 => 0.8,   // 15m
            60 => 0.7,   // 1h
            240 => 0.6,  // 4h
            _ => 0.5,    // Other
        };

        // Calculate adjusted leverage
        let leverage = base_leverage * volatility_factor * timeframe_factor;

        // Ensure leverage is at least 1.0
        leverage.max(1.0)
    }

    /// Check if a trade is allowed
    pub fn is_trade_allowed(&self, confidence: f64, expected_roi: f64) -> bool {
        // Check if we're at max concurrent trades
        if self.state.open_positions >= self.state.current_strategy.max_concurrent_trades {
            return false;
        }

        // Check confidence threshold
        if confidence < self.state.current_strategy.min_confidence {
            return false;
        }

        // Check ROI threshold
        if expected_roi < self.state.current_strategy.min_roi {
            return false;
        }

        // Check drawdown threshold
        if self.state.current_drawdown_pct > self.state.current_strategy.max_drawdown_pct {
            return false;
        }

        true
    }

    /// Update open positions count
    pub fn update_open_positions(&mut self, count: usize) {
        self.state.open_positions = count;
    }

    /// Get agent priority
    pub fn get_agent_priority(&self, agent_name: &str) -> f64 {
        self.state.current_strategy.agent_priorities.get(agent_name).copied().unwrap_or(0.5)
    }

    /// Get preferred strategies
    pub fn get_preferred_strategies(&self) -> &[String] {
        &self.state.current_strategy.preferred_strategies
    }

    /// Get preferred timeframes
    pub fn get_preferred_timeframes(&self) -> &[usize] {
        &self.state.current_strategy.preferred_timeframes
    }

    /// Get current allocation strategy
    pub fn get_current_strategy(&self) -> &CapitalAllocationStrategy {
        &self.state.current_strategy
    }

    /// Get state
    pub fn get_state(&self) -> &CompoundControllerState {
        &self.state
    }

    /// Set allocation strategy for a tier
    pub fn set_allocation_strategy(&mut self, tier: CapitalTier, strategy: CapitalAllocationStrategy) {
        self.allocation_strategies.insert(tier, strategy.clone());

        // Update current strategy if we're in this tier
        if self.state.current_tier == tier {
            self.state.current_strategy = strategy;
        }
    }
}

#[async_trait]
impl Agent for CompoundController {
    async fn initialize(&mut self, _context: Arc<RwLock<AgentContext>>) -> Result<()> {
        info!("Initializing Compound Controller");

        // Send initialization message
        let message = BusMessage {
            message_type: MessageType::AgentInitialized,
            content: "Compound Controller initialized".to_string(),
            timestamp: chrono::Utc::now(),
        };

        self.message_bus.publish(message).await;

        Ok(())
    }

    async fn start(&mut self) -> Result<()> {
        info!("Starting Compound Controller");

        self.running = true;

        // Send start message
        let message = BusMessage {
            message_type: MessageType::AgentStarted,
            content: "Compound Controller started".to_string(),
            timestamp: chrono::Utc::now(),
        };

        self.message_bus.publish(message).await;

        Ok(())
    }

    async fn stop(&mut self) -> Result<()> {
        info!("Stopping Compound Controller");

        self.running = false;

        // Send stop message
        let message = BusMessage {
            message_type: MessageType::AgentStopped,
            content: "Compound Controller stopped".to_string(),
            timestamp: chrono::Utc::now(),
        };

        self.message_bus.publish(message).await;

        Ok(())
    }

    async fn update(&mut self) -> Result<()> {
        if !self.running {
            return Ok(());
        }

        debug!("Updating Compound Controller");

        Ok(())
    }

    async fn handle_message(&mut self, message: BusMessage) -> Result<()> {
        match message.message_type {
            MessageType::SystemUpdate => {
                // Parse system update message
                // Format: "capital:100.0"
                if let Some(capital_str) = message.content.strip_prefix("capital:") {
                    if let Ok(capital) = capital_str.parse::<f64>() {
                        self.update_capital(capital);

                        info!("Updated capital to ${:.2}", capital);
                    }
                }
            },
            _ => {
                // Ignore other message types
            }
        }

        Ok(())
    }

    fn get_name(&self) -> &str {
        "CompoundController"
    }

    fn get_config(&self) -> Box<dyn AgentConfig> {
        Box::new(self.config.clone())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tier_selection() {
        // Test Tier 1
        let controller = CompoundController::new(12.0);
        assert_eq!(controller.get_state().current_tier, CapitalTier::Tier1);

        // Test Tier 2
        let controller = CompoundController::new(50.0);
        assert_eq!(controller.get_state().current_tier, CapitalTier::Tier2);

        // Test Tier 3
        let controller = CompoundController::new(200.0);
        assert_eq!(controller.get_state().current_tier, CapitalTier::Tier3);

        // Test Tier 4
        let controller = CompoundController::new(1000.0);
        assert_eq!(controller.get_state().current_tier, CapitalTier::Tier4);
    }

    #[test]
    fn test_tier_change() {
        let mut controller = CompoundController::new(12.0);
        assert_eq!(controller.get_state().current_tier, CapitalTier::Tier1);

        // Update capital to trigger tier change
        let messages = controller.update_capital(30.0).unwrap();
        assert_eq!(controller.get_state().current_tier, CapitalTier::Tier2);
        assert_eq!(messages.len(), 1);

        // Update capital within same tier
        let messages = controller.update_capital(50.0).unwrap();
        assert_eq!(controller.get_state().current_tier, CapitalTier::Tier2);
        assert_eq!(messages.len(), 0);
    }

    #[test]
    fn test_position_sizing() {
        let controller = CompoundController::new(100.0);

        // Test with different confidence levels
        let size1 = controller.calculate_position_size(1.0, 1.0);
        let size2 = controller.calculate_position_size(0.5, 1.0);

        assert!(size1 > size2);
        assert!(size1 <= 100.0);
    }
}
