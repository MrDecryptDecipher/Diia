//! State Machine
//!
//! This module provides a finite state machine implementation for managing
//! the lifecycle of trades and other system components.

use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use anyhow::Result;

/// State machine event
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub struct Event {
    /// Event name
    pub name: String,
    
    /// Event data
    pub data: Option<String>,
}

/// State machine state
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub struct State {
    /// State name
    pub name: String,
    
    /// Is this a terminal state?
    pub is_terminal: bool,
}

/// State transition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transition {
    /// From state
    pub from: State,
    
    /// To state
    pub to: State,
    
    /// Trigger event
    pub event: Event,
    
    /// Transition guard condition
    pub guard: Option<String>,
    
    /// Transition action
    pub action: Option<String>,
}

/// State machine
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StateMachine {
    /// Machine name
    pub name: String,
    
    /// Current state
    pub current_state: State,
    
    /// Initial state
    pub initial_state: State,
    
    /// States
    pub states: Vec<State>,
    
    /// Transitions
    pub transitions: Vec<Transition>,
    
    /// Transition history
    pub history: Vec<(State, Event, State)>,
}

impl StateMachine {
    /// Create a new state machine
    pub fn new(name: &str, initial_state: State) -> Self {
        Self {
            name: name.to_string(),
            current_state: initial_state.clone(),
            initial_state,
            states: Vec::new(),
            transitions: Vec::new(),
            history: Vec::new(),
        }
    }
    
    /// Add a state
    pub fn add_state(&mut self, state: State) -> Result<()> {
        if !self.states.contains(&state) {
            self.states.push(state);
            Ok(())
        } else {
            Err(anyhow::anyhow!("State already exists: {}", state.name))
        }
    }
    
    /// Add a transition
    pub fn add_transition(&mut self, transition: Transition) -> Result<()> {
        // Ensure states exist
        if !self.states.contains(&transition.from) {
            return Err(anyhow::anyhow!("From state does not exist: {}", transition.from.name));
        }
        
        if !self.states.contains(&transition.to) {
            return Err(anyhow::anyhow!("To state does not exist: {}", transition.to.name));
        }
        
        self.transitions.push(transition);
        Ok(())
    }
    
    /// Process an event
    pub fn process_event(&mut self, event: Event) -> Result<bool> {
        // Find matching transition
        for transition in &self.transitions {
            if transition.from == self.current_state && transition.event == event {
                // Transition is valid
                let from_state = self.current_state.clone();
                self.current_state = transition.to.clone();
                
                // Record in history
                self.history.push((from_state, event.clone(), transition.to.clone()));
                
                return Ok(true);
            }
        }
        
        // No matching transition
        Ok(false)
    }
    
    /// Reset to initial state
    pub fn reset(&mut self) {
        self.current_state = self.initial_state.clone();
        self.history.clear();
    }
    
    /// Check if in terminal state
    pub fn is_terminal(&self) -> bool {
        self.current_state.is_terminal
    }
    
    /// Get available events from current state
    pub fn available_events(&self) -> Vec<Event> {
        self.transitions.iter()
            .filter(|t| t.from == self.current_state)
            .map(|t| t.event.clone())
            .collect()
    }
    
    /// Get transition history
    pub fn get_history(&self) -> &[(State, Event, State)] {
        &self.history
    }
}
