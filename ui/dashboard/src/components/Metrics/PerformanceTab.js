import React from 'react';
import { Grid, Box, Typography, Paper, useTheme, alpha } from '@mui/material';
import MetricCard from './MetricCard';
import MetricChart from './MetricChart';
import MetricProgress from './MetricProgress';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import SpeedIcon from '@mui/icons-material/Speed';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import EqualizerIcon from '@mui/icons-material/Equalizer';

const PerformanceTab = ({ metrics }) => {
  const theme = useTheme();
  
  // Generate performance chart data
  const performanceData = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split('T')[0],
    capital: metrics.initialCapital * (1 + i / 10 + Math.random() * 0.1)
  }));
  
  // Generate daily returns data
  const dailyReturnsData = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split('T')[0],
    return: (Math.random() * 2 - 0.5) * 3 // Random returns between -1.5% and 4.5%
  }));
  
  // Generate drawdown data
  const drawdownData = Array.from({ length: 30 }, (_, i) => {
    const randomDrawdown = Math.random() * metrics.maxDrawdown * -1 * (30 - i) / 30;
    return {
      date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split('T')[0],
      drawdown: randomDrawdown
    };
  });
  
  // Generate volatility data
  const volatilityData = Array.from({ length: 12 }, (_, i) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
    volatility: Math.random() * metrics.volatility * 0.8 + metrics.volatility * 0.2
  }));
  
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
        Detailed Performance Metrics
      </Typography>
      
      <Grid container spacing={3}>
        {/* Top metrics cards */}
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Initial Capital"
            value={metrics.initialCapital}
            unit="USDT"
            color={theme.palette.primary.main}
            icon={AttachMoneyIcon}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Current Capital"
            value={metrics.currentCapital}
            unit="USDT"
            trend={metrics.pnlPercentage > 0 ? 'up' : metrics.pnlPercentage < 0 ? 'down' : 'flat'}
            color={theme.palette.primary.main}
            icon={AttachMoneyIcon}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Absolute P&L"
            value={metrics.pnl}
            unit="USDT"
            trend={metrics.pnl > 0 ? 'up' : metrics.pnl < 0 ? 'down' : 'flat'}
            color={metrics.pnl >= 0 ? theme.palette.success.main : theme.palette.error.main}
            icon={ShowChartIcon}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Percentage P&L"
            value={metrics.pnlPercentage}
            unit="%"
            trend={metrics.pnlPercentage > 0 ? 'up' : metrics.pnlPercentage < 0 ? 'down' : 'flat'}
            color={metrics.pnlPercentage >= 0 ? theme.palette.success.main : theme.palette.error.main}
            icon={ShowChartIcon}
          />
        </Grid>
        
        {/* Performance chart */}
        <Grid item xs={12} md={8}>
          <MetricChart
            title="Capital Growth"
            data={performanceData}
            type="area"
            dataKey="capital"
            xAxisKey="date"
            color={theme.palette.primary.main}
            gradientColor={true}
            height={300}
            description="Capital growth over the last 30 days"
          />
        </Grid>
        
        {/* Daily returns chart */}
        <Grid item xs={12} md={4}>
          <MetricChart
            title="Daily Returns"
            data={dailyReturnsData}
            type="bar"
            dataKey="return"
            xAxisKey="date"
            color={theme.palette.secondary.main}
            height={300}
            description="Daily percentage returns"
          />
        </Grid>
        
        {/* Risk metrics */}
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Sharpe Ratio"
            value={metrics.sharpeRatio}
            trend={metrics.sharpeRatio > 1 ? 'up' : 'flat'}
            color={theme.palette.warning.main}
            icon={SpeedIcon}
            description="Risk-adjusted return measure (higher is better)"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Sortino Ratio"
            value={metrics.sortinoRatio}
            trend={metrics.sortinoRatio > 1 ? 'up' : 'flat'}
            color={theme.palette.warning.main}
            icon={SpeedIcon}
            description="Downside risk-adjusted return measure"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Calmar Ratio"
            value={metrics.calmarRatio}
            trend={metrics.calmarRatio > 1 ? 'up' : 'flat'}
            color={theme.palette.warning.main}
            icon={SpeedIcon}
            description="Return relative to maximum drawdown"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Volatility"
            value={metrics.volatility}
            unit="%"
            trend={metrics.volatility < 15 ? 'down' : 'up'}
            color={theme.palette.info.main}
            icon={TimelineIcon}
            description="Annualized standard deviation of returns"
          />
        </Grid>
        
        {/* Drawdown chart */}
        <Grid item xs={12} md={6}>
          <MetricChart
            title="Drawdown Chart"
            data={drawdownData}
            type="area"
            dataKey="drawdown"
            xAxisKey="date"
            color={theme.palette.error.main}
            gradientColor={true}
            height={300}
            description="Historical drawdown over time (negative values)"
          />
        </Grid>
        
        {/* Volatility chart */}
        <Grid item xs={12} md={6}>
          <MetricChart
            title="Monthly Volatility"
            data={volatilityData}
            type="bar"
            dataKey="volatility"
            xAxisKey="month"
            color={theme.palette.info.main}
            height={300}
            description="Volatility by month"
          />
        </Grid>
        
        {/* Additional metrics */}
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Max Drawdown"
            value={metrics.maxDrawdown}
            unit="%"
            trend="down"
            color={theme.palette.error.main}
            icon={TrendingDownIcon}
            description="Maximum observed loss from a peak to a trough"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Best Trade"
            value={metrics.bestTrade}
            unit="%"
            trend="up"
            color={theme.palette.success.main}
            icon={EqualizerIcon}
            description="Highest return from a single trade"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Worst Trade"
            value={metrics.worstTrade}
            unit="%"
            trend="down"
            color={theme.palette.error.main}
            icon={EqualizerIcon}
            description="Largest loss from a single trade"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default PerformanceTab;
