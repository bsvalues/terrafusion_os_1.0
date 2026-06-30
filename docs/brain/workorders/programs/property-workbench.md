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
| WO-WORKBENCH-001 | Current surface audit | **NEXT** | What routes/tabs/panels exist in the UI? What currently renders real data vs placeholder? |
| WO-WORKBENCH-002 | Route and tab truth matrix | QUEUED | For each route/tab: what data source, what API, what honest-empty state should show |
| WO-WORKBENCH-003 | Parcel detail path integration | QUEUED | Wire parcel detail view to `GET /api/counties/benton/parcels?parcelNumber=X` |
| WO-WORKBENCH-004 | Forge tab data contract | QUEUED | CostForge / ValuForge tab: what data, what API, honest empty if not loaded |
| WO-WORKBENCH-005 | Atlas/map tab data contract | QUEUED | Atlas map tab: geom availability (79,199 shapes), MapLibre integration decision |
| WO-WORKBENCH-006 | Dais workflow tab contract | QUEUED | Dais tab: workflow state, appeal queue, honest empty |
| WO-WORKBENCH-007 | Dossier/evidence tab contract | QUEUED | Dossier tab: parcel history, notes, evidence; honest empty vs placeholder |
| WO-WORKBENCH-008 | Pilot/tool assistant contract | QUEUED | Pilot AI assistant: what tools are live vs stub in the workbench context |
| WO-WORKBENCH-009 | Reserved office gating closure | QUEUED | Ensure "reserved" boundary check is implemented for non-workbench routes |
| WO-WORKBENCH-010 | End-to-end parcel flow evidence packet | QUEUED | Prove full parcel flow: search → detail → forge → atlas → dossier |

---

## Dependency Chain

```
001 → 002 → 003 ─┐
                  ├─ 004, 005, 006, 007, 008 (parallel) → 009 → 010
```

003 (parcel detail integration) can start after 001+002. Tabs 004-008 can be audited in parallel. 009 and 010 require all tab contracts complete.

---

## Operator Decision Walls

- Adding new backend API endpoints requires deciding scope vs. demo timeline
- Atlas map integration may require MapLibre token or tile service setup (operator provides)
- If parcel detail requires a new controller, scope against P1/demo timeline

---

## Stop Conditions

- If the surface audit (001) shows the workbench is fundamentally unrouted or broken, escalate before further tab work
- Do not add fake/stub data to make tabs appear full — honest empty states only
