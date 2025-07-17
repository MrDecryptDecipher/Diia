/**
 * Test OMNI-guided trade execution
 */

// Set up environment
process.env.NODE_ENV = 'demo';
process.env.BYBIT_API_KEY = 'VYAE4ZDhqftD7N6C1e';
process.env.BYBIT_API_SECRET = 'BFO3TRwpkUKbWTdSiRCEH8RTJiEbr7KTS4Vj';
process.env.BYBIT_TESTNET = 'true';

const logger = require('./ui/dashboard-backend/src/utils/logger');
const bybitClient = require('./ui/dashboard-backend/src/utils/bybit-client');
const omniSystem = require('./ui/dashboard-backend/src/services/omni-comprehensive-system');

async function testOmniGuidedTrade() {
  try {
    console.log('🚀 Testing OMNI-guided trade execution...');
    
    // Start OMNI system
    await omniSystem.start();
    console.log('✅ OMNI system started');
    
    // Run OMNI analysis on DOGEUSDT
    const symbol = 'DOGEUSDT';
    console.log(`🔬 Running OMNI comprehensive analysis on ${symbol}...`);
    
    const analysis = await omniSystem.performComprehensiveAnalysis(symbol);
    
    console.log('📊 OMNI Analysis Results:');
    console.log(`   Signal: ${analysis.comprehensiveScore?.signal} (${(analysis.comprehensiveScore?.confidence * 100).toFixed(1)}%)`);
    console.log(`   Trading Signal: ${analysis.tradingSignal}`);
    console.log(`   Execution Time: ${analysis.executionTime}`);
    console.log(`   Components: ${Object.keys(analysis).length} OMNI components`);
    
    // Check if signal is strong enough (85%+)
    if (analysis.comprehensiveScore && analysis.comprehensiveScore.confidence >= 0.85) {
      console.log(`🎯 STRONG OMNI SIGNAL DETECTED! Proceeding with trade...`);
      
      // Get current price
      const ticker = await bybitClient.getTicker({
        category: 'linear',
        symbol: symbol
      });
      
      const currentPrice = parseFloat(ticker.result.list[0].lastPrice);
      console.log(`💰 Current ${symbol} price: ${currentPrice}`);
      
      // Calculate order size (1 USDT order)
      const orderValue = 1.0;
      const quantity = Math.floor(orderValue / currentPrice);
      
      console.log(`📊 Order calculation:`);
      console.log(`   Order Value: ${orderValue} USDT`);
      console.log(`   Quantity: ${quantity} ${symbol.replace('USDT', '')}`);
      console.log(`   Estimated Cost: ${(quantity * currentPrice).toFixed(4)} USDT`);
      
      // Place OMNI-guided order
      const orderParams = {
        category: 'linear',
        symbol: symbol,
        side: analysis.comprehensiveScore.signal === 'BUY' ? 'Buy' : 'Sell',
        orderType: 'Market',
        qty: quantity.toString(),
        timeInForce: 'IOC'
      };
      
      console.log(`📤 Placing OMNI-guided order: ${JSON.stringify(orderParams)}`);
      
      const response = await bybitClient.placeOrder(orderParams);
      
      console.log('✅ OMNI-guided order result:');
      console.log(JSON.stringify(response, null, 2));
      
      if (response && response.retCode === 0) {
        console.log(`🎯 SUCCESS! OMNI-guided trade executed!`);
        console.log(`   Order ID: ${response.result.orderId}`);
        console.log(`   Symbol: ${symbol}`);
        console.log(`   Side: ${orderParams.side}`);
        console.log(`   Quantity: ${quantity}`);
        console.log(`   OMNI Confidence: ${(analysis.comprehensiveScore.confidence * 100).toFixed(1)}%`);
        console.log(`   OMNI Signal: ${analysis.tradingSignal}`);
        
        // Calculate target profit for 0.6 USDT
        const targetProfitPercent = (0.6 / orderValue) * 100; // 60% profit target
        console.log(`   Target Profit: 0.6 USDT (${targetProfitPercent}% price movement needed)`);
        
      } else {
        console.log(`❌ OMNI-guided trade failed: ${response?.retMsg} (Code: ${response?.retCode})`);
      }
      
    } else {
      console.log(`📊 OMNI signal not strong enough: ${(analysis.comprehensiveScore?.confidence * 100).toFixed(1)}% (need 85%+)`);
    }
    
    // Stop OMNI system
    await omniSystem.stop();
    console.log('✅ OMNI system stopped');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testOmniGuidedTrade();
