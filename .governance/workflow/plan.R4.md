# R4 Multi-Agent Execution Plan

> **Purpose:** Harden TerraFusion OS from "demo-real" to "production-real" — eliminate remaining stubs, deprecated code, placeholder responses, and wire the last-mile integrations.
> **Branch:** `claude/review-progress-ledger-a8iw5`
> **Date:** March 8, 2026
> **Prereqs:** R1 complete (8/8 blockers closed), R2 complete (12 waves), R3 complete (PostGIS + Muse + 38/38 routes)

---

## Current State Summary

| Metric | Value |
|--------|-------|
| Endpoints | 61+ (59 live, 2 intentional stubs) |
| Tools | 38 (manifest v1.7.0, 38/38 real handlers) |
| Gate tests | 87/87 core, 242 total |
| Frontend services | 38/38 direct routes via toolServiceRouter |
| Known stubs | Harris PACS sync (intentional), GPT controller (4 stubs), DataMigrationEngine (3 stubs) |
| Deprecated code | forgeService.ts (7 deprecated functions + 1 deprecated stats block) |
| TODOs in controllers | 5 actionable (Levy quantum, QuantumConsciousness 3x, PACS sync) |

---

## R4 Phases (6 Waves)

### R4.1 — Forge Legacy Cleanup (Agent: Claude Code)

**Goal:** Remove deprecated client-side calculator from `forgeService.ts`. All production flows already go through `runGovernedValuation()`.

| Task | File | Action |
|------|------|--------|
| 4.1.1 | `forgeService.ts` | Remove 7 `@deprecated` functions (`calculateCost`, `calculateIncome`, etc.) |
| 4.1.2 | `forgeService.ts` | Remove deprecated `getValuationStats()` hardcoded stats |
| 4.1.3 | `forgeService.ts` | Remove `COST_MATRIX` (42 entries) — now in backend `CostMatrices` DB table |
| 4.1.4 | Grep all imports | Verify zero callers of deprecated functions before removal |
| 4.1.5 | Gate test | Confirm 32/32 phase83, type-check clean |

**Risk:** Low — governed path is sole production path (verified R1).
**Blocked by:** Nothing.

---

### R4.2 — GPT Controller Hardening (Agent: Codex Backend)

**Goal:** Replace 4 stub responses in `GPTController.cs` with real service calls or honest 501s.

| Task | File | Action |
|------|------|--------|
| 4.2.1 | `GPTController.cs:1715` | Phase 27 RagFleetService stub → honest 501 with `NotImplemented` response |
| 4.2.2 | `GPTController.cs:1795` | Phase 28 AtlasService stub → wire to real `AtlasController` internally |
| 4.2.3 | `GPTController.cs:1872` | Phase 29 Live service stub → honest 501 |
| 4.2.4 | `GPTController.cs:1115` | Usage statistics placeholder → real DB query from `AuditLogs` table |
| 4.2.5 | `GPTController.cs:1018` | Non-Benton placeholder → real county check against `Counties` table |
| 4.2.6 | Gate test | Verify no regression in existing GPT endpoints |

**Risk:** Medium — GPT controller is large (~1900 lines). Surgical changes only.
**Blocked by:** Nothing.

---

### R4.3 — DataMigrationEngine Real Implementation (Agent: Codex Backend)

**Goal:** Wire 3 stub operations in `DataMigrationEngine.cs` to real EF Core operations.

| Task | File | Action |
|------|------|--------|
| 4.3.1 | `DataMigrationEngine.cs:509` | `ExecuteMigration` → real EF Core migration runner |
| 4.3.2 | `DataMigrationEngine.cs:542` | `ValidateData` → real schema validation against DbContext |
| 4.3.3 | `DataMigrationEngine.cs:573` | `TransformData` → real property data transformation pipeline |
| 4.3.4 | Gate test | Existing endpoints continue to work |

**Risk:** Medium — affects data integrity. Unit tests required.
**Blocked by:** Nothing.

---

### R4.4 — Backend Integration Tests (Agent: Codex Backend)

**Goal:** Add integration tests for the 59 live endpoints. Currently 0 backend integration tests run in this environment.

| Task | File | Action |
|------|------|--------|
| 4.4.1 | `TerraFusion.API.Tests/` | CostForge USPAP approach tests (5 endpoints) |
| 4.4.2 | `TerraFusion.API.Tests/` | Atlas geometry + spatial query tests (6 endpoints) |
| 4.4.3 | `TerraFusion.API.Tests/` | Dossier document management tests (7 endpoints) |
| 4.4.4 | `TerraFusion.API.Tests/` | Muse NLP engine tests (7 endpoints) |
| 4.4.5 | `TerraFusion.API.Tests/` | Dais controller DB query tests (10 endpoints) |
| 4.4.6 | `TerraFusion.API.Tests/` | Auth + county isolation enforcement tests |

**Risk:** Low — additive only.
**Blocked by:** Nothing (can run parallel with R4.1-R4.3).

---

### R4.5 — Frontend E2E Wiring Validation (Agent: Claude Code)

