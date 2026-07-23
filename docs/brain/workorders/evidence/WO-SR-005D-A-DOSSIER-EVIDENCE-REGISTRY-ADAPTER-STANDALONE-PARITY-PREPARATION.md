# WO-SR-005D-A - Dossier Evidence Registry Adapter and Standalone Parity Preparation

## Verdict

`IMPLEMENTATION_READY_AS_TWO_REPOSITORY_SEQUENCE`

The frozen `dossier.evidence-registry-read@1.0.0` contract can be adopted by two bounded,
sequential R3 slices without source extraction, runtime wiring, database access, custody mutation,
or protected data:

1. `WO-SR-005D-E1` implements a pure unwired sovereign adapter from an already-materialized,
   county- and parcel-scoped evidence page to the frozen contract.
2. `WO-SR-005D-E2` materializes the hash-pinned contract and synthetic corpus in
   `bsvalues/terrafusion-dossier` and proves standalone validation and projection parity.

Dossier source extraction, custody mutation, persistence access, and runtime adoption remain
blocked after both slices.

## Inspection Basis

| Surface | Exact revision | Result |
| --- | --- | --- |
| Sovereign base | `44a58257dc10f09b5ea8dcc367de01e1bbfe924c` | Frozen Dossier contract and canonical registry source present |
| Frozen contract merge | `cfcd460d6387c7dc5aefbc83a389e74333cf0201` | DTO, schema, 11 fixtures, and freeze hashes committed |
| Standalone Dossier | `b211387b7ba3653d901b6223900710b2012395d6` | Private bootstrap only; no product source extracted |
| Standalone required checks | Live branch protection | `suite-ci`, `contract-compat`, `governance-gate`; strict and admin-enforced |

The standalone contract declaration still identifies only `crosscut.audit@1.0.0` and an older
sovereign freeze SHA. Correcting that declaration belongs to E2, not this read-only preparation.

## Frozen Contract Truth

| Artifact | SHA-256 |
| --- | --- |
| `DossierEvidenceRegistryReadDto.cs` | `414fd158cd7a0f1e483ab44a83b93a64e4180300561f53088830583220566b7f` |
| `dossier.evidence-registry-read.v1.schema.json` | `f658bc2bda718f58bd0353e9635524d5dbd376be515b543da3442b0094e52270` |
| `two-record-page.synthetic.json` | `5e6929890dcf9f58d780e187f6c6d8f7ed2951d78a13bbc445c74b61e5aeb6e3` |
| `empty-page.synthetic.json` | `76c70831cacf44a1e76d878eafa64129cdf6c471b632527240e0f17bc32cdaa2` |
| `next-page.synthetic.json` | `7ab5404b6138ed940fbc790af55435b8a6f383a4eb62f4d3dea79c9c96d5be7f` |
| `county-mismatch.synthetic.json` | `de0054c63d3362d72711061de10f71ab7c3f3b3afd0a7366bd12348312ef7209` |
| `parcel-mismatch.synthetic.json` | `4fbf99544359faa62e18712a647574f7007baf1a7633be45a8f9651058f59dca` |
| `unknown-evidence-type.synthetic.json` | `c84a6c040d46f019b36313a7d8c97cb046dea5690c4be898eddd094664d61da2` |
| `unknown-integrity.synthetic.json` | `3ed7e2822e1971e731d0551786a9c7740ce81fbc80d27e3f80d270d56abe8c69` |
| `duplicate-evidence-id.synthetic.json` | `6ff3402449723295946493532356a12155f235dc2054fcc08783c7912372f1a5` |
| `unstable-tie-order.synthetic.json` | `caf891ee8adbc92fe001441c416946f2bef0f307d33dafff4166a98f7c551316` |
| `pagination-inconsistent.synthetic.json` | `9eff7f8a36efdd1945828bc530de05fbf4fcdb69ea34d6cf131665b6a4b74790` |
| `cross-lane-fields.synthetic.json` | `1e2044fd6af4dea9d421089f1a8f0d3efc500a995fcd6a5f565c2a008f15bfed` |

The frozen verifier requires exact county and parcel identity, stable ordering by `createdAt`
descending then `evidenceId` ascending, unique evidence IDs, exact request/result pagination
identity, `hasMore == offset + count < total`, count not greater than limit, and no page extending
beyond total.

## Canonical Source Findings

### Exact source proof

