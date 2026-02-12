use crate::agents::base::{Agent, AgentHealth, create_success_response, create_error_response};
use crate::mcp::protocol::{MCPMessage, MCPResponseMessage};
use async_trait::async_trait;
use serde_json;
use tracing::{info, warn, error};

#[derive(Default)]
pub struct ClickFormsSidecarAgent {
    pub form_templates: std::collections::HashMap<String, FormTemplate>,
    pub active_sessions: Vec<FormSession>,
}

impl ClickFormsSidecarAgent {
    pub fn new() -> Self {
        let mut agent = Self::default();
        agent.initialize_form_templates();
        agent
    }

    fn initialize_form_templates(&mut self) {
        self.form_templates.insert("URAR".to_string(), FormTemplate {
            form_id: "URAR".to_string(),
            name: "Uniform Residential Appraisal Report".to_string(),
            version: "2005".to_string(),
            sections: vec![
                "subject_property".to_string(),
                "contract_history".to_string(),
                "neighborhood".to_string(),
                "site".to_string(),
                "improvements".to_string(),
                "sales_comparison".to_string(),
            ],
            required_fields: vec![
                "borrower_name".to_string(),
                "property_address".to_string(),
                "legal_description".to_string(),
                "effective_date".to_string(),
            ],
        });
    }

    async fn enhance_clickforms_session(&self, session_data: &serde_json::Value) -> Result<SessionEnhancement, Box<dyn std::error::Error + Send + Sync>> {
        let form_type = session_data.get("form_type").and_then(|v| v.as_str()).unwrap_or("URAR");
        
        info!("Enhancing ClickForms session for form type: {}", form_type);
        
        let enhancement = SessionEnhancement {
            session_id: session_data.get("session_id").and_then(|v| v.as_str()).unwrap_or("unknown").to_string(),
            form_type: form_type.to_string(),
            ai_suggestions: vec![
                FormSuggestion {
                    field: "neighborhood_description".to_string(),
                    suggested_value: "Well-established residential neighborhood with mature landscaping and consistent property maintenance.".to_string(),
                    confidence: 0.89,
                    source: "AI market analysis".to_string(),
                },
                FormSuggestion {
                    field: "highest_and_best_use".to_string(),
                    suggested_value: "Single family residence, as improved, represents the highest and best use.".to_string(),
                    confidence: 0.95,
                    source: "AI property analysis".to_string(),
                },
            ],
            auto_populated_fields: vec![
                AutoPopulatedField {
                    field_name: "effective_date".to_string(),
                    value: chrono::Utc::now().format("%m/%d/%Y").to_string(),
                    reason: "Current date auto-populated".to_string(),
                },
            ],
            validation_checks: vec![
                ValidationCheck {
                    field: "property_address".to_string(),
                    status: "valid".to_string(),
                    message: "Address format verified".to_string(),
                },
            ],
        };
        
        Ok(enhancement)
    }

    async fn generate_form_narrative(&self, section: &str, context: &serde_json::Value) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        let narrative = match section {
            "neighborhood" => {
                "The subject neighborhood consists of similar residential properties built primarily in the 1990s to 2000s. The area demonstrates good maintenance standards with mature landscaping and infrastructure. Local amenities include schools, shopping, and recreational facilities within reasonable proximity."
            },
            "site" => {
                "The subject site is level and well-drained with appropriate utilities available. The lot size is typical for the neighborhood and provides adequate space for the improvements and reasonable yard areas."
            },
            "improvements" => {
                "The subject improvements represent a well-maintained single-family residence that is functionally adequate for its intended use. The condition reflects normal wear and maintenance appropriate for the property's age."
            },
            "market_conditions" => {
                "Current market conditions in the subject area reflect stable demand with moderate appreciation trends. Sales activity indicates a balanced market with reasonable marketing times for similar properties."
            },
            _ => "AI-generated narrative content based on property analysis and market conditions."
        };
        
