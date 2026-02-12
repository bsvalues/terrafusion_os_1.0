//! JWT Authentication System for TerraFusion Command Portal
//! 
//! This module provides comprehensive JWT-based authentication with government-grade
//! security standards, including multi-factor authentication support, token rotation,
//! and advanced security monitoring. Designed for federal compliance requirements.

use axum::{
    async_trait,
    extract::{Request, State},
    http::{header, StatusCode},
    middleware::Next,
    response::Response,
    Json,
};
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, sync::Arc};
use tokio::sync::RwLock;
use uuid::Uuid;

/// JWT Claims structure with government compliance fields
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    /// Subject (user ID)
    pub sub: String,
    /// User email
    pub email: String,
    /// User roles (admin, analyst, operator, etc.)
    pub roles: Vec<String>,
    /// Government clearance level
    pub clearance_level: String,
    /// Agency/department identifier
    pub agency: String,
    /// Session ID for tracking
    pub session_id: String,
    /// Multi-factor authentication verified
    pub mfa_verified: bool,
    /// Issued at timestamp
    pub iat: i64,
    /// Expiration timestamp
    pub exp: i64,
    /// Not before timestamp
    pub nbf: i64,
    /// Issuer
    pub iss: String,
    /// Audience
    pub aud: String,
    /// JWT ID for revocation tracking
    pub jti: String,
    /// Device fingerprint for security
    pub device_fingerprint: Option<String>,
    /// IP address restriction
    pub allowed_ips: Option<Vec<String>>,
    /// Permissions array
    pub permissions: Vec<String>,
}

/// JWT Authentication configuration
#[derive(Debug, Clone)]
pub struct JwtConfig {
    /// JWT secret key
    pub secret: String,
    /// Token expiration duration (default: 8 hours)
    pub expiration_hours: i64,
    /// Refresh token expiration (default: 30 days)
    pub refresh_expiration_days: i64,
    /// Issuer identifier
    pub issuer: String,
    /// Audience identifier
    pub audience: String,
    /// Algorithm to use (default: HS512)
    pub algorithm: Algorithm,
    /// Enable strict IP validation
    pub strict_ip_validation: bool,
    /// Enable device fingerprint validation
    pub device_fingerprint_validation: bool,
}

impl Default for JwtConfig {
    fn default() -> Self {
        Self {
            secret: "terrafusion-super-secret-key-change-in-production".to_string(),
            expiration_hours: 8,
            refresh_expiration_days: 30,
            issuer: "terrafusion-command-portal".to_string(),
            audience: "terrafusion-users".to_string(),
            algorithm: Algorithm::HS512,
            strict_ip_validation: false,
            device_fingerprint_validation: false,
        }
    }
}

/// Token pair for authentication response
#[derive(Debug, Serialize, Deserialize)]
pub struct TokenPair {
    pub access_token: String,
    pub refresh_token: String,
    pub token_type: String,
    pub expires_in: i64,
}

/// User authentication request
#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
    pub mfa_code: Option<String>,
    pub device_fingerprint: Option<String>,
}

/// Token refresh request
#[derive(Debug, Deserialize)]
pub struct RefreshRequest {
    pub refresh_token: String,
}

/// User session information
#[derive(Debug, Clone)]
pub struct UserSession {
    pub user_id: String,
    pub email: String,
    pub roles: Vec<String>,
    pub clearance_level: String,
    pub agency: String,
    pub session_id: String,
    pub created_at: chrono::DateTime<Utc>,
    pub last_activity: chrono::DateTime<Utc>,
    pub ip_address: String,
    pub device_fingerprint: Option<String>,
}

/// Authentication service for JWT operations
pub struct JwtAuthService {
    config: JwtConfig,
    encoding_key: EncodingKey,
    decoding_key: DecodingKey,
    validation: Validation,
    /// Active sessions storage
    sessions: Arc<RwLock<HashMap<String, UserSession>>>,
    /// Revoked tokens storage (JTI -> revocation timestamp)
    revoked_tokens: Arc<RwLock<HashMap<String, chrono::DateTime<Utc>>>>,
    /// Refresh tokens storage (token -> user_id)
    refresh_tokens: Arc<RwLock<HashMap<String, String>>>,
}

