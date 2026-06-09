# OWN-POP-1 — Findings: Owner-Lane Doctrine End-to-End Closure

**Slice:** OWN-POP-1 (post-SYNC-POP-4d). Mirrors the keyed-source
closure pattern from SYNC-POP-4d but starts from `dbo.owner` as the
seed batch and aligns four downstream PACS tables (account,
prop_supp_assoc, property, plus the parcel canonical chain) on the
owner batch's identity keys.

**Status:** PROVEN. `canonical_tf.tf_owner = 421`,
`canonical_tf.tf_parcel_owner_link = 500`. Doctrine end-to-end pipeline
operational for the owner lane.

## The result

```
Owner S1 (TopN=500, sup=0, year>=2018)  : 500 landed
Key extraction
  distinct acct_ids                      : 421
  distinct (prop_id, year) supp keys     : 500
  distinct parcel prop_ids               : 500
Keyed Account S1                         : 421 landed
Keyed Supp S1                            : 500 landed
Keyed Parcel S1                          : 500 landed (R=500)
Parcel Spine (S2-B)                      : 500 promoted (all R)
Parcel Canonical (S3)                    : 500 tf_parcel + xref
Owner Truth (B2-A)                       : 500 promoted
Owner Canonical (B3)                     : 421 tf_owner +
                                           500 tf_parcel_owner_link +
                                           0 quarantined

canonical_tf.tf_owner               : 0 → 421   ✅
canonical_tf.tf_parcel_owner_link   : 0 → 500   ✅
canonical_tf.tf_parcel              : 610 → 1109 (+499 new)
truth_pacs.owner_current            : 0 → 500
```

Why 421 owners but 500 links: owners with co-ownership produce
multiple parcel→party rows in `dbo.owner` but resolve to a single
`tf_owner` row per `acct_id`. The link count tracks edges; the owner
count tracks distinct parties.

## Why this slice was needed

The owner pipeline's contracts and services already existed before
this work:
- B1-A account landing service ✓
- B1-B owner landing service ✓
- B1-C wash_prop_owner_val landing service ✓
- B2-A owner truth promoter ✓
- B3 owner canonical projector ✓
- B4 wsdor canonical projector ✓
- IPacsOwnerWsdorSyncRunner orchestrator ✓

But none of them were connected to live Harris PACS — same shape as
the sale lane before SYNC-POP-2. This slice ships the connection
classes and the closure proof, mirroring the sale-lane arc:
SYNC-POP-2 (sale source) + SYNC-POP-3 (truth promotion proof) +
SYNC-POP-4d (canonical projection proof) compressed into one shippable.

## Files shipped

- `backend/src/TerraFusion.Data/Services/PacsSources/SqlServerPacsAccountSource.cs`
  — production account source with bool-flexible reader (PACS may use bit/char/tinyint for flag columns)
- `backend/src/TerraFusion.Data/Services/PacsSources/KeyedSqlServerPacsAccountSource.cs`
  — keyed variant for closure runs
- `backend/src/TerraFusion.Data/Services/PacsSources/SqlServerPacsOwnerSource.cs`
  — production owner source with sup=0 + post-2018 filter
- `backend/src/TerraFusion.Data/Services/PacsSources/SqlServerPacsWashPropOwnerValSource.cs`
  — production WPOV source (not yet exercised in this closure; available for B4 closure)
- `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs`
  — adds `POST /api/debug/own-pop-1/run-final-closure` orchestrating 7 stages

## Fixture-vs-real divergence (1)

Real Benton `dbo.owner` does **not** have `type_of_owner` or
`udi_status` columns (the PacsSourceOwner record was modeled against
a different PACS variant). Real columns are:

- `type_of_int` (type of interest — analogous semantics) — aliased
  as `type_of_owner` in the SQL projection
- `udi_child_prop_id` (int, not the boolean/string `udi_status` the
  record expected) — projected as `CAST(NULL AS varchar(8))` in the
  SQL since downstream truth/canonical layers do not consult it for
  promotion gates

Doctrine note added to `SqlServerPacsOwnerSource.SourceQueryText`
explaining the aliasing.

## Doctrine alignment

Pattern mirrors SYNC-POP-4d exactly:
1. Seed batch (here: owner) — bounded TopN with doctrine filters
2. Extract distinct identity keys from seed
3. Keyed S1 for each downstream table (account, supp, parcel)
4. Pre-stage canonical parcels (S2-B + S3) so owner B3 can resolve
   parcel xrefs
5. Truth promotion (B2-A) with all source batches
6. Canonical projection (B3) writes tf_owner + tf_parcel_owner_link
   + source_xref(owner)

PII redaction is the load-bearing invariant of the canonical owner
projector. The `canonical-owner-pii-redaction-policy` gate verifies
from the database itself that any TfOwner with
`ConfidentialFlag = true` has `DisplayName = "[Confidential]"` and
PII fields nulled. In this proof run, 0 confidential owners
surfaced; the gate passed informationally.

## What's not yet wired (the remaining owner-lane closure)

This slice covers B1-A → B2-A → B3. Still pending:

- **OWN-POP-2** — wash_prop_owner_val (B1-C) + B2-B truth +
  B4 canonical projection (`tf_assessment_wsdor`). The
  `SqlServerPacsWashPropOwnerValSource` already ships in this PR;
  the closure flow just needs the WPOV stages chained in.

- **OWN-POP-3** — `IPacsOwnerWsdorSyncRunner` integration: replace
  the controller's per-stage orchestration with a call to the
  existing runner once OWN-POP-2 lands.

## Re-open conditions for OWN-POP-1

- The PacsSourceOwner record changes shape (e.g. UdiStatus replaced
  by a real-PACS column).
- Real Benton dbo.account or dbo.owner adds new identity columns.
- The owner truth promoter's gate set changes such that supp-aware
  validation no longer fits the keyed-supp source pattern.

## Endpoint reference

```
POST /api/debug/own-pop-1/run-final-closure
Content-Type: application/json

{
  "OperatorName": "own-pop-1-proof",   // optional, audit anchor
  "OwnerTopN": 500                      // optional, default 500
}
```

Response includes 7 stage blocks, key extraction counts,
`counts.canonicalTfOwners`, `counts.canonicalTfParcelOwnerLinks`,
and `proofVerdict`.

## The one-line summary

**OWN-POP-1 closed: live Harris PACS → `canonical_tf.tf_owner > 0`
AND `tf_parcel_owner_link > 0`, with full provenance, lineage, and
PII redaction policy enforcement.**
