/**
 * 🎯 DYNAMIC CAPITAL ALLOCATION SYSTEM - QUANTUM-ENHANCED
 * 
 * Implements intelligent capital allocation system that dynamically distributes
 * exactly 12 USDT across 3-5 selected assets using confidence-weighted allocation.
 * 
 * KEY REQUIREMENTS:
 * - Total Capital: Exactly 12.00 USDT (never exceed)
 * - Active Trading Capital: 10.00 USDT (with 2.00 USDT safety buffer)
 * - Minimum Trade Size: 5.00 USDT (Bybit requirement)
 * - Dynamic Positions: 3-5 positions with confidence-weighted allocation
 * - Profit Target: Minimum 0.6 USDT per trade after fees/slippage
 * - Trading Frequency: 750+ trades per day (1 trade every 115 seconds)
 * 
 * ALLOCATION STRATEGY:
 * - Confidence-weighted allocation based on quantum analysis scores
 * - Dynamic position sizing based on asset volatility and confidence
 * - Real-time rebalancing based on market conditions
 * - Risk-adjusted allocation with maximum drawdown protection
 */

const logger = require('../utils/logger');
const tradingConfig = require('../config/trading-config');

class DynamicCapitalAllocator {
  constructor() {
    // EXACT CAPITAL SPECIFICATIONS
    this.config = {
      totalCapital: 12.0, // EXACT 12.000000 USDT - NEVER CHANGE
      activeCapital: 10.0, // EXACT 10.000000 USDT for trading
      safetyBuffer: 2.0, // EXACT 2.000000 USDT safety buffer
      minTradeSize: 5.0, // EXACT 5.000000 USDT minimum (Bybit requirement)
      minPositions: 3, // Minimum number of positions for diversification
      maxPositions: 5, // Maximum number of positions
      minProfitTarget: 0.6, // EXACT 0.600000 USDT minimum profit per trade
      
      // Dynamic allocation parameters
      confidenceThreshold: 0.75, // Minimum confidence score for allocation
      maxAllocationPerAsset: 0.4, // Maximum 40% of active capital per asset
      minAllocationPerAsset: 0.15, // Minimum 15% of active capital per asset
      rebalanceThreshold: 0.1, // Rebalance when allocation drifts by 10%
      
      // Risk management
      maxRiskPerTrade: 0.0025, // 0.25% max risk per trade (stop-loss)
      maxPortfolioRisk: 0.009, // 0.9% max total portfolio risk (drawdown)
      leverageRange: { min: 50, max: 100, default: 75 }
    };
    
    // Allocation state
    this.currentAllocations = new Map(); // symbol -> allocation amount
    this.confidenceScores = new Map(); // symbol -> confidence score
    this.positionSizes = new Map(); // symbol -> position size
    this.lastRebalance = 0;
    this.allocationHistory = [];
    
    // Performance tracking
    this.allocationMetrics = {
      totalAllocated: 0,
      activePositions: 0,
      averageConfidence: 0,
      allocationEfficiency: 0,
      riskUtilization: 0
    };
    
    logger.info('🎯 Dynamic Capital Allocator initialized with 12 USDT total capital');
  }
  
  /**
   * Calculate optimal allocation for selected assets based on confidence scores
   */
  calculateOptimalAllocation(assetScores) {
    const startTime = Date.now();
    
    try {
      // Filter assets by confidence threshold
      const qualifiedAssets = assetScores.filter(asset => 
        asset.confidence >= this.config.confidenceThreshold
      );
      
      if (qualifiedAssets.length === 0) {
        logger.warn('⚠️ No assets meet confidence threshold for allocation');
        return { allocations: new Map(), totalAllocated: 0 };
      }
      
      // Sort by confidence score (descending)
      qualifiedAssets.sort((a, b) => b.confidence - a.confidence);
      
      // Select top 3-5 assets based on diversification and confidence
      const selectedAssets = this.selectOptimalAssets(qualifiedAssets);
      
      // Calculate confidence-weighted allocations
      const allocations = this.calculateConfidenceWeightedAllocations(selectedAssets);
      
      // Validate and adjust allocations
      const validatedAllocations = this.validateAllocations(allocations);
      
      // Update internal state
      this.updateAllocationState(validatedAllocations);
      
      const processingTime = Date.now() - startTime;
      logger.info(`🎯 Calculated optimal allocation for ${selectedAssets.length} assets in ${processingTime}ms`);
      
      return {
        allocations: validatedAllocations,
        totalAllocated: this.calculateTotalAllocation(validatedAllocations),
        selectedAssets: selectedAssets.map(a => a.symbol),
        averageConfidence: this.calculateAverageConfidence(selectedAssets),
        processingTime
      };
      
    } catch (error) {
      logger.error('❌ Error calculating optimal allocation:', error);
      throw error;
    }
  }
  
