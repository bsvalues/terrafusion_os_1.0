# P7 — AI / Brain / Operator System

**Program:** Brain Operator System

**Goal:** `GOAL-BRAIN-OPERATOR-001`

**Loop:** `LOOP-BRAIN-OPERATOR-001`

**Status:** EVIDENCE BASELINE COMPLETE at WO-BRAIN-009 (PARTIAL / INTEGRATION GAP — see
`evidence/WO-BRAIN-009-BRAIN-WOE-INTEGRATION-EVIDENCE.md`). Next: **portfolio reconciliation** (no lane
preselected).

**Last Updated:** 2026-07-12

---

## Goal

Operationalize the one-Brain model. TerraFusion Brain (Cortex) owns queue, sequencing, WOs, risk classification, proof, review-diff, and commit-plan. Suites get domain knowledge packs, not their own brains. This program audits what exists, closes capability gaps, and formalizes the operator command vocabulary.

---

## Governing Rule

> One TerraFusion Brain owns sequencing. Suites get domain packs. No suite brain owns WO queue or deployment gates.

---

## Sovereignty Boundary

| Allowed | Blocked |
|---------|---------|
| Brain authority docs | Autonomous deployment |
| Domain pack definition | Brain bypassing stop gates |
| Operator command spec | Suite-level queue ownership |
| Memory/provenance review | Contradicting operator decisions |
| Agent role docs | Cross-Brain WO assignment |

---

## Work Orders (Ordered)

| WO | Title | Status | Description |
|----|-------|--------|-------------|
| WO-BRAIN-001 | Brain authority and current capability audit | COMPLETE | PR #1140; implemented vs. aspirational capability truth |
| WO-BRAIN-002 | Domain pack completeness audit | COMPLETE | Eight packs structurally complete; routing gaps classified |
| WO-BRAIN-003 | Operator command vocabulary cleanup | COMPLETE | Command classes and stale routes reconciled |
| WO-BRAIN-004 | Goal engine maturity review | COMPLETE | Goal is real doctrine; selector is operator-executed, not a CLI engine |
| WO-BRAIN-005 | Loop engine maturity review | COMPLETE | `/loop` is real operator procedure; no standalone scheduler is implemented |
| WO-BRAIN-006 | Memory/provenance integration | COMPLETE | Repository memory exists but freshness and loading are environment-dependent |
| WO-BRAIN-007 | Agent role and stop-gate policy | COMPLETE | Functional roles consolidated under one operator and root stop gates |
| WO-BRAIN-008 | Autonomous continuation rulebook | COMPLETE | Canonical `CONTINUATION_RULEBOOK.md` — scopes, portfolio reconciliation, wall parking, true-stop, live-vs-historical authority |
| WO-BRAIN-009 | Brain/WOE integration evidence packet | **COMPLETE (PARTIAL / INTEGRATION GAP)** | Query + scoring are real/deterministic but read a stale June-29 representative seed, so output ≠ live graph; doctrine not wired to one live machine-readable source. Baseline closed honestly; live wiring deferred. |

---

## WO-BRAIN-001 Definition

**Goal:** Audit what the TerraFusion Brain currently does vs. what is documented in `docs/brain/BRAIN_AUTHORITY.md` and `docs/brain/CORTEX_MODES.md`. Produce a capabilities truth table: capability → documented → evidence → gap.

**Outputs:**
- `docs/brain/WO_BRAIN_001_CAPABILITY_AUDIT.md`

## Executable Chain: WO-BRAIN-002 Through WO-BRAIN-009

All nodes default to R0 discovery plus R1 evidence updates. They may continue automatically in this
goal and loop. Stop before implementation, runtime behavior, CI, package/lockfile, protected data,
secrets, deployment, or a new autonomous authority.

### WO-BRAIN-002 - Domain Pack Completeness Audit

- **Mode:** read-only inventory, then evidence/docs.
- **Dependency:** BRAIN-001 complete.
- **Deliverable:** `docs/brain/workorders/evidence/WO-BRAIN-002-DOMAIN-PACK-COMPLETENESS-AUDIT.md`.
- **Validation:** pack paths, canon links, allowed/forbidden writes, routing, proof, and escalation
  fields; `git diff --check`; `wo-query --json`.
- **Next:** BRAIN-003.

### WO-BRAIN-003 - Operator Command Vocabulary Reconciliation

- **Mode:** docs/governance reconciliation.
- **Dependency:** BRAIN-002.
- **Deliverable:** canonical command inventory with duplicate, stale, ambiguous, and missing routes.
- **Blocked:** executable CLI changes.
- **Next:** BRAIN-004.

### WO-BRAIN-004 - Goal Engine Maturity Review

- **Mode:** read-only evidence plus docs.
- **Dependency:** BRAIN-003.
- **Deliverable:** documented-versus-operational `/goal` capability matrix.
- **Blocked:** goal runtime implementation.
- **Next:** BRAIN-005.

### WO-BRAIN-005 - Loop Engine Maturity Review

- **Mode:** read-only evidence plus docs.
- **Dependency:** BRAIN-004.
- **Deliverable:** continuation, recovery, wall, and merge-watch truth matrix.
- **Blocked:** autonomous runner or scheduler implementation.
- **Next:** BRAIN-006.

### WO-BRAIN-006 - Memory And Provenance Integration Audit

- **Mode:** read-only provenance audit plus docs.
- **Dependency:** BRAIN-005.
- **Deliverable:** source, freshness, ownership, mutation, and non-claim matrix.
- **Blocked:** memory writes, ingestion, external stores, or secrets.
- **Next:** BRAIN-007.

### WO-BRAIN-007 - Agent Role And Stop-Gate Matrix

- **Mode:** governance evidence.
- **Dependency:** BRAIN-006.
- **Deliverable:** agent authority, allowed actions, mandatory walls, and escalation matrix.
- **Blocked:** granting new runtime or production authority.
- **Next:** BRAIN-008.

### WO-BRAIN-008 - Autonomous Continuation Rulebook Reconciliation

- **Mode:** doctrine reconciliation.
- **Dependency:** BRAIN-007.
- **Deliverable:** one-Brain continuation rules reconciled with portfolio, WOE, and operator canon.
- **Blocked:** runner, queue service, or autonomous mutation implementation.
- **Next:** BRAIN-009.

### WO-BRAIN-009 - Brain/WOE Integration Evidence Packet

- **Mode:** read-only integration proof and closeout.
- **Dependency:** BRAIN-008.
- **Deliverable:** evidence that current query, scoring, routing, wall, and operator surfaces agree;
  contradictions and implementation gaps remain explicit.
- **Blocked:** rewiring `brain next`, schema changes, or runtime implementation.
- **Next:** portfolio reconciliation.

---

## Dependency Chain

```
001 → 002 → 003 ─┐
                  ├─ 004, 005, 006, 007 (can be parallel) → 008 → 009
```

WO-BRAIN-009 is the integration gate — proves the Brain+WOE system is functional end-to-end.

---

## Stop Conditions

- Stop if canon conflicts on one-Brain authority or a node requires implementation outside the
  evidence/docs boundary.
- Do not add Brain capabilities that expand autonomous action scope without operator approval
