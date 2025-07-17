/**
 * 🔬 ADVANCED TECHNICAL ANALYSIS ENGINE - REAL IMPLEMENTATION
 * 
 * Implements comprehensive technical analysis with REAL calculations:
 * - RSI (Relative Strength Index) with 14-period calculation
 * - MACD (Moving Average Convergence Divergence) with 12/26/9 periods
 * - Bollinger Bands with 20-period SMA and 2 standard deviations
 * - Stochastic Oscillator with %K and %D calculations
 * - Williams %R momentum indicator
 * - Chart pattern recognition (Head & Shoulders, Triangles, Flags)
 * - Candlestick pattern analysis (Doji, Hammer, Engulfing)
 * - Market microstructure analysis (Order book depth, Volume profile)
 */

const logger = require('../utils/logger');
const bybitClient = require('../utils/bybit-client');

class AdvancedTechnicalAnalysis {
  constructor() {
    this.priceHistory = new Map(); // symbol -> price data
    this.indicatorCache = new Map(); // symbol -> calculated indicators
    this.patternCache = new Map(); // symbol -> detected patterns
    this.volumeProfile = new Map(); // symbol -> volume analysis
    
    // Technical indicator parameters
    this.config = {
      rsi: { period: 14, overbought: 70, oversold: 30 },
      macd: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
      bollinger: { period: 20, stdDev: 2 },
      stochastic: { kPeriod: 14, dPeriod: 3, overbought: 80, oversold: 20 },
      williamsR: { period: 14, overbought: -20, oversold: -80 },
      sma: { periods: [5, 10, 20, 50, 100, 200] },
      ema: { periods: [12, 26, 50] }
    };
    
    logger.info('🔬 Advanced Technical Analysis Engine initialized');
  }
  
  /**
   * Perform comprehensive technical analysis for a symbol
   */
  async analyzeSymbol(symbol, timeframe = '1m') {
    const startTime = Date.now();
    
    try {
      // Get historical price data
      const priceData = await this.getPriceData(symbol, timeframe, 200);
      if (!priceData || priceData.length < 50) {
        return { error: 'Insufficient price data', symbol, timeframe };
      }
      
      // Calculate all technical indicators
      const indicators = this.calculateAllIndicators(priceData);
      
      // Detect chart patterns
      const chartPatterns = this.detectChartPatterns(priceData);
      
      // Analyze candlestick patterns
      const candlestickPatterns = this.analyzeCandlestickPatterns(priceData);
      
      // Perform market microstructure analysis
      const microstructure = await this.analyzeMarketMicrostructure(symbol);
      
      // Generate trading signals
      const signals = this.generateTradingSignals(indicators, chartPatterns, candlestickPatterns);
      
      // Calculate overall score
      const technicalScore = this.calculateTechnicalScore(indicators, signals);
      
      const analysis = {
        symbol,
        timeframe,
        timestamp: Date.now(),
        processingTime: Date.now() - startTime,
        indicators,
        chartPatterns,
        candlestickPatterns,
        microstructure,
        signals,
        technicalScore,
        recommendation: this.getRecommendation(technicalScore, signals)
      };
      
      // Cache results
      this.indicatorCache.set(symbol, analysis);
      
      logger.info(`🔬 Technical analysis complete for ${symbol}: score=${technicalScore.toFixed(2)} (${Date.now() - startTime}ms)`);
      return analysis;
      
    } catch (error) {
      logger.error(`❌ Technical analysis failed for ${symbol}:`, error);
      return { error: error.message, symbol, timeframe };
    }
  }
  
  /**
   * Get historical price data from Bybit
   */
  async getPriceData(symbol, timeframe, limit = 200) {
    try {
      const response = await bybitClient.getKlineData({
        category: 'linear',
        symbol: symbol,
        interval: timeframe,
        limit: limit
      });
      
      if (!response || response.retCode !== 0 || !response.result?.list) {
        throw new Error(`Failed to get kline data for ${symbol}`);
      }
      
      // Convert Bybit kline format to OHLCV
      const klines = response.result.list.map(k => ({
        timestamp: parseInt(k[0]),
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
        volume: parseFloat(k[5]),
        turnover: parseFloat(k[6])
      })).reverse(); // Bybit returns newest first, we need oldest first
      
      // Cache price data
      this.priceHistory.set(symbol, klines);
      
      return klines;
      
    } catch (error) {
      logger.error(`❌ Failed to get price data for ${symbol}:`, error);
      return null;
    }
  }
  
