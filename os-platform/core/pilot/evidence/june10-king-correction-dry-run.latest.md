# King Correction Dry-Run

Generated: 2026-05-26T16:10:41.661Z

## Verdict

- Result: DRY_RUN_BLOCKED_REQUIRED_FIELDS
- Database mutation attempted: no
- Production binding allowed: no
- Certification allowed: no

## Summary

- Case-only edge corrections: 12
- True canonical-only rows: 451
- Proposed supersedes: 451
- True source-only PINs: 1161
- Proposed no-op stage rows: 1161
- Unsafe supersedes: 0
- Source/canonical conflicts: 0
- Unproven source probes: 0

## Validation

- Post-correction identity parity would be achieved: yes
- CountyId + ParcelNumber duplicate target groups after correction: 0
- Source-only rows loadable with required fields: no
- Canonical-only rows safe to supersede: yes
- Case corrections safe: yes

## Blockers

- Source-only King PINs are staged in no-op mode but are not loadable with required runtime fields from the current PIN-only artifact.
