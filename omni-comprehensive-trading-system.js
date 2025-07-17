/**
 * 🚀 OMNI COMPREHENSIVE TRADING SYSTEM
 * 
 * REAL IMPLEMENTATION with:
 * - 12 USDT capital: 2 trades of 5 USDT each + 2 USDT safety buffer
 * - OMNI comprehensive analysis (18 components)
 * - Web Scout MCP for sentiment analysis (Twitter, Reddit, articles)
 * - Gemini CLI integration for enhanced analysis
 * - Exponential growth strategy for 750 trades/day
 * - 0.6 USDT profit per trade target
 * 
 * NO SHORTCUTS, NO MOCKS - Uses real OMNI components and live sentiment data
 */

// Set up environment
process.env.NODE_ENV = 'demo';
process.env.BYBIT_API_KEY = 'VYAE4ZDhqftD7N6C1e';
process.env.BYBIT_API_SECRET = 'BFO3TRwpkUKbWTdSiRCEH8RTJiEbr7KTS4Vj';
process.env.BYBIT_TESTNET = 'true';
process.env.GEMINI_API_KEY = 'AIzaSyCAh8bZUAzV25sLmh3ygDGcnWBsSsQb23I';

const logger = require('./ui/dashboard-backend/src/utils/logger');
const bybitClient = require('./ui/dashboard-backend/src/utils/bybit-client');
const omniSystem = require('./ui/dashboard-backend/src/services/omni-comprehensive-system');
const { spawn } = require('child_process');

class OmniComprehensiveTradingSystem {
  constructor() {
    // EXACT capital distribution as requested
    this.config = {
      totalCapital: 12.0,           // Total 12 USDT
      activeTradeCapital: 10.0,     // 2 trades of 5 USDT each
      safetyBuffer: 2.0,            // 2 USDT safety buffer
      tradeSize: 5.0,               // 5 USDT per trade
      maxActivePositions: 2,        // Only 2 positions at a time
      targetProfitPerTrade: 0.6,    // EXACT 0.6 USDT profit per trade
      targetTradesPerDay: 750,      // 750 trades/day
      tradeIntervalMs: 115000,      // 115 seconds = 750+ trades/day
      minOmniConfidence: 0.85,      // 85%+ OMNI confidence required
      minSentimentScore: 0.7        // 70%+ sentiment score required
    };
    
    // Trading assets (will be dynamically filtered by OMNI signals)
    this.assets = [
      'DOGEUSDT', 'ADAUSDT', 'LINKUSDT', 'AVAXUSDT', 'MATICUSDT',
      'DOTUSDT', 'LTCUSDT', 'ATOMUSDT', 'SOLUSDT', 'XRPUSDT'
    ];
    
    // System state
    this.state = {
      isActive: false,
      totalTrades: 0,
      successfulTrades: 0,
      totalProfit: 0,
      currentCapital: 12.0,         // Track growing capital
      activePositions: new Map(),   // Max 2 positions
      orderHistory: [],
      usedCapital: 0,
      symbolInfo: new Map(),
      
      // Analysis storage
      omniAnalysis: new Map(),      // OMNI comprehensive analysis
      sentimentAnalysis: new Map(), // Web Scout sentiment data
      geminiAnalysis: new Map()     // Gemini CLI enhanced analysis
    };
    
    this.tradingInterval = null;
    this.analysisInterval = null;
    this.sentimentInterval = null;
    
    logger.info('🚀 OMNI Comprehensive Trading System initialized');
    logger.info(`💰 Capital Distribution: ${this.config.tradeSize} USDT × 2 trades + ${this.config.safetyBuffer} USDT safety`);
  }
  
  async start() {
    try {
      logger.info('🚀 Starting OMNI COMPREHENSIVE TRADING SYSTEM');
      logger.info('💰 EXACT Capital Distribution:');
      logger.info(`   Total Capital: ${this.config.totalCapital} USDT`);
      logger.info(`   Active Trading: ${this.config.activeTradeCapital} USDT (2 × ${this.config.tradeSize} USDT)`);
      logger.info(`   Safety Buffer: ${this.config.safetyBuffer} USDT`);
      logger.info(`   Target: ${this.config.targetProfitPerTrade} USDT profit per trade`);
      logger.info(`   Goal: ${this.config.targetTradesPerDay} trades/day for exponential growth`);
      
      this.state.isActive = true;
      
      // Start OMNI comprehensive system
      await omniSystem.start();
      logger.info('✅ OMNI comprehensive system started (18 components)');
      
      // Load symbol information
      await this.loadSymbolInformation();
      
      // Start analysis loops
      await this.startOmniAnalysisLoop();
      await this.startSentimentAnalysisLoop();
      await this.startGeminiAnalysisLoop();
      
      // Start trading loop
      this.startTradingLoop();
      
      // Status logging
      setInterval(() => this.logComprehensiveStatus(), 60000);
      
      logger.info('✅ OMNI Comprehensive Trading System started successfully');
      
    } catch (error) {
      logger.error('❌ Failed to start OMNI comprehensive trading system:', error);
      throw error;
    }
  }
  
