//! Health Check System
//!
//! Provides comprehensive health monitoring for all system components
//! to ensure production readiness and early problem detection.

use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::RwLock;
use tracing::{info, warn, error, debug};
use serde::{Serialize, Deserialize};
use anyhow::{Result, anyhow};

/// Health check status
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum HealthStatus {
    /// Component is healthy
    Healthy,
    
    /// Component has warnings but is functional
    Warning,
    
    /// Component is degraded but partially functional
    Degraded,
    
    /// Component is unhealthy
    Unhealthy,
    
    /// Component status is unknown
    Unknown,
}

impl HealthStatus {
    /// Check if status is considered operational
    pub fn is_operational(&self) -> bool {
        matches!(self, HealthStatus::Healthy | HealthStatus::Warning)
    }
    
    /// Get severity level (0 = healthy, 4 = unhealthy)
    pub fn severity(&self) -> u8 {
        match self {
            HealthStatus::Healthy => 0,
            HealthStatus::Warning => 1,
            HealthStatus::Degraded => 2,
            HealthStatus::Unhealthy => 3,
            HealthStatus::Unknown => 4,
        }
    }
}

/// Health check result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthCheckResult {
    /// Component name
    pub component: String,
    
    /// Health status
    pub status: HealthStatus,
    
    /// Status message
    pub message: String,
    
    /// Check timestamp
    pub timestamp: chrono::DateTime<chrono::Utc>,
    
    /// Response time in milliseconds
    pub response_time_ms: u64,
    
    /// Additional metadata
    pub metadata: HashMap<String, String>,
    
    /// Error details if unhealthy
    pub error: Option<String>,
}

impl HealthCheckResult {
    /// Create healthy result
    pub fn healthy(component: String, message: String) -> Self {
        Self {
            component,
            status: HealthStatus::Healthy,
            message,
            timestamp: chrono::Utc::now(),
            response_time_ms: 0,
            metadata: HashMap::new(),
            error: None,
        }
    }
    
    /// Create warning result
    pub fn warning(component: String, message: String) -> Self {
        Self {
            component,
            status: HealthStatus::Warning,
            message,
            timestamp: chrono::Utc::now(),
            response_time_ms: 0,
            metadata: HashMap::new(),
            error: None,
        }
    }
    
    /// Create unhealthy result
    pub fn unhealthy(component: String, message: String, error: Option<String>) -> Self {
        Self {
            component,
            status: HealthStatus::Unhealthy,
            message,
            timestamp: chrono::Utc::now(),
            response_time_ms: 0,
            metadata: HashMap::new(),
            error,
        }
    }
    
    /// Set response time
    pub fn with_response_time(mut self, response_time: Duration) -> Self {
        self.response_time_ms = response_time.as_millis() as u64;
        self
    }
    
    /// Add metadata
    pub fn with_metadata(mut self, key: String, value: String) -> Self {
        self.metadata.insert(key, value);
        self
    }
}

/// Health check function type
pub type HealthCheckFn = Arc<dyn Fn() -> Result<HealthCheckResult> + Send + Sync>;

/// Health checker configuration
#[derive(Debug, Clone)]
pub struct HealthCheckConfig {
    /// Check interval
    pub interval: Duration,
    
    /// Timeout for health checks
    pub timeout: Duration,
    
    /// Number of consecutive failures before marking unhealthy
    pub failure_threshold: u32,
    
    /// Number of consecutive successes before marking healthy
    pub success_threshold: u32,
    
    /// Enable detailed logging
    pub detailed_logging: bool,
}

impl Default for HealthCheckConfig {
    fn default() -> Self {
        Self {
            interval: Duration::from_secs(30),
            timeout: Duration::from_secs(10),
            failure_threshold: 3,
            success_threshold: 2,
            detailed_logging: false,
        }
    }
}

/// Component health tracker
#[derive(Debug, Clone)]
struct ComponentHealth {
    /// Current status
    status: HealthStatus,
    
    /// Last check result
    last_result: Option<HealthCheckResult>,
    
    /// Consecutive failure count
    failure_count: u32,
    
    /// Consecutive success count
    success_count: u32,
    
    /// Last check time
    last_check: Instant,
    
    /// Check configuration
    config: HealthCheckConfig,
}

/// System health checker
pub struct HealthChecker {
    /// Registered health checks
    checks: Arc<RwLock<HashMap<String, HealthCheckFn>>>,
    
    /// Component health status
    component_health: Arc<RwLock<HashMap<String, ComponentHealth>>>,
    
    /// Global health status
    global_status: Arc<RwLock<HealthStatus>>,
    
    /// Health check history
    history: Arc<RwLock<Vec<HealthCheckResult>>>,
    
    /// Default configuration
    default_config: HealthCheckConfig,
    
    /// Component-specific configurations
    component_configs: Arc<RwLock<HashMap<String, HealthCheckConfig>>>,
}

