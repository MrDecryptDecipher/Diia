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
  LinearProgress,
  useTheme,
  alpha,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Timeline,
  ShowChart,
  BarChart,
  Insights,
  Psychology,
  Security,
  Star,
} from '@mui/icons-material';
import { formatPercentage, formatCurrency } from '../../utils/formatters';

const StrategiesLeaderboard = ({ strategies = [] }) => {
  const theme = useTheme();
  
  // Sort strategies by performance
  const sortedStrategies = [...strategies].sort((a, b) => b.performance - a.performance);
  
  // Get strategy icon based on type
  const getStrategyIcon = (type) => {
    const typeStr = type.toLowerCase();

    if (typeStr.includes('quantum')) {
      return <Insights fontSize="small" />;
    }
    if (typeStr.includes('neural') || typeStr.includes('network')) {
      return <Psychology fontSize="small" />;
    }
    if (typeStr.includes('pattern') || typeStr.includes('candlestick')) {
      return <BarChart fontSize="small" />;
    }
    if (typeStr.includes('sentiment') || typeStr.includes('volume')) {
      return <ShowChart fontSize="small" />;
    }
    if (typeStr.includes('fibonacci') || typeStr.includes('technical')) {
      return <Timeline fontSize="small" />;
    }
    if (typeStr.includes('risk') || typeStr.includes('ghost')) {
      return <Security fontSize="small" />;
    }

    // Legacy types
    switch (typeStr) {
      case 'trend':
        return <Timeline fontSize="small" />;
      case 'momentum':
        return <ShowChart fontSize="small" />;
      case 'mean-reversion':
        return <BarChart fontSize="small" />;
      case 'quantum':
        return <Insights fontSize="small" />;
      default:
        return <Psychology fontSize="small" />;
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
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Strategy</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Type</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Performance</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Win Rate</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Avg. Profit</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Accuracy</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Risk Score</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Trades</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Agents</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedStrategies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    No strategies found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              sortedStrategies.map((strategy, index) => (
                <TableRow
                  key={strategy.id}
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
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {strategy.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getStrategyIcon(strategy.type)}
                      label={strategy.type}
                      size="small"
                      sx={{
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
                      <Box sx={{ width: '100%', mb: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={strategy.performance}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: alpha(getPerformanceColor(strategy.performance), 0.1),
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 3,
                              backgroundColor: getPerformanceColor(strategy.performance),
                            },
                          }}
                        />
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: getPerformanceColor(strategy.performance),
                        }}
                      >
                        {formatPercentage(strategy.performance / 100)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: strategy.winRate >= 0.5 ? theme.palette.success.main : theme.palette.error.main,
                        }}
                      >
                        {formatPercentage(strategy.winRate)}
                      </Typography>
                      {strategy.winRate >= 0.5 ? (
                        <TrendingUp fontSize="small" sx={{ ml: 0.5, color: theme.palette.success.main }} />
                      ) : (
                        <TrendingDown fontSize="small" sx={{ ml: 0.5, color: theme.palette.error.main }} />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: strategy.avgProfit >= 0 ? theme.palette.success.main : theme.palette.error.main,
                      }}
                    >
                      {strategy.avgProfit >= 0 ? '+' : ''}
                      {formatCurrency(strategy.avgProfit)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Star sx={{ color: theme.palette.warning.main, fontSize: 16, mr: 0.5 }} />
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: strategy.accuracy >= 90 ? theme.palette.success.main :
                                 strategy.accuracy >= 80 ? theme.palette.info.main : theme.palette.warning.main,
                        }}
                      >
                        {strategy.accuracy ? `${strategy.accuracy.toFixed(1)}%` : 'N/A'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={strategy.riskScore ? `${strategy.riskScore}/100` : 'N/A'}
                      size="small"
                      sx={{
                        backgroundColor: strategy.riskScore <= 20 ? alpha(theme.palette.success.main, 0.1) :
                                        strategy.riskScore <= 40 ? alpha(theme.palette.warning.main, 0.1) :
                                        alpha(theme.palette.error.main, 0.1),
                        color: strategy.riskScore <= 20 ? theme.palette.success.main :
                               strategy.riskScore <= 40 ? theme.palette.warning.main :
                               theme.palette.error.main,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {strategy.tradesCount}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={strategy.agentsCount}
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

export default StrategiesLeaderboard;
