/**
 * gRPC Server for OMNI-ALPHA VΩ∞∞ Trading System Dashboard
 * 
 * This module sets up the gRPC server for high-performance data transfer.
 * It provides bidirectional streaming for real-time updates.
 */

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const logger = require('../utils/logger');
const { generateMockData } = require('../utils/mock-data-generator');

// Define proto path
const PROTO_PATH = path.join(__dirname, 'protos/dashboard.proto');

// Load proto file
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

// Load proto definition
const dashboardProto = grpc.loadPackageDefinition(packageDefinition).dashboard;

// Implement service methods
const systemStatus = (call) => {
  logger.info('Client connected to systemStatus stream');
  
  // Send initial data
  const { systemStatus } = generateMockData();
  call.write(systemStatus);
  
  // Send periodic updates
  const interval = setInterval(() => {
    const { systemStatus } = generateMockData();
    call.write(systemStatus);
  }, 5000);
  
  // Handle client disconnect
  call.on('cancelled', () => {
    logger.info('Client disconnected from systemStatus stream');
    clearInterval(interval);
  });
};

const activeTrades = (call) => {
  logger.info('Client connected to activeTrades stream');
  
  // Send initial data
  const { activeTrades } = generateMockData();
  call.write({ trades: activeTrades });
  
  // Send periodic updates
  const interval = setInterval(() => {
    const { activeTrades } = generateMockData();
    call.write({ trades: activeTrades });
  }, 2000);
  
  // Handle client disconnect
  call.on('cancelled', () => {
    logger.info('Client disconnected from activeTrades stream');
    clearInterval(interval);
  });
};

const metrics = (call) => {
  logger.info('Client connected to metrics stream');
  
  // Send initial data
  const { systemMetrics } = generateMockData();
  call.write(systemMetrics);
  
  // Send periodic updates
  const interval = setInterval(() => {
    const { systemMetrics } = generateMockData();
    call.write(systemMetrics);
  }, 1000);
  
  // Handle client disconnect
  call.on('cancelled', () => {
    logger.info('Client disconnected from metrics stream');
    clearInterval(interval);
  });
};

const agentStatus = (call) => {
  logger.info('Client connected to agentStatus stream');
  
  // Send initial data
  const { agentStatus } = generateMockData();
  call.write({ agents: agentStatus });
  
  // Send periodic updates
  const interval = setInterval(() => {
    const { agentStatus } = generateMockData();
    call.write({ agents: agentStatus });
  }, 3000);
  
  // Handle client disconnect
  call.on('cancelled', () => {
    logger.info('Client disconnected from agentStatus stream');
    clearInterval(interval);
  });
};

const assetInfo = (call) => {
  logger.info('Client connected to assetInfo stream');
  
  // Send initial data
  const { assetInfo } = generateMockData();
  call.write({ assets: assetInfo });
  
  // Send periodic updates
  const interval = setInterval(() => {
    const { assetInfo } = generateMockData();
    call.write({ assets: assetInfo });
  }, 10000);
  
  // Handle client disconnect
  call.on('cancelled', () => {
    logger.info('Client disconnected from assetInfo stream');
    clearInterval(interval);
  });
};

const leaderboard = (call) => {
  logger.info('Client connected to leaderboard stream');
  
  // Send initial data
  const { leaderboard } = generateMockData();
  call.write({ assets: leaderboard });
  
  // Send periodic updates
  const interval = setInterval(() => {
    const { leaderboard } = generateMockData();
    call.write({ assets: leaderboard });
  }, 30000);
  
  // Handle client disconnect
  call.on('cancelled', () => {
    logger.info('Client disconnected from leaderboard stream');
    clearInterval(interval);
  });
};

const quantumPredictions = (call) => {
  logger.info('Client connected to quantumPredictions stream');
  
  // Send initial data
  const { quantumPredictions } = generateMockData();
  call.write({ predictions: quantumPredictions });
  
  // Send periodic updates
  const interval = setInterval(() => {
    const { quantumPredictions } = generateMockData();
    call.write({ predictions: quantumPredictions });
  }, 5000);
  
  // Handle client disconnect
  call.on('cancelled', () => {
    logger.info('Client disconnected from quantumPredictions stream');
    clearInterval(interval);
  });
};

