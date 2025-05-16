import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Tooltip,
  Chip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Search,
  FilterList,
  Refresh,
  TrendingUp,
  TrendingDown,
  ShowChart,
  BarChart,
  Timeline,
  ArrowForward,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { motion } from 'framer-motion';
import { formatCurrency, formatPercentage, formatNumber } from '../utils/formatters';
import { createChart } from 'lightweight-charts';
import { ResponsivePie } from '@nivo/pie';

// Components
import AssetCard from '../components/Assets/AssetCard';
import TechnicalIndicator from '../components/Assets/TechnicalIndicator';
import LoadingIndicator from '../components/Common/LoadingIndicator';

const Assets = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { assetInfo, fetchAssetCandles } = useData();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [sortBy, setSortBy] = useState('opportunity');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [timeframe, setTimeframe] = useState('1h');
  const [candleData, setCandleData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [indicators, setIndicators] = useState({
    rsi: { value: 0, color: '#8884d8' },
    macd: { value: 0, color: '#82ca9d' },
    bollinger: { value: 0, color: '#ffc658' }
  });

  // Refs
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);

  // Handle search
  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  // Handle filter change
  const handleFilterChange = (event) => {
    setFilterCategory(event.target.value);
  };

  // Handle sort change
  const handleSortChange = (event) => {
    setSortBy(event.target.value);
  };

  // Handle timeframe change
  const handleTimeframeChange = (event, newValue) => {
    setTimeframe(newValue);
  };

  // Handle asset selection
  const handleAssetSelect = async (asset) => {
    setSelectedAsset(asset);
    setIsLoading(true);

    try {
      const data = await fetchAssetCandles(asset.symbol, timeframe);
      setCandleData(data);

      // Calculate indicators (in a real app, these would come from the backend)
      setIndicators({
        rsi: {
          value: Math.random() * 100,
          color: '#8884d8',
          data: [
            { id: 'Overbought', value: 30, color: '#ef5350' },
            { id: 'Neutral', value: 40, color: '#42a5f5' },
            { id: 'Oversold', value: 30, color: '#66bb6a' }
          ]
        },
        macd: {
          value: (Math.random() * 2) - 1,
          color: '#82ca9d',
          data: [
            { id: 'Signal', value: 40, color: '#ef5350' },
            { id: 'MACD', value: 60, color: '#42a5f5' }
          ]
        },
        bollinger: {
          value: Math.random() * 100,
          color: '#ffc658',
          data: [
            { id: 'Upper', value: 33, color: '#ef5350' },
            { id: 'Middle', value: 33, color: '#42a5f5' },
            { id: 'Lower', value: 34, color: '#66bb6a' }
          ]
        }
      });
    } catch (error) {
      console.error('Error fetching candle data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter assets
  const getFilteredAssets = () => {
    if (!assetInfo) return [];

    let filteredAssets = [...assetInfo];

    // Apply search
    if (searchTerm) {
      filteredAssets = filteredAssets.filter(asset =>
        asset.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (filterCategory) {
      filteredAssets = filteredAssets.filter(asset => asset.category === filterCategory);
    }

    // Apply sorting
    filteredAssets.sort((a, b) => {
      switch (sortBy) {
        case 'opportunity':
          return b.opportunityScore - a.opportunityScore;
        case 'volume':
          return b.volume - a.volume;
        case 'price':
          return b.price - a.price;
        case 'change':
          return b.priceChange24h - a.priceChange24h;
        default:
          return 0;
      }
    });

    return filteredAssets;
  };

  // Get unique categories
  const getUniqueCategories = () => {
    if (!assetInfo) return [];
    return [...new Set(assetInfo.map(asset => asset.category))];
  };

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current || !selectedAsset || !candleData || candleData.length === 0) return;

    // Clear previous chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { color: 'rgba(17, 24, 39, 0.7)' },
        textColor: theme.palette.text.primary,
      },
      grid: {
        vertLines: { color: alpha(theme.palette.divider, 0.1) },
        horzLines: { color: alpha(theme.palette.divider, 0.1) },
      },
      crosshair: {
        mode: 0,
      },
      rightPriceScale: {
        borderColor: alpha(theme.palette.divider, 0.2),
      },
      timeScale: {
        borderColor: alpha(theme.palette.divider, 0.2),
      },
    });

    // Add candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: theme.palette.success.main,
      downColor: theme.palette.error.main,
      borderVisible: false,
      wickUpColor: theme.palette.success.main,
      wickDownColor: theme.palette.error.main,
    });

    // Add volume series
    const volumeSeries = chart.addHistogramSeries({
      color: alpha(theme.palette.primary.main, 0.5),
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    // Format data
    const formattedCandleData = candleData.map(candle => ({
      time: candle.time,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }));

    const formattedVolumeData = candleData.map(candle => ({
      time: candle.time,
      value: candle.volume,
      color: candle.close >= candle.open
        ? alpha(theme.palette.success.main, 0.5)
        : alpha(theme.palette.error.main, 0.5),
    }));

    // Set data
    candlestickSeries.setData(formattedCandleData);
    volumeSeries.setData(formattedVolumeData);

    // Fit content
    chart.timeScale().fitContent();

    // Save chart reference
    chartRef.current = chart;

    // Handle resize
    const handleResize = () => {
      if (chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [selectedAsset, candleData, theme]);

  // Container variants for animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
  };

  // Item variants for animations
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <Box sx={{ pb: 4 }}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h4"
              sx={{
                fontFamily: 'Orbitron, sans-serif',
                fontWeight: 700,
                mb: 1,
              }}
              className="glow-text"
            >
              Assets
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{
                fontFamily: 'Rajdhani, sans-serif',
                color: theme.palette.text.secondary,
              }}
            >
              Analyze assets with advanced technical indicators and opportunity scoring
            </Typography>
          </Box>
        </motion.div>

        {/* Filters */}
        <motion.div variants={itemVariants}>
          <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <TextField
              size="small"
              placeholder="Search assets..."
              value={searchTerm}
              onChange={handleSearch}
              sx={{ flexGrow: 1, minWidth: 200 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={filterCategory}
                onChange={handleFilterChange}
                label="Category"
              >
                <MenuItem value="">All Categories</MenuItem>
                {getUniqueCategories().map((category) => (
                  <MenuItem key={category} value={category}>{category}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                onChange={handleSortChange}
                label="Sort By"
              >
                <MenuItem value="opportunity">Opportunity Score</MenuItem>
                <MenuItem value="volume">Volume</MenuItem>
                <MenuItem value="price">Price</MenuItem>
                <MenuItem value="change">24h Change</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </motion.div>

        {/* Asset Grid */}
        <motion.div variants={itemVariants}>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {getFilteredAssets().map((asset) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={asset.id}>
                <AssetCard
                  asset={asset}
                  onClick={() => handleAssetSelect(asset)}
                  isSelected={selectedAsset && selectedAsset.id === asset.id}
                />
              </Grid>
            ))}
            {getFilteredAssets().length === 0 && (
              <Grid item xs={12}>
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                    No assets found matching your filters.
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </motion.div>

        {/* Selected Asset Analysis */}
        {selectedAsset && (
          <motion.div variants={itemVariants}>
            <Card
              sx={{
                mb: 3,
                background: 'rgba(17, 24, 39, 0.7)',
                backdropFilter: 'blur(10px)',
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              }}
              className="futuristic-border"
            >
              <CardHeader
                title={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600 }}>
                      {selectedAsset.symbol} - {selectedAsset.name}
                    </Typography>
                    <Chip
                      label={`${selectedAsset.priceChange24h >= 0 ? '+' : ''}${formatPercentage(selectedAsset.priceChange24h)}`}
                      color={selectedAsset.priceChange24h >= 0 ? 'success' : 'error'}
                      size="small"
                      icon={selectedAsset.priceChange24h >= 0 ? <TrendingUp fontSize="small" /> : <TrendingDown fontSize="small" />}
                      sx={{ ml: 2 }}
                    />
                  </Box>
                }
                subheader={`Current Price: ${formatCurrency(selectedAsset.price)} • Volume: ${formatCurrency(selectedAsset.volume)}`}
                action={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Tabs
                      value={timeframe}
                      onChange={handleTimeframeChange}
                      textColor="primary"
                      indicatorColor="primary"
                      sx={{ mr: 2 }}
                    >
                      <Tab value="5m" label="5m" />
                      <Tab value="15m" label="15m" />
                      <Tab value="1h" label="1h" />
                      <Tab value="4h" label="4h" />
                      <Tab value="1d" label="1D" />
                    </Tabs>
                    <Tooltip title="Refresh">
                      <IconButton onClick={() => handleAssetSelect(selectedAsset)}>
                        <Refresh />
                      </IconButton>
                    </Tooltip>
                    <Button
                      size="small"
                      endIcon={<ArrowForward />}
                      onClick={() => navigate(`/assets/${selectedAsset.symbol}`)}
                      sx={{ ml: 1 }}
                    >
                      Details
                    </Button>
                  </Box>
                }
                sx={{
                  flexDirection: { xs: 'column', md: 'row' },
                  alignItems: { xs: 'flex-start', md: 'center' },
                  '& .MuiCardHeader-action': {
                    mt: { xs: 2, md: 0 },
                  },
                }}
              />
              <Divider sx={{ opacity: 0.2 }} />
              <CardContent sx={{ p: 0 }}>
                <Grid container>
                  {/* Chart */}
                  <Grid item xs={12} md={8}>
                    <Box sx={{ p: 2, height: 400 }}>
                      {isLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                          <LoadingIndicator />
                        </Box>
                      ) : (
                        <Box
                          ref={chartContainerRef}
                          sx={{
                            width: '100%',
                            height: '100%',
                          }}
                        />
                      )}
                    </Box>
                  </Grid>

                  {/* Technical Indicators */}
                  <Grid item xs={12} md={4}>
                    <Box sx={{ p: 2 }}>
                      <Typography variant="h6" sx={{ mb: 2, fontFamily: 'Rajdhani, sans-serif', fontWeight: 600 }}>
                        Technical Indicators
                      </Typography>
                      <Grid container spacing={2}>
                        {/* RSI */}
                        <Grid item xs={12}>
                          <Card sx={{ background: alpha(theme.palette.background.paper, 0.1) }}>
                            <CardHeader
                              title="Relative Strength Index (RSI)"
                              titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
                              action={
                                <Tooltip title={`Value: ${indicators.rsi.value.toFixed(2)}`}>
                                  <Chip
                                    label={indicators.rsi.value.toFixed(2)}
                                    color={indicators.rsi.value > 70 ? 'error' : indicators.rsi.value < 30 ? 'success' : 'primary'}
                                    size="small"
                                  />
                                </Tooltip>
                              }
                            />
                            <CardContent>
                              <Box sx={{ height: 100 }}>
                                <ResponsivePie
                                  data={indicators.rsi.data}
                                  margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                                  innerRadius={0.6}
                                  padAngle={0.5}
                                  cornerRadius={3}
                                  activeOuterRadiusOffset={8}
                                  colors={{ scheme: 'category10' }}
                                  borderWidth={1}
                                  borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                                  enableArcLinkLabels={false}
                                  enableArcLabels={false}
                                  animate={true}
                                  isInteractive={true}
                                  defs={[
                                    {
                                      id: 'dots',
                                      type: 'patternDots',
                                      background: 'inherit',
                                      color: 'rgba(255, 255, 255, 0.3)',
                                      size: 4,
                                      padding: 1,
                                      stagger: true
                                    },
                                    {
                                      id: 'lines',
                                      type: 'patternLines',
                                      background: 'inherit',
                                      color: 'rgba(255, 255, 255, 0.3)',
                                      rotation: -45,
                                      lineWidth: 6,
                                      spacing: 10
                                    }
                                  ]}
                                />
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>

                        {/* MACD */}
                        <Grid item xs={12}>
                          <Card sx={{ background: alpha(theme.palette.background.paper, 0.1) }}>
                            <CardHeader
                              title="MACD"
                              titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
                              action={
                                <Tooltip title={`Value: ${indicators.macd.value.toFixed(2)}`}>
                                  <Chip
                                    label={indicators.macd.value.toFixed(2)}
                                    color={indicators.macd.value > 0 ? 'success' : 'error'}
                                    size="small"
                                  />
                                </Tooltip>
                              }
                            />
                            <CardContent>
                              <Box sx={{ height: 100 }}>
                                <ResponsivePie
                                  data={indicators.macd.data}
                                  margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                                  innerRadius={0.6}
                                  padAngle={0.5}
                                  cornerRadius={3}
                                  activeOuterRadiusOffset={8}
                                  colors={{ scheme: 'category10' }}
                                  borderWidth={1}
                                  borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                                  enableArcLinkLabels={false}
                                  enableArcLabels={false}
                                  animate={true}
                                  isInteractive={true}
                                />
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>

                        {/* Bollinger Bands */}
                        <Grid item xs={12}>
                          <Card sx={{ background: alpha(theme.palette.background.paper, 0.1) }}>
                            <CardHeader
                              title="Bollinger Bands"
                              titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
                              action={
                                <Tooltip title={`Position: ${indicators.bollinger.value.toFixed(2)}%`}>
                                  <Chip
                                    label={`${indicators.bollinger.value.toFixed(2)}%`}
                                    color={
                                      indicators.bollinger.value > 80 ? 'error' :
                                      indicators.bollinger.value < 20 ? 'success' :
                                      'primary'
                                    }
                                    size="small"
                                  />
                                </Tooltip>
                              }
                            />
                            <CardContent>
                              <Box sx={{ height: 100 }}>
                                <ResponsivePie
                                  data={indicators.bollinger.data}
                                  margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                                  innerRadius={0.6}
                                  padAngle={0.5}
                                  cornerRadius={3}
                                  activeOuterRadiusOffset={8}
                                  colors={{ scheme: 'category10' }}
                                  borderWidth={1}
                                  borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                                  enableArcLinkLabels={false}
                                  enableArcLabels={false}
                                  animate={true}
                                  isInteractive={true}
                                />
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      </Grid>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </Box>
  );
};

export default Assets;
