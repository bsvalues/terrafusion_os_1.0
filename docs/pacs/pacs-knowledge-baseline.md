# PACS Knowledge Baseline — what I learned by reading the operator's source pile

**Status:** working knowledge document. NOT a slice. NOT a policy. NOT a
spec. This is what we now actually know about the Harris PACS database
from reading the operator's reference materials at `E:\PACS\` — the
materials we should have read before writing a single line of Sync code.

**Honest grade on prior expertise:** the BENTON-SYNC-* track was scaffolding
around a database whose semantics nobody on our side had read. This doc
exists to prevent that mistake from compounding.

**Source material consulted:**

- `E:\PACS\PACS\settings.xml` — Harris/CamaCloud Sync Service config (the
  production sync from PACS → CamaCloud).
- `E:\PACS\Files of SQL\Files of SQL\ownership.sql` — the operator's
  ownership-resolution query.
- `E:\PACS\Files of SQL\Files of SQL\appraise_hoods.sql` — the operator's
  per-neighborhood appraisal-analysis query.
- `E:\PACS\Files of SQL\Files of SQL\res_condensed.sql` — the operator's
  residential-condensed analytical query.
- `E:\PACS\Files of SQL\Files of SQL\Real_Prop_Monitor.txt` — the actual
  WSDOR DOR Assessment Roll for Real Property stored procedure
  (`MonitorDORAssessmentRollReal`).
- `E:\PACS\Files of SQL\Files of SQL\Personal_Prop_Monitor.txt` — the
  WSDOR DOR Assessment Roll for Personal Property stored procedure
  (`MonitorDORAssessmentRollPersonal`).
- `E:\PACS\Files of SQL\Files of SQL\land and ag schedules.txt` — the
  operator's land/ag schedule lookup query.
- `E:\PACS\Files of SQL\Files of SQL\schemas\` — schema catalogs (base
  table list, views list, procedure list, foreign keys).

## 1. PACS scale — what we're actually dealing with

```text
Base tables       : 2,154
Views             : 1,719
Stored procedures : 2,126
Foreign keys      : 1,332
```

The C48 catalog work counted "2229 tables" — close enough on tables.
We never enumerated the 2,126 stored procedures or 1,719 views. Most of
the operator's working knowledge lives in those procedures.

## 2. The supplement-aware join idiom (this is THE pattern)

Every appraisal-year-aware row in PACS carries `sup_num` (supplement
number). Each parcel-year can have multiple supplements as the
appraisal record evolves. To get "the current row" for a parcel-year,
every operator query joins through `prop_supp_assoc`:

```sql
INNER JOIN prop_supp_assoc psa WITH (nolock) ON
    pv.prop_id      = psa.prop_id
AND pv.prop_val_yr  = psa.owner_tax_yr
AND pv.sup_num      = psa.sup_num
```

This is non-negotiable. **Any seeder or query that ignores sup_num is
silently picking arbitrary rows.** Our `PacsDataSeeder.SeedParcelsAsync`
doing `SELECT * FROM property ORDER BY prop_id` skips this entirely.

## 3. The active-parcel filter (real, operator-confirmed)

There is no `is_active` flag. Active-parcel is a SQL predicate. There
are TWO authoritative versions:

### CamaCloud Sync Service version (settings.xml)

```sql
WHERE p.prop_type_cd in ('R', 'MH')
  AND (pv.prop_inactive_dt IS NULL OR udi_parent = 'T')
  AND udi_parent_prop_id IS NULL
```

### WSDOR DOR Assessment Roll version (`MonitorDORAssessmentRollReal`)

```sql
WHERE pv.prop_val_yr = @appr
  AND pv.prop_inactive_dt IS NULL
  AND p.prop_type_cd in ('R', 'MH')
  AND ISNULL(pst.state_assessed_utility, 0) <> 1
  AND ISNULL(pst.local_assessed_utility, 0) <> 1
