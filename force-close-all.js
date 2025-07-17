#!/usr/bin/env node

/**
 * FORCE CLOSE ALL POSITIONS - IMMEDIATE ACTION
 * Using exact credentials from demo.env
 */

const { RestClientV5 } = require('bybit-api');

// EXACT credentials from demo.env
const client = new RestClientV5({
  key: 'VYAE4ZDhqftD7N6C1e',
  secret: 'BFO3TRwpkUKbWTdSiRCEH8RTJiEbr7KTS4Vj',
  demoTrading: true
});

async function forceCloseAll() {
  console.log('🚨 FORCE CLOSING ALL POSITIONS IMMEDIATELY');
  console.log('Using credentials: VYAE4ZDhqftD7N6C1e');
  
  try {
    // Get all positions
    console.log('📊 Getting positions...');
    const positions = await client.getPositionInfo({
      category: 'linear',
      settleCoin: 'USDT'
    });

    console.log('🔍 Raw API response:', JSON.stringify(positions, null, 2));

    if (!positions || !positions.result || !positions.result.list) {
      console.error('❌ Failed to get positions or unexpected response format');
      console.error('Response:', positions);
      return;
    }

    const openPositions = positions.result.list.filter(p => parseFloat(p.size || 0) > 0);
    console.log(`🎯 Found ${openPositions.length} open positions`);
    
    if (openPositions.length === 0) {
      console.log('✅ No positions to close');
      return;
    }
    
    // Show all positions
    console.log('\n📋 Positions to close:');
    openPositions.forEach((pos, i) => {
      console.log(`${i+1}. ${pos.symbol}: ${pos.side} ${pos.size} (Value: ${pos.positionValue} USDT)`);
    });
    
    console.log('\n🔄 Closing all positions NOW...');
    
    let closed = 0;
    let failed = 0;
    
    // Close each position
    for (const pos of openPositions) {
      try {
        const side = pos.side === 'Buy' ? 'Sell' : 'Buy';
        
        console.log(`🔄 ${pos.symbol}: ${pos.side} -> ${side} (${pos.size})`);
        
        const order = await client.submitOrder({
          category: 'linear',
          symbol: pos.symbol,
          side: side,
          orderType: 'Market',
          qty: pos.size,
          reduceOnly: true
        });
        
        if (order.result && order.result.orderId) {
          console.log(`✅ ${pos.symbol}: CLOSED (Order: ${order.result.orderId})`);
          closed++;
        } else {
          console.log(`❌ ${pos.symbol}: FAILED - ${order.retMsg || 'Unknown error'}`);
          failed++;
        }
        
      } catch (error) {
        console.log(`❌ ${pos.symbol}: ERROR - ${error.message}`);
        failed++;
      }
      
      // Small delay
      await new Promise(r => setTimeout(r, 200));
    }
    
    console.log(`\n📊 RESULTS:`);
    console.log(`✅ Closed: ${closed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Total: ${openPositions.length}`);
    
    // Check final status
    console.log('\n⏳ Checking final status...');
    await new Promise(r => setTimeout(r, 3000));
    
    const finalCheck = await client.getPositionInfo({
      category: 'linear',
      settleCoin: 'USDT'
    });
    const remaining = finalCheck.result.list.filter(p => parseFloat(p.size) > 0);
    
    console.log(`\n🎯 FINAL: ${remaining.length} positions remaining`);
    
    if (remaining.length === 0) {
      console.log('🎉 SUCCESS! ALL POSITIONS CLOSED!');
      console.log('💰 Your account is now clean for the 12 USDT strategy');
    } else {
      console.log('⚠️ Some positions still open:');
      remaining.forEach(p => {
        console.log(`  - ${p.symbol}: ${p.side} ${p.size}`);
      });
    }
    
  } catch (error) {
    console.error('❌ CRITICAL ERROR:', error.message);
    console.error('Full error:', error);
  }
}

// Execute immediately
forceCloseAll().then(() => {
  console.log('\n🏁 Script completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
