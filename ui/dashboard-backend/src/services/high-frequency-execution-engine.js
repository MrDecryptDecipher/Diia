/**
 * ⚡ HIGH-FREQUENCY TRADING EXECUTION ENGINE - PHASE 5 IMPLEMENTATION
 * 
 * Implements high-frequency trading execution with exact specifications:
 * 
 * EXECUTION REQUIREMENTS:
 * - Environment: Bybit demo/testnet for execution, mainnet for data analysis
 * - Leverage: 50x-100x (dynamically selected based on volatility and confidence)
 * - Target Movements: 0.5%-0.8% price changes for profit capture
 * - Trading Frequency: 750+ trades/day (1 trade every ~115 seconds)
 * - Win Rate: 85-90% successful trades
 * - Order Validation: Provide actual Bybit demo order IDs as proof
 * 
 * CAPITAL MANAGEMENT INTEGRATION:
 * - Total Capital: Exactly 12.00 USDT
 * - Active Trading Capital: 10.00 USDT
 * - Trade Size: 5.00 USDT per position
 * - Maximum Concurrent Positions: 2
 * - Minimum Profit Target: 0.6 USDT per trade
 * 
 * PERFORMANCE TARGETS:
 * - 750+ trades/day execution capability
 * - 85-90% win rate achievement
 * - Verifiable demo order IDs for all trades
 * - Real-time position and PnL tracking
 */

const bybitClient = require('../utils/bybit-client');
const logger = require('../utils/logger');
const tradingConfig = require('../config/trading-config');
const comprehensiveAssetScanner = require('./comprehensive-asset-scanner');
const quantumEnhancedAnalysis = require('./quantum-enhanced-analysis');

class HighFrequencyExecutionEngine {
  constructor() {
    // PHASE 5 EXECUTION CONFIGURATION
    this.config = {
      // Trading frequency (750+ trades/day = 1 trade every ~115 seconds)
      targetTradesPerDay: 750,
      tradeIntervalMs: 115000, // 115 seconds between trades
      maxTradesPerHour: 32, // 750/24 ≈ 31.25, rounded up
      
      // Capital management (EXACT PHASE 2 SPECIFICATIONS)
      totalCapital: 12.0, // EXACT 12.00 USDT
      activeCapital: 10.0, // EXACT 10.00 USDT
      safetyBuffer: 2.0, // EXACT 2.00 USDT
      tradeSize: 5.0, // EXACT 5.00 USDT per trade
      maxConcurrentPositions: 2, // EXACT 2 positions maximum
      minProfitTarget: 0.6, // EXACT 0.600000 USDT minimum profit
      
      // Leverage and movement targets
      leverageRange: { min: 50, max: 100 }, // 50x-100x leverage
      targetMovements: { min: 0.5, max: 0.8 }, // 0.5%-0.8% movements
      
      // Performance targets
      targetWinRate: 87.5, // 85-90% win rate (target middle)
      maxDrawdown: 0.9, // 0.9% maximum drawdown
      confidenceThreshold: 75, // 75% minimum confidence for execution
      
      // Execution environment
      useDemo: true, // Bybit demo/testnet for execution
      useMainnetData: true, // Mainnet for data analysis
      orderValidation: true, // Verify all order IDs
    };
    
    // Execution state
    this.activePositions = new Map(); // symbol -> position details
    this.executionQueue = []; // Pending executions
    this.executionHistory = []; // Completed executions with order IDs
    this.dailyStats = {
      tradesExecuted: 0,
      successfulTrades: 0,
      totalProfit: 0,
      winRate: 0,
      lastResetDate: new Date().toDateString()
    };
    
    // Performance tracking
    this.performanceMetrics = {
      totalExecutions: 0,
      verifiedOrderIds: 0,
      averageExecutionTime: 0,
      realTimePositionTracking: true,
      capitalUtilization: 0
    };
    
    // Initialize execution engine
    this.initializeExecutionEngine();
  }
  
