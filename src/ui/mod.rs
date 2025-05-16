//! UI System
//!
//! This module provides the UI system for the OMNI-ALPHA VΩ∞∞ platform,
//! including the neural interface for visualization and interaction.

pub mod neural_interface;
pub mod dashboard;
pub mod trade_view;
pub mod system_monitor;
pub mod settings;

// Re-export key types
pub use neural_interface::{NeuralInterface, NeuralVisualization, NeuralCommand};
pub use dashboard::{Dashboard, DashboardMetrics, DashboardView};
pub use trade_view::{TradeView, TradeViewMode};
pub use system_monitor::{SystemMonitor, SystemMetrics};
pub use settings::{Settings, SettingsCategory};
