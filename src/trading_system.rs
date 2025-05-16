//! Trading System
//!
//! This module provides the core trading system for the OMNI-ALPHA VΩ∞∞ platform,
//! integrating all components into a cohesive trading engine.

use std::sync::Arc;
use std::collections::{HashMap, VecDeque};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use anyhow::Result;
use tokio::sync::{Mutex, RwLock};
use tracing::{info, debug, warn, error};
use async_trait::async_trait;

use crate::engine::message_bus::{Message, MessageBus, TradeDirection};
use crate::engine::agent_trait::{Agent, AgentContext};
use crate::agents::agent_coordinator::AgentCoordinator;
use crate::agents::zero_loss_enforcer::ZeroLossEnforcer;
use crate::agents::memory_node::{MemoryNode, MemoryNodeConfig};
use crate::agents::feedback_loop::{FeedbackLoop, FeedbackLoopConfig};
use crate::agents::compound_controller::{CompoundController, CompoundControllerConfig, CapitalTier};
use crate::agents::ghost_trader::{GhostTrader, GhostTraderConfig};
use crate::agents::anti_loss_hedger::{AntiLossHedger, AntiLossHedgerConfig};
use crate::agents::god_kernel::{GodKernel, GodKernelConfig};
use crate::market_simulator::MarketSimulator;
use crate::exchange::BybitAdapter;

/// Trading mode
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum TradingMode {
    /// Simulation mode (paper trading)
    Simulation,

    /// Backtesting mode
    Backtesting,

    /// Live trading mode
    Live,
}

/// Exchange configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExchangeConfig {
    /// Exchange name
    pub name: String,

    /// API key
    pub api_key: String,

    /// API secret
    pub api_secret: String,

    /// Use testnet
    pub testnet: bool,

    /// Category (e.g., "linear", "inverse", "spot")
    pub category: String,
}

impl Default for ExchangeConfig {
    fn default() -> Self {
        Self {
            name: "bybit".to_string(),
            api_key: "lCMnwPKIzXASNWn6UE".to_string(),
            api_secret: "aXjs1SF9tmW3riHMktmjtyOyAT85puvrVstr".to_string(),
            testnet: false, // false means use demo API instead of testnet
            category: "linear".to_string(),
        }
    }
}

/// Trading system configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TradingSystemConfig {
    /// Initial capital
    pub initial_capital: f64,

    /// Trading mode
    pub mode: TradingMode,

    /// Assets to trade
    pub assets: Vec<String>,

    /// Timeframes to analyze (in minutes)
    pub timeframes: Vec<u64>,

    /// Maximum concurrent trades
    pub max_concurrent_trades: usize,

    /// Heartbeat interval in seconds
    pub heartbeat_interval: u64,

    /// Exchange configuration
    pub exchange: ExchangeConfig,
}

impl Default for TradingSystemConfig {
    fn default() -> Self {
        Self {
            initial_capital: 12.0,
            mode: TradingMode::Simulation,
            assets: vec!["BTCUSDT".to_string(), "ETHUSDT".to_string()],
            timeframes: vec![1, 5, 15],
            max_concurrent_trades: 1,
            heartbeat_interval: 1,
            exchange: ExchangeConfig::default(),
        }
    }
}

/// Trade status
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum TradeStatus {
    /// Pending order
    Pending,

    /// Open position
    Open,

    /// Closed position
    Closed,

    /// Canceled order
    Canceled,

    /// Failed order
    Failed,
}

/// Trade
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Trade {
    /// Trade ID
    pub id: String,

    /// Symbol
    pub symbol: String,

    /// Trade direction
    pub direction: TradeDirection,

    /// Trade status
    pub status: TradeStatus,

    /// Entry price
    pub entry_price: f64,

    /// Exit price
    pub exit_price: Option<f64>,

    /// Stop loss price
    pub stop_loss_price: f64,

    /// Take profit price
    pub take_profit_price: f64,

    /// Position size
    pub size: f64,

    /// Leverage
    pub leverage: f64,

    /// Entry time
    pub entry_time: DateTime<Utc>,

    /// Exit time
    pub exit_time: Option<DateTime<Utc>>,

    /// Realized PnL
    pub realized_pnl: Option<f64>,



    /// Unrealized PnL
    pub unrealized_pnl: f64,

    /// ROI percentage
    pub roi: Option<f64>,

    /// Trade source
    pub source: String,

    /// Trade tags
    pub tags: Vec<String>,

    /// Trade metadata
    pub metadata: HashMap<String, String>,
}

