# TerraFusion OS — Pilot One-Pager for Co-Dev Onboarding

**Prepared by**: Bill Spencer, Benton County Assessor
**Date**: February 25, 2026
**For**: Daniel (Co-Development Partner)
**Classification**: Development Environment — Not Production

---

## What Is This?

TerraFusion OS is a government operating system for county property assessment.
It replaces the patchwork of spreadsheets, Access databases, and manual workflows
that assessor offices have lived with for decades. One platform: property data,
valuations, ownership, tax levies, compliance, AI-assisted mass appraisal — all
in a system designed from day one for FISMA-HIGH security.

---

## What's Actually Working Today

| Layer | Status | Evidence |
|-------|--------|---------|
| **PACS Database** | Live on Docker | 112,057 parcels, 1,662 tables, SQL Server 2019 |
| **Contract Abstraction** | Deployed | 3 views, 1 health proc, 3 indexes (pacscontract.v1) |
| **.NET 8 API** | Builds & runs | `/ops/pacs/proof` returns `contractValid: true` in 431ms |
| **React Frontend** | Builds | 33 routes, Vite 5, TypeScript 5.3 |
| **CI/CD** | Active | SEAL Gate, governed-spine, 5 required status checks |
| **Test Suite** | 716 tests | 91.9% pass rate across testing-suite |

### PACS Contract Proof (live output, Feb 25 2026)

```json
{
  "contractValid": true,
  "databases": { "pacsOltp": "reachable" },
  "views": {
    "vwTerraFusionPropertyCore": "ok",
    "vwTerraFusionPropertyOwnership": "ok",
    "vwTerraFusionAssessmentHistory": "ok"
  },
  "indexes": {
    "ixTerraFusionPropertyGeoId": "ok",
    "ixTerraFusionPropertyValPropYear": "ok",
    "ixTerraFusionSitusProperty": "ok"
  },
  "healthCheckExecution": "passed",
  "latencyMs": 431,
  "errors": [],
  "warnings": []
}
```

---

## What's Honest

1. **The data is real but dated.** The restored backup (pacs_benton_122915.bak) is from
   December 2015. A second backup (pacs_golive, April 2023, ~47 GB uncompressed) exists
   and will replace it when we're ready for the disk cost.

2. **The frontend has known tech debt.** Legacy `frontend/src/` has 97+ TypeScript errors.
   New work goes in `frontend/apps/os-shell/` (Lane B). The old code stays frozen.

3. **Many modules are stubs.** TerraForge, TerraAtlas, TerraDais, TerraDossier, TerraGPT
   are defined but not feature-complete. The working pieces are TerraPilot, TerraTrace,
   TerraCanon, and the PACS adapter.

4. **AI swarm is architectural, not production.** The 1,008 agent topology exists as code
   and coordination infra. Agents are not doing live assessments yet.

5. **Single developer to date.** All governance (branch protection, CI gates, commit
   hygiene) was designed for solo dev with CI-as-constitutional-review. Adding a second
   developer means we activate review-required and pair programming.

---

## Data Inventory

| Asset | Location | Size | Date |
|-------|----------|------|------|
| Benton PACS (restored, live) | Docker `tf-mssql` | 16.8 GB compressed | Dec 29, 2015 |
| Benton PACS (golive, archive) | `data/benton/extracted/MSSQL/.../` | 6.9 GB compressed / 47 GB uncompressed | Apr 27, 2023 |
| Benton CAMA RAG datasets | `data/benton/` | Multiple JSON/CSV | Various |
| Original archives | `data/benton/MSSQL.rar`, `pacs_benton_122915.rar` | 4.98 + 2.06 GB | 2015/2023 |

---

## How to Reproduce Everything

```powershell
# 1. Restore PACS from archived backups
pwsh ops/dev/restore-pacs-from-archives.ps1 -SaPassword "TF_Pacs2026!"

# 2. Deploy contract views
docker cp ops/dev/pacs-contract-views.sql tf-mssql:/tmp/
docker exec tf-mssql /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P "TF_Pacs2026!" -C -i /tmp/pacs-contract-views.sql

# 3. Validate contract
pwsh ops/dev/test-pacs-contract.ps1

# 4. Build and run .NET API
cd backend && dotnet build src/TerraFusion.API/TerraFusion.API.csproj
$env:ASPNETCORE_ENVIRONMENT="Development"
dotnet run --project src/TerraFusion.API/TerraFusion.API.csproj

# 5. Verify
curl http://localhost:5000/ops/pacs/proof
```

---

## Commit Trail (PACS Integration)

| Commit | Description |
|--------|-------------|
| `e2ec86d` | Docker PACS doctor + restore scaffolding |
| `0b47097` | PACS restore pipeline + smoke tests (17 GB restored, 112K parcels) |
| `ad824f0` | Deploy pacscontract.v1 views + indexes |
| `2541162` | Wire PacsConnection + contract proof (18/18 PASS) |

---

## Tech Stack (Quick Reference)

- **Backend**: .NET 8, EF Core 8, Dapper (PACS), SignalR
- **Frontend**: React 18.3, TypeScript 5.3, Vite 5, Tailwind CSS
- **Database**: PostgreSQL (production), SQLite (dev), SQL Server 2019 (PACS)
- **Infrastructure**: Docker Desktop, WSL2, Consul, Redis
- **CI**: GitHub Actions, 5 required status checks, SEAL gate

---

*Government. Transcended.*
