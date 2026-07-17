# WO-BACKEND-014 - Health Build-Provenance Truth

**Program:** Portfolio-selected Backend follow-up

**Goal:** `GOAL-BACKEND-OPERATIONAL-EXCELLENCE`

**Loop:** `LOOP-PORTFOLIO-OPERATOR-001`

**Risk:** R3

**Base:** `3649a4665337559213f62419377574cec2ebad1a`

**Status:** Complete on protected merge

## Objective

Make `/health` report the immutable build commit for non-container artifacts instead of relying only
on the Docker `TF_GIT_SHA` path. Supersede stale PR #1153 with a current-main implementation that
also incorporates its unlanded review findings.

## Capability

- Preserve `TF_GIT_SHA` as the first provenance source when it contains a real value.
- Treat the container placeholder `unknown` as absent.
- Fall back to the source revision stamped into assembly `InformationalVersion`.
- Trim provenance values and retain an explicit `unknown` fallback.

## Authorized Files

- `backend/src/TerraFusion.API/Controllers/SimpleHealthController.cs`
- `backend/src/TerraFusion.API/TerraFusion.API.csproj`
- `backend/tests/TerraFusion.Unit.Tests/Controllers/SimpleHealthControllerGitShaTests.cs`
- `docs/brain/workorders/active/WO-BACKEND-014-health-build-provenance-truth.md`
- `docs/brain/workorders/evidence/WO-BACKEND-014-HEALTH-BUILD-PROVENANCE-TRUTH.md`
- `docs/brain/workorders/PROGRAM_PLAYBOOK_REGISTER.md`
- `docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md`
- `docs/brain/workorders/programs/ACTIVE_PROGRAM_PLAYBOOK.md`
- `docs/brain/workorders/programs/backend-operational-excellence.md`
- `docs/brain/workorders/registry/work-order-registry.seed.json`

## Blocked Scope

- Deployment or live environment changes.
- Secrets, credentials, county data, PACS, SQL, or migrations.
- Health/readiness semantics beyond build provenance.
- CI/workflow, Dockerfile, package, lockfile, frontend, or tools-sync changes.

## Validation

- Focused health provenance tests.
- Release solution build with zero warnings and zero errors.
- Full backend unit-test project.
- Build-stamp assembly inspection.
- `git diff --check`.
- `node docs/brain/workorders/tools/wo-query.mjs --json`.

## Rollback

Revert the bounded merge. The endpoint returns to environment-only provenance with the existing
`unknown` fallback; no schema, deployment, or data rollback is involved.
