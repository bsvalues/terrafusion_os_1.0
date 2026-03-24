# Full Ecosystem Go-Live Roadmap — Design Spec

**Date**: 2026-03-19
**Status**: LOCKED
**Authority**: Founder + March 17 2026 governance docs
**Supersedes**: Any single-county or Benton-only launch scoping

---

## Target Definition

**Full TerraFusion ecosystem go-live**, not Benton-only assessor launch.

This changes the launch definition, not the architecture rules. The sovereign constitution (`sovereign.yaml`), TruthGate, county isolation, HITL, trace fidelity, audit chain, and zero-tolerance shadow-write policy remain non-negotiable at every phase.

---

## What Is In Scope

- Multi-County Federation (Yakima, Cowlitz)
- Service Registry activation (platform.json → Consul)
- SRE / Disaster Recovery rehearsal
- FISMA-HIGH compliance evidence assembly
- WCAG 2.1 AA proof
- AI Swarm production stability at 1,008 agents
- TerraCanon IDE Codex features (post-March 25th)
- All non-negotiables from March governance docs:
  - TruthGate diagnostic before any feature work
  - TerraDais persistence as the operational spine
  - PR #656 verification as its own named phase (PR merged 2026-03-10; phase verifies integrity is intact)
  - Honesty Sweep before signoff (its own named phase)
  - Full governance gate suite green before Phase 20 (current authoritative counts: 56/56 phase83, 22/22 phase85, 9/9 phase86, 532/532 auth)

## What Is Permanently Out of Scope

- Marketplace / plugin architecture
- Broader external DataMining / ML work (ATTOM, Zillow, NARRPR, PACMLS, SMTP)
- Rebuilds of already-real surfaces or suite homes

---

## Non-Negotiable Architecture Rules (carry through every phase)

| Rule | Enforcement |
|------|-------------|
| TruthGate source tagging | All operations must carry `UI_WORKBENCH`, `CLI_OPERATOR`, or `AI_PILOT` |
| County isolation | `countyId` mandatory at every controller, service, and tool boundary |
| HITL for AI mutations | `HumanApproverId` required — no exceptions, unconditionally active (Phase 10 HITL Drafter delivered and sealed at `e78d1262c`) |
| Trace fidelity | emitIntent/emitResult pairs on every governed write |
| Audit chain | previousHash linkage, tamper-evident NDJSON, replay capability |
| Zero tolerance | Shadow writes and cross-county leakage are BLOCK_AND_ALERT |
| Workbench as shell | Forge, Atlas, Dais must host real surfaces inside Property Workbench |
| Parcel scope collapse | All parcel-scoped work stays inside the Workbench; OS features stay in-shell |

---

## Phase Order (Canonical)

```
Phase -1  →  Sprint 0  →  Phase 1  →  Phase 2  →  Phase 3
→  Phase 4  →  Phase 5  →  Phase 6  →  Phase 7  →  Phase 8
→  Phase 9 (post-25th)  →  Phase X
```

---

## Phase -1 — Truth Gate

**Run first. Always. Before any feature work.**

This is mandatory and diagnostic-only. It does not begin build-unblock work. It verifies current state.

| Check | Tool | Pass Condition |
|-------|------|----------------|
| dotnet build | `dotnet build TerraFusion.sln --configuration Release` | 0 errors |
| TypeScript type-check | `npx tsc -p tsconfig.core.json --noEmit` | 0 errors |
| Duplicate-definition scan | `node --test os-platform/core/tests/phase83-tools.test.mjs` | 56/56 |
| Office-scope policy | `node --test os-platform/core/tests/phase85-tools.test.mjs` | 22/22 |
| ToolRunner canonical | `node --test os-platform/core/tests/phase86-toolrunner.test.mjs` | 9/9 |
| Auth baseline | `vitest run src/__tests__/auth/` | 532/532 |
| ODBC / System.Data.Odbc | Confirmed present in backend build | No missing assembly |
| PR #656 status | `gh pr view 656 --json state,mergedAt` | Status snapshot recorded |

**If all green:** proceed to Sprint 0 immediately, no build-unblock work needed.
**If red:** clear only the failing blockers, re-run Truth Gate, then proceed.

