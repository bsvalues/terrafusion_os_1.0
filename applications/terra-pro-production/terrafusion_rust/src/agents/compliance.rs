use crate::agents::base::{Agent, AgentHealth, create_success_response, create_error_response};
use crate::mcp::protocol::{MCPMessage, MCPResponseMessage};
use async_trait::async_trait;
use serde_json;
use tracing::{info, warn, error};
use std::collections::HashMap;

#[derive(Default)]
pub struct ComplianceAgent {
    pub ruleset: ComplianceRuleset,
    pub violations_cache: HashMap<String, Vec<ComplianceViolation>>,
}

impl ComplianceAgent {
    pub fn new() -> Self {
        Self {
            ruleset: ComplianceRuleset::default(),
            violations_cache: HashMap::new(),
        }
    }

    async fn check_uspap_compliance(&self, appraisal_data: &serde_json::Value) -> Vec<ComplianceViolation> {
        let mut violations = Vec::new();

        if !self.has_required_field(appraisal_data, "subject_property_address") {
            violations.push(ComplianceViolation {
                rule: "USPAP SR1-2(e)".to_string(),
                severity: ViolationSeverity::Critical,
                description: "Subject property address is required".to_string(),
                field: Some("subject_property_address".to_string()),
                suggestion: "Add complete subject property address".to_string(),
            });
        }

        if !self.has_required_field(appraisal_data, "effective_date") {
            violations.push(ComplianceViolation {
                rule: "USPAP SR1-1(a)".to_string(),
                severity: ViolationSeverity::Critical,
                description: "Effective date of appraisal is required".to_string(),
                field: Some("effective_date".to_string()),
                suggestion: "Specify the effective date of the appraisal".to_string(),
            });
        }

        let comparable_count = appraisal_data.get("comparables")
            .and_then(|v| v.as_array())
            .map(|arr| arr.len())
            .unwrap_or(0);

        if comparable_count < 3 {
            violations.push(ComplianceViolation {
                rule: "USPAP SR1-4(b)".to_string(),
                severity: ViolationSeverity::Warning,
                description: "Minimum of 3 comparable sales recommended".to_string(),
                field: Some("comparables".to_string()),
                suggestion: format!("Add {} more comparable sales", 3 - comparable_count),
            });
        }

        violations
    }

    async fn check_uad_compliance(&self, form_data: &serde_json::Value) -> Vec<ComplianceViolation> {
        let mut violations = Vec::new();

        let required_uad_fields = vec![
            "borrower_name",
            "property_address",
            "legal_description",
            "assessor_parcel_number",
            "property_rights_appraised",
        ];

        for field in required_uad_fields {
            if !self.has_required_field(form_data, field) {
                violations.push(ComplianceViolation {
                    rule: "UAD Requirement".to_string(),
                    severity: ViolationSeverity::Critical,
                    description: format!("Required UAD field '{}' is missing", field),
                    field: Some(field.to_string()),
                    suggestion: format!("Complete the {} field", field),
                });
            }
        }

        violations
    }

    fn has_required_field(&self, data: &serde_json::Value, field: &str) -> bool {
        data.get(field)
            .map(|v| !v.is_null() && v.as_str().map(|s| !s.trim().is_empty()).unwrap_or(true))
            .unwrap_or(false)
    }

    async fn generate_compliance_report(&self, violations: &[ComplianceViolation]) -> ComplianceReport {
        let critical_count = violations.iter().filter(|v| matches!(v.severity, ViolationSeverity::Critical)).count();
        let warning_count = violations.iter().filter(|v| matches!(v.severity, ViolationSeverity::Warning)).count();

        let overall_status = if critical_count > 0 {
            ComplianceStatus::NonCompliant
        } else if warning_count > 0 {
            ComplianceStatus::ConditionallyCompliant
        } else {
            ComplianceStatus::Compliant
        };

        ComplianceReport {
            status: overall_status,
            total_violations: violations.len(),
            critical_violations: critical_count,
            warning_violations: warning_count,
            violations: violations.to_vec(),
            recommendations: self.generate_recommendations(violations),
            compliance_score: self.calculate_compliance_score(violations),
        }
    }

    fn generate_recommendations(&self, violations: &[ComplianceViolation]) -> Vec<String> {
        violations.iter()
            .map(|v| v.suggestion.clone())
            .collect()
    }

    fn calculate_compliance_score(&self, violations: &[ComplianceViolation]) -> f64 {
        if violations.is_empty() {
            return 100.0;
        }

        let critical_penalty = violations.iter()
            .filter(|v| matches!(v.severity, ViolationSeverity::Critical))
            .count() as f64 * 25.0;

        let warning_penalty = violations.iter()
            .filter(|v| matches!(v.severity, ViolationSeverity::Warning))
            .count() as f64 * 5.0;

        (100.0 - critical_penalty - warning_penalty).max(0.0)
    }
}

#[async_trait]
impl Agent for ComplianceAgent {
    fn id(&self) -> &str {
        "compliance-agent"
    }

    fn capabilities(&self) -> Vec<String> {
        vec![
            "uspap-compliance".to_string(),
            "uad-compliance".to_string(),
            "form-validation".to_string(),
            "regulatory-review".to_string(),
        ]
    }

    async fn health_check(&self) -> AgentHealth {
        AgentHealth::healthy("Compliance agent operational")
    }

    async fn handle(&mut self, msg: MCPMessage) -> MCPResponseMessage {
        info!("ComplianceAgent processing message: {}", msg.content_type);

        match msg.content_type.as_str() {
            "compliance-check-request" => {
                let mut all_violations = Vec::new();

                if let Some(appraisal_data) = msg.content.get("appraisal_data") {
                    let uspap_violations = self.check_uspap_compliance(appraisal_data).await;
                    all_violations.extend(uspap_violations);
                }

                if let Some(form_data) = msg.content.get("form_data") {
                    let uad_violations = self.check_uad_compliance(form_data).await;
                    all_violations.extend(uad_violations);
                }

                let report = self.generate_compliance_report(&all_violations).await;

                let content = serde_json::json!({
                    "compliance_report": report,
                    "checked_at": chrono::Utc::now().to_rfc3339(),
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

#[derive(Default)]
pub struct ComplianceRuleset {
    pub uspap_rules: Vec<String>,
    pub uad_requirements: Vec<String>,
    pub state_regulations: HashMap<String, Vec<String>>,
}

#[derive(serde::Serialize, serde::Deserialize, Clone)]
pub struct ComplianceViolation {
    pub rule: String,
    pub severity: ViolationSeverity,
    pub description: String,
    pub field: Option<String>,
    pub suggestion: String,
}

#[derive(serde::Serialize, serde::Deserialize, Clone)]
pub enum ViolationSeverity {
    Critical,
    Warning,
    Info,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct ComplianceReport {
    pub status: ComplianceStatus,
    pub total_violations: usize,
    pub critical_violations: usize,
    pub warning_violations: usize,
    pub violations: Vec<ComplianceViolation>,
    pub recommendations: Vec<String>,
    pub compliance_score: f64,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub enum ComplianceStatus {
    Compliant,
    ConditionallyCompliant,
    NonCompliant,
}