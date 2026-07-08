# WO-REL-003 - Release Candidate Evidence Packet Template

Date: 2026-07-07
Work order: WO-REL-003
Program: Release Engineering
Goal: GOAL-TF-RELEASE-ENGINEERING-001
Loop: LOOP-TF-RELEASE-ENGINEERING-001
Mode: docs/template only

## Result

RESULT: PASS

Release Engineering now has a canonical release candidate evidence packet template. The template
turns `WO-REL-002` release gate doctrine into a repeatable evidence artifact for future release
candidate decisions without declaring a release, creating a tag, changing CI, deploying, executing
rollback, touching runtime code, or crossing county/PACS/secrets boundaries.

## Scope Authorization

This work order is documentation/governance only under `docs/brain/workorders/**`.

Authorized changes:

- create this release candidate evidence packet template,
- update Release Engineering program/routing docs as needed.

Not authorized:

- GitHub Actions or Azure Pipelines changes,
- branch protection changes,
- release automation,
- deployment scripts,
- runtime/backend/frontend/tools-sync implementation,
- schema or migration execution,
- secrets, county SQL, PACS/CAMA, production systems, or live services,
- real git tags or GitHub releases,
- rollback execution.

## Template Usage

Copy this template for a future release candidate packet. Replace every bracketed value before a
candidate can be evaluated.

```text
# Release Candidate Evidence Packet

Release candidate ID:
[RC-ID]

Release candidate SHA:
[exact git SHA being certified]

Source branch or tag:
[branch or tag name]

Evidence packet path:
[path to this candidate evidence packet]

Prepared by:
[operator]

Prepared at:
[timestamp and timezone]

Decision:
[PASS | HOLD | FAIL]
```

## Candidate Identity

| Field | Required value |
|-------|----------------|
| Release candidate ID | `[RC-ID]` |
| Candidate SHA | `[exact SHA]` |
| Source branch/tag | `[branch-or-tag]` |
| PR range | `[included PR numbers or commit range]` |
| Included Work Orders | `[WO list]` |
| Excluded Work Orders | `[explicit exclusions]` |
| Evidence packet path | `[path]` |

Rules:

- The candidate SHA is mandatory.
- The SHA must be revalidated if `main`, the release branch, or the candidate branch moves.
- A candidate packet must not inherit an older baseline silently.
- A candidate packet is evidence, not deployment authorization.

## Required Checks

Record the exact workflow/check name and final result.

| Check | Required? | Result | Evidence URL | Notes |
|-------|-----------|--------|--------------|-------|
| `governed-spine` | yes | `[pass/hold/fail]` | `[url]` | Protected-branch governance invariant. |
| `phase85-tools` | yes | `[pass/hold/fail]` | `[url]` | Tool-governance invariant. |
| `phase86-toolrunner` | yes | `[pass/hold/fail]` | `[url]` | Toolrunner invariant. |
| `🔒 TerraFusion Seal Gate` | yes | `[pass/hold/fail]` | `[url]` | Constitutional seal gate. |
| `🧪 Tier-1 UI Harness Validation` | yes | `[pass/hold/fail]` | `[url]` | Required UI harness gate. |
| `Backend Build` or current backend build gate | yes | `[pass/hold/fail]` | `[url]` | Must preserve zero-warning posture or document warning disposition. |
| `Backend Tests` or current backend test gate | yes | `[pass/hold/fail]` | `[url]` | Docker/Testcontainers blockers must be dispositioned. |
| `Migration Apply Check` | conditional | `[pass/hold/fail/not applicable]` | `[url]` | Required when migration-relevant files change. |
| `git diff --check` | yes | `[pass/hold/fail]` | `[local evidence]` | Required for candidate packet hygiene. |
| `node docs/brain/workorders/tools/wo-query.mjs --json` | yes | `[pass/hold/fail]` | `[local evidence]` | Required for work-order governance docs. |

## Advisory Checks

| Check | Advisory condition | Result | Evidence URL | Disposition |
|-------|--------------------|--------|--------------|-------------|
| Frontend build | Required only when frontend is in release scope. | `[result]` | `[url]` | `[disposition]` |
| OS Shell build | Required only when OS shell is in release scope. | `[result]` | `[url]` | `[disposition]` |
| Azure PR validation | Advisory unless Azure validation is selected as release surface. | `[result]` | `[url]` | `[disposition]` |
| Release summary | Supporting evidence only. | `[result]` | `[url]` | `[disposition]` |

## Backend OE Evidence Links

Reference Backend OE evidence. Do not duplicate or reinterpret it without noting the change.

