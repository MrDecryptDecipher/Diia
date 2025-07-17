const express = require('express');
const router = express.Router();
const tradingStrategyService = require('../../services/trading-strategy-service');
const logger = require('../../utils/logger');

/**
 * Test endpoint for manual trade execution
 */
router.post('/execute-trade', async (req, res) => {
  try {
    const { symbol, side, quantity } = req.body;
    
    if (!symbol || !side || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: symbol, side, quantity'
      });
    }

    logger.info(`Manual trade test: ${symbol} ${side} ${quantity}`);
    
    const result = await tradingStrategyService.executeTrade(symbol, side, quantity);
    
    res.json({
      success: true,
      trade: result
    });
  } catch (error) {
    logger.error(`Test trade execution error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Test endpoint for market analysis
 */
router.get('/analyze-market/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    logger.info(`Market analysis test for: ${symbol}`);
    
    const analysis = await tradingStrategyService.analyzeMarket(symbol);
    
    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    logger.error(`Test market analysis error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Test endpoint for symbol selection
 */
router.get('/select-symbol', async (req, res) => {
  try {
    logger.info('Symbol selection test');
    
    const symbol = await tradingStrategyService.selectOptimalSymbol();
    
    res.json({
      success: true,
      symbol
    });
  } catch (error) {
    logger.error(`Test symbol selection error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Comprehensive multi-asset testing endpoint
 */
router.get('/multi-asset-analysis', async (req, res) => {
  try {
    logger.info('🔬 Starting comprehensive multi-asset analysis test...');
    
    // Get all eligible assets
    const eligibleAssets = await tradingStrategyService.getAllEligibleAssets();
    
    // Test asset filtering
    const filteringResults = {
      totalAssets: eligibleAssets.length,
      topAssets: eligibleAssets.slice(0, 10),
      assetCategories: {}
    };
    
    // Categorize assets
    eligibleAssets.forEach(asset => {
      const base = asset.symbol.replace('USDT', '');
      let category = 'other';
      if (['BTC', 'ETH', 'BNB'].includes(base)) category = 'major';
      else if (['SOL', 'ADA', 'DOT', 'AVAX', 'MATIC'].includes(base)) category = 'layer1';
      else if (['UNI', 'SUSHI', 'AAVE', 'COMP'].includes(base)) category = 'defi';
      else if (['LINK', 'BAND', 'API3'].includes(base)) category = 'oracle';
      
      if (!filteringResults.assetCategories[category]) {
        filteringResults.assetCategories[category] = 0;
      }
      filteringResults.assetCategories[category]++;
    });
    
    // Test trading opportunities identification
    const opportunities = await tradingStrategyService.identifyTradingOpportunities();
    
    // Test market analysis for top 5 assets
    const marketAnalysis = [];
    for (let i = 0; i < Math.min(5, eligibleAssets.length); i++) {
      try {
        const analysis = await tradingStrategyService.analyzeMarket(eligibleAssets[i].symbol);
        marketAnalysis.push({
          symbol: eligibleAssets[i].symbol,
          analysis
        });
      } catch (error) {
        marketAnalysis.push({
          symbol: eligibleAssets[i].symbol,
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: {
        assetFiltering: filteringResults,
        tradingOpportunities: {
          count: opportunities.length,
          opportunities: opportunities.slice(0, 5) // Top 5 opportunities
        },
        marketAnalysis,
        systemState: await tradingStrategyService.getTradingState()
      }
    });
    
  } catch (error) {
    logger.error(`Multi-asset analysis test error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Portfolio management testing endpoint
 */
router.get('/portfolio-test', async (req, res) => {
  try {
    logger.info('🔬 Testing portfolio management...');
    
    const state = await tradingStrategyService.getTradingState();
    
    // Test position limits
    const positionLimits = {
      maxConcurrentPositions: 5,
      currentPositions: state.openTrades.length,
      canOpenNewPosition: state.openTrades.length < 5
    };
    
    // Test capital allocation
    const capitalAllocation = {};
    const totalCapital = state.currentCapital || 12; // Default to 12 USDT if not set
    if (state.multiAsset && state.multiAsset.capitalAllocationByAsset) {
      Object.entries(state.multiAsset.capitalAllocationByAsset).forEach(([asset, allocation]) => {
        capitalAllocation[asset] = {
          allocated: allocation,
          percentage: (allocation / totalCapital * 100).toFixed(2) + '%',
          withinLimit: allocation / totalCapital <= 0.20
        };
      });
    }
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      portfolioState: {
        positionLimits,
        capitalAllocation,
        totalCapital: totalCapital,
        openTrades: state.openTrades.map(trade => ({
          symbol: trade.symbol,
          side: trade.side,
          quantity: trade.quantity,
          positionValue: trade.positionValue
        }))
      }
    });
    
  } catch (error) {
    logger.error(`Portfolio test error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Performance metrics testing endpoint
 */
router.get('/performance-test', async (req, res) => {
  try {
    logger.info('🔬 Testing performance metrics...');
    
    const state = await tradingStrategyService.getTradingState();
    
    // Calculate trading frequency
    const now = Date.now();
    const recentTrades = state.tradeHistory.filter(trade => 
      now - trade.timestamp < 60000 // Last minute
    );
    
    const performanceMetrics = {
      tradingFrequency: {
        tradesLastMinute: recentTrades.length,
        totalTrades: state.tradeHistory.length,
        averageInterval: state.adaptiveTradeInterval,
        targetFrequency: '10-20 trades/minute'
      },
      successRate: {
        totalTrades: state.tradeHistory.length,
        successfulTrades: state.tradeHistory.filter(t => t.status === 'executed').length,
        winRate: state.tradeHistory.length > 0 ? 
          (state.tradeHistory.filter(t => t.status === 'executed').length / state.tradeHistory.length * 100).toFixed(2) + '%' : '0%'
      },
      systemEfficiency: {
        efficiency: state.systemEfficiency + '%',
        consecutiveSuccesses: state.consecutiveSuccessfulTrades,
        lastTradeTime: state.lastTradeTime ? new Date(state.lastTradeTime).toISOString() : 'Never'
      }
    };
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      performanceMetrics
    });
    
  } catch (error) {
    logger.error(`Performance test error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Asset rotation testing endpoint
 */
router.get('/asset-rotation-test', async (req, res) => {
  try {
    logger.info('🔬 Testing asset rotation mechanism...');

    // Force asset rotation
    await tradingStrategyService.rotateAssetFocus();

    const state = await tradingStrategyService.getTradingState();

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      rotationResults: {
        eligibleAssetsCount: state.multiAsset ? state.multiAsset.eligibleAssets.length : 0,
        lastRotationTime: state.multiAsset ? new Date(state.multiAsset.lastRotationTime).toISOString() : 'Never',
        rotationInterval: '60000ms (1 minute)',
        marketDataCacheCleared: true
      }
    });

  } catch (error) {
    logger.error(`Asset rotation test error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Stress testing endpoint - simulates high load
 */
router.get('/stress-test', async (req, res) => {
  try {
    logger.info('🔬 Starting stress test...');

    const startTime = Date.now();
    const results = {
      assetAnalysisTests: [],
      marketAnalysisTests: [],
      opportunityIdentificationTests: [],
      errors: []
    };

    // Test asset analysis under load
    for (let i = 0; i < 5; i++) {
      try {
        const start = Date.now();
        const assets = await tradingStrategyService.getAllEligibleAssets();
        const duration = Date.now() - start;
        results.assetAnalysisTests.push({
          iteration: i + 1,
          assetsFound: assets.length,
          duration: duration + 'ms'
        });
      } catch (error) {
        results.errors.push(`Asset analysis ${i + 1}: ${error.message}`);
      }
    }

    // Test opportunity identification under load
    for (let i = 0; i < 3; i++) {
      try {
        const start = Date.now();
        const opportunities = await tradingStrategyService.identifyTradingOpportunities();
        const duration = Date.now() - start;
        results.opportunityIdentificationTests.push({
          iteration: i + 1,
          opportunitiesFound: opportunities.length,
          duration: duration + 'ms'
        });
      } catch (error) {
        results.errors.push(`Opportunity identification ${i + 1}: ${error.message}`);
      }
    }

    const totalDuration = Date.now() - startTime;

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      stressTestResults: {
        totalDuration: totalDuration + 'ms',
        ...results,
        summary: {
          totalTests: results.assetAnalysisTests.length + results.opportunityIdentificationTests.length,
          totalErrors: results.errors.length,
          averageAssetAnalysisDuration: results.assetAnalysisTests.length > 0 ?
            Math.round(results.assetAnalysisTests.reduce((sum, test) => sum + parseInt(test.duration), 0) / results.assetAnalysisTests.length) + 'ms' : 'N/A'
        }
      }
    });

  } catch (error) {
    logger.error(`Stress test error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Clear positions for testing (CAUTION: This will close all positions)
 */
router.post('/clear-positions', async (req, res) => {
  try {
    logger.info('🔬 Clearing positions for testing...');

    const state = await tradingStrategyService.getTradingState();
    const clearedPositions = state.openTrades.length;

    // Clear the positions from the trading state
    state.openTrades = [];
    if (state.multiAsset) {
      state.multiAsset.capitalAllocationByAsset = {};
    }

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      result: {
        clearedPositions,
        message: 'Positions cleared for testing purposes'
      }
    });

  } catch (error) {
    logger.error(`Clear positions test error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Comprehensive system health check
 */
router.get('/health-check', async (req, res) => {
  try {
    logger.info('🔬 Performing comprehensive health check...');

    const healthCheck = {
      timestamp: new Date().toISOString(),
      components: {}
    };

    // Test trading strategy service
    try {
      const state = await tradingStrategyService.getTradingState();
      healthCheck.components.tradingStrategy = {
        status: 'healthy',
        totalCapital: state.totalCapital,
        openTrades: state.openTrades.length,
        systemEfficiency: state.systemEfficiency
      };
    } catch (error) {
      healthCheck.components.tradingStrategy = {
        status: 'error',
        error: error.message
      };
    }

    // Test asset filtering
    try {
      const assets = await tradingStrategyService.getAllEligibleAssets();
      healthCheck.components.assetFiltering = {
        status: 'healthy',
        eligibleAssets: assets.length
      };
    } catch (error) {
      healthCheck.components.assetFiltering = {
        status: 'error',
        error: error.message
      };
    }

    // Test opportunity identification
    try {
      const opportunities = await tradingStrategyService.identifyTradingOpportunities();
      healthCheck.components.opportunityIdentification = {
        status: 'healthy',
        opportunities: opportunities.length
      };
    } catch (error) {
      healthCheck.components.opportunityIdentification = {
        status: 'error',
        error: error.message
      };
    }

    // Overall health status
    const allHealthy = Object.values(healthCheck.components).every(comp => comp.status === 'healthy');
    healthCheck.overallStatus = allHealthy ? 'healthy' : 'degraded';

    res.json({
      success: true,
      healthCheck
    });

  } catch (error) {
    logger.error(`Health check error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Reset trading state for testing
 */
router.post('/reset-trading-state', async (req, res) => {
  try {
    logger.info('🔧 Resetting trading state for testing...');

    // Force reset trading timing
    await tradingStrategyService.forceResetTradingTiming();

    // Reset trading state directly using the service method
    await tradingStrategyService.resetTradingStateForTesting();

    // Get the updated state to confirm reset
    const state = await tradingStrategyService.getTradingState();

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      result: {
        message: 'Trading state reset successfully',
        dailyTradeCount: state.dailyTradeCount,
        lastTradeTime: state.lastTradeTime,
        currentCapital: state.currentCapital,
        openTrades: state.openTrades.length
      }
    });

  } catch (error) {
    logger.error(`Reset trading state error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
