# Benton Projection Uniqueness Repair Execution Gate

Generated: 2026-05-24T22:35:19.404Z

Verdict: **FAIL**

Execution status: **WAITING_SYNC_TERMINAL**

## Summary

- Mode: observe
- Before duplicate groups: 1503
- Before extra active rows: 1503
- Before active distinct parcels: 83296
- After duplicate groups: not run
- After extra active rows: not run
- After active distinct parcels: not run
- Loser rows superseded: not run
- Repair run id: none
- Receipt written: false
- Unique index exists: false
- Database mutation taken: false
- Certification granted: false

## Authorization

- Required token: `BENTON_PROJECTION_UNIQUENESS_REPAIR_APPROVED`
- Provided: false
- Accepted: false

## Certification Gate

- Wait for Sync terminal state and/or execute authorized repair until active duplicates are zero.

## Blockers

- sync_active: TerraFusion Sync is active; Benton projection uniqueness repair must not mutate DB.
