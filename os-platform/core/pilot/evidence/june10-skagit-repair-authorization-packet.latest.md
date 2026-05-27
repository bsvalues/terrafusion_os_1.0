# Skagit Repair Authorization Packet

Generated: 2026-05-27T01:25:45.282Z

## Decision State

- State: READY_FOR_HUMAN_DECISION
- Execution enabled: no
- Approval required: yes
- Database mutation attempted: no
- Production binding allowed: no
- Certification allowed: no

## Summary

- Source URL: https://gis.skagitcountywa.gov/arcgis/rest/services/OpenData/AssessorDataParcels/FeatureServer/0
- Source parcel ID field: PARCELID
- Source artifact hash: 6cbcb99a30e0dde1f2c839dba8c58f585348bac8365dd640013d8d005f4792f1
- Dry-run status: DRY_RUN_REPAIR_PARITY_PROJECTED
- Proposed updates: 72947
- Proposed supersedes: 26
- Proposed staged inserts: 69
- Post-repair duplicate groups: 0
- Post-repair source-only: 0
- Post-repair canonical-only: 0

## Artifacts

| Artifact | Path | SHA256 |
| --- | --- | --- |
| sourceMetadata | os-platform/core/pilot/evidence/june10-authoritative-recapture-wave1/skagit/source-metadata.json | 9a6b55ee5292754dea1245d1ff6a1b493023b1b28ce753233303d351bd558a00 |
| sourceIds | os-platform/core/pilot/evidence/june10-authoritative-recapture-wave1/skagit/source-native-parcel-ids.jsonl | 6cbcb99a30e0dde1f2c839dba8c58f585348bac8365dd640013d8d005f4792f1 |
| updateTargets | os-platform/core/pilot/evidence/june10-skagit-prefix-repair-dry-run/update-targets.jsonl | 94e52792ae7dcc1496496ec546684402189a9488052398fdabd1a7cb81cb9c61 |
| supersedeTargets | os-platform/core/pilot/evidence/june10-skagit-prefix-repair-dry-run/supersede-targets.jsonl | 751dadc68582b2f8d758ee9738f0d5d4bb47b66b372e7c2b215aa494dafb67bb |
| stageInsertTargets | os-platform/core/pilot/evidence/june10-skagit-prefix-repair-dry-run/stage-insert-targets.jsonl | 59ff0fbc578d44028ae31a0fe67bbba7fa112ac54370e64a769ac7f9e14764c1 |
| repairReceipt | os-platform/core/pilot/evidence/june10-skagit-prefix-repair-dry-run/repair-receipt-candidate.json | 99ca025315d085f750fd5543d5baa785272e19741516e1a18b40075b01171812 |
| rollbackPlan | os-platform/core/pilot/evidence/june10-skagit-prefix-repair-dry-run/rollback-plan.md | 3e6549201819d44ac9016bd8e5b5ddf196a29a7dc621d705526e60dc4c02a20f |

## Forbidden Claims

- no_skagit_certification
- no_production_binding
- no_workflow_complete_claims
- no_owner_address_value_claims_for_shell_rows
- no_runtime_promotion

## Preconditions

- Human approval must be explicit and Skagit-only.
- A backup snapshot of affected Skagit canonical rows must be captured before mutation.
- Execution must run in one bounded transaction.
- Post-repair duplicate groups must remain 0.
- Post-repair source-only and canonical-only counts must remain 0 under the approved shell policy.
- Rollback plan must remain available before execution.

## Stop Conditions

- Stop if artifact hashes differ from this packet.
- Stop if source receipt is regenerated or stale.
- Stop if worktree is dirty with unrelated changes.
- Stop if tests fail.
- Stop if backup snapshot cannot be created.
- Stop if transaction verification does not project parity.

## Blockers

- None
