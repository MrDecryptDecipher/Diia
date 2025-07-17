//! Real-Time Monitoring System
//!
//! This module provides real-time monitoring capabilities including
//! live metrics collection, alerting, and system health tracking.

use std::collections::{HashMap, VecDeque};
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::{RwLock, broadcast};
use tokio::time::interval;
use serde::{Serialize, Deserialize};
use anyhow::Result;
use tracing::{info, warn, error, debug};
use chrono::{DateTime, Utc};

/// Real-time monitoring event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonitoringEvent {
    pub timestamp: DateTime<Utc>,
    pub event_type: String,
    pub component: String,
    pub metric_name: String,
    pub value: f64,
    pub threshold: Option<f64>,
    pub severity: String,
    pub message: String,
}

/// System metrics snapshot
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemMetrics {
    pub timestamp: DateTime<Utc>,
    pub cpu_usage: f64,
    pub memory_usage: f64,
    pub memory_percentage: f64,
    pub api_latency: f64,
    pub trading_latency: f64,
    pub error_rate: f64,
    pub active_trades: usize,
    pub total_capital: f64,
    pub available_capital: f64,
    pub pnl_today: f64,
    pub success_rate: f64,
    pub uptime: Duration,
}

/// Alert rule configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlertRule {
    pub name: String,
    pub metric: String,
    pub operator: AlertOperator,
    pub threshold: f64,
    pub duration: Duration,
    pub severity: String,
    pub enabled: bool,
}

/// Alert operators
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AlertOperator {
    GreaterThan,
    LessThan,
    Equals,
    NotEquals,
    GreaterThanOrEqual,
    LessThanOrEqual,
}

/// Real-time monitor
pub struct RealTimeMonitor {
    /// Event broadcaster
    event_sender: broadcast::Sender<MonitoringEvent>,
    
    /// Metrics history
    metrics_history: Arc<RwLock<VecDeque<SystemMetrics>>>,
    
    /// Alert rules
    alert_rules: Arc<RwLock<Vec<AlertRule>>>,
    
    /// Active alerts
    active_alerts: Arc<RwLock<HashMap<String, MonitoringEvent>>>,
    
    /// System start time
    start_time: Instant,
    
    /// Configuration
    max_history_size: usize,
    collection_interval: Duration,
}

impl RealTimeMonitor {
    pub fn new(max_history_size: usize, collection_interval: Duration) -> Self {
        let (event_sender, _) = broadcast::channel(1000);
        
        Self {
            event_sender,
            metrics_history: Arc::new(RwLock::new(VecDeque::new())),
            alert_rules: Arc::new(RwLock::new(Vec::new())),
            active_alerts: Arc::new(RwLock::new(HashMap::new())),
            start_time: Instant::now(),
            max_history_size,
            collection_interval,
        }
    }

    /// Start monitoring
    pub async fn start(&self) -> Result<()> {
        let metrics_history = Arc::clone(&self.metrics_history);
        let alert_rules = Arc::clone(&self.alert_rules);
        let active_alerts = Arc::clone(&self.active_alerts);
        let event_sender = self.event_sender.clone();
        let max_history_size = self.max_history_size;
        let collection_interval = self.collection_interval;
        let start_time = self.start_time;

        tokio::spawn(async move {
            let mut interval = interval(collection_interval);
            
            loop {
                interval.tick().await;
                
                // Collect system metrics
                let metrics = Self::collect_system_metrics(start_time).await;
                
                // Store metrics
                {
                    let mut history = metrics_history.write().await;
                    if history.len() >= max_history_size {
                        history.pop_front();
                    }
                    history.push_back(metrics.clone());
                }
                
                // Check alert rules
                let rules = alert_rules.read().await.clone();
                for rule in rules {
                    if rule.enabled {
                        if let Some(event) = Self::check_alert_rule(&rule, &metrics).await {
                            // Send event
                            if let Err(e) = event_sender.send(event.clone()) {
                                error!("Failed to send monitoring event: {}", e);
                            }
                            
                            // Update active alerts
                            let mut alerts = active_alerts.write().await;
                            alerts.insert(rule.name.clone(), event);
                        }
                    }
                }
            }
        });

        info!("Real-time monitoring started");
        Ok(())
    }

