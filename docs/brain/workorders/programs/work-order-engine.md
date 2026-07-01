# P6 — Work Order Engine

**Program:** P6  
**Status:** ACTIVE  
**Owner:** Operator (bsvalues@gmail.com)  
**Last Updated:** 2026-06-30

---

## Goal

Make TerraFusion compute "what's next" from evidence, dependencies, risk, PR state, branch state, validation state, and blockers — rather than relying on the operator to reason from one-off WO suggestions. The WO Engine is the canonical planning surface. This program builds it in governed read-only slices.

---

## Sovereignty Boundary

| Allowed | Blocked |
|---------|---------|
| Read-only WO discovery | Autonomous code mutation |
| Data model definition | Self-initiated deployments |
| Registry seed | Operator decision override |
| Scoring rule docs | Bypassing stop gates |
| Goal/loop integration | — |
| Operator query tool | — |
| Program playbook docs | — |

---

## Work Orders (Status)

| WO | Title | Status | Evidence |
|----|-------|--------|---------|
| WO-WOE-001 | Work Order System Discovery | **DONE/IN FLIGHT** | `docs/brain/workorders/active/WO-0001-*.md` and related |
| WO-WOE-002 | Work Order Data Model | **DONE/IN FLIGHT** | Codex WO data model commits |
| WO-WOE-003 | Work Order Registry Seed | **DONE/IN FLIGHT** | WO registry seeded |
| WO-WOE-004 | Next-WO Scoring Rules | **DONE/IN FLIGHT** | Scoring rules defined |
| WO-WOE-005 | Read-Only WO Query Tool | **DONE/IN FLIGHT** | Tool available in Brain |
| WO-WOE-006 | Goal + Loop Integration | **DONE/IN FLIGHT** | PR #1108 merged (docs/brain WOs connect to goal loop) |
| WO-WOE-007 | Operator Packet / README integration | **MERGE WATCH** | PR #1110 `docs(brain): define work order operator packet` |
| WO-WOE-008 | Evidence Rollup | **DONE** | PR #1111 merged, commit `150df914f` |
| WO-WOE-009 | Full Program Playbook Register | **CLOSED** | PR #1114 |
| WO-WOE-010 | Goal/Loop Program Playbook Binding | **CLOSED** | PR #1117 |
| WO-WOE-011 | Full Goal/Loop Operator Playbook | **CLOSED** | PR #1130 |
| WO-WOE-012 | Autonomous Same-Risk Continuation Gate | **EXECUTING** | This PR — cross-program advance + wall ledger |
| WO-WOE-013 | Program Queue UI / Report | QUEUED | After 012 — note: "UI" is frontend code (R2, authorization); "Report" docs portion is R1 |
| WO-WOE-014 | Cross-Program Dependency Graph | QUEUED | After 012 — docs (R1) |

---

## WO-WOE-009 Definition (THIS WO)

**Goal:** Create the canonical full playbook of TerraFusion work order programs so the operator no longer needs to reason from one-off next-WO suggestions.

**Files created in this WO:**
- `docs/brain/workorders/PROGRAM_PLAYBOOK_REGISTER.md` — master register
- `docs/brain/workorders/programs/benton-demo-deployment.md`
- `docs/brain/workorders/programs/benton-data-quality.md`
- `docs/brain/workorders/programs/backend-operational-excellence.md`
- `docs/brain/workorders/programs/property-workbench.md`
- `docs/brain/workorders/programs/terrapilot-tool-maturity.md`
- `docs/brain/workorders/programs/work-order-engine.md` (this file)
- `docs/brain/workorders/programs/brain-operator-system.md`
- `docs/brain/workorders/programs/azure-county-runtime.md`

**Stop type:** Docs/registry only. No runtime code, no config changes, no deployment.

---

## WO-WOE-010 Definition

**Goal:** Produce a cross-program dependency graph showing which programs block which others, which WOs create enabling artifacts for downstream programs, and where the critical path to demo authorization lies.

**Output:** `docs/brain/workorders/CROSS_PROGRAM_DEPENDENCY_GRAPH.md` + Mermaid diagram

---

## WO-WOE-011 Definition

**Goal:** Implement a Brain query that returns the full next-WO report: all programs, their current status, the next executable WO per program, blocking dependencies, and a recommended execution order for the current sprint.

---

## Dependency Chain

```
001-008 (done/in-flight) → 009 (THIS) → 010 → 011
```

010 and 011 require 009 to be stable (programs defined + statused).

---

## Governing Rule

The WO Engine is read-only by default. It discovers, queries, scores, and reports. It does not initiate code changes, deployments, or data mutations. The operator always makes the final call on which WO to execute next.
