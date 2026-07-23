# WO-SR-005C-A - Dais Appeal Workflow Adapter and Standalone Parity Preparation

## Verdict

`IMPLEMENTATION_READY_AS_TWO_REPOSITORY_SEQUENCE`

The frozen `dais.appeal-workflow@1.0.0` contract can be adopted by two bounded, sequential R3
slices without source extraction, runtime wiring, database access, or protected data:

1. `WO-SR-005C-E1` implements a pure unwired sovereign adapter from an already-materialized,
   county-scoped appeal collection to the frozen contract.
2. `WO-SR-005C-E2` materializes the hash-pinned contract and synthetic corpus in
   `bsvalues/terrafusion-dais` and proves standalone validation and projection parity.

Dais source extraction and runtime adoption remain blocked after both slices.

## Inspection Basis

| Surface | Exact revision | Result |
| --- | --- | --- |
| Sovereign base | `e57b1eca9c3291d10203efaa1fd586bcbce13f94` | Frozen Dais contract and canonical appeal source present |
| Standalone Dais | `1404db1947587d4f8c868092798c4d71c23bb62d` | Private bootstrap only; no product source extracted |
| Standalone required checks | Live branch protection | `suite-ci`, `contract-compat`, `governance-gate`; strict and admin-enforced |

The standalone contract declaration still identifies only `crosscut.audit@1.0.0` and an older
sovereign freeze SHA. Correcting that declaration belongs to E2, not this read-only preparation.

## Canonical Source Findings

### Exact source proof

| Proof | Live source |
| --- | --- |
| County-scoped ID lookup | `backend/src/TerraFusion.Core/Services/AppealService.cs:73-78` |
| County-scoped parcel lookup | `backend/src/TerraFusion.Core/Services/AppealService.cs:80-86` |
| County-scoped tax-year lookup | `backend/src/TerraFusion.Core/Services/AppealService.cs:118-124` |
| Cross-lane persistence fields | `backend/src/TerraFusion.Core/Entities/Appeal.cs:27-53` |
| Authenticated county-resolved raw reads | `backend/src/TerraFusion.API/Controllers/DaisController.cs:997-1051` |
| ID county-isolation test | `backend/tests/TerraFusion.Unit.Tests/Stage2/AppealServiceTests.cs:82-108` |
| Parcel county-isolation test | `backend/tests/TerraFusion.Unit.Tests/Stage2/AppealServiceTests.cs:111-146` |
| Tax-year county-filter test | `backend/tests/TerraFusion.Unit.Tests/Stage2/AppealServiceTests.cs:180-214` |
| Same parcel across counties | `backend/tests/TerraFusion.Integration.Tests/Phase40/DaisCountyIsolationTests.cs:65-107` |
| Unauthorized and list non-leak proof | `backend/tests/TerraFusion.Unit.Tests/Stage2/DaisEndpointContractTests.cs:149-172,297-366` |

### Accepted read boundary

`AppealService` is the canonical read source for this preparation:

- `GetByIdAsync` filters by both appeal ID and `CountyId`.
- `GetByParcelIdAsync` filters by parcel ID and `CountyId`.
- `GetByTaxYearAsync` filters by tax year and `CountyId`.
- Existing Stage 2 and Phase 40 tests prove same-parcel cross-county isolation, county-filtered
  lists, tax-year filtering, empty truth, and unauthorized non-leak behavior.

E1 must receive already-materialized `IReadOnlyList<Appeal>` input. It must not call
`IAppealService`, resolve claims, query `TerraFusionDbContext`, or perform persistence work.

### Rejected raw entity/API boundary

The authenticated Dais controller resolves county context correctly, but its current read endpoints
return the persistence `Appeal` entity. That entity includes fields forbidden from the frozen suite
contract:

- petitioner name;
- assessed and requested values;
- decision notes;
- internal audit timestamps and users; and
- persistence identity and navigation concerns beyond the contract.

The raw controller response is therefore not a contract-safe suite boundary. This preparation does
not change the controller or reinterpret its response as parity proof.

## Exact Adapter Boundary

Proposed API:

```text
DaisAppealWorkflowReadAdapter.Map(
  DaisAppealWorkflowReadRequest request,
  IReadOnlyList<Appeal> source)
  -> DaisAppealWorkflowReadResult
```

The adapter is a pure static transformation with no DI registration or runtime consumer.

