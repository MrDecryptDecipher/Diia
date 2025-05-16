import React from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  useTheme, 
  alpha,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';

const PatternMatrix = ({ 
  patterns, 
  title = 'Pattern Correlation Matrix', 
  description 
}) => {
  const theme = useTheme();
  
  // Calculate correlation matrix between patterns
  const calculateCorrelationMatrix = (patterns) => {
    if (!patterns || patterns.length === 0) return [];
    
    const matrix = [];
    
    for (let i = 0; i < patterns.length; i++) {
      const row = [];
      
      for (let j = 0; j < patterns.length; j++) {
        if (i === j) {
          // Self-correlation is always 1
          row.push(1);
        } else {
          // Calculate correlation based on pattern properties
          // This is a simplified example - in a real system, you would use actual correlation algorithms
          const patternA = patterns[i];
          const patternB = patterns[j];
          
          // Calculate similarity based on various metrics
          const confidenceSimilarity = 1 - Math.abs(patternA.confidence - patternB.confidence) / 100;
          const complexitySimilarity = 1 - Math.abs(patternA.complexity - patternB.complexity) / 100;
          const stabilitySimilarity = 1 - Math.abs(patternA.stability - patternB.stability) / 100;
          const predictivePowerSimilarity = 1 - Math.abs(patternA.predictivePower - patternB.predictivePower) / 100;
          
          // Type similarity (1 if same type, 0.5 otherwise)
          const typeSimilarity = patternA.type === patternB.type ? 1 : 0.5;
          
          // Weighted average of similarities
          const correlation = (
            confidenceSimilarity * 0.2 +
            complexitySimilarity * 0.2 +
            stabilitySimilarity * 0.2 +
            predictivePowerSimilarity * 0.2 +
            typeSimilarity * 0.2
          );
          
          row.push(correlation);
        }
      }
      
      matrix.push(row);
    }
    
    return matrix;
  };
  
  const correlationMatrix = calculateCorrelationMatrix(patterns);
  
  // Get color based on correlation value
  const getCorrelationColor = (value) => {
    if (value >= 0.8) return theme.palette.success.main;
    if (value >= 0.6) return theme.palette.info.main;
    if (value >= 0.4) return theme.palette.warning.main;
    return theme.palette.error.main;
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
      
      <TableContainer sx={{ flexGrow: 1 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Pattern</TableCell>
              {patterns.map((pattern, index) => (
                <TableCell key={index} align="center" sx={{ fontWeight: 'bold' }}>
                  {pattern.symbol}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {patterns.map((pattern, rowIndex) => (
              <TableRow key={rowIndex}>
                <TableCell sx={{ fontWeight: 'medium' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Chip 
                      label={pattern.type.substring(0, 3)} 
                      size="small" 
                      sx={{ 
                        mr: 1,
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                      }} 
                    />
                    {pattern.symbol}
                  </Box>
                </TableCell>
                {correlationMatrix[rowIndex].map((value, colIndex) => (
                  <TableCell key={colIndex} align="center">
                    <Box 
                      sx={{ 
                        width: 36, 
                        height: 36, 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        backgroundColor: alpha(getCorrelationColor(value), 0.1),
                        color: getCorrelationColor(value),
                        fontWeight: 'bold',
                        margin: '0 auto'
                      }}
                    >
                      {value.toFixed(2)}
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={3}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box 
              sx={{ 
                width: 16, 
                height: 16, 
                borderRadius: '50%', 
                backgroundColor: alpha(theme.palette.success.main, 0.2),
                border: `2px solid ${theme.palette.success.main}`,
                mr: 1
              }} 
            />
            <Typography variant="caption">Strong (0.8-1.0)</Typography>
          </Box>
        </Grid>
        <Grid item xs={3}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box 
              sx={{ 
                width: 16, 
                height: 16, 
                borderRadius: '50%', 
                backgroundColor: alpha(theme.palette.info.main, 0.2),
                border: `2px solid ${theme.palette.info.main}`,
                mr: 1
              }} 
            />
            <Typography variant="caption">Medium (0.6-0.8)</Typography>
          </Box>
        </Grid>
        <Grid item xs={3}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box 
              sx={{ 
                width: 16, 
                height: 16, 
                borderRadius: '50%', 
                backgroundColor: alpha(theme.palette.warning.main, 0.2),
                border: `2px solid ${theme.palette.warning.main}`,
                mr: 1
              }} 
            />
            <Typography variant="caption">Weak (0.4-0.6)</Typography>
          </Box>
        </Grid>
        <Grid item xs={3}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box 
              sx={{ 
                width: 16, 
                height: 16, 
                borderRadius: '50%', 
                backgroundColor: alpha(theme.palette.error.main, 0.2),
                border: `2px solid ${theme.palette.error.main}`,
                mr: 1
              }} 
            />
            <Typography variant="caption">None (0.0-0.4)</Typography>
          </Box>
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

export default PatternMatrix;
