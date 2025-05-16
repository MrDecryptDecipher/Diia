/**
 * Mock Data Generator for OMNI-ALPHA VΩ∞∞ Trading System WebSocket Server
 * 
 * This module provides functions to generate mock data for the WebSocket server.
 */

const logger = require('../utils/logger');

/**
 * Generate mock data for the WebSocket server
 * @returns {Object} - Mock data
 */
function generateMockData() {
  return {
    systemStatus: generateMockSystemStatus(),
    activeTrades: generateMockActiveTrades(),
    tradeHistory: generateMockTradeHistory(),
    systemMetrics: generateMockSystemMetrics(),
    agentStatus: generateMockAgentStatus(),
    assetInfo: generateMockAssetInfo(),
    leaderboard: generateMockLeaderboard(),
    quantumPredictions: generateMockQuantumPredictions(),
    mlInsights: generateMockMlInsights(),
    hyperdimensionalPatterns: generateMockHyperdimensionalPatterns(),
    neuralNetworkState: generateMockNeuralNetworkState(),
    strategyPerformance: generateMockStrategyPerformance()
  };
}

/**
 * Generate mock system status
 * @returns {Object} - Mock system status
 */
function generateMockSystemStatus() {
  return {
    status: 'active',
    uptime: Math.floor(Math.random() * 86400) + 3600,
    version: '1.0.0',
    lastUpdate: new Date().toISOString(),
    components: {
      api: {
        status: 'active',
        health: 100,
        lastError: null
      },
      websocket: {
        status: 'active',
        health: 100,
        lastError: null
      },
      database: {
        status: 'active',
        health: 100,
        lastError: null
      },
      trading: {
        status: 'active',
        health: 100,
        lastError: null
      },
      quantum: {
        status: 'active',
        health: 100,
        lastError: null
      }
    },
    performance: {
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      disk: Math.random() * 100,
      network: Math.random() * 100
    },
    alerts: []
  };
}

/**
 * Generate mock active trades
 * @returns {Array} - Mock active trades
 */
