use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Harris PACS Bridge Configuration for Benton County Washington
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    /// Server configuration
    pub host: String,
    pub port: u16,
    pub environment: Environment,

    /// Harris PACS 9.0 specific configuration
    pub harris: HarrisPACSConfig,

    /// County-specific configurations
    pub counties: HashMap<String, CountyConfig>,

    /// Database configuration
    pub database: DatabaseConfig,

    /// Security configuration
    pub security: SecurityConfig,

    /// Performance and sync settings
    pub sync: SyncConfig,

    /// Logging configuration
    pub logging: LoggingConfig,
}

/// Environment type
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum Environment {
    Development,
    Staging,
    Production,
}

/// Harris PACS 9.0 Configuration - Benton County Specific
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HarrisPACSConfig {
    /// Harris PACS version (Benton County uses 9.0)
    pub version: String,

    /// Database connection for Harris PACS 9.0
    pub database_url: String,

    /// Harris PACS API endpoints (if available)
    pub api_base_url: Option<String>,
    pub api_version: Option<String>,

    /// Harris PACS 9.0 specific settings
    pub batch_size: u32,
    pub timeout_seconds: u64,
    pub retry_attempts: u32,
    pub connection_pool_size: u32,

    /// Harris PACS 9.0 authentication
    pub auth: HarrisAuthConfig,

    /// PACS 9.0 specific table and schema mappings
    pub schema_mappings: HarrisSchemaConfig,
}

/// Harris PACS 9.0 Authentication Configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HarrisAuthConfig {
    /// Database authentication
    pub database_username: String,
    pub database_password_env: String, // Environment variable name

    /// API authentication (if applicable)
    pub api_key_env: Option<String>,
    pub client_certificate_path: Option<String>,
}

/// Harris PACS 9.0 Schema Configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HarrisSchemaConfig {
    /// PACS 9.0 property table names
    pub property_table: String,
    pub owner_table: String,
    pub assessment_table: String,
    pub tax_table: String,
    pub sale_table: String,

    /// PACS 9.0 view names (if available)
    pub property_view: Option<String>,
    pub assessment_view: Option<String>,

    /// PACS 9.0 specific field mappings
    pub field_mappings: HashMap<String, String>,
}

/// County-specific configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CountyConfig {
    /// County identification
    pub county_id: String,
    pub county_name: String,
    pub state: String,
    pub fips_code: String,

    /// Harris PACS 9.0 jurisdiction code
    pub jurisdiction_code: String,

    /// County-specific sync settings
    pub sync_enabled: bool,
    pub sync_interval_minutes: u32,
    pub batch_size: u32,

    /// Data validation rules
    pub validation_rules: ValidationConfig,

    /// County contact information
    pub contact_info: CountyContactInfo,
}

/// Validation configuration for county data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationConfig {
    /// Property validation rules
    pub require_owner_name: bool,
    pub require_property_address: bool,
    pub min_assessed_value: Option<i64>,
    pub max_assessed_value: Option<i64>,

    /// Tax year validation
    pub valid_tax_years: Vec<i32>,

    /// Parcel ID validation
    pub parcel_id_pattern: Option<String>,
    pub parcel_id_length_min: Option<usize>,
    pub parcel_id_length_max: Option<usize>,
}

/// County contact information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CountyContactInfo {
    pub assessor_name: Option<String>,
    pub assessor_email: Option<String>,
    pub it_contact_name: Option<String>,
    pub it_contact_email: Option<String>,
    pub phone: Option<String>,
}

/// Database configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatabaseConfig {
    /// TerraFusion database URL
    pub url: String,
    pub max_connections: u32,
    pub min_connections: u32,
    pub connection_timeout_seconds: u64,
    pub idle_timeout_seconds: u64,

    /// Database migration settings
    pub auto_migrate: bool,
    pub migration_path: String,
}

/// Security configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityConfig {
    /// JWT configuration
    pub jwt_secret_env: String,
    pub jwt_expiration_hours: u32,

    /// API rate limiting
    pub rate_limit_requests_per_minute: u32,
    pub rate_limit_burst: u32,

    /// HTTPS configuration
    pub require_https: bool,
    pub tls_cert_path: Option<String>,
    pub tls_key_path: Option<String>,

    /// County data encryption
    pub encrypt_county_data: bool,
    pub encryption_key_env: Option<String>,
}

