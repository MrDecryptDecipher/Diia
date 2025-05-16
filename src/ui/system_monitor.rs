//! System Monitor
//!
//! This module provides the system monitor UI for the OMNI-ALPHA VΩ∞∞ platform.

use std::collections::{HashMap, VecDeque};
use chrono::{DateTime, Utc, Duration};
use serde::{Deserialize, Serialize};

use crate::trading_system::TradingSystemState;
use crate::agents::god_kernel::{GodKernelState, EvolutionEvent};

/// System metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemMetrics {
    /// CPU usage percentage
    pub cpu_usage: f64,
    
    /// Memory usage in MB
    pub memory_usage: f64,
    
    /// Disk usage in MB
    pub disk_usage: f64,
    
    /// Network usage in KB/s
    pub network_usage: f64,
    
    /// Number of active agents
    pub active_agents: usize,
    
    /// Number of active trades
    pub active_trades: usize,
    
    /// System uptime in seconds
    pub uptime_seconds: u64,
    
    /// Current generation
    pub current_generation: usize,
    
    /// Evolution score
    pub evolution_score: f64,
    
    /// System health score
    pub health_score: f64,
    
    /// System diversity score
    pub diversity_score: f64,
    
    /// Timestamp
    pub timestamp: DateTime<Utc>,
}

/// System monitor
pub struct SystemMonitor {
    /// Current metrics
    current_metrics: SystemMetrics,
    
    /// Metrics history
    metrics_history: VecDeque<SystemMetrics>,
    
    /// Evolution events
    evolution_events: VecDeque<EvolutionEvent>,
    
    /// Agent performance
    agent_performance: HashMap<String, f64>,
    
    /// System warnings
    warnings: VecDeque<String>,
    
    /// System errors
    errors: VecDeque<String>,
    
    /// Maximum history size
    max_history_size: usize,
}

impl SystemMonitor {
    /// Create a new system monitor
    pub fn new() -> Self {
        Self {
            current_metrics: SystemMetrics {
                cpu_usage: 0.0,
                memory_usage: 0.0,
                disk_usage: 0.0,
                network_usage: 0.0,
                active_agents: 0,
                active_trades: 0,
                uptime_seconds: 0,
                current_generation: 1,
                evolution_score: 50.0,
                health_score: 100.0,
                diversity_score: 50.0,
                timestamp: Utc::now(),
            },
            metrics_history: VecDeque::new(),
            evolution_events: VecDeque::new(),
            agent_performance: HashMap::new(),
            warnings: VecDeque::new(),
            errors: VecDeque::new(),
            max_history_size: 1000,
        }
    }
    
    /// Update system monitor
    pub fn update(&mut self, system_state: &TradingSystemState, god_kernel_state: &GodKernelState, evolution_events: &[EvolutionEvent], agent_performance: HashMap<String, f64>) {
        // Calculate uptime
        let uptime = Utc::now().signed_duration_since(system_state.start_time);
        let uptime_seconds = uptime.num_seconds() as u64;
        
        // Update metrics
        let metrics = SystemMetrics {
            cpu_usage: self.get_cpu_usage(),
            memory_usage: self.get_memory_usage(),
            disk_usage: self.get_disk_usage(),
            network_usage: self.get_network_usage(),
            active_agents: god_kernel_state.active_agents,
            active_trades: system_state.active_trades_count,
            uptime_seconds,
            current_generation: god_kernel_state.current_generation,
            evolution_score: god_kernel_state.evolution_score,
            health_score: god_kernel_state.health_score,
            diversity_score: god_kernel_state.diversity_score,
            timestamp: Utc::now(),
        };
        
        // Update current metrics
        self.current_metrics = metrics.clone();
        
        // Add to history
        self.metrics_history.push_back(metrics);
        
        // Limit history size
        if self.metrics_history.len() > self.max_history_size {
            self.metrics_history.pop_front();
        }
        
        // Update evolution events
        for event in evolution_events {
            self.evolution_events.push_back(event.clone());
        }
        
        // Limit evolution events
        while self.evolution_events.len() > self.max_history_size {
            self.evolution_events.pop_front();
        }
        
        // Update agent performance
        self.agent_performance = agent_performance;
        
        // Check for warnings and errors
        self.check_warnings_and_errors();
    }
    
