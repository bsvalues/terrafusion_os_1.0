# TerraFusion Program Playbook Register


> **WO-MAO-001 audit basis:** `docs/brain/evidence/WO-MAO-000-proof.md`
**Version:** 1.0
**Date:** 2026-07-15
**Authority:** TerraFusion Brain / WO-WOE-009
**Classification:** Operator Doctrine — canonical planning surface

---

## Purpose

This register is the canonical source of truth for all active TerraFusion work order programs. Every WO must sit inside a program. Every program has a goal, a sovereignty boundary, an ordered WO list, and explicit stop conditions.

**Rule:** The next WO chosen by the operator or the Brain must be a node inside this register, not a floating suggestion.

---

## Current Program Summary

*(Updated 2026-07-18 - WO-LOCAL-096 failed closed on absent proof images before container mutation)*

| Program | Goal | Loop | Status | Current WO | Next WO | Continuation | Stop Rules |
|---------|------|------|--------|------------|---------|--------------|------------|
| [Governed Multi-Agent Operator Activation](programs/governed-multi-agent-operator-activation.md) | `GOAL-MAO-001` | `LOOP-MAO-001` | Closed - PASS_WITH_GAPS; continuation envelope completed and consumed | `WO-MAO-007` complete | Portfolio reconciliation | No MAO continuation authority survives closeout | Future execution requires new applicable authority; protected boundaries remain denied |
| [Codex Operator Autonomy](programs/codex-operator-autonomy.md) | `GOAL-TF-CODEX-OPERATOR-AUTONOMY-001` | `LOOP-TF-CODEX-OPERATOR-AUTONOMY-001` | Governing autonomy baseline | `WO-OP-AUTO-000` through `WO-OP-AUTO-012` | Portfolio reconciliation | Operator model governs recorded-authority continuation | Stop on branch/merge conflict, scope expansion, runtime/CI/deployment/protected-resource changes, destructive operations, or conflicting canon |
| [Release Engineering](programs/release-engineering.md) | `GOAL-TF-RELEASE-ENGINEERING-001` | `LOOP-TF-RELEASE-ENGINEERING-001` | Closed | `WO-REL-006` complete | Portfolio reconciliation | No automatic Release Engineering successor after closeout | Stop on CI/workflow/deployment/runtime/schema/secrets/county/PACS/live-resource scope |
| [Codex Operator Work Order Playbook](operator/CODEX_OPERATOR_PLAYBOOK.md) | `GOAL-TF-CODEX-OPERATOR-WO-PLAYBOOK-001` | `LOOP-TF-CODEX-OPERATOR-WO-PLAYBOOK-001` | Closed | `WO-CODEX-OP-001` through `WO-CODEX-OP-009` | Release Engineering lane selected | Operator model governs future WOs | Stop on hook bypass, merge authorization, scope expansion, runtime/CI/deployment/protected-resource changes, destructive operations, or conflicting canon |
| [Backend Operational Excellence](programs/backend-operational-excellence.md) | `GOAL-BACKEND-OPERATIONAL-EXCELLENCE` | `LOOP-BACKEND-OPERATIONAL-EXCELLENCE` | Closed baseline; bounded provenance follow-up complete | `WO-BACKEND-014` done | Portfolio reconciliation | Standing operator authority covered the exact bounded follow-up | Stop on scope expansion, deployment, schema, secrets, protected data, or failed required proof |
| [Sovereign Sync Workbook Tooling](programs/ACTIVE_PROGRAM_PLAYBOOK.md#program-2---sovereign-sync-workbook-tooling) | `GOAL-SYNC-WORKBOOK-TOOLING` | `LOOP-SYNC-WORKBOOK-TOOLING` | Closed in canonical sovereign repository | `WO-SYNC-155` complete | Portfolio reconciliation | No duplicate continuation from this repository | Stop on runtime import, live data, or unregistered cross-repo dispatch |
| [TerraPilot Tool Maturity](programs/terrapilot-tool-maturity.md) | `GOAL-TERRAPILOT-TOOL-MATURITY` | `LOOP-TERRAPILOT-TOOL-MATURITY` | Parked | P15 | P16 design-only | No auto | Owner authorization required |
| [DevEx Hook Tooling](programs/devex-hook-tooling.md) | `GOAL-DEVEX-HOOK-BOOTSTRAP` | `LOOP-DEVEX-HOOK-BOOTSTRAP` | Closed | `WO-DEVEX-HOOKS-006` | Portfolio reconciliation | Frozen bootstrap auto-proceeds under operator policy | Stop on tracked dependency mutation, cleanup, CI/runtime changes, or protected resources |
| [Local OMEN Runtime Repair](programs/ACTIVE_PROGRAM_PLAYBOOK.md#program-5---local-omen-runtime-repair) | `GOAL-LOCAL-OMEN-RUNTIME-REPAIR` | `LOOP-LOCAL-OMEN-RUNTIME-REPAIR` | Container preflight complete - required images absent | `WO-LOCAL-096` complete | Proposed `WO-LOCAL-097` image acquisition/build | No auto image mutation | Exact pull/build provenance and app topology reconciliation required before container recreation |
| [Runtime Import Disposition](programs/ACTIVE_PROGRAM_PLAYBOOK.md#program-6---runtime-import-disposition) | `GOAL-RUNTIME-IMPORT-DISPOSITION` | `LOOP-RUNTIME-IMPORT-DISPOSITION` | Owner-gated | `WO-CORE-1` | TBD | No auto | Owner authorization required |
| [Property Workbench](programs/property-workbench.md) | `GOAL-PROPERTY-WORKBENCH` | `LOOP-PROPERTY-WORKBENCH` | Closed evidence baseline | `WO-WORKBENCH-011` | New phase only if owner/WOE selects | No auto restart | Owner or WOE selection required |
| [Benton Demo / Deployment Readiness](programs/benton-demo-deployment.md) | `/goal benton-demo` | `/loop merge-watch` / `/loop once` | Active | `WO-DEPLOY-BENTON-003B` | `WO-DEPLOY-BENTON-003D` if authorized | No auto deploy | Stop on deployment authorization |
| [Benton Data Quality](programs/benton-data-quality.md) | `/goal benton-data-quality` | `/loop evidence` | Safe audit queue exhausted | Audits, rollup, credentialed verification, and duplicate cleanup complete | New bounded remediation WO only | No automatic continuation | Stop on data mutation, credentials, PACS, sync, or production claims |
| [Work Order Engine](programs/work-order-engine.md) | `/goal work-order-engine` | `/loop program` | Closed at WO-WOE-013 / PR #1291 | `WO-WOE-013` complete | Portfolio reconciliation | No automatic WOE successor after baseline closeout | Report is advisory; stop on registry/scoring expansion, protected systems, or new runtime work |
| [Portfolio Operator](programs/portfolio-operator.md) | `GOAL-PORTFOLIO-OPERATOR-001` | `LOOP-PORTFOLIO-OPERATOR-001` | Reconciled - follow-on protected boundary | `WO-LOCAL-096` complete | Proposed `WO-LOCAL-097` image acquisition/build | Auto-select, admit, deliver, merge, and continue dependency-cleared authorized nodes | Image pull/build requires an exact external/local build envelope; other successors retain their recorded boundaries |
| [AI / Brain / Operator System](programs/brain-operator-system.md) | `GOAL-BRAIN-OPERATOR-001` | `LOOP-BRAIN-OPERATOR-001` | Evidence baseline COMPLETE (PARTIAL / INTEGRATION GAP) | `WO-BRAIN-009` (done) | portfolio reconciliation | Auto through evidence/docs chain | Stop on canon conflict, implementation, runtime, CI, secrets, protected data, or deployment |
| [Azure / DevOps / County Runtime](programs/azure-county-runtime.md) | `/goal azure-county-runtime` | `/loop evidence` | Safe docs/evidence slice complete on WO-AZURE-003 merge | `WO-AZURE-003` complete on merge | Portfolio reconciliation; `WO-AZURE-004/005` remain blocked | No automatic live-Azure continuation | Stop on live Azure, secret values, resource/config mutation, deployment, or county production |
| [Management Dashboard](programs/p8-management-dashboard.md) | `/goal p8-management-dashboard` | `/loop program` | Baseline complete; deployed and auth boundary repaired | `WO-P8-MGMT-006` complete | Portfolio reconciliation | No automatic successor | Credentialed verification, auth changes, or county release require exact authority |

**Active program graph:** [TerraFusion Active Goal/Loop Execution Playbook](programs/ACTIVE_PROGRAM_PLAYBOOK.md)

---

## Known Blockers (as of 2026-07-15)

| Blocker | Blocking | Stop Wall |
|---------|---------|-----------|
| Live staging-slot smoke authority is not active | WO-DEPLOY-BENTON-003D, WO-AZURE-004/005 | SW-01 / SW-03 |
| New Benton backfill, entitlement mutation, sync, or PACS follow-up needs a bounded packet | Benton Data Quality remediation | SW-02 / SW-03 / SW-08 |
| Local OMEN required images are absent after container preflight | Proposed WO-LOCAL-097 | Exact digest-pinned image acquisition/app build and topology proof before container recreation |
| Runtime import disposition remains owner-gated | WO-CORE-1 | SW-05 / sovereign boundary |
| Backend full solution tests depend on Docker/Testcontainers SQL Server lane | Backend release readiness / integration validation | Classified in WO-BACKEND-OE-003 as segmented integration prerequisite; release gate criteria defined in WO-BACKEND-OE-009; operational runbook created in WO-BACKEND-OE-010 without Docker repair |
| Dependency-clean worktrees cannot resolve local Prettier/Vitest before explicit bootstrap | Local PR-finalization before bootstrap | Run the governed frozen bootstrap; unattended runs require `--ignore-scripts` and tracked mutation remains an authority wall |
| Production deployment NOT authorized | All P1 WOs after 003D | SW-01 |
| County production boundary packet requires explicit operator auth | WO-AZURE-006 | SW-01 + SW-09 |

---

## Operator Decision Walls

These actions require explicit operator authorization. The Brain and Claude do not initiate them:

| Wall | Scope |
|------|-------|
| Azure App Service deployment | P1 / P8 |
| Production / county-facing release | P1 |
| PACS connection | P2 / data mutation |
| Schema changes or EF migrations | All programs |
| Data drain or reload | P2 |
| New county enrollment | P8 |

---

## Execution Doctrine

1. Operator or Brain nominates a WO from this register.
2. Claude executes the WO as an operational packet (no self-initiation of walls).
3. Each WO produces required outputs: evidence doc, config change, ADR, or runbook — per the WO definition.
4. After WO completion, register status is updated and next recommended WO is surfaced.
5. WOs in different programs may run in parallel if they do not share a sovereignty boundary.

---

## Program Files

- [Active Program Work Order Playbook](programs/ACTIVE_PROGRAM_PLAYBOOK.md)
- [P1 — Benton Demo / Deployment Readiness](programs/benton-demo-deployment.md)
- [P2 — Benton Data Quality](programs/benton-data-quality.md)
- [P3 — Backend Operational Excellence](programs/backend-operational-excellence.md)
- [P4 — Property Workbench](programs/property-workbench.md)
- [P5 — TerraPilot Tool Maturity](programs/terrapilot-tool-maturity.md)
- [P6 — Work Order Engine](programs/work-order-engine.md)
- [P7 — AI / Brain / Operator System](programs/brain-operator-system.md)
- [P8 — Azure / DevOps / County Runtime](programs/azure-county-runtime.md)
- [P8-MGMT — Management Dashboard (roadmap Phase 8)](programs/p8-management-dashboard.md)
- [Codex Operator Autonomy](programs/codex-operator-autonomy.md)
- [Release Engineering](programs/release-engineering.md)
- [Governed Multi-Agent Operator Activation](programs/governed-multi-agent-operator-activation.md)

---

## Operator Doctrine Layer (WO-WOE-011)

The operator doctrine makes the agent the **operator** (not the human as dispatcher). It runs the
active program's dependency-cleared WOs inside recorded authority until a true wall.

| File | Purpose |
|------|---------|
| [GOAL_LOOP_AUTONOMY_RULES.md](GOAL_LOOP_AUTONOMY_RULES.md) | Prime directive: human = authority wall, not dispatcher; continue-without-asking rules (within-program) |
| [AUTONOMOUS_CONTINUATION_GATE.md](AUTONOMOUS_CONTINUATION_GATE.md) | Cross-program advance: on wall/exhaustion, record + park + advance to next safe lane (WO-WOE-012) |
| [CROSS_PROGRAM_DEPENDENCY_GRAPH.md](CROSS_PROGRAM_DEPENDENCY_GRAPH.md) | Authorization→unblocks map + prerequisite chains; makes the Wall Ledger operational (WO-WOE-014) |
| [OPERATOR_EXECUTION_PLAYBOOK.md](OPERATOR_EXECUTION_PLAYBOOK.md) | The per-loop procedure + mandatory result block |
| [NEXT_ACTION_MATRIX.md](NEXT_ACTION_MATRIX.md) | Deterministic "what to do next" from PR/gate/risk/wall state |
| [WORK_ORDER_PROGRAM_QUEUE.md](WORK_ORDER_PROGRAM_QUEUE.md) | Current cross-program queue snapshot |
| [STOP_WALL_REGISTER.md](STOP_WALL_REGISTER.md) | Canonical SW-01..SW-10 (supersedes `goal-loop/STOP_WALLS.md`) |

---

## Goal/Loop Command Layer (WO-WOE-010)

The command layer binds this register to `/goal` and `/loop` operating commands.

| File | Purpose |
|------|---------|
| [GOAL_LOOP_PLAYBOOK.md](GOAL_LOOP_PLAYBOOK.md) | Top-level doctrine and command model |
| [goal-loop/GOAL_COMMANDS.md](goal-loop/GOAL_COMMANDS.md) | `/goal` command definitions and program mappings |
| [goal-loop/LOOP_MODES.md](goal-loop/LOOP_MODES.md) | `/loop` mode definitions and continuation rules |
| [goal-loop/STOP_WALLS.md](goal-loop/STOP_WALLS.md) | Authority walls (SW-01 through SW-09) |
| [goal-loop/COMMAND_TO_PROGRAM_MAP.md](goal-loop/COMMAND_TO_PROGRAM_MAP.md) | Current-state: command → program → next WO → blockers |

**Canonical operator sequences:**

```
# Current: wait for PR #1112, then advance
/goal benton-demo
/loop merge-watch

# After #1112 merges — run preflight
/loop program

# Investigate data quality without mutation
/goal benton-data-quality
/loop evidence
```

---

## Change Log

| Date | Change | WO |
|------|--------|----|
| 2026-06-30 | Initial register created | WO-WOE-009 |
| 2026-06-30 | Added /goal column, stop-wall column, goal/loop command layer section | WO-WOE-010 |
| 2026-07-01 | Added Management Dashboard program (P8-MGMT), Operator Doctrine Layer, refreshed statuses; SW register extended to SW-01..SW-10 | WO-WOE-011 |
| 2026-07-01 | Added Autonomous Same-Risk Continuation Gate (cross-program advance + wall ledger) | WO-WOE-012 |
| 2026-07-01 | Added Cross-Program Dependency Graph (authorization→unblocks map, prerequisite chains) | WO-WOE-014 |
| 2026-07-03 | Replaced stale backend program with Backend Operational Excellence hardening/proof/release discipline chain | WO-BACKEND-000 |
| 2026-07-04 | Recorded zero-warning backend build register and routed next work to integration-test dependency classification | WO-BACKEND-OE-002 |
| 2026-07-04 | Refreshed Backend OE full executable playbook from OE-003 through OE-013 | WO-BACKEND-OE-PLAYBOOK-REFRESH |
| 2026-07-04 | Added master active-program playbook and global continuation/stop rules | WO-MASTER-PLAYBOOK-001 |
| 2026-07-05 | Promoted active program graph to explicit goal/loop execution playbook and command routing | WO-GOAL-LOOP-MASTER-PLAYBOOK-001 |
| 2026-07-05 | Classified Backend OE integration-test Docker/Testcontainers dependency and routed next to health/readiness semantics | WO-BACKEND-OE-003 |
| 2026-07-05 | Classified backend health/readiness endpoint semantics and routed next to ServiceRegistry runtime validation | WO-BACKEND-OE-004 |
| 2026-07-06 | Classified ServiceRegistry runtime validation as partial and routed next to security/auth/county-isolation proof | WO-BACKEND-OE-005 |
| 2026-07-06 | Consolidated backend security/auth/county-isolation proof matrix and routed next to migration/rollback proof | WO-BACKEND-OE-006 |
| 2026-07-06 | Inventoried backend migration and rollback source evidence and routed next to Dais E2E proof planning | WO-BACKEND-OE-007 |
| 2026-07-06 | Planned Dais workflow E2E proof expansion and routed next to backend release gate definition | WO-BACKEND-OE-008 |
| 2026-07-06 | Defined backend release gate criteria and routed next to operational runbook | WO-BACKEND-OE-009 |
| 2026-07-06 | Created backend operational runbook and routed next to diagnostics/observability map | WO-BACKEND-OE-010 |
| 2026-07-06 | Mapped backend diagnostics and observability signals and routed next to operational packet | WO-BACKEND-OE-011 |
| 2026-07-06 | Assembled backend operational packet and routed next to program closeout | WO-BACKEND-OE-012 |
| 2026-07-07 | Closed Backend Operational Excellence with evidence rollup and routed next action to owner/WOE lane selection | WO-BACKEND-OE-013 |
| 2026-07-07 | Added Codex Operator Work Order Playbook doctrine, lifecycle, continuation, PR/CI, owner-decision, merge authority, and rollup evidence | WO-CODEX-OP-001..009 |
| 2026-07-07 | Added Codex Operator Autonomy authority matrix, goal/loop contracts, stop classifier, PR lifecycle, hook exception, next-WO rule, evidence output standard, and rollup | WO-OP-AUTO-000..012 |
| 2026-07-07 | Started Release Engineering lane, created release program playbook, and created release gate evidence contract | WO-REL-002 |
| 2026-07-07 | Added release candidate evidence packet template and routed Release Engineering next to release tag/version evidence model | WO-REL-003 |
| 2026-07-08 | Added release tag/version evidence model and routed Release Engineering next to rollback drill authorization packet | WO-REL-004 |
| 2026-07-08 | Added rollback drill authorization packet and routed Release Engineering next to evidence rollup | WO-REL-005 |
| 2026-07-08 | Closed Release Engineering docs/governance baseline and recommended DevEx Hook Tooling as the next owner-selected lane | WO-REL-006 |
| 2026-07-08 | Added DevEx Hook Tooling bootstrap contract and routed next to hook determinism design | WO-DEVEX-HOOKS-002 |
| 2026-07-10 | Defined deterministic hook execution policy and routed implementation to explicit owner authorization | WO-DEVEX-HOOKS-003 |
| 2026-07-10 | Repaired deterministic hooks without package/lockfile mutation and routed next to worktree hygiene evidence | WO-DEVEX-HOOKS-004 |
| 2026-07-10 | Classified 54 worktrees without cleanup and routed next to clean-worktree bootstrap verification | WO-DEVEX-HOOKS-005 |
| 2026-07-13 | Registered PROGRAM-MAO-001, reconciled authority semantics, and routed the two-lane pilot | WO-MAO-001 |
| 2026-07-13 | Separated one-time MAO-002 owner bootstrap authority from Codex-maintained execution state before pilot launch | WO-MAO-001A |
| 2026-07-15 | Closed PROGRAM-MAO-001 as PASS_WITH_GAPS, consumed the R3 continuation envelope, and routed to portfolio reconciliation | WO-MAO-007 |
| 2026-07-16 | Ratified continuous standing delivery authority and mechanically classified eligible work MERGE_AND_CONTINUE | WO-PORTFOLIO-004 |
| 2026-07-17 | Admitted and repaired the post-merge evidence publisher's 1,000-asset release-capacity defect | WO-PORTFOLIO-005 |
