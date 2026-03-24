# CP-16 Service Registry + Orchestration Activation Closure Packet

Date: 2026-03-19
Branch: main
Classification: Bounded execution packet (planning + proof contract)
Parent Artifacts:
- docs/superpowers/plans/2026-03-19-multi-agent-subagent-parallel-execution-plan.md
- docs/superpowers/plans/2026-03-19-cp13-production-gate-catalog.md
- docs/superpowers/plans/2026-03-19-cp15-runtime-completeness-closure-packet.md

## Purpose

Define the CP-16 execution and proof contract for:

- G7 Service Registry Activation Gate

This packet defines entry criteria, lane ownership, proof commands, artifact outputs, and hard-stop rules required to seal CP-16.

## Scope

In scope:

- service registry metadata model validation
- startup wiring verification for registry activation
- orchestration contract checks for required services
- proof artifacts and gate evidence for G7

Out of scope:

- CP-17 SRE/restore/DR/hypercare rehearsal work
- CP-18 security/compliance final seal work
- unrelated dirty-file normalization

## Gate Mapping

| Gate | Canonical Name | Owner | Lane | Seal Requirement |
|---|---|---|---|---|
| G7 | Service Registry Activation Gate | Platform Core Owner | Writer + Contract-Truth | registry active and contract-verified for required services |

## Entry Conditions

CP-16 may open only if all are true:

1. CP-15 is sealed (G5 and G6 green).
2. CP-13 gate catalog remains current.
3. Scope allowlist for touched registry/startup files is approved.
4. Runtime proof surface is declared before first write.
5. Hard-stop and rollback rules are acknowledged by all active lanes.

## Execution Lanes

- Orchestrator lane:
  - phase admission, barrier checks, and final seal decision.
- Writer lane:
  - bounded implementation and test changes for G7 only.
- Contract-Truth lane:
  - validates registry contract alignment and startup binding intent.
- Proof-Audit lane:
  - executes command wall and verifies activation and contract proofs.
- Risk/Checkpoint lane:
  - residual-risk updates and hard-stop enforcement.

## CP-16 Deliverables

Required artifact bundle (artifacts/cp16/):

- registry-activation-plan.md
- registry-contract-proof.md
- startup-wiring-evidence.md
- proof-commands.md
- proof-results.md
- risk-register.md
- checkpoint-seal.md

Minimum content requirements:

- registry-activation-plan.md:
  - required services inventory
  - activation/wiring sequence
  - owner and fallback policy per service class
- registry-contract-proof.md:
  - service metadata contract map
  - required interface/contract assertions
  - test proof reference per required service
- startup-wiring-evidence.md:
  - startup registration verification points
  - activation checks and expected pass criteria

## Proof Surface

Runtime proof commands are phase-scoped and tied to touched files.

Baseline required commands:

```bash
pnpm run type-check
node --test os-platform/core/tests/phase83-tools.test.mjs
```

Targeted proof commands (declare concrete paths in artifacts/cp16/proof-commands.md):

```bash
pnpm vitest run <cp16-targeted-registry-tests>
node --test <cp16-targeted-startup-contract-tests>
```

Optional commands for dependent lanes (only if CP-16 changes require them):

```bash
node --test os-platform/core/tests/phase85-tools.test.mjs
node --test os-platform/core/tests/phase86-toolrunner.test.mjs
```

Policy:

- ToolRunner-related proofs are required only when CP-16 touches those contracts.
- No unrelated lane proof may be inherited by default.

## Exit Gates

G7 exit gate:

- registry activation is verified for all required services
- registry contract checks are green for required service metadata
- startup wiring evidence is complete and traceable to proof outputs
- no inactive registry path remains for required orchestration surfaces

CP-16 seal condition:

- G7 green
- proof-results.md complete
- checkpoint-seal.md records next entry condition (CP-17)

## Hard-Stop Rules

Stop phase immediately if any occurs:

- required service not activated through registry path
- startup/contract mismatch blocks required orchestration
- required artifact missing
- scope drift outside approved allowlist

Hard-stop response:

1. publish failure checkpoint with root cause and affected scope
2. freeze new writes for CP-16
3. issue narrowed retry charter
4. rerun required proofs before re-entry

## Merge and Order Strategy

Merge order inside CP-16:

1. registry and startup contract docs
2. targeted tests proving G7 activation and contract checks
3. bounded implementation changes required by failing proofs
4. checkpoint seal and residual-risk update

No merge closes CP-16 unless G7 evidence is complete.

## Residual Risk Contract

Residual risks at close must be explicitly classified:

- accepted (with rationale and approver)
- deferred (with owner and deadline)
- blocked (hard-stop active)

No implicit risk carry-forward to CP-17.

## Acceptance Criteria

- G7 has explicit and phase-bound closure criteria
- artifact bundle paths are complete and phase-keyed
- proof commands are declared with baseline and targeted layers
- hard-stop rules and rollback actions are explicit
- packet is compatible with CP-13 gate catalog and parent parallel plan
