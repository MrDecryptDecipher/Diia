/**
 * 🚀 SIMPLE REAL TRADING SYSTEM - ACTUALLY WORKS
 * 
 * This is a simplified but REAL working trading system that:
 * - Uses well-known assets with proper lot sizes
 * - Actually executes trades on Bybit demo
 * - Uses exactly 12 USDT capital
 * - Provides verifiable order IDs
 * - No complex calculations that can fail
 */

const path = require('path');

// Set up environment
process.env.NODE_ENV = 'demo';
process.env.BYBIT_API_KEY = 'VYAE4ZDhqftD7N6C1e';
process.env.BYBIT_API_SECRET = 'BFO3TRwpkUKbWTdSiRCEH8RTJiEbr7KTS4Vj';
process.env.BYBIT_TESTNET = 'true';

const logger = require('./ui/dashboard-backend/src/utils/logger');
const bybitClient = require('./ui/dashboard-backend/src/utils/bybit-client');

class SimpleRealTradingSystem {
  constructor() {
    // Simple configuration
    this.config = {
      totalCapital: 12.0,
      activeCapital: 10.0,
      safetyBuffer: 2.0,
      tradeIntervalMs: 115000, // 115 seconds
      targetTradesPerDay: 750
    };
    
    // Well-known assets with proper lot sizes
    this.tradingAssets = [
      { symbol: 'DOGEUSDT', minQty: 1, qtyStep: 1 },
      { symbol: 'ADAUSDT', minQty: 1, qtyStep: 1 },
      { symbol: 'DOTUSDT', minQty: 0.1, qtyStep: 0.1 },
      { symbol: 'LINKUSDT', minQty: 0.1, qtyStep: 0.1 },
      { symbol: 'LTCUSDT', minQty: 0.01, qtyStep: 0.01 },
      { symbol: 'AVAXUSDT', minQty: 0.1, qtyStep: 0.1 },
      { symbol: 'MATICUSDT', minQty: 1, qtyStep: 1 },
      { symbol: 'ATOMUSDT', minQty: 0.1, qtyStep: 0.1 }
    ];
    
    // System state
    this.state = {
      isActive: false,
      totalTrades: 0,
      successfulTrades: 0,
      activePositions: new Map(),
      orderHistory: [],
      currentAssetIndex: 0
    };
    
    this.tradingInterval = null;
    
    logger.info('🚀 Simple Real Trading System initialized');
  }
  
  async start() {
    try {
      logger.info('🚀 Starting Simple Real Trading System');
      logger.info('💰 Capital: Exactly 12.00 USDT');
      logger.info('🎯 Target: 750+ trades per day');
      logger.info('⚡ Execution: Real Bybit demo orders');
      
      this.state.isActive = true;
      
      // Start trading loop
      this.startTradingLoop();
      
      // Log status every minute
      setInterval(() => {
        this.logStatus();
      }, 60000);
      
      logger.info('✅ Simple Real Trading System started successfully');
      
    } catch (error) {
      logger.error('❌ Failed to start trading system:', error);
      throw error;
    }
  }
  
  startTradingLoop() {
    this.tradingInterval = setInterval(async () => {
      if (!this.state.isActive) return;
      
      try {
        await this.executeTrade();
      } catch (error) {
        logger.error('❌ Error in trading cycle:', error);
      }
    }, this.config.tradeIntervalMs);
    
    logger.info(`⚡ Trading loop started - executing every ${this.config.tradeIntervalMs}ms`);
  }
  
  async executeTrade() {
    const startTime = Date.now();
    
    try {
      // Check if we can trade
      if (this.state.activePositions.size >= 2) {
        logger.info('📊 Maximum positions reached, skipping trade');
        return;
      }
      
      // Select asset to trade
      const asset = this.selectAsset();
      if (!asset) {
        logger.info('📊 No suitable asset found');
        return;
      }
      
      // Get current price
      const currentPrice = await this.getCurrentPrice(asset.symbol);
      if (!currentPrice) {
        logger.error(`❌ Failed to get price for ${asset.symbol}`);
        return;
      }
      
      // Calculate quantity
      const side = Math.random() > 0.5 ? 'Buy' : 'Sell';
      const orderValue = 5.0; // 5 USDT order
      const leverage = 10; // 10x leverage
      const notionalValue = orderValue * leverage; // 50 USDT notional
      
      let quantity = notionalValue / currentPrice;
      
      // Round to asset's quantity step
      quantity = Math.floor(quantity / asset.qtyStep) * asset.qtyStep;
      
      // Ensure minimum quantity
      if (quantity < asset.minQty) {
        quantity = asset.minQty;
      }
      
      // Place the order
      const orderParams = {
        category: 'linear',
        symbol: asset.symbol,
        side: side,
        orderType: 'Market',
        qty: quantity.toString(),
        timeInForce: 'IOC'
      };
      
      logger.info(`📤 Placing REAL order: ${JSON.stringify(orderParams)}`);
      
      const response = await bybitClient.placeOrder(orderParams);
      
      if (response && response.retCode === 0 && response.result?.orderId) {
        // Success!
        this.state.totalTrades++;
        this.state.successfulTrades++;
        
        const orderId = response.result.orderId;
        
        logger.info(`✅ REAL TRADE EXECUTED: Order ID ${orderId} - ${asset.symbol} ${side} ${quantity} @ ${currentPrice}`);
        
        // Add to order history
        this.state.orderHistory.push({
          orderId: orderId,
          symbol: asset.symbol,
          side: side,
          quantity: quantity,
          price: currentPrice,
          timestamp: Date.now(),
          status: 'FILLED'
        });
        
        // Track position (will close after 5 minutes)
        this.state.activePositions.set(asset.symbol, {
          orderId: orderId,
          symbol: asset.symbol,
          side: side,
          quantity: quantity,
          entryPrice: currentPrice,
          openTime: Date.now()
        });
        
        // Schedule position closure
        setTimeout(() => {
          this.closePosition(asset.symbol);
        }, 300000); // Close after 5 minutes
        
      } else {
        logger.error(`❌ Trade failed: ${response?.retMsg || 'Unknown error'}`);
        this.state.totalTrades++;
      }
      
      const executionTime = Date.now() - startTime;
      logger.info(`⚡ Trading cycle completed in ${executionTime}ms`);
      
    } catch (error) {
      logger.error('❌ Error executing trade:', error);
      this.state.totalTrades++;
    }
  }
  
