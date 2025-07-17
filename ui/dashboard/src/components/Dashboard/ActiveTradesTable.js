import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Box,
  Typography,
  useTheme,
  alpha,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpward,
  ArrowDownward,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatPercentage, formatDate } from '../../utils/formatters';

const ActiveTradesTable = ({ trades = [] }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // Handle row click
  const handleRowClick = (id) => {
    navigate(`/trades/${id}`);
  };
  
  return (
    <TableContainer component={Paper} sx={{ boxShadow: 'none', background: 'transparent' }}>
      <Table sx={{ minWidth: 650 }} size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ color: 'text.secondary', fontWeight: 600, borderBottom: `1px solid ${theme.palette.divider}` }}>Symbol</TableCell>
            <TableCell sx={{ color: 'text.secondary', fontWeight: 600, borderBottom: `1px solid ${theme.palette.divider}` }}>Direction</TableCell>
            <TableCell sx={{ color: 'text.secondary', fontWeight: 600, borderBottom: `1px solid ${theme.palette.divider}` }}>Entry Price</TableCell>
            <TableCell sx={{ color: 'text.secondary', fontWeight: 600, borderBottom: `1px solid ${theme.palette.divider}` }}>Current Price</TableCell>
            <TableCell sx={{ color: 'text.secondary', fontWeight: 600, borderBottom: `1px solid ${theme.palette.divider}` }}>PnL</TableCell>
            <TableCell sx={{ color: 'text.secondary', fontWeight: 600, borderBottom: `1px solid ${theme.palette.divider}` }}>Agent</TableCell>
            <TableCell sx={{ color: 'text.secondary', fontWeight: 600, borderBottom: `1px solid ${theme.palette.divider}` }}>Entry Time</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {trades.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  No active trades
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            trades.map((trade) => (
              <TableRow
                key={trade.id}
                hover
                onClick={() => handleRowClick(trade.id)}
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  },
                  '&:last-child td, &:last-child th': { border: 0 },
                }}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {trade.symbol || 'N/A'}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={trade.direction || 'N/A'}
                    icon={(trade.direction || 'long') === 'long' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />}
                    color={(trade.direction || 'long') === 'long' ? 'success' : 'error'}
                    sx={{ height: 24 }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatCurrency(trade.entryPrice || 0, 'USD', (trade.symbol || '').includes('BTC') ? 0 : 2)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2">
                      {formatCurrency(trade.currentPrice || 0, 'USD', (trade.symbol || '').includes('BTC') ? 0 : 2)}
                    </Typography>
                    {(trade.currentPrice || 0) > (trade.entryPrice || 0) ? (
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
                      color: (trade.pnl || 0) >= 0 ? theme.palette.success.main : theme.palette.error.main,
                      fontWeight: 600,
                    }}
                  >
                    {(trade.pnl || 0) >= 0 ? '+' : ''}
                    {formatCurrency(trade.pnl || 0)} ({(trade.pnlPercentage || 0) >= 0 ? '+' : ''}
                    {formatPercentage(trade.pnlPercentage || 0)})
                  </Typography>
                </TableCell>
                <TableCell>
                  <Tooltip title={`Confidence: ${(trade.confidence || 95).toFixed(2)}%`}>
                    <Chip
                      size="small"
                      label={trade.agent || 'AI Agent'}
                      sx={{
                        height: 24,
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                      }}
                    />
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {formatDate(trade.entryTime || new Date().toISOString(), 'short')}
                  </Typography>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ActiveTradesTable;
