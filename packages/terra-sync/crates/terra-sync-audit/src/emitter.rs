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
        // `acks=all` is required: audit events are the evidentiary record,
        // so we wait for all in-sync replicas before considering a send
        // durable. `enable.idempotence=true` prevents duplicates on
        // retry. Keys are alphabetized for readability.
        let producer: FutureProducer = ClientConfig::new()
            .set("acks", "all")
            .set("bootstrap.servers", bootstrap_servers)
            .set("compression.type", "zstd")
            .set("enable.idempotence", "true")
            .set("message.timeout.ms", "5000")
            .create()?;
        Ok(Self {
            producer,
            topic: topic.to_string(),
        })
    }

    pub async fn emit(&self, event: &AuditEvent) -> Result<(), EmitError> {
        debug_assert!(
            !event.county_id.is_empty(),
            "audit event county_id must not be empty (Kafka partition key)"
        );

        let key = event.county_id.clone();
        let payload = serde_json::to_vec(event)?;
        let record = FutureRecord::to(&self.topic).key(&key).payload(&payload);

        self.producer
            .send(record, Duration::from_secs(5))
            .await
            .map_err(|(e, _)| {
                tracing::error!(
                    audit_id = %event.audit_id,
                    county_id = %event.county_id,
                    error = %e,
                    "audit emit to kafka failed"
                );
                EmitError::Send(e.to_string())
            })?;

        tracing::debug!(audit_id = %event.audit_id, event_type = %event.event_type, "audit emitted");
        Ok(())
    }
}

#[async_trait::async_trait]
impl crate::transport::Audit for AuditEmitter {
    async fn emit(&self, event: &AuditEvent) -> Result<(), crate::transport::AuditError> {
        AuditEmitter::emit(self, event).await.map_err(|e| match e {
            EmitError::Json(je) => crate::transport::AuditError::Serialization(je.to_string()),
            other => crate::transport::AuditError::Transport(other.to_string()),
        })
    }
}
