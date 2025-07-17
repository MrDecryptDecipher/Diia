//! Performance Monitoring and Optimization System
//!
//! This module provides comprehensive performance monitoring, memory management,
//! and system optimization capabilities for the OMNI-ALPHA VΩ∞∞ trading system.

use std::time::{Duration, Instant};
use std::collections::{HashMap, VecDeque};
use std::sync::Arc;
use tokio::sync::RwLock;
use serde::{Serialize, Deserialize};
use anyhow::Result;
use tracing::{info, warn, error, debug};

/// Performance metrics for system monitoring
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceMetrics {
    /// CPU usage percentage
    pub cpu_usage: f64,
    
    /// Memory usage in MB
    pub memory_usage: f64,
    
    /// Memory usage percentage
    pub memory_percentage: f64,
    
    /// API call latency (ms)
    pub api_latency: f64,
    
    /// Analysis processing time (ms)
    pub analysis_time: f64,
    
    /// Decision making time (ms)
    pub decision_time: f64,
    
    /// Total system throughput (operations/second)
    pub throughput: f64,
    
    /// Error rate percentage
    pub error_rate: f64,
    
    /// Active connections count
    pub active_connections: usize,
    
    /// Cache hit rate percentage
    pub cache_hit_rate: f64,
    
    /// Timestamp
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

/// Performance thresholds for alerting
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceThresholds {
    /// Maximum CPU usage percentage
    pub max_cpu_usage: f64,
    
    /// Maximum memory usage percentage
    pub max_memory_usage: f64,
    
    /// Maximum API latency (ms)
    pub max_api_latency: f64,
    
    /// Maximum analysis time (ms)
    pub max_analysis_time: f64,
    
    /// Maximum error rate percentage
    pub max_error_rate: f64,
    
    /// Minimum cache hit rate percentage
    pub min_cache_hit_rate: f64,
}

impl Default for PerformanceThresholds {
    fn default() -> Self {
        Self {
            max_cpu_usage: 80.0,
            max_memory_usage: 85.0,
            max_api_latency: 5000.0,
            max_analysis_time: 10000.0,
            max_error_rate: 5.0,
            min_cache_hit_rate: 80.0,
        }
    }
}

/// Performance alert
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceAlert {
    /// Alert type
    pub alert_type: AlertType,
    
    /// Alert message
    pub message: String,
    
    /// Current value
    pub current_value: f64,
    
    /// Threshold value
    pub threshold_value: f64,
    
    /// Severity level
    pub severity: AlertSeverity,
    
    /// Timestamp
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

/// Alert types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AlertType {
    HighCpuUsage,
    HighMemoryUsage,
    HighApiLatency,
    HighAnalysisTime,
    HighErrorRate,
    LowCacheHitRate,
    SystemOverload,
}

/// Alert severity levels
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AlertSeverity {
    Info,
    Warning,
    Critical,
}

/// Memory management statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryStats {
    /// Total allocated memory (bytes)
    pub total_allocated: usize,
    
    /// Currently used memory (bytes)
    pub used_memory: usize,
    
    /// Available memory (bytes)
    pub available_memory: usize,
    
    /// Memory fragmentation percentage
    pub fragmentation: f64,
    
    /// Garbage collection count
    pub gc_count: usize,
    
    /// Last GC duration (ms)
    pub last_gc_duration: f64,
}

/// Performance monitor
pub struct PerformanceMonitor {
    /// Performance metrics history
    metrics_history: Arc<RwLock<VecDeque<PerformanceMetrics>>>,
    
    /// Performance thresholds
    thresholds: PerformanceThresholds,
    
    /// Active alerts
    active_alerts: Arc<RwLock<Vec<PerformanceAlert>>>,
    
    /// Operation timers
    operation_timers: Arc<RwLock<HashMap<String, Instant>>>,
    
    /// Operation durations
    operation_durations: Arc<RwLock<HashMap<String, VecDeque<Duration>>>>,
    
    /// Error counts
    error_counts: Arc<RwLock<HashMap<String, usize>>>,
    
    /// Cache statistics
    cache_stats: Arc<RwLock<HashMap<String, (usize, usize)>>>, // (hits, misses)
    
