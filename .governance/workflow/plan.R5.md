# R5 Full Completion Plan — End-to-End Production Wiring

> **Purpose:** Close every remaining TODO, stub, placeholder, and hardcoded value across the entire codebase.
> **Branch:** `claude/review-progress-ledger-a8iw5`
> **Date:** March 8, 2026
> **Prereqs:** R1-R4 complete. Auth infrastructure exists (`useAuth` + `AuthProvider`). Email service exists (`ICodexEmailNotificationService`).

---

## R5 Waves (10 Waves, 3 Tiers)

---

### TIER 1 — HIGH VALUE, ACTIONABLE NOW

---

#### R5.1 — Auth Context Wiring (Agent: Claude Code Frontend)

**Goal:** Replace ALL hardcoded `countyId: 'benton'` and `userId: 'current-user'` with real auth context.

**Key Discovery:** `useAuth()` hook already exists at `frontend/apps/os-shell/src/auth/useAuth.ts`. Auth provides `token` and `isAuthenticated`. Need to extract county/user claims from JWT.

| Task | File | Line(s) | Action |
|------|------|---------|--------|
| 5.1.1 | `auth/useAuth.ts` or new `auth/useAuthClaims.ts` | NEW | Create `useAuthClaims()` hook that decodes JWT to extract `countyId`, `userId`, `roles` from token claims |
| 5.1.2 | `PropertyWorkbench.tsx` | 271-272, 300-301 | Replace hardcoded `countyId: 'benton'`, `userId: 'current-user'` with `useAuthClaims()` |
| 5.1.3 | `PropertyWorkbenchWindow.tsx` | 258-259, 287-288 | Same replacement |
| 5.1.4 | `PropertyWorkbenchWindow.tsx` | 318 | Implement TerraTrace `tab_switched` event emission |
| 5.1.5 | `GPTManagementDashboard.tsx` | 159 | Replace `'current-user-id'` with auth claims |
| 5.1.6 | `ResearchPortal.tsx` | 198 | Replace `'phd-researcher-001'` with auth claims |
| 5.1.7 | Gate test | — | 32/32 phase83, type-check |

**Blocked by:** Nothing.

---

#### R5.2 — RAG Dataset API Wiring (Agent: Claude Code Frontend)

**Goal:** Implement all 8 disabled API calls in `RAGDatasetManager.tsx`.

| Task | File | Line(s) | Action |
|------|------|---------|--------|
| 5.2.1 | `RAGDatasetManager.tsx` | 206-209 | Uncomment + wire `GET /api/rag/datasets` |
| 5.2.2 | `RAGDatasetManager.tsx` | 230-233 | Wire `GET /api/rag/datasets/{id}/documents` |
| 5.2.3 | `RAGDatasetManager.tsx` | 254-257 | Wire `GET /api/rag/documents/{id}/chunks` |
| 5.2.4 | `RAGDatasetManager.tsx` | 276-281 | Wire `POST /api/rag/datasets` |
| 5.2.5 | `RAGDatasetManager.tsx` | 316-319 | Wire `POST /api/rag/datasets/{id}/documents` |
| 5.2.6 | `RAGDatasetManager.tsx` | 349-350 | Wire `DELETE /api/rag/datasets/{id}` |
| 5.2.7 | `RAGDatasetManager.tsx` | 369-370 | Wire `DELETE /api/rag/documents/{id}` |
| 5.2.8 | `RAGDatasetManager.tsx` | 387-388 | Wire `POST /api/rag/datasets/{id}/reindex` |

**Note:** Backend RAG endpoints may return 501. Wire the calls with proper error handling — show honest "RAG service not configured" UI when backend returns 501.

**Blocked by:** Nothing.

---

#### R5.3 — Muse NLP Test Coverage (Agent: Codex Backend)

**Goal:** Add integration tests for MuseService (template) and ClaudeMuseService (Claude API fallback).

| Task | File | Action |
|------|------|--------|
| 5.3.1 | `MuseControllerTests.cs` (NEW) | Test all 7 Muse endpoints via WebApplicationFactory |
| 5.3.2 | `MuseServiceTests.cs` (NEW) | Unit test template engine: 6 methods × 4 audiences = 24 tests |
| 5.3.3 | `ClaudeMuseServiceTests.cs` (NEW) | Unit test fallback chain: mock HttpClient failure → verify template fallback + `Fallback: true` |
| 5.3.4 | `ClaudeMuseServiceTests.cs` | Test system prompt building for 6 document types × 4 audiences |
| 5.3.5 | `ClaudeMuseServiceTests.cs` | Test health flag transitions |

