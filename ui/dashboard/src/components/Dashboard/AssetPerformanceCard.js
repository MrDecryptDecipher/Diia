import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  Chip,
  useTheme,
  alpha,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

const AssetPerformanceCard = ({ assets = [] }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  // Sort assets by opportunity score
  const sortedAssets = [...assets].sort((a, b) => b.opportunityScore - a.opportunityScore).slice(0, 5);

  // Handle click
  const handleClick = (symbol) => {
    navigate(`/assets/${symbol}`);
  };

  return (
    <List sx={{ p: 0 }}>
      {sortedAssets.map((asset) => (
        <ListItem
          key={asset.id}
          sx={{
            px: 0,
            py: 1.5,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            '&:last-child': {
              borderBottom: 'none',
            },
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.05),
            },
          }}
          onClick={() => handleClick(asset.symbol)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: asset.color ? alpha(asset.color, 0.1) : alpha(theme.palette.primary.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2,
                color: asset.color || theme.palette.primary.main,
                fontWeight: 'bold',
                fontSize: '0.75rem',
              }}
            >
              {asset.symbol.substring(0, 3)}
            </Box>

            <Box sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {asset.name}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {formatCurrency(asset.price, 'USD', asset.symbol.includes('BTC') ? 0 : 2)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>
                    {asset.symbol}
                  </Typography>
                  <Chip
                    key={`${asset.id}-chip`}
                    size="small"
                    label={asset.predictedDirection}
                    icon={asset.predictedDirection === 'bullish' ? <TrendingUp fontSize="small" /> : <TrendingDown fontSize="small" />}
                    color={asset.predictedDirection === 'bullish' ? 'success' : 'error'}
                    sx={{ height: 20, '& .MuiChip-label': { px: 0.5, fontSize: '0.625rem' } }}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: asset.change24h >= 0 ? theme.palette.success.main : theme.palette.error.main,
                      fontWeight: 600,
                    }}
                  >
                    {asset.change24h >= 0 ? '+' : ''}
                    {formatPercentage(asset.change24h)}
                  </Typography>
                  {asset.change24h >= 0 ? (
                    <TrendingUp fontSize="small" sx={{ ml: 0.5, color: theme.palette.success.main, fontSize: '0.75rem' }} />
                  ) : (
                    <TrendingDown fontSize="small" sx={{ ml: 0.5, color: theme.palette.error.main, fontSize: '0.75rem' }} />
                  )}
                </Box>
              </Box>

              <Tooltip title={`Opportunity Score: ${asset.opportunityScore ? asset.opportunityScore.toFixed(2) : '0.00'}`}>
                <LinearProgress
                  variant="determinate"
                  value={asset.opportunityScore || 0}
                  sx={{
                    mt: 1,
                    height: 3,
                    borderRadius: 1.5,
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 1.5,
                      background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    },
                  }}
                />
              </Tooltip>
            </Box>
          </Box>
        </ListItem>
      ))}
    </List>
  );
};

export default AssetPerformanceCard;
