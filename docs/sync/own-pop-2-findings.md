# OWN-POP-2 — Findings: WSDOR Doctrine End-to-End Closure

**Slice:** OWN-POP-2 (post-OWN-POP-1). Closes the B-block doctrine
arc by chaining WPOV (B1-C) → B2-B truth → B4 canonical projection
on top of the OWN-POP-1 owner-lane pipeline (so `tf_parcel` and
`tf_owner` xrefs exist when B4 resolves them).

**Status:** PROVEN. `canonical_tf.tf_assessment_wsdor = 199`.
WSDOR closure operational; both parcel and owner xref resolution
succeeded for every promoted truth row.

## The result

```
Owner S1 (TopN=200, sup=0, year>=2018) : 200 landed
Keyed Account S1 (178 acct_ids)        : 178 landed
Keyed Supp S1                          : 200 landed
Keyed Parcel S1 + Spine + Canonical    : 200 → 200 → 200
Owner Truth (B2-A)                     : 200 promoted
Owner Canonical (B3)                   : 178 owners + 200 links + 0 quarantined
WPOV key extraction                    : 200 (prop_id, year, owner_id) triples
Keyed WPOV S1                          : 199 landed (1 triple had no WPOV row)
WPOV Truth (B2-B)                      : 199 promoted (0 rejected)
WSDOR Canonical (B4)                   : 199 projected (0 quarantined)

canonical_tf.tf_assessment_wsdor : 0 → 199   ✅
canonical_tf.tf_owner            : 421 → 955 (+534, from new owner batch)
canonical_tf.tf_parcel           : 1109 (no change; full prop_id overlap)
truth_pacs.wash_prop_owner_val   : 0 → 199
Aggregate assessed value         : $88,068,820
Aggregate market value           : $121,726,190
```

## Why this slice was needed

The owner-WSDOR pipeline shares B-block infrastructure with OWN-POP-1
(parcel xrefs, account batch, supp batch, owner xrefs) but adds two
PACS tables not yet connected to live Harris: `wash_prop_owner_val`
and the WSDOR-grade truth/canonical projections that consume it.

OWN-POP-1 left `canonical_tf.tf_assessment_wsdor` at zero because the
B4 projector requires:
1. A WPOV truth promotion batch (B2-B output) — never landed
2. `tf_parcel` xrefs (parcel canonical) — landed by OWN-POP-1
3. `tf_owner` xrefs (owner canonical) — landed by OWN-POP-1

This slice ships the WPOV connector and chains all 11 stages in one
endpoint.

## Files shipped

- `backend/src/TerraFusion.Data/Services/PacsSources/KeyedSqlServerPacsWashPropOwnerValSource.cs`
  — keyed WPOV source, 600 (prop_id, year, owner_id) triples per
  round-trip (3 params each → 1800 under the 2100 cap)
- `backend/src/TerraFusion.Data/Services/PacsSources/SqlServerPacsWashPropOwnerValSource.cs`
  (modified) — same fixture-vs-real column-name mapping as the keyed
  variant, applied to the production source from OWN-POP-1
- `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs`
  — adds `POST /api/debug/own-pop-2/run-wsdor-closure` (11 stages)

## Fixture-vs-real divergences (2)

### #1: Column-name mapping (10+ columns)

The `PacsSourceWashPropOwnerVal` record was modeled against a
different PACS variant than Benton's. Mapping (entity field ←
Benton column):

