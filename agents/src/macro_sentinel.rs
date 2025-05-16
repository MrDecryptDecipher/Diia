use async_trait::async_trait;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use crate::agent_trait::Agent;
use crate::message_bus::Message;

/// MacroSentinel monitors global economic events, tariffs, and major market events
/// that could significantly impact trading conditions.
pub struct MacroSentinel {
    /// Current state of the agent
    state: MacroSentinelState,
    /// Configuration for the agent
    config: MacroSentinelConfig,
    /// Calendar of upcoming economic events
    economic_calendar: HashMap<DateTime<Utc>, EconomicEvent>,
    /// Current active warnings
    active_warnings: Vec<MacroWarning>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MacroSentinelConfig {
    /// How often to check for new events (in seconds)
    pub check_interval: u64,
    /// Sources to monitor for economic events
    pub event_sources: Vec<String>,
    /// Keywords to monitor in news feeds
    pub alert_keywords: Vec<String>,
    /// Threshold for event importance (1-10)
    pub importance_threshold: u8,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MacroSentinelState {
    /// Whether the agent is currently active
    pub active: bool,
    /// Last time the agent checked for events
    pub last_check: DateTime<Utc>,
    /// Current market condition assessment
    pub market_condition: MarketCondition,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MarketCondition {
    Normal,
    Cautious,
    HighRisk,
    EmergencyOnly,
    FullStop,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EconomicEvent {
    /// Name of the event
    pub name: String,
    /// When the event is scheduled to occur
    pub time: DateTime<Utc>,
    /// Importance of the event (1-10)
    pub importance: u8,
    /// Type of event
    pub event_type: EventType,
    /// Expected impact on markets
    pub expected_impact: ExpectedImpact,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum EventType {
    CPIRelease,
    FOMCMeeting,
    NFPReport,
    TariffAnnouncement,
    ETFFlow,
    CentralBankDecision,
    GeopoliticalEvent,
    Other(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ExpectedImpact {
    Low,
    Medium,
    High,
    Critical,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MacroWarning {
    /// Type of warning
    pub warning_type: EventType,
    /// Severity of the warning
    pub severity: ExpectedImpact,
    /// When the warning was issued
    pub issued_at: DateTime<Utc>,
    /// When the warning expires
    pub expires_at: DateTime<Utc>,
    /// Affected assets or markets
    pub affected_markets: Vec<String>,
    /// Recommended action
    pub recommended_action: MarketCondition,
}

impl MacroSentinel {
    pub fn new(config: MacroSentinelConfig) -> Self {
        Self {
            state: MacroSentinelState {
                active: true,
                last_check: Utc::now(),
                market_condition: MarketCondition::Normal,
            },
            config,
            economic_calendar: HashMap::new(),
            active_warnings: Vec::new(),
        }
    }

    /// Fetch upcoming economic events from configured sources
    pub async fn fetch_economic_calendar(&mut self) -> anyhow::Result<()> {
        // Implementation would connect to economic calendar APIs
        // and update the economic_calendar HashMap
        Ok(())
    }

    /// Check for new tariff announcements
    pub async fn check_tariff_announcements(&mut self) -> anyhow::Result<()> {
        // Implementation would monitor news sources for tariff announcements
        Ok(())
    }

    /// Monitor ETF flows for significant imbalances
    pub async fn monitor_etf_flows(&mut self) -> anyhow::Result<()> {
        // Implementation would track ETF creation/redemption activity
        Ok(())
    }

    /// Issue a new macro warning
    pub fn issue_warning(&mut self, warning: MacroWarning) {
        self.active_warnings.push(warning.clone());
        
        // Update market condition based on most severe active warning
        self.update_market_condition();
        
        // In a real implementation, this would also publish the warning
        // to the message bus for other agents to consume
    }

    /// Update the overall market condition based on active warnings
    fn update_market_condition(&mut self) {
        // Default to normal if no warnings
        if self.active_warnings.is_empty() {
            self.state.market_condition = MarketCondition::Normal;
            return;
        }
        
        // Find the most severe warning
        let most_severe = self.active_warnings.iter()
            .max_by_key(|w| match w.severity {
                ExpectedImpact::Low => 1,
                ExpectedImpact::Medium => 2,
                ExpectedImpact::High => 3,
                ExpectedImpact::Critical => 4,
            })
            .unwrap();
        
        // Set market condition based on severity
        self.state.market_condition = match most_severe.severity {
            ExpectedImpact::Low => MarketCondition::Normal,
            ExpectedImpact::Medium => MarketCondition::Cautious,
            ExpectedImpact::High => MarketCondition::HighRisk,
            ExpectedImpact::Critical => match most_severe.warning_type {
                EventType::CPIRelease | EventType::FOMCMeeting => MarketCondition::EmergencyOnly,
                _ => MarketCondition::FullStop,
            },
        };
    }

    /// Clean up expired warnings
    pub fn clean_expired_warnings(&mut self) {
        let now = Utc::now();
        self.active_warnings.retain(|w| w.expires_at > now);
        self.update_market_condition();
    }
}

#[async_trait]
impl Agent for MacroSentinel {
    async fn process(&mut self) -> anyhow::Result<Vec<Message>> {
        // Clean up expired warnings
        self.clean_expired_warnings();
        
        // Fetch updated economic calendar
        self.fetch_economic_calendar().await?;
        
        // Check for tariff announcements
        self.check_tariff_announcements().await?;
        
        // Monitor ETF flows
        self.monitor_etf_flows().await?;
        
        // Check for imminent events
        let now = Utc::now();
        let imminent_events: Vec<_> = self.economic_calendar.values()
            .filter(|e| e.time > now && e.time < now + chrono::Duration::hours(24))
            .filter(|e| e.importance >= self.config.importance_threshold)
            .collect();
        
        // Create messages for imminent events
        let mut messages = Vec::new();
        for event in imminent_events {
            let warning = MacroWarning {
                warning_type: event.event_type.clone(),
                severity: event.expected_impact.clone(),
                issued_at: now,
                expires_at: event.time + chrono::Duration::hours(2),
                affected_markets: vec!["ALL".to_string()], // This would be more specific in a real implementation
                recommended_action: match event.expected_impact {
                    ExpectedImpact::Low => MarketCondition::Normal,
                    ExpectedImpact::Medium => MarketCondition::Cautious,
                    ExpectedImpact::High => MarketCondition::HighRisk,
                    ExpectedImpact::Critical => MarketCondition::EmergencyOnly,
                },
            };
            
            self.issue_warning(warning.clone());
            
            messages.push(Message::MacroWarning(warning));
        }
        
        // Update last check time
        self.state.last_check = now;
        
        Ok(messages)
    }

    fn name(&self) -> &str {
        "macro_sentinel"
    }

    fn is_active(&self) -> bool {
        self.state.active
    }

    fn set_active(&mut self, active: bool) {
        self.state.active = active;
    }
}
