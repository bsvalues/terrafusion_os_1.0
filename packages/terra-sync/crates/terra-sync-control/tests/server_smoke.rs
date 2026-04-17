//! Smoke test: the service compiles and can be instantiated. End-to-end
//! tests live in tests/integration/phase2_smoke.rs once the full topology
//! is up.

use std::collections::BTreeMap;
use std::path::PathBuf;
use std::sync::Arc;
use terra_sync_audit::{Actor, Audit, AuditEventBuilder, NullAudit, Outcome, Subject};
use terra_sync_policy::{ContractManifest, PolicyEvaluator};

#[test]
fn policy_evaluator_constructs() {
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
    let m = ContractManifest::load_from_path(&path).unwrap();
    let _eval: Arc<PolicyEvaluator> = Arc::new(PolicyEvaluator::new(m));
}

#[test]
fn audit_event_builder_produces_genesis() {
    let e = AuditEventBuilder {
        event_type: "control_plane.start".into(),
        actor: Actor {
            identity: "system".into(),
            auth_method: "system".into(),
            certificate_fingerprint: String::new(),
        },
        county_id: String::new(),
        subject: Subject {
            kind: "service".into(),
            id: "control-plane".into(),
            attrs: BTreeMap::new(),
        },
        outcome: Outcome::Success,
        policy_refs: vec![],
        metadata: BTreeMap::new(),
    }
    .build("");
    assert!(e.hash.starts_with("sha256:"));
    assert_eq!(e.prev_hash, "");
}

#[tokio::test]
async fn null_audit_transport_is_usable_in_service() {
    let _audit: Arc<dyn Audit> = Arc::new(NullAudit);
}
