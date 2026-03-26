# TerraFusion Sprint — Phase 33A.4

> Started: 2026-03-24
> Mode: Post-discovery. One builder per task. See AGENT_OPERATING_MODEL.md.

---

## Active Task Cards

---

### ~~CARD-01 — Alpha Defect Triage & Backend Fixes~~ ✅ CLOSED (stale — truth gate, no active defects)

> **Truth gate result (2026-03-26):** All CARD-01 allowed files are clean. Backend build: 0 errors, 0 warnings.
> No P0/P1 defects exist within the scoped file set. Real backend blockers are outside this scope.

**Evidence:**
- `PacsController.cs`: Clean. Fail-fast 503 when PACS not configured; geoId exact lookup routes correctly. ✅
- `PacsOpsController.cs`: Clean. `GET /ops/pacs/property/{geoId}` route present and complete. ✅
- `ForgeController.cs`: Clean. Delegates to `ValuationService` correctly. ✅
- `ValuationService.cs`: Clean. Returns honest fallback when dev SQLite has no data for requested year. ✅
- `TerraFusion.Core/PACS/*`: Clean. `PacsEfAdapter` registered in dev (no PACS SQL Server required). ✅
- `dotnet build TerraFusion.sln`: 0 errors, 0 warnings ✅
- `LegacyDatabaseService` phantom loop (P1-4): Already `[Obsolete]`, not registered in DI, dead code — latent risk only, no active trigger path. ✅
- Live data flow chain: `LiveDataProvider.getParcel()` → `GET /ops/pacs/property/{geoId}` → `PacsEfAdapter.GetPropertyByGeoIdAsync()` → SQLite — all links present and functional. ✅

**Remaining backend blockers (need new scoped cards):**
- P1-3: `DossierController.GetParcelDetails` returns 404 when `Properties` EF table has no matching row — outside CARD-01 scope
- P2-1: `AnalyticsReportingService` hardcoded `TotalProperties = 89247` — outside scope
- P2-2/P2-3: `GovernmentController` / `DaisController` hardcoded parcel counts — outside scope

> CARD-01 is closed. Card was stale. The PACS/Forge backend spine is solid.

---

### ~~CARD-02 — Alpha UX Polish~~ ✅ CLOSED (satisfied — no new staff feedback)

> **Closure (2026-03-24):** No new staff feedback received. Acceptance criteria met at `80471948d`: alpha.html truth matrix updated, Pilot Runtime setup notice added, Atlas SVG fallback correctly labeled (CARD-05C).

> CARD-02 is closed.

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

### ~~CARD-04 — Benton Product Reality Report v1~~ ✅ CLOSED (both sections written)

> **Closure (2026-03-24 / 2026-03-26):** Both sections written. Claude Code backend truth section in initial commit. Copilot frontend truth section sealed at `1a01c00bc`. Report continues accumulating resolved investigative items (Sections 6a, 6b).

> CARD-04 is closed.

---

### ~~CARD-05 — Publish Module Integration Map~~ ✅ CLOSED

> **Closure:** `docs/module-integration-map.md` written with all 14 module rows. GitHub org bsvalues confirmed. No code changes.

---

### CARD-06 — Verify Properties EF Table Seeding

```
Task:           Verify whether the SQLite Properties EF table has rows for the
                200 snapshot parcel IDs; document the count
Owner:          Claude Code
Mode:           Single-builder
Repo:           terrafusion_os_1.0
Allowed files:
  - backend/src/TerraFusion.Data/**  (read + seed script only if needed)
  - docs/alpha/BENTON_REALITY_REPORT_V1.md  (findings update only)
Out of scope:
  - No controller or service changes
  - No schema changes
  - No frontend changes
Acceptance:
  - Row count in Properties table documented in reality report
  - If 0 rows: dev seed script for the 200 snapshot IDs written +
    connection confirmed via dotnet ef query or sqlite3 CLI
  - dotnet build clean after any changes
Reviewer:       Copilot (doc alignment check)
```

---

### CARD-10 — Replace Hardcoded 89247 in Backend Services

```
Task:           Replace literal 89247 in the three known backend files with
                a live DB COUNT() query or an explicit named stub constant
Owner:          Claude Code
Mode:           Single-builder
Repo:           terrafusion_os_1.0
Allowed files:
  - backend/src/TerraFusion.AI/Services/AnalyticsReportingService.cs
  - backend/src/TerraFusion.API/Controllers/GovernmentController.cs
  - backend/src/TerraFusion.API/Controllers/DaisController.cs
Out of scope:
  - No frontend changes
  - No other backend files
  - No new endpoints
Acceptance:
  - No literal 89247 in the three allowed files
  - If live query: query hits PacsParcel or Properties table via EF
  - If stub constant: constant is named BENTON_PARCEL_COUNT_STUB
    with an explicit TODO comment pointing to CARD-06
  - dotnet build TerraFusion.sln: 0 errors, 0 warnings
Reviewer:       Copilot (doc alignment check)
```

---

### ~~CARD-13 — Atlas source classification fix~~ ✅ CLOSED

> **Closure (2026-03-26):** `atlasGisFetch` in `useAtlasGis.ts` classified `"canonical"` (actual `GisDataService` output) as `'fallback'` instead of `'live'`, preventing live boundary/layer panels from rendering for any parcel in the PACS mirror. Fixed: `"canonical"` → `'live'`; `"stub"` → `'unavailable'`. alpha.html Atlas label corrected from "SVG fallback" to "Real (PACS mirror)". Section 6b of reality report corrected.

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
| 02 | Alpha UX Polish — alpha.html truth matrix, Pilot Runtime setup, Atlas SVG correction | Copilot | 80471948d (satisfied, no new staff feedback) |
| 04 | Benton Product Reality Report v1 — frontend truth section | Copilot | 1a01c00bc |
| 01 | Alpha Defect Triage — **truth gate found no P0/P1 in allowed files; backend spine verified clean** | Truth gate | `dotnet build` 0 errors; PacsEfAdapter chain confirmed |
| 13 | Atlas source classification fix — `atlasGisFetch`: `canonical` → `live`, `stub` → `unavailable` | Copilot | see HEAD commit |
