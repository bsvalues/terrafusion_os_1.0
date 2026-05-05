# SYNC-POP-4a — Findings: Doctrine Parcel Pipeline, Stage 1

**Slice:** SYNC-POP-4a (post-SYNC-POP-3). First half of the
doctrine-pure parcel pipeline that the canonical projection
(`canonical_tf.tf_sale → tf_parcel.source_xref` resolution) has been
waiting for since SYNC-POP-3 closed with 0 projected sales. Lands the
S1 raw tier only — `legacy_pacs_raw.property`. Truth (4b) and
canonical (4c) are separate slices.

**Status:** Proven on a 1,000-row TopN sample.
`legacy_pacs_raw.property` count: **1,000 rows** (the operative
proof). Type distribution real Benton vocabulary surfaced cleanly.

## Why a separate parcel slice

SYNC-POP-3 proved `truth_pacs.sale > 0` (3 sales promoted). The
expected zero on `canonical_tf.tf_sale` was diagnosed cleanly: the S3
projector resolves `source_xref` via `tf_parcel.tf_parcel_id`, and
`canonical_tf.tf_parcel` is empty until the parcel pipeline lands
separately. SYNC-POP-3's findings explicitly named this as the next
prerequisite.

This slice introduces the foundation: the master parcel identity
table (`legacy_pacs_raw.property`) that anchors every downstream
sale, owner, improvement, land, and value record. Subsequent slices
(4b/4c) build on top to populate truth and canonical.

## Files shipped

- `backend/src/TerraFusion.Core/Entities/LegacyPacsRaw/LegacyPacsRawProperty.cs`
  — landing entity (10 columns: identity + identifying surface +
  prop_create_dt + provenance trio)
- `backend/src/TerraFusion.Data/Configurations/LegacyPacsRaw/LegacyPacsRawPropertyConfiguration.cs`
  — EF configuration with 3 indexes (prop_id, load_batch, prop_type_cd)
- `backend/src/TerraFusion.Core/Sync/PacsProperty/PacsSourceProperty.cs`
  — source-shaped record (8 fields)
- `backend/src/TerraFusion.Core/Sync/PacsProperty/IPacsPropertySource.cs`
  — source-side abstraction
- `backend/src/TerraFusion.Core/Sync/PacsProperty/IPacsPropertyLandingService.cs`
  — orchestrator interface + result record
- `backend/src/TerraFusion.Data/Services/PacsSources/SqlServerPacsPropertySource.cs`
  — production source against live `pacs_oltp.dbo.property`
- `backend/src/TerraFusion.Data/Services/LegacyPacsRaw/PacsPropertyLandingService.cs`
  — landing orchestrator with 4 promotion gates
- `backend/src/TerraFusion.Data/Migrations/20260504212911_AddLegacyPacsRawPropertyTable.cs`
  — clean Up/Down for the new table (AlterColumn from SYNC-POP-2's
  hand-written migration intentionally removed; see migration comment)
- `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs`
  — adds `POST /api/debug/sync-pop-4/run-property-landing`

## Proof outcomes

Local proof run against live Benton `pacs_oltp` (TopN=1000):

| Gate | Result |
|---|---|
| property-type-distribution | PASS — R=608, P=380, MH=12 |
| prop-id-uniqueness | PASS — 0 duplicates |
| provenance-coverage | PASS — all 1,000 rows carry load_batch + query_hash |
| create-date-coverage | PASS — withCreateDt=1000 withoutCreateDt=0 |

`legacy_pacs_raw.property` after run: **1,000**.

## Fixture-vs-real divergences uncovered

Two divergences from the initial design surfaced and were fixed
inline:

1. **`prop_inactive_dt` does not exist on `dbo.property`.** Real
   Benton Harris PACS has 34 columns on `property` and none of them
   carry retired-state. Lifecycle tracking lives on
   `dbo.property_val(prop_id, prop_val_yr, sup_num).prop_inactive_dt`.
   Fix: dropped `PropInactiveDt` from the entity / source / record /
   gates. Lifecycle resolution deferred to SYNC-POP-4b's truth
   promoter, which will join `property_val`. The 4th gate became
   `create-date-coverage` (informational, replaces what would have
   been an active/inactive split).

