//! Dashboard
//!
//! This module provides the dashboard UI for the OMNI-ALPHA VΩ∞∞ platform.

use std::collections::HashMap;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::trading_system::{TradingSystemState, Trade, TradeStatus};
use crate::agents::compound_controller::CapitalTier;

/// Dashboard view mode
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum DashboardView {
    /// Overview
    Overview,
    
    /// Performance
    Performance,
    
    /// Trades
    Trades,
    
    /// Agents
    Agents,
    
    /// System
    System,
}

/// Dashboard metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DashboardMetrics {
    /// Current capital
    pub current_capital: f64,
    
    /// Initial capital
    pub initial_capital: f64,
    
    /// Current profit/loss
    pub current_pnl: f64,
    
    /// Current ROI percentage
    pub current_roi: f64,
    
    /// Win rate percentage
    pub win_rate: f64,
    
    /// Number of active trades
    pub active_trades_count: usize,
    
    /// Number of completed trades
    pub completed_trades_count: usize,
    
    /// Current capital tier
    pub capital_tier: CapitalTier,
    
    /// System uptime in seconds
    pub uptime_seconds: u64,
    
    /// Agent performance
    pub agent_performance: HashMap<String, f64>,
    
    /// Recent trades
    pub recent_trades: Vec<Trade>,
    
    /// Best performing symbols
    pub best_symbols: Vec<(String, f64)>,
    
    /// Worst performing symbols
    pub worst_symbols: Vec<(String, f64)>,
    
    /// Last update time
    pub last_update_time: DateTime<Utc>,
}

/// Dashboard
pub struct Dashboard {
    /// Current view
    view: DashboardView,
    
    /// Dashboard metrics
    metrics: DashboardMetrics,
    
    /// System state
    system_state: TradingSystemState,
    
    /// Active trades
    active_trades: Vec<Trade>,
    
    /// Trade history
    trade_history: Vec<Trade>,
}

impl Dashboard {
    /// Create a new dashboard
    pub fn new() -> Self {
        Self {
            view: DashboardView::Overview,
            metrics: DashboardMetrics {
                current_capital: 0.0,
                initial_capital: 0.0,
                current_pnl: 0.0,
                current_roi: 0.0,
                win_rate: 0.0,
                active_trades_count: 0,
                completed_trades_count: 0,
                capital_tier: CapitalTier::Tier1,
                uptime_seconds: 0,
                agent_performance: HashMap::new(),
                recent_trades: Vec::new(),
                best_symbols: Vec::new(),
                worst_symbols: Vec::new(),
                last_update_time: Utc::now(),
            },
            system_state: TradingSystemState {
                running: false,
                current_capital: 0.0,
                initial_capital: 0.0,
                current_pnl: 0.0,
                current_roi: 0.0,
                active_trades_count: 0,
                completed_trades_count: 0,
                win_rate: 0.0,
                capital_tier: CapitalTier::Tier1,
                start_time: Utc::now(),
                last_update_time: Utc::now(),
                mode: crate::trading_system::TradingMode::Simulation,
            },
            active_trades: Vec::new(),
            trade_history: Vec::new(),
        }
    }
    
    /// Update dashboard
    pub fn update(&mut self, system_state: TradingSystemState, active_trades: Vec<Trade>, trade_history: Vec<Trade>) {
        // Update system state
        self.system_state = system_state.clone();
        
        // Update trades
        self.active_trades = active_trades;
        self.trade_history = trade_history;
        
        // Calculate uptime
        let uptime = Utc::now().signed_duration_since(system_state.start_time);
        let uptime_seconds = uptime.num_seconds() as u64;
        
        // Calculate agent performance
        let agent_performance = self.calculate_agent_performance();
        
        // Calculate symbol performance
        let (best_symbols, worst_symbols) = self.calculate_symbol_performance();
        
        // Update metrics
        self.metrics = DashboardMetrics {
            current_capital: system_state.current_capital,
            initial_capital: system_state.initial_capital,
            current_pnl: system_state.current_pnl,
            current_roi: system_state.current_roi,
            win_rate: system_state.win_rate,
            active_trades_count: system_state.active_trades_count,
            completed_trades_count: system_state.completed_trades_count,
            capital_tier: system_state.capital_tier,
            uptime_seconds,
            agent_performance,
            recent_trades: self.get_recent_trades(10),
            best_symbols,
            worst_symbols,
            last_update_time: Utc::now(),
        };
    }
    
    /// Calculate agent performance
    fn calculate_agent_performance(&self) -> HashMap<String, f64> {
        let mut performance = HashMap::new();
        
        // Calculate performance based on trade sources
        for trade in &self.trade_history {
            if trade.status == TradeStatus::Closed && trade.realized_pnl.is_some() {
                let source = &trade.source;
                let pnl = trade.realized_pnl.unwrap();
                
                *performance.entry(source.clone()).or_insert(0.0) += pnl;
            }
        }
        
        performance
    }
    
    /// Calculate symbol performance
    fn calculate_symbol_performance(&self) -> (Vec<(String, f64)>, Vec<(String, f64)>) {
        let mut performance = HashMap::new();
        
        // Calculate performance based on symbols
        for trade in &self.trade_history {
            if trade.status == TradeStatus::Closed && trade.realized_pnl.is_some() {
                let symbol = &trade.symbol;
                let pnl = trade.realized_pnl.unwrap();
                
                *performance.entry(symbol.clone()).or_insert(0.0) += pnl;
            }
        }
        
        // Convert to vectors
        let mut performance_vec: Vec<(String, f64)> = performance.into_iter().collect();
        
        // Sort by performance
        performance_vec.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
        
        // Get best and worst
        let best = performance_vec.iter().take(5).cloned().collect();
        let worst = performance_vec.iter().rev().take(5).cloned().collect();
        
        (best, worst)
    }
    
    /// Get recent trades
    fn get_recent_trades(&self, count: usize) -> Vec<Trade> {
        let mut trades = Vec::new();
        
        // Add active trades
        trades.extend(self.active_trades.clone());
        
        // Add recent closed trades
        let mut closed_trades: Vec<Trade> = self.trade_history.iter()
            .filter(|t| t.status == TradeStatus::Closed)
            .cloned()
            .collect();
        
        // Sort by exit time (most recent first)
        closed_trades.sort_by(|a, b| {
            b.exit_time.unwrap_or(b.entry_time).cmp(&a.exit_time.unwrap_or(a.entry_time))
        });
        
        // Add to trades
        trades.extend(closed_trades);
        
        // Limit to count
        trades.truncate(count);
        
        trades
    }
    
    /// Set view
    pub fn set_view(&mut self, view: DashboardView) {
        self.view = view;
    }
    
    /// Get view
    pub fn get_view(&self) -> DashboardView {
        self.view
    }
    
    /// Get metrics
    pub fn get_metrics(&self) -> &DashboardMetrics {
        &self.metrics
    }
    
    /// Get system state
    pub fn get_system_state(&self) -> &TradingSystemState {
        &self.system_state
    }
    
    /// Get active trades
    pub fn get_active_trades(&self) -> &[Trade] {
        &self.active_trades
    }
    
    /// Get trade history
    pub fn get_trade_history(&self) -> &[Trade] {
        &self.trade_history
    }
}