/// Trading system state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TradingSystemState {
    /// Whether the system is running
    pub running: bool,

    /// Current capital
    pub current_capital: f64,

    /// Initial capital
    pub initial_capital: f64,

    /// Current profit/loss
    pub current_pnl: f64,

    /// Current ROI percentage
    pub current_roi: f64,

    /// Number of active trades
    pub active_trades_count: usize,

    /// Number of completed trades
    pub completed_trades_count: usize,

    /// Win rate percentage
    pub win_rate: f64,

    /// Current capital tier
    pub capital_tier: CapitalTier,

    /// System start time
    pub start_time: DateTime<Utc>,

    /// Last update time
    pub last_update_time: DateTime<Utc>,

    /// Trading mode
    pub mode: TradingMode,
}

/// Trading system
pub struct TradingSystem {
    /// System configuration
    config: TradingSystemConfig,

    /// System state
    state: TradingSystemState,

    /// Message bus
    message_bus: Arc<MessageBus>,

    /// Agent coordinator
    agent_coordinator: AgentCoordinator,

    /// Zero loss enforcer
    zero_loss_enforcer: ZeroLossEnforcer,

    /// Memory node
    memory_node: MemoryNode,

    /// Feedback loop
    feedback_loop: FeedbackLoop,

    /// Compound controller
    compound_controller: CompoundController,

    /// Ghost trader
    ghost_trader: GhostTrader,

    /// Anti-loss hedger
    anti_loss_hedger: AntiLossHedger,

    /// God kernel
    god_kernel: GodKernel,

    /// Market simulator (for simulation and backtesting modes)
    market_simulator: Option<MarketSimulator>,

    /// Active trades
    active_trades: HashMap<String, Trade>,

    /// Trade history
    trade_history: VecDeque<Trade>,

    /// Next trade ID
    next_trade_id: usize,

    /// Market data cache
    market_data_cache: HashMap<String, HashMap<u64, VecDeque<MarketData>>>,
}

/// Market data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarketData {
    /// Symbol
    pub symbol: String,

    /// Timestamp
    pub timestamp: DateTime<Utc>,

    /// Open price
    pub open: f64,

    /// High price
    pub high: f64,

    /// Low price
    pub low: f64,

    /// Close price
    pub close: f64,

    /// Volume
    pub volume: f64,

    /// Timeframe in minutes
    pub timeframe: u64,
}

