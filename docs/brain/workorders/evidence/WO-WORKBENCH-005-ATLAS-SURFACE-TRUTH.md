# WO-WORKBENCH-005 — Atlas Surface Truth

## Result

RESULT: PASS
WORK_ORDER: WO-WORKBENCH-005
GOAL: GOAL-PROPERTY-WORKBENCH-CANONICAL-ASSESSOR-EXPERIENCE
LOOP: LOOP-PROPERTY-WORKBENCH-CANONICAL-ASSESSOR-EXPERIENCE
MODE: evidence-only

## Scope

This packet records the current TerraFusion Atlas surface inside the Property Workbench. It does not
modify Atlas behavior, Workbench routing, GIS adapters, map-token handling, package dependencies,
CI, deployment behavior, county data, PACS, or SQL access.

Allowed in this packet:

- Property Workbench Atlas evidence.

Blocked in this packet:

- Runtime code changes
- Shell tab or route changes
- Atlas GIS service changes
- Map provider or token policy changes
- Export/custody workflow changes
- County data, PACS, county SQL, or live database access
- Deployment, Docker, Kubernetes, or CI changes

## Canon References

- `brain/packs/atlas/README.md`
- `brain/packs/shell/README.md`
- `docs/architecture/specs/terrafusion/01_PROPERTY_WORKBENCH_SPEC_v3.1.md`
- `docs/architecture/specs/terrafusion/04_SUITE_BOUNDARIES_WRITE_LANES_v3.1.md`
- `frontend/apps/os-shell/AGENTS.md`

## Files Inspected

Workbench Atlas frame:

- `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyAtlas.tsx`
- `frontend/apps/os-shell/src/hooks/useAtlasGis.ts`
- `frontend/apps/os-shell/src/stores/atlasSpatialStore.ts`
- `frontend/apps/os-shell/src/data/atlas/valuationLayerPolicy.ts`

Atlas service adapters:

- `frontend/apps/os-shell/src/services/atlasService.ts`

Workbench Atlas proof surface:

- `frontend/apps/os-shell/src/__tests__/workbench/PropertyAtlas.test.tsx`
- `frontend/apps/os-shell/src/__tests__/workbench/PropertyAtlas.honesty.test.tsx`
- `frontend/apps/os-shell/src/__tests__/workbench/PropertyAtlas.honesty.contract.test.tsx`
- `frontend/apps/os-shell/src/__tests__/atlasGeo.contract.test.tsx`
- `frontend/apps/os-shell/src/__tests__/atlasNeighborhood.contract.test.tsx`

## Observed Runtime Shape

`PropertyAtlas.tsx` is a Workbench-hosted Atlas tab. It stays inside the parcel-scoped Workbench
context and presents GIS evidence, parcel boundary status, map source status, layer selection, and
governed spatial tool actions.

The Workbench Atlas tab preserves the Atlas ownership lane: spatial evidence, parcel boundary,
layer visibility, map preview, and spatial anomaly explanation. It does not create a standalone
parcel window and does not claim valuation-method, workflow-admin, records-custody, or Pilot
ownership.

## Data Source Model

The Workbench Atlas tab uses `useAtlasGis.ts` for parcel GIS data. The preferred backend read path
is:

- `GET /api/atlas/gis/parcels/{parcelId}`

The hook also exposes boundary and layer wrapper hooks for Workbench consumption:

- `useParcelBoundary(parcelId)`
- `useParcelLayers(parcelId)`

`useAtlasGis.ts` maps backend source labels into Workbench source states. `live`, `arcgis`, and
`canonical` are treated as live; `unavailable`, `stub`, and `empty` are treated as unavailable; other
nonempty sources are treated as fallback.

When live GIS data or a Mapbox token is unavailable, the Workbench tab renders explicit unavailable
or deterministic preview states rather than inventing live map evidence. A satellite map renders only
when a live boundary source, centroid, and `VITE_MAPBOX_ACCESS_TOKEN` are present.

## Governed Tool Surface

Observed governed Atlas tool actions include:

- `query_parcel_layers`
- `explain_spatial_anomaly`

The UI records tool results with source and correlation ID handling. This packet does not prove
backend authorization policy for those tools; it records that the Workbench Atlas surface routes the
actions through governed tool calls instead of inline county-data mutation.

## Atlas Service Surface

`atlasService.ts` contains broader Atlas-suite service adapters beyond the Workbench Atlas tab. The
observed service surface includes parcel search, parcel detail, spatial profile, zoning, flood,
statistics, layer configuration, TerraQuery, live export layers, and export artifact helpers.

