//! Quantum Module
//!
//! This module provides quantum-inspired algorithms for the OMNI-ALPHA VΩ∞∞ platform.

pub mod spectral_tree_engine;
pub mod quantum_predictor;
pub mod quantum_entanglement;
pub mod hyperdimensional_computing;

// Re-export key types
pub use spectral_tree_engine::{SpectralTreeEngine, PathSimulation, PathSimulationResult};
pub use quantum_predictor::{QuantumPredictor, QuantumState, PredictionResult};
pub use quantum_entanglement::{QuantumEntanglement, EntangledPair, EntanglementResult};
pub use hyperdimensional_computing::{HyperdimensionalComputing, Hypervector, HyperdimensionalPattern};
