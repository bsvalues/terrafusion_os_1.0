# PACS Integration Proof

Date: 2026-03-19
Phase: Sprint 0
Gate: Sprint 0 Gate (S0-B/C/D)

## Status: CODE COMPLETE — ENVIRONMENT PENDING

## Contract Evidence

### SQL Deployment Script

File: `docs/spec-lock/locks/pacscontract/pacscontract.v1/pacs-contract-views.pacs_golive.sql`
Committed: 7e647caad

Views declared:
| View | Status |
|---|---|
| `vw_TerraFusion_Property_Core` | In SQL file |
| `vw_TerraFusion_Property_Ownership` | In SQL file |
| `vw_TerraFusion_Assessment_History` | In SQL file |
| `vw_TerraFusion_Comparable_Sales` | In SQL file |
| `vw_TerraFusion_Cama_Characteristics` | In SQL file (added S0-A) |
| `vw_TerraFusion_Improvement_Cost_Matrices` | In SQL file (added S0-A) |
| `sp_TerraFusion_HealthCheck` | In SQL file |

Indexes:
- `IX_TerraFusion_Property_GeoID` (conditional)
- `IX_TerraFusion_PropertyVal_PropYear` (conditional)
- `IX_TerraFusion_Situs_Property` (conditional)

### SpecLock Status

File: `docs/spec-lock/locks/pacscontract/pacscontract.v1/SPEC_LOCK_v1.0.0.md`
Sprint 0 amendment applied 2026-03-19 — formally declares all 6 views.

### Adapter Registration

`PacsSqlAdapter` DI-registered in backend. Feature-flagged via `TF_ENABLE_HARRIS_PACS_BACKGROUND_SYNC`.

## Live Integration Test Results

**Status: BLOCKED — live `pacs_golive` clone DB not reachable from Copilot lane**

Tests requiring live environment:
- `PacsBentonContractTests` — status: NOT RUN (target: all pass)
- `PacsIntegrationTests` — status: NOT RUN (target: all pass)
- `r1-acceptance-criteria` data path tests — status: 2 fail (PACS data absent)

## Environment Prerequisites for S0-D Execution

```bash
# 1. Deploy SQL objects
sqlcmd -S <pacs_golive_host> -d pacs_golive -i docs/spec-lock/locks/pacscontract/pacscontract.v1/pacs-contract-views.pacs_golive.sql

# 2. Verify deployment
EXEC sp_TerraFusion_HealthCheck  -- expect STATUS='HEALTHY', 6 views present

# 3. Set environment
$env:PACS_CONNECTION_STRING = "Server=<host>;Database=pacs_golive;..."
$env:TF_ENABLE_HARRIS_PACS_BACKGROUND_SYNC = "true"

# 4. Run contract tests
dotnet test --filter "PacsBentonContractTests|PacsIntegrationTests"

# 5. Run acceptance criteria
node --test os-platform/core/tests/r1-acceptance-criteria.test.mjs
# Target: 84/84 pass
```

## Benton County Scope Note

Only `pacs_golive` (Benton County PACS clone) is in scope for V1.
No other DataMining connectors (ATTOM, Zillow, NARRPR, PACMLS, SMTP) are present.
