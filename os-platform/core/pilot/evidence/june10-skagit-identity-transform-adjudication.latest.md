# Skagit Identity Transform Adjudication

Generated: 2026-05-27T01:00:49.971Z

## Verdict

- Classification: prefixed_repair_candidate_with_bounded_delta
- Source-native field: PARCELID
- Database mutation attempted: no
- Production binding allowed: no
- Certification allowed: no

## Counts

- Source rows: 73016
- Source distinct PARCELID: 73016
- Source duplicate rows: 0
- Source null/blank rows: 0
- Canonical distinct ParcelNumber: 72973
- Exact overlap: 0
- Prefix-stripped overlap: 72947
- Source-only after prefix strip: 69
- Canonical-only after prefix strip: 26

## Samples

- Source-only after prefix strip: P124751, P129736, P137397, P137398, P137399, P137400, P137401, P137402, P137403, P137404, P137405, P137406, P137407, P137408, P137409, P137410, P137411, P137412, P137413, P137414, P137415, P137416, P137417, P137418, P137419
- Canonical-only after prefix strip: 057-P105015, 057-P121435, 057-P124851, 057-P125897, 057-P125899, 057-P134381, 057-P136895, 057-P136896, 057-P136927, 057-P137317, 057-P15997, 057-P21189, 057-P21237, 057-P21308, 057-P21828, 057-P22698, 057-P22703, 057-P29306, 057-P32939, 057-P32940, 057-P33754, 057-P39825, 057-P48120, 057-P50154, 057-P60717

## Next Action

prepare_skagit_prefix_repair_dry_run_then_adjudicate_source_canonical_delta

## Blockers

- Canonical ParcelNumber appears prefixed; Skagit cannot certify until source-native identity repair is executed and audited.
- Post-prefix delta remains: 69 source-only and 26 canonical-only parcel IDs.
- Source terms posture requires operator/legal review before certification.
