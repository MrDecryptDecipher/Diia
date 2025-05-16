//! Hyperdimensional Computing
//!
//! This module implements hyperdimensional computing for the OMNI-ALPHA VΩ∞∞ system,
//! enabling high-dimensional pattern recognition and symbolic reasoning.

use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use anyhow::Result;
use ndarray::{Array1, Array2, Axis};
use rand::prelude::*;
use rand_distr::{Normal, Distribution};

/// Hypervector dimension
const HD_DIMENSION: usize = 10000;

/// Hypervector
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Hypervector {
    /// Vector data
    pub data: Vec<f64>,
    
    /// Vector name
    pub name: String,
    
    /// Vector class
    pub class: String,
}

impl Hypervector {
    /// Create a new hypervector
    pub fn new(name: &str, class: &str) -> Self {
        let mut rng = thread_rng();
        let normal = Normal::new(0.0, 1.0).unwrap();
        
        let data = (0..HD_DIMENSION)
            .map(|_| normal.sample(&mut rng))
            .collect();
        
        Self {
            data,
            name: name.to_string(),
            class: class.to_string(),
        }
    }
    
    /// Create a new hypervector from data
    pub fn from_data(data: Vec<f64>, name: &str, class: &str) -> Self {
        Self {
            data,
            name: name.to_string(),
            class: class.to_string(),
        }
    }
    
    /// Normalize the hypervector
    pub fn normalize(&mut self) {
        let norm = self.data.iter().map(|x| x * x).sum::<f64>().sqrt();
        if norm > 0.0 {
            for i in 0..self.data.len() {
                self.data[i] /= norm;
            }
        }
    }
    
    /// Calculate cosine similarity with another hypervector
    pub fn cosine_similarity(&self, other: &Hypervector) -> f64 {
        let mut dot_product = 0.0;
        let mut norm_a = 0.0;
        let mut norm_b = 0.0;
        
        for i in 0..self.data.len().min(other.data.len()) {
            dot_product += self.data[i] * other.data[i];
            norm_a += self.data[i] * self.data[i];
            norm_b += other.data[i] * other.data[i];
        }
        
        if norm_a == 0.0 || norm_b == 0.0 {
            return 0.0;
        }
        
        dot_product / (norm_a.sqrt() * norm_b.sqrt())
    }
    
    /// Calculate Euclidean distance with another hypervector
    pub fn euclidean_distance(&self, other: &Hypervector) -> f64 {
        let mut sum_squared_diff = 0.0;
        
        for i in 0..self.data.len().min(other.data.len()) {
            let diff = self.data[i] - other.data[i];
            sum_squared_diff += diff * diff;
        }
        
        sum_squared_diff.sqrt()
    }
    
    /// Add another hypervector
    pub fn add(&self, other: &Hypervector) -> Hypervector {
        let mut result = self.clone();
        
        for i in 0..self.data.len().min(other.data.len()) {
            result.data[i] += other.data[i];
        }
        
        result
    }
    
    /// Subtract another hypervector
    pub fn subtract(&self, other: &Hypervector) -> Hypervector {
        let mut result = self.clone();
        
        for i in 0..self.data.len().min(other.data.len()) {
            result.data[i] -= other.data[i];
        }
        
        result
    }
    
    /// Multiply by scalar
    pub fn multiply(&self, scalar: f64) -> Hypervector {
        let mut result = self.clone();
        
        for i in 0..self.data.len() {
            result.data[i] *= scalar;
        }
        
        result
    }
    
    /// Element-wise multiply with another hypervector
    pub fn element_multiply(&self, other: &Hypervector) -> Hypervector {
        let mut result = self.clone();
        
        for i in 0..self.data.len().min(other.data.len()) {
            result.data[i] *= other.data[i];
        }
        
        result
    }
    
    /// Bind with another hypervector (circular convolution)
    pub fn bind(&self, other: &Hypervector) -> Hypervector {
        let n = self.data.len();
        let mut result = vec![0.0; n];
        
        for i in 0..n {
            for j in 0..n {
                let k = (i + j) % n;
                result[k] += self.data[i] * other.data[j];
            }
        }
        
        Hypervector::from_data(result, &format!("{}_bind_{}", self.name, other.name), "bind")
    }
    
