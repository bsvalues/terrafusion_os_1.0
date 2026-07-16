# P6 — Work Order Engine


> **WO-MAO-001 audit basis:** `docs/brain/evidence/WO-MAO-000-proof.md`

**Program:** P6  
**Status:** COMPLETE ON WO-WOE-013 PROTECTED MERGE
**Owner:** Operator (bsvalues@gmail.com)  
**Last Updated:** 2026-07-15

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
| WO-WOE-001 | Work Order System Discovery | **DONE** | `docs/brain/workorders/active/WO-0001-*.md` and related |
| WO-WOE-002 | Work Order Data Model | **DONE** | Codex WO data model commits |
| WO-WOE-003 | Work Order Registry Seed | **DONE** | WO registry seeded |
| WO-WOE-004 | Next-WO Scoring Rules | **DONE** | Scoring rules defined |
| WO-WOE-005 | Read-Only WO Query Tool | **DONE** | Tool available in Brain |
| WO-WOE-006 | Goal + Loop Integration | **DONE** | PR #1108 merged (docs/brain WOs connect to goal loop) |
| WO-WOE-007 | Operator Packet / README integration | **DONE** | PR #1110 `docs(brain): define work order operator packet` |
| WO-WOE-008 | Evidence Rollup | **DONE** | PR #1111 merged, commit `150df914f` |
| WO-WOE-009 | Full Program Playbook Register | **CLOSED** | PR #1114 |
| WO-WOE-010 | Goal/Loop Program Playbook Binding | **CLOSED** | PR #1117 |
| WO-WOE-011 | Full Goal/Loop Operator Playbook | **CLOSED** | PR #1130 |
| WO-WOE-012 | Autonomous Same-Risk Continuation Gate | **CLOSED** | PR #1138 |
| WO-WOE-013 | Program Queue UI / Report | **COMPLETE ON MERGE** | Read-only Markdown report CLI + tests; no frontend route |
| WO-WOE-014 | Cross-Program Dependency Graph | **DONE** | Canonical authorization-to-unblocks map |

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

## WO-WOE-013 Definition

**Goal:** Render the existing query result as an operator-readable report without creating a second
routing authority or mutating registry state.

**Outputs:**
- `docs/brain/workorders/tools/wo-report.mjs`
- `docs/brain/workorders/tools/wo-report.test.mjs`
- `docs/brain/workorders/evidence/WO-WOE-013-PROGRAM-QUEUE-REPORT.md`

**Boundary:** The report is advisory. `WORK_ORDER_PROGRAM_QUEUE.md` remains the live current-state
source and `CONTINUATION_RULEBOOK.md` remains the continuation authority. Registry reconciliation is
not part of this Work Order.

---

## Dependency Chain

```
001-008 → 009 → 010 → 011 → 012 → 014 → 013
```

WO-WOE-013 closes the registered baseline after the continuation gate and dependency graph are
available. The next route after protected merge is Portfolio Operator reconciliation.

---

## Governing Rule

The WO Engine is read-only by default. It discovers, queries, scores, and reports. It does not initiate code changes, deployments, or data mutations.

> **Superseded (WO-BRAIN-008; reconciled by WO-MAO-001):** the earlier "the operator always makes the final call on which WO to execute next" is replaced by the continuation doctrine — **the human is the authority wall, not the per-WO dispatcher.** Continuation inside the active recorded risk, system, file, and action authority is automatic. Undeclared next work, validation that cannot be repaired in scope, scope or protected-system crossings, missing merge authority, ALL-LANES-PARKED, and unresolved canon still stop under [NEXT_WO_SELECTION_RULE.md](../goal-loop/NEXT_WO_SELECTION_RULE.md) and [CONTINUATION_RULEBOOK.md](../CONTINUATION_RULEBOOK.md) §6.
