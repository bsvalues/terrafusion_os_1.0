# WO-SR-005D-C2 - Dossier Evidence Registry Read Contract Decomposition

## Verdict

`IMPLEMENTATION_READY_READ_ONLY_WITHOUT_RUNTIME_ADOPTION`

The smallest coherent Dossier contract is `dossier.evidence-registry-read@1.0.0`, a
provider-neutral, county/parcel-scoped list projection over persistent evidence records. It does not
authorize registration, custody mutation, retention, runtime adoption, persistence, extraction,
publication, or destination product source.

## Exact Source Reconciliation

| Surface | Exact evidence | Contract consequence |
| --- | --- | --- |
| Domain ownership | `brain/packs/dossier/README.md:5-49` | Dossier owns evidence records and custody; Forge values, Dais workflows, Atlas geometry, and OS composition stay excluded. |
| Evidence entity | `backend/src/TerraFusion.Core/Entities/DossierEvidence.cs:5-42` | Stable evidence ID, parcel, type, integrity, optional document link, county, and creation time are available; title and creator identity are excluded. |
| Registry read endpoint | `backend/src/TerraFusion.API/Controllers/DossierController.cs:1855-1899` | The bounded source is an authenticated county/parcel list with limit, offset, total, and has-more semantics. |
| County and parcel guards | `backend/src/TerraFusion.API/Controllers/DossierController.cs:163-166`, `:1862-1876` | Parcel syntax is validated and the query includes both parcel and resolved county. No development county fallback enters the contract. |
| Pagination normalization | `backend/src/TerraFusion.API/Controllers/DossierController.cs:2268-2279` | Current defaults are limit 50, maximum 100, and offset 0; the contract makes accepted ranges explicit instead of inheriting silent normalization. |
| Ordering | `backend/src/TerraFusion.API/Controllers/DossierController.cs:1873-1892` | Source orders by creation time descending but lacks an ID tie-break; adapter parity remains unproven until deterministic tie-breaking is implemented and tested. |
| Existing read tests | `backend/tests/TerraFusion.Unit.Tests/R1Week5/R1Week5CxR1ClosureTests.cs:5409-5469` | Tests prove found/not-found and same-parcel listing but not cross-county list denial, pagination edges, deterministic ties, enum closure, or privacy projection. |
| Custody mutation and chain | `backend/src/TerraFusion.API/Controllers/DossierController.cs:1902-2030` | Actions, actor, notes, hashes, and integrity mutation remain outside the first contract. |
| Frozen contracts | `backend/src/TerraFusion.Abstractions/contracts.freeze.json`, `CONTRACTS.md` | Dossier is an allowed consumer but no `dossier.*` group is frozen. |
| Standalone Dossier | `bsvalues/terrafusion-dossier` `main` at `b211387b7ba3653d901b6223900710b2012395d6` | The private bootstrap consumes only `crosscut.audit@1.0.0`; no Dossier domain contract or adapter exists. |

The sovereign audit is pinned to `20a4dadce990b2babd458e2873143b9a6085ecec`. No county data,
provider, SQL, live service, secret, or quarantined source was accessed.

## Exact Contract Records

| Record | Required fields | Optional fields |
| --- | --- | --- |
| `DossierEvidenceRegistryReadRequest` | `schemaVersion`, `countyId`, `parcelId`, `limit`, `offset` | `traceId` |
| `DossierEvidenceRegistryReadResult` | `schemaVersion`, `countyId`, `parcelId`, `results`, `total`, `hasMore`, `limit`, `offset` | `traceId` |
| `DossierEvidenceRegistryRecord` | `evidenceId`, `evidenceType`, `integrity`, `createdAt` | `documentId` |

Identifiers are non-empty canonical strings. `evidenceId` and `documentId` are lowercase canonical
UUID strings. Timestamps are RFC 3339 UTC values. `limit` is 1 through 100; `offset` and `total` are
non-negative integers. `hasMore` must equal `offset + results.length < total`.

The result `countyId` and `parcelId` must exactly match the request. Every record is treated as
belonging to that selector; adapters must reject rather than filter records from another selector.
Empty results are valid and must never be replaced with fixture or fallback truth.

## Closed Vocabulary

