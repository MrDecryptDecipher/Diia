use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use chrono::{DateTime, Utc};

/// The StateMachine manages the lifecycle of trades and system state
pub struct StateMachine {
    /// Current system state
    system_state: SystemState,
    /// Active trades
    active_trades: HashMap<String, TradeState>,
    /// Trade history
    trade_history: Vec<CompletedTrade>,
    /// State transition history
    state_history: Vec<StateTransition>,
}

/// System state
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SystemState {
    /// System is initializing
    Initializing,
    /// System is ready for trading
    Ready,
    /// System is actively trading
    Trading,
    /// System is paused (no new trades, existing trades continue)
    Paused,
    /// System is in emergency mode (closing positions, no new trades)
    Emergency,
    /// System is shutting down
    ShuttingDown,
}

/// Trade state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TradeState {
    /// Trade ID
    pub id: String,
    /// Asset being traded
    pub asset: String,
    /// Current state of the trade
    pub state: TradeLifecycleState,
    /// Entry price
    pub entry_price: f64,
    /// Current price
    pub current_price: f64,
    /// Stop loss price
    pub stop_loss: f64,
    /// Take profit price
    pub take_profit: f64,
    /// Position size in USDT
    pub position_size: f64,
    /// Leverage used
    pub leverage: f64,
    /// Direction of the trade
    pub direction: TradeDirection,
    /// When the trade was entered
    pub entry_time: DateTime<Utc>,
    /// Current P&L
    pub current_pnl: f64,
    /// Current ROI percentage
    pub current_roi: f64,
    /// Agents that contributed to this trade
    pub contributing_agents: Vec<String>,
    /// Trade metadata
    pub metadata: HashMap<String, serde_json::Value>,
}

/// Trade lifecycle state
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TradeLifecycleState {
    /// Trade is pending entry
    PendingEntry,
    /// Trade entry has been submitted
    EntrySubmitted,
    /// Trade is active
    Active,
    /// Trade is pending exit
    PendingExit,
    /// Trade exit has been submitted
    ExitSubmitted,
    /// Trade has completed
    Completed(TradeOutcome),
}

/// Trade direction
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum TradeDirection {
    Long,
    Short,
}

/// Trade outcome
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TradeOutcome {
    TakeProfitHit(f64),  // ROI achieved
    StopLossHit(f64),    // Loss incurred
    ManualClose(f64),    // Manually closed with ROI
    Expired(f64),        // Time expired with ROI
    Aborted(String),     // Aborted with reason
}

/// Completed trade
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompletedTrade {
    /// Trade ID
    pub id: String,
    /// Asset traded
    pub asset: String,
    /// Entry price
    pub entry_price: f64,
    /// Exit price
    pub exit_price: f64,
    /// Position size in USDT
    pub position_size: f64,
    /// Leverage used
    pub leverage: f64,
    /// Direction of the trade
    pub direction: TradeDirection,
    /// When the trade was entered
    pub entry_time: DateTime<Utc>,
    /// When the trade was exited
    pub exit_time: DateTime<Utc>,
    /// Profit/loss amount
    pub pnl: f64,
    /// ROI percentage
    pub roi: f64,
    /// Trade outcome
    pub outcome: TradeOutcome,
    /// Agents that contributed to this trade
    pub contributing_agents: Vec<String>,
    /// Trade metadata
    pub metadata: HashMap<String, serde_json::Value>,
}

/// State transition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StateTransition {
    /// Transition ID
    pub id: String,
    /// Entity ID (trade ID or "system")
    pub entity_id: String,
    /// Previous state
    pub from_state: String,
    /// New state
    pub to_state: String,
    /// When the transition occurred
    pub timestamp: DateTime<Utc>,
    /// Reason for the transition
    pub reason: String,
    /// Transition metadata
    pub metadata: HashMap<String, serde_json::Value>,
}

impl StateMachine {
    /// Create a new StateMachine
    pub fn new() -> Self {
        Self {
            system_state: SystemState::Initializing,
            active_trades: HashMap::new(),
            trade_history: Vec::new(),
            state_history: Vec::new(),
        }
    }
    
    /// Get the current system state
    pub fn system_state(&self) -> &SystemState {
        &self.system_state
    }
    
