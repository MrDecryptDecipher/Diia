//! Trade View
//!
//! This module provides the trade view UI for the OMNI-ALPHA VΩ∞∞ platform.

use std::collections::HashMap;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::trading_system::{Trade, TradeStatus};
use crate::engine::message_bus::TradeDirection;

/// Trade view mode
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum TradeViewMode {
    /// List view
    List,
    
    /// Grid view
    Grid,
    
    /// Chart view
    Chart,
    
    /// Detail view
    Detail,
}

/// Trade view
pub struct TradeView {
    /// Current view mode
    mode: TradeViewMode,
    
    /// Selected trade ID
    selected_trade_id: Option<String>,
    
    /// Active trades
    active_trades: Vec<Trade>,
    
    /// Trade history
    trade_history: Vec<Trade>,
    
    /// Trade filters
    filters: HashMap<String, String>,
    
    /// Sort field
    sort_field: String,
    
    /// Sort ascending
    sort_ascending: bool,
}

impl TradeView {
    /// Create a new trade view
    pub fn new() -> Self {
        Self {
            mode: TradeViewMode::List,
            selected_trade_id: None,
            active_trades: Vec::new(),
            trade_history: Vec::new(),
            filters: HashMap::new(),
            sort_field: "entry_time".to_string(),
            sort_ascending: false,
        }
    }
    
    /// Update trade view
    pub fn update(&mut self, active_trades: Vec<Trade>, trade_history: Vec<Trade>) {
        self.active_trades = active_trades;
        self.trade_history = trade_history;
    }
    
    /// Set view mode
    pub fn set_mode(&mut self, mode: TradeViewMode) {
        self.mode = mode;
    }
    
    /// Get view mode
    pub fn get_mode(&self) -> TradeViewMode {
        self.mode
    }
    
    /// Set selected trade
    pub fn set_selected_trade(&mut self, trade_id: Option<String>) {
        self.selected_trade_id = trade_id;
    }
    
    /// Get selected trade
    pub fn get_selected_trade(&self) -> Option<&Trade> {
        if let Some(trade_id) = &self.selected_trade_id {
            // Check active trades
            for trade in &self.active_trades {
                if trade.id == *trade_id {
                    return Some(trade);
                }
            }
            
            // Check trade history
            for trade in &self.trade_history {
                if trade.id == *trade_id {
                    return Some(trade);
                }
            }
        }
        
        None
    }
    
    /// Add filter
    pub fn add_filter(&mut self, key: &str, value: &str) {
        self.filters.insert(key.to_string(), value.to_string());
    }
    
    /// Remove filter
    pub fn remove_filter(&mut self, key: &str) {
        self.filters.remove(key);
    }
    
    /// Clear filters
    pub fn clear_filters(&mut self) {
        self.filters.clear();
    }
    
    /// Set sort
    pub fn set_sort(&mut self, field: &str, ascending: bool) {
        self.sort_field = field.to_string();
        self.sort_ascending = ascending;
    }
    
    /// Get filtered trades
    pub fn get_filtered_trades(&self) -> Vec<&Trade> {
        let mut trades = Vec::new();
        
        // Add active trades
        for trade in &self.active_trades {
            if self.matches_filters(trade) {
                trades.push(trade);
            }
        }
        
        // Add trade history
        for trade in &self.trade_history {
            if self.matches_filters(trade) {
                trades.push(trade);
            }
        }
        
        // Sort trades
        self.sort_trades(&mut trades);
        
        trades
    }
    
    /// Check if trade matches filters
    fn matches_filters(&self, trade: &Trade) -> bool {
        for (key, value) in &self.filters {
            match key.as_str() {
                "symbol" => {
                    if !trade.symbol.contains(value) {
                        return false;
                    }
                },
                "direction" => {
                    let direction_str = match trade.direction {
                        TradeDirection::Long => "long",
                        TradeDirection::Short => "short",
                        _ => "neutral",
                    };
                    
                    if direction_str != value.to_lowercase() {
                        return false;
                    }
                },
                "status" => {
                    let status_str = match trade.status {
                        TradeStatus::Pending => "pending",
                        TradeStatus::Open => "open",
                        TradeStatus::Closed => "closed",
                        TradeStatus::Canceled => "canceled",
                        TradeStatus::Failed => "failed",
                    };
                    
                    if status_str != value.to_lowercase() {
                        return false;
                    }
                },
                "source" => {
                    if !trade.source.contains(value) {
                        return false;
                    }
                },
                "tag" => {
                    if !trade.tags.iter().any(|tag| tag.contains(value)) {
                        return false;
                    }
                },
                "min_pnl" => {
                    if let Ok(min_pnl) = value.parse::<f64>() {
                        let pnl = trade.realized_pnl.unwrap_or(trade.unrealized_pnl);
                        if pnl < min_pnl {
                            return false;
                        }
                    }
                },
                "max_pnl" => {
                    if let Ok(max_pnl) = value.parse::<f64>() {
                        let pnl = trade.realized_pnl.unwrap_or(trade.unrealized_pnl);
                        if pnl > max_pnl {
                            return false;
                        }
                    }
                },
                "min_roi" => {
                    if let Ok(min_roi) = value.parse::<f64>() {
                        if let Some(roi) = trade.roi {
                            if roi < min_roi {
                                return false;
                            }
                        } else {
                            return false;
                        }
                    }
                },
                "max_roi" => {
                    if let Ok(max_roi) = value.parse::<f64>() {
                        if let Some(roi) = trade.roi {
                            if roi > max_roi {
                                return false;
                            }
                        }
                    }
                },
                _ => {},
            }
        }
        
        true
    }
    