function generateMockActiveTrades() {
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

/**
 * Generate mock trade history
 * @returns {Array} - Mock trade history
 */
function generateMockTradeHistory() {
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

/**
 * Generate mock system metrics
 * @returns {Object} - Mock system metrics
 */
function generateMockSystemMetrics() {
  return {
    capital: 12 + Math.random() * 10,
    equity: 12 + Math.random() * 15,
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

/**
 * Generate mock agent status
 * @returns {Array} - Mock agent status
 */
function generateMockAgentStatus() {
  return Array.from({ length: 10 }, (_, i) => {
    const agentTypes = [
      'QuantumPredictor',
      'ZeroLossEnforcer',
      'HyperdimensionalPatternRecognizer',
      'NeuralNetworkPredictor',
      'MarketRegimeDetector',
      'VolatilityAnalyzer',
      'OrderBookAnalyzer',
      'TrendAnalyzer',
      'CandlestickAnalyzer',
      'SentimentAnalyzer'
    ];
    
    const agentGroups = [
      'prediction',
      'risk',
      'analysis',
      'execution',
      'coordination'
    ];
    
    return {
      id: `agent-${i}`,
      name: agentTypes[i],
      group: agentGroups[i % 5],
      status: 'active',
      lastActive: new Date(Date.now() - Math.random() * 60000).toISOString(),
      performance: {
        accuracy: 80 + Math.random() * 15,
        efficiency: 70 + Math.random() * 25,
        latency: Math.random() * 100,
        utilization: 60 + Math.random() * 30
      },
      metrics: {
        executionCount: Math.floor(Math.random() * 1000),
        successRate: 80 + Math.random() * 15,
        averageExecutionTime: Math.random() * 100,
        errorRate: Math.random() * 5
      },
      connections: Math.floor(Math.random() * 10) + 5
    };
  });
}

/**
 * Generate mock asset info
 * @returns {Array} - Mock asset info
 */
function generateMockAssetInfo() {
  return [
    'BTCUSDT',
    'ETHUSDT',
    'SOLUSDT',
    'BNBUSDT',
    'DOGEUSDT',
    'XRPUSDT',
    'ADAUSDT',
    'DOTUSDT',
    'LTCUSDT',
    'LINKUSDT'
  ].map(symbol => {
    const basePrice = {
      'BTCUSDT': 60000,
      'ETHUSDT': 3000,
      'SOLUSDT': 100,
      'BNBUSDT': 500,
      'DOGEUSDT': 0.1,
      'XRPUSDT': 0.5,
      'ADAUSDT': 0.4,
      'DOTUSDT': 10,
      'LTCUSDT': 100,
      'LINKUSDT': 15
    }[symbol];
    
    const price = basePrice + (Math.random() * basePrice * 0.02 - basePrice * 0.01);
    const volume = Math.random() * 1000000 + 100000;
    const change = Math.random() * 10 - 5;
    
    return {
      symbol,
      price,
      volume,
      change,
      high24h: price * (1 + Math.random() * 0.05),
      low24h: price * (1 - Math.random() * 0.05),
      volatility: Math.random() * 5,
      liquidity: Math.random() * 100,
      sentiment: Math.random() * 100,
      prediction: {
        direction: Math.random() > 0.5 ? 'up' : 'down',
        confidence: 70 + Math.random() * 25,
        timeframe: ['1m', '5m', '15m', '1h', '4h'][Math.floor(Math.random() * 5)]
      },
      tradingSignals: {
        quantum: Math.random() > 0.5 ? 'buy' : 'sell',
        neural: Math.random() > 0.5 ? 'buy' : 'sell',
        hyperdimensional: Math.random() > 0.5 ? 'buy' : 'sell',
        technical: Math.random() > 0.5 ? 'buy' : 'sell'
      }
    };
  });
}

/**
 * Generate mock leaderboard
 * @returns {Array} - Mock leaderboard
 */
function generateMockLeaderboard() {
  return Array.from({ length: 10 }, (_, i) => {
    const strategies = [
      'ZeroLossStrategy',
      'QuantumPredictorStrategy',
      'HyperdimensionalPatternStrategy',
      'NeuralNetworkStrategy',
      'MarketRegimeStrategy',
      'VolatilityStrategy',
      'OrderBookStrategy',
      'TrendStrategy',
      'CandlestickStrategy',
      'SentimentStrategy'
    ];
    
    return {
      id: `strategy-${i}`,
      name: strategies[i],
      rank: i + 1,
      profit: 100 - i * 5 + Math.random() * 10,
      winRate: 95 - i * 2 + Math.random() * 5,
      trades: 100 + Math.floor(Math.random() * 100),
      profitFactor: 3 - i * 0.2 + Math.random(),
      sharpeRatio: 2.5 - i * 0.1 + Math.random(),
      maxDrawdown: i + Math.random() * 2,
      averageProfitPerTrade: 2.5 - i * 0.1 + Math.random() * 0.5,
      averageLossPerTrade: 0.1 + i * 0.05 + Math.random() * 0.1
    };
  });
}

/**
 * Generate mock quantum predictions
 * @returns {Array} - Mock quantum predictions
 */
function generateMockQuantumPredictions() {
  return Array.from({ length: 5 }, (_, i) => {
    const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'DOGEUSDT'];
    const timeframes = ['1m', '5m', '15m', '1h', '4h'];
    
    return {
      id: `prediction-${i}`,
      symbol: symbols[i],
      timeframe: timeframes[i],
      direction: Math.random() > 0.5 ? 'up' : 'down',
      confidence: 70 + Math.random() * 25,
      magnitude: Math.random() * 5,
      timestamp: new Date(Date.now() - Math.random() * 60000).toISOString(),
      expiresAt: new Date(Date.now() + Math.random() * 3600000).toISOString(),
      status: 'active',
      source: 'quantum-simulator',
      dimensions: Math.floor(Math.random() * 64) + 64,
      entanglement: Math.random() * 100,
      coherence: Math.random() * 100,
      qubits: Math.floor(Math.random() * 32) + 16
    };
  });
}

/**
 * Generate mock ML insights
 * @returns {Array} - Mock ML insights
 */
function generateMockMlInsights() {
  return Array.from({ length: 5 }, (_, i) => {
    const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'DOGEUSDT'];
    const timeframes = ['1m', '5m', '15m', '1h', '4h'];
    const insightTypes = ['trend', 'reversal', 'breakout', 'consolidation', 'volatility'];
    
    return {
      id: `insight-${i}`,
      symbol: symbols[i],
      timeframe: timeframes[i],
      type: insightTypes[i],
      direction: Math.random() > 0.5 ? 'up' : 'down',
      confidence: 70 + Math.random() * 25,
      timestamp: new Date(Date.now() - Math.random() * 60000).toISOString(),
      expiresAt: new Date(Date.now() + Math.random() * 3600000).toISOString(),
      status: 'active',
      source: 'neural-network',
      features: Math.floor(Math.random() * 64) + 64,
      layers: Math.floor(Math.random() * 8) + 4,
      neurons: Math.floor(Math.random() * 128) + 64,
      accuracy: 80 + Math.random() * 15
    };
  });
}

/**
 * Generate mock hyperdimensional patterns
 * @returns {Array} - Mock hyperdimensional patterns
 */
function generateMockHyperdimensionalPatterns() {
  return Array.from({ length: 5 }, (_, i) => {
    const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'DOGEUSDT'];
    const timeframes = ['1m', '5m', '15m', '1h', '4h'];
    const patternTypes = ['fractal', 'harmonic', 'elliot', 'fibonacci', 'gann'];
    
    return {
      id: `pattern-${i}`,
      symbol: symbols[i],
      timeframe: timeframes[i],
      type: patternTypes[i],
      direction: Math.random() > 0.5 ? 'up' : 'down',
      confidence: 70 + Math.random() * 25,
      timestamp: new Date(Date.now() - Math.random() * 60000).toISOString(),
      expiresAt: new Date(Date.now() + Math.random() * 3600000).toISOString(),
      status: 'active',
      source: 'hyperdimensional-computer',
      dimensions: Math.floor(Math.random() * 128) + 128,
      vectors: Math.floor(Math.random() * 1024) + 1024,
      similarity: 80 + Math.random() * 15,
      complexity: Math.floor(Math.random() * 10) + 1
    };
  });
}

/**
 * Generate mock neural network state
 * @returns {Object} - Mock neural network state
 */
function generateMockNeuralNetworkState() {
  return {
    status: 'active',
    layers: Math.floor(Math.random() * 8) + 4,
    neurons: Math.floor(Math.random() * 128) + 64,
    connections: Math.floor(Math.random() * 1024) + 1024,
    activationFunction: ['relu', 'sigmoid', 'tanh', 'leaky_relu'][Math.floor(Math.random() * 4)],
    learningRate: 0.001 + Math.random() * 0.01,
    epochs: Math.floor(Math.random() * 1000) + 100,
    batchSize: Math.floor(Math.random() * 64) + 16,
    accuracy: 80 + Math.random() * 15,
    loss: Math.random() * 0.1,
    lastTraining: new Date(Date.now() - Math.random() * 3600000).toISOString(),
    nextTraining: new Date(Date.now() + Math.random() * 3600000).toISOString(),
    predictions: Array.from({ length: 5 }, (_, i) => {
      const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'DOGEUSDT'];
      
      return {
        symbol: symbols[i],
        direction: Math.random() > 0.5 ? 'up' : 'down',
        confidence: 70 + Math.random() * 25,
        timeframe: ['1m', '5m', '15m', '1h', '4h'][Math.floor(Math.random() * 5)]
      };
    })
  };
}