  /**
   * Calculate all technical indicators
   */
  calculateAllIndicators(priceData) {
    const closes = priceData.map(p => p.close);
    const highs = priceData.map(p => p.high);
    const lows = priceData.map(p => p.low);
    const volumes = priceData.map(p => p.volume);
    
    return {
      rsi: this.calculateRSI(closes, this.config.rsi.period),
      macd: this.calculateMACD(closes, this.config.macd.fastPeriod, this.config.macd.slowPeriod, this.config.macd.signalPeriod),
      bollinger: this.calculateBollingerBands(closes, this.config.bollinger.period, this.config.bollinger.stdDev),
      stochastic: this.calculateStochastic(highs, lows, closes, this.config.stochastic.kPeriod, this.config.stochastic.dPeriod),
      williamsR: this.calculateWilliamsR(highs, lows, closes, this.config.williamsR.period),
      sma: this.calculateMultipleSMA(closes, this.config.sma.periods),
      ema: this.calculateMultipleEMA(closes, this.config.ema.periods),
      atr: this.calculateATR(highs, lows, closes, 14),
      obv: this.calculateOBV(closes, volumes),
      vwap: this.calculateVWAP(priceData)
    };
  }
  
  /**
   * Calculate RSI (Relative Strength Index)
   */
  calculateRSI(closes, period = 14) {
    if (closes.length < period + 1) return null;
    
    const gains = [];
    const losses = [];
    
    for (let i = 1; i < closes.length; i++) {
      const change = closes[i] - closes[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }
    
    // Calculate initial average gain and loss
    let avgGain = gains.slice(0, period).reduce((a, b) => a + b) / period;
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b) / period;
    
    const rsiValues = [];
    
    // Calculate RSI for each period
    for (let i = period; i < gains.length; i++) {
      avgGain = (avgGain * (period - 1) + gains[i]) / period;
      avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
      
      const rs = avgGain / avgLoss;
      const rsi = 100 - (100 / (1 + rs));
      rsiValues.push(rsi);
    }
    
    const currentRSI = rsiValues[rsiValues.length - 1];
    
    return {
      current: currentRSI,
      values: rsiValues,
      signal: currentRSI > this.config.rsi.overbought ? 'SELL' : 
              currentRSI < this.config.rsi.oversold ? 'BUY' : 'NEUTRAL',
      strength: Math.abs(50 - currentRSI) / 50 // 0-1 scale
    };
  }
  
  /**
   * Calculate MACD (Moving Average Convergence Divergence)
   */
  calculateMACD(closes, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    if (closes.length < slowPeriod) return null;
    
    const fastEMA = this.calculateEMA(closes, fastPeriod);
    const slowEMA = this.calculateEMA(closes, slowPeriod);
    
    const macdLine = [];
    for (let i = 0; i < Math.min(fastEMA.length, slowEMA.length); i++) {
      macdLine.push(fastEMA[i] - slowEMA[i]);
    }
    
    const signalLine = this.calculateEMA(macdLine, signalPeriod);
    const histogram = [];
    
    for (let i = 0; i < Math.min(macdLine.length, signalLine.length); i++) {
      histogram.push(macdLine[i] - signalLine[i]);
    }
    
    const current = {
      macd: macdLine[macdLine.length - 1],
      signal: signalLine[signalLine.length - 1],
      histogram: histogram[histogram.length - 1]
    };
    
    return {
      current,
      macdLine,
      signalLine,
      histogram,
      signal: current.macd > current.signal ? 'BUY' : 'SELL',
      strength: Math.abs(current.histogram) / Math.max(Math.abs(current.macd), 0.001)
    };
  }
  
