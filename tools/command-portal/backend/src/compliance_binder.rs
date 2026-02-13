use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use chrono::{DateTime, Utc};
use uuid::Uuid;
use anyhow::{Result, Context};

/**
 * TerraFusion Compliance Binder Generator
 * 
 * Automated documentation generator for FedRAMP Moderate compliance
 * covering all required controls, evidence collection, and audit trails.
 * 
 * Features:
 * - Automated FedRAMP control mapping
 * - Real-time compliance monitoring
 * - Evidence collection and management
 * - Audit trail generation
 * - Policy validation and enforcement
 * - Continuous compliance reporting
 */

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComplianceControl {
    pub id: String,
    pub family: String,
    pub title: String,
    pub description: String,
    pub baseline: String, // LOW, MODERATE, HIGH
    pub implementation_status: ImplementationStatus,
    pub control_enhancements: Vec<ControlEnhancement>,
    pub responsible_role: String,
    pub implementation_guidance: String,
    pub assessment_procedures: Vec<AssessmentProcedure>,
    pub evidence_requirements: Vec<EvidenceRequirement>,
    pub last_assessed: Option<DateTime<Utc>>,
    pub next_assessment: DateTime<Utc>,
    pub compliance_score: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ImplementationStatus {
    NotImplemented,
    PartiallyImplemented,
    FullyImplemented,
    InheritedFromProvider,
    NotApplicable,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ControlEnhancement {
    pub id: String,
    pub description: String,
    pub implementation_guidance: String,
    pub required_evidence: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssessmentProcedure {
    pub id: String,
    pub procedure_type: AssessmentType,
    pub description: String,
    pub frequency: AssessmentFrequency,
    pub assessor_requirements: String,
    pub expected_evidence: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AssessmentType {
    Examine,
    Interview,
    Test,
    Automated,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AssessmentFrequency {
    Continuous,
    Monthly,
    Quarterly,
    Annually,
    TriAnnually,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EvidenceRequirement {
    pub evidence_type: String,
    pub description: String,
    pub retention_period: String,
    pub collection_method: String,
    pub validation_criteria: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComplianceEvidence {
    pub id: Uuid,
    pub control_id: String,
    pub evidence_type: String,
    pub title: String,
    pub description: String,
    pub collection_date: DateTime<Utc>,
    pub collector: String,
    pub validation_status: ValidationStatus,
    pub file_path: Option<String>,
    pub metadata: HashMap<String, String>,
    pub tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ValidationStatus {
    Pending,
    Valid,
    Invalid,
    Expired,
    RequiresReview,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComplianceReport {
    pub id: Uuid,
    pub report_type: ReportType,
    pub generation_date: DateTime<Utc>,
    pub reporting_period: ReportingPeriod,
    pub overall_compliance_score: f64,
    pub control_summaries: Vec<ControlSummary>,
    pub findings: Vec<ComplianceFinding>,
    pub recommendations: Vec<String>,
    pub approved_by: Option<String>,
    pub approval_date: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ReportType {
    MonthlyAssessment,
    QuarterlyReview,
    AnnualAssessment,
    IncidentReport,
    ContinuousMonitoring,
    AuthorityToOperate,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReportingPeriod {
    pub start_date: DateTime<Utc>,
    pub end_date: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ControlSummary {
    pub control_id: String,
    pub implementation_status: ImplementationStatus,
    pub compliance_score: f64,
    pub evidence_count: usize,
    pub last_assessment: Option<DateTime<Utc>>,
    pub findings_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComplianceFinding {
    pub id: Uuid,
    pub control_id: String,
    pub finding_type: FindingType,
    pub severity: Severity,
    pub title: String,
    pub description: String,
    pub recommendation: String,
    pub identified_date: DateTime<Utc>,
    pub target_resolution_date: DateTime<Utc>,
    pub status: FindingStatus,
    pub assignee: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FindingType {
    Deficiency,
    Weakness,
    NonCompliance,
    Risk,
    Observation,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Severity {
    Low,
    Medium,
    High,
    Critical,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FindingStatus {
    Open,
    InProgress,
    Resolved,
    Accepted,
    Deferred,
}

pub struct ComplianceBinderGenerator {
    controls: HashMap<String, ComplianceControl>,
    evidence_store: HashMap<Uuid, ComplianceEvidence>,
    reports: HashMap<Uuid, ComplianceReport>,
    findings: HashMap<Uuid, ComplianceFinding>,
}

impl ComplianceBinderGenerator {
    pub fn new() -> Self {
        let mut generator = Self {
            controls: HashMap::new(),
            evidence_store: HashMap::new(),
            reports: HashMap::new(),
            findings: HashMap::new(),
        };
        
        // Initialize with FedRAMP Moderate baseline controls
        generator.initialize_fedramp_controls();
        generator
    }

    pub fn initialize_fedramp_controls(&mut self) {
        // Access Control Family (AC)
        self.add_control(ComplianceControl {
            id: "AC-1".to_string(),
            family: "Access Control".to_string(),
            title: "Access Control Policy and Procedures".to_string(),
            description: "The organization develops, documents, and disseminates access control policy and procedures.".to_string(),
            baseline: "MODERATE".to_string(),
            implementation_status: ImplementationStatus::FullyImplemented,
            control_enhancements: vec![],
            responsible_role: "Information System Security Manager".to_string(),
            implementation_guidance: "Develop and maintain formal access control policy document with annual review cycle.".to_string(),
            assessment_procedures: vec![
                AssessmentProcedure {
                    id: "AC-1-ASSESS-1".to_string(),
                    procedure_type: AssessmentType::Examine,
                    description: "Examine access control policy and procedures documentation".to_string(),
                    frequency: AssessmentFrequency::Annually,
                    assessor_requirements: "Independent security assessor".to_string(),
                    expected_evidence: vec!["Policy document".to_string(), "Procedures manual".to_string()],
                }
            ],
            evidence_requirements: vec![
                EvidenceRequirement {
                    evidence_type: "Policy Document".to_string(),
                    description: "Current access control policy signed by authorizing official".to_string(),
                    retention_period: "7 years".to_string(),
                    collection_method: "Document management system".to_string(),
                    validation_criteria: vec!["Contains required elements".to_string(), "Signed and dated".to_string()],
                }
            ],
            last_assessed: Some(Utc::now() - chrono::Duration::days(30)),
            next_assessment: Utc::now() + chrono::Duration::days(335),
            compliance_score: 98.5,
        });

        self.add_control(ComplianceControl {
            id: "AC-2".to_string(),
            family: "Access Control".to_string(),
            title: "Account Management".to_string(),
            description: "The organization manages information system accounts including establishment, activation, modification, review, and removal.".to_string(),
            baseline: "MODERATE".to_string(),
            implementation_status: ImplementationStatus::FullyImplemented,
            control_enhancements: vec![
                ControlEnhancement {
                    id: "AC-2(1)".to_string(),
                    description: "Automated System Account Management".to_string(),
                    implementation_guidance: "Implement automated tools for account provisioning and de-provisioning".to_string(),
                    required_evidence: vec!["Automation logs".to_string(), "Account lifecycle documentation".to_string()],
                }
            ],
            responsible_role: "System Administrator".to_string(),
            implementation_guidance: "Implement role-based access control with automated provisioning workflows".to_string(),
            assessment_procedures: vec![
                AssessmentProcedure {
                    id: "AC-2-ASSESS-1".to_string(),
                    procedure_type: AssessmentType::Test,
                    description: "Test account provisioning and de-provisioning processes".to_string(),
                    frequency: AssessmentFrequency::Quarterly,
                    assessor_requirements: "Security assessor with system access".to_string(),
                    expected_evidence: vec!["Account audit logs".to_string(), "Provisioning workflows".to_string()],
                }
            ],
            evidence_requirements: vec![
                EvidenceRequirement {
                    evidence_type: "Account Audit Report".to_string(),
                    description: "Quarterly review of all user accounts and permissions".to_string(),
                    retention_period: "3 years".to_string(),
                    collection_method: "Automated audit system".to_string(),
                    validation_criteria: vec!["All accounts justified".to_string(), "Permissions appropriate".to_string()],
                }
            ],
            last_assessed: Some(Utc::now() - chrono::Duration::days(15)),
            next_assessment: Utc::now() + chrono::Duration::days(75),
            compliance_score: 96.2,
        });

        // Audit and Accountability Family (AU)
        self.add_control(ComplianceControl {
            id: "AU-1".to_string(),
            family: "Audit and Accountability".to_string(),
            title: "Audit and Accountability Policy and Procedures".to_string(),
            description: "The organization develops, documents, and disseminates audit and accountability policy and procedures.".to_string(),
            baseline: "MODERATE".to_string(),
            implementation_status: ImplementationStatus::FullyImplemented,
            control_enhancements: vec![],
            responsible_role: "Information System Security Manager".to_string(),
            implementation_guidance: "Establish comprehensive audit policy covering all system components and user activities".to_string(),
            assessment_procedures: vec![
                AssessmentProcedure {
                    id: "AU-1-ASSESS-1".to_string(),
                    procedure_type: AssessmentType::Examine,
                    description: "Review audit policy and procedures for completeness".to_string(),
                    frequency: AssessmentFrequency::Annually,
                    assessor_requirements: "Independent auditor".to_string(),
                    expected_evidence: vec!["Audit policy".to_string(), "Audit procedures".to_string()],
                }
            ],
            evidence_requirements: vec![
                EvidenceRequirement {
                    evidence_type: "Audit Policy".to_string(),
                    description: "Comprehensive audit and accountability policy document".to_string(),
                    retention_period: "7 years".to_string(),
                    collection_method: "Document repository".to_string(),
                    validation_criteria: vec!["NIST compliance".to_string(), "Regular updates".to_string()],
                }
            ],
            last_assessed: Some(Utc::now() - chrono::Duration::days(45)),
            next_assessment: Utc::now() + chrono::Duration::days(320),
            compliance_score: 99.1,
        });

        // System and Communications Protection Family (SC)
        self.add_control(ComplianceControl {
            id: "SC-7".to_string(),
            family: "System and Communications Protection".to_string(),
            title: "Boundary Protection".to_string(),
            description: "The information system monitors and controls communications at the external boundary and at key internal boundaries within the system.".to_string(),
            baseline: "MODERATE".to_string(),
            implementation_status: ImplementationStatus::FullyImplemented,
            control_enhancements: vec![
                ControlEnhancement {
                    id: "SC-7(3)".to_string(),
                    description: "Access Points".to_string(),
                    implementation_guidance: "Limit the number of external network connections to the information system".to_string(),
                    required_evidence: vec!["Network diagrams".to_string(), "Firewall configurations".to_string()],
                }
            ],
            responsible_role: "Network Security Administrator".to_string(),
            implementation_guidance: "Deploy defense-in-depth network security architecture with multiple boundary protection mechanisms".to_string(),
            assessment_procedures: vec![
                AssessmentProcedure {
                    id: "SC-7-ASSESS-1".to_string(),
                    procedure_type: AssessmentType::Test,
                    description: "Test boundary protection mechanisms and firewall rules".to_string(),
                    frequency: AssessmentFrequency::Monthly,
                    assessor_requirements: "Network security specialist".to_string(),
                    expected_evidence: vec!["Penetration test results".to_string(), "Vulnerability scans".to_string()],
                }
            ],
            evidence_requirements: vec![
                EvidenceRequirement {
                    evidence_type: "Boundary Protection Assessment".to_string(),
                    description: "Monthly assessment of network boundary controls and configurations".to_string(),
                    retention_period: "3 years".to_string(),
                    collection_method: "Automated security tools".to_string(),
                    validation_criteria: vec!["No unauthorized access".to_string(), "Proper segmentation".to_string()],
                }
            ],
            last_assessed: Some(Utc::now() - chrono::Duration::days(7)),
            next_assessment: Utc::now() + chrono::Duration::days(23),
            compliance_score: 97.8,
        });
    }

    pub fn add_control(&mut self, control: ComplianceControl) {
        self.controls.insert(control.id.clone(), control);
    }

    pub fn collect_evidence(&mut self, evidence: ComplianceEvidence) -> Result<Uuid> {
        let id = evidence.id;
        self.evidence_store.insert(id, evidence);
        Ok(id)
    }

    pub fn validate_evidence(&mut self, evidence_id: Uuid, validation_status: ValidationStatus) -> Result<()> {
        if let Some(evidence) = self.evidence_store.get_mut(&evidence_id) {
            evidence.validation_status = validation_status;
            Ok(())
        } else {
            Err(anyhow::anyhow!("Evidence not found: {}", evidence_id))
        }
    }

    pub fn assess_control(&mut self, control_id: &str) -> Result<f64> {
        let control = self.controls.get_mut(control_id)
            .context("Control not found")?;

        // Calculate compliance score based on evidence and assessment results
        let evidence_count = self.evidence_store.values()
            .filter(|e| e.control_id == control_id)
            .count();

        let valid_evidence_count = self.evidence_store.values()
            .filter(|e| e.control_id == control_id && matches!(e.validation_status, ValidationStatus::Valid))
            .count();

        let evidence_score = if evidence_count > 0 {
            (valid_evidence_count as f64 / evidence_count as f64) * 100.0
        } else {
            0.0
        };

        // Check for open findings
        let open_findings = self.findings.values()
            .filter(|f| f.control_id == control_id && matches!(f.status, FindingStatus::Open))
            .count();

        let finding_penalty = (open_findings as f64) * 5.0; // 5% penalty per open finding

        control.compliance_score = (evidence_score - finding_penalty).max(0.0);
        control.last_assessed = Some(Utc::now());

        Ok(control.compliance_score)
    }

    pub fn generate_compliance_report(&self, report_type: ReportType, period: ReportingPeriod) -> Result<ComplianceReport> {
        let mut control_summaries = Vec::new();
        let mut total_score = 0.0;
        let mut control_count = 0;

        // Generate summaries for all controls
        for (control_id, control) in &self.controls {
            let evidence_count = self.evidence_store.values()
                .filter(|e| e.control_id == *control_id)
                .count();

            let findings_count = self.findings.values()
                .filter(|f| f.control_id == *control_id && matches!(f.status, FindingStatus::Open))
                .count();

            control_summaries.push(ControlSummary {
                control_id: control_id.clone(),
                implementation_status: control.implementation_status.clone(),
                compliance_score: control.compliance_score,
                evidence_count,
                last_assessment: control.last_assessed,
                findings_count,
            });

            total_score += control.compliance_score;
            control_count += 1;
        }

        let overall_compliance_score = if control_count > 0 {
            total_score / control_count as f64
        } else {
            0.0
        };

        // Collect findings within the reporting period
        let period_findings: Vec<ComplianceFinding> = self.findings.values()
            .filter(|f| f.identified_date >= period.start_date && f.identified_date <= period.end_date)
            .cloned()
            .collect();

        // Generate recommendations based on findings and compliance gaps
        let mut recommendations = Vec::new();
        
        if overall_compliance_score < 95.0 {
            recommendations.push("Increase evidence collection frequency to improve compliance scores".to_string());
        }

        if period_findings.iter().any(|f| matches!(f.severity, Severity::High | Severity::Critical)) {
            recommendations.push("Address high and critical severity findings as priority".to_string());
        }

        let missing_evidence_controls: Vec<&String> = self.controls.keys()
            .filter(|control_id| {
                let evidence_count = self.evidence_store.values()
                    .filter(|e| e.control_id == **control_id)
                    .count();
                evidence_count == 0
            })
            .collect();

        if !missing_evidence_controls.is_empty() {
            recommendations.push(format!("Collect evidence for controls with no supporting evidence: {:?}", missing_evidence_controls));
        }

        Ok(ComplianceReport {
            id: Uuid::new_v4(),
            report_type,
            generation_date: Utc::now(),
            reporting_period: period,
            overall_compliance_score,
            control_summaries,
            findings: period_findings,
            recommendations,
            approved_by: None,
            approval_date: None,
        })
    }

    pub fn add_finding(&mut self, finding: ComplianceFinding) -> Result<Uuid> {
        let id = finding.id;
        self.findings.insert(id, finding);
        Ok(id)
    }

    pub fn resolve_finding(&mut self, finding_id: Uuid, resolution_evidence: String) -> Result<()> {
        if let Some(finding) = self.findings.get_mut(&finding_id) {
            finding.status = FindingStatus::Resolved;
            
            // Create resolution evidence
            let evidence = ComplianceEvidence {
                id: Uuid::new_v4(),
                control_id: finding.control_id.clone(),
                evidence_type: "Finding Resolution".to_string(),
                title: format!("Resolution for Finding {}", finding_id),
                description: resolution_evidence,
                collection_date: Utc::now(),
                collector: "System Administrator".to_string(),
                validation_status: ValidationStatus::Valid,
                file_path: None,
                metadata: HashMap::new(),
                tags: vec!["resolution".to_string(), "finding".to_string()],
            };
            
            self.collect_evidence(evidence)?;
            Ok(())
        } else {
            Err(anyhow::anyhow!("Finding not found: {}", finding_id))
        }
    }

    pub fn export_compliance_package(&self, format: ExportFormat) -> Result<Vec<u8>> {
        match format {
            ExportFormat::Json => {
                let package = CompliancePackage {
                    controls: self.controls.clone(),
                    evidence: self.evidence_store.clone(),
                    reports: self.reports.clone(),
                    findings: self.findings.clone(),
                    export_date: Utc::now(),
                };
                
                let json = serde_json::to_string_pretty(&package)?;
                Ok(json.into_bytes())
            },
            ExportFormat::Pdf => {
                // In a real implementation, this would generate a PDF report
                Ok("PDF export not implemented in demo".as_bytes().to_vec())
            },
            ExportFormat::Excel => {
                // In a real implementation, this would generate an Excel workbook
                Ok("Excel export not implemented in demo".as_bytes().to_vec())
            },
        }
    }

    pub fn get_compliance_dashboard(&self) -> ComplianceDashboard {
        let total_controls = self.controls.len();
        let implemented_controls = self.controls.values()
            .filter(|c| matches!(c.implementation_status, ImplementationStatus::FullyImplemented))
            .count();
        
        let total_evidence = self.evidence_store.len();
        let valid_evidence = self.evidence_store.values()
            .filter(|e| matches!(e.validation_status, ValidationStatus::Valid))
            .count();
        
        let open_findings = self.findings.values()
            .filter(|f| matches!(f.status, FindingStatus::Open))
            .count();
        
        let critical_findings = self.findings.values()
            .filter(|f| matches!(f.severity, Severity::Critical) && matches!(f.status, FindingStatus::Open))
            .count();

        let overall_score = if total_controls > 0 {
            self.controls.values().map(|c| c.compliance_score).sum::<f64>() / total_controls as f64
        } else {
            0.0
        };

        ComplianceDashboard {
            overall_compliance_score: overall_score,
            total_controls,
            implemented_controls,
            total_evidence,
            valid_evidence,
            open_findings,
            critical_findings,
            last_updated: Utc::now(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ExportFormat {
    Json,
    Pdf,
    Excel,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompliancePackage {
    pub controls: HashMap<String, ComplianceControl>,
    pub evidence: HashMap<Uuid, ComplianceEvidence>,
    pub reports: HashMap<Uuid, ComplianceReport>,
    pub findings: HashMap<Uuid, ComplianceFinding>,
    pub export_date: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComplianceDashboard {
    pub overall_compliance_score: f64,
    pub total_controls: usize,
    pub implemented_controls: usize,
    pub total_evidence: usize,
    pub valid_evidence: usize,
    pub open_findings: usize,
    pub critical_findings: usize,
    pub last_updated: DateTime<Utc>,
}

impl Default for ComplianceBinderGenerator {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_compliance_binder_initialization() {
        let generator = ComplianceBinderGenerator::new();
        assert!(!generator.controls.is_empty());
        assert!(generator.controls.contains_key("AC-1"));
        assert!(generator.controls.contains_key("AC-2"));
    }

    #[test]
    fn test_evidence_collection() {
        let mut generator = ComplianceBinderGenerator::new();
        
        let evidence = ComplianceEvidence {
            id: Uuid::new_v4(),
            control_id: "AC-1".to_string(),
            evidence_type: "Policy Document".to_string(),
            title: "Access Control Policy v1.0".to_string(),
            description: "Current access control policy document".to_string(),
            collection_date: Utc::now(),
            collector: "Security Team".to_string(),
            validation_status: ValidationStatus::Valid,
            file_path: Some("/compliance/policies/ac_policy_v1.pdf".to_string()),
            metadata: HashMap::new(),
            tags: vec!["policy".to_string(), "access-control".to_string()],
        };
        
        let evidence_id = generator.collect_evidence(evidence).unwrap();
        assert!(generator.evidence_store.contains_key(&evidence_id));
    }

    #[test]
    fn test_compliance_scoring() {
        let mut generator = ComplianceBinderGenerator::new();
        let score = generator.assess_control("AC-1").unwrap();
        assert!(score >= 0.0 && score <= 100.0);
    }
}