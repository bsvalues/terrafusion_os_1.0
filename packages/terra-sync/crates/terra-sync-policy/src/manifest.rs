use serde::Deserialize;
use std::collections::HashMap;
use std::path::Path;
use thiserror::Error;

#[derive(Debug, Clone, Deserialize)]
pub struct ContractManifest {
    pub contract: String,
    pub version: String,
    pub description: String,
    pub defaults: Defaults,
    pub counties: HashMap<String, CountyPolicy>,
    pub forbidden_actions: Vec<ForbiddenAction>,
    pub audit: AuditPolicy,
}

#[derive(Debug, Clone, Deserialize)]
pub struct Defaults {
    pub read_only: bool,
    pub allow_subscribe_canonical: bool,
    pub require_mtls: bool,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CountyPolicy {
    pub id: String,
    pub name: String,
    pub state: String,
    pub vendor: String,
    pub read_only: bool,
    pub allow_subscribe: Vec<String>,
    #[serde(default)]
    pub forbid_subscribe: Vec<String>,
    #[serde(default)]
    pub active_amendments: Vec<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ForbiddenAction {
    pub action: String,
    pub reason: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct AuditPolicy {
    pub all_actions_logged: bool,
    pub retention_years: u32,
    pub worm_required: bool,
}

#[derive(Debug, Error)]
pub enum ManifestError {
    #[error("failed to read manifest file: {0}")]
    Io(#[from] std::io::Error),
    #[error("failed to parse manifest YAML: {0}")]
    Parse(#[from] serde_yaml::Error),
    #[error("manifest contract name mismatch: expected pacscontract, got {0}")]
    ContractMismatch(String),
}

impl ContractManifest {
    pub fn load_from_path(path: &Path) -> Result<Self, ManifestError> {
        let contents = std::fs::read_to_string(path)?;
        let manifest: ContractManifest = serde_yaml::from_str(&contents)?;
        if manifest.contract != "pacscontract" {
            return Err(ManifestError::ContractMismatch(manifest.contract));
        }
        tracing::info!(
            contract = %manifest.contract,
            version = %manifest.version,
            counties = manifest.counties.len(),
            "policy manifest loaded"
        );
        Ok(manifest)
    }
}