  /**
   * Calculate Bollinger Bands
   */
  calculateBollingerBands(closes, period = 20, stdDev = 2) {
    if (closes.length < period) return null;
    
    const sma = this.calculateSMA(closes, period);
    const bands = [];
    
    for (let i = period - 1; i < closes.length; i++) {
      const slice = closes.slice(i - period + 1, i + 1);
      const mean = sma[i - period + 1];
      const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
      const standardDev = Math.sqrt(variance);
      
      bands.push({
        upper: mean + (standardDev * stdDev),
        middle: mean,
        lower: mean - (standardDev * stdDev),
        bandwidth: (standardDev * stdDev * 2) / mean,
        position: (closes[i] - (mean - standardDev * stdDev)) / (standardDev * stdDev * 2)
      });
    }
    
    const current = bands[bands.length - 1];
    const currentPrice = closes[closes.length - 1];
    
    return {
      current,
      bands,
      signal: currentPrice > current.upper ? 'SELL' : 
              currentPrice < current.lower ? 'BUY' : 'NEUTRAL',
      squeeze: current.bandwidth < 0.1, // Bollinger squeeze
      strength: Math.abs(current.position - 0.5) * 2 // 0-1 scale
    };
  }
  
  /**
   * Calculate Stochastic Oscillator
   */
  calculateStochastic(highs, lows, closes, kPeriod = 14, dPeriod = 3) {
    if (closes.length < kPeriod) return null;
    
    const kValues = [];
    
    for (let i = kPeriod - 1; i < closes.length; i++) {
      const highestHigh = Math.max(...highs.slice(i - kPeriod + 1, i + 1));
      const lowestLow = Math.min(...lows.slice(i - kPeriod + 1, i + 1));
      const k = ((closes[i] - lowestLow) / (highestHigh - lowestLow)) * 100;
      kValues.push(k);
    }
    
    const dValues = this.calculateSMA(kValues, dPeriod);
    
    const current = {
      k: kValues[kValues.length - 1],
      d: dValues[dValues.length - 1]
    };
    
    return {
      current,
      kValues,
      dValues,
      signal: current.k > this.config.stochastic.overbought ? 'SELL' : 
              current.k < this.config.stochastic.oversold ? 'BUY' : 'NEUTRAL',
      strength: Math.abs(50 - current.k) / 50
    };
  }
  
  /**
   * Calculate Williams %R
   */
  calculateWilliamsR(highs, lows, closes, period = 14) {
    if (closes.length < period) return null;
    
    const values = [];
    
    for (let i = period - 1; i < closes.length; i++) {
      const highestHigh = Math.max(...highs.slice(i - period + 1, i + 1));
      const lowestLow = Math.min(...lows.slice(i - period + 1, i + 1));
      const wr = ((highestHigh - closes[i]) / (highestHigh - lowestLow)) * -100;
      values.push(wr);
    }
    
    const current = values[values.length - 1];
    
    return {
      current,
      values,
      signal: current > this.config.williamsR.overbought ? 'SELL' : 
              current < this.config.williamsR.oversold ? 'BUY' : 'NEUTRAL',
      strength: Math.abs(current + 50) / 50
    };
  }
  
  /**
   * Calculate Simple Moving Average
   */
  calculateSMA(values, period) {
    const sma = [];
    for (let i = period - 1; i < values.length; i++) {
      const sum = values.slice(i - period + 1, i + 1).reduce((a, b) => a + b);
      sma.push(sum / period);
    }
    return sma;
  }
  
  /**
   * Calculate Exponential Moving Average
   */
  calculateEMA(values, period) {
    const ema = [];
    const multiplier = 2 / (period + 1);
    
    // First EMA is SMA
    ema[0] = values.slice(0, period).reduce((a, b) => a + b) / period;
    
    for (let i = 1; i < values.length - period + 1; i++) {
      ema[i] = (values[i + period - 1] * multiplier) + (ema[i - 1] * (1 - multiplier));
    }
    
    return ema;
  }
  
  /**
   * Calculate multiple SMAs
   */
  calculateMultipleSMA(closes, periods) {
    const smas = {};
    periods.forEach(period => {
      if (closes.length >= period) {
        const values = this.calculateSMA(closes, period);
        smas[`sma${period}`] = {
          current: values[values.length - 1],
          values: values
        };
      }
    });
    return smas;
  }
  
