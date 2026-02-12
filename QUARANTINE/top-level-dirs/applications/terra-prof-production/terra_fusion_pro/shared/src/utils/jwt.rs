use chrono::{DateTime, Duration, Utc};
use serde::{Deserialize, Serialize};
use sqlx::types::Uuid;

use crate::error::{AppError, AppResult};
use crate::models::user::UserRole;

/// JWT Claims structure
#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    /// Subject (user ID)
    pub sub: String,
    
    /// Issued at timestamp
    pub iat: i64,
    
    /// Expiration timestamp
    pub exp: i64,
    
    /// User role
    pub role: String,
    
    /// Email
    pub email: String,
    
    /// Name
    pub name: String,
}

/// Create a JWT token
pub fn create_token(
    user_id: Uuid,
    email: &str,
    name: &str,
    role: &UserRole,
    secret: &str,
    expiration_seconds: u64,
) -> AppResult<String> {
    let now = Utc::now();
    let expiration = now + Duration::seconds(expiration_seconds as i64);
    
    let claims = Claims {
        sub: user_id.to_string(),
        iat: now.timestamp(),
        exp: expiration.timestamp(),
        role: format!("{:?}", role).to_lowercase(),
        email: email.to_string(),
        name: name.to_string(),
    };
    
    // Note: In a real implementation, we would use a JWT library like jsonwebtoken
    // For this example, we'll just serialize to JSON and encode in base64
    // In production, always use a proper JWT library
    let claims_json = serde_json::to_string(&claims)
        .map_err(|e| AppError::InternalServer(format!("Failed to serialize claims: {}", e)))?;
    
    // This is a placeholder for actual JWT encoding
    let encoded = format!("header.{}.signature", base64_encode(&claims_json));
    
    Ok(encoded)
}

/// Validate a JWT token
pub fn validate_token(token: &str, secret: &str) -> AppResult<Claims> {
    // In a real implementation, we would verify the signature using a JWT library
    // For this example, we'll just split the token and decode the claims part
    
    let parts: Vec<&str> = token.split('.').collect();
    if parts.len() != 3 {
        return Err(AppError::Authentication("Invalid token format".to_string()));
    }
    
    let claims_base64 = parts[1];
    let claims_json = base64_decode(claims_base64)
        .map_err(|_| AppError::Authentication("Invalid token encoding".to_string()))?;
    
    let claims: Claims = serde_json::from_str(&claims_json)
        .map_err(|_| AppError::Authentication("Invalid token claims".to_string()))?;
    
    // Check if token is expired
    let now = Utc::now().timestamp();
    if claims.exp < now {
        return Err(AppError::Authentication("Token has expired".to_string()));
    }
    
    Ok(claims)
}

/// Get the user ID from a token
pub fn get_user_id_from_token(token: &str) -> AppResult<Uuid> {
    let parts: Vec<&str> = token.split('.').collect();
    if parts.len() != 3 {
        return Err(AppError::Authentication("Invalid token format".to_string()));
    }
    
    let claims_base64 = parts[1];
    let claims_json = base64_decode(claims_base64)
        .map_err(|_| AppError::Authentication("Invalid token encoding".to_string()))?;
    
    let claims: Claims = serde_json::from_str(&claims_json)
        .map_err(|_| AppError::Authentication("Invalid token claims".to_string()))?;
    
    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| AppError::Authentication("Invalid user ID in token".to_string()))?;
    
    Ok(user_id)
}

/// Simple base64 encoding (for demonstration purposes)
fn base64_encode(input: &str) -> String {
    // In a real implementation, use proper base64 encoding
    // This is a placeholder
    format!("encoded_{}", input)
}

/// Simple base64 decoding (for demonstration purposes)
fn base64_decode(input: &str) -> Result<String, &'static str> {
    // In a real implementation, use proper base64 decoding
    // This is a placeholder
    if input.starts_with("encoded_") {
        Ok(input[8..].to_string())
    } else {
        Err("Invalid encoding")
    }
}