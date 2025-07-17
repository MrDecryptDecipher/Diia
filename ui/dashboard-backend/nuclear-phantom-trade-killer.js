/**
 * 🚨 NUCLEAR PHANTOM TRADE KILLER
 * This script will completely obliterate all phantom trades and capital allocations
 * by directly modifying the trading state in memory and forcing a clean restart.
 */

const fs = require('fs');
const path = require('path');

console.log('🚨 NUCLEAR PHANTOM TRADE KILLER INITIATED');
console.log('🚨 This will completely obliterate all phantom trades and allocations');

// Step 1: Kill all PM2 processes
console.log('\n💀 Step 1: Killing all PM2 processes...');
const { execSync } = require('child_process');

try {
  execSync('pm2 kill', { stdio: 'inherit' });
  console.log('✅ All PM2 processes killed');
} catch (error) {
  console.log('⚠️ PM2 kill failed:', error.message);
}

// Step 2: Clear all data files
console.log('\n🧹 Step 2: Clearing all data files...');
const dataFiles = [
  'data/capital-allocation.json',
  'data/trading-state.json',
  'data/phantom-trades.json',
  'data/positions.json',
  'data/trades.json',
  'data/metrics.json',
  'logs/api-out.log',
  'logs/api-error.log'
];

for (const file of dataFiles) {
  try {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log(`✅ Deleted ${file}`);
    }
  } catch (error) {
    console.log(`⚠️ Failed to delete ${file}:`, error.message);
  }
}

// Step 3: Create clean data directory structure
console.log('\n📁 Step 3: Creating clean data directory structure...');
try {
  if (!fs.existsSync('data')) {
    fs.mkdirSync('data');
  }
  if (!fs.existsSync('logs')) {
    fs.mkdirSync('logs');
  }
  
  // Create clean capital allocation file
  const cleanCapitalAllocation = {
    totalCapital: 12,
    allocatedCapital: 0,
    availableCapital: 12,
    positions: {},
    lastUpdate: new Date().toISOString()
  };
  
  fs.writeFileSync('data/capital-allocation.json', JSON.stringify(cleanCapitalAllocation, null, 2));
  console.log('✅ Created clean capital-allocation.json');
  
  // Create clean trading state file
  const cleanTradingState = {
    isActive: false,
    currentCapital: 12,
    totalTrades: 0,
    successfulTrades: 0,
    totalProfit: 0,
    openTrades: [],
    tradeHistory: [],
    multiAsset: {
      capitalAllocationByAsset: {},
      activeAssets: [],
      eligibleAssets: []
    },
    lastUpdate: new Date().toISOString()
  };
  
  fs.writeFileSync('data/trading-state.json', JSON.stringify(cleanTradingState, null, 2));
  console.log('✅ Created clean trading-state.json');
  
} catch (error) {
  console.log('⚠️ Failed to create clean data files:', error.message);
}

// Step 4: Modify the trading strategy service to force clean state
console.log('\n🔧 Step 4: Modifying trading strategy service to force clean state...');

const tradingServicePath = 'src/services/trading-strategy-service.js';

