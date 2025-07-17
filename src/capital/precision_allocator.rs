//! Precision Capital Allocation System
//!
//! This module provides mathematically precise capital allocation with fixed-point arithmetic
//! to ensure exactly 12 USDT total capital constraint with zero drift.
//!
//! PHASE 2 SPECIFICATIONS:
//! - Total Capital: Exactly 12.00 USDT (never 100 USDT or other amounts)
//! - Active Trading Capital: 10.00 USDT (with 2.00 USDT safety buffer)
//! - Minimum Trade Size: 5.00 USDT (Bybit requirement)
//! - Maximum Concurrent Positions: 2 positions (5 USDT each)
//! - Profit Target: Minimum 0.6 USDT per trade after fees/slippage
//! - Capital Distribution: Mathematical precision required - all allocations must sum exactly to 12.00 USDT

use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use anyhow::{Result, anyhow};
use tracing::{info, debug, warn, error};
use chrono::{DateTime, Utc};

/// Fixed-point precision for capital calculations (6 decimal places)
const CAPITAL_PRECISION: i64 = 1_000_000;

/// Total capital in micro-USDT (12.000000 USDT) - EXACT SPECIFICATION
const TOTAL_CAPITAL_MICRO: i64 = 12_000_000;

/// Active trading capital in micro-USDT (10.000000 USDT)
const ACTIVE_CAPITAL_MICRO: i64 = 10_000_000;

/// Safety buffer in micro-USDT (2.000000 USDT)
const SAFETY_BUFFER_MICRO: i64 = 2_000_000;

/// Minimum trade size in micro-USDT (5.000000 USDT) - Bybit requirement
const MIN_TRADE_SIZE_MICRO: i64 = 5_000_000;

/// Maximum concurrent positions
const MAX_CONCURRENT_POSITIONS: usize = 2;

/// Minimum profit target per trade in micro-USDT (0.600000 USDT)
const MIN_PROFIT_TARGET_MICRO: i64 = 600_000;

/// Enhanced position tracking with comprehensive metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PositionAllocation {
    /// Symbol being traded
    pub symbol: String,
    /// Allocated capital in micro-USDT
    pub allocated_micro: i64,
    /// Entry timestamp
    pub entry_time: DateTime<Utc>,
    /// Expected profit target in micro-USDT
    pub profit_target_micro: i64,
    /// Stop loss level in micro-USDT
    pub stop_loss_micro: i64,
    /// Current unrealized PnL in micro-USDT
    pub unrealized_pnl_micro: i64,
    /// Position leverage
    pub leverage: f64,
    /// Position direction (Long/Short)
    pub direction: String,
}

/// Capital allocation validation result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AllocationValidation {
    /// Whether allocation is valid
    pub is_valid: bool,
    /// Validation message
    pub message: String,
    /// Available capital after allocation
    pub remaining_capital_micro: i64,
    /// Number of active positions after allocation
    pub active_positions_count: usize,
}

/// Precision-controlled capital allocation tracker with EXACT 12 USDT constraint
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PreciseCapitalTracker {
    /// Total capital in micro-USDT (EXACTLY 12.000000 USDT)
    total_capital_micro: i64,

    /// Active trading capital in micro-USDT (10.000000 USDT)
    active_capital_micro: i64,

    /// Safety buffer in micro-USDT (2.000000 USDT)
    safety_buffer_micro: i64,

    /// Currently allocated capital in micro-USDT
    allocated_capital_micro: i64,

    /// Available capital for new positions in micro-USDT
    available_capital_micro: i64,

    /// Position allocations by symbol with full metadata
    positions: HashMap<String, PositionAllocation>,

    /// Reserved capital for pending orders in micro-USDT
    reserved_capital_micro: i64,

    /// Total realized PnL in micro-USDT
    realized_pnl_micro: i64,

    /// Total unrealized PnL in micro-USDT
    unrealized_pnl_micro: i64,

    /// Capital allocation history for auditing
    allocation_history: Vec<CapitalAllocation>,
}

