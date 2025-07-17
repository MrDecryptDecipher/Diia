//! Alerting System
//!
//! Provides comprehensive alerting capabilities for the trading system
//! including email, webhook, and log-based notifications.

use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::{RwLock, mpsc};
use tracing::{info, warn, error, debug};
use serde::{Serialize, Deserialize};
use anyhow::{Result, anyhow};
use reqwest::Client;

/// Alert severity levels
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
pub enum AlertSeverity {
    /// Informational alerts
    Info,
    
    /// Warning alerts
    Warning,
    
    /// Critical alerts requiring immediate attention
    Critical,
    
    /// Emergency alerts for system failures
    Emergency,
}

impl AlertSeverity {
    /// Get severity name
    pub fn name(&self) -> &'static str {
        match self {
            AlertSeverity::Info => "INFO",
            AlertSeverity::Warning => "WARNING",
            AlertSeverity::Critical => "CRITICAL",
            AlertSeverity::Emergency => "EMERGENCY",
        }
    }
    
    /// Get emoji for severity
    pub fn emoji(&self) -> &'static str {
        match self {
            AlertSeverity::Info => "ℹ️",
            AlertSeverity::Warning => "⚠️",
            AlertSeverity::Critical => "🚨",
            AlertSeverity::Emergency => "🔥",
        }
    }
}

/// Alert categories
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum AlertCategory {
    /// System health alerts
    SystemHealth,
    
    /// Trading performance alerts
    TradingPerformance,
    
    /// Risk management alerts
    RiskManagement,
    
    /// API connectivity alerts
    ApiConnectivity,
    
    /// Capital management alerts
    CapitalManagement,
    
    /// Security alerts
    Security,
    
    /// Performance alerts
    Performance,
    
    /// Configuration alerts
    Configuration,
}

impl AlertCategory {
    /// Get category name
    pub fn name(&self) -> &'static str {
        match self {
            AlertCategory::SystemHealth => "System Health",
            AlertCategory::TradingPerformance => "Trading Performance",
            AlertCategory::RiskManagement => "Risk Management",
            AlertCategory::ApiConnectivity => "API Connectivity",
            AlertCategory::CapitalManagement => "Capital Management",
            AlertCategory::Security => "Security",
            AlertCategory::Performance => "Performance",
            AlertCategory::Configuration => "Configuration",
        }
    }
}

/// Alert message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Alert {
    /// Unique alert ID
    pub id: String,
    
    /// Alert title
    pub title: String,
    
    /// Alert message
    pub message: String,
    
    /// Alert severity
    pub severity: AlertSeverity,
    
    /// Alert category
    pub category: AlertCategory,
    
    /// Component that generated the alert
    pub component: String,
    
    /// Alert timestamp
    pub timestamp: chrono::DateTime<chrono::Utc>,
    
    /// Alert metadata
    pub metadata: HashMap<String, String>,
    
    /// Alert tags
    pub tags: Vec<String>,
    
    /// Whether alert has been acknowledged
    pub acknowledged: bool,
    
    /// Acknowledgment timestamp
    pub acknowledged_at: Option<chrono::DateTime<chrono::Utc>>,
    
    /// Who acknowledged the alert
    pub acknowledged_by: Option<String>,
}

impl Alert {
    /// Create new alert
    pub fn new(
        title: String,
        message: String,
        severity: AlertSeverity,
        category: AlertCategory,
        component: String,
    ) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            title,
            message,
            severity,
            category,
            component,
            timestamp: chrono::Utc::now(),
            metadata: HashMap::new(),
            tags: Vec::new(),
            acknowledged: false,
            acknowledged_at: None,
            acknowledged_by: None,
        }
    }
    
    /// Add metadata
    pub fn with_metadata(mut self, key: String, value: String) -> Self {
        self.metadata.insert(key, value);
        self
    }
    
    /// Add tag
    pub fn with_tag(mut self, tag: String) -> Self {
        self.tags.push(tag);
        self
    }
    
    /// Acknowledge alert
    pub fn acknowledge(&mut self, acknowledged_by: String) {
        self.acknowledged = true;
        self.acknowledged_at = Some(chrono::Utc::now());
        self.acknowledged_by = Some(acknowledged_by);
    }
    
    /// Get formatted message
    pub fn formatted_message(&self) -> String {
        format!(
            "{} [{}] {} - {}\nComponent: {}\nTime: {}\nSeverity: {}",
            self.severity.emoji(),
            self.category.name(),
            self.title,
            self.message,
            self.component,
            self.timestamp.format("%Y-%m-%d %H:%M:%S UTC"),
            self.severity.name()
        )
    }
}

