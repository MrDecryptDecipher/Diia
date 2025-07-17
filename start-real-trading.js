/**
 * 🚀 REAL TRADING SYSTEM STARTUP
 * 
 * This script starts the REAL working trading system without any fake components.
 * It bypasses all the complex theoretical systems and just executes real trades.
 */

const path = require('path');
const logger = require('./ui/dashboard-backend/src/utils/logger');

// Set up environment
process.env.NODE_ENV = 'demo';
process.env.BYBIT_API_KEY = 'VYAE4ZDhqftD7N6C1e';
process.env.BYBIT_API_SECRET = 'BFO3TRwpkUKbWTdSiRCEH8RTJiEbr7KTS4Vj';
process.env.BYBIT_TESTNET = 'true';

async function startRealTradingSystem() {
  try {
    logger.info('🚀 Starting REAL Trading System - No Fake Components');
    logger.info('💰 Capital: Exactly 12.00 USDT');
    logger.info('🎯 Target: 750+ trades per day');
    logger.info('⚡ Execution: Real Bybit demo orders');
    
    // Import the real trading system
    const RealWorkingTradingSystem = require('./ui/dashboard-backend/src/services/real-working-trading-system');
    
    // Create and start the system
    const tradingSystem = new RealWorkingTradingSystem();
    
    // Start the system
    await tradingSystem.start();
    
    // Log status every minute
    setInterval(() => {
      const status = tradingSystem.getStatus();
      
      logger.info('📊 REAL SYSTEM STATUS:');
      logger.info(`   Active: ${status.isActive ? 'YES' : 'NO'}`);
      logger.info(`   Emergency Stop: ${status.emergencyStopActive ? 'ACTIVE' : 'INACTIVE'}`);
      logger.info(`   Trades: ${status.totalTrades}/${status.targetTrades} (${(status.totalTrades/status.targetTrades*100).toFixed(1)}%)`);
      logger.info(`   Win Rate: ${status.totalTrades > 0 ? (status.successfulTrades/status.totalTrades*100).toFixed(1) : 0}%`);
      logger.info(`   Positions: ${status.activePositions}/${status.maxPositions}`);
      logger.info(`   Assets Available: ${status.availableAssets}`);
      
      if (status.recentOrders.length > 0) {
        logger.info(`   Last Order: ${status.recentOrders[status.recentOrders.length - 1].orderId}`);
      }
      
    }, 60000);
    
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
    
    logger.info('✅ Real Trading System started successfully');
    logger.info('🔄 System will execute trades every 115 seconds');
    logger.info('📊 Status updates every 60 seconds');
    
  } catch (error) {
    logger.error('❌ Failed to start Real Trading System:', error);
    process.exit(1);
  }
}

// Start the system
startRealTradingSystem();
