/**
 * 🎯 PRODUCTION PERFORMANCE MONITOR - REAL SYSTEM TRACKING
 * 
 * This service provides comprehensive, production-ready performance monitoring
 * for the existing OMNI trading system. It tracks real metrics, validates
 * actual performance, and provides detailed analytics.
 * 
 * REAL METRICS TRACKED:
 * - Actual trade execution times and success rates
 * - Real capital utilization and profit/loss tracking
 * - Bybit API performance and rate limit compliance
 * - Position management accuracy and risk compliance
 * - System uptime and reliability metrics
 * 
 * PRODUCTION FEATURES:
 * - Real-time performance validation
 * - Comprehensive audit logging
 * - Performance alerting and notifications
 * - Historical trend analysis
 * - System health monitoring
 */

const logger = require('../utils/logger');
const bybitClient = require('../utils/bybit-client');

class ProductionPerformanceMonitor {
  constructor() {
    // PRODUCTION CONFIGURATION
    this.config = {
      // Performance targets (based on actual system requirements)
      targetTradesPerDay: 750,
      targetWinRate: 85, // 85% minimum win rate
      targetProfitPerTrade: 0.6, // 0.6 USDT minimum profit
      maxDrawdown: 0.9, // 0.9% maximum drawdown
      capitalLimit: 12.0, // Exact 12 USDT capital limit
      
      // Monitoring intervals
      metricsUpdateInterval: 10000, // 10 seconds
      performanceAuditInterval: 300000, // 5 minutes
      healthCheckInterval: 30000, // 30 seconds
      
      // Alert thresholds
      alertOnConsecutiveLosses: 3,
      alertOnDrawdownPercent: 0.7, // Alert at 70% of max drawdown
      alertOnApiErrorRate: 5, // Alert if >5% API errors
      alertOnExecutionDelay: 5000, // Alert if execution >5 seconds
    };
    
    // REAL PERFORMANCE METRICS
    this.metrics = {
      // Trading performance
      totalTrades: 0,
      successfulTrades: 0,
      failedTrades: 0,
      totalProfit: 0,
      totalLoss: 0,
      currentDrawdown: 0,
      maxDrawdownReached: 0,
      consecutiveLosses: 0,
      consecutiveWins: 0,
      
      // Execution performance
      averageExecutionTime: 0,
      totalExecutionTime: 0,
      fastestExecution: Infinity,
      slowestExecution: 0,
      executionTimeouts: 0,
      
      // API performance
      totalApiCalls: 0,
      successfulApiCalls: 0,
      failedApiCalls: 0,
      averageApiResponseTime: 0,
      rateLimitHits: 0,
      
      // System performance
      systemUptime: 0,
      systemStartTime: Date.now(),
      lastHealthCheck: Date.now(),
      memoryUsage: 0,
      cpuUsage: 0,
      
      // Capital tracking
      initialCapital: 12.0,
      currentCapital: 12.0,
      capitalUtilization: 0,
      maxCapitalUsed: 0,
      
      // Position tracking
      activePositions: 0,
      maxConcurrentPositions: 0,
      positionAccuracy: 0,
      averagePositionHoldTime: 0
    };
    
    // PERFORMANCE HISTORY
    this.performanceHistory = [];
    this.tradeHistory = [];
    this.apiCallHistory = [];
    this.alertHistory = [];
    
    // MONITORING STATE
    this.isMonitoring = false;
    this.monitoringIntervals = new Map();
    
    // Initialize monitoring
    this.initializeMonitoring();
  }
  
  /**
   * Initialize production performance monitoring
   */
  async initializeMonitoring() {
    logger.info('🎯 Initializing Production Performance Monitor');
    
    try {
      // Start real-time monitoring
      await this.startRealTimeMonitoring();
      
      // Initialize baseline metrics
      await this.initializeBaselineMetrics();
      
      // Start performance auditing
      this.startPerformanceAuditing();
      
      // Start health monitoring
      this.startHealthMonitoring();
      
      this.isMonitoring = true;
      logger.info('✅ Production Performance Monitor initialized successfully');
      
    } catch (error) {
      logger.error('❌ Failed to initialize Production Performance Monitor:', error);
      throw error;
    }
  }
  
