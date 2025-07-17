//! Main Trading Strategy Controller
//!
//! This module acts as the primary controller for the OMNI trading system.
//! It coordinates all trading decisions and commands the high frequency trader
//! to execute trades based on comprehensive analysis from all OMNI components.

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{Mutex, RwLock};
use tokio::time::{sleep, Duration, Instant};
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use anyhow::Result;
use tracing::{info, debug, warn, error};
use uuid::Uuid;

use crate::engine::message_bus::{MessageBus, BusMessage, MessageType, TradeDirection};
use crate::agents::agent_coordinator::{AgentCoordinator, TradingDecision, DecisionType};
use crate::agents::high_frequency_trader::{HighFrequencyTrader, HighFrequencyTraderConfig};
use crate::agents::zero_loss_enforcer::{ZeroLossEnforcer, ZeroLossEnforcerConfig};
use crate::agents::asset_scanner_agent::{AssetScannerAgent, AssetScannerConfig};
use crate::agents::quantum_predictor::{QuantumPredictor, QuantumPrediction};
use crate::agents::hyperdimensional_pattern_recognizer::{HyperdimensionalPatternRecognizer, PatternRecognition};
use crate::agents::trade_executor::ExecutionStatus;
use crate::strategy::advanced_multi_factor_strategy::{AdvancedMultiFactorStrategy, StrategyConfig, MultiFactorAnalysis};
use crate::quantum::spectral_tree_engine::SpectralTreeEngine;
use crate::quantum::hyperdimensional_computing::HyperdimensionalComputing;
use crate::exchange::bybit::adapter::BybitAdapter;

/// Trading command sent to execution components
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TradingCommand {
    /// Command ID
    pub id: String,
    
    /// Command type
    pub command_type: CommandType,
    
    /// Target symbol
    pub symbol: String,
    
    /// Trade direction
    pub direction: TradeDirection,
    
    /// Entry price
    pub entry_price: f64,
    
    /// Stop loss price
    pub stop_loss: f64,
    
    /// Take profit price
    pub take_profit: f64,
    
    /// Position size in USDT
    pub position_size: f64,
    
    /// Leverage
    pub leverage: f64,
    
    /// Confidence level (0-100)
    pub confidence: f64,
    
    /// Priority (1-10, 10 being highest)
    pub priority: u8,
    
    /// Timestamp
    pub timestamp: DateTime<Utc>,
    
    /// Analysis data supporting the command
    pub analysis: TradingDecision,
}

/// Command type
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CommandType {
    /// Execute trade immediately
    ExecuteTrade,
    
    /// Monitor for entry opportunity
    MonitorEntry,
    
    /// Close position
    ClosePosition,
    
    /// Update stop loss
    UpdateStopLoss,
    
    /// Update take profit
    UpdateTakeProfit,
    
    /// Cancel pending order
    CancelOrder,
    
    /// Emergency stop all trading
    EmergencyStop,
}

/// Main Strategy Controller Configuration
#[derive(Debug, Clone)]
pub struct MainStrategyControllerConfig {
    /// Total capital in USDT
    pub total_capital: f64,
    
    /// Safety buffer in USDT
    pub safety_buffer: f64,
    
    /// Maximum concurrent positions
    pub max_positions: u32,
    
    /// Position size per trade in USDT
    pub position_size: f64,
    
    /// Target trades per day
    pub target_trades_per_day: u32,
    
    /// Minimum confidence for trade execution
    pub min_confidence: f64,
    
    /// Maximum leverage
    pub max_leverage: f64,
    
    /// Analysis interval in seconds
    pub analysis_interval: u64,
    
    /// Command timeout in seconds
    pub command_timeout: u64,
}

