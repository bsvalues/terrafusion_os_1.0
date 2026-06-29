# Work Order Registry Seed

This directory contains the first Work Order Engine registry seed.

The registry is data only. It does not execute work orders, query GitHub, mutate branches, or replace
the existing Brain/Cortex authority. It gives later Work Order Engine slices a stable set of records
to score, query, and roll up without migrating the full historical archive in one step.

Canonical files:

- `work-order-registry.seed.json` - representative completed, current, and candidate work orders.
- `../schema/work-order.schema.json` - canonical record schema used by individual registry entries.

## Scope

WO-WOE-003 intentionally seeds a small, evidence-backed set:

- completed Work Order Engine setup records
- the active Work Order Engine chain through WO-WOE-008
- merged DevOps platform milestones
- current Brain queue candidates that should remain visible to later query tooling

This is not a complete historical ledger and should not be treated as one.

## Non-Goals

This seed does not:

- migrate every `docs/brain/workorders/active/**` file
- compute next-work scoring
- query PR, branch, or worktree state
- run a goal/loop
- authorize merge, cleanup, runtime, CI, deployment, or protected-data work
