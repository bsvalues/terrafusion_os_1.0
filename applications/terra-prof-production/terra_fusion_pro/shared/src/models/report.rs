use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::types::Uuid;

/// Represents an appraisal report in the TerraFusionPro platform
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Report {
    /// Unique identifier for the report
    pub id: Uuid,
    
    /// Report title
    pub title: String,
    
    /// ID of the property being appraised
    pub property_id: Uuid,
    
    /// ID of the appraiser who created the report
    pub appraiser_id: Uuid,
    
    /// Current status of the report
    pub status: ReportStatus,
    
    /// Report type
    pub report_type: ReportType,
    
    /// Valuation amount
    pub valuation_amount: Option<f64>,
    
    /// Report content (JSON format)
    pub content: serde_json::Value,
    
    /// Report PDF file URL (if generated)
    pub pdf_url: Option<String>,
    
    /// When the report was created
    pub created_at: DateTime<Utc>,
    
    /// When the report was last updated
    pub updated_at: DateTime<Utc>,
    
    /// When the report was submitted
    pub submitted_at: Option<DateTime<Utc>>,
    
    /// When the report was reviewed
    pub reviewed_at: Option<DateTime<Utc>>,
    
    /// ID of the reviewer (if reviewed)
    pub reviewer_id: Option<Uuid>,
    
    /// Review comments
    pub review_comments: Option<String>,
}

/// Enumeration of report statuses
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ReportStatus {
    Draft,
    InProgress,
    Submitted,
    UnderReview,
    NeedsCorrection,
    Approved,
    Rejected,
    Finalized,
}

/// Enumeration of report types
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ReportType {
    Form1004,        // Uniform Residential Appraisal Report
    Form1073,        // Individual Condominium Unit Appraisal Report
    Form1025,        // Small Residential Income Property Appraisal Report
    Form1004C,       // Manufactured Home Appraisal Report
    Form2055,        // Exterior-Only Inspection Residential Appraisal Report
    CommercialForm,  // Commercial Property Appraisal Report
    DesktopAppraisal,// Desktop Appraisal Report
    BPO,             // Broker Price Opinion
    Other,           // Other report type
}

/// Request to create a new report
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateReportRequest {
    /// Report title
    pub title: String,
    
    /// ID of the property being appraised
    pub property_id: Uuid,
    
    /// Report type
    pub report_type: ReportType,
    
    /// Initial content (optional)
    pub content: Option<serde_json::Value>,
}

/// Request to update a report
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateReportRequest {
    /// Report title (optional)
    pub title: Option<String>,
    
    /// Report status (optional)
    pub status: Option<ReportStatus>,
    
    /// Valuation amount (optional)
    pub valuation_amount: Option<f64>,
    
    /// Report content (optional)
    pub content: Option<serde_json::Value>,
}

/// Request to submit a report for review
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubmitReportRequest {
    /// Optional comments from the appraiser
    pub comments: Option<String>,
}

/// Request to review a report
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReviewReportRequest {
    /// New report status (Approved, NeedsCorrection, or Rejected)
    pub status: ReportStatus,
    
    /// Review comments
    pub comments: String,
}

/// Report summary for listing purposes
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReportSummary {
    /// Unique identifier for the report
    pub id: Uuid,
    
    /// Report title
    pub title: String,
    
    /// Current status of the report
    pub status: ReportStatus,
    
    /// Report type
    pub report_type: ReportType,
    
    /// Property address (formatted)
    pub property_address: String,
    
    /// Appraiser name (formatted)
    pub appraiser_name: String,
    
    /// Valuation amount
    pub valuation_amount: Option<f64>,
    
    /// When the report was created
    pub created_at: DateTime<Utc>,
    
    /// When the report was last updated
    pub updated_at: DateTime<Utc>,
}