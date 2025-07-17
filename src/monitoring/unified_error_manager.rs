//! Unified Error Management System
//!
//! This module provides comprehensive error handling, circuit breakers,
//! automatic recovery, and centralized error management for the OMNI trading system.

use std::collections::{HashMap, VecDeque};
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::{RwLock, Mutex};
use serde::{Serialize, Deserialize};
use anyhow::{Result, anyhow};
use tracing::{info, warn, error, debug};
use chrono::{DateTime, Utc};

/// Error severity levels
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum ErrorSeverity {
    Low,
    Medium,
    High,
    Critical,
    Emergency,
}

/// Error categories for classification
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ErrorCategory {
    Network,
    API,
    Trading,
    Risk,
    Capital,
    System,
    Configuration,
    Data,
}

/// Recovery actions that can be taken
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum RecoveryAction {
    Retry,
    Backoff,
    CircuitBreaker,
    EmergencyStop,
    Restart,
    Notification,
    Ignore,
}

/// System health status
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum SystemHealthStatus {
    Healthy,
    Warning,
    Degraded,
    Critical,
    Emergency,
}

/// Error event structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorEvent {
    pub id: String,
    pub timestamp: DateTime<Utc>,
    pub severity: ErrorSeverity,
    pub category: ErrorCategory,
    pub component: String,
    pub message: String,
    pub details: Option<String>,
    pub recovery_action: RecoveryAction,
    pub resolved: bool,
    pub resolution_time: Option<DateTime<Utc>>,
    pub occurrence_count: usize,
}

/// Circuit breaker configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CircuitBreakerConfig {
    pub failure_threshold: usize,
    pub recovery_timeout: Duration,
    pub half_open_max_calls: usize,
}

/// Circuit breaker state
#[derive(Debug, Clone, PartialEq)]
pub enum CircuitState {
    Closed,
    Open,
    HalfOpen,
}

/// Circuit breaker implementation
pub struct CircuitBreaker {
    config: CircuitBreakerConfig,
    state: CircuitState,
    failure_count: usize,
    success_count: usize,
    last_failure_time: Option<Instant>,
    half_open_calls: usize,
}

impl CircuitBreaker {
    pub fn new(config: CircuitBreakerConfig) -> Self {
        Self {
            config,
            state: CircuitState::Closed,
            failure_count: 0,
            success_count: 0,
            last_failure_time: None,
            half_open_calls: 0,
        }
    }

    pub fn can_execute(&mut self) -> bool {
        match self.state {
            CircuitState::Closed => true,
            CircuitState::Open => {
                if let Some(last_failure) = self.last_failure_time {
                    if last_failure.elapsed() >= self.config.recovery_timeout {
                        self.state = CircuitState::HalfOpen;
                        self.half_open_calls = 0;
                        true
                    } else {
                        false
                    }
                } else {
                    true
                }
            }
            CircuitState::HalfOpen => {
                self.half_open_calls < self.config.half_open_max_calls
            }
        }
    }

    pub fn record_success(&mut self) {
        match self.state {
            CircuitState::HalfOpen => {
                self.success_count += 1;
                if self.success_count >= self.config.half_open_max_calls {
                    self.state = CircuitState::Closed;
                    self.failure_count = 0;
                    self.success_count = 0;
                }
            }
            CircuitState::Closed => {
                self.failure_count = 0;
            }
            _ => {}
        }
    }

    pub fn record_failure(&mut self) {
        self.failure_count += 1;
        self.last_failure_time = Some(Instant::now());

        match self.state {
            CircuitState::Closed => {
                if self.failure_count >= self.config.failure_threshold {
                    self.state = CircuitState::Open;
                }
            }
            CircuitState::HalfOpen => {
                self.state = CircuitState::Open;
            }
            _ => {}
        }
    }

    pub fn get_state(&self) -> &CircuitState {
        &self.state
    }
}

/// Unified Error Manager
pub struct UnifiedErrorManager {
    /// Error event history
    error_history: Arc<RwLock<VecDeque<ErrorEvent>>>,
    
    /// Circuit breakers by component
    circuit_breakers: Arc<RwLock<HashMap<String, CircuitBreaker>>>,
    
    /// Error counters by category
    error_counters: Arc<RwLock<HashMap<ErrorCategory, usize>>>,
    
    /// System health status
    health_status: Arc<RwLock<SystemHealthStatus>>,
    
    /// Configuration
    max_history_size: usize,
    
    /// Emergency stop flag
    emergency_stop: Arc<RwLock<bool>>,
}

impl UnifiedErrorManager {
    pub fn new(max_history_size: usize) -> Self {
        Self {
            error_history: Arc::new(RwLock::new(VecDeque::new())),
            circuit_breakers: Arc::new(RwLock::new(HashMap::new())),
            error_counters: Arc::new(RwLock::new(HashMap::new())),
            health_status: Arc::new(RwLock::new(SystemHealthStatus::Healthy)),
            max_history_size,
            emergency_stop: Arc::new(RwLock::new(false)),
        }
    }

    /// Register a circuit breaker for a component
    pub async fn register_circuit_breaker(&self, component: String, config: CircuitBreakerConfig) {
        let mut breakers = self.circuit_breakers.write().await;
        breakers.insert(component, CircuitBreaker::new(config));
    }

