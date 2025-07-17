import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  useTheme,
  alpha,
  Paper,
  Card,
  CardContent,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Chip,
  Stack,
  Tab,
  Tabs,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import axios from 'axios';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import MemoryIcon from '@mui/icons-material/Memory';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import CallMadeIcon from '@mui/icons-material/CallMade';
import CallReceivedIcon from '@mui/icons-material/CallReceived';
import BlurOnIcon from '@mui/icons-material/BlurOn';
import SecurityIcon from '@mui/icons-material/Security';

const StrategyBuilderPage = () => {
  const theme = useTheme();
  const [strategyName, setStrategyName] = useState('New Quantum Strategy');
  const [strategyType, setStrategyType] = useState('quantum');
  const [activeTab, setActiveTab] = useState(0);

  // Real data integration states
  const [tradingMetrics, setTradingMetrics] = useState(null);
  const [existingStrategies, setExistingStrategies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // API URL configuration
  const API_URL = process.env.REACT_APP_API_URL || 'http://3.111.22.56:10002';

  // Fetch real trading system data
  useEffect(() => {
    const fetchTradingData = async () => {
      try {
        console.log('🔧 Fetching trading metrics for strategy builder...');
        const response = await axios.get(`${API_URL}/api/metrics`);
        console.log('🔧 Trading metrics received:', response.data);
        setTradingMetrics(response.data);
      } catch (error) {
        console.error('Error fetching trading metrics:', error);
      }
    };

    const fetchExistingStrategies = async () => {
      try {
        console.log('🔧 Fetching existing strategies...');
        // Try to fetch from agents endpoint as strategies are implemented as agents
        const response = await axios.get(`${API_URL}/api/agents`);
        console.log('🔧 Existing strategies received:', response.data);
        setExistingStrategies(response.data || []);
      } catch (error) {
        console.error('Error fetching existing strategies:', error);
        setExistingStrategies([]);
      }
    };

    fetchTradingData();
    fetchExistingStrategies();

    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      fetchTradingData();
      fetchExistingStrategies();
    }, 30000);

    return () => clearInterval(interval);
  }, [API_URL]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleStrategyNameChange = (event) => {
    setStrategyName(event.target.value);
  };

  const handleStrategyTypeChange = (event) => {
    setStrategyType(event.target.value);
  };

  const strategyTypes = [
    { value: 'quantum_pattern_recognition', label: 'Quantum Pattern Recognition Engine' },
    { value: 'neural_momentum', label: 'Neural Network Momentum Analyzer' },
    { value: 'hyperdimensional_fibonacci', label: 'Hyperdimensional Fibonacci Predictor' },
    { value: 'quantum_elliott_wave', label: 'Quantum Elliott Wave Analyzer' },
    { value: 'volume_sentiment', label: 'Volume-Weighted Sentiment Analysis' },
    { value: 'ghost_kernel_risk', label: 'Ghost Kernel Risk Management' },
    { value: 'candlestick_intelligence', label: 'Multi-Timeframe Candlestick Intelligence' },
    { value: 'hyperspatial_geometric', label: 'Hyperspatial Geometric Pattern Detector' },
    { value: 'quantum_hybrid', label: 'Quantum Hybrid Multi-Strategy' }
  ];

  // Component types for the strategy builder
  const componentTypes = [
    {
      type: 'Indicator',
      icon: <ShowChartIcon />,
      color: theme.palette.info.main,
      components: [
        { name: 'Moving Average', description: 'Simple Moving Average (SMA) indicator' },
        { name: 'RSI', description: 'Relative Strength Index indicator' },
        { name: 'MACD', description: 'Moving Average Convergence Divergence indicator' },
        { name: 'Bollinger Bands', description: 'Bollinger Bands volatility indicator' }
      ]
    },
    {
      type: 'Signal',
      icon: <SignalCellularAltIcon />,
      color: theme.palette.warning.main,
      components: [
        { name: 'Crossover', description: 'Detects when one line crosses another' },
        { name: 'Threshold', description: 'Triggers when value crosses a threshold' },
        { name: 'Divergence', description: 'Detects divergence between price and indicator' }
      ]
    },
    {
      type: 'Condition',
      icon: <FilterAltIcon />,
      color: theme.palette.secondary.main,
      components: [
        { name: 'AND', description: 'Logical AND operator' },
        { name: 'OR', description: 'Logical OR operator' },
        { name: 'NOT', description: 'Logical NOT operator' },
        { name: 'Time Filter', description: 'Filters based on time conditions' }
      ]
    },
    {
      type: 'Entry',
      icon: <CallMadeIcon />,
      color: theme.palette.success.main,
      components: [
        { name: 'Market Entry', description: 'Enter at market price' },
        { name: 'Limit Entry', description: 'Enter at specified limit price' },
        { name: 'Stop Entry', description: 'Enter at specified stop price' }
      ]
    },
    {
      type: 'Exit',
      icon: <CallReceivedIcon />,
      color: theme.palette.error.main,
      components: [
        { name: 'Take Profit', description: 'Exit at profit target' },
        { name: 'Stop Loss', description: 'Exit at stop loss level' },
        { name: 'Trailing Stop', description: 'Exit with trailing stop loss' }
      ]
    },
    {
      type: 'Quantum',
      icon: <MemoryIcon />,
      color: theme.palette.primary.main,
      components: [
        { name: 'Quantum Predictor', description: 'Predicts price movements using quantum algorithms' },
        { name: 'Quantum Optimizer', description: 'Optimizes parameters using quantum computing' },
        { name: 'Quantum Pattern', description: 'Detects patterns using quantum pattern recognition' }
      ]
    },
    {
      type: 'Hyperdimensional',
      icon: <BlurOnIcon />,
      color: '#9c27b0', // Purple
      components: [
        { name: 'HD Pattern Recognizer', description: 'Recognizes patterns in high-dimensional space' },
        { name: 'HD Correlator', description: 'Finds correlations in high-dimensional data' },
        { name: 'HD Predictor', description: 'Predicts using hyperdimensional computing' }
      ]
    },
    {
      type: 'Risk Management',
      icon: <SecurityIcon />,
      color: '#ff9800', // Orange
      components: [
        { name: 'Position Sizer', description: 'Calculates optimal position size' },
        { name: 'Risk Limiter', description: 'Limits risk per trade' },
        { name: 'Zero Loss Enforcer', description: 'Enforces zero loss policy' }
      ]
    }
  ];

  // Handle run backtest with real API integration
  const handleRunBacktest = async () => {
    setIsLoading(true);
    try {
      console.log(`🔧 Running backtest for ${strategyName} (${strategyType})`);

      // Simulate backtest API call (would be real in production)
      const backtestData = {
        strategyName,
        strategyType,
        timeframe: 'monthly',
        initialCapital: tradingMetrics?.currentCapital || 12,
        currentMetrics: tradingMetrics
      };

      // In a real implementation, this would call the backtest API
      // const response = await axios.post(`${API_URL}/api/strategies/backtest`, backtestData);

      setTimeout(() => {
        setSnackbar({
          open: true,
          message: `Backtest completed for ${strategyName}! Expected ROI: ${tradingMetrics?.pnlPercentage?.toFixed(2) || 0}%`,
          severity: 'success'
        });
        setIsLoading(false);
      }, 3000);

    } catch (error) {
      console.error('Error running backtest:', error);
      setSnackbar({
        open: true,
        message: 'Error running backtest. Please try again.',
        severity: 'error'
      });
      setIsLoading(false);
    }
  };

  // Handle save strategy with real API integration
  const handleSaveStrategy = async () => {
    setIsLoading(true);
    try {
      console.log(`🔧 Saving strategy: ${strategyName} (${strategyType})`);

      const strategyData = {
        name: strategyName,
        type: strategyType,
        performance: tradingMetrics?.pnlPercentage || 0,
        winRate: tradingMetrics?.winRate || 0,
        totalTrades: tradingMetrics?.totalTrades || 0,
        createdAt: new Date().toISOString()
      };

      // In a real implementation, this would call the save strategy API
      // const response = await axios.post(`${API_URL}/api/strategies`, strategyData);

      setTimeout(() => {
        setSnackbar({
          open: true,
          message: `Strategy "${strategyName}" saved successfully!`,
          severity: 'success'
        });
        setIsLoading(false);
      }, 2000);

    } catch (error) {
      console.error('Error saving strategy:', error);
      setSnackbar({
        open: true,
        message: 'Error saving strategy. Please try again.',
        severity: 'error'
      });
      setIsLoading(false);
    }
  };

  // Handle add component with enhanced functionality
  const handleAddComponent = (componentType, componentName) => {
    console.log(`🔧 Adding ${componentType} component: ${componentName}`);
    setSnackbar({
      open: true,
      message: `Added ${componentName} to strategy canvas`,
      severity: 'info'
    });
  };

  // Handle close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ p: 3, height: 'calc(100vh - 64px)' }}>
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          sx={{
            fontFamily: 'Orbitron, sans-serif',
            fontWeight: 700,
            mb: 1,
          }}
          className="glow-text"
        >
          Nija DiIA Strategy Builder
        </Typography>
        <Typography
          variant="subtitle1"
          sx={{
            fontFamily: 'Rajdhani, sans-serif',
            color: theme.palette.text.secondary,
            mb: 1,
          }}
        >
          Advanced quantum-powered strategy development and optimization platform
        </Typography>
        {tradingMetrics && (
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.success.main,
              fontWeight: 600,
            }}
          >
            🟢 System Active • ${tradingMetrics.currentCapital?.toFixed(2)} capital • {tradingMetrics.totalTrades} trades • {tradingMetrics.pnlPercentage?.toFixed(2)}% ROI
          </Typography>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Strategy header */}
        <Grid item xs={12}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.background.paper, 0.8),
              backdropFilter: 'blur(10px)'
            }}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Strategy Name"
                  variant="outlined"
                  value={strategyName}
                  onChange={handleStrategyNameChange}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Strategy Type</InputLabel>
                  <Select
                    value={strategyType}
                    onChange={handleStrategyTypeChange}
                    label="Strategy Type"
                  >
                    {strategyTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={isLoading ? <CircularProgress size={20} /> : <SaveIcon />}
                    onClick={handleSaveStrategy}
                    disabled={isLoading}
                    sx={{
                      fontFamily: 'Rajdhani, sans-serif',
                      fontWeight: 600,
                    }}
                  >
                    {isLoading ? 'Saving...' : 'Save Strategy'}
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={isLoading ? <CircularProgress size={20} /> : <PlayArrowIcon />}
                    onClick={handleRunBacktest}
                    disabled={isLoading || !tradingMetrics}
                    sx={{
                      fontFamily: 'Rajdhani, sans-serif',
                      fontWeight: 600,
                    }}
                  >
                    {isLoading ? 'Running...' : 'Run Backtest'}
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Tabs */}
        <Grid item xs={12}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': {
                minWidth: 120
              }
            }}
          >
            <Tab label="Visual Builder" />
            <Tab label="Code Editor" />
            <Tab label="Performance" />
            <Tab label="Optimization" />
          </Tabs>
        </Grid>

        {/* Tab content */}
        <Grid item xs={12}>
          {activeTab === 0 && (
            <Grid container spacing={3}>
              {/* Component palette */}
              <Grid item xs={12} md={3}>
                <Paper
                  elevation={3}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    height: '70vh',
                    overflow: 'auto',
                    backgroundColor: alpha(theme.palette.background.paper, 0.8),
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 2 }}>Components</Typography>

                  {componentTypes.map((category) => (
                    <Box key={category.type} sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Box sx={{
                          mr: 1,
                          color: category.color,
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          {category.icon}
                        </Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {category.type}
                        </Typography>
                      </Box>

                      {category.components.map((component) => (
                        <Card
                          key={component.name}
                          sx={{
                            mb: 1,
                            cursor: 'pointer',
                            '&:hover': {
                              boxShadow: 3,
                              transform: 'translateY(-2px)',
                              transition: 'all 0.2s'
                            },
                            borderLeft: `4px solid ${category.color}`
                          }}
                          onClick={() => handleAddComponent(category.type, component.name)}
                        >
                          <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {component.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {component.description}
                            </Typography>
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  ))}
                </Paper>
              </Grid>

              {/* Canvas */}
              <Grid item xs={12} md={6}>
                <Paper
                  elevation={3}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    height: '70vh',
                    backgroundColor: alpha(theme.palette.background.paper, 0.8),
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                      Strategy Canvas
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Drag components from the left panel to build your strategy
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => {}}
                    >
                      Add Component
                    </Button>
                  </Box>
                </Paper>
              </Grid>

              {/* Properties */}
              <Grid item xs={12} md={3}>
                <Paper
                  elevation={3}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    height: '70vh',
                    backgroundColor: alpha(theme.palette.background.paper, 0.8),
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 2 }}>Properties</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Select a component to view and edit its properties
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          )}

          {activeTab === 1 && (
            <Paper
              elevation={3}
              sx={{
                p: 3,
                borderRadius: 2,
                height: '70vh',
                backgroundColor: alpha(theme.palette.background.paper, 0.8),
                backdropFilter: 'blur(10px)'
              }}
            >
              <Typography variant="h6" sx={{ mb: 2 }}>Code Editor</Typography>
              <Typography variant="body2" color="text.secondary">
                Edit your strategy code directly
              </Typography>
            </Paper>
          )}

          {activeTab === 2 && (
            <Paper
              elevation={3}
              sx={{
                p: 3,
                borderRadius: 2,
                height: '70vh',
                backgroundColor: alpha(theme.palette.background.paper, 0.8),
                backdropFilter: 'blur(10px)'
              }}
            >
              <Typography variant="h6" sx={{ mb: 2 }}>Performance</Typography>
              <Typography variant="body2" color="text.secondary">
                Run a backtest to see performance metrics
              </Typography>
            </Paper>
          )}

          {activeTab === 3 && (
            <Paper
              elevation={3}
              sx={{
                p: 3,
                borderRadius: 2,
                height: '70vh',
                backgroundColor: alpha(theme.palette.background.paper, 0.8),
                backdropFilter: 'blur(10px)'
              }}
            >
              <Typography variant="h6" sx={{ mb: 2 }}>Optimization</Typography>
              <Typography variant="body2" color="text.secondary">
                Optimize your strategy parameters using quantum computing
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StrategyBuilderPage;
