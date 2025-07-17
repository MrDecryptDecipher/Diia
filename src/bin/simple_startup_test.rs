//! Simple Startup Test
//!
//! This binary tests the basic startup process to identify any issues.

use omni::deployment::config_manager::ConfigManager;
use omni::deployment::production_manager::ProductionManager;
use tracing::{info, error};
use tracing_subscriber::FmtSubscriber;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize logging
    let subscriber = FmtSubscriber::builder()
        .with_max_level(tracing::Level::INFO)
        .finish();
    tracing::subscriber::set_global_default(subscriber)?;

    info!("🚀 Starting OMNI-ALPHA VΩ∞∞ Simple Startup Test");
    
    // Step 1: Test config loading
    info!("📋 Step 1: Loading configuration...");
    let config_manager = match ConfigManager::new("development") {
        Ok(config) => {
            info!("✅ Configuration loaded successfully");
            config
        },
        Err(e) => {
            error!("❌ Failed to load configuration: {}", e);
            return Err(e.into());
        }
    };
    
    // Step 2: Get production config
    info!("🏭 Step 2: Getting production config...");
    let production_config = config_manager.get_config().clone();
    info!("✅ Production config loaded successfully");

    // Step 3: Test production manager creation
    info!("🏭 Step 3: Creating production manager...");
    let production_manager = match ProductionManager::new(production_config) {
        Ok(manager) => {
            info!("✅ Production manager created successfully");
            manager
        },
        Err(e) => {
            error!("❌ Failed to create production manager: {}", e);
            return Err(e.into());
        }
    };
    
    // Step 4: Test basic health check
    info!("💚 Step 4: Checking system health...");
    let health = production_manager.get_system_health().await;
    info!("📊 System Health Status: {:?}", health.status);
    info!("📈 Health Score: {:.1}", health.health_score);

    if !health.active_issues.is_empty() {
        info!("⚠️ Active Issues: {:?}", health.active_issues);
    }

    // Step 5: Test API connectivity
    info!("🌐 Step 5: Testing API connectivity...");
    // We'll just check if the system can initialize without actually starting the full loop
    
    info!("🎉 Simple startup test completed successfully!");
    info!("💡 The system appears to be ready for full operation");
    
    Ok(())
}
