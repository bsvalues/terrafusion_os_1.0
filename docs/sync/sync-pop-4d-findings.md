# SYNC-POP-4d — Findings: Doctrine End-to-End Closure

**Slice:** SYNC-POP-4d (terminal). The closure proof of the entire
SYNC-POP arc. Lands sales, runs the targeted-supp chain to promote
sale truth, **extracts the promoted sales' prop_ids**, runs a keyed
parcel chain to land+promote+project ONLY those parcels, then re-runs
sale canonical projection.

**Status:** PROVEN. `canonical_tf.tf_sale = 2`. The doctrine
end-to-end pipeline is operational.

## The result

```
Sale S1                  : 500 landed
Keyed Supp S1            : 441 (4 distinct years)
Sale Truth (S2-B)        : 3 promoted (497 not-qualified, 0 no-supp)
─── extract distinct prop_ids from promoted sales ───
                         : 3 prop_ids
Keyed Parcel S1          : 3 landed (R=2 MH=1)
Parcel Spine (S2-B)      : 2 promoted (1 MH filtered out)
Parcel Canonical (S3)    : 2 tf_parcel + 2 source_xref(parcel)
Sale Canonical (S3)      : 2 projected, 1 quarantined

canonical_tf.tf_sale     : 0 → 2  ✅
canonical_tf.tf_parcel   : 608 → 610
truth_pacs.sale          : 6 → 9
```

The 1 sale quarantine is doctrine-correct: its underlying parcel was
MH (mobile-home) typed, which is excluded from the real-property
spine. The sale projector falls back to `legacy_tf_unproven.sale`
(preserved, not discarded) per the doctrine quarantine pattern.

## Why this slice closes the arc

Earlier slices delivered each layer of the pipeline:
- SYNC-POP-2: connect sale S1 to live Harris PACS
- SYNC-POP-3: prove `truth_pacs.sale > 0` via targeted supp overlap
- SYNC-POP-4a: build raw parcel landing
- SYNC-POP-4b: build truth parcel-spine promotion
- SYNC-POP-4c: build canonical parcel projection (`tf_parcel` + xref)

But each ran with bounded TopN samples that didn't necessarily
overlap across the sale and parcel populations. SYNC-POP-3 closed
with `canonical_tf.tf_sale = 0` because the parcel pipeline didn't
exist. SYNC-POP-4c closed with `canonical_tf.tf_sale = 0` *still*
because the bounded sale sample (TopN=500) and bounded parcel sample
(TopN=1000) were drawn independently from the 89k-parcel corpus —
their prop_ids were disjoint.

This slice is the keying-the-bounded-samples step the closure
required: **the parcel S1/S2-B/S3 chain runs ONLY for prop_ids that
were promoted to truth_pacs.sale**, guaranteeing alignment.

## Files shipped

- `backend/src/TerraFusion.Data/Services/PacsSources/KeyedSqlServerPacsPropertySource.cs`
  — keyed `IPacsPropertySource` analog of
  `KeyedSqlServerPacsPropSuppAssocSource` from SYNC-POP-3. Chunks at
  2000 prop_ids per round-trip (1 parameter each, headroom for the
  2100-param SQL Server cap).
- `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs`
  — adds `POST /api/debug/sync-pop-4/run-final-closure` orchestrating
  all 7 stages (Sale-S1 → Supp-S1 → Sale-S2B → Parcel-S1 → Parcel-S2B
  → Parcel-S3 → Sale-S3) in one call.

## Stage-by-stage proof

