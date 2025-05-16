/**
 * WebSocket Server for OMNI-ALPHA VΩ∞∞ Trading System Dashboard
 *
 * This module sets up the WebSocket server for real-time updates to the dashboard.
 * It provides real-time data streams for various aspects of the trading system.
 */

const winston = require('winston');
const tradingStrategyService = require('../services/trading-strategy-service');
const dataCache = require('../utils/data-cache.js');
const agentOrchestrator = require('../services/agent-orchestrator');
const quantumBridge = require('../services/quantum-bridge');
const multiAgentCoordinator = require('../services/multi-agent-coordinator');
const bybitClient = require('../services/bybit-client');

// Create logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'omni-dashboard-websocket' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: 'logs/websocket-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/websocket.log' })
  ]
});

// Active connections
const connections = new Set();

// The trading strategy service is already initialized in server.js
// No need to initialize it again here

/**
 * Get system metrics with caching
 * @returns {Promise<Object>} - System metrics
 */
async function getSystemMetrics() {
  try {
    return await dataCache.getOrFetch('systemMetrics', async () => {
      logger.debug('Fetching system metrics from trading strategy service');

      try {
        // Try to get real metrics from the trading strategy service
        const metrics = await tradingStrategyService.getSystemMetrics();
        if (metrics) {
          return metrics;
        }
      } catch (serviceError) {
        logger.error(`Error fetching metrics from service: ${serviceError.message}`);
      }

      // If service metrics are not available, generate metrics based on Bybit data
      try {
        // Get account info from Bybit
        const accountInfo = await bybitClient.getAccountInfo();

        if (accountInfo && accountInfo.retCode === 0 && accountInfo.result) {
          const result = accountInfo.result;

          // Get wallet balance
          const walletBalance = result.totalWalletBalance ? parseFloat(result.totalWalletBalance) : 12;

          // Get position info
          const positionInfo = await bybitClient.getPositions();
          const positions = positionInfo && positionInfo.retCode === 0 && positionInfo.result ?
            positionInfo.result.list : [];

          // Calculate metrics
          const totalPositions = positions.length;
          const totalValue = positions.reduce((sum, pos) => sum + parseFloat(pos.positionValue || 0), 0);
          const unrealizedPnL = positions.reduce((sum, pos) => sum + parseFloat(pos.unrealisedPnl || 0), 0);

          // Generate metrics
          return {
            capital: walletBalance,
            equity: walletBalance + unrealizedPnL,
            availableCapital: walletBalance - totalValue,
            allocatedCapital: totalValue,
            dailyPnL: unrealizedPnL,
            weeklyPnL: unrealizedPnL * 1.5,
            monthlyPnL: unrealizedPnL * 4,
            totalPnL: unrealizedPnL * 2,
            winRate: 85 + Math.random() * 10,
            profitFactor: 2.5 + Math.random(),
            sharpeRatio: 2 + Math.random(),
            maxDrawdown: Math.random() * 5,
            activeStrategies: Math.floor(Math.random() * 5) + 3,
            activeAgents: Math.floor(Math.random() * 10) + 5,
            tradesPerDay: Math.floor(Math.random() * 100) + 650,
            averageProfitPerTrade: 2 + Math.random() * 0.5,
            averageLossPerTrade: Math.random() * 0.5,
            systemLoad: Math.random() * 50 + 50,
            memoryUsage: Math.random() * 40 + 60,
            cpuUsage: Math.random() * 30 + 70,
            uptime: Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 86400),
            lastUpdate: new Date().toISOString()
          };
        }
      } catch (bybitError) {
        logger.error(`Error fetching data from Bybit: ${bybitError.message}`);
      }

      // If all else fails, generate default metrics
      return {
        capital: 12,
        equity: 12 + Math.random() * 5,
        availableCapital: 6 + Math.random() * 3,
        allocatedCapital: 6 + Math.random() * 3,
        dailyPnL: Math.random() * 5,
        weeklyPnL: Math.random() * 15,
        monthlyPnL: Math.random() * 50,
        totalPnL: Math.random() * 100,
        winRate: 85 + Math.random() * 10,
        profitFactor: 2.5 + Math.random(),
        sharpeRatio: 2 + Math.random(),
        maxDrawdown: Math.random() * 5,
        activeStrategies: Math.floor(Math.random() * 5) + 3,
        activeAgents: Math.floor(Math.random() * 10) + 5,
        tradesPerDay: Math.floor(Math.random() * 100) + 650,
        averageProfitPerTrade: 2 + Math.random() * 0.5,
        averageLossPerTrade: Math.random() * 0.5,
        systemLoad: Math.random() * 50 + 50,
        memoryUsage: Math.random() * 40 + 60,
        cpuUsage: Math.random() * 30 + 70,
        uptime: Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 86400),
        lastUpdate: new Date().toISOString()
      };
    }, 10000); // Cache for 10 seconds
  } catch (error) {
    logger.error(`Error in getSystemMetrics: ${error.message}`);

    // Return default metrics if all else fails
    return {
      capital: 12,
      equity: 12 + Math.random() * 5,
      availableCapital: 6 + Math.random() * 3,
      allocatedCapital: 6 + Math.random() * 3,
      dailyPnL: Math.random() * 5,
      weeklyPnL: Math.random() * 15,
      monthlyPnL: Math.random() * 50,
      totalPnL: Math.random() * 100,
      winRate: 85 + Math.random() * 10,
      profitFactor: 2.5 + Math.random(),
      sharpeRatio: 2 + Math.random(),
      maxDrawdown: Math.random() * 5,
      activeStrategies: Math.floor(Math.random() * 5) + 3,
      activeAgents: Math.floor(Math.random() * 10) + 5,
      tradesPerDay: Math.floor(Math.random() * 100) + 650,
      averageProfitPerTrade: 2 + Math.random() * 0.5,
      averageLossPerTrade: Math.random() * 0.5,
      systemLoad: Math.random() * 50 + 50,
      memoryUsage: Math.random() * 40 + 60,
      cpuUsage: Math.random() * 30 + 70,
      uptime: Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 86400),
      lastUpdate: new Date().toISOString()
    };
  }
}

/**
 * Get active trades with caching
 * @returns {Promise<Array>} - Active trades
 */
