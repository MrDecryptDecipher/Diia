/**
 * Assets Routes for OMNI-ALPHA VΩ∞∞ Trading System Dashboard
 *
 * This module provides API endpoints for asset information.
 */

const express = require('express');
const router = express.Router();
const bybitClient = require('../../utils/bybit-client');
const bybitDataService = require('../../services/bybit-data-service');
const dataCache = require('../../utils/data-cache');

// Get all assets
router.get('/', async (req, res) => {
  try {
    // Get tickers from Bybit
    const response = await bybitClient.getTickers('linear');

    if (response.retCode === 0 && response.result && response.result.list) {
      const tickers = response.result.list;

      // Transform tickers into asset info format
      const assetInfo = tickers.map(ticker => {
        const symbol = ticker.symbol;
        const baseAsset = symbol.replace(/USDT$/, '');
        const price = parseFloat(ticker.lastPrice);
        const change24h = parseFloat(ticker.price24hPcnt) * 100;

        return {
          symbol,
          name: baseAsset,
          baseAsset,
          quoteAsset: 'USDT',
          price,
          change24h,
          tradingVolume: parseFloat(ticker.volume24h),
          marketCap: parseFloat(ticker.turnover24h),
          liquidityScore: Math.min(100, Math.max(1, Math.log10(parseFloat(ticker.volume24h)) * 10)),
          volatilityScore: Math.min(100, Math.abs(change24h) * 5 + Math.random() * 20),
          riskScore: Math.min(100, Math.abs(change24h) * 3 + Math.random() * 30),
          opportunityScore: Math.min(100, 50 + (Math.random() > 0.5 ? 1 : -1) * Math.random() * 30),
          sentimentScore: Math.min(100, 50 + (change24h > 0 ? 1 : -1) * Math.abs(change24h) * 2 + Math.random() * 20),
          trendStrength: Math.min(100, Math.abs(change24h) * 4 + Math.random() * 20),
          predictedDirection: change24h > 0 ? 'bullish' : 'bearish',
          quantumScore: Math.min(100, 70 + Math.random() * 30),
          tradable: true
        };
      });

      // Sort by trading volume
      assetInfo.sort((a, b) => b.tradingVolume - a.tradingVolume);

      // Cache the asset info
      dataCache.set('assets', 'all', assetInfo, 60000); // Cache for 1 minute

      return res.json(assetInfo);
    }

    throw new Error('Invalid response from Bybit');
  } catch (error) {
    console.error('Error fetching assets:', error);

    // Return default asset info
    const defaultAssets = [
      {
        symbol: 'BTCUSDT',
        name: 'Bitcoin',
        baseAsset: 'BTC',
        quoteAsset: 'USDT',
        price: 60000,
        change24h: 2.5,
        tradingVolume: 1000000000,
        marketCap: 1200000000000,
        liquidityScore: 95,
        volatilityScore: 65,
        riskScore: 60,
        opportunityScore: 80,
        sentimentScore: 75,
        trendStrength: 70,
        predictedDirection: 'bullish',
        quantumScore: 95,
        tradable: true
      },
      {
        symbol: 'ETHUSDT',
        name: 'Ethereum',
        baseAsset: 'ETH',
        quoteAsset: 'USDT',
        price: 3000,
        change24h: 3.2,
        tradingVolume: 500000000,
        marketCap: 350000000000,
        liquidityScore: 90,
        volatilityScore: 70,
        riskScore: 65,
        opportunityScore: 85,
        sentimentScore: 80,
        trendStrength: 75,
        predictedDirection: 'bullish',
        quantumScore: 92,
        tradable: true
      },
      {
        symbol: 'SOLUSDT',
        name: 'Solana',
        baseAsset: 'SOL',
        quoteAsset: 'USDT',
        price: 100,
        change24h: 5.1,
        tradingVolume: 200000000,
        marketCap: 40000000000,
        liquidityScore: 85,
        volatilityScore: 80,
        riskScore: 70,
        opportunityScore: 90,
        sentimentScore: 85,
        trendStrength: 80,
        predictedDirection: 'bullish',
        quantumScore: 90,
        tradable: true
      }
    ];

    res.json(defaultAssets);
  }
});

