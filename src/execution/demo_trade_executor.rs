//! Demo Trade Executor
//!
//! Executes ACTUAL trades on Bybit demo/testnet using mainnet market data
//! with precise 12 USDT capital management and real order execution.

use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::RwLock;
use tracing::{info, warn, error, debug};
use serde::{Serialize, Deserialize};
use anyhow::{Result, anyhow};
use rust_decimal::Decimal;
use rust_decimal_macros::dec;
use num::ToPrimitive;

use crate::bybit::client::BybitClient;
use crate::bybit::types::{OrderSide, OrderType, TimeInForce};
use crate::capital::manager::CapitalManager;
use crate::market_data::real_time_feed::RealTimeMarketFeed;

/// Trade execution status
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum TradeStatus {
    /// Trade is pending execution
    Pending,

    /// Trade order has been placed
    Placed,

    /// Trade has been partially filled
    PartiallyFilled,

    /// Trade has been completely filled
    Filled,

    /// Trade was cancelled
    Cancelled,

    /// Trade failed to execute
    Failed,

    /// Trade was rejected by exchange
    Rejected,
}

/// Actual demo trade record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DemoTrade {
    /// Unique trade ID
    pub trade_id: String,

    /// Exchange order ID (actual Bybit order ID)
    pub exchange_order_id: Option<String>,

    /// Trading symbol
    pub symbol: String,

    /// Order side (Buy/Sell)
    pub side: OrderSide,

    /// Order type
    pub order_type: OrderType,

    /// Order quantity
    pub quantity: Decimal,

    /// Order price (for limit orders)
    pub price: Option<Decimal>,

    /// Leverage used
    pub leverage: u32,

    /// Capital allocated for this trade
    pub allocated_capital: Decimal,

    /// Trade status
    pub status: TradeStatus,

    /// Creation timestamp
    pub created_at: chrono::DateTime<chrono::Utc>,

    /// Execution timestamp
    pub executed_at: Option<chrono::DateTime<chrono::Utc>>,

    /// Fill price (actual execution price)
    pub fill_price: Option<Decimal>,

    /// Filled quantity
    pub filled_quantity: Decimal,

    /// Remaining quantity
    pub remaining_quantity: Decimal,

    /// Trading fees paid
    pub fees: Decimal,

    /// Realized P&L
    pub realized_pnl: Decimal,

    /// Unrealized P&L (for open positions)
    pub unrealized_pnl: Decimal,

    /// Error message if failed
    pub error_message: Option<String>,

    /// Market data at time of trade
    pub market_data: MarketSnapshot,
}

/// Market data snapshot at trade time
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarketSnapshot {
    /// Current price
    pub current_price: Decimal,

    /// Bid price
    pub bid_price: Decimal,

    /// Ask price
    pub ask_price: Decimal,

    /// 24h volume
    pub volume_24h: Decimal,

    /// Price change 24h
    pub price_change_24h: Decimal,

    /// Timestamp of snapshot
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

/// Position tracking for profit calculation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Position {
    /// Symbol
    pub symbol: String,

    /// Position size (positive for long, negative for short)
    pub size: Decimal,

    /// Average entry price
    pub avg_entry_price: Decimal,

    /// Current market price
    pub current_price: Decimal,

    /// Unrealized P&L
    pub unrealized_pnl: Decimal,

    /// Realized P&L from closed trades
    pub realized_pnl: Decimal,

    /// Total fees paid
    pub total_fees: Decimal,

    /// Position value in USDT
    pub position_value: Decimal,

    /// Leverage used
    pub leverage: u32,

    /// Last update timestamp
    pub last_updated: chrono::DateTime<chrono::Utc>,
}

/// Demo trade executor with ACTUAL Bybit demo execution
pub struct DemoTradeExecutor {
    /// Bybit demo client (testnet)
    demo_client: Arc<BybitClient>,

    /// Bybit mainnet client (for market data)
    mainnet_client: Arc<BybitClient>,

    /// Capital manager for 12 USDT constraint
    capital_manager: Arc<CapitalManager>,

    /// Real-time market feed (mainnet data)
    market_feed: Arc<RealTimeMarketFeed>,

