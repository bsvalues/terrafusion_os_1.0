# LAND-POP-1 — Findings: Land-Lane Doctrine End-to-End Closure

**Slice:** LAND-POP-1 (post-IMP-POP-1). D-block doctrine arc:
connects land_detail (D1) to live Harris PACS, promotes through L2
truth, projects through L3 canonical (`tf_land`).

**Status:** PROVEN. `canonical_tf.tf_land = 239`. D-block lane
operational; doctrine end-to-end closure complete for the four core
domain lanes (sale, owner, improvement, land).

## The result

```
Owner-seed S1 (TopN=200)              : 200 owners → 200 R prop_ids
Keyed Parcel S1 + Spine + Canonical    : 200 R → 200 → 200
Keyed Supp S1 (year=2026)              : 200 supp pointers
Keyed Land S1                          : 239 land_detail rows
Land Truth (L2)                        : 239 promoted (0 rejected)
Land Canonical (L3)                    : 239 tf_land + 0 quarantined

canonical_tf.tf_land             : 0 → 239   ✅
truth_pacs.land_current          : 0 → 239
Total acres projected            : 40,813
Total market value projected     : $73,604,080
```

200 parcels → 239 land segments means ~20% of parcels have multi-
segment land descriptions (typical for the ag/timber/residential
splits common in Benton's rural-urban mix).

## Files shipped

- `backend/src/TerraFusion.Data/Services/PacsSources/KeyedSqlServerPacsLandDetailSource.cs`
  — keyed land_detail source, 1000 (prop_id, prop_val_yr) tuples
  per round-trip
- `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs`
  — adds `POST /api/debug/land-pop-1/run-final-closure` (8 stages)

## Fixture-vs-real divergences (1 mass remap, 8 columns)

The `PacsSourceLandDetail` record was modeled against a different
PACS schema variant. Real Benton `dbo.land_detail` uses different
column names for nearly every business field:

| Entity field | Benton column |
|---|---|
| `LandSegTypeCd` | `land_type_cd` (no "_seg" prefix) |
| `LandSegStateCd` | `state_cd` |
| `LandSegClassCd` | `land_class_code` |
| `LandSegUseCd` | `primary_use_cd` |
| `SoilCd` | `land_soil_code` |
| `LandSegMarketVal` | `land_seg_mkt_val` (truncated suffix) |
| `LandSegAgValue` | `ag_val` |
| `LandSegAssessedVal` | (no equivalent — projected NULL) |
| `LandSegEffAge` | (no equivalent — projected NULL) |

`size_acres`, `size_square_feet`, `land_seg_homesite`, and
`land_seg_id` matched verbatim.

Fix: SQL aliases at projection time. Doctrine note added in source
class. Two fields with no Benton equivalent project NULL — they're
not consulted by the L2 truth promoter or L3 canonical projector
gates.

## Doctrine alignment

8 stages mirror the established keyed-source closure pattern:

1. A0. Owner seed (real-property guarantee)
2. A. Keyed parcel S1 → spine → canonical
3. B. Extract (prop_id, year=2026) keys
4. C. Keyed supp S1
5. D. Keyed land_detail S1
6. E. Land truth (L2)
7. F. Land canonical (L3)

The L3 projector resolved parcel xrefs from stage A and wrote
`tf_land` rows verbatim from the truth segments. 0 quarantined =
every land segment had a resolvable parcel xref.

## D-block status: COMPLETE

| Slice | Status |
|---|---|
| D1 land_detail landing | ✓ |
| L2 truth_pacs.land_current | ✓ |
| L3 canonical_tf.tf_land | ✓ |

## What's next

The four core domain lanes are now all closed end-to-end against
live Harris PACS. Aggregate state of the canonical layer:

| Canonical table | Count |
|---|---|
| `tf_parcel` | 1109+ |
| `tf_sale` | 2 |
| `tf_owner` | 955 |
| `tf_parcel_owner_link` | 500+ |
| `tf_assessment_wsdor` | 199 |
| `tf_improvement` | 241 |
| `tf_improvement_feature` | 2262 |
| `tf_land` | 239 |

Future work focuses on enrichment, scale, and operator UI:

- **OWN-POP-3** (deferred): replace per-stage controllers with
  `IPacsOwnerWsdorSyncRunner` integration. Refactor only.
- **Production drains**: replace TopN-bounded sources with
  full-corpus sources for each lane. The connection classes are
  already in place; only orchestration changes.
- **Operator UI**: surface the closure proofs via the operator
  dashboard so cross-county runs are no longer debug-controller
  invocations.
- **Geometry lane (G-block)**: ArcGIS feature-service ingestion +
  APN crosswalk (G1-E-1 already wired). Not blocked.

## Re-open conditions for LAND-POP-1

- The `PacsSourceLandDetail` record changes shape (e.g.
  LandSegAssessedVal getting a real-PACS source).
- Real Benton dbo.land_detail adds new columns the entity should
  carry (e.g. eff_size_acres for current-use program tracking).

## Endpoint reference

```
POST /api/debug/land-pop-1/run-final-closure
Content-Type: application/json

{
  "OperatorName": "land-pop-1-proof",  // optional, audit anchor
  "ParcelTopN": 200,                    // optional, default 200
  "WorkingYear": 2026                    // optional, default 2026
}
```

Response includes 8 stage blocks, key extraction count, aggregate
acres/market sums, and `counts.canonicalTfLands`.

## The one-line summary

**LAND-POP-1 closed: live Harris PACS → `canonical_tf.tf_land > 0`.
D-block doctrine arc complete; four-lane closure proven end-to-end.**