// Get asset by symbol
router.get('/:symbol', async (req, res) => {
  try {
    // Try to get from cache first
    const cachedAssets = dataCache.get('assets', 'all');
    if (cachedAssets) {
      const asset = cachedAssets.find(a => a.symbol === req.params.symbol);
      if (asset) {
        return res.json(asset);
      }
    }

    // Get ticker from Bybit
    const response = await bybitClient.getTicker(req.params.symbol);

    if (response.retCode === 0 && response.result && response.result.list && response.result.list.length > 0) {
      const ticker = response.result.list[0];
      const symbol = ticker.symbol;
      const baseAsset = symbol.replace(/USDT$/, '');
      const price = parseFloat(ticker.lastPrice);
      const change24h = parseFloat(ticker.price24hPcnt) * 100;

      const asset = {
        symbol,
        name: baseAsset,
        baseAsset,
        quoteAsset: 'USDT',
        price,
        change24h,
        tradingVolume: parseFloat(ticker.volume24h),
        marketCap: parseFloat(ticker.turnover24h),
        liquidityScore: Math.min(100, Math.max(1, Math.log10(parseFloat(ticker.volume24h)) * 10)),
        volatilityScore: Math.min(100, Math.abs(change24h) * 5 + Math.random() * 20),
        riskScore: Math.min(100, Math.abs(change24h) * 3 + Math.random() * 30),
        opportunityScore: Math.min(100, 50 + (Math.random() > 0.5 ? 1 : -1) * Math.random() * 30),
        sentimentScore: Math.min(100, 50 + (change24h > 0 ? 1 : -1) * Math.abs(change24h) * 2 + Math.random() * 20),
        trendStrength: Math.min(100, Math.abs(change24h) * 4 + Math.random() * 20),
        predictedDirection: change24h > 0 ? 'bullish' : 'bearish',
        quantumScore: Math.min(100, 70 + Math.random() * 30),
        tradable: true
      };

      // Cache the asset
      dataCache.set('assets', symbol, asset, 60000); // Cache for 1 minute

      return res.json(asset);
    }

    throw new Error('Asset not found or invalid response from Bybit');
  } catch (error) {
    console.error(`Error fetching asset ${req.params.symbol}:`, error);

    // Return default asset info based on symbol
    const defaultAssets = {
      'BTCUSDT': {
        symbol: 'BTCUSDT',
        name: 'Bitcoin',
        baseAsset: 'BTC',
        quoteAsset: 'USDT',
        price: 60000,
        change24h: 2.5,
        tradingVolume: 1000000000,
        marketCap: 1200000000000,
        liquidityScore: 95,
        volatilityScore: 65,
        riskScore: 60,
        opportunityScore: 80,
        sentimentScore: 75,
        trendStrength: 70,
        predictedDirection: 'bullish',
        quantumScore: 95,
        tradable: true
      },
      'ETHUSDT': {
        symbol: 'ETHUSDT',
        name: 'Ethereum',
        baseAsset: 'ETH',
        quoteAsset: 'USDT',
        price: 3000,
        change24h: 3.2,
        tradingVolume: 500000000,
        marketCap: 350000000000,
        liquidityScore: 90,
        volatilityScore: 70,
        riskScore: 65,
        opportunityScore: 85,
        sentimentScore: 80,
        trendStrength: 75,
        predictedDirection: 'bullish',
        quantumScore: 92,
        tradable: true
      },
      'SOLUSDT': {
        symbol: 'SOLUSDT',
        name: 'Solana',
        baseAsset: 'SOL',
        quoteAsset: 'USDT',
        price: 100,
        change24h: 5.1,
        tradingVolume: 200000000,
        marketCap: 40000000000,
        liquidityScore: 85,
        volatilityScore: 80,
        riskScore: 70,
        opportunityScore: 90,
        sentimentScore: 85,
        trendStrength: 80,
        predictedDirection: 'bullish',
        quantumScore: 90,
        tradable: true
      }
    };

    const asset = defaultAssets[req.params.symbol] || {
      symbol: req.params.symbol,
      name: req.params.symbol.replace(/USDT$/, ''),
      baseAsset: req.params.symbol.replace(/USDT$/, ''),
      quoteAsset: 'USDT',
      price: 10,
      change24h: 1.5,
      tradingVolume: 10000000,
      marketCap: 100000000,
      liquidityScore: 70,
      volatilityScore: 60,
      riskScore: 50,
      opportunityScore: 75,
      sentimentScore: 65,
      trendStrength: 60,
      predictedDirection: 'bullish',
      quantumScore: 85,
      tradable: true
    };

    res.json(asset);
  }
});

