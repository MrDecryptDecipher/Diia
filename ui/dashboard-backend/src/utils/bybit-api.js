/**
 * Bybit API Client for OMNI-ALPHA VΩ∞∞ Trading System
 *
 * This module provides functions to interact with the Bybit API using the demo account.
 * It uses the credentials from the demo.env file.
 */

const axios = require('axios');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Try to load environment variables from multiple possible locations
const envPaths = [
  path.resolve(__dirname, '../../.env'),                // Local .env in dashboard-backend
  path.resolve(__dirname, '../../../demo.env'),         // demo.env in project root
  path.resolve(__dirname, '../../../testnet.env'),      // testnet.env in project root
  path.resolve(__dirname, '../../../.env')              // .env in project root
];

let envLoaded = false;
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    console.log(`Loading environment from: ${envPath}`);
    dotenv.config({ path: envPath });
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.error('No environment file found. API calls will fail.');
}

// Bybit API configuration - try different environment variable names
const API_KEY = process.env.BYBIT_API_KEY_DEMO || process.env.BYBIT_DEMO_API_KEY || '';
const API_SECRET = process.env.BYBIT_SECRET_KEY_DEMO || process.env.BYBIT_DEMO_API_SECRET || '';

// Log API key status (without revealing the actual keys)
console.log(`Bybit API Key status: ${API_KEY ? 'Available' : 'Not available'}`);
console.log(`Bybit API Secret status: ${API_SECRET ? 'Available' : 'Not available'}`);

// Log environment variables for debugging (without revealing full values)
console.log('Available environment variables:');
Object.keys(process.env)
  .filter(key => key.includes('BYBIT') || key.includes('API'))
  .forEach(key => {
    const value = process.env[key];
    const maskedValue = value ? `${value.substring(0, 3)}...${value.substring(value.length - 3)}` : 'undefined';
    console.log(`  ${key}: ${maskedValue}`);
  });
const BASE_URL = 'https://api-demo.bybit.com'; // Demo trading URL

/**
 * Generate signature for Bybit API authentication
 * @param {string} apiSecret - API secret key
 * @param {number} timestamp - Current timestamp in milliseconds
 * @param {string} params - Query string or request body
 * @returns {string} - HMAC SHA256 signature
 */
function generateSignature(apiSecret, timestamp, params = '') {
  if (!apiSecret || !API_KEY) {
    console.error('Missing API credentials. Cannot generate signature.');
    return '';
  }

  try {
    return crypto
      .createHmac('sha256', apiSecret)
      .update(timestamp + API_KEY + '5000' + params)
      .digest('hex');
  } catch (error) {
    console.error(`Error generating signature: ${error.message}`);
    return '';
  }
}

/**
 * Make a GET request to the Bybit API
 * @param {string} endpoint - API endpoint
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - API response
 */
async function get(endpoint, params = {}) {
  try {
    // Check if API credentials are available
    if (!API_KEY || !API_SECRET) {
      console.error('Missing API credentials. Cannot make API request.');
      return {
        retCode: -1,
        retMsg: 'Missing API credentials',
        result: null
      };
    }

    const timestamp = Date.now().toString();
    const queryString = Object.keys(params)
      .map(key => `${key}=${params[key]}`)
      .join('&');

    const url = `${BASE_URL}${endpoint}${queryString ? `?${queryString}` : ''}`;
    const signature = generateSignature(API_SECRET, timestamp, queryString);

    // If signature generation failed, return error
    if (!signature) {
      return {
        retCode: -1,
        retMsg: 'Failed to generate signature',
        result: null
      };
    }

    const response = await axios.get(url, {
      headers: {
        'X-BAPI-API-KEY': API_KEY,
        'X-BAPI-TIMESTAMP': timestamp,
        'X-BAPI-SIGN': signature,
        'X-BAPI-RECV-WINDOW': '5000'
      }
    });

    return response.data;
  } catch (error) {
    console.error(`Error making GET request to ${endpoint}:`, error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }

    return {
      retCode: -1,
      retMsg: error.message,
      result: null
    };
  }
}

/**
 * Make a POST request to the Bybit API
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request body
 * @returns {Promise<Object>} - API response
 */
async function post(endpoint, data = {}) {
  try {
    // Check if API credentials are available
    if (!API_KEY || !API_SECRET) {
      console.error('Missing API credentials. Cannot make API request.');
      return {
        retCode: -1,
        retMsg: 'Missing API credentials',
        result: null
      };
    }

    const timestamp = Date.now().toString();
    const jsonBody = JSON.stringify(data);
    const signature = generateSignature(API_SECRET, timestamp, jsonBody);

    // If signature generation failed, return error
    if (!signature) {
      return {
        retCode: -1,
        retMsg: 'Failed to generate signature',
        result: null
      };
    }

    const response = await axios.post(`${BASE_URL}${endpoint}`, data, {
      headers: {
        'X-BAPI-API-KEY': API_KEY,
        'X-BAPI-TIMESTAMP': timestamp,
        'X-BAPI-SIGN': signature,
        'X-BAPI-RECV-WINDOW': '5000',
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error(`Error making POST request to ${endpoint}:`, error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }

    return {
      retCode: -1,
      retMsg: error.message,
      result: null
    };
  }
}

/**
 * Get wallet balance
 * @returns {Promise<Object>} - Wallet balance data
 */
async function getWalletBalance() {
  return get('/v5/account/wallet-balance', { accountType: 'UNIFIED' });
}

/**
 * Get active positions
 * @returns {Promise<Object>} - Active positions data
 */
async function getPositions() {
  return get('/v5/position/list', { category: 'linear', settleCoin: 'USDT' });
}

/**
 * Get open orders
 * @returns {Promise<Object>} - Open orders data
 */
async function getOpenOrders() {
  return get('/v5/order/realtime', { category: 'linear', settleCoin: 'USDT' });
}

/**
 * Get order history
 * @param {number} limit - Number of orders to retrieve
 * @returns {Promise<Object>} - Order history data
 */
async function getOrderHistory(limit = 50) {
  return get('/v5/order/history', {
    category: 'linear',
    settleCoin: 'USDT',
    limit
  });
}

/**
 * Get trade history
 * @param {number} limit - Number of trades to retrieve
 * @returns {Promise<Object>} - Trade history data
 */
async function getTradeHistory(limit = 50) {
  return get('/v5/execution/list', {
    category: 'linear',
    limit
  });
}

/**
 * Request demo trading funds
 * @param {string} coin - Coin to request (USDT, BTC, ETH, USDC)
 * @param {string} amount - Amount to request
 * @returns {Promise<Object>} - API response
 */
async function requestDemoFunds(coin = 'USDT', amount = '100') {
  return post('/v5/account/demo-apply-money', {
    adjustType: 0,
    utaDemoApplyMoney: [
      {
        coin,
        amountStr: amount
      }
    ]
  });
}

module.exports = {
  getWalletBalance,
  getPositions,
  getOpenOrders,
  getOrderHistory,
  getTradeHistory,
  requestDemoFunds
};
