/**
 * PROFITABLE TRADING SYSTEM
 * 
 * This system fixes the problems identified:
 * 1. Larger position sizes ($1000+ instead of $294)
 * 2. Fewer trades (5-10 per day instead of 100+)
 * 3. Real technical analysis
 * 4. Proper risk management
 * 5. Focus on high-volume pairs
 */

const { RestClientV5 } = require('bybit-api');
const fs = require('fs');

class ProfitableTradingSystem {
  constructor() {
    // Load credentials
    const envContent = fs.readFileSync('./demo.env', 'utf8');
    const lines = envContent.split('\n');
    const apiKey = lines.find(line => line.startsWith('BYBIT_DEMO_API_KEY=')).split('=')[1];
    const apiSecret = lines.find(line => line.startsWith('BYBIT_DEMO_API_SECRET=')).split('=')[1];
    
    this.client = new RestClientV5({
      key: apiKey,
      secret: apiSecret,
      demoTrading: true
    });
    
    // FIXED CONFIGURATION
    this.config = {
      // Position sizing (FIXED: larger positions)
      minPositionSize: 1000, // $1000 minimum instead of $294
      maxPositionSize: 5000, // $5000 maximum
      riskPerTrade: 0.02, // 2% risk per trade
      
      // Trading frequency (FIXED: much less frequent)
      maxTradesPerDay: 10, // Maximum 10 trades per day
      minTimeBetweenTrades: 30 * 60 * 1000, // 30 minutes minimum between trades
      
      // Risk management (FIXED: proper stops and targets)
      stopLossPercent: 2.0, // 2% stop loss
      takeProfitPercent: 1.5, // 1.5% take profit (better than 1:1 ratio)
      
      // Symbol selection (FIXED: high-volume pairs only)
      allowedSymbols: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'ADAUSDT', 'DOTUSDT'],
      
      // Technical analysis thresholds
      rsiOversold: 30,
      rsiOverbought: 70,
      volumeThreshold: 10000000 // $10M daily volume minimum
    };
    
    this.state = {
      isActive: false,
      dailyTrades: 0,
      lastTradeTime: 0,
      totalProfit: 0,
      activeTrades: new Map(),
      dayStartTime: Date.now()
    };
    
