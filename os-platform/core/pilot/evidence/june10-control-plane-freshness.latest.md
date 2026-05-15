# June 10 Control-Plane Freshness

Generated: 2026-05-15T16:27:15.074Z

Freshness status: FRESH

## Summary

- Required artifacts: 6
- Required artifacts present: 6
- Blockers: 0
- Launch verdict: NO_GO
- War-room verdict: NO_GO
- Operator queue status: FIRST_UNBLOCK_ONLY
- P0 items: 6
- Sync evidence intake status: WAITING_SYNC_DB_EVIDENCE

## Chain

| Artifact | Present | Generated |
|---|---:|---|
syncEvidenceIntake | true | 2026-05-15T16:27:12.869Z
shipBlockerLedger | true | 2026-05-15T16:27:13.914Z
p0Burndown | true | 2026-05-15T16:27:14.195Z
launchControl | true | 2026-05-15T16:27:14.448Z
warRoomStatus | true | 2026-05-15T16:27:14.627Z
operatorCommandQueue | true | 2026-05-15T16:27:14.837Z

## Blockers

- None

## Rules

- Freshness only proves generated control-plane artifacts agree with each other.
- Freshness does not clear launch blockers or prove runtime data.
- Launch control must be regenerated after P0 burn-down changes.
- P0 burn-down must be regenerated after Sync evidence intake or ship-blocker ledger changes.
