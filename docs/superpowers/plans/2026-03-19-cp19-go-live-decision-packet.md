# CP-19 Go-Live Decision Packet

Date: 2026-03-19
Branch: main
Classification: Bounded execution packet (planning + proof contract)
Parent Artifacts:
- docs/superpowers/plans/2026-03-19-multi-agent-subagent-parallel-execution-plan.md
- docs/superpowers/plans/2026-03-19-cp13-production-gate-catalog.md
- docs/superpowers/plans/2026-03-19-cp18-security-compliance-seal-packet.md

## Purpose

Define the CP-19 execution and proof contract for:

- G10 Go-Live Decision Gate

This packet defines entry criteria, lane ownership, final decision evidence, rollback contract, and hard-stop rules required to make a valid go/no-go launch decision.

## Scope

In scope:

- final go-live checklist definition and completion contract
- rollback plan and launch packet evidence requirements
- decision memo structure and signoff workflow
- proof artifacts and gate evidence for G10

Out of scope:

- post-launch feature work
- unrelated runtime refactors
- unrelated dirty-file normalization

## Gate Mapping

| Gate | Canonical Name | Owner | Lane | Seal Requirement |
|---|---|---|---|---|
| G10 | Go-Live Decision Gate | Founder/Release Authority | Orchestrator + Risk/Checkpoint | full go/no-go packet complete and signed |

## Entry Conditions

CP-19 may open only if all are true:

1. CP-18 is sealed (G9 green).
2. All upstream gate seals (G1-G9) are present and verifiable.
3. Release authority and signoff delegates are named.
4. Scope allowlist for touched launch artifacts is approved.
5. Rollback ownership and execution path are confirmed before first write.

## Execution Lanes

- Orchestrator lane:
  - phase admission, launch-decision facilitation, and final signoff routing.
- Risk/Checkpoint lane:
  - validates residual-risk carry-forward and rollback readiness.
- Proof-Audit lane:
  - verifies completeness and consistency of go/no-go evidence bundle.
- Contract-Truth lane:
  - confirms upstream gate-seal integrity and decision-policy alignment.
- Writer lane:
  - bounded updates to launch docs/checklists/decision artifacts required to close gaps.

## CP-19 Deliverables

Required artifact bundle (docs/superpowers/artifacts/cp19/):

- go-live-checklist.md
- rollback-plan.md
- decision-memo.md
- launch-packet.md
- proof-commands.md
- proof-results.md
- risk-register.md
- checkpoint-seal.md

Minimum content requirements:

- go-live-checklist.md:
  - gate-by-gate evidence references (G1-G10)
  - unresolved-item list (must be empty or explicitly waived)
  - final readiness status by owner
- rollback-plan.md:
  - trigger conditions and abort criteria
  - rollback sequence and timing targets
  - command/operator ownership matrix
- decision-memo.md:
  - go/no-go recommendation and rationale
  - explicit residual-risk statement
  - required signatures and timestamped approvals
- launch-packet.md:
  - launch window and run-of-show
  - communication plan and escalation tree
  - post-launch validation checkpoints

## Proof Surface

Proof commands are phase-scoped and tied to touched files.

Baseline required commands:

```bash
pnpm run type-check
node --test os-platform/core/tests/phase83-tools.test.mjs
```

Targeted go-live decision commands (declare concrete commands in docs/superpowers/artifacts/cp19/proof-commands.md):

```bash
<cp19-gate-seal-integrity-check-command>
<cp19-launch-packet-completeness-check-command>
<cp19-rollback-readiness-check-command>
```

Optional commands for dependent lanes (only if CP-19 changes require them):

```bash
node --test os-platform/core/tests/phase85-tools.test.mjs
node --test os-platform/core/tests/phase86-toolrunner.test.mjs
```

Policy:

- CP-19 is a decision and readiness seal phase; missing evidence is a blocker, not a warning.
- No go decision is valid without signed decision-memo.md and rollback-plan.md.

## Exit Gates

G10 exit gate:

- go-live-checklist.md complete with verifiable references
- rollback-plan.md complete with owner signoff
- decision-memo.md signed by release authority
- launch-packet.md complete and checkpointed

CP-19 seal condition:

- G10 green
- checkpoint-seal.md records the final go/no-go outcome and timestamp
- all required approvals attached and traceable

## Hard-Stop Rules

Stop phase immediately if any occurs:

- missing upstream gate evidence for any required seal
- unsigned decision memo or missing release-authority approval
- incomplete rollback plan or missing rollback owner
- required artifact missing
- scope drift outside approved allowlist