/// Synchronization configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncConfig {
    /// Default sync settings
    pub default_sync_interval_minutes: u32,
    pub max_concurrent_syncs: u32,
    pub sync_retry_attempts: u32,
    pub sync_timeout_minutes: u32,

    /// Performance settings
    pub bulk_insert_batch_size: u32,
    pub property_fetch_batch_size: u32,

    /// Error handling
    pub max_errors_per_sync: u32,
    pub error_notification_threshold: u32,

    /// Real-time sync settings
    pub enable_real_time_sync: bool,
    pub real_time_sync_interval_seconds: u32,
}

/// Logging configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoggingConfig {
    /// Log levels
    pub level: String,
    pub harris_pacs_log_level: String,

    /// Log output
    pub log_to_file: bool,
    pub log_file_path: Option<String>,
    pub log_rotation_size_mb: Option<u32>,

    /// Audit logging
    pub enable_audit_log: bool,
    pub audit_log_path: Option<String>,

    /// Performance logging
    pub log_slow_queries_ms: Option<u64>,
    pub log_sync_performance: bool,
}

impl Config {
    /// Load configuration from environment and config files
    pub fn load() -> Result<Self> {
        // For development, bypass environment loading and use defaults
        // This avoids complex HashMap serialization issues with the config crate
        if std::env::var("HARRIS_PACS_BRIDGE_ENVIRONMENT").unwrap_or_default() != "production" {
            tracing::info!("🔧 Using development defaults for Harris PACS Bridge configuration");
            return Ok(Self::development_defaults());
        }

        // Production environment loading
        Self::load_from_environment()
    }    /// Load configuration from environment variables
    fn load_from_environment() -> Result<Self> {
        let mut settings = config::Config::builder()
            .add_source(config::Environment::with_prefix("HARRIS_PACS_BRIDGE"))
            .set_default("host", "0.0.0.0")?
            .set_default("port", 8002)?
            .set_default("environment", "development")?

            // Harris PACS 9.0 defaults for Benton County
            .set_default("harris.version", "9.0")?
            .set_default("harris.batch_size", 100)?
            .set_default("harris.timeout_seconds", 30)?
            .set_default("harris.retry_attempts", 3)?
            .set_default("harris.connection_pool_size", 10)?
            .set_default("harris.auth.database_username", "terrafusion_bridge")?
            .set_default("harris.auth.database_password_env", "HARRIS_DB_PASSWORD")?

            // Harris PACS 9.0 schema defaults
            .set_default("harris.schema_mappings.property_table", "properties")?
            .set_default("harris.schema_mappings.owner_table", "owners")?
            .set_default("harris.schema_mappings.assessment_table", "assessments")?
            .set_default("harris.schema_mappings.tax_table", "taxes")?
            .set_default("harris.schema_mappings.sale_table", "sales")?

            // Database defaults
            .set_default("database.max_connections", 20)?
            .set_default("database.min_connections", 5)?
            .set_default("database.connection_timeout_seconds", 10)?
            .set_default("database.idle_timeout_seconds", 300)?
            .set_default("database.auto_migrate", false)?
            .set_default("database.migration_path", "./migrations")?

            // Security defaults
            .set_default("security.jwt_secret_env", "JWT_SECRET")?
            .set_default("security.jwt_expiration_hours", 24)?
            .set_default("security.rate_limit_requests_per_minute", 100)?
            .set_default("security.rate_limit_burst", 20)?
            .set_default("security.require_https", false)?
            .set_default("security.encrypt_county_data", true)?

            // Sync defaults
            .set_default("sync.default_sync_interval_minutes", 15)?
            .set_default("sync.max_concurrent_syncs", 3)?
            .set_default("sync.sync_retry_attempts", 3)?
            .set_default("sync.sync_timeout_minutes", 30)?
            .set_default("sync.bulk_insert_batch_size", 500)?
            .set_default("sync.property_fetch_batch_size", 100)?
            .set_default("sync.max_errors_per_sync", 10)?
            .set_default("sync.error_notification_threshold", 5)?
            .set_default("sync.enable_real_time_sync", false)?
            .set_default("sync.real_time_sync_interval_seconds", 60)?

            // Logging defaults
            .set_default("logging.level", "info")?
            .set_default("logging.harris_pacs_log_level", "debug")?
            .set_default("logging.log_to_file", false)?
            .set_default("logging.enable_audit_log", true)?
            .set_default("logging.log_sync_performance", true)?;

        // Add Benton County default configuration
        settings = settings
            .set_default("counties.benton.county_id", "benton")?
            .set_default("counties.benton.county_name", "Benton County")?
            .set_default("counties.benton.state", "Washington")?
            .set_default("counties.benton.fips_code", "53005")?
            .set_default("counties.benton.jurisdiction_code", "BENTON_WA")?
            .set_default("counties.benton.sync_enabled", true)?
            .set_default("counties.benton.sync_interval_minutes", 15)?
            .set_default("counties.benton.batch_size", 100)?
            .set_default("counties.benton.validation_rules.require_owner_name", true)?
            .set_default("counties.benton.validation_rules.require_property_address", true)?
            .set_default("counties.benton.validation_rules.valid_tax_years", vec![2020, 2021, 2022, 2023, 2024, 2025])?
            .set_default("counties.benton.contact_info.assessor_name", "Benton County Assessor")?;

        let config: Config = settings.build()?.try_deserialize()?;

        // Validate configuration
        config.validate()?;

        Ok(config)
    }

