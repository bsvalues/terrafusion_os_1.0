# TerraFusion Sync — Harris PACS Source Pack

_Version 1.0 · 2026-06-08_  
_Template: `../SOURCE_PACK_TEMPLATE.md`_  
_Reference county: Benton County, WA (first county converted end-to-end)_  
_Doctrine base: `docs/sync/TERRAFUSION_SYNC_PRODUCT_DOCTRINE.md`_  
_Seal registry: `docs/sync/seals/benton-lane-status.md`_

> **Notation convention**: Values marked **[Benton ref]** are Benton County–specific.  
> Values with no qualifier are Harris PACS–universal (apply across Harris counties, subject to §14 confirmation).

---

## 1. Pack Identity

```
Pack name:          Harris PACS Source Pack
Source system:      Harris Govern / Harris PACS (formerly Harris CAMA)
Version / release:  PACS 9.0 (Benton reference; version confirmed at county engagement)
CAMA / PACS vendor: Harris Govern
Pack author:        TerraFusion Sync (Benton prototype, 2026)
Pack status:        REFERENCE
Reference county:   Benton County, WA
Date sealed:        2026-06-08
```

---

## 2. Source Connection Profile

```
Connection type:    SQL Server (SQL Server Authentication)
Default database:   pacs_oltp          ← confirm per county; may differ
Default schema:     dbo
Auth method:        SQL Server user (stored in appsettings.{County}.local.json — NOT committed)
Required access:    READ ONLY on all tables in §5 per-lane
Landing schema:     legacy_pacs_raw    (TerraFusion Postgres)
```

**Key tables used (Harris PACS universal):**

| Table | Domain |
|-------|--------|
| `dbo.imprv` | improvements (structures) |
| `dbo.imprv_detail` | improvement sub-components |
| `dbo.imprv_attr` + `dbo.imprv_attr_val` | improvement attribute definitions |
| `dbo.land_detail` | land segments |
| `dbo.owner` + `dbo.owner_addr` | ownership |
| `dbo.property_val` | assessed / appraised / market values |
| `dbo.exmpt` | exemptions |
| `dbo.prop_supp_assoc` | active supplement tracking |
| `dbo.prop_val` or `dbo.property` | master parcel table (prop_id) |
| `dbo.chg_of_owner` | sales / change of ownership events |
| `dbo.sl_ratio` (or inline columns on chg_of_owner) | sales qualification flags |
| `dbo.tax_area` | tax collection areas (TCA) |
| `dbo.tax_area_fund_assoc` | TCA → district/fund associations |
| `dbo.entity` | taxing entities / levy districts |
| `dbo.bill` | tax bills |
| `dbo.levy_bill` | levy tax bill detail (1:1 with L bills) |
| `dbo.assessment_bill` | special-assessment bill detail (1:1 with A bills) |
| `dbo.coll_transaction` | collection transactions (net-paid attestation) |

**Minimum connectivity check:** Connect to PACS, run `SELECT COUNT(*) FROM dbo.property_val` — confirms access and establishes denominator baseline.

---

## 3. Identity Spine Doctrine

> **This is Harris PACS–universal.** The column name `prop_id` and the supplemental model are the same across all Harris counties. The row count and active denominator are county-specific.

```
Source identity key:  prop_id  (integer, unique per parcel in PACS)
Source parcel table:  dbo.property_val  (or dbo.prop_val — confirm at engagement)
                      SELECT DISTINCT prop_id = all parcels ever touched

Active parcel filter: county-specific (see §14 — property_status_code, prop_type_cd, is_active)

TerraFusion spine:    sync_bridge.source_xref
                      WHERE TfEntityType='parcel' AND IsActive = true
Spine canonical:      canonical_tf.tf_parcel
Key in source_xref:   SourceKeyJson contains prop_id

WARNING: canonical_tf.tf_parcel contains ALL historical generations of parcel identity.
  NEVER blind-join tf_parcel directly.
  ALWAYS resolve through active source_xref.
```

**[Benton ref] Spine counts:**
- Live parcel spine: **83,326** active parcels
- Raw `tf_parcel` table: **~3.1M rows** (F2 debris — historical identity generations, non-blocking, deferred)
- APN field: `ParcelNumber` in `canonical_tf.tf_parcel`

**[Benton ref] F1 identity fork history:** At first production readback, land/improvement/geometry canonical rows were keyed to a prior parcel-identity generation. Repaired 2026-06-08 by set-based canonical re-key onto the live spine. Source seals remained valid. Lesson: canonical re-key may be needed if the spine was rebuilt after lanes were populated.

---

## 4. Active Supplement Doctrine

> **Harris PACS–universal. The `sup_num` semantics are the same across all Harris counties.**  
> What varies per county: which operational year is certified, and whether any domain has deviations.

Harris PACS tracks corrections and amendments to parcel data using supplement numbers (`sup_num`). When a value is corrected, a new row is inserted with `sup_num = MAX(prior_sup_num) + 1` for that grain/year — the original is retained.

```
Supplement column:    sup_num  (integer ≥ 0)
Current-record rule:  MAX(sup_num) per grain/year = current (active) record

DO NOT assume sup_num=0 is current.
DO NOT promote any lane without confirming the active supplement per domain.
```

**Per-domain supplement grains:**

