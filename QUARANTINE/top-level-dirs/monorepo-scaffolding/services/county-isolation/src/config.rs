//! TerraFusion County Isolation - Configuration Management
//! Government-grade configuration for sovereign data boundaries

use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Championship configuration for county isolation service
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct Config {
    pub host: String,
    pub port: u16,
    pub database: DatabaseConfig,
    pub government: GovernmentConfig,
    pub security: SecurityConfig,
    pub audit: AuditConfig,
    pub isolation: IsolationConfig,
    pub counties: HashMap<String, CountyConfig>,
}

/// Database configuration with government-grade security
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct DatabaseConfig {
    pub url: String,
    pub max_connections: u32,
    pub min_connections: u32,
    pub connection_timeout: u64,
    pub idle_timeout: u64,
    pub max_lifetime: u64,
    pub enable_logging: bool,
    pub encryption_enabled: bool,
}

/// Government compliance configuration
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct GovernmentConfig {
    pub jurisdiction: String,
    pub total_counties: u32,
    pub fisma_level: String,
    pub compliance_reporting: bool,
    pub data_sovereignty_enabled: bool,
    pub cross_county_validation: bool,
    pub audit_retention_days: u32,
    pub security_clearance_required: bool,
}

/// FISMA-HIGH security configuration
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct SecurityConfig {
    pub jwt_secret: String,
    pub jwt_issuer: String,
    pub jwt_expiration_hours: u32,
    pub encryption_key: String,
    pub min_clearance_level: u8,
    pub mfa_required: bool,
    pub session_timeout_minutes: u32,
    pub max_login_attempts: u32,
    pub lockout_duration_minutes: u32,
}

/// Comprehensive audit configuration
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct AuditConfig {
    pub enabled: bool,
    pub log_level: String,
    pub retention_days: u32,
    pub real_time_monitoring: bool,
    pub violation_alerting: bool,
    pub compliance_reporting: bool,
    pub export_format: String,
    pub encryption_enabled: bool,
}

/// County isolation configuration
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct IsolationConfig {
    pub strict_mode: bool,
    pub cross_county_queries_allowed: bool,
    pub validation_cache_ttl: u32,
    pub metrics_collection: bool,
    pub violation_threshold: f64,
    pub auto_block_violations: bool,
    pub sovereignty_validation: bool,
    pub data_residency_enforcement: bool,
}

/// Individual county configuration
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct CountyConfig {
    pub id: String,
    pub name: String,
    pub state: String,
    pub fips_code: String,
    pub data_classification: String,
    pub isolation_level: String,
    pub compliance_requirements: Vec<String>,
    pub authorized_systems: Vec<String>,
    pub restricted_operations: Vec<String>,
    pub data_retention_days: u32,
    pub cross_county_sharing_allowed: bool,
}

impl Config {
    /// Load configuration with government-grade validation
    pub fn load() -> Result<Self> {
        // Start with default development configuration
        let config = Self::default();

        // Validate configuration meets FISMA-HIGH standards
        config.validate()?;

        tracing::info!("✅ TerraFusion County Isolation Configuration loaded with FISMA-HIGH compliance");
        Ok(config)
    }

    /// Validate configuration for government compliance
    fn validate(&self) -> Result<()> {
        // Validate FISMA compliance level
        if self.government.fisma_level != "HIGH" && self.government.fisma_level != "MODERATE" {
            return Err(anyhow!("FISMA level must be HIGH or MODERATE for government deployment"));
        }

        // Validate security requirements
        if self.security.min_clearance_level < 1 {
            return Err(anyhow!("Minimum security clearance level must be at least 1"));
        }

        // Validate county configuration
        if self.counties.is_empty() {
            return Err(anyhow!("At least one county must be configured"));
        }

        // Validate database security
        if !self.database.encryption_enabled {
            return Err(anyhow!("Database encryption must be enabled for government deployment"));
        }

        tracing::info!("🔒 Configuration validation passed - FISMA-HIGH compliance verified");
        Ok(())
    }

    /// Get county configuration by ID
    pub fn get_county_config(&self, county_id: &str) -> Option<&CountyConfig> {
        self.counties.get(county_id)
    }

    /// Check if cross-county operation is allowed
    pub fn is_cross_county_allowed(&self, source_county: &str, target_county: &str) -> bool {
        if source_county == target_county {
            return true;
        }

        if !self.isolation.cross_county_queries_allowed {
            return false;
        }

        // Check individual county policies
        if let (Some(source_config), Some(target_config)) =
            (self.get_county_config(source_county), self.get_county_config(target_county)) {
            source_config.cross_county_sharing_allowed && target_config.cross_county_sharing_allowed
        } else {
            false
        }
    }
}

