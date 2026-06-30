# WO-DEPLOY-BENTON-003B — Azure App Service Deployment Preflight

**Work Order:** WO-DEPLOY-BENTON-003B  
**Program:** P1 — Benton Demo / Deployment Readiness  
**Date:** 2026-06-30  
**Status:** COMPLETE — read-only inventory  
**Classification:** Evidence / Preflight Checklist  
**Authority Boundary:** Read-only inventory only. No provisioning, no deployment, no secrets exposed, no DB mutation.

---

## Summary

This document inventories everything required to deploy `TerraFusion.API` (Kernel) to Azure App
Service targeting the Benton demo database (`terrafusion_benton_demo` on
`pg-terrafusion-benton-demo.postgres.database.azure.com`). It identifies required app settings key
names, secret names, runtime expectations, health endpoint contracts, build feasibility, and manual
Azure UI steps.

**Deployment is NOT authorized by this WO.** This document is the operator's pre-authorization
checklist. Authorization is WO-DEPLOY-BENTON-003C (not yet created).

---

## 1. Runtime Stack

| Field | Value |
|-------|-------|
| Language runtime | .NET 8 / ASP.NET Core |
| Container base image | `mcr.microsoft.com/dotnet/aspnet:8.0` (Linux) |
| Canonical Dockerfile | `backend/Dockerfile.API` |
| Internal port | 5000 |
| Azure container port setting | `WEBSITES_PORT=5000` |
| Process user | `terrafusion` (non-root; baked into Dockerfile.API) |
| Timezone | `America/Los_Angeles` |
| Environment label | `Production` (or `BentonCounty` if county-specific overrides are needed) |

---

## 2. Required App Settings (Key Names Only — No Values)

These must be set in Azure App Service → Configuration → Application Settings before the app will
start correctly. All secrets must be injected via Azure App Service app settings or Azure Key Vault
references — **never committed to Git**.

### 2a. Core Runtime (Required for startup)

| Setting Key | Notes |
|-------------|-------|
| `ASPNETCORE_ENVIRONMENT` | Set to `Production` or `BentonCounty` |
| `ASPNETCORE_URLS` | `http://+:5000` (matches container port) |
| `WEBSITES_PORT` | `5000` (Azure-side port mapping) |
| `TZ` | `America/Los_Angeles` |
| `TF_GIT_SHA` | Git SHA of the deployed image (for `/health` gitSha field) |

### 2b. Database Connection (Required for startup)

| Setting Key | Notes |
|-------------|-------|
| `ConnectionStrings__DefaultConnection` | Full PostgreSQL connection string to Azure Flexible Server. Contains DB password — inject as secret (see §3). Format: `Host=<host>;Database=terrafusion_benton_demo;Username=<user>;Password=<secret>;Port=5432;Ssl Mode=Require;Trust Server Certificate=false` |

### 2c. Authentication (Required for any authenticated endpoint)

| Setting Key | Notes |
|-------------|-------|
| `JwtSettings__SecretKey` | JWT signing secret. Must be ≥32 bytes, production-unique. The BentonCounty config's `Security__JwtSecret` is a legacy placeholder — NOT the API auth signer. Use `JwtSettings__SecretKey`. |
| `JwtSettings__Issuer` | `TerraFusion.API` |
| `JwtSettings__Audience` | `TerraFusion.Client` |
| `JwtSettings__ExpirationMinutes` | Token lifetime in minutes (e.g., `60`) |

### 2d. County Identity (Runtime truth)

| Setting Key | Notes |
|-------------|-------|
| `County__Name` | `Benton County` |
| `County__State` | `WA` |
| `County__Code` | `053` |
| `County__PropertyCount` | `84388` |
| `RuntimeTruth__ExpectedBentonParcelCount` | `84388` |
| `RuntimeTruth__ExpectedJune10Database` | `terrafusion_benton_demo` |
| `RuntimeTruth__ExpectedJune10Provider` | `Npgsql` |

### 2e. Workbench Evidence Signing (Required if Workbench is enabled)

| Setting Key | Notes |
|-------------|-------|
| `Workbench__Evidence__HmacKey` | ≥32-byte HMAC key. Dev placeholder in appsettings.json must be replaced. Inject as secret. |
| `Workbench__Evidence__KeyId` | `default` (or production key ID) |

### 2f. Security / CORS (Required for frontend to connect)

| Setting Key | Notes |
|-------------|-------|
| `Security__RequireHttps` | `true` in Azure (App Service enforces HTTPS at edge, but set `true` to enable redirect) |
| `Security__EnableRateLimiting` | `true` |
| `Security__MaxRequestsPerMinute` | e.g., `100` |
| `AllowedOrigins__0` | Azure App Service frontend URL (e.g., `https://<app>.azurewebsites.net`) |

### 2g. Optional / Deferred Settings

