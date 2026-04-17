pub mod event;
pub mod transport;

#[cfg(feature = "kafka")]
pub mod emitter;

pub use event::{verify_chain, Actor, AuditEvent, AuditEventBuilder, ChainBreak, Outcome, Subject};
pub use transport::{Audit, AuditError, NullAudit};

#[cfg(feature = "kafka")]
pub use emitter::{AuditEmitter, EmitError};
