import React from 'react';
import { Box, Paper, Typography, useTheme } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';

const MetricCard = ({ title, value, unit, trend, description, color, icon: Icon }) => {
  const theme = useTheme();
  
  // Determine trend icon and color
  let TrendIcon = TrendingFlatIcon;
  let trendColor = theme.palette.text.secondary;
  
  if (trend === 'up') {
    TrendIcon = TrendingUpIcon;
    trendColor = theme.palette.success.main;
  } else if (trend === 'down') {
    TrendIcon = TrendingDownIcon;
    trendColor = theme.palette.error.main;
  }
  
  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: 2, 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        borderTop: `4px solid ${color || theme.palette.primary.main}`,
        transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: theme.shadows[8],
        }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2" color="text.secondary">
          {title}
        </Typography>
        {Icon && <Icon sx={{ color: color || theme.palette.primary.main }} />}
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'baseline', mt: 1 }}>
        <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
          {typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : value}
        </Typography>
        {unit && (
          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            {unit}
          </Typography>
        )}
      </Box>
      
      {trend && (
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
          <TrendIcon sx={{ color: trendColor, fontSize: '1rem', mr: 0.5 }} />
          <Typography variant="caption" sx={{ color: trendColor }}>
            {trend === 'up' ? 'Increasing' : trend === 'down' ? 'Decreasing' : 'Stable'}
          </Typography>
        </Box>
      )}
      
      {description && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
          {description}
        </Typography>
      )}
    </Paper>
  );
};

export default MetricCard;
