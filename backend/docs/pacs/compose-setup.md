# tf-mssql (Harris PACS Clone) — Compose Setup

## Why this exists

Until SYNC-INFRA-1, `tf-mssql` ran via an ad-hoc `docker run` command with
`--restart=no`. Result: laptop reboot or Docker Desktop restart = PACS clone
offline, and the operator had to remember the exact incantation (port mapping,
SA password, volume mounts, image tag) to bring it back.

`backend/docker-compose.pacs.yml` promotes the clone into a supervised service:

- `restart: unless-stopped` — survives reboots and `dockerd` restarts
- Localhost-only port bind (`127.0.0.1:1433`) — not exposed on LAN
- Healthcheck — Docker reports `unhealthy` if SQL stops responding
- External volumes — the existing Benton clone data is **never** recreated

The compose file is intentionally separate from the main `docker-compose.yml`.
PACS is the read-only legacy source; its lifecycle should not be tangled with
the main backend stack.

## One-time migration from the ad-hoc container

> Run these from `backend/` on Windows PowerShell.

1. **Confirm the existing volumes** (the populated Benton clone lives here —
   do not delete them):
   ```powershell
   docker volume ls | Select-String "tf_mssql"
   ```
   You should see at least `tf_mssql_data`. If `tf_mssql_baks` is missing,
   create it (it's only used for `.bak` restore scratch space — empty is fine):
   ```powershell
   docker volume create tf_mssql_baks
   ```

2. **Stop and remove the ad-hoc container** (the data volume is unaffected):
   ```powershell
   docker stop tf-mssql
   docker rm tf-mssql
   ```

3. **Export the SA password** to the current shell. Use the **same** password
   the original `docker run` set on first init — MSSQL does not honor
   `MSSQL_SA_PASSWORD` env var changes after the first container start, so the
   password baked into `tf_mssql_data` is authoritative:
   ```powershell
   $env:TF_PACS_SA_PASSWORD = "<your-existing-sa-password>"
   ```
   To persist across sessions, add it to `appsettings.Development.local.json`
   convention or your shell profile. Never commit this value.

4. **Start under compose**:
   ```powershell
   docker compose -f docker-compose.pacs.yml up -d
   ```

5. **Verify**:
   ```powershell
   docker compose -f docker-compose.pacs.yml ps
   docker logs tf-mssql --tail 20
   ```
   The container should report `healthy` within ~60s.

## Day-to-day operation

```powershell
# status
docker compose -f docker-compose.pacs.yml ps

# logs
docker compose -f docker-compose.pacs.yml logs -f tf-mssql

# stop (volumes preserved)
docker compose -f docker-compose.pacs.yml stop

# start
docker compose -f docker-compose.pacs.yml start

# down (container removed, volumes preserved)
docker compose -f docker-compose.pacs.yml down
```

## What this does NOT do

- It does not seed PACS — the clone is already populated.
- It does not back up PACS — see `backend/backups/README.md` for canonical
  Postgres backups; PACS `.bak` backup-on-a-schedule is a separate follow-up.
- It does not migrate the SA password — whatever is in `tf_mssql_data` from
  the original ad-hoc run is what you must supply via `TF_PACS_SA_PASSWORD`.

## Doctrine echo

PACS is the **source**, not a runtime. TerraFusion Sync converts FROM PACS
INTO the canonical TerraFusion DB. This compose file exists to make that
source reliably available, not to make PACS itself more featureful.