impl Default for MainStrategyControllerConfig {
    fn default() -> Self {
        Self {
            total_capital: 12.0,
            safety_buffer: 2.0,
            max_positions: 2,
            position_size: 5.0,
            target_trades_per_day: 750,
            min_confidence: 85.0,
            max_leverage: 100.0,
            analysis_interval: 5, // Analyze every 5 seconds
            command_timeout: 30,  // Commands timeout after 30 seconds
        }
    }
}

/// Main Trading Strategy Controller
/// 
/// This is the primary controller that coordinates all OMNI components
/// and sends commands to the high frequency trader for execution.
pub struct MainStrategyController {
    /// Configuration
    config: MainStrategyControllerConfig,
    
    /// Agent coordinator for comprehensive analysis
    agent_coordinator: AgentCoordinator,
    
    /// Asset scanner for market opportunities
    asset_scanner: AssetScannerAgent,
    
    /// Advanced multi-factor strategy
    strategy: AdvancedMultiFactorStrategy,
    
    /// Quantum components
    quantum_predictor: QuantumPredictor,
    pattern_recognizer: HyperdimensionalPatternRecognizer,
    spectral_engine: SpectralTreeEngine,
    hyperdimensional_engine: HyperdimensionalComputing,
    
    /// Message bus for communication
    message_bus: Arc<MessageBus>,
    
    /// Bybit adapter
    exchange: Arc<BybitAdapter>,
    
    /// Active commands
    active_commands: Arc<Mutex<HashMap<String, TradingCommand>>>,
    
    /// Command history
    command_history: Arc<Mutex<Vec<TradingCommand>>>,
    
    /// Performance metrics
    performance_metrics: Arc<Mutex<StrategyPerformance>>,
    
    /// Running state
    running: Arc<Mutex<bool>>,
    
    /// Last analysis time
    last_analysis: Arc<Mutex<DateTime<Utc>>>,
}

/// Strategy performance metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StrategyPerformance {
    /// Total commands issued
    pub total_commands: u64,
    
    /// Successful executions
    pub successful_executions: u64,
    
    /// Failed executions
    pub failed_executions: u64,
    
    /// Total profit/loss
    pub total_pnl: f64,
    
    /// Win rate
    pub win_rate: f64,
    
    /// Average profit per trade
    pub avg_profit_per_trade: f64,
    
    /// Commands per hour
    pub commands_per_hour: f64,
    
    /// Last updated
    pub last_updated: DateTime<Utc>,
}

impl Default for StrategyPerformance {
    fn default() -> Self {
        Self {
            total_commands: 0,
            successful_executions: 0,
            failed_executions: 0,
            total_pnl: 0.0,
            win_rate: 0.0,
            avg_profit_per_trade: 0.0,
            commands_per_hour: 0.0,
            last_updated: Utc::now(),
        }
    }
}

impl MainStrategyController {
    /// Create a new main strategy controller
    pub fn new(
        config: MainStrategyControllerConfig,
        exchange: Arc<BybitAdapter>,
        message_bus: Arc<MessageBus>,
    ) -> Result<Self> {
        info!("🎯 Initializing Main Strategy Controller");
        info!("💰 Capital: {} USDT, Safety Buffer: {} USDT", config.total_capital, config.safety_buffer);
        info!("📊 Max Positions: {}, Position Size: {} USDT", config.max_positions, config.position_size);
        info!("🎯 Target: {} trades/day, Min Confidence: {}%", config.target_trades_per_day, config.min_confidence);

        // Initialize agent coordinator
        let agent_coordinator = AgentCoordinator::new(config.total_capital - config.safety_buffer);

        // Initialize asset scanner
        let scanner_config = AssetScannerConfig::default();
        let asset_scanner = AssetScannerAgent::new(scanner_config, exchange.clone(), message_bus.clone());

        // Initialize strategy
        let strategy_config = StrategyConfig::default();
        let strategy = AdvancedMultiFactorStrategy::new(strategy_config)?;

        // Initialize quantum components
        let quantum_predictor = QuantumPredictor::new();
        let pattern_recognizer = HyperdimensionalPatternRecognizer::new();
        let spectral_engine = SpectralTreeEngine::new();
        let hyperdimensional_engine = HyperdimensionalComputing::new();

        Ok(Self {
            config,
            agent_coordinator,
            asset_scanner,
            strategy,
            quantum_predictor,
            pattern_recognizer,
            spectral_engine,
            hyperdimensional_engine,
            message_bus,
            exchange,
            active_commands: Arc::new(Mutex::new(HashMap::new())),
            command_history: Arc::new(Mutex::new(Vec::new())),
            performance_metrics: Arc::new(Mutex::new(StrategyPerformance::default())),
            running: Arc::new(Mutex::new(false)),
            last_analysis: Arc::new(Mutex::new(Utc::now())),
        })
    }