impl HealthChecker {
    /// Create new health checker
    pub fn new(default_config: HealthCheckConfig) -> Self {
        let health_checker = Self {
            checks: Arc::new(RwLock::new(HashMap::new())),
            component_health: Arc::new(RwLock::new(HashMap::new())),
            global_status: Arc::new(RwLock::new(HealthStatus::Unknown)),
            history: Arc::new(RwLock::new(Vec::new())),
            default_config: default_config.clone(),
            component_configs: Arc::new(RwLock::new(HashMap::new())),
        };
        
        // Start health check loop
        health_checker.start_health_checks();
        
        health_checker
    }
    
    /// Register health check for component
    pub async fn register_check<F>(&self, component: String, check_fn: F)
    where
        F: Fn() -> Result<HealthCheckResult> + Send + Sync + 'static,
    {
        let mut checks = self.checks.write().await;
        let mut component_health = self.component_health.write().await;
        
        checks.insert(component.clone(), Arc::new(check_fn));
        component_health.insert(component.clone(), ComponentHealth {
            status: HealthStatus::Unknown,
            last_result: None,
            failure_count: 0,
            success_count: 0,
            last_check: Instant::now(),
            config: self.default_config.clone(),
        });
        
        info!("🏥 Registered health check for component: {}", component);
    }
    
    /// Set component-specific configuration
    pub async fn set_component_config(&self, component: String, config: HealthCheckConfig) {
        let mut configs = self.component_configs.write().await;
        let mut component_health = self.component_health.write().await;
        
        configs.insert(component.clone(), config.clone());
        
        if let Some(health) = component_health.get_mut(&component) {
            health.config = config;
        }
    }
    
    /// Get current health status for component
    pub async fn get_component_health(&self, component: &str) -> Option<HealthCheckResult> {
        let component_health = self.component_health.read().await;
        component_health.get(component)?.last_result.clone()
    }
    
    /// Get global health status
    pub async fn get_global_health(&self) -> HealthStatus {
        self.global_status.read().await.clone()
    }
    
    /// Get all component health statuses
    pub async fn get_all_health(&self) -> HashMap<String, HealthCheckResult> {
        let component_health = self.component_health.read().await;
        component_health
            .iter()
            .filter_map(|(name, health)| {
                health.last_result.as_ref().map(|result| (name.clone(), result.clone()))
            })
            .collect()
    }
    
    /// Get health check history
    pub async fn get_health_history(&self, limit: Option<usize>) -> Vec<HealthCheckResult> {
        let history = self.history.read().await;
        let limit = limit.unwrap_or(history.len());
        history.iter().rev().take(limit).cloned().collect()
    }
    
    /// Force health check for specific component
    pub async fn check_component(&self, component: &str) -> Result<HealthCheckResult> {
        let check_fn = {
            let checks = self.checks.read().await;
            checks.get(component)
                .ok_or_else(|| anyhow!("Component not registered: {}", component))?
                .clone()
        };
        
        let start_time = Instant::now();
        let result = tokio::time::timeout(
            Duration::from_secs(10),
            tokio::task::spawn_blocking(move || check_fn())
        ).await;
        
        let response_time = start_time.elapsed();
        
        match result {
            Ok(Ok(Ok(mut check_result))) => {
                check_result.response_time_ms = response_time.as_millis() as u64;
                self.update_component_health(component, &check_result).await;
                Ok(check_result)
            }
            Ok(Ok(Err(e))) => {
                let error_result = HealthCheckResult::unhealthy(
                    component.to_string(),
                    "Health check failed".to_string(),
                    Some(e.to_string())
                ).with_response_time(response_time);
                
                self.update_component_health(component, &error_result).await;
                Ok(error_result)
            }
            Ok(Err(_)) => {
                let panic_result = HealthCheckResult::unhealthy(
                    component.to_string(),
                    "Health check panicked".to_string(),
                    Some("Task panicked during execution".to_string())
                ).with_response_time(response_time);
                
                self.update_component_health(component, &panic_result).await;
                Ok(panic_result)
            }
            Err(_) => {
                let timeout_result = HealthCheckResult::unhealthy(
                    component.to_string(),
                    "Health check timed out".to_string(),
                    Some("Check exceeded timeout limit".to_string())
                ).with_response_time(response_time);
                
                self.update_component_health(component, &timeout_result).await;
                Ok(timeout_result)
            }
        }
    }
    
