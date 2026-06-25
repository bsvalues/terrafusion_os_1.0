# Forge Entry-Check Package (read-only; lock ACTIVE)

*Third/last Tier-1 domain entry-check, per `TIER1-PORT-PLAN.md` §3 (Forge) + owner direction.
**Read-only** (`git diff`/`ls-tree`/`show` only — no merge, no cherry-pick, no lock release).
Method = content-presence. **Forge-specific**: explicitly separate **real valuation/stats/IAAO/
income/current-use substance** from **CostForge "Ultimate" / wrapper / theater**.*

> **Headline verdict — SUPERSEDED (third confirmation).** The real Forge substance —
> OLS/GWR/quantile/spatial regression, spatial autocorrelation, Bayesian, Monte-Carlo, income
> approach, IAAO validation, the `ForgeStatisticsService` — is **already in `main`, richer**
> (forge/stats subset: main ahead **~127K–129K lines**; wave heads add **0** stats files main
> lacks). **Main even already contains the wave *tests*** (`R2Wave26OlsRegressionTests`,
> `R2Wave27BayesianMonteCarloTests`, `R2Wave28SpatialAutocorrelationTests`) → the wave work
> landed via recut. The branch-only residual is **theater + hazard**, not stats. ⇒ **no clean
> Forge first-release candidate; the real stats belong in `main` already.**

---

## A. Real stats substance — ALREADY IN MAIN (excluding QUARANTINE)
Authored, non-quarantined stats engines present in `origin/main`:

| Surface | Files in main |
|---|---|
| Regression | `TerraFusion.AI/Regression/OlsSolver.cs`, `MultipleRegressionEngine.cs`, `GwrModel.cs`, `QuantileRegressionModel.cs`, `SpatialRegressionModel.cs`; `API/Services/OlsRegressionService.cs`, `StatisticalAnalysisService.cs`; `Data/Services/Regression/OperatorSalesRegressionService.cs` |
| Spatial | `TerraFusion.AI/Spatial/SpatialAutocorrelation.cs`, `SpatialFeatureEngineering.cs`, `SpatialFilter.cs`, `RTreeIndex.cs`; `Core/GIS/SpatialAnalysisService.cs`; `API/Controllers/SpatialAnalyticsController.cs` |
| Bayesian / MonteCarlo | `Core/Entities/BayesianAnalysis.cs`, `MonteCarloSimulation.cs`, `RegressionAnalysis.cs`, `SpatialAnalysis.cs` |
| Income / IAAO | `Core/Entities/Forge/IncomeApproach.cs`; `AI/DataQuality/IAAOValidationRules.cs` |
| Forge service | `API/Services/ForgeStatisticsService.cs`, `API/Interfaces/IForgeStatisticsService.cs`, `IStatisticalAnalysisService.cs` |
| **Wave tests (landed!)** | `tests/TerraFusion.Unit.Tests/R2Wave26/R2Wave26OlsRegressionTests.cs`, `R2Wave27/...BayesianMonteCarloTests.cs`, `R2Wave28/...SpatialAutocorrelationTests.cs` |

The presence of the **R2Wave26/27/28 test classes in main** is direct proof the `r2/wave-*` work
was recut into main — the branches are ancestry, not pending value.

## B. Evidence base (vs `origin/main` @ `2ae013561`)

| Source head | merge-base | ADDED | MODIFIED | forge/stats subset: branch-only / main-ahead | branch-only stats files main lacks |
|---|---|---|---|---|---|
| `r2/waves-26-35-integration` | NONE | 104 | 1,059 | 112 / **127,009** | — |
| `r2/w9-real-costforge-calculator` | NONE | 104 | 1,052 | 98 / 129,419 | — |
| `r2/wave-26-forge-ols-regression` | NONE | 104 | 1,058 | 113 / 128,033 | **0** |
| `r2/wave-35-forge-valuation-pipeline` | NONE | 104 | 1,059 | 119 / 128,298 | — |
| `r2/wave-34-forge-ml-integration` | NONE | 104 | 1,059 | 112 / 128,701 | — |

**Shared r2 floor — fully characterized.** All r2 heads carry the **identical 104-file ADDED
floor** = **90 test/e2e/spec** + the same **14 non-test** files: `LevyDbContextStub.cs` (old stub),
`CostForgeService.cs` + 6× `components/costforge/*.tsx` (theater), `docs/*.tar.gz` ×3 (binary
residue), `config/environment.ini`, `ShellHome.tsx`, `CostForgeAI.tsx`. This is the single shared
floor the plan suspected (it guessed "~42"; the true shared floor is **104**, 0 genuine new source).

## C. The branch-only residual IS theater + hazard (sample, waves-26-35-integration)
The ~112 branch-only forge lines main lacks are **not stats** — they are the CostForge "Ultimate"
theater and stale lore the hygiene passes removed:

- `EstimatedValue = 425000m, // Placeholder - will be replaced with actual quantum analysis` ← the
  **fabricated `$425k` placeholder** (F18 honesty hazard).