**Blocked by:** Nothing.

---

### TIER 2 — MEDIUM VALUE

---

#### R5.4 — SuiteHome Quick Actions (Agent: Claude Code Frontend)

**Goal:** Implement Search, Recent, and Favorites handlers in `SuiteHome.tsx`.

| Task | File | Line(s) | Action |
|------|------|---------|--------|
| 5.4.1 | `SuiteHome.tsx` | 94 | Search → open Launcher with suite-scoped filter pre-applied |
| 5.4.2 | `SuiteHome.tsx` | 102 | Recent → navigate to suite's most recent parcel from recentsStore |
| 5.4.3 | `SuiteHome.tsx` | 110 | Favorites → navigate to suite's pinned items from pinsStore |

**Blocked by:** Nothing (recentsStore and pinsStore exist from Slice 5).

---

#### R5.5 — MetricsCollector Storage Backends (Agent: Claude Code Frontend)

**Goal:** Implement IndexedDB and API storage backends for MetricsCollector.

| Task | File | Line(s) | Action |
|------|------|---------|--------|
| 5.5.1 | `MetricsCollector.ts` | 719 | Implement `indexedDB` save via `idb-keyval` or raw IndexedDB API |
| 5.5.2 | `MetricsCollector.ts` | 743 | Implement `indexedDB` load |
| 5.5.3 | `MetricsCollector.ts` | 719, 743 | Implement `api` backend: POST/GET to `/api/metrics` |

**Blocked by:** Nothing.

---

#### R5.6 — Launcher Search Filtering (Agent: Claude Code Frontend)

**Goal:** Implement search query filtering so launcher items hide when query has no matches.

| Task | File | Action |
|------|------|--------|
| 5.6.1 | Launcher component | Wire `searchQuery` from store through ranking engine to filter displayed items |
| 5.6.2 | `launcher.behavior.test.tsx` | Unskip line 373 test + verify it passes |

**Blocked by:** Nothing (ranking engine exists from Slice 5).

---

#### R5.7 — Desktop UI Completions (Agent: Claude Code Frontend)

**Goal:** Implement About dialog and Pin-to-Start.

| Task | File | Line(s) | Action |
|------|------|---------|--------|
| 5.7.1 | `DesktopContextMenu.tsx` | 138 | Create `AboutDialog` component (version, build date, county, agent count) |
| 5.7.2 | `TaskbarContextMenu.tsx` | 112 | Wire Pin-to-Start to `pinsStore.togglePin()` from Slice 5 |
| 5.7.3 | `CodexAdminPanel.tsx` | 116 | Replace `setTimeout` stub with real `POST /api/codex/configuration` call (with 501 fallback) |

**Blocked by:** Nothing.

---

#### R5.8 — Email Service Wiring (Agent: Codex Backend)

**Goal:** Wire `GPTBudgetAlertService` to existing email infrastructure.

| Task | File | Line(s) | Action |
|------|------|---------|--------|
| 5.8.1 | Create `IEmailService` | NEW | Generic email interface wrapping `ICodexEmailNotificationService` |
| 5.8.2 | `GPTBudgetAlertService.cs` | 41 | Inject `IEmailService` |
| 5.8.3 | `GPTBudgetAlertService.cs` | 276 | Replace log-only with real `SendEmailAsync` call (with fallback to logging when SMTP not configured) |
| 5.8.4 | `Program.cs` | DI | Register `IEmailService` → `EmailService` |

**Blocked by:** Nothing (CodexEmailNotificationService already has SmtpClient impl).

---

### TIER 3 — BLOCKED OR REQUIRES EXTERNAL CONFIG

---

#### R5.9 — Kernel Execution Stubs (Agent: Codex Backend)

**Goal:** Wire Roslyn C# scripting and SQL execution in KernelExecutionService.

| Task | File | Line(s) | Action |
|------|------|---------|--------|
| 5.9.1 | `KernelExecutionService.cs` | 233 | Implement Roslyn C# scripting via `Microsoft.CodeAnalysis.CSharp.Scripting` |
| 5.9.2 | `KernelExecutionService.cs` | 269 | Implement SQL execution via injected `DbContext` or `IDbConnection` |
| 5.9.3 | `Directory.Packages.props` | — | Add `Microsoft.CodeAnalysis.CSharp.Scripting` package |

**Risk:** Medium — Roslyn scripting in production requires sandboxing. Implement with execution timeout + restricted API surface.

---

#### R5.10 — SystemGptAtlasPanel Live Integration (Agent: Claude Code Frontend)

