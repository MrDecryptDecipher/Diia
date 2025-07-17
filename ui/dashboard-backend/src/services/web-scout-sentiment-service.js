/**
 * WEB SCOUT SENTIMENT ANALYSIS SERVICE
 * 
 * Real-time sentiment analysis using Web Scout MCP for OMNI trading system.
 * Provides accurate sentiment data for trading decisions.
 */

const { spawn } = require('child_process');
const logger = require('../utils/logger');

class WebScoutSentimentService {
  constructor() {
    this.cache = new Map();
    this.CACHE_DURATION = 300000; // 5 minutes cache
    this.isInitialized = false;
  }

  /**
   * Initialize the sentiment service
   */
  async initialize() {
    try {
      logger.info('🌐 Initializing Web Scout Sentiment Service...');
      
      // Test Web Scout MCP connection
      await this.testWebScoutConnection();
      
      this.isInitialized = true;
      logger.info('✅ Web Scout Sentiment Service initialized successfully');
      
    } catch (error) {
      logger.error('❌ Failed to initialize Web Scout Sentiment Service:', error);
      throw error;
    }
  }

  /**
   * Test Web Scout MCP connection
   */
  async testWebScoutConnection() {
    return new Promise((resolve, reject) => {
      const webScout = spawn('web-scout-mcp', [], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let error = '';

      webScout.stdout.on('data', (data) => {
        output += data.toString();
      });

      webScout.stderr.on('data', (data) => {
        error += data.toString();
      });

      webScout.on('close', (code) => {
        if (code === 0 || output.includes('jsonrpc')) {
          resolve(true);
        } else {
          reject(new Error(`Web Scout MCP test failed: ${error}`));
        }
      });

      // Send a simple test request
      const testRequest = {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list"
      };

      webScout.stdin.write(JSON.stringify(testRequest) + '\n');
      webScout.stdin.end();

      setTimeout(() => {
        webScout.kill();
        reject(new Error('Web Scout MCP test timeout'));
      }, 10000);
    });
  }

  /**
   * Get sentiment analysis for a cryptocurrency asset
   */
  async getSentimentAnalysis(asset) {
    try {
      // Check cache first
      const cached = this.cache.get(asset);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.data;
      }

      logger.info(`🔍 Analyzing sentiment for ${asset}...`);

      // Perform sentiment analysis using Web Scout MCP
      const sentimentData = await this.performWebScoutAnalysis(asset);

      // Cache the result
      this.cache.set(asset, {
        data: sentimentData,
        timestamp: Date.now()
      });

      return sentimentData;

    } catch (error) {
      logger.error(`❌ Sentiment analysis failed for ${asset}:`, error);
      return this.getDefaultSentiment(asset);
    }
  }

  /**
   * Perform Web Scout MCP sentiment analysis
   */
  async performWebScoutAnalysis(asset) {
    return new Promise((resolve, reject) => {
      const webScout = spawn('web-scout-mcp', [], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let error = '';

      webScout.stdout.on('data', (data) => {
        output += data.toString();
      });

      webScout.stderr.on('data', (data) => {
        error += data.toString();
      });

      webScout.on('close', (code) => {
        try {
          if (output.trim()) {
            const results = this.parseWebScoutResponse(output, asset);
            resolve(results);
          } else {
            resolve(this.getDefaultSentiment(asset));
          }
        } catch (parseError) {
          logger.error(`Failed to parse Web Scout response: ${parseError.message}`);
          resolve(this.getDefaultSentiment(asset));
        }
      });

      // Enhanced sentiment queries
      const queries = [
        `${asset} cryptocurrency sentiment analysis twitter reddit bullish bearish`,
        `${asset} crypto price prediction market analysis latest news`,
        `${asset} social media sentiment crypto community discussion`
      ];

      const mcpRequest = {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "DuckDuckGoWebSearch",
          arguments: {
            query: queries[0],
            maxResults: 5
          }
        }
      };

      webScout.stdin.write(JSON.stringify(mcpRequest) + '\n');
      webScout.stdin.end();

      setTimeout(() => {
        webScout.kill();
        resolve(this.getDefaultSentiment(asset));
      }, 15000);
    });
  }

