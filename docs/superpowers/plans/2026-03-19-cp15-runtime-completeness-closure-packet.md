# CP-15 Runtime Completeness + Workbench Host Integrity Closure Packet

Date: 2026-03-19
Branch: main
Classification: Bounded execution packet (planning + proof contract)
Parent Artifacts:
- docs/superpowers/plans/2026-03-19-multi-agent-subagent-parallel-execution-plan.md
- docs/superpowers/plans/2026-03-19-cp13-production-gate-catalog.md
- docs/superpowers/plans/2026-03-19-cp14-tenant-rbac-isolation-closure-packet.md

## Purpose

Define the CP-15 execution and proof contract for:

- G5 Runtime Completeness Gate
- G6 Workbench Host Integrity Gate

This packet defines entry criteria, lane ownership, proof commands, artifact outputs, and hard-stop rules required to seal CP-15.

## Scope

In scope:

- must-use runtime route inventory and readiness closure
- elimination of placeholders on required production routes
- workbench host integrity for required tab surfaces
- runtime proof artifacts and gate evidence for G5 and G6

Out of scope:

- CP-16 service registry activation work
- CP-17 SRE/DR/hypercare rehearsal work
- unrelated dirty-file normalization

## Gate Mapping

| Gate | Canonical Name | Owner | Lane | Seal Requirement |
|---|---|---|---|---|
| G5 | Runtime Completeness Gate | Suite Runtime Owner | Writer + Proof-Audit | every must-use route exhibits production behavior proof |
| G6 | Workbench Host Integrity Gate | Workbench Owner | Writer + Proof-Audit | all required tab surfaces host real behavior with no fake-host regressions |

## Entry Conditions

CP-15 may open only if all are true:

1. CP-14 is sealed (G3 and G4 green).
2. CP-13 gate catalog remains current.
3. Scope allowlist for touched runtime files is approved.
4. Runtime proof surface is declared before first write.
5. Hard-stop and rollback rules are acknowledged by all active lanes.

## Execution Lanes

- Orchestrator lane:
  - phase admission, barrier checks, and final seal decision.
- Writer lane:
  - bounded implementation and test changes for G5/G6 only.
- Proof-Audit lane:
  - command wall execution and runtime proof validation.
- Contract-Truth lane:
  - verifies route intent and host-integrity contract alignment.
- Risk/Checkpoint lane:
  - residual risk updates and hard-stop enforcement.

## CP-15 Deliverables

Required artifact bundle (artifacts/cp15/):

- route-readiness-map.md
- runtime-completeness-report.md
- workbench-host-proof.md
- proof-commands.md
- proof-results.md
- risk-register.md
- checkpoint-seal.md

Minimum content requirements:

- route-readiness-map.md:
  - all must-use routes listed
  - required behavior per route
  - test proof reference per route
- runtime-completeness-report.md:
  - placeholder elimination status
  - route-level pass/fail posture
- workbench-host-proof.md:
  - required host tabs and expected behavior
  - proof references for real-host behavior

## Proof Surface

Runtime proof commands are phase-scoped and tied to touched files.

Baseline required commands:

```bash
pnpm run type-check
node --test os-platform/core/tests/phase83-tools.test.mjs
```

Targeted proof commands (declare concrete paths in artifacts/cp15/proof-commands.md):

```bash
pnpm vitest run <cp15-targeted-route-tests>
pnpm vitest run <cp15-targeted-workbench-host-tests>
node --test <cp15-targeted-node-tests>
```

Optional commands for dependent lanes (only if cp15 changes require them):

```bash
node --test os-platform/core/tests/phase85-tools.test.mjs
node --test os-platform/core/tests/phase86-toolrunner.test.mjs
```

Policy:

- ToolRunner-related proofs are required only when CP-15 touches those contracts.
- No unrelated lane proof may be inherited by default.

## Exit Gates

G5 exit gate:

- every must-use route has production behavior proof
- no required route remains placeholder or broken
- runtime-completeness-report.md references passing evidence for every must-use route

G6 exit gate:

- every required workbench tab host proves real behavior
- no fake-host regression remains
- workbench-host-proof.md references passing host-integrity evidence

CP-15 seal condition:

- G5 green + G6 green
- proof-results.md complete
- checkpoint-seal.md records next entry condition (CP-16)

## Hard-Stop Rules

Stop phase immediately if any occurs:

- required route remains placeholder without approved waiver
- host-integrity regression on required tab surface
- required artifact missing
- scope drift outside approved allowlist

Hard-stop response:

1. publish failure checkpoint with root cause and affected scope
2. freeze new writes for CP-15
3. issue narrowed retry charter
4. rerun required proofs before re-entry

## Merge and Order Strategy

Merge order inside CP-15:

1. route and host contract docs
2. targeted runtime tests for G5/G6
3. bounded implementation changes required by failing proofs
4. checkpoint seal and residual-risk update

No merge closes CP-15 unless G5 and G6 evidence is complete.

## Residual Risk Contract

Residual risks at close must be explicitly classified:

- accepted (with rationale and approver)
- deferred (with owner and deadline)
- blocked (hard-stop active)

No implicit risk carry-forward to CP-16.

## Acceptance Criteria

- G5 and G6 have explicit and phase-bound closure criteria
- artifact bundle paths are complete and phase-keyed
- proof commands are declared with baseline and targeted layers
- hard-stop rules and rollback actions are explicit
- packet is compatible with CP-13 gate catalog and parent parallel plan
