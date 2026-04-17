use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::BTreeMap;
use uuid::Uuid;

/// An audit event in the hash-chained log.
///
/// Each event embeds `prev_hash` (the hash of the immediately preceding event;
/// empty string for the genesis event) and `hash` (SHA-256 of canonical JSON
/// of the event with `hash` blanked). `verify_chain` walks a slice and
/// returns `Ok(())` on a clean chain, or the index and reason of the first
/// broken link.
///
/// Format note: `hash` strings are `sha256:<64-hex-lowercase>`. `prev_hash`
/// is either the empty string (genesis) or the same format.
///
/// `Subject.attrs` and `metadata` use `BTreeMap` so JSON serialization is
/// key-sorted and stable across processes and platforms — required for
/// cross-node tamper evidence under NIST 800-53 AU-9. `HashMap` iteration
/// order is process-local (SipHash randomization), which would break chain
/// verification between nodes.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditEvent {
    pub audit_id: String,
    pub event_type: String,
    pub occurred_at: DateTime<Utc>,
    pub actor: Actor,
    pub county_id: String,
    pub subject: Subject,
    pub outcome: Outcome,
    pub policy_refs: Vec<String>,
    pub prev_hash: String,
    pub hash: String,
    pub metadata: BTreeMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Actor {
    pub identity: String,
    pub auth_method: String,
    pub certificate_fingerprint: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Subject {
    pub kind: String,
    pub id: String,
    pub attrs: BTreeMap<String, String>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum Outcome {
    Success,
    Denied,
    Failed,
}

pub struct AuditEventBuilder {
    pub event_type: String,
    pub actor: Actor,
    pub county_id: String,
    pub subject: Subject,
    pub outcome: Outcome,
    pub policy_refs: Vec<String>,
    pub metadata: BTreeMap<String, String>,
}

impl AuditEventBuilder {
    /// Finalize with a `prev_hash` from the last event in the chain
    /// (empty string for the genesis event).
    pub fn build(self, prev_hash: &str) -> AuditEvent {
        let audit_id = Uuid::new_v4().to_string();
        let occurred_at = Utc::now();

        let mut event = AuditEvent {
            audit_id,
            event_type: self.event_type,
            occurred_at,
            actor: self.actor,
            county_id: self.county_id,
            subject: self.subject,
            outcome: self.outcome,
            policy_refs: self.policy_refs,
            prev_hash: prev_hash.to_string(),
            hash: String::new(),
            metadata: self.metadata,
        };
        event.hash = compute_hash(&event);
        event
    }
}

fn compute_hash(event: &AuditEvent) -> String {
    let mut clone = event.clone();
    clone.hash.clear();
    let canonical = serde_json::to_string(&clone).expect("audit event serializes");
    let digest = Sha256::digest(canonical.as_bytes());
    format!("sha256:{:x}", digest)
}

/// Reason a chain-verification link was rejected. Lets forensics tell
/// "someone reordered/replaced events" from "someone mutated an event
/// in place".
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ChainBreak {
    /// `event.prev_hash` does not match the previous event's `hash` (or
    /// the genesis sentinel for index 0). Suggests insertion, deletion,
    /// or reordering.
    PrevHashMismatch,
    /// `event.hash` does not match the SHA-256 recomputed over the
    /// event's canonical form. Suggests in-place mutation.
    SelfHashMismatch,
}

/// Verify a chain of audit events in order. Returns `Ok(())` on a clean
/// chain; on failure, returns the index and reason of the first broken
/// link.
pub fn verify_chain(events: &[AuditEvent]) -> Result<(), (usize, ChainBreak)> {
    let mut expected_prev = String::new();
    for (i, event) in events.iter().enumerate() {
        if event.prev_hash != expected_prev {
            return Err((i, ChainBreak::PrevHashMismatch));
        }
        let recomputed = compute_hash(event);
        if recomputed != event.hash {
            return Err((i, ChainBreak::SelfHashMismatch));
        }
        expected_prev = event.hash.clone();
    }
    Ok(())
}
