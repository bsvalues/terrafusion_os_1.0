# MAO Dispatch and Reservation Contract

`WO-MAO-003` makes parallel-worker reservations mechanical without creating a second Brain or queue.
The Brain remains the source of Work Order sequencing. An open PR body carries only the mutable
assignment state for that PR, between these markers:

```text
<!-- TF-MAO-WORKER-ASSIGNMENT:BEGIN -->
{ ... worker-assignment.schema.json ... }
<!-- TF-MAO-WORKER-ASSIGNMENT:END -->
```

## Deterministic Rules

1. The assignment repository, PR number, and exact head SHA must match live GitHub state.
2. Every changed path in a registered PR must be covered by an active exact or subtree path
   reservation. Both sides of a rename count.
3. An unregistered PR cannot modify a path held by an active registered reservation.
4. A current PR participating in any overlap fails, regardless of event order or self-declared time.
   The first reservation passes while alone; a second overlap cannot merge, and either participant
   fails on recheck until release or handoff. Diagnostics identify both Work Orders, PRs, repositories,
   and resources; earliest reservation time and lower PR number only identify the first observed holder.
5. Path comparisons case-fold repository-relative `/`-separated segments. Globs, absolute paths,
   backslashes, and `.`/`..` are invalid; case-only aliases normalize to the same resource.
6. Contract and environment reservations are exact, normalized identifiers. They never imply access
   to credentials, production, county systems, or an environment itself.
7. A reservation becomes stale 72 hours after `renewed_at` or `reserved_at`. Stale reservations keep
   blocking until renewed, explicitly released, or handed off.
8. Release requires `released_at` and `release_reason`, preserves the record as evidence, and is valid
   only when `released_at` is not earlier than the effective reservation timestamp and not later than
   the gate's current time.
9. Handoff requires a source in `handed_off` state naming the target reservation and an active target
   naming the source PR and exact source head with the same or narrower resource. Closed source PR
   evidence is fetched directly and remains valid; a one-sided or head-drifted handoff fails closed.
10. PR-body state is operator-maintained after every remediation head change. It does not grant owner
    authority, broaden the Work Order, or replace the canonical queue.

The gate uses `protected-conflict` registration: a PR without a manifest may proceed only when its
changed paths do not collide with a registered blocking reservation. Parallel MAO dispatch must be
registered; unrelated serial work is not converted into a second queue by this gate.
