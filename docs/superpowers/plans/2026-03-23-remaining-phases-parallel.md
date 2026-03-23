# TerraFusion OS — Remaining Phases Parallel Execution Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete PACS Phase 2 seeding, fix Phase 34 compose infrastructure, and run Dais honesty tests — all via parallel agent dispatch.

**Architecture:** Three independent lanes with no shared state. Each lane touches different subsystems (backend ETL, Docker infrastructure, frontend components). Lanes can be dispatched as parallel agents.

**Tech Stack:** .NET 8 / EF Core / PostgreSQL (Lane 1), Docker Compose YAML (Lane 2), React 18 / Vitest (Lane 3)

---

## Current State (2026-03-23)

| Item | Status |
|------|--------|
| HEAD | `2bd44c299` on `main` |
| Tree | Clean (only `.claude/settings.local.json` + `docs/legacy/` untracked) |
| Backend build | 0 errors, 38 warnings |
| Frontend tests | 6380/6380 pass |
| PacsOwnerVal entity + migration | Committed, not yet seeded |
| docker-compose.microservices.yml | Broken (YAML syntax + 13 missing Dockerfiles) |
| PropertyDais honesty | Already committed (earlier session) |
| Forge/Atlas/Summary honesty | Committed at `8f6f9cd82` |

## Completed (Do NOT redo)

- [x] PACS ETL full-refresh fix (sale_id=0 filters, ClearPacsTablesAsync guard)
- [x] PropertyDais Senior Exemption + appeal panel honesty
- [x] PropertyForge honesty badge + contract test
- [x] PropertyAtlas honesty badge + contract test
- [x] PropertySummary honesty badge + contract test
- [x] PacsOwnerVal entity, DbContext, EF migration
- [x] SeedOwnerValsAsync method in PacsDataSeeder

---

## Lane 1: PACS Phase 2 — Seed wash_prop_owner_val

**Dependencies:** PostgreSQL must be healthy (was in recovery mode)
**Agent type:** general-purpose
**Isolation:** None (needs main tree for DB access)

### Task 1.1: Verify PostgreSQL Health

**Files:** None (runtime check)

- [ ] **Step 1: Check PostgreSQL status**

```bash
cd backend && dotnet run --project src/TerraFusion.API --no-build -- --seed-pacs 2>&1 | head -20
```

Expected: Connection succeeds OR "recovery mode" error persists.

- [ ] **Step 2: If recovery mode, restart PostgreSQL container**

```bash
docker restart terrafusion-postgres
sleep 10
```

- [ ] **Step 3: Verify connection**

```bash
PGPASSWORD=$TF_PG_PASSWORD psql -h localhost -U terrafusion -d terrafusion_dev -c "SELECT 1;"
```

Expected: Returns `1`.

### Task 1.2: Run PACS Seeder (Full Refresh)

**Files:**
- Runtime: `backend/src/TerraFusion.API/Seeds/PacsDataSeeder.cs`

- [ ] **Step 1: Build backend**

```bash
cd backend && dotnet build src/TerraFusion.API/TerraFusion.API.csproj
```

Expected: 0 errors.

- [ ] **Step 2: Run seeder**

```bash
cd backend && ASPNETCORE_ENVIRONMENT=Development TF_DEV_PACS_PASSWORD="<from-env>" dotnet run --project src/TerraFusion.API --no-build -- --seed-pacs
```

Expected: Completes without error. Look for `PacsOwnerVal: {Total}` in output.

- [ ] **Step 3: Verify row counts in PostgreSQL**

```sql
SELECT 'pacs_owner_vals' AS tbl, COUNT(*) FROM pacs_owner_vals
UNION ALL SELECT 'pacs_valuations', COUNT(*) FROM pacs_valuations
UNION ALL SELECT 'pacs_land_details', COUNT(*) FROM pacs_land_details
UNION ALL SELECT 'pacs_owners', COUNT(*) FROM pacs_owners;
```

Expected: `pacs_owner_vals` > 0, other tables unchanged from prior seed.

- [ ] **Step 4: Commit if new data seeded**

```bash
# No code changes needed — entity/migration already committed.
# Only commit if seeder output reveals a bug that requires code fix.
```

---

## Lane 2: Phase 34 — Fix docker-compose.microservices.yml

**Dependencies:** None
**Agent type:** general-purpose
**Isolation:** worktree (edits compose file only)

### Task 2.1: Audit Existing Compose File

**Files:**
- Modify: `backend/docker-compose.microservices.yml`

- [ ] **Step 1: Read the current compose file**

Read `backend/docker-compose.microservices.yml` in full.

