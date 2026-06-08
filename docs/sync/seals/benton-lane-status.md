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
| Assessment value | ✅ SEALED (current-year) | truth 95,455 / 95,455 (100% of 2025 active-supplement universe); canonical 83,326 (spine-resolved; 12,129 outside the real-property spine); 1,041 non-zero active supplement preserved; assessed_val 100% populated | (PropId, AssessmentYear) at ACTIVE supplement (MAX sup_num); year=2025 current operational | 1.0000× (truth + canonical) | `evidence/2026-06-07-assessment-value-lane-seal.md` |
| Exemption fact | ✅ SEALED (current-year) | truth 6,487 / 6,487 (2025 active-supplement); canonical 5,643 (spine-resolved; 844 outside real-property spine); dict_exemption_type populated (6 types, 0 unbacked); 126 non-zero active supplement preserved; exemption_pct 4,268 | (PropId, OwnerId, exmpt_tax_yr, exmpt_type_cd) at ACTIVE supplement; year=2025 | 1.0000× (truth + canonical) | `evidence/2026-06-07-exemption-fact-lane-seal.md` |
| Jurisdiction (tax area/district) | ✅ SEALED (current-year) | landed 95,455 (2025 active-supp, 1,041 nonzero); tf_parcel_tax_area 83,326 (spine-resolved; 12,129 outside spine); tf_tax_area dict 109; tf_tax_district dict 37; tf_tax_area_district 487 TCA→district pairs; parcel→district chain proven; levy/fund excluded (Revenue boundary) | parcel→TCA at ACTIVE supplement (MAX sup_num); TCA→district from tax_area_fund_assoc (district id only); year=2025 | 1.0000× (parcel assignment) | `evidence/2026-06-07-jurisdiction-spine-seal.md` |
| Revenue — levy tax bill (Stage 1) | ✅ SEALED (current-year, read-only) | landed 1,104,507 (2025 active L bills); tf_tax_bill_line 990,665 (parcel-resolved; 113,842 outside real-property spine); 79,767 distinct parcels; tf_levy_rate 49; tf_tax_bill_current 79,767 rollup (SUM BillCount = 990,665); district-backed 100% (0 NULL); rate-backed 100% (0 NULL); due/paid/balance line↔rollup exact; fund/distribution/delinquency/payment-txn excluded (boundary held) | `bill ⋈ levy_bill` where year=2025, is_active=1, bill_type='L' (1:1 levy_bill); PACS-recorded amounts verbatim, balance = due − paid | 1.0000× (line + rollup) | `evidence/2026-06-07-revenue-spine-stage1-seal.md` |
| Revenue — special-assessment bill (Stage 2B) | ✅ SEALED (current-year, read-only) | landed 313,139 (2025 active A bills); tf_assessment_bill_line 313,139 (parcel-resolved; **0 unresolved — 100% on real-property spine**); 79,078 distinct parcels; tf_assessment_agency 29 (9 billing); tf_assessment_bill_current 79,078 rollup (SUM BillCount = 313,139); agency-backed 100% (0 NULL); due 8,841,075.97 / paid 429.35 / balance 8,840,646.62 line↔rollup exact; due reconciles to Stage-2A agency profile; no district/levy/rate/fund/taxable cols (boundary held) | `bill ⋈ assessment_bill` where year=2025, is_active=1, bill_type='A' (1:1 assessment_bill); agency-backed (special_assessment_agency), rate-free; PACS amounts verbatim, balance = due − paid | 1.0000× (line + rollup) | `evidence/2026-06-07-revenue-spine-stage2b-assessment-bill-seal.md` |

## Spine boundary
- **Valuation Spine** (sealed): parcel · owner · land · improvement · sales · geometry · assessment value · exemption.
- **Jurisdiction Spine** (sealed): parcel → tax area → tax district.
- **Revenue Spine — Stage 1** (sealed, current-year read-only): district → levy rate → current-year active **levy** tax bill (due / paid / balance, PACS verbatim).
- **Revenue Spine — Stage 2B** (sealed, current-year read-only): special-assessment agency → current-year active **'A' assessment** bill (due / paid / balance, PACS verbatim, agency-backed, rate-free).
- **Revenue Spine — Stage 3A/3B** (payment doctrine discovered + attested, no model built): `bill.amount_paid` ≡ `SUM(coll_transaction.base_amount_pd)` proven **penny-exact corpus-wide** ($32,941.46 over 1,417,646 active 2025 bills); bill-grain **net paid / balance** is therefore already carried by the sealed bill models. Cash ledger (receipt/tender/void history) NOT built.
- **Revenue Spine — later stages** (deferred, separate mission): receipt/tender/void ledger · penalty-interest paid breakdown · fund / distribution / delinquency · prior-year history.

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
- **Revenue (Stage 1):** levy tax bill explanation seal — `tf_levy_rate` / `tf_tax_bill_line` / `tf_tax_bill_current`; PACS-verbatim amounts; seal evidence `evidence/2026-06-07-revenue-spine-stage1-seal.md`.
- **Revenue (Stage 2B):** special-assessment bill seal — `tf_assessment_agency` / `tf_assessment_bill_line` / `tf_assessment_bill_current`; agency-backed, rate-free, PACS-verbatim; seal evidence `evidence/2026-06-07-revenue-spine-stage2b-assessment-bill-seal.md`.

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