    /// Sort trades
    fn sort_trades<'a>(&self, trades: &mut Vec<&'a Trade>) {
        match self.sort_field.as_str() {
            "id" => {
                trades.sort_by(|a, b| {
                    if self.sort_ascending {
                        a.id.cmp(&b.id)
                    } else {
                        b.id.cmp(&a.id)
                    }
                });
            },
            "symbol" => {
                trades.sort_by(|a, b| {
                    if self.sort_ascending {
                        a.symbol.cmp(&b.symbol)
                    } else {
                        b.symbol.cmp(&a.symbol)
                    }
                });
            },
            "entry_time" => {
                trades.sort_by(|a, b| {
                    if self.sort_ascending {
                        a.entry_time.cmp(&b.entry_time)
                    } else {
                        b.entry_time.cmp(&a.entry_time)
                    }
                });
            },
            "exit_time" => {
                trades.sort_by(|a, b| {
                    match (a.exit_time, b.exit_time) {
                        (Some(a_time), Some(b_time)) => {
                            if self.sort_ascending {
                                a_time.cmp(&b_time)
                            } else {
                                b_time.cmp(&a_time)
                            }
                        },
                        (Some(_), None) => std::cmp::Ordering::Less,
                        (None, Some(_)) => std::cmp::Ordering::Greater,
                        (None, None) => std::cmp::Ordering::Equal,
                    }
                });
            },
            "pnl" => {
                trades.sort_by(|a, b| {
                    let a_pnl = a.realized_pnl.unwrap_or(a.unrealized_pnl);
                    let b_pnl = b.realized_pnl.unwrap_or(b.unrealized_pnl);
                    
                    if self.sort_ascending {
                        a_pnl.partial_cmp(&b_pnl).unwrap_or(std::cmp::Ordering::Equal)
                    } else {
                        b_pnl.partial_cmp(&a_pnl).unwrap_or(std::cmp::Ordering::Equal)
                    }
                });
            },
            "roi" => {
                trades.sort_by(|a, b| {
                    match (a.roi, b.roi) {
                        (Some(a_roi), Some(b_roi)) => {
                            if self.sort_ascending {
                                a_roi.partial_cmp(&b_roi).unwrap_or(std::cmp::Ordering::Equal)
                            } else {
                                b_roi.partial_cmp(&a_roi).unwrap_or(std::cmp::Ordering::Equal)
                            }
                        },
                        (Some(_), None) => std::cmp::Ordering::Less,
                        (None, Some(_)) => std::cmp::Ordering::Greater,
                        (None, None) => std::cmp::Ordering::Equal,
                    }
                });
            },
            "direction" => {
                trades.sort_by(|a, b| {
                    if self.sort_ascending {
                        format!("{:?}", a.direction).cmp(&format!("{:?}", b.direction))
                    } else {
                        format!("{:?}", b.direction).cmp(&format!("{:?}", a.direction))
                    }
                });
            },
            "status" => {
                trades.sort_by(|a, b| {
                    if self.sort_ascending {
                        format!("{:?}", a.status).cmp(&format!("{:?}", b.status))
                    } else {
                        format!("{:?}", b.status).cmp(&format!("{:?}", a.status))
                    }
                });
            },
            "source" => {
                trades.sort_by(|a, b| {
                    if self.sort_ascending {
                        a.source.cmp(&b.source)
                    } else {
                        b.source.cmp(&a.source)
                    }
                });
            },
            _ => {
                // Default sort by entry time
                trades.sort_by(|a, b| {
                    if self.sort_ascending {
                        a.entry_time.cmp(&b.entry_time)
                    } else {
                        b.entry_time.cmp(&a.entry_time)
                    }
                });
            },
        }
    }
    
    /// Get active trades
    pub fn get_active_trades(&self) -> &[Trade] {
        &self.active_trades
    }
    
    /// Get trade history
    pub fn get_trade_history(&self) -> &[Trade] {
        &self.trade_history
    }
    
    /// Get filters
    pub fn get_filters(&self) -> &HashMap<String, String> {
        &self.filters
    }
    
    /// Get sort field
    pub fn get_sort_field(&self) -> &str {
        &self.sort_field
    }
    
    /// Get sort ascending
    pub fn is_sort_ascending(&self) -> bool {
        self.sort_ascending
    }
}
