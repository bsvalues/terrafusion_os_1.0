# Operator SQL Regression — Sales Ratio Queries

**Slice:** S5
**Status:** Active regression artifacts — referenced by `OperatorSalesRegressionTests`.

This document captures three representative ratio-study-style queries that an
assessor would typically run against the PACS source. Each query has a
**PACS original** (the SQL the operator would write today against `dbo.sale`)
and a **canonical equivalent** (the SQL TerraFusion runs against
`canonical_tf.tf_sale`). The regression suite asserts both flavors produce
identical aggregate outputs against the same fixture.

The three queries are intentionally aggregate-only. The doctrine separates
*data identity* (handled by `source_xref`) from *analytical aggregation*
(handled by canonical). A regression that compares row-level identity would
re-prove the lineage tests; a regression that compares aggregates proves the
canonical layer is a faithful summary of the qualified-and-supp-aware truth.

## Common scope

All queries operate over **valid sales only**. The doctrine pins the
qualification axis to `sl_county_ratio_cd = '100'`. Pre-2018 sales are
excluded (the 2017 cutover is acknowledged at every layer; pre-2018 codes
were a different vocabulary). Single-county scope; tests seed one county at
a time.

## Q1. Count of valid sales

### PACS original

```sql
SELECT COUNT(*) AS valid_sale_count
FROM dbo.sale s
INNER JOIN dbo.prop_supp_assoc psa
    ON s.prop_id     = psa.prop_id
   AND s.prop_val_yr = psa.owner_tax_yr
   AND s.sup_num     = psa.sup_num
WHERE s.sl_county_ratio_cd = '100'
  AND s.sl_dt >= '2018-01-01';
```

### Canonical equivalent

```sql
SELECT COUNT(*) AS valid_sale_count
FROM canonical_tf.tf_sale
WHERE county_id      = :county_id
  AND sale_qualified = TRUE
  AND sl_dt         >= '2018-01-01';
```

### Why they're equal

The canonical layer is exactly *qualified-and-supp-aware*: the S2-B promoter
filters on `sl_county_ratio_cd = '100'` and joins through `prop_supp_assoc`
before any row reaches truth. S3 then projects only those rows whose parcel
xref resolves. Every row passing the PACS filter (and whose parcel landed
canonically) is counted by the canonical query.

## Q2. Count of valid sales by year

### PACS original

```sql
SELECT YEAR(s.sl_dt) AS sale_year, COUNT(*) AS cnt
FROM dbo.sale s
INNER JOIN dbo.prop_supp_assoc psa
    ON s.prop_id     = psa.prop_id
   AND s.prop_val_yr = psa.owner_tax_yr
   AND s.sup_num     = psa.sup_num
WHERE s.sl_county_ratio_cd = '100'
  AND s.sl_dt >= '2018-01-01'
GROUP BY YEAR(s.sl_dt)
ORDER BY sale_year DESC;
```

### Canonical equivalent

```sql
SELECT EXTRACT(YEAR FROM sl_dt)::int AS sale_year, COUNT(*) AS cnt
FROM canonical_tf.tf_sale
WHERE county_id      = :county_id
  AND sale_qualified = TRUE
  AND sl_dt         >= '2018-01-01'
GROUP BY EXTRACT(YEAR FROM sl_dt)
ORDER BY sale_year DESC;
```

## Q3. Aggregate sale price (sum + average)

### PACS original

```sql
SELECT SUM(s.sl_price)  AS total_price,
       AVG(s.sl_price)  AS avg_price,
       COUNT(*)         AS cnt
FROM dbo.sale s
INNER JOIN dbo.prop_supp_assoc psa
    ON s.prop_id     = psa.prop_id
   AND s.prop_val_yr = psa.owner_tax_yr
   AND s.sup_num     = psa.sup_num
WHERE s.sl_county_ratio_cd = '100'
  AND s.sl_dt    >= '2018-01-01'
  AND s.sl_price IS NOT NULL;
```

### Canonical equivalent

```sql
SELECT SUM(sl_price)  AS total_price,
       AVG(sl_price)  AS avg_price,
       COUNT(*)       AS cnt
FROM canonical_tf.tf_sale
WHERE county_id      = :county_id
  AND sale_qualified = TRUE
  AND sl_dt         >= '2018-01-01'
  AND sl_price IS NOT NULL;
```

### Why they're equal

`canonical_tf.tf_sale.SlPrice` is preserved verbatim from the source. No
rounding, no normalization, no currency conversion. A `NULL` source price
remains `NULL`; the `IS NOT NULL` filter applies identically on both sides.

## Cutover boundary

`'2018-01-01'` is the documented cutover. Pre-2018 rows in the PACS source
were coded under the old `'01'`/`'02'` vocabulary, which the S1
`stale-valid-sale-code-rejection` gate FAILs the batch on. In production we
expect zero stale-axis rows; the cutover filter is defensive against any
slipped-through pre-2018 row whose `sl_dt` happens to be before the boundary.

## Reproduction

The regression suite (`backend/tests/TerraFusion.Unit.Tests/Regression/OperatorSalesRegressionTests.cs`)
seeds a single fixture and asserts:

1. Q1 PACS count == Q1 canonical count
2. Q2 PACS year histogram == Q2 canonical year histogram
3. Q3 PACS aggregate == Q3 canonical aggregate (within rounding)

Any divergence is a doctrine violation in the layer between raw and canonical.