| Backend OE evidence | Candidate relevance | Status |
|---------------------|---------------------|--------|
| `docs/brain/workorders/evidence/WO-BACKEND-OE-009-BACKEND-RELEASE-GATE-DEFINITION.md` | Release gate criteria. | `[linked/disposition]` |
| `docs/brain/workorders/evidence/WO-BACKEND-OE-012-BACKEND-OPERATIONAL-PACKET.md` | Operational packet, boundaries, rollback path, non-claims. | `[linked/disposition]` |
| `docs/brain/workorders/evidence/WO-BACKEND-OE-011-DIAGNOSTICS-OBSERVABILITY-MAP.md` | Diagnostics and observability signals. | `[linked/disposition]` |
| `docs/brain/workorders/runbooks/BACKEND_OPERATIONAL_RUNBOOK.md` | Operator validation and triage. | `[linked/disposition]` |
| `docs/brain/workorders/evidence/WO-BACKEND-OE-007-MIGRATION-ROLLBACK-PROOF-REGISTER.md` | Migration and rollback source evidence. | `[linked/disposition]` |
| `docs/brain/workorders/evidence/WO-BACKEND-OE-008-DAIS-WORKFLOW-E2E-PROOF-EXPANSION-PLAN.md` | Dais E2E planned proof and gaps. | `[linked/disposition]` |
| `docs/brain/workorders/evidence/WO-BACKEND-OE-006-SECURITY-AUTH-COUNTY-ISOLATION-PROOF-MATRIX.md` | Security/auth/county/audit proof. | `[linked/disposition]` |
| `docs/brain/workorders/evidence/WO-BACKEND-OE-013-EVIDENCE-ROLLUP-PROGRAM-CLOSEOUT.md` | Backend OE closeout and deferred risks. | `[linked/disposition]` |

## Rollback Evidence

| Rollback evidence class | Existing proof | Missing proof | Decision impact |
|-------------------------|----------------|---------------|-----------------|
| Docs-only rollback | `[evidence]` | `[missing]` | `[PASS/HOLD/FAIL]` |
| Config rollback | `[evidence]` | `[missing]` | `[PASS/HOLD/FAIL]` |
| Feature-flag rollback | `[evidence]` | `[missing]` | `[PASS/HOLD/FAIL]` |
| Dependency rollback | `[evidence]` | `[missing]` | `[PASS/HOLD/FAIL]` |
| Migration rollback | `[evidence]` | `[missing]` | `[PASS/HOLD/FAIL]` |
| Deployment rollback | `[evidence]` | `[missing]` | `[PASS/HOLD/FAIL]` |
| Full revert | `[evidence]` | `[missing]` | `[PASS/HOLD/FAIL]` |

Rules:

- Source rollback paths are not execution proof.
- Migration `Down` methods are not migration rollback execution proof.
- Production rollback proof requires separate production/deployment/secrets authorization.
- County-runtime rollback proof requires a County Runtime owner decision.

## PASS / HOLD / FAIL Decision

### PASS

Use PASS only when:

- candidate SHA is explicit,
- required checks are green or explicitly acceptable,
- Backend OE evidence is linked,
- rollback evidence and missing rollback proof are accurately stated,
- Docker/Testcontainers integration status is dispositioned,
- health/readiness, service registry, security, migration, Dais, runbook, diagnostics, and
  operational packet evidence are not overclaimed,
- intentional non-claims are listed.

### HOLD

Use HOLD when:

- required evidence is pending, stale, or missing,
- release branch or SHA moved without refreshed evidence,
- Docker/Testcontainers integration lane is needed but not passed or dispositioned,
- rollback execution proof is required but absent,
- advisory checks fail inside claimed release scope,
- county/runtime/production/secrets/PACS boundaries are implicated.

### FAIL

Use FAIL when:

- required checks fail for code or governance reasons,
- evidence contradicts Backend OE,
- release claims exceed rollback, migration, readiness, service registry, security, Dais, or
  diagnostics proof,
- unauthorized runtime, CI, workflow, deployment, schema, county, PACS, or secrets changes occurred,
- candidate SHA or required evidence is omitted.

## Intentional Non-Claims

This release candidate packet does not claim:

- production deployment authorization,
- production release readiness unless all required evidence is present,
- county runtime readiness,
- PACS/CAMA readiness,
- secrets access,
- migration or rollback execution proof unless separately evidenced,
- CI/workflow enforcement changes,
- branch protection changes,
- runtime/backend/frontend/tools-sync implementation changes.

## Required Final Packet Summary

```text
RESULT:
RELEASE_CANDIDATE_ID:
RELEASE_CANDIDATE_SHA:
SOURCE_BRANCH_OR_TAG:
REQUIRED_CHECKS:
ADVISORY_CHECKS:
BACKEND_OE_EVIDENCE:
ROLLBACK_EVIDENCE:
MISSING_EVIDENCE:
NON_CLAIMS:
DECISION: PASS | HOLD | FAIL
OWNER_DECISION_NEEDED:
NEXT_ACTION:
```

## WO-REL-003 Validation Summary

Validation required before PR:

- `git diff --check`
- `node docs/brain/workorders/tools/wo-query.mjs --json`
- scope inspection confirms docs/governance only
- runtime/backend/tools-sync implementation changed: no
- CI/workflow/deployment changed: no
- county/PACS/secrets/live resources touched: no

## Recommended Next Work Order

`WO-REL-004 - Release Tag / Version Evidence Model`

