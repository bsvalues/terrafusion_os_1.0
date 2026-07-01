# WO-BACKEND-005 - Backend Release Gate Definition

**Date:** 2026-07-01
**Mode:** Backend operational governance evidence
**Scope:** Release gate definition only

## Purpose

Define the minimum backend release gate for TerraFusion backend work. This gate is
an operator contract for deciding whether backend changes are eligible for release
consideration. It does not authorize a release, deployment, schema migration,
production access, PACS access, county SQL access, or protected-data handling.

## Source Evidence

This gate is based on the current Backend Operational Excellence evidence:

- `WO-BACKEND-001-BACKEND-REALITY-AUDIT.md`
- `WO-BACKEND-002-BUILD-WARNING-BURN-DOWN.md`
- `WO-BACKEND-003-SERVICE-REGISTRY-VALIDATION.md` once merged
- `WO-BACKEND-004-HEALTH-READINESS-TRUTH.md` once merged

The release gate is intentionally stricter than "build passed" and narrower than
"production ready." It requires evidence that the backend can be built, tested,
operated, diagnosed, and rolled back within the approved TerraFusion governance
boundaries.

## Gate Summary

| Gate | Required Evidence | Release Decision |
|------|-------------------|------------------|
| Build gate | Canonical backend solution builds successfully. | Required |
| Warning gate | Canonical backend solution and approved out-of-solution backend test project build with 0 warnings. | Required |
| Test gate | Focused and canonical backend tests must pass, or every failure must be classified with an owner and a non-release risk decision. | Required |
| Migration gate | No unapplied or unreviewed schema migration is introduced; live/shared DB migration is separately authorized. | Required |
| County isolation gate | County-scoped behavior is explicitly tested or marked not touched. | Required for county-impacting changes |
| Lane guard gate | Change scope stays inside the authorized work order lane. | Required |
| Health/readiness gate | Liveness, readiness, constitutional proof, and dependency-health surfaces are documented and validated for the release scope. | Required |
| Service registry gate | Service registration/startup/health claims are supported by tests or evidence. | Required |
| Audit/trace gate | Correlation, audit, and diagnostic evidence is available for changed operational paths. | Required for operational changes |
| Rollback gate | Rollback or recovery path is documented before release consideration. | Required |

## Build Gate

Required command for the canonical backend solution:

```powershell
dotnet restore backend\TerraFusion.sln
dotnet build backend\TerraFusion.sln --no-restore --property:WarningLevel=999 --property:TreatWarningsAsErrors=true
```

Pass criteria:

- Build exits successfully.
- Warning count is 0 and the command fails automatically if warnings are emitted.
- Error count is 0.
- No production configuration or secret is required.

If the work order intentionally touches an out-of-solution backend test project,
that project must also build warning-clean.

## Warning Gate

Required warning posture:

- Existing canonical backend solution warning baseline remains 0.
- Any newly touched out-of-solution backend project is warning-clean.
- Mechanical test-only warning fixes are allowed when they do not change runtime
  behavior.
- Runtime warning fixes that change behavior require a separate work order and
  validation plan.

Evidence from `WO-BACKEND-002` established the current warning baseline and
burned down low-risk nullable warnings in the out-of-solution API test project.

## Test Gate

Minimum release-evidence test set:

- Canonical backend solution build/test gate applicable to the change.
- Focused tests for the changed operational surface.
- Regression tests for previously documented backend operational gaps when those
  gaps are touched.

Known failing or skipped tests are not ignored. They must be classified as:

- unrelated pre-existing blocker,
- in-scope release blocker,
- flaky/local-environment blocker,
- intentionally deferred with owner decision, or
- fixed in the current work order.

Do not convert a failing test into a pass by exclusion unless the exclusion is
policy-backed and documented.

## Migration Gate

Release consideration is blocked if a change:

- adds, modifies, or applies EF migrations without explicit schema authority,
- requires live or shared database migration execution,
- changes county data shape without a county-isolation review, or
- depends on production database access for validation.

Docs/evidence-only backend WOs satisfy this gate by proving no schema files,
migrations, or live/shared DB operations were touched.

## County Isolation Gate

Any backend release that changes county-scoped behavior must show evidence that:

