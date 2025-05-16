/**
 * Test script for Trading Strategy Service
 * 
 * This script tests the trading strategy service implementation by initializing
 * the service, starting it, and monitoring its state.
 */

const tradingStrategyService = require('./src/services/trading-strategy-service');

// Initialize and start the trading strategy service
tradingStrategyService.initialize();
tradingStrategyService.start();

// Monitor the trading strategy service state
function monitorTradingStrategy() {
  const state = tradingStrategyService.getTradingState();
  const metrics = tradingStrategyService.getSystemMetrics();
  const activeTrades = tradingStrategyService.getActiveTrades();
  const tradeHistory = tradingStrategyService.getTradeHistory();
  
  console.log('\n=== Trading Strategy State ===');
  console.log(`Active: ${state.isActive}`);
  console.log(`Current Capital: ${state.currentCapital.toFixed(2)} USDT`);
  console.log(`Total Trades: ${state.totalTrades}`);
  console.log(`Successful Trades: ${state.successfulTrades}`);
  console.log(`Total Profit: ${state.totalProfit.toFixed(2)} USDT`);
  console.log(`Open Trades: ${state.openTrades.length}`);
  console.log(`Trade History: ${state.tradeHistory.length}`);
  console.log(`Evolution Stage: ${state.evolutionStage}`);
  
  console.log('\n=== Active Trades ===');
  if (activeTrades.length === 0) {
    console.log('No active trades');
  } else {
    activeTrades.forEach(trade => {
      console.log(`ID: ${trade.id}`);
      console.log(`Symbol: ${trade.symbol}`);
      console.log(`Direction: ${trade.direction}`);
      console.log(`Entry Price: ${trade.entryPrice}`);
      console.log(`Amount: ${trade.amount.toFixed(2)} USDT`);
      console.log(`Leverage: ${trade.leverage}x`);
      console.log(`Entry Time: ${trade.entryTime}`);
      console.log('---');
    });
  }
  
  console.log('\n=== Recent Trade History ===');
  if (tradeHistory.length === 0) {
    console.log('No trade history');
  } else {
    // Show the 5 most recent trades
    tradeHistory.slice(-5).forEach(trade => {
      console.log(`ID: ${trade.id}`);
      console.log(`Symbol: ${trade.symbol}`);
      console.log(`Direction: ${trade.direction}`);
      console.log(`Profit: ${trade.profit.toFixed(2)} USDT`);
      console.log(`Entry Time: ${trade.entryTime}`);
      console.log(`Exit Time: ${trade.exitTime}`);
      console.log('---');
    });
  }
  
  console.log('\n=== System Metrics ===');
  console.log(`Initial Capital: ${metrics.initialCapital.toFixed(2)} USDT`);
  console.log(`Current Capital: ${metrics.currentCapital.toFixed(2)} USDT`);
  console.log(`PnL: ${metrics.pnl.toFixed(2)} USDT (${metrics.pnlPercentage.toFixed(2)}%)`);
  console.log(`Win Rate: ${metrics.winRate.toFixed(2)}%`);
  console.log(`Average Profit Per Trade: ${metrics.averageProfitPerTrade.toFixed(2)} USDT`);
}

// Monitor every 10 seconds
setInterval(monitorTradingStrategy, 10000);

// Initial monitoring
monitorTradingStrategy();

console.log('\nTrading strategy service started. Press Ctrl+C to stop.');

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nStopping trading strategy service...');
  tradingStrategyService.stop();
  process.exit(0);
});
