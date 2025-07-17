/**
 * 🧪 Test Bybit API Connection
 * 
 * This will test if we can connect to Bybit with the current API credentials
 */

const { RestClientV5 } = require('bybit-api');
require('dotenv').config();

async function testBybitConnection() {
  console.log('🧪 Testing Bybit API Connection...');
  console.log('API Key:', process.env.BYBIT_API_KEY);
  console.log('Testnet:', process.env.BYBIT_TESTNET);
  
  // Test with testnet first
  const client = new RestClientV5({
    key: process.env.BYBIT_API_KEY,
    secret: process.env.BYBIT_API_SECRET,
    testnet: process.env.BYBIT_TESTNET === 'true'
  });
  
  try {
    console.log('\n📊 Testing market data (no auth required)...');
    const ticker = await client.getTickers({ category: 'linear', symbol: 'BTCUSDT' });
    console.log('✅ Market data works:', ticker.retCode === 0 ? 'SUCCESS' : 'FAILED');
    
    if (ticker.retCode === 0) {
      console.log('📈 BTCUSDT Price:', ticker.result.list[0].lastPrice);
    }
    
    console.log('\n💰 Testing wallet balance (requires auth)...');
    const balance = await client.getWalletBalance({ accountType: 'UNIFIED' });
    console.log('✅ Wallet balance:', balance.retCode === 0 ? 'SUCCESS' : 'FAILED');
    console.log('Response:', balance.retMsg || balance.retCode);
    
    if (balance.retCode === 0) {
      console.log('💰 Account balance:', JSON.stringify(balance.result, null, 2));
    }
    
    console.log('\n📋 Testing positions (requires auth)...');
    const positions = await client.getPositionInfo({ category: 'linear' });
    console.log('✅ Positions:', positions.retCode === 0 ? 'SUCCESS' : 'FAILED');
    console.log('Response:', positions.retMsg || positions.retCode);
    
    if (positions.retCode === 0) {
      console.log('📊 Current positions:', positions.result.list.length);
    }
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
  }
}

testBybitConnection();
