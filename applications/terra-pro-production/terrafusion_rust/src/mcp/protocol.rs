use serde::{Serialize, Deserialize};
use uuid::Uuid;
use std::collections::HashMap;
use chrono::{DateTime, Utc};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct MCPMessage {
    pub message_id: String,
    pub timestamp: DateTime<Utc>,
    pub sender: String,
    pub recipient: String,
    pub content_type: String,
    pub content: serde_json::Value,
    pub metadata: HashMap<String, String>,
    pub priority: MessagePriority,
    pub expires_at: Option<DateTime<Utc>>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub enum MessagePriority {
    Low,
    Normal,
    High,
    Critical,
}

impl Default for MessagePriority {
    fn default() -> Self {
        MessagePriority::Normal
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct MCPResponseMessage {
    pub in_response_to: String,
    pub status: ResponseStatus,
    pub message: MCPMessage,
    pub error: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub enum ResponseStatus {
    Success,
    Error,
    Pending,
    Timeout,
}

impl MCPMessage {
    pub fn new(sender: String, recipient: String, content_type: String, content: serde_json::Value) -> Self {
        Self {
            message_id: Uuid::new_v4().to_string(),
            timestamp: Utc::now(),
            sender,
            recipient,
            content_type,
            content,
            metadata: HashMap::new(),
            priority: MessagePriority::default(),
            expires_at: None,
        }
    }

    pub fn with_priority(mut self, priority: MessagePriority) -> Self {
        self.priority = priority;
        self
    }

    pub fn with_expiry(mut self, expires_at: DateTime<Utc>) -> Self {
        self.expires_at = Some(expires_at);
        self
    }

    pub fn add_metadata(mut self, key: String, value: String) -> Self {
        self.metadata.insert(key, value);
        self
    }

    pub fn is_expired(&self) -> bool {
        if let Some(expires_at) = self.expires_at {
            Utc::now() > expires_at
        } else {
            false
        }
    }
}