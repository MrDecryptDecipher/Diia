//! Cache Management System
//!
//! Provides intelligent caching for market data, API responses, and computed values
//! to optimize performance and reduce API calls.

use std::collections::HashMap;
use std::hash::Hash;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::RwLock;
use tracing::{debug, info, warn};
use serde::{Serialize, Deserialize};

/// Cache entry with expiration and metadata
#[derive(Debug, Clone)]
pub struct CacheEntry<T> {
    /// Cached value
    pub value: T,
    
    /// Creation timestamp
    pub created_at: Instant,
    
    /// Expiration time
    pub expires_at: Instant,
    
    /// Access count
    pub access_count: u64,
    
    /// Last access time
    pub last_accessed: Instant,
    
    /// Size in bytes (estimated)
    pub size_bytes: usize,
}

impl<T> CacheEntry<T> {
    /// Create new cache entry
    pub fn new(value: T, ttl: Duration, size_bytes: usize) -> Self {
        let now = Instant::now();
        Self {
            value,
            created_at: now,
            expires_at: now + ttl,
            access_count: 0,
            last_accessed: now,
            size_bytes,
        }
    }
    
    /// Check if entry is expired
    pub fn is_expired(&self) -> bool {
        Instant::now() > self.expires_at
    }
    
    /// Mark as accessed
    pub fn mark_accessed(&mut self) {
        self.access_count += 1;
        self.last_accessed = Instant::now();
    }
    
    /// Get age of entry
    pub fn age(&self) -> Duration {
        Instant::now() - self.created_at
    }
}

/// Cache statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheStats {
    /// Total entries
    pub total_entries: usize,
    
    /// Total size in bytes
    pub total_size_bytes: usize,
    
    /// Hit count
    pub hits: u64,
    
    /// Miss count
    pub misses: u64,
    
    /// Hit ratio
    pub hit_ratio: f64,
    
    /// Eviction count
    pub evictions: u64,
    
    /// Average access time
    pub avg_access_time_ms: f64,
}

/// Cache eviction policy
#[derive(Debug, Clone)]
pub enum EvictionPolicy {
    /// Least Recently Used
    LRU,
    
    /// Least Frequently Used
    LFU,
    
    /// Time To Live
    TTL,
    
    /// First In First Out
    FIFO,
}

/// Intelligent cache manager
pub struct CacheManager<K, V>
where
    K: Clone + Eq + Hash + Send + Sync,
    V: Clone + Send + Sync,
{
    /// Cache storage
    cache: Arc<RwLock<HashMap<K, CacheEntry<V>>>>,
    
    /// Maximum cache size
    max_size: usize,
    
    /// Maximum memory usage in bytes
    max_memory_bytes: usize,
    
    /// Default TTL for entries
    default_ttl: Duration,
    
    /// Eviction policy
    eviction_policy: EvictionPolicy,
    
    /// Cache statistics
    stats: Arc<RwLock<CacheStats>>,
    
    /// Cleanup interval
    cleanup_interval: Duration,
}