Hard-stop response:

1. publish failure checkpoint with root cause and affected scope
2. freeze new writes for CP-19
3. issue narrowed retry charter
4. rerun decision completeness checks before re-entry

## Merge and Order Strategy

Merge order inside CP-19:

1. final checklist and evidence cross-linking
2. rollback plan and launch packet closure
3. decision memo signoff and checkpoint seal

No merge closes CP-19 unless G10 evidence bundle is complete and signed.

## Residual Risk Contract

Residual risks at close must be explicitly classified:

- accepted (with approver and review interval)
- deferred (with owner and target date)
- blocked (hard-stop active)

No implicit residual risk beyond final decision packet.

## Acceptance Criteria

- G10 has explicit and phase-bound closure criteria
- artifact bundle paths are complete and phase-keyed
- proof commands are declared with baseline and targeted layers
- hard-stop rules and rollback actions are explicit
- packet is compatible with CP-13 gate catalog and parent parallel plan

## Execution Snapshot (2026-03-19 Session 3)

Latest CP-19 command-wall rerun:

| Command | Exit Code | Status | Notes |
|---|---|---|---|
| `pnpm run governance:check` | 0 | pass | 56/56 (phase83), 22/22 (phase85), 9/9 (phase86), generated headers verified |
| `pnpm run ci:governance-proof` | 0 | pass | scope proof + governance sentinel complete |
| `pwsh -File ops/dev/tf.ps1 status` | 0 | blocked | WSL/Docker connectivity error `Wsl/Service/0x8007274c` |

Phase 5 Honesty Sweep status:

- `CostManual.tsx`: remediated to API-first with explicit sample fallback
- `BatchCostRun.tsx`: remediated to live preview/apply + TerraTrace invoke/result events
- Contract tests: 105/105 pass (`w5dHonestySweep`, `w5eUIContractProof`)

Current CP-19 blocker set:

- Upstream gates G3-G9 still pending seal completion
- Local Docker/WSL environment unavailable for `tf.ps1 status`

## Execution Snapshot (2026-03-19 Session 4)

Latest CP-18 command-wall rerun:

| Command | Exit Code | Status | Notes |
|---|---|---|---|
| `pnpm run security:scan` | 0 | pass | optional scanner config absent (skip notice) |
| `pnpm run validate:compliance` | 0 | soft-blocked | logs `MCP system not initialized. Run: npm run mcp:init` |
| `pnpm run ci:dependency-scope-quarantine:gate` | 0 | pass | current 15 vs baseline 141 (net -126) |

Latest CP-19 environment check rerun:

| Command | Exit Code | Status | Notes |
|---|---|---|---|
| `pwsh -File ops/dev/tf.ps1 status` | 0 | blocked | WSL/Docker connectivity error `Wsl/Service/0x8007274c` |

Interpretation:

- CP-18 remains blocked until MCP initialization is completed and `validate:compliance` runs without MCP warnings.
- CP-19 remains blocked on upstream gates and Docker/WSL environment readiness.

## Execution Snapshot (2026-03-19 Session 5)

MCP/bootstrap rerun after path-consistency fix in `scripts/mcp-init-validation.cjs`:

| Command | Exit Code | Status | Notes |
|---|---|---|---|
| `pnpm run mcp:init` | 0 | pass | 87 MCP tools initialized; manifest + Claude-Flow + AI swarm integration validated |
| `pnpm run mcp:validate` | 0 | pass | MCP system operational across all 9 tool categories |
| `pnpm run validate:compliance` | 0 | pass | compliance audit chain completed; only optional scanner skip remains |

Impact on gate status:

- MCP initialization blocker is cleared for CP-18.
- CP-18 remains blocked on upstream gate seals and swarm runtime evidence.
- CP-19 remains blocked on upstream gates and Docker/WSL environment readiness.

## Execution Snapshot (2026-03-19 Session 6)

CP-14 controller audit completed (read-only) for G3/G4 targets:

| Controller | Finding | Gate Impact |
|---|---|---|
| `PropertiesController` | optional `countyId`; no required missing/mismatch 400/403 enforcement across key endpoints | G3 fail |
| `DaisController` | missing county claim path returns 403 (`Forbid`) rather than required 401 fail-closed | G3 fail |
| `MarketplaceController` | no class-level `[Authorize]`; stub rating/download helpers still present | G4 fail |

Resulting status:

- G3: fail (controller isolation contract gaps)
- G4: fail (controller RBAC contract gaps)
- CP-19: remains blocked pending backend writer-lane implementation for CP-14 closure
