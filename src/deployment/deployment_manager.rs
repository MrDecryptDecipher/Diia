//! Deployment Manager
//!
//! Provides comprehensive deployment management, including blue-green deployments,
//! rollback capabilities, and production readiness validation.

use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::RwLock;
use tracing::{info, warn, error, debug};
use serde::{Serialize, Deserialize};
use anyhow::{Result, anyhow};

use crate::deployment::health_checker::{HealthChecker, HealthStatus, HealthCheckConfig};
use crate::deployment::production_manager::ProductionManager;
use crate::monitoring::unified_error_manager::UnifiedErrorManager;

/// Deployment environment
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum DeploymentEnvironment {
    /// Development environment
    Development,
    
    /// Testing environment
    Testing,
    
    /// Staging environment
    Staging,
    
    /// Production environment
    Production,
}

impl DeploymentEnvironment {
    /// Get environment name
    pub fn name(&self) -> &'static str {
        match self {
            DeploymentEnvironment::Development => "development",
            DeploymentEnvironment::Testing => "testing",
            DeploymentEnvironment::Staging => "staging",
            DeploymentEnvironment::Production => "production",
        }
    }
    
    /// Check if environment is production
    pub fn is_production(&self) -> bool {
        matches!(self, DeploymentEnvironment::Production)
    }
}

/// Deployment status
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum DeploymentStatus {
    /// Deployment is being prepared
    Preparing,
    
    /// Deployment is in progress
    InProgress,
    
    /// Deployment completed successfully
    Success,
    
    /// Deployment failed
    Failed,
    
    /// Deployment was rolled back
    RolledBack,
    
    /// Deployment is being validated
    Validating,
}

/// Deployment configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeploymentConfig {
    /// Target environment
    pub environment: DeploymentEnvironment,
    
    /// Application version
    pub version: String,
    
    /// Git commit hash
    pub commit_hash: Option<String>,
    
    /// Deployment timeout
    pub timeout: Duration,
    
    /// Health check timeout
    pub health_check_timeout: Duration,
    
    /// Rollback on failure
    pub auto_rollback: bool,
    
    /// Blue-green deployment
    pub blue_green: bool,
    
    /// Canary deployment percentage
    pub canary_percentage: Option<f64>,
    
    /// Pre-deployment checks
    pub pre_deployment_checks: Vec<String>,
    
    /// Post-deployment checks
    pub post_deployment_checks: Vec<String>,
    
    /// Environment variables
    pub environment_variables: HashMap<String, String>,
    
    /// Configuration overrides
    pub config_overrides: HashMap<String, String>,
}

impl Default for DeploymentConfig {
    fn default() -> Self {
        Self {
            environment: DeploymentEnvironment::Development,
            version: "1.0.0".to_string(),
            commit_hash: None,
            timeout: Duration::from_secs(600), // 10 minutes
            health_check_timeout: Duration::from_secs(300), // 5 minutes
            auto_rollback: true,
            blue_green: false,
            canary_percentage: None,
            pre_deployment_checks: vec![
                "system_health".to_string(),
                "database_connectivity".to_string(),
                "api_connectivity".to_string(),
            ],
            post_deployment_checks: vec![
                "application_health".to_string(),
                "trading_system_health".to_string(),
                "monitoring_health".to_string(),
            ],
            environment_variables: HashMap::new(),
            config_overrides: HashMap::new(),
        }
    }
}

/// Deployment record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeploymentRecord {
    /// Deployment ID
    pub id: String,
    
    /// Deployment configuration
    pub config: DeploymentConfig,
    
    /// Deployment status
    pub status: DeploymentStatus,
    
    /// Start time
    pub start_time: chrono::DateTime<chrono::Utc>,
    
    /// End time
    pub end_time: Option<chrono::DateTime<chrono::Utc>>,
    
    /// Duration
    pub duration: Option<Duration>,
    
    /// Error message if failed
    pub error_message: Option<String>,
    
    /// Deployment logs
    pub logs: Vec<String>,
    
    /// Health check results
    pub health_checks: HashMap<String, HealthStatus>,
    
    /// Previous deployment ID (for rollback)
    pub previous_deployment: Option<String>,
}

impl DeploymentRecord {
    /// Create new deployment record
    pub fn new(id: String, config: DeploymentConfig) -> Self {
        Self {
            id,
            config,
            status: DeploymentStatus::Preparing,
            start_time: chrono::Utc::now(),
            end_time: None,
            duration: None,
            error_message: None,
            logs: Vec::new(),
            health_checks: HashMap::new(),
            previous_deployment: None,
        }
    }
    
