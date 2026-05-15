# June 10 Control-Plane Refresh

Generated: 2026-05-15T18:02:59.731Z

Refresh status: PASS

## Summary

- Total steps: 7
- Executed steps: 7
- Failed steps: 0
- Final freshness status: FRESH
- Final freshness blockers: 0
- Redacted output fields: 0
- Truncated output fields: 0
- Material state changed: false
- Material changed artifacts: 0
- Material unchanged artifacts: 7

## Steps

| Step | Exit | Bootstrap freshness | Command |
|---|---:|---:|---|
syncEvidenceIntake | 0 | false | `node os-platform/core/pilot/june10-sync-evidence-intake.mjs`
shipBlockerLedger | 0 | false | `node os-platform/core/pilot/june10-ship-blocker-ledger.mjs`
p0Burndown | 0 | false | `node os-platform/core/pilot/june10-p0-burndown-plan.mjs`
launchControl | 0 | false | `node os-platform/core/pilot/june10-launch-control.mjs`
warRoomStatus | 0 | true | `node os-platform/core/pilot/june10-war-room-status.mjs --freshness <bootstrap-freshness>`
operatorCommandQueue | 0 | false | `node os-platform/core/pilot/june10-operator-command-queue.mjs`
controlPlaneFreshness | 0 | false | `node os-platform/core/pilot/june10-control-plane-freshness.mjs`

## Blockers

- None

## Material Changes

- None

## Rules

- This runner refreshes only June 10 control-plane artifacts.
- It does not run DB, Sync, runtime, or product-load commands.
- The war-room step uses a temporary freshness bootstrap so a stale starting point cannot deadlock recovery.
- Final control-plane freshness is the authoritative result of the refresh.
