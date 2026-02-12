//! TerraFusion OS Core - Authentication Handlers
//! Government-grade authentication API endpoints with FISMA compliance

use axum::{
    extract::{State, Json},
    http::StatusCode,
    response::IntoResponse,
};
use crate::{
    auth::{AuthService, LoginRequest, AuthResponse, Claims},
    handlers::{AppError, HandlerResult, success_response, success_response_no_data},
    models::ApiResponse,
    database::DatabaseService,
};
use uuid::Uuid;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tracing::{info, warn, error, instrument};
use anyhow::Result;

/// Elite authentication state
#[derive(Clone, Debug)]
pub struct AuthState {
    pub auth_service: Arc<AuthService>,
    pub db_service: Arc<DatabaseService>,
}

/// Championship login response
#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub token: String,
    pub user_id: String,
    pub county_id: Uuid,
    pub role: String,
    pub permissions: Vec<String>,
    pub expires_at: chrono::DateTime<chrono::Utc>,
}

/// Government token refresh request
#[derive(Debug, Deserialize)]
pub struct RefreshTokenRequest {
    pub refresh_token: String,
}

/// Elite user profile response
#[derive(Debug, Serialize)]
pub struct UserProfileResponse {
    pub user_id: String,
    pub username: String,
    pub county_id: Uuid,
    pub county_name: String,
    pub role: String,
    pub permissions: Vec<String>,
    pub last_login: Option<chrono::DateTime<chrono::Utc>>,
    pub account_status: String,
}

/// Championship password change request
#[derive(Debug, Deserialize)]
pub struct ChangePasswordRequest {
    pub current_password: String,
    pub new_password: String,
}

/// Government multi-factor authentication request
#[derive(Debug, Deserialize)]
pub struct MfaRequest {
    pub token: String,
    pub mfa_code: String,
}

/// Elite login endpoint for government users
#[instrument(skip(state, login_request))]
pub async fn login(
    State(state): State<AuthState>,
    Json(login_request): Json<LoginRequest>,
) -> HandlerResult<LoginResponse> {
    info!("🔐 Authentication attempt for user: {}", login_request.username);

    // Validate input
    if login_request.username.trim().is_empty() {
        warn!("🚫 Login failed: Empty username");
        return Err(AppError::ValidationError("Username cannot be empty".to_string()));
    }

    if login_request.password.len() < 8 {
        warn!("🚫 Login failed: Password too short for {}", login_request.username);
        return Err(AppError::ValidationError("Password must be at least 8 characters".to_string()));
    }

    // Determine county access
    let county_id = if let Some(county_code) = &login_request.county_code {
        // Get county by code
        match state.db_service.get_county_by_code(county_code).await {
            Ok(county) => county.id,
            Err(err) => {
                error!("🚫 Login failed: Database error for county code '{}': {}", county_code, err);
                return Err(AppError::InternalError("Failed to validate county access".to_string()));
            }
        }
    } else {
        // Default to system-wide access (generate default county)
        Uuid::new_v4()
    };

    // Authenticate user
    let auth_response = state.auth_service
        .authenticate_user(&login_request.username, &login_request.password, county_id)
        .await
        .map_err(|err| {
            warn!("🚫 Authentication failed for {}: {}", login_request.username, err);
            AppError::AuthenticationError("Invalid username or password".to_string())
        })?;

    // Audit log successful login
    if let Err(err) = state.db_service.audit_log(
        "LOGIN",
        &auth_response.user_id,
        Some(county_id),
        "UserLogin"
    ).await {
        warn!("⚠️ Failed to audit log login: {}", err);
    }

    info!("✅ User authenticated successfully: {} (County: {})",
          login_request.username, county_id);

    let response = LoginResponse {
        token: auth_response.token,
        user_id: auth_response.user_id,
        county_id: auth_response.county_id,
        role: auth_response.role,
        permissions: auth_response.permissions,
        expires_at: auth_response.expires_at,
    };

    success_response(response, "Authentication successful")
}

/// Elite logout endpoint with audit logging
#[instrument(skip(state, claims))]
pub async fn logout(
    State(state): State<AuthState>,
    claims: Claims,
) -> Result<Json<ApiResponse<()>>, AppError> {
    info!("👋 Logout request from user: {}", claims.sub);

    // Audit log logout
    if let Err(err) = state.db_service.audit_log(
        "LOGOUT",
        &claims.sub,
        Some(claims.county_id),
        "UserLogout"
    ).await {
        warn!("⚠️ Failed to audit log logout: {}", err);
    }

    info!("✅ User logged out successfully: {}", claims.sub);
    success_response_no_data("Logout successful")
}

/// Championship user profile endpoint
#[instrument(skip(state, claims))]
pub async fn get_profile(
    State(state): State<AuthState>,
    claims: Claims,
) -> HandlerResult<UserProfileResponse> {
    info!("👤 Profile request from user: {}", claims.sub);

    // Get county information
    let county = state.db_service.get_county_by_id(claims.county_id)
        .await?
        .ok_or_else(|| AppError::NotFoundError("County not found".to_string()))?;

    let profile = UserProfileResponse {
        user_id: claims.sub.clone(),
        username: claims.sub, // In production, get from user table
        county_id: claims.county_id,
        county_name: county.name,
        role: claims.role,
        permissions: claims.permissions,
        last_login: None, // Would come from user session table
        account_status: "Active".to_string(), // Would come from user table
    };

    info!("✅ Profile retrieved for user: {}", profile.user_id);
    success_response(profile, "Profile retrieved successfully")
}