- [ ] **Step 2: Identify the three blocking issues**

1. YAML syntax error line ~209: `<<: *common-labels` on a list (merge keys only work with dicts)
2. 13 services reference Dockerfiles that don't exist
3. Service names don't match override expectations

- [ ] **Step 3: List actual Dockerfiles**

```bash
find backend -name "Dockerfile*" -type f
```

Expected: Only `backend/Dockerfile`, `backend/TerraFusion.IDE.Gateway/Dockerfile`, `backend/terrafusion-bridge/Dockerfile`, `backend/mcp-servers/document-server/Dockerfile`.

### Task 2.2: Rewrite Compose for 3-Tier Architecture

**Files:**
- Modify: `backend/docker-compose.microservices.yml`

- [ ] **Step 1: Rewrite compose to match actual architecture**

Services to define:
- `api` — TerraFusion.API (port 5000), using `backend/Dockerfile` with target `TerraFusion.API`
- `consciousness` — TerraFusion.Consciousness (port 3004), using `backend/Dockerfile` with target `TerraFusion.Consciousness`
- `gateway` — TerraFusion.Gateway (port 3002), using `backend/TerraFusion.IDE.Gateway/Dockerfile`
- `postgres` — PostgreSQL 16 (port 5432)
- `redis` — Redis 7 (port 6379)

Remove all 13 phantom services that have no Dockerfiles.

- [ ] **Step 2: Fix YAML merge key syntax**

Replace `<<: *common-labels` on lists with explicit label definitions.

- [ ] **Step 3: Validate YAML syntax**

```bash
docker compose -f backend/docker-compose.microservices.yml config --quiet
```

Expected: No errors.

- [ ] **Step 4: Test compose up (dry run)**

```bash
docker compose -f backend/docker-compose.microservices.yml up --no-start
```

Expected: All services created without errors.

- [ ] **Step 5: Commit**

```bash
git add backend/docker-compose.microservices.yml
git commit -m "fix(compose): rewrite for actual 3-tier architecture (API, Consciousness, Gateway)"
```

### Task 2.3: Fix Consciousness DI Namespace Mismatch

**Files:**
- Modify: `backend/src/TerraFusion.Consciousness/Program.cs`

- [ ] **Step 1: Read the Consciousness Program.cs**

Find the DI registration for `IQuantumConsciousnessOrchestrator`.

- [ ] **Step 2: Fix the namespace mismatch**

The controller imports from `TerraFusion.Core.Interfaces` but DI registers from `TerraFusion.Consciousness.Interfaces`. Either:
- Register the Core interface in DI, OR
- Change the controller to use the Consciousness interface

- [ ] **Step 3: Build and verify**

```bash
cd backend && dotnet build src/TerraFusion.Consciousness/TerraFusion.Consciousness.csproj
```

Expected: 0 errors.

- [ ] **Step 4: Test health endpoint**

```bash
curl http://localhost:3004/api/consciousness/health
```

Expected: 200 OK (not 500).

- [ ] **Step 5: Commit**

```bash
git add backend/src/TerraFusion.Consciousness/
git commit -m "fix(consciousness): resolve IQuantumConsciousnessOrchestrator DI namespace mismatch"
```

---

## Lane 3: UI Honesty — PropertyDais Queue Stats

**Dependencies:** None
**Agent type:** general-purpose
**Isolation:** worktree (frontend only)

### Task 3.1: Audit PropertyDais for Remaining Honesty Gaps

**Files:**
- Read: `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyDais.tsx`
- Read: `frontend/apps/os-shell/src/__tests__/workbench/PropertyDais.honesty.test.tsx` (if exists)

- [ ] **Step 1: Read PropertyDais.tsx and identify any claims about queue processing stats**

Look for:
- Hardcoded numbers (queue depth, processing times, throughput)
- Direct-action language ("Processing...", "Analyzing...") without actual backend calls
- Missing source badges on data sections

- [ ] **Step 2: If gaps found, add WorkbenchSourceBadge with fallback disclosure**

Follow the same pattern as Forge/Atlas/Summary:
```tsx
import { WorkbenchSourceBadge } from '../../components/workbench';
// ...
<WorkbenchSourceBadge source="fallback" className="shrink-0" />
```

- [ ] **Step 3: Write or update honesty contract test**

```tsx
// PropertyDais.honesty.contract.test.tsx
it('badges show fallback/unavailable at idle', () => {
  render(<MemoryRouter><PropertyDais /></MemoryRouter>);
  const badges = screen.getAllByTestId('workbench-source-badge');
  for (const badge of badges) {
    const src = badge.getAttribute('data-source');
    expect(['fallback', 'unavailable']).toContain(src);
  }
});
```

