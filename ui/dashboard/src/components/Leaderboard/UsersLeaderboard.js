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
  EmojiEvents,
  WorkspacePremium,
  Verified,
} from '@mui/icons-material';
import { formatPercentage, formatCurrency } from '../../utils/formatters';

const UsersLeaderboard = ({ users = [] }) => {
  const theme = useTheme();
  
  // Sort users by performance
  const sortedUsers = [...users].sort((a, b) => b.performance - a.performance);
  
  // Get badge based on rank
  const getBadge = (rank) => {
    if (rank === 0) return <EmojiEvents sx={{ color: '#FFD700' }} />;
    if (rank === 1) return <EmojiEvents sx={{ color: '#C0C0C0' }} />;
    if (rank === 2) return <EmojiEvents sx={{ color: '#CD7F32' }} />;
    return null;
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
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Elite Trader</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Agent Type</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Level</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Performance</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Intelligence</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Win Rate</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Total PnL</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Trades</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    No elite traders found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              sortedUsers.map((user, index) => (
                <TableRow
                  key={user.id}
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
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {getBadge(index)}
                      <Chip
                        label={`#${index + 1}`}
                        size="small"
                        sx={{
                          ml: getBadge(index) ? 1 : 0,
                          backgroundColor: index < 3 ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                          color: index < 3 ? theme.palette.primary.main : 'inherit',
                          fontWeight: index < 3 ? 600 : 400,
                        }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar
                        src={user.avatar}
                        alt={user.username}
                        sx={{
                          width: 32,
                          height: 32,
                          mr: 1,
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        }}
                      >
                        {user.username.charAt(0).toUpperCase()}
                      </Avatar>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {user.username}
                        {user.verified && (
                          <Verified sx={{ ml: 0.5, fontSize: 16, color: theme.palette.info.main }} />
                        )}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.agentType ? user.agentType.replace(/_/g, ' ').toUpperCase() : 'AGENT'}
                      size="small"
                      sx={{
                        backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                        color: theme.palette.secondary.main,
                        fontWeight: 600,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={<WorkspacePremium fontSize="small" />}
                      label={`Level ${user.level}`}
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
                          value={user.performance}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: alpha(getPerformanceColor(user.performance), 0.1),
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 3,
                              backgroundColor: getPerformanceColor(user.performance),
                            },
                          }}
                        />
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: getPerformanceColor(user.performance),
                        }}
                      >
                        {formatPercentage(user.performance / 100)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: user.intelligence >= 90 ? theme.palette.success.main :
                                 user.intelligence >= 70 ? theme.palette.info.main : theme.palette.warning.main,
                        }}
                      >
                        {user.intelligence ? `${user.intelligence.toFixed(1)}%` : 'N/A'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        IQ
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: user.winRate >= 0.5 ? theme.palette.success.main : theme.palette.error.main,
                        }}
                      >
                        {formatPercentage(user.winRate)}
                      </Typography>
                      {user.winRate >= 0.5 ? (
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
                        color: user.totalPnl >= 0 ? theme.palette.success.main : theme.palette.error.main,
                      }}
                    >
                      {user.totalPnl >= 0 ? '+' : ''}
                      {formatCurrency(user.totalPnl)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {user.tradesCount}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.status}
                      size="small"
                      color={user.status === 'online' ? 'success' : 'default'}
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

export default UsersLeaderboard;
