import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Grid,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Sentiment,
  TrendingUp,
  TrendingDown,
  Twitter,
  Reddit,
  Article,
  Refresh,
  Psychology,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const SentimentAnalysisCard = ({ symbol = 'DOGEUSDT' }) => {
  const theme = useTheme();
  const [sentimentData, setSentimentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchSentimentData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://3.111.22.56:10002/api/sentiment/${symbol}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSentimentData(data);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err.message);
      console.error('Error fetching sentiment data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSentimentData();
    
    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchSentimentData, 120000);
    return () => clearInterval(interval);
  }, [symbol]);

  const getRecommendationColor = (recommendation) => {
    switch (recommendation) {
      case 'STRONG_BUY':
        return theme.palette.success.main;
      case 'BUY':
        return theme.palette.success.light;
      case 'STRONG_SELL':
        return theme.palette.error.main;
      case 'SELL':
        return theme.palette.error.light;
      case 'NEUTRAL':
      default:
        return theme.palette.warning.main;
    }
  };

  const getRecommendationIcon = (recommendation) => {
    switch (recommendation) {
      case 'STRONG_BUY':
      case 'BUY':
        return <TrendingUp />;
      case 'STRONG_SELL':
      case 'SELL':
        return <TrendingDown />;
      default:
        return <Psychology />;
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card
        sx={{
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          backdropFilter: 'blur(10px)',
          height: '100%',
        }}
      >
        <CardHeader
          avatar={
            <Box
              sx={{
                p: 1,
                borderRadius: '50%',
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                color: 'white',
              }}
            >
              <Sentiment />
            </Box>
          }
          title={
            <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
              🧠 Super Intelligent MCP Sentiment Analysis
            </Typography>
          }
          subheader={
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              Real-time sentiment from Twitter, Reddit & News
            </Typography>
          }
          action={
            <Tooltip title="Refresh sentiment data">
              <IconButton onClick={fetchSentimentData} disabled={loading}>
                <Refresh sx={{ color: loading ? theme.palette.action.disabled : theme.palette.primary.main }} />
              </IconButton>
            </Tooltip>
          }
        />

        <CardContent>
          {loading && (
            <Box display="flex" justifyContent="center" alignItems="center" py={4}>
              <CircularProgress size={40} />
              <Typography variant="body2" sx={{ ml: 2, color: theme.palette.text.secondary }}>
                Analyzing sentiment...
              </Typography>
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Failed to load sentiment data: {error}
            </Alert>
          )}

          {sentimentData && !loading && (
            <Box>
              {/* Main Sentiment Score */}
              <Box sx={{ mb: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                    {symbol.replace('USDT', '')}
                  </Typography>
                  <Chip
                    icon={getRecommendationIcon(sentimentData.recommendation)}
                    label={sentimentData.recommendation}
                    sx={{
                      backgroundColor: alpha(getRecommendationColor(sentimentData.recommendation), 0.1),
                      color: getRecommendationColor(sentimentData.recommendation),
                      fontWeight: 600,
                      fontSize: '0.875rem',
                    }}
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                      Overall Sentiment Score
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                      {(sentimentData.overallScore * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={sentimentData.overallScore * 100}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: alpha(theme.palette.grey[500], 0.2),
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getRecommendationColor(sentimentData.recommendation),
                        borderRadius: 4,
                      },
                    }}
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                      Confidence Level
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                      {(sentimentData.confidence * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={sentimentData.confidence * 100}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: alpha(theme.palette.grey[500], 0.2),
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: theme.palette.info.main,
                        borderRadius: 3,
                      },
                    }}
                  />
                </Box>
              </Box>

              {/* Source Breakdown */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: theme.palette.text.primary }}>
                  📊 Source Breakdown ({sentimentData.sourceCount} sources)
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Box textAlign="center">
                      <Twitter sx={{ color: '#1DA1F2', fontSize: 24, mb: 1 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                        {sentimentData.breakdown.twitter}
                      </Typography>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                        Twitter
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box textAlign="center">
                      <Reddit sx={{ color: '#FF4500', fontSize: 24, mb: 1 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                        {sentimentData.breakdown.reddit}
                      </Typography>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                        Reddit
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box textAlign="center">
                      <Article sx={{ color: '#4CAF50', fontSize: 24, mb: 1 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                        {sentimentData.breakdown.news}
                      </Typography>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                        News
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              {/* Recent Sources */}
              {sentimentData.sources && sentimentData.sources.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: theme.palette.text.primary }}>
                    🔍 Recent Sources
                  </Typography>
                  {sentimentData.sources.slice(0, 3).map((source, index) => (
                    <Box
                      key={index}
                      sx={{
                        p: 2,
                        mb: 1,
                        borderRadius: 2,
                        backgroundColor: alpha(theme.palette.background.paper, 0.5),
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 500, color: theme.palette.text.primary, mb: 0.5 }}>
                        {source.title}
                      </Typography>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Chip
                          label={source.source}
                          size="small"
                          sx={{
                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main,
                            fontSize: '0.75rem',
                          }}
                        />
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                          {(source.sentiment * 100).toFixed(0)}% positive
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}

              {/* Last Update */}
              <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                  Last updated: {formatTimestamp(lastUpdate)} • Auto-refresh: 2min
                </Typography>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SentimentAnalysisCard;
