import React, { useState, useEffect } from 'react';
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
import {
  AgentsLeaderboard,
  StrategiesLeaderboard,
  AssetsLeaderboard,
  UsersLeaderboard,
} from '../components/Leaderboard';

const Leaderboard = () => {
  const theme = useTheme();
  const { agents, strategies, assets, users } = useData();
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data for demonstration
  const [mockData, setMockData] = useState({
    agents: [],
    strategies: [],
    assets: [],
    users: [],
  });

  // Initialize mock data
  useEffect(() => {
    // Generate mock agents
    const mockAgents = Array.from({ length: 10 }, (_, i) => ({
      id: `agent-${i + 1}`,
      name: `Agent ${i + 1}`,
      type: ['Quantum', 'Neural', 'Hybrid', 'Genetic', 'Reinforcement'][Math.floor(Math.random() * 5)],
      status: Math.random() > 0.3 ? 'active' : 'inactive',
      performance: Math.random() * 100,
      winRate: Math.random(),
      tradesCount: Math.floor(Math.random() * 1000),
      connections: Math.floor(Math.random() * 20),
      color: ['#3f51b5', '#f50057', '#00bcd4', '#4caf50', '#ff9800'][Math.floor(Math.random() * 5)],
    }));

    // Generate mock strategies
    const mockStrategies = Array.from({ length: 10 }, (_, i) => ({
      id: `strategy-${i + 1}`,
      name: `Strategy ${i + 1}`,
      type: ['Trend', 'Momentum', 'Mean-Reversion', 'Quantum', 'ML-Based'][Math.floor(Math.random() * 5)],
      performance: Math.random() * 100,
      winRate: Math.random(),
      avgProfit: (Math.random() * 200) - 50,
      tradesCount: Math.floor(Math.random() * 1000),
      agentsCount: Math.floor(Math.random() * 10) + 1,
    }));

    // Generate mock assets
    const mockAssets = Array.from({ length: 10 }, (_, i) => ({
      id: `asset-${i + 1}`,
      symbol: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT', 'ADA/USDT', 'DOGE/USDT', 'AVAX/USDT', 'MATIC/USDT', 'DOT/USDT'][i],
      name: ['Bitcoin', 'Ethereum', 'Solana', 'Binance Coin', 'Ripple', 'Cardano', 'Dogecoin', 'Avalanche', 'Polygon', 'Polkadot'][i],
      category: ['Cryptocurrency', 'DeFi', 'Layer 1', 'Exchange Token', 'Payment'][Math.floor(Math.random() * 5)],
      price: Math.random() * 50000,
      priceChange24h: (Math.random() * 0.2) - 0.1,
      volume: Math.random() * 10000000000,
      opportunityScore: Math.random() * 100,
      trending: Math.random() > 0.7,
    }));

    // Generate mock users
    const mockUsers = Array.from({ length: 10 }, (_, i) => ({
      id: `user-${i + 1}`,
      username: `User${i + 1}`,
      avatar: '',
      verified: Math.random() > 0.7,
      level: Math.floor(Math.random() * 10) + 1,
      performance: Math.random() * 100,
      winRate: Math.random(),
      totalPnl: (Math.random() * 100000) - 20000,
      tradesCount: Math.floor(Math.random() * 1000),
      status: Math.random() > 0.3 ? 'online' : 'offline',
    }));

    setMockData({
      agents: mockAgents,
      strategies: mockStrategies,
      assets: mockAssets,
      users: mockUsers,
    });

    setIsLoading(false);
  }, []);

  // Handle tab change
  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
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
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Loading leaderboard data...
          </Typography>
        </Box>
      );
    }

    switch (activeTab) {
      case 0:
        return <AgentsLeaderboard agents={agents || mockData.agents} />;
      case 1:
        return <StrategiesLeaderboard strategies={strategies || mockData.strategies} />;
      case 2:
        return <AssetsLeaderboard assets={assets || mockData.assets} />;
      case 3:
        return <UsersLeaderboard users={users || mockData.users} />;
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
              Leaderboard
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{
                fontFamily: 'Rajdhani, sans-serif',
                color: theme.palette.text.secondary,
              }}
            >
              Performance rankings of agents and strategies
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
            className="futuristic-border"
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
                  <Tab label="Agents" />
                  <Tab label="Strategies" />
                  <Tab label="Assets" />
                  <Tab label="Users" />
                </Tabs>
              }
            />
            <Divider sx={{ opacity: 0.2 }} />
            <CardContent>
              {renderTabContent()}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </Box>
  );
};

export default Leaderboard;
