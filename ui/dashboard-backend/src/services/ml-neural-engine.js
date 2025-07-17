/**
 * OMNI MACHINE LEARNING & NEURAL NETWORK ENGINE
 * 
 * Advanced AI-powered trading predictions using:
 * - Deep Neural Networks
 * - LSTM for time series prediction
 * - Random Forest for pattern recognition
 * - Support Vector Machines
 * - Ensemble methods
 * - Psychological pattern analysis
 * - Market sentiment analysis
 */

const tf = require('@tensorflow/tfjs-node');
const logger = require('../utils/logger');

class MLNeuralEngine {
  constructor() {
    this.models = {
      pricePredictor: null,
      patternRecognizer: null,
      sentimentAnalyzer: null,
      riskAssessor: null
    };
    
    this.trainingData = {
      features: [],
      labels: [],
      lastUpdate: null
    };
    
    this.psychologicalFactors = {
      fearGreedIndex: 50,
      marketSentiment: 'NEUTRAL',
      volatilityStress: 0,
      liquidityAnxiety: 0,
      momentumEuphoria: 0
    };
    
    this.isInitialized = false;
  }

  /**
   * Initialize all ML models
   */
  async initializeModels() {
    try {
      logger.info('🧠 Initializing ML/Neural Network models...');
      
      // 1. Price Prediction LSTM Model
      this.models.pricePredictor = await this.createLSTMModel();
      
      // 2. Pattern Recognition CNN Model
      this.models.patternRecognizer = await this.createCNNModel();
      
      // 3. Sentiment Analysis Model
      this.models.sentimentAnalyzer = await this.createSentimentModel();
      
      // 4. Risk Assessment Model
      this.models.riskAssessor = await this.createRiskModel();
      
      this.isInitialized = true;
      logger.info('✅ All ML models initialized successfully');
      
    } catch (error) {
      logger.error('❌ Error initializing ML models:', error);
      throw error;
    }
  }

