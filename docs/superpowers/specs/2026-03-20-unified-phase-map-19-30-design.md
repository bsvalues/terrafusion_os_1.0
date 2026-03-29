# Unified Phase Map: Claude Code Phases 19–30
**Date**: 2026-03-20
**Status**: LOCKED
**Authority**: Co-Founder approval, March 20 2026 planning session
**Supersedes**: Dual-track spaghetti (go-live roadmap vs. Claude Code TDD phases)

**Historical strategy note**: This document remains useful as the historical phase map, but the current client-demo canon now lives in the March 28 control-plane stack:
- [2026-03-28-full-ecosystem-design-audit-and-realization.md](../plans/2026-03-28-full-ecosystem-design-audit-and-realization.md)
- [2026-03-28-full-ecosystem-demo-gui-canon-design.md](./2026-03-28-full-ecosystem-demo-gui-canon-design.md)
- [2026-03-28-full-ecosystem-demo-surface-matrix.md](../catalog/2026-03-28-full-ecosystem-demo-surface-matrix.md)

For current truth-state, readiness, and demo-claim decisions, defer to the March 28 stack rather than this March 20 phase map.

---

## Decision

Track C approved: **merged view**. One numbered Claude Code execution sequence (Phase 19–30) maps directly onto the March 19 go-live roadmap gaps. The roadmap picks the battlefield; the contract phases bring the helmets.

**One rail. No attic.**

---

## Inherited Evidence (Phases 12–18 → Go-Live Credit)

Phases 12–18 TDD contracts are **supporting evidence** for the go-live roadmap, not closure.

| TDD Phases | Go-Live Credit | Gate |
|---|---|---|
| Phase 15 (useSession hardening) | County header never silently absent | CP-15 / G6 supporting |
| Phase 16 (parcel/workbench routing) | No parcel tool opens standalone | CP-15 / G6 supporting |
| Phase 17 (canonical URL, route repair, back/forward) | URL is single source of truth | CP-15 / G6 supporting |
| Phase 18 (parcel identity, stale guard, cross-county, alias dedup) | One canonical parcel identity | CP-15 / G6 supporting |

**Rule**: Phase 22 inherits this evidence toward G6. Phase 22 still owns the full route-readiness sweep and integration test run — the inheritance does not close Phase 22.

---

## Phase Map

| Phase | Go-Live Map | Theme | Must-Ship |
|---|---|---|---|
| **19** | Phase -1 | Truth Gate Snapshot | ✅ Blocking |
| **20** | Sprint 0 | PACS Contract Closure | ✅ Blocking |
| **21** | Phase 1 (CP-14) | Security & Isolation Closure | ✅ Blocking |
| **22** | Phase 2 (CP-15) | Shell Contract Completeness | ✅ Blocking |
| **23** | Phase 3 (CP-16) | Multi-County Federation | ✅ Blocking |
| **24** | Phase 4 | PR #656 Integrity Verification | ✅ Blocking |
| **25** | Phase 5 | Honesty Sweep | ✅ Blocking |
| **26** | Phase 6 (CP-17) | SRE / Ops Rehearsal | ✅ Blocking |
| **27** | Phase 7 (CP-18) | Security & Compliance Seal | ✅ Blocking |
| **28** | Phase 8 | AI Swarm Production Stability | ✅ Blocking |
| **29** | Phase 9 | TerraCanon Codex Integration | ⚡ HELD / non-blocking |
| **30** | Phase X (CP-19) | Final Decision Gate | ✅ Blocking |

**Post-launch (not in Phase 30 gate):**
- Non-summary tab polish (Atlas/Clerk/Treasury/Audit sparse surfaces)
- Workbench density pass (BentoGrid, LiquidPanel, suite color tokens)
- External DataMining connectors (ATTOM/Zillow/NARRPR — permanently deferred per March 19 spec)

---

## Phase 19 — Truth Gate Snapshot

**Go-live map:** Phase -1
**Theme:** Diagnostic only. No new code. Run the full spec-aligned gate battery. Record current state before any implementation work begins.
**Scope boundary:** Read-only. Single write: evidence artifact.

### Execution

