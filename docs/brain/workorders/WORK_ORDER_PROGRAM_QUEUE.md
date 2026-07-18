# Work Order Program Queue (Current State)

**Version:** 1.0
**Date:** 2026-07-17
**Authority:** WO-ATLAS-008
**Classification:** Operator Doctrine — live cross-program queue snapshot

> This file is the **current-state** view. Structural program definitions live in
> [PROGRAM_PLAYBOOK_REGISTER.md](PROGRAM_PLAYBOOK_REGISTER.md) and `programs/*.md`. Update this file
> as WOs complete.

---

## Active Goal

WO-ATLAS-008 is the active docs-only R1 disposition audit on base
`c2744855cc6ae4f8966f6ed8460b065588e8908b`. Live GIS package source and types use
`VITE_MAPBOX_ACCESS_TOKEN`; no tracked live reader consumes the two `MAPBOX_ACCESS_TOKEN` README and
metadata references. The audit classifies them as stale without reading a token value or changing the
package. WO-ATLAS-009 is bounded but blocked because the wave planner unconditionally excludes
`packages/**`. WO-PORTFOLIO-009 is the next executable R3 node and must add a fail-closed exact-file
owner-authority adapter before the package alignment becomes ready.

`WO-MAO-000` through `WO-MAO-004` are complete. The two-lane pilot merged PRs #1281 and #1280,
received independent exact-head and post-merge assurance, and recorded zero founder queue-routing
touches after bootstrap. PR #1284 then proved mechanical path, contract, and environment reservation
enforcement. PR #1286 added the read-only executable graph and parallel-wave planner. The ratified
R3 continuation envelope closed `WO-MAO-005` in PR #1287 and `WO-MAO-006` in PR #1288. WO-MAO-007
closes the program as `PASS_WITH_GAPS` and consumes the envelope on protected merge.

---

## Program Queues

### portfolio-operator (`GOAL-PORTFOLIO-OPERATOR-001` / `LOOP-PORTFOLIO-OPERATOR-001`)
| WO | State | Notes |
|----|-------|-------|
| WO-PORTFOLIO-004 Standing Operator Authority | DONE | PR #1297 merged; standing delivery lifecycle authority active |
| WO-PORTFOLIO-005 Evidence Publisher Capacity Repair | DONE | PR #1298 merged; post-merge release shard and 13 assets verified |
| WO-BACKEND-014 Health Build-Provenance Truth | DONE | PR #1299 merged; endpoint and canonical container build provenance verified |
| WO-PORTFOLIO-006 Shell Routing Contract Reconciliation | DONE | PR #1300 merged; static contract corrected and unscoped handoff gap recorded honestly |
| WO-PORTFOLIO-007 Unscoped Workbench Tab Handoff | DONE | PR #1301 merged; canonical fallback mounted and validated tab intent preserved |
| WO-PORTFOLIO-008 Open PR Backlog Reconciliation | DONE | PR #1302 merged; stale backlog reconciled and Atlas audit admitted |
| WO-ATLAS-001 MapLibre Migration Reality Audit | DONE | PR #1303 merged; #1073 closed as stale/unsafe and exact frontend boundary exposed |
| WO-ATLAS-002 PropertyAtlas Popup Text-Safety Repair | DONE | PR #1304 merged; boundary-derived situs now renders as popup text with hostile-input proof |
| WO-ATLAS-003 Map Renderer Contract Decision | DONE | PR #1305 merged; Mapbox retained as current baseline with provider-neutral migration contract |
| WO-ATLAS-004 GeoForge Popup Content Safety Audit | DONE | PR #1306 merged; eight API-derived popup HTML sites inventoried with exact repair contract |
| WO-ATLAS-005 GeoForge Popup DOM Safety Repair | DONE | PR #1307 merged; all eight HTML paths replaced with static DOM/textContent and hostile-input proof |
| WO-ATLAS-006 Mapbox Token Alias Contract Audit | DONE | PR #1308 merged; browser contract narrowed and GIS package metadata follow-up recorded |
| WO-ATLAS-007 GeoForge Mapbox Token Alias Cleanup | DONE | PR #1309 merged; V2 fallback removed, V1/V2 guidance aligned, focused proof and build green |
| **WO-ATLAS-008 GIS Package Mapbox Token Metadata Disposition Audit** | **CURRENT - complete on protected merge** | Two unconsumed package references classified as stale browser guidance/metadata |
| WO-ATLAS-009 GIS Package Mapbox Token Metadata Alignment | BLOCKED - protected package reservation | Await mechanical exact-file authority evaluation in WO-PORTFOLIO-009 |
| **WO-PORTFOLIO-009 Protected-Path Authority Planner Integration** | **NEXT - bounded R3** | Make explicit owner decisions executable without weakening protected-path denial |

