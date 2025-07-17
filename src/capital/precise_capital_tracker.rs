//! Precise Capital Tracker Module for OMNI Trading System
//!
//! This module provides precise capital tracking and allocation management.

use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use anyhow::Result;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CapitalAllocation {
    pub agent_id: String,
    pub allocated_amount: f64,
    pub used_amount: f64,
    pub available_amount: f64,
    pub profit_loss: f64,
    pub allocation_percentage: f64,
    pub last_updated: u64,
}

impl CapitalAllocation {
    pub fn new(agent_id: String, allocated_amount: f64, total_capital: f64) -> Self {
        let allocation_percentage = if total_capital > 0.0 {
            (allocated_amount / total_capital) * 100.0
        } else {
            0.0
        };

        Self {
            agent_id,
            allocated_amount,
            used_amount: 0.0,
            available_amount: allocated_amount,
            profit_loss: 0.0,
            allocation_percentage,
            last_updated: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        }
    }

    pub fn use_capital(&mut self, amount: f64) -> Result<()> {
        if amount > self.available_amount {
            return Err(anyhow::anyhow!(
                "Insufficient available capital: requested {}, available {}",
                amount,
                self.available_amount
            ));
        }

        self.used_amount += amount;
        self.available_amount -= amount;
        self.update_timestamp();
        Ok(())
    }

    pub fn release_capital(&mut self, amount: f64, profit_loss: f64) -> Result<()> {
        if amount > self.used_amount {
            return Err(anyhow::anyhow!(
                "Cannot release more capital than used: requested {}, used {}",
                amount,
                self.used_amount
            ));
        }

        self.used_amount -= amount;
        self.available_amount += amount + profit_loss;
        self.profit_loss += profit_loss;
        self.allocated_amount += profit_loss; // Compound profits
        self.update_timestamp();
        Ok(())
    }

    pub fn get_utilization_percentage(&self) -> f64 {
        if self.allocated_amount > 0.0 {
            (self.used_amount / self.allocated_amount) * 100.0
        } else {
            0.0
        }
    }

    pub fn get_return_percentage(&self) -> f64 {
        if self.allocated_amount > 0.0 {
            (self.profit_loss / (self.allocated_amount - self.profit_loss)) * 100.0
        } else {
            0.0
        }
    }