| Domain | Natural key grain | Year column | Notes |
|--------|-------------------|-------------|-------|
| Improvement | `(prop_id, prop_val_yr, sup_num, imprv_id)` | `prop_val_yr` | Benton ref: working year 2026 all have sup_num=0 (no supplements issued yet) |
| Land | `(prop_id, prop_val_yr, sup_num, land_seg_id)` | `prop_val_yr` | Same as improvement |
| Owner | `(prop_id, owner_tax_yr, sup_num, owner_id)` | `owner_tax_yr` | History years often have nonzero sup — critical |
| Assessment value | `(prop_id, prop_val_yr, sup_num)` | `prop_val_yr` | [Benton ref] 1,041 of 95,455 rows at 2025 have nonzero sup |
| Exemption | `(prop_id, owner_id, exmpt_tax_yr, exmpt_type_cd, sup_num)` | `exmpt_tax_yr` | [Benton ref] 126 of 6,487 rows at 2025 have nonzero sup |
| Sales | `(prop_id, owner_tax_yr, sup_num, chg_of_owner_id)` | `owner_tax_yr = YEAR(sl_dt)` | **Sales reference historical years — MAX(sup_num) is frequently non-zero** |
| Bills | No sup_num; `is_active=1` filter instead | `year` | bill.is_active=1 replaces the supplement model for current bills |

**Critical lesson from Benton (sales):** The sales promoter initially used `sup_num=0`. For historical sales years (e.g. 2018), many sale events had active supplements at `sup_num > 0`. Blind promotion at `sup_num=0` missed the active-supplement records and/or produced duplicates. Fix: resolve sales through `MAX(sup_num)` per `(prop_id, owner_tax_yr)`.

---

## 5. Year Semantics

```
Certified operational year:  2025  [Benton ref — confirm per county]
Working year (in-progress):  2026  [Benton ref — confirm per county]
Year column per domain:
  improvement/land:          prop_val_yr
  owner/assessment:          owner_tax_yr
  exemption:                 exmpt_tax_yr
  sales:                     owner_tax_yr = YEAR(sl_dt)  (implicit via chg_of_owner.owner_tax_yr)
  bills:                     year
```

**Current-year operational substrate (the first finish line):**  
Bring everything at the certified operational year. History is a separate mission and stays LANDED_ONLY until explicitly authorized.

**[Benton ref]** The 2025 certification year is what the sealed substrate describes. The 2026 working year has data in PACS but no supplements yet (sup_num=0 for improvement/land). Assessment for 2026 is in-progress.

---

## 6. Lane Contracts

### Lane: Owner

```
Status:          ✅ SEALED (Benton ref, 2026-06-07)
Source tables:   dbo.owner  (primary)  +  dbo.owner_addr  (mailing/situs address)
Source grain:    (prop_id, owner_tax_yr, sup_num, owner_id)
Active supp:     MAX(sup_num) per (prop_id, owner_tax_yr)
Op year:         owner_tax_yr = [certified year]

Truth table:     truth_pacs.owner_current
Truth key:       (prop_id, owner_tax_yr, sup_num, owner_id)
Canonical table: canonical_tf.tf_owner  +  canonical_tf.tf_parcel_owner_link

Identity resolution:
  prop_id → source_xref(TfEntityType='parcel', IsActive) → TfParcelId → tf_parcel_owner_link

Dictionary:      none required for core owner fields

Expected denominator:      all active (prop_id, owner_tax_yr) at MAX(sup_num) for op year
Benton ref truth:          816,849 owner rows (active-supp, all owners across all parcels)
Benton ref canonical:      tf_owner (account-deduped) + 2,111,805 tf_parcel_owner_link rows
Dup invariant:             1.0000× at truth

Readback claim:
  "This parcel's current owners as recorded in PACS, with active supplement resolved."
Out-of-scope claim:
  "Complete ownership history for prior years."  (LANDED_ONLY, not sealed)
```

**⚠ Known WARN — tf_parcel_owner_link drift [Benton ref]:**  
`canonical_tf.tf_parcel_owner_link` has **1,397,252** of 2,111,805 rows (66%) with a `TfParcelId` not on the current live spine. This is stale association debris from prior parcel-identity generations — NOT F1-class identity drift on the owner data itself. The tf_owner records are correct; only the link table carries stale parcel FK references.  
Status: Deferred — separate triage required. Any UI surface joining this table must filter through the live spine to avoid showing stale associations.

County override point: WSDOR (Washington State DOR) ownership data may exist alongside PACS ownership. If present, confirm which is authoritative for the owner lane.

---

### Lane: Land

```
Status:          ✅ SEALED (Benton ref, 2026-06-03)
Source tables:   dbo.land_detail  +  dbo.land_type  (type dict)  +  dbo.soil_code  (soil dict)
Source grain:    (prop_id, prop_val_yr, sup_num, land_seg_id)
Active supp:     MAX(sup_num) per (prop_id, prop_val_yr)
Op year:         prop_val_yr = [working year]

Truth table:     truth_pacs.land_detail_current
Truth key:       (prop_id, prop_val_yr, sup_num, land_seg_id)
Canonical table: canonical_tf.tf_land

Identity resolution:
  prop_id → source_xref(TfEntityType='parcel', IsActive) → TfParcelId

Dictionaries:    land_type (land classification code → label)
                 soil_code (soil productivity code → label)

Benton ref denominator:    82,012 R-type land-bearing parcels (prop_type_cd='R')
Benton ref canonical:      87,767 rows (>1 land segment per parcel is normal)
Dup invariant:             1.0000×
Benton ref: sup_num=0 universally for working year 2026 (no supplements issued)

Allowed unresolved:
  MH parcels legitimately have no land_detail segment in PACS (mobile-home land = 0)
  Personal-property parcels: no land expected

Readback claim:
  "This parcel's current land segments and soil/type classification per PACS."
Out-of-scope claim:
  "Complete land segment history for prior years."
```

