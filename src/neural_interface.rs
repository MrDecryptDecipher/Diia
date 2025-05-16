//! Neural Interface
//!
//! This module provides the neural interface for the OMNI-ALPHA VΩ∞∞ system,
//! enabling advanced visualization and interaction with the system.

use std::collections::HashMap;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use anyhow::Result;
use tracing::{info, debug, warn, error};

use crate::engine::message_bus::TradeDirection;
use crate::quantum::hyperdimensional_computing::HyperdimensionalPattern;

/// Interface mode
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum InterfaceMode {
    /// Standard mode
    Standard,
    
    /// Advanced mode
    Advanced,
    
    /// Developer mode
    Developer,
    
    /// Quantum mode
    Quantum,
    
    /// Neural mode
    Neural,
}

/// Visualization type
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum VisualizationType {
    /// Price chart
    PriceChart,
    
    /// Volume profile
    VolumeProfile,
    
    /// Order book heatmap
    OrderBookHeatmap,
    
    /// Trade flow
    TradeFlow,
    
    /// Pattern recognition
    PatternRecognition,
    
    /// Agent activity
    AgentActivity,
    
    /// Quantum state
    QuantumState,
    
    /// Hyperdimensional space
    HyperdimensionalSpace,
    
    /// Neural network
    NeuralNetwork,
}

/// Chart type
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum ChartType {
    /// Candlestick chart
    Candlestick,
    
    /// Line chart
    Line,
    
    /// Area chart
    Area,
    
    /// Bar chart
    Bar,
    
    /// Scatter chart
    Scatter,
    
    /// Heatmap chart
    Heatmap,
    
    /// 3D surface chart
    Surface3D,
    
    /// Network chart
    Network,
}

/// Time frame
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum TimeFrame {
    /// 1 minute
    Minute1,
    
    /// 5 minutes
    Minute5,
    
    /// 15 minutes
    Minute15,
    
    /// 30 minutes
    Minute30,
    
    /// 1 hour
    Hour1,
    
    /// 4 hours
    Hour4,
    
    /// 1 day
    Day1,
    
    /// 1 week
    Week1,
}

/// Visualization data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VisualizationData {
    /// Visualization type
    pub visualization_type: VisualizationType,
    
    /// Chart type
    pub chart_type: ChartType,
    
    /// Symbol
    pub symbol: String,
    
    /// Time frame
    pub time_frame: TimeFrame,
    
    /// Timestamp
    pub timestamp: DateTime<Utc>,
    
    /// Data points
    pub data_points: Vec<DataPoint>,
    
    /// Annotations
    pub annotations: Vec<Annotation>,
    
    /// Patterns
    pub patterns: Vec<Pattern>,
    
    /// Signals
    pub signals: Vec<Signal>,
    
    /// Metadata
    pub metadata: HashMap<String, String>,
}

/// Data point
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataPoint {
    /// Timestamp
    pub timestamp: DateTime<Utc>,
    
    /// Values
    pub values: HashMap<String, f64>,
}

/// Annotation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Annotation {
    /// Annotation type
    pub annotation_type: String,
    
    /// Timestamp
    pub timestamp: DateTime<Utc>,
    
    /// Price
    pub price: f64,
    
    /// Text
    pub text: String,
    
    /// Color
    pub color: String,
}

/// Pattern
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Pattern {
    /// Pattern type
    pub pattern_type: String,
    
    /// Start timestamp
    pub start_timestamp: DateTime<Utc>,
    
    /// End timestamp
    pub end_timestamp: DateTime<Utc>,
    
    /// Points
    pub points: Vec<(DateTime<Utc>, f64)>,
    
    /// Confidence
    pub confidence: f64,
    
    /// Color
    pub color: String,
}

/// Signal
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Signal {
    /// Signal type
    pub signal_type: String,
    
    /// Timestamp
    pub timestamp: DateTime<Utc>,
    
    /// Price
    pub price: f64,
    
    /// Direction
    pub direction: TradeDirection,
    
    /// Strength
    pub strength: f64,
    
    /// Source
    pub source: String,
    
    /// Color
    pub color: String,
}

