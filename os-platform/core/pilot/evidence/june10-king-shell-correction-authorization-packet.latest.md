# King Shell Correction Authorization Packet

Generated: 2026-05-26T16:32:13.361Z

## Executive Summary

- Authorization status: READY_FOR_HUMAN_DECISION
- Supersedes: 451
- Shell inserts: 1137
- Case corrections: 12
- Placeholder rows excluded: 24
- Duplicate target groups after proposed transaction: 0
- Identity parity scope: policy_approved_shell_identity_scope_only
- Database mutation attempted: no
- Production binding allowed: no
- Certification allowed: no

**No-BS line:** Approved for shell identity correction is not approved for King certification.

## Risk Statement

- Shell rows are not owner/address/value complete.
- Shell rows are not workflow-certified.
- King remains blocked for full certification.
- Placeholder/tract rows remain unresolved and excluded.
- This packet does not authorize production binding or statewide readiness claims.

## Preconditions

| ID | Status | Statement |
| --- | --- | --- |
| dry_run_receipt_hash_recorded | pass | Latest King transaction dry-run receipt hash is recorded before authorization. |
| source_artifact_hash_matches | pass | King source artifact hash matches the source-completeness receipt. |
| rollback_sql_exists | pass | Rollback SQL exists before any execution authorization. |
| bounded_king_only_unit | pass | Execution scope is King County only. |
| duplicate_targets_zero | pass | Dry-run proves post-mutation duplicate target groups remain zero. |
| shell_policy_blocks_certification | pass | Shell rows stay non-certified and workflow-complete claims remain blocked. |

## Execution Plan

1. BEGIN transaction.
2. Apply 12 source-exact case corrections.
3. Supersede 451 stale King canonical rows; mark inactive/superseded, do not delete.
4. Insert 1,137 King shell rows with KING_PUBLIC_PARCEL_SHELL trust label.
5. Keep 24 placeholder/tract rows excluded in review queue.
6. Validate CountyId + ParcelNumber duplicate groups = 0.
7. Validate policy-approved identity parity.
8. Validate shell rows remain blocked from workflow-complete claims.
9. COMMIT only if all checks pass; otherwise ROLLBACK.

## Rollback Plan

- SQL reference: os-platform/core/pilot/evidence/june10-king-parcel-shell-correction-transaction-dry-run/rollback.sql
- Verification:
  - superseded rows restored to ACTIVE if rollback is executed
  - inserted KING_PUBLIC_PARCEL_SHELL rows removed if rollback is executed
  - case-corrected rows restored from snapshot/backup if rollback is executed
  - duplicate target groups remain 0 after rollback

## Post-Execution Proof

- accepted correction receipt emitted after commit
- identity parity proof rerun after mutation
- CountyId + ParcelNumber duplicate proof equals 0
- 451 stale rows marked superseded/inactive, not deleted
- 1,137 shell rows inserted with KING_PUBLIC_PARCEL_SHELL trust label
- 24 placeholder rows remain excluded/review-held
- workflow-complete and certification blockers remain true
- rollback verification command available and documented

## Human Approval Checklist

- [ ] I approve King County only: 12 case corrections, 451 supersedes, 1,137 KING_PUBLIC_PARCEL_SHELL inserts, and 24 placeholder rows excluded.
- [ ] I acknowledge this authorization is not approval for King workflow certification or production certification.
- [ ] I acknowledge shell rows are identity/context-only and lack owner/address/value fields.
- [ ] I confirm rollback SQL and rollback verification are available before execution.
- [ ] Required phrase for a future mutation slice: I explicitly authorize the King shell identity correction transaction only.

## Disabled Execution Command

`DISABLED: node os-platform/core/pilot/june10-king-shell-correction-execute.mjs --requires-explicit-human-authorization`
