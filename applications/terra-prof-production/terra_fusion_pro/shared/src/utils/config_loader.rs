use std::path::Path;
use config::{Config, ConfigError, File};
use serde::Deserialize;

use crate::error::{AppError, AppResult};

/// Load configuration from files and environment variables
pub fn load_config<T>(config_dir: &str, env: &str) -> AppResult<T> 
where
    T: for<'de> Deserialize<'de>,
{
    let config_path = Path::new(config_dir);
    
    // Build configuration from files
    let config = Config::builder()
        // Start with default.toml
        .add_source(File::from(config_path.join("default.toml")))
        // Layer on the environment-specific file
        .add_source(File::from(config_path.join(format!("{}.toml", env))))
        // Add environment variables with prefix "APP_"
        .add_source(config::Environment::with_prefix("APP").separator("__"))
        .build()
        .map_err(|e| AppError::Configuration(format!("Failed to load configuration: {}", e)))?;
        
    // Deserialize the configuration
    config.try_deserialize()
        .map_err(|e| AppError::Configuration(format!("Failed to deserialize configuration: {}", e)))
}

/// Get the current environment (development, production, test)
pub fn get_environment() -> String {
    std::env::var("ENVIRONMENT").unwrap_or_else(|_| "development".to_string())
}

/// Check if running in development environment
pub fn is_development() -> bool {
    get_environment() == "development"
}

/// Check if running in production environment
pub fn is_production() -> bool {
    get_environment() == "production"
}

/// Check if running in test environment
pub fn is_test() -> bool {
    get_environment() == "test"
}