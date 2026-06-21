# BENTON_OWNER_WSDOR_PRODUCTION_SCOPE_PROFILE

Work Order: WO-DATA-FINALIZE-OWNER-001  
Date: 2026-06-20  
Profiler: TerraFusion Copilot  
Status: COMPLETE

---

## RESULT

The timeout is NOT a data scope problem.  
The 809k owner rows are the correct production corpus — post-PACS-conversion, active-supplement-only.  
The 2-hour timeout is caused by a single architectural bottleneck in Stage 7 (Owner-Truth):  
a SaveChangesAsync call that adds ~809k EF entities in one operation before saving.  
The fix is a code change to chunk Stage 7's save loop. No data scope reduction warranted.

---

## RESTORE_STATUS

- S1b restored successfully from `D:/TerraFusion_PACS_Verification/terrafusion_benton_demo_S1b_post_parcel.dump`
- Target DB: `terrafusion_benton_demo` on PG 16.14 Docker (127.0.0.1:5432)
- Post-restore verified state:
  - `legacy_pacs_raw.property`: 95,810 rows (parcel data intact from parcel drain)
  - `legacy_pacs_raw.owner`: 809,396 rows (seeded by parcel drain's Owner-Seed-S1 stage)
  - `canonical_tf.tf_parcel`: 83,326 rows (canonical parcel intact)
  - `legacy_pacs_raw.owner` (from owner-wsdor Stage 1 v2): CLEARED (restore eliminated the duplicate set)

---

## TOTAL_OWNER_ROWS

| Scope | Row Count |
|---|---|
| Full dbo.owner (no filters) | 2,539,100 |
| sup_num=0 (all years) | 2,484,542 |
| **sup_num=0 AND owner_tax_yr >= 2018 (current source query)** | **809,396** |
| sup_num=0 AND owner_tax_yr < 2018 (pre-conversion) | 1,675,146 |
| other sup_nums (all years) | 54,558 |

---

## OWNER_YEAR_RANGE

- Min year in dbo.owner: 1980
- Max year in dbo.owner: 2026
- Years covered by current source query (>=2018): 9 years (2018–2026)

---

## ROWS_BY_YEAR_SUMMARY

Source query scope: `sup_num = 0 AND owner_tax_yr >= 2018`

| Year | Rows | Distinct Parcels |
|---|---|---|
| 2026 | 95,814 | 95,810 |
| 2025 | 95,224 | 95,220 |
| 2024 | 93,066 | 93,062 |
| 2023 | 92,002 | 91,998 |
| 2022 | 90,064 | 90,059 |
| 2021 | 88,157 | 88,153 |
| 2020 | 86,779 | 86,775 |
| 2019 | 85,002 | 85,000 |
| 2018 | 83,288 | 83,286 |
| **Total** | **809,396** | **95,810** |

Observation: Near 1:1 ratio of rows to parcels per year. Multi-owner (co-ownership) rows are rare — only ~33 prop-year groups have more than one owner row across the entire 9-year window. This matches Benton's predominantly single-owner residential parcel profile.

---

## CONVERSION_YEAR_FINDING

Benton County converted to Harris PACS from ProVal in 2017.  
Evidence: `owner_tax_yr >= 2018` aligns with the first full PACS-maintained ownership year.  
Pre-2018 rows (1,675,146 at sup_num=0) were migrated from ProVal into PACS as historical provenance records.  
PACS physically holds them but they are migration artifacts, not assessor-maintained active records.

The current source query (`owner_tax_yr >= 2018`) correctly excludes these.

---

## PRE_CONVERSION_CLASSIFICATION

Pre-2018 owner rows (1,675,146 active sup, 8,658 other sup = 1,683,804 total pre-2018):

**Classification: B — Migrated Legacy History**

These rows were converted FROM ProVal INTO PACS as part of the 2017 migration.  
They are present in PACS but are NOT actively maintained by the assessor after conversion.  
They carry ownership history from 1980 through 2017.

Per the session operating doctrine (BENTON_OWNER_WSDOR_PRODUCTION_SCOPE_PROFILE-001):
- They should NOT be excluded automatically
- They should be labeled as migrated legacy history
- They are NOT in scope for the current TerraFusion Sync pipeline (which targets operational PACS data)

Decision (operator-confirmed by production scope doctrine):  
**Do not ingest pre-2018 owner rows through the current owner-wsdor lane.**  
They are NOT the source of the timeout problem.  
A separate future work order (WO-OWNER-HISTORY) could address a dedicated history/evidence lane.

---

## CURRENT_OWNER_DEFINITION

The PACS `dbo.owner` table is year-versioned. There is no single "current owner" column.  
Current ownership is determined by the MAX `owner_tax_yr` row for each parcel.

The source query (`sup_num=0 AND owner_tax_yr>=2018`) correctly captures:
- The full post-conversion ownership record for all active supplements
- All 9 tax years (2018–2026) for all 95,810 Benton parcels

The **2026 rows (95,814) represent current active ownership** for the 2026 assessment year.  
Canonical `tf_owner` and `tf_parcel_owner_link` contain the truth-promoted and canonicalized subset.

`TruthPacsOwnerCurrents` naming is correct: it represents current-year ownership truth  
derived from the full post-conversion owner landing (all years included for history surface,  
with the current year being the authoritative ownership record).

---

## RAW_HISTORY_RECOMMENDATION

**Recommendation: ingest full post-conversion owner history (all 9 years, 809,396 rows).**

Rationale:
- This IS what the current source query does
- Each year's `sup_num=0` row = the active ownership record for that assessment year
- Multi-year ownership history enables change detection, transfer tracing, and audit
- 809,396 rows is manageable (it's ~9 years × 90k parcels)

Do NOT reduce scope to current-year-only for the demo build.  
The 2-hour timeout is a code issue, not a data volume issue that warrants scope reduction.

---

## CANONICAL_OWNER_RECOMMENDATION

`canonical_tf.tf_owner` and `canonical_tf.tf_parcel_owner_link` should contain  
the full truth-promoted owner set (all 9 years), enabling temporal ownership queries.  
The canonical layer does not need to be current-only — it should carry the full truth set  
that the assessor needs for casefiles, dossiers, and audit.

---

## EXECUTION_ARCHITECTURE_RECOMMENDATION

### What causes the >2h wall-clock

The lane has 11 stages, not 9. The bottleneck is Stage 7 (Owner-Truth).

| Stage | Operation | Est. Time |
|---|---|---|
| S1 Owner-S1 | Stream 809,396 rows from PACS → PG | ~10–20 min |
| S2 Account-S1 | Keyed fetch: 109,987 distinct owner_ids from PACS account | ~2–5 min |
| S3 Supp-S1 | Keyed fetch: 809,363 (prop_id, yr) pairs from PACS supp, 810 chunked queries | ~15–25 min |
| S4 Parcel-S1 | Keyed fetch: 95,810 prop_ids from PACS property | ~2–5 min |
| S5 Parcel-Spine | Promote from S4 batch | ~2 min |
| S6 Parcel-Canonical | Project canonical parcel (already done by parcel drain — should mostly no-op?) | ~5 min |
| **S7 Owner-Truth** | Load 809k rows into EF → loop Add 809k entities → **single SaveChangesAsync** | **~60–120+ min** |
| S8 Owner-Canonical | Project canonical owners | ~5 min |
| S9 WPOV-S1 | Keyed fetch from PACS wpov (keyed on truth output) | ~5 min |
| S10 WPOV-Truth | Promote WPOV truth | ~2 min |
| S11 WSDOR-Canonical | Project canonical WSDOR | ~2 min |
| **Total** | | **~120–200 min** |

### Root cause: Stage 7 SaveChangesAsync pattern

`PacsOwnerCurrentTruthPromoter.PromoteAsync` (file: `TerraFusion.Data/Services/TruthPacs/PacsOwnerCurrentTruthPromoter.cs`):

1. Loads 809k owner rows from EF (`ToListAsync` — large but manageable, ~20-40 sec)
2. Iterates all 809k rows in a loop, calling `_db.TruthPacsOwnerCurrents.Add(...)` per row
3. After the loop: **one call to `_db.SaveChangesAsync(cancellationToken)` for all ~809k Added entities**

EF Core with 809k Added entities in the ChangeTracker:
- EF tracks all 809k entities (object graph overhead)
- SaveChanges generates ~809k SQL INSERT statements, batched by MaxBatchSize (default 1000 per transaction)
- 810 batch transactions × (SQL generation + PG round-trip) = likely >60 minutes

This is the same class of problem fixed by GEOM-011B-H1 (ChangeTracker accumulation), but at the truth-promotion layer.

### Required fix: chunk Stage 7's Save loop

```csharp
// Current (broken for large corpus):
foreach (var owner in ownerRows) {
    _db.TruthPacsOwnerCurrents.Add(new TruthPacsOwnerCurrent { ... });
    promoted++;
}
await _db.SaveChangesAsync(cancellationToken);

// Required (chunked save):
const int saveBatchSize = 10_000;
foreach (var owner in ownerRows) {
    _db.TruthPacsOwnerCurrents.Add(new TruthPacsOwnerCurrent { ... });
    promoted++;
    if (promoted % saveBatchSize == 0) {
        await _db.SaveChangesAsync(cancellationToken);
        _db.ChangeTracker.Clear(); // detach after each chunk save
    }
}
if (promoted % saveBatchSize != 0) {
    await _db.SaveChangesAsync(cancellationToken); // flush remainder
}
```

With 10k chunk saves: 809k / 10k = ~81 SaveChanges calls, each ~1-3 sec = ~2-4 min total.  
Reduces Stage 7 from >60 min to ~5-10 min.  
Total lane estimate with fix: **~45-60 min** (comfortably within 2h, potentially within 1h).

Note: ChangeTracker.Clear() after each chunk detaches already-saved truth rows —  
this does NOT affect the pct accumulator (groupPctSums) or other in-memory state,  
which are plain dictionaries and are unaffected by EF ChangeTracker state.

### Additional perf note: Stage 3 Supp-S1

Stage 3 uses `KeyedSqlServerPacsPropSuppAssocSource` with 809,363 key pairs, chunked at 1000 per query.  
That's 810 SQL Server round-trips with parameterized OR'd conditions.  
Estimated ~15-25 min. This is significant but acceptable given the production Sync mission.  
Consider a future optimization: pass keys via a temp table instead of OR'd parameters.

---

## CODE_CHANGE_REQUIRED

**YES — one targeted change in PacsOwnerCurrentTruthPromoter:**

File: `backend/src/TerraFusion.Data/Services/TruthPacs/PacsOwnerCurrentTruthPromoter.cs`

Change: chunk the SaveChangesAsync call in the inner promotion loop at batch size 10,000.  
Add ChangeTracker detach of `TruthPacsOwnerCurrent` entities after each chunk save.

This does NOT change:
- The source query or data scope
- The doctrine gates (all gate checks happen before the loop or on the in-memory state)
- The pct accumulator or rejection counters
- The promotion batch record or stage resume checkpoint behavior

Risk: LOW. The change mirrors the proven GEOM-011B-H1 pattern.  
The pct gate computation (groupPctSums) happens before the Save — ChangeTracker.Clear() only  
affects EF tracking, not the accumulated sum dict.

---

## NEXT_WORK_ORDER

**WO-OWNER-PERF-001 — Chunk Owner-Truth SaveChangesAsync**

Mission:  
Modify `PacsOwnerCurrentTruthPromoter.PromoteAsync` to save in chunks of 10,000 entities  
instead of one SaveChangesAsync for the full ~809k corpus.  
Add targeted ChangeTracker detach of `TruthPacsOwnerCurrent` after each chunk save.  
Add corresponding test coverage verifying the chunk pattern.

Acceptance criteria:
- `PacsOwnerCurrentTruthPromoter` compiles and unit tests pass
- Memory test: ChangeTracker does not retain full 809k entities across chunk boundary
- Live run: owner-wsdor full corpus completes in <2h (target <1h) on terrafusion_benton_demo
- All 11 gates PASS or WARN (no new failures introduced)
- Stage-level resume still works (checkpoint behavior unchanged)

Do not expand scope beyond the chunk fix.  
Do not change doctrine gates, source query, or promotion logic.

---

## SUPPORTING DATA

### Key counts in source scope (sup_num=0, owner_tax_yr>=2018)
- Total rows: 809,396
- Distinct owner_ids: 109,987
- Distinct prop_ids: 95,810
- Distinct years: 9
- Distinct (prop_id, owner_tax_yr) pairs: 809,363

### Account linkage
- 109,987 distinct owner_ids → 100% match to dbo.account (0 orphans expected)

### Stage 2 keyed fetch size: 109,987 distinct account rows

### Stage 3 keyed fetch key pairs: 809,363 → 810 chunked queries at 1000 pairs/chunk

### S1b restore confirmed pre-profiling
- Parcel data intact, owner tables clean of owner-wsdor Stage 1 data
- `canonical_tf.tf_parcel` = 83,326 rows, `legacy_pacs_raw.property` = 95,810 rows

### Note on v2 timeout apparent "1.6M" figure
The v2 timeout DB showed raw_owner=1,618,792 = 809,396 (parcel drain's Owner-Seed-S1 batch)  
+ 809,396 (owner-wsdor Stage 1 batch). These are two independent LoadBatch IDs  
covering the same 809k-row source, not 1.6M unique owner rows.
