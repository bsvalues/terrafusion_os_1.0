# Runtime Sale Qualification Lineage Proof

Generated: 2026-05-02T04:10:18.885Z
Runtime base URL: `http://localhost:5000`

| County | Classification | Comparable Sales | Source Sales | Canonical Qualifications | All Sales | Recommendations | Recommendation Coverage % | Window Sales | Effective Qualified | Decision Qualified | Recommendation Fallback | Result | Blockers | Warnings |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|---|---|
Benton | recommendation_backed_canonical_landing_missing | 259102 | 440274 | 0 | 259102 | 259102 | 100 | 52 | 36 | 0 | 36 | PASS | - | CanonicalSaleQualifications landing table is empty for this county.<br>Ratio-study qualified pool is recommendation-backed, not final-decision-backed.<br>Elite Operations mock flag is enabled; county runtime mock flag is false.

## Summary

- Candidates checked: 1
- Passed: 1
- Failed: 0
- Warnings: 3
- Canonical landing backed: 0
- Recommendation-backed with canonical landing missing: 1

## Interpretation

A PASS means the live runtime has a usable qualified-sale pool without silent fallback or county-row mock data. Warnings identify weaker lineage, especially when the pool is backed by ComparableSales recommendations instead of CanonicalSaleQualifications landing rows.
