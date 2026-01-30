// ═══════════════════════════════════════════════════════════════════════════════
// TerraFusion SpecLock TSS - Coordinator (Stateless)
// ═══════════════════════════════════════════════════════════════════════════════
//
// Stateless coordinator for FROST signing ceremonies.
// - Does NOT hold any secrets
// - Can be destroyed after signing
// - Collects commitments and shares
// - Aggregates final signature
// - Produces audit-ready ceremony proof
//
// ═══════════════════════════════════════════════════════════════════════════════

use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashMap;

/// Ceremony state (held only during active ceremony)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CeremonyState {
    /// Unique ceremony ID
    pub ceremony_id: String,

    /// Coordinator ID
    pub coordinator_id: String,

    /// Message hash being signed
    pub message_hash: String,

    /// Threshold k
    pub threshold_k: u16,

    /// Total participants n
    pub participants_n: u16,

    /// Expected participant IDs
    pub expected_participants: Vec<u16>,

    /// Current phase
    pub phase: CeremonyPhase,

    /// Time bounds
    pub not_before: String,
    pub not_after: String,

    /// Collected commitments (Round 1)
    pub commitments: HashMap<u16, String>,

    /// Collected shares (Round 2)
    pub shares: HashMap<u16, String>,

    /// Created timestamp
    pub created_at: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CeremonyPhase {
    Initialized,
    CollectingCommitments,
    CollectingShares,
    Aggregating,
    Complete,
    Failed,
}

impl CeremonyState {
    /// Create a new ceremony
    pub fn new(
        ceremony_id: &str,
        coordinator_id: &str,
        message_hash: &str,
        threshold_k: u16,
        participants_n: u16,
        expected_participants: Vec<u16>,
        validity_minutes: u64,
    ) -> Self {
        let now = chrono::Utc::now();
        let not_after = now + chrono::Duration::minutes(validity_minutes as i64);

        Self {
            ceremony_id: ceremony_id.to_string(),
            coordinator_id: coordinator_id.to_string(),
            message_hash: message_hash.to_string(),
            threshold_k,
            participants_n,
            expected_participants,
            phase: CeremonyPhase::Initialized,
            not_before: now.to_rfc3339(),
            not_after: not_after.to_rfc3339(),
            commitments: HashMap::new(),
            shares: HashMap::new(),
            created_at: now.to_rfc3339(),
        }
    }

    /// Check if ceremony is within time bounds
    pub fn is_valid_time(&self) -> Result<bool> {
        let now = chrono::Utc::now();
        let nbf = chrono::DateTime::parse_from_rfc3339(&self.not_before)?
            .with_timezone(&chrono::Utc);
        let exp = chrono::DateTime::parse_from_rfc3339(&self.not_after)?
            .with_timezone(&chrono::Utc);

        Ok(now >= nbf && now <= exp)
    }

    /// Add a commitment (Round 1)
    pub fn add_commitment(&mut self, participant_id: u16, commitment: &str) -> Result<()> {
        if !self.expected_participants.contains(&participant_id) {
            return Err(anyhow!("Unexpected participant: {}", participant_id));
        }
        if self.phase != CeremonyPhase::Initialized && self.phase != CeremonyPhase::CollectingCommitments {
            return Err(anyhow!("Cannot add commitment in phase {:?}", self.phase));
        }

        self.phase = CeremonyPhase::CollectingCommitments;
        self.commitments.insert(participant_id, commitment.to_string());

        Ok(())
    }

    /// Check if we have enough commitments
    pub fn has_enough_commitments(&self) -> bool {
        self.commitments.len() >= self.threshold_k as usize
    }

    /// Get participants who have committed
    pub fn committed_participants(&self) -> Vec<u16> {
        self.commitments.keys().copied().collect()
    }

    /// Add a signature share (Round 2)
    pub fn add_share(&mut self, participant_id: u16, share: &str) -> Result<()> {
        if !self.commitments.contains_key(&participant_id) {
            return Err(anyhow!("Participant {} did not submit commitment", participant_id));
        }
        if self.phase != CeremonyPhase::CollectingCommitments && self.phase != CeremonyPhase::CollectingShares {
            return Err(anyhow!("Cannot add share in phase {:?}", self.phase));
        }

        self.phase = CeremonyPhase::CollectingShares;
        self.shares.insert(participant_id, share.to_string());

        Ok(())
    }

