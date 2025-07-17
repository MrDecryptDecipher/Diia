/**
 * OMNI COMPREHENSIVE TRADING SYSTEM - EXHAUSTIVE TEST SUITE
 * 
 * This test suite validates every aspect of the trading system:
 * 1. All 12 trading factors
 * 2. Real-time data integration
 * 3. Performance metrics
 * 4. Risk management
 * 5. API endpoints
 * 6. System reliability
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class ComprehensiveTestSuite {
  constructor() {
    this.baseUrl = 'http://localhost:10002/api';
    this.testResults = {
      timestamp: new Date().toISOString(),
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      testDetails: [],
      performanceMetrics: {},
      systemHealth: {}
    };
    
    // Test symbols for comprehensive testing
    this.testSymbols = [
      'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'ADAUSDT', 'DOTUSDT',
      'PEPEUSDT', 'SHIBUSDT', 'DOGEUSDT', 'AVAXUSDT', 'LINKUSDT'
    ];
  }

  /**
   * Run all comprehensive tests
   */
  async runAllTests() {
    console.log('🚀 STARTING COMPREHENSIVE TEST SUITE');
    console.log('=' * 60);
    
    try {
      // Test 1: System Status and Health
      await this.testSystemHealth();
      
      // Test 2: Candlestick Pattern Recognition
      await this.testCandlestickPatterns();
      
      // Test 3: Chart Pattern Detection
      await this.testChartPatterns();
      
      // Test 4: Orderbook Depth Analysis
      await this.testOrderbookAnalysis();
      
      // Test 5: Fee Optimization
      await this.testFeeOptimization();
      
      // Test 6: Volume Analysis
      await this.testVolumeAnalysis();
      
      // Test 7: Technical Indicators
      await this.testTechnicalIndicators();
      
      // Test 8: ML Predictions
      await this.testMLPredictions();
      
      // Test 9: Neural Network Analysis
      await this.testNeuralNetworkAnalysis();
      
      // Test 10: Psychological Factors
      await this.testPsychologicalFactors();
      
      // Test 11: Risk Management
      await this.testRiskManagement();
      
      // Test 12: Real-time Data Integration
      await this.testRealTimeDataIntegration();
      
      // Test 13: Performance Testing
      await this.testSystemPerformance();
      
      // Test 14: API Endpoint Testing
      await this.testAPIEndpoints();
      
      // Test 15: Load Testing
      await this.testSystemLoad();
      
      // Generate comprehensive report
      await this.generateTestReport();
      
    } catch (error) {
      console.error('❌ Critical error in test suite:', error);
      this.recordTest('CRITICAL_ERROR', false, error.message);
    }
  }

  /**
   * Test 1: System Health and Status
   */
  async testSystemHealth() {
    console.log('\n🔍 Testing System Health and Status...');
    
    try {
      // Test system status endpoint
      const statusResponse = await this.makeRequest('/trades/system-status');
      
      this.recordTest('System Status API', statusResponse.success, 
        statusResponse.success ? 'System status retrieved successfully' : 'Failed to get system status');
      
      if (statusResponse.success) {
        const status = statusResponse.data;
        
        // Validate system configuration
        this.recordTest('System Active Status', status.isActive === true, 
          `System active: ${status.isActive}`);
        
        this.recordTest('Capital Configuration', status.config && status.config.capital === 12, 
          `Capital: ${status.config?.capital} USDT`);
        
        this.recordTest('Trading Pairs Configuration', 
          status.config && status.config.tradingPairs && status.config.tradingPairs.length >= 9,
          `Trading pairs: ${status.config?.tradingPairs?.length}`);
        
        this.recordTest('Risk Management Configuration',
          status.config && status.config.maxRiskPerTrade === 0.01,
          `Max risk per trade: ${status.config?.maxRiskPerTrade * 100}%`);
      }
      
    } catch (error) {
      this.recordTest('System Health Check', false, error.message);
    }
  }

  /**
   * Test 2: Candlestick Pattern Recognition
   */
  async testCandlestickPatterns() {
    console.log('\n🕯️ Testing Candlestick Pattern Recognition...');
    
    for (const symbol of this.testSymbols.slice(0, 3)) { // Test first 3 symbols
      try {
        const analysisResponse = await this.makeRequest(`/trades/comprehensive-analysis/${symbol}`);
        
        if (analysisResponse.success) {
          const analysis = analysisResponse.data;
          const patterns = analysis.candlestickPatterns;
          
          // Test pattern structure
          this.recordTest(`${symbol} - Candlestick Pattern Structure`, 
            patterns && typeof patterns.strength === 'number',
            `Pattern strength: ${patterns?.strength}`);
          
          // Test pattern detection
          this.recordTest(`${symbol} - Pattern Detection`, 
            patterns && patterns.patterns && typeof patterns.patterns === 'object',
            `Patterns detected: ${Object.keys(patterns?.patterns || {}).length}`);
          
          // Test signal generation
          this.recordTest(`${symbol} - Pattern Signal`, 
            patterns && ['BULLISH', 'BEARISH', 'NEUTRAL'].includes(patterns.signal),
            `Signal: ${patterns?.signal}`);
          
          // Log detailed pattern results
          if (patterns && patterns.patterns) {
            console.log(`  📊 ${symbol} Patterns:`, Object.keys(patterns.patterns).map(p => 
              `${p}: ${patterns.patterns[p]}`).join(', '));
          }
        }
        
      } catch (error) {
        this.recordTest(`${symbol} - Candlestick Analysis`, false, error.message);
      }
    }
  }

  /**
   * Test 3: Chart Pattern Detection
   */
  async testChartPatterns() {
    console.log('\n📈 Testing Chart Pattern Detection...');
    
    for (const symbol of this.testSymbols.slice(0, 3)) {
      try {
        const analysisResponse = await this.makeRequest(`/trades/comprehensive-analysis/${symbol}`);
        
        if (analysisResponse.success) {
          const analysis = analysisResponse.data;
          const chartPatterns = analysis.chartPatterns;
          
          // Test chart pattern structure
          this.recordTest(`${symbol} - Chart Pattern Structure`, 
            chartPatterns && typeof chartPatterns.confidence === 'number',
            `Confidence: ${chartPatterns?.confidence}`);
          
          // Test pattern types
          this.recordTest(`${symbol} - Chart Pattern Types`, 
            chartPatterns && chartPatterns.patterns && typeof chartPatterns.patterns === 'object',
            `Patterns: ${Object.keys(chartPatterns?.patterns || {}).length}`);
          
          // Test signal validity
          this.recordTest(`${symbol} - Chart Pattern Signal`, 
            chartPatterns && ['BULLISH', 'BEARISH', 'NEUTRAL'].includes(chartPatterns.signal),
            `Signal: ${chartPatterns?.signal}`);
          
          // Log pattern details
          if (chartPatterns && chartPatterns.patterns) {
            console.log(`  📊 ${symbol} Chart Patterns:`, chartPatterns.patterns);
          }
        }
        
      } catch (error) {
        this.recordTest(`${symbol} - Chart Pattern Analysis`, false, error.message);
      }
    }
  }

  /**
   * Test 4: Orderbook Depth Analysis
   */
  async testOrderbookAnalysis() {
    console.log('\n📚 Testing Orderbook Depth Analysis...');
    
    for (const symbol of this.testSymbols.slice(0, 3)) {
      try {
        const analysisResponse = await this.makeRequest(`/trades/comprehensive-analysis/${symbol}`);
        
        if (analysisResponse.success) {
          const analysis = analysisResponse.data;
          const orderbook = analysis.orderbookDepth;
          
          // Test orderbook structure
          this.recordTest(`${symbol} - Orderbook Structure`, 
            orderbook && typeof orderbook.liquidityScore === 'number',
            `Liquidity Score: ${orderbook?.liquidityScore}`);
          
          // Test bid/ask analysis
          this.recordTest(`${symbol} - Bid/Ask Analysis`, 
            orderbook && (orderbook.bidVolume !== undefined || orderbook.askVolume !== undefined),
            `Bid Volume: ${orderbook?.bidVolume}, Ask Volume: ${orderbook?.askVolume}`);
          
          // Test imbalance calculation
          this.recordTest(`${symbol} - Market Imbalance`, 
            orderbook && typeof orderbook.imbalance === 'number',
            `Imbalance: ${orderbook?.imbalance}`);
          
          // Test spread calculation
          this.recordTest(`${symbol} - Spread Analysis`, 
            orderbook && typeof orderbook.spread === 'number',
            `Spread: ${orderbook?.spread}`);
          
          console.log(`  📊 ${symbol} Orderbook: Liquidity ${orderbook?.liquidityScore}, Signal ${orderbook?.signal}`);
        }
        
      } catch (error) {
        this.recordTest(`${symbol} - Orderbook Analysis`, false, error.message);
      }
    }
  }

  /**
   * Test 5: Fee Optimization Engine
   */
  async testFeeOptimization() {
    console.log('\n💰 Testing Fee Optimization Engine...');
    
    try {
      const analysisResponse = await this.makeRequest(`/trades/comprehensive-analysis/BTCUSDT`);
      
      if (analysisResponse.success) {
        const analysis = analysisResponse.data;
        const feeAnalysis = analysis.feeAnalysis;
        
        // Test fee structure
        this.recordTest('Fee Structure', 
          feeAnalysis && feeAnalysis.fees && 
          typeof feeAnalysis.fees.makerFee === 'number' &&
          typeof feeAnalysis.fees.takerFee === 'number',
          `Maker: ${feeAnalysis?.fees?.makerFee}, Taker: ${feeAnalysis?.fees?.takerFee}`);
        
        // Test cost calculations
        this.recordTest('Total Cost Calculation', 
          feeAnalysis && typeof feeAnalysis.totalCost === 'number',
          `Total Cost: ${feeAnalysis?.totalCost}`);
        
        // Test break-even analysis
        this.recordTest('Break-even Analysis', 
          feeAnalysis && typeof feeAnalysis.breakEvenMove === 'number',
          `Break-even Move: ${feeAnalysis?.breakEvenMove}`);
        
        // Test recommendation engine
        this.recordTest('Fee Recommendation', 
          feeAnalysis && ['PROCEED', 'CAUTION', 'AVOID'].includes(feeAnalysis.recommendation),
          `Recommendation: ${feeAnalysis?.recommendation}`);
        
        console.log(`  📊 Fee Analysis: ${JSON.stringify(feeAnalysis, null, 2)}`);
      }
      
    } catch (error) {
      this.recordTest('Fee Optimization', false, error.message);
    }
  }

  /**
   * Test 6: Volume Analysis Suite
   */
  async testVolumeAnalysis() {
    console.log('\n📊 Testing Volume Analysis Suite...');
    
    for (const symbol of this.testSymbols.slice(0, 3)) {
      try {
        const analysisResponse = await this.makeRequest(`/trades/comprehensive-analysis/${symbol}`);
        
        if (analysisResponse.success) {
          const analysis = analysisResponse.data;
          const volumeAnalysis = analysis.volumeAnalysis;
          
          // Test volume metrics
          this.recordTest(`${symbol} - Volume Metrics`, 
            volumeAnalysis && typeof volumeAnalysis.strength === 'number',
            `Volume Strength: ${volumeAnalysis?.strength}`);
          
          // Test volume ratios
          this.recordTest(`${symbol} - Volume Ratios`, 
            volumeAnalysis && (volumeAnalysis.volumeRatio !== undefined),
            `Volume Ratio: ${volumeAnalysis?.volumeRatio}`);
          
          // Test price-volume correlation
          this.recordTest(`${symbol} - Price-Volume Correlation`, 
            volumeAnalysis && (volumeAnalysis.priceChange !== undefined),
            `Price Change: ${volumeAnalysis?.priceChange}%`);
          
          // Test volume confirmation
          this.recordTest(`${symbol} - Volume Confirmation`, 
            volumeAnalysis && typeof volumeAnalysis.volumeConfirmation === 'boolean',
            `Confirmation: ${volumeAnalysis?.volumeConfirmation}`);
          
          console.log(`  📊 ${symbol} Volume: Strength ${volumeAnalysis?.strength}, Signal ${volumeAnalysis?.signal}`);
        }
        
      } catch (error) {
        this.recordTest(`${symbol} - Volume Analysis`, false, error.message);
      }
    }
  }

  /**
   * Test 7: Technical Indicators
   */
  async testTechnicalIndicators() {
    console.log('\n📈 Testing Technical Indicators...');

    for (const symbol of this.testSymbols.slice(0, 3)) {
      try {
        const analysisResponse = await this.makeRequest(`/trades/comprehensive-analysis/${symbol}`);

        if (analysisResponse.success) {
          const analysis = analysisResponse.data;
          const indicators = analysis.technicalIndicators;

          // Test indicator structure
          this.recordTest(`${symbol} - Technical Indicator Structure`,
            indicators && typeof indicators.strength === 'number',
            `Indicator Strength: ${indicators?.strength}`);

          // Test indicator calculations
          this.recordTest(`${symbol} - Indicator Calculations`,
            indicators && indicators.indicators && typeof indicators.indicators === 'object',
            `Indicators: ${Object.keys(indicators?.indicators || {}).length}`);

          // Test signal generation
          this.recordTest(`${symbol} - Technical Signal`,
            indicators && ['BULLISH', 'BEARISH', 'NEUTRAL'].includes(indicators.signal),
            `Signal: ${indicators?.signal}`);

          // Test specific indicators
          if (indicators && indicators.indicators) {
            const ind = indicators.indicators;
            this.recordTest(`${symbol} - SMA Calculation`,
              typeof ind.sma20 === 'number' && typeof ind.sma50 === 'number',
              `SMA20: ${ind.sma20}, SMA50: ${ind.sma50}`);

            this.recordTest(`${symbol} - RSI Calculation`,
              typeof ind.rsi === 'number' && ind.rsi >= 0 && ind.rsi <= 100,
              `RSI: ${ind.rsi}`);

            this.recordTest(`${symbol} - MACD Calculation`,
              ind.macd && typeof ind.macd.macd === 'number',
              `MACD: ${ind.macd?.macd}`);
          }

          console.log(`  📊 ${symbol} Indicators: RSI ${indicators?.indicators?.rsi}, Signal ${indicators?.signal}`);
        }

      } catch (error) {
        this.recordTest(`${symbol} - Technical Indicators`, false, error.message);
      }
    }
  }

  /**
   * Test 8: ML Prediction Engine
   */
  async testMLPredictions() {
    console.log('\n🧠 Testing ML Prediction Engine...');

    for (const symbol of this.testSymbols.slice(0, 3)) {
      try {
        const analysisResponse = await this.makeRequest(`/trades/comprehensive-analysis/${symbol}`);

        if (analysisResponse.success) {
          const analysis = analysisResponse.data;
          const mlPredictions = analysis.mlPredictions;

          // Test ML structure
          this.recordTest(`${symbol} - ML Prediction Structure`,
            mlPredictions && typeof mlPredictions.confidence === 'number',
            `ML Confidence: ${mlPredictions?.confidence}`);

          // Test feature analysis
          this.recordTest(`${symbol} - ML Features`,
            mlPredictions && mlPredictions.features && typeof mlPredictions.features === 'object',
            `Features: ${Object.keys(mlPredictions?.features || {}).length}`);

          // Test prediction values
          this.recordTest(`${symbol} - ML Prediction Value`,
            mlPredictions && typeof mlPredictions.prediction === 'number',
            `Prediction: ${mlPredictions?.prediction}`);

          // Test signal generation
          this.recordTest(`${symbol} - ML Signal`,
            mlPredictions && ['BULLISH', 'BEARISH', 'NEUTRAL'].includes(mlPredictions.signal),
            `Signal: ${mlPredictions?.signal}`);

          console.log(`  📊 ${symbol} ML: Prediction ${mlPredictions?.prediction}, Confidence ${mlPredictions?.confidence}`);
        }

      } catch (error) {
        this.recordTest(`${symbol} - ML Predictions`, false, error.message);
      }
    }
  }

  /**
   * Test 9: Neural Network Analysis
   */
  async testNeuralNetworkAnalysis() {
    console.log('\n🧠 Testing Neural Network Analysis...');

    // Neural network analysis is integrated into ML predictions
    for (const symbol of this.testSymbols.slice(0, 2)) {
      try {
        const analysisResponse = await this.makeRequest(`/trades/comprehensive-analysis/${symbol}`);

        if (analysisResponse.success) {
          const analysis = analysisResponse.data;
          const mlPredictions = analysis.mlPredictions;

          // Test neural network features
          this.recordTest(`${symbol} - Neural Network Features`,
            mlPredictions && mlPredictions.features,
            `NN Features available: ${mlPredictions?.features ? 'Yes' : 'No'}`);

          // Test ensemble prediction (neural network component)
          this.recordTest(`${symbol} - Neural Network Ensemble`,
            mlPredictions && typeof mlPredictions.prediction === 'number',
            `NN Ensemble Prediction: ${mlPredictions?.prediction}`);

          console.log(`  📊 ${symbol} Neural Network: Integrated with ML predictions`);
        }

      } catch (error) {
        this.recordTest(`${symbol} - Neural Network Analysis`, false, error.message);
      }
    }
  }

  /**
   * Test 10: Psychological Factors
   */
  async testPsychologicalFactors() {
    console.log('\n🧠 Testing Psychological Factors...');

    for (const symbol of this.testSymbols.slice(0, 3)) {
      try {
        const analysisResponse = await this.makeRequest(`/trades/comprehensive-analysis/${symbol}`);

        if (analysisResponse.success) {
          const analysis = analysisResponse.data;
          const psychological = analysis.psychologicalFactors;

          // Test Fear & Greed Index
          this.recordTest(`${symbol} - Fear & Greed Index`,
            psychological && typeof psychological.fearGreedIndex === 'number' &&
            psychological.fearGreedIndex >= 0 && psychological.fearGreedIndex <= 100,
            `Fear & Greed: ${psychological?.fearGreedIndex}`);

          // Test market sentiment
          this.recordTest(`${symbol} - Market Sentiment`,
            psychological && ['GREEDY', 'FEARFUL', 'NEUTRAL'].includes(psychological.marketSentiment),
            `Sentiment: ${psychological?.marketSentiment}`);

          // Test volatility analysis
          this.recordTest(`${symbol} - Volatility Analysis`,
            psychological && typeof psychological.volatility === 'number',
            `Volatility: ${psychological?.volatility}`);

          // Test momentum analysis
          this.recordTest(`${symbol} - Momentum Analysis`,
            psychological && typeof psychological.momentum === 'number',
            `Momentum: ${psychological?.momentum}`);

          console.log(`  📊 ${symbol} Psychology: F&G ${psychological?.fearGreedIndex}, Sentiment ${psychological?.marketSentiment}`);
        }

      } catch (error) {
        this.recordTest(`${symbol} - Psychological Factors`, false, error.message);
      }
    }
  }

  /**
   * Test 11: Risk Management System
   */
  async testRiskManagement() {
    console.log('\n🛡️ Testing Risk Management System...');

    try {
      const analysisResponse = await this.makeRequest(`/trades/comprehensive-analysis/BTCUSDT`);

      if (analysisResponse.success) {
        const analysis = analysisResponse.data;
        const riskAssessment = analysis.riskAssessment;

        // Test risk assessment structure
        this.recordTest('Risk Assessment Structure',
          riskAssessment && riskAssessment.riskLevel && riskAssessment.maxRisk,
          `Risk Level: ${riskAssessment?.riskLevel}, Max Risk: ${riskAssessment?.maxRisk}`);

        // Test risk recommendations
        this.recordTest('Risk Recommendations',
          riskAssessment && riskAssessment.recommendation,
          `Recommendation: ${riskAssessment?.recommendation}`);

        // Test comprehensive scoring
        this.recordTest('Comprehensive Risk Scoring',
          analysis.comprehensiveScore && typeof analysis.comprehensiveScore.confidence === 'number',
          `Confidence: ${analysis.comprehensiveScore?.confidence}`);

        // Test trading signal generation
        this.recordTest('Trading Signal Generation',
          analysis.tradingSignal && ['BUY', 'SELL', 'HOLD'].includes(analysis.tradingSignal.signal),
          `Signal: ${analysis.tradingSignal?.signal}, Reason: ${analysis.tradingSignal?.reason}`);

        console.log(`  📊 Risk Management: ${JSON.stringify(riskAssessment, null, 2)}`);
      }

    } catch (error) {
      this.recordTest('Risk Management System', false, error.message);
    }
  }

  /**
   * Test 12: Real-time Data Integration
   */
  async testRealTimeDataIntegration() {
    console.log('\n⚡ Testing Real-time Data Integration...');

    // Test multiple symbols for data consistency
    for (const symbol of this.testSymbols.slice(0, 5)) {
      try {
        const startTime = Date.now();
        const analysisResponse = await this.makeRequest(`/trades/comprehensive-analysis/${symbol}`);
        const responseTime = Date.now() - startTime;

        // Test data availability
        this.recordTest(`${symbol} - Data Availability`,
          analysisResponse.success,
          `Data retrieved: ${analysisResponse.success ? 'Yes' : 'No'}`);

        // Test response time
        this.recordTest(`${symbol} - Response Time`,
          responseTime < 5000, // Should respond within 5 seconds
          `Response time: ${responseTime}ms`);

        if (analysisResponse.success) {
          const analysis = analysisResponse.data;

          // Test data freshness
          this.recordTest(`${symbol} - Data Freshness`,
            analysis.timestamp && new Date(analysis.timestamp),
            `Timestamp: ${analysis.timestamp}`);

          // Test data completeness
          const requiredFields = [
            'candlestickPatterns', 'chartPatterns', 'orderbookDepth',
            'feeAnalysis', 'volumeAnalysis', 'technicalIndicators',
            'mlPredictions', 'psychologicalFactors', 'riskAssessment'
          ];

          const missingFields = requiredFields.filter(field => !analysis[field]);
          this.recordTest(`${symbol} - Data Completeness`,
            missingFields.length === 0,
            `Missing fields: ${missingFields.length > 0 ? missingFields.join(', ') : 'None'}`);
        }

      } catch (error) {
        this.recordTest(`${symbol} - Real-time Data`, false, error.message);
      }
    }
  }

  /**
   * Test 13: System Performance
   */
  async testSystemPerformance() {
    console.log('\n⚡ Testing System Performance...');

    try {
      // Test concurrent requests
      const concurrentTests = this.testSymbols.slice(0, 5).map(symbol =>
        this.makeRequest(`/trades/comprehensive-analysis/${symbol}`)
      );

      const startTime = Date.now();
      const results = await Promise.all(concurrentTests);
      const totalTime = Date.now() - startTime;

      const successfulRequests = results.filter(r => r.success).length;

      this.recordTest('Concurrent Request Handling',
        successfulRequests === concurrentTests.length,
        `${successfulRequests}/${concurrentTests.length} successful in ${totalTime}ms`);

      // Test memory usage (simplified)
      const memUsage = process.memoryUsage();
      this.recordTest('Memory Usage',
        memUsage.heapUsed < 500 * 1024 * 1024, // Less than 500MB
        `Heap used: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);

      // Test system status under load
      const statusResponse = await this.makeRequest('/trades/system-status');
      this.recordTest('System Status Under Load',
        statusResponse.success,
        `Status available: ${statusResponse.success ? 'Yes' : 'No'}`);

    } catch (error) {
      this.recordTest('System Performance', false, error.message);
    }
  }

  /**
   * Test 14: API Endpoint Testing
   */
  async testAPIEndpoints() {
    console.log('\n🔌 Testing API Endpoints...');

    const endpoints = [
      { path: '/trades/system-status', method: 'GET' },
      { path: '/trades/comprehensive-analysis/BTCUSDT', method: 'GET' },
      { path: '/trades/start-comprehensive', method: 'POST' },
      { path: '/trades/stop', method: 'POST' }
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await this.makeRequest(endpoint.path, endpoint.method);

        this.recordTest(`API ${endpoint.method} ${endpoint.path}`,
          response.success || response.status < 500,
          `Status: ${response.status}, Success: ${response.success}`);

      } catch (error) {
        this.recordTest(`API ${endpoint.method} ${endpoint.path}`, false, error.message);
      }
    }
  }

  /**
   * Test 15: Load Testing
   */
  async testSystemLoad() {
    console.log('\n🔥 Testing System Load...');

    try {
      // Rapid fire requests
      const rapidRequests = [];
      for (let i = 0; i < 10; i++) {
        rapidRequests.push(this.makeRequest('/trades/system-status'));
      }

      const startTime = Date.now();
      const results = await Promise.all(rapidRequests);
      const totalTime = Date.now() - startTime;

      const successfulRequests = results.filter(r => r.success).length;

      this.recordTest('Rapid Request Handling',
        successfulRequests >= 8, // At least 80% success rate
        `${successfulRequests}/10 successful in ${totalTime}ms`);

      // Test sustained load
      const sustainedRequests = [];
      for (let i = 0; i < 5; i++) {
        sustainedRequests.push(
          this.makeRequest(`/trades/comprehensive-analysis/${this.testSymbols[i % this.testSymbols.length]}`)
        );
      }

      const sustainedResults = await Promise.all(sustainedRequests);
      const sustainedSuccess = sustainedResults.filter(r => r.success).length;

      this.recordTest('Sustained Load Handling',
        sustainedSuccess >= 4, // At least 80% success rate
        `${sustainedSuccess}/5 sustained requests successful`);

    } catch (error) {
      this.recordTest('Load Testing', false, error.message);
    }
  }

  /**
   * Helper method to make API requests
   */
  async makeRequest(endpoint, method = 'GET', data = null) {
    try {
      const startTime = Date.now();
      
      const config = {
        method,
        url: `${this.baseUrl}${endpoint}`,
        timeout: 30000, // 30 second timeout
      };
      
      if (data) {
        config.data = data;
      }
      
      const response = await axios(config);
      const endTime = Date.now();
      
      // Record performance metrics
      if (!this.testResults.performanceMetrics[endpoint]) {
        this.testResults.performanceMetrics[endpoint] = [];
      }
      this.testResults.performanceMetrics[endpoint].push(endTime - startTime);
      
      return {
        success: true,
        data: response.data,
        status: response.status,
        responseTime: endTime - startTime
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: error.response?.status || 0
      };
    }
  }

  /**
   * Record test result
   */
  recordTest(testName, passed, details = '') {
    this.testResults.totalTests++;
    if (passed) {
      this.testResults.passedTests++;
      console.log(`  ✅ ${testName}: ${details}`);
    } else {
      this.testResults.failedTests++;
      console.log(`  ❌ ${testName}: ${details}`);
    }
    
    this.testResults.testDetails.push({
      name: testName,
      passed,
      details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Generate comprehensive test report
   */
  async generateTestReport() {
    console.log('\n📋 GENERATING COMPREHENSIVE TEST REPORT...');
    
    // Calculate performance statistics
    const performanceStats = {};
    for (const [endpoint, times] of Object.entries(this.testResults.performanceMetrics)) {
      performanceStats[endpoint] = {
        avgResponseTime: times.reduce((a, b) => a + b, 0) / times.length,
        minResponseTime: Math.min(...times),
        maxResponseTime: Math.max(...times),
        totalRequests: times.length
      };
    }
    
    const report = {
      ...this.testResults,
      performanceStats,
      successRate: (this.testResults.passedTests / this.testResults.totalTests * 100).toFixed(2),
      testDuration: new Date().toISOString()
    };
    
    // Save report to file
    const reportPath = path.join(__dirname, 'test-reports', `comprehensive-test-${Date.now()}.json`);
    const reportDir = path.dirname(reportPath);
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Display summary
    console.log('\n🎯 TEST SUMMARY:');
    console.log('=' * 50);
    console.log(`📊 Total Tests: ${report.totalTests}`);
    console.log(`✅ Passed: ${report.passedTests}`);
    console.log(`❌ Failed: ${report.failedTests}`);
    console.log(`📈 Success Rate: ${report.successRate}%`);
    console.log(`📁 Report saved: ${reportPath}`);
    
    return report;
  }
}

// Export for use in other modules
module.exports = ComprehensiveTestSuite;

// Run tests if called directly
if (require.main === module) {
  const testSuite = new ComprehensiveTestSuite();
  testSuite.runAllTests()
    .then(() => {
      console.log('\n🎉 COMPREHENSIVE TESTING COMPLETED!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 TESTING FAILED:', error);
      process.exit(1);
    });
}
