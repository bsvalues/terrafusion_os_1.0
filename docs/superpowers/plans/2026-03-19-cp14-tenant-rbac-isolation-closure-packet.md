# CP-14 Tenant + RBAC + Isolation Closure Packet

Date: 2026-03-19
Branch: main
Classification: Bounded execution packet (planning + proof contract)
Parent Artifacts:
- docs/superpowers/plans/2026-03-19-multi-agent-subagent-parallel-execution-plan.md
- docs/superpowers/plans/2026-03-19-cp13-production-gate-catalog.md

## Purpose

Define the CP-14 execution and proof contract for:

- G3 Tenant Isolation Coverage Gate
- G4 RBAC Contract Closure Gate

This packet defines entry criteria, execution lanes, proof commands, artifact outputs, and hard-stop rules required to seal CP-14.

## Scope

In scope:

- county and tenant boundary enforcement surfaces
- RBAC claim enforcement for privileged actions
- policy and tool-risk checks tied to active claims
- proof artifacts and gate evidence for G3 and G4

Out of scope:

- CP-15 runtime completeness closure work
- CP-16 service registry activation work
- unrelated dirty-file normalization

## Gate Mapping

| Gate | Canonical Name | Owner | Lane | Seal Requirement |
|---|---|---|---|---|
| G3 | Tenant Isolation Coverage Gate | Platform Security Owner | Writer + Proof-Audit | all critical tenant boundaries covered by executable tests |
| G4 | RBAC Contract Closure Gate | Platform Security Owner | Writer + Contract-Truth | all privileged actions require valid claim + policy allowance |

## Entry Conditions

CP-14 may open only if all are true:

1. CP-13 gate catalog is sealed and current.
2. Active checkpoint identifies CP-14 as next phase.
3. Scope allowlist for touched files is approved.
4. Runtime proof surface is declared before first write.
5. Hard-stop policy is acknowledged by all lanes.

## Execution Lanes

- Orchestrator lane:
  - opens phase, controls barrier admissions, seals final decision.
- Writer lane:
  - implements bounded code/test/document deltas for G3/G4 only.
- Contract-Truth lane (read-only unless explicitly granted disjoint write):
  - validates RBAC claim map and policy alignment.
- Proof-Audit lane:
  - runs command wall, verifies isolation and authorization proofs.
- Risk/Checkpoint lane:
  - updates residual risk and enforces hard-stop policy.

## CP-14 Deliverables

Required artifact bundle (artifacts/cp14/):

- tenant-scope-matrix.md
- rbac-contract-list.md
- proof-commands.md
- proof-results.md
- isolation-proof.md
- rbac-proof.md
- risk-register.md
- checkpoint-seal.md

Minimum content requirements:

- tenant-scope-matrix.md:
  - all critical tenant boundaries listed
  - enforcement mechanism per boundary
  - negative-test reference per boundary
- rbac-contract-list.md:
  - privileged action catalog
  - required claim per action
  - policy/tier mapping per action
- proof-results.md:
  - command outputs and pass/fail summary
  - exact failure logs for any non-green result

## Proof Surface

Runtime proof commands are phase-scoped and tied to touched files.

Baseline required commands:

```bash
pnpm run type-check
node --test os-platform/core/tests/phase83-tools.test.mjs
```

Targeted proof commands (declare concrete paths in artifacts/cp14/proof-commands.md):

```bash
pnpm vitest run <cp14-targeted-tenant-tests>
pnpm vitest run <cp14-targeted-rbac-tests>
node --test <cp14-targeted-node-tests>
```

Optional commands for dependent lanes (only if cp14 changes require them):

```bash
node --test os-platform/core/tests/phase85-tools.test.mjs
node --test os-platform/core/tests/phase86-toolrunner.test.mjs
```

Policy:

- ToolRunner-related proofs are required only when CP-14 touches those contracts.
- No unrelated lane proofs may be imposed by default.

## Exit Gates

G3 exit gate:

- all critical tenant boundaries have executable test coverage
- no unresolved cross-tenant access path
- isolation-proof.md references passing evidence for every listed boundary

G4 exit gate:

- every privileged action maps to explicit claim + policy allowance
- no authorization bypass remains
- rbac-proof.md references passing evidence for each privileged action class

CP-14 seal condition:

- G3 green + G4 green
- proof-results.md complete
- checkpoint-seal.md records next entry condition (CP-15)

## Hard-Stop Rules

Stop phase immediately if any occurs:

- cross-tenant leakage discovered
- privileged action bypass without valid claim/policy
- required artifact missing
- scope drift outside approved allowlist

Hard-stop response:

1. publish failure checkpoint with root cause and affected scope
2. freeze new writes for CP-14
3. issue narrowed retry charter
4. rerun required proofs before re-entry

## Merge and Order Strategy

Merge order inside CP-14:

1. contract and matrix docs
2. targeted tests proving isolation and RBAC gates
3. bounded implementation changes required by failing proofs
4. final checkpoint seal and residual-risk update

No merge closes CP-14 unless G3 and G4 evidence is complete.

## Residual Risk Contract

Residual risks must be explicitly classified at close:

- accepted (with rationale and approver)
- deferred (with owner and deadline)
- blocked (hard-stop active)

No implicit risk carry-forward to CP-15.

## Acceptance Criteria

- G3 and G4 have explicit and phase-bound closure criteria
- artifact bundle paths are complete and phase-keyed
- proof commands are declared with baseline and targeted layers
- hard-stop rules and rollback actions are explicit
- packet is compatible with CP-13 gate catalog and parent parallel plan
