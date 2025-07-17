/**
 * COLLABORATIVE SIGNAL GENERATOR
 * 
 * Combines all 8 analysis components to generate precise entry/exit signals
 * with exact profit targets of 0.6 USDT per trade
 */

class CollaborativeSignalGenerator {
  constructor() {
    this.componentWeights = {
      candlestick: 0.15,    // 15% weight
      chart: 0.15,          // 15% weight
      mathematical: 0.10,   // 10% weight
      volume: 0.15,         // 15% weight
      indicators: 0.20,     // 20% weight
      ml: 0.15,            // 15% weight
      quantum: 0.05,       // 5% weight
      psychological: 0.05   // 5% weight
    };
  }
  
  /**
   * Generate collaborative signal from all 8 components
   */
  generateCollaborativeSignal(symbol, analysisResults) {
    try {
      const {
        candlestickAnalysis,
        chartAnalysis,
        mathematicalAnalysis,
        volumeAnalysis,
        indicatorAnalysis,
        mlAnalysis,
        quantumAnalysis,
        psychologicalAnalysis
      } = analysisResults;
      
      let totalBuyScore = 0;
      let totalSellScore = 0;
      let totalWeight = 0;
      
      // 1. Candlestick Analysis Score
      if (candlestickAnalysis && candlestickAnalysis.overallSignal) {
        const weight = this.componentWeights.candlestick;
        if (candlestickAnalysis.overallSignal === 'BUY') {
          totalBuyScore += candlestickAnalysis.confidence * weight;
        } else if (candlestickAnalysis.overallSignal === 'SELL') {
          totalSellScore += candlestickAnalysis.confidence * weight;
        }
        totalWeight += weight;
      }
      
      // 2. Chart Analysis Score
      if (chartAnalysis && chartAnalysis.overallTrend) {
        const weight = this.componentWeights.chart;
        if (chartAnalysis.overallTrend === 'UPTREND') {
          totalBuyScore += chartAnalysis.trendStrength * weight;
        } else if (chartAnalysis.overallTrend === 'DOWNTREND') {
          totalSellScore += chartAnalysis.trendStrength * weight;
        }
        totalWeight += weight;
      }
      
      // 3. Mathematical Analysis Score
      if (mathematicalAnalysis && mathematicalAnalysis.analysis) {
        const weight = this.componentWeights.mathematical;
        // Use probability and expected return
        for (const [timeframe, mathData] of mathematicalAnalysis.analysis) {
          if (mathData.probabilityUp > 0.6 && mathData.expectedReturn > 0) {
            totalBuyScore += mathData.probabilityUp * weight;
          } else if (mathData.probabilityUp < 0.4 && mathData.expectedReturn < 0) {
            totalSellScore += (1 - mathData.probabilityUp) * weight;
          }
        }
        totalWeight += weight;
      }
      
      // 4. Volume Analysis Score
      if (volumeAnalysis && volumeAnalysis.analysis) {
        const weight = this.componentWeights.volume;
        for (const [timeframe, volumeData] of volumeAnalysis.analysis) {
          if (volumeData.volumeBreakout && volumeData.volumeTrend === 'INCREASING') {
            totalBuyScore += 0.7 * weight;
          } else if (volumeData.volumeTrend === 'DECREASING') {
            totalSellScore += 0.5 * weight;
          }
        }
        totalWeight += weight;
      }
      
      // 5. Indicators Analysis Score
      if (indicatorAnalysis && indicatorAnalysis.analysis) {
        const weight = this.componentWeights.indicators;
        let indicatorBuyScore = 0;
        let indicatorSellScore = 0;
        let indicatorCount = 0;
        
        for (const [timeframe, indicators] of indicatorAnalysis.analysis) {
          if (indicators.signals) {
            if (indicators.signals.overall === 'BUY') {
              indicatorBuyScore += indicators.signals.strength;
            } else if (indicators.signals.overall === 'SELL') {
              indicatorSellScore += indicators.signals.strength;
            }
            indicatorCount++;
          }
        }
        
        if (indicatorCount > 0) {
          totalBuyScore += (indicatorBuyScore / indicatorCount) * weight;
          totalSellScore += (indicatorSellScore / indicatorCount) * weight;
        }
        totalWeight += weight;
      }
      
      // 6. ML Analysis Score
      if (mlAnalysis && mlAnalysis.analysis) {
        const weight = this.componentWeights.ml;
        let mlBuyScore = 0;
        let mlSellScore = 0;
        let mlCount = 0;
        
        for (const [timeframe, mlData] of mlAnalysis.analysis) {
          if (mlData.ensemble && mlData.ensemble.direction) {
            if (mlData.ensemble.direction === 'UP') {
              mlBuyScore += mlData.ensemble.confidence || 0.5;
            } else if (mlData.ensemble.direction === 'DOWN') {
              mlSellScore += mlData.ensemble.confidence || 0.5;
            }
            mlCount++;
          }
        }
        
        if (mlCount > 0) {
          totalBuyScore += (mlBuyScore / mlCount) * weight;
          totalSellScore += (mlSellScore / mlCount) * weight;
        }
        totalWeight += weight;
      }
      
      // 7. Quantum Analysis Score
      if (quantumAnalysis && quantumAnalysis.analysis) {
        const weight = this.componentWeights.quantum;
        // Simplified quantum scoring
        for (const [timeframe, quantumData] of quantumAnalysis.analysis) {
          if (quantumData.superposition > 0.6) {
            totalBuyScore += quantumData.superposition * weight;
          } else if (quantumData.superposition < 0.4) {
            totalSellScore += (1 - quantumData.superposition) * weight;
          }
        }
        totalWeight += weight;
      }
      
      // 8. Psychological Analysis Score
      if (psychologicalAnalysis && psychologicalAnalysis.analysis) {
        const weight = this.componentWeights.psychological;
        for (const [timeframe, psychData] of psychologicalAnalysis.analysis) {
          if (psychData.sentiment === 'BULLISH') {
            totalBuyScore += 0.7 * weight;
          } else if (psychData.sentiment === 'BEARISH') {
            totalSellScore += 0.7 * weight;
          }
        }
        totalWeight += weight;
      }
      
      // Calculate final scores
      const finalBuyScore = totalWeight > 0 ? totalBuyScore / totalWeight : 0;
      const finalSellScore = totalWeight > 0 ? totalSellScore / totalWeight : 0;
      
      // Generate signal
      let signal = 'HOLD';
      let confidence = 0;
      let entryPrice = null;
      let exitPrice = null;
      let stopLoss = null;
      let takeProfit = null;
      
      if (finalBuyScore > finalSellScore && finalBuyScore > 0.75) {
        signal = 'BUY';
        confidence = finalBuyScore;
        
        // Calculate precise entry/exit prices for 0.6 USDT profit
        const currentPrice = this.getCurrentPrice(symbol, analysisResults);
        if (currentPrice) {
          entryPrice = currentPrice;
          
          // For 0.6 USDT profit with 5 USDT order and 10x leverage
          // Need 1.2% price movement (0.6 / (5 * 10) = 0.012)
          takeProfit = entryPrice * 1.012; // 1.2% above entry
          stopLoss = entryPrice * 0.9975;  // 0.25% below entry
          exitPrice = takeProfit;
        }
        
      } else if (finalSellScore > finalBuyScore && finalSellScore > 0.75) {
        signal = 'SELL';
        confidence = finalSellScore;
        
        // Calculate precise entry/exit prices for 0.6 USDT profit
        const currentPrice = this.getCurrentPrice(symbol, analysisResults);
        if (currentPrice) {
          entryPrice = currentPrice;
          
          // For 0.6 USDT profit with 5 USDT order and 10x leverage
          // Need 1.2% price movement (0.6 / (5 * 10) = 0.012)
          takeProfit = entryPrice * 0.988;  // 1.2% below entry
          stopLoss = entryPrice * 1.0025;   // 0.25% above entry
          exitPrice = takeProfit;
        }
      }
      
      return {
        symbol: symbol,
        signal: signal,
        confidence: confidence,
        entryPrice: entryPrice,
        exitPrice: exitPrice,
        stopLoss: stopLoss,
        takeProfit: takeProfit,
        targetProfit: 0.6, // EXACT 0.6 USDT target
        scores: {
          buyScore: finalBuyScore,
          sellScore: finalSellScore,
          totalWeight: totalWeight
        },
        componentContributions: {
          candlestick: this.getComponentContribution(candlestickAnalysis, 'candlestick'),
          chart: this.getComponentContribution(chartAnalysis, 'chart'),
          mathematical: this.getComponentContribution(mathematicalAnalysis, 'mathematical'),
          volume: this.getComponentContribution(volumeAnalysis, 'volume'),
          indicators: this.getComponentContribution(indicatorAnalysis, 'indicators'),
          ml: this.getComponentContribution(mlAnalysis, 'ml'),
          quantum: this.getComponentContribution(quantumAnalysis, 'quantum'),
          psychological: this.getComponentContribution(psychologicalAnalysis, 'psychological')
        },
        timestamp: Date.now()
      };
      
    } catch (error) {
      return {
        symbol: symbol,
        signal: 'HOLD',
        confidence: 0,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }
  
  getCurrentPrice(symbol, analysisResults) {
    try {
      // Get current price from indicators analysis (most recent)
      if (analysisResults.indicatorAnalysis && analysisResults.indicatorAnalysis.analysis) {
        for (const [timeframe, indicators] of analysisResults.indicatorAnalysis.analysis) {
          if (timeframe === '1' && indicators.currentPrice) {
            return indicators.currentPrice;
          }
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  }
  
  getComponentContribution(componentAnalysis, componentName) {
    if (!componentAnalysis) return { active: false, weight: 0 };
    
    return {
      active: true,
      weight: this.componentWeights[componentName],
      data: componentAnalysis
    };
  }
}

module.exports = CollaborativeSignalGenerator;
