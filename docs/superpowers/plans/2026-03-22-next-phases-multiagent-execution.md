# Next-Phases Multi-Agent Execution Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Execute three independent work tracks in parallel: Round A honesty pass (4 worktree streams), Phase 34 compose rehearsal, and Benton seeding pipeline (unblocks when Supabase IP ban lifts).

**Architecture:** Three lanes run independently. No shared state between lanes. Lane A (honesty) has its own sub-parallelization (4 worktrees after Stream 0). Lanes B and C have no dependencies on each other or on Lane A.

**Tech Stack:** React 18 / TypeScript 5.3 / Vitest (Lane A), Docker Compose / .NET 8 (Lane B), Python 3.12 / pyodbc / Supabase REST (Lane C)

---

## Parallel Dispatch Map

```
┌─── LANE A: Honesty Pass ─────────────────────────────────────────┐
│ Agent A0 (main branch): WorkbenchSourceBadge + useSourceDisclosure │
│   └── merge A0, then dispatch in parallel:                         │
│       Agent A1 (worktree honesty/dais):    PropertyDais.tsx        │
│       Agent A2 (worktree honesty/forge):   PropertyForge.tsx       │
│       Agent A3 (worktree honesty/atlas):   PropertyAtlas.tsx       │
│       Agent A4 (worktree honesty/summary): PropertySummary.tsx     │
└──────────────────────────────────────────────────────────────────┘

┌─── LANE B: Phase 34 Compose Rehearsal ───────────────────────────┐
│ Agent B1: Verify Consciousness /health endpoint shape             │
│   └── Agent B2: Write docker-compose.override.yml                │
│       └── Agent B3: Run compose up + prove 4 minimum truths      │
└──────────────────────────────────────────────────────────────────┘

┌─── LANE C: Benton Seeding (BLOCKED — Supabase IP ban) ──────────┐
│ All scripts ready. Unblocks independently of Lanes A and B.      │
│ Agent C1: Push migrations 06/07/08/09 to Supabase Studio         │
│   └── Agent C2: Run backfill_centroids.py                        │
│       └── Agent C3: Run backfill_parcel_attributes.py            │
│           └── Agent C4: Run backfill_from_pacs_db.py             │
│               └── Agent C5: Run run_spatial_joins.py             │
└──────────────────────────────────────────────────────────────────┘
```

---

## LANE A — Round A Honesty Pass

**Full step-by-step plan:** `docs/superpowers/plans/2026-03-22-round-a-honesty-pass.md`

The Round A plan uses hub-and-spoke: Stream 0 builds shared infrastructure on main, then Streams 1–4 run in parallel worktrees.

### Agent A0 (Stream 0 — main branch, sequential prerequisite)

**Scope:** Build `WorkbenchSourceBadge` + `useSourceDisclosure`. No worktree needed.

**Prompt for Agent A0:**
```
You are implementing Stream 0 of the TerraFusion OS Round A honesty pass.

Full plan: c:/Users/bsval/terrafusion_os_1.0/docs/superpowers/plans/2026-03-22-round-a-honesty-pass.md
Working directory: c:/Users/bsval/terrafusion_os_1.0/frontend/apps/os-shell

Your scope is STREAM 0 ONLY — shared infrastructure:
  CREATE: src/components/workbench/WorkbenchSourceBadge.tsx
  CREATE: src/hooks/useSourceDisclosure.ts
  MODIFY: src/components/workbench/index.ts (add exports)
  CREATE: src/__tests__/workbench/WorkbenchSourceBadge.test.tsx
  CREATE: src/__tests__/hooks/useSourceDisclosure.test.ts

Rules:
  - TDD: write failing test → run → implement → run green → commit
  - Test command: npx vitest run from frontend/apps/os-shell/
  - Do NOT touch PropertyDais, PropertyForge, PropertyAtlas, PropertySummary
  - Commit when tests green: "feat(honesty): WorkbenchSourceBadge + useSourceDisclosure [stream0]"
  - Then: git push and report the commit hash

Return: commit hash + confirmation all tests pass.
```

