# Multi-Agent + Subagent Parallel Execution Plan (CP-12 Through Go-Live)

Date: 2026-03-19  
Branch: main  
Classification: Docs-only superpowers artifact (bounded planning; no execution authority)

## Pre-Flight Scope Disclaimer

- Working tree was already dirty before this task started.
- Unexpected pre-existing changes were detected in `os-platform/core/pilot/ToolRunner.ts` and `os-platform/core/pilot/ToolRunner.js`.
- Those files are intentionally excluded from this plan scope.
- This artifact is limited to `docs/superpowers/plans/**` and does not normalize unrelated dirty files.

## Excluded Dirty File Fingerprints

To preserve proof that unrelated dirty files were not modified by this docs-only slice, record working-tree fingerprints before and after any plan edits.

Pre-flight fingerprint targets:
- `os-platform/core/pilot/ToolRunner.ts`
- `os-platform/core/pilot/ToolRunner.js`

Verification rule:
- If either fingerprint changes during a docs-only slice, hard-stop immediately and classify as scope breach unless explicitly approved by a disjoint write grant.

## Objective

Define a bounded multi-agent and parallel subagent execution model to move from current governed closure posture to full production go-live readiness for TerraFusion OS and the broader TerraFusion ecosystem.

## Linked Artifacts

- CP-13 gate catalog: `docs/superpowers/plans/2026-03-19-cp13-production-gate-catalog.md`
- CP-14 closure packet (G3/G4): `docs/superpowers/plans/2026-03-19-cp14-tenant-rbac-isolation-closure-packet.md`

## Current Repo Truth Anchors

- Workflow closure history and phase ledger: `.governance/workflow/progress.md`
- Execution-order and dependency posture: `.governance/workflow/plan.md`
- Remediation inventory and lane sequencing: `.governance/workflow/REMEDIATION_PLAN_v1.md`
- Current proof boundary posture: `.governance/workflow/proof-posture.md`
- Existing multi-agent baseline artifact: `docs/superpowers/plans/2026-03-19-multi-agent-subagent-parallel-execution-plan.md` (this document, updated)

## Authority Stack (Truth Precedence)

1. Constitutional and governance constraints (immutable rules)
2. Current execution truth and checkpoint artifacts
3. Architecture target-state documents
4. Secondary status narratives

Rule: No target-state claim may override active execution truth without explicit proof artifacts tied to current HEAD.

## Governance Constraints

- Single-writer model for all write phases.
- Parallel subagents are read-only by default.
- Disjoint-write grants require explicit file lists, time bounds, and approver.
- Hard-stop on failed gate, scope violation, missing proof, or dependency breach.
- No implicit scope widening.
- No edits in unrelated dirty files detected at pre-flight.
- Docs-only slices may not be blocked by unrelated runtime proof requirements.
- Every phase must define its own proof surface based on touched files, active dependencies, and gate intent.
- Excluded dirty files must be fingerprinted before and after the slice when the working tree is pre-dirty.

## Agent Topology and Lane Ownership

### Core Roles

- Orchestrator Lane (human-directed, Copilot-assisted)
  - Owns phase admission, barrier decisions, and dependency unlock checks.
- Writer Lane (single writer)
  - Owns bounded edits for one active slice at a time.
- Contract-Truth Subagent Lane (parallel read-only)
  - Validates policy, scope, dependency, and constitutional alignment.
- Proof-Audit Subagent Lane (parallel read-only)
  - Runs required command wall and compiles pass/fail evidence bundles.
- Risk/Checkpoint Lane (parallel read-only)
  - Produces residual-risk updates and confirms hard-stop compliance.

### RACI

| Work Item | Writer Lane | Contract-Truth | Proof-Audit | Risk/Checkpoint | Orchestrator |
|---|---|---|---|---|---|
| Slice chartering | C | C | C | C | A/R |
| Scope validation | I | A/R | I | C | C |
| Dependency classification | I | A/R | C | C | C |
| Evidence commands | I | C | A/R | C | C |
| File modifications | A/R | I | I | I | C |
| Gate admission decision | I | C | C | C | A/R |
| Hard-stop enforcement | I | C | C | A/R | C |

Legend: R = Responsible, A = Accountable, C = Consulted, I = Informed

## Parallel Execution Model

### Phase P0 - Bootstrap and Scope Lock

Entry:
- Confirm active checkpoint posture.
- Confirm working tree containment note and excluded-file set.

Outputs:
- Bounded slice charter
- Scope file-set allowlist
- Proof command list for the slice

### Phase P1 - Parallel Recon Sweep

Run concurrently:

- Contract-Truth lane:
  - Dependency graph validation
  - Scope boundary confirmation
  - Gate preconditions checklist

- Proof-Audit lane:
  - Baseline command wall run
  - Delta report against prior closure wall

- Risk/Checkpoint lane:
  - Residual risk updates
  - Rollback trigger conditions for current slice

Outputs:
- `truth-report.md`
- `proof-report.md`
- `risk-register-delta.md`

### Phase P2 - Synchronization Barrier

Admission criteria (all required):

- No forbidden-scope conflicts
- Dependency posture explicitly classified
- Mandatory baseline proof commands green
- Residual risks documented for this slice

Decision:
- PASS -> P3 write phase opens
- FAIL -> hard stop + checkpoint note + re-entry requirements

### Phase P3 - Single Writer Execution

Rules:

- One bounded writer slice only
- No overlapping write ownership
- No edits outside explicit allowlist
- No normalization of unrelated dirty files

### Phase P4 - Closure Wall and Seal

Proof model for this superpowers plan is split into two classes:

#### A. Planning-Lane Baseline Proof (required for docs-only slices)

