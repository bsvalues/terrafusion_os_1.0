//! TerraFusion OS Core - HTTP Handlers Module
//! Government-grade API endpoint handlers with FISMA compliance

pub mod auth;
pub mod counties;
pub mod properties;
pub mod assessments;
pub mod health;
pub mod admin;

use axum::{
    extract::{Request, Path, Query, State},
    http::StatusCode,
    response::{IntoResponse, Json},
};
use crate::models::ApiResponse;
use uuid::Uuid;
use std::collections::HashMap;
use serde::Deserialize;
use tracing::{error, info};

/// Championship API error handling
pub type HandlerResult<T> = Result<Json<ApiResponse<T>>, AppError>;

/// Elite application error types for government APIs
#[derive(Debug)]
pub enum AppError {
    DatabaseError(String),
    ValidationError(String),
    AuthenticationError(String),
    AuthorizationError(String),
    NotFound(String),
    InternalError(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> axum::response::Response {
        let (status, message) = match self {
            AppError::DatabaseError(msg) => (StatusCode::INTERNAL_SERVER_ERROR, format!("Database error: {}", msg)),
            AppError::ValidationError(msg) => (StatusCode::BAD_REQUEST, format!("Validation error: {}", msg)),
            AppError::AuthenticationError(msg) => (StatusCode::UNAUTHORIZED, format!("Authentication error: {}", msg)),
            AppError::AuthorizationError(msg) => (StatusCode::FORBIDDEN, format!("Authorization error: {}", msg)),
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, format!("Not found: {}", msg)),
            AppError::InternalError(msg) => (StatusCode::INTERNAL_SERVER_ERROR, format!("Internal error: {}", msg)),
        };

        let error_response = ApiResponse::<()>::error(message, Uuid::new_v4().to_string());
        (status, Json(error_response)).into_response()
    }
}

/// Convert anyhow errors to AppError
impl From<anyhow::Error> for AppError {
    fn from(err: anyhow::Error) -> Self {
        error!("❌ Handler error: {}", err);
        AppError::InternalError(err.to_string())
    }
}

/// Convert database errors to AppError
impl From<crate::database::DatabaseError> for AppError {
    fn from(err: crate::database::DatabaseError) -> Self {
        match err {
            crate::database::DatabaseError::NotFound => AppError::NotFound("Resource not found".to_string()),
            crate::database::DatabaseError::Connection(msg) => AppError::DatabaseError(msg),
            crate::database::DatabaseError::Query(msg) => AppError::DatabaseError(msg),
            crate::database::DatabaseError::Migration(msg) => AppError::DatabaseError(msg),
            crate::database::DatabaseError::Other(msg) => AppError::InternalError(msg),
        }
    }
}

/// Championship query parameters for government APIs
#[derive(Debug, Deserialize)]
pub struct PaginationParams {
    pub page: Option<i32>,
    pub page_size: Option<i32>,
}

impl PaginationParams {
    /// Get page with government standard defaults
    pub fn get_page(&self) -> i32 {
        self.page.unwrap_or(1).max(1)
    }

    /// Get page size with government limits
    pub fn get_page_size(&self) -> i32 {
        self.page_size
            .unwrap_or(25)
            .max(1)
            .min(100) // Maximum 100 items per page for performance
    }
}

/// Elite search parameters for property queries
#[derive(Debug, Deserialize)]
pub struct PropertySearchParams {
    pub q: Option<String>,                // Search query
    pub property_type: Option<String>,    // Property type filter
    pub min_value: Option<i64>,          // Minimum assessed value (cents)
    pub max_value: Option<i64>,          // Maximum assessed value (cents)
    pub assessment_year: Option<i32>,    // Assessment year filter
    pub city: Option<String>,            // City filter
    pub zip_code: Option<String>,        // ZIP code filter

    #[serde(flatten)]
    pub pagination: PaginationParams,
}

/// Government assessment search parameters
#[derive(Debug, Deserialize)]
pub struct AssessmentSearchParams {
    pub property_id: Option<Uuid>,       // Filter by property
    pub assessment_year: Option<i32>,    // Assessment year
    pub status: Option<String>,          // Assessment status
    pub assessor_id: Option<String>,     // Assessor filter
    pub min_confidence: Option<f64>,     // Minimum confidence score

    #[serde(flatten)]
    pub pagination: PaginationParams,
}

/// Elite success responses for government APIs
pub fn success_response<T>(data: T, message: &str) -> HandlerResult<T> {
    Ok(Json(ApiResponse::success_with_data(
        data,
        message.to_string(),
        Uuid::new_v4().to_string()
    )))
}

pub fn success_response_no_data(message: &str) -> Result<Json<ApiResponse<()>>, AppError> {
    Ok(Json(ApiResponse::success(
        message.to_string(),
        Uuid::new_v4().to_string()
    )))
}

/// Championship path parameter extraction
#[derive(Debug, Deserialize)]
pub struct IdPath {
    pub id: Uuid,
}

#[derive(Debug, Deserialize)]
pub struct CountyCodePath {
    pub county_code: String,
}

#[derive(Debug, Deserialize)]
pub struct CountyIdPath {
    pub county_id: Uuid,
}

/// Elite API versioning support
pub const API_VERSION: &str = "v1";

