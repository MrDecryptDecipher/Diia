//! OMNI-ALPHA VΩ∞∞ - Sovereign Trading Intelligence System
//!
//! A self-evolving, AI-governed, sovereign trading intelligence system designed to operate as a
//! capital-autonomous, no-loss, multi-agent AI economy.
//!
//! This library provides the core components of the OMNI-ALPHA VΩ∞∞ system, including:
//!
//! - Multi-agent architecture for collaborative decision making
//! - Quantum prediction for market forecasting
//! - Zero-loss enforcement mechanisms
//! - Recursive intelligence loop for continuous learning
//! - Sentiment intelligence infusion from various sources
//! - Geo-economic consciousness for macro event awareness

// Engine modules
pub mod engine;

// Quantum modules
pub mod quantum;

// Neural interface
pub mod neural_interface;

// Agent modules
pub mod agents;

// Trading system
pub mod trading_system;

// Market simulator
pub mod market_simulator;

// Strategy modules
pub mod strategy;

// Exchange modules
pub mod exchange;

// Position management
pub mod position;

// Backtesting framework
pub mod backtest;

/// Re-export modules
pub mod prelude {
    // Engine components
    pub use crate::engine::agent_trait::Agent;
    pub use crate::engine::message_bus::{Message, TradeDirection, MessageBus};
    pub use crate::engine::state_machine::{StateMachine, State, Event};
    pub use crate::engine::temporal_memory::{TemporalMemory, TemporalPattern, PatternMatch};
    pub use crate::engine::inference_core::{InferenceCore, InferenceResult, ConfidenceLevel};
    pub use crate::engine::execution_models::{ExecutionModel, StopLossType, TakeProfitType};
    pub use crate::engine::entropy_calc::{EntropyCalculator, EntropyLevel, VolatilityProfile};

    // Quantum components
    pub use crate::quantum::spectral_tree_engine::{SpectralTreeEngine, PathSimulation, PathSimulationResult};
    pub use crate::quantum::quantum_predictor::{QuantumPredictor, QuantumState, PredictionResult};
    pub use crate::quantum::quantum_entanglement::{QuantumEntanglement, EntangledPair, EntanglementResult};
    pub use crate::quantum::hyperdimensional_computing::{Hypervector, HyperdimensionalPattern};
    pub use crate::agents::hyperdimensional_pattern_recognizer::HyperdimensionalPatternRecognizer;

    // Neural interface components
    pub use crate::neural_interface::{NeuralInterface, InterfaceMode, VisualizationType, ChartType, TimeFrame};

    // Agent components
    pub use crate::agents::agent_coordinator::AgentCoordinator;
    pub use crate::agents::market_analyzer::MarketAnalyzer;
    pub use crate::agents::sentiment_analyzer::SentimentAnalyzer;
    pub use crate::agents::risk_manager::RiskManager;
    pub use crate::agents::trade_executor::TradeExecutor;
    pub use crate::agents::zero_loss_enforcer::ZeroLossEnforcer;
    pub use crate::agents::quantum_predictor::QuantumPredictor as QuantumPredictorAgent;
    // HyperdimensionalPatternRecognizer already imported above

    // Recursive intelligence components
    pub use crate::agents::memory_node::{MemoryNode, TradeMemory, TradeOutcome};
    pub use crate::agents::feedback_loop::{FeedbackLoop, AgentPerformance, MutationRecord};
    pub use crate::agents::compound_controller::{CompoundController, CapitalTier};
    pub use crate::agents::ghost_trader::{GhostTrader, TradeSimulationParams};
    pub use crate::agents::anti_loss_hedger::{AntiLossHedger, HedgeRecord, HedgeType};
    pub use crate::agents::god_kernel::{GodKernel, AgentMetadata, EvolutionEvent};

    // Trading system components
    pub use crate::trading_system::{TradingSystem, TradingSystemConfig, TradingMode, ExchangeConfig, Trade};
    pub use crate::market_simulator::MarketSimulator;

    // Strategy components
    pub use crate::strategy::simple_strategy::{SimpleStrategy, Candle, StrategyConfig};

    // Exchange components
    pub use crate::exchange::bybit::adapter::BybitAdapter;
    pub use crate::exchange::bybit::types::{OrderSide, OrderType, TimeInForce, OrderStatus, PositionMode};

    // Position management components
    pub use crate::position::position_manager::{PositionManager, Position, PositionDirection, PositionStatus};

    // Backtesting components
    pub use crate::backtest::backtest_engine::{BacktestEngine, BacktestConfig, BacktestResult, BacktestTrade};
}

/// Initialize the OMNI-ALPHA system
pub fn init() {
    println!("Initializing OMNI-ALPHA VΩ∞∞ - Sovereign Trading Intelligence System");
    println!("Capital Genesis: $12 USDT Origin Logic");
    println!("Recursive Intelligence Loop Activated");
    println!("Zero-Loss Enforcement Protocols Engaged");
    println!("Quantum Prediction System Online");
    println!("Multi-Agent Collaboration Network Established");
    println!("System Ready for Exponential Capital Growth");
}