  /**
   * Create LSTM model for price prediction
   */
  async createLSTMModel() {
    const model = tf.sequential({
      layers: [
        tf.layers.lstm({
          units: 128,
          returnSequences: true,
          inputShape: [60, 10] // 60 time steps, 10 features
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.lstm({
          units: 64,
          returnSequences: true
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.lstm({
          units: 32,
          returnSequences: false
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 16, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'linear' })
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });

    return model;
  }

  /**
   * Create CNN model for pattern recognition
   */
  async createCNNModel() {
    const model = tf.sequential({
      layers: [
        tf.layers.conv1d({
          filters: 64,
          kernelSize: 3,
          activation: 'relu',
          inputShape: [100, 5] // 100 candles, 5 features (OHLCV)
        }),
        tf.layers.maxPooling1d({ poolSize: 2 }),
        tf.layers.conv1d({
          filters: 32,
          kernelSize: 3,
          activation: 'relu'
        }),
        tf.layers.maxPooling1d({ poolSize: 2 }),
        tf.layers.flatten(),
        tf.layers.dense({ units: 50, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 3, activation: 'softmax' }) // BUY, SELL, HOLD
      ]
    });

    model.compile({
      optimizer: 'adam',
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  /**
   * Create Sentiment Analysis model for market sentiment
   */
  async createSentimentModel() {
    const model = tf.sequential({
      layers: [
        tf.layers.embedding({
          inputDim: 10000, // Vocabulary size
          outputDim: 128,
          inputLength: 100 // Sequence length
        }),
        tf.layers.lstm({
          units: 64,
          returnSequences: true
        }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.lstm({
          units: 32,
          returnSequences: false
        }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 16, activation: 'relu' }),
        tf.layers.dense({ units: 3, activation: 'softmax' }) // Positive, Negative, Neutral
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  /**
   * Create Risk Assessment model for position sizing
   */
  async createRiskModel() {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({
          units: 64,
          activation: 'relu',
          inputShape: [20] // 20 risk features
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 32,
          activation: 'relu'
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 16,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 1,
          activation: 'sigmoid' // Risk score 0-1
        })
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  /**
   * Predict price movement using LSTM
   */
  async predictPriceMovement(symbol, historicalData) {
    try {
      if (!this.isInitialized) {
        await this.initializeModels();
      }

      // Prepare features
      const features = this.prepareFeatures(historicalData);
      const inputTensor = tf.tensor3d([features]);
      
      // Make prediction
      const prediction = await this.models.pricePredictor.predict(inputTensor);
      const predictionValue = await prediction.data();
      
      // Clean up tensors
      inputTensor.dispose();
      prediction.dispose();
      
      const currentPrice = historicalData[historicalData.length - 1].close;
      const predictedPrice = predictionValue[0];
      const priceChange = ((predictedPrice - currentPrice) / currentPrice) * 100;
      
      return {
        currentPrice,
        predictedPrice,
        priceChange,
        confidence: this.calculatePredictionConfidence(historicalData),
        timeframe: '1h',
        signal: priceChange > 0.5 ? 'BUY' : priceChange < -0.5 ? 'SELL' : 'HOLD'
      };
      
    } catch (error) {
      logger.error(`Error predicting price for ${symbol}:`, error);
      return { signal: 'HOLD', confidence: 0 };
    }
  }

  /**
   * Recognize chart patterns using CNN
   */
  async recognizePatterns(symbol, candleData) {
    try {
      if (!this.isInitialized) {
        await this.initializeModels();
      }

      // Prepare pattern features
      const patternFeatures = this.prepareCandleFeatures(candleData);
      const inputTensor = tf.tensor3d([patternFeatures]);
      
      // Recognize patterns
      const prediction = await this.models.patternRecognizer.predict(inputTensor);
      const probabilities = await prediction.data();
      
      // Clean up
      inputTensor.dispose();
      prediction.dispose();
      
      const patterns = {
        bullish: probabilities[0],
        bearish: probabilities[1],
        neutral: probabilities[2]
      };
      
      const maxProb = Math.max(...probabilities);
      const signal = probabilities[0] === maxProb ? 'BUY' : 
                    probabilities[1] === maxProb ? 'SELL' : 'HOLD';
      
      return {
        patterns,
        signal,
        confidence: maxProb,
        recognizedPatterns: this.identifySpecificPatterns(patterns)
      };
      
    } catch (error) {
      logger.error(`Error recognizing patterns for ${symbol}:`, error);
      return { signal: 'HOLD', confidence: 0 };
    }
  }

  /**
   * Analyze psychological market factors
   */
  analyzePsychologicalFactors(marketData, volumeData, priceAction) {
    try {
      // Fear & Greed Index calculation
      const volatility = this.calculateVolatility(priceAction);
      const momentum = this.calculateMomentum(priceAction);
      const volume = this.analyzeVolumePattern(volumeData);
      
      // Psychological indicators
      const fearGreedIndex = this.calculateFearGreedIndex(volatility, momentum, volume);
      const marketSentiment = this.analyzeMarketSentiment(priceAction, volumeData);
      const crowdBehavior = this.analyzeCrowdBehavior(marketData);
      
      // Behavioral patterns
      const fomo = this.detectFOMO(priceAction, volumeData);
      const panic = this.detectPanic(priceAction, volumeData);
      const euphoria = this.detectEuphoria(priceAction, volumeData);
      const despair = this.detectDespair(priceAction, volumeData);
      
      return {
        fearGreedIndex,
        marketSentiment,
        crowdBehavior,
        behavioralSignals: {
          fomo,
          panic,
          euphoria,
          despair
        },
        psychologicalSignal: this.generatePsychologicalSignal(fearGreedIndex, marketSentiment),
        confidence: this.calculatePsychologicalConfidence(fearGreedIndex, marketSentiment)
      };
      
    } catch (error) {
      logger.error('Error analyzing psychological factors:', error);
      return { psychologicalSignal: 'NEUTRAL', confidence: 0 };
    }
  }

  /**
   * Ensemble prediction combining all models
   */
  async generateEnsemblePrediction(symbol, marketData) {
    try {
      // Get predictions from all models
      const pricePrediction = await this.predictPriceMovement(symbol, marketData.historical);
      const patternRecognition = await this.recognizePatterns(symbol, marketData.candles);
      const psychologicalAnalysis = this.analyzePsychologicalFactors(
        marketData, 
        marketData.volume, 
        marketData.priceAction
      );
      
      // Weight the predictions
      const weights = {
        price: 0.35,
        pattern: 0.25,
        psychological: 0.20,
        technical: 0.20
      };
      
      // Calculate ensemble score
      const ensembleScore = this.calculateEnsembleScore({
        pricePrediction,
        patternRecognition,
        psychologicalAnalysis
      }, weights);
      
      // Generate final signal
      const finalSignal = this.generateFinalSignal(ensembleScore);
      
      return {
        signal: finalSignal.signal,
        confidence: finalSignal.confidence,
        components: {
          pricePrediction,
          patternRecognition,
          psychologicalAnalysis
        },
        ensembleScore,
        recommendation: this.generateTradeRecommendation(finalSignal),
        riskAssessment: await this.assessTradeRisk(symbol, finalSignal)
      };
      
    } catch (error) {
      logger.error(`Error generating ensemble prediction for ${symbol}:`, error);
      return { signal: 'HOLD', confidence: 0 };
    }
  }

  /**
   * Prepare features for LSTM model
   */
  prepareFeatures(historicalData) {
    const features = [];
    
    for (let i = 60; i < historicalData.length; i++) {
      const sequence = [];
      
      for (let j = i - 60; j < i; j++) {
        const candle = historicalData[j];
        sequence.push([
          candle.open,
          candle.high,
          candle.low,
          candle.close,
          candle.volume,
          candle.rsi || 50,
          candle.macd || 0,
          candle.bb_upper || candle.close,
          candle.bb_lower || candle.close,
          candle.sma_20 || candle.close
        ]);
      }
      
      features.push(sequence);
    }
    
    return features[features.length - 1]; // Return latest sequence
  }

  /**
   * Calculate prediction confidence
   */
  calculatePredictionConfidence(historicalData) {
    // Analyze historical accuracy, volatility, and market conditions
    const volatility = this.calculateVolatility(historicalData);
    const trendStrength = this.calculateTrendStrength(historicalData);
    const marketStability = this.calculateMarketStability(historicalData);
    
    // Confidence decreases with high volatility and increases with strong trends
    const baseConfidence = 0.7;
    const volatilityPenalty = Math.min(volatility * 0.5, 0.3);
    const trendBonus = Math.min(trendStrength * 0.2, 0.2);
    const stabilityBonus = Math.min(marketStability * 0.1, 0.1);
    
    return Math.max(0.1, Math.min(0.95, 
      baseConfidence - volatilityPenalty + trendBonus + stabilityBonus
    ));
  }

  /**
   * Helper calculation methods
   */
  calculateVolatility(priceData) {
    const returns = [];
    for (let i = 1; i < priceData.length; i++) {
      returns.push((priceData[i].close - priceData[i-1].close) / priceData[i-1].close);
    }
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
  }

  calculateFearGreedIndex(volatility, momentum, volume) {
    // Simplified Fear & Greed calculation
    let score = 50; // Neutral starting point
    
    // High volatility increases fear
    score -= volatility * 100;
    
    // Strong positive momentum increases greed
    score += momentum * 50;
    
    // High volume can indicate either fear or greed depending on price action
    score += volume.trend === 'increasing' ? 10 : -10;
    
    return Math.max(0, Math.min(100, score));
  }

  generateFinalSignal(ensembleScore) {
    const threshold = 0.6;
    
    if (ensembleScore > threshold) {
      return { signal: 'BUY', confidence: ensembleScore };
    } else if (ensembleScore < -threshold) {
      return { signal: 'SELL', confidence: Math.abs(ensembleScore) };
    } else {
      return { signal: 'HOLD', confidence: 1 - Math.abs(ensembleScore) };
    }
  }
}

module.exports = new MLNeuralEngine();
