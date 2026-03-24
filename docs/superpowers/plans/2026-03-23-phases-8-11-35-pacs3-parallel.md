# Phases 8–11 + 35 + PACS 3 — Multi-Agent Parallel Execution Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete all remaining phases end-to-end — Management Dashboard wiring, Dais/Forge/Atlas backend integration, K8s hardening, and PACS Phase 3 entity.

**Architecture:** Six phases mapped to four parallel waves. Each wave's agents touch independent subsystems with no shared state.

**Tech Stack:** .NET 8 / EF Core / PostgreSQL (backend), React 18 / Vitest (frontend), Kubernetes YAML (infra)

---

## Current State

| Item | Value |
|------|-------|
| HEAD | `babf26554` on `main` |
| Tree | Clean |
| Frontend tests | 6380 pass |
| Backend build | 0 errors |
| Phase 34 | ✅ Verified (4 truths green) |

## Phase Readiness

| Phase | Exists | Gap |
|-------|--------|-----|
| **8 — Management Dashboard** | ManagementDashboard.tsx (424 lines), DaisController endpoints | Live API wiring verification, SignalR real-time updates |
| **9 — Dais Ops** | PropertyDais.tsx (1,661 lines), 19 governed tools defined, DaisController (59KB) | Tool result handlers, audit logging, end-to-end invocation verification |
| **10 — Forge Analytics** | PropertyForge.tsx (236 lines), 5 sub-tabs (Cost/Sales/Income/Reconciliation) | Backend valuation API endpoints missing — ForgeController needed |
| **11 — Atlas Depth** | PropertyAtlas.tsx (595 lines), AtlasGisController (260 lines), 4 layers | Real GIS geometry (placeholder SVG only), spatial data service |
| **35 — K8s SRE** | 17 manifests in `backend/k8s/`, JWT configured, TLS at ingress | PDB manifest, network policies, Redis deployment, DB migration job |
| **PACS 3** | PacsOwnerVal ✅, PacsExemption ✅ | PacsTaxAreaAssoc entity missing (wash_prop_owner_tax_area_assoc) |

---

## Wave Map

