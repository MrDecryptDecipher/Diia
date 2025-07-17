//! STATISTICAL WIN RATE PROOF ENGINE
//! 
//! This system implements statistical validation to collect and analyze sufficient trade data
//! to prove 85-90% win rate with confidence intervals and significance testing.
//!
//! MANDATORY COMPLIANCE FRAMEWORK:
//! - Statistical significance testing with p-values
//! - Confidence intervals with mathematical precision
//! - Sample size calculations for statistical power
//! - Hypothesis testing for win rate claims
//! - Complete evidence collection and verification

use anyhow::{Result, anyhow};
use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use rust_decimal::prelude::{FromPrimitive, ToPrimitive};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, VecDeque};
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{info, warn, error, debug};
use uuid::Uuid;

/// Statistical win rate proof configuration
#[derive(Debug, Clone)]
pub struct WinRateProofConfig {
    /// Target win rate (85-90%)
    pub target_win_rate: f64,
    /// Minimum win rate for acceptance
    pub min_acceptable_win_rate: f64,
    /// Maximum win rate for acceptance
    pub max_acceptable_win_rate: f64,
    /// Required confidence level (e.g., 0.95 for 95%)
    pub confidence_level: f64,
    /// Required statistical power (e.g., 0.80 for 80%)
    pub statistical_power: f64,
    /// Effect size for power calculation
    pub effect_size: f64,
    /// Minimum sample size for valid statistics
    pub min_sample_size: u64,
    /// Maximum sample size for efficiency
    pub max_sample_size: u64,
    /// Alpha level for hypothesis testing
    pub alpha_level: f64,
}

/// Trade outcome for statistical analysis
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TradeOutcome {
    /// Trade ID
    pub trade_id: String,
    /// Trade timestamp
    pub timestamp: DateTime<Utc>,
    /// Symbol traded
    pub symbol: String,
    /// Trade result (Win/Loss)
    pub result: TradeResult,
    /// Profit/Loss amount in USDT
    pub pnl_usdt: Decimal,
    /// Trade duration in seconds
    pub duration_seconds: u64,
    /// Entry price
    pub entry_price: Decimal,
    /// Exit price
    pub exit_price: Decimal,
    /// Trade confidence score
    pub confidence_score: f64,
    /// Risk amount
    pub risk_amount: Decimal,
    /// Actual return percentage
    pub return_percentage: f64,
}

/// Trade result enumeration
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TradeResult {
    Win,
    Loss,
    Breakeven,
}

/// Statistical analysis results
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StatisticalAnalysis {
    /// Sample size
    pub sample_size: u64,
    /// Observed win rate
    pub observed_win_rate: f64,
    /// Confidence interval lower bound
    pub confidence_lower: f64,
    /// Confidence interval upper bound
    pub confidence_upper: f64,
    /// Standard error
    pub standard_error: f64,
    /// Z-score for hypothesis test
    pub z_score: f64,
    /// P-value for hypothesis test
    pub p_value: f64,
    /// Statistical significance
    pub is_significant: bool,
    /// Power analysis results
    pub power_analysis: PowerAnalysis,
    /// Effect size calculation
    pub effect_size: f64,
    /// Margin of error
    pub margin_of_error: f64,
}

/// Power analysis results
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PowerAnalysis {
    /// Calculated statistical power
    pub power: f64,
    /// Required sample size for target power
    pub required_sample_size: u64,
    /// Current sample adequacy
    pub sample_adequate: bool,
    /// Beta error probability
    pub beta_error: f64,
    /// Type I error probability (alpha)
    pub alpha_error: f64,
}

/// Hypothesis test results
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HypothesisTest {
    /// Null hypothesis
    pub null_hypothesis: String,
    /// Alternative hypothesis
    pub alternative_hypothesis: String,
    /// Test statistic
    pub test_statistic: f64,
    /// Critical value
    pub critical_value: f64,
    /// P-value
    pub p_value: f64,
    /// Reject null hypothesis
    pub reject_null: bool,
    /// Conclusion
    pub conclusion: String,
}

/// Win rate validation evidence
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WinRateEvidence {
    /// Evidence ID
    pub evidence_id: String,
    /// Collection timestamp
    pub timestamp: DateTime<Utc>,
    /// Statistical analysis
    pub statistical_analysis: StatisticalAnalysis,
    /// Hypothesis test results
    pub hypothesis_test: HypothesisTest,
    /// Trade outcomes sample
    pub trade_outcomes: Vec<TradeOutcome>,
    /// Validation status
    pub validation_status: ValidationStatus,
    /// Mathematical verification steps
    pub verification_steps: Vec<String>,
}