    /// Start the main strategy controller
    pub async fn start(&self) -> Result<()> {
        info!("🚀 Starting Main Strategy Controller");

        // Set running state
        *self.running.lock().await = true;

        // Start main control loop
        self.run_control_loop().await
    }

    /// Stop the main strategy controller
    pub async fn stop(&self) -> Result<()> {
        info!("🛑 Stopping Main Strategy Controller");

        // Set running state to false
        *self.running.lock().await = false;

        // Cancel all active commands
        self.cancel_all_commands().await?;

        Ok(())
    }

    /// Main control loop - this is where the strategy makes decisions
    async fn run_control_loop(&self) -> Result<()> {
        info!("🔄 Starting main strategy control loop");

        let mut analysis_interval = tokio::time::interval(Duration::from_secs(self.config.analysis_interval));

        while *self.running.lock().await {
            analysis_interval.tick().await;

            // Perform comprehensive market analysis
            if let Err(e) = self.perform_analysis_cycle().await {
                error!("❌ Analysis cycle failed: {}", e);
                continue;
            }

            // Process any responses from execution components
            if let Err(e) = self.process_execution_responses().await {
                error!("❌ Failed to process execution responses: {}", e);
            }

            // Clean up expired commands
            if let Err(e) = self.cleanup_expired_commands().await {
                error!("❌ Failed to cleanup expired commands: {}", e);
            }

            // Update performance metrics
            if let Err(e) = self.update_performance_metrics().await {
                error!("❌ Failed to update performance metrics: {}", e);
            }
        }

        info!("✅ Main strategy control loop stopped");
        Ok(())
    }

    /// Perform comprehensive analysis and generate trading commands
    async fn perform_analysis_cycle(&self) -> Result<()> {
        debug!("🔍 Starting analysis cycle");

        // Update last analysis time
        *self.last_analysis.lock().await = Utc::now();

        // Get available assets from scanner
        let available_assets = self.asset_scanner.get_available_assets().await?;

        if available_assets.is_empty() {
            debug!("📊 No assets available for analysis");
            return Ok(());
        }

        info!("📊 Analyzing {} assets", available_assets.len());

        // Analyze each asset
        for asset in available_assets.iter().take(50) { // Limit to top 50 for performance
            if let Err(e) = self.analyze_asset(&asset.symbol).await {
                warn!("⚠️ Failed to analyze {}: {}", asset.symbol, e);
                continue;
            }
        }

        debug!("✅ Analysis cycle completed");
        Ok(())
    }

    /// Analyze a specific asset and generate trading commands if opportunities found
    async fn analyze_asset(&self, symbol: &str) -> Result<()> {
        debug!("🔍 Analyzing asset: {}", symbol);

        // Get market data
        let candles = self.exchange.get_klines(symbol, "1", None, Some(200)).await?;
        if candles.is_empty() {
            return Ok(());
        }

        // Perform comprehensive analysis using all OMNI components
        let decision = self.agent_coordinator.make_trading_decision(symbol, &candles).await?;

        // Check if decision meets our criteria
        if decision.confidence < self.config.min_confidence {
            debug!("📊 {} - Confidence too low: {:.2}%", symbol, decision.confidence);
            return Ok(());
        }

        // Check if we can take more positions
        let active_commands = self.active_commands.lock().await;
        if active_commands.len() >= self.config.max_positions as usize {
            debug!("📊 {} - Max positions reached", symbol);
            return Ok(());
        }
        drop(active_commands);

        // Generate trading command based on decision
        if let Some(command) = self.generate_trading_command(&decision).await? {
            info!("📤 Issuing trading command for {}: {:?}", symbol, command.command_type);
            self.issue_command(command).await?;
        }

        Ok(())
    }

