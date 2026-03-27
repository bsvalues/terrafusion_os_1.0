# TerraFusion OS — Phase 34 Copilot Lanes
**Date**: 2026-03-27  
**Status**: READY — queue is empty, Phase 33E sealed  
**Authority**: Co-Founder planning session, 2026-03-27  
**Supersedes**: `2026-03-23-tier1-tier2-validation-wiring.md` (partial execution credit carried forward below)

---

## Situation

Phase 33E closed with every CARD (01–18) sealed, 0 build errors, 0 warnings, clean tree.
The backend auth + data spine is proven:

| Fact | Evidence |
|------|----------|
| 112,059 Properties rows | CARD-16 DB proof |
| Dossier 200 live | CARD-17 HTTP proof (`assessedValue=49990.0`, `levies.total=31`) |
| `DevGovernmentUserSeeder` idempotent | CARD-18 unit tests 2/2 |
| Atlas source classification fixed | CARD-13 (`canonical` → `live`) |
| `TF_DEV_USE_SQLITE=true` resolver | CARD-18 Program.cs |
| 0 backend CS warnings | warning census 2026-03-27 |

PR #706 (`fix/workbench-loading-aria`) is open and unmerged.

---

## Gate Zero: PR #706 Merge Decision

**This must be resolved before any new implementation work opens.**

```bash
# Verify no rebase needed
git log main..HEAD --oneline

# If diverged, rebase and verify
git fetch origin
git rebase origin/main
pnpm run type-check
dotnet build backend/TerraFusion.sln
```

After merge: all Phase 34 work starts from `main`.

---

## Current State

| Item | Value |
|------|-------|
| HEAD | `e05e37d13` on `fix/workbench-loading-aria` |
| Tree | Clean |
| Backend build | 0 errors, 0 warnings |
| `pnpm type-check` | EXIT 0 |
| UI token ratchet | 790 ≤ 812 |
| PR #706 | Open, awaiting merge decision |
| Active sprint | Phase 33E — fully sealed |

---

## Carried-Forward Credit (2026-03-23 tier1-tier2 plan)

| Lane | Agent | Status | Credit |
|------|-------|--------|--------|
| V1: Docker Compose rehearsal | V1 | Blocked (secrets missing in shell env) | ❌ None (Claude Code prerequisite) |
| V2: GovernedToolAuditService E2E | V2 | 0 audit rows unresolved | ❌ Open — Wave 1C this plan |
| F1: Forge Frontend Wiring | F1 | Mostly done | ✅ Partial — IncomeApproach L131 guard verified; L221 still unguarded |
| F2: Atlas Frontend Wiring | F2 | Not started | ❌ Open — Wave 1B this plan |
| D1: Dais E2E Tool Pipeline | D1 | Not started | ❌ Open — Wave 2A this plan |

---

## Completed (Do NOT redo)

- [x] DevPropertySeeder (CARD-06/15/16)
- [x] Dossier 200 proof (CARD-17)
- [x] DevGovernmentUserSeeder + SQLite resolver (CARD-18)
- [x] Atlas source classification fix (CARD-13)
- [x] Forge frontend F1 partial: IncomeApproach L131 `?? 0` guard, Reconciliation partial-payload guard
- [x] Phase 33E warning census (0 warnings)
- [x] Codex369 routes + smoke suite

---

## Open Gaps (inputs for this plan)

### Copilot-owned gaps:

| Gap | File(s) |
|-----|---------|
| `IncomeApproach.tsx` L221 — `grossIncomeMultiplier.toFixed(2)` unguarded | `forge/IncomeApproach.tsx` |
| Atlas frontend not wired to `/api/atlas/gis/parcels/{id}/boundary` + `layers` | `PropertyAtlas.tsx`, `useAtlasGis.ts` |
| Dais invokeTool → result display pipeline missing | `PropertyDais.tsx`, `handlers.real.ts` |
| 89_247 hardcoded in production frontend components (not test fixtures) | TrustRegistry, AdminDashboard, AVMStudio, GeometryHealth, TerraExportModule |
| Management Dashboard not wired to live API + SignalR | `ManagementDashboard.tsx` |

### Claude Code-owned gaps (parallel):

| Gap | File(s) |
|-----|---------|
| GovernedToolAuditService writing 0 audit rows on Dais tool call | `GovernedToolAuditService.cs`, `DaisController.cs` |
| PACS Phase 3: `PacsTaxAreaAssoc` entity missing | `TerraFusion.Data`, `PacsDataSeeder.cs` |
| Live parcel count backend endpoint (needed for stub elimination) | `GovernmentController.cs` or new stats endpoint |

