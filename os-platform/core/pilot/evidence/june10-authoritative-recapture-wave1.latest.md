# Authoritative Recapture Wave 1

Generated: 2026-05-27T00:52:16.432Z

## Summary

- Counties checked: 3
- Captured source artifacts: 2
- Valid receipt candidates: 2
- Database mutation attempted: no
- Production binding allowed: no

## Results

| County | FIPS | Capture status | Source ID field | Source IDs | Canonical IDs | Exact overlap | Prefix-stripped overlap | Classification |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- |
| Benton | 53005 | blocked_no_governed_bulk_endpoint | - | 0 | 83296 | 0 | 0 | blocked_source_capture |
| Kitsap | 53035 | captured | APN | 11371 | 116900 | 0 | 0 | captured_terms_review_required |
| Skagit | 53057 | captured | PARCELID | 73016 | 72973 | 0 | 72947 | captured_terms_review_required |

## Blockers

- 1 wave 1 candidates did not produce valid receipt candidates.

## County Blockers

- Benton: No receipt-grade source-native parcel ID artifact was captured.
- Benton: Source terms posture still requires operator/legal review before certification.
- Kitsap: Source terms posture still requires operator/legal review before certification.
- Skagit: Source terms posture still requires operator/legal review before certification.
- Skagit: Canonical ParcelNumber still appears transformed/prefixed relative to source-native IDs.