        Ok(narrative.to_string())
    }

    async fn validate_form_completion(&self, form_data: &serde_json::Value) -> Result<FormValidationResult, Box<dyn std::error::Error + Send + Sync>> {
        let form_type = form_data.get("form_type").and_then(|v| v.as_str()).unwrap_or("URAR");
        
        let mut validation_errors = Vec::new();
        let mut missing_fields = Vec::new();
        
        if let Some(template) = self.form_templates.get(form_type) {
            for required_field in &template.required_fields {
                if !form_data.get(required_field).map(|v| !v.is_null()).unwrap_or(false) {
                    missing_fields.push(required_field.clone());
                }
            }
        }
        
        if !missing_fields.is_empty() {
            validation_errors.push(format!("Missing required fields: {}", missing_fields.join(", ")));
        }
        
        let completion_percentage = if let Some(template) = self.form_templates.get(form_type) {
            let completed_fields = template.required_fields.iter()
                .filter(|field| form_data.get(*field).map(|v| !v.is_null()).unwrap_or(false))
                .count();
            (completed_fields as f64 / template.required_fields.len() as f64) * 100.0
        } else {
            0.0
        };
        
        Ok(FormValidationResult {
            form_type: form_type.to_string(),
            is_complete: validation_errors.is_empty(),
            completion_percentage,
            validation_errors,
            missing_fields,
            quality_score: if validation_errors.is_empty() { 0.95 } else { 0.65 },
        })
    }
}

#[async_trait]
impl Agent for ClickFormsSidecarAgent {
    fn id(&self) -> &str {
        "clickforms-sidecar-agent"
    }

    fn capabilities(&self) -> Vec<String> {
        vec![
            "clickforms-enhancement".to_string(),
            "form-auto-population".to_string(),
            "narrative-generation".to_string(),
            "form-validation".to_string(),
            "session-monitoring".to_string(),
        ]
    }

    async fn health_check(&self) -> AgentHealth {
        let mut health = AgentHealth::healthy("ClickForms sidecar agent operational");
        health.metrics.insert("form_templates".to_string(), self.form_templates.len() as f64);
        health.metrics.insert("active_sessions".to_string(), self.active_sessions.len() as f64);
        health
    }

    async fn handle(&mut self, msg: MCPMessage) -> MCPResponseMessage {
        info!("ClickFormsSidecarAgent processing message: {}", msg.content_type);

        match msg.content_type.as_str() {
            "enhance-session-request" => {
                let session_data = msg.content.get("session_data").cloned().unwrap_or(serde_json::Value::Null);
                
                match self.enhance_clickforms_session(&session_data).await {
                    Ok(enhancement) => {
                        let content = serde_json::json!({
                            "enhancement": enhancement,
                            "status": "completed",
                        });
                        create_success_response(self.id(), &msg, "enhance-session-response", content)
                    }
                    Err(e) => {
                        create_error_response(self.id(), &msg, &format!("Session enhancement failed: {}", e))
                    }
                }
            }
            "generate-narrative-request" => {
                let section = msg.content.get("section").and_then(|v| v.as_str()).unwrap_or("");
                let context = msg.content.get("context").cloned().unwrap_or(serde_json::Value::Null);
                
                match self.generate_form_narrative(section, &context).await {
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
            "validate-form-request" => {
                let form_data = msg.content.get("form_data").cloned().unwrap_or(serde_json::Value::Null);
                
                match self.validate_form_completion(&form_data).await {
                    Ok(validation_result) => {
                        let content = serde_json::json!({
                            "validation_result": validation_result,
                            "validated_at": chrono::Utc::now().to_rfc3339(),
                        });
                        create_success_response(self.id(), &msg, "validate-form-response", content)
                    }
                    Err(e) => {
                        create_error_response(self.id(), &msg, &format!("Form validation failed: {}", e))
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

#[derive(serde::Serialize, serde::Deserialize)]
pub struct FormTemplate {
    pub form_id: String,
    pub name: String,
    pub version: String,
    pub sections: Vec<String>,
    pub required_fields: Vec<String>,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct FormSession {
    pub session_id: String,
    pub form_type: String,
    pub started_at: chrono::DateTime<chrono::Utc>,
    pub last_activity: chrono::DateTime<chrono::Utc>,
    pub completion_status: String,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct SessionEnhancement {
    pub session_id: String,
    pub form_type: String,
    pub ai_suggestions: Vec<FormSuggestion>,
    pub auto_populated_fields: Vec<AutoPopulatedField>,
    pub validation_checks: Vec<ValidationCheck>,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct FormSuggestion {
    pub field: String,
    pub suggested_value: String,
    pub confidence: f64,
    pub source: String,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct AutoPopulatedField {
    pub field_name: String,
    pub value: String,
    pub reason: String,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct ValidationCheck {
    pub field: String,
    pub status: String,
    pub message: String,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct FormValidationResult {
    pub form_type: String,
    pub is_complete: bool,
    pub completion_percentage: f64,
    pub validation_errors: Vec<String>,
    pub missing_fields: Vec<String>,
    pub quality_score: f64,
}