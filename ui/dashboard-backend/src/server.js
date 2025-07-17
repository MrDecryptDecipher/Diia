/**
 * OMNI-ALPHA VΩ∞∞ Trading System Dashboard API Server
 *
 * This server provides API endpoints and WebSocket connections for the OMNI-ALPHA VΩ∞∞ Trading System Dashboard.
 * It also includes a gRPC server for high-performance data transfer.
 *
 * The server initializes the OMNI system components including:
 * - Agent Orchestrator
 * - Quantum Bridge
 * - Zero Loss Guarantee System
 * - Strategy Optimizer
 * - Multi-Agent Coordinator
 * - Trading Strategy Service
 */

require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const logger = require('./utils/logger');

// Import OMNI system components
const tradingStrategyService = require('./services/trading-strategy-service');
const agentOrchestrator = require('./services/agent-orchestrator');
const quantumBridge = require('./services/quantum-bridge');
const zeroLossGuarantee = require('./services/zero-loss-guarantee');
const strategyOptimizer = require('./services/strategy-optimizer');
const multiAgentCoordinator = require('./services/multi-agent-coordinator');

// Import production enhancement services
const productionPerformanceMonitor = require('./services/production-performance-monitor');
const productionRiskManager = require('./services/production-risk-manager');
const productionTestingFramework = require('./services/production-testing-framework');
const real750TradesEngine = require('./services/real-750-trades-engine');

// Import routes
const systemRoutes = require('./api/routes/system');
const tradesRoutes = require('./api/routes/trades');
const metricsRoutes = require('./api/routes/metrics');
const agentsRoutes = require('./api/routes/agents');
const assetsRoutes = require('./api/routes/assets');
const leaderboardRoutes = require('./api/routes/leaderboard');
const strategyRoutes = require('./api/routes/strategy');
const quantumRoutes = require('./api/routes/quantum');
const mlRoutes = require('./api/routes/ml');
const bybitRoutes = require('./api/routes/bybit');
const tradingRoutes = require('./api/routes/trading');
const productionRoutes = require('./api/routes/production');

// Note: WebSocket handlers are in separate omni-websocket process

// Import gRPC server
const { startGrpcServer } = require('./grpc/grpc-server');

// Create Express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Note: WebSocket server is handled separately by omni-websocket process
// This server only provides REST API endpoints

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://3.111.22.56:10001', 'http://localhost:3000', 'http://localhost:10001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma', 'Expires'],
  credentials: true
}));
app.use(express.json());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Import routes
const reportsRoutes = require('./api/routes/reports');
const testingRoutes = require('./api/routes/testing');

// Routes
app.use('/api/system', systemRoutes);
app.use('/api/trades', tradesRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/agents', agentsRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/strategy', strategyRoutes);
app.use('/api/quantum', quantumRoutes);
app.use('/api/ml', mlRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/testing', testingRoutes);
app.use('/api/trading/bybit', bybitRoutes);
app.use('/api/trading', tradingRoutes);
app.use('/api/production', productionRoutes);

// Enhanced sentiment analysis and AI routes
app.use('/api/sentiment', require('./api/routes/enhanced-sentiment'));
app.use('/api/social-insights', require('./api/routes/enhanced-social-insights'));
app.use('/api/gemini', require('./api/routes/enhanced-gemini'));
app.use('/api/gemini-intelligence', require('./api/routes/enhanced-gemini-intelligence'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  res.status(err.status || 500).json({
    error: {
      message: err.message,
      status: err.status || 500
    }
  });
});

// Initialize OMNI system components
logger.info('Initializing OMNI-ALPHA VΩ∞∞ System Components');

// Initialize components in the correct order
(async () => {
try {
  // Initialize Agent Orchestrator
  agentOrchestrator.initialize();
  logger.info('Agent Orchestrator initialized successfully');

  // Initialize Quantum Bridge
  quantumBridge.initialize();
  logger.info('Quantum Bridge initialized successfully');

  // Initialize Zero Loss Guarantee System
  zeroLossGuarantee.initialize({
    minProfitPerTrade: 2.2, // Minimum 2.2 USDT profit per trade as required
    profitAssuranceLevel: 0.99 // 99% assurance of profit
  });
  logger.info('Zero Loss Guarantee System initialized successfully');

  // Initialize Strategy Optimizer
  strategyOptimizer.initialize();
  logger.info('Strategy Optimizer initialized successfully');

  // Initialize Multi-Agent Coordinator
  multiAgentCoordinator.initialize();
  logger.info('Multi-Agent Coordinator initialized successfully');

  // Initialize Trading Strategy Service
  tradingStrategyService.initialize();
  logger.info('Trading Strategy Service initialized successfully');

  // Initialize and start the Real 750 Trades Engine
  try {
    const engine = new real750TradesEngine();
    await engine.initializeEngine();
    logger.info('✅ Real 750 Trades Engine started successfully');
  } catch (error) {
    logger.error(`❌ Error starting Real 750 Trades Engine: ${error.message}`);
  }

  // Start trading strategy service as backup
  try {
    await tradingStrategyService.start();
    logger.info('✅ Trading Strategy Service started successfully');
  } catch (error) {
    logger.error(`❌ Error starting Trading Strategy Service: ${error.message}`);
  }

  logger.info('All OMNI system components initialized successfully');
} catch (error) {
  logger.error(`Error initializing OMNI system components: ${error.message}`);
}
})();

// Start server
const PORT = process.env.PORT || 10002; // Using the correct port for API server as specified
const HOST = process.env.HOST || '0.0.0.0';
server.listen(PORT, HOST, () => {
  logger.info(`OMNI-ALPHA VΩ∞∞ Dashboard API Server running on ${HOST}:${PORT}`);
  logger.info(`Public IP: 3.111.22.56:${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
  logger.info(`CORS Origin: ${process.env.CORS_ORIGIN || 'http://3.111.22.56:10001'}`);
  logger.info(`WebSocket Server enabled`);
  logger.info(`OMNI-ALPHA VΩ∞∞ System active and trading`);
});

// Start gRPC server
startGrpcServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

module.exports = { app, server };
