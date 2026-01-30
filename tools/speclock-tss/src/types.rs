// ═══════════════════════════════════════════════════════════════════════════════
// TerraFusion SpecLock TSS - Data Types
// ═══════════════════════════════════════════════════════════════════════════════
//
// Serializable types for DKG packages, nonce commitments, signature shares,
// and verification proofs. All designed for deterministic, auditable operation.
// ═══════════════════════════════════════════════════════════════════════════════

use serde::{Deserialize, Serialize};

/// DKG Round 1 package - broadcast to all participants
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct DkgRound1Package {
    pub participant_id: u16,
    pub package_bytes: String, // hex-encoded
}

/// DKG Round 2 package - sent to specific participant
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct DkgRound2Package {
    pub sender_id: u16,
    pub receiver_id: u16,
    pub package_bytes: String, // hex-encoded
}

/// Secret share (NEVER transmitted, stored locally by participant)
#[derive(Serialize, Deserialize, Clone)]
pub struct SecretShare {
    pub participant_id: u16,
    pub secret_bytes: String, // hex-encoded, encrypted at rest
}

/// Key package (participant's signing key + group info)
#[derive(Serialize, Deserialize, Clone)]
pub struct KeyPackageEnvelope {
    pub participant_id: u16,
    pub key_package_bytes: String, // hex-encoded
    pub public_key_package_bytes: String, // hex-encoded
}

/// Signing Round 1: Nonce commitment
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct NonceCommitment {
    pub participant_id: u16,
    pub commitment_bytes: String, // hex-encoded
}

/// Signing nonces (NEVER transmitted, kept by signer)
#[derive(Serialize, Deserialize, Clone)]
pub struct SigningNoncesEnvelope {
    pub participant_id: u16,
    pub nonces_bytes: String, // hex-encoded
}

/// Signature share from one participant
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SignatureShare {
    pub participant_id: u16,
    pub share_bytes: String, // hex-encoded
}

/// Final aggregated signature
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AggregatedSignature {
    pub signature_bytes: String, // hex-encoded (64 bytes for Ed25519)
    pub scheme: String,
}

/// Group public key (used for verification)
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct GroupPublicKey {
    pub scheme: String,
    pub threshold_k: u16,
    pub participants_n: u16,
    pub public_key_bytes: String, // hex-encoded (32 bytes for Ed25519)
}

/// Manifest digest (what gets signed)
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ManifestDigest {
    pub algorithm: String,
    pub digest_hex: String,
    pub manifest_path: String,
}

/// Cryptographic proof for audit trail
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct CosmicProof {
    pub scheme: String,
    pub threshold_k: u16,
    pub participants_n: u16,
    pub participants_signed: Vec<u16>,
    pub group_public_key_hex: String,
    pub digest_hex: String,
    pub signature_hex: String,
    pub timestamp: String,
    pub verification_status: String,
}

/// DKG ceremony state
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct DkgCeremonyState {
    pub ceremony_id: String,
    pub threshold_k: u16,
    pub participants_n: u16,
    pub participant_ids: Vec<u16>,
    pub round: u8, // 1, 2, or 3 (complete)
    pub created_at: String,
}
