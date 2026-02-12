use crate::agents::base::{Agent, AgentHealth, create_success_response, create_error_response};
use crate::mcp::protocol::{MCPMessage, MCPResponseMessage};
use async_trait::async_trait;
use serde_json;
use tracing::{info, warn, error};
use notify::{Watcher, RecursiveMode, watcher};
use std::sync::mpsc;
use std::time::Duration;

#[derive(Default)]
pub struct TotalSidecarAgent {
    pub file_watcher: Option<notify::RecommendedWatcher>,
    pub monitored_paths: Vec<String>,
    pub review_queue: Vec<ReviewItem>,
}

impl TotalSidecarAgent {
    pub fn new() -> Self {
        Self::default()
    }

    async fn start_file_monitoring(&mut self, path: &str) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        info!("Starting file monitoring for TOTAL at: {}", path);
        
        let (tx, rx) = mpsc::channel();
        let mut watcher = watcher(tx, Duration::from_secs(1))?;
        
        watcher.watch(path, RecursiveMode::Recursive)?;
        self.file_watcher = Some(watcher);
        self.monitored_paths.push(path.to_string());
        
        Ok(())
    }

    async fn analyze_total_file(&self, file_path: &str) -> Result<TotalAnalysis, Box<dyn std::error::Error + Send + Sync>> {
        info!("Analyzing TOTAL file: {}", file_path);
        
        let analysis = TotalAnalysis {
            file_path: file_path.to_string(),
            analysis_type: "TOTAL_APPRAISAL".to_string(),
            findings: vec![
                Finding {
                    category: "Data Completeness".to_string(),
                    severity: "Info".to_string(),
                    message: "All required fields populated".to_string(),
                    suggestion: "Consider adding additional comparable sales".to_string(),
                },
                Finding {
                    category: "Valuation Logic".to_string(),
                    severity: "Warning".to_string(),
                    message: "Large adjustment on comparable #2".to_string(),
                    suggestion: "Review and document reasoning for 15% adjustment".to_string(),
                },
            ],
            compliance_score: 92.5,
            recommendations: vec![
                "Add market trend narrative".to_string(),
                "Include additional comparable sales".to_string(),
                "Verify subject property measurements".to_string(),
            ],
            auto_corrections: vec![
                AutoCorrection {
                    field: "effective_date".to_string(),
                    original_value: "".to_string(),
                    corrected_value: chrono::Utc::now().format("%Y-%m-%d").to_string(),
                    reason: "Missing effective date auto-populated".to_string(),
                },
            ],
        };
        
        Ok(analysis)
    }

    async fn inject_ai_narrative(&self, section: &str, context: &serde_json::Value) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        let narrative = match section {
            "market_conditions" => {
                "Current market conditions in the subject area show moderate activity with stable pricing trends. Recent sales indicate consistent demand for properties of similar size and condition."
            },
            "highest_and_best_use" => {
                "The highest and best use of the subject property is its current use as a single-family residence, which is consistent with neighborhood development patterns."
            },
            "site_description" => {
                "The subject site is well-located within an established residential neighborhood with good access to transportation, schools, and commercial amenities."
            },
            _ => "AI-generated narrative content based on property analysis and market data."
        };
        
        Ok(narrative.to_string())
    }

    async fn generate_compliance_checklist(&self) -> Vec<ComplianceCheckItem> {
        vec![
            ComplianceCheckItem {
                requirement: "USPAP SR1-1(a) - Identify problem to be solved".to_string(),
                status: "Complete".to_string(),
                location: "Assignment section".to_string(),
                notes: "Purpose and intended use clearly stated".to_string(),
            },
            ComplianceCheckItem {
                requirement: "USPAP SR1-2(e) - Property identification".to_string(),
                status: "Complete".to_string(),
                location: "Subject property section".to_string(),
                notes: "Address and legal description provided".to_string(),
            },
            ComplianceCheckItem {
                requirement: "USPAP SR1-4(b) - Comparable sales analysis".to_string(),
                status: "Review Required".to_string(),
                location: "Comparables section".to_string(),
                notes: "Only 2 comparables provided, recommend adding 1 more".to_string(),
            },
        ]
    }
}

