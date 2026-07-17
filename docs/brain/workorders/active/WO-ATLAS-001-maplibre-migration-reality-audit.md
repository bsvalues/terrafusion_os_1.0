# WO-ATLAS-001 - MapLibre Migration Reality Audit

**Program:** Portfolio Operator

**Goal:** `GOAL-PORTFOLIO-OPERATOR-001`

**Loop:** `LOOP-PORTFOLIO-OPERATOR-001`

**Risk:** R0

**Base:** `bba42d1fe6c1a7bb39744b01fdd72da9c6f7460e`

**Status:** Complete on protected merge

## Objective

Determine whether stale PR #1073 is a safe current-main implementation vehicle, verify its claimed
MapLibre canon and dependency assumptions, classify unresolved defects and intervening changes, and
route useful work into fresh bounded Work Orders without modifying product code.

## Authorized Files

- `docs/brain/workorders/active/WO-ATLAS-001-maplibre-migration-reality-audit.md`
- `docs/brain/workorders/evidence/WO-ATLAS-001-MAPLIBRE-MIGRATION-REALITY-AUDIT.md`
- `docs/brain/workorders/PROGRAM_PLAYBOOK_REGISTER.md`
- `docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md`
- `docs/brain/workorders/programs/ACTIVE_PROGRAM_PLAYBOOK.md`
- `docs/brain/workorders/programs/portfolio-operator.md`
- `docs/brain/workorders/goal-loop/COMMAND_TO_PROGRAM_MAP.md`
- `docs/brain/workorders/registry/work-order-registry.seed.json`

## Authorized Repository Actions

- Read current main, PR #1073 exact-head source, review threads, checks, history, and tracked canon.
- Close PR #1073 as superseded by fresh Work Orders without deleting its branch or commits.
- Admit a bounded current-main security repair discovered by the audit.

## Blocked Scope

- Editing product source, tests, package manifests, lockfiles, CI, deployment, or renderer behavior.
- Merging, rebasing, force-pushing, cherry-picking, or deleting the stale PR branch.
- Secrets, credentials, county data, PACS, SQL, live services, or production resources.

## Validation

- Exact PR head, divergence, scope, and unresolved-thread inspection.
- Current-main canon and dependency inspection.
- Exact governance-file scope inspection.
- `git diff --check`.
- `node docs/brain/workorders/tools/wo-query.mjs --json --authority R3`.

## Rollback

Reopen PR #1073 and revert the bounded governance merge. The stale branch and all commits remain
preserved; no product or dependency state is changed by this audit.
