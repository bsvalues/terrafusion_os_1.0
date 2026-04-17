//! Kafka-backed audit emitter. Requires the `kafka` feature, which pulls in
//! `rdkafka` (needs `cmake` at build time) and `tokio`. The core event
//! model in `event.rs` does NOT require this feature.

use crate::event::AuditEvent;
use rdkafka::producer::{FutureProducer, FutureRecord};
use rdkafka::ClientConfig;
use std::time::Duration;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum EmitError {
    #[error("kafka producer creation: {0}")]
    Producer(#[from] rdkafka::error::KafkaError),
    #[error("kafka send: {0}")]
    Send(String),
    #[error("json serialization: {0}")]
    Json(#[from] serde_json::Error),
}

pub struct AuditEmitter {
    producer: FutureProducer,
    topic: String,
}

impl AuditEmitter {
    pub fn new(bootstrap_servers: &str, topic: &str) -> Result<Self, EmitError> {
        let producer: FutureProducer = ClientConfig::new()
            .set("bootstrap.servers", bootstrap_servers)
            .set("message.timeout.ms", "5000")
            .set("compression.type", "zstd")
            .set("enable.idempotence", "true")
            .create()?;
        Ok(Self {
            producer,
            topic: topic.to_string(),
        })
    }

    pub async fn emit(&self, event: &AuditEvent) -> Result<(), EmitError> {
        let key = event.county_id.clone();
        let payload = serde_json::to_vec(event)?;
        let record = FutureRecord::to(&self.topic).key(&key).payload(&payload);

        self.producer
            .send(record, Duration::from_secs(5))
            .await
            .map_err(|(e, _)| EmitError::Send(e.to_string()))?;

        tracing::debug!(audit_id = %event.audit_id, event_type = %event.event_type, "audit emitted");
        Ok(())
    }
}
