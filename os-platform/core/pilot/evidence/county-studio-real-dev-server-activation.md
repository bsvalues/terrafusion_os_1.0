# County Studio Real Dev Server Activation

Generated: 2026-06-06T23:47:12.796Z
Status: REAL_DEV_ACTIVATION_READY

## Decision

- Real Dev Activation: ALLOWED
- Production Proof: BLOCKED
- Operational Proof: BLOCKED

## Run Path

1. `pnpm run proof:county-studio:benton-real-dev-server-readiness:db`
2. `pnpm run proof:county-studio:real-dev-activation`
3. `cross-env TF_COUNTY_STUDIO_DEV_DATA_MODE=real-benton TF_COUNTY_STUDIO_PRODUCTION_PROOF=false TF_COUNTY_STUDIO_OPERATIONAL_PROOF=false pnpm run dev`

## Readiness Posture

- Status: REAL_DEV_DATA_AVAILABLE
- realDevServerAllowed: true
- productionProofAllowed: false
- operationalProofAllowed: false

## Forge Dev Dependency Reclassification

- ownerSupnumBackfillStatus: IN_PROGRESS
- ownerSupnumBackfillLatestFailedStatus: FAILED
- ownerSupnumBackfillClassification: NOT_REQUIRED_FOR_FORGE_DEV
- ownerSupnumBackfillRequiredForForgeDev: false
- ownerSupnumBackfillRequiredForPacketProof: true
- ownerSupnumBackfillRequiredForOperationalProof: true

## Data Truth Posture

- Status: DATA_TRUTH_FAIL
- productionProofAllowed: false
- operationalProofAllowed: false

## Production-Blocked Dependencies

| Area | Classification | Reason |
| --- | --- | --- |
| countyId | UNKNOWN | Benton countyId label is present, but identity is not proven against an authoritative Benton source manifest. |
| taxYear | UNKNOWN | Tax year appears in launch/runtime context, but no authoritative study source manifest proves the year-aligned population. |
| parcel geometry source | FALLBACK | parcel geometry source is served through GeoForge compatibility geometry; compatibility/provisional geometry cannot satisfy real TerraAtlas-owned GIS proof. |
| neighborhoods | FALLBACK | neighborhoods are visible in the map/study path, but spatial provenance is still tied to compatibility/provisional geometry. |
| market areas | UNKNOWN | market areas are part of the required Benton valuation lattice, but no authoritative source lineage/count proof is present. |
| model groups | UNKNOWN | model groups are part of the required Benton valuation lattice, but no authoritative source lineage/count proof is present. |
| value tiers | UNKNOWN | value tiers are part of the required Benton valuation lattice, but no authoritative source lineage/count proof is present. |
| county segments | FALLBACK | county segments are visible in the map/study path, but spatial provenance is still tied to compatibility/provisional geometry. |
| taxing districts | FALLBACK | taxing districts are visible in the map/study path, but spatial provenance is still tied to compatibility/provisional geometry. |
| risk objects | GENERATED | risk objects are derived/presented by County Studio, but their authoritative source lineage and same-study binding are not proven. |
| ledger rows | GENERATED | ledger rows are derived/presented by County Studio, but their authoritative source lineage and same-study binding are not proven. |
| inspector details | GENERATED | inspector details are derived/presented by County Studio, but their authoritative source lineage and same-study binding are not proven. |
| map overlays | FALLBACK | map overlays is served through Atlas compatibility geometry; compatibility/provisional geometry cannot satisfy real TerraAtlas-owned GIS proof. |
| Atlas layers | FALLBACK | Atlas layers is served through Atlas compatibility geometry; compatibility/provisional geometry cannot satisfy real TerraAtlas-owned GIS proof. |
| SignalR payloads | UNKNOWN | County Studio live SignalR payload provenance is not proven for the selected Benton study context. |

## Activation Blockers

- None

## Rules

- Real dev activation requires the Benton real-dev readiness DB gate.
- Mock, fixture, generated, fallback, or unknown activation dependencies cannot satisfy real dev mode.
- Real dev mode is not production proof.
- Real dev mode is not operational proof.

## Boundaries

- This gate does not touch County Studio UI.
- This gate does not touch TerraFusion Sync.
- This gate does not touch DB seeding.
- This gate does not bypass evidence gates.