    /// Unbind with another hypervector (circular correlation)
    pub fn unbind(&self, other: &Hypervector) -> Hypervector {
        let n = self.data.len();
        let mut result = vec![0.0; n];
        
        for i in 0..n {
            for j in 0..n {
                let k = (i - j + n) % n;
                result[i] += self.data[k] * other.data[j];
            }
        }
        
        Hypervector::from_data(result, &format!("{}_unbind_{}", self.name, other.name), "unbind")
    }
    
    /// Permute the hypervector
    pub fn permute(&self, shift: usize) -> Hypervector {
        let n = self.data.len();
        let mut result = vec![0.0; n];
        
        for i in 0..n {
            result[(i + shift) % n] = self.data[i];
        }
        
        Hypervector::from_data(result, &format!("{}_permute_{}", self.name, shift), "permute")
    }
}

/// Hyperdimensional memory
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HyperdimensionalMemory {
    /// Item memory (base vectors)
    pub item_memory: HashMap<String, Hypervector>,
    
    /// Associative memory (composite vectors)
    pub associative_memory: HashMap<String, Hypervector>,
    
    /// Class memory (class prototypes)
    pub class_memory: HashMap<String, Hypervector>,
}

impl HyperdimensionalMemory {
    /// Create a new hyperdimensional memory
    pub fn new() -> Self {
        Self {
            item_memory: HashMap::new(),
            associative_memory: HashMap::new(),
            class_memory: HashMap::new(),
        }
    }
    
    /// Add item to memory
    pub fn add_item(&mut self, name: &str, class: &str) -> &Hypervector {
        let vector = Hypervector::new(name, class);
        self.item_memory.insert(name.to_string(), vector);
        self.item_memory.get(name).unwrap()
    }
    
    /// Get item from memory
    pub fn get_item(&self, name: &str) -> Option<&Hypervector> {
        self.item_memory.get(name)
    }
    
    /// Add association to memory
    pub fn add_association(&mut self, name: &str, items: &[&str]) -> Result<&Hypervector> {
        let mut association = Hypervector::new(name, "association");
        
        for &item_name in items {
            let item = self.item_memory.get(item_name)
                .ok_or_else(|| anyhow::anyhow!("Item not found: {}", item_name))?;
            
            association = association.add(item);
        }
        
        association.normalize();
        self.associative_memory.insert(name.to_string(), association);
        
        Ok(self.associative_memory.get(name).unwrap())
    }
    
    /// Get association from memory
    pub fn get_association(&self, name: &str) -> Option<&Hypervector> {
        self.associative_memory.get(name)
    }
    
    /// Add class to memory
    pub fn add_class(&mut self, name: &str, items: &[&str]) -> Result<&Hypervector> {
        let mut class = Hypervector::new(name, "class");
        
        for &item_name in items {
            let item = self.item_memory.get(item_name)
                .ok_or_else(|| anyhow::anyhow!("Item not found: {}", item_name))?;
            
            class = class.add(item);
        }
        
        class.normalize();
        self.class_memory.insert(name.to_string(), class);
        
        Ok(self.class_memory.get(name).unwrap())
    }
    
    /// Get class from memory
    pub fn get_class(&self, name: &str) -> Option<&Hypervector> {
        self.class_memory.get(name)
    }
    
    /// Find most similar item
    pub fn find_most_similar_item(&self, query: &Hypervector) -> Option<(String, f64)> {
        let mut best_match = None;
        let mut best_similarity = -1.0;
        
        for (name, vector) in &self.item_memory {
            let similarity = query.cosine_similarity(vector);
            
            if similarity > best_similarity {
                best_similarity = similarity;
                best_match = Some(name.clone());
            }
        }
        
        best_match.map(|name| (name, best_similarity))
    }
    
    /// Find most similar association
    pub fn find_most_similar_association(&self, query: &Hypervector) -> Option<(String, f64)> {
        let mut best_match = None;
        let mut best_similarity = -1.0;
        
        for (name, vector) in &self.associative_memory {
            let similarity = query.cosine_similarity(vector);
            
            if similarity > best_similarity {
                best_similarity = similarity;
                best_match = Some(name.clone());
            }
        }
        
        best_match.map(|name| (name, best_similarity))
    }
    