  /**
   * Parse Web Scout MCP response and extract sentiment
   */
  parseWebScoutResponse(output, asset) {
    try {
      const lines = output.trim().split('\n');
      const lastLine = lines[lines.length - 1];
      const response = JSON.parse(lastLine);

      if (response.result && response.result.content) {
        const searchText = response.result.content[0].text;
        return this.analyzeSentimentFromText(searchText, asset);
      }

      return this.getDefaultSentiment(asset);

    } catch (error) {
      logger.error(`Error parsing Web Scout response: ${error.message}`);
      return this.getDefaultSentiment(asset);
    }
  }

  /**
   * Analyze sentiment from search results text
   */
  analyzeSentimentFromText(text, asset) {
    const positiveKeywords = [
      'bullish', 'buy', 'pump', 'moon', 'surge', 'rally', 'breakout', 'support',
      'uptrend', 'positive', 'optimistic', 'strong', 'growth', 'rise', 'gain'
    ];

    const negativeKeywords = [
      'bearish', 'sell', 'dump', 'crash', 'drop', 'fall', 'resistance',
      'downtrend', 'negative', 'pessimistic', 'weak', 'decline', 'loss'
    ];

    const textLower = text.toLowerCase();
    let positiveScore = 0;
    let negativeScore = 0;

    // Count positive keywords
    positiveKeywords.forEach(keyword => {
      const matches = (textLower.match(new RegExp(keyword, 'g')) || []).length;
      positiveScore += matches;
    });

    // Count negative keywords
    negativeKeywords.forEach(keyword => {
      const matches = (textLower.match(new RegExp(keyword, 'g')) || []).length;
      negativeScore += matches;
    });

    const totalScore = positiveScore + negativeScore;
    const sentimentScore = totalScore > 0 ? positiveScore / totalScore : 0.5;

    // Determine recommendation
    let recommendation = 'NEUTRAL';
    let confidence = 0.5;

    if (sentimentScore > 0.7) {
      recommendation = 'STRONG_BUY';
      confidence = Math.min(0.9, 0.6 + (sentimentScore - 0.7) * 2);
    } else if (sentimentScore > 0.6) {
      recommendation = 'BUY';
      confidence = Math.min(0.8, 0.5 + (sentimentScore - 0.6) * 3);
    } else if (sentimentScore < 0.3) {
      recommendation = 'STRONG_SELL';
      confidence = Math.min(0.9, 0.6 + (0.3 - sentimentScore) * 2);
    } else if (sentimentScore < 0.4) {
      recommendation = 'SELL';
      confidence = Math.min(0.8, 0.5 + (0.4 - sentimentScore) * 3);
    }

    return {
      asset: asset,
      sentimentScore: sentimentScore,
      recommendation: recommendation,
      confidence: confidence,
      positiveSignals: positiveScore,
      negativeSignals: negativeScore,
      totalSignals: totalScore,
      timestamp: new Date().toISOString(),
      source: 'web_scout_mcp'
    };
  }

  /**
   * Get default sentiment when analysis fails
   */
  getDefaultSentiment(asset) {
    return {
      asset: asset,
      sentimentScore: 0.5,
      recommendation: 'NEUTRAL',
      confidence: 0.1,
      positiveSignals: 0,
      negativeSignals: 0,
      totalSignals: 0,
      timestamp: new Date().toISOString(),
      source: 'default',
      error: 'Analysis failed, using default neutral sentiment'
    };
  }

  /**
   * Get batch sentiment analysis for multiple assets
   */
  async getBatchSentimentAnalysis(assets) {
    const results = {};
    
    for (const asset of assets) {
      try {
        results[asset] = await this.getSentimentAnalysis(asset);
        // Add small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        logger.error(`Failed to get sentiment for ${asset}:`, error);
        results[asset] = this.getDefaultSentiment(asset);
      }
    }

    return results;
  }

  /**
   * Clear sentiment cache
   */
  clearCache() {
    this.cache.clear();
    logger.info('🧹 Sentiment cache cleared');
  }
}

module.exports = new WebScoutSentimentService();