2. **`prop_type_cd` carries 2-character values (`MH`), not the
   single-char vocabulary I'd assumed.** Real Benton ratio: 608 R /
   380 P / 12 MH per the proof histogram. The schema declares
   `char(5)` but in practice 2 chars is the max observed; I widened
   the doctrine column to 8 for headroom. Doctrine comment on the
   entity now reflects actual Benton vocabulary.

## Doctrine alignment

Pattern mirrors the existing doctrine sale pipeline exactly:

- Entity in `legacy_pacs_raw` schema with synthetic `LandedRowId`
  + provenance trio (`LoadBatchId`, `SourceQueryHash`, `SourceRowHash`)
- EF configuration with operational indexes for the upcoming truth
  promoter's lookup paths
- `PacsSourceProperty` record as the source/landing seam
- `IPacsPropertySource` interface so the landing service does not
  couple to any specific PACS connection
- `SqlServerPacsPropertySource` with TopN-guarded proof mode +
  unbounded production mode
- Landing service mirroring `PacsSaleLandingService`'s 4-gate shape:
  distribution + uniqueness + provenance + informational

No doctrine destination service was modified. The pipeline is
additive.

## What's not yet wired (the SYNC-POP-4 arc)

This slice is **only** the raw landing tier. The full doctrine parcel
pipeline still needs:

- **SYNC-POP-4b** — `truth_pacs.parcel_spine` promoter:
  - filter `prop_type_cd = 'R'` (real property only — sales pipeline
    semantics target real parcels)
  - join `dbo.property_val` for lifecycle resolution
  - resolve `prop_id` to the canonical parcel identity
  - 5+ promotion gates per the doctrine pattern

- **SYNC-POP-4c** — `canonical_tf.tf_parcel` projector:
  - write `TfParcel` rows from the truth spine
  - write `SourceXref(TfEntityType="parcel")` with
    `SourceKeyJson{prop_id}` per the Sync Bridge v1 doctrine
  - this is what unblocks `canonical_tf.tf_sale > 0`

- **SYNC-POP-4d** — re-run SYNC-POP-3 chain with
  `RunCanonicalProjection=true`. Expected:
  `canonical_tf.tf_sale > 0` (the original 3 promoted sales now
  project successfully because `tf_parcel` rows exist for their
  prop_ids). This closes the doctrine end-to-end proof loop.

## Re-open conditions for SYNC-POP-4a

This slice stays closed unless:

- Real Benton PACS column shape on `dbo.property` changes (new
  active/inactive column added, type vocabulary extended past
  varchar(8), etc.).
- The doctrine landing pattern itself shifts (e.g. provenance trio
  expanded to a quartet) — at which point all S1 services need
  realignment, not just this one.
- Operator workflow surfaces a need for a different identity-key
  set on the parcel landing tier (e.g. add `geo_id` as a secondary
  index for legal-description lookups before 4b lands).

## Boundary

This slice deliberately does **not** include:

- Truth promotion or canonical projection for parcels (those are 4b/4c)
- Joining `property_val` for lifecycle, valuation, or supplement
  context (that's 4b's job)
- Any of the 4 still-missing source interfaces (Account / Owner /
  Improvement / Land / Geometry) — these have their own slices
- Operator UI
- Production deployment
- Changes to existing doctrine landing/promotion/projection services

## Endpoint reference

```
POST /api/debug/sync-pop-4/run-property-landing
Content-Type: application/json

{
  "OperatorName": "sync-pop-4a-proof",   // optional, audit anchor
  "TopN": 1000                            // optional, default 1000
}
```

Response includes `s1` (status, batch, type distribution, gate
counters), `counts.legacyPacsRawProperties`, `proofVerdict`, and
`nextSlice` pointer.
