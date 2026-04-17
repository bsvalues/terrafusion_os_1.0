use std::collections::BTreeMap;
use terra_sync_audit::{
    verify_chain, Actor, AuditEvent, AuditEventBuilder, ChainBreak, Outcome, Subject,
};

fn make_actor() -> Actor {
    Actor {
        identity: "testuser".into(),
        auth_method: "mtls".into(),
        certificate_fingerprint: "sha256:AABB...".into(),
    }
}

fn make_subject(kind: &str, id: &str) -> Subject {
    Subject {
        kind: kind.into(),
        id: id.into(),
        attrs: BTreeMap::new(),
    }
}

#[test]
fn chain_of_three_events_verifies_clean() {
    let e1 = AuditEventBuilder {
        event_type: "connector.deploy".into(),
        actor: make_actor(),
        county_id: "benton".into(),
        subject: make_subject("connector", "benton-v1"),
        outcome: Outcome::Success,
        policy_refs: vec!["pacscontract.v1".into()],
        metadata: BTreeMap::new(),
    }
    .build("");

    let e2 = AuditEventBuilder {
        event_type: "connector.pause".into(),
        actor: make_actor(),
        county_id: "benton".into(),
        subject: make_subject("connector", "benton-v1"),
        outcome: Outcome::Success,
        policy_refs: vec![],
        metadata: BTreeMap::new(),
    }
    .build(&e1.hash);

    let e3 = AuditEventBuilder {
        event_type: "connector.resume".into(),
        actor: make_actor(),
        county_id: "benton".into(),
        subject: make_subject("connector", "benton-v1"),
        outcome: Outcome::Success,
        policy_refs: vec![],
        metadata: BTreeMap::new(),
    }
    .build(&e2.hash);

    assert!(
        verify_chain(&[e1, e2, e3]).is_ok(),
        "clean chain should verify"
    );
}

#[test]
fn tampered_event_detected() {
    let mut e1 = AuditEventBuilder {
        event_type: "x".into(),
        actor: make_actor(),
        county_id: "benton".into(),
        subject: make_subject("x", "x"),
        outcome: Outcome::Success,
        policy_refs: vec![],
        metadata: BTreeMap::new(),
    }
    .build("");
    let e2 = AuditEventBuilder {
        event_type: "y".into(),
        actor: make_actor(),
        county_id: "benton".into(),
        subject: make_subject("y", "y"),
        outcome: Outcome::Success,
        policy_refs: vec![],
        metadata: BTreeMap::new(),
    }
    .build(&e1.hash);

    e1.event_type = "z".into();

    assert_eq!(
        verify_chain(&[e1, e2]),
        Err((0, ChainBreak::SelfHashMismatch))
    );
}

#[test]
fn broken_prev_link_detected() {
    let e1 = AuditEventBuilder {
        event_type: "a".into(),
        actor: make_actor(),
        county_id: "benton".into(),
        subject: make_subject("x", "x"),
        outcome: Outcome::Success,
        policy_refs: vec![],
        metadata: BTreeMap::new(),
    }
    .build("");
    let e2 = AuditEventBuilder {
        event_type: "b".into(),
        actor: make_actor(),
        county_id: "benton".into(),
        subject: make_subject("x", "x"),
        outcome: Outcome::Success,
        policy_refs: vec![],
        metadata: BTreeMap::new(),
    }
    .build("sha256:wrong");

    assert_eq!(
        verify_chain(&[e1, e2]),
        Err((1, ChainBreak::PrevHashMismatch))
    );
}

#[test]
fn metadata_ordering_is_stable_across_roundtrip() {
    let mut meta = BTreeMap::new();
    meta.insert("zebra".into(), "1".into());
    meta.insert("alpha".into(), "2".into());
    meta.insert("mango".into(), "3".into());

    let e = AuditEventBuilder {
        event_type: "x".into(),
        actor: make_actor(),
        county_id: "benton".into(),
        subject: make_subject("x", "x"),
        outcome: Outcome::Success,
        policy_refs: vec![],
        metadata: meta,
    }
    .build("");

    // Round-trip through JSON and re-verify the chain of 1.
    let json = serde_json::to_string(&e).expect("serialize");
    let back: AuditEvent = serde_json::from_str(&json).expect("deserialize");
    assert_eq!(back.hash, e.hash, "hash must survive JSON round-trip");
    assert!(
        verify_chain(&[back]).is_ok(),
        "round-tripped event must still verify"
    );
}

#[test]
fn empty_chain_verifies_clean() {
    assert!(verify_chain(&[]).is_ok());
}

#[test]
fn outcome_variants_roundtrip() {
    for outcome in [Outcome::Success, Outcome::Denied, Outcome::Failed] {
        let e = AuditEventBuilder {
            event_type: "test".into(),
            actor: make_actor(),
            county_id: "benton".into(),
            subject: make_subject("x", "x"),
            outcome,
            policy_refs: vec![],
            metadata: BTreeMap::new(),
        }
        .build("");
        let json = serde_json::to_string(&e).expect("serialize");
        let back: AuditEvent = serde_json::from_str(&json).expect("deserialize");
        assert_eq!(back.outcome, outcome);
        assert!(verify_chain(&[back]).is_ok());
    }
}

#[test]
fn reordered_chain_is_detected() {
    let e1 = AuditEventBuilder {
        event_type: "a".into(),
        actor: make_actor(),
        county_id: "benton".into(),
        subject: make_subject("x", "x"),
        outcome: Outcome::Success,
        policy_refs: vec![],
        metadata: BTreeMap::new(),
    }
    .build("");
    let e2 = AuditEventBuilder {
        event_type: "b".into(),
        actor: make_actor(),
        county_id: "benton".into(),
        subject: make_subject("x", "x"),
        outcome: Outcome::Success,
        policy_refs: vec![],
        metadata: BTreeMap::new(),
    }
    .build(&e1.hash);
    let e3 = AuditEventBuilder {
        event_type: "c".into(),
        actor: make_actor(),
        county_id: "benton".into(),
        subject: make_subject("x", "x"),
        outcome: Outcome::Success,
        policy_refs: vec![],
        metadata: BTreeMap::new(),
    }
    .build(&e2.hash);

    // Reorder: e1, e3, e2. e3.prev_hash references e2 but e2 isn't there yet.
    let result = verify_chain(&[e1, e3, e2]);
    assert!(result.is_err(), "reordered chain must not verify clean");
    // First break is at index 1 (e3's prev_hash doesn't match e1's hash).
    assert_eq!(result.unwrap_err().0, 1);
}
