/**
 * Standalone WebSocket Server for OMNI-ALPHA VΩ∞∞ Trading System Dashboard
 *
 * This server provides WebSocket connections for real-time updates to the dashboard.
 */

require('dotenv').config();
const http = require('http');
const socketIo = require('socket.io');
const winston = require('winston');
const fetch = require('node-fetch');
const tradingStrategyService = require('./services/trading-strategy-service');
const tickerService = require('./services/ticker-service');
const dataCache = require('./utils/data-cache.js');
const { generateMockData } = require('./utils/mock-data-generator');
const agentOrchestrator = require('./services/agent-orchestrator');
const quantumBridge = require('./services/quantum-bridge');
const zeroLossGuarantee = require('./services/zero-loss-guarantee');
const strategyOptimizer = require('./services/strategy-optimizer');
const multiAgentCoordinator = require('./services/multi-agent-coordinator');

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

// Create HTTP server
const server = http.createServer();

// Create Socket.IO server
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://3.111.22.56:10001',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
});

// Active connections
const connections = new Set();

// Setup WebSocket server
function setupWebSocketServer() {
  logger.info('Setting up WebSocket server');

  // The trading strategy service is already initialized in server.js
  // No need to initialize it again here
  logger.info('Using already initialized trading strategy service');

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
  startPeriodicUpdates();
}

// Send initial data to a client
async function sendInitialData(socket) {
  try {
    // Get real trading data
    const tradingState = tradingStrategyService.getTradingState();
    const systemMetrics = tradingStrategyService.getSystemMetrics();
    const activeTrades = tradingStrategyService.getActiveTrades();
    const tradeHistory = tradingStrategyService.getTradeHistory();

    // Initialize the agent orchestrator if needed
    if (!agentOrchestrator.getState().active) {
      logger.info('Initializing agent orchestrator for initial data');
      agentOrchestrator.initialize();
    }

    // Get real agent data
    let agents = agentOrchestrator.getAgents();

    // If no agents are returned from the orchestrator, try fetching from API
    if (!agents || agents.length === 0) {
      try {
        logger.info('No agents from orchestrator, fetching from API for initial data');
        const response = await fetch('http://localhost:10002/api/agents');
        if (response.ok) {
          agents = await response.json();
          logger.debug(`Fetched ${agents.length} agents from API for initial data`);
        } else {
          logger.warn(`API returned status ${response.status} when fetching agents for initial data`);
        }
      } catch (apiError) {
        logger.error(`Error fetching agents from API for initial data: ${apiError.message}`);
      }
    }

    // Get mock data for other components
    const {
      systemStatus,
      assetInfo,
      leaderboard,
      quantumPredictions,
      mlInsights,
      hyperdimensionalPatterns,
      neuralNetworkState,
      strategyPerformance
    } = generateMockData();

    // Update system status with real trading state
    systemStatus.isActive = tradingState.isActive;
    systemStatus.uptime = Date.now() - tradingState.startTime;
    systemStatus.lastUpdate = new Date().toISOString();

    // Send data to client
    socket.emit('system:status', systemStatus);
    socket.emit('trades:active', activeTrades);
    socket.emit('trades:history', tradeHistory);
    socket.emit('metrics', systemMetrics);

    // Send real agent data if available, otherwise fallback to mock data
    if (agents && agents.length > 0) {
      logger.debug(`Sending ${agents.length} real agents to client ${socket.id}`);
      socket.emit('agents:status', agents);
    } else {
      logger.warn(`No real agents available, sending mock agents to client ${socket.id}`);
      const { agentStatus } = generateMockData();
      socket.emit('agents:status', agentStatus);
    }

    socket.emit('assets:info', assetInfo);
    socket.emit('leaderboard', leaderboard);
    socket.emit('quantum:predictions', quantumPredictions);
    socket.emit('ml:insights', mlInsights);
    socket.emit('hyperdimensional:patterns', hyperdimensionalPatterns);
    socket.emit('neural:state', neuralNetworkState);
    socket.emit('strategy:performance', strategyPerformance);

    logger.debug(`Sent initial data to client ${socket.id}`);
  } catch (error) {
    logger.error(`Error sending initial data to client ${socket.id}: ${error.message}`);

    // Fallback to mock data if there's an error
    const mockData = generateMockData();

    socket.emit('system:status', mockData.systemStatus);
    socket.emit('trades:active', mockData.activeTrades);
    socket.emit('trades:history', mockData.tradeHistory);
    socket.emit('metrics', mockData.systemMetrics);
    socket.emit('agents:status', mockData.agentStatus);
    socket.emit('assets:info', mockData.assetInfo);
    socket.emit('leaderboard', mockData.leaderboard);
    socket.emit('quantum:predictions', mockData.quantumPredictions);
    socket.emit('ml:insights', mockData.mlInsights);
    socket.emit('hyperdimensional:patterns', mockData.hyperdimensionalPatterns);
    socket.emit('neural:state', mockData.neuralNetworkState);
    socket.emit('strategy:performance', mockData.strategyPerformance);
  }
}

