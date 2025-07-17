import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

// Create context
const DataContext = createContext();

// Custom hook to use the data context
export const useData = () => useContext(DataContext);

// Data provider component
export const DataProvider = ({ children }) => {
  console.log('🚀 DataProvider component mounted!');

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
  const API_URL = process.env.REACT_APP_API_URL || 'http://3.111.22.56:10002';

  // Fetch initial data from API
  useEffect(() => {
    console.log('🔧 DataContext: useEffect triggered, API_URL:', API_URL);
    const fetchInitialData = async () => {
      console.log('🔧 DataContext: Starting fetchInitialData...');
      try {
        // Fetch system status
        const systemStatusResponse = await axios.get(`${API_URL}/api/system/status`);
        setSystemStatus(systemStatusResponse.data);

        // Fetch trading status (the correct endpoint)
        const tradingStatusResponse = await axios.get(`${API_URL}/api/trading/status`);
        // Trading status is included in metrics, so we don't need a separate state

        // Fetch active trades
        console.log('🔧 DataContext: Fetching active trades...');
        const activeTradesResponse = await axios.get(`${API_URL}/api/trades/active`);
        console.log('🔧 DataContext: Active trades received:', activeTradesResponse.data?.length || 0, 'trades');
        setActiveTrades(activeTradesResponse.data);

        // Fetch trade history
        console.log('🔧 DataContext: Fetching trade history...');
        const tradeHistoryResponse = await axios.get(`${API_URL}/api/trades/history`);
        console.log('🔧 DataContext: Trade history received:', tradeHistoryResponse.data?.length || 0, 'trades');
        setTradeHistory(tradeHistoryResponse.data);

        // Fetch metrics
        console.log('🔧 DataContext: Fetching metrics...');
        const metricsResponse = await axios.get(`${API_URL}/api/metrics`);
        console.log('🔧 DataContext: Metrics received:', metricsResponse.data);
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

    // Set up periodic refresh every 5 seconds to ensure data persistence
    const refreshInterval = setInterval(() => {
      console.log('🔄 DataContext: Periodic refresh triggered');
      fetchInitialData();
    }, 5000);

    // Cleanup interval on unmount
    return () => {
      clearInterval(refreshInterval);
    };
  }, [API_URL]);

  // WebSocket functionality disabled to prevent data clearing
  // TODO: Re-implement WebSocket with proper data validation once backend is configured

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