/// Government API route helpers
pub fn validate_county_code(county_code: &str) -> Result<(), AppError> {
    // Validate Washington State county codes
    let valid_counties = [
        "adams", "asotin", "benton", "chelan", "clallam", "clark", "columbia",
        "cowlitz", "douglas", "ferry", "franklin", "garfield", "grant", "grays-harbor",
        "island", "jefferson", "king", "kitsap", "kittitas", "klickitat", "lewis",
        "lincoln", "mason", "okanogan", "pacific", "pend-oreille", "pierce", "san-juan",
        "skagit", "skamania", "snohomish", "spokane", "stevens", "thurston", "wahkiakum",
        "walla-walla", "whatcom", "whitman", "yakima"
    ];

    if !valid_counties.contains(&county_code.to_lowercase().as_str()) {
        return Err(AppError::ValidationError(
            format!("Invalid Washington State county code: {}", county_code)
        ));
    }

    Ok(())
}

/// Championship request ID extraction for audit logging
pub fn extract_request_id(headers: &axum::http::HeaderMap) -> String {
    headers
        .get("x-request-id")
        .and_then(|value| value.to_str().ok())
        .unwrap_or_else(|| &Uuid::new_v4().to_string())
        .to_string()
}

/// Elite user claims extraction from request extensions
pub fn extract_user_claims(request: &Request) -> Result<crate::auth::Claims, AppError> {
    request
        .extensions()
        .get::<crate::auth::Claims>()
        .cloned()
        .ok_or_else(|| AppError::AuthenticationError("Missing user claims".to_string()))
}

/// Government county access extraction from request extensions
pub fn extract_county_access(request: &Request) -> Result<crate::middleware::CountyAccess, AppError> {
    request
        .extensions()
        .get::<crate::middleware::CountyAccess>()
        .cloned()
        .ok_or_else(|| AppError::AuthorizationError("Missing county access validation".to_string()))
}

/// Championship handler wrapper for consistent error handling
pub async fn handle_with_audit<T, F, Fut>(
    handler_name: &str,
    user_claims: &crate::auth::Claims,
    operation: F,
) -> Result<T, AppError>
where
    F: FnOnce() -> Fut,
    Fut: std::future::Future<Output = Result<T, AppError>>,
{
    info!("🚀 Handler started: {} by user {}", handler_name, user_claims.sub);

    let start_time = std::time::Instant::now();
    let result = operation().await;
    let duration = start_time.elapsed();

    match &result {
        Ok(_) => info!("✅ Handler completed: {} ({:.2}ms)", handler_name, duration.as_millis()),
        Err(err) => error!("❌ Handler failed: {} ({:.2}ms) - {:?}", handler_name, duration.as_millis(), err),
    }

    result
}

/// Elite validation helpers for government data
pub mod validation {
    use super::*;
    use regex::Regex;

    /// Validate parcel ID format
    pub fn validate_parcel_id(parcel_id: &str) -> Result<(), AppError> {
        if parcel_id.trim().is_empty() {
            return Err(AppError::ValidationError("Parcel ID cannot be empty".to_string()));
        }

        if parcel_id.len() > 50 {
            return Err(AppError::ValidationError("Parcel ID too long (max 50 characters)".to_string()));
        }

        // Basic alphanumeric validation
        let re = Regex::new(r"^[A-Za-z0-9\-_\.]+$").unwrap();
        if !re.is_match(parcel_id) {
            return Err(AppError::ValidationError(
                "Parcel ID contains invalid characters".to_string()
            ));
        }

        Ok(())
    }

    /// Validate assessment year
    pub fn validate_assessment_year(year: i32) -> Result<(), AppError> {
        let current_year = chrono::Utc::now().year();

        if year < 2000 || year > current_year + 1 {
            return Err(AppError::ValidationError(
                format!("Invalid assessment year: {} (must be 2000-{})", year, current_year + 1)
            ));
        }

        Ok(())
    }

    /// Validate monetary amount in cents
    pub fn validate_amount_cents(amount: i64, field_name: &str) -> Result<(), AppError> {
        if amount < 0 {
            return Err(AppError::ValidationError(
                format!("{} cannot be negative", field_name)
            ));
        }

        // Maximum $100 billion (reasonable government limit)
        if amount > 10_000_000_000_000 {
            return Err(AppError::ValidationError(
                format!("{} exceeds maximum allowed value", field_name)
            ));
        }

        Ok(())
    }

    /// Validate confidence score
    pub fn validate_confidence_score(score: f64, field_name: &str) -> Result<(), AppError> {
        if score < 0.0 || score > 1.0 {
            return Err(AppError::ValidationError(
                format!("{} must be between 0.0 and 1.0", field_name)
            ));
        }

        Ok(())
    }

    /// Validate property type
    pub fn validate_property_type(property_type: &str) -> Result<(), AppError> {
        let valid_types = [
            "Residential", "Commercial", "Industrial", "Agricultural",
            "Institutional", "Transportation", "Utilities", "Other"
        ];

        if !valid_types.contains(&property_type) {
            return Err(AppError::ValidationError(
                format!("Invalid property type: {} (valid: {:?})", property_type, valid_types)
            ));
        }

        Ok(())
    }
}
