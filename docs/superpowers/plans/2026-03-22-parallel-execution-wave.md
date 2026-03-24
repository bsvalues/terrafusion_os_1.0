# Parallel Execution Wave — Post-PACS-ETL

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Execute three independent lanes in parallel: honesty pass (3 worktree agents), Phase 34 compose rehearsal (1 sequential agent chain), and Phase 2 PACS `wash_prop_owner_val` seeding (1 agent).

**Architecture:** Five agents dispatched in Wave 1 with zero shared state. Lane A agents use isolated worktrees. Lane B is sequential (B1→B2→B3). Lane P is standalone backend work. Results merge on main after all return.

**Tech Stack:** React 18 / TypeScript 5.3 / Vitest (Lane A), Docker Compose / .NET 8 (Lane B), .NET 8 / EF Core / SqlConnection (Lane P)

**Prereqs confirmed:**
- `WorkbenchSourceBadge.tsx` + `useSourceDisclosure.ts` — ✅ already exist (Stream 0 complete)
- PropertyDais honesty — ✅ already committed at `4492d9b4d`
- PACS ETL — ✅ all tables correct in PostgreSQL at `303736e31`
- tf-mssql — ✅ running (Up 12+ hours)
- Tree — ✅ clean (only `.claude/settings.local.json` + untracked build artifacts)

---

## Dispatch Map

```
WAVE 1 — all five fire simultaneously, zero dependencies:

┌─ LANE A: Honesty (3 worktree agents) ─────────────────────────┐
│  Agent A1 (worktree): PropertyForge.tsx source disclosure      │
│  Agent A2 (worktree): PropertyAtlas.tsx source disclosure      │
│  Agent A3 (worktree): PropertySummary.tsx source disclosure    │
└────────────────────────────────────────────────────────────────┘

┌─ LANE B: Phase 34 Compose Rehearsal (1 agent, sequential) ────┐
│  Agent B: Probe /health → write override → run compose         │
└────────────────────────────────────────────────────────────────┘

┌─ LANE P: Phase 2 PACS wash_prop_owner_val (1 agent) ──────────┐
│  Agent P: Entity + migration + seeder method + run + verify    │
└────────────────────────────────────────────────────────────────┘

AFTER WAVE 1 RETURNS:
  Merge A1 + A2 + A3 on main (sequential, resolve conflicts)
  Run full vitest suite
  Commit Lane P seeder changes
  Record Phase 34 results
```

---

## Agent A1 — PropertyForge Honesty Pass

**Isolation:** `git worktree add` or Agent tool with `isolation: "worktree"`

**Prompt:**
```
You are implementing the PropertyForge honesty pass for TerraFusion OS.

Working directory: c:/Users/bsval/terrafusion_os_1.0/frontend/apps/os-shell

Shared infra already exists:
  - src/components/workbench/WorkbenchSourceBadge.tsx
  - src/hooks/useSourceDisclosure.ts
  - Exported from src/components/workbench/index.ts

Your scope — PropertyForge.tsx source disclosure:
  MODIFY: src/pages/workbench/tabs/PropertyForge.tsx
  CREATE: src/__tests__/workbench/PropertyForge.honesty.test.tsx

Task:
1. Read PropertyForge.tsx fully
2. Identify any numerical values, statistical claims, or data displays
   that lack source disclosure (no WorkbenchSourceBadge, no "returned from" language)
3. Write failing tests asserting source disclosure exists on those claims
4. Run: npx vitest run src/__tests__/workbench/PropertyForge.honesty.test.tsx
5. Confirm tests FAIL
6. Add WorkbenchSourceBadge where applicable; replace aspirational/direct-action
   language with "returned from [tool]" or "requested via [tool]" wording
7. Run tests again — must PASS
8. Run: npx vitest run (full suite) — no regressions
9. Commit: "fix(honesty/forge): source disclosure on statistical claims"

Rules:
  - Import WorkbenchSourceBadge from '@/components/workbench'
  - Import useSourceDisclosure from '@/hooks/useSourceDisclosure'
  - Do NOT touch PropertyDais, PropertyAtlas, PropertySummary, or any other file
  - TDD: write test first, then implement
  - If PropertyForge has no unsupported claims, commit a test proving that

Return: summary of what was changed + commit hash + test count.
```

---

## Agent A2 — PropertyAtlas Honesty Pass

**Isolation:** `git worktree add` or Agent tool with `isolation: "worktree"`

