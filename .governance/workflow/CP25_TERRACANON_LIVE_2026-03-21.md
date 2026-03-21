# CP25 — TerraCanon Live Wiring Seal
**Date**: 2026-03-21
**Phase**: 32 (Claude Code) / Phase 9 live (CP-25)
**Status**: FULL LIVE PASS — TC-D complete, TC-E complete
**Commit**: d509cf8ba → (Phase 32 final commit pending)

---

## Root Cause: Why March 25 Was Wrong

The "Codex service becomes available 2026-03-25" policy hold in CP23 was based on assumed
infrastructure availability — not a real external dependency. The CodexController and
CodexService existed in the codebase on 2026-03-21. The actual blockers were two missing DI
registrations and one missing hub route mapping.

**Fixes applied**:
1. `builder.Services.AddScoped<ICodexService, CodexService>()` — CodexController dependency
2. `builder.Services.AddScoped<ICodex369FrameworkService, Codex369FrameworkService>()` — hub dependency
3. `app.MapHub<Codex369Hub>("/hubs/codex369")` — hub was not mapped

Three lines. All committed.

---

## TC-D: REST Endpoints (5/5 LIVE PASS)

Verified 2026-03-21 14:50 UTC against `http://localhost:5000`

| Endpoint | HTTP | Score | Notes |
|---|---|---|---|
| `/api/codex/ultimate-power` | 200 | 1.362 / 12 | alertLevel=3 (Emergency — expected for stub metrics) |
| `/api/codex/system-wide` | 200 | sp=1.12 cq=1.69 comp=1.27 | domainScores present |
| `/api/codex/system-performance` | 200 | 1.121 | |
| `/api/codex/code-quality` | 200 | 1.691 | |
| `/api/codex/compliance` | 200 | 1.274 | |

**Note on scores**: CodexService uses hardcoded stub metrics (by design). Scores reflect
the 3-6-9 amplification formula applied to static values. Real metrics require
Prometheus/AppInsights/SonarQube integration (post-launch scope).

---

## TC-E: Codex369Hub Collaboration Session (9/9 LIVE PASS)

**Verified 2026-03-21 against `http://localhost:5000/hubs/codex369`**

Hub: `TerraFusion.AI.Hubs.Codex369Hub` mapped at `/hubs/codex369`
Protocol: SignalR JSON Long Polling (raw HTTP, no client library)
Script: `os-platform/development/testing-suite/phase32-codex-collab-smoke.cjs`

| Test | Method | Result |
|---|---|---|
| TC-E-1 | Negotiate `/hubs/codex369/negotiate` | PASS — connectionToken returned |
| TC-E-2 | Handshake JSON protocol v1 | PASS — HTTP 200 |
| TC-E-3 | `SubscribeToFrameworkUpdates('benton')` | PASS — HTTP 200 |
| TC-E-4 | `GetCurrentStatus(null)` | PASS — Codex369StatusDto returned |
| TC-E-5 | `GetFoundationMetrics(null)` | PASS — non-empty List<FoundationMetric> |
| TC-E-6 | `GetAmplificationMetrics(null)` | PASS — non-empty List<AmplificationMetric> |
| TC-E-7 | `GetUltimatePower(null)` | PASS — UltimatePowerMetric with score |
| TC-E-8 | `RequestBalanceRecalculation(null)` | PASS — HTTP 200 |
| TC-E-9 | `UnsubscribeFromFrameworkUpdates(null)` | PASS — HTTP 200 |

**Key discovery**: SignalR does not apply C# default parameter values. Hub methods with
`string? countyId = null` require `arguments: [null]` from the client, not `arguments: []`.

**Hub method signatures** (from Codex369Hub.cs):
- `SubscribeToFrameworkUpdates(string? countyId = null)` → Task (void)
- `UnsubscribeFromFrameworkUpdates(string? countyId = null)` → Task (void)
- `GetCurrentStatus(string? countyId = null)` → Task<Codex369StatusDto>
- `GetFoundationMetrics(string? countyId = null)` → Task<List<FoundationMetric>>
- `GetAmplificationMetrics(string? countyId = null)` → Task<List<AmplificationMetric>>
- `GetUltimatePower(string? countyId = null)` → Task<UltimatePowerMetric>
- `RequestBalanceRecalculation(string? countyId = null)` → Task (void)

---

## DI Fix Impact

| Concern | Status |
|---|---|
| Frontend CodexDashboard.tsx already calls `/api/codex/system-wide` | Now returns 200 |
| CodexEmailNotificationPanel.tsx calls `/api/codex/notifications/*` | Separate controller, unaffected |
| Vitest suite regression | 6186/6186 (DI fix is backend-only, no frontend change) |

---

## Gate Status

| Gate | Status |
|---|---|
| TC-A (29 canon tests) | PASS (static, proven 2026-03-21) |
| TC-B (frontend surfaces REAL) | PASS (static, proven 2026-03-21) |
| TC-C (controllers present) | PASS (static, proven 2026-03-21) |
| TC-D (live REST endpoints) | **LIVE PASS 5/5 — 2026-03-21** |
| TC-E (collaboration session) | **LIVE PASS 9/9 — 2026-03-21** |

**Phase 32 FULLY SEALED. All gates green.**

---

*The machine didn't wait for March 25. The Codex service was always here. Three lines in Program.cs opened the lock.*
