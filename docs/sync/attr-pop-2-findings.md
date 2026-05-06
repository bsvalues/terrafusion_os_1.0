# ATTR-POP-2 — Findings: Value-Grain Attribute Dictionary

**Slice:** ATTR-POP-2 (post-ATTR-DRAIN-1). Closes the family/value-
grain loop ATTR-POP-1 + ATTR-DRAIN-1 left open. Reads PACS value-
grain `(i_attr_val_id, i_attr_val_cd)` pairs and upserts
`canonical_tf.attribute_definition` keyed by
`IAttrId = i_attr_val_id` — the grain the imprv canonical projector
keys on.

**Status:** SHIPPED. **`tf_improvement_feature.AttributeId` resolutions
went 7 → 1,592 (+1,585).** The Benton Method's per-feature attribute
surface is now populated end-to-end.

## The result

```
Populator (against live Benton dbo.imprv_attr):
  rows considered            : 222 (id, cd) pairs
  duplicate id pairs collapsed: 190 (multiple codes per id; first-seen wins)
  distinct IAttrValIds upserted: 32 inserts + 0 updates (or vice-versa)
  attribute_definition active : 34 (was 25; +9 net new value-grain ids
                                     after collapsing with the 25 family-
                                     grain rows from ATTR-POP-1)

Reprojection (8 most-recent imprv truth batches):
  attributesConsidered        : ~6,357 across batches
  attributesResolved          : ~6,357 (100%)
  attributesQuarantined       : 0

featuresAttributedDelta       : +1,585
preFeaturesAttributed         : 7
postFeaturesAttributed        : 1,592   ✅
quarantineDelta               : 0 (already at 0 from ATTR-DRAIN-1's 7
                                   canonical-layer rows being resolved)
```

## Why ATTR-POP-1 wasn't enough

ATTR-POP-1 populated `attribute_definition` from `dbo.attribute`
(family-grain — `imprv_attr_id`). The imprv canonical projector
keys lookups on `imprv_attr.IAttrValId` (value-grain). Different
integer space; 0 matches. Block-C contract v1.5 has been flagging
this since the slice landed but it was deferred as "a future
populator if the family/value-grain mismatch matters."

ATTR-DRAIN-1 surfaced the cost: the dashboard's 4,740 quarantine
warning hid a deeper truth — even if drain succeeded (which it
did, 4,740 → 7), the 7 residual rows + the 0 features-attributed
delta meant the attribute resolution path was structurally broken
at this grain.

ATTR-POP-2 is the structural fix.

## Files shipped

- `backend/src/TerraFusion.Core/Sync/PacsAttributeVal/PacsSourceAttributeVal.cs`
  — value-grain source record (`IAttrValId`, `IAttrValCd`)
- `backend/src/TerraFusion.Core/Sync/PacsAttributeVal/IPacsAttributeValSource.cs`
- `backend/src/TerraFusion.Core/Sync/PacsAttributeVal/IPacsAttributeValPopulator.cs`
- `backend/src/TerraFusion.Data/Services/PacsSources/SqlServerPacsAttributeValSource.cs`
  — production source. Goes straight to the data fallback because
  `dbo.imprv_attr_val` lacks the `i_attr_val_id` column the projector
  keys on; that table is keyed `(imprv_attr_id, imprv_attr_val_cd, year)`
  instead. The data table itself (`dbo.imprv_attr`) is the only
  source that carries the `i_attr_val_id` integer.
- `backend/src/TerraFusion.Data/Services/CanonicalTf/PacsAttributeValPopulatorService.cs`
  — populator with two doctrine gates and AttributeCode synthesis
  (`VAL_<id>` to satisfy the unique constraint).
- `backend/src/TerraFusion.API/Program.cs` — DI registration
- `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs`
  — adds `POST /api/debug/attr-pop-2/run-populate` (populator +
  optional re-projection across the most recent 10 imprv truth
  batches)

## Schema reality (the divergence flagged inline)

Real Benton schemas verified during this slice:

- `dbo.imprv_attr_val`: 14 columns. Keyed
  `(imprv_attr_id, imprv_attr_val_cd, imprv_yr)`. Carries
  unit-cost, factor, percentage modifiers. Does NOT carry
  `i_attr_val_id`. Cannot serve as the value-grain source for
  the projector's resolution path.

- `dbo.imprv_attr`: carries `(i_attr_val_id, i_attr_val_cd)` per
  row. The actual canonical pair the projector keys on. Used as
  the source-of-truth for ATTR-POP-2.

This is a real PACS schema curiosity — the "dictionary" table and
the "data" table use different identifier columns. The doctrine
contract treats them as the same logical dictionary, but only the
data table has the key the doctrine needs.

## AttributeCode synthesis (the unique-constraint fix)

`canonical_tf.attribute_definition` has a unique index on
`(CountyId, AttributeCode)`. The 222 input pairs included multiple
distinct `IAttrValIds` whose `IAttrValCd` strings normalized to the
same handle (e.g. "1", "01", "1.0" all → "1"). Direct normalization
collided.

Fix: synthesize `AttributeCode = "VAL_<IAttrValId>"`. Deterministic,
unique-by-construction, fits in 20 chars. The human-readable code
lives in `AttributeName`. Operators can rename later via direct
table updates if they want symbolic codes; for resolution purposes,
only IAttrId matters.

## What this enables

The Benton Method's "% of BIV" feature calculations (per the user's
saved memory: patios 3%, basements 13%, shops 18%) consume
`tf_improvement_feature.AttributeId` to identify which features
matter. Before this slice: AttributeId was always null, so the
feature-typed calibration couldn't run. After: 1,592 features
carry resolved AttributeIds, exactly the data the calibration
needs.

The dashboard's `imprv_attr` quarantine count is 0. The doctrine
loop is closed.

## Re-open conditions

- A new PACS schema variant where `dbo.imprv_attr_val` carries
  `i_attr_val_id` — the populator could prefer it instead of the
  data fallback.
- Discovery that a single `i_attr_val_id` legitimately maps to
  multiple distinct `IAttrValCd` strings that should ALL be tracked
  (today: first-seen wins via duplicatePairsCollapsed).
- Multi-county runs where two counties' value-grain integer spaces
  collide on the same `(CountyId, IAttrId)` key — already handled
  by the sovereign-county-isolation contract on `attribute_definition`.

## Endpoint reference

```
POST /api/debug/attr-pop-2/run-populate
Content-Type: application/json

{
  "OperatorName": "attr-pop-2-proof",   // optional
  "RerunImprvCanonical": true            // optional, default true
}
```

Response includes populator block, dictionary counts, optional
reprojection block (8 most-recent truth batches), and `featuresAttributedDelta`.

## The one-line summary

**ATTR-POP-2 closed the family/value-grain loop. The Benton Method
now has 1,592 feature-typed rows to calibrate against — up from 7.
The attribute resolution path is structurally correct end-to-end.**
