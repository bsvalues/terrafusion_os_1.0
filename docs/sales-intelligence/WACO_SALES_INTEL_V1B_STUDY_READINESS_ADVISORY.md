# WACO Sales Intelligence V1b — Washington study-readiness advisory

**Work order:** WACO lane C, child WO-104 V1b  
**Endpoint:** `GET /api/terraforge/ratio-study/readiness`  
**Study seam:** `DOR_RATIO` through `IRatioQualificationPolicy`  
**Mode:** read-only advisory

## Contract

The endpoint is county-scoped through the existing authenticated TerraForge
county context. It reports, for the requested tax year:

- candidate sales in the existing ratio-study date window;
- sales reviewed by the `DOR_RATIO` doctrine rule;
- sales qualified by that rule;
- sales without a matching policy evaluation; and
- whether a `DOR_RATIO` rule covers the requested year.

The DOR policy source field is the existing `sale.sl_ratio_type_cd` surface,
represented on `ComparableSale.RawRatioTypeCd`. The endpoint does not infer
qualification from a different county-ratio surface and does not alter the
existing TerraForge ratio-study population or statistics.

## Truth boundary

The response is always labelled `advisoryOnly: true` and
`certificationClaim: false`. `qualifiedSalesObserved` means only that the
read-only doctrine policy observed one or more qualifying sales in the scoped
package. It is not Washington Department of Revenue certification, filing
readiness, approval, or authority to mutate production data.

Missing county identity, missing policy service, missing policy coverage, and
policy lookup failures return truthful unavailable metadata rather than a
readiness claim or a mutation.

## Verification

The existing `RatioStudyTests` seam covers:

- `DOR_RATIO` policy usage;
- county isolation;
- additive advisory metadata;
- the read-only/certification boundary; and
- no production mutation.
