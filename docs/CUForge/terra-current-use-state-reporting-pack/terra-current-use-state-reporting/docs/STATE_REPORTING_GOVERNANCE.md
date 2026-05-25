
# Current Use State Reporting Governance

## Purpose

Support county reporting and reconciliation workflows.

## Rules

- reporting exports are county-scoped
- reporting batches preserve generated timestamp
- exports should reference policy version indirectly through calculations
- exports should not mutate parcel records

## Validation

Before submission:

- verify row counts
- verify rollback totals
- verify classification counts
- preserve export snapshot
