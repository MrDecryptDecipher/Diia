import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Button,
  TextField,
  MenuItem,
  Paper,
  CardActionArea,
  Badge
} from '@mui/material';
import {
  Twitter as TwitterIcon,
  Reddit as RedditIcon,
  Article as NewsIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Psychology as SentimentIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useData } from '../context/DataContext';

const SocialMediaInsights = () => {
  const { assets } = useData();
  const [selectedAsset, setSelectedAsset] = useState(null); // No default asset - user must select
  const [sentimentData, setSentimentData] = useState(null);

  // Debug: Log when sentiment data changes
  useEffect(() => {
    if (sentimentData) {
      console.log('📊 Sentiment data state updated:', sentimentData);
    }
  }, [sentimentData]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [assetsLoading, setAssetsLoading] = useState(true);

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

      // Don't auto-select first asset to avoid race conditions
      // User must click on an asset to trigger analysis
      console.log('📋 Loaded', assets.length, 'assets. User must select one to start analysis.');

    } catch (err) {
      console.error('Error fetching available assets:', err);
      setError(`Failed to load assets: ${err.message}`);
    } finally {
      setAssetsLoading(false);
    }
  };

  // Fetch sentiment data from Super Intelligent MCP Orchestration for selected asset
  const fetchSentimentData = async (asset) => {
    console.log('🌐 Starting sentiment analysis for:', asset);
    setLoading(true);
    setError(null);

    try {
      console.log('📡 Making API call for asset:', asset, 'to:', '/api/sentiment/search');

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      // Use Enhanced Social Media Insights API with real Twitter, Reddit, and News APIs
      const response = await fetch('/api/social-insights/comprehensive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          asset: asset,
          searchQueries: [
            `${asset} cryptocurrency latest news`,
            `${asset} crypto reddit discussion`,
            `${asset} twitter sentiment analysis`,
            `${asset} price prediction 2025`,
            `${asset} technical analysis today`
          ]
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Sentiment data received for:', data.asset, 'requested asset was:', asset);

      // Only update state if this response is for the currently selected asset
      if (data.asset === asset) {
        setSentimentData(data);
        setLastUpdate(new Date());
        console.log('✅ State updated for asset:', asset);
      } else {
        console.log('⚠️ Ignoring response for:', data.asset, 'current asset is:', asset);
      }

    } catch (err) {
      console.error('❌ Error fetching sentiment data:', err);

      if (err.name === 'AbortError') {
        setError(`Request timeout for ${asset} - please try again`);
      } else if (err.message.includes('Failed to fetch')) {
        setError(`Network error for ${asset} - check connection`);
      } else {
        setError(`Failed to fetch sentiment data for ${asset}: ${err.message}`);
      }
    } finally {
      console.log('🏁 Sentiment analysis completed for:', asset);
      setLoading(false);
    }
  };

  // Initial load of assets
  useEffect(() => {
    fetchAvailableAssets();
  }, []);

  // REMOVED: Automatic data fetching - now only triggered by user selection
  // Data is fetched only when user clicks on an asset card

  // REMOVED: Auto-refresh functionality - now only manual refresh
  // Users can manually refresh by clicking the asset again or using refresh button

  // Get sentiment color
  const getSentimentColor = (score) => {
    if (score >= 0.7) return '#4CAF50'; // Green
    if (score >= 0.6) return '#8BC34A'; // Light Green
    if (score >= 0.4) return '#FFC107'; // Yellow
    if (score >= 0.3) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  // Get recommendation color
  const getRecommendationColor = (recommendation) => {
    switch (recommendation) {
      case 'STRONG_BUY': return '#4CAF50';
      case 'BUY': return '#8BC34A';
      case 'NEUTRAL': return '#FFC107';
      case 'SELL': return '#FF9800';
      case 'STRONG_SELL': return '#F44336';
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
            Social Media Insights
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Tooltip title="Refresh Data">
              <IconButton
                onClick={() => fetchSentimentData(selectedAsset)}
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
            Select Asset for Sentiment Analysis
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
                      console.log('🎯 User selected asset:', asset.baseAsset);
                      setSelectedAsset(asset.baseAsset);
                      // Trigger MCP data fetching only when user selects an asset
                      fetchSentimentData(asset.baseAsset);
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
            <SentimentIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2, opacity: 0.7 }} />
            <Typography variant="h5" sx={{
              fontFamily: 'Rajdhani, sans-serif',
              fontWeight: 600,
              mb: 2,
              color: 'text.primary'
            }}>
              Select an Asset to View Social Media Insights
            </Typography>
            <Typography variant="body1" sx={{
              color: 'text.secondary',
              maxWidth: 500,
              mx: 'auto',
              lineHeight: 1.6
            }}>
              Click on any asset card above to fetch real-time social media sentiment analysis
              from Twitter, Reddit, and news sources using our comprehensive MCP system.
            </Typography>
          </Box>
        )}

        {/* Sentiment Data */}
        {sentimentData && !loading && (
          <Grid container spacing={3}>
            {/* Overall Sentiment Score */}
            <Grid item xs={12} md={4}>
              <Card className="futuristic-border quantum-particles">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <SentimentIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6" sx={{ fontFamily: 'Rajdhani, sans-serif' }}>
                      Overall Sentiment
                    </Typography>
                  </Box>
                  
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography
                      variant="h2"
                      sx={{
                        fontFamily: 'Orbitron, sans-serif',
                        fontWeight: 700,
                        color: getSentimentColor(sentimentData.overallScore),
                        mb: 1
                      }}
                    >
                      {(sentimentData.overallScore * 100).toFixed(1)}%
                    </Typography>
                    
                    <Chip
                      label={sentimentData.recommendation}
                      sx={{
                        backgroundColor: getRecommendationColor(sentimentData.recommendation),
                        color: 'white',
                        fontWeight: 600
                      }}
                    />
                    
                    <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                      Confidence: {(sentimentData.confidence * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Source Breakdown */}
            <Grid item xs={12} md={8}>
              <Card className="futuristic-border">
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontFamily: 'Rajdhani, sans-serif' }}>
                    Dual-MCP Source Analysis
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <TwitterIcon sx={{ fontSize: 40, color: '#1DA1F2', mb: 1 }} />
                        <Typography variant="h6" sx={{ fontFamily: 'Orbitron, sans-serif' }}>
                          {sentimentData.breakdown?.twitter || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Twitter Posts
                        </Typography>
                        <Chip
                          label="Real API"
                          size="small"
                          sx={{
                            mt: 0.5,
                            backgroundColor: 'rgba(29, 161, 242, 0.1)',
                            color: '#1DA1F2',
                            fontSize: '0.6rem'
                          }}
                        />
                      </Box>
                    </Grid>

                    <Grid item xs={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <RedditIcon sx={{ fontSize: 40, color: '#FF4500', mb: 1 }} />
                        <Typography variant="h6" sx={{ fontFamily: 'Orbitron, sans-serif' }}>
                          {sentimentData.breakdown?.reddit || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Reddit Posts
                        </Typography>
                        <Chip
                          label="Real API"
                          size="small"
                          sx={{
                            mt: 0.5,
                            backgroundColor: 'rgba(255, 69, 0, 0.1)',
                            color: '#FF4500',
                            fontSize: '0.6rem'
                          }}
                        />
                      </Box>
                    </Grid>

                    <Grid item xs={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <NewsIcon sx={{ fontSize: 40, color: '#4CAF50', mb: 1 }} />
                        <Typography variant="h6" sx={{ fontFamily: 'Orbitron, sans-serif' }}>
                          {sentimentData.breakdown?.news || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          News Articles
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <SearchIcon sx={{ fontSize: 40, color: '#9C27B0', mb: 1 }} />
                        <Typography variant="h6" sx={{ fontFamily: 'Orbitron, sans-serif' }}>
                          {(sentimentData.breakdown?.webScout || 0) + (sentimentData.breakdown?.brightData || 0)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          MCP Sources
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  {/* MCP Breakdown */}
                  <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <Typography variant="subtitle2" sx={{ mb: 2, fontFamily: 'Rajdhani, sans-serif' }}>
                      MCP Engine Breakdown
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Box sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            backgroundColor: '#00BCD4',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 8px',
                            fontSize: '14px',
                            fontWeight: 'bold'
                          }}>
                            WS
                          </Box>
                          <Typography variant="h6" sx={{ fontFamily: 'Orbitron, sans-serif' }}>
                            {sentimentData.breakdown?.webScout || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Super Intelligent MCP
                          </Typography>
                        </Box>
                      </Grid>

                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Box sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            backgroundColor: '#FF5722',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 8px',
                            fontSize: '14px',
                            fontWeight: 'bold'
                          }}>
                            BD
                          </Box>
                          <Typography variant="h6" sx={{ fontFamily: 'Orbitron, sans-serif' }}>
                            {sentimentData.breakdown?.brightData || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Bright Data MCP
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Sentiment Trends Visualization */}
                  <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <Typography variant="subtitle2" sx={{ mb: 2, fontFamily: 'Rajdhani, sans-serif' }}>
                      🧠 Super Intelligent Sentiment Distribution
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Box sx={{
                          p: 2,
                          borderRadius: 2,
                          backgroundColor: 'rgba(76, 175, 80, 0.1)',
                          border: '1px solid rgba(76, 175, 80, 0.3)',
                          textAlign: 'center'
                        }}>
                          <TrendingUpIcon sx={{ fontSize: 30, color: '#4CAF50', mb: 1 }} />
                          <Typography variant="h5" sx={{ color: '#4CAF50', fontWeight: 600 }}>
                            {sentimentData.trends?.bullish || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Bullish Signals
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box sx={{
                          p: 2,
                          borderRadius: 2,
                          backgroundColor: 'rgba(255, 193, 7, 0.1)',
                          border: '1px solid rgba(255, 193, 7, 0.3)',
                          textAlign: 'center'
                        }}>
                          <SentimentIcon sx={{ fontSize: 30, color: '#FFC107', mb: 1 }} />
                          <Typography variant="h5" sx={{ color: '#FFC107', fontWeight: 600 }}>
                            {sentimentData.trends?.neutral || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Neutral Signals
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box sx={{
                          p: 2,
                          borderRadius: 2,
                          backgroundColor: 'rgba(244, 67, 54, 0.1)',
                          border: '1px solid rgba(244, 67, 54, 0.3)',
                          textAlign: 'center'
                        }}>
                          <TrendingDownIcon sx={{ fontSize: 30, color: '#F44336', mb: 1 }} />
                          <Typography variant="h5" sx={{ color: '#F44336', fontWeight: 600 }}>
                            {sentimentData.trends?.bearish || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Bearish Signals
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Recent Sources */}
            <Grid item xs={12}>
              <Card className="futuristic-border">
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontFamily: 'Rajdhani, sans-serif' }}>
                    Dual-MCP Sources ({sentimentData.sourceCount} total)
                  </Typography>
                  
                  <List>
                    {sentimentData.sources?.slice(0, 5).map((source, index) => (
                      <React.Fragment key={index}>
                        <ListItem>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: getSentimentColor(source.sentiment) }}>
                              {source.source === 'twitter' ? <TwitterIcon /> : 
                               source.source === 'reddit' ? <RedditIcon /> : <NewsIcon />}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={source.title}
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  {source.url}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                  {source.keywords?.slice(0, 3).map((keyword, idx) => (
                                    <Chip
                                      key={idx}
                                      label={keyword.keyword}
                                      size="small"
                                      variant="outlined"
                                      sx={{ fontSize: '0.7rem' }}
                                    />
                                  ))}
                                </Box>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < 4 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
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
              Powered by 🧠 Super Intelligent MCP Orchestration
            </Typography>
          </Box>
        )}
      </motion.div>
    </Box>
  );
};

export default SocialMediaInsights;
