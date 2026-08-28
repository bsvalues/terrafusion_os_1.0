# WO-WAL-001B — Public Acquisition Artifact Receipt Contract

| Field | Value |
| --- | --- |
| Status | `IMPLEMENTED_LOCAL_VALIDATED` |
| Parent | `WO-WAL-001` |
| Program | Washington Assessor Launch V1 |
| Base | `b740c3dadf069c0e7bfacf7a3e2c4e53dd5a388e` |
| Risk | R2 bounded public-data truth tooling |
| Contract reservation | `wal.public-acquisition-artifact-receipt.v1` |
| Environment reservation | `local-memory-artifact-fixture-only` |

## Objective

Create deterministic, deeply immutable receipts for explicitly supplied in-memory public artifact
bytes. Each receipt records the exact SHA-256 digest and byte length and overlays that narrow
observation onto one canonical county row from `wal.public-baseline-ledger.v1` without turning an
artifact receipt into evidence of parsing, normalization, landing, freshness, runtime registration,
or capability.

This child is a contract and fixture harness only. It does not acquire an artifact and does not
complete the open parent Work Order.

## Exact Reservations

Only these repository-relative paths may change:

- `docs/brain/workorders/active/WO-WAL-001B-public-acquisition-artifact-receipt-contract.md`
- `scripts/truth/wal-public-acquisition-artifact-receipt.mjs`
- `scripts/truth/wal-public-acquisition-artifact-receipt.test.mjs`

Reserved contract: `wal.public-acquisition-artifact-receipt.v1`.

Reserved environment: `local-memory-artifact-fixture-only`. The implementation and tests may use
only caller-supplied in-memory values and Node built-ins that do not access external state. They may
not read or write the filesystem, open network connections, access a database, use credentials, or
consume live county data.

## Input and Output Contract

The builder accepts:

1. an in-memory `wal.public-baseline-ledger.v1` value with all 39 canonical county rows in canonical
   order; and
2. one exact artifact declaration containing only `county`, `artifactKind`, and `bytes`, where
   `artifactKind` is `parcels` or `sales` and `bytes` is a non-empty `Uint8Array` view no larger than
   16 MiB.

Artifact byte length and copying use typed-array internal slots, so caller-defined iterators,
species, or shadow properties cannot substitute bytes or evade the fixture bound. The output is a
deeply frozen receipt containing the county binding, artifact kind, exact byte
length, lowercase SHA-256 digest, a deeply immutable snapshot of the selected baseline row, explicit
artifact and downstream gaps, and negative assertions that prevent receipt evidence from being
misread as product capability. Caller mutations after construction cannot alter the receipt.

The artifact bytes are opaque. Their contents are hashed exactly as supplied and are not decoded,
parsed, normalized, or searched for county names. County binding comes only from the exact artifact
declaration and canonical baseline row.

## Invariants

- Equivalent byte sequences and equivalent canonical baseline values produce equivalent receipts.
- The hash covers the exact supplied bytes and byte length is measured in bytes, not characters.
- Only canonical Washington county names are accepted; aliases and unexpected declarations fail
  closed.
- The baseline ledger must contain a dense, data-property-only array of all and only the canonical
  39 rows in canonical order, with the expected county token for every row.
- Every protected baseline row is reconciled against the exact nested `wal.public-baseline-ledger.v1`
  evidence states; contradictory landed, runtime, freshness, fallback, capability, or gap values
  fail closed before any row is embedded in a receipt. Protected nullable strings must retain the
  ledger's trimmed canonical form, and arrays may contain only their exact dense index properties.
- Artifact declarations with missing, extra, inherited, or ambiguous fields fail closed.
- A non-Benton artifact cannot use Benton county identity or Benton-bearing selected-row metadata.
- A receipt proves only that bytes were supplied to this in-memory contract; all unobserved
  downstream states remain explicit gaps.
- Artifact validation occurs before baseline processing. Only the selected, exact-schema baseline
  row is defensively snapshotted under explicit structure/depth/string bounds; the returned graph
  is deeply frozen.

## Denials

- no HTTP, scraping, browser, network, filesystem, archive, or database access;
- no persistence, committed evidence, landing, staging, quarantine, normalization, or promotion;
- no parser success, schema validity, row-count, semantic-content, or data-quality inference;
- no acquisition-time or freshness inference and no fabricated timestamp;
- no runtime registration, endpoint health, county availability, launch readiness, or capability
  inference;
- no credentials, secrets, PACS, protected data, live county data, or production action;
- no Benton fallback, county aliasing, cross-county overlay, or inherited county identity;
- no backend, frontend, package, lockfile, workflow, deployment, or generated-evidence change.

## Validation

- `node --check scripts/truth/wal-public-acquisition-artifact-receipt.mjs`
- `node --check scripts/truth/wal-public-acquisition-artifact-receipt.test.mjs`
- `node --test scripts/truth/wal-public-acquisition-artifact-receipt.test.mjs`
- exact hash and byte-length tests, including non-ASCII and sliced typed-array views;
- typed-array iterator and shadowed-byte-length bypass regressions;
- deterministic receipt and baseline-overlay tests;
- deep immutability and caller-mutation tests for bytes, artifact declarations, and baseline rows;
- explicit-gap and no landing/runtime/freshness/capability-inference tests;
- malformed, sparse, accessor-backed, structurally expanded, or contradictory baseline refusals,
  plus county-alias, cross-county, and Benton-contamination refusals;
- source review proving the implementation imports only the cryptographic primitive and exposes no
  filesystem, network, persistence, or CLI surface;
- `git diff --check`;
- changed-path audit proving only the three exact reservations changed.

## Completion

This child is complete when the bounded contract and focused tests pass and the exact three-path
scope is clean. Its receipts are in-memory evidence primitives for a later authorized public-data
acquisition lane. They are not acquisition, landing, runtime, production, or assessor-acceptance
evidence, and they do not satisfy `WO-WAL-001`.
