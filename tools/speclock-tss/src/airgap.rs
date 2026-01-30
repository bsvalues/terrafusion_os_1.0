// ═══════════════════════════════════════════════════════════════════════════════
// TerraFusion SpecLock TSS - Air-Gapped Signing Support
// ═══════════════════════════════════════════════════════════════════════════════
//
// Support for air-gapped county participation via "Courier Digest" mode.
// - Digest is physically transferred (USB/QR)
// - Signature share is created offline
// - Share is returned to coordinator
//
// No internet. No leakage. Full sovereignty.
//
// ═══════════════════════════════════════════════════════════════════════════════

use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::path::Path;

/// Courier digest package - physically transferred to air-gapped signer
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CourierDigest {
    /// Schema version
    pub version: String,

    /// Unique ceremony ID
    pub ceremony_id: String,

    /// SHA-256 hash of the manifest
    pub manifest_hash: String,

    /// Manifest path (informational)
    pub manifest_path: String,

    /// Timestamp when digest was created
    pub created_at: String,

    /// Validity window
    pub not_before: String,
    pub not_after: String,

    /// Expected signer participant IDs
    pub expected_signers: Vec<u16>,

    /// Threshold k
    pub threshold_k: u16,

    /// Total participants n
    pub participants_n: u16,

    /// Coordinator ID (for verification)
    pub coordinator_id: String,

    /// Integrity hash of this package (excluding this field)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub integrity_hash: Option<String>,
}

impl CourierDigest {
    /// Create a new courier digest from a manifest
    pub fn from_manifest(
        manifest_path: &Path,
        ceremony_id: &str,
        coordinator_id: &str,
        expected_signers: Vec<u16>,
        threshold_k: u16,
        participants_n: u16,
        validity_hours: u64,
    ) -> Result<Self> {
        let manifest_content = std::fs::read(manifest_path)?;
        let mut hasher = Sha256::new();
        hasher.update(&manifest_content);
        let manifest_hash = hex::encode(hasher.finalize());

        let now = chrono::Utc::now();
        let not_after = now + chrono::Duration::hours(validity_hours as i64);

        let mut digest = Self {
            version: "1.0.0".to_string(),
            ceremony_id: ceremony_id.to_string(),
            manifest_hash,
            manifest_path: manifest_path.display().to_string(),
            created_at: now.to_rfc3339(),
            not_before: now.to_rfc3339(),
            not_after: not_after.to_rfc3339(),
            expected_signers,
            threshold_k,
            participants_n,
            coordinator_id: coordinator_id.to_string(),
            integrity_hash: None,
        };

        // Compute integrity hash
        digest.integrity_hash = Some(digest.compute_integrity_hash()?);

        Ok(digest)
    }

    /// Compute integrity hash of the digest (for tamper detection)
    pub fn compute_integrity_hash(&self) -> Result<String> {
        let mut copy = self.clone();
        copy.integrity_hash = None;
        let json = serde_json::to_string(&copy)?;

        let mut hasher = Sha256::new();
        hasher.update(json.as_bytes());
        Ok(hex::encode(hasher.finalize()))
    }

    /// Verify integrity hash
    pub fn verify_integrity(&self) -> Result<bool> {
        let expected = self
            .integrity_hash
            .as_ref()
            .ok_or_else(|| anyhow!("Missing integrity hash"))?;
        let computed = self.compute_integrity_hash()?;
        Ok(expected == &computed)
    }

    /// Check if digest is within validity window
    pub fn is_valid_time(&self) -> Result<bool> {
        let now = chrono::Utc::now();
        let nbf = chrono::DateTime::parse_from_rfc3339(&self.not_before)?
            .with_timezone(&chrono::Utc);
        let exp = chrono::DateTime::parse_from_rfc3339(&self.not_after)?
            .with_timezone(&chrono::Utc);

        Ok(now >= nbf && now <= exp)
    }

    /// Save to file (for USB transfer)
    pub fn save(&self, path: &Path) -> Result<()> {
        let json = serde_json::to_string_pretty(self)?;
        std::fs::write(path, json)?;
        Ok(())
    }

