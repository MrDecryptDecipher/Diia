/**
 * Bybit Client Service for OMNI-ALPHA VΩ∞∞ Trading System
 *
 * This service provides methods to interact with the Bybit API.
 */

const bybitClient = require('../utils/bybit-client');
const logger = require('../utils/logger');

/**
 * Get wallet balance from Bybit
 * @returns {Promise<Object>} - Wallet balance response
 */
async function getWalletBalance() {
  try {
    const response = await bybitClient.getWalletBalance();
    return response;
  } catch (error) {
    logger.error(`Error getting wallet balance: ${error.message}`);
    throw error;
  }
}

/**
 * Get positions from Bybit
 * @returns {Promise<Object>} - Positions response
 */
async function getPositions() {
  try {
    const response = await bybitClient.getPositions();
    return response;
  } catch (error) {
    logger.error(`Error getting positions: ${error.message}`);
    throw error;
  }
}

/**
 * Get recent trades from Bybit
 * @returns {Promise<Object>} - Recent trades response
 */
async function getRecentTrades() {
  try {
    const response = await bybitClient.getTradeHistory();
    return response;
  } catch (error) {
    logger.error(`Error getting recent trades: ${error.message}`);
    throw error;
  }
}

/**
 * Place an order on Bybit
 * @param {string} symbol - Trading symbol (e.g., BTCUSDT)
 * @param {string} side - Order side (Buy or Sell)
 * @param {string} orderType - Order type (Market or Limit)
 * @param {number} qty - Order quantity
 * @param {number} price - Order price (for Limit orders)
 * @param {number} takeProfit - Take profit price
 * @param {number} stopLoss - Stop loss price
 * @returns {Promise<Object>} - Order response
 */
async function placeOrder(symbol, side, orderType, qty, price, takeProfit, stopLoss) {
  try {
    const response = await bybitClient.placeOrder(symbol, side, orderType, qty, price, takeProfit, stopLoss);
    return response;
  } catch (error) {
    logger.error(`Error placing order: ${error.message}`);
    throw error;
  }
}

/**
 * Close a position on Bybit
 * @param {string} symbol - Trading symbol (e.g., BTCUSDT)
 * @param {number} positionIdx - Position index (0 for one-way mode)
 * @returns {Promise<Object>} - Close position response
 */
async function closePosition(symbol, positionIdx = 0) {
  try {
    const response = await bybitClient.closePosition(symbol, positionIdx);
    return response;
  } catch (error) {
    logger.error(`Error closing position: ${error.message}`);
    throw error;
  }
}

/**
 * Get kline data from Bybit
 * @param {string} symbol - Trading symbol (e.g., BTCUSDT)
 * @param {string} interval - Kline interval (e.g., 1, 5, 15, 60, D)
 * @param {number} limit - Number of klines to return
 * @returns {Promise<Object>} - Kline data response
 */
async function getKline(symbol, interval, limit) {
  try {
    const response = await bybitClient.getKline(symbol, interval, limit);
    return response;
  } catch (error) {
    logger.error(`Error getting kline data: ${error.message}`);
    throw error;
  }
}

/**
 * Get ticker data from Bybit
 * @param {string} symbol - Trading symbol (e.g., BTCUSDT)
 * @returns {Promise<Object>} - Ticker data response
 */
async function getTicker(symbol) {
  try {
    const response = await bybitClient.getTicker(symbol);
    return response;
  } catch (error) {
    logger.error(`Error getting ticker data: ${error.message}`);
    throw error;
  }
}

/**
 * Get all tickers from Bybit
 * @returns {Promise<Object>} - All tickers data response
 */
async function getAllTickers() {
  try {
    const response = await bybitClient.getAllTickers();
    return response;
  } catch (error) {
    logger.error(`Error getting all tickers data: ${error.message}`);
    throw error;
  }
}

/**
 * Get order book data from Bybit
 * @param {string} symbol - Trading symbol (e.g., BTCUSDT)
 * @param {number} limit - Number of order book levels to return
 * @returns {Promise<Object>} - Order book data response
 */
async function getOrderBook(symbol, limit) {
  try {
    const response = await bybitClient.getOrderBook(symbol, limit);
    return response;
  } catch (error) {
    logger.error(`Error getting order book data: ${error.message}`);
    throw error;
  }
}

/**
 * Request demo funds from Bybit
 * @param {string} coin - Coin to request (e.g., USDT)
 * @param {number} amount - Amount to request
 * @returns {Promise<Object>} - Request demo funds response
 */
async function requestDemoFunds(coin = 'USDT', amount = '100') {
  try {
    const response = await bybitClient.requestDemoFunds(coin, amount);
    return response;
  } catch (error) {
    logger.error(`Error requesting demo funds: ${error.message}`);
    throw error;
  }
}

module.exports = {
  getWalletBalance,
  getPositions,
  getRecentTrades,
  placeOrder,
  closePosition,
  getKline,
  getTicker,
  getAllTickers,
  getOrderBook,
  requestDemoFunds
};
