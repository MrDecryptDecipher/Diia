/**
 * Bybit API Client for OMNI-ALPHA VΩ∞∞ Trading System
 *
 * This module provides functions to interact with the Bybit API using demo account credentials.
 */

const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { RestClientV5 } = require('bybit-api');
const logger = require('./logger');

// Load environment variables from demo.env
const envPaths = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../../../demo.env'),
  path.resolve(__dirname, '../../../.env')
];

let envLoaded = false;
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    logger.info(`Loading environment from: ${envPath}`);
    dotenv.config({ path: envPath });
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  logger.error('No environment file found. API calls will fail.');
}

// 🔄 HYBRID CONFIGURATION: Real Data + Demo Trading
// Data Source: Real Bybit API (live market data)
// Trading Execution: Demo Bybit API (safe execution)

// REAL API for market data (no credentials needed for public endpoints)
const REAL_BASE_URL = 'https://api.bybit.com';

// DEMO API for trading execution
const DEMO_API_KEY = process.env.BYBIT_DEMO_API_KEY || 'lCMnwPKIzXASNWn6UE';
const DEMO_API_SECRET = process.env.BYBIT_DEMO_API_SECRET || 'aXjs1SF9tmW3riHMktmjtyOyAT85puvrVstr';
const DEMO_BASE_URL = 'https://api-demo.bybit.com';

// Set API credentials for the custom functions
const API_KEY = DEMO_API_KEY;
const API_SECRET = DEMO_API_SECRET;
const BASE_URL = DEMO_BASE_URL;

// Log configuration
logger.info(`🔄 HYBRID MODE ENABLED:`);
logger.info(`📊 Market Data Source: ${REAL_BASE_URL} (REAL)`);
logger.info(`🛡️ Trading Execution: ${DEMO_BASE_URL} (DEMO)`);
logger.info(`Demo API Key: ${DEMO_API_KEY.substring(0, 3)}...${DEMO_API_KEY.substring(DEMO_API_KEY.length - 3)}`);

// Initialize REAL client for market data (public endpoints)
const realDataClient = new RestClientV5({
  testnet: false,
  baseUrl: REAL_BASE_URL // Real API for live market data
});

// Initialize DEMO client for trading execution
const demoTradingClient = new RestClientV5({
  key: DEMO_API_KEY,
  secret: DEMO_API_SECRET,
  testnet: false,
  baseUrl: DEMO_BASE_URL // Demo API for safe trading
});

// Main client (for backward compatibility) - uses demo for trading
const bybitClient = demoTradingClient;

/**
 * Generate signature for Bybit API authentication
 * @param {string} timestamp - Current timestamp in milliseconds
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @param {string} path - API endpoint path
 * @param {string} queryString - Query string for GET requests
 * @param {string} body - Request body for POST requests
 * @returns {string} - HMAC SHA256 signature
 */
function generateSignature(timestamp, method, path, queryString = '', body = '') {
  if (!API_SECRET) {
    logger.error('Missing API secret. Cannot generate signature.');
    return '';
  }

  // Log available environment variables (without revealing full values)
  logger.info('Available environment variables:');
  if (process.env.BYBIT_DEMO_API_KEY) {
    logger.info(`  BYBIT_DEMO_API_KEY: ${process.env.BYBIT_DEMO_API_KEY.substring(0, 3)}...${process.env.BYBIT_DEMO_API_KEY.substring(process.env.BYBIT_DEMO_API_KEY.length - 3)}`);
  }
  if (process.env.BYBIT_DEMO_API_SECRET) {
    logger.info(`  BYBIT_DEMO_API_SECRET: ${process.env.BYBIT_DEMO_API_SECRET.substring(0, 3)}...${process.env.BYBIT_DEMO_API_SECRET.substring(process.env.BYBIT_DEMO_API_SECRET.length - 3)}`);
  }

  // Create the string to sign according to Bybit documentation
  // For V5 API, the string to sign is: timestamp + API_KEY + recv_window + queryString/body
  let signString = timestamp + API_KEY + '5000';

  if (method === 'GET' && queryString) {
    signString += queryString;
  } else if (method === 'POST' && body) {
    signString += body;
  }

  try {
    return crypto
      .createHmac('sha256', API_SECRET)
      .update(signString)
      .digest('hex');
  } catch (error) {
    logger.error(`Error generating signature: ${error.message}`);
    return '';
  }
}

/**
 * Make a GET request to the Bybit API with retry logic
 * @param {string} endpoint - API endpoint
 * @param {Object} params - Query parameters
 * @param {number} maxRetries - Maximum number of retries (default: 3)
 * @param {number} retryDelay - Delay between retries in ms (default: 1000)
 * @returns {Promise<Object>} - API response
 */
