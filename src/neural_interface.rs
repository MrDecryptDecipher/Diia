//! Neural Interface Module for OMNI Trading System
//!
//! This module provides neural network interfaces and visualization capabilities
//! for the OMNI trading system.

use std::collections::HashMap;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum InterfaceMode {
    Dashboard,
    Trading,
    Analysis,
    Monitoring,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum VisualizationType {
    Chart,
    Graph,
    Heatmap,
    Network,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ChartType {
    Candlestick,
    Line,
    Area,
    Volume,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TimeFrame {
    OneMinute,
    FiveMinutes,
    FifteenMinutes,
    OneHour,
    FourHours,
    OneDay,
}

#[derive(Debug, Clone)]
pub struct NeuralInterface {
    mode: InterfaceMode,
    visualizations: Vec<VisualizationType>,
    active_charts: HashMap<String, ChartType>,
    timeframes: Vec<TimeFrame>,
}

impl NeuralInterface {
    pub fn new() -> Self {
        Self {
            mode: InterfaceMode::Dashboard,
            visualizations: Vec::new(),
            active_charts: HashMap::new(),
            timeframes: vec![TimeFrame::OneHour],
        }
    }

    pub fn set_mode(&mut self, mode: InterfaceMode) {
        self.mode = mode;
    }

    pub fn add_visualization(&mut self, viz_type: VisualizationType) {
        self.visualizations.push(viz_type);
    }

    pub fn add_chart(&mut self, symbol: String, chart_type: ChartType) {
        self.active_charts.insert(symbol, chart_type);
    }

    pub fn get_mode(&self) -> &InterfaceMode {
        &self.mode
    }

    pub fn get_visualizations(&self) -> &Vec<VisualizationType> {
        &self.visualizations
    }

    pub fn get_active_charts(&self) -> &HashMap<String, ChartType> {
        &self.active_charts
    }
}

impl Default for NeuralInterface {
    fn default() -> Self {
        Self::new()
    }
}