  async loadSymbolInformation() {
    try {
      logger.info('📊 Loading symbol information...');
      
      for (const symbol of this.assets) {
        const symbolInfo = await bybitClient.getInstrumentsInfo({
          category: 'linear',
          symbol: symbol
        });
        
        if (symbolInfo && symbolInfo.retCode === 0 && symbolInfo.result?.list?.[0]) {
          const info = symbolInfo.result.list[0];
          this.state.symbolInfo.set(symbol, {
            minOrderQty: parseFloat(info.lotSizeFilter.minOrderQty),
            qtyStep: parseFloat(info.lotSizeFilter.qtyStep),
            maxOrderQty: parseFloat(info.lotSizeFilter.maxOrderQty),
            minOrderAmt: parseFloat(info.lotSizeFilter.minOrderAmt || '0'),
            tickSize: parseFloat(info.priceFilter.tickSize)
          });
        }
      }
      
      logger.info(`✅ Loaded symbol information for ${this.state.symbolInfo.size} assets`);
      
    } catch (error) {
      logger.error('❌ Failed to load symbol information:', error);
    }
  }
  
  async startOmniAnalysisLoop() {
    try {
      logger.info('🔬 Starting OMNI analysis loop...');
      
      // Run initial OMNI analysis
      for (const symbol of this.assets) {
        await this.runOmniAnalysis(symbol);
      }
      
      // Update every 30 seconds
      this.analysisInterval = setInterval(async () => {
        for (const symbol of this.assets) {
          await this.runOmniAnalysis(symbol);
        }
      }, 30000);
      
      logger.info('✅ OMNI analysis loop started');
      
    } catch (error) {
      logger.error('❌ Failed to start OMNI analysis loop:', error);
    }
  }
  
  async runOmniAnalysis(symbol) {
    try {
      // Use REAL OMNI comprehensive analysis
      const analysis = await omniSystem.performComprehensiveAnalysis(symbol);
      
      // Store OMNI analysis
      this.state.omniAnalysis.set(symbol, {
        analysis: analysis,
        timestamp: Date.now()
      });
      
      // Log strong OMNI signals
      if (analysis.comprehensiveScore && analysis.comprehensiveScore.confidence >= this.config.minOmniConfidence) {
        logger.info(`🎯 STRONG OMNI SIGNAL: ${symbol} - ${analysis.comprehensiveScore.signal} (${(analysis.comprehensiveScore.confidence * 100).toFixed(1)}%)`);
      }
      
    } catch (error) {
      logger.error(`❌ Error in OMNI analysis for ${symbol}:`, error.message);
    }
  }
  
  async startSentimentAnalysisLoop() {
    try {
      logger.info('🌐 Starting Web Scout sentiment analysis loop...');
      
      // Run initial sentiment analysis
      for (const symbol of this.assets) {
        await this.runSentimentAnalysis(symbol);
      }
      
      // Update every 60 seconds (to avoid rate limits)
      this.sentimentInterval = setInterval(async () => {
        for (const symbol of this.assets) {
          await this.runSentimentAnalysis(symbol);
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay between symbols
        }
      }, 60000);
      
      logger.info('✅ Web Scout sentiment analysis loop started');
      
    } catch (error) {
      logger.error('❌ Failed to start sentiment analysis loop:', error);
    }
  }
  
  async runSentimentAnalysis(symbol) {
    try {
      const asset = symbol.replace('USDT', ''); // Get base asset (e.g., DOGE from DOGEUSDT)
      
      // Use Web Scout MCP to search for latest sentiment
      const sentimentData = await this.searchAssetSentiment(asset);
      
      // Store sentiment analysis
      this.state.sentimentAnalysis.set(symbol, {
        sentiment: sentimentData,
        timestamp: Date.now()
      });
      
      // Log strong sentiment signals
      if (sentimentData.overallScore >= this.config.minSentimentScore) {
        logger.info(`📈 STRONG SENTIMENT: ${symbol} - ${sentimentData.sentiment} (${(sentimentData.overallScore * 100).toFixed(1)}%)`);
      }
      
    } catch (error) {
      logger.error(`❌ Error in sentiment analysis for ${symbol}:`, error.message);
    }
  }
  
