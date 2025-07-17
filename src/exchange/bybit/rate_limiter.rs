//! Rate Limiter for Bybit API
//!
//! This module provides rate limiting functionality to ensure compliance with Bybit API limits.

use std::time::{Duration, Instant};
use std::collections::VecDeque;
use tokio::time::sleep;
use anyhow::Result;
use tracing::{debug, warn};

/// Rate limiter for API calls
pub struct RateLimiter {
    /// Maximum requests per window
    max_requests: usize,
    
    /// Time window duration
    window_duration: Duration,
    
    /// Request timestamps
    request_times: VecDeque<Instant>,
    
    /// Minimum delay between requests
    min_delay: Duration,
    
    /// Last request time
    last_request: Option<Instant>,
}

impl RateLimiter {
    /// Create new rate limiter
    pub fn new(max_requests: usize, window_duration: Duration, min_delay: Duration) -> Self {
        Self {
            max_requests,
            window_duration,
            request_times: VecDeque::new(),
            min_delay,
            last_request: None,
        }
    }
    
    /// Create rate limiter for Bybit API (120 requests per minute)
    pub fn bybit_default() -> Self {
        Self::new(
            120,                              // 120 requests
            Duration::from_secs(60),          // per minute
            Duration::from_millis(500),       // minimum 500ms between requests
        )
    }
    
    /// Create rate limiter for Bybit private API (more restrictive)
    pub fn bybit_private() -> Self {
        Self::new(
            60,                               // 60 requests
            Duration::from_secs(60),          // per minute
            Duration::from_millis(1000),      // minimum 1s between requests
        )
    }
    
    /// Wait if necessary to respect rate limits
    pub async fn wait_if_needed(&mut self) -> Result<()> {
        let now = Instant::now();
        
        // Clean old requests outside the window
        while let Some(&front_time) = self.request_times.front() {
            if now.duration_since(front_time) > self.window_duration {
                self.request_times.pop_front();
            } else {
                break;
            }
        }
        
        // Check if we need to wait due to rate limit
        if self.request_times.len() >= self.max_requests {
            if let Some(&oldest) = self.request_times.front() {
                let wait_time = self.window_duration - now.duration_since(oldest);
                if wait_time > Duration::from_millis(0) {
                    debug!("Rate limit reached, waiting {:?}", wait_time);
                    sleep(wait_time).await;
                }
            }
        }
        
        // Check minimum delay between requests
        if let Some(last) = self.last_request {
            let elapsed = now.duration_since(last);
            if elapsed < self.min_delay {
                let wait_time = self.min_delay - elapsed;
                debug!("Minimum delay not met, waiting {:?}", wait_time);
                sleep(wait_time).await;
            }
        }
        
        // Record this request
        let request_time = Instant::now();
        self.request_times.push_back(request_time);
        self.last_request = Some(request_time);
        
        Ok(())
    }
    
    /// Get current request count in window
    pub fn current_request_count(&self) -> usize {
        let now = Instant::now();
        self.request_times.iter()
            .filter(|&&time| now.duration_since(time) <= self.window_duration)
            .count()
    }
    
    /// Check if we can make a request without waiting
    pub fn can_make_request(&self) -> bool {
        let now = Instant::now();
        
        // Check rate limit
        let current_count = self.current_request_count();
        if current_count >= self.max_requests {
            return false;
        }
        
        // Check minimum delay
        if let Some(last) = self.last_request {
            if now.duration_since(last) < self.min_delay {
                return false;
            }
        }
        
        true
    }
    
    /// Get time until next request is allowed
    pub fn time_until_next_request(&self) -> Duration {
        let now = Instant::now();
        
        // Check rate limit
        if self.request_times.len() >= self.max_requests {
            if let Some(&oldest) = self.request_times.front() {
                let rate_limit_wait = self.window_duration.saturating_sub(now.duration_since(oldest));
                if rate_limit_wait > Duration::from_millis(0) {
                    return rate_limit_wait;
                }
            }
        }
        
        // Check minimum delay
        if let Some(last) = self.last_request {
            let min_delay_wait = self.min_delay.saturating_sub(now.duration_since(last));
            if min_delay_wait > Duration::from_millis(0) {
                return min_delay_wait;
            }
        }
        
        Duration::from_millis(0)
    }
    
    /// Reset rate limiter
    pub fn reset(&mut self) {
        self.request_times.clear();
        self.last_request = None;
    }
    
