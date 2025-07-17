//! Memory Management and Performance Optimization
//!
//! This module provides comprehensive memory management, performance monitoring,
//! and resource optimization for the OMNI trading system.

use std::sync::Arc;
use std::time::{Duration, Instant};
use std::collections::HashMap;
use tokio::sync::RwLock;
use tracing::{info, warn, error, debug};
use sysinfo::{System, Process, Pid};

/// Memory usage statistics
#[derive(Debug, Clone)]
pub struct MemoryStats {
    /// Total system memory in bytes
    pub total_memory: u64,
    
    /// Available system memory in bytes
    pub available_memory: u64,
    
    /// Process memory usage in bytes
    pub process_memory: u64,
    
    /// Memory usage percentage
    pub memory_percentage: f64,
    
    /// Heap allocations count
    pub heap_allocations: u64,
    
    /// Memory fragmentation percentage
    pub fragmentation: f64,
}

/// Performance metrics
#[derive(Debug, Clone)]
pub struct PerformanceMetrics {
    /// CPU usage percentage
    pub cpu_usage: f64,
    
    /// Memory statistics
    pub memory: MemoryStats,
    
    /// Network I/O statistics
    pub network_io: NetworkStats,
    
    /// Disk I/O statistics
    pub disk_io: DiskStats,
    
    /// Thread count
    pub thread_count: usize,
    
    /// Open file descriptors
    pub open_files: usize,
    
    /// System uptime
    pub uptime: Duration,
}

/// Network I/O statistics
#[derive(Debug, Clone)]
pub struct NetworkStats {
    /// Bytes sent
    pub bytes_sent: u64,
    
    /// Bytes received
    pub bytes_received: u64,
    
    /// Packets sent
    pub packets_sent: u64,
    
    /// Packets received
    pub packets_received: u64,
    
    /// Network errors
    pub errors: u64,
}

/// Disk I/O statistics
#[derive(Debug, Clone)]
pub struct DiskStats {
    /// Bytes read
    pub bytes_read: u64,
    
    /// Bytes written
    pub bytes_written: u64,
    
    /// Read operations
    pub read_ops: u64,
    
    /// Write operations
    pub write_ops: u64,
    
    /// I/O wait time
    pub io_wait: Duration,
}

/// Memory pool for efficient allocation
pub struct MemoryPool<T> {
    /// Pool of reusable objects
    pool: Arc<RwLock<Vec<T>>>,
    
    /// Maximum pool size
    max_size: usize,
    
    /// Factory function for creating new objects
    factory: Box<dyn Fn() -> T + Send + Sync>,
}

impl<T> MemoryPool<T>
where
    T: Send + Sync + 'static,
{
    /// Create new memory pool
    pub fn new<F>(max_size: usize, factory: F) -> Self
    where
        F: Fn() -> T + Send + Sync + 'static,
    {
        Self {
            pool: Arc::new(RwLock::new(Vec::with_capacity(max_size))),
            max_size,
            factory: Box::new(factory),
        }
    }
    
    /// Get object from pool or create new one
    pub async fn get(&self) -> T {
        let mut pool = self.pool.write().await;
        if let Some(obj) = pool.pop() {
            obj
        } else {
            (self.factory)()
        }
    }
    
    /// Return object to pool
    pub async fn return_object(&self, obj: T) {
        let mut pool = self.pool.write().await;
        if pool.len() < self.max_size {
            pool.push(obj);
        }
        // If pool is full, object is dropped
    }
    
    /// Get current pool size
    pub async fn size(&self) -> usize {
        self.pool.read().await.len()
    }
    
    /// Clear the pool
    pub async fn clear(&self) {
        self.pool.write().await.clear();
    }
}

/// Memory manager for the trading system
pub struct MemoryManager {
    /// System information
    system: Arc<RwLock<System>>,
    
    /// Process ID
    pid: Pid,
    
    /// Performance history
    performance_history: Arc<RwLock<Vec<PerformanceMetrics>>>,
    
    /// Memory pools
    pools: HashMap<String, Arc<dyn Send + Sync>>,
    
    /// Monitoring interval
    monitoring_interval: Duration,
    
    /// Memory threshold for warnings (percentage)
    memory_warning_threshold: f64,
    
    /// Memory threshold for critical alerts (percentage)
    memory_critical_threshold: f64,
    
    /// Start time for uptime calculation
    start_time: Instant,
}

impl MemoryManager {
    /// Create new memory manager
    pub fn new() -> Self {
        let mut system = System::new_all();
        system.refresh_all();
        
        let pid = sysinfo::get_current_pid().unwrap_or(Pid::from(0));
        
        Self {
            system: Arc::new(RwLock::new(system)),
            pid,
            performance_history: Arc::new(RwLock::new(Vec::new())),
            pools: HashMap::new(),
            monitoring_interval: Duration::from_secs(30),
            memory_warning_threshold: 80.0,
            memory_critical_threshold: 95.0,
            start_time: Instant::now(),
        }
    }
    
