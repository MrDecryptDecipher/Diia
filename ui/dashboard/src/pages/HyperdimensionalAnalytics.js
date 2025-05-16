import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  useTheme,
  CircularProgress,
  Tabs,
  Tab,
  Button,
  alpha
} from '@mui/material';
import axios from 'axios';

// Import components
import PatternCard from '../components/Hyperdimensional/PatternCard';
import DimensionalVisualizer from '../components/Hyperdimensional/DimensionalVisualizer';
import PatternMatrix from '../components/Hyperdimensional/PatternMatrix';
import DimensionalStats from '../components/Hyperdimensional/DimensionalStats';

// Import icons
import RefreshIcon from '@mui/icons-material/Refresh';
import BlurOnIcon from '@mui/icons-material/BlurOn';
import TimelineIcon from '@mui/icons-material/Timeline';
import InsightsIcon from '@mui/icons-material/Insights';

const HyperdimensionalAnalytics = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [patterns, setPatterns] = useState([]);
  const [stats, setStats] = useState(null);
  const [documentation, setDocumentation] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  // Calculate statistics from patterns
  const calculateStats = (patterns) => {
    if (!patterns || patterns.length === 0) return;

    // Count dimensions
    const dimensionCounts = {
      '3D': 0,
      '4D': 0,
      '5D': 0,
      '6D+': 0
    };

    patterns.forEach(pattern => {
      if (pattern.dimensions <= 3) {
        dimensionCounts['3D']++;
      } else if (pattern.dimensions === 4) {
        dimensionCounts['4D']++;
      } else if (pattern.dimensions === 5) {
        dimensionCounts['5D']++;
      } else {
        dimensionCounts['6D+']++;
      }
    });

    // Count pattern types
    const patternTypeCounts = {};
    patterns.forEach(pattern => {
      patternTypeCounts[pattern.type] = (patternTypeCounts[pattern.type] || 0) + 1;
    });

    // Calculate averages
    const averageConfidence = patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length;
    const averageComplexity = patterns.reduce((sum, p) => sum + p.complexity, 0) / patterns.length;
    const averagePredictivePower = patterns.reduce((sum, p) => sum + p.predictivePower, 0) / patterns.length;
    const averageStability = patterns.reduce((sum, p) => sum + p.stability, 0) / patterns.length;

    setStats({
      dimensionDistribution: dimensionCounts,
      patternTypeDistribution: patternTypeCounts,
      averageConfidence,
      averageComplexity,
      averagePredictivePower,
      averageStability
    });
  };

  // Fetch data function
  const fetchData = async () => {
    setLoading(true);
    try {
      const [patternsRes, docsRes] = await Promise.all([
        axios.get('http://3.111.22.56/omni/api/ml/hyperdimensional'),
        axios.get('http://3.111.22.56/omni/api/ml/documentation')
      ]);

      // The API returns an array of patterns directly
      const patternsData = Array.isArray(patternsRes.data) ? patternsRes.data : [];
      setPatterns(patternsData);

      // Find hyperdimensional component in documentation
      const hyperComponent = docsRes.data.components.find(
        comp => comp.name === 'Hyperdimensional Computing'
      );
      setDocumentation(hyperComponent);

      // Calculate statistics from patterns
      calculateStats(patternsData);
    } catch (error) {
      console.error('Error fetching hyperdimensional data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
  };

  const handleRefresh = async () => {
    await fetchData();
  };

  // Prepare data for dimensional visualizer
  const prepareVisualizerData = () => {
    if (!patterns || patterns.length === 0) return [];

    return patterns.slice(0, 5).map(pattern => ({
      symbol: pattern.symbol,
      coordinates: [
        pattern.confidence / 100,
        pattern.predictivePower / 100,
        pattern.complexity / 100,
        pattern.stability / 100,
        pattern.similarity / 100
      ]
    }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
          Hyperdimensional Analytics
        </Typography>

        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
        >
          Refresh Data
        </Button>
      </Box>

      {documentation && (
        <Paper sx={{ p: 2, mb: 3, backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <BlurOnIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {documentation.name}
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {documentation.description}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {documentation.details}
          </Typography>
        </Paper>
      )}

      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          mb: 3,
          '& .MuiTab-root': {
            fontWeight: 'bold',
            fontSize: '0.9rem',
          },
          '& .Mui-selected': {
            color: theme.palette.primary.main,
          }
        }}
      >
        <Tab
          label="Overview"
          icon={<InsightsIcon />}
          iconPosition="start"
        />
        <Tab
          label="Pattern Analysis"
          icon={<TimelineIcon />}
          iconPosition="start"
        />
      </Tabs>

      {/* Overview Tab */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Stats */}
          <Grid item xs={12} md={6}>
            {stats && (
              <DimensionalStats
                stats={stats}
                title="Hyperdimensional Pattern Statistics"
                description="Statistical analysis of detected hyperdimensional patterns across all assets"
              />
            )}
          </Grid>

          {/* Visualizer */}
          <Grid item xs={12} md={6}>
            <DimensionalVisualizer
              data={prepareVisualizerData()}
              dimensions={5}
              title="5-Dimensional Pattern Visualization"
              description="Visualization of patterns in 5-dimensional space (Confidence, Predictive Power, Complexity, Stability, Similarity)"
            />
          </Grid>

          {/* Recent Patterns */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Recent Hyperdimensional Patterns
            </Typography>
            <Grid container spacing={2}>
              {patterns && patterns.length > 0 ? (
                patterns.slice(0, 4).map((pattern, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <PatternCard pattern={pattern} />
                  </Grid>
                ))
              ) : (
                <Grid item xs={12}>
                  <Typography variant="body1" color="text.secondary">
                    No patterns available
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Grid>

          {/* Pattern Matrix */}
          {patterns && patterns.length > 1 ? (
            <Grid item xs={12}>
              <PatternMatrix
                patterns={patterns.slice(0, 6)}
                title="Pattern Correlation Matrix"
                description="Correlation matrix showing relationships between detected patterns"
              />
            </Grid>
          ) : null}
        </Grid>
      )}

      {/* Pattern Analysis Tab */}
      {activeTab === 1 && (
        <Grid container spacing={3}>
          {/* Pattern Types */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Pattern Types
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={2.4}>
                  <Box sx={{
                    p: 2,
                    textAlign: 'center',
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    borderRadius: 2
                  }}>
                    <BlurOnIcon sx={{ fontSize: 40, color: theme.palette.primary.main, mb: 1 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Fractal</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Self-similar patterns that repeat at different scales
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                  <Box sx={{
                    p: 2,
                    textAlign: 'center',
                    backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                    borderRadius: 2
                  }}>
                    <TimelineIcon sx={{ fontSize: 40, color: theme.palette.secondary.main, mb: 1 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Harmonic</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Patterns based on mathematical harmonic relationships
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                  <Box sx={{
                    p: 2,
                    textAlign: 'center',
                    backgroundColor: alpha(theme.palette.success.main, 0.1),
                    borderRadius: 2
                  }}>
                    <InsightsIcon sx={{ fontSize: 40, color: theme.palette.success.main, mb: 1 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Fibonacci</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Patterns based on Fibonacci sequence and golden ratio
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                  <Box sx={{
                    p: 2,
                    textAlign: 'center',
                    backgroundColor: alpha(theme.palette.info.main, 0.1),
                    borderRadius: 2
                  }}>
                    <TimelineIcon sx={{ fontSize: 40, color: theme.palette.info.main, mb: 1 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Elliot Wave</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Complex wave patterns based on market psychology
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                  <Box sx={{
                    p: 2,
                    textAlign: 'center',
                    backgroundColor: alpha(theme.palette.warning.main, 0.1),
                    borderRadius: 2
                  }}>
                    <BlurOnIcon sx={{ fontSize: 40, color: theme.palette.warning.main, mb: 1 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Geometric</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Patterns based on geometric shapes and relationships
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* All Patterns */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              All Detected Patterns
            </Typography>
            <Grid container spacing={2}>
              {patterns && patterns.length > 0 ? (
                patterns.map((pattern, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <PatternCard pattern={pattern} />
                  </Grid>
                ))
              ) : (
                <Grid item xs={12}>
                  <Typography variant="body1" color="text.secondary">
                    No patterns available
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default HyperdimensionalAnalytics;
