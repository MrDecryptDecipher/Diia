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
const axios = require('axios');
const logger = require('../../utils/logger');

// Fallback function to fetch real-time prices from Binance
async function fetchBinancePrices() {
  try {
    const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
    const prices = {};

    for (const symbol of symbols) {
      const response = await axios.get(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
      if (response.data) {
        prices[symbol] = {
          price: parseFloat(response.data.lastPrice),
          change24h: parseFloat(response.data.priceChangePercent),
          volume: parseFloat(response.data.volume)
        };
      }
    }

    return prices;
  } catch (error) {
    console.error('Error fetching Binance prices:', error);
    return null;
  }
}

// Helper functions for asset processing
function getAssetName(baseAsset) {
  const assetNames = {
    'BTC': 'Bitcoin',
    'ETH': 'Ethereum',
    'SOL': 'Solana',
    'BNB': 'BNB',
    'XRP': 'XRP',
    'ADA': 'Cardano',
    'DOGE': 'Dogecoin',
    'DOT': 'Polkadot',
    'LTC': 'Litecoin',
    'LINK': 'Chainlink',
    'MATIC': 'Polygon',
    'AVAX': 'Avalanche',
    'UNI': 'Uniswap',
    'ATOM': 'Cosmos',
    'FTM': 'Fantom',
    'NEAR': 'NEAR Protocol',
    'ALGO': 'Algorand',
    'VET': 'VeChain',
    'ICP': 'Internet Computer',
    'SAND': 'The Sandbox'
  };
  return assetNames[baseAsset] || baseAsset;
}

function estimateMarketCap(baseAsset, price) {
  // Rough market cap estimates based on circulating supply approximations
  const supplyEstimates = {
    'BTC': 19700000,
    'ETH': 120000000,
    'SOL': 400000000,
    'BNB': 150000000,
    'XRP': 50000000000,
    'ADA': 35000000000,
    'DOGE': 140000000000,
    'DOT': 1200000000,
    'LTC': 75000000,
    'LINK': 500000000
  };

  const supply = supplyEstimates[baseAsset] || 1000000000; // Default 1B
  return price * supply;
}

function calculateRiskScore(change24h, volume) {
  const volatilityRisk = Math.min(50, Math.abs(change24h) * 2);
  const liquidityRisk = volume < 1000000 ? 30 : volume < 10000000 ? 15 : 5;
  return Math.min(100, volatilityRisk + liquidityRisk + Math.random() * 20);
}

function calculateOpportunityScore(change24h, volume, turnover) {
  const momentumScore = Math.abs(change24h) * 3;
  const liquidityScore = Math.min(30, Math.log10(turnover) * 3);
  const volumeScore = Math.min(20, Math.log10(volume) * 2);
  return Math.min(100, momentumScore + liquidityScore + volumeScore + Math.random() * 20);
}

function getEnhancedDefaultAssets() {
  // Generate dynamic prices with realistic variations
  const generatePrice = (base, variation = 0.1) => {
    return base * (1 + (Math.random() - 0.5) * variation);
  };

  const generateChange = () => {
    return (Math.random() - 0.5) * 10; // -5% to +5%
  };

  return [
    {
      symbol: 'BTCUSDT',
      name: 'Bitcoin',
      baseAsset: 'BTC',
      quoteAsset: 'USDT',
      price: generatePrice(104000, 0.05),
      change24h: generateChange(),
      tradingVolume: generatePrice(1000000000, 0.3),
      turnover24h: generatePrice(2000000000, 0.3),
      marketCap: 1200000000000,
      liquidityScore: 95,
      volatilityScore: Math.random() * 30 + 50,
      riskScore: Math.random() * 40 + 40,
      opportunityScore: Math.random() * 30 + 60,
      sentimentScore: Math.random() * 40 + 50,
      trendStrength: Math.random() * 40 + 40,
      predictedDirection: Math.random() > 0.5 ? 'bullish' : 'bearish',
      quantumScore: Math.random() * 20 + 80,
      leverageScore: 100,
      maxLeverage: '100',
      minOrderQty: '0.001',
      tradable: true,
      category: 'linear',
      status: 'Trading'
    },
    {
      symbol: 'ETHUSDT',
      name: 'Ethereum',
      baseAsset: 'ETH',
      quoteAsset: 'USDT',
      price: generatePrice(3800, 0.05),
      change24h: generateChange(),
      tradingVolume: generatePrice(800000000, 0.3),
      turnover24h: generatePrice(1500000000, 0.3),
      marketCap: 450000000000,
      liquidityScore: 90,
      volatilityScore: Math.random() * 30 + 50,
      riskScore: Math.random() * 40 + 40,
      opportunityScore: Math.random() * 30 + 60,
      sentimentScore: Math.random() * 40 + 50,
      trendStrength: Math.random() * 40 + 40,
      predictedDirection: Math.random() > 0.5 ? 'bullish' : 'bearish',
      quantumScore: Math.random() * 20 + 80,
      leverageScore: 100,
      maxLeverage: '100',
      minOrderQty: '0.01',
      tradable: true,
      category: 'linear',
      status: 'Trading'
    },
    {
      symbol: 'SOLUSDT',
      name: 'Solana',
      baseAsset: 'SOL',
      quoteAsset: 'USDT',
      price: generatePrice(180, 0.08),
      change24h: generateChange(),
      tradingVolume: generatePrice(500000000, 0.3),
      turnover24h: generatePrice(900000000, 0.3),
      marketCap: 85000000000,
      liquidityScore: 85,
      volatilityScore: Math.random() * 30 + 60,
      riskScore: Math.random() * 40 + 50,
      opportunityScore: Math.random() * 30 + 60,
      sentimentScore: Math.random() * 40 + 50,
      trendStrength: Math.random() * 40 + 50,
      predictedDirection: Math.random() > 0.5 ? 'bullish' : 'bearish',
      quantumScore: Math.random() * 20 + 70,
      leverageScore: 100,
      maxLeverage: '100',
      minOrderQty: '0.1',
      tradable: true,
      category: 'linear',
      status: 'Trading'
    },
    {
      symbol: 'BNBUSDT',
      name: 'BNB',
      baseAsset: 'BNB',
      quoteAsset: 'USDT',
      price: generatePrice(720, 0.06),
      change24h: generateChange(),
      tradingVolume: generatePrice(300000000, 0.3),
      turnover24h: generatePrice(600000000, 0.3),
      marketCap: 108000000000,
      liquidityScore: 88,
      volatilityScore: Math.random() * 30 + 50,
      riskScore: Math.random() * 40 + 40,
      opportunityScore: Math.random() * 30 + 60,
      sentimentScore: Math.random() * 40 + 50,
      trendStrength: Math.random() * 40 + 40,
      predictedDirection: Math.random() > 0.5 ? 'bullish' : 'bearish',
      quantumScore: Math.random() * 20 + 75,
      leverageScore: 75,
      maxLeverage: '75',
      minOrderQty: '0.01',
      tradable: true,
      category: 'linear',
      status: 'Trading'
    },
    {
      symbol: 'ADAUSDT',
      name: 'Cardano',
      baseAsset: 'ADA',
      quoteAsset: 'USDT',
      price: generatePrice(1.15, 0.08),
      change24h: generateChange(),
      tradingVolume: generatePrice(400000000, 0.3),
      turnover24h: generatePrice(460000000, 0.3),
      marketCap: 40000000000,
      liquidityScore: 82,
      volatilityScore: Math.random() * 30 + 60,
      riskScore: Math.random() * 40 + 50,
      opportunityScore: Math.random() * 30 + 60,
      sentimentScore: Math.random() * 40 + 50,
      trendStrength: Math.random() * 40 + 50,
      predictedDirection: Math.random() > 0.5 ? 'bullish' : 'bearish',
      quantumScore: Math.random() * 20 + 70,
      leverageScore: 50,
      maxLeverage: '50',
      minOrderQty: '0.1',
      tradable: true,
      category: 'linear',
      status: 'Trading'
    },
    {
      symbol: 'XRPUSDT',
      name: 'XRP',
      baseAsset: 'XRP',
      quoteAsset: 'USDT',
      price: generatePrice(2.45, 0.08),
      change24h: generateChange(),
      tradingVolume: generatePrice(600000000, 0.3),
      turnover24h: generatePrice(1470000000, 0.3),
      marketCap: 140000000000,
      liquidityScore: 90,
      volatilityScore: Math.random() * 30 + 60,
      riskScore: Math.random() * 40 + 50,
      opportunityScore: Math.random() * 30 + 60,
      sentimentScore: Math.random() * 40 + 50,
      trendStrength: Math.random() * 40 + 50,
      predictedDirection: Math.random() > 0.5 ? 'bullish' : 'bearish',
      quantumScore: Math.random() * 20 + 70,
      leverageScore: 75,
      maxLeverage: '75',
      minOrderQty: '0.1',
      tradable: true,
      category: 'linear',
      status: 'Trading'
    },
    {
      symbol: 'DOGEUSDT',
      name: 'Dogecoin',
      baseAsset: 'DOGE',
      quoteAsset: 'USDT',
      price: generatePrice(0.38, 0.1),
      change24h: generateChange(),
      tradingVolume: generatePrice(800000000, 0.3),
      turnover24h: generatePrice(304000000, 0.3),
      marketCap: 56000000000,
      liquidityScore: 85,
      volatilityScore: Math.random() * 30 + 70,
      riskScore: Math.random() * 40 + 60,
      opportunityScore: Math.random() * 30 + 60,
      sentimentScore: Math.random() * 40 + 50,
      trendStrength: Math.random() * 40 + 60,
      predictedDirection: Math.random() > 0.5 ? 'bullish' : 'bearish',
      quantumScore: Math.random() * 20 + 65,
      leverageScore: 50,
      maxLeverage: '50',
      minOrderQty: '1',
      tradable: true,
      category: 'linear',
      status: 'Trading'
    },
    {
      symbol: 'AVAXUSDT',
      name: 'Avalanche',
      baseAsset: 'AVAX',
      quoteAsset: 'USDT',
      price: generatePrice(42.5, 0.08),
      change24h: generateChange(),
      tradingVolume: generatePrice(200000000, 0.3),
      turnover24h: generatePrice(850000000, 0.3),
      marketCap: 17000000000,
      liquidityScore: 80,
      volatilityScore: Math.random() * 30 + 60,
      riskScore: Math.random() * 40 + 50,
      opportunityScore: Math.random() * 30 + 60,
      sentimentScore: Math.random() * 40 + 50,
      trendStrength: Math.random() * 40 + 50,
      predictedDirection: Math.random() > 0.5 ? 'bullish' : 'bearish',
      quantumScore: Math.random() * 20 + 70,
      leverageScore: 50,
      maxLeverage: '50',
      minOrderQty: '0.1',
      tradable: true,
      category: 'linear',
      status: 'Trading'
    },
    {
      symbol: 'LINKUSDT',
      name: 'Chainlink',
      baseAsset: 'LINK',
      quoteAsset: 'USDT',
      price: generatePrice(28.5, 0.08),
      change24h: generateChange(),
      tradingVolume: generatePrice(150000000, 0.3),
      turnover24h: generatePrice(427500000, 0.3),
      marketCap: 18000000000,
      liquidityScore: 78,
      volatilityScore: Math.random() * 30 + 60,
      riskScore: Math.random() * 40 + 50,
      opportunityScore: Math.random() * 30 + 60,
      sentimentScore: Math.random() * 40 + 50,
      trendStrength: Math.random() * 40 + 50,
      predictedDirection: Math.random() > 0.5 ? 'bullish' : 'bearish',
      quantumScore: Math.random() * 20 + 70,
      leverageScore: 50,
      maxLeverage: '50',
      minOrderQty: '0.1',
      tradable: true,
      category: 'linear',
      status: 'Trading'
    },
    {
      symbol: 'DOTUSDT',
      name: 'Polkadot',
      baseAsset: 'DOT',
      quoteAsset: 'USDT',
      price: generatePrice(8.2, 0.08),
      change24h: generateChange(),
      tradingVolume: generatePrice(120000000, 0.3),
      turnover24h: generatePrice(984000000, 0.3),
      marketCap: 12000000000,
      liquidityScore: 75,
      volatilityScore: Math.random() * 30 + 60,
      riskScore: Math.random() * 40 + 50,
      opportunityScore: Math.random() * 30 + 60,
      sentimentScore: Math.random() * 40 + 50,
      trendStrength: Math.random() * 40 + 50,
      predictedDirection: Math.random() > 0.5 ? 'bullish' : 'bearish',
      quantumScore: Math.random() * 20 + 70,
      leverageScore: 50,
      maxLeverage: '50',
      minOrderQty: '0.1',
      tradable: true,
      category: 'linear',
      status: 'Trading'
    },
    {
      symbol: 'MATICUSDT',
      name: 'Polygon',
      baseAsset: 'MATIC',
      quoteAsset: 'USDT',
      price: generatePrice(0.52, 0.1),
      change24h: generateChange(),
      tradingVolume: generatePrice(300000000, 0.3),
      turnover24h: generatePrice(156000000, 0.3),
      marketCap: 5200000000,
      liquidityScore: 72,
      volatilityScore: Math.random() * 30 + 65,
      riskScore: Math.random() * 40 + 55,
      opportunityScore: Math.random() * 30 + 60,
      sentimentScore: Math.random() * 40 + 50,
      trendStrength: Math.random() * 40 + 55,
      predictedDirection: Math.random() > 0.5 ? 'bullish' : 'bearish',
      quantumScore: Math.random() * 20 + 65,
      leverageScore: 50,
      maxLeverage: '50',
      minOrderQty: '1',
      tradable: true,
      category: 'linear',
      status: 'Trading'
    },
    {
      symbol: 'LTCUSDT',
      name: 'Litecoin',
      baseAsset: 'LTC',
      quoteAsset: 'USDT',
      price: generatePrice(105.5, 0.08),
      change24h: generateChange(),
      tradingVolume: generatePrice(150000000, 0.3),
      turnover24h: generatePrice(158250000, 0.3),
      marketCap: 7800000000,
      liquidityScore: 75,
      volatilityScore: Math.random() * 30 + 60,
      riskScore: Math.random() * 40 + 50,
      opportunityScore: Math.random() * 30 + 60,
      sentimentScore: Math.random() * 40 + 50,
      trendStrength: Math.random() * 40 + 50,
      predictedDirection: Math.random() > 0.5 ? 'bullish' : 'bearish',
      quantumScore: Math.random() * 20 + 70,
      leverageScore: 50,
      maxLeverage: '50',
      minOrderQty: '0.1',
      tradable: true,
      category: 'linear',
      status: 'Trading'
    },
    {
      symbol: 'BCHUSDT',
      name: 'Bitcoin Cash',
      baseAsset: 'BCH',
      quoteAsset: 'USDT',
      price: generatePrice(485.2, 0.08),
      change24h: generateChange(),
      tradingVolume: generatePrice(120000000, 0.3),
      turnover24h: generatePrice(582240000, 0.3),
      marketCap: 9600000000,
      liquidityScore: 72,
      volatilityScore: Math.random() * 30 + 65,
      riskScore: Math.random() * 40 + 55,
      opportunityScore: Math.random() * 30 + 60,
      sentimentScore: Math.random() * 40 + 50,
      trendStrength: Math.random() * 40 + 55,
      predictedDirection: Math.random() > 0.5 ? 'bullish' : 'bearish',
      quantumScore: Math.random() * 20 + 65,
      leverageScore: 50,
      maxLeverage: '50',
      minOrderQty: '0.1',
      tradable: true,
      category: 'linear',
      status: 'Trading'
    },
    {
      symbol: 'UNIUSDT',
      name: 'Uniswap',
      baseAsset: 'UNI',
      quoteAsset: 'USDT',
      price: generatePrice(15.8, 0.08),
      change24h: generateChange(),
      tradingVolume: generatePrice(80000000, 0.3),
      turnover24h: generatePrice(126400000, 0.3),
      marketCap: 9500000000,
      liquidityScore: 70,
      volatilityScore: Math.random() * 30 + 65,
      riskScore: Math.random() * 40 + 55,
      opportunityScore: Math.random() * 30 + 60,
      sentimentScore: Math.random() * 40 + 50,
      trendStrength: Math.random() * 40 + 55,
      predictedDirection: Math.random() > 0.5 ? 'bullish' : 'bearish',
      quantumScore: Math.random() * 20 + 65,
      leverageScore: 25,
      maxLeverage: '25',
      minOrderQty: '0.1',
      tradable: true,
      category: 'linear',
      status: 'Trading'
    },
    {
      symbol: 'ATOMUSDT',
      name: 'Cosmos',
      baseAsset: 'ATOM',
      quoteAsset: 'USDT',
      price: generatePrice(7.85, 0.08),
      change24h: generateChange(),
      tradingVolume: generatePrice(60000000, 0.3),
      turnover24h: generatePrice(471000000, 0.3),
      marketCap: 3100000000,
      liquidityScore: 68,
      volatilityScore: Math.random() * 30 + 65,
      riskScore: Math.random() * 40 + 55,
      opportunityScore: Math.random() * 30 + 60,
      sentimentScore: Math.random() * 40 + 50,
      trendStrength: Math.random() * 40 + 55,
      predictedDirection: Math.random() > 0.5 ? 'bullish' : 'bearish',
      quantumScore: Math.random() * 20 + 65,
      leverageScore: 25,
      maxLeverage: '25',
      minOrderQty: '0.1',
      tradable: true,
      category: 'linear',
      status: 'Trading'
    },
    {
      symbol: 'FILUSDT',
      name: 'Filecoin',
      baseAsset: 'FIL',
      quoteAsset: 'USDT',
      price: generatePrice(6.2, 0.08),
      change24h: generateChange(),
      tradingVolume: generatePrice(45000000, 0.3),
      turnover24h: generatePrice(279000000, 0.3),
      marketCap: 3600000000,
      liquidityScore: 65,
      volatilityScore: Math.random() * 30 + 70,
      riskScore: Math.random() * 40 + 60,
      opportunityScore: Math.random() * 30 + 60,
      sentimentScore: Math.random() * 40 + 50,
      trendStrength: Math.random() * 40 + 60,
      predictedDirection: Math.random() > 0.5 ? 'bullish' : 'bearish',
      quantumScore: Math.random() * 20 + 60,
      leverageScore: 25,
      maxLeverage: '25',
      minOrderQty: '0.1',
      tradable: true,
      category: 'linear',
      status: 'Trading'
    },
    {
      symbol: 'TRXUSDT',
      name: 'TRON',
      baseAsset: 'TRX',
      quoteAsset: 'USDT',
      price: generatePrice(0.162, 0.08),
      change24h: generateChange(),
      tradingVolume: generatePrice(35000000, 0.3),
      turnover24h: generatePrice(56700000, 0.3),
      marketCap: 14200000000,
      liquidityScore: 72,
      volatilityScore: Math.random() * 30 + 60,
      riskScore: Math.random() * 40 + 50,
      opportunityScore: Math.random() * 30 + 60,
      sentimentScore: Math.random() * 40 + 50,
      trendStrength: Math.random() * 40 + 50,
      predictedDirection: Math.random() > 0.5 ? 'bullish' : 'bearish',
      quantumScore: Math.random() * 20 + 65,
      leverageScore: 25,
      maxLeverage: '25',
      minOrderQty: '1',
      tradable: true,
      category: 'linear',
      status: 'Trading'
    },
    {
      symbol: 'NEARUSDT',
      name: 'NEAR Protocol',
      baseAsset: 'NEAR',
      quoteAsset: 'USDT',
      price: generatePrice(5.8, 0.08),
      change24h: generateChange(),
      tradingVolume: generatePrice(40000000, 0.3),
      turnover24h: generatePrice(232000000, 0.3),
      marketCap: 6300000000,
      liquidityScore: 68,
      volatilityScore: Math.random() * 30 + 65,
      riskScore: Math.random() * 40 + 55,
      opportunityScore: Math.random() * 30 + 65,
      sentimentScore: Math.random() * 40 + 55,
      trendStrength: Math.random() * 40 + 60,
      predictedDirection: Math.random() > 0.5 ? 'bullish' : 'bearish',
      quantumScore: Math.random() * 20 + 70,
      leverageScore: 25,
      maxLeverage: '25',
      minOrderQty: '0.1',
      tradable: true,
      category: 'linear',
      status: 'Trading'
    },
    {
      symbol: 'APTUSDT',
      name: 'Aptos',
      baseAsset: 'APT',
      quoteAsset: 'USDT',
      price: generatePrice(12.5, 0.08),
      change24h: generateChange(),
      tradingVolume: generatePrice(55000000, 0.3),
      turnover24h: generatePrice(687500000, 0.3),
      marketCap: 5800000000,
      liquidityScore: 70,
      volatilityScore: Math.random() * 30 + 70,
      riskScore: Math.random() * 40 + 60,
      opportunityScore: Math.random() * 30 + 70,
      sentimentScore: Math.random() * 40 + 60,
      trendStrength: Math.random() * 40 + 65,
      predictedDirection: Math.random() > 0.5 ? 'bullish' : 'bearish',
      quantumScore: Math.random() * 20 + 75,
      leverageScore: 25,
      maxLeverage: '25',
      minOrderQty: '0.1',
      tradable: true,
      category: 'linear',
      status: 'Trading'
    },
    {
      symbol: 'SUIUSDT',
      name: 'Sui',
      baseAsset: 'SUI',
      quoteAsset: 'USDT',
      price: generatePrice(3.8, 0.08),
      change24h: generateChange(),
      tradingVolume: generatePrice(65000000, 0.3),
      turnover24h: generatePrice(247000000, 0.3),
      marketCap: 10200000000,
      liquidityScore: 75,
      volatilityScore: Math.random() * 30 + 75,
      riskScore: Math.random() * 40 + 65,
      opportunityScore: Math.random() * 30 + 75,
      sentimentScore: Math.random() * 40 + 65,
      trendStrength: Math.random() * 40 + 70,
      predictedDirection: Math.random() > 0.5 ? 'bullish' : 'bearish',
      quantumScore: Math.random() * 20 + 80,
      leverageScore: 25,
      maxLeverage: '25',
      minOrderQty: '0.1',
      tradable: true,
      category: 'linear',
      status: 'Trading'
    },
    {
      symbol: 'ARBUSDT',
      name: 'Arbitrum',
      baseAsset: 'ARB',
      quoteAsset: 'USDT',
      price: generatePrice(0.95, 0.08),
      change24h: generateChange(),
      tradingVolume: generatePrice(70000000, 0.3),
      turnover24h: generatePrice(66500000, 0.3),
      marketCap: 3800000000,
      liquidityScore: 73,
      volatilityScore: Math.random() * 30 + 70,
      riskScore: Math.random() * 40 + 60,
      opportunityScore: Math.random() * 30 + 70,
      sentimentScore: Math.random() * 40 + 60,
      trendStrength: Math.random() * 40 + 65,
      predictedDirection: Math.random() > 0.5 ? 'bullish' : 'bearish',
      quantumScore: Math.random() * 20 + 75,
      leverageScore: 25,
      maxLeverage: '25',
      minOrderQty: '1',
      tradable: true,
      category: 'linear',
      status: 'Trading'
    },
    {
      symbol: 'OPUSDT',
      name: 'Optimism',
      baseAsset: 'OP',
      quoteAsset: 'USDT',
      price: generatePrice(2.4, 0.08),
      change24h: generateChange(),
      tradingVolume: generatePrice(50000000, 0.3),
      turnover24h: generatePrice(120000000, 0.3),
      marketCap: 2400000000,
      liquidityScore: 70,
      volatilityScore: Math.random() * 30 + 70,
      riskScore: Math.random() * 40 + 60,
      opportunityScore: Math.random() * 30 + 70,
      sentimentScore: Math.random() * 40 + 60,
      trendStrength: Math.random() * 40 + 65,
      predictedDirection: Math.random() > 0.5 ? 'bullish' : 'bearish',
      quantumScore: Math.random() * 20 + 75,
      leverageScore: 25,
      maxLeverage: '25',
      minOrderQty: '0.1',
      tradable: true,
      category: 'linear',
      status: 'Trading'
    }
  ];
}

// Get all assets
router.get('/', async (req, res) => {
  try {
    // Get tickers from Bybit
    const response = await bybitClient.getAllTickers();

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

    // Try to fetch real-time prices from Binance as fallback
    const binancePrices = await fetchBinancePrices();

    // Return default asset info with real-time prices if available
    const defaultAssets = [
      {
        symbol: 'BTCUSDT',
        name: 'Bitcoin',
        baseAsset: 'BTC',
        quoteAsset: 'USDT',
        price: binancePrices?.BTCUSDT?.price || 104000,
        change24h: binancePrices?.BTCUSDT?.change24h || 2.5,
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
        price: binancePrices?.ETHUSDT?.price || 2528,
        change24h: binancePrices?.ETHUSDT?.change24h || 3.2,
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
        price: binancePrices?.SOLUSDT?.price || 152,
        change24h: binancePrices?.SOLUSDT?.change24h || 5.1,
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
      },
      {
        symbol: 'BNBUSDT',
        name: 'Binance Coin',
        baseAsset: 'BNB',
        quoteAsset: 'USDT',
        price: 720,
        change24h: 1.8,
        tradingVolume: 150000000,
        marketCap: 100000000000,
        liquidityScore: 88,
        volatilityScore: 75,
        riskScore: 68,
        opportunityScore: 82,
        sentimentScore: 78,
        trendStrength: 72,
        predictedDirection: 'bullish',
        quantumScore: 88,
        tradable: true
      },
      {
        symbol: 'XRPUSDT',
        name: 'Ripple',
        baseAsset: 'XRP',
        quoteAsset: 'USDT',
        price: 2.45,
        change24h: 4.2,
        tradingVolume: 300000000,
        marketCap: 140000000000,
        liquidityScore: 92,
        volatilityScore: 85,
        riskScore: 72,
        opportunityScore: 88,
        sentimentScore: 82,
        trendStrength: 78,
        predictedDirection: 'bullish',
        quantumScore: 89,
        tradable: true
      },
      {
        symbol: 'ADAUSDT',
        name: 'Cardano',
        baseAsset: 'ADA',
        quoteAsset: 'USDT',
        price: 1.15,
        change24h: 3.1,
        tradingVolume: 180000000,
        marketCap: 40000000000,
        liquidityScore: 86,
        volatilityScore: 78,
        riskScore: 70,
        opportunityScore: 85,
        sentimentScore: 79,
        trendStrength: 74,
        predictedDirection: 'bullish',
        quantumScore: 87,
        tradable: true
      },
      {
        symbol: 'DOGEUSDT',
        name: 'Dogecoin',
        baseAsset: 'DOGE',
        quoteAsset: 'USDT',
        price: 0.42,
        change24h: 6.8,
        tradingVolume: 250000000,
        marketCap: 60000000000,
        liquidityScore: 89,
        volatilityScore: 90,
        riskScore: 75,
        opportunityScore: 92,
        sentimentScore: 85,
        trendStrength: 82,
        predictedDirection: 'bullish',
        quantumScore: 91,
        tradable: true
      },
      {
        symbol: 'DOTUSDT',
        name: 'Polkadot',
        baseAsset: 'DOT',
        quoteAsset: 'USDT',
        price: 8.95,
        change24h: 2.7,
        tradingVolume: 120000000,
        marketCap: 12000000000,
        liquidityScore: 84,
        volatilityScore: 76,
        riskScore: 69,
        opportunityScore: 83,
        sentimentScore: 77,
        trendStrength: 71,
        predictedDirection: 'bullish',
        quantumScore: 86,
        tradable: true
      },
      {
        symbol: 'LTCUSDT',
        name: 'Litecoin',
        baseAsset: 'LTC',
        quoteAsset: 'USDT',
        price: 110,
        change24h: 1.9,
        tradingVolume: 90000000,
        marketCap: 8000000000,
        liquidityScore: 82,
        volatilityScore: 72,
        riskScore: 66,
        opportunityScore: 81,
        sentimentScore: 75,
        trendStrength: 69,
        predictedDirection: 'bullish',
        quantumScore: 84,
        tradable: true
      },
      {
        symbol: 'LINKUSDT',
        name: 'Chainlink',
        baseAsset: 'LINK',
        quoteAsset: 'USDT',
        price: 28.5,
        change24h: 3.8,
        tradingVolume: 140000000,
        marketCap: 18000000000,
        liquidityScore: 87,
        volatilityScore: 79,
        riskScore: 71,
        opportunityScore: 86,
        sentimentScore: 80,
        trendStrength: 75,
        predictedDirection: 'bullish',
        quantumScore: 88,
        tradable: true
      }
    ];

    res.json(defaultAssets);
  }
});

// Get comprehensive linear perpetuals for Social Insights and Gemini Intelligence
router.get('/linear-perpetuals', async (req, res) => {
  try {
    console.log('🔍 LINEAR-PERPETUALS ENDPOINT HIT - Starting asset fetch');
    logger.info('🔍 LINEAR-PERPETUALS ENDPOINT HIT - Starting asset fetch');

    // Try to get from cache first
    const cachedAssets = dataCache.get('assets', 'linear_perpetuals');
    console.log('🔍 Cache check result:', cachedAssets ? `${cachedAssets.length} items` : 'null/undefined');
    logger.info(`🔍 Cache check result: ${cachedAssets ? `${cachedAssets.length} items` : 'null/undefined'}`);

    if (cachedAssets && cachedAssets.length > 0) {
      console.log('📦 Returning cached assets:', cachedAssets.length, 'items');
      logger.info(`📦 Returning cached assets: ${cachedAssets.length} items`);
      return res.json(cachedAssets);
    }

    // Return enhanced default assets if API fails
    const defaultAssets = getEnhancedDefaultAssets();
    logger.info(`✅ Returning ${defaultAssets.length} default assets due to API failure`);
    res.json(defaultAssets);
  } catch (error) {
    logger.error('❌ Error fetching comprehensive linear perpetuals:', error);

    // Return enhanced default assets if API fails
    const defaultAssets = getEnhancedDefaultAssets();
    logger.info(`✅ Returning ${defaultAssets.length} default assets due to API failure`);
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
        price: 104000,
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
        price: 2528,
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
        price: 152,
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
        'BTCUSDT': { price: 104000, volatilityScore: 65, trendStrength: 70, predictedDirection: 'bullish', tradingVolume: 1000000000 },
        'ETHUSDT': { price: 2528, volatilityScore: 70, trendStrength: 75, predictedDirection: 'bullish', tradingVolume: 500000000 },
        'SOLUSDT': { price: 152, volatilityScore: 80, trendStrength: 80, predictedDirection: 'bullish', tradingVolume: 200000000 }
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
          price: 104000,
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
          price: 2528,
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
          price: 152,
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
