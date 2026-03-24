# Copilot Deep-Dive Execution Plan — Full Ecosystem Go-Live

Date: 2026-03-19
Status: Draft for execution
Authority Input:
- docs/superpowers/specs/2026-03-19-full-ecosystem-go-live-roadmap-design.md
- docs/superpowers/plans/2026-03-19-multi-agent-subagent-parallel-execution-plan.md
- docs/superpowers/plans/2026-03-19-cp13-production-gate-catalog.md

## Purpose

Translate the locked full-ecosystem go-live roadmap into a Copilot-executable lane plan that preserves governance constraints and phase ordering while making each step operationally concrete.

This plan mirrors the canonical order:

- Phase -1 (Truth Gate)
- Sprint 0 (Completion Tasks)
- Phase 1 (CP-14 Runtime)
- Phase 2 (CP-15 Runtime)
- Phase 3 (CP-16 Runtime)
- Phase 4 (PR #656 Integrity Verification)
- Phase 5 (Honesty Sweep)
- Phase 6 (CP-17 SRE/Ops)
- Phase 7 (CP-18 Security/Compliance)
- Phase 8 (AI Swarm Stability)
- Phase 9 (TerraCanon Codex, post-25th)
- Phase X (CP-19 Final Decision)

## Copilot Lane Contract

### Operating Model

- One active writer lane at a time.
- Parallel subagents are read-only unless explicitly granted disjoint write scope.
- No downstream phase opens until upstream gate is green and checkpointed.
- Any failed mandatory gate triggers immediate hard-stop.

### Scope Boundaries

Primary write scope for Copilot execution:

- docs/superpowers/plans/**
- docs/superpowers/artifacts/**
- .governance/workflow/**
- os-platform/core/pilot/**
- os-platform/core/types/**
- tools/registry/**
- tsconfig.core.json
- package.json

Out-of-scope for Copilot lane unless explicit exception is granted:

- ARCHIVE paths
- specialized paths
- applications paths
- os-platform/ai-systems/ai-systems/ai-swarm/**

When a phase requires out-of-scope implementation edits, Copilot produces contract and proof artifacts, then hands off bounded write execution to the authorized lane.

## Phase Matrix (Copilot Deep-Dive)

| Phase | Gate | Copilot Primary Output | Copilot Command Wall | Exit Condition |
|---|---|---|---|---|
| Phase -1 | Truth Gate | truth gate runbook + evidence ledger | dotnet build, pnpm run type-check, phase83/85/86, auth suite snapshot | Truth Gate artifact published and green or blockers isolated |
| Sprint 0 | Sprint 0 Gate | closure checklist for S0-A..S0-F + PACS proof packet | targeted PACS tests + acceptance count check | all completion items closed and evidence checkpointed |
| Phase 1 | G3/G4 | isolation/rbac closure deltas + cp14 artifacts | phase83, phase85, targeted isolation tests | county boundaries and policy checks proven |
| Phase 2 | G5/G6 | route completeness and workbench host evidence | type-check + targeted system integration runs | no placeholders/fallbacks on required routes/tabs |
| Phase 3 | G7 | service-registry and multi-county evidence pack | registry checks + county environment proofs | registry active, contract-verified, county isolation proven |
| Phase 4 | R3 Integrity Gate | pr656-integrity-proof + frozen evidence verification | gh pr view, git object verify, full gate suite rerun | PR #656 integrity and R1 evidence continuity proven |
| Phase 5 | Honesty Gate | honesty sweep report + fix ledger | targeted frontend/data-path checks + proof logs | all named surfaces classified REAL |
| Phase 6 | G8 | cp17 rehearsal artifacts complete | restore/failover/break-glass drills + baseline gates | SRE rehearsals pass with auditable evidence |
| Phase 7 | G9 | cp18 security/compliance pack complete | security/compliance scripts + vuln closure checks | zero open criticals; highs closed/accepted |
| Phase 8 | Swarm Stability Gate | load and queue-guard evidence packet | load test + break-glass with swarm active | 1,008-agent stability proven in staging |
| Phase 9 | Codex Gate | TerraCanon codex integration packet | codex e2e + canon tests | codex features proven end-to-end |
| Phase X | G10 | final decision packet and signoff memo | governance:check + go-live checklist integrity checks | go/no-go packet complete and signed |

## Phase-by-Phase Copilot Execution Detail

## Phase -1 — Truth Gate (Immediate Next Action)

Copilot actions:

1. Create/update Truth Gate artifact template in .governance/workflow.
2. Run canonical gate command wall and capture exact pass/fail counts.
3. If any command fails, isolate blocker set only, no opportunistic fixes.

Command wall:

```bash
dotnet build TerraFusion.sln --configuration Release
pnpm run type-check
node --test os-platform/core/tests/phase83-tools.test.mjs
node --test os-platform/core/tests/phase85-tools.test.mjs
node --test os-platform/core/tests/phase86-toolrunner.test.mjs
```

Conditional auth snapshot command:

```bash
pnpm vitest run src/__tests__/auth/
```

Artifacts:

- .governance/workflow/TRUTH_GATE_2026-03-19.md
- docs/superpowers/artifacts/cp19/go-live-checklist.md (Gate G1/G2 evidence backfill)

Hard-stop triggers:

- any gate command red
- count regression from canonical baseline
- missing artifact ledger

## Sprint 0 — Completion Closure

Copilot actions:

1. Build Sprint-0 checklist tracker doc with S0-A through S0-F objective evidence fields.
2. Capture PACS deployment, connection, and test proof references.
3. Record r1 acceptance expected-count update verification.

Artifacts:

- docs/superpowers/artifacts/cp14/sprint0-closure-checklist.md
- docs/superpowers/artifacts/cp14/pacs-proof.md

Hard-stop triggers:

- live clone PACS tests not green
- count mismatch unresolved

## Phase 1 — CP-14 Runtime (G3/G4)

Copilot actions:

1. Keep cp14 packet aligned to real implementation status.
2. Capture executable isolation and RBAC proof outputs in cp14 artifacts.
3. Publish checkpoint with explicit remaining risks.

Artifacts:

- docs/superpowers/artifacts/cp14/isolation-proof.md
- docs/superpowers/artifacts/cp14/rbac-proof.md
- docs/superpowers/artifacts/cp14/checkpoint-seal.md

## Phase 2 — CP-15 Runtime (G5/G6)

Copilot actions:

1. Maintain route readiness map with per-route real/placeholder classification.
2. Capture workbench-host proof for Forge/Atlas/Dais required tabs.
3. Track integration test outcomes and unresolved blockers.

Artifacts:

- docs/superpowers/artifacts/cp15/route-readiness-map.md
- docs/superpowers/artifacts/cp15/workbench-host-proof.md
- docs/superpowers/artifacts/cp15/checkpoint-seal.md

## Phase 3 — CP-16 Runtime (G7)

Copilot actions:

1. Capture service registry activation and contract verification outputs.
2. Maintain county proof packets for Yakima and Cowlitz isolation.
3. Record onboarding runbook validation outcomes.

Artifacts:

- docs/superpowers/artifacts/cp16/registry-contract-proof.md
- docs/superpowers/artifacts/cp16/yakima-proof.md
- docs/superpowers/artifacts/cp16/cowlitz-proof.md
- docs/superpowers/artifacts/cp16/checkpoint-seal.md

## Phase 4 — PR #656 Integrity Verification

Copilot actions:

1. Record PR state and merge metadata snapshot.
2. Verify signed SHA presence and frozen R1 artifact continuity.
3. Re-run full gate suite and publish integrity proof.

Artifacts:

- docs/superpowers/artifacts/cp-r3/pr656-integrity-proof.md
- docs/superpowers/artifacts/cp-r3/gate-rerun-results.md

## Phase 5 — Honesty Sweep

Copilot actions:

1. Trace the four named surfaces end-to-end.
2. Classify each REAL or HONESTY VIOLATION with evidence.
3. Track fixes and reclassify only after proof.

Artifacts:

- .governance/workflow/HONESTY_SWEEP_2026-03-19.md

## Phase 6 — CP-17 SRE/Ops (G8)

Copilot actions:

1. Maintain restore/failover/break-glass drill evidence pages.
2. Keep hypercare runbook tied to escalation ownership.
3. Seal CP-17 only after all drills have logs and timestamps.

Artifacts:

- docs/superpowers/artifacts/cp17/restore-proof.md
- docs/superpowers/artifacts/cp17/dr-proof.md
- docs/superpowers/artifacts/cp17/sre-pack.md
- docs/superpowers/artifacts/cp17/hypercare-plan.md

## Phase 7 — CP-18 Security/Compliance (G9)

Copilot actions:

1. Assemble FISMA evidence map and residual risk signoff.
2. Execute CP-18 proof command wall and capture outputs.
3. Enforce zero-open-critical invariant.

Artifacts:

- docs/superpowers/artifacts/cp18/security-closure-packet.md
- docs/superpowers/artifacts/cp18/compliance-evidence-map.md
- docs/superpowers/artifacts/cp18/residual-risk-signoff.md
- docs/superpowers/artifacts/cp18/proof-results.md

## Phase 8 — AI Swarm Stability

Copilot actions:

1. Generate load-test script and telemetry evidence templates in docs lane.
2. If implementation touches forbidden swarm paths, hard handoff to authorized lane.
3. Re-ingest outcomes into CP-18/CP-19 checklist evidence map.

Artifacts:

- docs/superpowers/artifacts/cp18/swarm-load-proof.md
- docs/superpowers/artifacts/cp18/swarm-queue-guard-proof.md
- docs/superpowers/artifacts/cp18/swarm-break-glass-proof.md

## Phase 9 — TerraCanon Codex (post-25th)

Copilot actions:

1. Prepare codex integration test checklist and proof artifact structure now.
2. Open implementation only when codex-live precondition is met.
3. Capture end-to-end evidence and checkpoint seal.

Artifacts:

- docs/superpowers/artifacts/cp19/codex-integration-proof.md

## Phase X — CP-19 Final Decision (G10)

Copilot actions:

1. Keep go-live checklist evidence references current per phase closure.
2. Validate rollback plan and decision memo signatures.
3. Run final decision command wall and publish G10 seal.

Artifacts:

- docs/superpowers/artifacts/cp19/go-live-checklist.md
- docs/superpowers/artifacts/cp19/rollback-plan.md
- docs/superpowers/artifacts/cp19/decision-memo.md
- docs/superpowers/artifacts/cp19/checkpoint-seal.md

## Immediate Copilot Runbook (Next 3 Sessions)

### Session 1

- Execute Phase -1 command wall.
- Publish Truth Gate artifact.
- Update cp19 checklist G1/G2 rows with exact evidence links.

### Session 2

- Build Sprint 0 closure checklist and PACS proof skeletons.
- Capture status of S0-A..S0-F from current repository truth.

### Session 3

- Reconcile cp14/cp15/cp16 artifact trees under docs/superpowers/artifacts.
- Open bounded runtime handoff items where implementation is out-of-scope for Copilot lane.

## Acceptance Criteria

- Copilot mirror plan exists and is fully aligned to the locked ecosystem roadmap.
- Every canonical phase has explicit Copilot outputs, artifacts, and hard-stop rules.
- Immediate next action is executable without ambiguity.
- All references use tracked docs/governance surfaces.
