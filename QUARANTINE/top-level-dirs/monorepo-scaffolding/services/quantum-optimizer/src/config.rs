use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// Quantum Optimizer Configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub host: String,
    pub port: u16,
    pub database_url: String,
    pub quantum: QuantumConfig,
    pub optimization: OptimizationConfig,
    pub performance: PerformanceConfig,
    pub government: GovernmentConfig,
    pub logging: LoggingConfig,
}

/// Quantum computing configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuantumConfig {
    pub processor_count: u32,
    pub algorithm_count: u32,
    pub coherence_time_ms: f64,
    pub error_correction: bool,
    pub annealing_enabled: bool,
    pub max_qubits: u32,
    pub quantum_volume: u32,
    pub fidelity_threshold: f64,
}

/// Optimization configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OptimizationConfig {
    pub max_concurrent_optimizations: u32,
    pub default_iterations: u32,
    pub convergence_threshold: f64,
    pub quantum_enhancement: bool,
    pub ml_assisted_optimization: bool,
    pub performance_target_improvement: f64,
}

/// Performance monitoring configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceConfig {
    pub metrics_collection_interval_ms: u64,
    pub performance_history_days: u32,
    pub alert_thresholds: AlertThresholds,
    pub optimization_triggers: OptimizationTriggers,
}

/// Government compliance configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GovernmentConfig {
    pub fisma_compliance: bool,
    pub audit_logging: bool,
    pub classification_level: String,
    pub county_isolation: bool,
    pub quantum_security: bool,
}

/// Logging configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoggingConfig {
    pub level: String,
    pub format: String,
    pub output: String,
    pub quantum_events: bool,
}

/// Alert thresholds for performance monitoring
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlertThresholds {
    pub cpu_usage: f64,
    pub memory_usage: f64,
    pub response_time_ms: f64,
    pub error_rate: f64,
    pub quantum_decoherence: f64,
}

/// Optimization trigger conditions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OptimizationTriggers {
    pub performance_degradation_threshold: f64,
    pub resource_utilization_threshold: f64,
    pub response_time_threshold_ms: f64,
    pub automatic_quantum_optimization: bool,
}

impl Config {
    /// Load configuration from environment and files
    pub fn load() -> Result<Self> {
        let mut settings = config::Config::builder()
            .add_source(config::Environment::with_prefix("QUANTUM_OPTIMIZER"))
            .set_default("host", "0.0.0.0")?
            .set_default("port", 8002)?
            .set_default("database_url", "postgresql://localhost:5432/terrafusion_quantum")?
            .set_default("quantum.processor_count", 4)?
            .set_default("quantum.algorithm_count", 256)?
            .set_default("quantum.coherence_time_ms", 100.0)?
            .set_default("quantum.error_correction", true)?
            .set_default("quantum.annealing_enabled", true)?
            .set_default("quantum.max_qubits", 1000)?
            .set_default("quantum.quantum_volume", 65536)?
            .set_default("quantum.fidelity_threshold", 0.99)?
            .set_default("optimization.max_concurrent_optimizations", 10)?
            .set_default("optimization.default_iterations", 1000)?
            .set_default("optimization.convergence_threshold", 0.001)?
            .set_default("optimization.quantum_enhancement", true)?
            .set_default("optimization.ml_assisted_optimization", true)?
            .set_default("optimization.performance_target_improvement", 0.20)?
            .set_default("performance.metrics_collection_interval_ms", 1000)?
            .set_default("performance.performance_history_days", 30)?
            .set_default("government.fisma_compliance", true)?
            .set_default("government.audit_logging", true)?
            .set_default("government.classification_level", "FISMA-HIGH")?
            .set_default("government.county_isolation", true)?
            .set_default("government.quantum_security", true)?
            .set_default("logging.level", "info")?
            .set_default("logging.format", "json")?
            .set_default("logging.output", "stdout")?
            .set_default("logging.quantum_events", true)?;

        // Load from config file if it exists
        if let Ok(config_path) = std::env::var("QUANTUM_CONFIG_PATH") {
            let path = PathBuf::from(config_path);
            if path.exists() {
                settings = settings.add_source(config::File::from(path));
            }
        }

        let config: Config = settings.build()?.try_deserialize()?;
        Ok(config)
    }

    /// Validate configuration settings
    pub fn validate(&self) -> Result<()> {
        if self.quantum.processor_count == 0 {
            anyhow::bail!("Quantum processor count must be greater than 0");
        }
        if self.quantum.coherence_time_ms <= 0.0 {
            anyhow::bail!("Quantum coherence time must be positive");
        }
        if self.optimization.convergence_threshold <= 0.0 {
            anyhow::bail!("Convergence threshold must be positive");
        }
        Ok(())
    }
}

impl Default for Config {
    fn default() -> Self {
        Self {
            host: "0.0.0.0".to_string(),
            port: std::env::var("SERVER_PORT")
                .unwrap_or_else(|_| "8085".to_string())
                .parse()
                .unwrap_or(8085),
            database_url: "postgresql://localhost:5432/quantum_optimizer".to_string(),
            quantum: QuantumConfig {
                processor_count: 4,
                algorithm_count: 8,
                coherence_time_ms: 1000.0,
                error_correction: true,
                annealing_enabled: true,
                max_qubits: 1000,
                quantum_volume: 65536,
                fidelity_threshold: 0.95,
            },
            optimization: OptimizationConfig {
                max_concurrent_optimizations: 10,
                default_iterations: 1000,
                convergence_threshold: 1e-6,
                quantum_enhancement: true,
                ml_assisted_optimization: true,
                performance_target_improvement: 0.2,
            },
            performance: PerformanceConfig {
                metrics_collection_interval_ms: 1000,
                performance_history_days: 30,
                alert_thresholds: AlertThresholds {
                    cpu_usage: 80.0,
                    memory_usage: 85.0,
                    response_time_ms: 500.0,
                    error_rate: 0.01,
                    quantum_decoherence: 0.05,
                },
                optimization_triggers: OptimizationTriggers {
                    performance_degradation_threshold: 0.8,
                    resource_utilization_threshold: 0.9,
                    response_time_threshold_ms: 2000.0,
                    automatic_quantum_optimization: true,
                },
            },
            government: GovernmentConfig {
                classification_level: "FISMA-HIGH".to_string(),
                county_isolation: true,
                quantum_security: true,
                fisma_compliance: true,
                audit_logging: true,
            },
            logging: LoggingConfig {
                level: "info".to_string(),
                format: "json".to_string(),
                output: "stdout".to_string(),
                quantum_events: true,
            },
        }
    }
}

/// Load configuration from environment or defaults
pub fn load_config() -> Result<Config, Box<dyn std::error::Error>> {
    Ok(Config::default())
}
