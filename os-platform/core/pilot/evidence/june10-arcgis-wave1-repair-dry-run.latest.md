# ArcGIS Wave 1 Repair Dry-Run

Generated: 2026-05-27T15:48:44.487Z

## Summary

- Clean repair-ready counties: 4
- Garfield repair allowed: no
- Proposed rows: 34536
- Duplicate groups after repair: 0
- Database mutation attempted: no
- Production binding allowed: no
- Certification allowed: no

## Repair Matrix

| County | FIPS | Proposed rows | Duplicates after | Missing source mappings | Classification |
| --- | --- | ---: | ---: | ---: | --- |
| Columbia | 53013 | 5280 | 0 | 0 | repair_dry_run_ready_for_authorization |
| Ferry | 53019 | 9195 | 0 | 0 | repair_dry_run_ready_for_authorization |
| Pend Oreille | 53051 | 15633 | 0 | 0 | repair_dry_run_ready_for_authorization |
| Wahkiakum | 53069 | 4428 | 0 | 0 | repair_dry_run_ready_for_authorization |

## Garfield Delta

- Classification: garfield_blank_source_native_delta_hold
- Repair allowed: no
- Reason: Garfield has a canonical prefixed row that strips to an empty ParcelNumber. It aligns with a source row whose ORIG_PARCEL_ID is blank. Do not repair this row into a blank ParcelNumber; hold for county-specific supersede/exclude policy.