    /// Find most similar class
    pub fn find_most_similar_class(&self, query: &Hypervector) -> Option<(String, f64)> {
        let mut best_match = None;
        let mut best_similarity = -1.0;
        
        for (name, vector) in &self.class_memory {
            let similarity = query.cosine_similarity(vector);
            
            if similarity > best_similarity {
                best_similarity = similarity;
                best_match = Some(name.clone());
            }
        }
        
        best_match.map(|name| (name, best_similarity))
    }
    
    /// Classify vector
    pub fn classify(&self, vector: &Hypervector) -> Option<(String, f64)> {
        self.find_most_similar_class(vector)
    }
}

/// Hyperdimensional encoder
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HyperdimensionalEncoder {
    /// Level vectors
    level_vectors: HashMap<String, Vec<Hypervector>>,
    
    /// Continuous item vectors
    continuous_vectors: HashMap<String, Vec<Hypervector>>,
    
    /// Random projection matrices
    projection_matrices: Vec<Array2<f64>>,
    
    /// Random permutation indices
    permutation_indices: Vec<Vec<usize>>,
}

impl HyperdimensionalEncoder {
    /// Create a new hyperdimensional encoder
    pub fn new() -> Self {
        let mut rng = thread_rng();
        
        // Create random projection matrices
        let mut projection_matrices = Vec::new();
        for _ in 0..5 {
            let matrix = Array2::from_shape_fn((HD_DIMENSION, 100), |_| {
                let normal = Normal::new(0.0, 1.0).unwrap();
                normal.sample(&mut rng)
            });
            projection_matrices.push(matrix);
        }
        
        // Create random permutation indices
        let mut permutation_indices = Vec::new();
        for _ in 0..10 {
            let mut indices: Vec<usize> = (0..HD_DIMENSION).collect();
            indices.shuffle(&mut rng);
            permutation_indices.push(indices);
        }
        
        Self {
            level_vectors: HashMap::new(),
            continuous_vectors: HashMap::new(),
            projection_matrices,
            permutation_indices,
        }
    }
    
    /// Initialize level vectors for a feature
    pub fn initialize_level_vectors(&mut self, feature: &str, levels: usize) {
        let mut vectors = Vec::with_capacity(levels);
        
        for i in 0..levels {
            let vector = Hypervector::new(&format!("{}_{}", feature, i), "level");
            vectors.push(vector);
        }
        
        self.level_vectors.insert(feature.to_string(), vectors);
    }
    
    /// Initialize continuous vectors for a feature
    pub fn initialize_continuous_vectors(&mut self, feature: &str, resolution: usize) {
        let mut vectors = Vec::with_capacity(resolution);
        let mut rng = thread_rng();
        
        // Create base vector
        let base = Hypervector::new(&format!("{}_base", feature), "continuous");
        vectors.push(base.clone());
        
        // Create continuous vectors by gradually permuting the base vector
        for i in 1..resolution {
            let permutation_idx = i % self.permutation_indices.len();
            let permutation = &self.permutation_indices[permutation_idx];
            
            let mut permuted_data = vec![0.0; HD_DIMENSION];
            for j in 0..HD_DIMENSION {
                permuted_data[j] = base.data[permutation[j]];
            }
            
            let vector = Hypervector::from_data(
                permuted_data,
                &format!("{}_{}", feature, i),
                "continuous"
            );
            
            vectors.push(vector);
        }
        
        self.continuous_vectors.insert(feature.to_string(), vectors);
    }
    
    /// Encode categorical value
    pub fn encode_categorical(&self, feature: &str, value: usize) -> Result<Hypervector> {
        let levels = self.level_vectors.get(feature)
            .ok_or_else(|| anyhow::anyhow!("Feature not found: {}", feature))?;
        
        if value >= levels.len() {
            return Err(anyhow::anyhow!("Value out of range: {} (max: {})", value, levels.len() - 1));
        }
        
        Ok(levels[value].clone())
    }
    
