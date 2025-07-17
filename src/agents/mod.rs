//! SUPERINTELLIGENT Multi-Agent System for Exponential Trading Growth
//!
//! This module contains the implementation of the hyper-intelligent multi-agent system
//! for the OMNI-ALPHA trading platform, designed for exponential capital growth with zero losses.

pub mod agent_coordinator;
pub mod market_analyzer;
pub mod sentiment_analyzer;
pub mod risk_manager;
pub mod trade_executor;
pub mod zero_loss_enforcer;
pub mod quantum_predictor;
pub mod hyperdimensional_pattern_recognizer;
pub mod memory_node;
pub mod feedback_loop;
pub mod compound_controller;
pub mod ghost_trader;
pub mod anti_loss_hedger;
pub mod god_kernel;
pub mod asset_scanner_agent;
pub mod high_frequency_trader;
pub mod main_strategy_controller;

// Re-export key types
pub use agent_coordinator::{AgentCoordinator, TradingDecision, DecisionType};
pub use market_analyzer::{MarketAnalyzer, MarketAnalysis};
pub use sentiment_analyzer::{SentimentAnalyzer, SentimentAnalysis, SentimentSource};
pub use risk_manager::{RiskManager, RiskAssessment};
pub use trade_executor::{TradeExecutor, TradeExecution, ExecutionStatus};
pub use zero_loss_enforcer::{ZeroLossEnforcer, ZeroLossAssessment};
pub use quantum_predictor::{QuantumPredictor, QuantumPrediction};
pub use hyperdimensional_pattern_recognizer::{HyperdimensionalPatternRecognizer, PatternRecognition, PatternType};
pub use memory_node::{MemoryNode, TradeMemory, TradeOutcome, MarketConditions, TrendDirection};
pub use feedback_loop::{FeedbackLoop, AgentPerformance, MutationRecord};
pub use compound_controller::{CompoundController, CapitalTier, CapitalAllocationStrategy};
pub use ghost_trader::{GhostTrader, TradeSimulationParams, TradeSimulationResult};
pub use anti_loss_hedger::{AntiLossHedger, HedgeRecord, HedgeType, HedgeStatus};
pub use god_kernel::{GodKernel, AgentMetadata, EvolutionEvent, EvolutionEventType};
pub use asset_scanner_agent::{AssetScannerAgent, AssetScannerAgentConfig};
pub use high_frequency_trader::{HighFrequencyTrader, HighFrequencyTraderConfig};
