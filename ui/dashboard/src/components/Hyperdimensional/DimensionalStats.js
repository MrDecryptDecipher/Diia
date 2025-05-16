import React from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  useTheme, 
  alpha,
  LinearProgress
} from '@mui/material';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';

const DimensionalStats = ({ 
  stats, 
  title = 'Hyperdimensional Statistics', 
  description 
}) => {
  const theme = useTheme();
  
  // Prepare data for dimension distribution pie chart
  const dimensionData = [
    { name: '3D', value: stats.dimensionDistribution['3D'] || 0 },
    { name: '4D', value: stats.dimensionDistribution['4D'] || 0 },
    { name: '5D', value: stats.dimensionDistribution['5D'] || 0 },
    { name: '6D+', value: stats.dimensionDistribution['6D+'] || 0 }
  ];
  
  // Prepare data for pattern type distribution pie chart
  const patternTypeData = Object.entries(stats.patternTypeDistribution).map(([name, value]) => ({
    name,
    value
  }));
  
  // Colors for pie charts
  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.info.main,
    theme.palette.warning.main,
    theme.palette.error.main
  ];
  
  // Custom tooltip for pie charts
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <Box 
          sx={{ 
            backgroundColor: theme.palette.background.paper, 
            p: 1, 
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: theme.shadows[2]
          }}
        >
          <Typography variant="body2">{`${payload[0].name}: ${payload[0].value}`}</Typography>
        </Box>
      );
    }
    return null;
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
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
        {title}
      </Typography>
      
      <Grid container spacing={3}>
        {/* Dimension Distribution */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={{ mb: 1, textAlign: 'center' }}>
            Dimension Distribution
          </Typography>
          <Box sx={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dimensionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {dimensionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Grid>
        
        {/* Pattern Type Distribution */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={{ mb: 1, textAlign: 'center' }}>
            Pattern Type Distribution
          </Typography>
          <Box sx={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={patternTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {patternTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Grid>
        
        {/* Key Metrics */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Key Metrics
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">Average Confidence</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {stats.averageConfidence.toFixed(1)}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={stats.averageConfidence} 
                  sx={{ 
                    height: 6, 
                    borderRadius: 3,
                    backgroundColor: alpha(theme.palette.primary.main, 0.2),
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: theme.palette.primary.main
                    }
                  }} 
                />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">Average Predictive Power</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {stats.averagePredictivePower.toFixed(1)}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={stats.averagePredictivePower} 
                  sx={{ 
                    height: 6, 
                    borderRadius: 3,
                    backgroundColor: alpha(theme.palette.success.main, 0.2),
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: theme.palette.success.main
                    }
                  }} 
                />
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">Average Complexity</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {stats.averageComplexity.toFixed(1)}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={stats.averageComplexity} 
                  sx={{ 
                    height: 6, 
                    borderRadius: 3,
                    backgroundColor: alpha(theme.palette.secondary.main, 0.2),
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: theme.palette.secondary.main
                    }
                  }} 
                />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">Average Stability</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {stats.averageStability.toFixed(1)}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={stats.averageStability} 
                  sx={{ 
                    height: 6, 
                    borderRadius: 3,
                    backgroundColor: alpha(theme.palette.info.main, 0.2),
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: theme.palette.info.main
                    }
                  }} 
                />
              </Box>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      
      {description && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
          {description}
        </Typography>
      )}
    </Paper>
  );
};

export default DimensionalStats;