| Proof | Live source |
| --- | --- |
| Persistence entity and fields | `backend/src/TerraFusion.Core/Entities/DossierEvidence.cs:1-31` |
| County- and parcel-filtered list query | `backend/src/TerraFusion.API/Controllers/DossierController.cs:1855-1900` |
| Pagination normalization | `backend/src/TerraFusion.API/Controllers/DossierController.cs:2268-2279` |
| Existing list evidence test | `backend/tests/TerraFusion.Unit.Tests/R1Week5/R1Week5CxR1ClosureTests.cs:5448-5469` |
| Frozen DTO | `backend/src/TerraFusion.Abstractions/DTOs/DossierEvidenceRegistryReadDto.cs` |
| Frozen schema | `backend/src/TerraFusion.Abstractions/contracts/dossier.evidence-registry-read.v1.schema.json` |

### Accepted read boundary

The canonical source is the already-materialized page produced after the current controller query
has filtered `DossierEvidence` rows by exact `ParcelId` and `CountyId`.

E1 must receive the request, the already-materialized page, and the page total as explicit inputs.
It must not resolve claims, call `TerraFusionDbContext`, execute a query, mutate custody, or perform
persistence work.

### Current endpoint limitations

The controller does not itself prove contract parity:

- it orders only by `CreatedAt` descending and lacks the frozen `evidenceId` ascending tie-break;
- it emits `title` and `createdBy`, which are prohibited cross-lane fields;
- it does not emit explicit county, parcel, limit, or offset identity in the result; and
- existing endpoint tests do not prove cross-county list denial, tie ordering, closed vocabulary,
  pagination consistency, or privacy-field exclusion.

The proposed adapter can deterministically map and sort an already-materialized page. It cannot
prove stable page membership across a database pagination boundary while the source query lacks the
secondary ID order. E1 and E2 therefore remain unwired proof only. Any controller adoption requires
a later exact runtime Work Order and explicit parity proof for source-query ordering.

## Exact Adapter Boundary

Proposed API:

```text
DossierEvidenceRegistryReadAdapter.Map(
  DossierEvidenceRegistryReadRequest request,
  int total,
  IReadOnlyList<DossierEvidence> sourcePage)
  -> DossierEvidenceRegistryReadResult
```

The adapter is a pure static transformation with no DI registration or runtime consumer.

| Contract field | Canonical input / rule | Fail-closed rule |
| --- | --- | --- |
| request `schemaVersion` | literal `1.0.0` | reject any other value |
| request `countyId` | canonical `D` GUID | reject invalid or non-canonical identity |
| request `parcelId` | exact non-empty identity | reject blank identity |
| request `limit` | integer 1 through 100 | reject defaulting or clamping inside adapter |
| request `offset` | non-negative integer | reject negative value |
| result identity | preserve request county, parcel, limit, offset, optional trace | never synthesize or normalize |
| `evidenceId` | `DossierEvidence.Id.ToString("D")` | reject empty or duplicate identity |
| `documentId` | optional source document identity | preserve absence; reject invalid representation |
| `evidenceType` | frozen closed vocabulary | reject unknown value |
| `integrity` | frozen closed vocabulary | reject unknown value |
| `createdAt` | source `CreatedAt` serialized as UTC | reject non-UTC or invalid value |
| ordering | `createdAt` descending, then `evidenceId` ascending | return only canonical deterministic order |
| `total` | explicit already-computed total | reject negative total or page beyond total |
| `hasMore` | `offset + count < total` | never trust an inconsistent caller value |

Every source row must match the request county and parcel. The mapped result must never include
title, creator, chain length, valuation, levy, note, custody mutation, provider, token, or
persistence-navigation fields.

## WO-SR-005D-E1 - Sovereign Adapter Slice

### Exact files

- `backend/src/TerraFusion.API/Adapters/DossierEvidenceRegistryReadAdapter.cs`
- `backend/tests/TerraFusion.Unit.Tests/Dossier/DossierEvidenceRegistryReadAdapterTests.cs`
- E1 evidence and routing under `docs/brain/workorders/**`

### Required assertions

- valid two-record, empty, and next-page inputs map field-for-field;
- invalid schema version, county identity, parcel identity, limit, offset, or total fails closed;
- county mismatch, parcel mismatch, unknown evidence type, unknown integrity, duplicate ID,
  impossible pagination, and null input fail closed;