    /// Encode continuous value
    pub fn encode_continuous(&self, feature: &str, value: f64) -> Result<Hypervector> {
        let vectors = self.continuous_vectors.get(feature)
            .ok_or_else(|| anyhow::anyhow!("Feature not found: {}", feature))?;
        
        let resolution = vectors.len();
        let idx = ((value * resolution as f64).floor() as usize).min(resolution - 1);
        
        Ok(vectors[idx].clone())
    }
    
    /// Encode time series
    pub fn encode_time_series(&self, feature: &str, values: &[f64]) -> Result<Hypervector> {
        let n = values.len();
        if n == 0 {
            return Err(anyhow::anyhow!("Empty time series"));
        }
        
        // Normalize values
        let min_value = values.iter().copied().fold(f64::MAX, f64::min);
        let max_value = values.iter().copied().fold(f64::MIN, f64::max);
        let range = max_value - min_value;
        
        let normalized: Vec<f64> = if range > 0.0 {
            values.iter().map(|&v| (v - min_value) / range).collect()
        } else {
            vec![0.5; n]
        };
        
        // Encode each value
        let mut encoded_values = Vec::with_capacity(n);
        for &value in &normalized {
            let encoded = self.encode_continuous(feature, value)?;
            encoded_values.push(encoded);
        }
        
        // Combine with positional encoding
        let mut result = Hypervector::new(&format!("{}_series", feature), "time_series");
        
        for (i, encoded) in encoded_values.iter().enumerate() {
            let position = i % self.permutation_indices.len();
            let permutation = &self.permutation_indices[position];
            
            let mut permuted_data = vec![0.0; HD_DIMENSION];
            for j in 0..HD_DIMENSION {
                permuted_data[j] = encoded.data[permutation[j]];
            }
            
            let permuted = Hypervector::from_data(
                permuted_data,
                &format!("{}_{}", feature, i),
                "position"
            );
            
            result = result.add(&permuted);
        }
        
        result.normalize();
        Ok(result)
    }
    
    /// Encode feature vector
    pub fn encode_feature_vector(&self, features: &HashMap<String, f64>) -> Result<Hypervector> {
        let mut result = Hypervector::new("feature_vector", "composite");
        
        for (feature, &value) in features {
            let encoded = self.encode_continuous(feature, value)?;
            result = result.add(&encoded);
        }
        
        result.normalize();
        Ok(result)
    }
    
    /// Project data to hyperdimensional space
    pub fn project_to_hyperdimension(&self, data: &[f64]) -> Result<Hypervector> {
        if data.is_empty() {
            return Err(anyhow::anyhow!("Empty data"));
        }
        
        // Convert data to ndarray
        let data_array = Array1::from_vec(data.to_vec());
        
        // Choose a random projection matrix
        let matrix_idx = data.len() % self.projection_matrices.len();
        let projection_matrix = &self.projection_matrices[matrix_idx];
        
        // Project data
        let mut projected = vec![0.0; HD_DIMENSION];
        
        for i in 0..data.len().min(100) {
            let column = projection_matrix.slice(Axis(1), i..i+1);
            for j in 0..HD_DIMENSION {
                projected[j] += data[i] * column[[j, 0]];
            }
        }
        
        // Create hypervector
        let result = Hypervector::from_data(projected, "projected", "projection");
        
        Ok(result)
    }
}

/// Hyperdimensional pattern
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HyperdimensionalPattern {
    /// Pattern name
    pub name: String,
    
    /// Pattern class
    pub class: String,
    
    /// Pattern hypervector
    pub vector: Hypervector,
    
    /// Pattern confidence
    pub confidence: f64,
    
    /// Pattern metadata
    pub metadata: HashMap<String, String>,
}

impl HyperdimensionalPattern {
    /// Create a new hyperdimensional pattern
    pub fn new(name: &str, class: &str, vector: Hypervector, confidence: f64) -> Self {
        Self {
            name: name.to_string(),
            class: class.to_string(),
            vector,
            confidence,
            metadata: HashMap::new(),
        }
    }
    
    /// Add metadata
    pub fn add_metadata(&mut self, key: &str, value: &str) {
        self.metadata.insert(key.to_string(), value.to_string());
    }
    
    /// Get metadata
    pub fn get_metadata(&self, key: &str) -> Option<&String> {
        self.metadata.get(key)
    }
    