```

The WSDOR version is stricter (excludes state/local-assessed utilities
via `property_sub_type`). The CamaCloud version preserves UDI parents.
Different rolls have different filters. **There is no single "active
parcel" rule** — it depends on which roll you're producing.

For Personal Property (the `P` type, ~24k rows):

```sql
WHERE pv.prop_val_yr = @appr
  AND pv.prop_inactive_dt IS NULL
  AND p.prop_type_cd = 'P'
  AND ISNULL(pst.state_assessed_utility, 0) <> 1
  AND ISNULL(pst.local_assessed_utility, 0) <> 1
```

Same shape, different `prop_type_cd`. Personal property is a separate
WSDOR roll, not mixed with Real.

### What this means for our TF DB

Our `Properties` table has 128,788 Benton rows. The operator's "89,247
active parcels" intuition is the WSDOR Real roll only. The TF DB total
includes:

- Real (R) + Mobile Home (MH) — meant to be ~89k–96k after inactive
  exclusion
- Personal Property (P) — ~24k, a separate roll
- Inactive / utility-assessed rows that the WSDOR filter excludes —
  the difference between 96,716 (R+MH in TF DB) and the assessor's
  ~89k Real roll

**Honest fix for our Properties table**: re-load with one of the two
filters above explicitly applied (CamaCloud-grade or WSDOR-grade) and
carry both filter outputs as separate tables or views, not silently
mix them.

## 4. Sale qualification — the operator's actual rule

### What we built

The C8-A transform qualified sales by `(wac_cd, sl_ratio_type_cd)`
both being workbook-mapped.

### What the operator actually uses

Per `appraise_hoods.sql` and `res_condensed.sql`:

```sql
WHERE s.sl_county_ratio_cd IN ('01', '02')
  AND s.sl_price > 100
  AND YEAR(s.sl_dt) = CAST(@TAXYEAR AS INT) - 1
```

**`sl_county_ratio_cd` IN ('01', '02')** is the qualification axis. Codes
`01` and `02` are the operator-assigned arms-length codes; everything
else is excluded. `wac_cd` (state REET reason) is documentary metadata,
not the qualification gate. `sl_ratio_type_cd` (sale ratio type
classification) is a categorization, not the gate.

The C8-A → C36 → C37 → BENTON-SYNC-7-A/B/C family was qualifying
against the wrong column. Every "Inconclusive" verdict in our coverage
report could be "Qualified" or "Excluded" if we'd used
`sl_county_ratio_cd`.

Plus the temporal filter: ratio studies use **prior-year sales only**
(`YEAR(sl_dt) = TAXYEAR - 1`). Multi-year ratio pools are computed
explicitly as their own stratifications.

## 5. The sale → property relationship

PACS sales are NOT directly attached to a property. The relationship is
through a junction:

```text
sale.chg_of_owner_id
  ↓ (via chg_of_owner_prop_assoc — junction table)
chg_of_owner_prop_assoc.chg_of_owner_id, .prop_id
  ↓
