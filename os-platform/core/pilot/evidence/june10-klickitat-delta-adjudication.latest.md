# Klickitat Delta Adjudication

Generated: 2026-05-26T23:14:31.805Z

## Decision

blocked_source_semantics

## Summary

- Source rows: 688
- Source distinct IDs: 665
- Canonical distinct IDs after prefix repair: 21305
- Overlap: 653
- Source-only IDs: 12
- Canonical-only IDs: 20652
- Source coverage ratio: 0.03065
- Duplicate source rows: 23
- Null/blank source rows: 0
- Prefix-repair duplicate groups: 0
- DB mutation attempted: no
- Production binding allowed: no

## Current Source Probe

- Attempted: no
- Reason: Klickitat evidence is static sales-report workbook data, not a governed parcel inventory or query endpoint.

## Blockers

- Klickitat source artifact is not a governed full parcel inventory, so canonical-only rows cannot be adjudicated.
- 12 source-only parcel IDs require current source semantics before correction.
- 20652 canonical-only parcel IDs require full source inventory or current-source probe before closure.
