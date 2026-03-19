# CP-13 Production Gate Catalog

Date: 2026-03-19
Branch: main
Classification: Docs-only superpowers artifact (gate matrix for CP-13)
Parent Plan: docs/superpowers/plans/2026-03-19-multi-agent-subagent-parallel-execution-plan.md

## Pre-Flight Scope Disclaimer

- Working tree was already dirty before this docs-only slice.
- This artifact is limited to docs/superpowers/plans/**.
- Unrelated dirty files are intentionally excluded from this task.
- This file defines gate catalog structure and proof paths only; it does not authorize runtime execution.

## Purpose

Define one canonical, phase-keyed gate catalog for CP-13 through CP-19 with:

- explicit gate owner
- execution lane ownership
- command wall mapping
- required artifact bundle pathing
- pass/fail decision rule
- rollback trigger and containment rule

## Authority and Policy

Truth precedence for gate decisions:

1. Constitutional/governance constraints
2. Active execution truth and checkpoint artifacts
3. Architecture target-state documents
4. Secondary status narratives

Global policy:

- A downstream phase cannot open until all upstream exit gates are green and checkpointed.
- Docs-only slices cannot inherit unrelated runtime proof obligations.
- Runtime slices must declare proof surfaces specific to touched files and active dependency intent.

## Gate Catalog

| Gate ID | Phase | Gate Name | Owner | Execution Lane | Required Inputs | Command Wall | Required Artifacts | Pass Rule | Fail Rule | Rollback Trigger |
|---|---|---|---|---|---|---|---|---|---|---|
| G1 | CP-12 | Truth Reconciliation Gate | Orchestrator | Contract-Truth + Risk/Checkpoint | current checkpoint artifacts, status ledgers, proof posture note | docs consistency checks, stale-claim scan | artifacts/cp12/truth-ledger.md, artifacts/cp12/status-normalization.md, artifacts/cp12/risk-register.md | all conflicting claims resolved or explicitly labeled | unresolved conflict in canonical status | contradiction found in active checkpoint claim |
| G2 | CP-13 | Gate Matrix Completeness Gate | Orchestrator | Contract-Truth + Proof-Audit | CP-12 sealed outputs | command/artifact mapping validation | artifacts/cp13/gate-catalog.md, artifacts/cp13/owner-map.md, artifacts/cp13/proof-path-map.md | every must-pass gate has owner, command path, artifact path | any gate missing owner/command/artifact map | missing mandatory gate field |
| G3 | CP-14 | Tenant Isolation Coverage Gate | Platform Security Owner | Writer + Proof-Audit | tenant boundary map, county isolation contracts | targeted isolation tests, negative access tests | artifacts/cp14/tenant-scope-matrix.md, artifacts/cp14/isolation-proof.md | all critical tenant boundaries covered by executable tests | uncovered critical boundary or failing isolation test | cross-tenant access path detected |
| G4 | CP-14 | RBAC Contract Closure Gate | Platform Security Owner | Writer + Contract-Truth | RBAC claim map, tool risk map | targeted policy/authorization tests | artifacts/cp14/rbac-contract-list.md, artifacts/cp14/rbac-proof.md | all privileged actions require valid claim + policy allowance | any privileged path bypasses claim/policy checks | authorization bypass discovered |
| G5 | CP-15 | Runtime Completeness Gate | Suite Runtime Owner | Writer + Proof-Audit | route inventory, must-use workflow list | targeted route tests, smoke journey set | artifacts/cp15/route-readiness-map.md, artifacts/cp15/runtime-completeness-report.md | every must-use route exhibits production behavior proof | placeholder path or broken route remains | must-use workflow cannot complete |
| G6 | CP-15 | Workbench Host Integrity Gate | Workbench Owner | Writer + Proof-Audit | workbench host inventory, tab-surface mapping | host integrity tests and journey proofs | artifacts/cp15/workbench-host-proof.md | all required tab surfaces host real behavior, no fake-host regressions | host fallback/placeholder in required surface | host-integrity regression detected |
| G7 | CP-16 | Service Registry Activation Gate | Platform Core Owner | Writer + Contract-Truth | registry metadata model, startup wiring plan | startup wiring verification + contract checks | artifacts/cp16/registry-activation-plan.md, artifacts/cp16/registry-contract-proof.md | registry active and contract-verified for required services | inactive registry or contract mismatch | startup/contract mismatch blocks orchestration |
| G8 | CP-17 | SRE/Restore/DR Gate | Operations Owner | Proof-Audit + Risk/Checkpoint | monitoring profile, backup and DR runbooks | restore rehearsal, failover rehearsal, alert checks | artifacts/cp17/sre-pack.md, artifacts/cp17/restore-proof.md, artifacts/cp17/dr-proof.md, artifacts/cp17/hypercare-plan.md | restore/failover rehearsals pass with evidence | any rehearsal fails or has no evidence | unrecoverable recovery-path failure |
| G9 | CP-18 | Security/Compliance Seal Gate | Security Owner | Contract-Truth + Proof-Audit | vulnerability register, compliance evidence map | security closure checks and mandatory control proofs | artifacts/cp18/security-closure-packet.md, artifacts/cp18/compliance-evidence-map.md, artifacts/cp18/residual-risk-signoff.md | zero open criticals; highs closed or explicitly accepted | open critical remains or high lacks explicit decision | unresolved critical vulnerability |
| G10 | CP-19 | Go-Live Decision Gate | Founder/Release Authority | Orchestrator + Risk/Checkpoint | all prior phase seals, launch and rollback packet | final decision checklist verification | artifacts/cp19/go-live-checklist.md, artifacts/cp19/rollback-plan.md, artifacts/cp19/decision-memo.md | full go/no-go packet complete and signed | missing gate evidence or unsigned decision packet | go-live packet incomplete |

## Standard Command Wall Profiles

Docs-only profile (CP-12/CP-13 and docs slices):

```bash
git status --short
git diff --name-only
```

Runtime profile (phase-specific; declare in proof-commands.md):

```bash
pnpm run type-check
pnpm vitest run <targeted-tests>
node --test os-platform/core/tests/phase83-tools.test.mjs
node --test os-platform/core/tests/phase85-tools.test.mjs
node --test os-platform/core/tests/phase86-toolrunner.test.mjs
```

Rule: ToolRunner or tools tests are mandatory only when the active slice touches those lanes or depends on their contract behavior.

## Artifact Bundle Convention

Per phase, use this structure under artifacts/<phase>/:

- phase-charter.md
- scope-allowlist.txt
- proof-commands.md
- proof-results.md
- risk-register.md
- checkpoint-seal.md

## Handoff and Merge Rules

- Single writer lane for all write phases.
- Parallel subagents stay read-only unless a disjoint-write grant is approved.
- Each merge must include: scope statement, proof command outputs, residual-risk delta, rollback path.
- Merge order:
  1. docs-only truth and gate artifacts
  2. infra/governance deltas
  3. runtime behavior slices with explicit proofs
  4. final go-live packet

## Hard-Stop and Re-Entry

Hard-stop when any occurs:

- failed mandatory gate
- scope drift or forbidden-path touch
- missing required artifact
- unresolved dependency mismatch

Re-entry requires:

- failure checkpoint with root cause and affected scope
- narrowed retry charter
- updated proof surface tied to touched files

## Acceptance Criteria

- One row per must-pass gate from CP-12 to CP-19
- Every row includes owner, lane, command wall, required artifacts, pass/fail rule, rollback trigger
- Explicit separation between docs-only and runtime proof surfaces
- Compatible with parent parallel execution plan and checkpoint model
- Docs-only scope preserved under docs/superpowers/plans/**
