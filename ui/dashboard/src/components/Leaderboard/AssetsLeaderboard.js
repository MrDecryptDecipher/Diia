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
  Star,
  LocalFireDepartment,
} from '@mui/icons-material';
import { formatPercentage, formatCurrency } from '../../utils/formatters';

const AssetsLeaderboard = ({ assets = [] }) => {
  const theme = useTheme();
  
  // Sort assets by opportunity score
  const sortedAssets = [...assets].sort((a, b) => b.opportunityScore - a.opportunityScore);
  
  // Get opportunity color
  const getOpportunityColor = (score) => {
    if (score >= 80) return theme.palette.success.main;
    if (score >= 60) return theme.palette.info.main;
    if (score >= 40) return theme.palette.warning.main;
    return theme.palette.error.main;
  };
  
  return (
    <Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Rank</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Asset</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Category</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Price</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>24h Change</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Volume</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>System Trades</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Opportunity</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedAssets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    No assets found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              sortedAssets.map((asset, index) => (
                <TableRow
                  key={asset.id}
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
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {asset.symbol}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {asset.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={asset.category}
                      size="small"
                      sx={{
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatCurrency(asset.price)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: asset.priceChange24h >= 0 ? theme.palette.success.main : theme.palette.error.main,
                        }}
                      >
                        {asset.priceChange24h >= 0 ? '+' : ''}
                        {formatPercentage(asset.priceChange24h)}
                      </Typography>
                      {asset.priceChange24h >= 0 ? (
                        <TrendingUp fontSize="small" sx={{ ml: 0.5, color: theme.palette.success.main }} />
                      ) : (
                        <TrendingDown fontSize="small" sx={{ ml: 0.5, color: theme.palette.error.main }} />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatCurrency(asset.volume)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: asset.systemTrades > 0 ? theme.palette.success.main : theme.palette.text.secondary,
                        }}
                      >
                        {asset.systemTrades || 0}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        trades
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
                      <Box sx={{ width: '100%', mb: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={asset.opportunityScore}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: alpha(getOpportunityColor(asset.opportunityScore), 0.1),
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 3,
                              backgroundColor: getOpportunityColor(asset.opportunityScore),
                            },
                          }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Star sx={{ color: getOpportunityColor(asset.opportunityScore), fontSize: 16, mr: 0.5 }} />
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color: getOpportunityColor(asset.opportunityScore),
                          }}
                        >
                          {asset.opportunityScore.toFixed(1)}/100
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {asset.trending ? (
                      <Chip
                        icon={<LocalFireDepartment fontSize="small" />}
                        label="Trending"
                        size="small"
                        sx={{
                          backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                          color: theme.palette.secondary.main,
                        }}
                      />
                    ) : (
                      <Chip
                        label="Normal"
                        size="small"
                        sx={{
                          backgroundColor: alpha(theme.palette.info.main, 0.1),
                          color: theme.palette.info.main,
                        }}
                      />
                    )}
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

export default AssetsLeaderboard;
