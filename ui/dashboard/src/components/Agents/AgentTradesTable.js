import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  useTheme,
  alpha,
} from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

const AgentTradesTable = ({ trades }) => {
  const theme = useTheme();

  // Get status color
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return theme.palette.success.main;
      case 'active':
        return theme.palette.info.main;
      case 'pending':
        return theme.palette.warning.main;
      case 'failed':
        return theme.palette.error.main;
      default:
        return theme.palette.grey[500];
    }
  };

  return (
    <Card
      sx={{
        background: 'rgba(17, 24, 39, 0.7)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
      }}
      className="futuristic-border"
    >
      <CardHeader
        title={
          <Typography variant="h6" sx={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600 }}>
            Recent Trades
          </Typography>
        }
        subheader="Trades executed by this agent"
      />
      <Divider sx={{ opacity: 0.2 }} />
      <CardContent sx={{ p: 0 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Asset</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Type</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Entry Price</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Exit Price</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Size</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>PnL</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {trades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      No trades found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                trades.map((trade) => (
                  <TableRow
                    key={trade.id}
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
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {trade.symbol}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={trade.type}
                        sx={{
                          backgroundColor:
                            trade.type === 'BUY'
                              ? alpha(theme.palette.success.main, 0.1)
                              : alpha(theme.palette.error.main, 0.1),
                          color: trade.type === 'BUY' ? theme.palette.success.main : theme.palette.error.main,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{formatCurrency(trade.entryPrice)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {trade.exitPrice ? formatCurrency(trade.exitPrice) : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{trade.size}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {trade.pnl !== null ? (
                          <>
                            <Typography
                              variant="body2"
                              sx={{
                                color: trade.pnl >= 0 ? theme.palette.success.main : theme.palette.error.main,
                                fontWeight: 600,
                              }}
                            >
                              {trade.pnl >= 0 ? '+' : ''}
                              {formatCurrency(trade.pnl)}
                            </Typography>
                            {trade.pnl >= 0 ? (
                              <TrendingUp
                                fontSize="small"
                                sx={{ ml: 0.5, color: theme.palette.success.main }}
                              />
                            ) : (
                              <TrendingDown
                                fontSize="small"
                                sx={{ ml: 0.5, color: theme.palette.error.main }}
                              />
                            )}
                          </>
                        ) : (
                          '-'
                        )}
                      </Box>
                      {trade.pnlPercentage && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: trade.pnlPercentage >= 0 ? theme.palette.success.main : theme.palette.error.main,
                          }}
                        >
                          ({trade.pnlPercentage >= 0 ? '+' : ''}
                          {formatPercentage(trade.pnlPercentage)})
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={trade.status}
                        sx={{
                          backgroundColor: alpha(getStatusColor(trade.status), 0.1),
                          color: getStatusColor(trade.status),
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {new Date(trade.timestamp).toLocaleString()}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default AgentTradesTable;