**Prompt:**
```
You are implementing the PropertyAtlas honesty pass for TerraFusion OS.

Working directory: c:/Users/bsval/terrafusion_os_1.0/frontend/apps/os-shell

Shared infra already exists:
  - src/components/workbench/WorkbenchSourceBadge.tsx
  - src/hooks/useSourceDisclosure.ts

Your scope — PropertyAtlas.tsx GIS/map data claims:
  MODIFY: src/pages/workbench/tabs/PropertyAtlas.tsx
  CREATE: src/__tests__/workbench/PropertyAtlas.honesty.test.tsx

Task:
1. Read PropertyAtlas.tsx fully
2. Identify GIS coordinates, map layer claims, spatial data displays,
   or any numerical values without source disclosure
3. Write failing tests asserting source disclosure
4. Run: npx vitest run src/__tests__/workbench/PropertyAtlas.honesty.test.tsx
5. Confirm FAIL
6. Add WorkbenchSourceBadge; fix wording to "returned from" / "requested via"
7. Run tests — PASS
8. Run full suite — no regressions
9. Commit: "fix(honesty/atlas): source disclosure on GIS claims"

Rules: same as A1. Do NOT touch other Property*.tsx files.

Return: summary of changes + commit hash + test count.
```

---

## Agent A3 — PropertySummary Honesty Pass

**Isolation:** `git worktree add` or Agent tool with `isolation: "worktree"`

**Prompt:**
```
You are implementing the PropertySummary honesty pass for TerraFusion OS.

Working directory: c:/Users/bsval/terrafusion_os_1.0/frontend/apps/os-shell

Shared infra already exists:
  - src/components/workbench/WorkbenchSourceBadge.tsx
  - src/hooks/useSourceDisclosure.ts

Your scope — PropertySummary.tsx assessment value claims:
  MODIFY: src/pages/workbench/tabs/PropertySummary.tsx
  CREATE: src/__tests__/workbench/PropertySummary.honesty.test.tsx

Task:
1. Read PropertySummary.tsx fully
2. Identify assessment values, market values, appraised values, or
   any numerical property data without source disclosure
3. Write failing tests
4. Run: npx vitest run src/__tests__/workbench/PropertySummary.honesty.test.tsx
5. Confirm FAIL
6. Add WorkbenchSourceBadge; fix wording
7. Run tests — PASS
8. Run full suite — no regressions
9. Commit: "fix(honesty/summary): source disclosure on assessment claims"

Rules: same as A1. Do NOT touch other Property*.tsx files.

Return: summary of changes + commit hash + test count.
```

---

## Agent B — Phase 34 Compose Rehearsal

**Isolation:** None needed (backend Docker work, does not touch frontend or PACS entity files)

**Prompt:**
```
You are executing the Phase 34 compose rehearsal for TerraFusion OS.

Working directory: c:/Users/bsval/terrafusion_os_1.0/backend

Prereq: tf-mssql container must be running (docker ps | grep tf-mssql)

Three sequential sub-tasks:

SUB-TASK B1 — Probe Consciousness health:
1. Run: dotnet run --project src/TerraFusion.Consciousness
   Wait for "Now listening on" (up to 60s)
2. Probe these URLs, record exact JSON response:
   - http://localhost:3004/health
   - http://localhost:3004/api/consciousness/status
   - http://localhost:3004/api/swarm/status
   - http://localhost:3004/api/consciousness/health
3. Record which return 200 vs 404
4. Kill the process

SUB-TASK B2 — Write docker-compose.override.yml:
Create: c:/Users/bsval/terrafusion_os_1.0/backend/docker-compose.override.yml

Contents:
```yaml
# Phase 34 Swarm Rehearsal
services:
  api:
    extra_hosts:
      - "host.docker.internal:host-gateway"
    environment:
      ConnectionStrings__PacsConnection: "Server=host.docker.internal,1433;Database=pacs_oltp;User Id=sa;Password=TF_Pacs2026!;TrustServerCertificate=True;Encrypt=True;Application Name=TerraFusion-OS;"
  consciousness:
    environment:
      AI__SwarmSize: "50"
```

Commit: "feat(phase34): docker-compose.override.yml — PACS bridge + swarm rehearsal size"

SUB-TASK B3 — Run compose rehearsal:
1. docker-compose -f docker-compose.microservices.yml build
2. docker-compose -f docker-compose.microservices.yml up -d
3. Poll /health every 10s (max 3 min):
   curl -s http://localhost:5000/health
   curl -s http://localhost:3004/health
   curl -s http://localhost:3002/health
4. Prove 4 minimum truths:
   - All 3 tiers reach /health
   - SignalR hub upgrades: curl http://localhost:5000/hubs/system
   - Swarm init: check consciousness status endpoint (from B1 findings)
   - PACS adapter: curl http://localhost:5000/ops/pacs/proof (or nearest endpoint)
5. Capture: docker-compose logs --tail=50
6. docker-compose -f docker-compose.microservices.yml down

Return: pass/fail for each of 4 minimum truths + log snippets as evidence.
Do NOT modify any source code. Only create docker-compose.override.yml.
```

---

## Agent P — Phase 2 PACS: wash_prop_owner_val Entity + Seeder

