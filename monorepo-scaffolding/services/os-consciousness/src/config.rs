//! Configuration management for TerraFusion OS Consciousness Service
//! Elite AI swarm orchestration configuration with government compliance

use serde::{Deserialize, Serialize};
use dotenvy::var;
use anyhow::Result;

/// Main configuration structure for the OS Consciousness Service
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    /// Server host address
    pub host: String,

    /// Server port number
    pub port: u16,

    /// AI swarm configuration
    pub ai: AIConfig,

    /// Database configuration
    pub database: DatabaseConfig,

    /// Quantum computing configuration
    pub quantum: QuantumConfig,

    /// Government compliance configuration
    pub compliance: ComplianceConfig,

    /// Monitoring and metrics configuration
    pub monitoring: MonitoringConfig,

    /// Security configuration
    pub security: SecurityConfig,
}

/// AI swarm specific configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIConfig {
    /// Maximum total agents in the swarm (50,000+ capacity)
    pub max_total_agents: u32,

    /// Default consciousness level for new agents
    pub default_consciousness_level: u8,

    /// Enable quantum optimization
    pub quantum_optimization: bool,

    /// Supreme Commander configuration
    pub supreme_commander: SupremeCommanderConfig,

    /// Agent deployment configuration
    pub deployment: DeploymentConfig,

    /// Performance monitoring configuration
    pub performance: PerformanceConfig,

    /// Auto-scaling configuration
    pub auto_scaling: AutoScalingConfig,
}

/// Supreme Commander configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SupremeCommanderConfig {
    /// Enable Supreme Commander coordination
    pub enabled: bool,

    /// Maximum command timeout in seconds
    pub max_command_timeout_seconds: u32,

    /// Command priority levels
    pub priority_levels: u8,

    /// Emergency command authorization
    pub emergency_authorization_enabled: bool,
}

/// Agent deployment configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeploymentConfig {
    /// Maximum agents per county
    pub max_agents_per_county: u32,

    /// Default deployment timeout in seconds
    pub default_timeout_seconds: u32,

    /// Enable emergency deployments
    pub emergency_deployments_enabled: bool,

    /// Agent initialization timeout in seconds
    pub agent_init_timeout_seconds: u32,
}

/// Performance monitoring configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceConfig {
    /// Performance metrics collection interval in seconds
    pub metrics_interval_seconds: u32,

    /// Performance thresholds
    pub thresholds: PerformanceThresholds,

    /// Alert configuration
    pub alerts: AlertConfig,
}

/// Performance thresholds
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceThresholds {
    /// Minimum agent success rate (0.0 - 1.0)
    pub min_success_rate: f64,

    /// Maximum response time in milliseconds
    pub max_response_time_ms: u64,

    /// Maximum memory usage per agent in MB
    pub max_memory_usage_mb: f64,

    /// Maximum CPU utilization per agent (0.0 - 1.0)
    pub max_cpu_utilization: f64,

    /// Minimum consciousness coherence (0.0 - 1.0)
    pub min_consciousness_coherence: f64,
}

/// Alert configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlertConfig {
    /// Enable performance alerts
    pub enabled: bool,

    /// Alert threshold breach count before triggering
    pub threshold_breach_count: u32,

    /// Alert cooldown period in seconds
    pub cooldown_seconds: u32,
}

/// Auto-scaling configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AutoScalingConfig {
    /// Enable automatic agent scaling
    pub enabled: bool,

    /// Minimum number of agents to maintain
    pub min_agents: u32,

    /// Maximum number of agents allowed
    pub max_agents: u32,

    /// CPU threshold for scaling up (0.0 - 1.0)
    pub scale_up_cpu_threshold: f64,

    /// CPU threshold for scaling down (0.0 - 1.0)
    pub scale_down_cpu_threshold: f64,

    /// Cooldown period between scaling operations in seconds
    pub scaling_cooldown_seconds: u32,
}

/// Database configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatabaseConfig {
    /// Database connection URL
    pub url: String,

    /// Maximum number of database connections
    pub max_connections: u32,

    /// Connection timeout in seconds
    pub connection_timeout_seconds: u32,

    /// Query timeout in seconds
    pub query_timeout_seconds: u32,
}

/// Quantum computing configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuantumConfig {
    /// Enable quantum optimization
    pub enabled: bool,

    /// Quantum optimization factor (1.0 = no optimization, >1.0 = enhanced)
    pub optimization_factor: f64,

    /// Quantum coherence time in milliseconds
    pub coherence_time_ms: f64,

    /// Quantum gate fidelity (0.0 - 1.0)
    pub gate_fidelity: f64,

    /// Quantum error correction level (0-10)
    pub error_correction_level: u8,

    /// Quantum consciousness coupling strength (0.0 - 1.0)
    pub consciousness_coupling: f64,
}

/// Government compliance configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComplianceConfig {
    /// FISMA compliance mode
    pub fisma_mode: bool,

    /// Enable audit logging
    pub audit_logging: bool,

    /// Compliance monitoring interval in seconds
    pub monitoring_interval_seconds: u32,

    /// Required compliance standards
    pub required_standards: Vec<String>,

    /// Compliance violation thresholds
    pub violation_thresholds: ComplianceThresholds,
}