County override: `prop_type_cd='R'` is the Benton real-property filter. Confirm the property type code that defines the real-property universe per county.

---

### Lane: Improvement

```
Status:          ✅ SEALED (Benton ref, 2026-05-30)
Source tables:   dbo.imprv (structures)
                 dbo.imprv_detail (sub-components / features)
                 dbo.imprv_attr + dbo.imprv_attr_val (attribute definitions)
                 dbo.property_val (prop_type_cd, ag_apply)
                 dbo.land_detail (ag_apply for universe classification)
Source grain:    (prop_id, prop_val_yr, sup_num, imprv_id)  per structure
                 (imprv_id, imprv_det_id)                   per feature
Active supp:     MAX(sup_num) per (prop_id, prop_val_yr)
Op year:         prop_val_yr = [working year]

Truth table:     truth_pacs.imprv_current
Truth key:       (prop_id, prop_val_yr, sup_num, imprv_id)
Canonical table: canonical_tf.tf_improvement (structure)
                 canonical_tf.tf_improvement_feature (feature/sub-component)

Identity resolution:
  prop_id → source_xref(TfEntityType='parcel', IsActive) → TfParcelId

Dictionaries:    imprv_type (improvement type code → label)
                 imprv_det_class (sub-component class)
                 imprv_det_meth (sub-component method)
                 imprv_attr_val (attribute value dictionary — county-specific codes)
                 property_use (prop_use_cd → use label)

Benton ref denominator:    71,736 R-type improvement-bearing parcels
Benton ref canonical:      99,694 improvement features (>1 feature per structure is normal)
Dup invariant:             1.0000×
Benton ref excluded:       4,176 MH parcels excluded by spine doctrine

Valuation universe classification (Harris PACS–universal doctrine, Benton reference values):
  Universes: REAL_RESIDENTIAL / REAL_COMMERCIAL / AG_CURRENT_USE /
             MOBILE_HOME / PERSONAL_PROPERTY / CONVERSION_LEGACY (unknown sentinel)
  Classification inputs: prop_type_cd, ag_apply (from land_detail), prop_use_cd,
                         prop_inactive_dt (ProVal conversion sentinel)
  Precedence (highest first): CONVERSION_LEGACY > AG_CURRENT_USE > PERSONAL_PROPERTY >
    MOBILE_HOME > REAL_COMMERCIAL > REAL_RESIDENTIAL > UNKNOWN
  Implementation: tf_doctrine_property_universe + tf_doctrine_attribute_dictionary
  Note: [Benton ref] prop_inactive_dt = 1980-01-01 is a ProVal conversion sentinel
        (not a real date — 100% of pre-2017 rows carry it). CONVERSION_LEGACY rule was
        demoted to escape-hatch (lowest precedence) because of over-fire on this sentinel.

Attribute dictionary seeding:
  imprv_attr_val codes are county-specific. A new county requires fresh dictionary load.
  [Benton ref] 193 codes loaded from PACS at backend startup (via SqlServerImprvAttrValDictionaryLoader).

Quarantine rule:
  Improvement-attr rows whose AttributeId cannot be resolved from the dictionary →
  UNKNOWN_ATTRIBUTE quarantine. [Benton ref] Was 9,504 rows; resolved to 0 after
  RefreshableImprvAttrDictionary populated from PACS.

Readback claim:
  "This parcel's current improvement structures and features per PACS, universe-classified."
Out-of-scope claim:
  "Complete improvement history for prior years."
  "Treasurer-grade property status."
```

County override: Confirm prop_type_cd values for real-residential / real-commercial / MH / ag per county. Confirm whether `prop_inactive_dt` sentinel date applies (ProVal-era counties only).

---

### Lane: Sales

```
Status:          ✅ SEALED (Benton ref, 2026-06-03)
Source tables:   dbo.chg_of_owner (sale events)
                 dbo.sl_ratio  or  inline columns on chg_of_owner (qualification flags)
                 dbo.owner (sale context — buyer/seller at point of sale)
Source grain:    chg_of_owner_id  (unique sale event)
                 supplement grain: (prop_id, owner_tax_yr, sup_num)
Active supp:     MAX(sup_num) per (prop_id, owner_tax_yr)  ← CRITICAL for historical years
Sale year:       owner_tax_yr = YEAR(sl_dt)  (implicit via chg_of_owner)

Truth table:     truth_pacs.sale_current (qualified sales only)
Truth key:       chg_of_owner_id
Canonical table: canonical_tf.tf_sale  (or equivalent — confirm table name)

Identity resolution:
  prop_id → source_xref(TfEntityType='parcel', IsActive) → TfParcelId

Qualification rule (see §14 county override — this is the most county-specific field):
  Qualified sales = those that pass the DOR or county ratio study filter
  Implemented via tf_doctrine_ratio_policy (year-aware; effective_start_year)

Benton ref denominator:    29,914 qualified sales promoted (DOR-or-county)
Benton ref landed:         75,678 total landed; 45,764 unqualified excluded
Dup invariant:             1.0000×

Known doctrine caution [Harris PACS–universal]:
  sale_id=0 is a valid PACS-native value for the implicit sale event.
  Per Harris support: sale_id=0 indicates the original/implicit change of ownership
  with no explicit sale transaction. Do NOT treat as null or error.

Readback claim:
  "Qualified sales for this parcel per the ratio study policy in effect at time of sale."
Out-of-scope claim:
  "Complete sale history including disqualified sales."  (LANDED_ONLY, not sealed)
  "Treasurer-grade deed recording."
```