| Check | Command | Pass Condition |
|---|---|---|
| Backend build | `dotnet build TerraFusion.sln --configuration Release` | 0 errors |
| Type-check | `pnpm run type-check` | 0 errors |
| Duplicate-definition scan | `node --test os-platform/core/tests/phase83-tools.test.mjs` | 56/56 |
| Office-scope policy | `node --test os-platform/core/tests/phase85-tools.test.mjs` | 22/22 |
| ToolRunner canonical | `node --test os-platform/core/tests/phase86-toolrunner.test.mjs` | 9/9 |
| Auth baseline | `pnpm vitest run src/__tests__/auth/` | ≥532/532 |
| PR #656 status | `gh pr view 656 --json state,mergedAt` | state=MERGED |
| System.Data.Odbc | Confirm present in backend build output / dotnet list | No missing assembly |
| Frozen evidence check | `pnpm -w run r1:verify-evidence` (or equivalent) | No diff on R1 artifacts |

### Tests/contracts
No new tests. Evidence artifact: `.governance/workflow/TRUTH_GATE_2026-03-20.md`.

### Regression risks
None — diagnostic only. Red = pre-existing gap, not a Phase 19 regression.

### Seal criteria
All 9 checks green. Evidence artifact committed. If any check is red: record the gap, do not proceed to Phase 20 until cleared.

**Go-live relevance:** BLOCKING. Phase 20 cannot open until Phase 19 is sealed.

---

## Phase 20 — PACS Contract Closure

