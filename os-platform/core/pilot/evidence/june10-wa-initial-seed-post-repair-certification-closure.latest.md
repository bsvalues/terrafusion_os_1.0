# WA_INITIAL_SEED Post-Repair Certification Closure

Generated: 2026-05-26T15:37:47.363Z

## Verdict

- Counties evaluated: 4
- Certification pass: 1
- Blocked by crosswalk/count delta: 3
- WA_INITIAL_SEED receipts converted: 1
- Production binding allowed: no

## County Results

| County | FIPS | Status | Exact overlap | Source-only IDs | Canonical-only IDs | Receipt converted |
| --- | --- | --- | ---: | ---: | ---: | --- |
| Cowlitz County | 53015 | blocked_crosswalk_delta | 57237 | 321 | 125 | no |
| King County | 53033 | blocked_crosswalk_delta | 634723 | 1173 | 463 | no |
| Spokane County | 53063 | certification_pass | 214004 | 0 | 0 | yes |
| Yakima County | 53077 | blocked_crosswalk_delta | 98878 | 100 | 3360 | no |

## Blockers

- 125 canonical parcel identifiers are not present in source identity artifact.
- 321 source parcel identifiers are not present in canonical export.
- Source and canonical row counts differ; load/count semantics require adjudication.
- 463 canonical parcel identifiers are not present in source identity artifact.
- 1173 source parcel identifiers are not present in canonical export.
- 3360 canonical parcel identifiers are not present in source identity artifact.
- 100 source parcel identifiers are not present in canonical export.
