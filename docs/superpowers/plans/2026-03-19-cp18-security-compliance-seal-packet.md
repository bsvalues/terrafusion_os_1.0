# CP-18 Security + Compliance Seal Packet

Date: 2026-03-19
Branch: main
Classification: Bounded execution packet (planning + proof contract)
Parent Artifacts:
- docs/superpowers/plans/2026-03-19-multi-agent-subagent-parallel-execution-plan.md
- docs/superpowers/plans/2026-03-19-cp13-production-gate-catalog.md
- docs/superpowers/plans/2026-03-19-cp17-sre-restore-dr-hypercare-closure-packet.md

## Purpose

Define the CP-18 execution and proof contract for:

- G9 Security/Compliance Seal Gate

This packet defines entry criteria, lane ownership, security and compliance evidence surfaces, residual-risk decision policy, and hard-stop rules required to seal CP-18.

## Scope

In scope:

- security closure packet definition and evidence contract
- compliance evidence map for mandatory controls
- residual-risk signoff workflow
- proof artifacts and gate evidence for G9

Out of scope:

- CP-19 go-live decision packet work
- unrelated runtime feature expansion
- unrelated dirty-file normalization

## Gate Mapping

| Gate | Canonical Name | Owner | Lane | Seal Requirement |
|---|---|---|---|---|
| G9 | Security/Compliance Seal Gate | Security Owner | Contract-Truth + Proof-Audit | zero open criticals; highs closed or explicitly accepted |

## Entry Conditions

CP-18 may open only if all are true:

1. CP-17 is sealed (G8 green).
2. Security vulnerability register is current and triaged.
3. Compliance evidence sources are mapped to control families.
4. Scope allowlist for touched files is approved.
5. Residual-risk decision authority is named before first write.

## Execution Lanes

- Orchestrator lane:
  - phase admission, barrier checks, and final seal decision.
- Contract-Truth lane:
  - validates control interpretation, policy coverage, and exception handling contract.
- Proof-Audit lane:
  - runs security closure checks and captures objective proof outputs.
- Risk/Checkpoint lane:
  - enforces residual-risk signoff completeness and hard-stop policy.
- Writer lane:
  - bounded updates to docs/config/scripts needed to close failing security/compliance proofs.

## CP-18 Deliverables

Required artifact bundle (artifacts/cp18/):

- security-closure-packet.md
- compliance-evidence-map.md
- residual-risk-signoff.md
- proof-commands.md
- proof-results.md
- risk-register.md
- checkpoint-seal.md

Minimum content requirements:

- security-closure-packet.md:
  - vulnerability summary by severity
  - remediation status and ownership
  - exception records with rationale
- compliance-evidence-map.md:
  - mandatory control inventory
  - control-to-evidence mapping
  - evidence freshness/date and owner
- residual-risk-signoff.md:
  - accepted high risks with approver and expiry/review date
  - deferred items with owner and deadline
  - explicit statement of zero open criticals

## Proof Surface

Proof commands are phase-scoped and tied to touched files.

Baseline required commands:

```bash
pnpm run type-check
node --test os-platform/core/tests/phase83-tools.test.mjs
```

Targeted security/compliance commands (declare concrete commands in artifacts/cp18/proof-commands.md):

```bash
<cp18-security-closure-check-command>
<cp18-compliance-evidence-validation-command>
<cp18-vulnerability-register-verification-command>
```

Optional commands for dependent lanes (only if CP-18 changes require them):

```bash
node --test os-platform/core/tests/phase85-tools.test.mjs
node --test os-platform/core/tests/phase86-toolrunner.test.mjs
```

Policy:

- ToolRunner-related proofs are required only when CP-18 touches those contracts.
- High severity findings require explicit close or acceptance decision; implicit carry-forward is forbidden.

## Exit Gates

G9 exit gate:

- no open critical vulnerabilities
- every high is either closed or explicitly accepted with approver and rationale
- compliance evidence map is complete for mandatory controls
- proof-results.md and risk-register.md are complete and internally consistent

CP-18 seal condition:

- G9 green
- residual-risk-signoff.md signed by designated authority
- checkpoint-seal.md records next entry condition (CP-19)

## Hard-Stop Rules

Stop phase immediately if any occurs:

- any critical remains open
- high severity issue has no explicit decision
- mandatory control has missing or stale evidence without approved exception
- required artifact missing
- scope drift outside approved allowlist

Hard-stop response:

1. publish failure checkpoint with root cause and affected scope
2. freeze new writes for CP-18
3. issue narrowed retry charter
4. rerun required closure checks before re-entry

## Merge and Order Strategy

Merge order inside CP-18:

1. vulnerability and control evidence mapping artifacts
2. targeted remediation/contract updates required by failing checks
3. residual-risk signoff and checkpoint seal

No merge closes CP-18 unless G9 evidence bundle is complete.

## Residual Risk Contract

Residual risks at close must be explicitly classified:

- accepted (with approver, rationale, and review date)
- deferred (with owner and deadline)
- blocked (hard-stop active)

No implicit risk carry-forward to CP-19.

## Acceptance Criteria

- G9 has explicit and phase-bound closure criteria
- artifact bundle paths are complete and phase-keyed
- proof commands are declared with baseline and targeted layers
- hard-stop rules and rollback actions are explicit
- packet is compatible with CP-13 gate catalog and parent parallel plan
