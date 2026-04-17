use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use uuid::Uuid;

/// An audit event in the hash-chained log.
///
/// Each event embeds `prev_hash` (the hash of the immediately preceding event;
/// empty string for the genesis event) and `hash` (SHA-256 of canonical JSON
/// of the event with `hash` blanked). `verify_chain` walks a slice and
/// returns the index of the first broken link or `None` when clean.
///
/// Format note: `hash` strings are `sha256:<64-hex-lowercase>`. `prev_hash`
/// is either the empty string (genesis) or the same format.
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
    pub metadata: HashMap<String, String>,
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
    pub attrs: HashMap<String, String>,
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
    pub metadata: HashMap<String, String>,
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

/// Verify a chain of audit events in order. Returns the index of the first
/// broken link (either wrong `prev_hash` or self-hash mismatch), or `None`
/// if all links are valid.
pub fn verify_chain(events: &[AuditEvent]) -> Option<usize> {
    let mut expected_prev = String::new();
    for (i, event) in events.iter().enumerate() {
        if event.prev_hash != expected_prev {
            return Some(i);
        }
        let recomputed = compute_hash(event);
        if recomputed != event.hash {
            return Some(i);
        }
        expected_prev = event.hash.clone();
    }
    None
}
