# CP-17 SRE + Restore/DR + Hypercare Closure Packet

Date: 2026-03-19
Branch: main
Classification: Bounded execution packet (planning + proof contract)
Parent Artifacts:
- docs/superpowers/plans/2026-03-19-multi-agent-subagent-parallel-execution-plan.md
- docs/superpowers/plans/2026-03-19-cp13-production-gate-catalog.md
- docs/superpowers/plans/2026-03-19-cp16-service-registry-orchestration-closure-packet.md

## Purpose

Define the CP-17 execution and proof contract for:

- G8 SRE/Restore/DR Gate

This packet defines entry criteria, lane ownership, rehearsal proof commands, artifact outputs, and hard-stop rules required to seal CP-17.

## Scope

In scope:

- SRE operational pack definition
- backup and restore rehearsal evidence
- failover/DR rehearsal evidence
- hypercare readiness plan and escalation map
- proof artifacts and gate evidence for G8

Out of scope:

- CP-18 security/compliance final seal work
- CP-19 go-live decision packet work
- unrelated dirty-file normalization

## Gate Mapping

| Gate | Canonical Name | Owner | Lane | Seal Requirement |
|---|---|---|---|---|
| G8 | SRE/Restore/DR Gate | Operations Owner | Proof-Audit + Risk/Checkpoint | restore/failover rehearsals pass with evidence |

## Entry Conditions

CP-17 may open only if all are true:

1. CP-16 is sealed (G7 green).
2. CP-13 gate catalog remains current.
3. Scope allowlist for touched operational artifacts and scripts is approved.
4. Rehearsal proof surface is declared before first write.
5. Hard-stop and rollback rules are acknowledged by all active lanes.

## Execution Lanes

- Orchestrator lane:
  - phase admission, barrier checks, and final seal decision.
- Proof-Audit lane:
  - runs restore/failover/alert rehearsal command wall and captures proof.
- Risk/Checkpoint lane:
  - validates hypercare posture and enforces hard-stop policy.
- Contract-Truth lane:
  - validates runbooks/escalation contracts and operational ownership.
- Writer lane:
  - bounded updates to operational docs/scripts required to close failing proofs.

## CP-17 Deliverables

Required artifact bundle (artifacts/cp17/):

- sre-pack.md
- restore-proof.md
- dr-proof.md
- hypercare-plan.md
- proof-commands.md
- proof-results.md
- risk-register.md
- checkpoint-seal.md

Minimum content requirements:

- sre-pack.md:
  - monitoring profile
  - alert classes and thresholds
  - ownership and escalation routes
- restore-proof.md:
  - backup source and restore target definitions
  - rehearsal procedure and pass criteria
  - evidence references (logs, timestamps, checks)
- dr-proof.md:
  - failover rehearsal scope
  - rollback/recovery path
  - pass/fail evidence and timing notes
- hypercare-plan.md:
  - launch window support model
  - on-call rotation and escalation matrix
  - incident triage and communication protocol

## Proof Surface

Rehearsal proof commands are phase-scoped and tied to touched files.

Baseline required commands:

```bash
pnpm run type-check
node --test os-platform/core/tests/phase83-tools.test.mjs
```

Targeted rehearsal commands (declare concrete commands in artifacts/cp17/proof-commands.md):

```bash
<cp17-restore-rehearsal-command>
<cp17-failover-rehearsal-command>
<cp17-alert-verification-command>
```

Optional commands for dependent lanes (only if CP-17 changes require them):

```bash
node --test os-platform/core/tests/phase85-tools.test.mjs
node --test os-platform/core/tests/phase86-toolrunner.test.mjs
```

Policy:

- ToolRunner-related proofs are required only when CP-17 touches those contracts.
- No unrelated lane proof may be inherited by default.

## Exit Gates

G8 exit gate:

- restore rehearsal passes with complete evidence
- failover/DR rehearsal passes with complete evidence
- alerting checks pass for defined critical classes
- hypercare plan is complete with explicit ownership and escalation paths

CP-17 seal condition:

- G8 green
- proof-results.md complete
- checkpoint-seal.md records next entry condition (CP-18)

## Hard-Stop Rules

Stop phase immediately if any occurs:

- restore rehearsal fails
- failover/DR rehearsal fails
- critical alert verification missing or failing
- required artifact missing
- scope drift outside approved allowlist

Hard-stop response:

1. publish failure checkpoint with root cause and affected scope
2. freeze new writes for CP-17
3. issue narrowed retry charter
4. rerun required rehearsals before re-entry

## Merge and Order Strategy

Merge order inside CP-17:

1. operational runbook and rehearsal contract docs
2. targeted rehearsal command definitions and proof scaffolds
3. bounded implementation changes required by failing rehearsals
4. checkpoint seal and residual-risk update

No merge closes CP-17 unless G8 evidence is complete.

## Residual Risk Contract

Residual risks at close must be explicitly classified:

- accepted (with rationale and approver)
- deferred (with owner and deadline)
- blocked (hard-stop active)

No implicit risk carry-forward to CP-18.

## Acceptance Criteria

- G8 has explicit and phase-bound closure criteria
- artifact bundle paths are complete and phase-keyed
- rehearsal proof commands are declared with baseline and targeted layers
- hard-stop rules and rollback actions are explicit
- packet is compatible with CP-13 gate catalog and parent parallel plan
