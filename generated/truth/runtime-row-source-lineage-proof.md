# Runtime Row Source Lineage Proof

Generated: 2026-05-02T01:31:52.572Z
Runtime base URL: `http://localhost:5046`

| County | Endpoint | Status | Payload County | Classification | Properties | Comparable Sales | Canonical Sale Qualifications | Source Parcels | Source Sales | County Runtime Mock | Elite Ops Mock | Result | Blockers |
|---|---|---:|---|---|---:|---:|---:|---:|---:|---|---|---|---|
Benton | `http://localhost:5046/api/counties/benton/runtime-lineage` | 200 | Benton County | pacs_mirror_projected_runtime_partial | 128788 | 259102 | 0 | 128950 | 440274 | no | yes | PASS | -

## Summary

- Candidates checked: 1
- Passed: 1
- Failed: 0
- Total canonical rows counted: 387890
- Total source rows counted: 569224
- Mock-runtime enabled responses: 0
- Elite Operations mock enabled responses: 1
- Silent Benton fallbacks: 0

## Scope Note

This proof only verifies runtime lineage counts and endpoint posture. It does not certify scraper completeness, official county calibration, or June 10 readiness by itself.
