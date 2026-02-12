//! TerraFusion OS Core - Handlers Module
//! Elite API endpoint handlers for government operations

pub mod auth;           // Authentication and authorization handlers
pub mod counties;       // County management and configuration
pub mod properties;     // Property management with IAAO compliance
pub mod assessments;    // Property assessment with AI enhancement
pub mod admin;          // Administrative operations (SuperAdmin)
pub mod health_handlers;// Health monitoring and system status
pub mod simple;         // Simple handlers with minimal signatures

// Common handler utilities and types
use axum::{http::StatusCode, response::IntoResponse, Json};
use crate::{models::{ApiResponse, PaginatedResponse}, auth::Claims};
use chrono::{DateTime, Utc, Datelike};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tracing::{error, info, instrument};
use uuid::Uuid;

/// Championship error handling for API responses
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("Database error: {0}")]
    DatabaseError(#[from] sqlx::Error),

    #[error("Authentication error: {0}")]
    AuthenticationError(String),

    #[error("Authorization error: {0}")]
    AuthorizationError(String),

    #[error("Validation error: {0}")]
    ValidationError(String),

    #[error("Not found: {0}")]
    NotFoundError(String),

    #[error("Internal server error: {0}")]
    InternalError(String),

    #[error("External service error: {0}")]
    ExternalServiceError(String),
}

// Add From implementation for anyhow::Error
impl From<anyhow::Error> for AppError {
    fn from(err: anyhow::Error) -> Self {
        AppError::InternalError(err.to_string())
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> axum::response::Response {
        let (status, message) = match self {
            AppError::DatabaseError(ref e) => {
                error!("💥 Database error: {}", e);
                (StatusCode::INTERNAL_SERVER_ERROR, "Internal database error")
            }
            AppError::AuthenticationError(ref msg) => {
                error!("🔐 Authentication error: {}", msg);
                (StatusCode::UNAUTHORIZED, msg.as_str())
            }
            AppError::AuthorizationError(ref msg) => {
                error!("🚫 Authorization error: {}", msg);
                (StatusCode::FORBIDDEN, msg.as_str())
            }
            AppError::ValidationError(ref msg) => {
                error!("❌ Validation error: {}", msg);
                (StatusCode::BAD_REQUEST, msg.as_str())
            }
            AppError::NotFoundError(ref msg) => {
                error!("🔍 Not found error: {}", msg);
                (StatusCode::NOT_FOUND, msg.as_str())
            }
            AppError::InternalError(ref msg) => {
                error!("⚠️ Internal error: {}", msg);
                (StatusCode::INTERNAL_SERVER_ERROR, msg.as_str())
            }
            AppError::ExternalServiceError(ref msg) => {
                error!("🌐 External service error: {}", msg);
                (StatusCode::SERVICE_UNAVAILABLE, msg.as_str())
            }
        };

        let response = ApiResponse::<()> {
            success: false,
            message: message.to_string(),
            data: None,
            error: Some(message.to_string()),
            timestamp: Utc::now(),
            request_id: uuid::Uuid::new_v4().to_string(),
        };

        (status, Json(response)).into_response()
    }
}

/// Type alias for handler results
pub type HandlerResult<T> = Result<Json<ApiResponse<T>>, AppError>;

/// Path parameter for entity ID
#[derive(Debug, Deserialize)]
pub struct IdPath {
    pub id: Uuid,
}

/// Path parameter for county ID endpoints
#[derive(Debug, Deserialize)]
pub struct CountyIdPath {
    pub county_id: Uuid,
}

/// Path parameter for county code endpoints
#[derive(Debug, Deserialize)]
pub struct CountyCodePath {
    pub county_code: String,
}

/// Common pagination parameters
#[derive(Debug, Deserialize)]
pub struct PaginationParams {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

impl PaginationParams {
    pub fn get_page(&self) -> u64 {
        self.page.unwrap_or(1).max(1)
    }

