# P4 — Property Workbench

**Program:** P4  
**Status:** QUEUED  
**Owner:** Operator (bsvalues@gmail.com)  
**Last Updated:** 2026-06-30

---

## Goal

Make the parcel workbench the canonical assessor experience. The workbench is the primary UI surface for Benton County assessors — it must show real data, real routes, real tabs, and honest empty states. This program audits what exists, defines the data contracts per tab, and closes each gap with a runtime-proven endpoint or a documented honest-empty state.

---

## Sovereignty Boundary

| Allowed | Blocked |
|---------|---------|
| Frontend UI changes | Schema changes |
| New API read endpoints | Data mutation |
| Route/tab contract definition | PACS connection |
| Evidence docs | Production deployment |
| Honest empty state components | Fake/stub data in UI |

---

## Context

The Property Workbench is referenced in memory as "window contract + routes frozen" (from `project_workbench_identity.md`). It is the core assessor tool. Prior work established the dual-screen office model and the suite/workbench identity distinction.

**Known facts:**
- `/workbench` route returns 200 (SPA serves index.html) — API backing is not wired
- `/dossier` route similarly returns 200 but no API endpoint
- Parcel list API: `GET /api/counties/benton/parcels` — PROVEN (84,388 parcels)
- Parcel detail: works via parcel number filter
- Improvements, land, owners, geom: 404 (no read endpoints)

---

## Work Orders (Ordered)

| WO | Title | Status | Description |
|----|-------|--------|-------------|
| WO-WORKBENCH-001 | Workbench Reality Audit | COMPLETE / PR OPEN | What routes/tabs/panels exist in the UI? What currently renders real data vs placeholder? |
| WO-WORKBENCH-002 | Routing / Deep-Link Truth | COMPLETE / PR OPEN | Parcel-scoped route and deep-link evidence for `/property/:parcelId[/tab]`. |
| WO-WORKBENCH-003 | Tab + Tool Maturity Classification | COMPLETE / PR OPEN | Classify canonical tabs, R3 extension tabs, tool surfaces, and write-like requests. |
| WO-WORKBENCH-004 | Forge Surface Truth | IN FLIGHT | CostForge / ValuForge tab surface, data sources, write lanes, and honest empty states. |
| WO-WORKBENCH-005 | Atlas Surface Truth | IN FLIGHT | Atlas map/GIS tab surface, source posture, token behavior, and export/custody caveats. |
| WO-WORKBENCH-006 | Dais Surface Truth | QUEUED | Dais workflow tab surface, workflow state, appeal/notice actions, and honest empty states. |
| WO-WORKBENCH-007 | Dossier Surface Truth | QUEUED | Dossier evidence/document surface, parcel history, notes, exports, and custody posture. |
| WO-WORKBENCH-008 | Pilot Integration Truth | QUEUED | Pilot assistant/tool integration in Workbench context. |
| WO-WORKBENCH-009 | End-to-End Parcel Flow Evidence | QUEUED | Prove assessor flow: search/detail context → Forge → Atlas → Dais/Dossier/Pilot evidence. |
| WO-WORKBENCH-010 | Property Workbench Operational Packet | QUEUED | Package Workbench operation, validation, authority walls, rollback, and promotion criteria. |
| WO-WORKBENCH-011 | Evidence Rollup | QUEUED | Close Program 3 baseline with evidence, known gaps, and next-lane recommendation. |

---

## Dependency Chain

```
001 → 002 → 003 ─┐
                  ├─ 004, 005, 006, 007, 008 (surface truth packets) → 009 → 010 → 011
```

003 classifies the tab/tool maturity baseline after 001+002. Surface truth packets 004-008 can be audited in parallel once the maturity baseline exists. 009, 010, and 011 require all canonical surface truth packets complete.

---

## Operator Decision Walls

- Adding new backend API endpoints requires deciding scope vs. demo timeline
- Atlas map integration may require MapLibre token or tile service setup (operator provides)
- If parcel detail requires a new controller, scope against P1/demo timeline

---

## Stop Conditions

- If the surface audit (001) shows the workbench is fundamentally unrouted or broken, escalate before further tab work
- Do not add fake/stub data to make tabs appear full — honest empty states only
