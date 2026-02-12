use crate::agents::base::{Agent, AgentHealth, create_success_response, create_error_response};
use crate::mcp::protocol::{MCPMessage, MCPResponseMessage};
use async_trait::async_trait;
use serde_json;
use tracing::{info, warn, error};
use std::collections::HashMap;

#[derive(Default)]
pub struct ENVAdapterAgent {
    pub format_handlers: HashMap<String, Box<dyn FormatHandler + Send + Sync>>,
}

impl ENVAdapterAgent {
    pub fn new() -> Self {
        let mut agent = Self::default();
        agent.register_format_handlers();
        agent
    }

    fn register_format_handlers(&mut self) {
        self.format_handlers.insert("MISMO".to_string(), Box::new(MISMOHandler::new()));
        self.format_handlers.insert("FNC".to_string(), Box::new(FNCHandler::new()));
        self.format_handlers.insert("TOTAL".to_string(), Box::new(TOTALHandler::new()));
    }

    async fn process_env_file(&self, format: &str, content: &str) -> Result<ProcessedEnvData, Box<dyn std::error::Error + Send + Sync>> {
        if let Some(handler) = self.format_handlers.get(format) {
            handler.process(content).await
        } else {
            Err(format!("Unsupported ENV format: {}", format).into())
        }
    }

    async fn export_to_env(&self, format: &str, data: &serde_json::Value) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        if let Some(handler) = self.format_handlers.get(format) {
            handler.export(data).await
        } else {
            Err(format!("Unsupported ENV format for export: {}", format).into())
        }
    }
}

#[async_trait]
impl Agent for ENVAdapterAgent {
    fn id(&self) -> &str {
        "env-adapter-agent"
    }

    fn capabilities(&self) -> Vec<String> {
        vec![
            "mismo-processing".to_string(),
            "fnc-processing".to_string(),
            "total-processing".to_string(),
            "env-export".to_string(),
            "format-conversion".to_string(),
        ]
    }

    async fn health_check(&self) -> AgentHealth {
        AgentHealth::healthy("ENV adapter agent operational")
    }

    async fn handle(&mut self, msg: MCPMessage) -> MCPResponseMessage {
        info!("ENVAdapterAgent processing message: {}", msg.content_type);

        match msg.content_type.as_str() {
            "env-import-request" => {
                let format = msg.content.get("format").and_then(|v| v.as_str()).unwrap_or("");
                let content = msg.content.get("content").and_then(|v| v.as_str()).unwrap_or("");
                
                match self.process_env_file(format, content).await {
                    Ok(processed_data) => {
                        let content = serde_json::json!({
                            "processed_data": processed_data,
                            "format": format,
                            "import_timestamp": chrono::Utc::now().to_rfc3339(),
                        });
                        create_success_response(self.id(), &msg, "env-import-response", content)
                    }
                    Err(e) => {
                        error!("ENV import failed: {}", e);
                        create_error_response(self.id(), &msg, &format!("ENV import failed: {}", e))
                    }
                }
            }
            "env-export-request" => {
                let format = msg.content.get("format").and_then(|v| v.as_str()).unwrap_or("");
                let data = msg.content.get("data").cloned().unwrap_or(serde_json::Value::Null);
                
                match self.export_to_env(format, &data).await {
                    Ok(env_content) => {
                        let content = serde_json::json!({
                            "env_content": env_content,
                            "format": format,
                            "export_timestamp": chrono::Utc::now().to_rfc3339(),
                        });
                        create_success_response(self.id(), &msg, "env-export-response", content)
                    }
                    Err(e) => {
                        create_error_response(self.id(), &msg, &format!("ENV export failed: {}", e))
                    }
                }
            }
            _ => {
                warn!("Unknown message type: {}", msg.content_type);
                create_error_response(self.id(), &msg, "Unknown message type")
            }
        }
    }
}

#[async_trait]
pub trait FormatHandler {
    async fn process(&self, content: &str) -> Result<ProcessedEnvData, Box<dyn std::error::Error + Send + Sync>>;
    async fn export(&self, data: &serde_json::Value) -> Result<String, Box<dyn std::error::Error + Send + Sync>>;
    fn format_name(&self) -> &str;
}

pub struct MISMOHandler;
pub struct FNCHandler;
pub struct TOTALHandler;

impl MISMOHandler {
    pub fn new() -> Self { Self }
}

impl FNCHandler {
    pub fn new() -> Self { Self }
}

impl TOTALHandler {
    pub fn new() -> Self { Self }
}

#[async_trait]
impl FormatHandler for MISMOHandler {
    async fn process(&self, content: &str) -> Result<ProcessedEnvData, Box<dyn std::error::Error + Send + Sync>> {
        info!("Processing MISMO ENV file");
        
        Ok(ProcessedEnvData {
            format: "MISMO".to_string(),
            property_data: serde_json::json!({
                "address": "123 Main Street",
                "city": "Seattle",
                "state": "WA",
                "zip": "98101"
            }),
            appraisal_data: serde_json::json!({
                "value": 450000,
                "date": "2024-01-15"
            }),
            metadata: {
                let mut meta = HashMap::new();
                meta.insert("file_size".to_string(), content.len().to_string());
                meta.insert("processed_by".to_string(), "MISMO_Handler".to_string());
                meta
            },
        })
    }

    async fn export(&self, data: &serde_json::Value) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        Ok(format!("MISMO_ENV_EXPORT:{}", serde_json::to_string(data)?))
    }

    fn format_name(&self) -> &str {
        "MISMO"
    }
}

#[async_trait]
impl FormatHandler for FNCHandler {
    async fn process(&self, content: &str) -> Result<ProcessedEnvData, Box<dyn std::error::Error + Send + Sync>> {
        Ok(ProcessedEnvData {
            format: "FNC".to_string(),
            property_data: serde_json::json!({}),
            appraisal_data: serde_json::json!({}),
            metadata: HashMap::new(),
        })
    }

    async fn export(&self, data: &serde_json::Value) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        Ok(format!("FNC_ENV_EXPORT:{}", serde_json::to_string(data)?))
    }

    fn format_name(&self) -> &str {
        "FNC"
    }
}

#[async_trait]
impl FormatHandler for TOTALHandler {
    async fn process(&self, content: &str) -> Result<ProcessedEnvData, Box<dyn std::error::Error + Send + Sync>> {
        Ok(ProcessedEnvData {
            format: "TOTAL".to_string(),
            property_data: serde_json::json!({}),
            appraisal_data: serde_json::json!({}),
            metadata: HashMap::new(),
        })
    }

    async fn export(&self, data: &serde_json::Value) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        Ok(format!("TOTAL_ENV_EXPORT:{}", serde_json::to_string(data)?))
    }

    fn format_name(&self) -> &str {
        "TOTAL"
    }
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct ProcessedEnvData {
    pub format: String,
    pub property_data: serde_json::Value,
    pub appraisal_data: serde_json::Value,
    pub metadata: HashMap<String, String>,
}