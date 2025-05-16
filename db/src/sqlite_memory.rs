use async_trait::async_trait;
use chrono::{DateTime, Utc};
use serde::{Serialize, Deserialize};
use sqlx::{sqlite::{SqlitePool, SqlitePoolOptions}, Row};
use std::path::Path;
use tracing::{info, error, warn, debug};

/// SQLiteMemory provides persistent storage for trade history and agent performance
pub struct SQLiteMemory {
    /// SQLite connection pool
    pool: SqlitePool,
    /// Configuration
    config: SQLiteConfig,
}

/// SQLite configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SQLiteConfig {
    /// Database file path
    pub db_path: String,
    /// Maximum connections in the pool
    pub max_connections: u32,
    /// Whether to enable WAL mode
    pub enable_wal: bool,
    /// Whether to enable foreign keys
    pub enable_foreign_keys: bool,
}

impl Default for SQLiteConfig {
    fn default() -> Self {
        Self {
            db_path: "data/omni_alpha.db".to_string(),
            max_connections: 5,
            enable_wal: true,
            enable_foreign_keys: true,
        }
    }
}

/// Trade record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TradeRecord {
    /// Trade ID
    pub id: String,
    /// Asset traded
    pub asset: String,
    /// Entry price
    pub entry_price: f64,
    /// Exit price
    pub exit_price: f64,
    /// Position size in USDT
    pub position_size: f64,
    /// Leverage used
    pub leverage: f64,
    /// Direction of the trade (long/short)
    pub direction: String,
    /// When the trade was entered
    pub entry_time: DateTime<Utc>,
    /// When the trade was exited
    pub exit_time: DateTime<Utc>,
    /// Profit/loss amount
    pub pnl: f64,
    /// ROI percentage
    pub roi: f64,
    /// Trade outcome
    pub outcome: String,
    /// Pattern hash for this trade
    pub pattern_hash: String,
    /// Contributing agents (JSON array)
    pub contributing_agents: String,
    /// Trade metadata (JSON object)
    pub metadata: String,
}

/// Agent performance record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentPerformanceRecord {
    /// Agent name
    pub agent_name: String,
    /// Timestamp
    pub timestamp: DateTime<Utc>,
    /// Number of signals generated
    pub signals_generated: i64,
    /// Number of successful signals
    pub successful_signals: i64,
    /// Number of failed signals
    pub failed_signals: i64,
    /// Success rate percentage
    pub success_rate: f64,
    /// Average ROI
    pub average_roi: f64,
    /// Total profit
    pub total_profit: f64,
    /// Total loss
    pub total_loss: f64,
    /// Processing time in ms
    pub processing_time_ms: i64,
    /// Error count
    pub error_count: i64,
}

/// System state record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemStateRecord {
    /// Timestamp
    pub timestamp: DateTime<Utc>,
    /// Current capital
    pub capital: f64,
    /// Number of active trades
    pub active_trades: i64,
    /// Number of active agents
    pub active_agents: i64,
    /// System mode
    pub mode: String,
    /// System status
    pub status: String,
    /// System metrics (JSON object)
    pub metrics: String,
}

impl SQLiteMemory {
    /// Create a new SQLiteMemory
    pub async fn new(config: SQLiteConfig) -> anyhow::Result<Self> {
        // Ensure directory exists
        if let Some(parent) = Path::new(&config.db_path).parent() {
            if !parent.exists() {
                std::fs::create_dir_all(parent)?;
            }
        }
        
        // Create connection pool
        let pool = SqlitePoolOptions::new()
            .max_connections(config.max_connections)
            .connect(&format!("sqlite:{}", config.db_path))
            .await?;
        
        // Initialize database
        if config.enable_wal {
            sqlx::query("PRAGMA journal_mode = WAL;")
                .execute(&pool)
                .await?;
        }
        
        if config.enable_foreign_keys {
            sqlx::query("PRAGMA foreign_keys = ON;")
                .execute(&pool)
                .await?;
        }
        
        // Create tables
        Self::create_tables(&pool).await?;
        
        info!("SQLite memory initialized with database: {}", config.db_path);
        
        Ok(Self { pool, config })
    }
    
