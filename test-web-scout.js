/**
 * Test script for Web Scout MCP integration
 * Based on the official @pinkpixel/web-scout-mcp documentation
 */

const { spawn } = require('child_process');

async function testWebScoutMCP() {
  console.log('🌐 Testing Web Scout MCP for DOGE cryptocurrency sentiment...');
  
  return new Promise((resolve, reject) => {
    // Start the Web Scout MCP server
    const webScout = spawn('web-scout-mcp', [], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: '/home/ubuntu/Sandeep/projects/omni'
    });
    
    let output = '';
    let error = '';
    
    webScout.stdout.on('data', (data) => {
      output += data.toString();
      console.log('📤 Web Scout Output:', data.toString());
    });
    
    webScout.stderr.on('data', (data) => {
      error += data.toString();
      console.log('❌ Web Scout Error:', data.toString());
    });
    
    webScout.on('close', (code) => {
      console.log(`🔚 Web Scout closed with code: ${code}`);
      if (output.trim()) {
        try {
          // Try to parse the response
          const lines = output.split('\n').filter(line => line.trim());
          for (const line of lines) {
            try {
              const parsed = JSON.parse(line);
              if (parsed.result) {
                console.log('✅ Web Scout Success:', JSON.stringify(parsed.result, null, 2));
                resolve(parsed.result);
                return;
              }
            } catch (e) {
              // Continue to next line
            }
          }
          resolve({ error: 'No valid response found' });
        } catch (parseError) {
          resolve({ error: `Parse error: ${parseError.message}` });
        }
      } else {
        resolve({ error: `No output received. Error: ${error}` });
      }
    });
    
    webScout.on('error', (err) => {
      console.log('❌ Web Scout spawn error:', err.message);
      resolve({ error: `Spawn error: ${err.message}` });
    });
    
    // Send the MCP request for DuckDuckGo search
    const mcpRequest = {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "DuckDuckGoWebSearch",
        arguments: {
          query: "DOGE cryptocurrency latest news sentiment analysis",
          maxResults: 5
        }
      }
    };
    
    console.log('📨 Sending MCP request:', JSON.stringify(mcpRequest, null, 2));
    
    // Send the request
    webScout.stdin.write(JSON.stringify(mcpRequest) + '\n');
    webScout.stdin.end();
    
    // Timeout after 20 seconds
    setTimeout(() => {
      console.log('⏰ Web Scout timeout');
      webScout.kill();
      resolve({ error: 'Timeout after 20 seconds' });
    }, 20000);
  });
}

async function testGeminiCLI() {
  console.log('🤖 Testing Gemini CLI for DOGE analysis...');
  
  return new Promise((resolve, reject) => {
    // Test Gemini CLI with your API key
    const gemini = spawn('gemini', [], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { 
        ...process.env, 
        GEMINI_API_KEY: 'AIzaSyCAh8bZUAzV25sLmh3ygDGcnWBsSsQb23I'
      },
      cwd: '/home/ubuntu/Sandeep/projects/omni'
    });
    
    let output = '';
    let error = '';
    
    gemini.stdout.on('data', (data) => {
      output += data.toString();
      console.log('📤 Gemini Output:', data.toString());
    });
    
    gemini.stderr.on('data', (data) => {
      error += data.toString();
      console.log('❌ Gemini Error:', data.toString());
    });
    
    gemini.on('close', (code) => {
      console.log(`🔚 Gemini closed with code: ${code}`);
      resolve({
        success: code === 0,
        output: output,
        error: error
      });
    });
    
    gemini.on('error', (err) => {
      console.log('❌ Gemini spawn error:', err.message);
      resolve({ error: `Spawn error: ${err.message}` });
    });
    
    // Send analysis prompt
    const prompt = `Analyze DOGE cryptocurrency for short-term trading opportunities.

Context:
- Target: 5 USDT position size with 0.6 USDT profit target
- Timeframe: Short-term (minutes to hours)
- Risk tolerance: Conservative with 0.25% stop-loss

Please provide:
1. Trading recommendation (STRONG_BUY/BUY/HOLD/SELL/STRONG_SELL)
2. Confidence score (0-100%)
3. Key reasoning (max 100 words)
4. Risk factors (max 50 words)
5. Opportunities (max 50 words)
6. Optimal timeframe for trade

Format your response as JSON with these exact keys:
{
  "recommendation": "BUY",
  "confidence": 75,
  "reasoning": "...",
  "riskFactors": "...",
  "opportunities": "...",
  "timeframe": "..."
}`;
    
    console.log('📨 Sending Gemini prompt...');
    
    gemini.stdin.write(prompt + '\n');
    gemini.stdin.end();
    
    // Timeout after 30 seconds
    setTimeout(() => {
      console.log('⏰ Gemini timeout');
      gemini.kill();
      resolve({ error: 'Timeout after 30 seconds' });
    }, 30000);
  });
}

// Run the tests
async function runTests() {
  console.log('🚀 Starting Web Scout MCP and Gemini CLI tests...\n');
  
  // Test Web Scout MCP
  const webScoutResult = await testWebScoutMCP();
  console.log('\n📊 Web Scout MCP Result:', JSON.stringify(webScoutResult, null, 2));
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test Gemini CLI
  const geminiResult = await testGeminiCLI();
  console.log('\n🤖 Gemini CLI Result:', JSON.stringify(geminiResult, null, 2));
  
  console.log('\n✅ Tests completed!');
}

// Run if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testWebScoutMCP, testGeminiCLI };
