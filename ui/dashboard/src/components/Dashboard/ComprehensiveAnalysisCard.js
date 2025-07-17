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
  Button,
  Divider,
} from '@mui/material';
import {
  Analytics,
  TrendingUp,
  TrendingDown,
  Refresh,
  Psychology,
  Sentiment,
  SmartToy,
  CheckCircle,
  Cancel,
  Warning,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const ComprehensiveAnalysisCard = ({ symbol = 'DOGEUSDT' }) => {
  const theme = useTheme();
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchComprehensiveData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://3.111.22.56:10002/api/gemini/${symbol}/comprehensive`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setAnalysisData(data);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err.message);
      console.error('Error fetching comprehensive data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComprehensiveData();
    
    // Auto-refresh every 3 minutes
    const interval = setInterval(fetchComprehensiveData, 180000);
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
      case 'HOLD':
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

  const getTradingDecisionIcon = (action) => {
    switch (action) {
      case 'EXECUTE_TRADE':
        return <CheckCircle sx={{ color: theme.palette.success.main }} />;
      case 'NO_TRADE':
        return <Cancel sx={{ color: theme.palette.error.main }} />;
      default:
        return <Warning sx={{ color: theme.palette.warning.main }} />;
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
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card
        sx={{
          background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`,
          border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
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
                background: `linear-gradient(45deg, ${theme.palette.info.main}, ${theme.palette.success.main})`,
                color: 'white',
              }}
            >
              <Analytics />
            </Box>
          }
          title={
            <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
              🔬 Comprehensive Analysis
            </Typography>
          }
          subheader={
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              Combined OMNI + Sentiment + AI analysis for trading decisions
            </Typography>
          }
          action={
            <Tooltip title="Refresh comprehensive analysis">
              <IconButton onClick={fetchComprehensiveData} disabled={loading}>
                <Refresh sx={{ color: loading ? theme.palette.action.disabled : theme.palette.info.main }} />
              </IconButton>
            </Tooltip>
          }
        />

        <CardContent>
          {loading && (
            <Box display="flex" justifyContent="center" alignItems="center" py={4}>
              <CircularProgress size={40} color="info" />
              <Typography variant="body2" sx={{ ml: 2, color: theme.palette.text.secondary }}>
                Performing comprehensive analysis...
              </Typography>
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Failed to load comprehensive analysis: {error}
            </Alert>
          )}

          {analysisData && !loading && (
            <Box>
              {/* Final Recommendation */}
              <Box sx={{ mb: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                    {symbol.replace('USDT', '')}
                  </Typography>
                  <Chip
                    icon={getRecommendationIcon(analysisData.recommendation)}
                    label={analysisData.recommendation}
                    sx={{
                      backgroundColor: alpha(getRecommendationColor(analysisData.recommendation), 0.1),
                      color: getRecommendationColor(analysisData.recommendation),
                      fontWeight: 600,
                      fontSize: '0.875rem',
                    }}
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                      Comprehensive Score
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                      {(analysisData.comprehensiveScore * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={analysisData.comprehensiveScore * 100}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: alpha(theme.palette.grey[500], 0.2),
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getRecommendationColor(analysisData.recommendation),
                        borderRadius: 5,
                      },
                    }}
                  />
                </Box>
              </Box>

              {/* Analysis Breakdown */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: theme.palette.text.primary }}>
                  📊 Analysis Breakdown
                </Typography>
                <Grid container spacing={2}>
                  {/* Sentiment Analysis */}
                  <Grid item xs={6}>
                    <Box sx={{ 
                      p: 2, 
                      borderRadius: 2, 
                      backgroundColor: alpha(theme.palette.background.paper, 0.5),
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    }}>
                      <Box display="flex" alignItems="center" mb={1}>
                        <Sentiment sx={{ mr: 1, color: theme.palette.primary.main, fontSize: 20 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                          Sentiment
                        </Typography>
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary, mb: 0.5 }}>
                        {analysisData.analysis.sentiment.recommendation}
                      </Typography>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                        {(analysisData.analysis.sentiment.confidence * 100).toFixed(1)}% confidence
                      </Typography>
                    </Box>
                  </Grid>

                  {/* Gemini AI */}
                  <Grid item xs={6}>
                    <Box sx={{ 
                      p: 2, 
                      borderRadius: 2, 
                      backgroundColor: alpha(theme.palette.background.paper, 0.5),
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    }}>
                      <Box display="flex" alignItems="center" mb={1}>
                        <SmartToy sx={{ mr: 1, color: theme.palette.secondary.main, fontSize: 20 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                          Gemini AI
                        </Typography>
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary, mb: 0.5 }}>
                        {analysisData.analysis.gemini.recommendation}
                      </Typography>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                        {(analysisData.analysis.gemini.confidence * 100).toFixed(1)}% confidence
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Trading Decision */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: theme.palette.text.primary }}>
                  💼 Trading Decision
                </Typography>
                <Box sx={{ 
                  p: 3, 
                  borderRadius: 2, 
                  backgroundColor: alpha(
                    analysisData.tradingDecision.action === 'EXECUTE_TRADE' 
                      ? theme.palette.success.main 
                      : theme.palette.error.main, 
                    0.1
                  ),
                  border: `1px solid ${alpha(
                    analysisData.tradingDecision.action === 'EXECUTE_TRADE' 
                      ? theme.palette.success.main 
                      : theme.palette.error.main, 
                    0.2
                  )}`,
                }}>
                  <Box display="flex" alignItems="center" mb={2}>
                    {getTradingDecisionIcon(analysisData.tradingDecision.action)}
                    <Typography variant="h6" sx={{ ml: 1, fontWeight: 600, color: theme.palette.text.primary }}>
                      {analysisData.tradingDecision.action.replace('_', ' ')}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 2 }}>
                    {analysisData.tradingDecision.reason}
                  </Typography>
                  
                  {analysisData.tradingDecision.action === 'EXECUTE_TRADE' && (
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                          Trade Size
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                          {analysisData.tradingDecision.tradeSize} USDT
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                          Target Profit
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                          {analysisData.tradingDecision.targetProfit} USDT
                        </Typography>
                      </Grid>
                    </Grid>
                  )}
                </Box>
              </Box>

              {/* System Status */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: theme.palette.text.primary }}>
                  🎯 12 USDT System Status
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Box textAlign="center" sx={{ p: 1, borderRadius: 2, backgroundColor: alpha(theme.palette.background.paper, 0.5) }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                        {analysisData.systemStatus.activePositions}
                      </Typography>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                        Active Positions
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box textAlign="center" sx={{ p: 1, borderRadius: 2, backgroundColor: alpha(theme.palette.background.paper, 0.5) }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                        {analysisData.systemStatus.availableCapital}
                      </Typography>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                        Available Capital
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box textAlign="center" sx={{ p: 1, borderRadius: 2, backgroundColor: alpha(theme.palette.background.paper, 0.5) }}>
                      <Chip
                        label={analysisData.systemStatus.canTrade ? 'Ready' : 'Blocked'}
                        size="small"
                        sx={{
                          backgroundColor: alpha(
                            analysisData.systemStatus.canTrade ? theme.palette.success.main : theme.palette.error.main, 
                            0.1
                          ),
                          color: analysisData.systemStatus.canTrade ? theme.palette.success.main : theme.palette.error.main,
                          fontWeight: 600,
                        }}
                      />
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mt: 0.5 }}>
                        Trading Status
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              {/* Last Update */}
              <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                  Last updated: {formatTimestamp(lastUpdate)} • Auto-refresh: 3min
                </Typography>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ComprehensiveAnalysisCard;
