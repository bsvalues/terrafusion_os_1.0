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
    /// Ratified amendments that can grant per-county capabilities beyond the
    /// base `pacscontract.v1` read-only posture. An amendment only unlocks
    /// capability `X` if it is both listed here with `permits` containing `X`
    /// AND referenced by a county's `active_amendments`. Absence of this key
    /// in older manifests is tolerated (defaults to empty).
    #[serde(default)]
    pub amendments: HashMap<String, Amendment>,
}

#[derive(Debug, Clone, Deserialize)]
#[non_exhaustive]
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
#[non_exhaustive]
pub struct ForbiddenAction {
    pub action: String,
    pub reason: String,
}

#[derive(Debug, Clone, Deserialize)]
#[non_exhaustive]
pub struct AuditPolicy {
    pub all_actions_logged: bool,
    pub retention_years: u32,
    pub worm_required: bool,
}

/// A ratified amendment permitting specific actions beyond the base contract.
/// An amendment is only effective when `ratified == true` AND its id appears
/// in the target county's `active_amendments` AND the requested action appears
/// in `permits`.
#[derive(Debug, Clone, Deserialize)]
#[non_exhaustive]
pub struct Amendment {
    pub id: String,
    #[serde(default)]
    pub permits: Vec<String>,
    #[serde(default)]
    pub ratified: bool,
}

#[derive(Debug, Error)]
pub enum ManifestError {
    #[error("failed to read manifest file: {0}")]
    Io(#[from] std::io::Error),
    #[error("failed to parse manifest YAML: {0}")]
    Parse(#[from] serde_yaml::Error),
    #[error("manifest contract name mismatch: expected pacscontract, got {0}")]
    ContractMismatch(String),
    #[error("policy invariant violated: {0}")]
    PolicyInvariant(&'static str),
}

impl ContractManifest {
    pub fn load_from_path(path: &Path) -> Result<Self, ManifestError> {
        let contents = std::fs::read_to_string(path)?;
        let manifest: ContractManifest = serde_yaml::from_str(&contents)?;
        if manifest.contract != "pacscontract" {
            return Err(ManifestError::ContractMismatch(manifest.contract));
        }

        // Cross-field constitutional invariants. These protect FISMA-HIGH
        // posture regardless of how the YAML is edited.
        if !manifest.defaults.require_mtls {
            return Err(ManifestError::PolicyInvariant(
                "defaults.require_mtls must be true",
            ));
        }
        if !manifest.audit.worm_required {
            return Err(ManifestError::PolicyInvariant(
                "audit.worm_required must be true",
            ));
        }
        if manifest.audit.retention_years < 7 {
            return Err(ManifestError::PolicyInvariant(
                "audit.retention_years must be >= 7",
            ));
        }
        if !manifest
            .forbidden_actions
            .iter()
            .any(|f| f.action == "writeback.write")
        {
            return Err(ManifestError::PolicyInvariant(
                "base contract must forbid writeback.write",
            ));
        }

        // Amendments may only grant actions that are globally forbidden —
        // they exist to lift the base-contract ban on an opt-in basis.
        // Permitting an action subject to finer-grained county policy
        // (e.g. `topic.subscribe`, gated by `allow_subscribe`/
        // `forbid_subscribe`) would let a ratified amendment silently
        // bypass that policy, which is not the intended semantics.
        for amendment in manifest.amendments.values() {
            for permit in &amendment.permits {
                if !manifest
                    .forbidden_actions
                    .iter()
                    .any(|f| &f.action == permit)
                {
                    return Err(ManifestError::PolicyInvariant(
                        "amendment permits must only reference globally-forbidden actions",
                    ));
                }
            }
        }

        tracing::info!(
            contract = %manifest.contract,
            version = %manifest.version,
            counties = manifest.counties.len(),
            amendments = manifest.amendments.len(),
            "policy manifest loaded"
        );
        Ok(manifest)
    }
}
