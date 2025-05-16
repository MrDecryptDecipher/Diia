/**
 * Bybit Trading API Routes
 *
 * These routes handle all Bybit trading operations for the OMNI-ALPHA VΩ∞∞ Trading System.
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const axios = require('axios');
const logger = require('../../utils/logger');
const dataCache = require('../../utils/data-cache');

// Bybit API configuration
const BYBIT_API_KEY = process.env.BYBIT_API_KEY || 'lCMnwPKIzXASNWn6UE';
const BYBIT_API_SECRET = process.env.BYBIT_API_SECRET || 'aXjs1SF9tmW3riHMktmjtyOyAT85puvrVstr';
const BYBIT_API_URL = process.env.BYBIT_API_URL || 'https://api-demo.bybit.com';
const BYBIT_WS_URL = process.env.BYBIT_WS_URL || 'wss://stream-demo.bybit.com';

// Helper function to generate signature for Bybit API
function getSignature(parameters, secret) {
  const timestamp = parameters.timestamp;
  const apiKey = parameters.api_key;
  const recvWindow = parameters.recv_window;

  // Create the string to sign according to Bybit documentation
  // For V5 API, the string to sign is: timestamp + API_KEY + recv_window + queryString/body
  let signString = timestamp + apiKey + recvWindow;

  // Add other parameters
  const otherParams = { ...parameters };
  delete otherParams.timestamp;
  delete otherParams.api_key;
  delete otherParams.recv_window;

  if (Object.keys(otherParams).length > 0) {
    const queryString = Object.keys(otherParams)
      .sort()
      .map(key => `${key}=${otherParams[key]}`)
      .join('&');

    signString += queryString;
  }

  return crypto.createHmac('sha256', secret).update(signString).digest('hex');
}

// Helper function to make authenticated requests to Bybit API
async function makeBybitRequest(endpoint, method = 'GET', params = {}) {
  try {
    const timestamp = Date.now().toString();
    const recvWindow = '5000';

    // Sort parameters alphabetically
    const sortedParams = Object.keys(params).sort().reduce((result, key) => {
      result[key] = params[key];
      return result;
    }, {});

    // Create query string for GET requests
    let queryString = '';
    if (method === 'GET') {
      queryString = Object.keys(sortedParams)
        .map(key => `${key}=${sortedParams[key]}`)
        .join('&');
    }

    // Create signature parameters
    const signatureParams = {
      api_key: BYBIT_API_KEY,
      timestamp,
      recv_window: recvWindow
    };

    // Generate signature
    let signString = timestamp + BYBIT_API_KEY + recvWindow;
    if (method === 'GET' && queryString) {
      signString += queryString;
    } else if (method === 'POST') {
      signString += JSON.stringify(sortedParams);
    }

    const signature = crypto
      .createHmac('sha256', BYBIT_API_SECRET)
      .update(signString)
      .digest('hex');

    const headers = {
      'X-BAPI-API-KEY': BYBIT_API_KEY,
      'X-BAPI-SIGN': signature,
      'X-BAPI-TIMESTAMP': timestamp,
      'X-BAPI-RECV-WINDOW': recvWindow,
      'Content-Type': 'application/json'
    };

    const url = `${BYBIT_API_URL}${endpoint}`;

    let response;
    if (method === 'GET') {
      response = await axios.get(`${url}${queryString ? '?' + queryString : ''}`, { headers });
    } else {
      response = await axios.post(url, sortedParams, { headers });
    }

    return response.data;
  } catch (error) {
    logger.error(`Bybit API request failed: ${error.message}`);
    if (error.response) {
      logger.error(`Bybit API response: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

// Get account information
router.get('/account', async (req, res) => {
  try {
    const response = await makeBybitRequest('/v5/account/wallet-balance', 'GET', {
      accountType: 'UNIFIED',
      coin: 'USDT'
    });

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get positions
router.get('/positions', async (req, res) => {
  try {
    const response = await makeBybitRequest('/v5/position/list', 'GET', {
      category: 'linear',
      settleCoin: 'USDT'
    });

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get open orders
router.get('/orders', async (req, res) => {
  try {
    const response = await makeBybitRequest('/v5/order/realtime', 'GET', {
      category: 'linear'
    });

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get order history
router.get('/orders/history', async (req, res) => {
  try {
    const response = await makeBybitRequest('/v5/order/history', 'GET', {
      category: 'linear',
      limit: 50
    });

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get trade history
router.get('/trades', async (req, res) => {
  try {
    const response = await makeBybitRequest('/v5/execution/list', 'GET', {
      category: 'linear',
      limit: 50
    });

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Place order
router.post('/order', async (req, res) => {
  try {
    const {
      symbol,
      side,
      orderType,
      qty,
      price,
      timeInForce,
      reduceOnly,
      closeOnTrigger
    } = req.body;

    // Validate required parameters
    if (!symbol || !side || !orderType || !qty) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const params = {
      category: 'linear',
      symbol,
      side,
      orderType,
      qty,
      timeInForce: timeInForce || 'GTC'
    };

    // Add optional parameters if provided
    if (price) params.price = price;
    if (reduceOnly !== undefined) params.reduceOnly = reduceOnly;
    if (closeOnTrigger !== undefined) params.closeOnTrigger = closeOnTrigger;

    const response = await makeBybitRequest('/v5/order/create', 'POST', params);

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel order
router.post('/order/cancel', async (req, res) => {
  try {
    const { symbol, orderId } = req.body;

    // Validate required parameters
    if (!symbol || !orderId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const response = await makeBybitRequest('/v5/order/cancel', 'POST', {
      category: 'linear',
      symbol,
      orderId
    });

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get market data
router.get('/market/tickers', async (req, res) => {
  try {
    const response = await makeBybitRequest('/v5/market/tickers', 'GET', {
      category: 'linear'
    });

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get kline data
router.get('/market/kline', async (req, res) => {
  try {
    const { symbol, interval, limit } = req.query;

    // Validate required parameters
    if (!symbol || !interval) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const response = await makeBybitRequest('/v5/market/kline', 'GET', {
      category: 'linear',
      symbol,
      interval,
      limit: limit || 200
    });

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get orderbook data
router.get('/market/orderbook', async (req, res) => {
  try {
    const { symbol, limit } = req.query;

    // Validate required parameters
    if (!symbol) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const response = await makeBybitRequest('/v5/market/orderbook', 'GET', {
      category: 'linear',
      symbol,
      limit: limit || 50
    });

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get trading status
router.get('/status', (req, res) => {
  try {
    // Get trading status from cache
    const status = dataCache.get('trading', 'status') || {
      active: true,
      capital: 12,
      profitPerTrade: 2.2,
      tradesExecuted: 0,
      totalProfit: 0,
      startTime: new Date().toISOString(),
      lastTradeTime: null
    };

    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