**Evidence artifact**: `.governance/workflow/TRUTH_GATE_<date>.md`

---

## Sprint 0 — Completion Tasks

**These are 90%-done items. One session to close.**

| Task | What Exists | What's Missing |
|------|-------------|----------------|
| S0-A | `vw_TerraFusion_Property_Core` through `vw_TerraFusion_Comparable_Sales` (4/6) in `.tmp/pacs-contract-views.pacs_golive.sql` | Write `vw_TerraFusion_Cama_Characteristics` + `vw_TerraFusion_Improvement_Cost_Matrices` |
| S0-B | SQL file with 4 views + stored proc | Deploy full file to `pacs_golive` clone DB |
| S0-C | `PacsSqlAdapter` DI-registered, feature-flagged | Set PACS connection string in config; flip `TF_ENABLE_HARRIS_PACS_BACKGROUND_SYNC=true` |
| S0-D | `PacsBentonContractTests`, `PacsIntegrationTests` exist | Run against live clone DB; all pass |
| S0-E | r1-acceptance-criteria test | Update expected tool count: `53 → 93` |
| S0-F | `deploy-sovereign.sh` script | Run once against staging; record evidence |

**PACS scope note:** Benton County PACS clone (`pacs_golive`) only. All other DataMining connectors (ATTOM, Zillow, etc.) remain deferred.

**PACS SpecLock reconciliation note:** The PACS SpecLock v1.0.0 (`docs/spec-lock/locks/pacscontract/pacscontract.v1/SPEC_LOCK_v1.0.0.md`) currently declares 3 canonical views (Property_Core, Property_Ownership, Assessment_History). The `PacsSqlAdapter` contract and the `.tmp/pacs-contract-views.pacs_golive.sql` deployment script target 6 views. Before S0-D runs, the SpecLock must be amended to declare all 6 views formally — otherwise S0-D has no unambiguous pass condition. SpecLock amendment is part of S0-A/S0-B (write the 2 missing views and add them to the SpecLock simultaneously).

**Gate**: SpecLock amended to 6 views. PacsBentonContractTests + PacsIntegrationTests all pass against live clone. r1-acceptance-criteria count test green.

---

## Phase 1 — Security & Isolation Closure (CP-14 Runtime)

**Closes the known county isolation gaps from the Day 2 demo audit.**

### 1-A PropertiesController
- `countyId` made mandatory — `[Required]` in query params or extracted from JWT claim
- Service layer: filter always applied, not optional pass-through
- Return 400 if `countyId` absent from request
- Return 403 if `countyId` in request does not match JWT claim

### 1-B DaisController
- Fail-closed on missing JWT `countyId` claim → 401, no sentinel GUID fallback
- Remove sentinel GUID fallback path entirely
- Integration test: unauthenticated request → 401, claim-missing request → 401, county-mismatch → 403

### 1-C MarketplaceController Containment
- Add `[Authorize]` at class level
- Remove stub `GetDownloadCount()` / `GetRating()` / `GetRatingCount()` methods
- Wire to real module registry (`IModuleService`) for internal admin surface only
- No public publisher workflow — V1 is internal only

### Gate
- G3 (Tenant Isolation Coverage): executable isolation tests pass — all critical county boundaries enforced
- G4 (RBAC Contract Closure): all privileged actions require valid claim + policy allowance
- Evidence: `artifacts/cp14/isolation-proof.md` + `artifacts/cp14/rbac-proof.md`

---

## Phase 2 — Runtime Completeness / Shell Contract (CP-15)

**This is a hard gate, not a soft audit. The shell contract is constitutional.**

### 2-A Suite Route Completeness
For each suite — Forge, Atlas, Canon, Dais — verify:
- Zero placeholder pages (`<div>Coming soon</div>` or equivalent)
- Zero stub API responses (hardcoded JSON, no real service call)
- Every named route resolves to a real component with real data

### 2-B WorkbenchHost Integrity
- `PropertyWorkbench` hosts Forge, Atlas, and Dais as real tab surfaces
- No fake-host fallbacks in any required tab position
- Parcel-scoped work collapses into the Workbench — nothing escapes to standalone routes
- OS features (admin, governance, trace) remain in-shell

