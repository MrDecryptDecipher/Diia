import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Divider,
  useTheme,
  alpha,
  Tabs,
  Tab,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useData } from '../context/DataContext';

// Import quantum components
import QuantumPredictor from '../components/Quantum/QuantumPredictor';
import SpectralTree from '../components/Quantum/SpectralTree';
import QuantumEntanglement from '../components/Quantum/QuantumEntanglement';
import HyperdimensionalComputing from '../components/Quantum/HyperdimensionalComputing';
import LoadingIndicator from '../components/Common/LoadingIndicator';

const QuantumAnalytics = () => {
  const theme = useTheme();
  const { } = useData(); // We'll use real data in the future
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for demonstration
  const [mockData] = useState({
    predictor: {
      data: Array.from({ length: 30 }, (_, i) => ({
        time: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
        actual: 50000 + Math.random() * 10000,
        predicted: 50000 + Math.random() * 10000,
        lower: 45000 + Math.random() * 5000,
        upper: 55000 + Math.random() * 5000,
      })),
    },
    spectralTree: {
      name: "Market Analysis",
      children: [
        {
          name: "Price Action",
          children: [
            { name: "Trend", children: [{ name: "Bullish" }, { name: "Bearish" }] },
            { name: "Support/Resistance", children: [{ name: "Strong" }, { name: "Weak" }] },
          ]
        },
        {
          name: "Volume Profile",
          children: [
            { name: "High", children: [{ name: "Increasing" }, { name: "Decreasing" }] },
            { name: "Low", children: [{ name: "Increasing" }, { name: "Decreasing" }] },
          ]
        },
        {
          name: "Market Sentiment",
          children: [
            { name: "Positive" },
            { name: "Negative" },
            { name: "Neutral" },
          ]
        }
      ]
    },
    entanglement: {
      assets: [
        {
          symbol: "BTC",
          name: "Bitcoin",
          marketCap: 1000000000000,
          sector: "Cryptocurrency",
          correlations: [
            { symbol: "ETH", value: 0.92 },
            { symbol: "SOL", value: 0.78 },
            { symbol: "GOLD", value: -0.64 },
          ]
        },
        {
          symbol: "ETH",
          name: "Ethereum",
          marketCap: 500000000000,
          sector: "Cryptocurrency",
          correlations: [
            { symbol: "BTC", value: 0.92 },
            { symbol: "SOL", value: 0.85 },
            { symbol: "XRP", value: 0.76 },
          ]
        },
        {
          symbol: "SOL",
          name: "Solana",
          marketCap: 50000000000,
          sector: "Cryptocurrency",
          correlations: [
            { symbol: "BTC", value: 0.78 },
            { symbol: "ETH", value: 0.85 },
            { symbol: "AVAX", value: 0.87 },
          ]
        },
        {
          symbol: "AVAX",
          name: "Avalanche",
          marketCap: 20000000000,
          sector: "Cryptocurrency",
          correlations: [
            { symbol: "SOL", value: 0.87 },
            { symbol: "ETH", value: 0.72 },
          ]
        },
        {
          symbol: "XRP",
          name: "Ripple",
          marketCap: 30000000000,
          sector: "Cryptocurrency",
          correlations: [
            { symbol: "ETH", value: 0.76 },
            { symbol: "BNB", value: 0.68 },
          ]
        },
        {
          symbol: "BNB",
          name: "Binance Coin",
          marketCap: 70000000000,
          sector: "Exchange Token",
          correlations: [
            { symbol: "XRP", value: 0.68 },
            { symbol: "ADA", value: 0.81 },
          ]
        },
        {
          symbol: "ADA",
          name: "Cardano",
          marketCap: 25000000000,
          sector: "Cryptocurrency",
          correlations: [
            { symbol: "BNB", value: 0.81 },
          ]
        },
        {
          symbol: "GOLD",
          name: "Gold",
          marketCap: 12000000000000,
          sector: "Commodity",
          correlations: [
            { symbol: "BTC", value: -0.64 },
          ]
        },
      ]
    },
    hyperdimensional: {
      projections: [
        { x: 0.2, y: 0.3, value: 0.8, label: "BTC", cluster: 1 },
        { x: 0.3, y: 0.4, value: 0.7, label: "ETH", cluster: 1 },
        { x: 0.25, y: 0.35, value: 0.75, label: "SOL", cluster: 1 },
        { x: -0.6, y: 0.2, value: 0.4, label: "GOLD", cluster: 2 },
        { x: -0.5, y: 0.3, value: 0.5, label: "SILVER", cluster: 2 },
        { x: -0.1, y: -0.7, value: 0.3, label: "USD", cluster: 3 },
        { x: 0.0, y: -0.6, value: 0.2, label: "EUR", cluster: 3 },
        { x: 0.6, y: -0.2, value: 0.6, label: "AAPL", cluster: 4 },
        { x: 0.5, y: -0.3, value: 0.55, label: "MSFT", cluster: 4 },
      ],
      clusters: [
        { id: 1, x: 0.25, y: 0.35, radius: 0.2, label: "Crypto" },
        { id: 2, x: -0.55, y: 0.25, radius: 0.15, label: "Precious Metals" },
        { id: 3, x: -0.05, y: -0.65, radius: 0.15, label: "Fiat Currencies" },
        { id: 4, x: 0.55, y: -0.25, radius: 0.15, label: "Tech Stocks" },
      ],
      dimensions: [
        { id: 1, angle: 0, label: "Price Momentum", importance: 0.94 },
        { id: 2, angle: Math.PI / 4, label: "Volume Profile", importance: 0.89 },
        { id: 3, angle: Math.PI / 2, label: "Market Sentiment", importance: 0.87 },
        { id: 4, angle: 3 * Math.PI / 4, label: "Volatility", importance: 0.85 },
        { id: 5, angle: Math.PI, label: "Order Flow", importance: 0.82 },
        { id: 6, angle: 5 * Math.PI / 4, label: "Liquidity", importance: 0.78 },
        { id: 7, angle: 3 * Math.PI / 2, label: "News Sentiment", importance: 0.75 },
        { id: 8, angle: 7 * Math.PI / 4, label: "Social Media", importance: 0.72 },
      ]
    }
  });

  // Handle tab change
  const handleTabChange = (_, newValue) => {
    setIsLoading(true);
    setActiveTab(newValue);

    // Simulate loading
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

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

  // Render tab content
  const renderTabContent = () => {
    if (isLoading) {
      return <LoadingIndicator message="Loading quantum data..." />;
    }

    switch (activeTab) {
      case 0:
        return <QuantumPredictor data={mockData.predictor.data} />;
      case 1:
        return <SpectralTree data={mockData.spectralTree} />;
      case 2:
        return <QuantumEntanglement data={mockData.entanglement} />;
      case 3:
        return <HyperdimensionalComputing data={mockData.hyperdimensional} />;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ pb: 4 }}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
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
              Quantum Analytics
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{
                fontFamily: 'Rajdhani, sans-serif',
                color: theme.palette.text.secondary,
              }}
            >
              Advanced quantum-inspired algorithms for market prediction and analysis
            </Typography>
          </Box>
        </motion.div>

        {/* Tabs */}
        <motion.div variants={itemVariants}>
          <Card
            sx={{
              mb: 3,
              background: 'rgba(17, 24, 39, 0.7)',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            }}
            className="futuristic-border quantum-particles"
          >
            <CardHeader
              title={
                <Tabs
                  value={activeTab}
                  onChange={handleTabChange}
                  textColor="primary"
                  indicatorColor="primary"
                  sx={{
                    '& .MuiTab-root': {
                      fontFamily: 'Rajdhani, sans-serif',
                      fontWeight: 600,
                      minWidth: 120,
                    },
                  }}
                >
                  <Tab label="Quantum Predictor" />
                  <Tab label="Spectral Tree" />
                  <Tab label="Entanglement" />
                  <Tab label="Hyperdimensional" />
                </Tabs>
              }
            />
            <Divider sx={{ opacity: 0.2 }} />
            <CardContent>
              <Box sx={{ p: 2, minHeight: 400 }}>
                {renderTabContent()}
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </Box>
  );
};

export default QuantumAnalytics;