impl<K, V> CacheManager<K, V>
where
    K: Clone + Eq + Hash + Send + Sync + 'static,
    V: Clone + Send + Sync + 'static,
{
    /// Create new cache manager
    pub fn new(
        max_size: usize,
        max_memory_bytes: usize,
        default_ttl: Duration,
        eviction_policy: EvictionPolicy,
    ) -> Self {
        let cache_manager = Self {
            cache: Arc::new(RwLock::new(HashMap::new())),
            max_size,
            max_memory_bytes,
            default_ttl,
            eviction_policy,
            stats: Arc::new(RwLock::new(CacheStats {
                total_entries: 0,
                total_size_bytes: 0,
                hits: 0,
                misses: 0,
                hit_ratio: 0.0,
                evictions: 0,
                avg_access_time_ms: 0.0,
            })),
            cleanup_interval: Duration::from_secs(300), // 5 minutes
        };
        
        // Start background cleanup task
        cache_manager.start_cleanup_task();
        
        cache_manager
    }
    
    /// Get value from cache
    pub async fn get(&self, key: &K) -> Option<V> {
        let start_time = Instant::now();
        
        let mut cache = self.cache.write().await;
        let mut stats = self.stats.write().await;
        
        if let Some(entry) = cache.get_mut(key) {
            if entry.is_expired() {
                cache.remove(key);
                stats.misses += 1;
                None
            } else {
                entry.mark_accessed();
                stats.hits += 1;
                Some(entry.value.clone())
            }
        } else {
            stats.misses += 1;
            None
        }
        .map(|value| {
            // Update average access time
            let access_time = start_time.elapsed().as_millis() as f64;
            let total_accesses = stats.hits + stats.misses;
            stats.avg_access_time_ms = 
                (stats.avg_access_time_ms * (total_accesses - 1) as f64 + access_time) / total_accesses as f64;
            
            // Update hit ratio
            stats.hit_ratio = stats.hits as f64 / total_accesses as f64;
            
            value
        })
    }
    
    /// Put value in cache
    pub async fn put(&self, key: K, value: V, ttl: Option<Duration>) -> bool {
        let ttl = ttl.unwrap_or(self.default_ttl);
        let size_bytes = std::mem::size_of::<V>(); // Rough estimate
        
        let mut cache = self.cache.write().await;
        let mut stats = self.stats.write().await;
        
        // Check if we need to evict entries
        if cache.len() >= self.max_size || 
           stats.total_size_bytes + size_bytes > self.max_memory_bytes {
            self.evict_entries(&mut cache, &mut stats).await;
        }
        
        // Add new entry
        let entry = CacheEntry::new(value, ttl, size_bytes);
        cache.insert(key, entry);
        
        stats.total_entries = cache.len();
        stats.total_size_bytes += size_bytes;
        
        true
    }
    
    /// Remove entry from cache
    pub async fn remove(&self, key: &K) -> Option<V> {
        let mut cache = self.cache.write().await;
        let mut stats = self.stats.write().await;
        
        if let Some(entry) = cache.remove(key) {
            stats.total_entries = cache.len();
            stats.total_size_bytes = stats.total_size_bytes.saturating_sub(entry.size_bytes);
            Some(entry.value)
        } else {
            None
        }
    }
    
    /// Clear all cache entries
    pub async fn clear(&self) {
        let mut cache = self.cache.write().await;
        let mut stats = self.stats.write().await;
        
        cache.clear();
        stats.total_entries = 0;
        stats.total_size_bytes = 0;
        
        info!("🧹 Cache cleared");
    }
    
    /// Get cache statistics
    pub async fn get_stats(&self) -> CacheStats {
        self.stats.read().await.clone()
    }
    
    /// Check if key exists in cache
    pub async fn contains_key(&self, key: &K) -> bool {
        let cache = self.cache.read().await;
        cache.contains_key(key) && !cache.get(key).unwrap().is_expired()
    }
    
    /// Get cache size
    pub async fn size(&self) -> usize {
        self.cache.read().await.len()
    }
    
    /// Evict entries based on policy
    async fn evict_entries(
        &self,
        cache: &mut HashMap<K, CacheEntry<V>>,
        stats: &mut CacheStats,
    ) {
        let entries_to_remove: Vec<_> = match self.eviction_policy {
            EvictionPolicy::LRU => {
                // Find least recently used entries
                let mut entries: Vec<_> = cache.iter().collect();
                entries.sort_by_key(|(_, entry)| entry.last_accessed);
                entries.into_iter().take(cache.len() / 4).map(|(k, _)| k.clone()).collect()
            }
            EvictionPolicy::LFU => {
                // Find least frequently used entries
                let mut entries: Vec<_> = cache.iter().collect();
                entries.sort_by_key(|(_, entry)| entry.access_count);
                entries.into_iter().take(cache.len() / 4).map(|(k, _)| k.clone()).collect()
            }
            EvictionPolicy::TTL => {
                // Remove expired entries
                cache.iter()
                    .filter(|(_, entry)| entry.is_expired())
                    .map(|(k, _)| k.clone())
                    .collect()
            }
            EvictionPolicy::FIFO => {
                // Remove oldest entries
                let mut entries: Vec<_> = cache.iter().collect();
                entries.sort_by_key(|(_, entry)| entry.created_at);
                entries.into_iter().take(cache.len() / 4).map(|(k, _)| k.clone()).collect()
            }
        };
        
        for key in entries_to_remove {
            if let Some(entry) = cache.remove(&key) {
                stats.total_size_bytes = stats.total_size_bytes.saturating_sub(entry.size_bytes);
                stats.evictions += 1;
            }
        }
        
        stats.total_entries = cache.len();
        
        debug!("🗑️ Evicted {} cache entries", stats.evictions);
    }
    
    /// Start background cleanup task
    fn start_cleanup_task(&self) {
        let cache = Arc::clone(&self.cache);
        let stats = Arc::clone(&self.stats);
        let cleanup_interval = self.cleanup_interval;
        
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(cleanup_interval);
            
            loop {
                interval.tick().await;
                
                // Remove expired entries
                let mut cache_guard = cache.write().await;
                let mut stats_guard = stats.write().await;
                
                let expired_keys: Vec<_> = cache_guard
                    .iter()
                    .filter(|(_, entry)| entry.is_expired())
                    .map(|(k, _)| k.clone())
                    .collect();
                
                for key in expired_keys {
                    if let Some(entry) = cache_guard.remove(&key) {
                        stats_guard.total_size_bytes = 
                            stats_guard.total_size_bytes.saturating_sub(entry.size_bytes);
                    }
                }
                
                stats_guard.total_entries = cache_guard.len();
                
                if !cache_guard.is_empty() {
                    debug!("🧹 Cache cleanup: {} entries remaining", cache_guard.len());
                }
            }
        });
    }
}

/// Create optimized cache for market data
pub fn create_market_data_cache<K, V>() -> CacheManager<K, V>
where
    K: Clone + Eq + Hash + Send + Sync + 'static,
    V: Clone + Send + Sync + 'static,
{
    CacheManager::new(
        10000,                              // Max 10k entries
        100 * 1024 * 1024,                 // Max 100MB
        Duration::from_secs(300),           // 5 minute TTL
        EvictionPolicy::LRU,                // LRU eviction
    )
}

/// Create optimized cache for API responses
pub fn create_api_response_cache<K, V>() -> CacheManager<K, V>
where
    K: Clone + Eq + Hash + Send + Sync + 'static,
    V: Clone + Send + Sync + 'static,
{
    CacheManager::new(
        5000,                               // Max 5k entries
        50 * 1024 * 1024,                  // Max 50MB
        Duration::from_secs(60),            // 1 minute TTL
        EvictionPolicy::TTL,                // TTL-based eviction
    )
}