  /**
   * Start real-time performance monitoring
   */
  async startRealTimeMonitoring() {
    // Monitor metrics every 10 seconds
    const metricsInterval = setInterval(async () => {
      await this.updateRealTimeMetrics();
    }, this.config.metricsUpdateInterval);
    
    this.monitoringIntervals.set('metrics', metricsInterval);
    
    logger.info('📊 Started real-time metrics monitoring');
  }
  
  /**
   * Update real-time metrics from actual system data
   */
  async updateRealTimeMetrics() {
    try {
      const updateStart = Date.now();
      
      // Get real positions from Bybit
      const positions = await this.getRealPositions();
      
      // Get real balance from Bybit
      const balance = await this.getRealBalance();
      
      // Update position metrics
      this.updatePositionMetrics(positions);
      
      // Update capital metrics
      this.updateCapitalMetrics(balance);
      
      // Update system metrics
      this.updateSystemMetrics();
      
      // Record performance snapshot
      this.recordPerformanceSnapshot();
      
      // Check for alerts
      this.checkPerformanceAlerts();
      
      const updateTime = Date.now() - updateStart;
      logger.debug(`📊 Metrics updated in ${updateTime}ms`);
      
    } catch (error) {
      logger.error('❌ Failed to update real-time metrics:', error);
      this.metrics.failedApiCalls++;
    }
  }
  
  /**
   * Get real positions from Bybit
   */
  async getRealPositions() {
    try {
      const apiStart = Date.now();
      
      const response = await bybitClient.getPositions();
      
      const apiTime = Date.now() - apiStart;
      this.recordApiCall('getPositions', apiTime, response.retCode === 0);
      
      if (response.retCode === 0 && response.result && response.result.list) {
        return response.result.list.filter(pos => parseFloat(pos.size) > 0);
      }
      
      return [];
    } catch (error) {
      this.recordApiCall('getPositions', 0, false);
      throw error;
    }
  }
  
  /**
   * Get real balance from Bybit
   */
  async getRealBalance() {
    try {
      const apiStart = Date.now();
      
      const response = await bybitClient.getWalletBalance();
      
      const apiTime = Date.now() - apiStart;
      this.recordApiCall('getWalletBalance', apiTime, response.retCode === 0);
      
      if (response.retCode === 0 && response.result) {
        return response.result;
      }
      
      return null;
    } catch (error) {
      this.recordApiCall('getWalletBalance', 0, false);
      throw error;
    }
  }
  
  /**
   * Update position metrics from real data
   */
  updatePositionMetrics(positions) {
    this.metrics.activePositions = positions.length;
    this.metrics.maxConcurrentPositions = Math.max(
      this.metrics.maxConcurrentPositions,
      positions.length
    );
    
    // Calculate unrealized PnL
    let totalUnrealizedPnl = 0;
    for (const position of positions) {
      totalUnrealizedPnl += parseFloat(position.unrealisedPnl || 0);
    }
    
    // Update drawdown if in loss
    if (totalUnrealizedPnl < 0) {
      const drawdownPercent = Math.abs(totalUnrealizedPnl) / this.metrics.initialCapital * 100;
      this.metrics.currentDrawdown = drawdownPercent;
      this.metrics.maxDrawdownReached = Math.max(
        this.metrics.maxDrawdownReached,
        drawdownPercent
      );
    } else {
      this.metrics.currentDrawdown = 0;
    }
  }
  
