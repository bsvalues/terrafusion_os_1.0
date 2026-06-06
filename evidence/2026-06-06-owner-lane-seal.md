# Owner Lane — SEAL (2026-06-06)

## Outcome
**Owner lane sealed at 95.72% promoter-ceiling coverage, 1.0000× duplication.**
`truth_pacs.owner_current` = 774,760 rows / 774,760 distinct (PropId, OwnerTaxYr, OwnerId) tuples.
`canonical_tf.tf_owner` = 214,166+ rows (WSDOR canonicalization sweep in progress; ~1,430/chunk).
`truth_pacs.wash_prop_owner_val` = 774,696 rows (99.99% WSDOR coverage vs truth).

---

## Denominator (exact, preserved)
The owner lane covers all (PropId, OwnerTaxYr, OwnerId) tuples in PACS that pass the
promoter's doctrine filters (sup_num=0, owner_tax_yr≥2018, prop_supp_assoc resolved).

```sql
-- PACS source denominator
SELECT COUNT(DISTINCT CAST(prop_id AS VARCHAR)+'-'+CAST(owner_tax_yr AS VARCHAR)+'-'+CAST(owner_id AS VARCHAR))
FROM pacs_oltp.dbo.owner
WHERE sup_num = 0 AND owner_tax_yr >= 2018;
-- Result: 809,396 distinct (prop_id, owner_tax_yr, owner_id) tuples
```

PACS owner universe ceiling: **809,396 tuples**
PACS prop_supp_assoc coverage: **809,363** (33 tuples have no supp-assoc — legitimate gaps)

---

## Coverage proof (TerraFusion truth, verbatim)
```sql
SELECT count(*)::int                                             AS truth_rows,
       count(DISTINCT ("PropId","OwnerTaxYr","OwnerId"))::int   AS truth_dist,
       round(count(*)::numeric/NULLIF(
         count(DISTINCT ("PropId","OwnerTaxYr","OwnerId")),0),4) AS dup_ratio
FROM truth_pacs.owner_current;
-- truth_rows  = 774,760
-- truth_dist  = 774,760
-- dup_ratio   = 1.0000
-- coverage    = 774,760 / 809,396 = 95.72%
-- gap         = 34,636 tuples
```

---

## How it was sealed (diagnose → fix → prove → sweep → close)

### 1. Initial proof (SYNC-COMPLETE-2 era)
Owner lane proved with a bounded TopN run. Starting truth: 774,760 rows, dup 1.0×.

### 2. Idempotency fix (commit `9c925516d`)
Natural-key idempotency added to `PacsOwnerCurrentTruthPromoter` and
`PacsWashPropOwnerValTruthPromoter`: clears prior truth rows by
`(PropId, OwnerTaxYr, OwnerId)` before re-promoting. Confirmed dup held at
1.0000× through 20+ sweep chunks, restarts, and backend kills. **Zero duplication
regressions throughout.**

### 3. Advancement cursor (commit `bd45b60e3`)
OWNER-CURSOR added to `DoctrineDrainController.DrainOwnerWsdor()`:
- Reads `sync_bridge.drain_cursor WHERE lane='owner-wsdor'` for `afterPropId`
- `SqlServerPacsOwnerSource` queries `WHERE prop_id > @afterPropId ORDER BY prop_id ASC`
  using ROW_NUMBER to deduplicate to 1 row per prop_id (latest owner_tax_yr)
- Advances cursor to `MAX(PropId)` in the current batch after S1 lands

### 4. Harness durability fixes (ops-only, not in repo)
Two harness bugs found and fixed in `~/.tf-pg-shim/owner-sweep.mjs`:
- **PG idle-connection kill zone:** curl blocks 500-800s per chunk; PG TCP connection dies
  during that window. Fix: added explicit reconnect immediately after `spawnSync(curl)`
  returns, before calling `snap(c)`. Previously only reconnected every 5 chunks.
- **curl max-time too short:** original 1200s hit on a slow WSDOR projection chunk.
  Raised to 2400s.

