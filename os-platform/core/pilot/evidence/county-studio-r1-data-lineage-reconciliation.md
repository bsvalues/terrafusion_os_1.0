# County Studio R1 Data Lineage Reconciliation

Generated: 2026-06-06T23:05:52.655Z
Status: DATA_LINEAGE_RECONCILED_WITH_PRODUCTION_BLOCKERS

## Decisions

- realDevActivationAllowed=true
- realDevServerAllowed=true
- productionProofAllowed=false
- operationalProofAllowed=false

## Inventory

| Surface | Classification | Owner Lane | Observed Count | Status | Failure Reason | Required Proof To Upgrade |
| --- | --- | --- | --- | --- | --- | --- |
| map | PARTIAL_SEEDED | Forge | 80075 | REAL_DEV_AVAILABLE_PRODUCTION_BLOCKED | map overlays is served through Atlas compatibility geometry; compatibility/provisional geometry cannot satisfy real TerraAtlas-owned GIS proof. | Prove TerraAtlas-owned Benton geometry/layers and Forge risk overlays share countyId, taxYear, studyId, and selected object keys. |
| ledger | GENERATED | Forge | 83682 | PRODUCTION_BLOCKER | ledger rows are derived/presented by County Studio, but their authoritative source lineage and same-study binding are not proven. | Recompute ledger rows from authoritative segment metrics and prove same-study alignment with map and inspector. |
| inspector | GENERATED | Forge | 83682 | PRODUCTION_BLOCKER | inspector details are derived/presented by County Studio, but their authoritative source lineage and same-study binding are not proven. | Prove inspector details are sourced from the same authoritative segment/risk population as the selected map object and ledger row. |
| packet/payloads | UNKNOWN | Dossier | null | PRODUCTION_BLOCKER | Evidence packet lineage is not separately proven against Dossier-owned packet evidence. | Prove packet payloads preserve source row lineage and route to TerraDossier without presenting generated evidence as authoritative. |
| risk objects | GENERATED | Forge | 83682 | PRODUCTION_BLOCKER | risk objects are derived/presented by County Studio, but their authoritative source lineage and same-study binding are not proven. | Prove risk objects are recomputed from authoritative ratio/valuation rows and align with map, ledger, and inspector in one study context. |
| parcel/property identity | SYNC_DERIVED | Forge | 3199335 | REAL_DEV_AVAILABLE_PRODUCTION_BLOCKED | parcel/property source uses or references canonical service/table paths, but no authoritative Benton source/count manifest proves row-level truth. | Compare seeded/sync-derived parcel identity counts to canonical Benton expected counts and prove APN/parcelId reconciliation. |
| valuation metrics | SYNC_DERIVED | Forge | 83682 | REAL_DEV_AVAILABLE_PRODUCTION_BLOCKED | ratio study population uses or references canonical service/table paths, but no authoritative Benton source/count manifest proves row-level truth. | Prove sale qualification, valuation rows, and ratio metrics against authoritative Benton source counts and direct recomputation. |
| geometry/layers | FALLBACK | Atlas | 80075 | PRODUCTION_BLOCKER | Atlas layers is served through Atlas compatibility geometry; compatibility/provisional geometry cannot satisfy real TerraAtlas-owned GIS proof. | Replace compatibility proof with TerraAtlas-owned Benton parcel geometry, neighborhoods, segments, reval areas, and taxing district layer contracts. |
| owner/account/supplement joins | PARTIAL_SEEDED | Forge | {"ownerLanding":7396857,"truthOwner":774760,"canonicalOwner":215009,"account":425186,"suppAssociation":2808351} | PACKET_OPS_BLOCKER_NOT_FORGE_DEV | Owner/account/supplement rows are readable for real dev, but owner lane reconciliation is not production-complete. | Complete owner/supplement association reconciliation and prove expected Benton owner/account counts before production proof. |
| WPOV/WSDOR dependencies | PARTIAL_SEEDED | Forge | {"wpov":1273143,"truthWsdor":774696,"canonicalWsdor":686820} | REAL_DEV_AVAILABLE_PRODUCTION_BLOCKED | WPOV/WSDOR rows are present for real dev, but canonical source/count reconciliation remains incomplete. | Reconcile WPOV/WSDOR counts and joins against canonical Benton expectations and direct source recomputation. |