    /// Active trades
    active_trades: Arc<RwLock<HashMap<String, DemoTrade>>>,

    /// Trade history
    trade_history: Arc<RwLock<Vec<DemoTrade>>>,

    /// Current positions
    positions: Arc<RwLock<HashMap<String, Position>>>,

    /// Total profit tracking
    total_profit: Arc<RwLock<Decimal>>,

    /// Trading statistics
    stats: Arc<RwLock<TradingStats>>,

    /// Dynamic leverage settings per asset
    leverage_settings: Arc<RwLock<HashMap<String, u32>>>,
}

/// Trading statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TradingStats {
    /// Total trades executed
    pub total_trades: u64,

    /// Successful trades
    pub successful_trades: u64,

    /// Failed trades
    pub failed_trades: u64,

    /// Total volume traded
    pub total_volume: Decimal,

    /// Total fees paid
    pub total_fees: Decimal,

    /// Total realized P&L
    pub total_realized_pnl: Decimal,

    /// Total unrealized P&L
    pub total_unrealized_pnl: Decimal,

    /// Win rate percentage
    pub win_rate: f64,

    /// Average trade size
    pub avg_trade_size: Decimal,

    /// Largest win
    pub largest_win: Decimal,

    /// Largest loss
    pub largest_loss: Decimal,

    /// Current drawdown
    pub current_drawdown: Decimal,

    /// Maximum drawdown
    pub max_drawdown: Decimal,

    /// Sharpe ratio
    pub sharpe_ratio: f64,

    /// Capital utilization
    pub capital_utilization: f64,
}

impl DemoTradeExecutor {
    /// Create new demo trade executor
    pub fn new(
        demo_client: Arc<BybitClient>,
        mainnet_client: Arc<BybitClient>,
        capital_manager: Arc<CapitalManager>,
        market_feed: Arc<RealTimeMarketFeed>,
    ) -> Self {
        let executor = Self {
            demo_client,
            mainnet_client,
            capital_manager,
            market_feed,
            active_trades: Arc::new(RwLock::new(HashMap::new())),
            trade_history: Arc::new(RwLock::new(Vec::new())),
            positions: Arc::new(RwLock::new(HashMap::new())),
            total_profit: Arc::new(RwLock::new(dec!(0))),
            stats: Arc::new(RwLock::new(TradingStats {
                total_trades: 0,
                successful_trades: 0,
                failed_trades: 0,
                total_volume: dec!(0),
                total_fees: dec!(0),
                total_realized_pnl: dec!(0),
                total_unrealized_pnl: dec!(0),
                win_rate: 0.0,
                avg_trade_size: dec!(0),
                largest_win: dec!(0),
                largest_loss: dec!(0),
                current_drawdown: dec!(0),
                max_drawdown: dec!(0),
                sharpe_ratio: 0.0,
                capital_utilization: 0.0,
            })),
            leverage_settings: Arc::new(RwLock::new(HashMap::new())),
        };

        // Initialize default leverage settings
        executor.initialize_leverage_settings();

        // Start position monitoring
        executor.start_position_monitoring();

        executor
    }

