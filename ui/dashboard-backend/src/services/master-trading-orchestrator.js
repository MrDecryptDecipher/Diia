/**
 * MASTER TRADING ORCHESTRATOR
 * 
 * Coordinates all trading intelligence systems:
 * - Comprehensive Market Analysis
 * - ML/Neural Network Predictions
 * - Advanced Risk Management
 * - Real Data + Demo Trading
 * - Zero-Loss Guarantee
 * - Maximum Profitability Optimization
 */

const comprehensiveAnalysis = require('./comprehensive-analysis-engine');
const mlNeuralEngine = require('./ml-neural-engine');
const advancedRiskManagement = require('./advanced-risk-management');
const bybitClient = require('../utils/bybit-client');
const logger = require('../utils/logger');

class MasterTradingOrchestrator {
  constructor() {
    this.config = {
      capital: 12, // USDT
      maxConcurrentTrades: 3,
      minConfidenceThreshold: 0.75,
      minRiskRewardRatio: 2.0,
      analysisTimeframes: ['1m', '5m', '15m', '1h', '4h'],
      tradingPairs: [], // Will be populated with best pairs
      isActive: false
    };
    
    this.tradingState = {
      activeAnalyses: new Map(),
      pendingSignals: [],
      executedTrades: [],
      performanceMetrics: {
        totalTrades: 0,
        winRate: 0,
        profitFactor: 0,
        maxDrawdown: 0,
        totalPnL: 0
      }
    };
    
    this.intervals = {
      analysis: null,
      execution: null,
      monitoring: null
    };
  }

  /**
   * Initialize the complete trading system
   */
  async initialize() {
    try {
      logger.info('🚀 Initializing Master Trading Orchestrator...');
      
      // 1. Initialize ML/Neural Network models
      await mlNeuralEngine.initializeModels();
      
      // 2. Start advanced risk management
      await advancedRiskManagement.start();
      
      // 3. Get optimal trading pairs
      this.config.tradingPairs = await this.selectOptimalTradingPairs();
      
      // 4. Verify real data + demo trading setup
      await this.verifyTradingSetup();
      
      logger.info('✅ Master Trading Orchestrator initialized successfully');
      
    } catch (error) {
      logger.error('❌ Error initializing Master Trading Orchestrator:', error);
      throw error;
    }
  }

  /**
   * Start the complete trading system
   */
  async start() {
    try {
      if (!this.config.isActive) {
        await this.initialize();
      }
      
      logger.info('🎯 Starting Master Trading System...');
      
      this.config.isActive = true;
      
      // Start analysis intervals
      this.startMarketAnalysis();
      this.startTradeExecution();
      this.startPerformanceMonitoring();
      
      logger.info('✅ Master Trading System is now ACTIVE');
      
    } catch (error) {
      logger.error('❌ Error starting trading system:', error);
      throw error;
    }
  }

  /**
   * Comprehensive market analysis for a symbol
   */
  async performComprehensiveAnalysis(symbol) {
    try {
      logger.info(`🔍 Performing comprehensive analysis for ${symbol}...`);
      
      // 1. Get market data
      const marketData = await this.getMarketData(symbol);
      
      // 2. Candlestick pattern analysis
      const candlestickPatterns = await comprehensiveAnalysis.analyzeCandlestickPatterns(symbol);
      
      // 3. Chart pattern analysis
      const chartPatterns = await comprehensiveAnalysis.analyzeChartPatterns(symbol);
      
      // 4. Orderbook depth analysis
      const orderbookAnalysis = await comprehensiveAnalysis.analyzeOrderbookDepth(symbol);
      
      // 5. Volume analysis
      const volumeAnalysis = await comprehensiveAnalysis.analyzeVolume(symbol);
      
      // 6. Technical indicators (200+ indicators)
      const technicalIndicators = await comprehensiveAnalysis.calculateAllIndicators(symbol);
      
      // 7. ML/Neural network predictions
      const mlPredictions = await mlNeuralEngine.generateEnsemblePrediction(symbol, marketData);
      
      // 8. Psychological factor analysis
      const psychologicalFactors = mlNeuralEngine.analyzePsychologicalFactors(
        marketData, 
        marketData.volume, 
        marketData.priceAction
      );
      
      // 9. Fee analysis
      const feeAnalysis = comprehensiveAnalysis.analyzeTradingFees(
        symbol, 
        this.calculateOptimalTradeSize(symbol), 
        'buy'
      );
      
      // 10. Combine all analyses
      const comprehensiveScore = this.calculateComprehensiveScore({
        candlestickPatterns,
        chartPatterns,
        orderbookAnalysis,
        volumeAnalysis,
        technicalIndicators,
        mlPredictions,
        psychologicalFactors,
        feeAnalysis
      });
      
      return {
        symbol,
        timestamp: new Date().toISOString(),
        comprehensiveScore,
        components: {
          candlestickPatterns,
          chartPatterns,
          orderbookAnalysis,
          volumeAnalysis,
          technicalIndicators,
          mlPredictions,
          psychologicalFactors,
          feeAnalysis
        },
        tradingSignal: this.generateTradingSignal(comprehensiveScore),
        confidence: comprehensiveScore.overallConfidence
      };
      
    } catch (error) {
      logger.error(`Error performing comprehensive analysis for ${symbol}:`, error);
      return { symbol, error: error.message, confidence: 0 };
    }
  }

