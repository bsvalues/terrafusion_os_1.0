# June 10 Sync Terminal Watch

Generated: 2026-05-22T23:27:33.482Z

Verdict: **DB_PROBE_UNAVAILABLE**

## Summary

- Sync terminal: false
- In-progress batches: 0
- Latest batch status: -
- Latest batch operator: -
- API healthy: false
- API status: -
- Timeout escalation required: false
- Benton certification trigger ready: false

## Clean Restart Readiness

- blocked: Sync/DB probe availability - Sync/DB probe failed; recover Docker/Postgres visibility before any runtime certification decision.
- blocked: Sync terminal state - Do not restart runtime while Sync is active or terminal state is unproven.
- blocked: API health recovery required - API health is not green. Prepare manual clean restart only after Sync terminal state is green.
- green: Timeout/escalation clearance - No stale Sync timeout escalation is required.
- blocked: Certification rerun guard - Certification commands are listed as triggers only; this watcher does not run them.

## Certification Trigger Commands

- Blocked until all trigger conditions are green.

## Escalations

- None

## Blockers

- sync_terminal: TerraFusion Sync terminal state is not proven. (inProgress=0; latestStatus=missing; quietMinutes=unknown)
- sync_probe: Sync/DB probe is unavailable; terminal state cannot be determined. (Command failed: docker exec -i terrafusion-postgres-dev psql -U postgres -d terrafusion -t -A -v ON_ERROR_STOP=1
failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine; check if the path is correct and if the daemon is running: open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.
)
- api_health: API health is not green; runtime recovery may be needed after Sync is terminal. (status=null; error=fetch failed)

## Guardrails

- No runtime restart was performed.
- No database mutation was performed.
- No certification command was run by this watcher.
- Wave A counties remain out of scope for this watcher.
