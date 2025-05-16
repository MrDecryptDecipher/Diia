import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  useTheme,
  alpha,
} from '@mui/material';
import { TrendingUp, TrendingDown, Star } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

const AssetCard = ({ asset, onClick, isSelected }) => {
  const theme = useTheme();
  
  // Determine color based on price change
  const priceChangeColor = asset.priceChange24h >= 0 
    ? theme.palette.success.main 
    : theme.palette.error.main;
  
  // Determine opportunity score color
  const getOpportunityColor = (score) => {
    if (score >= 80) return theme.palette.success.main;
    if (score >= 60) return theme.palette.info.main;
    if (score >= 40) return theme.palette.warning.main;
    return theme.palette.error.main;
  };
  
  return (
    <Card
      sx={{
        background: isSelected 
          ? alpha(theme.palette.primary.main, 0.15)
          : 'rgba(17, 24, 39, 0.7)',
        backdropFilter: 'blur(10px)',
        border: isSelected 
          ? `1px solid ${theme.palette.primary.main}`
          : `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.2)}`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.5)}`,
        },
      }}
      onClick={onClick}
      component={motion.div}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="futuristic-border"
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              {asset.symbol}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {asset.name}
            </Typography>
          </Box>
          <Chip
            icon={asset.priceChange24h >= 0 ? <TrendingUp /> : <TrendingDown />}
            label={`${asset.priceChange24h >= 0 ? '+' : ''}${formatPercentage(asset.priceChange24h)}`}
            size="small"
            sx={{
              backgroundColor: alpha(priceChangeColor, 0.1),
              color: priceChangeColor,
              fontWeight: 600,
            }}
          />
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            {formatCurrency(asset.price)}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Volume: {formatCurrency(asset.volume)}
          </Typography>
        </Box>
        
        <Box sx={{ mb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Opportunity Score
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Star sx={{ color: getOpportunityColor(asset.opportunityScore), fontSize: 16, mr: 0.5 }} />
              <Typography variant="body2" sx={{ fontWeight: 600, color: getOpportunityColor(asset.opportunityScore) }}>
                {asset.opportunityScore}/100
              </Typography>
            </Box>
          </Box>
          <LinearProgress
            variant="determinate"
            value={asset.opportunityScore}
            sx={{
              height: 6,
              borderRadius: 3,
              backgroundColor: alpha(theme.palette.background.paper, 0.2),
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                backgroundColor: getOpportunityColor(asset.opportunityScore),
              },
            }}
          />
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Chip
            label={asset.category}
            size="small"
            sx={{
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
            }}
          />
          {asset.trending && (
            <Chip
              label="Trending"
              size="small"
              sx={{
                backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                color: theme.palette.secondary.main,
              }}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default AssetCard;
