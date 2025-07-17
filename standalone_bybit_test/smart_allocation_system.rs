//! OMNI Smart Allocation System - Loss Prevention & Risk Management
//!
//! Implements intelligent capital allocation with risk management,
//! diversification, and loss prevention strategies for 12 USDT capital

use std::collections::HashMap;
use serde_json::Value;
use anyhow::{Result, anyhow};

#[derive(Debug, Clone)]
pub struct AssetAnalysis {
    pub symbol: String,
    pub price: f64,
    pub min_order_qty: f64,
    pub min_notional: f64,
    pub volatility_score: f64,    // 0-100 (lower = more stable)
    pub liquidity_score: f64,     // 0-100 (higher = more liquid)
    pub trend_score: f64,         // -100 to +100 (positive = uptrend)
    pub risk_score: f64,          // 0-100 (lower = safer)
    pub allocation_weight: f64,   // 0-1 (portion of capital to allocate)
}

#[derive(Debug, Clone)]
pub struct AllocationStrategy {
    pub name: String,
    pub description: String,
    pub max_risk_per_trade: f64,     // Maximum % of capital per single trade
    pub max_total_exposure: f64,     // Maximum % of total capital exposed
    pub min_diversification: usize,  // Minimum number of different assets
    pub stop_loss_percent: f64,      // Stop loss threshold
    pub take_profit_percent: f64,    // Take profit threshold
    pub rebalance_threshold: f64,    // When to rebalance portfolio
}

#[derive(Debug)]
pub struct SmartAllocator {
    pub total_capital: f64,
    pub available_capital: f64,
    pub allocated_capital: f64,
    pub strategy: AllocationStrategy,
    pub positions: HashMap<String, f64>, // symbol -> allocated amount
}

impl SmartAllocator {
    pub fn new(total_capital: f64, strategy: AllocationStrategy) -> Self {
        Self {
            total_capital,
            available_capital: total_capital,
            allocated_capital: 0.0,
            strategy,
            positions: HashMap::new(),
        }
    }

    // Conservative strategy for loss prevention (adjusted for 5 USDT minimum)
    pub fn conservative_strategy() -> AllocationStrategy {
        AllocationStrategy {
            name: "Conservative Loss Prevention (5 USDT min)".to_string(),
            description: "Minimize risk, prevent losses, meet 5 USDT minimum".to_string(),
            max_risk_per_trade: 0.50,      // Max 50% per trade (6 USDT max)
            max_total_exposure: 0.85,      // Max 85% total exposure (10.2 USDT)
            min_diversification: 2,        // At least 2 different assets (5 USDT each)
            stop_loss_percent: 3.0,        // 3% stop loss
            take_profit_percent: 8.0,      // 8% take profit
            rebalance_threshold: 0.15,     // Rebalance at 15% drift
        }
    }

    // Balanced strategy for moderate risk/reward
    pub fn balanced_strategy() -> AllocationStrategy {
        AllocationStrategy {
            name: "Balanced Growth".to_string(),
            description: "Balanced risk/reward with diversification".to_string(),
            max_risk_per_trade: 0.10,      // Max 10% per trade
            max_total_exposure: 0.80,      // Max 80% total exposure
            min_diversification: 3,        // At least 3 different assets
            stop_loss_percent: 3.0,        // 3% stop loss
            take_profit_percent: 8.0,      // 8% take profit
            rebalance_threshold: 0.15,     // Rebalance at 15% drift
        }
    }

    // Analyze asset safety and potential
    pub fn analyze_asset_risk(&self, symbol: &str, price: f64, min_notional: f64) -> AssetAnalysis {
        // Simulate risk analysis (in real implementation, use technical indicators)
        let volatility_score = match symbol {
            s if s.contains("BTC") => 30.0,      // Moderate volatility
            s if s.contains("ETH") => 35.0,      // Moderate volatility
            s if s.contains("USDT") => 15.0,     // Low volatility (stablecoin pairs)
            s if s.contains("USDC") => 15.0,     // Low volatility
            _ => 50.0,                           // Default moderate-high volatility
        };

        let liquidity_score = if min_notional < 0.01 { 90.0 } else { 70.0 };
        
        // Prefer assets with lower minimum notional (easier to manage)
        let trend_score = if min_notional < 0.005 { 20.0 } else { 0.0 };
        
        // Risk score based on volatility and liquidity
        let risk_score = volatility_score * 0.7 + (100.0 - liquidity_score) * 0.3;
        
        // Allocation weight based on risk (lower risk = higher weight)
        let weight_calc: f64 = (100.0 - risk_score) / 100.0;
        let allocation_weight = weight_calc.max(0.1).min(0.3);

        AssetAnalysis {
            symbol: symbol.to_string(),
            price,
            min_order_qty: min_notional / price,
            min_notional,
            volatility_score,
            liquidity_score,
            trend_score,
            risk_score,
            allocation_weight,
        }
    }