    /// Check if a component can execute (circuit breaker check)
    pub async fn can_execute(&self, component: &str) -> bool {
        let mut breakers = self.circuit_breakers.write().await;
        if let Some(breaker) = breakers.get_mut(component) {
            breaker.can_execute()
        } else {
            true // No circuit breaker registered, allow execution
        }
    }

    /// Record successful operation
    pub async fn record_success(&self, component: &str) {
        let mut breakers = self.circuit_breakers.write().await;
        if let Some(breaker) = breakers.get_mut(component) {
            breaker.record_success();
        }
    }

    /// Record error event
    pub async fn record_error(&self, mut error_event: ErrorEvent) -> Result<()> {
        // Update error counters
        {
            let mut counters = self.error_counters.write().await;
            *counters.entry(error_event.category.clone()).or_insert(0) += 1;
        }

        // Record circuit breaker failure if applicable
        {
            let mut breakers = self.circuit_breakers.write().await;
            if let Some(breaker) = breakers.get_mut(&error_event.component) {
                breaker.record_failure();
            }
        }

        // Generate unique ID if not provided
        if error_event.id.is_empty() {
            error_event.id = uuid::Uuid::new_v4().to_string();
        }

        // Add to history
        {
            let mut history = self.error_history.write().await;
            
            // Check for duplicate errors and increment count
            if let Some(existing) = history.iter_mut().find(|e| 
                e.component == error_event.component && 
                e.message == error_event.message &&
                !e.resolved
            ) {
                existing.occurrence_count += 1;
                existing.timestamp = Utc::now();
            } else {
                // Maintain history size limit
                if history.len() >= self.max_history_size {
                    history.pop_front();
                }
                history.push_back(error_event.clone());
            }
        }

        // Update system health status
        self.update_health_status().await;

        // Execute recovery action
        self.execute_recovery_action(&error_event).await?;

        Ok(())
    }

    /// Update system health status based on current errors
    async fn update_health_status(&self) {
        let history = self.error_history.read().await;
        let recent_errors: Vec<_> = history.iter()
            .filter(|e| !e.resolved && e.timestamp > Utc::now() - chrono::Duration::minutes(5))
            .collect();

        let new_status = if recent_errors.iter().any(|e| e.severity == ErrorSeverity::Emergency) {
            SystemHealthStatus::Emergency
        } else if recent_errors.iter().any(|e| e.severity == ErrorSeverity::Critical) {
            SystemHealthStatus::Critical
        } else if recent_errors.len() > 10 || recent_errors.iter().any(|e| e.severity == ErrorSeverity::High) {
            SystemHealthStatus::Degraded
        } else if recent_errors.len() > 3 || recent_errors.iter().any(|e| e.severity == ErrorSeverity::Medium) {
            SystemHealthStatus::Warning
        } else {
            SystemHealthStatus::Healthy
        };

        let mut status = self.health_status.write().await;
        *status = new_status;
    }

    /// Execute recovery action for an error
    async fn execute_recovery_action(&self, error_event: &ErrorEvent) -> Result<()> {
        match error_event.recovery_action {
            RecoveryAction::EmergencyStop => {
                warn!("Triggering emergency stop due to: {}", error_event.message);
                let mut stop = self.emergency_stop.write().await;
                *stop = true;
            }
            RecoveryAction::Notification => {
                error!("Critical error notification: {} - {}", error_event.component, error_event.message);
            }
            RecoveryAction::Retry => {
                info!("Retry action for: {}", error_event.message);
            }
            RecoveryAction::Backoff => {
                info!("Backoff action for: {}", error_event.message);
            }
            RecoveryAction::CircuitBreaker => {
                info!("Circuit breaker activated for: {}", error_event.component);
            }
            RecoveryAction::Restart => {
                warn!("Restart required for component: {}", error_event.component);
            }
            RecoveryAction::Ignore => {
                debug!("Ignoring error: {}", error_event.message);
            }
        }
        Ok(())
    }

    /// Get current system health status
    pub async fn get_health_status(&self) -> SystemHealthStatus {
        self.health_status.read().await.clone()
    }

    /// Check if emergency stop is active
    pub async fn is_emergency_stopped(&self) -> bool {
        *self.emergency_stop.read().await
    }

    /// Get error statistics
    pub async fn get_error_statistics(&self) -> HashMap<ErrorCategory, usize> {
        self.error_counters.read().await.clone()
    }

    /// Get recent errors
    pub async fn get_recent_errors(&self, limit: usize) -> Vec<ErrorEvent> {
        let history = self.error_history.read().await;
        history.iter().rev().take(limit).cloned().collect()
    }

    /// Resolve an error
    pub async fn resolve_error(&self, error_id: &str) -> Result<()> {
        let mut history = self.error_history.write().await;
        if let Some(error) = history.iter_mut().find(|e| e.id == error_id) {
            error.resolved = true;
            error.resolution_time = Some(Utc::now());
            info!("Resolved error: {}", error_id);
        }
        Ok(())
    }

    /// Clear emergency stop
    pub async fn clear_emergency_stop(&self) {
        let mut stop = self.emergency_stop.write().await;
        *stop = false;
        info!("Emergency stop cleared");
    }
}