**Goal:** Wire 12 deferred integration tests in SystemGptAtlasPanel.

| Task | File | Line(s) | Action |
|------|------|---------|--------|
| 5.10.1 | `SystemGptAtlasPanel.test.tsx` | 297-312 | Unskip C2.1 connection state display tests (wire `useSystemGptAtlasLive`) |
| 5.10.2 | `SystemGptAtlasPanel.test.tsx` | 319-334 | Unskip C2.2 county node health tests |
| 5.10.3 | `SystemGptAtlasPanel.test.tsx` | 341-351 | Unskip C2.3 live metrics display tests |
| 5.10.4 | `SystemGptAtlasPanel.test.tsx` | 359 | Unskip C2.4 alert display test |
| 5.10.5 | `SystemGptAtlasPanel` component | — | Wire `useSystemGptAtlasLive` hook to component props |

**Note:** AI comparable search in `PropertyValuationService.cs` (line 52) is OUT OF SCOPE — requires Harris PACS integration per CLAUDE.md governance.

---

## Agent Assignment Matrix

| Wave | Agent | Parallelizable With | Scope |
|------|-------|---------------------|-------|
| R5.1 | Frontend | R5.2, R5.3 | Auth claims hook + 6 file updates |
| R5.2 | Frontend | R5.1, R5.3 | 8 API call wiring |
| R5.3 | Backend | R5.1, R5.2, R5.8, R5.9 | ~50 Muse tests |
| R5.4 | Frontend | R5.5, R5.6, R5.7 | 3 quick action handlers |
| R5.5 | Frontend | R5.4, R5.6, R5.7 | IndexedDB + API storage |
| R5.6 | Frontend | R5.4, R5.5, R5.7 | Launcher search filter |
| R5.7 | Frontend | R5.4, R5.5, R5.6 | About dialog + pin + codex save |
| R5.8 | Backend | R5.3, R5.9 | Email service wrapper |
| R5.9 | Backend | R5.3, R5.8 | Roslyn + SQL execution |
| R5.10 | Frontend | After R5.1 | 12 test unskips + live hook wiring |

---

## Execution Order (3 Waves)

```
┌──────────────────────────────────────────────────────────────┐
│  WAVE A (parallel — Tier 1)                                   │
│                                                               │
│  R5.1 Auth context wiring ────────┐                          │
│  R5.2 RAG dataset API wiring ─────┤── all independent        │
│  R5.3 Muse test coverage ─────────┘                          │
│                                                               │
│  WAVE B (parallel — Tier 2, after Wave A)                     │
│                                                               │
│  R5.4 SuiteHome quick actions ────┐                          │
│  R5.5 MetricsCollector storage ───┤                          │
│  R5.6 Launcher search filtering ──┤── all independent        │
│  R5.7 Desktop UI completions ─────┤                          │
│  R5.8 Email service wiring ───────┘                          │
│                                                               │
│  WAVE C (parallel — Tier 3, after Wave B)                     │
│                                                               │
│  R5.9 Kernel execution (Roslyn+SQL) ──┐                      │
│  R5.10 GptAtlas live integration ──────┘                     │
│                                                               │
│  FINAL: Progress ledger v7 + gate check                       │
└──────────────────────────────────────────────────────────────┘
```

---

## Definition of Done (R5)

| Gate | Requirement |
|------|-------------|
| Core gates | 87/87 pass |
| Hardcoded auth values | **0** (all use `useAuthClaims()`) |
| Frontend TODOs | **0** in production components |
| Backend TODOs in controllers | **0** |
| Muse test coverage | 50+ tests (template + Claude fallback) |
| RAG API calls | 8/8 wired (with 501 fallback) |
| MetricsCollector backends | 3/3 (localStorage + IndexedDB + API) |
| Launcher search | Functional + test unskipped |
| Email service | Wired with SMTP fallback |
| Kernel execution | Roslyn + SQL with sandboxing |
| Skipped tests | 0 (all unskipped or removed) |

---

## Items Explicitly OUT OF SCOPE

| Item | Reason |
|------|--------|
| Harris PACS sync | County approval required (CLAUDE.md) |
| AI comparable property search | Depends on Harris PACS |
| AI Swarm modification | Forbidden (copilot-instructions.md) |
| CoPilot autonomous handlers | In Consciousness project (forbidden) |
| PredictiveImpactService ML.NET | Requires trained model data |
| Electron desktop shell | Separate initiative |
| LDAP production auth | Development stub intentional |

---

*Classification: Internal working document*
*Last updated: March 8, 2026*
*Version: R5 Plan v1*
