# Release Note — Data Mode Hardening (TerraForge / Suite Homes)

**Date:** 2026-04-09
**Commit:** `74e3e42d4`
**Type:** Reliability / Governance hardening
**Branch:** `feat/native-app-integrations`

---

## Summary

Data mode is now fail-fast + single-source. `snapshot` / `fixtures` require an explicit allow flag. Silent non-live mode drift is no longer possible.

---

## Problem Solved

`useDataMode` independently polled `/health/live` to determine mode. When the backend was reachable, it returned `'live'` regardless of what `VITE_DATA_MODE` was set to. Result: TerraForge showed "Live metrics" (green chip) and suppressed the `sourceDisclosure` warning banner while actually serving bundled snapshot data. Users had no indication their KPI stats were stale.

---

## Shipped

### `dataProvider.ts`

- **`resolveDataMode(env?)`** — single function owns all mode resolution.
  - `VITE_DATA_MODE=snapshot|fixtures` throws immediately unless `VITE_ALLOW_NON_LIVE_MODE=1`.
  - Unknown mode values fall back to `live` silently (no throw on typos).
  - Accepts explicit `env` param for isolated unit testing without touching real env vars.
- **`DataModeReason`** type — `'env-default' | 'env-explicit'` — records why the mode was selected.
- **`getDataProviderDiagnostics()`** — returns `{ mode, reason, initializedAt }` from the singleton.
  - Safe to call before first `getDataProvider()` (returns `initializedAt: null`).
- **`resetDataProvider()`** — now also clears diagnostics cache.

### `useDataMode.ts`

- Removed `/health/live` polling entirely.
- Now reads `getDataProviderDiagnostics()` synchronously — no async, no network, no divergence.
- `DataModeState` shape updated: `mode: DataMode` (was `'live' | 'mock'`), added `reason`.
- `checking` is always `false` — mode is stable for the lifetime of the singleton.

### `useCountyStats.ts`

- Added `sourceDisclosure: string | null` to `CountyStatsResult`.
- `computeSourceDisclosure()` helper lives inside the hook — not scattered across components.
- Suite components destructure `sourceDisclosure` directly; no local recomputation needed.

### `ForgeSuiteHome.tsx`

- Removed local `getSourceDisclosure()` helper — replaced by `useCountyStats().sourceDisclosure`.
- Diagnostics pill (`data-testid="forge-mode-diagnostics"`) gated on `VITE_SHOW_MODE_DIAGNOSTICS=1` only.
  - Previously gated on `DEV === true` which fired in vitest (test bleed eliminated).

---

## Operator Impact

**Nothing changes for default usage** — `VITE_DATA_MODE` unset = live path, same as before.

To use non-live modes intentionally:

```bash
# Snapshot (bundled Benton dev data)
VITE_DATA_MODE=snapshot VITE_ALLOW_NON_LIVE_MODE=1 npm run dev

# Fixtures (synthetic edge-case data)
VITE_DATA_MODE=fixtures VITE_ALLOW_NON_LIVE_MODE=1 npm run dev

# Enable diagnostics pill in UI (shows mode:live | mode:snapshot | mode:fixtures)
VITE_SHOW_MODE_DIAGNOSTICS=1 npm run dev
```

If `VITE_DATA_MODE=snapshot|fixtures` is set without the allow flag, the app throws at startup with an actionable error message.

---

## Validation

| Test file | Tests | Result |
|-----------|-------|--------|
| `dataProvider.modeResolution.contract.test.ts` | 12 | ✅ pass |
| `useDataMode.unifiedSource.contract.test.ts` | 6 | ✅ pass |
| `forgeSuiteSourceHonesty.contract.test.tsx` | 7 | ✅ pass |
| `forgeSuiteHome.contract.test.tsx` (existing taxonomy tombstones) | 22 | ✅ pass |
| **Total** | **47** | **✅ 0 fail** |

Token ratchet: 764 ≤ 764 ✅

---

## Runbook

See `docs/ops/RUNBOOKS/frontend-data-mode.md` for operator triage steps, audit checklist, and incident recording requirements.

---

## Follow-On (non-blocking)

Audit other suite homes for the old local `getSourceDisclosure()` pattern:

```bash
grep -rn "getSourceDisclosure\|health/live" frontend/apps/os-shell/src/pages/suites/
```

Migrate any hits to `useCountyStats().sourceDisclosure`.