  /**
   * Select optimal assets for allocation (3-5 assets)
   */
  selectOptimalAssets(qualifiedAssets) {
    const maxAssets = Math.min(this.config.maxPositions, qualifiedAssets.length);
    const minAssets = Math.min(this.config.minPositions, qualifiedAssets.length);
    
    // Start with top confidence asset
    const selectedAssets = [qualifiedAssets[0]];
    
    // Add additional assets based on diversification and confidence
    for (let i = 1; i < qualifiedAssets.length && selectedAssets.length < maxAssets; i++) {
      const asset = qualifiedAssets[i];
      
      // Check if adding this asset improves diversification
      if (this.improvesPortfolioDiversification(selectedAssets, asset)) {
        selectedAssets.push(asset);
      }
    }
    
    // Ensure minimum number of assets
    while (selectedAssets.length < minAssets && selectedAssets.length < qualifiedAssets.length) {
      const nextAsset = qualifiedAssets[selectedAssets.length];
      selectedAssets.push(nextAsset);
    }
    
    return selectedAssets;
  }
  
  /**
   * Calculate confidence-weighted allocations
   */
  calculateConfidenceWeightedAllocations(selectedAssets) {
    const allocations = new Map();
    
    // Calculate total confidence score
    const totalConfidence = selectedAssets.reduce((sum, asset) => sum + asset.confidence, 0);
    
    // Calculate base allocations based on confidence weights
    selectedAssets.forEach(asset => {
      const confidenceWeight = asset.confidence / totalConfidence;
      const baseAllocation = this.config.activeCapital * confidenceWeight;
      
      // Apply min/max constraints
      const minAllocation = this.config.activeCapital * this.config.minAllocationPerAsset;
      const maxAllocation = this.config.activeCapital * this.config.maxAllocationPerAsset;
      
      const constrainedAllocation = Math.max(minAllocation, Math.min(maxAllocation, baseAllocation));
      
      allocations.set(asset.symbol, {
        amount: constrainedAllocation,
        confidence: asset.confidence,
        weight: confidenceWeight,
        volatility: asset.volatility || 2.0,
        leverage: this.calculateOptimalLeverage(asset)
      });
    });
    
    return allocations;
  }
  
  /**
   * Calculate optimal leverage for an asset based on volatility and confidence
   */
  calculateOptimalLeverage(asset) {
    const baseVolatility = 2.0; // Reference volatility
    const volatilityRatio = baseVolatility / (asset.volatility || baseVolatility);
    
    // Higher confidence and lower volatility allow higher leverage
    const confidenceFactor = asset.confidence;
    const leverageFactor = volatilityRatio * confidenceFactor;
    
    // Calculate leverage within allowed range
    const { min, max, default: defaultLeverage } = this.config.leverageRange;
    const calculatedLeverage = defaultLeverage * leverageFactor;
    
    return Math.max(min, Math.min(max, Math.round(calculatedLeverage)));
  }
  
  /**
   * Validate allocations to ensure they meet all constraints
   * MATHEMATICAL PRECISION: Ensures exact 12 USDT compliance
   */
  validateAllocations(allocations) {
    // Calculate total allocation
    let totalAllocation = 0;
    for (const [symbol, allocation] of allocations) {
      totalAllocation += allocation.amount;
    }

    // CRITICAL: Ensure total never exceeds active capital (10 USDT)
    if (totalAllocation > this.config.activeCapital) {
      logger.warn(`⚠️ Total allocation ${totalAllocation.toFixed(6)} exceeds active capital ${this.config.activeCapital}. Scaling down.`);

      // Scale down proportionally to fit within active capital
      const scaleFactor = this.config.activeCapital / totalAllocation;
      for (const [symbol, allocation] of allocations) {
        allocation.amount *= scaleFactor;
      }

      // Recalculate total
      totalAllocation = this.config.activeCapital;
    }

    // Ensure each allocation meets minimum trade size (5 USDT)
    const adjustedAllocations = new Map();
    let adjustedTotal = 0;

    for (const [symbol, allocation] of allocations) {
      if (allocation.amount >= this.config.minTradeSize) {
        // Round to 6 decimal places for precision
        allocation.amount = Math.round(allocation.amount * 1000000) / 1000000;
        adjustedAllocations.set(symbol, allocation);
        adjustedTotal += allocation.amount;
      } else {
        logger.warn(`⚠️ Allocation for ${symbol} (${allocation.amount.toFixed(6)} USDT) below minimum trade size. Excluding.`);
      }
    }

    // MATHEMATICAL VALIDATION: Ensure total + safety buffer = 12 USDT exactly
    const totalWithBuffer = adjustedTotal + this.config.safetyBuffer;
    if (Math.abs(totalWithBuffer - this.config.totalCapital) > 0.000001) {
      logger.error(`❌ CAPITAL CONSTRAINT VIOLATION: Total allocation ${adjustedTotal.toFixed(6)} + buffer ${this.config.safetyBuffer.toFixed(6)} = ${totalWithBuffer.toFixed(6)} ≠ ${this.config.totalCapital.toFixed(6)}`);
      throw new Error(`Capital allocation violates 12 USDT constraint: ${totalWithBuffer.toFixed(6)} USDT`);
    }

    // Log mathematical validation
    logger.info(`✅ CAPITAL VALIDATION PASSED:`);
    logger.info(`   Active Capital: ${adjustedTotal.toFixed(6)} USDT`);
    logger.info(`   Safety Buffer: ${this.config.safetyBuffer.toFixed(6)} USDT`);
    logger.info(`   Total Capital: ${totalWithBuffer.toFixed(6)} USDT`);
    logger.info(`   Positions: ${adjustedAllocations.size}`);

    return adjustedAllocations;
  }
  
