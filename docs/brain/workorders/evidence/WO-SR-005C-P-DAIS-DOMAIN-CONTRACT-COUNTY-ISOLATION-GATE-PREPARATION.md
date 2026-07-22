# WO-SR-005C-P - Dais Domain Contract and County-Isolation Gate Preparation

## Verdict

`COMPLETE_DECOMPOSITION_REQUIRED_APPEAL_COHORT_SELECTED`

Dais has real county-scoped workflow source and tests, but the sovereign contract freeze contains no
Dais domain group. The smallest coherent next slice is an appeal-workflow contract decomposition.
Direct extraction, contract implementation, and runtime adoption remain blocked.

## Audit Basis

| Surface | Exact live evidence | Classification |
| --- | --- | --- |
| Dais authority | `brain/packs/dais/README.md:5-42` | Dais owns appeal/workflow state; county-scoped persistence must filter by `CountyId`; Forge valuation, Atlas geometry, Dossier custody, and shell composition are excluded. |
| County boundary | `backend/src/TerraFusion.API/Controllers/DaisController.cs:15-22`, `:57-157` | Authenticated sovereign API resolves county claims, denies missing/mismatched county context, and remains an OS host rather than suite source. |
| Appeal API | `backend/src/TerraFusion.API/Controllers/DaisController.cs:970-1078`, `:2047-2053` | Create/read/update endpoints expose a bounded appeal lifecycle but are coupled to API hosting, user context, audit, and persistence services. |
| Appeal entity | `backend/src/TerraFusion.Core/Entities/Appeal.cs:5-53` | Explicit Dais write-lane owner and `CountyId`; also contains petitioner PII, value references, decision notes, and persistence/audit fields that require contract decomposition. |
| Appeal service | `backend/src/TerraFusion.Core/Services/AppealService.cs:8-24`, `:52-77`, `:80-124` | Stable command/interface concepts and county-filtered reads/mutations; implementation remains sovereign. |
| Other Dais entities | `backend/src/TerraFusion.Core/Entities/Exemption.cs:5-55`, `CertificationStep.cs:5-48`, `Notice.cs:5-55`, `QueueItem.cs:5-55` | Genuine Dais cohorts, but each adds statutory, PII, delivery, certification, or queue semantics; defer until the first appeal contract proves the pattern. |
| Persistence keys | `backend/src/TerraFusion.Data/Configurations/AppealConfiguration.cs:27-35`, `ExemptionConfiguration.cs:27-35`, `CertificationStepConfiguration.cs:23-35`, `NoticeConfiguration.cs:26-34` | County foreign keys and county-leading indexes are explicit. |
| Cross-county proof | `backend/tests/TerraFusion.Integration.Tests/Phase40/DaisCountyIsolationTests.cs:1-10`, `:65-136`, `:138-218`, `:221-297` | Synthetic two-county tests prove appeal read/update denial and isolation across exemption, certification, notice, and queue cohorts. |
| Persistence proof | `backend/tests/TerraFusion.Integration.Tests/Phase40/DaisWorkflowPersistenceTests.cs:1-10`, `:67-153` | In-memory EF proof covers lifecycle round trips and county-scoped service behavior without external resources. |
| Endpoint/audit proof | `backend/tests/TerraFusion.Unit.Tests/Stage2/DaisEndpointContractTests.cs:29-30`, `:47-54`, `:123-172`, `:175-254` | Synthetic claims prove 201 creation, cross-county non-leak, and governed audit emission. |
| Cross-lane proof | `backend/tests/TerraFusion.Unit.Tests/Stage2/AppealWriteLaneGuardTests.cs:20-61` | Appeal dependencies exclude Forge valuation and Dossier custody writers while requiring governed audit. |
| Frozen contract state | `backend/src/TerraFusion.Abstractions/contracts.freeze.json` | Contains Forge, Atlas, and cross-cutting groups only; no `dais.*` contract or package exists. |
| Standalone Dais | `D:\terrafusion-dais` at `1404db1947587d4f8c868092798c4d71c23bb62d` | Private clean bootstrap consumes only `crosscut.audit@1.0.0`; it contains no product source or Dais domain contract. |

