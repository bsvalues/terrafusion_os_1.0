# Cowlitz Bounded Correction Dry-Run

Generated: 2026-05-26T19:36:31.427Z

## Verdict

- Status: dry_run_pass_pending_authorization
- DB mutation attempted: no
- Production binding allowed: no
- Certification allowed: no

## Current Delta

| Metric | Value |
| --- | ---: |
| Source distinct PARCNO | 57558 |
| Canonical distinct ParcelNumber | 57362 |
| Exact overlap | 57237 |
| Source-only | 321 |
| Canonical-only | 125 |
| Source duplicate groups | 25 |
| Canonical duplicate groups | 0 |

## Proposed No-Op Correction

- Proposed supersedes: 125
- Proposed staged inserts: 321
- Duplicate groups after: 0
- Identity parity possible after bounded correction: yes

## Current Source Probe

- Attempted: yes
- Requested: 125
- Found: 0
- Absent: 125
- Errors: 0

## Source Artifact Integrity

- Expected SHA-256: 90c663bb977e69155625df5a73a66c59f40a42ef9ff797a89fcb4deccf3b35e1
- Actual SHA-256: b1c30d8f72b5cd81bdabcb6a01e006e8cdf74b789cd226e2bcda0a2686445174
- Matches receipt: no

## Blockers

- none
