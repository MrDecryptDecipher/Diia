/**
 * REAL TRADING SYSTEM - NO FAKE METRICS
 * 
 * This is a genuine trading system that:
 * 1. Actually connects to Bybit demo
 * 2. Reports real balance and positions
 * 3. Makes real trades with real results
 * 4. No fake 100% win rates or impossible returns
 */

const { RestClientV5 } = require('bybit-api');
const fs = require('fs');
const path = require('path');

class RealTradingSystem {
  constructor() {
    // Load real credentials
    const envPath = path.join(__dirname, '../../../demo.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    this.apiKey = lines.find(line => line.startsWith('BYBIT_DEMO_API_KEY=')).split('=')[1];
    this.apiSecret = lines.find(line => line.startsWith('BYBIT_DEMO_API_SECRET=')).split('=')[1];
    
    // Initialize Bybit client
    this.client = new RestClientV5({
      key: this.apiKey,
      secret: this.apiSecret,
      demoTrading: true
    });
    
    // Real trading state
    this.state = {
      initialBalance: 0,
      currentBalance: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      totalProfit: 0,
      totalLoss: 0,
      positions: [],
      tradeHistory: [],
      isTrading: false
    };
    
    console.log('🔧 Real Trading System initialized');
    console.log('📊 API Key:', this.apiKey.substring(0, 8) + '...');
  }
  
  /**
   * Get real account balance from Bybit
   */
  async getRealBalance() {
    try {
      const response = await this.client.getWalletBalance({
        accountType: 'UNIFIED'
      });
      
      if (response.retCode === 0) {
        const usdtBalance = response.result.list[0]?.coin?.find(coin => coin.coin === 'USDT');
        if (usdtBalance) {
          this.state.currentBalance = parseFloat(usdtBalance.walletBalance);
          if (this.state.initialBalance === 0) {
            this.state.initialBalance = this.state.currentBalance;
          }
          return this.state.currentBalance;
        }
      }
      
      throw new Error(`Failed to get balance: ${response.retMsg}`);
    } catch (error) {
      console.error('❌ Error getting balance:', error.message);
      return null;
    }
  }
  
  /**
   * Get real positions from Bybit
   */
  async getRealPositions() {
    try {
      const response = await this.client.getPositionInfo({
        category: 'linear'
      });
      
      if (response.retCode === 0) {
        const activePositions = response.result.list.filter(pos => 
          parseFloat(pos.size) > 0
        );
        
        this.state.positions = activePositions.map(pos => ({
          symbol: pos.symbol,
          side: pos.side,
          size: parseFloat(pos.size),
          entryPrice: parseFloat(pos.avgPrice),
          markPrice: parseFloat(pos.markPrice),
          unrealizedPnl: parseFloat(pos.unrealisedPnl),
          percentage: parseFloat(pos.unrealisedPnl) / parseFloat(pos.positionValue) * 100
        }));
        
        return this.state.positions;
      }
      
      throw new Error(`Failed to get positions: ${response.retMsg}`);
    } catch (error) {
      console.error('❌ Error getting positions:', error.message);
      return [];
    }
  }
  
  /**
   * Get real trading history
   */
  async getRealTradeHistory() {
    try {
      const response = await this.client.getExecutionList({
        category: 'linear',
        limit: 50
      });
      
      if (response.retCode === 0) {
        const trades = response.result.list.map(trade => ({
          orderId: trade.orderId,
          symbol: trade.symbol,
          side: trade.side,
          quantity: parseFloat(trade.execQty),
          price: parseFloat(trade.execPrice),
          fee: parseFloat(trade.execFee),
          time: new Date(parseInt(trade.execTime)),
          value: parseFloat(trade.execValue)
        }));
        
        this.state.tradeHistory = trades;
        this.calculateRealStats();
        return trades;
      }
      
      throw new Error(`Failed to get trade history: ${response.retMsg}`);
    } catch (error) {
      console.error('❌ Error getting trade history:', error.message);
      return [];
    }
  }
  
  /**
   * Calculate real trading statistics
   */
  calculateRealStats() {
    const trades = this.state.tradeHistory;
    this.state.totalTrades = trades.length;
    
    // Group trades by order ID to calculate P&L
    const orders = {};
    trades.forEach(trade => {
      if (!orders[trade.orderId]) {
        orders[trade.orderId] = [];
      }
      orders[trade.orderId].push(trade);
    });
    
    let totalProfit = 0;
    let totalLoss = 0;
    let winningTrades = 0;
    let losingTrades = 0;
    
    Object.values(orders).forEach(orderTrades => {
      const totalValue = orderTrades.reduce((sum, trade) => {
        return sum + (trade.side === 'Buy' ? -trade.value : trade.value);
      }, 0);
      
      const totalFees = orderTrades.reduce((sum, trade) => sum + trade.fee, 0);
      const netPnl = totalValue - totalFees;
      
      if (netPnl > 0) {
        totalProfit += netPnl;
        winningTrades++;
      } else if (netPnl < 0) {
        totalLoss += Math.abs(netPnl);
        losingTrades++;
      }
    });
    
    this.state.totalProfit = totalProfit;
    this.state.totalLoss = totalLoss;
    this.state.winningTrades = winningTrades;
    this.state.losingTrades = losingTrades;
  }
  
  /**
   * Place a real trade
   */
  async placeRealTrade(symbol, side, quantity) {
    try {
      console.log(`📈 Placing real trade: ${side} ${quantity} ${symbol}`);
      
      const response = await this.client.submitOrder({
        category: 'linear',
        symbol: symbol,
        side: side,
        orderType: 'Market',
        qty: quantity.toString(),
        timeInForce: 'IOC'
      });
      
      if (response.retCode === 0) {
        console.log(`✅ Trade placed successfully: ${response.result.orderId}`);
        return {
          success: true,
          orderId: response.result.orderId,
          symbol,
          side,
          quantity
        };
      } else {
        console.log(`❌ Trade failed: ${response.retMsg}`);
        return {
          success: false,
          error: response.retMsg
        };
      }
    } catch (error) {
      console.error('❌ Error placing trade:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get real market data
   */
  async getMarketData(symbol) {
    try {
      const response = await this.client.getTickers({
        category: 'linear',
        symbol: symbol
      });
      
      if (response.retCode === 0 && response.result.list.length > 0) {
        const ticker = response.result.list[0];
        return {
          symbol: ticker.symbol,
          price: parseFloat(ticker.lastPrice),
          change24h: parseFloat(ticker.price24hPcnt),
          volume24h: parseFloat(ticker.volume24h),
          high24h: parseFloat(ticker.highPrice24h),
          low24h: parseFloat(ticker.lowPrice24h)
        };
      }
      
      throw new Error(`Failed to get market data: ${response.retMsg}`);
    } catch (error) {
      console.error(`❌ Error getting market data for ${symbol}:`, error.message);
      return null;
    }
  }
  
  /**
   * Simple trading strategy - only trade if conditions are met
   */
  async analyzeAndTrade(symbol) {
    const marketData = await this.getMarketData(symbol);
    if (!marketData) return null;
    
    // Simple strategy: trade if price change is significant
    const priceChange = Math.abs(marketData.change24h);
    const volume = marketData.volume24h;
    
    // Only trade if:
    // 1. Price change > 2%
    // 2. Volume > $1M
    // 3. We have enough balance
    if (priceChange > 2 && volume > 1000000 && this.state.currentBalance > 10) {
      const side = marketData.change24h > 0 ? 'Buy' : 'Sell';
      const quantity = Math.min(10 / marketData.price, this.state.currentBalance * 0.1 / marketData.price);
      
      if (quantity > 0.001) { // Minimum quantity check
        console.log(`🎯 Trading opportunity: ${symbol} ${side} ${quantity.toFixed(4)}`);
        console.log(`📊 Price: $${marketData.price}, Change: ${marketData.change24h.toFixed(2)}%`);
        
        return await this.placeRealTrade(symbol, side, quantity.toFixed(4));
      }
    }
    
    return null;
  }
  
  /**
   * Start real trading
   */
  async startTrading() {
    console.log('🚀 Starting REAL trading system...');
    
    // Get initial state
    await this.getRealBalance();
    await this.getRealPositions();
    await this.getRealTradeHistory();
    
    console.log(`💰 Initial Balance: $${this.state.currentBalance.toFixed(2)}`);
    console.log(`📊 Active Positions: ${this.state.positions.length}`);
    console.log(`📈 Total Trades: ${this.state.totalTrades}`);
    
    this.state.isTrading = true;
    
    // Trading symbols to monitor
    const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'ADAUSDT', 'DOTUSDT'];
    
    // Trading loop
    const tradingInterval = setInterval(async () => {
      if (!this.state.isTrading) {
        clearInterval(tradingInterval);
        return;
      }
      
      console.log('\n🔄 Checking trading opportunities...');
      
      // Update balance and positions
      await this.getRealBalance();
      await this.getRealPositions();
      
      // Check each symbol
      for (const symbol of symbols) {
        try {
          await this.analyzeAndTrade(symbol);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
        } catch (error) {
          console.error(`❌ Error trading ${symbol}:`, error.message);
        }
      }
      
      // Update trade history
      await this.getRealTradeHistory();
      
      // Log current status
      this.logStatus();
      
    }, 30000); // Check every 30 seconds
    
    console.log('✅ Real trading system started');
  }
  
  /**
   * Stop trading
   */
  stopTrading() {
    this.state.isTrading = false;
    console.log('🛑 Trading stopped');
  }
  
  /**
   * Log current status
   */
  logStatus() {
    const netPnl = this.state.totalProfit - this.state.totalLoss;
    const winRate = this.state.totalTrades > 0 ? 
      (this.state.winningTrades / this.state.totalTrades * 100).toFixed(1) : 0;
    
    console.log('\n📊 REAL TRADING STATUS:');
    console.log(`💰 Balance: $${this.state.currentBalance.toFixed(2)}`);
    console.log(`📈 Total Trades: ${this.state.totalTrades}`);
    console.log(`✅ Winning: ${this.state.winningTrades} | ❌ Losing: ${this.state.losingTrades}`);
    console.log(`📊 Win Rate: ${winRate}%`);
    console.log(`💵 Total Profit: $${this.state.totalProfit.toFixed(2)}`);
    console.log(`💸 Total Loss: $${this.state.totalLoss.toFixed(2)}`);
    console.log(`🎯 Net P&L: $${netPnl.toFixed(2)}`);
    console.log(`🔄 Active Positions: ${this.state.positions.length}`);
    
    if (this.state.positions.length > 0) {
      console.log('\n📍 Current Positions:');
      this.state.positions.forEach(pos => {
        console.log(`  ${pos.symbol}: ${pos.side} ${pos.size} @ $${pos.entryPrice} (P&L: $${pos.unrealizedPnl.toFixed(2)})`);
      });
    }
  }
  
  /**
   * Get real status for API
   */
  getStatus() {
    const netPnl = this.state.totalProfit - this.state.totalLoss;
    const winRate = this.state.totalTrades > 0 ? 
      (this.state.winningTrades / this.state.totalTrades * 100) : 0;
    
    return {
      balance: {
        initial: this.state.initialBalance,
        current: this.state.currentBalance,
        change: this.state.currentBalance - this.state.initialBalance,
        changePercent: this.state.initialBalance > 0 ? 
          ((this.state.currentBalance - this.state.initialBalance) / this.state.initialBalance * 100) : 0
      },
      trading: {
        totalTrades: this.state.totalTrades,
        winningTrades: this.state.winningTrades,
        losingTrades: this.state.losingTrades,
        winRate: winRate,
        totalProfit: this.state.totalProfit,
        totalLoss: this.state.totalLoss,
        netPnl: netPnl
      },
      positions: this.state.positions,
      isTrading: this.state.isTrading,
      lastUpdate: new Date().toISOString()
    };
  }
}

module.exports = RealTradingSystem;

// If run directly
if (require.main === module) {
  const trader = new RealTradingSystem();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    trader.stopTrading();
    process.exit(0);
  });
  
  // Start trading
  trader.startTrading().catch(error => {
    console.error('❌ Failed to start trading:', error);
    process.exit(1);
  });
}
