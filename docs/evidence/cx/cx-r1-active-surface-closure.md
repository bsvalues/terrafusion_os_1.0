# CX R1 Active Surface Closure

Date: March 7, 2026
Lane: `cx`
Scope: active backend truth closure for Property Valuation, CostForge non-R1 surfaces,
Dossier and Atlas Post-R1 carve-outs, PILT, and runtime theater cleanup

## Implemented

### Property Valuation

- [PropertyValuationController.cs](/C:/Users/bsval/terrafusion_os_1.0/backend/src/TerraFusion.API/Controllers/PropertyValuationController.cs)
  now has `[Authorize]`.
- The controller now resolves county context from claims and blocks requests when:
  - no county claims resolve
  - requested `CountyCode` does not match the authorized county
  - requested parcel does not exist in the authorized county scope
- Bulk valuation now rejects mixed-county batches and missing parcel scope.

### PILT

- [PiltController.cs](/C:/Users/bsval/terrafusion_os_1.0/backend/src/TerraFusion.API/Controllers/PiltController.cs)
  no longer serves hardcoded fake-live payloads.
- The controller now has `[Authorize]` and returns explicit `501 Not Implemented`
  `ProblemDetails` with `scope=Post-R1`.
- This reclassifies PILT from fake runtime behavior to explicit deferred scope.

### CostForge Non-R1 Surfaces

- [CostForgeController.cs](/C:/Users/bsval/terrafusion_os_1.0/backend/src/TerraFusion.API/Controllers/CostForgeController.cs)
  no longer returns fake-success payloads for:
  - `POST /api/costforge/batch-calculate`
  - `POST /api/costforge/sync/harris-pacs`
- Those endpoints now return explicit `501 Not Implemented` `ProblemDetails` with
  `scope=Post-R1` and `X-R1-Scope: Post-R1`.
- The active single-property Forge calculation path remains live; only the non-R1
  surfaces were converted from placeholder success to honest disablement.

### Dossier Document Management

- [DossierController.cs](/C:/Users/bsval/terrafusion_os_1.0/backend/src/TerraFusion.API/Controllers/DossierController.cs)
  now answers these suite-visible document-management routes with explicit Post-R1
  semantics instead of silent backend absence:
  - `POST /api/dossier/documents/search`
  - `GET /api/dossier/documents/{id}`
  - `POST /api/dossier/evidence/search`
  - `GET /api/dossier/evidence/{evidenceId}/chain`
  - `GET /api/dossier/stats`
- Those endpoints now return explicit `501 Not Implemented` `ProblemDetails` with
  `scope=Post-R1` and `X-R1-Scope: Post-R1`.
- This does not make document management real for R1. It makes the backend contract
  honest so the frontend can render explicit deferred states instead of relying on
  missing-route ambiguity.

### Atlas Suite-Level GIS Surfaces

- [AtlasController.cs](/C:/Users/bsval/terrafusion_os_1.0/backend/src/TerraFusion.API/Controllers/AtlasController.cs)
  now answers these suite-visible GIS routes with explicit Post-R1 semantics instead of
  silent backend absence:
  - `GET /api/atlas/layers`
  - `POST /api/atlas/parcels/search`
  - `GET /api/atlas/zoning`
  - `GET /api/atlas/flood-zones`
  - `GET /api/atlas/stats`
- Those endpoints now return explicit `501 Not Implemented` `ProblemDetails` with
  `scope=Post-R1` and `X-R1-Scope: Post-R1`.
- The parcel-specific Atlas routes remain real for R1. Only the broader GIS suite
  surfaces were converted from no-contract behavior to explicit deferment.

### Quantum Metrics Background Service

- [Program.cs](/C:/Users/bsval/terrafusion_os_1.0/backend/src/TerraFusion.API/Program.cs)
  now gates `QuantumMetricsBackgroundService` behind:
  - config key: `Features:EnableQuantumMetricsBackgroundService`
  - env var: `TF_ENABLE_QUANTUM_METRICS_BACKGROUND_SERVICE`
- Default behavior is disabled unless explicitly enabled.

## Verification Targets

- [R1Week5CxR1ClosureTests.cs](/C:/Users/bsval/terrafusion_os_1.0/backend/tests/TerraFusion.Unit.Tests/R1Week5/R1Week5CxR1ClosureTests.cs)
- backend build
- targeted unit tests for controller auth/county gating and PILT disablement
- targeted unit tests for explicit CostForge Post-R1 endpoint semantics

## Route Matrix

- [cx-r1-route-matrix.md](/C:/Users/bsval/terrafusion_os_1.0/docs/evidence/cx/cx-r1-route-matrix.md)
  is the authoritative CX route matrix for the active R1 backend surface.

## Remaining Truth

- This does not make PILT real. It makes PILT honest.
- This does not make CostForge batch valuation or Harris PACS sync real. It makes those
  surfaces explicit Post-R1 instead of fake-success.
- This does not make Dossier document management real. It makes the suite-visible
  backend routes explicit Post-R1 instead of silent no-contract behavior.
- This does not make the broader Atlas GIS suite real. It makes the suite-visible
  backend routes explicit Post-R1 instead of silent no-contract behavior.
- This does not complete CC fake-path removal for the PILT UI fallback.
- This does not finalize cross-lane signoff or the branch-head evidence manifest.