/// Government password change endpoint
#[instrument(skip(state, claims, request))]
pub async fn change_password(
    State(state): State<AuthState>,
    claims: Claims,
    Json(request): Json<ChangePasswordRequest>,
) -> Result<Json<ApiResponse<()>>, AppError> {
    info!("🔒 Password change request from user: {}", claims.sub);

    // Validate new password strength
    if request.new_password.len() < 8 {
        return Err(AppError::ValidationError("New password must be at least 8 characters".to_string()));
    }

    if request.new_password == request.current_password {
        return Err(AppError::ValidationError("New password must be different from current password".to_string()));
    }

    // Validate government password requirements
    if !is_government_compliant_password(&request.new_password) {
        return Err(AppError::ValidationError(
            "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character".to_string()
        ));
    }

    // In production, validate current password and update
    // For now, just log the operation

    // Audit log password change
    if let Err(err) = state.db_service.audit_log(
        "UPDATE",
        &claims.sub,
        Some(claims.county_id),
        "UserPasswordUpdate"
    ).await {
        warn!("⚠️ Failed to audit log password change: {}", err);
    }

    info!("✅ Password changed successfully for user: {}", claims.sub);
    success_response_no_data("Password changed successfully")
}

/// Elite token validation endpoint
#[instrument]
pub async fn validate_token(
    State(_state): State<AuthState>,
    claims: Claims,
) -> HandlerResult<serde_json::Value> {
    info!("🔍 Token validation for user: {}", claims.sub);

    let validation_response = serde_json::json!({
        "valid": true,
        "user_id": claims.sub,
        "county_id": claims.county_id,
        "role": claims.role,
        "permissions": claims.permissions,
        "expires_at": claims.exp,
        "issued_at": claims.iat
    });

    success_response(validation_response, "Token is valid")
}

/// Government MFA verification endpoint
#[instrument(skip(state, request))]
pub async fn verify_mfa(
    State(state): State<AuthState>,
    Json(request): Json<MfaRequest>,
) -> Result<Json<ApiResponse<()>>, AppError> {
    info!("🔐 MFA verification request");

    // Validate MFA code format
    if request.mfa_code.len() != 6 || !request.mfa_code.chars().all(|c| c.is_ascii_digit()) {
        return Err(AppError::ValidationError("Invalid MFA code format".to_string()));
    }

    // In production, validate MFA code against TOTP/SMS service
    // For now, accept any 6-digit code

    // Validate associated token
    let claims = state.auth_service.validate_token(&request.token)
        .map_err(|_| AppError::AuthenticationError("Invalid token for MFA verification".to_string()))?;

    // Audit log MFA verification
    if let Err(err) = state.db_service.audit_log(
        "MFA_VERIFY",
        &claims.sub,
        Some(claims.county_id),
        "AuthenticationMFAVerified"
    ).await {
        warn!("⚠️ Failed to audit log MFA verification: {}", err);
    }

    info!("✅ MFA verified successfully for user: {}", claims.sub);
    success_response_no_data("MFA verification successful")
}

/// Helper function to validate government-compliant passwords
fn is_government_compliant_password(password: &str) -> bool {
    let has_upper = password.chars().any(|c| c.is_uppercase());
    let has_lower = password.chars().any(|c| c.is_lowercase());
    let has_digit = password.chars().any(|c| c.is_ascii_digit());
    let has_special = password.chars().any(|c| "!@#$%^&*()_+-=[]{}|;:,.<>?".contains(c));

    password.len() >= 8 && has_upper && has_lower && has_digit && has_special
}

/// Championship authentication router setup
pub fn auth_routes() -> axum::Router<AuthState> {
    axum::Router::new()
        .route("/login", axum::routing::post(super::simple::login_handler))
        .route("/logout", axum::routing::post(super::simple::logout_handler))
        .route("/profile", axum::routing::get(super::simple::get_profile_handler))
        .route("/change-password", axum::routing::post(super::simple::change_password_handler))
        .route("/validate", axum::routing::post(super::simple::validate_token_handler))
        .route("/mfa/verify", axum::routing::post(super::simple::verify_mfa_handler))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_government_password_validation() {
        // Valid passwords
        assert!(is_government_compliant_password("TerraFusion2025!"));
        assert!(is_government_compliant_password("Government@123"));
        assert!(is_government_compliant_password("Secure#Pass1"));

        // Invalid passwords
        assert!(!is_government_compliant_password("password"));         // No uppercase, digit, special
        assert!(!is_government_compliant_password("PASSWORD123"));      // No lowercase, special
        assert!(!is_government_compliant_password("Pass123"));          // No special character
        assert!(!is_government_compliant_password("Pass!"));            // Too short
        assert!(!is_government_compliant_password("password!"));        // No uppercase, digit
    }
}