- [ ] **Step 4: Run tests**

```bash
cd frontend && npx vitest run apps/os-shell/src/__tests__/workbench/PropertyDais
```

Expected: All pass.

- [ ] **Step 5: Commit**

```bash
git add frontend/apps/os-shell/src/pages/workbench/tabs/PropertyDais.tsx \
        frontend/apps/os-shell/src/__tests__/workbench/
git commit -m "feat(honesty): PropertyDais queue stats source-disclosure badge"
```

---

## Dispatch Map

```
┌─────────────────────────────────────────────────────────┐
│                    WAVE 1 (parallel)                     │
│                                                          │
│  Agent L1          Agent L2            Agent L3          │
│  ┌──────────┐     ┌──────────────┐    ┌──────────────┐  │
│  │ PACS     │     │ Compose Fix  │    │ Dais Honesty │  │
│  │ Seeder   │     │ + DI Fix     │    │ Queue Stats  │  │
│  │ Run      │     │              │    │              │  │
│  └──────────┘     └──────────────┘    └──────────────┘  │
│  No isolation      Worktree            Worktree          │
│  (needs DB)        (compose only)      (frontend only)   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                 INTEGRATION (sequential)                 │
│                                                          │
│  1. Merge L2 worktree → main                            │
│  2. Merge L3 worktree → main                            │
│  3. Run full test suite (vitest + dotnet test)           │
│  4. Verify L1 seeder row counts                         │
│  5. Final commit / state save                            │
└─────────────────────────────────────────────────────────┘
```

## Agent Prompts

### Agent L1 Prompt (PACS Seeder)

> Check if PostgreSQL is healthy by running `cd backend && dotnet run --project src/TerraFusion.API --no-build -- --seed-pacs 2>&1 | head -30`. If it shows "recovery mode", run `docker restart terrafusion-postgres`, wait 10 seconds, then retry. The seeder is already built and the PacsOwnerVal entity/migration are committed. After the seeder completes, verify row counts with `psql -c "SELECT 'pacs_owner_vals', COUNT(*) FROM pacs_owner_vals"`. Report the final row counts. Do NOT modify any code.

### Agent L2 Prompt (Compose + DI Fix)

> Fix two issues in the TerraFusion backend:
>
> 1. **docker-compose.microservices.yml** — Rewrite to match actual 3-tier architecture. Only 4 Dockerfiles exist: `backend/Dockerfile`, `backend/TerraFusion.IDE.Gateway/Dockerfile`, `backend/terrafusion-bridge/Dockerfile`, `backend/mcp-servers/document-server/Dockerfile`. Remove all 13 phantom services. Fix YAML merge key syntax (`<<: *common-labels` on lists is invalid). Define services: api (port 5000), consciousness (port 3004), gateway (port 3002), postgres (5432), redis (6379). Validate with `docker compose config --quiet`.
>
> 2. **Consciousness DI mismatch** — `backend/src/TerraFusion.Consciousness/Program.cs` registers `TerraFusion.Consciousness.Interfaces.IQuantumConsciousnessOrchestrator` but the controller imports from `TerraFusion.Core.Interfaces`. Fix the namespace alignment. Build to verify: `dotnet build src/TerraFusion.Consciousness/TerraFusion.Consciousness.csproj`.
>
> Commit each fix separately. Do NOT touch frontend code.

### Agent L3 Prompt (Dais Honesty)

> Audit `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyDais.tsx` for honesty gaps. Check if any queue processing stats, throughput numbers, or processing status claims lack a `WorkbenchSourceBadge`. If gaps exist, add `<WorkbenchSourceBadge source="fallback" />` following the pattern in PropertyForge.tsx. Write or update `PropertyDais.honesty.contract.test.tsx` verifying all badges show fallback/unavailable at idle. Run `npx vitest run apps/os-shell/src/__tests__/workbench/PropertyDais` to verify. Commit with message `feat(honesty): PropertyDais queue stats source-disclosure badge`. Do NOT touch backend code.

---

## Success Criteria

- [ ] `pacs_owner_vals` table has > 0 rows in PostgreSQL
- [ ] `docker compose -f backend/docker-compose.microservices.yml config --quiet` exits 0
- [ ] `GET /api/consciousness/health` returns 200 (not 500)
- [ ] All PropertyDais honesty tests pass
- [ ] Full vitest suite: 6380+ tests pass, 0 regressions
- [ ] Backend builds with 0 errors
