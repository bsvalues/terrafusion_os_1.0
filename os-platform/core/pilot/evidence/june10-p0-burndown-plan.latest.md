# June 10 P0 Burndown Plan

Generated: 2026-05-15T17:06:58.350Z

Launch verdict: NO_GO

## Summary

- P0 items: 6
- Deferred non-P0 items: 5
- Waiting external items: 1
- Blocked items: 5
- Ready for Codex items: 0
- Sync evidence intake status: WAITING_SYNC_DB_EVIDENCE
- Sync evidence blockers: 21

## Execution Queue

| Seq | Source | Status | Owner lane | Blocked by | Proof command | Next unblock command |
|---:|---|---|---|---|---|---|
1 | productLoadLedger | WAITING_SYNC_DB_EVIDENCE | Claude Code / Sync DB, audited by Codex | - | `pnpm run truth:terrafusion-db-product-load-ledger` | `pnpm run truth:terrafusion-db-product-load-ledger`
2 | bentonPilotClosure | BLOCKED_BY_DEPENDENCY | Codex after all Benton data gates are green | productLoadLedger | `pnpm run truth:benton-runtime-pilot-closure` | -
3 | redTeam:runtime_lineage | BLOCKED_BY_DEPENDENCY | Codex / launch-control review | productLoadLedger | `pnpm run truth:june10-red-team` | -
4 | redTeam:benton_realism | BLOCKED_BY_DEPENDENCY | Codex / launch-control review | bentonPilotClosure | `pnpm run truth:june10-red-team` | -
5 | redTeam:governance_posture | BLOCKED_BY_DEPENDENCY | Codex / launch-control review | productLoadLedger, bentonPilotClosure | `pnpm run truth:june10-red-team` | -
6 | launchControl | BLOCKED_BY_P0 | Codex | productLoadLedger, bentonPilotClosure, redTeam:runtime_lineage | `pnpm run truth:june10-launch-control` | -

## Plan Blockers

- None

## Deferred Items

- P1 crosswalk: Deferred until P0 launch blockers clear. Proof: `pnpm run truth:washington-39-county-data-crosswalk`
- P1 runtimeCandidateSet: Deferred until P0 launch blockers clear. Proof: `pnpm run truth:runtime-candidate-set`
- P1 redTeam:county_trust: Deferred until P0 launch blockers clear. Proof: `pnpm run truth:june10-red-team`
- P1 redTeam:overclaim_risk: Deferred until P0 launch blockers clear. Proof: `pnpm run truth:june10-red-team`
- P1 redTeam:uat_survivability: Deferred until P0 launch blockers clear. Proof: `pnpm run truth:june10-red-team`

## Rules

- This is a burn-down plan, not a readiness pass.
- P0 items are the only active June 10 lane until cleared.
- Product runtime claims stay blocked while any P0 item remains unresolved.
- External Sync/DB work must produce proof artifacts before dependent Codex work can close.
- P1 work is deferred unless it directly clears a P0 blocker.