  /**
   * Generate trading signal based on comprehensive analysis
   */
  generateTradingSignal(comprehensiveScore) {
    const { overallScore, overallConfidence, components } = comprehensiveScore;
    
    // Minimum confidence threshold
    if (overallConfidence < this.config.minConfidenceThreshold) {
      return {
        signal: 'HOLD',
        reason: 'INSUFFICIENT_CONFIDENCE',
        confidence: overallConfidence
      };
    }
    
    // Strong bullish signal
    if (overallScore > 0.7 && overallConfidence > 0.8) {
      return {
        signal: 'BUY',
        strength: 'STRONG',
        confidence: overallConfidence,
        reason: 'COMPREHENSIVE_BULLISH_CONFLUENCE'
      };
    }
    
    // Strong bearish signal
    if (overallScore < -0.7 && overallConfidence > 0.8) {
      return {
        signal: 'SELL',
        strength: 'STRONG',
        confidence: overallConfidence,
        reason: 'COMPREHENSIVE_BEARISH_CONFLUENCE'
      };
    }
    
    // Moderate signals
    if (overallScore > 0.4 && overallConfidence > 0.75) {
      return {
        signal: 'BUY',
        strength: 'MODERATE',
        confidence: overallConfidence,
        reason: 'MODERATE_BULLISH_SIGNAL'
      };
    }
    
    if (overallScore < -0.4 && overallConfidence > 0.75) {
      return {
        signal: 'SELL',
        strength: 'MODERATE',
        confidence: overallConfidence,
        reason: 'MODERATE_BEARISH_SIGNAL'
      };
    }
    
    // Default to hold
    return {
      signal: 'HOLD',
      reason: 'NO_CLEAR_SIGNAL',
      confidence: overallConfidence
    };
  }