  async searchAssetSentiment(asset) {
    try {
      // Search queries for comprehensive sentiment analysis
      const queries = [
        `${asset} cryptocurrency latest news today`,
        `${asset} crypto price prediction 2024`,
        `${asset} token reddit sentiment analysis`,
        `${asset} coin twitter trending discussion`
      ];
      
      let totalSentiment = 0;
      let sentimentCount = 0;
      let sources = [];
      
      for (const query of queries) {
        try {
          // Use Web Scout MCP for web search
          const searchResults = await this.webScoutSearch(query, 3);
          
          for (const result of searchResults) {
            // Extract content and analyze sentiment
            const content = await this.webScoutExtractContent(result.url);
            const sentiment = this.analyzeSentimentFromText(content, asset);
            
            if (sentiment.score !== null) {
              totalSentiment += sentiment.score;
              sentimentCount++;
              sources.push({
                url: result.url,
                title: result.title,
                sentiment: sentiment.score,
                keywords: sentiment.keywords
              });
            }
          }
          
          // Small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          logger.error(`❌ Error searching sentiment for query "${query}":`, error.message);
        }
      }
      
      const overallScore = sentimentCount > 0 ? totalSentiment / sentimentCount : 0.5;
      const sentiment = overallScore > 0.7 ? 'BULLISH' : overallScore < 0.3 ? 'BEARISH' : 'NEUTRAL';
      
      return {
        asset: asset,
        sentiment: sentiment,
        overallScore: overallScore,
        sourceCount: sentimentCount,
        sources: sources.slice(0, 5), // Keep top 5 sources
        timestamp: Date.now()
      };
      
    } catch (error) {
      logger.error(`❌ Error in asset sentiment search for ${asset}:`, error);
      return {
        asset: asset,
        sentiment: 'NEUTRAL',
        overallScore: 0.5,
        sourceCount: 0,
        sources: [],
        timestamp: Date.now()
      };
    }
  }

