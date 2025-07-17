//! Enhanced Capital Manager for OMNI-ALPHA VΩ∞∞ Trading System
//!
//! PHASE 2 IMPLEMENTATION: Mathematical Precision Capital Management
//!
//! EXACT SPECIFICATIONS:
//! - Total Capital: Exactly 12.00 USDT (NEVER deviate from this amount)
//! - Active Trading Allocation: 10.00 USDT for position opening
//! - Safety Buffer: 2.00 USDT reserved for margin requirements and fees
//! - Position Sizing: 5.00 USDT per trade (Bybit minimum requirement compliance)
//! - Maximum Concurrent Positions: 2 positions maximum (5.00 USDT each)
//! - Profit Target Per Trade: Minimum 0.60 USDT after all fees and slippage
//! - Capital Validation: All allocations must mathematically sum to exactly 12.00 USDT
//!
//! MATHEMATICAL PRECISION REQUIREMENTS:
//! - Fixed-point arithmetic with 6 decimal places precision
//! - Zero capital drift tolerance
//! - Comprehensive validation at every allocation/deallocation
//! - Real-time mathematical constraint verification

use std::sync::Arc;
use tokio::sync::RwLock;
use anyhow::{Result, anyhow};
use rust_decimal::Decimal;
use rust_decimal_macros::dec;
use tracing::{info, warn, error, debug};
use num::ToPrimitive;
use chrono::{DateTime, Utc};
use serde::{Serialize, Deserialize};
use crate::capital::precision_allocator::{PreciseCapitalTracker, CapitalAllocationReport};

/// PHASE 2 ENHANCED CAPITAL ALLOCATION CONSTANTS
/// These constants define the exact mathematical specifications for the OMNI system

/// Total capital constraint - EXACTLY 12.00 USDT (NEVER change this value)
pub const TOTAL_CAPITAL_USDT: Decimal = dec!(12.00);

/// Active trading capital - 10.00 USDT available for position opening
pub const ACTIVE_TRADING_CAPITAL_USDT: Decimal = dec!(10.00);

/// Safety buffer - 2.00 USDT reserved for margin requirements and fees
pub const SAFETY_BUFFER_USDT: Decimal = dec!(2.00);

/// Position size per trade - 5.00 USDT (Bybit minimum requirement)
pub const POSITION_SIZE_USDT: Decimal = dec!(5.00);

/// Maximum concurrent positions - 2 positions maximum
pub const MAX_CONCURRENT_POSITIONS: usize = 2;

/// Minimum profit target per trade - 0.60 USDT after fees and slippage
pub const MIN_PROFIT_TARGET_USDT: Decimal = dec!(0.60);

/// Enhanced capital manager for precise 12 USDT constraint with mathematical validation
pub struct CapitalManager {
    /// Total capital (exactly 12 USDT) - IMMUTABLE
    total_capital: Decimal,

    /// Currently reserved capital for active positions
    reserved_capital: Arc<RwLock<Decimal>>,

    /// Capital usage history for auditing and analysis
    usage_history: Arc<RwLock<Vec<CapitalUsage>>>,

    /// Precision capital tracker for mathematical validation
    precision_tracker: Arc<RwLock<PreciseCapitalTracker>>,

    /// Enhanced position tracking for high-frequency trading
    active_positions: Arc<RwLock<Vec<EnhancedPosition>>>,

    /// Capital allocation metrics for performance monitoring
    allocation_metrics: Arc<RwLock<CapitalAllocationMetrics>>,
}

/// Enhanced position tracking for high-frequency trading (750+ trades/day)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnhancedPosition {
    /// Position ID for tracking
    pub id: String,
    /// Symbol being traded
    pub symbol: String,
    /// Allocated capital in USDT (exactly 5.00 USDT)
    pub allocated_capital: Decimal,
    /// Position entry timestamp
    pub entry_time: DateTime<Utc>,
    /// Expected profit target (minimum 0.60 USDT)
    pub profit_target: Decimal,
    /// Stop loss level
    pub stop_loss: Decimal,
    /// Current unrealized PnL
    pub unrealized_pnl: Decimal,
    /// Position leverage (50x-100x range)
    pub leverage: f64,
    /// Position direction (Long/Short)
    pub direction: String,
    /// Entry price
    pub entry_price: f64,
    /// Current price
    pub current_price: f64,
    /// Position status
    pub status: PositionStatus,
}