**Goal:** Validate that all 38 toolServiceRouter routes actually render results in the PropertyPilot UI.

| Task | File | Action |
|------|------|--------|
| 4.5.1 | `toolServiceRouter.coverage.test.ts` | Expand from 6 → 38 route-level tests |
| 4.5.2 | `PropertyPilot.tsx` | Verify all 7 suite filter chips render correct tool counts |
| 4.5.3 | `PropertyWorkbench.tsx` | Verify all 6 tabs load without error |
| 4.5.4 | Suite module components | Verify each module component exports correctly |
| 4.5.5 | Error handling | Verify 501/stub responses show honest error UI (not silent failures) |

**Risk:** Low — test-only changes.
**Blocked by:** R4.1 (forge cleanup may affect imports).

---

### R4.6 — Security Hardening Sweep (Agent: Codex Backend)

**Goal:** Close remaining security gaps identified in the ledger.

| Task | File | Action |
|------|------|--------|
| 4.6.1 | `QuantumConsciousnessController.cs:166,257,511` | Remove 3 TODO stubs — wire to real services or remove endpoints |
| 4.6.2 | `LevyCalculationController.cs:488` | Remove quantum consciousness TODO — use real optimization or remove |
| 4.6.3 | `PiltController.cs` | Audit: confirm auth + county isolation from R1 hardening holds |
| 4.6.4 | `PerformanceController.cs:118` | Wire cache clear to real `IDistributedCache.RemoveAsync` or return 501 |
| 4.6.5 | `CodexNotificationController.cs:290` | Replace placeholder response with real notification delivery |
| 4.6.6 | Security DI audit | Verify all `[Authorize]` + `[RequiresPermission]` on public endpoints |

**Risk:** Medium — security changes need careful review.
**Blocked by:** Nothing.

---

## Agent Assignment Matrix

| Wave | Agent | Parallelizable With | Estimated Scope |
|------|-------|---------------------|-----------------|
| R4.1 | Claude Code (frontend) | R4.2, R4.3, R4.4, R4.6 | ~200 lines removed |
| R4.2 | Codex Backend | R4.1, R4.3, R4.4 | ~150 lines changed |
| R4.3 | Codex Backend | R4.1, R4.2, R4.4 | ~200 lines changed |
| R4.4 | Codex Backend | R4.1, R4.2, R4.3 | ~500 lines added |
| R4.5 | Claude Code (frontend) | R4.4, R4.6 | ~300 lines added |
| R4.6 | Codex Backend | R4.1, R4.4, R4.5 | ~100 lines changed |

**Parallel execution plan:**
- **Wave A (simultaneous):** R4.1 + R4.2 + R4.3 + R4.6
- **Wave B (after A):** R4.4 + R4.5

---

## Execution Order (Critical Path)

```
┌──────────────────────────────────────────────────────────┐
│  WAVE A (parallel)                                        │
│                                                           │
│  R4.1 Forge cleanup ──┐                                  │
│  R4.2 GPT hardening ──┤── all independent ──► Gate check │
│  R4.3 Migration engine ┤                                  │
│  R4.6 Security sweep ──┘                                  │
│                                                           │
│  WAVE B (after Wave A)                                    │
│                                                           │
│  R4.4 Backend integration tests ──┐                      │
│  R4.5 Frontend E2E validation ────┘──► Final gate check  │
│                                                           │
│  FINAL: Update progress ledger v6                         │
└──────────────────────────────────────────────────────────┘
```

---

## Definition of Done (R4)

| Gate | Requirement |
|------|-------------|
| Core gates | 87/87 pass (32+20+7+22+6) |
| Manifest | v1.7.0 (38 tools, 38 handlers, 0 stubs) |
| Deprecated code | 0 `@deprecated` functions in production paths |
| Controller stubs | ≤ 2 (Harris PACS only — per CLAUDE.md governance) |
| Backend tests | New integration test suite passing |
| Frontend coverage | 38/38 route tests passing |
| Security | All public endpoints have `[Authorize]` |
| Progress ledger | v6 updated with R4 evidence |

---

## Items Explicitly OUT OF SCOPE

| Item | Reason |
|------|--------|
| Harris PACS sync | Requires county approval per CLAUDE.md |
| AI Swarm modification | Forbidden per copilot-instructions.md |
| PostGIS production migration | R3.0 delivered dual-mode; production cutover needs DBA |
| Electron desktop shell | Separate initiative |
| LDAP production integration | Development stub is intentional |

---

## Risk Register

| ID | Risk | Severity | Likelihood | Mitigation |
|----|------|----------|------------|------------|
| R1 | Forge removal breaks offline preview | Med | Low | Verify zero callers first |
| R2 | GPT controller regression | High | Med | Surgical changes, existing tests |
| R3 | DataMigration breaks existing data | High | Low | Unit tests + dry-run mode |
| R4 | Security sweep removes needed endpoints | Med | Low | Audit before removal |
| R5 | Integration tests flaky in CI | Med | Med | Use SQLite in-memory for tests |

---

*Classification: Internal working document*
*Last updated: March 8, 2026*
*Version: R4 Plan v1*
