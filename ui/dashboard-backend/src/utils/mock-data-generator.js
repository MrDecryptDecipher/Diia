/**
 * Mock Data Generator for OMNI-ALPHA VΩ∞∞ Trading System
 *
 * This module provides functions to generate mock data for testing and development.
 * In production, this will be replaced with real data from Bybit.
 */

const logger = require('./logger');

/**
 * Generate mock ticker data
 * @param {string} symbol - Trading symbol (e.g., BTCUSDT)
 * @returns {Object} - Mock ticker data
 */
function generateMockTicker(symbol = 'BTCUSDT') {
  const basePrice = getBasePrice(symbol);
  const variance = basePrice * 0.001; // 0.1% variance
  const lastPrice = basePrice + (Math.random() * variance * 2 - variance);

  return {
    symbol,
    lastPrice: lastPrice.toFixed(2),
    bidPrice: (lastPrice - Math.random() * 10).toFixed(2),
    askPrice: (lastPrice + Math.random() * 10).toFixed(2),
    volume24h: (Math.random() * 10000 + 5000).toFixed(2),
    highPrice24h: (lastPrice + Math.random() * 100).toFixed(2),
    lowPrice24h: (lastPrice - Math.random() * 100).toFixed(2),
    timestamp: Date.now()
  };
}

/**
 * Generate mock order book data
 * @param {string} symbol - Trading symbol (e.g., BTCUSDT)
 * @returns {Object} - Mock order book data
 */
function generateMockOrderBook(symbol = 'BTCUSDT') {
  const basePrice = getBasePrice(symbol);
  const bids = [];
  const asks = [];

  // Generate 20 bid levels
  for (let i = 0; i < 20; i++) {
    const price = basePrice - (i * basePrice * 0.0001);
    const size = Math.random() * 10 + 0.1;
    bids.push([price.toFixed(2), size.toFixed(4)]);
  }

  // Generate 20 ask levels
  for (let i = 0; i < 20; i++) {
    const price = basePrice + (i * basePrice * 0.0001);
    const size = Math.random() * 10 + 0.1;
    asks.push([price.toFixed(2), size.toFixed(4)]);
  }

  return {
    symbol,
    bids,
    asks,
    timestamp: Date.now()
  };
}

/**
 * Generate mock trade data
 * @param {string} symbol - Trading symbol (e.g., BTCUSDT)
 * @returns {Object} - Mock trade data
 */
function generateMockTrade(symbol = 'BTCUSDT') {
  const basePrice = getBasePrice(symbol);
  const variance = basePrice * 0.001; // 0.1% variance
  const price = basePrice + (Math.random() * variance * 2 - variance);
  const size = Math.random() * 1 + 0.01;

  return {
    symbol,
    price: price.toFixed(2),
    size: size.toFixed(4),
    side: Math.random() > 0.5 ? 'buy' : 'sell',
    timestamp: Date.now()
  };
}

/**
 * Generate mock kline data
 * @param {string} symbol - Trading symbol (e.g., BTCUSDT)
 * @param {string} interval - Kline interval (e.g., 1m, 5m, 1h)
 * @param {number} count - Number of klines to generate
 * @returns {Array} - Array of mock kline data
 */
function generateMockKlines(symbol = 'BTCUSDT', interval = '1m', count = 100) {
  const basePrice = getBasePrice(symbol);
  const klines = [];
  const intervalMs = getIntervalMs(interval);

  let currentTime = Date.now() - (intervalMs * count);
  let currentPrice = basePrice;

  for (let i = 0; i < count; i++) {
    const variance = currentPrice * 0.005; // 0.5% variance
    const open = currentPrice;
    const close = currentPrice + (Math.random() * variance * 2 - variance);
    const high = Math.max(open, close) + Math.random() * variance;
    const low = Math.min(open, close) - Math.random() * variance;
    const volume = Math.random() * 100 + 10;

    klines.push({
      symbol,
      interval,
      startTime: currentTime,
      endTime: currentTime + intervalMs,
      open: open.toFixed(2),
      high: high.toFixed(2),
      low: low.toFixed(2),
      close: close.toFixed(2),
      volume: volume.toFixed(2)
    });

    currentTime += intervalMs;
    currentPrice = close;
  }

  return klines;
}

/**
 * Generate mock wallet balance data
 * @returns {Object} - Mock wallet balance data
 */
