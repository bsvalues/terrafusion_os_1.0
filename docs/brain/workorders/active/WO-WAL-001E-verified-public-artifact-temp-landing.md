# WO-WAL-001E — Verified Public Artifact Temp Landing

| Field | Value |
| --- | --- |
| Status | `IMPLEMENTED_PENDING_PROTECTED_REVIEW` |
| Parent | `WO-WAL-001` |
| Program | Washington Assessor Launch V1 |
| Base | `984018696738e437c91e5d197899e29e3867a2fd` |
| Risk | R3 bounded local-temporary filesystem write |
| Contract reservation | `wal.public-acquisition-artifact-landing.v1` |
| Environment reservation | `local-temp-public-artifact-landing-only` |
| Terminal condition | `VERIFIED_PUBLIC_ARTIFACT_BYTES_ATOMIC_TEMP_LANDING_RECEIPT_PROVEN` |

## Objective

Consume one complete, deeply immutable `wal.public-acquisition-artifact-verification.v1` proof,
independently bind it to one bounded caller-supplied byte sequence, and atomically publish those
bytes inside a unique direct child of Node's resolved host temporary directory. Return a deeply
immutable receipt that records the exact byte identity and the temporary landing observation
without promoting 001D's structural claim into source authenticity, acquisition, permanent
storage, parsing, runtime registration, capability, or launch truth.

This child lands one already-verified public artifact only. It does not complete the open
`WO-WAL-001` parent.

## Exact reservations

Only these repository-relative paths may change:

- `docs/brain/workorders/active/WO-WAL-001E-verified-public-artifact-temp-landing.md`
- `scripts/truth/wal-public-acquisition-artifact-landing.mjs`
- `scripts/truth/wal-public-acquisition-artifact-landing.test.mjs`

The contract is `wal.public-acquisition-artifact-landing.v1`; the environment is
`local-temp-public-artifact-landing-only`. The implementation accepts no caller-supplied path,
filename, filesystem adapter, network client, credential, runtime, or persistence target.

## Contract

`landVerifiedPublicAcquisitionArtifactToTemp` accepts exactly `verificationProof` and `artifact`.
The artifact accepts exactly canonical `county`, `artifactKind` (`parcels` or `sales`), and one
non-empty `Uint8Array` view no larger than the protected 16 MiB limit.

Before its first asynchronous filesystem operation, the implementation snapshots validated own
data descriptors, requires and validates the complete deeply frozen 001D proof, copies the exact
visible byte view through captured typed-array intrinsics, and independently recomputes bounded
byte length and SHA-256. County, kind, recomputed and ledger-declared length, and both proof hashes
must all agree.

The implementation resolves Node's configured temp directory to a real path, creates one unique
direct child, requests directory mode `0700`, and exclusively creates an internal staging file with
requested mode `0600`. It writes the byte snapshot, calls file-handle `sync`, and checks the staging
entry against the original file handle. A same-directory hard link publishes the fixed derived
final name with atomic no-replace semantics. After publication, the bytes are re-read and rehashed
through the original handle; the staging name is then removed and final regular-file identity is
checked again.

Hard-link publication is intentionally fail-closed. There is no weaker rename or copy fallback on
a filesystem that does not support the required operation. On failure, only the exact staging and
final paths and the exact unique directory are cleaned up, without recursive deletion. A successful
receipt leaves the file and directory in place and sets `cleanupRequired: true`; authorized callers
must later unlink that exact artifact path and remove that exact now-empty directory.

## Invariants and limits

- Caller bytes are snapshotted before any `await`; later caller mutation cannot change the landing.
- Only a full frozen 001D proof with exact protected assertions and layered gaps is accepted.
- The final name is derived from the canonical county token and artifact kind, never caller input.
- Publication never silently replaces a pre-existing final entry.
- Receipt content identity is deterministic for equivalent proof and bytes; unique temporary paths
  are intentionally nondeterministic.
- The receipt is deeply frozen and contains no artifact bytes.
- `sync` completion is recorded, but directory-entry crash durability and permanent persistence are
  not established.
- `os.tmpdir()` is host configured; the physical locality of the backing storage is not attested.
- Node exposes no directory-handle-relative `openat`/`linkat` surface here. Same-account adversarial
  path-component race resistance is therefore not proven, even though symlink entries are refused
  when observed and inode/device identity is checked where exposed.
- POSIX owner-only mode bits are observed on POSIX. Windows records requested modes only and makes
  no ACL equivalence claim.
- The receipt does not guarantee post-return file presence or immutability and automates cleanup
  only on failure.

## Denials

- no HTTP, browser, network, archive, database, acquisition transport, credential, or live data;
- no caller destination, filename, filesystem implementation, overwrite, recursive cleanup, or
  permanent storage target;
- no receipt-issuance authentication, source authenticity, provenance, acquisition time, freshness,
  physical-locality, or crash-durability claim;
- no decoding, parsing, schema validation, normalization, row-count, quality, or semantic inference;
- no runtime registration, capability, readiness, protected data, external system, deployment, or
  production action;
- no file, contract, or environment outside the three exact reservations.

## Validation

- `node --check scripts/truth/wal-public-acquisition-artifact-landing.mjs`
- `node --check scripts/truth/wal-public-acquisition-artifact-landing.test.mjs`
- `node --test scripts/truth/wal-public-acquisition-artifact-landing.test.mjs`
- protected `WO-WAL-001A` through `WO-WAL-001D` compatibility tests;
- success for parcel and sales slots, sliced and multibyte byte views, exact receipt identity,
  unique directories, atomic final publication, permissions where portable, and caller mutation;
- fail-closed malformed/mutable/accessor/proxy-substituted proof, byte/hash/length/county/kind,
  unbounded input, caller path/adapter injection, and prototype-tampering regressions;
- exact cleanup on successful test use and refusal-source review for network, recursive deletion,
  overwrite rename, caller path, runtime, and persistence surfaces;
- `git diff --check` and exact three-path audit.

## Completion boundary

This Work Order is implemented only on its isolated branch until protected review and merge. Its
narrow terminal proves a bounded observed temporary landing receipt, not public-source authenticity,
durable storage, parsed rows, normalized data, runtime integration, capability, launch readiness,
or completion of `WO-WAL-001`.
