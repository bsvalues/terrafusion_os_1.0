# Land Lane — SEAL (2026-06-03)

## Outcome
**Land lane sealed at 100.00% coverage, 1.0000× duplication.**
`truth_pacs.land_current` = 82,012 distinct parcels / 87,767 rows = 87,767 distinct keys.
`canonical_tf.tf_land` = 87,767 rows (truth − canonical = 0, fully projected).

## Denominator (exact, preserved)
The land lane covers parcels that have a 2026 land segment in PACS.
```sql
-- PACS source ceiling
SELECT COUNT(DISTINCT prop_id) FROM pacs_oltp.dbo.land_detail WHERE prop_val_yr=2026;
-- split by property type
SELECT p.prop_type_cd, COUNT(DISTINCT l.prop_id)
FROM pacs_oltp.dbo.land_detail l JOIN pacs_oltp.dbo.property p ON p.prop_id=l.prop_id
WHERE l.prop_val_yr=2026 GROUP BY p.prop_type_cd;
```
Result (verbatim):
```
land_total = 82012
ltype_R    = 82012   <- ALL real property
```
**Why the denominator is 82,012 and all type R:** land segments belong to real-property
parcels. Mobile homes (MH) sit on land owned by others and have NO land segment of their
own — so unlike the improvement lane (which had 4,176 MH), the land universe has ZERO MH and
no doctrine exclusion. Ceiling = 82,012, cleaner than improvement.

## Coverage proof (TerraFusion truth, verbatim)
```sql
SELECT count(DISTINCT "PropId")                                  AS truth_parcels,   -- 82012
       count(*)                                                  AS truth_rows,      -- 87767
       count(DISTINCT ("PropId","PropValYr","SupNum","LandSegId")) AS truth_distinct -- 87767
FROM truth_pacs.land_current;
-- coverage = 82012 / 82012 = 100.00%   dup = 87767/87767 = 1.0000x
```

## How it was sealed (diagnose → fix → prove → sweep → close)
1. **Starting state:** landing complete (437,935 rows / 82,012 parcels) but truth only
   test-drained (2,000 parcels) AND **2.6962× duplicated** (5,805 rows / 2,153 distinct).
2. **Root cause = batch-scoped idempotency bug** in PacsLandCurrentTruthPromoter (cleared
   priors by LandLoadBatchId, never removing rows from earlier batches). Same class + fix as
   improvement (76027e412). Fixed to clear by natural key (PropId, PropValYr). Committed
   `bfe989350`.
3. **Added land advancement cursor** (sync_bridge.drain_cursor lane='land') to DrainLand,
   mirror of improvement. Committed `bfe989350`.
4. **Deduped** existing 5,805 → 2,153 rows (1.0×) before sweep.
5. **Autonomous sweep** (~/.tf-pg-shim/land-sweep.mjs): 163 cursor-mode TopN=500 chunks,
   2,000 → 81,512 parcels (99.39%), dup held 1.0000× throughout, 0 failures. Self-stopped on
   2 consecutive no-growth chunks at cursor 322,770 (= PACS land max prop_id). Loop ended
   cleanly (DONE: corpus exhausted).

## Residual gap diagnosis (the 500 at 99.39%) — mechanical, now closed
- Gap = 500 parcels, ALL `landed_not_promoted` (in landing land_detail, not in truth).
- ALL 500 were **in parcel_spine, had prop_supp_assoc landing, and supp SupNum matched land
  SupNum 500/500 (0 mismatch)** — i.e. fully promotable, NOT a doctrine/source gap.
- **Tightly clustered in prop_id 27,536–28,116** — a single ~580-wide band exactly at the
  cursor position (27,535) where an early 4-loop race was consolidated by killing the racing
  loops mid-chunk. The cursor advanced past the band without their truth-promote completing.
- **Fix:** rewound land cursor to 27,535, fired 2 bounded chunks (507 + 553 promoted, 0
  quarantine). Closed the band. Coverage 81,512 → **82,012 (100.00%)**, remaining_gap = 0.
- (Operational note: this confirms the loop-race was harmless to data — the natural-key fix
  meant the only consequence was a skipped band, trivially re-drained; no duplication ever.)

## Seal checklist
| Question | Status | Evidence |
|---|---|---|
| Coverage complete? | YES — 82,012/82,012 = 100.00% | coverage query |
| Duplication controlled? | YES — 1.0000× (87,767 rows = distinct) | coverage query |
| Canonical projected? | YES — tf_land 87,767 = truth (delta 0) | alignment check |
| Residual gap explained? | YES — 500 = mechanical race-skip band, re-drained to 0 | gap diagnosis |
| Idempotency proven? | YES — re-drain of covered parcels held 1.0× | sweep + gap-fill |
| Stable? | YES — backend healthy, sweep self-stopped cleanly | DONE log |

**SEAL STATEMENT:** Every real-property (prop_type_cd='R') land-bearing parcel in Benton
PACS for working year 2026 — all 82,012 — is present in TerraFusion truth_pacs.land_current
and projected to canonical_tf.tf_land, with zero duplication. No MH parcels exist in the land
universe (no doctrine exclusion). Land lane: SEALED.

## Commits
- `bfe989350` — land natural-key idempotency + advancement cursor (landed earlier this session).
- This artifact + land-sweep.mjs single-instance lock — committed with this seal.

## Lane sequence
improvement SEALED → **land SEALED** → next: sales → geometry → owner cleanup.
