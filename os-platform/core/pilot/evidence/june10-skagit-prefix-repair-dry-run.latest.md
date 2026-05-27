# Skagit Prefix Repair Dry-Run

Generated: 2026-05-27T01:17:08.503Z

## Verdict

- Status: DRY_RUN_REPAIR_PARITY_PROJECTED
- Database mutation attempted: no
- Production binding allowed: no
- Certification allowed: no

## Counts

- Source PARCELID count: 73016
- Canonical active rows: 72973
- Proposed prefix repairs: 72947
- Proposed supersedes: 26
- Proposed staged shell inserts: 69
- Post-repair duplicate groups: 0
- Post-repair source-only: 0
- Post-repair canonical-only: 0

## Artifacts

- Dry-run receipt: os-platform/core/pilot/evidence/june10-skagit-prefix-repair-dry-run/repair-receipt-candidate.json
- Update targets: os-platform/core/pilot/evidence/june10-skagit-prefix-repair-dry-run/update-targets.jsonl
- Supersede targets: os-platform/core/pilot/evidence/june10-skagit-prefix-repair-dry-run/supersede-targets.jsonl
- Stage insert targets: os-platform/core/pilot/evidence/june10-skagit-prefix-repair-dry-run/stage-insert-targets.jsonl
- Rollback plan: os-platform/core/pilot/evidence/june10-skagit-prefix-repair-dry-run/rollback-plan.md

## Stop Conditions

- No DB mutation is authorized by this dry-run.
- Production binding remains blocked.
- Source terms posture must be reviewed before certification.
- Future execution requires explicit human authorization, backup, transaction, and post-repair audit.
