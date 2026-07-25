# Five-Suite Federated Repository Buildout

**Goal:** `GOAL-FIVE-SUITE-FEDERATED-REPOSITORIES`

**Loop:** `LOOP-FIVE-SUITE-FEDERATED-REPOSITORIES`

**Status:** Active in GPT R2 reconciliation; E0 complete

## Ratified topology

| Repository | Responsibility |
| --- | --- |
| `bsvalues/terrafusion_os_1.0` | Sovereign OS, platform, integration, Workbench, shared contracts, Brain, security, Sync infrastructure, CI/release governance |
| `bsvalues/terrafusion-forge` | Valuation |
| `bsvalues/terrafusion-atlas` | GIS and spatial |
| `bsvalues/terrafusion-dais` | Assessor administration |
| `bsvalues/terrafusion-dossier` | Evidence and records |
| `bsvalues/terrafusion-gpt` | Governed AI and RAG |

The five suites remain subordinate to one TerraFusion Brain and one constitutional integration
model. Separate source repositories do not create separate products, shells, identity systems,
county contexts, audit spines, deployment control planes, or contract authorities.

## Work Order chain

| WO | Purpose | State |
| --- | --- | --- |
| WO-SR-001 | Ratify topology and extraction blueprint | Complete by owner decision; canonized here |
| WO-SR-002 | Inventory, version, freeze, and validate shared contracts | Complete |
| WO-SR-003A-E | Create and bootstrap the five private suite repositories | Complete |
| WO-SR-004 | Verify settings, branch protection, bootstrap, and contract consumption | Complete |
| WO-SR-005A | Execute bounded Forge extraction with provenance and parity proof | Complete; Forge PR #1 / merge `2430b483`, no cutover |
| WO-SR-005B-P | Prepare Atlas contract ownership and standalone map parity gate | Complete; extraction blocked on missing stable domain contract |
| WO-SR-005B-C | Decompose the Atlas read contract candidate | Complete; implementation-ready without runtime adoption |
| WO-SR-005B-I | Implement and freeze `atlas.spatial-read@1.0.0` | Complete; 3 groups / 14 files frozen, 8/8 verifier tests, no runtime adoption |
| WO-SR-005B-A | Prepare the Atlas adapter boundary and standalone parity harness | Complete; canonical source selected and legacy unsafe source rejected |
| WO-SR-005B-E1 | Implement the pure unwired sovereign spatial-read adapter | Complete; 30/30 tests, zero-warning build, no runtime wiring |
| WO-SR-005B-E2 | Implement standalone synthetic contract/parity harness | Complete; Atlas PR #1, 8/8 hash parity, required checks passed |
| WO-SR-005B-E3 | Audit the exact bounded Atlas extraction scope | Complete; no safe direct-copy slice found |
| WO-SR-005B-F1 | Build the standalone spatial projection foundation | Complete; Atlas PR #2 / merge `6c530f1b`, standalone and unwired |
| WO-SR-005C-P | Prepare the Dais domain contract and county-isolation gate | Complete; appeal cohort selected, decomposition required |
| WO-SR-005C-C | Decompose the Dais appeal-workflow contract | Complete; read-only county-scoped boundary defined |
| WO-SR-005C-I | Implement and freeze the Dais appeal-workflow contract | Complete; `dais.appeal-workflow@1.0.0`, no runtime adoption |
| WO-SR-005C-A | Prepare the Dais adapter and standalone parity boundary | Complete; implementation-ready two-repository sequence |
| WO-SR-005C-E1 | Implement the pure unwired sovereign appeal-workflow adapter | Complete; preserved test output is authoritative at 32 passed, 0 failed, no runtime consumer |
| WO-SR-005C-E2 | Implement standalone synthetic contract/parity harness | Complete; Dais PR #1 / merge `2768cd8d`, all required checks passed |
| WO-SR-005C-E3 | Audit the exact bounded Dais extraction scope | Complete; no safe direct-copy slice found |
| WO-SR-005C-F1 | Build the standalone appeal-workflow foundation | Later candidate; after E2 parity and exact implementation authority |
| WO-SR-005D-P | Prepare Dossier custody contract and evidence-integrity gate | Complete with cohort correction; custody mutation excluded |
| WO-SR-005D-C | Decompose the Dossier evidence-snapshot contract | Complete; NO_GO because snapshot crosses Property, Forge, levies, and notes |
| WO-SR-005D-C2 | Decompose the Dossier evidence-registry read contract | Complete; read-only county/parcel boundary defined |
| WO-SR-005D-I | Implement and freeze the Dossier evidence-registry read contract | Complete; `dossier.evidence-registry-read@1.0.0`, no runtime adoption |
| WO-SR-005D-A | Prepare the Dossier adapter and standalone parity boundary | Complete; implementation-ready two-repository sequence |
| WO-SR-005D-E1 | Implement the pure unwired sovereign evidence-registry adapter | Complete; 31 targeted tests and no runtime consumer |
| WO-SR-005D-E2 | Implement standalone synthetic contract/parity harness | Complete; Dossier PR #1 / merge `dcd8a1a3`, all required checks passed |
| WO-SR-005E-P | Prepare GPT governed-AI contract and grounding gate | Complete; grounded-context selected, current adapter not parity-safe |
| WO-SR-005E-C | Decompose the GPT grounded-context contract | Complete; provider-neutral read-only boundary defined |
| WO-SR-005E-I | Implement and freeze the GPT grounded-context contract | Complete; `gpt.grounded-context@1.0.0`, no provider/runtime adoption |
| WO-SR-005E-A | Prepare the GPT adapter and standalone parity boundary | Complete; decomposition required because committed RAG output loses contract identity |
| WO-SR-005E-A2 | Design the GPT grounded source-identity projection | Complete; exact pure unwired projection defined |
| WO-SR-005E-E0 | Build the GPT grounded source-identity projection foundation | Complete; 52 focused cases, pure and unwired |
| WO-SR-005E-A3 | Reconcile the GPT adapter and standalone parity boundaries | Complete; technical sequence bounded, path canon missing |
| WO-SR-005E-A4 | Register the standalone GPT repository path canon | Ready R2; no destination content change |
| WO-SR-005E-E1 | Implement the pure unwired GPT grounded-context adapter | Proposed R3; depends on A4 and exact E1/E2 envelope |
| WO-SR-005E-E2 | Implement standalone synthetic contract/parity harness | Proposed R3; depends on E1 and the same envelope |
| WO-SR-005B-E | Execute bounded extraction for the remaining suites | Blocked on E3 exact-scope proof and suite-specific gates |
| WO-SR-006 | Cut over source ownership and retire duplicate mutable implementation | Depends on all suite-specific gates |

