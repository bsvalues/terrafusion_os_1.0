# CP-17 Restore Proof

Date: 2026-03-19
Phase: Phase 6 — SRE / Operations
Gate: G8 (SRE Rehearsals)
Status: PENDING — staging environment required

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

| Step | Expected | Actual | Timestamp | Status |
|---|---|---|---|---|
| Backup created | .dump file present | — | — | PENDING |
| Restore completed | exit 0 | — | — | PENDING |
| Services healthy post-restore | all green | — | — | PENDING |
| Assessor journey passes | all tests | — | — | PENDING |
| Data intact | row counts match pre-backup | — | — | PENDING |

## Pass Condition

All 5 restore steps complete with evidence. Assessor journey passes in restored environment.