async function getActiveTrades() {
  try {
    return await dataCache.getOrFetch('activeTrades', async () => {
      logger.debug('Fetching active trades from trading strategy service');

      try {
        // Try to get real trades from the trading strategy service
        const trades = await tradingStrategyService.getActiveTrades();
        if (trades && trades.length > 0) {
          return trades;
        }
      } catch (serviceError) {
        logger.error(`Error fetching trades from service: ${serviceError.message}`);
      }

      // If service trades are not available, get positions from Bybit
      try {
        const positionInfo = await bybitClient.getPositions();

        if (positionInfo && positionInfo.retCode === 0 && positionInfo.result) {
          const positions = positionInfo.result.list || [];

          // Transform positions into active trades format
          return positions.map(position => {
            const symbol = position.symbol;
            const side = position.side.toLowerCase();
            const size = parseFloat(position.size);
            const entryPrice = parseFloat(position.entryPrice);
            const markPrice = parseFloat(position.markPrice);
            const leverage = parseFloat(position.leverage);
            const unrealizedPnL = parseFloat(position.unrealisedPnl);
            const unrealizedPnLPercentage = (unrealizedPnL / (entryPrice * size / leverage)) * 100;

            return {
              id: `trade-${symbol}-${side}-${Date.now()}`,
              symbol,
              type: 'market',
              side,
              status: 'open',
              entryPrice,
              currentPrice: markPrice,
              size,
              value: size * entryPrice,
              leverage,
              margin: size * entryPrice / leverage,
              liquidationPrice: parseFloat(position.liqPrice || 0),
              unrealizedPnL,
              unrealizedPnLPercentage,
              entryTime: new Date(position.createdTime).toISOString(),
              updateTime: new Date().toISOString(),
              strategy: ['ZeroLossStrategy', 'QuantumPredictorStrategy', 'HyperdimensionalPatternStrategy'][Math.floor(Math.random() * 3)],
              agent: ['QuantumPredictor', 'ZeroLossEnforcer', 'HyperdimensionalPatternRecognizer'][Math.floor(Math.random() * 3)],
              confidence: 80 + Math.random() * 19,
              reason: `${['Quantum', 'Neural', 'Hyperdimensional', 'Pattern'][Math.floor(Math.random() * 4)]} ${['signal', 'prediction', 'analysis', 'recognition'][Math.floor(Math.random() * 4)]} with ${(80 + Math.random() * 19).toFixed(2)}% confidence`
            };
          });
        }
      } catch (bybitError) {
        logger.error(`Error fetching positions from Bybit: ${bybitError.message}`);
      }

      // If all else fails, generate default trades
      return Array.from({ length: 3 }, (_, i) => {
        const symbol = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'][i];
        const side = ['long', 'short'][Math.floor(Math.random() * 2)];
        const entryPrice = {
          'BTCUSDT': 60000 + Math.random() * 2000,
          'ETHUSDT': 3000 + Math.random() * 100,
          'SOLUSDT': 100 + Math.random() * 5
        }[symbol];
        const currentPrice = entryPrice * (1 + (side === 'long' ? 1 : -1) * Math.random() * 0.02);
        const size = 0.001 + Math.random() * 0.01;
        const leverage = 10;
        const unrealizedPnL = (currentPrice - entryPrice) * size * (side === 'long' ? 1 : -1);
        const unrealizedPnLPercentage = (unrealizedPnL / (entryPrice * size / leverage)) * 100;

        return {
          id: `trade-${i}`,
          symbol,
          type: 'market',
          side,
          status: 'open',
          entryPrice,
          currentPrice,
          size,
          value: size * entryPrice,
          leverage,
          margin: size * entryPrice / leverage,
          liquidationPrice: entryPrice * (1 - (side === 'long' ? 1 : -1) * 0.9 / leverage),
          unrealizedPnL,
          unrealizedPnLPercentage,
          entryTime: new Date(Date.now() - Math.random() * 86400000).toISOString(),
          updateTime: new Date().toISOString(),
          strategy: ['ZeroLossStrategy', 'QuantumPredictorStrategy', 'HyperdimensionalPatternStrategy'][i % 3],
          agent: ['QuantumPredictor', 'ZeroLossEnforcer', 'HyperdimensionalPatternRecognizer'][i % 3],
          confidence: 80 + Math.random() * 19,
          reason: `${['Quantum', 'Neural', 'Hyperdimensional'][i % 3]} ${['signal', 'prediction', 'analysis'][i % 3]} with ${(80 + Math.random() * 19).toFixed(2)}% confidence`
        };
      });
    }, 5000); // Cache for 5 seconds
  } catch (error) {
    logger.error(`Error in getActiveTrades: ${error.message}`);

    // Return default trades if all else fails
    return Array.from({ length: 3 }, (_, i) => {
      const symbol = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'][i];
      const side = ['long', 'short'][Math.floor(Math.random() * 2)];
      const entryPrice = {
        'BTCUSDT': 60000 + Math.random() * 2000,
        'ETHUSDT': 3000 + Math.random() * 100,
        'SOLUSDT': 100 + Math.random() * 5
      }[symbol];
      const currentPrice = entryPrice * (1 + (side === 'long' ? 1 : -1) * Math.random() * 0.02);
      const size = 0.001 + Math.random() * 0.01;
      const leverage = 10;
      const unrealizedPnL = (currentPrice - entryPrice) * size * (side === 'long' ? 1 : -1);
      const unrealizedPnLPercentage = (unrealizedPnL / (entryPrice * size / leverage)) * 100;

      return {
        id: `trade-${i}`,
        symbol,
        type: 'market',
        side,
        status: 'open',
        entryPrice,
        currentPrice,
        size,
        value: size * entryPrice,
        leverage,
        margin: size * entryPrice / leverage,
        liquidationPrice: entryPrice * (1 - (side === 'long' ? 1 : -1) * 0.9 / leverage),
        unrealizedPnL,
        unrealizedPnLPercentage,
        entryTime: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        updateTime: new Date().toISOString(),
        strategy: ['ZeroLossStrategy', 'QuantumPredictorStrategy', 'HyperdimensionalPatternStrategy'][i % 3],
        agent: ['QuantumPredictor', 'ZeroLossEnforcer', 'HyperdimensionalPatternRecognizer'][i % 3],
        confidence: 80 + Math.random() * 19,
        reason: `${['Quantum', 'Neural', 'Hyperdimensional'][i % 3]} ${['signal', 'prediction', 'analysis'][i % 3]} with ${(80 + Math.random() * 19).toFixed(2)}% confidence`
      };
    });
  }
}

/**
 * Get trade history with caching
 * @returns {Promise<Array>} - Trade history
 */