    /// Check if we have enough shares
    pub fn has_enough_shares(&self) -> bool {
        self.shares.len() >= self.threshold_k as usize
    }

    /// Get participants who have submitted shares
    pub fn signed_participants(&self) -> Vec<u16> {
        self.shares.keys().copied().collect()
    }

    /// Mark ceremony as complete
    pub fn mark_complete(&mut self) {
        self.phase = CeremonyPhase::Complete;
    }

    /// Mark ceremony as failed
    pub fn mark_failed(&mut self) {
        self.phase = CeremonyPhase::Failed;
    }
}

/// Ceremony proof (for audit)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CeremonyProof {
    /// Ceremony ID
    pub ceremony_id: String,

    /// Coordinator ID
    pub coordinator_id: String,

    /// Message hash that was signed
    pub message_hash: String,

    /// Threshold k
    pub threshold_k: u16,

    /// Total participants n
    pub participants_n: u16,

    /// Participants that contributed
    pub participants_used: Vec<u16>,

    /// Final signature (hex)
    pub signature: String,

    /// Group public key (hex)
    pub group_public_key: String,

    /// Commitment hashes (for audit, not actual commitments)
    pub commitment_hashes: HashMap<u16, String>,

    /// Share hashes (for audit, not actual shares)
    pub share_hashes: HashMap<u16, String>,

    /// Ceremony started at
    pub started_at: String,

    /// Ceremony completed at
    pub completed_at: String,

    /// Transcript hash (hash of all ceremony data)
    pub transcript_hash: String,

    /// Verification status
    pub verified: bool,
}

impl CeremonyProof {
    /// Create proof from ceremony state and final signature
    pub fn from_ceremony(
        state: &CeremonyState,
        signature: &str,
        group_public_key: &str,
        verified: bool,
    ) -> Result<Self> {
        // Hash commitments (don't store actual values in proof)
        let commitment_hashes: HashMap<u16, String> = state
            .commitments
            .iter()
            .map(|(id, c)| {
                let mut hasher = Sha256::new();
                hasher.update(c.as_bytes());
                (*id, hex::encode(hasher.finalize()))
            })
            .collect();

        // Hash shares
        let share_hashes: HashMap<u16, String> = state
            .shares
            .iter()
            .map(|(id, s)| {
                let mut hasher = Sha256::new();
                hasher.update(s.as_bytes());
                (*id, hex::encode(hasher.finalize()))
            })
            .collect();

        let mut proof = Self {
            ceremony_id: state.ceremony_id.clone(),
            coordinator_id: state.coordinator_id.clone(),
            message_hash: state.message_hash.clone(),
            threshold_k: state.threshold_k,
            participants_n: state.participants_n,
            participants_used: state.shares.keys().copied().collect(),
            signature: signature.to_string(),
            group_public_key: group_public_key.to_string(),
            commitment_hashes,
            share_hashes,
            started_at: state.created_at.clone(),
            completed_at: chrono::Utc::now().to_rfc3339(),
            transcript_hash: String::new(),
            verified,
        };

        // Compute transcript hash
        proof.transcript_hash = proof.compute_transcript_hash()?;

        Ok(proof)
    }

    /// Compute transcript hash (for tamper detection)
    pub fn compute_transcript_hash(&self) -> Result<String> {
        let mut hasher = Sha256::new();

        // Hash all ceremony data
        hasher.update(self.ceremony_id.as_bytes());
        hasher.update(self.message_hash.as_bytes());
        hasher.update(&self.threshold_k.to_le_bytes());
        hasher.update(&self.participants_n.to_le_bytes());

        for id in &self.participants_used {
            hasher.update(&id.to_le_bytes());
        }

        for (id, hash) in &self.commitment_hashes {
            hasher.update(&id.to_le_bytes());
            hasher.update(hash.as_bytes());
        }

        for (id, hash) in &self.share_hashes {
            hasher.update(&id.to_le_bytes());
            hasher.update(hash.as_bytes());
        }

        hasher.update(self.signature.as_bytes());
        hasher.update(self.group_public_key.as_bytes());

        Ok(hex::encode(hasher.finalize()))
    }

