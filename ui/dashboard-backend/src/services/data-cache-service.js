/**
 * Data Cache Service for OMNI-ALPHA VΩ∞∞ Trading System
 * 
 * This service provides caching for API data to prevent excessive API calls
 * and ensure stable data for the dashboard.
 */

const winston = require('winston');

// Create logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'data-cache-service' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: 'logs/cache-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/cache.log' })
  ]
});

// Cache storage
const cache = new Map();

// Default TTL values in milliseconds
const DEFAULT_TTL = {
  walletBalance: 30000,      // 30 seconds
  symbols: 3600000,          // 1 hour
  tickers: 5000,             // 5 seconds
  positions: 5000,           // 5 seconds
  openOrders: 5000,          // 5 seconds
  orderHistory: 30000,       // 30 seconds
  executionHistory: 30000,   // 30 seconds
  metrics: 10000,            // 10 seconds
  trades: 5000,              // 5 seconds
  default: 60000             // 1 minute
};

/**
 * Get a value from the cache
 * @param {string} key - Cache key
 * @returns {any} - Cached value or undefined if not found or expired
 */
function get(key) {
  if (!cache.has(key)) {
    return undefined;
  }

  const { value, expiry } = cache.get(key);
  
  // Check if the cache entry has expired
  if (expiry && expiry < Date.now()) {
    logger.debug(`Cache entry for ${key} has expired`);
    cache.delete(key);
    return undefined;
  }
  
  logger.debug(`Cache hit for ${key}`);
  return value;
}

/**
 * Set a value in the cache
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in milliseconds
 */
function set(key, value, ttl) {
  const ttlValue = ttl || DEFAULT_TTL[key.split(':')[0]] || DEFAULT_TTL.default;
  const expiry = Date.now() + ttlValue;
  
  logger.debug(`Setting cache for ${key} with TTL ${ttlValue}ms`);
  cache.set(key, { value, expiry });
}

/**
 * Delete a value from the cache
 * @param {string} key - Cache key
 */
function del(key) {
  logger.debug(`Deleting cache for ${key}`);
  cache.delete(key);
}

/**
 * Clear all values from the cache
 */
function clear() {
  logger.debug('Clearing entire cache');
  cache.clear();
}

/**
 * Get a value from the cache or fetch it using the provided function
 * @param {string} key - Cache key
 * @param {Function} fetchFn - Function to fetch the value if not in cache
 * @param {number} ttl - Time to live in milliseconds
 * @returns {Promise<any>} - Cached or fetched value
 */
async function getOrFetch(key, fetchFn, ttl) {
  const cachedValue = get(key);
  
  if (cachedValue !== undefined) {
    return cachedValue;
  }
  
  logger.debug(`Cache miss for ${key}, fetching data`);
  try {
    const value = await fetchFn();
    set(key, value, ttl);
    return value;
  } catch (error) {
    logger.error(`Error fetching data for ${key}: ${error.message}`);
    throw error;
  }
}

module.exports = {
  get,
  set,
  del,
  clear,
  getOrFetch
};