    /// Get rate limiter statistics
    pub fn get_stats(&self) -> RateLimiterStats {
        let now = Instant::now();
        let current_requests = self.current_request_count();
        let can_request = self.can_make_request();
        let time_until_next = self.time_until_next_request();
        
        RateLimiterStats {
            max_requests: self.max_requests,
            current_requests,
            window_duration: self.window_duration,
            can_make_request: can_request,
            time_until_next_request: time_until_next,
            utilization_percent: (current_requests as f64 / self.max_requests as f64) * 100.0,
        }
    }
}

/// Rate limiter statistics
#[derive(Debug, Clone)]
pub struct RateLimiterStats {
    /// Maximum requests allowed
    pub max_requests: usize,
    
    /// Current requests in window
    pub current_requests: usize,
    
    /// Window duration
    pub window_duration: Duration,
    
    /// Whether we can make a request now
    pub can_make_request: bool,
    
    /// Time until next request is allowed
    pub time_until_next_request: Duration,
    
    /// Current utilization percentage
    pub utilization_percent: f64,
}

/// Rate limiter manager for multiple endpoints
pub struct RateLimiterManager {
    /// Public API rate limiter
    public_limiter: RateLimiter,
    
    /// Private API rate limiter
    private_limiter: RateLimiter,
    
    /// Market data rate limiter
    market_data_limiter: RateLimiter,
}

impl RateLimiterManager {
    /// Create new rate limiter manager
    pub fn new() -> Self {
        Self {
            public_limiter: RateLimiter::bybit_default(),
            private_limiter: RateLimiter::bybit_private(),
            market_data_limiter: RateLimiter::new(
                600,                          // 600 requests
                Duration::from_secs(60),      // per minute
                Duration::from_millis(100),   // minimum 100ms between requests
            ),
        }
    }
    
    /// Wait for public API request
    pub async fn wait_for_public(&mut self) -> Result<()> {
        self.public_limiter.wait_if_needed().await
    }
    
    /// Wait for private API request
    pub async fn wait_for_private(&mut self) -> Result<()> {
        self.private_limiter.wait_if_needed().await
    }
    
    /// Wait for market data request
    pub async fn wait_for_market_data(&mut self) -> Result<()> {
        self.market_data_limiter.wait_if_needed().await
    }
    
    /// Get comprehensive statistics
    pub fn get_all_stats(&self) -> RateLimiterManagerStats {
        RateLimiterManagerStats {
            public: self.public_limiter.get_stats(),
            private: self.private_limiter.get_stats(),
            market_data: self.market_data_limiter.get_stats(),
        }
    }
}

impl Default for RateLimiterManager {
    fn default() -> Self {
        Self::new()
    }
}

/// Comprehensive rate limiter statistics
#[derive(Debug, Clone)]
pub struct RateLimiterManagerStats {
    /// Public API stats
    pub public: RateLimiterStats,
    
    /// Private API stats
    pub private: RateLimiterStats,
    
    /// Market data API stats
    pub market_data: RateLimiterStats,
}

#[cfg(test)]
mod tests {
    use super::*;
    use tokio::time::{sleep, Duration};
    
    #[tokio::test]
    async fn test_rate_limiter_basic() {
        let mut limiter = RateLimiter::new(2, Duration::from_secs(1), Duration::from_millis(100));
        
        // First request should be immediate
        assert!(limiter.can_make_request());
        limiter.wait_if_needed().await.unwrap();
        
        // Second request should wait for min delay
        let start = Instant::now();
        limiter.wait_if_needed().await.unwrap();
        let elapsed = start.elapsed();
        assert!(elapsed >= Duration::from_millis(90)); // Allow some tolerance
        
        // Third request should hit rate limit
        let start = Instant::now();
        limiter.wait_if_needed().await.unwrap();
        let elapsed = start.elapsed();
        assert!(elapsed >= Duration::from_millis(900)); // Should wait for window
    }
    
    #[tokio::test]
    async fn test_rate_limiter_stats() {
        let limiter = RateLimiter::new(5, Duration::from_secs(1), Duration::from_millis(50));
        let stats = limiter.get_stats();
        
        assert_eq!(stats.max_requests, 5);
        assert_eq!(stats.current_requests, 0);
        assert!(stats.can_make_request);
        assert_eq!(stats.utilization_percent, 0.0);
    }
}
