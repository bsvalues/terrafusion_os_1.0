use std::collections::HashMap;
use std::io::Write;
use std::path::PathBuf;
use terra_sync_policy::{ContractManifest, PolicyEvaluator};
use terra_sync_proto::policy::EvaluateRequest;

const BENTON_ID: &str = "19190019-1919-1919-1919-191919191919";

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

fn req(action: &str, county_id: &str, ctx: HashMap<String, String>) -> EvaluateRequest {
    EvaluateRequest {
        actor_identity: "test".into(),
        action: action.into(),
        resource_kind: "x".into(),
        resource_id: "x".into(),
        county_id: county_id.into(),
        context: ctx,
    }
}

#[test]
fn writeback_to_benton_is_denied_by_default() {
    let evaluator = PolicyEvaluator::new(load_manifest());
    let r = req("writeback.write", BENTON_ID, HashMap::new());
    let resp = evaluator.evaluate(&r);
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
    let r = req("topic.subscribe", BENTON_ID, ctx);
    let resp = evaluator.evaluate(&r);
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
    let r = req(
        "topic.subscribe",
        "00000000-0000-0000-0000-000000000000",
        ctx,
    );
    let resp = evaluator.evaluate(&r);
    assert!(!resp.allowed);
    assert!(resp.rule_matched.contains("deny_unknown_county"));
}

#[test]
fn unknown_action_on_known_county_is_denied() {
    let evaluator = PolicyEvaluator::new(load_manifest());
    let r = req("admin.rotate", BENTON_ID, HashMap::new());
    let resp = evaluator.evaluate(&r);
    assert!(!resp.allowed, "unknown action must not default-allow");
    assert!(
        resp.rule_matched.contains("deny_unknown_action"),
        "expected deny_unknown_action rule, got {}",
        resp.rule_matched
    );
}

#[test]
fn subscribe_with_missing_topic_context_is_denied() {
    let evaluator = PolicyEvaluator::new(load_manifest());
    let r = req("topic.subscribe", BENTON_ID, HashMap::new());
    let resp = evaluator.evaluate(&r);
    assert!(
        !resp.allowed,
        "subscribe with no topic context must be denied"
    );
}

/// Build a complete manifest YAML string for in-memory tests. `extra`
/// is appended verbatim so callers can add `amendments:` or override
/// `counties.benton.*` fields.
fn manifest_yaml(counties_body: &str, amendments_body: &str) -> String {
    manifest_yaml_with_extra_forbidden(counties_body, amendments_body, "")
}

/// Like `manifest_yaml`, but additional `forbidden_actions` entries can be
/// appended verbatim. Needed for amendment tests that reference non-default
/// actions — the load-time invariant requires every amendment `permits` entry
/// to also appear in `forbidden_actions`.
fn manifest_yaml_with_extra_forbidden(
    counties_body: &str,
    amendments_body: &str,
    extra_forbidden: &str,
) -> String {
    format!(
        r#"contract: pacscontract
version: v1
description: test manifest
defaults:
  read_only: true
  allow_subscribe_canonical: true
  require_mtls: true
counties:
{counties_body}
forbidden_actions:
  - action: writeback.write
    reason: 'base contract forbids PACS writes. Amendment required.'
{extra_forbidden}
amendments:
{amendments_body}
audit:
  all_actions_logged: true
  retention_years: 7
  worm_required: true
"#
    )
}

fn write_manifest(yaml: &str) -> tempfile::NamedTempFile {
    let mut f = tempfile::NamedTempFile::new().unwrap();
    f.write_all(yaml.as_bytes()).unwrap();
    f
}

