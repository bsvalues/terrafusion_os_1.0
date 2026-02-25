# TerraFusion OS — Security & Data Flow One-Pager

**Prepared by**: Bill Spencer, Benton County Assessor
**Date**: February 25, 2026
**For**: Daniel (Co-Development Partner)
**Classification**: Development Environment Architecture

---

## Security Model Summary

TerraFusion targets FISMA-HIGH / NIST 800-53. In the development environment,
this manifests as:

| Control | Implementation | Status |
|---------|---------------|--------|
| **Access Control** | JWT auth, role-based (Admin, PropertyAssessor, DataManager) | Enforced in API |
| **Audit Trail** | Every entity has CreatedAt/UpdatedAt/CreatedBy/UpdatedBy (auto) | Active |
| **Branch Protection** | 5 required checks, no force push, include admins | Enforced on `main` |
| **PACS Isolation** | Sealed `PacsSqlAdapter` class = single DB boundary | Proven |
| **County Sovereignty** | All queries scoped by CountyId | By design |
| **Encryption** | PACS connection requires `Encrypt=True` per contract | Enforced |
| **Read-Only PACS** | Contract prohibits writes to Harris data | Enforced in adapter |

---

## Data Flow: Property Read

```
┌─────────────┐     ┌──────────────────┐     ┌───────────────────────┐
│  React UI   │────>│  .NET 8 API      │────>│  PacsSqlAdapter       │
│  (Vite 5)   │<────│  (Port 5000)     │<────│  (Singleton, Dapper)  │
│             │     │                  │     │                       │
│  /property  │     │  Controllers:    │     │  SELECT FROM          │
│  /assess    │     │  PacsOps         │     │  vw_TerraFusion_*     │
│  /owner     │     │  HarrisPACS      │     │                       │
└─────────────┘     └──────────────────┘     └───────────┬───────────┘
                                                         │ ADO.NET
                                                         │ Encrypt=True
                                                         ▼
                                              ┌───────────────────────┐
                                              │  SQL Server 2019      │
                                              │  Container: tf-mssql  │
                                              │  DB: pacs_oltp        │
                                              │  Port: 1433           │
                                              │                       │
                                              │  112,057 properties   │
                                              │  1,662 tables         │
                                              │  3 TF views           │
                                              │  1 health check proc  │
                                              │  3 perf indexes       │
                                              └───────────────────────┘
```

---

## PACS Contract Boundary (pacscontract.v1)

The **only** code that touches the PACS database is `PacsSqlAdapter.cs` in
`TerraFusion.Core/PACS/`. It is a `sealed` class. Everything else goes
through the `IPacsAdapter` interface.

### What the adapter enforces:

1. **Connection validation** — must target `pacs_oltp`, must use `Encrypt=True`
2. **Read-only** — only SELECT queries, no INSERT/UPDATE/DELETE
3. **Contract views** — queries only hit `vw_TerraFusion_*` views, never raw tables
4. **Audit naming** — connection uses `Application Name=TerraFusion-OS` for SQL audit
5. **Timeout** — configurable via `PACS:CommandTimeoutSeconds` (default 30s)
6. **Health check** — `sp_TerraFusion_HealthCheck` validates DB alive + row counts

### View → DTO mapping:

| View | DTO | Row Count |
|------|-----|-----------|
| `vw_TerraFusion_Property_Core` | `PacsPropertyCore` | 112,057 |
| `vw_TerraFusion_Property_Ownership` | `PacsPropertyOwnership` | 246,157 |
| `vw_TerraFusion_Assessment_History` | `PacsAssessmentHistory` | 1,507,033 |

### Raw Harris tables behind the views:

| TF View | Harris Tables Used |
|---------|-------------------|
| Property Core | `property`, `property_val` (sup_num=0, latest year), `situs` (primary) |
| Ownership | `owner` (latest tax year, sup_num=0), `account`, `address`, `chg_of_owner` |
| Assessment History | `property_val` (sup_num=0, all years) |

---

## Connection String (Development)

```
Server=localhost,1433;
Database=pacs_oltp;
User Id=sa;
Password=TF_Pacs2026!;
TrustServerCertificate=True;
Encrypt=True;
Application Name=TerraFusion-OS;
```

Configuration key: `ConnectionStrings:PacsConnection` in `appsettings.Development.json`
Fallback: `PACS:ConnectionString`
Environment variable: `ConnectionStrings__PacsConnection`

---

## Network Topology (Development)

```
┌──────────────────────────────────────────────────────┐
│  Windows Host (Bill's Machine)                       │
│                                                      │
│  ┌──────────────┐  ┌─────────────────────────────┐   │
│  │ .NET 8 API   │  │ Docker Desktop (WSL2)       │   │
│  │ Port 5000    ├──┤                             │   │
│  │              │  │  ┌─────────────────────┐    │   │
│  └──────────────┘  │  │ tf-mssql            │    │   │
│                    │  │ SQL Server 2019     │    │   │
│  ┌──────────────┐  │  │ Port 1433           │    │   │
│  │ Vite Dev     │  │  │ Vol: tf_mssql_data  │    │   │
│  │ Port 3000    │  │  └─────────────────────┘    │   │
│  │ (React)      │  │                             │   │
│  └──────────────┘  │  ┌─────────────────────┐    │   │
│                    │  │ Redis (optional)    │    │   │
│                    │  │ Port 6379           │    │   │
│                    │  └─────────────────────┘    │   │
│                    └─────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

---

## Security Boundaries

| Boundary | Mechanism | Threat Mitigated |
|----------|-----------|-----------------|
| Browser → API | JWT + CORS allowlist | Unauthorized access |
| API → PACS DB | Encrypted connection, sealed adapter | Data exfiltration |
| PACS Views → Raw Tables | SQL views abstract Harris schema | Schema coupling |
| Branch → Main | 5 CI checks, SEAL gate | Unreviewed code |
| Docker → Host | Container network isolation | Lateral movement |
| Container data | Named Docker volume `tf_mssql_data_pacs` | Data persistence |

---

## Known Gaps (Honest Assessment)

1. **SA password in appsettings** — acceptable for dev, must use secrets manager for prod
2. **TrustServerCertificate=True** — dev convenience, prod needs real cert
3. **No network segmentation** — everything runs on localhost in dev
4. **Redis optional** — cache falls back to NoOp in dev mode
5. **No rate limiting** — dev config allows 1000 req/min (configurable)

---

## Files That Matter

| File | Purpose |
|------|---------|
| `backend/src/TerraFusion.Core/PACS/PacsSqlAdapter.cs` | The one ring — sealed PACS boundary |
| `backend/src/TerraFusion.Core/PACS/IPacsAdapter.cs` | Contract interface |
| `backend/src/TerraFusion.Core/PACS/PacsServiceRegistration.cs` | DI registration |
| `backend/src/TerraFusion.API/Controllers/PacsOpsController.cs` | `/ops/pacs/proof` endpoint |
| `ops/dev/pacs-contract-views.sql` | View/proc/index deployment SQL |
| `ops/dev/restore-pacs-from-archives.ps1` | Deterministic restore pipeline |
| `ops/dev/test-pacs-contract.ps1` | 18-check contract proof (mirrors ValidateContractAsync) |
| `backend/src/TerraFusion.API/appsettings.Development.json` | Connection string config |

---

*No secrets in source. No writes to PACS. No shortcuts on encryption.*
