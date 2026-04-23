# chunk-1-integration — Delivery Summary

**Branch:** `chunk-1-integration` (pushed to `origin` at github.com/bsvalues/terrafusion_os_1.0)
**Base:** `chore/terra-levy-parity-sync` @ `732728a6c`
**Tip:** `f5e0f1066` (Chunk 6)
**Working session:** 2026-04-22 → 2026-04-23

## What this branch contains

A seven-chunk program that closes the four blockers identified in the April 22
full-stack readiness audit and delivers credibility/polish fixes across the
County Studio + Statistics Studio surfaces. Everything merges cleanly from
`chore/terra-levy-parity-sync` as a strict superset — no destructive history.

## Chunk-by-chunk ledger

### Chunk 1 — unblocks

| Commit | Scope |
|---|---|
| `2c3ee14ee` | Baseline unblock (cherry-picked from track-a): adds `PacsCanonicalizer.CanonicalizePropertiesOnlyAsync` + `NoOpAdvancedCacheService`, both referenced by `Program.cs` but previously missing — solution wouldn't build. |
| `ba723f318` | **1.1 countyId Guid-vs-string contract.** `ICountyResolver` + `CountyResolver` accept `"benton"` or a Guid at the API boundary. `CreateStudyRequest.CountyId` and `GET /studies?countyId=` now take a string; resolution happens in service/controller layers. 10-test coverage on resolver (Guid, name case-insensitive, name with whitespace, unknown→throw, empty→throw, cache correctness). |
| `5943f70ea` | **1.2 silent-error retirement.** `useStudyData` hook now surfaces per-resource `{loadStatus, loadErrors}` instead of `.catch(() => setX([]))`. `LoadErrorBanner` renders an actionable retry UI when any of segments/cohorts/scenarios errored. Store gains `setLoadStatus(resource, status, errorMessage)` and `retryAll()` exposed through the hook. |
| `a07a76896` | **1.3 kernel CI.** `terraforge-kernels.yml` runs fmt + clippy + test + dual-OS release build + a smoke test that asserts `replacementCost = 309551.25` for the canonical payload + publishes build artifacts. Prevents silent drift on the Rust math engines. |
| `8831670c7` + `7df83c16a` | **1.4 + 1.5 trunk merges.** Both `feature/county-studio-gap-fill` (11-task UI wiring) and `feature/track-a-rust-kernel-integration` (kernel contract DTOs + `RustKernelProcessHost` + `CostKernelClient`/`ValuationKernelClient` + `KernelValuationService` + real-binary integration tests + E2E path) merged with `--no-ff`. |

### Chunk 2 — Statistics Studio credibility

| Commit | Scope |
|---|---|
| `25cd5bdf9` | **A1 tierSlope + tierMedians.** `ratioAnalysisService.ts:169` had `tierSlope: 0` hardcode. Backend `TerraForgeController.GetRatioStudy` now computes `tierSlope` (IAAO PRB slope) and `tierMedians` (median-per-price-quartile). Backend returns `null` when trimmed sample < 8 rows for tier medians / < 5 rows for slope — frontend renders "insufficient data" rather than fake zeros. +4 backend tests: tier-null semantics, slope computation, all-quartile medians assertion with exact expected values, `tierSlope = prb` by construction. |
| `4c2f5ec76` | **A2 closeout + A4.** CostForge `dataIntegrityWarning` field PACS-scrubbed (`"verify source column scale"` now) + +2 backend tests (high-dep seeding triggers warning; normal-dep seeding omits it). Verified frontend CostForgeDashboard already renders amber ⚠ indicator + tooltip + helper text at the Avg Physical Dep KPI, and "Cost Schedule Coverage by Property Type" title + quality-class-vs-property-type clarifying note already in place. A3 ($148/sqft hardcode) confirmed already removed from an earlier pass. |

### Chunk 3 — CountyStudy segment derivation

| Commit | Scope |
|---|---|
| `9eb0d6d4b` | Makes empty `CountyStudy*` tables not empty. `ICountyStudySegmentDerivationService.DeriveAsync(studyId, userId)` reads canonical Properties + CamaCharacteristics + ComparableSales for `study.CountyId × study.TaxYear`, groups by `(Neighborhood × BuildingType × QualityGrade)` with UNKNOWN fallbacks, computes per-segment medianRatio/COD/PRD (IAAO §6-§7 formulas when ≥5 ratios) + stabilityScore (inverse-COD) + riskScore (composite) + exceptionCount (coarse fence). Creates a baseline `CountySegmentSet` with incremented Version — idempotent-per-study. Points `study.ActiveSegmentSetId` at the new baseline. `POST /api/county-study/studies/{studyId}/derive-segments` endpoint. DI registered. `ITerraFusionDbContext` gains `DbSet<ComparableSale>` (concrete context already had it). +9 derivation tests. |

### Chunk 4 — retire scenario-preview lies

