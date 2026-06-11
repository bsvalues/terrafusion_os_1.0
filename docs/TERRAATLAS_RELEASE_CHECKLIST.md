# TerraAtlas Suite Release Checklist

**Scope**: TerraAtlas Suite runtime proof only.

This checklist excludes Property Workbench. `/property/:parcelId/atlas`,
Workbench tab order, Workbench shell behavior, and Dossier/Pilot finality are
`OUT_OF_SCOPE_PROPERTY_WORKBENCH`.

## Required

| Check | Command or evidence |
|-------|---------------------|
| Clean status before final report | `git status --short` |
| Diff review | `git diff --name-only origin/main...HEAD` |
| Core type-check | `pnpm run type-check` |
| Phase 83 governance test | `node --test os-platform/core/tests/phase83-tools.test.mjs` |
| Frontend type-check | `pnpm --dir frontend run type-check` |
| TerraAtlas Suite tests | `pnpm --dir frontend exec vitest run apps/os-shell/src/__tests__/atlas/atlasGeo.contract.test.tsx apps/os-shell/src/__tests__/atlas/atlasNeighborhood.contract.test.tsx` |
| Backend build | `dotnet build backend/src/TerraFusion.API/TerraFusion.API.csproj` |
| Runtime API smoke | `powershell -ExecutionPolicy Bypass -File scripts/smoke/terraatlas-runtime-smoke.ps1 -ApiBaseUrl http://127.0.0.1:5047 -ParcelId 119802030006001` |
| Browser route proof | `/atlas` only |

## Pass Criteria

- TerraAtlas Suite loads at `/atlas`.
- TerraAtlas Suite source-status disclosures are honest.
- The real parcel `119802030006001` passes the shared Atlas GIS API smoke.
- Mapbox missing-token behavior is classified as an external configuration gap.
- FEMA flood enrichment remains classified as an external enrichment gap while backend returns `source: stub`.
- Zoning enrichment remains classified as an external enrichment gap while backend returns `zoning: null`.
- No Property Workbench source file appears in the final PR diff.
- No Workbench test is used as acceptance proof.

## Non-Blocking External Gaps

| Gap | Classification |
|-----|----------------|
| Mapbox token absent | `EXTERNAL-ONLY` |
| FEMA enrichment stub | `EXTERNAL-ONLY` |
| Zoning enrichment null | `EXTERNAL-ONLY` |

## Not Required

- Workbench Atlas tab tests.
- Workbench tab order tests.
- `/property/:parcelId/atlas` browser proof.
- Dossier/Pilot finality tests.
