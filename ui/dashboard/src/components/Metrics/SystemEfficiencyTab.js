import React from 'react';
import { Grid, Box, Typography, Paper, useTheme, alpha, CircularProgress } from '@mui/material';
import MetricCard from './MetricCard';
import MetricChart from './MetricChart';
import MetricProgress from './MetricProgress';
import MemoryIcon from '@mui/icons-material/Memory';
import BoltIcon from '@mui/icons-material/Bolt';
import SpeedIcon from '@mui/icons-material/Speed';
import SettingsIcon from '@mui/icons-material/Settings';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import PsychologyIcon from '@mui/icons-material/Psychology';
import DataObjectIcon from '@mui/icons-material/DataObject';
import BalanceIcon from '@mui/icons-material/Balance';

const SystemEfficiencyTab = ({ metrics }) => {
  const theme = useTheme();

  // Generate quantum prediction accuracy data
  const quantumAccuracyData = Array.from({ length: 10 }, (_, i) => ({
    day: i + 1,
    accuracy: metrics.quantumPredictionAccuracy * (0.9 + Math.random() * 0.2)
  }));

  // Generate hyperdimensional pattern accuracy data
  const patternAccuracyData = Array.from({ length: 10 }, (_, i) => ({
    day: i + 1,
    accuracy: metrics.hyperdimensionalPatternAccuracy * (0.9 + Math.random() * 0.2)
  }));

  // Generate system efficiency data
  const systemEfficiencyData = Array.from({ length: 10 }, (_, i) => ({
    day: i + 1,
    efficiency: metrics.systemEfficiency * (0.9 + Math.random() * 0.2)
  }));

  // Generate capital utilization data
  const capitalUtilizationData = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    utilization: metrics.capitalUtilization * (0.7 + Math.random() * 0.6)
  }));

  // Generate agent performance data
  const agentPerformanceData = [
    { name: 'QuantumPredictor', performance: Math.random() * 20 + 80 },
    { name: 'ZeroLossEnforcer', performance: Math.random() * 20 + 80 },
    { name: 'HyperdimensionalPatternRecognizer', performance: Math.random() * 20 + 80 },
    { name: 'GodKernel', performance: Math.random() * 20 + 80 },
    { name: 'AntiLossHedger', performance: Math.random() * 20 + 80 }
  ];

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
        System Efficiency & Advanced Metrics
      </Typography>

      <Grid container spacing={3}>
        {/* Top metrics cards */}
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="System Efficiency"
            value={metrics.systemEfficiency}
            unit="%"
            trend="up"
            color={theme.palette.primary.main}
            icon={SettingsIcon}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Capital Utilization"
            value={metrics.capitalUtilization}
            unit="%"
            trend="up"
            color={theme.palette.secondary.main}
            icon={BalanceIcon}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Risk/Reward Ratio"
            value={metrics.riskRewardRatio}
            trend="up"
            color={theme.palette.warning.main}
            icon={AutoGraphIcon}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="God Kernel Evolution"
            value={metrics.godKernelEvolutionStage}
            unit="/10"
            trend="up"
            color={theme.palette.info.dark}
            icon={MemoryIcon}
          />
        </Grid>

        {/* System efficiency chart */}
        <Grid item xs={12} md={6}>
          <MetricChart
            title="System Efficiency Trend"
            data={systemEfficiencyData}
            type="line"
            dataKey="efficiency"
            xAxisKey="day"
            color={theme.palette.primary.main}
            height={300}
            description="System efficiency over the last 10 days"
          />
        </Grid>

        {/* Capital utilization chart */}
        <Grid item xs={12} md={6}>
          <MetricChart
            title="Capital Utilization (24h)"
            data={capitalUtilizationData}
            type="area"
            dataKey="utilization"
            xAxisKey="hour"
            color={theme.palette.secondary.main}
            gradientColor={true}
            height={300}
            description="Capital utilization by hour"
          />
        </Grid>

        {/* Quantum metrics */}
        <Grid item xs={12} sm={6} md={4}>
          <MetricProgress
            title="Quantum Prediction Accuracy"
            value={metrics.quantumPredictionAccuracy}
            maxValue={100}
            type="circular"
            color={theme.palette.info.main}
            description="Accuracy of quantum-based predictions"
          />
        </Grid>

        {/* Hyperdimensional metrics */}
        <Grid item xs={12} sm={6} md={4}>
          <MetricProgress
            title="Hyperdimensional Pattern Accuracy"
            value={metrics.hyperdimensionalPatternAccuracy}
            maxValue={100}
            type="circular"
            color={theme.palette.secondary.main}
            description="Accuracy of hyperdimensional pattern recognition"
          />
        </Grid>

        {/* Zero loss metrics */}
        <Grid item xs={12} sm={6} md={4}>
          <MetricProgress
            title="Zero Loss Enforcement"
            value={metrics.zeroLossEnforcementEfficiency}
            maxValue={100}
            type="circular"
            color={theme.palette.success.main}
            description="Efficiency of the zero loss enforcement system"
          />
        </Grid>

        {/* Quantum prediction chart */}
        <Grid item xs={12} md={6}>
          <MetricChart
            title="Quantum Prediction Accuracy Trend"
            data={quantumAccuracyData}
            type="line"
            dataKey="accuracy"
            xAxisKey="day"
            color={theme.palette.info.main}
            height={300}
            description="Quantum prediction accuracy over the last 10 days"
          />
        </Grid>

        {/* Hyperdimensional pattern chart */}
        <Grid item xs={12} md={6}>
          <MetricChart
            title="Hyperdimensional Pattern Accuracy Trend"
            data={patternAccuracyData}
            type="line"
            dataKey="accuracy"
            xAxisKey="day"
            color={theme.palette.secondary.main}
            height={300}
            description="Hyperdimensional pattern recognition accuracy over the last 10 days"
          />
        </Grid>

        {/* Agent performance */}
        <Grid item xs={12}>
          <Paper
            elevation={2}
            sx={{
              p: 2,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: theme.shadows[8],
              }
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Agent Performance Metrics
            </Typography>

            <Grid container spacing={2}>
              {agentPerformanceData.map((agent, index) => (
                <Grid item xs={12} sm={6} md={2.4} key={index}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1, textAlign: 'center' }}>
                      {agent.name}
                    </Typography>
                    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                      <CircularProgress
                        variant="determinate"
                        value={agent.performance}
                        size={80}
                        thickness={4}
                        sx={{ color: getAgentColor(agent.name, theme) }}
                      />
                      <Box
                        sx={{
                          top: 0,
                          left: 0,
                          bottom: 0,
                          right: 0,
                          position: 'absolute',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Typography variant="caption" component="div" sx={{ fontWeight: 'bold' }}>
                          {`${Math.round(agent.performance)}%`}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

// Helper function to get agent color
const getAgentColor = (agentName, theme) => {
  switch (agentName) {
    case 'QuantumPredictor':
      return theme.palette.info.main;
    case 'ZeroLossEnforcer':
      return theme.palette.success.main;
    case 'HyperdimensionalPatternRecognizer':
      return theme.palette.secondary.main;
    case 'GodKernel':
      return theme.palette.warning.main;
    case 'AntiLossHedger':
      return theme.palette.error.main;
    default:
      return theme.palette.primary.main;
  }
};

export default SystemEfficiencyTab;
