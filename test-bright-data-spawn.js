#!/usr/bin/env node

/**
 * Test Bright Data MCP spawn process directly
 */

const { spawn } = require('child_process');

console.log('🧪 Testing Bright Data MCP spawn process directly');
console.log('================================================');

async function testBrightDataSpawn() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Spawning Bright Data MCP process...');
    
    // Use the CORRECT Smithery Bright Data MCP configuration from brightdata.txt
    const brightData = spawn('npx', [
      '-y',
      '@smithery/cli@latest',
      'run',
      '@luminati-io/brightdata-mcp',
      '--key',
      '0ce87743-dd43-4c21-9578-96728550b6f2'
    ], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: '/home/ubuntu/Sandeep/projects/omni'
    });

    let output = '';
    let error = '';
    let hasConnected = false;

    brightData.stdout.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;
      console.log('📤 STDOUT:', chunk);
      
      if (chunk.includes('Connected') || chunk.includes('ready')) {
        hasConnected = true;
      }
    });

    brightData.stderr.on('data', (data) => {
      const chunk = data.toString();
      error += chunk;
      console.log('📥 STDERR:', chunk);
    });

    brightData.on('close', (code) => {
      console.log(`🏁 Process closed with code: ${code}`);
      console.log(`📊 Output length: ${output.length}`);
      console.log(`❌ Error length: ${error.length}`);
      console.log(`🔗 Has connected: ${hasConnected}`);
      
      if (output.trim()) {
        console.log('📋 Output preview (first 2000 chars):');
        console.log(output.substring(0, 2000));
        console.log('...');
        console.log('📋 Output preview (last 1000 chars):');
        console.log(output.substring(output.length - 1000));
      }
      
      if (error.trim()) {
        console.log('⚠️ Full error:');
        console.log(error);
      }
      
      resolve({ code, output, error, hasConnected });
    });

    brightData.on('error', (err) => {
      console.log(`❌ Spawn error: ${err.message}`);
      resolve({ error: err.message, hasConnected: false });
    });

    // Wait for connection, then initialize MCP server
    setTimeout(() => {
      console.log('🔧 Initializing MCP server...');

      // Step 1: Send initialize request
      const initRequest = {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: {}
          },
          clientInfo: {
            name: "omni-trading-system",
            version: "1.0.0"
          }
        }
      };

      try {
        brightData.stdin.write(JSON.stringify(initRequest) + '\n');
        console.log('✅ Initialize request sent');
        console.log('📋 Initialize content:', JSON.stringify(initRequest, null, 2));
      } catch (writeError) {
        console.log(`❌ Failed to write initialize request: ${writeError.message}`);
      }

      // Step 2: Wait for initialization, then send initialized notification
      setTimeout(() => {
        console.log('📨 Sending initialized notification...');

        const initializedNotification = {
          jsonrpc: "2.0",
          method: "notifications/initialized"
        };

        try {
          brightData.stdin.write(JSON.stringify(initializedNotification) + '\n');
          console.log('✅ Initialized notification sent');
        } catch (writeError) {
          console.log(`❌ Failed to write initialized notification: ${writeError.message}`);
        }

        // Step 3: Now send the actual tool call
        setTimeout(() => {
          console.log('🔍 Sending search_engine tool call...');

          const mcpRequest = {
            jsonrpc: "2.0",
            id: 2,
            method: "tools/call",
            params: {
              name: "search_engine",
              arguments: {
                query: "BTC bitcoin cryptocurrency",
                engine: "google"
              }
            }
          };

          try {
            brightData.stdin.write(JSON.stringify(mcpRequest) + '\n');
            console.log('✅ Tool call sent successfully');
            console.log('📋 Tool call content:', JSON.stringify(mcpRequest, null, 2));
          } catch (writeError) {
            console.log(`❌ Failed to write tool call: ${writeError.message}`);
          }

          // Wait for response before closing
          setTimeout(() => {
            console.log('⏰ Waiting for tool response...');

            setTimeout(() => {
              try {
                console.log('🔚 Closing stdin after waiting for response...');
                brightData.stdin.end();
                console.log('✅ Stdin closed');
              } catch (endError) {
                console.log(`❌ Failed to close stdin: ${endError.message}`);
              }
            }, 5000);

          }, 2000);

        }, 2000); // Wait 2 seconds after initialized notification

      }, 2000); // Wait 2 seconds after initialize request

    }, 3000); // Wait 3 seconds for connection

    // Timeout after 30 seconds
    setTimeout(() => {
      console.log('⏰ Timeout reached, killing process...');
      brightData.kill();
    }, 30000);
  });
}

// Run the test
testBrightDataSpawn()
  .then(result => {
    console.log('\n🎯 TEST RESULTS:');
    console.log('================');
    console.log(`Exit Code: ${result.code}`);
    console.log(`Connected: ${result.hasConnected}`);
    console.log(`Output Length: ${result.output ? result.output.length : 0}`);
    console.log(`Error Length: ${result.error ? result.error.length : 0}`);
    
    if (result.hasConnected) {
      console.log('✅ Bright Data MCP connection successful');
    } else {
      console.log('❌ Bright Data MCP connection failed');
    }
    
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