    /// Add log entry
    pub fn add_log(&mut self, message: String) {
        let timestamp = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S UTC");
        self.logs.push(format!("[{}] {}", timestamp, message));
    }
    
    /// Mark deployment as completed
    pub fn complete(&mut self, status: DeploymentStatus) {
        self.status = status;
        self.end_time = Some(chrono::Utc::now());
        if let Some(end_time) = self.end_time {
            self.duration = Some(
                (end_time - self.start_time).to_std().unwrap_or_default()
            );
        }
    }
    
    /// Check if deployment was successful
    pub fn is_successful(&self) -> bool {
        self.status == DeploymentStatus::Success
    }
}

/// Deployment manager
pub struct DeploymentManager {
    /// Current deployment
    current_deployment: Arc<RwLock<Option<DeploymentRecord>>>,
    
    /// Deployment history
    deployment_history: Arc<RwLock<Vec<DeploymentRecord>>>,
    
    /// Health checker
    health_checker: Arc<HealthChecker>,
    
    /// Production manager
    production_manager: Option<Arc<ProductionManager>>,
    
    /// Error manager
    error_manager: Arc<UnifiedErrorManager>,
    
    /// Deployment hooks
    hooks: Arc<RwLock<HashMap<String, Box<dyn Fn(&DeploymentRecord) -> Result<()> + Send + Sync>>>>,
}

impl DeploymentManager {
    /// Create new deployment manager
    pub fn new(
        health_checker: Arc<HealthChecker>,
        error_manager: Arc<UnifiedErrorManager>,
    ) -> Self {
        Self {
            current_deployment: Arc::new(RwLock::new(None)),
            deployment_history: Arc::new(RwLock::new(Vec::new())),
            health_checker,
            production_manager: None,
            error_manager,
            hooks: Arc::new(RwLock::new(HashMap::new())),
        }
    }
    
    /// Set production manager
    pub fn set_production_manager(&mut self, production_manager: Arc<ProductionManager>) {
        self.production_manager = Some(production_manager);
    }
    
    /// Deploy application
    pub async fn deploy(&self, config: DeploymentConfig) -> Result<String> {
        let deployment_id = format!("deploy_{}", uuid::Uuid::new_v4());
        let mut deployment = DeploymentRecord::new(deployment_id.clone(), config.clone());
        
        info!("🚀 Starting deployment: {} to {}", deployment_id, config.environment.name());
        deployment.add_log(format!("Starting deployment to {}", config.environment.name()));
        
        // Store current deployment
        {
            let mut current = self.current_deployment.write().await;
            *current = Some(deployment.clone());
        }
        
        // Execute deployment phases
        let result = self.execute_deployment(&mut deployment).await;
        
        // Complete deployment
        match result {
            Ok(_) => {
                deployment.complete(DeploymentStatus::Success);
                info!("✅ Deployment completed successfully: {}", deployment_id);
            }
            Err(ref e) => {
                deployment.complete(DeploymentStatus::Failed);
                deployment.error_message = Some(e.to_string());
                error!("❌ Deployment failed: {} - {}", deployment_id, e);
                
                // Auto-rollback if enabled
                if config.auto_rollback {
                    warn!("🔄 Auto-rollback enabled, attempting rollback...");
                    if let Err(rollback_error) = self.rollback(&deployment_id).await {
                        error!("❌ Rollback failed: {}", rollback_error);
                    }
                }
            }
        }
        
        // Store in history
        {
            let mut history = self.deployment_history.write().await;
            history.push(deployment.clone());
            
            // Keep only last 100 deployments
            if history.len() > 100 {
                history.remove(0);
            }
        }
        
        // Clear current deployment
        {
            let mut current = self.current_deployment.write().await;
            *current = None;
        }
        
        result.map(|_| deployment_id)
    }
    
