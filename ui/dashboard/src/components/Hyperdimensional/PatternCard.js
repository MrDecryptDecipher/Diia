import React from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Chip, 
  LinearProgress, 
  Grid, 
  useTheme, 
  alpha 
} from '@mui/material';
import { 
  BlurOn, 
  Timeline, 
  Insights, 
  Speed, 
  Timelapse, 
  Public 
} from '@mui/icons-material';

const PatternCard = ({ pattern }) => {
  const theme = useTheme();
  
  // Get color based on confidence
  const getConfidenceColor = (confidence) => {
    if (confidence >= 95) return theme.palette.success.main;
    if (confidence >= 85) return theme.palette.info.main;
    if (confidence >= 75) return theme.palette.warning.main;
    return theme.palette.error.main;
  };
  
  // Get icon based on pattern type
  const getPatternIcon = (type) => {
    const typeStr = type.toLowerCase();

    if (typeStr.includes('fractal') || typeStr.includes('quantum')) {
      return <BlurOn />;
    }
    if (typeStr.includes('harmonic') || typeStr.includes('neural')) {
      return <Timeline />;
    }
    if (typeStr.includes('geometric') || typeStr.includes('hyperspatial')) {
      return <Public />;
    }
    if (typeStr.includes('fibonacci') || typeStr.includes('hyperdimensional')) {
      return <Insights />;
    }
    if (typeStr.includes('elliot') || typeStr.includes('elliott') || typeStr.includes('wave')) {
      return <Timelapse />;
    }

    // Legacy types
    switch (type) {
      case 'fractal':
        return <BlurOn />;
      case 'harmonic':
        return <Timeline />;
      case 'geometric':
        return <Public />;
      case 'fibonacci':
        return <Insights />;
      case 'elliot':
        return <Timelapse />;
      default:
        return <Speed />;
    }
  };
  
  const confidenceColor = getConfidenceColor(pattern.confidence);
  
  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.default, 0.9)} 100%)`,
        backdropFilter: 'blur(10px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: theme.shadows[10],
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                width: 40, 
                height: 40, 
                borderRadius: '50%', 
                backgroundColor: alpha(confidenceColor, 0.1),
                color: confidenceColor,
                mr: 1.5
              }}
            >
              {getPatternIcon(pattern.type)}
            </Box>
            <Box>
              <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                {pattern.symbol}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {new Date(pattern.timestamp).toLocaleString()}
              </Typography>
            </Box>
          </Box>
          <Chip 
            label={`${pattern.dimensions}D`} 
            size="small" 
            sx={{ 
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
              fontWeight: 'bold'
            }} 
          />
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium', fontFamily: 'Rajdhani, sans-serif' }}>
            {pattern.type.charAt(0).toUpperCase() + pattern.type.slice(1)} Pattern
          </Typography>
          {pattern.tradingSystemActive && (
            <Chip
              label={`System Active • ${pattern.systemTrades} trades`}
              size="small"
              sx={{
                backgroundColor: alpha(theme.palette.success.main, 0.1),
                color: theme.palette.success.main,
                fontSize: '0.7rem',
                height: 20,
                mb: 1,
              }}
            />
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Prediction: {pattern.prediction?.direction?.toUpperCase()} • {pattern.prediction?.timeframe}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Magnitude: {pattern.prediction?.magnitude?.toFixed(2)}% • Complexity: {pattern.complexity?.toFixed(1)}
          </Typography>
        </Box>
        
        <Grid container spacing={1} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Confidence
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {pattern.confidence.toFixed(1)}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={pattern.confidence} 
              sx={{ 
                height: 4, 
                borderRadius: 2,
                mt: 0.5,
                backgroundColor: alpha(confidenceColor, 0.2),
                '& .MuiLinearProgress-bar': {
                  backgroundColor: confidenceColor
                }
              }} 
            />
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Similarity
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {pattern.similarity.toFixed(1)}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={pattern.similarity} 
              sx={{ 
                height: 4, 
                borderRadius: 2,
                mt: 0.5,
                backgroundColor: alpha(theme.palette.info.main, 0.2),
                '& .MuiLinearProgress-bar': {
                  backgroundColor: theme.palette.info.main
                }
              }} 
            />
          </Grid>
        </Grid>
        
        <Grid container spacing={1}>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Predictive Power
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {pattern.predictivePower.toFixed(1)}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={pattern.predictivePower} 
              sx={{ 
                height: 4, 
                borderRadius: 2,
                mt: 0.5,
                backgroundColor: alpha(theme.palette.success.main, 0.2),
                '& .MuiLinearProgress-bar': {
                  backgroundColor: theme.palette.success.main
                }
              }} 
            />
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Stability
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {pattern.stability.toFixed(1)}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={pattern.stability} 
              sx={{ 
                height: 4, 
                borderRadius: 2,
                mt: 0.5,
                backgroundColor: alpha(theme.palette.warning.main, 0.2),
                '& .MuiLinearProgress-bar': {
                  backgroundColor: theme.palette.warning.main
                }
              }} 
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default PatternCard;