### 2-C Integration Test Run
- `SystemIntegrationTests` (29 currently failing): run against live staging API
- `r1-demo-proof.mjs`: run against staging, record pass/fail

### Gate
- G5 (Runtime Completeness): every must-use route exhibits production behavior
- G6 (WorkbenchHost Integrity): all required tab surfaces host real behavior, no fallbacks
- Evidence: `artifacts/cp15/route-readiness-map.md` + `artifacts/cp15/workbench-host-proof.md`

---

## Phase 3 — Service Registry + Multi-County Federation (CP-16)

**Full ecosystem readiness requires county 2 and county 3 proven, not just Benton.**

### 3-A Service Registry Activation
- Formal verification: all services registering against registry (platform.json → Consul)
- Health probes green for all registered services
- Contract-verified: registry matches `platform.json` declared services

### 3-B Yakima County End-to-End
- `docker-compose.yakima-flagship.yml` brings up isolated Yakima environment
- Assessor journeys pass in Yakima context
- County boundary enforced: Benton data not visible to Yakima session

### 3-C Cowlitz County End-to-End
- `docker-compose.cowlitz.yml` brings up isolated Cowlitz environment
- Cross-county denial proof: Yakima session denied access to Cowlitz data and vice versa
- Cowlitz and Benton mutually isolated

### 3-D County Onboarding Runbook
- Written and validated for county #2 (Yakima as the proof case)
- End-to-end: config → deploy → health check → assessor journey → isolation proof

### Gate
- G7 (Service Registry Activation): registry active, contract-verified, all health probes green
- Multi-county evidence: `artifacts/cp16/yakima-proof.md` + `artifacts/cp16/cowlitz-proof.md`

---

## Phase 4 — PR #656 Integrity Verification (R3 Closure)

**Named gate. Cannot be buried in Phase 3 or Phase X.**

**Current state**: PR #656 was merged on 2026-03-10T13:55:35Z. The Day 5 Contract-Truth Audit confirmed post-merge gate counts match Phase 20 sign-off (532/532 frontend, 31/31 backend, 0-error build). R1 signed SHA `eef087493343d292efa2681bddc217b76e0ee6b3` confirmed intact.

TerraDais persistence stabilized prior to the March 10 merge — this precondition was satisfied before this roadmap was written. Phase 4 therefore verifies the merge is intact, not executes a new merge.

| Step | Action |
|------|--------|
| 4-1 | Confirm PR #656 state: `gh pr view 656 --json state,mergedAt,mergeCommit` → state=MERGED, mergedAt=2026-03-10 |
| 4-2 | Verify R1 signed SHA is present: `git cat-file -t eef087493343d292efa2681bddc217b76e0ee6b3` → object exists |
| 4-3 | Verify frozen R1 evidence artifacts are intact and unmodified in current `main` |
| 4-4 | Rerun full gate suite post-Phase 3: dotnet build (0 errors), type-check (0 errors), phase83 (56/56), phase85 (22/22), phase86 (9/9), vitest auth (532/532) |
| 4-5 | Record gate snapshot as evidence artifact |

**Frozen R1 evidence must remain intact.** If any earlier phase accidentally touched R1 artifacts, identify and restore from the Day 5 evidence lock (HEAD `00bc4d696`).

**Gate**: PR #656 confirmed merged at 2026-03-10, R1 SHA present, post-Phase-3 gate suite 100% green. Evidence: `artifacts/cp-r3/pr656-integrity-proof.md`.

---

## Phase 5 — Honesty Sweep

**Named gate. Mandatory transparency phase before final verification. Cannot be skipped.**

The repo governance is explicit: visible honesty is required, not optional.

### Surfaces to sweep

| File | Check |
|------|-------|
| `useTodaysWork.ts` | Returns real work items from Dais/TerraDais spine, not hardcoded or mocked data |
| `useBudgetData.ts` | Returns real budget figures from backend, not sample values |
| `CostManual.tsx` | Renders real CostForge data pipeline output, not static placeholder values |
| `BatchCostRun.tsx` | Triggers real batch valuation run, not a UI-only simulation |