async function get(endpoint, params = {}, maxRetries = 3, retryDelay = 1000) {
  let retries = 0;

  while (retries <= maxRetries) {
    try {
      // Check if API credentials are available
      if (!API_KEY || !API_SECRET) {
        logger.error('Missing API credentials. Cannot make API request.');
        return {
          retCode: -1,
          retMsg: 'Missing API credentials',
          result: null
        };
      }

      // Sort parameters alphabetically
      const sortedParams = Object.keys(params).sort().reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {});

      // Create query string
      const queryString = Object.entries(sortedParams)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');

      // Create full URL
      const url = `${BASE_URL}${endpoint}${queryString ? `?${queryString}` : ''}`;

      // Generate timestamp
      const timestamp = Date.now().toString();

      // Generate signature
      const signature = generateSignature(timestamp, 'GET', endpoint, queryString);

      // If signature generation failed, return error
      if (!signature) {
        return {
          retCode: -1,
          retMsg: 'Failed to generate signature',
          result: null
        };
      }

      logger.debug(`Making GET request to ${url} (Attempt ${retries + 1}/${maxRetries + 1})`);

      // Make the request
      const response = await axios.get(url, {
        headers: {
          'X-BAPI-API-KEY': API_KEY,
          'X-BAPI-TIMESTAMP': timestamp,
          'X-BAPI-SIGN': signature,
          'X-BAPI-RECV-WINDOW': '5000'
        },
        timeout: 30000 // 30 seconds timeout
      });

      // Check if the response is successful
      if (response.data && response.data.retCode === 0) {
        return response.data;
      } else if (response.data) {
        // If we get a response with an error code, log it and retry if appropriate
        logger.warn(`Bybit API returned error: ${response.data.retMsg} (Code: ${response.data.retCode})`);

        // Check if the error is retryable
        if (isRetryableError(response.data.retCode)) {
          retries++;
          if (retries <= maxRetries) {
            const delay = retryDelay * Math.pow(2, retries - 1); // Exponential backoff
            logger.info(`Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }

        return response.data;
      }

      return response.data;
    } catch (error) {
      logger.error(`Error making GET request to ${endpoint}: ${error.message}`);

      if (error.response) {
        logger.error(`Response status: ${error.response.status}`);
        logger.error(`Response data: ${JSON.stringify(error.response.data)}`);

        // If we get a rate limit error, wait and retry
        if (error.response.status === 429) {
          retries++;
          if (retries <= maxRetries) {
            const delay = retryDelay * Math.pow(2, retries - 1); // Exponential backoff
            logger.info(`Rate limited. Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
      }

      // For network errors, retry
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
        retries++;
        if (retries <= maxRetries) {
          const delay = retryDelay * Math.pow(2, retries - 1); // Exponential backoff
          logger.info(`Network error. Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }

      // If we've exhausted retries or it's not a retryable error, return error
      return {
        retCode: -1,
        retMsg: error.message,
        result: null
      };
    }
  }

  // If we've exhausted retries, return a generic error
  return {
    retCode: -1,
    retMsg: `Failed after ${maxRetries} retries`,
    result: null
  };
}

/**
 * Check if an error code is retryable
 * @param {number} retCode - Bybit API return code
 * @returns {boolean} - Whether the error is retryable
 */
function isRetryableError(retCode) {
  // List of retryable error codes
  const retryableCodes = [
    10002, // Request rate limit exceeded
    10006, // Too many requests
    10018, // Service unavailable
    10019, // Server busy
    -1, // Generic error
    -2011, // Unknown error
    -2013, // Order does not exist
    -2014, // Bad API key format
    -2015, // Invalid API key, IP, or permissions for action
  ];

  return retryableCodes.includes(retCode);
}

/**
 * Make a POST request to the Bybit API with retry logic
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request body
 * @param {number} maxRetries - Maximum number of retries (default: 3)
 * @param {number} retryDelay - Delay between retries in ms (default: 1000)
 * @returns {Promise<Object>} - API response
 */
async function post(endpoint, data = {}, maxRetries = 3, retryDelay = 1000) {
  let retries = 0;

  while (retries <= maxRetries) {
    try {
      // Check if API credentials are available
      if (!API_KEY || !API_SECRET) {
        logger.error('Missing API credentials. Cannot make API request.');
        return {
          retCode: -1,
          retMsg: 'Missing API credentials',
          result: null
        };
      }

      // Convert data to JSON string
      const jsonBody = JSON.stringify(data);

      // Generate timestamp
      const timestamp = Date.now().toString();

      // Generate signature
      const signature = generateSignature(timestamp, 'POST', endpoint, '', jsonBody);

      // If signature generation failed, return error
      if (!signature) {
        return {
          retCode: -1,
          retMsg: 'Failed to generate signature',
          result: null
        };
      }

      logger.info(`Making POST request to ${BASE_URL}${endpoint} (Attempt ${retries + 1}/${maxRetries + 1})`);
      logger.debug(`Request body: ${jsonBody}`);

      // Make the request
      const response = await axios.post(`${BASE_URL}${endpoint}`, data, {
        headers: {
          'X-BAPI-API-KEY': API_KEY,
          'X-BAPI-TIMESTAMP': timestamp,
          'X-BAPI-SIGN': signature,
          'X-BAPI-RECV-WINDOW': '5000',
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 seconds timeout
      });

      // Check if the response is successful
      if (response.data && response.data.retCode === 0) {
        logger.info(`Successful response from ${endpoint}: ${JSON.stringify(response.data)}`);
        return response.data;
      } else if (response.data) {
        // If we get a response with an error code, log it and retry if appropriate
        logger.warn(`Bybit API returned error: ${response.data.retMsg} (Code: ${response.data.retCode})`);

        // Check if the error is retryable
        if (isRetryableError(response.data.retCode)) {
          retries++;
          if (retries <= maxRetries) {
            const delay = retryDelay * Math.pow(2, retries - 1); // Exponential backoff
            logger.info(`Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }

        return response.data;
      }

      return response.data;
    } catch (error) {
      logger.error(`Error making POST request to ${endpoint}: ${error.message}`);

      if (error.response) {
        logger.error(`Response status: ${error.response.status}`);
        logger.error(`Response data: ${JSON.stringify(error.response.data)}`);

        // If we get a rate limit error, wait and retry
        if (error.response.status === 429) {
          retries++;
          if (retries <= maxRetries) {
            const delay = retryDelay * Math.pow(2, retries - 1); // Exponential backoff
            logger.info(`Rate limited. Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
      }

      // For network errors, retry
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
        retries++;
        if (retries <= maxRetries) {
          const delay = retryDelay * Math.pow(2, retries - 1); // Exponential backoff
          logger.info(`Network error. Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }

      // If we've exhausted retries or it's not a retryable error, return error
      return {
        retCode: -1,
        retMsg: error.message,
        result: null
      };
    }
  }

  // If we've exhausted retries, return a generic error
  return {
    retCode: -1,
    retMsg: `Failed after ${maxRetries} retries`,
    result: null
  };
}

/**
 * Get wallet balance
 * @returns {Promise<Object>} - Wallet balance data
 */
async function getWalletBalance() {
  return get('/v5/account/wallet-balance', { accountType: 'UNIFIED' });
}

/**
 * Get all available symbols (trading pairs)
 * @returns {Promise<Object>} - Available symbols
 */
async function getSymbols() {
  return get('/v5/market/instruments-info', { category: 'linear' });
}

/**
 * Get ticker information for a symbol
 * 🔄 HYBRID: Uses REAL market data from live Bybit API
 * @param {string} symbol - Trading pair symbol (e.g., 'BTCUSDT')
 * @returns {Promise<Object>} - Ticker data
 */
async function getTicker(symbol) {
  try {
    // 📊 Use REAL client for live market data
    const response = await realDataClient.getTickers({
      category: 'linear',
      symbol
    });
    return response;
  } catch (error) {
    logger.error(`Error fetching ticker data: ${error.message}`);
    throw error;
  }
}

/**
 * Get all tickers
 * 🔄 HYBRID: Uses REAL market data from live Bybit API
 * @returns {Promise<Object>} - All tickers data
 */
async function getAllTickers() {
  try {
    // 📊 Use REAL client for live market data
    const response = await realDataClient.getTickers({
      category: 'linear'
    });
    return response;
  } catch (error) {
    logger.error(`Error getting all tickers from real API: ${error.message}`);
    // Fallback to demo API if real API fails
    return get('/v5/market/tickers', { category: 'linear' });
  }
}

/**
 * Get positions
 * @param {string} symbol - Optional symbol to filter positions
 * @returns {Promise<Object>} - Positions data
 */
async function getPositions(symbol = '') {
  const params = {
    category: 'linear',
    settleCoin: 'USDT'
  };
  if (symbol) {
    params.symbol = symbol;
  }
  return get('/v5/position/list', params);
}

/**
 * Get open orders
 * @param {string} symbol - Optional symbol to filter orders
 * @returns {Promise<Object>} - Open orders data
 */
async function getOpenOrders(symbol = '') {
  const params = { category: 'linear' };
  if (symbol) {
    params.symbol = symbol;
  }
  return get('/v5/order/realtime', params);
}

/**
 * Get order history
 * @param {string} symbol - Optional symbol to filter orders
 * @param {number} limit - Number of orders to retrieve
 * @returns {Promise<Object>} - Order history data
 */
async function getOrderHistory(symbol = '', limit = 50) {
  const params = { category: 'linear', limit };
  if (symbol) {
    params.symbol = symbol;
  }
  return get('/v5/order/history', params);
}

/**
 * Get execution history (filled orders)
 * @param {string} symbol - Optional symbol to filter executions
 * @param {number} limit - Number of executions to retrieve
 * @returns {Promise<Object>} - Execution history data
 */
async function getExecutionHistory(symbol = '', limit = 50) {
  const params = { category: 'linear', limit };
  if (symbol) {
    params.symbol = symbol;
  }
  return get('/v5/execution/list', params);
}

/**
 * Place an order
 * 🛡️ HYBRID: Uses DEMO API for safe trading execution
 * @param {Object} orderParams - Order parameters
 * @returns {Promise<Object>} - Order response
 */
async function placeOrder(orderParams) {
  try {
    logger.info(`🛡️ DEMO TRADING: Placing order with side: "${orderParams.side}" (type: ${typeof orderParams.side})`);
    // 🛡️ Use DEMO client for safe trading execution
    const response = await demoTradingClient.submitOrder({
      category: 'linear',
      ...orderParams
    });
    return response;
  } catch (error) {
    logger.error(`Error placing order: ${error.message}`);
    throw error;
  }
}

/**
 * Set leverage for a symbol
 * @param {string} symbol - Trading pair symbol
 * @param {number} buyLeverage - Buy side leverage
 * @param {number} sellLeverage - Sell side leverage
 * @returns {Promise<Object>} - API response
 */
async function setLeverage(symbol, buyLeverage, sellLeverage) {
  const params = {
    category: 'linear',
    symbol,
    buyLeverage: buyLeverage.toString(),
    sellLeverage: sellLeverage.toString()
  };
  return post('/v5/position/set-leverage', params);
}

/**
 * Request demo trading funds
 * @param {string} coin - Coin to request (USDT, BTC, ETH, USDC)
 * @param {string} amount - Amount to request
 * @returns {Promise<Object>} - API response
 */
async function requestDemoFunds(coin = 'USDT', amount = '100') {
  try {
    logger.info(`Requesting ${amount} ${coin} demo funds from Bybit`);

    // According to Bybit demo documentation, this is the correct endpoint for requesting demo funds
    // API rate limit: 1 req per minute
    // Maximum amounts per request:
    // BTC: "15"
    // ETH: "200"
    // USDT: "100000"
    // USDC: "100000"
    const response = await post('/v5/account/demo-apply-money', {
      adjustType: 0, // 0: add demo funds; 1: reduce demo funds
      utaDemoApplyMoney: [
        {
          coin,
          amountStr: amount
        }
      ]
    });

    if (response.retCode === 0) {
      logger.info(`Successfully requested ${amount} ${coin} demo funds`);
    } else {
      logger.error(`Failed to request demo funds: ${response.retMsg}`);
    }

    return response;
  } catch (error) {
    logger.error(`Error requesting demo funds: ${error.message}`);
    return { retCode: -1, retMsg: error.message, result: null };
  }
}

/**
 * Place a conditional order (e.g., take profit or stop loss)
 * @param {Object} orderParams - Order parameters
 * @returns {Promise<Object>} - API response
 */
async function placeConditionalOrder(orderParams) {
  try {
    // Ensure we have the required parameters
    if (!orderParams.symbol) {
      logger.error('Missing required parameter: symbol');
      return { retCode: -1, retMsg: 'Missing required parameter: symbol', result: null };
    }

    if (!orderParams.side) {
      logger.error('Missing required parameter: side');
      return { retCode: -1, retMsg: 'Missing required parameter: side', result: null };
    }

    if (!orderParams.triggerPrice) {
      logger.error('Missing required parameter: triggerPrice');
      return { retCode: -1, retMsg: 'Missing required parameter: triggerPrice', result: null };
    }

    if (!orderParams.qty) {
      logger.error('Missing required parameter: qty');
      return { retCode: -1, retMsg: 'Missing required parameter: qty', result: null };
    }

    // Get current market price to determine trigger direction
    let currentPrice;
    try {
      // According to Bybit documentation, we need to use the tickers endpoint
      const tickerResponse = await get('/v5/market/tickers', {
        category: 'linear',
        symbol: orderParams.symbol
      });

      if (tickerResponse.retCode === 0 && tickerResponse.result && tickerResponse.result.list && tickerResponse.result.list.length > 0) {
        currentPrice = parseFloat(tickerResponse.result.list[0].lastPrice);
        logger.info(`Current price for ${orderParams.symbol}: ${currentPrice}`);
      } else {
        logger.warn(`Could not get current price for ${orderParams.symbol}, using estimated value`);
        // If we can't get the current price, use the trigger price as an estimate
        currentPrice = parseFloat(orderParams.triggerPrice) * (orderParams.side === 'Buy' ? 1.05 : 0.95);
      }
    } catch (error) {
      logger.error(`Error getting current price: ${error.message}`);
      // If we can't get the current price, use the trigger price as an estimate
      currentPrice = parseFloat(orderParams.triggerPrice) * (orderParams.side === 'Buy' ? 1.05 : 0.95);
    }

    // Determine trigger direction based on side and current price
    // According to Bybit documentation:
    // triggerDirection: 1 (rise), 2 (fall)
    // For Buy orders:
    // - If trigger price > current price, use 1 (rise) - Buy when price rises to trigger price
    // - If trigger price < current price, use 2 (fall) - Buy when price falls to trigger price
    // For Sell orders:
    // - If trigger price > current price, use 2 (fall) - Sell when price falls from current to trigger
    // - If trigger price < current price, use 1 (rise) - Sell when price rises from current to trigger
    const triggerPrice = parseFloat(orderParams.triggerPrice);
    let triggerDirection;

    if (orderParams.side === 'Buy') {
      triggerDirection = triggerPrice > currentPrice ? 1 : 2;
    } else { // Sell
      triggerDirection = triggerPrice > currentPrice ? 2 : 1;
    }

    logger.info(`Determined trigger direction: ${triggerDirection} (1=rise, 2=fall) for ${orderParams.side} order with trigger price ${triggerPrice} and current price ${currentPrice}`);

    // Prepare the order parameters according to Bybit API v5 documentation
    const params = {
      category: 'linear',
      symbol: orderParams.symbol,
      side: orderParams.side,
      orderType: orderParams.orderType || 'Market',
      qty: orderParams.qty,
      triggerPrice: orderParams.triggerPrice,
      triggerBy: orderParams.triggerBy || 'LastPrice',
      triggerDirection: orderParams.triggerDirection || triggerDirection,
      timeInForce: orderParams.timeInForce || 'GoodTillCancel',
      reduceOnly: orderParams.reduceOnly !== undefined ? orderParams.reduceOnly : true,
      closeOnTrigger: orderParams.closeOnTrigger !== undefined ? orderParams.closeOnTrigger : true
    };

    // Add price for limit orders
    if (orderParams.orderType === 'Limit' && orderParams.price) {
      params.price = orderParams.price;
    }

    // Log the order parameters
    logger.info(`Placing conditional order with parameters: ${JSON.stringify(params)}`);
    logger.info(`DEBUG: Order side parameter: "${params.side}" (type: ${typeof params.side})`);

    // Use the standard order creation endpoint with triggerPrice parameter
    // According to Bybit API v5 docs, this automatically makes it a conditional order
    // The endpoint is the same for both regular and conditional orders
    return post('/v5/order/create', params);
  } catch (error) {
    logger.error(`Error in placeConditionalOrder: ${error.message}`);
    return { retCode: -1, retMsg: error.message, result: null };
  }
}

/**
 * Cancel all open orders for a symbol
 * @param {string} symbol - Trading pair symbol
 * @returns {Promise<Object>} - API response
 */
async function cancelAllOrders(symbol) {
  const params = {
    category: 'linear',
    symbol
  };
  return post('/v5/order/cancel-all', params);
}

/**
 * Get wallet balance and request more funds if needed
 * @param {number} minBalance - Minimum balance required
 * @returns {Promise<Object>} - Wallet balance data
 */
async function ensureMinimumBalance(minBalance = 12) {
  try {
    const balanceResponse = await getWalletBalance();

    if (balanceResponse.retCode === 0 && balanceResponse.result && balanceResponse.result.list) {
      const walletInfo = balanceResponse.result.list[0];
      const usdtCoin = walletInfo.coin.find(c => c.coin === 'USDT');

      if (usdtCoin && parseFloat(usdtCoin.availableToWithdraw) < minBalance) {
        logger.info(`USDT balance (${usdtCoin.availableToWithdraw}) below minimum (${minBalance}). Requesting more funds.`);
        await requestDemoFunds('USDT', '100');

        // Wait a bit for the funds to be credited
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Get updated balance
        return getWalletBalance();
      }

      return balanceResponse;
    }

    return balanceResponse;
  } catch (error) {
    logger.error(`Error in ensureMinimumBalance: ${error.message}`);
    return { retCode: -1, retMsg: error.message, result: null };
  }
}

/**
 * BybitClient class for easier integration with the ticker service
 */
class BybitClient {
  /**
   * Get the latest prices for all supported assets
   * @returns {Object} Object with symbol as key and price data as value
   */
  getLatestPrices() {
    try {
      // This is an async function but we're calling it synchronously
      // We'll return a cached result or mock data instead
      const cachedData = this.getCachedMarketData();
      if (cachedData && Object.keys(cachedData).length > 0) {
        return cachedData;
      }

      // If no cached data, return empty object
      // The ticker service will fall back to mock data
      return {};
    } catch (error) {
      logger.error(`Error in getLatestPrices: ${error.message}`);
      return {};
    }
  }

  /**
   * Get detailed information about all supported assets
   * @returns {Array} Array of asset information objects
   */
  getAssetInfo() {
    try {
      // This is an async function but we're calling it synchronously
      // We'll return a cached result or mock data instead
      const cachedData = this.getCachedAssetInfo();
      if (cachedData && cachedData.length > 0) {
        return cachedData;
      }

      // If no cached data, return empty array
      // The ticker service will fall back to mock data
      return [];
    } catch (error) {
      logger.error(`Error in getAssetInfo: ${error.message}`);
      return [];
    }
  }

  /**
   * Get historical price data for a specific symbol
   * @param {string} symbol - The trading pair symbol (e.g., BTCUSDT)
   * @param {string} interval - The time interval (e.g., 1m, 5m, 1h, 1d)
   * @param {number} limit - The number of candles to return
   * @returns {Array} Array of candle data
   */
  getHistoricalPrices(symbol, interval, limit) {
    try {
      // This is an async function but we're calling it synchronously
      // We'll return a cached result or mock data instead
      return [];
    } catch (error) {
      logger.error(`Error in getHistoricalPrices: ${error.message}`);
      return [];
    }
  }

  /**
   * Get cached market data from a local file or memory
   * @returns {Object} Cached market data
   */
  getCachedMarketData() {
    try {
      // In a real implementation, this would read from a cache file or memory
      return {};
    } catch (error) {
      logger.error(`Error in getCachedMarketData: ${error.message}`);
      return {};
    }
  }

  /**
   * Get cached asset info from a local file or memory
   * @returns {Array} Cached asset info
   */
  getCachedAssetInfo() {
    try {
      // In a real implementation, this would read from a cache file or memory
      return [];
    } catch (error) {
      logger.error(`Error in getCachedAssetInfo: ${error.message}`);
      return [];
    }
  }
}

/**
 * Get market data for a symbol
 */
async function getMarketData(symbol) {
  try {
    // Get kline data
    const klines = await getKline(symbol, '1', 100);
    
    // Get ticker data
    const ticker = await getTicker(symbol);
    
    // Get order book data
    const orderBook = await getOrderBook(symbol);
    
    // Get recent trades
    const recentTrades = await getRecentTrades(symbol);
    
    return {
      symbol,
      klines,
      ticker,
      orderBook,
      recentTrades,
      timestamp: Date.now()
    };
  } catch (error) {
    logger.error(`Error getting market data for ${symbol}: ${error.message}`);
    return null;
  }
}

/**
 * Get kline data for a symbol
 */
async function getKline(symbol, interval, limit) {
  try {
    const response = await bybitClient.getKline({
      category: 'linear',
      symbol: symbol,
      interval: interval,
      limit: limit
    });
    
    if (response.retCode === 0) {
      return response.result.list.map(kline => ({
        timestamp: parseInt(kline[0]),
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5]),
        turnover: parseFloat(kline[6])
      }));
    }
    
    throw new Error(`Failed to get kline data: ${response.retMsg}`);
  } catch (error) {
    logger.error(`Error getting kline data for ${symbol}: ${error.message}`);
    throw error;
  }
}

/**
 * Get formatted ticker data for a symbol (processed format)
 */
async function getFormattedTicker(symbol) {
  try {
    const response = await bybitClient.getTickers({
      category: 'linear',
      symbol: symbol
    });

    if (response.retCode === 0) {
      const ticker = response.result.list[0];
      return {
        symbol: ticker.symbol,
        lastPrice: parseFloat(ticker.lastPrice),
        indexPrice: parseFloat(ticker.indexPrice),
        markPrice: parseFloat(ticker.markPrice),
        prevPrice24h: parseFloat(ticker.prevPrice24h),
        price24hPcnt: parseFloat(ticker.price24hPcnt),
        highPrice24h: parseFloat(ticker.highPrice24h),
        lowPrice24h: parseFloat(ticker.lowPrice24h),
        volume24h: parseFloat(ticker.volume24h),
        turnover24h: parseFloat(ticker.turnover24h),
        openInterest: parseFloat(ticker.openInterest),
        fundingRate: parseFloat(ticker.fundingRate),
        nextFundingTime: parseInt(ticker.nextFundingTime),
        bid1Price: parseFloat(ticker.bid1Price),
        bid1Size: parseFloat(ticker.bid1Size),
        ask1Price: parseFloat(ticker.ask1Price),
        ask1Size: parseFloat(ticker.ask1Size)
      };
    }

    throw new Error(`Failed to get ticker data: ${response.retMsg}`);
  } catch (error) {
    logger.error(`Error getting ticker data for ${symbol}: ${error.message}`);
    throw error;
  }
}

/**
 * Get order book data for a symbol
 */
async function getOrderBook(symbol) {
  try {
    const response = await bybitClient.getOrderBook({
      category: 'linear',
      symbol: symbol
    });
    
    if (response.retCode === 0) {
      return {
        symbol: response.result.symbol,
        timestamp: response.result.timestamp,
        bids: response.result.b.map(bid => ({
          price: parseFloat(bid[0]),
          size: parseFloat(bid[1])
        })),
        asks: response.result.a.map(ask => ({
          price: parseFloat(ask[0]),
          size: parseFloat(ask[1])
        }))
      };
    }
    
    throw new Error(`Failed to get order book data: ${response.retMsg}`);
  } catch (error) {
    logger.error(`Error getting order book data for ${symbol}: ${error.message}`);
    throw error;
  }
}

/**
 * Get recent trades for a symbol
 */
async function getRecentTrades(symbol) {
  try {
    const response = await bybitClient.getPublicTradingHistory({
      category: 'linear',
      symbol: symbol,
      limit: 50
    });
    
    if (response.retCode === 0) {
      return response.result.list.map(trade => ({
        id: trade.id,
        price: parseFloat(trade.price),
        size: parseFloat(trade.size),
        side: trade.side,
        timestamp: parseInt(trade.timestamp)
      }));
    }
    
    throw new Error(`Failed to get recent trades: ${response.retMsg}`);
  } catch (error) {
    logger.error(`Error getting recent trades for ${symbol}: ${error.message}`);
    throw error;
  }
}

/**
 * Place an order (Enhanced Version)
 * 🛡️ HYBRID: Uses DEMO API for safe trading execution
 */
async function placeOrder(params) {
  try {
    const {
      symbol,
      side,
      orderType,
      qty,
      price,
      timeInForce,
      reduceOnly,
      closeOnTrigger,
      takeProfit,
      stopLoss
    } = params;

    // Validate order parameters
    if (!symbol || !side || !orderType || !qty) {
      throw new Error('Missing required order parameters');
    }

    // Prepare order parameters
    const orderParams = {
      category: 'linear',
      symbol: symbol,
      side: side.charAt(0).toUpperCase() + side.slice(1).toLowerCase(),
      orderType: orderType.toUpperCase(),
      qty: qty.toString(),
      timeInForce: timeInForce === 'GoodTillCancel' ? 'GTC' : (timeInForce || 'GTC'),
      reduceOnly: reduceOnly || false,
      closeOnTrigger: closeOnTrigger || false
    };

    // Add price for limit orders
    if (orderType.toUpperCase() === 'LIMIT' && price) {
      orderParams.price = price.toString();
    }

    // Place the order using DEMO client
    logger.info(`🔧 DEBUG: Calling demoTradingClient.submitOrder with params: ${JSON.stringify(orderParams)}`);
    const response = await demoTradingClient.submitOrder(orderParams);
    logger.info(`🔧 DEBUG: demoTradingClient.submitOrder response: ${JSON.stringify(response)}`);

    if (response && response.retCode === 0) {
      const orderId = response.result.orderId;
      
      // Place take profit order if specified
      if (takeProfit) {
        await placeTakeProfitOrder({
          symbol,
          orderId,
          price: takeProfit
        });
      }
      
      // Place stop loss order if specified
      if (stopLoss) {
        await placeStopLossOrder({
          symbol,
          orderId,
          price: stopLoss
        });
      }
      
      // Return the original Bybit response format that the trading system expects
      logger.info(`🔧 DEBUG: Returning successful Bybit response with orderId: ${orderId}`);
      return response;
    }

    logger.error(`🔧 DEBUG: Order placement failed. Response: ${JSON.stringify(response)}`);
    throw new Error(`Failed to place order: ${response ? response.retMsg : 'undefined response'} (Code: ${response ? response.retCode : 'undefined'})`);
  } catch (error) {
    logger.error(`🔧 DEBUG: Exception in placeOrder: ${error.message}`);
    logger.error(`🔧 DEBUG: Error stack: ${error.stack}`);
    throw error;
  }
}

/**
 * Place a take profit order
 */
async function placeTakeProfitOrder(params) {
  try {
    const { symbol, orderId, price } = params;
    
    const response = await bybitClient.setTradingStop({
      category: 'linear',
      symbol: symbol,
      takeProfit: price.toString(),
      tpTriggerBy: 'LastPrice',
      positionIdx: 0
    });
    
    if (response.retCode !== 0) {
      throw new Error(`Failed to place take profit order: ${response.retMsg}`);
    }
  } catch (error) {
    logger.error(`Error placing take profit order: ${error.message}`);
    throw error;
  }
}

/**
 * Place a stop loss order
 */
async function placeStopLossOrder(params) {
  try {
    const { symbol, orderId, price } = params;
    
    const response = await bybitClient.setTradingStop({
      category: 'linear',
      symbol: symbol,
      stopLoss: price.toString(),
      slTriggerBy: 'LastPrice',
      positionIdx: 0
    });
    
    if (response.retCode !== 0) {
      throw new Error(`Failed to place stop loss order: ${response.retMsg}`);
    }
  } catch (error) {
    logger.error(`Error placing stop loss order: ${error.message}`);
    throw error;
  }
}

/**
 * Get symbol information including lot size and price filters
 */
async function getSymbolInfo(symbol) {
  try {
    const params = {
      category: 'linear',
      symbol: symbol
    };

    const response = await get('/v5/market/instruments-info', params);
    logger.info(`Symbol info for ${symbol}: ${JSON.stringify(response)}`);
    return response;
  } catch (error) {
    logger.error(`Error getting symbol info for ${symbol}: ${error.message}`);
    throw error;
  }
}

/**
 * Get kline data (candlestick data) for comprehensive analysis
 * 🔄 HYBRID: Uses REAL market data from live Bybit API
 */
async function getKlineData(params) {
  try {
    // 📊 Use REAL client for live market data - try different method names
    let response;

    // Try the correct method name
    if (realDataClient.getKline) {
      response = await realDataClient.getKline({
        category: params.category || 'linear',
        symbol: params.symbol,
        interval: params.interval,
        limit: params.limit || 100
      });
    } else if (realDataClient.getCandles) {
      response = await realDataClient.getCandles({
        category: params.category || 'linear',
        symbol: params.symbol,
        interval: params.interval,
        limit: params.limit || 100
      });
    } else {
      // Fallback to manual API call using existing axios import
      const url = `https://api.bybit.com/v5/market/kline?category=${params.category || 'linear'}&symbol=${params.symbol}&interval=${params.interval}&limit=${params.limit || 100}`;
      const axiosResponse = await axios.get(url);
      response = axiosResponse.data;
    }

    if (response && response.retCode === 0) {
      return response;
    }

    throw new Error(`Failed to get kline data: ${response ? response.retMsg : 'No response'}`);
  } catch (error) {
    logger.error(`Error getting kline data: ${error.message}`);
    // Return empty data structure to prevent system crashes
    return {
      retCode: 0,
      result: {
        list: []
      }
    };
  }
}

/**
 * Get orderbook data for comprehensive analysis
 * 🔄 HYBRID: Uses REAL market data from live Bybit API
 */
async function getOrderbook(params) {
  try {
    // 📊 Use REAL client for live market data
    const response = await realDataClient.getOrderbook({
      category: params.category || 'linear',
      symbol: params.symbol,
      limit: params.limit || 50
    });

    if (response.retCode === 0) {
      return response;
    }

    throw new Error(`Failed to get orderbook data: ${response.retMsg}`);
  } catch (error) {
    logger.error(`Error getting orderbook data: ${error.message}`);
    // Return empty data structure to prevent system crashes
    return {
      retCode: 0,
      result: {
        b: [], // bids
        a: []  // asks
      }
    };
  }
}

/**
 * Get public trading history for volume analysis
 * 🔄 HYBRID: Uses REAL market data from live Bybit API
 */
async function getPublicTradingHistory(params) {
  try {
    // 📊 Use REAL client for live market data
    const response = await realDataClient.getPublicTradingHistory({
      category: params.category || 'linear',
      symbol: params.symbol,
      limit: params.limit || 50
    });

    if (response.retCode === 0) {
      return response;
    }

    throw new Error(`Failed to get trading history: ${response.retMsg}`);
  } catch (error) {
    logger.error(`Error getting trading history: ${error.message}`);
    // Return empty data structure to prevent system crashes
    return {
      retCode: 0,
      result: {
        list: []
      }
    };
  }
}

/**
 * Get instruments info for symbol validation
 * 🔄 HYBRID: Uses REAL market data from live Bybit API
 */
async function getInstrumentsInfo(params) {
  try {
    // 📊 Use REAL client for live market data
    const response = await realDataClient.getInstrumentsInfo({
      category: params.category || 'linear',
      symbol: params.symbol
    });

    if (response.retCode === 0) {
      return response;
    }

    throw new Error(`Failed to get instruments info: ${response.retMsg}`);
  } catch (error) {
    logger.error(`Error getting instruments info: ${error.message}`);
    // Return empty data structure to prevent system crashes
    return {
      retCode: 0,
      result: {
        list: []
      }
    };
  }
}

// Export both the functions and the BybitClient class
module.exports = {
  getWalletBalance,
  getSymbols,
  getTicker,
  getFormattedTicker,
  getAllTickers,
  getPositions,
  getOpenOrders,
  getOrderHistory,
  getExecutionHistory,
  placeOrder,
  placeConditionalOrder,
  cancelAllOrders,
  setLeverage,
  requestDemoFunds,
  ensureMinimumBalance,
  getSymbolInfo,
  getKlineData,
  getOrderbook,
  getPublicTradingHistory,
  getInstrumentsInfo,
  getMarketData,
  getKline,
  getOrderBook,
  getRecentTrades,
  BybitClient,
  bybitClient,
  realDataClient,
  demoTradingClient
};
