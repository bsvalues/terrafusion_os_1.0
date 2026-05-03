# Incident Memory Record v1

- Incident ID: IMR-20260409-001
- Created At (UTC): 2026-04-09T00:00:00Z
- Owner: bsval
- Status: Resolved
- Freshness SLA: Revalidate every 24h while open

---

## 1) Incident Summary

**Title:** TerraForge data-mode drift — `useDataMode` reported `live` while provider served snapshot data

**One-line impact:** ForgeSuiteHome chip read "Live metrics" and `sourceDisclosure` was suppressed even when `VITE_DATA_MODE=snapshot` was active, hiding that county stats were stale snapshot data.

**First observed (UTC):** 2026-04-09

**Affected surface(s):** suite-forge (ForgeSuiteHome chip, taskbar data-mode indicator, any consumer of `useDataMode`)

---

## 2) User-Visible Symptoms

- "Live metrics" chip displayed on ForgeSuiteHome while `VITE_DATA_MODE=snapshot` was set — chip should read "Snapshot-backed"
- `sourceDisclosure` banner suppressed — users had no warning that KPI stats were from bundled snapshot, not live PACS
- `useDataMode().mode` returned `'live'` because `/health/live` backend was reachable, regardless of configured data mode
- No fail-fast error when `VITE_DATA_MODE=snapshot` was set without `VITE_ALLOW_NON_LIVE_MODE=1`

---

## 3) Canonical Source Precedence (must be explicit)

Conflict resolution order used for this incident:

1. Live production evidence / trace
2. Canonical governance docs / lockfiles
3. Approved runbooks
4. Advisory memory

**Any conflict found?** Yes

**If yes, which source won and why?**
The DataProvider singleton (`dataProvider.ts`) was the authoritative mode source — it read `VITE_DATA_MODE` and served the correct data. `useDataMode` ran an independent `/health/live` network probe and reported a different answer. Provider singleton won: it is the system of record for what data is actually served.

---

## 4) Evidence Ledger (source-cited only)

| # | Source Type | Path/URL | Key Fact | Timestamp |
|---|-------------|----------|----------|-----------|
| 1 | Code | `frontend/apps/os-shell/src/hooks/useDataMode.ts` (pre-fix) | Hook polled `/health/live` independently of provider; returned `'live'` when endpoint was reachable regardless of `VITE_DATA_MODE` | 2026-04-09 |
| 2 | Code | `frontend/apps/os-shell/src/services/dataProvider.ts` (pre-fix) | `getDataProvider()` read `VITE_DATA_MODE` and served snapshot, but had no `resolveDataMode()` export and no diagnostics API for other hooks to query | 2026-04-09 |
| 3 | Code | `frontend/apps/os-shell/src/pages/suites/ForgeSuiteHome.tsx` (pre-fix) | `getSourceDisclosure(source)` helper lived in component; `source` derived correctly via `useCountyStats` but chip diverged because it used the component's `source` not `useDataMode` | 2026-04-09 |
| 4 | Test | `src/__tests__/forge/forgeSuiteHome.contract.test.tsx` | 22/22 taxonomy tombstone tests green throughout — mode drift did not affect card taxonomy | 2026-04-09 |
| 5 | Command output | `git show 74e3e42d4` | Fix commit: 7 files, 540 insertions, 70 deletions; token ratchet 764 ≤ 764 | 2026-04-09 |

---

## 5) Reproduction

### Preconditions
- Environment: local dev
- Branch: `feat/native-app-integrations`
- Flags/env vars: `VITE_DATA_MODE=snapshot` set, `VITE_ALLOW_NON_LIVE_MODE` NOT set, backend API reachable on port 5000
- Data mode: snapshot (intended), live (reported by hook)

### Steps
1. Set `VITE_DATA_MODE=snapshot` in `.env.development`
2. Start frontend dev server (`npm run dev`) with .NET API running on port 5000
3. Navigate to TerraForge suite home

### Expected
- Chip: "Snapshot-backed" (amber)
- `sourceDisclosure` banner visible: "Snapshot-backed county aggregates…"

### Actual
- Chip: "Live metrics" (green) — `/health/live` returned 200
- `sourceDisclosure` banner absent — users had no indication of data origin