### Agents A1–A4 (Streams 1–4 — parallel, after A0 merges)

Dispatch all four simultaneously. Each agent works in its own worktree.

**Prompt for Agent A1 (PropertyDais):**
```
You are implementing Stream 1 of the TerraFusion OS Round A honesty pass.

Full plan: c:/Users/bsval/terrafusion_os_1.0/docs/superpowers/plans/2026-03-22-round-a-honesty-pass.md
Branch: honesty/dais
Worktree: create with: git worktree add ../tf-honesty-dais honesty/dais

Your scope is STREAM 1 — PropertyDais.tsx Queue Statistics card:
  MODIFY: src/surfaces/workbench/panels/PropertyDais.tsx
  CREATE: src/__tests__/surfaces/PropertyDais.honesty.test.tsx

Key task: The Queue Statistics card shows numerical claims (queue counts, wait times, etc.)
without source disclosure. Add WorkbenchSourceBadge to the card and remove or guard any
numerical values that come from fixtures (not live API data).

Rules:
  - Import WorkbenchSourceBadge from @/components/workbench (Stream 0 already merged)
  - TDD: write the honesty assertion test first
  - Test command: npx vitest run from frontend/apps/os-shell/
  - Run ui-honesty-pass skill when done to verify no regressions
  - Commit: "fix(honesty/dais): add source disclosure to Queue Statistics [stream1]"

Return: summary of what was removed/changed + commit hash.
```

**Prompt for Agent A2 (PropertyForge):**
```
You are implementing Stream 2 of the TerraFusion OS Round A honesty pass.

Full plan: c:/Users/bsval/terrafusion_os_1.0/docs/superpowers/plans/2026-03-22-round-a-honesty-pass.md
Branch: honesty/forge
Worktree: create with: git worktree add ../tf-honesty-forge honesty/forge

Your scope is STREAM 2 — PropertyForge.tsx unsupported statistical claims:
  MODIFY: src/surfaces/workbench/panels/PropertyForge.tsx
  CREATE: src/__tests__/surfaces/PropertyForge.honesty.test.tsx

Rules same as Stream 1. Add WorkbenchSourceBadge where applicable.
Commit: "fix(honesty/forge): source disclosure on statistical claims [stream2]"

Return: summary of changes + commit hash.
```

**Prompt for Agent A3 (PropertyAtlas):**
```
You are implementing Stream 3 of the TerraFusion OS Round A honesty pass.

Full plan: c:/Users/bsval/terrafusion_os_1.0/docs/superpowers/plans/2026-03-22-round-a-honesty-pass.md
Branch: honesty/atlas
Worktree: create with: git worktree add ../tf-honesty-atlas honesty/atlas

Your scope is STREAM 3 — PropertyAtlas.tsx GIS/map data claims:
  MODIFY: src/surfaces/workbench/panels/PropertyAtlas.tsx
  CREATE: src/__tests__/surfaces/PropertyAtlas.honesty.test.tsx

Rules same as Stream 1.
Commit: "fix(honesty/atlas): source disclosure on GIS claims [stream3]"

Return: summary of changes + commit hash.
```

**Prompt for Agent A4 (PropertySummary):**
```
You are implementing Stream 4 of the TerraFusion OS Round A honesty pass.

Full plan: c:/Users/bsval/terrafusion_os_1.0/docs/superpowers/plans/2026-03-22-round-a-honesty-pass.md
Branch: honesty/summary
Worktree: create with: git worktree add ../tf-honesty-summary honesty/summary

Your scope is STREAM 4 — PropertySummary.tsx assessment value claims:
  MODIFY: src/surfaces/workbench/panels/PropertySummary.tsx
  CREATE: src/__tests__/surfaces/PropertySummary.honesty.test.tsx

Rules same as Stream 1.
Commit: "fix(honesty/summary): source disclosure on assessment claims [stream4]"

Return: summary of changes + commit hash.
```