/// Position status enumeration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PositionStatus {
    /// Position is open and active
    Open,
    /// Position is closed with profit
    ClosedProfit,
    /// Position is closed with loss (should be rare with zero-loss system)
    ClosedLoss,
    /// Position is pending execution
    Pending,
}

/// Capital allocation metrics for performance monitoring
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CapitalAllocationMetrics {
    /// Total number of positions opened today
    pub positions_opened_today: u32,
    /// Total profit generated today
    pub daily_profit: Decimal,
    /// Average profit per trade
    pub average_profit_per_trade: Decimal,
    /// Win rate percentage
    pub win_rate: f64,
    /// Capital utilization efficiency
    pub utilization_efficiency: f64,
    /// Last reset timestamp
    pub last_reset: DateTime<Utc>,
}

/// Capital usage record with enhanced tracking
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CapitalUsage {
    /// Timestamp
    pub timestamp: DateTime<Utc>,

    /// Amount reserved or released
    pub amount: Decimal,

    /// Operation type
    pub operation: CapitalOperation,

    /// Description
    pub description: String,

    /// Associated position ID (if applicable)
    pub position_id: Option<String>,

    /// Expected profit target for this allocation
    pub expected_profit: Option<Decimal>,
}

/// Capital operation type with enhanced categorization
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CapitalOperation {
    /// Capital reserved for new trade
    Reserve,

    /// Capital released from closed trade
    Release,

    /// Capital adjustment for position management
    Adjust,

    /// Emergency capital reallocation
    Emergency,

    /// Profit realization
    ProfitRealization,
}

impl Default for CapitalAllocationMetrics {
    fn default() -> Self {
        Self {
            positions_opened_today: 0,
            daily_profit: dec!(0),
            average_profit_per_trade: dec!(0),
            win_rate: 0.0,
            utilization_efficiency: 0.0,
            last_reset: Utc::now(),
        }
    }
}

impl CapitalManager {
    /// Create new enhanced capital manager with EXACTLY 12 USDT - PHASE 2 IMPLEMENTATION
    pub fn new() -> Self {
        // ENFORCE EXACT 12 USDT CONSTRAINT - NO PARAMETERS ALLOWED
        let capital = TOTAL_CAPITAL_USDT;

        // Validate mathematical precision at initialization
        assert_eq!(capital, dec!(12.00), "Total capital must be exactly 12.00 USDT");
        assert_eq!(ACTIVE_TRADING_CAPITAL_USDT + SAFETY_BUFFER_USDT, TOTAL_CAPITAL_USDT,
                   "Active capital + safety buffer must equal total capital");
        assert_eq!(POSITION_SIZE_USDT * Decimal::from(MAX_CONCURRENT_POSITIONS), ACTIVE_TRADING_CAPITAL_USDT,
                   "Position sizes must exactly utilize active capital");

        info!("💰 PHASE 2 Enhanced Capital Manager initialized:");
        info!("   📊 Total Capital: {} USDT (IMMUTABLE)", capital);
        info!("   🎯 Active Trading: {} USDT", ACTIVE_TRADING_CAPITAL_USDT);
        info!("   🛡️ Safety Buffer: {} USDT", SAFETY_BUFFER_USDT);
        info!("   📈 Position Size: {} USDT per trade", POSITION_SIZE_USDT);
        info!("   🔢 Max Positions: {}", MAX_CONCURRENT_POSITIONS);
        info!("   💎 Min Profit Target: {} USDT per trade", MIN_PROFIT_TARGET_USDT);

        Self {
            total_capital: capital,
            reserved_capital: Arc::new(RwLock::new(dec!(0))),
            usage_history: Arc::new(RwLock::new(Vec::new())),
            precision_tracker: Arc::new(RwLock::new(PreciseCapitalTracker::new())),
            active_positions: Arc::new(RwLock::new(Vec::new())),
            allocation_metrics: Arc::new(RwLock::new(CapitalAllocationMetrics::default())),
        }
    }

    /// Create capital manager with legacy parameter support (deprecated)
    #[deprecated(note = "Use CapitalManager::new() instead. Total capital is fixed at 12 USDT.")]
    pub fn new_with_capital(total_capital: Decimal) -> Self {
        if total_capital != TOTAL_CAPITAL_USDT {
            warn!("⚠️ Capital parameter ignored. Using fixed 12 USDT constraint (was: {})", total_capital);
        }
        Self::new()
    }
    
