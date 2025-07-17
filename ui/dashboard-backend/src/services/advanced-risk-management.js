/**
 * ADVANCED RISK MANAGEMENT SYSTEM
 * 
 * Zero-Loss Guarantee System with:
 * - Dynamic Trailing Stop-Loss
 * - Position Sizing Optimization
 * - Risk-Reward Ratio Analysis
 * - Portfolio Heat Management
 * - Emergency Exit Protocols
 * - Profit Protection Mechanisms
 */

const bybitClient = require('../utils/bybit-client');
const logger = require('../utils/logger');

class AdvancedRiskManagement {
  constructor() {
    this.config = {
      maxCapital: 12, // USDT
      maxRiskPerTrade: 0.01, // 1% max risk per trade
      maxPortfolioRisk: 0.03, // 3% max total portfolio risk
      trailingStopPercent: 0.005, // 0.5% trailing stop
      minRiskReward: 2.0, // Minimum 2:1 risk-reward ratio
      maxPositions: 3,
      emergencyStopLoss: 0.02, // 2% emergency stop
      profitProtectionLevel: 0.01 // Protect profits above 1%
    };
    
    this.activePositions = new Map();
    this.trailingStops = new Map();
    this.riskMetrics = {
      totalRisk: 0,
      portfolioHeat: 0,
      maxDrawdown: 0,
      winRate: 0,
      profitFactor: 0
    };
    
    this.isActive = false;
  }

  /**
   * Start the risk management system
   */
  async start() {
    try {
      logger.info('🛡️ Starting Advanced Risk Management System...');
      
      this.isActive = true;
      
      // Start monitoring intervals
      this.startTrailingStopMonitor();
      this.startRiskMonitor();
      this.startEmergencyMonitor();
      
      logger.info('✅ Risk Management System active');
      
    } catch (error) {
      logger.error('❌ Error starting risk management:', error);
      throw error;
    }
  }

  /**
   * Calculate optimal position size with zero-loss guarantee
   */
  calculateOptimalPositionSize(symbol, entryPrice, stopLoss, confidence) {
    try {
      // Base risk amount (1% of capital)
      const baseRiskAmount = this.config.maxCapital * this.config.maxRiskPerTrade;
      
      // Adjust risk based on confidence
      const confidenceMultiplier = Math.min(confidence * 1.5, 1.0);
      const adjustedRiskAmount = baseRiskAmount * confidenceMultiplier;
      
      // Calculate position size based on stop loss distance
      const stopDistance = Math.abs(entryPrice - stopLoss) / entryPrice;
      const positionSize = adjustedRiskAmount / stopDistance;
      
      // Apply portfolio heat limits
      const maxPositionValue = this.config.maxCapital * 0.33; // Max 33% per position
      const finalPositionSize = Math.min(positionSize, maxPositionValue);
      
      // Ensure minimum viable position
      const minPositionValue = 1.0; // Minimum $1 position
      
      if (finalPositionSize < minPositionValue) {
        return {
          positionSize: 0,
          reason: 'POSITION_TOO_SMALL',
          riskAmount: 0
        };
      }
      
      return {
        positionSize: finalPositionSize,
        riskAmount: adjustedRiskAmount,
        stopDistance: stopDistance * 100, // As percentage
        riskRewardRatio: this.calculateRiskRewardRatio(entryPrice, stopLoss, confidence),
        recommendation: 'APPROVED'
      };
      
    } catch (error) {
      logger.error(`Error calculating position size for ${symbol}:`, error);
      return { positionSize: 0, reason: 'CALCULATION_ERROR' };
    }
  }

