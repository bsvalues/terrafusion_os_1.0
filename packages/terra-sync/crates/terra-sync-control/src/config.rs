//! YAML-loaded configuration for the terra-sync-control binary.
//!
//! Loaded from the path in `SYNC_CONTROL_CONFIG` (default
//! `config/control-plane.yaml`). The file is expected to exist — we do
//! not synthesize defaults at this layer.

use serde::Deserialize;
use std::net::SocketAddr;
use std::path::{Path, PathBuf};

#[derive(Debug, thiserror::Error)]
pub enum ConfigError {
    #[error("read config file {0}: {1}")]
    Read(PathBuf, #[source] std::io::Error),
    #[error("parse config file {0}: {1}")]
    Parse(PathBuf, #[source] serde_yaml::Error),
}

#[derive(Debug, Deserialize)]
pub struct Config {
    pub grpc: GrpcConfig,
    pub metrics: MetricsConfig,
    pub kafka: KafkaConfig,
    pub manifest_path: PathBuf,
    pub observability: ObservabilityConfig,
}

#[derive(Debug, Deserialize)]
pub struct GrpcConfig {
    pub listen_addr: SocketAddr,
}

#[derive(Debug, Deserialize)]
pub struct MetricsConfig {
    pub listen_addr: SocketAddr,
}

#[derive(Debug, Deserialize)]
pub struct KafkaConfig {
    // Read only by the `kafka`-feature codepath; the default build uses
    // NullAudit and never touches these. Still required in the YAML shape
    // so dev and prod configs stay symmetrical.
    #[allow(dead_code)]
    pub bootstrap_servers: String,
    #[allow(dead_code)]
    pub audit_topic: String,
}

#[derive(Debug, Deserialize)]
pub struct ObservabilityConfig {
    #[serde(default)]
    pub otlp_endpoint: Option<String>,
    #[serde(default = "default_service_name")]
    pub service_name: String,
}

fn default_service_name() -> String {
    "terra-sync-control".to_string()
}

impl Config {
    pub fn from_file(path: &Path) -> Result<Self, ConfigError> {
        let raw =
            std::fs::read_to_string(path).map_err(|e| ConfigError::Read(path.to_path_buf(), e))?;
        let cfg: Self =
            serde_yaml::from_str(&raw).map_err(|e| ConfigError::Parse(path.to_path_buf(), e))?;
        Ok(cfg)
    }
}