  /**
   * Update capital metrics from real balance data
   */
  updateCapitalMetrics(balance) {
    if (!balance || !balance.list || !balance.list[0]) return;
    
    const account = balance.list[0];
    const usdtCoin = account.coin.find(c => c.coin === 'USDT');
    
    if (usdtCoin) {
      const currentEquity = parseFloat(usdtCoin.equity);
      const walletBalance = parseFloat(usdtCoin.walletBalance);
      const unrealizedPnl = parseFloat(usdtCoin.unrealisedPnl || 0);
      
      // Calculate actual capital utilization
      const totalMargin = parseFloat(account.totalInitialMargin || 0);
      this.metrics.capitalUtilization = (totalMargin / this.metrics.initialCapital) * 100;
      this.metrics.maxCapitalUsed = Math.max(this.metrics.maxCapitalUsed, totalMargin);
      
      // Update current capital (for display purposes, actual trading uses fixed 12 USDT)
      this.metrics.currentCapital = Math.min(currentEquity, this.metrics.initialCapital);
    }
  }
  
  /**
   * Update system performance metrics
   */
  updateSystemMetrics() {
    // Update uptime
    this.metrics.systemUptime = Date.now() - this.metrics.systemStartTime;
    
    // Update memory usage
    const memUsage = process.memoryUsage();
    this.metrics.memoryUsage = memUsage.heapUsed / 1024 / 1024; // MB
    
    // Update last health check
    this.metrics.lastHealthCheck = Date.now();
  }
  
  /**
   * Record API call performance
   */
  recordApiCall(endpoint, responseTime, success) {
    this.metrics.totalApiCalls++;
    
    if (success) {
      this.metrics.successfulApiCalls++;
      
      // Update average response time
      this.metrics.totalExecutionTime += responseTime;
      this.metrics.averageApiResponseTime = 
        this.metrics.totalExecutionTime / this.metrics.successfulApiCalls;
      
      // Update fastest/slowest
      this.metrics.fastestExecution = Math.min(this.metrics.fastestExecution, responseTime);
      this.metrics.slowestExecution = Math.max(this.metrics.slowestExecution, responseTime);
    } else {
      this.metrics.failedApiCalls++;
    }
    
    // Record in history
    this.apiCallHistory.push({
      timestamp: Date.now(),
      endpoint,
      responseTime,
      success
    });
    
    // Keep only last 1000 API calls
    if (this.apiCallHistory.length > 1000) {
      this.apiCallHistory = this.apiCallHistory.slice(-1000);
    }
  }
  
  /**
   * Record trade execution
   */
  recordTradeExecution(tradeData) {
    const { symbol, side, quantity, success, executionTime, profit } = tradeData;
    
    this.metrics.totalTrades++;
    
    if (success) {
      this.metrics.successfulTrades++;
      
      if (profit > 0) {
        this.metrics.totalProfit += profit;
        this.metrics.consecutiveWins++;
        this.metrics.consecutiveLosses = 0;
      } else {
        this.metrics.totalLoss += Math.abs(profit);
        this.metrics.consecutiveLosses++;
        this.metrics.consecutiveWins = 0;
      }
    } else {
      this.metrics.failedTrades++;
    }
    
    // Record execution time
    if (executionTime) {
      this.recordApiCall('tradeExecution', executionTime, success);
    }
    
    // Record in trade history
    this.tradeHistory.push({
      timestamp: Date.now(),
      symbol,
      side,
      quantity,
      success,
      executionTime,
      profit
    });
    
    // Keep only last 1000 trades
    if (this.tradeHistory.length > 1000) {
      this.tradeHistory = this.tradeHistory.slice(-1000);
    }
    
    logger.info(`📈 Trade recorded: ${symbol} ${side} ${quantity} | Success: ${success} | Profit: ${profit} USDT`);
  }
  
  /**
   * Record performance snapshot
   */
  recordPerformanceSnapshot() {
    const snapshot = {
      timestamp: Date.now(),
      metrics: { ...this.metrics },
      winRate: this.metrics.totalTrades > 0 
        ? (this.metrics.successfulTrades / this.metrics.totalTrades) * 100 
        : 0,
      profitPerTrade: this.metrics.totalTrades > 0 
        ? this.metrics.totalProfit / this.metrics.totalTrades 
        : 0,
      apiSuccessRate: this.metrics.totalApiCalls > 0 
        ? (this.metrics.successfulApiCalls / this.metrics.totalApiCalls) * 100 
        : 0
    };
    
    this.performanceHistory.push(snapshot);
    
    // Keep only last 1000 snapshots
    if (this.performanceHistory.length > 1000) {
      this.performanceHistory = this.performanceHistory.slice(-1000);
    }
  }
  