County override (MOST IMPORTANT — see §14): Ratio policy qualification codes are county-specific. See the dedicated override section.

---

### Lane: Geometry

```
Status:          ✅ SEALED (Benton ref, 2026-06-04 + F1 repair 2026-06-08)
Source:          ArcGIS Parcels service  ← NOT a PACS table
                 [Confirm source endpoint per county — may be ArcGIS REST, shapefile export,
                  WFS, or other GIS source]
Source grain:    One feature per APN (parcel number / polygon)
No sup_num:      Geometry has no supplement number — different cadence from PACS data

Truth layer:     None (direct landing → canonical)
Canonical table: gis_tf.tf_parcel_geom

Identity resolution:
  APN (from geometry source) → canonical_tf.tf_parcel.ParcelNumber → TfParcelId

Benton ref source:     80,076 ArcGIS features
Benton ref landed:     80,075
Benton ref canonical:  80,075 geom; 79,105 crosswalked to tf_parcel (TfParcelId populated)
                        970 NULL-APN residual (301 null-APN in source + 669 no tf_parcel match)
                        both legitimate — not a defect

Benton ref F1 lesson:
  After live parcel spine was rebuilt, tf_parcel_geom rows still keyed to old TfParcelId values.
  Required set-based re-key. Always verify geometry canonical keys against current live spine
  after any spine rebuild. (Same lesson applies to land and improvement.)

Readback claim:
  "This parcel's polygon geometry and centroid as recorded in the county GIS service."
Out-of-scope claim:
  "Complete geometry history / version history of parcel boundary changes."
```

County override: GIS source endpoint, format, and APN field name. Some counties use different parcel number formats or have APN-to-prop_id translation tables.

---

### Lane: Assessment Value

```
Status:          ✅ SEALED (Benton ref, 2026-06-07)
Source table:    dbo.property_val
Source grain:    (prop_id, prop_val_yr, sup_num)
Active supp:     MAX(sup_num) per (prop_id, prop_val_yr)
Op year:         prop_val_yr = [certified year]

Truth table:     truth_pacs.property_val_current (or truth_pacs.assessment_current)
Truth key:       (prop_id, prop_val_yr, sup_num)
Canonical table: canonical_tf.tf_assessment

Identity resolution:
  prop_id → source_xref(TfEntityType='parcel', IsActive) → TfParcelId

Fields:          assessed_val, appraised_val, market_val
                 land_val component, improvement_val component  (where present)

Benton ref denominator:    95,455 (2025, all active-supp rows including MH/personal-prop)
Benton ref truth:          95,455
Benton ref canonical:      83,326 (spine-resolved real-property only)
                            12,129 excluded: outside real-property spine (MH/personal-prop/etc.)
                            1,041 nonzero active supplement (not at sup_num=0)
Dup invariant:             1.0000×

Readback claim:
  "This parcel's assessed, appraised, and market values for [certified year], active supplement."
Out-of-scope claim:
  "Assessment history for prior years."  (LANDED_ONLY)
  "Appraiser's cost or income approaches."  (not in property_val)
```

---

### Lane: Exemption

```
Status:          ✅ SEALED (Benton ref, 2026-06-07)
Source table:    dbo.exmpt
Source grain:    (prop_id, owner_id, exmpt_tax_yr, exmpt_type_cd, sup_num)
Active supp:     MAX(sup_num) per (prop_id, owner_id, exmpt_tax_yr, exmpt_type_cd)
Op year:         exmpt_tax_yr = [certified year]

Truth table:     truth_pacs.exemption_current
Truth key:       (prop_id, owner_id, exmpt_tax_yr, exmpt_type_cd, sup_num)
Canonical table: canonical_tf.tf_exemption

Identity resolution:
  prop_id → source_xref(TfEntityType='parcel', IsActive) → TfParcelId

Dictionary:      dict_exemption_type (exmpt_type_cd → label, pct)
                 [Benton ref] 6 exemption types; 0 unbacked codes

Benton ref denominator:    6,487 (2025, active-supp)
Benton ref canonical:      5,643 (spine-resolved)
                            844 excluded: outside real-property spine
                            4,268 rows with exemption_pct populated
                            126 nonzero active supplement
Dup invariant:             1.0000×

Zero-row rule:   A parcel with no exemption is valid — render "none", not an error.

Readback claim:
  "This parcel's active exemptions, type-backed, for [certified year]."
Out-of-scope claim:
  "Exemption history for prior years."
  "DOR exemption certification or approval workflow."
```

County override: `exmpt_type_cd` values are county-specific (e.g. senior, disabled, nonprofit). Seed the dict_exemption_type for each new county from their PACS exmpt_type table.

---

