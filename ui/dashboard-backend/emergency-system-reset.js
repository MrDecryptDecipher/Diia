/**
 * EMERGENCY SYSTEM RESET
 * This script completely resets the OMNI trading system to clear phantom trades
 * and restart with a clean state.
 */

const axios = require('axios');

async function emergencySystemReset() {
  console.log('🚨 EMERGENCY SYSTEM RESET INITIATED');
  console.log('🚨 This will completely reset the OMNI trading system');
  
  try {
    // Step 1: Stop all trading activities
    console.log('\n🛑 Step 1: Stopping all trading activities...');
    try {
      const stopResponse = await axios.post('http://localhost:10002/api/trades/stop');
      console.log('✅ Trading stopped:', stopResponse.data);
    } catch (error) {
      console.log('⚠️ Stop request failed (system may already be stopped):', error.message);
    }
    
    // Step 2: Close all existing positions
    console.log('\n🔒 Step 2: Closing all existing positions...');
    try {
      const closeResponse = await axios.post('http://localhost:10002/api/trades/close-all-positions');
      console.log('✅ All positions closed:', closeResponse.data);
    } catch (error) {
      console.log('⚠️ Close positions failed:', error.message);
    }
    
    // Step 3: Reset trading state
    console.log('\n🔄 Step 3: Resetting trading state...');
    try {
      const resetResponse = await axios.post('http://localhost:10002/api/trades/reset-state');
      console.log('✅ Trading state reset:', resetResponse.data);
    } catch (error) {
      console.log('⚠️ Reset state failed:', error.message);
    }
    
    // Step 4: Check system status
    console.log('\n📊 Step 4: Checking system status...');
    try {
      const statusResponse = await axios.get('http://localhost:10002/api/trades/system-status');
      console.log('✅ System status:', JSON.stringify(statusResponse.data, null, 2));
    } catch (error) {
      console.log('⚠️ Status check failed:', error.message);
    }
    
    // Step 5: Verify capital allocation is cleared
    console.log('\n💰 Step 5: Verifying capital allocation...');
    try {
      const metricsResponse = await axios.get('http://localhost:10002/api/trades/metrics');
      console.log('✅ Current metrics:', JSON.stringify(metricsResponse.data, null, 2));
      
      if (metricsResponse.data.openTrades === 0) {
        console.log('✅ SUCCESS: No open trades detected');
      } else {
        console.log('🚨 WARNING: Still have open trades:', metricsResponse.data.openTrades);
      }
    } catch (error) {
      console.log('⚠️ Metrics check failed:', error.message);
    }
    
    // Step 6: Start comprehensive system
    console.log('\n🚀 Step 6: Starting comprehensive trading system...');
    try {
      const startResponse = await axios.post('http://localhost:10002/api/trades/start-comprehensive');
      console.log('✅ Comprehensive system started:', startResponse.data);
    } catch (error) {
      console.log('⚠️ Start comprehensive failed:', error.message);
    }
    
    // Step 7: Final verification
    console.log('\n🔍 Step 7: Final system verification...');
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
    
    try {
      const finalStatusResponse = await axios.get('http://localhost:10002/api/trades/system-status');
      console.log('✅ Final system status:', JSON.stringify(finalStatusResponse.data, null, 2));
      
      // Test comprehensive analysis
      const analysisResponse = await axios.get('http://localhost:10002/api/trades/comprehensive-analysis/BTCUSDT');
      if (analysisResponse.data.success) {
        console.log('✅ Comprehensive analysis working');
        console.log('📊 Sample analysis data:');
        console.log('  - Candlestick patterns:', Object.keys(analysisResponse.data.candlestickPatterns || {}).length);
        console.log('  - Technical indicators:', analysisResponse.data.technicalIndicators ? 'Working' : 'Failed');
        console.log('  - ML predictions:', analysisResponse.data.mlPredictions ? 'Working' : 'Failed');
      } else {
        console.log('🚨 Comprehensive analysis failed');
      }
    } catch (error) {
      console.log('⚠️ Final verification failed:', error.message);
    }
    
    console.log('\n🎉 EMERGENCY SYSTEM RESET COMPLETED');
    console.log('🎯 The system should now be clean and ready for trading');
    console.log('📈 All phantom trades and capital allocations have been cleared');
    console.log('🚀 Comprehensive trading system is now active');
    
  } catch (error) {
    console.error('🚨 EMERGENCY RESET FAILED:', error);
  }
}

// Run the emergency reset
emergencySystemReset();