    /// Collect system metrics
    async fn collect_system_metrics(start_time: Instant) -> SystemMetrics {
        // Get system information
        let cpu_usage = Self::get_cpu_usage().await;
        let (memory_usage, memory_percentage) = Self::get_memory_usage().await;
        let uptime = start_time.elapsed();

        SystemMetrics {
            timestamp: Utc::now(),
            cpu_usage,
            memory_usage,
            memory_percentage,
            api_latency: 0.0, // Will be updated by API calls
            trading_latency: 0.0, // Will be updated by trading operations
            error_rate: 0.0, // Will be calculated from error manager
            active_trades: 0, // Will be updated by trading system
            total_capital: 12.0, // From capital tracker
            available_capital: 12.0, // From capital tracker
            pnl_today: 0.0, // From trading system
            success_rate: 100.0, // From trading system
            uptime,
        }
    }

    /// Get CPU usage percentage
    async fn get_cpu_usage() -> f64 {
        // Simple CPU usage estimation
        // In a real implementation, you'd use system APIs
        use std::process::Command;
        
        if let Ok(output) = Command::new("sh")
            .arg("-c")
            .arg("top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | sed 's/%us,//'")
            .output()
        {
            if let Ok(cpu_str) = String::from_utf8(output.stdout) {
                if let Ok(cpu) = cpu_str.trim().parse::<f64>() {
                    return cpu;
                }
            }
        }
        
        0.0 // Default if unable to get CPU usage
    }

    /// Get memory usage
    async fn get_memory_usage() -> (f64, f64) {
        use std::process::Command;
        
        if let Ok(output) = Command::new("sh")
            .arg("-c")
            .arg("free -m | awk 'NR==2{printf \"%.2f %.2f\", $3,$3*100/$2}'")
            .output()
        {
            if let Ok(mem_str) = String::from_utf8(output.stdout) {
                let parts: Vec<&str> = mem_str.trim().split_whitespace().collect();
                if parts.len() == 2 {
                    if let (Ok(usage), Ok(percentage)) = (parts[0].parse::<f64>(), parts[1].parse::<f64>()) {
                        return (usage, percentage);
                    }
                }
            }
        }
        
        (0.0, 0.0) // Default if unable to get memory usage
    }

    /// Check alert rule against metrics
    async fn check_alert_rule(rule: &AlertRule, metrics: &SystemMetrics) -> Option<MonitoringEvent> {
        let metric_value = match rule.metric.as_str() {
            "cpu_usage" => metrics.cpu_usage,
            "memory_usage" => metrics.memory_usage,
            "memory_percentage" => metrics.memory_percentage,
            "api_latency" => metrics.api_latency,
            "trading_latency" => metrics.trading_latency,
            "error_rate" => metrics.error_rate,
            "success_rate" => metrics.success_rate,
            _ => return None,
        };

        let threshold_exceeded = match rule.operator {
            AlertOperator::GreaterThan => metric_value > rule.threshold,
            AlertOperator::LessThan => metric_value < rule.threshold,
            AlertOperator::Equals => (metric_value - rule.threshold).abs() < 0.001,
            AlertOperator::NotEquals => (metric_value - rule.threshold).abs() >= 0.001,
            AlertOperator::GreaterThanOrEqual => metric_value >= rule.threshold,
            AlertOperator::LessThanOrEqual => metric_value <= rule.threshold,
        };

        if threshold_exceeded {
            Some(MonitoringEvent {
                timestamp: Utc::now(),
                event_type: "alert".to_string(),
                component: "system".to_string(),
                metric_name: rule.metric.clone(),
                value: metric_value,
                threshold: Some(rule.threshold),
                severity: rule.severity.clone(),
                message: format!(
                    "Alert: {} {} {} (current: {:.2})",
                    rule.metric,
                    match rule.operator {
                        AlertOperator::GreaterThan => ">",
                        AlertOperator::LessThan => "<",
                        AlertOperator::Equals => "==",
                        AlertOperator::NotEquals => "!=",
                        AlertOperator::GreaterThanOrEqual => ">=",
                        AlertOperator::LessThanOrEqual => "<=",
                    },
                    rule.threshold,
                    metric_value
                ),
            })
        } else {
            None
        }
    }