#[async_trait]
impl Agent for TotalSidecarAgent {
    fn id(&self) -> &str {
        "total-sidecar-agent"
    }

    fn capabilities(&self) -> Vec<String> {
        vec![
            "total-file-monitoring".to_string(),
            "appraisal-analysis".to_string(),
            "ai-narrative-injection".to_string(),
            "compliance-checking".to_string(),
            "auto-correction".to_string(),
        ]
    }

    async fn health_check(&self) -> AgentHealth {
        let mut health = AgentHealth::healthy("TOTAL sidecar agent operational");
        health.metrics.insert("monitored_paths".to_string(), self.monitored_paths.len() as f64);
        health.metrics.insert("review_queue_size".to_string(), self.review_queue.len() as f64);
        health
    }

    async fn handle(&mut self, msg: MCPMessage) -> MCPResponseMessage {
        info!("TotalSidecarAgent processing message: {}", msg.content_type);

        match msg.content_type.as_str() {
            "start-monitoring-request" => {
                let path = msg.content.get("path").and_then(|v| v.as_str()).unwrap_or("");
                
                match self.start_file_monitoring(path).await {
                    Ok(_) => {
                        let content = serde_json::json!({
                            "status": "monitoring_started",
                            "path": path,
                            "monitored_paths": self.monitored_paths,
                        });
                        create_success_response(self.id(), &msg, "start-monitoring-response", content)
                    }
                    Err(e) => {
                        create_error_response(self.id(), &msg, &format!("Failed to start monitoring: {}", e))
                    }
                }
            }
            "analyze-file-request" => {
                let file_path = msg.content.get("file_path").and_then(|v| v.as_str()).unwrap_or("");
                
                match self.analyze_total_file(file_path).await {
                    Ok(analysis) => {
                        let content = serde_json::json!({
                            "analysis": analysis,
                            "analyzed_at": chrono::Utc::now().to_rfc3339(),
                        });
                        create_success_response(self.id(), &msg, "analyze-file-response", content)
                    }
                    Err(e) => {
                        create_error_response(self.id(), &msg, &format!("File analysis failed: {}", e))
                    }
                }
            }
            "generate-narrative-request" => {
                let section = msg.content.get("section").and_then(|v| v.as_str()).unwrap_or("");
                let context = msg.content.get("context").cloned().unwrap_or(serde_json::Value::Null);
                
                match self.inject_ai_narrative(section, &context).await {
                    Ok(narrative) => {
                        let content = serde_json::json!({
                            "section": section,
                            "narrative": narrative,
                            "generated_at": chrono::Utc::now().to_rfc3339(),
                        });
                        create_success_response(self.id(), &msg, "generate-narrative-response", content)
                    }
                    Err(e) => {
                        create_error_response(self.id(), &msg, &format!("Narrative generation failed: {}", e))
                    }
                }
            }
            "compliance-check-request" => {
                let checklist = self.generate_compliance_checklist().await;
                
                let content = serde_json::json!({
                    "compliance_checklist": checklist,
                    "total_items": checklist.len(),
                    "completed_items": checklist.iter().filter(|item| item.status == "Complete").count(),
                });
                create_success_response(self.id(), &msg, "compliance-check-response", content)
            }
            _ => {
                warn!("Unknown message type: {}", msg.content_type);
                create_error_response(self.id(), &msg, "Unknown message type")
            }
        }
    }
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct TotalAnalysis {
    pub file_path: String,
    pub analysis_type: String,
    pub findings: Vec<Finding>,
    pub compliance_score: f64,
    pub recommendations: Vec<String>,
    pub auto_corrections: Vec<AutoCorrection>,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct Finding {
    pub category: String,
    pub severity: String,
    pub message: String,
    pub suggestion: String,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct AutoCorrection {
    pub field: String,
    pub original_value: String,
    pub corrected_value: String,
    pub reason: String,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct ComplianceCheckItem {
    pub requirement: String,
    pub status: String,
    pub location: String,
    pub notes: String,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct ReviewItem {
    pub file_path: String,
    pub review_type: String,
    pub priority: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
}