- output ordering is `createdAt` descending then `evidenceId` ascending;
- `hasMore`, count, total, limit, and offset remain mathematically consistent;
- optional document and trace identities remain absent when absent;
- title, creator, chain length, valuation, levy, note, custody, provider, and persistence fields
  cannot cross the result; and
- no DI, controller, service, database, provider, endpoint, or consumer reference is introduced.

### Validation

- targeted Dossier adapter unit tests;
- canonical backend build with zero warnings;
- frozen contract verifier and tests;
- work-order query and tooling tests;
- exact scope inspection and `git diff --check`.

## WO-SR-005D-E2 - Standalone Synthetic Parity Slice

### Exact destination allowlist

- `.github/workflows/suite-ci.yml`, limited to the existing `contract-compat` job;
- `canon/CONTRACT_DEPENDENCY.md`;
- `contract-compat/dossier.evidence-registry-read.v1/manifest.json`;
- `contract-compat/dossier.evidence-registry-read.v1/dossier.evidence-registry-read.v1.schema.json`;
- the 11 frozen synthetic fixtures under `contract-compat/dossier.evidence-registry-read.v1/fixtures/`;
- `scripts/verify-dossier-evidence-registry-read.mjs`;
- `scripts/verify-dossier-evidence-registry-read.test.mjs`;
- `operations/work-orders/WO-SR-005D-E2-dossier-standalone-synthetic-contract-parity.md`; and
- `operations/evidence/WO-SR-005D-E2-DOSSIER-STANDALONE-SYNTHETIC-CONTRACT-PARITY.md`.

### Required parity assertions

- all frozen source artifact hashes match the manifest;
- all three positive fixtures pass with the same normalized result semantics;
- all eight negative fixtures fail closed for the same semantic reason class;
- county and parcel identity, closed vocabularies, deterministic ordering, pagination, and privacy
  exclusions match the sovereign verifier;
- no title, creator, chain length, valuation, levy, note, custody mutation, provider, database,
  county dataset, secret, network, or live-service input is accepted; and
- the standalone `suite-ci`, `contract-compat`, and `governance-gate` checks pass.

## Provenance And Rollback

- Sovereign source and the immutable contract-freeze merge remain authoritative through E1 and E2.
- E1 rollback is removal of the unwired adapter and focused tests.
- E2 rollback is removal of the mirrored contract-compat material and restoration of the bootstrap
  contract declaration and constrained check.
- Neither slice deletes, copies, or retires Dossier product source.
- A later read-only exact-scope audit must prove a clean extraction boundary before any source copy.
- Custody mutation, runtime adoption, controller wiring, persistence, package publication, cutover,
  and duplicate retirement each require later explicit authority.

## Dais Test-Count Reconciliation

The preserved PR #1357 body is the authoritative command-output record and reports **31 targeted
adapter tests passed**. The queue and program playbook had drifted to 32 without preserved output
support. This Work Order normalizes both canonical references to 31. The discrepancy affects no
Dais contract, adapter, parity, or closeout result.

## Proposed Bounded R3 Envelope

The proposed envelope is sequential and revocable:

1. E1 may change only its two exact sovereign implementation files plus governed evidence/routing.
2. E2 may change only the exact standalone contract-compat, verifier, constrained workflow job,
   Work Order, and evidence files listed above.
3. Codex may create isolated worktrees, implement, validate, open and remediate PRs, obtain
   exact-head assurance, merge when all governed gates pass, verify post-merge state, and continue
   E1 to E2.
4. Scope drift, required-check failure, unresolved review, assurance failure, protected-resource
   access, custody mutation, persistence access, runtime wiring, extraction, publication, or
   conflicting authority suspends the envelope.

This packet proposes that R3 envelope; it does not activate it.

## Preparation Validation

- source and destination inspection: read-only;
- runtime/backend/test/destination/workflow changes: none;
- custody/persistence/county/PACS/SQL/secret/live access: none;
- `git diff --check`: required;
- `node docs/brain/workorders/tools/wo-query.mjs --json`: required;
- work-order tooling tests: required.

## Next

`WO-SR-005D-E1 - Dossier Sovereign Evidence Registry Read Adapter` is the first proposed
implementation node. It is blocked pending activation of the exact bounded R3 envelope above. E2
remains dependency-blocked on E1, and extraction, custody mutation, persistence, and runtime
adoption remain blocked after E2.