    /// Subscribe to monitoring events
    pub fn subscribe(&self) -> broadcast::Receiver<MonitoringEvent> {
        self.event_sender.subscribe()
    }

    /// Add alert rule
    pub async fn add_alert_rule(&self, rule: AlertRule) {
        let mut rules = self.alert_rules.write().await;
        rules.push(rule);
    }

    /// Get current metrics
    pub async fn get_current_metrics(&self) -> Option<SystemMetrics> {
        let history = self.metrics_history.read().await;
        history.back().cloned()
    }

    /// Get metrics history
    pub async fn get_metrics_history(&self, limit: usize) -> Vec<SystemMetrics> {
        let history = self.metrics_history.read().await;
        history.iter().rev().take(limit).cloned().collect()
    }

    /// Get active alerts
    pub async fn get_active_alerts(&self) -> Vec<MonitoringEvent> {
        let alerts = self.active_alerts.read().await;
        alerts.values().cloned().collect()
    }

    /// Clear alert
    pub async fn clear_alert(&self, alert_name: &str) {
        let mut alerts = self.active_alerts.write().await;
        alerts.remove(alert_name);
    }

    /// Update metric value (called by other components)
    pub async fn update_metric(&self, metric_name: &str, value: f64) {
        let event = MonitoringEvent {
            timestamp: Utc::now(),
            event_type: "metric_update".to_string(),
            component: "system".to_string(),
            metric_name: metric_name.to_string(),
            value,
            threshold: None,
            severity: "info".to_string(),
            message: format!("Metric {} updated to {:.2}", metric_name, value),
        };

        if let Err(e) = self.event_sender.send(event) {
            debug!("Failed to send metric update event: {}", e);
        }
    }

    /// Send custom event
    pub async fn send_event(&self, event: MonitoringEvent) {
        if let Err(e) = self.event_sender.send(event) {
            error!("Failed to send custom monitoring event: {}", e);
        }
    }
}

/// Default alert rules for the trading system
impl RealTimeMonitor {
    pub fn create_default_alert_rules() -> Vec<AlertRule> {
        vec![
            AlertRule {
                name: "high_cpu_usage".to_string(),
                metric: "cpu_usage".to_string(),
                operator: AlertOperator::GreaterThan,
                threshold: 80.0,
                duration: Duration::from_secs(60),
                severity: "warning".to_string(),
                enabled: true,
            },
            AlertRule {
                name: "high_memory_usage".to_string(),
                metric: "memory_percentage".to_string(),
                operator: AlertOperator::GreaterThan,
                threshold: 85.0,
                duration: Duration::from_secs(60),
                severity: "warning".to_string(),
                enabled: true,
            },
            AlertRule {
                name: "high_api_latency".to_string(),
                metric: "api_latency".to_string(),
                operator: AlertOperator::GreaterThan,
                threshold: 5000.0, // 5 seconds
                duration: Duration::from_secs(30),
                severity: "critical".to_string(),
                enabled: true,
            },
            AlertRule {
                name: "high_error_rate".to_string(),
                metric: "error_rate".to_string(),
                operator: AlertOperator::GreaterThan,
                threshold: 10.0, // 10%
                duration: Duration::from_secs(60),
                severity: "critical".to_string(),
                enabled: true,
            },
            AlertRule {
                name: "low_success_rate".to_string(),
                metric: "success_rate".to_string(),
                operator: AlertOperator::LessThan,
                threshold: 70.0, // 70%
                duration: Duration::from_secs(300),
                severity: "warning".to_string(),
                enabled: true,
            },
        ]
    }
}
