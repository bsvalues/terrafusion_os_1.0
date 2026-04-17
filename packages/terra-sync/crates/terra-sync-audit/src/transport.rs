//! Transport abstraction for audit events.
//!
//! The control plane emits audit events regardless of where they go —
//! Kafka in production, in-memory for tests, stdout for dev without Kafka.
//! Concrete transports implement this trait.

use crate::event::AuditEvent;
use async_trait::async_trait;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AuditError {
    #[error("transport error: {0}")]
    Transport(String),
    #[error("serialization error: {0}")]
    Serialization(String),
}

#[async_trait]
pub trait Audit: Send + Sync {
    /// Emit a single audit event. Implementations are responsible for
    /// durability semantics — callers treat success as "event committed."
    async fn emit(&self, event: &AuditEvent) -> Result<(), AuditError>;
}

/// Always-available no-op transport. Logs at `tracing::info` and drops the
/// event. Used when Kafka is not available (e.g., local dev on Windows
/// without cmake, or during Phase 1 bring-up before Kafka topology lands).
///
/// Do NOT use in production — dropping audit events violates NIST 800-53 AU-2.
pub struct NullAudit;

#[async_trait]
impl Audit for NullAudit {
    async fn emit(&self, event: &AuditEvent) -> Result<(), AuditError> {
        tracing::info!(
            audit_id = %event.audit_id,
            event_type = %event.event_type,
            county_id = %event.county_id,
            "NullAudit: event dropped (no transport configured)"
        );
        Ok(())
    }
}
