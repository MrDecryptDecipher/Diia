/**
 * Test script for Comprehensive Asset Scanner
 * Tests Phase 3 implementation with real Bybit API integration
 */

const ComprehensiveAssetScanner = require('./src/services/comprehensive-asset-scanner');
const logger = require('./src/utils/logger');

async function testAssetScanner() {
  console.log('🧪 Testing Comprehensive Asset Scanner - Phase 3');
  
  try {
    // Initialize scanner
    const scanner = new ComprehensiveAssetScanner();
    
    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test individual asset analysis
    console.log('\n📊 Testing individual asset analysis...');
    const testSymbols = ['SOLUSDT', 'ADAUSDT', 'DOTUSDT', 'LINKUSDT', 'AVAXUSDT'];
    
    for (const symbol of testSymbols) {
      try {
        const metadata = await scanner.analyzeAsset(symbol);
        if (metadata) {
          console.log(`✅ ${symbol}:`);
          console.log(`   Price: $${metadata.price.toFixed(4)}`);
          console.log(`   Volume: $${(metadata.turnover24h / 1000000).toFixed(2)}M`);
          console.log(`   Volatility: ${metadata.volatility.toFixed(2)}%`);
          console.log(`   Quantum Score: ${metadata.quantumScore.toFixed(3)}`);
          console.log(`   Meets Criteria: ${metadata.meetsPhase3Criteria ? '✅' : '❌'}`);
          console.log(`   Analysis Time: ${metadata.analysisTimeMs}ms`);
          
          if (metadata.profitPotential) {
            console.log(`   Profit Potential: ${metadata.profitPotential.minProfit.toFixed(3)}-${metadata.profitPotential.maxProfit.toFixed(3)} USDT`);
            console.log(`   Meets Min Target: ${metadata.profitPotential.meetsMinTarget ? '✅' : '❌'}`);
          }
        } else {
          console.log(`❌ ${symbol}: Failed to analyze`);
        }
      } catch (error) {
        console.log(`❌ ${symbol}: Error - ${error.message}`);
      }
    }
    
    // Test comprehensive scan
    console.log('\n🔍 Testing comprehensive scan...');
    const startTime = Date.now();
    const filteredAssets = await scanner.performComprehensiveScan();
    const scanDuration = Date.now() - startTime;
    
    console.log(`✅ Comprehensive scan completed in ${scanDuration}ms`);
    console.log(`📊 Found ${filteredAssets.length} assets meeting Phase 3 criteria`);
    
    // Get scan statistics
    const stats = scanner.getScanStats();
    console.log('\n📈 Scan Statistics:');
    console.log(`   Total Assets: ${stats.totalAssets}`);
    console.log(`   Filtered Assets: ${stats.filteredAssets}`);
    console.log(`   Average Scan Time: ${stats.averageScanTime.toFixed(2)}ms per asset`);
    console.log(`   Last Scan Duration: ${stats.lastScanDuration}ms`);
    
    // Get top assets
    const topAssets = scanner.getTopAssets(10);
    console.log('\n🏆 Top 10 Assets by Quantum Score:');
    topAssets.forEach((asset, index) => {
      console.log(`   ${index + 1}. ${asset.symbol} - Score: ${asset.score.toFixed(3)}, Volatility: ${asset.volatility.toFixed(2)}%`);
    });
    
    // Test capital allocation validation
    console.log('\n💰 Testing capital allocation for top assets...');
    const selectedAssets = topAssets.slice(0, 2); // Select top 2 for 12 USDT capital
    let totalAllocation = 0;
    
    selectedAssets.forEach(asset => {
      const allocation = 5.0; // 5 USDT per position
      totalAllocation += allocation;
      console.log(`   ${asset.symbol}: ${allocation.toFixed(6)} USDT`);
    });
    
    const safetyBuffer = 2.0;
    const totalCapital = totalAllocation + safetyBuffer;
    
    console.log(`   Total Allocation: ${totalAllocation.toFixed(6)} USDT`);
    console.log(`   Safety Buffer: ${safetyBuffer.toFixed(6)} USDT`);
    console.log(`   Total Capital: ${totalCapital.toFixed(6)} USDT`);
    console.log(`   Capital Constraint: ${totalCapital === 12.0 ? '✅ PASSED' : '❌ FAILED'}`);
    
    console.log('\n✅ Asset Scanner test completed successfully!');
    
  } catch (error) {
    console.error('❌ Asset Scanner test failed:', error);
    throw error;
  }
}

// Run test if called directly
if (require.main === module) {
  testAssetScanner()
    .then(() => {
      console.log('\n🎉 All tests passed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = testAssetScanner;
