use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};

use crate::error::{AppError, AppResult};

/// JWT claims for service-to-service authentication
#[derive(Debug, Serialize, Deserialize)]
pub struct ServiceClaims {
    /// Subject (service name)
    pub sub: String,
    /// Issuer (service name)
    pub iss: String,
    /// Audience (target service)
    pub aud: Option<String>,
    /// Issued at timestamp
    pub iat: i64,
    /// Expiration timestamp
    pub exp: i64,
}

/// JWT utilities for service-to-service authentication
pub struct JwtUtil {
    /// Encoding key
    encoding_key: EncodingKey,
    /// Decoding key
    decoding_key: DecodingKey,
}

impl JwtUtil {
    /// Create a new JWT utility with a secret
    pub fn new(secret: &[u8]) -> Self {
        Self {
            encoding_key: EncodingKey::from_secret(secret),
            decoding_key: DecodingKey::from_secret(secret),
        }
    }
    
    /// Generate a JWT token for a service
    pub fn generate_token(&self, service_name: &str, audience: Option<&str>, ttl_seconds: i64) -> AppResult<String> {
        let now = Utc::now();
        let expires_at = now + Duration::seconds(ttl_seconds);
        
        let claims = ServiceClaims {
            sub: service_name.to_string(),
            iss: service_name.to_string(),
            aud: audience.map(|s| s.to_string()),
            iat: now.timestamp(),
            exp: expires_at.timestamp(),
        };
        
        encode(&Header::default(), &claims, &self.encoding_key)
            .map_err(|e| AppError::Authentication(format!("Failed to generate JWT token: {}", e)))
    }
    
    /// Validate a JWT token
    pub fn validate_token(&self, token: &str) -> AppResult<ServiceClaims> {
        let mut validation = Validation::default();
        validation.validate_exp = true;
        
        decode::<ServiceClaims>(token, &self.decoding_key, &validation)
            .map(|data| data.claims)
            .map_err(|e| AppError::Authentication(format!("Invalid JWT token: {}", e)))
    }
    
    /// Validate a JWT token for a specific audience
    pub fn validate_token_for_audience(&self, token: &str, audience: &str) -> AppResult<ServiceClaims> {
        let claims = self.validate_token(token)?;
        
        match &claims.aud {
            Some(aud) if aud == audience => Ok(claims),
            Some(aud) => Err(AppError::Authentication(format!("Invalid audience: expected {}, got {}", audience, aud))),
            None => Err(AppError::Authentication("Missing audience claim".to_string())),
        }
    }
}