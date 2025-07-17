/**
 * OMNI COMPREHENSIVE TRADING CONFIGURATION
 * 
 * Optimized for 12 USDT capital with maximum profitability
 */

// Initialize and validate capital constraints on module load
const initializeCapitalManagement = () => {
  const config = module.exports;

  // Validate capital constraints
  try {
    config.capital.validateCapitalConstraints();
    console.log('✅ Capital management constraints validated successfully');
    console.log(`   Total Capital: ${config.capital.total.toFixed(6)} USDT`);
    console.log(`   Active Capital: ${config.capital.active.toFixed(6)} USDT`);
    console.log(`   Safety Buffer: ${config.capital.safetyBuffer.toFixed(6)} USDT`);
    console.log(`   Max Positions: ${config.capital.maxConcurrentPositions}`);
    console.log(`   Position Size: ${config.capital.calculatePositionSize().toFixed(6)} USDT each`);
  } catch (error) {
    console.error('❌ Capital management validation failed:', error.message);
    throw error;
  }
};

module.exports = {
  // QUANTUM-ENHANCED CAPITAL MANAGEMENT - EXACT 12 USDT CONSTRAINT
  // Total Capital: Exactly 12.000000 USDT (never 100 USDT or other amounts)
  // Active Trading Capital: 10.000000 USDT (with 2.000000 USDT safety buffer)
  // Minimum Trade Size: 5.000000 USDT (Bybit requirement)
  // Maximum Concurrent Positions: 2 positions (5.000000 USDT each)
  // Profit Target: Minimum 0.600000 USDT per trade after fees/slippage
  // Trading Frequency: 750+ trades per day (1 trade every 115 seconds)

  // Global Trading Limits - QUANTUM-ENHANCED SPECIFICATIONS
  maxPositions: 2, // EXACT 2 concurrent positions for 12 USDT capital
  initialCapital: 12.000000, // Starting capital in USDT (EXACT SPECIFICATION)

  // Quantum-Enhanced Capital Management with Mathematical Precision
  capital: {
    total: 12.000000, // EXACT 12.000000 USDT - NEVER CHANGE
    active: 10.000000, // EXACT 10.000000 USDT for trading
    safetyBuffer: 2.000000, // EXACT 2.000000 USDT safety buffer
    minTradeSize: 5.000000, // EXACT 5.000000 USDT minimum (Bybit requirement)
    maxConcurrentPositions: 2, // EXACT 2 positions (5 USDT each)
    minProfitTarget: 0.600000, // EXACT 0.600000 USDT minimum profit per trade
    dynamicAllocation: true, // Enable confidence-weighted allocation
    maxRiskPerTrade: 0.0025, // 0.25% max risk per trade (stop-loss)
    maxPortfolioRisk: 0.009, // 0.9% max total portfolio risk (drawdown)

    // MATHEMATICAL VALIDATION FUNCTIONS
    validateCapitalConstraints: function() {
      const totalCheck = this.active + this.safetyBuffer;
      if (Math.abs(totalCheck - this.total) > 0.000001) {
        throw new Error(`Capital constraint violation: ${this.active} + ${this.safetyBuffer} = ${totalCheck} ≠ ${this.total}`);
      }

      const maxPositionCapital = this.maxConcurrentPositions * this.minTradeSize;
      if (maxPositionCapital > this.active) {
        throw new Error(`Position constraint violation: ${this.maxConcurrentPositions} × ${this.minTradeSize} = ${maxPositionCapital} > ${this.active}`);
      }

      return true;
    },

    // Calculate exact position size for given number of positions
    calculatePositionSize: function(numPositions = this.maxConcurrentPositions) {
      if (numPositions > this.maxConcurrentPositions) {
        throw new Error(`Cannot exceed maximum positions: ${numPositions} > ${this.maxConcurrentPositions}`);
      }

      const positionSize = this.active / numPositions;
      if (positionSize < this.minTradeSize) {
        throw new Error(`Position size ${positionSize.toFixed(6)} below minimum ${this.minTradeSize}`);
      }

      return Math.round(positionSize * 1000000) / 1000000; // 6 decimal precision
    },

    leverageRange: {
      min: 50, // Minimum leverage for 0.5%-0.8% movements
      max: 100, // Maximum leverage for precision
      default: 75 // Default leverage for optimal profit targeting
    },
    // Quantum-enhanced allocation parameters
    confidenceWeighting: true, // Weight allocation by confidence scores
    assetCooldownMinutes: 15, // 15 minutes between same-asset trades
    targetTradesPerDay: 750, // 750+ trades per day requirement
    tradeIntervalSeconds: 115 // Approximately 1 trade every 115 seconds
  },

  // PHASE 3 ASSET SCANNING CRITERIA - COMPREHENSIVE FILTERING
  // Scan ALL Bybit linear perpetuals (300+ assets) with filtering:
  // - Daily volume > $5M
  // - Market cap > $100M
  // - Volatility > 2% daily range
  // - Compatible with 50-100x leverage
  // - Suitable for 5 USDT minimum order size
  assetFiltering: {
    minDailyVolume: 5000000, // $5M minimum daily volume
    minMarketCap: 100000000, // $100M minimum market cap
    minVolatility: 2.0, // 2% minimum daily volatility
    leverageCompatibility: {
      min: 50,
      max: 100
    },
    minOrderSize: 5.0, // 5 USDT minimum order size compatibility
    excludeHighValue: true, // Exclude BTC, ETH due to capital constraints
    targetMovements: {
      min: 0.5, // 0.5% minimum target movement
      max: 0.8  // 0.8% maximum target movement for profit capture
    }
  },

  // Priority Trading Pairs (optimized for 12 USDT capital and 0.5-0.8% movements)
  tradingPairs: [
    // High volatility altcoins (optimal for small capital and target movements)
    'PEPEUSDT',   // High volatility, low price, good for 0.5-0.8% movements
    'SHIBUSDT',   // Meme coin volatility, suitable for small capital
    'DOGEUSDT',   // Popular, volatile, good liquidity
    'FLOKIUSDT',  // High volatility altcoin
    'BONKUSDT',   // Solana meme coin, high volatility
    '1000RATSUSDT', // High volatility, small price movements
    'ORDIUSDT',   // BRC-20 token, good volatility
    'WIFUSDT',    // Solana meme coin, high volatility

    // Mid-cap altcoins (good for leverage and target movements)
    'SOLUSDT',    // Good volatility, not too expensive
    'ADAUSDT',    // Stable volatility, good for precision
    'DOTUSDT',    // Good volatility range
    'AVAXUSDT',   // Good for leverage trading
    'LINKUSDT',   // Oracle token, good volatility
    'MATICUSDT',  // Layer 2, good price range
    'ATOMUSDT',   // Cosmos ecosystem, good volatility
    'NEARUSDT',   // Layer 1, suitable volatility

    // Additional high-volatility pairs for 300+ asset scanning
    'APTUSDT', 'SUIUSDT', 'ARBUSDT', 'OPUSDT', 'INJUSDT',
    'TIAUSTD', 'SEIUSDT', 'STXUSDT', 'JUPUSDT', 'PYTHUSDT'
  ],

  // PHASE 3 COMPREHENSIVE ASSET SCANNING CONFIGURATION
  assetScanning: {
    // Comprehensive scanning settings
    scanAllAssets: true, // Scan ALL Bybit linear perpetuals
    maxAssetsToScan: 300, // 300+ assets as specified
    scanIntervalSeconds: 10, // Scan every 10 seconds for real-time updates

    // Performance requirements
    maxScanTimeMs: 3000, // Sub-3ms requirement for individual asset analysis
    parallelScanning: true, // Enable parallel processing for speed
    cacheValidityMinutes: 5, // Cache asset data for 5 minutes

    // Filtering and ranking
    enableDynamicFiltering: true, // Dynamically adjust filters based on market conditions
    rankingAlgorithm: 'comprehensive', // Use comprehensive scoring algorithm
    updateFrequencyMs: 2000, // Update filtered list every 2 seconds
  },

  // Analysis Configuration
  analysis: {
    timeframes: ['1m', '5m', '15m', '1h', '4h'],
    primaryTimeframe: '15m',
    confirmationTimeframes: ['5m', '1h'],
    
    // Minimum requirements for trade execution
    minConfidence: 0.75,
    minRiskReward: 2.0,
    minLiquidity: 1000000, // $1M minimum daily volume
    
    // Technical analysis weights
    weights: {
      candlestickPatterns: 0.15,
      chartPatterns: 0.15,
      technicalIndicators: 0.25,
      volumeAnalysis: 0.15,
      mlPredictions: 0.20,
      psychologicalFactors: 0.10
    }
  },

  // Multi-Asset Trading Configuration - ALIGNED WITH 12 USDT CONSTRAINT
  multiAsset: {
    maxConcurrentPositions: 2, // EXACT 2 positions for 12 USDT capital
    maxCapitalPerAsset: 0.5, // 50% max per asset (5 USDT each)
    diversificationEnabled: true,
    rebalanceInterval: 900000, // 15 minutes for high-frequency trading

    // Asset selection criteria for 12 USDT capital
    assetSelectionCriteria: {
      minVolume: 5000000, // $5M minimum daily volume
      minMarketCap: 100000000, // $100M minimum market cap
      maxPrice: 1000, // Exclude very high-price assets for better position sizing
      minVolatility: 0.02, // 2% minimum daily volatility
      maxVolatility: 0.15, // 15% maximum daily volatility
      leverageCompatible: true, // Must support 50-100x leverage
    }
  },

  // Risk Management - OPTIMIZED FOR 12 USDT CAPITAL
  riskManagement: {
    stopLossPercent: 0.0025, // 0.25% stop-loss for capital preservation
    takeProfitPercent: 0.006, // 0.6% take-profit (minimum 0.6 USDT target)
    trailingStopPercent: 0.003, // 0.3% trailing stop
    emergencyStopPercent: 0.009, // 0.9% emergency stop (max drawdown)
    maxConcurrentPositions: 2, // EXACT 2 positions for 12 USDT
    maxPositionSize: 0.5, // 50% max per position (5 USDT each)

    // Capital preservation for small account
    maxDrawdownPercent: 0.009, // 0.9% maximum drawdown (0.108 USDT)
    maxRiskPerTrade: 0.0025, // 0.25% max risk per trade (0.03 USDT)

    // Dynamic stop-loss based on volatility
    dynamicStops: true,
    volatilityMultiplier: 1.2, // Conservative for small capital

    // Position sizing method optimized for 12 USDT
    positionSizingMethod: 'FIXED_AMOUNT', // Fixed 5 USDT per position
    fixedPositionSize: 5.000000, // EXACT 5.000000 USDT per position

    // Asset cooldown to prevent overtrading
    assetCooldownMinutes: 15, // 15-minute cooldown between trades on same asset
  },

  // Machine Learning Configuration
  ml: {
    modelUpdateInterval: 3600000, // 1 hour
    trainingDataPoints: 1000,
    predictionHorizon: 60, // 60 minutes
    ensembleWeights: {
      lstm: 0.4,
      cnn: 0.3,
      randomForest: 0.2,
      svm: 0.1
    },
    
    // Feature engineering
    features: [
      'price_action',
      'volume_profile',
      'technical_indicators',
      'market_sentiment',
      'orderbook_imbalance',
      'funding_rates',
      'social_sentiment'
    ]
  },

  // Execution Settings
  execution: {
    orderType: 'MARKET', // For demo trading
    slippage: 0.001, // 0.1% max slippage
    maxOrderSize: 4, // Max $4 per order (33% of capital)
    
    // Timing
    analysisInterval: 30000, // 30 seconds
    executionInterval: 10000, // 10 seconds
    monitoringInterval: 5000, // 5 seconds
    
    // Demo trading settings
    demoMode: true,
    realDataFeed: true,
    paperTradingOnly: true
  },

  // Performance Targets
  targets: {
    dailyProfitTarget: 0.05, // 5% daily target
    weeklyProfitTarget: 0.25, // 25% weekly target
    monthlyProfitTarget: 1.0, // 100% monthly target
    
    maxDailyLoss: 0.03, // 3% max daily loss
    maxWeeklyLoss: 0.10, // 10% max weekly loss
    maxDrawdown: 0.15, // 15% max drawdown
    
    minWinRate: 0.60, // 60% minimum win rate
    minProfitFactor: 1.5 // 1.5 minimum profit factor
  },

  // Market Conditions
  marketConditions: {
    // Bull market settings
    bull: {
      longBias: 0.7,
      shortBias: 0.3,
      riskMultiplier: 1.2,
      confidenceThreshold: 0.7
    },
    
    // Bear market settings
    bear: {
      longBias: 0.3,
      shortBias: 0.7,
      riskMultiplier: 0.8,
      confidenceThreshold: 0.8
    },
    
    // Sideways market settings
    sideways: {
      longBias: 0.5,
      shortBias: 0.5,
      riskMultiplier: 0.6,
      confidenceThreshold: 0.85
    }
  },

  // Emergency Protocols
  emergency: {
    maxConsecutiveLosses: 3,
    emergencyStopLoss: 0.05, // 5% portfolio loss triggers emergency stop
    cooldownPeriod: 3600000, // 1 hour cooldown after emergency stop
    
    // Circuit breakers
    circuitBreakers: {
      rapidLoss: 0.02, // 2% loss in 5 minutes
      highVolatility: 0.05, // 5% price movement in 1 minute
      lowLiquidity: 0.5 // 50% below average volume
    }
  },

  // Logging and Monitoring
  logging: {
    level: 'INFO',
    logTrades: true,
    logAnalysis: true,
    logRiskEvents: true,
    
    // Performance tracking
    trackMetrics: true,
    metricsInterval: 60000, // 1 minute
    
    // Alerts
    alertOnLoss: true,
    alertOnProfit: true,
    alertOnRiskEvents: true
  }
};

// Initialize capital management validation on module load
try {
  initializeCapitalManagement();
} catch (error) {
  console.error('❌ Failed to initialize capital management:', error.message);
  process.exit(1);
}