    /// Execute ACTUAL demo trade on Bybit testnet
    pub async fn execute_trade(
        &self,
        symbol: String,
        side: OrderSide,
        trade_size_usdt: Decimal,
        order_type: OrderType,
        price: Option<Decimal>,
    ) -> Result<String> {
        // Validate capital constraint
        let available_capital = self.capital_manager.get_available_capital().await?;
        if trade_size_usdt > available_capital {
            return Err(anyhow!(
                "Insufficient capital: requested {} USDT, available {} USDT",
                trade_size_usdt,
                available_capital
            ));
        }

        // Get mainnet market data for decision making
        let market_snapshot = self.get_market_snapshot(&symbol).await?;

        // Calculate dynamic leverage for this asset
        let leverage = self.get_dynamic_leverage(&symbol, &market_snapshot).await;

        // Calculate proper order size based on leverage and capital
        let order_quantity = self.calculate_order_quantity(
            &symbol,
            trade_size_usdt,
            leverage,
            &market_snapshot,
        ).await?;

        // Create trade record
        let trade_id = format!("trade_{}", uuid::Uuid::new_v4());
        let mut trade = DemoTrade {
            trade_id: trade_id.clone(),
            exchange_order_id: None,
            symbol: symbol.clone(),
            side,
            order_type,
            quantity: order_quantity,
            price,
            leverage,
            allocated_capital: trade_size_usdt,
            status: TradeStatus::Pending,
            created_at: chrono::Utc::now(),
            executed_at: None,
            fill_price: None,
            filled_quantity: dec!(0),
            remaining_quantity: order_quantity,
            fees: dec!(0),
            realized_pnl: dec!(0),
            unrealized_pnl: dec!(0),
            error_message: None,
            market_data: market_snapshot,
        };

        info!(
            "🎯 Executing ACTUAL demo trade: {} {} {} @ leverage {}x, capital: {} USDT",
            side.as_str(),
            order_quantity,
            symbol,
            leverage,
            trade_size_usdt
        );

        // Reserve capital
        self.capital_manager.reserve_capital(trade_size_usdt).await?;

        // Set leverage on demo account
        if let Err(e) = self.demo_client.set_leverage(&symbol, leverage).await {
            warn!("Failed to set leverage for {}: {}", symbol, e);
        }

        // Place ACTUAL order on Bybit demo/testnet
        match self.place_actual_demo_order(&mut trade).await {
            Ok(order_id) => {
                trade.exchange_order_id = Some(order_id.clone());
                trade.status = TradeStatus::Placed;

                info!(
                    "✅ ACTUAL demo order placed successfully: {} (Exchange ID: {})",
                    trade_id,
                    order_id
                );

                // Store active trade
                {
                    let mut active_trades = self.active_trades.write().await;
                    active_trades.insert(trade_id.clone(), trade.clone());
                }

                // Start monitoring this trade
                self.monitor_trade_execution(trade_id.clone()).await;

                Ok(trade_id)
            }
            Err(e) => {
                trade.status = TradeStatus::Failed;
                trade.error_message = Some(e.to_string());

                error!("❌ Failed to place demo order: {}", e);

                // Release reserved capital
                self.capital_manager.release_capital(trade_size_usdt).await?;

                // Update statistics
                {
                    let mut stats = self.stats.write().await;
                    stats.failed_trades += 1;
                    stats.total_trades += 1;
                }

                // Store in history
                {
                    let mut history = self.trade_history.write().await;
                    history.push(trade);
                }

                Err(e)
            }
        }
    }

    /// Place actual order on Bybit demo/testnet
    async fn place_actual_demo_order(&self, trade: &mut DemoTrade) -> Result<String> {
        let order_request = match trade.order_type {
            OrderType::Market => {
                // Market order
                self.demo_client.place_market_order(
                    &trade.symbol,
                    trade.side,
                    trade.quantity,
                ).await
            }
            OrderType::Limit => {
                // Limit order
                let limit_price = trade.price.ok_or_else(|| {
                    anyhow!("Limit price required for limit orders")
                })?;

                self.demo_client.place_limit_order(
                    &trade.symbol,
                    trade.side,
                    trade.quantity,
                    limit_price,
                    TimeInForce::GTC,
                ).await
            }
        };

        match order_request {
            Ok(order_response) => {
                info!(
                    "🎯 ACTUAL Bybit demo order placed: {} {} {} (Order ID: {})",
                    trade.side.as_str(),
                    trade.quantity,
                    trade.symbol,
                    order_response.order_id
                );

                Ok(order_response.order_id)
            }
            Err(e) => {
                error!(
                    "❌ Bybit demo order failed: {} {} {} - Error: {}",
                    trade.side.as_str(),
                    trade.quantity,
                    trade.symbol,
                    e
                );

                Err(e)
            }
        }
    }