    /// Maximum history size
    max_history_size: usize,
    
    /// Monitoring enabled
    enabled: bool,
}

impl PerformanceMonitor {
    /// Create new performance monitor
    pub fn new(thresholds: PerformanceThresholds) -> Self {
        Self {
            metrics_history: Arc::new(RwLock::new(VecDeque::new())),
            thresholds,
            active_alerts: Arc::new(RwLock::new(Vec::new())),
            operation_timers: Arc::new(RwLock::new(HashMap::new())),
            operation_durations: Arc::new(RwLock::new(HashMap::new())),
            error_counts: Arc::new(RwLock::new(HashMap::new())),
            cache_stats: Arc::new(RwLock::new(HashMap::new())),
            max_history_size: 1000,
            enabled: true,
        }
    }
    
    /// Start timing an operation
    pub async fn start_timer(&self, operation: &str) {
        if !self.enabled {
            return;
        }
        
        let mut timers = self.operation_timers.write().await;
        timers.insert(operation.to_string(), Instant::now());
    }
    
    /// End timing an operation
    pub async fn end_timer(&self, operation: &str) -> Option<Duration> {
        if !self.enabled {
            return None;
        }
        
        let mut timers = self.operation_timers.write().await;
        if let Some(start_time) = timers.remove(operation) {
            let duration = start_time.elapsed();
            
            // Store duration
            let mut durations = self.operation_durations.write().await;
            let op_durations = durations.entry(operation.to_string()).or_insert_with(VecDeque::new);
            op_durations.push_back(duration);
            
            // Keep only recent durations
            if op_durations.len() > 100 {
                op_durations.pop_front();
            }
            
            Some(duration)
        } else {
            None
        }
    }
    
    /// Record an error
    pub async fn record_error(&self, operation: &str) {
        if !self.enabled {
            return;
        }
        
        let mut errors = self.error_counts.write().await;
        *errors.entry(operation.to_string()).or_insert(0) += 1;
    }
    
    /// Record cache hit
    pub async fn record_cache_hit(&self, cache_name: &str) {
        if !self.enabled {
            return;
        }
        
        let mut stats = self.cache_stats.write().await;
        let (hits, misses) = stats.entry(cache_name.to_string()).or_insert((0, 0));
        *hits += 1;
    }
    
    /// Record cache miss
    pub async fn record_cache_miss(&self, cache_name: &str) {
        if !self.enabled {
            return;
        }
        
        let mut stats = self.cache_stats.write().await;
        let (hits, misses) = stats.entry(cache_name.to_string()).or_insert((0, 0));
        *misses += 1;
    }
    
    /// Collect current performance metrics
    pub async fn collect_metrics(&self) -> Result<PerformanceMetrics> {
        let cpu_usage = self.get_cpu_usage().await?;
        let (memory_usage, memory_percentage) = self.get_memory_usage().await?;
        let api_latency = self.get_average_duration("api_call").await;
        let analysis_time = self.get_average_duration("analysis").await;
        let decision_time = self.get_average_duration("decision").await;
        let throughput = self.calculate_throughput().await;
        let error_rate = self.calculate_error_rate().await;
        let active_connections = self.get_active_connections().await;
        let cache_hit_rate = self.calculate_cache_hit_rate().await;
        
        let metrics = PerformanceMetrics {
            cpu_usage,
            memory_usage,
            memory_percentage,
            api_latency,
            analysis_time,
            decision_time,
            throughput,
            error_rate,
            active_connections,
            cache_hit_rate,
            timestamp: chrono::Utc::now(),
        };
        
        // Store metrics
        let mut history = self.metrics_history.write().await;
        history.push_back(metrics.clone());
        
        // Keep only recent metrics
        if history.len() > self.max_history_size {
            history.pop_front();
        }
        
        // Check for alerts
        self.check_alerts(&metrics).await;
        
        Ok(metrics)
    }
    
    /// Get CPU usage percentage
    async fn get_cpu_usage(&self) -> Result<f64> {
        // Simplified CPU usage calculation
        // In a real implementation, you would use system APIs
        Ok(25.0) // Placeholder
    }
    
