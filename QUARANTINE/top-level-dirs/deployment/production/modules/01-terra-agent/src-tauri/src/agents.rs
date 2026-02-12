use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AgentCapability {
    pub name: String,
    pub description: String,
    pub enabled: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AgentPerformance {
    pub accuracy: f64,
    pub response_time: String,
    pub uptime: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AgentDetails {
    pub id: String,
    pub name: String,
    pub r#type: String,
    pub status: String,
    pub description: String,
    pub capabilities: Vec<AgentCapability>,
    pub performance: AgentPerformance,
}

impl AgentDetails {
    pub fn new(id: String, name: String, agent_type: String) -> Self {
        Self {
            id: id.clone(),
            name: name.clone(),
            r#type: agent_type.clone(),
            status: "active".to_string(),
            description: format!("Detailed information for {}", name),
            capabilities: vec![
                AgentCapability {
                    name: "data-analysis".to_string(),
                    description: "Advanced data analysis capabilities".to_string(),
                    enabled: true,
                },
                AgentCapability {
                    name: "pattern-recognition".to_string(),
                    description: "Pattern recognition in market data".to_string(),
                    enabled: true,
                },
                AgentCapability {
                    name: "reporting".to_string(),
                    description: "Automated report generation".to_string(),
                    enabled: true,
                },
            ],
            performance: AgentPerformance {
                accuracy: 0.95,
                response_time: "150ms".to_string(),
                uptime: "99.9%".to_string(),
            },
        }
    }
}