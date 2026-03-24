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

### CARD-03 — Forge /years Backend Endpoint

```
Task:           Implement GET /api/forge/{parcelId}/years in backend
Owner:          Claude Code
Mode:           Single-builder
Repo:           terrafusion_os_1.0
Allowed files:
  - backend/src/TerraFusion.API/Controllers/ForgeController.cs
  - backend/src/TerraFusion.Core/PACS/IPacsAdapter.cs
  - backend/src/TerraFusion.API/Services/PacsEfAdapter.cs
  - backend/src/TerraFusion.Core/PACS/PacsSqlAdapter.cs
  - related DTOs and tests
Out of scope:
  - frontend/ (any file)
  - ForgeYearSelector.tsx (done — do not touch)
  - ForgeYearContextPanel.tsx (done — do not touch)
Acceptance test:
  - curl http://localhost:5000/api/forge/{known-parcel-id}/years
  - Returns { parcelId, layers: [...], defaultYear: NNNN }
  - Each layer has: year, supNum, isLocked, propState, programs, assessedValue, marketValue
  - If no layers exist, returns { layers: [], defaultYear: null } not 404
  - Frontend ForgeYearSelector shows real PACS years for the test parcel
Reviewer:       Copilot (frontend contract verification)
```

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

## Completed Cards (Phase 33A.3)

| Card | Task | Owner | Commit |
|------|------|-------|--------|
| A | Benton Reality Bridge (PACS search, EfAdapter, SQL search) | Claude Code | 1263b3062 |
| B | Honest surface sweep (no demo badges on real data) | Claude Code | 1263b3062 |
| C | Tab truth matrix (7 real / 2 stub) | Claude Code | 1263b3062 |
| D | Dual-dialog fix (Launcher → startMenuStore) | Claude Code | 7e0704bd8 |
| E | Internal alpha harness (/alpha.html) | Claude Code | 7e0704bd8 |
| F | Forge year-layer truth UI (selector + context panel wired) | Claude Code | 7e0704bd8 |
