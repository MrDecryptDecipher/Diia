/**
 * Metrics Routes for OMNI-ALPHA VΩ∞∞ Trading System Dashboard
 *
 * This module provides API endpoints for system metrics.
 */

const express = require('express');
const router = express.Router();
const bybitDataService = require('../../services/bybit-data-service');
const tradingStrategyService = require('../../services/trading-strategy-service');
const logger = require('../../utils/logger');
const { io } = require('../../websocket-server');

// Initialize and start the trading strategy service
tradingStrategyService.initialize();
tradingStrategyService.start();

// Set up periodic metrics updates
let metricsUpdateInterval;
let lastMetrics = null;

const startMetricsUpdates = () => {
  if (metricsUpdateInterval) {
    clearInterval(metricsUpdateInterval);
  }

  // Update metrics every 5 seconds
  metricsUpdateInterval = setInterval(async () => {
    try {
      const metrics = await getComprehensiveMetrics();

      // Check if metrics have changed
      if (JSON.stringify(metrics) !== JSON.stringify(lastMetrics)) {
        lastMetrics = metrics;

        // Emit metrics update to all connected clients
        if (io) {
          io.emit('metrics', metrics);
          logger.info('Emitted metrics update via WebSocket');
        }
      }
    } catch (error) {
      logger.error('Error updating metrics:', error);
    }
  }, 5000);

  logger.info('Started periodic metrics updates');
};

// Start metrics updates
startMetricsUpdates();

/**
 * Get comprehensive metrics from all available sources
 * @returns {Promise<Object>} Comprehensive metrics
 */
async function getComprehensiveMetrics() {
  // Get base metrics from trading strategy service
  const metrics = tradingStrategyService.getSystemMetrics();

  try {
    // Get wallet balance from Bybit
    const walletResponse = await bybitDataService.getWalletBalance();
    if (walletResponse.retCode === 0 && walletResponse.result && walletResponse.result.list) {
      const walletInfo = walletResponse.result.list[0];
      const usdtCoin = walletInfo.coin.find(c => c.coin === 'USDT');

      if (usdtCoin) {
        // Update metrics with actual wallet balance
        metrics.currentCapital = parseFloat(usdtCoin.availableToWithdraw);
        metrics.pnl = metrics.currentCapital - metrics.initialCapital;
        metrics.pnlPercentage = (metrics.pnl / metrics.initialCapital) * 100;

        logger.info(`Updated metrics with actual wallet balance: ${metrics.currentCapital} USDT`);
      }
    }

    // Get open positions from Bybit
    const positionsResponse = await bybitDataService.getPositions();
    if (positionsResponse.retCode === 0 && positionsResponse.result && positionsResponse.result.list) {
      const positions = positionsResponse.result.list;

      // Calculate total position value
      let totalPositionValue = 0;
      let totalUnrealizedPnL = 0;

      positions.forEach(position => {
        if (parseFloat(position.size) > 0) {
          const positionValue = parseFloat(position.size) * parseFloat(position.entryPrice);
          totalPositionValue += positionValue;
          totalUnrealizedPnL += parseFloat(position.unrealisedPnl);
        }
      });

      // Update metrics with position data
      metrics.openPositions = positions.filter(p => parseFloat(p.size) > 0).length;
      metrics.totalPositionValue = totalPositionValue;
      metrics.totalUnrealizedPnL = totalUnrealizedPnL;
      metrics.leverageUsed = positions.length > 0 ?
        positions.reduce((sum, p) => sum + parseFloat(p.leverage), 0) / positions.length : 0;

      logger.info(`Updated metrics with position data: ${metrics.openPositions} open positions`);
    }

    // Get recent trades from Bybit
    const tradesResponse = await bybitDataService.getRecentTrades();
    if (tradesResponse.retCode === 0 && tradesResponse.result && tradesResponse.result.list) {
      const trades = tradesResponse.result.list;

      // Calculate trade metrics
      metrics.totalTrades = trades.length;
      metrics.winningTrades = trades.filter(t => parseFloat(t.closedPnl) > 0).length;
      metrics.losingTrades = trades.filter(t => parseFloat(t.closedPnl) < 0).length;
      metrics.winRate = metrics.totalTrades > 0 ? (metrics.winningTrades / metrics.totalTrades) * 100 : 0;

      // Calculate average profit per trade
      if (metrics.winningTrades > 0) {
        const totalProfit = trades
          .filter(t => parseFloat(t.closedPnl) > 0)
          .reduce((sum, t) => sum + parseFloat(t.closedPnl), 0);
        metrics.averageProfitPerTrade = totalProfit / metrics.winningTrades;
      }

      // Calculate average loss per trade
      if (metrics.losingTrades > 0) {
        const totalLoss = trades
          .filter(t => parseFloat(t.closedPnl) < 0)
          .reduce((sum, t) => sum + parseFloat(t.closedPnl), 0);
        metrics.averageLossPerTrade = totalLoss / metrics.losingTrades;
      }

      // Find best and worst trades
      if (trades.length > 0) {
        const sortedTrades = [...trades].sort((a, b) => parseFloat(b.closedPnl) - parseFloat(a.closedPnl));
        metrics.bestTrade = sortedTrades[0];
        metrics.worstTrade = sortedTrades[sortedTrades.length - 1];
      }

      logger.info(`Updated metrics with trade data: ${metrics.totalTrades} total trades`);
    }

    // Calculate additional metrics
    metrics.tradingFrequency = metrics.totalTrades / (metrics.systemUptime / 3600); // trades per hour
    metrics.profitFactor = metrics.averageProfitPerTrade && metrics.averageLossPerTrade ?
      Math.abs(metrics.averageProfitPerTrade / metrics.averageLossPerTrade) : 0;
    metrics.expectancy = (metrics.winRate / 100) * metrics.averageProfitPerTrade +
      (1 - metrics.winRate / 100) * metrics.averageLossPerTrade;

    // Update system efficiency metrics
    metrics.systemEfficiency = calculateSystemEfficiency(metrics);
    metrics.capitalUtilization = metrics.totalPositionValue / metrics.currentCapital * 100;
    metrics.riskRewardRatio = metrics.averageProfitPerTrade && metrics.averageLossPerTrade ?
      Math.abs(metrics.averageProfitPerTrade / metrics.averageLossPerTrade) : 0;

    // Update quantum prediction metrics
    metrics.quantumPredictionAccuracy = tradingStrategyService.getQuantumPredictionAccuracy();
    metrics.hyperdimensionalPatternAccuracy = tradingStrategyService.getHyperdimensionalPatternAccuracy();

  } catch (error) {
    logger.error('Error fetching comprehensive metrics:', error);
  }

  return metrics;
}

