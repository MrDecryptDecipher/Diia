import React from 'react';
import { Box, Paper, Typography, LinearProgress, CircularProgress, useTheme, alpha } from '@mui/material';

const MetricProgress = ({ 
  title, 
  value, 
  maxValue = 100, 
  type = 'linear', 
  color,
  showPercentage = true,
  description,
  size = 'medium',
  thickness = 4
}) => {
  const theme = useTheme();
  const progressColor = color || theme.palette.primary.main;
  
  // Calculate percentage
  const percentage = Math.min(Math.round((value / maxValue) * 100), 100);
  
  // Determine size for circular progress
  const getSize = () => {
    switch (size) {
      case 'small': return 60;
      case 'large': return 120;
      case 'medium':
      default: return 80;
    }
  };
  
  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: 2, 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: theme.shadows[8],
        }
      }}
    >
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        {title}
      </Typography>
      
      {type === 'circular' ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: 2, position: 'relative' }}>
          <CircularProgress 
            variant="determinate" 
            value={percentage} 
            size={getSize()} 
            thickness={thickness}
            sx={{ color: progressColor }}
          />
          {showPercentage && (
            <Box
              sx={{
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                {percentage}%
              </Typography>
            </Box>
          )}
        </Box>
      ) : (
        <Box sx={{ mt: 2, mb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
              {value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </Typography>
            {showPercentage && (
              <Typography variant="body2" color="text.secondary">
                {percentage}%
              </Typography>
            )}
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={percentage} 
            sx={{ 
              height: 8, 
              borderRadius: 4,
              backgroundColor: alpha(progressColor, 0.2),
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                backgroundColor: progressColor,
              }
            }} 
          />
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

export default MetricProgress;
