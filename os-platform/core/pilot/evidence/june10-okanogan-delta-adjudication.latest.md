# Okanogan Delta Adjudication

Generated: 2026-05-26T23:26:40.104Z

## Decision

blocked_source_semantics

## Summary

- Source rows: 7057
- Source distinct IDs: 6312
- Canonical distinct IDs after prefix repair: 49386
- Overlap: 5854
- Source-only IDs: 458
- Canonical-only IDs: 43532
- Source coverage ratio: 0.118536
- Duplicate source rows: 745
- Null/blank source rows: 0
- Prefix-repair duplicate groups: 0
- DB mutation attempted: no
- Production binding allowed: no

## Current Source Probe

- Attempted: no
- Reason: Okanogan evidence is a static comparable-sales workbook, not a governed full parcel inventory or current parcel query endpoint.

## Blockers

- Okanogan source artifact is not a governed full parcel inventory, so canonical-only rows cannot be adjudicated.
- 458 source-only parcel IDs require current source semantics before correction.
- 43532 canonical-only parcel IDs require full source inventory or current-source probe before closure.
