//! Error Handling and Retry Logic for Bybit API
//!
//! This module provides comprehensive error handling and retry mechanisms for Bybit API calls.

use std::time::Duration;
use anyhow::{Result, anyhow};
use tokio::time::sleep;
use tracing::{warn, error, debug};
use serde_json::Value;

/// Bybit API error types
#[derive(Debug, Clone)]
pub enum BybitErrorType {
    /// Rate limit exceeded
    RateLimit,
    
    /// Network/connection error
    Network,
    
    /// Authentication error
    Authentication,
    
    /// Insufficient balance
    InsufficientBalance,
    
    /// Invalid parameters
    InvalidParameters,
    
    /// Market closed
    MarketClosed,
    
    /// Order not found
    OrderNotFound,
    
    /// Position not found
    PositionNotFound,
    
    /// Server error
    ServerError,
    
    /// Unknown error
    Unknown,
}

/// Bybit error with retry information
#[derive(Debug, Clone)]
pub struct BybitError {
    /// Error type
    pub error_type: BybitErrorType,
    
    /// Error code from API
    pub code: i64,
    
    /// Error message
    pub message: String,
    
    /// Whether this error is retryable
    pub retryable: bool,
    
    /// Suggested retry delay
    pub retry_delay: Duration,
}

impl std::fmt::Display for BybitError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "Bybit API Error {}: {} (retryable: {})",
               self.code, self.message, self.retryable)
    }
}

impl std::error::Error for BybitError {}

impl BybitError {
    /// Create new Bybit error
    pub fn new(error_type: BybitErrorType, code: i64, message: String) -> Self {
        let (retryable, retry_delay) = match error_type {
            BybitErrorType::RateLimit => (true, Duration::from_secs(60)),
            BybitErrorType::Network => (true, Duration::from_secs(5)),
            BybitErrorType::ServerError => (true, Duration::from_secs(10)),
            BybitErrorType::Authentication => (false, Duration::from_secs(0)),
            BybitErrorType::InsufficientBalance => (false, Duration::from_secs(0)),
            BybitErrorType::InvalidParameters => (false, Duration::from_secs(0)),
            BybitErrorType::MarketClosed => (true, Duration::from_secs(300)),
            BybitErrorType::OrderNotFound => (false, Duration::from_secs(0)),
            BybitErrorType::PositionNotFound => (false, Duration::from_secs(0)),
            BybitErrorType::Unknown => (true, Duration::from_secs(30)),
        };
        
        Self {
            error_type,
            code,
            message,
            retryable,
            retry_delay,
        }
    }
    
    /// Parse Bybit API response error
    pub fn from_api_response(response: &Value) -> Self {
        let code = response["retCode"].as_i64().unwrap_or(-1);
        let message = response["retMsg"].as_str().unwrap_or("Unknown error").to_string();
        
        let error_type = match code {
            10001 => BybitErrorType::InvalidParameters,
            10002 => BybitErrorType::InvalidParameters,
            10003 => BybitErrorType::Authentication,
            10004 => BybitErrorType::Authentication,
            10005 => BybitErrorType::Authentication,
            10006 => BybitErrorType::RateLimit,
            10007 => BybitErrorType::RateLimit,
            10016 => BybitErrorType::ServerError,
            10018 => BybitErrorType::RateLimit,
            110001 => BybitErrorType::OrderNotFound,
            110003 => BybitErrorType::OrderNotFound,
            110004 => BybitErrorType::InsufficientBalance,
            110007 => BybitErrorType::InsufficientBalance,
            110012 => BybitErrorType::MarketClosed,
            110013 => BybitErrorType::MarketClosed,
            130021 => BybitErrorType::PositionNotFound,
            _ => {
                if code >= 500 {
                    BybitErrorType::ServerError
                } else if code >= 400 {
                    BybitErrorType::InvalidParameters
                } else {
                    BybitErrorType::Unknown
                }
            }
        };
        
        Self::new(error_type, code, message)
    }
    
    /// Parse network/reqwest error
    pub fn from_reqwest_error(error: &reqwest::Error) -> Self {
        let message = error.to_string();
        
        let error_type = if error.is_timeout() || error.is_connect() {
            BybitErrorType::Network
        } else if error.is_decode() {
            BybitErrorType::ServerError
        } else {
            BybitErrorType::Unknown
        };
        
        Self::new(error_type, -1, message)
    }
}

/// Retry configuration
#[derive(Debug, Clone)]
pub struct RetryConfig {
    /// Maximum number of retries
    pub max_retries: usize,
    
    /// Base delay between retries
    pub base_delay: Duration,
    
    /// Maximum delay between retries
    pub max_delay: Duration,
    
    /// Exponential backoff multiplier
    pub backoff_multiplier: f64,
    
    /// Jitter factor (0.0 to 1.0)
    pub jitter_factor: f64,
}

impl Default for RetryConfig {
    fn default() -> Self {
        Self {
            max_retries: 3,
            base_delay: Duration::from_millis(1000),
            max_delay: Duration::from_secs(60),
            backoff_multiplier: 2.0,
            jitter_factor: 0.1,
        }
    }
}

impl RetryConfig {
    /// Create conservative retry config for trading operations
    pub fn trading() -> Self {
        Self {
            max_retries: 2,
            base_delay: Duration::from_millis(500),
            max_delay: Duration::from_secs(10),
            backoff_multiplier: 1.5,
            jitter_factor: 0.05,
        }
    }
    