function generateMockWalletBalance() {
  return {
    retCode: 0,
    retMsg: 'OK',
    result: {
      list: [
        {
          totalEquity: '112.00',
          accountIMRate: '0.00',
          totalMarginBalance: '112.00',
          totalInitialMargin: '0.00',
          accountType: 'UNIFIED',
          totalAvailableBalance: '112.00',
          accountMMRate: '0.00',
          totalPerpUPL: '0.00',
          totalWalletBalance: '112.00',
          accountLTV: '0.00',
          totalMaintenanceMargin: '0.00',
          coin: [
            {
              availableToBorrow: '0.00',
              bonus: '0.00',
              accruedInterest: '0.00',
              availableToWithdraw: '112.00',
              totalOrderIM: '0.00',
              equity: '112.00',
              totalPositionMM: '0.00',
              usdValue: '112.00',
              unrealisedPnl: '0.00',
              borrowAmount: '0.00',
              totalPositionIM: '0.00',
              walletBalance: '112.00',
              cumRealisedPnl: '100.00',
              coin: 'USDT'
            }
          ]
        }
      ]
    },
    retExtInfo: {},
    time: Date.now()
  };
}

/**
 * Generate mock positions data
 * @returns {Object} - Mock positions data
 */
function generateMockPositions() {
  return {
    retCode: 0,
    retMsg: 'OK',
    result: {
      list: [
        {
          symbol: 'BTCUSDT',
          leverage: '10',
          avgPrice: '50000.00',
          liqPrice: '45000.00',
          riskLimitValue: '2000000',
          takeProfit: '55000.00',
          positionValue: '5000.00',
          tpslMode: 'Full',
          riskId: 1,
          trailingStop: '0.00',
          unrealisedPnl: '500.00',
          markPrice: '50500.00',
          cumRealisedPnl: '1000.00',
          positionMM: '50.00',
          createdTime: Date.now() - 3600000,
          positionIdx: 0,
          positionIM: '500.00',
          updatedTime: Date.now(),
          side: 'Buy',
          bustPrice: '0.00',
          size: '0.1',
          positionStatus: 'Normal',
          stopLoss: '48000.00',
          adlRankIndicator: 0
        }
      ]
    },
    retExtInfo: {},
    time: Date.now()
  };
}

/**
 * Generate mock trade history data
 * @returns {Object} - Mock trade history data
 */
function generateMockTradeHistory() {
  return {
    retCode: 0,
    retMsg: 'OK',
    result: {
      list: Array(10).fill(0).map((_, i) => ({
        symbol: 'BTCUSDT',
        orderId: `mock-order-${Date.now() - i * 3600000}`,
        side: i % 2 === 0 ? 'Buy' : 'Sell',
        price: (50000 + (i * 100)).toFixed(2),
        size: '0.1',
        value: '5000.00',
        execFee: '3.00',
        feeRate: '0.0006',
        execId: `mock-exec-${Date.now() - i * 3600000}`,
        execPrice: (50000 + (i * 100)).toFixed(2),
        execQty: '0.1',
        execType: 'Trade',
        execValue: '5000.00',
        execTime: Date.now() - i * 3600000,
        closedPnl: (i * 2.2).toFixed(2),
        orderLinkId: '',
        orderType: 'Market',
        stopOrderType: 'UNKNOWN',
        leavesQty: '0',
        isMaker: false,
        blockTradeId: ''
      }))
    },
    retExtInfo: {},
    time: Date.now()
  };
}

/**
 * Get base price for a symbol
 * @param {string} symbol - Trading symbol (e.g., BTCUSDT)
 * @returns {number} - Base price
 */
function getBasePrice(symbol) {
  const prices = {
    'BTCUSDT': 50000,
    'ETHUSDT': 3000,
    'SOLUSDT': 100,
    'BNBUSDT': 500,
    'DOGEUSDT': 0.1,
    'XRPUSDT': 0.5,
    'ADAUSDT': 0.3,
    'DOTUSDT': 10,
    'LTCUSDT': 100,
    'LINKUSDT': 15
  };

  return prices[symbol] || 100;
}

/**
 * Get interval in milliseconds
 * @param {string} interval - Kline interval (e.g., 1m, 5m, 1h)
 * @returns {number} - Interval in milliseconds
 */
function getIntervalMs(interval) {
  const intervals = {
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '30m': 30 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000
  };

  return intervals[interval] || 60 * 1000;
}

