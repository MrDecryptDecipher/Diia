import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Button,
  useTheme,
  CircularProgress,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useData } from '../context/DataContext';
import {
  AgentDetailCard,
  AgentPerformanceChart,
  AgentTradesTable,
  AgentConnectionsGraph,
} from '../components/Agents';

const AgentDetail = () => {
  const { id } = useParams();
  const theme = useTheme();
  const navigate = useNavigate();
  const { agentStatus, tradeHistory } = useData();
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState([]);
  const [agentTrades, setAgentTrades] = useState([]);
  const [connectedAgents, setConnectedAgents] = useState([]);

  // Find agent by ID
  useEffect(() => {
    if (!agentStatus || agentStatus.length === 0) return;

    const foundAgent = agentStatus.find(a => a.id === id);
    if (foundAgent) {
      setAgent(foundAgent);

      // Generate mock performance data if not available
      if (!foundAgent.performanceHistory) {
        const mockPerformanceData = [];
        const now = new Date();
        for (let i = 0; i < 24; i++) {
          const timestamp = new Date(now.getTime() - (23 - i) * 3600000);
          mockPerformanceData.push({
            timestamp: timestamp.toISOString(),
            accuracy: Math.min(100, Math.max(0, foundAgent.accuracy + (Math.random() * 10 - 5))),
            efficiency: Math.min(100, Math.max(0, foundAgent.efficiency + (Math.random() * 10 - 5))),
            confidence: Math.min(100, Math.max(0, foundAgent.confidence + (Math.random() * 10 - 5))),
            adaptability: Math.min(100, Math.max(0, foundAgent.adaptability + (Math.random() * 10 - 5))),
          });
        }
        setPerformanceData(mockPerformanceData);
      } else {
        setPerformanceData(foundAgent.performanceHistory);
      }

      // Find connected agents
      if (agentStatus.length > 1) {
        // In a real app, this would come from the API
        // For now, we'll create mock connections
        const mockConnections = agentStatus
          .filter(a => a.id !== id)
          .slice(0, 5)
          .map(a => ({
            ...a,
            connectionStrength: Math.random() * 0.8 + 0.2, // Random strength between 0.2 and 1.0
          }));
        setConnectedAgents(mockConnections);
      }

      setLoading(false);
    } else {
      // Agent not found, redirect to agents page
      navigate('/agents');
    }
  }, [id, agentStatus, navigate]);

  // Filter trades for this agent
  useEffect(() => {
    if (!tradeHistory || tradeHistory.length === 0 || !agent) return;

    const filteredTrades = tradeHistory.filter(trade => trade.agentId === id);
    setAgentTrades(filteredTrades);
  }, [id, tradeHistory, agent]);

  // Handle back button click
  const handleBack = () => {
    navigate('/agents');
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
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
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Button
                startIcon={<ArrowBack />}
                onClick={handleBack}
                sx={{ mb: 1 }}
              >
                Back to Agents
              </Button>
              <Typography
                variant="h4"
                sx={{
                  fontFamily: 'Orbitron, sans-serif',
                  fontWeight: 700,
                  mb: 1,
                  color: agent.color,
                }}
                className="glow-text"
              >
                {agent.name}
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{
                  fontFamily: 'Rajdhani, sans-serif',
                  color: theme.palette.text.secondary,
                }}
              >
                {agent.type.charAt(0).toUpperCase() + agent.type.slice(1)} Agent • Evolution Stage {agent.evolutionStage}
              </Typography>
            </Box>
          </Box>
        </motion.div>

        {/* Agent Details */}
        <Grid container spacing={3}>
          {/* Agent Detail Card */}
          <Grid item xs={12} md={6}>
            <motion.div variants={itemVariants}>
              <AgentDetailCard agent={agent} />
            </motion.div>
          </Grid>

          {/* Performance Chart */}
          <Grid item xs={12} md={6}>
            <motion.div variants={itemVariants}>
              <AgentPerformanceChart agent={agent} performanceData={performanceData} />
            </motion.div>
          </Grid>

          {/* Agent Connections */}
          <Grid item xs={12}>
            <motion.div variants={itemVariants}>
              <AgentConnectionsGraph agent={agent} connectedAgents={connectedAgents} />
            </motion.div>
          </Grid>

          {/* Agent Trades */}
          <Grid item xs={12}>
            <motion.div variants={itemVariants}>
              <AgentTradesTable trades={agentTrades} />
            </motion.div>
          </Grid>
        </Grid>
      </motion.div>
    </Box>
  );
};

export default AgentDetail;