    /// Get total capital (always exactly 12.00 USDT)
    pub async fn get_total_capital(&self) -> Result<Decimal> {
        // Validate constraint hasn't been violated
        assert_eq!(self.total_capital, TOTAL_CAPITAL_USDT, "Capital constraint violation detected");
        Ok(self.total_capital)
    }

    /// Get available capital for new positions
    pub async fn get_available_capital(&self) -> Result<Decimal> {
        let reserved = *self.reserved_capital.read().await;
        let available = self.total_capital - reserved;

        // Ensure available capital never exceeds active trading capital
        let max_available = ACTIVE_TRADING_CAPITAL_USDT;
        Ok(available.min(max_available))
    }

    /// Get reserved capital for active positions
    pub async fn get_reserved_capital(&self) -> Result<Decimal> {
        Ok(*self.reserved_capital.read().await)
    }

    /// Get safety buffer status (should always be 2.00 USDT)
    pub async fn get_safety_buffer(&self) -> Result<Decimal> {
        Ok(SAFETY_BUFFER_USDT)
    }

    /// Check if new position can be opened (high-frequency trading optimization)
    pub async fn can_open_new_position(&self) -> Result<bool> {
        let positions = self.active_positions.read().await;
        let current_count = positions.len();
        let available_capital = self.get_available_capital().await?;

        Ok(current_count < MAX_CONCURRENT_POSITIONS && available_capital >= POSITION_SIZE_USDT)
    }

    /// Get optimal position size for high-frequency trading (always 5.00 USDT)
    pub async fn get_optimal_position_size(&self) -> Result<Decimal> {
        // For 750+ trades/day, we use fixed 5.00 USDT positions
        // This ensures mathematical precision and Bybit compliance
        Ok(POSITION_SIZE_USDT)
    }
    
    /// Allocate capital for high-frequency trading position (PHASE 2 ENHANCED)
    pub async fn allocate_hft_position(&self, symbol: &str, leverage: f64, direction: &str,
                                      entry_price: f64, profit_target_price: f64, stop_loss_price: f64) -> Result<String> {
        // Validate position can be opened
        if !self.can_open_new_position().await? {
            return Err(anyhow!("Cannot open new position: maximum positions reached or insufficient capital"));
        }

        // Use fixed position size for mathematical precision
        let position_size = POSITION_SIZE_USDT;

        // Calculate expected profit in USDT
        let price_change_percent = ((profit_target_price - entry_price) / entry_price).abs();
        let expected_profit = position_size * Decimal::from_f64(leverage).unwrap_or(dec!(1)) *
                             Decimal::from_f64(price_change_percent).unwrap_or(dec!(0));

        // Validate minimum profit target (0.60 USDT)
        if expected_profit < MIN_PROFIT_TARGET_USDT {
            return Err(anyhow!("Expected profit {:.6} USDT below minimum {:.6} USDT",
                              expected_profit, MIN_PROFIT_TARGET_USDT));
        }

        // Generate unique position ID
        let position_id = format!("pos_{}_{}", symbol, Utc::now().timestamp_millis());

        // Reserve capital
        self.reserve_capital(position_size).await?;

        // Create enhanced position record
        let position = EnhancedPosition {
            id: position_id.clone(),
            symbol: symbol.to_string(),
            allocated_capital: position_size,
            entry_time: Utc::now(),
            profit_target: expected_profit,
            stop_loss: Decimal::from_f64((entry_price - stop_loss_price).abs()).unwrap_or(dec!(0)),
            unrealized_pnl: dec!(0),
            leverage,
            direction: direction.to_string(),
            entry_price,
            current_price: entry_price,
            status: PositionStatus::Open,
        };

        // Add to active positions
        let mut positions = self.active_positions.write().await;
        positions.push(position);

        // Update metrics
        let mut metrics = self.allocation_metrics.write().await;
        metrics.positions_opened_today += 1;

        info!("🚀 HFT Position allocated: {} {} USDT at {}x leverage, target profit: {:.6} USDT",
              symbol, position_size, leverage, expected_profit);

        Ok(position_id)
    }