  /**
   * Calculate multiple EMAs
   */
  calculateMultipleEMA(closes, periods) {
    const emas = {};
    periods.forEach(period => {
      if (closes.length >= period) {
        const values = this.calculateEMA(closes, period);
        emas[`ema${period}`] = {
          current: values[values.length - 1],
          values: values
        };
      }
    });
    return emas;
  }
  
  /**
   * Calculate Average True Range (ATR)
   */
  calculateATR(highs, lows, closes, period = 14) {
    if (closes.length < period + 1) return null;
    
    const trueRanges = [];
    
    for (let i = 1; i < closes.length; i++) {
      const tr1 = highs[i] - lows[i];
      const tr2 = Math.abs(highs[i] - closes[i - 1]);
      const tr3 = Math.abs(lows[i] - closes[i - 1]);
      trueRanges.push(Math.max(tr1, tr2, tr3));
    }
    
    const atrValues = this.calculateSMA(trueRanges, period);
    
    return {
      current: atrValues[atrValues.length - 1],
      values: atrValues
    };
  }
  
  /**
   * Calculate On-Balance Volume (OBV)
   */
  calculateOBV(closes, volumes) {
    const obv = [volumes[0]];
    
    for (let i = 1; i < closes.length; i++) {
      if (closes[i] > closes[i - 1]) {
        obv.push(obv[i - 1] + volumes[i]);
      } else if (closes[i] < closes[i - 1]) {
        obv.push(obv[i - 1] - volumes[i]);
      } else {
        obv.push(obv[i - 1]);
      }
    }
    
    return {
      current: obv[obv.length - 1],
      values: obv
    };
  }
  
  /**
   * Calculate Volume Weighted Average Price (VWAP)
   */
  calculateVWAP(priceData) {
    let cumulativeVolume = 0;
    let cumulativeVolumePrice = 0;
    const vwapValues = [];

    priceData.forEach(candle => {
      const typicalPrice = (candle.high + candle.low + candle.close) / 3;
      cumulativeVolumePrice += typicalPrice * candle.volume;
      cumulativeVolume += candle.volume;
      vwapValues.push(cumulativeVolumePrice / cumulativeVolume);
    });

    return {
      current: vwapValues[vwapValues.length - 1],
      values: vwapValues
    };
  }

  /**
   * Detect chart patterns (Head & Shoulders, Triangles, Flags, etc.)
   */
  detectChartPatterns(priceData) {
    const patterns = [];

    // Head and Shoulders pattern
    const headShoulders = this.detectHeadAndShoulders(priceData);
    if (headShoulders) patterns.push(headShoulders);

    // Triangle patterns
    const triangles = this.detectTrianglePatterns(priceData);
    patterns.push(...triangles);

    // Flag and Pennant patterns
    const flags = this.detectFlagPatterns(priceData);
    patterns.push(...flags);

    // Double Top/Bottom patterns
    const doubles = this.detectDoublePatterns(priceData);
    patterns.push(...doubles);

    return patterns;
  }

  /**
   * Detect Head and Shoulders pattern
   */
  detectHeadAndShoulders(priceData) {
    if (priceData.length < 50) return null;

    const highs = priceData.map(p => p.high);
    const lows = priceData.map(p => p.low);
    const closes = priceData.map(p => p.close);

    // Find potential peaks and troughs
    const peaks = this.findPeaks(highs, 5);
    const troughs = this.findPeaks(lows.map(l => -l), 5).map(t => ({ ...t, value: -t.value }));

    // Look for Head and Shoulders pattern in last 30 candles
    const recentPeaks = peaks.filter(p => p.index >= priceData.length - 30);

    if (recentPeaks.length >= 3) {
      const [leftShoulder, head, rightShoulder] = recentPeaks.slice(-3);

      // Check if head is higher than shoulders
      if (head.value > leftShoulder.value && head.value > rightShoulder.value) {
        // Check if shoulders are roughly equal (within 2%)
        const shoulderDiff = Math.abs(leftShoulder.value - rightShoulder.value) / leftShoulder.value;

        if (shoulderDiff < 0.02) {
          return {
            type: 'HEAD_AND_SHOULDERS',
            confidence: 0.8 - shoulderDiff,
            signal: 'BEARISH',
            neckline: Math.min(leftShoulder.value, rightShoulder.value),
            target: Math.min(leftShoulder.value, rightShoulder.value) - (head.value - Math.min(leftShoulder.value, rightShoulder.value)),
            points: { leftShoulder, head, rightShoulder }
          };
        }
      }
    }

    return null;
  }

