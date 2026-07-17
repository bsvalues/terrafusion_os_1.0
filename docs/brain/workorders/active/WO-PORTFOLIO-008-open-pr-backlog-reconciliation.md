# WO-PORTFOLIO-008 - Open PR Backlog Reconciliation

**Program:** Portfolio Operator

**Goal:** `GOAL-PORTFOLIO-OPERATOR-001`

**Loop:** `LOOP-PORTFOLIO-OPERATOR-001`

**Risk:** R1

**Base:** `848024f31255306892c0c3f3dfd27bbfcf2a7c4d`

**Status:** Complete on protected merge

## Objective

Reconcile every open pull request against current `origin/main`, close only work that is demonstrably
superseded or unsafe to merge as presented, preserve true ratification and product boundaries, and
admit the next dependency-cleared bounded audit without using the owner as backlog dispatcher.

## Authorized Files

- `docs/brain/workorders/active/WO-PORTFOLIO-008-open-pr-backlog-reconciliation.md`
- `docs/brain/workorders/evidence/WO-PORTFOLIO-008-OPEN-PR-BACKLOG-RECONCILIATION.md`
- `docs/brain/workorders/PROGRAM_PLAYBOOK_REGISTER.md`
- `docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md`
- `docs/brain/workorders/programs/ACTIVE_PROGRAM_PLAYBOOK.md`
- `docs/brain/workorders/programs/portfolio-operator.md`
- `docs/brain/workorders/goal-loop/COMMAND_TO_PROGRAM_MAP.md`
- `docs/brain/workorders/registry/work-order-registry.seed.json`

## Authorized Repository Actions

- Inspect live pull-request metadata, exact file scopes, checks, and current-main equivalents.
- Close superseded or unsafe-to-merge pull requests without deleting their branches or commits.
- Preserve owner-held ratification checkpoints and unratified product candidates.

## Blocked Scope

- Importing, cherry-picking, rebasing, or merging stale pull-request commits.
- Deleting branches, commits, worktrees, forensic evidence, or product candidates.
- Product, runtime, backend, tools-sync, CI, deployment, package, lockfile, schema, or migration
  changes.
- Secrets, credentials, county data, PACS, SQL, live services, or production resources.

## Validation

- Live GitHub open-PR inventory after reconciliation.
- Exact governance-file scope inspection.
- `git diff --check`.
- `node docs/brain/workorders/tools/wo-query.mjs --json`.

## Rollback

Reopen any incorrectly closed pull request and revert the bounded governance merge. Branches and
commits remain preserved, so this Work Order performs no irreversible repository cleanup.