/// Neural interface state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NeuralInterfaceState {
    /// Whether the interface is active
    pub active: bool,
    
    /// Interface mode
    pub mode: InterfaceMode,
    
    /// Current symbol
    pub current_symbol: String,
    
    /// Current time frame
    pub current_time_frame: TimeFrame,
    
    /// Current visualization type
    pub current_visualization_type: VisualizationType,
    
    /// Current chart type
    pub current_chart_type: ChartType,
    
    /// Active visualizations
    pub active_visualizations: Vec<VisualizationType>,
    
    /// Active symbols
    pub active_symbols: Vec<String>,
    
    /// Neural connection strength
    pub neural_connection_strength: f64,
    
    /// Quantum coherence
    pub quantum_coherence: f64,
}

/// Neural interface
pub struct NeuralInterface {
    /// Interface state
    state: NeuralInterfaceState,
    
    /// Visualization data
    visualization_data: HashMap<String, VisualizationData>,
    
    /// Pattern cache
    pattern_cache: HashMap<String, HyperdimensionalPattern>,
    
    /// Signal cache
    signal_cache: HashMap<String, Signal>,
    
    /// Neural connection map
    neural_connection_map: HashMap<String, Vec<String>>,
    
    /// Quantum state map
    quantum_state_map: HashMap<String, Vec<f64>>,
}

impl NeuralInterface {
    /// Create a new neural interface
    pub fn new() -> Self {
        Self {
            state: NeuralInterfaceState {
                active: true,
                mode: InterfaceMode::Standard,
                current_symbol: "BTCUSDT".to_string(),
                current_time_frame: TimeFrame::Minute15,
                current_visualization_type: VisualizationType::PriceChart,
                current_chart_type: ChartType::Candlestick,
                active_visualizations: vec![VisualizationType::PriceChart],
                active_symbols: vec!["BTCUSDT".to_string()],
                neural_connection_strength: 0.5,
                quantum_coherence: 0.5,
            },
            visualization_data: HashMap::new(),
            pattern_cache: HashMap::new(),
            signal_cache: HashMap::new(),
            neural_connection_map: HashMap::new(),
            quantum_state_map: HashMap::new(),
        }
    }
    
    /// Initialize the interface
    pub fn initialize(&mut self) -> Result<()> {
        info!("Initializing neural interface");
        
        // Initialize visualization types
        self.add_visualization_type(VisualizationType::PriceChart, ChartType::Candlestick)?;
        self.add_visualization_type(VisualizationType::VolumeProfile, ChartType::Bar)?;
        self.add_visualization_type(VisualizationType::OrderBookHeatmap, ChartType::Heatmap)?;
        self.add_visualization_type(VisualizationType::TradeFlow, ChartType::Line)?;
        self.add_visualization_type(VisualizationType::PatternRecognition, ChartType::Network)?;
        self.add_visualization_type(VisualizationType::AgentActivity, ChartType::Network)?;
        self.add_visualization_type(VisualizationType::QuantumState, ChartType::Surface3D)?;
        self.add_visualization_type(VisualizationType::HyperdimensionalSpace, ChartType::Network)?;
        self.add_visualization_type(VisualizationType::NeuralNetwork, ChartType::Network)?;
        
        // Initialize neural connections
        self.initialize_neural_connections()?;
        
        // Initialize quantum state
        self.initialize_quantum_state()?;
        
        Ok(())
    }
    
    /// Add visualization type
    fn add_visualization_type(&mut self, visualization_type: VisualizationType, chart_type: ChartType) -> Result<()> {
        let key = format!("{:?}", visualization_type);
        
        let visualization = VisualizationData {
            visualization_type,
            chart_type,
            symbol: self.state.current_symbol.clone(),
            time_frame: self.state.current_time_frame,
            timestamp: Utc::now(),
            data_points: Vec::new(),
            annotations: Vec::new(),
            patterns: Vec::new(),
            signals: Vec::new(),
            metadata: HashMap::new(),
        };
        
        self.visualization_data.insert(key, visualization);
        
        Ok(())
    }
    
