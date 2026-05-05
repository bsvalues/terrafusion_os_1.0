# SYNC-POP-4b — Findings: Real-Property Spine Promoted to Truth

**Slice:** SYNC-POP-4b (post-SYNC-POP-4a). The middle layer of the
doctrine parcel pipeline:
`legacy_pacs_raw.property → truth_pacs.parcel_spine →
canonical_tf.tf_parcel`. Lands the S2-B promoter only — the canonical
projection is SYNC-POP-4c.

**Status:** Proven on a 1,000-row TopN sample.
`truth_pacs.parcel_spine` count: **608 rows** (the operative proof).
The 392 rejected = 380 P + 12 MH, exactly matching SYNC-POP-4a's S1
type distribution.

## Why the spine is simpler than the sale truth

The sale truth promoter (S2-B for sales) requires TWO source batches
(`sale` + `prop_supp_assoc`) because the supp-aware-join is mandatory
for sale qualification. Parcels are different:

- The parcel master (`dbo.property`) is **the** identity table —
  there is no supplement axis at this layer. (`sup_num` discrimination
  lives on `property_val`, which is a per-year/per-supplement table.)
- Real-property qualification is a single-column filter
  (`prop_type_cd = 'R'`), not a multi-table join.

The parcel-spine promoter therefore takes one source batch
(property), runs one filter, and writes one truth table. Four gates
fit cleanly:

1. `truth-pacs-parcel-source-batch-completed` — source MUST be COMPLETED
2. `truth-pacs-parcel-real-property-filter` — informational distribution
3. `truth-pacs-parcel-prop-id-uniqueness` — defense-in-depth over S1
4. `truth-pacs-parcel-promotion-coverage` — every spine row carries lineage

## Files shipped

- `backend/src/TerraFusion.Core/Entities/TruthPacs/TruthPacsParcelSpine.cs`
  — truth entity (10 columns: `TruthParcelId` + identity surface +
  `PropCreateDt` + lineage trio)
- `backend/src/TerraFusion.Data/Configurations/TruthPacs/TruthPacsParcelSpineConfiguration.cs`
  — EF configuration with 4 indexes
- `backend/src/TerraFusion.Core/Sync/PacsParcelTruth/IPacsParcelSpineTruthPromoter.cs`
  — orchestrator interface + result record
- `backend/src/TerraFusion.Data/Services/TruthPacs/PacsParcelSpineTruthPromoter.cs`
  — promoter with 4 gates + idempotency by `PropertyLoadBatchId`
- `backend/src/TerraFusion.Data/Migrations/20260504220616_AddTruthPacsParcelSpineTable.cs`
  — clean Up/Down for the new table
- `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs`
  — adds `POST /api/debug/sync-pop-4/run-spine-chain` (S1 + S2-B
  in one call; can also skip S1 by passing an existing
  `PropertyLoadBatchId`)

## Proof outcomes

Local proof run against live Benton `pacs_oltp` (TopN=1000):

| Stage | Result |
|---|---|
| S1 (property landing) | 1,000 rows, type R=608 P=380 MH=12 |
| S2-B (spine promotion) | considered=1000 promoted=608 notReal=392 dup=0 |
| Idempotency | priorRowsRemoved=0 (first run) |

`truth_pacs.parcel_spine` after run: **608**.

All 4 gates PASS:
- source-batch-completed: PASS
- real-property-filter: PASS (informational)
- prop-id-uniqueness: PASS — 0 duplicates
- promotion-coverage: PASS — all 608 rows carry full lineage

## Doctrine alignment

Pattern mirrors `PacsSaleTruthPromoter` exactly except for the
single-source simplification documented above:

- Promotion `LoadBatch` opened FIRST so refusals still record
- Idempotency via `RemoveRange` keyed on `PropertyLoadBatchId`
- Gates written via `_db.SyncBridgePromotionGateResults.Add`
- Lineage trio (`SourcePropertyLandedRowId`, `PropertyLoadBatchId`,
  `PromotionLoadBatchId`) is the doctrine's traceback surface — every
  spine row maps cleanly to its raw origin.

No doctrine destination service was modified.

## What's not yet wired

This slice is **only** the truth-spine middle layer. The full doctrine
parcel pipeline still needs:

- **SYNC-POP-4c** — `canonical_tf.tf_parcel` projector:
  - write `TfParcel` rows from the truth spine (with their own GUID
    `TfParcelId`)
  - write `SourceXref(TfEntityType="parcel")` with
    `SourceKeyJson{prop_id}` per the Sync Bridge v1 doctrine
  - this is what unblocks `canonical_tf.tf_sale > 0` (S3 sale
    projection resolves source_xref via `tf_parcel.tf_parcel_id`)

- **SYNC-POP-4d** — re-run SYNC-POP-3 chain with
  `RunCanonicalProjection=true`. Expected: `canonical_tf.tf_sale > 0`
  (the original 3 promoted sales now project successfully because
  `tf_parcel` rows exist for their `prop_ids`). Closes the doctrine
  end-to-end proof.

## Re-open conditions for SYNC-POP-4b

This slice stays closed unless:

- The doctrine parcel-truth shape changes (e.g. multi-axis
  qualification beyond `prop_type_cd`, or supp-aware-join introduced
  retroactively at this layer).
- A retired-parcel filter becomes mandatory at the truth tier
  (would require landing `property_val` first).
- Operator workflow surfaces a different identity-stable axis (e.g.
  `geo_id`-keyed promotion instead of `prop_id`-keyed).

## Endpoint reference

```
POST /api/debug/sync-pop-4/run-spine-chain
Content-Type: application/json

{
  "OperatorName": "sync-pop-4b-proof",        // optional, audit anchor
  "TopN": 1000,                                // optional, default 1000
  "PropertyLoadBatchId": null                  // optional; if set, skip S1
}
```

Response includes `s1` (when freshly landed), `s2b` (status, batch,
counters), `counts.truthPacsParcelSpine`, `proofVerdict`, and
`nextSlice` pointer.