/**
 * Calculate system efficiency based on various metrics
 * @param {Object} metrics - System metrics
 * @returns {number} System efficiency percentage
 */
function calculateSystemEfficiency(metrics) {
  // Calculate system efficiency based on various factors
  const winRateWeight = 0.3;
  const profitFactorWeight = 0.3;
  const capitalUtilizationWeight = 0.2;
  const tradingFrequencyWeight = 0.2;

  // Normalize metrics to 0-100 scale
  const normalizedWinRate = metrics.winRate;
  const normalizedProfitFactor = Math.min(metrics.profitFactor * 10, 100);
  const normalizedCapitalUtilization = Math.min(metrics.capitalUtilization, 100);
  const normalizedTradingFrequency = Math.min(metrics.tradingFrequency * 5, 100); // 20 trades per hour = 100%

  // Calculate weighted average
  const efficiency =
    normalizedWinRate * winRateWeight +
    normalizedProfitFactor * profitFactorWeight +
    normalizedCapitalUtilization * capitalUtilizationWeight +
    normalizedTradingFrequency * tradingFrequencyWeight;

  return Math.min(Math.max(efficiency, 0), 100);
}

// Get all metrics
router.get('/', async (req, res) => {
  try {
    const metrics = await getComprehensiveMetrics();
    res.json(metrics);
  } catch (error) {
    logger.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// Get performance metrics
router.get('/performance', async (req, res) => {
  try {
    const metrics = tradingStrategyService.getSystemMetrics();

    const performanceMetrics = {
      initialCapital: metrics.initialCapital,
      currentCapital: metrics.currentCapital,
      pnl: metrics.pnl,
      pnlPercentage: metrics.pnlPercentage,
      sharpeRatio: metrics.sharpeRatio,
      sortinoRatio: metrics.sortinoRatio,
      calmarRatio: metrics.calmarRatio,
      maxDrawdown: metrics.maxDrawdown,
      volatility: metrics.volatility,
      bestTrade: metrics.bestTrade,
      worstTrade: metrics.worstTrade
    };

    res.json(performanceMetrics);
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    res.status(500).json({ error: 'Failed to fetch performance metrics' });
  }
});

// Get trade metrics
router.get('/trades', async (req, res) => {
  try {
    const metrics = tradingStrategyService.getSystemMetrics();

    const tradeMetrics = {
      totalTrades: metrics.totalTrades,
      winningTrades: metrics.winningTrades,
      losingTrades: metrics.losingTrades,
      winRate: metrics.winRate,
      averageProfitPerTrade: metrics.averageProfitPerTrade,
      averageLossPerTrade: metrics.averageLossPerTrade,
      averageTradeHoldingTime: metrics.averageTradeHoldingTime,
      tradingFrequency: metrics.tradingFrequency,
      profitFactor: metrics.profitFactor,
      expectancy: metrics.expectancy
    };

    res.json(tradeMetrics);
  } catch (error) {
    console.error('Error fetching trade metrics:', error);
    res.status(500).json({ error: 'Failed to fetch trade metrics' });
  }
});

// Get system efficiency metrics
router.get('/efficiency', async (req, res) => {
  try {
    const metrics = tradingStrategyService.getSystemMetrics();

    const efficiencyMetrics = {
      systemEfficiency: metrics.systemEfficiency,
      capitalUtilization: metrics.capitalUtilization,
      riskRewardRatio: metrics.riskRewardRatio,
      quantumPredictionAccuracy: metrics.quantumPredictionAccuracy,
      hyperdimensionalPatternAccuracy: metrics.hyperdimensionalPatternAccuracy,
      zeroLossEnforcementEfficiency: metrics.zeroLossEnforcementEfficiency,
      godKernelEvolutionStage: metrics.godKernelEvolutionStage,
      antiLossHedgingEfficiency: metrics.antiLossHedgingEfficiency
    };

    res.json(efficiencyMetrics);
  } catch (error) {
    console.error('Error fetching efficiency metrics:', error);
    res.status(500).json({ error: 'Failed to fetch efficiency metrics' });
  }
});

// Get wallet balance
router.get('/wallet', async (req, res) => {
  try {
    const walletBalance = await bybitDataService.getWalletBalance();
    res.json(walletBalance);
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    res.status(500).json({ error: 'Failed to fetch wallet balance' });
  }
});

// Request demo funds
router.post('/request-funds', async (req, res) => {
  try {
    const { coin = 'USDT', amount = '100' } = req.body;
    const result = await bybitDataService.requestDemoFunds(coin, amount);
    res.json(result);
  } catch (error) {
    console.error('Error requesting demo funds:', error);
    res.status(500).json({ error: 'Failed to request demo funds' });
  }
});

module.exports = router;
