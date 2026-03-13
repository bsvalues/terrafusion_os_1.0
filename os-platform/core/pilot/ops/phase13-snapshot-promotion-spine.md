# Phase 13 Snapshot Promotion Spine

## Purpose
Define the promoted Benton artifact and prove the handoff from the PACS-connected runtime to the Hostinger snapshot runtimes.

## Promoted Benton artifact
- The promoted Benton artifact is a logical operational snapshot contract generated from the PACS-connected Benton runtime.
- It is not raw live PACS state.
- It is not defined by the mutable SQLite file bytes alone.

## Source runtime
- Local/canonical Benton runtime is the PACS-connected conversion host.
- It produces the TerraFusion operational snapshot after TerraFusionSync conversion.

## Destination runtimes
- Hostinger staging serves the promoted Benton operational snapshot.
- Hostinger production serves the promoted Benton operational snapshot.
- Neither destination runtime performs live PACS sync.

## Stable parity fields
The promotion identity is defined by stable operational content:
- `Properties`
- `PropertyAssessments`
- `ComparableSales`
- `ComparableSalesDistinctParcels`
- stable comparable-sales fingerprint sample

## Mutable runtime fields excluded from promotion identity
These fields can diverge after startup and are not used to define promotion identity:
- `EtlSyncJobs`
- raw SQLite file hash
- raw SQLite file size

## Comparison rule
- staging must match the local stable snapshot contract
- production must match the local stable snapshot contract
- staging and production must match each other on the stable snapshot contract

## Operator confirmation
- The promoted snapshot is not considered proven unless the operator surface still serves Benton comps on staging and production.

## Boundary
- This phase does not make Hostinger a PACS-connected runtime.
- This phase does not collapse the runtime-role split from Phase 12.

## Completion rule
Phase 13 is complete only when staging and production match the local stable snapshot contract.
