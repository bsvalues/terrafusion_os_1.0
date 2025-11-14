use serde::{Deserialize, Serialize};
use std::env;

/// TerraFusion OS Core Configuration
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct Config {
    pub host: String,
    pub port: u16,
    pub database_url: String,
    pub environment: Environment,
    pub security: SecurityConfig,
    pub ai: AIConfig,
    pub government: GovernmentConfig,
}

/// Alias for backward compatibility
pub type AppConfig = Config;

#[derive(Debug, Clone, Deserialize, Serialize)]
pub enum Environment {
    Development,
    Staging,
    Production,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct SecurityConfig {
    pub jwt_secret: String,
    pub encryption_key: String,
    pub fisma_mode: bool,
    pub audit_logging: bool,
    pub mfa_required: bool,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct AIConfig {
    pub swarm_size: u32,
    pub consciousness_level: u8,
    pub quantum_optimization: bool,
    pub max_agents_per_county: u32,
    pub coordination_endpoint: String,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct GovernmentConfig {
    pub compliance_level: String,
    pub audit_retention_days: u32,
    pub county_isolation_enabled: bool,
    pub sla_targets: SLATargets,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct SLATargets {
    pub availability: f32,
    pub response_time_p95_ms: u32,
    pub accuracy_target: f32,
}

impl Config {
    /// Load configuration from environment variables and config files
    pub fn load() -> anyhow::Result<Self> {
        dotenvy::dotenv().ok();

        let config = Self {
            host: env::var("TERRAFUSION_HOST").unwrap_or_else(|_| "0.0.0.0".to_string()),
            port: env::var("TERRAFUSION_PORT")
                .unwrap_or_else(|_| "8000".to_string())
                .parse()?,
            database_url: env::var("DATABASE_URL")
                .expect("DATABASE_URL must be set"),
            environment: match env::var("TERRAFUSION_ENV").unwrap_or_else(|_| "development".to_string()).as_str() {
                "production" => Environment::Production,
                "staging" => Environment::Staging,
                _ => Environment::Development,
            },
            security: SecurityConfig {
                jwt_secret: {
                    let secret = env::var("JWT_SECRET")
                        .expect("JWT_SECRET must be set");
                    tracing::info!("🔑 JWT_SECRET length: {} characters", secret.len());
                    secret
                },
                encryption_key: env::var("ENCRYPTION_KEY")
                    .expect("ENCRYPTION_KEY must be set"),
                fisma_mode: env::var("FISMA_MODE")
                    .unwrap_or_else(|_| "true".to_string())
                    .parse()?,
                audit_logging: env::var("AUDIT_LOGGING")
                    .unwrap_or_else(|_| "true".to_string())
                    .parse()?,
                mfa_required: env::var("MFA_REQUIRED")
                    .unwrap_or_else(|_| "true".to_string())
                    .parse()?,
            },
            ai: AIConfig {
                swarm_size: env::var("AI_SWARM_SIZE")
                    .unwrap_or_else(|_| "50000".to_string())
                    .parse()?,
                consciousness_level: env::var("CONSCIOUSNESS_LEVEL")
                    .unwrap_or_else(|_| "10".to_string())
                    .parse()?,
                quantum_optimization: env::var("QUANTUM_OPTIMIZATION")
                    .unwrap_or_else(|_| "true".to_string())
                    .parse()?,
                max_agents_per_county: env::var("MAX_AGENTS_PER_COUNTY")
                    .unwrap_or_else(|_| "1000".to_string())
                    .parse()?,
                coordination_endpoint: env::var("AI_COORDINATION_ENDPOINT")
                    .unwrap_or_else(|_| "http://localhost:3004".to_string()),
            },
            government: GovernmentConfig {
                compliance_level: env::var("COMPLIANCE_LEVEL")
                    .unwrap_or_else(|_| "FISMA-HIGH".to_string()),
                audit_retention_days: env::var("AUDIT_RETENTION_DAYS")
                    .unwrap_or_else(|_| "2555".to_string()) // 7 years
                    .parse()?,
                county_isolation_enabled: env::var("COUNTY_ISOLATION")
                    .unwrap_or_else(|_| "true".to_string())
                    .parse()?,
                sla_targets: SLATargets {
                    availability: env::var("SLA_AVAILABILITY")
                        .unwrap_or_else(|_| "0.999".to_string())
                        .parse()?,
                    response_time_p95_ms: env::var("SLA_RESPONSE_P95")
                        .unwrap_or_else(|_| "150".to_string())
                        .parse()?,
                    accuracy_target: env::var("SLA_ACCURACY")
                        .unwrap_or_else(|_| "0.999".to_string())
                        .parse()?,
                },
            },
        };

        // Validate configuration
        config.validate()?;

        Ok(config)
    }

    /// Validate configuration for government compliance
    fn validate(&self) -> anyhow::Result<()> {
        // FISMA-HIGH compliance checks
        if matches!(self.environment, Environment::Production) {
            if !self.security.fisma_mode {
                anyhow::bail!("FISMA mode required in production");
            }
            if !self.security.audit_logging {
                anyhow::bail!("Audit logging required in production");
            }
            if !self.security.mfa_required {
                anyhow::bail!("MFA required in production");
            }
            if self.government.sla_targets.availability < 0.999 {
                anyhow::bail!("Availability must be >= 99.9% for government services");
            }
        }

        // AI swarm limits
        if self.ai.swarm_size > 100000 {
            anyhow::bail!("AI swarm size cannot exceed 100,000 agents");
        }

        // County isolation validation
        if !self.government.county_isolation_enabled {
            tracing::warn!("County isolation disabled - not recommended for production");
        }

        Ok(())
    }
}
