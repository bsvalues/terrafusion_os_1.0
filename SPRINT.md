# TerraFusion Sprint — Phase 33A.4

> Started: 2026-03-24
> Mode: Post-discovery. One builder per task. See AGENT_OPERATING_MODEL.md.

---

## Active Task Cards

---

### CARD-01 — Alpha Defect Triage & Backend Fixes

```
Task:           Triage and fix backend issues found during staff alpha
Owner:          Claude Code
Mode:           Single-builder
Repo:           terrafusion_os_1.0
Allowed files:
  - backend/src/TerraFusion.API/Controllers/PacsController.cs
  - backend/src/TerraFusion.API/Controllers/PacsOpsController.cs
  - backend/src/TerraFusion.API/Controllers/ForgeController.cs
  - backend/src/TerraFusion.API/Services/ValuationService.cs
  - backend/src/TerraFusion.Core/PACS/*
  - related DTOs and tests
Out of scope:
  - frontend/ (any file)
  - shell components
  - launcher / workbench window manager
Acceptance test:
  - Any defect with severity P0 or P1 from alpha is fixed and tested
  - Backend build clean: dotnet build TerraFusion.sln
  - Relevant curl checks pass
Reviewer:       Copilot (ergonomics + contract shape check)
```

---

### CARD-02 — Alpha UX Polish

```
Task:           Polish internal alpha UX based on staff feedback
Owner:          Copilot
Mode:           Single-builder
Repo:           terrafusion_os_1.0
Allowed files:
  - frontend/apps/os-shell/public/alpha.html
  - frontend/apps/os-shell/src/pages/workbench/tabs/PropertySummary.tsx
  - frontend/apps/os-shell/src/components/workbench/*
  - frontend/apps/os-shell/src/pages/workbench/PropertyWorkbenchWindow.tsx
Out of scope:
  - backend/ (any file)
  - Launcher.tsx (done — do not touch)
  - useKeyboardShortcuts.ts (done — do not touch)
  - PropertyForge.tsx (done — do not touch)
Acceptance test:
  - /alpha.html reflects any staff feedback on scenarios
  - Tab empty states are clearly labeled (no ambiguity)
  - TypeScript compiles clean
Reviewer:       Claude Code (contract alignment check)
```

---

### ~~CARD-03 — Forge /years Backend Endpoint~~ ✅ CLOSED (stale — already live)

> **Truth gate result (2026-03-24):** endpoint is fully implemented and live on main.
> No implementation work needed.

**Evidence:**
- `ForgeController.cs` line 36: `[HttpGet("{parcelId}/years")]` ✅
- `IValuationService.cs` line 22: `Task<ParcelYearLayersResult> GetAvailableYearsAsync(...)` ✅
- `ValuationService.cs` line 378: full implementation present ✅
- Build: `0 errors` ✅
- curl `http://localhost:5000/api/forge/101843030001006/years` → **200** ✅
- curl `http://localhost:5000/api/forge/101562000001000/years` → **200** ✅ (`currentUseAg: true`)

**Data observation (not a code bug):**
Both test parcels return a single 2015 layer with `isEarliestKnownLayer: true`.
That is the PACS ETL migration baseline — only the base year was seeded in dev SQLite.
Multi-year layers require production SQL Server data. Not a blocker; document in Reality Report.

> CARD-03 is closed. Card was stale. Concrete was not poured twice.

---

### CARD-04 — Benton Product Reality Report v1

```
Task:           Write the Benton Product Reality Report after alpha testing
Owner:          Claude Code (backend truth section) + Copilot (frontend truth section)
Mode:           Discovery Handoff → both write their own section, human assembles
Repo:           terrafusion_os_1.0
Allowed files:
  - docs/alpha/BENTON_REALITY_REPORT_V1.md (new file)
Out of scope:
  - No code changes — document only
Acceptance test:
  - Parcel search: pass/fail
  - Parcel detail load: pass/fail
  - Forge overview/cost/sales: pass/fail
  - Every Workbench tab status (real / fallback / broken / empty)
  - Exact remaining blockers
  - Any still-fake surfaces
  - Exact seeded parcel count verified in dev
Reviewer:       Benton County Assessor (sole human)
```

---

### CARD-05 — Publish Module Integration Map ✅ DONE

```
Task:           Publish the living module integration map
Owner:          Copilot
Mode:           Single-builder
Repo:           terrafusion_os_1.0
Deliverable:    docs/module-integration-map.md — source-truth index of all 14 modules
Allowed files:
  - docs/module-integration-map.md (new file)
  - SPRINT.md (this card only)
Out of scope:
  - No code changes
  - No QUARANTINE moves
  - No wiring, manifests, or platform registration
  - Module wiring work requires its own task card + governance discovery/plan
Acceptance:
  - docs/module-integration-map.md exists with all 14 module rows ✅
  - GitHub org is bsvalues (not bsvalverde) throughout ✅
  - TerraFUsionPermit capital U confirmed ✅
  - No implementation phases in the doc ✅
Commit:         docs(modules): add living module integration map
```

---

## Completed Cards

| Card | Task | Owner | Commit / Note |
|------|------|-------|--------|
| A | Benton Reality Bridge (PACS search, EfAdapter, SQL search) | Claude Code | 1263b3062 |
| B | Honest surface sweep (no demo badges on real data) | Claude Code | 1263b3062 |
| C | Tab truth matrix (7 real / 2 stub) | Claude Code | 1263b3062 |
| D | Dual-dialog fix (Launcher → startMenuStore) | Claude Code | 7e0704bd8 |
| E | Internal alpha harness (/alpha.html) | Claude Code | 7e0704bd8 |
| F | Forge year-layer truth UI (selector + context panel wired) | Claude Code | 7e0704bd8 |
| 03 | Forge /years endpoint — **already live on main, truth gate closed it** | Truth gate | curl 200 confirmed |