#[test]
fn forbid_subscribe_pattern_wins_over_allow() {
    let counties = r#"  benton:
    id: '19190019-1919-1919-1919-191919191919'
    name: 'Benton'
    state: 'WA'
    vendor: harris-pacs
    read_only: true
    allow_subscribe:
      - 'sync.source.harris.benton.*'
    forbid_subscribe:
      - 'sync.source.harris.benton.secret.*'
    active_amendments: []
"#;
    let yaml = manifest_yaml(counties, "  {}");
    let f = write_manifest(&yaml);
    let manifest = ContractManifest::load_from_path(f.path()).unwrap();
    let evaluator = PolicyEvaluator::new(manifest);

    let mut ctx = HashMap::new();
    ctx.insert(
        "topic".into(),
        "sync.source.harris.benton.secret.pii".into(),
    );
    let r = req("topic.subscribe", BENTON_ID, ctx);
    let resp = evaluator.evaluate(&r);
    assert!(
        !resp.allowed,
        "forbid_subscribe must win over allow_subscribe"
    );
    assert!(
        resp.rule_matched.contains("forbid_subscribe"),
        "expected forbid_subscribe rule, got {}",
        resp.rule_matched
    );
}

#[test]
fn writeback_permitted_by_ratified_amendment() {
    let counties = r#"  benton:
    id: '19190019-1919-1919-1919-191919191919'
    name: 'Benton'
    state: 'WA'
    vendor: harris-pacs
    read_only: true
    allow_subscribe: []
    active_amendments:
      - amend-001
"#;
    let amendments = r#"  amend-001:
    id: amend-001
    permits:
      - writeback.write
    ratified: true
"#;
    let yaml = manifest_yaml(counties, amendments);
    let f = write_manifest(&yaml);
    let manifest = ContractManifest::load_from_path(f.path()).unwrap();
    let evaluator = PolicyEvaluator::new(manifest);

    let r = req("writeback.write", BENTON_ID, HashMap::new());
    let resp = evaluator.evaluate(&r);
    assert!(
        resp.allowed,
        "ratified amendment listing writeback.write must permit it; rule={} reason={}",
        resp.rule_matched, resp.reason
    );
    assert!(resp.rule_matched.contains("amendment_permits"));
}

#[test]
fn writeback_denied_when_amendment_permits_omits_action() {
    // Ratified amendment exists and is active for the county, but its
    // `permits` list does not include `writeback.write`. The action must
    // still be denied — this covers the branch where the amendment lookup
    // succeeds but the action-string comparison fails.
    let counties = r#"  benton:
    id: '19190019-1919-1919-1919-191919191919'
    name: 'Benton'
    state: 'WA'
    vendor: harris-pacs
    read_only: true
    allow_subscribe: []
    active_amendments:
      - amend-partial
"#;
    let amendments = r#"  amend-partial:
    id: amend-partial
    permits:
      - some.other.action
    ratified: true
"#;
    // `some.other.action` must also appear in `forbidden_actions` to
    // satisfy the load-time invariant that amendments may only grant
    // globally-forbidden actions.
    let extra_forbidden = "  - action: some.other.action\n    reason: test fixture\n";
    let yaml = manifest_yaml_with_extra_forbidden(counties, amendments, extra_forbidden);
    let f = write_manifest(&yaml);
    let manifest = ContractManifest::load_from_path(f.path()).unwrap();
    let evaluator = PolicyEvaluator::new(manifest);

    let r = req("writeback.write", BENTON_ID, HashMap::new());
    let resp = evaluator.evaluate(&r);
    assert!(
        !resp.allowed,
        "amendment that doesn't permit writeback.write must not allow it; rule={}",
        resp.rule_matched
    );
}

#[test]
fn writeback_denied_when_amendment_unratified() {
    let counties = r#"  benton:
    id: '19190019-1919-1919-1919-191919191919'
    name: 'Benton'
    state: 'WA'
    vendor: harris-pacs
    read_only: true
    allow_subscribe: []
    active_amendments:
      - amend-001
"#;
    let amendments = r#"  amend-001:
    id: amend-001
    permits:
      - writeback.write
    ratified: false
"#;
    let yaml = manifest_yaml(counties, amendments);
    let f = write_manifest(&yaml);
    let manifest = ContractManifest::load_from_path(f.path()).unwrap();
    let evaluator = PolicyEvaluator::new(manifest);

    let r = req("writeback.write", BENTON_ID, HashMap::new());
    let resp = evaluator.evaluate(&r);
    assert!(
        !resp.allowed,
        "unratified amendment must not permit writeback; rule={}",
        resp.rule_matched
    );
}
