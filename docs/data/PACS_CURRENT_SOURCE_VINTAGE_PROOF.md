# WO-DATA-004B-FIX2B — PACS Current Source Vintage Proof

**Work Order:** WO-DATA-004B-FIX2B  
**Date:** 2026-06-17  
**Decision: A — Current source proven**

---

## Query Results

### Database Identity

```sql
SELECT DB_NAME() AS database_name;
-- Result: pacs_oltp_verify
```

SQL Server 2022 (RTM-CU25, 16.0.4255.1)

---

### Owner Vintage (Critical Gate)

```sql
SELECT
  COUNT(*) AS owner_rows,
  MIN(owner_tax_yr) AS min_owner_tax_yr,
  MAX(owner_tax_yr) AS max_owner_tax_yr,
  SUM(CASE WHEN sup_num = 0 AND owner_tax_yr >= 2018 THEN 1 ELSE 0 END) AS qualifying_owner_rows
FROM owner;
```

| Metric | Value |
|---|---|
| owner_rows | **2,539,100** |
| min_owner_tax_yr | 1980 |
| max_owner_tax_yr | **2026** |
| qualifying_owner_rows (sup_num=0, year≥2018) | **809,396** |

---

### Property Date Range

```sql
SELECT
  COUNT(*) AS property_rows,
  MIN(prop_create_dt) AS min_prop_create_dt,
  MAX(prop_create_dt) AS max_prop_create_dt
FROM property;
```

| Metric | Value |
|---|---|
| property_rows | 128,949 |
| min_prop_create_dt | 1900-01-01 (sentinel/legacy) |
| max_prop_create_dt | **2026-01-14** |

---

### Sale Date Range

Date column discovered: `sl_dt` (column name differs from legacy ProVal schema).

```sql
SELECT
  COUNT(*) AS sale_rows,
  MIN(sl_dt) AS min_sale_dt,
  MAX(sl_dt) AS max_sale_dt,
  SUM(CASE WHEN sl_dt >= '2018-01-01' THEN 1 ELSE 0 END) AS post_2018_sales
FROM sale;
```

| Metric | Value |
|---|---|
| sale_rows | 425,251 |
| min_sl_dt | 1899-12-31 (sentinel/legacy) |
| max_sl_dt | **2026-01-13** |
| post_2018_sales | **62,042** |

---

## Decision

### **A — Current source proven**

Evidence:
- `max_owner_tax_yr = 2026` — data extends through current tax year
- `qualifying_owner_rows = 809,396` — 809K rows pass the `sup_num = 0 AND owner_tax_yr >= 2018` filter that the Sync drain uses
- `max_prop_create_dt = 2026-01-14` — property records current through January 2026
- `max_sl_dt = 2026-01-13` — sales current through January 2026
- `post_2018_sales = 62,042` — substantial qualifying sale cohort for ratio studies

This is definitively the current/live Harris PACS database, not the historical Dec-2015 snapshot.

---

## Source Integrity Confirmation

- `tf_mssql_data` Docker volume: NOT mounted into verification container
- Original MDF: NOT touched — only the D: copy was attached
- No drains, imports, promotions, or TerraFusion DB mutations occurred

---

## Technical Note: SQL Server Version Discovery

The MDF is database compatibility version 957 (SQL Server 2022). SQL Server 2019 (max version 904) rejected the attach with error 948. The verification used SQL Server 2022 Developer Edition, which successfully attached the file.

This confirms the PACS host runs SQL Server 2022.

---

## Next Work Order

**WO-DATA-004B-FIX2C — Controlled Sync Drain (Post-2018 Filter)**

Prerequisites now satisfied:
- Copy is byte-exact and verified (FIX2A)
- Attach succeeded, vintage proven (FIX2B)
- 809,396 qualifying rows confirmed in source

The drain filter `sup_num = 0 AND owner_tax_yr >= 2018` will produce substantial results. Proceed with controlled drain rerun.