- `evidenceType`: `field-inspection`, `valuation-record`, `legal-document`, `tax-record`,
  `correspondence`, `photo`.
- `integrity`: `pending`, `verified`, `disputed`.
- Unknown values fail closed. Vocabulary changes are major-version changes unless a future
  negotiated capability explicitly defines forward-compatible handling.

`valuation-record` classifies evidence; it grants no Forge valuation data or computation ownership.

## Ordering, Identity, And Privacy

- Results sort by `createdAt` descending, then `evidenceId` ascending as a deterministic tie-break.
- Duplicate `evidenceId` values, malformed IDs, selector mismatch, count inconsistency, and unstable
  ordering fail closed.
- Exclude title, creator identity, document metadata/content, actor, notes, chain length, custody
  hashes, retention, storage paths, valuation data, levies, geometry, workflow state, provider
  details, credentials, persistence keys, and auth claims.
- `traceId` is correlation only and does not transfer audit persistence ownership.

## Compatibility And Deprecation

- Patch: documentation and annotations only.
- Minor: additive optional fields that do not weaken county, selector, privacy, vocabulary, ordering,
  or read-only semantics.
- Major: required-field, county/parcel key, pagination, enum, ordering, identity, privacy, ownership,
  or write-semantics changes.
- Major changes require one release of deprecation evidence. Consumers reject unknown vocabulary
  until they explicitly support the new major contract.

## Synthetic Fixture Corpus

| Fixture | Expected result |
| --- | --- |
| `two-record-page` | Accept deterministic newest-first records with ID tie-break. |
| `empty-page` | Accept empty results with zero total and `hasMore=false`. |
| `next-page` | Accept a bounded page with consistent total and `hasMore=true`. |
| `county-mismatch` | Reject a result from a different county. |
| `parcel-mismatch` | Reject a result for a different parcel. |
| `unknown-evidence-type` | Reject an unknown evidence classification. |
| `unknown-integrity` | Reject an unknown integrity state. |
| `duplicate-evidence-id` | Reject duplicate identity. |
| `unstable-tie-order` | Reject equal timestamps without ascending evidence-ID order. |
| `pagination-inconsistent` | Reject invalid ranges, counts, totals, or `hasMore`. |
| `cross-lane-fields` | Reject title, creator, custody, value, levy, geometry, workflow, and provider fields. |

Sovereign and standalone verifiers must consume the same hash-pinned corpus and agree on every
accept/reject result before adapter or extraction work is admitted.

## Exact Implementation Slice

`WO-SR-005D-I` may modify only:

- `backend/src/TerraFusion.Abstractions/DTOs/DossierEvidenceRegistryReadDto.cs`
- `backend/src/TerraFusion.Abstractions/contracts/dossier.evidence-registry-read.v1.schema.json`
- `backend/src/TerraFusion.Abstractions/contracts/fixtures/dossier.evidence-registry-read.v1.*.synthetic.json`
- `backend/src/TerraFusion.Abstractions/contracts.freeze.json`
- `backend/src/TerraFusion.Abstractions/CONTRACTS.md`
- `scripts/contracts/verify-contract-freeze.mjs`
- `scripts/contracts/verify-contract-freeze.test.mjs`
- bounded `docs/brain/workorders/**` evidence and routing files.

Controllers, entities, services, persistence, product tests, adapters, destination source, packages,
lockfiles, workflows, and runtime consumers remain blocked. The source ordering gap is recorded, not
silently claimed as closed.

## Validation

- Exact source and test reconciliation: `PASS`.
- County, selector, pagination, ordering, vocabulary, privacy, and cross-lane decomposition: `PASS`.
- Compatibility and fixture design: `PASS`.
- Existing adapter parity: `NOT PROVEN`; deterministic tie-break and privacy projection are gaps.
- Runtime, product, package, workflow, deployment, and protected-resource changes: `NONE`.

## Next

`WO-SR-005D-I - Dossier Evidence Registry Read Contract Implementation and Freeze` is
implementation-ready but remains proposed until explicit authority covers its exact non-core source
paths. `WO-SR-005E-P - GPT Governed-AI Contract and Grounding Gate Preparation` is admitted as the
next read-only portfolio slice. Runtime adoption, extraction, publication, and cutover remain blocked.