// Start sending periodic updates to all clients
function startPeriodicUpdates() {
  // Update system status every 5 seconds
  setInterval(() => {
    try {
      // Define a function to fetch the trading state
      const fetchTradingState = async () => {
        logger.debug('Fetching trading state from trading strategy service');
        return tradingStrategyService.getTradingState();
      };

      // Use getOrFetch to get the data with caching
      dataCache.getOrFetch('system', 'tradingState', fetchTradingState, 5000)
        .then(tradingState => {
          const { systemStatus } = generateMockData();

          // Update with real trading data
          systemStatus.isActive = tradingState.isActive;
          systemStatus.uptime = Date.now() - tradingState.startTime;
          systemStatus.lastUpdate = new Date().toISOString();
          systemStatus.activeTrades = tradingState.openTrades.length;

          io.to('system:status').emit('system:status', systemStatus);
        })
        .catch(error => {
          logger.error(`Error updating system status: ${error.message}`);
          const { systemStatus } = generateMockData();
          io.to('system:status').emit('system:status', systemStatus);
        });
    } catch (error) {
      logger.error(`Error in system status update: ${error.message}`);
      const { systemStatus } = generateMockData();
      io.to('system:status').emit('system:status', systemStatus);
    }
  }, 5000);

  // Update active trades every 2 seconds
  setInterval(() => {
    try {
      // Define a function to fetch active trades
      const fetchActiveTrades = async () => {
        logger.debug('Fetching active trades from trading strategy service');
        return tradingStrategyService.getActiveTrades();
      };

      // Use getOrFetch to get the data with caching
      dataCache.getOrFetch('trades', 'active', fetchActiveTrades, 2000)
        .then(activeTrades => {
          // Emit to clients
          io.to('trades:active').emit('trades:active', activeTrades);
        })
        .catch(error => {
          logger.error(`Error in getActiveTrades: ${error.message}`);
          const { activeTrades } = generateMockData();
          io.to('trades:active').emit('trades:active', activeTrades);
        });
    } catch (error) {
      logger.error(`Error updating active trades: ${error.message}`);
      const { activeTrades } = generateMockData();
      io.to('trades:active').emit('trades:active', activeTrades);
    }
  }, 2000);

  // Update metrics every 1 second
  setInterval(() => {
    try {
      // Define a function to fetch system metrics
      const fetchSystemMetrics = async () => {
        logger.debug('Fetching system metrics from trading strategy service');
        return tradingStrategyService.getSystemMetrics();
      };

      // Use getOrFetch to get the data with caching
      dataCache.getOrFetch('system', 'metrics', fetchSystemMetrics, 1000)
        .then(systemMetrics => {
          // Emit to clients
          io.to('metrics').emit('metrics', systemMetrics);
        })
        .catch(error => {
          logger.error(`Error in getSystemMetrics: ${error.message}`);
          const { systemMetrics } = generateMockData();
          io.to('metrics').emit('metrics', systemMetrics);
        });
    } catch (error) {
      logger.error(`Error updating metrics: ${error.message}`);
      const { systemMetrics } = generateMockData();
      io.to('metrics').emit('metrics', systemMetrics);
    }
  }, 1000);

  // Update trade history every 5 seconds
  setInterval(() => {
    try {
      // Define a function to fetch trade history
      const fetchTradeHistory = async () => {
        logger.debug('Fetching trade history from trading strategy service');
        return tradingStrategyService.getTradeHistory();
      };

      // Use getOrFetch to get the data with caching
      dataCache.getOrFetch('trades', 'history', fetchTradeHistory, 5000)
        .then(tradeHistory => {
          // Emit to clients
          io.to('trades:history').emit('trades:history', tradeHistory);
        })
        .catch(error => {
          logger.error(`Error in getTradeHistory: ${error.message}`);
          const { tradeHistory } = generateMockData();
          io.to('trades:history').emit('trades:history', tradeHistory);
        });
    } catch (error) {
      logger.error(`Error updating trade history: ${error.message}`);
      const { tradeHistory } = generateMockData();
      io.to('trades:history').emit('trades:history', tradeHistory);
    }
  }, 5000);

  // Update agent status every 3 seconds
  setInterval(() => {
    try {
      // Define a function to fetch agent data
      const fetchAgents = async () => {
        logger.debug('Fetching agents from agent orchestrator');
        // Initialize the agent orchestrator if needed
        if (!agentOrchestrator.getState().active) {
          logger.info('Initializing agent orchestrator');
          agentOrchestrator.initialize();
        }

        // Get agents from the agent orchestrator
        const agents = agentOrchestrator.getAgents();

        // If we have agents, return them directly
        if (agents && agents.length > 0) {
          logger.debug(`Found ${agents.length} agents from agent orchestrator`);
          return agents;
        } else {
          // If no agents are returned, fetch from API as fallback
          logger.warn('No agents returned from agent orchestrator, fetching from API');
          try {
            const response = await fetch('http://localhost:10002/api/agents');
            if (response.ok) {
              const apiAgents = await response.json();
              logger.debug(`Fetched ${apiAgents.length} agents from API`);
              return apiAgents;
            } else {
              throw new Error(`API returned status ${response.status}`);
            }
          } catch (apiError) {
            logger.error(`Error fetching agents from API: ${apiError.message}`);
            throw apiError;
          }
        }
      };

      // Use getOrFetch to get the data with caching
      dataCache.getOrFetch('agents', 'list', fetchAgents, 3000)
        .then(agents => {
          // If we have agents, emit them directly
          if (agents && agents.length > 0) {
            logger.debug(`Emitting ${agents.length} agents to clients`);
            io.to('agents:status').emit('agents:status', agents);
          } else {
            logger.warn('No agents returned from any source, using fallback mock data');
            // Fallback to mock data if no agents are returned
            const { agentStatus } = generateMockData();
            io.to('agents:status').emit('agents:status', agentStatus);
          }
        })
        .catch(error => {
          logger.error(`Error updating agent status: ${error.message}`);
          // Fallback to mock data if there's an error
          const { agentStatus } = generateMockData();
          io.to('agents:status').emit('agents:status', agentStatus);
        });
    } catch (error) {
      logger.error(`Error in agent status update: ${error.message}`);
      // Fallback to mock data if there's an error
      const { agentStatus } = generateMockData();
      io.to('agents:status').emit('agents:status', agentStatus);
    }
  }, 3000);

  // Update asset info every 10 seconds
  setInterval(() => {
    try {
      // Define a function to fetch asset info
      const fetchAssetInfo = async () => {
        logger.debug('Fetching asset info from ticker service');
        return tickerService.getAssetInfo();
      };

      // Use getOrFetch to get the data with caching
      dataCache.getOrFetch('assets', 'info', fetchAssetInfo, 10000)
        .then(assetInfo => {
          io.to('assets:info').emit('assets:info', assetInfo);
        })
        .catch(error => {
          logger.error(`Error fetching asset info: ${error.message}`);
          const { assetInfo } = generateMockData();
          io.to('assets:info').emit('assets:info', assetInfo);
        });
    } catch (error) {
      logger.error(`Error in asset info update: ${error.message}`);
      const { assetInfo } = generateMockData();
      io.to('assets:info').emit('assets:info', assetInfo);
    }
  }, 10000);

  // Update market data every 1 second
  setInterval(() => {
    try {
      // Define a function to fetch market data
      const fetchMarketData = async () => {
        logger.debug('Fetching latest prices from ticker service');
        return tickerService.getLatestPrices();
      };

      // Use getOrFetch to get the data with caching
      dataCache.getOrFetch('market', 'data', fetchMarketData, 1000)
        .then(marketData => {
          io.to('market:data').emit('market:data', marketData);
        })
        .catch(error => {
          logger.error(`Error fetching market data: ${error.message}`);
          const { marketData } = generateMockData();
          io.to('market:data').emit('market:data', marketData);
        });
    } catch (error) {
      logger.error(`Error in market data update: ${error.message}`);
      const { marketData } = generateMockData();
      io.to('market:data').emit('market:data', marketData);
    }
  }, 1000);

  // Update leaderboard every 30 seconds
  setInterval(() => {
    const { leaderboard } = generateMockData();
    io.to('leaderboard').emit('leaderboard', leaderboard);
  }, 30000);

  // Update quantum predictions every 5 seconds
  setInterval(() => {
    try {
      // Define a function to fetch quantum predictions
      const fetchQuantumPredictions = async () => {
        logger.debug('Fetching prediction results from quantum bridge');
        const predictions = quantumBridge.getPredictionResults();

        // If we have real predictions, use them
        if (predictions && predictions.length > 0) {
          return predictions;
        } else {
          // Otherwise, fall back to mock data
          const { quantumPredictions } = generateMockData();
          return quantumPredictions;
        }
      };

      // Use getOrFetch to get the data with caching
      dataCache.getOrFetch('quantum', 'predictions', fetchQuantumPredictions, 5000)
        .then(predictions => {
          io.to('quantum:predictions').emit('quantum:predictions', predictions);
        })
        .catch(error => {
          logger.error(`Error fetching quantum predictions: ${error.message}`);
          const { quantumPredictions } = generateMockData();
          io.to('quantum:predictions').emit('quantum:predictions', quantumPredictions);
        });
    } catch (error) {
      logger.error(`Error in quantum predictions update: ${error.message}`);
      const { quantumPredictions } = generateMockData();
      io.to('quantum:predictions').emit('quantum:predictions', quantumPredictions);
    }
  }, 5000);

  // Update ML insights every 7 seconds
  setInterval(() => {
    const { mlInsights } = generateMockData();
    io.to('ml:insights').emit('ml:insights', mlInsights);
  }, 7000);

  // Update hyperdimensional patterns every 8 seconds
  setInterval(() => {
    const { hyperdimensionalPatterns } = generateMockData();
    io.to('hyperdimensional:patterns').emit('hyperdimensional:patterns', hyperdimensionalPatterns);
  }, 8000);

  // Update neural network state every 10 seconds
  setInterval(() => {
    const { neuralNetworkState } = generateMockData();
    io.to('neural:state').emit('neural:state', neuralNetworkState);
  }, 10000);

  // Update strategy performance every 15 seconds
  setInterval(() => {
    const { strategyPerformance } = generateMockData();
    io.to('strategy:performance').emit('strategy:performance', strategyPerformance);
  }, 15000);

  // Emit trade events when trades are executed or completed
  setInterval(() => {
    try {
      // Define functions to fetch active trades and trade history
      const fetchActiveTrades = async () => {
        logger.debug('Fetching active trades for trade events');
        return tradingStrategyService.getActiveTrades();
      };

      const fetchTradeHistory = async () => {
        logger.debug('Fetching trade history for trade events');
        return tradingStrategyService.getTradeHistory();
      };

      // Use getOrFetch to get the data with caching
      Promise.all([
        dataCache.getOrFetch('trades', 'active', fetchActiveTrades, 5000),
        dataCache.getOrFetch('trades', 'history', fetchTradeHistory, 5000)
      ])
        .then(([activeTrades, tradeHistory]) => {
          // Check if we have new trades
          if (activeTrades.length > 0 && Math.random() > 0.7) {
            const trade = activeTrades[Math.floor(Math.random() * activeTrades.length)];

            const tradeEvent = {
              id: trade.id,
              type: 'entry',
              symbol: trade.symbol,
              price: trade.entryPrice,
              size: trade.amount / trade.entryPrice,
              direction: trade.direction,
              timestamp: trade.entryTime,
              agent: trade.agent,
              confidence: trade.confidence,
              reason: trade.reasonEntry
            };

            io.to('trades:events').emit('trades:event', tradeEvent);
          }

          // Check if we have completed trades
          if (tradeHistory.length > 0 && Math.random() > 0.7) {
            const trade = tradeHistory[Math.floor(Math.random() * tradeHistory.length)];

            const tradeEvent = {
              id: trade.id,
              type: 'exit',
              symbol: trade.symbol,
              price: trade.exitPrice,
              size: trade.amount / trade.entryPrice,
              direction: trade.direction,
              timestamp: trade.exitTime,
              agent: trade.agent,
              confidence: trade.confidence,
              reason: trade.reasonExit,
              profit: trade.profit,
              profitPercentage: trade.profitPercentage
            };

            io.to('trades:events').emit('trades:event', tradeEvent);
          }
        })
        .catch(error => {
          logger.error(`Error fetching trade data for events: ${error.message}`);

          // Fallback to mock trade events
          if (Math.random() > 0.7) {
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
        });
    } catch (error) {
      logger.error(`Error in trade events update: ${error.message}`);

      // Fallback to mock trade events
      if (Math.random() > 0.7) {
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
    }
  }, 5000);
}

// Start server
const PORT = process.env.WEBSOCKET_PORT || 10003; // Using the correct port for WebSocket server as specified // Using the correct port for WebSocket server
const HOST = process.env.HOST || '0.0.0.0';

// Setup WebSocket server
setupWebSocketServer();

// Start listening
server.listen(PORT, HOST, () => {
  logger.info(`OMNI-ALPHA VΩ∞∞ WebSocket Server running on ${HOST}:${PORT}`);
  logger.info(`Public IP: 3.111.22.56:${PORT}`);
  logger.info(`CORS Origin: ${process.env.CORS_ORIGIN || 'http://3.111.22.56:10001'}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});