  /**
   * Detect Triangle patterns (Ascending, Descending, Symmetrical)
   */
  detectTrianglePatterns(priceData) {
    if (priceData.length < 20) return [];

    const patterns = [];
    const highs = priceData.map(p => p.high);
    const lows = priceData.map(p => p.low);

    // Get recent 20 candles for pattern detection
    const recentData = priceData.slice(-20);
    const recentHighs = recentData.map(p => p.high);
    const recentLows = recentData.map(p => p.low);

    // Calculate trend lines
    const highTrend = this.calculateTrendLine(recentHighs);
    const lowTrend = this.calculateTrendLine(recentLows);

    // Ascending Triangle (horizontal resistance, rising support)
    if (Math.abs(highTrend.slope) < 0.001 && lowTrend.slope > 0.001) {
      patterns.push({
        type: 'ASCENDING_TRIANGLE',
        confidence: 0.7,
        signal: 'BULLISH',
        resistance: highTrend.intercept,
        support: lowTrend,
        breakoutTarget: highTrend.intercept + (highTrend.intercept - Math.min(...recentLows))
      });
    }

    // Descending Triangle (falling resistance, horizontal support)
    if (highTrend.slope < -0.001 && Math.abs(lowTrend.slope) < 0.001) {
      patterns.push({
        type: 'DESCENDING_TRIANGLE',
        confidence: 0.7,
        signal: 'BEARISH',
        resistance: highTrend,
        support: lowTrend.intercept,
        breakoutTarget: lowTrend.intercept - (Math.max(...recentHighs) - lowTrend.intercept)
      });
    }

    // Symmetrical Triangle (converging trend lines)
    if (highTrend.slope < -0.001 && lowTrend.slope > 0.001) {
      patterns.push({
        type: 'SYMMETRICAL_TRIANGLE',
        confidence: 0.6,
        signal: 'NEUTRAL',
        resistance: highTrend,
        support: lowTrend,
        apex: this.calculateApex(highTrend, lowTrend)
      });
    }

    return patterns;
  }

  /**
   * Detect Flag and Pennant patterns
   */
  detectFlagPatterns(priceData) {
    if (priceData.length < 15) return [];

    const patterns = [];
    const closes = priceData.map(p => p.close);

    // Look for strong move followed by consolidation
    const recentData = priceData.slice(-15);
    const firstHalf = recentData.slice(0, 7);
    const secondHalf = recentData.slice(8);

    // Calculate price movement in first half
    const firstMove = (firstHalf[firstHalf.length - 1].close - firstHalf[0].close) / firstHalf[0].close;

    // Check if strong move (>2%)
    if (Math.abs(firstMove) > 0.02) {
      // Check for consolidation in second half
      const secondHalfHighs = secondHalf.map(p => p.high);
      const secondHalfLows = secondHalf.map(p => p.low);
      const consolidationRange = (Math.max(...secondHalfHighs) - Math.min(...secondHalfLows)) / Math.min(...secondHalfLows);

      // Flag pattern (consolidation range < 3%)
      if (consolidationRange < 0.03) {
        patterns.push({
          type: firstMove > 0 ? 'BULL_FLAG' : 'BEAR_FLAG',
          confidence: 0.75,
          signal: firstMove > 0 ? 'BULLISH' : 'BEARISH',
          flagpole: Math.abs(firstMove),
          target: recentData[recentData.length - 1].close * (1 + firstMove)
        });
      }
    }

    return patterns;
  }

