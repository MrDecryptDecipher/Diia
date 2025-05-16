/**
 * Ticker Service
 * 
 * This service provides market data and asset information from Bybit.
 */

const winston = require('winston');
const { BybitClient } = require('../utils/bybit-client');
const { generateMockData } = require('../utils/mock-data-generator');

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp }) => {
      return `${timestamp} [TICKER] ${level.toUpperCase()}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console()
  ]
});

// Initialize Bybit client
const bybitClient = new BybitClient();

// Cache for market data
let marketDataCache = {};
let assetInfoCache = {};
let lastUpdateTime = 0;

/**
 * Get the latest prices for all supported assets
 * @returns {Object} Object with symbol as key and price data as value
 */
function getLatestPrices() {
  try {
    // If we have real data from Bybit, use it
    if (Object.keys(marketDataCache).length > 0 && Date.now() - lastUpdateTime < 5000) {
      return marketDataCache;
    }

    // Try to get real data from Bybit
    const prices = bybitClient.getLatestPrices();
    
    if (prices && Object.keys(prices).length > 0) {
      marketDataCache = prices;
      lastUpdateTime = Date.now();
      return prices;
    }

    // Fall back to mock data if we couldn't get real data
    const { marketData } = generateMockData();
    return marketData;
  } catch (error) {
    logger.error(`Error getting latest prices: ${error.message}`);
    
    // Fall back to mock data if there's an error
    const { marketData } = generateMockData();
    return marketData;
  }
}

/**
 * Get detailed information about all supported assets
 * @returns {Array} Array of asset information objects
 */
function getAssetInfo() {
  try {
    // If we have real data from Bybit, use it
    if (assetInfoCache.length > 0 && Date.now() - lastUpdateTime < 60000) {
      return assetInfoCache;
    }

    // Try to get real data from Bybit
    const assets = bybitClient.getAssetInfo();
    
    if (assets && assets.length > 0) {
      assetInfoCache = assets;
      lastUpdateTime = Date.now();
      return assets;
    }

    // Fall back to mock data if we couldn't get real data
    const { assetInfo } = generateMockData();
    return assetInfo;
  } catch (error) {
    logger.error(`Error getting asset info: ${error.message}`);
    
    // Fall back to mock data if there's an error
    const { assetInfo } = generateMockData();
    return assetInfo;
  }
}

/**
 * Get historical price data for a specific symbol
 * @param {string} symbol - The trading pair symbol (e.g., BTCUSDT)
 * @param {string} interval - The time interval (e.g., 1m, 5m, 1h, 1d)
 * @param {number} limit - The number of candles to return
 * @returns {Array} Array of candle data
 */
function getHistoricalPrices(symbol, interval, limit) {
  try {
    // Try to get real data from Bybit
    const candles = bybitClient.getHistoricalPrices(symbol, interval, limit);
    
    if (candles && candles.length > 0) {
      return candles;
    }

    // Fall back to mock data if we couldn't get real data
    const { candleData } = generateMockData();
    return candleData;
  } catch (error) {
    logger.error(`Error getting historical prices: ${error.message}`);
    
    // Fall back to mock data if there's an error
    const { candleData } = generateMockData();
    return candleData;
  }
}

// Export the service
module.exports = {
  getLatestPrices,
  getAssetInfo,
  getHistoricalPrices
};
