//! Message Bus Module for OMNI Trading System
//!
//! This module provides inter-agent communication and message routing capabilities.

use std::collections::{HashMap, VecDeque};
use std::sync::{Arc, Mutex};
use serde::{Deserialize, Serialize};
use anyhow::Result;
use tokio::sync::broadcast;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TradeDirection {
    Buy,
    Sell,
    Hold,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MessageType {
    MarketData,
    TradeSignal,
    RiskAlert,
    PerformanceUpdate,
    SystemStatus,
    AgentCommunication,
    EmergencyStop,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub id: String,
    pub message_type: MessageType,
    pub sender: String,
    pub recipient: Option<String>, // None for broadcast
    pub payload: HashMap<String, String>,
    pub timestamp: u64,
    pub priority: u8, // 0 = highest, 255 = lowest
}

impl Message {
    pub fn new(
        message_type: MessageType,
        sender: String,
        recipient: Option<String>,
        payload: HashMap<String, String>,
    ) -> Self {
        let id = format!("msg_{}_{}", 
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos(),
            rand::random::<u32>()
        );
        
        let timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        let priority = match message_type {
            MessageType::EmergencyStop => 0,
            MessageType::RiskAlert => 1,
            MessageType::TradeSignal => 2,
            MessageType::MarketData => 3,
            MessageType::PerformanceUpdate => 4,
            MessageType::SystemStatus => 5,
            MessageType::AgentCommunication => 6,
        };

        Self {
            id,
            message_type,
            sender,
            recipient,
            payload,
            timestamp,
            priority,
        }
    }

    pub fn create_market_data_message(
        sender: String,
        symbol: String,
        price: f64,
        volume: f64,
    ) -> Self {
        let mut payload = HashMap::new();
        payload.insert("symbol".to_string(), symbol);
        payload.insert("price".to_string(), price.to_string());
        payload.insert("volume".to_string(), volume.to_string());

        Self::new(MessageType::MarketData, sender, None, payload)
    }

    pub fn create_trade_signal_message(
        sender: String,
        recipient: Option<String>,
        symbol: String,
        direction: TradeDirection,
        quantity: f64,
        confidence: f64,
    ) -> Self {
        let mut payload = HashMap::new();
        payload.insert("symbol".to_string(), symbol);
        payload.insert("direction".to_string(), format!("{:?}", direction));
        payload.insert("quantity".to_string(), quantity.to_string());
        payload.insert("confidence".to_string(), confidence.to_string());

        Self::new(MessageType::TradeSignal, sender, recipient, payload)
    }

    pub fn create_risk_alert_message(
        sender: String,
        alert_type: String,
        description: String,
        severity: u8,
    ) -> Self {
        let mut payload = HashMap::new();
        payload.insert("alert_type".to_string(), alert_type);
        payload.insert("description".to_string(), description);
        payload.insert("severity".to_string(), severity.to_string());

        Self::new(MessageType::RiskAlert, sender, None, payload)
    }

    pub fn create_emergency_stop_message(sender: String, reason: String) -> Self {
        let mut payload = HashMap::new();
        payload.insert("reason".to_string(), reason);

        Self::new(MessageType::EmergencyStop, sender, None, payload)
    }
}

#[derive(Debug, Clone)]
pub struct MessageBus {
    message_queue: Arc<Mutex<VecDeque<Message>>>,
    subscribers: Arc<Mutex<HashMap<String, Vec<String>>>>, // message_type -> agent_ids
    broadcast_sender: broadcast::Sender<Message>,
    message_history: Arc<Mutex<VecDeque<Message>>>,
    max_history_size: usize,
}

impl MessageBus {
    pub fn new() -> Self {
        let (broadcast_sender, _) = broadcast::channel(1000);
        
        Self {
            message_queue: Arc::new(Mutex::new(VecDeque::new())),
            subscribers: Arc::new(Mutex::new(HashMap::new())),
            broadcast_sender,
            message_history: Arc::new(Mutex::new(VecDeque::new())),
            max_history_size: 10000,
        }
    }

    pub async fn publish(&self, message: Message) -> Result<()> {
        // Add to message queue
        {
            let mut queue = self.message_queue.lock().unwrap();
            queue.push_back(message.clone());
            
            // Sort by priority (lower number = higher priority)
            let mut messages: Vec<Message> = queue.drain(..).collect();
            messages.sort_by_key(|m| m.priority);
            queue.extend(messages);
        }

        // Add to history
        {
            let mut history = self.message_history.lock().unwrap();
            history.push_back(message.clone());
            
            // Limit history size
            while history.len() > self.max_history_size {
                history.pop_front();
            }
        }

        // Broadcast to all subscribers
        let _ = self.broadcast_sender.send(message);

        Ok(())
    }

    pub async fn subscribe(&self, agent_id: String, message_types: Vec<MessageType>) -> Result<broadcast::Receiver<Message>> {
        let mut subscribers = self.subscribers.lock().unwrap();
        
        for message_type in message_types {
            let type_key = format!("{:?}", message_type);
            subscribers.entry(type_key).or_insert_with(Vec::new).push(agent_id.clone());
        }

        Ok(self.broadcast_sender.subscribe())
    }

    pub async fn unsubscribe(&self, agent_id: String) -> Result<()> {
        let mut subscribers = self.subscribers.lock().unwrap();
        
        for (_, agent_list) in subscribers.iter_mut() {
            agent_list.retain(|id| id != &agent_id);
        }

        Ok(())
    }

    pub async fn get_next_message(&self) -> Option<Message> {
        let mut queue = self.message_queue.lock().unwrap();
        queue.pop_front()
    }

    pub async fn get_messages_for_agent(&self, agent_id: &str) -> Vec<Message> {
        let queue = self.message_queue.lock().unwrap();
        
        queue.iter()
            .filter(|msg| {
                msg.recipient.as_ref().map_or(true, |recipient| recipient == agent_id)
            })
            .cloned()
            .collect()
    }

    pub async fn get_message_history(&self, limit: Option<usize>) -> Vec<Message> {
        let history = self.message_history.lock().unwrap();
        
        let messages: Vec<Message> = history.iter().cloned().collect();
        
        if let Some(limit) = limit {
            messages.into_iter().rev().take(limit).collect()
        } else {
            messages
        }
    }

    pub async fn clear_queue(&self) {
        let mut queue = self.message_queue.lock().unwrap();
        queue.clear();
    }

    pub async fn get_queue_size(&self) -> usize {
        let queue = self.message_queue.lock().unwrap();
        queue.len()
    }

    pub async fn get_subscribers_count(&self) -> usize {
        let subscribers = self.subscribers.lock().unwrap();
        subscribers.values().map(|v| v.len()).sum()
    }

    pub async fn broadcast_emergency_stop(&self, reason: String) -> Result<()> {
        let message = Message::create_emergency_stop_message("system".to_string(), reason);
        self.publish(message).await
    }

    pub async fn broadcast_market_data(&self, symbol: String, price: f64, volume: f64) -> Result<()> {
        let message = Message::create_market_data_message(
            "market_data_feed".to_string(),
            symbol,
            price,
            volume,
        );
        self.publish(message).await
    }

    pub async fn send_trade_signal(
        &self,
        sender: String,
        recipient: Option<String>,
        symbol: String,
        direction: TradeDirection,
        quantity: f64,
        confidence: f64,
    ) -> Result<()> {
        let message = Message::create_trade_signal_message(
            sender,
            recipient,
            symbol,
            direction,
            quantity,
            confidence,
        );
        self.publish(message).await
    }

    pub async fn send_risk_alert(
        &self,
        sender: String,
        alert_type: String,
        description: String,
        severity: u8,
    ) -> Result<()> {
        let message = Message::create_risk_alert_message(sender, alert_type, description, severity);
        self.publish(message).await
    }
}

impl Default for MessageBus {
    fn default() -> Self {
        Self::new()
    }
}
