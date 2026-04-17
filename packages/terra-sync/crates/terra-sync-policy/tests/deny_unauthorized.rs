use std::collections::HashMap;
use std::path::PathBuf;
use terra_sync_policy::{ContractManifest, PolicyEvaluator};
use terra_sync_proto::policy::EvaluateRequest;

fn load_manifest() -> ContractManifest {
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
    ContractManifest::load_from_path(&path).unwrap()
}

#[test]
fn writeback_to_benton_is_denied_by_default() {
    let evaluator = PolicyEvaluator::new(load_manifest());
    let req = EvaluateRequest {
        actor_identity: "test".into(),
        action: "writeback.write".into(),
        resource_kind: "canonical-row".into(),
        resource_id: "Properties/...".into(),
        county_id: "19190019-1919-1919-1919-191919191919".into(),
        context: HashMap::new(),
    };
    let resp = evaluator.evaluate(&req);
    assert!(
        !resp.allowed,
        "writeback must be denied under base pacscontract.v1"
    );
    assert!(resp.reason.contains("Amendment required") || resp.reason.contains("amendment"));
}

#[test]
fn subscribe_to_allowed_topic_is_permitted() {
    let evaluator = PolicyEvaluator::new(load_manifest());
    let mut ctx = HashMap::new();
    ctx.insert("topic".into(), "sync.source.harris.benton.property".into());
    let req = EvaluateRequest {
        actor_identity: "arroyo".into(),
        action: "topic.subscribe".into(),
        resource_kind: "topic".into(),
        resource_id: "sync.source.harris.benton.property".into(),
        county_id: "19190019-1919-1919-1919-191919191919".into(),
        context: ctx,
    };
    let resp = evaluator.evaluate(&req);
    assert!(
        resp.allowed,
        "allowed topic must permit subscribe; rule={}",
        resp.rule_matched
    );
}

#[test]
fn subscribe_to_unregistered_county_is_denied() {
    let evaluator = PolicyEvaluator::new(load_manifest());
    let mut ctx = HashMap::new();
    ctx.insert("topic".into(), "sync.canonical.property".into());
    let req = EvaluateRequest {
        actor_identity: "arroyo".into(),
        action: "topic.subscribe".into(),
        resource_kind: "topic".into(),
        resource_id: "sync.canonical.property".into(),
        county_id: "00000000-0000-0000-0000-000000000000".into(),
        context: ctx,
    };
    let resp = evaluator.evaluate(&req);
    assert!(!resp.allowed);
    assert!(resp.rule_matched.contains("deny_unknown_county"));
}