/// Alert channel configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlertChannelConfig {
    /// Channel name
    pub name: String,
    
    /// Channel type
    pub channel_type: AlertChannelType,
    
    /// Minimum severity to send alerts
    pub min_severity: AlertSeverity,
    
    /// Categories to include
    pub categories: Vec<AlertCategory>,
    
    /// Rate limiting (max alerts per minute)
    pub rate_limit: Option<u32>,
    
    /// Channel-specific configuration
    pub config: HashMap<String, String>,
    
    /// Whether channel is enabled
    pub enabled: bool,
}

/// Alert channel types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AlertChannelType {
    /// Log-based alerts
    Log,
    
    /// Email alerts
    Email,
    
    /// Webhook alerts
    Webhook,
    
    /// Slack alerts
    Slack,
    
    /// Discord alerts
    Discord,
    
    /// SMS alerts
    Sms,
    
    /// Console output
    Console,
}

/// Alert statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlertStats {
    /// Total alerts sent
    pub total_alerts: u64,
    
    /// Alerts by severity
    pub alerts_by_severity: HashMap<AlertSeverity, u64>,
    
    /// Alerts by category
    pub alerts_by_category: HashMap<AlertCategory, u64>,
    
    /// Alerts by component
    pub alerts_by_component: HashMap<String, u64>,
    
    /// Average alerts per hour
    pub avg_alerts_per_hour: f64,
    
    /// Acknowledged alerts
    pub acknowledged_alerts: u64,
    
    /// Unacknowledged alerts
    pub unacknowledged_alerts: u64,
}

/// Alerting system
pub struct AlertingSystem {
    /// Alert channels
    channels: Arc<RwLock<Vec<AlertChannelConfig>>>,
    
    /// Alert history
    alert_history: Arc<RwLock<Vec<Alert>>>,
    
    /// Alert statistics
    stats: Arc<RwLock<AlertStats>>,
    
    /// HTTP client for webhooks
    http_client: Client,
    
    /// Alert queue
    alert_sender: mpsc::UnboundedSender<Alert>,
    alert_receiver: Arc<RwLock<Option<mpsc::UnboundedReceiver<Alert>>>>,
    
    /// Rate limiting
    rate_limits: Arc<RwLock<HashMap<String, (Instant, u32)>>>,
}

impl AlertingSystem {
    /// Create new alerting system
    pub fn new() -> Self {
        let (alert_sender, alert_receiver) = mpsc::unbounded_channel();
        
        let alerting_system = Self {
            channels: Arc::new(RwLock::new(Vec::new())),
            alert_history: Arc::new(RwLock::new(Vec::new())),
            stats: Arc::new(RwLock::new(AlertStats {
                total_alerts: 0,
                alerts_by_severity: HashMap::new(),
                alerts_by_category: HashMap::new(),
                alerts_by_component: HashMap::new(),
                avg_alerts_per_hour: 0.0,
                acknowledged_alerts: 0,
                unacknowledged_alerts: 0,
            })),
            http_client: Client::new(),
            alert_sender,
            alert_receiver: Arc::new(RwLock::new(Some(alert_receiver))),
            rate_limits: Arc::new(RwLock::new(HashMap::new())),
        };
        
        // Start alert processor
        alerting_system.start_alert_processor();
        
        alerting_system
    }
    
    /// Add alert channel
    pub async fn add_channel(&self, channel: AlertChannelConfig) {
        let mut channels = self.channels.write().await;
        channels.push(channel.clone());
        info!("📢 Added alert channel: {} ({})", channel.name, channel.channel_type.name());
    }
    
    /// Send alert
    pub async fn send_alert(&self, alert: Alert) -> Result<()> {
        let _ = self.alert_sender.send(alert);
        Ok(())
    }
    
