//! OMNI-ALPHA VΩ∞∞ Production Trading System
//!
//! This is the main production binary for the OMNI-ALPHA VΩ∞∞ trading system.
//! It provides comprehensive trading capabilities with advanced multi-factor analysis,
//! precise capital management, and production-grade monitoring.

use std::env;
use std::sync::Arc;
use tokio::signal;
use tracing::{info, warn, error, Level};
use tracing_subscriber::{FmtSubscriber, EnvFilter};
use anyhow::Result;
use clap::{Arg, Command};

use omni::deployment::{ProductionManager, ConfigManager};

#[tokio::main]
async fn main() -> Result<()> {
    // Parse command line arguments
    let matches = Command::new("OMNI-ALPHA VΩ∞∞")
        .version("1.0.0")
        .author("OMNI Trading Systems")
        .about("Advanced Multi-Factor Trading System with Quantum Intelligence")
        .arg(
            Arg::new("environment")
                .short('e')
                .long("env")
                .value_name("ENV")
                .help("Environment to run (development, staging, production)")
                .default_value("development")
        )
        .arg(
            Arg::new("config")
                .short('c')
                .long("config")
                .value_name("FILE")
                .help("Configuration file path")
        )
        .arg(
            Arg::new("create-configs")
                .long("create-configs")
                .help("Create default configuration files for all environments")
                .action(clap::ArgAction::SetTrue)
        )
        .arg(
            Arg::new("validate-config")
                .long("validate-config")
                .help("Validate configuration and exit")
                .action(clap::ArgAction::SetTrue)
        )
        .arg(
            Arg::new("dry-run")
                .long("dry-run")
                .help("Run in dry-run mode (no actual trading)")
                .action(clap::ArgAction::SetTrue)
        )
        .get_matches();

    // Handle create-configs command
    if matches.get_flag("create-configs") {
        return create_default_configs().await;
    }

    // Get environment
    let environment = matches.get_one::<String>("environment").unwrap();
    
    // Initialize configuration
    let config_manager = match matches.get_one::<String>("config") {
        Some(config_path) => {
            info!("Loading configuration from: {}", config_path);
            ConfigManager::load_config(config_path)?;
            // Create a temporary config manager for validation
            ConfigManager::new(environment)?
        },
        None => {
            info!("Loading configuration for environment: {}", environment);
            ConfigManager::new(environment)?
        }
    };

    // Handle validate-config command
    if matches.get_flag("validate-config") {
        return validate_configuration(&config_manager).await;
    }

    let config = config_manager.get_config().clone();

    // Initialize logging
    initialize_logging(&config.logging_config)?;

    // Display startup banner
    display_startup_banner(&config, matches.get_flag("dry-run"));

    // Initialize production manager
    let mut production_config = config.clone();
    
    // Override trading enabled for dry-run mode
    if matches.get_flag("dry-run") {
        production_config.trading_config.trading_enabled = false;
        warn!("🔒 DRY-RUN MODE: Trading is disabled");
    }

    let production_manager = ProductionManager::new(production_config)?;

    // Start the production system
    info!("🚀 Starting OMNI-ALPHA VΩ∞∞ Production System");
    production_manager.start().await?;

    // Setup graceful shutdown
    let production_manager = Arc::new(production_manager);

    // Handle shutdown signals in a separate task
    let shutdown_signal = async {
        signal::ctrl_c().await.expect("Failed to listen for shutdown signal");
        info!("🛑 Shutdown signal received");
    };

    // Run the main loop with shutdown handling
    tokio::select! {
        _ = shutdown_signal => {
            info!("Initiating graceful shutdown...");
            if let Err(e) = production_manager.stop().await {
                error!("Error during shutdown: {}", e);
            }
            return Ok(());
        }
        _ = run_main_loop(&production_manager) => {
            info!("Main loop completed");
        }
    }

    Ok(())
}

async fn run_main_loop(production_manager: &Arc<ProductionManager>) -> Result<()> {

    // Main monitoring loop
    let mut health_check_interval = tokio::time::interval(
        std::time::Duration::from_secs(60)
    );

    while production_manager.is_running().await {
        health_check_interval.tick().await;

        // Check system health
        let health = production_manager.get_system_health().await;

        match health.status {
            omni::deployment::HealthStatus::Healthy => {
                info!("💚 System Health: {} (Score: {:.1})",
                      format!("{:?}", health.status), health.health_score);
            },
            omni::deployment::HealthStatus::Warning => {
                warn!("💛 System Health: {} (Score: {:.1}) - Issues: {:?}",
                      format!("{:?}", health.status), health.health_score, health.active_issues);
            },
            omni::deployment::HealthStatus::Critical => {
                error!("❤️ System Health: {} (Score: {:.1}) - Critical Issues: {:?}",
                       format!("{:?}", health.status), health.health_score, health.active_issues);

                // Consider emergency stop for critical health
                if health.health_score < 20.0 {
                    error!("🚨 Health score critically low, initiating emergency stop");
                    production_manager.emergency_stop().await?;
                    break;
                }
            },
            omni::deployment::HealthStatus::Offline => {
                error!("💀 System Health: Offline - Stopping system");
                break;
            },
        }

        // Display performance summary periodically
        if health_check_interval.period().as_secs() % 300 == 0 { // Every 5 minutes
            let performance = production_manager.get_performance_summary().await;
            info!("📊 Performance Summary: Health Score: {:.1}, CPU: {:.1}%, Memory: {:.1}%",
                  performance.system_health_score,
                  performance.average_cpu_usage,
                  performance.average_memory_usage);
        }
    }

    info!("✅ OMNI-ALPHA VΩ∞∞ Production System shutdown complete");
    Ok(())
}

