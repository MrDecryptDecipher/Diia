use std::collections::HashMap;
use std::time::{Duration, Instant};
use serde::{Deserialize, Serialize};
use reqwest::Client;
use tokio::time::sleep;
use rust_decimal::Decimal;
use rust_decimal_macros::dec;
use log::{info, warn, error, debug};
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RealPosition {
    pub symbol: String,
    pub side: String,
    pub size: Decimal,
    pub entry_price: Decimal,
    pub mark_price: Decimal,
    pub leverage: u32,
    pub unrealized_pnl: Decimal,
    pub position_value: Decimal,
    pub margin_used: Decimal,
    pub last_updated: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RealAccountInfo {
    pub total_wallet_balance: Decimal,
    pub available_balance: Decimal,
    pub used_margin: Decimal,
    pub unrealized_pnl: Decimal,
    pub total_margin_balance: Decimal,
    pub last_updated: DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct BybitCredentials {
    pub api_key: String,
    pub api_secret: String,
    pub testnet: bool,
}

pub struct RealPositionTracker {
    client: Client,
    credentials: BybitCredentials,
    positions: HashMap<String, RealPosition>,
    account_info: Option<RealAccountInfo>,
    last_sync: Option<Instant>,
}

impl RealPositionTracker {
    pub fn new(credentials: BybitCredentials) -> Self {
        Self {
            client: Client::new(),
            credentials,
            positions: HashMap::new(),
            account_info: None,
            last_sync: None,
        }
    }

    /// Sync all positions and account info from Bybit API
    pub async fn sync_with_bybit(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        info!("🔄 Syncing positions with Bybit API...");
        
        // Get real positions from Bybit
        let positions = self.fetch_real_positions().await?;
        let account_info = self.fetch_real_account_info().await?;
        
        // Update internal state
        self.positions.clear();
        for position in positions {
            self.positions.insert(position.symbol.clone(), position);
        }
        self.account_info = Some(account_info);
        self.last_sync = Some(Instant::now());
        
        info!("✅ Sync complete. Found {} active positions", self.positions.len());
        self.log_current_state();
        
        Ok(())
    }

    /// Fetch real positions from Bybit API
    async fn fetch_real_positions(&self) -> Result<Vec<RealPosition>, Box<dyn std::error::Error>> {
        let base_url = if self.credentials.testnet {
            "https://api-testnet.bybit.com"
        } else {
            "https://api.bybit.com"
        };
        
        let url = format!("{}/v5/position/list", base_url);
        let timestamp = chrono::Utc::now().timestamp_millis().to_string();
        
        // Create signature for Bybit API
        let params = format!("category=linear&timestamp={}", timestamp);
        let signature = self.create_signature(&params);
        
        let response = self.client
            .get(&url)
            .header("X-BAPI-API-KEY", &self.credentials.api_key)
            .header("X-BAPI-SIGN", signature)
            .header("X-BAPI-TIMESTAMP", timestamp)
            .query(&[("category", "linear")])
            .send()
            .await?;
            
        let response_text = response.text().await?;
        debug!("Bybit positions response: {}", response_text);
        
        // Parse response and convert to RealPosition
        let json: serde_json::Value = serde_json::from_str(&response_text)?;
        let mut positions = Vec::new();
        
        if let Some(result) = json.get("result") {
            if let Some(list) = result.get("list") {
                if let Some(array) = list.as_array() {
                    for item in array {
                        if let Ok(position) = self.parse_position_from_json(item) {
                            // Only include positions with actual size
                            if position.size > dec!(0) {
                                positions.push(position);
                            }
                        }
                    }
                }
            }
        }
        
        Ok(positions)
    }

    /// Fetch real account info from Bybit API
    async fn fetch_real_account_info(&self) -> Result<RealAccountInfo, Box<dyn std::error::Error>> {
        let base_url = if self.credentials.testnet {
            "https://api-testnet.bybit.com"
        } else {
            "https://api.bybit.com"
        };
        
        let url = format!("{}/v5/account/wallet-balance", base_url);
        let timestamp = chrono::Utc::now().timestamp_millis().to_string();
        
        let params = format!("accountType=UNIFIED&timestamp={}", timestamp);
        let signature = self.create_signature(&params);
        
        let response = self.client
            .get(&url)
            .header("X-BAPI-API-KEY", &self.credentials.api_key)
            .header("X-BAPI-SIGN", signature)
            .header("X-BAPI-TIMESTAMP", timestamp)
            .query(&[("accountType", "UNIFIED")])
            .send()
            .await?;
            
        let response_text = response.text().await?;
        debug!("Bybit account response: {}", response_text);
        
        // Parse account info
        let json: serde_json::Value = serde_json::from_str(&response_text)?;
        self.parse_account_info_from_json(&json)
    }

    /// Parse position data from Bybit JSON response
    fn parse_position_from_json(&self, json: &serde_json::Value) -> Result<RealPosition, Box<dyn std::error::Error>> {
        let symbol = json.get("symbol").and_then(|v| v.as_str()).unwrap_or("").to_string();
        let side = json.get("side").and_then(|v| v.as_str()).unwrap_or("").to_string();
        let size_str = json.get("size").and_then(|v| v.as_str()).unwrap_or("0");
        let entry_price_str = json.get("avgPrice").and_then(|v| v.as_str()).unwrap_or("0");
        let mark_price_str = json.get("markPrice").and_then(|v| v.as_str()).unwrap_or("0");
        let leverage_str = json.get("leverage").and_then(|v| v.as_str()).unwrap_or("1");
        let unrealized_pnl_str = json.get("unrealisedPnl").and_then(|v| v.as_str()).unwrap_or("0");
        let position_value_str = json.get("positionValue").and_then(|v| v.as_str()).unwrap_or("0");
        
        let size = Decimal::from_str_exact(size_str).unwrap_or(dec!(0));
        let entry_price = Decimal::from_str_exact(entry_price_str).unwrap_or(dec!(0));
        let mark_price = Decimal::from_str_exact(mark_price_str).unwrap_or(dec!(0));
        let leverage = leverage_str.parse::<u32>().unwrap_or(1);
        let unrealized_pnl = Decimal::from_str_exact(unrealized_pnl_str).unwrap_or(dec!(0));
        let position_value = Decimal::from_str_exact(position_value_str).unwrap_or(dec!(0));
        let margin_used = position_value / Decimal::from(leverage);
        
        Ok(RealPosition {
            symbol,
            side,
            size,
            entry_price,
            mark_price,
            leverage,
            unrealized_pnl,
            position_value,
            margin_used,
            last_updated: Utc::now(),
        })
    }

    /// Parse account info from Bybit JSON response
    fn parse_account_info_from_json(&self, json: &serde_json::Value) -> Result<RealAccountInfo, Box<dyn std::error::Error>> {
        let result = json.get("result").ok_or("No result in response")?;
        let list = result.get("list").and_then(|v| v.as_array()).ok_or("No list in result")?;
        let account = list.first().ok_or("No account data")?;
        
        let total_wallet_balance_str = account.get("totalWalletBalance").and_then(|v| v.as_str()).unwrap_or("0");
        let available_balance_str = account.get("totalAvailableBalance").and_then(|v| v.as_str()).unwrap_or("0");
        let used_margin_str = account.get("totalInitialMargin").and_then(|v| v.as_str()).unwrap_or("0");
        let unrealized_pnl_str = account.get("totalUnrealisedPnl").and_then(|v| v.as_str()).unwrap_or("0");
        let total_margin_balance_str = account.get("totalMarginBalance").and_then(|v| v.as_str()).unwrap_or("0");
        
        Ok(RealAccountInfo {
            total_wallet_balance: Decimal::from_str_exact(total_wallet_balance_str).unwrap_or(dec!(0)),
            available_balance: Decimal::from_str_exact(available_balance_str).unwrap_or(dec!(0)),
            used_margin: Decimal::from_str_exact(used_margin_str).unwrap_or(dec!(0)),
            unrealized_pnl: Decimal::from_str_exact(unrealized_pnl_str).unwrap_or(dec!(0)),
            total_margin_balance: Decimal::from_str_exact(total_margin_balance_str).unwrap_or(dec!(0)),
            last_updated: Utc::now(),
        })
    }

    /// Create HMAC signature for Bybit API
    fn create_signature(&self, params: &str) -> String {
        use hmac::{Hmac, Mac};
        use sha2::Sha256;
        
        type HmacSha256 = Hmac<Sha256>;
        let mut mac = HmacSha256::new_from_slice(self.credentials.api_secret.as_bytes()).unwrap();
        mac.update(params.as_bytes());
        hex::encode(mac.finalize().into_bytes())
    }

    /// Log current state for debugging
    fn log_current_state(&self) {
        info!("📊 REAL POSITION TRACKER STATE:");
        
        if let Some(account) = &self.account_info {
            info!("💰 Account Balance: {:.4} USDT", account.total_wallet_balance);
            info!("💵 Available Balance: {:.4} USDT", account.available_balance);
            info!("📈 Unrealized P&L: {:.4} USDT", account.unrealized_pnl);
            info!("🔒 Used Margin: {:.4} USDT", account.used_margin);
        }
        
        if self.positions.is_empty() {
            info!("📍 No active positions");
        } else {
            info!("📍 Active Positions:");
            for (symbol, position) in &self.positions {
                info!("  {} {} {:.4} @ {:.4} (Leverage: {}x, P&L: {:.4})", 
                      symbol, position.side, position.size, position.entry_price, 
                      position.leverage, position.unrealized_pnl);
            }
        }
    }

    /// Get current positions
    pub fn get_positions(&self) -> &HashMap<String, RealPosition> {
        &self.positions
    }

    /// Get account info
    pub fn get_account_info(&self) -> Option<&RealAccountInfo> {
        self.account_info.as_ref()
    }

    /// Check if sync is needed (every 30 seconds)
    pub fn needs_sync(&self) -> bool {
        match self.last_sync {
            Some(last) => last.elapsed() > Duration::from_secs(30),
            None => true,
        }
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    env_logger::init();
    
    // Load credentials from environment
    let api_key = std::env::var("BYBIT_DEMO_API_KEY").expect("BYBIT_DEMO_API_KEY not set");
    let api_secret = std::env::var("BYBIT_DEMO_API_SECRET").expect("BYBIT_DEMO_API_SECRET not set");
    let testnet = true; // Always use testnet for demo
    
    let credentials = BybitCredentials {
        api_key,
        api_secret,
        testnet,
    };
    
    let mut tracker = RealPositionTracker::new(credentials);
    
    info!("🚀 Starting Real Position Tracker...");
    
    loop {
        if tracker.needs_sync() {
            if let Err(e) = tracker.sync_with_bybit().await {
                error!("❌ Sync failed: {}", e);
            }
        }
        
        sleep(Duration::from_secs(10)).await;
    }
}