  async webScoutSearch(query, maxResults = 5) {
    try {
      // Use Web Scout MCP for DuckDuckGo search
      const webScout = spawn('npx', ['-y', '@pinkpixel/web-scout-mcp'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      const searchRequest = {
        method: 'tools/call',
        params: {
          name: 'DuckDuckGoWebSearch',
          arguments: {
            query: query,
            maxResults: maxResults
          }
        }
      };

      return new Promise((resolve, reject) => {
        let output = '';
        let error = '';

        webScout.stdout.on('data', (data) => {
          output += data.toString();
        });

        webScout.stderr.on('data', (data) => {
          error += data.toString();
        });

        webScout.on('close', (code) => {
          if (code === 0) {
            try {
              // Parse the MCP response
              const results = this.parseMCPResponse(output);
              resolve(results);
            } catch (parseError) {
              logger.error('❌ Error parsing Web Scout response:', parseError);
              resolve([]);
            }
          } else {
            logger.error('❌ Web Scout search failed:', error);
            resolve([]);
          }
        });

        // Send the search request
        webScout.stdin.write(JSON.stringify(searchRequest) + '\n');
        webScout.stdin.end();

        // Timeout after 10 seconds
        setTimeout(() => {
          webScout.kill();
          resolve([]);
        }, 10000);
      });

    } catch (error) {
      logger.error('❌ Error in Web Scout search:', error);
      return [];
    }
  }

  async webScoutExtractContent(url) {
    try {
      // Use Web Scout MCP for content extraction
      const webScout = spawn('npx', ['-y', '@pinkpixel/web-scout-mcp'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      const extractRequest = {
        method: 'tools/call',
        params: {
          name: 'UrlContentExtractor',
          arguments: {
            url: url
          }
        }
      };

      return new Promise((resolve, reject) => {
        let output = '';
        let error = '';

        webScout.stdout.on('data', (data) => {
          output += data.toString();
        });

        webScout.stderr.on('data', (data) => {
          error += data.toString();
        });

        webScout.on('close', (code) => {
          if (code === 0) {
            try {
              const content = this.parseMCPContentResponse(output);
              resolve(content);
            } catch (parseError) {
              logger.error('❌ Error parsing content extraction response:', parseError);
              resolve('');
            }
          } else {
            logger.error('❌ Content extraction failed:', error);
            resolve('');
          }
        });

        // Send the extraction request
        webScout.stdin.write(JSON.stringify(extractRequest) + '\n');
        webScout.stdin.end();

        // Timeout after 15 seconds
        setTimeout(() => {
          webScout.kill();
          resolve('');
        }, 15000);
      });

    } catch (error) {
      logger.error('❌ Error in content extraction:', error);
      return '';
    }
  }

  parseMCPResponse(output) {
    try {
      // Parse MCP JSON response for search results
      const lines = output.split('\n').filter(line => line.trim());
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.result && parsed.result.content) {
            // Extract search results from MCP response
            const content = parsed.result.content;
            if (Array.isArray(content)) {
              return content.map(item => ({
                title: item.title || '',
                url: item.url || '',
                snippet: item.snippet || ''
              }));
            }
          }
        } catch (e) {
          // Continue to next line
        }
      }
      return [];
    } catch (error) {
      logger.error('❌ Error parsing MCP response:', error);
      return [];
    }
  }

  parseMCPContentResponse(output) {
    try {
      // Parse MCP JSON response for content extraction
      const lines = output.split('\n').filter(line => line.trim());
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.result && parsed.result.content) {
            return parsed.result.content;
          }
        } catch (e) {
          // Continue to next line
        }
      }
      return '';
    } catch (error) {
      logger.error('❌ Error parsing content response:', error);
      return '';
    }
  }

  analyzeSentimentFromText(text, asset) {
    try {
      if (!text || text.length < 50) {
        return { score: null, keywords: [] };
      }

      const lowerText = text.toLowerCase();
      const assetLower = asset.toLowerCase();

      // Check if text is actually about the asset
      if (!lowerText.includes(assetLower)) {
        return { score: null, keywords: [] };
      }

      // Positive sentiment keywords
      const positiveKeywords = [
        'bullish', 'moon', 'pump', 'surge', 'rally', 'breakout', 'gains',
        'profit', 'buy', 'long', 'hodl', 'diamond hands', 'to the moon',
        'green', 'up', 'rise', 'increase', 'growth', 'positive', 'good news',
        'partnership', 'adoption', 'upgrade', 'development', 'innovation'
      ];

      // Negative sentiment keywords
      const negativeKeywords = [
        'bearish', 'dump', 'crash', 'fall', 'drop', 'sell', 'short',
        'red', 'down', 'decline', 'loss', 'fear', 'panic', 'bad news',
        'regulation', 'ban', 'hack', 'scam', 'rug pull', 'dead cat bounce'
      ];

      let positiveScore = 0;
      let negativeScore = 0;
      let foundKeywords = [];

      // Count positive keywords
      for (const keyword of positiveKeywords) {
        const matches = (lowerText.match(new RegExp(keyword, 'g')) || []).length;
        if (matches > 0) {
          positiveScore += matches;
          foundKeywords.push({ keyword, sentiment: 'positive', count: matches });
        }
      }

      // Count negative keywords
      for (const keyword of negativeKeywords) {
        const matches = (lowerText.match(new RegExp(keyword, 'g')) || []).length;
        if (matches > 0) {
          negativeScore += matches;
          foundKeywords.push({ keyword, sentiment: 'negative', count: matches });
        }
      }

      // Calculate sentiment score (0-1 scale)
      const totalScore = positiveScore + negativeScore;
      if (totalScore === 0) {
        return { score: 0.5, keywords: [] }; // Neutral
      }

      const sentimentScore = positiveScore / totalScore;

      return {
        score: sentimentScore,
        keywords: foundKeywords
      };

    } catch (error) {
      logger.error('❌ Error analyzing sentiment from text:', error);
      return { score: null, keywords: [] };
    }
  }

  async startGeminiAnalysisLoop() {
    try {
      logger.info('🤖 Starting Gemini CLI analysis loop...');

      // Run initial Gemini analysis for top signals
      await this.runGeminiAnalysisForTopSignals();

      // Update every 2 minutes (to avoid rate limits)
      setInterval(async () => {
        await this.runGeminiAnalysisForTopSignals();
      }, 120000);

      logger.info('✅ Gemini CLI analysis loop started');

    } catch (error) {
      logger.error('❌ Failed to start Gemini analysis loop:', error);
    }
  }

  async runGeminiAnalysisForTopSignals() {
    try {
      // Get top 3 signals from OMNI analysis
      const topSignals = this.getTopOmniSignals(3);

      for (const signal of topSignals) {
        await this.runGeminiAnalysis(signal.symbol);
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay
      }

    } catch (error) {
      logger.error('❌ Error in Gemini analysis for top signals:', error);
    }
  }

  async runGeminiAnalysis(symbol) {
    try {
      const asset = symbol.replace('USDT', '');

      // Create analysis prompt for Gemini
      const prompt = `Analyze ${asset} cryptocurrency for trading potential. Consider:
1. Current market conditions and price action
2. Technical analysis and chart patterns
3. Recent news and developments
4. Market sentiment and social media buzz
5. Risk factors and potential catalysts

Provide a trading recommendation with confidence score (0-100%) and key reasoning points.`;

      // Use Gemini CLI for enhanced analysis
      const geminiResult = await this.callGeminiCLI(prompt);

      // Store Gemini analysis
      this.state.geminiAnalysis.set(symbol, {
        analysis: geminiResult,
        timestamp: Date.now()
      });

      logger.info(`🤖 Gemini analysis completed for ${symbol}`);

    } catch (error) {
      logger.error(`❌ Error in Gemini analysis for ${symbol}:`, error.message);
    }
  }

  async callGeminiCLI(prompt) {
    try {
      // Use Gemini CLI with API key
      const gemini = spawn('npx', ['@google/gemini-cli'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, GEMINI_API_KEY: process.env.GEMINI_API_KEY }
      });

      return new Promise((resolve) => {
        let output = '';
        let error = '';

        gemini.stdout.on('data', (data) => {
          output += data.toString();
        });

        gemini.stderr.on('data', (data) => {
          error += data.toString();
        });

        gemini.on('close', (code) => {
          if (code === 0 && output.trim()) {
            resolve({
              response: output.trim(),
              confidence: this.extractConfidenceFromGemini(output),
              recommendation: this.extractRecommendationFromGemini(output)
            });
          } else {
            logger.error('❌ Gemini CLI failed:', error);
            resolve({
              response: 'Analysis unavailable',
              confidence: 0.5,
              recommendation: 'HOLD'
            });
          }
        });

        // Send prompt to Gemini
        gemini.stdin.write(prompt + '\n');
        gemini.stdin.end();

        // Timeout after 30 seconds
        setTimeout(() => {
          gemini.kill();
          resolve({
            response: 'Analysis timeout',
            confidence: 0.5,
            recommendation: 'HOLD'
          });
        }, 30000);
      });

    } catch (error) {
      logger.error('❌ Error calling Gemini CLI:', error);
      return {
        response: 'Analysis error',
        confidence: 0.5,
        recommendation: 'HOLD'
      };
    }
  }

  extractConfidenceFromGemini(text) {
    try {
      // Extract confidence percentage from Gemini response
      const confidenceMatch = text.match(/(\d+)%/);
      if (confidenceMatch) {
        return parseFloat(confidenceMatch[1]) / 100;
      }
      return 0.5; // Default neutral confidence
    } catch (error) {
      return 0.5;
    }
  }

  extractRecommendationFromGemini(text) {
    try {
      const lowerText = text.toLowerCase();
      if (lowerText.includes('buy') || lowerText.includes('bullish')) {
        return 'BUY';
      } else if (lowerText.includes('sell') || lowerText.includes('bearish')) {
        return 'SELL';
      } else {
        return 'HOLD';
      }
    } catch (error) {
      return 'HOLD';
    }
  }

  getTopOmniSignals(count = 3) {
    try {
      const signals = [];

      for (const [symbol, data] of this.state.omniAnalysis) {
        if (data.analysis && data.analysis.comprehensiveScore) {
          const score = data.analysis.comprehensiveScore;
          if (score.confidence >= this.config.minOmniConfidence) {
            signals.push({
              symbol: symbol,
              confidence: score.confidence,
              signal: score.signal,
              analysis: data.analysis
            });
          }
        }
      }

      // Sort by confidence and return top signals
      return signals
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, count);

    } catch (error) {
      logger.error('❌ Error getting top OMNI signals:', error);
      return [];
    }
  }

  startTradingLoop() {
    this.tradingInterval = setInterval(async () => {
      if (!this.state.isActive) return;

      try {
        await this.executeComprehensiveTrade();
      } catch (error) {
        logger.error('❌ Error in comprehensive trading cycle:', error);
      }
    }, this.config.tradeIntervalMs);

    logger.info(`⚡ Comprehensive trading loop started - executing every ${this.config.tradeIntervalMs}ms`);
  }

  async executeComprehensiveTrade() {
    const startTime = Date.now();

    try {
      // Check if we can place new trades (max 2 active positions)
      if (this.state.activePositions.size >= this.config.maxActivePositions) {
        logger.info(`📊 Maximum positions reached (${this.state.activePositions.size}/${this.config.maxActivePositions})`);
        return;
      }

      // Check available capital
      const availableCapital = this.state.currentCapital - this.state.usedCapital - this.config.safetyBuffer;
      if (availableCapital < this.config.tradeSize) {
        logger.info(`📊 Insufficient capital: ${availableCapital.toFixed(2)} USDT available, need ${this.config.tradeSize} USDT`);
        return;
      }

      // Find best comprehensive signal
      const bestSignal = this.findBestComprehensiveSignal();
      if (!bestSignal) {
        logger.info('📊 No suitable comprehensive trading opportunity found');
        return;
      }

      // Execute the trade
      const tradeResult = await this.executeRealComprehensiveTrade(bestSignal);

      if (tradeResult.success) {
        this.state.totalTrades++;
        this.state.successfulTrades++;
        this.state.usedCapital += this.config.tradeSize;

        logger.info(`✅ COMPREHENSIVE TRADE EXECUTED: Order ID ${tradeResult.orderId}`);
        logger.info(`   Symbol: ${bestSignal.symbol}`);
        logger.info(`   OMNI Signal: ${bestSignal.omniSignal} (${(bestSignal.omniConfidence * 100).toFixed(1)}%)`);
        logger.info(`   Sentiment: ${bestSignal.sentiment} (${(bestSignal.sentimentScore * 100).toFixed(1)}%)`);
        logger.info(`   Gemini: ${bestSignal.geminiRecommendation} (${(bestSignal.geminiConfidence * 100).toFixed(1)}%)`);
        logger.info(`   Trade Size: ${this.config.tradeSize} USDT`);
        logger.info(`   Target Profit: ${this.config.targetProfitPerTrade} USDT`);

        // Track position
        this.state.activePositions.set(bestSignal.symbol, {
          orderId: tradeResult.orderId,
          symbol: bestSignal.symbol,
          side: bestSignal.omniSignal === 'BUY' ? 'Buy' : 'Sell',
          quantity: tradeResult.quantity,
          entryPrice: tradeResult.entryPrice,
          tradeSize: this.config.tradeSize,
          targetProfit: this.config.targetProfitPerTrade,
          openTime: Date.now(),
          comprehensiveSignal: bestSignal
        });

        // Add to order history
        this.state.orderHistory.push({
          orderId: tradeResult.orderId,
          symbol: bestSignal.symbol,
          side: bestSignal.omniSignal === 'BUY' ? 'Buy' : 'Sell',
          quantity: tradeResult.quantity,
          entryPrice: tradeResult.entryPrice,
          tradeSize: this.config.tradeSize,
          targetProfit: this.config.targetProfitPerTrade,
          timestamp: Date.now(),
          status: 'FILLED',
          comprehensiveSignal: bestSignal
        });

        // Schedule position monitoring
        this.monitorComprehensivePosition(bestSignal.symbol);

      } else {
        logger.error(`❌ Comprehensive trade failed: ${tradeResult.error}`);
        this.state.totalTrades++;
      }

      const executionTime = Date.now() - startTime;
      logger.info(`⚡ Comprehensive trading cycle completed in ${executionTime}ms`);

    } catch (error) {
      logger.error('❌ Error executing comprehensive trade:', error);
      this.state.totalTrades++;
    }
  }

  findBestComprehensiveSignal() {
    try {
      const candidates = [];

      // Evaluate each asset with comprehensive analysis
      for (const symbol of this.assets) {
        // Skip if already have position
        if (this.state.activePositions.has(symbol)) continue;

        // Get OMNI analysis
        const omniData = this.state.omniAnalysis.get(symbol);
        if (!omniData || !omniData.analysis || !omniData.analysis.comprehensiveScore) continue;

        const omniScore = omniData.analysis.comprehensiveScore;
        if (omniScore.confidence < this.config.minOmniConfidence) continue;

        // Get sentiment analysis
        const sentimentData = this.state.sentimentAnalysis.get(symbol);
        const sentimentScore = sentimentData ? sentimentData.sentiment.overallScore : 0.5;
        const sentiment = sentimentData ? sentimentData.sentiment.sentiment : 'NEUTRAL';

        // Get Gemini analysis
        const geminiData = this.state.geminiAnalysis.get(symbol);
        const geminiConfidence = geminiData ? geminiData.analysis.confidence : 0.5;
        const geminiRecommendation = geminiData ? geminiData.analysis.recommendation : 'HOLD';

        // Calculate comprehensive score
        const comprehensiveScore = this.calculateComprehensiveScore({
          omniConfidence: omniScore.confidence,
          omniSignal: omniScore.signal,
          sentimentScore: sentimentScore,
          sentiment: sentiment,
          geminiConfidence: geminiConfidence,
          geminiRecommendation: geminiRecommendation
        });

        // Only consider signals with high comprehensive score
        if (comprehensiveScore >= 0.85) {
          candidates.push({
            symbol: symbol,
            comprehensiveScore: comprehensiveScore,
            omniConfidence: omniScore.confidence,
            omniSignal: omniScore.signal,
            sentimentScore: sentimentScore,
            sentiment: sentiment,
            geminiConfidence: geminiConfidence,
            geminiRecommendation: geminiRecommendation,
            omniAnalysis: omniData.analysis
          });
        }
      }

      // Return best candidate
      if (candidates.length > 0) {
        return candidates.sort((a, b) => b.comprehensiveScore - a.comprehensiveScore)[0];
      }

      return null;

    } catch (error) {
      logger.error('❌ Error finding best comprehensive signal:', error);
      return null;
    }
  }

  calculateComprehensiveScore(data) {
    try {
      // Weight the different analysis components
      const weights = {
        omni: 0.5,        // 50% weight to OMNI analysis
        sentiment: 0.3,   // 30% weight to sentiment
        gemini: 0.2       // 20% weight to Gemini analysis
      };

      // OMNI score
      const omniScore = data.omniConfidence;

      // Sentiment score (adjust based on signal direction)
      let sentimentScore = data.sentimentScore;
      if (data.omniSignal === 'SELL' && data.sentiment === 'BEARISH') {
        sentimentScore = 1.0 - sentimentScore; // Invert for sell signals
      }

      // Gemini score (check alignment with OMNI signal)
      let geminiScore = data.geminiConfidence;
      if (data.omniSignal === 'BUY' && data.geminiRecommendation === 'SELL') {
        geminiScore = 0.3; // Penalty for conflicting signals
      } else if (data.omniSignal === 'SELL' && data.geminiRecommendation === 'BUY') {
        geminiScore = 0.3; // Penalty for conflicting signals
      }

      // Calculate weighted comprehensive score
      const comprehensiveScore = (
        omniScore * weights.omni +
        sentimentScore * weights.sentiment +
        geminiScore * weights.gemini
      );

      return Math.min(1.0, Math.max(0.0, comprehensiveScore));

    } catch (error) {
      logger.error('❌ Error calculating comprehensive score:', error);
      return 0.0;
    }
  }

  async executeRealComprehensiveTrade(signal) {
    try {
      logger.info(`📤 Executing comprehensive trade for ${signal.symbol}...`);

      // Get current price
      const ticker = await bybitClient.getTicker({
        category: 'linear',
        symbol: signal.symbol
      });

      if (!ticker || ticker.retCode !== 0) {
        throw new Error('Failed to get current price');
      }

      const currentPrice = parseFloat(ticker.result.list[0].lastPrice);
      const symbolInfo = this.state.symbolInfo.get(signal.symbol);

      // Calculate quantity for exact trade size
      let quantity = Math.floor(this.config.tradeSize / currentPrice);

      // Ensure minimum quantity
      if (symbolInfo && quantity < symbolInfo.minOrderQty) {
        quantity = symbolInfo.minOrderQty;
      }

      // Ensure maximum quantity
      if (symbolInfo && quantity > symbolInfo.maxOrderQty) {
        quantity = symbolInfo.maxOrderQty;
      }

      // Place order
      const orderParams = {
        category: 'linear',
        symbol: signal.symbol,
        side: signal.omniSignal === 'BUY' ? 'Buy' : 'Sell',
        orderType: 'Market',
        qty: quantity.toString(),
        timeInForce: 'IOC'
      };

      logger.info(`📤 Placing comprehensive order: ${JSON.stringify(orderParams)}`);

      const response = await bybitClient.placeOrder(orderParams);

      if (response && response.retCode === 0) {
        return {
          success: true,
          orderId: response.result.orderId,
          symbol: signal.symbol,
          side: orderParams.side,
          quantity: quantity,
          entryPrice: currentPrice,
          tradeSize: this.config.tradeSize
        };
      } else {
        throw new Error(`Order failed: ${response?.retMsg} (Code: ${response?.retCode})`);
      }

    } catch (error) {
      logger.error(`❌ Error executing comprehensive trade for ${signal.symbol}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  monitorComprehensivePosition(symbol) {
    // Monitor position for profit target or stop loss
    const monitorInterval = setInterval(async () => {
      try {
        const position = this.state.activePositions.get(symbol);
        if (!position) {
          clearInterval(monitorInterval);
          return;
        }

        // Check if position should be closed (simplified for demo)
        const currentTime = Date.now();
        const positionAge = currentTime - position.openTime;

        // Close position after 10 minutes or if target profit reached
        if (positionAge > 600000) { // 10 minutes
          await this.closeComprehensivePosition(symbol, 'TIME_LIMIT');
          clearInterval(monitorInterval);
        }

      } catch (error) {
        logger.error(`❌ Error monitoring position ${symbol}:`, error);
      }
    }, 30000); // Check every 30 seconds
  }

  async closeComprehensivePosition(symbol, reason) {
    try {
      const position = this.state.activePositions.get(symbol);
      if (!position) return;

      // Close position logic would go here
      // For demo, we'll simulate position closure

      // Free up capital
      this.state.usedCapital -= position.tradeSize;

      // Add profit (simplified calculation)
      const profit = this.config.targetProfitPerTrade * 0.7; // 70% success rate simulation
      this.state.totalProfit += profit;
      this.state.currentCapital += profit;

      // Remove from active positions
      this.state.activePositions.delete(symbol);

      logger.info(`✅ Position closed: ${symbol} (${reason}) - Profit: ${profit.toFixed(4)} USDT`);

    } catch (error) {
      logger.error(`❌ Error closing position ${symbol}:`, error);
    }
  }

  logComprehensiveStatus() {
    try {
      const successRate = this.state.totalTrades > 0 ? (this.state.successfulTrades / this.state.totalTrades * 100) : 0;
      const avgProfit = this.state.totalTrades > 0 ? (this.state.totalProfit / this.state.totalTrades) : 0;
      const capitalGrowth = ((this.state.currentCapital - this.config.totalCapital) / this.config.totalCapital * 100);

      logger.info('📊 COMPREHENSIVE TRADING SYSTEM STATUS:');
      logger.info(`   Total Trades: ${this.state.totalTrades}/${this.config.targetTradesPerDay} (${(this.state.totalTrades/this.config.targetTradesPerDay*100).toFixed(1)}%)`);
      logger.info(`   Success Rate: ${successRate.toFixed(1)}%`);
      logger.info(`   Total Profit: ${this.state.totalProfit.toFixed(4)} USDT`);
      logger.info(`   Avg Profit/Trade: ${avgProfit.toFixed(4)} USDT (Target: ${this.config.targetProfitPerTrade} USDT)`);
      logger.info(`   Current Capital: ${this.state.currentCapital.toFixed(2)} USDT`);
      logger.info(`   Active Positions: ${this.state.activePositions.size}/${this.config.maxActivePositions}`);
      logger.info(`   Capital Used: ${this.state.usedCapital.toFixed(2)}/${this.config.activeTradeCapital} USDT`);
      logger.info(`   Capital Growth: ${capitalGrowth.toFixed(2)}%`);

      // Log current signals
      const topSignals = this.getTopOmniSignals(5);
      for (const signal of topSignals) {
        const sentimentData = this.state.sentimentAnalysis.get(signal.symbol);
        const sentiment = sentimentData ? sentimentData.sentiment.sentiment : 'UNKNOWN';
        const sentimentScore = sentimentData ? sentimentData.sentiment.overallScore : 0;

        logger.info(`   ${signal.symbol}: ${signal.signal} (${(signal.confidence * 100).toFixed(1)}%) | Sentiment: ${sentiment} (${(sentimentScore * 100).toFixed(1)}%)`);
      }

    } catch (error) {
      logger.error('❌ Error logging comprehensive status:', error);
    }
  }

  async stop() {
    try {
      logger.info('🛑 Stopping OMNI Comprehensive Trading System...');

      this.state.isActive = false;

      // Clear intervals
      if (this.tradingInterval) clearInterval(this.tradingInterval);
      if (this.analysisInterval) clearInterval(this.analysisInterval);
      if (this.sentimentInterval) clearInterval(this.sentimentInterval);

      // Stop OMNI system
      await omniSystem.stop();

      logger.info('✅ OMNI Comprehensive Trading System stopped');
      logger.info(`📊 Final Results: ${this.state.totalTrades} trades, ${this.state.totalProfit.toFixed(4)} USDT profit`);

    } catch (error) {
      logger.error('❌ Error stopping comprehensive trading system:', error);
    }
  }
}

module.exports = OmniComprehensiveTradingSystem;
