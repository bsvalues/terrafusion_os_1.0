# Phase 20 — PACS Deep Integration: Static Verification Evidence

Date: 2026-03-21
Phase: Phase 20 (Claude Code Unified Phase Map 19-30)
Gate: Phase 30 go/no-go input
Status: ✅ PASS (static) — Live DB connection DEFERRED (environment blocker)

## Constraint

SQL Server at localhost:1433 unavailable. `pacs_golive` DB not present in dev environment.
`TF_DEV_PACS_PASSWORD` env var unset. Same environment blocker class as Phase 26-B (DR tabletop)
and Phase 28-A (no K8s staging).

## Static Verification: PACS Adapter Code

**File**: `backend/src/TerraFusion.Core/PACS/PacsSqlAdapter.cs`

| Check | Result |
|---|---|
| Adapter exists | ✅ PRESENT — `PacsSqlAdapter.cs` |
| Implements interface | ✅ `PacsSqlAdapter : IPacsAdapter, IDisposable` |
| Uses SqlClient (not ODBC) | ✅ `using Microsoft.Data.SqlClient` + Dapper |
| Fail-closed semantics | ✅ `PacsContractViolationException` on missing connection string |
| Connection string source | ✅ `configuration.GetConnectionString("PacsConnection")` — no hardcoding |
| Command timeout configurable | ✅ `configuration.GetValue("PACS:CommandTimeoutSeconds", 30)` |

### Six Required Contract Views (pacscontract.v1)

| View Constant | Value | Status |
|---|---|---|
| `ViewPropertyCore` | `vw_TerraFusion_Property_Core` | ✅ DECLARED |
| `ViewPropertyOwnership` | `vw_TerraFusion_Property_Ownership` | ✅ DECLARED |
| `ViewAssessmentHistory` | `vw_TerraFusion_Assessment_History` | ✅ DECLARED |
| `ViewComparableSales` | `vw_TerraFusion_Comparable_Sales` | ✅ DECLARED |
| `ViewCamaCharacteristics` | `vw_TerraFusion_Cama_Characteristics` | ✅ DECLARED |
| `ViewImprovementCostMatrices` | `vw_TerraFusion_Improvement_Cost_Matrices` | ✅ DECLARED |

All 6 pacscontract.v1 views declared as constants. Health check stored proc `sp_TerraFusion_HealthCheck`
also declared.

### Connection String Configuration

`appsettings.Development.json`:
```json
"PacsSalesConnection": "Server=localhost,1433;Database=pacs_golive;User Id=sa;
  Password=${TF_DEV_PACS_PASSWORD};TrustServerCertificate=True;Encrypt=True;
  Application Name=TerraFusion-OS;"
```

- No hardcoded password (uses `${TF_DEV_PACS_PASSWORD}` env var substitution)
- Database target: `pacs_golive` (Benton County PACS schema)
- TrustServerCertificate + Encrypt configured per Harris PACS requirements

## A0 Preflight Record (2026-03-20)

Evidence: `.governance/workflow/PACS_PREFLIGHT_A0_2026-03-20.md`

| A0 Check | Result |
|---|---|
| Connection string present | ✅ PASS |
| TF_DEV_PACS_PASSWORD set | ❌ FAIL — env var not set |
| Port 1433 reachable | ❌ FAIL — no SQL Server listening |
| SQL Server service | ❌ FAIL — no MSSQL service running |

**Stop condition applied**: Per Phase 20 scope lock, no SQL written when A0 fails.
No PACS view SQL modified. No SpecLock modified.

## Live Connection Status

| Requirement | Status | Notes |
|---|---|---|
| SQL Server at localhost:1433 | ❌ Not running | Needs Docker MSSQL or network SQL Server |
| pacs_golive DB | ❌ Not present | County-provided DB with Benton PACS schema |
| TF_DEV_PACS_PASSWORD | ❌ Not set | Requires county PACS credentials |
| Live read from views | ❌ DEFERRED | Blocked by above |

## Classification

**PASS (static) — same deferred classification as:**
- Phase 26-B (DR failover: no staging cluster → tabletop)
- Phase 28-A (Swarm load: no K8s cluster → static + contract)
- Phase 28-C (Recovery: no live swarm → cross-reference)

**Go-live condition**: PACS live connection requires county SQL Server with `pacs_golive` DB.
This is a production environment condition (county infrastructure), not a dev-environment condition.
Decision memo (2026-03-19) classifies PACS as LOW risk, ACCEPTED (deferred), not a launch blocker
for pilot counties without PACS sync dependency.