### Sweep process
1. For each surface: read the component, trace the data source
2. Classify: REAL (connects to real service and real data) or HONESTY VIOLATION (hardcoded, mocked, or disconnected)
3. Fix all HONESTY VIOLATIONS before proceeding
4. Produce sweep report with before/after classification for each surface

**Gate**: All 4 surfaces classified REAL with evidence. Sweep report committed to `.governance/workflow/HONESTY_SWEEP_<date>.md`.

---

## Phase 6 — SRE / Operations (CP-17)

### 6-A Backup / Restore Rehearsal
- Take backup of staging DB
- Restore to clean environment
- Verify: all services healthy, data intact, assessor journey passes post-restore
- Evidence artifact: `artifacts/cp17/restore-proof.md`

### 6-B Failover Rehearsal
- Simulate primary service failure
- Verify failover activates correctly
- Verify recovery to normal state
- Evidence artifact: `artifacts/cp17/dr-proof.md`

### 6-C Break-Glass Drill
- Trigger `break-glass-drill.yml` (manual workflow)
- Verify autonomy break-glass guard engages
- Verify incident publisher fires
- Verify recovery chain: correlationId → trace → stackTrace → resolution
- Evidence artifact: `artifacts/cp17/sre-pack.md`

### 6-D Hypercare Plan
- Written runbook for first 30 days post-go-live
- Escalation paths (P0/P1/P2 classification)
- On-call rotation
- Known-issue playbook with mitigations
- Evidence artifact: `artifacts/cp17/hypercare-plan.md`

**Gate**: G8 — all rehearsals passed with evidence, hypercare plan approved.

---

## Phase 7 — Security / Compliance Seal (CP-18)

### 7-A FISMA-HIGH Evidence Pack Assembly
- Draw from existing artifacts: Day 0–5 demo charter, Phase 7–11 seals, Phase 83/85/86 test results
- Map each NIST 800-53 control to evidence artifact
- Identify any controls with no evidence → close or formally accept residual risk

### 7-B WCAG 2.1 AA Proof
- `npm run government:compliance` → zero errors
- Screenshot/output captured as evidence artifact

### 7-C Vulnerability Register Closure
- List all open security findings
- Each classified: CLOSED (fixed) or ACCEPTED (residual risk with justification)
- Zero open criticals — mandatory

### 7-D Console Warning Suppression
- All remaining console warnings (currently ~197): either fixed or each suppressed with inline justification comment
- Zero unexplained warnings in production build

**Gate**: G9 — zero open criticals, all highs closed or explicitly accepted, WCAG zero errors, FISMA pack assembled. Evidence: `artifacts/cp18/security-closure-packet.md`.

---

## Phase 8 — AI Swarm Production Stability

### 8-A Load Test: 1,008 Agents
- Activate all 1,008 agents simultaneously in staging
- Verify: no memory spiral, no WS connection collapse, queue depth guard fires correctly under load
- Swarm observability bridge (Phase 35-G) reports clean telemetry throughout

### 8-B Queue Depth Guard Proof
- Drive queue beyond configured depth threshold
- Verify guard triggers and rate-limits correctly
- Verify recovery to normal state without manual intervention

### 8-C Recovery Drill Evidence
- Run `autonomy-break-glass-drill.yml` with swarm active
- Verify swarm recovers after break-glass event
- Verify observability bridge reports correctly during and after

**Gate**: Consciousness microservice stable at full agent load. All 3 drill evidence artifacts produced.

---

## Phase 9 — TerraCanon IDE Codex Features (post-March 25th)

**Codex-dependent. Additive to all prior phases. Non-blocking.**

| Step | Scope |
|------|-------|
| 9-A | Wire `CodexController` + `CodexCollaborationController` to live Codex service |
| 9-B | Real-time co-editing session management |
| 9-C | TerraCanon IDE end-to-end integration tests pass |

**Gate**: All existing TerraCanon page surfaces (IDSCommandCenter, ImportWizard, SyncDashboard) functional AND new Codex collaboration features proven end-to-end.