  /**
   * Detect Double Top/Bottom patterns
   */
  detectDoublePatterns(priceData) {
    if (priceData.length < 30) return [];

    const patterns = [];
    const highs = priceData.map(p => p.high);
    const lows = priceData.map(p => p.low);

    // Find peaks and troughs
    const peaks = this.findPeaks(highs, 3);
    const troughs = this.findPeaks(lows.map(l => -l), 3).map(t => ({ ...t, value: -t.value }));

    // Double Top
    if (peaks.length >= 2) {
      const lastTwoPeaks = peaks.slice(-2);
      const [peak1, peak2] = lastTwoPeaks;
      const priceDiff = Math.abs(peak1.value - peak2.value) / peak1.value;

      if (priceDiff < 0.02 && peak2.index - peak1.index > 5) {
        patterns.push({
          type: 'DOUBLE_TOP',
          confidence: 0.8 - priceDiff,
          signal: 'BEARISH',
          peaks: lastTwoPeaks,
          neckline: Math.min(...lows.slice(peak1.index, peak2.index)),
          target: Math.min(...lows.slice(peak1.index, peak2.index)) - (peak1.value - Math.min(...lows.slice(peak1.index, peak2.index)))
        });
      }
    }

    // Double Bottom
    if (troughs.length >= 2) {
      const lastTwoTroughs = troughs.slice(-2);
      const [trough1, trough2] = lastTwoTroughs;
      const priceDiff = Math.abs(trough1.value - trough2.value) / Math.abs(trough1.value);

      if (priceDiff < 0.02 && trough2.index - trough1.index > 5) {
        patterns.push({
          type: 'DOUBLE_BOTTOM',
          confidence: 0.8 - priceDiff,
          signal: 'BULLISH',
          troughs: lastTwoTroughs,
          neckline: Math.max(...highs.slice(trough1.index, trough2.index)),
          target: Math.max(...highs.slice(trough1.index, trough2.index)) + (Math.max(...highs.slice(trough1.index, trough2.index)) - trough1.value)
        });
      }
    }

    return patterns;
  }

  /**
   * Analyze candlestick patterns
   */
  analyzeCandlestickPatterns(priceData) {
    const patterns = [];

    if (priceData.length < 3) return patterns;

    // Get last few candles for pattern analysis
    const recent = priceData.slice(-5);

    // Single candle patterns
    patterns.push(...this.detectSingleCandlePatterns(recent));

    // Multi-candle patterns
    patterns.push(...this.detectMultiCandlePatterns(recent));

    return patterns;
  }

  /**
   * Detect single candlestick patterns
   */
  detectSingleCandlePatterns(candles) {
    const patterns = [];
    const current = candles[candles.length - 1];

    const bodySize = Math.abs(current.close - current.open);
    const upperShadow = current.high - Math.max(current.open, current.close);
    const lowerShadow = Math.min(current.open, current.close) - current.low;
    const totalRange = current.high - current.low;

    // Doji pattern (small body)
    if (bodySize / totalRange < 0.1) {
      patterns.push({
        type: 'DOJI',
        confidence: 0.8,
        signal: 'REVERSAL',
        description: 'Indecision in the market'
      });
    }

    // Hammer pattern (small body at top, long lower shadow)
    if (bodySize / totalRange < 0.3 && lowerShadow > bodySize * 2 && upperShadow < bodySize) {
      patterns.push({
        type: 'HAMMER',
        confidence: 0.75,
        signal: 'BULLISH',
        description: 'Potential bullish reversal'
      });
    }

    // Shooting Star (small body at bottom, long upper shadow)
    if (bodySize / totalRange < 0.3 && upperShadow > bodySize * 2 && lowerShadow < bodySize) {
      patterns.push({
        type: 'SHOOTING_STAR',
        confidence: 0.75,
        signal: 'BEARISH',
        description: 'Potential bearish reversal'
      });
    }

    // Spinning Top (small body, long shadows on both sides)
    if (bodySize / totalRange < 0.3 && upperShadow > bodySize && lowerShadow > bodySize) {
      patterns.push({
        type: 'SPINNING_TOP',
        confidence: 0.6,
        signal: 'NEUTRAL',
        description: 'Market indecision'
      });
    }

    return patterns;
  }

  /**
   * Detect multi-candlestick patterns
   */
  detectMultiCandlePatterns(candles) {
    const patterns = [];

    if (candles.length < 2) return patterns;

    // Engulfing patterns
    const engulfing = this.detectEngulfingPattern(candles);
    if (engulfing) patterns.push(engulfing);

    // Morning/Evening Star patterns
    if (candles.length >= 3) {
      const star = this.detectStarPattern(candles);
      if (star) patterns.push(star);
    }

    return patterns;
  }

