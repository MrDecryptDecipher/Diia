import React from 'react';
import { Grid, Box, Typography, Paper, useTheme, alpha } from '@mui/material';
import MetricCard from './MetricCard';
import MetricChart from './MetricChart';
import MetricProgress from './MetricProgress';
import PercentIcon from '@mui/icons-material/Percent';
import BarChartIcon from '@mui/icons-material/BarChart';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SpeedIcon from '@mui/icons-material/Speed';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import BalanceIcon from '@mui/icons-material/Balance';

const TradeMetricsTab = ({ metrics }) => {
  const theme = useTheme();
  
  // Generate win/loss data
  const winLossData = [
    { name: 'Winning', value: metrics.winningTrades, color: theme.palette.success.main },
    { name: 'Losing', value: metrics.losingTrades, color: theme.palette.error.main }
  ];
  
  // Generate profit/loss distribution data
  const profitLossDistribution = Array.from({ length: 20 }, (_, i) => {
    const value = -10 + i;
    let frequency;
    
    // Create a normal-ish distribution with positive skew
    if (value < 0) {
      frequency = Math.max(0, Math.floor(metrics.losingTrades * 0.1 * Math.exp(-Math.pow(value + 2, 2) / 8)));
    } else {
      frequency = Math.max(0, Math.floor(metrics.winningTrades * 0.1 * Math.exp(-Math.pow(value - 5, 2) / 20)));
    }
    
    return {
      returnRange: value < 0 ? `${value}%` : `+${value}%`,
      frequency,
      color: value < 0 ? theme.palette.error.main : theme.palette.success.main
    };
  });
  
  // Generate trade duration data
  const tradeDurationData = [
    { duration: '<1h', count: Math.floor(Math.random() * metrics.totalTrades * 0.2) },
    { duration: '1-4h', count: Math.floor(Math.random() * metrics.totalTrades * 0.3) },
    { duration: '4-12h', count: Math.floor(Math.random() * metrics.totalTrades * 0.25) },
    { duration: '12-24h', count: Math.floor(Math.random() * metrics.totalTrades * 0.15) },
    { duration: '>24h', count: Math.floor(Math.random() * metrics.totalTrades * 0.1) }
  ];
  
  // Generate trade frequency data
  const tradeFrequencyData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - 6 + i);
    return {
      day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()],
      trades: Math.floor(Math.random() * 10 + 1)
    };
  });
  
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
        Trade Performance Analysis
      </Typography>
      
      <Grid container spacing={3}>
        {/* Top metrics cards */}
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Trades"
            value={metrics.totalTrades}
            trend="up"
            color={theme.palette.secondary.main}
            icon={BarChartIcon}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Win Rate"
            value={metrics.winRate}
            unit="%"
            trend={metrics.winRate > 50 ? 'up' : metrics.winRate < 50 ? 'down' : 'flat'}
            color={theme.palette.info.main}
            icon={PercentIcon}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Profit Factor"
            value={metrics.profitFactor}
            trend={metrics.profitFactor > 1 ? 'up' : 'down'}
            color={theme.palette.success.main}
            icon={BalanceIcon}
            description="Gross profit / Gross loss"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Expectancy"
            value={metrics.expectancy}
            unit="USDT"
            trend={metrics.expectancy > 0 ? 'up' : 'down'}
            color={theme.palette.warning.main}
            icon={SpeedIcon}
            description="Expected return per trade"
          />
        </Grid>
        
        {/* Win/Loss chart */}
        <Grid item xs={12} md={4}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 2, 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: theme.shadows[8],
              }
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Win/Loss Distribution
            </Typography>
            
            <Box sx={{ display: 'flex', height: 300, alignItems: 'center', justifyContent: 'center' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mx: 2 }}>
                <Typography variant="h5" sx={{ color: theme.palette.success.main, fontWeight: 'bold' }}>
                  {metrics.winningTrades}
                </Typography>
                <Box 
                  sx={{ 
                    width: 100, 
                    height: metrics.winRate * 2, 
                    backgroundColor: theme.palette.success.main,
                    borderRadius: 1,
                    mb: 1
                  }} 
                />
                <Typography variant="body2">Winning</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mx: 2 }}>
                <Typography variant="h5" sx={{ color: theme.palette.error.main, fontWeight: 'bold' }}>
                  {metrics.losingTrades}
                </Typography>
                <Box 
                  sx={{ 
                    width: 100, 
                    height: (100 - metrics.winRate) * 2, 
                    backgroundColor: theme.palette.error.main,
                    borderRadius: 1,
                    mb: 1
                  }} 
                />
                <Typography variant="body2">Losing</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        
        {/* Profit/Loss distribution */}
        <Grid item xs={12} md={8}>
          <MetricChart
            title="Profit/Loss Distribution"
            data={profitLossDistribution}
            type="bar"
            dataKey="frequency"
            xAxisKey="returnRange"
            color={theme.palette.primary.main}
            height={300}
            description="Distribution of trade returns by percentage"
          />
        </Grid>
        
        {/* Average metrics */}
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Avg. Profit per Trade"
            value={metrics.averageProfitPerTrade}
            unit="%"
            trend="up"
            color={theme.palette.success.main}
            icon={TrendingUpIcon}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Avg. Loss per Trade"
            value={metrics.averageLossPerTrade}
            unit="%"
            trend="down"
            color={theme.palette.error.main}
            icon={TrendingDownIcon}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Avg. Holding Time"
            value={metrics.averageTradeHoldingTime}
            trend="flat"
            color={theme.palette.info.main}
            icon={AccessTimeIcon}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Trading Frequency"
            value={metrics.tradingFrequency}
            trend="up"
            color={theme.palette.secondary.main}
            icon={BarChartIcon}
          />
        </Grid>
        
        {/* Trade duration chart */}
        <Grid item xs={12} md={6}>
          <MetricChart
            title="Trade Duration Distribution"
            data={tradeDurationData}
            type="bar"
            dataKey="count"
            xAxisKey="duration"
            color={theme.palette.info.main}
            height={300}
            description="Distribution of trades by duration"
          />
        </Grid>
        
        {/* Trade frequency chart */}
        <Grid item xs={12} md={6}>
          <MetricChart
            title="Daily Trading Frequency"
            data={tradeFrequencyData}
            type="bar"
            dataKey="trades"
            xAxisKey="day"
            color={theme.palette.secondary.main}
            height={300}
            description="Number of trades per day"
          />
        </Grid>
        
        {/* Risk metrics */}
        <Grid item xs={12} sm={6} md={4}>
          <MetricProgress
            title="Risk/Reward Ratio"
            value={metrics.riskRewardRatio}
            maxValue={5}
            color={theme.palette.warning.main}
            description="Average profit / Average loss (higher is better)"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <MetricProgress
            title="Zero Loss Enforcement"
            value={metrics.zeroLossEnforcementEfficiency}
            maxValue={100}
            color={theme.palette.success.main}
            description="Efficiency of the zero loss enforcement system"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <MetricProgress
            title="Anti-Loss Hedging"
            value={metrics.antiLossHedgingEfficiency}
            maxValue={100}
            color={theme.palette.error.main}
            description="Efficiency of the anti-loss hedging system"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default TradeMetricsTab;