    /// Calculate similarity with another pattern
    pub fn similarity(&self, other: &HyperdimensionalPattern) -> f64 {
        self.vector.cosine_similarity(&other.vector)
    }
}

/// Hyperdimensional pattern recognizer
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HyperdimensionalPatternRecognizer {
    /// Memory
    pub memory: HyperdimensionalMemory,
    
    /// Encoder
    pub encoder: HyperdimensionalEncoder,
    
    /// Known patterns
    pub patterns: HashMap<String, HyperdimensionalPattern>,
    
    /// Similarity threshold
    pub similarity_threshold: f64,
}

impl HyperdimensionalPatternRecognizer {
    /// Create a new hyperdimensional pattern recognizer
    pub fn new() -> Self {
        Self {
            memory: HyperdimensionalMemory::new(),
            encoder: HyperdimensionalEncoder::new(),
            patterns: HashMap::new(),
            similarity_threshold: 0.85,
        }
    }
    
    /// Initialize the recognizer
    pub fn initialize(&mut self) -> Result<()> {
        // Initialize continuous vectors for features
        self.encoder.initialize_continuous_vectors("price", 100);
        self.encoder.initialize_continuous_vectors("volume", 100);
        self.encoder.initialize_continuous_vectors("volatility", 100);
        self.encoder.initialize_continuous_vectors("momentum", 100);
        self.encoder.initialize_continuous_vectors("trend", 100);
        
        // Initialize level vectors for categorical features
        self.encoder.initialize_level_vectors("direction", 3); // Up, Down, Sideways
        self.encoder.initialize_level_vectors("pattern_type", 10); // Different pattern types
        
        Ok(())
    }
    
    /// Add pattern
    pub fn add_pattern(&mut self, pattern: HyperdimensionalPattern) {
        self.patterns.insert(pattern.name.clone(), pattern);
    }
    
    /// Get pattern
    pub fn get_pattern(&self, name: &str) -> Option<&HyperdimensionalPattern> {
        self.patterns.get(name)
    }
    
    /// Recognize patterns in time series
    pub fn recognize_patterns(&self, feature: &str, values: &[f64]) -> Result<Vec<(String, f64)>> {
        // Encode time series
        let encoded = self.encoder.encode_time_series(feature, values)?;
        
        // Match against known patterns
        let mut matches = Vec::new();
        
        for (name, pattern) in &self.patterns {
            let similarity = encoded.cosine_similarity(&pattern.vector);
            
            if similarity >= self.similarity_threshold {
                matches.push((name.clone(), similarity));
            }
        }
        
        // Sort by similarity
        matches.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());
        
