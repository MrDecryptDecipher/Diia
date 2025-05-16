import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  useTheme, 
  alpha,
  Grid,
  Divider,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';

const StrategyPerformance = ({ performance, isLoading = false }) => {
  const theme = useTheme();
  
  if (isLoading) {
    return (
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: 2,
          backgroundColor: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(10px)'
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>
          Running Backtest...
        </Typography>
        <Box sx={{ width: '80%', mb: 2 }}>
          <LinearProgress color="primary" />
        </Box>
        <Typography variant="body2" color="text.secondary">
          Analyzing strategy performance with quantum computing...
        </Typography>
      </Paper>
    );
  }
  
  if (!performance) {
    return (
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: 2,
          backgroundColor: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(10px)'
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>
          No Performance Data
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Build your strategy and run a backtest to see performance metrics
        </Typography>
      </Paper>
    );
  }
  
  // Determine trend icon and color
  let TrendIcon = TrendingFlatIcon;
  let trendColor = theme.palette.text.secondary;
  
  if (performance.pnlPercentage > 0) {
    TrendIcon = TrendingUpIcon;
    trendColor = theme.palette.success.main;
  } else if (performance.pnlPercentage < 0) {
    TrendIcon = TrendingDownIcon;
    trendColor = theme.palette.error.main;
  }
  
  // Generate daily returns data
  const dailyReturns = performance.performance.map((day, index, array) => {
    if (index === 0) return { day: day.day, return: 0 };
    const prevCapital = array[index - 1].capital;
    const currentCapital = day.capital;
    const returnPct = ((currentCapital - prevCapital) / prevCapital) * 100;
    return { day: day.day, return: returnPct };
  });
  
  // Generate drawdown data
  const drawdownData = [];
  let peak = performance.performance[0].capital;
  
  performance.performance.forEach((day) => {
    if (day.capital > peak) {
      peak = day.capital;
      drawdownData.push({ day: day.day, drawdown: 0 });
    } else {
      const drawdown = ((peak - day.capital) / peak) * 100 * -1;
      drawdownData.push({ day: day.day, drawdown });
    }
  });
  
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 3, 
        height: '100%', 
        overflow: 'auto',
        borderRadius: 2,
        backgroundColor: alpha(theme.palette.background.paper, 0.8),
        backdropFilter: 'blur(10px)'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Strategy Performance
        </Typography>
        <Chip 
          label={performance.type.charAt(0).toUpperCase() + performance.type.slice(1)} 
          size="small" 
          sx={{ 
            backgroundColor: alpha(performance.color, 0.2),
            color: performance.color,
            fontWeight: 'bold'
          }} 
        />
      </Box>
      
      <Grid container spacing={3}>
        {/* Key metrics */}
        <Grid item xs={12} md={6}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Initial Capital
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              {performance.initialCapital.toFixed(2)} USDT
            </Typography>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Current Capital
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {performance.currentCapital.toFixed(2)} USDT
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                <TrendIcon sx={{ color: trendColor, mr: 0.5 }} />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: trendColor,
                    fontWeight: 'bold'
                  }}
                >
                  {performance.pnlPercentage.toFixed(2)}%
                </Typography>
              </Box>
            </Box>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Total Trades
                </Typography>
                <Typography variant="h6">
                  {performance.totalTrades}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Win Rate
                </Typography>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: performance.winRate > 50 
                      ? theme.palette.success.main 
                      : theme.palette.error.main 
                  }}
                >
                  {performance.winRate.toFixed(2)}%
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Profit Factor
                </Typography>
                <Typography variant="h6">
                  {performance.profitFactor.toFixed(2)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Sharpe Ratio
                </Typography>
                <Typography variant="h6">
                  {performance.sharpeRatio.toFixed(2)}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Grid>
        
        {/* Capital growth chart */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Capital Growth
          </Typography>
          <Box sx={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performance.performance}>
                <defs>
                  <linearGradient id="colorCapital" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={performance.color} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={performance.color} stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 12 }} 
                  tickLine={false}
                  axisLine={{ stroke: theme.palette.divider }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }} 
                  tickLine={false}
                  axisLine={{ stroke: theme.palette.divider }}
                  domain={['dataMin', 'dataMax']}
                />
                <Tooltip 
                  formatter={(value) => [`${value.toFixed(2)} USDT`, 'Capital']}
                  labelFormatter={(value) => `Day ${value}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="capital" 
                  stroke={performance.color} 
                  fillOpacity={1} 
                  fill="url(#colorCapital)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Grid>
        
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
        </Grid>
        
        {/* Daily returns chart */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Daily Returns
          </Typography>
          <Box sx={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyReturns}>
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 12 }} 
                  tickLine={false}
                  axisLine={{ stroke: theme.palette.divider }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }} 
                  tickLine={false}
                  axisLine={{ stroke: theme.palette.divider }}
                />
                <Tooltip 
                  formatter={(value) => [`${value.toFixed(2)}%`, 'Return']}
                  labelFormatter={(value) => `Day ${value}`}
                />
                <Bar 
                  dataKey="return" 
                  fill={theme.palette.info.main} 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Grid>
        
        {/* Drawdown chart */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Drawdown
          </Typography>
          <Box sx={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={drawdownData}>
                <defs>
                  <linearGradient id="colorDrawdown" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme.palette.error.main} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={theme.palette.error.main} stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 12 }} 
                  tickLine={false}
                  axisLine={{ stroke: theme.palette.divider }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }} 
                  tickLine={false}
                  axisLine={{ stroke: theme.palette.divider }}
                />
                <Tooltip 
                  formatter={(value) => [`${value.toFixed(2)}%`, 'Drawdown']}
                  labelFormatter={(value) => `Day ${value}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="drawdown" 
                  stroke={theme.palette.error.main} 
                  fillOpacity={1} 
                  fill="url(#colorDrawdown)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Grid>
        
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
        </Grid>
        
        {/* Additional metrics */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
            Additional Metrics
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Max Drawdown
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'medium', color: theme.palette.error.main }}>
                  {performance.maxDrawdown.toFixed(2)}%
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Sortino Ratio
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  {performance.sortinoRatio.toFixed(2)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Calmar Ratio
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  {performance.calmarRatio.toFixed(2)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Volatility
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  {performance.volatility.toFixed(2)}%
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Best Trade
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'medium', color: theme.palette.success.main }}>
                  +{performance.bestTrade.toFixed(2)}%
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Worst Trade
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'medium', color: theme.palette.error.main }}>
                  {performance.worstTrade.toFixed(2)}%
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Avg. Holding Time
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  {performance.averageTradeHoldingTime}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Trading Frequency
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  {performance.tradingFrequency}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default StrategyPerformance;
