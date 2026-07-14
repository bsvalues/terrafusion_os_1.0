# WO-MAO-003 Reservation Gate Evidence

## Claim

MAO-003 introduces mechanical reservation collision enforcement inside the existing required
`governed-spine` context. It does not claim environment access, reserve credentials, or create a
second queue.

## Proof Matrix

| Requirement | Evidence |
|-------------|----------|
| First reservation passes | `first-reservation.json` and `test_first_reservation_passes` |
| Intentional overlap is rejected | `intentional-overlap.json` and `test_intentional_overlap_identifies_both_owners` |
| Conflict identifies WO, PR, repository, path | Exact assertions in the intentional-overlap test |
| Explicit release restores pass | `released-reservation.json` and `test_passes_after_explicit_release` |
| Reciprocal handoff restores pass | `reciprocal-handoff.json` and `test_passes_after_reciprocal_handoff` |
| One-sided handoff fails closed | `test_one_sided_handoff_fails_closed` |
| Handoff cannot broaden exact scope to subtree | `test_exact_source_cannot_handoff_broader_subtree` |
| Stale reservations keep blocking | `test_stale_reservation_still_blocks` |
| Renewal recovers stale state | `test_renewal_recovers_stale_state_without_releasing` |
| Unregistered work cannot cross a reservation | `test_unregistered_pr_cannot_cross_active_reservation` |
| Exact-head drift fails | `test_exact_head_drift_fails` |
| Unrelated lanes do not inherit another collision | `test_unrelated_pr_does_not_inherit_another_lanes_collision` |
| Unrelated lanes do not inherit released-lane scope failures | `test_unrelated_pr_does_not_validate_released_lanes_scope` |
| No later event can bypass a live collision | Both participants fail on recheck; unrelated PR test passes |
| Checked-in schemas are executable | Lowercase reservation ID and malformed Work Order schema tests |
| Reservation IDs are unique across open PRs | `test_reservation_ids_are_unique_across_open_prs` |
| Raw dot/empty path segments fail closed | `test_raw_dot_and_empty_path_segments_fail_closed` |
| Contract/environment resources collide exactly | Dedicated contract and environment tests |
| Rename protection | GitHub file discovery includes both names and `test_rename_previous_path_must_also_be_reserved` |

## Lifecycle

An active reservation blocks until renewed, released with reason and timestamp, or transferred by a
reciprocal source/target handoff. Records remain in PR-body assignment evidence, including exact
closed-source PR/head binding. Any overlap participant fails on recheck, independent of event order;
stale active records remain blocking rather than silently expiring.

## Validation Record

Local fixture and regression commands are recorded in the final PR description and exact-head
assurance review. Remote required checks remain authoritative for merge.