### Lane: Jurisdiction (Tax Area / District Assignment)

```
Status:          ✅ SEALED (Benton ref, 2026-06-07)
Source tables:   dbo.property_val (tax_area_id field)
                 dbo.tax_area (TCA dictionary)
                 dbo.tax_area_fund_assoc (TCA → district/fund mapping)
                 dbo.entity (taxing entity / district dictionary)
Source grain:    (prop_id, prop_val_yr, sup_num) for parcel→TCA assignment
                 TCA→district mapping is static (no year/sup)
Active supp:     MAX(sup_num) per (prop_id, prop_val_yr) — inherits from assessment value lane

Truth table:     (co-lands with assessment value; no separate truth table)
Canonical tables:
  canonical_tf.tf_parcel_tax_area  (parcel → TCA assignment)
  canonical_tf.tf_tax_area         (TCA dictionary)
  canonical_tf.tf_tax_district     (taxing entity dictionary)
  canonical_tf.tf_tax_area_district (TCA → district relationships)

Benton ref denominator:    95,455 (2025, active-supp, same as assessment value)
Benton ref canonical:      83,326 parcel→TCA (spine-resolved)
                            109 TCAs  (tf_tax_area)
                            37 districts  (tf_tax_district)
                            487 TCA→district pairs  (tf_tax_area_district)
                            0 parcels with NULL TCA  (100% backed)
Dup invariant:             1.0000× (parcel assignment)

Boundary: district-id ONLY from tax_area_fund_assoc. Levy rates and fund/distribution
are Revenue Spine scope — NOT jurisdiction scope.

Readback claim:
  "This parcel's tax collection area and taxing district assignments per PACS."
Out-of-scope claim:
  "Levy rates or tax amounts by district."  (Revenue Spine scope)
  "Fund distribution or delinquency by district."  (deferred Treasurer-grade)
```

County override: TCA codes and district names are county-specific. district count and TCA count will differ per county.

---

### Lane: Revenue — Levy Tax Bill (Stage 1)

```
Status:          ✅ SEALED (Benton ref, 2026-06-07, current-year read-only)
Source tables:   dbo.bill  (year=[op_year], bill_type='L', is_active=1)
                 dbo.levy_bill  (1:1 join with bill for type='L')
Source grain:    bill_id  (unique bill; 1:1 levy_bill)
No sup_num:      Bills use is_active=1 as current filter (no supplement model)

Canonical tables:
  canonical_tf.tf_tax_bill_line     (per-district/levy/rate line)
  canonical_tf.tf_levy_rate         (levy rate dictionary)
  canonical_tf.tf_tax_bill_current  (parcel rollup: SUM due/paid/balance + line count)

Identity resolution:
  bill.prop_id → source_xref(TfEntityType='parcel', IsActive) → TfParcelId

Benton ref landed:       1,104,507  (2025 active L bills)
Benton ref canonical:    990,665 bill lines; 79,767 distinct parcels; 49 levy rates
Benton ref excluded:     113,842 bills outside real-property spine (MH/etc. — legitimate)
Benton ref amounts:
  due:      $308,949,578.44
  paid:         $3,602.19
  balance:  $308,945,976.25  (line ↔ rollup EXACT)
Rollup invariant:        SUM(tf_tax_bill_line.BillCount) = tf_tax_bill_current.LineCount
District backing:        100% (0 NULL TaxDistrictId)
Rate backing:            100% (0 NULL LevyRate)
Dup invariant:           1.0000×

Bill amount doctrine:    bill.amount_due, bill.amount_paid — PACS-recorded verbatim
                         balance = due − paid  (arithmetic identity, not recomputed)
                         Net-paid attested: see §9

Readback claim:
  "This parcel's current-year active levy tax bill lines, by district/levy/rate,
   with PACS-recorded due, paid, and balance."
Out-of-scope claim:
  "Receipt-level payment history."
  "Fund/distribution accounting."
  "Delinquency status."
  "Prior-year levy bill history."
```

County override: Levy rate count (49 in Benton) and district count will differ per county. Bill year is the certified operational year.

---

### Lane: Revenue — Special-Assessment Bill (Stage 2B)

```
Status:          ✅ SEALED (Benton ref, 2026-06-07, current-year read-only)
Source tables:   dbo.bill  (year=[op_year], bill_type='A', is_active=1)
                 dbo.assessment_bill  (1:1 join with bill for type='A')
Source grain:    bill_id  (unique bill; 1:1 assessment_bill)
No sup_num:      Bills use is_active=1 as current filter

Canonical tables:
  canonical_tf.tf_assessment_bill_line     (per-agency line)
  canonical_tf.tf_assessment_agency        (special-assessment agency dictionary)
  canonical_tf.tf_assessment_bill_current  (parcel rollup: SUM due/paid/balance)

Identity resolution:
  bill.prop_id → source_xref(TfEntityType='parcel', IsActive) → TfParcelId

Benton ref landed:       313,139  (2025 active A bills)
Benton ref canonical:    313,139 bill lines; 79,078 distinct parcels; 29 agencies (9 billing)
Benton ref unresolved:   0  (100% on real-property spine — unlike L bills)
Benton ref amounts:
  due:      $8,841,075.97
  paid:          $429.35
  balance:  $8,840,646.62  (line ↔ rollup EXACT)
Rollup invariant:        SUM(BillCount) = LineCount  (same as levy bill)
Agency backing:          100% (0 NULL AgencyId)
Rate field:              NONE (special assessments are agency-backed, rate-free)
Dup invariant:           1.0000×

Readback claim:
  "This parcel's current-year active special-assessment bill lines by agency,
   with PACS-recorded due, paid, and balance."
Out-of-scope claim:
  "Levy rates or district-based billing."  (Revenue Stage 1 scope)
  Same Treasurer-grade exclusions as Stage 1.
```