    /// Get market snapshot from mainnet data
    async fn get_market_snapshot(&self, symbol: &str) -> Result<MarketSnapshot> {
        // Get real-time market data from mainnet
        let ticker = self.mainnet_client.get_ticker(symbol).await?;
        let orderbook = self.mainnet_client.get_orderbook(symbol, 1).await?;

        Ok(MarketSnapshot {
            current_price: ticker.last_price,
            bid_price: orderbook.bids.first()
                .map(|bid| bid.price)
                .unwrap_or(ticker.last_price),
            ask_price: orderbook.asks.first()
                .map(|ask| ask.price)
                .unwrap_or(ticker.last_price),
            volume_24h: ticker.volume_24h,
            price_change_24h: ticker.price_change_24h,
            timestamp: chrono::Utc::now(),
        })
    }

    /// Calculate dynamic leverage based on asset volatility and market conditions
    async fn get_dynamic_leverage(&self, symbol: &str, market_data: &MarketSnapshot) -> u32 {
        let leverage_settings = self.leverage_settings.read().await;

        // Get base leverage for this asset
        let base_leverage = leverage_settings.get(symbol).copied().unwrap_or(10);

        // Adjust based on volatility
        let volatility_factor = market_data.price_change_24h.abs();
        let adjusted_leverage = if volatility_factor > dec!(0.1) {
            // High volatility - reduce leverage
            (base_leverage as f64 * 0.5).max(1.0) as u32
        } else if volatility_factor < dec!(0.02) {
            // Low volatility - can use higher leverage
            (base_leverage as f64 * 1.5).min(50.0) as u32
        } else {
            base_leverage
        };

        debug!(
            "Dynamic leverage for {}: base={}, volatility={}, adjusted={}",
            symbol,
            base_leverage,
            volatility_factor,
            adjusted_leverage
        );

        adjusted_leverage
    }

    /// Calculate proper order quantity based on capital and leverage
    async fn calculate_order_quantity(
        &self,
        symbol: &str,
        capital_usdt: Decimal,
        leverage: u32,
        market_data: &MarketSnapshot,
    ) -> Result<Decimal> {
        // Total position value with leverage
        let position_value = capital_usdt * Decimal::from(leverage);

        // Calculate quantity based on current price
        let quantity = position_value / market_data.current_price;

        // Get instrument info for minimum quantity requirements
        let instrument_info = self.demo_client.get_instrument_info(symbol).await?;

        // Round to minimum quantity increment
        let min_qty = instrument_info.min_order_qty;
        let qty_step = instrument_info.qty_step;

        let adjusted_quantity = if quantity < min_qty {
            min_qty
        } else {
            // Round down to nearest step
            let steps = (quantity / qty_step).floor();
            steps * qty_step
        };

        debug!(
            "Order quantity calculation for {}: capital={} USDT, leverage={}x, price={}, quantity={}",
            symbol,
            capital_usdt,
            leverage,
            market_data.current_price,
            adjusted_quantity
        );

        Ok(adjusted_quantity)
    }

