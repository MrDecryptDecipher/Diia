import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Button,
  CardActionArea,
  useTheme as useMuiTheme,
  alpha,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Timeline as TimelineIcon,
  ArrowForward,
  ExpandMore as ExpandMoreIcon,
  AutoAwesome as GeminiIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { formatNumber } from '../../utils/formatters';

const GeminiIntelligenceDashboard = ({ assets }) => {
  const muiTheme = useMuiTheme();
  const navigate = useNavigate();
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [geminiAnalysis, setGeminiAnalysis] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Timeframes for analysis
  const timeframes = [
    { value: '1m', label: '1M', color: '#FF6B6B' },
    { value: '5m', label: '5M', color: '#4ECDC4' },
    { value: '15m', label: '15M', color: '#45B7D1' },
    { value: '1h', label: '1H', color: '#96CEB4' },
    { value: '4h', label: '4H', color: '#FFEAA7' },
    { value: '1d', label: '1D', color: '#DDA0DD' }
  ];

  // Get top assets for display
  const topAssets = assets ? assets.slice(0, 12) : [];

  // Fetch Gemini analysis for an asset
  const fetchGeminiAnalysis = async (asset) => {
    if (!asset) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🧠 Fetching Gemini analysis for:', asset);
      
      const response = await fetch(`http://3.111.22.56:10002/api/gemini/comprehensive-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          asset: asset,
          timeframes: timeframes.map(tf => tf.value),
          analysisTypes: [
            'technical_analysis',
            'price_prediction',
            'market_sentiment',
            'risk_assessment',
            'trading_signals',
            'support_resistance',
            'trend_analysis'
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setGeminiAnalysis(prev => ({
        ...prev,
        [asset]: data
      }));
      setLastUpdate(new Date());
      
    } catch (err) {
      console.error('Error fetching Gemini analysis:', err);
      setError(`Failed to fetch Gemini analysis: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle asset selection
  const handleAssetClick = (asset) => {
    setSelectedAsset(asset.symbol);
    fetchGeminiAnalysis(asset.symbol);
  };

  // Get confidence color
  const getConfidenceColor = (confidence) => {
    if (confidence >= 90) return muiTheme.palette.success.main;
    if (confidence >= 75) return muiTheme.palette.info.main;
    if (confidence >= 60) return muiTheme.palette.warning.main;
    return muiTheme.palette.error.main;
  };

  // Get recommendation color
  const getRecommendationColor = (recommendation) => {
    if (recommendation === 'STRONG_BUY' || recommendation === 'BUY') return muiTheme.palette.success.main;
    if (recommendation === 'STRONG_SELL' || recommendation === 'SELL') return muiTheme.palette.error.main;
    return muiTheme.palette.warning.main;
  };

  return (
    <Card 
      sx={{ 
        background: 'rgba(17, 24, 39, 0.7)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${alpha(muiTheme.palette.secondary.main, 0.2)}`,
      }}
      className="futuristic-border"
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <GeminiIcon sx={{ mr: 1, color: muiTheme.palette.secondary.main }} />
            <Typography 
              variant="h6" 
              sx={{ 
                fontFamily: 'Rajdhani, sans-serif', 
                fontWeight: 600,
                color: muiTheme.palette.secondary.main
              }}
            >
              Gemini Intelligence
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Powered by Gemini AI">
              <Chip
                label="AI Analysis"
                size="small"
                color="secondary"
                variant="outlined"
                sx={{ mr: 1 }}
              />
            </Tooltip>
            <Button
              size="small"
              endIcon={<ArrowForward />}
              onClick={() => navigate('/gemini-intelligence')}
            >
              View All
            </Button>
          </Box>
        </Box>

        {/* Asset Selection Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {topAssets.map((asset) => (
            <Grid item xs={6} sm={4} md={3} lg={2} key={asset.symbol}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className={`futuristic-border ${selectedAsset === asset.symbol ? 'neural-connections' : ''}`}
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    border: selectedAsset === asset.symbol ? 
                      `2px solid ${muiTheme.palette.secondary.main}` : 
                      '1px solid rgba(255,255,255,0.1)',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 8px 25px ${alpha(muiTheme.palette.secondary.main, 0.3)}`
                    }
                  }}
                  onClick={() => handleAssetClick(asset)}
                >
                  <CardActionArea>
                    <CardContent sx={{ p: 1.5, textAlign: 'center' }}>
                      <Typography 
                        variant="subtitle2" 
                        sx={{ 
                          fontFamily: 'Rajdhani, sans-serif',
                          fontWeight: 600,
                          mb: 0.5
                        }}
                      >
                        {asset.symbol}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ fontSize: '0.7rem' }}
                      >
                        ${formatNumber(asset.price)}
                      </Typography>
                      {geminiAnalysis[asset.symbol] && (
                        <Box sx={{ mt: 1 }}>
                          <Chip
                            label={`${Math.round(geminiAnalysis[asset.symbol].overallConfidence)}%`}
                            size="small"
                            sx={{
                              backgroundColor: alpha(getConfidenceColor(geminiAnalysis[asset.symbol].overallConfidence), 0.2),
                              color: getConfidenceColor(geminiAnalysis[asset.symbol].overallConfidence),
                              fontSize: '0.6rem',
                              height: 20
                            }}
                          />
                        </Box>
                      )}
                    </CardContent>
                  </CardActionArea>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} sx={{ mr: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Analyzing with Gemini AI...
            </Typography>
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Selected Asset Analysis Display */}
        {selectedAsset && geminiAnalysis[selectedAsset] && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Box sx={{ 
              p: 2, 
              border: `1px solid ${alpha(muiTheme.palette.secondary.main, 0.3)}`,
              borderRadius: 1,
              background: alpha(muiTheme.palette.secondary.main, 0.05)
            }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontFamily: 'Rajdhani, sans-serif', fontWeight: 600 }}>
                {selectedAsset} AI Analysis
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ textAlign: 'center', mb: 2 }}>
                    <Typography variant="h4" sx={{ 
                      color: getConfidenceColor(geminiAnalysis[selectedAsset].overallConfidence),
                      fontFamily: 'Orbitron, sans-serif',
                      fontWeight: 700
                    }}>
                      {Math.round(geminiAnalysis[selectedAsset].overallConfidence)}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      AI Confidence
                    </Typography>
                  </Box>
                  
                  <Chip
                    label={geminiAnalysis[selectedAsset].recommendation}
                    color={
                      geminiAnalysis[selectedAsset].recommendation === 'STRONG_BUY' || 
                      geminiAnalysis[selectedAsset].recommendation === 'BUY' ? 'success' : 
                      geminiAnalysis[selectedAsset].recommendation === 'STRONG_SELL' || 
                      geminiAnalysis[selectedAsset].recommendation === 'SELL' ? 'error' : 'warning'
                    }
                    icon={
                      geminiAnalysis[selectedAsset].recommendation === 'STRONG_BUY' || 
                      geminiAnalysis[selectedAsset].recommendation === 'BUY' ? <TrendingUpIcon /> : 
                      geminiAnalysis[selectedAsset].recommendation === 'STRONG_SELL' || 
                      geminiAnalysis[selectedAsset].recommendation === 'SELL' ? <TrendingDownIcon /> : <TimelineIcon />
                    }
                    sx={{ width: '100%' }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontFamily: 'Rajdhani, sans-serif' }}>
                    Multi-Timeframe Analysis
                  </Typography>
                  
                  <Grid container spacing={1}>
                    {timeframes.map((tf) => (
                      <Grid item xs={4} key={tf.value}>
                        <Box sx={{ 
                          textAlign: 'center', 
                          p: 1, 
                          border: `1px solid ${alpha(tf.color, 0.3)}`,
                          borderRadius: 1,
                          background: alpha(tf.color, 0.1)
                        }}>
                          <Typography variant="caption" sx={{ color: tf.color, fontWeight: 600 }}>
                            {tf.label}
                          </Typography>
                          <Typography variant="caption" sx={{ display: 'block', fontSize: '0.6rem' }}>
                            {geminiAnalysis[selectedAsset].timeframeAnalysis?.[tf.value]?.signal || 'NEUTRAL'}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Grid>
              </Grid>
              
              {/* Key Insights */}
              {geminiAnalysis[selectedAsset].keyInsights && (
                <Accordion sx={{ mt: 2, background: 'transparent' }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2">Key AI Insights</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box>
                      {geminiAnalysis[selectedAsset].keyInsights.slice(0, 3).map((insight, index) => (
                        <Typography key={index} variant="body2" sx={{ mb: 1, fontSize: '0.8rem' }}>
                          • {insight}
                        </Typography>
                      ))}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              )}
            </Box>
          </motion.div>
        )}

        {/* Last Update */}
        {lastUpdate && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
            Last updated: {lastUpdate.toLocaleTimeString()} | Powered by Gemini AI
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default GeminiIntelligenceDashboard;
