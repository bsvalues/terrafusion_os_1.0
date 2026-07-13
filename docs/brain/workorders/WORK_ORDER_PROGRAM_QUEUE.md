# Work Order Program Queue (Current State)

**Version:** 1.0
**Date:** 2026-07-01
**Authority:** WO-WOE-011
**Classification:** Operator Doctrine — live cross-program queue snapshot

> This file is the **current-state** view. Structural program definitions live in
> [PROGRAM_PLAYBOOK_REGISTER.md](PROGRAM_PLAYBOOK_REGISTER.md) and `programs/*.md`. Update this file
> as WOs complete.

---

## Active Goal

`governed-multi-agent-operator-activation` - `GOAL-MAO-001` / `LOOP-MAO-001`.

`WO-MAO-000` is complete. `WO-MAO-001` is the active governance-reconciliation Work Order and
`WO-MAO-002` is the next dependency-cleared node after merge. The pilot is limited to two disjoint
dispatch packets and two exact PRs; it does not claim to prove reservation enforcement.

---

## Program Queues

### governed-multi-agent-operator-activation (`GOAL-MAO-001` / `LOOP-MAO-001`)
| WO | State | Notes |
|----|-------|-------|
| WO-MAO-000 Doctrine Conflict Audit | DONE | Read-only contradiction matrix and historical denominator captured |
| **WO-MAO-001 Governance Reconciliation and Operator-Merge Ratification** | **ACTIVE** | Governance-only reconciliation; bounded merge model ratification |
| WO-MAO-002 Minimal Two-Lane Pilot | NEXT | Two disjoint WOs; independent read-only post-merge reviewer; exact pilot PR merge grants only |
| WO-MAO-003 Dispatch/Reservation Contract + Mechanical Gate | QUEUED | Must reject an intentional overlapping reservation |
| WO-MAO-004 Executable Graph / Parallel Wave Planner | QUEUED | Dependency and conflict-aware dispatch waves |
| WO-MAO-005 Evidence-Informed Agent Playbooks | QUEUED | Rules must cite pilot/enforcement evidence |
| WO-MAO-006 Portfolio Rollout | QUEUED | Expand only after pilot and mechanical gate evidence |
| WO-MAO-007 Evidence Rollup and Canon Closeout | QUEUED | Measures founder touches, concurrency, cycle time, and violations |

### p8-management-dashboard  (`/goal p8-management-dashboard`)
| WO | State | PR | Notes |
|----|-------|----|-------|
| WO-P8-MGMT-001 Discovery & Scope Packet | DONE | #1122 merged | Both dashboards already exist |
| WO-P8-MGMT-002 Local os-shell vs Azure proof | DONE | #1123 queued/merged | Reachability proven |
| WO-P8-MGMT-003 Sync Doctrine client conformance | DONE | #1125 queued on CI | Single-config now works |
| **WO-P8-MGMT-004 Frontend Deployment Authorization Packet** | **NEXT** | — | Docs/packet only (R1). NOT deployment |
| *actual frontend deployment* | WALL | — | **SW-01** — needs authorization |

### benton-demo  (`/goal benton-demo`)
| WO | State | Notes |
|----|-------|-------|
| WO-DEPLOY-BENTON-002 / 003A / 003B / 003C | DONE | App Service + DB live; /health green |
| WO-CONFIG-BENTON-001 | DONE | #1112 merged |
| WO-DEPLOY-BENTON-003D Post-Provision Smoke / Evidence Rollup | NEXT (if authorized) | Touches live surface |
| Production launch / county go-live | WALL | **SW-04** |

### benton-data-quality  (`/goal benton-data-quality`)
| WO | State | Notes |
|----|-------|-------|
| WO-DATA-BENTON-DUPE-001 | DONE | Investigation complete |
| WO-DATA-BENTON-ADDR-001 Address/legal null audit | NEXT (R0 read-only) | Safe |
| WO-DATA-BENTON-GEOM-001 Geometry availability audit | QUEUED (R0) | Safe |
| WO-DATA-BENTON-OWNER-001 Owner boundary audit | QUEUED (R0) | Safe |
| WO-DATA-BENTON-IMPR-LAND-001 Improvements/land gap audit | QUEUED (R0) | Safe |
| WO-DATA-BENTON-DUPE-001B Delete 30 rows | PARKED | **SW-02** |

### backend-excellence  (`/goal backend-excellence`)
| WO | State |
|----|-------|
| WO-BACKEND-001 Reality Audit → 002 Warning Burn-down → 003 Service Registry → 004 Health/Readiness Truth → 005 Runtime Config Contract → 006 Auth/Security Proof → 007 Release Gate → 008 Operational Packet | QUEUED |
| Stop for: auth/security policy (SW-10), DB mutation (SW-02), deploy (SW-01) | — |