    /// Monitor trade execution and update status
    async fn monitor_trade_execution(&self, trade_id: String) {
        let demo_client = Arc::clone(&self.demo_client);
        let active_trades = Arc::clone(&self.active_trades);
        let trade_history = Arc::clone(&self.trade_history);
        let positions = Arc::clone(&self.positions);
        let capital_manager = Arc::clone(&self.capital_manager);
        let stats = Arc::clone(&self.stats);
        let total_profit = Arc::clone(&self.total_profit);

        tokio::spawn(async move {
            let mut monitoring_interval = tokio::time::interval(Duration::from_secs(5));
            let mut monitoring_attempts = 0;
            const MAX_MONITORING_ATTEMPTS: u32 = 120; // 10 minutes

            loop {
                monitoring_interval.tick().await;
                monitoring_attempts += 1;

                if monitoring_attempts > MAX_MONITORING_ATTEMPTS {
                    warn!("Trade monitoring timeout for {}", trade_id);
                    break;
                }

                // Get current trade
                let mut trade = {
                    let active_trades_guard = active_trades.read().await;
                    if let Some(trade) = active_trades_guard.get(&trade_id) {
                        trade.clone()
                    } else {
                        debug!("Trade {} no longer active", trade_id);
                        break;
                    }
                };

                // Check order status on exchange
                if let Some(exchange_order_id) = &trade.exchange_order_id {
                    match demo_client.get_order_status(&trade.symbol, exchange_order_id).await {
                        Ok(order_status) => {
                            let mut trade_updated = false;

                            // Update trade based on order status
                            match order_status.status.as_str() {
                                "Filled" => {
                                    if trade.status != TradeStatus::Filled {
                                        trade.status = TradeStatus::Filled;
                                        trade.executed_at = Some(chrono::Utc::now());
                                        trade.fill_price = Some(order_status.avg_price);
                                        trade.filled_quantity = order_status.cum_exec_qty;
                                        trade.remaining_quantity = dec!(0);
                                        trade.fees = order_status.cum_exec_fee;
                                        trade_updated = true;

                                        info!(
                                            "✅ Trade FILLED: {} {} {} @ {} (Fees: {})",
                                            trade.side.as_str(),
                                            trade.filled_quantity,
                                            trade.symbol,
                                            order_status.avg_price,
                                            trade.fees
                                        );

                                        // Update position
                                        Self::update_position(&positions, &trade).await;

                                        // Release capital and calculate P&L
                                        let _ = capital_manager.release_capital(trade.allocated_capital).await;

                                        // Update statistics
                                        Self::update_trading_stats(&stats, &trade, &total_profit).await;

                                        // Move to history
                                        {
                                            let mut active_trades_guard = active_trades.write().await;
                                            active_trades_guard.remove(&trade_id);
                                        }

                                        {
                                            let mut history = trade_history.write().await;
                                            history.push(trade.clone());
                                        }

                                        break;
                                    }
                                }
                                "PartiallyFilled" => {
                                    if trade.status != TradeStatus::PartiallyFilled {
                                        trade.status = TradeStatus::PartiallyFilled;
                                        trade.filled_quantity = order_status.cum_exec_qty;
                                        trade.remaining_quantity = trade.quantity - order_status.cum_exec_qty;
                                        trade.fees = order_status.cum_exec_fee;
                                        trade_updated = true;

                                        info!(
                                            "🔄 Trade PARTIALLY FILLED: {} {} {} (Filled: {}, Remaining: {})",
                                            trade.side.as_str(),
                                            trade.quantity,
                                            trade.symbol,
                                            trade.filled_quantity,
                                            trade.remaining_quantity
                                        );
                                    }
                                }
                                "Cancelled" => {
                                    trade.status = TradeStatus::Cancelled;
                                    trade_updated = true;

                                    warn!("❌ Trade CANCELLED: {}", trade_id);

                                    // Release capital
                                    let _ = capital_manager.release_capital(trade.allocated_capital).await;

                                    // Update statistics
                                    {
                                        let mut stats_guard = stats.write().await;
                                        stats_guard.failed_trades += 1;
                                        stats_guard.total_trades += 1;
                                    }

                                    // Move to history
                                    {
                                        let mut active_trades_guard = active_trades.write().await;
                                        active_trades_guard.remove(&trade_id);
                                    }

                                    {
                                        let mut history = trade_history.write().await;
                                        history.push(trade.clone());
                                    }

                                    break;
                                }
                                "Rejected" => {
                                    trade.status = TradeStatus::Rejected;
                                    trade.error_message = Some("Order rejected by exchange".to_string());
                                    trade_updated = true;

                                    error!("❌ Trade REJECTED: {}", trade_id);

                                    // Release capital
                                    let _ = capital_manager.release_capital(trade.allocated_capital).await;

                                    // Update statistics
                                    {
                                        let mut stats_guard = stats.write().await;
                                        stats_guard.failed_trades += 1;
                                        stats_guard.total_trades += 1;
                                    }

                                    // Move to history
                                    {
                                        let mut active_trades_guard = active_trades.write().await;
                                        active_trades_guard.remove(&trade_id);
                                    }

                                    {
                                        let mut history = trade_history.write().await;
                                        history.push(trade.clone());
                                    }

                                    break;
                                }
                                _ => {
                                    // Order still pending
                                    debug!("Trade {} still pending: {}", trade_id, order_status.status);
                                }
                            }

                            // Update active trade if changed
                            if trade_updated {
                                let mut active_trades_guard = active_trades.write().await;
                                active_trades_guard.insert(trade_id.clone(), trade);
                            }
                        }
                        Err(e) => {
                            warn!("Failed to get order status for {}: {}", trade_id, e);
                        }
                    }
                }
            }
        });
    }