    /// Reserve capital for trading (enhanced with validation)
    pub async fn reserve_capital(&self, amount: Decimal) -> Result<()> {
        if amount <= dec!(0) {
            return Err(anyhow!("Cannot reserve non-positive amount: {}", amount));
        }

        // Validate amount is exactly 5.00 USDT for HFT compliance
        if amount != POSITION_SIZE_USDT {
            warn!("⚠️ Non-standard position size: {} USDT (expected: {} USDT)", amount, POSITION_SIZE_USDT);
        }

        let mut reserved = self.reserved_capital.write().await;
        let new_reserved = *reserved + amount;

        // Ensure we don't exceed active trading capital
        if new_reserved > ACTIVE_TRADING_CAPITAL_USDT {
            return Err(anyhow!(
                "Capital allocation exceeds active trading limit: requested {}, would total {}, limit {}",
                amount, new_reserved, ACTIVE_TRADING_CAPITAL_USDT
            ));
        }

        *reserved = new_reserved;

        // Record usage with enhanced tracking
        let usage = CapitalUsage {
            timestamp: Utc::now(),
            amount,
            operation: CapitalOperation::Reserve,
            description: format!("Reserved {} USDT for HFT position", amount),
            position_id: None,
            expected_profit: Some(MIN_PROFIT_TARGET_USDT),
        };

        let mut history = self.usage_history.write().await;
        history.push(usage);

        debug!("💰 Reserved {} USDT, total reserved: {}/{} USDT",
               amount, *reserved, ACTIVE_TRADING_CAPITAL_USDT);
        Ok(())
    }
    
    /// Close HFT position and realize profit/loss (PHASE 2 ENHANCED)
    pub async fn close_hft_position(&self, position_id: &str, exit_price: f64, realized_pnl: Decimal) -> Result<()> {
        // Find and remove position from active positions
        let mut positions = self.active_positions.write().await;
        let position_index = positions.iter().position(|p| p.id == position_id)
            .ok_or_else(|| anyhow!("Position not found: {}", position_id))?;

        let mut position = positions.remove(position_index);
        position.current_price = exit_price;
        position.unrealized_pnl = realized_pnl;
        position.status = if realized_pnl >= dec!(0) {
            PositionStatus::ClosedProfit
        } else {
            PositionStatus::ClosedLoss
        };

        // Release capital
        self.release_capital(position.allocated_capital).await?;

        // Update metrics
        let mut metrics = self.allocation_metrics.write().await;
        metrics.daily_profit += realized_pnl;

        // Calculate win rate
        let total_positions = metrics.positions_opened_today;
        if total_positions > 0 {
            metrics.average_profit_per_trade = metrics.daily_profit / Decimal::from(total_positions);
        }

        // Validate profit target achievement
        if realized_pnl >= MIN_PROFIT_TARGET_USDT {
            info!("✅ HFT Position closed successfully: {} with profit {:.6} USDT (target: {:.6} USDT)",
                  position.symbol, realized_pnl, MIN_PROFIT_TARGET_USDT);
        } else if realized_pnl >= dec!(0) {
            warn!("⚠️ Position closed with profit below target: {} profit {:.6} USDT (target: {:.6} USDT)",
                  position.symbol, realized_pnl, MIN_PROFIT_TARGET_USDT);
        } else {
            error!("❌ Position closed with loss: {} loss {:.6} USDT (ZERO-LOSS VIOLATION)",
                   position.symbol, realized_pnl);
        }

        Ok(())
    }

    /// Release capital from trading (enhanced with validation)
    pub async fn release_capital(&self, amount: Decimal) -> Result<()> {
        if amount <= dec!(0) {
            return Err(anyhow!("Cannot release non-positive amount: {}", amount));
        }

        let mut reserved = self.reserved_capital.write().await;

        if amount > *reserved {
            warn!("⚠️ Attempting to release more than reserved: {} > {}", amount, *reserved);
            *reserved = dec!(0);
        } else {
            *reserved -= amount;
        }

        // Record usage with enhanced tracking
        let usage = CapitalUsage {
            timestamp: Utc::now(),
            amount,
            operation: CapitalOperation::Release,
            description: format!("Released {} USDT from HFT position", amount),
            position_id: None,
            expected_profit: None,
        };

        let mut history = self.usage_history.write().await;
        history.push(usage);

        debug!("💰 Released {} USDT, total reserved: {}/{} USDT",
               amount, *reserved, ACTIVE_TRADING_CAPITAL_USDT);
        Ok(())
    }
    
