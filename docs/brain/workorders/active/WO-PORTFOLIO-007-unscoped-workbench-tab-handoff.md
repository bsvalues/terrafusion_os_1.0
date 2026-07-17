# WO-PORTFOLIO-007 - Unscoped Workbench Tab Handoff

**Program:** Portfolio Operator

**Goal:** `GOAL-PORTFOLIO-OPERATOR-001`

**Loop:** `LOOP-PORTFOLIO-OPERATOR-001`

**Risk:** R3

**Base:** `2d67835735fcd9a82f8b96fde422cf38a8edf0a8`

**Status:** Complete on protected merge

## Objective

Preserve a valid suite-requested Workbench tab when an unscoped launch enters Property Search and
the operator selects a parcel. Reject unknown tab values and normalize the `summary` tab to the
Workbench index route.

## Authorized Files

- `frontend/apps/os-shell/src/pages/PropertySearch.tsx`
- `frontend/apps/os-shell/src/__tests__/workbench/propertySearch.contract.test.tsx`
- `tests/deployment-truth-gate.test.mjs`
- `docs/brain/workorders/active/WO-PORTFOLIO-007-unscoped-workbench-tab-handoff.md`
- `docs/brain/workorders/evidence/WO-PORTFOLIO-007-UNSCOPED-WORKBENCH-TAB-HANDOFF.md`
- `docs/brain/workorders/PROGRAM_PLAYBOOK_REGISTER.md`
- `docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md`
- `docs/brain/workorders/programs/ACTIVE_PROGRAM_PLAYBOOK.md`
- `docs/brain/workorders/programs/portfolio-operator.md`
- `docs/brain/workorders/registry/work-order-registry.seed.json`

## Blocked Scope

- New routes, Workbench tabs, top-level surfaces, or changes to canonical tab order.
- Suite business logic, backend, tools-sync, CI, deployment, package, lockfile, schema, or migration
  changes.
- Secrets, credentials, county data, PACS, SQL, live services, or production resources.

## Validation

- Focused Property Search contract tests.
- Focused E3 and full deployment-truth gate.
- Core and frontend TypeScript type-checks.
- Shell/Tier-1 routing contract gates selected by the repository test target.
- `git diff --check`.
- `node docs/brain/workorders/tools/wo-query.mjs --json`.

## Rollback

Revert the bounded merge. Unscoped launches return to the prior default-summary behavior; no
deployment, schema, data, or environment rollback is involved.