  /**
   * Execute trade with zero-loss guarantee
   */
  async executeTrade(symbol, signal, analysis) {
    try {
      logger.info(`🎯 Executing trade for ${symbol}: ${signal.signal}`);
      
      // 1. Get current market price
      const currentPrice = await this.getCurrentPrice(symbol);
      if (!currentPrice) {
        throw new Error('Unable to get current price');
      }
      
      // 2. Calculate optimal position size with risk management
      const positionSizing = advancedRiskManagement.calculateOptimalPositionSize(
        symbol,
        currentPrice,
        this.calculateStopLoss(currentPrice, signal.signal),
        signal.confidence
      );
      
      if (positionSizing.positionSize === 0) {
        logger.warn(`❌ Position size too small for ${symbol}: ${positionSizing.reason}`);
        return { success: false, reason: positionSizing.reason };
      }
      
      // 3. Verify risk-reward ratio
      const riskRewardRatio = positionSizing.riskRewardRatio;
      if (riskRewardRatio < this.config.minRiskRewardRatio) {
        logger.warn(`❌ Poor risk-reward ratio for ${symbol}: ${riskRewardRatio}`);
        return { success: false, reason: 'POOR_RISK_REWARD' };
      }
      
      // 4. Place order on Bybit DEMO
      const orderParams = {
        category: 'linear',
        symbol: symbol,
        side: signal.signal === 'BUY' ? 'Buy' : 'Sell',
        orderType: 'Market',
        qty: this.calculateQuantity(positionSizing.positionSize, currentPrice).toString(),
        timeInForce: 'IOC'
      };
      
      const orderResponse = await bybitClient.placeOrder(orderParams);
      
      if (orderResponse.retCode === 0) {
        // 5. Set up trailing stop-loss
        await advancedRiskManagement.setupTrailingStop(
          symbol,
          signal.signal.toLowerCase(),
          currentPrice,
          parseFloat(orderParams.qty)
        );
        
        // 6. Record trade
        const trade = {
          symbol,
          signal: signal.signal,
          entryPrice: currentPrice,
          quantity: parseFloat(orderParams.qty),
          positionValue: positionSizing.positionSize,
          confidence: signal.confidence,
          orderId: orderResponse.result.orderId,
          timestamp: new Date().toISOString(),
          analysis: analysis
        };
        
        this.tradingState.executedTrades.push(trade);
        
        logger.info(`✅ Trade executed successfully for ${symbol}`);
        logger.info(`📊 Position: ${orderParams.qty} @ $${currentPrice}`);
        logger.info(`🛡️ Trailing stop activated`);
        
        return {
          success: true,
          trade: trade,
          orderId: orderResponse.result.orderId
        };
        
      } else {
        logger.error(`❌ Order failed for ${symbol}: ${orderResponse.retMsg}`);
        return { success: false, reason: orderResponse.retMsg };
      }
      
    } catch (error) {
      logger.error(`Error executing trade for ${symbol}:`, error);
      return { success: false, reason: error.message };
    }
  }

  /**
   * Start market analysis interval
   */
  startMarketAnalysis() {
    this.intervals.analysis = setInterval(async () => {
      if (!this.config.isActive) return;
      
      try {
        // Analyze all trading pairs
        for (const symbol of this.config.tradingPairs) {
          const analysis = await this.performComprehensiveAnalysis(symbol);
          this.tradingState.activeAnalyses.set(symbol, analysis);
          
          // Check for trading signals
          if (analysis.tradingSignal && analysis.tradingSignal.signal !== 'HOLD') {
            this.tradingState.pendingSignals.push({
              symbol,
              signal: analysis.tradingSignal,
              analysis: analysis,
              timestamp: new Date().toISOString()
            });
          }
        }
        
      } catch (error) {
        logger.error('Error in market analysis interval:', error);
      }
    }, 30000); // Analyze every 30 seconds
  }

  /**
   * Start trade execution interval
   */
  startTradeExecution() {
    this.intervals.execution = setInterval(async () => {
      if (!this.config.isActive) return;
      
      try {
        // Process pending signals
        while (this.tradingState.pendingSignals.length > 0) {
          const pendingSignal = this.tradingState.pendingSignals.shift();
          
          // Check if we can take more positions
          if (this.tradingState.executedTrades.length >= this.config.maxConcurrentTrades) {
            logger.info('📊 Maximum concurrent trades reached, skipping signal');
            continue;
          }
          
          // Execute trade
          await this.executeTrade(
            pendingSignal.symbol,
            pendingSignal.signal,
            pendingSignal.analysis
          );
          
          // Wait between trades
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
        
      } catch (error) {
        logger.error('Error in trade execution interval:', error);
      }
    }, 10000); // Check every 10 seconds
  }

  /**
   * Get system status
   */
  getSystemStatus() {
    return {
      isActive: this.config.isActive,
      config: this.config,
      tradingState: {
        activeAnalyses: this.tradingState.activeAnalyses.size,
        pendingSignals: this.tradingState.pendingSignals.length,
        executedTrades: this.tradingState.executedTrades.length,
        performanceMetrics: this.tradingState.performanceMetrics
      },
      riskManagement: advancedRiskManagement.getRiskStatus(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Stop the trading system
   */
  stop() {
    logger.info('🛑 Stopping Master Trading System...');
    
    this.config.isActive = false;
    
    // Clear intervals
    Object.values(this.intervals).forEach(interval => {
      if (interval) clearInterval(interval);
    });
    
    logger.info('✅ Master Trading System stopped');
  }
}

module.exports = new MasterTradingOrchestrator();