    /// Get CPU usage
    fn get_cpu_usage(&self) -> f64 {
        // In a real implementation, this would get actual CPU usage
        // For now, just return a random value
        let mut rng = rand::thread_rng();
        rand::Rng::gen_range(&mut rng, 10.0..50.0)
    }
    
    /// Get memory usage
    fn get_memory_usage(&self) -> f64 {
        // In a real implementation, this would get actual memory usage
        // For now, just return a random value
        let mut rng = rand::thread_rng();
        rand::Rng::gen_range(&mut rng, 100.0..500.0)
    }
    
    /// Get disk usage
    fn get_disk_usage(&self) -> f64 {
        // In a real implementation, this would get actual disk usage
        // For now, just return a random value
        let mut rng = rand::thread_rng();
        rand::Rng::gen_range(&mut rng, 1000.0..5000.0)
    }
    
    /// Get network usage
    fn get_network_usage(&self) -> f64 {
        // In a real implementation, this would get actual network usage
        // For now, just return a random value
        let mut rng = rand::thread_rng();
        rand::Rng::gen_range(&mut rng, 10.0..100.0)
    }
    
    /// Check for warnings and errors
    fn check_warnings_and_errors(&mut self) {
        // Check CPU usage
        if self.current_metrics.cpu_usage > 80.0 {
            self.add_warning(format!("High CPU usage: {:.1}%", self.current_metrics.cpu_usage));
        }
        
        // Check memory usage
        if self.current_metrics.memory_usage > 1000.0 {
            self.add_warning(format!("High memory usage: {:.1} MB", self.current_metrics.memory_usage));
        }
        
        // Check disk usage
        if self.current_metrics.disk_usage > 10000.0 {
            self.add_warning(format!("High disk usage: {:.1} MB", self.current_metrics.disk_usage));
        }
        
        // Check health score
        if self.current_metrics.health_score < 50.0 {
            self.add_warning(format!("Low system health score: {:.1}", self.current_metrics.health_score));
        }
        
        // Check diversity score
        if self.current_metrics.diversity_score < 30.0 {
            self.add_warning(format!("Low system diversity score: {:.1}", self.current_metrics.diversity_score));
        }
    }
    
    /// Add warning
    pub fn add_warning(&mut self, warning: String) {
        self.warnings.push_back(warning);
        
        // Limit warnings
        if self.warnings.len() > 100 {
            self.warnings.pop_front();
        }
    }
    
    /// Add error
    pub fn add_error(&mut self, error: String) {
        self.errors.push_back(error);
        
        // Limit errors
        if self.errors.len() > 100 {
            self.errors.pop_front();
        }
    }
    
    /// Get current metrics
    pub fn get_current_metrics(&self) -> &SystemMetrics {
        &self.current_metrics
    }
    
    /// Get metrics history
    pub fn get_metrics_history(&self) -> &VecDeque<SystemMetrics> {
        &self.metrics_history
    }
    
    /// Get evolution events
    pub fn get_evolution_events(&self) -> &VecDeque<EvolutionEvent> {
        &self.evolution_events
    }
    
    /// Get agent performance
    pub fn get_agent_performance(&self) -> &HashMap<String, f64> {
        &self.agent_performance
    }
    
    /// Get warnings
    pub fn get_warnings(&self) -> &VecDeque<String> {
        &self.warnings
    }
    
    /// Get errors
    pub fn get_errors(&self) -> &VecDeque<String> {
        &self.errors
    }
    
    /// Clear warnings
    pub fn clear_warnings(&mut self) {
        self.warnings.clear();
    }
    
    /// Clear errors
    pub fn clear_errors(&mut self) {
        self.errors.clear();
    }
}
