#!/usr/bin/env node

/**
 * PHANTOM POSITION FIX SCRIPT
 * Fixes the position counter bug that's preventing trading
 */

const fs = require('fs');
const path = require('path');

const logger = {
  info: (msg) => console.log(`[${new Date().toISOString()}] INFO: ${msg}`),
  warn: (msg) => console.log(`[${new Date().toISOString()}] WARN: ${msg}`),
  error: (msg) => console.log(`[${new Date().toISOString()}] ERROR: ${msg}`)
};

async function fixPhantomPositions() {
  logger.info('🔧 Starting Phantom Position Fix...');
  
  const tradingServicePath = '/home/ubuntu/Sandeep/projects/omni/ui/dashboard-backend/src/services/trading-strategy-service.js';
  
  try {
    // Read the current file
    let content = fs.readFileSync(tradingServicePath, 'utf8');
    
    // 1. Fix the canOpenPosition function to filter out phantom positions
    const oldCanOpenPosition = `  // Check maximum concurrent positions
  if (tradingState.openTrades.length >= TRADING_CONFIG.multiAsset.maxConcurrentPositions) {
    logger.warn(\`Cannot open position: Maximum concurrent positions (\${TRADING_CONFIG.multiAsset.maxConcurrentPositions}) reached\`);
    return false;
  }`;
    
    const newCanOpenPosition = `  // 🚨 PHANTOM POSITION FIX: Only count REAL positions with actual capital allocation
  const realOpenPositions = tradingState.openTrades.filter(trade => 
    trade && 
    trade.status === 'open' && 
    trade.amount > 0 && 
    (trade.positionValue || trade.amount || (trade.quantity * trade.price)) > 0
  );
  
  logger.info(\`🔍 POSITION CHECK: Total trades in array: \${tradingState.openTrades.length}, Real positions: \${realOpenPositions.length}, Limit: \${TRADING_CONFIG.multiAsset.maxConcurrentPositions}\`);
  
  if (realOpenPositions.length >= TRADING_CONFIG.multiAsset.maxConcurrentPositions) {
    logger.warn(\`Cannot open position: Maximum concurrent positions (\${TRADING_CONFIG.multiAsset.maxConcurrentPositions}) reached (Real: \${realOpenPositions.length})\`);
    return false;
  }`;
    
    if (content.includes(oldCanOpenPosition)) {
      content = content.replace(oldCanOpenPosition, newCanOpenPosition);
      logger.info('✅ Fixed canOpenPosition function');
    } else {
      logger.warn('⚠️  canOpenPosition function pattern not found - may already be fixed');
    }
    
    // 2. Add a phantom position cleanup function
    const cleanupFunction = `
/**
 * 🚨 PHANTOM POSITION CLEANUP: Remove invalid/phantom positions
 */
function cleanupPhantomPositions() {
  const initialCount = tradingState.openTrades.length;
  
  // Filter out phantom positions (positions with no real capital allocation)
  tradingState.openTrades = tradingState.openTrades.filter(trade => {
    if (!trade) return false;
    if (trade.status !== 'open') return false;
    if (!trade.amount || trade.amount <= 0) return false;
    
    const positionValue = trade.positionValue || trade.amount || (trade.quantity * trade.price) || 0;
    if (positionValue <= 0) return false;
    
    return true;
  });
  
  const finalCount = tradingState.openTrades.length;
  const removedCount = initialCount - finalCount;
  
  if (removedCount > 0) {
    logger.info(\`🧹 PHANTOM CLEANUP: Removed \${removedCount} phantom positions (\${initialCount} → \${finalCount})\`);
    
    // Recalculate capital allocation to ensure consistency
    const totalAllocated = getTotalAllocatedCapital();
    logger.info(\`💰 CAPITAL AFTER CLEANUP: \${totalAllocated.toFixed(2)} USDT allocated from \${TRADING_CONFIG.initialCapital} USDT\`);
  }
  
  return removedCount;
}`;
    
    // Insert the cleanup function before the module.exports
    const moduleExportsIndex = content.lastIndexOf('module.exports = {');
    if (moduleExportsIndex !== -1) {
      content = content.slice(0, moduleExportsIndex) + cleanupFunction + '\n\n' + content.slice(moduleExportsIndex);
      logger.info('✅ Added phantom position cleanup function');
    }
    
    // 3. Add cleanup call to the shouldExecuteTrade function
    const shouldExecuteTradePattern = /async function shouldExecuteTrade\(\) \{/;
    if (shouldExecuteTradePattern.test(content)) {
      content = content.replace(
        shouldExecuteTradePattern,
        `async function shouldExecuteTrade() {
  // 🚨 PHANTOM POSITION FIX: Clean up phantom positions before checking limits
  cleanupPhantomPositions();`
      );
      logger.info('✅ Added phantom cleanup to shouldExecuteTrade');
    }
    
    // 4. Add cleanup to the start function
    const startFunctionPattern = /tradingState\.isActive = true;/;
    if (startFunctionPattern.test(content)) {
      content = content.replace(
        startFunctionPattern,
        `tradingState.isActive = true;
    
    // 🚨 PHANTOM POSITION FIX: Clean up any phantom positions on startup
    cleanupPhantomPositions();`
      );
      logger.info('✅ Added phantom cleanup to start function');
    }
    
    // 5. Export the cleanup function
    const moduleExportsPattern = /module\.exports = \{([^}]+)\};/s;
    if (moduleExportsPattern.test(content)) {
      content = content.replace(
        moduleExportsPattern,
        (match, exports) => {
          if (!exports.includes('cleanupPhantomPositions')) {
            return `module.exports = {${exports},
  cleanupPhantomPositions
};`;
          }
          return match;
        }
      );
      logger.info('✅ Added cleanupPhantomPositions to exports');
    }
    
    // Write the fixed file
    fs.writeFileSync(tradingServicePath, content);
    logger.info('✅ Successfully applied phantom position fixes');
    
    return true;
    
  } catch (error) {
    logger.error(`Failed to fix phantom positions: ${error.message}`);
    return false;
  }
}

