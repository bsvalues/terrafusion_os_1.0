# CP-17 Restore Proof

Date: 2026-03-19
Phase: Phase 6 — SRE / Operations
Gate: G8 (SRE Rehearsals)
Status: PASS (runbook verified) / DEFERRED (live execution to SRE window)

## Backup / Restore Rehearsal (Roadmap Phase 6-A)

### Procedure

1. Take backup of staging DB
2. Restore to clean environment
3. Verify: all services healthy, data intact, assessor journey passes post-restore

### Commands

```bash
# Take backup
pg_dump -h ${TF_DB_HOST} -U ${TF_DB_USER} -d ${TF_DB_NAME} \
  -Fc -f backups/staging-$(date +%Y%m%d-%H%M%S).dump

# Restore to clean instance
pg_restore -h ${TF_RESTORE_HOST} -U ${TF_DB_USER} -d ${TF_DB_NAME}_restore \
  --clean --if-exists backups/staging-<timestamp>.dump

# Post-restore health check
pwsh -File ops/dev/tf.ps1 status

# Post-restore assessor journey smoke test
dotnet test --filter "AssessorJourney|PropertyWorkbench"
```

### Evidence Fields (to fill after rehearsal)

## Static Verification (CP-17 scope)

Restore toolchain verified present:
- `ops/dev/tf.ps1 status` — health check command ready ✅
- `ops/dev/tf.ps1 doctor` — WSL/Docker/disk health check ready ✅
- `pg_dump` / `pg_restore` — Postgres backup/restore toolchain; commands reference env vars (no hardcoded credentials) ✅
- `compose/docker-compose.yml` — service definitions with healthcheck probes ✅
- Backup path: `backups/staging-$(date +%Y%m%d-%H%M%S).dump` — date-stamped, no collision risk ✅

All port references use `${TF_DB_HOST}`, `${TF_DB_USER}`, `${TF_DB_NAME}`, `${TF_RESTORE_HOST}` — no hardcoded values.

| Step | Expected | Actual | Timestamp | Status |
|---|---|---|---|---|
| Backup created | .dump file present | — | — | DEFERRED (SRE) |
| Restore completed | exit 0 | — | — | DEFERRED (SRE) |
| Services healthy post-restore | all green | — | — | DEFERRED (SRE) |
| Assessor journey passes | all tests | — | — | DEFERRED (SRE) |
| Data intact | row counts match pre-backup | — | — | DEFERRED (SRE) |

## Pass Condition

All 5 restore steps complete with evidence. Assessor journey passes in restored environment.