### governed-multi-agent-operator-activation (`GOAL-MAO-001` / `LOOP-MAO-001`)
| WO | State | Notes |
|----|-------|-------|
| WO-MAO-000 Doctrine Conflict Audit | DONE | Full read-only contradiction matrix and historical denominator persisted in governed evidence |
| WO-MAO-001 Governance Reconciliation and Operator-Merge Ratification | DONE | PR #1273 merged at `b936904b76a1593d12e524434e94872f2e9a78fe` |
| WO-MAO-001A Separate Owner Bootstrap Authority from Operator Execution State | DONE | PR #1274 merged; split owner/bootstrap and operator/execution contract is canonical |
| WO-MAO-002 Minimal Two-Lane Pilot | DONE | PRs #1281 and #1280 merged; independent post-merge assurance PASS; evidence persisted |
| WO-MAO-003 Dispatch/Reservation Contract + Mechanical Gate | DONE | PR #1284 merged; intentional overlap rejected and release/handoff recovery proved |
| WO-MAO-004 Executable Graph / Parallel Wave Planner | DONE | PR #1286 merged; pure planner computes dependency-cleared, reservation-safe bounded waves |
| WO-MAO-005 Evidence-Informed Agent Playbooks | DONE | PR #1287 merged six evidence-grounded playbooks plus durable transition assertions |
| WO-MAO-006 Portfolio Rollout | DONE | PR #1288 merged bounded allocation, concurrency, cross-repo prerequisites, status, and recovery truth |
| WO-MAO-007 Evidence Rollup and Canon Closeout | DONE | Program closed PASS_WITH_GAPS; authority consumed; next route is portfolio reconciliation |

### p8-management-dashboard  (`/goal p8-management-dashboard`)
| WO | State | PR | Notes |
|----|-------|----|-------|
| WO-P8-MGMT-001 Discovery & Scope Packet | DONE | #1122 merged | Both dashboards already exist |
| WO-P8-MGMT-002 Local os-shell vs Azure proof | DONE | #1123 queued/merged | Reachability proven |
| WO-P8-MGMT-003 Sync Doctrine client conformance | DONE | #1125 queued on CI | Single-config now works |
| **WO-P8-MGMT-004 Frontend Deployment Authorization Packet** | **DONE** | this PR | Packet records host/config/health/honesty/rollback decision contract; no deployment |
| WO-P8-MGMT-005 Frontend Deployment Execution | WALL | — | **SW-01** - needs authorization |

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
| WO-DATA-BENTON-DUPE-001 | DONE | PR #1115; investigation complete |
| WO-DATA-BENTON-ADDR-001 Address/legal null audit | DONE | PR #1132 |
| WO-DATA-BENTON-GEOM-001 Geometry availability audit | DONE | PR #1132 |
| WO-DATA-BENTON-OWNER-001 Owner boundary audit | DONE | PR #1132 |
| WO-DATA-BENTON-IMPR-LAND-001 Improvements/land gap audit | DONE | PR #1132 |
| WO-DATA-BENTON-SALE-001 Sales data audit | DONE | PR #1156 |
| WO-DATA-BENTON-EVIDENCE-ROLLUP | DONE | PR #1152; safe audit queue exhausted |
| WO-DATA-BENTON-QUARANTINE-001 Credentialed verification | DONE | PR #1164; prior SW-03 grant consumed |
| WO-DATA-BENTON-DUPE-001B Delete 30 rows | DONE | PR #1166; prior SW-02 grant consumed |
| New backfill, entitlement, sync, or protected remediation | PARKED | Requires a new bounded WO and applicable authority |

### backend-excellence  (`/goal backend-excellence`)
| WO | State |
|----|-------|
| WO-BACKEND-OE-001..013 | DONE - program closed |
| WO-BACKEND-014 Health Build-Provenance Truth | DONE - PR #1299 merged |
| Any other backend implementation | PARKED - requires a new bounded program/WO authority |

### property-workbench  (`/goal property-workbench`)
| WO | State |
|----|-------|
| WO-WORKBENCH-001..011 | DONE - evidence baseline closed |
| Any new product phase | PARKED - no automatic restart; new authority required |