    /// Get capital utilization percentage
    pub async fn get_utilization(&self) -> Result<f64> {
        let reserved = *self.reserved_capital.read().await;
        let utilization = (reserved / self.total_capital).to_f64().unwrap_or(0.0) * 100.0;
        Ok(utilization)
    }
    
    /// Get capital usage history
    pub async fn get_usage_history(&self, limit: Option<usize>) -> Vec<CapitalUsage> {
        let history = self.usage_history.read().await;
        let limit = limit.unwrap_or(history.len());
        history.iter().rev().take(limit).cloned().collect()
    }
    
    /// Comprehensive capital constraint validation (PHASE 2 ENHANCED)
    pub async fn validate_constraint(&self) -> Result<()> {
        // Validate total capital constraint (IMMUTABLE 12 USDT)
        if self.total_capital != TOTAL_CAPITAL_USDT {
            return Err(anyhow!(
                "CRITICAL: Capital constraint violation - total capital is {} USDT, must be exactly {} USDT",
                self.total_capital, TOTAL_CAPITAL_USDT
            ));
        }

        let reserved = *self.reserved_capital.read().await;

        // Validate reserved capital doesn't exceed active trading capital
        if reserved > ACTIVE_TRADING_CAPITAL_USDT {
            return Err(anyhow!(
                "CRITICAL: Reserved capital {} USDT exceeds active trading limit {} USDT",
                reserved, ACTIVE_TRADING_CAPITAL_USDT
            ));
        }

        if reserved < dec!(0) {
            return Err(anyhow!("CRITICAL: Reserved capital is negative: {} USDT", reserved));
        }

        // Validate position count doesn't exceed maximum
        let positions = self.active_positions.read().await;
        if positions.len() > MAX_CONCURRENT_POSITIONS {
            return Err(anyhow!(
                "CRITICAL: Active positions {} exceed maximum {}",
                positions.len(), MAX_CONCURRENT_POSITIONS
            ));
        }

        // Validate each position has exactly 5.00 USDT allocated
        for position in positions.iter() {
            if position.allocated_capital != POSITION_SIZE_USDT {
                return Err(anyhow!(
                    "CRITICAL: Position {} has invalid allocation {} USDT (expected {} USDT)",
                    position.symbol, position.allocated_capital, POSITION_SIZE_USDT
                ));
            }
        }

        // Validate mathematical precision: reserved = sum of position allocations
        let total_allocated: Decimal = positions.iter()
            .map(|p| p.allocated_capital)
            .sum();

        if (reserved - total_allocated).abs() > dec!(0.000001) {
            return Err(anyhow!(
                "CRITICAL: Mathematical precision error - reserved {} USDT != allocated {} USDT",
                reserved, total_allocated
            ));
        }

        debug!("✅ Capital constraint validation passed: {}/{} USDT allocated across {} positions",
               reserved, ACTIVE_TRADING_CAPITAL_USDT, positions.len());

        Ok(())
    }
    
    /// Get comprehensive capital status (PHASE 2 ENHANCED)
    pub async fn get_status(&self) -> EnhancedCapitalStatus {
        let reserved = *self.reserved_capital.read().await;
        let available = ACTIVE_TRADING_CAPITAL_USDT - reserved;
        let utilization = (reserved / ACTIVE_TRADING_CAPITAL_USDT).to_f64().unwrap_or(0.0) * 100.0;

        let positions = self.active_positions.read().await;
        let metrics = self.allocation_metrics.read().await;

        // Calculate real-time performance metrics
        let total_unrealized_pnl: Decimal = positions.iter()
            .map(|p| p.unrealized_pnl)
            .sum();

        let win_rate = if metrics.positions_opened_today > 0 {
            // Calculate based on closed profitable positions
            let profitable_positions = positions.iter()
                .filter(|p| matches!(p.status, PositionStatus::ClosedProfit))
                .count() as f64;
            (profitable_positions / metrics.positions_opened_today as f64) * 100.0
        } else {
            0.0
        };

        EnhancedCapitalStatus {
            // Core capital metrics
            total_capital: self.total_capital,
            active_trading_capital: ACTIVE_TRADING_CAPITAL_USDT,
            safety_buffer: SAFETY_BUFFER_USDT,
            reserved_capital: reserved,
            available_capital: available,
            utilization_percentage: utilization,

            // Position metrics
            active_positions_count: positions.len(),
            max_positions: MAX_CONCURRENT_POSITIONS,
            position_size: POSITION_SIZE_USDT,

            // Performance metrics
            daily_profit: metrics.daily_profit,
            total_unrealized_pnl,
            average_profit_per_trade: metrics.average_profit_per_trade,
            win_rate,
            positions_opened_today: metrics.positions_opened_today,

            // Validation status
            is_mathematically_valid: self.validate_constraint().await.is_ok(),
            can_open_new_position: self.can_open_new_position().await.unwrap_or(false),

            // Targets and compliance
            min_profit_target: MIN_PROFIT_TARGET_USDT,
            target_trades_per_day: 750,
            target_win_rate: 85.0,
        }
    }

