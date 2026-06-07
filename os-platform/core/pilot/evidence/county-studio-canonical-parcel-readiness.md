# County Studio Canonical Parcel Readiness

Generated: 2026-06-07T17:27:00.741Z

Status: CANONICAL_PARCEL_READINESS_CORRECTED_BACKEND_HEALTH_BLOCKED

## Decision

- Real Dev Server: BLOCKED
- Production Proof: BLOCKED
- Operational Proof: BLOCKED

## Finding

`canonicalParcel=0` was not accepted as proof that Benton canonical parcels are absent. The canonical table was audited directly and then through the live readiness gate.

Current runtime evidence:

| Source | Query/Table | Count |
| --- | --- | ---: |
| Canonical parcel | `canonical_tf.tf_parcel` | 3,198,979 |
| Property identity landing | `legacy_pacs_raw.property` | 1,190,834 |
| Truth parcel spine | `truth_pacs.parcel_spine` | 83,326 |
| TerraAtlas parcel geometry | `gis_tf.tf_parcel_geom` | 80,075 |
| Account | `legacy_pacs_raw.account` | 535,140 |

## Classification

- `forgeDevRequiresCanonicalParcel`: false
- `productionProofRequiresCanonicalParcel`: true

County Studio Forge dev can run when real property identity, truth parcel, map, ledger, and inspector dependencies are readable. Canonical parcel remains visible and production-proof relevant, but it is not the only valid Forge-dev parcel identity path.

## Gate Correction

The readiness gate now keeps canonical parcel counts visible while preventing a zero/unavailable canonical count from becoming the sole Forge-dev blocker when real parcel identity exists through landing/truth paths. Production and operational proof remain blocked.

## Current Non-Canonical Blocker

The latest live readiness refresh is still blocked, but not by canonical parcel:

```text
backend health: Backend health is not proven.
localhost:5000 and localhost:5046 are not responding.
```

That backend-health issue is separate from canonical parcel readiness.

## Boundaries

- No County Studio UI changed.
- No TerraFusion Sync mutation.
- No DB seeding change.
- No parcel counts invented.
- `productionProofAllowed=false`
- `operationalProofAllowed=false`