    /// Generate a trading command from a trading decision
    async fn generate_trading_command(&self, decision: &TradingDecision) -> Result<Option<TradingCommand>> {
        let command_type = match decision.decision_type {
            DecisionType::Buy | DecisionType::EnterLong => CommandType::ExecuteTrade,
            DecisionType::Sell | DecisionType::EnterShort => CommandType::ExecuteTrade,
            DecisionType::Exit => CommandType::ClosePosition,
            DecisionType::Hold | DecisionType::InsufficientData => return Ok(None),
        };

        let direction = match decision.decision_type {
            DecisionType::Buy | DecisionType::EnterLong => TradeDirection::Long,
            DecisionType::Sell | DecisionType::EnterShort => TradeDirection::Short,
            _ => return Ok(None),
        };

        // Calculate entry price, stop loss, and take profit
        let current_price = decision.market_analysis
            .as_ref()
            .map(|ma| ma.current_price)
            .unwrap_or(0.0);

        if current_price <= 0.0 {
            return Ok(None);
        }

        let stop_loss_pct = 0.0025; // 0.25% stop loss
        let take_profit_pct = 0.006; // 0.6% take profit

        let (stop_loss, take_profit) = match direction {
            TradeDirection::Long => {
                let stop_loss = current_price * (1.0 - stop_loss_pct);
                let take_profit = current_price * (1.0 + take_profit_pct);
                (stop_loss, take_profit)
            },
            TradeDirection::Short => {
                let stop_loss = current_price * (1.0 + stop_loss_pct);
                let take_profit = current_price * (1.0 - take_profit_pct);
                (stop_loss, take_profit)
            },
        };

        // Calculate leverage based on risk assessment
        let leverage = decision.risk_assessment
            .as_ref()
            .map(|ra| ra.recommended_leverage.min(self.config.max_leverage))
            .unwrap_or(50.0);

        let command = TradingCommand {
            id: Uuid::new_v4().to_string(),
            command_type,
            symbol: decision.symbol.clone(),
            direction,
            entry_price: current_price,
            stop_loss,
            take_profit,
            position_size: self.config.position_size,
            leverage,
            confidence: decision.confidence,
            priority: if decision.confidence > 95.0 { 10 } else { 8 },
            timestamp: Utc::now(),
            analysis: decision.clone(),
        };

        Ok(Some(command))
    }

    /// Issue a trading command to execution components
    async fn issue_command(&self, command: TradingCommand) -> Result<()> {
        info!("📤 Issuing command: {} for {} - {} {:?} @ {:.4}",
              command.id, command.symbol, command.direction, command.command_type, command.entry_price);

        // Store command in active commands
        self.active_commands.lock().await.insert(command.id.clone(), command.clone());

        // Add to command history
        self.command_history.lock().await.push(command.clone());

        // Send command via message bus
        let message = BusMessage {
            id: command.id.clone(),
            message_type: MessageType::TradingCommand,
            source: "main_strategy_controller".to_string(),
            target: "high_frequency_trader".to_string(),
            data: serde_json::to_value(&command)?,
            timestamp: Utc::now(),
        };

        self.message_bus.send(message);

        // Update performance metrics
        let mut metrics = self.performance_metrics.lock().await;
        metrics.total_commands += 1;
        metrics.last_updated = Utc::now();

        Ok(())
    }

