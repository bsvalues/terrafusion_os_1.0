# WO-MAO-006 - Portfolio Rollout Evidence

**Program:** `PROGRAM-MAO-001`
**Goal / loop:** `GOAL-MAO-001` / `LOOP-MAO-001`
**Base:** `d08dd16ebfde5bd96ee3830a0eb9bff91cce74b8`
**Authority:** `OWNER-PROGRAM-MAO-001-R3-CONTINUATION-ENVELOPE`

## Verified Baseline

PR #1287 merged MAO-005 from exact head `3ac224136a162440ea8376c15213c9e46a135fbe`
at `2026-07-15T15:55:43Z` as merge commit
`d08dd16ebfde5bd96ee3830a0eb9bff91cce74b8`. It changed 16 authorized files, passed
independent exact-head assurance and required checks, resolved all four review threads, and retained
16 collision-free exact-path reservations. One advisory post-merge evidence-release upload failed;
it did not fail a required PR check and does not justify reverting the merge.

## Concurrency Budget

| Control | Value | Evidence / reason |
|---------|-------|-------------------|
| Mutable worker ceiling | 2 | Canonical MAO-004 planner default; no increase is authorized or measured. |
| Effective MAO-006 capacity | 1 | MAO-006 depends on MAO-005 and MAO-007 depends on MAO-006. |
| Read-only assurance | Separate role | It does not mutate a worktree and is not counted as a mutable slot. |
| Spare mutable capacity | Not dispatchable | The envelope authorizes MAO-005 through MAO-007 only, not unrelated portfolio work. |

Three concurrent read-only research passes informed allocation, concurrency/cross-repository, and
operations/rollback drafting. They modified no files. No durable task/result artifact was retained,
so they are not counted as independent assurance or reproducible program evidence. The formal
exact-head assurance required before merge remains a separate control.

## Live Planner And Query Truth

The command
`node docs/brain/workorders/tools/wo-wave-plan.mjs --json --authority R3 --max-workers 2`
returned an empty initial executable set and no waves. The seed registry has no MAO nodes, and its
remaining ready-looking candidates lack valid `allowedFiles` reservation arrays. This is an input
quality gap. The advisory query still recommends `WO-LOCALOPS-000`; the executable planner excludes
it for invalid reservation input. No dispatch is authorized from either result.

## Agent Allocation Map

| Portfolio class | Intended allocation | Current disposition |
|-----------------|---------------------|---------------------|
| OS / governance | Codex orchestrator, isolated mutable worker, independent assurance, check monitor | Executable only for MAO-006 and MAO-007 within the exact envelope. |
| Suite | Claude suite worker subordinate to Codex | Prospective only; cross-repository identity is not canonical. |
| Infrastructure | Bounded evidence worker plus assurance | Outside the envelope; deployment, Azure, county, SQL, and live resources remain protected. |
| Security | Independent read-only assurance | Executable as assurance only; it cannot grant authority or approve exceptions. |
| Release | Read-only check monitor plus exact-head assurance and Mode B operator | Executable for MAO PR lifecycle only; required checks may not be bypassed. |

## Cross-Repository Contract Schedule

1. Keep MAO-006 and MAO-007 in `bsvalues/terrafusion_os_1.0` with exact reservations.
2. Establish `PATH_CANON_REGISTER.md` under separate authority; repository names and clone paths are
   insufficient.
3. Design repository-qualified planner inputs; the current planner accepts one canonical repository.
4. Design reservation aggregation; the current gate loads one repository's open PR assignments.
5. Run a read-only two-repository fixture at R3 with a two-worker ceiling.
6. Only after that proof, seek a bounded two-repository pilot with one mutable worker per repository.
7. Keep the ceiling at 2 until measured violations, cycle time, and suspension behavior justify a
   change.

`PATH_CANON_REGISTER.md` alone would not make cross-repository dispatch ready. Planner federation,
reservation aggregation, and a fresh bounded authority packet would still be required.

## Portfolio Status Surface

Every snapshot must record:

- origin/main SHA, freshness, contradictions, program, goal, loop, current WO, and next WO;
- authority ID, status, risk ceiling, expiry, trigger state, and whether owner action is required;
- planner input identity, worker budget, eligible/selected/blocked/deferred nodes;
- for each lane: repository, WO, branch, worktree, worker, PR, exact head, reservations, checks,
  unresolved threads, assurance, merge mode, incident state, and next operator action;
- metrics: founder routing touches, active mutable lanes, peak concurrency, median cycle time,
  collisions, violations reaching main, unauthorized-scope merges, false completion, retries, and
  reassignment;
- unknown fields and evidence links. Unknown values remain `UNKNOWN`.

## Owner Brief Cadence

| Event | Cadence | Owner interaction |
|-------|---------|-------------------|
| Operator state | Continuous machine-readable update | None |
| Active digest | Daily while active | Informational delta only |
| Wave completion | Once per completed wave | Evidence summary only |
| Program closeout | Once after MAO-007 | Outcome and next recommendation |
| True authority wall | Immediate | One bounded decision packet |
| PR, SHA, reservation, remediation, routing | Never as owner tasks | Codex-maintained state |

## Incident And Rollback Procedure

1. Bind the incident to repository, WO, PR, head, worker, authority, and reservations.
2. Stop mutation and merge for the affected lane; preserve worktree, commits, logs, checks, and
   assurance.
3. Classify transient service, worker, branch, reservation, assurance, protected-boundary, false
   evidence, or post-merge failure.
4. Retry only canonically transient read-only failures on unchanged head and scope. Never bypass a
   required check.
5. Quarantine failed worker state; reassign only after exclusive ownership and unique commits are
   proven.
6. Keep collision or stale claims blocking until release, renewal, or reciprocal handoff.
7. Fail closed on every active-envelope revocation trigger. No Mode B merge proceeds while authority
   is suspended, expired, revoked, or contradicted.
8. Before merge, require repaired branch state, fresh checks, zero unresolved threads, and fresh
   exact-head assurance.
9. After merge, use a normal protected revert PR against the exact merge commit. Never rewrite
   `main`.
10. Verify reverted main, close or release reservations, attach incident evidence, and recompute the
    next wave.

The PR #1287 evidence-release upload failure is classified as an advisory publishing-capacity
incident. Preserve its generated evidence and route capacity remediation separately; do not roll
back the valid merge solely for that upload failure.

## Intentional Non-Claims

- Cross-repository dispatch is not ready.
- The seed registry is not a production-ready portfolio graph.
- The current empty planner wave does not mean the portfolio backlog is empty.
- Read-only analysis concurrency does not establish a higher mutable-worker budget.
- MAO-006 grants no authority outside the recorded R3 envelope.

## Next

WO-MAO-007 will roll up measured outcomes, classify remaining gaps, complete or suspend the active
envelope based on evidence, and close the program without inventing a next-wave capability.

STOP_TYPE: MAO_006_PORTFOLIO_ROLLOUT_EVIDENCE_COMPLETE
