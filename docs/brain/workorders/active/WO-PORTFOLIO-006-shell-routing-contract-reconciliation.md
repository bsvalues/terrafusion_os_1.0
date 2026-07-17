# WO-PORTFOLIO-006 - Shell Routing Contract Reconciliation

**Program:** Portfolio Operator

**Goal:** `GOAL-PORTFOLIO-OPERATOR-001`

**Loop:** `LOOP-PORTFOLIO-OPERATOR-001`

**Risk:** R2

**Base:** `1adc7df4f78c0e3aa33a829bdb668ad0f511773f`

**Status:** Complete on protected merge

## Objective

Reconcile the static deployment-truth test with the canonical shell routing split. Parcel-scoped
suite launches must navigate into Property Workbench, while standalone suite modules remain
shell-owned and open through module activation.

## Authorized Files

- `tests/deployment-truth-gate.test.mjs`
- `docs/brain/workorders/active/WO-PORTFOLIO-006-shell-routing-contract-reconciliation.md`
- `docs/brain/workorders/evidence/WO-PORTFOLIO-006-SHELL-ROUTING-CONTRACT-RECONCILIATION.md`
- `docs/brain/workorders/PROGRAM_PLAYBOOK_REGISTER.md`
- `docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md`
- `docs/brain/workorders/programs/ACTIVE_PROGRAM_PLAYBOOK.md`
- `docs/brain/workorders/programs/portfolio-operator.md`
- `docs/brain/workorders/registry/work-order-registry.seed.json`

## Blocked Scope

- Shell, Workbench, frontend, backend, runtime, or tools-sync source changes.
- CI, workflow, deployment, package, lockfile, schema, migration, or environment changes.
- Secrets, credentials, county data, PACS, SQL, live services, or production resources.

## Validation

- Focused E3 shell routing contract.
- Full deployment-truth gate.
- Core TypeScript type-check and phase83 tool gate.
- `git diff --check`.
- `node docs/brain/workorders/tools/wo-query.mjs --json`.

## Rollback

Revert the bounded merge. No product, deployment, schema, data, or environment rollback is
required.
