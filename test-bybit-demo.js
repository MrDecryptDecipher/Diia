/**
 * Test script for Bybit Demo API endpoints
 * Tests: P&L, Trade History, Order History, Positions
 */

const crypto = require('crypto');
const https = require('https');

// Demo credentials
const API_KEY = 'VYAE4ZDhqftD7N6C1e';
const API_SECRET = 'BFO3TRwpkUKbWTdSiRCEH8RTJiEbr7KTS4Vj';
const BASE_URL = 'api-demo.bybit.com';

/**
 * Make authenticated request to Bybit Demo API
 */
function makeBybitRequest(endpoint, params = '') {
  return new Promise((resolve, reject) => {
    const timestamp = Date.now().toString();
    const recvWindow = '5000';
    
    // Create signature
    const paramString = timestamp + API_KEY + recvWindow + params;
    const signature = crypto.createHmac('sha256', API_SECRET).update(paramString).digest('hex');
    
    const options = {
      hostname: BASE_URL,
      path: endpoint + (params ? '?' + params : ''),
      method: 'GET',
      headers: {
        'X-BAPI-API-KEY': API_KEY,
        'X-BAPI-SIGN': signature,
        'X-BAPI-TIMESTAMP': timestamp,
        'X-BAPI-RECV-WINDOW': recvWindow,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}`));
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.end();
  });
}

/**
 * Test A: P&L Endpoint
 */
async function testPnL() {
  console.log('\n🔍 === A: TESTING P&L ENDPOINT ===');
  try {
    const response = await makeBybitRequest('/v5/position/closed-pnl', 'category=linear&limit=50');
    console.log('✅ P&L Response:', JSON.stringify(response, null, 2));
    
    if (response.result && response.result.list) {
      console.log(`📊 Found ${response.result.list.length} P&L records`);
      response.result.list.slice(0, 3).forEach((pnl, index) => {
        console.log(`  ${index + 1}. ${pnl.symbol}: ${pnl.closedPnl} USDT (${pnl.side})`);
      });
    }
  } catch (error) {
    console.error('❌ P&L Error:', error.message);
  }
}

/**
 * Test B: Trade History Endpoint
 */
async function testTradeHistory() {
  console.log('\n🔍 === B: TESTING TRADE HISTORY ENDPOINT ===');
  try {
    const response = await makeBybitRequest('/v5/execution/list', 'category=linear&limit=50');
    console.log('✅ Trade History Response:', JSON.stringify(response, null, 2));
    
    if (response.result && response.result.list) {
      console.log(`📈 Found ${response.result.list.length} trade records`);
      response.result.list.slice(0, 3).forEach((trade, index) => {
        console.log(`  ${index + 1}. ${trade.symbol}: ${trade.qty} @ ${trade.execPrice} (${trade.side})`);
      });
    }
  } catch (error) {
    console.error('❌ Trade History Error:', error.message);
  }
}

/**
 * Test C: Order History Endpoint
 */
async function testOrderHistory() {
  console.log('\n🔍 === C: TESTING ORDER HISTORY ENDPOINT ===');
  try {
    const response = await makeBybitRequest('/v5/order/history', 'category=linear&limit=50');
    console.log('✅ Order History Response:', JSON.stringify(response, null, 2));
    
    if (response.result && response.result.list) {
      console.log(`📋 Found ${response.result.list.length} order records`);
      response.result.list.slice(0, 3).forEach((order, index) => {
        console.log(`  ${index + 1}. ${order.symbol}: ${order.qty} @ ${order.price} (${order.orderStatus})`);
      });
    }
  } catch (error) {
    console.error('❌ Order History Error:', error.message);
  }
}

/**
 * Test D: Positions Endpoint
 */
async function testPositions() {
  console.log('\n🔍 === D: TESTING POSITIONS ENDPOINT ===');
  try {
    const response = await makeBybitRequest('/v5/position/list', 'category=linear');
    console.log('✅ Positions Response:', JSON.stringify(response, null, 2));
    
    if (response.result && response.result.list) {
      console.log(`🎯 Found ${response.result.list.length} position records`);
      
      // Filter only positions with size > 0
      const activePositions = response.result.list.filter(pos => parseFloat(pos.size) > 0);
      console.log(`🔥 Active positions: ${activePositions.length}`);
      
      activePositions.forEach((pos, index) => {
        const unrealizedPnl = parseFloat(pos.unrealisedPnl);
        const positionValue = parseFloat(pos.positionValue);
        const leverage = pos.leverage;
        
        console.log(`  ${index + 1}. ${pos.symbol}:`);
        console.log(`     Size: ${pos.size} (${pos.side})`);
        console.log(`     Value: ${positionValue} USDT`);
        console.log(`     Leverage: ${leverage}x`);
        console.log(`     PnL: ${unrealizedPnl} USDT`);
        console.log(`     Entry: ${pos.avgPrice}`);
        console.log(`     Mark: ${pos.markPrice}`);
      });
      
      // Calculate total capital usage
      const totalValue = activePositions.reduce((sum, pos) => sum + parseFloat(pos.positionValue), 0);
      console.log(`\n💰 TOTAL CAPITAL USAGE: ${totalValue.toFixed(2)} USDT`);
      console.log(`🎯 12 USDT LIMIT CHECK: ${totalValue > 12 ? '❌ EXCEEDED' : '✅ WITHIN LIMIT'}`);
    }
  } catch (error) {
    console.error('❌ Positions Error:', error.message);
  }
}

/**
 * Test Account Balance
 */
async function testAccountBalance() {
  console.log('\n🔍 === TESTING ACCOUNT BALANCE ===');
  try {
    const response = await makeBybitRequest('/v5/account/wallet-balance', 'accountType=UNIFIED');
    console.log('✅ Account Balance Response:', JSON.stringify(response, null, 2));
    
    if (response.result && response.result.list && response.result.list[0]) {
      const account = response.result.list[0];
      console.log(`💳 Account Type: ${account.accountType}`);
      console.log(`💰 Total Equity: ${account.totalEquity} USDT`);
      console.log(`💵 Available Balance: ${account.totalAvailableBalance} USDT`);
      console.log(`📊 Total Margin Balance: ${account.totalMarginBalance} USDT`);
      console.log(`⚠️  Total Initial Margin: ${account.totalInitialMargin} USDT`);
    }
  } catch (error) {
    console.error('❌ Account Balance Error:', error.message);
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 STARTING BYBIT DEMO API TESTS...');
  console.log('📡 Base URL:', BASE_URL);
  console.log('🔑 API Key:', API_KEY.substring(0, 8) + '...');
  
  await testAccountBalance();
  await testPositions();
  await testPnL();
  await testTradeHistory();
  await testOrderHistory();
  
  console.log('\n✅ ALL TESTS COMPLETED!');
}

// Run tests
runAllTests().catch(console.error);