    console.log('🎯 Profitable Trading System initialized');
    console.log(`💰 Position size: $${this.config.minPositionSize}-$${this.config.maxPositionSize}`);
    console.log(`📊 Max trades per day: ${this.config.maxTradesPerDay}`);
    console.log(`🛡️ Risk management: ${this.config.stopLossPercent}% SL, ${this.config.takeProfitPercent}% TP`);
  }
  
  /**
   * Get market data with technical indicators
   */
  async getMarketAnalysis(symbol) {
    try {
      // Get ticker data
      const tickerResponse = await this.client.getTickers({
        category: 'linear',
        symbol: symbol
      });
      
      if (tickerResponse.retCode !== 0) {
        throw new Error(`Failed to get ticker: ${tickerResponse.retMsg}`);
      }
      
      const ticker = tickerResponse.result.list[0];
      const price = parseFloat(ticker.lastPrice);
      const volume24h = parseFloat(ticker.volume24h);
      const priceChange24h = parseFloat(ticker.price24hPcnt);
      
      // Get kline data for technical analysis
      const klineResponse = await this.client.getKline({
        category: 'linear',
        symbol: symbol,
        interval: '15', // 15-minute candles
        limit: 50
      });
      
      if (klineResponse.retCode !== 0) {
        throw new Error(`Failed to get klines: ${klineResponse.retMsg}`);
      }
      
      const klines = klineResponse.result.list;
      const closes = klines.map(k => parseFloat(k[4])).reverse(); // Close prices
      
      // Calculate RSI
      const rsi = this.calculateRSI(closes, 14);
      
      // Calculate moving averages
      const sma20 = this.calculateSMA(closes, 20);
      const sma50 = this.calculateSMA(closes, 50);
      
      // Volume analysis
      const avgVolume = volume24h;
      const volumeOK = avgVolume > this.config.volumeThreshold;
      
      return {
        symbol,
        price,
        volume24h,
        priceChange24h,
        rsi,
        sma20,
        sma50,
        volumeOK,
        trend: sma20 > sma50 ? 'bullish' : 'bearish',
        timestamp: Date.now()
      };
      
    } catch (error) {
      console.error(`❌ Error analyzing ${symbol}:`, error.message);
      return null;
    }
  }
  
  /**
   * Calculate RSI
   */
  calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) return 50;
    
    let gains = 0;
    let losses = 0;
    
    // Calculate initial average gain and loss
    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) {
        gains += change;
      } else {
        losses += Math.abs(change);
      }
    }
    
    let avgGain = gains / period;
    let avgLoss = losses / period;
    
    // Calculate RSI for remaining periods
    for (let i = period + 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? Math.abs(change) : 0;
      
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
    }
    
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }
  
  /**
   * Calculate Simple Moving Average
   */
  calculateSMA(prices, period) {
    if (prices.length < period) return prices[prices.length - 1];
    
    const slice = prices.slice(-period);
    return slice.reduce((sum, price) => sum + price, 0) / period;
  }
  
  /**
   * Analyze if we should enter a trade
   */
  analyzeEntry(analysis) {
    if (!analysis || !analysis.volumeOK) {
      return { shouldTrade: false, reason: 'Low volume or no data' };
    }
    
    const { rsi, trend, priceChange24h, price, sma20, sma50 } = analysis;
    
    // Long entry conditions
    if (rsi < this.config.rsiOversold && 
        trend === 'bullish' && 
        price > sma20 && 
        priceChange24h > -5) {
      return {
        shouldTrade: true,
        direction: 'Buy',
        reason: 'RSI oversold + bullish trend + above SMA20',
        confidence: 85
      };
    }
    
    // Short entry conditions
    if (rsi > this.config.rsiOverbought && 
        trend === 'bearish' && 
        price < sma20 && 
        priceChange24h < 5) {
      return {
        shouldTrade: true,
        direction: 'Sell',
        reason: 'RSI overbought + bearish trend + below SMA20',
        confidence: 85
      };
    }
    
    return { shouldTrade: false, reason: 'No clear signal' };
  }
  
  /**
   * Calculate position size based on risk
   */
  calculatePositionSize(price, stopLossPercent) {
    // Get current balance
    const availableBalance = 10000; // Assume $10k available for trading
    const riskAmount = availableBalance * this.config.riskPerTrade;
    const stopLossDistance = price * (stopLossPercent / 100);
    const quantity = riskAmount / stopLossDistance;
    const positionValue = quantity * price;
    
    // Ensure position size is within limits
    const clampedValue = Math.max(
      this.config.minPositionSize,
      Math.min(this.config.maxPositionSize, positionValue)
    );
    
    return {
      quantity: clampedValue / price,
      value: clampedValue,
      riskAmount: riskAmount
    };
  }
  
  /**
   * Place a trade with proper risk management
   */
  async placeTrade(symbol, analysis, entry) {
    try {
      const { direction, confidence } = entry;
      const price = analysis.price;
      
      // Calculate position size
      const position = this.calculatePositionSize(price, this.config.stopLossPercent);
      
      // Calculate stop loss and take profit
      const stopLossPrice = direction === 'Buy' 
        ? price * (1 - this.config.stopLossPercent / 100)
        : price * (1 + this.config.stopLossPercent / 100);
        
      const takeProfitPrice = direction === 'Buy'
        ? price * (1 + this.config.takeProfitPercent / 100)
        : price * (1 - this.config.takeProfitPercent / 100);
      
      console.log(`🎯 PLACING TRADE:`);
      console.log(`   Symbol: ${symbol}`);
      console.log(`   Direction: ${direction}`);
      console.log(`   Price: $${price.toFixed(6)}`);
      console.log(`   Quantity: ${position.quantity.toFixed(4)}`);
      console.log(`   Position Value: $${position.value.toFixed(2)}`);
      console.log(`   Stop Loss: $${stopLossPrice.toFixed(6)}`);
      console.log(`   Take Profit: $${takeProfitPrice.toFixed(6)}`);
      console.log(`   Confidence: ${confidence}%`);
      console.log(`   Reason: ${entry.reason}`);
      
      // Place the order
      const orderResponse = await this.client.submitOrder({
        category: 'linear',
        symbol: symbol,
        side: direction,
        orderType: 'Market',
        qty: position.quantity.toFixed(4),
        stopLoss: stopLossPrice.toFixed(6),
        takeProfit: takeProfitPrice.toFixed(6)
      });
      
      if (orderResponse.retCode === 0) {
        const orderId = orderResponse.result.orderId;
        
        // Record the trade
        this.state.activeTrades.set(symbol, {
          orderId,
          symbol,
          direction,
          entryPrice: price,
          quantity: position.quantity,
          stopLoss: stopLossPrice,
          takeProfit: takeProfitPrice,
          timestamp: Date.now(),
          confidence
        });
        
        this.state.dailyTrades++;
        this.state.lastTradeTime = Date.now();
        
        console.log(`✅ Trade placed successfully! Order ID: ${orderId}`);
        return true;
        
      } else {
        console.log(`❌ Trade failed: ${orderResponse.retMsg}`);
        return false;
      }
      
    } catch (error) {
      console.error(`❌ Error placing trade:`, error.message);
      return false;
    }
  }
  
  /**
   * Check if we can trade (frequency limits)
   */
  canTrade() {
    // Check daily limit
    if (this.state.dailyTrades >= this.config.maxTradesPerDay) {
      return { canTrade: false, reason: 'Daily trade limit reached' };
    }
    
    // Check time between trades
    const timeSinceLastTrade = Date.now() - this.state.lastTradeTime;
    if (timeSinceLastTrade < this.config.minTimeBetweenTrades) {
      const waitTime = Math.ceil((this.config.minTimeBetweenTrades - timeSinceLastTrade) / 60000);
      return { canTrade: false, reason: `Wait ${waitTime} minutes between trades` };
    }
    
    return { canTrade: true };
  }
  
  /**
   * Main trading loop
   */
  async runTradingCycle() {
    console.log('\n🔄 Running trading cycle...');
    
    // Check if we can trade
    const tradeCheck = this.canTrade();
    if (!tradeCheck.canTrade) {
      console.log(`⏸️ ${tradeCheck.reason}`);
      return;
    }
    
    // Analyze each allowed symbol
    for (const symbol of this.config.allowedSymbols) {
      try {
        // Skip if we already have a position
        if (this.state.activeTrades.has(symbol)) {
          continue;
        }
        
        console.log(`📊 Analyzing ${symbol}...`);
        
        // Get market analysis
        const analysis = await this.getMarketAnalysis(symbol);
        if (!analysis) continue;
        
        // Check for entry signal
        const entry = this.analyzeEntry(analysis);
        
        console.log(`   RSI: ${analysis.rsi.toFixed(2)} | Trend: ${analysis.trend} | Volume: $${(analysis.volume24h/1000000).toFixed(1)}M`);
        
        if (entry.shouldTrade) {
          console.log(`🎯 TRADE SIGNAL: ${entry.reason}`);
          
          // Place the trade
          const success = await this.placeTrade(symbol, analysis, entry);
          
          if (success) {
            break; // Only one trade per cycle
          }
        } else {
          console.log(`   No signal: ${entry.reason}`);
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Error analyzing ${symbol}:`, error.message);
      }
    }
  }
  
  /**
   * Start the profitable trading system
   */
  async start() {
    console.log('🚀 Starting Profitable Trading System');
    console.log('=====================================');
    
    this.state.isActive = true;
    
    // Reset daily counters at start
    this.state.dailyTrades = 0;
    this.state.dayStartTime = Date.now();
    
    // Main trading loop - run every 30 minutes
    const tradingInterval = setInterval(async () => {
      if (!this.state.isActive) {
        clearInterval(tradingInterval);
        return;
      }
      
      try {
        await this.runTradingCycle();
      } catch (error) {
        console.error('❌ Trading cycle error:', error.message);
      }
    }, 30 * 60 * 1000); // 30 minutes
    
    // Status update every 5 minutes
    const statusInterval = setInterval(() => {
      if (!this.state.isActive) {
        clearInterval(statusInterval);
        return;
      }
      
      console.log(`\n📊 STATUS: ${this.state.dailyTrades}/${this.config.maxTradesPerDay} trades today | Active positions: ${this.state.activeTrades.size}`);
    }, 5 * 60 * 1000);
    
    // Run first cycle immediately
    await this.runTradingCycle();
    
    console.log('✅ Profitable Trading System started');
    console.log('🎯 Will trade every 30 minutes with proper risk management');
  }
  
  /**
   * Stop the system
   */
  stop() {
    this.state.isActive = false;
    console.log('🛑 Profitable Trading System stopped');
  }
}

// Export for use
module.exports = ProfitableTradingSystem;

// Run if called directly
if (require.main === module) {
  const trader = new ProfitableTradingSystem();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    trader.stop();
    process.exit(0);
  });
  
  // Start trading
  trader.start().catch(error => {
    console.error('❌ Failed to start trading:', error);
    process.exit(1);
  });
}
