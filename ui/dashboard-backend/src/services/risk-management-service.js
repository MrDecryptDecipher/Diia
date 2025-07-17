/**
 * Risk Management Service for OMNI-ALPHA Trading System
 * 
 * Implements comprehensive risk controls including:
 * - Position sizing
 * - Stop loss management
 * - Portfolio risk limits
 * - Drawdown protection
 */

const bybitClient = require('../utils/bybit-client');
const logger = require('../utils/logger');

class RiskManagementService {
  constructor() {
    this.config = {
      // Portfolio limits
      maxPortfolioRisk: 0.02, // 2% max portfolio risk per trade
      maxDailyLoss: 0.05, // 5% max daily loss
      maxDrawdown: 0.10, // 10% max drawdown
      maxPositions: 50, // Max concurrent positions (increased for testing)
      
      // Position limits
      maxPositionSize: 0.20, // 20% max position size of portfolio
      defaultStopLoss: 0.02, // 2% default stop loss
      defaultTakeProfit: 0.04, // 4% default take profit
      
      // Leverage limits
      maxLeverage: 10,
      conservativeLeverage: 5,
      
      // Account settings
      initialCapital: 12, // USDT
      currentCapital: 12
    };
    
    this.dailyStats = {
      startBalance: 12,
      currentBalance: 12,
      dailyPnL: 0,
      tradesCount: 0,
      winRate: 0
    };
  }

