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
} from '@mui/icons-material';
import { formatPercentage } from '../../utils/formatters';

const AgentsLeaderboard = ({ agents = [] }) => {
  const theme = useTheme();
  
  // Sort agents by performance
  const sortedAgents = [...agents].sort((a, b) => b.performance - a.performance);
  
  // Get agent icon based on type
  const getAgentIcon = (type) => {
    switch (type.toLowerCase()) {
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
  
  // Get performance color
  const getPerformanceColor = (performance) => {
    if (performance >= 80) return theme.palette.success.main;
    if (performance >= 50) return theme.palette.info.main;
    if (performance >= 30) return theme.palette.warning.main;
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
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Win Rate</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Trades</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Connections</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedAgents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
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
                          value={agent.performance}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: alpha(getPerformanceColor(agent.performance), 0.1),
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 3,
                              backgroundColor: getPerformanceColor(agent.performance),
                            },
                          }}
                        />
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: getPerformanceColor(agent.performance),
                        }}
                      >
                        {formatPercentage(agent.performance / 100)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: agent.winRate >= 0.5 ? theme.palette.success.main : theme.palette.error.main,
                        }}
                      >
                        {formatPercentage(agent.winRate)}
                      </Typography>
                      {agent.winRate >= 0.5 ? (
                        <TrendingUp fontSize="small" sx={{ ml: 0.5, color: theme.palette.success.main }} />
                      ) : (
                        <TrendingDown fontSize="small" sx={{ ml: 0.5, color: theme.palette.error.main }} />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {agent.tradesCount}
                    </Typography>
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
