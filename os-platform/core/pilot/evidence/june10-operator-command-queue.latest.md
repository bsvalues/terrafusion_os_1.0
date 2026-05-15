# June 10 Operator Command Queue

Generated: 2026-05-15T19:40:21.993Z

Queue status: FIRST_UNBLOCK_ONLY
War-room verdict: NO_GO
Active lane: WAITING_SYNC_DB_EVIDENCE
First unblock command: `pnpm run truth:terrafusion-db-product-load-ledger`

## Summary

- Total commands: 7
- Active commands: 1
- Blocked commands: 6
- Stop-work items: 5
- Last refresh material state changed: true
- Last refresh material changed artifacts: 1

## Commands

| Status | Command | Reason |
|---|---|---|
ACTIVE | `pnpm run truth:terrafusion-db-product-load-ledger` | Allowed by current war-room state.
BLOCKED_BY_FIRST_UNBLOCK | `pnpm run truth:benton-runtime-pilot-closure` | Blocked until first unblock command passes: pnpm run truth:terrafusion-db-product-load-ledger.
BLOCKED_BY_FIRST_UNBLOCK | `pnpm run truth:washington-39-county-data-crosswalk` | Blocked until first unblock command passes: pnpm run truth:terrafusion-db-product-load-ledger.
BLOCKED_BY_FIRST_UNBLOCK | `pnpm run truth:runtime-candidate-set` | Blocked until first unblock command passes: pnpm run truth:terrafusion-db-product-load-ledger.
BLOCKED_BY_FIRST_UNBLOCK | `pnpm run truth:june10-red-team` | Blocked until first unblock command passes: pnpm run truth:terrafusion-db-product-load-ledger.
BLOCKED_BY_FIRST_UNBLOCK | `pnpm run truth:june10-claim-guard` | Blocked until first unblock command passes: pnpm run truth:terrafusion-db-product-load-ledger.
BLOCKED_BY_FIRST_UNBLOCK | `pnpm run truth:june10-control-plane-refresh` | Blocked until first unblock command passes: pnpm run truth:terrafusion-db-product-load-ledger.

## Stop Work

- Do not claim June 10 production approval.
- Do not claim statewide or 39-county runtime readiness.
- Do not bypass launch-control stop conditions.
- Do not run Benton closure until Sync evidence intake is accepted.
- Do not start new Codex P0 closure work until the first unblock command passes.

## Rules

- Only ACTIVE commands may be executed from this queue.
- When war-room verdict is NO_GO, the first unblock command is the only active command.
- Blocked commands are not suggestions; they are sequencing guards.
- Run pnpm run truth:june10-control-plane-refresh after the active command completes.
