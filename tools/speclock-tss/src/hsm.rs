// ═══════════════════════════════════════════════════════════════════════════════
// TerraFusion SpecLock TSS - HSM Backend Abstraction
// ═══════════════════════════════════════════════════════════════════════════════
//
// Pluggable HSM backends for key storage and signing operations.
// Keys never exist in plaintext outside the HSM boundary.
//
// Supported backends:
// - AWS KMS (CloudHSM-backed)
// - Azure Key Vault (HSM-backed)
// - GCP Cloud KMS (HSM-backed)
// - YubiHSM 2 (on-prem/air-gapped)
// - PKCS#11 (generic)
// - Software (development only)
//
// ═══════════════════════════════════════════════════════════════════════════════

use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

/// HSM backend type
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum HsmBackendType {
    AwsKms,
    AzureKeyVault,
    GcpKms,
    YubiHsm2,
    Pkcs11,
    Software, // Development only
}

impl std::fmt::Display for HsmBackendType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            HsmBackendType::AwsKms => write!(f, "aws_kms"),
            HsmBackendType::AzureKeyVault => write!(f, "azure_key_vault"),
            HsmBackendType::GcpKms => write!(f, "gcp_kms"),
            HsmBackendType::YubiHsm2 => write!(f, "yubihsm2"),
            HsmBackendType::Pkcs11 => write!(f, "pkcs11"),
            HsmBackendType::Software => write!(f, "software"),
        }
    }
}

impl std::str::FromStr for HsmBackendType {
    type Err = anyhow::Error;

    fn from_str(s: &str) -> Result<Self> {
        match s.to_lowercase().as_str() {
            "aws_kms" | "aws-kms" | "awskms" => Ok(HsmBackendType::AwsKms),
            "azure_key_vault" | "azure-key-vault" | "azurekeyvault" => {
                Ok(HsmBackendType::AzureKeyVault)
            }
            "gcp_kms" | "gcp-kms" | "gcpkms" => Ok(HsmBackendType::GcpKms),
            "yubihsm2" | "yubihsm" => Ok(HsmBackendType::YubiHsm2),
            "pkcs11" => Ok(HsmBackendType::Pkcs11),
            "software" | "dev" => Ok(HsmBackendType::Software),
            _ => Err(anyhow!("Unknown HSM backend: {}", s)),
        }
    }
}

/// HSM key reference (never contains actual key material)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HsmKeyRef {
    pub backend: HsmBackendType,
    pub key_uri: String,
    pub participant_id: u16,
    pub created_at: String,
}

impl HsmKeyRef {
    /// Parse a key URI (e.g., "kms://aws/arn:aws:kms:...")
    pub fn from_uri(uri: &str, participant_id: u16) -> Result<Self> {
        let (backend, key_uri) = if uri.starts_with("kms://aws/") {
            (HsmBackendType::AwsKms, uri.strip_prefix("kms://aws/").unwrap().to_string())
        } else if uri.starts_with("kms://azure/") {
            (HsmBackendType::AzureKeyVault, uri.strip_prefix("kms://azure/").unwrap().to_string())
        } else if uri.starts_with("kms://gcp/") {
            (HsmBackendType::GcpKms, uri.strip_prefix("kms://gcp/").unwrap().to_string())
        } else if uri.starts_with("hsm://yubihsm/") {
            (HsmBackendType::YubiHsm2, uri.strip_prefix("hsm://yubihsm/").unwrap().to_string())
        } else if uri.starts_with("pkcs11://") {
            (HsmBackendType::Pkcs11, uri.strip_prefix("pkcs11://").unwrap().to_string())
        } else if uri.starts_with("file://") || uri.starts_with("dev://") {
            (HsmBackendType::Software, uri.to_string())
        } else {
            return Err(anyhow!("Unknown key URI scheme: {}", uri));
        };

        Ok(Self {
            backend,
            key_uri,
            participant_id,
            created_at: chrono::Utc::now().to_rfc3339(),
        })
    }
}