    /// Update position tracking
    async fn update_position(
        positions: &Arc<RwLock<HashMap<String, Position>>>,
        trade: &DemoTrade,
    ) {
        let mut positions_guard = positions.write().await;

        let position = positions_guard.entry(trade.symbol.clone()).or_insert_with(|| {
            Position {
                symbol: trade.symbol.clone(),
                size: dec!(0),
                avg_entry_price: dec!(0),
                current_price: trade.fill_price.unwrap_or(dec!(0)),
                unrealized_pnl: dec!(0),
                realized_pnl: dec!(0),
                total_fees: dec!(0),
                position_value: dec!(0),
                leverage: trade.leverage,
                last_updated: chrono::Utc::now(),
            }
        });

        let fill_price = trade.fill_price.unwrap_or(dec!(0));
        let trade_size = match trade.side {
            OrderSide::Buy => trade.filled_quantity,
            OrderSide::Sell => -trade.filled_quantity,
        };

        // Update position
        if position.size.is_zero() {
            // New position
            position.size = trade_size;
            position.avg_entry_price = fill_price;
        } else if (position.size > dec!(0) && trade_size > dec!(0)) ||
                  (position.size < dec!(0) && trade_size < dec!(0)) {
            // Adding to position
            let total_value = position.size * position.avg_entry_price + trade_size * fill_price;
            position.size += trade_size;
            position.avg_entry_price = total_value / position.size;
        } else {
            // Reducing or closing position
            let closing_size = trade_size.abs().min(position.size.abs());
            let closing_pnl = if position.size > dec!(0) {
                // Long position
                closing_size * (fill_price - position.avg_entry_price)
            } else {
                // Short position
                closing_size * (position.avg_entry_price - fill_price)
            };

            position.realized_pnl += closing_pnl;
            position.size += trade_size;

            if position.size.is_zero() {
                position.avg_entry_price = dec!(0);
            }
        }

        position.current_price = fill_price;
        position.total_fees += trade.fees;
        position.position_value = position.size.abs() * position.current_price;
        position.last_updated = chrono::Utc::now();

        // Calculate unrealized P&L for open positions
        if !position.size.is_zero() {
            position.unrealized_pnl = if position.size > dec!(0) {
                // Long position
                position.size * (position.current_price - position.avg_entry_price)
            } else {
                // Short position
                position.size.abs() * (position.avg_entry_price - position.current_price)
            };
        } else {
            position.unrealized_pnl = dec!(0);
        }

        info!(
            "📊 Position updated: {} size={}, avg_price={}, unrealized_pnl={}, realized_pnl={}",
            position.symbol,
            position.size,
            position.avg_entry_price,
            position.unrealized_pnl,
            position.realized_pnl
        );
    }

    /// Update trading statistics
    async fn update_trading_stats(
        stats: &Arc<RwLock<TradingStats>>,
        trade: &DemoTrade,
        total_profit: &Arc<RwLock<Decimal>>,
    ) {
        let mut stats_guard = stats.write().await;
        let mut total_profit_guard = total_profit.write().await;

        stats_guard.total_trades += 1;
        stats_guard.total_volume += trade.filled_quantity * trade.fill_price.unwrap_or(dec!(0));
        stats_guard.total_fees += trade.fees;

        // Calculate P&L for this trade
        let trade_pnl = trade.realized_pnl - trade.fees;
        stats_guard.total_realized_pnl += trade_pnl;
        *total_profit_guard += trade_pnl;

        if trade_pnl > dec!(0) {
            stats_guard.successful_trades += 1;
            if trade_pnl > stats_guard.largest_win {
                stats_guard.largest_win = trade_pnl;
            }
        } else {
            if trade_pnl < stats_guard.largest_loss {
                stats_guard.largest_loss = trade_pnl;
            }
        }

        // Update win rate
        stats_guard.win_rate = if stats_guard.total_trades > 0 {
            (stats_guard.successful_trades as f64 / stats_guard.total_trades as f64) * 100.0
        } else {
            0.0
        };

        // Update average trade size
        stats_guard.avg_trade_size = if stats_guard.total_trades > 0 {
            stats_guard.total_volume / Decimal::from(stats_guard.total_trades)
        } else {
            dec!(0)
        };

        // Update drawdown
        let current_balance = *total_profit_guard;
        if current_balance < stats_guard.current_drawdown {
            stats_guard.current_drawdown = current_balance;
            if stats_guard.current_drawdown < stats_guard.max_drawdown {
                stats_guard.max_drawdown = stats_guard.current_drawdown;
            }
        }

        info!(
            "📈 Trading stats updated: trades={}, win_rate={:.1}%, total_pnl={}, fees={}",
            stats_guard.total_trades,
            stats_guard.win_rate,
            stats_guard.total_realized_pnl,
            stats_guard.total_fees
        );
    }

