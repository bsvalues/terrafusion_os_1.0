# LEV-143 - Tax Code Population

## Purpose

Documents the process for populating the tax code area (TCA) composition
table, which maps each tax code to its constituent taxing districts.

## Tax Code Structure

A tax code area is a unique combination of overlapping taxing districts.
Each property is assigned exactly one TCA, which determines its aggregate
levy rate.

| Field            | Type   | Description                         |
|------------------|--------|-------------------------------------|
| `tax_code`       | string | Unique TCA identifier (e.g., "001")|
| `district_id`    | string | FK to a taxing district             |
| `levy_type`      | string | REGULAR, EXCESS, BOND, etc.         |
| `effective_year` | int    | First year this mapping applies     |
| `expired_year`   | int?   | Year mapping was superseded (null=active) |

## Population Steps

1. Obtain the TCA composition list from the county treasurer or DOR.
2. Validate that every referenced `district_id` exists in `tax_districts`.
3. Insert rows into `tax_code_districts` mapping table.
4. Compute aggregate rates for each TCA and store in `tax_code_rates`.

## Maintenance

- When districts annex or merge, update the affected TCA mappings.
- Expired mappings are soft-deleted (set `expired_year`), never hard-deleted.
- Annual review ensures TCA list matches the DOR certified list.

## Validation

```sql
-- Every tax code should map to at least one district
SELECT tax_code FROM tax_code_districts
GROUP BY tax_code HAVING COUNT(*) = 0;  -- expect 0 rows
```
