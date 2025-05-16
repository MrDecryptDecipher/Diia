//! Message Bus
//!
//! This module defines the message types for inter-agent communication
//! in the OMNI-ALPHA VΩ∞∞ system.

use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use serde_json::Value;

/// Trade direction
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
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
    /// Trade signal message
    TradeSignal {
        /// Symbol
        symbol: String,
        
        /// Trade direction
        direction: TradeDirection,
        
        /// Confidence score (0-100)
        confidence: f64,
        
        /// Entry price
        entry_price: f64,
        
        /// Stop loss price
        stop_loss_price: f64,
        
        /// Take profit price
        take_profit_price: f64,
        
        /// Source agent
        source: String,
    },
    
    /// Market data message
    MarketData {
        /// Symbol
        symbol: String,
        
        /// Current price
        price: f64,
        
        /// Timestamp
        timestamp: i64,
        
        /// Volume
        volume: f64,
        
        /// Open price
        open: f64,
        
        /// High price
        high: f64,
        
        /// Low price
        low: f64,
        
        /// Close price
        close: f64,
    },
    
    /// Risk assessment message
    RiskAssessment {
        /// Symbol
        symbol: String,
        
        /// Risk score (0-100)
        risk_score: f64,
        
        /// Volatility
        volatility: f64,
        
        /// Market trend
        trend: f64,
        
        /// Liquidity
        liquidity: f64,
        
        /// Source agent
        source: String,
    },
    
    /// Quantum prediction message
    QuantumPrediction {
        /// Symbol
        symbol: String,
        
        /// Predicted price
        predicted_price: f64,
        
        /// Confidence score (0-100)
        confidence: f64,
        
        /// Prediction horizon in seconds
        horizon: u64,
        
        /// Quantum entropy
        entropy: f64,
        
        /// Source agent
        source: String,
    },
    
    /// Pattern recognition message
    PatternRecognition {
        /// Symbol
        symbol: String,
        
        /// Pattern name
        pattern: String,
        
        /// Confidence score (0-100)
        confidence: f64,
        
        /// Price targets
        price_targets: Vec<f64>,
        
        /// Source agent
        source: String,
    },
    
    /// Agent status message
    AgentStatus {
        /// Agent name
        agent: String,
        
        /// Status (active/inactive)
        active: bool,
        
        /// Performance score
        performance: f64,
        
        /// Error count
        error_count: u32,
    },
    
    /// System command message
    SystemCommand {
        /// Command
        command: String,
        
        /// Parameters
        params: HashMap<String, String>,
    },
    
    /// Custom message
    Custom(String, Value),
}

/// Message bus
pub struct MessageBus {
    /// Queued messages
    messages: Vec<Message>,
    
    /// Subscriptions
    subscriptions: HashMap<String, Vec<String>>,
}

impl MessageBus {
    /// Create a new message bus
    pub fn new() -> Self {
        Self {
            messages: Vec::new(),
            subscriptions: HashMap::new(),
        }
    }
    
    /// Send a message
    pub fn send(&mut self, message: Message) {
        self.messages.push(message);
    }
    
    /// Subscribe to messages
    pub fn subscribe(&mut self, agent: &str, message_type: &str) {
        self.subscriptions.entry(message_type.to_string())
            .or_insert_with(Vec::new)
            .push(agent.to_string());
    }
    
    /// Get messages for agent
    pub fn get_messages_for_agent(&mut self, agent: &str) -> Vec<Message> {
        let mut agent_messages = Vec::new();
        let mut remaining_messages = Vec::new();
        
        for message in self.messages.drain(..) {
            let message_type = match &message {
                Message::TradeSignal { .. } => "trade_signal",
                Message::MarketData { .. } => "market_data",
                Message::RiskAssessment { .. } => "risk_assessment",
                Message::QuantumPrediction { .. } => "quantum_prediction",
                Message::PatternRecognition { .. } => "pattern_recognition",
                Message::AgentStatus { .. } => "agent_status",
                Message::SystemCommand { .. } => "system_command",
                Message::Custom(msg_type, _) => msg_type,
            };
            
            let subscribers = self.subscriptions.get(message_type).cloned().unwrap_or_default();
            
            if subscribers.contains(&agent.to_string()) {
                agent_messages.push(message);
            } else {
                remaining_messages.push(message);
            }
        }
        
        self.messages = remaining_messages;
        agent_messages
    }
    
    /// Clear all messages
    pub fn clear(&mut self) {
        self.messages.clear();
    }
}
