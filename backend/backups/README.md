# Canonical Postgres Backups

Backups are produced by the `pg-backup` sidecar in `backend/docker-compose.yml`.

## Schedule

- One `pg_dump --format=custom` snapshot every 24 hours.
- Retention: files older than 7 days are auto-pruned by the sidecar.
- Output filename pattern: `terrafusion-YYYYMMDDTHHMMSSZ.dump`.

## Restore

```bash
# from inside the postgres container (or any host with pg_restore + network access):
pg_restore --clean --if-exists \
  -h terrafusion-postgres-dev -U postgres -d terrafusion \
  /backups/terrafusion-<timestamp>.dump
```

Or from the host:

```bash
docker exec -i terrafusion-postgres-dev \
  pg_restore --clean --if-exists -U postgres -d terrafusion \
  < ./backups/terrafusion-<timestamp>.dump
```

## What this does NOT cover

- PACS clone (`tf-mssql`) — separate backup story; data is reproducible from
  source PACS, so this gap is lower priority.
- WAL archiving / point-in-time recovery — daily `pg_dump` is good enough for
  the operator workbench; not a substitute for prod PITR.
