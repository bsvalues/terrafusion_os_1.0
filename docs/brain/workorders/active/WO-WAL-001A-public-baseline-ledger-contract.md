# WO-WAL-001A — Public Baseline Ledger Contract

| Field | Value |
| --- | --- |
| Status | `ACTIVE` |
| Parent | `WO-WAL-001` |
| Program | Washington Assessor Launch V1 |
| Base | `0aba8ff60d09f526b6aa0a8aaf85fd4fc7957778` |
| Risk | R4 bounded public-data truth tooling |
| Contract reservation | `wal.public-baseline-ledger.v1` |
| Environment reservation | `local-temp-only` |

## Objective

Define and implement a deterministic 39-county public-baseline ledger that consumes the existing
Washington coverage proof without converting source discovery or acquisition readiness into claims
of landed data, runtime registration, freshness, provenance, or launch capability.

This child is a contract/tooling slice only. It does not acquire data or complete the parent Work
Order's runtime outcome.

## Exact Reservations

Only these repository-relative paths may change:

- `docs/brain/workorders/active/WO-WAL-001A-public-baseline-ledger-contract.md`
- `scripts/truth/wal-public-baseline-ledger.mjs`
- `scripts/truth/wal-public-baseline-ledger.test.mjs`

Reserved contract: `wal.public-baseline-ledger.v1`.

Reserved environment: `local-temp-only`. Validation may read repository fixtures and write temporary
files under the operating system's temporary directory. It may not use live network access, a
database, county credentials, or committed generated evidence.

## Input and Output Contract

The default input is
`os-platform/core/pilot/evidence/washington-39-county-coverage.latest.json`. The tool may also accept
an explicit local JSON input path for fixture-driven validation.

The output is canonical UTF-8 JSON with one trailing newline and exactly one row for each of the 39
expected Washington counties, in canonical county order. Each row keeps these state families
separate:

1. source inventory and acquisition readiness copied from the existing proof;
2. landed parcel/sales row evidence;
3. parcel/sales runtime-registration evidence;
4. freshness and provenance evidence;
5. explicit source/data/runtime gaps;
6. silent Benton-fallback evidence.

Because this child consumes source-registry evidence only, every runtime-dependent field starts in an
explicit `not_observed` or zero state. A row marked `adapter-ready`, with a source URL, or with a known
acquisition family remains unlanded and runtime-unregistered until another evidence source proves
otherwise.

## Invariants

- The input must contain all and only the canonical 39 Washington counties.
- Duplicate, missing, or unexpected county rows fail closed.
- Output ordering and bytes are stable for equivalent input.
- Source inventory/acquisition readiness never implies landed rows, runtime registration, freshness,
  provenance completeness, or launch capability.
- A non-Benton county can never inherit Benton source or runtime evidence.
- Missing observations are explicit gaps, not fabricated zero-risk readiness.
- The tool performs no network or database access and writes only to stdout or an explicitly selected
  local output path.

## Denials

- no live public-source probing or scraping;
- no county, PACS, SQL, credential, secret, or protected-data access;
- no data ingestion, normalization, staging, promotion, quarantine, or rollback;
- no runtime endpoint probing or runtime-readiness certification;
- no inference from `adapter-ready`, source-found, or acquisition-family metadata to landed/runtime
  state;
- no Benton fallback, demo-row substitution, or seeded county counts presented as observed runtime;
- no database, backend, frontend, package, lockfile, workflow, deployment, or production change;
- no committed file under `generated/**`.

## Validation

- `node --test scripts/truth/wal-public-baseline-ledger.test.mjs`
- `node scripts/truth/wal-public-baseline-ledger.mjs > <temporary-output>`
- verify exactly 39 rows and deterministic bytes across repeated executions;
- adversarial duplicate-county, missing-county, unexpected-county, readiness-inference, and Benton-
  fallback tests;
- `git diff --check`;
- changed-path audit proving only the three exact reservations changed.

## Completion

This child is complete when the deterministic ledger contract and focused tests pass. Its output is a
truthful starting ledger for later WO-WAL-001 acquisition/runtime children; it is not evidence that
WO-WAL-001's terminal condition has been reached.
