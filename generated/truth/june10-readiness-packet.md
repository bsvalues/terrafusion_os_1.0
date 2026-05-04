# June 10 Readiness Packet

Generated: 2026-05-04T17:17:57.792Z

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
- Sale qualification status: FAIL
- Pilot closure status: FAIL

## Ship Blockers

- countyRuntimeContract: County-neutral runtime contract is not passing.
- dbIdentity: Running API TerraFusion DB identity is not proven.
- dbContent: Runtime TerraFusion DB content audit is not passing.
- productLoadLedger: TerraFusion DB product load ledger is not lineage-proven.
- bentonParcelSanity: Benton active/current parcel count sanity is not proven.
- saleQualification: Benton sale qualification lineage is not passing.
- bentonPilotClosure: Benton runtime pilot closure is not passing.

## Next Execution Queue

- countyRuntimeContract: Codex after TerraFusion DB receipts; run `pnpm run truth:county-runtime-contract`; Each runtime county must pass identity, active/current semantics, product-load receipt, no fallback, and no PII projection checks.
- dbIdentity: Claude Code / Sync DB, audited by Codex; run `pnpm run truth:runtime-db-identity`; Prove the running API is connected to the intended TerraFusion DB before any row count can support readiness.
- dbContent: Claude Code / Sync DB, audited by Codex; run `pnpm run truth:runtime-db-content`; Prove product runtime tables and row shapes exist inside TerraFusion DB only.
- productLoadLedger: Claude Code / Sync DB, audited by Codex; run `pnpm run truth:terrafusion-db-product-load-ledger`; Emit/read product-load receipts proving TerraFusion DB table rows were loaded through the approved ingestion path.
- bentonParcelSanity: Codex after TerraFusion DB content is refreshed; run `pnpm run truth:benton-parcel-count-sanity`; Prove Benton parcel endpoint counts active/current distinct parcels, not raw historical or duplicate property rows.
- saleQualification: Codex after TerraFusion DB sales/qualification tables are refreshed; run `pnpm run truth:runtime-sale-qualification`; Prove Benton sales qualification lineage from TerraFusion DB runtime tables, with no source-system dependency in product runtime.
- bentonPilotClosure: Codex after all Benton data gates are green; run `pnpm run truth:benton-runtime-pilot-closure`; Prove Benton runtime pilot closure only after DB identity, content, load receipts, parcel sanity, and sale qualification pass.

## Warnings

- none

## Artifact Inputs

- crosswalk: generated/truth/washington-39-county-data-crosswalk.json
- countyRuntimeContract: generated/truth/county-runtime-contract.json
- dbIdentity: generated/truth/runtime-db-identity.json
- dbContent: generated/truth/runtime-db-content-audit.json
- productLoadLedger: generated/truth/terrafusion-db-product-load-ledger.json
- bentonParcelSanity: generated/truth/benton-parcel-count-sanity.json
- saleQualification: generated/truth/runtime-sale-qualification-lineage-proof.json
- bentonPilotClosure: generated/truth/benton-runtime-pilot-closure.json
