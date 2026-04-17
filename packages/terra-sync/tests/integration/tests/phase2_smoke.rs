//! Phase 2 integration smoke — exercises policy manifest loading and
//! the hash-chained audit event model at integration boundaries.
//!
//! The full Debezium + Kafka + Arroyo + RisingWave topology is tested
//! by the runbook in `deploy/PHASE1-EXIT-GATE.md` plus the Phase 2
//! exit-gate observation in Task 16. This harness is the always-green
//! in-process integration baseline that CI runs on every commit.
//!
//! Expansion (Phase 2.1): testcontainers-backed Kafka smoke that
//! exercises `AuditEmitter` against a real broker, and a tonic smoke
//! test that spawns terra-sync-control and exercises its gRPC surface.

use std::collections::BTreeMap;
use std::path::PathBuf;

#[tokio::test]
async fn policy_manifest_loads_from_disk() {
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .parent()
        .unwrap()
        .parent()
        .unwrap()
        .parent()
        .unwrap()
        .join("docs/spec-lock/locks/pacscontract/v1/manifest.yaml");

    let m = terra_sync_policy::ContractManifest::load_from_path(&path)
        .expect("manifest loads from locked path");

    assert!(
        m.counties.contains_key("benton"),
        "benton county must be present in pacscontract.v1"
    );
}

#[tokio::test]
async fn audit_chain_from_multiple_events_verifies() {
    use terra_sync_audit::{verify_chain, Actor, AuditEventBuilder, Outcome, Subject};

    let actor = Actor {
        identity: "test".into(),
        auth_method: "mtls".into(),
        certificate_fingerprint: "sha256:x".into(),
    };
    let sub = Subject {
        kind: "connector".into(),
        id: "benton".into(),
        attrs: BTreeMap::new(),
    };

    let mut prev = String::new();
    let mut chain = Vec::new();
    for i in 0..10 {
        let e = AuditEventBuilder {
            event_type: format!("event_{i}"),
            actor: actor.clone(),
            county_id: "benton".into(),
            subject: sub.clone(),
            outcome: Outcome::Success,
            policy_refs: vec!["pacscontract.v1".into()],
            metadata: BTreeMap::new(),
        }
        .build(&prev);
        prev = e.hash.clone();
        chain.push(e);
    }

    assert!(
        verify_chain(&chain).is_ok(),
        "10-event chain must verify clean"
    );
}
