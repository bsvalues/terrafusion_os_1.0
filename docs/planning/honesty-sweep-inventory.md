# Honesty Sweep — Provenance Disclosure Inventory

**Date:** 2026-03-24
**Branch:** `feat/stage2-stage3-r3-closure`
**Status:** Active gate lane (post-R3 Closure)
**Scope:** Frontend UI surfaces that can render demo/fixture/manual/fallback data

---

## Infrastructure Already In Place

| Component / Hook | Location | Purpose |
|---|---|---|
| `DemoDataBanner` | `components/governance/DemoDataBanner.tsx` | Renders `⚠ DEMO DATA — {module} is displaying sample fixtures, not live county data` |
| `useSourceDisclosure` | `hooks/useSourceDisclosure.ts` | Maps `FreshData.source` → `DisclosureResult` (`label`, `variant`) |
| `PacketProvenance` | `components/dossier/PacketProvenance.tsx` | Provenance chain display for dossier entries |

---

## Tier 1 — Wired and Tested ✅

These surfaces already have `DemoDataBanner` wired AND contract tests in `w5dHonestySweep.contract.test.ts`.

| Surface | File | Data Type | Banner Condition | Test Gate |
|---|---|---|---|---|
| `CostManual` | `pages/forge/cost/CostManual.tsx` | `SAMPLE_COST_SCHEDULES` | `{isSampleData && <DemoDataBanner module="Cost Manual" />}` | Gate 3 |
| `BatchCostRun` | `pages/forge/batch/BatchCostRun.tsx` | `FIXTURE_HISTORY` | `DemoDataBanner module="Batch Cost Run"` | Gate 4 |
| `TerraLevyDashboard` | `applications/terra-levy/TerraLevyDashboard.tsx` | Budget/levy data | Always shown (line 179) | — |
| `SegmentDiscoveryDashboard` | `pages/forge/calibration/SegmentDiscoveryDashboard.tsx` | Segment fixtures | `isFixture` flag | Gate 5 (W4B) |
| `GeoEquityDashboard` | `pages/atlas/GeoEquityDashboard.tsx` | Equity fixtures | `isFixture` flag | Gate 5 (W5B) |

---

## Tier 2 — Hook Provenance Wired, Consumer Not Wired ⚠️

These hooks expose `isSampleData` correctly. The hook contract is tested. The consuming component does NOT wire the flag to `DemoDataBanner`.

### Gap 1 — `StageZeroState` / Today's Work panel

| Item | Detail |
|---|---|
| **File** | `shell/desktop/StageZeroState.tsx` |
| **Hook** | `useTodaysWork()` — returns `{ tasks, loading, isSampleData }` |
| **Gap** | Line 241: `const { tasks: todaysTasks } = useTodaysWork()` — `isSampleData` is silently discarded |
| **Consumer** | `TodaysWorkPanel` (line 115) — renders tasks with no provenance indicator |
| **Risk** | Operator sees sample tasks on the desktop shell and believes they are live queue work |
| **Fix** | Destructure `isSampleData` from hook; pass to `TodaysWorkPanel`; render `DemoDataBanner` when true |
| **Test** | Gate 6 (to be added) |

---

## Tier 3 — Hardcoded Demo Arrays, No Disclosure ⚠️

These components define `DEMO_*` constants inline and render them unconditionally. No `DemoDataBanner` present.

### Gap 2 — `ValueAuditModule`

| Item | Detail |
|---|---|
| **File** | `pages/suites/modules/ValueAuditModule.tsx` |
| **Data** | `DEMO_ENTRIES` (lines 49–106) — array of `ValuationAuditEntry` objects merged with stored entries |
| **Render path** | Line 128: `const all = [...DEMO_ENTRIES, ...stored]`; Line 159: resets to `DEMO_ENTRIES` only on clear |
| **Risk** | Demo audit entries are indistinguishable from real county valuation audit records |
| **Fix** | Import `DemoDataBanner`; render unconditionally at the top of the module (DEMO_ENTRIES are always present) |
| **Test** | Gate 7 (to be added) |

### Gap 3 — `MassAppraisalGIS`

| Item | Detail |
|---|---|
| **File** | `pages/atlas/MassAppraisalGIS.tsx` |
| **Data** | `DEMO_PARCELS` (lines 99–175) — array of `ParcelFeature` objects, no API call |
| **Render path** | Line 373: `{DEMO_PARCELS.map((parcel) => ...)}` — unconditional |
| **Risk** | GIS map always shows demo parcel pins with no indicator that this is not live PACS geometry |
| **Fix** | Import `DemoDataBanner`; render unconditionally (this surface has no live path yet) |
| **Test** | Gate 8 (to be added) |

---

## Tier 4 — Hooks With Fallback Source, No Display Impact ℹ️

These expose `source` typing but the fallback is invisible to the user or the surface is safe.

| Hook / Service | Fallback behavior | Risk level | Action |
|---|---|---|---|
| `useWorkloadSummary` | Returns last-known data with `source: 'fallback'` | Low — stale badge sufficient | No change needed |
| `useForgeValuation` | Returns `source: 'live' \| 'fallback'` | Low — consumer uses `useSourceDisclosure` | No change needed |
| `useDaisSuiteStats` | Falls back to `source: 'county-provider'` | Low — Dais suite stats, not property truth | No change needed |
| `useCostForgeAPI` | Returns null on error | Low — consumers handle null | No change needed |

---

## Out of Scope (This Lane)

| Item | Reason |
|---|---|
| `FixtureDataProvider.ts` | Test-only; `parcelId: 'fixture:*'` prefix makes identity unambiguous |
| `AddressMap.tsx` | Geocoding placeholder; well-commented; no parcel data |
| `VEIMetricCard.tsx` | Pure display component; takes props; no internal data |
| Terra-levy analytics components | No demo/fixture data found in scan |
| Backend | Out of scope for Honesty Sweep |
| `dev-audit/` | Out of scope |

---

## Execution Order

1. **Add Gates 6–8 to `w5dHonestySweep.contract.test.ts`** (red — will fail, no production wiring yet)
2. **Wire `StageZeroState`** — destructure `isSampleData`, pass to panel, render banner
3. **Wire `ValueAuditModule`** — import DemoDataBanner, render unconditionally
4. **Wire `MassAppraisalGIS`** — import DemoDataBanner, render unconditionally
5. **Run tests** — gates 6–8 go green
6. **Run full gate suite** — confirm no regressions
7. **Commit and push**

### Gate commands (same as R3 closure)
```
pnpm run type-check
dotnet test backend/tests/TerraFusion.Unit.Tests/TerraFusion.Unit.Tests.csproj --no-build -q
```

---

## Classification Key

| Label | Meaning |
|---|---|
| `live` | Data fetched from backend API, no fallback active |
| `demo` | Hardcoded DEMO_* constant merged with or replacing live data |
| `fixture` | Hardcoded FIXTURE_* / SAMPLE_* constant used as full replacement |
| `fallback` | Last-known-good or empty state returned when API fails |
| `manual` | User-entered data (no provenance issue) |
| `unknown` | Not inspected |
