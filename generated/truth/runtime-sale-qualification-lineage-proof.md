# Runtime Sale Qualification Lineage Proof

Generated: 2026-05-04T17:17:48.816Z
Runtime base URL: `http://localhost:5046`

| County | Classification | Source Lineage Trusted | Comparable Sales | Source Sales | Canonical Qualifications | All Sales | Recommendations | Recommendation Coverage % | Window Sales | Effective Qualified | Decision Qualified | Recommendation Fallback | Result | Blockers | Warnings |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|---|---|
Benton | recommendation_backed_canonical_landing_missing | no | 259102 | 440274 | 0 | 259102 | 259102 | 100 | 52 | 36 | 0 | 36 | FAIL | Runtime source-lineage proof is not trusted: Runtime DB identity proof is not trusted: Runtime Properties count 128788 does not match configured Benton parcel count 89447. | CanonicalSaleQualifications landing table is empty for this county.<br>Ratio-study qualified pool is recommendation-backed, not final-decision-backed.<br>Elite Operations mock flag is enabled; county runtime mock flag is false.

## Summary

- Candidates checked: 1
- Passed: 0
- Failed: 1
- Warnings: 3
- Canonical landing backed: 0
- Recommendation-backed with canonical landing missing: 1
- Result: FAIL

## Blockers

- Benton: Runtime source-lineage proof is not trusted: Runtime DB identity proof is not trusted: Runtime Properties count 128788 does not match configured Benton parcel count 89447.

## Interpretation

A PASS means the live runtime has a usable qualified-sale pool without silent fallback or county-row mock data. Warnings identify weaker lineage, especially when the pool is backed by ComparableSales recommendations instead of CanonicalSaleQualifications landing rows.
