# CostForge Benton Method v2 — Phase A Handoff

**Date:** 2026-04-16
**Branch:** `feat/native-app-integrations`
**Orchestrator:** TerraFusion Elite Government OS Engineering Agent Cloud Coach
**Status:** Phase A complete. Phase B (T1/T2/T3/T4/T5/T6 + final QA) ready for next session.

---

## What Phase A Delivered

### Commits (in order)
1. `8887c4eb4` — Marshall & Swift purged from entire active codebase (11 files)
2. `226534100` — Master spec: 7-track canonical-only design
3. `86dd9bcb9` — Master plan: 43 tasks across 7 tracks with exact code/commands
4. `c5ecb010b` — `CamaCharacteristic.City` + `PropertyUseStratum` fields added
5. `aa56a1fbd` — EF config + 4 stratum query indexes
6. `47375788d` — Migration `20260416191219_AddCityAndStratumToCama` applied to Postgres
7. `15bc17626` — `PacsCanonicalizer` implementation
8. `05069ad62` — `CanonicalAdminController` + dedup fix + Benton data populated

### Key artifacts
- **Spec:** `docs/superpowers/specs/2026-04-16-costforge-benton-method-v2-design.md`
- **Plan:** `docs/superpowers/plans/2026-04-16-costforge-benton-method-v2-plan.md` (43 tasks)

---

## Data State (Benton 2026, post-Track 0)

| Metric | Value |
|---|---|
| Total `CamaCharacteristics` | 75,907 |
| Rows with `City` populated | 75,907 (100%) |
| Rows with `PropertyUseStratum` populated | 75,907 (100%) |
| Migration `20260416191219_AddCityAndStratumToCama` | Applied to Postgres |
| EF indexes on `(CountyId, TaxYear, X)` | Hood, City, Stratum, Vintage |

### City distribution
| City | Count | % |
|---|---:|---:|
| Kennewick | 33,846 | 44.6% |
| Richland | 22,696 | 29.9% |
| West Richland | 6,611 | 8.7% |
| Prosser | 5,464 | 7.2% |
| Benton City | 4,522 | 6.0% |
| Unincorporated | 2,768 | 3.6% |

*(Pasco is in Franklin County, correctly absent.)*

### PropertyUseStratum distribution
| Stratum | Label | Count | % |
|---|---|---:|---:|
| R | Residential SFR | 60,620 | 79.9% |
| M | Manufactured | 6,821 | 9.0% |
| C | Commercial/Industrial/Special | 5,134 | 6.8% |
| X | Exempt | 3,332 | 4.4% |

---

## Architecture Decisions Locked

1. **Canonical-only boundary.** CostForge v2 reads from `CamaCharacteristics`, `CamaImprovementDetails`, `ComparableSales`, `CostMatrices`, `PropertyAssessments`, `Properties` — never from `Pacs*` staging or legacy PACS MSSQL.
2. **`PacsCanonicalizer` is the sole bridge.** Staging → canonical. Nothing else writes to the canonical `City`/`PropertyUseStratum` fields.
3. **3-layer sale qualification (T1):** `QualificationDecision` ?? `QualificationRecommendation` ?? `SaleQualification`. Centralize in `SaleRatioQueryBuilder`.
4. **Ratio studies use `AdjustedSalePrice`**, not `SalePrice`. Excludes: `IncludeNoCalc`, `SuppressOnRatioRptCd='T'`, `LandOnlySale`, `OutlierExclusions`.
5. **Backend computes; frontend displays.** No client-side IAAO or Benton-method math.
6. **Benton Compliant = IAAO compliant AND** `max |decileMedian - overallMedian| ≤ 0.10`.

---

## Environment Quirks (discovered during Phase A)

- **Dev defaults to SQLite.** `backend/src/TerraFusion.API/appsettings.Development.json` has `"DefaultConnection": "Data Source=terrafusion-dev.db"`. Postgres has the real data.
- **Override with env var:** `ConnectionStrings__DefaultConnection=Host=localhost;Port=5432;Database=terrafusion;Username=postgres;Password=devpassword123` (already shown to work for API routing logic).
- **DevPropertySeeder conflict:** Fresh API startup against the populated Postgres crashes on a unique-key violation (`FK_Counties_FipsCode`). Either disable the seeder in Program.cs or run canonicalization via direct SQL (`docker exec -i terrafusion-postgres-dev psql ... < sql-file`).
- **Multiple DbContexts:** migrations need `--context TerraFusionDbContext`.
- **Port holds:** kill all `dotnet` processes before rebuild (`powershell.exe Get-Process dotnet | Stop-Process -Force`).

---

## Remaining Work (Phase B — next session)

### Wave 1 (parallel, T0 dependency satisfied)
- **T1 — EquityMetricService** (Tasks 7–14 in plan). Backend foundation. Blocks T2/T3/T5.
- **T4 — Data Quality Engine** (Tasks 26–29). 8 real checks + IQR outlier flagging.
- **T6 — Secondary Feature %-of-BIV** (Tasks 35–40). `CostMatrix.SecondaryFeaturePctOfBiv` + seeder + RCN calc wiring.

### Wave 2 (after T1 ships)
- **T2 — Stratum Rollups** (Tasks 15–19). City/type/vintage/grade via `RollupService`.
- **T3 — Benton Custom Metrics** (Tasks 20–25). Decile/stratified-COD/condition-bias/segment-drift/grade-drift + `BentonDiagnosticsPanel`.

### Wave 3 (after T1 + T2)
- **T5 — Calibration v2** (Tasks 30–34). Effective-age derivation, segment-specific mass-adjust, full-metric preview, `CalibrationFinding` audit trail.

### Final gates (Tasks 41–43)
- Cross-track numerical consistency (neighborhood-matrix == equity-metrics for same hood)
- Full 8-tab screenshot suite against live Benton
- TypeScript 0 errors, 0 raw fetch, 0 `Pacs*` queries in CostForge v2 code

---

## How to pick up in next session

1. `cd /c/Users/bsval/terrafusion_os_1.0`
2. `git status` — should be clean on `feat/native-app-integrations`
3. Start with Task 7 of the plan (`docs/superpowers/plans/2026-04-16-costforge-benton-method-v2-plan.md`)
4. Use subagent-driven-development: dispatch one subagent per task, spec review → code review → merge
5. Waves 1 tracks (T1, T4, T6) can run in parallel worktrees once set up
6. Controller merge order for Wave 1+: T1, T4, T6 (serialize edits on `CostForgeController.cs`)

---

## Sanity verification queries for next session

```bash
# Verify canonical foundation is still intact
docker exec terrafusion-postgres-dev psql -U postgres -d terrafusion -c "
SELECT COUNT(*) total, COUNT(\"City\") with_city, COUNT(\"PropertyUseStratum\") with_stratum
FROM \"CamaCharacteristics\"
WHERE \"CountyId\"='19190019-1919-1919-1919-191919191919' AND \"TaxYear\"=2026;"
# Expected: 75907 | 75907 | 75907

# Verify the four stratum indexes exist
docker exec terrafusion-postgres-dev psql -U postgres -d terrafusion -c "
SELECT indexname FROM pg_indexes
WHERE tablename = 'CamaCharacteristics'
  AND indexname LIKE 'IX_CamaChar_%';"
# Expected: Hood, City, Stratum, Vintage

# Verify Benton countyId (used in plan's smoke tests)
export BENTON_ID=19190019-1919-1919-1919-191919191919
```

---

**Phase A: ✅ complete. Foundation ready. T1/T4/T6 unblocked.**