| Commit | Scope |
|---|---|
| `728915987` | `PreviewScenarioImpactAsync` previously returned `codAfter = codBefore × 0.87m` regardless of input — a fixed multiplier unrelated to the scenario's magnitude or type. Retired. Replaced with IAAO-correct projection: percentage adjustments treat COD/PRD as scale-invariant (proven correct for uniform multiplication), median shifts by factor, and exception count is computed by projecting per-segment medians and counting segments whose projected median falls outside the IAAO `[0.70, 1.30]` fence (whole-segment parcel count contributes). Flat-dollar branch uses a bounded conservative approximation annotated in code as "kernel per-parcel recomputation pending." Cohort→segment resolution via `ExtractSegmentIds(Definition JSON)` so cohorts with explicit segmentIds use only those segments, not the study-wide baseline. +5 honesty tests: scale-invariance, median-shift-by-factor, exceptions-increase-when-shift-crosses-fence, flat-dollar-changes-COD-conservatively, cohort-with-segmentIds-uses-only-those-segments. |

### Chunk 5 — bidirectional hub

| Commit | Scope |
|---|---|
| `6bb97545e` | `useCountyStudyHub.ts` had `connection.on('ReceivePresence', () => {})` and `connection.on('ReceiveProjection', () => {})` as no-ops — incoming peer activity was silently dropped. Now parses `{type, payload}` and pushes into new `peerPresence` and `incomingProjections` ring buffers on the store. `PEER_HISTORY_MAX = 20` bound keeps memory predictable in long sessions. Projection with `type='clear'` flushes the buffer instead of appending — honors the Atlas-side clear semantic. +3 hook tests + +6 store tests (ring-buffer overflow, clear-flushes, clearIncomingProjections). Atlas Live View side was already bidirectional; this closes the Studio side. |

### Chunk 6 — CLI + skeleton + a11y

| Commit | Scope |
|---|---|
| `f5e0f1066` | Three pragmatic polish items. **CLI:** `dotnet run --project TerraFusion.API -- --derive-segments --study-id=<guid>` reuses the Chunk-3 service for batch operation from the command line; clear usage message + `exit 0/1/2` contract. **Skeleton:** `SegmentTable` renders 6 shimmer-rows while `loadStatus.segments === 'loading'` (wrapped in `role="status"`/`aria-live="polite"`), `role="alert"` error panel showing `loadErrors.segments`, and the pre-existing empty state. **A11y:** tab bar is a proper WAI-ARIA tablist — `role="tablist"` + `role="tab"` + `aria-selected` + `aria-controls` + roving tabIndex + Arrow/Home/End keyboard nav; panel gets `role="tabpanel"` + `aria-labelledby`. +3 a11y tests; 6 existing tests migrated from `getByRole('button')` → `getByRole('tab')`. |

## Test totals

**Backend .NET:** Solution builds clean (0 errors). New tests across this branch:

| Suite | New tests |
|---|---|
| CountyResolverTests | 10 |
| RatioStudyTests (+A1) | +4 |
| CostForgeDashboardStatsTests | 2 |
| CountyStudySegmentDerivationServiceTests | 9 |
| CountyStudyServiceTests (+scenario-preview honesty) | +5 |
| **Total new backend** | **30** |

**Frontend vitest:** 68/68 pass in the county-studio test directory. Net additions include:

| Test file | New tests |
|---|---|
| countyStudioStore.test.ts | +6 (peer/projection ring buffers) |
| useCountyStudyHub.test.ts | +3 (presence/projection receive handlers) |
| CountyStudyPage.test.tsx | +3 (tablist a11y) |

## What's explicitly still open

These were noted as future work during the chunk execution — none block the
current shippable slice, but they belong in the next session's queue:

1. **Atlas map data feed.** `AtlasLivePage` still passes `outlines={null}` and
   `parcels={null}` to `GeoForgeV2Map`. The hub bridge is complete; the map
   surface needs canonical GIS data wired into it. Small follow-up.

2. **Flat-dollar scenario preview needs per-parcel kernel recomputation.**
   Current flat-dollar branch uses a bounded approximation. The Rust cost +
   valuation kernels are integrated via `IKernelValuationService` — wiring
   them into `PreviewScenarioImpactAsync` for per-parcel adjustment is the
   natural next step and will make flat-dollar projections as accurate as
   percent projections.

3. **Playwright E2E screenshot capture.** Requires a running backend + frontend
   stack; deferred to avoid the infra risk in this session. The ingredients
   are in place — Atlas hub is bidirectional, CountyStudy data flows end-to-end
   from canonical tables — so a happy-path Playwright script is straightforward
   when the stack is up.

4. **LeftRail + BottomDeck loading skeletons.** Only `SegmentTable` got the
   skeleton treatment in Chunk 6. Same pattern extends trivially to the other
   two panels using the same `loadStatus.cohorts` / `loadStatus.scenarios`
   fields already on the store.

## Merge-up path

When `chunk-1-integration` is ready to land on trunk, it fast-forwards
`chore/terra-levy-parity-sync` cleanly — no conflicts, strict superset. When
`main` is ready to release, the same fast-forward applies one level higher.

## Why this structure

The branch intentionally did not touch `main` directly. Solo-dev discipline:
`main` is a release channel, not a working trunk. `chore/terra-levy-parity-sync`
is the real trunk, sitting 460+ commits ahead of main. Chunk 1.4/1.5 merged
into `chunk-1-integration` branched off the real trunk (not main), and the
main-repo's WIP on `chore/terra-levy-parity-sync` was preserved untouched.

Canonical tables are the only runtime source of truth. `Pacs*` tables are
reference-only from seed — no runtime code path reads them. The boundary
repair mandate (CP-3b) is upheld across every new service added here.