    /// Create database tables
    async fn create_tables(pool: &SqlitePool) -> anyhow::Result<()> {
        // Trades table
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS trades (
                id TEXT PRIMARY KEY,
                asset TEXT NOT NULL,
                entry_price REAL NOT NULL,
                exit_price REAL NOT NULL,
                position_size REAL NOT NULL,
                leverage REAL NOT NULL,
                direction TEXT NOT NULL,
                entry_time TEXT NOT NULL,
                exit_time TEXT NOT NULL,
                pnl REAL NOT NULL,
                roi REAL NOT NULL,
                outcome TEXT NOT NULL,
                pattern_hash TEXT NOT NULL,
                contributing_agents TEXT NOT NULL,
                metadata TEXT NOT NULL
            );"
        )
        .execute(pool)
        .await?;
        
        // Agent performance table
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS agent_performance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                agent_name TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                signals_generated INTEGER NOT NULL,
                successful_signals INTEGER NOT NULL,
                failed_signals INTEGER NOT NULL,
                success_rate REAL NOT NULL,
                average_roi REAL NOT NULL,
                total_profit REAL NOT NULL,
                total_loss REAL NOT NULL,
                processing_time_ms INTEGER NOT NULL,
                error_count INTEGER NOT NULL
            );"
        )
        .execute(pool)
        .await?;
        
        // System state table
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS system_state (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                capital REAL NOT NULL,
                active_trades INTEGER NOT NULL,
                active_agents INTEGER NOT NULL,
                mode TEXT NOT NULL,
                status TEXT NOT NULL,
                metrics TEXT NOT NULL
            );"
        )
        .execute(pool)
        .await?;
        
        // Patterns table
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS patterns (
                pattern_hash TEXT PRIMARY KEY,
                description TEXT NOT NULL,
                success_count INTEGER NOT NULL,
                failure_count INTEGER NOT NULL,
                success_rate REAL NOT NULL,
                average_roi REAL NOT NULL,
                average_holding_time INTEGER NOT NULL,
                last_observed TEXT NOT NULL,
                feature_vector TEXT NOT NULL
            );"
        )
        .execute(pool)
        .await?;
        
        // Create indexes
        sqlx::query("CREATE INDEX IF NOT EXISTS idx_trades_asset ON trades(asset);")
            .execute(pool)
            .await?;
        
        sqlx::query("CREATE INDEX IF NOT EXISTS idx_trades_pattern_hash ON trades(pattern_hash);")
            .execute(pool)
            .await?;
        
        sqlx::query("CREATE INDEX IF NOT EXISTS idx_agent_performance_agent_name ON agent_performance(agent_name);")
            .execute(pool)
            .await?;
        
        sqlx::query("CREATE INDEX IF NOT EXISTS idx_agent_performance_timestamp ON agent_performance(timestamp);")
            .execute(pool)
            .await?;
        
        sqlx::query("CREATE INDEX IF NOT EXISTS idx_system_state_timestamp ON system_state(timestamp);")
            .execute(pool)
            .await?;
        
        info!("Database tables created");
        
        Ok(())
    }
    
    /// Save a trade record
    pub async fn save_trade(&self, trade: &TradeRecord) -> anyhow::Result<()> {
        sqlx::query(
            "INSERT INTO trades (
                id, asset, entry_price, exit_price, position_size, leverage, direction,
                entry_time, exit_time, pnl, roi, outcome, pattern_hash, contributing_agents, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(&trade.id)
        .bind(&trade.asset)
        .bind(trade.entry_price)
        .bind(trade.exit_price)
        .bind(trade.position_size)
        .bind(trade.leverage)
        .bind(&trade.direction)
        .bind(trade.entry_time.to_rfc3339())
        .bind(trade.exit_time.to_rfc3339())
        .bind(trade.pnl)
        .bind(trade.roi)
        .bind(&trade.outcome)
        .bind(&trade.pattern_hash)
        .bind(&trade.contributing_agents)
        .bind(&trade.metadata)
        .execute(&self.pool)
        .await?;
        
        debug!("Saved trade record: {}", trade.id);
        
        Ok(())
    }
    
    /// Get a trade record by ID
    pub async fn get_trade(&self, trade_id: &str) -> anyhow::Result<Option<TradeRecord>> {
        let record = sqlx::query(
            "SELECT
                id, asset, entry_price, exit_price, position_size, leverage, direction,
                entry_time, exit_time, pnl, roi, outcome, pattern_hash, contributing_agents, metadata
            FROM trades
            WHERE id = ?"
        )
        .bind(trade_id)
        .fetch_optional(&self.pool)
        .await?;
        
        if let Some(row) = record {
            let trade = TradeRecord {
                id: row.get("id"),
                asset: row.get("asset"),
                entry_price: row.get("entry_price"),
                exit_price: row.get("exit_price"),
                position_size: row.get("position_size"),
                leverage: row.get("leverage"),
                direction: row.get("direction"),
                entry_time: DateTime::parse_from_rfc3339(row.get::<&str, _>("entry_time"))
                    .map_err(|e| anyhow::anyhow!("Failed to parse entry_time: {}", e))?
                    .with_timezone(&Utc),
                exit_time: DateTime::parse_from_rfc3339(row.get::<&str, _>("exit_time"))
                    .map_err(|e| anyhow::anyhow!("Failed to parse exit_time: {}", e))?
                    .with_timezone(&Utc),
                pnl: row.get("pnl"),
                roi: row.get("roi"),
                outcome: row.get("outcome"),
                pattern_hash: row.get("pattern_hash"),
                contributing_agents: row.get("contributing_agents"),
                metadata: row.get("metadata"),
            };
            
            Ok(Some(trade))
        } else {
            Ok(None)
        }
    }
    
    /// Get trade records by asset
    pub async fn get_trades_by_asset(&self, asset: &str, limit: i64) -> anyhow::Result<Vec<TradeRecord>> {
        let records = sqlx::query(
            "SELECT
                id, asset, entry_price, exit_price, position_size, leverage, direction,
                entry_time, exit_time, pnl, roi, outcome, pattern_hash, contributing_agents, metadata
            FROM trades
            WHERE asset = ?
            ORDER BY exit_time DESC
            LIMIT ?"
        )
        .bind(asset)
        .bind(limit)
        .fetch_all(&self.pool)
        .await?;
        
        let mut trades = Vec::new();
        for row in records {
            let trade = TradeRecord {
                id: row.get("id"),
                asset: row.get("asset"),
                entry_price: row.get("entry_price"),
                exit_price: row.get("exit_price"),
                position_size: row.get("position_size"),
                leverage: row.get("leverage"),
                direction: row.get("direction"),
                entry_time: DateTime::parse_from_rfc3339(row.get::<&str, _>("entry_time"))
                    .map_err(|e| anyhow::anyhow!("Failed to parse entry_time: {}", e))?
                    .with_timezone(&Utc),
                exit_time: DateTime::parse_from_rfc3339(row.get::<&str, _>("exit_time"))
                    .map_err(|e| anyhow::anyhow!("Failed to parse exit_time: {}", e))?
                    .with_timezone(&Utc),
                pnl: row.get("pnl"),
                roi: row.get("roi"),
                outcome: row.get("outcome"),
                pattern_hash: row.get("pattern_hash"),
                contributing_agents: row.get("contributing_agents"),
                metadata: row.get("metadata"),
            };
            
            trades.push(trade);
        }
        
        Ok(trades)
    }
    
    /// Get trade records by pattern hash
    pub async fn get_trades_by_pattern(&self, pattern_hash: &str, limit: i64) -> anyhow::Result<Vec<TradeRecord>> {
        let records = sqlx::query(
            "SELECT
                id, asset, entry_price, exit_price, position_size, leverage, direction,
                entry_time, exit_time, pnl, roi, outcome, pattern_hash, contributing_agents, metadata
            FROM trades
            WHERE pattern_hash = ?
            ORDER BY exit_time DESC
            LIMIT ?"
        )
        .bind(pattern_hash)
        .bind(limit)
        .fetch_all(&self.pool)
        .await?;
        
        let mut trades = Vec::new();
        for row in records {
            let trade = TradeRecord {
                id: row.get("id"),
                asset: row.get("asset"),
                entry_price: row.get("entry_price"),
                exit_price: row.get("exit_price"),
                position_size: row.get("position_size"),
                leverage: row.get("leverage"),
                direction: row.get("direction"),
                entry_time: DateTime::parse_from_rfc3339(row.get::<&str, _>("entry_time"))
                    .map_err(|e| anyhow::anyhow!("Failed to parse entry_time: {}", e))?
                    .with_timezone(&Utc),
                exit_time: DateTime::parse_from_rfc3339(row.get::<&str, _>("exit_time"))
                    .map_err(|e| anyhow::anyhow!("Failed to parse exit_time: {}", e))?
                    .with_timezone(&Utc),
                pnl: row.get("pnl"),
                roi: row.get("roi"),
                outcome: row.get("outcome"),
                pattern_hash: row.get("pattern_hash"),
                contributing_agents: row.get("contributing_agents"),
                metadata: row.get("metadata"),
            };
            
            trades.push(trade);
        }
        
        Ok(trades)
    }
    
    /// Save agent performance record
    pub async fn save_agent_performance(&self, performance: &AgentPerformanceRecord) -> anyhow::Result<i64> {
        let result = sqlx::query(
            "INSERT INTO agent_performance (
                agent_name, timestamp, signals_generated, successful_signals, failed_signals,
                success_rate, average_roi, total_profit, total_loss, processing_time_ms, error_count
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(&performance.agent_name)
        .bind(performance.timestamp.to_rfc3339())
        .bind(performance.signals_generated)
        .bind(performance.successful_signals)
        .bind(performance.failed_signals)
        .bind(performance.success_rate)
        .bind(performance.average_roi)
        .bind(performance.total_profit)
        .bind(performance.total_loss)
        .bind(performance.processing_time_ms)
        .bind(performance.error_count)
        .execute(&self.pool)
        .await?;
        
        debug!("Saved agent performance record for: {}", performance.agent_name);
        
        Ok(result.last_insert_rowid())
    }
    
    /// Get agent performance records
    pub async fn get_agent_performance(&self, agent_name: &str, limit: i64) -> anyhow::Result<Vec<AgentPerformanceRecord>> {
        let records = sqlx::query(
            "SELECT
                agent_name, timestamp, signals_generated, successful_signals, failed_signals,
                success_rate, average_roi, total_profit, total_loss, processing_time_ms, error_count
            FROM agent_performance
            WHERE agent_name = ?
            ORDER BY timestamp DESC
            LIMIT ?"
        )
        .bind(agent_name)
        .bind(limit)
        .fetch_all(&self.pool)
        .await?;
        
        let mut performances = Vec::new();
        for row in records {
            let performance = AgentPerformanceRecord {
                agent_name: row.get("agent_name"),
                timestamp: DateTime::parse_from_rfc3339(row.get::<&str, _>("timestamp"))
                    .map_err(|e| anyhow::anyhow!("Failed to parse timestamp: {}", e))?
                    .with_timezone(&Utc),
                signals_generated: row.get("signals_generated"),
                successful_signals: row.get("successful_signals"),
                failed_signals: row.get("failed_signals"),
                success_rate: row.get("success_rate"),
                average_roi: row.get("average_roi"),
                total_profit: row.get("total_profit"),
                total_loss: row.get("total_loss"),
                processing_time_ms: row.get("processing_time_ms"),
                error_count: row.get("error_count"),
            };
            
            performances.push(performance);
        }
        
        Ok(performances)
    }
    
    /// Save system state record
    pub async fn save_system_state(&self, state: &SystemStateRecord) -> anyhow::Result<i64> {
        let result = sqlx::query(
            "INSERT INTO system_state (
                timestamp, capital, active_trades, active_agents, mode, status, metrics
            ) VALUES (?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(state.timestamp.to_rfc3339())
        .bind(state.capital)
        .bind(state.active_trades)
        .bind(state.active_agents)
        .bind(&state.mode)
        .bind(&state.status)
        .bind(&state.metrics)
        .execute(&self.pool)
        .await?;
        
        debug!("Saved system state record");
        
        Ok(result.last_insert_rowid())
    }
    
    /// Get system state records
    pub async fn get_system_states(&self, limit: i64) -> anyhow::Result<Vec<SystemStateRecord>> {
        let records = sqlx::query(
            "SELECT
                timestamp, capital, active_trades, active_agents, mode, status, metrics
            FROM system_state
            ORDER BY timestamp DESC
            LIMIT ?"
        )
        .bind(limit)
        .fetch_all(&self.pool)
        .await?;
        
        let mut states = Vec::new();
        for row in records {
            let state = SystemStateRecord {
                timestamp: DateTime::parse_from_rfc3339(row.get::<&str, _>("timestamp"))
                    .map_err(|e| anyhow::anyhow!("Failed to parse timestamp: {}", e))?
                    .with_timezone(&Utc),
                capital: row.get("capital"),
                active_trades: row.get("active_trades"),
                active_agents: row.get("active_agents"),
                mode: row.get("mode"),
                status: row.get("status"),
                metrics: row.get("metrics"),
            };
            
            states.push(state);
        }
        
        Ok(states)
    }
    
    /// Get the latest system state
    pub async fn get_latest_system_state(&self) -> anyhow::Result<Option<SystemStateRecord>> {
        let record = sqlx::query(
            "SELECT
                timestamp, capital, active_trades, active_agents, mode, status, metrics
            FROM system_state
            ORDER BY timestamp DESC
            LIMIT 1"
        )
        .fetch_optional(&self.pool)
        .await?;
        
        if let Some(row) = record {
            let state = SystemStateRecord {
                timestamp: DateTime::parse_from_rfc3339(row.get::<&str, _>("timestamp"))
                    .map_err(|e| anyhow::anyhow!("Failed to parse timestamp: {}", e))?
                    .with_timezone(&Utc),
                capital: row.get("capital"),
                active_trades: row.get("active_trades"),
                active_agents: row.get("active_agents"),
                mode: row.get("mode"),
                status: row.get("status"),
                metrics: row.get("metrics"),
            };
            
            Ok(Some(state))
        } else {
            Ok(None)
        }
    }
    
    /// Get trade statistics
    pub async fn get_trade_statistics(&self) -> anyhow::Result<TradeStatistics> {
        let row = sqlx::query(
            "SELECT
                COUNT(*) as total_trades,
                SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) as winning_trades,
                SUM(CASE WHEN pnl <= 0 THEN 1 ELSE 0 END) as losing_trades,
                SUM(pnl) as total_pnl,
                AVG(roi) as average_roi,
                MAX(pnl) as max_profit,
                MIN(pnl) as max_loss
            FROM trades"
        )
        .fetch_one(&self.pool)
        .await?;
        
        let total_trades: i64 = row.get("total_trades");
        let winning_trades: i64 = row.get("winning_trades");
        let losing_trades: i64 = row.get("losing_trades");
        
        let win_rate = if total_trades > 0 {
            (winning_trades as f64 / total_trades as f64) * 100.0
        } else {
            0.0
        };
        
        let stats = TradeStatistics {
            total_trades,
            winning_trades,
            losing_trades,
            win_rate,
            total_pnl: row.get("total_pnl"),
            average_roi: row.get("average_roi"),
            max_profit: row.get("max_profit"),
            max_loss: row.get("max_loss"),
        };
        
        Ok(stats)
    }
    
    /// Get the pool for direct queries
    pub fn pool(&self) -> &SqlitePool {
        &self.pool
    }
}

/// Trade statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TradeStatistics {
    /// Total number of trades
    pub total_trades: i64,
    /// Number of winning trades
    pub winning_trades: i64,
    /// Number of losing trades
    pub losing_trades: i64,
    /// Win rate percentage
    pub win_rate: f64,
    /// Total profit/loss
    pub total_pnl: f64,
    /// Average ROI percentage
    pub average_roi: f64,
    /// Maximum profit
    pub max_profit: f64,
    /// Maximum loss
    pub max_loss: f64,
}