| Stage | Input | Output | Status |
|---|---|---|---|
| A. Sale S1 (TopN=500) | live Harris PACS | 500 raw sales | COMPLETED |
| B. Keyed Supp S1 (460 keys) | sale batch | 441 supp pointers | COMPLETED |
| C. Sale truth promotion | sale + supp batches | 3 promoted | COMPLETED |
| D. Extract prop_ids | truth_pacs.sale (this batch) | 3 distinct prop_ids | — |
| E. Keyed Parcel S1 | 3 prop_ids | 3 raw parcels (R=2 MH=1) | COMPLETED |
| F. Parcel spine | parcel batch | 2 spine rows | COMPLETED |
| G. Parcel canonical | spine batch + Benton county | 2 tf_parcel + 2 xref | COMPLETED |
| H. Sale canonical | sale truth batch | 2 projected, 1 quarantined | COMPLETED |

**Final read-back:**
- `truth_pacs.sale` = 9 (was 6; +3 from this run)
- `canonical_tf.tf_parcel` = 610 (was 608; +2 from this run)
- `canonical_tf.tf_sale` = **2** (was 0)

## What this proves

1. **The doctrine pipeline is shape-correct end to end.** Every
   layer's gates passed. Lineage is intact at every hop.

2. **Keying is the primitive that makes bounded samples work.** Both
   SYNC-POP-3 (sale→supp keying) and SYNC-POP-4d (sale→parcel keying)
   demonstrate that targeted source connectors are the operational
   primitive for working against PACS in bounded samples. Production
   landing (full-corpus drains) doesn't need this; proof runs do.

3. **Quarantine works as designed.** The 1 mobile-home-backed sale
   went to `legacy_tf_unproven.sale` with reason `NoParcelXref` —
   exactly the doctrine behavior. Future slices can close the MH
   gap if assessment policy changes; the data is preserved, not
   destroyed.

4. **Single-county Benton (FIPS 53005) runtime is operational.**
   Every projected `tf_parcel` and `tf_sale` carries the correct
   CountyId. The county-isolation gate verified zero leaks.

## What's next (post-SYNC-POP-4)

The doctrine pipeline now exists end-to-end for the sale lane. The
remaining lanes are:

- **Owner lane** — `B1-A` account landing, `B1-B` owner landing,
  `B2-A` truth promotion, `B3` canonical projection. Some of B's
  raw landing services already exist (PacsAccountLandingService,
  PacsOwnerLandingService); the truth and canonical layers are
  partial.
- **Improvement lane** — `C1-*` raw landing exists (imprv,
  imprv_detail, imprv_attr); truth and canonical are partial.
- **Land lane** — `D1` raw landing exists (land_detail); truth
  and canonical are partial.
- **Geometry lane** — `G1` ArcGIS feature-service ingestion exists
  for parcel polygons; the crosswalk back to `tf_parcel` is wired
  via APN/geo_id (G1-E-1).

Each of those lanes can use the same keyed-source primitive proven
here for bounded proof runs against live PACS, then drained
unbounded for production landing.

## Operator endpoint

```
POST /api/debug/sync-pop-4/run-final-closure
Content-Type: application/json

{
  "OperatorName": "sync-pop-4d-final",   // optional, audit anchor
  "SaleTopN": 500                         // optional, default 500
}
```

Response includes 7 stage blocks (`saleS1`, `assocS1`, `saleTruth`,
`keyedParcelExtraction`, `parcelS1`, `parcelSpine`,
`parcelCanonical`, `saleCanonical`), `counts.canonicalTfSales`,
`counts.canonicalTfParcels`, `counts.truthPacsSales`, and a
`proofVerdict`.

## Re-open conditions for SYNC-POP-4d

The arc stays closed unless:

- The doctrine sale-canonical or parcel-canonical projector shape
  changes (new gates, schema refactor, etc.)
- A new lane's closure requires the same keyed-bounded-sample
  pattern (in which case mirror the keyed-source primitive instead
  of reopening this slice).
- Operator workflow surfaces a need for owner-keyed or improvement-
  keyed end-to-end closure proof, at which point a sibling
  SYNC-POP-5 / SYNC-POP-6 / etc. arc opens.

## The one-line summary

**SYNC-POP arc closed: live Harris PACS → `canonical_tf.tf_sale > 0`,
with full provenance, idempotency, and county isolation.**
