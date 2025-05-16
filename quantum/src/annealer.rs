use async_trait::async_trait;
use chrono::{DateTime, Utc};
use ndarray::{Array1, Array2};
use rand::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use crate::agent_trait::Agent;
use crate::message_bus::Message;
use crate::spectral_tree_engine::{PathSimulationResult, EntropyCluster, TradeDirection};

/// Annealer optimizes trade parameters based on spectral tree simulations
/// using simulated annealing to find optimal entry/exit points.
pub struct Annealer {
    /// Current state of the annealer
    state: AnnealerState,
    /// Configuration for the annealer
    config: AnnealerConfig,
    /// Active annealing processes
    active_processes: HashMap<String, AnnealingProcess>,
    /// Completed annealing results
    annealing_results: Vec<AnnealingResult>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnnealerConfig {
    /// Initial temperature for annealing
    pub initial_temperature: f64,
    /// Cooling rate for temperature
    pub cooling_rate: f64,
    /// Number of iterations per temperature
    pub iterations_per_temp: usize,
    /// Minimum temperature to stop annealing
    pub min_temperature: f64,
    /// Maximum number of iterations
    pub max_iterations: usize,
    /// Maximum number of concurrent processes
    pub max_concurrent_processes: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnnealerState {
    /// Whether the annealer is currently active
    pub active: bool,
    /// Last time the annealer ran
    pub last_run: DateTime<Utc>,
    /// Number of processes run
    pub process_count: u64,
    /// Number of iterations run
    pub iteration_count: u64,
    /// Average energy improvement
    pub average_improvement: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnnealingProcess {
    /// Unique ID for the process
    pub id: String,
    /// Asset being optimized
    pub asset: String,
    /// Spectral simulation result being optimized
    pub spectral_result: PathSimulationResult,
    /// Current temperature
    pub temperature: f64,
    /// Current iteration
    pub iteration: usize,
    /// Best solution found
    pub best_solution: TradeSolution,
    /// Current solution
    pub current_solution: TradeSolution,
    /// Energy history
    pub energy_history: Vec<f64>,
    /// Whether the process has completed
    pub completed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TradeSolution {
    /// Entry price
    pub entry_price: f64,
    /// Stop loss price
    pub stop_loss: f64,
    /// Take profit price
    pub take_profit: f64,
    /// Position size multiplier (0-1)
    pub position_size_multiplier: f64,
    /// Trade direction
    pub direction: TradeDirection,
    /// Energy (lower is better)
    pub energy: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnnealingResult {
    /// The original process
    pub process: AnnealingProcess,
    /// Optimized entry price
    pub optimized_entry: f64,
    /// Optimized stop loss
    pub optimized_stop_loss: f64,
    /// Optimized take profit
    pub optimized_take_profit: f64,
    /// Optimized position size multiplier
    pub optimized_position_size: f64,
    /// Optimized direction
    pub optimized_direction: TradeDirection,
    /// Expected ROI
    pub expected_roi: f64,
    /// Risk-reward ratio
    pub risk_reward_ratio: f64,
    /// Confidence score (0-100)
    pub confidence: f64,
    /// Improvement over initial solution
    pub improvement: f64,
}

impl Annealer {
    pub fn new(config: AnnealerConfig) -> Self {
        Self {
            state: AnnealerState {
                active: true,
                last_run: Utc::now(),
                process_count: 0,
                iteration_count: 0,
                average_improvement: 0.0,
            },
            config,
            active_processes: HashMap::new(),
            annealing_results: Vec::new(),
        }
    }

    /// Start a new annealing process for a spectral simulation result
    pub fn start_process(&mut self, spectral_result: PathSimulationResult) -> anyhow::Result<String> {
        // Check if we're at max capacity
        if self.active_processes.len() >= self.config.max_concurrent_processes {
            return Err(anyhow::anyhow!("Maximum concurrent processes reached"));
        }
        
        let process_id = format!("anneal-{}-{}", spectral_result.simulation.asset, Utc::now().timestamp_millis());
        
        // Create initial solution from spectral result
        let initial_solution = TradeSolution {
            entry_price: spectral_result.optimal_entry,
            stop_loss: spectral_result.optimal_entry * 0.99,
            take_profit: spectral_result.optimal_exit,
            position_size_multiplier: 0.5,
            direction: spectral_result.recommended_direction,
            energy: self.calculate_energy(&spectral_result, 
                                         spectral_result.optimal_entry,
                                         spectral_result.optimal_entry * 0.99,
                                         spectral_result.optimal_exit,
                                         0.5,
                                         spectral_result.recommended_direction),
        };
        
        // Create process
        let process = AnnealingProcess {
            id: process_id.clone(),
            asset: spectral_result.simulation.asset.clone(),
            spectral_result,
            temperature: self.config.initial_temperature,
            iteration: 0,
            best_solution: initial_solution.clone(),
            current_solution: initial_solution,
            energy_history: Vec::new(),
            completed: false,
        };
        
        self.active_processes.insert(process_id.clone(), process);
        self.state.process_count += 1;
        
        Ok(process_id)
    }

    /// Run an annealing process to completion
    pub fn run_process(&mut self, process_id: &str) -> anyhow::Result<AnnealingResult> {
        let process = self.active_processes.get_mut(process_id)
            .ok_or_else(|| anyhow::anyhow!("Process not found: {}", process_id))?;
        
        let mut rng = thread_rng();
        
        // Run annealing
        while process.temperature > self.config.min_temperature && process.iteration < self.config.max_iterations {
            // Run iterations at this temperature
            for _ in 0..self.config.iterations_per_temp {
                // Generate neighbor solution
                let neighbor = self.generate_neighbor(&process.current_solution, process.temperature, &mut rng);
                
                // Calculate energy
                let neighbor_energy = self.calculate_energy(
                    &process.spectral_result,
                    neighbor.entry_price,
                    neighbor.stop_loss,
                    neighbor.take_profit,
                    neighbor.position_size_multiplier,
                    neighbor.direction
                );
                
                // Decide whether to accept neighbor
                let accept = if neighbor_energy < process.current_solution.energy {
                    // Always accept better solutions
                    true
                } else {
                    // Accept worse solutions with probability based on temperature
                    let delta = neighbor_energy - process.current_solution.energy;
                    let probability = (-delta / process.temperature).exp();
                    rng.gen::<f64>() < probability
                };
                
                if accept {
                    // Update current solution
                    process.current_solution = TradeSolution {
                        entry_price: neighbor.entry_price,
                        stop_loss: neighbor.stop_loss,
                        take_profit: neighbor.take_profit,
                        position_size_multiplier: neighbor.position_size_multiplier,
                        direction: neighbor.direction,
                        energy: neighbor_energy,
                    };
                    
                    // Update best solution if better
                    if neighbor_energy < process.best_solution.energy {
                        process.best_solution = process.current_solution.clone();
                    }
                }
                
                // Record energy
                process.energy_history.push(process.current_solution.energy);
                
                // Update iteration count
                process.iteration += 1;
                self.state.iteration_count += 1;
                
                // Check if max iterations reached
                if process.iteration >= self.config.max_iterations {
                    break;
                }
            }
            
            // Cool temperature
            process.temperature *= self.config.cooling_rate;
        }
        
        // Mark as completed
        process.completed = true;
        
        // Create result
        let result = self.create_result(process.clone());
        
        // Update state
        self.state.last_run = Utc::now();
        self.state.average_improvement = 0.9 * self.state.average_improvement + 0.1 * result.improvement;
        
        // Store result
        self.annealing_results.push(result.clone());
        
        Ok(result)
    }

    /// Generate a neighbor solution by perturbing the current solution
    fn generate_neighbor(&self, current: &TradeSolution, temperature: f64, rng: &mut ThreadRng) -> TradeSolution {
        // Scale perturbation by temperature
        let scale = temperature / self.config.initial_temperature;
        
        // Perturb entry price (±1%)
        let entry_perturbation = current.entry_price * 0.01 * scale * (2.0 * rng.gen::<f64>() - 1.0);
        let entry_price = (current.entry_price + entry_perturbation).max(current.entry_price * 0.95).min(current.entry_price * 1.05);
        
        // Perturb stop loss (±1%)
        let sl_perturbation = current.stop_loss * 0.01 * scale * (2.0 * rng.gen::<f64>() - 1.0);
        let stop_loss = match current.direction {
            TradeDirection::Long => (current.stop_loss + sl_perturbation).max(entry_price * 0.95).min(entry_price * 0.99),
            TradeDirection::Short => (current.stop_loss + sl_perturbation).min(entry_price * 1.05).max(entry_price * 1.01),
            TradeDirection::Neutral => current.stop_loss,
        };
        
        // Perturb take profit (±2%)
        let tp_perturbation = current.take_profit * 0.02 * scale * (2.0 * rng.gen::<f64>() - 1.0);
        let take_profit = match current.direction {
            TradeDirection::Long => (current.take_profit + tp_perturbation).min(entry_price * 1.1).max(entry_price * 1.01),
            TradeDirection::Short => (current.take_profit + tp_perturbation).max(entry_price * 0.9).min(entry_price * 0.99),
            TradeDirection::Neutral => current.take_profit,
        };
        
        // Perturb position size (±10%)
        let size_perturbation = 0.1 * scale * (2.0 * rng.gen::<f64>() - 1.0);
        let position_size_multiplier = (current.position_size_multiplier + size_perturbation).max(0.1).min(1.0);
        
        // Occasionally flip direction
        let direction = if rng.gen::<f64>() < 0.05 * scale {
            match current.direction {
                TradeDirection::Long => TradeDirection::Short,
                TradeDirection::Short => TradeDirection::Long,
                TradeDirection::Neutral => if rng.gen::<bool>() { TradeDirection::Long } else { TradeDirection::Short },
            }
        } else {
            current.direction
        };
        
        TradeSolution {
            entry_price,
            stop_loss,
            take_profit,
            position_size_multiplier,
            direction,
            energy: 0.0,  // Will be calculated later
        }
    }

    /// Calculate energy (lower is better) for a solution
    fn calculate_energy(&self, spectral_result: &PathSimulationResult, 
                       entry_price: f64, stop_loss: f64, take_profit: f64, 
                       position_size: f64, direction: TradeDirection) -> f64 {
        // Calculate risk-reward ratio
        let risk = match direction {
            TradeDirection::Long => (entry_price - stop_loss).abs() / entry_price,
            TradeDirection::Short => (stop_loss - entry_price).abs() / entry_price,
            TradeDirection::Neutral => 0.0,
        };
        
        let reward = match direction {
            TradeDirection::Long => (take_profit - entry_price).abs() / entry_price,
            TradeDirection::Short => (entry_price - take_profit).abs() / entry_price,
            TradeDirection::Neutral => 0.0,
        };
        
        let risk_reward_ratio = if risk > 0.0 { reward / risk } else { 0.0 };
        
        // Calculate expected ROI based on spectral paths
        let mut expected_roi = 0.0;
        let num_paths = spectral_result.simulation.paths.len();
        let final_step = spectral_result.simulation.paths[0].len() - 1;
        
        for path in &spectral_result.simulation.paths {
            let final_price = path[final_step];
            
            let path_roi = match direction {
                TradeDirection::Long => {
                    if final_price <= stop_loss {
                        // Stop loss hit
                        -risk * 100.0
                    } else if final_price >= take_profit {
                        // Take profit hit
                        reward * 100.0
                    } else {
                        // Neither hit, use final price
                        (final_price - entry_price) / entry_price * 100.0
                    }
                },
                TradeDirection::Short => {
                    if final_price >= stop_loss {
                        // Stop loss hit
                        -risk * 100.0
                    } else if final_price <= take_profit {
                        // Take profit hit
                        reward * 100.0
                    } else {
                        // Neither hit, use final price
                        (entry_price - final_price) / entry_price * 100.0
                    }
                },
                TradeDirection::Neutral => 0.0,
            };
            
            expected_roi += path_roi / num_paths as f64;
        }
        
        // Calculate win rate
        let mut win_count = 0;
        for path in &spectral_result.simulation.paths {
            let final_price = path[final_step];
            
            let is_win = match direction {
                TradeDirection::Long => final_price > entry_price,
                TradeDirection::Short => final_price < entry_price,
                TradeDirection::Neutral => false,
            };
            
            if is_win {
                win_count += 1;
            }
        }
        
        let win_rate = win_count as f64 / num_paths as f64;
        
        // Calculate energy components
        let roi_energy = -expected_roi;  // Higher ROI = lower energy
        let risk_reward_energy = if risk_reward_ratio >= 2.0 { -5.0 } else { 5.0 - risk_reward_ratio * 5.0 };
        let win_rate_energy = (1.0 - win_rate) * 10.0;  // Higher win rate = lower energy
        let size_energy = (1.0 - position_size) * 2.0;  // Prefer larger positions
        
        // Combine components with weights
        let energy = 0.5 * roi_energy + 
                    0.3 * risk_reward_energy + 
                    0.15 * win_rate_energy + 
                    0.05 * size_energy;
        
        energy
    }

    /// Create a result from a completed process
    fn create_result(&self, process: AnnealingProcess) -> AnnealingResult {
        let best = &process.best_solution;
        
        // Calculate risk-reward ratio
        let risk = match best.direction {
            TradeDirection::Long => (best.entry_price - best.stop_loss).abs() / best.entry_price,
            TradeDirection::Short => (best.stop_loss - best.entry_price).abs() / best.entry_price,
            TradeDirection::Neutral => 0.0,
        };
        
        let reward = match best.direction {
            TradeDirection::Long => (best.take_profit - best.entry_price).abs() / best.entry_price,
            TradeDirection::Short => (best.entry_price - best.take_profit).abs() / best.entry_price,
            TradeDirection::Neutral => 0.0,
        };
        
        let risk_reward_ratio = if risk > 0.0 { reward / risk } else { 0.0 };
        
        // Calculate expected ROI
        let expected_roi = match best.direction {
            TradeDirection::Long => (best.take_profit - best.entry_price) / best.entry_price * 100.0,
            TradeDirection::Short => (best.entry_price - best.take_profit) / best.entry_price * 100.0,
            TradeDirection::Neutral => 0.0,
        };
        
        // Calculate improvement
        let initial_energy = process.energy_history.first().unwrap_or(&0.0);
        let final_energy = best.energy;
        let improvement = if *initial_energy != 0.0 {
            (*initial_energy - final_energy) / initial_energy.abs() * 100.0
        } else {
            0.0
        };
        
        // Calculate confidence
        let confidence = process.spectral_result.confidence * (1.0 + improvement / 200.0);
        
        AnnealingResult {
            process,
            optimized_entry: best.entry_price,
            optimized_stop_loss: best.stop_loss,
            optimized_take_profit: best.take_profit,
            optimized_position_size: best.position_size_multiplier,
            optimized_direction: best.direction,
            expected_roi,
            risk_reward_ratio,
            confidence,
            improvement,
        }
    }
}

#[async_trait]
impl Agent for Annealer {
    async fn process(&mut self) -> anyhow::Result<Vec<Message>> {
        // Process any active annealing processes
        let mut messages = Vec::new();
        let process_ids: Vec<String> = self.active_processes.keys().cloned().collect();
        
        for id in process_ids {
            if !self.active_processes.get(&id).unwrap().completed {
                match self.run_process(&id) {
                    Ok(result) => {
                        messages.push(Message::Custom(
                            "annealing_result".to_string(),
                            serde_json::to_value(result).unwrap()
                        ));
                    },
                    Err(e) => {
                        eprintln!("Error running annealing process {}: {}", id, e);
                    }
                }
            }
        }
        
        // Remove completed processes
        self.active_processes.retain(|_, proc| !proc.completed);
        
        Ok(messages)
    }

    fn name(&self) -> &str {
        "annealer"
    }

    fn is_active(&self) -> bool {
        self.state.active
    }

    fn set_active(&mut self, active: bool) {
        self.state.active = active;
    }
}
