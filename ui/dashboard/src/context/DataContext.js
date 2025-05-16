import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSocket } from './SocketContext';
import axios from 'axios';

// Create context
const DataContext = createContext();

// Custom hook to use the data context
export const useData = () => useContext(DataContext);

// Data provider component
export const DataProvider = ({ children }) => {
  // Socket context
  const { isConnected, on, subscribe } = useSocket();

  // State for data
  const [systemStatus, setSystemStatus] = useState(null);
  const [activeTrades, setActiveTrades] = useState([]);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [agentStatus, setAgentStatus] = useState([]);
  const [assetInfo, setAssetInfo] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [quantumPredictions, setQuantumPredictions] = useState([]);
  const [mlInsights, setMlInsights] = useState([]);
  const [hyperdimensionalPatterns, setHyperdimensionalPatterns] = useState([]);
  const [neuralNetworkState, setNeuralNetworkState] = useState(null);
  const [strategyPerformance, setStrategyPerformance] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [tradeEvents, setTradeEvents] = useState([]);

  // API base URL
  const API_URL = process.env.REACT_APP_API_URL || 'http://3.111.22.56/omni/api';

  // Fetch initial data from API
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch system status
        const systemStatusResponse = await axios.get(`${API_URL}/api/system/status`);
        setSystemStatus(systemStatusResponse.data);

        // Fetch active trades
        const activeTradesResponse = await axios.get(`${API_URL}/api/trades/active`);
        setActiveTrades(activeTradesResponse.data);

        // Fetch trade history
        const tradeHistoryResponse = await axios.get(`${API_URL}/api/trades/history`);
        setTradeHistory(tradeHistoryResponse.data);

        // Fetch metrics
        const metricsResponse = await axios.get(`${API_URL}/api/metrics`);
        setMetrics(metricsResponse.data);

        // Fetch agent status
        const agentStatusResponse = await axios.get(`${API_URL}/api/agents`);
        setAgentStatus(agentStatusResponse.data);

        // Fetch asset info
        const assetInfoResponse = await axios.get(`${API_URL}/api/assets`);
        setAssetInfo(assetInfoResponse.data);

        // Fetch leaderboard
        const leaderboardResponse = await axios.get(`${API_URL}/api/leaderboard`);
        setLeaderboard(leaderboardResponse.data);

        // Fetch quantum predictions
        const quantumPredictionsResponse = await axios.get(`${API_URL}/api/quantum/predictions`);
        setQuantumPredictions(quantumPredictionsResponse.data);

        // Fetch ML insights
        const mlInsightsResponse = await axios.get(`${API_URL}/api/ml/insights`);
        setMlInsights(mlInsightsResponse.data);

        // Fetch hyperdimensional patterns
        const hyperdimensionalPatternsResponse = await axios.get(`${API_URL}/api/ml/hyperdimensional`);
        setHyperdimensionalPatterns(hyperdimensionalPatternsResponse.data);

        // Fetch neural network state
        const neuralNetworkStateResponse = await axios.get(`${API_URL}/api/ml/neural`);
        setNeuralNetworkState(neuralNetworkStateResponse.data);

        // Fetch strategy performance
        const strategyPerformanceResponse = await axios.get(`${API_URL}/api/strategy`);
        setStrategyPerformance(strategyPerformanceResponse.data);

        // Fetch performance
        const performanceResponse = await axios.get(`${API_URL}/api/system/performance`);
        setPerformance(performanceResponse.data);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };

    fetchInitialData();
  }, [API_URL]);

  // Set up socket listeners
  useEffect(() => {
    if (!isConnected) return;

    // Subscribe to channels
    subscribe('system:status');
    subscribe('trades:active');
    subscribe('trades:history');
    subscribe('metrics');
    subscribe('agents:status');
    subscribe('assets:info');
    subscribe('leaderboard');
    subscribe('quantum:predictions');
    subscribe('ml:insights');
    subscribe('hyperdimensional:patterns');
    subscribe('neural:state');
    subscribe('strategy:performance');
    subscribe('trades:events');

    // Set up event listeners
    const unsubscribeSystemStatus = on('system:status', (data) => {
      setSystemStatus(data);
    });

    const unsubscribeActiveTrades = on('trades:active', (data) => {
      setActiveTrades(data);
    });

    const unsubscribeTradeHistory = on('trades:history', (data) => {
      setTradeHistory(data);
    });

    const unsubscribeMetrics = on('metrics', (data) => {
      setMetrics(data);
    });

    const unsubscribeAgentStatus = on('agents:status', (data) => {
      setAgentStatus(data);
    });

    const unsubscribeAssetInfo = on('assets:info', (data) => {
      setAssetInfo(data);
    });

    const unsubscribeLeaderboard = on('leaderboard', (data) => {
      setLeaderboard(data);
    });

    const unsubscribeQuantumPredictions = on('quantum:predictions', (data) => {
      setQuantumPredictions(data);
    });

    const unsubscribeMlInsights = on('ml:insights', (data) => {
      setMlInsights(data);
    });

    const unsubscribeHyperdimensionalPatterns = on('hyperdimensional:patterns', (data) => {
      setHyperdimensionalPatterns(data);
    });

    const unsubscribeNeuralNetworkState = on('neural:state', (data) => {
      setNeuralNetworkState(data);
    });

    const unsubscribeStrategyPerformance = on('strategy:performance', (data) => {
      setStrategyPerformance(data);
    });

    const unsubscribeTradeEvents = on('trades:event', (data) => {
      setTradeEvents((prev) => [data, ...prev].slice(0, 20));
    });

    // Clean up event listeners
    return () => {
      unsubscribeSystemStatus();
      unsubscribeActiveTrades();
      unsubscribeTradeHistory();
      unsubscribeMetrics();
      unsubscribeAgentStatus();
      unsubscribeAssetInfo();
      unsubscribeLeaderboard();
      unsubscribeQuantumPredictions();
      unsubscribeMlInsights();
      unsubscribeHyperdimensionalPatterns();
      unsubscribeNeuralNetworkState();
      unsubscribeStrategyPerformance();
      unsubscribeTradeEvents();
    };
  }, [isConnected, on, subscribe]);

  // Context value
  const value = {
    systemStatus,
    activeTrades,
    tradeHistory,
    metrics,
    agentStatus,
    assetInfo,
    leaderboard,
    quantumPredictions,
    mlInsights,
    hyperdimensionalPatterns,
    neuralNetworkState,
    strategyPerformance,
    performance,
    tradeEvents,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