/// Capital allocation record for history tracking
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CapitalAllocation {
    /// Timestamp of allocation
    pub timestamp: DateTime<Utc>,
    /// Symbol allocated to
    pub symbol: String,
    /// Amount allocated in micro-USDT
    pub amount_micro: i64,
    /// Allocation type (Open/Close/Adjust)
    pub allocation_type: String,
    /// Reason for allocation
    pub reason: String,
    /// Total capital after allocation
    pub total_after_micro: i64,
}

impl Default for PreciseCapitalTracker {
    fn default() -> Self {
        Self::new()
    }
}

impl PreciseCapitalTracker {
    /// Create new precise capital tracker with EXACT 12 USDT constraint
    pub fn new() -> Self {
        info!("💰 Initializing Precise Capital Tracker with EXACT 12.000000 USDT constraint");

        // Verify mathematical precision
        assert_eq!(TOTAL_CAPITAL_MICRO, 12_000_000, "Total capital must be exactly 12.000000 USDT");
        assert_eq!(ACTIVE_CAPITAL_MICRO, 10_000_000, "Active capital must be exactly 10.000000 USDT");
        assert_eq!(SAFETY_BUFFER_MICRO, 2_000_000, "Safety buffer must be exactly 2.000000 USDT");
        assert_eq!(ACTIVE_CAPITAL_MICRO + SAFETY_BUFFER_MICRO, TOTAL_CAPITAL_MICRO,
                   "Active capital + safety buffer must equal total capital");

        Self {
            total_capital_micro: TOTAL_CAPITAL_MICRO,
            active_capital_micro: ACTIVE_CAPITAL_MICRO,
            safety_buffer_micro: SAFETY_BUFFER_MICRO,
            allocated_capital_micro: 0,
            available_capital_micro: ACTIVE_CAPITAL_MICRO,
            positions: HashMap::new(),
            reserved_capital_micro: 0,
            realized_pnl_micro: 0,
            unrealized_pnl_micro: 0,
            allocation_history: Vec::new(),
        }
    }