## Extraction and provenance policy

1. Current `terrafusion_os_1.0` source remains authoritative until a suite passes cutover.
2. Every extraction records exact source path, source SHA, destination path, ownership class,
   dependency inventory, history/import decision, contract version, tests, rollback, and duplicate
   retirement plan.
3. Historical repositories are mines, not masters. No wholesale copy or blind import is allowed.
4. Copy-then-verify precedes any deletion. Deletion or ownership transfer is a separate gate.
5. A suite builds and tests standalone, passes parity and contract compatibility, and renders through
   an OS-owned versioned contract before becoming canonical.
6. Shared contracts remain owned by the sovereign base; suites consume and never redefine them.

## Bootstrap inventory

Each suite repository receives `README.md`, subordinate `AGENTS.md`, `LICENSE`, `.gitignore`,
`canon/INTAKE_RULES.md`, `canon/SUITE_DOMAIN_PACK.md`, `canon/CONTRACT_DEPENDENCY.md`,
`operations/work-orders/`, `operations/evidence/MIGRATION_PROVENANCE_LEDGER.md`,
`docs/decisions/`, `EXTRACTED_FROM.md`, and `.github/workflows/suite-ci.yml`.

Settings are private repository, `main` default, PR required, squash-only, delete branch after merge,
no force push or branch deletion, admin enforcement, stale-review dismissal, conversation resolution,
and required `suite-ci`, `contract-compat`, and `governance-gate` checks.

## Suite creation packets