Some service paths fall back to direct Benton ArcGIS reads when backend Atlas APIs are unavailable.
Those paths are Atlas-suite evidence only; they are not promoted by this packet as a Workbench
release claim or county-runtime authorization.

`exportAtlasLayer` can build GeoJSON or CSV artifacts. That is an Atlas-owned export surface. Dossier
still owns document and evidence custody, so any export-to-records or document-lock workflow requires
separate Dossier proof before release claims.

## Write-Lane Posture

Atlas-owned Workbench responsibilities observed:

- Parcel boundary and layer evidence display
- Spatial source-honesty disclosure
- Map preview and live map eligibility
- Layer visibility and query controls
- Spatial anomaly explanation through a governed tool

Not proven by this packet:

- Production GIS data authority
- County ArcGIS/PACS/SQL connectivity
- Geometry editing or authoritative spatial writes
- Dossier custody for exported map artifacts
- Backend enforcement for Atlas governed tools
- Map provider token governance beyond runtime token presence checks

Potentially sensitive or promotion-blocking areas needing later proof:

- Direct Benton ArcGIS fallback behavior in Atlas service adapters
- Exported GeoJSON/CSV artifact custody
- Any geometry-edit, annotation, bookmark, neighborhood-definition, or parcel-boundary write path
- Backend policy for `query_parcel_layers` and `explain_spatial_anomaly`

## Evidence and Tests Observed

Existing Workbench Atlas tests cover:

- `PropertyAtlas` rendering with parcel context
- layer selection and `query_parcel_layers` invocation
- successful, failed, and network-error tool responses with correlation ID display
- query history behavior
- live versus unavailable map source behavior
- source badge and unavailable-state honesty wording
- no hardcoded layer data before query evidence

Existing Atlas suite contract tests cover:

- Geo-equity and geometry-health proof surfaces
- mass-appraisal GIS source posture
- neighborhood comparison, TerraGama, and sentiment-dashboard source disclosures
- suite-home proof indicators

The tests are evidence of UI contract and source-honesty behavior. They are not proof of live county
data, PACS connectivity, production authorization, geometry write safety, or release readiness.

## Surface Classification

| Surface | Current maturity | Evidence |
| --- | --- | --- |
| Atlas Workbench tab | Implemented, backend-dependent | `PropertyAtlas.tsx`, Workbench Atlas tests |
| Parcel GIS read hook | Implemented, source-disclosing | `useAtlasGis.ts` |
| Boundary/layer source honesty | Implemented | Workbench source badges and honesty tests |
| Live map rendering | Implemented when live source, centroid, and token exist | `PropertyAtlas.tsx` |
| Deterministic map preview | Implemented fallback/preview posture | `PropertyAtlas.tsx` |
| Governed Atlas tool actions | Implemented in UI, backend policy not proven here | `query_parcel_layers`, `explain_spatial_anomaly` |
| Atlas export helpers | Present in service layer, custody not proven | `atlasService.ts` |
| Spatial write safety | Not proven | no write-lane enforcement proof captured |
| Production readiness | Not claimed | no live DB, PACS, county data, or release gate run |

## Gaps

1. Backend authorization proof is not captured for `query_parcel_layers` or
   `explain_spatial_anomaly`.
2. Mapbox token governance is runtime-environment dependent and not validated here.
3. Direct Benton ArcGIS fallback paths exist in Atlas service adapters and need county-runtime
   governance before production claims.
4. Exported GeoJSON/CSV artifact custody is not tied to Dossier evidence handling in this packet.
5. Geometry writes, annotations, bookmarks, and neighborhood-definition changes are not proven safe.
6. Standalone Atlas-suite surfaces exist outside the Property Workbench tab; this packet classifies
   only the Workbench Atlas surface and directly inspected suite evidence.

## Validation Run

Commands for this packet:

```powershell
node scripts/spec-gates/workbench-compliance.mjs
node docs/brain/workorders/tools/wo-query.mjs --json
git diff --check
```

Expected validation result: PASS.

## Conclusion

The Workbench Atlas surface is materially implemented as a parcel-scoped Atlas tab with
backend-dependent parcel GIS reads, source-honesty disclosures, live-map eligibility checks, preview
fallbacks, and governed spatial tool actions. It is not a production release claim. The next safe
Workbench packet is Dais Surface Truth.

NEXT_RECOMMENDED_WO: WO-WORKBENCH-006 — Dais Surface Truth
STOP_TYPE: ATLAS_SURFACE_TRUTH_CAPTURED
