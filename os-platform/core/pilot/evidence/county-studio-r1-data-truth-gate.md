# County Studio R1 Data Truth Gate

Generated: 2026-06-06T22:03:30.563Z
Status: DATA_TRUTH_FAIL

No data lineage, no production proof. No provenance, no operational claim. No canonical count comparison, no Benton truth. No geometry source, no GIS proof.

## Claim Boundary

- Surface runtime proof only: true
- Real dev server allowed: true
- Production proof allowed: false
- Operational proof allowed: false
- Real dev boundary: County Studio may run as a real Benton-backed dev surface; this is not production or operational proof.

## Required Proof Areas

| Area | Classification | Production proof allowed | Reason |
| --- | --- | --- | --- |
| study list | SYNC_DERIVED | false | study list can load through County Study services, but the selected study's authoritative source package is not proven. |
| selected study | SYNC_DERIVED | false | selected study can load through County Study services, but the selected study's authoritative source package is not proven. |
| countyId | UNKNOWN | false | Benton countyId label is present, but identity is not proven against an authoritative Benton source manifest. |
| taxYear | UNKNOWN | false | Tax year appears in launch/runtime context, but no authoritative study source manifest proves the year-aligned population. |
| parcel/property source | SYNC_DERIVED | false | parcel/property source uses or references canonical service/table paths, but no authoritative Benton source/count manifest proves row-level truth. |
| parcel geometry source | FALLBACK | false | parcel geometry source is served through GeoForge compatibility geometry; compatibility/provisional geometry cannot satisfy real TerraAtlas-owned GIS proof. |
| neighborhoods | FALLBACK | false | neighborhoods are visible in the map/study path, but spatial provenance is still tied to compatibility/provisional geometry. |
| market areas | UNKNOWN | false | market areas are part of the required Benton valuation lattice, but no authoritative source lineage/count proof is present. |
| model groups | UNKNOWN | false | model groups are part of the required Benton valuation lattice, but no authoritative source lineage/count proof is present. |
| value tiers | UNKNOWN | false | value tiers are part of the required Benton valuation lattice, but no authoritative source lineage/count proof is present. |
| county segments | FALLBACK | false | county segments are visible in the map/study path, but spatial provenance is still tied to compatibility/provisional geometry. |
| taxing districts | FALLBACK | false | taxing districts are visible in the map/study path, but spatial provenance is still tied to compatibility/provisional geometry. |
| comparable sales | SYNC_DERIVED | false | comparable sales uses or references canonical service/table paths, but no authoritative Benton source/count manifest proves row-level truth. |
| CAMA characteristics | SYNC_DERIVED | false | CAMA characteristics uses or references canonical service/table paths, but no authoritative Benton source/count manifest proves row-level truth. |
| PACS valuation | SYNC_DERIVED | false | PACS valuation uses or references canonical service/table paths, but no authoritative Benton source/count manifest proves row-level truth. |
| ratio study population | SYNC_DERIVED | false | ratio study population uses or references canonical service/table paths, but no authoritative Benton source/count manifest proves row-level truth. |
| risk objects | GENERATED | false | risk objects are derived/presented by County Studio, but their authoritative source lineage and same-study binding are not proven. |
| ledger rows | GENERATED | false | ledger rows are derived/presented by County Studio, but their authoritative source lineage and same-study binding are not proven. |
| inspector details | GENERATED | false | inspector details are derived/presented by County Studio, but their authoritative source lineage and same-study binding are not proven. |
| map overlays | FALLBACK | false | map overlays is served through Atlas compatibility geometry; compatibility/provisional geometry cannot satisfy real TerraAtlas-owned GIS proof. |
| Atlas layers | FALLBACK | false | Atlas layers is served through Atlas compatibility geometry; compatibility/provisional geometry cannot satisfy real TerraAtlas-owned GIS proof. |
| TerraForge statistics API | SYNC_DERIVED | false | TerraForge statistics API uses or references canonical service/table paths, but no authoritative Benton source/count manifest proves row-level truth. |
| SignalR payloads | UNKNOWN | false | County Studio live SignalR payload provenance is not proven for the selected Benton study context. |

