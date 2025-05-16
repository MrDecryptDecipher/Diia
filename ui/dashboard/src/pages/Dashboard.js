import React from 'react';
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
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  ShowChart,
  Insights,
  Psychology,
  Biotech,
  Hub,
  MoreVert,
  ArrowForward,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useTheme as useCustomTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import { formatCurrency, formatPercentage, formatNumber, formatDate } from '../utils/formatters';

// Components
import MetricsCard from '../components/Dashboard/MetricsCard';
import CapitalChart from '../components/Dashboard/CapitalChart';
import ActiveTradesTable from '../components/Dashboard/ActiveTradesTable';
import AgentStatusCard from '../components/Dashboard/AgentStatusCard';
import AssetPerformanceCard from '../components/Dashboard/AssetPerformanceCard';
import SystemStatusCard from '../components/Dashboard/SystemStatusCard';
import TradeActivityFeed from '../components/Dashboard/TradeActivityFeed';
import QuantumVisualization from '../components/Visualizations/QuantumVisualization';

const Dashboard = () => {
  const muiTheme = useTheme();
  const { visualEffects, getAnimationDuration } = useCustomTheme();
  const { 
    systemStatus, 
    activeTrades, 
    metrics, 
    agentStatus, 
    assetInfo, 
    tradeEvents,
    performance,
  } = useData();
  const navigate = useNavigate();
  
  // Animation duration
  const duration = getAnimationDuration();
  
  // Container variants for animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1,
        duration: duration * 0.5,
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
        duration: duration * 0.5,
      },
    },
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
              OMNI-ALPHA VΩ∞∞ Dashboard
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{
                fontFamily: 'Rajdhani, sans-serif',
                color: muiTheme.palette.text.secondary,
              }}
            >
              Self-evolving, AI-governed, sovereign trading intelligence system
            </Typography>
          </Box>
        </motion.div>

        {/* Key Metrics */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <motion.div variants={itemVariants}>
              <MetricsCard
                title="Current Capital"
                value={metrics ? formatCurrency(metrics.currentCapital) : '$0.00'}
                icon={<ShowChart />}
                color={muiTheme.palette.primary.main}
                subtitle={metrics ? `Initial: ${formatCurrency(metrics.initialCapital)}` : ''}
                trend={metrics && metrics.pnl >= 0 ? 'up' : 'down'}
                trendValue={metrics ? `${metrics.pnl >= 0 ? '+' : ''}${formatCurrency(metrics.pnl)}` : ''}
              />
            </motion.div>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <motion.div variants={itemVariants}>
              <MetricsCard
                title="ROI"
                value={metrics ? `${formatNumber(metrics.pnlPercentage)}%` : '0%'}
                icon={metrics && metrics.pnlPercentage >= 0 ? <TrendingUp /> : <TrendingDown />}
                color={metrics && metrics.pnlPercentage >= 0 ? muiTheme.palette.success.main : muiTheme.palette.error.main}
                subtitle="Return on Investment"
                trend={metrics && metrics.pnlPercentage >= 0 ? 'up' : 'down'}
                trendValue={metrics ? `${metrics.pnlPercentage >= 0 ? '+' : ''}${formatNumber(metrics.pnlPercentage)}%` : ''}
              />
            </motion.div>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <motion.div variants={itemVariants}>
              <MetricsCard
                title="Win Rate"
                value={metrics ? `${formatNumber(metrics.winRate)}%` : '0%'}
                icon={<Insights />}
                color={muiTheme.palette.info.main}
                subtitle={metrics ? `${metrics.winningTrades}/${metrics.totalTrades} Trades` : ''}
                trend="neutral"
                trendValue=""
              />
            </motion.div>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <motion.div variants={itemVariants}>
              <MetricsCard
                title="Active Trades"
                value={activeTrades ? activeTrades.length : 0}
                icon={<ShowChart />}
                color={muiTheme.palette.secondary.main}
                subtitle="Open Positions"
                trend="neutral"
                trendValue=""
              />
            </motion.div>
          </Grid>
        </Grid>

        {/* Main Content */}
        <Grid container spacing={3}>
          {/* Left Column */}
          <Grid item xs={12} md={8}>
            {/* Capital Chart */}
            <motion.div variants={itemVariants}>
              <Card 
                sx={{ 
                  mb: 3,
                  background: 'rgba(17, 24, 39, 0.7)',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(muiTheme.palette.primary.main, 0.2)}`,
                }}
                className="futuristic-border"
              >
                <CardHeader
                  title={
                    <Typography variant="h6" sx={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600 }}>
                      Capital Growth
                    </Typography>
                  }
                  action={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Chip
                        label={metrics ? `${formatNumber(metrics.pnlPercentage)}%` : '0%'}
                        color={metrics && metrics.pnlPercentage >= 0 ? 'success' : 'error'}
                        size="small"
                        icon={metrics && metrics.pnlPercentage >= 0 ? <TrendingUp /> : <TrendingDown />}
                        sx={{ mr: 1 }}
                      />
                      <IconButton size="small">
                        <MoreVert fontSize="small" />
                      </IconButton>
                    </Box>
                  }
                />
                <Divider sx={{ opacity: 0.2 }} />
                <CardContent sx={{ height: 300 }}>
                  <CapitalChart performance={performance} />
                </CardContent>
              </Card>
            </motion.div>

            {/* Active Trades */}
            <motion.div variants={itemVariants}>
              <Card 
                sx={{ 
                  mb: 3,
                  background: 'rgba(17, 24, 39, 0.7)',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(muiTheme.palette.primary.main, 0.2)}`,
                }}
                className="futuristic-border"
              >
                <CardHeader
                  title={
                    <Typography variant="h6" sx={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600 }}>
                      Active Trades
                    </Typography>
                  }
                  action={
                    <Button
                      size="small"
                      endIcon={<ArrowForward />}
                      onClick={() => navigate('/trades')}
                    >
                      View All
                    </Button>
                  }
                />
                <Divider sx={{ opacity: 0.2 }} />
                <CardContent sx={{ p: 0 }}>
                  <ActiveTradesTable trades={activeTrades} />
                </CardContent>
              </Card>
            </motion.div>

            {/* Agent Status */}
            <motion.div variants={itemVariants}>
              <Card 
                sx={{ 
                  mb: { xs: 3, md: 0 },
                  background: 'rgba(17, 24, 39, 0.7)',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(muiTheme.palette.primary.main, 0.2)}`,
                }}
                className="futuristic-border neural-connections"
              >
                <CardHeader
                  title={
                    <Typography variant="h6" sx={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600 }}>
                      Agent Network
                    </Typography>
                  }
                  action={
                    <Button
                      size="small"
                      endIcon={<ArrowForward />}
                      onClick={() => navigate('/agents')}
                    >
                      View All
                    </Button>
                  }
                />
                <Divider sx={{ opacity: 0.2 }} />
                <CardContent>
                  <Grid container spacing={2}>
                    {agentStatus && agentStatus.slice(0, 4).map((agent) => (
                      <Grid item xs={12} sm={6} key={agent.id}>
                        <AgentStatusCard agent={agent} />
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Right Column */}
          <Grid item xs={12} md={4}>
            {/* System Status */}
            <motion.div variants={itemVariants}>
              <Card 
                sx={{ 
                  mb: 3,
                  background: 'rgba(17, 24, 39, 0.7)',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(muiTheme.palette.primary.main, 0.2)}`,
                }}
                className="futuristic-border"
              >
                <CardHeader
                  title={
                    <Typography variant="h6" sx={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600 }}>
                      System Status
                    </Typography>
                  }
                  action={
                    <Chip
                      label={systemStatus ? systemStatus.status : 'Unknown'}
                      color={systemStatus && systemStatus.status === 'online' ? 'success' : 'error'}
                      size="small"
                    />
                  }
                />
                <Divider sx={{ opacity: 0.2 }} />
                <CardContent>
                  <SystemStatusCard systemStatus={systemStatus} />
                </CardContent>
              </Card>
            </motion.div>

            {/* Quantum Visualization */}
            <motion.div variants={itemVariants}>
              <Card 
                sx={{ 
                  mb: 3,
                  background: 'rgba(17, 24, 39, 0.7)',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(muiTheme.palette.primary.main, 0.2)}`,
                }}
                className="futuristic-border quantum-particles"
              >
                <CardHeader
                  title={
                    <Typography variant="h6" sx={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600 }}>
                      Quantum Prediction
                    </Typography>
                  }
                  action={
                    <Button
                      size="small"
                      endIcon={<ArrowForward />}
                      onClick={() => navigate('/quantum')}
                    >
                      Details
                    </Button>
                  }
                />
                <Divider sx={{ opacity: 0.2 }} />
                <CardContent sx={{ height: 200 }}>
                  <QuantumVisualization />
                </CardContent>
              </Card>
            </motion.div>

            {/* Asset Performance */}
            <motion.div variants={itemVariants}>
              <Card 
                sx={{ 
                  mb: 3,
                  background: 'rgba(17, 24, 39, 0.7)',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(muiTheme.palette.primary.main, 0.2)}`,
                }}
                className="futuristic-border"
              >
                <CardHeader
                  title={
                    <Typography variant="h6" sx={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600 }}>
                      Top Assets
                    </Typography>
                  }
                  action={
                    <Button
                      size="small"
                      endIcon={<ArrowForward />}
                      onClick={() => navigate('/assets')}
                    >
                      View All
                    </Button>
                  }
                />
                <Divider sx={{ opacity: 0.2 }} />
                <CardContent>
                  <AssetPerformanceCard assets={assetInfo} />
                </CardContent>
              </Card>
            </motion.div>

            {/* Trade Activity */}
            <motion.div variants={itemVariants}>
              <Card 
                sx={{ 
                  background: 'rgba(17, 24, 39, 0.7)',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(muiTheme.palette.primary.main, 0.2)}`,
                }}
                className="futuristic-border"
              >
                <CardHeader
                  title={
                    <Typography variant="h6" sx={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600 }}>
                      Trade Activity
                    </Typography>
                  }
                />
                <Divider sx={{ opacity: 0.2 }} />
                <CardContent sx={{ p: 0 }}>
                  <TradeActivityFeed events={tradeEvents} />
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      </motion.div>
    </Box>
  );
};

export default Dashboard;