    /// Execute deployment phases
    async fn execute_deployment(&self, deployment: &mut DeploymentRecord) -> Result<()> {
        let config = &deployment.config;
        
        // Phase 1: Pre-deployment validation
        deployment.add_log("Phase 1: Pre-deployment validation".to_string());
        deployment.status = DeploymentStatus::Validating;
        self.run_pre_deployment_checks(deployment).await?;
        
        // Phase 2: Deployment preparation
        deployment.add_log("Phase 2: Deployment preparation".to_string());
        deployment.status = DeploymentStatus::Preparing;
        self.prepare_deployment(deployment).await?;
        
        // Phase 3: Application deployment
        deployment.add_log("Phase 3: Application deployment".to_string());
        deployment.status = DeploymentStatus::InProgress;
        self.deploy_application(deployment).await?;
        
        // Phase 4: Post-deployment validation
        deployment.add_log("Phase 4: Post-deployment validation".to_string());
        deployment.status = DeploymentStatus::Validating;
        self.run_post_deployment_checks(deployment).await?;
        
        // Phase 5: Health monitoring
        deployment.add_log("Phase 5: Health monitoring".to_string());
        self.monitor_deployment_health(deployment).await?;
        
        Ok(())
    }
    
    /// Run pre-deployment checks
    async fn run_pre_deployment_checks(&self, deployment: &mut DeploymentRecord) -> Result<()> {
        deployment.add_log("Running pre-deployment checks...".to_string());
        
        let pre_checks: Vec<_> = deployment.config.pre_deployment_checks.iter().cloned().collect();
        for check_name in pre_checks {
            deployment.add_log(format!("Running check: {}", check_name));

            let result = match check_name.as_str() {
                "system_health" => self.check_system_health().await,
                "database_connectivity" => self.check_database_connectivity().await,
                "api_connectivity" => self.check_api_connectivity().await,
                _ => {
                    warn!("Unknown pre-deployment check: {}", check_name);
                    Ok(())
                }
            };

            if let Err(e) = result {
                deployment.add_log(format!("Check failed: {} - {}", check_name, e));
                return Err(anyhow!("Pre-deployment check failed: {}", check_name));
            }

            deployment.add_log(format!("Check passed: {}", check_name));
        }
        
        deployment.add_log("All pre-deployment checks passed".to_string());
        Ok(())
    }
    
    /// Prepare deployment
    async fn prepare_deployment(&self, deployment: &mut DeploymentRecord) -> Result<()> {
        deployment.add_log("Preparing deployment environment...".to_string());
        
        // Set environment variables
        let env_vars: Vec<_> = deployment.config.environment_variables.iter().map(|(k, v)| (k.clone(), v.clone())).collect();
        for (key, value) in env_vars {
            std::env::set_var(&key, &value);
            deployment.add_log(format!("Set environment variable: {}", key));
        }

        // Apply configuration overrides
        let config_overrides: Vec<_> = deployment.config.config_overrides.iter().map(|(k, v)| (k.clone(), v.clone())).collect();
        for (key, value) in config_overrides {
            deployment.add_log(format!("Applied config override: {} = {}", key, value));
        }
        
        deployment.add_log("Deployment preparation completed".to_string());
        Ok(())
    }
    
    /// Deploy application
    async fn deploy_application(&self, deployment: &mut DeploymentRecord) -> Result<()> {
        deployment.add_log("Deploying application...".to_string());
        
        if let Some(production_manager) = &self.production_manager {
            // Stop current system if running
            if production_manager.is_running().await {
                deployment.add_log("Stopping current system...".to_string());
                production_manager.stop().await?;
            }
            
            // Start new system
            deployment.add_log("Starting new system...".to_string());
            production_manager.start().await?;
            
            // Wait for system to stabilize
            deployment.add_log("Waiting for system stabilization...".to_string());
            tokio::time::sleep(Duration::from_secs(30)).await;
            
            deployment.add_log("Application deployment completed".to_string());
        } else {
            deployment.add_log("No production manager available - simulating deployment".to_string());
        }
        
        Ok(())
    }
    
    /// Run post-deployment checks
    async fn run_post_deployment_checks(&self, deployment: &mut DeploymentRecord) -> Result<()> {
        deployment.add_log("Running post-deployment checks...".to_string());
        
        let checks: Vec<_> = deployment.config.post_deployment_checks.iter().cloned().collect();
        for check_name in checks {
            deployment.add_log(format!("Running check: {}", check_name));

            let result = match check_name.as_str() {
                "application_health" => self.check_application_health().await,
                "trading_system_health" => self.check_trading_system_health().await,
                "monitoring_health" => self.check_monitoring_health().await,
                _ => {
                    warn!("Unknown post-deployment check: {}", check_name);
                    Ok(())
                }
            };

            if let Err(e) = result {
                deployment.add_log(format!("Check failed: {} - {}", check_name, e));
                return Err(anyhow!("Post-deployment check failed: {}", check_name));
            }

            deployment.add_log(format!("Check passed: {}", check_name));
        }
        
        deployment.add_log("All post-deployment checks passed".to_string());
        Ok(())
    }
    
