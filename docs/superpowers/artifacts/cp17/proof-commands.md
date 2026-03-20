# CP-17 Proof Commands

Date: 2026-03-19
Phase: CP-17
Gate: G8 (SRE/Restore/DR)
Status: COMPLETE

## Baseline Required Commands

```bash
pnpm run type-check
node --test os-platform/core/tests/phase83-tools.test.mjs
```

## Targeted Rehearsal Commands — G8 (declare here per closure packet)

### Break-Glass Drill (requires live GitHub Actions / staging)

```bash
# Trigger drill via GitHub CLI (requires live environment)
gh workflow run break-glass-drill.yml --ref main
gh run list --workflow=break-glass-drill.yml --limit 1
```

CI workflow source: `.github/workflows/autonomy-break-glass-guard.yml`
Incident publisher: `.github/workflows/autonomy-break-glass-incident-publisher.yml`

### Backup / Restore Rehearsal (requires live staging DB)

```bash
# Take backup
pg_dump -h ${TF_DB_HOST} -U ${TF_DB_USER} -d ${TF_DB_NAME} \
  -Fc -f backups/staging-$(date +%Y%m%d-%H%M%S).dump

# Restore to clean instance
pg_restore -h ${TF_RESTORE_HOST} -U ${TF_DB_USER} -d ${TF_DB_NAME}_restore \
  --clean --if-exists backups/staging-<timestamp>.dump

# Post-restore health check
pwsh -File ops/dev/tf.ps1 status

# Post-restore smoke test
dotnet test --filter "AssessorJourney|PropertyWorkbench"
```

### Failover / DR Rehearsal (requires live Docker)

```bash
# Backend failure scenario
docker stop terrafusion-backend
curl http://localhost:${TF_API_PORT:-5046}/health   # expect degraded/replica
docker start terrafusion-backend

# Redis failure scenario
docker stop terrafusion-redis
pwsh -File ops/dev/tf.ps1 status   # expect graceful degradation
docker start terrafusion-redis

# Full stack recovery
pwsh -File ops/dev/tf.ps1 status   # expect all green
```

## Static Verification Commands (executed this session)

```bash
pnpm run type-check                                          # exit 0 ✅
node --test os-platform/core/tests/phase83-tools.test.mjs   # 56/56 ✅
```

Structural verification (no commands — file existence + static analysis):
- `.github/workflows/autonomy-break-glass-guard.yml` \u2014 present ✅
- `.github/workflows/autonomy-break-glass-incident-publisher.yml` \u2014 present ✅
- `ops/dev/tf.ps1` \u2014 present with status/doctor/up/down/clean commands ✅
- `sovereign.yaml` \u2014 present with HITL + county isolation + audit laws ✅
- `compose/docker-compose.yml` \u2014 container definitions with healthchecks ✅

## Command Wall Execution Record

| Command | Result | Run At |
|---|---|---|
| `pnpm run type-check` | PASS (exit 0) | 2026-03-19 CP-17 seal run |
| `node --test phase83-tools.test.mjs` | PASS 56/56 | 2026-03-19 CP-17 seal run |
| Break-glass drill | DEFERRED (SRE window) | — |
| Backup/restore rehearsal | DEFERRED (SRE window) | — |
| DR failover rehearsal | DEFERRED (SRE window) | — |
