# WO-DATA-BENTON-DUPE-001 — Findings: Benton Demo DB Duplicate Parcel Row Investigation

**Date:** 2026-06-30  
**Investigator:** Claude (read-only SQL, no mutation)  
**Target:** `canonical_tf.tf_parcel` on `pg-terrafusion-benton-demo.postgres.database.azure.com`  
**Status:** INVESTIGATION COMPLETE — Operator decision required

---

## Summary

`canonical_tf.tf_parcel` contains 84,418 raw rows but only 84,388 distinct non-NULL `ParcelNumber` values. The delta of 30 rows breaks into two groups: 16 rows with NULL `ParcelNumber` and 14 parcel numbers each inserted exactly twice. All 30 anomalous rows originate from the June 27 bulk-insert batch.

---

## Count Breakdown (confirmed)

| Metric | Value | Source |
|--------|-------|--------|
| Total rows | 84,418 | `COUNT(*)` |
| Non-NULL ParcelNumber rows | 84,402 | `COUNT("ParcelNumber")` |
| NULL ParcelNumber rows | 16 | delta |
| Distinct non-NULL ParcelNumber | 84,388 | `COUNT(DISTINCT "ParcelNumber")` |
| Named parcel numbers with 2 rows | 14 | group-by query |
| Total anomalous rows (delta) | 30 | 16 NULL + 14 extra named |

**Why `db-content` passes but `db-identity` fails:**
- `db-content` counts `COUNT(DISTINCT "ParcelNumber")` → 84,388 = configured expected → **passes**
- `db-identity` counts raw `CountAsync()` → 84,418 ≠ 84,388 → **fails**

---

## Group A: 16 NULL ParcelNumber Rows

**Profile:**
- `ParcelNumber`: NULL (confirmed — not empty string)
- `PropertyType`: R (Residential)
- `ParcelStatus`: ACTIVE
- `CreatedAt`: `2026-06-27 07:40:16.15536+00` (first load batch)

**Interpretation:** These are PACS source records where `prop_id` was NULL during the initial load on June 27. They represent incomplete PACS records (possibly test/placeholder rows in the PACS database) that passed through the ETL without a parcel number. They are not genuine assessment parcels.

---

## Group B: 14 Named Parcel Numbers with 2 Rows Each

**Full list (28 total rows):**

| ParcelNumber | Prefix | Rows |
|---|---|---|
| 124954013839001 | 12 | 2 |
| 124954013839002 | 12 | 2 |
| 124954013839003 | 12 | 2 |
| 124954013839004 | 12 | 2 |
| 135983060000003 | 13 | 2 |
| 135983060000004 | 13 | 2 |
| 135983060000005 | 13 | 2 |
| 135983060000006 | 13 | 2 |
| 804973000001000 | 80 | 2 |
| 81497000000000B | 81 | 2 |
| 816550000000000 | 81 | 2 |
| 834083000001048 | 83 | 2 |
| 836071000001001 | 83 | 2 |
| 836740000000000 | 83 | 2 |

**Characteristics:**
- All duplicate pairs are **identical in every column** except `TfParcelId` (UUID PK — auto-generated on insert)
- Both rows in each pair share the exact same `CreatedAt` microsecond: `2026-06-27 07:40:16.15536+00`
- Prefixes span 5 distinct numeric ranges (12, 13, 80, 81, 83) — not contiguous
- **Zero cross-batch overlap**: confirmed by INTERSECT query — these parcel numbers do not appear in the June 28 batch

---

## Batch Timeline

| Batch | CreatedAt | Row Count | Contains Anomalies |
|-------|-----------|-----------|-------------------|
| Batch 1 | `2026-06-27 07:40:16.15536+00` | 34,631 | YES — all 30 anomalous rows |
| Batch 2 | `2026-06-28 05:22:09.665883+00` | 49,787 | NO |

Only 2 distinct `CreatedAt` timestamps exist in the entire table. The two batches are completely disjoint.

---

## Root Cause Analysis

**Confirmed:**
- All anomalous rows originated in a single bulk-insert operation at `2026-06-27 07:40:16`
- The 28 duplicate rows (14 pairs) are byte-for-byte identical except for UUIDs — they were inserted by the EF BulkInsert in a single call
- The non-contiguous prefix pattern rules out a full-batch retry (which would have duplicated all 34,631 rows)
- The single-microsecond timestamp rules out a sub-batch boundary overlap (separate sub-batches would differ by milliseconds)

**Most likely cause:** The PACS source query that fed the June 27 ETL returned these 14 parcel records twice each. This can happen when PACS stores a parcel in multiple tables that are joined during extraction, and the join produces fan-out for certain records. Without PACS source access this cannot be confirmed, but it is the most consistent explanation with a single-microsecond bulk insert timestamp.

**Alternative (lower probability):** The ETL was run with a de-duplication bug where the input list for these specific 14 parcels was doubled before insertion.

**Ruled out:**
- Full batch retry (only 28 of 34,631 batch-1 rows are duplicated)
- Sub-batch boundary overlap (microsecond timestamp is identical)
- PACS data corruption (the duplicate rows are identical — not conflicting data)
- Cross-batch contamination (Batch 2 has 0 overlap with Batch 1 parcel numbers)