Required:
- changed-file set is confined to approved allowlist
- excluded dirty files retain identical fingerprints
- required artifact bundle exists for the slice
- checkpoint note records next entry condition

Example commands:

```bash
git diff --name-only
shasum -a 256 os-platform/core/pilot/ToolRunner.ts os-platform/core/pilot/ToolRunner.js
```

Docs-only green definition:

- no unauthorized file touches
- excluded dirty file fingerprints unchanged
- artifact bundle complete
- checkpoint seal written

#### B. Slice-Specific Runtime Proof (required only when a slice touches runtime code)

Runtime proof commands must be declared in that slice's `proof-commands.md` and must be relevant to the touched files and active gate.

Examples:

```bash
pnpm run type-check
pnpm vitest run <targeted-tests>
node --test os-platform/core/tests/phase83-tools.test.mjs
node --test os-platform/core/tests/phase85-tools.test.mjs
node --test os-platform/core/tests/phase86-toolrunner.test.mjs
```

Policy:

- ToolRunner- or tools-specific tests are not universal mandatory proof for every phase.
- They become mandatory only when the active slice touches those lanes or depends on their contract behavior.
- No phase may inherit unrelated runtime proof obligations by default.

Outputs:

- Closure evidence bundle
- Checkpoint update with next entry condition

## Dependency Graph (Execution Order)

```text
CP-12 Truth Reconciliation
  -> CP-13 Production Gate Matrix Buildout
    -> CP-14 Tenant + RBAC + Isolation Closure
      -> CP-15 Workbench/Suite Runtime Completeness Closure
        -> CP-16 Service Registry + Orchestration Activation Closure
          -> CP-17 SRE/Restore/DR/Hypercare Proof Pack
            -> CP-18 Security/Compliance Final Seal
              -> CP-19 Go-Live Cutover Decision Packet
```

Policy rule:
- No downstream phase opens until upstream closure evidence is green and checkpointed.

## Phase Register (Entry / Outputs / Exit Gates)

| Phase | Entry Condition | Required Outputs | Exit Gate |
|---|---|---|---|
| CP-12 Truth Reconciliation | Current checkpoint artifacts available | canonical truth ledger, normalized status table, residual-risk register | status conflicts resolved or explicitly labeled |
| CP-13 Production Gate Matrix Buildout | CP-12 sealed | gate catalog, owners, commands, artifact map | every must-pass gate has proof path |
| CP-14 Tenant + RBAC + Isolation Closure | CP-13 sealed | tenant-scope matrix, RBAC contract list, isolation proof plan | all critical tenant boundaries covered by tests |
| CP-15 Workbench/Suite Runtime Completeness Closure | CP-14 sealed | route readiness map, placeholder elimination list, runtime completeness report | every must-use route has production behavior proof |
| CP-16 Service Registry + Orchestration Activation Closure | CP-15 sealed | registry activation plan, service metadata contract, orchestration checklist | registry active and contract-verified |
| CP-17 SRE/Restore/DR/Hypercare Proof Pack | CP-16 sealed | monitoring pack, backup/restore runbooks, DR rehearsal evidence, hypercare plan | restore/failover rehearsal passes |
| CP-18 Security/Compliance Final Seal | CP-17 sealed | security closure packet, residual risk signoff, compliance evidence map | no open criticals; highs explicitly accepted or closed |
| CP-19 Go-Live Cutover Decision Packet | CP-18 sealed | go-live checklist, rollback plan, launch packet, decision memo | final go/no-go evidence bundle complete |

## Merge and Order Strategy

- Strategy: stack-safe, small bounded merges with one active write lane.
- Merge order:
  1. Docs-only truth and gate artifacts
  2. Narrow infrastructure/governance deltas
  3. Runtime behavior changes with explicit proof walls
  4. Final go-live docs and seal packet
- Every merge must include:
  - scope statement
  - proof commands and outputs
  - residual risk delta
  - rollback path

## Proof Requirements and Artifacts

For each phase, produce:

- `phase-charter.md`
- `scope-allowlist.txt`
- `proof-commands.md`
- `proof-results.md`
- `risk-register.md`
- `checkpoint-seal.md`

Definition of green for each phase:

- All mandatory proof commands pass
- No unauthorized file edits
- Dependency and scope checks pass
- Checkpoint note includes explicit next entry condition

## Rollback and Containment Rules

Trigger rollback/containment when any occur:

- Mandatory gate failure
- Scope drift or forbidden-path touch
- Missing artifact in proof bundle
- Unresolved dependency mismatch

Rollback steps:

1. Stop writer lane immediately.
2. Publish failure checkpoint with root cause and affected files.
3. Re-open only with a narrowed retry charter.
4. Preserve unrelated pre-existing dirty files without normalization.

Containment invariant for this planning lane:

- `os-platform/core/pilot/ToolRunner.ts` excluded
- `os-platform/core/pilot/ToolRunner.js` excluded
- No edits to either file in this docs-only slice

## Disjoint Write Grant Template (Only if Explicitly Approved)

Grant ID:  
Subagent:  
Mode: write-disjoint  
Allowed files:
- path/one
- path/two
Start timestamp:  
End timestamp:  
Approver:  
Barrier for activation:  

## Acceptance Criteria (This Artifact)

- Includes pre-flight dirty-tree disclaimer
- Includes excluded-file fingerprint control for pre-dirty working tree safety
- Defines parallel agent lanes and ownership
- Defines dependency graph and per-phase entry/output/exit gates
- Separates docs-only proof from slice-specific runtime proof
- Defines proof requirements and artifacts
- Defines rollback and containment rules
- Remains docs-only within `docs/superpowers/plans/**`
