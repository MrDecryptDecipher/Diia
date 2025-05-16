//! Ghost Trader Agent
//!
//! This agent simulates trades before real execution to validate profitability
//! and avoid losses.

use std::sync::Arc;
use std::collections::{HashMap, VecDeque};
use chrono::{DateTime, Utc, Duration};
use serde::{Deserialize, Serialize};
use anyhow::Result;
use tracing::{info, debug, warn};
use async_trait::async_trait;
use tokio::sync::RwLock;
use rand_distr::{Normal, Distribution};
use rand::thread_rng;

use crate::engine::agent_trait::{Agent, AgentContext, AgentConfig};
use crate::engine::message_bus::{BusMessage, MessageBus, MessageType, TradeDirection};
use crate::market_simulator::MarketSimulator;

/// Maximum number of simulations to store
const MAX_SIMULATIONS: usize = 100;

/// Ghost trader state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GhostTraderState {
    /// Whether the agent is active
    pub active: bool,

    /// Number of simulations run
    pub simulations_run: usize,

    /// Number of approved trades
    pub approved_trades: usize,

    /// Number of rejected trades
    pub rejected_trades: usize,

    /// Approval rate
    pub approval_rate: f64,

    /// Average simulated ROI
    pub average_roi: f64,
}

/// Trade simulation parameters
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TradeSimulationParams {
    /// Symbol
    pub symbol: String,

    /// Current price
    pub current_price: f64,

    /// Trade direction
    pub direction: TradeDirection,

    /// Entry price
    pub entry_price: f64,

    /// Stop loss price
    pub stop_loss_price: f64,

    /// Take profit price
    pub take_profit_price: f64,

    /// Position size
    pub position_size: f64,

    /// Leverage
    pub leverage: f64,

    /// Timeframe in minutes
    pub timeframe: usize,

    /// Simulation duration in seconds
    pub duration: u64,

    /// Market volatility
    pub volatility: f64,

    /// Market trend
    pub trend: f64,

    /// Number of simulations to run
    pub num_simulations: usize,

    /// Minimum success rate required
    pub min_success_rate: f64,

    /// Minimum ROI required
    pub min_roi: f64,
}

/// Trade simulation result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TradeSimulationResult {
    /// Simulation ID
    pub id: String,

    /// Simulation parameters
    pub params: TradeSimulationParams,

    /// Simulation timestamp
    pub timestamp: DateTime<Utc>,

    /// Success rate
    pub success_rate: f64,

    /// Average ROI
    pub avg_roi: f64,

    /// Average duration in seconds
    pub avg_duration: u64,

    /// Win count
    pub win_count: usize,

    /// Loss count
    pub loss_count: usize,

    /// Timeout count
    pub timeout_count: usize,

    /// Price paths
    pub price_paths: Vec<Vec<f64>>,

    /// Path timestamps
    pub timestamps: Vec<DateTime<Utc>>,

    /// Trade approved
    pub approved: bool,

    /// Rejection reason
    pub rejection_reason: Option<String>,
}

/// Ghost Trader Agent
/// Ghost Trader configuration
#[derive(Debug, Clone)]
pub struct GhostTraderConfig {
    /// Simulation depth
    pub simulation_depth: usize,

    /// Minimum success rate
    pub min_success_rate: f64,

    /// Minimum expected ROI
    pub min_expected_roi: f64,
}

impl Default for GhostTraderConfig {
    fn default() -> Self {
        Self {
            simulation_depth: 100,
            min_success_rate: 0.6, // 60% success rate
            min_expected_roi: 0.01, // 1% ROI
        }
    }
}

pub struct GhostTrader {
    /// Configuration
    config: GhostTraderConfig,

    /// Message bus
    message_bus: Arc<MessageBus>,

    /// Agent state
    state: GhostTraderState,

    /// Simulation results
    simulation_results: VecDeque<TradeSimulationResult>,

    /// Running flag
    running: bool,
}

impl GhostTrader {
    /// Create a new ghost trader
    pub fn new(config: GhostTraderConfig, message_bus: Arc<MessageBus>) -> Self {
        Self {
            config,
            message_bus,
            state: GhostTraderState {
                active: true,
                simulations_run: 0,
                approved_trades: 0,
                rejected_trades: 0,
                approval_rate: 0.0,
                average_roi: 0.0,
            },
            simulation_results: VecDeque::with_capacity(MAX_SIMULATIONS),
            running: false,
        }
    }