    /// Validate capital allocation request
    pub fn validate_allocation(&self, symbol: &str, amount_usdt: f64) -> AllocationValidation {
        let amount_micro = self.usdt_to_micro(amount_usdt);

        // Check minimum trade size (5 USDT Bybit requirement)
        if amount_micro < MIN_TRADE_SIZE_MICRO {
            return AllocationValidation {
                is_valid: false,
                message: format!("Trade size {:.6} USDT below minimum 5.000000 USDT", amount_usdt),
                remaining_capital_micro: self.available_capital_micro,
                active_positions_count: self.positions.len(),
            };
        }

        // Check maximum concurrent positions
        if self.positions.len() >= MAX_CONCURRENT_POSITIONS {
            return AllocationValidation {
                is_valid: false,
                message: format!("Maximum {} concurrent positions reached", MAX_CONCURRENT_POSITIONS),
                remaining_capital_micro: self.available_capital_micro,
                active_positions_count: self.positions.len(),
            };
        }

        // Check available capital
        if amount_micro > self.available_capital_micro {
            return AllocationValidation {
                is_valid: false,
                message: format!("Insufficient capital: requested {:.6} USDT, available {:.6} USDT",
                               amount_usdt, self.micro_to_usdt(self.available_capital_micro)),
                remaining_capital_micro: self.available_capital_micro,
                active_positions_count: self.positions.len(),
            };
        }

        // Check if symbol already has position
        if self.positions.contains_key(symbol) {
            return AllocationValidation {
                is_valid: false,
                message: format!("Position already exists for symbol: {}", symbol),
                remaining_capital_micro: self.available_capital_micro,
                active_positions_count: self.positions.len(),
            };
        }

        AllocationValidation {
            is_valid: true,
            message: format!("Allocation valid: {:.6} USDT to {}", amount_usdt, symbol),
            remaining_capital_micro: self.available_capital_micro - amount_micro,
            active_positions_count: self.positions.len() + 1,
        }
    }
}
    
    /// Allocate capital for a new position
    pub fn allocate_capital(&mut self, symbol: &str, amount_usdt: f64) -> Result<()> {
        let amount_micro = self.usdt_to_micro(amount_usdt);
        
        // Check if we already have a position for this symbol
        if self.positions.contains_key(symbol) {
            return Err(anyhow!("Position already exists for symbol: {}", symbol));
        }
        
        // Check if we have sufficient available capital
        if self.available_capital_micro < amount_micro {
            return Err(anyhow!(
                "Insufficient capital: requested {:.6} USDT, available {:.6} USDT",
                self.micro_to_usdt(amount_micro),
                self.micro_to_usdt(self.available_capital_micro)
            ));
        }

        // This is a simple allocation method - complete it
        self.allocated_capital_micro += amount_micro;
        self.available_capital_micro -= amount_micro;

        let position = PositionAllocation {
            symbol: symbol.to_string(),
            allocated_micro: amount_micro,
            leverage: 1.0,
            direction: "Long".to_string(),
            entry_price: 0.0,
            profit_target_micro: 0,
            stop_loss_micro: 0,
            unrealized_pnl_micro: 0,
            timestamp: Utc::now(),
        };

        self.positions.insert(symbol.to_string(), position);

        info!("Allocated {:.6} USDT to {}", amount_usdt, symbol);
        Ok(())
    }

    /// Allocate capital for a new position with comprehensive validation
    pub fn allocate_capital(&mut self, symbol: &str, amount_usdt: f64, leverage: f64,
                           direction: &str, profit_target_usdt: f64, stop_loss_usdt: f64) -> Result<()> {
        // Validate allocation first
        let validation = self.validate_allocation(symbol, amount_usdt);
        if !validation.is_valid {
            return Err(anyhow!("Capital allocation failed: {}", validation.message));
        }

        let amount_micro = self.usdt_to_micro(amount_usdt);
        let profit_target_micro = self.usdt_to_micro(profit_target_usdt);
        let stop_loss_micro = self.usdt_to_micro(stop_loss_usdt);

        // Ensure profit target meets minimum requirement (0.6 USDT)
        if profit_target_micro < MIN_PROFIT_TARGET_MICRO {
            return Err(anyhow!(
                "Profit target {:.6} USDT below minimum {:.6} USDT requirement",
                profit_target_usdt,
                self.micro_to_usdt(MIN_PROFIT_TARGET_MICRO)
            ));
        }

        // Create position allocation
        let position = PositionAllocation {
            symbol: symbol.to_string(),
            allocated_micro: amount_micro,
            entry_time: Utc::now(),
            profit_target_micro,
            stop_loss_micro,
            unrealized_pnl_micro: 0,
            leverage,
            direction: direction.to_string(),
        };

        // Update capital tracking
        self.allocated_capital_micro += amount_micro;
        self.available_capital_micro -= amount_micro;
        self.positions.insert(symbol.to_string(), position);

        // Record allocation in history
        let allocation_record = CapitalAllocation {
            timestamp: Utc::now(),
            symbol: symbol.to_string(),
            amount_micro,
            allocation_type: "Open".to_string(),
            reason: format!("New {} position with {:.1}x leverage", direction, leverage),
            total_after_micro: self.allocated_capital_micro,
        };
        self.allocation_history.push(allocation_record);

        info!(
            "💰 Allocated {:.6} USDT to {} ({} {:.1}x). Active: {:.6} USDT, Available: {:.6} USDT, Positions: {}/{}",
            amount_usdt, symbol, direction, leverage,
            self.micro_to_usdt(self.allocated_capital_micro),
            self.micro_to_usdt(self.available_capital_micro),
            self.positions.len(),
            MAX_CONCURRENT_POSITIONS
        );

        // Verify total capital constraint
        self.verify_capital_constraint()?;

        Ok(())
    }
    
    /// Deallocate capital from a closed position with comprehensive tracking
    pub fn deallocate_capital(&mut self, symbol: &str, realized_pnl_usdt: f64) -> Result<()> {
        let position = self.positions.remove(symbol)
            .ok_or_else(|| anyhow!("No position found for symbol: {}", symbol))?;

        let realized_pnl_micro = self.usdt_to_micro(realized_pnl_usdt);

        // Update capital tracking
        self.allocated_capital_micro -= position.allocated_micro;
        self.available_capital_micro += position.allocated_micro;
        self.realized_pnl_micro += realized_pnl_micro;

        // Record deallocation in history
        let allocation_record = CapitalAllocation {
            timestamp: Utc::now(),
            symbol: symbol.to_string(),
            amount_micro: position.allocated_micro,
            allocation_type: "Close".to_string(),
            reason: format!("Position closed with PnL: {:.6} USDT", realized_pnl_usdt),
            total_after_micro: self.allocated_capital_micro,
        };
        self.allocation_history.push(allocation_record);

        info!(
            "💰 Deallocated {:.6} USDT from {} (PnL: {:.6} USDT). Active: {:.6} USDT, Available: {:.6} USDT, Positions: {}/{}",
            self.micro_to_usdt(position.allocated_micro), symbol, realized_pnl_usdt,
            self.micro_to_usdt(self.allocated_capital_micro),
            self.micro_to_usdt(self.available_capital_micro),
            self.positions.len(),
            MAX_CONCURRENT_POSITIONS
        );

        // Verify total capital constraint
        self.verify_capital_constraint()?;

        Ok(())
    }

    /// Update unrealized PnL for a position
    pub fn update_unrealized_pnl(&mut self, symbol: &str, unrealized_pnl_usdt: f64) -> Result<()> {
        let position = self.positions.get_mut(symbol)
            .ok_or_else(|| anyhow!("No position found for symbol: {}", symbol))?;

        let old_pnl_micro = position.unrealized_pnl_micro;
        let new_pnl_micro = self.usdt_to_micro(unrealized_pnl_usdt);

        position.unrealized_pnl_micro = new_pnl_micro;

        // Update total unrealized PnL
        self.unrealized_pnl_micro = self.unrealized_pnl_micro - old_pnl_micro + new_pnl_micro;

        debug!(
            "📊 Updated unrealized PnL for {}: {:.6} USDT (Total unrealized: {:.6} USDT)",
            symbol, unrealized_pnl_usdt, self.micro_to_usdt(self.unrealized_pnl_micro)
        );

        Ok(())
    }

    /// Get comprehensive capital status
    pub fn get_capital_status(&self) -> CapitalStatus {
        CapitalStatus {
            total_capital_usdt: self.micro_to_usdt(self.total_capital_micro),
            active_capital_usdt: self.micro_to_usdt(self.active_capital_micro),
            safety_buffer_usdt: self.micro_to_usdt(self.safety_buffer_micro),
            allocated_capital_usdt: self.micro_to_usdt(self.allocated_capital_micro),
            available_capital_usdt: self.micro_to_usdt(self.available_capital_micro),
            reserved_capital_usdt: self.micro_to_usdt(self.reserved_capital_micro),
            realized_pnl_usdt: self.micro_to_usdt(self.realized_pnl_micro),
            unrealized_pnl_usdt: self.micro_to_usdt(self.unrealized_pnl_micro),
            total_pnl_usdt: self.micro_to_usdt(self.realized_pnl_micro + self.unrealized_pnl_micro),
            active_positions: self.positions.len(),
            max_positions: MAX_CONCURRENT_POSITIONS,
            capital_utilization_percent: (self.allocated_capital_micro as f64 / self.active_capital_micro as f64) * 100.0,
            positions: self.positions.clone(),
        }
    }

    /// Verify capital constraint with mathematical precision
    pub fn verify_capital_constraint(&self) -> Result<()> {
        // Check total capital is exactly 12 USDT
        if self.total_capital_micro != TOTAL_CAPITAL_MICRO {
            return Err(anyhow!(
                "Total capital constraint violation: {} micro-USDT != {} micro-USDT",
                self.total_capital_micro, TOTAL_CAPITAL_MICRO
            ));
        }

        // Check active + safety = total
        if self.active_capital_micro + self.safety_buffer_micro != self.total_capital_micro {
            return Err(anyhow!(
                "Capital composition error: active ({}) + safety ({}) != total ({})",
                self.active_capital_micro, self.safety_buffer_micro, self.total_capital_micro
            ));
        }

        // Check allocated + available = active
        if self.allocated_capital_micro + self.available_capital_micro != self.active_capital_micro {
            return Err(anyhow!(
                "Active capital error: allocated ({}) + available ({}) != active ({})",
                self.allocated_capital_micro, self.available_capital_micro, self.active_capital_micro
            ));
        }

        // Check position count constraint
        if self.positions.len() > MAX_CONCURRENT_POSITIONS {
            return Err(anyhow!(
                "Position count violation: {} > {} max positions",
                self.positions.len(), MAX_CONCURRENT_POSITIONS
            ));
        }

        // Verify position allocations sum correctly
        let position_sum: i64 = self.positions.values().map(|p| p.allocated_micro).sum();
        if position_sum != self.allocated_capital_micro {
            return Err(anyhow!(
                "Position allocation mismatch: sum ({}) != allocated ({})",
                position_sum, self.allocated_capital_micro
            ));
        }

        Ok(())
    }

    /// Convert USDT to micro-USDT with precision
    fn usdt_to_micro(&self, usdt: f64) -> i64 {
        (usdt * CAPITAL_PRECISION as f64).round() as i64
    }

    /// Convert micro-USDT to USDT with precision
    fn micro_to_usdt(&self, micro: i64) -> f64 {
        micro as f64 / CAPITAL_PRECISION as f64
    }

    /// Get allocation history for auditing
    pub fn get_allocation_history(&self) -> &Vec<CapitalAllocation> {
        &self.allocation_history
    }

    /// Calculate maximum possible trade size
    pub fn calculate_max_trade_size(&self) -> f64 {
        let max_per_position = self.micro_to_usdt(self.available_capital_micro);
        let min_trade_size = self.micro_to_usdt(MIN_TRADE_SIZE_MICRO);

        if max_per_position < min_trade_size {
            0.0
        } else {
            max_per_position
        }
    }

    /// Check if new position can be opened
    pub fn can_open_position(&self, amount_usdt: f64) -> bool {
        self.validate_allocation("", amount_usdt).is_valid
    }

    /// Get detailed position information
    pub fn get_position_details(&self, symbol: &str) -> Option<&PositionAllocation> {
        self.positions.get(symbol)
    }

    /// Calculate total portfolio value including unrealized PnL
    pub fn calculate_portfolio_value(&self) -> f64 {
        self.micro_to_usdt(self.total_capital_micro + self.realized_pnl_micro + self.unrealized_pnl_micro)
    }