### property-workbench  (`/goal property-workbench`)
| WO | State |
|----|-------|
| WO-WORKBENCH-001..010 (surface audit → route/tab truth → parcel path → Forge/Atlas/Dais/Dossier/Pilot contracts → reserved-office gating → E2E evidence) | QUEUED |
| Stop for: product behavior change beyond scope (SW-09), reserved-office → tool-discovery policy | — |

### terrapilot-maturity  (`/goal terrapilot-maturity`)
| WO | State | Notes |
|----|-------|-------|
| WO-TERRAPILOT-P1 Tool Maturity Matrix | DONE/PARTIAL | — |
| WO-TERRAPILOT-P2 Promotion Protocol → P3 Handler Parity → P4 Stub Disclosure → P5 First Real Backend Tool → P6 Evidence Rollup | NEXT/QUEUED | Green contract ≠ live integration |

### work-order-engine  (`/goal work-order-engine`)
| WO | State |
|----|-------|
| WO-WOE-001..010 | DONE |
| **WO-WOE-011 Full Operator Playbook** | **THIS WO** |
| WO-WOE-012 Autonomous Same-Risk Continuation Gate → 013 Program Queue UI/Report → 014 Cross-Program Dependency Graph | QUEUED |

### brain-operator  (`/goal brain-operator`)
| WO | State |
|----|-------|
| WO-BRAIN-001 | DONE - PR #1140 |
| WO-BRAIN-002 | DONE - pack completeness audited |
| WO-BRAIN-003 | DONE - command vocabulary reconciled |
| WO-BRAIN-004 | DONE - goal maturity reviewed |
| WO-BRAIN-005 | DONE - loop maturity reviewed |
| WO-BRAIN-006 | DONE - memory and provenance integration audited |
| WO-BRAIN-007 | DONE - agent role and stop-gate matrix defined |
| WO-BRAIN-008 | DONE - continuation rulebook reconciled (`CONTINUATION_RULEBOOK.md`) |
| WO-BRAIN-009 | DONE - integration evidence / closeout (PARTIAL / INTEGRATION GAP; baseline closed) |

### azure-county-runtime  (`/goal azure-county-runtime`)
| WO | State | Notes |
|----|-------|-------|
| WO-AZURE-001+ | QUEUED | Most steps cross SW-01 |

---

## Global Walls In Effect — Wall Ledger (per [AUTONOMOUS_CONTINUATION_GATE.md](AUTONOMOUS_CONTINUATION_GATE.md) §3)

*(Updated 2026-07-01 after the 5-lane autonomous run)*

| Program | Parked WO | Wall | Reason | Evidence |
|---------|-----------|------|--------|----------|
| p8-management-dashboard | MGMT-005 frontend deploy | SW-01 / SW-10 | deploy SPA + auth posture | `WO_P8_MGMT_004_*` |
| benton-data-quality | DUPE-001B (delete 30 rows) | SW-02 | data mutation | `WO_DATA_BENTON_DUPE_001` |
| benton-data-quality | quarantine classification (owner 87,909 / imprv-attr 1.87M) | SW-03 | credentialed DB read | `WO_DATA_BENTON_{OWNER,IMPR_LAND}_001` |
| backend-excellence | BACKEND-004/005/006 | SW-09 / SW-10 | health/config/auth code + GIT_SHA | `WO_BACKEND_001_*` |
| property-workbench | SPA deploy / pilot runtime / reserved-office | SW-01 / SW-09 / SW-10 | reachability + runtime + auth | `WO_WORKBENCH_001_010_*` |
| terrapilot-maturity | first-tool L3 promotion | SW-01 / SW-09 / SW-10 | deploy Node runtime + integrate | `WO_TERRAPILOT_P3_P6_*` |

**Selected safe lane:** brain-operator evidence baseline is COMPLETE at WO-BRAIN-009; next action is
**portfolio reconciliation** (no lane preselected). WOE-012 and WOE-014 are complete; WOE-013
remains an R2 UI soft wall.

---

## Operator Note

Under `/loop program` (within-program scope), run dependency-cleared WOs inside recorded authority without
returning to the human, and **STOP + surface the wall** when the active program hits one. Cross-program
advance (park-and-advance) is the **portfolio-operator** program's job only. The live "current node / next
WO" is **this queue**, not any `Current Selection` prose in `programs/*.md`. See
[CONTINUATION_RULEBOOK.md](CONTINUATION_RULEBOOK.md) and
[GOAL_LOOP_AUTONOMY_RULES.md](GOAL_LOOP_AUTONOMY_RULES.md).