These are present in appsettings but can be left at defaults or disabled for the initial demo deployment:

| Setting Key | Default / Notes |
|-------------|-----------------|
| `ConnectionStrings__PacsConnection` | Omit or disable — PACS is the read source, not needed for demo read-path |
| `Cache__Redis__ConnectionString` | Omit if Redis is not provisioned; `EnableDegradedMode: true` provides fallback |
| `AzureKeyVault__Enabled` | `false` (can enable after initial deploy) |
| `AuditLogging__LogToDatabase` | `false` for initial demo (avoids missing audit table errors) |
| `Muse__*` | AI model routing — can omit for demo; endpoints resolve to localhost (stub) |

---

## 3. Secret Names (No Values)

These secrets must be stored in **Azure Key Vault** or directly in App Service "Connection Strings"
/ "Application Settings" with the "Secret" marker. Values must never appear in Git, logs, or this
document.

| Secret Name (recommended) | Purpose |
|---------------------------|---------|
| `TerraFusion-DB-Password` | Password component of `ConnectionStrings__DefaultConnection` |
| `TerraFusion-JWT-SecretKey` | Value of `JwtSettings__SecretKey` |
| `TerraFusion-Workbench-HmacKey` | Value of `Workbench__Evidence__HmacKey` |

**Key Vault reference format in App Service:**
```
@Microsoft.KeyVault(SecretUri=https://<vault>.vault.azure.net/secrets/<secret-name>/)
```

**Azure PostgreSQL Flexible Server admin credential** is separate from the app credential. The app
should connect as a least-privilege DB user (not the admin). Admin credential is for portal/
provisioning use only.

---

## 4. Health and Readiness Endpoint Contract

The Kernel registers the following health endpoints (from `Program.cs`):

| Endpoint | Purpose | Azure Config |
|----------|---------|--------------|
| `/health` | Primary health check — returns module status + gitSha | Use for App Service **Health check path** |
| `/healthz` | ASP.NET Core health checks (all registered checks) | Comprehensive check |
| `/healthz/ready` | Readiness probe (subset of checks) | Use for **startup probe** if configuring AKS later |
| `/health/codex369` | Internal health endpoint | Not for external monitoring |

**Azure App Service health check setting:**
- Path: `/health`
- Expected response: HTTP 200
- Interval: 30s (default)
- Threshold: 2 consecutive failures before instance restart

The Dockerfile.API `HEALTHCHECK` confirms: `curl -f http://localhost:5000/health || exit 1`.

---

## 5. PostgreSQL Firewall Requirements

Azure PostgreSQL Flexible Server requires explicit firewall rules for each inbound IP.

**Actions required (manual, in Azure portal — NOT this WO):**

1. Navigate to: `pg-terrafusion-benton-demo` → Networking → Firewall rules
2. Add App Service outbound IPs (found in: App Service → Properties → Outbound IP addresses)
3. Optionally: enable "Allow Azure services" to allow all Azure-origin IPs (less precise)
4. SSL enforcement: Flexible Server requires SSL. Connection string must include `Ssl Mode=Require`

**Database and schema that must exist before first app startup:**

| Item | Value |
|------|-------|
| Database name | `terrafusion_benton_demo` |
| Schema | `canonical_tf` (parcel and sale tables) |
| Schema | `public` (EF migrations table) |
| EF migrations applied | All migrations in `TerraFusion.Data` must be at latest |
| Parcel count | 84,388 distinct (`canonical_tf.tf_parcel`) |

EF migrations are not auto-applied on startup by default — they must be run separately before or as part of the deploy.

---

## 6. Build Feasibility

**Canonical build target:** `backend/Dockerfile.API`

```bash
# From repo root, in backend/ directory:
docker build \
  -f Dockerfile.API \
  --build-arg GIT_SHA=$(git rev-parse --short HEAD) \
  -t terrafusion-api:benton-demo \
  .
```

**Build verified feasibility:**
- Multi-stage build: `sdk:8.0` (build) → `aspnet:8.0` (runtime)
- All project references copy from `backend/src/` subdirectories
- `dotnet restore src/TerraFusion.API/TerraFusion.API.csproj --runtime linux-x64`
- `dotnet publish ... -c Release -o /app/publish --self-contained false`
- Non-root user (`terrafusion`) baked in — no privilege issues on App Service

**Known build dependencies:**
- `backend/Directory.Packages.props` (central package management — must be in build context)
- `backend/src/Directory.Build.targets` (build targets)
- All project `.csproj` files in `src/` (see Dockerfile.API COPY list)

**Deployment workflow:** `.github/workflows/deployment.yml` exists (manual `workflow_dispatch` only).
Currently set to push-trigger disabled. Would need to be wired to App Service for CD. This is a
future WO step — not this WO.

---

## 7. Manual Azure UI Steps (Checklist — Not Authorized Yet)