---

## Wave Map

```
┌───────────────────────────────────────────────────────────────────────┐
│                   GATE ZERO — Merge PR #706                           │
│                   Human decision: merge or new card                   │
└───────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌───────────────────────────────────────────────────────────────────────┐
│                        WAVE 1 (all parallel)                          │
│                                                                       │
│  W1A (Copilot)         W1B (Copilot)         W1C (Claude Code)       │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐         │
│  │ Forge F1     │     │ Atlas F2     │     │ AuditService │         │
│  │ completion   │     │ wiring       │     │ E2E fix      │         │
│  │ (L221 guard  │     │ (boundary +  │     │ (0 rows bug) │         │
│  │  + vitest)   │     │  layers)     │     │              │         │
│  └──────────────┘     └──────────────┘     └──────────────┘         │
│  frontend only         frontend only        backend only              │
└───────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌───────────────────────────────────────────────────────────────────────┐
│                       WAVE 2 (parallel)                               │
│                                                                       │
│  W2A (Copilot)                        W2B (Claude Code)               │
│  ┌──────────────────────────┐        ┌──────────────────────────┐    │
│  │ Dais E2E Tool Pipeline   │        │ PACS Phase 3 +           │    │
│  │ (invokeTool → result     │        │ Live Parcel Count        │    │
│  │  display panels)         │        │ endpoint                 │    │
│  └──────────────────────────┘        └──────────────────────────┘    │
│  frontend only                        backend only                    │
└───────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌───────────────────────────────────────────────────────────────────────┐
│                  WAVE 3 — Stub Elimination + Dashboard                │
│                                                                       │
│  W3A (Copilot)                        W3B (Copilot)                   │
│  ┌──────────────────────────┐        ┌──────────────────────────┐    │
│  │ ParcelCount stub →       │        │ Management Dashboard      │    │
│  │ useParcelCount() hook    │        │ live API + SignalR         │    │
│  │ (5 production files)     │        │                          │    │
│  └──────────────────────────┘        └──────────────────────────┘    │
│  Depends on W2B (backend              frontend only                   │
│  stats endpoint)                                                       │
└───────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌───────────────────────────────────────────────────────────────────────┐
│                      INTEGRATION                                      │
│  1. pnpm vitest run (full suite, target: 0 regressions)              │
│  2. dotnet build TerraFusion.sln (0 errors, 0 warnings)              │
│  3. pnpm run type-check (EXIT 0)                                     │
│  4. UI token ratchet (≤ 790 or better)                               │
│  5. Save-state                                                        │
└───────────────────────────────────────────────────────────────────────┘
```

---

## WAVE 1A — Forge F1 Completion (Copilot)

**Scope:** Fix the remaining unguarded `.toFixed()` crash path in IncomeApproach.tsx, run the Forge test suite, commit.  
**Owner:** Copilot  
**Isolation:** `frontend/apps/os-shell/src/pages/workbench/tabs/forge/`

- [ ] **Step 1: Verify L221 crash path**

```
File: frontend/apps/os-shell/src/pages/workbench/tabs/forge/IncomeApproach.tsx
Line 221: incomeState.result.grossIncomeMultiplier.toFixed(2)
```

If `grossIncomeMultiplier` can be `undefined | null` (type is `number` in types.ts but API response may omit it), add `?? 0` guard:
```tsx
{(incomeState.result.grossIncomeMultiplier ?? 0).toFixed(2)}
```

- [ ] **Step 2: Run Forge tests**

```bash
pnpm --filter terrafusion-frontend vitest run src/__tests__/forge/
```

Expected: 0 failures.

- [ ] **Step 3: Run full vitest suite**

```bash
pnpm --filter terrafusion-frontend vitest run
```

Expected: ≥ previous baseline, 0 regressions.

- [ ] **Step 4: Commit**

```
fix(forge): guard grossIncomeMultiplier ?? 0 at L221, complete F1 Forge wiring

Evidence:
- IncomeApproach.tsx L221: added ?? 0 guard (matches L131 pattern)
- Forge vitest: [N] tests pass, 0 failures
- Full vitest suite: [N] pass, 0 regressions
- pnpm type-check: EXIT 0

Government: FISMA compliance
AI-Collaboration: GitHub Copilot
```

---

## WAVE 1B — Atlas F2 Frontend Wiring (Copilot)

**Scope:** Wire PropertyAtlas.tsx boundary + layer panels to the live `AtlasGisController` endpoints. Keep SVG canvas; the GIS service provides data overlays.  
**Owner:** Copilot  
**Isolation:** `frontend/apps/os-shell/src/pages/workbench/tabs/atlas/`, `useAtlasGis.ts`

