# Wave 2 Prefixed Identity Repair Dry-Run

Generated: 2026-05-26T22:59:49.386Z

## Summary

- Counties checked: 4
- Proposed canonical rows touched if later authorized: 516423
- Duplicate target groups after dry-run: 0
- Database mutation attempted: no
- Production binding allowed: no

## County Results

| County | FIPS | Proposed rows | Source IDs | Source overlap after prefix removal | Duplicate groups after | Classification |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| Kitsap | 53035 | 116900 | 23126 | 20406 | 0 | dry_run_pass_pending_delta_adjudication |
| Pierce | 53053 | 328832 | 262058 | 252992 | 0 | dry_run_pass_pending_delta_adjudication |
| Klickitat | 53039 | 21305 | 665 | 653 | 0 | dry_run_pass_pending_delta_adjudication |
| Okanogan | 53047 | 49386 | 6312 | 5854 | 0 | dry_run_pass_pending_delta_adjudication |

## Excluded

| County | FIPS | Reason |
| --- | --- | --- |
| San Juan | 53055 | blocked_source_access |

## Blockers

- No DB mutation has been authorized or attempted.
- Dry-run pass means duplicate-safe prefix repair only; each county still needs delta adjudication before receipt-backed closure.
- Production binding remains blocked.
