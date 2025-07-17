import React from 'react';
import { Grid, Box, Typography, useTheme } from '@mui/material';
import MetricCard from './MetricCard';
import MetricChart from './MetricChart';
import MetricProgress from './MetricProgress';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PercentIcon from '@mui/icons-material/Percent';
import BarChartIcon from '@mui/icons-material/BarChart';
import SpeedIcon from '@mui/icons-material/Speed';
import MemoryIcon from '@mui/icons-material/Memory';
import BoltIcon from '@mui/icons-material/Bolt';

const OverviewTab = ({ metrics, performance }) => {
  const theme = useTheme();

  // Handle null/undefined metrics
  if (!metrics) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Typography variant="h6" color="text.secondary">
          Loading metrics data...
        </Typography>
      </Box>
    );
  }

  // Generate performance chart data
  const performanceData = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split('T')[0],
    capital: (metrics.initialCapital || 12) * (1 + i / 10 + Math.random() * 0.1)
  }));

  // Generate win rate data
  const winRateData = [
    { name: 'Winning', value: metrics.winningTrades || 0 },
    { name: 'Losing', value: metrics.losingTrades || 0 }
  ];
  
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
        System Performance Overview
      </Typography>
      
      <Grid container spacing={3}>
        {/* Top metrics cards */}
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Current Capital"
            value={metrics.currentCapital || 0}
            unit="USDT"
            trend={(metrics.pnlPercentage || 0) > 0 ? 'up' : (metrics.pnlPercentage || 0) < 0 ? 'down' : 'flat'}
            color={theme.palette.primary.main}
            icon={AttachMoneyIcon}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Profit & Loss"
            value={metrics.pnlPercentage || 0}
            unit="%"
            trend={(metrics.pnlPercentage || 0) > 0 ? 'up' : (metrics.pnlPercentage || 0) < 0 ? 'down' : 'flat'}
            color={(metrics.pnlPercentage || 0) >= 0 ? theme.palette.success.main : theme.palette.error.main}
            icon={ShowChartIcon}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Win Rate"
            value={metrics.winRate || 0}
            unit="%"
            trend={(metrics.winRate || 0) > 50 ? 'up' : (metrics.winRate || 0) < 50 ? 'down' : 'flat'}
            color={theme.palette.info.main}
            icon={PercentIcon}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Trades"
            value={metrics.totalTrades || 0}
            trend="up"
            color={theme.palette.secondary.main}
            icon={BarChartIcon}
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
        
        {/* Win rate chart */}
        <Grid item xs={12} md={4}>
          <MetricProgress
            title="System Efficiency"
            value={metrics.systemEfficiency || 0}
            maxValue={100}
            type="circular"
            color={theme.palette.success.main}
            description="Overall system efficiency score"
            size="large"
          />
        </Grid>

        {/* Advanced metrics */}
        <Grid item xs={12} sm={6} md={4}>
          <MetricProgress
            title="Quantum Prediction Accuracy"
            value={metrics.quantumPredictionAccuracy || 0}
            maxValue={100}
            color={theme.palette.info.main}
            description="Accuracy of quantum-based predictions"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <MetricProgress
            title="Hyperdimensional Pattern Accuracy"
            value={metrics.hyperdimensionalPatternAccuracy || 0}
            maxValue={100}
            color={theme.palette.secondary.main}
            description="Accuracy of hyperdimensional pattern recognition"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <MetricProgress
            title="Zero Loss Enforcement Efficiency"
            value={metrics.zeroLossEnforcementEfficiency || 0}
            maxValue={100}
            color={theme.palette.success.dark}
            description="Efficiency of the zero loss enforcement system"
          />
        </Grid>
        
        {/* Additional metrics */}
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Sharpe Ratio"
            value={metrics.sharpeRatio || 0}
            trend={(metrics.sharpeRatio || 0) > 1 ? 'up' : 'flat'}
            color={theme.palette.warning.main}
            icon={SpeedIcon}
            description="Risk-adjusted return measure"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Max Drawdown"
            value={metrics.maxDrawdown || 0}
            unit="%"
            trend="down"
            color={theme.palette.error.main}
            icon={TrendingUpIcon}
            description="Maximum observed loss from a peak to a trough"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="God Kernel Evolution Stage"
            value={metrics.godKernelEvolutionStage || 0}
            unit="/10"
            trend="up"
            color={theme.palette.info.dark}
            icon={MemoryIcon}
            description="Current evolution stage of the God Kernel coordination system"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default OverviewTab;