**Isolation:** None needed (backend only, different files from Lane A)

**Prompt:**
```
You are implementing Phase 2 PACS seeding for TerraFusion OS — adding the
wash_prop_owner_val table mirror.

Working directory: c:/Users/bsval/terrafusion_os_1.0/backend

PACS EXPERT CONTEXT:
wash_prop_owner_val is the most critical missing table in TerraFusion's PACS mirror.
It contains computed homestead/non-homestead value splits, timber/ag values,
new construction values, classified/non-classified appraised values, and final
taxable values. Populated by CalculateTaxable stored procedures in PACS.

Composite PK: (prop_id, year, sup_num, owner_id) — OWNER-LEVEL

Confirmed columns (from MonitorDORAssessmentRollReal stored proc):
  imprv_hstd_val, imprv_non_hstd_val, land_hstd_val, land_non_hstd_val,
  timber_market, ag_market, timber_hs_market, ag_hs_market,
  new_val_hs, new_val_nhs, new_val_p,
  appraised_classified, appraised_non_classified,
  ag_use_val, ag_hs_use_val, timber_use_val, timber_hs_use_val,
  taxable_classified, taxable_non_classified

Join pattern:
  INNER JOIN wash_prop_owner_val wpov ON
    pv.prop_id = wpov.prop_id
    AND pv.prop_val_yr = wpov.year     -- column is 'year', not 'prop_val_yr'
    AND pv.sup_num = wpov.sup_num
    AND o.owner_id = wpov.owner_id

ETL query:
  SELECT * FROM wash_prop_owner_val
  WHERE year = (SELECT MAX(year) FROM wash_prop_owner_val)
  ORDER BY prop_id, year, sup_num, owner_id

TASKS (sequential):

1. Create entity: src/TerraFusion.Core/Entities/Pacs/PacsOwnerVal.cs
   - Follow pattern from PacsValuation.cs
   - Guid Id (PK), Guid ParcelId (FK → PacsParcel)
   - int PacsPropId, int PropValYear, int SupNum, int OwnerTaxId
   - All 19 decimal columns from the list above
   - Unique index on (PacsPropId, PropValYear, SupNum, OwnerTaxId)

2. Add DbSet to TerraFusionDbContext:
   public DbSet<PacsOwnerVal> PacsOwnerVals { get; set; }

3. Generate EF migration:
   dotnet ef migrations add AddPacsOwnerVal --project src/TerraFusion.Data --startup-project src/TerraFusion.API

4. Apply migration:
   dotnet ef database update --project src/TerraFusion.Data --startup-project src/TerraFusion.API

5. Add SeedOwnerValsAsync method to PacsDataSeeder.cs:
   - Follow pattern from SeedValuationsAsync
   - Use the ETL query above
   - Wire into SeedAllAsync after SeedOwnersAsync (needs propMap)

6. Build: dotnet build src/TerraFusion.API/TerraFusion.API.csproj

7. Run seeder: ASPNETCORE_ENVIRONMENT=Development dotnet run --project src/TerraFusion.API --no-build -- --seed-pacs
   NOTE: This will re-seed ALL tables. The seeder is full-refresh.

8. Verify in PostgreSQL:
   docker exec terrafusion-postgres-dev psql -U postgres -d terrafusion \
     -c "SELECT COUNT(*) FROM pacs_owner_vals;"
   Expected: >0 rows (exact count TBD from PACS source)

9. Commit: "feat(pacs-phase2): add wash_prop_owner_val mirror entity + seeder"

Return: entity file path, migration name, row count, commit hash.
```

---

## Post-Wave Integration (run by orchestrator after all agents return)

- [ ] **Step 1**: Merge Lane A worktrees into main
  ```bash
  # Integration order: forge → atlas → summary
  git merge <A1-branch>
  git merge <A2-branch>
  git merge <A3-branch>
  ```

- [ ] **Step 2**: Run full vitest suite
  ```bash
  cd frontend/apps/os-shell && npx vitest run
  ```
  Gate: all tests pass, zero regressions

- [ ] **Step 3**: Verify Lane P committed on main
  ```bash
  git log --oneline -5
  docker exec terrafusion-postgres-dev psql -U postgres -d terrafusion \
    -c "SELECT relname, n_live_tup FROM pg_stat_user_tables WHERE relname ILIKE '%pacs%' ORDER BY relname;"
  ```

- [ ] **Step 4**: Record Phase 34 results from Agent B

- [ ] **Step 5**: Update session state via save-state skill

---

## What Stays Deferred

- Lane C: Supabase Benton seeding (blocked on migrations 06-09)
- Phase 3 PACS: wash_prop_owner_exemption + owner-level tax_area_assoc
- Phase 4 PACS: Native stored procedure replication (RecalcLandValue, CalculateTaxable)
- Phase 35: K8s SRE (gated behind Phase 34 CP27 seal)
