# Multi-Agent + Subagent Parallel Execution Plan (CP-12 Through Go-Live)

Date: 2026-03-19  
Branch: main  
Classification: Docs-only superpowers artifact (bounded planning; no execution authority)

## Pre-Flight Scope Disclaimer

- Working tree was already dirty before this task started.
- Unexpected pre-existing changes were detected in `os-platform/core/pilot/ToolRunner.ts` and `os-platform/core/pilot/ToolRunner.js`.
- Those files are intentionally excluded from this plan scope.
- This artifact is limited to `docs/superpowers/plans/**` and does not normalize unrelated dirty files.

## Objective

Define a bounded multi-agent and parallel subagent execution model to move from current governed closure posture to full production go-live readiness for TerraFusion OS and the broader TerraFusion ecosystem.

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

Required proof minimum:

```bash
pnpm run type-check
node --test os-platform/core/tests/phase83-tools.test.mjs
```

Optional lane proofs (when applicable):

```bash
pnpm vitest run <targeted-tests>
node --test os-platform/core/tests/phase85-tools.test.mjs
node --test os-platform/core/tests/phase86-toolrunner.test.mjs
```

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
- Defines parallel agent lanes and ownership
- Defines dependency graph and merge order strategy
- Defines proof requirements and artifacts
- Defines rollback and containment rules
- Remains docs-only within `docs/superpowers/plans/**`
