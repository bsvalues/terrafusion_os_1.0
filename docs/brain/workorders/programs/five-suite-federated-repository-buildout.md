# Five-Suite Federated Repository Buildout

**Goal:** `GOAL-FIVE-SUITE-FEDERATED-REPOSITORIES`

**Loop:** `LOOP-FIVE-SUITE-FEDERATED-REPOSITORIES`

**Status:** Active; WO-SR-003 and WO-SR-004 complete, WO-SR-005A Forge extraction active

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
| WO-SR-005A | Execute bounded Forge extraction with provenance and parity proof | Active; Forge contract groups are frozen |
| WO-SR-005B-E | Execute bounded extraction for the remaining suites | Blocked on suite-specific domain contracts |
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
| SR-003B Atlas | `crosscut.audit`; Atlas group still required | Atlas shell surfaces and GIS type-level cut | Domain contract promotion before extraction |
| SR-003C Dais | `crosscut.audit`; Dais group still required | Dais workflow, Levy, Dais/notice surfaces | Domain contract promotion and county-isolation proof |
| SR-003D Dossier | `crosscut.audit`; Dossier group still required | Dossier controllers/entities/surface | Custody contract and evidence-integrity proof |
| SR-003E GPT | `crosscut.audit`; GPT group still required | Governed Muse/RAG and GPT surfaces | TerraPilot-only action boundary and grounding proof |

The five private repositories now exist, contain the declared bootstrap inventory, pass the three
required checks, and enforce the recorded protected-main settings. Forge is the first extraction lane
because it alone has a frozen domain contract. The other suite repositories remain valid bootstraps,
not claims of extracted or standalone product capability.