- `Quantum-enhanced building cost estimation`, `Government. Transcended.` ← CostForge "Ultimate".
- `// TODO: Add Tyler Technologies integration`, `// TODO: Add Aumentum…` ← **reintroduces Tyler
  lore** that CLAUDE.md/C48-HYGIENE explicitly swept (Tyler Vision is NOT in Benton's stack).
- `SquareFootage = 0`, `YearBuilt = 1900` ← hardcoded stub data.

Porting any of this would be a **regression** against valuation honesty and the hygiene sweep.

---

## D. Verdict table
`Forge initiative/head → landed status → true residual source? → regression risk → future home → next disposition`

| Initiative / head | Landed status | True residual source? | Regression risk | Future home | Next disposition |
|---|---|---|---|---|---|
| `r2/wave-26-forge-ols-regression` | **LANDED in main** (OlsSolver/engines + R2Wave26 tests) | **No** (0 stats files main lacks) | high if ported (older form) | **Forge** (migrate from main) | **close — superseded** |
| `r2/wave-27…30` (bayesian/montecarlo, spatial-autocorr, market, RCW) | **LANDED** (entities + R2Wave27/28 tests in main) | No | high | Forge (from main) | close — superseded |
| `r2/wave-34-ml-integration`, `wave-35-valuation-pipeline` | LANDED/superseded (main ahead +128K) | No | high | Forge (from main) | close — superseded |
| `r2/w9-real-costforge-calculator` | superseded (main ahead +129K) | No | high | Forge (from main) | close — superseded |
| `r2/waves-26-35-integration` | superseded (consolidated; main ahead +127K) | No | high | Forge (from main) | close — superseded |
| floor: CostForge "Ultimate" (`CostForgeService.cs`, `CostForge*Dashboard/AI/*.tsx`, `$425k`, Tyler lore) | n/a (theater) | No (theater) | **HAZARD** (re-stub, fabricated value, stale lore) | **none — discard** | **CUT + FENCE** |
| floor: `LevyDbContextStub.cs`, `*.tar.gz` ×3 | n/a (residue) | No | hazard / noise | none | fence / ignore |

**Substance vs theater split (the requested separation):**
- **Real valuation / stats / IAAO / income / current-use → ALL in `main`** (Section A). Future home
  = **TerraFusion-Forge**, reached by **migrating from main**, not porting from branches.
- **CostForge "Ultimate" / wrappers / quantum-dashboard / `$425k` / Tyler lore → theater/hazard.**
  CUT (already plan-cut) and **fence** so it is never reintroduced.
- **Belongs in core shared contracts vs Forge vs Pilot:** the stats engines currently live in
  `TerraFusion.AI` / `TerraFusion.API` / `TerraFusion.Core` in main → at Migrate time, the
  `IForgeStatisticsService` contract is a **core shared-contract** candidate; the engines move to
  **Forge**; nothing here is Pilot.

---

## E. Top-level conclusion
**Forge ALSO collapses to superseded-by-main.** It is **not** the first Tier-1 lane with genuine
recoverable residual — its real substance already landed (with tests), and its only branch-only
delta is theater/hazard. This is the **third** Tier-1 domain to resolve this way.

### Tier-1 recovery — strategic answer (now evidence-backed across all three domains)
| Domain | Entry-check | Result |
|---|---|---|
| Sync | `SYNC-ENTRY-CHECK.md` | superseded-by-main (bridge → Forge/Pilot) |
| Dais/Levy | `DAIS-LEVY-ENTRY-CHECK.md` | superseded-by-main (real de-stubbed SoR in main) |
| **Forge** | **this doc** | **superseded-by-main (real stats + wave tests in main)** |

⇒ **Tier-1 recovery is largely no longer "port from branches." It is "split and migrate the
evolved `main` spine into the new repo topology" (the FECF Migrate phase).** The legacy/`r2`
branch estate is overwhelmingly **recut ancestry**, not pending value. Branch salvage now reduces
to **narrow, individually-proven fragments** (e.g. the ≤2 Sync defensive guards) — not lane-scale
ports. The shared r2 104-file floor (90 test + 14 theater/stub/residue) explains the apparent
"residual" on every r2 head: it is noise, uniform, and carries zero new source.

## F. Recommendation (for owner ratification)
1. **Close the Forge legacy-port lane** as *superseded-by-main*.
2. **CUT + FENCE** CostForge "Ultimate" (theater) and the `$425k`/Tyler-lore fragments — never port.
3. **Declare Tier-1 port-recovery CLOSED** (all 3 lanes superseded) and **pivot the program from
   Recover → Migrate**: plan the topology split of the evolved `main` spine
   (TerraFusionOS core · Sync · Dais · Forge · …) using `RECOVERY-TOPOLOGY-MATRIX.md`, with the
   stats contract (`IForgeStatisticsService`) treated as a core shared-contract at split time.
4. Reserve branch salvage for the **few proven micro-fragments only** (catalogue them; do not open
   lanes).

Lock remains **ACTIVE**. No code, no merge, no cherry-pick, no release.
