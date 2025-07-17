/**
 * REAL API SERVER - NO FAKE METRICS
 * 
 * This serves actual trading data from the real trading system
 */

const express = require('express');
const cors = require('cors');
const RealTradingSystem = require('./real_trading_system');
const path = require('path');

const app = express();
const port = 10002;

// Initialize real trading system
const trader = new RealTradingSystem();
let isInitialized = false;

app.use(cors());
app.use(express.json());

// Initialize trading system
async function initializeSystem() {
  try {
    console.log('🔧 Initializing real trading system...');
    await trader.getRealBalance();
    await trader.getRealPositions();
    await trader.getRealTradeHistory();
    isInitialized = true;
    console.log('✅ Real trading system initialized');
  } catch (error) {
    console.error('❌ Failed to initialize trading system:', error);
  }
}

// Routes

/**
 * Get real system status
 */
app.get('/api/status', async (req, res) => {
  try {
    if (!isInitialized) {
      await initializeSystem();
    }
    
    // Get fresh data
    await trader.getRealBalance();
    await trader.getRealPositions();
    
    const status = trader.getStatus();
    
    res.json({
      success: true,
      data: status,
      message: 'Real trading system status',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to get real status'
    });
  }
});

/**
 * Get real metrics (no fake data)
 */
app.get('/api/metrics', async (req, res) => {
  try {
    if (!isInitialized) {
      await initializeSystem();
    }
    
    const status = trader.getStatus();
    
    // Return REAL metrics only
    res.json({
      success: true,
      data: {
        // Real balance data
        initialCapital: status.balance.initial,
        currentCapital: status.balance.current,
        pnl: status.balance.change,
        pnlPercentage: status.balance.changePercent,
        
        // Real trading data
        totalTrades: status.trading.totalTrades,
        winningTrades: status.trading.winningTrades,
        losingTrades: status.trading.losingTrades,
        winRate: status.trading.winRate,
        totalProfit: status.trading.totalProfit,
        totalLoss: status.trading.totalLoss,
        netPnl: status.trading.netPnl,
        
        // Real position data
        activePositions: status.positions.length,
        positions: status.positions,
        
        // System status
        isTrading: status.isTrading,
        lastUpdate: status.lastUpdate,
        
        // Honest disclaimers
        dataSource: 'Real Bybit Demo Account',
        disclaimer: 'These are actual trading results, not simulated',
        note: 'Past performance does not guarantee future results'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get real balance
 */
app.get('/api/balance', async (req, res) => {
  try {
    const balance = await trader.getRealBalance();
    
    res.json({
      success: true,
      data: {
        balance: balance,
        currency: 'USDT',
        source: 'Bybit Demo Account',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get real positions
 */
app.get('/api/positions', async (req, res) => {
  try {
    const positions = await trader.getRealPositions();
    
    res.json({
      success: true,
      data: {
        positions: positions,
        count: positions.length,
        source: 'Bybit Demo Account',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get real trade history
 */
app.get('/api/trades', async (req, res) => {
  try {
    const trades = await trader.getRealTradeHistory();
    
    res.json({
      success: true,
      data: {
        trades: trades,
        count: trades.length,
        source: 'Bybit Demo Account',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Start trading
 */
app.post('/api/start-trading', async (req, res) => {
  try {
    if (!isInitialized) {
      await initializeSystem();
    }
    
    if (trader.state.isTrading) {
      return res.json({
        success: false,
        message: 'Trading is already active'
      });
    }
    
    await trader.startTrading();
    
    res.json({
      success: true,
      message: 'Real trading started',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Stop trading
 */
app.post('/api/stop-trading', (req, res) => {
  try {
    trader.stopTrading();
    
    res.json({
      success: true,
      message: 'Trading stopped',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Place a manual trade
 */
app.post('/api/trade', async (req, res) => {
  try {
    const { symbol, side, quantity } = req.body;
    
    if (!symbol || !side || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: symbol, side, quantity'
      });
    }
    
    const result = await trader.placeRealTrade(symbol, side, parseFloat(quantity));
    
    res.json({
      success: result.success,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get market data
 */
app.get('/api/market/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const marketData = await trader.getMarketData(symbol);
    
    if (marketData) {
      res.json({
        success: true,
        data: marketData,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Market data not found'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Real OMNI Trading System',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Real OMNI API Server running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`📈 Status: http://localhost:${port}/api/status`);
  console.log(`💰 Metrics: http://localhost:${port}/api/metrics`);
  
  // Initialize system on startup
  initializeSystem();
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  trader.stopTrading();
  process.exit(0);
});

module.exports = app;
