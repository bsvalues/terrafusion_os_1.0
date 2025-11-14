# TerraFusion Consciousness Service Run Modes

This service can run in two modes to ensure reliable operations across environments.

## Degraded Mode (no DB dependency)
- Purpose: Start and operate when PostgreSQL credentials or DB are not yet available.
- Health: `/health/status` returns `databaseHealthEnabled=false` and `degraded=true`.
- How to run

```powershell
# VS Code Task
# Tasks: Run Task → "Launch TerraFusion Consciousness (Degraded)"

# Or shell
$env:TF_SKIP_DB_HEALTH = "true"
dotnet run --project TerraFusion.Consciousness --urls http://localhost:3004
```

- Verify
```powershell
curl -sS http://localhost:3004/health/status
# Expect: { ..., "databaseHealthEnabled": false, "degraded": true }
```

## Full Mode (DB-backed health and EF)
- Purpose: Enable DB health check and database-backed features.
- Prereqs: PostgreSQL 17 on `localhost:5432` and app connection string configured.
- Provision DB and app user (requires Postgres superuser password):

```powershell
# From repo root or backend/
pwsh -File .\backend\scripts\provision_consciousness_db.ps1
# Optional non-interactive
# setx PGPASSWORD "<SUPERUSER_PASSWORD>"
# pwsh -File .\backend\scripts\provision_consciousness_db.ps1
# setx PGPASSWORD ""
```

- Run (remove skip flag):
```powershell
Remove-Item Env:\TF_SKIP_DB_HEALTH -ErrorAction SilentlyContinue
Tasks: Run Task → "Launch TerraFusion Consciousness Engine"
```

- Verify
```powershell
curl -sS http://localhost:3004/health/status
# Expect: { ..., "databaseHealthEnabled": true, "degraded": false }
```

Notes
- If a previous instance is holding file locks, stop it before rebuilding/running:
```powershell
Get-Process dotnet | Where-Object { $_.Path -like "*dotnet*" -and $_.MainWindowTitle -like "*Consciousness*" } | Stop-Process -Force
```
- The degraded endpoint is safe to scrape in monitoring until DB is provisioned.