- county identity is preserved across request handling,
- queries remain county-scoped where applicable,
- cross-county leakage is not introduced,
- sample or test data is not real county data, and
- no PACS or county SQL credential is required.

If the work order does not touch county behavior, the release packet must say so
explicitly instead of leaving the gate implicit.

## Lane Guard Gate

Every backend release candidate must declare:

- work order ID,
- authorized file scope,
- changed files,
- blocked systems,
- validation performed,
- validation not performed, and
- reason release authority is or is not requested.

The release gate fails if the change includes unauthorized runtime, CI, schema,
registry, automation, deployment, secret, PACS, county SQL, or protected-data
surfaces.

## Health and Readiness Gate

The backend release packet must identify which health/readiness surfaces are in
scope:

- `/health`
- `/health/ready`
- `/health/live`
- `/healthz/proof`
- `/healthz/ready`
- `/api/system/health`
- domain-specific health probes such as PACS, levy, or transcendence endpoints

For changed health/readiness behavior, the packet must state:

- public/protected/dev-only classification,
- expected HTTP status,
- dependency assumptions,
- failure behavior,
- focused tests or manual evidence, and
- rollback path.

Docs/evidence-only WOs may satisfy this gate by linking to the health/readiness
truth evidence without changing endpoint behavior.

## Service Registry Gate

Service registry release evidence must prove:

- relevant service registry tests pass,
- startup registration behavior is understood,
- module/service health claims are not orphaned,
- no unsupported production dependency is required for validation, and
- any gaps are explicitly deferred.

Evidence from `WO-BACKEND-003` is the baseline for this gate once that PR merges.

## Audit and Trace Gate

Operational backend changes must preserve or improve diagnosability:

- correlation IDs remain available where currently required,
- audit events are still emitted for changed operational paths,
- error classes are not hidden,
- failure evidence can be retrieved through the documented trace/debug path, and
- logging does not print secrets, credentials, PACS data, county SQL data, or
  protected county data.

If the work order does not touch audit or trace behavior, the packet must record
that this gate is not materially changed.

## Rollback Gate

Every backend release candidate must include a rollback statement:

- docs/evidence-only changes: revert the PR commit.
- backend runtime code changes: revert the PR commit and rerun the applicable
  build/test/health gates.
- schema changes: not covered by this gate unless a separate schema rollback plan
  and explicit schema authority exist.
- deployment changes: not covered by this gate; deployment requires a separate
  release/deployment work order.

## Release Evidence Requirements

A backend release packet must include:

- work order ID and PR number,
- commit SHA,
- changed file list,
- build and warning results,
- focused test results,
- health/readiness evidence if applicable,
- service registry evidence if applicable,
- migration status,
- county/PACS/SQL/protected-data status,
- known failed/skipped tests and classification,
- rollback plan, and
- operator decision requested.

## Explicit Non-Authorization

This gate does not authorize:

- production deployment,
- release tagging,
- image publishing,
- schema migration application,
- live/shared database access,
- PACS integration changes,
- county SQL access,
- protected county data access,
- service connection creation,
- Key Vault changes, or
- CI/branch-protection changes.

## Current Program Impact

`WO-BACKEND-005` defines the release gate contract in the active owner-authorized
backend loop. It does not claim the backend is release-ready today. It establishes
what must be proven before a future release request can be considered.

If an older or alternate backend program register assigns runtime configuration,
auth/security proof, release gate, or operational packet work to different WO
numbers, that register remains a dependency source for automated queue routing.
This evidence file does not skip runtime configuration or auth/security proof;
it defines the release-gate contract that those proofs must satisfy before any
future release approval.

## Done / Not Done

Done:

- Backend release gate categories are defined.
- Required evidence per gate is documented.
- Release versus deployment boundaries are explicit.
- Rollback expectations are documented.
- No runtime, CI, schema, registry, automation, deployment, secret, county data,
  PACS, or SQL changes were made.

Not done:

- No release is authorized.
- No deployment is authorized.
- No health/readiness runtime behavior was changed.
- No service registry runtime behavior was changed.
- No schema or migration operation was performed.

## Next Recommended WO

Proceed under the active owner-authorized backend loop to `WO-BACKEND-006 - Operational Packet`.

For automated registry-driven execution, reconcile any older backend program numbering before using this
evidence file to advance a release decision.