```
┌──────────────────────────────────────────────────────────────────┐
│                    WAVE 1 (all parallel)                         │
│                                                                  │
│  Agent W1A         Agent W1B         Agent W1C                   │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐                │
│  │ Phase 10 │     │ Phase 35 │     │ PACS 3   │                │
│  │ Forge    │     │ K8s SRE  │     │ TaxArea  │                │
│  │ Backend  │     │ Hardening│     │ Entity   │                │
│  └──────────┘     └──────────┘     └──────────┘                │
│  Worktree          Worktree         Worktree                    │
│  (backend only)    (k8s only)       (backend only)              │
└──────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│                    WAVE 2 (all parallel)                         │
│                                                                  │
│  Agent W2A                    Agent W2B                          │
│  ┌─────────────────┐        ┌─────────────────┐                │
│  │ Phase 8          │        │ Phase 11         │                │
│  │ Dashboard Wiring │        │ Atlas GIS Data   │                │
│  │ + SignalR        │        │ Service          │                │
│  └─────────────────┘        └─────────────────┘                │
│  Worktree                    Worktree                            │
│  (frontend + backend)        (frontend + backend)                │
└──────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│                    WAVE 3 (single agent)                         │
│                                                                  │
│  Agent W3A                                                       │
│  ┌─────────────────────────────────────────┐                    │
│  │ Phase 9 — Dais Ops                       │                    │
│  │ Tool result handlers + audit + e2e test  │                    │
│  └─────────────────────────────────────────┘                    │
│  Worktree (depends on Phase 10 ForgeController for patterns)     │
└──────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│                 INTEGRATION (sequential)                         │
│                                                                  │
│  1. Merge all worktrees → main                                   │
│  2. Full vitest suite (6380+ tests, 0 regressions)              │
│  3. dotnet build + dotnet test                                   │
│  4. State save                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## WAVE 1 — Independent Backend + Infra (all parallel)

### Agent W1A: Phase 10 — Forge Valuation Backend

**Scope:** Create backend valuation API endpoints that PropertyForge.tsx can call.
**Isolation:** Worktree (backend only)

**Files:**
- Create: `backend/src/TerraFusion.API/Controllers/ForgeController.cs`
- Create: `backend/src/TerraFusion.Core/Interfaces/IValuationService.cs`
- Create: `backend/src/TerraFusion.Core/DTOs/ValuationDtos.cs`
- Modify: `backend/src/TerraFusion.API/Program.cs` (register services)

- [ ] **Step 1: Read existing ForgeOverview, CostApproach, SalesComparison, IncomeApproach components**

Understand what data shapes the frontend expects. Check `frontend/apps/os-shell/src/pages/workbench/tabs/forge/` for all sub-components.

- [ ] **Step 2: Create IValuationService interface**

```csharp
// backend/src/TerraFusion.Core/Interfaces/IValuationService.cs
public interface IValuationService
{
    Task<CostApproachResult> CalculateCostApproachAsync(string parcelId, int taxYear, CancellationToken ct);
    Task<SalesComparisonResult> CalculateSalesComparisonAsync(string parcelId, int taxYear, CancellationToken ct);
    Task<IncomeApproachResult> CalculateIncomeApproachAsync(string parcelId, int taxYear, CancellationToken ct);
    Task<ReconciliationResult> ReconcileAsync(string parcelId, int taxYear, CancellationToken ct);
}
```

- [ ] **Step 3: Create DTOs matching frontend expectations**

- [ ] **Step 4: Create ForgeController with 4 endpoints**

```
GET /api/forge/{parcelId}/cost?taxYear=2015
GET /api/forge/{parcelId}/sales?taxYear=2015
GET /api/forge/{parcelId}/income?taxYear=2015
GET /api/forge/{parcelId}/reconciliation?taxYear=2015
```

- [ ] **Step 5: Implement ValuationService pulling from PACS data**

Query `pacs_valuations`, `pacs_land_details`, `pacs_improvements` for the parcel. Return real data where available, structured fallback where not.

- [ ] **Step 6: Register in Program.cs**

- [ ] **Step 7: Build and verify**

```bash
dotnet build src/TerraFusion.API/TerraFusion.API.csproj
```

- [ ] **Step 8: Commit**

```
feat(forge): Phase 10 — valuation API endpoints (cost/sales/income/reconciliation)
```

---

### Agent W1B: Phase 35 — K8s SRE Hardening

**Scope:** Add missing production K8s manifests.
**Isolation:** Worktree (k8s only)

**Files:**
- Create: `backend/k8s/pdb.yaml`
- Create: `backend/k8s/network-policies.yaml`
- Create: `backend/k8s/redis-deployment.yaml`
- Create: `backend/k8s/db-migration-job.yaml`
- Modify: `backend/k8s/production/deployment.yaml` (add resource requests if missing)

- [ ] **Step 1: Read existing k8s manifests**

Read `backend/k8s/api-deployment.yaml`, `backend/k8s/production/deployment.yaml`, `backend/k8s/production/ingress.yaml` to understand existing patterns.

- [ ] **Step 2: Create Pod Disruption Budget**

```yaml
# backend/k8s/pdb.yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: terrafusion-api-pdb
  namespace: terrafusion
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: terrafusion-api
```

Add PDBs for api, consciousness, and gateway.

- [ ] **Step 3: Create network policies**

Allow only: api ↔ postgres, api ↔ redis, gateway → api, gateway → consciousness, ingress → gateway.

- [ ] **Step 4: Create Redis deployment**

Redis 7-alpine with persistence, matching the compose file pattern.

- [ ] **Step 5: Create DB migration job**

One-shot Kubernetes Job that runs `dotnet ef database update` before deployment.

- [ ] **Step 6: Validate all YAML**

```bash
kubectl apply --dry-run=client -f backend/k8s/ -R
```

Or if kubectl not available, use `yamllint` or manual review.

- [ ] **Step 7: Commit**

```
feat(k8s): Phase 35 — PDB, network policies, Redis deployment, DB migration job
```

---

### Agent W1C: PACS Phase 3 — PacsTaxAreaAssoc Entity

**Scope:** Create the missing `wash_prop_owner_tax_area_assoc` entity + migration + seeder method.
**Isolation:** Worktree (backend only)

**Files:**
- Create: `backend/src/TerraFusion.Core/Entities/Pacs/PacsTaxAreaAssoc.cs`
- Modify: `backend/src/TerraFusion.Data/TerraFusionDbContext.cs` (add DbSet)
- Create: EF migration `AddPacsTaxAreaAssoc`
- Modify: `backend/src/TerraFusion.API/Seeds/PacsDataSeeder.cs` (add SeedTaxAreaAssocsAsync)

- [ ] **Step 1: Read existing PacsOwnerVal.cs and PacsTaxArea.cs for patterns**

- [ ] **Step 2: Create PacsTaxAreaAssoc entity**

Mirror `wash_prop_owner_tax_area_assoc` from Harris PACS. Composite key: `(prop_id, year, sup_num, owner_id, tax_area_id)`.

Key columns from PACS research:
- prop_id, year, sup_num, owner_id (links to wash_prop_owner_val)
- tax_area_id (links to tax_area)

- [ ] **Step 3: Add DbSet to TerraFusionDbContext**

- [ ] **Step 4: Generate EF migration**

```bash
cd backend && dotnet ef migrations add AddPacsTaxAreaAssoc --project src/TerraFusion.Data --startup-project src/TerraFusion.API
```

- [ ] **Step 5: Add SeedTaxAreaAssocsAsync method to PacsDataSeeder**

```sql
SELECT * FROM wash_prop_owner_tax_area_assoc
WHERE year = (SELECT MAX(year) FROM wash_prop_owner_tax_area_assoc)
ORDER BY prop_id, year, sup_num, owner_id
```

- [ ] **Step 6: Build and verify**

- [ ] **Step 7: Commit**

```
feat(pacs): Phase 3 — PacsTaxAreaAssoc entity for wash_prop_owner_tax_area_assoc
```

---

## WAVE 2 — Frontend + Backend Wiring (after Wave 1 merges)

### Agent W2A: Phase 8 — Management Dashboard Live Wiring

**Scope:** Verify and wire live API calls in ManagementDashboard, add SignalR real-time updates.
**Isolation:** Worktree

**Files:**
- Read: `frontend/apps/os-shell/src/pages/dais/ManagementDashboard.tsx`
- Modify: `frontend/apps/os-shell/src/pages/dais/ManagementDashboard.tsx` (if wiring gaps found)
- Modify: `backend/src/TerraFusion.API/Controllers/DaisController.cs` (if endpoints missing)

- [ ] **Step 1: Read ManagementDashboard.tsx and trace all API calls**

Map each hook (useSwarmLive, usePacsStatus, useAppealsQueue, useWorkloadSummary) to its backend endpoint.

- [ ] **Step 2: Verify each endpoint exists and responds**

```bash
curl http://localhost:5000/api/dais/certification/benton/2015
curl http://localhost:5000/api/dais/appeals
curl http://localhost:5000/api/dais/queue/metrics
```

- [ ] **Step 3: Fix any wiring gaps**

If hooks call endpoints that don't exist, add them to DaisController.

- [ ] **Step 4: Add WorkbenchSourceBadge to dashboard sections**

Follow honesty pattern — each data section discloses whether data is live, fallback, or unavailable.

- [ ] **Step 5: Write contract test**

- [ ] **Step 6: Run full vitest suite**

- [ ] **Step 7: Commit**

```
feat(dashboard): Phase 8 — live API wiring + source disclosure for Management Dashboard
```

---

### Agent W2B: Phase 11 — Atlas GIS Data Service

**Scope:** Wire real parcel geometry from PACS data into Atlas layers.
**Isolation:** Worktree

**Files:**
- Create: `backend/src/TerraFusion.Core/Services/GisDataService.cs`
- Modify: `backend/src/TerraFusion.API/Controllers/AtlasGisController.cs`
- Modify: `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyAtlas.tsx`

- [ ] **Step 1: Read AtlasGisController and PropertyAtlas.tsx**

Understand what spatial query shape the frontend expects.

- [ ] **Step 2: Create GisDataService**

Pull parcel boundary data from PACS situs/property tables. Generate GeoJSON from lot dimensions where available.

- [ ] **Step 3: Wire AtlasGisController to GisDataService**

Replace placeholder responses with real PACS-sourced geometry.

- [ ] **Step 4: Update PropertyAtlas.tsx to render real geometry**

Replace deterministic SVG polygon with actual GeoJSON rendering.

- [ ] **Step 5: Build and run tests**

- [ ] **Step 6: Commit**

```
feat(atlas): Phase 11 — GIS data service with PACS-sourced parcel geometry
```

---

## WAVE 3 — Dais Ops (after Wave 1+2 patterns established)

### Agent W3A: Phase 9 — Dais Ops Tool Result Handlers

**Scope:** Complete the tool invocation → result display pipeline for all 19 governed tools.
**Isolation:** Worktree

**Files:**
- Modify: `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyDais.tsx`
- Modify: `backend/src/TerraFusion.API/Controllers/DaisController.cs`
- Create: `backend/src/TerraFusion.Core/Services/GovernedToolAuditService.cs`

- [ ] **Step 1: Read PropertyDais.tsx tool definitions and DaisController endpoints**

Map all 19 tools to their backend handlers.

- [ ] **Step 2: Verify each tool's backend endpoint exists**

For each of the 19 tools, confirm the endpoint in DaisController returns real data or structured fallback.

- [ ] **Step 3: Wire tool result handlers in PropertyDais.tsx**

Each tool invocation should:
1. Call backend via invokeTool
2. Receive structured result
3. Display in appropriate sub-panel
4. Record in invocation history

- [ ] **Step 4: Add GovernedToolAuditService**

Log every tool invocation with: tool name, parcel ID, user, timestamp, result status. Required for FISMA compliance.

- [ ] **Step 5: Run vitest for Dais tests**

- [ ] **Step 6: Run full vitest suite**

- [ ] **Step 7: Commit**

```
feat(dais): Phase 9 — tool result handlers + governed audit logging for all 19 tools
```

---

## Agent Prompts

### W1A (Phase 10 — Forge Backend)

> Create backend valuation API endpoints for PropertyForge. Working directory: C:\Users\bsval\terrafusion_os_1.0
>
> Read `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyForge.tsx` and all sub-components in `frontend/apps/os-shell/src/pages/workbench/tabs/forge/` to understand what data the frontend expects.
>
> Create: `IValuationService` interface in `backend/src/TerraFusion.Core/Interfaces/`, DTOs in `backend/src/TerraFusion.Core/DTOs/ValuationDtos.cs`, `ForgeController` in `backend/src/TerraFusion.API/Controllers/` with 4 endpoints (cost, sales, income, reconciliation), and a `ValuationService` implementation that queries PACS tables (`pacs_valuations`, `pacs_land_details`) for real data.
>
> Register services in Program.cs. Build with `dotnet build src/TerraFusion.API/TerraFusion.API.csproj`. Commit as `feat(forge): Phase 10 — valuation API endpoints`. Do NOT touch frontend code.

### W1B (Phase 35 — K8s SRE)

> Add missing Kubernetes production manifests. Working directory: C:\Users\bsval\terrafusion_os_1.0
>
> Read existing manifests in `backend/k8s/` to understand patterns. Create 4 new files: `pdb.yaml` (PodDisruptionBudgets for api, consciousness, gateway — minAvailable: 1), `network-policies.yaml` (restrict traffic: ingress→gateway, gateway→api/consciousness, api→postgres/redis), `redis-deployment.yaml` (Redis 7-alpine with persistence), `db-migration-job.yaml` (one-shot Job running EF Core migrations).
>
> Follow the namespace `terrafusion` and label patterns from existing manifests. Commit as `feat(k8s): Phase 35 — PDB, network policies, Redis deployment, DB migration job`. Do NOT touch application code.

### W1C (PACS Phase 3)

> Create the PacsTaxAreaAssoc entity for Harris PACS `wash_prop_owner_tax_area_assoc`. Working directory: C:\Users\bsval\terrafusion_os_1.0
>
> Read `backend/src/TerraFusion.Core/Entities/Pacs/PacsOwnerVal.cs` and `PacsTaxArea.cs` for patterns. Create `PacsTaxAreaAssoc.cs` with composite key `(PacsPropId, PropValYear, SupNum, PacsOwnerId, TaxAreaId)`. Add DbSet to `TerraFusionDbContext.cs`. Generate migration: `dotnet ef migrations add AddPacsTaxAreaAssoc --project src/TerraFusion.Data --startup-project src/TerraFusion.API`.
>
> Add `SeedTaxAreaAssocsAsync` method to `PacsDataSeeder.cs` querying: `SELECT * FROM wash_prop_owner_tax_area_assoc WHERE year = (SELECT MAX(year) FROM wash_prop_owner_tax_area_assoc)`. Follow the exact same pattern as `SeedOwnerValsAsync`. Build to verify. Commit as `feat(pacs): Phase 3 — PacsTaxAreaAssoc entity`. Do NOT touch frontend code.

### W2A (Phase 8 — Dashboard)

> Wire live API calls in ManagementDashboard and add source disclosure. Working directory: C:\Users\bsval\terrafusion_os_1.0
>
> Read `frontend/apps/os-shell/src/pages/dais/ManagementDashboard.tsx`. Trace every hook (useSwarmLive, usePacsStatus, useAppealsQueue, useWorkloadSummary) to its API endpoint. Verify each endpoint exists by checking `backend/src/TerraFusion.API/Controllers/DaisController.cs`. If endpoints are missing, add them.
>
> Add `WorkbenchSourceBadge source="fallback"` to each dashboard data section following the pattern in PropertyForge.tsx. Write a honesty contract test. Run `cd frontend && npx vitest run` to verify. Commit as `feat(dashboard): Phase 8 — live API wiring + source disclosure`.

### W2B (Phase 11 — Atlas GIS)

> Wire real parcel geometry from PACS into Atlas GIS layers. Working directory: C:\Users\bsval\terrafusion_os_1.0
>
> Read `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyAtlas.tsx` and `backend/src/TerraFusion.API/Controllers/AtlasGisController.cs`. Create `GisDataService` in `backend/src/TerraFusion.Core/Services/` that queries PACS situs data for parcel boundaries. Wire AtlasGisController to return real PACS-sourced data instead of placeholders.
>
> Update PropertyAtlas.tsx to render actual boundary data when available (keep SVG fallback for missing parcels). Build backend, run frontend tests. Commit as `feat(atlas): Phase 11 — GIS data service with PACS-sourced parcel geometry`.

### W3A (Phase 9 — Dais Ops)

> Complete Dais tool result handlers and add governed audit logging. Working directory: C:\Users\bsval\terrafusion_os_1.0
>
> Read `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyDais.tsx` (all 19 tool definitions) and `backend/src/TerraFusion.API/Controllers/DaisController.cs` (59KB). For each tool, verify its backend endpoint exists and returns structured data. Wire the frontend tool result display — each invokeTool call should update the appropriate sub-panel with the result.
>
> Create `GovernedToolAuditService` in `backend/src/TerraFusion.Core/Services/` that logs every tool invocation (tool name, parcel, user, timestamp, status) for FISMA compliance. Register in Program.cs. Run full vitest suite. Commit as `feat(dais): Phase 9 — tool result handlers + governed audit logging`.

---

## Success Criteria

- [ ] `GET /api/forge/{parcelId}/cost` returns structured valuation data (Phase 10)
- [ ] `kubectl apply --dry-run=client` passes for all k8s manifests (Phase 35)
- [ ] `pacs_tax_area_assocs` table exists with correct schema (PACS 3)
- [ ] ManagementDashboard data sections have source badges (Phase 8)
- [ ] AtlasGisController returns PACS-sourced geometry (Phase 11)
- [ ] All 19 Dais tools have backend handlers + audit logging (Phase 9)
- [ ] Full vitest suite: 6380+ tests, 0 regressions
- [ ] Backend builds with 0 errors

## Execution

**Dispatch Wave 1 first** (W1A, W1B, W1C in parallel). After all complete and merge, **dispatch Wave 2** (W2A, W2B in parallel). After merge, **dispatch Wave 3** (W3A). Final integration pass.
