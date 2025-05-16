/**
 * Test script for Bybit client
 * 
 * This script tests the Bybit client implementation by making API calls
 * and logging the results.
 */

const bybitClient = require('./src/utils/bybit-client');

async function testBybitClient() {
  console.log('Testing Bybit client...');
  
  try {
    // Test wallet balance
    console.log('\nTesting wallet balance...');
    const walletBalance = await bybitClient.getWalletBalance();
    console.log('Wallet balance response:', JSON.stringify(walletBalance, null, 2));
    
    // Test symbols
    console.log('\nTesting symbols...');
    const symbols = await bybitClient.getSymbols();
    console.log('Symbols count:', symbols.result?.list?.length || 0);
    if (symbols.result?.list?.length > 0) {
      console.log('First 5 symbols:', symbols.result.list.slice(0, 5).map(s => s.symbol));
    }
    
    // Test ticker
    console.log('\nTesting ticker for BTCUSDT...');
    const ticker = await bybitClient.getTicker('BTCUSDT');
    console.log('Ticker response:', JSON.stringify(ticker, null, 2));
    
    // Test all tickers
    console.log('\nTesting all tickers...');
    const allTickers = await bybitClient.getAllTickers();
    console.log('All tickers count:', allTickers.result?.list?.length || 0);
    
    // Test positions
    console.log('\nTesting positions...');
    const positions = await bybitClient.getPositions();
    console.log('Positions response:', JSON.stringify(positions, null, 2));
    
    // Test open orders
    console.log('\nTesting open orders...');
    const openOrders = await bybitClient.getOpenOrders();
    console.log('Open orders response:', JSON.stringify(openOrders, null, 2));
    
    // Test order history
    console.log('\nTesting order history...');
    const orderHistory = await bybitClient.getOrderHistory();
    console.log('Order history response:', JSON.stringify(orderHistory, null, 2));
    
    // Test execution history
    console.log('\nTesting execution history...');
    const executionHistory = await bybitClient.getExecutionHistory();
    console.log('Execution history response:', JSON.stringify(executionHistory, null, 2));
    
    // Test requesting demo funds
    console.log('\nTesting request demo funds...');
    const demoFunds = await bybitClient.requestDemoFunds('USDT', '100');
    console.log('Demo funds response:', JSON.stringify(demoFunds, null, 2));
    
    console.log('\nAll tests completed!');
  } catch (error) {
    console.error('Error testing Bybit client:', error);
  }
}

testBybitClient();