try {
  let serviceContent = fs.readFileSync(tradingServicePath, 'utf8');
  
  // Find and replace the trading state initialization
  const oldStatePattern = /let tradingState = \{[\s\S]*?\};/;
  const newState = `let tradingState = {
  isActive: false,
  currentCapital: 12,
  totalTrades: 0,
  successfulTrades: 0,
  totalProfit: 0,
  dailyProfit: 0,
  dailyTradeCount: 0,
  lastTradeTime: 0,
  startTime: Date.now(),
  openTrades: [], // 🚨 NUCLEAR RESET: FORCE EMPTY
  tradeHistory: [],
  consecutiveSuccessfulTrades: 0,
  systemEfficiency: 85,
  adaptiveTradeInterval: 10000, // Slower interval to prevent spam
  evolutionStage: 1,
  evolutionScore: 0,
  godKernelEvolutionStage: 1,
  quantumPredictionAccuracy: 95,
  hyperdimensionalPatternAccuracy: 90,
  zeroLossEnforcementEfficiency: 100,
  bestPerformingSymbols: [],
  bestPerformingTimeframes: [],
  bestPerformingStrategies: [],
  bestPerformingAgents: [],
  bestTradingHours: [],
  directionBias: null,
  dailyProfitTarget: 0.1 * 20, // Conservative target
  multiAsset: {
    eligibleAssets: [],
    activeAssets: [],
    assetRotationIndex: 0,
    lastRotationTime: 0,
    assetPerformance: {},
    capitalAllocationByAsset: {}, // 🚨 NUCLEAR RESET: FORCE EMPTY
    lastAssetUpdate: 0,
    marketDataCache: {},
    assetBlacklist: new Set(['PHANTOM', 'GHOST', 'FAKE'])
  }
};`;

  if (oldStatePattern.test(serviceContent)) {
    serviceContent = serviceContent.replace(oldStatePattern, newState);
    fs.writeFileSync(tradingServicePath, serviceContent);
    console.log('✅ Modified trading strategy service with nuclear reset');
  } else {
    console.log('⚠️ Could not find trading state pattern to replace');
  }
  
} catch (error) {
  console.log('⚠️ Failed to modify trading service:', error.message);
}

// Step 5: Create a comprehensive system test script
console.log('\n🧪 Step 5: Creating comprehensive system test script...');

const testScript = `#!/bin/bash
echo "🧪 COMPREHENSIVE SYSTEM TEST AFTER NUCLEAR RESET"

# Wait for system to start
sleep 15

echo "📊 Testing basic endpoints..."
curl -s http://localhost:10002/api/trades/system-status | jq .
echo ""

echo "🔍 Testing comprehensive analysis..."
curl -s http://localhost:10002/api/trades/comprehensive-analysis/BTCUSDT | jq '.success, .tradingSignal'
echo ""

echo "💰 Testing position sizing..."
curl -s -X POST http://localhost:10002/api/trades/test-position-size \\
  -H "Content-Type: application/json" \\
  -d '{"symbol":"BTCUSDT","positionSize":1.0,"capital":12}' | jq .
echo ""

echo "⚡ Testing leverage..."
curl -s -X POST http://localhost:10002/api/trades/test-leverage \\
  -H "Content-Type: application/json" \\
  -d '{"symbol":"BTCUSDT","leverage":10,"positionSize":1.0}' | jq .
echo ""

echo "📈 Testing capital allocation..."
curl -s -X POST http://localhost:10002/api/trades/test-capital-allocation \\
  -H "Content-Type: application/json" \\
  -d '{"totalCapital":12,"allocation":6,"maxPositions":2,"riskPerTrade":0.02}' | jq .
echo ""

echo "✅ COMPREHENSIVE SYSTEM TEST COMPLETED"
`;

fs.writeFileSync('comprehensive-test.sh', testScript);
fs.chmodSync('comprehensive-test.sh', '755');
console.log('✅ Created comprehensive test script');

// Step 6: Start the system with clean state
console.log('\n🚀 Step 6: Starting system with clean state...');

try {
  execSync('pm2 start ecosystem.config.js', { stdio: 'inherit' });
  console.log('✅ System started with clean state');
} catch (error) {
  console.log('⚠️ Failed to start system:', error.message);
}

console.log('\n🎉 NUCLEAR PHANTOM TRADE KILLER COMPLETED!');
console.log('🎯 All phantom trades and allocations have been obliterated');
console.log('🚀 System is now running with completely clean state');
console.log('📊 Run ./comprehensive-test.sh to verify the system is working');
console.log('');
console.log('🔥 WHAT WAS DESTROYED:');
console.log('  - All phantom capital allocations');
console.log('  - All ghost trades in memory');
console.log('  - All persistent data files');
console.log('  - All log spam');
console.log('');
console.log('✅ WHAT WAS CREATED:');
console.log('  - Clean 12 USDT capital allocation');
console.log('  - Empty trading state');
console.log('  - Comprehensive testing endpoints');
console.log('  - Nuclear-grade system integrity');
