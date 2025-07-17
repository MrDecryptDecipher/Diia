/**
 * COLLABORATIVE HELPER METHODS
 * 
 * All the mathematical and analytical helper methods for the collaborative system
 */

class CollaborativeHelperMethods {
  
  // ============ CANDLESTICK PATTERN METHODS ============
  
  isDoji(candle) {
    const bodySize = Math.abs(candle.close - candle.open);
    const totalRange = candle.high - candle.low;
    return bodySize <= totalRange * 0.1; // Body is less than 10% of total range
  }
  
  isHammer(candle) {
    const bodySize = Math.abs(candle.close - candle.open);
    const lowerShadow = Math.min(candle.open, candle.close) - candle.low;
    const upperShadow = candle.high - Math.max(candle.open, candle.close);
    
    return lowerShadow >= bodySize * 2 && upperShadow <= bodySize * 0.5;
  }
  
  isShootingStar(candle) {
    const bodySize = Math.abs(candle.close - candle.open);
    const lowerShadow = Math.min(candle.open, candle.close) - candle.low;
    const upperShadow = candle.high - Math.max(candle.open, candle.close);
    
    return upperShadow >= bodySize * 2 && lowerShadow <= bodySize * 0.5;
  }
  
  isBullishEngulfing(prev, current) {
    return prev.close < prev.open && // Previous is bearish
           current.close > current.open && // Current is bullish
           current.open < prev.close && // Current opens below previous close
           current.close > prev.open; // Current closes above previous open
  }
  
  isBearishEngulfing(prev, current) {
    return prev.close > prev.open && // Previous is bullish
           current.close < current.open && // Current is bearish
           current.open > prev.close && // Current opens above previous close
           current.close < prev.open; // Current closes below previous open
  }
  
  isThreeWhiteSoldiers(candle1, candle2, candle3) {
    return candle1.close > candle1.open &&
           candle2.close > candle2.open &&
           candle3.close > candle3.open &&
           candle2.close > candle1.close &&
           candle3.close > candle2.close;
  }
  
  isThreeBlackCrows(candle1, candle2, candle3) {
    return candle1.close < candle1.open &&
           candle2.close < candle2.open &&
           candle3.close < candle3.open &&
           candle2.close < candle1.close &&
           candle3.close < candle2.close;
  }
  
  getTimeframeWeight(timeframe) {
    const weights = {
      '1': 0.05,   // 1 minute
      '3': 0.08,   // 3 minutes
      '5': 0.10,   // 5 minutes
      '15': 0.15,  // 15 minutes
      '30': 0.20,  // 30 minutes
      '60': 0.25,  // 1 hour
      '120': 0.10, // 2 hours
      '240': 0.05, // 4 hours
      'D': 0.02    // Daily
    };
    return weights[timeframe] || 0.05;
  }
  
  // ============ TECHNICAL INDICATOR METHODS ============
  
  calculateRSI(prices, period) {
    if (!prices || prices.length < period + 1) return [];
    
    const gains = [];
    const losses = [];
    
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }
    
    if (gains.length < period) return [];
    
    const rsi = [];
    let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
    
    for (let i = period; i < gains.length; i++) {
      avgGain = (avgGain * (period - 1) + gains[i]) / period;
      avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
      const rs = avgGain / (avgLoss || 0.0001);
      rsi.push(100 - (100 / (1 + rs)));
    }
    
