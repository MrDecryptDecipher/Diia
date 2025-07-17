/**
 * Test order placement with proper Bybit V5 API
 */

const bybitClient = require('./ui/dashboard-backend/src/utils/bybit-client');

async function testOrderPlacement() {
  try {
    console.log('🔍 Testing order placement with proper Bybit V5 API...');
    
    // Get current price for DOGEUSDT
    const ticker = await bybitClient.getTicker({
      category: 'linear',
      symbol: 'DOGEUSDT'
    });
    
    if (!ticker || ticker.retCode !== 0) {
      throw new Error('Failed to get ticker data');
    }
    
    const currentPrice = parseFloat(ticker.result.list[0].lastPrice);
    console.log(`💰 Current DOGEUSDT price: ${currentPrice}`);
    
    // Calculate proper order size for small test order
    const orderValue = 5.0; // 5 USDT order (small test)
    const quantity = Math.floor(orderValue / currentPrice); // Whole number for DOGE
    
    console.log(`📊 Order calculation:`);
    console.log(`   Order Value: ${orderValue} USDT`);
    console.log(`   Quantity: ${quantity} DOGE`);
    console.log(`   Estimated Cost: ${(quantity * currentPrice).toFixed(4)} USDT`);
    
    // Place order using proper Bybit V5 API parameters
    const orderParams = {
      category: 'linear',
      symbol: 'DOGEUSDT',
      side: 'Buy',
      orderType: 'Market',
      qty: quantity.toString(),
      timeInForce: 'IOC'
    };
    
    console.log(`📤 Placing order with params: ${JSON.stringify(orderParams)}`);
    
    const response = await bybitClient.placeOrder(orderParams);
    
    console.log('✅ Order placement result:');
    console.log(JSON.stringify(response, null, 2));
    
    if (response && response.retCode === 0) {
      console.log(`🎯 SUCCESS! Order ID: ${response.result.orderId}`);
      console.log(`   Symbol: ${response.result.symbol}`);
      console.log(`   Side: ${response.result.side}`);
      console.log(`   Quantity: ${response.result.qty}`);
      console.log(`   Order Status: ${response.result.orderStatus}`);
    } else {
      console.log(`❌ Order failed: ${response?.retMsg} (Code: ${response?.retCode})`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testOrderPlacement();