### Context (CARD-13 established)
- `useAtlasGis.ts` now classifies `"canonical"` → `'live'` and `"stub"` → `'unavailable'`
- `AtlasGisController` exposes: `GET /api/atlas/gis/parcels/{parcelId}/boundary` + `/layers`
- PropertyAtlas.tsx sub-panels for boundary/dimensions/zoning/tax-area/land-class need to render live data when `sourceStatus === 'live'`

- [ ] **Step 1: Read current state**

```
frontend/apps/os-shell/src/pages/workbench/tabs/atlas/PropertyAtlas.tsx
frontend/apps/os-shell/src/hooks/useAtlasGis.ts
backend/src/TerraFusion.API/Controllers/AtlasGisController.cs  (read-only)
```

Note the response contract shapes from `AtlasGisController`.

- [ ] **Step 2: Verify or create `useAtlasBoundary` + `useAtlasLayers` hooks**

If `useAtlasGis.ts` already calls `/api/atlas/gis/parcels/{parcelId}/boundary`: confirm response fields map to panel props.  
If hooks are missing or incomplete: wire them to `GET /api/atlas/gis/parcels/{parcelId}/boundary` and `/layers`.

- [ ] **Step 3: Wire panel components to live data**

For each panel (boundary, dimensions, zoning, tax-area, land-class):
- When `sourceStatus === 'live'`: render live fields from hook response
- When `sourceStatus === 'unavailable'`: render honest "Not available in PACS mirror" label (not a spinner, not a loading skeleton that stays forever)
- Flood zone panel: explicitly labeled "Stub — no FEMA data in PACS" (already documented in alpha.html)

- [ ] **Step 4: Add `WorkbenchSourceBadge` where missing**

All panels that switch between live/unavailable must surface the badge. Pattern already exists from F1 and honesty pass phases.

- [ ] **Step 5: Run Atlas tests**

```bash
pnpm --filter terrafusion-frontend vitest run src/__tests__/atlas/
```

Expected: 0 failures.

- [ ] **Step 6: Run full vitest suite + type-check**

```bash
pnpm --filter terrafusion-frontend vitest run
pnpm run type-check
```

- [ ] **Step 7: Commit**

```
feat(atlas): wire PropertyAtlas panels to live AtlasGisController endpoints (F2)

Evidence:
- useAtlasGis.ts: boundary + layers hooks wired to /api/atlas/gis/parcels/{id}/*
- PropertyAtlas.tsx: panels render live data when sourceStatus=live
- Unavailable panels: honest label, no eternal spinner
- Flood zone: explicitly stubbed (no FEMA data)
- WorkbenchSourceBadge: present on all switching panels
- Atlas vitest: [N] pass, 0 failures
- Full vitest suite: [N] pass, 0 regressions
- pnpm type-check: EXIT 0

Government: FISMA compliance
AI-Collaboration: GitHub Copilot
```

---

## WAVE 1C — GovernedToolAuditService E2E Fix (Claude Code)

**Scope:** Fix the runtime discrepancy where Dais tool calls (`GET /api/dais/exemptions/eligibility`) return 200 but produce 0 `AuditLogs` rows.  
**Owner:** Claude Code  
**Isolation:** Backend only — `GovernedToolAuditService.cs`, `DaisController.cs`, `AuditLog` entity

### Known Context (2026-03-23 V2 investigation)
- Endpoint returns 200 ✅
- `AuditLogs` table shows 0 rows with `Type LIKE 'DAIS_TOOL%'` after the call
- Root cause: either `GovernedToolAuditService.WriteAsync()` is not being called in the tool handler, or the DbContext `SaveChangesAsync()` is not completing before the connection closes, or the dev SQLite path is swallowing the write

### Steps (Claude Code lane — not Copilot)

- [ ] Trace `DaisController` → `GovernedToolAuditService` injection + invocation
- [ ] Verify `SaveChangesAsync()` is awaited before response returned
- [ ] If SQLite isolation issue: confirm `AuditLogs` DbSet is in the SQLite context (not Postgres-only context)
- [ ] Add unit test: mock DaisController tool call → assert `GovernedToolAuditService.WriteAsync` called once
- [ ] Build + test + commit

---

## WAVE 2A — Dais E2E Tool Pipeline (Copilot)

**Scope:** Wire the full frontend `invokeTool → DaisController → result display` pipeline.  
**Owner:** Copilot  
**Depends on:** Wave 1C (AuditService E2E fix) should be done or in parallel — Copilot focuses on frontend display regardless of audit write status  
**Isolation:** `PropertyDais.tsx`, Pilot `handlers.real.ts`, result panel components

