# WO-WAL-001C — Public Acquisition Receipt Ledger

| Field | Value |
| --- | --- |
| Status | `IMPLEMENTED; PROTECTED MERGE REQUIRED` |
| Parent | `WO-WAL-001` |
| Program | Washington Assessor Launch V1 |
| Base | `474161f9309145e2341419563de7192dfbded11e` |
| Risk | R2 bounded public-evidence aggregation |
| Contract reservation | `wal.public-acquisition-receipt-ledger.v1` |
| Environment reservation | `local-memory-receipt-ledger-only` |
| Terminal condition | `CANONICAL_39_COUNTY_ACQUISITION_RECEIPT_LEDGER_AND_EXPLICIT_GAPS_PROVEN` |

## Objective

Aggregate protected `wal.public-acquisition-artifact-receipt.v1` values into one deterministic,
deeply immutable ledger containing exactly one canonical row for each of Washington's 39 counties.
Each row has separate `parcels` and `sales` receipt slots. Missing slots remain explicit gaps; a
present receipt preserves its exact byte length and lowercase SHA-256 digest.

This child does not acquire or parse artifacts and does not complete `WO-WAL-001`. It is a bounded
in-memory evidence ledger for later, separately reserved acquisition, landing, and runtime work.

## Exact reservations

Only these paths may change:

- `docs/brain/workorders/active/WO-WAL-001C-public-acquisition-receipt-ledger.md`
- `scripts/truth/wal-public-acquisition-receipt-ledger.mjs`
- `scripts/truth/wal-public-acquisition-receipt-ledger.test.mjs`

The contract is `wal.public-acquisition-receipt-ledger.v1`; the environment is
`local-memory-receipt-ledger-only`. Inputs are already-issued, deeply immutable 001B receipts passed
directly in memory. No filesystem, network, database, credential, or live-county surface exists.

## Contract

- The constructor accepts exactly one dense plain `receipts` array with at most 78 entries.
- Each entry must retain the exact protected 001B contract, environment, county binding, baseline
  overlay, SHA-256 evidence, truth assertions, explicit gaps, and deep immutability.
- Only exact canonical county names and the closed artifact kinds `parcels` and `sales` are admitted.
- Duplicate receipts for the same county and artifact kind fail closed, including byte-identical
  duplicates.
- Input ordering never affects output ordering or serialization. Rows always follow the protected
  canonical 39-county order.
- Each missing parcel or sales receipt is represented by a distinct explicit gap. Even a complete
  78-receipt matrix retains interpretation and downstream gaps.
- The output snapshots only receipt evidence required by this contract and is deeply frozen.

## Denials

- no acquisition transport, HTTP, browser, network, filesystem, archive, or database access;
- no decoding, CSV parsing, normalization, row-count, quality, provenance, or freshness inference;
- no staging, quarantine, landing, persistence, runtime registration, capability, or readiness claim;
- no county aliases, cross-county overlay, duplicate receipt, or silent Benton substitution;
- no protected data, credentials, PACS, external write, deployment, or production action;
- no file, contract, or environment outside the three exact reservations.

## Validation

- `node --check scripts/truth/wal-public-acquisition-receipt-ledger.mjs`
- `node --check scripts/truth/wal-public-acquisition-receipt-ledger.test.mjs`
- `node --test scripts/truth/wal-public-acquisition-receipt-ledger.test.mjs`
- exact 39-row ordering, exact hashes/lengths, deterministic input-order independence, complete and
  empty matrices, duplicate/mismatch/Benton refusal, deep immutability, and explicit-gap tests;
- malformed, contradictory, sparse, accessor-backed, expanded, and oversized input refusals;
- `git diff --check` and exact three-path audit.

## Completion boundary

Completion requires the exact reviewed implementation head to reach protected `main` through a PR
with all required checks green and zero unresolved review threads. Even then, only the C child is
complete: the broad `WO-WAL-001` parent remains open because lawful acquisition, artifact landing,
freshness/provenance, normalized rows, runtime registration, and capability truth are unproven.