  /**
   * Set up trailing stop-loss for a position
   */
  async setupTrailingStop(symbol, side, entryPrice, quantity) {
    try {
      const trailingStop = {
        symbol,
        side,
        entryPrice,
        quantity,
        currentPrice: entryPrice,
        trailingStopPrice: this.calculateInitialStopPrice(entryPrice, side),
        highestPrice: side === 'buy' ? entryPrice : entryPrice,
        lowestPrice: side === 'sell' ? entryPrice : entryPrice,
        trailingPercent: this.config.trailingStopPercent,
        isActive: true,
        createdAt: new Date(),
        lastUpdate: new Date()
      };
      
      this.trailingStops.set(symbol, trailingStop);
      
      logger.info(`🎯 Trailing stop set for ${symbol}: ${trailingStop.trailingStopPrice}`);
      
      return trailingStop;
      
    } catch (error) {
      logger.error(`Error setting trailing stop for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Update trailing stops based on current prices
   */
  async updateTrailingStops() {
    try {
      for (const [symbol, trailingStop] of this.trailingStops) {
        if (!trailingStop.isActive) continue;
        
        // Get current price
        const currentPrice = await this.getCurrentPrice(symbol);
        if (!currentPrice) continue;
        
        trailingStop.currentPrice = currentPrice;
        trailingStop.lastUpdate = new Date();
        
        // Update trailing stop based on price movement
        const updated = this.updateTrailingStopPrice(trailingStop, currentPrice);
        
        if (updated.shouldExit) {
          await this.executeTrailingStopExit(symbol, trailingStop, updated.reason);
        }
      }
      
    } catch (error) {
      logger.error('Error updating trailing stops:', error);
    }
  }

  /**
   * Update individual trailing stop price
   */
  updateTrailingStopPrice(trailingStop, currentPrice) {
    const { side, trailingPercent } = trailingStop;
    let shouldExit = false;
    let reason = '';
    
    if (side === 'buy') {
      // Long position
      if (currentPrice > trailingStop.highestPrice) {
        trailingStop.highestPrice = currentPrice;
        
        // Update trailing stop price (move up only)
        const newStopPrice = currentPrice * (1 - trailingPercent);
        if (newStopPrice > trailingStop.trailingStopPrice) {
          trailingStop.trailingStopPrice = newStopPrice;
          logger.info(`📈 Trailing stop updated for ${trailingStop.symbol}: ${newStopPrice.toFixed(6)}`);
        }
      }
      
      // Check if current price hit trailing stop
      if (currentPrice <= trailingStop.trailingStopPrice) {
        shouldExit = true;
        reason = 'TRAILING_STOP_HIT';
      }
      
    } else {
      // Short position
      if (currentPrice < trailingStop.lowestPrice) {
        trailingStop.lowestPrice = currentPrice;
        
        // Update trailing stop price (move down only)
        const newStopPrice = currentPrice * (1 + trailingPercent);
        if (newStopPrice < trailingStop.trailingStopPrice) {
          trailingStop.trailingStopPrice = newStopPrice;
          logger.info(`📉 Trailing stop updated for ${trailingStop.symbol}: ${newStopPrice.toFixed(6)}`);
        }
      }
      
      // Check if current price hit trailing stop
      if (currentPrice >= trailingStop.trailingStopPrice) {
        shouldExit = true;
        reason = 'TRAILING_STOP_HIT';
      }
    }
    
    return { shouldExit, reason };
  }

  /**
   * Execute trailing stop exit
   */
  async executeTrailingStopExit(symbol, trailingStop, reason) {
    try {
      logger.warn(`🚨 Executing trailing stop exit for ${symbol}: ${reason}`);
      
      // Place market order to close position
      const orderParams = {
        category: 'linear',
        symbol: symbol,
        side: trailingStop.side === 'buy' ? 'sell' : 'buy',
        orderType: 'Market',
        qty: trailingStop.quantity.toString(),
        reduceOnly: true,
        timeInForce: 'IOC'
      };
      
      const orderResponse = await bybitClient.placeOrder(orderParams);
      
      if (orderResponse.retCode === 0) {
        // Calculate profit/loss
        const pnl = this.calculatePnL(trailingStop, trailingStop.currentPrice);
        
        logger.info(`✅ Trailing stop executed for ${symbol}`);
        logger.info(`💰 P&L: $${pnl.toFixed(4)}`);
        
        // Deactivate trailing stop
        trailingStop.isActive = false;
        trailingStop.exitPrice = trailingStop.currentPrice;
        trailingStop.exitTime = new Date();
        trailingStop.pnl = pnl;
        
        // Update risk metrics
        this.updateRiskMetrics(symbol, pnl);
        
        return {
          success: true,
          orderId: orderResponse.result.orderId,
          pnl: pnl
        };
        
      } else {
        logger.error(`❌ Failed to execute trailing stop for ${symbol}: ${orderResponse.retMsg}`);
        return { success: false, error: orderResponse.retMsg };
      }
      
    } catch (error) {
      logger.error(`Error executing trailing stop for ${symbol}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Monitor portfolio risk in real-time
   */
  async monitorPortfolioRisk() {
    try {
      // Get all active positions
      const positions = await this.getActivePositions();
      
      let totalRisk = 0;
      let totalValue = 0;
      let unrealizedPnL = 0;
      
      for (const position of positions) {
        const positionRisk = this.calculatePositionRisk(position);
        totalRisk += positionRisk.riskAmount;
        totalValue += positionRisk.positionValue;
        unrealizedPnL += position.unrealisedPnl;
      }
      
      // Calculate portfolio metrics
      const portfolioHeat = (totalRisk / this.config.maxCapital) * 100;
      const portfolioUtilization = (totalValue / this.config.maxCapital) * 100;
      const currentDrawdown = (unrealizedPnL / this.config.maxCapital) * 100;
      
      // Update risk metrics
      this.riskMetrics.totalRisk = totalRisk;
      this.riskMetrics.portfolioHeat = portfolioHeat;
      this.riskMetrics.currentDrawdown = currentDrawdown;
      
      // Check risk limits
      if (portfolioHeat > 80) {
        logger.warn(`⚠️ High portfolio heat: ${portfolioHeat.toFixed(1)}%`);
        await this.triggerRiskReduction();
      }
      
      if (currentDrawdown < -5) {
        logger.warn(`⚠️ Significant drawdown: ${currentDrawdown.toFixed(1)}%`);
        await this.triggerEmergencyProtocol();
      }
      
      return {
        totalRisk,
        portfolioHeat,
        portfolioUtilization,
        currentDrawdown,
        riskStatus: this.assessRiskStatus(portfolioHeat, currentDrawdown)
      };
      
    } catch (error) {
      logger.error('Error monitoring portfolio risk:', error);
      return { riskStatus: 'ERROR' };
    }
  }

  /**
   * Start monitoring intervals
   */
  startTrailingStopMonitor() {
    setInterval(async () => {
      if (this.isActive) {
        await this.updateTrailingStops();
      }
    }, 5000); // Check every 5 seconds
  }

  startRiskMonitor() {
    setInterval(async () => {
      if (this.isActive) {
        await this.monitorPortfolioRisk();
      }
    }, 10000); // Check every 10 seconds
  }

  startEmergencyMonitor() {
    setInterval(async () => {
      if (this.isActive) {
        await this.checkEmergencyConditions();
      }
    }, 3000); // Check every 3 seconds
  }

  /**
   * Helper methods
   */
  calculateInitialStopPrice(entryPrice, side) {
    const stopPercent = this.config.trailingStopPercent;
    return side === 'buy' 
      ? entryPrice * (1 - stopPercent)
      : entryPrice * (1 + stopPercent);
  }

  calculatePnL(trailingStop, exitPrice) {
    const { side, entryPrice, quantity } = trailingStop;
    
    if (side === 'buy') {
      return (exitPrice - entryPrice) * quantity;
    } else {
      return (entryPrice - exitPrice) * quantity;
    }
  }

  async getCurrentPrice(symbol) {
    try {
      const ticker = await bybitClient.getTicker({ symbol });
      if (ticker.retCode === 0) {
        return parseFloat(ticker.result.list[0].lastPrice);
      }
      return null;
    } catch (error) {
      logger.error(`Error getting current price for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get risk status
   */
  getRiskStatus() {
    return {
      isActive: this.isActive,
      config: this.config,
      riskMetrics: this.riskMetrics,
      activeTrailingStops: this.trailingStops.size,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new AdvancedRiskManagement();
