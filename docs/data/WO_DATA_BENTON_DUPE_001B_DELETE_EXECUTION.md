# WO-DATA-BENTON-DUPE-001B — Delete Execution: 30 Anomalous Parcel Rows

**Date:** 2026-07-02
**Authorization:** SW-02 (data mutation) granted by operator — "delete the 30 duplicate parcel rows".
**Risk executed:** SW-02 — a bounded, quantified DELETE of 30 rows from `canonical_tf.tf_parcel`, executed inside a
self-verifying transaction. Credential retrieved **in-memory** from app setting `ConnectionStrings__DefaultConnection`;
never printed, logged, persisted, or committed.
**Precedent:** Executes Option C of the read-only investigation `WO_DATA_BENTON_DUPE_001_FINDINGS.md` (2026-06-30).

## Delete set (30 rows) — re-verified against the CURRENT DB before touching it
The 2026-06-30 investigation predates the 003C redeploy, so all facts were re-confirmed live:

| Metric | Value |
|--------|-------|
| Total rows (before) | 84,418 |
| Distinct `ParcelNumber` | 84,388 |
| NULL `ParcelNumber` rows (Group A) | 16 |
| Parcel numbers appearing twice (Group B) | 14 groups → 14 extra rows |
| **Delete set** | **16 + 14 = 30** |

- **Group A — 16 rows, `ParcelNumber IS NULL`:** incomplete/placeholder PACS load records, not genuine parcels.
- **Group B — 14 duplicate pairs:** byte-for-byte identical except the `TfParcelId` UUID PK; keep one per pair.

## Safety checks performed before the DELETE (the new work this WO added)
The prior investigation never checked referential safety. This WO did:

1. **No declared FKs** reference `canonical_tf.tf_parcel` (information_schema constraint scan → 0).
2. **No logical child references to the delete-set** — checked the three parcel-linked child tables by `TfParcelId`:
   `canonical_tf.tf_parcel_owner_link` = **0**, `gis_tf.tf_parcel_geom` = **0**, `canonical_tf.tf_sale` = **0**.
   Deletion orphans nothing.
3. **Keep-rule validated as the safe one.** The delete rule removes the **MAX** `TfParcelId` per duplicate group; the
   **kept (MIN)** rows carry the only child data present — 4 `tf_parcel_geom` rows. Deleting MAX therefore preserves
   the geometry-bearing parcels. (Had the rule deleted MIN, it would have orphaned 4 geometries — it does not.)

## Reversibility
Before deleting, all 30 doomed rows (full `SELECT *`) were exported to a local recovery CSV
(`scratchpad/dupe001b_deleted_rows_backup.csv`, 30 rows + header) — not committed. The rows are identical
duplicates / null-PN placeholders, so restoration is a straightforward re-insert if ever needed.

## The write (SW-02) — self-verifying transaction
```sql
BEGIN;
DELETE FROM canonical_tf.tf_parcel WHERE "ParcelNumber" IS NULL;                       -- Group A (16)
DELETE FROM canonical_tf.tf_parcel
 WHERE "TfParcelId" IN (
   SELECT MAX("TfParcelId"::text)::uuid FROM canonical_tf.tf_parcel
   WHERE "ParcelNumber" IS NOT NULL GROUP BY "ParcelNumber" HAVING count(*) > 1);      -- Group B (14)
-- guard: roll back unless the result is exactly canonical
DO $$ DECLARE t int; d int; BEGIN
  SELECT count(*), count(DISTINCT "ParcelNumber") INTO t, d FROM canonical_tf.tf_parcel;
  IF t <> 84388 OR d <> 84388 THEN RAISE EXCEPTION 'ABORT rollback: total=% distinct=%', t, d; END IF;
END $$;
COMMIT;
```
Result: guard raised **`VERIFY OK: total=84388 distinct=84388`**, transaction **committed**.

## Post-state verification
- **DB:** `SELECT count(*), count(DISTINCT "ParcelNumber")` → **84,388 / 84,388** (raw == distinct, delta 0).
- **Live anonymous `/api/sync/doctrine/state`:** `canonical.tf_parcel = 84388`, `operational: true`.
- **No collateral:** `tf_sale` = 90,386, `tf_parcel_owner_link` = 686,851, `tf_parcel_geom` = 79,199 — all unchanged.

## Outcome
- `db-identity` runtime-truth gate (raw `CountAsync()` vs `RuntimeTruth:ExpectedBentonParcelCount` = 84,388) now
  **passes** — raw count equals the configured canonical count. `db-content` (DISTINCT) remains green.
- The ETL-artifact rows (single June-27 bulk-insert fan-out + 16 null-PN placeholders) are removed; the canonical
  parcel universe is exactly 84,388 with no duplicate/placeholder rows.

## Sovereignty / discipline notes
- Only `canonical_tf.tf_parcel` was mutated; PACS source not accessed; no INSERT/UPDATE/schema change.
- Credential used in-memory only. Backup captured before mutation. Transaction self-guarded against a wrong result.