    /// Send simple alert
    pub async fn alert(
        &self,
        title: String,
        message: String,
        severity: AlertSeverity,
        category: AlertCategory,
        component: String,
    ) -> Result<()> {
        let alert = Alert::new(title, message, severity, category, component);
        self.send_alert(alert).await
    }
    
    /// Send critical alert
    pub async fn critical_alert(
        &self,
        title: String,
        message: String,
        component: String,
    ) -> Result<()> {
        self.alert(
            title,
            message,
            AlertSeverity::Critical,
            AlertCategory::SystemHealth,
            component,
        ).await
    }
    
    /// Send emergency alert
    pub async fn emergency_alert(
        &self,
        title: String,
        message: String,
        component: String,
    ) -> Result<()> {
        self.alert(
            title,
            message,
            AlertSeverity::Emergency,
            AlertCategory::SystemHealth,
            component,
        ).await
    }
    
    /// Get alert history
    pub async fn get_alert_history(&self, limit: Option<usize>) -> Vec<Alert> {
        let history = self.alert_history.read().await;
        let limit = limit.unwrap_or(history.len());
        history.iter().rev().take(limit).cloned().collect()
    }
    
    /// Get unacknowledged alerts
    pub async fn get_unacknowledged_alerts(&self) -> Vec<Alert> {
        let history = self.alert_history.read().await;
        history.iter()
            .filter(|alert| !alert.acknowledged)
            .cloned()
            .collect()
    }
    
    /// Acknowledge alert
    pub async fn acknowledge_alert(&self, alert_id: &str, acknowledged_by: String) -> Result<()> {
        let mut history = self.alert_history.write().await;
        let mut stats = self.stats.write().await;
        
        if let Some(alert) = history.iter_mut().find(|a| a.id == alert_id) {
            if !alert.acknowledged {
                alert.acknowledge(acknowledged_by);
                stats.acknowledged_alerts += 1;
                stats.unacknowledged_alerts = stats.unacknowledged_alerts.saturating_sub(1);
                info!("✅ Alert acknowledged: {}", alert_id);
            }
            Ok(())
        } else {
            Err(anyhow!("Alert not found: {}", alert_id))
        }
    }
    
    /// Get alert statistics
    pub async fn get_stats(&self) -> AlertStats {
        self.stats.read().await.clone()
    }
    
    /// Start alert processor
    fn start_alert_processor(&self) {
        let channels = Arc::clone(&self.channels);
        let alert_history = Arc::clone(&self.alert_history);
        let stats = Arc::clone(&self.stats);
        let http_client = self.http_client.clone();
        let rate_limits = Arc::clone(&self.rate_limits);
        let alert_receiver = Arc::clone(&self.alert_receiver);
        
        tokio::spawn(async move {
            let mut receiver = alert_receiver.write().await.take().unwrap();
            
            while let Some(alert) = receiver.recv().await {
                // Process alert
                Self::process_alert(
                    &alert,
                    &channels,
                    &alert_history,
                    &stats,
                    &http_client,
                    &rate_limits,
                ).await;
            }
        });
    }
    
    /// Process individual alert
    async fn process_alert(
        alert: &Alert,
        channels: &Arc<RwLock<Vec<AlertChannelConfig>>>,
        alert_history: &Arc<RwLock<Vec<Alert>>>,
        stats: &Arc<RwLock<AlertStats>>,
        http_client: &Client,
        rate_limits: &Arc<RwLock<HashMap<String, (Instant, u32)>>>,
    ) {
        // Store alert in history
        {
            let mut history = alert_history.write().await;
            history.push(alert.clone());
            
            // Keep only last 10000 alerts
            if history.len() > 10000 {
                history.remove(0);
            }
        }
        
        // Update statistics
        {
            let mut stats_guard = stats.write().await;
            stats_guard.total_alerts += 1;
            stats_guard.unacknowledged_alerts += 1;
            
            *stats_guard.alerts_by_severity.entry(alert.severity.clone()).or_insert(0) += 1;
            *stats_guard.alerts_by_category.entry(alert.category.clone()).or_insert(0) += 1;
            *stats_guard.alerts_by_component.entry(alert.component.clone()).or_insert(0) += 1;
        }
        
        // Send to channels
        let channels_guard = channels.read().await;
        for channel in channels_guard.iter() {
            if channel.enabled && 
               alert.severity >= channel.min_severity &&
               (channel.categories.is_empty() || channel.categories.contains(&alert.category)) {
                
                // Check rate limiting
                if let Some(rate_limit) = channel.rate_limit {
                    let mut rate_limits_guard = rate_limits.write().await;
                    let (last_reset, count) = rate_limits_guard
                        .entry(channel.name.clone())
                        .or_insert((Instant::now(), 0));
                    
                    if last_reset.elapsed() > Duration::from_secs(60) {
                        *last_reset = Instant::now();
                        *count = 0;
                    }
                    
                    if *count >= rate_limit {
                        debug!("Rate limit exceeded for channel: {}", channel.name);
                        continue;
                    }
                    
                    *count += 1;
                }
                
                // Send alert to channel
                if let Err(e) = Self::send_to_channel(alert, channel, http_client).await {
                    error!("Failed to send alert to channel {}: {}", channel.name, e);
                }
            }
        }
    }
    
