# Phase 9.2: Seal and Harden — SPEC

## Objective
Remove temporary boot bypasses (StateMeshGuard), standardise networking binding, and lock in "Golden Dashboards" for telemetry. Establish an automated Quality Gate.

## 1. Remove "jq" Dependency & Restore Enforcement
**Current State:** `TF_STATE_MESH_ENFORCE=false` because `jq` is missing in `terrafusion-os-api`.
**Target State:** `TF_STATE_MESH_ENFORCE=true`.
**Strategy:** Replace complex `jq` parsing in `entrypoint.sh` (or verification script) with:
   - Simple `grep` or `sed` if checking for single keys.
   - OR a tiny C# utility if complex parsing is needed.
   - Using `grep` to parse specific keys from JSON files for verification scripts.

## 2. Sovereign Binding
**Current State:** `command: ... --urls http://+:5000` in compose.
**Target State:**
   - Dockerfile: `ENV ASPNETCORE_URLS=http://+:5000`
   - Compose: Clean command.

## 3. Golden Dashboards
**Target State:** Grafana auto-loads:
   - `dashboard_dotnet.json`: Request Rate, Error Rate, Latency (Iron).
   - `dashboard_python.json`: Request Rate, Error Rate, Latency (Cortex).
   - `dashboard_otel.json`: Collector health.

## 4. The Quality Gate
**Deliverable:** `ops/gates/verify_observability.ps1`
**Logic:**
   1. Check all ports (3000, 9090, 16686, 5000, 8006) respond.
   2. Check Prometheus Targets API: ensure `otel-collector` state is `"up"`.
   3. Check Jaeger Trace API: ensure trace count > 0 for service `terrafusion-iron`.

## Verification Commands
```powershell
# 1. State Mesh Check
docker compose down
# Set env var in .env or compose to TRUE
docker compose up -d api
docker logs terrafusion-iron --tail 50
# Verify "STATE MESH VERIFIED" or similar success message

# 2. Binding Check
docker exec terrafusion-iron env | Select-String "ASPNETCORE_URLS"
curl -v http://localhost:5000/health

# 3. Quality Gate
./ops/gates/verify_observability.ps1
```

## Rollback Plan
- If Iron fails to boot with `TF_STATE_MESH_ENFORCE=true`, revert to `false` in `docker-compose.prod.yml`.
- If dashboard provisioning fails, verify volume mounts and file permissions.
- If binding fails, re-introduce command override in `docker-compose.prod.yml`.

## Agent Scratchpad
- Need to locate `scripts/speclock-tss-verify-state.sh` to remove `jq`.
- Need to check `backend/Dockerfile.API` for ASPNETCORE_URLS.
- Need to create dashboard JSON files (will use placeholders or simple definitions if not provided, or search for existing templates).
- Need to check `config/grafana/provisioning/dashboards/dashboard.yml` config.
