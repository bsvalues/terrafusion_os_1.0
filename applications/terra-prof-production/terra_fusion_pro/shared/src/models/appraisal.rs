use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::types::Uuid;

use super::property::PropertyType;

/// Represents an appraisal assignment in the TerraFusionPro platform
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Appraisal {
    /// Unique identifier for the appraisal
    pub id: Uuid,
    
    /// Appraisal reference number (client-provided)
    pub reference_number: Option<String>,
    
    /// ID of the client who ordered the appraisal
    pub client_id: Uuid,
    
    /// ID of the property being appraised
    pub property_id: Uuid,
    
    /// ID of the appraiser assigned to this appraisal
    pub appraiser_id: Option<Uuid>,
    
    /// ID of the report associated with this appraisal
    pub report_id: Option<Uuid>,
    
    /// Current status of the appraisal
    pub status: AppraisalStatus,
    
    /// Requested due date
    pub due_date: Option<DateTime<Utc>>,
    
    /// Purpose of the appraisal
    pub purpose: AppraisalPurpose,
    
    /// Type of appraisal
    pub appraisal_type: AppraisalType,
    
    /// Client instructions (optional)
    pub instructions: Option<String>,
    
    /// Fee for the appraisal
    pub fee: Option<f64>,
    
    /// When the appraisal was created
    pub created_at: DateTime<Utc>,
    
    /// When the appraisal was last updated
    pub updated_at: DateTime<Utc>,
    
    /// When the appraisal was completed
    pub completed_at: Option<DateTime<Utc>>,
}

/// Enumeration of appraisal statuses
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum AppraisalStatus {
    New,
    Assigned,
    Scheduled,
    InProgress,
    PendingReview,
    RevisionNeeded,
    Completed,
    Cancelled,
    OnHold,
}

/// Enumeration of appraisal purposes
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum AppraisalPurpose {
    Purchase,
    Refinance,
    HomeEquity,
    PMI,
    PreListing,
    Estate,
    Divorce,
    TaxAppeal,
    Bankruptcy,
    RelocationEstimate,
    Insurance,
    Other,
}

/// Enumeration of appraisal types
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum AppraisalType {
    FullAppraisal,
    DriveBy,
    Desktop,
    Automated,
    BPO,
    Other,
}

/// Request to create a new appraisal assignment
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateAppraisalRequest {
    /// Appraisal reference number (client-provided)
    pub reference_number: Option<String>,
    
    /// ID of the client who ordered the appraisal
    pub client_id: Uuid,
    
    /// Property information (if property doesn't exist)
    pub property_info: Option<AppraisalPropertyInfo>,
    
    /// ID of existing property (if already in system)
    pub property_id: Option<Uuid>,
    
    /// ID of the appraiser to assign (optional)
    pub appraiser_id: Option<Uuid>,
    
    /// Requested due date (optional)
    pub due_date: Option<DateTime<Utc>>,
    
    /// Purpose of the appraisal
    pub purpose: AppraisalPurpose,
    
    /// Type of appraisal
    pub appraisal_type: AppraisalType,
    
    /// Client instructions (optional)
    pub instructions: Option<String>,
    
    /// Fee for the appraisal (optional)
    pub fee: Option<f64>,
}

/// Simplified property information for appraisal requests
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppraisalPropertyInfo {
    /// Street address line 1
    pub street1: String,
    
    /// Street address line 2 (optional)
    pub street2: Option<String>,
    
    /// City name
    pub city: String,
    
    /// State or province
    pub state: String,
    
    /// Postal or ZIP code
    pub postal_code: String,
    
    /// Property type
    pub property_type: PropertyType,
    
    /// Number of bedrooms (optional)
    pub bedrooms: Option<i32>,
    
    /// Number of bathrooms (optional)
    pub bathrooms: Option<f64>,
    
    /// Square footage (optional)
    pub square_feet: Option<f64>,
    
    /// Year built (optional)
    pub year_built: Option<i32>,
}

/// Request to update an appraisal assignment
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateAppraisalRequest {
    /// Appraisal reference number (client-provided)
    pub reference_number: Option<String>,
    
    /// ID of the appraiser to assign
    pub appraiser_id: Option<Uuid>,
    
    /// Current status of the appraisal
    pub status: Option<AppraisalStatus>,
    
    /// Requested due date
    pub due_date: Option<DateTime<Utc>>,
    
    /// Purpose of the appraisal
    pub purpose: Option<AppraisalPurpose>,
    
    /// Type of appraisal
    pub appraisal_type: Option<AppraisalType>,
    
    /// Client instructions
    pub instructions: Option<String>,
    
    /// Fee for the appraisal
    pub fee: Option<f64>,
}

/// Appraisal summary for listing purposes
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppraisalSummary {
    /// Unique identifier for the appraisal
    pub id: Uuid,
    
    /// Appraisal reference number (client-provided)
    pub reference_number: Option<String>,
    
    /// Client name
    pub client_name: String,
    
    /// Property address (formatted)
    pub property_address: String,
    
    /// Appraiser name (if assigned)
    pub appraiser_name: Option<String>,
    
    /// Current status of the appraisal
    pub status: AppraisalStatus,
    
    /// Requested due date
    pub due_date: Option<DateTime<Utc>>,
    
    /// Type of appraisal
    pub appraisal_type: AppraisalType,
    
    /// When the appraisal was created
    pub created_at: DateTime<Utc>,
}