County override: Agency count and names will differ per county. Some counties may have no 'A' bills (confirm at engagement).

---

## 7. Dictionary Dependencies (Cross-Lane)

| Dictionary | Source table | Canonical table | Consumed by | County-specific? |
|------------|-------------|-----------------|-------------|-----------------|
| Exemption type | `dbo.exmpt_type` (or inline codes) | `canonical_tf.dict_exemption_type` | Exemption lane | Yes — codes and labels vary |
| Land type | `dbo.land_type` | (embedded or dict table) | Land lane | Partially — core codes similar |
| Soil code | `dbo.soil_code` | (embedded or dict table) | Land lane | Yes |
| Improvement type | `dbo.imprv_type` | (embedded or dict table) | Improvement lane | Partially |
| Improvement detail class | `dbo.imprv_det_class` | (embedded) | Improvement lane | Partially |
| Improvement attribute values | `dbo.imprv_attr_val` | `canonical_tf.attribute_definition` | Improvement features | **Yes — fully county-specific** |
| Property use code | `dbo.property_use_code` | (embedded) | Improvement universe classifier | Yes |
| Tax area | `dbo.tax_area` | `canonical_tf.tf_tax_area` | Jurisdiction lane | Yes — codes/counts differ |
| Tax district / entity | `dbo.entity` | `canonical_tf.tf_tax_district` | Jurisdiction + Revenue Stage 1 | Yes |
| Levy rate | `dbo.levy` (or inline) | `canonical_tf.tf_levy_rate` | Revenue Stage 1 | Yes |
| Special-assessment agency | `dbo.special_assessment_agency` (or inline) | `canonical_tf.tf_assessment_agency` | Revenue Stage 2B | Yes |

**Most critical county-specific dictionary: imprv_attr_val.**  
This dictionary is loaded at backend startup from PACS directly (via `SqlServerImprvAttrValDictionaryLoader`). A new county starts with 0 loaded codes and must populate by running the attribute drain after dictionary refresh.

---

## 8. Bill Type Rules

```
Bill type column:    bill.bill_type  (VARCHAR)
Levy bill code:      'L'
Special-assmt code:  'A'
Active bill filter:  bill.is_active = 1
Year filter:         bill.year = [certified operational year]

Levy detail join:    dbo.levy_bill ON levy_bill.bill_id = bill.bill_id  (1:1 for type='L')
Agency detail join:  dbo.assessment_bill ON assessment_bill.bill_id = bill.bill_id  (1:1 for type='A')
Bill identity:       bill.bill_id  (integer, unique)
Bill-to-parcel:      bill.prop_id → source_xref(TfEntityType='parcel', IsActive) → TfParcelId

Other bill types:    Harris PACS may have additional bill_type codes (e.g. 'P' for personal property).
                     Only 'L' and 'A' are in scope for the current substrate. Confirm at engagement
                     whether additional bill types are in use.
```

---

## 9. Payment Net-Paid Attestation Doctrine

```
Net paid column:     bill.amount_paid  (DECIMAL — PACS-recorded bill-grain net)
Collection table:    dbo.coll_transaction
Collection grain:    trans_group_id = bill_id  (transaction's bill reference)
Collection sum col:  base_amount_pd  (base amount paid, excluding penalty/interest components)

Attestation claim:
  bill.amount_paid ≡ SUM(coll_transaction.base_amount_pd) WHERE trans_group_id = bill_id
  Must be proven at corpus scale (all current-year active bills), not just a sample.
  Required delta: $0.00

Benton ref proof:
  Corpus: 1,417,646 current-year (2025) active bills
  bill.SUM(amount_paid):                   $32,941.46
  coll_transaction.SUM(base_amount_pd):    $32,941.46
  Delta:                                   $0.00  (penny-exact)
  Transaction count (1,418,142) > bill count (1,417,646) because some bills carry
  multiple collection movements that net to amount_paid exactly.
  Sample proof (Stage 3A): 0/496 paid-bill mismatches.

What this authorizes:
  Serving bill.amount_paid and balance = due − paid as PACS-authoritative net paid/balance
  directly from the sealed bill models. No payment canonical model is required.

What it does NOT authorize:
  Receipt-level payment history (individual transactions, dates, tender)
  Tender type detail (check, ACH, cash)
  Void / reversal / refund workflow
  Penalty and interest paid as separate components (those are in separate PACS columns,
  not included in base_amount_pd)
  Cash-ledger reconciliation for the Treasurer
  Fund / distribution accounting
```

---

## 10. Known Deferred Domains

These domains exist in Harris PACS and have source data landed in `legacy_pacs_raw`, but no sealed lane in the current substrate. A new county should NOT claim coverage of these domains until explicitly authorized.

