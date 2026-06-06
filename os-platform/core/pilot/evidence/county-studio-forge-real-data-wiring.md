# County Studio Forge Real Data Wiring

Generated: 2026-06-06T23:47:15.927Z
Status: FORGE_REAL_DATA_WIRING_VERIFIED_WITH_GAPS

## Decisions

- realDevServerAllowed=true
- realDevActivationAllowed=true
- coreForgeValuationWiringReady=true
- productionProofAllowed=false
- operationalProofAllowed=false

## Forge Wiring Surfaces

| Surface | Classification | Owner Lane | API Route | Backend | DB Table/View | Join Key | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| parcel/property identity source | SYNC_DERIVED | Forge | GET /county-study/studies/{studyId}/segments + segment detail routes | CountyStudySegmentDerivationService / CountyStudyInspectorService | truth_pacs.parcel_spine + canonical_tf.tf_parcel | countyId + taxYear + parcelId/APN | REAL_DEV_WIRED_PRODUCTION_BLOCKED |
| property characteristics source | SYNC_DERIVED | Forge | GET /county-study/studies/{studyId}/segments + segment detail routes | CountyStudySegmentDerivationService / CountyStudyInspectorService | truth_pacs.parcel_spine + canonical_tf.tf_parcel | countyId + taxYear + parcelId/APN | REAL_DEV_WIRED_PRODUCTION_BLOCKED |
| valuation metrics source | SYNC_DERIVED | Forge | GET /county-study/studies/{studyId}/statistics-compat + health-summary | CountyStudyHealthService / statistics compatibility API | PACS valuation + comparable sales ratio-study population | countyId + taxYear + studyId + parcelId + saleId | REAL_DEV_WIRED_PRODUCTION_BLOCKED |
| ratio-study context source | SYNC_DERIVED | Forge | GET /county-study/studies/{studyId}/statistics-compat + health-summary | CountyStudyHealthService / statistics compatibility API | PACS valuation + comparable sales ratio-study population | countyId + taxYear + studyId + parcelId + saleId | REAL_DEV_WIRED_PRODUCTION_BLOCKED |
| risk object source | GENERATED | Forge | GET /county-study/studies/{studyId}/health-summary | CountyStudyHealthService + risk surface derivation | CountySegments / derived risk metrics | studyId + segmentId + riskObjectId | WIRING_GAP_IDENTIFIED |
| geometry/map context source | ATLAS_LAYER_AVAILABLE_NOT_WIRED | Atlas | GET /launch-data/washington/counties/status.json + Atlas compatibility map routes | Atlas Live compatibility API | gis_tf.tf_parcel_geom | countyId + parcelId/APN + layerId | WIRING_GAP_IDENTIFIED |
| countyId/taxYear/studyId propagation | SYNC_DERIVED | Forge | County Studio route/query params and API payloads | CountyStudyController + CountyStudyHealthService | runtime study context | countyId + taxYear + studyId | REAL_DEV_WIRED_PRODUCTION_BLOCKED |
| fallback/mock/generated path scan | GENERATED | Forge | evidence scan | county-studio-forge-real-data-wiring gate | n/a | surface classification | WIRING_GAP_IDENTIFIED |
| owner identity dependency scan | NOT_REQUIRED_FOR_FORGE_DEV | Forge | County Studio Forge valuation read paths | CountyStudyController / CountyStudyHealthService / CountyStudyInspectorService | owner/account/supplement lineage | ownerId/supNum only if a Forge surface consumes owner identity | NOT_REQUIRED_FOR_FORGE_DEV |

## TerraAtlas Geometry Evidence

- status: TERRAATLAS_GEOMETRY_EVIDENCE_AVAILABLE_NOT_WIRED
- classification: ATLAS_LAYER_AVAILABLE_NOT_WIRED
- realGeometryExists: true
- countyStudioUsesRealTerraAtlasGeometry: false

## Owner Identity Dependency Scan

- ownerSupnumBackfillStatus: IN_PROGRESS
- ownerSupnumBackfillLatestFailedStatus: FAILED
- ownerSupnumRequiredForForgeDev: false
- ownerSupnumRequiredForPacketProof: true
- ownerSupnumRequiredForOperationalProof: true
- ownerIdentityConsumedByForgeSurfaces: false

## Mock/Fallback/Generated Path Scan

- risk object source: GENERATED - risk objects are derived/presented by County Studio, but their authoritative source lineage and same-study binding are not proven.

## Wiring Gaps

- risk object source: GENERATED - Prove risk objects are recomputed from authoritative ratio/valuation rows and align with map, ledger, and inspector in one study context.
- geometry/map context source: ATLAS_LAYER_AVAILABLE_NOT_WIRED - Wire County Studio embedded map context to TerraAtlas-owned geometry/layer service or prove the compatibility feed is backed by gis_tf.tf_parcel_geom with source-row lineage.

## Blockers

- None

## Boundaries

- This gate does not touch County Studio UI.
- This gate does not mutate TerraFusion Sync.
- This gate does not change DB seeding.
- This gate does not require owner-supnum for Forge dev unless an owner-identity surface consumes it.
- This gate does not set productionProofAllowed=true.
- This gate does not set operationalProofAllowed=true.
- This gate does not hide DATA_TRUTH_FAIL.
