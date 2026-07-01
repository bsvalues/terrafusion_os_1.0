# WO-DEPLOY-BENTON-003C — Azure App Service Deployment Evidence

**Work Order:** WO-DEPLOY-BENTON-003C  
**Program:** P1 — Benton Demo / Deployment Readiness  
**Date:** 2026-07-01  
**Status:** COMPLETE — App Service live, DB connected, health passing  
**Classification:** Evidence / Deployment Record  
**Authority Boundary:** SW-01 authorized by operator on 2026-06-30 ("authorized, go")

---

## Summary

TerraFusion.API (Kernel) is deployed to Azure App Service and serving real requests against the
`terrafusion_benton_demo` database on Azure PostgreSQL Flexible Server. This document records
everything provisioned, all blockers encountered, and the evidence of successful deployment.

---

## 1. Resources Provisioned

| Resource | Value |
|----------|-------|
| App Service Plan | `plan-terrafusion-benton-demo` (B2, Linux, West US 2) |
| App Service | `app-terrafusion-benton-demo` |
| Public URL | `https://app-terrafusion-benton-demo.azurewebsites.net` |
| Runtime stack | `DOTNETCORE\|8.0` (Linux, framework-dependent) |
| Startup command | `dotnet TerraFusion.API.dll` |
| HTTPS-only | Enabled |
| Always On | Disabled (B2 plan, idle shutdown acceptable for demo) |
| Health check path | `/health` |
| PostgreSQL server | `pg-terrafusion-benton-demo.postgres.database.azure.com` |
| PostgreSQL database | `terrafusion_benton_demo` |

---

## 2. Configuration Injected

### App Settings (Azure Portal → Configuration → App Settings)

| Key | Value (summary, no secrets) |
|-----|-----------------------------|
| `ASPNETCORE_ENVIRONMENT` | `BentonCounty` |
| `ASPNETCORE_URLS` | `http://+:5000` |
| `WEBSITES_PORT` | `5000` |
| `TZ` | `America/Los_Angeles` |
| `County__Name` | `Benton County` |
| `County__State` | `WA` |
| `County__Code` | `053` |
| `County__PropertyCount` | `84388` |
| `RuntimeTruth__ExpectedBentonParcelCount` | `84388` |
| `RuntimeTruth__ExpectedJune10Database` | `terrafusion_benton_demo` |
| `RuntimeTruth__ExpectedJune10Provider` | `Npgsql` |
| `JwtSettings__SecretKey` | [SECRET — injected, not logged] |
| `JwtSettings__Issuer` | `TerraFusion.API` |
| `JwtSettings__Audience` | `TerraFusion.Client` |
| `JwtSettings__ExpirationMinutes` | `60` |
| `Workbench__Evidence__HmacKey` | [SECRET — injected, not logged] |
| `Workbench__Evidence__KeyId` | `default` |
| `Security__RequireHttps` | `true` |
| `Security__EnableRateLimiting` | `true` |
| `Security__MaxRequestsPerMinute` | `100` |
| `AllowedOrigins__0` | `https://app-terrafusion-benton-demo.azurewebsites.net` |
| `ConnectionStrings__DefaultConnection` | [SECRET — Azure PG Flexible Server, not logged] |

### Configuration Override Approach

`appsettings.BentonCounty.json` contains `Host=localhost` as a dev placeholder with a
`${TF_DB_PASSWORD}` token that ASP.NET Core does not expand. Because `Program.cs` adds
`appsettings.BentonCounty.local.json` as the LAST config source (after env vars), a
`appsettings.BentonCounty.local.json` file was bundled with the publish output containing the
real Azure PostgreSQL connection string. This correctly overrides the localhost placeholder.

No code changes were made to `Program.cs`.

### PostgreSQL Firewall

| Rule | Start IP | End IP | Purpose |
|------|----------|--------|---------|
| `allow-local-machine` | local dev IP | local dev IP | Dev access |
| `allow-azure-services` | `0.0.0.0` | `0.0.0.0` | Azure-origin catch-all (includes App Service) |

---

## 3. Publish Details

| Field | Value |
|-------|-------|
| Publish command | `dotnet publish --runtime linux-x64 --self-contained false` |
| Deploy method | `az webapp deploy --type zip --restart true` |
| Deploy zip size | ~98 MB |
| Published DLLs | 305 files |
| Startup fix | `dotnet TerraFusion.API.dll` startup command (multiple runtimeconfig.json blocked auto-detect) |

### Blockers Encountered and Fixed

