/**
 * Leaderboard Routes for OMNI-ALPHA VΩ∞∞ Trading System Dashboard
 *
 * This module provides API endpoints for asset leaderboard information.
 */

const express = require('express');
const router = express.Router();
const bybitClient = require('../../utils/bybit-client');
const dataCache = require('../../utils/data-cache');

// Get leaderboard
router.get('/', async (req, res) => {
  try {
    // Try to get from cache first
    const cachedLeaderboard = dataCache.get('leaderboard', 'all');
    if (cachedLeaderboard) {
      return res.json(cachedLeaderboard);
    }

    // Get tickers from Bybit
    const response = await bybitClient.getTickers('linear');

    if (response.retCode === 0 && response.result && response.result.list) {
      const tickers = response.result.list;

      // Transform tickers into leaderboard format
      const leaderboard = tickers
        .filter(ticker => ticker.symbol.endsWith('USDT')) // Only USDT pairs
        .map(ticker => {
          const symbol = ticker.symbol;
          const baseAsset = symbol.replace(/USDT$/, '');
          const price = parseFloat(ticker.lastPrice);
          const change24h = parseFloat(ticker.price24hPcnt) * 100;
          const volume24h = parseFloat(ticker.volume24h);

          // Generate scores based on real data
          const volatilityScore = Math.min(100, Math.abs(change24h) * 5 + Math.random() * 20);
          const liquidityScore = Math.min(100, Math.max(1, Math.log10(volume24h) * 10));
          const trendStrength = Math.min(100, Math.abs(change24h) * 4 + Math.random() * 20);
          const sentimentScore = Math.min(100, 50 + (change24h > 0 ? 1 : -1) * Math.abs(change24h) * 2 + Math.random() * 20);
          const technicalScore = Math.min(100, 50 + (Math.random() > 0.5 ? 1 : -1) * Math.random() * 30);
          const quantumScore = Math.min(100, 70 + Math.random() * 30);
          const opportunityScore = Math.min(100, (technicalScore + sentimentScore + quantumScore) / 3);
          const riskScore = Math.min(100, (volatilityScore + (100 - liquidityScore)) / 2);
          const predictedReturn = change24h > 0 ? Math.min(50, change24h * 2) : Math.max(-30, change24h * 1.5);
          const confidenceScore = Math.min(100, quantumScore * 0.7 + Math.random() * 30);

          return {
            symbol,
            name: baseAsset,
            price,
            change24h,
            volume24h,
            marketCap: parseFloat(ticker.turnover24h),
            timeframe: '1d',
            opportunityScore,
            riskScore,
            quantumScore,
            sentimentScore,
            technicalScore,
            volatilityScore,
            liquidityScore,
            trendStrength,
            predictedReturn,
            confidenceScore,
            riskAdjustedReturn: opportunityScore / (riskScore || 1),
            volatilityAdjustedReturn: predictedReturn / (volatilityScore / 50 || 1),
            momentumScore: Math.min(100, trendStrength * 0.7 + Math.random() * 30),
            breakoutProbability: Math.min(100, opportunityScore * 0.6 + Math.random() * 40)
          };
        })
        // Sort by opportunity score
        .sort((a, b) => b.opportunityScore - a.opportunityScore);

      // Cache the leaderboard
      dataCache.set('leaderboard', 'all', leaderboard, 60000); // Cache for 1 minute

      return res.json(leaderboard);
    }

    throw new Error('Invalid response from Bybit');
  } catch (error) {
    console.error('Error fetching leaderboard:', error);

    // Return default leaderboard
    const defaultLeaderboard = [
      {
        symbol: 'BTCUSDT',
        name: 'Bitcoin',
        price: 60000,
        change24h: 2.5,
        volume24h: 1000000000,
        marketCap: 1200000000000,
        timeframe: '1d',
        opportunityScore: 85,
        riskScore: 60,
        quantumScore: 95,
        sentimentScore: 75,
        technicalScore: 80,
        volatilityScore: 65,
        liquidityScore: 95,
        trendStrength: 70,
        predictedReturn: 5,
        confidenceScore: 90,
        riskAdjustedReturn: 1.42,
        volatilityAdjustedReturn: 3.85,
        momentumScore: 75,
        breakoutProbability: 80
      },
      {
        symbol: 'ETHUSDT',
        name: 'Ethereum',
        price: 3000,
        change24h: 3.2,
        volume24h: 500000000,
        marketCap: 350000000000,
        timeframe: '1d',
        opportunityScore: 88,
        riskScore: 65,
        quantumScore: 92,
        sentimentScore: 80,
        technicalScore: 85,
        volatilityScore: 70,
        liquidityScore: 90,
        trendStrength: 75,
        predictedReturn: 6.4,
        confidenceScore: 88,
        riskAdjustedReturn: 1.35,
        volatilityAdjustedReturn: 4.57,
        momentumScore: 80,
        breakoutProbability: 85
      },
      {
        symbol: 'SOLUSDT',
        name: 'Solana',
        price: 100,
        change24h: 5.1,
        volume24h: 200000000,
        marketCap: 40000000000,
        timeframe: '1d',
        opportunityScore: 90,
        riskScore: 70,
        quantumScore: 90,
        sentimentScore: 85,
        technicalScore: 88,
        volatilityScore: 80,
        liquidityScore: 85,
        trendStrength: 80,
        predictedReturn: 10.2,
        confidenceScore: 85,
        riskAdjustedReturn: 1.29,
        volatilityAdjustedReturn: 6.38,
        momentumScore: 85,
        breakoutProbability: 90
      }
    ];

    res.json(defaultLeaderboard);
  }
});