## What Is Now Real Enough For Dev

- map: PARTIAL_SEEDED (County Studio embedded TerraAtlas valuation-risk map)
- parcel/property identity: SYNC_DERIVED (Benton parcel/property identity)
- valuation metrics: SYNC_DERIVED (County Studio valuation and ratio metrics)
- owner/account/supplement joins: PARTIAL_SEEDED (Owner, account, and supplement association joins)
- WPOV/WSDOR dependencies: PARTIAL_SEEDED (WPOV and WSDOR dependency rows)

## Forge Dev Dependency Reclassification

- ownerSupnumBackfillStatus: IN_PROGRESS
- ownerSupnumBackfillLatestFailedStatus: FAILED
- ownerSupnumBackfillClassification: NOT_REQUIRED_FOR_FORGE_DEV
- ownerSupnumBackfillRequiredForForgeDev: false
- ownerSupnumBackfillRequiredForPacketProof: true
- ownerSupnumBackfillRequiredForOperationalProof: true

## What Remains Blocked For Production Proof

- map: PARTIAL_SEEDED - map overlays is served through Atlas compatibility geometry; compatibility/provisional geometry cannot satisfy real TerraAtlas-owned GIS proof.
- ledger: GENERATED - ledger rows are derived/presented by County Studio, but their authoritative source lineage and same-study binding are not proven.
- inspector: GENERATED - inspector details are derived/presented by County Studio, but their authoritative source lineage and same-study binding are not proven.
- packet/payloads: UNKNOWN - Evidence packet lineage is not separately proven against Dossier-owned packet evidence.
- risk objects: GENERATED - risk objects are derived/presented by County Studio, but their authoritative source lineage and same-study binding are not proven.
- parcel/property identity: SYNC_DERIVED - parcel/property source uses or references canonical service/table paths, but no authoritative Benton source/count manifest proves row-level truth.
- valuation metrics: SYNC_DERIVED - ratio study population uses or references canonical service/table paths, but no authoritative Benton source/count manifest proves row-level truth.
- geometry/layers: FALLBACK - Atlas layers is served through Atlas compatibility geometry; compatibility/provisional geometry cannot satisfy real TerraAtlas-owned GIS proof.
- owner/account/supplement joins: PARTIAL_SEEDED - Owner/account/supplement rows are readable for real dev, but owner lane reconciliation is not production-complete.
- WPOV/WSDOR dependencies: PARTIAL_SEEDED - WPOV/WSDOR rows are present for real dev, but canonical source/count reconciliation remains incomplete.

## Top 5 Data Truth Blockers

- Geometry/layers are not proven through TerraAtlas-owned Benton GIS contracts.
- Risk objects/ledger/inspector remain generated or derived without authoritative same-study lineage.
- Canonical expected Benton counts are missing for production reconciliation.
- Evidence packet and downstream payload lineage is unknown.
- WPOV/WSDOR and owner/account/supplement joins are partial seeded, not reconciled.

## Smallest Path To DATA_TRUTH_PASS

- Publish canonical Benton expected counts for every primary County Studio source.
- Replace compatibility/provisional GIS proof with TerraAtlas-owned geometry/layer lineage.
- Prove map, ledger, inspector, and packet payloads use the same countyId, taxYear, and studyId keys.
- Directly recompute ratio/valuation metrics from source rows and reconcile to the UI population.
- Attach Dossier/Dais/Trace lineage for evidence packets, workflow routes, and decisions.

## Blockers

- None

## Boundaries

- This reconciliation does not touch County Studio UI.
- This reconciliation does not add mock or fallback data.
- This reconciliation does not weaken DATA_TRUTH_FAIL.
- This reconciliation does not mutate TerraFusion Sync or DB seed behavior.
- This reconciliation does not change Docker/Postgres topology.