  /**
   * Initialize high-frequency execution engine
   */
  async initializeExecutionEngine() {
    logger.info('⚡ Initializing High-Frequency Trading Execution Engine for Phase 5');
    
    try {
      // Verify Bybit demo credentials
      await this.verifyDemoCredentials();
      
      // Initialize capital tracking
      await this.initializeCapitalTracking();
      
      // Start execution monitoring
      this.startExecutionMonitoring();
      
      // Start high-frequency trading loop
      this.startHighFrequencyTrading();
      
      logger.info('✅ High-Frequency Execution Engine initialized successfully');
      logger.info(`🎯 Target: ${this.config.targetTradesPerDay} trades/day with ${this.config.targetWinRate}% win rate`);
    } catch (error) {
      logger.error('❌ Failed to initialize High-Frequency Execution Engine:', error);
      throw error;
    }
  }
  
  /**
   * Execute high-frequency trade with comprehensive validation
   */
  async executeHighFrequencyTrade(opportunity) {
    const executionStart = Date.now();
    
    try {
      // Validate execution opportunity
      const validation = await this.validateExecutionOpportunity(opportunity);
      if (!validation.isValid) {
        logger.warn(`⚠️ Execution validation failed: ${validation.reason}`);
        return null;
      }
      
      // Calculate optimal leverage and position size
      const executionParams = await this.calculateExecutionParameters(opportunity);
      
      // Execute trade on Bybit demo
      const orderResult = await this.executeDemoTrade(executionParams);
      
      if (orderResult.success) {
        // Create execution record with verifiable order ID
        const execution = {
          id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          symbol: opportunity.symbol,
          direction: opportunity.direction,
          orderIds: {
            demo: orderResult.demoOrderId, // Verifiable demo order ID
            mainnet: null // Not used for execution, only data
          },
          executionParams,
          capitalAllocated: executionParams.positionSize,
          expectedProfit: executionParams.expectedProfit,
          leverage: executionParams.leverage,
          targetMovement: executionParams.targetMovement,
          confidence: opportunity.confidence,
          executionTime: Date.now() - executionStart,
          status: 'executed',
          verified: true
        };
        
        // Update active positions
        this.activePositions.set(opportunity.symbol, execution);
        
        // Add to execution history
        this.executionHistory.push(execution);
        
        // Update daily stats
        this.updateDailyStats(execution);
        
        // Update performance metrics
        this.updatePerformanceMetrics(execution);
        
        logger.info(`⚡ HIGH-FREQUENCY TRADE EXECUTED: ${opportunity.symbol} ${opportunity.direction.toUpperCase()}`);
        logger.info(`📊 Order ID: ${orderResult.demoOrderId} | Size: ${executionParams.positionSize} USDT | Leverage: ${executionParams.leverage}x`);
        logger.info(`🎯 Target: ${executionParams.targetMovement}% | Expected Profit: ${executionParams.expectedProfit} USDT`);
        
        return execution;
      } else {
        logger.error(`❌ Trade execution failed: ${orderResult.error}`);
        return null;
      }
      
    } catch (error) {
      logger.error(`❌ High-frequency execution error for ${opportunity.symbol}:`, error);
      return null;
    }
  }
  