| Domain | Status | Reason deferred | PACS source tables |
|--------|--------|-----------------|-------------------|
| Payment receipt ledger | DISCOVERED_DEFERRED | Treasurer-grade; not assessment scope | `dbo.coll_transaction`, `dbo.receipt`, `dbo.tender` |
| Penalty / interest paid breakdown | DISCOVERED_DEFERRED | Separate PACS components; not in `base_amount_pd` | `coll_transaction.penalty_paid`, `interest_paid` |
| Void / refund / reversal workflow | DISCOVERED_DEFERRED | Treasurer-grade audit trail | `dbo.coll_transaction` (void codes) |
| Delinquency certification | DISCOVERED_DEFERRED | Treasurer-grade; not assessment scope | `dbo.delinquency` (if present) |
| Fund / distribution accounting | DISCOVERED_DEFERRED | Treasurer-grade levy fund split | `dbo.dist_of_funds` (or equivalent) |
| Assessment-value history (prior years) | LANDED_ONLY | Source in landing; history lane not sealed | `truth_pacs.property_val_current` (prior years) |
| Land segment history (prior years) | LANDED_ONLY | Source in landing; history lane not sealed | `truth_pacs.land_detail_current` (prior years) |
| Improvement history (prior years) | LANDED_ONLY | Source in landing; history lane not sealed | `truth_pacs.imprv_current` (prior years) |
| Sales disqualified / historical | LANDED_ONLY | Landed but qualification-gated or out of scope | `truth_pacs.sale_current` (unqualified rows) |
| ProVal / Ascend conversion artifacts | OUT_OF_SCOPE | Historical conversion from legacy system — provenance footnote only | Various PACS tables (prop_inactive_dt = 1980-01-01 sentinel) |
| Prior-year levy bill history | DISCOVERED_DEFERRED | Current-year only in substrate; history is separate mission | `dbo.bill` (prior years) |
| Prior-year assessment bill history | DISCOVERED_DEFERRED | Same | `dbo.bill` (prior years) |

---

## 11. Known WARN Conditions

These conditions produce WARN (not FAIL) in the tf-sync doctor. A new county using this pack should expect similar WARN conditions and confirm they are the same deferred decisions.

| Condition | Doctor tool | Verdict | Benton detail |
|-----------|------------|---------|---------------|
| `tf_parcel_owner_link` identity drift | #1 Identity-Drift | WARN (deferred) | 1,397,252 / 2,111,805 rows (66%) carry stale TfParcelId — owner data is correct, link table carries stale parcel FK |
| LANDED_ONLY history lanes (3) | #3 Domain Coverage | WARN | assessment-value-history, land-improvement-history, sales-disqualified-historical |
| DISCOVERED_DEFERRED Treasurer domains (3) | #3 Domain Coverage | WARN | payment-ledger, delinquency, fund-distribution |
| EMPTY_IN_SOURCE (1) | #3 Domain Coverage | WARN | appeals/corrections — confirmed empty in Benton PACS |
| F2 parcel debris | Not currently a FAIL gate | Informational | ~3.1M raw tf_parcel rows vs 83,326 live — non-blocking, separate cleanup |

---

## 12. Readback Sample Profiles

Six-parcel acceptance set used for the Benton post-seal readback. **[Benton ref — prop_id values are Benton-specific]**.  
For a new county, select parcels matching the same six profiles from that county's live spine.

| Profile | Benton prop_id | Selection criteria | Surfaces exercised |
|---------|---------------|--------------------|--------------------|
| 1 · plain residential | 321209 | No exemption, no special assessment, normal owner | Baseline: parcel + owner + assessment + levy bill + due/paid/balance |
| 2 · with exemption | 10009 | Has active exemption record | tf_exemption + dict_exemption_type (type + pct) |
| 3 · non-zero active supplement | 87621 | Any lane has active sup_num > 0 in certified year | Active-supplement resolution — not served from sup=0 |
| 4 · with special-assessment bill | 23199 | Has 'A' bill (6 agencies in Benton) | tf_assessment_bill_line + tf_assessment_bill_current |
| 5 · paid amount > 0 | 10881 | bill.amount_paid > 0 ($1,132.26 in Benton) | Due / paid / balance rollup + net-paid attestation |
| 6 · complex district set | 56444 | Many levy districts (15 in Benton) | tf_parcel_tax_area + tf_tax_area_district + levy bill breadth |

**Readback result [Benton ref, post-F1 repair, 2026-06-08]:**  
All six parcels resolve across all expected surfaces. Two parcels (321209, 87621) have zero land/geom — truth-verified absent, not a defect.  
Evidence: `docs/sync/seals/benton-current-year-production-readback-results.md`

---

## 13. Required Seal Gates

Gates that must pass before any lane is declared SEALED. The automated version is `tools/sync/seal-check-runner.sql`. These are the manual equivalents.

**Universal (every lane):**
- [ ] Source denominator confirmed (qualified universe, not "all rows")
- [ ] Active supplement rule proven per domain (`MAX(sup_num)` per grain/year)
- [ ] Truth row count = distinct natural keys (1.0000× duplication invariant)
- [ ] Canonical row count ≤ truth row count
- [ ] Unresolved gap (truth > canonical) diagnosed by class/reason — not assumed
- [ ] Pipeline is idempotent: re-run produces same result, no duplicates
- [ ] Advancement cursor present: drain continues from last batch (no infinite re-pull)
- [ ] Evidence artifact created in `evidence/[date]-[lane]-seal.md`