**Go-live map:** Sprint 0 (S0-A through S0-F)
**Theme:** Complete 2 missing PACS SQL views, amend SpecLock, prove integration against live Benton clone DB.
**Scope boundary:** Backend only (SQL + C# contract). Benton `pacs_golive` clone only. No other DataMining connectors.

### Bricks

**20-A0 — PACS Preflight (environment gate before any view work):**
- PACS connection string present in config
- Benton `pacs_golive` reachable (network + auth succeeds)
- Read-only sanity query passes (e.g., `SELECT TOP 1` from existing view)
- If A0 fails: Phase 20 is **blocked by environment, not code**. Do not proceed to 20-A.

**20-A — Write 2 Missing Views + Amend SpecLock:**
Write `vw_TerraFusion_Cama_Characteristics` + `vw_TerraFusion_Improvement_Cost_Matrices` in `.tmp/pacs-contract-views.pacs_golive.sql`. Amend SpecLock from 3→6 views simultaneously. SpecLock amendment is required before 20-C has an unambiguous pass condition.

**20-B — Deploy + Activate:**
Deploy full 6-view SQL file to `pacs_golive` clone. Set PACS connection string in config. Flip `TF_ENABLE_HARRIS_PACS_BACKGROUND_SYNC=true`.

**20-C — Integration Proof:**
Run `PacsBentonContractTests` + `PacsIntegrationTests` against live clone. Fix `r1-acceptance-criteria` count test (53→93 tools).

### Tests/contracts
PacsIntegrationTests all pass. r1-acceptance-criteria green. SpecLock diff committed.

### Regression risks
PACS connection string change could affect other services sharing the same config key. Isolate with feature flag (already planned). Verify `TF_ENABLE_HARRIS_PACS_BACKGROUND_SYNC` only gates PACS background sync — not a global service toggle.

### Seal criteria
A0 preflight passed. SpecLock amended to 6 views. All PACS tests green against live clone. Tool count test green. Evidence: `artifacts/sprint0/pacs-closure-proof.md`.

**Go-live relevance:** BLOCKING.

---

## Phase 21 — Security & Isolation Closure

**Go-live map:** Phase 1 (CP-14)
**Theme:** Close known county isolation gaps in three backend controllers.
**Scope boundary:** Backend controllers only. No frontend changes. No new routes.

### Bricks

**21-A PropertiesController:** `countyId` mandatory — `[Required]` in query params or extracted from JWT claim. Service layer always filters. Return 400 if absent, 403 if mismatch.

**21-B DaisController:** Fail-closed on missing JWT `countyId` claim → 401. Remove sentinel GUID fallback entirely. Integration test: unauthenticated→401, claim-missing→401, county-mismatch→403.

**21-C MarketplaceController:** Add `[Authorize]` at class level. Remove stub `GetDownloadCount()` / `GetRating()` / `GetRatingCount()`. Wire to `IModuleService` for internal admin surface only. No public publisher workflow.

### Tests/contracts
Integration tests per controller: unauthenticated, missing claim, county-mismatch paths. RBAC contract: all privileged actions require valid claim + policy allowance.

### Regression risks
Removing sentinel GUID fallback in DaisController could break any development path that relied on it. Audit all test fixtures for sentinel GUID usage before removing. Verify no integration test was relying on the sentinel path as a "dev shortcut."

### Seal criteria
G3 (Tenant Isolation Coverage) + G4 (RBAC Contract Closure) green. Evidence: `artifacts/cp14/isolation-proof.md` + `artifacts/cp14/rbac-proof.md`.

**Go-live relevance:** BLOCKING.

---

## Phase 22 — Shell Contract Completeness

**Go-live map:** Phase 2 (CP-15)
**Theme:** Prove every named route hosts real behavior. No placeholders. No stub responses.
**Scope boundary:** Frontend surface audit + integration test run. No new routes. No density rewrite. Source-inspection contract pattern (established Phases 12–18).

**Inherited evidence:** Phases 15–18 contracts are cited as supporting evidence for G6 (WorkbenchHost Integrity). They are not a substitute for the full Phase 22 sweep.

### Bricks

**22-A Route Readiness Sweep:** Source-inspect each suite home (Forge, Atlas, Canon, Dais) for `Coming soon`, `TODO`, hardcoded JSON, stub responses. Contract test locks zero-placeholder invariant.

**22-B WorkbenchHost Integrity:** Contract test proves `PropertyWorkbench` hosts Forge/Atlas/Dais as real tab surfaces. Cites Phases 16–18 contracts as inherited evidence. Adds: no fake-host fallback in any required tab position.

**22-C Integration Test Run:** Run `SystemIntegrationTests` (currently 29 failing) against staging API. Run `r1-demo-proof.mjs`. Fix failures — these are pre-existing red tests, not new ones.

### Tests/contracts
New source-inspection contracts for 22-A + 22-B. 22-C fixes pre-existing failures. All three green at seal.

### Regression risks
22-C integration tests touch the live staging API — could expose real data gaps in Atlas/Dais tabs. Fix scope for 22-C: no new surfaces, only making existing stubs real. Atlas/Clerk/Treasury/Audit sparse tab polish is post-launch, not Phase 22 scope.

### Seal criteria
G5 (Runtime Completeness) + G6 (WorkbenchHost Integrity) green. Evidence: `artifacts/cp15/route-readiness-map.md` + `artifacts/cp15/workbench-host-proof.md`. Phase 15–18 contract evidence cited in workbench-host-proof.

**Go-live relevance:** BLOCKING.

---

## Phase 23 — Multi-County Federation

**Go-live map:** Phase 3 (CP-16)
**Theme:** Three counties isolated in parallel. Service registry live. Yakima and Cowlitz proven, not just Benton.
**Scope boundary:** Infrastructure + backend only. No frontend surface changes. Docker compose environments are the delivery artifact.

### Bricks

**23-A Service Registry Activation:** All services registering against Consul. Health probes green. Contract-verified: registry matches `platform.json` declared services.

**23-B Yakima County E2E:** `docker-compose.yakima-flagship.yml` brings up isolated environment. Assessor journeys pass. Benton data not visible to Yakima session.

**23-C Cowlitz County E2E:** `docker-compose.cowlitz.yml` brings up isolated environment. Yakima session denied Cowlitz data and vice versa. Cowlitz ↔ Benton mutually isolated.

**23-D County Onboarding Runbook:** Written and validated for Yakima as proof case. End-to-end: config → deploy → health check → assessor journey → isolation proof.

### Tests/contracts
Cross-county denial integration tests. Source-inspection contract: Consul registration matches `platform.json`. Assessor journey contract in Yakima context.

### Regression risks
Consul activation could interfere with existing service discovery if any service is hardcoded to localhost. Audit service-to-service calls before enabling. Yakima/Cowlitz DB seeding must not share connection strings with Benton — verify environment variable isolation before 23-B.

### Seal criteria
G7 green. Evidence: `artifacts/cp16/yakima-proof.md` + `artifacts/cp16/cowlitz-proof.md` + `artifacts/cp16/registry-proof.md`. Onboarding runbook committed.

**Go-live relevance:** BLOCKING.

---

## Phase 24 — PR #656 Integrity Verification

**Go-live map:** Phase 4 (R3 Closure)
**Theme:** Named gate. Verify March 10 merge is intact. Read-only evidence collection.
**Scope boundary:** Read-only. Five verification steps. Single write: evidence artifact.

### Execution

| Step | Command | Pass Condition |
|---|---|---|
| 24-1 | `gh pr view 656 --json state,mergedAt,mergeCommit` | state=MERGED, mergedAt=2026-03-10 |
| 24-2 | `git cat-file -t eef087493343d292efa2681bddc217b76e0ee6b3` | "commit" |
| 24-3 | Verify R1 frozen artifacts unmodified vs HEAD `00bc4d696` | No diff on R1 artifact paths |
| 24-4 | Re-run full gate suite: dotnet build, type-check, phase83/85/86, vitest auth | All green |
| 24-5 | Record gate snapshot | Artifact committed |

### Tests/contracts
No new tests. Steps 24-1 through 24-4 are the proof chain.

### Regression risks
If any Phase 21–23 work accidentally touched R1 artifact paths, step 24-3 catches it. If caught: restore from HEAD `00bc4d696`, re-run the touching phase.

### Seal criteria
All 5 steps green. Evidence: `artifacts/cp-r3/pr656-integrity-proof.md`.

**Go-live relevance:** BLOCKING. Cannot be merged into Phase 23.

---

## Phase 25 — Honesty Sweep

**Go-live map:** Phase 5
**Theme:** Classify four surfaces REAL or HONESTY VIOLATION. Fix every violation before sealing.
**Scope boundary:** Four specific files. No new routes. Fix = wire to real service, not replace UI.

### Surfaces

| Surface | Real Condition | Violation Signal |
|---|---|---|
| `useTodaysWork.ts` | Real work items from Dais/TerraDais spine | Hardcoded array, mocked data |
| `useBudgetData.ts` | Real budget figures from backend | Sample values, static objects |
| `CostManual.tsx` | Real CostForge data pipeline output | Static placeholders, fake data TODO |
| `BatchCostRun.tsx` | Real batch valuation run triggered | UI-only simulation, no backend call |

### Execution pattern (per surface)
1. `readFileSync` component, trace data source.
2. Classify: REAL or HONESTY VIOLATION.
3. If VIOLATION: identify real service endpoint, wire it, add integration assertion.
4. Source-inspection contract test locks the fix.

### Tests/contracts
Four source-inspection contracts — one per surface. Each proves: real import present, no hardcoded fixture strings, no `TODO` data placeholders. Plus one integration assertion per surface.

### Regression risks
`BatchCostRun.tsx` wired to real backend may expose timing issues — ensure loading state before hook returns. `useTodaysWork.ts` connecting to Dais spine must not block shell render if Dais is unavailable (graceful empty state, not crash).

### Seal criteria
All 4 surfaces REAL. All 4 contracts green. Sweep report: `.governance/workflow/HONESTY_SWEEP_2026-03-20.md`. Zero violations remaining.

**Go-live relevance:** BLOCKING. Transparency is constitutional.

---

## Phase 26 — SRE / Ops Rehearsal

**Go-live map:** Phase 6 (CP-17)
**Theme:** Three operational drills plus hypercare plan. Evidence artifacts are the deliverable.
**Scope boundary:** Staging environment only. No production touches. Code changes limited to gaps discovered during drills.

### Bricks

**26-A Backup / Restore Rehearsal:** Take staging DB backup. Restore to clean environment. Verify all services healthy, data intact, assessor journey passes post-restore. Evidence: `artifacts/cp17/restore-proof.md`.

**26-B Failover Rehearsal:** Simulate primary service failure. Verify failover activates. Verify recovery. Evidence: `artifacts/cp17/dr-proof.md`.

**26-C Break-Glass Drill:** Trigger `break-glass-drill.yml` (manual workflow). Verify autonomy break-glass guard engages, incident publisher fires, recovery chain: correlationId → trace → stackTrace → resolution. Evidence: `artifacts/cp17/sre-pack.md`.

**26-D Hypercare Plan:** Written runbook: first 30 days post-go-live, P0/P1/P2 escalation paths, on-call rotation, known-issue playbook. Evidence: `artifacts/cp17/hypercare-plan.md`.

### Tests/contracts
No new vitest contracts. Evidence artifacts are the contracts. Each drill: timestamped result, pass/fail classification, recovery steps, final state.

### Regression risks
Break-glass drill touches workflow triggers — verify drill workflow is not wired to any production alert channel before triggering. Run against staging only.

### Seal criteria
G8 green. All 4 artifacts committed. Each drill passed or failure documented with fix applied and re-run passing.

**Go-live relevance:** BLOCKING.

---

## Phase 27 — Security & Compliance Seal

**Go-live map:** Phase 7 (CP-18)
**Theme:** Assemble FISMA-HIGH evidence pack. Prove WCAG 2.1 AA. Close vulnerability register. Suppress unexplained console warnings.
**Scope boundary:** No new features. Evidence assembly + targeted compliance fixes.

### Bricks

**27-A FISMA-HIGH Evidence Pack:** Map each NIST 800-53 control to existing artifact. Gaps → fix or formally accept residual risk with written justification. Evidence: `artifacts/cp18/fisma-control-map.md`.

**27-B WCAG 2.1 AA Proof:** `npm run government:compliance` → zero errors. Screenshot + output captured. Evidence: `artifacts/cp18/wcag-proof.md`.

**27-C Vulnerability Register Closure:** List all open findings. Classify each: CLOSED or ACCEPTED (with justification). Zero open criticals — mandatory hard stop.

**27-D Console Warning Suppression:** All ~197 remaining warnings: fix root cause or add inline `// justified: <reason>` comment. Zero unexplained warnings in production build output.

### Tests/contracts
`government:compliance` run is the 27-B contract. Source-inspection contract for 27-D: scan production build output for `console.warn`/`console.error` without paired `// justified:` in source.

### Regression risks
Warning suppression: silencing a warning that signals a real bug. For each `// justified:` applied: verify the warning source is understood and benign before marking.

### Seal criteria
G9 green. Zero open criticals, all highs closed or accepted, WCAG zero errors, FISMA control map complete, zero unexplained warnings. Evidence: `artifacts/cp18/security-closure-packet.md`.

**Go-live relevance:** BLOCKING.

---

## Phase 28 — AI Swarm Production Stability

**Go-live map:** Phase 8
**Theme:** 1,008 agents stable under load. Queue guard proven. Break-glass recovery verified.
**Scope boundary:** Consciousness microservice (staging). No agent modifications. DO NOT MODIFY rule remains in force.

### Bricks

**28-A Load Test:** Activate all 1,008 agents simultaneously in staging. Verify: no memory spiral, no WebSocket collapse, queue depth guard fires correctly, observability bridge reports clean telemetry. Evidence: `artifacts/cp-consciousness/load-proof.md`.

**28-B Queue Depth Guard Proof:** Drive queue beyond threshold. Verify guard triggers and rate-limits. Verify recovery without manual intervention. Evidence: `artifacts/cp-consciousness/queue-guard-proof.md`.

**28-C Recovery Drill:** Run `autonomy-break-glass-drill.yml` with swarm active. Verify swarm recovers, observability bridge reports correctly during and after. Evidence: `artifacts/cp-consciousness/recovery-proof.md`.

### Tests/contracts
No new vitest contracts. Three evidence artifacts are the proof chain.

### Regression risks
Activating all 1,008 agents in staging could saturate staging resources if not provisioned to production scale. Verify Consciousness service has production-equivalent resource limits before 28-A. If under-provisioned: run against production-parity environment, not dev instance.

### Seal criteria
Consciousness stable at full load. All 3 artifacts produced.

**Go-live relevance:** BLOCKING.

---

## Phase 29 — TerraCanon Codex Integration *(HELD)*

**Go-live map:** Phase 9
**Status: HELD / Codex-dependent / non-blocking / post-March-25**

**Hold condition:** Codex service must be live (March 25, 2026 earliest). Phase 29 cannot open until Codex is available.

**Rule: Phase 30 may seal with Phase 29 explicitly DEFERRED BY POLICY.** If Phase 29 completes before Phase 30 seals, it is included. If not, Phase 30 checklist item reads: "TerraCanon Codex Integration — DEFERRED BY POLICY (Codex service availability). Non-blocking per March 19 roadmap spec."

### Bricks
- **29-A:** Wire `CodexController` + `CodexCollaborationController` to live Codex service.
- **29-B:** Real-time co-editing session management proven end-to-end.
- **29-C:** All canon contract tests green.

### Tests/contracts
```bash
node --test os-platform/core/tests/canon-doctor.test.mjs
node --test os-platform/core/tests/canon-ping.test.mjs
node --test os-platform/core/tests/canon-reopen.contract.test.mjs
node --test os-platform/core/tests/canon-governance-barrel.contract.test.mjs
```
Manual: Codex collaboration session opens, co-edit round-trip completes without error.

### Seal criteria
All 4 canon test suites green. Manual co-edit round-trip verified. Evidence: `artifacts/cp-terracanon/terracanon-ide-proof.md`.

**Go-live relevance:** Non-blocking. Does not block Phase 30.

---

## Phase 30 — Final Decision Gate

**Go-live map:** Phase X (CP-19)
**Theme:** Converge all evidence. Go/no-go packet. Founder sign-off.
**Scope boundary:** Evidence assembly only. No new code. No new tests.

### Go/No-Go Checklist

| Item | Source | Hard Stop |
|---|---|---|
| Truth Gate passed | Phase 19 artifact | ✅ Yes |
| PACS integration live | Phase 20 evidence | ✅ Yes |
| County isolation hard-enforced | Phase 21 proofs | ✅ Yes |
| Shell contract: Workbench hosts real surfaces | Phase 22 proof + Phases 15–18 inherited | ✅ Yes |
| Service registry active, 3 counties isolated | Phase 23 proof | ✅ Yes |
| PR #656 merged, post-merge gates green | Phase 24 record | ✅ Yes |
| Honesty Sweep: all 4 surfaces REAL | Phase 25 report | ✅ Yes |
| SRE: restore + failover + break-glass rehearsed | Phase 26 artifacts | ✅ Yes |
| Security: FISMA pack, WCAG zero errors, vuln register closed | Phase 27 pack | ✅ Yes |
| AI Swarm: 1,008 agents stable | Phase 28 evidence | ✅ Yes |
| TerraCanon Codex features | Phase 29 artifact OR "DEFERRED BY POLICY" | ⚡ No |
| Full governance suite re-verified | Re-run at Phase 30 | ✅ Yes |
| R1 evidence artifacts intact + PR #656 SHA | Phase 24 confirmed | ✅ Yes |

### Artifacts produced
- `artifacts/cp19/go-live-checklist.md`
- `artifacts/cp19/rollback-plan.md`
- `artifacts/cp19/decision-memo.md`

### Tests/contracts
Full governance suite re-run: `dotnet build`, type-check, phase83/85/86, vitest auth. All green. Final regression sweep.

### Regression risks
None intrinsic to Phase 30. Any gap found here traces back to a prior phase — the fix lives in that phase's scope.

### Seal criteria
G10 green. Go/no-go packet complete. All prior hard-stop gates evidenced. Full governance suite green. Founder sign-off on decision-memo. Phase 29 may be DEFERRED BY POLICY without blocking seal.

**Go-live relevance:** THE GATE.**

---

## Execution Constraints (carried through all phases)

| Constraint | Rule |
|---|---|
| Single writer | One active writer lane per phase — no concurrent writes to same surface |
| Phase ordering | Phase N+1 cannot open until Phase N gate is green and checkpointed |
| Frozen R1 evidence | Must remain unmodified through all phases. Verify at Phase 24. |
| Phase 29 hold | Cannot open until Codex service is live (March 25 earliest) |
| PACS scope | Benton clone only in Phase 20. No other DataMining connectors in V1. |
| Marketplace | Permanently out of scope for V1 — internal module registry only (Phase 21-C containment) |
| AI Swarm | DO NOT MODIFY production swarm agents during Phases 19–30 |
| Post-launch deferred | Non-summary tab polish, density pass, external DataMining — all post-Phase 30 |

---

## Estimated Session Count

| Phase | Effort |
|---|---|
| Phase 19 — Truth Gate | < 1 session |
| Phase 20 — PACS Closure | 1–2 sessions |
| Phase 21 — Security/Isolation | 1–2 sessions |
| Phase 22 — Shell Contract | 2 sessions |
| Phase 23 — Multi-County | 2 sessions |
| Phase 24 — PR #656 Integrity | < 1 session |
| Phase 25 — Honesty Sweep | 1 session |
| Phase 26 — SRE/Ops | 1 session |
| Phase 27 — Compliance Seal | 1–2 sessions |
| Phase 28 — AI Swarm | 1 session |
| Phase 29 — TerraCanon (HELD) | 2 sessions (when unblocked) |
| Phase 30 — Decision Gate | 1 session |
| **Total (blocking chain)** | **~14–16 sessions** |

---

*The railroad is real. The backlog is wearing a nametag and pretending to be civilized.*