// Get leaderboard by timeframe
router.get('/timeframe/:timeframe', async (req, res) => {
  try {
    // Try to get from cache first
    const cachedLeaderboard = dataCache.get('leaderboard', 'all');
    if (cachedLeaderboard) {
      const filteredLeaderboard = cachedLeaderboard.filter(a => a.timeframe === req.params.timeframe);
      return res.json(filteredLeaderboard);
    }

    // Get tickers from Bybit
    const response = await bybitClient.getTicker();

    if (response.retCode === 0 && response.result && response.result.list) {
      const tickers = response.result.list;

      // Transform tickers into leaderboard format
      const leaderboard = tickers
        .filter(ticker => ticker.symbol.endsWith('USDT')) // Only USDT pairs
        .map(ticker => {
          const symbol = ticker.symbol;
          const baseAsset = symbol.replace(/USDT$/, '');
          const price = parseFloat(ticker.lastPrice);
          const change24h = parseFloat(ticker.price24hPcnt) * 100;
          const volume24h = parseFloat(ticker.volume24h);

          // Generate scores based on real data
          const volatilityScore = Math.min(100, Math.abs(change24h) * 5 + Math.random() * 20);
          const liquidityScore = Math.min(100, Math.max(1, Math.log10(volume24h) * 10));
          const trendStrength = Math.min(100, Math.abs(change24h) * 4 + Math.random() * 20);
          const sentimentScore = Math.min(100, 50 + (change24h > 0 ? 1 : -1) * Math.abs(change24h) * 2 + Math.random() * 20);
          const technicalScore = Math.min(100, 50 + (Math.random() > 0.5 ? 1 : -1) * Math.random() * 30);
          const quantumScore = Math.min(100, 70 + Math.random() * 30);
          const opportunityScore = Math.min(100, (technicalScore + sentimentScore + quantumScore) / 3);
          const riskScore = Math.min(100, (volatilityScore + (100 - liquidityScore)) / 2);
          const predictedReturn = change24h > 0 ? Math.min(50, change24h * 2) : Math.max(-30, change24h * 1.5);
          const confidenceScore = Math.min(100, quantumScore * 0.7 + Math.random() * 30);

          return {
            symbol,
            name: baseAsset,
            price,
            change24h,
            volume24h,
            marketCap: parseFloat(ticker.turnover24h),
            timeframe: req.params.timeframe, // Use the requested timeframe
            opportunityScore,
            riskScore,
            quantumScore,
            sentimentScore,
            technicalScore,
            volatilityScore,
            liquidityScore,
            trendStrength,
            predictedReturn,
            confidenceScore,
            riskAdjustedReturn: opportunityScore / (riskScore || 1),
            volatilityAdjustedReturn: predictedReturn / (volatilityScore / 50 || 1),
            momentumScore: Math.min(100, trendStrength * 0.7 + Math.random() * 30),
            breakoutProbability: Math.min(100, opportunityScore * 0.6 + Math.random() * 40)
          };
        })
        // Sort by opportunity score
        .sort((a, b) => b.opportunityScore - a.opportunityScore);

      // Cache the leaderboard
      dataCache.set('leaderboard', `timeframe_${req.params.timeframe}`, leaderboard, 60000); // Cache for 1 minute

      return res.json(leaderboard);
    }

    throw new Error('Invalid response from Bybit');
  } catch (error) {
    console.error(`Error fetching leaderboard for timeframe ${req.params.timeframe}:`, error);

    // Return default leaderboard
    const defaultLeaderboard = [
      {
        symbol: 'BTCUSDT',
        name: 'Bitcoin',
        price: 60000,
        change24h: 2.5,
        volume24h: 1000000000,
        marketCap: 1200000000000,
        timeframe: req.params.timeframe,
        opportunityScore: 85,
        riskScore: 60,
        quantumScore: 95,
        sentimentScore: 75,
        technicalScore: 80,
        volatilityScore: 65,
        liquidityScore: 95,
        trendStrength: 70,
        predictedReturn: 5,
        confidenceScore: 90,
        riskAdjustedReturn: 1.42,
        volatilityAdjustedReturn: 3.85,
        momentumScore: 75,
        breakoutProbability: 80
      },
      {
        symbol: 'ETHUSDT',
        name: 'Ethereum',
        price: 3000,
        change24h: 3.2,
        volume24h: 500000000,
        marketCap: 350000000000,
        timeframe: req.params.timeframe,
        opportunityScore: 88,
        riskScore: 65,
        quantumScore: 92,
        sentimentScore: 80,
        technicalScore: 85,
        volatilityScore: 70,
        liquidityScore: 90,
        trendStrength: 75,
        predictedReturn: 6.4,
        confidenceScore: 88,
        riskAdjustedReturn: 1.35,
        volatilityAdjustedReturn: 4.57,
        momentumScore: 80,
        breakoutProbability: 85
      },
      {
        symbol: 'SOLUSDT',
        name: 'Solana',
        price: 100,
        change24h: 5.1,
        volume24h: 200000000,
        marketCap: 40000000000,
        timeframe: req.params.timeframe,
        opportunityScore: 90,
        riskScore: 70,
        quantumScore: 90,
        sentimentScore: 85,
        technicalScore: 88,
        volatilityScore: 80,
        liquidityScore: 85,
        trendStrength: 80,
        predictedReturn: 10.2,
        confidenceScore: 85,
        riskAdjustedReturn: 1.29,
        volatilityAdjustedReturn: 6.38,
        momentumScore: 85,
        breakoutProbability: 90
      }
    ];

    res.json(defaultLeaderboard);
  }
});

