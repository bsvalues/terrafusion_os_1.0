# R1 Integration Trace Lane Notes (#516–#522)

Last updated: 2026-03-03

## #516 — Lane Z: Fix runtime-lock test — RBAC write:os claim alignment
Baseline repair: aligned the runtime-lock test with the RBAC claim vocabulary so that `write:os` permission checks pass deterministically. No functional change to runtime behavior.

## #517 — Docs: Trace contract + durability ADR + security invariants
Documentation-only. Added trace-store contract doc, durability ADR (ADR-0015), and security invariant mapping. No code changes.

## #518 — Lane H: Trace Audit Loop Guard + Per-Parcel Cap
Hardened `TraceStore` against unbounded growth: added per-parcel event cap (`perParcelCap`, configurable, default 2000) with LRU eviction, plus an audit-loop guard that prevents `trace_accessed` events from triggering infinite self-recording chains. Stats endpoint now reports `cappedParcelsCount` and `maxEventsInParcel`.

## #519 — Lane Y: Fix order-dependent trace query test assertions (baseline repair)
Test-only repair: removed order-sensitivity in trace query assertions that caused flake when events shared identical timestamps. No production code changes.

## #520 — Lane I: EvidenceRail UX + Diagnostics
Frontend presentational additions to `EvidenceRail.tsx`: staleness indicator (`lastFetchedAt` → relative time display, `fetchFailed` → "Feed unavailable"), context-aware empty state (`isFiltered` variant), and admin diagnostics drawer (`showDiagnostics` + `diagnostics` props). All new props are optional—backward compatible. 20 contract tests with `now` prop for deterministic staleness.

## #521 — docs(trace): ADR-0015 + runbook + security mapping + release note
Documentation-only. Committed previously untracked files: `trace-store.md`, `trace-access-audit.md`, and `R1_INTEGRATION_TRACE_510_515.md`. No code changes.

## #522 — Lane J: Trace stats wiring (frontend)

**Merge commit:** `9137e833de5f088741aa4f4ba919d70869aea3e3`

### Files changed (from GitHub PR diff — authoritative)

| File | Change |
|------|--------|
| `frontend/apps/os-shell/src/api/pilotApi.ts` | +30/−0 |
| `frontend/apps/os-shell/src/hooks/useTraceStats.ts` (new) | +107/−0 |
| `frontend/apps/os-shell/src/components/pilot/ExecutionConsole.tsx` | +44/−6 |
| `frontend/apps/os-shell/src/__tests__/hooks/useTraceStats.test.tsx` (new) | +64/−0 |
| `frontend/apps/os-shell/src/__tests__/ui-observability/GovernanceRailAndConsole.test.tsx` | +240/−1 |

**5 files**, 485 insertions, 7 deletions. Frontend-only. No backend changes.

### What shipped

- **`pilotApi.ts`**: `PilotTraceStatsResponse` interface + `getTraceStats()` function calling `GET /pilot/traces/stats`.
- **`useTraceStats.ts`** (new hook): Fetches stats via `getTraceStats()`, maps response to `EvidenceRailDiagnostics`, supports `enabled` gate and optional polling. Returns `{ diagnostics, lastFetchedAt, fetchFailed, refresh }`.
- **`ExecutionConsole.tsx`**: Added `canViewGlobalTraceDiagnostics()` role gate (checks `ELEVATED_TRACE_ROLES`: admin, administrator, compliance_officer, auditor, supervisor — or `admin:trace` permission). Calls `useTraceStats({ enabled: showDiagnostics && showEvidence && isTerminal })`. Forwards `diagnostics/lastFetchedAt/fetchFailed/showDiagnostics` into `<EvidenceRail>`. Renders the label **"Trace Store Diagnostics (global)"** in a `<p>` tag above EvidenceRail (data-testid: `trace-diagnostics-label`).

### Where the global label lives

The string `"Trace Store Diagnostics (global)"` is rendered in **`ExecutionConsole.tsx` line 307**, not in `EvidenceRail.tsx`. EvidenceRail's own drawer toggle text remains the Lane I original: `"▸ Show diagnostics"` / `"▾ Hide diagnostics"`. Lane J did **not** modify `EvidenceRail.tsx`.

### Gating

- `canViewGlobalTraceDiagnostics()` checks session role against `ELEVATED_TRACE_ROLES` set, mirroring backend's `hasElevatedTraceRole()`.
- Non-elevated users see no diagnostics label, no stats fetch, no drawer data.

### Tests added

- `useTraceStats.test.tsx`: 2 hook unit tests (success mapping, 403 failure handling).
- `GovernanceRailAndConsole.test.tsx`: +240 lines — integration tests for ExecutionConsole diagnostics wiring (admin fetch+render, drawer values, non-admin exclusion, 403 graceful).

### Discrepancy correction

Earlier session summaries incorrectly stated:
- ❌ Label was in `EvidenceRail.tsx` → ✅ Label is in `ExecutionConsole.tsx`
- ❌ `EvidenceRail.tsx` was modified → ✅ Not in the PR diff
- ❌ "3 test files" → ✅ 2 test files (hook unit + governance integration)
- ❌ `lane-j-trace-stats-wiring.test.tsx` + `EvidenceRail-lane-i.test.tsx` listed → ✅ These were intermediate artifacts; the merged diff contains `useTraceStats.test.tsx` + `GovernanceRailAndConsole.test.tsx`

The authoritative record is the GitHub PR #522 files-changed list above.

## Observability Slice Complete (Lanes H/I/D-docs/J)

With #522 merged, the R1 Observability Slice is complete:

| Lane | PR | Scope | Status |
|------|----|-------|--------|
| H | #518 | Per-parcel cap + audit loop guard (backend) | ✅ Merged |
| I | #520 | EvidenceRail UX + diagnostics (frontend presentational) | ✅ Merged |
| D-docs | #521 | ADR-0015 + runbook + release notes (docs) | ✅ Merged |
| J | #522 | Trace stats wiring (frontend consumer) | ✅ Merged |

Post-merge sterile: `r1/integration` — type-check clean, 479/479 core tests pass, working tree clean.

## Security Invariant (Across #516–#522)
- Per-parcel cap prevents unbounded memory growth (configurable, default 2000).
- Audit loop guard prevents `trace_accessed` self-amplification.
- Stats endpoint remains elevated-role gated with explicit `403` denial.
- Frontend role gate mirrors backend: identical role set, client-side exclusion + server-side enforcement.
- No PII in trace stats payloads.