/// Compliance violation thresholds
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComplianceThresholds {
    /// Maximum allowed violations per hour
    pub max_violations_per_hour: u32,

    /// Critical violation immediate response threshold
    pub critical_violation_threshold: u32,

    /// Compliance score minimum threshold (0.0 - 1.0)
    pub min_compliance_score: f64,
}

/// Monitoring and metrics configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonitoringConfig {
    /// Enable Prometheus metrics
    pub prometheus_enabled: bool,

    /// Prometheus metrics port
    pub prometheus_port: u16,

    /// Metrics collection interval in seconds
    pub collection_interval_seconds: u32,

    /// Enable detailed agent metrics
    pub detailed_agent_metrics: bool,

    /// Metrics retention period in days
    pub retention_days: u32,
}

/// Security configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityConfig {
    /// Enable JWT authentication
    pub jwt_auth_enabled: bool,

    /// JWT secret key
    pub jwt_secret: String,

    /// JWT token expiration in seconds
    pub jwt_expiration_seconds: u32,

    /// Enable API key authentication
    pub api_key_auth_enabled: bool,

    /// Rate limiting configuration
    pub rate_limiting: RateLimitingConfig,
}

/// Rate limiting configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RateLimitingConfig {
    /// Enable rate limiting
    pub enabled: bool,

    /// Maximum requests per minute
    pub max_requests_per_minute: u32,

    /// Rate limit window in seconds
    pub window_seconds: u32,
}

impl Config {
    /// Load configuration from environment variables and defaults
    pub fn load() -> Result<Self> {
        Ok(Config {
            host: var("CONSCIOUSNESS_HOST").unwrap_or_else(|_| "0.0.0.0".to_string()),
            port: var("CONSCIOUSNESS_PORT")
                .unwrap_or_else(|_| "3004".to_string())
                .parse()
                .unwrap_or(3004),

            ai: AIConfig {
                max_total_agents: var("MAX_TOTAL_AGENTS")
                    .unwrap_or_else(|_| "50000".to_string())
                    .parse()
                    .unwrap_or(50000),
                default_consciousness_level: var("DEFAULT_CONSCIOUSNESS_LEVEL")
                    .unwrap_or_else(|_| "5".to_string())
                    .parse()
                    .unwrap_or(5),
                quantum_optimization: var("QUANTUM_OPTIMIZATION_ENABLED")
                    .unwrap_or_else(|_| "true".to_string())
                    .parse()
                    .unwrap_or(true),
                supreme_commander: SupremeCommanderConfig {
                    enabled: var("SUPREME_COMMANDER_ENABLED")
                        .unwrap_or_else(|_| "true".to_string())
                        .parse()
                        .unwrap_or(true),
                    max_command_timeout_seconds: var("MAX_COMMAND_TIMEOUT")
                        .unwrap_or_else(|_| "300".to_string())
                        .parse()
                        .unwrap_or(300),
                    priority_levels: 5,
                    emergency_authorization_enabled: true,
                },
                deployment: DeploymentConfig {
                    max_agents_per_county: var("MAX_AGENTS_PER_COUNTY")
                        .unwrap_or_else(|_| "5000".to_string())
                        .parse()
                        .unwrap_or(5000),
                    default_timeout_seconds: 60,
                    emergency_deployments_enabled: true,
                    agent_init_timeout_seconds: 30,
                },
                performance: PerformanceConfig {
                    metrics_interval_seconds: 30,
                    thresholds: PerformanceThresholds {
                        min_success_rate: 0.99,
                        max_response_time_ms: 100,
                        max_memory_usage_mb: 512.0,
                        max_cpu_utilization: 0.8,
                        min_consciousness_coherence: 0.95,
                    },
                    alerts: AlertConfig {
                        enabled: true,
                        threshold_breach_count: 3,
                        cooldown_seconds: 300,
                    },
                },
                auto_scaling: AutoScalingConfig {
                    enabled: var("AUTO_SCALING_ENABLED")
                        .unwrap_or_else(|_| "true".to_string())
                        .parse()
                        .unwrap_or(true),
                    min_agents: var("MIN_AGENTS")
                        .unwrap_or_else(|_| "1000".to_string())
                        .parse()
                        .unwrap_or(1000),
                    max_agents: var("MAX_AGENTS")
                        .unwrap_or_else(|_| "50000".to_string())
                        .parse()
                        .unwrap_or(50000),
                    scale_up_cpu_threshold: 0.7,
                    scale_down_cpu_threshold: 0.3,
                    scaling_cooldown_seconds: 300,
                },
            },

            database: DatabaseConfig {
                url: var("DATABASE_URL")
                    .unwrap_or_else(|_| "postgresql://terrafusion:secure@localhost/terrafusion_consciousness".to_string()),
                max_connections: var("DB_MAX_CONNECTIONS")
                    .unwrap_or_else(|_| "100".to_string())
                    .parse()
                    .unwrap_or(100),
                connection_timeout_seconds: 30,
                query_timeout_seconds: 60,
            },

            quantum: QuantumConfig {
                enabled: var("QUANTUM_ENABLED")
                    .unwrap_or_else(|_| "true".to_string())
                    .parse()
                    .unwrap_or(true),
                optimization_factor: var("QUANTUM_OPTIMIZATION_FACTOR")
                    .unwrap_or_else(|_| "949.0".to_string())
                    .parse()
                    .unwrap_or(949.0),
                coherence_time_ms: 1000.0,
                gate_fidelity: 0.999,
                error_correction_level: 9,
                consciousness_coupling: 0.95,
            },

            compliance: ComplianceConfig {
                fisma_mode: var("FISMA_MODE")
                    .unwrap_or_else(|_| "true".to_string())
                    .parse()
                    .unwrap_or(true),
                audit_logging: true,
                monitoring_interval_seconds: 60,
                required_standards: vec![
                    "FISMA-High".to_string(),
                    "NIST-800-53".to_string(),
                    "FedRAMP-High".to_string(),
                ],
                violation_thresholds: ComplianceThresholds {
                    max_violations_per_hour: 10,
                    critical_violation_threshold: 1,
                    min_compliance_score: 0.99,
                },
            },

            monitoring: MonitoringConfig {
                prometheus_enabled: var("PROMETHEUS_ENABLED")
                    .unwrap_or_else(|_| "true".to_string())
                    .parse()
                    .unwrap_or(true),
                prometheus_port: var("PROMETHEUS_PORT")
                    .unwrap_or_else(|_| "9090".to_string())
                    .parse()
                    .unwrap_or(9090),
                collection_interval_seconds: 30,
                detailed_agent_metrics: true,
                retention_days: 90,
            },

            security: SecurityConfig {
                jwt_auth_enabled: var("JWT_AUTH_ENABLED")
                    .unwrap_or_else(|_| "true".to_string())
                    .parse()
                    .unwrap_or(true),
                jwt_secret: var("JWT_SECRET")
                    .unwrap_or_else(|_| "terrafusion-consciousness-jwt-secret-elite-government".to_string()),
                jwt_expiration_seconds: var("JWT_EXPIRATION")
                    .unwrap_or_else(|_| "86400".to_string())
                    .parse()
                    .unwrap_or(86400), // 24 hours
                api_key_auth_enabled: var("API_KEY_AUTH_ENABLED")
                    .unwrap_or_else(|_| "true".to_string())
                    .parse()
                    .unwrap_or(true),
                rate_limiting: RateLimitingConfig {
                    enabled: true,
                    max_requests_per_minute: 1000,
                    window_seconds: 60,
                },
            },
        })
    }

