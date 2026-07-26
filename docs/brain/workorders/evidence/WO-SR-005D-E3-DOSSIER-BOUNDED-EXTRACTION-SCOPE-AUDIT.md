# WO-SR-005D-E3 - Dossier Bounded Extraction Scope Audit Evidence

## Result

**`PASS_NO_DIRECT_EXTRACTION_BUILT_FRESH_FOUNDATION_CANDIDATE`.** No committed sovereign product
source is eligible for direct extraction of `dossier.evidence-registry-read@1.0.0` into
`bsvalues/terrafusion-dossier`. Every candidate crosses persistence, HTTP/auth, custody, sovereign
contract, OS write-lane/trace, or shell-composition boundaries. The next implementation candidate is
a separate R3 build-fresh, offline, unwired projection. No implementation authority is granted here.

## Exact Anchors

| Field | Value |
| --- | --- |
| Sovereign base audited | `e41c828c512c76d4faf5d9bc80d149308e696da2` |
| Frozen contract | `dossier.evidence-registry-read@1.0.0` |
| Frozen files | 13/13 SHA-256 values match `backend/src/TerraFusion.Abstractions/contracts.freeze.json` |
| Standalone repository observation | GitHub API resolves private `github.com/bsvalues/terrafusion-dossier` |
| Standalone `main` observation | GitHub API resolves `dcd8a1a3066101597bcc64de1d9bf60ee7f8e9cf` |
| Path-canon status | **UNRESOLVED** - `PATH_CANON_REGISTER.md` does not register Dossier; F1 dispatch is blocked pending an R2 path-canon registration |
| Existing standalone proof | Dossier PR #1; 12 mirrored pins, three accepted fixtures, eight fail-closed fixtures |

## Frozen Contract Classification

The DTO and schema are sovereign-owned `CONTRACT_ARTIFACT` files. The eleven
`dossier.evidence-registry-read.v1.*.synthetic.json` files are the frozen `SYNTHETIC_FIXTURE`
corpus. All 13 current SHA-256 values match the pins recorded in `contracts.freeze.json`.
The suite consumes the schema and fixtures by hash; this audit does not transfer DTO ownership.

The contract is a read-only county/parcel-scoped page with exact request/result identity, closed
evidence-type and integrity vocabularies, stable ordering by `createdAt` descending then
`evidenceId` ascending, unique IDs, consistent pagination, and explicit privacy/cross-lane
exclusions.

## Candidate Inventory

| Candidate | Current dependencies and ownership | Classification |
| --- | --- | --- |
| `backend/src/TerraFusion.API/Controllers/DossierController.cs` | ASP.NET controller, `[Authorize]`, permission policy, EF `TerraFusionDbContext`, county-claim resolution, `ICostForgeService`, persistent query, and custody-write endpoints | `PROHIBITED_SOVEREIGN` |
| `backend/src/TerraFusion.Core/Entities/DossierEvidence.cs` | Persistent entity with County/Document navigation plus excluded `Title` and `CreatedBy` fields | `PROHIBITED_SOVEREIGN` |
| `backend/src/TerraFusion.API/Adapters/DossierEvidenceRegistryReadAdapter.cs` | Pure and unwired, but imports the sovereign contract DTO and persistent `DossierEvidence` entity | `PROHIBITED_SOVEREIGN` for direct copy |
| `frontend/apps/os-shell/src/services/suites/dossierService.ts` | Auth token and HTTP transport; mutations guarded by OS write-lane | `PROHIBITED_SOVEREIGN` |
| `dossierPacketFinalization.ts`, `dossierNarrative.ts`, `dossierAppealHandoff.ts` | OS `writeLane`, `terraTrace`, stable-ID, packet-composition, and cross-suite handoff dependencies | `PROHIBITED_SOVEREIGN` |
| Dossier React pages, Workbench tabs, hooks, and components | Tier-0 shell routing, auth, launcher, and Workbench composition | `PROHIBITED_SOVEREIGN` |
| `TerraFusion.Data/Services/Workbench/EvidencePacketService.cs` | EF, configuration/HMAC, Sync doctrine, archive generation, and Workbench ownership | `PROHIBITED_SOVEREIGN` |
| Frozen schema and eleven fixtures | Already sovereign-owned and mirrored under hash pins | `CONTRACT_ARTIFACT` / `SYNTHETIC_FIXTURE` |

