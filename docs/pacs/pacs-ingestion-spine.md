# PACS → TerraFusion Ingestion Spine

**Status:** blueprint, not implementation. Companion to
`docs/pacs/pacs-knowledge-baseline.md`. This document defines the
authoritative ingestion architecture — the join graph, table mapping,
truth-layer view set, and migration plan — so any rebuild is
mechanical instead of speculative.

**Binding rule before reading anything else:**

> **There is no PACS property without `(prop_id, prop_val_yr, sup_num)`.**
> If the TF DB doesn't carry all three on every appraisal-year-aware
> row, it does not have PACS data. It has a flattened, lossy snapshot.

This was the operator's diagnosis. It is now the design constraint.

---

## 1. The versioned-state contract

PACS is **not** a relational flat database. It is a **temporal,
supplement-versioned, association-driven** system. Three things follow:

### 1.1 Identity is a triple

```text
(prop_id, prop_val_yr, sup_num)
```

- `prop_id` — the parcel identifier. Stable across years.
- `prop_val_yr` — the appraisal year ("which year's roll").
- `sup_num` — the supplement number ("which version of this
  parcel-year"). Supplements increment as adjustments, corrections,
  and stipulations land.

A single parcel can have N rows for the same year — the active row
is the one selected by `prop_supp_assoc`.

### 1.2 Active is a state, not a flag

There is no `is_active` column. Active is:

```sql
pv.prop_inactive_dt IS NULL
```

This field lives on `property_val` (the versioned state table), NOT
on `property` (the identity shell). Asking `property` whether it's
active is meaningless.

### 1.3 Lifecycle owner: `property_val`

`property_val` is the lifecycle table. It owns:

- Activation state (`prop_inactive_dt`)
- Property use classification (`property_use_cd`, `secondary_use_cd`)
- Neighborhood (`hood_cd`)
- Legal acreage and description (`legal_acreage`, `legal_desc`)
- The aggregate `*_val` columns
- UDI parent/child relationships (`udi_parent`, `udi_parent_prop_id`)

`property` is the identity shell. It owns:

- `prop_id`
- `prop_type_cd` (R / MH / P / U)
- `geo_id` (parcel number)
- `dba_name` (for Personal Property)
- `col_owner_id` (collector's owner pointer — links to `account.acct_id`)

### 1.4 Version selector: `prop_supp_assoc`

`prop_supp_assoc psa` says "for this `(prop_id, owner_tax_yr)`, the
current `sup_num` is N." Every authoritative query routes through it:

```sql
INNER JOIN prop_supp_assoc psa
    ON pv.prop_id      = psa.prop_id
   AND pv.prop_val_yr  = psa.owner_tax_yr
   AND pv.sup_num      = psa.sup_num
```

**Skipping this join silently picks arbitrary supplements.** That is
the bug at the heart of our current `PacsDataSeeder`.

---

## 2. The Gold Query (the only valid parcel selection)

Per the operator's own words, **this is the gold query**:

```sql
SELECT
    psa.prop_id,
    psa.owner_tax_yr AS prop_val_yr,
    psa.sup_num,
    p.prop_type_cd,
    p.geo_id,
    p.dba_name,
    p.col_owner_id,
    pv.prop_inactive_dt,
    pv.property_use_cd,
    pv.secondary_use_cd,
    pv.hood_cd,
    pv.legal_acreage,
    pv.legal_desc,
    pv.market,
    pv.imprv_val,
    pv.land_hstd_val,
    pv.land_non_hstd_val,
    pv.timber_market,
    pv.ag_market,
    pv.udi_parent,
    pv.udi_parent_prop_id
FROM prop_supp_assoc psa  WITH (NOLOCK)
INNER JOIN property p     WITH (NOLOCK) ON p.prop_id = psa.prop_id
INNER JOIN pacs_system ps WITH (NOLOCK) ON ps.appr_yr = psa.owner_tax_yr
INNER JOIN property_val pv WITH (NOLOCK)
    ON pv.prop_id     = psa.prop_id
   AND pv.prop_val_yr = psa.owner_tax_yr
   AND pv.sup_num     = psa.sup_num
WHERE p.prop_type_cd IN ('R','MH')
  AND (pv.prop_inactive_dt IS NULL OR pv.udi_parent = 'T')
  AND pv.udi_parent_prop_id IS NULL;
```

This produces one row per active Real / Mobile-Home parcel for the
current appraisal year. **This is the count that should match the
operator's "~89k active parcels" expectation.**

For Personal Property (separate roll):

```sql
WHERE p.prop_type_cd = 'P'
  AND pv.prop_inactive_dt IS NULL
  -- (utility-assessed exclusions live on property_sub_type for WSDOR)
```

For the strict WSDOR DOR Roll, add the utility exclusion:

```sql
LEFT OUTER JOIN property_sub_type pst WITH (NOLOCK)
    ON pv.sub_type = pst.property_sub_cd
WHERE …
  AND ISNULL(pst.state_assessed_utility, 0) <> 1
  AND ISNULL(pst.local_assessed_utility, 0) <> 1
```

These three filters (CamaCloud-Real, WSDOR-Real, WSDOR-Personal) are
the **only** authoritative active-parcel definitions in PACS. There
are no others.

---

## 3. The join graph (operator-confirmed)

```text
                          property (p)
                         identity shell
                              │
                              │ prop_id
              ┌───────────────┼───────────────────────────┐
              │               │                           │
              ▼               ▼                           ▼
       prop_supp_assoc    col_owner_id ──► account ◄── address
            (psa)                       (legal entity   (mailing
       version selector                  identity)       address)
              │                              ▲
              │ (year + sup)                 │ acct_id
              ▼                              │
        property_val ─── owner ──────────────┘
            (pv)         (per-prop+yr+sup
        lifecycle/        owner relationship
        state owner       with pct_ownership)
              │
              ├─► property_profile (analysis profile)
              ├─► property_sub_type (utility flags)
              ├─► land_detail ─► land_sched (mkt + ag)
              ├─► imprv ─► imprv_detail
              │         └─► imprv_attr
              ├─► wash_prop_owner_val (per-owner audit values)
              ├─► wash_prop_owner_tax_area_assoc ─► tax_area
              ├─► wash_prop_owner_exemption
              └─► wash_prop_owner_levy_assoc

       (sales — separate junction-driven graph)

           property                     chg_of_owner
              │                              │
              │ prop_id                      │ chg_of_owner_id
              ▼                              ▼
              chg_of_owner_prop_assoc (copa)
              junction: (chg_of_owner_id, prop_id)
                              │
                              │ chg_of_owner_id
                              ▼
                            sale (s)
                          (sl_dt, sl_price,
                          sl_county_ratio_cd ←── qualification axis
                          sl_ratio_type_cd, etc.)
                              │
                              │ chg_of_owner_id
                              ▼
        chg_of_owner_first_seller_vw ─► owner ─► account (grantor)
        chg_of_owner_first_buyer_vw  ─► owner ─► account (grantee)
```

### 3.1 Join shapes (binding)

Every TF DB ingest must use these exact join shapes:

| Source → Target | Keys | Notes |
|---|---|---|
| `psa → pv` | `prop_id, owner_tax_yr=prop_val_yr, sup_num` | Version selector. **Always required.** |
| `psa → p` | `prop_id` | Identity shell. |
| `psa → pacs_system` | `owner_tax_yr=appr_yr` | Confirms current year. |
| `p.col_owner_id → account.acct_id` | acct_id | Owner name (`file_as_name`). |
| `account.acct_id → address.acct_id` | acct_id, `primary_addr='Y'` | Mailing address. |
| `pv → owner (o)` | `prop_id, prop_val_yr=owner_tax_yr, sup_num` | Per-version ownership relationship. |
| `o → account` | `o.owner_id = ac.acct_id` | Owner-of-record vs collector's-owner can differ. |
| `pv → situs` | `prop_id, primary_situs='Y'` | Physical location. |
| `pv → wash_prop_owner_val (wpov)` | `prop_id, prop_val_yr=year, sup_num, owner_id` | **4-keyed.** WSDOR audit values. |
| `pv → wash_prop_owner_tax_area_assoc (wta)` | `prop_id, prop_val_yr=year, sup_num, owner_id` | 4-keyed; → `tax_area`. |
| `pv → property_profile (pp)` | `prop_id, prop_val_yr, sup_num` | Analysis profile. |
| `pv → property_sub_type (pst)` | `pv.sub_type = pst.property_sub_cd` | Utility flags. |
| `pv → imprv (i)` | `prop_id, prop_val_yr, sup_num` | + `i.sale_id = 0` to exclude sale snapshots. |
| `pv → land_detail (ld)` | `prop_id, prop_val_yr, sup_num` | + `ld.sale_id = 0` to exclude sale snapshots. |
| `ld → land_sched (ls)` | `ld.ls_mkt_id → ls.ls_id` (and `ld.ls_ag_id` for ag) | Market + ag schedules co-exist. |
| `p → copa` | `prop_id` | Sale junction (1:N — a property has 0..N sales). |
| `copa → sale` | `chg_of_owner_id` | The sale event. |
| `copa → chg_of_owner` | `chg_of_owner_id` | Deed-type, recording date metadata. |

### 3.2 Critical sentinels

- `i.sale_id = 0 OR i.sale_id IS NULL` — exclude improvement
  snapshots that were created as sale-time records.
- `ld.sale_id = 0 OR ld.sale_id IS NULL` — same for land segments.
- `address.primary_addr = 'Y'` — only the primary mailing address.
- `situs.primary_situs = 'Y'` — only the primary physical situs.
- `pst.state_assessed_utility <> 1 AND pst.local_assessed_utility <> 1`
  — WSDOR utility exclusion.
- `pv.prop_inactive_dt IS NULL` — active filter (with UDI-parent
  exception in the CamaCloud variant).
- `pv.udi_parent_prop_id IS NULL` — exclude UDI children (the parent
  carries the assessment for an undivided-interest property).

---

## 4. Sale qualification — `sl_county_ratio_cd` is the axis

Per `appraise_hoods.sql` and `res_condensed.sql`:

```sql
WHERE s.sl_county_ratio_cd IN ('01','02')
  AND s.sl_price > 100
  AND YEAR(s.sl_dt) = CAST(@TAXYEAR AS INT) - 1
```

- **Axis:** `sl_county_ratio_cd` IN ('01','02'). Codes 01 and 02 are
  the operator-assigned arms-length codes; everything else is
  excluded. WAC code (`wac_cd`) is documentary REET metadata, NOT the
  qualification gate.
- **Sanity bound:** `sl_price > 100` (excludes zero/symbolic prices).
- **Temporal:** prior-year only for ratio-study qualification.
  Multi-year pools are operator-explicit stratifications, not
  default behavior.

**Foreign-key fact:** `sale.sl_ratio_type_cd → sale_ratio_type` is a
declared FK. `sale.sl_county_ratio_cd → ?` does not appear in the
declared-FK catalog; the lookup table for county ratio codes needs
explicit identification (see §11 Open Questions).

---

## 5. The truth layer — TF DB read models

The ingest layer mirrors PACS **faithfully**: versioned, junction-
driven, multi-key. The **truth layer** is a set of TF-DB views (or
read-only entities) that materialize the operator's working idioms.

Two-tier design:

```text
   Tier 1: ingest layer  (mirror)
   ─────────────────────────────────
   pacs_property              ← p
   pacs_prop_supp_assoc       ← psa
   pacs_property_val          ← pv
   pacs_property_profile      ← pp
   pacs_property_sub_type     ← pst
   pacs_account               ← account
   pacs_address               ← address
   pacs_owner                 ← owner
   pacs_situs                 ← situs
   pacs_imprv                 ← imprv
   pacs_imprv_detail          ← imprv_detail
   pacs_imprv_attr            ← imprv_attr
   pacs_land_detail           ← land_detail
   pacs_land_sched            ← land_sched
   pacs_chg_of_owner          ← chg_of_owner
   pacs_chg_of_owner_prop_assoc ← copa
   pacs_sale                  ← sale
   pacs_wash_prop_owner_val   ← wpov
   pacs_wash_prop_owner_tax_area_assoc ← wta
   pacs_wash_prop_owner_exemption ← wpoe
   pacs_tax_area              ← tax_area
   pacs_pacs_system           ← pacs_system   (single row, current year)
   (lookup mirrors)
   pacs_sale_ratio_type, pacs_sale_type, pacs_sl_financing,
   pacs_deed_type, pacs_property_use, pacs_sale_county_ratio,
   pacs_sales_exclude_calc, pacs_sale_adjustment, …

   Tier 2: truth layer  (operator-facing read models)
   ─────────────────────────────────────────────────────
   vw_active_real_parcels         (CamaCloud filter R+MH)
   vw_wsdor_real_roll             (WSDOR-grade R+MH, no utilities)
   vw_wsdor_personal_roll         (WSDOR-grade P, no utilities)
   vw_parcel_owner                (parcel + owner.file_as_name + pct)
   vw_parcel_situs_address        (parcel + primary situs + primary mailing)
   vw_parcel_current_value        (parcel + wpov classified/non-classified values)
   vw_parcel_profile              (parcel + property_profile attributes)
   vw_qualified_sales             (sl_county_ratio_cd IN ('01','02'),
                                    sl_price > 100, prior year)
   vw_parcel_qualified_sale_ratio (vw_qualified_sales joined to
                                    vw_parcel_current_value for ratios)
   vw_parcel_land_segments        (per-parcel land detail with
                                    market + ag schedules joined)
   vw_parcel_improvements         (per-parcel imprv + imprv_detail)
```

### 5.1 The two tiers have different jobs

- **Tier 1 (`pacs_*` ingest tables)**: faithful mirrors. Carry
  `prop_id, prop_val_yr, sup_num` and every other PACS column we
  need. No filters applied. No values flattened. Re-loadable.
- **Tier 2 (`vw_*` truth views)**: apply the gold filter, denormalize
  the operator's joins, expose human-readable column names. The API
  reads these. Not the ingest tables.

### 5.2 Why two tiers and not one

Single tier conflates "preserved truth" with "render-ready convenience"
— that's exactly what the current `Properties` table did when it
flattened `property` + `property_val` + `property_profile` without
preserving sup_num. The two-tier separation lets the truth layer
evolve (add columns, refine filters) without re-ingesting.

### 5.3 What the API consumes

The frontend reads ONLY tier-2 views. Backend services that need
tier-1 access (e.g., for re-running a comp pool with different
filters) get explicit access through dedicated query services, not
through ad-hoc joins.

---

## 6. The ingestion phases (replacement for `PacsDataSeeder`)

Eight phases. Each phase has one well-defined contract. Each phase
has a row-count assertion. If a phase's count doesn't match the
expected range, the next phase doesn't run.

### Phase 0: Year + supplement anchor

```sql
SELECT appr_yr FROM pacs_system;
```

→ `pacs_pacs_system.appr_yr`. Single value. All subsequent phases
filter to this year.

### Phase 1: Identity layer

```sql
-- pacs_property
SELECT prop_id, prop_type_cd, geo_id, dba_name, col_owner_id, …
FROM property;

-- pacs_account
SELECT acct_id, file_as_name, …
FROM account;

-- pacs_address
SELECT acct_id, addr_line1, addr_line2, addr_line3,
       addr_city, addr_state, addr_zip, primary_addr
FROM address
WHERE primary_addr = 'Y';
```

**Assertions:**
- `pacs_property` row count > 100,000 (Benton scale).
- Every `pacs_property.col_owner_id` resolves to a `pacs_account.acct_id`.

### Phase 2: Version selector

```sql
-- pacs_prop_supp_assoc
SELECT prop_id, owner_tax_yr, sup_num
FROM prop_supp_assoc
WHERE owner_tax_yr = (SELECT appr_yr FROM pacs_system);
```

**Assertion:** one row per `(prop_id, current_year)` modulo
parcels that have no record for the current year (very rare).

### Phase 3: Versioned state

```sql
-- pacs_property_val
SELECT pv.*
FROM property_val pv
JOIN prop_supp_assoc psa
    ON pv.prop_id = psa.prop_id
   AND pv.prop_val_yr = psa.owner_tax_yr
   AND pv.sup_num = psa.sup_num
WHERE psa.owner_tax_yr = (SELECT appr_yr FROM pacs_system);

-- pacs_property_profile (same join shape)
-- pacs_property_sub_type (lookup, no version)
```

**Assertion:** `pacs_property_val` row count == `pacs_prop_supp_assoc`
row count. Exactly one current-version row per parcel.

### Phase 4: Owner & address resolution

```sql
-- pacs_owner (per prop+year+sup)
SELECT o.prop_id, o.owner_tax_yr, o.sup_num,
       o.owner_id, o.pct_ownership, …
FROM owner o
JOIN prop_supp_assoc psa
    ON o.prop_id = psa.prop_id
   AND o.owner_tax_yr = psa.owner_tax_yr
   AND o.sup_num = psa.sup_num
WHERE psa.owner_tax_yr = (SELECT appr_yr FROM pacs_system);
```

**Assertion:** every `pacs_owner.owner_id` resolves to a
`pacs_account.acct_id`. Truth view `vw_parcel_owner` MUST emit
`OwnerName != NULL` on every row.

### Phase 5: WSDOR audit values

```sql
-- pacs_wash_prop_owner_val (4-keyed)
SELECT wpov.*
FROM wash_prop_owner_val wpov
JOIN prop_supp_assoc psa
    ON wpov.prop_id = psa.prop_id
   AND wpov.year = psa.owner_tax_yr
   AND wpov.sup_num = psa.sup_num
WHERE psa.owner_tax_yr = (SELECT appr_yr FROM pacs_system);

-- pacs_wash_prop_owner_tax_area_assoc (same shape)
-- pacs_wash_prop_owner_exemption (same shape)
-- pacs_tax_area (lookup)
```

**Assertion:** every active parcel has at least one
`wash_prop_owner_val` row.

### Phase 6: Improvements & land

```sql
-- pacs_imprv (with sale_id = 0 filter for current state)
-- pacs_imprv_detail
-- pacs_imprv_attr
-- pacs_land_detail (with sale_id = 0 filter)
-- pacs_land_sched (lookup, year-keyed)
```

**Assertion:** improvement and land row counts match a per-county
expected range. Sale snapshots excluded.

### Phase 7: Sales graph

```sql
-- pacs_chg_of_owner
SELECT * FROM chg_of_owner;

-- pacs_chg_of_owner_prop_assoc (junction)
SELECT * FROM chg_of_owner_prop_assoc;

-- pacs_sale (full table — sales are not year-keyed, they're
-- date-keyed; ingest all and filter at query time)
SELECT s.*
FROM sale s
WHERE s.sl_dt IS NOT NULL;  -- or no filter; capture everything
```

**Assertion:** every `pacs_sale.chg_of_owner_id` resolves to a
`pacs_chg_of_owner.chg_of_owner_id`. Every
`pacs_chg_of_owner_prop_assoc.prop_id` resolves to a
`pacs_property.prop_id`.

### Phase 8: Lookup tables (mirror, don't author)

```sql
SELECT * FROM sale_ratio_type;       -- → pacs_sale_ratio_type
SELECT * FROM sale_type;              -- → pacs_sale_type
SELECT * FROM sl_financing;           -- → pacs_sl_financing
SELECT * FROM sale_adjustment;        -- → pacs_sale_adjustment
SELECT * FROM sales_exclude_calc;     -- → pacs_sales_exclude_calc
SELECT * FROM deed_type;              -- → pacs_deed_type
SELECT * FROM property_use;           -- → pacs_property_use
SELECT * FROM property_sub_type;      -- → pacs_property_sub_type
-- The county-ratio lookup table needs identification (§11).
```

**Principle:** the operator does not author canonical values for
codes PACS already canonicalizes. Mirror the lookup tables verbatim.
Mapping work is for code values that are operator-judgment-only,
which in our current scope is **none** — `sl_county_ratio_cd` IN
('01','02') is a literal predicate, not a mapping.

---

## 7. Truth-view definitions (the SQL bodies)

### 7.1 `vw_active_real_parcels` — the CamaCloud-grade roll

```sql
CREATE VIEW vw_active_real_parcels AS
SELECT
    psa.prop_id,
    psa.owner_tax_yr   AS prop_val_yr,
    psa.sup_num,
    p.prop_type_cd,
    p.geo_id,
    p.col_owner_id,
    pv.property_use_cd,
    pv.secondary_use_cd,
    pv.hood_cd,
    pv.legal_acreage,
    pv.legal_desc,
    pv.market,
    pv.imprv_val,
    pv.land_hstd_val + pv.land_non_hstd_val
        + pv.timber_market + pv.ag_market AS land_total_val,
    pv.udi_parent
FROM pacs_prop_supp_assoc psa
JOIN pacs_property p
  ON p.prop_id = psa.prop_id
JOIN pacs_property_val pv
  ON pv.prop_id     = psa.prop_id
 AND pv.prop_val_yr = psa.owner_tax_yr
 AND pv.sup_num     = psa.sup_num
WHERE p.prop_type_cd IN ('R','MH')
  AND (pv.prop_inactive_dt IS NULL OR pv.udi_parent = 'T')
  AND pv.udi_parent_prop_id IS NULL;
```

### 7.2 `vw_wsdor_real_roll`

Same as 7.1 plus the utility exclusion:

```sql
LEFT JOIN pacs_property_sub_type pst
  ON pv.sub_type = pst.property_sub_cd
WHERE …
  AND COALESCE(pst.state_assessed_utility, 0) <> 1
  AND COALESCE(pst.local_assessed_utility, 0) <> 1
```

### 7.3 `vw_parcel_owner`

```sql
CREATE VIEW vw_parcel_owner AS
SELECT
    psa.prop_id,
    psa.owner_tax_yr  AS prop_val_yr,
    psa.sup_num,
    o.owner_id,
    o.pct_ownership,
    a.file_as_name    AS owner_name
FROM pacs_prop_supp_assoc psa
JOIN pacs_owner o
  ON o.prop_id      = psa.prop_id
 AND o.owner_tax_yr = psa.owner_tax_yr
 AND o.sup_num      = psa.sup_num
JOIN pacs_account a
  ON a.acct_id = o.owner_id;
```

A parcel can have multiple owners (split ownership). The view emits
one row per (parcel, owner). Consumers can filter by `pct_ownership =
100` for full owners, or aggregate.

### 7.4 `vw_parcel_situs_address`

```sql
CREATE VIEW vw_parcel_situs_address AS
SELECT
    psa.prop_id,
    psa.owner_tax_yr AS prop_val_yr,
    psa.sup_num,
    s.situs_display,
    a_mail.addr_line1, a_mail.addr_line2, a_mail.addr_line3,
    a_mail.addr_city,  a_mail.addr_state,  a_mail.addr_zip
FROM pacs_prop_supp_assoc psa
JOIN pacs_property p
  ON p.prop_id = psa.prop_id
LEFT JOIN pacs_situs s
  ON s.prop_id = p.prop_id AND s.primary_situs = 'Y'
LEFT JOIN pacs_account ac
  ON ac.acct_id = p.col_owner_id
LEFT JOIN pacs_address a_mail
  ON a_mail.acct_id = ac.acct_id AND a_mail.primary_addr = 'Y';
```

### 7.5 `vw_parcel_current_value`

```sql
CREATE VIEW vw_parcel_current_value AS
SELECT
    psa.prop_id,
    psa.owner_tax_yr AS prop_val_yr,
    psa.sup_num,
    o.owner_id,
    wpov.imprv_hstd_val + wpov.imprv_non_hstd_val      AS imprv_total_val,
    wpov.land_hstd_val  + wpov.land_non_hstd_val
        + wpov.timber_market + wpov.ag_market
        + wpov.timber_hs_market + wpov.ag_hs_market    AS land_total_val,
    wpov.new_val_hs + wpov.new_val_nhs                 AS new_construction_val,
    wpov.appraised_classified + wpov.appraised_non_classified AS total_appraised,
    wpov.taxable_classified  + wpov.taxable_non_classified  AS total_taxable,
    wpov.ag_use_val + wpov.ag_hs_use_val
        + wpov.timber_use_val + wpov.timber_hs_use_val AS current_use_val
FROM pacs_prop_supp_assoc psa
JOIN pacs_owner o
  ON o.prop_id = psa.prop_id AND o.owner_tax_yr = psa.owner_tax_yr AND o.sup_num = psa.sup_num
JOIN pacs_wash_prop_owner_val wpov
  ON wpov.prop_id = psa.prop_id
 AND wpov.year    = psa.owner_tax_yr
 AND wpov.sup_num = psa.sup_num
 AND wpov.owner_id = o.owner_id;
```

### 7.6 `vw_qualified_sales`

```sql
CREATE VIEW vw_qualified_sales AS
SELECT
    s.chg_of_owner_id,
    copa.prop_id,
    s.sl_dt,
    s.sl_price,
    s.sl_county_ratio_cd,
    s.sl_ratio_type_cd,
    s.sl_type_cd,
    s.sl_financing_cd,
    s.wac_cd,            -- documentary metadata, kept for audit
    co.deed_type_cd
FROM pacs_sale s
JOIN pacs_chg_of_owner co
  ON co.chg_of_owner_id = s.chg_of_owner_id
JOIN pacs_chg_of_owner_prop_assoc copa
  ON copa.chg_of_owner_id = s.chg_of_owner_id
WHERE s.sl_county_ratio_cd IN ('01','02')
  AND s.sl_price > 100
  AND s.sl_dt IS NOT NULL;
```

Multi-year — consumer applies the date filter for ratio-study
window.

### 7.7 `vw_parcel_qualified_sale_ratio`

```sql
CREATE VIEW vw_parcel_qualified_sale_ratio AS
SELECT
    qs.prop_id,
    qs.chg_of_owner_id,
    qs.sl_dt,
    qs.sl_price,
    qs.sl_county_ratio_cd,
    cv.total_appraised,
    CASE WHEN qs.sl_price > 0
         THEN cv.total_appraised * 1.0 / qs.sl_price
         ELSE NULL
    END AS sale_ratio
FROM vw_qualified_sales qs
JOIN vw_parcel_current_value cv
  ON cv.prop_id = qs.prop_id;
```

(The ratio is appraised / sale price per IAAO convention. Operator
may want 1/ratio or other; trivial to add.)

---

## 8. TF DB schema requirements

The current `Properties` table is unsalvageable. The replacement
shape:

```text
TerraFusion DB target schema (proposed)
─────────────────────────────────────────────────

pacs_property                    (mirror)
  Id (uuid, PK)
  CountyId (uuid)
  PropId (int)         ← prop_id
  PropTypeCd (varchar)
  GeoId (varchar)
  ColOwnerId (int)     ← col_owner_id
  DbaName (varchar?)
  PacsCreatedAt, PacsUpdatedAt    ← if PACS carries them
  CreatedAt, UpdatedAt, CreatedBy, UpdatedBy   (audit)
  UNIQUE (CountyId, PropId)

pacs_prop_supp_assoc              (mirror)
  Id (uuid, PK)
  CountyId (uuid)
  PropId (int)
  OwnerTaxYr (int)
  SupNum (int)
  UNIQUE (CountyId, PropId, OwnerTaxYr)
  -- exactly one current sup per (county, prop, year)

pacs_property_val                 (mirror)
  Id (uuid, PK)
  CountyId (uuid)
  PropId (int)
  PropValYr (int)       ← prop_val_yr
  SupNum (int)
  PropInactiveDt (date?)
  PropertyUseCd, SecondaryUseCd, HoodCd
  LegalAcreage (decimal), LegalDesc (text)
  Market, ImprvVal, LandHstdVal, LandNonHstdVal,
  TimberMarket, AgMarket, …
  UdiParent (char), UdiParentPropId (int?)
  SubType (varchar)
  PRIMARY KEY (Id)
  UNIQUE (CountyId, PropId, PropValYr, SupNum)

(similar mirror tables for every Tier-1 entity in §5)

vw_active_real_parcels            (truth view per §7)
vw_wsdor_real_roll                (truth view)
vw_parcel_owner                   (truth view)
vw_parcel_situs_address           (truth view)
vw_parcel_current_value           (truth view)
vw_parcel_profile                 (truth view)
vw_qualified_sales                (truth view)
vw_parcel_qualified_sale_ratio    (truth view)
```

### 8.1 What dies in the current Properties table

The current `Properties` table flattens `property + property_val +
property_profile` into one row per parcel without preserving
versioning. It cannot represent:

- A parcel-year with multiple supplements
- A parcel with multiple owners
- The audit-grade WSDOR values (only carries totals, not the
  classified/non-classified/use breakdown)
- The mailing address vs the situs distinction

Replacement: keep `Properties` as a **deprecated view** during
migration, point it at `vw_active_real_parcels JOIN
vw_parcel_situs_address JOIN vw_parcel_owner` so existing API
consumers continue to work. New consumers read the truth views
directly.

---

## 9. Quality gates (binding)

Every ingest run must pass these gates before the new TF DB is
considered usable. They live as `pnpm run truth:*` scripts.

| Gate | Assertion |
|---|---|
| `truth:pacs-spine-version-uniqueness` | Every `(CountyId, PropId, PropValYr)` in `pacs_prop_supp_assoc` has exactly one row. |
| `truth:pacs-spine-current-version-coverage` | Every `pacs_property_val` row's `(PropId, PropValYr, SupNum)` matches a `pacs_prop_supp_assoc` triple. |
| `truth:pacs-active-real-count` | `vw_active_real_parcels` row count is within ±5% of the operator-supplied "~89k active parcels" expected count. |
| `truth:pacs-wsdor-real-roll-count` | `vw_wsdor_real_roll` row count is within ±5% of the operator-supplied WSDOR Real expected count. |
| `truth:pacs-wsdor-personal-roll-count` | `vw_wsdor_personal_roll` row count is within ±5% of the operator-supplied WSDOR Personal expected count. |
| `truth:pacs-owner-coverage` | `vw_parcel_owner.owner_name` is non-NULL for ≥99% of rows. |
| `truth:pacs-sale-junction-coverage` | Every `pacs_sale.chg_of_owner_id` resolves through `pacs_chg_of_owner_prop_assoc` to at least one `pacs_property.prop_id`. |
| `truth:pacs-qualified-sale-axis-source` | `vw_qualified_sales` filters on `sl_county_ratio_cd`, NOT `wac_cd` or `sl_ratio_type_cd`. (Static check on the view body.) |
| `truth:pacs-no-utility-bleed-in-wsdor` | `vw_wsdor_real_roll` contains zero rows where `pst.state_assessed_utility = 1` or `local_assessed_utility = 1`. |
| `truth:pacs-no-personal-in-real-roll` | `vw_active_real_parcels` and `vw_wsdor_real_roll` contain zero `prop_type_cd = 'P'` rows. |
| `truth:pacs-prop-supp-assoc-roundtrip` | For a sample of 100 parcels, the (PropId, PropValYr, SupNum) selected by `pacs_prop_supp_assoc` matches the same triple selected by querying live PACS via the gold query. |

The last gate (`prop-supp-assoc-roundtrip`) is what catches drift
between TF DB and live PACS. It does NOT require running PACS during
normal product runtime — only during periodic CI / operator-triggered
sync validation.

---

## 10. Migration plan (rebuild from current state)

The current TF DB has 128k flattened `Properties`, 440k orphan-keyed
`pacs_sales`, and 0 `CanonicalSaleQualifications`. The rebuild path:

### Phase A: Build the new ingest layer (no destructive changes)

1. Add the 20+ `pacs_*` mirror tables via a new EF migration.
2. Implement a new ingest service (replacing `PacsDataSeeder`) that
   runs the eight phases above against `pacs_oltp`.
3. Land into the new tables only. Do not touch the existing
   `Properties`, `pacs_sales`, `CanonicalSaleQualifications` tables.
4. Run truth gates; iterate until all pass.

### Phase B: Build the truth views

1. Add `vw_*` views via EF migration (SQL views, not entities).
2. Add read-model EF entities pointing at the views (read-only).
3. Build a small read-model API surface that exposes them.

### Phase C: Switch consumers

1. Update API endpoints to read from truth views instead of
   `Properties`.
2. Update OPS-1 readiness panels to measure the new gates instead of
   the old C8-A → C36 surface.
3. Mark the current `Properties` / `pacs_sales` / `CanonicalSale
   Qualifications` tables as DEPRECATED in the schema.

### Phase D: Throw out the bad scaffolding

The following were built around the wrong ingest contract. Per §15
of the knowledge baseline, they need to die:

- `CanonicalSaleQualifications` table + the C36 canonical write
  runner — qualified on `wac_cd`/`sl_ratio_type_cd` instead of
  `sl_county_ratio_cd`.
- `SyncMappingWorkbook` family for the sales axes — operator does
  not author canonical values for `sl_county_ratio_cd`; codes 01/02
  are a literal predicate.
- The C50-CONV era preflight family — speculative without ProVal/
  Ascend reading.
- The C51-PII manifest — not aligned with actual PII surface
  (`account.file_as_name`, `address.addr_line*`).
- The OPS-1 Coverage smoke that compares current `pacs_sales` to
  empty `CanonicalSaleQualifications` — replace with a comparison
  between `vw_qualified_sales` and per-parcel sale availability.

### Phase E: Drop the deprecated tables

Once consumers are switched and gates are green for one full
operator cycle, drop:

- `Properties` (replaced by `vw_active_real_parcels JOIN ...`)
- `pacs_sales` (replaced by tier-1 `pacs_sale + pacs_chg_of_owner +
  pacs_chg_of_owner_prop_assoc`)
- `CanonicalSaleQualifications` (replaced by `vw_qualified_sales`)
- `ComparableSales` (replaced by truth-view-driven comp engine — TBD)

---

## 11. Open questions (must resolve before §10 Phase A)

1. **What is the lookup table for `sl_county_ratio_cd`?** Codes 01
   and 02 are operator-confirmed qualifying. What are codes 03..N?
   What's the full code domain? Need to enumerate from PACS.
2. **What's the column for "sale qualified for ratio study" on the
   sale row, if any, beyond `sl_county_ratio_cd`?** Some PACS
   installs carry an explicit `sl_qualifier` flag.
3. **What's the canonical year field on `pacs_system`?** The
   operator's queries use `ps.appr_yr`. Is it always the highest
   year, or can it lag? Need to confirm with PACS docs or the
   operator.
4. **Do we need to capture historical years (multi-year ingest)
   for ratio-study windowing?** Or is current-year + sale history
   enough? IAAO ratio studies typically use a 12–18 month sale
   window relative to the assessment date — that's a sale-table
   concern, not a property-table concern.
5. **What's the per-parcel Personal Property situation?** Operator
   said TF DB has 23,592 P rows that the CamaCloud sync excludes.
   Should TF DB carry P at all, or only R+MH? If P, on what
   schedule?
6. **The 100GB `pacs_oltp_backup_*.bak` — is our local
   `pacs_oltp` in tf-mssql restored from that, or older?** The
   ingest service depends on schema parity.
7. **Levy / billing / payment side** — entirely out of scope here;
   needs its own spine document (`pacs-levy-spine.md`).

---

## 12. What this design eliminates permanently

If the §10 migration completes:

- **No more "is it 128k or 89k parcels"** — there's `vw_active_real_parcels`
  (CamaCloud rule), `vw_wsdor_real_roll` (WSDOR rule), and
  `vw_wsdor_personal_roll`. Each is named by what it counts.
- **No more empty OwnerName** — `vw_parcel_owner` joins through
  account; gate fails if >1% NULL.
- **No more wrong sale qualification axis** — `vw_qualified_sales`
  uses `sl_county_ratio_cd`. Static gate enforces it.
- **No more flattened sup_num** — every tier-1 row carries
  `(PropId, PropValYr, SupNum)`. Consumers can re-version.
- **No more orphan-keyed sales** — the junction is preserved.
- **No more workbook authoring for codes PACS already canonicalizes**
  — lookup tables are mirrored verbatim.
- **No more ad-hoc API queries against raw PACS** — product runtime
  reads only TF DB truth views; PACS reads happen only at ingest
  time.

---

## 13. What this design preserves

- The **truth-script audit pattern** (`pnpm run truth:*`) — sound and
  useful. Track 2F was the right shape; just had the wrong join key.
- The **two-tier read-model discipline** — Tier 1 mirror, Tier 2
  truth — is consistent with how OPS-1-A / Track 2F were structured.
- The **county-isolation** discipline — every table carries
  `CountyId`, every truth view filters by it.
- The **OPS-1 Sync Readiness Console concept** — six panels still
  useful, just measure different things (gold-query parcel count,
  WSDOR-vs-CamaCloud delta, owner-coverage %, qualified-sale-axis
  static check, etc.).
- The **BENTON-SYNC-* artifact baseline pattern** — useful for
  capturing per-run evidence with leak scans.
- The **`wash_prop_owner_val` audit-grade value source** — this
  becomes the canonical value source for any per-owner reporting.

---

## 14. Definition of done for this blueprint

This document is "done" when:

1. **The operator confirms the gold query in §2** is correct for
   their definition of "active real parcel."
2. **The operator confirms `sl_county_ratio_cd IN ('01','02')`**
   is the qualification rule (or supplies the actual rule).
3. **The operator answers §11.5** (do we ingest P?) and §11.4
   (multi-year ingest?).
4. **The operator confirms or corrects the join graph in §3.1**
   based on their PACS knowledge.
5. **§11 question 1 is resolved** — we know the full code domain
   for `sl_county_ratio_cd` and the lookup table backing it.

After those five operator inputs, this blueprint is the
implementation contract. The next slice (Phase A in §10) is a
mechanical exercise.

---

## 15. What I commit to NOT do until this is signed off

- No new EF migrations.
- No new `pacs_*` tables.
- No edits to `PacsDataSeeder`.
- No edits to existing truth views or readiness panels.
- No deletion of `CanonicalSaleQualifications` or `pacs_sales`.
- No further BENTON-SYNC-* or OPS-* slices.

This blueprint is the gate. The five operator confirmations in §14
unlock Phase A. Without them, any code work is more sand on the same
foundation.
