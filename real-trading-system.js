/**
 * 🚀 REAL OMNI TRADING SYSTEM
 * 
 * This is a REAL trading system that will actually place trades on your Bybit account.
 * No more fake analysis - this will use real money and make real trades!
 */

const { RestClientV5 } = require('bybit-api');
require('dotenv').config();

class RealOmniTradingSystem {
  constructor() {
    // REAL Bybit client for REAL trading
    this.client = new RestClientV5({
      key: process.env.BYBIT_API_KEY,
      secret: process.env.BYBIT_API_SECRET,
      testnet: process.env.BYBIT_TESTNET === 'true'
    });
    
    this.isRunning = false;
    this.positions = new Map();
    this.capital = 12.0; // Your 12 USDT capital
    this.maxPositions = 5;
    this.riskPerTrade = 0.02; // 2% risk per trade
    
    console.log('🚀 REAL OMNI Trading System initialized');
    console.log(`💰 Capital: ${this.capital} USDT`);
    console.log(`📊 Max positions: ${this.maxPositions}`);
  }

  /**
   * 🔥 START REAL TRADING
   */
  async startRealTrading() {
    console.log('🔥 STARTING REAL TRADING SYSTEM...');
    
    try {
      // Verify API connection
      const accountInfo = await this.client.getWalletBalance({ accountType: 'UNIFIED' });
      console.log('✅ API connection verified');
      
      // Get available balance
      const balance = await this.getRealBalance();
      console.log(`💰 Available balance: ${balance} USDT`);
      
      this.isRunning = true;
      
      // Start trading loop
      this.tradingLoop();
      
      console.log('🚀 REAL TRADING STARTED!');
      
    } catch (error) {
      console.error('❌ Failed to start real trading:', error.message);
      throw error;
    }
  }

  /**
   * 💰 Get real balance from Bybit
   */
  async getRealBalance() {
    try {
      const response = await this.client.getWalletBalance({ accountType: 'UNIFIED' });
      
      if (response.retCode === 0 && response.result?.list?.[0]?.coin) {
        const usdtCoin = response.result.list[0].coin.find(coin => coin.coin === 'USDT');
        if (usdtCoin) {
          return parseFloat(usdtCoin.walletBalance);
        }
      }
      
      return 0;
    } catch (error) {
      console.error('❌ Error getting balance:', error.message);
      return 0;
    }
  }