### Lane A merge sequence (after A1–A4 return)

```bash
# Integration order per plan: dais → forge → atlas → summary
git checkout main
git merge honesty/dais     # A1
git merge honesty/forge    # A2
git merge honesty/atlas    # A3
git merge honesty/summary  # A4
npx vitest run             # full suite must be green
```

---

## LANE B — Phase 34 Compose Rehearsal

**Definition file:** `os-platform/core/pilot/ops/phase34-rehearsal-definition-2026-03-21.md`

Four minimum truths to prove:
1. All three service tiers start and reach `/health`
2. API→Consciousness SignalR hub connects
3. Agent swarm initializes to size 50 without OOM/crash
4. PACS adapter reaches pacs_oltp from inside compose network

### Agent B1 (Consciousness health probe — sequential first step)

- [ ] Start the TerraFusion.Consciousness project locally
  ```bash
  cd c:/Users/bsval/terrafusion_os_1.0/backend
  dotnet run --project TerraFusion.Consciousness
  ```
- [ ] Probe the health endpoint once it starts
  ```bash
  curl -s http://localhost:3004/health
  curl -s http://localhost:3004/api/consciousness/status
  curl -s http://localhost:3004/api/swarm/status
  ```
- [ ] Record exact response shape (JSON fields returned)
- [ ] Stop the process
- [ ] Document findings: which endpoint exists, what JSON keys it returns

**Agent B1 prompt:**
```
Probe the TerraFusion Consciousness health endpoint to determine its actual response shape.

Working directory: c:/Users/bsval/terrafusion_os_1.0/backend

Steps:
1. Run: dotnet run --project TerraFusion.Consciousness --no-build (use --no-build if already built)
   Wait for "Now listening on" in output (up to 60s)
2. Probe these URLs and record EXACT JSON response for each:
   - http://localhost:3004/health
   - http://localhost:3004/api/consciousness/status
   - http://localhost:3004/api/swarm/status
   - http://localhost:3004/api/consciousness/health
3. Note which return 200 vs 404
4. Kill the process

Return: exact JSON responses for each URL + which 200 vs 404.
```

### Agent B2 (docker-compose.override.yml — after B1 returns)

**Files:**
- Create: `c:/Users/bsval/terrafusion_os_1.0/backend/docker-compose.override.yml`

- [ ] **Write docker-compose.override.yml**

```yaml
# docker-compose.override.yml — Phase 34 Swarm Rehearsal
# Bridges PACS (tf-mssql on host:1433) into compose network
# Sets reduced swarm size (50) for rehearsal semantics proof
services:
  api:
    extra_hosts:
      - "host.docker.internal:host-gateway"
    environment:
      ConnectionStrings__PacsConnection: "Server=host.docker.internal,1433;Database=pacs_oltp;User Id=sa;Password=TF_Pacs2026!;TrustServerCertificate=True;Encrypt=True;Application Name=TerraFusion-OS;"
      ConnectionStrings__PacsSalesConnection: "Server=host.docker.internal,1433;Database=pacs_golive;User Id=sa;Password=TF_Pacs2026!;TrustServerCertificate=True;Encrypt=True;Application Name=TerraFusion-OS;"

  consciousness:
    environment:
      AI__SwarmSize: "50"
```

- [ ] Commit: `"feat(phase34): docker-compose.override.yml — PACS bridge + swarm rehearsal size"`

### Agent B3 (compose rehearsal — after B2 committed)