/**
 * Generate comprehensive mock data for the dashboard
 * @returns {Object} - Object containing all mock data
 */
function generateMockData() {
  const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'DOGEUSDT', 'XRPUSDT', 'ADAUSDT', 'DOTUSDT'];

  // System status
  const systemStatus = {
    isActive: true,
    uptime: Math.floor(Math.random() * 86400000), // Random uptime up to 1 day
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
    environment: 'production'
  };

  // System metrics
  const systemMetrics = {
    capital: 12 + Math.random() * 100,
    profit: Math.random() * 100,
    profitPercentage: Math.random() * 50,
    tradesCompleted: Math.floor(Math.random() * 1000),
    winRate: Math.random() * 30 + 70,
    averageProfitPerTrade: 2.2 + Math.random() * 1,
    averageLossPerTrade: Math.random() * 0.5,
    maxDrawdown: Math.random() * 5,
    sharpeRatio: Math.random() * 2 + 1,
    sortinoRatio: Math.random() * 3 + 2,
    calmarRatio: Math.random() * 1 + 0.5,
    volatility: Math.random() * 10,
    beta: Math.random() * 0.5 + 0.5,
    alpha: Math.random() * 0.2 + 0.1,
    rSquared: Math.random() * 0.3 + 0.7,
    maxConsecutiveWins: Math.floor(Math.random() * 10 + 5),
    maxConsecutiveLosses: Math.floor(Math.random() * 3),
    profitFactor: Math.random() * 2 + 1.5,
    expectancy: Math.random() * 1 + 0.5,
    systemEfficiency: Math.random() * 20 + 80,
    tradingFrequency: Math.floor(Math.random() * 100 + 650),
    averageHoldingTime: Math.floor(Math.random() * 3600 + 300),
    lastUpdated: new Date().toISOString()
  };

  // Active trades
  const activeTrades = Array(Math.floor(Math.random() * 5)).fill(0).map((_, i) => {
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const direction = Math.random() > 0.5 ? 'long' : 'short';
    const entryPrice = getBasePrice(symbol) * (1 + (Math.random() * 0.02 - 0.01));
    const currentPrice = entryPrice * (1 + (Math.random() * 0.04 - 0.02));
    const amount = 12;
    const leverage = Math.floor(Math.random() * 20 + 10);
    const profit = direction === 'long'
      ? (currentPrice - entryPrice) * amount * leverage / entryPrice
      : (entryPrice - currentPrice) * amount * leverage / entryPrice;

    return {
      id: `trade-${Date.now() - i * 60000}`,
      symbol,
      direction,
      entryPrice: entryPrice.toFixed(2),
      currentPrice: currentPrice.toFixed(2),
      amount: amount.toFixed(2),
      leverage: leverage.toString(),
      profit: profit.toFixed(2),
      profitPercentage: ((profit / amount) * 100).toFixed(2),
      entryTime: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      duration: Math.floor(Math.random() * 3600),
      takeProfitPrice: direction === 'long'
        ? (entryPrice * (1 + Math.random() * 0.05)).toFixed(2)
        : (entryPrice * (1 - Math.random() * 0.05)).toFixed(2),
      stopLossPrice: direction === 'long'
        ? (entryPrice * (1 - Math.random() * 0.03)).toFixed(2)
        : (entryPrice * (1 + Math.random() * 0.03)).toFixed(2),
      agent: ['QuantumPredictor', 'ZeroLossEnforcer', 'HyperdimensionalPatternRecognizer'][Math.floor(Math.random() * 3)],
      confidence: (80 + Math.random() * 19).toFixed(2),
      reasonEntry: `${['Quantum', 'Neural', 'Hyperdimensional', 'Pattern'][Math.floor(Math.random() * 4)]} ${['signal', 'prediction', 'analysis', 'recognition'][Math.floor(Math.random() * 4)]} with ${(80 + Math.random() * 19).toFixed(2)}% confidence`,
      status: 'active'
    };
  });

  // Trade history
  const tradeHistory = Array(Math.floor(Math.random() * 20 + 10)).fill(0).map((_, i) => {
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const direction = Math.random() > 0.5 ? 'long' : 'short';
    const entryPrice = getBasePrice(symbol) * (1 + (Math.random() * 0.02 - 0.01));
    const exitPrice = entryPrice * (1 + (Math.random() * 0.04 - 0.02));
    const amount = 12;
    const leverage = Math.floor(Math.random() * 20 + 10);
    const profit = direction === 'long'
      ? (exitPrice - entryPrice) * amount * leverage / entryPrice
      : (entryPrice - exitPrice) * amount * leverage / entryPrice;

    return {
      id: `trade-${Date.now() - (i + 10) * 60000}`,
      symbol,
      direction,
      entryPrice: entryPrice.toFixed(2),
      exitPrice: exitPrice.toFixed(2),
      amount: amount.toFixed(2),
      leverage: leverage.toString(),
      profit: profit.toFixed(2),
      profitPercentage: ((profit / amount) * 100).toFixed(2),
      entryTime: new Date(Date.now() - (i + 10) * 60000 - Math.random() * 3600000).toISOString(),
      exitTime: new Date(Date.now() - (i + 10) * 60000).toISOString(),
      duration: Math.floor(Math.random() * 3600),
      agent: ['QuantumPredictor', 'ZeroLossEnforcer', 'HyperdimensionalPatternRecognizer'][Math.floor(Math.random() * 3)],
      confidence: (80 + Math.random() * 19).toFixed(2),
      reasonEntry: `${['Quantum', 'Neural', 'Hyperdimensional', 'Pattern'][Math.floor(Math.random() * 4)]} ${['signal', 'prediction', 'analysis', 'recognition'][Math.floor(Math.random() * 4)]} with ${(80 + Math.random() * 19).toFixed(2)}% confidence`,
      reasonExit: Math.random() > 0.8 ? 'Stop loss triggered' : Math.random() > 0.5 ? 'Take profit reached' : 'Manual exit',
      status: 'completed'
    };
  });

  // Asset info
  const assetInfo = symbols.map(symbol => {
    const basePrice = getBasePrice(symbol);
    return {
      symbol,
      price: (basePrice * (1 + (Math.random() * 0.02 - 0.01))).toFixed(2),
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

  // Market data
  const marketData = symbols.map(symbol => {
    const basePrice = getBasePrice(symbol);
    const currentPrice = basePrice * (1 + (Math.random() * 0.02 - 0.01));

    return {
      symbol,
      price: currentPrice.toFixed(2),
      bid: (currentPrice * (1 - Math.random() * 0.001)).toFixed(2),
      ask: (currentPrice * (1 + Math.random() * 0.001)).toFixed(2),
      volume: (Math.random() * 1000 + 100).toFixed(2),
      timestamp: Date.now()
    };
  });

  // Agent status
  const agentStatus = Array(Math.floor(Math.random() * 30 + 60)).fill(0).map((_, i) => {
    const agentTypes = [
      'QuantumPredictor', 'ZeroLossEnforcer', 'HyperdimensionalPatternRecognizer',
      'NeuralNetworkAnalyzer', 'MarketSentimentAnalyzer', 'OrderFlowAnalyzer',
      'VolatilityTrader', 'TrendFollower', 'MeanReversionTrader',
      'BreakoutDetector', 'SupportResistanceTrader', 'FibonacciTrader'
    ];

    const agentType = agentTypes[Math.floor(Math.random() * agentTypes.length)];
    const status = Math.random() > 0.9 ? 'idle' : Math.random() > 0.05 ? 'active' : 'error';

    return {
      id: `agent-${i}`,
      name: `${agentType}-${i}`,
      type: agentType,
      status,
      confidence: (70 + Math.random() * 29).toFixed(2),
      lastAction: status === 'active' ?
        `Analyzing ${symbols[Math.floor(Math.random() * symbols.length)]}` :
        status === 'error' ? 'Error in analysis' : 'Waiting for signal',
      lastActionTime: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      tradesInitiated: Math.floor(Math.random() * 100),
      successRate: (70 + Math.random() * 29).toFixed(2),
      profitContribution: (Math.random() * 1000).toFixed(2),
      specialization: symbols[Math.floor(Math.random() * symbols.length)],
      currentTask: status === 'active' ?
        `${['Analyzing', 'Predicting', 'Trading', 'Monitoring'][Math.floor(Math.random() * 4)]} ${symbols[Math.floor(Math.random() * symbols.length)]}` :
        null
    };
  });

  // Leaderboard
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

  // Quantum predictions
  const quantumPredictions = symbols.map(symbol => {
    const basePrice = getBasePrice(symbol);
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
      down_probability: direction === 'short' ? (0.5 + Math.random() * 0.4).toFixed(8) : (0.1 + Math.random() * 0.4).toFixed(8),
      quantum_entropy: Math.random().toFixed(8),
      quantum_coherence: Math.random().toFixed(8),
      interference_strength: Math.random().toFixed(8),
      expected_volatility: (Math.random() * 5 + 1).toFixed(8),
      basis: 'quantum_simulation'
    };
  });

  // ML insights
  const mlInsights = symbols.map(symbol => {
    return {
      symbol,
      timestamp: new Date().toISOString(),
      trend: ['strong_bullish', 'bullish', 'neutral', 'bearish', 'strong_bearish'][Math.floor(Math.random() * 5)],
      support_levels: [
        (getBasePrice(symbol) * (1 - Math.random() * 0.05)).toFixed(2),
        (getBasePrice(symbol) * (1 - Math.random() * 0.1)).toFixed(2)
      ],
      resistance_levels: [
        (getBasePrice(symbol) * (1 + Math.random() * 0.05)).toFixed(2),
        (getBasePrice(symbol) * (1 + Math.random() * 0.1)).toFixed(2)
      ],
      volatility_prediction: (Math.random() * 5 + 1).toFixed(2),
      volume_prediction: (Math.random() * 1000000 + 100000).toFixed(2),
      sentiment_score: (Math.random() * 2 - 1).toFixed(2),
      price_prediction: {
        '1h': (getBasePrice(symbol) * (1 + (Math.random() * 0.02 - 0.01))).toFixed(2),
        '4h': (getBasePrice(symbol) * (1 + (Math.random() * 0.05 - 0.025))).toFixed(2),
        '1d': (getBasePrice(symbol) * (1 + (Math.random() * 0.1 - 0.05))).toFixed(2)
      },
      confidence: (Math.random() * 0.3 + 0.7).toFixed(2),
      patterns_detected: [
        {
          name: ['Double Top', 'Double Bottom', 'Head and Shoulders', 'Inverse Head and Shoulders', 'Triangle', 'Flag', 'Pennant'][Math.floor(Math.random() * 7)],
          confidence: (Math.random() * 0.3 + 0.7).toFixed(2),
          timeframe: ['1h', '4h', '1d'][Math.floor(Math.random() * 3)]
        }
      ]
    };
  });

  // Hyperdimensional patterns
  const hyperdimensionalPatterns = symbols.map(symbol => {
    return {
      symbol,
      timestamp: new Date().toISOString(),
      dimension: Math.floor(Math.random() * 10 + 5),
      pattern_strength: (Math.random() * 0.5 + 0.5).toFixed(2),
      correlation_dimension: (Math.random() * 2 + 1).toFixed(2),
      lyapunov_exponent: (Math.random() * 0.1).toFixed(4),
      hurst_exponent: (Math.random() * 0.5 + 0.5).toFixed(2),
      fractal_dimension: (Math.random() * 1 + 1).toFixed(2),
      entropy: (Math.random() * 1).toFixed(2),
      complexity: (Math.random() * 10 + 5).toFixed(2),
      prediction: {
        direction: Math.random() > 0.5 ? 'up' : 'down',
        magnitude: (Math.random() * 5).toFixed(2),
        confidence: (Math.random() * 0.3 + 0.7).toFixed(2),
        timeframe: ['1h', '4h', '1d'][Math.floor(Math.random() * 3)]
      }
    };
  });

  // Neural network state
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
        last_trained: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        prediction_horizon: ['1h', '4h', '1d'][Math.floor(Math.random() * 3)],
        features_used: Math.floor(Math.random() * 100 + 50),
        performance_metrics: {
          precision: (Math.random() * 0.2 + 0.8).toFixed(4),
          recall: (Math.random() * 0.2 + 0.8).toFixed(4),
          f1_score: (Math.random() * 0.2 + 0.8).toFixed(4),
          roc_auc: (Math.random() * 0.2 + 0.8).toFixed(4)
        }
      };
    }),
    global_state: {
      ensemble_accuracy: (Math.random() * 0.1 + 0.9).toFixed(4),
      active_models: Math.floor(Math.random() * 20 + 10),
      training_queue: Math.floor(Math.random() * 5),
      system_load: (Math.random() * 50 + 30).toFixed(2),
      memory_usage: (Math.random() * 50 + 30).toFixed(2),
      gpu_usage: (Math.random() * 80 + 20).toFixed(2)
    }
  };

  // Strategy performance
  const strategyPerformance = [
    {
      name: 'Quantum Momentum',
      profit: (Math.random() * 5000).toFixed(2),
      profitPercentage: (Math.random() * 200).toFixed(2),
      tradesCount: Math.floor(Math.random() * 500),
      winRate: (Math.random() * 20 + 80).toFixed(2),
      sharpeRatio: (Math.random() * 2 + 1).toFixed(2),
      maxDrawdown: (Math.random() * 10).toFixed(2),
      status: 'active'
    },
    {
      name: 'Neural Pattern Recognition',
      profit: (Math.random() * 5000).toFixed(2),
      profitPercentage: (Math.random() * 200).toFixed(2),
      tradesCount: Math.floor(Math.random() * 500),
      winRate: (Math.random() * 20 + 80).toFixed(2),
      sharpeRatio: (Math.random() * 2 + 1).toFixed(2),
      maxDrawdown: (Math.random() * 10).toFixed(2),
      status: 'active'
    },
    {
      name: 'Hyperdimensional Arbitrage',
      profit: (Math.random() * 5000).toFixed(2),
      profitPercentage: (Math.random() * 200).toFixed(2),
      tradesCount: Math.floor(Math.random() * 500),
      winRate: (Math.random() * 20 + 80).toFixed(2),
      sharpeRatio: (Math.random() * 2 + 1).toFixed(2),
      maxDrawdown: (Math.random() * 10).toFixed(2),
      status: 'active'
    },
    {
      name: 'Zero-Loss Guaranteed',
      profit: (Math.random() * 5000).toFixed(2),
      profitPercentage: (Math.random() * 200).toFixed(2),
      tradesCount: Math.floor(Math.random() * 500),
      winRate: (Math.random() * 20 + 80).toFixed(2),
      sharpeRatio: (Math.random() * 2 + 1).toFixed(2),
      maxDrawdown: (Math.random() * 10).toFixed(2),
      status: 'active'
    },
    {
      name: 'Multi-Agent Consensus',
      profit: (Math.random() * 5000).toFixed(2),
      profitPercentage: (Math.random() * 200).toFixed(2),
      tradesCount: Math.floor(Math.random() * 500),
      winRate: (Math.random() * 20 + 80).toFixed(2),
      sharpeRatio: (Math.random() * 2 + 1).toFixed(2),
      maxDrawdown: (Math.random() * 10).toFixed(2),
      status: 'active'
    },
    {
      name: 'Volatility Harvester',
      profit: (Math.random() * 5000).toFixed(2),
      profitPercentage: (Math.random() * 200).toFixed(2),
      tradesCount: Math.floor(Math.random() * 500),
      winRate: (Math.random() * 20 + 80).toFixed(2),
      sharpeRatio: (Math.random() * 2 + 1).toFixed(2),
      maxDrawdown: (Math.random() * 10).toFixed(2),
      status: 'active'
    },
    {
      name: 'Orderbook Depth Analysis',
      profit: (Math.random() * 5000).toFixed(2),
      profitPercentage: (Math.random() * 200).toFixed(2),
      tradesCount: Math.floor(Math.random() * 500),
      winRate: (Math.random() * 20 + 80).toFixed(2),
      sharpeRatio: (Math.random() * 2 + 1).toFixed(2),
      maxDrawdown: (Math.random() * 10).toFixed(2),
      status: 'active'
    },
    {
      name: 'Funding Rate Arbitrage',
      profit: (Math.random() * 5000).toFixed(2),
      profitPercentage: (Math.random() * 200).toFixed(2),
      tradesCount: Math.floor(Math.random() * 500),
      winRate: (Math.random() * 20 + 80).toFixed(2),
      sharpeRatio: (Math.random() * 2 + 1).toFixed(2),
      maxDrawdown: (Math.random() * 10).toFixed(2),
      status: 'active'
    }
  ];

  return {
    systemStatus,
    systemMetrics,
    activeTrades,
    tradeHistory,
    assetInfo,
    marketData,
    agentStatus,
    leaderboard,
    quantumPredictions,
    mlInsights,
    hyperdimensionalPatterns,
    neuralNetworkState,
    strategyPerformance
  };
}

module.exports = {
  generateMockData,
  generateMockTicker,
  generateMockOrderBook,
  generateMockTrade,
  generateMockKlines,
  generateMockWalletBalance,
  generateMockPositions,
  generateMockTradeHistory
};
