//! Transport abstraction for audit events.
//!
//! The control plane emits audit events regardless of where they go —
//! Kafka in production, in-memory for tests, stdout for dev without Kafka.
//! Concrete transports implement this trait.

use crate::event::AuditEvent;
use async_trait::async_trait;
use thiserror::Error;

/// Errors produced by an audit transport.
///
/// Transport and Serialization variants carry stringified cause chains for
/// compatibility across feature-gated backends (rdkafka is not available
/// in the always-on build). The `Other` variant preserves a full
/// `std::error::Error` source chain for forensic inspection when the
/// backend can supply one. Operators wanting a fuller diagnostic should
/// also consult the `tracing::error!` lines emitted at emit-failure time.
#[derive(Debug, Error)]
pub enum AuditError {
    #[error("transport error: {0}")]
    Transport(String),
    #[error("serialization error: {0}")]
    Serialization(String),
    #[error("other error")]
    Other(#[source] Box<dyn std::error::Error + Send + Sync>),
}

#[async_trait]
pub trait Audit: Send + Sync {
    /// Short name identifying the concrete transport (e.g., "kafka", "null").
    /// Used for status/health reporting so operators can tell from
    /// `GetStatus` which backend is actually live.
    fn name(&self) -> &'static str;

    /// Emit a single audit event. Implementations are responsible for
    /// durability semantics — callers treat success as "event committed."
    async fn emit(&self, event: &AuditEvent) -> Result<(), AuditError>;
}

/// Always-available no-op transport. Logs loudly and drops the event.
/// Used when Kafka is not available (e.g., local dev on Windows without
/// cmake, or during Phase 1 bring-up before Kafka topology lands).
///
/// Do NOT use in production — dropping audit events violates NIST 800-53
/// AU-2. Constructing via [`NullAudit::new`] emits a `tracing::error!` at
/// constructor time so the decision to run without audit is unmistakable
/// in logs. Every dropped event is counted in the prometheus counter
/// `terra_sync_audit_events_dropped_total`.
pub struct NullAudit;

impl NullAudit {
    /// Construct a NullAudit and emit a loud constructor-time error log so
    /// operators cannot miss that audit events will be dropped.
    pub fn new() -> Self {
        tracing::error!(
            target: "audit.null",
            "NullAudit selected — audit events will be dropped (NIST 800-53 AU-2 violation — never use in production)"
        );
        NullAudit
    }
}

impl Default for NullAudit {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl Audit for NullAudit {
    fn name(&self) -> &'static str {
        "null"
    }

    async fn emit(&self, event: &AuditEvent) -> Result<(), AuditError> {
        dropped_counter().inc();
        tracing::warn!(
            target: "audit.dropped",
            audit_id = %event.audit_id,
            event_type = %event.event_type,
            county_id = %event.county_id,
            "NullAudit: event dropped (no transport configured)"
        );
        Ok(())
    }
}

use std::sync::OnceLock;

static DROPPED_COUNTER: OnceLock<prometheus::IntCounter> = OnceLock::new();

fn dropped_counter() -> &'static prometheus::IntCounter {
    DROPPED_COUNTER.get_or_init(|| {
        let c = prometheus::IntCounter::new(
            "terra_sync_audit_events_dropped_total",
            "Total audit events dropped by NullAudit (never use in production)",
        )
        .expect("valid counter metric");
        // Best-effort register; if already registered (test re-entry), ignore.
        let _ = prometheus::default_registry().register(Box::new(c.clone()));
        c
    })
}
