use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::types::Uuid;

/// Represents a form template in the TerraFusionPro platform
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FormTemplate {
    /// Unique identifier for the form template
    pub id: Uuid,
    
    /// Form template name
    pub name: String,
    
    /// Form template description
    pub description: String,
    
    /// Form template version
    pub version: String,
    
    /// Form template schema in JSON format
    pub schema: serde_json::Value,
    
    /// Form template UI schema for rendering (optional)
    pub ui_schema: Option<serde_json::Value>,
    
    /// Form template category
    pub category: FormCategory,
    
    /// Whether this template is active
    pub is_active: bool,
    
    /// When the form template was created
    pub created_at: DateTime<Utc>,
    
    /// When the form template was last updated
    pub updated_at: DateTime<Utc>,
}

/// Enumeration of form categories
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum FormCategory {
    Residential,
    Commercial,
    Land,
    Industry,
    Agricultural,
    Special,
    Other,
}

/// Represents a form instance (filled form) in the system
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FormInstance {
    /// Unique identifier for the form instance
    pub id: Uuid,
    
    /// Reference to the form template
    pub template_id: Uuid,
    
    /// ID of the report this form is associated with
    pub report_id: Uuid,
    
    /// Form data in JSON format
    pub form_data: serde_json::Value,
    
    /// Form completion status
    pub status: FormStatus,
    
    /// Validation errors (if any)
    pub validation_errors: Option<serde_json::Value>,
    
    /// When the form instance was created
    pub created_at: DateTime<Utc>,
    
    /// When the form instance was last updated
    pub updated_at: DateTime<Utc>,
    
    /// When the form was submitted
    pub submitted_at: Option<DateTime<Utc>>,
}

/// Enumeration of form status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum FormStatus {
    Draft,
    InProgress,
    Completed,
    Invalid,
    Locked,
}

/// Request to create a new form template
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateFormTemplateRequest {
    /// Form template name
    pub name: String,
    
    /// Form template description
    pub description: String,
    
    /// Form template version
    pub version: String,
    
    /// Form template schema in JSON format
    pub schema: serde_json::Value,
    
    /// Form template UI schema for rendering (optional)
    pub ui_schema: Option<serde_json::Value>,
    
    /// Form template category
    pub category: FormCategory,
}

/// Request to update a form template
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateFormTemplateRequest {
    /// Form template name (optional)
    pub name: Option<String>,
    
    /// Form template description (optional)
    pub description: Option<String>,
    
    /// Form template version (optional)
    pub version: Option<String>,
    
    /// Form template schema in JSON format (optional)
    pub schema: Option<serde_json::Value>,
    
    /// Form template UI schema for rendering (optional)
    pub ui_schema: Option<serde_json::Value>,
    
    /// Form template category (optional)
    pub category: Option<FormCategory>,
    
    /// Whether this template is active (optional)
    pub is_active: Option<bool>,
}

/// Request to create a new form instance
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateFormInstanceRequest {
    /// Reference to the form template
    pub template_id: Uuid,
    
    /// ID of the report this form is associated with
    pub report_id: Uuid,
    
    /// Initial form data in JSON format (optional)
    pub form_data: Option<serde_json::Value>,
}

/// Request to update a form instance
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateFormInstanceRequest {
    /// Form data in JSON format
    pub form_data: serde_json::Value,
    
    /// Form completion status (optional)
    pub status: Option<FormStatus>,
}

/// Form template summary for listing purposes
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FormTemplateSummary {
    /// Unique identifier for the form template
    pub id: Uuid,
    
    /// Form template name
    pub name: String,
    
    /// Form template description
    pub description: String,
    
    /// Form template version
    pub version: String,
    
    /// Form template category
    pub category: FormCategory,
    
    /// Whether this template is active
    pub is_active: bool,
}