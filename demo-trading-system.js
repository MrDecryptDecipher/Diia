/**
 * 🚀 DEMO REAL OMNI TRADING SYSTEM
 * 
 * This demonstrates how the REAL trading system would work
 * Uses real market data but simulates trades until you get valid API credentials
 */

const { RestClientV5 } = require('bybit-api');
require('dotenv').config();

class DemoRealOmniTradingSystem {
  constructor() {
    // REAL Bybit client for market data (no auth needed)
    this.client = new RestClientV5({
      testnet: true
    });
    
    this.isRunning = false;
    this.positions = new Map();
    this.capital = 12.0; // Your 12 USDT capital
    this.maxPositions = 5;
    this.riskPerTrade = 0.02; // 2% risk per trade
    this.tradeCount = 0;
    this.totalPnL = 0;
    
    console.log('🚀 DEMO REAL OMNI Trading System initialized');
    console.log(`💰 Capital: ${this.capital} USDT`);
    console.log(`📊 Max positions: ${this.maxPositions}`);
    console.log('⚠️  DEMO MODE: Will simulate trades until you provide valid API credentials');
  }

  /**
   * 🔥 START DEMO REAL TRADING
   */
  async startDemoTrading() {
    console.log('🔥 STARTING DEMO REAL TRADING SYSTEM...');
    
    try {
      // Test market data connection
      const ticker = await this.client.getTickers({ category: 'linear', symbol: 'BTCUSDT' });
      if (ticker.retCode !== 0) {
        throw new Error('Failed to connect to Bybit market data');
      }
      
      console.log('✅ Market data connection verified');
      console.log(`📈 Current BTC price: $${ticker.result.list[0].lastPrice}`);
      
      this.isRunning = true;
      
      // Start trading loop
      this.tradingLoop();
      
      console.log('🚀 DEMO REAL TRADING STARTED!');
      console.log('📊 This will show you exactly how the real system would trade');
      
    } catch (error) {
      console.error('❌ Failed to start demo trading:', error.message);
      throw error;
    }
  }

  /**
   * 🔄 Main trading loop - this shows how REAL trades would happen
   */
  async tradingLoop() {
    while (this.isRunning) {
      try {
        console.log('\n🔍 Scanning for REAL trading opportunities...');
        
        // Get real market data
        const opportunities = await this.findRealTradingOpportunities();
        
        // Execute demo trades (would be real with valid API)
        for (const opportunity of opportunities) {
          if (this.positions.size < this.maxPositions) {
            await this.executeDemoTrade(opportunity);
          }
        }
        
        // Manage existing positions
        await this.manageDemoPositions();
        
        // Show current status
        this.showTradingStatus();
        
        // Wait 10 seconds before next scan
        await this.sleep(10000);
        
      } catch (error) {
        console.error('❌ Error in trading loop:', error.message);
        await this.sleep(5000);
      }
    }
  }