    return rsi;
  }
  
  calculateMACD(prices, fastPeriod, slowPeriod, signalPeriod) {
    const fastEMA = this.calculateEMA(prices, fastPeriod);
    const slowEMA = this.calculateEMA(prices, slowPeriod);
    
    const macdLine = [];
    const minLength = Math.min(fastEMA.length, slowEMA.length);
    
    for (let i = 0; i < minLength; i++) {
      macdLine.push(fastEMA[i] - slowEMA[i]);
    }
    
    const signalLine = this.calculateEMA(macdLine, signalPeriod);
    const histogram = [];
    
    for (let i = 0; i < Math.min(macdLine.length, signalLine.length); i++) {
      histogram.push(macdLine[i] - signalLine[i]);
    }
    
    return {
      macd: macdLine,
      signal: signalLine,
      histogram: histogram
    };
  }
  
  calculateBollingerBands(prices, period, stdDev) {
    const sma = this.calculateSMA(prices, period);
    const upper = [];
    const lower = [];
    
    for (let i = period - 1; i < prices.length; i++) {
      const slice = prices.slice(i - period + 1, i + 1);
      const mean = sma[i - period + 1];
      const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
      const standardDev = Math.sqrt(variance);
      
      upper.push(mean + (standardDev * stdDev));
      lower.push(mean - (standardDev * stdDev));
    }
    
    return { upper, lower, middle: sma };
  }
  
  calculateStochastic(highs, lows, closes, period) {
    const stochastic = [];
    
    for (let i = period - 1; i < closes.length; i++) {
      const highestHigh = Math.max(...highs.slice(i - period + 1, i + 1));
      const lowestLow = Math.min(...lows.slice(i - period + 1, i + 1));
      const currentClose = closes[i];
      
      const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
      stochastic.push(k);
    }
    
    return stochastic;
  }
  
  calculateWilliamsR(highs, lows, closes, period) {
    const williamsR = [];
    
    for (let i = period - 1; i < closes.length; i++) {
      const highestHigh = Math.max(...highs.slice(i - period + 1, i + 1));
      const lowestLow = Math.min(...lows.slice(i - period + 1, i + 1));
      const currentClose = closes[i];
      
      const wr = ((highestHigh - currentClose) / (highestHigh - lowestLow)) * -100;
      williamsR.push(wr);
    }
    
    return williamsR;
  }
  
  calculateSMA(prices, period) {
    const sma = [];
    for (let i = period - 1; i < prices.length; i++) {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
    return sma;
  }
  
  calculateEMA(prices, period) {
    if (prices.length < period) return [];
    
    const ema = [];
    const multiplier = 2 / (period + 1);
    
    // First EMA is SMA
    const firstSMA = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
    ema.push(firstSMA);
    
    for (let i = period; i < prices.length; i++) {
      const currentEMA = (prices[i] * multiplier) + (ema[ema.length - 1] * (1 - multiplier));
      ema.push(currentEMA);
    }
    
    return ema;
  }
  
  generateIndicatorSignals(indicators) {
    let buyScore = 0;
    let sellScore = 0;
    let signalCount = 0;
    
    // RSI signals
    if (indicators.rsi !== undefined) {
      if (indicators.rsi < 30) {
        buyScore += 0.8;
      } else if (indicators.rsi > 70) {
        sellScore += 0.8;
      } else if (indicators.rsi < 40) {
        buyScore += 0.4;
      } else if (indicators.rsi > 60) {
        sellScore += 0.4;
      }
      signalCount++;
    }
    
    // MACD signals
    if (indicators.macd && indicators.macd.macd && indicators.macd.signal) {
      const macdLine = indicators.macd.macd;
      const signalLine = indicators.macd.signal;
      const currentMACD = macdLine[macdLine.length - 1];
      const currentSignal = signalLine[signalLine.length - 1];
      
      if (currentMACD > currentSignal) {
        buyScore += 0.6;
      } else {
        sellScore += 0.6;
      }
      signalCount++;
    }
    
    // Moving Average signals
    if (indicators.ema12 && indicators.ema26 && indicators.currentPrice) {
      if (indicators.ema12 > indicators.ema26 && indicators.currentPrice > indicators.ema12) {
        buyScore += 0.5;
      } else if (indicators.ema12 < indicators.ema26 && indicators.currentPrice < indicators.ema12) {
        sellScore += 0.5;
      }
      signalCount++;
    }
    
    // Bollinger Bands signals
    if (indicators.bollinger && indicators.currentPrice) {
      const upper = indicators.bollinger.upper;
      const lower = indicators.bollinger.lower;
      const currentUpper = upper[upper.length - 1];
      const currentLower = lower[lower.length - 1];
      
      if (indicators.currentPrice <= currentLower) {
        buyScore += 0.7;
      } else if (indicators.currentPrice >= currentUpper) {
        sellScore += 0.7;
      }
      signalCount++;
    }
    
    // Stochastic signals
    if (indicators.stochastic !== undefined) {
      if (indicators.stochastic < 20) {
        buyScore += 0.6;
      } else if (indicators.stochastic > 80) {
        sellScore += 0.6;
      }
      signalCount++;
    }
    
    // Williams %R signals
    if (indicators.williamsR !== undefined) {
      if (indicators.williamsR < -80) {
        buyScore += 0.6;
      } else if (indicators.williamsR > -20) {
        sellScore += 0.6;
      }
      signalCount++;
    }
    
    const avgBuyScore = signalCount > 0 ? buyScore / signalCount : 0;
    const avgSellScore = signalCount > 0 ? sellScore / signalCount : 0;
    
    let overall = 'HOLD';
    let strength = 0;
    
    if (avgBuyScore > avgSellScore && avgBuyScore > 0.6) {
      overall = 'BUY';
      strength = avgBuyScore;
    } else if (avgSellScore > avgBuyScore && avgSellScore > 0.6) {
      overall = 'SELL';
      strength = avgSellScore;
    }
    
    return {
      overall: overall,
      strength: strength,
      buyScore: avgBuyScore,
      sellScore: avgSellScore,
      signalCount: signalCount
    };
  }

  // ============ ADDITIONAL ANALYSIS METHODS ============

  analyzeTrend(closes) {
    if (closes.length < 20) return { direction: 'SIDEWAYS', strength: 0 };

    const recent = closes.slice(-20);
    const first = recent[0];
    const last = recent[recent.length - 1];
    const change = (last - first) / first;

    if (change > 0.02) {
      return { direction: 'UPTREND', strength: Math.min(change * 10, 1) };
    } else if (change < -0.02) {
      return { direction: 'DOWNTREND', strength: Math.min(Math.abs(change) * 10, 1) };
    } else {
      return { direction: 'SIDEWAYS', strength: 0.3 };
    }
  }

  findSupportResistance(highs, lows, closes) {
    const levels = [];
    const recent = closes.slice(-50);

    // Simple support/resistance detection
    const max = Math.max(...recent);
    const min = Math.min(...recent);

    return {
      resistance: max,
      support: min,
      levels: levels
    };
  }

  detectChartPatterns(klines) {
    // Simplified chart pattern detection
    return ['CONSOLIDATION'];
  }

  calculateReturns(prices) {
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    return returns;
  }

  calculateMean(values) {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  calculateVariance(values, mean) {
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }

  calculateSkewness(values, mean, stdDev) {
    const n = values.length;
    const sum = values.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 3), 0);
    return (n / ((n - 1) * (n - 2))) * sum;
  }

  calculateKurtosis(values, mean, stdDev) {
    const n = values.length;
    const sum = values.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 4), 0);
    return ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * sum - (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
  }

  calculateProbabilityUp(returns) {
    const upReturns = returns.filter(r => r > 0);
    return upReturns.length / returns.length;
  }

  calculateExpectedReturn(returns) {
    return this.calculateMean(returns);
  }

  calculateSharpeRatio(returns, riskFreeRate) {
    const meanReturn = this.calculateMean(returns);
    const stdDev = Math.sqrt(this.calculateVariance(returns, meanReturn));
    return (meanReturn - riskFreeRate) / stdDev;
  }

  calculateOBV(klines) {
    let obv = 0;
    const obvValues = [obv];

    for (let i = 1; i < klines.length; i++) {
      const current = klines[i];
      const previous = klines[i - 1];

      if (current.close > previous.close) {
        obv += current.volume;
      } else if (current.close < previous.close) {
        obv -= current.volume;
      }

      obvValues.push(obv);
    }

    return obvValues;
  }

  calculateVWAP(klines) {
    let cumulativeVolume = 0;
    let cumulativeVolumePrice = 0;
    const vwapValues = [];

    for (const kline of klines) {
      const typicalPrice = (kline.high + kline.low + kline.close) / 3;
      cumulativeVolumePrice += typicalPrice * kline.volume;
      cumulativeVolume += kline.volume;

      vwapValues.push(cumulativeVolumePrice / cumulativeVolume);
    }

    return vwapValues;
  }

  calculateVolumeProfile(klines) {
    const profile = new Map();

    for (const kline of klines) {
      const priceLevel = Math.round(kline.close * 100) / 100; // Round to 2 decimals
      profile.set(priceLevel, (profile.get(priceLevel) || 0) + kline.volume);
    }

    return profile;
  }

  analyzeVolumeTrend(volumes) {
    if (volumes.length < 10) return 'NEUTRAL';

    const recent = volumes.slice(-10);
    const earlier = volumes.slice(-20, -10);

    const recentAvg = recent.reduce((sum, vol) => sum + vol, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, vol) => sum + vol, 0) / earlier.length;

    if (recentAvg > earlierAvg * 1.2) {
      return 'INCREASING';
    } else if (recentAvg < earlierAvg * 0.8) {
      return 'DECREASING';
    } else {
      return 'STABLE';
    }
  }

  detectVolumeBreakout(volumes) {
    if (volumes.length < 20) return false;

    const current = volumes[volumes.length - 1];
    const average = volumes.slice(-20, -1).reduce((sum, vol) => sum + vol, 0) / 19;

    return current > average * 2; // Volume breakout if current volume is 2x average
  }

  calculateQuantumSuperposition(prices) {
    // Quantum-inspired superposition calculation
    const normalized = prices.map(p => p / Math.max(...prices));
    const superposition = normalized.reduce((sum, val) => sum + Math.sin(val * Math.PI), 0) / normalized.length;
    return Math.abs(superposition);
  }

  calculateQuantumEntanglement(prices) {
    // Quantum-inspired entanglement correlation
    if (prices.length < 2) return 0;

    const correlations = [];
    for (let i = 1; i < prices.length; i++) {
      const correlation = Math.cos((prices[i] - prices[i - 1]) * Math.PI);
      correlations.push(correlation);
    }

    return correlations.reduce((sum, corr) => sum + corr, 0) / correlations.length;
  }

  calculateQuantumInterference(prices) {
    // Quantum-inspired interference pattern
    const waves = prices.map((p, i) => Math.sin(i * Math.PI / prices.length) * p);
    const interference = waves.reduce((sum, wave) => sum + wave, 0) / waves.length;
    return Math.abs(interference) / Math.max(...prices);
  }

  calculateFearGreedIndex(klines) {
    // Simplified fear/greed calculation based on volatility and volume
    const closes = klines.map(k => k.close);
    const volumes = klines.map(k => k.volume);

    const returns = this.calculateReturns(closes);
    const volatility = Math.sqrt(this.calculateVariance(returns, this.calculateMean(returns)));
    const avgVolume = this.calculateMean(volumes);
    const currentVolume = volumes[volumes.length - 1];

    // High volatility + high volume = fear (0-30)
    // Low volatility + normal volume = greed (70-100)
    let fearGreed = 50; // Neutral

    if (volatility > 0.05 && currentVolume > avgVolume * 1.5) {
      fearGreed = 20; // Extreme fear
    } else if (volatility < 0.02 && currentVolume < avgVolume * 0.8) {
      fearGreed = 80; // Greed
    }

    return fearGreed;
  }

  analyzePriceSentiment(klines) {
    const recent = klines.slice(-10);
    const bullish = recent.filter(k => k.close > k.open).length;
    const bearish = recent.filter(k => k.close < k.open).length;

    if (bullish > bearish * 1.5) {
      return 'BULLISH';
    } else if (bearish > bullish * 1.5) {
      return 'BEARISH';
    } else {
      return 'NEUTRAL';
    }
  }

  analyzeCrowdPsychology(klines, orderbookData, tradesData) {
    // Simplified crowd psychology analysis
    let psychology = 'NEUTRAL';

    if (orderbookData && orderbookData.bids && orderbookData.asks) {
      const bidVolume = orderbookData.bids.reduce((sum, bid) => sum + parseFloat(bid[1]), 0);
      const askVolume = orderbookData.asks.reduce((sum, ask) => sum + parseFloat(ask[1]), 0);

      if (bidVolume > askVolume * 1.5) {
        psychology = 'OPTIMISTIC';
      } else if (askVolume > bidVolume * 1.5) {
        psychology = 'PESSIMISTIC';
      }
    }

    return psychology;
  }
}

module.exports = CollaborativeHelperMethods;
