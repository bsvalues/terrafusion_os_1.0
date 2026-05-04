# June 10 Readiness Packet

Generated: 2026-05-04T16:34:15.966Z

## Status

- Result: FAIL
- Ship blockers: 7
- Warnings: 0

## Source Of Truth Boundary

- TerraFusion DB is the application/product source of truth.
- Legacy/public systems are upstream inputs only.
- Product runtime must read TerraFusion DB through TerraFusion API.

## County Scope

- Counties checked: 39
- Runtime proven by crosswalk: 0
- Public-source seed: 12
- Provenance inventory only: 27
- 39-county runtime claim prohibited: yes

## TerraFusion DB

- DB identity passed: no
- DB content passed: no
- Product load ledger passed: no
- Product tables checked: 10
- Lineage proven tables: 0
- Rows exist with lineage unproven: 4
- Empty product tables: 6

## Benton Pilot

- Parcel sanity passed: no
- Sale qualification status: UNKNOWN
- Pilot closure status: UNKNOWN

## Ship Blockers

- dbIdentity: Required artifact is missing: generated/truth/runtime-db-identity.json.
- dbContent: Required artifact is missing: generated/truth/runtime-db-content-audit.json.
- bentonParcelSanity: Required artifact is missing: generated/truth/benton-parcel-count-sanity.json.
- saleQualification: Required artifact is missing: generated/truth/runtime-sale-qualification-lineage-proof.json.
- bentonPilotClosure: Required artifact is missing: generated/truth/benton-runtime-pilot-closure.json.
- countyRuntimeContract: County-neutral runtime contract is not passing.
- productLoadLedger: TerraFusion DB product load ledger is not lineage-proven.

## Warnings

- none

## Artifact Inputs

- crosswalk: generated/truth/washington-39-county-data-crosswalk.json
- countyRuntimeContract: generated/truth/county-runtime-contract.json
- dbIdentity: missing (generated/truth/runtime-db-identity.json)
- dbContent: missing (generated/truth/runtime-db-content-audit.json)
- productLoadLedger: generated/truth/terrafusion-db-product-load-ledger.json
- bentonParcelSanity: missing (generated/truth/benton-parcel-count-sanity.json)
- saleQualification: missing (generated/truth/runtime-sale-qualification-lineage-proof.json)
- bentonPilotClosure: missing (generated/truth/benton-runtime-pilot-closure.json)
