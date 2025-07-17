#!/usr/bin/env node

/**
 * Test script for Bright Data MCP integration
 * This script tests the real Bright Data MCP tools to ensure they're working correctly
 */

const { spawn } = require('child_process');

// Test configuration
const BRIGHT_DATA_KEY = '0ce87743-dd43-4c21-9578-96728550b6f2';
const TEST_ASSET = 'BTC';

console.log('🧪 Testing Bright Data MCP Integration');
console.log('=====================================');

/**
 * Test Bright Data MCP search_engine tool
 */
async function testSearchEngine() {
  return new Promise((resolve, reject) => {
    console.log('\n🔍 Testing search_engine tool...');
    
    const brightData = spawn('npx', [
      '-y',
      '@smithery/cli@latest',
      'run',
      '@luminati-io/brightdata-mcp',
      '--key',
      BRIGHT_DATA_KEY
    ], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd()
    });

    let output = '';
    let error = '';

    brightData.stdout.on('data', (data) => {
      output += data.toString();
    });

    brightData.stderr.on('data', (data) => {
      error += data.toString();
    });

    brightData.on('close', (code) => {
      if (output.trim()) {
        try {
          const lines = output.split('\n').filter(line => line.trim());
          for (const line of lines) {
            try {
              const parsed = JSON.parse(line);
              if (parsed.result && parsed.result.content) {
                console.log('✅ search_engine tool working correctly');
                console.log(`   Found ${parsed.result.content.length} results`);
                resolve(true);
                return;
              }
            } catch (parseError) {
              continue;
            }
          }
          console.log('⚠️ search_engine tool returned data but no valid results');
          resolve(false);
        } catch (parseError) {
          console.log('❌ search_engine tool failed to parse response');
          resolve(false);
        }
      } else {
        console.log(`❌ search_engine tool failed with code ${code}: ${error}`);
        resolve(false);
      }
    });

    brightData.on('error', (err) => {
      console.log(`❌ search_engine tool spawn error: ${err.message}`);
      resolve(false);
    });

    // Send MCP request for search
    const mcpRequest = {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "search_engine",
        arguments: {
          query: `${TEST_ASSET} cryptocurrency latest news`,
          engine: "google"
        }
      }
    };

    brightData.stdin.write(JSON.stringify(mcpRequest) + '\n');
    brightData.stdin.end();

    // Timeout after 30 seconds
    setTimeout(() => {
      brightData.kill();
      console.log('⏰ search_engine tool timeout after 30 seconds');
      resolve(false);
    }, 30000);
  });
}

/**
 * Test Bright Data MCP web_data_x_posts tool
 */
async function testTwitterPosts() {
  return new Promise((resolve, reject) => {
    console.log('\n🐦 Testing web_data_x_posts tool...');
    
    const brightData = spawn('npx', [
      '-y',
      '@smithery/cli@latest',
      'run',
      '@luminati-io/brightdata-mcp',
      '--key',
      BRIGHT_DATA_KEY
    ], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd()
    });

    let output = '';
    let error = '';

    brightData.stdout.on('data', (data) => {
      output += data.toString();
    });

    brightData.stderr.on('data', (data) => {
      error += data.toString();
    });

    brightData.on('close', (code) => {
      if (output.trim()) {
        try {
          const lines = output.split('\n').filter(line => line.trim());
          for (const line of lines) {
            try {
              const parsed = JSON.parse(line);
              if (parsed.result) {
                console.log('✅ web_data_x_posts tool working correctly');
                resolve(true);
                return;
              }
            } catch (parseError) {
              continue;
            }
          }
          console.log('⚠️ web_data_x_posts tool returned data but no valid results');
          resolve(false);
        } catch (parseError) {
          console.log('❌ web_data_x_posts tool failed to parse response');
          resolve(false);
        }
      } else {
        console.log(`❌ web_data_x_posts tool failed with code ${code}: ${error}`);
        resolve(false);
      }
    });

    brightData.on('error', (err) => {
      console.log(`❌ web_data_x_posts tool spawn error: ${err.message}`);
      resolve(false);
    });

    // Send MCP request for Twitter posts
    const mcpRequest = {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "web_data_x_posts",
        arguments: {
          url: "https://x.com/bitcoin"
        }
      }
    };

    brightData.stdin.write(JSON.stringify(mcpRequest) + '\n');
    brightData.stdin.end();

    // Timeout after 30 seconds
    setTimeout(() => {
      brightData.kill();
      console.log('⏰ web_data_x_posts tool timeout after 30 seconds');
      resolve(false);
    }, 30000);
  });
}