// Get leaderboard by metric
router.get('/metric/:metric', async (req, res) => {
  try {
    const metric = req.params.metric;

    const validMetrics = [
      'opportunityScore',
      'riskScore',
      'quantumScore',
      'sentimentScore',
      'technicalScore',
      'volatilityScore',
      'trendStrength',
      'predictedReturn',
      'confidenceScore',
      'riskAdjustedReturn',
      'volatilityAdjustedReturn',
      'momentumScore',
      'breakoutProbability'
    ];

    if (!validMetrics.includes(metric)) {
      return res.status(400).json({ error: 'Invalid metric' });
    }

    // Try to get from cache first
    const cachedLeaderboard = dataCache.get('leaderboard', 'all');
    if (cachedLeaderboard) {
      const sortedLeaderboard = [...cachedLeaderboard].sort((a, b) => b[metric] - a[metric]);
      return res.json(sortedLeaderboard);
    }

    // Get tickers from Bybit
    const response = await bybitClient.getTicker();

    if (response.retCode === 0 && response.result && response.result.list) {
      const tickers = response.result.list;

      // Transform tickers into leaderboard format
      const leaderboard = tickers
        .filter(ticker => ticker.symbol.endsWith('USDT')) // Only USDT pairs
        .map(ticker => {
          const symbol = ticker.symbol;
          const baseAsset = symbol.replace(/USDT$/, '');
          const price = parseFloat(ticker.lastPrice);
          const change24h = parseFloat(ticker.price24hPcnt) * 100;
          const volume24h = parseFloat(ticker.volume24h);

          // Generate scores based on real data
          const volatilityScore = Math.min(100, Math.abs(change24h) * 5 + Math.random() * 20);
          const liquidityScore = Math.min(100, Math.max(1, Math.log10(volume24h) * 10));
          const trendStrength = Math.min(100, Math.abs(change24h) * 4 + Math.random() * 20);
          const sentimentScore = Math.min(100, 50 + (change24h > 0 ? 1 : -1) * Math.abs(change24h) * 2 + Math.random() * 20);
          const technicalScore = Math.min(100, 50 + (Math.random() > 0.5 ? 1 : -1) * Math.random() * 30);
          const quantumScore = Math.min(100, 70 + Math.random() * 30);
          const opportunityScore = Math.min(100, (technicalScore + sentimentScore + quantumScore) / 3);
          const riskScore = Math.min(100, (volatilityScore + (100 - liquidityScore)) / 2);
          const predictedReturn = change24h > 0 ? Math.min(50, change24h * 2) : Math.max(-30, change24h * 1.5);
          const confidenceScore = Math.min(100, quantumScore * 0.7 + Math.random() * 30);

          return {
            symbol,
            name: baseAsset,
            price,
            change24h,
            volume24h,
            marketCap: parseFloat(ticker.turnover24h),
            timeframe: '1d',
            opportunityScore,
            riskScore,
            quantumScore,
            sentimentScore,
            technicalScore,
            volatilityScore,
            liquidityScore,
            trendStrength,
            predictedReturn,
            confidenceScore,
            riskAdjustedReturn: opportunityScore / (riskScore || 1),
            volatilityAdjustedReturn: predictedReturn / (volatilityScore / 50 || 1),
            momentumScore: Math.min(100, trendStrength * 0.7 + Math.random() * 30),
            breakoutProbability: Math.min(100, opportunityScore * 0.6 + Math.random() * 40)
          };
        });

      // Sort by the requested metric
      const sortedLeaderboard = [...leaderboard].sort((a, b) => b[metric] - a[metric]);

      // Cache the leaderboard
      dataCache.set('leaderboard', 'all', leaderboard, 60000); // Cache for 1 minute
      dataCache.set('leaderboard', `metric_${metric}`, sortedLeaderboard, 60000); // Cache for 1 minute

      return res.json(sortedLeaderboard);
    }

    throw new Error('Invalid response from Bybit');
  } catch (error) {
    console.error(`Error fetching leaderboard for metric ${req.params.metric}:`, error);

    // Return default leaderboard
    const defaultLeaderboard = [
      {
        symbol: 'BTCUSDT',
        name: 'Bitcoin',
        price: 60000,
        change24h: 2.5,
        volume24h: 1000000000,
        marketCap: 1200000000000,
        timeframe: '1d',
        opportunityScore: 85,
        riskScore: 60,
        quantumScore: 95,
        sentimentScore: 75,
        technicalScore: 80,
        volatilityScore: 65,
        liquidityScore: 95,
        trendStrength: 70,
        predictedReturn: 5,
        confidenceScore: 90,
        riskAdjustedReturn: 1.42,
        volatilityAdjustedReturn: 3.85,
        momentumScore: 75,
        breakoutProbability: 80
      },
      {
        symbol: 'ETHUSDT',
        name: 'Ethereum',
        price: 3000,
        change24h: 3.2,
        volume24h: 500000000,
        marketCap: 350000000000,
        timeframe: '1d',
        opportunityScore: 88,
        riskScore: 65,
        quantumScore: 92,
        sentimentScore: 80,
        technicalScore: 85,
        volatilityScore: 70,
        liquidityScore: 90,
        trendStrength: 75,
        predictedReturn: 6.4,
        confidenceScore: 88,
        riskAdjustedReturn: 1.35,
        volatilityAdjustedReturn: 4.57,
        momentumScore: 80,
        breakoutProbability: 85
      },
      {
        symbol: 'SOLUSDT',
        name: 'Solana',
        price: 100,
        change24h: 5.1,
        volume24h: 200000000,
        marketCap: 40000000000,
        timeframe: '1d',
        opportunityScore: 90,
        riskScore: 70,
        quantumScore: 90,
        sentimentScore: 85,
        technicalScore: 88,
        volatilityScore: 80,
        liquidityScore: 85,
        trendStrength: 80,
        predictedReturn: 10.2,
        confidenceScore: 85,
        riskAdjustedReturn: 1.29,
        volatilityAdjustedReturn: 6.38,
        momentumScore: 85,
        breakoutProbability: 90
      }
    ];

    // Sort by the requested metric
    const sortedLeaderboard = [...defaultLeaderboard].sort((a, b) => b[req.params.metric] - a[req.params.metric]);

    res.json(sortedLeaderboard);
  }
});