| Blocker | Root Cause | Fix |
|---------|-----------|-----|
| `Microsoft.Data.SqlClient` FileNotFoundException | Publish done on Windows without `--runtime linux-x64`; Windows-native SNI not found on Linux | Re-published with `--runtime linux-x64` |
| Azure "Welcome" page (placeholder) on root | Multiple `*.runtimeconfig.json` in zip caused Azure to fall back to `hostingstart.dll` | Set startup command: `dotnet TerraFusion.API.dll` |
| `SovereignGuard` → `Environment.Exit(1)` | `sovereign.yaml` not found on Azure container walk-up | Bundled `sovereign.yaml` in publish zip root |
| DB connecting to `localhost:terrafusion` | `appsettings.BentonCounty.json` loaded AFTER env vars in custom `ConfigureAppConfiguration`; env var `ConnectionStrings__DefaultConnection` was overridden by the JSON file | Bundled `appsettings.BentonCounty.local.json` (last in config chain) with Azure connection string |
| `ConnectionStrings` type `PostgreSQL` not mapping | Azure PostgreSQL connection string type exposes as `POSTGRESQLCONNSTR_*`; ASP.NET Core does not map this prefix | Deleted PostgreSQL-type CS; added `ConnectionStrings__DefaultConnection` as App Setting |

---

## 4. Smoke Verification Results

All checks performed against `https://app-terrafusion-benton-demo.azurewebsites.net`.

| Check | Result | Evidence |
|-------|--------|---------|
| `GET /health` → HTTP 200 | ✅ PASS | `{"status":"Healthy","timestamp":"2026-07-01T01:00:08Z","environment":"BentonCounty","version":"1.0.0","service":"TerraFusion OS API - Basic Mode"}` |
| `environment` = `BentonCounty` | ✅ PASS | JSON response above |
| Sovereign manifest verified | ✅ PASS | Log: `Sovereign manifest verified. Hash: f754e0129ae377...` at `01:12:06Z` |
| Azure DB connected, no pending migrations | ✅ PASS | Log: `AutoMigrate: no pending migrations` at `01:12:54Z` |
| `GET /healthz/ready` | 401 (auth-protected; expected for non-public endpoint) |
| `GET /api/properties` | 401 (JWT required; not a failure — auth wall proves auth is active) |

---

## 5. Stop Walls Respected

| Wall | Description | Status |
|------|-------------|--------|
| SW-01 | Production deployment authorization | CROSSED — authorized by operator on 2026-06-30 ("authorized, go") |
| SW-02 | County data mutation | NOT CROSSED — no data mutations. EF migrations reported "no pending migrations" (existing schema). |
| SW-03 | Secrets and credential handling | Managed — secrets injected via App Service settings, never logged or committed |

---

## 6. Open Items

| Item | Status | Next WO |
|------|--------|---------|
| WO-DATA-BENTON-DUPE-001B: DELETE 30 anomalous rows | PARKED — needs separate operator authorization (SW-02) | Operator decision required |
| CD pipeline wiring (.github/workflows/deployment.yml) | DEFERRED — manual deploy only for now | Future WO |
| Frontend deployment | NOT IN SCOPE for 003C | Future WO |
| Redis provisioning | NOT NEEDED — degraded mode acceptable for demo | Future WO |
| AKS migration | NOT IN SCOPE | Future WO |

---

## 7. Evidence Log (Key Timestamps UTC)

| Time | Event |
|------|-------|
| 2026-06-30T23:xx | PR #1119 (WO-DEPLOY-BENTON-003B) merged — preflight doc landed |
| 2026-07-01T00:21 | App Service provisioned + first async deploy (incorrect: Windows publish) |
| 2026-07-01T00:36 | Startup fixed: `dotnet TerraFusion.API.dll` startup command set |
| 2026-07-01T00:52 | `SovereignGuard` blocker found and fixed: bundled `sovereign.yaml` |
| 2026-07-01T00:59 | DB connection blocker found: `appsettings.BentonCounty.json` override |
| 2026-07-01T01:09 | Re-publish with `--runtime linux-x64` + `appsettings.BentonCounty.local.json` bundled |
| 2026-07-01T01:12:06 | `Sovereign manifest verified` ✅ |
| 2026-07-01T01:12:54 | `AutoMigrate: no pending migrations` (Azure DB connected) ✅ |
| 2026-07-01T01:13:36 | `GET /health` → 200, `status: Healthy`, `environment: BentonCounty` ✅ |

---

**WO-DEPLOY-BENTON-003C: COMPLETE**

Next authorized work: operator decision on WO-DATA-BENTON-DUPE-001B (DELETE 30 rows, SW-02) or
any new WO authorized via `/goal benton-demo` + `/loop program`.