    /// Set the system state
    pub fn set_system_state(&mut self, state: SystemState, reason: &str) {
        let from_state = self.system_state.clone();
        self.system_state = state.clone();
        
        // Record the transition
        self.state_history.push(StateTransition {
            id: format!("sys-{}", Utc::now().timestamp_millis()),
            entity_id: "system".to_string(),
            from_state: format!("{:?}", from_state),
            to_state: format!("{:?}", state),
            timestamp: Utc::now(),
            reason: reason.to_string(),
            metadata: HashMap::new(),
        });
    }
    
    /// Get an active trade by ID
    pub fn get_trade(&self, trade_id: &str) -> Option<&TradeState> {
        self.active_trades.get(trade_id)
    }
    
    /// Get a mutable reference to an active trade
    pub fn get_trade_mut(&mut self, trade_id: &str) -> Option<&mut TradeState> {
        self.active_trades.get_mut(trade_id)
    }
    
    /// Get all active trades
    pub fn active_trades(&self) -> &HashMap<String, TradeState> {
        &self.active_trades
    }
    
    /// Get trade history
    pub fn trade_history(&self) -> &Vec<CompletedTrade> {
        &self.trade_history
    }
    
    /// Add a new trade
    pub fn add_trade(&mut self, trade: TradeState) -> anyhow::Result<()> {
        // Check if system is in a state that allows new trades
        if self.system_state != SystemState::Trading {
            return Err(anyhow::anyhow!("Cannot add trade: system is not in Trading state"));
        }
        
        let trade_id = trade.id.clone();
        
        // Record the transition
        self.state_history.push(StateTransition {
            id: format!("trade-{}", Utc::now().timestamp_millis()),
            entity_id: trade_id.clone(),
            from_state: "None".to_string(),
            to_state: format!("{:?}", trade.state),
            timestamp: Utc::now(),
            reason: "New trade created".to_string(),
            metadata: HashMap::new(),
        });
        
        // Add the trade
        self.active_trades.insert(trade_id, trade);
        
        Ok(())
    }
    
    /// Update a trade's state
    pub fn update_trade_state(&mut self, trade_id: &str, state: TradeLifecycleState, reason: &str) -> anyhow::Result<()> {
        let trade = self.active_trades.get_mut(trade_id)
            .ok_or_else(|| anyhow::anyhow!("Trade not found: {}", trade_id))?;
        
        let from_state = trade.state.clone();
        trade.state = state.clone();
        
        // Record the transition
        self.state_history.push(StateTransition {
            id: format!("trade-{}", Utc::now().timestamp_millis()),
            entity_id: trade_id.to_string(),
            from_state: format!("{:?}", from_state),
            to_state: format!("{:?}", state),
            timestamp: Utc::now(),
            reason: reason.to_string(),
            metadata: HashMap::new(),
        });
        
        // If the trade is completed, move it to history
        if let TradeLifecycleState::Completed(outcome) = &state {
            if let Some(trade) = self.active_trades.remove(trade_id) {
                let completed_trade = CompletedTrade {
                    id: trade.id,
                    asset: trade.asset,
                    entry_price: trade.entry_price,
                    exit_price: trade.current_price,
                    position_size: trade.position_size,
                    leverage: trade.leverage,
                    direction: trade.direction,
                    entry_time: trade.entry_time,
                    exit_time: Utc::now(),
                    pnl: trade.current_pnl,
                    roi: trade.current_roi,
                    outcome: outcome.clone(),
                    contributing_agents: trade.contributing_agents,
                    metadata: trade.metadata,
                };
                
                self.trade_history.push(completed_trade);
            }
        }
        
        Ok(())
    }
    
    /// Update a trade's current price and P&L
    pub fn update_trade_price(&mut self, trade_id: &str, price: f64) -> anyhow::Result<()> {
        let trade = self.active_trades.get_mut(trade_id)
            .ok_or_else(|| anyhow::anyhow!("Trade not found: {}", trade_id))?;
        
        trade.current_price = price;
        
        // Calculate P&L
        let price_diff = match trade.direction {
            TradeDirection::Long => price - trade.entry_price,
            TradeDirection::Short => trade.entry_price - price,
        };
        let pnl = price_diff * trade.position_size * trade.leverage / trade.entry_price;
        trade.current_pnl = pnl;
        trade.current_roi = pnl / trade.position_size * 100.0;
        
        // Check if take profit or stop loss has been hit
        if trade.state == TradeLifecycleState::Active {
            if (trade.direction == TradeDirection::Long && price >= trade.take_profit) ||
               (trade.direction == TradeDirection::Short && price <= trade.take_profit) {
                self.update_trade_state(
                    trade_id,
                    TradeLifecycleState::Completed(TradeOutcome::TakeProfitHit(trade.current_roi)),
                    "Take profit hit"
                )?;
            } else if (trade.direction == TradeDirection::Long && price <= trade.stop_loss) ||
                      (trade.direction == TradeDirection::Short && price >= trade.stop_loss) {
                self.update_trade_state(
                    trade_id,
                    TradeLifecycleState::Completed(TradeOutcome::StopLossHit(trade.current_roi)),
                    "Stop loss hit"
                )?;
            }
        }
        
        Ok(())
    }
    