- [ ] **Step 1: Read current invocation state**

```
frontend/apps/os-shell/src/pages/workbench/tabs/dais/PropertyDais.tsx
frontend/apps/os-shell/src/services/pilot/handlers.real.ts
```

For each tool card category (cert, PILT, exemptions, levy, appeals, BOE, notices, queue): map what happens after a card is clicked. Does the invocation reach the backend?

- [ ] **Step 2: Identify tool categories with missing result panels**

Per alpha.html truth table: "Tool cards visible before invocation: cert status, PILT, exemptions, levy, appeals, BOE, notices, queue — invocations via pilot API."  
The gap is result display after invoke, not the tool cards themselves.

- [ ] **Step 3: Wire result display for each category**

For each tool category with a missing result panel:
- On `invokeTool` success: render the returned result fields in the sub-panel
- On error: display error message with `correlationId` (standard ErrorDisplay pattern)
- Add invocation history entry (if history recording is missing for any category)

Pattern from existing Pilot implementation: use the correlationId-first UX (ErrorDisplay with copy button, dev-mode trace query hint).

- [ ] **Step 4: Run Dais tests**

```bash
pnpm --filter terrafusion-frontend vitest run src/__tests__/workbench/ --reporter=verbose
```

- [ ] **Step 5: Run full vitest suite + type-check**

- [ ] **Step 6: Commit**

```
feat(dais): wire invokeTool result display panels for all tool categories

Evidence:
- PropertyDais.tsx: result panels wired for [list categories]
- handlers.real.ts: invocation history recording complete
- ErrorDisplay: correlationId shown on tool invocation failures
- Dais vitest: [N] pass, 0 failures
- Full vitest suite: [N] pass, 0 regressions
- pnpm type-check: EXIT 0

Government: FISMA compliance
AI-Collaboration: GitHub Copilot
```

---

## WAVE 2B — PACS Phase 3 + Live Parcel Count Endpoint (Claude Code)

**Scope:** Two parallel Claude Code deliverables.  
**Owner:** Claude Code

### B1: PacsTaxAreaAssoc Entity

Per `2026-03-23-phases-8-11-35-pacs3-parallel.md` — `PacsTaxAreaAssoc` entity for `wash_prop_owner_tax_area_assoc`.

- [ ] Entity + EF migration + `SeedTaxAreaAssocsAsync` method added to `PacsDataSeeder`
- [ ] `dotnet build` 0 errors
- [ ] EF migration applied to dev SQLite

### B2: Live Parcel Count Stats Endpoint

New endpoint needed for Wave 3A stub elimination:

```
GET /api/government/stats
Response: { totalProperties: int, countyId: Guid }
```

- [ ] Add `GetStatsAsync()` to `IGovernmentService` or inline in `GovernmentController`
- [ ] Returns `Properties.CountAsync()` (live query — no hardcoded stub)
- [ ] Authenticated: requires `GovernmentUser` role

---

## WAVE 3A — ParcelCount Stub Elimination (Copilot)

**Scope:** Replace `89_247` hardcoded literals in **production** frontend components with a live `useParcelCount()` hook backed by the Wave 2B stats endpoint.  
**Owner:** Copilot  
**Depends on:** Wave 2B (stats endpoint)  
**Isolation:** Only these 5 production files (test fixtures exempt per CARD-10 policy):

| File | Line(s) |
|------|---------|
| `TrustRegistry.tsx` | 97, 124 |
| `AdminDashboard.tsx` | 159 |
| `AVMStudio.tsx` | 55, 56 |
| `GeometryHealth.tsx` | 39 |
| `TerraExportModule.tsx` | 54, 73 |

- [ ] **Step 1: Create `useParcelCount()` hook**

```typescript
// frontend/apps/os-shell/src/hooks/useParcelCount.ts
export function useParcelCount(countyId?: string) {
  return useQuery({
    queryKey: ['parcel-count', countyId],
    queryFn: () => fetch(`/api/government/stats`).then(r => r.json()),
    staleTime: 5 * 60 * 1000,  // 5min — gov stats don't thrash
  });
}
```

- [ ] **Step 2: Replace literals in each production file**

For each file: import `useParcelCount`, replace numeric literal with `data?.totalProperties ?? 89_247` (safe fallback = named stub until API responds).

- [ ] **Step 3: Run tests + type-check**

- [ ] **Step 4: Commit**

