# Pierce Delta Adjudication

Generated: 2026-05-26T23:42:18.400Z

## Decision

blocked_source_semantics

## Summary

- Source rows: 1920084
- Source distinct IDs: 262058
- Canonical distinct IDs after prefix repair: 328832
- Overlap: 252992
- Source-only IDs: 9066
- Canonical-only IDs: 75840
- Source coverage ratio: 0.769366
- Duplicate source rows: 1133910
- Null/blank source rows: 0
- Prefix-repair duplicate groups: 0
- DB mutation attempted: no
- Production binding allowed: no

## Current Source Probe

- Attempted: no
- Reason: Pierce evidence is a sale.txt sales-history datamart export, not a governed full parcel inventory or current parcel query endpoint.

## Blockers

- Pierce source artifact is not a governed full parcel inventory, so canonical-only rows cannot be adjudicated.
- 9066 source-only parcel IDs require current source semantics before correction.
- 75840 canonical-only parcel IDs require full source inventory or current-source probe before closure.
