# Benton Projection Duplicate Root-Cause Gate

Generated: 2026-05-23T00:55:52.744Z

Verdict: **FAIL**

## Summary

- County: Benton
- Table: canonical_tf.tf_parcel
- Duplicate active parcel-number groups: 1503
- Extra active rows: 1503
- Max rows per parcel number: 2
- Exact non-volatile duplicate groups: not fully scanned
- Sample exact non-volatile duplicate groups: 50
- Sample fanout groups: 0
- Owner fanout groups: null
- Assessment fanout groups: null
- Created timestamp distinct groups: null
- Updated timestamp distinct groups: null
- Primary root cause: projection_upsert_or_uniqueness_defect
- Certification impact: certification_blocker
- Projection fix required: true
- Unique active parcel index: false
- Sync active: true
- Database mutation taken: false
- Certification granted: false

## Root-Cause Evidence

- canonical_tf.tf_parcel has no unique active CountyId + ParcelNumber key in the inspected index definitions.
- 50 duplicate groups have identical non-volatile parcel identity fields.

## Limitations

- No source identifier column exists on canonical_tf.tf_parcel, so source duplication cannot be proven from this table alone.
- No load batch or receipt column exists on canonical_tf.tf_parcel, so direct duplicate-to-load-batch tracing is unavailable.

## Sample Groups

| Parcel number | Rows | Non-volatile signatures | Owners | Assessments | Created timestamps | Updated timestamps |
|---|---:|---:|---:|---:|---:|---:|
101843020124000 | 2 | 1 | 1 | 1 | 2 | 2
101843020125001 | 2 | 1 | 1 | 1 | 2 | 2
101843020125002 | 2 | 1 | 1 | 1 | 2 | 2
101843020125003 | 2 | 1 | 1 | 1 | 2 | 2
101843020125004 | 2 | 1 | 1 | 1 | 2 | 2
101843020125005 | 2 | 1 | 1 | 1 | 2 | 2
101843020125006 | 2 | 1 | 1 | 1 | 2 | 2
101843020125007 | 2 | 1 | 1 | 1 | 2 | 2
101843020125008 | 2 | 1 | 1 | 1 | 2 | 2
101843020125011 | 2 | 1 | 1 | 1 | 2 | 2
101843020125013 | 2 | 1 | 1 | 1 | 2 | 2
101843020125014 | 2 | 1 | 1 | 1 | 2 | 2
101843020125017 | 2 | 1 | 1 | 1 | 2 | 2
101843020126006 | 2 | 1 | 1 | 1 | 2 | 2
101843020126009 | 2 | 1 | 1 | 1 | 2 | 2
101843020126011 | 2 | 1 | 1 | 1 | 2 | 2
101843020126012 | 2 | 1 | 1 | 1 | 2 | 2
101843020126014 | 2 | 1 | 1 | 1 | 2 | 2
101843020126015 | 2 | 1 | 1 | 1 | 2 | 2
101843020144001 | 2 | 1 | 1 | 1 | 2 | 2
101843020144006 | 2 | 1 | 1 | 1 | 2 | 2
101843020145001 | 2 | 1 | 1 | 1 | 2 | 2
101843020145003 | 2 | 1 | 1 | 1 | 2 | 2
101843020145004 | 2 | 1 | 1 | 1 | 2 | 2
101843020145005 | 2 | 1 | 1 | 1 | 2 | 2

## Blockers

- sync_active: TerraFusion Sync is active; root-cause evidence may be collected read-only, but Benton certification remains blocked.
- projection_duplicate_root_cause: Active/current Benton parcel duplicates remain a certification blocker. Root cause: projection_upsert_or_uniqueness_defect.