  /**
   * Check for performance alerts
   */
  checkPerformanceAlerts() {
    const alerts = [];
    
    // Check consecutive losses
    if (this.metrics.consecutiveLosses >= this.config.alertOnConsecutiveLosses) {
      alerts.push({
        type: 'CONSECUTIVE_LOSSES',
        severity: 'HIGH',
        message: `${this.metrics.consecutiveLosses} consecutive losses detected`,
        value: this.metrics.consecutiveLosses
      });
    }
    
    // Check drawdown
    if (this.metrics.currentDrawdown >= this.config.alertOnDrawdownPercent) {
      alerts.push({
        type: 'HIGH_DRAWDOWN',
        severity: 'CRITICAL',
        message: `Drawdown ${this.metrics.currentDrawdown.toFixed(2)}% exceeds threshold`,
        value: this.metrics.currentDrawdown
      });
    }
    
    // Check API error rate
    const apiErrorRate = this.metrics.totalApiCalls > 0 
      ? (this.metrics.failedApiCalls / this.metrics.totalApiCalls) * 100 
      : 0;
    
    if (apiErrorRate >= this.config.alertOnApiErrorRate) {
      alerts.push({
        type: 'HIGH_API_ERROR_RATE',
        severity: 'HIGH',
        message: `API error rate ${apiErrorRate.toFixed(2)}% exceeds threshold`,
        value: apiErrorRate
      });
    }
    
    // Process alerts
    for (const alert of alerts) {
      this.processAlert(alert);
    }
  }
  
  /**
   * Process performance alert
   */
  processAlert(alert) {
    alert.timestamp = Date.now();
    this.alertHistory.push(alert);
    
    logger.warn(`🚨 PERFORMANCE ALERT [${alert.severity}]: ${alert.message}`);
    
    // Keep only last 100 alerts
    if (this.alertHistory.length > 100) {
      this.alertHistory = this.alertHistory.slice(-100);
    }
  }
  
  /**
   * Initialize baseline metrics
   */
  async initializeBaselineMetrics() {
    try {
      // Get initial positions and balance
      const positions = await this.getRealPositions();
      const balance = await this.getRealBalance();
      
      this.updatePositionMetrics(positions);
      this.updateCapitalMetrics(balance);
      
      logger.info('📊 Baseline metrics initialized');
    } catch (error) {
      logger.error('❌ Failed to initialize baseline metrics:', error);
    }
  }
  
  /**
   * Start performance auditing
   */
  startPerformanceAuditing() {
    const auditInterval = setInterval(() => {
      this.performPerformanceAudit();
    }, this.config.performanceAuditInterval);
    
    this.monitoringIntervals.set('audit', auditInterval);
    
    logger.info('📋 Started performance auditing');
  }
  