| Entity | Benton column |
|---|---|
| `AssessedVal` | `appraised` (Benton's appraised IS the assessed value) |
| `MarketVal` | `market` |
| `AppraisedVal` | `appraised` |
| `TaxableClassified` | `taxable_classified` ✓ same name |
| `TaxableNonClassified` | `taxable_non_classified` ✓ same name |
| `LandTaxableClassified` | `land_hstd_val` (homestead == classified for valuation) |
| `LandTaxableNonClassified` | `land_non_hstd_val` |
| `ImprvTaxableClassified` | `imprv_hstd_val` |
| `ImprvTaxableNonClassified` | `imprv_non_hstd_val` |
| `StateValueClassified` | `appraised_classified` |
| `StateValueNonClassified` | `appraised_non_classified` |
| `BoeStatus` | `boe_status` ✓ same name (but type differs — see #2) |
| `DisasterProrationPct` | `destroyed_prorate_pct` |
| `SnrFrzImprvHs` | `snr_frz_imprv_hs` ✓ same name |
| `SnrFrzLandHs` | `snr_frz_land_hs` ✓ same name |

Fix: SQL aliases at projection time. Doctrine note added in source
class.

Semantic refinement deferred: the homestead-vs-non-homestead axis
(WA-specific) maps loosely onto the entity's classified-vs-
non-classified naming. The aggregate sums match; downstream
consumers that need the precise WA semantics can refine the entity
shape in a future slice.

### #2: `boe_status` is `bit`, not string

Real Benton `dbo.wash_prop_owner_val.boe_status` is a SQL `bit`
column (boolean), but `PacsSourceWashPropOwnerVal.BoeStatus` is
declared `string?`. Reading `bit` then casting to string throws
`InvalidCastException`.

Fix: SQL `CASE WHEN boe_status = 1 THEN 'Y' WHEN boe_status = 0
THEN 'N' END AS boe_status` projects bit to canonical 'Y'/'N'
strings before the .NET reader sees the value.

## Doctrine alignment

Pattern mirrors OWN-POP-1 with WPOV stages chained on:

1. Stages A-G: re-run owner-lane pipeline (smaller TopN since this
   slice's purpose is WSDOR, not owner volume)
2. Stage H: extract WPOV keys from owner truth (not raw owner) so
   only validated `(prop_id, year, owner_id)` triples are queried
3. Stage I: keyed WPOV S1
4. Stage J: WPOV truth (B2-B) — uses the supp batch from stage D
5. Stage K: WSDOR canonical (B4) — resolves both parcel and owner
   xrefs from stages F+G

The truth promoter's `wpov-truth-supp-aware-join` gate verified
that all 199 promoted rows had matching supp pointers and active
sup_num. The B4 canonical projector's `wsdor-projection-coverage`
gate verified that all 199 truth rows resolved both parcel and
owner xrefs.

## What's next

The owner block is now fully closed end-to-end:
- B1-A account ✓
- B1-B owner ✓
- B1-C wash_prop_owner_val ✓
- B2-A truth_pacs.owner_current ✓
- B2-B truth_pacs.wash_prop_owner_val ✓
- B3 canonical_tf.tf_owner + tf_parcel_owner_link ✓
- B4 canonical_tf.tf_assessment_wsdor ✓

Next lanes:
- **IMP-POP-1**: improvement lane (C1-A imprv + C1-B imprv_detail
  + C1-C imprv_attr → truth_pacs.imprv_current → canonical_tf.tf_improvement
  + tf_improvement_feature)
- **LAND-POP-1**: land lane (D1 land_detail → truth_pacs.land_current
  → canonical_tf.tf_land)
- **OWN-POP-3** (deferred): replace the per-stage controller with
  `IPacsOwnerWsdorSyncRunner` integration. Mostly a refactor;
  doesn't unblock new outcomes.

## Endpoint reference

```
POST /api/debug/own-pop-2/run-wsdor-closure
Content-Type: application/json

{
  "OperatorName": "own-pop-2-proof",   // optional, audit anchor
  "OwnerTopN": 200                      // optional, default 200
}
```

Response includes 11 stage blocks, WPOV key extraction count,
aggregate assessed/market sums, gate-resolution counters, and
`counts.canonicalTfAssessmentWsdor`.

## The one-line summary

**OWN-POP-2 closed: live Harris PACS → `canonical_tf.tf_assessment_wsdor > 0`.
The WSDOR pipeline is operational; B-block doctrine arc complete.**