    /// Validate configuration values
    pub fn validate(&self) -> Result<()> {
        // Validate Harris PACS version
        if self.harris.version != "9.0" {
            tracing::warn!("Harris PACS version {} may not be supported. Benton County uses 9.0", self.harris.version);
        }

        // Validate database configuration
        if self.database.max_connections < self.database.min_connections {
            anyhow::bail!("Database max_connections must be >= min_connections");
        }

        // Validate sync configuration
        if self.sync.max_concurrent_syncs == 0 {
            anyhow::bail!("max_concurrent_syncs must be > 0");
        }

        // Validate county configurations
        for (county_id, county_config) in &self.counties {
            if county_config.county_id != *county_id {
                anyhow::bail!("County ID mismatch: {} != {}", county_config.county_id, county_id);
            }

            if county_config.sync_interval_minutes == 0 {
                anyhow::bail!("County {} sync_interval_minutes must be > 0", county_id);
            }
        }

        // Validate Benton County specific configuration
        if !self.counties.contains_key("benton") {
            anyhow::bail!("Benton County configuration is required");
        }

        tracing::info!("✅ Configuration validation successful");
        tracing::info!("📊 Harris PACS version: {}", self.harris.version);
        tracing::info!("🏛️ Counties configured: {}", self.counties.len());

        Ok(())
    }

    /// Get county configuration by county ID
    pub fn get_county_config(&self, county_id: &str) -> Option<&CountyConfig> {
        self.counties.get(county_id)
    }

    /// Get Benton County configuration
    pub fn get_benton_county_config(&self) -> Option<&CountyConfig> {
        self.get_county_config("benton")
    }
}

impl Default for Config {
    fn default() -> Self {
        // Load from environment or return development defaults
        Self::load().unwrap_or_else(|_| Self::development_defaults())
    }
}

