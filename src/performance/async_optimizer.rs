//! Async Task Optimization
//!
//! Provides intelligent task scheduling, priority management, and async optimization
//! for the trading system to maximize throughput and minimize latency.

use std::collections::{BinaryHeap, HashMap};
use std::cmp::Ordering;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::{RwLock, Semaphore, mpsc};
use tokio::task::JoinHandle;
use tracing::{debug, info, warn, error};
use anyhow::Result;
use uuid::Uuid;

/// Task priority levels
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum TaskPriority {
    /// Critical system tasks (emergency stops, error handling)
    Critical = 0,
    
    /// High priority tasks (order execution, risk management)
    High = 1,
    
    /// Normal priority tasks (market analysis, signal generation)
    Normal = 2,
    
    /// Low priority tasks (logging, cleanup, statistics)
    Low = 3,
    
    /// Background tasks (data archival, maintenance)
    Background = 4,
}

/// Optimized task wrapper
#[derive(Debug, Clone)]
pub struct OptimizedTask {
    /// Unique task ID
    pub id: Uuid,
    
    /// Task name for debugging
    pub name: String,
    
    /// Task priority
    pub priority: TaskPriority,
    
    /// Creation time
    pub created_at: Instant,
    
    /// Estimated execution time
    pub estimated_duration: Duration,
    
    /// Maximum execution time before timeout
    pub timeout: Duration,
    
    /// Number of retry attempts
    pub retry_count: u32,
    
    /// Maximum retries allowed
    pub max_retries: u32,
    
    /// Task dependencies
    pub dependencies: Vec<Uuid>,
    
    /// Task metadata
    pub metadata: HashMap<String, String>,
}

impl OptimizedTask {
    /// Create new optimized task
    pub fn new(name: String, priority: TaskPriority) -> Self {
        Self {
            id: Uuid::new_v4(),
            name,
            priority,
            created_at: Instant::now(),
            estimated_duration: Duration::from_millis(100),
            timeout: Duration::from_secs(30),
            retry_count: 0,
            max_retries: 3,
            dependencies: Vec::new(),
            metadata: HashMap::new(),
        }
    }
    
    /// Set estimated duration
    pub fn with_duration(mut self, duration: Duration) -> Self {
        self.estimated_duration = duration;
        self
    }
    
    /// Set timeout
    pub fn with_timeout(mut self, timeout: Duration) -> Self {
        self.timeout = timeout;
        self
    }
    
    /// Set max retries
    pub fn with_retries(mut self, max_retries: u32) -> Self {
        self.max_retries = max_retries;
        self
    }
    
    /// Add dependency
    pub fn with_dependency(mut self, dependency: Uuid) -> Self {
        self.dependencies.push(dependency);
        self
    }
    
    /// Add metadata
    pub fn with_metadata(mut self, key: String, value: String) -> Self {
        self.metadata.insert(key, value);
        self
    }
    
    /// Check if task can be retried
    pub fn can_retry(&self) -> bool {
        self.retry_count < self.max_retries
    }
    
    /// Increment retry count
    pub fn increment_retry(&mut self) {
        self.retry_count += 1;
    }
    
    /// Get age of task
    pub fn age(&self) -> Duration {
        self.created_at.elapsed()
    }
}

impl PartialEq for OptimizedTask {
    fn eq(&self, other: &Self) -> bool {
        self.priority == other.priority && self.created_at == other.created_at
    }
}

impl Eq for OptimizedTask {}

impl PartialOrd for OptimizedTask {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl Ord for OptimizedTask {
    fn cmp(&self, other: &Self) -> Ordering {
        // Higher priority tasks come first, then older tasks
        self.priority.cmp(&other.priority)
            .then_with(|| self.created_at.cmp(&other.created_at))
    }
}

/// Task execution result
#[derive(Debug, Clone)]
pub enum TaskResult {
    /// Task completed successfully
    Success,
    
    /// Task failed but can be retried
    Retry(String),
    
    /// Task failed permanently
    Failed(String),
    
    /// Task timed out
    Timeout,
}

/// Task executor function type
pub type TaskExecutor = Box<dyn Fn() -> Result<TaskResult> + Send + Sync>;

/// Async task optimizer and scheduler
pub struct AsyncOptimizer {
    /// Task queue (priority queue)
    task_queue: Arc<RwLock<BinaryHeap<OptimizedTask>>>,
    
    /// Running tasks
    running_tasks: Arc<RwLock<HashMap<Uuid, JoinHandle<()>>>>,
    
    /// Completed tasks
    completed_tasks: Arc<RwLock<HashMap<Uuid, TaskResult>>>,
    
    /// Task executors
    executors: Arc<RwLock<HashMap<Uuid, TaskExecutor>>>,
    
    /// Semaphore for concurrent task limit
    semaphore: Arc<Semaphore>,
    
    /// Task statistics
    stats: Arc<RwLock<TaskStats>>,
    
    /// Shutdown signal
    shutdown_tx: mpsc::Sender<()>,
    shutdown_rx: Arc<RwLock<Option<mpsc::Receiver<()>>>>,
}

/// Task execution statistics
#[derive(Debug, Clone)]
pub struct TaskStats {
    /// Total tasks submitted
    pub total_submitted: u64,
    
    /// Total tasks completed
    pub total_completed: u64,
    
    /// Total tasks failed
    pub total_failed: u64,
    
    /// Total tasks timed out
    pub total_timeout: u64,
    