impl TradingSystem {
    /// Create a new trading system
    pub fn new(config: TradingSystemConfig) -> Self {
        let initial_capital = config.initial_capital;
        let mode = config.mode;

        // Create state
        let state = TradingSystemState {
            running: false,
            current_capital: initial_capital,
            initial_capital,
            current_pnl: 0.0,
            current_roi: 0.0,
            active_trades_count: 0,
            completed_trades_count: 0,
            win_rate: 0.0,
            capital_tier: CapitalTier::Tier1,
            start_time: Utc::now(),
            last_update_time: Utc::now(),
            mode,
        };

        // Create components
        // Create exchange adapter
        let adapter = Arc::new(BybitAdapter::new(&config.exchange.api_key, &config.exchange.api_secret, config.exchange.testnet));

        // Create message bus
        let message_bus = Arc::new(MessageBus::new(1000));

        // Create configs
        let memory_node_config = MemoryNodeConfig::default();
        let feedback_loop_config = FeedbackLoopConfig::default();
        let compound_controller_config = CompoundControllerConfig::default();
        let ghost_trader_config = GhostTraderConfig::default();
        let anti_loss_hedger_config = AntiLossHedgerConfig::default();
        let god_kernel_config = GodKernelConfig::default();

        // Create agents with configs and message bus
        let agent_coordinator = AgentCoordinator::new(config.initial_capital);
        let zero_loss_enforcer = ZeroLossEnforcer::new();
        let memory_node = MemoryNode::new(memory_node_config, Arc::clone(&message_bus));
        let feedback_loop = FeedbackLoop::new(feedback_loop_config, Arc::clone(&message_bus));
        let compound_controller = CompoundController::new(compound_controller_config, Arc::clone(&message_bus), initial_capital);
        let ghost_trader = GhostTrader::new(ghost_trader_config, Arc::clone(&message_bus));
        let anti_loss_hedger = AntiLossHedger::new(anti_loss_hedger_config, Arc::clone(&adapter), Arc::clone(&message_bus));
        let god_kernel = GodKernel::new(god_kernel_config, Arc::clone(&message_bus));

        // Create market simulator if needed
        let market_simulator = match mode {
            TradingMode::Simulation | TradingMode::Backtesting => Some(MarketSimulator::new()),
            TradingMode::Live => None,
        };

        Self {
            config,
            state,
            message_bus,
            agent_coordinator,
            zero_loss_enforcer,
            memory_node,
            feedback_loop,
            compound_controller,
            ghost_trader,
            anti_loss_hedger,
            god_kernel,
            market_simulator,
            active_trades: HashMap::new(),
            trade_history: VecDeque::new(),
            next_trade_id: 1,
            market_data_cache: HashMap::new(),
        }
    }

    /// Start the trading system
    pub async fn start(&mut self) -> Result<()> {
        info!("Starting OMNI-ALPHA VΩ∞∞ trading system");
        info!("Initial capital: ${:.2}", self.state.initial_capital);
        info!("Trading mode: {:?}", self.state.mode);
        info!("Assets: {:?}", self.config.assets);

        // Initialize components
        self.initialize_components().await?;

        // Set system as running
        self.state.running = true;
        self.state.start_time = Utc::now();

        Ok(())
    }

    /// Initialize components
    async fn initialize_components(&mut self) -> Result<()> {
        // Initialize zero loss enforcer
        self.zero_loss_enforcer.initialize(Arc::clone(&self.message_bus));

        // Initialize memory node
        // (No initialization needed)

        // Initialize feedback loop
        // (No initialization needed)

        // Initialize compound controller
        // (No initialization needed)

        // Initialize ghost trader
        // (No initialization needed)

        // Initialize anti-loss hedger
        // (No initialization needed)

        // Initialize god kernel
        let context = Arc::new(RwLock::new(AgentContext::new()));
        self.god_kernel.initialize(context).await?;

        // Initialize market simulator if needed
        if let Some(simulator) = &mut self.market_simulator {
            simulator.initialize(&self.config.assets, &self.config.timeframes)?;
        }

        // Register agents with god kernel
        self.register_agents()?;

        Ok(())
    }

    /// Register agents with god kernel
    fn register_agents(&mut self) -> Result<()> {
        // Register zero loss enforcer
        let enforcer_params = HashMap::from([("max_drawdown".to_string(), 0.02)]);
        let enforcer_tags = vec!["risk_management".to_string()];
        self.god_kernel.register_agent("zero_loss_enforcer", "Zero Loss Enforcer", enforcer_params, enforcer_tags)?;

        // Register memory node
        let memory_params = HashMap::from([("max_memory_size".to_string(), 1000.0)]);
        let memory_tags = vec!["memory_management".to_string()];
        self.god_kernel.register_agent("memory_node", "Memory Node", memory_params, memory_tags)?;

        // Register feedback loop
        let feedback_params = HashMap::from([("learning_rate".to_string(), 0.01)]);
        let feedback_tags = vec!["performance_optimization".to_string()];
        self.god_kernel.register_agent("feedback_loop", "Feedback Loop", feedback_params, feedback_tags)?;

        // Register compound controller
        let controller_params = HashMap::from([("tier1_position_size".to_string(), 0.1)]);
        let controller_tags = vec!["capital_management".to_string()];
        self.god_kernel.register_agent("compound_controller", "Compound Controller", controller_params, controller_tags)?;

        // Register ghost trader
        let ghost_params = HashMap::from([("simulation_depth".to_string(), 100.0)]);
        let ghost_tags = vec!["simulation".to_string()];
        self.god_kernel.register_agent("ghost_trader", "Ghost Trader", ghost_params, ghost_tags)?;

        // Register anti-loss hedger
        let hedger_params = HashMap::from([("hedge_threshold".to_string(), 0.01)]);
        let hedger_tags = vec!["hedging".to_string()];
        self.god_kernel.register_agent("anti_loss_hedger", "Anti-Loss Hedger", hedger_params, hedger_tags)?;

        Ok(())
    }