// Start gRPC server
function startGrpcServer() {
  // Create directory for proto files
  const fs = require('fs');
  const protoDir = path.join(__dirname, 'protos');
  if (!fs.existsSync(protoDir)) {
    fs.mkdirSync(protoDir, { recursive: true });
  }
  
  // Create proto file
  const protoContent = `syntax = "proto3";

package dashboard;

service Dashboard {
  rpc SystemStatus (Empty) returns (stream SystemStatusResponse) {}
  rpc ActiveTrades (Empty) returns (stream ActiveTradesResponse) {}
  rpc Metrics (Empty) returns (stream MetricsResponse) {}
  rpc AgentStatus (Empty) returns (stream AgentStatusResponse) {}
  rpc AssetInfo (Empty) returns (stream AssetInfoResponse) {}
  rpc Leaderboard (Empty) returns (stream LeaderboardResponse) {}
  rpc QuantumPredictions (Empty) returns (stream QuantumPredictionsResponse) {}
}

message Empty {}

message SystemStatusResponse {
  string status = 1;
  int32 uptime = 2;
  string version = 3;
  string mode = 4;
  string lastUpdate = 5;
  repeated string connectedExchanges = 6;
  int32 activeAgents = 7;
  int32 activeTrades = 8;
  int32 pendingTrades = 9;
  string systemLoad = 10;
  string memoryUsage = 11;
  string cpuUsage = 12;
  string diskUsage = 13;
  string networkLatency = 14;
  int32 apiCallsRemaining = 15;
  string nextMaintenance = 16;
}

message Trade {
  string id = 1;
  string symbol = 2;
  string direction = 3;
  double entryPrice = 4;
  double currentPrice = 5;
  double stopLossPrice = 6;
  double takeProfitPrice = 7;
  int32 leverage = 8;
  double positionSize = 9;
  double pnl = 10;
  double pnlPercentage = 11;
  string entryTime = 12;
  string exitTime = 13;
  string status = 14;
  string agent = 15;
  string strategy = 16;
  double confidence = 17;
  double riskScore = 18;
  double opportunityScore = 19;
  double winProbability = 20;
  string reasonEntry = 21;
  string reasonExit = 22;
}

message ActiveTradesResponse {
  repeated Trade trades = 1;
}

message MetricsResponse {
  double initialCapital = 1;
  double currentCapital = 2;
  double pnl = 3;
  double pnlPercentage = 4;
  int32 totalTrades = 5;
  int32 winningTrades = 6;
  int32 losingTrades = 7;
  double winRate = 8;
  double averageProfitPerTrade = 9;
  double averageLossPerTrade = 10;
  double maxDrawdown = 11;
  double sharpeRatio = 12;
  double sortinoRatio = 13;
  double calmarRatio = 14;
  double volatility = 15;
  double bestTrade = 16;
  double worstTrade = 17;
  string averageTradeHoldingTime = 18;
  string tradingFrequency = 19;
  double profitFactor = 20;
  double expectancy = 21;
  double systemEfficiency = 22;
  double capitalUtilization = 23;
  double riskRewardRatio = 24;
  double quantumPredictionAccuracy = 25;
  double hyperdimensionalPatternAccuracy = 26;
  double zeroLossEnforcementEfficiency = 27;
  int32 godKernelEvolutionStage = 28;
  double antiLossHedgingEfficiency = 29;
}

message Agent {
  string id = 1;
  string name = 2;
  string type = 3;
  string color = 4;
  string status = 5;
  double confidence = 6;
  double accuracy = 7;
  double efficiency = 8;
  int32 evolutionStage = 9;
  string lastAction = 10;
  string lastActionTime = 11;
  string processingPower = 12;
  string memoryUsage = 13;
  int32 connections = 14;
  double learningRate = 15;
  double mutationRate = 16;
}

message AgentStatusResponse {
  repeated Agent agents = 1;
}

message Asset {
  string id = 1;
  string symbol = 2;
  string name = 3;
  string color = 4;
  double price = 5;
  double change24h = 6;
  double volume24h = 7;
  double marketCap = 8;
  int32 rank = 9;
  double quantumScore = 10;
  double sentimentScore = 11;
  double technicalScore = 12;
  double volatilityScore = 13;
  double trendStrength = 14;
  string predictedDirection = 15;
  double predictedPriceChange = 16;
  double opportunityScore = 17;
  double riskScore = 18;
  double tradingVolume = 19;
  double liquidityScore = 20;
}

message AssetInfoResponse {
  repeated Asset assets = 1;
}

message LeaderboardResponse {
  repeated Asset assets = 1;
}

message QuantumPrediction {
  string id = 1;
  string symbol = 2;
  string timeframe = 3;
  double currentPrice = 4;
  double predictedPrice = 5;
  double confidence = 6;
  string direction = 7;
  double probability = 8;
  string method = 9;
  string timestamp = 10;
  repeated double quantumStates = 11;
  double entanglementScore = 12;
  double coherenceScore = 13;
  double interferencePattern = 14;
  double quantumAdvantage = 15;
}

message QuantumPredictionsResponse {
  repeated QuantumPrediction predictions = 1;
}`;
  
  fs.writeFileSync(path.join(protoDir, 'dashboard.proto'), protoContent);
  
  // Create server
  const server = new grpc.Server();
  
  // Add service
  server.addService(dashboardProto.Dashboard.service, {
    systemStatus,
    activeTrades,
    metrics,
    agentStatus,
    assetInfo,
    leaderboard,
    quantumPredictions
  });
  
  // Start server
  const GRPC_PORT = process.env.GRPC_PORT || 10004;
  const GRPC_HOST = process.env.HOST || '0.0.0.0';
  server.bindAsync(`${GRPC_HOST}:${GRPC_PORT}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) {
      logger.error(`Failed to start gRPC server: ${err}`);
      return;
    }
    server.start();
    logger.info(`gRPC server running on ${GRPC_HOST}:${GRPC_PORT}`);
  });
}

module.exports = {
  startGrpcServer
};
