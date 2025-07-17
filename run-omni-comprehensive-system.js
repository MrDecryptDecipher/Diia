/**
 * 🚀 RUN OMNI COMPREHENSIVE TRADING SYSTEM
 * 
 * This script runs the complete OMNI comprehensive trading system with:
 * - EXACT 12 USDT capital distribution (2×5 USDT + 2 USDT safety)
 * - REAL OMNI analysis (18 components)
 * - Web Scout MCP sentiment analysis (Twitter, Reddit, articles)
 * - Gemini CLI enhanced analysis
 * - Exponential growth strategy for 750 trades/day
 * - 0.6 USDT profit per trade target
 * 
 * NO SHORTCUTS, NO MOCKS - Uses all real OMNI components
 */

const OmniComprehensiveTradingSystem = require('./omni-comprehensive-trading-system');
const logger = require('./ui/dashboard-backend/src/utils/logger');

// Global system instance
let omniSystem = null;

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  logger.info('🛑 Received SIGTERM, shutting down gracefully...');
  if (omniSystem) {
    await omniSystem.stop();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('🛑 Received SIGINT, shutting down gracefully...');
  if (omniSystem) {
    await omniSystem.stop();
  }
  process.exit(0);
});

async function main() {
  try {
    logger.info('🚀 STARTING OMNI COMPREHENSIVE TRADING SYSTEM');
    logger.info('');
    logger.info('📋 SYSTEM SPECIFICATIONS:');
    logger.info('   💰 Total Capital: 12 USDT');
    logger.info('   📊 Trade Distribution: 2 trades × 5 USDT each');
    logger.info('   🛡️ Safety Buffer: 2 USDT');
    logger.info('   🎯 Target Profit: 0.6 USDT per trade');
    logger.info('   📈 Target Volume: 750 trades/day');
    logger.info('   🔬 Analysis: OMNI (18 components) + Sentiment + Gemini');
    logger.info('   🌐 Sentiment Sources: Twitter, Reddit, News Articles');
    logger.info('   🤖 AI Enhancement: Gemini CLI integration');
    logger.info('   📡 Execution: Bybit Demo Environment');
    logger.info('');
    
    // Initialize the comprehensive system
    omniSystem = new OmniComprehensiveTradingSystem();
    
    // Start the system
    await omniSystem.start();
    
    logger.info('✅ OMNI COMPREHENSIVE TRADING SYSTEM IS NOW LIVE!');
    logger.info('');
    logger.info('🔄 System will now:');
    logger.info('   1. Continuously analyze market with OMNI (18 components)');
    logger.info('   2. Scrape sentiment from Twitter, Reddit, articles');
    logger.info('   3. Enhance analysis with Gemini CLI');
    logger.info('   4. Execute trades when all signals align (85%+ confidence)');
    logger.info('   5. Manage 2 active positions with 5 USDT each');
    logger.info('   6. Target 0.6 USDT profit per trade');
    logger.info('   7. Grow capital exponentially through 750 trades/day');
    logger.info('');
    logger.info('📊 Monitor the logs for real-time trading activity...');
    
    // Keep the process running
    await new Promise(() => {}); // Run indefinitely
    
  } catch (error) {
    logger.error('❌ Fatal error in OMNI comprehensive trading system:', error);
    process.exit(1);
  }
}

// Run the system
main().catch(error => {
  logger.error('❌ Unhandled error:', error);
  process.exit(1);
});