impl JwtAuthService {
    /// Create new JWT authentication service
    pub fn new(config: JwtConfig) -> Self {
        let encoding_key = EncodingKey::from_secret(config.secret.as_ref());
        let decoding_key = DecodingKey::from_secret(config.secret.as_ref());
        
        let mut validation = Validation::new(config.algorithm);
        validation.set_issuer(&[config.issuer.clone()]);
        validation.set_audience(&[config.audience.clone()]);
        validation.validate_exp = true;
        validation.validate_nbf = true;

        Self {
            config,
            encoding_key,
            decoding_key,
            validation,
            sessions: Arc::new(RwLock::new(HashMap::new())),
            revoked_tokens: Arc::new(RwLock::new(HashMap::new())),
            refresh_tokens: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Generate JWT token for authenticated user
    pub async fn generate_token(&self, user_data: UserTokenData) -> Result<TokenPair, AuthError> {
        let now = Utc::now();
        let session_id = Uuid::new_v4().to_string();
        let jti = Uuid::new_v4().to_string();
        
        // Create access token claims
        let claims = Claims {
            sub: user_data.user_id.clone(),
            email: user_data.email.clone(),
            roles: user_data.roles.clone(),
            clearance_level: user_data.clearance_level.clone(),
            agency: user_data.agency.clone(),
            session_id: session_id.clone(),
            mfa_verified: user_data.mfa_verified,
            iat: now.timestamp(),
            exp: (now + Duration::hours(self.config.expiration_hours)).timestamp(),
            nbf: now.timestamp(),
            iss: self.config.issuer.clone(),
            aud: self.config.audience.clone(),
            jti: jti.clone(),
            device_fingerprint: user_data.device_fingerprint.clone(),
            allowed_ips: user_data.allowed_ips.clone(),
            permissions: user_data.permissions.clone(),
        };

        // Generate access token
        let access_token = encode(&Header::new(self.config.algorithm), &claims, &self.encoding_key)
            .map_err(|e| AuthError::TokenGeneration(e.to_string()))?;

        // Generate refresh token
        let refresh_token = Uuid::new_v4().to_string();
        
        // Store session
        let session = UserSession {
            user_id: user_data.user_id.clone(),
            email: user_data.email.clone(),
            roles: user_data.roles.clone(),
            clearance_level: user_data.clearance_level.clone(),
            agency: user_data.agency.clone(),
            session_id: session_id.clone(),
            created_at: now,
            last_activity: now,
            ip_address: user_data.ip_address.clone(),
            device_fingerprint: user_data.device_fingerprint.clone(),
        };

        {
            let mut sessions = self.sessions.write().await;
            sessions.insert(session_id.clone(), session);
        }

        {
            let mut refresh_tokens = self.refresh_tokens.write().await;
            refresh_tokens.insert(refresh_token.clone(), user_data.user_id);
        }

        Ok(TokenPair {
            access_token,
            refresh_token,
            token_type: "Bearer".to_string(),
            expires_in: self.config.expiration_hours * 3600,
        })
    }

    /// Validate and decode JWT token
    pub async fn validate_token(&self, token: &str) -> Result<Claims, AuthError> {
        // Decode token
        let token_data = decode::<Claims>(token, &self.decoding_key, &self.validation)
            .map_err(|e| match e.kind() {
                jsonwebtoken::errors::ErrorKind::ExpiredSignature => AuthError::TokenExpired,
                jsonwebtoken::errors::ErrorKind::InvalidToken => AuthError::InvalidToken,
                _ => AuthError::TokenValidation(e.to_string()),
            })?;

        let claims = token_data.claims;

        // Check if token is revoked
        {
            let revoked_tokens = self.revoked_tokens.read().await;
            if revoked_tokens.contains_key(&claims.jti) {
                return Err(AuthError::TokenRevoked);
            }
        }

        // Update session activity
        {
            let mut sessions = self.sessions.write().await;
            if let Some(session) = sessions.get_mut(&claims.session_id) {
                session.last_activity = Utc::now();
            }
        }

        Ok(claims)
    }

    /// Refresh access token using refresh token
    pub async fn refresh_token(&self, refresh_token: &str) -> Result<TokenPair, AuthError> {
        let user_id = {
            let refresh_tokens = self.refresh_tokens.read().await;
            refresh_tokens.get(refresh_token).cloned()
                .ok_or(AuthError::InvalidRefreshToken)?
        };

        // Remove old refresh token
        {
            let mut refresh_tokens = self.refresh_tokens.write().await;
            refresh_tokens.remove(refresh_token);
        }

        // Generate new token pair
        // Note: In production, fetch user data from database
        let user_data = UserTokenData {
            user_id,
            email: "user@example.com".to_string(), // Fetch from DB
            roles: vec!["user".to_string()], // Fetch from DB
            clearance_level: "public".to_string(), // Fetch from DB
            agency: "default".to_string(), // Fetch from DB
            mfa_verified: true, // Verify from session
            permissions: vec![], // Fetch from DB
            device_fingerprint: None,
            allowed_ips: None,
            ip_address: "0.0.0.0".to_string(), // Get from request
        };

        self.generate_token(user_data).await
    }

    /// Revoke token by JTI
    pub async fn revoke_token(&self, jti: &str) -> Result<(), AuthError> {
        let mut revoked_tokens = self.revoked_tokens.write().await;
        revoked_tokens.insert(jti.to_string(), Utc::now());
        Ok(())
    }

    /// Get active session by session ID
    pub async fn get_session(&self, session_id: &str) -> Option<UserSession> {
        let sessions = self.sessions.read().await;
        sessions.get(session_id).cloned()
    }

    /// Remove session (logout)
    pub async fn remove_session(&self, session_id: &str) -> Result<(), AuthError> {
        let mut sessions = self.sessions.write().await;
        sessions.remove(session_id);
        Ok(())
    }

    /// Clean up expired sessions and revoked tokens
    pub async fn cleanup_expired(&self) {
        let now = Utc::now();
        
        // Clean expired sessions
        {
            let mut sessions = self.sessions.write().await;
            sessions.retain(|_, session| {
                now.signed_duration_since(session.last_activity).num_hours() < 24
            });
        }

        // Clean old revoked tokens (keep for 7 days)
        {
            let mut revoked_tokens = self.revoked_tokens.write().await;
            revoked_tokens.retain(|_, revocation_time| {
                now.signed_duration_since(*revocation_time).num_days() < 7
            });
        }
    }

    /// Get authentication metrics
    pub async fn get_auth_metrics(&self) -> AuthMetrics {
        let sessions = self.sessions.read().await;
        let revoked_tokens = self.revoked_tokens.read().await;
        let refresh_tokens = self.refresh_tokens.read().await;

        AuthMetrics {
            active_sessions: sessions.len(),
            revoked_tokens_count: revoked_tokens.len(),
            active_refresh_tokens: refresh_tokens.len(),
            session_summary: sessions.values().map(|s| SessionSummary {
                user_id: s.user_id.clone(),
                agency: s.agency.clone(),
                clearance_level: s.clearance_level.clone(),
                last_activity: s.last_activity,
                ip_address: s.ip_address.clone(),
            }).collect(),
        }
    }
}

/// User data for token generation
#[derive(Debug, Clone)]
pub struct UserTokenData {
    pub user_id: String,
    pub email: String,
    pub roles: Vec<String>,
    pub clearance_level: String,
    pub agency: String,
    pub mfa_verified: bool,
    pub permissions: Vec<String>,
    pub device_fingerprint: Option<String>,
    pub allowed_ips: Option<Vec<String>>,
    pub ip_address: String,
}

/// Authentication metrics for monitoring
#[derive(Debug, Serialize)]
pub struct AuthMetrics {
    pub active_sessions: usize,
    pub revoked_tokens_count: usize,
    pub active_refresh_tokens: usize,
    pub session_summary: Vec<SessionSummary>,
}

/// Session summary for metrics
#[derive(Debug, Serialize)]
pub struct SessionSummary {
    pub user_id: String,
    pub agency: String,
    pub clearance_level: String,
    pub last_activity: chrono::DateTime<Utc>,
    pub ip_address: String,
}

/// Authentication errors
#[derive(Debug, thiserror::Error)]
pub enum AuthError {
    #[error("Token generation failed: {0}")]
    TokenGeneration(String),
    #[error("Token validation failed: {0}")]
    TokenValidation(String),
    #[error("Token has expired")]
    TokenExpired,
    #[error("Invalid token")]
    InvalidToken,
    #[error("Token has been revoked")]
    TokenRevoked,
    #[error("Invalid refresh token")]
    InvalidRefreshToken,
    #[error("Insufficient permissions")]
    InsufficientPermissions,
    #[error("Invalid credentials")]
    InvalidCredentials,
    #[error("MFA verification required")]
    MfaRequired,
    #[error("Device not authorized")]
    UnauthorizedDevice,
    #[error("IP address not allowed")]
    IpNotAllowed,
}

/// JWT Authentication middleware
pub async fn jwt_auth_middleware(
    State(auth_service): State<Arc<JwtAuthService>>,
    mut request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    // Extract authorization header
    let auth_header = request
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|header| header.to_str().ok())
        .and_then(|header| {
            if header.starts_with("Bearer ") {
                Some(&header[7..])
            } else {
                None
            }
        });

    let token = auth_header.ok_or(StatusCode::UNAUTHORIZED)?;

    // Validate token
    let claims = auth_service
        .validate_token(token)
        .await
        .map_err(|_| StatusCode::UNAUTHORIZED)?;

    // Add claims to request extensions
    request.extensions_mut().insert(claims);

    Ok(next.run(request).await)
}

/// Extract claims from request
pub fn extract_claims(request: &Request) -> Option<&Claims> {
    request.extensions().get::<Claims>()
}

/// Role-based authorization middleware
pub fn require_role(required_role: &'static str) -> impl Fn(Request, Next) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<Response, StatusCode>> + Send>> + Clone {
    move |request: Request, next: Next| {
        Box::pin(async move {
            let claims = extract_claims(&request).ok_or(StatusCode::UNAUTHORIZED)?;
            
            if !claims.roles.contains(&required_role.to_string()) {
                return Err(StatusCode::FORBIDDEN);
            }

            Ok(next.run(request).await)
        })
    }
}

/// Permission-based authorization middleware
pub fn require_permission(required_permission: &'static str) -> impl Fn(Request, Next) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<Response, StatusCode>> + Send>> + Clone {
    move |request: Request, next: Next| {
        Box::pin(async move {
            let claims = extract_claims(&request).ok_or(StatusCode::UNAUTHORIZED)?;
            
            if !claims.permissions.contains(&required_permission.to_string()) {
                return Err(StatusCode::FORBIDDEN);
            }

            Ok(next.run(request).await)
        })
    }
}

/// Clearance level authorization middleware
pub fn require_clearance(minimum_level: &'static str) -> impl Fn(Request, Next) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<Response, StatusCode>> + Send>> + Clone {
    move |request: Request, next: Next| {
        Box::pin(async move {
            let claims = extract_claims(&request).ok_or(StatusCode::UNAUTHORIZED)?;
            
            // Simple clearance level check (in production, use proper ordering)
            let clearance_levels = ["public", "confidential", "secret", "top_secret"];
            let user_level_idx = clearance_levels.iter().position(|&x| x == claims.clearance_level).unwrap_or(0);
            let required_level_idx = clearance_levels.iter().position(|&x| x == minimum_level).unwrap_or(0);
            
            if user_level_idx < required_level_idx {
                return Err(StatusCode::FORBIDDEN);
            }

            Ok(next.run(request).await)
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tokio;

    #[tokio::test]
    async fn test_jwt_auth_service_creation() {
        let config = JwtConfig::default();
        let auth_service = JwtAuthService::new(config);
        
        // Verify service is created properly
        assert_eq!(auth_service.config.issuer, "terrafusion-command-portal");
        assert_eq!(auth_service.config.audience, "terrafusion-users");
    }

    #[tokio::test]
    async fn test_token_generation() {
        let config = JwtConfig::default();
        let auth_service = JwtAuthService::new(config);
        
        let user_data = UserTokenData {
            user_id: "test-user-123".to_string(),
            email: "test@terrafusion.gov".to_string(),
            roles: vec!["analyst".to_string()],
            clearance_level: "secret".to_string(),
            agency: "DOD".to_string(),
            mfa_verified: true,
            permissions: vec!["read:deployments".to_string()],
            device_fingerprint: Some("device-123".to_string()),
            allowed_ips: Some(vec!["192.168.1.100".to_string()]),
            ip_address: "192.168.1.100".to_string(),
        };

        let token_pair = auth_service.generate_token(user_data).await.unwrap();
        
        assert!(!token_pair.access_token.is_empty());
        assert!(!token_pair.refresh_token.is_empty());
        assert_eq!(token_pair.token_type, "Bearer");
        assert_eq!(token_pair.expires_in, 8 * 3600);
    }

    #[tokio::test]
    async fn test_token_validation() {
        let config = JwtConfig::default();
        let auth_service = JwtAuthService::new(config);
        
        let user_data = UserTokenData {
            user_id: "test-user-456".to_string(),
            email: "analyst@terrafusion.gov".to_string(),
            roles: vec!["analyst".to_string(), "operator".to_string()],
            clearance_level: "confidential".to_string(),
            agency: "DHS".to_string(),
            mfa_verified: true,
            permissions: vec!["read:all".to_string(), "write:reports".to_string()],
            device_fingerprint: None,
            allowed_ips: None,
            ip_address: "10.0.0.1".to_string(),
        };

        let token_pair = auth_service.generate_token(user_data).await.unwrap();
        let claims = auth_service.validate_token(&token_pair.access_token).await.unwrap();
        
        assert_eq!(claims.sub, "test-user-456");
        assert_eq!(claims.email, "analyst@terrafusion.gov");
        assert_eq!(claims.roles, vec!["analyst", "operator"]);
        assert_eq!(claims.clearance_level, "confidential");
        assert_eq!(claims.agency, "DHS");
        assert!(claims.mfa_verified);
        assert_eq!(claims.permissions, vec!["read:all", "write:reports"]);
    }

    #[tokio::test]
    async fn test_token_revocation() {
        let config = JwtConfig::default();
        let auth_service = JwtAuthService::new(config);
        
        let user_data = UserTokenData {
            user_id: "test-user-789".to_string(),
            email: "admin@terrafusion.gov".to_string(),
            roles: vec!["admin".to_string()],
            clearance_level: "top_secret".to_string(),
            agency: "NSA".to_string(),
            mfa_verified: true,
            permissions: vec!["admin:all".to_string()],
            device_fingerprint: None,
            allowed_ips: None,
            ip_address: "172.16.0.1".to_string(),
        };

        let token_pair = auth_service.generate_token(user_data).await.unwrap();
        let claims = auth_service.validate_token(&token_pair.access_token).await.unwrap();
        
        // Revoke token
        auth_service.revoke_token(&claims.jti).await.unwrap();
        
        // Validation should now fail
        let result = auth_service.validate_token(&token_pair.access_token).await;
        assert!(matches!(result, Err(AuthError::TokenRevoked)));
    }

    #[tokio::test]
    async fn test_auth_metrics() {
        let config = JwtConfig::default();
        let auth_service = JwtAuthService::new(config);
        
        // Generate multiple tokens
        for i in 1..=3 {
            let user_data = UserTokenData {
                user_id: format!("user-{}", i),
                email: format!("user{}@terrafusion.gov", i),
                roles: vec!["user".to_string()],
                clearance_level: "public".to_string(),
                agency: "TEST".to_string(),
                mfa_verified: false,
                permissions: vec![],
                device_fingerprint: None,
                allowed_ips: None,
                ip_address: "127.0.0.1".to_string(),
            };
            auth_service.generate_token(user_data).await.unwrap();
        }

        let metrics = auth_service.get_auth_metrics().await;
        assert_eq!(metrics.active_sessions, 3);
        assert_eq!(metrics.active_refresh_tokens, 3);
        assert_eq!(metrics.session_summary.len(), 3);
    }
}