impl Config {
    /// Development environment defaults
    pub fn development_defaults() -> Self {
        let mut counties = HashMap::new();

        // Benton County development configuration
        counties.insert("benton".to_string(), CountyConfig {
            county_id: "benton".to_string(),
            county_name: "Benton County".to_string(),
            state: "Washington".to_string(),
            fips_code: "53005".to_string(),
            jurisdiction_code: "BENTON_WA".to_string(),
            sync_enabled: true,
            sync_interval_minutes: 15,
            batch_size: 100,
            validation_rules: ValidationConfig {
                require_owner_name: true,
                require_property_address: true,
                min_assessed_value: Some(1000),
                max_assessed_value: Some(50000000),
                valid_tax_years: vec![2020, 2021, 2022, 2023, 2024, 2025],
                parcel_id_pattern: None,
                parcel_id_length_min: Some(5),
                parcel_id_length_max: Some(20),
            },
            contact_info: CountyContactInfo {
                assessor_name: Some("Benton County Assessor".to_string()),
                assessor_email: Some("assessor@co.benton.wa.us".to_string()),
                it_contact_name: Some("Benton County IT".to_string()),
                it_contact_email: Some("it@co.benton.wa.us".to_string()),
                phone: Some("(509) 736-3085".to_string()),
            },
        });

        let mut field_mappings = HashMap::new();
        field_mappings.insert("parcel_number".to_string(), "parcel_id".to_string());
        field_mappings.insert("owner".to_string(), "owner_name".to_string());
        field_mappings.insert("situs_address".to_string(), "property_address".to_string());
        field_mappings.insert("assessed_val".to_string(), "assessed_value".to_string());
        field_mappings.insert("market_val".to_string(), "market_value".to_string());

        Self {
            host: "0.0.0.0".to_string(),
            port: 8002,
            environment: Environment::Development,
            harris: HarrisPACSConfig {
                version: "9.0".to_string(),
                database_url: "Server=localhost;Database=HarrisPACS;Trusted_Connection=true;".to_string(),
                api_base_url: None,
                api_version: None,
                batch_size: 100,
                timeout_seconds: 30,
                retry_attempts: 3,
                connection_pool_size: 10,
                auth: HarrisAuthConfig {
                    database_username: "terrafusion_bridge".to_string(),
                    database_password_env: "HARRIS_DB_PASSWORD".to_string(),
                    api_key_env: None,
                    client_certificate_path: None,
                },
                schema_mappings: HarrisSchemaConfig {
                    property_table: "properties".to_string(),
                    owner_table: "owners".to_string(),
                    assessment_table: "assessments".to_string(),
                    tax_table: "taxes".to_string(),
                    sale_table: "sales".to_string(),
                    property_view: None,
                    assessment_view: None,
                    field_mappings,
                },
            },
            counties,
            database: DatabaseConfig {
                url: "postgresql://postgres:password@localhost:5432/terrafusion_harris_bridge".to_string(),
                max_connections: 20,
                min_connections: 5,
                connection_timeout_seconds: 10,
                idle_timeout_seconds: 300,
                auto_migrate: true,
                migration_path: "./migrations".to_string(),
            },
            security: SecurityConfig {
                jwt_secret_env: "JWT_SECRET".to_string(),
                jwt_expiration_hours: 24,
                rate_limit_requests_per_minute: 100,
                rate_limit_burst: 20,
                require_https: false,
                tls_cert_path: None,
                tls_key_path: None,
                encrypt_county_data: true,
                encryption_key_env: Some("COUNTY_DATA_ENCRYPTION_KEY".to_string()),
            },
            sync: SyncConfig {
                default_sync_interval_minutes: 15,
                max_concurrent_syncs: 3,
                sync_retry_attempts: 3,
                sync_timeout_minutes: 30,
                bulk_insert_batch_size: 500,
                property_fetch_batch_size: 100,
                max_errors_per_sync: 10,
                error_notification_threshold: 5,
                enable_real_time_sync: false,
                real_time_sync_interval_seconds: 60,
            },
            logging: LoggingConfig {
                level: "info".to_string(),
                harris_pacs_log_level: "debug".to_string(),
                log_to_file: false,
                log_file_path: None,
                log_rotation_size_mb: None,
                enable_audit_log: true,
                audit_log_path: Some("./logs/harris_bridge_audit.log".to_string()),
                log_slow_queries_ms: Some(1000),
                log_sync_performance: true,
            },
        }
    }
}

/// Get environment variable or default value
pub fn get_env_or_default(key: &str, default: &str) -> String {
    std::env::var(key).unwrap_or_else(|_| default.to_string())
}

/// Get required environment variable
pub fn get_required_env(key: &str) -> Result<String> {
    std::env::var(key)
        .map_err(|_| anyhow::anyhow!("Required environment variable {} not set", key))
}
