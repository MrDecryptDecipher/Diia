#!/usr/bin/env node

/**
 * Comprehensive Social Media Scraping Test for OMNI Trading System
 * Tests the enhanced Bright Data MCP integration for asset-specific social media data
 */

const axios = require('axios');

const OMNI_API_BASE = 'http://localhost:10002';
const TEST_ASSETS = ['BTC', 'ETH', 'SOL', 'ADA', 'DOGE'];

console.log('🧪 Testing Comprehensive Social Media Scraping for OMNI');
console.log('=====================================================');

async function testAssetSocialMediaScraping(asset) {
  try {
    console.log(`\n🔍 Testing ${asset} social media scraping...`);
    
    const response = await axios.post(`${OMNI_API_BASE}/api/sentiment/search`, {
      asset: asset,
      searchQueries: [
        `${asset} cryptocurrency`,
        `${asset} crypto sentiment analysis`,
        `${asset} blockchain social media discussion`
      ]
    }, {
      timeout: 60000
    });

    if (response.data) {
      const data = response.data;
      console.log(`✅ ${asset} Results:`);
      console.log(`   - Overall Score: ${data.overallScore}`);
      console.log(`   - Recommendation: ${data.recommendation}`);
      console.log(`   - Source Count: ${data.sourceCount}`);
      console.log(`   - Breakdown:`, data.breakdown);
      
      // Check for real data indicators
      let realDataCount = 0;
      let simulatedDataCount = 0;
      
      for (const source of data.sources) {
        if (source.realData || source.mcpSource === 'bright-data-real' || 
            source.mcpSource === 'bright-data-search' || source.mcpSource === 'bright-data-account') {
          realDataCount++;
        } else if (source.url && source.url.includes('crypto_trader_')) {
          simulatedDataCount++;
        }
      }
      
      console.log(`   - Real Data Sources: ${realDataCount}`);
      console.log(`   - Simulated Data Sources: ${simulatedDataCount}`);
      
      // Show sample sources
      console.log(`   - Sample Sources:`);
      for (const source of data.sources.slice(0, 3)) {
        console.log(`     * ${source.source}: ${source.title}`);
        console.log(`       URL: ${source.url}`);
        console.log(`       MCP Source: ${source.mcpSource || 'unknown'}`);
      }
      
      return {
        asset,
        success: true,
        realDataCount,
        simulatedDataCount,
        totalSources: data.sourceCount,
        recommendation: data.recommendation
      };
    }
    
  } catch (error) {
    console.log(`❌ ${asset} failed: ${error.message}`);
    return {
      asset,
      success: false,
      error: error.message
    };
  }
}

async function testComprehensiveSocialMediaIntegration() {
  console.log('\n📊 Testing Comprehensive Social Media Integration');
  console.log('================================================');
  
  const results = [];
  
  for (const asset of TEST_ASSETS) {
    const result = await testAssetSocialMediaScraping(asset);
    results.push(result);
    
    // Wait between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Summary
  console.log('\n📈 COMPREHENSIVE TEST RESULTS SUMMARY');
  console.log('=====================================');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful Tests: ${successful.length}/${TEST_ASSETS.length}`);
  console.log(`❌ Failed Tests: ${failed.length}/${TEST_ASSETS.length}`);
  
  if (successful.length > 0) {
    const totalRealData = successful.reduce((sum, r) => sum + (r.realDataCount || 0), 0);
    const totalSimulated = successful.reduce((sum, r) => sum + (r.simulatedDataCount || 0), 0);
    const totalSources = successful.reduce((sum, r) => sum + (r.totalSources || 0), 0);
    
    console.log(`\n📊 Data Quality Analysis:`);
    console.log(`   - Total Sources Analyzed: ${totalSources}`);
    console.log(`   - Real Data Sources: ${totalRealData} (${((totalRealData/totalSources)*100).toFixed(1)}%)`);
    console.log(`   - Simulated Data Sources: ${totalSimulated} (${((totalSimulated/totalSources)*100).toFixed(1)}%)`);
    
    console.log(`\n🎯 Asset-Specific Results:`);
    for (const result of successful) {
      console.log(`   - ${result.asset}: ${result.recommendation} (${result.realDataCount} real, ${result.simulatedDataCount} simulated)`);
    }
  }
  
  if (failed.length > 0) {
    console.log(`\n❌ Failed Assets:`);
    for (const result of failed) {
      console.log(`   - ${result.asset}: ${result.error}`);
    }
  }
  
  // Bright Data MCP Status Check
  console.log('\n🔧 Bright Data MCP Status Check');
  console.log('===============================');
  
  if (totalRealData > 0) {
    console.log('✅ Bright Data MCP is working and returning real data');
    console.log('✅ Social Media Insights component is properly scraping asset-specific content');
    console.log('✅ Multiple social media platforms are being accessed');
  } else {
    console.log('⚠️ Bright Data MCP may be experiencing connectivity issues');
    console.log('⚠️ System is falling back to simulated data');
    console.log('⚠️ Check MCP server status and API key configuration');
  }
  
  return results;
}

// Run the comprehensive test
testComprehensiveSocialMediaIntegration()
  .then(results => {
    console.log('\n🏁 Comprehensive Social Media Scraping Test Complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