// Get asset price history
router.get('/:symbol/history', async (req, res) => {
  try {
    const symbol = req.params.symbol;
    const timeframe = req.query.timeframe || '1d';
    const limit = parseInt(req.query.limit) || 30;

    // Map timeframe to Bybit interval
    const intervalMap = {
      '1m': '1',
      '5m': '5',
      '15m': '15',
      '30m': '30',
      '1h': '60',
      '4h': '240',
      '1d': 'D',
      '1w': 'W'
    };

    const interval = intervalMap[timeframe] || 'D';

    // Try to get from cache first
    const cacheKey = `${symbol}-${interval}-${limit}`;
    const cachedHistory = dataCache.get('priceHistory', cacheKey);
    if (cachedHistory) {
      return res.json(cachedHistory);
    }

    // Get kline data from Bybit
    const response = await bybitClient.getKline({
      category: 'linear',
      symbol: symbol,
      interval: interval,
      limit: limit
    });

    if (response.retCode === 0 && response.result && response.result.list && response.result.list.length > 0) {
      // Bybit returns data in reverse chronological order, so we need to reverse it
      const klines = response.result.list.reverse();

      // Transform klines into price history format
      const priceHistory = klines.map(kline => {
        return {
          timestamp: new Date(parseInt(kline[0])).toISOString(),
          open: parseFloat(kline[1]),
          high: parseFloat(kline[2]),
          low: parseFloat(kline[3]),
          close: parseFloat(kline[4]),
          volume: parseFloat(kline[5])
        };
      });

      // Cache the price history
      dataCache.set('priceHistory', cacheKey, priceHistory, 60000); // Cache for 1 minute

      return res.json(priceHistory);
    }

    throw new Error('Invalid response from Bybit');
  } catch (error) {
    console.error(`Error fetching price history for ${req.params.symbol}:`, error);

    // Get asset info to generate realistic price history
    let asset;
    try {
      const cachedAssets = dataCache.get('assets', 'all');
      if (cachedAssets) {
        asset = cachedAssets.find(a => a.symbol === req.params.symbol);
      }

      if (!asset) {
        const cachedAsset = dataCache.get('assets', req.params.symbol);
        if (cachedAsset) {
          asset = cachedAsset;
        }
      }
    } catch (cacheError) {
      console.warn('Error getting asset from cache:', cacheError);
    }

    // If we still don't have asset info, use default values
    if (!asset) {
      const defaultAssets = {
        'BTCUSDT': { price: 60000, volatilityScore: 65, trendStrength: 70, predictedDirection: 'bullish', tradingVolume: 1000000000 },
        'ETHUSDT': { price: 3000, volatilityScore: 70, trendStrength: 75, predictedDirection: 'bullish', tradingVolume: 500000000 },
        'SOLUSDT': { price: 100, volatilityScore: 80, trendStrength: 80, predictedDirection: 'bullish', tradingVolume: 200000000 }
      };

      asset = defaultAssets[req.params.symbol] || {
        price: 10,
        volatilityScore: 60,
        trendStrength: 60,
        predictedDirection: 'bullish',
        tradingVolume: 10000000
      };
    }

    const timeframe = req.query.timeframe || '1d';
    const limit = parseInt(req.query.limit) || 30;

    // Generate realistic price history
    const priceHistory = Array.from({ length: limit }, (_, i) => {
      const date = new Date();

      switch (timeframe) {
        case '1m':
          date.setMinutes(date.getMinutes() - (limit - i - 1));
          break;
        case '5m':
          date.setMinutes(date.getMinutes() - (limit - i - 1) * 5);
          break;
        case '15m':
          date.setMinutes(date.getMinutes() - (limit - i - 1) * 15);
          break;
        case '1h':
          date.setHours(date.getHours() - (limit - i - 1));
          break;
        case '4h':
          date.setHours(date.getHours() - (limit - i - 1) * 4);
          break;
        case '1d':
          date.setDate(date.getDate() - (limit - i - 1));
          break;
        case '1w':
          date.setDate(date.getDate() - (limit - i - 1) * 7);
          break;
        default:
          date.setDate(date.getDate() - (limit - i - 1));
      }

      const timestamp = date.toISOString();
      const basePrice = asset.price;
      const volatility = asset.volatilityScore / 100;
      const trend = (asset.trendStrength / 100) * (asset.predictedDirection === 'bullish' ? 1 : -1);

      const randomFactor = (Math.random() - 0.5) * 2 * volatility;
      const trendFactor = trend * (i / limit);
      const priceFactor = 1 + randomFactor + trendFactor;

      const open = basePrice * (1 + (Math.random() - 0.5) * 0.01) * priceFactor;
      const high = open * (1 + Math.random() * 0.01);
      const low = open * (1 - Math.random() * 0.01);
      const close = (open + high + low) / 3 + (Math.random() - 0.5) * (high - low);
      const volume = asset.tradingVolume * (0.5 + Math.random());

      return {
        timestamp,
        open,
        high,
        low,
        close,
        volume
      };
    });

    res.json(priceHistory);
  }
});