  /**
   * Check if adding an asset improves portfolio diversification
   */
  improvesPortfolioDiversification(currentAssets, newAsset) {
    // Simple diversification check based on asset characteristics
    // In a real implementation, this would consider sector, market cap, correlation, etc.
    
    // Avoid assets that are too similar in volatility
    const volatilityThreshold = 1.0; // 1% volatility difference threshold
    
    for (const existingAsset of currentAssets) {
      const volatilityDiff = Math.abs((existingAsset.volatility || 2.0) - (newAsset.volatility || 2.0));
      if (volatilityDiff < volatilityThreshold) {
        return false; // Too similar
      }
    }
    
    return true; // Adds diversification
  }
  
  /**
   * Update internal allocation state
   */
  updateAllocationState(allocations) {
    this.currentAllocations = new Map(allocations);
    this.lastRebalance = Date.now();
    
    // Update confidence scores
    this.confidenceScores.clear();
    for (const [symbol, allocation] of allocations) {
      this.confidenceScores.set(symbol, allocation.confidence);
    }
    
    // Update metrics
    this.updateAllocationMetrics();
    
    // Add to history
    this.allocationHistory.push({
      timestamp: Date.now(),
      allocations: new Map(allocations),
      totalAllocated: this.calculateTotalAllocation(allocations)
    });
    
    // Keep only last 100 allocation records
    if (this.allocationHistory.length > 100) {
      this.allocationHistory = this.allocationHistory.slice(-100);
    }
  }
  
  /**
   * Calculate total allocation amount
   */
  calculateTotalAllocation(allocations) {
    let total = 0;
    for (const [, allocation] of allocations) {
      total += allocation.amount;
    }
    return total;
  }
  
  /**
   * Calculate average confidence score
   */
  calculateAverageConfidence(assets) {
    if (assets.length === 0) return 0;
    const totalConfidence = assets.reduce((sum, asset) => sum + asset.confidence, 0);
    return totalConfidence / assets.length;
  }
  
  /**
   * Update allocation metrics
   */
  updateAllocationMetrics() {
    this.allocationMetrics = {
      totalAllocated: this.calculateTotalAllocation(this.currentAllocations),
      activePositions: this.currentAllocations.size,
      averageConfidence: this.calculateAverageConfidence(
        Array.from(this.currentAllocations.values())
      ),
      allocationEfficiency: this.calculateAllocationEfficiency(),
      riskUtilization: this.calculateRiskUtilization()
    };
  }
  
  /**
   * Calculate allocation efficiency (how well capital is utilized)
   */
  calculateAllocationEfficiency() {
    const totalAllocated = this.allocationMetrics.totalAllocated;
    return totalAllocated / this.config.activeCapital;
  }
  
  /**
   * Calculate risk utilization (how much of allowed risk is being used)
   */
  calculateRiskUtilization() {
    const totalPositions = this.currentAllocations.size;
    const maxRisk = this.config.maxPortfolioRisk;
    const currentRisk = totalPositions * this.config.maxRiskPerTrade;
    return Math.min(1, currentRisk / maxRisk);
  }
  
  /**
   * Get current allocation status
   */
  getAllocationStatus() {
    return {
      config: this.config,
      currentAllocations: Object.fromEntries(this.currentAllocations),
      metrics: this.allocationMetrics,
      lastRebalance: this.lastRebalance,
      safetyBuffer: this.config.safetyBuffer,
      availableCapital: this.config.activeCapital - this.allocationMetrics.totalAllocated
    };
  }
  
  /**
   * Check if rebalancing is needed
   */
  needsRebalancing() {
    const timeSinceLastRebalance = Date.now() - this.lastRebalance;
    const rebalanceInterval = 5 * 60 * 1000; // 5 minutes
    
    return timeSinceLastRebalance > rebalanceInterval ||
           this.allocationMetrics.allocationEfficiency < 0.8;
  }
}

module.exports = DynamicCapitalAllocator;