  /**
   * Detect Engulfing patterns
   */
  detectEngulfingPattern(candles) {
    if (candles.length < 2) return null;

    const prev = candles[candles.length - 2];
    const current = candles[candles.length - 1];

    const prevBody = Math.abs(prev.close - prev.open);
    const currentBody = Math.abs(current.close - current.open);

    // Bullish Engulfing
    if (prev.close < prev.open && current.close > current.open &&
        current.open < prev.close && current.close > prev.open &&
        currentBody > prevBody) {
      return {
        type: 'BULLISH_ENGULFING',
        confidence: 0.8,
        signal: 'BULLISH',
        description: 'Strong bullish reversal signal'
      };
    }

    // Bearish Engulfing
    if (prev.close > prev.open && current.close < current.open &&
        current.open > prev.close && current.close < prev.open &&
        currentBody > prevBody) {
      return {
        type: 'BEARISH_ENGULFING',
        confidence: 0.8,
        signal: 'BEARISH',
        description: 'Strong bearish reversal signal'
      };
    }

    return null;
  }

  /**
   * Detect Morning/Evening Star patterns
   */
  detectStarPattern(candles) {
    if (candles.length < 3) return null;

    const [first, star, third] = candles.slice(-3);

    const firstBody = Math.abs(first.close - first.open);
    const starBody = Math.abs(star.close - star.open);
    const thirdBody = Math.abs(third.close - third.open);

    // Morning Star (bullish reversal)
    if (first.close < first.open && // First candle bearish
        starBody < firstBody * 0.5 && // Star has small body
        third.close > third.open && // Third candle bullish
        third.close > (first.open + first.close) / 2) { // Third closes above midpoint of first
      return {
        type: 'MORNING_STAR',
        confidence: 0.85,
        signal: 'BULLISH',
        description: 'Strong bullish reversal pattern'
      };
    }

    // Evening Star (bearish reversal)
    if (first.close > first.open && // First candle bullish
        starBody < firstBody * 0.5 && // Star has small body
        third.close < third.open && // Third candle bearish
        third.close < (first.open + first.close) / 2) { // Third closes below midpoint of first
      return {
        type: 'EVENING_STAR',
        confidence: 0.85,
        signal: 'BEARISH',
        description: 'Strong bearish reversal pattern'
      };
    }

    return null;
  }

  /**
   * Helper method to find peaks in data
   */
  findPeaks(data, minDistance = 3) {
    const peaks = [];

    for (let i = minDistance; i < data.length - minDistance; i++) {
      let isPeak = true;

      // Check if current point is higher than surrounding points
      for (let j = i - minDistance; j <= i + minDistance; j++) {
        if (j !== i && data[j] >= data[i]) {
          isPeak = false;
          break;
        }
      }

      if (isPeak) {
        peaks.push({ index: i, value: data[i] });
      }
    }

    return peaks;
  }

