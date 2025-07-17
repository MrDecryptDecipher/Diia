/**
 * Close All Open Positions on Bybit Demo
 * This will free up capital for the 12 USDT trading system
 */

const bybitClient = require('./ui/dashboard-backend/src/utils/bybit-client');
const logger = require('./ui/dashboard-backend/src/utils/logger');

async function closeAllPositions() {
  try {
    console.log('🔍 Getting all open positions...');
    
    // Get all positions
    const positions = await bybitClient.getPositions();
    
    if (!positions || positions.retCode !== 0) {
      throw new Error('Failed to get positions');
    }
    
    const openPositions = positions.result.list.filter(pos => parseFloat(pos.size) > 0);
    
    console.log(`📊 Found ${openPositions.length} open positions to close`);
    
    if (openPositions.length === 0) {
      console.log('✅ No open positions to close');
      return;
    }
    
    // Close each position
    let closedCount = 0;
    let failedCount = 0;
    
    for (const position of openPositions) {
      try {
        console.log(`🔄 Closing ${position.symbol} ${position.side} position (Size: ${position.size})`);
        
        // Determine opposite side to close position
        const closeSide = position.side === 'Buy' ? 'Sell' : 'Buy';
        
        // Place market order to close position
        const closeOrder = {
          category: 'linear',
          symbol: position.symbol,
          side: closeSide,
          orderType: 'Market',
          qty: position.size,
          timeInForce: 'IOC',
          reduceOnly: true  // Important: this closes the position
        };
        
        const response = await bybitClient.placeOrder(closeOrder);
        
        if (response && response.retCode === 0) {
          console.log(`✅ Closed ${position.symbol}: Order ID ${response.result.orderId}`);
          closedCount++;
        } else {
          console.log(`❌ Failed to close ${position.symbol}: ${response?.retMsg}`);
          failedCount++;
        }
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`❌ Error closing ${position.symbol}:`, error.message);
        failedCount++;
      }
    }
    
    console.log('');
    console.log('📊 POSITION CLOSURE SUMMARY:');
    console.log(`   ✅ Successfully closed: ${closedCount} positions`);
    console.log(`   ❌ Failed to close: ${failedCount} positions`);
    console.log(`   📈 Total processed: ${openPositions.length} positions`);
    
    // Wait a moment then check final balance
    console.log('');
    console.log('⏳ Waiting 5 seconds for positions to settle...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check final balance
    const finalBalance = await bybitClient.getWalletBalance({
      accountType: 'UNIFIED'
    });
    
    if (finalBalance && finalBalance.retCode === 0) {
      const account = finalBalance.result.list[0];
      console.log('💰 FINAL ACCOUNT STATUS:');
      console.log(`   Total Available Balance: ${account.totalAvailableBalance} USD`);
      console.log(`   Total Initial Margin: ${account.totalInitialMargin} USD`);
      
      const availableForTrading = parseFloat(account.totalAvailableBalance);
      console.log(`   🎯 Available for 12 USDT Trading: ${availableForTrading.toFixed(2)} USD`);
      
      if (availableForTrading >= 12) {
        console.log('   ✅ Ready for 12 USDT trading system!');
      } else {
        console.log('   ⚠️ May need to close more positions or wait for settlement');
      }
    }
    
  } catch (error) {
    console.error('❌ Error in closeAllPositions:', error);
  }
}

closeAllPositions();