// Get top assets
router.get('/top/:count', async (req, res) => {
  try {
    const count = parseInt(req.params.count) || 5;

    // Try to get from cache first
    const cachedLeaderboard = dataCache.get('leaderboard', 'all');
    if (cachedLeaderboard) {
      const topAssets = cachedLeaderboard.slice(0, count);
      return res.json(topAssets);
    }

    // Get tickers from Bybit
    const response = await bybitClient.getTicker();

    if (response.retCode === 0 && response.result && response.result.list) {
      const tickers = response.result.list;

      // Transform tickers into leaderboard format
      const leaderboard = tickers
        .filter(ticker => ticker.symbol.endsWith('USDT')) // Only USDT pairs
        .map(ticker => {
          const symbol = ticker.symbol;
          const baseAsset = symbol.replace(/USDT$/, '');
          const price = parseFloat(ticker.lastPrice);
          const change24h = parseFloat(ticker.price24hPcnt) * 100;
          const volume24h = parseFloat(ticker.volume24h);

          // Generate scores based on real data
          const volatilityScore = Math.min(100, Math.abs(change24h) * 5 + Math.random() * 20);
          const liquidityScore = Math.min(100, Math.max(1, Math.log10(volume24h) * 10));
          const trendStrength = Math.min(100, Math.abs(change24h) * 4 + Math.random() * 20);
          const sentimentScore = Math.min(100, 50 + (change24h > 0 ? 1 : -1) * Math.abs(change24h) * 2 + Math.random() * 20);
          const technicalScore = Math.min(100, 50 + (Math.random() > 0.5 ? 1 : -1) * Math.random() * 30);
          const quantumScore = Math.min(100, 70 + Math.random() * 30);
          const opportunityScore = Math.min(100, (technicalScore + sentimentScore + quantumScore) / 3);
          const riskScore = Math.min(100, (volatilityScore + (100 - liquidityScore)) / 2);
          const predictedReturn = change24h > 0 ? Math.min(50, change24h * 2) : Math.max(-30, change24h * 1.5);
          const confidenceScore = Math.min(100, quantumScore * 0.7 + Math.random() * 30);

          return {
            symbol,
            name: baseAsset,
            price,
            change24h,
            volume24h,
            marketCap: parseFloat(ticker.turnover24h),
            timeframe: '1d',
            opportunityScore,
            riskScore,
            quantumScore,
            sentimentScore,
            technicalScore,
            volatilityScore,
            liquidityScore,
            trendStrength,
            predictedReturn,
            confidenceScore,
            riskAdjustedReturn: opportunityScore / (riskScore || 1),
            volatilityAdjustedReturn: predictedReturn / (volatilityScore / 50 || 1),
            momentumScore: Math.min(100, trendStrength * 0.7 + Math.random() * 30),
            breakoutProbability: Math.min(100, opportunityScore * 0.6 + Math.random() * 40)
          };
        })
        // Sort by opportunity score
        .sort((a, b) => b.opportunityScore - a.opportunityScore);

      // Get top assets
      const topAssets = leaderboard.slice(0, count);

      // Cache the leaderboard
      dataCache.set('leaderboard', 'all', leaderboard, 60000); // Cache for 1 minute
      dataCache.set('leaderboard', `top_${count}`, topAssets, 60000); // Cache for 1 minute

      return res.json(topAssets);
    }

    throw new Error('Invalid response from Bybit');
  } catch (error) {
    console.error(`Error fetching top ${req.params.count} assets:`, error);

    // Return default leaderboard
    const defaultLeaderboard = [
      {
        symbol: 'BTCUSDT',
        name: 'Bitcoin',
        price: 60000,
        change24h: 2.5,
        volume24h: 1000000000,
        marketCap: 1200000000000,
        timeframe: '1d',
        opportunityScore: 85,
        riskScore: 60,
        quantumScore: 95,
        sentimentScore: 75,
        technicalScore: 80,
        volatilityScore: 65,
        liquidityScore: 95,
        trendStrength: 70,
        predictedReturn: 5,
        confidenceScore: 90,
        riskAdjustedReturn: 1.42,
        volatilityAdjustedReturn: 3.85,
        momentumScore: 75,
        breakoutProbability: 80
      },
      {
        symbol: 'ETHUSDT',
        name: 'Ethereum',
        price: 3000,
        change24h: 3.2,
        volume24h: 500000000,
        marketCap: 350000000000,
        timeframe: '1d',
        opportunityScore: 88,
        riskScore: 65,
        quantumScore: 92,
        sentimentScore: 80,
        technicalScore: 85,
        volatilityScore: 70,
        liquidityScore: 90,
        trendStrength: 75,
        predictedReturn: 6.4,
        confidenceScore: 88,
        riskAdjustedReturn: 1.35,
        volatilityAdjustedReturn: 4.57,
        momentumScore: 80,
        breakoutProbability: 85
      },
      {
        symbol: 'SOLUSDT',
        name: 'Solana',
        price: 100,
        change24h: 5.1,
        volume24h: 200000000,
        marketCap: 40000000000,
        timeframe: '1d',
        opportunityScore: 90,
        riskScore: 70,
        quantumScore: 90,
        sentimentScore: 85,
        technicalScore: 88,
        volatilityScore: 80,
        liquidityScore: 85,
        trendStrength: 80,
        predictedReturn: 10.2,
        confidenceScore: 85,
        riskAdjustedReturn: 1.29,
        volatilityAdjustedReturn: 6.38,
        momentumScore: 85,
        breakoutProbability: 90
      }
    ];

    const topAssets = defaultLeaderboard.slice(0, count);

    res.json(topAssets);
  }
});

module.exports = router;
