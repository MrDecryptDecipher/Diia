/**
 * OMNI-ALPHA VΩ∞∞ Trading System gRPC Server
 * 
 * This module implements a gRPC server for high-performance communication
 * between system components. It provides endpoints for real-time data streaming,
 * trade execution, and system monitoring.
 */

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const logger = require('./utils/logger');
const bybitClient = require('./utils/bybit-client');
const tradingStrategyService = require('./services/trading-strategy-service');

// Define the proto path
const PROTO_PATH = path.join(__dirname, 'protos/omni.proto');

// Load the protobuf definition
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

// Load the proto definition
const omniProto = grpc.loadPackageDefinition(packageDefinition).omni;

/**
 * Get system metrics
 * @param {Object} call - gRPC call object
 * @param {Function} callback - gRPC callback function
 */
function getSystemMetrics(call, callback) {
  try {
    const metrics = tradingStrategyService.getSystemMetrics();
    callback(null, { metrics });
  } catch (error) {
    logger.error(`Error getting system metrics: ${error.message}`);
    callback({
      code: grpc.status.INTERNAL,
      message: `Error getting system metrics: ${error.message}`
    });
  }
}

/**
 * Get wallet balance
 * @param {Object} call - gRPC call object
 * @param {Function} callback - gRPC callback function
 */
async function getWalletBalance(call, callback) {
  try {
    const walletBalance = await bybitClient.getWalletBalance();
    callback(null, { walletBalance: JSON.stringify(walletBalance) });
  } catch (error) {
    logger.error(`Error getting wallet balance: ${error.message}`);
    callback({
      code: grpc.status.INTERNAL,
      message: `Error getting wallet balance: ${error.message}`
    });
  }
}

/**
 * Get open positions
 * @param {Object} call - gRPC call object
 * @param {Function} callback - gRPC callback function
 */
async function getOpenPositions(call, callback) {
  try {
    const positions = await bybitClient.getPositions();
    callback(null, { positions: JSON.stringify(positions) });
  } catch (error) {
    logger.error(`Error getting open positions: ${error.message}`);
    callback({
      code: grpc.status.INTERNAL,
      message: `Error getting open positions: ${error.message}`
    });
  }
}

/**
 * Get recent trades
 * @param {Object} call - gRPC call object
 * @param {Function} callback - gRPC callback function
 */
async function getRecentTrades(call, callback) {
  try {
    const trades = await bybitClient.getRecentTrades();
    callback(null, { trades: JSON.stringify(trades) });
  } catch (error) {
    logger.error(`Error getting recent trades: ${error.message}`);
    callback({
      code: grpc.status.INTERNAL,
      message: `Error getting recent trades: ${error.message}`
    });
  }
}

/**
 * Execute a trade
 * @param {Object} call - gRPC call object
 * @param {Function} callback - gRPC callback function
 */
async function executeTrade(call, callback) {
  try {
    const { symbol, direction, amount, leverage } = call.request;
    
    // Validate parameters
    if (!symbol || !direction || !amount) {
      callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: 'Missing required parameters: symbol, direction, amount'
      });
      return;
    }
    
    // Execute the trade
    const trade = await tradingStrategyService.executeManualTrade(symbol, direction, parseFloat(amount), parseInt(leverage));
    
    if (trade) {
      callback(null, { trade: JSON.stringify(trade) });
    } else {
      callback({
        code: grpc.status.INTERNAL,
        message: 'Failed to execute trade'
      });
    }
  } catch (error) {
    logger.error(`Error executing trade: ${error.message}`);
    callback({
      code: grpc.status.INTERNAL,
      message: `Error executing trade: ${error.message}`
    });
  }
}

/**
 * Close a position
 * @param {Object} call - gRPC call object
 * @param {Function} callback - gRPC callback function
 */
async function closePosition(call, callback) {
  try {
    const { symbol, positionIdx } = call.request;
    
    // Validate parameters
    if (!symbol) {
      callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: 'Missing required parameter: symbol'
      });
      return;
    }
    
    // Close the position
    const result = await bybitClient.closePosition(symbol, positionIdx || 0);
    
    callback(null, { result: JSON.stringify(result) });
  } catch (error) {
    logger.error(`Error closing position: ${error.message}`);
    callback({
      code: grpc.status.INTERNAL,
      message: `Error closing position: ${error.message}`
    });
  }
}

