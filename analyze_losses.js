/**
 * ANALYZE WHY YOU'RE LOSING MONEY
 * 
 * This script analyzes your trading history to understand the losses
 */

const { RestClientV5 } = require('bybit-api');
const fs = require('fs');

// Load credentials
const envContent = fs.readFileSync('./demo.env', 'utf8');
const lines = envContent.split('\n');
const apiKey = lines.find(line => line.startsWith('BYBIT_DEMO_API_KEY=')).split('=')[1];
const apiSecret = lines.find(line => line.startsWith('BYBIT_DEMO_API_SECRET=')).split('=')[1];

const client = new RestClientV5({
  key: apiKey,
  secret: apiSecret,
  demoTrading: true
});

async function analyzeLosses() {
  console.log('🔍 ANALYZING WHY YOU\'RE LOSING MONEY');
  console.log('=====================================');
  
  try {
    // Get more trade history
    const tradesResponse = await client.getExecutionList({ 
      category: 'linear', 
      limit: 200 // Get more trades to analyze
    });
    
    if (tradesResponse.retCode !== 0) {
      console.log(`❌ Failed to get trades: ${tradesResponse.retMsg}`);
      return;
    }
    
    const trades = tradesResponse.result.list;
    console.log(`📊 Analyzing ${trades.length} recent trades...`);
    console.log('');
    
    // Group trades by symbol to analyze patterns
    const symbolStats = {};
    let totalFees = 0;
    let totalValue = 0;
    
    trades.forEach(trade => {
      const symbol = trade.symbol;
      const fee = parseFloat(trade.execFee);
      const value = parseFloat(trade.execValue);
      
      totalFees += fee;
      totalValue += value;
      
      if (!symbolStats[symbol]) {
        symbolStats[symbol] = {
          trades: 0,
          totalFees: 0,
          totalValue: 0,
          buyTrades: 0,
          sellTrades: 0
        };
      }
      
      symbolStats[symbol].trades++;
      symbolStats[symbol].totalFees += fee;
      symbolStats[symbol].totalValue += value;
      
      if (trade.side === 'Buy') {
        symbolStats[symbol].buyTrades++;
      } else {
        symbolStats[symbol].sellTrades++;
      }
    });
    
    // Analyze the problems
    console.log('🚨 PROBLEMS IDENTIFIED:');
    console.log('');
    
    // Problem 1: Excessive fees
    const feePercentage = (totalFees / totalValue) * 100;
    console.log(`💸 EXCESSIVE TRADING FEES:`);
    console.log(`   Total fees paid: $${totalFees.toFixed(2)}`);
    console.log(`   Total trade value: $${totalValue.toFixed(2)}`);
    console.log(`   Fee percentage: ${feePercentage.toFixed(3)}%`);
    
    if (feePercentage > 0.1) {
      console.log(`   ❌ PROBLEM: Fee percentage is too high!`);
      console.log(`   💡 SOLUTION: Reduce trading frequency or increase position sizes`);
    }
    console.log('');
    
    // Problem 2: Over-trading
    const avgTradeValue = totalValue / trades.length;
    console.log(`🔄 OVER-TRADING ANALYSIS:`);
    console.log(`   Total trades: ${trades.length}`);
    console.log(`   Average trade value: $${avgTradeValue.toFixed(2)}`);
    
    if (avgTradeValue < 500) {
      console.log(`   ❌ PROBLEM: Trade sizes are too small!`);
      console.log(`   💡 SOLUTION: Make fewer, larger trades`);
    }
    console.log('');
    
    // Problem 3: No clear strategy
    console.log(`📈 TRADING PATTERN ANALYSIS:`);
    const topSymbols = Object.entries(symbolStats)
      .sort((a, b) => b[1].trades - a[1].trades)
      .slice(0, 10);
    
    topSymbols.forEach(([symbol, stats]) => {
      const buyPercent = (stats.buyTrades / stats.trades) * 100;
      console.log(`   ${symbol}: ${stats.trades} trades (${buyPercent.toFixed(0)}% buys, ${(100-buyPercent).toFixed(0)}% sells)`);
    });
    
    // Check for random trading
    const hasRandomPattern = topSymbols.some(([symbol, stats]) => {
      const buyPercent = (stats.buyTrades / stats.trades) * 100;
      return buyPercent > 40 && buyPercent < 60; // Too balanced = random
    });
    
    if (hasRandomPattern) {
      console.log(`   ❌ PROBLEM: Trading appears random (no clear direction)`);
      console.log(`   💡 SOLUTION: Develop a clear strategy with entry/exit rules`);
    }
    console.log('');
    
    // Problem 4: All trades same size
    const tradeSizes = trades.map(t => parseFloat(t.execValue));
    const avgSize = tradeSizes.reduce((a, b) => a + b, 0) / tradeSizes.length;
    const sizeVariance = tradeSizes.reduce((sum, size) => sum + Math.pow(size - avgSize, 2), 0) / tradeSizes.length;
    const sizeStdDev = Math.sqrt(sizeVariance);
    
    console.log(`📏 POSITION SIZING ANALYSIS:`);
    console.log(`   Average trade size: $${avgSize.toFixed(2)}`);
    console.log(`   Size standard deviation: $${sizeStdDev.toFixed(2)}`);
    
    if (sizeStdDev < 10) {
      console.log(`   ❌ PROBLEM: All trades are the same size (~$294)`);
      console.log(`   💡 SOLUTION: Use dynamic position sizing based on confidence`);
    }
    console.log('');
    
    console.log('=====================================');
    console.log('🎯 RECOMMENDED FIXES:');
    console.log('');
    console.log('1. 📉 REDUCE TRADING FREQUENCY');
    console.log('   - Stop making trades every few seconds');
    console.log('   - Wait for high-probability setups');
    console.log('   - Target 5-10 trades per day maximum');
    console.log('');
    console.log('2. 📈 INCREASE POSITION SIZES');
    console.log('   - Use $1000+ per trade instead of $294');
    console.log('   - This reduces fee impact');
    console.log('   - Better risk/reward ratio');
    console.log('');
    console.log('3. 🎯 DEVELOP REAL STRATEGY');
    console.log('   - Use technical analysis (RSI, MACD, etc.)');
    console.log('   - Set clear entry and exit rules');
    console.log('   - Stop random buy/sell decisions');
    console.log('');
    console.log('4. 🛡️ IMPLEMENT RISK MANAGEMENT');
    console.log('   - Set stop-losses at 2-3%');
    console.log('   - Take profits at 1-2%');
    console.log('   - Never risk more than 5% per trade');
    console.log('');
    console.log('5. 📊 FOCUS ON HIGH-VOLUME PAIRS');
    console.log('   - Trade BTCUSDT, ETHUSDT, SOLUSDT');
    console.log('   - Avoid low-volume altcoins');
    console.log('   - Better liquidity = better fills');
    console.log('');
    console.log('=====================================');
    
  } catch (error) {
    console.error('❌ Error analyzing losses:', error.message);
  }
}

analyzeLosses();
