# TerraFusion 90-Day Execution Plan

**Date**: 2026-05-02
**Author**: TerraFusion Co-Founder Cadence
**Status**: Active. Supersedes the BENTON-SYNC family targets that pre-dated the PACS deep-dive.
**Anchor commit**: `f2508906e` on `main` (after PACS knowledge supplement merge).
**Confidence**: PACS expertise ~70%, Sync Bridge v1 control tower built and tested (5/5 unit), doctrine in place.

---

## 0. Why This Plan Exists

The BENTON-SYNC track (1..8) was qualifying sales on the wrong axis (`wac_cd` instead of
`sl_county_ratio_cd = '100'`), under a flawed identity model (flat property reads, no
`prop_supp_assoc` join), and seeded 128k rows where Benton has ~89k active parcels. The
work was good practice but not promotable as-is.

The PACS deep-dive corrected the model. The Sync Bridge v1 (9 tables, Phase 0
field_authority seed, doctrine of provenance + lineage_status + promotion gates) is now
built. The next 90 days are about turning that control tower into a working CAMA system
of record — one fully closed lane at a time.

This plan is the binding sequence. Slice cards reference back to it. Detours require
written justification.

---

## 1. Strategic Frame

TerraFusion is **not** "syncing PACS." TerraFusion is becoming **the new CAMA / county
property system of record**, with PACS treated as one source family among many in the
provenance doctrine. Identity is `tf_parcel_id`, lineage is `source_xref`, authority is
`field_authority`. Everything else is a consequence.

**The Five-Schema Architecture (binding):**

```
raw_pacs.*         — landing zone, exactly as it came off the source, with provenance
truth_pacs.*       — supp-aware joined view of raw_pacs (the "PACS truth")
canonical_tf.*     — TerraFusion's own identity, derived from truth_pacs via source_xref
product.*          — read-optimized projections for Forge, Dais, Atlas, dashboards
legacy_tf_unproven.* — anything in canonical_tf without a source_xref entry; quarantine
```

**Every row in `canonical_tf.*` MUST have a row in `sync_bridge.source_xref`. No
exceptions. Rows without lineage are quarantined.**

---

## 2. The Four Lanes (and ArcGIS)

| Lane         | Purpose                                                | Order | Why this position |
|--------------|--------------------------------------------------------|-------|-------------------|
| Sales        | Assessor ratio dashboards + Forge comp search          | 1     | High value × known shape |
| Owner        | WSDOR rolls + appeals defense                          | 2     | High stakes + PII; doctrine must be exercised first |
| Improvement  | Cost engine + Benton Method calibration                | 3     | Highest domain-expert leverage |
| Land         | Ag schedules + land schedules                          | 4     | Lookup-driven, lowest novelty |
| GIS overlay  | Parcel polygons via ArcGIS REST (read-only, cached)    | parallel | Greenfield; unblocks Atlas + proximity comps |

GIS rolls in **parallel** to the lanes because it's greenfield, doctrine-compatible from
day one (no PACS interaction), and unblocks downstream surfaces.

**ArcGIS decision is locked**: consume county ArcGIS REST feature services. No custom
shapefile parser. Cache nightly into `gis_tf.parcel_geom`. Crosswalk via `source_xref`.
Fallback to cached snapshot when county endpoint is down.

---

## 3. The Blocks

Each block is 2–3 calendar weeks for a solo dev. AI agents handle parallel reading and
schema classification; main thread runs slice cards in serial cadence.

### Block A — Sales Lane Closed (weeks 1–3)

**Goal**: 21,715 valid sales (the production count of `sl_county_ratio_cd = '100'`)
visible end-to-end through `raw_pacs → truth_pacs → canonical_tf → product`, behind an
authenticated read API, paginated, with operator SQL regression proof.

**Slices:**

- **S1 — `raw_pacs.sale` landing.** First real `load_batch` row. Provenance complete:
  source family `PACS_OLTP`, `source_query_hash` recorded, `(prop_id, prop_val_yr,
  sup_num, chg_of_owner_id)` stored as denormalized triple+sale-id. R-1..R-5 promotion
  gates wired (row count match, identity uniqueness, FK closure, dictionary value
  coverage, hash stability). Gates fail loudly; promotion is gated, not warned.