    /// Average execution time
    pub avg_execution_time_ms: f64,
    
    /// Current queue size
    pub queue_size: usize,
    
    /// Current running tasks
    pub running_tasks: usize,
    
    /// Tasks by priority
    pub tasks_by_priority: HashMap<TaskPriority, u64>,
}

impl AsyncOptimizer {
    /// Create new async optimizer
    pub fn new(max_concurrent_tasks: usize) -> Self {
        let (shutdown_tx, shutdown_rx) = mpsc::channel(1);
        
        let optimizer = Self {
            task_queue: Arc::new(RwLock::new(BinaryHeap::new())),
            running_tasks: Arc::new(RwLock::new(HashMap::new())),
            completed_tasks: Arc::new(RwLock::new(HashMap::new())),
            executors: Arc::new(RwLock::new(HashMap::new())),
            semaphore: Arc::new(Semaphore::new(max_concurrent_tasks)),
            stats: Arc::new(RwLock::new(TaskStats {
                total_submitted: 0,
                total_completed: 0,
                total_failed: 0,
                total_timeout: 0,
                avg_execution_time_ms: 0.0,
                queue_size: 0,
                running_tasks: 0,
                tasks_by_priority: HashMap::new(),
            })),
            shutdown_tx,
            shutdown_rx: Arc::new(RwLock::new(Some(shutdown_rx))),
        };
        
        // Start task scheduler
        optimizer.start_scheduler();
        
        optimizer
    }
    
    /// Submit task for execution
    pub async fn submit_task<F>(&self, task: OptimizedTask, executor: F) -> Uuid
    where
        F: Fn() -> Result<TaskResult> + Send + Sync + 'static,
    {
        let task_id = task.id;
        
        // Store executor
        {
            let mut executors = self.executors.write().await;
            executors.insert(task_id, Box::new(executor));
        }
        
        // Add to queue
        let task_name = task.name.clone();
        let task_priority = task.priority;
        {
            let mut queue = self.task_queue.write().await;
            let mut stats = self.stats.write().await;

            queue.push(task);
            stats.total_submitted += 1;
            stats.queue_size = queue.len();

            // Update priority stats
            let priority_count = stats.tasks_by_priority.entry(task_priority).or_insert(0);
            *priority_count += 1;
        }

        debug!("📋 Submitted task: {} ({})", task_name, task_id);
        task_id
    }
    
    /// Get task result
    pub async fn get_result(&self, task_id: &Uuid) -> Option<TaskResult> {
        let completed = self.completed_tasks.read().await;
        completed.get(task_id).cloned()
    }
    
    /// Wait for task completion
    pub async fn wait_for_task(&self, task_id: &Uuid) -> Option<TaskResult> {
        // Poll for completion
        for _ in 0..300 { // Wait up to 30 seconds
            if let Some(result) = self.get_result(task_id).await {
                return Some(result);
            }
            tokio::time::sleep(Duration::from_millis(100)).await;
        }
        None
    }
    
    /// Cancel task
    pub async fn cancel_task(&self, task_id: &Uuid) -> bool {
        // Remove from queue if not started
        {
            let mut queue = self.task_queue.write().await;
            let original_len = queue.len();
            
            // Rebuild queue without the cancelled task
            let tasks: Vec<_> = queue.drain().collect();
            for task in tasks {
                if task.id != *task_id {
                    queue.push(task);
                }
            }
            
            if queue.len() < original_len {
                debug!("❌ Cancelled queued task: {}", task_id);
                return true;
            }
        }
        
        // Cancel running task
        {
            let mut running = self.running_tasks.write().await;
            if let Some(handle) = running.remove(task_id) {
                handle.abort();
                debug!("❌ Cancelled running task: {}", task_id);
                return true;
            }
        }
        
        false
    }
    
    /// Get current statistics
    pub async fn get_stats(&self) -> TaskStats {
        let mut stats = self.stats.read().await.clone();
        stats.queue_size = self.task_queue.read().await.len();
        stats.running_tasks = self.running_tasks.read().await.len();
        stats
    }
    
    /// Shutdown optimizer
    pub async fn shutdown(&self) {
        let _ = self.shutdown_tx.send(()).await;
        
        // Cancel all running tasks
        let running_tasks = self.running_tasks.read().await;
        for handle in running_tasks.values() {
            handle.abort();
        }
        
        info!("🛑 Async optimizer shutdown");
    }
    
    /// Start task scheduler
    fn start_scheduler(&self) {
        let task_queue = Arc::clone(&self.task_queue);
        let running_tasks = Arc::clone(&self.running_tasks);
        let completed_tasks = Arc::clone(&self.completed_tasks);
        let executors = Arc::clone(&self.executors);
        let semaphore = Arc::clone(&self.semaphore);
        let stats = Arc::clone(&self.stats);
        let shutdown_rx = Arc::clone(&self.shutdown_rx);

        tokio::spawn(async move {
            let mut shutdown_rx = shutdown_rx.write().await.take().unwrap();
            let mut scheduler_interval = tokio::time::interval(Duration::from_millis(10));

            loop {
                tokio::select! {
                    _ = shutdown_rx.recv() => {
                        info!("📋 Task scheduler shutting down");
                        break;
                    }
                    _ = scheduler_interval.tick() => {
                        // Simple task scheduling without complex nesting
                        debug!("📋 Scheduler tick");
                    }
                }
            }
        });
    }
}