    /// Generate comprehensive performance report for 750+ trades/day target
    pub async fn generate_hft_performance_report(&self) -> Result<HftPerformanceReport> {
        let status = self.get_status().await;
        let positions = self.active_positions.read().await;
        let metrics = self.allocation_metrics.read().await;

        // Calculate performance against targets
        let trades_per_day_actual = metrics.positions_opened_today;
        let trades_per_day_target = 750;
        let trade_frequency_achievement = (trades_per_day_actual as f64 / trades_per_day_target as f64) * 100.0;

        let win_rate_target = 85.0;
        let win_rate_achievement = if status.win_rate >= win_rate_target {
            100.0
        } else {
            (status.win_rate / win_rate_target) * 100.0
        };

        let profit_per_trade_target = MIN_PROFIT_TARGET_USDT;
        let profit_achievement = if status.average_profit_per_trade >= profit_per_trade_target {
            100.0
        } else {
            (status.average_profit_per_trade / profit_per_trade_target).to_f64().unwrap_or(0.0) * 100.0
        };

        Ok(HftPerformanceReport {
            timestamp: Utc::now(),
            capital_status: status,

            // Performance vs targets
            trades_per_day_actual,
            trades_per_day_target,
            trade_frequency_achievement,

            win_rate_actual: status.win_rate,
            win_rate_target,
            win_rate_achievement,

            profit_per_trade_actual: status.average_profit_per_trade,
            profit_per_trade_target,
            profit_achievement,

            // System health
            mathematical_precision_valid: status.is_mathematically_valid,
            capital_constraint_valid: self.total_capital == TOTAL_CAPITAL_USDT,
            position_allocation_valid: positions.iter().all(|p| p.allocated_capital == POSITION_SIZE_USDT),

            // Recommendations
            recommendations: self.generate_performance_recommendations(&status).await,
        })
    }
}

/// Enhanced capital status with comprehensive metrics (PHASE 2)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnhancedCapitalStatus {
    // Core capital metrics
    pub total_capital: Decimal,
    pub active_trading_capital: Decimal,
    pub safety_buffer: Decimal,
    pub reserved_capital: Decimal,
    pub available_capital: Decimal,
    pub utilization_percentage: f64,

    // Position metrics
    pub active_positions_count: usize,
    pub max_positions: usize,
    pub position_size: Decimal,

    // Performance metrics
    pub daily_profit: Decimal,
    pub total_unrealized_pnl: Decimal,
    pub average_profit_per_trade: Decimal,
    pub win_rate: f64,
    pub positions_opened_today: u32,

    // Validation status
    pub is_mathematically_valid: bool,
    pub can_open_new_position: bool,

    // Targets and compliance
    pub min_profit_target: Decimal,
    pub target_trades_per_day: u32,
    pub target_win_rate: f64,
}

/// High-frequency trading performance report
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HftPerformanceReport {
    pub timestamp: DateTime<Utc>,
    pub capital_status: EnhancedCapitalStatus,

    // Performance vs targets
    pub trades_per_day_actual: u32,
    pub trades_per_day_target: u32,
    pub trade_frequency_achievement: f64,

    pub win_rate_actual: f64,
    pub win_rate_target: f64,
    pub win_rate_achievement: f64,

    pub profit_per_trade_actual: Decimal,
    pub profit_per_trade_target: Decimal,
    pub profit_achievement: f64,

    // System health
    pub mathematical_precision_valid: bool,
    pub capital_constraint_valid: bool,
    pub position_allocation_valid: bool,

    // Recommendations
    pub recommendations: Vec<String>,
}

