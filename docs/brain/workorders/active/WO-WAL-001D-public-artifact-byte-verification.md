# WO-WAL-001D — Public Artifact Byte Verification

| Field | Value |
| --- | --- |
| Status | `PROTECTED_COMPLETE` |
| Parent | `WO-WAL-001` |
| Program | Washington Assessor Launch V1 |
| Base | `f21cfa6f61db0bac7d5da643c948991a14f459fd` |
| Risk | R2 bounded public-data truth tooling |
| Contract reservation | `wal.public-acquisition-artifact-verification.v1` |
| Environment reservation | `local-memory-public-artifact-verification-only` |
| Terminal condition | `PUBLIC_ARTIFACT_BYTES_MATCH_RECEIPT_LEDGER_HASH_LENGTH_COUNTY_KIND_PROVEN` |
| Protected completion | PR `#1504`, merge `9b1379a5dc1112bba3d836fd4f38dcba254c132b`; reviewed fix `d1dcc7f2c1ed8bd0104890d2081b550b040c34b1`; integrated head `07d5737cf49be7010d8a94e31a20572987c2ffa3` |

## Objective

Recompute the exact byte length and SHA-256 digest of one bounded, caller-supplied in-memory public
artifact and prove that both values match one canonical county and artifact-kind slot in a protected
`wal.public-acquisition-receipt-ledger.v1` value. Preserve the receipt ledger's explicit gaps and
keep byte-to-claim agreement separate from receipt issuance, source authenticity, acquisition,
parsing, freshness, landing, runtime, capability, and launch truth.

This child verifies one supplied byte sequence against one ledger claim. It does not acquire or land
an artifact and does not complete the open `WO-WAL-001` parent.

## Exact reservations

Only these repository-relative paths may change:

- `docs/brain/workorders/active/WO-WAL-001D-public-artifact-byte-verification.md`
- `scripts/truth/wal-public-acquisition-artifact-verification.mjs`
- `scripts/truth/wal-public-acquisition-artifact-verification.test.mjs`

The contract is `wal.public-acquisition-artifact-verification.v1`; the environment is
`local-memory-public-artifact-verification-only`. The implementation and tests may use only
caller-supplied in-memory values and Node built-ins that do not access external state. They may not
read or write the filesystem, open a network connection, access a database, use credentials, or
consume live county data.

## Contract

The verifier accepts exactly:

1. an already-issued, deeply immutable `wal.public-acquisition-receipt-ledger.v1` value; and
2. one exact artifact declaration containing only `county`, `artifactKind`, and `bytes`, where the
   county is one canonical Washington county name, `artifactKind` is `parcels` or `sales`, and bytes
   is a non-empty `Uint8Array` view no larger than 16 MiB.

Artifact byte length and copying use typed-array internal slots. Caller-defined iterators, species,
or shadow properties cannot substitute bytes or evade the bound. The bytes are snapshotted before
ledger validation and are never emitted in the proof.

The verifier validates the complete protected ledger contract, its canonical 39-row order, receipt
slots, explicit gaps, assertions, and recomputed summary. The selected slot must be present. It then
recomputes the supplied byte length and lowercase SHA-256 digest and fails closed unless both match
the ledger-declared values for the exact county and artifact kind.

A successful result is a deterministic, deeply frozen proof of byte-to-ledger-claim agreement. It
retains a labeled snapshot of the selected row's aggregation-time gaps. In particular,
`artifact_digest_not_recomputed` remains visible as a statement about the source 001C aggregation
layer, while the 001D assertions state that this verifier independently recomputed the digest for
the one selected supplied byte sequence. Neither layer authenticates receipt issuance or the public
source.

## Invariants

- Equivalent byte sequences and equivalent protected receipt ledgers produce equivalent proofs.
- The verifier hashes only the exact visible bytes in the supplied `Uint8Array` view and measures
  length in bytes, not characters.
- Only exact canonical county names and the closed `parcels` / `sales` artifact kinds are accepted.
- The complete receipt ledger must remain deeply immutable, contain all 39 counties exactly once in
  canonical order, and reconcile every protected contract, assertion, receipt slot, explicit gap,
  and summary count.
- The selected county and artifact-kind slot must contain one bounded lowercase SHA-256 receipt
  claim; missing slots and byte-length or digest mismatches fail closed.
- A non-Benton declaration can never select a Benton row or inherit Benton identity.
- Byte agreement never authenticates receipt issuance or source identity and never implies
  acquisition, parsing, freshness, provenance, landing, normalization, runtime registration,
  capability, or launch readiness.
- The result contains no artifact bytes and is deeply immutable; caller mutations cannot alter it.

## Denials

- no HTTP, browser, network, filesystem, archive, database, or acquisition transport;
- no source-authenticity, issuance-authentication, provenance, acquisition-time, or freshness claim;
- no decoding, CSV parsing, schema validation, normalization, row-count, quality, or semantic-content
  inference;
- no staging, quarantine, landing, persistence, runtime registration, capability, or readiness claim;
- no county aliases, cross-county or cross-kind matching, Benton substitution, or missing-slot pass;
- no credentials, secrets, PACS, protected data, external write, deployment, or production action;
- no file, contract, or environment outside the three exact reservations.

## Validation

- `node --check scripts/truth/wal-public-acquisition-artifact-verification.mjs`
- `node --check scripts/truth/wal-public-acquisition-artifact-verification.test.mjs`
- `node --test scripts/truth/wal-public-acquisition-artifact-verification.test.mjs`
- `node --test scripts/truth/wal-public-acquisition-artifact-receipt.test.mjs scripts/truth/wal-public-acquisition-receipt-ledger.test.mjs`
- exact length and SHA-256 matches for parcel and sales slots, including non-ASCII and sliced views;
- typed-array iterator and shadowed-byte-length bypass regressions;
- deterministic output, defensive snapshot, deep immutability, and explicit layered-gap retention;
- independent length/digest mismatch, missing-slot, county alias, cross-kind, and Benton-substitution
  refusals;
- malformed, contradictory, sparse, accessor-backed, expanded, mutable, or summary-inconsistent
  receipt-ledger refusals;
- explicit negative assertions for authenticity, acquisition, parsing, freshness, landing, runtime,
  capability, and launch truth;
- source review proving no filesystem, network, persistence, database, live-data, or CLI surface;
- `git diff --check` and exact three-path audit.

## Completion boundary

This child completed on protected `main` in PR `#1504` as
`9b1379a5dc1112bba3d836fd4f38dcba254c132b`; the protected merge contains reviewed fix
`d1dcc7f2c1ed8bd0104890d2081b550b040c34b1` and updated integrated head
`07d5737cf49be7010d8a94e31a20572987c2ffa3`. That proves the narrow terminal condition for supplied
in-memory artifact bytes only. The broad `WO-WAL-001` parent remains open. The next exact child is
registered only through protected [`WO-WAL-000E`](WO-WAL-000E-d-wave-reconciliation-and-e-wave-reservations.md).
