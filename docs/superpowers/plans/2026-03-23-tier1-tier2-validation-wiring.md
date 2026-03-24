# Tier 1 Validation + Tier 2 Frontend Wiring — Multi-Agent Parallel Execution Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove the 6 phases we just shipped actually work end-to-end, then wire the frontend to the new backend endpoints.

**Architecture:** Two waves. Wave 1 validates infrastructure + wires frontend. Wave 2 completes Dais e2e pipeline (depends on Wave 1 patterns).

**Tech Stack:** Docker Compose, .NET 8, React 18 / Vitest, PostgreSQL

---

## Wave Map

```
┌──────────────────────────────────────────────────────────────────┐
│                    WAVE 1 (all parallel)                         │
│                                                                  │
│  Agent V1          Agent V2          Agent F1         Agent F2   │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐    ┌──────────┐│
│  │ Compose  │     │ Audit    │     │ Forge    │    │ Atlas    ││
│  │ Up Test  │     │ E2E      │     │ Frontend │    │ Frontend ││
│  │          │     │ Verify   │     │ Wiring   │    │ Wiring   ││
│  └──────────┘     └──────────┘     └──────────┘    └──────────┘│
│  (infra only)     (backend only)   (frontend)      (frontend)   │
└──────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│                    WAVE 2 (single agent)                         │
│                                                                  │
│  Agent D1                                                        │
│  ┌─────────────────────────────────────────┐                    │
│  │ Dais E2E Tool Pipeline                   │                    │
│  │ invokeTool → Pilot → DaisController →    │                    │
│  │ result display in sub-panel              │                    │
│  └─────────────────────────────────────────┘                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## WAVE 1

### Agent V1: Docker Compose Up Rehearsal

**Scope:** Actually run docker compose up with the rewritten compose file, prove services start.
**Isolation:** None (needs Docker daemon)

- [x] Read `backend/docker-compose.microservices.yml` and `backend/docker-compose.override.yml`
- [ ] Run `docker compose -f docker-compose.microservices.yml up -d --build` (with timeout) — blocked (missing required env vars)
- [ ] Check all services healthy: `docker compose ps`
- [ ] Probe endpoints: api /health, consciousness /health, gateway
- [x] Record results (2026-03-23): `POSTGRES_PASSWORD` and `JWT_SECRET` absent in shell environment; compose run intentionally not attempted without required secrets
- [ ] `docker compose down`

### Agent V2: GovernedToolAuditService E2E Verification

**Scope:** Hit a Dais tool endpoint, verify the audit row lands in PostgreSQL audit_logs.
**Isolation:** Worktree (backend only)

- [x] Read GovernedToolAuditService.cs to understand what it writes
- [x] Read the AuditLog entity / schema to understand expected fields
- [x] Start the API in dev mode
- [x] Hit a Dais tool endpoint (`GET /api/dais/exemptions/eligibility?parcelId=12345-001&county=benton`) with dev token
- [ ] Query PostgreSQL: SELECT * FROM audit_logs WHERE type LIKE 'DAIS_TOOL%' ORDER BY timestamp DESC LIMIT 5
- [x] Query dev SQLite fallback audit store (`AuditLogs`) for `DAIS_TOOL%`
- [ ] If schema mismatch found, fix it
- [ ] Build and verify
- [ ] Commit fix if needed

Status note (2026-03-23): endpoint returns `200 OK`, but `AuditLogs` still shows `0` rows with `Type LIKE 'DAIS_TOOL%'` before/after call in the observed dev database. This is a reproducible runtime discrepancy requiring follow-up in the API runtime lane.

### Agent F1: Forge Frontend Wiring

**Scope:** Connect PropertyForge.tsx sub-tabs to the new /api/forge/ endpoints.
**Isolation:** Worktree (frontend only)

- [x] Read PropertyForge.tsx and forge/ sub-components
- [x] Read the ForgeController endpoint contract currently used by hooks
- [x] API hooks already wired to `/api/forge/{parcelId}/cost|sales|income|reconciliation`
- [x] Sub-tabs wired to display hook-backed data with fallback behavior
- [x] WorkbenchSourceBadge present for live/fallback disclosure
- [x] Run PropertyForge tests (fixed two runtime crashes and validated green)
- [ ] Run full vitest suite
- [ ] Commit

Execution note (2026-03-23): fixed two pre-existing runtime crash paths discovered during Forge tests:
- `frontend/apps/os-shell/src/pages/workbench/tabs/forge/IncomeApproach.tsx` guarded `grossIncomeMultiplier` before `.toFixed(2)`
- `frontend/apps/os-shell/src/pages/workbench/tabs/forge/Reconciliation.tsx` guarded partial API payload seeding when approach blocks are missing

### Agent F2: Atlas Frontend Wiring

**Scope:** Connect PropertyAtlas.tsx to the new /api/atlas/gis/parcels/ endpoints.
**Isolation:** Worktree (frontend only)

- [ ] Read PropertyAtlas.tsx
- [ ] Read AtlasGisController to understand new endpoints (/boundary, /layers)
- [ ] Create/update API hooks for boundary and layer data
- [ ] Wire the map/layer components to use real PACS data when available
- [ ] Keep SVG fallback for missing parcels
- [ ] Run PropertyAtlas tests
- [ ] Run full vitest suite
- [ ] Commit

---

## WAVE 2

### Agent D1: Dais E2E Tool Pipeline

**Scope:** Wire the full frontend invokeTool → result display pipeline.
**Isolation:** Worktree

- [ ] Read PropertyDais.tsx tool invocation flow
- [ ] Read handlers.real.ts in Pilot to understand routing
- [ ] For each tool category, verify the invoke → DaisController → result path works
- [ ] Wire result display panels for tool outputs
- [ ] Add invocation history recording
- [ ] Run full test suite
- [ ] Commit