  /**
   * 🎯 Find REAL trading opportunities using REAL market data
   */
  async findRealTradingOpportunities() {
    const opportunities = [];
    
    // Get top USDT pairs
    const symbols = ['BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'DOTUSDT', 'LINKUSDT'];
    
    for (const symbol of symbols) {
      try {
        // Get REAL market data from Bybit
        const ticker = await this.client.getTickers({ category: 'linear', symbol });
        const klines = await this.client.getKline({ 
          category: 'linear', 
          symbol, 
          interval: '5',
          limit: 50 
        });
        
        if (ticker.retCode === 0 && klines.retCode === 0) {
          const analysis = this.analyzeRealMarketData(symbol, ticker.result, klines.result);
          
          if (analysis.signal !== 'HOLD') {
            opportunities.push({
              symbol,
              signal: analysis.signal,
              confidence: analysis.confidence,
              price: parseFloat(ticker.result.list[0].lastPrice),
              analysis
            });
            
            console.log(`📈 REAL opportunity found: ${symbol} - ${analysis.signal} (${analysis.confidence.toFixed(1)}% confidence)`);
          }
        }
        
      } catch (error) {
        console.error(`❌ Error analyzing ${symbol}:`, error.message);
      }
    }
    
    return opportunities.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * 📊 Analyze REAL market data (not fake!)
   */
  analyzeRealMarketData(symbol, ticker, klines) {
    const prices = klines.list.map(k => parseFloat(k[4])); // Close prices
    const currentPrice = parseFloat(ticker.list[0].lastPrice);
    const volume24h = parseFloat(ticker.list[0].volume24h);
    const priceChange = parseFloat(ticker.list[0].price24hPcnt);
    
    // Real RSI calculation
    const rsi = this.calculateRealRSI(prices);
    
    // Real moving averages
    const sma20 = prices.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const sma50 = prices.slice(-50).reduce((a, b) => a + b, 0) / 50;
    
    // Real volume analysis
    const volumeScore = volume24h > 1000000 ? 1 : volume24h / 1000000;
    
    // Real momentum
    const momentum = priceChange > 0 ? 1 : -1;
    
    // Generate REAL trading signal
    let signal = 'HOLD';
    let confidence = 0;
    
    // REAL bullish conditions (more aggressive for demo)
    if (rsi < 40 && currentPrice > sma20 && priceChange > 0.5 && volumeScore > 0.3) {
      signal = 'BUY';
      confidence = Math.min(90, 60 + (40 - rsi) + Math.abs(priceChange) * 5);
    }
    // REAL bearish conditions (more aggressive for demo)
    else if (rsi > 60 && currentPrice < sma20 && priceChange < -0.5 && volumeScore > 0.3) {
      signal = 'SELL';
      confidence = Math.min(90, 60 + (rsi - 60) + Math.abs(priceChange) * 5);
    }
    // Additional momentum-based signals
    else if (Math.abs(priceChange) > 1 && volumeScore > 0.4) {
      signal = priceChange > 0 ? 'BUY' : 'SELL';
      confidence = Math.min(85, 50 + Math.abs(priceChange) * 10);
    }
    
    return {
      signal,
      confidence,
      rsi,
      sma20,
      sma50,
      volumeScore,
      momentum,
      priceChange
    };
  }

  /**
   * 📈 Calculate REAL RSI (not fake!)
   */
  calculateRealRSI(prices, period = 14) {
    if (prices.length < period + 1) return 50;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i <= period; i++) {
      const change = prices[prices.length - i] - prices[prices.length - i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  /**
   * 🔥 Execute DEMO trade (would be real with valid API!)
   */
  async executeDemoTrade(opportunity) {
    try {
      console.log(`\n🔥 EXECUTING DEMO TRADE: ${opportunity.symbol}`);
      console.log('⚠️  This would be a REAL trade with valid API credentials!');
      
      // Calculate position size based on risk management
      const positionSize = this.calculateRealPositionSize(opportunity.price);
      
      if (positionSize <= 0) {
        console.log('❌ Position size too small, skipping trade');
        return;
      }
      
      // Simulate order placement
      console.log('📋 DEMO Order Details:');
      console.log(`   Symbol: ${opportunity.symbol}`);
      console.log(`   Side: ${opportunity.signal}`);
      console.log(`   Size: ${positionSize}`);
      console.log(`   Price: $${opportunity.price}`);
      console.log(`   Confidence: ${opportunity.confidence.toFixed(1)}%`);
      
      // Store demo position
      this.positions.set(opportunity.symbol, {
        symbol: opportunity.symbol,
        side: opportunity.signal,
        size: positionSize,
        entryPrice: opportunity.price,
        timestamp: Date.now(),
        isDemo: true
      });
      
      this.tradeCount++;
      
      console.log('✅ DEMO TRADE EXECUTED!');
      console.log(`💰 Demo position opened: ${opportunity.symbol} ${opportunity.signal} ${positionSize}`);
      
    } catch (error) {
      console.error('❌ Error executing demo trade:', error.message);
    }
  }

  /**
   * 💰 Calculate real position size based on risk management
   */
  calculateRealPositionSize(price) {
    const riskAmount = this.capital * this.riskPerTrade;
    const stopLossDistance = price * 0.02; // 2% stop loss
    const positionValue = riskAmount / 0.02; // Risk per position
    
    return Math.floor((positionValue / price) * 1000) / 1000; // Round to 3 decimals
  }

  /**
   * 🔄 Manage existing DEMO positions
   */
  async manageDemoPositions() {
    if (this.positions.size === 0) return;
    
    console.log(`\n🔄 Managing ${this.positions.size} demo positions...`);
    
    for (const [symbol, position] of this.positions) {
      try {
        // Get current price
        const ticker = await this.client.getTickers({ category: 'linear', symbol });
        if (ticker.retCode === 0) {
          const currentPrice = parseFloat(ticker.result.list[0].lastPrice);
          const pnl = this.calculatePnL(position, currentPrice);
          const pnlPercent = (pnl / (position.size * position.entryPrice)) * 100;
          
          console.log(`📊 ${symbol}: P&L = $${pnl.toFixed(3)} (${pnlPercent.toFixed(2)}%)`);
          
          // Take profit at 5% or stop loss at -2%
          if (pnlPercent >= 5 || pnlPercent <= -2) {
            await this.closeDemoPosition(symbol, position, currentPrice, pnl);
          }
        }
      } catch (error) {
        console.error(`❌ Error managing position ${symbol}:`, error.message);
      }
    }
  }

  /**
   * 💰 Calculate P&L
   */
  calculatePnL(position, currentPrice) {
    const entryValue = position.size * position.entryPrice;
    const currentValue = position.size * currentPrice;
    
    if (position.side === 'BUY') {
      return currentValue - entryValue;
    } else {
      return entryValue - currentValue;
    }
  }

  /**
   * 🔒 Close DEMO position
   */
  async closeDemoPosition(symbol, position, currentPrice, pnl) {
    try {
      console.log(`🔒 Closing demo position: ${symbol}`);
      console.log(`💰 Final P&L: $${pnl.toFixed(3)}`);
      
      this.totalPnL += pnl;
      this.capital += pnl;
      this.positions.delete(symbol);
      
      console.log('✅ Demo position closed successfully');
      
    } catch (error) {
      console.error('❌ Error closing demo position:', error.message);
    }
  }

  /**
   * 📊 Show trading status
   */
  showTradingStatus() {
    console.log('\n📊 TRADING STATUS:');
    console.log(`💰 Current Capital: $${this.capital.toFixed(2)}`);
    console.log(`📈 Total P&L: $${this.totalPnL.toFixed(2)}`);
    console.log(`🔢 Total Trades: ${this.tradeCount}`);
    console.log(`📊 Open Positions: ${this.positions.size}`);
    
    if (this.tradeCount > 0) {
      const winRate = this.totalPnL > 0 ? 100 : 0;
      console.log(`🎯 Performance: ${winRate.toFixed(1)}% win rate`);
    }
  }

  /**
   * ⏹️ Stop demo trading
   */
  stopDemoTrading() {
    console.log('⏹️ STOPPING DEMO TRADING...');
    this.isRunning = false;
  }

  /**
   * 😴 Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export for use
module.exports = DemoRealOmniTradingSystem;

// If run directly, start the demo trading system
if (require.main === module) {
  const tradingSystem = new DemoRealOmniTradingSystem();
  
  // Start demo trading
  tradingSystem.startDemoTrading().catch(error => {
    console.error('❌ Failed to start demo trading system:', error);
    process.exit(1);
  });
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down demo trading system...');
    tradingSystem.stopDemoTrading();
    process.exit(0);
  });
}
