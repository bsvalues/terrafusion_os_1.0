# WO-MAO-002 Post-Merge Assurance

**Program:** `PROGRAM-MAO-001`
**Goal / loop:** `GOAL-MAO-001` / `LOOP-MAO-001`
**Work Order:** `WO-MAO-002 - Minimal Two-Lane Pilot`
**Authority:** issue #1276, `OWNER-MAO-002-PILOT-BOOTSTRAP-20260714`
**Result:** PASS
**Completed main:** `4f68ba4c689f100eb822f18bdb07a5c5b082a660`

## Pilot Result

The two-lane pilot completed with two implementation agents, two clean worktrees, two branches, two
PRs, two disjoint reservations, independent exact-head assurance, and separate read-only post-merge
assurance. Both PRs merged through the bounded Mode B envelope without a founder routing or
merge-specific touch after dispatch.

| Lane | Operator | Reservation | PR and exact head | Merge | Reserved scope |
|------|----------|-------------|-------------------|-------|----------------|
| A | `codex-lane-a` / agent `019f61f3-aff9-7073-9b2e-cbc9766b2fd4` | `MAO-002-LANE-A-MERGE-MODEL` | #1281 / `334efdd9efc7b7c1bce204847914a304854b0fe6` | `405677e151955b48d3e5f8abd269238736d2ab74` | `docs/brain/workorders/operator/MERGE_AUTHORITY_MODEL.md` |
| B | `codex-lane-b` / agent `019f61f3-dc43-7a51-93de-00e29f01f7a8` | `MAO-002-LANE-B-GOAL-ROUTING` | #1280 / `6bb1e5a5a7d40c25324bb848ffd3299b9bba2d85` | `4f68ba4c689f100eb822f18bdb07a5c5b082a660` | `docs/brain/workorders/goal-loop/COMMAND_TO_PROGRAM_MAP.md`; `docs/brain/workorders/goal-loop/GOAL_COMMANDS.md` |

The reservation intersection was empty. Both implementation worktrees were isolated from the shared
checkout and from each other. No force push, hook bypass, package install, or shared-worktree cleanup
was used.

## Assurance

Independent pre-merge assurance was performed by read-only agent
`019f6205-2251-7c41-884c-b4bf8836b1ed`, acting under the registered `claude-assurance` role. It
reviewed each exact final head, required remediation on lane B's first head, and returned PASS only
after the routing catalog and detailed map agreed. The execution record advanced through revision 4
as PR heads changed.

Independent post-merge scope checks were performed by separate read-only instances:

| PR | Reviewer | Verdict | Verified main |
|----|----------|---------|---------------|
| #1281 | agent `019f6226-e5ec-74b3-a16d-a225e928c662` | PASS | `405677e151955b48d3e5f8abd269238736d2ab74` |
| #1280 | agent `019f6247-001d-7cd0-9b3b-c38c64dd455d` | PASS | `4f68ba4c689f100eb822f18bdb07a5c5b082a660` |

Each reviewer confirmed exact reserved scope, no protected-path change, acceptable required checks,
zero unresolved review threads at merge, disjoint reservations, and no falsely represented scope or
reservation claim. The #1280 reviewer additionally confirmed that the merge tree matched its exact
pre-merge head.

After both authorized merge slots were consumed, Codex recorded completion on issue #1276 and removed
the paired operational repository variables together. That release ended the live pilot reservations
while preserving issue #1276 as the durable owner-authority record. The checked-in policy returned to
its inactive fail-closed posture for non-pilot work.

## Metrics

| Measure | Result |
|---------|--------|
| Owner bootstrap touches | 1, issue #1276 before dispatch |
| Founder queue-routing touches from dispatch through both merges | 0 |
| Founder merge-specific touches | 0 |
| Concurrent mutable lanes | 2 |
| Reservation collisions | 0; paths were deliberately disjoint |
| Reservation violations reaching `main` | 0 |
| Unauthorized-scope merges | 0 |
| False authority walls | 0 |
| PR #1281 cycle time | 35m 11s, from 2026-07-14T19:03:39Z to 19:38:50Z |
| PR #1280 cycle time | 1h 13m 12s, from 2026-07-14T19:03:39Z to 20:16:51Z |
| Median pilot PR cycle time | 54m 11.5s |

Lane B demonstrated in-scope review remediation and an automatic update from merged lane A before
its final exact-head assurance. Required remote checks then completed successfully, including the
canonical .NET test run, full Vitest merge gate, security scan, SEAL, and build/package jobs.

## Rollback And Safety

Both changes are documentation/governance-only. The rollback class is a normal PR that reverts the
corresponding squash merge (`405677e151955b48d3e5f8abd269238736d2ab74` or
`4f68ba4c689f100eb822f18bdb07a5c5b082a660`) and reruns required gates. No rollback was needed or
executed, and this record does not claim executed rollback proof.

No runtime, backend, frontend product, tools/sync, package, lockfile, CI, deployment, production,
credential, county, PACS, SQL, or protected-data change occurred.

## Falsifiable Conclusion

The pilot proves bounded automatic continuation, zero founder queue routing after bootstrap,
operator-managed exact execution state, isolated-worktree compliance, in-scope remediation,
operator-merge behavior, independent assurance, and automatic next-action selection.

It does **not** prove mechanical reservation enforcement. The pilot intentionally used disjoint
reservations. `WO-MAO-003` owns the required intentional-overlap rejection and release/handoff retry
proof.

## Routing

`WO-MAO-002` is complete. `WO-MAO-003 - Dispatch, Reservation Contract, and Mechanical Enforcement`
is active; `WO-MAO-004 - Executable Graph and Parallel Wave Planner` is next.