**Prompt:**
```
Execute the Phase 34 TerraFusion compose rehearsal.

Working directory: c:/Users/bsval/terrafusion_os_1.0/backend
Prereq: tf-mssql container must be running (docker ps | grep tf-mssql)

Steps:
1. Verify tf-mssql: docker ps | grep tf-mssql (if not running: see ops/dev/restore-pacs-from-archives.ps1)
2. Build images: docker-compose -f docker-compose.microservices.yml build
3. Start: docker-compose -f docker-compose.microservices.yml up -d
4. Poll health every 10s until green (max 3 minutes):
   curl -s http://localhost:5000/health
   curl -s http://localhost:3004/health
   curl -s http://localhost:3002/health
5. Prove minimum truth #2 (SignalR): curl -s http://localhost:5000/hubs/system (expect 101 or upgrade header)
6. Prove minimum truth #4 (PACS): curl -s http://localhost:5000/ops/pacs/proof
7. Check consciousness swarm init: curl -s http://localhost:3004/health (or swarm/status endpoint found by B1)
8. Capture docker-compose logs --tail=50 for evidence
9. Stop: docker-compose -f docker-compose.microservices.yml down

Return: pass/fail for each of the 4 minimum truths + log snippets as evidence.
```

---

## LANE C — Benton Seeding Pipeline (BLOCKED)

**Status:** All scripts written and tested. Waiting for Supabase IP ban to lift.

**Detection:** Run this poll to detect when Supabase comes back:
```bash
curl -s --max-time 8 -o /dev/null -w "%{http_code}" \
  "https://udjoodlluygvlqccwade.supabase.co/rest/v1/parcels?select=id&limit=1" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
# Returns 200 when unblocked
```

### When Supabase unblocks — dispatch Agent C1

**Prompt:**
```
Execute the Benton County seeding pipeline in terra-forge-rebuild.

Working directory: c:/Users/bsval/terra-forge-rebuild

Scripts to run in sequence — each must succeed before the next:
1. Push pending migrations to Supabase Studio:
   Files to paste into Supabase SQL editor (in order):
   - supabase/migrations/20260322000006_backfill_parcel_centroids_rpc.sql
   - supabase/migrations/20260322000007_backfill_parcel_attributes_rpc.sql
   - supabase/migrations/20260322000008_parcel_spatial_join_columns.sql
   - supabase/migrations/20260322000009_backfill_from_pacs_rpc.sql
   (Use: npx supabase db push if Supabase CLI is configured)

2. py -3.12 scripts/backfill_centroids.py
3. py -3.12 scripts/backfill_parcel_attributes.py
4. py -3.12 scripts/backfill_from_pacs_db.py      ← uses tf-mssql (must be running)
5. py -3.12 scripts/run_spatial_joins.py

Prereqs:
  - tf-mssql running: docker ps | grep tf-mssql
  - Supabase accessible: curl returns 200 (not 000/timeout)

Return: row counts from each script's output + any errors.
```

---

## Execution Order and Gates

```
TODAY (parallel):
  ┌── Agent B1: probe Consciousness /health ──────────▶ feeds B2
  └── (Lane A: if honesty pass confirmed as priority)
      └── Agent A0: Stream 0 shared infra

AFTER A0 merges (parallel):
  ├── Agent A1: honesty/dais
  ├── Agent A2: honesty/forge
  ├── Agent A3: honesty/atlas
  └── Agent A4: honesty/summary

AFTER B1 returns (sequential):
  └── Agent B2: write docker-compose.override.yml
      └── Agent B3: run compose rehearsal → CP27 seal

WHEN SUPABASE UNBLOCKS (independent of above):
  └── Agent C1: seeding pipeline (sequential sub-steps)
```

---

## Phase 35 Gate (Do Not Open Yet)

Phase 35 (K8s SRE prep execution) is **SRE-gated**. Do not execute without SRE sign-off.

Key gaps before Phase 35:
- JWT rotation (`phase35-jwt-rotation-runbook-2026-03-21.md`)
- Postgres not SQLite
- TLS termination
- Consul service mesh

Phase 35 unblocks only after Phase 34 CP27 seal is committed.

---

**Saved:** `docs/superpowers/plans/2026-03-22-next-phases-multiagent-execution.md`
