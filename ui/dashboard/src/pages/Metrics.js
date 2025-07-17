import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  useTheme,
  CircularProgress,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  Button,
  Tooltip,
  IconButton
} from '@mui/material';
import axios from 'axios';
import { io } from 'socket.io-client';
import RefreshIcon from '@mui/icons-material/Refresh';
import AutorenewIcon from '@mui/icons-material/Autorenew';

// Import tab components
import OverviewTab from '../components/Metrics/OverviewTab';
import PerformanceTab from '../components/Metrics/PerformanceTab';
import TradeMetricsTab from '../components/Metrics/TradeMetricsTab';
import SystemEfficiencyTab from '../components/Metrics/SystemEfficiencyTab';

// API and WebSocket URLs from environment variables
const API_URL = process.env.REACT_APP_API_URL || 'http://3.111.22.56:10002';
const WEBSOCKET_URL = process.env.REACT_APP_WEBSOCKET_URL || 'http://3.111.22.56:10003';

const Metrics = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Function to fetch metrics from the API
  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      // Add cache-busting parameter and disable caching
      const response = await axios.get(`${API_URL}/api/metrics?t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      console.log('🔧 Metrics received:', response.data);
      console.log('🔧 Current Capital:', response.data.currentCapital);
      console.log('🔧 Win Rate:', response.data.winRate);
      console.log('🔧 Total Trades:', response.data.totalTrades);
      setMetrics(response.data);
      setLastUpdated(new Date());
      setError(null);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      // Only set error if WebSocket is not connected (to avoid overriding WebSocket data)
      if (!connected) {
        setError('Failed to fetch metrics. Trying WebSocket connection...');
      } else {
        console.log('🔧 HTTP API failed but WebSocket is connected, using WebSocket data');
      }
    } finally {
      setLoading(false);
    }
  }, [connected]);

  // Initialize WebSocket connection
  useEffect(() => {
    // Create socket connection
    const newSocket = io(WEBSOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    // Socket event handlers
    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
      setConnected(true);
      setError(null);

      // Subscribe to metrics updates
      newSocket.emit('subscribe', 'metrics');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err);
      setConnected(false);
      setError('WebSocket connection error. Falling back to API polling.');
    });

    newSocket.on('metrics', (data) => {
      console.log('🔧 Received metrics update via WebSocket:', data);
      console.log('🔧 WebSocket Current Capital:', data.currentCapital);
      console.log('🔧 WebSocket Win Rate:', data.winRate);
      console.log('🔧 WebSocket Total Trades:', data.totalTrades);
      setMetrics(data);
      setLastUpdated(new Date());
      setError(null); // Clear any previous errors since WebSocket is working
    });

    // Save socket to state
    setSocket(newSocket);

    // Initial fetch
    fetchMetrics();

    // Cleanup on unmount
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [fetchMetrics]);

  // Set up polling fallback if WebSocket is not connected
  useEffect(() => {
    let interval;

    if (autoRefresh && (!connected || !socket)) {
      console.log('Setting up polling fallback');
      interval = setInterval(() => {
        console.log('Polling for metrics updates');
        fetchMetrics();
      }, 5000); // Poll every 5 seconds
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [connected, socket, fetchMetrics, autoRefresh]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle manual refresh
  const handleRefresh = () => {
    console.log('🔧 Manual refresh triggered');
    setMetrics(null); // Clear current data to force re-render
    fetchMetrics();
  };

  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  // Handle error close
  const handleErrorClose = () => {
    setError(null);
  };

  // Format last updated time
  const formatLastUpdated = () => {
    if (!lastUpdated) return 'Never';

    return lastUpdated.toLocaleTimeString();
  };

  if (loading && !metrics) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
          Nija DiIa System Metrics
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ mr: 2, color: theme.palette.text.secondary }}>
            Last updated: {formatLastUpdated()}
          </Typography>

          <Tooltip title={autoRefresh ? "Auto-refresh is on" : "Auto-refresh is off"}>
            <IconButton
              onClick={toggleAutoRefresh}
              color={autoRefresh ? "primary" : "default"}
              sx={{ mr: 1 }}
            >
              <AutorenewIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Refresh now">
            <IconButton onClick={handleRefresh} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {connected ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          Connected to real-time data stream
        </Alert>
      ) : (
        <Alert severity="info" sx={{ mb: 2 }}>
          Using API polling for updates
        </Alert>
      )}

      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          mb: 3,
          '& .MuiTab-root': {
            fontWeight: 'bold',
            fontSize: '0.9rem',
          },
          '& .Mui-selected': {
            color: theme.palette.primary.main,
          }
        }}
      >
        <Tab label="Overview" />
        <Tab label="Performance" />
        <Tab label="Trade Metrics" />
        <Tab label="System Efficiency" />
      </Tabs>

      {/* Tab content */}
      {activeTab === 0 && <OverviewTab metrics={metrics} loading={loading} />}
      {activeTab === 1 && <PerformanceTab metrics={metrics} loading={loading} />}
      {activeTab === 2 && <TradeMetricsTab metrics={metrics} loading={loading} />}
      {activeTab === 3 && <SystemEfficiencyTab metrics={metrics} loading={loading} />}

      {/* Error snackbar */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleErrorClose}>
        <Alert onClose={handleErrorClose} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Metrics;