/**
 * Test Bright Data MCP web_data_reddit_posts tool
 */
async function testRedditPosts() {
  return new Promise((resolve, reject) => {
    console.log('\n🔴 Testing web_data_reddit_posts tool...');
    
    const brightData = spawn('npx', [
      '-y',
      '@smithery/cli@latest',
      'run',
      '@luminati-io/brightdata-mcp',
      '--key',
      BRIGHT_DATA_KEY
    ], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd()
    });

    let output = '';
    let error = '';

    brightData.stdout.on('data', (data) => {
      output += data.toString();
    });

    brightData.stderr.on('data', (data) => {
      error += data.toString();
    });

    brightData.on('close', (code) => {
      if (output.trim()) {
        try {
          const lines = output.split('\n').filter(line => line.trim());
          for (const line of lines) {
            try {
              const parsed = JSON.parse(line);
              if (parsed.result) {
                console.log('✅ web_data_reddit_posts tool working correctly');
                resolve(true);
                return;
              }
            } catch (parseError) {
              continue;
            }
          }
          console.log('⚠️ web_data_reddit_posts tool returned data but no valid results');
          resolve(false);
        } catch (parseError) {
          console.log('❌ web_data_reddit_posts tool failed to parse response');
          resolve(false);
        }
      } else {
        console.log(`❌ web_data_reddit_posts tool failed with code ${code}: ${error}`);
        resolve(false);
      }
    });

    brightData.on('error', (err) => {
      console.log(`❌ web_data_reddit_posts tool spawn error: ${err.message}`);
      resolve(false);
    });

    // Send MCP request for Reddit posts
    const mcpRequest = {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "web_data_reddit_posts",
        arguments: {
          url: "https://www.reddit.com/r/Bitcoin/"
        }
      }
    };

    brightData.stdin.write(JSON.stringify(mcpRequest) + '\n');
    brightData.stdin.end();

    // Timeout after 30 seconds
    setTimeout(() => {
      brightData.kill();
      console.log('⏰ web_data_reddit_posts tool timeout after 30 seconds');
      resolve(false);
    }, 30000);
  });
}

/**
 * Run all tests
 */
async function runTests() {
  console.log(`Testing with asset: ${TEST_ASSET}`);
  console.log(`Using Bright Data key: ${BRIGHT_DATA_KEY.substring(0, 8)}...`);
  
  const results = {
    searchEngine: false,
    twitterPosts: false,
    redditPosts: false
  };
  
  try {
    results.searchEngine = await testSearchEngine();
    results.twitterPosts = await testTwitterPosts();
    results.redditPosts = await testRedditPosts();
  } catch (error) {
    console.error('❌ Test execution error:', error);
  }
  
  console.log('\n📊 Test Results Summary');
  console.log('=======================');
  console.log(`Search Engine: ${results.searchEngine ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Twitter Posts: ${results.twitterPosts ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Reddit Posts: ${results.redditPosts ? '✅ PASS' : '❌ FAIL'}`);
  
  const passCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.keys(results).length;
  
  console.log(`\nOverall: ${passCount}/${totalCount} tests passed`);
  
  if (passCount === totalCount) {
    console.log('🎉 All Bright Data MCP tools are working correctly!');
    process.exit(0);
  } else {
    console.log('⚠️ Some Bright Data MCP tools are not working properly.');
    console.log('Please check your Bright Data MCP configuration and API key.');
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