    fn update_timestamp(&mut self) {
        self.last_updated = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CapitalSnapshot {
    pub timestamp: u64,
    pub total_capital: f64,
    pub allocated_capital: f64,
    pub available_capital: f64,
    pub total_profit_loss: f64,
    pub allocations: Vec<CapitalAllocation>,
}

#[derive(Debug, Clone)]
pub struct PreciseCapitalTracker {
    total_capital: f64,
    initial_capital: f64,
    allocations: HashMap<String, CapitalAllocation>,
    capital_history: Vec<CapitalSnapshot>,
    max_history_size: usize,
    reserve_percentage: f64, // Percentage to keep as reserve
}

impl PreciseCapitalTracker {
    pub fn new(initial_capital: f64) -> Self {
        Self {
            total_capital: initial_capital,
            initial_capital,
            allocations: HashMap::new(),
            capital_history: Vec::new(),
            max_history_size: 1000,
            reserve_percentage: 0.1, // 10% reserve by default
        }
    }

    pub fn allocate_capital(&mut self, agent_id: String, amount: f64) -> Result<()> {
        let available_for_allocation = self.get_available_capital();
        
        if amount > available_for_allocation {
            return Err(anyhow::anyhow!(
                "Insufficient capital for allocation: requested {}, available {}",
                amount,
                available_for_allocation
            ));
        }

        let allocation = CapitalAllocation::new(agent_id.clone(), amount, self.total_capital);
        self.allocations.insert(agent_id, allocation);
        self.take_snapshot();
        
        Ok(())
    }

    pub fn deallocate_capital(&mut self, agent_id: &str) -> Result<f64> {
        if let Some(allocation) = self.allocations.remove(agent_id) {
            if allocation.used_amount > 0.0 {
                return Err(anyhow::anyhow!(
                    "Cannot deallocate capital with active positions: {} has {} in use",
                    agent_id,
                    allocation.used_amount
                ));
            }
            
            let returned_amount = allocation.available_amount;
            self.take_snapshot();
            Ok(returned_amount)
        } else {
            Err(anyhow::anyhow!("No allocation found for agent: {}", agent_id))
        }
    }

    pub fn use_capital(&mut self, agent_id: &str, amount: f64) -> Result<()> {
        if let Some(allocation) = self.allocations.get_mut(agent_id) {
            allocation.use_capital(amount)?;
            self.take_snapshot();
            Ok(())
        } else {
            Err(anyhow::anyhow!("No allocation found for agent: {}", agent_id))
        }
    }

    pub fn release_capital(&mut self, agent_id: &str, amount: f64, profit_loss: f64) -> Result<()> {
        if let Some(allocation) = self.allocations.get_mut(agent_id) {
            allocation.release_capital(amount, profit_loss)?;
            self.total_capital += profit_loss; // Update total capital with P&L
            self.take_snapshot();
            Ok(())
        } else {
            Err(anyhow::anyhow!("No allocation found for agent: {}", agent_id))
        }
    }

    pub fn get_allocation(&self, agent_id: &str) -> Option<&CapitalAllocation> {
        self.allocations.get(agent_id)
    }

    pub fn get_all_allocations(&self) -> Vec<&CapitalAllocation> {
        self.allocations.values().collect()
    }

    pub fn get_total_capital(&self) -> f64 {
        self.total_capital
    }

    pub fn get_initial_capital(&self) -> f64 {
        self.initial_capital
    }

    pub fn get_allocated_capital(&self) -> f64 {
        self.allocations.values()
            .map(|alloc| alloc.allocated_amount)
            .sum()
    }

    pub fn get_used_capital(&self) -> f64 {
        self.allocations.values()
            .map(|alloc| alloc.used_amount)
            .sum()
    }

    pub fn get_available_capital(&self) -> f64 {
        let allocated = self.get_allocated_capital();
        let reserve = self.total_capital * self.reserve_percentage;
        (self.total_capital - allocated - reserve).max(0.0)
    }

    pub fn get_total_profit_loss(&self) -> f64 {
        self.allocations.values()
            .map(|alloc| alloc.profit_loss)
            .sum()
    }

    pub fn get_total_return_percentage(&self) -> f64 {
        if self.initial_capital > 0.0 {
            ((self.total_capital - self.initial_capital) / self.initial_capital) * 100.0
        } else {
            0.0
        }
    }

    pub fn get_capital_utilization(&self) -> f64 {
        if self.total_capital > 0.0 {
            (self.get_used_capital() / self.total_capital) * 100.0
        } else {
            0.0
        }
    }

    pub fn set_reserve_percentage(&mut self, percentage: f64) {
        self.reserve_percentage = percentage.max(0.0).min(1.0);
    }

    pub fn get_reserve_percentage(&self) -> f64 {
        self.reserve_percentage
    }

    pub fn get_reserve_amount(&self) -> f64 {
        self.total_capital * self.reserve_percentage
    }

    fn take_snapshot(&mut self) {
        let snapshot = CapitalSnapshot {
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            total_capital: self.total_capital,
            allocated_capital: self.get_allocated_capital(),
            available_capital: self.get_available_capital(),
            total_profit_loss: self.get_total_profit_loss(),
            allocations: self.allocations.values().cloned().collect(),
        };

        self.capital_history.push(snapshot);

        // Limit history size
        if self.capital_history.len() > self.max_history_size {
            self.capital_history.remove(0);
        }
    }

    pub fn get_capital_history(&self, limit: Option<usize>) -> Vec<&CapitalSnapshot> {
        let history: Vec<&CapitalSnapshot> = self.capital_history.iter().collect();
        
        if let Some(limit) = limit {
            history.into_iter().rev().take(limit).collect()
        } else {
            history
        }
    }

    pub fn get_performance_summary(&self) -> HashMap<String, f64> {
        let mut summary = HashMap::new();
        
        summary.insert("total_capital".to_string(), self.total_capital);
        summary.insert("initial_capital".to_string(), self.initial_capital);
        summary.insert("allocated_capital".to_string(), self.get_allocated_capital());
        summary.insert("used_capital".to_string(), self.get_used_capital());
        summary.insert("available_capital".to_string(), self.get_available_capital());
        summary.insert("reserve_amount".to_string(), self.get_reserve_amount());
        summary.insert("total_profit_loss".to_string(), self.get_total_profit_loss());
        summary.insert("total_return_percentage".to_string(), self.get_total_return_percentage());
        summary.insert("capital_utilization".to_string(), self.get_capital_utilization());
        summary.insert("active_allocations".to_string(), self.allocations.len() as f64);
        
        summary
    }

    pub fn rebalance_allocations(&mut self, target_allocations: HashMap<String, f64>) -> Result<()> {
        // Validate that total allocations don't exceed available capital
        let total_requested: f64 = target_allocations.values().sum();
        let available = self.get_available_capital() + self.get_allocated_capital();
        
        if total_requested > available {
            return Err(anyhow::anyhow!(
                "Total requested allocations ({}) exceed available capital ({})",
                total_requested,
                available
            ));
        }

        // Clear existing allocations (only if no capital is in use)
        for allocation in self.allocations.values() {
            if allocation.used_amount > 0.0 {
                return Err(anyhow::anyhow!(
                    "Cannot rebalance while capital is in use by agent: {}",
                    allocation.agent_id
                ));
            }
        }

        self.allocations.clear();

        // Create new allocations
        for (agent_id, amount) in target_allocations {
            self.allocate_capital(agent_id, amount)?;
        }

        Ok(())
    }
}

impl Default for PreciseCapitalTracker {
    fn default() -> Self {
        Self::new(0.0)
    }
}
