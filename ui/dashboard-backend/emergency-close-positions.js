/**
 * Emergency Position Closer
 * 
 * Closes losing positions to prevent further losses
 */

const bybitClient = require('./src/utils/bybit-client');

// Positions to close (based on REAL Bybit analysis)
const POSITIONS_TO_CLOSE = [
  'FARTCOINUSDT',  // -$0.191 (-3.68%) - WORST LOSS
  'AGTUSDT',       // -$0.350 (-1.79%) - SIGNIFICANT LOSS
  'FLOCKUSDT',     // -$0.609 (-1.08%) - LARGEST LOSS AMOUNT
  'BRETTUSDT'      // -$0.438 (-0.76%) - MODERATE LOSS
];

async function closePosition(symbol) {
  try {
    console.log(`🚨 Closing position: ${symbol}`);

    // Get ALL positions (don't filter by symbol in API call)
    const positionsResponse = await bybitClient.getPositions();

    if (positionsResponse.retCode !== 0) {
      console.error(`❌ Error getting positions:`, positionsResponse.retMsg);
      return false;
    }

    const positions = positionsResponse.result?.list || [];
    const position = positions.find(p => p.symbol === symbol && parseFloat(p.size) > 0);
    
    if (!position) {
      console.log(`ℹ️  No active position found for ${symbol}`);
      return true;
    }
    
    const size = parseFloat(position.size);
    const side = position.side.toLowerCase();
    const closeSide = side === 'buy' ? 'sell' : 'buy';
    
    console.log(`📊 Position: ${symbol} ${side} ${size} @ $${position.avgPrice}`);
    console.log(`💰 P&L: $${position.unrealisedPnl} (${((parseFloat(position.unrealisedPnl) / parseFloat(position.positionValue)) * 100).toFixed(2)}%)`);
    
    // Place market order to close position
    const orderParams = {
      category: 'linear',
      symbol: symbol,
      side: closeSide,
      orderType: 'Market',
      qty: size.toString(),
      reduceOnly: true,
      timeInForce: 'IOC'
    };
    
    console.log(`🔄 Placing close order:`, orderParams);
    
    const orderResponse = await bybitClient.placeOrder(orderParams);
    
    if (orderResponse.retCode === 0) {
      console.log(`✅ Position ${symbol} closed successfully`);
      console.log(`📋 Order ID: ${orderResponse.result.orderId}`);
      return true;
    } else {
      console.error(`❌ Failed to close ${symbol}:`, orderResponse.retMsg);
      return false;
    }
    
  } catch (error) {
    console.error(`❌ Error closing position ${symbol}:`, error.message);
    return false;
  }
}

async function emergencyClosePositions() {
  console.log('🚨 EMERGENCY POSITION CLOSURE INITIATED');
  console.log('🎯 Closing losing positions to prevent further losses');
  console.log('');
  
  const results = [];
  
  for (const symbol of POSITIONS_TO_CLOSE) {
    console.log(`\n--- Processing ${symbol} ---`);
    const success = await closePosition(symbol);
    results.push({ symbol, success });
    
    // Wait 1 second between orders to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🏁 EMERGENCY CLOSURE COMPLETE');
  console.log('📊 Results:');
  
  results.forEach(({ symbol, success }) => {
    const status = success ? '✅ CLOSED' : '❌ FAILED';
    console.log(`  ${symbol}: ${status}`);
  });
  
  const successCount = results.filter(r => r.success).length;
  console.log(`\n📈 Summary: ${successCount}/${results.length} positions closed successfully`);
  
  if (successCount === results.length) {
    console.log('🎉 All losing positions closed successfully!');
  } else {
    console.log('⚠️  Some positions failed to close. Manual intervention may be required.');
  }
}

// Run the emergency closure
emergencyClosePositions()
  .then(() => {
    console.log('\n✅ Emergency closure script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Emergency closure script failed:', error);
    process.exit(1);
  });