    /// Update component health based on check result
    async fn update_component_health(&self, component: &str, result: &HealthCheckResult) {
        let mut component_health = self.component_health.write().await;
        let mut history = self.history.write().await;
        
        if let Some(health) = component_health.get_mut(component) {
            health.last_result = Some(result.clone());
            health.last_check = Instant::now();
            
            // Update failure/success counts
            match result.status {
                HealthStatus::Healthy => {
                    health.success_count += 1;
                    health.failure_count = 0;
                    
                    if health.success_count >= health.config.success_threshold {
                        health.status = HealthStatus::Healthy;
                    }
                }
                HealthStatus::Warning => {
                    health.success_count = 0;
                    health.failure_count = 0;
                    health.status = HealthStatus::Warning;
                }
                HealthStatus::Degraded => {
                    health.success_count = 0;
                    health.failure_count += 1;
                    health.status = HealthStatus::Degraded;
                }
                HealthStatus::Unhealthy => {
                    health.success_count = 0;
                    health.failure_count += 1;
                    
                    if health.failure_count >= health.config.failure_threshold {
                        health.status = HealthStatus::Unhealthy;
                    }
                }
                HealthStatus::Unknown => {
                    health.status = HealthStatus::Unknown;
                }
            }
        }
        
        // Add to history
        history.push(result.clone());
        
        // Keep only last 1000 entries
        if history.len() > 1000 {
            history.remove(0);
        }
        
        // Update global status
        self.update_global_status().await;

        // Log significant status changes
        let should_log = {
            let component_health = self.component_health.read().await;
            component_health.get(component)
                .map(|h| h.config.detailed_logging)
                .unwrap_or(false)
        };

        if should_log {
            match result.status {
                HealthStatus::Unhealthy => {
                    error!("🚨 Component unhealthy: {} - {}", component, result.message);
                }
                HealthStatus::Degraded => {
                    warn!("⚠️ Component degraded: {} - {}", component, result.message);
                }
                HealthStatus::Warning => {
                    warn!("⚠️ Component warning: {} - {}", component, result.message);
                }
                HealthStatus::Healthy => {
                    debug!("✅ Component healthy: {} - {}", component, result.message);
                }
                HealthStatus::Unknown => {
                    debug!("❓ Component status unknown: {}", component);
                }
            }
        }
    }
    
    /// Update global health status based on all components
    async fn update_global_status(&self) {
        let component_health = self.component_health.read().await;
        let mut global_status = self.global_status.write().await;
        
        if component_health.is_empty() {
            *global_status = HealthStatus::Unknown;
            return;
        }
        
        let mut max_severity = 0;
        for health in component_health.values() {
            max_severity = max_severity.max(health.status.severity());
        }
        
        *global_status = match max_severity {
            0 => HealthStatus::Healthy,
            1 => HealthStatus::Warning,
            2 => HealthStatus::Degraded,
            3 => HealthStatus::Unhealthy,
            _ => HealthStatus::Unknown,
        };
    }
    
    /// Start background health check loop
    fn start_health_checks(&self) {
        let checks = Arc::clone(&self.checks);
        let component_health = Arc::clone(&self.component_health);
        let default_config = self.default_config.clone();
        
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(default_config.interval);
            
            loop {
                interval.tick().await;
                
                let component_names: Vec<String> = {
                    let checks_guard = checks.read().await;
                    checks_guard.keys().cloned().collect()
                };
                
                for component in component_names {
                    // Check if it's time to run this component's health check
                    let should_check = {
                        let health_guard = component_health.read().await;
                        if let Some(health) = health_guard.get(&component) {
                            health.last_check.elapsed() >= health.config.interval
                        } else {
                            true
                        }
                    };
                    
                    if should_check {
                        // Run health check in background
                        let component_clone = component.clone();
                        let checks_clone = Arc::clone(&checks);
                        let component_health_clone = Arc::clone(&component_health);
                        
                        tokio::spawn(async move {
                            // Get the check function
                            let check_fn_opt = {
                                let checks_guard = checks_clone.read().await;
                                checks_guard.get(&component_clone).cloned()
                            };

                            if let Some(check_fn) = check_fn_opt {
                                let start_time = Instant::now();
                                let result = tokio::time::timeout(
                                    Duration::from_secs(10),
                                    tokio::task::spawn_blocking(move || check_fn())
                                ).await;
                                let response_time = start_time.elapsed();

                                
                                let check_result = match result {
                                    Ok(Ok(Ok(mut result))) => {
                                        result.response_time_ms = response_time.as_millis() as u64;
                                        result
                                    }
                                    Ok(Ok(Err(e))) => {
                                        HealthCheckResult::unhealthy(
                                            component_clone.clone(),
                                            "Health check failed".to_string(),
                                            Some(e.to_string())
                                        ).with_response_time(response_time)
                                    }
                                    Ok(Err(_)) => {
                                        HealthCheckResult::unhealthy(
                                            component_clone.clone(),
                                            "Health check panicked".to_string(),
                                            Some("Task panicked".to_string())
                                        ).with_response_time(response_time)
                                    }
                                    Err(_) => {
                                        HealthCheckResult::unhealthy(
                                            component_clone.clone(),
                                            "Health check timed out".to_string(),
                                            Some("Timeout exceeded".to_string())
                                        ).with_response_time(response_time)
                                    }
                                };
                                
                                // Update component health
                                let mut health_guard = component_health_clone.write().await;
                                if let Some(health) = health_guard.get_mut(&component_clone) {
                                    health.last_result = Some(check_result);
                                    health.last_check = Instant::now();
                                }
                            }
                        });
                    }
                }
            }
        });
    }
}
