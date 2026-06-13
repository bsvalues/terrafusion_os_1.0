# TerraAtlas Suite Apps Release Checklist

**WO**: `WO-TERRAATLAS-SUITE-APPS-RUNTIME-TRUTH`  
**Scope**: `/atlas` Suite app runtime truth only.

## Required Proof

| Check | Command or evidence |
|-------|---------------------|
| Clean status | `git status --short` |
| Diff review | `git diff --name-only origin/main...HEAD` |
| Core type-check | `pnpm run type-check` |
| Phase 83 gate | `node --test os-platform/core/tests/phase83-tools.test.mjs` |
| Frontend type-check | `pnpm --dir frontend run type-check` |
| TerraAtlas Suite tests | `pnpm --dir frontend exec vitest run apps/os-shell/src/__tests__/atlas/atlasGeo.contract.test.tsx apps/os-shell/src/__tests__/atlas/atlasNeighborhood.contract.test.tsx` |
| Backend build | `dotnet build backend/src/TerraFusion.API/TerraFusion.API.csproj` |
| Runtime API smoke | `powershell -ExecutionPolicy Bypass -File scripts/smoke/terraatlas-runtime-smoke.ps1 -ParcelId 119802030006001` |
| Browser route proof | `/atlas` only |

## Pass Criteria

- `/atlas` loads.
- TerraGIS is partial and uses live Atlas GIS parcel data or reports unavailable honestly.
- ParcelLens is partial and shows owner, situs, centroid, area, and RingJson presence.
- LayerWorks is partial and shows tax area `K1`, land class `11`, flood unavailable external enrichment, and zoning null.
- TerraQuery is read-only.
- TerraSketch, TerraPrint, TerraExport, TerraGIS Pro, Geo Equity, and Appraisal GIS are not falsely promoted.
- GIS geometry rows are labeled as `80,084`.
- RingJson geometries are labeled as `80,083`.
- Active parcel count is labeled as not verified.
- Mapbox, FEMA, and zoning gaps are classified honestly.
