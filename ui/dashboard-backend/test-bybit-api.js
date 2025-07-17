/**
 * Test Bybit API Integration
 */

const bybitClient = require('./src/utils/bybit-client');

async function testBybitAPI() {
  console.log('🔍 Testing Bybit API Integration...');
  
  try {
    // Test 1: Get ticker data
    console.log('\n📊 Testing Ticker Data...');
    const ticker = await bybitClient.getTicker('BTCUSDT');
    console.log('Ticker Response:', JSON.stringify(ticker, null, 2));
    
    // Test 2: Get kline data
    console.log('\n📈 Testing Kline Data...');
    const klines = await bybitClient.getKlineData({
      symbol: 'BTCUSDT',
      interval: '1h',
      limit: 10
    });
    console.log('Klines Response:', JSON.stringify(klines, null, 2));
    
    // Test 3: Get orderbook data
    console.log('\n📚 Testing Orderbook Data...');
    const orderbook = await bybitClient.getOrderbook({
      symbol: 'BTCUSDT',
      limit: 10
    });
    console.log('Orderbook Response:', JSON.stringify(orderbook, null, 2));
    
    // Test 4: Get all tickers
    console.log('\n📊 Testing All Tickers...');
    const allTickers = await bybitClient.getAllTickers();
    console.log('All Tickers Response (first 3):', JSON.stringify(allTickers?.result?.list?.slice(0, 3), null, 2));
    
  } catch (error) {
    console.error('❌ Error testing Bybit API:', error);
  }
}

testBybitAPI();