    /// Simulate a trade
    pub fn simulate_trade(&mut self, params: TradeSimulationParams) -> Result<TradeSimulationResult> {
        // Create simulation ID
        let sim_id = format!("sim-{}-{}", params.symbol, Utc::now().timestamp_millis());

        // Calculate time steps
        let time_step = 1; // 1 second
        let num_steps = params.duration as usize / time_step;

        // Create timestamps
        let start_time = Utc::now();
        let mut timestamps = Vec::with_capacity(num_steps);
        for i in 0..num_steps {
            timestamps.push(start_time + Duration::seconds((i as i64) * (time_step as i64)));
        }

        // Run simulations
        let mut price_paths = Vec::with_capacity(params.num_simulations);
        let mut win_count = 0;
        let mut loss_count = 0;
        let mut timeout_count = 0;
        let mut total_roi = 0.0;
        let mut total_duration = 0;

        // Create a market simulator for this simulation
        let mut simulator = MarketSimulator::new();

        for _ in 0..params.num_simulations {
            // Simulate price path using the local simulator
            let (path, outcome, roi, duration) = self.simulate_price_path_with_simulator(&mut simulator, &params, num_steps, time_step)?;

            price_paths.push(path);

            match outcome {
                SimulationOutcome::Win => {
                    win_count += 1;
                    total_roi += roi;
                    total_duration += duration;
                },
                SimulationOutcome::Loss => {
                    loss_count += 1;
                    total_roi += roi;
                    total_duration += duration;
                },
                SimulationOutcome::Timeout => {
                    timeout_count += 1;
                },
            }
        }

        // Calculate statistics
        let success_rate = if win_count + loss_count > 0 {
            win_count as f64 / (win_count + loss_count) as f64
        } else {
            0.0
        };

        let avg_roi = if win_count + loss_count > 0 {
            total_roi / (win_count + loss_count) as f64
        } else {
            0.0
        };

        let avg_duration = if win_count + loss_count > 0 {
            total_duration / (win_count + loss_count) as u64
        } else {
            0
        };

        // Determine if trade is approved
        let approved = success_rate >= params.min_success_rate && avg_roi >= params.min_roi;

        let rejection_reason = if !approved {
            if success_rate < params.min_success_rate {
                Some(format!("Success rate too low: {:.2}% < {:.2}%", success_rate * 100.0, params.min_success_rate * 100.0))
            } else {
                Some(format!("Average ROI too low: {:.2}% < {:.2}%", avg_roi * 100.0, params.min_roi * 100.0))
            }
        } else {
            None
        };

        // Create result
        let result = TradeSimulationResult {
            id: sim_id,
            params: params.clone(),
            timestamp: start_time,
            success_rate,
            avg_roi,
            avg_duration,
            win_count,
            loss_count,
            timeout_count,
            price_paths,
            timestamps,
            approved,
            rejection_reason,
        };

        // Update state
        self.state.simulations_run += 1;

        if approved {
            self.state.approved_trades += 1;
        } else {
            self.state.rejected_trades += 1;
        }

        if self.state.simulations_run > 0 {
            self.state.approval_rate = self.state.approved_trades as f64 / self.state.simulations_run as f64;
        }

        // Update average ROI
        if self.state.approved_trades > 0 {
            self.state.average_roi = (self.state.average_roi * (self.state.approved_trades as f64 - 1.0) + avg_roi) / self.state.approved_trades as f64;
        }

        // Store result
        self.simulation_results.push_back(result.clone());

        // Enforce capacity limit
        if self.simulation_results.len() > MAX_SIMULATIONS {
            self.simulation_results.pop_front();
        }

        Ok(result)
    }

    /// Simulate a price path with a provided simulator
    fn simulate_price_path_with_simulator(&self, simulator: &mut MarketSimulator, params: &TradeSimulationParams, num_steps: usize, time_step: usize) -> Result<(Vec<f64>, SimulationOutcome, f64, u64)> {
        // Create price path
        let mut path = Vec::with_capacity(num_steps);
        path.push(params.current_price);

        // Set up random number generator
        let mut rng = thread_rng();

        // Calculate drift and volatility
        let drift = params.trend * 0.0001; // Base drift
        let vol = params.volatility * 0.001; // Base volatility

        // Create normal distribution
        let normal = Normal::new(0.0, 1.0).unwrap();

        // Simulate price movement
        for i in 1..num_steps {
            let prev_price = path[i - 1];

            // Generate random component
            let random = normal.sample(&mut rng);

            // Calculate price change
            let dt = time_step as f64 / 86400.0; // Convert to days
            let price_change = prev_price * (drift * dt + vol * random * dt.sqrt());

            // Calculate new price
            let new_price = prev_price + price_change;

            // Add to path
            path.push(new_price);

            // Check for stop loss or take profit
            if self.check_stop_loss(params, new_price) {
                // Calculate ROI
                let roi = self.calculate_roi(params, new_price);
                return Ok((path, SimulationOutcome::Loss, roi, (i as u64) * (time_step as u64)));
            }

            if self.check_take_profit(params, new_price) {
                // Calculate ROI
                let roi = self.calculate_roi(params, new_price);
                return Ok((path, SimulationOutcome::Win, roi, (i as u64) * (time_step as u64)));
            }
        }

        // If we reach here, the simulation timed out
        Ok((path, SimulationOutcome::Timeout, 0.0, 0))
    }

