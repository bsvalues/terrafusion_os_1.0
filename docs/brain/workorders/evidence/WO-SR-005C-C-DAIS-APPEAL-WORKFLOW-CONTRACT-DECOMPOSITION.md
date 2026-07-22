# WO-SR-005C-C - Dais Appeal Workflow Contract Decomposition

## Verdict

`IMPLEMENTATION_READY_READ_ONLY_WITHOUT_RUNTIME_ADOPTION`

The smallest safe Dais contract is `dais.appeal-workflow@1.0.0`, a provider-neutral, county-scoped,
read-only lifecycle projection. The first version does not authorize create/update commands, runtime
adoption, persistence, extraction, publication, or destination product source.

## Source Reconciliation

| Surface | Exact evidence | Contract consequence |
| --- | --- | --- |
| Domain ownership | `brain/packs/dais/README.md:5-42` | Dais owns appeal workflow state; Forge valuation, Atlas geometry, Dossier custody, and shell composition stay excluded. |
| County boundary | `backend/src/TerraFusion.API/Controllers/DaisController.cs:15-22`, `:57-157` | County identity is mandatory and mismatches fail closed. Authentication and claim resolution stay outside the contract. |
| Appeal API | `backend/src/TerraFusion.API/Controllers/DaisController.cs:970-1078`, `:2047-2053` | Read concepts are stable; controller hosting and mutation endpoints are not contract artifacts. |
| Appeal entity | `backend/src/TerraFusion.Core/Entities/Appeal.cs:5-53` | Identity and lifecycle fields are reusable; petitioner PII, monetary values, notes, and persistence metadata are excluded. |
| County-scoped service | `backend/src/TerraFusion.Core/Services/AppealService.cs:8-24`, `:52-77`, `:80-124` | Queries remain keyed by county; service implementations and mutation commands stay sovereign. |
| Isolation proof | `backend/tests/TerraFusion.Integration.Tests/Phase40/DaisCountyIsolationTests.cs:1-10`, `:65-136`, `:138-218`, `:221-297` | Cross-county reads and updates must fail without disclosing record existence. |
| Endpoint and audit proof | `backend/tests/TerraFusion.Unit.Tests/Stage2/DaisEndpointContractTests.cs:29-30`, `:47-54`, `:123-172`, `:175-254` | Trace correlation may cross the boundary; audit storage and user identity do not. |
| Write-lane guard | `backend/tests/TerraFusion.Unit.Tests/Stage2/AppealWriteLaneGuardTests.cs:20-61` | The contract cannot grant Forge or Dossier write ownership. |

## Exact Contract Records

| Record | Required fields | Optional fields |
| --- | --- | --- |
| `DaisAppealWorkflowReadRequest` | `schemaVersion`, `countyId`, `selector` | `traceId` |
| `DaisAppealSelector` | exactly one of `appealId`, `parcelId`, or `taxYear` | none |
| `DaisAppealWorkflowReadResult` | `schemaVersion`, `countyId`, `appeals` | `traceId` |
| `DaisAppealWorkflowRecord` | `appealId`, `parcelId`, `taxYear`, `ground`, `status`, `filedAt` | `hearingAt`, `decisionAt` |

All identifiers are non-empty strings. `taxYear` is an integer from 1900 through 2200. Timestamps
are RFC 3339 UTC values. A result county must exactly match the request county. `appeals` may be
empty and must never be replaced with fixture or fallback truth.

## Closed Vocabulary

- `ground`: `MARKET_VALUE`, `UNIFORMITY`, `CLASSIFICATION`, `EXEMPTION_DENIAL`,
  `CLERICAL_ERROR`.
- `status`: `filed`, `scheduled`, `heard`, `decided`, `withdrawn`.
- Unknown values fail closed. Additions require a major version unless a future negotiated
  capability explicitly defines forward-compatible handling.

## Ownership And Exclusions

- Exclude petitioner name and contact data, current/requested/decided monetary values, decision
  notes, documents, geometry, provider details, credentials, persistence keys, and created/updated
  user fields.
- Dais does not compute valuation or own evidence custody through this contract.
- `traceId` is correlation only. It does not redefine cross-cutting audit persistence.
- No default county, Benton-specific behavior, PACS query, SQL identity, auth claim, or provider
  configuration enters the schema.
- Write commands and events require a separate later contract and authority gate.

## Compatibility And Deprecation

- Patch: documentation and annotations only.
- Minor: additive optional fields that do not weaken county, selector, ownership, privacy, or
  lifecycle semantics.
- Major: required-field, selector, county-key, enum, timestamp, privacy, ownership, or write
  semantics changes.
- Major changes require one release of deprecation evidence. Consumers reject unknown enum values
  until they explicitly support the new major contract.

## Synthetic Fixture Corpus

| Fixture | Expected result |
| --- | --- |
| `filed-by-parcel` | Accept one filed appeal selected by parcel. |
| `decided-by-id` | Accept hearing and decision timestamps selected by appeal ID. |
| `empty-by-tax-year` | Accept an empty county-matched result. |
| `county-mismatch` | Reject a result from a different county. |
| `missing-county` | Reject request or result without county identity. |
| `invalid-status` | Reject an unknown lifecycle value. |
| `cross-lane-fields` | Reject PII, value, notes, documents, geometry, and provider fields. |
| `ambiguous-selector` | Reject zero or multiple selector members. |

The sovereign and standalone verifiers must consume the same hash-pinned corpus and agree on every
accept/reject result before adapter or extraction work is admitted.

## Exact Implementation Slice

`WO-SR-005C-I` may modify only:

- `backend/src/TerraFusion.Abstractions/DTOs/DaisAppealWorkflowDto.cs`
- `backend/src/TerraFusion.Abstractions/contracts/dais.appeal-workflow.v1.schema.json`
- `backend/src/TerraFusion.Abstractions/contracts/fixtures/dais.appeal-workflow.v1.*.synthetic.json`
- `backend/src/TerraFusion.Abstractions/contracts.freeze.json`
- `backend/src/TerraFusion.Abstractions/CONTRACTS.md`
- `scripts/contracts/verify-contract-freeze.mjs`
- `scripts/contracts/verify-contract-freeze.test.mjs`
- bounded `docs/brain/workorders/**` evidence and routing files.

Controllers, services, entities, persistence, API behavior, runtime consumers, product tests,
destination source, packages, lockfiles, and workflows remain blocked.

## Validation

- Exact source and test reconciliation: PASS.
- County, selector, lifecycle, privacy, and cross-lane decomposition: PASS.
- Compatibility and fixture design: PASS.
- Runtime, product, package, workflow, deployment, and protected-resource changes: none.

## Next

`WO-SR-005C-I - Dais Appeal Workflow Contract Implementation and Freeze` is admitted as an R3
bounded contract-artifact slice. It may implement and hash-freeze this read-only contract only;
runtime adoption, adapter work, extraction, publication, and cutover remain separately blocked.