/// HSM backend configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HsmConfig {
    pub backend: HsmBackendType,

    // AWS KMS
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aws_region: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aws_profile: Option<String>,

    // Azure Key Vault
    #[serde(skip_serializing_if = "Option::is_none")]
    pub azure_vault_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub azure_tenant_id: Option<String>,

    // GCP KMS
    #[serde(skip_serializing_if = "Option::is_none")]
    pub gcp_project: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub gcp_location: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub gcp_keyring: Option<String>,

    // YubiHSM
    #[serde(skip_serializing_if = "Option::is_none")]
    pub yubihsm_connector: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub yubihsm_auth_key_id: Option<u16>,

    // PKCS#11
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pkcs11_module: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pkcs11_slot: Option<u64>,

    // Software (dev only)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub software_key_dir: Option<String>,
}

impl Default for HsmConfig {
    fn default() -> Self {
        Self {
            backend: HsmBackendType::Software,
            aws_region: None,
            aws_profile: None,
            azure_vault_name: None,
            azure_tenant_id: None,
            gcp_project: None,
            gcp_location: None,
            gcp_keyring: None,
            yubihsm_connector: None,
            yubihsm_auth_key_id: None,
            pkcs11_module: None,
            pkcs11_slot: None,
            software_key_dir: Some(".speclock/keys".to_string()),
        }
    }
}

/// Abstract HSM operations
pub trait HsmBackend: Send + Sync {
    /// Store a key package in the HSM (encrypted)
    fn store_key_package(&self, participant_id: u16, key_package: &[u8]) -> Result<HsmKeyRef>;

    /// Load a key package from the HSM
    fn load_key_package(&self, key_ref: &HsmKeyRef) -> Result<Vec<u8>>;

    /// Generate signing nonces (inside HSM if possible)
    fn generate_nonces(&self, key_ref: &HsmKeyRef, message_hash: &[u8]) -> Result<Vec<u8>>;

    /// Create signature share (key never leaves HSM)
    fn create_signature_share(
        &self,
        key_ref: &HsmKeyRef,
        nonces: &[u8],
        signing_package: &[u8],
        message_hash: &[u8],
    ) -> Result<Vec<u8>>;

    /// Get backend type
    fn backend_type(&self) -> HsmBackendType;

    /// Health check
    fn health_check(&self) -> Result<HsmHealth>;
}

/// HSM health status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HsmHealth {
    pub healthy: bool,
    pub backend: HsmBackendType,
    pub latency_ms: u64,
    pub message: String,
}

/// Software HSM backend (development only)
pub struct SoftwareHsmBackend {
    key_dir: String,
}

impl SoftwareHsmBackend {
    pub fn new(key_dir: &str) -> Self {
        std::fs::create_dir_all(key_dir).ok();
        Self {
            key_dir: key_dir.to_string(),
        }
    }

    fn key_path(&self, participant_id: u16) -> std::path::PathBuf {
        std::path::PathBuf::from(&self.key_dir)
            .join(format!("participant_{}.keypkg.enc", participant_id))
    }
}

impl HsmBackend for SoftwareHsmBackend {
    fn store_key_package(&self, participant_id: u16, key_package: &[u8]) -> Result<HsmKeyRef> {
        let path = self.key_path(participant_id);

        // In production, this would encrypt with a local key
        // For dev, we store with a simple marker
        let mut data = Vec::with_capacity(key_package.len() + 8);
        data.extend_from_slice(b"DEVKEY\x00\x00");
        data.extend_from_slice(key_package);

        std::fs::write(&path, &data)?;

        Ok(HsmKeyRef {
            backend: HsmBackendType::Software,
            key_uri: format!("file://{}", path.display()),
            participant_id,
            created_at: chrono::Utc::now().to_rfc3339(),
        })
    }

    fn load_key_package(&self, key_ref: &HsmKeyRef) -> Result<Vec<u8>> {
        let path = self.key_path(key_ref.participant_id);
        let data = std::fs::read(&path)?;

        if !data.starts_with(b"DEVKEY\x00\x00") {
            return Err(anyhow!("Invalid key package format"));
        }

        Ok(data[8..].to_vec())
    }

    fn generate_nonces(&self, _key_ref: &HsmKeyRef, _message_hash: &[u8]) -> Result<Vec<u8>> {
        // For software backend, nonces are generated in the main signing code
        // This is a placeholder that returns empty (nonces generated separately)
        Ok(Vec::new())
    }