    /// Stop the trading system
    pub async fn stop(&mut self) -> Result<()> {
        info!("Stopping OMNI-ALPHA VΩ∞∞ trading system");

        // Close all active trades
        self.close_all_trades().await?;

        // Set system as not running
        self.state.running = false;

        // Calculate final performance
        self.calculate_performance();

        // Log final results
        info!("Final capital: ${:.2}", self.state.current_capital);
        info!("Profit/Loss: ${:.2} ({:.2}%)", self.state.current_pnl, self.state.current_roi);
        info!("Completed trades: {}", self.state.completed_trades_count);
        info!("Win rate: {:.2}%", self.state.win_rate);

        Ok(())
    }

    /// Update the trading system
    pub async fn update(&mut self) -> Result<()> {
        if !self.state.running {
            return Ok(());
        }

        // Update timestamp
        self.state.last_update_time = Utc::now();

        // Update market data
        self.update_market_data().await?;

        // Process agents
        self.process_agents().await?;

        // Process messages
        self.process_messages().await?;

        // Update active trades
        self.update_trades().await?;

        // Update performance metrics
        self.calculate_performance();

        // Evolve system occasionally
        if self.should_evolve_system() {
            self.god_kernel.evolve_system().await?;
        }

        Ok(())
    }

    /// Update market data
    async fn update_market_data(&mut self) -> Result<()> {
        // Create a vector to store market data for caching after the loop
        let mut market_data_to_cache = Vec::new();

        match self.state.mode {
            TradingMode::Simulation | TradingMode::Backtesting => {
                if let Some(simulator) = &mut self.market_simulator {
                    // Get market data from simulator
                    for symbol in &self.config.assets.clone() {
                        for &timeframe in &self.config.timeframes.clone() {
                            if let Some(data) = simulator.get_next_candle(&symbol, timeframe)? {
                                // Create a clone of the data for caching
                                let data_clone = data.clone();

                                // Create market data message
                                let message = Message::MarketData {
                                    symbol: symbol.clone(),
                                    timestamp: data.timestamp,
                                    volume: data.volume,
                                    open: data.open,
                                    high: data.high,
                                    low: data.low,
                                    close: data.close,
                                };

                                // Send market data message
                                self.message_bus.send(message);

                                // Add the market data to the cache vector for later processing
                                market_data_to_cache.push((symbol.clone(), timeframe, data_clone));
                            }
                        }
                    }
                }

                // Now cache all the market data we collected
                for (symbol, timeframe, data) in market_data_to_cache {
                    self.cache_market_data(&symbol, timeframe, data);
                }
            },
            TradingMode::Live => {
                // In live mode, we would fetch market data from the exchange API
                // For now, we'll just use a placeholder
                debug!("Fetching live market data from exchange");

                // TODO: Implement exchange API integration
            },
        }

        Ok(())
    }

    /// Cache market data
    fn cache_market_data(&mut self, symbol: &str, timeframe: u64, data: MarketData) {
        // Get or create symbol cache
        let symbol_cache = self.market_data_cache
            .entry(symbol.to_string())
            .or_insert_with(HashMap::new);

        // Get or create timeframe cache
        let timeframe_cache = symbol_cache
            .entry(timeframe)
            .or_insert_with(VecDeque::new);

        // Add data to cache
        timeframe_cache.push_back(data);

        // Limit cache size
        if timeframe_cache.len() > 1000 {
            timeframe_cache.pop_front();
        }
    }

