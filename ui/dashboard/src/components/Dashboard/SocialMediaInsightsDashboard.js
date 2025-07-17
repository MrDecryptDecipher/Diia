import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Tooltip,
  Alert,
  CircularProgress,
  Button,
  CardActionArea,
  useTheme as useMuiTheme,
  alpha,
  LinearProgress
} from '@mui/material';
import {
  Twitter as TwitterIcon,
  Reddit as RedditIcon,
  Article as NewsIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,

  Psychology as SentimentIcon,
  Timeline as TimelineIcon,
  ArrowForward
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { formatNumber } from '../../utils/formatters';

const SocialMediaInsightsDashboard = ({ assets }) => {
  const muiTheme = useMuiTheme();
  const navigate = useNavigate();
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [sentimentData, setSentimentData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Get top assets for display
  const topAssets = assets ? assets.slice(0, 12) : [];

  // Fetch sentiment data for an asset
  const fetchSentimentData = async (asset) => {
    if (!asset) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('📡 Fetching sentiment data for:', asset);
      
      const response = await fetch(`/api/social-insights/comprehensive`, {
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
            `${asset} price prediction 2025`
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSentimentData(prev => ({
        ...prev,
        [asset]: data
      }));
      setLastUpdate(new Date());
      
    } catch (err) {
      console.error('Error fetching sentiment data:', err);
      setError(`Failed to fetch sentiment data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle asset selection
  const handleAssetClick = (asset) => {
    setSelectedAsset(asset.symbol);
    fetchSentimentData(asset.symbol);
  };

  // Get sentiment color
  const getSentimentColor = (score) => {
    if (score >= 0.7) return muiTheme.palette.success.main;
    if (score >= 0.5) return muiTheme.palette.warning.main;
    return muiTheme.palette.error.main;
  };

  // Get sentiment label
  const getSentimentLabel = (score) => {
    if (score >= 0.7) return 'BULLISH';
    if (score >= 0.5) return 'NEUTRAL';
    return 'BEARISH';
  };

  return (
    <Card 
      sx={{ 
        background: 'rgba(17, 24, 39, 0.7)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${alpha(muiTheme.palette.primary.main, 0.2)}`,
      }}
      className="futuristic-border"
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SentimentIcon sx={{ mr: 1, color: muiTheme.palette.primary.main }} />
            <Typography 
              variant="h6" 
              sx={{ 
                fontFamily: 'Rajdhani, sans-serif', 
                fontWeight: 600,
                color: muiTheme.palette.primary.main
              }}
            >
              Social Media Insights
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="🧠 Super Intelligent MCP Orchestration">
              <Chip
                label="🧠 Super Intelligent MCP"
                size="small"
                color="primary"
                variant="outlined"
                sx={{ mr: 1 }}
              />
            </Tooltip>
            <Button
              size="small"
              endIcon={<ArrowForward />}
              onClick={() => navigate('/social-insights')}
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
                  className={`futuristic-border ${selectedAsset === asset.symbol ? 'quantum-particles' : ''}`}
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    border: selectedAsset === asset.symbol ? 
                      `2px solid ${muiTheme.palette.primary.main}` : 
                      '1px solid rgba(255,255,255,0.1)',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 8px 25px ${alpha(muiTheme.palette.primary.main, 0.3)}`
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
                      {sentimentData[asset.symbol] && (
                        <Box sx={{ mt: 1 }}>
                          <Chip
                            label={getSentimentLabel(sentimentData[asset.symbol].overallScore)}
                            size="small"
                            sx={{
                              backgroundColor: alpha(getSentimentColor(sentimentData[asset.symbol].overallScore), 0.2),
                              color: getSentimentColor(sentimentData[asset.symbol].overallScore),
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
              Analyzing social media sentiment...
            </Typography>
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Selected Asset Sentiment Display */}
        {selectedAsset && sentimentData[selectedAsset] && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Box sx={{ 
              p: 2, 
              border: `1px solid ${alpha(muiTheme.palette.primary.main, 0.3)}`,
              borderRadius: 1,
              background: alpha(muiTheme.palette.primary.main, 0.05)
            }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontFamily: 'Rajdhani, sans-serif', fontWeight: 600 }}>
                {selectedAsset} Sentiment Analysis
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ 
                      color: getSentimentColor(sentimentData[selectedAsset].overallScore),
                      fontFamily: 'Orbitron, sans-serif',
                      fontWeight: 700
                    }}>
                      {Math.round(sentimentData[selectedAsset].overallScore * 100)}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Overall Sentiment
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={8}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TwitterIcon sx={{ mr: 1, color: '#1DA1F2', fontSize: 16 }} />
                    <Typography variant="body2" sx={{ mr: 2 }}>Twitter</Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={sentimentData[selectedAsset].twitterScore * 100} 
                      sx={{ flexGrow: 1, mr: 1 }}
                    />
                    <Typography variant="caption">
                      {Math.round(sentimentData[selectedAsset].twitterScore * 100)}%
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <RedditIcon sx={{ mr: 1, color: '#FF4500', fontSize: 16 }} />
                    <Typography variant="body2" sx={{ mr: 2 }}>Reddit</Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={sentimentData[selectedAsset].redditScore * 100} 
                      sx={{ flexGrow: 1, mr: 1 }}
                    />
                    <Typography variant="caption">
                      {Math.round(sentimentData[selectedAsset].redditScore * 100)}%
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <NewsIcon sx={{ mr: 1, color: '#FFA726', fontSize: 16 }} />
                    <Typography variant="body2" sx={{ mr: 2 }}>News</Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={sentimentData[selectedAsset].newsScore * 100} 
                      sx={{ flexGrow: 1, mr: 1 }}
                    />
                    <Typography variant="caption">
                      {Math.round(sentimentData[selectedAsset].newsScore * 100)}%
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Chip
                  label={sentimentData[selectedAsset].recommendation}
                  color={sentimentData[selectedAsset].recommendation === 'BUY' ? 'success' : 
                         sentimentData[selectedAsset].recommendation === 'SELL' ? 'error' : 'warning'}
                  icon={sentimentData[selectedAsset].recommendation === 'BUY' ? <TrendingUpIcon /> : 
                        sentimentData[selectedAsset].recommendation === 'SELL' ? <TrendingDownIcon /> : <TimelineIcon />}
                />
                <Typography variant="caption" color="text.secondary">
                  Sources: {sentimentData[selectedAsset].sourceCount || 0}
                </Typography>
              </Box>
            </Box>
          </motion.div>
        )}

        {/* Last Update */}
        {lastUpdate && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
            Last updated: {lastUpdate.toLocaleTimeString()}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default SocialMediaInsightsDashboard;