---

## 6) Hypotheses (labeled, not facts)

| Hypothesis ID | Statement | Confidence (0-100) | Evidence for | Evidence against |
|---------------|-----------|--------------------|--------------|------------------|
| H1 | `useDataMode` polls `/health/live` independently and its result diverges from provider when backend is up but `VITE_DATA_MODE=snapshot` | 100 | Confirmed by reading pre-fix `useDataMode.ts` lines 31–48 | None |
| H2 | The `getDataProvider()` singleton had no diagnostics export, forcing `useDataMode` to make its own network call | 100 | `dataProvider.ts` pre-fix had no `getDataProviderDiagnostics()` export | None |
| H3 | `VITE_DATA_MODE=snapshot` without `VITE_ALLOW_NON_LIVE_MODE=1` silently succeeded, enabling the condition | 100 | Pre-fix `getDataProvider()` had no guard — accepted any `VITE_DATA_MODE` value without validation | None |

---

## 7) Triage Commands + Results

```bash
# Confirm mode divergence — provider mode vs hook mode
grep -n "health/live" frontend/apps/os-shell/src/hooks/useDataMode.ts
# Pre-fix: line 31 — fetch('/health/live', ...) confirmed independent network call

# Confirm no diagnostics API on provider
grep -n "getDataProviderDiagnostics\|resolveDataMode" frontend/apps/os-shell/src/services/dataProvider.ts
# Pre-fix: no matches — provider had no observable diagnostics

# Confirm 22 taxonomy tests still green after fix
npx vitest run apps/os-shell/src/__tests__/forge/forgeSuiteHome.contract.test.tsx
# Output: 22/22 pass

# Confirm 47/47 new + existing tests green
npx vitest run apps/os-shell/src/__tests__/forge/dataProvider.modeResolution.contract.test.ts \
  apps/os-shell/src/__tests__/forge/useDataMode.unifiedSource.contract.test.ts \
  apps/os-shell/src/__tests__/forge/forgeSuiteSourceHonesty.contract.test.tsx \
  apps/os-shell/src/__tests__/forge/forgeSuiteHome.contract.test.tsx
# Output: 47/47 pass, 0 fail
```

---

## 8) Root Cause (when confirmed)

**Root cause statement:**
`useDataMode` maintained an independent network probe (`/health/live`) to determine mode, making it structurally incapable of agreeing with the DataProvider singleton when `VITE_DATA_MODE` was set to a non-live value but the backend was reachable.

**Contributing factors:**
1. `dataProvider.ts` had no exported diagnostics API — other modules couldn't query the provider's resolved mode without constructing one themselves
2. No fail-fast guard on `VITE_DATA_MODE=snapshot|fixtures` — silent acceptance allowed the misconfiguration to reach components undetected
3. `getSourceDisclosure()` lived in `ForgeSuiteHome` as a local helper instead of in `useCountyStats` — prevented hook-level testing of disclosure logic

**Why this recurred (if repeat):**
First occurrence for this specific pattern. Related to general architecture risk of multiple modules independently reading env vars and making independent network calls rather than delegating to the singleton they share.

---

## 9) Mitigation / Fix Plan

### Immediate Mitigation (today)
- [x] `resolveDataMode(env?)` added to `dataProvider.ts` — single function owns all mode resolution, testable via explicit env param
- [x] `getDataProviderDiagnostics()` exported — returns `{ mode, reason, initializedAt }` for any module to query
- [x] `useDataMode` rewritten to read `getDataProviderDiagnostics()` — no network call, no divergence possible

### Durable Fix (this sprint)
- [x] Fail-fast guard: `VITE_DATA_MODE=snapshot|fixtures` throws unless `VITE_ALLOW_NON_LIVE_MODE=1` — misconfiguration is loud
- [x] `sourceDisclosure` moved into `useCountyStats` return — computed once at hook level, not scattered across components
- [x] `showModeDiagnostics` pill in ForgeSuiteHome gated on `VITE_SHOW_MODE_DIAGNOSTICS=1` opt-in (not `DEV` flag — avoids test environment bleed)