| Contract field | Canonical input / rule | Fail-closed rule |
| --- | --- | --- |
| request `schemaVersion` | literal `1.0.0` | reject any other value |
| request `countyId` | canonical `D` GUID | reject invalid or non-canonical identity |
| selector | exactly one of appeal ID, parcel ID, or tax year | reject zero or multiple selectors |
| result `countyId` | request county ID | reject any source record with another county |
| result `traceId` | preserve request value when present | never synthesize |
| `appealId` | `Appeal.Id.ToString("D")` | reject mismatch for appeal-ID selector |
| `parcelId` | `Appeal.ParcelId.ToString("D")` | reject mismatch for parcel selector |
| `taxYear` | `Appeal.TaxYear` | reject mismatch for tax-year selector |
| `ground` | closed contract value from `AppealGround` | reject unknown value |
| `status` | closed contract value from `AppealStatus` | reject unknown value |
| `filedAt` | `FiledDate` serialized as UTC | reject non-UTC/invalid value |
| `hearingAt` | optional `HearingDate`, UTC | reject before `filedAt` |
| `decisionAt` | optional `DecisionDate`, UTC | reject before `filedAt` |

The contract defines no list ordering semantic. The adapter preserves source order and makes no
production ordering claim. E1 tests use a fixed synthetic order solely for deterministic parity.

The result must never include petitioner name, assessed value, requested value, decision notes,
audit users/timestamps, provider identifiers, tokens, or persistence metadata.

## WO-SR-005C-E1 - Sovereign Adapter Slice

### Exact files

- `backend/src/TerraFusion.API/Adapters/DaisAppealWorkflowReadAdapter.cs`
- `backend/tests/TerraFusion.Unit.Tests/Dais/DaisAppealWorkflowReadAdapterTests.cs`
- E1 evidence and routing under `docs/brain/workorders/**`

### Required assertions

- valid appeal-ID, parcel-ID, and tax-year requests map field-for-field;
- empty source produces an honest empty result;
- invalid schema version, county identity, selector cardinality, county mismatch, selector mismatch,
  unknown status/ground, invalid UTC timestamp, and impossible date ordering fail closed;
- absent optional timestamps and trace ID remain absent;
- source order is preserved without inventing a contract ordering rule;
- no PII, money, notes, audit, provider, or persistence field crosses the result; and
- no DI, controller, service, database, provider, endpoint, or consumer reference is introduced.

### Validation

- targeted Dais adapter unit tests;
- canonical backend build with zero warnings;
- frozen contract verifier and tests;
- work-order query and tooling tests;
- exact scope inspection and `git diff --check`.

## WO-SR-005C-E2 - Standalone Synthetic Parity Slice

### Exact destination scope

- update `canon/CONTRACT_DEPENDENCY.md` with the exact sovereign freeze SHA and
  `dais.appeal-workflow@1.0.0`;
- materialize the frozen schema, manifest, and nine synthetic fixtures under
  `contract-compat/dais.appeal-workflow.v1/`;
- add `scripts/verify-dais-appeal-workflow.mjs` and its tests;
- update only the existing `contract-compat` job in `.github/workflows/suite-ci.yml`;
- add the E2 Work Order and evidence under `operations/work-orders/` and `operations/evidence/`.

### Required parity assertions

- all three positive fixtures produce the same accepted normalized JSON as the sovereign verifier;
- all six negative fixtures fail for the same semantic reason class;
- selector identity, county isolation, closed vocabularies, UTC timestamps, and date ordering match;
- no petitioner name, money, notes, audit metadata, provider, database, county dataset, secret,
  network, or live-service input is accepted; and
- source and destination contract artifacts match the recorded SHA-256 manifest.

## Provenance, Rollback, And Later Extraction

- Sovereign source remains authoritative throughout E1 and E2.
- E1 rollback is removal of the unwired adapter and tests.
- E2 rollback is removal of the mirrored contract-compat material and restoration of the bootstrap
  declaration/check.
- Neither slice deletes, copies, or retires Dais product source.
- A later read-only exact-scope audit must prove a clean extraction boundary before any source copy.
- Runtime adoption, API/controller wiring, persistence, package publication, cutover, and duplicate
  retirement each require later explicit authority.

## Proposed Bounded R3 Envelope

The proposed envelope is sequential and revocable:

1. E1 may change only its two exact sovereign implementation files plus governed evidence/routing.
2. E2 may change only the exact standalone contract-compat, verifier, constrained workflow job,
   Work Order, and evidence files listed above.
3. Codex may create isolated worktrees, implement, validate, open and remediate PRs, obtain
   exact-head assurance, merge when all governed gates pass, verify post-merge state, and continue
   E1 to E2.
4. Scope drift, required-check failure, unresolved review, assurance failure, protected-resource
   access, runtime wiring, extraction, publication, or conflicting authority suspends the envelope.

This packet proposes that R3 envelope; it does not activate it.

## Preparation Validation

- source and destination inspection: read-only;
- runtime/backend/test/destination/workflow changes: none;
- county/PACS/SQL/secret/live access: none;
- `git diff --check`: required;
- `node docs/brain/workorders/tools/wo-query.mjs --json`: required;
- work-order tooling tests: required.

## Next

`WO-SR-005C-E1 - Dais Sovereign Appeal Workflow Read Adapter` is the first proposed implementation
node. It is blocked pending activation of the exact bounded R3 envelope above. E2 remains
dependency-blocked on E1, and extraction/runtime adoption remain blocked after E2.
