use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tokio::sync::mpsc::{self, Receiver, Sender};

use crate::agent_trait::Agent;

/// Message types that can be sent between agents
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Message {
    /// Trade signal from an agent
    TradeSignal(TradeSignal),
    /// Market data update
    MarketData(MarketData),
    /// Simulation result from ghost_trader
    SimulationResult(SimulationResult),
    /// Macro warning from macro_sentinel
    MacroWarning(MacroWarning),
    /// Sentiment update from sentiment agents
    SentimentUpdate(SentimentUpdate),
    /// Memory retrieval request
    MemoryRequest(MemoryRequest),
    /// Memory retrieval response
    MemoryResponse(MemoryResponse),
    /// Agent status update
    AgentStatus(AgentStatus),
    /// System command
    SystemCommand(SystemCommand),
    /// Custom message with arbitrary data
    Custom(String, serde_json::Value),
}

/// Trade signal from an agent
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TradeSignal {
    /// ID of the signal
    pub id: String,
    /// Asset to trade
    pub asset: String,
    /// Direction of the trade
    pub direction: TradeDirection,
    /// Entry price
    pub entry_price: f64,
    /// Stop loss price
    pub stop_loss: f64,
    /// Take profit price
    pub take_profit: f64,
    /// Position size in USDT
    pub position_size: f64,
    /// Leverage to use
    pub leverage: f64,
    /// Confidence score (0-100)
    pub confidence: f64,
    /// Source agent
    pub source_agent: String,
    /// Signal timestamp
    pub timestamp: chrono::DateTime<chrono::Utc>,
    /// Signal expiration
    pub expiration: chrono::DateTime<chrono::Utc>,
    /// Additional metadata
    pub metadata: HashMap<String, serde_json::Value>,
}

/// Trade direction
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum TradeDirection {
    Long,
    Short,
}

/// Market data update
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarketData {
    /// Asset symbol
    pub symbol: String,
    /// Current price
    pub price: f64,
    /// Bid price
    pub bid: f64,
    /// Ask price
    pub ask: f64,
    /// 24h volume
    pub volume_24h: f64,
    /// 24h price change percentage
    pub price_change_24h: f64,
    /// Orderbook snapshot
    pub orderbook: OrderBook,
    /// Timestamp
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

/// Orderbook snapshot
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrderBook {
    /// Bids (price, quantity)
    pub bids: Vec<(f64, f64)>,
    /// Asks (price, quantity)
    pub asks: Vec<(f64, f64)>,
}

/// Simulation result from ghost_trader
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimulationResult {
    /// The original simulation
    pub simulation: TradeSimulation,
    /// Confidence score (0-100)
    pub confidence: f64,
    /// Risk assessment (0-100, higher is riskier)
    pub risk_score: f64,
    /// Expected holding time in seconds
    pub expected_holding_time: u64,
    /// Probability of hitting take profit
    pub tp_probability: f64,
    /// Probability of hitting stop loss
    pub sl_probability: f64,
    /// Recommended adjustments to the trade
    pub recommendations: Vec<TradeAdjustment>,
}

/// Trade simulation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TradeSimulation {
    /// Unique ID for the simulation
    pub id: String,
    /// Asset being simulated
    pub asset: String,
    /// Entry price
    pub entry_price: f64,
    /// Position size in USDT
    pub position_size: f64,
    /// Leverage used
    pub leverage: f64,
    /// Direction of the trade
    pub direction: TradeDirection,
    /// Stop loss price
    pub stop_loss: f64,
    /// Take profit price
    pub take_profit: f64,
    /// When the simulation started
    pub start_time: chrono::DateTime<chrono::Utc>,
    /// Current simulation time
    pub current_time: chrono::DateTime<chrono::Utc>,
    /// Current simulated price
    pub current_price: f64,
    /// Price history during simulation
    pub price_history: Vec<(chrono::DateTime<chrono::Utc>, f64)>,
    /// Current P&L
    pub current_pnl: f64,
    /// Current ROI percentage
    pub current_roi: f64,
    /// Whether the simulation has completed
    pub completed: bool,
    /// Outcome of the simulation if completed
    pub outcome: Option<SimulationOutcome>,
}

/// Simulation outcome
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SimulationOutcome {
    TakeProfitHit(f64),  // ROI achieved
    StopLossHit(f64),    // Loss incurred
    TimeExpired(f64),    // Simulation time expired with given ROI
    Aborted(String),     // Simulation aborted with reason
}

/// Trade adjustment recommendation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TradeAdjustment {
    AdjustEntry(f64),
    AdjustStopLoss(f64),
    AdjustTakeProfit(f64),
    ReduceSize(f64),
    IncreaseSize(f64),
    Abort(String),
}

/// Macro warning from macro_sentinel
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MacroWarning {
    /// Type of warning
    pub warning_type: EventType,
    /// Severity of the warning
    pub severity: ExpectedImpact,
    /// When the warning was issued
    pub issued_at: chrono::DateTime<chrono::Utc>,
    /// When the warning expires
    pub expires_at: chrono::DateTime<chrono::Utc>,
    /// Affected assets or markets
    pub affected_markets: Vec<String>,
    /// Recommended action
    pub recommended_action: MarketCondition,
}