    /// Send alert to specific channel
    async fn send_to_channel(
        alert: &Alert,
        channel: &AlertChannelConfig,
        http_client: &Client,
    ) -> Result<()> {
        match channel.channel_type {
            AlertChannelType::Log => {
                match alert.severity {
                    AlertSeverity::Emergency | AlertSeverity::Critical => {
                        error!("{}", alert.formatted_message());
                    }
                    AlertSeverity::Warning => {
                        warn!("{}", alert.formatted_message());
                    }
                    AlertSeverity::Info => {
                        info!("{}", alert.formatted_message());
                    }
                }
            }
            AlertChannelType::Console => {
                println!("{}", alert.formatted_message());
            }
            AlertChannelType::Webhook => {
                if let Some(url) = channel.config.get("url") {
                    let payload = serde_json::json!({
                        "alert": alert,
                        "formatted_message": alert.formatted_message()
                    });
                    
                    let response = http_client
                        .post(url)
                        .json(&payload)
                        .timeout(Duration::from_secs(10))
                        .send()
                        .await?;
                    
                    if !response.status().is_success() {
                        return Err(anyhow!("Webhook returned status: {}", response.status()));
                    }
                }
            }
            AlertChannelType::Email => {
                // Email implementation would go here
                debug!("Email alert: {}", alert.title);
            }
            AlertChannelType::Slack => {
                // Slack implementation would go here
                debug!("Slack alert: {}", alert.title);
            }
            AlertChannelType::Discord => {
                // Discord implementation would go here
                debug!("Discord alert: {}", alert.title);
            }
            AlertChannelType::Sms => {
                // SMS implementation would go here
                debug!("SMS alert: {}", alert.title);
            }
        }
        
        Ok(())
    }
}

impl AlertChannelType {
    /// Get channel type name
    pub fn name(&self) -> &'static str {
        match self {
            AlertChannelType::Log => "log",
            AlertChannelType::Email => "email",
            AlertChannelType::Webhook => "webhook",
            AlertChannelType::Slack => "slack",
            AlertChannelType::Discord => "discord",
            AlertChannelType::Sms => "sms",
            AlertChannelType::Console => "console",
        }
    }
}

impl Default for AlertingSystem {
    fn default() -> Self {
        Self::new()
    }
}

/// Create default alerting system with basic channels
pub async fn create_default_alerting_system() -> AlertingSystem {
    let alerting_system = AlertingSystem::new();
    
    // Add console channel for all alerts
    alerting_system.add_channel(AlertChannelConfig {
        name: "console".to_string(),
        channel_type: AlertChannelType::Console,
        min_severity: AlertSeverity::Info,
        categories: vec![],
        rate_limit: None,
        config: HashMap::new(),
        enabled: true,
    }).await;
    
    // Add log channel for warnings and above
    alerting_system.add_channel(AlertChannelConfig {
        name: "log".to_string(),
        channel_type: AlertChannelType::Log,
        min_severity: AlertSeverity::Warning,
        categories: vec![],
        rate_limit: Some(100), // Max 100 alerts per minute
        config: HashMap::new(),
        enabled: true,
    }).await;
    
    alerting_system
}