    /// Process agents
    async fn process_agents(&mut self) -> Result<()> {
        // Process zero loss enforcer
        if self.zero_loss_enforcer.is_active() {
            if let Ok(messages) = self.zero_loss_enforcer.process().await {
                for message in messages {
                    self.message_bus.send(message);
                }
            }
        }

        // Process other agents
        // ...

        Ok(())
    }

    /// Process messages
    async fn process_messages(&mut self) -> Result<()> {
        // Process trade signals
        let messages = self.message_bus.get_messages_for_agent("trading_system");

        for message in messages {
            match message {
                Message::TradeSignal { symbol, direction, confidence, entry_price, stop_loss_price, take_profit_price, source, timestamp } => {
                    // Check if we should execute the trade
                    if self.should_execute_trade(&symbol, direction, confidence) {
                        // Execute trade
                        self.execute_trade(&symbol, direction, entry_price, stop_loss_price, take_profit_price, &source).await?;
                    }
                },
                _ => {},
            }
        }

        Ok(())
    }

    /// Should execute trade
    fn should_execute_trade(&self, symbol: &str, direction: TradeDirection, confidence: f64) -> bool {
        // Check if we're at max concurrent trades
        if self.active_trades.len() >= self.config.max_concurrent_trades {
            return false;
        }

        // Check if we already have a trade for this symbol
        for trade in self.active_trades.values() {
            if trade.symbol == symbol {
                return false;
            }
        }

        // Check confidence threshold
        if confidence < 0.7 {
            return false;
        }

        // Check with ghost trader
        // (In a real implementation, we would simulate the trade first)

        true
    }

    /// Execute trade
    async fn execute_trade(&mut self, symbol: &str, direction: TradeDirection, entry_price: f64, stop_loss_price: f64, take_profit_price: f64, source: &str) -> Result<()> {
        // Generate trade ID
        let trade_id = format!("trade-{}", self.next_trade_id);
        self.next_trade_id += 1;

        // Calculate position size
        let position_size = self.calculate_position_size(symbol, entry_price, stop_loss_price);

        // Calculate leverage
        let leverage = self.calculate_leverage(symbol);

        // Create trade
        let trade = Trade {
            id: trade_id.clone(),
            symbol: symbol.to_string(),
            direction,
            status: TradeStatus::Open,
            entry_price,
            exit_price: None,
            stop_loss_price,
            take_profit_price,
            size: position_size,
            leverage,
            entry_time: Utc::now(),
            exit_time: None,
            realized_pnl: None,
            unrealized_pnl: 0.0,
            roi: None,
            source: source.to_string(),
            tags: vec![],
            metadata: HashMap::new(),
        };

        // Log trade
        info!("Opening trade: {} - {} {:?} at ${:.2}, size: {:.4}, stop: ${:.2}, take profit: ${:.2}",
            trade_id, symbol, direction, entry_price, position_size, stop_loss_price, take_profit_price);

        // Register trade with zero loss enforcer
        self.zero_loss_enforcer.register_trade(trade.clone())?;

        // Add to active trades
        self.active_trades.insert(trade_id, trade);

        // Update state
        self.state.active_trades_count = self.active_trades.len();

        Ok(())
    }

    /// Calculate position size
    fn calculate_position_size(&self, symbol: &str, entry_price: f64, stop_loss_price: f64) -> f64 {
        // Get risk per trade (1% of capital)
        let risk_amount = self.state.current_capital * 0.01;

        // Calculate risk per unit
        let risk_per_unit = (entry_price - stop_loss_price).abs();

        if risk_per_unit > 0.0 {
            // Calculate position size based on risk
            let position_size = risk_amount / risk_per_unit;

            // Limit position size based on capital tier
            let max_position_size = match self.state.capital_tier {
                CapitalTier::Tier1 => self.state.current_capital * 0.1,
                CapitalTier::Tier2 => self.state.current_capital * 0.15,
                CapitalTier::Tier3 => self.state.current_capital * 0.2,
                CapitalTier::Tier4 => self.state.current_capital * 0.25,
            };

            position_size.min(max_position_size / entry_price)
        } else {
            0.0
        }
    }