- **S2 — `truth_pacs.sale_qualified`.** Supp-aware join through `prop_supp_assoc` +
  `chg_of_owner_prop_assoc` + `chg_of_owner` + `buyer_assoc/seller_assoc` + `account`.
  Filter `sl_county_ratio_cd IN ('100')` for first pass. T-1..T-10 gates: every joined
  row has a current `prop_supp_assoc` entry; sale dates are in valid range; party graph
  has at least one buyer + one seller; deed metadata present.
- **S3 — `canonical_tf.tf_sale`.** Project from truth_pacs. Each row gets a
  `tf_sale_id` GUID and a `source_xref` row whose `SourceKeyJson` is
  `{"prop_id":..., "prop_val_yr":..., "sup_num":..., "chg_of_owner_id":...}`. C-1..C-4
  gates: every canonical sale has lineage; every party is resolved to a `tf_owner_id`
  (or quarantined to `legacy_tf_unproven.unresolved_party`); WSDOR-relevant dates
  preserved.
- **S4 — `/api/sales/qualified` read API + paginated UI table.** P-1..P-4 gates: API
  returns county-isolated rows only; pagination honors max pageSize 500; deterministic
  ordering by `sale_dt DESC, chg_of_owner_id DESC`; empty result is 200 OK with empty
  envelope.
- **S5 — Operator SQL regression suite.** Pick three of `ownership.sql`,
  `appraise_hoods.sql`, `Real_Prop_Monitor`, `res_condensed.sql`. Reproduce each
  against `canonical_tf.*` with byte-identical aggregate counts. Commit the SQL pair
  (PACS original + canonical equivalent) as the regression artifact.

**Block A done = 21,715 valid sales visible in the UI, every row provenanced, all five
gates groups green, three operator SQLs reproduce.**