  /**
   * Validate execution opportunity against Phase 5 criteria
   */
  async validateExecutionOpportunity(opportunity) {
    // Check if we have available capital
    const availableCapital = this.calculateAvailableCapital();
    if (availableCapital < this.config.tradeSize) {
      return {
        isValid: false,
        reason: `Insufficient capital: ${availableCapital} USDT < ${this.config.tradeSize} USDT required`
      };
    }
    
    // Check maximum concurrent positions
    if (this.activePositions.size >= this.config.maxConcurrentPositions) {
      return {
        isValid: false,
        reason: `Maximum concurrent positions reached: ${this.activePositions.size}/${this.config.maxConcurrentPositions}`
      };
    }
    
    // Check confidence threshold
    if (opportunity.confidence < this.config.confidenceThreshold) {
      return {
        isValid: false,
        reason: `Confidence ${opportunity.confidence}% below threshold ${this.config.confidenceThreshold}%`
      };
    }
    
    // Check target movement range
    const expectedMovement = Math.abs(opportunity.expectedMovement || 0);
    if (expectedMovement < this.config.targetMovements.min || expectedMovement > this.config.targetMovements.max) {
      return {
        isValid: false,
        reason: `Expected movement ${expectedMovement}% outside target range ${this.config.targetMovements.min}%-${this.config.targetMovements.max}%`
      };
    }
    
    // Check if symbol is already in position
    if (this.activePositions.has(opportunity.symbol)) {
      return {
        isValid: false,
        reason: `Position already exists for ${opportunity.symbol}`
      };
    }
    
    // Check daily trade limit
    if (this.dailyStats.tradesExecuted >= this.config.targetTradesPerDay) {
      return {
        isValid: false,
        reason: `Daily trade limit reached: ${this.dailyStats.tradesExecuted}/${this.config.targetTradesPerDay}`
      };
    }
    
    return {
      isValid: true,
      reason: 'All validation criteria met'
    };
  }
  
  /**
   * Calculate optimal execution parameters
   */
  async calculateExecutionParameters(opportunity) {
    const { symbol, expectedMovement, confidence, volatility } = opportunity;
    
    // Calculate optimal leverage based on volatility and confidence
    const baseLeverage = this.config.leverageRange.min;
    const maxLeverage = this.config.leverageRange.max;
    const confidenceFactor = confidence / 100;
    const volatilityFactor = Math.max(0.1, Math.min(1.0, volatility / 10));
    
    // Dynamic leverage calculation
    const optimalLeverage = Math.round(
      baseLeverage + (maxLeverage - baseLeverage) * confidenceFactor * (1 - volatilityFactor)
    );
    
    // Position size (fixed at 5 USDT per Phase 2 specifications)
    const positionSize = this.config.tradeSize;
    
    // Calculate expected profit
    const targetMovement = Math.abs(expectedMovement);
    const expectedProfit = (positionSize * optimalLeverage * targetMovement / 100) - (positionSize * 0.001); // Subtract fees
    
    // Ensure minimum profit target
    if (expectedProfit < this.config.minProfitTarget) {
      // Adjust leverage to meet minimum profit requirement
      const requiredLeverage = Math.ceil(
        (this.config.minProfitTarget + positionSize * 0.001) * 100 / (positionSize * targetMovement)
      );
      
      if (requiredLeverage <= maxLeverage) {
        return {
          symbol,
          positionSize,
          leverage: requiredLeverage,
          targetMovement,
          expectedProfit: this.config.minProfitTarget,
          stopLoss: targetMovement * 0.5, // 50% of target movement
          takeProfit: targetMovement,
          confidence
        };
      }
    }
    
    return {
      symbol,
      positionSize,
      leverage: optimalLeverage,
      targetMovement,
      expectedProfit,
      stopLoss: targetMovement * 0.5, // 50% of target movement
      takeProfit: targetMovement,
      confidence
    };
  }
  
