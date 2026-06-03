# Improvement Lane — Targeted Backfill (2026-05-30)

## Implementation
- **Source tree (live-lineage):** `C:/Users/bsval/terrafusion_os_1.0`, branch
  `fix/projector-delete-insert-atomicity`, HEAD `63f35abd9`. (NOT
  `.tf-old-backend-a844ffe15`, whose source is stale May-15 / missing the cursor +
  improvement-only + suppress-audit fixes the live binary runs. Provenance proven:
  main-repo controller mtime 2026-05-28 12:56 → binary built 13:01; all 6 session
  fix commits in history.)
- **Change:** added optional `IReadOnlyList<int>? SeedPropIds` to `DoctrineDrainRequest`.
  In `DrainImprovement`, when non-empty: skip Owner-Seed-S1 + cursor read/advance, use the
  list verbatim as `seedPropIds`. Unchanged downstream keyed chain
  (parcel-S1 → property_val → spine → imprv → truth → canonical). Cursor mode untouched.
- **Build:** `dotnet build -c Release` → **0 errors, 0 warnings**. Published to deploy dir
  (backup of prior binary at `api-old-publish.bak-20260530`, old DLL sha
  `6DA4385231...`). New DLL contains `SeedPropIds`. Backend restarted manually with
  TF_DEV_PACS_PASSWORD; healthy in 33s; PACS dict 193 codes (auth OK).

## Sample test 1 — cohort A (never-landed), 5 prop_ids [81216,81217,81219,81220,81221]
Drain `Succeeded`, but `rowsLanded=0 rowsPromotedToTruth=0`. Batch trace:
- Parcel-S1 (property): ext=5 prom=5 ✓ (property rows landed)
- **truth-pacs-parcel-promoter: ext=5 prom=0** ← spine rejected all 5
- all downstream stages ext=0 (keyed off empty spine)

**Root cause (PROVEN, not a bug):** all 5 are `prop_type_cd = MH` (mobile home). The spine
promoter (`PacsParcelSpineTruthPromoter`, line 137) promotes ONLY `prop_type_cd = 'R'`
(real property) by doctrine; P/MH/A/MN remain in legacy_pacs_raw for audit and never reach
truth. The backfill ran the full chain correctly; the doctrine filter correctly excluded MH.

### DENOMINATOR CORRECTION (third refinement — now exact)
PACS 2026 improvement universe = 75,912, splits cleanly by prop_type_cd:
- **R (real property) = 71,736** ← the true spine-eligible improvement ceiling
- **MH (mobile home) = 4,176** ← the entire "never-landed" cohort, doctrinally excluded

So real-property improvement coverage = **71,239 / 71,736 = 99.3%** before this slice.
The 4,176 MH parcels are NOT a gap to fill — they are out of scope by spine doctrine.
(If MH improvements are ever wanted, that's a separate doctrine decision, not a backfill.)

## Sample test 2 — cohort B (landed-not-promoted), 5 prop_ids [33575,33576,33577,33578,33579]
Before: spine=5 (already seeded), imprv_landing=8 rows, truth=0.
Drain `Succeeded`: `rowsLanded=60 rowsPromotedToTruth=8 rowsCanonicalized=60`, quarantine
delta 0, 36 gates PASS.
After (DB-verified):
- cohort-B truth rows 0 → **8** (5 parcels) ✓
- global truth rows 99,759 → **99,767** (+8 = exactly promoted) ✓
- global parcels 71,239 → **71,244** (+5 = exactly the sample) ✓
- **duplication 1.0000×** (rows = distinct) ✓ — no explosion
All stop conditions clear. `SeedPropIds` mechanism proven correct for the promotable cohort.

## Full cohort-B backfill — remaining 492 prop_ids
Drain `Succeeded` (528s): `rowsLanded=6590 rowsPromotedToTruth=624 rowsCanonicalized=6589`,
quarantine delta 0, gates 35 PASS / **1 FAIL**.

### The 1 gate FAIL — benign PACS-native anomaly (PROVEN, not backfill damage)
Gate `imprv-attr-key-uniqueness` (SOURCE_TO_RAW): "1 6-key tuples appeared more than once".
Confirmed this is PACS's OWN duplicate imprv_attr rows (e.g. PropId 33587 / ImprvDetId
514687 / IAttrValId 15 appears 3× in `legacy_pacs_raw.imprv_attr`) — the documented
PACS-native anomaly (see project_sync_doctrine_3_seal memory). The projector dedups by
(ImprvDetId, IAttrValId), so it does NOT propagate. Decisive safety checks:
- feature dup groups created during backfill (last 40min): **0**
- cohort-B truth dup tuples: **0**
- global truth duplication: **1.0000×** (rows = distinct)

## FINAL RESULT — gap closed
| metric | value |
|---|---|
| truth parcels | **71,736** |
| truth rows | 100,391 |
| duplication | **1.0000×** |
| real-property ceiling (PACS 2026 type R) | 71,736 |
| **real-property improvement coverage** | **100.00%** |
| cohort-B remaining unpromoted | **0** |
| MH parcels excluded by spine doctrine | 4,176 (out of scope, not a defect) |

Net of slice: truth 71,239 → **71,736 parcels** (+497), 99,759 → 100,391 rows (+632),
1.0000× held throughout. Every real-property improvement parcel in PACS 2026 is now in
TerraFusion truth + canonical.

## Status
- Backend: live binary rebuilt w/ SeedPropIds, healthy. Backup of prior binary retained.
- Real-property improvement lane = **100% covered, 1.0× clean**. This is the honest ceiling;
  the 4,176 MH parcels are a separate doctrine question, not an improvement-lane gap.
