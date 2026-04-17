use std::collections::HashMap;
use terra_sync_audit::{verify_chain, Actor, AuditEventBuilder, Outcome, Subject};

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
        attrs: HashMap::new(),
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
        metadata: HashMap::new(),
    }
    .build("");

    let e2 = AuditEventBuilder {
        event_type: "connector.pause".into(),
        actor: make_actor(),
        county_id: "benton".into(),
        subject: make_subject("connector", "benton-v1"),
        outcome: Outcome::Success,
        policy_refs: vec![],
        metadata: HashMap::new(),
    }
    .build(&e1.hash);

    let e3 = AuditEventBuilder {
        event_type: "connector.resume".into(),
        actor: make_actor(),
        county_id: "benton".into(),
        subject: make_subject("connector", "benton-v1"),
        outcome: Outcome::Success,
        policy_refs: vec![],
        metadata: HashMap::new(),
    }
    .build(&e2.hash);

    assert!(
        verify_chain(&[e1, e2, e3]).is_none(),
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
        metadata: HashMap::new(),
    }
    .build("");
    let e2 = AuditEventBuilder {
        event_type: "y".into(),
        actor: make_actor(),
        county_id: "benton".into(),
        subject: make_subject("y", "y"),
        outcome: Outcome::Success,
        policy_refs: vec![],
        metadata: HashMap::new(),
    }
    .build(&e1.hash);

    e1.event_type = "z".into();

    let broken = verify_chain(&[e1, e2]);
    assert_eq!(
        broken,
        Some(0),
        "tampered event at index 0 should be flagged"
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
        metadata: HashMap::new(),
    }
    .build("");
    let e2 = AuditEventBuilder {
        event_type: "b".into(),
        actor: make_actor(),
        county_id: "benton".into(),
        subject: make_subject("x", "x"),
        outcome: Outcome::Success,
        policy_refs: vec![],
        metadata: HashMap::new(),
    }
    .build("sha256:wrong");

    let broken = verify_chain(&[e1, e2]);
    assert_eq!(broken, Some(1));
}