/// Event type
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum EventType {
    CPIRelease,
    FOMCMeeting,
    NFPReport,
    TariffAnnouncement,
    ETFFlow,
    CentralBankDecision,
    GeopoliticalEvent,
    Other(String),
}

/// Expected impact
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ExpectedImpact {
    Low,
    Medium,
    High,
    Critical,
}

/// Market condition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MarketCondition {
    Normal,
    Cautious,
    HighRisk,
    EmergencyOnly,
    FullStop,
}

/// Sentiment update from sentiment agents
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SentimentUpdate {
    /// Asset symbol
    pub symbol: String,
    /// Overall sentiment score (-100 to 100)
    pub sentiment_score: f64,
    /// Sentiment source
    pub source: SentimentSource,
    /// Sentiment components
    pub components: HashMap<String, f64>,
    /// Raw text that generated this sentiment
    pub raw_text: Option<String>,
    /// Timestamp
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

/// Sentiment source
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SentimentSource {
    Telegram,
    Twitter,
    Discord,
    News,
    Reddit,
    Combined,
    Other(String),
}

/// Memory request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryRequest {
    /// Request ID
    pub request_id: String,
    /// Pattern hash to search for
    pub pattern_hash: String,
    /// Maximum number of results
    pub limit: usize,
    /// Requesting agent
    pub requesting_agent: String,
    /// Timestamp
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

/// Memory response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryResponse {
    /// Request ID this is responding to
    pub request_id: String,
    /// Memories found
    pub memories: Vec<TradeMemory>,
    /// Responding agent
    pub responding_agent: String,
    /// Timestamp
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

/// Trade memory
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TradeMemory {
    /// Unique ID for the memory
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
    pub entry_time: chrono::DateTime<chrono::Utc>,
    /// When the trade was exited
    pub exit_time: chrono::DateTime<chrono::Utc>,
    /// Profit/loss amount
    pub pnl: f64,
    /// ROI percentage
    pub roi: f64,
    /// Trade outcome
    pub outcome: TradeOutcome,
    /// Pattern hash for this trade
    pub pattern_hash: String,
    /// Memory strength (0-1, higher is stronger)
    pub memory_strength: f64,
}

/// Trade outcome
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TradeOutcome {
    TakeProfitHit(f64),  // ROI achieved
    StopLossHit(f64),    // Loss incurred
    ManualClose(f64),    // Manually closed with ROI
    Expired(f64),        // Time expired with ROI
    Aborted(String),     // Aborted with reason
}

/// Agent status update
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentStatus {
    /// Agent name
    pub agent_name: String,
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
    pub custom_data: HashMap<String, serde_json::Value>,
    /// Timestamp
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

/// System command
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SystemCommand {
    /// Pause all trading
    PauseTrading,
    /// Resume trading
    ResumeTrading,
    /// Shutdown system
    Shutdown,
    /// Restart system
    Restart,
    /// Enable agent
    EnableAgent(String),
    /// Disable agent
    DisableAgent(String),
    /// Set parameter
    SetParameter(String, serde_json::Value),
    /// Custom command
    Custom(String, serde_json::Value),
}

/// The MessageBus handles communication between agents
pub struct MessageBus {
    /// Senders for each agent
    senders: Arc<Mutex<HashMap<String, Sender<Message>>>>,
}

impl MessageBus {
    /// Create a new MessageBus
    pub fn new() -> Self {
        Self {
            senders: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    /// Register an agent with the message bus
    pub fn register_agent(&self, agent_name: &str) -> Receiver<Message> {
        let (tx, rx) = mpsc::channel(100);
        self.senders.lock().unwrap().insert(agent_name.to_string(), tx);
        rx
    }

    /// Unregister an agent from the message bus
    pub fn unregister_agent(&self, agent_name: &str) {
        self.senders.lock().unwrap().remove(agent_name);
    }

    /// Send a message to a specific agent
    pub async fn send_to(&self, agent_name: &str, message: Message) -> anyhow::Result<()> {
        let sender = {
            let senders = self.senders.lock().unwrap();
            senders.get(agent_name).cloned()
        };

        if let Some(sender) = sender {
            sender.send(message).await.map_err(|e| anyhow::anyhow!("Failed to send message: {}", e))?;
            Ok(())
        } else {
            Err(anyhow::anyhow!("Agent not found: {}", agent_name))
        }
    }

    /// Broadcast a message to all agents
    pub async fn broadcast(&self, message: Message) -> anyhow::Result<()> {
        let senders = {
            let senders = self.senders.lock().unwrap();
            senders.clone()
        };

        for (agent_name, sender) in senders {
            if let Err(e) = sender.send(message.clone()).await {
                eprintln!("Failed to send message to {}: {}", agent_name, e);
            }
        }

        Ok(())
    }
}
