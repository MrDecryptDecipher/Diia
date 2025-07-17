import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  LinearProgress,
  useTheme,
  alpha,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Psychology,
  Science,
  Memory,
  Biotech,
  SmartToy,
  VisibilityOff,
  Star,
  Analytics,
  Speed,
} from '@mui/icons-material';
// import { formatPercentage } from '../../utils/formatters';

const AgentsLeaderboard = ({ agents = [] }) => {
  const theme = useTheme();

  // Simple percentage formatter
  const formatPercentage = (value) => {
    if (value === undefined || value === null) return '0%';
    return `${Math.round(value)}%`;
  };

  // Sort agents by accuracy (performance metric)
  const sortedAgents = [...agents].sort((a, b) => (b.accuracy || 0) - (a.accuracy || 0));
  
  // Get agent icon based on type
  const getAgentIcon = (type) => {
    const typeStr = type.toLowerCase();

    // Ghost agents
    if (typeStr.includes('ghost')) {
      return <VisibilityOff fontSize="small" />;
    }

    // God/Supreme agents
    if (typeStr.includes('god') || typeStr.includes('kernel')) {
      return <Star fontSize="small" />;
    }

    // Predictor agents
    if (typeStr.includes('predictor') || typeStr.includes('quantum')) {
      return <Science fontSize="small" />;
    }

    // Neural/Learning agents
    if (typeStr.includes('neural') || typeStr.includes('learning') || typeStr.includes('dynamic')) {
      return <Psychology fontSize="small" />;
    }

    // Analyzer agents
    if (typeStr.includes('analyzer') || typeStr.includes('analysis')) {
      return <Analytics fontSize="small" />;
    }

    // Executor agents
    if (typeStr.includes('executor') || typeStr.includes('trader')) {
      return <Speed fontSize="small" />;
    }

    // Legacy types
    switch (typeStr) {
      case 'quantum':
        return <Science fontSize="small" />;
      case 'neural':
        return <Psychology fontSize="small" />;
      case 'hybrid':
        return <Memory fontSize="small" />;
      case 'genetic':
        return <Biotech fontSize="small" />;
      default:
        return <SmartToy fontSize="small" />;
    }
  };
  
  // Get performance color based on accuracy
  const getPerformanceColor = (accuracy) => {
    if (accuracy >= 80) return theme.palette.success.main;
    if (accuracy >= 50) return theme.palette.info.main;
    if (accuracy >= 30) return theme.palette.warning.main;
    return theme.palette.error.main;
  };
  
  return (
    <Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Rank</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Agent</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Type</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Performance</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Intelligence</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Evolution</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Win Rate</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Connections</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedAgents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    No agents found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              sortedAgents.map((agent, index) => (
                <TableRow
                  key={agent.id}
                  sx={{
                    '&:nth-of-type(odd)': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    },
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    },
                  }}
                >
                  <TableCell>
                    <Chip
                      label={`#${index + 1}`}
                      size="small"
                      sx={{
                        backgroundColor: index < 3 ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                        color: index < 3 ? theme.palette.primary.main : 'inherit',
                        fontWeight: index < 3 ? 600 : 400,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          mr: 1,
                          backgroundColor: alpha(agent.color || theme.palette.primary.main, 0.1),
                          color: agent.color || theme.palette.primary.main,
                        }}
                      >
                        {agent.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {agent.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getAgentIcon(agent.type)}
                      label={agent.type}
                      size="small"
                      sx={{
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={agent.status}
                      size="small"
                      color={agent.status === 'active' ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
                      <Box sx={{ width: '100%', mb: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={agent.accuracy || 0}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: alpha(getPerformanceColor(agent.accuracy || 0), 0.1),
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 3,
                              backgroundColor: getPerformanceColor(agent.accuracy || 0),
                            },
                          }}
                        />
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: getPerformanceColor(agent.accuracy || 0),
                        }}
                      >
                        {formatPercentage(agent.accuracy || 0)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
                      <Box sx={{ width: '100%', mb: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={agent.intelligence || 85}
                          sx={{
                            height: 4,
                            borderRadius: 2,
                            backgroundColor: alpha(theme.palette.info.main, 0.1),
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 2,
                              backgroundColor: theme.palette.info.main,
                            },
                          }}
                        />
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 600,
                          color: theme.palette.info.main,
                        }}
                      >
                        {Math.round(agent.intelligence || 85)}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`Stage ${agent.evolutionStage || 1}`}
                      size="small"
                      sx={{
                        backgroundColor: alpha(theme.palette.warning.main, 0.1),
                        color: theme.palette.warning.main,
                        fontWeight: 600,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: (agent.successRate || 0) >= 50 ? theme.palette.success.main : theme.palette.error.main,
                        }}
                      >
                        {formatPercentage(agent.successRate || 0)}
                      </Typography>
                      {(agent.successRate || 0) >= 50 ? (
                        <TrendingUp fontSize="small" sx={{ ml: 0.5, color: theme.palette.success.main }} />
                      ) : (
                        <TrendingDown fontSize="small" sx={{ ml: 0.5, color: theme.palette.error.main }} />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={agent.connections}
                      size="small"
                      sx={{
                        backgroundColor: alpha(theme.palette.info.main, 0.1),
                        color: theme.palette.info.main,
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AgentsLeaderboard;