**Forbidden in Block A:**
- Touching PACS write paths
- Building a comp ranker / pricing engine (that's Forge work, post-block)
- Touching pre-2018 sales (acknowledge cutover, defer)
- Modifying `PacsDataSeeder` (we're replacing the path, not patching it)

---

### Block B — Owner + Account Lane Closed (weeks 4–6)

**Goal**: "Who owns parcel X today" and "What does parcel X owe in WSDOR rolls" both
backed by `canonical_tf` with PII honored at the projection layer.

**Slices:**

- **O1 — `raw_pacs.account` + `raw_pacs.owner` landing.** Owner is 4-key composite
  `(owner_tax_yr, sup_num, prop_id, owner_id)`. Account is the rich PII surface
  (`first_name`, `last_name`, `dl_num`, `dl_state`, `email_addr`, `web_suppression`,
  `confidential_flag`). Provenance + load_batch as Block A. R-gates extended for PII
  source classification.
- **O2 — `truth_pacs.owner_current`.** Supp-aware join: for each `(prop_id, year)`,
  the owner row whose `sup_num` matches the current `prop_supp_assoc.sup_num`. T-gates
  prove single-owner-of-record OR multi-owner with `pct_ownership` summing to 100.
- **O3 — `canonical_tf.tf_owner` + `canonical_tf.tf_parcel_owner_link`.** Honor
  `confidential_flag` and `web_suppression` at projection: confidential rows project
  with `display_name = "[Confidential]"` and PII fields nulled in `canonical_tf`.
  Real PII stays in `raw_pacs` only, accessible to authorized roles.
- **O4 — `truth_pacs.wash_prop_owner_val`.** WSDOR audit-grade per-owner values.
  4-key. Includes disaster proration, senior freeze, BOE status. T-gates prove value
  sums match `wash_property_val` totals.
- **O5 — `canonical_tf.tf_assessment_wsdor`.** WSDOR-aligned canonical projection.
  C-gates prove every assessment has owner + parcel lineage.
- **O6 — `/api/parcels/{id}/owner-current` + `/api/parcels/{id}/wsdor-roll` APIs.**
  PII-aware. Confidential parcels return suppressed payloads to non-authorized roles.

**Block B done = WSDOR rolls reproducible from canonical_tf, owner-of-record API live,
PII handling verified by integration test.**

**Forbidden in Block B:**
- Returning real PII through any unauthorized API path
- Joining account → owner without going through `prop_supp_assoc`
- Modifying any PACS write path

---

### Block C — Improvement + Land Lanes (weeks 7–9)

**Goal**: Improvement secondary features (ATTGAR, BSMT, POLEBLDG, COVPATIO, MA, DETGAR,
POOL, etc.) projected with the user's % of BIV semantics in mind, even before the
calculator is built. Land schedules visible. `i_attr_id` and `hood_cd` locked as
canonical dictionaries.

**Slices:**

- **I1 — `raw_pacs.imprv` + `raw_pacs.imprv_detail` + `raw_pacs.imprv_attr` landing.**
  Provenance + dictionary cross-check. Any `i_attr_val_cd` not in dictionary is
  quarantined to `legacy_tf_unproven.unresolved_imprv_attr`.
- **I2 — `truth_pacs.imprv_current`.** Supp-aware. Active improvements only.
- **I3 — `canonical_tf.tf_improvement` + `tf_improvement_feature`.** Secondary features
  projected with their `i_attr_val_cd` resolved to canonical names (CovPatio,
  AttachedGarage, Basement, etc.). Quantity + unit columns preserved.
- **L1 — `raw_pacs.land_detail` landing.** Same shape as I1.
- **L2 — `truth_pacs.land_current`.** Supp-aware.
- **L3 — `canonical_tf.tf_land` + `tf_land_use_code` (dictionary-anchored).** Ag
  schedules + land schedules referenced through canonical dictionary tables, not free
  text.
- **D1 — Lock `canonical_tf.dim_neighborhood` (hood_cd) + `dim_imprv_attr_val`
  (i_attr_val_cd) + `dim_county_ratio_code` + `dim_reet_wac_code` + `dim_deed_type` +
  `dim_state_code` + `dim_property_type` + `dim_abs_subdv` as canonical reference
  tables.** These are closed vocabularies. Source from PACS dictionary tables;
  re-promote on every load_batch only if hash changes.

**Block C done = improvement + land lanes both fully promoted, dictionaries locked,
operator SQL for `appraise_hoods.sql` and `res_condensed.sql` reproduces against
canonical_tf.**

**Forbidden in Block C:**
- Building the BIV calculator (Forge slice, post-90-day)
- Inventing new improvement feature codes; only PACS dictionary values allowed
- Touching cost schedules in `raw_pacs.imprv_sched` (separate slice family)

---

### Block D — First Write-Back + ArcGIS Overlay (weeks 10–12)

**Goal**: Prove the full bidirectional doctrine end-to-end on one safe field, plus
parcel polygons visible on a map.

**Slices:**

- **W1 — Pick the field**: `appraiser_id` assignment on `property_val`. Lowest blast
  radius. Already operator-managed today via SQL.
- **W2 — `field_authority` policy**: `appraiser_id` set to `MANUAL_REVIEW` (TF
  proposes, operator approves before write to PACS). Conflict queue UX exercises.
- **W3 — `writeback_journal`**: every proposed write logged with proposed value, prior
  PACS value, operator ID, approval timestamp. Idempotency key per write.
- **W4 — `rollback_package`**: every approved write generates an undo SQL script
  before execution. Undo is testable in dev environment.
- **W5 — End-to-end test**: 10 appraiser_id changes proposed in TF UI, operator
  approves, writes land in `pacs_oltp`, rollback packages generated, one rollback
  exercised to verify undo path.
- **G1 — `gis_tf.parcel_geom` schema.** OBJECTID + APN as source key. ArcGIS REST
  feature service URL configured per county. Source family `ARCGIS_REST` added to
  source family enum.
- **G2 — Nightly ArcGIS sync job**. Cached locally. Last-good snapshot served when
  endpoint down.
- **G3 — `canonical_tf.tf_parcel.geom`** projection + `source_xref` link to ArcGIS
  feature.
- **G4 — `/api/parcels/{id}/geometry` + minimal map view in shell.** Atlas
  surface starts here.

**Block D done = one full bidirectional write-back proven, parcel polygons visible,
ArcGIS source family integrated into doctrine.**

**Forbidden in Block D:**
- Write-back on any field other than `appraiser_id` (one field, one proof, one
  expansion later)
- Custom shapefile parsing
- Hitting county ArcGIS on every read (cache or it doesn't ship)

---

## 4. AI Agent Parallelization Rules

The main thread (Claude in this session) runs slice cards in serial. Background work is
delegated:

- **Schema reading agents**: spawn for `property_val.sql` (14,572 lines), `sale.sql`
  (3,082 lines), and stored proc families (Monitor*, _monitor_*, sales_ratio_*,
  LevyCalc*, _CertMail*, dor_*). Output: per-table column summary + invariants list,
  written to `docs/pacs/schema-summaries/<table>.md`. Run in background, never block
  main slices.
- **Operator SQL classification agent**: spawn for the BS_PACS / Files of SQL corpus.
  Output: per-file summary tagging which lane it serves and which canonical_tf surface
  it should regression-test. Run once in background; output feeds the regression list.
- **Stored proc business-logic agent**: spawn for monitor procs and DOR procs. Output:
  business-rule extraction (e.g., "this proc qualifies sales using `sl_county_ratio_cd
  IN ('100','200')` for ratio studies"). Feeds the qualification policy doc.

Agents never modify code. Their output is documentation. The main thread reads the
output and incorporates findings into slice cards.

---

## 5. Quality Bar (Non-Negotiable)

Every slice in every block must:

1. **Have a co-founder card** with allowed files, forbidden files, required changes, do-not-do.
2. **End with a green commit** referenced from this plan.
3. **Name the operator SQL it preserves** (or "N/A — greenfield" with justification).
4. **Pass its promotion gates** (R/T/C/P groups appropriate to stage).
5. **Honor the source_xref invariant**: zero canonical_tf rows without lineage.
6. **Be idempotent**: re-running the same slice's load_batch with the same source data
   produces identical canonical_tf state.
7. **Be reversible**: write-back slices include a rollback_package exercise in tests.

If a slice can't meet these, it's a draft, not a slice. Drafts don't merge.

---

## 6. Anti-Patterns (Things We've Already Done Wrong)

These are documented so we don't redo them:

- **Flat property reads.** `SELECT * FROM property` without `prop_supp_assoc` join is
  always wrong. Result: 128k rows where Benton has ~89k.
- **Wrong qualification axis.** Qualifying on `wac_cd` instead of `sl_county_ratio_cd`.
  Result: BENTON-SYNC-7 qualified on the wrong column.
- **2-digit code assumption.** Operator SQL has `'01'` / `'02'` (old vocabulary).
  Production data has `'100'` / `'200'` / `'300'` (new vocabulary). The 2017 cutover
  is real; cross-cutover joins must declare it.
- **Junction-as-edge fallacy.** `chg_of_owner_prop_assoc` carries value snapshots, not
  just edges. Treating it as a pure junction loses sale-time market value, assessed
  value, deed metadata.
- **PII through API leakage.** PII must be suppressed at projection (canonical_tf
  layer), not just at API layer. Defense-in-depth, not single-point.
- **Custom shapefile parsing.** Already decided against. ArcGIS REST instead.

---

## 7. Save State / Default Promotion

**Current main**: `f2508906e`.

**Default next slice**: **G1 — `gis_tf.parcel_geom` schema + ArcGIS REST adapter**
(greenfield, doctrine pressure-test, parallel to Block A).

**Alternative next slice if PACS-native progress preferred**: **S1 — `raw_pacs.sale`
landing with provenance + R-1..R-5 gates**.

Either is a correct opening move. G1 unblocks more downstream surface area (Atlas,
proximity comps, parcel map). S1 starts the lane the user touches daily.

**Parked / out-of-scope for this 90-day plan:**

- Frontend consumer beyond the minimal Block A paginated table + Block D map view
- Forge BIV calculator (post-90-day)
- Cost schedule / Benton Method calculator (post-90-day)
- Multi-county onboarding (assumes Benton-only for these 90 days)
- AI swarm consciousness layer modifications (frozen)
- Workbook mutation (frozen)
- Pre-2018 sales (acknowledged via cutover filter; full handling post-90-day)
- Building permits / DynLoader (third-party import system, not in lanes)
- Tyler Vision (not in Benton's stack; never was)

---

## 8. Success Criteria for Day 90

1. 21,715 valid sales visible end-to-end, operator SQL regression green.
2. WSDOR roll reproducible from `canonical_tf`, owner-of-record API live, PII handling
   integration-tested.
3. Improvement + land lanes promoted, dictionaries locked, hood/i_attr/county_ratio
   tables canonical.
4. One field (`appraiser_id`) writes back to `pacs_oltp` through the full doctrine
   (proposal → conflict queue → approval → writeback_journal → rollback_package),
   exercised end-to-end.
5. Parcel polygons visible on a map, served from `gis_tf.parcel_geom` cached snapshot,
   ArcGIS source family integrated into provenance doctrine.
6. Zero canonical_tf rows without `source_xref` lineage.
7. Every promoted slice has a green commit on `main`, a regression artifact, and a
   doctrine-compliant load_batch trail.

If we hit those seven, TerraFusion is no longer "syncing PACS." It's a CAMA system of
record with PACS as one provenanced source. That's the inflection point this plan
exists to reach.

---

**End of plan. The goblin has a shovel. Time to dig.**