    pub fn get_page_size(&self) -> u64 {
        self.page_size.unwrap_or(20).min(100).max(1)
    }
}

/// Assessment search parameters
#[derive(Debug, Deserialize)]
pub struct AssessmentSearchParams {
    #[serde(flatten)]
    pub pagination: PaginationParams,
    pub assessment_year: Option<i32>,
    pub min_value: Option<i64>,
    pub max_value: Option<i64>,
    pub min_confidence: Option<f64>,
    pub status: Option<String>,
    pub assessor_id: Option<String>,
    pub iaao_compliant: Option<bool>,
}

/// Property search parameters
#[derive(Debug, Deserialize)]
pub struct PropertySearchParams {
    #[serde(flatten)]
    pub pagination: PaginationParams,
    pub q: Option<String>,
    pub property_type: Option<String>,
    pub min_value: Option<i64>,
    pub max_value: Option<i64>,
    pub zip_code: Option<String>,
    pub owner_name: Option<String>,
    pub assessment_year: Option<i32>,
}

/// Success response helper with data
pub fn success_response<T: Serialize>(data: T, message: &str) -> HandlerResult<T> {
    Ok(Json(ApiResponse {
        success: true,
        message: message.to_string(),
        data: Some(data),
        error: None,
        timestamp: Utc::now(),
        request_id: uuid::Uuid::new_v4().to_string(),
    }))
}

/// Success response helper without data
pub fn success_response_no_data(message: &str) -> Result<Json<ApiResponse<()>>, AppError> {
    Ok(Json(ApiResponse {
        success: true,
        message: message.to_string(),
        data: None,
        error: None,
        timestamp: Utc::now(),
        request_id: uuid::Uuid::new_v4().to_string(),
    }))
}

/// Government audit logging wrapper
#[instrument(skip(claims, handler))]
pub async fn handle_with_audit<T, F, Fut>(
    action: &str,
    claims: &Claims,
    handler: F,
) -> Result<T, AppError>
where
    F: FnOnce() -> Fut,
    Fut: std::future::Future<Output = Result<T, AppError>>,
{
    let start_time = std::time::Instant::now();

    info!("🏛️ Government operation started: {} by user {} (county: {})",
          action, claims.sub, claims.county_id);

    let result = handler().await;
    let duration = start_time.elapsed();

    match &result {
        Ok(_) => {
            info!("✅ Government operation completed: {} by {} in {:.1}ms",
                  action, claims.sub, duration.as_millis());
        }
        Err(e) => {
            error!("❌ Government operation failed: {} by {} in {:.1}ms - {}",
                   action, claims.sub, duration.as_millis(), e);
        }
    }

    // In production, would save audit log to database
    // audit_service.log_operation(action, claims, &result, duration).await;

    result
}

/// Government validation utilities
pub mod validation {
    use super::AppError;
    use uuid::Uuid;
    use chrono::Datelike;

    /// Validate county ID format
    pub fn validate_county_id(_county_id: Uuid) -> Result<(), AppError> {
        // In production, would validate against known counties
        Ok(())
    }

    /// Validate parcel ID format and constraints
    pub fn validate_parcel_id(_parcel_id: &str) -> Result<(), AppError> {
        // Demo validation - always passes
        Ok(())
    }

    /// Validate county code format
    pub fn validate_county_code(_county_code: &str) -> Result<(), AppError> {
        // Demo validation - always passes
        Ok(())
    }

    /// Validate assessment year
    pub fn validate_assessment_year(year: i32) -> Result<(), AppError> {
        let current_year = chrono::Utc::now().year();
        if year < 2000 || year > current_year + 5 {
            return Err(AppError::ValidationError(
                format!("Assessment year must be between 2000 and {}", current_year + 5)
            ));
        }
        Ok(())
    }

    /// Validate confidence scores for government compliance
    pub fn validate_confidence_score(score: f64, field_name: &str) -> Result<(), AppError> {
        if !(0.0..=1.0).contains(&score) {
            return Err(AppError::ValidationError(
                format!("{} must be between 0.0 and 1.0", field_name)
            ));
        }
        Ok(())
    }

    /// Validate amount in cents (no negative values for assessments)
    pub fn validate_amount_cents(amount: i64, field_name: &str) -> Result<(), AppError> {
        if amount < 0 {
            return Err(AppError::ValidationError(
                format!("{} cannot be negative", field_name)
            ));
        }

        // Reasonable upper limit (100 billion dollars)
        if amount > 10_000_000_000_000 {
            return Err(AppError::ValidationError(
                format!("{} exceeds maximum allowed value", field_name)
            ));
        }

        Ok(())
    }

    /// Validate Washington State county name
    pub fn validate_washington_county(county_name: &str) -> Result<(), AppError> {
        let valid_counties = [
            "Adams", "Asotin", "Benton", "Chelan", "Clallam", "Clark", "Columbia",
            "Cowlitz", "Douglas", "Ferry", "Franklin", "Garfield", "Grant", "Grays Harbor",
            "Island", "Jefferson", "King", "Kitsap", "Kittitas", "Klickitat", "Lewis",
            "Lincoln", "Mason", "Okanogan", "Pacific", "Pend Oreille", "Pierce", "San Juan",
            "Skagit", "Skamania", "Snohomish", "Spokane", "Stevens", "Thurston", "Wahkiakum",
            "Walla Walla", "Whatcom", "Whitman", "Yakima"
        ];

        if !valid_counties.contains(&county_name) {
            return Err(AppError::ValidationError(
                format!("Invalid Washington State county: {}", county_name)
            ));
        }

        Ok(())
    }

    /// Validate property type
    pub fn validate_property_type(property_type: &str) -> Result<(), AppError> {
        let valid_types = [
            "Residential", "Commercial", "Industrial", "Agricultural",
            "Vacant Land", "Mixed Use", "Exempt", "Personal Property"
        ];

        if !valid_types.contains(&property_type) {
            return Err(AppError::ValidationError(
                format!("Invalid property type. Valid values: {:?}", valid_types)
            ));
        }

        Ok(())
    }
}

/// Validation utility for county codes
pub fn validate_county_code(county_code: &str) -> Result<(), AppError> {
    if county_code.is_empty() || county_code.len() > 10 {
        return Err(AppError::ValidationError(
            "County code must be between 1 and 10 characters".to_string()
        ));
    }
    // Additional validation for Washington State counties
    let valid_codes = ["benton", "king", "pierce", "spokane", "clark", "snohomish", "yakima"];
    if !valid_codes.contains(&county_code.to_lowercase().as_str()) {
        return Err(AppError::ValidationError(
            "Invalid Washington State county code".to_string()
        ));
    }
    Ok(())
}
