# June 10 Readiness Packet

Generated: 2026-05-04T16:37:08.051Z

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

## Next Execution Queue

- dbIdentity: Claude Code / Sync DB, audited by Codex; run `pnpm run truth:runtime-db-identity`; Prove the running API is connected to the intended TerraFusion DB before any row count can support readiness.
- dbContent: Claude Code / Sync DB, audited by Codex; run `pnpm run truth:runtime-db-content`; Prove product runtime tables and row shapes exist inside TerraFusion DB only.
- bentonParcelSanity: Codex after TerraFusion DB content is refreshed; run `pnpm run truth:benton-parcel-count-sanity`; Prove Benton parcel endpoint counts active/current distinct parcels, not raw historical or duplicate property rows.
- saleQualification: Codex after TerraFusion DB sales/qualification tables are refreshed; run `pnpm run truth:runtime-sale-qualification`; Prove Benton sales qualification lineage from TerraFusion DB runtime tables, with no source-system dependency in product runtime.
- bentonPilotClosure: Codex after all Benton data gates are green; run `pnpm run truth:benton-runtime-pilot-closure`; Prove Benton runtime pilot closure only after DB identity, content, load receipts, parcel sanity, and sale qualification pass.
- countyRuntimeContract: Codex after TerraFusion DB receipts; run `pnpm run truth:county-runtime-contract`; Each runtime county must pass identity, active/current semantics, product-load receipt, no fallback, and no PII projection checks.
- productLoadLedger: Claude Code / Sync DB, audited by Codex; run `pnpm run truth:terrafusion-db-product-load-ledger`; Emit/read product-load receipts proving TerraFusion DB table rows were loaded through the approved ingestion path.

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
