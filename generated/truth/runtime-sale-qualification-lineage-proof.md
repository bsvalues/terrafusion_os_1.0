# Runtime Sale Qualification Lineage Proof

Generated: 2026-05-04T16:49:28.533Z
Runtime base URL: `http://localhost:5046`

| County | Classification | Source Lineage Trusted | Comparable Sales | Source Sales | Canonical Qualifications | All Sales | Recommendations | Recommendation Coverage % | Window Sales | Effective Qualified | Decision Qualified | Recommendation Fallback | Result | Blockers | Warnings |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|---|---|

## Summary

- Candidates checked: 0
- Passed: 0
- Failed: 0
- Warnings: 0
- Canonical landing backed: 0
- Recommendation-backed with canonical landing missing: 0
- Result: FAIL

## Blockers

- No runtime sale qualification candidates were found. Run runtime source-lineage proof or set TF_RUNTIME_SALE_QUALIFICATION_CANDIDATES.

## Interpretation

A PASS means the live runtime has a usable qualified-sale pool without silent fallback or county-row mock data. Warnings identify weaker lineage, especially when the pool is backed by ComparableSales recommendations instead of CanonicalSaleQualifications landing rows.
