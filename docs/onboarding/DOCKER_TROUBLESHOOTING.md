# Docker Troubleshooting Runbook

This runbook is for TerraFusion local Docker development only. It does not authorize production
Compose, Helm, Kubernetes, image publishing, secrets, PACS, county SQL, county data, or deployment
behavior.

## Safe Baseline Checks

Run these from the repository root:

```powershell
docker version
docker compose version
docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example config
docker ps
```

## Troubleshooting Matrix

| Symptom | Likely cause | Safe check | Safe fix | Stop when |
| --- | --- | --- | --- | --- |
| Docker Desktop not running | Docker CLI is installed but engine is stopped | `docker version` | Start Docker Desktop and retry the same command | Docker requires admin/system changes you cannot authorize |
| WSL timeout or engine unavailable | WSL backend is stopped, stale, or unavailable | `docker version` | Restart Docker Desktop; if needed, restart WSL outside the repo | Restart would interrupt unrelated workloads |
| `docker compose` missing | Docker Compose plugin is not installed or PATH is wrong | `docker compose version` | Repair Docker Desktop/CLI installation outside the repo | Compose repair requires privileged machine changes |
| Compose config failure | YAML/env mismatch or wrong compose file | `docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example config` | Use only `docker/dev/compose.yaml` and `docker/dev/.env.example`; capture first error line | Fix would require editing production Compose or Helm |
| Missing env file | Command points at `.env` that does not exist | `Test-Path docker/dev/.env.example` | Use `--env-file docker/dev/.env.example` or create local `.env` from placeholders only | Real secrets or county values are requested |
| Port conflict | Local port already in use | `docker ps` | Change local placeholder ports in a local-only `.env` file | A shared/prod port convention would need changing |
| Stale containers | Old local containers are still running | `docker ps` | Stop only local TerraFusion dev containers you own | Container ownership is unclear |
| Image build cache issue | Local cache is stale or corrupted | `docker ps` | Re-run the documented local command; avoid global prune by default | Cleanup would delete unrelated Docker assets |
| Permission denied | Shell, filesystem, or Docker permissions block access | `docker version` and command first error line | Switch to an authorized shell/session; do not change repo permissions broadly | Admin rights or ownership changes are required |
| Production compose accidentally selected | Wrong compose file or inherited command | Inspect command path | Switch back to `docker/dev/compose.yaml` | The requested workflow depends on `compose.prod*`, `ops/prod/**`, or Helm |
| PACS/county SQL/secrets marker warning | A file or command references protected runtime surfaces | Inspect path names only; do not print values | Stop and route through a separate authorized work order | Any secret, PACS, county SQL, or county data value is needed |

## Production Surface Warning

Do not use these surfaces for local Docker onboarding:

- `compose.prod*`
- `compose.production*`
- `ops/prod/**`
- `backend/helm/**`
- county demo compose files
- quarantined container artifacts

Local onboarding uses `docker/dev/**` only.
