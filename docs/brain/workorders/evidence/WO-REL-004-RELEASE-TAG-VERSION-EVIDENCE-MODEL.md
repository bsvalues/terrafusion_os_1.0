# WO-REL-004 - Release Tag / Version Evidence Model

Date: 2026-07-08
Work order: WO-REL-004
Program: Release Engineering
Goal: GOAL-TF-RELEASE-ENGINEERING-001
Loop: LOOP-TF-RELEASE-ENGINEERING-001
Mode: docs/governance only
Current lane base: `c33ba9b6c130ceebdc85d88fab65210c378d00e0`

## Result

RESULT: PASS

Release Engineering now has a canonical tag and version evidence model. The model defines how a
future release candidate packet may propose a release name, version, tag, and evidence bundle
without creating a real tag, creating a GitHub release, changing release automation, changing CI,
deploying, touching runtime code, executing rollback, or crossing county/PACS/secrets boundaries.

## Scope Authorization

This work order is documentation/governance only under `docs/brain/workorders/**`.

Authorized changes:

- create the release tag/version evidence model,
- update Release Engineering program/routing docs as needed.

Not authorized:

- real git tag creation,
- GitHub release creation,
- release branch creation,
- GitHub Actions or Azure Pipelines changes,
- branch protection changes,
- release automation,
- deployment scripts,
- runtime/backend/frontend/tools-sync implementation,
- schema or migration execution,
- rollback execution,
- secrets, county SQL, PACS/CAMA, production systems, or live services.

## Evidence Model Purpose

A TerraFusion release tag is an evidence pointer, not deployment authority. A tag or version may be
proposed only after a release candidate packet identifies the exact SHA, required checks, evidence
links, rollback class, known risks, and owner decision.

This model defines the information required before a future owner can authorize a real tag. It does
not authorize creating that tag.

## Release Naming Fields

Every future tag/version proposal must include these fields:

| Field | Required value | Notes |
|-------|----------------|-------|
| Release candidate ID | `RC-YYYY.MM.DD-N` or owner-approved equivalent | Must match a release candidate evidence packet. |
| Candidate SHA | Exact Git SHA being certified | Must be immutable and revalidated if branch state moves. |
| Source branch | Branch containing the candidate SHA | Usually `main` or a release candidate branch. |
| Proposed version | `vYYYY.MM.DD.N` or semver-compatible owner-approved value | Must not imply production deployment by itself. |
| Proposed tag | `tf-os/vYYYY.MM.DD.N` or owner-approved equivalent | Tag creation requires separate owner authorization. |
| Evidence bundle path | Canonical release evidence packet path | Must link to the RC packet and Backend OE evidence. |
| Rollback class | Docs/config/feature/dependency/migration/deployment/full-revert class | Must match rollback evidence. |
| Owner decision | PASS, HOLD, or FAIL | PASS is evidence readiness only unless deployment is separately authorized. |

## Version Pattern

Default proposed version pattern:

```text
vYYYY.MM.DD.N
```

Where:

- `YYYY.MM.DD` is the candidate decision date in UTC,
- `N` is a monotonically increasing candidate number for that date,
- the prefix `v` marks a release-version label, not a deployment event.

Accepted alternatives:

- semver-compatible values such as `vMAJOR.MINOR.PATCH` when an owner explicitly selects semantic
  versioning for a release train,
- program-specific suffixes such as `-rc.N` only when the release candidate packet records the
  suffix rule.

Prohibited patterns:

- names that imply production deployment when no deployment authorization exists,
- county-specific tags unless County Runtime owner approval exists,
- PACS/CAMA-specific tags unless the packet proves that boundary is in scope,
- tags that omit the candidate SHA,
- mutable labels such as `latest`, `current`, `stable`, or `prod` as evidence tags.

## Tag Authority Rule

Creating a real git tag or GitHub release requires a separate owner decision.

Required owner authorization packet:

```text
OWNER_DECISION:
Authorize tag creation only.
Candidate SHA:
Proposed tag:
Evidence packet:
Rollback class:
Deployment authorized: no, unless explicitly stated separately.
```

Tag creation must stop if:

- the candidate SHA differs from the SHA in the evidence packet,
- required checks are missing or stale,
- review threads remain unresolved,
- release evidence is HOLD or FAIL,
- rollback evidence is absent for the selected rollback class,
- the proposed tag implies production deployment without deployment authorization,
- county/PACS/secrets/live resources are implicated.

## Tag Evidence Checklist

Before a future tag can be proposed, record:

| Evidence | Required? | Source |
|----------|-----------|--------|
| Release candidate packet | yes | `WO-REL-003` template instance |
| Release gate evidence contract | yes | `WO-REL-002` |
| Candidate SHA | yes | exact Git object |
| Required check results | yes | GitHub PR/check URLs |
| Advisory check disposition | yes | candidate packet |
| Backend OE evidence links | yes | Backend OE closeout evidence |
| Rollback class | yes | candidate packet |
| Rollback source/procedure evidence | yes | Backend OE migration/runbook/rollback evidence |
| Rollback execution proof | conditional | required only if the release decision claims executed rollback proof |
| Owner tag decision | yes | explicit owner authorization |

## Non-Claims

This evidence model does not claim:

- a release has been created,
- a tag has been created,
- a deployment has occurred,
- rollback has been executed,
- production readiness is proven,
- county runtime is authorized,
- PACS/CAMA boundaries are in scope,
- secrets or production systems were accessed,
- CI/release automation was changed.

## PASS / HOLD / FAIL Interpretation

| Decision | Meaning |
|----------|---------|
| PASS | Tag/version evidence is complete enough for an owner to consider tag creation. PASS does not create a tag and does not authorize deployment. |
| HOLD | Evidence is incomplete, stale, ambiguous, or missing owner decision; do not create a tag. |
| FAIL | Evidence contradicts required release gates, claims unproven rollback/deployment readiness, or crosses a protected boundary; do not create a tag. |

## Validation Summary

Required validation for this work order:

- `git diff --check`
- `node docs/brain/workorders/tools/wo-query.mjs --json`
- scope inspection confirms docs/governance only
- runtime/backend/tools-sync implementation files changed: none
- CI/workflow files changed: none
- deployment files changed: none
- county/PACS/CAMA/secrets/live resources touched: none

## Next Work

Next recommended Release Engineering WO:

`WO-REL-005 - Rollback Drill Authorization Packet`

That work order remains docs/governance only and must not execute rollback without separate owner
authorization.