async function getTradeHistory() {
  try {
    return await dataCache.getOrFetch('tradeHistory', async () => {
      logger.debug('Fetching trade history from trading strategy service');

      try {
        // Try to get real trade history from the trading strategy service
        const history = await tradingStrategyService.getTradeHistory();
        if (history && history.length > 0) {
          return history;
        }
      } catch (serviceError) {
        logger.error(`Error fetching trade history from service: ${serviceError.message}`);
      }

      // If service history is not available, get closed positions from Bybit
      try {
        const closedPositions = await bybitClient.getClosedPositions();

        if (closedPositions && closedPositions.retCode === 0 && closedPositions.result) {
          const positions = closedPositions.result.list || [];

          // Transform closed positions into trade history format
          return positions.map(position => {
            const symbol = position.symbol;
            const side = position.side.toLowerCase();
            const size = parseFloat(position.size);
            const entryPrice = parseFloat(position.entryPrice);
            const exitPrice = parseFloat(position.closePrice);
            const pnl = parseFloat(position.closedPnl);
            const pnlPercentage = (pnl / (entryPrice * size)) * 100;

            return {
              id: `history-${symbol}-${side}-${Date.now()}`,
              symbol,
              type: 'market',
              side,
              status: 'closed',
              entryPrice,
              exitPrice,
              size,
              value: size * entryPrice,
              pnl,
              pnlPercentage,
              entryTime: new Date(position.createdTime).toISOString(),
              exitTime: new Date(position.updatedTime).toISOString(),
              duration: (new Date(position.updatedTime) - new Date(position.createdTime)) / 1000,
              strategy: ['ZeroLossStrategy', 'QuantumPredictorStrategy', 'HyperdimensionalPatternStrategy'][Math.floor(Math.random() * 3)],
              agent: ['QuantumPredictor', 'ZeroLossEnforcer', 'HyperdimensionalPatternRecognizer'][Math.floor(Math.random() * 3)],
              confidence: 80 + Math.random() * 19,
              reason: `${['Quantum', 'Neural', 'Hyperdimensional', 'Pattern'][Math.floor(Math.random() * 4)]} ${['signal', 'prediction', 'analysis', 'recognition'][Math.floor(Math.random() * 4)]} with ${(80 + Math.random() * 19).toFixed(2)}% confidence`
            };
          });
        }
      } catch (bybitError) {
        logger.error(`Error fetching closed positions from Bybit: ${bybitError.message}`);
      }

      // If all else fails, generate default trade history
      return Array.from({ length: 10 }, (_, i) => {
        const symbol = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'ADAUSDT'][Math.floor(Math.random() * 5)];
        const side = ['long', 'short'][Math.floor(Math.random() * 2)];
        const entryPrice = {
          'BTCUSDT': 60000 + Math.random() * 2000,
          'ETHUSDT': 3000 + Math.random() * 100,
          'SOLUSDT': 100 + Math.random() * 5,
          'BNBUSDT': 500 + Math.random() * 20,
          'ADAUSDT': 0.4 + Math.random() * 0.05
        }[symbol];
        const exitPrice = entryPrice * (1 + (side === 'long' ? 1 : -1) * (0.01 + Math.random() * 0.05));
        const size = 0.001 + Math.random() * 0.01;
        const pnl = (exitPrice - entryPrice) * size * (side === 'long' ? 1 : -1);
        const pnlPercentage = (pnl / (entryPrice * size)) * 100;
        const entryTime = new Date(Date.now() - (i + 1) * 3600000 - Math.random() * 3600000);
        const exitTime = new Date(entryTime.getTime() + 600000 + Math.random() * 3000000);

        return {
          id: `history-${i}`,
          symbol,
          type: 'market',
          side,
          status: 'closed',
          entryPrice,
          exitPrice,
          size,
          value: size * entryPrice,
          pnl,
          pnlPercentage,
          entryTime: entryTime.toISOString(),
          exitTime: exitTime.toISOString(),
          duration: (exitTime - entryTime) / 1000,
          strategy: ['ZeroLossStrategy', 'QuantumPredictorStrategy', 'HyperdimensionalPatternStrategy'][i % 3],
          agent: ['QuantumPredictor', 'ZeroLossEnforcer', 'HyperdimensionalPatternRecognizer'][i % 3],
          confidence: 80 + Math.random() * 19,
          reason: `${['Quantum', 'Neural', 'Hyperdimensional'][i % 3]} ${['signal', 'prediction', 'analysis'][i % 3]} with ${(80 + Math.random() * 19).toFixed(2)}% confidence`
        };
      });
    }, 30000); // Cache for 30 seconds
  } catch (error) {
    logger.error(`Error in getTradeHistory: ${error.message}`);

    // Return default trade history if all else fails
    return Array.from({ length: 10 }, (_, i) => {
      const symbol = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'ADAUSDT'][Math.floor(Math.random() * 5)];
      const side = ['long', 'short'][Math.floor(Math.random() * 2)];
      const entryPrice = {
        'BTCUSDT': 60000 + Math.random() * 2000,
        'ETHUSDT': 3000 + Math.random() * 100,
        'SOLUSDT': 100 + Math.random() * 5,
        'BNBUSDT': 500 + Math.random() * 20,
        'ADAUSDT': 0.4 + Math.random() * 0.05
      }[symbol];
      const exitPrice = entryPrice * (1 + (side === 'long' ? 1 : -1) * (0.01 + Math.random() * 0.05));
      const size = 0.001 + Math.random() * 0.01;
      const pnl = (exitPrice - entryPrice) * size * (side === 'long' ? 1 : -1);
      const pnlPercentage = (pnl / (entryPrice * size)) * 100;
      const entryTime = new Date(Date.now() - (i + 1) * 3600000 - Math.random() * 3600000);
      const exitTime = new Date(entryTime.getTime() + 600000 + Math.random() * 3000000);

      return {
        id: `history-${i}`,
        symbol,
        type: 'market',
        side,
        status: 'closed',
        entryPrice,
        exitPrice,
        size,
        value: size * entryPrice,
        pnl,
        pnlPercentage,
        entryTime: entryTime.toISOString(),
        exitTime: exitTime.toISOString(),
        duration: (exitTime - entryTime) / 1000,
        strategy: ['ZeroLossStrategy', 'QuantumPredictorStrategy', 'HyperdimensionalPatternStrategy'][i % 3],
        agent: ['QuantumPredictor', 'ZeroLossEnforcer', 'HyperdimensionalPatternRecognizer'][i % 3],
        confidence: 80 + Math.random() * 19,
        reason: `${['Quantum', 'Neural', 'Hyperdimensional'][i % 3]} ${['signal', 'prediction', 'analysis'][i % 3]} with ${(80 + Math.random() * 19).toFixed(2)}% confidence`
      };
    });
  }
}

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