/**
 * Get market data
 * @param {Object} call - gRPC call object
 * @param {Function} callback - gRPC callback function
 */
async function getMarketData(call, callback) {
  try {
    const { symbol, interval, limit } = call.request;
    
    // Validate parameters
    if (!symbol) {
      callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: 'Missing required parameter: symbol'
      });
      return;
    }
    
    // Get market data
    const marketData = await bybitClient.getKline(symbol, interval || '1', limit || 100);
    
    callback(null, { marketData: JSON.stringify(marketData) });
  } catch (error) {
    logger.error(`Error getting market data: ${error.message}`);
    callback({
      code: grpc.status.INTERNAL,
      message: `Error getting market data: ${error.message}`
    });
  }
}

/**
 * Stream market data
 * @param {Object} call - gRPC call object
 */
async function streamMarketData(call) {
  try {
    const { symbol, interval } = call.request;
    
    // Validate parameters
    if (!symbol) {
      call.emit('error', {
        code: grpc.status.INVALID_ARGUMENT,
        message: 'Missing required parameter: symbol'
      });
      return;
    }
    
    // Set up interval to stream market data
    const streamInterval = setInterval(async () => {
      try {
        // Get market data
        const marketData = await bybitClient.getKline(symbol, interval || '1', 1);
        
        // Send market data to client
        call.write({ marketData: JSON.stringify(marketData) });
      } catch (error) {
        logger.error(`Error streaming market data: ${error.message}`);
      }
    }, 1000); // Stream every second
    
    // Handle client disconnect
    call.on('cancelled', () => {
      clearInterval(streamInterval);
    });
    
    // Handle end of stream
    call.on('end', () => {
      clearInterval(streamInterval);
      call.end();
    });
  } catch (error) {
    logger.error(`Error setting up market data stream: ${error.message}`);
    call.emit('error', {
      code: grpc.status.INTERNAL,
      message: `Error setting up market data stream: ${error.message}`
    });
  }
}

/**
 * Stream system metrics
 * @param {Object} call - gRPC call object
 */
function streamSystemMetrics(call) {
  try {
    // Set up interval to stream system metrics
    const streamInterval = setInterval(() => {
      try {
        // Get system metrics
        const metrics = tradingStrategyService.getSystemMetrics();
        
        // Send metrics to client
        call.write({ metrics: JSON.stringify(metrics) });
      } catch (error) {
        logger.error(`Error streaming system metrics: ${error.message}`);
      }
    }, 1000); // Stream every second
    
    // Handle client disconnect
    call.on('cancelled', () => {
      clearInterval(streamInterval);
    });
    
    // Handle end of stream
    call.on('end', () => {
      clearInterval(streamInterval);
      call.end();
    });
  } catch (error) {
    logger.error(`Error setting up system metrics stream: ${error.message}`);
    call.emit('error', {
      code: grpc.status.INTERNAL,
      message: `Error setting up system metrics stream: ${error.message}`
    });
  }
}

/**
 * Start the gRPC server
 */
function startServer() {
  // Create a new gRPC server
  const server = new grpc.Server();
  
  // Add the service implementation
  server.addService(omniProto.OmniService.service, {
    getSystemMetrics,
    getWalletBalance,
    getOpenPositions,
    getRecentTrades,
    executeTrade,
    closePosition,
    getMarketData,
    streamMarketData,
    streamSystemMetrics
  });
  
  // Get port from environment or use default
  const port = process.env.GRPC_PORT || 10004;
  const host = process.env.HOST || '0.0.0.0';
  const serverAddress = `${host}:${port}`;
  
  // Bind the server to the address
  server.bindAsync(serverAddress, grpc.ServerCredentials.createInsecure(), (error, port) => {
    if (error) {
      logger.error(`Failed to bind gRPC server: ${error.message}`);
      return;
    }
    
    // Start the server
    server.start();
    logger.info(`OMNI-ALPHA VΩ∞∞ Trading System gRPC server running at ${serverAddress}`);
  });
  
  return server;
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = {
  startServer
};
