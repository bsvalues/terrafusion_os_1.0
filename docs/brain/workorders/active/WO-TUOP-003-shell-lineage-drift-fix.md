# WO-TUOP-003 — Shell-Lineage Canon Drift Fix

| Field | Value |
| --- | --- |
| Status | `READY` |
| Program | TerraFusion Owner-Usable Product V1 |
| Goal | `GOAL-TERRAFUSION-OWNER-USABLE-PRODUCT-V1` |
| Loop | `LOOP-TERRAFUSION-OWNER-USABLE-PRODUCT-V1` |
| Owner authority source | Issue #1589; derived from Step Zero reconciliation |
| Risk | R3 — governance/metadata only; rebuilds nothing |

## Objective

Remove the launch-lineage drift that misdirects agents. Root `package.json#main` points at
`frontend/electron/main.js` while the proven canonical UI/runtime lineage is
`frontend/apps/os-shell` → `native-shell/ui/dist` → TerraFusion API. Electron is superseded
(loads deprecated `frontend/dist`).

## Required outcome

1. Correct or remove the stale `main` field (first grep for live consumers of `package.json#main`;
   if any exist and would break, stop and surface — that is a genuine finding).
2. Record the electron supersession classification where future agents read it (README/AGENTS-level
   pointer to the Step Zero evidence file), so no lane rebuilds the dead lineage.
3. Touch nothing else. No host rebuild, no runtime change.

## Validation

- JSON parses; no consumer broken (grep evidence recorded)
- Required checks green; exact-head merge

## Continuation

Merging this releases WO-TUOP-004 (release assembly + runtime closure).
