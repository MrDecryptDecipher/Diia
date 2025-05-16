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
const winston = require('winston');

// Create logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'bybit-client' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: 'logs/bybit-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/bybit.log' })
  ]
});

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

// Bybit API configuration - Using hardcoded demo credentials
// According to bybitdemodocumentation.md, demo trading uses specific endpoints
const API_KEY = process.env.BYBIT_DEMO_API_KEY || 'lCMnwPKIzXASNWn6UE';
const API_SECRET = process.env.BYBIT_DEMO_API_SECRET || 'aXjs1SF9tmW3riHMktmjtyOyAT85puvrVstr';
const BASE_URL = 'https://api-demo.bybit.com'; // Demo trading URL as specified in documentation

// Log API key status (without revealing the full keys)
logger.info(`Bybit API Key: ${API_KEY.substring(0, 3)}...${API_KEY.substring(API_KEY.length - 3)}`);
logger.info(`Bybit API Secret: ${API_SECRET.substring(0, 3)}...${API_SECRET.substring(API_SECRET.length - 3)}`);
logger.info(`Using Bybit Demo API at ${BASE_URL}`);

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
 * @param {string} symbol - Trading pair symbol (e.g., 'BTCUSDT')
 * @returns {Promise<Object>} - Ticker data
 */
async function getTicker(symbol) {
  // According to Bybit API v5 documentation, use the tickers endpoint
  // This endpoint works for both regular and demo trading
  return get('/v5/market/tickers', { category: 'linear', symbol });
}

/**
 * Get all tickers
 * @returns {Promise<Object>} - All tickers data
 */
async function getAllTickers() {
  return get('/v5/market/tickers', { category: 'linear' });
}

/**
 * Get positions
 * @param {string} symbol - Optional symbol to filter positions
 * @returns {Promise<Object>} - Positions data
 */
async function getPositions(symbol = '') {
  const params = {
    category: 'linear'
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
 * @param {Object} orderParams - Order parameters
 * @returns {Promise<Object>} - Order response
 */
async function placeOrder(orderParams) {
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

    if (!orderParams.orderType) {
      logger.error('Missing required parameter: orderType');
      return { retCode: -1, retMsg: 'Missing required parameter: orderType', result: null };
    }

    if (!orderParams.qty) {
      logger.error('Missing required parameter: qty');
      return { retCode: -1, retMsg: 'Missing required parameter: qty', result: null };
    }

    // Prepare the order parameters according to Bybit API v5 documentation
    const params = {
      category: 'linear',
      symbol: orderParams.symbol,
      side: orderParams.side,
      orderType: orderParams.orderType,
      qty: orderParams.qty,
      timeInForce: orderParams.timeInForce || 'GoodTillCancel',
      reduceOnly: orderParams.reduceOnly || false,
      closeOnTrigger: orderParams.closeOnTrigger || false
    };

    // Add price for limit orders
    if (orderParams.orderType === 'Limit' && orderParams.price) {
      params.price = orderParams.price;
    }

    // Add take profit price if provided
    if (orderParams.takeProfitPrice) {
      params.takeProfit = orderParams.takeProfitPrice;
    }

    // Add stop loss price if provided
    if (orderParams.stopLossPrice) {
      params.stopLoss = orderParams.stopLossPrice;
    }

    // Add position index for hedge mode (not used in our case)
    if (orderParams.positionIdx !== undefined) {
      params.positionIdx = orderParams.positionIdx;
    }

    // Check if this is a conditional order (has triggerPrice)
    if (orderParams.triggerPrice) {
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

      // Add conditional order parameters
      params.triggerPrice = orderParams.triggerPrice;
      params.triggerBy = orderParams.triggerBy || 'LastPrice';
      params.triggerDirection = orderParams.triggerDirection || triggerDirection;

      logger.info(`Placing conditional order with parameters: ${JSON.stringify(params)}`);
    } else {
      logger.info(`Placing regular order with parameters: ${JSON.stringify(params)}`);
    }

    // Place the order using the standard order creation endpoint
    // According to Bybit API v5 docs, this endpoint handles both regular and conditional orders
    return post('/v5/order/create', params);
  } catch (error) {
    logger.error(`Error in placeOrder: ${error.message}`);
    return { retCode: -1, retMsg: error.message, result: null };
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

// Export both the functions and the BybitClient class
module.exports = {
  getWalletBalance,
  getSymbols,
  getTicker,
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
  BybitClient
};