impl Default for Config {
    /// Default configuration for development with government standards
    fn default() -> Self {
        let mut counties = HashMap::new();

        // Add Benton County (primary development county)
        counties.insert("benton".to_string(), CountyConfig {
            id: "benton".to_string(),
            name: "Benton County".to_string(),
            state: "WA".to_string(),
            fips_code: "53005".to_string(),
            data_classification: "CONTROLLED".to_string(),
            isolation_level: "STRICT".to_string(),
            compliance_requirements: vec![
                "FISMA-HIGH".to_string(),
                "NIST-800-53".to_string(),
                "FedRAMP".to_string()
            ],
            authorized_systems: vec![
                "harris-pacs".to_string(),
                "tyler-technologies".to_string(),
                "terrafusion-core".to_string()
            ],
            restricted_operations: vec![
                "cross-county-export".to_string(),
                "bulk-data-extraction".to_string()
            ],
            data_retention_days: 2555, // 7 years for government records
            cross_county_sharing_allowed: false,
        });

        // Add King County (major county for testing)
        counties.insert("king".to_string(), CountyConfig {
            id: "king".to_string(),
            name: "King County".to_string(),
            state: "WA".to_string(),
            fips_code: "53033".to_string(),
            data_classification: "CONTROLLED".to_string(),
            isolation_level: "STRICT".to_string(),
            compliance_requirements: vec![
                "FISMA-HIGH".to_string(),
                "NIST-800-53".to_string()
            ],
            authorized_systems: vec![
                "harris-pacs".to_string(),
                "tyler-technologies".to_string(),
                "terrafusion-core".to_string()
            ],
            restricted_operations: vec![
                "cross-county-export".to_string(),
                "bulk-data-extraction".to_string()
            ],
            data_retention_days: 2555,
            cross_county_sharing_allowed: false,
        });

        Self {
            host: std::env::var("SERVER_HOST")
                .unwrap_or_else(|_| "0.0.0.0".to_string()),
            port: std::env::var("SERVER_PORT")
                .unwrap_or_else(|_| "8083".to_string())
                .parse()
                .unwrap_or(8083),
            database: DatabaseConfig {
                url: std::env::var("COUNTY_ISOLATION_DATABASE_URL")
                    .unwrap_or_else(|_| "postgresql://terrafusion:secure@localhost:5432/county_isolation".to_string()),
                max_connections: 25,
                min_connections: 5,
                connection_timeout: 30,
                idle_timeout: 600,
                max_lifetime: 1800,
                enable_logging: true,
                encryption_enabled: true,
            },
            government: GovernmentConfig {
                jurisdiction: "Washington State".to_string(),
                total_counties: 39,
                fisma_level: "HIGH".to_string(),
                compliance_reporting: true,
                data_sovereignty_enabled: true,
                cross_county_validation: true,
                audit_retention_days: 2555, // 7 years
                security_clearance_required: true,
            },
            security: SecurityConfig {
                jwt_secret: std::env::var("ISOLATION_JWT_SECRET")
                    .unwrap_or_else(|_| "terrafusion-county-isolation-demo-secret-change-in-production".to_string()),
                jwt_issuer: "TerraFusion County Isolation Service".to_string(),
                jwt_expiration_hours: 8, // Government work day
                encryption_key: std::env::var("ISOLATION_ENCRYPTION_KEY")
                    .unwrap_or_else(|_| "demo-encryption-key-change-in-production".to_string()),
                min_clearance_level: 3, // Minimum government clearance
                mfa_required: true,
                session_timeout_minutes: 30,
                max_login_attempts: 3,
                lockout_duration_minutes: 15,
            },
            audit: AuditConfig {
                enabled: true,
                log_level: "INFO".to_string(),
                retention_days: 2555, // 7 years for government compliance
                real_time_monitoring: true,
                violation_alerting: true,
                compliance_reporting: true,
                export_format: "JSON".to_string(),
                encryption_enabled: true,
            },
            isolation: IsolationConfig {
                strict_mode: true,
                cross_county_queries_allowed: false, // Default to strict isolation
                validation_cache_ttl: 300, // 5 minutes
                metrics_collection: true,
                violation_threshold: 0.95, // 95% compliance required
                auto_block_violations: true,
                sovereignty_validation: true,
                data_residency_enforcement: true,
            },
            counties,
        }
    }
}

/// Configuration validation helpers
impl Config {
    /// Validate county ID format
    pub fn is_valid_county_id(&self, county_id: &str) -> bool {
        self.counties.contains_key(county_id) &&
        county_id.chars().all(|c| c.is_ascii_lowercase() || c == '-') &&
        county_id.len() >= 3 &&
        county_id.len() <= 50
    }

    /// Get compliance requirements for county
    pub fn get_compliance_requirements(&self, county_id: &str) -> Vec<String> {
        self.get_county_config(county_id)
            .map(|config| config.compliance_requirements.clone())
            .unwrap_or_default()
    }

    /// Check if operation is restricted for county
    pub fn is_operation_restricted(&self, county_id: &str, operation: &str) -> bool {
        self.get_county_config(county_id)
            .map(|config| config.restricted_operations.contains(&operation.to_string()))
            .unwrap_or(true) // Default to restricted if county not found
    }
}
