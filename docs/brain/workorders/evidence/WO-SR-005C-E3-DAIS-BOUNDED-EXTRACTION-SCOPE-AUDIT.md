# WO-SR-005C-E3 - Dais Bounded Extraction Scope Audit Evidence

## Result

**`PASS_NO_DIRECT_EXTRACTION_BUILT_FRESH_FOUNDATION_READY`.** No committed sovereign product-source
slice is eligible for direct extraction of the frozen `dais.appeal-workflow@1.0.0` behavior into
`bsvalues/terrafusion-dais`. Every candidate Dais source crosses at least one protected boundary
(persistence, PACS/provider, HTTP/auth, OS write-lane/audit runtime, or OS-shell composition). The
smallest safe next slice is a **built-fresh, offline, unwired** read-only appeal-workflow projection
module that promotes the already-proven contract behavior out of its verifier, copying no OS,
provider, county, valuation, persistence, or adapter source. This mirrors the Atlas
`WO-SR-005B-E3` verdict.

## Anchors

| Field | Value |
| --- | --- |
| Sovereign base SHA audited (`origin/main`) | `e57b1eca9c3291d10203efaa1fd586bcbce13f94` (#1352, WO-SR-005E-I) |
| Working tree at audit time | `01fef1f4275142053b3c11430e110023faad7ce9` (reconciliation branch; frozen Dais blobs byte-identical to the sovereign base) |
| Frozen contract | `dais.appeal-workflow@1.0.0` (frozen at PR #1350; `verify-contract-freeze.mjs` PASS, `verify-contract-freeze.test.mjs` 16/16) |
| Dais canonical read-only clone | `github.com/bsvalues/terrafusion-dais`, `main` head `1404db1947587d4f8c868092798c4d71c23bb62d` |

## Frozen Contract Surface — 11 files, hash-verified

On-disk SHA-256 equals the `contracts.freeze.json` pin for all 11 (freeze integrity verified at the
audit anchor). The DTO + schema are **CONTRACT_ARTIFACT** (stay sovereign-owned; the suite consumes
them hash-pinned). The nine `*.synthetic.json` are the **SYNTHETIC_FIXTURE** corpus.

| # | Path (under `backend/src/TerraFusion.Abstractions/`) | SHA-256 | Bucket |
| --- | --- | --- | --- |
| 1 | `DTOs/DaisAppealWorkflowDto.cs` | `c9bb02054fc5a211ed609a3e9d7fe604e34cd0613701a57f6f2788d312348f47` | CONTRACT_ARTIFACT |
| 2 | `contracts/dais.appeal-workflow.v1.schema.json` | `b66579eda680849b9bfc998c9cb89b33079ff3ef87a20ad499643b5f9249dd8c` | CONTRACT_ARTIFACT |
| 3 | `contracts/fixtures/dais.appeal-workflow.v1.filed-by-parcel.synthetic.json` | `3b5196ccd2e6080a357279297f53a23c996a29db87071a0237f829d9b2cf6a3e` | SYNTHETIC_FIXTURE (positive) |
| 4 | `contracts/fixtures/dais.appeal-workflow.v1.decided-by-id.synthetic.json` | `8bce4af4bca4b75a5d8d274fdbea55732b62c091d426a9776e357494fd124d10` | SYNTHETIC_FIXTURE (positive) |
| 5 | `contracts/fixtures/dais.appeal-workflow.v1.empty-by-tax-year.synthetic.json` | `711fabf84f640befaaf2bf8ce3bef1f6ba5a7f3bded2e080123d283bd975ea7d` | SYNTHETIC_FIXTURE (positive) |
| 6 | `contracts/fixtures/dais.appeal-workflow.v1.county-mismatch.synthetic.json` | `58e9b3e9b5198b83cf0f35cf8e5f0c8d10d1039bb71a73da6349975250e940ce` | SYNTHETIC_FIXTURE (negative) |
| 7 | `contracts/fixtures/dais.appeal-workflow.v1.missing-county.synthetic.json` | `a05e064f6fa43d5778870b88413b94a111b07f3c5d019e9338820914ecb6c849` | SYNTHETIC_FIXTURE (negative) |
| 8 | `contracts/fixtures/dais.appeal-workflow.v1.invalid-status.synthetic.json` | `5db538ba1e89ac17b45f40df6922cd27d3b5a0ee5368ed466ff8aa89ec55ad05` | SYNTHETIC_FIXTURE (negative) |
| 9 | `contracts/fixtures/dais.appeal-workflow.v1.cross-lane-fields.synthetic.json` | `f290364ae814e241d75d92d4ee230740526a15a64ea077247fe42910315a8aff` | SYNTHETIC_FIXTURE (negative) |
| 10 | `contracts/fixtures/dais.appeal-workflow.v1.ambiguous-selector.synthetic.json` | `3ff0de0c5ea92916afb63de5a3a9166c8c620e68b41dc8bfb6a39aa992cdea17` | SYNTHETIC_FIXTURE (negative) |
| 11 | `contracts/fixtures/dais.appeal-workflow.v1.selector-mismatch.synthetic.json` | `99828201845dfceccb2ed2392d6ae4f1927918ac78ca652d2cc9a83d9789e8cc` | SYNTHETIC_FIXTURE (negative) |

The contract is a **read-only county-scoped appeal-lifecycle projection**: `DaisAppealWorkflowReadRequest`
(SchemaVersion, CountyId, Selector, TraceId?) / `DaisAppealSelector` (AppealId? | ParcelId? | TaxYear?)
/ `DaisAppealWorkflowReadResult` (Appeals[]) / `DaisAppealWorkflowRecord` (AppealId, ParcelId, TaxYear,
Ground, Status, FiledAt, HearingAt?, DecisionAt?) with closed enums `DaisAppealGround` and
`DaisAppealStatus`. No PII, monetary, notes, document, geometry, or provider fields.

## Audit Basis — candidate inventory (representative surfaces)

Every candidate defaults to `PROHIBITED_SOVEREIGN` unless provider-neutrality is provable at the
import level. **REUSABLE_PROVIDER_NEUTRAL = 0.**

| Surface | Evidence | Verdict |
| --- | --- | --- |
| `backend/src/TerraFusion.API/Controllers/DaisController.cs` | `Microsoft.AspNetCore.Mvc` + EF + `TerraFusion.Data` + OS auth; `[Authorize]`, `[Route("api/dais")]`, injects `TerraFusionDbContext` | PROHIBITED_SOVEREIGN (HTTP + auth + persistence) |
| `backend/src/TerraFusion.Core/Entities/Appeal.cs` | EF entity with `PetitionerName`, `Current/Requested/DecidedValue`, `DecisionNotes` — fields the contract excludes | PROHIBITED_SOVEREIGN (persistence + PII/monetary) |
| `backend/src/TerraFusion.Core/Entities/Pacs/PacsAppeal.cs` | `[Table("pacs_appeals")]`, Harris PACS `_arb_protest` mapping | PROHIBITED_SOVEREIGN (PACS provider — Rule #3 no-touch) |
| `backend/src/TerraFusion.Core/Services/AppealService.cs` (+ `IAppealService.cs`) | EF + `ITerraFusionDbContext`; `CreateAsync`/`UpdateStatusAsync` mutations | PROHIBITED_SOVEREIGN (persistence + write commands) |
| `backend/src/TerraFusion.Data/Configurations/AppealConfiguration.cs`, `Migrations/*AddDaisEntities*` | EF config + DDL migration | PROHIBITED_SOVEREIGN (persistence/SQL) |
| `frontend/apps/os-shell/src/services/suites/daisAppealDeadline.ts` (purest kernel) | pure date math exists, but entry `createDeadlineState()` calls `assertWriteLane('dais','appeal')` (TFR-028) + `emitTraceEvent(...)` (TFR-027 audit HTTP); also out of the read-only contract scope | PROHIBITED_SOVEREIGN (OS write-lane + audit runtime) |
| `services/suites/{daisAppealIntake,Certification,Hearing,Notice,Queue,CertRoll,NoticeBatch,ManagementDashboard,dossierAppealHandoff}.ts` | every file imports `writeLane` + `terraTrace` (+ `createStableId`) | PROHIBITED_SOVEREIGN (OS runtime) |
| `services/suites/daisService.ts` | imports `getToken` from `@/auth/authStorage` | PROHIBITED_SOVEREIGN (OS auth/session HTTP) |
| `components/dais/**`, `pages/dais/**`, `pages/suites/Dais*`, `pages/workbench/tabs/PropertyDais.tsx`, `hooks/useAppealsQueue.ts` | Tier-0 OS-shell React composition (auth/routing/workbench/launcher) | PROHIBITED_SOVEREIGN (OS composition — same class Atlas E3 held sovereign) |
| `packages/property-tax-ai/server/services/appeals/appeals-management-service.ts` | imports `@shared/schema`, `../../storage` (IStorage), `AssessorWorkflowEngine`, `NotificationService` | PROHIBITED_SOVEREIGN (storage/workflow/notification bundle — mirrors Atlas `gis-pro` rejection) |
| Backend Dais/appeal tests (`DaisCountyIsolationTests`, `DaisWorkflowPersistenceTests`, `AppealServiceTests`, `DaisEndpointContractTests`, `AppealWriteLaneGuardTests`, …) | bind `TerraFusionDbContext` / controllers | PROHIBITED_SOVEREIGN (test infra, not extractable source) |
| The 9-fixture synthetic corpus (frozen) | provider-neutral JSON, already sovereign-frozen | SYNTHETIC_FIXTURE (rebuilt fresh, hash-pinned, in the suite verifier) |

## Dependency And Ownership Boundary

- **Sovereign base SHA audited:** `e57b1eca9c3291d10203efaa1fd586bcbce13f94`.
- **Standalone suite base SHA:** `bsvalues/terrafusion-dais` `main` `1404db1947587d4f8c868092798c4d71c23bb62d`.
- **Shared contract remains sovereign-owned:** `dais.appeal-workflow@1.0.0` (DTO
  `DaisAppealWorkflowDto.cs` + schema `dais.appeal-workflow.v1.schema.json`, schema SHA-256
  `b66579eda680849b9bfc998c9cb89b33079ff3ef87a20ad499643b5f9249dd8c`). The suite consumes it
  hash-pinned; no ownership transfer, no DTO source copy.
- **Suite may own:** a provider-neutral read-only projection/validation of the already-validated
  contract behavior (selector validation, county-match, selector-match, closed enum enforcement,
  cross-lane rejection, empty-result truth) plus its own verifier + fixtures copy.
- **OS retains:** all auth, workbench, launching, persistence, PACS/providers, county/runtime,
  write-lane (TFR-028), audit trace (TFR-027), and mutation endpoints.

## Copy Versus History Decision

**`NO DIRECT COPY`, no git-history import.** No audited file has a clean suite-only dependency +
ownership boundary; every candidate is welded to persistence, PACS, HTTP/auth, or the OS
write-lane/audit runtime, and the one file with a genuinely pure date-math kernel
(`daisAppealDeadline.ts`) interleaves sovereign side-effects into its entry point and is out of the
frozen read-only contract scope. The F1 slice factors the already-tested behavior into a fresh
destination module and makes a standalone verifier consume it.

## Exact R3 Allowlist for the Dais F1 build-fresh slice (`bsvalues/terrafusion-dais`)

The F1 slice (next WO, executed in the suite repo) may create ONLY:

- `src/appeal-workflow/project-dais-appeal-workflow.mjs` — fresh provider-neutral read-only module:
  selector validation (exactly one of appealId/parcelId/taxYear), county-match, selector-match,
  closed `ground`/`status` enforcement, cross-lane-field rejection, empty-result truth. No
  `writeLane`, no `terraTrace`, no network, no persistence, no auth.
- `test/project-dais-appeal-workflow.test.mjs` — direct product-module parity tests.
- `scripts/verify-dais-appeal-workflow.mjs` — hash-pinned verifier consuming the 9 synthetic fixtures.
- `scripts/verify-dais-appeal-workflow.test.mjs` — verifier tests (3 positive / 6 negative parity).
- `contract-compat/dais.appeal-workflow.v1/**` — hash-pinned local copies of the frozen schema + 9
  fixtures (pin the sovereign SHA-256s above; NO DTO source copy).
- `canon/CONTRACT_DEPENDENCY.md` — records `dais.appeal-workflow@1.0.0` as a sovereign-owned
  dependency, schema SHA-256 `b665…dd8c`, sovereign anchor SHA.
- `operations/work-orders/WO-SR-005C-F1-dais-standalone-appeal-workflow-foundation.md`
- `operations/evidence/WO-SR-005C-F1-DAIS-STANDALONE-APPEAL-WORKFLOW-FOUNDATION.md`
- `AGENTS.md` (if not already present).

**No-touch (F1):** no `package.json`/lockfile, no `.github/workflows/**`, no contract-artifact
mutation, no provider, no network call, no runtime consumer, no OS code, no county/PACS/SQL behavior,
no credential, no secret, no deployment, no cutover, no duplicated sovereign source.

## Parity And Negative Proof (required of F1, defined here)

The sovereign and standalone verifiers must consume the SAME hash-pinned 9-fixture corpus and agree on
every accept/reject: **3 positive** (`filed-by-parcel`, `decided-by-id`, `empty-by-tax-year`) and
**6 negative** (`county-mismatch`, `missing-county`, `invalid-status`, `cross-lane-fields`,
`ambiguous-selector`, `selector-mismatch`) before any adapter/extraction/runtime work is admitted.

## Non-Claims

- No Dais product source was extracted, copied, or moved by this audit.
- No frozen contract artifact was modified; the DTO and schema stay sovereign-owned.
- No F1 module was implemented here — this WO only produces the scope verdict and the F1 allowlist.
- No provider, county, PACS, SQL, persistence, credential, runtime, or deployment resource was touched.
- `PASS_NO_DIRECT_EXTRACTION` authorizes only the fresh-build F1 slice; it does not authorize
  WO-SR-005C-E2 parity execution, WO-SR-005C-F1 implementation, runtime adoption, or WO-SR-006 cutover.

## Next

`WO-SR-005C-E2` (Dais standalone contract parity) and `WO-SR-005C-F1` (Dais standalone appeal-workflow
foundation) execute in `bsvalues/terrafusion-dais` using the allowlist above. Rollback for this audit
is revert-only and repo-local (`git revert`); it changes no sovereign source and no contract.
