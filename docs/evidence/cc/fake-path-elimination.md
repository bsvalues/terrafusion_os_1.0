# CC Lane Evidence: Fake-Path Elimination (Phase 5)

**Lane:** CC
**Date:** 2026-03-07
**Scope:** Systematic elimination of fake data paths, mock fallbacks, and localStorage persistence across the CC lane's three suites (Forge, Dossier, Atlas).

---

## forgeService.ts

**File:** `frontend/apps/os-shell/src/services/forgeService.ts`

- **localStorage:** 0 production calls. All 13 occurrences are `console.warn()` tombstone messages indicating localStorage persistence was removed in R1. The warn messages fire if legacy code attempts scenario/appeal/audit save/load operations, but perform no actual storage I/O.
- **COST_MATRIX:** Retained as a `readonly CostMatrixEntry[]` at line 118. Used only by `lookupMatrixEntry()` (line 267) for UI reference display (building type dropdowns). Does not participate in any calculation. All production calculations route through `runGovernedValuation()` -> `invokePilotTool()` -> backend.
- **Legacy calculators:** 7 functions annotated `@deprecated Use runGovernedValuation() for production flows`. Not called from any production UI component.

---

## dossierService.ts

**File:** `frontend/apps/os-shell/src/services/dossierService.ts`

- **Fallback removed:** CC-14 (R1 Week 3). Tombstone at line 247:
  ```
  // NOTE: DEFAULT fallback data removed in CC-14 (R1 Week 3).
  // All service methods now propagate errors from the real backend.
  ```
- All 7 service methods (`searchDocuments`, `getDocument`, `searchEvidence`, `getChainOfCustody`, `getStats`, `getDetails`, `getEvidenceSnapshot`) call the real backend via `fetch()` with bearer auth headers.
- No hardcoded response data. Errors propagate to the UI via the hook layer.

---

## atlasService.ts

**File:** `frontend/apps/os-shell/src/services/atlasService.ts`

- **Fallback removed:** CC-13 (R1 Week 3). Tombstone at line 119:
  ```
  // NOTE: DEFAULT fallback data removed in CC-13 (R1 Week 3).
  // All service methods now propagate errors from the real backend.
  ```
- All 6 service methods (`getLayers`, `searchParcels`, `getParcel`, `getZoningDistricts`, `getFloodZones`, `getStats`) call the real backend via `fetch()` with bearer auth headers.
- No hardcoded response data.

---

## PropertyDossier.tsx

**File:** `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyDossier.tsx`

- **Mock documents removed.** `MOCK_DOCUMENTS` grep = 0 across entire frontend.
- **Section 2 (Document Management) disabled.** Renders a centered placeholder:
  ```
  Document storage and retrieval coming in R2
  ```
  No fake document list, no mock file metadata, no simulated upload/download.
- **Section 1 (Parcel Details) is REAL** via `useDossierDetails` hook -> `dossierService.getDetails()` -> `GET /api/dossier/parcels/{parcelId}/details`.

---

## PropertyAtlas.tsx

**File:** `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyAtlas.tsx`

- **Map labeled as schematic.** Line 173: `"Schematic representation — GIS integration planned for R2"`
- **No fake layer generation.** The SVG polygon is deterministic from parcelId hash and is explicitly presented as a schematic, not as GIS data.
- **Real tool invocation.** Layer queries go through `invokeTool({ toolId: 'query_parcel_layers' })` via the pilot API.

---

## DaisSuiteHome.tsx — PILT Fallback Made Explicit

**File:** `frontend/apps/os-shell/src/pages/suites/DaisSuiteHome.tsx`

The PILT module calls `getPiltStatus()`, `getPiltDistricts()`, `getPiltReceipts()` via `piltService.ts` which hits the real backend at `/api/pilt/*`. The backend returns 501 (deferred to R2).

**Before (silent fallback):** When the API call failed, `isLive` stayed `false` and the component silently fell back to `PILT_CATEGORIES` hardcoded reference data with only a "Local" badge.

**After (explicit deferred notice):** The catch block now sets `apiDeferred = true`, and the UI renders:
- Badge text: "Deferred" (instead of "Local")
- Visible banner: *"PILT live data integration deferred to R2. Showing Benton County reference data for layout preview only."*

The `PILT_CATEGORIES` data remains as layout preview reference data (Benton County land categories with acreage), but it is now clearly labeled as reference data, not live data.

---

## Old Suite Modules — Post-R1 Classification

Five legacy suite modules under `pages/suites/modules/` call deprecated client-side functions from `forgeService.ts`. These modules are **not** rendered in the R1 workbench tabs (which use `ForgeExecutionPanel`, `PropertyDossier`, `PropertyAtlas`). They are accessible only through the old suite page navigation.

| Module | Deprecated Functions Used | Classification |
|--------|---------------------------|----------------|
| CostForgeModule.tsx | `calculateCost()` | Post-R1 |
| IncomeForgeModule.tsx | `calculateIncome()`, `extractCapRate()` | Post-R1 |
| ReconciliationModule.tsx | `runReconciliation()` | Post-R1 |
| AppealForgeModule.tsx | `saveAppeal()`, `loadAppeals()` (tombstoned) | Post-R1 |
| ValueAuditModule.tsx | `appendAuditEntry()`, `loadAuditEntries()` (tombstoned) | Post-R1 |

All deprecated functions carry `@deprecated Use runGovernedValuation() for production flows` annotations. The tombstoned functions (`saveAppeal`, etc.) log `console.warn` messages and return empty data — they no longer read from or write to localStorage.

See `surface-inventory.md` for the full classification.

---

## Remaining Known Fake: PilotController Backend (CX Scope)

`PiltController.cs` (`backend/src/TerraFusion.API/Controllers/PiltController.cs`) is a backend controller that is **CX lane scope**, not CC. CC's responsibility ends at the frontend service layer boundary. The PiltController's behavior (mock vs. real handler routing) is tracked and owned by the CX lane.

---

## Summary Table

| File | Fake Path | Status | Ticket |
|------|-----------|--------|--------|
| forgeService.ts | localStorage persistence | Eliminated (tombstoned) | CC-FORGE-01 |
| forgeService.ts | Client-side calculators | Deprecated, not called from R1 surface | CC-FORGE-03 |
| forgeService.ts | COST_MATRIX | UI reference only | CC-FORGE-04 |
| dossierService.ts | Default fallback data | Removed in CC-14 | CC-DOS-03 |
| atlasService.ts | Default fallback data | Removed in CC-13 | CC-ATL-03 |
| PropertyDossier.tsx | Mock documents | Removed, Section 2 disabled | CC-DOS-02 |
| PropertyAtlas.tsx | Fake GIS layers | None — SVG labeled schematic | CC-ATL-02 |
| DaisSuiteHome.tsx (PILT) | Silent fallback to hardcoded data | **FIXED** — explicit deferred notice | CC-PILT-01 |
| Suite modules (5) | Client-side deprecated calc | **Post-R1** — not in R1 active surface | CC-LEGACY-01 |
| PiltController.cs | Mock handler routing | **CX scope, not CC** | N/A |

---

**Verified by:** Claude Code (CC lane agent)
