# County Studio Risk Object Source Derivation Audit

Generated: 2026-06-07T05:35:26.515Z
Status: RISK_OBJECT_SOURCE_AUDITED_DEV_DERIVED
Classification: DEV_DERIVED_FROM_REAL_INPUTS

## Decisions

- riskObjectsRequiredForForgeDev=true
- riskObjectsRequiredForProductionProof=true
- riskObjectsCanBeDevDerived=true
- productionProofAllowed=false
- operationalProofAllowed=false

## Source Path

- frontendFile: frontend/apps/os-shell/src/pages/forge/county-studio/components/RiskSurfaceCommandCenter.tsx
- apiRoute: GET /county-study/studies/{studyId}/health-summary
- backendServiceOrController: CountyStudyHealthService + risk surface derivation
- dbTableOrView: CountySegments / derived risk metrics
- joinKey: studyId + segmentId + riskObjectId
- countyId: 19190019-1919-1919-1919-191919191919
- taxYear: 2026
- studyId: runtime-selected-study

## Real Input Surfaces

| Surface | Classification | Observed Count | Real Dev Ready |
| --- | --- | --- | --- |
| parcel/property identity source | SYNC_DERIVED | 3199335 | true |
| property characteristics source | SYNC_DERIVED | 3199335 | true |
| valuation metrics source | SYNC_DERIVED | 83682 | true |
| ratio-study context source | SYNC_DERIVED | 83682 | true |
| geometry/map context source | SYNC_DERIVED_GEOMETRY | 80075 | true |

## Finding

Risk objects are deterministic development derivations from real Benton segment, valuation, ratio, CAMA, and TerraAtlas geometry inputs; production proof still requires canonical reconciliation.

## Required Proof To Upgrade

Recompute risk objects from canonical Benton valuation, CAMA, sales, segment, and geometry rows; prove same-study map/ledger/inspector alignment before production proof.

## Valid Follow-Ups

- Reclassify risk objects as DEV_DERIVED_FROM_REAL_INPUTS if deterministic real-input derivation remains proven.
- Wire risk objects to a real seeded/sync-derived persisted source if one exists.
- Keep risk objects GENERATED and degraded for Forge dev if synthetic placeholders remain.

## Boundaries

- This audit does not touch County Studio UI.
- This audit does not invent risk objects.
- This audit does not add mock or fallback risk data.
- This audit does not mutate TerraFusion Sync.
- This audit does not change DB seeding.
- This audit does not set productionProofAllowed=true.
- This audit does not set operationalProofAllowed=true.
