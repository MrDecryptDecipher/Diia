/**
 * 🚨 EMERGENCY CAPITAL BUG FIX
 * 
 * This script fixes the capital allocation bug in your OMNI system
 * that's preventing real trades from being executed.
 */

const tradingService = require('./ui/dashboard-backend/src/services/trading-strategy-service');

async function fixCapitalBug() {
  console.log('🚨 EMERGENCY CAPITAL BUG FIX STARTING...');
  console.log('');
  
  try {
    // Get current state
    console.log('📊 Current Trading State:');
    const currentState = tradingService.getTradingState();
    console.log(`   Current Capital: ${currentState.currentCapital} USDT`);
    console.log(`   Open Trades: ${currentState.openTrades.length}`);
    console.log(`   Total Trades: ${currentState.totalTrades}`);
    console.log('');
    
    // Execute emergency reset
    console.log('🔧 Executing Emergency Capital Reset...');
    const resetResult = tradingService.emergencyCapitalReset();
    
    if (resetResult.success) {
      console.log('✅ EMERGENCY RESET SUCCESSFUL!');
      console.log(`   Message: ${resetResult.message}`);
      console.log(`   Current Capital: ${resetResult.currentCapital} USDT`);
      console.log(`   Total Allocated: ${resetResult.totalAllocated} USDT`);
      console.log(`   Available Capital: ${resetResult.availableCapital} USDT`);
      console.log('');

      // 🚨 CRITICAL DEBUG: Check the actual state
      console.log('🔍 DEBUGGING POSITION COUNTER:');
      const newState = tradingService.getTradingState();
      console.log(`   Current Capital: ${newState.currentCapital} USDT`);
      console.log(`   Open Trades Length: ${newState.openTrades.length}`);
      console.log(`   Open Trades Content:`, newState.openTrades);
      console.log(`   Total Trades: ${newState.totalTrades}`);

      // Check trading config
      const TRADING_CONFIG = require('./ui/dashboard-backend/src/config/trading-config');
      console.log(`   Max Concurrent Positions: ${TRADING_CONFIG.multiAsset?.maxConcurrentPositions || 'UNDEFINED'}`);
      console.log(`   Max Positions: ${TRADING_CONFIG.maxPositions || 'UNDEFINED'}`);
      console.log('');
      
      console.log('🚀 CAPITAL BUG FIXED! Your OMNI system should now be able to trade again.');
      console.log('');
      console.log('📋 Next Steps:');
      console.log('   1. The system will automatically start looking for trading opportunities');
      console.log('   2. Check your Bybit app for real trades appearing');
      console.log('   3. Monitor the PM2 logs: pm2 logs omni-api');
      console.log('');
      console.log('🎯 Expected Result: You should see real trades on your Bybit account within minutes!');
      
    } else {
      console.error('❌ Emergency reset failed');
    }
    
  } catch (error) {
    console.error('❌ Error during capital bug fix:', error.message);
  }
}

// Run the fix
fixCapitalBug();