    /// Save proof to file
    pub fn save(&self, path: &std::path::Path) -> Result<()> {
        let json = serde_json::to_string_pretty(self)?;
        std::fs::write(path, json)?;
        Ok(())
    }

    /// Load proof from file
    pub fn load(path: &std::path::Path) -> Result<Self> {
        let json = std::fs::read_to_string(path)?;
        let proof: Self = serde_json::from_str(&json)?;
        Ok(proof)
    }
}

/// Rate limiter for coordinator
#[derive(Debug, Clone)]
pub struct RateLimiter {
    /// Maximum signatures per window
    pub max_signatures: u32,

    /// Window duration in seconds
    pub window_seconds: u64,

    /// Signature timestamps in current window
    signatures: Vec<std::time::Instant>,
}

impl RateLimiter {
    pub fn new(max_signatures: u32, window_seconds: u64) -> Self {
        Self {
            max_signatures,
            window_seconds,
            signatures: Vec::new(),
        }
    }

    /// Check if a new signature is allowed
    pub fn check(&mut self) -> bool {
        let now = std::time::Instant::now();
        let window = std::time::Duration::from_secs(self.window_seconds);

        // Remove old signatures
        self.signatures.retain(|t| now.duration_since(*t) < window);

        // Check limit
        if self.signatures.len() < self.max_signatures as usize {
            self.signatures.push(now);
            true
        } else {
            false
        }
    }

    /// Get current usage
    pub fn current_usage(&self) -> u32 {
        self.signatures.len() as u32
    }

    /// Get seconds until window reset
    pub fn seconds_until_reset(&self) -> u64 {
        if self.signatures.is_empty() {
            return 0;
        }

        let oldest = self.signatures.first().unwrap();
        let now = std::time::Instant::now();
        let elapsed = now.duration_since(*oldest).as_secs();

        if elapsed >= self.window_seconds {
            0
        } else {
            self.window_seconds - elapsed
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ceremony_state() {
        let mut state = CeremonyState::new(
            "test-ceremony",
            "coordinator-1",
            "abcd1234",
            2,
            3,
            vec![1, 2, 3],
            60,
        );

        assert_eq!(state.phase, CeremonyPhase::Initialized);
        assert!(state.is_valid_time().unwrap());

        // Add commitments
        state.add_commitment(1, "commitment_1").unwrap();
        assert!(!state.has_enough_commitments());

        state.add_commitment(2, "commitment_2").unwrap();
        assert!(state.has_enough_commitments());

        // Add shares
        state.add_share(1, "share_1").unwrap();
        assert!(!state.has_enough_shares());

        state.add_share(2, "share_2").unwrap();
        assert!(state.has_enough_shares());

        assert_eq!(state.signed_participants().len(), 2);
    }

    #[test]
    fn test_ceremony_proof() {
        let mut state = CeremonyState::new(
            "test-ceremony",
            "coordinator-1",
            "abcd1234",
            2,
            3,
            vec![1, 2, 3],
            60,
        );

        state.add_commitment(1, "commitment_1").unwrap();
        state.add_commitment(2, "commitment_2").unwrap();
        state.add_share(1, "share_1").unwrap();
        state.add_share(2, "share_2").unwrap();

        let proof = CeremonyProof::from_ceremony(
            &state,
            "final_signature",
            "group_public_key",
            true,
        ).unwrap();

        assert_eq!(proof.participants_used.len(), 2);
        assert!(proof.verified);
        assert!(!proof.transcript_hash.is_empty());
    }

    #[test]
    fn test_rate_limiter() {
        let mut limiter = RateLimiter::new(3, 60);

        assert!(limiter.check());
        assert!(limiter.check());
        assert!(limiter.check());
        assert!(!limiter.check()); // Exceeded

        assert_eq!(limiter.current_usage(), 3);
    }
}
