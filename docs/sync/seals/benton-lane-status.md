# Benton Lane Seal Registry

Single source of truth for TerraFusion Sync lane seals against Benton County PACS.
A lane is **SEALED** when: coverage = its correct denominator, duplication = 1.0000× at
truth (rows = distinct natural keys), canonical projected, residual gap diagnosed by
class/reason (not assumed), and the pipeline is idempotent/re-runnable. Evidence artifact
required before SEALED.

_Last updated: 2026-06-07._

| Lane | Status | Coverage | Denominator | Dup | Evidence |
|------|--------|----------|-------------|-----|----------|
| Improvement | ✅ SEALED | 71,736 / 71,736 (100%) | Real-property (type R) improvement-bearing parcels; 4,176 MH excluded by spine doctrine | 1.0000× | `evidence/2026-05-30-improvement-residual-gap-diagnosis.md` + `evidence/2026-05-30-improvement-targeted-backfill.md` |
| Land | ✅ SEALED | 82,012 / 82,012 (100%) | All type-R land-bearing parcels (no MH land segments; no doctrine exclusion) | 1.0000× | `evidence/2026-06-03-land-lane-seal.md` |
| Sales | ✅ SEALED | 29,914 qualified | QUALIFIED sales (DOR-or-county per tf_doctrine_ratio_policy); 45,764 landed-but-unqualified correctly excluded | 1.0000× | `evidence/2026-06-03-sales-lane-seal.md` |
| Geometry | ✅ SEALED | 80,075 geom (1.0×); 79,105/80,075 = 98.8% crosswalked to tf_parcel (970 residual: 301 null-APN + 669 no-tf_parcel-match, both legitimate) | ArcGIS Parcels service = 80,076 features | 1.0000× | `evidence/2026-06-04-geometry-lane-diagnosis.md` |
| Owner | ✅ SEALED (100%) | 816,849 / 816,849 (100%); class-2 active-supplement gap (was 34,636 stalesup) CLOSED via owner active-supplement resolution; stalesup 0, nosupp 0 | (PropId, OwnerTaxYr, OwnerId) at the ACTIVE supplement (MAX sup_num per parcel-year), not sup_num=0 | 1.0000× | `evidence/2026-06-07-owner-supnum-resolution.md` (+ prior `evidence/2026-06-06-owner-lane-seal.md`) |

## Denominator notes (why coverage numbers differ per lane)
- **Improvement / Land** are parcel-keyed against the current working year (2026); their active
  supplement is sup_num=0. Mobile homes have no land segment (land=0 MH) and are excluded from the
  real-property spine (improvement=4,176 MH excluded by doctrine, not missed).
- **Sales** are sale-event-keyed (chg_of_owner_id) and qualification-gated: only sales that qualify
  under the ratio study (DOR-or-county) promote to truth. The denominator is *qualified* sales, NOT
  all landed. Sales reference HISTORICAL years (PropValYr = YEAR(sl_dt)), so their active supplement
  is frequently non-zero (MAX(sup_num) per (prop_id, owner_tax_yr)) — the SupNum-resolution fix.

## Key commits (per lane)
- **Improvement:** `fc5af4af4` (SeedPropIds targeted backfill) + truth/projector idempotency + cursor.
- **Land:** `bfe989350` (natural-key idempotency + advancement cursor), seal `007862a43`.
- **Sales:** `7f635489f` (truth idem) · `9d893f667` (cursor) · `83664a4a7` (landing idem) ·
  `769bf800c` (SupNum-resolution) · seal `8c62d8304`.
- **Owner:** `9c925516d` (natural-key idempotency truth+WSDOR) · `bd45b60e3` (advancement cursor) · seal `1e49f13cb` (95.72% ceiling) · `f1a733c76` (supp activeSupp) · `d90b2b200` (**owner active-supplement resolution + COPY landing → 100%**).

## Recurring pattern (apply to every remaining lane)
1. **Idempotency bug class:** truth promoters cleared priors by LoadBatchId (batch-scoped) → re-drains
   duplicated. Fix = clear by NATURAL KEY of the batch's rows. Hit in improvement, land, AND sales.
2. **Advancement:** bounded drains need a keyset cursor (sync_bridge.drain_cursor) or they re-pull the
   same TopN. FullCorpus over all-history times out one HTTP request.
3. **Landing idempotency:** cursor re-runs re-land duplicates unless the landing layer also collapses
   by natural key (set-based window-delete, NOT IN×IN cross-product — that grinds PG).
4. **Denominator first:** never assume "all landed" is the ceiling. Find the doctrine/type/qualification
   filter that defines the real promotable universe; diagnose every residual by class/reason before sealing.
5. **No false seals:** if the closeout exposes an anomaly (e.g. sales 766), trace to root cause and fix
   — do not declare coverage that isn't real.

## Operational
- Live-lineage source tree: `C:/Users/bsval/terrafusion_os_1.0` (main repo), branch
  `fix/projector-delete-insert-atomicity`. Deployed binary: `.tf-old-backend-a844ffe15/.tmp/api-old-publish`.
- Backend launch requires `TF_DEV_PACS_PASSWORD`. Docker post-resume wedge recovery:
  `scripts/admin/recover-docker-run-sockets.ps1 -Launch`.
- Sweep loops live in `~/.tf-pg-shim/` (outside repo), single-instance locked, stop-guarded.