    /// Get memory usage
    async fn get_memory_usage(&self) -> Result<(f64, f64)> {
        // Simplified memory usage calculation
        // In a real implementation, you would use system APIs
        let used_mb = 512.0; // Placeholder
        let total_mb = 2048.0; // Placeholder
        let percentage = (used_mb / total_mb) * 100.0;
        Ok((used_mb, percentage))
    }
    
    /// Get average duration for an operation
    async fn get_average_duration(&self, operation: &str) -> f64 {
        let durations = self.operation_durations.read().await;
        if let Some(op_durations) = durations.get(operation) {
            if !op_durations.is_empty() {
                let total: Duration = op_durations.iter().sum();
                return total.as_millis() as f64 / op_durations.len() as f64;
            }
        }
        0.0
    }
    
    /// Calculate system throughput
    async fn calculate_throughput(&self) -> f64 {
        let durations = self.operation_durations.read().await;
        let total_operations: usize = durations.values().map(|d| d.len()).sum();
        
        if total_operations > 0 {
            // Operations per second over the last minute
            total_operations as f64 / 60.0
        } else {
            0.0
        }
    }
    
    /// Calculate error rate
    async fn calculate_error_rate(&self) -> f64 {
        let errors = self.error_counts.read().await;
        let durations = self.operation_durations.read().await;
        
        let total_errors: usize = errors.values().sum();
        let total_operations: usize = durations.values().map(|d| d.len()).sum();
        
        if total_operations > 0 {
            (total_errors as f64 / total_operations as f64) * 100.0
        } else {
            0.0
        }
    }
    
    /// Get active connections count
    async fn get_active_connections(&self) -> usize {
        // Placeholder - would track actual connections
        1
    }
    
    /// Calculate cache hit rate
    async fn calculate_cache_hit_rate(&self) -> f64 {
        let stats = self.cache_stats.read().await;
        let mut total_hits = 0;
        let mut total_requests = 0;
        
        for (hits, misses) in stats.values() {
            total_hits += hits;
            total_requests += hits + misses;
        }
        
        if total_requests > 0 {
            (total_hits as f64 / total_requests as f64) * 100.0
        } else {
            100.0 // No cache requests yet
        }
    }
    
    /// Check for performance alerts
    async fn check_alerts(&self, metrics: &PerformanceMetrics) {
        let mut alerts = Vec::new();
        
        // Check CPU usage
        if metrics.cpu_usage > self.thresholds.max_cpu_usage {
            alerts.push(PerformanceAlert {
                alert_type: AlertType::HighCpuUsage,
                message: format!("High CPU usage: {:.1}%", metrics.cpu_usage),
                current_value: metrics.cpu_usage,
                threshold_value: self.thresholds.max_cpu_usage,
                severity: if metrics.cpu_usage > 95.0 { AlertSeverity::Critical } else { AlertSeverity::Warning },
                timestamp: chrono::Utc::now(),
            });
        }
        
        // Check memory usage
        if metrics.memory_percentage > self.thresholds.max_memory_usage {
            alerts.push(PerformanceAlert {
                alert_type: AlertType::HighMemoryUsage,
                message: format!("High memory usage: {:.1}%", metrics.memory_percentage),
                current_value: metrics.memory_percentage,
                threshold_value: self.thresholds.max_memory_usage,
                severity: if metrics.memory_percentage > 95.0 { AlertSeverity::Critical } else { AlertSeverity::Warning },
                timestamp: chrono::Utc::now(),
            });
        }
        
        // Check API latency
        if metrics.api_latency > self.thresholds.max_api_latency {
            alerts.push(PerformanceAlert {
                alert_type: AlertType::HighApiLatency,
                message: format!("High API latency: {:.1}ms", metrics.api_latency),
                current_value: metrics.api_latency,
                threshold_value: self.thresholds.max_api_latency,
                severity: AlertSeverity::Warning,
                timestamp: chrono::Utc::now(),
            });
        }
        
        // Check error rate
        if metrics.error_rate > self.thresholds.max_error_rate {
            alerts.push(PerformanceAlert {
                alert_type: AlertType::HighErrorRate,
                message: format!("High error rate: {:.1}%", metrics.error_rate),
                current_value: metrics.error_rate,
                threshold_value: self.thresholds.max_error_rate,
                severity: if metrics.error_rate > 20.0 { AlertSeverity::Critical } else { AlertSeverity::Warning },
                timestamp: chrono::Utc::now(),
            });
        }
        
        // Log alerts
        for alert in &alerts {
            match alert.severity {
                AlertSeverity::Critical => error!("CRITICAL ALERT: {}", alert.message),
                AlertSeverity::Warning => warn!("WARNING: {}", alert.message),
                AlertSeverity::Info => info!("INFO: {}", alert.message),
            }
        }
        
        // Store alerts
        if !alerts.is_empty() {
            let mut active_alerts = self.active_alerts.write().await;
            active_alerts.extend(alerts);

            // Keep only recent alerts
            if active_alerts.len() > 100 {
                let drain_count = active_alerts.len() - 100;
                active_alerts.drain(0..drain_count);
            }
        }
    }
    