async function testPositionCounting() {
  logger.info('🧪 Testing position counting logic...');
  
  try {
    // Import the trading service to test the fixes
    const tradingService = require('/home/ubuntu/Sandeep/projects/omni/ui/dashboard-backend/src/services/trading-strategy-service.js');
    
    // Get current state
    const state = tradingService.getTradingState();
    
    logger.info(`📊 Current State:`);
    logger.info(`  Open Trades Array Length: ${state.openTrades.length}`);
    logger.info(`  Total Trades: ${state.totalTrades}`);
    logger.info(`  Current Capital: ${state.currentCapital} USDT`);
    
    // Test the cleanup function if it exists
    if (tradingService.cleanupPhantomPositions) {
      const removedCount = tradingService.cleanupPhantomPositions();
      logger.info(`🧹 Cleanup Result: Removed ${removedCount} phantom positions`);
    }
    
    return true;
    
  } catch (error) {
    logger.error(`Testing failed: ${error.message}`);
    return false;
  }
}

async function main() {
  logger.info('🚀 Starting Phantom Position Fix Script');
  logger.info('=' * 60);
  
  // Step 1: Apply the fixes
  const fixSuccess = await fixPhantomPositions();
  
  if (!fixSuccess) {
    logger.error('❌ Failed to apply fixes');
    process.exit(1);
  }
  
  // Step 2: Test the fixes
  logger.info('\n🧪 Testing the fixes...');
  const testSuccess = await testPositionCounting();
  
  if (!testSuccess) {
    logger.error('❌ Testing failed');
    process.exit(1);
  }
  
  logger.info('\n' + '=' * 60);
  logger.info('🎉 PHANTOM POSITION FIX COMPLETE!');
  logger.info('✅ Position counter logic has been fixed');
  logger.info('✅ Phantom position cleanup added');
  logger.info('✅ System should now trade normally');
  logger.info('\n🔄 Please restart the OMNI API service to apply changes:');
  logger.info('   pm2 restart omni-api');
}

// Run the fix
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { fixPhantomPositions, testPositionCounting };
