use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::{AppHandle, Manager, State, Window};
use tokio::sync::Mutex;
use tracing::{info, error, warn, debug};

/// Dashboard state
pub struct DashboardState {
    /// Current capital
    pub capital: f64,
    /// Active trades
    pub active_trades: Vec<Trade>,
    /// Agent states
    pub agent_states: Vec<AgentState>,
    /// System metrics
    pub metrics: SystemMetrics,
    /// Trade history
    pub trade_history: Vec<CompletedTrade>,
}

/// Trade information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Trade {
    /// Trade ID
    pub id: String,
    /// Asset being traded
    pub asset: String,
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
    pub direction: String,
    /// When the trade was entered
    pub entry_time: chrono::DateTime<chrono::Utc>,
    /// Current P&L
    pub current_pnl: f64,
    /// Current ROI percentage
    pub current_roi: f64,
}

/// Agent state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentState {
    /// Agent name
    pub name: String,
    /// Whether the agent is active
    pub active: bool,
    /// Agent health (0-100)
    pub health: u8,
    /// Last processing time in ms
    pub last_processing_time_ms: u64,
    /// Error count
    pub error_count: u64,
    /// Last error message
    pub last_error: Option<String>,
    /// Custom status data
    pub custom_data: serde_json::Value,
}

/// System metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemMetrics {
    /// Current capital
    pub capital: f64,
    /// Initial capital
    pub initial_capital: f64,
    /// Total profit/loss
    pub total_pnl: f64,
    /// ROI percentage
    pub roi_percentage: f64,
    /// Number of trades
    pub trade_count: u64,
    /// Win rate percentage
    pub win_rate: f64,
    /// Average ROI per trade
    pub average_roi: f64,
    /// Drawdown percentage
    pub drawdown: f64,
    /// System uptime in seconds
    pub uptime: u64,
    /// Current mode
    pub mode: String,
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
    pub direction: String,
    /// When the trade was entered
    pub entry_time: chrono::DateTime<chrono::Utc>,
    /// When the trade was exited
    pub exit_time: chrono::DateTime<chrono::Utc>,
    /// Profit/loss amount
    pub pnl: f64,
    /// ROI percentage
    pub roi: f64,
    /// Trade outcome
    pub outcome: String,
}

/// Initialize the dashboard state
pub fn init_dashboard_state() -> DashboardState {
    DashboardState {
        capital: 12.0,
        active_trades: Vec::new(),
        agent_states: Vec::new(),
        metrics: SystemMetrics {
            capital: 12.0,
            initial_capital: 12.0,
            total_pnl: 0.0,
            roi_percentage: 0.0,
            trade_count: 0,
            win_rate: 0.0,
            average_roi: 0.0,
            drawdown: 0.0,
            uptime: 0,
            mode: "simulation".to_string(),
        },
        trade_history: Vec::new(),
    }
}

/// Dashboard commands
#[tauri::command]
pub async fn get_dashboard_data(state: State<'_, Arc<Mutex<DashboardState>>>) -> Result<DashboardState, String> {
    let state = state.lock().await;
    Ok(state.clone())
}

#[tauri::command]
pub async fn get_active_trades(state: State<'_, Arc<Mutex<DashboardState>>>) -> Result<Vec<Trade>, String> {
    let state = state.lock().await;
    Ok(state.active_trades.clone())
}

#[tauri::command]
pub async fn get_agent_states(state: State<'_, Arc<Mutex<DashboardState>>>) -> Result<Vec<AgentState>, String> {
    let state = state.lock().await;
    Ok(state.agent_states.clone())
}

#[tauri::command]
pub async fn get_system_metrics(state: State<'_, Arc<Mutex<DashboardState>>>) -> Result<SystemMetrics, String> {
    let state = state.lock().await;
    Ok(state.metrics.clone())
}

#[tauri::command]
pub async fn get_trade_history(state: State<'_, Arc<Mutex<DashboardState>>>) -> Result<Vec<CompletedTrade>, String> {
    let state = state.lock().await;
    Ok(state.trade_history.clone())
}

#[tauri::command]
pub async fn close_trade(trade_id: String, state: State<'_, Arc<Mutex<DashboardState>>>) -> Result<(), String> {
    let mut state = state.lock().await;
    
    // Find the trade
    let trade_index = state.active_trades.iter().position(|t| t.id == trade_id)
        .ok_or_else(|| "Trade not found".to_string())?;
    
    // In a real implementation, this would close the actual trade
    // For now, we'll just update the state
    let trade = state.active_trades.remove(trade_index);
    
    // Add to trade history
    let completed_trade = CompletedTrade {
        id: trade.id,
        asset: trade.asset,
        entry_price: trade.entry_price,
        exit_price: trade.current_price,
        position_size: trade.position_size,
        leverage: trade.leverage,
        direction: trade.direction,
        entry_time: trade.entry_time,
        exit_time: chrono::Utc::now(),
        pnl: trade.current_pnl,
        roi: trade.current_roi,
        outcome: if trade.current_pnl > 0.0 { "profit".to_string() } else { "loss".to_string() },
    };
    
    state.trade_history.push(completed_trade);
    
    // Update capital
    state.capital += trade.position_size + trade.current_pnl;
    state.metrics.capital = state.capital;
    state.metrics.total_pnl += trade.current_pnl;
    state.metrics.roi_percentage = (state.metrics.total_pnl / state.metrics.initial_capital) * 100.0;
    
    Ok(())
}

#[tauri::command]
pub async fn toggle_agent(agent_name: String, state: State<'_, Arc<Mutex<DashboardState>>>) -> Result<(), String> {
    let mut state = state.lock().await;
    
    // Find the agent
    let agent = state.agent_states.iter_mut().find(|a| a.name == agent_name)
        .ok_or_else(|| "Agent not found".to_string())?;
    
    // Toggle active state
    agent.active = !agent.active;
    
    Ok(())
}

/// Update dashboard data
pub async fn update_dashboard(app_handle: &AppHandle, dashboard_state: &Arc<Mutex<DashboardState>>) {
    // In a real implementation, this would fetch data from the trading system
    // For now, we'll just update the state with dummy data
    
    let mut state = dashboard_state.lock().await;
    
    // Update metrics
    state.metrics.uptime += 1;
    
    // Emit event to frontend
    if let Err(e) = app_handle.emit_all("dashboard-update", state.clone()) {
        error!("Failed to emit dashboard update: {}", e);
    }
}

/// Start the dashboard update loop
pub async fn start_dashboard_updates(app_handle: AppHandle, dashboard_state: Arc<Mutex<DashboardState>>) {
    info!("Starting dashboard update loop");
    
    // Update every second
    let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(1));
    
    loop {
        interval.tick().await;
        update_dashboard(&app_handle, &dashboard_state).await;
    }
}