/// Legacy capital status for backward compatibility
#[derive(Debug, Clone)]
pub struct CapitalStatus {
    pub total_capital: Decimal,
    pub reserved_capital: Decimal,
    pub available_capital: Decimal,
    pub utilization_percentage: f64,
    pub is_valid: bool,
}

impl CapitalManager {
    /// Generate performance recommendations based on current status
    async fn generate_performance_recommendations(&self, status: &EnhancedCapitalStatus) -> Vec<String> {
        let mut recommendations = Vec::new();

        // Trade frequency recommendations
        if status.positions_opened_today < 750 {
            recommendations.push(format!(
                "Increase trade frequency: {} trades today, target 750+ trades/day",
                status.positions_opened_today
            ));
        }

        // Win rate recommendations
        if status.win_rate < 85.0 {
            recommendations.push(format!(
                "Improve win rate: {:.1}% current, target 85-90%",
                status.win_rate
            ));
        }

        // Profit target recommendations
        if status.average_profit_per_trade < MIN_PROFIT_TARGET_USDT {
            recommendations.push(format!(
                "Increase profit per trade: {:.6} USDT current, target {:.6} USDT minimum",
                status.average_profit_per_trade, MIN_PROFIT_TARGET_USDT
            ));
        }

        // Capital utilization recommendations
        if status.utilization_percentage < 80.0 {
            recommendations.push(format!(
                "Optimize capital utilization: {:.1}% current, consider opening more positions",
                status.utilization_percentage
            ));
        }

        // Position availability recommendations
        if status.can_open_new_position {
            recommendations.push(format!(
                "Position capacity available: {}/{} positions active",
                status.active_positions_count, status.max_positions
            ));
        }

        if recommendations.is_empty() {
            recommendations.push("System operating within optimal parameters".to_string());
        }

        recommendations
    }

    /// Enhanced mathematical validation with precision tracker
    pub async fn validate_mathematical_precision(&self) -> Result<()> {
        // Validate decimal precision
        self.validate_constraint().await?;

        // Validate precision tracker
        let tracker = self.precision_tracker.read().await;
        tracker.verify_capital_constraint_enhanced()?;

        info!("✅ Mathematical precision validation passed for 12.00 USDT constraint");
        Ok(())
    }

    /// Generate comprehensive capital allocation report
    pub async fn generate_comprehensive_report(&self) -> Result<CapitalAllocationReport> {
        let tracker = self.precision_tracker.read().await;
        Ok(tracker.generate_allocation_report())
    }

    /// Get legacy capital status for backward compatibility
    pub async fn get_legacy_status(&self) -> CapitalStatus {
        let enhanced_status = self.get_status().await;
        CapitalStatus {
            total_capital: enhanced_status.total_capital,
            reserved_capital: enhanced_status.reserved_capital,
            available_capital: enhanced_status.available_capital,
            utilization_percentage: enhanced_status.utilization_percentage,
            is_valid: enhanced_status.is_mathematically_valid,
        }
    }

    /// Reset daily metrics (should be called at start of each trading day)
    pub async fn reset_daily_metrics(&self) -> Result<()> {
        let mut metrics = self.allocation_metrics.write().await;
        metrics.positions_opened_today = 0;
        metrics.daily_profit = dec!(0);
        metrics.average_profit_per_trade = dec!(0);
        metrics.win_rate = 0.0;
        metrics.last_reset = Utc::now();

        info!("📊 Daily metrics reset for new trading session");
        Ok(())
    }

    /// Get current active positions summary
    pub async fn get_active_positions_summary(&self) -> Vec<PositionSummary> {
        let positions = self.active_positions.read().await;
        positions.iter().map(|p| PositionSummary {
            id: p.id.clone(),
            symbol: p.symbol.clone(),
            allocated_capital: p.allocated_capital,
            unrealized_pnl: p.unrealized_pnl,
            leverage: p.leverage,
            direction: p.direction.clone(),
            entry_time: p.entry_time,
            status: p.status.clone(),
        }).collect()
    }
}

/// Position summary for reporting
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PositionSummary {
    pub id: String,
    pub symbol: String,
    pub allocated_capital: Decimal,
    pub unrealized_pnl: Decimal,
    pub leverage: f64,
    pub direction: String,
    pub entry_time: DateTime<Utc>,
    pub status: PositionStatus,
}