---

## Impact on db-identity

`db-identity` checks raw `CountAsync()` vs `RuntimeTruth:ExpectedBentonParcelCount`.

- Current configured expected: **84,388**
- Current raw count: **84,418**
- Delta: **30**
- Result: `db-identity.passed = False` (expected under current data state)

This is a **data quality issue, not a config error**. The config is correct (84,388 = canonical distinct parcel count). The raw count will remain elevated until the 30 anomalous rows are cleaned.

---

## Operator Decision Options

### Option A — Accept current state (no mutation)

**Action:** No change. Accept `db-identity.passed = False` as a known, documented gap.  
**Config change needed:** None. Keep `ExpectedBentonParcelCount: 84388`.  
**Rationale:** `db-content.passed = True` is the meaningful gate (it counts distinct parcels). `db-identity` is a secondary check. Accepting the delta is acceptable for the demo deployment if the operator is aware.  
**Risk:** `db-identity` remains a red gate visible in the runtime truth endpoint.

### Option B — Update config to match raw count (suppress the failure)

**Action:** Set `ExpectedBentonParcelCount: 84418` in `appsettings.Development.json` and `appsettings.BentonCounty.json`.  
**Config change needed:** Change 84388 → 84418 in both config files.  
**Rationale:** Makes `db-identity` pass without touching data. Quick suppression.  
**Risk:** Misleading — the configured count would reflect ETL artifact rows, not canonical parcels. `db-content` would then fail (it uses DISTINCT = 84,388). Not recommended.

### Option C — Delete the 30 anomalous rows (data mutation, requires separate WO authorization)

**Action:** DELETE 16 NULL-ParcelNumber rows + DELETE 1 row from each of the 14 duplicate pairs (28 rows → delete 14).  
**Required:** Operator authorization via a new WO (`WO-DATA-BENTON-DUPE-001B`). This is a data mutation against the Azure demo DB — not authorized under the current read-only investigation WO.  
**Outcome after delete:** Raw count = 84,388 = DISTINCT count = configured expected → `db-identity.passed = True` and `db-content.passed = True`.  
**Risk:** Mutation is irreversible without a backup. The June 28 batch is clean so re-running ETL for those 30 rows is not straightforward.

**DELETE SQL (do not execute without WO-DATA-BENTON-DUPE-001B authorization):**

```sql
-- Delete 16 NULL-ParcelNumber rows
DELETE FROM canonical_tf.tf_parcel
WHERE "ParcelNumber" IS NULL;

-- Delete 1 row from each of the 14 duplicate pairs (keep lower UUID alphabetically)
DELETE FROM canonical_tf.tf_parcel
WHERE "TfParcelId" IN (
    SELECT MAX("TfParcelId"::text)::uuid
    FROM canonical_tf.tf_parcel
    WHERE "ParcelNumber" IS NOT NULL
    GROUP BY "ParcelNumber"
    HAVING COUNT(*) > 1
);
```

### Option D — Fix db-identity controller to use DISTINCT count (code change, requires separate WO)

**Action:** Change `RuntimeTruthController`'s `db-identity` check from `.CountAsync()` to `CountAsync()` on DISTINCT `ParcelNumber`.  
**Rationale:** Both `db-content` and `db-identity` would then use the same counting method; the configured value (84,388) is already correct.  
**Risk:** Low — but it requires identifying and modifying the controller, committing code, and merging a PR.

---

## Recommendation

**Recommended: Option A (accept) in the short term + Option C (delete) after operator authorization.**

For the demo deployment (003B onward), accept `db-identity.passed = False` as a known documented gap — this investigation doc is the proof artifact. `db-content.passed = True` is the meaningful correctness gate for the Benton parcel universe.

Schedule Option C (`WO-DATA-BENTON-DUPE-001B`) as a P2 cleanup WO after 003B completes. The 30 rows are harmless for demo purposes (they don't affect parcel search, sales data, or GIS), but cleaning them makes the runtime truth gate clean before any county handoff.

---

## Sovereignty Constraints

This investigation was **read-only only**. No mutations were made to the Azure demo DB during this WO.

- PACS source: **not accessed** (no PACS connection made)
- `canonical_tf.tf_parcel`: **read-only SELECT queries only**
- No UPDATE, DELETE, INSERT executed

---

## Evidence Queries (executed, read-only)

All queries executed against `terrafusion_benton_demo` via psql from local dev environment.

1. Total row count + NULL breakdown → confirmed 84,418 / 84,402 / 16
2. DISTINCT parcel count + delta calculation → confirmed 84,388 / 30
3. Duplicate group enumeration (HAVING COUNT > 1) → 15 groups (14 named + 1 NULL group)
4. NULL vs empty-string classification → confirmed all 16 are NULL (not `''`)
5. Empty-PN row profile → `PropertyType=R`, `ACTIVE`, `2026-06-27` timestamp
6. Batch timestamp distribution → exactly 2 CreatedAt values: 34,631 + 49,787
7. Cross-batch INTERSECT check → 0 cross-batch duplicates confirmed
8. Full 14 named duplicate list with prefix breakdown
