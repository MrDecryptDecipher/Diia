//! Quantum Module
//!
//! This module provides quantum-inspired prediction and pattern recognition
//! capabilities for the OMNI-ALPHA VΩ∞∞ system.

pub mod agent_trait;
pub mod message_bus;
pub mod spectral_tree_engine;
pub mod qtree_sim;
pub mod quantum_predictor;
pub mod quantum_entanglement;
pub mod hyperdimensional_computing;

// Re-export key types
pub use spectral_tree_engine::{
    SpectralTreeEngine, SpectralTreeConfig, SpectralTreeState,
    PathSimulation, PathSimulationResult, TradeDirection, EntropyCluster
};

pub use qtree_sim::{
    QTreeSim, QTreeState, PathCluster, ClusterType, ClusterAnalysisResult
};

pub use quantum_predictor::{
    QuantumPredictor, QuantumPredictorState, QuantumState,
    PredictionResult, Complex
};

pub use quantum_entanglement::{
    QuantumEntanglement, QuantumEntanglementState, EntangledPair,
    EntanglementType, EntanglementResult
};

pub use hyperdimensional_computing::{
    Hypervector, HyperdimensionalMemory, HyperdimensionalEncoder,
    HyperdimensionalPattern, HyperdimensionalPatternRecognizer
};