/// Create default configuration files
async fn create_default_configs() -> Result<()> {
    info!("🔧 Creating default configuration files");
    
    ConfigManager::create_all_environment_configs()?;
    
    info!("✅ Default configuration files created:");
    info!("   - config/development.toml");
    info!("   - config/staging.toml");
    info!("   - config/production.toml");
    info!("");
    info!("⚠️  Please update the API keys in the configuration files before running the system");
    
    Ok(())
}

/// Validate configuration
async fn validate_configuration(config_manager: &ConfigManager) -> Result<()> {
    info!("🔍 Validating configuration");
    
    let config = config_manager.get_config();
    
    // Validate configuration
    omni::deployment::config_manager::ConfigManager::validate_config(config)?;
    
    // Display configuration summary
    let summary = config_manager.get_config_summary();
    info!("✅ Configuration validation passed");
    info!("📋 Configuration Summary:");
    info!("   Environment: {}", summary.environment);
    info!("   Trading Enabled: {}", summary.trading_enabled);
    info!("   Use Demo API: {}", summary.use_demo);
    info!("   Total Capital: {:.6} USDT", summary.total_capital);
    info!("   Max Risk Per Trade: {:.1}%", summary.max_risk_per_trade);
    info!("   Monitoring Enabled: {}", summary.monitoring_enabled);
    info!("   Emergency Stop Enabled: {}", summary.emergency_stop_enabled);
    info!("   Log Level: {}", summary.log_level);
    
    Ok(())
}

/// Initialize logging system
fn initialize_logging(logging_config: &omni::deployment::LoggingConfig) -> Result<()> {
    let level = match logging_config.level.as_str() {
        "trace" => Level::TRACE,
        "debug" => Level::DEBUG,
        "info" => Level::INFO,
        "warn" => Level::WARN,
        "error" => Level::ERROR,
        _ => Level::INFO,
    };

    let subscriber = FmtSubscriber::builder()
        .with_max_level(level)
        .with_env_filter(EnvFilter::from_default_env())
        .with_target(false)
        .with_thread_ids(true)
        .with_file(true)
        .with_line_number(true)
        .finish();

    tracing::subscriber::set_global_default(subscriber)?;

    info!("📝 Logging initialized at level: {}", logging_config.level);
    
    if logging_config.log_to_file {
        info!("📁 Log file: {}", logging_config.log_file_path);
    }

    Ok(())
}

/// Display startup banner
fn display_startup_banner(config: &omni::deployment::ProductionConfig, dry_run: bool) {
    info!("╔══════════════════════════════════════════════════════════════╗");
    info!("║                    OMNI-ALPHA VΩ∞∞                          ║");
    info!("║            Advanced Multi-Factor Trading System              ║");
    info!("║                                                              ║");
    info!("║  🧠 Quantum Intelligence  💰 Precise Capital Management     ║");
    info!("║  📊 Multi-Factor Analysis  🛡️  Zero-Loss Enforcement       ║");
    info!("║  🔄 Hyperdimensional Patterns  ⚡ Real-time Processing     ║");
    info!("╚══════════════════════════════════════════════════════════════╝");
    info!("");
    info!("🌍 Environment: {}", config.environment);
    info!("💰 Total Capital: {:.6} USDT", config.trading_config.total_capital);
    info!("🎯 Trading Mode: {}", if dry_run { "DRY-RUN" } else if config.trading_config.trading_enabled { "LIVE" } else { "DISABLED" });
    info!("🔗 API Mode: {}", if config.api_config.use_demo { "DEMO" } else { "LIVE" });
    info!("📊 Monitoring: {}", if config.monitoring_config.enabled { "ENABLED" } else { "DISABLED" });
    info!("🛡️ Safety Systems: {}", if config.safety_config.emergency_stop_enabled { "ACTIVE" } else { "INACTIVE" });
    info!("");
    
    if config.environment == "production" && config.api_config.use_demo {
        warn!("⚠️  WARNING: Running production environment with demo API");
    }
    
    if config.trading_config.trading_enabled && !config.api_config.use_demo {
        warn!("🚨 LIVE TRADING ENABLED - Real money at risk!");
    }
    
    if config.trading_config.total_capital != 12.0 {
        warn!("⚠️  Capital allocation differs from system design (12.0 USDT)");
    }
    
    info!("🚀 System initialization complete - Starting trading operations");
    info!("");
}
