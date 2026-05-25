# Current Use Migration Order

1. County tenant table
2. Policy pack table
3. Interest rate table
4. Classification table
5. Evidence item table
6. Timeline/Trace table
7. Removal table
8. Rollback calculation table
9. Notice issuance table
10. Treasurer payment packet table
11. Appeal/reclassification tables
12. Compliance/inspection tables
13. Import batch tables
14. Analytics/materialized views

## Rule

Do not add foreign keys to external TerraFusion domains until those canonical IDs are stable.
Use nullable external reference IDs first.
