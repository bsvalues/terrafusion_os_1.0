# WO-MAO-005 - Evidence-Informed Agent Playbooks Evidence

**Program:** `PROGRAM-MAO-001`
**Goal / loop:** `GOAL-MAO-001` / `LOOP-MAO-001`
**Base:** `4b3c38a8eed9858ed72cc27ffcbd9c0d8456b7c9`
**Authority:** `OWNER-PROGRAM-MAO-001-R3-CONTINUATION-ENVELOPE`

## Atomic State Transition

MAO-004 is complete through PR #1286 and merge commit
`4b3c38a8eed9858ed72cc27ffcbd9c0d8456b7c9`. The owner ratified the exact continuation-envelope
proposal on that base. At activation, the register made the envelope active, MAO-005 current, and
MAO-006 next. No per-PR owner grant is required for eligible MAO-005 through MAO-007 work.

MAO-005 completed through PR #1287 at exact head
`3ac224136a162440ea8376c15213c9e46a135fbe` and merge commit
`d08dd16ebfde5bd96ee3830a0eb9bff91cce74b8`. The PR changed 16 authorized files,
retained 16 collision-free exact-path reservations, passed independent exact-head assurance and
required checks, and merged with zero unresolved review threads.

## Evidence-to-Rule Traceability

| Playbook | Primary evidence | Key rule derived from evidence |
|----------|------------------|--------------------------------|
| Codex orchestrator | MAO-002, MAO-003, MAO-004 | Operator owns mutable state, enforces reservations, and dispatches only governed conflict-free waves. |
| Claude cross-repo worker | MAO-002, path canon | One worker/worktree/PR and no cross-repo allocation without canonical identity. |
| Independent assurance | MAO-002 assurance | Separate read-only exact-head verdict; any head change invalidates it. |
| PR check monitor | MAO-002 remediation | Remote truth is head-bound; required failures are not bypassed or reclassified. |
| Failure/retry/reassignment | MAO-003 lifecycle | Stale/colliding claims require release, renewal, or reciprocal handoff; retries do not route around gates. |
| Operator brief | MAO-004 planner | Start only planner-selected eligible work within the authorized worker budget; a blocked lane does not freeze unrelated lanes. |

## Honest Claims

The playbooks do not claim that the disjoint MAO-002 pilot proved collision enforcement, that the
MAO-003 gate selects work, or that the MAO-004 planner performs dispatch or grants authority. They
remain subordinate to the Constitution, Brain hierarchy, mandatory agent policy, Merge Authority
Model, and active owner envelope.

## Scope And Safety

Only the six new playbooks and named MAO governance/routing/evidence files change. No runtime,
backend, frontend, product, package, lockfile, tools-sync, CI, workflow, branch protection,
deployment, production, county, PACS, SQL, credentials, secrets, destructive operations, or
existing mandatory policy changes are included.

## Rollback

Use a normal protected revert PR to remove these subordinate documents and restore the prior
MAO-004-current routing state. Do not rewrite `main`.

STOP_TYPE: MAO_005_PLAYBOOK_EVIDENCE_COMPLETE
