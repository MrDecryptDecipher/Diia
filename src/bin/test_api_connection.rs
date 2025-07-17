//! Simple API Connection Test
//!
//! This binary tests the basic API connectivity to Bybit demo environment.

use omni::exchange::bybit::adapter::BybitAdapter;
use tracing::{info, error};
use tracing_subscriber::FmtSubscriber;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize logging
    let subscriber = FmtSubscriber::builder()
        .with_max_level(tracing::Level::INFO)
        .finish();
    tracing::subscriber::set_global_default(subscriber)?;

    info!("🔍 Testing Bybit Demo API Connection");
    
    // Your demo API credentials
    let api_key = "lCMnwPKIzXASNWn6UE";
    let api_secret = "aXjs1SF9tmW3riHMktmjtyOyAT85puvrVstr";
    
    // Create adapter for demo environment
    let adapter = BybitAdapter::new(api_key, api_secret, true); // true = demo mode
    
    info!("📡 Attempting to connect to Bybit Demo API...");
    
    // Test basic connectivity with ticker data
    match adapter.get_ticker("BTCUSDT").await {
        Ok(tickers) => {
            if !tickers.is_empty() {
                let ticker = &tickers[0];
                info!("✅ API Connection Successful!");
                info!("📊 BTCUSDT Price: ${:.2}", ticker.last_price);
                info!("📈 24h Volume: {:.2}", ticker.volume_24h);
                info!("🔄 24h Change: {:.2}%", ticker.price_24h_pcnt * 100.0);
            } else {
                error!("❌ API connected but no ticker data returned");
            }
        },
        Err(e) => {
            error!("❌ API Connection Failed: {}", e);
            error!("🔧 Possible issues:");
            error!("   1. API credentials are incorrect");
            error!("   2. Network connectivity issues");
            error!("   3. Bybit demo API is down");
            error!("   4. Rate limiting");
            return Err(e.into());
        }
    }
    
    // Test getting multiple tickers
    info!("🔍 Testing multiple ticker retrieval...");
    match adapter.get_ticker("ETHUSDT").await {
        Ok(tickers) => {
            if !tickers.is_empty() {
                let ticker = &tickers[0];
                info!("✅ ETHUSDT Price: ${:.2}", ticker.last_price);
            }
        },
        Err(e) => {
            error!("⚠️ Failed to get ETHUSDT ticker: {}", e);
        }
    }
    
    info!("🎉 API Connection Test Complete!");
    Ok(())
}
