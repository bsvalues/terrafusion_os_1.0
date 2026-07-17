# WO-BACKEND-014 - Health Build-Provenance Truth

**Program:** Portfolio-selected Backend follow-up

**Goal:** `GOAL-BACKEND-OPERATIONAL-EXCELLENCE`

**Loop:** `LOOP-PORTFOLIO-OPERATOR-001`

**Risk:** R3

**Base:** `3649a4665337559213f62419377574cec2ebad1a`

**Status:** Complete on protected merge

## Objective

Make `/health` report the immutable build commit for container and non-container artifacts.
Supersede stale PR #1153 with a current-main implementation that incorporates its unlanded review
findings and closes the canonical Docker build-provenance path end to end.

## Capability

- Preserve `TF_GIT_SHA` as the first provenance source when it contains a real value.
- Treat the container placeholder `unknown` as absent.
- Fall back to the source revision stamped into assembly `InformationalVersion`.
- Pass the validated workflow SHA into both canonical backend image builds.
- Stamp that SHA into the assembly during each Docker publish stage.
- Trim provenance values and retain an explicit `unknown` fallback.

## Authorized Files

- `backend/src/TerraFusion.API/Controllers/SimpleHealthController.cs`
- `backend/src/TerraFusion.API/TerraFusion.API.csproj`
- `backend/tests/TerraFusion.Unit.Tests/Controllers/SimpleHealthControllerGitShaTests.cs`
- `backend/Dockerfile`
- `backend/Dockerfile.API`
- `.github/workflows/ci.yml`
- `.github/workflows/release-lane.yml`
- `tests/deployment-truth-gate.test.mjs`
- `docs/brain/workorders/active/WO-BACKEND-014-health-build-provenance-truth.md`
- `docs/brain/workorders/evidence/WO-BACKEND-014-HEALTH-BUILD-PROVENANCE-TRUTH.md`
- `docs/brain/workorders/PROGRAM_PLAYBOOK_REGISTER.md`
- `docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md`
- `docs/brain/workorders/programs/ACTIVE_PROGRAM_PLAYBOOK.md`
- `docs/brain/workorders/programs/backend-operational-excellence.md`
- `docs/brain/workorders/registry/work-order-registry.seed.json`

## Blocked Scope

- Deployment execution or live environment changes.
- Secrets, credentials, county data, PACS, SQL, or migrations.
- Health/readiness semantics beyond build provenance.
- Any other CI/workflow, Dockerfile, package, lockfile, frontend, or tools-sync changes.

## Validation

- Focused health provenance tests.
- Release solution build with zero warnings and zero errors.
- Full backend unit-test project.
- Build-stamp assembly inspection.
- Deployment truth contract for workflow-to-image SHA propagation.
- `git diff --check`.
- `node docs/brain/workorders/tools/wo-query.mjs --json`.

## Rollback

Revert the bounded merge. The endpoint returns to environment-only provenance with the existing
`unknown` fallback; no schema, deployment, or data rollback is involved.