**Revenue lanes (additional):**
- [ ] Line ↔ rollup integrity: `SUM(BillCount)` = line count, exact
- [ ] District/agency backing: 0 NULL foreign keys in line table
- [ ] Rate/levy backing: 0 NULL rates (levy lane only)
- [ ] Due / paid / balance identity: `balance = due − paid` holds line ↔ rollup
- [ ] Net-paid attestation: `bill.amount_paid` ≡ `SUM(coll_transaction.base_amount_pd)` proven at corpus scale

**Automation triad check (every session start):**
- [ ] `node tools/sync/tf-sync-doctor.mjs` = PASS or WARN (not FAIL)

---

## 14. County-Specific Override Points

These MUST be confirmed per county before applying this pack. Do NOT assume the Benton reference values apply.

| Override point | How to determine | Benton reference value |
|----------------|-----------------|------------------------|
| PACS database name | appsettings.{County}.local.json | `pacs_oltp` |
| Certified operational year | DOR certification calendar + county confirmation | `2025` |
| Working year | Current calendar year or county IT confirmation | `2026` |
| Real-property type code | `SELECT DISTINCT prop_type_cd FROM dbo.property_val` | `'R'` |
| Mobile home handling | County assessment policy (land=0 MH?) | MH excluded from R spine; no land segment |
| Sales qualification policy (critical) | `tf_doctrine_ratio_policy` table; operator sign-off | See below |
| ArcGIS geometry endpoint | County GIS admin | ArcGIS REST; `Parcels` layer |
| Improvement attribute dictionary | `SELECT DISTINCT attr_val_cd FROM dbo.imprv_attr_val` | 193 codes (county-specific) |
| Exemption type codes | `SELECT DISTINCT exmpt_type_cd FROM dbo.exmpt` | 6 types (county-specific) |
| TCA count | `SELECT COUNT(*) FROM dbo.tax_area` | 109 |
| District count | `SELECT COUNT(*) FROM dbo.entity` | 37 |

### Sales Qualification Policy Override (most county-specific)

This is the field most likely to differ between Harris counties. Read carefully.

Harris PACS has two ratio-study columns on the sale record:
- `sl_ratio_type_cd` — DOR (Department of Revenue) ratio study qualification  
- `sl_county_ratio_cd` — county internal validation / ratio study qualification

These measure different things. Confirm with the county assessor which column represents their qualified-sale population and which codes mean "valid sale."

**[Benton reference doctrine — year-aware]:**
- Pre-2017: `sl_ratio_type_cd = '00'` or `sl_ratio_type_cd = '0'` ≈ valid by county internal study
- Post-2017: `sl_county_ratio_cd = '100'` ≈ valid (county adopted its own ratio study internally ~2018)
- Current implementation uses `sl_county_ratio_cd = '100'` (see `tf_doctrine_ratio_policy`)
- Doctrine stored in: `tf_doctrine_sales`, `tf_doctrine_ratio_policy` tables with `effective_start_year`

A new county must confirm their qualification column and code values with the assessor, then seed their own `tf_doctrine_ratio_policy` rows with `evidence_source` and `confidence` populated. Do not copy Benton's codes blindly.

---

## 15. Anti-Patterns (from Benton — do not repeat)

| Anti-pattern | Symptom | Root cause | Fix |
|-------------|---------|-----------|-----|
| Blind `sup_num=0` in promoter | Duplicates + stale rows; sales miss active supplements | Assumed supplement zero = current | `MAX(sup_num)` per grain/year; prove per domain |
| Truth promoter clears by LoadBatchId | Re-drains create duplicates | Idempotency scoped to batch, not natural key | Clear by NATURAL KEY of the batch's rows |
| `NOT IN (subquery)` at large scale | Query grinds Postgres for minutes | O(n×m) cross-product | Use NOT EXISTS or set-difference via temp table |
| Blind-join `tf_parcel` | Returns debris rows for old identity generations | tf_parcel has historical generations (F2) | Always resolve through active source_xref |
| `sale_id=0` treated as null/error | Loss of implicit sale events | Not knowing PACS doctrine | sale_id=0 is valid per Harris support |
| Canonical re-key not done after spine rebuild | F1-class identity fork: land/improvement/geometry not joinable to same parcel | Canonical tables built against old spine TfParcelIds | Set-based re-key canonical FK from xref truth |
| `-F '|'` passed as shell arg to psql via Node.js | Node.js execFile fails; psql works from bash | Windows CreateProcess arg quoting with pipe char | Remove `-F '|'` — it's the default in unaligned mode |
| `prop_inactive_dt = 1980-01-01` treated as real date | CONVERSION_LEGACY fires for 100% of rows | ProVal-era sentinel from 2017 conversion | Demote CONVERSION_LEGACY to escape-hatch precedence |
| `pacs_oltp` DB name assumed | Silent timeout / connection failure | County uses a different PACS database name | Confirm from `appsettings.{County}.local.json` |

---

## 16. Pack Changelog

| Date | Version | Change |
|------|---------|--------|
| 2026-06-08 | 1.0 | Initial. All 11 lanes from Benton sealed substrate. |

---

_Evidence lineage: `docs/sync/seals/benton-lane-status.md` · `docs/sync/seals/benton-current-year-spine-seal-packet.md` · `evidence/` artifacts_  
_Automation: `node tools/sync/tf-sync-doctor.mjs` — expected Benton OVERALL: WARN_