    /// Check if stop loss is hit
    fn check_stop_loss(&self, params: &TradeSimulationParams, price: f64) -> bool {
        match params.direction {
            TradeDirection::Long => price <= params.stop_loss_price,
            TradeDirection::Short => price >= params.stop_loss_price,
            _ => false,
        }
    }

    /// Check if take profit is hit
    fn check_take_profit(&self, params: &TradeSimulationParams, price: f64) -> bool {
        match params.direction {
            TradeDirection::Long => price >= params.take_profit_price,
            TradeDirection::Short => price <= params.take_profit_price,
            _ => false,
        }
    }

    /// Calculate ROI
    fn calculate_roi(&self, params: &TradeSimulationParams, exit_price: f64) -> f64 {
        let entry = params.entry_price;
        let exit = exit_price;

        match params.direction {
            TradeDirection::Long => {
                let pct_change = (exit - entry) / entry;
                pct_change * params.leverage * 100.0 // Convert to percentage
            },
            TradeDirection::Short => {
                let pct_change = (entry - exit) / entry;
                pct_change * params.leverage * 100.0 // Convert to percentage
            },
            _ => 0.0,
        }
    }

    /// Get simulation result by ID
    pub fn get_simulation_result(&self, id: &str) -> Option<&TradeSimulationResult> {
        self.simulation_results.iter().find(|r| r.id == id)
    }

    /// Get all simulation results
    pub fn get_all_simulation_results(&self) -> &VecDeque<TradeSimulationResult> {
        &self.simulation_results
    }

    /// Simulate trade (simplified version)
    fn simulate_trade_simple(&self, _symbol: &str, side: &str, entry_price: f64, stop_loss: f64, take_profit: f64) -> (bool, f64) {
        // In a real implementation, we would use historical data and Monte Carlo simulation
        // For now, we'll use a simple random simulation

        let mut rng = rand::thread_rng();
        let mut success_count = 0;
        let mut total_roi = 0.0;

        for _ in 0..self.config.simulation_depth {
            // Generate random price movement
            let price_movement = Normal::new(0.0, 0.01).unwrap().sample(&mut rng);
            let final_price = entry_price * (1.0 + price_movement);

            // Check if stop loss or take profit hit
            let (success, roi) = match side {
                "buy" => {
                    if final_price <= stop_loss {
                        // Stop loss hit
                        (false, (stop_loss - entry_price) / entry_price)
                    } else if final_price >= take_profit {
                        // Take profit hit
                        (true, (take_profit - entry_price) / entry_price)
                    } else {
                        // Neither hit, use final price
                        (final_price > entry_price, (final_price - entry_price) / entry_price)
                    }
                },
                "sell" => {
                    if final_price >= stop_loss {
                        // Stop loss hit
                        (false, (entry_price - stop_loss) / entry_price)
                    } else if final_price <= take_profit {
                        // Take profit hit
                        (true, (entry_price - take_profit) / entry_price)
                    } else {
                        // Neither hit, use final price
                        (final_price < entry_price, (entry_price - final_price) / entry_price)
                    }
                },
                _ => (false, 0.0),
            };

            if success {
                success_count += 1;
            }

            total_roi += roi;
        }

        let success_rate = success_count as f64 / self.config.simulation_depth as f64;
        let expected_roi = total_roi / self.config.simulation_depth as f64;

        (success_rate >= self.config.min_success_rate && expected_roi >= self.config.min_expected_roi, expected_roi)
    }

    /// Get state
    pub fn get_state(&self) -> &GhostTraderState {
        &self.state
    }
}

/// Simulation outcome
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum SimulationOutcome {
    /// Trade won (hit take profit)
    Win,

    /// Trade lost (hit stop loss)
    Loss,

    /// Simulation timed out
    Timeout,
}

#[async_trait]
impl Agent for GhostTrader {
    async fn initialize(&mut self, _context: Arc<RwLock<AgentContext>>) -> Result<()> {
        info!("Initializing Ghost Trader");

        // Send initialization message
        let message = BusMessage {
            message_type: MessageType::AgentInitialized,
            content: "Ghost Trader initialized".to_string(),
            timestamp: chrono::Utc::now(),
        };

        self.message_bus.publish(message).await;

        Ok(())
    }

