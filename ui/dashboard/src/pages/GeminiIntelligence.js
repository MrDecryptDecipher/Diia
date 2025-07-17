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
  TextField,
  MenuItem,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  Psychology as GeminiIcon,
  ExpandMore as ExpandMoreIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Timeline as TimelineIcon,
  Analytics as AnalyticsIcon,
  Refresh as RefreshIcon,
  AutoAwesome as AIIcon,
  Insights as InsightsIcon,
  Assessment as AssessmentIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useData } from '../context/DataContext';

const GeminiIntelligence = () => {
  const { assets } = useData();
  const [selectedAsset, setSelectedAsset] = useState(null); // No default asset - user must select
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h');
  const [geminiAnalysis, setGeminiAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [assetsLoading, setAssetsLoading] = useState(true);

  const timeframes = [
    { value: '1m', label: '1 Minute' },
    { value: '5m', label: '5 Minutes' },
    { value: '15m', label: '15 Minutes' },
    { value: '1h', label: '1 Hour' },
    { value: '4h', label: '4 Hours' },
    { value: '1d', label: '1 Day' },
    { value: '1w', label: '1 Week' }
  ];

  // Fetch available assets from Bybit linear perpetuals
  const fetchAvailableAssets = async () => {
    setAssetsLoading(true);
    try {
      const response = await fetch('/api/assets/linear-perpetuals');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const assets = await response.json();
      // Show ALL linear assets, not just a subset
      setAvailableAssets(assets);

      // REMOVED: No automatic asset selection - user must choose
      console.log('📋 Loaded', assets.length, 'assets. User must select one to start analysis.');

    } catch (err) {
      console.error('Error fetching available assets:', err);
      setError(`Failed to load assets: ${err.message}`);
    } finally {
      setAssetsLoading(false);
    }
  };

  // Fetch comprehensive Gemini AI analysis for all timeframes
  const fetchGeminiAnalysis = async (asset) => {
    console.log('🧠 Starting Gemini analysis for:', asset);
    setLoading(true);
    setError(null);

    try {
      // Perform enhanced Gemini Intelligence analysis with real market data
      const response = await fetch('/api/gemini-intelligence/comprehensive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          asset: asset,
          timeframes: timeframes.map(tf => tf.value) // Analyze all timeframes
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setGeminiAnalysis(data);
      setLastUpdate(new Date());
      
    } catch (err) {
      console.error('Error fetching Gemini analysis:', err);
      setError(`Failed to fetch Gemini analysis: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Initial load of assets
  useEffect(() => {
    fetchAvailableAssets();
  }, []);

  // REMOVED: Automatic analysis - now only triggered by user selection
  // Analysis is performed only when user clicks on an asset card

  // Get confidence color
  const getConfidenceColor = (confidence) => {
    if (confidence >= 90) return '#4CAF50';
    if (confidence >= 75) return '#8BC34A';
    if (confidence >= 60) return '#FFC107';
    if (confidence >= 45) return '#FF9800';
    return '#F44336';
  };

  // Get signal strength color
  const getSignalColor = (signal) => {
    switch (signal?.toLowerCase()) {
      case 'strong_buy': return '#4CAF50';
      case 'buy': return '#8BC34A';
      case 'neutral': return '#FFC107';
      case 'sell': return '#FF9800';
      case 'strong_sell': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography
            variant="h4"
            sx={{
              fontFamily: 'Orbitron, sans-serif',
              fontWeight: 700,
              background: 'linear-gradient(45deg, #7B68EE, #00BFFF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
            className="glow-text"
          >
            🧠 Enhanced Gemini Intelligence
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              select
              size="small"
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              sx={{ minWidth: 120 }}
            >
              {timeframes.map((tf) => (
                <MenuItem key={tf.value} value={tf.value}>
                  {tf.label}
                </MenuItem>
              ))}
            </TextField>

            <Tooltip title="Refresh Analysis">
              <IconButton
                onClick={() => fetchGeminiAnalysis(selectedAsset, selectedTimeframe)}
                disabled={loading}
                sx={{ color: 'primary.main' }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Asset Selector Cards */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontFamily: 'Rajdhani, sans-serif' }}>
            Select Asset for Gemini AI Analysis
          </Typography>

          {assetsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <Grid container spacing={2}>
              {availableAssets.map((asset) => (
                <Grid item xs={6} sm={4} md={3} lg={2} key={asset.baseAsset}>
                  <Card
                    className={`futuristic-border ${selectedAsset === asset.baseAsset ? 'quantum-particles' : ''}`}
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      border: selectedAsset === asset.baseAsset ? '2px solid #7B68EE' : '1px solid rgba(255,255,255,0.1)',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 25px rgba(123, 104, 238, 0.3)'
                      }
                    }}
                    onClick={() => {
                      console.log('🧠 User selected asset for Gemini analysis:', asset.baseAsset);
                      setSelectedAsset(asset.baseAsset);
                      // Trigger Gemini analysis only when user selects an asset
                      fetchGeminiAnalysis(asset.baseAsset);
                    }}
                  >
                    <CardContent sx={{ p: 2, textAlign: 'center' }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontFamily: 'Orbitron, sans-serif',
                          fontWeight: 600,
                          mb: 1
                        }}
                      >
                        {asset.baseAsset}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {asset.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: asset.change24h >= 0 ? '#4CAF50' : '#F44336',
                          fontWeight: 600
                        }}
                      >
                        {asset.change24h >= 0 ? '+' : ''}{asset.change24h?.toFixed(2)}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ${asset.price?.toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* No Asset Selected Message */}
        {!selectedAsset && !loading && (
          <Box sx={{
            textAlign: 'center',
            py: 8,
            background: 'linear-gradient(135deg, rgba(123, 104, 238, 0.1), rgba(0, 191, 255, 0.1))',
            borderRadius: 2,
            border: '1px solid rgba(123, 104, 238, 0.3)'
          }}>
            <GeminiIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2, opacity: 0.7 }} />
            <Typography variant="h5" sx={{
              fontFamily: 'Rajdhani, sans-serif',
              fontWeight: 600,
              mb: 2,
              color: 'text.primary'
            }}>
              Select an Asset for Gemini AI Analysis
            </Typography>
            <Typography variant="body1" sx={{
              color: 'text.secondary',
              maxWidth: 500,
              mx: 'auto',
              lineHeight: 1.6
            }}>
              Click on any asset card above to get comprehensive AI-powered market analysis
              and trading insights from Google's Gemini AI system.
            </Typography>
          </Box>
        )}

        {/* Gemini Analysis Results */}
        {geminiAnalysis && !loading && (
          <Grid container spacing={3}>
            {/* Overall Assessment */}
            <Grid item xs={12} md={6}>
              <Card className="futuristic-border quantum-particles">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <GeminiIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6" sx={{ fontFamily: 'Rajdhani, sans-serif' }}>
                      AI Assessment
                    </Typography>
                  </Box>
                  
                  <Box sx={{ textAlign: 'center' }}>
                    <Chip
                      label={geminiAnalysis.overallSignal || 'ANALYZING'}
                      sx={{
                        backgroundColor: getSignalColor(geminiAnalysis.overallSignal),
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '1rem',
                        mb: 2
                      }}
                    />
                    
                    <Typography
                      variant="h3"
                      sx={{
                        fontFamily: 'Orbitron, sans-serif',
                        fontWeight: 700,
                        color: getConfidenceColor(geminiAnalysis.confidence || 0),
                        mb: 1
                      }}
                    >
                      {geminiAnalysis.confidence || 0}%
                    </Typography>
                    
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Confidence Level
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Key Metrics */}
            <Grid item xs={12} md={6}>
              <Card className="futuristic-border">
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontFamily: 'Rajdhani, sans-serif' }}>
                    Key Metrics
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <SpeedIcon sx={{ fontSize: 30, color: 'primary.main', mb: 1 }} />
                        <Typography variant="h6" sx={{ fontFamily: 'Orbitron, sans-serif' }}>
                          {geminiAnalysis.momentum || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Momentum
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <SecurityIcon sx={{ fontSize: 30, color: 'secondary.main', mb: 1 }} />
                        <Typography variant="h6" sx={{ fontFamily: 'Orbitron, sans-serif' }}>
                          {geminiAnalysis.riskLevel || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Risk Level
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Detailed Analysis Sections */}
            <Grid item xs={12}>
              <Card className="futuristic-border">
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontFamily: 'Rajdhani, sans-serif' }}>
                    Detailed Analysis
                  </Typography>
                  
                  {/* Technical Analysis */}
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TimelineIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="subtitle1">Technical Analysis</Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        {geminiAnalysis.technicalAnalysis || 'Comprehensive technical analysis including price action, support/resistance levels, trend analysis, and momentum indicators.'}
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Support Level</Typography>
                          <Typography variant="body1">${geminiAnalysis.supportLevel || 'Calculating...'}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Resistance Level</Typography>
                          <Typography variant="body1">${geminiAnalysis.resistanceLevel || 'Calculating...'}</Typography>
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>

                  {/* Market Structure */}
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AnalyticsIcon sx={{ mr: 1, color: 'secondary.main' }} />
                        <Typography variant="subtitle1">Market Structure</Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        {geminiAnalysis.marketStructure || 'Analysis of market structure, order flow, volume profile, and institutional activity patterns.'}
                      </Typography>
                      
                      <List dense>
                        <ListItem>
                          <ListItemIcon>
                            <TrendingUpIcon sx={{ color: 'success.main' }} />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Trend Direction" 
                            secondary={geminiAnalysis.trendDirection || 'Analyzing current trend direction'}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <AssessmentIcon sx={{ color: 'info.main' }} />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Volume Analysis" 
                            secondary={geminiAnalysis.volumeAnalysis || 'Evaluating volume patterns and strength'}
                          />
                        </ListItem>
                      </List>
                    </AccordionDetails>
                  </Accordion>

                  {/* AI Reasoning */}
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AIIcon sx={{ mr: 1, color: 'warning.main' }} />
                        <Typography variant="subtitle1">AI Reasoning</Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        {geminiAnalysis.aiReasoning || 'Advanced AI reasoning combining multiple timeframe analysis, pattern recognition, and market psychology to provide comprehensive trading insights.'}
                      </Typography>
                      
                      {geminiAnalysis.keyFactors && (
                        <Box>
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>Key Factors:</Typography>
                          {geminiAnalysis.keyFactors.map((factor, index) => (
                            <Chip
                              key={index}
                              label={factor}
                              size="small"
                              variant="outlined"
                              sx={{ mr: 1, mb: 1 }}
                            />
                          ))}
                        </Box>
                      )}
                    </AccordionDetails>
                  </Accordion>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Last Update Info */}
        {lastUpdate && (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Last updated: {lastUpdate.toLocaleTimeString()} |
              Powered by Gemini AI
            </Typography>
          </Box>
        )}
      </motion.div>
    </Box>
  );
};

export default GeminiIntelligence;