    /// Load from file
    pub fn load(path: &Path) -> Result<Self> {
        let json = std::fs::read_to_string(path)?;
        let digest: Self = serde_json::from_str(&json)?;
        Ok(digest)
    }

    /// Generate QR code data (compact JSON)
    pub fn to_qr_data(&self) -> Result<String> {
        // Compact format for QR codes
        Ok(serde_json::to_string(&serde_json::json!({
            "v": &self.version,
            "c": &self.ceremony_id,
            "h": &self.manifest_hash,
            "t": self.threshold_k,
            "n": self.participants_n,
            "e": &self.not_after,
            "i": &self.integrity_hash,
        }))?)
    }
}

/// Air-gapped signature share - produced by offline signer
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AirGappedShare {
    /// Schema version
    pub version: String,

    /// Ceremony ID (must match courier digest)
    pub ceremony_id: String,

    /// Participant ID
    pub participant_id: u16,

    /// Manifest hash (must match courier digest)
    pub manifest_hash: String,

    /// Nonce commitment (hex)
    pub nonce_commitment: String,

    /// Signature share (hex)
    pub signature_share: String,

    /// Timestamp when share was created
    pub created_at: String,

    /// Signer attestation (optional, for audit)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub attestation: Option<SignerAttestation>,

    /// Integrity hash of this share
    #[serde(skip_serializing_if = "Option::is_none")]
    pub integrity_hash: Option<String>,
}

impl AirGappedShare {
    /// Create a new air-gapped share
    pub fn new(
        ceremony_id: &str,
        participant_id: u16,
        manifest_hash: &str,
        nonce_commitment: &str,
        signature_share: &str,
    ) -> Result<Self> {
        let mut share = Self {
            version: "1.0.0".to_string(),
            ceremony_id: ceremony_id.to_string(),
            participant_id,
            manifest_hash: manifest_hash.to_string(),
            nonce_commitment: nonce_commitment.to_string(),
            signature_share: signature_share.to_string(),
            created_at: chrono::Utc::now().to_rfc3339(),
            attestation: None,
            integrity_hash: None,
        };

        share.integrity_hash = Some(share.compute_integrity_hash()?);

        Ok(share)
    }

    /// Compute integrity hash
    pub fn compute_integrity_hash(&self) -> Result<String> {
        let mut copy = self.clone();
        copy.integrity_hash = None;
        let json = serde_json::to_string(&copy)?;

        let mut hasher = Sha256::new();
        hasher.update(json.as_bytes());
        Ok(hex::encode(hasher.finalize()))
    }

    /// Verify integrity hash
    pub fn verify_integrity(&self) -> Result<bool> {
        let expected = self
            .integrity_hash
            .as_ref()
            .ok_or_else(|| anyhow!("Missing integrity hash"))?;
        let computed = self.compute_integrity_hash()?;
        Ok(expected == &computed)
    }

    /// Verify this share matches a courier digest
    pub fn verify_against_digest(&self, digest: &CourierDigest) -> Result<bool> {
        if self.ceremony_id != digest.ceremony_id {
            return Ok(false);
        }
        if self.manifest_hash != digest.manifest_hash {
            return Ok(false);
        }
        if !digest.expected_signers.contains(&self.participant_id) {
            return Ok(false);
        }
        Ok(true)
    }

    /// Save to file (for USB transfer)
    pub fn save(&self, path: &Path) -> Result<()> {
        let json = serde_json::to_string_pretty(self)?;
        std::fs::write(path, json)?;
        Ok(())
    }

    /// Load from file
    pub fn load(path: &Path) -> Result<Self> {
        let json = std::fs::read_to_string(path)?;
        let share: Self = serde_json::from_str(&json)?;
        Ok(share)
    }
}