  /**
   * 🔄 Main trading loop - this is where REAL trades happen
   */
  async tradingLoop() {
    while (this.isRunning) {
      try {
        console.log('\n🔍 Scanning for REAL trading opportunities...');
        
        // Get real market data
        const opportunities = await this.findRealTradingOpportunities();
        
        // Execute real trades
        for (const opportunity of opportunities) {
          if (this.positions.size < this.maxPositions) {
            await this.executeRealTrade(opportunity);
          }
        }
        
        // Manage existing positions
        await this.manageRealPositions();
        
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
            
            console.log(`📈 REAL opportunity found: ${symbol} - ${analysis.signal} (${analysis.confidence}% confidence)`);
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
    
    // REAL bullish conditions
    if (rsi < 30 && currentPrice > sma20 && priceChange > 2 && volumeScore > 0.5) {
      signal = 'BUY';
      confidence = Math.min(90, 60 + (30 - rsi) + Math.abs(priceChange) * 5);
    }
    // REAL bearish conditions  
    else if (rsi > 70 && currentPrice < sma20 && priceChange < -2 && volumeScore > 0.5) {
      signal = 'SELL';
      confidence = Math.min(90, 60 + (rsi - 70) + Math.abs(priceChange) * 5);
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
   * 🔥 Execute REAL trade on Bybit (this will use real money!)
   */
  async executeRealTrade(opportunity) {
    try {
      console.log(`\n🔥 EXECUTING REAL TRADE: ${opportunity.symbol}`);
      
      // Calculate position size based on risk management
      const positionSize = this.calculateRealPositionSize(opportunity.price);
      
      if (positionSize <= 0) {
        console.log('❌ Position size too small, skipping trade');
        return;
      }
      
      // Place REAL order on Bybit
      const orderParams = {
        category: 'linear',
        symbol: opportunity.symbol,
        side: opportunity.signal === 'BUY' ? 'Buy' : 'Sell',
        orderType: 'Market',
        qty: positionSize.toString(),
        timeInForce: 'IOC'
      };
      
      console.log('📋 Order params:', orderParams);
      
      // PLACE THE REAL ORDER
      const orderResponse = await this.client.submitOrder(orderParams);
      
      if (orderResponse.retCode === 0) {
        console.log('✅ REAL ORDER PLACED SUCCESSFULLY!');
        console.log('📊 Order ID:', orderResponse.result.orderId);
        
        // Store position
        this.positions.set(opportunity.symbol, {
          symbol: opportunity.symbol,
          side: opportunity.signal,
          size: positionSize,
          entryPrice: opportunity.price,
          orderId: orderResponse.result.orderId,
          timestamp: Date.now()
        });
        
        console.log(`💰 Position opened: ${opportunity.symbol} ${opportunity.signal} ${positionSize}`);
        
      } else {
        console.error('❌ Order failed:', orderResponse.retMsg);
      }
      
    } catch (error) {
      console.error('❌ Error executing real trade:', error.message);
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
   * 🔄 Manage existing REAL positions
   */
  async manageRealPositions() {
    if (this.positions.size === 0) return;
    
    console.log(`\n🔄 Managing ${this.positions.size} real positions...`);
    
    try {
      // Get current positions from Bybit
      const positionsResponse = await this.client.getPositionInfo({ category: 'linear' });
      
      if (positionsResponse.retCode === 0) {
        const realPositions = positionsResponse.result.list.filter(p => parseFloat(p.size) > 0);
        
        for (const realPos of realPositions) {
          const symbol = realPos.symbol;
          const unrealizedPnl = parseFloat(realPos.unrealisedPnl);
          const currentPrice = parseFloat(realPos.markPrice);
          
          console.log(`📊 ${symbol}: P&L = $${unrealizedPnl.toFixed(3)}`);
          
          // Check for stop loss or take profit
          const localPos = this.positions.get(symbol);
          if (localPos) {
            const pnlPercent = (unrealizedPnl / (localPos.size * localPos.entryPrice)) * 100;
            
            // Take profit at 5% or stop loss at -2%
            if (pnlPercent >= 5 || pnlPercent <= -2) {
              await this.closeRealPosition(symbol, realPos);
            }
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Error managing positions:', error.message);
    }
  }

  /**
   * 🔒 Close REAL position
   */
  async closeRealPosition(symbol, position) {
    try {
      console.log(`🔒 Closing real position: ${symbol}`);
      
      const closeOrder = {
        category: 'linear',
        symbol: symbol,
        side: position.side === 'Buy' ? 'Sell' : 'Buy',
        orderType: 'Market',
        qty: position.size,
        timeInForce: 'IOC',
        reduceOnly: true
      };
      
      const response = await this.client.submitOrder(closeOrder);
      
      if (response.retCode === 0) {
        console.log('✅ Position closed successfully');
        this.positions.delete(symbol);
      } else {
        console.error('❌ Failed to close position:', response.retMsg);
      }
      
    } catch (error) {
      console.error('❌ Error closing position:', error.message);
    }
  }

  /**
   * ⏹️ Stop real trading
   */
  stopRealTrading() {
    console.log('⏹️ STOPPING REAL TRADING...');
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
module.exports = RealOmniTradingSystem;

// If run directly, start the real trading system
if (require.main === module) {
  const tradingSystem = new RealOmniTradingSystem();
  
  // Start real trading
  tradingSystem.startRealTrading().catch(error => {
    console.error('❌ Failed to start real trading system:', error);
    process.exit(1);
  });
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down real trading system...');
    tradingSystem.stopRealTrading();
    process.exit(0);
  });
}