/**
 * Generate mock strategy performance
 * @returns {Array} - Mock strategy performance
 */
function generateMockStrategyPerformance() {
  return Array.from({ length: 5 }, (_, i) => {
    const strategies = [
      'ZeroLossStrategy',
      'QuantumPredictorStrategy',
      'HyperdimensionalPatternStrategy',
      'NeuralNetworkStrategy',
      'MarketRegimeStrategy'
    ];
    
    return {
      id: `strategy-${i}`,
      name: strategies[i],
      profit: 100 - i * 5 + Math.random() * 10,
      winRate: 95 - i * 2 + Math.random() * 5,
      trades: 100 + Math.floor(Math.random() * 100),
      profitFactor: 3 - i * 0.2 + Math.random(),
      sharpeRatio: 2.5 - i * 0.1 + Math.random(),
      maxDrawdown: i + Math.random() * 2,
      averageProfitPerTrade: 2.5 - i * 0.1 + Math.random() * 0.5,
      averageLossPerTrade: 0.1 + i * 0.05 + Math.random() * 0.1,
      status: 'active',
      lastTrade: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      nextTrade: new Date(Date.now() + Math.random() * 3600000).toISOString(),
      symbols: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'DOGEUSDT'].slice(0, Math.floor(Math.random() * 5) + 1),
      timeframes: ['1m', '5m', '15m', '1h', '4h'].slice(0, Math.floor(Math.random() * 5) + 1)
    };
  });
}

module.exports = {
  generateMockData,
  generateMockSystemStatus,
  generateMockActiveTrades,
  generateMockTradeHistory,
  generateMockSystemMetrics,
  generateMockAgentStatus,
  generateMockAssetInfo,
  generateMockLeaderboard,
  generateMockQuantumPredictions,
  generateMockMlInsights,
  generateMockHyperdimensionalPatterns,
  generateMockNeuralNetworkState,
  generateMockStrategyPerformance
};