        Ok(matches)
    }
    
    /// Recognize patterns in feature vector
    pub fn recognize_patterns_in_features(&self, features: &HashMap<String, f64>) -> Result<Vec<(String, f64)>> {
        // Encode feature vector
        let encoded = self.encoder.encode_feature_vector(features)?;
        
        // Match against known patterns
        let mut matches = Vec::new();
        
        for (name, pattern) in &self.patterns {
            let similarity = encoded.cosine_similarity(&pattern.vector);
            
            if similarity >= self.similarity_threshold {
                matches.push((name.clone(), similarity));
            }
        }
        
        // Sort by similarity
        matches.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());
        
        Ok(matches)
    }
    
    /// Learn pattern from time series
    pub fn learn_pattern(&mut self, name: &str, class: &str, feature: &str, values: &[f64]) -> Result<HyperdimensionalPattern> {
        // Encode time series
        let encoded = self.encoder.encode_time_series(feature, values)?;
        
        // Create pattern
        let pattern = HyperdimensionalPattern::new(name, class, encoded, 1.0);
        
        // Add to patterns
        self.patterns.insert(name.to_string(), pattern.clone());
        
        Ok(pattern)
    }
    
    /// Learn pattern from feature vector
    pub fn learn_pattern_from_features(&mut self, name: &str, class: &str, features: &HashMap<String, f64>) -> Result<HyperdimensionalPattern> {
        // Encode feature vector
        let encoded = self.encoder.encode_feature_vector(features)?;
        
        // Create pattern
        let pattern = HyperdimensionalPattern::new(name, class, encoded, 1.0);
        
        // Add to patterns
        self.patterns.insert(name.to_string(), pattern.clone());
        
        Ok(pattern)
    }
    
    /// Find similar patterns
    pub fn find_similar_patterns(&self, pattern: &HyperdimensionalPattern) -> Vec<(String, f64)> {
        let mut similarities = Vec::new();
        
        for (name, other) in &self.patterns {
            if name != &pattern.name {
                let similarity = pattern.similarity(other);
                
                if similarity >= self.similarity_threshold {
                    similarities.push((name.clone(), similarity));
                }
            }
        }
        
        // Sort by similarity
        similarities.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());
        
        similarities
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_hypervector_operations() {
        let mut v1 = Hypervector::new("v1", "test");
        let mut v2 = Hypervector::new("v2", "test");
        
        v1.normalize();
        v2.normalize();
        
        let similarity = v1.cosine_similarity(&v2);
        assert!(similarity >= -1.0 && similarity <= 1.0);
        
        let v3 = v1.add(&v2);
        assert_eq!(v3.data.len(), HD_DIMENSION);
        
        let v4 = v1.multiply(2.0);
        assert_eq!(v4.data.len(), HD_DIMENSION);
        
        let v5 = v1.bind(&v2);
        assert_eq!(v5.data.len(), HD_DIMENSION);
    }
    
    #[test]
    fn test_hyperdimensional_memory() {
        let mut memory = HyperdimensionalMemory::new();
        
        memory.add_item("item1", "class1");
        memory.add_item("item2", "class1");
        memory.add_item("item3", "class2");
        
        let items = ["item1", "item2"];
        memory.add_association("assoc1", &items).unwrap();
        
        let items = ["item1", "item2", "item3"];
        memory.add_class("class1", &["item1", "item2"]).unwrap();
        memory.add_class("class2", &["item3"]).unwrap();
        
        let query = memory.get_item("item1").unwrap();
        let (class, similarity) = memory.classify(query).unwrap();
        
        assert_eq!(class, "class1");
        assert!(similarity > 0.0);
    }
    
    #[test]
    fn test_hyperdimensional_encoder() {
        let mut encoder = HyperdimensionalEncoder::new();
        
        encoder.initialize_continuous_vectors("price", 100);
        encoder.initialize_level_vectors("direction", 3);
        
        let v1 = encoder.encode_continuous("price", 0.5).unwrap();
        assert_eq!(v1.data.len(), HD_DIMENSION);
        
        let v2 = encoder.encode_categorical("direction", 1).unwrap();
        assert_eq!(v2.data.len(), HD_DIMENSION);
        
        let time_series = vec![0.1, 0.2, 0.3, 0.4, 0.5];
        let v3 = encoder.encode_time_series("price", &time_series).unwrap();
        assert_eq!(v3.data.len(), HD_DIMENSION);
        
        let mut features = HashMap::new();
        features.insert("price".to_string(), 0.5);
        features.insert("volume".to_string(), 0.8);
        
        encoder.initialize_continuous_vectors("volume", 100);
        let v4 = encoder.encode_feature_vector(&features).unwrap();
        assert_eq!(v4.data.len(), HD_DIMENSION);
    }
    
    #[test]
    fn test_pattern_recognition() {
        let mut recognizer = HyperdimensionalPatternRecognizer::new();
        recognizer.initialize().unwrap();
        
        // Learn a pattern
        let time_series1 = vec![0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
        let pattern1 = recognizer.learn_pattern("pattern1", "trend", "price", &time_series1).unwrap();
        
        // Learn another pattern
        let time_series2 = vec![1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1];
        let pattern2 = recognizer.learn_pattern("pattern2", "trend", "price", &time_series2).unwrap();
        
        // Recognize patterns
        let time_series3 = vec![0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 0.95, 1.05];
        let matches = recognizer.recognize_patterns("price", &time_series3).unwrap();
        
        assert!(!matches.is_empty());
        
        // Find similar patterns
        let similar = recognizer.find_similar_patterns(&pattern1);
        assert!(similar.is_empty() || similar[0].0 == "pattern2");
    }
}