    // Calculate optimal allocation across multiple assets
    pub fn calculate_smart_allocation(&self, assets: &[AssetAnalysis]) -> Result<Vec<(String, f64, f64)>> {
        let mut allocations = Vec::new();
        
        // Filter assets by risk score (only use safer assets)
        let mut safe_assets: Vec<_> = assets.iter()
            .filter(|a| a.risk_score <= 60.0) // Only assets with risk score ≤ 60
            .collect();
        
        // Sort by risk score (ascending - safest first)
        safe_assets.sort_by(|a, b| a.risk_score.partial_cmp(&b.risk_score).unwrap());
        
        if safe_assets.len() < self.strategy.min_diversification {
            return Err(anyhow!("Insufficient safe assets for diversification"));
        }

        // Calculate total allocation budget
        let max_allocation = self.total_capital * self.strategy.max_total_exposure;
        let mut remaining_budget = max_allocation;
        let mut allocated_assets = 0;

        println!("\n🧠 SMART ALLOCATION ANALYSIS:");
        println!("   Strategy: {}", self.strategy.name);
        println!("   Total Capital: ${:.4}", self.total_capital);
        println!("   Max Allocation: ${:.4} ({:.1}%)", max_allocation, self.strategy.max_total_exposure * 100.0);
        println!("   Max Risk Per Trade: {:.1}%", self.strategy.max_risk_per_trade * 100.0);
        println!();

        // Allocate to safest assets first, ensuring 5 USDT minimum per trade
        for asset in safe_assets.iter().take(self.strategy.min_diversification * 2) {
            if remaining_budget <= 5.0 || allocated_assets >= 3 { break; } // Need at least 5 USDT

            // Calculate allocation for this asset (minimum 5 USDT)
            let max_per_trade = self.total_capital * self.strategy.max_risk_per_trade;
            let weight_based_allocation = max_allocation * asset.allocation_weight;

            // Ensure minimum 5 USDT order value
            let min_order_value = 5.0;
            let proposed_allocation = weight_based_allocation.min(max_per_trade).max(min_order_value);

            // Ensure we can afford this allocation
            if remaining_budget >= min_order_value {
                let final_allocation = proposed_allocation.min(remaining_budget);

                // Calculate number of positions we can open (at least 1 for 5 USDT minimum)
                let positions_possible = (final_allocation / asset.min_notional).floor().max(1.0);
                let actual_allocation = final_allocation; // Use full allocation to meet 5 USDT minimum

                if actual_allocation >= min_order_value {
                    allocations.push((
                        asset.symbol.clone(),
                        actual_allocation,
                        positions_possible
                    ));

                    remaining_budget -= actual_allocation;
                    allocated_assets += 1;

                    println!("   ✅ {}: ${:.4} ({:.1}% of capital, {:.0} positions, Risk: {:.1})",
                            asset.symbol, actual_allocation,
                            (actual_allocation / self.total_capital) * 100.0,
                            positions_possible, asset.risk_score);
                }
            }
        }

        println!();
        println!("📊 ALLOCATION SUMMARY:");
        let total_allocated: f64 = allocations.iter().map(|(_, amount, _)| amount).sum();
        println!("   Total Allocated: ${:.4} ({:.1}% of capital)", total_allocated, (total_allocated / self.total_capital) * 100.0);
        println!("   Remaining Cash: ${:.4} ({:.1}% of capital)", self.total_capital - total_allocated, ((self.total_capital - total_allocated) / self.total_capital) * 100.0);
        println!("   Assets Selected: {}", allocations.len());
        println!("   Diversification: {}✅", if allocations.len() >= self.strategy.min_diversification { "GOOD " } else { "POOR " });

        Ok(allocations)
    }

    // Risk management: Check if we should exit a position
    pub fn should_exit_position(&self, _symbol: &str, entry_price: f64, current_price: f64) -> (bool, String) {
        let price_change_percent = ((current_price - entry_price) / entry_price) * 100.0;
        
        // Stop loss check
        if price_change_percent <= -self.strategy.stop_loss_percent {
            return (true, format!("STOP LOSS: {:.2}% loss", price_change_percent.abs()));
        }
        
        // Take profit check
        if price_change_percent >= self.strategy.take_profit_percent {
            return (true, format!("TAKE PROFIT: {:.2}% gain", price_change_percent));
        }
        
        (false, "HOLD".to_string())
    }

    // Portfolio rebalancing logic
    pub fn needs_rebalancing(&self, current_allocations: &[(String, f64)]) -> bool {
        // Check if any position has drifted beyond threshold
        for (symbol, current_value) in current_allocations {
            if let Some(original_allocation) = self.positions.get(symbol) {
                let drift = (current_value - original_allocation).abs() / original_allocation;
                if drift > self.strategy.rebalance_threshold {
                    return true;
                }
            }
        }
        false
    }

    // Generate trading signals with risk management
    pub fn generate_safe_trading_signals(&self, allocations: &[(String, f64, f64)]) -> Vec<(String, String, f64, f64)> {
        let mut signals = Vec::new();
        
        println!("\n🎯 GENERATING SAFE TRADING SIGNALS:");
        
        for (symbol, allocation, positions) in allocations {
            // Use full allocation to meet 5 USDT minimum requirement
            signals.push((
                symbol.clone(),
                "Buy".to_string(),  // Bybit expects "Buy" not "BUY"
                *allocation,  // Use full allocation (already meets 5 USDT minimum)
                *positions
            ));

            println!("   📈 Buy {}: ${:.4} ({:.0} positions) - Meets 5 USDT minimum",
                    symbol, allocation, positions);
        }
        
        println!("   🛡️  Risk Management: Each trade meets 5 USDT minimum requirement");
        println!("   📊 Conservative allocation within 12 USDT capital constraint");
        
        signals
    }
}

// Risk assessment utilities
pub fn calculate_portfolio_risk(allocations: &[(String, f64, f64)], total_capital: f64) -> f64 {
    let total_allocated: f64 = allocations.iter().map(|(_, amount, _)| amount).sum();
    (total_allocated / total_capital) * 100.0
}

pub fn calculate_diversification_score(allocations: &[(String, f64, f64)]) -> f64 {
    let num_assets = allocations.len() as f64;
    (num_assets / 10.0).min(1.0) * 100.0 // Score out of 100, max at 10 assets
}