    /// Create aggressive retry config for market data
    pub fn market_data() -> Self {
        Self {
            max_retries: 5,
            base_delay: Duration::from_millis(200),
            max_delay: Duration::from_secs(30),
            backoff_multiplier: 2.0,
            jitter_factor: 0.2,
        }
    }
    
    /// Calculate delay for retry attempt
    pub fn calculate_delay(&self, attempt: usize) -> Duration {
        let base_delay_ms = self.base_delay.as_millis() as f64;
        let exponential_delay = base_delay_ms * self.backoff_multiplier.powi(attempt as i32);
        
        // Add jitter
        let jitter = exponential_delay * self.jitter_factor * (rand::random::<f64>() - 0.5);
        let delay_with_jitter = exponential_delay + jitter;
        
        // Cap at max delay
        let final_delay_ms = delay_with_jitter.min(self.max_delay.as_millis() as f64);
        
        Duration::from_millis(final_delay_ms as u64)
    }
}

/// Error handler with retry logic
pub struct ErrorHandler {
    /// Retry configuration
    config: RetryConfig,
}

impl ErrorHandler {
    /// Create new error handler
    pub fn new(config: RetryConfig) -> Self {
        Self { config }
    }
    
    /// Execute function with retry logic
    pub async fn execute_with_retry<F, Fut, T>(&self, mut operation: F) -> Result<T>
    where
        F: FnMut() -> Fut,
        Fut: std::future::Future<Output = Result<T>>,
    {
        let mut last_error = None;
        
        for attempt in 0..=self.config.max_retries {
            match operation().await {
                Ok(result) => return Ok(result),
                Err(error) => {
                    last_error = Some(error.to_string());
                    
                    // Check if we should retry
                    if attempt < self.config.max_retries {
                        let should_retry = self.should_retry(&error);
                        
                        if should_retry {
                            let delay = self.config.calculate_delay(attempt);
                            warn!(
                                "Operation failed (attempt {}/{}): {}. Retrying in {:?}",
                                attempt + 1,
                                self.config.max_retries + 1,
                                error,
                                delay
                            );
                            sleep(delay).await;
                            continue;
                        } else {
                            debug!("Error is not retryable: {}", error);
                            return Err(error);
                        }
                    }
                }
            }
        }
        
        let final_error = last_error.unwrap_or_else(|| "Unknown error".to_string());
        error!("Operation failed after {} attempts: {}", self.config.max_retries + 1, final_error);
        Err(anyhow!("Operation failed after {} attempts: {}", self.config.max_retries + 1, final_error))
    }
    
    /// Check if error should be retried
    fn should_retry(&self, error: &anyhow::Error) -> bool {
        // Try to parse as BybitError
        if let Some(bybit_error) = error.downcast_ref::<BybitError>() {
            return bybit_error.retryable;
        }
        
        // Check for common retryable errors
        let error_str = error.to_string().to_lowercase();
        
        // Network errors
        if error_str.contains("timeout") ||
           error_str.contains("connection") ||
           error_str.contains("network") ||
           error_str.contains("dns") {
            return true;
        }
        
        // Server errors
        if error_str.contains("500") ||
           error_str.contains("502") ||
           error_str.contains("503") ||
           error_str.contains("504") {
            return true;
        }
        
        // Rate limit errors
        if error_str.contains("rate limit") ||
           error_str.contains("too many requests") {
            return true;
        }
        
        false
    }
}

/// Circuit breaker for API calls
pub struct CircuitBreaker {
    /// Failure threshold
    failure_threshold: usize,
    
    /// Current failure count
    failure_count: usize,
    
    /// Recovery timeout
    recovery_timeout: Duration,
    
    /// Last failure time
    last_failure: Option<std::time::Instant>,
    
    /// Circuit state
    state: CircuitState,
}

#[derive(Debug, Clone, PartialEq)]
enum CircuitState {
    Closed,
    Open,
    HalfOpen,
}

impl CircuitBreaker {
    /// Create new circuit breaker
    pub fn new(failure_threshold: usize, recovery_timeout: Duration) -> Self {
        Self {
            failure_threshold,
            failure_count: 0,
            recovery_timeout,
            last_failure: None,
            state: CircuitState::Closed,
        }
    }
    
    /// Check if request is allowed
    pub fn is_request_allowed(&mut self) -> bool {
        match self.state {
            CircuitState::Closed => true,
            CircuitState::Open => {
                if let Some(last_failure) = self.last_failure {
                    if last_failure.elapsed() >= self.recovery_timeout {
                        self.state = CircuitState::HalfOpen;
                        true
                    } else {
                        false
                    }
                } else {
                    true
                }
            }
            CircuitState::HalfOpen => true,
        }
    }
    
    /// Record successful request
    pub fn record_success(&mut self) {
        self.failure_count = 0;
        self.state = CircuitState::Closed;
    }
    
    /// Record failed request
    pub fn record_failure(&mut self) {
        self.failure_count += 1;
        self.last_failure = Some(std::time::Instant::now());
        
        if self.failure_count >= self.failure_threshold {
            self.state = CircuitState::Open;
        }
    }
    
    /// Get current state
    pub fn get_state(&self) -> String {
        format!("{:?}", self.state)
    }
}