/// Signer attestation (for audit trail)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SignerAttestation {
    /// Signer identity (human-readable)
    pub signer_name: String,

    /// Signer organization
    pub organization: String,

    /// Hardware serial number (if applicable)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub hardware_serial: Option<String>,

    /// Physical location
    #[serde(skip_serializing_if = "Option::is_none")]
    pub location: Option<String>,

    /// Notes
    #[serde(skip_serializing_if = "Option::is_none")]
    pub notes: Option<String>,
}

/// Ceremony result - aggregated from multiple shares
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CeremonyResult {
    /// Ceremony ID
    pub ceremony_id: String,

    /// Manifest hash that was signed
    pub manifest_hash: String,

    /// Final aggregated signature (hex, 64 bytes)
    pub signature: String,

    /// Group public key (hex, 32 bytes)
    pub group_public_key: String,

    /// Threshold k
    pub threshold_k: u16,

    /// Total participants n
    pub participants_n: u16,

    /// Participants that contributed
    pub participants_used: Vec<u16>,

    /// Timestamp of aggregation
    pub aggregated_at: String,

    /// Individual share receipts (for audit)
    pub share_receipts: Vec<ShareReceipt>,

    /// Verification status
    pub verified: bool,
}

/// Receipt for a single share (audit trail)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShareReceipt {
    pub participant_id: u16,
    pub share_hash: String,
    pub received_at: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub attestation: Option<SignerAttestation>,
}

impl CeremonyResult {
    /// Save ceremony result
    pub fn save(&self, path: &Path) -> Result<()> {
        let json = serde_json::to_string_pretty(self)?;
        std::fs::write(path, json)?;
        Ok(())
    }

    /// Load ceremony result
    pub fn load(path: &Path) -> Result<Self> {
        let json = std::fs::read_to_string(path)?;
        let result: Self = serde_json::from_str(&json)?;
        Ok(result)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;

    #[test]
    fn test_courier_digest() {
        let temp_dir = tempfile::tempdir().unwrap();
        let manifest_path = temp_dir.path().join("manifest.json");

        // Create a test manifest
        let mut file = std::fs::File::create(&manifest_path).unwrap();
        file.write_all(b"{\"test\": \"manifest\"}").unwrap();

        let digest = CourierDigest::from_manifest(
            &manifest_path,
            "ceremony-001",
            "coordinator-1",
            vec![1, 2, 3],
            2,
            3,
            24,
        ).unwrap();

        assert_eq!(digest.threshold_k, 2);
        assert_eq!(digest.participants_n, 3);
        assert!(digest.verify_integrity().unwrap());
        assert!(digest.is_valid_time().unwrap());

        // Save and load
        let digest_path = temp_dir.path().join("digest.json");
        digest.save(&digest_path).unwrap();
        let loaded = CourierDigest::load(&digest_path).unwrap();
        assert_eq!(loaded.ceremony_id, digest.ceremony_id);
    }

    #[test]
    fn test_air_gapped_share() {
        let share = AirGappedShare::new(
            "ceremony-001",
            1,
            "abcd1234",
            "nonce_commitment_hex",
            "signature_share_hex",
        ).unwrap();

        assert_eq!(share.participant_id, 1);
        assert!(share.verify_integrity().unwrap());
    }

    #[test]
    fn test_share_digest_match() {
        let temp_dir = tempfile::tempdir().unwrap();
        let manifest_path = temp_dir.path().join("manifest.json");
        std::fs::write(&manifest_path, b"{\"test\": \"manifest\"}").unwrap();

        let digest = CourierDigest::from_manifest(
            &manifest_path,
            "ceremony-001",
            "coordinator-1",
            vec![1, 2],
            2,
            3,
            24,
        ).unwrap();

        let share = AirGappedShare::new(
            "ceremony-001",
            1,
            &digest.manifest_hash,
            "nonce",
            "share",
        ).unwrap();

        assert!(share.verify_against_digest(&digest).unwrap());

        // Wrong ceremony
        let bad_share = AirGappedShare::new(
            "wrong-ceremony",
            1,
            &digest.manifest_hash,
            "nonce",
            "share",
        ).unwrap();
        assert!(!bad_share.verify_against_digest(&digest).unwrap());
    }
}