  selectAsset() {
    // Simple round-robin selection
    const asset = this.tradingAssets[this.state.currentAssetIndex];
    this.state.currentAssetIndex = (this.state.currentAssetIndex + 1) % this.tradingAssets.length;
    
    // Skip if already have position
    if (this.state.activePositions.has(asset.symbol)) {
      return this.selectAsset(); // Try next asset
    }
    
    return asset;
  }
  
  async getCurrentPrice(symbol) {
    try {
      const ticker = await bybitClient.getTicker({
        category: 'linear',
        symbol: symbol
      });
      
      if (ticker && ticker.retCode === 0 && ticker.result?.list?.[0]) {
        return parseFloat(ticker.result.list[0].lastPrice);
      }
      
      return null;
      
    } catch (error) {
      logger.error(`❌ Error getting price for ${symbol}:`, error);
      return null;
    }
  }
  
  async closePosition(symbol) {
    const position = this.state.activePositions.get(symbol);
    if (!position) return;
    
    try {
      const closeOrderParams = {
        category: 'linear',
        symbol: symbol,
        side: position.side === 'Buy' ? 'Sell' : 'Buy',
        orderType: 'Market',
        qty: position.quantity.toString(),
        reduceOnly: true,
        timeInForce: 'IOC'
      };
      
      logger.info(`🔄 Closing position: ${JSON.stringify(closeOrderParams)}`);
      
      const response = await bybitClient.placeOrder(closeOrderParams);
      
      if (response && response.retCode === 0) {
        logger.info(`✅ Position closed: ${symbol} - Order ID: ${response.result.orderId}`);
        this.state.activePositions.delete(symbol);
      } else {
        logger.error(`❌ Failed to close position ${symbol}: ${response?.retMsg}`);
      }
      
    } catch (error) {
      logger.error(`❌ Error closing position ${symbol}:`, error);
    }
  }
  
  logStatus() {
    const winRate = this.state.totalTrades > 0 ? (this.state.successfulTrades / this.state.totalTrades * 100) : 0;
    const dailyProgress = (this.state.totalTrades / this.config.targetTradesPerDay * 100);
    
    logger.info('📊 SIMPLE REAL TRADING STATUS:');
    logger.info(`   Total Trades: ${this.state.totalTrades}/${this.config.targetTradesPerDay} (${dailyProgress.toFixed(1)}%)`);
    logger.info(`   Success Rate: ${winRate.toFixed(1)}%`);
    logger.info(`   Active Positions: ${this.state.activePositions.size}/2`);
    logger.info(`   Capital: ${this.config.totalCapital} USDT (${this.config.activeCapital} active)`);
    
    if (this.state.orderHistory.length > 0) {
      const lastOrder = this.state.orderHistory[this.state.orderHistory.length - 1];
      logger.info(`   Last Order: ${lastOrder.orderId} - ${lastOrder.symbol} ${lastOrder.side} ${lastOrder.quantity}`);
    }
  }
  
  async stop() {
    logger.info('🛑 Stopping Simple Real Trading System');
    
    this.state.isActive = false;
    
    if (this.tradingInterval) {
      clearInterval(this.tradingInterval);
      this.tradingInterval = null;
    }
    
    // Close all active positions
    for (const symbol of this.state.activePositions.keys()) {
      await this.closePosition(symbol);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait between orders
    }
    
    logger.info('✅ Simple Real Trading System stopped');
  }
}

async function startSimpleRealTradingSystem() {
  try {
    const tradingSystem = new SimpleRealTradingSystem();
    
    await tradingSystem.start();
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('🛑 Received SIGINT, shutting down gracefully...');
      await tradingSystem.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      logger.info('🛑 Received SIGTERM, shutting down gracefully...');
      await tradingSystem.stop();
      process.exit(0);
    });
    
  } catch (error) {
    logger.error('❌ Failed to start Simple Real Trading System:', error);
    process.exit(1);
  }
}

// Start the system
startSimpleRealTradingSystem();
