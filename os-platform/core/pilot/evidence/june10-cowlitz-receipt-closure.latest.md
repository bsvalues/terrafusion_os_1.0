# Cowlitz Receipt Closure

Generated: 2026-05-26T17:50:09.757Z

## Verdict

- Status: bounded_correction_plan_required
- Receipt converted: no
- Production binding allowed: no
- Certification allowed: no

## Post-Repair Identity

| Metric | Value |
| --- | ---: |
| Source distinct PARCNO | 57558 |
| Canonical distinct ParcelNumber | 57362 |
| Exact overlap | 57237 |
| Source-only | 321 |
| Canonical-only | 125 |

## Source Duplicate / Null Semantics

| Metric | Value |
| --- | ---: |
| Source null/blank | 0 |
| Source duplicate groups | 25 |
| Source duplicate rows | 147 |
| Canonical duplicate groups | 0 |

Classification: duplicates_do_not_explain_remaining_identity_delta

## Bounded Correction Plan

- Probe the 125 Cowlitz canonical-only parcel identifiers against the current public source.
- Classify canonical-only rows as stale canonical rows, source capture filter gaps, or transform edge cases.
- Capture runtime-complete source rows for the 321 Cowlitz source-only parcel identifiers.
- Stage a no-op correction plan: supersede stale canonical-only rows only if source absence is proven.
- Stage source-only inserts only if required runtime fields and lineage receipts are present.
- Re-run Cowlitz closure and convert a receipt only after source-only and canonical-only counts are both zero.

## Blockers

- 321 source parcel identifiers are not present in canonical after repair.
- 125 canonical parcel identifiers are not present in source after repair.
