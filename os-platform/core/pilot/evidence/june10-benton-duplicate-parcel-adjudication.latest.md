# Benton Duplicate Parcel-Number Adjudication

Generated: 2026-05-23T00:28:59.205Z

Verdict: **FAIL**

## Summary

- County: Benton
- Table: canonical_tf.tf_parcel
- Duplicate active parcel-number groups: 1503
- Extra active rows: 1503
- Max rows per parcel number: 2
- Sample groups adjudicated: 50
- Certification impact: certification_blocker
- Projection fix required: true
- Sync active: true
- Database mutation taken: false
- Certification granted: false

## Doctrine

- TerraFusion DB is the runtime source for this adjudication.
- This gate is read-only and does not certify Benton while Sync is active.
- Duplicate active/current parcel numbers are not acceptable unless schema-supported version, history, split, or geometry semantics explain them.
- Source duplicates cannot be claimed from canonical_tf.tf_parcel alone.
- A warning becomes acceptable only when the duplicate semantics are proven, not inferred.

## Schema Signals

- Has tax year/version key: false
- Has geometry/split key: false
- Columns: TfParcelId, CountyId, ParcelNumber, SitusAddress, LegalDescription, ParcelStatus, PropertyType, CurrentOwnerId, CurrentAssessmentId, CreatedAt, UpdatedAt, ConversionEra

## Classification Counts

- exact_or_near_duplicate_projection_bug: 50

## Sample Groups

| Parcel number | Rows | Classification | Impact | Projection fix |
|---|---:|---|---|---:|
101843020124000 | 2 | exact_or_near_duplicate_projection_bug | certification_blocker | true
101843020125001 | 2 | exact_or_near_duplicate_projection_bug | certification_blocker | true
101843020125002 | 2 | exact_or_near_duplicate_projection_bug | certification_blocker | true
101843020125003 | 2 | exact_or_near_duplicate_projection_bug | certification_blocker | true
101843020125004 | 2 | exact_or_near_duplicate_projection_bug | certification_blocker | true
101843020125005 | 2 | exact_or_near_duplicate_projection_bug | certification_blocker | true
101843020125006 | 2 | exact_or_near_duplicate_projection_bug | certification_blocker | true
101843020125007 | 2 | exact_or_near_duplicate_projection_bug | certification_blocker | true
101843020125008 | 2 | exact_or_near_duplicate_projection_bug | certification_blocker | true
101843020125011 | 2 | exact_or_near_duplicate_projection_bug | certification_blocker | true
101843020125013 | 2 | exact_or_near_duplicate_projection_bug | certification_blocker | true
101843020125014 | 2 | exact_or_near_duplicate_projection_bug | certification_blocker | true
101843020125017 | 2 | exact_or_near_duplicate_projection_bug | certification_blocker | true
101843020126006 | 2 | exact_or_near_duplicate_projection_bug | certification_blocker | true
101843020126009 | 2 | exact_or_near_duplicate_projection_bug | certification_blocker | true
101843020126011 | 2 | exact_or_near_duplicate_projection_bug | certification_blocker | true
101843020126012 | 2 | exact_or_near_duplicate_projection_bug | certification_blocker | true
101843020126014 | 2 | exact_or_near_duplicate_projection_bug | certification_blocker | true
101843020126015 | 2 | exact_or_near_duplicate_projection_bug | certification_blocker | true
101843020144001 | 2 | exact_or_near_duplicate_projection_bug | certification_blocker | true
101843020144006 | 2 | exact_or_near_duplicate_projection_bug | certification_blocker | true
101843020145001 | 2 | exact_or_near_duplicate_projection_bug | certification_blocker | true
101843020145003 | 2 | exact_or_near_duplicate_projection_bug | certification_blocker | true
101843020145004 | 2 | exact_or_near_duplicate_projection_bug | certification_blocker | true
101843020145005 | 2 | exact_or_near_duplicate_projection_bug | certification_blocker | true

## Blockers

- sync_active: TerraFusion Sync is active; Benton certification must remain blocked even though this adjudication is read-only.
- duplicate_active_parcel_numbers: 1503 active/current Benton parcel-number groups have duplicate canonical rows without an explaining version/split key.