## Claim Findings

- BLOCKER: Prior runtime proof uses production-proof language without data-truth proof. - The artifact proves route/render/runtime signals; it does not prove authoritative Benton data lineage.
- BLOCKER: Prior proof accepts compatibility Atlas/GeoForge geometry contracts. - ATLAS LIVE cannot pass a production GIS proof through compatibility geometry.

## Failures

- study list: study list can load through County Study services, but the selected study's authoritative source package is not proven.
- selected study: selected study can load through County Study services, but the selected study's authoritative source package is not proven.
- countyId: Benton countyId label is present, but identity is not proven against an authoritative Benton source manifest.
- taxYear: Tax year appears in launch/runtime context, but no authoritative study source manifest proves the year-aligned population.
- parcel/property source: parcel/property source uses or references canonical service/table paths, but no authoritative Benton source/count manifest proves row-level truth.
- parcel geometry source: parcel geometry source is served through GeoForge compatibility geometry; compatibility/provisional geometry cannot satisfy real TerraAtlas-owned GIS proof.
- neighborhoods: neighborhoods are visible in the map/study path, but spatial provenance is still tied to compatibility/provisional geometry.
- market areas: market areas are part of the required Benton valuation lattice, but no authoritative source lineage/count proof is present.
- model groups: model groups are part of the required Benton valuation lattice, but no authoritative source lineage/count proof is present.
- value tiers: value tiers are part of the required Benton valuation lattice, but no authoritative source lineage/count proof is present.
- county segments: county segments are visible in the map/study path, but spatial provenance is still tied to compatibility/provisional geometry.
- taxing districts: taxing districts are visible in the map/study path, but spatial provenance is still tied to compatibility/provisional geometry.
- comparable sales: comparable sales uses or references canonical service/table paths, but no authoritative Benton source/count manifest proves row-level truth.
- CAMA characteristics: CAMA characteristics uses or references canonical service/table paths, but no authoritative Benton source/count manifest proves row-level truth.
- PACS valuation: PACS valuation uses or references canonical service/table paths, but no authoritative Benton source/count manifest proves row-level truth.
- ratio study population: ratio study population uses or references canonical service/table paths, but no authoritative Benton source/count manifest proves row-level truth.
- risk objects: risk objects are derived/presented by County Studio, but their authoritative source lineage and same-study binding are not proven.
- ledger rows: ledger rows are derived/presented by County Studio, but their authoritative source lineage and same-study binding are not proven.
- inspector details: inspector details are derived/presented by County Studio, but their authoritative source lineage and same-study binding are not proven.
- map overlays: map overlays is served through Atlas compatibility geometry; compatibility/provisional geometry cannot satisfy real TerraAtlas-owned GIS proof.
- Atlas layers: Atlas layers is served through Atlas compatibility geometry; compatibility/provisional geometry cannot satisfy real TerraAtlas-owned GIS proof.
- TerraForge statistics API: TerraForge statistics API uses or references canonical service/table paths, but no authoritative Benton source/count manifest proves row-level truth.
- SignalR payloads: County Studio live SignalR payload provenance is not proven for the selected Benton study context.
- Prior runtime proof uses production-proof language without data-truth proof.: The artifact proves route/render/runtime signals; it does not prove authoritative Benton data lineage.
- Prior proof accepts compatibility Atlas/GeoForge geometry contracts.: ATLAS LIVE cannot pass a production GIS proof through compatibility geometry.

## Next Required Unblock

- Replace compatibility/provisional Atlas geometry with TerraAtlas-owned Benton geometry/layer contracts.
- Provide authoritative Benton source/count manifest for every primary proof area.
- Prove map, ledger, inspector, and statistics rows share the same countyId, taxYear, and studyId context.
- Rename surface runtime proof so it cannot imply data truth or operational proof.

## Boundaries

- This gate does not touch TerraFusion Sync.
- This gate does not touch DB seeding.
- This gate does not restart Docker/Postgres.
- This gate does not rewrite TerraAtlas.