**Provably provider-neutral direct-copy candidates: 0.**

## Why the Existing Adapter Is Not an Extraction Slice

The E1 adapter is deliberately pure and unwired, but direct copying would also copy a dependency on
the sovereign DTO assembly and the persistent `DossierEvidence` entity. That entity owns database
navigation and privacy-bearing fields excluded from the contract. The safe standalone boundary is
therefore behavior proven by the frozen corpus, not the sovereign C# source file or entity model.

## Ownership and Provenance Decision

- `terrafusion_os_1.0` retains contract ownership, authentication, county-context resolution,
  persistence, custody, Workbench composition, TerraTrace, write-lane enforcement, and runtime APIs.
- `terrafusion-dossier` may later own a fresh provider-neutral projection over explicit synthetic
  input that implements only the frozen contract semantics.
- No source or Git history is copied. The provenance model is build-fresh behavior derived from the
  frozen contract, hash-pinned corpus, E1 tests, and E2 standalone parity.

## Proposed Later F1 Allowlist

If separately authorized, `WO-SR-005D-F1` may be limited in `bsvalues/terrafusion-dossier` to:

- `src/evidence-registry/project-dossier-evidence-registry-read.mjs`
- `test/project-dossier-evidence-registry-read.test.mjs`
- `scripts/verify-dossier-evidence-registry-read.mjs`
- `scripts/verify-dossier-evidence-registry-read.test.mjs`
- existing `contract-compat/dossier.evidence-registry-read.v1/**` only as needed to consume the
  already-hash-pinned schema and fixtures
- `operations/work-orders/WO-SR-005D-F1-dossier-standalone-evidence-registry-foundation.md`
- `operations/evidence/WO-SR-005D-F1-DOSSIER-STANDALONE-EVIDENCE-REGISTRY-FOUNDATION.md`

The module must remain offline and unwired; reject mismatched county/parcel identity, unknown
vocabulary, duplicate IDs, unstable ordering, impossible pagination, and cross-lane fields; preserve
optional document/trace identity; and make the existing verifier consume the product module.

This is a proposed allowlist, not active implementation authority. No package, lockfile, workflow,
contract pin, provider, persistence, custody, runtime, county/PACS/SQL, credential, deployment,
production, cutover, or source-retirement change is included.

## Validation Evidence

| Gate | Result |
| --- | --- |
| Current-base source/import inspection | PASS |
| Frozen contract hash check | PASS - 13/13 |
| Standalone remote identity and `main` SHA observation | PASS - live GitHub API observation only |
| Reproducible path-canon registration | HOLD - Dossier is absent from `PATH_CANON_REGISTER.md` |
| Direct-copy candidates | PASS - 0 eligible |
| Runtime/backend/frontend/contract/destination changes | NONE |
| Protected-resource access | NONE |
| `git diff --check` | PASS |
| `node docs/brain/workorders/tools/wo-query.mjs --json` | PASS - GPT E3 is the sole eligible next node |
| Work Order query tests | PASS - 12/12 |
| Wave planner tests | PASS - 29/29 |
| Contract freeze verifier | PASS - 6 groups, 52 frozen; Dossier 13/13 pins match |
| Strict pre-push unit tests | PASS - 164/164 |
| Strict pre-push backend build | PASS - 0 warnings, 0 errors |

## Rollback and Non-Claims

Rollback is a repo-local revert of this governance/evidence packet. No source, contract, runtime, or
external repository content changed. This audit does not authorize F1, extraction, runtime adoption,
custody mutation, persistence, publication, deployment, cutover, or duplicate retirement.

## Next

Portfolio reconciliation continues. Before `WO-SR-005D-F1` can be dispatched, a bounded R2
Dossier path-canon registration must establish its reproducible local checkout identity; F1 also
remains a separately gated R3 candidate.
`WO-SR-005E-E3` is the next analogous dependency-cleared R2 source-scope audit because GPT E1/E2 are
complete and its extraction boundary remains unproven.
