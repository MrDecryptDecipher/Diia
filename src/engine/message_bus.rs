//! Message Bus
//!
//! This module defines the message types used for communication between agents
//! in the OMNI-ALPHA system.

use std::sync::Arc;
use tokio::sync::broadcast::{self, Sender, Receiver};
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use anyhow::Result;
use uuid::Uuid;

/// Trade direction
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum TradeDirection {
    /// Long position
    Long,

    /// Short position
    Short,

    /// Neutral (no position)
    Neutral,
}

/// Message type
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Message {
    /// Market update message
    MarketUpdate {
        /// Symbol
        symbol: String,

        /// Timestamp
        timestamp: DateTime<Utc>,

        /// Current price
        price: f64,

        /// Volume
        volume: f64,
    },

    /// Market data message
    MarketData {
        /// Symbol
        symbol: String,

        /// Timestamp
        timestamp: DateTime<Utc>,

        /// Open price
        open: f64,

        /// High price
        high: f64,

        /// Low price
        low: f64,

        /// Close price
        close: f64,

        /// Volume
        volume: f64,
    },

    /// Trade signal message
    TradeSignal {
        /// Symbol
        symbol: String,

        /// Timestamp
        timestamp: DateTime<Utc>,

        /// Direction
        direction: TradeDirection,

        /// Entry price
        entry_price: f64,

        /// Stop loss price
        stop_loss_price: f64,

        /// Take profit price
        take_profit_price: f64,

        /// Confidence score (0-100)
        confidence: f64,

        /// Source
        source: String,
    },

    /// Agent status message (renamed to avoid conflict)
    AgentStatusMessage {
        /// Agent ID
        agent_id: String,

        /// Status
        status: String,

        /// Timestamp
        timestamp: DateTime<Utc>,
    },

    /// System status message (renamed to avoid conflict)
    SystemStatusMessage {
        /// Symbol
        symbol: String,

        /// Timestamp
        timestamp: DateTime<Utc>,

        /// Direction
        direction: TradeDirection,

        /// Entry price
        entry_price: f64,

        /// Stop loss price
        stop_loss_price: f64,

        /// Take profit price
        take_profit_price: f64,

        /// Confidence score (0-100)
        confidence: f64,

        /// Signal source
        source: String,
    },

    /// Trade execution message
    TradeExecution {
        /// Trade ID
        trade_id: String,

        /// Symbol
        symbol: String,

        /// Timestamp
        timestamp: DateTime<Utc>,

        /// Direction
        direction: TradeDirection,

        /// Entry price
        entry_price: f64,

        /// Position size
        position_size: f64,

        /// Leverage
        leverage: f64,

        /// Stop loss price
        stop_loss_price: f64,

        /// Take profit price
        take_profit_price: f64,
    },

    /// Trade update message
    TradeUpdate {
        /// Trade ID
        trade_id: String,

        /// Symbol
        symbol: String,

        /// Timestamp
        timestamp: DateTime<Utc>,

        /// Current price
        current_price: f64,

        /// Current PnL
        pnl: f64,

        /// ROI percentage
        roi: f64,

        /// Duration in seconds
        duration_seconds: u64,
    },

    /// Trade close message
    TradeClose {
        /// Trade ID
        trade_id: String,

        /// Symbol
        symbol: String,

        /// Timestamp
        timestamp: DateTime<Utc>,

        /// Exit price
        exit_price: f64,

        /// PnL
        pnl: f64,

        /// ROI percentage
        roi: f64,

        /// Duration in seconds
        duration_seconds: u64,

        /// Close reason
        reason: String,
    },

    /// System status message
    SystemStatus {
        /// Timestamp
        timestamp: DateTime<Utc>,

        /// Current capital
        capital: f64,

        /// Open positions
        open_positions: usize,

        /// Total profit
        total_profit: f64,

        /// ROI percentage
        roi: f64,

        /// Active agents
        active_agents: usize,
    },

    /// Agent status message
    AgentStatus {
        /// Agent name
        agent_name: String,

        /// Timestamp
        timestamp: DateTime<Utc>,

        /// Is active
        active: bool,

        /// Performance score
        performance_score: f64,

        /// Status message
        status: String,
    },

    /// Error message
    Error {
        /// Timestamp
        timestamp: DateTime<Utc>,

        /// Error source
        source: String,

        /// Error message
        message: String,

        /// Error severity
        severity: String,
    },

    /// Custom message
    Custom(String, serde_json::Value),
}