  /**
   * Analyze current portfolio risk
   */
  async analyzePortfolioRisk() {
    try {
      const positions = await this.getCurrentPositions();
      const analysis = {
        totalPositions: positions.length,
        totalExposure: 0,
        totalPnL: 0,
        riskMetrics: {},
        recommendations: []
      };

      // Calculate total exposure and P&L
      positions.forEach(position => {
        analysis.totalExposure += Math.abs(position.positionValue);
        analysis.totalPnL += position.pnl;
      });

      // Risk metrics
      analysis.riskMetrics = {
        portfolioUtilization: (analysis.totalExposure / this.config.currentCapital) * 100,
        currentDrawdown: (analysis.totalPnL / this.config.currentCapital) * 100,
        riskPerPosition: analysis.totalExposure / positions.length || 0
      };

      // Generate recommendations
      analysis.recommendations = this.generateRiskRecommendations(analysis, positions);

      return analysis;
    } catch (error) {
      logger.error(`Error analyzing portfolio risk: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate risk management recommendations
   */
  generateRiskRecommendations(analysis, positions) {
    const recommendations = [];

    // Check portfolio utilization
    if (analysis.riskMetrics.portfolioUtilization > 80) {
      recommendations.push({
        type: 'CRITICAL',
        message: 'Portfolio over-leveraged. Consider closing some positions.',
        action: 'REDUCE_EXPOSURE'
      });
    }

    // Check drawdown
    if (analysis.riskMetrics.currentDrawdown < -5) {
      recommendations.push({
        type: 'WARNING',
        message: 'Significant drawdown detected. Review stop losses.',
        action: 'REVIEW_STOPS'
      });
    }

    // Check individual positions
    positions.forEach(position => {
      if (position.pnlPercentage < -3) {
        recommendations.push({
          type: 'ACTION',
          message: `${position.symbol}: Consider closing position with ${position.pnlPercentage.toFixed(2)}% loss`,
          action: 'CLOSE_POSITION',
          symbol: position.symbol
        });
      }
    });

    // Check for missing stop losses
    const noStopLoss = positions.filter(p => !p.stopLossPrice);
    if (noStopLoss.length > 0) {
      recommendations.push({
        type: 'WARNING',
        message: `${noStopLoss.length} positions without stop loss protection`,
        action: 'SET_STOP_LOSS',
        symbols: noStopLoss.map(p => p.symbol)
      });
    }

    return recommendations;
  }

  /**
   * Calculate optimal position size
   */
  calculatePositionSize(symbol, entryPrice, stopLossPrice, riskAmount = null) {
    const accountRisk = riskAmount || (this.config.currentCapital * this.config.maxPortfolioRisk);
    const priceRisk = Math.abs(entryPrice - stopLossPrice);
    const riskPerUnit = priceRisk / entryPrice;
    
    if (riskPerUnit === 0) {
      logger.warn('Invalid stop loss price for position sizing');
      return 0;
    }

    const optimalSize = accountRisk / riskPerUnit;
    const maxSize = this.config.currentCapital * this.config.maxPositionSize;
    
    return Math.min(optimalSize, maxSize);
  }

  /**
   * Validate trade before execution
   */
  async validateTrade(tradeParams) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      adjustedParams: { ...tradeParams }
    };

    try {
      // Check portfolio limits
      const currentPositions = await this.getCurrentPositions();
      
      if (currentPositions.length >= this.config.maxPositions) {
        validation.isValid = false;
        validation.errors.push('Maximum number of positions reached');
      }

      // Check position size
      const positionValue = tradeParams.quantity * tradeParams.price;
      const portfolioPercent = (positionValue / this.config.currentCapital) * 100;
      
      if (portfolioPercent > this.config.maxPositionSize * 100) {
        validation.warnings.push(`Position size ${portfolioPercent.toFixed(1)}% exceeds recommended ${this.config.maxPositionSize * 100}%`);
      }

      // Check leverage
      if (tradeParams.leverage > this.config.maxLeverage) {
        validation.adjustedParams.leverage = this.config.maxLeverage;
        validation.warnings.push(`Leverage reduced to ${this.config.maxLeverage}x`);
      }

      // Check stop loss
      if (!tradeParams.stopLoss) {
        const defaultStopLoss = tradeParams.side === 'buy' 
          ? tradeParams.price * (1 - this.config.defaultStopLoss)
          : tradeParams.price * (1 + this.config.defaultStopLoss);
        
        validation.adjustedParams.stopLoss = defaultStopLoss;
        validation.warnings.push(`Default stop loss set at ${defaultStopLoss.toFixed(6)}`);
      }

      // Check take profit
      if (!tradeParams.takeProfit) {
        const defaultTakeProfit = tradeParams.side === 'buy'
          ? tradeParams.price * (1 + this.config.defaultTakeProfit)
          : tradeParams.price * (1 - this.config.defaultTakeProfit);
        
        validation.adjustedParams.takeProfit = defaultTakeProfit;
        validation.warnings.push(`Default take profit set at ${defaultTakeProfit.toFixed(6)}`);
      }

      return validation;
    } catch (error) {
      validation.isValid = false;
      validation.errors.push(`Validation error: ${error.message}`);
      return validation;
    }
  }

  /**
   * Get current positions from Bybit
   */
  async getCurrentPositions() {
    try {
      const response = await bybitClient.getPositions();
      if (response.retCode === 0 && response.result?.list) {
        return response.result.list
          .filter(position => parseFloat(position.size) > 0)
          .map(position => ({
            symbol: position.symbol,
            side: position.side.toLowerCase(),
            positionSize: parseFloat(position.size),
            entryPrice: parseFloat(position.avgPrice),
            currentPrice: parseFloat(position.markPrice),
            positionValue: parseFloat(position.positionValue),
            pnl: parseFloat(position.unrealisedPnl),
            pnlPercentage: (parseFloat(position.unrealisedPnl) / parseFloat(position.positionValue)) * 100,
            leverage: parseFloat(position.leverage),
            stopLossPrice: parseFloat(position.stopLoss) || null,
            takeProfitPrice: parseFloat(position.takeProfit) || null
          }));
      }
      return [];
    } catch (error) {
      logger.error(`Error fetching positions: ${error.message}`);
      return [];
    }
  }

  /**
   * Emergency position closure for risk management
   */
  async emergencyClosePosition(symbol, reason = 'Risk management') {
    try {
      logger.warn(`Emergency closing position ${symbol}: ${reason}`);
      
      // This would integrate with actual Bybit trading API
      // For now, we'll log the action
      const result = {
        symbol,
        action: 'EMERGENCY_CLOSE',
        reason,
        timestamp: new Date().toISOString(),
        status: 'SIMULATED' // Would be 'EXECUTED' in real implementation
      };

      logger.info(`Emergency close result: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      logger.error(`Error in emergency close: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update risk configuration
   */
  updateRiskConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    logger.info('Risk management configuration updated');
  }

  /**
   * Get current risk status
   */
  getRiskStatus() {
    return {
      config: this.config,
      dailyStats: this.dailyStats,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new RiskManagementService();
