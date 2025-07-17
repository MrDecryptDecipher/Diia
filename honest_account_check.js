/**
 * HONEST BYBIT ACCOUNT CHECKER
 * 
 * This script simply shows you what's actually in your Bybit demo account.
 * No fake metrics, no lies, just the truth.
 */

const { RestClientV5 } = require('bybit-api');
const fs = require('fs');

// Load your real credentials
const envContent = fs.readFileSync('./demo.env', 'utf8');
const lines = envContent.split('\n');
const apiKey = lines.find(line => line.startsWith('BYBIT_DEMO_API_KEY=')).split('=')[1];
const apiSecret = lines.find(line => line.startsWith('BYBIT_DEMO_API_SECRET=')).split('=')[1];

// Initialize Bybit client
const client = new RestClientV5({
  key: apiKey,
  secret: apiSecret,
  demoTrading: true
});

console.log('🔍 HONEST BYBIT ACCOUNT CHECK');
console.log('=====================================');
console.log('');

async function checkAccount() {
  try {
    // Get real balance
    console.log('📊 Getting your real account balance...');
    const balanceResponse = await client.getWalletBalance({ accountType: 'UNIFIED' });
    
    if (balanceResponse.retCode === 0) {
      const account = balanceResponse.result.list[0];
      
      console.log('💰 REAL ACCOUNT BALANCE:');
      console.log(`   Total Equity: $${parseFloat(account.totalEquity).toFixed(2)}`);
      console.log(`   Total Wallet Balance: $${parseFloat(account.totalWalletBalance).toFixed(2)}`);
      console.log(`   Available Balance: $${parseFloat(account.totalAvailableBalance).toFixed(2)}`);
      console.log(`   Unrealized P&L: $${parseFloat(account.totalPerpUPL).toFixed(2)}`);
      console.log('');
      
      // Show individual coins
      console.log('🪙 COIN BREAKDOWN:');
      account.coin.forEach(coin => {
        if (parseFloat(coin.walletBalance) > 0) {
          console.log(`   ${coin.coin}: ${coin.walletBalance} (USD Value: $${parseFloat(coin.usdValue).toFixed(2)})`);
          if (parseFloat(coin.cumRealisedPnl) !== 0) {
            console.log(`      Realized P&L: $${parseFloat(coin.cumRealisedPnl).toFixed(2)}`);
          }
          if (parseFloat(coin.unrealisedPnl) !== 0) {
            console.log(`      Unrealized P&L: $${parseFloat(coin.unrealisedPnl).toFixed(2)}`);
          }
        }
      });
      console.log('');
    } else {
      console.log(`❌ Failed to get balance: ${balanceResponse.retMsg}`);
    }
    
    // Get real positions
    console.log('📈 Getting your real positions...');
    const positionsResponse = await client.getPositionInfo({ category: 'linear' });
    
    if (positionsResponse.retCode === 0) {
      const activePositions = positionsResponse.result.list.filter(pos => parseFloat(pos.size) > 0);
      
      if (activePositions.length > 0) {
        console.log('🎯 ACTIVE POSITIONS:');
        activePositions.forEach(pos => {
          console.log(`   ${pos.symbol}: ${pos.side} ${pos.size} @ $${pos.avgPrice}`);
          console.log(`      Mark Price: $${pos.markPrice}`);
          console.log(`      Unrealized P&L: $${pos.unrealisedPnl}`);
          console.log(`      Position Value: $${pos.positionValue}`);
          console.log('');
        });
      } else {
        console.log('📭 No active positions');
        console.log('');
      }
    } else {
      console.log(`❌ Failed to get positions: ${positionsResponse.retMsg}`);
    }
    
    // Get recent real trades (last 10)
    console.log('📋 Getting your recent real trades...');
    const tradesResponse = await client.getExecutionList({ category: 'linear', limit: 10 });
    
    if (tradesResponse.retCode === 0) {
      const trades = tradesResponse.result.list;
      
      if (trades.length > 0) {
        console.log('💼 RECENT REAL TRADES:');
        trades.forEach((trade, index) => {
          const date = new Date(parseInt(trade.execTime));
          console.log(`   ${index + 1}. ${trade.symbol} - ${trade.side} ${trade.execQty} @ $${trade.execPrice}`);
          console.log(`      Value: $${trade.execValue} | Fee: $${trade.execFee}`);
          console.log(`      Time: ${date.toLocaleString()}`);
          console.log(`      Order ID: ${trade.orderId}`);
          console.log('');
        });
      } else {
        console.log('📭 No recent trades found');
        console.log('');
      }
    } else {
      console.log(`❌ Failed to get trades: ${tradesResponse.retMsg}`);
    }
    
    // Summary
    console.log('=====================================');
    console.log('📝 HONEST SUMMARY:');
    
    if (balanceResponse.retCode === 0) {
      const account = balanceResponse.result.list[0];
      const usdtCoin = account.coin.find(coin => coin.coin === 'USDT');
      
      if (usdtCoin) {
        const realizedPnl = parseFloat(usdtCoin.cumRealisedPnl);
        const unrealizedPnl = parseFloat(usdtCoin.unrealisedPnl);
        const totalPnl = realizedPnl + unrealizedPnl;
        
        console.log(`   Your USDT balance: $${parseFloat(usdtCoin.walletBalance).toFixed(2)}`);
        console.log(`   Total realized P&L: $${realizedPnl.toFixed(2)}`);
        console.log(`   Total unrealized P&L: $${unrealizedPnl.toFixed(2)}`);
        console.log(`   Combined P&L: $${totalPnl.toFixed(2)}`);
        
        if (totalPnl > 0) {
          console.log('   ✅ You are currently profitable');
        } else if (totalPnl < 0) {
          console.log('   ❌ You are currently at a loss');
        } else {
          console.log('   ➖ You are at break-even');
        }
      }
    }
    
    console.log('');
    console.log('🎯 This is your REAL account data from Bybit demo.');
    console.log('   No fake metrics, no lies, just the truth.');
    console.log('=====================================');
    
  } catch (error) {
    console.error('❌ Error checking account:', error.message);
  }
}

// Run the check
checkAccount();
