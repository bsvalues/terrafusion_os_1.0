use std::env;

use crate::error::{AppError, AppResult};

/// Replit Auth configuration
#[derive(Debug, Clone)]
pub struct ReplitAuthConfig {
    /// Replit client ID
    pub client_id: String,
    /// Replit client secret
    pub client_secret: String,
    /// Domain for auth callbacks
    pub domain: String,
}

/// Application configuration
#[derive(Debug, Clone)]
pub struct Config {
    /// Database URL
    pub database_url: String,
    /// Host to bind to
    pub host: String,
    /// Port to bind to
    pub port: u16,
    /// Replit Auth configuration
    pub replit_auth: ReplitAuthConfig,
    /// JWT secret
    pub jwt_secret: String,
    /// Environment (development, production)
    pub environment: String,
}

impl Config {
    /// Load configuration from environment variables
    pub fn from_env() -> AppResult<Self> {
        let database_url = env::var("DATABASE_URL")
            .map_err(|_| AppError::Configuration("DATABASE_URL not set".to_string()))?;
            
        let host = env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string());
        
        let port = env::var("PORT")
            .unwrap_or_else(|_| "5000".to_string())
            .parse::<u16>()
            .map_err(|_| AppError::Configuration("PORT must be a number".to_string()))?;
            
        let replit_id = env::var("REPL_ID")
            .map_err(|_| AppError::Configuration("REPL_ID not set".to_string()))?;
            
        let replit_slug = env::var("REPL_SLUG")
            .map_err(|_| AppError::Configuration("REPL_SLUG not set".to_string()))?;
            
        let replit_owner = env::var("REPL_OWNER")
            .map_err(|_| AppError::Configuration("REPL_OWNER not set".to_string()))?;
            
        // The default domain is based on Replit's standard domain pattern
        let domain = env::var("REPLIT_DOMAIN")
            .unwrap_or_else(|_| format!("{}.{}.replit.dev", replit_slug, replit_owner));
            
        // In a real application, this should be a proper secret
        let client_secret = env::var("REPLIT_CLIENT_SECRET")
            .unwrap_or_else(|_| "placeholder_secret".to_string());
            
        let jwt_secret = env::var("JWT_SECRET")
            .unwrap_or_else(|_| "development_jwt_secret".to_string());
            
        let environment = env::var("ENVIRONMENT")
            .unwrap_or_else(|_| "development".to_string());
            
        Ok(Self {
            database_url,
            host,
            port,
            replit_auth: ReplitAuthConfig {
                client_id: replit_id,
                client_secret,
                domain,
            },
            jwt_secret,
            environment,
        })
    }
    
    /// Check if in development environment
    pub fn is_development(&self) -> bool {
        self.environment == "development"
    }
    
    /// Check if in production environment
    pub fn is_production(&self) -> bool {
        self.environment == "production"
    }
}