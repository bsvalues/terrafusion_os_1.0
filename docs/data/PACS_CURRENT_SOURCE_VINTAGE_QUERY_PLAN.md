# WO-DATA-004B-FIX1 — PACS Current Source Vintage Query Plan

**Date**: 2026-06-16 · Companion to `PACS_CURRENT_SOURCE_ATTACH_PLAN.md` · Read-only queries, run only against the **attached COPY** on the isolated `tf-pacs-current-verify` instance (port 21433). Never against the original volume.

**Purpose**: prove whether `tf_mssql_data` / `pacs_oltp` is the current (post-2018) PACS source, using the exact same predicates the Sync pipeline uses.

---

## Queries (all read-only `SELECT`)

```sql
-- 0. Confirm which DB we are in
SELECT DB_NAME() AS database_name;

-- 0b. List databases on the isolated instance
SELECT name FROM sys.databases ORDER BY name;

-- 1. OWNER vintage — THE gate predicate (pipeline filters sup_num=0 AND owner_tax_yr >= 2018)
SELECT
  COUNT(*)                                                              AS owner_rows,
  MIN(owner_tax_yr)                                                     AS min_owner_tax_yr,
  MAX(owner_tax_yr)                                                     AS max_owner_tax_yr,
  SUM(CASE WHEN sup_num = 0 AND owner_tax_yr >= 2018 THEN 1 ELSE 0 END) AS qualifying_owner_rows
FROM owner;

-- 2. PROPERTY date range
SELECT
  COUNT(*)            AS property_rows,
  MIN(prop_create_dt) AS min_prop_create_dt,
  MAX(prop_create_dt) AS max_prop_create_dt
FROM property;

-- 3. SALE date range (only if a sale table exists)
SELECT
  COUNT(*)     AS sale_rows,
  MIN(sale_dt) AS min_sale_dt,
  MAX(sale_dt) AS max_sale_dt
FROM sale;
```

If table/column names differ on this instance, inspect read-only first and adapt:

```sql
SELECT TOP 50 t.name AS table_name
FROM sys.tables t WHERE t.name IN ('owner','property','sale','property_val')
ORDER BY t.name;

SELECT c.name AS column_name, ty.name AS type_name
FROM sys.columns c
JOIN sys.types ty ON ty.user_type_id = c.user_type_id
WHERE c.object_id = OBJECT_ID('dbo.owner')
  AND c.name IN ('owner_tax_yr','sup_num');
```

---

## Interpretation → Decision

| Result | Decision |
|--------|----------|
| `qualifying_owner_rows > 0` AND `max_owner_tax_yr >= 2018` | **A** — current source proven. Proceed to a controlled parcel drain rerun (bounded TopN, separate WO). |
| `qualifying_owner_rows = 0` (e.g. `max_owner_tax_yr <= 2017`) | **B** — historical only. STOP. Do **not** change pipeline filters. This is not the current source. |
| queries cannot run (attach failed / schema mismatch unresolved) | **C** — STOP, preserve logs, do not touch the original. |

**Benchmark for context**: the historical wo004 source returns `min=1980, max=2016, qualifying=0`. The current source must return `max >= 2018` with `qualifying > 0` to pass.

---

## Constraints

- Read-only `SELECT` only. No `INSERT/UPDATE/DELETE/DROP`, no `CREATE` except the one-time `FOR ATTACH` (which targets the COPY, per the attach plan).
- Run on the isolated `tf-pacs-current-verify` instance only.
- Record raw query output verbatim into the FIX2 results doc.
- Do not proceed to any TerraFusion drain on Decision B or C.