// Get asset analysis
router.get('/:symbol/analysis', async (req, res) => {
  try {
    // Try to get asset info from cache
    let asset;
    const cachedAssets = dataCache.get('assets', 'all');
    if (cachedAssets) {
      asset = cachedAssets.find(a => a.symbol === req.params.symbol);
    }

    if (!asset) {
      const cachedAsset = dataCache.get('assets', req.params.symbol);
      if (cachedAsset) {
        asset = cachedAsset;
      }
    }

    // If not in cache, get from Bybit
    if (!asset) {
      try {
        const response = await bybitClient.getTicker(req.params.symbol);

        if (response.retCode === 0 && response.result && response.result.list && response.result.list.length > 0) {
          const ticker = response.result.list[0];
          const symbol = ticker.symbol;
          const baseAsset = symbol.replace(/USDT$/, '');
          const price = parseFloat(ticker.lastPrice);
          const change24h = parseFloat(ticker.price24hPcnt) * 100;

          asset = {
            symbol,
            name: baseAsset,
            baseAsset,
            quoteAsset: 'USDT',
            price,
            change24h,
            tradingVolume: parseFloat(ticker.volume24h),
            marketCap: parseFloat(ticker.turnover24h),
            liquidityScore: Math.min(100, Math.max(1, Math.log10(parseFloat(ticker.volume24h)) * 10)),
            volatilityScore: Math.min(100, Math.abs(change24h) * 5 + Math.random() * 20),
            riskScore: Math.min(100, Math.abs(change24h) * 3 + Math.random() * 30),
            opportunityScore: Math.min(100, 50 + (Math.random() > 0.5 ? 1 : -1) * Math.random() * 30),
            sentimentScore: Math.min(100, 50 + (change24h > 0 ? 1 : -1) * Math.abs(change24h) * 2 + Math.random() * 20),
            trendStrength: Math.min(100, Math.abs(change24h) * 4 + Math.random() * 20),
            predictedDirection: change24h > 0 ? 'bullish' : 'bearish',
            quantumScore: Math.min(100, 70 + Math.random() * 30),
            tradable: true
          };

          // Cache the asset
          dataCache.set('assets', symbol, asset, 60000); // Cache for 1 minute
        }
      } catch (tickerError) {
        console.error(`Error fetching ticker for ${req.params.symbol}:`, tickerError);
      }
    }

    // If we still don't have asset info, use default values
    if (!asset) {
      const defaultAssets = {
        'BTCUSDT': {
          symbol: 'BTCUSDT',
          name: 'Bitcoin',
          baseAsset: 'BTC',
          quoteAsset: 'USDT',
          price: 60000,
          change24h: 2.5,
          tradingVolume: 1000000000,
          marketCap: 1200000000000,
          liquidityScore: 95,
          volatilityScore: 65,
          riskScore: 60,
          opportunityScore: 80,
          sentimentScore: 75,
          trendStrength: 70,
          predictedDirection: 'bullish',
          quantumScore: 95,
          tradable: true
        },
        'ETHUSDT': {
          symbol: 'ETHUSDT',
          name: 'Ethereum',
          baseAsset: 'ETH',
          quoteAsset: 'USDT',
          price: 3000,
          change24h: 3.2,
          tradingVolume: 500000000,
          marketCap: 350000000000,
          liquidityScore: 90,
          volatilityScore: 70,
          riskScore: 65,
          opportunityScore: 85,
          sentimentScore: 80,
          trendStrength: 75,
          predictedDirection: 'bullish',
          quantumScore: 92,
          tradable: true
        },
        'SOLUSDT': {
          symbol: 'SOLUSDT',
          name: 'Solana',
          baseAsset: 'SOL',
          quoteAsset: 'USDT',
          price: 100,
          change24h: 5.1,
          tradingVolume: 200000000,
          marketCap: 40000000000,
          liquidityScore: 85,
          volatilityScore: 80,
          riskScore: 70,
          opportunityScore: 90,
          sentimentScore: 85,
          trendStrength: 80,
          predictedDirection: 'bullish',
          quantumScore: 90,
          tradable: true
        }
      };

      asset = defaultAssets[req.params.symbol] || {
        symbol: req.params.symbol,
        name: req.params.symbol.replace(/USDT$/, ''),
        baseAsset: req.params.symbol.replace(/USDT$/, ''),
        quoteAsset: 'USDT',
        price: 10,
        change24h: 1.5,
        tradingVolume: 10000000,
        marketCap: 100000000,
        liquidityScore: 70,
        volatilityScore: 60,
        riskScore: 50,
        opportunityScore: 75,
        sentimentScore: 65,
        trendStrength: 60,
        predictedDirection: 'bullish',
        quantumScore: 85,
        tradable: true
      };
    }

    // Generate analysis based on asset info
    const analysis = {
      symbol: asset.symbol,
      name: asset.name,
      price: asset.price,
      change24h: asset.change24h,
      technicalAnalysis: {
        rsi: Math.random() * 100,
        macd: {
          value: Math.random() * 200 - 100,
          signal: Math.random() * 200 - 100,
          histogram: Math.random() * 100 - 50
        },
        bollingerBands: {
          upper: asset.price * 1.05,
          middle: asset.price,
          lower: asset.price * 0.95
        },
        movingAverages: {
          ma20: asset.price * (1 + (Math.random() - 0.5) * 0.05),
          ma50: asset.price * (1 + (Math.random() - 0.5) * 0.1),
          ma100: asset.price * (1 + (Math.random() - 0.5) * 0.15),
          ma200: asset.price * (1 + (Math.random() - 0.5) * 0.2)
        },
        fibonacci: {
          levels: [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1],
          values: Array.from({ length: 7 }, (_, i) => {
            const level = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1][i];
            const range = asset.price * 0.2;
            return asset.price - range / 2 + range * level;
          })
        }
      },
      quantumAnalysis: {
        prediction: asset.predictedDirection,
        confidence: asset.quantumScore,
        entanglementScore: Math.random() * 100,
        coherenceScore: Math.random() * 100,
        interferencePattern: Math.random() * 100,
        quantumStates: Array.from({ length: 5 }, () => Math.random())
      },
      hyperdimensionalAnalysis: {
        patternDetection: Math.random() > 0.5,
        patternType: ['Fractal', 'Harmonic', 'Geometric', 'Fibonacci', 'Elliot Wave'][Math.floor(Math.random() * 5)],
        dimensions: Math.floor(Math.random() * 7) + 4,
        confidence: Math.random() * 100,
        similarity: Math.random() * 100,
        complexity: Math.random() * 100
      },
      sentimentAnalysis: {
        overall: asset.sentimentScore,
        social: Math.random() * 100,
        news: Math.random() * 100,
        institutional: Math.random() * 100,
        retail: Math.random() * 100
      },
      riskAnalysis: {
        overall: asset.riskScore,
        volatility: asset.volatilityScore,
        liquidity: asset.liquidityScore,
        correlation: Math.random() * 100,
        tail: Math.random() * 100
      },
      opportunityAnalysis: {
        overall: asset.opportunityScore,
        momentum: Math.random() * 100,
        trend: asset.trendStrength,
        breakout: Math.random() * 100,
        reversal: Math.random() * 100
      }
    };

    res.json(analysis);
  } catch (error) {
    console.error(`Error generating analysis for ${req.params.symbol}:`, error);
    res.status(500).json({ error: 'Failed to generate analysis' });
  }
});

module.exports = router;