- Watchdog: was disabled for the controlled backfill. The forward sweep is now redundant
  (all R parcels covered) — re-enable only if desired for monitoring; it will fire zero-yield
  no-ops since the cursor is exhausted and all R parcels are promoted.

---

# IMPROVEMENT-LANE SEAL PROOF (2026-05-30)

## Exact proof queries (preserved so the 71,736 denominator is never a mystery)

### Denominator — PACS source (MSSQL `pacs_oltp`), reproduced 2026-05-30 post-MSSQL-restart
```sql
-- total 2026 improvement-bearing parcels
SELECT COUNT(DISTINCT prop_id) FROM pacs_oltp.dbo.imprv WHERE prop_val_yr=2026;
-- split by property type (the qualification axis the spine promoter uses)
SELECT p.prop_type_cd, COUNT(DISTINCT i.prop_id)
FROM pacs_oltp.dbo.imprv i
JOIN pacs_oltp.dbo.property p ON p.prop_id = i.prop_id
WHERE i.prop_val_yr = 2026
GROUP BY p.prop_type_cd
ORDER BY COUNT(DISTINCT i.prop_id) DESC;
```
Result (verbatim):
```
TOTAL_2026_imprv_parcels = 75912
type_R  = 71736   <- real property; spine-eligible; the TRUE ceiling
type_MH = 4176    <- mobile home; excluded by PacsParcelSpineTruthPromoter (line 137,
                     prop_type_cd == 'R' only). NOT a missed Benton parcel.
```
**Why the denominator is 71,736 and not 75,912:** the improvement lane flows through the
real-property parcel spine, whose doctrine (PacsParcelSpineTruthPromoter) promotes ONLY
`prop_type_cd = 'R'`. Mobile homes (MH) are a distinct property class kept in
`legacy_pacs_raw` for audit but never promoted to truth. Confirmed empirically: the 5-parcel
cohort-A sample [81216,81217,81219,81220,81221] all = MH; spine read 5 / promoted 0.

### Coverage — TerraFusion truth (PG `terrafusion`), reproduced 2026-05-30
```sql
SELECT
  count(DISTINCT "PropId")                                       AS truth_parcels,
  count(*)                                                       AS truth_rows,
  count(DISTINCT ("PropId","PropValYr","SupNum","ImprvId"))      AS truth_distinct
FROM truth_pacs.imprv_current;
```
Result (verbatim):
```
truth_parcels = 71736
truth_rows    = 100391
truth_distinct= 100391    -> duplication = 100391/100391 = 1.0000x
rp_coverage   = 71736 / 71736 = 100.00%
```

## Seal checklist
| Question | Status | Evidence |
|---|---|---|
| Coverage complete? | YES — 71,736/71,736 = 100.00% | coverage query above |
| Duplication controlled? | YES — 1.0000× (rows = distinct) | coverage query above |
| Watchdog required? | NO — forward sweep exhausted, all R promoted | cursor=322,770, 0 ahead |
| Residual gap explained? | YES — 4,176 = MH, doctrinally excluded | denominator query + spine line 137 |
| Targeted backfill completed? | YES — 497/497 cohort-B promoted | backfill counts + DB verify |
| Stable after completion? | YES — backend 200, PG 11h healthy, 1.0× holding | post-backfill checks |

## Operational state frozen at seal (2026-05-30)
- Backend: healthy (200), live binary with SeedPropIds.
- PostgreSQL `terrafusion-postgres-dev`: Up, healthy.
- MSSQL `tf-mssql`: restarted for proof capture (was exited post-backfill; not needed at rest).
- Watchdog TF-DrainWatchdog: intentionally DISABLED (sweep exhausted).
- Improvement lane: SEALED at 100.00% real-property coverage, 1.0000× duplication.

**SEAL STATEMENT:** Every real-property (prop_type_cd='R') improvement-bearing parcel in
Benton PACS for working year 2026 — all 71,736 of them — is present in TerraFusion
truth_pacs.imprv_current and projected to canonical_tf, with zero duplication. The 4,176
mobile-home parcels are excluded by parcel-spine doctrine, not missed. No further draining
required for the improvement lane.

---

# POST-RESTART SEAL VERIFICATION (2026-06-03)

The laptop was shut down (E: external drive left at home) and later resumed. On
return, full recovery was performed and the seal RE-VERIFIED end to end:
- E: drive remounted; `...\Docker\wsl\disk` junction → `E:\DockerData` resolved.
- Docker engine recovered from the recurring AF_UNIX `dockerInference` stale-socket
  wedge via the proven run-dir quarantine (now codified in
  scripts/admin/recover-docker-run-sockets.ps1).
- PostgreSQL completed WAL replay (slow fsync — data lives on external E:),
  reached consistent state, accepted connections.

Re-run of the coverage proof query (verbatim) AFTER recovery:
```
SEALED DATA: parcels=71,736  rp_cov=100.00%  dup=1.0000x  rows=100,391
```
**Zero data loss across the shutdown/resume cycle. The seal held.**

## Code committed (no longer at risk)
- `fc5af4af4` feat(sync): targeted SeedPropIds backfill path — DoctrineDrainController
  change + this artifact + diagnosis artifact + onlymode stability window.
  (Recovered from stash@{7}^3 after a concurrent agent's `git stash --include-untracked`
  swept the then-untracked evidence files; controller change was a tracked-file mod and
  survived in the working tree. Quality gate passed: dotnet format + lint-staged clean.)
- `5e12e4b6c` chore(ops): scripts/admin/recover-docker-run-sockets.ps1 — Docker
  post-resume recovery automation. Quality gate passed.

Improvement lane is now sealed in BOTH substance (100% coverage, 1.0× dup, verified
post-restart) AND history (committed). Restart tax removed.