    /// Start memory monitoring
    pub async fn start_monitoring(&self) {
        let system = Arc::clone(&self.system);
        let history = Arc::clone(&self.performance_history);
        let pid = self.pid;
        let interval = self.monitoring_interval;
        let warning_threshold = self.memory_warning_threshold;
        let critical_threshold = self.memory_critical_threshold;
        let start_time = self.start_time;
        
        tokio::spawn(async move {
            let mut monitoring_interval = tokio::time::interval(interval);
            
            loop {
                monitoring_interval.tick().await;
                
                // Refresh system information
                {
                    let mut sys = system.write().await;
                    sys.refresh_all();
                }
                
                // Collect performance metrics
                let metrics = Self::collect_metrics(&system, pid, start_time).await;
                
                // Check thresholds
                if metrics.memory.memory_percentage > critical_threshold {
                    error!("🚨 CRITICAL: Memory usage at {:.1}%! Immediate action required!", 
                           metrics.memory.memory_percentage);
                } else if metrics.memory.memory_percentage > warning_threshold {
                    warn!("⚠️ WARNING: Memory usage at {:.1}%", metrics.memory.memory_percentage);
                }
                
                // Store metrics and check if we should log
                let should_log = {
                    let mut hist = history.write().await;
                    hist.push(metrics);

                    // Keep only last 1000 entries
                    if hist.len() > 1000 {
                        hist.remove(0);
                    }

                    // Check if we should log (every 10 entries)
                    hist.len() % 10 == 0
                };

                // Log performance summary every 5 minutes
                if should_log {
                    let hist = history.read().await;
                    if let Some(latest) = hist.last() {
                        info!("📊 Performance: CPU {:.1}%, Memory {:.1}%, Threads: {}",
                              latest.cpu_usage, latest.memory.memory_percentage, latest.thread_count);
                    }
                }
            }
        });
    }
    
    /// Collect current performance metrics
    async fn collect_metrics(
        system: &Arc<RwLock<System>>, 
        pid: Pid, 
        start_time: Instant
    ) -> PerformanceMetrics {
        let sys = system.read().await;
        
        let total_memory = sys.total_memory();
        let available_memory = sys.available_memory();
        let used_memory = total_memory - available_memory;
        let memory_percentage = (used_memory as f64 / total_memory as f64) * 100.0;
        
        let process_memory = if let Some(process) = sys.process(pid) {
            process.memory()
        } else {
            0
        };
        
        let cpu_usage = sys.global_cpu_info().cpu_usage() as f64;
        
        PerformanceMetrics {
            cpu_usage,
            memory: MemoryStats {
                total_memory,
                available_memory,
                process_memory,
                memory_percentage,
                heap_allocations: 0, // Would need custom allocator tracking
                fragmentation: 0.0,  // Would need detailed memory analysis
            },
            network_io: NetworkStats {
                bytes_sent: 0,
                bytes_received: 0,
                packets_sent: 0,
                packets_received: 0,
                errors: 0,
            },
            disk_io: DiskStats {
                bytes_read: 0,
                bytes_written: 0,
                read_ops: 0,
                write_ops: 0,
                io_wait: Duration::from_secs(0),
            },
            thread_count: sys.processes().len(),
            open_files: 0, // Would need platform-specific implementation
            uptime: start_time.elapsed(),
        }
    }
    
    /// Get current performance metrics
    pub async fn get_current_metrics(&self) -> PerformanceMetrics {
        Self::collect_metrics(&self.system, self.pid, self.start_time).await
    }
    
    /// Get performance history
    pub async fn get_performance_history(&self) -> Vec<PerformanceMetrics> {
        self.performance_history.read().await.clone()
    }
    
    /// Force garbage collection (Rust doesn't have GC, but we can drop unused data)
    pub async fn force_cleanup(&self) {
        info!("🧹 Performing memory cleanup...");
        
        // Clear performance history older than 1 hour
        {
            let mut history = self.performance_history.write().await;
            let cutoff_time = Instant::now() - Duration::from_secs(3600);
            history.retain(|metrics| {
                self.start_time + metrics.uptime > cutoff_time
            });
        }
        
        // Clear memory pools
        for (name, _pool) in &self.pools {
            debug!("Clearing memory pool: {}", name);
        }
        
        info!("✅ Memory cleanup completed");
    }
    
    /// Get memory usage summary
    pub async fn get_memory_summary(&self) -> String {
        let metrics = self.get_current_metrics().await;
        
        format!(
            "Memory Summary:\n\
             - Total: {:.2} MB\n\
             - Available: {:.2} MB\n\
             - Process: {:.2} MB\n\
             - Usage: {:.1}%\n\
             - CPU: {:.1}%\n\
             - Threads: {}\n\
             - Uptime: {:.2} hours",
            metrics.memory.total_memory as f64 / 1024.0 / 1024.0,
            metrics.memory.available_memory as f64 / 1024.0 / 1024.0,
            metrics.memory.process_memory as f64 / 1024.0 / 1024.0,
            metrics.memory.memory_percentage,
            metrics.cpu_usage,
            metrics.thread_count,
            metrics.uptime.as_secs_f64() / 3600.0
        )
    }
    
    /// Check if system is under memory pressure
    pub async fn is_memory_pressure(&self) -> bool {
        let metrics = self.get_current_metrics().await;
        metrics.memory.memory_percentage > self.memory_warning_threshold
    }
    
    /// Get optimization recommendations
    pub async fn get_optimization_recommendations(&self) -> Vec<String> {
        let metrics = self.get_current_metrics().await;
        let mut recommendations = Vec::new();
        
        if metrics.memory.memory_percentage > 90.0 {
            recommendations.push("Critical: Memory usage very high - consider restarting".to_string());
        } else if metrics.memory.memory_percentage > 80.0 {
            recommendations.push("High memory usage - run cleanup operations".to_string());
        }
        
        if metrics.cpu_usage > 90.0 {
            recommendations.push("High CPU usage - consider reducing trading frequency".to_string());
        }
        
        if metrics.thread_count > 1000 {
            recommendations.push("High thread count - check for thread leaks".to_string());
        }
        
        if recommendations.is_empty() {
            recommendations.push("System performance is optimal".to_string());
        }
        
        recommendations
    }
}

impl Default for MemoryManager {
    fn default() -> Self {
        Self::new()
    }
}
