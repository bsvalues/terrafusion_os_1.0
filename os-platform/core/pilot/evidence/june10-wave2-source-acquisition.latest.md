# June 10 Wave 2 Source Acquisition

Generated: 2026-05-26T22:45:29.939Z

## Summary

- Counties checked: 5
- Source artifacts captured: 4
- Database mutation attempted: no
- Production binding allowed: no

## County Results

| County | FIPS | Access path | Source IDs | Canonical IDs | Exact overlap | Prefix-stripped overlap | Classification |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- |
| Kitsap | 53035 | existing_governed_payload_file | 23126 | 116900 | 0 | 20406 | blocked_transform |
| Pierce | 53053 | existing_governed_payload_file | 262058 | 328832 | 0 | 252992 | blocked_transform |
| Klickitat | 53039 | existing_governed_payload_file | 665 | 21305 | 0 | 653 | blocked_transform |
| Okanogan | 53047 | existing_governed_payload_file | 6312 | 49386 | 0 | 5854 | blocked_transform |
| San Juan | 53055 | blocked_no_receipt_grade_payload | 0 | 17399 | 0 | 0 | blocked_source_access |

## Blockers

- This slice captures source-native parcel ID evidence only; it does not load or mutate canonical data.
- Production binding remains blocked until the remaining WA_INITIAL_SEED receipt posture is reconciled.
