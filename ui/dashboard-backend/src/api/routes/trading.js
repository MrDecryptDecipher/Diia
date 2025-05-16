/**
 * Trading Routes for OMNI-ALPHA VΩ∞∞ Trading System Dashboard
 *
 * This module provides API endpoints for controlling the trading system.
 */

const express = require('express');
const router = express.Router();
const tradingStrategyService = require('../../services/trading-strategy-service');
const bybitClient = require('../../utils/bybit-client');
const logger = require('../../utils/logger');

/**
 * @route GET /api/trading/status
 * @description Get trading system status
 * @access Public
 */
router.get('/status', (req, res) => {
  const tradingState = tradingStrategyService.getTradingState();
  res.json({
    isActive: tradingState.isActive,
    currentCapital: tradingState.currentCapital,
    totalTrades: tradingState.totalTrades,
    successfulTrades: tradingState.successfulTrades,
    totalProfit: tradingState.totalProfit,
    openTrades: tradingState.openTrades.length,
    startTime: tradingState.startTime,
    dailyTradeCount: tradingState.dailyTradeCount,
    dailyProfit: tradingState.dailyProfit,
    evolutionStage: tradingState.evolutionStage
  });
});

/**
 * @route POST /api/trading/start
 * @description Start the trading system
 * @access Public
 */
router.post('/start', async (req, res) => {
  try {
    logger.info('Received request to start trading system');
    
    // Check if trading system is already active
    const tradingState = tradingStrategyService.getTradingState();
    if (tradingState.isActive) {
      logger.info('Trading system is already active');
      return res.json({
        success: true,
        message: 'Trading system is already active',
        tradingState: {
          isActive: tradingState.isActive,
          currentCapital: tradingState.currentCapital,
          totalTrades: tradingState.totalTrades,
          openTrades: tradingState.openTrades.length
        }
      });
    }
    
    // Request demo funds to ensure we have enough balance
    logger.info('Requesting demo funds from Bybit');
    await bybitClient.requestDemoFunds('USDT', '100');
    
    // Start the trading system
    logger.info('Starting trading system');
    await tradingStrategyService.start();
    
    // Get updated trading state
    const updatedTradingState = tradingStrategyService.getTradingState();
    
    logger.info('Trading system started successfully');
    res.json({
      success: true,
      message: 'Trading system started successfully',
      tradingState: {
        isActive: updatedTradingState.isActive,
        currentCapital: updatedTradingState.currentCapital,
        totalTrades: updatedTradingState.totalTrades,
        openTrades: updatedTradingState.openTrades.length
      }
    });
  } catch (error) {
    logger.error(`Error starting trading system: ${error.message}`);
    res.status(500).json({
      success: false,
      message: `Error starting trading system: ${error.message}`
    });
  }
});

/**
 * @route POST /api/trading/stop
 * @description Stop the trading system
 * @access Public
 */
router.post('/stop', (req, res) => {
  try {
    logger.info('Received request to stop trading system');
    
    // Check if trading system is already stopped
    const tradingState = tradingStrategyService.getTradingState();
    if (!tradingState.isActive) {
      logger.info('Trading system is already stopped');
      return res.json({
        success: true,
        message: 'Trading system is already stopped',
        tradingState: {
          isActive: tradingState.isActive,
          currentCapital: tradingState.currentCapital,
          totalTrades: tradingState.totalTrades,
          openTrades: tradingState.openTrades.length
        }
      });
    }
    
    // Stop the trading system
    logger.info('Stopping trading system');
    tradingStrategyService.stop();
    
    // Get updated trading state
    const updatedTradingState = tradingStrategyService.getTradingState();
    
    logger.info('Trading system stopped successfully');
    res.json({
      success: true,
      message: 'Trading system stopped successfully',
      tradingState: {
        isActive: updatedTradingState.isActive,
        currentCapital: updatedTradingState.currentCapital,
        totalTrades: updatedTradingState.totalTrades,
        openTrades: updatedTradingState.openTrades.length
      }
    });
  } catch (error) {
    logger.error(`Error stopping trading system: ${error.message}`);
    res.status(500).json({
      success: false,
      message: `Error stopping trading system: ${error.message}`
    });
  }
});

/**
 * @route POST /api/trading/execute-trade
 * @description Execute a single trade
 * @access Public
 */
router.post('/execute-trade', async (req, res) => {
  try {
    logger.info('Received request to execute a single trade');
    
    // Execute a trade
    const trade = await tradingStrategyService.executeAutomatedTrade();
    
    if (trade) {
      logger.info(`Trade executed successfully: ${trade.id}`);
      res.json({
        success: true,
        message: 'Trade executed successfully',
        trade
      });
    } else {
      logger.warn('Failed to execute trade');
      res.status(400).json({
        success: false,
        message: 'Failed to execute trade'
      });
    }
  } catch (error) {
    logger.error(`Error executing trade: ${error.message}`);
    res.status(500).json({
      success: false,
      message: `Error executing trade: ${error.message}`
    });
  }
});

/**
 * @route POST /api/trading/request-funds
 * @description Request demo funds from Bybit
 * @access Public
 */
router.post('/request-funds', async (req, res) => {
  try {
    const { coin = 'USDT', amount = '100' } = req.body;
    logger.info(`Requesting ${amount} ${coin} demo funds from Bybit`);
    
    const result = await bybitClient.requestDemoFunds(coin, amount);
    
    if (result.retCode === 0) {
      logger.info(`Successfully requested ${amount} ${coin} demo funds`);
      res.json({
        success: true,
        message: `Successfully requested ${amount} ${coin} demo funds`,
        result
      });
    } else {
      logger.warn(`Failed to request demo funds: ${result.retMsg}`);
      res.status(400).json({
        success: false,
        message: `Failed to request demo funds: ${result.retMsg}`,
        result
      });
    }
  } catch (error) {
    logger.error(`Error requesting demo funds: ${error.message}`);
    res.status(500).json({
      success: false,
      message: `Error requesting demo funds: ${error.message}`
    });
  }
});

module.exports = router;