    /// Process responses from execution components
    async fn process_execution_responses(&self) -> Result<()> {
        let messages = self.message_bus.get_messages_for_agent("main_strategy_controller");

        for message in messages {
            if let Ok(response) = serde_json::from_value::<ExecutionResponse>(message.data) {
                self.handle_execution_response(response).await?;
            }
        }

        Ok(())
    }

    /// Handle execution response
    async fn handle_execution_response(&self, response: ExecutionResponse) -> Result<()> {
        info!("📥 Received execution response: {} - {:?}", response.command_id, response.status);

        // Remove from active commands if completed
        if matches!(response.status, ExecutionStatus::Completed | ExecutionStatus::Failed(_)) {
            self.active_commands.lock().await.remove(&response.command_id);
        }

        // Update performance metrics
        let mut metrics = self.performance_metrics.lock().await;
        match response.status {
            ExecutionStatus::Completed => {
                metrics.successful_executions += 1;
                if let Some(pnl) = response.pnl {
                    metrics.total_pnl += pnl;
                }
            },
            ExecutionStatus::Failed(_) => {
                metrics.failed_executions += 1;
            },
            _ => {},
        }

        // Recalculate win rate
        let total_executions = metrics.successful_executions + metrics.failed_executions;
        if total_executions > 0 {
            metrics.win_rate = metrics.successful_executions as f64 / total_executions as f64;
        }

        // Calculate average profit per trade
        if metrics.successful_executions > 0 {
            metrics.avg_profit_per_trade = metrics.total_pnl / metrics.successful_executions as f64;
        }

        metrics.last_updated = Utc::now();

        Ok(())
    }

    /// Cancel all active commands
    async fn cancel_all_commands(&self) -> Result<()> {
        info!("🚫 Cancelling all active commands");

        let active_commands = self.active_commands.lock().await;
        for command_id in active_commands.keys() {
            let cancel_message = BusMessage {
                id: Uuid::new_v4().to_string(),
                message_type: MessageType::CancelCommand,
                source: "main_strategy_controller".to_string(),
                target: "high_frequency_trader".to_string(),
                data: serde_json::to_value(command_id)?,
                timestamp: Utc::now(),
            };
            self.message_bus.send(cancel_message);
        }

        Ok(())
    }

    /// Clean up expired commands
    async fn cleanup_expired_commands(&self) -> Result<()> {
        let mut active_commands = self.active_commands.lock().await;
        let now = Utc::now();
        let timeout_duration = chrono::Duration::seconds(self.config.command_timeout as i64);

        active_commands.retain(|_, command| {
            now.signed_duration_since(command.timestamp) < timeout_duration
        });

        Ok(())
    }

    /// Update performance metrics
    async fn update_performance_metrics(&self) -> Result<()> {
        let mut metrics = self.performance_metrics.lock().await;

        // Calculate commands per hour
        let hours_since_start = Utc::now().signed_duration_since(metrics.last_updated).num_seconds() as f64 / 3600.0;
        if hours_since_start > 0.0 {
            metrics.commands_per_hour = metrics.total_commands as f64 / hours_since_start;
        }

        Ok(())
    }

    /// Get current performance metrics
    pub async fn get_performance_metrics(&self) -> StrategyPerformance {
        self.performance_metrics.lock().await.clone()
    }

    /// Get active commands count
    pub async fn get_active_commands_count(&self) -> usize {
        self.active_commands.lock().await.len()
    }
}

/// Execution response from trading components
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionResponse {
    /// Command ID that was executed
    pub command_id: String,

    /// Execution status
    pub status: ExecutionStatus,

    /// Order ID if trade was placed
    pub order_id: Option<String>,

    /// Realized PnL if position was closed
    pub pnl: Option<f64>,

    /// Error message if failed
    pub error_message: Option<String>,

    /// Timestamp
    pub timestamp: DateTime<Utc>,
}