property.prop_id
```

A single sale (`chg_of_owner` event) can be associated with multiple
properties (multi-parcel deeds) and vice versa. The junction table
`chg_of_owner_prop_assoc` is where the operator-confirmed parcel
linkage lives.

**Foreign keys (declared in PACS):**

- `chg_of_owner_prop_assoc.chg_of_owner_id → chg_of_owner.chg_of_owner_id`
- `chg_of_owner_prop_assoc.prop_id → property.prop_id`
- `sale.sl_ratio_type_cd → sale_ratio_type.sl_ratio_type_cd` (lookup)
- `sale.sl_type_cd → sale_type.sl_type_cd` (lookup)
- `sale.sl_financing_cd → sl_financing.sl_financing_cd` (lookup)
- `sale.sl_adj_cd → sale_adjustment.sl_adj_cd` (lookup)
- `sale.sales_exclude_calc_cd → sales_exclude_calc.sales_exclude_calc_cd` (lookup)
- `chg_of_owner.deed_type_cd → deed_type.deed_type_cd` (lookup)

`sale.chg_of_owner_id` is NOT declared as an FK to `chg_of_owner` (or
the FK is missing from the catalog file). The operator queries treat
the relationship as implicit.

### Grantor / Grantee resolution

Sales can have multiple sellers and buyers. PACS provides views to
identify the primary parties:

```sql
chg_of_owner_first_seller_vw  -- (chg_of_owner_id, prop_id, seller_id)
chg_of_owner_first_buyer_vw   -- (chg_of_owner_id, prop_id, buyer_id)
```

Then join through `owner.owner_id` and `account.acct_id` for
`account.file_as_name`.

## 6. Owner / address / situs — three separate tables

This is a frequent confusion source. PACS separates:

| Concept | Table | Key | Carries |
|---|---|---|---|
| The owner relationship for a parcel-year-supplement | `owner` (o) | `(prop_id, owner_tax_yr, sup_num, owner_id)` | `pct_ownership` |
| The legal/file-as name | `account` (ac) | `acct_id` | `file_as_name` |
| The mailing address | `address` (ad) | `acct_id` (with `primary_addr` flag) | `addr_line1..3, addr_city, addr_state, addr_zip` |
| The physical property location | `situs` (s) | `prop_id` (with `primary_situs` flag) | `situs_display, situs_num, situs_street, situs_city, situs_zip` |

`owner.owner_id` joins to `account.acct_id`. So:
`property → owner.owner_id → account.acct_id → address.acct_id`.

**The fact that our `Properties.OwnerName` is uniformly NULL on every
Real parcel suggests our seeder never landed the owner-account-name
chain.** Three joins missed.

## 7. Washington-specific value tables (`wash_prop_owner_*`)

PACS is multi-state but Washington adds its own per-prop+owner+year+sup
value tables for WSDOR reporting:

- `wash_prop_owner_val` (wpov) — the actual classified/non-classified
  appraised and taxable values, broken into:
  - `imprv_hstd_val`, `imprv_non_hstd_val` (improvement homestead /
    non-homestead)
  - `land_hstd_val`, `land_non_hstd_val`
  - `timber_market`, `timber_hs_market`, `ag_market`, `ag_hs_market`
  - `new_val_hs`, `new_val_nhs` (new construction)
  - `appraised_classified`, `appraised_non_classified`
  - `taxable_classified`, `taxable_non_classified`
  - `ag_use_val`, `ag_hs_use_val`, `timber_use_val`, `timber_hs_use_val`
    (current-use values)
- `wash_prop_owner_tax_area_assoc` (wta) — links a prop+owner to a
  tax area
- `wash_prop_owner_exemption` (wpoe) — per-owner exemption rows;
  carries `exempt_qualify_cd`
- `wash_prop_owner_levy_assoc` — per-owner levy associations

Join shape (4 keys):
```sql
wpov.prop_id      = pv.prop_id
AND wpov.year     = pv.prop_val_yr
AND wpov.sup_num  = pv.sup_num
AND wpov.owner_id = o.owner_id
```

`property_val` itself carries the broad market totals
(`market`, `imprv_val`, `land_hstd_val + land_non_hstd_val + timber_market + ag_market`)
but the WSDOR audit-grade values come from `wash_prop_owner_val`.

## 8. Other tables we now know about

| Table | Purpose | Key facts |
|---|---|---|
| `property` (p) | root parcel record | `prop_id` PK, `prop_type_cd` (R/MH/P), `geo_id`, `dba_name` |
| `property_val` (pv) | versioned per-year valuation | keyed `(prop_id, prop_val_yr, sup_num)`; carries `prop_inactive_dt`, `hood_cd`, `property_use_cd`, `secondary_use_cd`, `legal_acreage`, `legal_desc`, `market`, `imprv_val`, all the `*_val` columns; and the UDI machinery (`udi_parent`, `udi_parent_prop_id`) |
| `prop_supp_assoc` (psa) | supplement bridge by year | the join table that says "for this prop+year, the current sup_num is N" |
| `pacs_system` (ps) | system-wide config | `appr_yr` is the current appraisal year |
| `property_profile` (pp) | analysis profile per parcel-year | `imprv_det_quality_cd`, `land_appr_method`, `land_unit_price`, `main_land_total_adj`, `main_land_unit_price`, `year_built`, `living_area`, `secondary_use_cd` |
| `property_sub_type` (pst) | sub-type classification | `state_assessed_utility`, `local_assessed_utility` flags |
| `property_legal_description` | legal descriptions | one or more per parcel |
| `imprv` (i) | top-level improvements | `imprv_id`, `imprv_desc`, `imprv_val_source` ('F'=Flat), `economic_pct`, `functional_pct`, `physical_pct`, `sale_id` |
| `imprv_detail` | detailed improvement segments | child of `imprv` |
| `imprv_attr` | improvement attributes | child of `imprv` |
| `land_detail` (ld) | per-parcel land segments | `land_seg_id`, `land_type_cd`, `land_class_code`, `land_soil_code`, `mkt_val_source`, `land_adj_factor`, `num_lots`, `ls_mkt_id` (→ market schedule), `ls_ag_id` (→ ag schedule), `sale_id` |
| `land_sched` (ls) | land schedules | keyed `(ls_id, ls_year)`, carries `ls_code`; market and ag schedules co-exist |
| `chg_of_owner` (co) | the change-of-owner event | `chg_of_owner_id` PK, `deed_type_cd` |
| `chg_of_owner_prop_assoc` (copa) | sale ↔ property junction | `(chg_of_owner_id, prop_id)` |
| `sale` (s) | the actual sale record | `chg_of_owner_id` (→ chg_of_owner), `sl_dt`, `sl_price`, `sl_county_ratio_cd`, `sl_ratio_type_cd`, `sl_type_cd`, `sl_financing_cd`, `sl_adj_cd`, `sales_exclude_calc_cd`, plus the C25/C26-shaped sale columns we already cataloged |
| `pers_prop_seg` (pps) | personal property segments | child of property when prop_type_cd='P'; `sale_id=0` filters non-sale-snapshot rows |
| `tax_area` (ta) | tax area dimension | `tax_area_id`, `tax_area_number` |
| `matrix_detail` (md) | analysis matrices | `matrix_id` 914 = residential 100, `matrix_id` 915 = commercial 200 |
| `ccProperty` (ccp) | CamaCloud bridge table | `mobile_assignment_group_id` for field-appraiser routing |

## 9. Lookup / code tables (the things our workbook should have mapped against)

PACS has dedicated lookup tables for every coded column. These are the
canonical sources for code values:

- `sale_ratio_type` (PK `sl_ratio_type_cd`)
- `sale_type` (PK `sl_type_cd`)
- `sl_financing` (PK `sl_financing_cd`)
- `sale_adjustment` (PK `sl_adj_cd`)
- `sales_exclude_calc` (PK `sales_exclude_calc_cd`)
- `deed_type` (PK `deed_type_cd`)
- `sale_county_ratio` (or similar — the table backing `sl_county_ratio_cd`; need to verify name)

The mapping workbook concept (BENTON-SYNC family's C-tracks) was meant
to author `(sourceValue → canonicalValue)` rows for these lookups. But:

1. PACS already has the canonical lookup tables. We could ingest them
   directly instead of asking the operator to author from scratch.
2. The operator's qualification rule (`sl_county_ratio_cd IN ('01','02')`)
   doesn't need canonicalization at all — it's a literal predicate on
   the source code.

The C8-A workbook + C36 canonical landing was mostly busywork. The
operator's existing 30-second SQL would have done the same job.

## 10. Spatial / GIS

Outside this doc's scope today. Briefly: PACS spatial data lives in
shapefiles (`Parcel.shp`, `Road.shp`, `Benton_Parcel_2.shp`) with metadata
XMLs. There's a separate `pacs_spatial` SQL Server database (we have
the .bak in `E:\PACS\`). The CamaCloud sync handles "mobile assignment
groups" (`ccp.mobile_assignment_group_id`) for field-appraiser routing.

## 11. What the operator's working SQL implies about our roadmap

Reading the operator's actual queries reveals their daily work:

1. **`appraise_hoods.sql`** — neighborhood-level analytics joining
   property + valuation + profile + matrix factors + land flags +
   improvement flags + the most-recent qualified sale. Output: per-
   parcel ratio + grantor/grantee + flags. This is the assessor's
   spreadsheet view of a neighborhood.
2. **`res_condensed.sql`** — same shape, residential-only, condensed.
3. **`ownership.sql`** — multi-owner resolution (`pct_ownership <> 100`
   means partial ownership; lists all partial owners).
4. **`Real_Prop_Monitor.txt`** / **`Personal_Prop_Monitor.txt`** —
   WSDOR audit roll generation.
5. **`land and ag schedules.txt`** — finds parcels with no `land_soil_code`
   that should have one (data-quality monitor).

These are concrete operator workflows. Each one is a candidate for a
TerraFusion surface — but only after we ingest the right tables in the
right shape.

## 12. The plaintext password problem

`E:\PACS\PACS\settings.xml` has the production SA password in plaintext:

```xml
<PACSConnectionString>Data Source=JCHARRISPACS;Initial Catalog=pacs_oltp;User ID=chpacssa;Password=benton-28-2600;</PACSConnectionString>
```

That file lives on the operator's workstation and is not committed.
Operationally: rotate the credential and treat the file as secret.
This is operator hygiene, not a TerraFusion concern, but worth flagging.

## 13. What I still don't know (honest)

After this pass I'm probably at 25–30% PACS expertise, not 85%. To get
to 85% I'd need to:

1. **Read the 2,126 stored procedures** — at least the families:
   `Monitor*`, `_monitor_*`, `_CertMail*`, `dor_*`, `sales_ratio_*`,
   `appraise_*`, `LevyCalc*`. The procedures encode 20+ years of
   operator workflow.
2. **Read the full `property_val` schema** — I know about a dozen
   columns; there are dozens more I haven't enumerated.
3. **Read `property_profile` schema** — similar.
4. **Enumerate the WAC code table** (`sale_ratio_type` or wherever WAC
   codes actually live) and confirm what `sl_county_ratio_cd` codes
   01, 02 actually mean in the lookup.
5. **Read the Ascend / ProVal `.mdb` legacy materials** — the C50-CONV
   "era boundary" was supposedly mapping these, but nobody read them.
6. **Restore one of the `.bak` files into a fresh tf-mssql** and
   confirm whether our local `pacs_oltp` is current.
7. **Read the building permit import side** (`BentonCounty_DynLoader`
   files) — third-party but it's part of the operator's daily reality.
8. **Read the levy / billing side** — `PacsDataSeeder.SeedLevyOnlyAsync`
   exists but I haven't traced it.
9. **Read the 1,719 view definitions** — many are pre-shaped queries
   we could just consume.
10. **Read `PACS_Query_Fields_20150323.xlsx`** — the official
    field-by-field reference. Binary file, requires xlsx extraction.
11. **Read `stored procedure SQL.docx`** — the procedure source export.
    Binary file.
12. **Read `PACS Synchronization Service - Installation.docx`** — the
    Harris install manual.
13. **Read the loader logs** end to end (UTF-16 encoded text).
14. **Read CIAPS** materials — Critical Improvement Analysis Process
    Sales.

## 14. Implications for prior TerraFusion work (honest grade)

| Prior work | Grade | What it actually did vs what it should have done |
|---|---|---|
| C48 schema catalog | C+ | Counted tables and FKs but missed stored procs, views, and the supplement-aware join idiom. The "FK-006 inferred-by-name advisories" treated 721 false-positives as discoveries that were already declared in the operator's queries. |
| C49-FK preflight family | B− | The FK preflight machinery is sound; it just preflighted the wrong joins. The dictionary-loader join shape (`property_val.property_use_cd → property_use.property_use_cd`) is real, but the operator's actual qualification join goes through different lookup tables we didn't catalog. |
| C50-CONV era manifest | D | The "Pre2017 / Post2017 era boundary" was speculative without reading the Ascend/ProVal materials that define what changed. The C50-CONV-D era preflight runs every dictionary loader through this gate. We should rebuild this against actual conversion documentation — or delete it as overbuild. |
| C51-PII manifest | C− | The PII manifest concept is sensible (FISMA needs it), but the actual PII surface in PACS is in `account.file_as_name`, `address.addr_line*`, `owner.owner_id`'s social, etc. We never enumerated these. The 33-column PII manifest schema we built was empty because nobody mapped it against the real PII fields. |
| C52-OVR exported FK | B | Sound design. Premature scaling. |
| C53-CONS invariants | B+ | Sound, useful. Worth keeping. |
| C8-A sale qualification transform | F | Targeted `wac_cd` and `sl_ratio_type_cd` instead of `sl_county_ratio_cd`. Wrong column. The whole `CanonicalSaleQualifications` family was qualifying on a documentary metadata field, not the assessor's actual qualification axis. |
| C36 canonical write runner | F (consequential) | Persists C8-A's wrong-column verdicts into a new table. The fact that it never ran in our pilot is fortunate — it would have polluted the canonical landing with garbage. |
| OPS-1 Sync Readiness Console | C | The console reads the four diagnostic surfaces correctly, but those surfaces were measuring the wrong thing. The console honestly reports "GAPS" — but the gap is really "we built the wrong qualification pipeline," not "the data is missing." |
| `PacsDataSeeder` | F | `SELECT * FROM property` with no filter, no `prop_supp_assoc` join, no `prop_inactive_dt` exclusion, no `prop_type_cd` filter, no `wash_prop_owner_val` ingest, no `account.file_as_name` join (which is why `OwnerName` is empty on every R parcel). This is the seeder that produced the 128k rows. |

## 15. What I commit to do before any next slice

1. Read this doc end to end before opening a code editor.
2. Use the supplement-aware join idiom in any future PACS query.
3. Use `sl_county_ratio_cd IN ('01','02')` as the sale-qualification
   axis until the operator says otherwise.
4. Treat `wash_prop_owner_val` as the audit-grade value source for
   any per-owner reporting.
5. Treat `account.file_as_name` (joined via `owner.owner_id =
   account.acct_id`) as the canonical owner-name source.
6. Rebuild the parcel seeder with a real filter (CamaCloud-grade or
   WSDOR-grade) before the OPS-1 console serves another panel.
7. Consume PACS lookup tables (`sale_ratio_type`, etc.) directly
   instead of asking the operator to author canonical values from
   scratch. The operator's qualification rule is a literal predicate,
   not a mapping problem.
8. Question every prior assumption that traces back to the C8-A axis
   choice or the unfiltered seeder.

## 16. Appendix — the operator's working PACS landscape, summarized

```text
                 ┌───────────────────────┐
                 │    Harris PACS 9.0    │   (JCHARRISPACS server)
                 │  (pacs_oltp 100GB)    │
                 │   2,154 base tables   │
                 │   2,126 stored procs  │
                 │   1,719 views         │
                 └───────────┬───────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
   ┌─────────────────┐ ┌────────────┐ ┌──────────────────┐
   │  CamaCloud      │ │  WSDOR     │ │  CIAPS           │
   │  Sync Service   │ │  rolls     │ │  comp/sales      │
   │  (daily push)   │ │  (R / P)   │ │  analysis        │
   │  → cloud API    │ │  procs     │ │  (third-party)   │
   └─────────────────┘ └────────────┘ └──────────────────┘
              │
              ▼
   ┌─────────────────┐
   │  CamaCloud API  │
   │  api.pacs.      │
   │  camacloud.com  │
   │  (mobile        │
   │  appraisal)     │
   └─────────────────┘

   TerraFusion is NOT in this picture yet. The PacsDataSeeder reads
   pacs_oltp directly, applies an unfiltered SELECT, and lands the
   raw rows into TF DB. None of the active-parcel filters, none of
   the WSDOR semantics, none of the operator's working idioms are
   applied. That's the gap.

   Building permit import side (separate, third-party):
   ─────────────────────────────────────────────────────
   BentonCounty_DynLoader.exe  →  pacs_oltp (writes building permits in)

   Legacy migration source (pre-Harris):
   ─────────────────────────────────────
   Asend (tax companion) + ProVal Plus (CAMA)  →  pacs_oltp (one-time)

   File-system ancillary stores in the operator's workstation:
   ────────────────────────────────────────────────────────────
   E:\PACS\xml\xml\           — sync envelopes + shapefile metadata
   E:\PACS\Files of SQL\      — operator's SQL pile + reference exports
   E:\PACS\*.bak              — full database backups (~100GB pacs_oltp,
                                ~96GB BENTONBK, plus spatial + lists)
```

This is the picture I should have drawn on day one. I'm drawing it now.