    /// Initialize neural connections
    fn initialize_neural_connections(&mut self) -> Result<()> {
        // Create neural connections between visualization types
        self.neural_connection_map.insert(
            format!("{:?}", VisualizationType::PriceChart),
            vec![
                format!("{:?}", VisualizationType::VolumeProfile),
                format!("{:?}", VisualizationType::PatternRecognition),
                format!("{:?}", VisualizationType::TradeFlow),
            ]
        );
        
        self.neural_connection_map.insert(
            format!("{:?}", VisualizationType::VolumeProfile),
            vec![
                format!("{:?}", VisualizationType::PriceChart),
                format!("{:?}", VisualizationType::OrderBookHeatmap),
            ]
        );
        
        self.neural_connection_map.insert(
            format!("{:?}", VisualizationType::PatternRecognition),
            vec![
                format!("{:?}", VisualizationType::PriceChart),
                format!("{:?}", VisualizationType::HyperdimensionalSpace),
                format!("{:?}", VisualizationType::QuantumState),
            ]
        );
        
        self.neural_connection_map.insert(
            format!("{:?}", VisualizationType::AgentActivity),
            vec![
                format!("{:?}", VisualizationType::NeuralNetwork),
                format!("{:?}", VisualizationType::QuantumState),
            ]
        );
        
        self.neural_connection_map.insert(
            format!("{:?}", VisualizationType::QuantumState),
            vec![
                format!("{:?}", VisualizationType::HyperdimensionalSpace),
                format!("{:?}", VisualizationType::PatternRecognition),
                format!("{:?}", VisualizationType::AgentActivity),
            ]
        );
        
        Ok(())
    }
    
    /// Initialize quantum state
    fn initialize_quantum_state(&mut self) -> Result<()> {
        // Initialize quantum state for each symbol
        for symbol in &self.state.active_symbols {
            let quantum_state = vec![0.5; 64]; // Initial quantum state
            self.quantum_state_map.insert(symbol.clone(), quantum_state);
        }
        
        Ok(())
    }
    
    /// Update visualization data
    pub fn update_visualization(&mut self, visualization_type: VisualizationType, symbol: &str, data_points: Vec<DataPoint>) -> Result<()> {
        let key = format!("{:?}", visualization_type);
        
        if let Some(visualization) = self.visualization_data.get_mut(&key) {
            visualization.symbol = symbol.to_string();
            visualization.timestamp = Utc::now();
            visualization.data_points = data_points;
        } else {
            return Err(anyhow::anyhow!("Visualization type not found: {:?}", visualization_type));
        }
        
        Ok(())
    }
    
    /// Add annotation
    pub fn add_annotation(&mut self, visualization_type: VisualizationType, annotation: Annotation) -> Result<()> {
        let key = format!("{:?}", visualization_type);
        
        if let Some(visualization) = self.visualization_data.get_mut(&key) {
            visualization.annotations.push(annotation);
        } else {
            return Err(anyhow::anyhow!("Visualization type not found: {:?}", visualization_type));
        }
        
        Ok(())
    }
    
    /// Add pattern
    pub fn add_pattern(&mut self, visualization_type: VisualizationType, pattern: Pattern) -> Result<()> {
        let key = format!("{:?}", visualization_type);
        
        if let Some(visualization) = self.visualization_data.get_mut(&key) {
            visualization.patterns.push(pattern);
        } else {
            return Err(anyhow::anyhow!("Visualization type not found: {:?}", visualization_type));
        }
        
        Ok(())
    }
    
    /// Add signal
    pub fn add_signal(&mut self, visualization_type: VisualizationType, signal: Signal) -> Result<()> {
        let key = format!("{:?}", visualization_type);
        
        if let Some(visualization) = self.visualization_data.get_mut(&key) {
            visualization.signals.push(signal.clone());
            
            // Cache signal
            self.signal_cache.insert(format!("{}_{}", signal.source, signal.timestamp), signal);
        } else {
            return Err(anyhow::anyhow!("Visualization type not found: {:?}", visualization_type));
        }
        
        Ok(())
    }
    
