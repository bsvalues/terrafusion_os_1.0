# LEV-064 - Sample Data Seeding

## Purpose

Describes the process for populating the BCBSLevy database with demonstration
data suitable for development and QA testing. No real county data is used.

## Demo Data Categories

| Category            | Table Target           | Row Count | Notes                        |
|---------------------|------------------------|-----------|------------------------------|
| Tax Districts       | `tax_districts`        | 10        | Fictional district names     |
| Levy Rates          | `levy_rates`           | 30        | 3 years x 10 districts       |
| Tax Codes           | `tax_codes`            | 15        | Composite code mappings      |
| Properties          | `properties`           | 50        | Fake parcel numbers / values |
| Assessed Values     | `assessed_values`      | 150       | 3 years x 50 properties     |

## Seeding Steps

1. Ensure the database schema has been migrated (`dotnet ef database update`).
2. Run the seed script or invoke the `/api/admin/seed` endpoint in dev mode.
3. Verify row counts match the table above.
4. Confirm no PII or real county data is present.

## Environment Guard

The seed operation should only execute when `ASPNETCORE_ENVIRONMENT=Development`.
Production environments must reject seed requests.

## Validation

After seeding, the following queries should return non-zero results:

```sql
SELECT COUNT(*) FROM tax_districts;   -- expect 10
SELECT COUNT(*) FROM levy_rates;      -- expect 30
SELECT COUNT(*) FROM properties;      -- expect 50
```
