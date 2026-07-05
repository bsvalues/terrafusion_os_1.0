# WO-MASTER-PLAYBOOK-001 — Active Program Work Order Playbook Evidence

**Work Order:** WO-MASTER-PLAYBOOK-001
**Mode:** Docs/governance/playbook creation only
**Date:** 2026-07-04
**Base:** `origin/main` at `1f3dcc1628845450e3232e32a8e78dfe95483e47`
**Branch:** `wo/master-active-program-playbook`

---

## Objective

Create one master playbook of active, parked, and next-ready TerraFusion work-order programs so
execution proceeds by governed chains instead of one-off prompts.

---

## Scope

Created:

- `docs/brain/workorders/programs/ACTIVE_PROGRAM_PLAYBOOK.md`
- `docs/brain/workorders/evidence/WO-MASTER-PLAYBOOK-001-ACTIVE-PROGRAM-WORK-ORDER-PLAYBOOK.md`

Updated:

- `docs/brain/workorders/PROGRAM_PLAYBOOK_REGISTER.md`
- `docs/brain/workorders/goal-loop/COMMAND_TO_PROGRAM_MAP.md`
- `docs/brain/workorders/goal-loop/GOAL_COMMANDS.md`

No backend/runtime/tools implementation files were changed.

---

## Programs Included

1. Backend Operational Excellence.
2. Sovereign Sync Workbook Tooling.
3. TerraPilot Tool Maturity parked state.
4. DevEx Hook Tooling follow-up.
5. Local OMEN Runtime Repair lane.
6. WO-CORE-1 runtime-import disposition.
7. Future Property Workbench lane.
8. Global continuation and stop rules.

---

## Current Execution Truth

Backend Operational Excellence is the next executable TerraFusion program.

- Current executable WO: `WO-BACKEND-OE-003`.
- Purpose: Integration Test Environment Dependency Register.
- Mode: docs/evidence only.
- Runtime/backend implementation remains blocked unless a later WO explicitly authorizes it.
- Routing note: this is the owner-selected master-playbook route. The legacy read-only `wo-query`
  registry/scoring output may still report an older LocalOps recommendation until a separate
  registry refresh updates that data source; if the two surfaces disagree, Codex must stop at a
  routing reconciliation gate.

Parked or owner-gated lanes:

- TerraPilot remains parked at P15; P16 requires explicit design-only authorization.
- Sovereign Sync Workbook Tooling requires owner selection before `WO-SYNC-132`.
- DevEx Hook Tooling is a separate follow-up lane, not Backend OE.
- Local OMEN Runtime Repair remains blocked at a diagnosis-first runtime repair gate.
- WO-CORE-1 runtime import disposition remains owner-gated.
- Property Workbench is future/high-value but not selected by this WO.

---

## Validation Plan

Required validation:

- `git diff --check`
- `node docs/brain/workorders/tools/wo-query.mjs --json`
- Inspect master playbook includes all active/parked programs.
- Inspect program register references master playbook.
- Inspect commands map to correct programs.
- Confirm no runtime/backend/tools implementation files changed.

---

## Done / Not Done

Done:

- Master active-program playbook created.
- Program register references the master playbook.
- Command map includes active program commands and owner-gated status commands.
- Backend OE remains routed to `WO-BACKEND-OE-003`.

Not done:

- No implementation WO was started.
- No Backend OE `WO-BACKEND-OE-003` work was started.
- No Sync `WO-SYNC-132` work was started.
- No TerraPilot P16 work was started.
- No local hook repair was started.

---

## Next Executable Work

**Next executable program:** Backend Operational Excellence
**Next executable WO:** `WO-BACKEND-OE-003 — Integration Test Environment Dependency Register`

Stop type:

- `MASTER_ACTIVE_PROGRAM_PLAYBOOK_CREATED_READY_FOR_CHAIN_EXECUTION`
