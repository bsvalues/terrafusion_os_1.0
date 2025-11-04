use crate::mcp::protocol::{MCPMessage, MCPResponseMessage, ResponseStatus};
use async_trait::async_trait;
use serde_json;
use uuid::Uuid;
use chrono::Utc;
use std::collections::HashMap;

#[async_trait]
pub trait Agent: Send + Sync {
    fn id(&self) -> &str;
    fn capabilities(&self) -> Vec<String>;
    fn version(&self) -> &str { "1.0.0" }
    
    async fn handle(&mut self, msg: MCPMessage) -> MCPResponseMessage;
    async fn initialize(&mut self) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        Ok(())
    }
    async fn shutdown(&mut self) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        Ok(())
    }
    async fn health_check(&self) -> AgentHealth;
}

#[derive(Clone, Debug)]
pub struct AgentHealth {
    pub status: HealthStatus,
    pub message: String,
    pub last_activity: chrono::DateTime<Utc>,
    pub metrics: HashMap<String, f64>,
}

#[derive(Clone, Debug)]
pub enum HealthStatus {
    Healthy,
    Warning,
    Critical,
    Unknown,
}

impl AgentHealth {
    pub fn healthy(message: &str) -> Self {
        Self {
            status: HealthStatus::Healthy,
            message: message.to_string(),
            last_activity: Utc::now(),
            metrics: HashMap::new(),
        }
    }

    pub fn warning(message: &str) -> Self {
        Self {
            status: HealthStatus::Warning,
            message: message.to_string(),
            last_activity: Utc::now(),
            metrics: HashMap::new(),
        }
    }

    pub fn critical(message: &str) -> Self {
        Self {
            status: HealthStatus::Critical,
            message: message.to_string(),
            last_activity: Utc::now(),
            metrics: HashMap::new(),
        }
    }
}

pub fn create_success_response(agent_id: &str, original_msg: &MCPMessage, content_type: &str, content: serde_json::Value) -> MCPResponseMessage {
    let reply = MCPMessage {
        message_id: Uuid::new_v4().to_string(),
        timestamp: Utc::now(),
        sender: agent_id.to_string(),
        recipient: original_msg.sender.clone(),
        content_type: content_type.to_string(),
        content,
        metadata: {
            let mut meta = HashMap::new();
            meta.insert("agent_version".to_string(), "1.0.0".to_string());
            meta.insert("processed_at".to_string(), Utc::now().to_rfc3339());
            meta
        },
        priority: original_msg.priority.clone(),
        expires_at: None,
    };

    MCPResponseMessage {
        in_response_to: original_msg.message_id.clone(),
        status: ResponseStatus::Success,
        message: reply,
        error: None,
    }
}

pub fn create_error_response(agent_id: &str, original_msg: &MCPMessage, error: &str) -> MCPResponseMessage {
    let reply = MCPMessage {
        message_id: Uuid::new_v4().to_string(),
        timestamp: Utc::now(),
        sender: agent_id.to_string(),
        recipient: original_msg.sender.clone(),
        content_type: "error".to_string(),
        content: serde_json::json!({"error": error}),
        metadata: HashMap::new(),
        priority: original_msg.priority.clone(),
        expires_at: None,
    };

    MCPResponseMessage {
        in_response_to: original_msg.message_id.clone(),
        status: ResponseStatus::Error,
        message: reply,
        error: Some(error.to_string()),
    }
}