    /// Set interface mode
    pub fn set_mode(&mut self, mode: InterfaceMode) {
        self.state.mode = mode;
        
        // Update active visualizations based on mode
        match mode {
            InterfaceMode::Standard => {
                self.state.active_visualizations = vec![
                    VisualizationType::PriceChart,
                    VisualizationType::VolumeProfile,
                ];
            },
            InterfaceMode::Advanced => {
                self.state.active_visualizations = vec![
                    VisualizationType::PriceChart,
                    VisualizationType::VolumeProfile,
                    VisualizationType::OrderBookHeatmap,
                    VisualizationType::TradeFlow,
                    VisualizationType::PatternRecognition,
                ];
            },
            InterfaceMode::Developer => {
                self.state.active_visualizations = vec![
                    VisualizationType::PriceChart,
                    VisualizationType::VolumeProfile,
                    VisualizationType::OrderBookHeatmap,
                    VisualizationType::TradeFlow,
                    VisualizationType::PatternRecognition,
                    VisualizationType::AgentActivity,
                ];
            },
            InterfaceMode::Quantum => {
                self.state.active_visualizations = vec![
                    VisualizationType::PriceChart,
                    VisualizationType::QuantumState,
                    VisualizationType::PatternRecognition,
                ];
            },
            InterfaceMode::Neural => {
                self.state.active_visualizations = vec![
                    VisualizationType::PriceChart,
                    VisualizationType::NeuralNetwork,
                    VisualizationType::HyperdimensionalSpace,
                ];
            },
        }
    }
    
    /// Set current symbol
    pub fn set_current_symbol(&mut self, symbol: &str) {
        self.state.current_symbol = symbol.to_string();
        
        // Update all visualizations to use the new symbol
        for visualization in self.visualization_data.values_mut() {
            visualization.symbol = symbol.to_string();
        }
    }
    
    /// Set current time frame
    pub fn set_current_time_frame(&mut self, time_frame: TimeFrame) {
        self.state.current_time_frame = time_frame;
        
        // Update all visualizations to use the new time frame
        for visualization in self.visualization_data.values_mut() {
            visualization.time_frame = time_frame;
        }
    }
    
    /// Set current visualization type
    pub fn set_current_visualization_type(&mut self, visualization_type: VisualizationType) {
        self.state.current_visualization_type = visualization_type;
    }
    
    /// Set current chart type
    pub fn set_current_chart_type(&mut self, chart_type: ChartType) {
        self.state.current_chart_type = chart_type;
        
        // Update current visualization to use the new chart type
        let key = format!("{:?}", self.state.current_visualization_type);
        if let Some(visualization) = self.visualization_data.get_mut(&key) {
            visualization.chart_type = chart_type;
        }
    }
    
    /// Add active symbol
    pub fn add_active_symbol(&mut self, symbol: &str) {
        if !self.state.active_symbols.contains(&symbol.to_string()) {
            self.state.active_symbols.push(symbol.to_string());
            
            // Initialize quantum state for the new symbol
            let quantum_state = vec![0.5; 64]; // Initial quantum state
            self.quantum_state_map.insert(symbol.to_string(), quantum_state);
        }
    }
    
    /// Remove active symbol
    pub fn remove_active_symbol(&mut self, symbol: &str) {
        self.state.active_symbols.retain(|s| s != symbol);
        
        // Remove quantum state for the symbol
        self.quantum_state_map.remove(symbol);
    }
    
    /// Update quantum state
    pub fn update_quantum_state(&mut self, symbol: &str, quantum_state: Vec<f64>) -> Result<()> {
        if !self.state.active_symbols.contains(&symbol.to_string()) {
            return Err(anyhow::anyhow!("Symbol not active: {}", symbol));
        }
        
        self.quantum_state_map.insert(symbol.to_string(), quantum_state);
        
        // Update quantum coherence
        self.update_quantum_coherence()?;
        
        Ok(())
    }
    