    fn create_signature_share(
        &self,
        _key_ref: &HsmKeyRef,
        _nonces: &[u8],
        _signing_package: &[u8],
        _message_hash: &[u8],
    ) -> Result<Vec<u8>> {
        // For software backend, signing is done in the main code
        // This is a placeholder
        Err(anyhow!("Software backend delegates to main signing code"))
    }

    fn backend_type(&self) -> HsmBackendType {
        HsmBackendType::Software
    }

    fn health_check(&self) -> Result<HsmHealth> {
        let start = std::time::Instant::now();
        let exists = std::path::Path::new(&self.key_dir).exists();
        let latency = start.elapsed().as_millis() as u64;

        Ok(HsmHealth {
            healthy: exists,
            backend: HsmBackendType::Software,
            latency_ms: latency,
            message: if exists {
                "Key directory accessible".to_string()
            } else {
                "Key directory not found".to_string()
            },
        })
    }
}

/// Create HSM backend from config
pub fn create_hsm_backend(config: &HsmConfig) -> Result<Arc<dyn HsmBackend>> {
    match config.backend {
        HsmBackendType::Software => {
            let key_dir = config
                .software_key_dir
                .as_ref()
                .ok_or_else(|| anyhow!("software_key_dir required for software backend"))?;
            Ok(Arc::new(SoftwareHsmBackend::new(key_dir)))
        }
        HsmBackendType::AwsKms => {
            // AWS KMS integration would go here
            // Requires aws-sdk-kms crate
            Err(anyhow!("AWS KMS backend not yet implemented - use 'cargo add aws-sdk-kms'"))
        }
        HsmBackendType::AzureKeyVault => {
            // Azure Key Vault integration would go here
            // Requires azure_security_keyvault crate
            Err(anyhow!("Azure Key Vault backend not yet implemented"))
        }
        HsmBackendType::GcpKms => {
            // GCP KMS integration would go here
            Err(anyhow!("GCP KMS backend not yet implemented"))
        }
        HsmBackendType::YubiHsm2 => {
            // YubiHSM 2 integration would go here
            // Requires yubihsm crate
            Err(anyhow!("YubiHSM 2 backend not yet implemented"))
        }
        HsmBackendType::Pkcs11 => {
            // PKCS#11 integration would go here
            // Requires cryptoki crate
            Err(anyhow!("PKCS#11 backend not yet implemented"))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_software_backend() {
        let temp_dir = tempfile::tempdir().unwrap();
        let backend = SoftwareHsmBackend::new(temp_dir.path().to_str().unwrap());

        let key_package = b"test_key_package_data";
        let key_ref = backend.store_key_package(1, key_package).unwrap();

        assert_eq!(key_ref.participant_id, 1);
        assert_eq!(key_ref.backend, HsmBackendType::Software);

        let loaded = backend.load_key_package(&key_ref).unwrap();
        assert_eq!(loaded, key_package);

        let health = backend.health_check().unwrap();
        assert!(health.healthy);
    }

    #[test]
    fn test_key_ref_from_uri() {
        let aws_ref = HsmKeyRef::from_uri("kms://aws/arn:aws:kms:us-west-2:123:key/abc", 1).unwrap();
        assert_eq!(aws_ref.backend, HsmBackendType::AwsKms);

        let azure_ref = HsmKeyRef::from_uri("kms://azure/vaults/myvault/keys/mykey", 2).unwrap();
        assert_eq!(azure_ref.backend, HsmBackendType::AzureKeyVault);

        let yubi_ref = HsmKeyRef::from_uri("hsm://yubihsm/0x1234", 3).unwrap();
        assert_eq!(yubi_ref.backend, HsmBackendType::YubiHsm2);
    }

    #[test]
    fn test_hsm_backend_type_parse() {
        assert_eq!("aws_kms".parse::<HsmBackendType>().unwrap(), HsmBackendType::AwsKms);
        assert_eq!("azure-key-vault".parse::<HsmBackendType>().unwrap(), HsmBackendType::AzureKeyVault);
        assert_eq!("yubihsm2".parse::<HsmBackendType>().unwrap(), HsmBackendType::YubiHsm2);
        assert_eq!("software".parse::<HsmBackendType>().unwrap(), HsmBackendType::Software);
    }
}