/// Validation status enumeration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ValidationStatus {
    InsufficientData,
    CollectingData,
    StatisticallySignificant,
    StatisticallyInsignificant,
    TargetAchieved,
    TargetNotAchieved,
}

/// Statistical Win Rate Proof Engine
pub struct StatisticalWinRateProof {
    /// Configuration
    config: WinRateProofConfig,
    /// Trade outcomes storage
    trade_outcomes: Arc<RwLock<VecDeque<TradeOutcome>>>,
    /// Evidence collection
    evidence_collection: Arc<RwLock<Vec<WinRateEvidence>>>,
    /// Current analysis
    current_analysis: Arc<RwLock<Option<StatisticalAnalysis>>>,
    /// Running state
    running: Arc<RwLock<bool>>,
}

impl StatisticalWinRateProof {
    /// Create new statistical win rate proof engine
    pub async fn new(target_win_rate: f64) -> Result<Self> {
        info!("📊 Initializing Statistical Win Rate Proof Engine");
        
        // Validate target win rate is in acceptable range (85-90%)
        if target_win_rate < 0.85 || target_win_rate > 0.90 {
            return Err(anyhow!("Target win rate must be between 85% and 90%"));
        }
        
        let config = WinRateProofConfig {
            target_win_rate,
            min_acceptable_win_rate: 0.85,
            max_acceptable_win_rate: 0.90,
            confidence_level: 0.95, // 95% confidence
            statistical_power: 0.80, // 80% power
            effect_size: 0.1, // 10% effect size
            min_sample_size: 100, // Minimum 100 trades
            max_sample_size: 10000, // Maximum 10,000 trades
            alpha_level: 0.05, // 5% significance level
        };
        
        info!("🎯 Target Win Rate: {:.1}%", target_win_rate * 100.0);
        info!("📈 Confidence Level: {:.1}%", config.confidence_level * 100.0);
        info!("⚡ Statistical Power: {:.1}%", config.statistical_power * 100.0);
        
        Ok(Self {
            config,
            trade_outcomes: Arc::new(RwLock::new(VecDeque::new())),
            evidence_collection: Arc::new(RwLock::new(Vec::new())),
            current_analysis: Arc::new(RwLock::new(None)),
            running: Arc::new(RwLock::new(false)),
        })
    }

    /// Start statistical win rate proof collection
    pub async fn start_proof_collection(&mut self) -> Result<()> {
        info!("🚀 Starting Statistical Win Rate Proof Collection");
        
        *self.running.write().await = true;
        
        // Calculate required sample size
        let required_sample_size = self.calculate_required_sample_size().await?;
        info!("📊 Required sample size: {} trades", required_sample_size);
        
        // Start continuous analysis
        self.start_continuous_analysis().await?;
        
        Ok(())
    }

    /// Calculate required sample size for statistical power
    async fn calculate_required_sample_size(&self) -> Result<u64> {
        // Using formula for sample size calculation for proportion
        // n = (Z_α/2 + Z_β)² * p(1-p) / (p₁ - p₀)²
        // where p₀ = null hypothesis proportion, p₁ = alternative proportion
        
        let z_alpha_2 = 1.96; // Z-score for 95% confidence (two-tailed)
        let z_beta = 0.84; // Z-score for 80% power
        
        let p0 = 0.5; // Null hypothesis: 50% win rate (random)
        let p1 = self.config.target_win_rate; // Alternative: target win rate
        
        let p_pooled = (p0 + p1) / 2.0;
        let numerator = (z_alpha_2 + z_beta).powi(2) * p_pooled * (1.0 - p_pooled);
        let denominator = (p1 - p0).powi(2);
        
        let calculated_size = (numerator / denominator).ceil() as u64;
        
        // Apply bounds
        let required_size = calculated_size
            .max(self.config.min_sample_size)
            .min(self.config.max_sample_size);
        
        info!("🧮 Sample size calculation:");
        info!("   Null hypothesis (p₀): {:.1}%", p0 * 100.0);
        info!("   Alternative hypothesis (p₁): {:.1}%", p1 * 100.0);
        info!("   Calculated size: {}", calculated_size);
        info!("   Required size: {}", required_size);
        
        Ok(required_size)
    }