/// Comprehensive capital status for monitoring and reporting
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CapitalStatus {
    /// Total capital in USDT (exactly 12.000000)
    pub total_capital_usdt: f64,
    /// Active trading capital in USDT (10.000000)
    pub active_capital_usdt: f64,
    /// Safety buffer in USDT (2.000000)
    pub safety_buffer_usdt: f64,
    /// Currently allocated capital in USDT
    pub allocated_capital_usdt: f64,
    /// Available capital for new positions in USDT
    pub available_capital_usdt: f64,
    /// Reserved capital for pending orders in USDT
    pub reserved_capital_usdt: f64,
    /// Total realized PnL in USDT
    pub realized_pnl_usdt: f64,
    /// Total unrealized PnL in USDT
    pub unrealized_pnl_usdt: f64,
    /// Total PnL (realized + unrealized) in USDT
    pub total_pnl_usdt: f64,
    /// Number of active positions
    pub active_positions: usize,
    /// Maximum allowed positions
    pub max_positions: usize,
    /// Capital utilization percentage
    pub capital_utilization_percent: f64,
    /// Detailed position information
    pub positions: HashMap<String, PositionAllocation>,
    /// Calculate optimal position size based on available capital and risk percentage
    pub fn calculate_position_size(&self, risk_percentage: f64, max_positions: usize) -> Result<f64> {
        if risk_percentage <= 0.0 || risk_percentage > 100.0 {
            return Err(anyhow!("Risk percentage must be between 0 and 100"));
        }
        
        if max_positions == 0 {
            return Err(anyhow!("Max positions must be greater than 0"));
        }
        
        // Calculate per-position allocation
        let per_position_allocation = self.available_capital_micro / max_positions as i64;
        
        // Apply risk percentage
        let risk_adjusted_allocation = (per_position_allocation as f64 * risk_percentage / 100.0) as i64;
        
        Ok(self.micro_to_usdt(risk_adjusted_allocation))
    }

    /// Deallocate capital from a closed position with realized PnL
    pub fn deallocate_capital(&mut self, symbol: &str, realized_pnl_usdt: f64) -> Result<()> {
        let position = self.positions.remove(symbol)
            .ok_or_else(|| anyhow!("Position not found for symbol: {}", symbol))?;

        let position_amount = position.allocated_micro;
        let pnl_micro = self.usdt_to_micro(realized_pnl_usdt);

        // Return the original capital plus/minus PnL
        let returned_capital = position_amount + pnl_micro;

        self.allocated_capital_micro -= position_amount;
        self.available_capital_micro += returned_capital;

        // Update total capital with PnL
        self.total_capital_micro += pnl_micro;

        info!(
            "Deallocated {:.6} USDT from {} with PnL {:.6} USDT. Total capital: {:.6} USDT",
            self.micro_to_usdt(position_amount),
            symbol,
            realized_pnl_usdt,
            self.micro_to_usdt(self.total_capital_micro)
        );

        // Verify total capital constraint
        self.verify_capital_constraint()?;

        Ok(())
    }

    /// Reserve capital for a pending order
    pub fn reserve_capital(&mut self, symbol: &str, amount_usdt: f64) -> Result<()> {
        let amount_micro = self.usdt_to_micro(amount_usdt);

        if self.available_capital_micro < amount_micro {
            return Err(anyhow!(
                "Insufficient capital to reserve: requested {:.6} USDT, available {:.6} USDT",
                amount_usdt,
                self.micro_to_usdt(self.available_capital_micro)
            ));
        }

        self.available_capital_micro -= amount_micro;
        self.reserved_capital_micro += amount_micro;

        debug!("Reserved {:.6} USDT for {}", amount_usdt, symbol);

        Ok(())
    }

    /// Release reserved capital (order cancelled or filled)
    pub fn release_reserved_capital(&mut self, amount_usdt: f64) -> Result<()> {
        let amount_micro = self.usdt_to_micro(amount_usdt);

        if self.reserved_capital_micro < amount_micro {
            return Err(anyhow!("Cannot release more capital than reserved"));
        }

        self.reserved_capital_micro -= amount_micro;
        self.available_capital_micro += amount_micro;

        debug!("Released {:.6} USDT from reserves", amount_usdt);

        Ok(())
    }


    

    
    /// Check if emergency stop should be triggered
    pub fn should_trigger_emergency_stop(&self) -> bool {
        // Trigger if total capital drops below 10 USDT (83.33% of original)
        self.total_capital_micro < 10_000_000
    }
    
    /// Get utilization percentage
    pub fn get_utilization_percentage(&self) -> f64 {
        if self.total_capital_micro == 0 {
            return 0.0;
        }
        
        (self.allocated_capital_micro as f64 / self.total_capital_micro as f64) * 100.0
    }
}



