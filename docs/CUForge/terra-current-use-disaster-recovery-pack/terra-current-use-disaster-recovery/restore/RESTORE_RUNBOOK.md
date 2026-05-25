# Current Use Restore Runbook

## Step 1 — Freeze Writes

Disable:

- rollback calculation writes
- notice issuance
- import commits

Allow read-only mode.

## Step 2 — Restore Core Tables

Restore:

1. classifications
2. policy packs
3. rollback calculations
4. evidence metadata
5. trace events
6. notice issuance records

## Step 3 — Validate

- verify row counts
- verify policy versions
- verify rollback snapshots
- verify trace hash chain
- verify issued notice states

## Step 4 — Re-enable

Re-enable writes only after:

- validation passes
- supervisor signoff
- trace integrity verified

## Step 5 — Append Recovery Event

Append TerraTrace recovery event documenting:

- restore timestamp
- restore operator
- backup source
- affected systems
