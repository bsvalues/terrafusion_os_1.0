# Benton Runtime Pilot Closure

Generated: 2026-05-04T16:51:19.497Z

## Status

- Result: FAIL
- June 10 runtime scope: runtime_scope_requires_review
- Allowed runtime claim: Runtime scope requires review before any June 10 runtime claim.
- 39-county runtime claim prohibited: yes

## Benton Proof

- Runtime candidate class: endpoint_error
- Parcel endpoint status: null
- Parcel rows returned: 0
- Sale qualification classification: null
- Canonical sale qualifications: 0
- Ratio-study effective qualified: 0
- Ratio-study decision qualified: 0
- Ratio-study recommendation fallback: 0

## County Scope

- Runtime proven counties: 0
- Evidence-backed load candidates: 0
- Provenance/inventory-only counties: 0

## Blockers

- June 10 runtime scope is runtime_scope_requires_review, expected benton_only_runtime_pilot.
- Expected exactly one runtime-proven county; found 0.
- Expected 38 provenance-only counties; found 0.
- Benton candidate class is endpoint_error.
- Benton runtime row-path proof did not pass.
- Benton parcel endpoint status is null.
- Benton parcel endpoint returned zero runtime rows.
- Benton is missing from sale-qualification lineage proof.

## Warnings

- none

## Closure Rule

This gate fails while Benton qualified-sales lineage is recommendation-backed instead of CanonicalSaleQualifications-backed. Recommendation-backed runtime sales may remain diagnostically useful, but they are not enough to close June 10 Benton runtime pilot readiness.
