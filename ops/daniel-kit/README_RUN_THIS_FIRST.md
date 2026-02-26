# TerraFusion OS — Developer Onboarding

**Welcome, Daniel.** This is a real platform with real data. Here's what works
right now, what to try first, and where you'd build.

---

## 1. Platform Boot (the first 60 seconds)

**Prerequisites:** Git, Node v22+, pnpm, .NET 8 SDK, Docker Desktop (WSL2), PowerShell 7+

```powershell
git clone <repo-url> && cd terrafusion_os_1.0
pnpm install                         # workspace deps (~30s)
```

### Frontend (React 18 + Vite + TypeScript)
```powershell
pnpm -C frontend exec vite --host   # boots in ~2s → http://localhost:5173
```
- 717 TypeScript files, 0 errors
- OS Shell UI: `frontend/apps/os-shell/`
- Vite 5, Tailwind CSS 4, Radix UI, shadcn/ui

### Backend (.NET 8 API)
```powershell
cd backend
dotnet build TerraFusion.sln         # 0 warnings, 0 errors
$env:ASPNETCORE_ENVIRONMENT = "Development"   # REQUIRED for PACS connection
dotnet run --project src/TerraFusion.API/TerraFusion.API.csproj
# → http://localhost:5000/health returns 200
```

> **Important:** The PACS connection string lives in `appsettings.Development.json`.
> Without `ASPNETCORE_ENVIRONMENT=Development`, PACS endpoints return 500.

### Both at once
```powershell
pnpm run dev                         # concurrently: backend + frontend
```

---

## 2. Tests (they pass)

| Suite | Command | Result |
|-------|---------|--------|
| Core type-check | `pnpm run type-check` | 0 errors |
| Governance (phase83) | `node --test os-platform/core/tests/phase83-tools.test.mjs` | 32/32 pass |
| Root unit tests | `pnpm run test:unit` | 164/164 pass (3.2s) |
| Backend build | `dotnet build TerraFusion.sln` | 0 warnings, 0 errors |
| Frontend type-check | `cd frontend && pnpm exec tsc --noEmit` | 0 errors across 717 files |

---

## 3. Real Data: Benton County PACS (112K parcels)

This is where it gets interesting. We have a real Harris PACS database — 112,057
properties, 1,662 tables, actual Benton County assessor data.

### Restore + Prove (4 scripts, ~10 min)
```powershell
cd ops/daniel-kit
pwsh 0_restore.ps1              # Restore PACS into Docker SQL Server
pwsh 1_deploy_contract.ps1      # Deploy TerraFusion abstraction views
pwsh 2_run_proof.ps1            # Run 18-check contract test + API proof
pwsh 3_live_parcel_query.ps1    # Query real parcels through views
```

After running, `proof-bundle/` contains:

| File | What it proves |
|------|---------------|
| `proof.json` | Machine-readable: `contractValid: true`, dbName, server, latency |
| `contract-checks.log` | 18 checks: views exist, row counts match, indexes present |
| `environment.txt` | Docker state, .NET version, git commit, volumes |
| `parcel-sample.txt` | Live query: property, owner, and assessment history rows |

The API proof endpoint (`GET /ops/pacs/proof`) returns:
```json
{
  "contract": { "name": "pacscontract.v1", "version": "1.0.0" },
  "dbName": "pacs_oltp",
  "server": "lo***33",
  "contractValid": true,
  "latencyMs": 605
}
```

---

## 4. Architecture (where you'd build)

```
terrafusion_os_1.0/
├── frontend/apps/os-shell/     ← OS Shell UI (authorized zone)
├── backend/src/
│   ├── TerraFusion.API/        ← .NET 8 API (port 5000)
│   ├── TerraFusion.Core/       ← Domain logic, PACS adapter
│   └── TerraFusion.Data/       ← EF Core, 20+ DbSets
├── os-platform/core/           ← Governance, tools, pilot runtime
├── tools/                      ← Dev tooling, registries
├── ops/                        ← Infra scripts, Docker, daniel-kit
└── docs/daniel/                ← One-pager, security flow, demo script
```

Key reading in `docs/daniel/`:
- `01-pilot-one-pager.md` — What TerraFusion is, in one page
- `02-security-data-flow.md` — How data flows, where PACS fits
- `03-demo-script.md` — Walkthrough for the demo

---

## 5. What's real vs. aspirational

| Layer | Status | Notes |
|-------|--------|-------|
| Frontend shell | **Boots, compiles** | 717 TS files, 0 errors, Vite dev server works |
| .NET API | **Builds, runs, serves** | 0 warnings, health + PACS proof endpoints |
| PACS integration | **Proven** | 112K parcels, 18/18 contract checks pass |
| Governance gates | **Pass** | type-check + phase83 (32/32) + unit (164/164) |
| AI Swarm | Exists, frozen | 1,008 agents defined — do not modify |
| Marketplace | Scaffolded | Plugin structure present, not active |

---

## 6. Useful commands cheat sheet

```powershell
# Frontend
pnpm -C frontend exec vite --host          # Dev server
cd frontend && pnpm exec tsc --noEmit       # Type-check

# Backend
cd backend && dotnet build TerraFusion.sln  # Build
$env:ASPNETCORE_ENVIRONMENT = "Development"  # Required for PACS
cd backend && dotnet run --project src/TerraFusion.API/TerraFusion.API.csproj

# Tests
pnpm run type-check                         # Core governance
pnpm run test:unit                          # 164 unit tests
pnpm run test:governed                      # Type-check + phase83

# PACS
curl http://localhost:5000/ops/pacs/proof   # Contract proof (needs API + Docker)
curl http://localhost:5000/ops/pacs/properties?page=1   # Paginated parcel list
curl http://localhost:5000/ops/pacs/property/<geoId>    # Single parcel lookup
curl http://localhost:5000/health           # API health
```

---

## If something breaks

- Every script exits 0 on success, 1 on failure
- Check `proof-bundle/` for partial output
- `contract-checks.log` shows exactly which check failed
- All errors include correlation IDs for trace lookup

**Contact:** Bill Spencer, Benton County Assessor