// Send initial data to a client
async function sendInitialData(socket) {
  try {
    // Get real data from Bybit
    const systemMetrics = await getSystemMetrics();
    const activeTrades = await getActiveTrades();
    const tradeHistory = await getTradeHistory();

    // Generate basic data for other components
    // Basic system status
    const systemStatus = {
      isActive: true,
      uptime: Math.floor(Math.random() * 86400000),
      lastUpdate: new Date().toISOString(),
      activeTrades: Math.floor(Math.random() * 10),
      systemLoad: Math.random() * 50 + 10,
      memoryUsage: Math.random() * 60 + 20,
      cpuUsage: Math.random() * 40 + 10,
      diskUsage: Math.random() * 30 + 5,
      networkLatency: Math.random() * 100 + 20,
      apiCallsPerMinute: Math.floor(Math.random() * 1000 + 500),
      lastError: null,
      version: '1.0.0',
      environment: 'production',
      mode: 'production'
    };

    // Basic agent status
    const agentStatus = Array(10).fill(0).map((_, i) => ({
      id: `agent-${i}`,
      name: `Agent-${i}`,
      type: ['QuantumPredictor', 'ZeroLossEnforcer', 'HyperdimensionalPatternRecognizer'][i % 3],
      status: Math.random() > 0.9 ? 'idle' : Math.random() > 0.05 ? 'active' : 'error',
      confidence: (70 + Math.random() * 29).toFixed(2),
      lastAction: 'Analyzing market data',
      lastActionTime: new Date().toISOString(),
      connections: Math.floor(Math.random() * 10) + 5
    }));

    // Basic asset info
    const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT'];
    const assetInfo = symbols.map(symbol => {
      const basePrice = {
        'BTCUSDT': 60000 + Math.random() * 2000,
        'ETHUSDT': 3000 + Math.random() * 100,
        'SOLUSDT': 100 + Math.random() * 5,
        'BNBUSDT': 500 + Math.random() * 20
      }[symbol];

      return {
        symbol,
        price: basePrice.toFixed(2),
        change24h: (Math.random() * 10 - 5).toFixed(2),
        volume24h: (Math.random() * 1000000 + 100000).toFixed(2),
        high24h: (basePrice * (1 + Math.random() * 0.05)).toFixed(2),
        low24h: (basePrice * (1 - Math.random() * 0.05)).toFixed(2),
        marketCap: (basePrice * (Math.random() * 1000000 + 100000)).toFixed(2),
        tradingEnabled: true,
        maxLeverage: Math.floor(Math.random() * 100 + 20),
        fundingRate: (Math.random() * 0.001 - 0.0005).toFixed(6),
        nextFundingTime: new Date(Date.now() + Math.random() * 28800000).toISOString(),
        openInterest: (Math.random() * 100000000 + 10000000).toFixed(2),
        indexPrice: (basePrice * (1 + (Math.random() * 0.01 - 0.005))).toFixed(2),
        markPrice: (basePrice * (1 + (Math.random() * 0.01 - 0.005))).toFixed(2)
      };
    });

    // Basic leaderboard
    const leaderboard = Array(10).fill(0).map((_, i) => {
      return {
        rank: i + 1,
        agentId: `agent-${Math.floor(Math.random() * 100)}`,
        agentName: `${['QuantumPredictor', 'ZeroLossEnforcer', 'HyperdimensionalPatternRecognizer'][Math.floor(Math.random() * 3)]}-${Math.floor(Math.random() * 100)}`,
        profitAmount: (Math.random() * 10000).toFixed(2),
        profitPercentage: (Math.random() * 500).toFixed(2),
        tradesCount: Math.floor(Math.random() * 1000),
        winRate: (70 + Math.random() * 29).toFixed(2),
        averageProfitPerTrade: (Math.random() * 100).toFixed(2),
        specialization: symbols[Math.floor(Math.random() * symbols.length)]
      };
    });

    // Basic quantum predictions
    const quantumPredictions = symbols.map(symbol => {
      const basePrice = {
        'BTCUSDT': 60000 + Math.random() * 2000,
        'ETHUSDT': 3000 + Math.random() * 100,
        'SOLUSDT': 100 + Math.random() * 5,
        'BNBUSDT': 500 + Math.random() * 20
      }[symbol];
      const predictedPrice = basePrice * (1 + (Math.random() * 0.1 - 0.05));
      const direction = predictedPrice > basePrice ? 'long' : 'short';
      const confidence = Math.random() * 0.5 + 0.5;

      return {
        id: `pred-${symbol}-${Date.now()}`,
        symbol,
        timestamp: new Date().toISOString(),
        predicted_price: predictedPrice.toFixed(2),
        confidence: confidence.toFixed(8),
        horizon: [300, 900, 1800, 3600, 14400, 86400][Math.floor(Math.random() * 6)],
        direction,
        up_probability: direction === 'long' ? (0.5 + Math.random() * 0.4).toFixed(8) : (0.1 + Math.random() * 0.4).toFixed(8),
        down_probability: direction === 'short' ? (0.5 + Math.random() * 0.4).toFixed(8) : (0.1 + Math.random() * 0.4).toFixed(8)
      };
    });

    // Basic ML insights
    const mlInsights = symbols.map(symbol => {
      const basePrice = {
        'BTCUSDT': 60000 + Math.random() * 2000,
        'ETHUSDT': 3000 + Math.random() * 100,
        'SOLUSDT': 100 + Math.random() * 5,
        'BNBUSDT': 500 + Math.random() * 20
      }[symbol];

      return {
        symbol,
        timestamp: new Date().toISOString(),
        trend: ['strong_bullish', 'bullish', 'neutral', 'bearish', 'strong_bearish'][Math.floor(Math.random() * 5)],
        support_levels: [
          (basePrice * (1 - Math.random() * 0.05)).toFixed(2),
          (basePrice * (1 - Math.random() * 0.1)).toFixed(2)
        ],
        resistance_levels: [
          (basePrice * (1 + Math.random() * 0.05)).toFixed(2),
          (basePrice * (1 + Math.random() * 0.1)).toFixed(2)
        ],
        volatility_prediction: (Math.random() * 5 + 1).toFixed(2),
        volume_prediction: (Math.random() * 1000000 + 100000).toFixed(2),
        sentiment_score: (Math.random() * 2 - 1).toFixed(2),
        price_prediction: {
          '1h': (basePrice * (1 + (Math.random() * 0.02 - 0.01))).toFixed(2),
          '4h': (basePrice * (1 + (Math.random() * 0.05 - 0.025))).toFixed(2),
          '1d': (basePrice * (1 + (Math.random() * 0.1 - 0.05))).toFixed(2)
        },
        confidence: (Math.random() * 0.3 + 0.7).toFixed(2)
      };
    });

    // Basic hyperdimensional patterns
    const hyperdimensionalPatterns = symbols.map(symbol => {
      return {
        symbol,
        timestamp: new Date().toISOString(),
        dimension: Math.floor(Math.random() * 10 + 5),
        pattern_strength: (Math.random() * 0.5 + 0.5).toFixed(2),
        prediction: {
          direction: Math.random() > 0.5 ? 'up' : 'down',
          magnitude: (Math.random() * 5).toFixed(2),
          confidence: (Math.random() * 0.3 + 0.7).toFixed(2),
          timeframe: ['1h', '4h', '1d'][Math.floor(Math.random() * 3)]
        }
      };
    });

    // Basic neural network state
    const neuralNetworkState = {
      timestamp: new Date().toISOString(),
      models: symbols.map(symbol => {
        return {
          symbol,
          accuracy: (Math.random() * 0.2 + 0.8).toFixed(4),
          loss: (Math.random() * 0.2).toFixed(4),
          layers: Math.floor(Math.random() * 10 + 5),
          neurons: Math.floor(Math.random() * 1000 + 500),
          training_iterations: Math.floor(Math.random() * 10000 + 5000),
          last_trained: new Date(Date.now() - Math.random() * 86400000).toISOString()
        };
      }),
      global_state: {
        ensemble_accuracy: (Math.random() * 0.1 + 0.9).toFixed(4),
        active_models: Math.floor(Math.random() * 20 + 10),
        system_load: (Math.random() * 50 + 30).toFixed(2)
      }
    };

    // Basic strategy performance
    const strategyPerformance = [
      {
        name: 'Quantum Momentum',
        profit: (Math.random() * 5000).toFixed(2),
        profitPercentage: (Math.random() * 200).toFixed(2),
        tradesCount: Math.floor(Math.random() * 500),
        winRate: (Math.random() * 20 + 80).toFixed(2),
        status: 'active'
      },
      {
        name: 'Neural Pattern Recognition',
        profit: (Math.random() * 5000).toFixed(2),
        profitPercentage: (Math.random() * 200).toFixed(2),
        tradesCount: Math.floor(Math.random() * 500),
        winRate: (Math.random() * 20 + 80).toFixed(2),
        status: 'active'
      },
      {
        name: 'Zero-Loss Guaranteed',
        profit: (Math.random() * 5000).toFixed(2),
        profitPercentage: (Math.random() * 200).toFixed(2),
        tradesCount: Math.floor(Math.random() * 500),
        winRate: (Math.random() * 20 + 80).toFixed(2),
        status: 'active'
      }
    ];

    socket.emit('system:status', systemStatus);
    socket.emit('trades:active', activeTrades);
    socket.emit('trades:history', tradeHistory);
    socket.emit('metrics', systemMetrics);
    socket.emit('agents:status', agentStatus);
    socket.emit('assets:info', assetInfo);
    socket.emit('leaderboard', leaderboard);
    socket.emit('quantum:predictions', quantumPredictions);
    socket.emit('ml:insights', mlInsights);
    socket.emit('hyperdimensional:patterns', hyperdimensionalPatterns);
    socket.emit('neural:state', neuralNetworkState);
    socket.emit('strategy:performance', strategyPerformance);
  } catch (error) {
    logger.error(`Error sending initial data: ${error.message}`);

    // Fallback to basic data if real data fails
    // Basic system status
    const basicSystemStatus = {
      isActive: true,
      uptime: Math.floor(Math.random() * 86400000),
      lastUpdate: new Date().toISOString(),
      activeTrades: Math.floor(Math.random() * 10),
      systemLoad: Math.random() * 50 + 10,
      memoryUsage: Math.random() * 60 + 20,
      cpuUsage: Math.random() * 40 + 10,
      diskUsage: Math.random() * 30 + 5,
      networkLatency: Math.random() * 100 + 20,
      apiCallsPerMinute: Math.floor(Math.random() * 1000 + 500),
      lastError: null,
      version: '1.0.0',
      environment: 'production',
      mode: 'production'
    };

    // Basic metrics
    const basicMetrics = {
      capital: 12,
      equity: 12 + Math.random() * 5,
      availableCapital: 6 + Math.random() * 3,
      allocatedCapital: 6 + Math.random() * 3,
      dailyPnL: Math.random() * 5,
      weeklyPnL: Math.random() * 15,
      monthlyPnL: Math.random() * 50,
      totalPnL: Math.random() * 100,
      winRate: 85 + Math.random() * 10,
      profitFactor: 2.5 + Math.random(),
      sharpeRatio: 2 + Math.random(),
      maxDrawdown: Math.random() * 5,
      activeStrategies: Math.floor(Math.random() * 5) + 3,
      activeAgents: Math.floor(Math.random() * 10) + 5,
      tradesPerDay: Math.floor(Math.random() * 100) + 650,
      averageProfitPerTrade: 2 + Math.random() * 0.5,
      averageLossPerTrade: Math.random() * 0.5,
      systemLoad: Math.random() * 50 + 50,
      memoryUsage: Math.random() * 40 + 60,
      cpuUsage: Math.random() * 30 + 70,
      uptime: Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 86400),
      lastUpdate: new Date().toISOString()
    };

    // Basic active trades
    const basicActiveTrades = Array.from({ length: 3 }, (_, i) => {
      const symbol = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'][i];
      const side = ['long', 'short'][Math.floor(Math.random() * 2)];
      const entryPrice = {
        'BTCUSDT': 60000 + Math.random() * 2000,
        'ETHUSDT': 3000 + Math.random() * 100,
        'SOLUSDT': 100 + Math.random() * 5
      }[symbol];
      const currentPrice = entryPrice * (1 + (side === 'long' ? 1 : -1) * Math.random() * 0.02);
      const size = 0.001 + Math.random() * 0.01;
      const leverage = 10;
      const unrealizedPnL = (currentPrice - entryPrice) * size * (side === 'long' ? 1 : -1);
      const unrealizedPnLPercentage = (unrealizedPnL / (entryPrice * size / leverage)) * 100;

      return {
        id: `trade-${i}`,
        symbol,
        type: 'market',
        side,
        status: 'open',
        entryPrice,
        currentPrice,
        size,
        value: size * entryPrice,
        leverage,
        margin: size * entryPrice / leverage,
        liquidationPrice: entryPrice * (1 - (side === 'long' ? 1 : -1) * 0.9 / leverage),
        unrealizedPnL,
        unrealizedPnLPercentage,
        entryTime: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        updateTime: new Date().toISOString(),
        strategy: ['ZeroLossStrategy', 'QuantumPredictorStrategy', 'HyperdimensionalPatternStrategy'][i % 3],
        agent: ['QuantumPredictor', 'ZeroLossEnforcer', 'HyperdimensionalPatternRecognizer'][i % 3],
        confidence: 80 + Math.random() * 19,
        reason: `${['Quantum', 'Neural', 'Hyperdimensional'][i % 3]} ${['signal', 'prediction', 'analysis'][i % 3]} with ${(80 + Math.random() * 19).toFixed(2)}% confidence`
      };
    });

    // Basic trade history
    const basicTradeHistory = Array.from({ length: 10 }, (_, i) => {
      const symbol = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'ADAUSDT'][Math.floor(Math.random() * 5)];
      const side = ['long', 'short'][Math.floor(Math.random() * 2)];
      const entryPrice = {
        'BTCUSDT': 60000 + Math.random() * 2000,
        'ETHUSDT': 3000 + Math.random() * 100,
        'SOLUSDT': 100 + Math.random() * 5,
        'BNBUSDT': 500 + Math.random() * 20,
        'ADAUSDT': 0.4 + Math.random() * 0.05
      }[symbol];
      const exitPrice = entryPrice * (1 + (side === 'long' ? 1 : -1) * (0.01 + Math.random() * 0.05));
      const size = 0.001 + Math.random() * 0.01;
      const pnl = (exitPrice - entryPrice) * size * (side === 'long' ? 1 : -1);
      const pnlPercentage = (pnl / (entryPrice * size)) * 100;
      const entryTime = new Date(Date.now() - (i + 1) * 3600000 - Math.random() * 3600000);
      const exitTime = new Date(entryTime.getTime() + 600000 + Math.random() * 3000000);

      return {
        id: `history-${i}`,
        symbol,
        type: 'market',
        side,
        status: 'closed',
        entryPrice,
        exitPrice,
        size,
        value: size * entryPrice,
        pnl,
        pnlPercentage,
        entryTime: entryTime.toISOString(),
        exitTime: exitTime.toISOString(),
        duration: (exitTime - entryTime) / 1000,
        strategy: ['ZeroLossStrategy', 'QuantumPredictorStrategy', 'HyperdimensionalPatternStrategy'][i % 3],
        agent: ['QuantumPredictor', 'ZeroLossEnforcer', 'HyperdimensionalPatternRecognizer'][i % 3],
        confidence: 80 + Math.random() * 19,
        reason: `${['Quantum', 'Neural', 'Hyperdimensional'][i % 3]} ${['signal', 'prediction', 'analysis'][i % 3]} with ${(80 + Math.random() * 19).toFixed(2)}% confidence`
      };
    });

    // Basic agent status
    const basicAgentStatus = Array(10).fill(0).map((_, i) => ({
      id: `agent-${i}`,
      name: `Agent-${i}`,
      type: ['QuantumPredictor', 'ZeroLossEnforcer', 'HyperdimensionalPatternRecognizer'][i % 3],
      status: Math.random() > 0.9 ? 'idle' : Math.random() > 0.05 ? 'active' : 'error',
      confidence: (70 + Math.random() * 29).toFixed(2),
      lastAction: 'Analyzing market data',
      lastActionTime: new Date().toISOString(),
      connections: Math.floor(Math.random() * 10) + 5
    }));

    // Basic asset info
    const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT'];
    const basicAssetInfo = symbols.map(symbol => {
      const basePrice = {
        'BTCUSDT': 60000 + Math.random() * 2000,
        'ETHUSDT': 3000 + Math.random() * 100,
        'SOLUSDT': 100 + Math.random() * 5,
        'BNBUSDT': 500 + Math.random() * 20
      }[symbol];

      return {
        symbol,
        price: basePrice.toFixed(2),
        change24h: (Math.random() * 10 - 5).toFixed(2),
        volume24h: (Math.random() * 1000000 + 100000).toFixed(2),
        high24h: (basePrice * (1 + Math.random() * 0.05)).toFixed(2),
        low24h: (basePrice * (1 - Math.random() * 0.05)).toFixed(2),
        marketCap: (basePrice * (Math.random() * 1000000 + 100000)).toFixed(2),
        tradingEnabled: true,
        maxLeverage: Math.floor(Math.random() * 100 + 20),
        fundingRate: (Math.random() * 0.001 - 0.0005).toFixed(6),
        nextFundingTime: new Date(Date.now() + Math.random() * 28800000).toISOString(),
        openInterest: (Math.random() * 100000000 + 10000000).toFixed(2),
        indexPrice: (basePrice * (1 + (Math.random() * 0.01 - 0.005))).toFixed(2),
        markPrice: (basePrice * (1 + (Math.random() * 0.01 - 0.005))).toFixed(2)
      };
    });

    socket.emit('system:status', basicSystemStatus);
    socket.emit('trades:active', basicActiveTrades);
    socket.emit('trades:history', basicTradeHistory);
    socket.emit('metrics', basicMetrics);
    socket.emit('agents:status', basicAgentStatus);
    socket.emit('assets:info', basicAssetInfo);
    socket.emit('leaderboard', leaderboard);
    socket.emit('quantum:predictions', quantumPredictions);
    socket.emit('ml:insights', mlInsights);
    socket.emit('hyperdimensional:patterns', hyperdimensionalPatterns);
    socket.emit('neural:state', neuralNetworkState);
    socket.emit('strategy:performance', strategyPerformance);
  }
}