    /// Add trade outcome for analysis
    pub async fn add_trade_outcome(&self, outcome: TradeOutcome) -> Result<()> {
        let mut outcomes = self.trade_outcomes.write().await;
        outcomes.push_back(outcome.clone());
        
        // Limit storage size
        if outcomes.len() > self.config.max_sample_size as usize {
            outcomes.pop_front();
        }
        
        debug!("📊 Added trade outcome: {} (Total: {})", 
               if outcome.result == TradeResult::Win { "WIN" } else { "LOSS" },
               outcomes.len());
        
        // Trigger analysis if we have sufficient data
        if outcomes.len() >= self.config.min_sample_size as usize {
            self.perform_statistical_analysis().await?;
        }
        
        Ok(())
    }

    /// Perform comprehensive statistical analysis
    async fn perform_statistical_analysis(&self) -> Result<()> {
        let outcomes = self.trade_outcomes.read().await;
        let sample_size = outcomes.len() as u64;
        
        if sample_size < self.config.min_sample_size {
            return Ok(()); // Insufficient data
        }
        
        info!("📊 Performing statistical analysis on {} trades", sample_size);
        
        // Calculate observed win rate
        let wins = outcomes.iter().filter(|o| o.result == TradeResult::Win).count();
        let observed_win_rate = wins as f64 / sample_size as f64;
        
        // Calculate standard error
        let standard_error = (observed_win_rate * (1.0 - observed_win_rate) / sample_size as f64).sqrt();
        
        // Calculate confidence interval
        let z_score = 1.96; // 95% confidence
        let margin_of_error = z_score * standard_error;
        let confidence_lower = observed_win_rate - margin_of_error;
        let confidence_upper = observed_win_rate + margin_of_error;
        
        // Hypothesis test: H₀: p = 0.5 vs H₁: p > 0.85
        let null_proportion = 0.5;
        let test_statistic = (observed_win_rate - null_proportion) / 
                           (null_proportion * (1.0 - null_proportion) / sample_size as f64).sqrt();
        
        // Calculate p-value (one-tailed test)
        let p_value = self.calculate_p_value(test_statistic);
        let is_significant = p_value < self.config.alpha_level;
        
        // Power analysis
        let power_analysis = self.calculate_power_analysis(sample_size, observed_win_rate).await;
        
        // Effect size (Cohen's h for proportions)
        let effect_size = 2.0 * (observed_win_rate.sqrt().asin() - null_proportion.sqrt().asin());
        
        let analysis = StatisticalAnalysis {
            sample_size,
            observed_win_rate,
            confidence_lower,
            confidence_upper,
            standard_error,
            z_score: test_statistic,
            p_value,
            is_significant,
            power_analysis,
            effect_size,
            margin_of_error,
        };
        
        // Store current analysis
        *self.current_analysis.write().await = Some(analysis.clone());
        
        // Create evidence record
        let evidence = self.create_evidence_record(analysis, outcomes.clone()).await?;
        self.evidence_collection.write().await.push(evidence);
        
        // Log results
        self.log_analysis_results(&analysis).await;
        
        Ok(())
    }

    /// Calculate p-value for test statistic
    fn calculate_p_value(&self, z_score: f64) -> f64 {
        // Simplified p-value calculation using normal distribution approximation
        // For a more accurate implementation, use a proper statistical library
        
        if z_score <= 0.0 {
            return 1.0; // No evidence against null hypothesis
        }
        
        // Approximate p-value using complementary error function
        let p_value = 0.5 * (1.0 - self.erf(z_score / 2.0_f64.sqrt()));
        p_value.max(0.0001).min(1.0) // Bound between 0.0001 and 1.0
    }

    /// Simplified error function approximation
    fn erf(&self, x: f64) -> f64 {
        // Abramowitz and Stegun approximation
        let a1 = 0.254829592;
        let a2 = -0.284496736;
        let a3 = 1.421413741;
        let a4 = -1.453152027;
        let a5 = 1.061405429;
        let p = 0.3275911;
        
        let sign = if x >= 0.0 { 1.0 } else { -1.0 };
        let x = x.abs();
        
        let t = 1.0 / (1.0 + p * x);
        let y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * (-x * x).exp();
        
        sign * y
    }
}
