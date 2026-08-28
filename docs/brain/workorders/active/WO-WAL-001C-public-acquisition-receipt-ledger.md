# WO-WAL-001C — Public Acquisition Receipt Ledger

| Field | Value |
| --- | --- |
| Status | `PROTECTED_COMPLETE` |
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
present receipt preserves its source-declared byte length and lowercase SHA-256 digest without
claiming that this layer authenticated issuance or recomputed the digest from unavailable bytes.

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
- The ledger validates receipt structure and internal consistency only. Because 001C receives neither
  artifact bytes nor an unforgeable 001B issuance token, copied lengths and digests are explicitly
  named source-receipt claims; issuance authentication and digest recomputation remain false.
- Only exact canonical county names and the closed artifact kinds `parcels` and `sales` are admitted.
- Duplicate receipts for the same county and artifact kind fail closed, including byte-identical
  duplicates.
- Input ordering never affects output ordering or serialization. Rows always follow the protected
  canonical 39-county order.
- Each missing parcel or sales receipt is represented by a distinct explicit gap, and the summary
  field is narrowly named `countiesWithMissingReceiptSlots`. Even a complete 78-receipt matrix
  retains issuance-authentication, digest-recomputation, interpretation, and downstream gaps.
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

PR #1498 reached protected main as `cfbb64713d21970407c856856dd40671891d15d1` with updated
integrated head `3a128deb21e48a5e9c29bb3e6cb2b0c9963c40e4`; reviewed fix
`ad4f2f1c234a17ffb475153f332ebba104a6f344` remains separately identified and is contained in the
protected result. Only the C child is complete: the broad `WO-WAL-001` parent remains open because
lawful acquisition, artifact landing, freshness/provenance, normalized rows, runtime registration,
and capability truth are unproven. Continuation routes through the exact 001D byte-verification
child after `WO-WAL-000D` reaches protected main.
