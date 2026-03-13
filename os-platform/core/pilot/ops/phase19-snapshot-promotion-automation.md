# Phase 19 Snapshot Promotion Automation

## Purpose
Make Benton snapshot promotion a repeatable automation path instead of an implied manual copy.

## Automation contract
- Phase 19 generates a Benton promotion artifact bundle from the canonical PACS-connected runtime.
- The bundle includes:
  - promoted Benton snapshot database copy
  - promotion manifest
  - snapshot checksum
  - manifest checksum
  - detached local promotion-attestation signature
- The artifact is published to the shared Hostinger promotion catalog before promotion receipts are written.

## Promotion catalog
- Canonical remote catalog path: `/opt/terrafusion/promotion-artifacts/<artifactId>/`
- This catalog is shared across the Hostinger staging and production snapshot runtimes because both run on the same VPS.

## Current automation mode
- Current automation mode is parity-confirmed promotion with no live DB replacement when staging and production already match the promoted stable contract.
- That means Phase 19 still publishes the artifact and writes promotion receipts, but does not replace the deployed SQLite files when parity is already true.

## Promotion receipts
- Staging receipt path: `/opt/terrafusion/staging/current-benton-snapshot-promotion.json`
- Production receipt path: `/opt/terrafusion/production/current-benton-snapshot-promotion.json`
- Receipts bind the active deployed runtime to the promoted artifact ID and manifest identity.

## Signature truth
- Phase 19 uses a local promotion-attestation signature so the generated manifest can be verified after automation runs.
- This is truthful integrity attestation, not hardened promotion authority.
- Phase 22 will harden signer authority and promotion credentials; Phase 19 only requires truthful local attestation and repeatable promotion receipts.

## Stable promotion identity
- `Properties`
- `PropertyAssessments`
- `ComparableSales`
- `ComparableSalesDistinctParcels`
- stable comparable-sales fingerprint sample
- `CamaCharacteristics`
- `CostMatrices`

## Mutable fields excluded from promotion identity
- `EtlSyncJobs`
- raw SQLite file hash
- raw SQLite file size

## Boundary
- Phase 19 does not turn Hostinger into a PACS-connected runtime.
- Phase 19 does not bypass the Phase 12 and Phase 13 runtime-role split.

## Completion rule
Phase 19 is complete only when the promoted Benton artifact is generated, checksummed, locally attested, published to the Hostinger promotion catalog, and tied to staging and production through promotion receipts.