    /// Initialize default leverage settings for different assets
    fn initialize_leverage_settings(&self) {
        let leverage_settings = Arc::clone(&self.leverage_settings);

        tokio::spawn(async move {
            let mut settings = leverage_settings.write().await;

            // Conservative leverage for major pairs
            settings.insert("BTCUSDT".to_string(), 10);
            settings.insert("ETHUSDT".to_string(), 10);
            settings.insert("BNBUSDT".to_string(), 8);
            settings.insert("ADAUSDT".to_string(), 8);
            settings.insert("DOTUSDT".to_string(), 8);
            settings.insert("LINKUSDT".to_string(), 8);

            // Lower leverage for volatile altcoins
            settings.insert("SOLUSDT".to_string(), 5);
            settings.insert("AVAXUSDT".to_string(), 5);
            settings.insert("MATICUSDT".to_string(), 5);
            settings.insert("ATOMUSDT".to_string(), 5);

            // Very conservative for meme coins and high-risk assets
            settings.insert("DOGEUSDT".to_string(), 3);
            settings.insert("SHIBUSDT".to_string(), 3);

            info!("🎯 Initialized dynamic leverage settings for {} assets", settings.len());
        });
    }

    /// Start position monitoring for real-time P&L updates
    fn start_position_monitoring(&self) {
        let positions = Arc::clone(&self.positions);
        let mainnet_client = Arc::clone(&self.mainnet_client);
        let stats = Arc::clone(&self.stats);

        tokio::spawn(async move {
            let mut monitoring_interval = tokio::time::interval(Duration::from_secs(30));

            loop {
                monitoring_interval.tick().await;

                let symbols: Vec<String> = {
                    let positions_guard = positions.read().await;
                    positions_guard.keys().cloned().collect()
                };

                for symbol in symbols {
                    // Get current market price from mainnet
                    if let Ok(ticker) = mainnet_client.get_ticker(&symbol).await {
                        let mut positions_guard = positions.write().await;
                        if let Some(position) = positions_guard.get_mut(&symbol) {
                            position.current_price = ticker.last_price;
                            position.last_updated = chrono::Utc::now();

                            // Recalculate unrealized P&L
                            if !position.size.is_zero() {
                                position.unrealized_pnl = if position.size > dec!(0) {
                                    // Long position
                                    position.size * (position.current_price - position.avg_entry_price)
                                } else {
                                    // Short position
                                    position.size.abs() * (position.avg_entry_price - position.current_price)
                                };
                            }

                            position.position_value = position.size.abs() * position.current_price;
                        }
                    }
                }

                // Update total unrealized P&L in stats
                {
                    let positions_guard = positions.read().await;
                    let mut stats_guard = stats.write().await;

                    stats_guard.total_unrealized_pnl = positions_guard
                        .values()
                        .map(|pos| pos.unrealized_pnl)
                        .sum();
                }
            }
        });
    }

    /// Get current trading statistics
    pub async fn get_trading_stats(&self) -> TradingStats {
        self.stats.read().await.clone()
    }

    /// Get current positions
    pub async fn get_positions(&self) -> HashMap<String, Position> {
        self.positions.read().await.clone()
    }

    /// Get active trades
    pub async fn get_active_trades(&self) -> HashMap<String, DemoTrade> {
        self.active_trades.read().await.clone()
    }