| WO | Frozen dependencies | Initial extraction inventory | Additional gate |
| --- | --- | --- | --- |
| SR-003A Forge | `forge.valuation`, `crosscut.audit` | CostForge, CurrentUse, Forge shell surfaces | Standalone valuation parity |
| SR-003B Atlas | `atlas.spatial-read`, `crosscut.audit` | Atlas shell surfaces and GIS type-level cut | Adapter and standalone synthetic parity preparation before extraction |
| SR-003C Dais | `crosscut.audit`; Dais group still required | Dais workflow, Levy, Dais/notice surfaces | Domain contract promotion and county-isolation proof |
| SR-003D Dossier | `crosscut.audit`; Dossier group still required | Dossier controllers/entities/surface | Custody contract and evidence-integrity proof |
| SR-003E GPT | `crosscut.audit`; GPT group still required | Governed Muse/RAG and GPT surfaces | TerraPilot-only action boundary and grounding proof |

The five private repositories now exist, contain the declared bootstrap inventory, pass the three
required checks, and enforce the recorded protected-main settings. Forge completed the first bounded
extraction. Atlas has a frozen read contract, a proven unwired sovereign adapter, and a hash-pinned
standalone synthetic parity harness. E3 rejected direct source copying because every sovereign
candidate crosses OS, provider, county, valuation, or sovereign-assembly boundaries. F1 merged the
proven projection behavior as a built-fresh standalone product module in Atlas PR #2 without runtime
wiring. WO-SR-005C-P found real county-isolated Dais workflow proof, selected appeals as the smallest
coherent cohort, and rejected direct extraction before a frozen contract exists. WO-SR-005C-C then
defined a read-only contract boundary. WO-SR-005C-I implemented and froze that contract without
runtime adoption. WO-SR-005C-A then rejected the raw persistence entity as a contract-safe API,
selected the county-scoped service result as the canonical source, and defined an unwired sovereign
adapter followed by standalone synthetic parity. The owner activated its bounded E1/E2 R3 envelope,
and E1 implemented the pure adapter with fail-closed synthetic proof and no runtime consumer. E2
merged the hash-pinned standalone synthetic parity proof in Dais PR #1. The E1/E2 envelope is
complete and consumed; F1 remains separately gated and unauthorized;
WO-SR-005C-E3 independently confirmed that no sovereign Dais source has a safe direct-copy boundary
and defined F1 as a later built-fresh candidate after parity;
WO-SR-005D-C rejected the mixed-domain evidence snapshot and preserved custody mutation as blocked;
WO-SR-005D-C2 defined the persistent Dossier evidence-registry read boundary and WO-SR-005D-I froze
it without runtime adoption. WO-SR-005D-A then rejected the current controller projection as
contract parity, selected an already-materialized county/parcel page as the pure adapter input, and
defined an unwired sovereign adapter followed by standalone synthetic parity. The owner activated
the bounded E1/E2 R3 envelope, and E1 implemented the pure adapter with fail-closed synthetic proof
and no runtime consumer. E2 merged the hash-pinned standalone parity proof in Dossier PR #1. The
E1/E2 envelope is complete and consumed. WO-SR-005E-P selected grounded context while proving the
current adapter is not parity-safe; WO-SR-005E-C defined the exact contract and WO-SR-005E-I froze
it. WO-SR-005E-A then proved that the committed RAG result cannot preserve the frozen county,
dataset, trace, authorization, and source-to-chunk identity. WO-SR-005E-A2 found no safe existing
boundary and defined an exact build-fresh pure unwired projection. WO-SR-005E-E0 implemented that
projection with 52 focused synthetic cases and no runtime consumer. Its bounded R3 envelope is
consumed. WO-SR-005E-A3 then defined an exact pure adapter and hash-pinned standalone parity
sequence but found `bsvalues/terrafusion-gpt` absent from the canonical path register.
WO-SR-005E-A4 is ready as a bounded R2 registration node. E1 and E2 remain proposed pending A4 and
one exact bounded R3 envelope; no adapter, standalone, runtime, provider, or extraction
implementation authority exists now. The Dais, Dossier, and GPT contract cohort is complete and its
sequential authority is consumed. The suite repositories remain valid bootstraps, not claims of
extracted or standalone product capability.
