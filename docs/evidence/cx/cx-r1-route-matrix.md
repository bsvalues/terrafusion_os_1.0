# CX R1 Route Matrix

Date: March 7, 2026
Lane: `cx`
Purpose: authoritative backend route matrix for the active R1 surface and the explicit
Post-R1 carve-outs that still touch suite-visible APIs.

## Scope Rules

- "Real" means authenticated behavior, county-safe behavior where applicable, and a live
  backing source or service.
- "Explicit Post-R1" means the route is intentionally disabled with truthful unsupported
  semantics instead of fake-success behavior.
- This matrix is about the active R1 backend surface. It is not a promise to complete
  the entire platform.

## Route Matrix

| Route | Auth | County isolation | Correlation behavior | Backing source | Consumer | Scope class | Current truth |
|---|---|---|---|---|---|---|---|
| `POST /api/costforge/calculate` | `[Authorize]` + `calculate:property-cost` | Yes | Global middleware | `Properties` + `ICostForgeService` | Forge UI, `run_valuation_model` | `R1-required` | Real active path |
| `GET /api/costforge/{propertyId}/breakdown` | `[Authorize]` + `read:cost-breakdown` | Yes | Global middleware | `ICostForgeService` | Dossier evidence/details | `R1-required` | Real active path |
| `GET /api/costforge/compare/{propertyId1}/{propertyId2}` | `[Authorize]` + `read:cost-comparison` | Yes | Global middleware | `ICostForgeService` | Backend support surface | `R1-optional` | Real, not release-critical |
| `GET /api/costforge/{propertyId}/forecast` | `[Authorize]` + `read:cost-forecast` | Yes | Global middleware | `ICostForgeService` | Backend support surface | `R1-optional` | Real, not release-critical |
| `POST /api/costforge/batch-calculate` | `[Authorize]` + `calculate:batch-valuation` | Not applicable while disabled | Global middleware + `X-R1-Scope` | None active | No active R1 consumer | `Post-R1` | Explicit `501` |
| `POST /api/costforge/sync/harris-pacs` | `[Authorize]` + `sync:external-systems` | Not applicable while disabled | Global middleware + `X-R1-Scope` | None active | No active R1 consumer | `Post-R1` | Explicit `501` |
| `GET /api/dossier/{parcelId}` | `[Authorize]` + `read:dossier` | Yes | `X-Correlation-ID` response header | `Properties`, `TaxLevies`, `DossierNotes`, best-effort CostForge | Dossier UI summary | `R1-required` | Real active path |
| `GET /api/dossier/parcels/{parcelId}/details` | `[Authorize]` + `read:dossier` | Yes | `X-Correlation-ID` response header | `Properties`, `TaxLevies`, `DossierNotes`, best-effort CostForge | Dossier UI details | `R1-required` | Real active path |
| `GET /api/dossier/parcels/{parcelId}/casefile` | `[Authorize]` + `read:dossier` | Yes | Global middleware | `DossierNotes` + parcel existence check | `summarize_parcel_casefile` | `R1-required` | Real active path |
| `GET /api/dossier/parcels/{parcelId}/evidence` | `[Authorize]` + `read:dossier` | Yes | `X-Correlation-ID` response header | `Properties`, `TaxLevies`, `DossierNotes`, best-effort CostForge | Dossier evidence UI | `R1-required` | Real active path |
| `GET /api/dossier/{parcelId}/notes` | `[Authorize]` + `read:dossier` | Yes | Global middleware | `DossierNotes` | Dossier notes UI | `R1-required` | Real active path |
| `POST /api/dossier/{parcelId}/notes` | `[Authorize]` + `write:dossier` | Yes | Global middleware | `DossierNotes` | `add_dossier_note`, Dossier notes UI | `R1-optional` | Real write path |
| `GET /api/atlas/parcels/{parcelId}` | `[Authorize]` + `read:parcel` | Yes | Global middleware | `Properties` | Atlas UI | `R1-required` | Real parcel shell; geometry intentionally null |
| `GET /api/atlas/parcels/{parcelId}/layers` | `[Authorize]` + `read:parcel` | Yes | Global middleware | `Properties` + static layer list | Atlas UI, `query_parcel_layers` | `R1-required` | Real current-scope path |
| `POST /api/propertyvaluation/enhance` | `[Authorize]` | Yes | Global middleware | `IPropertyValuationAIEnhancementService` + `Properties` scope check | Active backend surface | `R1-required` | Real active path |
| `POST /api/propertyvaluation/enhance/bulk` | `[Authorize]` | Yes | Global middleware | `IPropertyValuationAIEnhancementService` + `Properties` scope check | Active backend surface | `R1-required` | Real active path |
| `GET /api/propertyvaluation/performance/{countyCode}` | `[Authorize]` | Yes | Global middleware | `IPropertyValuationAIEnhancementService` | Active backend surface | `R1-optional` | Real active path |
| `POST /api/levy-calculation/calculate-rate` | `[Authorize(Roles=...)]` | Yes | Global middleware | `TaxLevies` + levy calculation logic | `summarize_levy_rate_components` | `R1-required` | Real active path |

## Notes

- `DossierController` contains a development-only fallback to Benton County when claims
  are absent. That is a DX aid for local development and is not production truth.
- `AtlasController` intentionally returns `geometryAvailable=false` with null geometry
  instead of fabricating GIS data. That is honest current-scope behavior.
- `CostForgeController` remains R1-real for the single-property governed path while the
  non-R1 batch and PACS surfaces are now explicit Post-R1.
