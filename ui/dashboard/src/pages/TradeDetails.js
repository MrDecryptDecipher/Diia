import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Chip,
  Button,
  IconButton,
  useTheme,
  alpha,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
} from '@mui/material';
import {
  ArrowBack,
  TrendingUp,
  TrendingDown,
  ArrowUpward,
  ArrowDownward,
  AccessTime,
  AttachMoney,
  BarChart,
  Psychology,
  Science,
  Speed,
  Timeline,
  Insights,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { motion } from 'framer-motion';
import { formatCurrency, formatPercentage, formatDate } from '../utils/formatters';
import { createChart } from 'lightweight-charts';

const TradeDetails = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams();
  const { activeTrades, tradeHistory } = useData();
  const [trade, setTrade] = useState(null);
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  
  // Find trade
  useEffect(() => {
    const allTrades = [...(activeTrades || []), ...(tradeHistory || [])];
    const foundTrade = allTrades.find(t => t.id === id);
    setTrade(foundTrade);
  }, [id, activeTrades, tradeHistory]);
  
  // Create chart
  useEffect(() => {
    if (!chartContainerRef.current || !trade) return;
    
    // Clear previous chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }
    
    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: 'solid', color: 'transparent' },
        textColor: theme.palette.text.primary,
        fontFamily: 'Rajdhani, sans-serif',
      },
      grid: {
        vertLines: { color: alpha(theme.palette.divider, 0.1) },
        horzLines: { color: alpha(theme.palette.divider, 0.1) },
      },
      rightPriceScale: {
        borderColor: theme.palette.divider,
      },
      timeScale: {
        borderColor: theme.palette.divider,
        timeVisible: true,
      },
      crosshair: {
        vertLine: {
          color: alpha(theme.palette.primary.main, 0.5),
          width: 1,
          style: 1,
          visible: true,
          labelVisible: true,
        },
        horzLine: {
          color: alpha(theme.palette.primary.main, 0.5),
          width: 1,
          style: 1,
          visible: true,
          labelVisible: true,
        },
        mode: 1,
      },
    });
    
    // Add candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: theme.palette.success.main,
      downColor: theme.palette.error.main,
      borderUpColor: theme.palette.success.main,
      borderDownColor: theme.palette.error.main,
      wickUpColor: theme.palette.success.main,
      wickDownColor: theme.palette.error.main,
    });
    
    // Generate mock data
    const currentDate = new Date();
    const data = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(currentDate);
      date.setDate(date.getDate() - (30 - i - 1));
      
      const basePrice = trade.entryPrice;
      const volatility = 0.02;
      const trend = 0.001 * i;
      
      const open = basePrice * (1 + (Math.random() - 0.5) * volatility + trend);
      const close = open * (1 + (Math.random() - 0.5) * volatility);
      const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5);
      const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5);
      
      return {
        time: date.toISOString().split('T')[0],
        open,
        high,
        low,
        close,
      };
    });
    
    // Add entry marker
    const entryDate = new Date(trade.entryTime);
    const entryMarker = {
      time: entryDate.toISOString().split('T')[0],
      position: 'belowBar',
      color: trade.direction === 'long' ? theme.palette.success.main : theme.palette.error.main,
      shape: 'arrowUp',
      text: `Entry: ${formatCurrency(trade.entryPrice)}`,
    };
    
    // Add exit marker if available
    let exitMarker = null;
    if (trade.exitTime) {
      const exitDate = new Date(trade.exitTime);
      exitMarker = {
        time: exitDate.toISOString().split('T')[0],
        position: 'aboveBar',
        color: trade.pnl >= 0 ? theme.palette.success.main : theme.palette.error.main,
        shape: 'arrowDown',
        text: `Exit: ${formatCurrency(trade.exitPrice || trade.currentPrice)}`,
      };
    }
    
    // Set data
    candlestickSeries.setData(data);
    
    // Add markers
    candlestickSeries.setMarkers([entryMarker, ...(exitMarker ? [exitMarker] : [])]);
    
    // Fit content
    chart.timeScale().fitContent();
    
    // Save chart reference
    chartRef.current = chart;
    
    // Resize handler
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [trade, theme]);
  
  // Helper function for alpha
  function alpha(color, value) {
    return color + Math.round(value * 255).toString(16).padStart(2, '0');
  }
  
  // Container variants for animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
  };
  
  // Item variants for animations
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };
  
  if (!trade) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography variant="h6" sx={{ color: 'text.secondary' }}>
          Loading trade details...
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ pb: 4 }}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
            <IconButton
              sx={{ mr: 2 }}
              onClick={() => navigate(-1)}
            >
              <ArrowBack />
            </IconButton>
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontFamily: 'Orbitron, sans-serif',
                  fontWeight: 700,
                  mb: 1,
                  display: 'flex',
                  alignItems: 'center',
                }}
                className="glow-text"
              >
                {trade.symbol} Trade
                <Chip
                  size="small"
                  label={trade.direction}
                  icon={trade.direction === 'long' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />}
                  color={trade.direction === 'long' ? 'success' : 'error'}
                  sx={{ ml: 2, height: 28 }}
                />
                <Chip
                  size="small"
                  label={trade.status}
                  color={
                    trade.status === 'active' ? 'info' :
                    trade.status === 'profit' ? 'success' :
                    trade.status === 'loss' ? 'error' :
                    'default'
                  }
                  sx={{ ml: 1, height: 28 }}
                />
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{
                  fontFamily: 'Rajdhani, sans-serif',
                  color: theme.palette.text.secondary,
                }}
              >
                {formatDate(trade.entryTime, 'datetime')}
                {trade.exitTime && ` - ${formatDate(trade.exitTime, 'datetime')}`}
              </Typography>
            </Box>
          </Box>
        </motion.div>
        
        {/* Main Content */}
        <Grid container spacing={3}>
          {/* Left Column */}
          <Grid item xs={12} md={8}>
            {/* Chart */}
            <motion.div variants={itemVariants}>
              <Card 
                sx={{ 
                  mb: 3,
                  background: 'rgba(17, 24, 39, 0.7)',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                }}
                className="futuristic-border"
              >
                <CardHeader
                  title={
                    <Typography variant="h6" sx={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600 }}>
                      Price Chart
                    </Typography>
                  }
                  action={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Chip
                        label={`${trade.pnl >= 0 ? '+' : ''}${formatCurrency(trade.pnl)}`}
                        color={trade.pnl >= 0 ? 'success' : 'error'}
                        size="small"
                        icon={trade.pnl >= 0 ? <TrendingUp /> : <TrendingDown />}
                        sx={{ mr: 1 }}
                      />
                    </Box>
                  }
                />
                <Divider sx={{ opacity: 0.2 }} />
                <CardContent>
                  <Box
                    ref={chartContainerRef}
                    sx={{
                      width: '100%',
                      height: 400,
                    }}
                  />
                </CardContent>
              </Card>
            </motion.div>
            
            {/* Trade Details */}
            <motion.div variants={itemVariants}>
              <Card 
                sx={{ 
                  mb: { xs: 3, md: 0 },
                  background: 'rgba(17, 24, 39, 0.7)',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                }}
                className="futuristic-border"
              >
                <CardHeader
                  title={
                    <Typography variant="h6" sx={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600 }}>
                      Trade Details
                    </Typography>
                  }
                />
                <Divider sx={{ opacity: 0.2 }} />
                <CardContent>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <List>
                        <ListItem>
                          <ListItemIcon>
                            <BarChart sx={{ color: theme.palette.primary.main }} />
                          </ListItemIcon>
                          <ListItemText
                            primary="Symbol"
                            secondary={trade.symbol}
                            primaryTypographyProps={{ color: 'text.secondary', variant: 'body2' }}
                            secondaryTypographyProps={{ color: 'text.primary', variant: 'body1', fontWeight: 600 }}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <Timeline sx={{ color: theme.palette.primary.main }} />
                          </ListItemIcon>
                          <ListItemText
                            primary="Direction"
                            secondary={trade.direction}
                            primaryTypographyProps={{ color: 'text.secondary', variant: 'body2' }}
                            secondaryTypographyProps={{ color: 'text.primary', variant: 'body1', fontWeight: 600 }}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <AttachMoney sx={{ color: theme.palette.primary.main }} />
                          </ListItemIcon>
                          <ListItemText
                            primary="Entry Price"
                            secondary={formatCurrency(trade.entryPrice, 'USD', trade.symbol.includes('BTC') ? 0 : 2)}
                            primaryTypographyProps={{ color: 'text.secondary', variant: 'body2' }}
                            secondaryTypographyProps={{ color: 'text.primary', variant: 'body1', fontWeight: 600 }}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <AttachMoney sx={{ color: theme.palette.primary.main }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={trade.status === 'active' ? 'Current Price' : 'Exit Price'}
                            secondary={formatCurrency(trade.status === 'active' ? trade.currentPrice : trade.exitPrice || 0, 'USD', trade.symbol.includes('BTC') ? 0 : 2)}
                            primaryTypographyProps={{ color: 'text.secondary', variant: 'body2' }}
                            secondaryTypographyProps={{ color: 'text.primary', variant: 'body1', fontWeight: 600 }}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <Speed sx={{ color: theme.palette.primary.main }} />
                          </ListItemIcon>
                          <ListItemText
                            primary="Leverage"
                            secondary={`${trade.leverage}x`}
                            primaryTypographyProps={{ color: 'text.secondary', variant: 'body2' }}
                            secondaryTypographyProps={{ color: 'text.primary', variant: 'body1', fontWeight: 600 }}
                          />
                        </ListItem>
                      </List>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <List>
                        <ListItem>
                          <ListItemIcon>
                            <Psychology sx={{ color: theme.palette.primary.main }} />
                          </ListItemIcon>
                          <ListItemText
                            primary="Agent"
                            secondary={trade.agent}
                            primaryTypographyProps={{ color: 'text.secondary', variant: 'body2' }}
                            secondaryTypographyProps={{ color: 'text.primary', variant: 'body1', fontWeight: 600 }}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <Science sx={{ color: theme.palette.primary.main }} />
                          </ListItemIcon>
                          <ListItemText
                            primary="Strategy"
                            secondary={trade.strategy}
                            primaryTypographyProps={{ color: 'text.secondary', variant: 'body2' }}
                            secondaryTypographyProps={{ color: 'text.primary', variant: 'body1', fontWeight: 600 }}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <AccessTime sx={{ color: theme.palette.primary.main }} />
                          </ListItemIcon>
                          <ListItemText
                            primary="Entry Time"
                            secondary={formatDate(trade.entryTime, 'datetime')}
                            primaryTypographyProps={{ color: 'text.secondary', variant: 'body2' }}
                            secondaryTypographyProps={{ color: 'text.primary', variant: 'body1', fontWeight: 600 }}
                          />
                        </ListItem>
                        {trade.exitTime && (
                          <ListItem>
                            <ListItemIcon>
                              <AccessTime sx={{ color: theme.palette.primary.main }} />
                            </ListItemIcon>
                            <ListItemText
                              primary="Exit Time"
                              secondary={formatDate(trade.exitTime, 'datetime')}
                              primaryTypographyProps={{ color: 'text.secondary', variant: 'body2' }}
                              secondaryTypographyProps={{ color: 'text.primary', variant: 'body1', fontWeight: 600 }}
                            />
                          </ListItem>
                        )}
                        <ListItem>
                          <ListItemIcon>
                            <Insights sx={{ color: theme.palette.primary.main }} />
                          </ListItemIcon>
                          <ListItemText
                            primary="Position Size"
                            secondary={trade.positionSize.toFixed(4)}
                            primaryTypographyProps={{ color: 'text.secondary', variant: 'body2' }}
                            secondaryTypographyProps={{ color: 'text.primary', variant: 'body1', fontWeight: 600 }}
                          />
                        </ListItem>
                      </List>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
          
          {/* Right Column */}
          <Grid item xs={12} md={4}>
            {/* Performance */}
            <motion.div variants={itemVariants}>
              <Card 
                sx={{ 
                  mb: 3,
                  background: 'rgba(17, 24, 39, 0.7)',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                }}
                className="futuristic-border"
              >
                <CardHeader
                  title={
                    <Typography variant="h6" sx={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600 }}>
                      Performance
                    </Typography>
                  }
                />
                <Divider sx={{ opacity: 0.2 }} />
                <CardContent>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                      Profit & Loss
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography
                        variant="h4"
                        sx={{
                          fontFamily: 'Orbitron, sans-serif',
                          fontWeight: 700,
                          color: trade.pnl >= 0 ? theme.palette.success.main : theme.palette.error.main,
                        }}
                      >
                        {trade.pnl >= 0 ? '+' : ''}
                        {formatCurrency(trade.pnl)}
                      </Typography>
                      {trade.pnl >= 0 ? (
                        <TrendingUp sx={{ ml: 1, color: theme.palette.success.main }} />
                      ) : (
                        <TrendingDown sx={{ ml: 1, color: theme.palette.error.main }} />
                      )}
                    </Box>
                    <Typography
                      variant="body1"
                      sx={{
                        color: trade.pnlPercentage >= 0 ? theme.palette.success.main : theme.palette.error.main,
                        fontWeight: 600,
                      }}
                    >
                      {trade.pnlPercentage >= 0 ? '+' : ''}
                      {formatPercentage(trade.pnlPercentage)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                      Confidence Score
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {trade.confidence.toFixed(2)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={trade.confidence}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 3,
                          background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        },
                      }}
                    />
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                      Risk Score
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {trade.riskScore.toFixed(2)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={trade.riskScore}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: alpha(theme.palette.error.main, 0.1),
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 3,
                          background: `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.error.main})`,
                        },
                      }}
                    />
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                      Opportunity Score
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {trade.opportunityScore.toFixed(2)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={trade.opportunityScore}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: alpha(theme.palette.success.main, 0.1),
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 3,
                          background: `linear-gradient(90deg, ${theme.palette.warning.main}, ${theme.palette.success.main})`,
                        },
                      }}
                    />
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                      Win Probability
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {trade.winProbability.toFixed(2)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={trade.winProbability}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: alpha(theme.palette.info.main, 0.1),
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 3,
                          background: `linear-gradient(90deg, ${theme.palette.info.main}, ${theme.palette.primary.main})`,
                        },
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
            
            {/* Trade Reasoning */}
            <motion.div variants={itemVariants}>
              <Card 
                sx={{ 
                  background: 'rgba(17, 24, 39, 0.7)',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                }}
                className="futuristic-border"
              >
                <CardHeader
                  title={
                    <Typography variant="h6" sx={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600 }}>
                      Trade Reasoning
                    </Typography>
                  }
                />
                <Divider sx={{ opacity: 0.2 }} />
                <CardContent>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                      Entry Reason
                    </Typography>
                    <Typography variant="body1">
                      {trade.reasonEntry}
                    </Typography>
                  </Box>
                  
                  {trade.reasonExit && (
                    <Box>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                        Exit Reason
                      </Typography>
                      <Typography variant="body1">
                        {trade.reasonExit}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      </motion.div>
    </Box>
  );
};

export default TradeDetails;
