/**
 * WebSocket Server for OMNI-ALPHA VΩ∞∞ Trading System Dashboard
 *
 * This module sets up the WebSocket server for real-time updates to the dashboard.
 * It provides real-time data streams for various aspects of the trading system.
 */

const tradingStrategyService = require('../services/trading-strategy-service');
const dataCache = require('../utils/data-cache.js');
const agentOrchestrator = require('../services/agent-orchestrator');
const quantumBridge = require('../services/quantum-bridge');
const multiAgentCoordinator = require('../services/multi-agent-coordinator');
const bybitClient = require('../utils/bybit-client');
const logger = require('../utils/logger');

// Active connections
const connections = new Set();

// Setup WebSocket server
function setupWebSocketServer(io) {
  logger.info('Setting up WebSocket server');

  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);
    connections.add(socket);

    // Send initial data
    sendInitialData(socket);

    // Handle subscription to specific data streams
    socket.on('subscribe', (channel) => {
      logger.info(`Client ${socket.id} subscribed to ${channel}`);
      socket.join(channel);
    });

    // Handle unsubscription from specific data streams
    socket.on('unsubscribe', (channel) => {
      logger.info(`Client ${socket.id} unsubscribed from ${channel}`);
      socket.leave(channel);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
      connections.delete(socket);
    });
  });

  // Start sending periodic updates
  startPeriodicUpdates(io);

  return io;
}

/**
 * Start periodic updates to connected clients
 */
function startPeriodicUpdates(io) {
  const tradingService = require('../services/trading-strategy-service');

  // Send updates every 2 seconds
  setInterval(async () => {
    try {
      // Get current trading state
      const state = tradingService.getState();
      const metrics = tradingService.getMetrics();
      const trades = tradingService.getRecentTrades();

      // Broadcast to all connected clients
      io.emit('trading-update', {
        state,
        metrics,
        trades,
        timestamp: Date.now()
      });

      // Send market data updates
      io.emit('market-update', {
        prices: await tradingService.getCurrentPrices(),
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('Error sending periodic updates:', error);
    }
  }, 2000);

  // Send system status updates every 5 seconds
  setInterval(() => {
    try {
      const systemStatus = tradingService.getSystemStatus();
      io.emit('system-status', {
        ...systemStatus,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error sending system status:', error);
    }
  }, 5000);
}

module.exports = { setupWebSocketServer };