### Guardrails (must include tests/alerts)
- [x] Contract test added: `dataProvider.modeResolution.contract.test.ts` (12 tests — resolveDataMode paths + fail-fast + diagnostics)
- [x] Contract test added: `useDataMode.unifiedSource.contract.test.ts` (6 tests — confirms no `/health/live` fetch)
- [x] Contract test added: `forgeSuiteSourceHonesty.contract.test.tsx` (7 tests — disclosure banner + pill visibility)
- [x] Existing 22 taxonomy tombstone tests still green

---

## 10) Exit Criteria (definition of done)

- [x] Repro no longer possible — `resolveDataMode()` is the only env reader; `useDataMode` reads diagnostics
- [x] Tests pass — 47/47 green
- [x] Source-cited resolution note published — this document
- [x] Handoff packet complete — see §11
- [x] Freshness timestamp updated — 2026-04-09

---

## 11) Handoff Packet (required)

**Incident state:** Resolved — fix committed, tests green, no open risks

**What changed:**
- `dataProvider.ts`: `resolveDataMode()`, `DataModeReason`, `DataProviderDiagnostics`, `getDataProviderDiagnostics()`, fail-fast guard in `getDataProvider()`
- `useDataMode.ts`: Full rewrite — synchronous, reads provider diagnostics, no network call
- `useCountyStats.ts`: Added `sourceDisclosure: string | null` to return type; `computeSourceDisclosure()` helper moved here
- `ForgeSuiteHome.tsx`: Destructures `sourceDisclosure` from hook; removed local `getSourceDisclosure()` helper; diagnostics pill opt-in via `VITE_SHOW_MODE_DIAGNOSTICS=1`

**Why it changed:**
`useDataMode` had an independent network probe that could contradict the DataProvider singleton's resolved mode. The fix establishes the singleton as the single source of truth and gives other modules a stable diagnostics API to query it.

**What to verify next:**
- Any other hook or component that calls `/health/live` independently should be audited for the same pattern
- `useBackendConnection` (SignalR) may legitimately poll for connection state — confirm it doesn't also control data-mode display

**Open risks:**
- None for this specific pattern. Broader risk: other surfaces (Atlas, Dais suite homes) may have copied the same `getSourceDisclosure()` local-helper pattern and should be updated to use `useCountyStats().sourceDisclosure`

**Next owner:** bsval

---

## 12) Memory Classification + Policy

### Allowed classes present?
- [x] Incident summary
- [x] Debug hypotheses
- [x] Repro steps
- [x] Known-fix pattern
- [x] Source links
- [x] Handoff notes

### Forbidden classes check
- [x] No PII
- [x] No credentials/secrets
- [x] No regulated payloads
- [x] No uncited policy truth
- [x] No governance artifact writes

---

## 13) 30-Day Metric Hooks

- Root-cause duration (minutes): ~30 (analysis) + ~45 (implementation + tests)
- Included in source-cited resolution (% contribution): 100%
- Reopened incident? No

---

## 14) Final Resolution Note (source-cited)

**What happened:** ForgeSuiteHome displayed "Live metrics" and suppressed the `sourceDisclosure` warning banner while `VITE_DATA_MODE=snapshot` was active, because `useDataMode` polled `/health/live` independently of the DataProvider singleton (confirmed: `useDataMode.ts` pre-fix lines 31–48).

**Why it happened:** The DataProvider singleton had no exported diagnostics API (`getDataProviderDiagnostics` did not exist pre-fix), forcing `useDataMode` to make its own network probe — which returned `live` whenever the backend was reachable, regardless of what mode the provider was actually using.

**What fixed it:** `resolveDataMode()` (commit `74e3e42d4`) centralizes all mode resolution in `dataProvider.ts`. `getDataProviderDiagnostics()` exposes the singleton's resolved mode. `useDataMode` now reads diagnostics synchronously — divergence is structurally impossible. Fail-fast guard prevents the misconfiguration from being silent.

**What prevents recurrence:** Three new contract test files (47 total tests) lock the contract. `useDataMode.unifiedSource.contract.test.ts` explicitly asserts zero calls to `/health/live`. `dataProvider.modeResolution.contract.test.ts` locks fail-fast behavior. Any regression will fail CI by name.
