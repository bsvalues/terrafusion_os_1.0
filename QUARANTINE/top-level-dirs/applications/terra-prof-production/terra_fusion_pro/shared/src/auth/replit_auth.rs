use crate::error::{AppError, AppResult};
use crate::models::user::User;
use chrono::{DateTime, Utc};
use jsonwebtoken::{decode, DecodingKey, TokenData, Validation};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

/// Replit Auth configuration
#[derive(Clone)]
pub struct ReplitAuthConfig {
    /// Replit client ID (REPL_ID)
    pub client_id: String,
    /// Domain for auth callbacks
    pub domain: String,
    /// OpenID discovery URL
    pub discovery_url: String,
}

/// Replit Auth client
pub struct ReplitAuth {
    /// Configuration
    pub config: ReplitAuthConfig,
    /// HTTP client
    client: Client,
}

/// Token response from Replit Auth
#[derive(Debug, Deserialize)]
pub struct TokenResponse {
    pub access_token: String,
    pub token_type: String,
    pub id_token: String,
    pub expires_in: i64,
    pub refresh_token: String,
}

/// ID token claims
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Claims {
    pub sub: String,
    pub iat: i64,
    pub exp: i64,
    pub email: Option<String>,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub profile_image_url: Option<String>,
}

/// User session data with tokens
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct UserSession {
    pub claims: Claims,
    pub access_token: String,
    pub refresh_token: String,
    pub expires_at: i64,
}

impl ReplitAuth {
    /// Create a new Replit Auth client with configuration
    pub fn new(config: ReplitAuthConfig) -> Self {
        Self {
            config,
            client: Client::new(),
        }
    }

    /// Create auth URL for login redirect
    pub fn auth_url(&self, state: &str) -> String {
        format!(
            "https://replit.com/auth?client_id={}&redirect_uri={}&scope=openid%20profile%20email&state={}&response_type=code",
            self.config.client_id,
            self.redirect_uri(),
            state
        )
    }

    /// Build redirect URI
    pub fn redirect_uri(&self) -> String {
        format!("https://{}/auth/callback", self.config.domain)
    }

    /// Build end session URL for logout
    pub fn end_session_url(&self, redirect_uri: &str) -> String {
        format!(
            "https://replit.com/auth/logout?client_id={}&post_logout_redirect_uri={}",
            self.config.client_id,
            redirect_uri
        )
    }

    /// Exchange auth code for tokens
    pub async fn exchange_code(&self, code: &str) -> AppResult<TokenResponse> {
        let params = [
            ("grant_type", "authorization_code"),
            ("code", code),
            ("redirect_uri", &self.redirect_uri()),
            ("client_id", &self.config.client_id),
        ];

        let response = self
            .client
            .post("https://replit.com/auth/token")
            .form(&params)
            .send()
            .await
            .map_err(|e| AppError::ExternalService(format!("Auth token request failed: {}", e)))?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response
                .text()
                .await
                .unwrap_or_else(|_| "Unknown error".to_string());
            return Err(AppError::ExternalService(format!(
                "Auth token request failed with status {}: {}",
                status, text
            )));
        }

        response
            .json::<TokenResponse>()
            .await
            .map_err(|e| AppError::Deserialization(format!("Auth token response: {}", e)))
    }

    /// Decode and validate ID token
    pub fn decode_id_token(&self, token: &str) -> AppResult<Claims> {
        // In production, we would validate using JWKS from Replit
        // For now, we'll just decode without validation
        let validation = Validation::new(jsonwebtoken::Algorithm::RS256);
        
        // For development, we're using a placeholder key
        // In production, fetch the actual JWKS from Replit
        let key = DecodingKey::from_secret(b"placeholder");
        
        let token_data = decode::<Claims>(token, &key, &validation)
            .map_err(|e| AppError::Authentication(format!("Invalid ID token: {}", e)))?;
            
        Ok(token_data.claims)
    }

    /// Convert claims to user model
    pub fn claims_to_user(&self, claims: &Claims) -> User {
        User {
            id: claims.sub.clone(),
            email: claims.email.clone(),
            first_name: claims.first_name.clone(),
            last_name: claims.last_name.clone(),
            profile_image_url: claims.profile_image_url.clone(),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        }
    }

    /// Refresh access token
    pub async fn refresh_token(&self, refresh_token: &str) -> AppResult<TokenResponse> {
        let params = [
            ("grant_type", "refresh_token"),
            ("refresh_token", refresh_token),
            ("client_id", &self.config.client_id),
        ];

        let response = self
            .client
            .post("https://replit.com/auth/token")
            .form(&params)
            .send()
            .await
            .map_err(|e| AppError::ExternalService(format!("Refresh token request failed: {}", e)))?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response
                .text()
                .await
                .unwrap_or_else(|_| "Unknown error".to_string());
            return Err(AppError::ExternalService(format!(
                "Refresh token request failed with status {}: {}",
                status, text
            )));
        }

        response
            .json::<TokenResponse>()
            .await
            .map_err(|e| AppError::Deserialization(format!("Refresh token response: {}", e)))
    }
}