Proof commands:
- `node --test os-platform/core/tests/canon-doctor.test.mjs` — all pass
- `node --test os-platform/core/tests/canon-ping.test.mjs` — all pass
- `node --test os-platform/core/tests/canon-reopen.contract.test.mjs` — all pass
- `node --test os-platform/core/tests/canon-governance-barrel.contract.test.mjs` — all pass
- Manual: Codex collaboration session opens, co-edit round-trip completes without error

Evidence artifact: `artifacts/cp-terracanon/terracanon-ide-proof.md`

---

## Phase X — Final Decision Gate (CP-19)

**Converge all evidence here. No gate may be skipped.**

| Checklist Item | Source |
|---------------|--------|
| Truth Gate passed | Phase -1 artifact |
| PACS integration live | Sprint 0 evidence |
| County isolation hard-enforced | Phase 1 proofs |
| Shell contract: Workbench hosts real surfaces | Phase 2 proof |
| Service registry active, 3 counties isolated | Phase 3 proof |
| PR #656 merged, post-merge gates green | Phase 4 record |
| Honesty Sweep: all 4 surfaces REAL | Phase 5 report |
| SRE: restore + failover + break-glass all rehearsed | Phase 6 artifacts |
| Security: FISMA pack, WCAG zero errors, vuln register closed | Phase 7 pack |
| AI Swarm: 1,008 agents stable under load | Phase 8 evidence |
| TerraCanon Codex features proven | Phase 9 (if before go-live) |
| Full governance gate suite green: 56/56 phase83, 22/22 phase85, 9/9 phase86, 532/532 auth | Phase 20 prerequisite — re-verified at Phase 4 and Phase X |
| R1 evidence artifacts intact + PR #656 merged | Phase 4 record (PR merged 2026-03-10, SHA eef087493343d292efa2681bddc217b76e0ee6b3) |

### Artifacts Required
- `artifacts/cp19/go-live-checklist.md`
- `artifacts/cp19/rollback-plan.md`
- `artifacts/cp19/decision-memo.md`

**Gate**: G10 — go/no-go packet complete, all prior gates evidenced, founder sign-off.

---

## Execution Constraints

| Constraint | Rule |
|-----------|------|
| Single writer | One active writer lane per phase — no concurrent writes to same surface |
| Phase ordering | Phase N+1 cannot open until Phase N gate is green and checkpointed |
| Frozen R1 evidence | R1 artifacts confirmed intact post-PR #656 merge (2026-03-10, SHA eef087493343d292efa2681bddc217b76e0ee6b3); must remain unmodified through all remaining phases |
| Codex dependency | Phase 9 cannot start until Codex service is live (March 25th earliest) |
| PACS scope | Benton clone only in Sprint 0; no other DataMining connectors in V1 |
| Marketplace | Permanently out of scope for V1 — internal module registry only (Phase 1-C containment) |

---

## Estimated Session Count

| Phase | Effort |
|-------|--------|
| Phase -1 Truth Gate | <1 session |
| Sprint 0 Completion | 1 session |
| Phase 1 Security/Isolation | 1–2 sessions |
| Phase 2 Runtime/Shell | 2 sessions |
| Phase 3 Multi-County | 2 sessions |
| Phase 4 PR #656 Integrity Verification | 1 session |
| Phase 5 Honesty Sweep | 1 session |
| Phase 6 SRE/Ops | 1 session |
| Phase 7 Compliance | 1–2 sessions |
| Phase 8 AI Swarm | 1 session |
| Phase 9 Codex (post-25th) | 2 sessions |
| Phase X Decision Gate | 1 session |
| **Total** | **~14–16 sessions** |

---

## Save State

**Scope locked**: Full ecosystem readiness — not Benton-only.
**Plan locked**: Truth Gate → Sprint 0 → Phase 1 → 2 → 3 → 4 (PR #656) → 5 (Honesty Sweep) → 6 → 7 → 8 → 9 (post-25th) → X.
**Still out**: Marketplace/plugin architecture, broader external DataMining/ML.
**Very next step**: Execute Phase -1 Truth Gate.