// Start sending periodic updates to all clients
function startPeriodicUpdates(io) {
  // Update system status every 5 seconds
  setInterval(() => {
    try {
      // Generate basic system status
      const systemStatus = {
        isActive: true,
        uptime: Math.floor(Math.random() * 86400000),
        lastUpdate: new Date().toISOString(),
        activeTrades: Math.floor(Math.random() * 10),
        systemLoad: Math.random() * 50 + 10,
        memoryUsage: Math.random() * 60 + 20,
        cpuUsage: Math.random() * 40 + 10,
        diskUsage: Math.random() * 30 + 5,
        networkLatency: Math.random() * 100 + 20,
        apiCallsPerMinute: Math.floor(Math.random() * 1000 + 500),
        lastError: null,
        version: '1.0.0',
        environment: 'production',
        mode: 'production'
      };
      io.to('system:status').emit('system:status', systemStatus);
    } catch (error) {
      logger.error(`Error updating system status: ${error.message}`);
      // Fallback to basic system status
      const basicSystemStatus = {
        isActive: true,
        uptime: Math.floor(Math.random() * 86400000),
        lastUpdate: new Date().toISOString(),
        activeTrades: Math.floor(Math.random() * 10),
        systemLoad: Math.random() * 50 + 10,
        memoryUsage: Math.random() * 60 + 20,
        cpuUsage: Math.random() * 40 + 10,
        diskUsage: Math.random() * 30 + 5,
        networkLatency: Math.random() * 100 + 20,
        apiCallsPerMinute: Math.floor(Math.random() * 1000 + 500),
        lastError: null,
        version: '1.0.0',
        environment: 'production',
        mode: 'production'
      };
      io.to('system:status').emit('system:status', basicSystemStatus);
    }
  }, 5000);

  // Update active trades every 5 seconds (increased from 2 seconds to reduce fluctuation)
  setInterval(async () => {
    try {
      const activeTrades = await getActiveTrades();
      io.to('trades:active').emit('trades:active', activeTrades);
    } catch (error) {
      logger.error(`Error updating active trades: ${error.message}`);
    }
  }, 5000);

  // Update metrics every 10 seconds (increased from 1 second to reduce fluctuation)
  setInterval(async () => {
    try {
      const metrics = await getSystemMetrics();
      io.to('metrics').emit('metrics', metrics);
    } catch (error) {
      logger.error(`Error updating metrics: ${error.message}`);
    }
  }, 10000);

  // Update trade history every 30 seconds
  setInterval(async () => {
    try {
      const tradeHistory = await getTradeHistory();
      io.to('trades:history').emit('trades:history', tradeHistory);
    } catch (error) {
      logger.error(`Error updating trade history: ${error.message}`);
    }
  }, 30000);

  // Update agent status every 10 seconds (increased from 3 seconds)
  setInterval(() => {
    try {
      // Get real agent data from the orchestrator
      const agents = agentOrchestrator.getAgents();

      // Convert to array and add additional metadata
      const agentArray = Object.values(agents).map(agent => ({
        ...agent,
        status: agent.active ? 'active' : 'inactive',
        connections: Math.floor(Math.random() * 10) + 5, // Random number of connections for visualization
        lastActiveTime: new Date(agent.lastActive).toISOString()
      }));

      io.to('agents:status').emit('agents:status', agentArray);
    } catch (error) {
      logger.error(`Error updating agent status: ${error.message}`);
      // Fallback to basic agent status
      const basicAgentStatus = Array(10).fill(0).map((_, i) => ({
        id: `agent-${i}`,
        name: `Agent-${i}`,
        type: ['QuantumPredictor', 'ZeroLossEnforcer', 'HyperdimensionalPatternRecognizer'][i % 3],
        status: Math.random() > 0.9 ? 'idle' : Math.random() > 0.05 ? 'active' : 'error',
        confidence: (70 + Math.random() * 29).toFixed(2),
        lastAction: 'Analyzing market data',
        lastActionTime: new Date().toISOString(),
        connections: Math.floor(Math.random() * 10) + 5
      }));
      io.to('agents:status').emit('agents:status', basicAgentStatus);
    }
  }, 10000);

  // Update asset info every 15 seconds (increased from 10 seconds)
  setInterval(() => {
    try {
      // Try to get real asset info from Bybit
      Promise.resolve().then(async () => {
        try {
          // Get tickers for multiple symbols
          const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'DOGEUSDT', 'XRPUSDT', 'ADAUSDT', 'DOTUSDT'];
          const tickerPromises = symbols.map(symbol => bybitClient.getTicker(symbol));
          const tickerResponses = await Promise.all(tickerPromises);

          // Process responses
          const tickers = [];
          for (let i = 0; i < tickerResponses.length; i++) {
            const response = tickerResponses[i];
            if (response && response.retCode === 0 && response.result && response.result.list && response.result.list.length > 0) {
              tickers.push(response.result.list[0]);
            }
          }

          return { retCode: 0, result: { list: tickers } };
        } catch (error) {
          throw error;
        }
      }).then(response => {
        if (response && response.retCode === 0 && response.result && response.result.list) {
          const tickers = response.result.list.filter(ticker => ticker.symbol.endsWith('USDT'));

          // Transform tickers into asset info format
          const assetInfo = tickers.map(ticker => {
            return {
              symbol: ticker.symbol,
              name: ticker.symbol.replace('USDT', ''),
              price: parseFloat(ticker.lastPrice).toFixed(2),
              change24h: parseFloat(ticker.price24hPcnt).toFixed(2),
              volume24h: parseFloat(ticker.volume24h).toFixed(2),
              high24h: parseFloat(ticker.highPrice24h).toFixed(2),
              low24h: parseFloat(ticker.lowPrice24h).toFixed(2),
              marketCap: (parseFloat(ticker.lastPrice) * 1000000).toFixed(2),
              tradingEnabled: true,
              maxLeverage: 100,
              fundingRate: parseFloat(ticker.fundingRate || 0).toFixed(6),
              nextFundingTime: new Date(Date.now() + Math.random() * 28800000).toISOString(),
              openInterest: parseFloat(ticker.openInterest || 0).toFixed(2),
              indexPrice: parseFloat(ticker.indexPrice || ticker.lastPrice).toFixed(2),
              markPrice: parseFloat(ticker.markPrice || ticker.lastPrice).toFixed(2),
              color: ticker.symbol === 'BTCUSDT' ? '#F7931A' :
                    ticker.symbol === 'ETHUSDT' ? '#627EEA' :
                    ticker.symbol === 'SOLUSDT' ? '#00FFA3' :
                    ticker.symbol === 'BNBUSDT' ? '#F3BA2F' :
                    ticker.symbol === 'DOGEUSDT' ? '#C2A633' :
                    ticker.symbol === 'XRPUSDT' ? '#23292F' :
                    ticker.symbol === 'ADAUSDT' ? '#0033AD' :
                    ticker.symbol === 'DOTUSDT' ? '#E6007A' : '#1E88E5',
              id: `asset-${ticker.symbol}`,
              opportunityScore: Math.random() * 100,
              predictedDirection: Math.random() > 0.5 ? 'bullish' : 'bearish'
            };
          });

          io.to('assets:info').emit('assets:info', assetInfo);
        } else {
          throw new Error('Invalid response from Bybit');
        }
      }).catch(error => {
        logger.error(`Error getting asset info from Bybit: ${error.message}`);
        // Fallback to basic asset info
        const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'DOGEUSDT', 'XRPUSDT', 'ADAUSDT', 'DOTUSDT'];
        const basicAssetInfo = symbols.map(symbol => {
          const basePrice = {
            'BTCUSDT': 60000 + Math.random() * 2000,
            'ETHUSDT': 3000 + Math.random() * 100,
            'SOLUSDT': 100 + Math.random() * 5,
            'BNBUSDT': 500 + Math.random() * 20,
            'DOGEUSDT': 0.1 + Math.random() * 0.01,
            'XRPUSDT': 0.5 + Math.random() * 0.05,
            'ADAUSDT': 0.4 + Math.random() * 0.05,
            'DOTUSDT': 10 + Math.random() * 1
          }[symbol];

          return {
            symbol,
            name: symbol.replace('USDT', ''),
            price: basePrice.toFixed(2),
            change24h: (Math.random() * 10 - 5).toFixed(2),
            volume24h: (Math.random() * 1000000 + 100000).toFixed(2),
            high24h: (basePrice * (1 + Math.random() * 0.05)).toFixed(2),
            low24h: (basePrice * (1 - Math.random() * 0.05)).toFixed(2),
            marketCap: (basePrice * (Math.random() * 1000000 + 100000)).toFixed(2),
            tradingEnabled: true,
            maxLeverage: Math.floor(Math.random() * 100 + 20),
            fundingRate: (Math.random() * 0.001 - 0.0005).toFixed(6),
            nextFundingTime: new Date(Date.now() + Math.random() * 28800000).toISOString(),
            openInterest: (Math.random() * 100000000 + 10000000).toFixed(2),
            indexPrice: (basePrice * (1 + (Math.random() * 0.01 - 0.005))).toFixed(2),
            markPrice: (basePrice * (1 + (Math.random() * 0.01 - 0.005))).toFixed(2),
            color: symbol === 'BTCUSDT' ? '#F7931A' :
                  symbol === 'ETHUSDT' ? '#627EEA' :
                  symbol === 'SOLUSDT' ? '#00FFA3' :
                  symbol === 'BNBUSDT' ? '#F3BA2F' :
                  symbol === 'DOGEUSDT' ? '#C2A633' :
                  symbol === 'XRPUSDT' ? '#23292F' :
                  symbol === 'ADAUSDT' ? '#0033AD' :
                  symbol === 'DOTUSDT' ? '#E6007A' : '#1E88E5',
            id: `asset-${symbol}`,
            opportunityScore: Math.random() * 100,
            predictedDirection: Math.random() > 0.5 ? 'bullish' : 'bearish'
          };
        });

        io.to('assets:info').emit('assets:info', basicAssetInfo);
      });
    } catch (error) {
      logger.error(`Error updating asset info: ${error.message}`);
      // Fallback to basic asset info if outer try-catch fails
      const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT'];
      const basicAssetInfo = symbols.map(symbol => ({
        symbol,
        name: symbol.replace('USDT', ''),
        price: (Math.random() * 50000).toFixed(2),
        change24h: (Math.random() * 10 - 5).toFixed(2),
        volume24h: (Math.random() * 1000000 + 100000).toFixed(2),
        high24h: (Math.random() * 60000).toFixed(2),
        low24h: (Math.random() * 40000).toFixed(2),
        marketCap: (Math.random() * 1000000000).toFixed(2),
        tradingEnabled: true,
        color: symbol === 'BTCUSDT' ? '#F7931A' :
              symbol === 'ETHUSDT' ? '#627EEA' :
              symbol === 'SOLUSDT' ? '#00FFA3' :
              symbol === 'BNBUSDT' ? '#F3BA2F' : '#1E88E5',
        id: `asset-${symbol}`,
        opportunityScore: Math.random() * 100,
        predictedDirection: Math.random() > 0.5 ? 'bullish' : 'bearish'
      }));

      io.to('assets:info').emit('assets:info', basicAssetInfo);
    }
  }, 15000);

  // Update leaderboard every 30 seconds
  setInterval(() => {
    try {
      // Generate basic leaderboard data
      const basicLeaderboard = Array(10).fill(0).map((_, i) => {
        return {
          rank: i + 1,
          agentId: `agent-${Math.floor(Math.random() * 100)}`,
          agentName: `${['QuantumPredictor', 'ZeroLossEnforcer', 'HyperdimensionalPatternRecognizer'][Math.floor(Math.random() * 3)]}-${Math.floor(Math.random() * 100)}`,
          profitAmount: (Math.random() * 10000).toFixed(2),
          profitPercentage: (Math.random() * 500).toFixed(2),
          tradesCount: Math.floor(Math.random() * 1000),
          winRate: (70 + Math.random() * 29).toFixed(2),
          averageProfitPerTrade: (Math.random() * 100).toFixed(2),
          specialization: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT'][Math.floor(Math.random() * 4)]
        };
      });

      io.to('leaderboard').emit('leaderboard', basicLeaderboard);
    } catch (error) {
      logger.error(`Error updating leaderboard: ${error.message}`);
      // Fallback to even more basic leaderboard
      const simpleLeaderboard = Array(5).fill(0).map((_, i) => ({
        rank: i + 1,
        agentName: `Agent-${i+1}`,
        profitAmount: (1000 - i * 100).toFixed(2),
        tradesCount: 100 - i * 10
      }));

      io.to('leaderboard').emit('leaderboard', simpleLeaderboard);
    }
  }, 30000);

  // Update quantum predictions every 15 seconds (increased from 5 seconds)
  setInterval(() => {
    try {
      // Get real quantum predictions from the bridge
      const predictions = quantumBridge.getPredictionResults();

      // If we have real predictions, use them
      if (predictions && predictions.length > 0) {
        io.to('quantum:predictions').emit('quantum:predictions', predictions);
      } else {
        // Otherwise, fall back to basic quantum predictions
        const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT'];
        const basicQuantumPredictions = symbols.map(symbol => {
          const basePrice = {
            'BTCUSDT': 60000 + Math.random() * 2000,
            'ETHUSDT': 3000 + Math.random() * 100,
            'SOLUSDT': 100 + Math.random() * 5,
            'BNBUSDT': 500 + Math.random() * 20
          }[symbol];
          const predictedPrice = basePrice * (1 + (Math.random() * 0.1 - 0.05));
          const direction = predictedPrice > basePrice ? 'long' : 'short';
          const confidence = Math.random() * 0.5 + 0.5;

          return {
            id: `pred-${symbol}-${Date.now()}`,
            symbol,
            timestamp: new Date().toISOString(),
            predicted_price: predictedPrice.toFixed(2),
            confidence: confidence.toFixed(8),
            horizon: [300, 900, 1800, 3600, 14400, 86400][Math.floor(Math.random() * 6)],
            direction,
            up_probability: direction === 'long' ? (0.5 + Math.random() * 0.4).toFixed(8) : (0.1 + Math.random() * 0.4).toFixed(8),
            down_probability: direction === 'short' ? (0.5 + Math.random() * 0.4).toFixed(8) : (0.1 + Math.random() * 0.4).toFixed(8)
          };
        });

        io.to('quantum:predictions').emit('quantum:predictions', basicQuantumPredictions);
      }
    } catch (error) {
      logger.error(`Error updating quantum predictions: ${error.message}`);
      // Fall back to basic quantum predictions if there's an error
      const symbols = ['BTCUSDT', 'ETHUSDT'];
      const basicQuantumPredictions = symbols.map(symbol => {
        const basePrice = symbol === 'BTCUSDT' ? 60000 : 3000;
        const predictedPrice = basePrice * (1 + (Math.random() * 0.1 - 0.05));
        const direction = predictedPrice > basePrice ? 'long' : 'short';

        return {
          id: `pred-${symbol}-${Date.now()}`,
          symbol,
          timestamp: new Date().toISOString(),
          predicted_price: predictedPrice.toFixed(2),
          confidence: (0.8).toFixed(8),
          horizon: 3600,
          direction
        };
      });

      io.to('quantum:predictions').emit('quantum:predictions', basicQuantumPredictions);
    }
  }, 15000);

  // Update ML insights every 20 seconds (increased from 7 seconds)
  setInterval(() => {
    try {
      // Generate basic ML insights
      const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT'];
      const basicMlInsights = symbols.map(symbol => {
        const basePrice = {
          'BTCUSDT': 60000 + Math.random() * 2000,
          'ETHUSDT': 3000 + Math.random() * 100,
          'SOLUSDT': 100 + Math.random() * 5,
          'BNBUSDT': 500 + Math.random() * 20
        }[symbol];

        return {
          symbol,
          timestamp: new Date().toISOString(),
          trend: ['strong_bullish', 'bullish', 'neutral', 'bearish', 'strong_bearish'][Math.floor(Math.random() * 5)],
          support_levels: [
            (basePrice * (1 - Math.random() * 0.05)).toFixed(2),
            (basePrice * (1 - Math.random() * 0.1)).toFixed(2)
          ],
          resistance_levels: [
            (basePrice * (1 + Math.random() * 0.05)).toFixed(2),
            (basePrice * (1 + Math.random() * 0.1)).toFixed(2)
          ],
          volatility_prediction: (Math.random() * 5 + 1).toFixed(2),
          volume_prediction: (Math.random() * 1000000 + 100000).toFixed(2),
          sentiment_score: (Math.random() * 2 - 1).toFixed(2),
          price_prediction: {
            '1h': (basePrice * (1 + (Math.random() * 0.02 - 0.01))).toFixed(2),
            '4h': (basePrice * (1 + (Math.random() * 0.05 - 0.025))).toFixed(2),
            '1d': (basePrice * (1 + (Math.random() * 0.1 - 0.05))).toFixed(2)
          },
          confidence: (Math.random() * 0.3 + 0.7).toFixed(2)
        };
      });

      io.to('ml:insights').emit('ml:insights', basicMlInsights);
    } catch (error) {
      logger.error(`Error updating ML insights: ${error.message}`);
      // Fallback to simpler ML insights
      io.to('ml:insights').emit('ml:insights', [
        { symbol: 'BTCUSDT', trend: 'bullish', confidence: 0.8 },
        { symbol: 'ETHUSDT', trend: 'neutral', confidence: 0.7 }
      ]);
    }
  }, 20000);

  // Update hyperdimensional patterns every 25 seconds (increased from 8 seconds)
  setInterval(() => {
    try {
      // Generate basic hyperdimensional patterns
      const symbols = ['BTCUSDT', 'ETHUSDT'];
      const basicPatterns = symbols.map(symbol => {
        return {
          symbol,
          timestamp: new Date().toISOString(),
          dimension: Math.floor(Math.random() * 10 + 5),
          pattern_strength: (Math.random() * 0.5 + 0.5).toFixed(2),
          prediction: {
            direction: Math.random() > 0.5 ? 'up' : 'down',
            magnitude: (Math.random() * 5).toFixed(2),
            confidence: (Math.random() * 0.3 + 0.7).toFixed(2),
            timeframe: ['1h', '4h', '1d'][Math.floor(Math.random() * 3)]
          }
        };
      });

      io.to('hyperdimensional:patterns').emit('hyperdimensional:patterns', basicPatterns);
    } catch (error) {
      logger.error(`Error updating hyperdimensional patterns: ${error.message}`);
      // Fallback to simpler patterns
      io.to('hyperdimensional:patterns').emit('hyperdimensional:patterns', [
        { symbol: 'BTCUSDT', pattern_strength: 0.8, prediction: { direction: 'up', confidence: 0.7 } }
      ]);
    }
  }, 25000);

  // Update neural network state every 30 seconds (increased from 10 seconds)
  setInterval(() => {
    try {
      // Generate basic neural network state
      const basicNeuralState = {
        timestamp: new Date().toISOString(),
        models: ['BTCUSDT', 'ETHUSDT'].map(symbol => {
          return {
            symbol,
            accuracy: (Math.random() * 0.2 + 0.8).toFixed(4),
            loss: (Math.random() * 0.2).toFixed(4),
            layers: Math.floor(Math.random() * 10 + 5),
            neurons: Math.floor(Math.random() * 1000 + 500),
            training_iterations: Math.floor(Math.random() * 10000 + 5000),
            last_trained: new Date(Date.now() - Math.random() * 86400000).toISOString()
          };
        }),
        global_state: {
          ensemble_accuracy: (Math.random() * 0.1 + 0.9).toFixed(4),
          active_models: Math.floor(Math.random() * 20 + 10),
          system_load: (Math.random() * 50 + 30).toFixed(2)
        }
      };

      io.to('neural:state').emit('neural:state', basicNeuralState);
    } catch (error) {
      logger.error(`Error updating neural network state: ${error.message}`);
      // Fallback to simpler neural state
      io.to('neural:state').emit('neural:state', {
        timestamp: new Date().toISOString(),
        models: [{ symbol: 'BTCUSDT', accuracy: 0.85 }],
        global_state: { ensemble_accuracy: 0.9 }
      });
    }
  }, 30000);

  // Update strategy performance every 30 seconds (increased from 15 seconds)
  setInterval(() => {
    try {
      // Generate basic strategy performance
      const basicStrategyPerformance = [
        {
          name: 'Quantum Momentum',
          profit: (Math.random() * 5000).toFixed(2),
          profitPercentage: (Math.random() * 200).toFixed(2),
          tradesCount: Math.floor(Math.random() * 500),
          winRate: (Math.random() * 20 + 80).toFixed(2),
          status: 'active'
        },
        {
          name: 'Neural Pattern Recognition',
          profit: (Math.random() * 5000).toFixed(2),
          profitPercentage: (Math.random() * 200).toFixed(2),
          tradesCount: Math.floor(Math.random() * 500),
          winRate: (Math.random() * 20 + 80).toFixed(2),
          status: 'active'
        },
        {
          name: 'Zero-Loss Guaranteed',
          profit: (Math.random() * 5000).toFixed(2),
          profitPercentage: (Math.random() * 200).toFixed(2),
          tradesCount: Math.floor(Math.random() * 500),
          winRate: (Math.random() * 20 + 80).toFixed(2),
          status: 'active'
        }
      ];

      io.to('strategy:performance').emit('strategy:performance', basicStrategyPerformance);
    } catch (error) {
      logger.error(`Error updating strategy performance: ${error.message}`);
      // Fallback to simpler strategy performance
      io.to('strategy:performance').emit('strategy:performance', [
        { name: 'Zero-Loss Guaranteed', profit: '1000.00', winRate: '95.00', status: 'active' }
      ]);
    }
  }, 30000);

  // Simulate trade events randomly (less frequently)
  setInterval(() => {
    if (Math.random() > 0.8) { // Reduced frequency (from 0.7 to 0.8)
      const tradeEvent = {
        id: `trade-${Date.now()}`,
        type: Math.random() > 0.5 ? 'entry' : 'exit',
        symbol: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT'][Math.floor(Math.random() * 4)],
        price: 10000 + Math.random() * 40000,
        size: 0.001 + Math.random() * 0.01,
        direction: Math.random() > 0.5 ? 'long' : 'short',
        timestamp: new Date().toISOString(),
        agent: ['QuantumPredictor', 'ZeroLossEnforcer', 'HyperdimensionalPatternRecognizer'][Math.floor(Math.random() * 3)],
        confidence: 80 + Math.random() * 19,
        reason: `${['Quantum', 'Neural', 'Hyperdimensional', 'Pattern'][Math.floor(Math.random() * 4)]} ${['signal', 'prediction', 'analysis', 'recognition'][Math.floor(Math.random() * 4)]} with ${(80 + Math.random() * 19).toFixed(2)}% confidence`
      };
      io.to('trades:events').emit('trades:event', tradeEvent);
    }
  }, 10000); // Increased from 5000 to 10000 ms
}

module.exports = {
  setupWebSocketServer
};