These are the steps a human operator must take in the Azure portal or CLI to configure and deploy.
Listed here for operator review — **not to be executed until WO-DEPLOY-BENTON-003C is authorized.**

### Step 1 — Create / Select App Service Plan
- SKU: B2 or P1v3 (Linux) recommended for .NET 8 demo workload
- OS: Linux
- Region: match PostgreSQL Flexible Server region (West US 2 / same VNet)

### Step 2 — Create App Service
- Runtime stack: select "Docker Container" → use `Dockerfile.API` (or push image to GHCR first)
- Alternatively: "Custom Container" pointing to `ghcr.io/bsvalues/terrafusion_os_1.0:benton-demo`
- Set startup command: leave blank (Dockerfile.API ENTRYPOINT handles it)

### Step 3 — Configure Application Settings
- Add all keys from §2 above
- Inject secrets from Key Vault or directly as "Secret" type settings
- Set `WEBSITES_PORT=5000`
- Set `ASPNETCORE_ENVIRONMENT=BentonCounty` (to load `appsettings.BentonCounty.json` overrides)

### Step 4 — Configure Connection Strings
- Add `DefaultConnection` under Connection Strings → PostgreSQL type
- Value: full connection string with `Ssl Mode=Require`

### Step 5 — PostgreSQL Firewall
- Add App Service outbound IPs to PostgreSQL Flexible Server firewall rules (see §5)

### Step 6 — CORS
- In `AllowedOrigins`, add the App Service URL (`https://<app>.azurewebsites.net`)
- If frontend is served separately, add its URL too

### Step 7 — Health Check
- App Service → Health check → Path: `/health`

### Step 8 — HTTPS Only
- App Service → TLS/SSL → HTTPS Only: On

### Step 9 — Run EF Migrations
- Before first startup OR via a deploy hook:
  ```bash
  dotnet ef database update \
    --project TerraFusion.Data \
    --startup-project TerraFusion.API \
    --connection "<azure-connection-string>"
  ```
- This is a data operation — requires operator authorization (SW-02 scope).

### Step 10 — Smoke Verify
- GET `https://<app>.azurewebsites.net/health` → HTTP 200
- GET `https://<app>.azurewebsites.net/healthz/ready` → HTTP 200
- GET `https://<app>.azurewebsites.net/api/properties?countyId=benton` → parcels from Azure DB

---

## 8. Open Gaps and Blockers

| Gap | Impact | Resolution WO |
|-----|--------|---------------|
| App Service not yet provisioned | Cannot deploy | WO-DEPLOY-BENTON-003C (requires operator authorization) |
| EF migrations not verified against Azure DB schema | Risk of startup failure | Run as part of 003C pre-deploy |
| Outbound IP addresses unknown (no App Service yet) | Cannot add PostgreSQL firewall rules | Resolved after App Service creation |
| Deployment workflow not wired to App Service | No CD path | Future WO (CD pipeline wiring) |
| PACS sync config — should be disabled for demo | Risk of PACS connection errors on startup | Set `ConnectionStrings__PacsConnection` to empty or disable sync |
| Redis not provisioned | Cache degraded mode will activate | Acceptable for demo; `EnableDegradedMode: true` |
| `Security__JwtSecret` vs `JwtSettings__SecretKey` confusion in BentonCounty config | Runtime auth failure if wrong key used | Confirmed: use `JwtSettings__SecretKey` (see §2c and `$comment` in appsettings.BentonCounty.json) |
| `Workbench__Evidence__HmacKey` placeholder in base appsettings | Runtime error if Workbench accessed without real key | Must be replaced in Azure settings before Workbench use |

---

## 9. Stop Walls This WO Respected

| Wall | Description | Action |
|------|-------------|--------|
| SW-01 | Production deployment authorization | Not crossed — no provisioning or deploy executed |
| SW-02 | County data mutation | Not crossed — no DB writes |
| SW-03 | Secrets and credential handling | Not crossed — no secret values in this doc |

---

## Evidence

- Dockerfile.API reviewed: `backend/Dockerfile.API`
- appsettings files reviewed: `appsettings.json`, `appsettings.Development.json`, `appsettings.BentonCounty.json`
- Health endpoints confirmed: `backend/src/TerraFusion.API/Program.cs`
- Deployment workflow reviewed: `.github/workflows/deployment.yml`
- Azure DB confirmed available: `pg-terrafusion-benton-demo.postgres.database.azure.com` (WO-DEPLOY-BENTON-001 evidence)
- Demo DB verified complete: `terrafusion_benton_demo`, 84,388 parcels, 90,386 sales (WO-DEPLOY-BENTON-003A evidence)

---

**Next WO:** WO-DEPLOY-BENTON-003C — Authorize and execute App Service provisioning + config injection (SW-01 authority wall; requires explicit operator authorization).