    /// Update quantum coherence
    fn update_quantum_coherence(&mut self) -> Result<()> {
        // Calculate average quantum coherence across all symbols
        let mut total_coherence = 0.0;
        let mut count = 0;
        
        for quantum_state in self.quantum_state_map.values() {
            // Calculate coherence as the average absolute value of the quantum state
            let coherence = quantum_state.iter().map(|&x| x.abs()).sum::<f64>() / quantum_state.len() as f64;
            total_coherence += coherence;
            count += 1;
        }
        
        if count > 0 {
            self.state.quantum_coherence = total_coherence / count as f64;
        }
        
        Ok(())
    }
    
    /// Update neural connection strength
    pub fn update_neural_connection_strength(&mut self, strength: f64) {
        self.state.neural_connection_strength = strength;
    }
    
    /// Get visualization data
    pub fn get_visualization_data(&self, visualization_type: VisualizationType) -> Option<&VisualizationData> {
        let key = format!("{:?}", visualization_type);
        self.visualization_data.get(&key)
    }
    
    /// Get all visualization data
    pub fn get_all_visualization_data(&self) -> &HashMap<String, VisualizationData> {
        &self.visualization_data
    }
    
    /// Get state
    pub fn get_state(&self) -> &NeuralInterfaceState {
        &self.state
    }
    
    /// Get quantum state
    pub fn get_quantum_state(&self, symbol: &str) -> Option<&Vec<f64>> {
        self.quantum_state_map.get(symbol)
    }
    
    /// Get neural connections
    pub fn get_neural_connections(&self, visualization_type: VisualizationType) -> Vec<VisualizationType> {
        let key = format!("{:?}", visualization_type);
        
        if let Some(connections) = self.neural_connection_map.get(&key) {
            connections.iter()
                .filter_map(|c| {
                    match c.as_str() {
                        "PriceChart" => Some(VisualizationType::PriceChart),
                        "VolumeProfile" => Some(VisualizationType::VolumeProfile),
                        "OrderBookHeatmap" => Some(VisualizationType::OrderBookHeatmap),
                        "TradeFlow" => Some(VisualizationType::TradeFlow),
                        "PatternRecognition" => Some(VisualizationType::PatternRecognition),
                        "AgentActivity" => Some(VisualizationType::AgentActivity),
                        "QuantumState" => Some(VisualizationType::QuantumState),
                        "HyperdimensionalSpace" => Some(VisualizationType::HyperdimensionalSpace),
                        "NeuralNetwork" => Some(VisualizationType::NeuralNetwork),
                        _ => None,
                    }
                })
                .collect()
        } else {
            Vec::new()
        }
    }
    
    /// Get recent signals
    pub fn get_recent_signals(&self, limit: usize) -> Vec<&Signal> {
        let mut signals: Vec<&Signal> = self.signal_cache.values().collect();
        
        // Sort by timestamp (newest first)
        signals.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
        
        // Limit results
        signals.truncate(limit);
        
        signals
    }
    
    /// Get signals by source
    pub fn get_signals_by_source(&self, source: &str) -> Vec<&Signal> {
        let mut signals: Vec<&Signal> = self.signal_cache.values()
            .filter(|s| s.source == source)
            .collect();
        
        // Sort by timestamp (newest first)
        signals.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
        
        signals
    }
    
    /// Clear old data
    pub fn clear_old_data(&mut self, max_age_hours: i64) {
        let now = Utc::now();
        
        // Clear old signals
        self.signal_cache.retain(|_, signal| {
            (now - signal.timestamp).num_hours() < max_age_hours
        });
        
        // Clear old annotations and patterns
        for visualization in self.visualization_data.values_mut() {
            visualization.annotations.retain(|a| {
                (now - a.timestamp).num_hours() < max_age_hours
            });
            
            visualization.patterns.retain(|p| {
                (now - p.end_timestamp).num_hours() < max_age_hours
            });
            
            visualization.signals.retain(|s| {
                (now - s.timestamp).num_hours() < max_age_hours
            });
        }
    }
}