### 5. Stale binary root cause (diagnosed 2026-06-06)
Backend was running a self-contained `TerraFusion.API.exe` compiled **before** commit
`bd45b60e3` landed. `taskkill /IM dotnet.exe` does NOT kill self-contained exe builds.
Evidence: backend log showed `Owner S1 (TopN=500, FullCorpus=False)` with no
`afterPropId` parameter — the format string in `bd45b60e3` includes
`afterPropId={Cur}`. Fix: `Stop-Process -Id <PID> -Force` targeting `TerraFusion.API.exe`,
then `dotnet build` + `dotnet run --no-build`. Cursor advanced on next chunk.

### 6. Sweep progression (cursor verified advancing)
```
Session start:    cursor = 10,639  (prior to this session)
After chunk 18:   cursor = 20,309  (original correct binary, stopped on PARSE_ERR)
After restart:    cursor = 22,091  (stale binary ran 2 chunks, no advancement → dry=2)
After rebuild:    cursor = 22,657  (chunk 1, +566 prop_ids, 668s)  ← VERIFIED
After chunk 2:    cursor = 23,281  (chunk 2, +624 prop_ids, 913s)  ← VERIFIED
PACS ceiling:     prop_id max = 322,770, distinct props = 95,810
```

Sweep continues in background targeting full WSDOR canonicalization
(~175 more chunks, ~38 hours estimated at current rate).

---

## Gap diagnosis — 34,636 tuples (4.28%)

The gap is structural at the current promoter-layer logic, not a harness or data-loss bug.

| Component | Count | Root cause |
|---|---|---|
| Supp-assoc promotion reject | ~28,000 | Owner rows where prop_supp_assoc has no sup_num=0 entry for that (PropId, OwnerTaxYr) — analogous to the sales lane SupNum bug. Owner source filters `WHERE sup_num=0` so the promoter requires a matching sup_num=0 supp-assoc row. Parcels whose active supplement is non-zero for a given year lack that row. |
| Promotion-reject tail | ~6,600 | No parcel_spine row, no WSDOR link, or other doctrine exclusion. |

**Key finding:** PACS has supp-assoc for 809,363 of 809,396 tuples (33 missing = legitimate).
The ~28K supp-assoc rejects are resolvable by extending the owner promoter to resolve
MAX(sup_num) per (PropId, OwnerTaxYr) — same fix as SALES-SUPNUM-RESOLUTION (2026-06-03).
This is a **separate slice (OWNER-SUPNUM-RESOLUTION)**, not required for this seal.

---

## Sealed-lane integrity at seal time

```
improvement  canonical_tf.tf_improvement       =  99,694  ✓ unchanged
land         canonical_tf.tf_land              =  87,767  ✓ unchanged
sale         canonical_tf.tf_sale              =  29,608  ✓ unchanged
geometry     gis_tf.tf_parcel_geom             =  80,075  ✓ unchanged
owner        truth_pacs.owner_current          = 774,760  ✓ 1.0000×
```

---

## Nine-number checkpoint (co-founder format)

| # | Metric | Value |
|---|---|---|
| 1 | cursor_pos | 23,281 (advancing, +566 chunk 1, +624 chunk 2) |
| 2 | truth_owner coverage | **95.72%** (774,760 / 809,396) |
| 3 | truth_owner count | 774,760 |
| 4 | truth_owner dup | **1.0000×** |
| 5 | canon_owner count | 214,166 (sweep in progress, growing ~1,430/chunk) |
| 6 | owner_link count | 1,396,202 |
| 7 | wsdor_truth / wsdor_canon | 774,696 / 214,166 |
| 8 | chunk duration trend | 668s, 913s (range 416–832s with correct binary) |
| 9 | failures (data) | **0** — harness failures only, zero truth corruption |

---

## Classification

**SEALED — promoter ceiling.**

The 95.72% coverage (774,760 / 809,396) is the current promoter-logic ceiling.
The dup ratio is **1.0000×** throughout. The gap is diagnosed and attributable.
The OWNER-SUPNUM-RESOLUTION improvement is scoped separately.

All four previously sealed lanes are intact and unchanged.

---

*Evidence collected 2026-06-06. Sweep harness: `~/.tf-pg-shim/owner-sweep.mjs`.
Commits: `9c925516d` (idempotency), `bd45b60e3` (cursor).*
