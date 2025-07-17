/**
 * Check current positions and available balance
 */

const bybitClient = require('./ui/dashboard-backend/src/utils/bybit-client');

async function checkAccountStatus() {
  try {
    console.log('🔍 Checking account status...');
    
    // Check positions
    const positions = await bybitClient.getPositions();
    
    console.log('📊 Current Positions:');
    if (positions && positions.retCode === 0 && positions.result?.list) {
      let hasPositions = false;
      for (const position of positions.result.list) {
        if (parseFloat(position.size) > 0) {
          hasPositions = true;
          console.log(`   ${position.symbol}: Size=${position.size}, Side=${position.side}, Value=${position.positionValue} USD`);
        }
      }
      if (!hasPositions) {
        console.log('   No open positions found');
      }
    } else {
      console.log('   Failed to get positions:', positions?.retMsg);
    }
    
    // Check balance
    const balance = await bybitClient.getWalletBalance({
      accountType: 'UNIFIED'
    });
    
    if (balance && balance.retCode === 0 && balance.result?.list?.[0]) {
      const account = balance.result.list[0];
      console.log('\n💰 Account Summary:');
      console.log(`   Total Available Balance: ${account.totalAvailableBalance} USD`);
      console.log(`   Total Initial Margin: ${account.totalInitialMargin} USD`);
      
      const availableForTrading = parseFloat(account.totalAvailableBalance);
      console.log(`\n🎯 Available for Trading: ${availableForTrading.toFixed(2)} USD`);
      
      if (availableForTrading >= 12) {
        console.log('✅ Sufficient balance for 12 USDT trading');
      } else {
        console.log('❌ Insufficient balance for 12 USDT trading');
        console.log(`   Need to free up ${(12 - availableForTrading).toFixed(2)} USD`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAccountStatus();