    /// Calculate leverage
    fn calculate_leverage(&self, symbol: &str) -> f64 {
        // Base leverage on capital tier
        match self.state.capital_tier {
            CapitalTier::Tier1 => 1.0,
            CapitalTier::Tier2 => 2.0,
            CapitalTier::Tier3 => 3.0,
            CapitalTier::Tier4 => 5.0,
        }
    }

    /// Update trades
    async fn update_trades(&mut self) -> Result<()> {
        let mut trades_to_close = Vec::new();
        let mut trades_to_update = Vec::new();

        // First collect all the trades and prices we need to process
        for (trade_id, trade) in &self.active_trades {
            // Get current price
            if let Some(current_price) = self.get_current_price(&trade.symbol) {
                trades_to_update.push((trade_id.clone(), trade.clone(), current_price));
            }
        }

        // Now update each trade
        for (trade_id, mut trade, current_price) in trades_to_update {
            // Update unrealized PnL
            let unrealized_pnl = match trade.direction {
                TradeDirection::Long => (current_price - trade.entry_price) * trade.size * trade.leverage,
                TradeDirection::Short => (trade.entry_price - current_price) * trade.size * trade.leverage,
                _ => 0.0,
            };

            // Update the trade in the active_trades map
            if let Some(active_trade) = self.active_trades.get_mut(&trade_id) {
                active_trade.unrealized_pnl = unrealized_pnl;
            }

            // Update zero loss enforcer
            self.zero_loss_enforcer.update_trade(&trade_id, current_price)?;

            // Check if trade should be closed
            if self.should_close_trade(&trade, current_price) {
                trades_to_close.push(trade_id);
            }
        }

        // Close trades
        for trade_id in trades_to_close {
            if let Some(trade) = self.active_trades.get(&trade_id) {
                let current_price = self.get_current_price(&trade.symbol).unwrap_or(trade.entry_price);
                self.close_trade(&trade_id, current_price).await?;
            }
        }

        Ok(())
    }

    /// Should close trade
    fn should_close_trade(&self, trade: &Trade, current_price: f64) -> bool {
        match trade.direction {
            TradeDirection::Long => {
                // Check stop loss
                if current_price <= trade.stop_loss_price {
                    return true;
                }

                // Check take profit
                if current_price >= trade.take_profit_price {
                    return true;
                }
            },
            TradeDirection::Short => {
                // Check stop loss
                if current_price >= trade.stop_loss_price {
                    return true;
                }

                // Check take profit
                if current_price <= trade.take_profit_price {
                    return true;
                }
            },
            _ => {},
        }

        false
    }

    /// Close trade
    async fn close_trade(&mut self, trade_id: &str, exit_price: f64) -> Result<()> {
        if let Some(mut trade) = self.active_trades.remove(trade_id) {
            // Update trade
            trade.status = TradeStatus::Closed;
            trade.exit_price = Some(exit_price);
            trade.exit_time = Some(Utc::now());

            // Calculate realized PnL
            let realized_pnl = match trade.direction {
                TradeDirection::Long => (exit_price - trade.entry_price) * trade.size * trade.leverage,
                TradeDirection::Short => (trade.entry_price - exit_price) * trade.size * trade.leverage,
                _ => 0.0,
            };

            trade.realized_pnl = Some(realized_pnl);

            // Calculate ROI
            let roi = realized_pnl / (trade.entry_price * trade.size) * 100.0;
            trade.roi = Some(roi);

            // Log trade
            info!("Closing trade: {} - {} at ${:.2}, PnL: ${:.2}, ROI: {:.2}%",
                trade_id, trade.symbol, exit_price, realized_pnl, roi);

            // Close hedge with zero loss enforcer
            self.zero_loss_enforcer.close_trade(trade_id, exit_price, Utc::now())?;

            // Store in memory node
            let memory_trade = crate::agents::memory_node::Trade {
                id: trade.id.clone(),
                symbol: trade.symbol.clone(),
                entry_time: trade.entry_time,
                exit_time: trade.exit_time,
                entry_price: trade.entry_price,
                exit_price: trade.exit_price,
                direction: trade.direction.clone(),
                position_size: trade.size,
                pnl: trade.realized_pnl,
                roi: trade.roi,
                contributing_agents: Vec::new(),
                agent_confidence: HashMap::new(),
                strategy: String::from("default"),
                tags: Vec::new(),
                metadata: HashMap::new(),
            };
            self.memory_node.store_trade(memory_trade)?;

            // Add to trade history
            self.trade_history.push_back(trade);

            // Limit history size
            if self.trade_history.len() > 1000 {
                self.trade_history.pop_front();
            }

            // Update state
            self.state.active_trades_count = self.active_trades.len();
            self.state.completed_trades_count += 1;
            self.state.current_capital += realized_pnl;

            // Update compound controller
            self.compound_controller.update_capital(self.state.current_capital);
            self.state.capital_tier = self.compound_controller.get_state().current_tier;
        }

        Ok(())
    }

