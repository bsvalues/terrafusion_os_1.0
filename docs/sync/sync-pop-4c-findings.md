# SYNC-POP-4c — Findings: Canonical Parcel Projection Lands

**Slice:** SYNC-POP-4c (post-SYNC-POP-4b). The terminal layer of the
doctrine parcel pipeline:
`legacy_pacs_raw.property → truth_pacs.parcel_spine →
canonical_tf.tf_parcel + sync_bridge.source_xref`. Writes
TerraFusion-native canonical parcel identity rows AND their lineage
xrefs in one atomic projection.

**Status:** Proven on a 1,000-row TopN sample.
`canonical_tf.tf_parcel` count: **608 rows**.
`source_xref(TfEntityType="parcel")` count: **608**.

## Why this slice is the unblock

The existing `PacsSaleCanonicalProjector` (S3 for sales) resolves
`source_xref` via `tf_parcel.tf_parcel_id`. Without parcel-side
xrefs, every sale projected from `truth_pacs.sale` quarantines with
reason `NoParcelXref`. SYNC-POP-3 closed with `truth_pacs.sale = 3`
(PROVEN) and `canonical_tf.tf_sale = 0` (expected) precisely because
this slice did not yet exist.

This slice writes the parcel xrefs the sale projector has been
waiting for.

## Files shipped

- `backend/src/TerraFusion.Core/Sync/PacsParcelCanonical/IPacsParcelCanonicalProjector.cs`
  — projector contract + result record
- `backend/src/TerraFusion.Data/Services/CanonicalTf/PacsParcelCanonicalProjector.cs`
  — 5-gate projector with idempotency by SourceKeyJson.prop_id
  matching against the spine batch
- `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs`
  — adds `POST /api/debug/sync-pop-4/run-canonical-chain` (S1 + S2-B
  + S3 in one call) and a `ResolveOrCreateBentonCountyAsync` helper
  that looks up Benton by FipsCode='53005' first, then by Name+State,
  before falling back to creation

## Proof outcomes

Local proof run against live Benton `pacs_oltp` (TopN=1000):

| Stage | Result |
|---|---|
| S1 (property landing) | 1,000 rows, R=608 P=380 MH=12 |
| S2-B (spine promotion) | considered=1000 promoted=608 |
| S3 (canonical projection) | considered=608 projected=608 |
| `canonical_tf.tf_parcel` | **608** |
| `source_xref(TfEntityType="parcel")` | **608** |

All 5 promotion gates PASS:
- `canonical-parcel-county-id-supplied` — non-empty Benton county id resolved
- `canonical-parcel-source-batch-completed` — spine batch COMPLETED
- `canonical-parcel-projection-coverage` — informational
- `canonical-parcel-source-xref-coverage` — every tf_parcel has a source_xref
- `canonical-parcel-county-isolation` — every tf_parcel has non-empty CountyId

## Doctrine alignment

Pattern mirrors `PacsSaleCanonicalProjector` exactly:

- Promotion `LoadBatch` opened FIRST so refusals still record
- Idempotency via `SourceKeyJson.prop_id` matching: prior projections
  of the same prop_ids get their `tf_parcel` + `source_xref` rows
  removed before re-insert
- Lineage written as `SourceXref(TfEntityType="parcel",
  SourceTable="property", SourceKeyJson={"prop_id":...},
  IsActive=true)`

**Doctrine refinement:** the parcel xref's `SourceKeyJson` carries
ONLY `prop_id`, not the `(prop_id, prop_val_yr, sup_num)` triple that
the spec doc-comment originally described. Rationale: `dbo.property`
is the master identity table and has no per-year/per-supplement axis;
those columns live on `property_val`. Including fictional
`prop_val_yr=0, sup_num=0` would lie about source reality. The
sale-side xref already carries the full triple because sales are
intrinsically year-keyed.

## County resolution

Benton county id resolves via 3-tier lookup:

1. By `FipsCode = '53005'` (the unique-indexed natural key)
2. By `Name ILIKE 'Benton' AND State ILIKE 'WA'` (case-insensitive)
3. Create if neither matches

Single-county dev posture; multi-county runtimes must manage
`Counties` via the ops API rather than the debug surface.

## What's not yet wired (the remaining SYNC-POP-4 closure)

`canonical_tf.tf_sale` is **still zero** even after this slice
because the bounded TopN parcel sample (1,000 rows) and the bounded
TopN sale sample (500 rows) reference disjoint `prop_id` populations.
The 3 sales SYNC-POP-3 promoted live in `truth_pacs.sale` but their
prop_ids are not among the 608 parcels we projected.

This is the same class of issue SYNC-POP-3 solved for sale↔supp
overlap: bounded samples don't align unless one is keyed off the
other. The fix:

- **SYNC-POP-4d** — keyed parcel closure: extract distinct `prop_id`
  values from the just-landed `truth_pacs.sale` rows, build a
  `KeyedSqlServerPacsPropertySource` (analog of
  `KeyedSqlServerPacsPropSuppAssocSource`), run the full S1→S2-B→S3
  parcel chain ONLY for those prop_ids, then re-run the sale
  canonical projector. Expected: `canonical_tf.tf_sale > 0` (the 3
  promoted sales project successfully because matching parcel xrefs
  now exist). Closes the doctrine end-to-end proof.

## Re-open conditions for SYNC-POP-4c

This slice stays closed unless:

- The doctrine canonical-parcel shape changes (SourceKeyJson schema
  refactored, county-id resolution moved out of the projector, etc.)
- A multi-county runtime requires `tf_parcel` rows from more than one
  county in a single batch.
- Operator workflow surfaces a different lineage anchor (e.g.
  `geo_id`-keyed instead of `prop_id`-keyed).

## Endpoint reference

```
POST /api/debug/sync-pop-4/run-canonical-chain
Content-Type: application/json

{
  "OperatorName": "sync-pop-4c-proof",        // optional, audit anchor
  "TopN": 1000,                                // optional, default 1000
  "PropertyLoadBatchId": null                  // optional; if set, skip S1
}
```

Response includes `s1`/`s2b`/`s3` blocks, `bentonCountyId`,
`counts.canonicalTfParcels`, `counts.parcelSourceXrefs`,
`proofVerdict`, and `nextSlice` pointer.
