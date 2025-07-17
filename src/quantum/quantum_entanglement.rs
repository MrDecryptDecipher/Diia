//! Quantum Entanglement Module for OMNI Trading System
//!
//! This module implements quantum entanglement algorithms for identifying
//! correlated assets and market relationships.

use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use anyhow::Result;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EntangledPair {
    pub asset_a: String,
    pub asset_b: String,
    pub entanglement_strength: f64,
    pub correlation_coefficient: f64,
    pub phase_difference: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EntanglementResult {
    pub pairs: Vec<EntangledPair>,
    pub correlation_matrix: Vec<Vec<f64>>,
    pub bell_state_pairs: Vec<(String, String)>,
    pub entanglement_strength: f64,
    pub quantum_coherence: f64,
}

#[derive(Debug, Clone)]
pub struct QuantumEntanglement {
    entanglement_matrix: Vec<Vec<f64>>,
    correlation_threshold: f64,
    bell_pairs: Vec<(String, String)>,
    entanglement_strength: f64,
    quantum_state: HashMap<String, f64>,
}

impl QuantumEntanglement {
    pub fn new() -> Self {
        Self {
            entanglement_matrix: Vec::new(),
            correlation_threshold: 0.7,
            bell_pairs: Vec::new(),
            entanglement_strength: 0.0,
            quantum_state: HashMap::new(),
        }
    }

    pub async fn new() -> Result<Self> {
        Ok(Self::new())
    }

    pub fn calculate_entanglement(&mut self, assets: &[String], price_data: &HashMap<String, Vec<f64>>) -> Result<EntanglementResult> {
        // Create correlation matrix
        let correlation_matrix = self.create_correlation_matrix(assets, price_data)?;
        
        // Identify entangled pairs
        let entangled_pairs = self.identify_entangled_pairs(assets, &correlation_matrix)?;
        
        // Find Bell state pairs (maximally entangled)
        let bell_pairs = self.identify_bell_pairs(&correlation_matrix, assets)?;
        
        // Calculate overall entanglement strength
        let entanglement_strength = self.calculate_entanglement_strength(&correlation_matrix)?;
        
        // Calculate quantum coherence
        let quantum_coherence = self.calculate_quantum_coherence(&entangled_pairs)?;
        
        Ok(EntanglementResult {
            pairs: entangled_pairs,
            correlation_matrix,
            bell_state_pairs: bell_pairs,
            entanglement_strength,
            quantum_coherence,
        })
    }

    fn create_correlation_matrix(&self, assets: &[String], price_data: &HashMap<String, Vec<f64>>) -> Result<Vec<Vec<f64>>> {
        let n = assets.len();
        let mut matrix = vec![vec![0.0; n]; n];
        
        for i in 0..n {
            for j in 0..n {
                if i == j {
                    matrix[i][j] = 1.0;
                } else if let (Some(data_i), Some(data_j)) = (price_data.get(&assets[i]), price_data.get(&assets[j])) {
                    matrix[i][j] = self.calculate_correlation(data_i, data_j)?;
                }
            }
        }
        
        Ok(matrix)
    }

    fn calculate_correlation(&self, data_a: &[f64], data_b: &[f64]) -> Result<f64> {
        if data_a.len() != data_b.len() || data_a.is_empty() {
            return Ok(0.0);
        }

        let n = data_a.len() as f64;
        let mean_a = data_a.iter().sum::<f64>() / n;
        let mean_b = data_b.iter().sum::<f64>() / n;

        let mut numerator = 0.0;
        let mut sum_sq_a = 0.0;
        let mut sum_sq_b = 0.0;

        for i in 0..data_a.len() {
            let diff_a = data_a[i] - mean_a;
            let diff_b = data_b[i] - mean_b;
            
            numerator += diff_a * diff_b;
            sum_sq_a += diff_a * diff_a;
            sum_sq_b += diff_b * diff_b;
        }

        let denominator = (sum_sq_a * sum_sq_b).sqrt();
        
        if denominator == 0.0 {
            Ok(0.0)
        } else {
            Ok(numerator / denominator)
        }
    }

    fn identify_entangled_pairs(&self, assets: &[String], correlation_matrix: &[Vec<f64>]) -> Result<Vec<EntangledPair>> {
        let mut pairs = Vec::new();
        
        for i in 0..assets.len() {
            for j in (i + 1)..assets.len() {
                let correlation = correlation_matrix[i][j].abs();
                
                if correlation >= self.correlation_threshold {
                    let entanglement_strength = self.calculate_pair_entanglement_strength(correlation);
                    let phase_difference = self.calculate_phase_difference(correlation);
                    
                    pairs.push(EntangledPair {
                        asset_a: assets[i].clone(),
                        asset_b: assets[j].clone(),
                        entanglement_strength,
                        correlation_coefficient: correlation_matrix[i][j],
                        phase_difference,
                    });
                }
            }
        }
        
        // Sort by entanglement strength
        pairs.sort_by(|a, b| b.entanglement_strength.partial_cmp(&a.entanglement_strength).unwrap());
        
        Ok(pairs)
    }

    fn identify_bell_pairs(&self, correlation_matrix: &[Vec<f64>], assets: &[String]) -> Result<Vec<(String, String)>> {
        let mut bell_pairs = Vec::new();
        
        for i in 0..assets.len() {
            for j in (i + 1)..assets.len() {
                let correlation = correlation_matrix[i][j].abs();
                
                // Bell pairs have near-perfect correlation (>0.9)
                if correlation > 0.9 {
                    bell_pairs.push((assets[i].clone(), assets[j].clone()));
                }
            }
        }
        
        Ok(bell_pairs)
    }

    fn calculate_entanglement_strength(&self, correlation_matrix: &[Vec<f64>]) -> Result<f64> {
        let mut total_strength = 0.0;
        let mut count = 0;
        
        for i in 0..correlation_matrix.len() {
            for j in (i + 1)..correlation_matrix[i].len() {
                let correlation = correlation_matrix[i][j].abs();
                if correlation >= self.correlation_threshold {
                    total_strength += self.calculate_pair_entanglement_strength(correlation);
                    count += 1;
                }
            }
        }
        
        if count > 0 {
            Ok(total_strength / count as f64)
        } else {
            Ok(0.0)
        }
    }

    fn calculate_pair_entanglement_strength(&self, correlation: f64) -> f64 {
        // Convert correlation to entanglement strength using quantum formula
        // E = -log2(1 - |correlation|^2)
        let correlation_squared = correlation * correlation;
        if correlation_squared >= 1.0 {
            10.0 // Maximum entanglement
        } else {
            -(1.0 - correlation_squared).log2()
        }
    }

    fn calculate_phase_difference(&self, correlation: f64) -> f64 {
        // Calculate phase difference based on correlation
        if correlation >= 0.0 {
            0.0 // In phase
        } else {
            std::f64::consts::PI // Out of phase
        }
    }

    fn calculate_quantum_coherence(&self, pairs: &[EntangledPair]) -> Result<f64> {
        if pairs.is_empty() {
            return Ok(0.0);
        }
        
        let total_coherence: f64 = pairs.iter()
            .map(|pair| pair.entanglement_strength * pair.correlation_coefficient.abs())
            .sum();
        
        Ok(total_coherence / pairs.len() as f64)
    }

    pub fn get_entanglement_strength(&self) -> f64 {
        self.entanglement_strength
    }

    pub fn get_bell_pairs(&self) -> &Vec<(String, String)> {
        &self.bell_pairs
    }
}

impl Default for QuantumEntanglement {
    fn default() -> Self {
        Self::new()
    }
}