    /// Close all trades
    async fn close_all_trades(&mut self) -> Result<()> {
        let trade_ids: Vec<String> = self.active_trades.keys().cloned().collect();

        for trade_id in trade_ids {
            if let Some(trade) = self.active_trades.get(&trade_id) {
                let current_price = self.get_current_price(&trade.symbol).unwrap_or(trade.entry_price);
                self.close_trade(&trade_id, current_price).await?;
            }
        }

        Ok(())
    }

    /// Get current price
    fn get_current_price(&self, symbol: &str) -> Option<f64> {
        // Check market data cache
        if let Some(symbol_cache) = self.market_data_cache.get(symbol) {
            // Use the smallest timeframe for current price
            let smallest_timeframe = self.config.timeframes.iter().min().copied().unwrap_or(1);

            if let Some(timeframe_cache) = symbol_cache.get(&smallest_timeframe) {
                if let Some(latest_data) = timeframe_cache.back() {
                    return Some(latest_data.close);
                }
            }
        }

        None
    }

    /// Calculate performance
    fn calculate_performance(&mut self) {
        // Calculate current PnL
        self.state.current_pnl = self.state.current_capital - self.state.initial_capital;

        // Calculate current ROI
        if self.state.initial_capital > 0.0 {
            self.state.current_roi = self.state.current_pnl / self.state.initial_capital * 100.0;
        }

        // Calculate win rate
        let winning_trades = self.trade_history.iter()
            .filter(|t| t.realized_pnl.unwrap_or(0.0) > 0.0)
            .count();

        if !self.trade_history.is_empty() {
            self.state.win_rate = winning_trades as f64 / self.trade_history.len() as f64 * 100.0;
        }
    }

    /// Should evolve system
    fn should_evolve_system(&self) -> bool {
        // Evolve system every 100 completed trades
        self.state.completed_trades_count > 0 && self.state.completed_trades_count % 100 == 0
    }

    /// Get active trades
    pub fn get_active_trades(&self) -> Vec<Trade> {
        self.active_trades.values().cloned().collect()
    }

    /// Get trade history
    pub fn get_trade_history(&self) -> Vec<Trade> {
        self.trade_history.iter().cloned().collect()
    }

    /// Get capital
    pub fn get_capital(&self) -> f64 {
        self.state.current_capital
    }

    /// Get state
    pub fn get_state(&self) -> &TradingSystemState {
        &self.state
    }

    /// Get list of assets to trade
    pub fn get_assets(&self) -> Vec<String> {
        // For now, return a hardcoded list of assets
        // In a real implementation, this would come from configuration or discovery
        vec![
            "BTCUSDT".to_string(),
            "ETHUSDT".to_string(),
            "SOLUSDT".to_string(),
            "BNBUSDT".to_string(),
            "ADAUSDT".to_string(),
        ]
    }

    /// Send a message to the message bus
    pub fn send_message(&self, message: Message) {
        self.message_bus.send(message);
    }

    /// Get config
    pub fn get_config(&self) -> &TradingSystemConfig {
        &self.config
    }
}
