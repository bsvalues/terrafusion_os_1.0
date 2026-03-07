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

## Remaining Known Fake: PilotController Backend (CX Scope)

`PiltController.cs` (`backend/src/TerraFusion.API/Controllers/PiltController.cs`) is a backend controller that is **CX lane scope**, not CC. CC's responsibility ends at the frontend service layer boundary. The PiltController's behavior (mock vs. real handler routing) is tracked and owned by the CX lane.

---

## Summary Table

| File | Fake Path | Status | Ticket |
|------|-----------|--------|--------|
| forgeService.ts | localStorage persistence | Eliminated (tombstoned) | CC-FORGE-01 |
| forgeService.ts | Client-side calculators | Deprecated, not called | CC-FORGE-03 |
| forgeService.ts | COST_MATRIX | UI reference only | CC-FORGE-04 |
| dossierService.ts | Default fallback data | Removed in CC-14 | CC-DOS-03 |
| atlasService.ts | Default fallback data | Removed in CC-13 | CC-ATL-03 |
| PropertyDossier.tsx | Mock documents | Removed, Section 2 disabled | CC-DOS-02 |
| PropertyAtlas.tsx | Fake GIS layers | None — SVG labeled schematic | CC-ATL-02 |
| PiltController.cs | Mock handler routing | **CX scope, not CC** | N/A |

---

**Verified by:** Claude Code (CC lane agent)