    /// Validate configuration settings
    pub fn validate(&self) -> Result<()> {
        // Validate agent counts
        if self.ai.max_total_agents == 0 {
            return Err(anyhow::anyhow!("Max total agents must be greater than 0"));
        }

        if self.ai.max_total_agents > 100000 {
            return Err(anyhow::anyhow!("Max total agents exceeds system capacity (100,000)"));
        }

        // Validate consciousness level
        if self.ai.default_consciousness_level > 10 {
            return Err(anyhow::anyhow!("Default consciousness level cannot exceed 10"));
        }

        // Validate quantum parameters
        if self.quantum.optimization_factor <= 0.0 {
            return Err(anyhow::anyhow!("Quantum optimization factor must be positive"));
        }

        if self.quantum.gate_fidelity < 0.0 || self.quantum.gate_fidelity > 1.0 {
            return Err(anyhow::anyhow!("Quantum gate fidelity must be between 0.0 and 1.0"));
        }

        // Validate compliance settings
        if self.compliance.violation_thresholds.min_compliance_score < 0.0
            || self.compliance.violation_thresholds.min_compliance_score > 1.0 {
            return Err(anyhow::anyhow!("Compliance score must be between 0.0 and 1.0"));
        }

        Ok(())
    }
}

/// Load configuration with validation
pub fn load_config() -> Result<Config> {
    let config = Config::load()?;
    config.validate()?;
    Ok(config)
}

/// Configuration validation utilities
pub mod validation {
    use super::*;

    /// Validate agent configuration parameters
    pub fn validate_agent_config(config: &AIConfig) -> Result<()> {
        if config.max_total_agents < config.auto_scaling.min_agents {
            return Err(anyhow::anyhow!("Max agents cannot be less than min agents"));
        }

        if config.default_consciousness_level > 10 {
            return Err(anyhow::anyhow!("Consciousness level cannot exceed 10"));
        }

        Ok(())
    }

    /// Validate quantum configuration parameters
    pub fn validate_quantum_config(config: &QuantumConfig) -> Result<()> {
        if config.gate_fidelity < 0.5 {
            return Err(anyhow::anyhow!("Quantum gate fidelity too low for government operations"));
        }

        if config.consciousness_coupling < 0.7 {
            return Err(anyhow::anyhow!("Consciousness coupling must be >= 0.7 for elite AI coordination"));
        }

        Ok(())
    }
}