```
feat(stats): replace 89_247 hardcoded stub with useParcelCount() live hook

Evidence:
- useParcelCount.ts: new hook calling /api/government/stats
- 5 production files patched (TrustRegistry, AdminDashboard, AVMStudio, GeometryHealth, TerraExportModule)
- Fallback: ?? 89_247 until API responds (safe for tests)
- Test fixtures: unchanged (CARD-10 policy: only live-code hits)
- Full vitest suite: [N] pass, 0 regressions
- pnpm type-check: EXIT 0

Government: FISMA compliance
AI-Collaboration: GitHub Copilot
```

---

## WAVE 3B — Management Dashboard Live Wiring (Copilot)

**Scope:** Wire ManagementDashboard.tsx to live backend API counters + SignalR real-time updates.  
**Owner:** Copilot  
**Reference:** `docs/superpowers/plans/2026-03-22-phase8-management-dashboard.md` (earlier spec)  
**Isolation:** `frontend/apps/os-shell/src/components/ManagementDashboard.tsx` (or equivalent path)

- [ ] **Step 1: Read ManagementDashboard.tsx and identify mock/hardcoded data blocks**

- [ ] **Step 2: Connect to existing backend counters**

Map each dashboard KPI to a real API endpoint:
- Active agents: `/api/system/status` or SignalR hub
- Parcel count: `/api/government/stats` (from Wave 2B)
- Tool invocations today: `/api/dais/stats` (if exists) or audit log count query

- [ ] **Step 3: Wire SignalR for real-time panel updates**

Use `useSignalRConnection` pattern (existing in codebase). Connect to `/hubs/system` for live agent/tool events.

- [ ] **Step 4: Run Dashboard tests + full suite**

- [ ] **Step 5: Commit**

```
feat(dashboard): wire ManagementDashboard to live API + SignalR

Evidence:
- ManagementDashboard.tsx: [N] mock panels replaced with live hooks
- SignalR: /hubs/system connected for real-time updates
- Dashboard vitest: [N] pass, 0 failures
- Full vitest suite: [N] pass, 0 regressions
- pnpm type-check: EXIT 0

Government: FISMA compliance
AI-Collaboration: GitHub Copilot
```

---

## Integration (after all waves)

```bash
# 1. Full frontend test suite
pnpm --filter terrafusion-frontend vitest run

# 2. Backend gates
dotnet build backend/TerraFusion.sln  # 0 errors, 0 warnings
dotnet test backend/TerraFusion.Unit.Tests  # all pass

# 3. Type gate
pnpm run type-check  # EXIT 0

# 4. UI token ratchet — must not regress past 790
pnpm run tdc:check

# 5. Governance
node --test os-platform/core/tests/phase83-tools.test.mjs
```

---

## Agent Ownership Summary

| Wave | Lane | Owner | Key Deliverable |
|------|------|-------|----------------|
| Gate 0 | — | Human | Merge PR #706 or new card |
| 1A | Forge F1 completion | Copilot | IncomeApproach L221 guard + vitest |
| 1B | Atlas F2 wiring | Copilot | PropertyAtlas → live boundary/layer panels |
| 1C | AuditService E2E | Claude Code | 0 audit rows bug fixed |
| 2A | Dais tool pipeline | Copilot | invokeTool → result display for all categories |
| 2B | PACS 3 + stats endpoint | Claude Code | PacsTaxAreaAssoc + GET /api/government/stats |
| 3A | ParcelCount stub elimination | Copilot | useParcelCount() hook, 5 prod files |
| 3B | Management Dashboard | Copilot | Live API + SignalR wiring |

**Hard rules:**
- No dual coding on the same lane. One agent codes, one reviews.
- No lane opens until Gate Zero is resolved.
- All gates must pass before any card is declared done (no "probably works").
- Test fixtures (89247 without underscore in `__tests__/` files) are **exempt** from stub elimination per CARD-10 policy.

---

## alpha.html Truth Table Target State (end of Phase 34)

| Tab | Current | Target after Phase 34 |
|-----|---------|----------------------|
| Forge | ✅ MWUX (year selector, sub-tab data) | ✅ MWUX (L221 guard; all sub-tab panels guarded) |
| Atlas | ✅ MWUX (boundary/layers) | ✅ MWUX (result panels live; flood zone honest stub) |
| Dais | ✅ MWUX (tool cards visible) | ✅ MWUX (result display panels wired) |
| Dossier | ⚠️ MWUX (seed required) | ⚠️ MWUX (unchanged — seed pre-condition remains) |
| Dashboard | ⚠️ (mock data) | ✅ MWUX (live API + SignalR) |
| ParcelCount KPIs | ⚠️ (89_247 stub) | ✅ MWUX (live hook, ?? fallback) |