  /**
   * Calculate trend line for data points
   */
  calculateTrendLine(data) {
    const n = data.length;
    const x = Array.from({ length: n }, (_, i) => i);

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = data.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * data[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  /**
   * Calculate apex point where two trend lines intersect
   */
  calculateApex(line1, line2) {
    const x = (line2.intercept - line1.intercept) / (line1.slope - line2.slope);
    const y = line1.slope * x + line1.intercept;
    return { x, y };
  }

  /**
   * Analyze market microstructure
   */
  async analyzeMarketMicrostructure(symbol) {
    try {
      // Get order book data
      const orderBook = await bybitClient.getOrderbook({
        category: 'linear',
        symbol: symbol,
        limit: 25
      });

      if (!orderBook || orderBook.retCode !== 0) {
        return { error: 'Failed to get order book data' };
      }

      const { bids, asks } = orderBook.result;

      // Calculate bid-ask spread
      const bestBid = parseFloat(bids[0][0]);
      const bestAsk = parseFloat(asks[0][0]);
      const spread = bestAsk - bestBid;
      const spreadPercent = (spread / bestBid) * 100;

      // Calculate order book imbalance
      const bidVolume = bids.reduce((sum, bid) => sum + parseFloat(bid[1]), 0);
      const askVolume = asks.reduce((sum, ask) => sum + parseFloat(ask[1]), 0);
      const imbalance = (bidVolume - askVolume) / (bidVolume + askVolume);

      // Calculate order book depth
      const depth = {
        bids: bids.length,
        asks: asks.length,
        totalBidVolume: bidVolume,
        totalAskVolume: askVolume
      };

      return {
        spread: {
          absolute: spread,
          percent: spreadPercent
        },
        imbalance,
        depth,
        liquidity: bidVolume + askVolume,
        signal: imbalance > 0.1 ? 'BULLISH' : imbalance < -0.1 ? 'BEARISH' : 'NEUTRAL'
      };

    } catch (error) {
      logger.error(`❌ Market microstructure analysis failed for ${symbol}:`, error);
      return { error: error.message };
    }
  }

  /**
   * Generate trading signals based on all analysis
   */
  generateTradingSignals(indicators, chartPatterns, candlestickPatterns) {
    const signals = [];

    // RSI signals
    if (indicators.rsi) {
      signals.push({
        type: 'RSI',
        signal: indicators.rsi.signal,
        strength: indicators.rsi.strength,
        value: indicators.rsi.current
      });
    }

    // MACD signals
    if (indicators.macd) {
      signals.push({
        type: 'MACD',
        signal: indicators.macd.signal,
        strength: indicators.macd.strength,
        histogram: indicators.macd.current.histogram
      });
    }

    // Bollinger Bands signals
    if (indicators.bollinger) {
      signals.push({
        type: 'BOLLINGER',
        signal: indicators.bollinger.signal,
        strength: indicators.bollinger.strength,
        squeeze: indicators.bollinger.squeeze
      });
    }

    // Chart pattern signals
    chartPatterns.forEach(pattern => {
      signals.push({
        type: 'CHART_PATTERN',
        pattern: pattern.type,
        signal: pattern.signal,
        confidence: pattern.confidence
      });
    });

    // Candlestick pattern signals
    candlestickPatterns.forEach(pattern => {
      signals.push({
        type: 'CANDLESTICK',
        pattern: pattern.type,
        signal: pattern.signal,
        confidence: pattern.confidence
      });
    });

    return signals;
  }

  /**
   * Calculate overall technical score
   */
  calculateTechnicalScore(indicators, signals) {
    let score = 50; // Neutral starting point
    let totalWeight = 0;

    // Weight different signal types
    const weights = {
      RSI: 0.2,
      MACD: 0.25,
      BOLLINGER: 0.15,
      CHART_PATTERN: 0.2,
      CANDLESTICK: 0.2
    };

    signals.forEach(signal => {
      const weight = weights[signal.type] || 0.1;
      const strength = signal.strength || signal.confidence || 0.5;

      if (signal.signal === 'BULLISH' || signal.signal === 'BUY') {
        score += (strength * 50 * weight);
      } else if (signal.signal === 'BEARISH' || signal.signal === 'SELL') {
        score -= (strength * 50 * weight);
      }

      totalWeight += weight;
    });

    // Normalize score to 0-100 range
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get trading recommendation based on score and signals
   */
  getRecommendation(score, signals) {
    const bullishSignals = signals.filter(s => s.signal === 'BULLISH' || s.signal === 'BUY').length;
    const bearishSignals = signals.filter(s => s.signal === 'BEARISH' || s.signal === 'SELL').length;

    if (score > 70 && bullishSignals > bearishSignals) {
      return { action: 'STRONG_BUY', confidence: score / 100 };
    } else if (score > 60) {
      return { action: 'BUY', confidence: score / 100 };
    } else if (score < 30 && bearishSignals > bullishSignals) {
      return { action: 'STRONG_SELL', confidence: (100 - score) / 100 };
    } else if (score < 40) {
      return { action: 'SELL', confidence: (100 - score) / 100 };
    } else {
      return { action: 'HOLD', confidence: 0.5 };
    }
  }
}

module.exports = AdvancedTechnicalAnalysis;