### terrapilot-maturity  (`/goal terrapilot-maturity`)
| WO | State | Notes |
|----|-------|-------|
| WO-TERRAPILOT-P1 Tool Maturity Matrix | DONE/PARTIAL | — |
| WO-TERRAPILOT-P2 through P15 | DONE / parked baseline | Green contract does not claim live integration |
| WO-TERRAPILOT-P16 | PARKED | Design/runtime promotion boundary requires explicit authority |

### work-order-engine  (`/goal work-order-engine`)
| WO | State |
|----|-------|
| WO-WOE-001..012 | DONE |
| WO-WOE-014 Cross-Program Dependency Graph | DONE |
| **WO-WOE-013 Program Queue Report** | **DONE** - PR #1291; deterministic read-only Markdown report; no frontend route |

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
| WO-AZURE-001 App Service preflight | DONE | PR #1275; committed evidence only, no live access |
| WO-AZURE-002 App settings and secret inventory | DONE | PR #1293; key names, source classes, storage posture, ownership, and protected gaps |
| WO-AZURE-003 Deployment slot strategy | DONE ON MERGE | Blue/green policy from committed evidence only; no slot inspection, creation, configuration, swap, or deployment |
| WO-AZURE-004 Observability and log capture | DEPENDENCY BLOCKED | Requires authorized 003D live-smoke evidence |
| WO-AZURE-005 Rollback and restart runbook | DEPENDENCY BLOCKED | Requires authorized 003D live-smoke evidence |
| WO-AZURE-006 County-owned production boundary packet | PARKED | Explicit owner / production authority gate |

---

## Global Walls In Effect — Wall Ledger (per [AUTONOMOUS_CONTINUATION_GATE.md](AUTONOMOUS_CONTINUATION_GATE.md) §3)

*(Updated 2026-07-16 by WO-PORTFOLIO-003 reconciliation)*

| Program | Parked WO | Wall | Reason | Evidence |
|---------|-----------|------|--------|----------|
| p8-management-dashboard | MGMT-005 frontend deploy | SW-01 / SW-10 | deploy SPA + auth posture | `WO_P8_MGMT_004_*` |
| benton-data-quality | any new backfill, entitlement mutation, sync pass, or PACS follow-up | SW-02 / SW-03 / SW-08 | safe audit, credentialed verification, and duplicate cleanup are complete; further work is protected | `WO_DATA_BENTON_{EVIDENCE_ROLLUP,QUARANTINE_001,DUPE_001B}_*` |
| terrapilot-maturity | first-tool L3 promotion | SW-01 / SW-09 / SW-10 | deploy Node runtime + integrate | `WO_TERRAPILOT_P3_P6_*` |
| benton-demo | DEPLOY-BENTON-003D live smoke / evidence | SW-01 / SW-04 | live deployment and go-live boundary | `programs/benton-demo-deployment.md` |
| sovereign-sync-workbook-tooling | WO-SYNC-132 implementation | SW-05 / recorded owner-selection gate | no active program authority | `programs/ACTIVE_PROGRAM_PLAYBOOK.md` |
| local-omen-runtime-repair | WO-LOCAL-093 | SW-09 | runtime diagnosis/repair authority required | `programs/ACTIVE_PROGRAM_PLAYBOOK.md` |
| runtime-import-disposition | WO-CORE-1 | SW-05 / sovereign boundary | explicit import disposition required | `programs/ACTIVE_PROGRAM_PLAYBOOK.md` |
| azure-county-runtime | WO-AZURE-004 through WO-AZURE-006 | SW-01 / SW-03 / SW-04 | safe docs slice ends at WO-AZURE-003; remaining work needs live evidence, credentials, deployment, or county authority | `programs/azure-county-runtime.md` |

**Portfolio result after WO-PORTFOLIO-007 admission:** `ACTIVE`. Protected Azure, deployment,
county-production, runtime-repair, product-promotion, protected-data, and sovereign-import boundaries
remain parked, but the bounded R3 Workbench handoff correction is executable and does not cross any
of them.

---

## Operator Note

Under `/loop program` (within-program scope), run dependency-cleared WOs inside recorded authority without
returning to the human, and **STOP + surface the wall** when the active program hits one. Cross-program
advance (park-and-advance) is the **portfolio-operator** program's job only. The live "current node / next
WO" is **this queue**, not any `Current Selection` prose in `programs/*.md`. See
[CONTINUATION_RULEBOOK.md](CONTINUATION_RULEBOOK.md) and
[GOAL_LOOP_AUTONOMY_RULES.md](GOAL_LOOP_AUTONOMY_RULES.md).
