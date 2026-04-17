pub mod event;

#[cfg(feature = "kafka")]
pub mod emitter;

pub use event::{verify_chain, Actor, AuditEvent, AuditEventBuilder, Outcome, Subject};

#[cfg(feature = "kafka")]
pub use emitter::{AuditEmitter, EmitError};