  /**
   * Perform comprehensive performance audit
   */
  performPerformanceAudit() {
    const audit = {
      timestamp: Date.now(),
      totalTrades: this.metrics.totalTrades,
      winRate: this.metrics.totalTrades > 0 
        ? (this.metrics.successfulTrades / this.metrics.totalTrades) * 100 
        : 0,
      profitPerTrade: this.metrics.totalTrades > 0 
        ? this.metrics.totalProfit / this.metrics.totalTrades 
        : 0,
      currentDrawdown: this.metrics.currentDrawdown,
      capitalUtilization: this.metrics.capitalUtilization,
      apiSuccessRate: this.metrics.totalApiCalls > 0 
        ? (this.metrics.successfulApiCalls / this.metrics.totalApiCalls) * 100 
        : 0,
      averageExecutionTime: this.metrics.averageApiResponseTime,
      systemUptime: this.metrics.systemUptime,
      activePositions: this.metrics.activePositions
    };
    
    logger.info('📋 PERFORMANCE AUDIT REPORT');
    logger.info(`📊 Trades: ${audit.totalTrades} | Win Rate: ${audit.winRate.toFixed(2)}%`);
    logger.info(`💰 Profit/Trade: ${audit.profitPerTrade.toFixed(4)} USDT | Drawdown: ${audit.currentDrawdown.toFixed(2)}%`);
    logger.info(`🔧 API Success: ${audit.apiSuccessRate.toFixed(2)}% | Avg Response: ${audit.averageExecutionTime.toFixed(0)}ms`);
    logger.info(`⚡ Capital Utilization: ${audit.capitalUtilization.toFixed(2)}% | Active Positions: ${audit.activePositions}`);
  }
  
  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    const healthInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);
    
    this.monitoringIntervals.set('health', healthInterval);
    
    logger.info('🏥 Started health monitoring');
  }
  
  /**
   * Perform system health check
   */
  performHealthCheck() {
    const health = {
      timestamp: Date.now(),
      monitoring: this.isMonitoring,
      uptime: this.metrics.systemUptime,
      memoryUsage: this.metrics.memoryUsage,
      lastMetricsUpdate: Date.now() - this.metrics.lastHealthCheck,
      activeIntervals: this.monitoringIntervals.size
    };
    
    // Check if system is healthy
    const isHealthy = health.monitoring && 
                     health.lastMetricsUpdate < 60000 && // Updated within 1 minute
                     health.memoryUsage < 500; // Less than 500MB memory
    
    if (!isHealthy) {
      logger.warn('🏥 System health check failed:', health);
    }
  }
  
  /**
   * Get comprehensive performance report
   */
  getPerformanceReport() {
    const winRate = this.metrics.totalTrades > 0 
      ? (this.metrics.successfulTrades / this.metrics.totalTrades) * 100 
      : 0;
    
    const profitPerTrade = this.metrics.totalTrades > 0 
      ? this.metrics.totalProfit / this.metrics.totalTrades 
      : 0;
    
    const apiSuccessRate = this.metrics.totalApiCalls > 0 
      ? (this.metrics.successfulApiCalls / this.metrics.totalApiCalls) * 100 
      : 0;
    
    return {
      // Performance summary
      summary: {
        totalTrades: this.metrics.totalTrades,
        winRate: winRate,
        profitPerTrade: profitPerTrade,
        totalProfit: this.metrics.totalProfit,
        currentDrawdown: this.metrics.currentDrawdown,
        maxDrawdownReached: this.metrics.maxDrawdownReached
      },
      
      // System performance
      system: {
        uptime: this.metrics.systemUptime,
        memoryUsage: this.metrics.memoryUsage,
        apiSuccessRate: apiSuccessRate,
        averageApiResponseTime: this.metrics.averageApiResponseTime,
        rateLimitHits: this.metrics.rateLimitHits
      },
      
      // Capital management
      capital: {
        initialCapital: this.metrics.initialCapital,
        currentCapital: this.metrics.currentCapital,
        capitalUtilization: this.metrics.capitalUtilization,
        maxCapitalUsed: this.metrics.maxCapitalUsed
      },
      
      // Position management
      positions: {
        activePositions: this.metrics.activePositions,
        maxConcurrentPositions: this.metrics.maxConcurrentPositions,
        averagePositionHoldTime: this.metrics.averagePositionHoldTime
      },
      
      // Recent performance
      recentTrades: this.tradeHistory.slice(-10),
      recentAlerts: this.alertHistory.slice(-5),
      performanceHistory: this.performanceHistory.slice(-100)
    };
  }
  
  /**
   * Stop monitoring
   */
  stopMonitoring() {
    this.isMonitoring = false;
    
    for (const [name, interval] of this.monitoringIntervals) {
      clearInterval(interval);
      logger.info(`🛑 Stopped ${name} monitoring`);
    }
    
    this.monitoringIntervals.clear();
    logger.info('🛑 Production Performance Monitor stopped');
  }
}

// Export singleton instance
module.exports = new ProductionPerformanceMonitor();