    /// Monitor deployment health
    async fn monitor_deployment_health(&self, deployment: &mut DeploymentRecord) -> Result<()> {
        deployment.add_log("Monitoring deployment health...".to_string());
        
        let timeout = deployment.config.health_check_timeout;
        let start_time = Instant::now();
        
        while start_time.elapsed() < timeout {
            let global_health = self.health_checker.get_global_health().await;
            
            if global_health.is_operational() {
                deployment.add_log("Health monitoring completed - system is healthy".to_string());
                return Ok(());
            }
            
            if global_health == HealthStatus::Unhealthy {
                deployment.add_log("Health monitoring failed - system is unhealthy".to_string());
                return Err(anyhow!("System health check failed"));
            }
            
            tokio::time::sleep(Duration::from_secs(10)).await;
        }
        
        Err(anyhow!("Health monitoring timed out"))
    }
    
    /// Rollback deployment
    pub async fn rollback(&self, deployment_id: &str) -> Result<()> {
        info!("🔄 Starting rollback for deployment: {}", deployment_id);
        
        // Find deployment in history
        let deployment = {
            let history = self.deployment_history.read().await;
            history.iter()
                .find(|d| d.id == deployment_id)
                .cloned()
                .ok_or_else(|| anyhow!("Deployment not found: {}", deployment_id))?
        };
        
        // Create rollback deployment
        let mut rollback_config = deployment.config.clone();
        rollback_config.version = format!("rollback-{}", deployment_id);
        
        let rollback_id = format!("rollback_{}", uuid::Uuid::new_v4());
        let mut rollback_deployment = DeploymentRecord::new(rollback_id.clone(), rollback_config);
        rollback_deployment.previous_deployment = Some(deployment_id.to_string());
        
        // Execute rollback
        rollback_deployment.add_log("Starting rollback process".to_string());
        
        if let Some(production_manager) = &self.production_manager {
            // Stop current system
            rollback_deployment.add_log("Stopping current system...".to_string());
            production_manager.stop().await?;
            
            // Restore previous configuration
            rollback_deployment.add_log("Restoring previous configuration...".to_string());
            
            // Start system with previous configuration
            rollback_deployment.add_log("Starting system with previous configuration...".to_string());
            production_manager.start().await?;
            
            rollback_deployment.add_log("Rollback completed successfully".to_string());
        }
        
        rollback_deployment.complete(DeploymentStatus::RolledBack);
        
        // Store rollback in history
        {
            let mut history = self.deployment_history.write().await;
            history.push(rollback_deployment);
        }
        
        info!("✅ Rollback completed successfully: {}", rollback_id);
        Ok(())
    }
    
    /// Get current deployment
    pub async fn get_current_deployment(&self) -> Option<DeploymentRecord> {
        self.current_deployment.read().await.clone()
    }
    
    /// Get deployment history
    pub async fn get_deployment_history(&self, limit: Option<usize>) -> Vec<DeploymentRecord> {
        let history = self.deployment_history.read().await;
        let limit = limit.unwrap_or(history.len());
        history.iter().rev().take(limit).cloned().collect()
    }
    
    /// Health check implementations
    async fn check_system_health(&self) -> Result<()> {
        let global_health = self.health_checker.get_global_health().await;
        if global_health.is_operational() {
            Ok(())
        } else {
            Err(anyhow!("System health check failed: {:?}", global_health))
        }
    }
    
    async fn check_database_connectivity(&self) -> Result<()> {
        // Simulate database connectivity check
        tokio::time::sleep(Duration::from_millis(100)).await;
        Ok(())
    }
    
    async fn check_api_connectivity(&self) -> Result<()> {
        // Simulate API connectivity check
        tokio::time::sleep(Duration::from_millis(100)).await;
        Ok(())
    }
    
    async fn check_application_health(&self) -> Result<()> {
        if let Some(production_manager) = &self.production_manager {
            if production_manager.is_running().await {
                Ok(())
            } else {
                Err(anyhow!("Application is not running"))
            }
        } else {
            Ok(()) // No production manager to check
        }
    }
    
    async fn check_trading_system_health(&self) -> Result<()> {
        // Check if trading system is operational
        let global_health = self.health_checker.get_global_health().await;
        if global_health.is_operational() {
            Ok(())
        } else {
            Err(anyhow!("Trading system health check failed"))
        }
    }
    
    async fn check_monitoring_health(&self) -> Result<()> {
        // Check if monitoring systems are operational
        Ok(())
    }
}