    /// Get trade history
    pub async fn get_trade_history(&self, limit: Option<usize>) -> Vec<DemoTrade> {
        let history = self.trade_history.read().await;
        let limit = limit.unwrap_or(history.len());
        history.iter().rev().take(limit).cloned().collect()
    }

    /// Get total profit
    pub async fn get_total_profit(&self) -> Decimal {
        *self.total_profit.read().await
    }

    /// Get capital utilization
    pub async fn get_capital_utilization(&self) -> Result<f64> {
        let total_capital = self.capital_manager.get_total_capital().await?;
        let available_capital = self.capital_manager.get_available_capital().await?;
        let used_capital = total_capital - available_capital;

        let utilization = if total_capital > dec!(0) {
            (used_capital / total_capital).to_f64().unwrap_or(0.0) * 100.0
        } else {
            0.0
        };

        Ok(utilization)
    }

    /// Force close all positions (emergency stop)
    pub async fn emergency_close_all_positions(&self) -> Result<()> {
        info!("🚨 EMERGENCY: Closing all positions");

        let positions = self.get_positions().await;

        for (symbol, position) in positions {
            if !position.size.is_zero() {
                let close_side = if position.size > dec!(0) {
                    OrderSide::Sell
                } else {
                    OrderSide::Buy
                };

                let close_quantity = position.size.abs();

                info!(
                    "🚨 Emergency closing position: {} {} {}",
                    close_side.as_str(),
                    close_quantity,
                    symbol
                );

                // Place market order to close position
                if let Err(e) = self.demo_client.place_market_order(
                    &symbol,
                    close_side,
                    close_quantity,
                ).await {
                    error!("Failed to close position for {}: {}", symbol, e);
                }
            }
        }

        Ok(())
    }

    /// Cancel all active orders
    pub async fn cancel_all_orders(&self) -> Result<()> {
        info!("❌ Cancelling all active orders");

        let active_trades = self.get_active_trades().await;

        for (trade_id, trade) in active_trades {
            if let Some(exchange_order_id) = &trade.exchange_order_id {
                if let Err(e) = self.demo_client.cancel_order(&trade.symbol, exchange_order_id).await {
                    error!("Failed to cancel order {} for {}: {}", exchange_order_id, trade_id, e);
                } else {
                    info!("✅ Cancelled order: {} ({})", trade_id, exchange_order_id);
                }
            }
        }

        Ok(())
    }

    /// Get detailed profit breakdown
    pub async fn get_profit_breakdown(&self) -> ProfitBreakdown {
        let stats = self.get_trading_stats().await;
        let positions = self.get_positions().await;
        let total_profit = self.get_total_profit().await;

        let total_unrealized = positions.values()
            .map(|pos| pos.unrealized_pnl)
            .sum::<Decimal>();

        let total_fees = positions.values()
            .map(|pos| pos.total_fees)
            .sum::<Decimal>();

        ProfitBreakdown {
            total_realized_pnl: stats.total_realized_pnl,
            total_unrealized_pnl: total_unrealized,
            total_fees: total_fees,
            net_profit: total_profit,
            gross_profit: stats.total_realized_pnl + total_unrealized,
            profit_factor: if stats.largest_loss != dec!(0) {
                (stats.largest_win / stats.largest_loss.abs()).to_f64().unwrap_or(0.0)
            } else {
                0.0
            },
            win_rate: stats.win_rate,
            total_trades: stats.total_trades,
            successful_trades: stats.successful_trades,
        }
    }
}

/// Profit breakdown structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfitBreakdown {
    /// Total realized P&L
    pub total_realized_pnl: Decimal,

    /// Total unrealized P&L
    pub total_unrealized_pnl: Decimal,

    /// Total fees paid
    pub total_fees: Decimal,

    /// Net profit (realized - fees)
    pub net_profit: Decimal,

    /// Gross profit (realized + unrealized)
    pub gross_profit: Decimal,

    /// Profit factor (gross profit / gross loss)
    pub profit_factor: f64,

    /// Win rate percentage
    pub win_rate: f64,

    /// Total number of trades
    pub total_trades: u64,

    /// Number of successful trades
    pub successful_trades: u64,
}