  /**
   * Execute trade on Bybit demo environment
   */
  async executeDemoTrade(params) {
    try {
      // Use demo credentials for execution
      const demoOrderRequest = {
        symbol: params.symbol,
        side: params.direction === 'long' ? 'Buy' : 'Sell',
        orderType: 'Market',
        qty: (params.positionSize * params.leverage / params.currentPrice).toFixed(6),
        leverage: params.leverage,
        stopLoss: params.stopLoss,
        takeProfit: params.takeProfit,
        category: 'linear', // Linear perpetuals
        timeInForce: 'IOC' // Immediate or Cancel for high-frequency
      };
      
      // Execute on Bybit demo
      const orderResponse = await bybitClient.placeDemoOrder(demoOrderRequest);
      
      if (orderResponse.success && orderResponse.data?.result?.orderId) {
        return {
          success: true,
          demoOrderId: orderResponse.data.result.orderId,
          orderDetails: orderResponse.data.result
        };
      } else {
        return {
          success: false,
          error: orderResponse.error || 'Unknown execution error'
        };
      }
      
    } catch (error) {
      logger.error('❌ Demo trade execution failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Calculate available capital for new positions
   */
  calculateAvailableCapital() {
    const allocatedCapital = Array.from(this.activePositions.values())
      .reduce((sum, position) => sum + position.capitalAllocated, 0);
    
    return this.config.activeCapital - allocatedCapital;
  }
  
  /**
   * Update daily statistics
   */
  updateDailyStats(execution) {
    // Reset daily stats if new day
    const currentDate = new Date().toDateString();
    if (this.dailyStats.lastResetDate !== currentDate) {
      this.dailyStats = {
        tradesExecuted: 0,
        successfulTrades: 0,
        totalProfit: 0,
        winRate: 0,
        lastResetDate: currentDate
      };
    }
    
    this.dailyStats.tradesExecuted++;
    
    // Update win rate calculation (will be updated when positions close)
    this.dailyStats.winRate = this.dailyStats.tradesExecuted > 0 
      ? (this.dailyStats.successfulTrades / this.dailyStats.tradesExecuted) * 100 
      : 0;
  }
  
  /**
   * Update performance metrics
   */
  updatePerformanceMetrics(execution) {
    this.performanceMetrics.totalExecutions++;
    
    if (execution.verified && execution.orderIds.demo) {
      this.performanceMetrics.verifiedOrderIds++;
    }
    
    // Update average execution time
    this.performanceMetrics.averageExecutionTime = 
      (this.performanceMetrics.averageExecutionTime * (this.performanceMetrics.totalExecutions - 1) + 
       execution.executionTime) / this.performanceMetrics.totalExecutions;
    
    // Update capital utilization
    const allocatedCapital = Array.from(this.activePositions.values())
      .reduce((sum, position) => sum + position.capitalAllocated, 0);
    this.performanceMetrics.capitalUtilization = (allocatedCapital / this.config.activeCapital) * 100;
  }
  
  /**
   * Start high-frequency trading loop
   */
  startHighFrequencyTrading() {
    setInterval(async () => {
      try {
        await this.executeHighFrequencyTradingCycle();
      } catch (error) {
        logger.error('❌ High-frequency trading cycle failed:', error);
      }
    }, this.config.tradeIntervalMs);
    
    logger.info(`🔄 Started high-frequency trading every ${this.config.tradeIntervalMs / 1000} seconds`);
  }
  
  /**
   * Execute high-frequency trading cycle
   */
  async executeHighFrequencyTradingCycle() {
    // Get filtered assets from comprehensive scanner
    const filteredAssets = comprehensiveAssetScanner.getFilteredAssets();
    
    if (filteredAssets.length === 0) {
      logger.debug('⚠️ No filtered assets available for trading');
      return;
    }
    
    // Analyze top assets with quantum analysis
    const opportunities = [];
    
    for (const symbol of filteredAssets.slice(0, 10)) { // Analyze top 10 assets
      try {
        const assetMetadata = comprehensiveAssetScanner.getAssetMetadata(symbol);
        if (!assetMetadata) continue;
        
        // Get quantum analysis
        const quantumAnalysis = await quantumEnhancedAnalysis.performQuantumAnalysis(symbol, {
          price: assetMetadata.currentPrice,
          volume: assetMetadata.dailyVolumeUsd,
          volatility: assetMetadata.dailyVolatility
        });
        
        // Create trading opportunity if quantum score is high
        if (quantumAnalysis.quantumScore >= 75) {
          opportunities.push({
            symbol,
            direction: quantumAnalysis.quantumPrediction.priceChange > 0 ? 'long' : 'short',
            expectedMovement: Math.abs(quantumAnalysis.quantumPrediction.priceChange),
            confidence: quantumAnalysis.quantumScore,
            volatility: assetMetadata.dailyVolatility,
            currentPrice: assetMetadata.currentPrice,
            quantumAnalysis
          });
        }
      } catch (error) {
        logger.debug(`❌ Failed to analyze ${symbol}:`, error.message);
      }
    }
    
    // Sort opportunities by confidence and quantum score
    opportunities.sort((a, b) => (b.confidence + b.quantumAnalysis.quantumScore) - (a.confidence + a.quantumAnalysis.quantumScore));
    
    // Execute best opportunity if available
    if (opportunities.length > 0) {
      const bestOpportunity = opportunities[0];
      await this.executeHighFrequencyTrade(bestOpportunity);
    }
  }
  
  /**
   * Verify Bybit demo credentials
   */
  async verifyDemoCredentials() {
    try {
      const accountInfo = await bybitClient.getDemoAccountInfo();
      if (accountInfo.success) {
        logger.info('✅ Bybit demo credentials verified successfully');
        return true;
      } else {
        throw new Error('Demo credentials verification failed');
      }
    } catch (error) {
      logger.error('❌ Demo credentials verification failed:', error);
      throw error;
    }
  }
  
  /**
   * Initialize capital tracking
   */
  async initializeCapitalTracking() {
    logger.info(`💰 Initializing capital tracking: ${this.config.totalCapital} USDT total, ${this.config.activeCapital} USDT active`);
    
    // Verify capital constraints
    if (this.config.activeCapital + this.config.safetyBuffer !== this.config.totalCapital) {
      throw new Error('Capital allocation error: active + safety buffer must equal total capital');
    }
  }
  
  /**
   * Start execution monitoring
   */
  startExecutionMonitoring() {
    setInterval(async () => {
      try {
        await this.monitorActivePositions();
        await this.updatePositionStatus();
      } catch (error) {
        logger.error('❌ Execution monitoring failed:', error);
      }
    }, 10000); // Monitor every 10 seconds
    
    logger.info('🔄 Started execution monitoring every 10 seconds');
  }
  
  /**
   * Monitor active positions for profit/loss
   */
  async monitorActivePositions() {
    for (const [symbol, position] of this.activePositions) {
      try {
        // Get current position status from Bybit demo
        const positionStatus = await bybitClient.getDemoPosition(symbol);
        
        if (positionStatus.success && positionStatus.data) {
          // Update position with current PnL
          position.currentPnL = positionStatus.data.unrealisedPnl || 0;
          position.currentPrice = positionStatus.data.markPrice || position.executionParams.currentPrice;
          
          // Check if position should be closed
          const shouldClose = this.shouldClosePosition(position, positionStatus.data);
          
          if (shouldClose.close) {
            await this.closePosition(symbol, shouldClose.reason);
          }
        }
      } catch (error) {
        logger.debug(`❌ Failed to monitor position ${symbol}:`, error.message);
      }
    }
  }
  
  /**
   * Update position status and statistics
   */
  async updatePositionStatus() {
    // Update daily statistics
    const currentDate = new Date().toDateString();
    if (this.dailyStats.lastResetDate !== currentDate) {
      this.resetDailyStats();
    }
    
    // Log current status
    logger.debug(`📊 Active Positions: ${this.activePositions.size}/${this.config.maxConcurrentPositions}`);
    logger.debug(`📈 Daily Trades: ${this.dailyStats.tradesExecuted}/${this.config.targetTradesPerDay}`);
    logger.debug(`🎯 Win Rate: ${this.dailyStats.winRate.toFixed(2)}%`);
    logger.debug(`💰 Capital Utilization: ${this.performanceMetrics.capitalUtilization.toFixed(2)}%`);
  }
  
  /**
   * Get execution engine status
   */
  getExecutionStatus() {
    return {
      config: this.config,
      activePositions: this.activePositions.size,
      dailyStats: this.dailyStats,
      performanceMetrics: this.performanceMetrics,
      executionHistory: this.executionHistory.slice(-10), // Last 10 executions
      availableCapital: this.calculateAvailableCapital()
    };
  }
  
  /**
   * Determine if position should be closed
   */
  shouldClosePosition(position, positionData) {
    const currentPnL = parseFloat(positionData.unrealisedPnl || 0);
    const targetProfit = position.expectedProfit;
    const maxLoss = position.capitalAllocated * 0.0025; // 0.25% stop loss

    // Close if profit target reached
    if (currentPnL >= targetProfit) {
      return { close: true, reason: 'profit_target_reached' };
    }

    // Close if stop loss triggered
    if (currentPnL <= -maxLoss) {
      return { close: true, reason: 'stop_loss_triggered' };
    }

    // Close if position has been open too long (15 minutes max)
    const positionAge = Date.now() - position.timestamp.getTime();
    if (positionAge > 15 * 60 * 1000) {
      return { close: true, reason: 'time_limit_reached' };
    }

    return { close: false, reason: 'position_active' };
  }

  /**
   * Close position and update statistics
   */
  async closePosition(symbol, reason) {
    const position = this.activePositions.get(symbol);
    if (!position) return;

    try {
      // Close position on Bybit demo
      const closeResult = await bybitClient.closeDemoPosition(symbol);

      if (closeResult.success) {
        const finalPnL = parseFloat(closeResult.data.realizedPnl || 0);

        // Update position record
        position.status = 'closed';
        position.closeReason = reason;
        position.finalPnL = finalPnL;
        position.closeTime = new Date();
        position.closeOrderId = closeResult.data.orderId;

        // Update daily statistics
        if (finalPnL >= this.config.minProfitTarget) {
          this.dailyStats.successfulTrades++;
        }
        this.dailyStats.totalProfit += finalPnL;
        this.dailyStats.winRate = (this.dailyStats.successfulTrades / this.dailyStats.tradesExecuted) * 100;

        // Remove from active positions
        this.activePositions.delete(symbol);

        logger.info(`🔒 Position closed: ${symbol} | Reason: ${reason} | PnL: ${finalPnL.toFixed(4)} USDT`);
        logger.info(`📊 Win Rate: ${this.dailyStats.winRate.toFixed(2)}% | Total Profit: ${this.dailyStats.totalProfit.toFixed(4)} USDT`);

      } else {
        logger.error(`❌ Failed to close position ${symbol}:`, closeResult.error);
      }
    } catch (error) {
      logger.error(`❌ Error closing position ${symbol}:`, error);
    }
  }

  /**
   * Reset daily statistics
   */
  resetDailyStats() {
    const previousStats = { ...this.dailyStats };

    this.dailyStats = {
      tradesExecuted: 0,
      successfulTrades: 0,
      totalProfit: 0,
      winRate: 0,
      lastResetDate: new Date().toDateString()
    };

    logger.info(`📅 Daily stats reset. Previous day: ${previousStats.tradesExecuted} trades, ${previousStats.winRate.toFixed(2)}% win rate, ${previousStats.totalProfit.toFixed(4)} USDT profit`);
  }

  /**
   * Get verified order IDs for proof of execution
   */
  getVerifiedOrderIds() {
    return this.executionHistory
      .filter(execution => execution.verified && execution.orderIds.demo)
      .map(execution => ({
        id: execution.id,
        symbol: execution.symbol,
        timestamp: execution.timestamp,
        demoOrderId: execution.orderIds.demo,
        direction: execution.direction,
        capitalAllocated: execution.capitalAllocated,
        leverage: execution.leverage,
        status: execution.status
      }));
  }

  /**
   * Get comprehensive performance report
   */
  getPerformanceReport() {
    const totalExecutions = this.executionHistory.length;
    const successfulExecutions = this.executionHistory.filter(e => e.finalPnL >= this.config.minProfitTarget).length;
    const totalProfit = this.executionHistory.reduce((sum, e) => sum + (e.finalPnL || 0), 0);

    return {
      // Execution metrics
      totalExecutions,
      successfulExecutions,
      overallWinRate: totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0,
      totalProfit,
      averageProfitPerTrade: totalExecutions > 0 ? totalProfit / totalExecutions : 0,

      // Daily performance
      dailyStats: this.dailyStats,

      // Capital management
      capitalUtilization: this.performanceMetrics.capitalUtilization,
      availableCapital: this.calculateAvailableCapital(),
      activePositions: this.activePositions.size,

      // Performance targets achievement
      targetAchievement: {
        tradesPerDay: {
          target: this.config.targetTradesPerDay,
          current: this.dailyStats.tradesExecuted,
          percentage: (this.dailyStats.tradesExecuted / this.config.targetTradesPerDay) * 100
        },
        winRate: {
          target: this.config.targetWinRate,
          current: this.dailyStats.winRate,
          achieved: this.dailyStats.winRate >= 85 && this.dailyStats.winRate <= 90
        },
        profitTarget: {
          target: this.config.minProfitTarget,
          averageActual: totalExecutions > 0 ? totalProfit / totalExecutions : 0,
          achieved: totalExecutions > 0 ? (totalProfit / totalExecutions) >= this.config.minProfitTarget : false
        }
      },

      // Verification
      verifiedOrderIds: this.getVerifiedOrderIds().length,
      verificationRate: this.performanceMetrics.totalExecutions > 0
        ? (this.performanceMetrics.verifiedOrderIds / this.performanceMetrics.totalExecutions) * 100
        : 0
    };
  }

  /**
   * Emergency stop all trading
   */
  async emergencyStop(reason = 'manual_stop') {
    logger.warn(`🛑 EMERGENCY STOP TRIGGERED: ${reason}`);

    try {
      // Close all active positions
      const closePromises = Array.from(this.activePositions.keys()).map(symbol =>
        this.closePosition(symbol, `emergency_stop_${reason}`)
      );

      await Promise.all(closePromises);

      // Clear execution queue
      this.executionQueue = [];

      logger.info('✅ Emergency stop completed. All positions closed.');

      return {
        success: true,
        positionsClosed: closePromises.length,
        reason
      };

    } catch (error) {
      logger.error('❌ Emergency stop failed:', error);
      return {
        success: false,
        error: error.message,
        reason
      };
    }
  }

  /**
   * Validate system health and performance
   */
  validateSystemHealth() {
    const health = {
      overall: 'healthy',
      issues: [],
      metrics: {}
    };

    // Check win rate
    if (this.dailyStats.winRate < 85 && this.dailyStats.tradesExecuted > 10) {
      health.issues.push(`Win rate ${this.dailyStats.winRate.toFixed(2)}% below 85% target`);
      health.overall = 'warning';
    }

    // Check capital utilization
    if (this.performanceMetrics.capitalUtilization > 90) {
      health.issues.push(`High capital utilization: ${this.performanceMetrics.capitalUtilization.toFixed(2)}%`);
      health.overall = 'warning';
    }

    // Check execution frequency
    const expectedTradesPerHour = this.config.targetTradesPerDay / 24;
    const currentHour = new Date().getHours();
    const expectedTradesSoFar = expectedTradesPerHour * (currentHour + 1);

    if (this.dailyStats.tradesExecuted < expectedTradesSoFar * 0.8) {
      health.issues.push(`Trade frequency below target: ${this.dailyStats.tradesExecuted} vs ${expectedTradesSoFar.toFixed(0)} expected`);
      health.overall = 'warning';
    }

    // Check verification rate
    const verificationRate = this.performanceMetrics.totalExecutions > 0
      ? (this.performanceMetrics.verifiedOrderIds / this.performanceMetrics.totalExecutions) * 100
      : 100;

    if (verificationRate < 95) {
      health.issues.push(`Order verification rate below 95%: ${verificationRate.toFixed(2)}%`);
      health.overall = 'critical';
    }

    health.metrics = {
      winRate: this.dailyStats.winRate,
      capitalUtilization: this.performanceMetrics.capitalUtilization,
      verificationRate,
      dailyProgress: (this.dailyStats.tradesExecuted / this.config.targetTradesPerDay) * 100
    };

    return health;
  }
}

// Export singleton instance
module.exports = new HighFrequencyExecutionEngine();