The sovereign audit is pinned to `26c8eae1ef9c2b397cfa731dc6505a54dd62a822`. Quarantined
sources and `packages/terra-levy/**` / `packages/terra-permit/**` are not contract authority: they mix
provider, runtime, deployment, AI, PACS, statutory, UI, and legacy application concerns.

## Selected Contract Cohort

The next Work Order should decompose `dais.appeal-workflow@1.0.0`, not the entire Dais estate.

- Required identity/context candidates: `countyId`, `appealId`, `parcelId`, `taxYear`.
- Lifecycle candidates: appeal ground, status, filed/hearing/decision timestamps.
- Value fields must be classified as read-only Forge references, never Dais valuation computation.
- Petitioner identity and free-text decision notes require explicit PII/redaction treatment and must
  not enter a general suite contract by accident.
- Audit persistence remains cross-cutting; the Dais contract may require trace correlation but must
  not redefine audit storage.
- The API controller, EF entities/configuration, authentication, and persistence implementation stay
  sovereign and are not contract artifacts.

## County-Isolation Contract

1. `countyId` is mandatory on every request, result, command, and event envelope.
2. Missing or malformed county context fails closed.
3. A requested or returned county mismatch is rejected, never filtered client-side or downgraded.
4. Lookup and mutation identity is `(countyId, appealId)`; parcel queries are
   `(countyId, parcelId)`.
5. Synthetic fixtures use invented counties and parcels only.
6. No default county, Benton-specific behavior, county SQL, PACS access, or live data is permitted.

## Compatibility And Deprecation

- Patch: documentation or annotations only.
- Minor: additive optional fields that do not weaken county, ownership, PII, or lifecycle semantics.
- Major: required-field, county-key, lifecycle enum, value-reference, PII, ownership, or event
  semantics change.
- Major changes require one release of deprecation evidence; unknown lifecycle values fail closed.

## Synthetic Fixture Plan

| Fixture | Required assertion |
| --- | --- |
| `filed-appeal` | Matching county and parcel produce a minimal filed lifecycle record. |
| `decided-appeal` | Decision state and optional value reference remain explicit without valuation computation. |
| `county-mismatch` | Consumer rejects a foreign-county result. |
| `missing-county` | Request fails contract validation. |
| `foreign-county-update` | Mutation is denied without revealing record existence. |
| `invalid-status` | Unknown lifecycle state fails closed. |
| `pii-and-cross-lane-fields` | Schema rejects petitioner PII, documents, geometry, provider details, and valuation-model fields unless explicitly classified. |

## Adapter And Parity Gate

- A later sovereign adapter may project validated appeal workflow data into the frozen contract but
  remains unwired until separately authorized.
- Sovereign and standalone verifiers must consume the same hash-pinned synthetic fixture corpus.
- Required parity covers schema acceptance/rejection, county mismatch, lifecycle values, omission of
  PII/cross-lane fields, and byte-identical frozen contract artifacts.
- Standalone Dais required checks remain `suite-ci`, `contract-compat`, and `governance-gate`.

## Non-Claims

- No source, contract artifact, runtime, package, workflow, database, county/PACS/SQL data, secret,
  provider, deployment, or production resource changed.
- Existing in-memory tests prove current source behavior, not a frozen cross-repository contract.
- Certification, exemption, notice, queue, Levy, permit, and frontend extraction remain blocked.

## Next

`WO-SR-005C-C - Dais Appeal Workflow Contract Decomposition` is admitted as a docs/evidence-only R2
slice. It must define exact records, fields, PII/value-reference treatment, enums, schemas, fixtures,
and the later implementation allowlist before any contract file or destination source changes.