    /// Close a trade manually
    pub fn close_trade(&mut self, trade_id: &str, reason: &str) -> anyhow::Result<()> {
        let trade = self.active_trades.get(trade_id)
            .ok_or_else(|| anyhow::anyhow!("Trade not found: {}", trade_id))?;
        
        let roi = trade.current_roi;
        
        self.update_trade_state(
            trade_id,
            TradeLifecycleState::Completed(TradeOutcome::ManualClose(roi)),
            reason
        )
    }
    
    /// Abort a trade
    pub fn abort_trade(&mut self, trade_id: &str, reason: &str) -> anyhow::Result<()> {
        let trade = self.active_trades.get(trade_id)
            .ok_or_else(|| anyhow::anyhow!("Trade not found: {}", trade_id))?;
        
        let roi = trade.current_roi;
        
        self.update_trade_state(
            trade_id,
            TradeLifecycleState::Completed(TradeOutcome::Aborted(reason.to_string())),
            reason
        )
    }
    
    /// Close all active trades
    pub fn close_all_trades(&mut self, reason: &str) -> anyhow::Result<()> {
        let trade_ids: Vec<String> = self.active_trades.keys().cloned().collect();
        
        for trade_id in trade_ids {
            let _ = self.close_trade(&trade_id, reason);
        }
        
        Ok(())
    }
    
    /// Get state transition history
    pub fn state_history(&self) -> &Vec<StateTransition> {
        &self.state_history
    }
    
    /// Calculate system performance metrics
    pub fn calculate_performance(&self) -> PerformanceMetrics {
        let mut total_trades = self.trade_history.len();
        let mut winning_trades = 0;
        let mut losing_trades = 0;
        let mut total_profit = 0.0;
        let mut total_loss = 0.0;
        let mut largest_win = 0.0;
        let mut largest_loss = 0.0;
        
        for trade in &self.trade_history {
            if trade.pnl > 0.0 {
                winning_trades += 1;
                total_profit += trade.pnl;
                largest_win = largest_win.max(trade.pnl);
            } else {
                losing_trades += 1;
                total_loss += trade.pnl.abs();
                largest_loss = largest_loss.max(trade.pnl.abs());
            }
        }
        
        let win_rate = if total_trades > 0 {
            winning_trades as f64 / total_trades as f64 * 100.0
        } else {
            0.0
        };
        
        let profit_factor = if total_loss > 0.0 {
            total_profit / total_loss
        } else {
            f64::INFINITY
        };
        
        let average_win = if winning_trades > 0 {
            total_profit / winning_trades as f64
        } else {
            0.0
        };
        
        let average_loss = if losing_trades > 0 {
            total_loss / losing_trades as f64
        } else {
            0.0
        };
        
        PerformanceMetrics {
            total_trades,
            winning_trades,
            losing_trades,
            win_rate,
            total_profit,
            total_loss,
            net_profit: total_profit - total_loss,
            profit_factor,
            average_win,
            average_loss,
            largest_win,
            largest_loss,
        }
    }
}

/// Performance metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceMetrics {
    /// Total number of trades
    pub total_trades: usize,
    /// Number of winning trades
    pub winning_trades: usize,
    /// Number of losing trades
    pub losing_trades: usize,
    /// Win rate percentage
    pub win_rate: f64,
    /// Total profit
    pub total_profit: f64,
    /// Total loss
    pub total_loss: f64,
    /// Net profit
    pub net_profit: f64,
    /// Profit factor (total_profit / total_loss)
    pub profit_factor: f64,
    /// Average win
    pub average_win: f64,
    /// Average loss
    pub average_loss: f64,
    /// Largest win
    pub largest_win: f64,
    /// Largest loss
    pub largest_loss: f64,
}