    /// Get performance summary
    pub async fn get_performance_summary(&self) -> PerformanceSummary {
        let history = self.metrics_history.read().await;
        let alerts = self.active_alerts.read().await;
        
        let recent_metrics = history.back().cloned();
        let avg_cpu = if !history.is_empty() {
            history.iter().map(|m| m.cpu_usage).sum::<f64>() / history.len() as f64
        } else {
            0.0
        };
        
        let avg_memory = if !history.is_empty() {
            history.iter().map(|m| m.memory_percentage).sum::<f64>() / history.len() as f64
        } else {
            0.0
        };
        
        PerformanceSummary {
            current_metrics: recent_metrics,
            average_cpu_usage: avg_cpu,
            average_memory_usage: avg_memory,
            total_alerts: alerts.len(),
            critical_alerts: alerts.iter().filter(|a| matches!(a.severity, AlertSeverity::Critical)).count(),
            system_health_score: self.calculate_health_score(&history).await,
        }
    }
    
    /// Calculate system health score (0-100)
    async fn calculate_health_score(&self, history: &VecDeque<PerformanceMetrics>) -> f64 {
        if history.is_empty() {
            return 100.0;
        }
        
        let recent_metrics = history.back().unwrap();
        let mut score = 100.0;
        
        // Deduct points for high resource usage
        if recent_metrics.cpu_usage > 80.0 {
            score -= (recent_metrics.cpu_usage - 80.0) * 0.5;
        }
        
        if recent_metrics.memory_percentage > 80.0 {
            score -= (recent_metrics.memory_percentage - 80.0) * 0.5;
        }
        
        // Deduct points for high latency
        if recent_metrics.api_latency > 1000.0 {
            score -= (recent_metrics.api_latency - 1000.0) / 100.0;
        }
        
        // Deduct points for errors
        score -= recent_metrics.error_rate * 2.0;
        
        // Bonus for good cache performance
        if recent_metrics.cache_hit_rate > 90.0 {
            score += 5.0;
        }
        
        score.max(0.0).min(100.0)
    }
    
    /// Enable/disable monitoring
    pub fn set_enabled(&mut self, enabled: bool) {
        self.enabled = enabled;
    }
    
    /// Clear all metrics and alerts
    pub async fn clear_all(&self) {
        let mut history = self.metrics_history.write().await;
        let mut alerts = self.active_alerts.write().await;
        let mut timers = self.operation_timers.write().await;
        let mut durations = self.operation_durations.write().await;
        let mut errors = self.error_counts.write().await;
        let mut cache_stats = self.cache_stats.write().await;
        
        history.clear();
        alerts.clear();
        timers.clear();
        durations.clear();
        errors.clear();
        cache_stats.clear();
    }
}

/// Performance summary
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceSummary {
    /// Current metrics
    pub current_metrics: Option<PerformanceMetrics>,
    
    /// Average CPU usage
    pub average_cpu_usage: f64,
    
    /// Average memory usage
    pub average_memory_usage: f64,
    
    /// Total alerts count
    pub total_alerts: usize,
    
    /// Critical alerts count
    pub critical_alerts: usize,
    
    /// System health score (0-100)
    pub system_health_score: f64,
}