/// Comprehensive capital allocation report for mathematical validation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CapitalAllocationReport {
    pub timestamp: DateTime<Utc>,
    pub total_capital_usdt: f64,
    pub allocated_capital_usdt: f64,
    pub available_capital_usdt: f64,
    pub safety_buffer_usdt: f64,
    pub active_positions: usize,
    pub max_positions: usize,
    pub total_profit_target_usdt: f64,
    pub total_unrealized_pnl_usdt: f64,
    pub total_realized_pnl_usdt: f64,
    pub capital_utilization_percent: f64,
    pub is_constraint_valid: bool,
    /// Enhanced mathematical validation for 12 USDT constraint (public version)
    pub fn verify_capital_constraint_enhanced(&self) -> Result<()> {
        // Use the existing private method
        self.verify_capital_constraint()?;

        // Additional validations for enhanced precision
        if self.positions.len() > MAX_CONCURRENT_POSITIONS {
            return Err(anyhow!(
                "Position count violation: {} positions, maximum allowed: {}",
                self.positions.len(),
                MAX_CONCURRENT_POSITIONS
            ));
        }

        // Verify minimum trade size compliance
        for (symbol, position) in &self.positions {
            if position.allocated_micro < MIN_TRADE_SIZE_MICRO {
                return Err(anyhow!(
                    "Position size violation for {}: {:.6} USDT below minimum {:.6} USDT",
                    symbol,
                    self.micro_to_usdt(position.allocated_micro),
                    self.micro_to_usdt(MIN_TRADE_SIZE_MICRO)
                ));
            }
        }

        debug!("✅ Enhanced capital constraint verified: {:.6} USDT total, {:.6} USDT allocated, {:.6} USDT available",
               self.micro_to_usdt(TOTAL_CAPITAL_MICRO),
               self.micro_to_usdt(self.allocated_capital_micro),
               self.micro_to_usdt(self.available_capital_micro));

        Ok(())
    }

    /// Generate comprehensive capital allocation report
    pub fn generate_allocation_report(&self) -> CapitalAllocationReport {
        let total_profit_target: i64 = self.positions.values()
            .map(|p| p.profit_target_micro)
            .sum();

        let total_unrealized_pnl: i64 = self.positions.values()
            .map(|p| p.unrealized_pnl_micro)
            .sum();

        CapitalAllocationReport {
            timestamp: Utc::now(),
            total_capital_usdt: self.micro_to_usdt(TOTAL_CAPITAL_MICRO),
            allocated_capital_usdt: self.micro_to_usdt(self.allocated_capital_micro),
            available_capital_usdt: self.micro_to_usdt(self.available_capital_micro),
            safety_buffer_usdt: self.micro_to_usdt(self.safety_buffer_micro),
            active_positions: self.positions.len(),
            max_positions: MAX_CONCURRENT_POSITIONS,
            total_profit_target_usdt: self.micro_to_usdt(total_profit_target),
            total_unrealized_pnl_usdt: self.micro_to_usdt(total_unrealized_pnl),
            total_realized_pnl_usdt: self.micro_to_usdt(self.realized_pnl_micro),
            capital_utilization_percent: (self.allocated_capital_micro as f64 / ACTIVE_CAPITAL_MICRO as f64) * 100.0,
            is_constraint_valid: self.verify_capital_constraint_enhanced().is_ok(),
        }
    }

    /// Calculate optimal position size for 750+ trades/day strategy
    pub fn calculate_optimal_position_size_for_hft(&self) -> Result<f64> {
        // For 750+ trades/day with 2 max positions, each position should be exactly 5 USDT
        // This ensures we can execute rapid trades while maintaining capital constraints

        if self.positions.len() >= MAX_CONCURRENT_POSITIONS {
            return Err(anyhow!("Maximum positions reached: {}/{}", self.positions.len(), MAX_CONCURRENT_POSITIONS));
        }

        // Each position gets exactly 5 USDT for optimal capital utilization
        let optimal_size_usdt = self.micro_to_usdt(MIN_TRADE_SIZE_MICRO);

        // Verify we have sufficient capital
        if self.available_capital_micro < MIN_TRADE_SIZE_MICRO {
            return Err(anyhow!(
                "Insufficient capital for optimal position: available {:.6} USDT, required {:.6} USDT",
                self.micro_to_usdt(self.available_capital_micro),
                optimal_size_usdt
            ));
        }

        Ok(optimal_size_usdt)
    }

    /// Validate if a trade meets the 0.6 USDT profit requirement
    pub fn validate_profit_target(&self, entry_price: f64, target_price: f64, leverage: f64) -> Result<bool> {
        let price_change_percent = ((target_price - entry_price) / entry_price).abs() * 100.0;
        let position_size_usdt = self.micro_to_usdt(MIN_TRADE_SIZE_MICRO);
        let expected_profit = position_size_usdt * leverage * (price_change_percent / 100.0);
        let min_profit_required = self.micro_to_usdt(MIN_PROFIT_TARGET_MICRO);

        if expected_profit < min_profit_required {
            return Ok(false);
        }

        info!("✅ Profit target validation: {:.6} USDT expected (min: {:.6} USDT) with {:.2}% price move at {}x leverage",
              expected_profit, min_profit_required, price_change_percent, leverage);

        Ok(true)
    }

    /// Get exact capital allocation details for testing and validation
    pub fn get_exact_allocation(&self) -> CapitalAllocationReport {
        let total_profit_target: i64 = self.positions.values()
            .map(|p| p.profit_target_micro)
            .sum();

        let total_unrealized_pnl: i64 = self.positions.values()
            .map(|p| p.unrealized_pnl_micro)
            .sum();

        CapitalAllocationReport {
            timestamp: Utc::now(),
            total_capital_usdt: self.micro_to_usdt(self.total_capital_micro),
            allocated_capital_usdt: self.micro_to_usdt(self.allocated_capital_micro),
            available_capital_usdt: self.micro_to_usdt(self.available_capital_micro),
            safety_buffer_usdt: self.micro_to_usdt(self.safety_buffer_micro),
            active_positions: self.positions.len(),
            max_positions: MAX_CONCURRENT_POSITIONS,
            total_profit_target_usdt: self.micro_to_usdt(total_profit_target),
            total_unrealized_pnl_usdt: self.micro_to_usdt(total_unrealized_pnl),
            total_realized_pnl_usdt: self.micro_to_usdt(self.realized_pnl_micro),
            capital_utilization_percent: (self.allocated_capital_micro as f64 / ACTIVE_CAPITAL_MICRO as f64) * 100.0,
            is_constraint_valid: self.verify_capital_constraint().is_ok(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_precise_capital_allocation() {
        let mut tracker = PreciseCapitalTracker::new();
        
        // Test initial state
        let allocation = tracker.get_exact_allocation();
        assert_eq!(allocation.total_capital_usdt, 12.0);
        assert_eq!(allocation.allocated_capital_usdt, 0.0);
        assert!(allocation.safety_buffer_usdt > 0.0); // Safety buffer exists

        // Test allocation
        tracker.allocate_capital("BTCUSDT", 2.0).unwrap();
        let allocation = tracker.get_exact_allocation();
        assert_eq!(allocation.allocated_capital_usdt, 2.0);
        assert!(allocation.available_capital_usdt > 0.0);

        // Test deallocation with profit
        tracker.deallocate_capital("BTCUSDT", 0.5).unwrap();
        let allocation = tracker.get_exact_allocation();
        assert_eq!(allocation.total_capital_usdt, 12.5);
        assert_eq!(allocation.allocated_capital_usdt, 0.0);
    }
    
    #[test]
    fn test_capital_constraint_enforcement() {
        let mut tracker = PreciseCapitalTracker::new();
        
        // Try to allocate more than available
        let result = tracker.allocate_capital("BTCUSDT", 15.0);
        assert!(result.is_err());
        
        // Verify no state change on failed allocation
        let allocation = tracker.get_exact_allocation();
        assert_eq!(allocation.allocated_capital_usdt, 0.0);
    }
}