    async fn start(&mut self) -> Result<()> {
        info!("Starting Ghost Trader");

        self.running = true;

        // Send start message
        let message = BusMessage {
            message_type: MessageType::AgentStarted,
            content: "Ghost Trader started".to_string(),
            timestamp: chrono::Utc::now(),
        };

        self.message_bus.publish(message).await;

        Ok(())
    }

    async fn stop(&mut self) -> Result<()> {
        info!("Stopping Ghost Trader");

        self.running = false;

        // Send stop message
        let message = BusMessage {
            message_type: MessageType::AgentStopped,
            content: "Ghost Trader stopped".to_string(),
            timestamp: chrono::Utc::now(),
        };

        self.message_bus.publish(message).await;

        Ok(())
    }

    async fn update(&mut self) -> Result<()> {
        if !self.running {
            return Ok(());
        }

        debug!("Updating Ghost Trader");

        Ok(())
    }

    async fn handle_message(&mut self, message: BusMessage) -> Result<()> {
        match message.message_type {
            MessageType::TradeEntry => {
                // Parse trade entry message
                // Format: "symbol:BTCUSDT,side:Buy,price:50000,quantity:0.001,stop_loss:49000,take_profit:51000"
                let parts: Vec<&str> = message.content.split(',').collect();

                let mut symbol = String::new();
                let mut side = String::new();
                let mut price = 0.0;
                let mut stop_loss = 0.0;
                let mut take_profit = 0.0;

                for part in parts {
                    let kv: Vec<&str> = part.split(':').collect();

                    if kv.len() == 2 {
                        match kv[0] {
                            "symbol" => symbol = kv[1].to_string(),
                            "side" => side = kv[1].to_string(),
                            "price" => price = kv[1].parse::<f64>().unwrap_or(0.0),
                            "stop_loss" => stop_loss = kv[1].parse::<f64>().unwrap_or(0.0),
                            "take_profit" => take_profit = kv[1].parse::<f64>().unwrap_or(0.0),
                            _ => {}
                        }
                    }
                }

                // Convert side to direction
                let direction = if side.to_uppercase() == "BUY" {
                    TradeDirection::Long
                } else {
                    TradeDirection::Short
                };

                // Create simulation parameters
                let params = TradeSimulationParams {
                    symbol: symbol.clone(),
                    current_price: price,
                    direction,
                    entry_price: price,
                    stop_loss_price: stop_loss,
                    take_profit_price: take_profit,
                    position_size: 1.0,
                    leverage: 1.0,
                    timeframe: 60, // 1 minute
                    duration: 3600, // 1 hour simulation
                    volatility: 0.02, // 2% volatility
                    trend: 0.0001, // Small upward trend
                    num_simulations: 100,
                    min_success_rate: 0.6, // 60% success rate
                    min_roi: 0.01, // 1% minimum ROI
                };

                // Simulate trade
                let result = self.simulate_trade(params)?;
                let should_execute = result.success_rate > 0.6; // 60% success rate threshold
                let expected_roi = result.avg_roi;

                // Send response
                let response = BusMessage {
                    message_type: MessageType::SystemUpdate,
                    content: format!("ghost_trader:{}:{}:{:.4}", symbol, should_execute, expected_roi),
                    timestamp: chrono::Utc::now(),
                };

                self.message_bus.publish(response).await;

                info!("Simulated trade for {}: should execute: {}, expected ROI: {:.2}%", symbol, should_execute, expected_roi * 100.0);
            },
            _ => {
                // Ignore other message types
            }
        }

        Ok(())
    }

    fn get_name(&self) -> &str {
        "GhostTrader"
    }

    fn get_config(&self) -> Box<dyn AgentConfig> {
        Box::new(self.config.clone())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_trade_simulation() {
        let mut ghost_trader = GhostTrader::new();

        // Create simulation parameters
        let params = TradeSimulationParams {
            symbol: "BTCUSDT".to_string(),
            current_price: 50000.0,
            direction: TradeDirection::Long,
            entry_price: 50000.0,
            stop_loss_price: 49500.0,
            take_profit_price: 51000.0,
            position_size: 0.1,
            leverage: 1.0,
            timeframe: 5,
            duration: 3600,
            volatility: 0.5,
            trend: 0.1,
            num_simulations: 10,
            min_success_rate: 0.5,
            min_roi: 0.5,
        };

        // Run simulation
        let result = ghost_trader.simulate_trade(params).unwrap();

        // Check result
        assert_eq!(result.params.symbol, "BTCUSDT");
        assert_eq!(result.price_paths.len(), 10);
        assert!(result.success_rate >= 0.0 && result.success_rate <= 1.0);
    }
}