/// Message type for the new message bus
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum MessageType {
    /// Agent initialized
    AgentInitialized,

    /// Agent started
    AgentStarted,

    /// Agent stopped
    AgentStopped,

    /// Trade entry
    TradeEntry,

    /// Trade exit
    TradeExit,

    /// Trade result
    TradeResult,

    /// System update
    SystemUpdate,

    /// Agent performance
    AgentPerformance,

    /// Strategy update
    StrategyUpdate,

    /// Market data
    MarketData,

    /// Trade signal
    TradeSignal,

    /// Trade completed
    TradeCompleted,

    /// Trading command from main strategy controller
    TradingCommand,

    /// Cancel command
    CancelCommand,

    /// Execution response from trading components
    ExecutionResponse,
}

/// Message for the new message bus
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BusMessage {
    /// Message ID
    pub id: String,

    /// Message type
    pub message_type: MessageType,

    /// Source agent
    pub source: String,

    /// Target agent
    pub target: String,

    /// Message data (JSON value for structured data)
    pub data: serde_json::Value,

    /// Message content (for backward compatibility)
    pub content: String,

    /// Timestamp
    pub timestamp: DateTime<Utc>,
}

/// Message Bus
pub struct MessageBus {
    /// Sender
    sender: Sender<BusMessage>,
}

impl MessageBus {
    /// Create a new message bus
    pub fn new(capacity: usize) -> Self {
        let (sender, _) = broadcast::channel(capacity);

        Self {
            sender,
        }
    }

    /// Subscribe to the message bus
    pub fn subscribe(&self) -> Receiver<BusMessage> {
        self.sender.subscribe()
    }

    /// Publish a message
    pub async fn publish(&self, message: BusMessage) {
        // Ignore errors when no receivers
        let _ = self.sender.send(message);
    }

    /// Send a message (synchronous version of publish)
    pub fn send(&self, message: BusMessage) {
        // Ignore errors when no receivers
        let _ = self.sender.send(message);
    }

    /// Send a legacy message (for backward compatibility)
    pub fn send_legacy(&self, message: Message) {
        // Create a bus message
        let bus_message = BusMessage {
            id: Uuid::new_v4().to_string(),
            message_type: match message {
                Message::MarketUpdate { .. } => MessageType::SystemUpdate,
                Message::MarketData { .. } => MessageType::MarketData,
                Message::TradeSignal { .. } => MessageType::TradeSignal,
                Message::AgentStatusMessage { .. } => MessageType::AgentStarted,
                Message::SystemStatusMessage { .. } => MessageType::SystemUpdate,
                Message::TradeExecution { .. } => MessageType::TradeEntry,
                Message::TradeUpdate { .. } => MessageType::SystemUpdate,
                Message::TradeClose { .. } => MessageType::TradeExit,
                Message::Error { .. } => MessageType::SystemUpdate,
                Message::Custom(_, _) => MessageType::SystemUpdate,
                _ => MessageType::SystemUpdate,
            },
            source: "system".to_string(),
            target: "all".to_string(),
            data: serde_json::to_value(&message).unwrap_or_default(),
            content: serde_json::to_string(&message).unwrap_or_default(),
            timestamp: Utc::now(),
        };

        // Ignore errors when no receivers
        let _ = self.sender.send(bus_message);
    }

    /// Get messages for a specific agent
    pub fn get_messages_for_agent(&self, agent_id: &str) -> Vec<BusMessage> {
        // This is a simplified implementation
        // In a real system, you would maintain a message queue per agent
        // For now, return empty vector as messages are processed immediately
        Vec::new()
    }
}
