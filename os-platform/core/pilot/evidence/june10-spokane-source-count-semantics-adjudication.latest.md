# Spokane Source Count Semantics Adjudication

Generated: 2026-05-26T15:20:01.198Z

## Verdict

- Decision: accept_with_blank_id_rejection_and_duplicate_source_normalization
- Receipt conversion allowed: yes
- Raw source rows: 214024
- Source distinct parcel IDs: 214004
- Canonical parcel IDs: 214004
- Raw row delta: 20
- Blank/null source parcel rows: 18
- Duplicate source parcel IDs: 2
- Duplicate extra rows: 2
- Normalized delta: 20
- Source-only IDs: 0
- Canonical-only IDs: 0
- Database mutation attempted: no
- Production binding allowed: no

## Duplicate Source Parcel IDs

| Parcel ID | Occurrences | Extra rows |
| --- | ---: | ---: |
| 44232.9002 | 2 | 1 |
| 46114.9026 | 2 | 1 |

## Rejected Blank Source Rows

- Report: `os-platform/core/pilot/evidence/june10-spokane-source-count-semantics-adjudication/blank-source-parcel-id-rejected-rows.json`
- Count: 18

## Blockers

- none for Spokane source count semantics.
