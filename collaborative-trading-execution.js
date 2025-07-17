/**
 * COLLABORATIVE TRADING EXECUTION
 * 
 * Real trade execution methods for the collaborative system
 */

const logger = require('./ui/dashboard-backend/src/utils/logger');
const bybitClient = require('./ui/dashboard-backend/src/utils/bybit-client');

class CollaborativeTradingExecution {
  
  /**
   * Execute real collaborative trade
   */
  async executeRealCollaborativeTrade(signal) {
    try {
      // Get symbol information
      const symbolInfo = this.state.symbolInfo.get(signal.symbol);
      if (!symbolInfo) {
        return { success: false, error: 'No symbol information available' };
      }
      
      // Calculate proper quantity
      const orderValue = 5.0; // 5 USDT order
      const leverage = 10; // 10x leverage
      const notionalValue = orderValue * leverage; // 50 USDT notional
      
      let quantity = notionalValue / signal.entryPrice;
      
      // Round to symbol's quantity step
      quantity = Math.floor(quantity / symbolInfo.qtyStep) * symbolInfo.qtyStep;
      
      // Ensure minimum quantity
      if (quantity < symbolInfo.minOrderQty) {
        quantity = symbolInfo.minOrderQty;
      }
      
      // Ensure maximum quantity
      if (quantity > symbolInfo.maxOrderQty) {
        quantity = symbolInfo.maxOrderQty;
      }
      
      // Place the order
      const orderParams = {
        category: 'linear',
        symbol: signal.symbol,
        side: signal.signal === 'BUY' ? 'Buy' : 'Sell',
        orderType: 'Market',
        qty: quantity.toString(),
        timeInForce: 'IOC'
      };
      
      const response = await bybitClient.placeOrder(orderParams);
      
      if (response && response.retCode === 0 && response.result?.orderId) {
        return {
          success: true,
          orderId: response.result.orderId,
          quantity: quantity,
          symbol: signal.symbol,
          side: signal.signal === 'BUY' ? 'Buy' : 'Sell'
        };
      } else {
        return {
          success: false,
          error: response?.retMsg || 'Unknown order error'
        };
      }
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Monitor position for take profit and stop loss
   */
  async monitorPosition(symbol) {
    const position = this.state.activePositions.get(symbol);
    if (!position) return;
    
    const monitorInterval = setInterval(async () => {
      try {
        const currentPrice = await this.getCurrentPrice(symbol);
        if (!currentPrice) return;
        
        const signal = position.collaborativeSignal;
        let shouldClose = false;
        let reason = '';
        
        // Check take profit
        if (signal.signal === 'BUY' && currentPrice >= signal.takeProfit) {
          shouldClose = true;
          reason = 'TAKE_PROFIT';
        } else if (signal.signal === 'SELL' && currentPrice <= signal.takeProfit) {
          shouldClose = true;
          reason = 'TAKE_PROFIT';
        }
        
        // Check stop loss
        if (signal.signal === 'BUY' && currentPrice <= signal.stopLoss) {
          shouldClose = true;
          reason = 'STOP_LOSS';
        } else if (signal.signal === 'SELL' && currentPrice >= signal.stopLoss) {
          shouldClose = true;
          reason = 'STOP_LOSS';
        }
        
        // Check time limit (5 minutes max)
        if (Date.now() - position.openTime > 300000) {
          shouldClose = true;
          reason = 'TIME_LIMIT';
        }
        
        if (shouldClose) {
          clearInterval(monitorInterval);
          await this.closeCollaborativePosition(symbol, reason);
        }
        
      } catch (error) {
        logger.error(`❌ Error monitoring position ${symbol}:`, error.message);
      }
    }, 5000); // Check every 5 seconds
  }
  
  /**
   * Close collaborative position
   */
  async closeCollaborativePosition(symbol, reason) {
    const position = this.state.activePositions.get(symbol);
    if (!position) return;
    
    try {
      const closeOrderParams = {
        category: 'linear',
        symbol: symbol,
        side: position.side === 'Buy' ? 'Sell' : 'Buy',
        orderType: 'Market',
        qty: position.quantity.toString(),
        reduceOnly: true,
        timeInForce: 'IOC'
      };
      
      logger.info(`🔄 Closing collaborative position: ${symbol} (${reason})`);
      
      const response = await bybitClient.placeOrder(closeOrderParams);
      
      if (response && response.retCode === 0) {
        logger.info(`✅ Collaborative position closed: ${symbol} - Order ID: ${response.result.orderId}`);
        
        // Calculate actual profit
        const currentPrice = await this.getCurrentPrice(symbol);
        if (currentPrice) {
          const entryPrice = position.entryPrice;
          const priceDiff = position.side === 'Buy' ? 
            currentPrice - entryPrice : 
            entryPrice - currentPrice;
          const actualProfit = (priceDiff / entryPrice) * 5.0 * 10; // 5 USDT order * 10x leverage
          
          this.state.totalProfit += actualProfit;
          
          logger.info(`💰 Collaborative Position P&L: ${actualProfit.toFixed(4)} USDT (Target: ${position.targetProfit} USDT)`);
          logger.info(`   Entry: ${entryPrice}, Exit: ${currentPrice}, Reason: ${reason}`);
          logger.info(`   Signal Confidence: ${(position.collaborativeSignal.confidence * 100).toFixed(1)}%`);
          
          // Check if we hit our target
          if (Math.abs(actualProfit - position.targetProfit) < 0.1) {
            logger.info(`🎯 TARGET HIT! Achieved ${actualProfit.toFixed(4)} USDT profit (Target: ${position.targetProfit} USDT)`);
          }
        }
        
        // Free up capital
        this.state.usedCapital -= 5.0;
        this.state.activePositions.delete(symbol);
        
      } else {
        logger.error(`❌ Failed to close collaborative position ${symbol}: ${response?.retMsg}`);
      }
      
    } catch (error) {
      logger.error(`❌ Error closing collaborative position ${symbol}:`, error);
    }
  }
  
  /**
   * Get current price
   */
  async getCurrentPrice(symbol) {
    try {
      const ticker = await bybitClient.getTicker({
        category: 'linear',
        symbol: symbol
      });
      
      if (ticker && ticker.retCode === 0 && ticker.result?.list?.[0]) {
        return parseFloat(ticker.result.list[0].lastPrice);
      }
      
      return null;
    } catch (error) {
      logger.error(`❌ Error getting price for ${symbol}:`, error);
      return null;
    }
  }
  
  /**
   * Log collaborative status
   */
  logCollaborativeStatus() {
    const winRate = this.state.totalTrades > 0 ? (this.state.successfulTrades / this.state.totalTrades * 100) : 0;
    const dailyProgress = (this.state.totalTrades / this.config.targetTradesPerDay * 100);
    const avgProfitPerTrade = this.state.successfulTrades > 0 ? this.state.totalProfit / this.state.successfulTrades : 0;
    
    logger.info('📊 COLLABORATIVE TRADING SYSTEM STATUS:');
    logger.info(`   Total Trades: ${this.state.totalTrades}/${this.config.targetTradesPerDay} (${dailyProgress.toFixed(1)}%)`);
    logger.info(`   Success Rate: ${winRate.toFixed(1)}%`);
    logger.info(`   Total Profit: ${this.state.totalProfit.toFixed(4)} USDT`);
    logger.info(`   Avg Profit/Trade: ${avgProfitPerTrade.toFixed(4)} USDT (Target: ${this.config.targetProfitPerTrade} USDT)`);
    logger.info(`   Active Positions: ${this.state.activePositions.size}/${this.config.maxPositions}`);
    logger.info(`   Capital Used: ${this.state.usedCapital.toFixed(2)}/${this.config.activeCapital} USDT`);
    logger.info(`   Capital Growth: ${((this.config.totalCapital + this.state.totalProfit) / this.config.totalCapital * 100 - 100).toFixed(2)}%`);
    
    if (this.state.orderHistory.length > 0) {
      const lastOrder = this.state.orderHistory[this.state.orderHistory.length - 1];
      logger.info(`   Last Order: ${lastOrder.orderId} - ${lastOrder.symbol} ${lastOrder.side}`);
      logger.info(`   Last Signal: ${lastOrder.collaborativeSignal?.signal} (${(lastOrder.collaborativeSignal?.confidence * 100).toFixed(1)}%)`);
    }
    
    // Log collaborative signals status
    let signalCount = 0;
    let strongSignals = 0;
    
    for (const symbol of this.assets) {
      const signal = this.state.collaborativeSignals.get(symbol);
      if (signal) {
        signalCount++;
        if (signal.confidence > 0.75) {
          strongSignals++;
          logger.info(`   ${symbol}: ${signal.signal} (${(signal.confidence * 100).toFixed(1)}%) - Entry: ${signal.entryPrice}, TP: ${signal.takeProfit}`);
        }
      }
    }
    
    logger.info(`   Collaborative Signals: ${signalCount}/${this.assets.length} active, ${strongSignals} strong (>75%)`);
  }
  
  /**
   * Stop collaborative system
   */
  async stop() {
    logger.info('🛑 Stopping Collaborative Trading System');
    
    this.state.isActive = false;
    
    if (this.tradingInterval) {
      clearInterval(this.tradingInterval);
      this.tradingInterval = null;
    }
    
    if (this.dataUpdateInterval) {
      clearInterval(this.dataUpdateInterval);
      this.dataUpdateInterval = null;
    }
    
    // Close all active positions
    for (const symbol of this.state.activePositions.keys()) {
      await this.closeCollaborativePosition(symbol, 'SYSTEM_STOP');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    logger.info('✅ Collaborative Trading System stopped');
    logger.info(`📊 Final Results: ${this.state.totalTrades} trades, ${this.state.totalProfit.toFixed(4)} USDT profit`);
  }
}

module.exports = CollaborativeTradingExecution;
