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
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Psychology,
  TrendingUp,
  TrendingDown,
  Refresh,
  ExpandMore,
  SmartToy,
  Schedule,
  Warning,
  Lightbulb,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const GeminiAnalysisCard = ({ symbol = 'DOGEUSDT' }) => {
  const theme = useTheme();
  const [geminiData, setGeminiData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchGeminiData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://3.111.22.56:10002/api/gemini/${symbol}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setGeminiData(data);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err.message);
      console.error('Error fetching Gemini data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGeminiData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchGeminiData, 300000);
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

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Card
        sx={{
          background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
          border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
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
                background: `linear-gradient(45deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
                color: 'white',
              }}
            >
              <SmartToy />
            </Box>
          }
          title={
            <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
              🤖 Gemini CLI AI Analysis
            </Typography>
          }
          subheader={
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              AI-powered trading recommendations for 12 USDT system
            </Typography>
          }
          action={
            <Tooltip title="Refresh AI analysis">
              <IconButton onClick={fetchGeminiData} disabled={loading}>
                <Refresh sx={{ color: loading ? theme.palette.action.disabled : theme.palette.secondary.main }} />
              </IconButton>
            </Tooltip>
          }
        />

        <CardContent>
          {loading && (
            <Box display="flex" justifyContent="center" alignItems="center" py={4}>
              <CircularProgress size={40} color="secondary" />
              <Typography variant="body2" sx={{ ml: 2, color: theme.palette.text.secondary }}>
                AI analyzing market conditions...
              </Typography>
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Failed to load AI analysis: {error}
            </Alert>
          )}

          {geminiData && !loading && (
            <Box>
              {/* Main AI Recommendation */}
              <Box sx={{ mb: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                    {symbol.replace('USDT', '')}
                  </Typography>
                  <Chip
                    icon={getRecommendationIcon(geminiData.recommendation)}
                    label={geminiData.recommendation}
                    sx={{
                      backgroundColor: alpha(getRecommendationColor(geminiData.recommendation), 0.1),
                      color: getRecommendationColor(geminiData.recommendation),
                      fontWeight: 600,
                      fontSize: '0.875rem',
                    }}
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                      AI Confidence Level
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                      {(geminiData.confidence * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={geminiData.confidence * 100}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: alpha(theme.palette.grey[500], 0.2),
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getRecommendationColor(geminiData.recommendation),
                        borderRadius: 4,
                      },
                    }}
                  />
                </Box>
              </Box>

              {/* Trading Configuration */}
              {geminiData.tradingConfig && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: theme.palette.text.primary }}>
                    💰 12 USDT System Configuration
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box textAlign="center" sx={{ p: 1, borderRadius: 2, backgroundColor: alpha(theme.palette.background.paper, 0.5) }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                          {geminiData.tradingConfig.tradeSize} USDT
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                          Trade Size
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box textAlign="center" sx={{ p: 1, borderRadius: 2, backgroundColor: alpha(theme.palette.background.paper, 0.5) }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                          {geminiData.tradingConfig.targetProfitPerTrade} USDT
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                          Target Profit
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box textAlign="center" sx={{ p: 1, borderRadius: 2, backgroundColor: alpha(theme.palette.background.paper, 0.5) }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                          {geminiData.tradingConfig.maxActivePositions}
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                          Max Positions
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box textAlign="center" sx={{ p: 1, borderRadius: 2, backgroundColor: alpha(theme.palette.background.paper, 0.5) }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                          {geminiData.tradingConfig.targetTradesPerDay}
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                          Target Trades/Day
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* AI Reasoning */}
              <Box sx={{ mb: 2 }}>
                <Accordion
                  sx={{
                    backgroundColor: alpha(theme.palette.background.paper, 0.5),
                    '&:before': { display: 'none' },
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box display="flex" alignItems="center">
                      <Psychology sx={{ mr: 1, color: theme.palette.secondary.main }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        AI Reasoning
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, lineHeight: 1.6 }}>
                      {geminiData.reasoning}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              </Box>

              {/* Risk Factors */}
              <Box sx={{ mb: 2 }}>
                <Accordion
                  sx={{
                    backgroundColor: alpha(theme.palette.background.paper, 0.5),
                    '&:before': { display: 'none' },
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box display="flex" alignItems="center">
                      <Warning sx={{ mr: 1, color: theme.palette.warning.main }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Risk Factors
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, lineHeight: 1.6 }}>
                      {geminiData.riskFactors}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              </Box>

              {/* Opportunities */}
              <Box sx={{ mb: 2 }}>
                <Accordion
                  sx={{
                    backgroundColor: alpha(theme.palette.background.paper, 0.5),
                    '&:before': { display: 'none' },
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box display="flex" alignItems="center">
                      <Lightbulb sx={{ mr: 1, color: theme.palette.success.main }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Opportunities
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, lineHeight: 1.6 }}>
                      {geminiData.opportunities}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              </Box>

              {/* Timeframe */}
              <Box sx={{ mb: 2 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  backgroundColor: alpha(theme.palette.background.paper, 0.5),
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}>
                  <Box display="flex" alignItems="center">
                    <Schedule sx={{ mr: 1, color: theme.palette.info.main }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                      Optimal Timeframe
                    </Typography>
                  </Box>
                  <Chip
                    label={geminiData.timeframe}
                    size="small"
                    sx={{
                      backgroundColor: alpha(theme.palette.info.main, 0.1),
                      color: theme.palette.info.main,
                      fontWeight: 500,
                    }}
                  />
                </Box>
              </Box>

              {/* Last Update */}
              <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                  Last updated: {formatTimestamp(lastUpdate)} • Auto-refresh: 5min
                </Typography>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default GeminiAnalysisCard;
