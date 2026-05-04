# IMP-POP-1 — Findings: Improvement-Lane Doctrine End-to-End Closure

**Slice:** IMP-POP-1 (post-OWN-POP-2). C-block doctrine arc: connects
imprv (C1-A) + imprv_detail (C1-B) + imprv_attr (C1-C) to live Harris
PACS, promotes through C2 truth, projects through C3 canonical
(`tf_improvement` + `tf_improvement_feature`).

**Status:** PROVEN. `canonical_tf.tf_improvement = 241`,
`canonical_tf.tf_improvement_feature = 2262`. C-block lane operational.

## The result

```
Owner-seed S1 (TopN=200, sup=0)        : 200 owners
  → 200 distinct prop_ids (R-anchored)
Keyed Parcel S1 + Spine + Canonical    : 200 R → 200 → 200
Keyed Supp S1 (year=2026)              : 200 supp pointers
Keyed Imprv S1                         : 241 imprv rows
Keyed ImprvDetail S1                   : 754 detail rows
Keyed ImprvAttr S1                     : 0 attr rows (empty for year=2026)
Imprv Truth (C2)                       : 241 promoted (0 rejected)
Imprv Canonical (C3)                   : 241 improvements +
                                          2262 features +
                                          0 quarantined

canonical_tf.tf_improvement         : 0 → 241    ✅
canonical_tf.tf_improvement_feature : 0 → 2262   ✅
truth_pacs.imprv_current            : 0 → 241
```

200 parcels → 241 improvements means ~20% of parcels have >1 imprv
row (e.g. main residence + detached garage as separate parent
imprvs). 241 → 2262 features means ~9 features per improvement
(the COVPATIO + ATTGAR + MA + BSMT + POOL + auxiliary detail
breakdown).

## Why owner-anchored seeding

The first run used `SqlServerPacsPropertySource` ordered by
`prop_id DESC` with TopN=200, which surfaced 100% personal-property
and mobile-home parcels (all dropped at the spine's R-only filter,
zero parcels for the imprv chain to anchor on).

Benton's recent prop_id stratum is dominated by P/MH because new
personal-property and mobile-home accessory records get higher
sequential prop_ids. Real-property parcels live in the older
prop_id range.

Fix: seed via `SqlServerPacsOwnerSource`, which only attaches to
real parcels by definition. The owner batch's distinct prop_ids
become the keyed input to the parcel + imprv chains. 100% R
guaranteed.

## Files shipped

- `backend/src/TerraFusion.Data/Services/PacsSources/KeyedSqlServerPacsImprvSource.cs`
  — keyed imprv source, 1000 (prop_id, prop_val_yr) tuples per round-trip
- `backend/src/TerraFusion.Data/Services/PacsSources/KeyedSqlServerPacsImprvDetailSource.cs`
  — same shape for imprv_detail
- `backend/src/TerraFusion.Data/Services/PacsSources/KeyedSqlServerPacsImprvAttrSource.cs`
  — same shape for imprv_attr
- `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs`
  — adds `POST /api/debug/imp-pop-1/run-final-closure` (10 stages)

## Fixture-vs-real divergences (3)

### #1: `dbo.imprv` column names

Three columns the `PacsSourceImprv` record expected do not exist on
real Benton:

| Entity field | Benton reality |
|---|---|
| `ImprvClassCd` | column does not exist → `CAST(NULL AS varchar(10))` |
| `YearBuilt` | `yr_built` does not exist; reuse `actual_year_built` |
| `EffectiveYearBuilt` | column is `effective_yr_blt` (truncated to "_blt") |

Fix: SQL aliases at projection time.

### #2: `dbo.imprv_attr` value columns

The record expected `attr_value_text` (string) and `attr_value_numeric`
(decimal) but real Benton has only `imprv_attr_val` which is a
`decimal(18,6)` column.

Fix: `CAST(imprv_attr_val AS varchar(50)) AS attr_value_text` and
`imprv_attr_val AS attr_value_numeric` projects the same value into
both fields, with the entity's text field carrying the stringified
form.

### #3: Owner-anchored seeding (architectural, not column-level)

See "Why owner-anchored seeding" above. This isn't a column
divergence — it's an ordering-strategy fix that surfaced when the
default parcel TopN landed 0 R rows.

## Doctrine alignment

10 stages mirror the established keyed-source closure pattern:

1. A0. Owner seed (small TopN, real-property guarantee)
2. A. Keyed parcel S1 (off seed prop_ids)
3. B. Parcel spine + canonical (so xrefs exist)
4. C. Extract (prop_id, year=2026) keys
5. D. Keyed supp S1
6. E. Keyed imprv S1
7. F. Keyed imprv_detail S1
8. G. Keyed imprv_attr S1
9. H. Imprv truth (C2)
10. I. Imprv canonical (C3)

The C3 projector resolves parcel xrefs from stage B and writes
both `tf_improvement` parents and `tf_improvement_feature` children.

## C-block status: improvements lane COMPLETE

| Slice | Status |
|---|---|
| C1-A imprv landing | ✓ |
| C1-B imprv_detail landing | ✓ |
| C1-C imprv_attr landing | ✓ |
| C2 truth_pacs.imprv_current | ✓ |
| C3 canonical_tf.tf_improvement + tf_improvement_feature | ✓ |

## What's not yet wired

- **Attribute resolution** (C3 → `attribute_definition` lookup):
  the proof run had 0 imprv_attr rows for the year=2026 keyed sample.
  This means `attributes_resolved = 0` and `attributes_quarantined = 0`,
  not that the resolution path is broken. A wider sample (multiple
  years or larger TopN) would exercise the attribute-dictionary
  resolution path. Deferred to a future enhancement slice if the
  attribute count matters for downstream consumers.

- **LAND-POP-1**: the land lane (D1 land_detail → truth → canonical
  `tf_land`). Not blocked by anything; same keyed-source pattern.

## Re-open conditions for IMP-POP-1

- The `PacsSourceImprv` / `PacsSourceImprvAttr` records change shape
  (e.g. ImprvClassCd reinstated as required, attr_value_numeric
  given different semantics).
- Real Benton dbo.imprv adds a separate yr_built column distinct
  from actual_year_built (currently aliased; see divergence #1).
- Multi-year imprv runs need bounded support (currently a single
  WorkingYear parameter; could become a year list).

## Endpoint reference

```
POST /api/debug/imp-pop-1/run-final-closure
Content-Type: application/json

{
  "OperatorName": "imp-pop-1-proof",   // optional, audit anchor
  "ParcelTopN": 200,                    // optional, default 200
  "WorkingYear": 2026                    // optional, default 2026
}
```

Response includes 10 stage blocks, owner-seed→imprv-key fanout
counts, `counts.canonicalTfImprovements`,
`counts.canonicalTfImprovementFeatures`, and `proofVerdict`.

## The one-line summary

**IMP-POP-1 closed: live Harris PACS → `canonical_tf.tf_improvement > 0`
AND `tf_improvement_feature > 0`. C-block doctrine arc complete.**
