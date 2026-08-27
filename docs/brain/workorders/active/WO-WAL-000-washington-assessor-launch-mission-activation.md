# WO-WAL-000 — Washington Assessor Launch V1 Mission Activation

| Field | Value |
| --- | --- |
| Status | `COMPLETE_ON_PROTECTED_MERGE_OF_PR_1486` |
| Program | Washington Assessor Launch V1 |
| Goal | `GOAL-WASHINGTON-ASSESSOR-LAUNCH-V1` |
| Loop | `LOOP-WASHINGTON-ASSESSOR-LAUNCH-V1` |
| Owner authority source | Issue #1485 |
| Base | `a1f6fd66d2cff6e3dc7f62ebc00311974951dc90` |
| Risk | Governance activation; no product/runtime mutation |
| Terminal condition | `WAL_V1_MISSION_AUTHORITY_CANONICAL_AND_INITIAL_WAVE_DEPENDENCY_CLEARED` |

## Objective

Turn the direct owner mission directive in Issue #1485 into canonical executable authority so the lead operator can finish the program without a fresh owner relay for each mechanical child.

## Required outcome

1. Add `OWNER-WAL-V1-MISSION-AUTHORITY-20260827` to `.governance/owner-decisions.json`, faithfully preserving Issue #1485 scope, hard walls, child-WO autonomy, production gate, and external-source read-only boundary.
2. Register `washington-assessor-launch-v1.md` in `PROGRAM_PLAYBOOK_REGISTER.md` and the active program playbook/current queue.
3. Register the WAL Work Orders in the canonical work-order registry and goal/loop routing surfaces required by current Brain governance.
4. Record `WO-WAL-001`, `002`, `003` and bounded portions of `004` as the initial dependency-cleared parallel wave.
5. Preserve completed Five-Suite terminal state and every unrelated program exactly.
6. Run governance/WO query/registry validation required by the repository and merge the governance-only activation through protected main.

## Mission-level child policy

After this activation merges, the lead operator may create/refine exact child WOs inside WAL without a fresh owner decision when they only decompose Issue #1485. Exact repository/path/system reservations, tests, rollback, evidence and independent review remain required. A PR/WO is a synchronization boundary, not a human-return boundary.

## Hard walls

This activation grants no product implementation by itself and may not weaken branch protection, checks, isolation rules, evidence requirements, external-source read-only policy, county-data authorization or production gates.

## Validation

- owner-decision JSON parses and contains the exact WAL mission authority;
- work-order registry/query tools resolve all WAL nodes and dependencies;
- no existing completed program changes state;
- exact changed-path review;
- required governance checks pass;
- zero unresolved substantive review threads before merge.

## Continuation

On protected merge, continue automatically into the initial WAL construction wave. Do not return to the owner merely because activation or an individual child PR completed.
