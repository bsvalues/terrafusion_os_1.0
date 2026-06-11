# TerraAtlas Suite Runtime Proof

**Branch**: `feat/terraatlas-full-production`  
**Date**: 2026-06-10  
**Terminal status**: `PRODUCTION READY WITH EXTERNAL ENRICHMENT GAPS — TERRAATLAS SUITE ONLY`

This PR proves the TerraAtlas Suite runtime surface only.

## Owned Surface

| Surface | Status |
|---------|--------|
| `/atlas` | In scope |
| TerraAtlas Suite workspace | In scope |
| TerraAtlas GIS API consumption | In scope |
| TerraAtlas layer/source-status honesty | In scope |
| Mapbox token fallback | In scope as an external configuration gap |
| FEMA flood enrichment | In scope as an external enrichment gap |
| Zoning enrichment | In scope as an external enrichment gap |

## Runtime API Evidence

The TerraAtlas Suite consumes the shared Atlas GIS API for real Benton County
parcel data. The canonical proof parcel is `119802030006001`.

| Evidence | Expected result |
|----------|-----------------|
| `GET /health` | `200`, Development environment |
| `GET /api/atlas/gis/parcels/119802030006001/boundary` | `200`, `source: live` |
| `GET /api/atlas/gis/parcels/119802030006001` | `200`, `boundary.source: live`, `layers.source: live` |
| `scripts/smoke/terraatlas-runtime-smoke.ps1` | validates real parcel fields and enrichment classifications |

Canonical parcel fields verified by the smoke script:

| Field | Value |
|-------|-------|
| Parcel ID | `119802030006001` |
| Situs | `203 E 47TH PL, KENNEWICK, WA 99337-5905` |
| Owner | `COX DONNA M` |
| Centroid | `46.1669718650024, -119.115612775675`, `derivedFrom: arcgis-centroid` |
| Area | `0.3271 ac`, `14,250 sqft` |
| Ring geometry | 15-point `ringJson` polygon |
| Tax area | `K1` |
| Land class | `primaryUseCd: 11` |
| Flood | `source: stub` |
| Zoning | `null` |

## Browser Proof Target

The browser route proof target for this sprint is `/atlas`.

Pass criteria:

- TerraAtlas Suite shell loads.
- TerraAtlas source-status posture is honest.
- TerraAtlas Suite does not claim queued breadth modules are live.
- Mapbox/FEMA/zoning gaps are not hidden or promoted to full production proof.

## Required Gates

| Gate | Scope |
|------|-------|
| `pnpm run type-check` | core boundary |
| `node --test os-platform/core/tests/phase83-tools.test.mjs` | Phase 83 tool governance |
| `pnpm --dir frontend run type-check` | frontend type safety |
| focused TerraAtlas Suite Vitest tests | `/atlas` suite surface only |
| `dotnet build backend/src/TerraFusion.API/TerraFusion.API.csproj` | API build |
| `scripts/smoke/terraatlas-runtime-smoke.ps1 -ParcelId 119802030006001` | live TerraAtlas GIS API contract |

## External Enrichment Gaps

| Gap | Classification |
|-----|----------------|
| Mapbox live satellite/canvas rendering | `EXTERNAL-ONLY`: `VITE_MAPBOX_ACCESS_TOKEN` is not configured. The Suite must degrade honestly without crashing. |
| FEMA flood enrichment | `EXTERNAL-ONLY`: backend returns flood data as `source: stub`. |
| Zoning enrichment | `EXTERNAL-ONLY`: backend returns zoning as `null`; any property-store zoning display is not TerraAtlas GIS enrichment proof. |

## Final Classification

The TerraAtlas Suite runtime is production-ready for the proven `/atlas` suite
surface and shared live Benton County GIS API contract. Full runtime production
is not claimed because Mapbox, FEMA, and zoning remain external enrichment or
configuration gaps.
