# TerraFusion OS — Phase 34 Copilot Lanes
**Date**: 2026-03-27  
**Status**: W2A + W2B SEALED — W3A SEALED (scoped) — W3B NEXT  
**Authority**: Co-Founder planning session, 2026-03-27 + collapse to Copilot-only 2026-03-27  
**Supersedes**: `2026-03-23-tier1-tier2-validation-wiring.md` (partial execution credit carried forward below)

> **Execution model**: Copilot only. Claude Code and Codex are retired from execution planning.

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
| HEAD | `1afaf12a3` on `fix/workbench-loading-aria` |
| Tree | Clean |
| Backend build | 0 errors, 0 warnings |
| `pnpm type-check` | EXIT 0 |
| UI token ratchet | 790 ≤ 812 (improved 22 from W3A) |
| Stage2 tests | 52/52 (+4 from W1C) |
| Dais workbench tests | 44/44 (W2A proof) |
| Dashboard vitest | 23/23 (W3A scope) |
| Full frontend vitest | **Not yet proven green** (broad run timed out) |
| PR #706 | Open, awaiting merge decision |
| Active sprint | Phase 34 — W3B next |
| Execution model | Copilot only |

---

## Carried-Forward Credit (2026-03-23 tier1-tier2 plan)

| Lane | Agent | Status | Credit |
|------|-------|--------|--------|
| V1: Docker Compose rehearsal | — | Dropped (secrets missing; no Claude Code agent available) | ❌ None |
| V2: GovernedToolAuditService E2E | Copilot (reassigned) | ✅ SEALED `4e77ce758` | Real proof coverage; stale SQLite state was root cause |
| F1: Forge Frontend Wiring | Copilot | ✅ SEALED `a35a2e32a` | L221 guard added; Forge vitest 126/126 |
| F2: Atlas Frontend Wiring | Copilot | ✅ SEALED `c96ef3eeb` | Unavailable states + flood stub label; Atlas vitest 78/78 |
| D1: Dais E2E Tool Pipeline | Copilot | ✅ SEALED `5b6a9f495` | Proof-only pass; 44/44 tests; pipeline was already wired |

---

## Completed (Do NOT redo)

- [x] DevPropertySeeder (CARD-06/15/16)
- [x] Dossier 200 proof (CARD-17)
- [x] DevGovernmentUserSeeder + SQLite resolver (CARD-18)
- [x] Atlas source classification fix (CARD-13)
- [x] Forge frontend F1 partial: IncomeApproach L131 `?? 0` guard, Reconciliation partial-payload guard
- [x] Phase 33E warning census (0 warnings)
- [x] Codex369 routes + smoke suite
- [x] **W1A** — IncomeApproach L221 `?? 0` guard + Forge vitest 126/126 (`a35a2e32a`)
- [x] **W1B** — Atlas unavailable-state disclosure + flood stub label + Atlas vitest 78/78 (`c96ef3eeb`)
- [x] **W1C** — GovernedToolAuditService E2E proof coverage, 4 tests, Stage2 52/52 (`4e77ce758`)
- [x] **W2A** — Dais invokeTool → result display pipeline proof/seal, 44/44 tests (`5b6a9f495`)
- [x] **W3A** — `useParcelCount()` hook created; 5 production surfaces rewired off hardcoded parcel counts; bare `89247` literals eliminated from production pages (`1afaf12a3`)
  > **Proof scope:** type-check EXIT 0, dashboard vitest 23/23, source sweep clean. Full frontend vitest not yet proven green.
- [x] **W2B B2** — `/api/government/stats` live endpoint (`GovernmentController.cs` — `_db.Properties.CountAsync()`, `dataSource = "LIVE_DB"`);  
  `BentonParcelCountStub` const retained as dead-named-stub; dead code cleanup deferred

### Copilot-owned gaps:

| Gap | File(s) |
|-----|---------|
| `IncomeApproach.tsx` L221 — `grossIncomeMultiplier.toFixed(2)` unguarded | `forge/IncomeApproach.tsx` |
| Atlas frontend not wired to `/api/atlas/gis/parcels/{id}/boundary` + `layers` | `PropertyAtlas.tsx`, `useAtlasGis.ts` |
| Dais invokeTool → result display pipeline missing | `PropertyDais.tsx`, `handlers.real.ts` |
| ~~89_247 hardcoded in production frontend components (not test fixtures)~~ | ~~TrustRegistry, AdminDashboard, AVMStudio, GeometryHealth, TerraExportModule~~ | ~~W3A~~ ✅ SEALED (scoped) `1afaf12a3` |
| Management Dashboard not wired to live API + SignalR | `ManagementDashboard.tsx` |

### ✅ Gaps closed this plan:

| Gap | Resolution |
|-----|------------|
| `IncomeApproach.tsx` L221 unguarded `.toFixed()` | W1A `a35a2e32a` |
| Atlas frontend unavailable-state disclosure missing | W1B `c96ef3eeb` |
| GovernedToolAuditService had zero proof coverage | W1C `4e77ce758` |
| Live `/api/government/stats` endpoint | GovernmentController.cs edited (live `CountAsync`) |

### 🔲 Remaining open gaps:

| Gap | File(s) | Wave |
|-----|---------|------|
| ~~PACS Phase 3: `PacsTaxAreaAssoc` entity missing~~ | ~~`TerraFusion.Data`, `PacsDataSeeder.cs`~~ | ~~W2B B1~~ ✅ Proof-sealed |
| ~~89_247 hardcoded in 5 production frontend components~~ | ~~TrustRegistry, AdminDashboard, AVMStudio, GeometryHealth, TerraExportModule~~ | ~~W3A~~ ✅ SEALED (scoped) `1afaf12a3` |
| Full frontend vitest green | All test files | **W3C prerequisite** |
| Live smoke: 5 W3A surfaces vs `/api/government/stats` | TrustRegistry, AdminDashboard, AVMStudio, GeometryHealth, TerraExportModule | W3C (bounded smoke card) |
| Management Dashboard not wired to live API + SignalR | `ManagementDashboard.tsx` | W3B (after W3C) |

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
│  W1A ✅ SEALED        W1B ✅ SEALED          W1C ✅ SEALED           │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐         │
│  │ Forge F1     │     │ Atlas F2     │     │ AuditService │         │
│  │ a35a2e32a    │     │ c96ef3eeb    │     │ 4e77ce758    │         │
│  │ Copilot      │     │ Copilot      │     │ Copilot      │         │
│  └──────────────┘     └──────────────┘     └──────────────┘         │
└───────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌───────────────────────────────────────────────────────────────────────┐
│                       WAVE 2 (parallel)                               │
│                                                                       │
│  W2A ✅ SEALED 5b6a9f495             W2B B1 ✅ SEALED (proof)          │
│  ┌──────────────────────────┐        ┌──────────────────────────┐    │
│  │ Dais E2E Tool Pipeline   │        │ PACS Phase 3 B1:         │    │
│  │ (proof-only seal;        │        │ PacsTaxAreaAssoc entity, │    │
│  │  pipeline was wired)     │        │ migration, seeder wired  │    │
│  └──────────────────────────┘        └──────────────────────────┘    │
│  44/44 tests; type-check 0            build 0 errors; type-check 0     │
└───────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌───────────────────────────────────────────────────────────────────────┐
│                  WAVE 3 — Stub Elimination + Dashboard                │
│                                                                       │
│  W3A ✅ SEALED (scoped)             W3B (Copilot)                   │
│  ┌──────────────────────────┐        ┌──────────────────────────┐    │
│  │ ParcelCount stub →       │        │ Management Dashboard      │    │
│  │ useParcelCount() hook    │        │ live API + SignalR         │    │
│  │ (5 production files)     │        │                          │    │
│  │ 1afaf12a3                │        └──────────────────────────┘    │
│  │ Proof: type-check 0,     │        frontend only                   │
│  │ dash vitest 23/23,       │        After W3C smoke card            │
│  │ source sweep clean       │                                        │
│  │ ⚠️ full vitest TBD       │                                        │
│  └──────────────────────────┘                                        │
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

## WAVE 1A — Forge F1 Completion ✅ SEALED `a35a2e32a`

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

## WAVE 1B — Atlas F2 Frontend Wiring ✅ SEALED `c96ef3eeb`

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

## WAVE 1C — GovernedToolAuditService E2E Fix ✅ SEALED `4e77ce758`

**Scope:** Add real proof coverage for the audit write path.  
**Owner:** Copilot (reassigned from Claude Code — no Claude Code agent available)  
**Isolation:** Backend tests only — `GovernedToolAuditServiceTests.cs`

### Root Cause (determined via code archaeology)
- Service code was already correct: `LogInvocationAsync` adds entity, awaits `SaveChangesAsync`, swallows only persist errors
- All 8 call sites in `DaisController` correctly invoke `LogInvocationAsync` before returning `Ok()`
- All prior tests mocked `IGovernedToolAuditService` — zero proof coverage that real write path executed
- Production "0 rows" in dev = stale SQLite migration-state; exception swallowed, write silently dropped

### Proof added (`GovernedToolAuditServiceTests.cs`)

- [x] `LogInvocationAsync_WritesExactlyOneAuditRow` — real service + real InMemory DB → 1 row
- [x] `LogInvocationAsync_TwoDistinctTools_WritesTwoRows` — two calls → two distinct rows
- [x] `CheckExemptionEligibility_CallsAuditServiceOnce_WithCorrectArgs` — mock verify, correct args
- [x] `CheckExemptionEligibility_WithRealAuditService_WritesOneRow` — full E2E, 1 row in DB

### Gates at seal
- Stage2: 52/52 (+4 new)
- `dotnet build TerraFusion.sln`: 0 errors, 0 warnings
- `pnpm type-check`: EXIT 0
- UI ratchet: 790 ≤ 812

---

## WAVE 2A — Dais E2E Tool Pipeline ✅ SEALED `5b6a9f495`

**Scope:** Verify the full frontend `invokeTool → DaisController → result display` pipeline.  
**Owner:** Copilot  
**Sealed:** `5b6a9f495` — proof-only pass (pipeline was already wired)  
**Isolation:** `PropertyDais.tsx`, Pilot `handlers.real.ts`, result panel components

### Result (proof-only seal)

- [x] `PropertyDais.tsx` at `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyDais.tsx` — NOT in a `/dais/` subdirectory
- [x] `handlers.real.ts` at `os-platform/core/pilot/handlers.real.ts` — NOT at the plan's claimed frontend path
- [x] All 8 categories had complete `invokeTool → JSON.parse(output) → panel state` pipelines already wired
- [x] All 9 R2.9 handlers registered (lines 2553-2561), all calling real backend endpoints
- [x] `ErrorDisplay` with `correlationId` on every category error path
- [x] `WorkbenchSourceBadge source='live'` on success rows; `fallback/unavailable` at idle
- [x] `InvocationHistory` on success + error for all categories
- [x] `PropertyDais.test.tsx` + `PropertyDais.honesty.contract.test.tsx` = **44/44 pass**
- [x] `pnpm run type-check` = **EXIT 0**
- [x] Frontend files were clean vs HEAD before seal — empty commit used

---

## WAVE 2B — PACS Phase 3 ✅ SEALED (proof)

**Scope:** One remaining deliverable (B2 already done).  
**Owner:** Copilot (reassigned from Codex — single-agent model)

### ✅ B2: Live Parcel Count Stats Endpoint — DONE

`GovernmentController.cs` was edited: `GET /api/government/stats` now issues `_db.Properties.AsNoTracking().CountAsync()` with `dataSource = "LIVE_DB"`, `stubbed = false`. No auth required (`[AllowAnonymous]`). W3A `useParcelCount()` hook can be built now — no further backend work needed for this.

### ✅ B1: PacsTaxAreaAssoc Entity — DONE (proof-sealed)

All three deliverables were already implemented before this session:

| Artifact | Location | Status |
|----------|----------|--------|
| `PacsTaxAreaAssoc.cs` entity | `TerraFusion.Core/Entities/Pacs/` | ✅ Exists |
| `DbSet<PacsTaxAreaAssoc>` | `TerraFusionDbContext.cs` line 176 | ✅ Registered |
| EF migration `20260323145606_AddPacsTaxAreaAssoc` | `TerraFusion.Data/Migrations/` | ✅ Exists (2653 bytes) |
| `SeedTaxAreaAssocsAsync` | `PacsDataSeeder.cs` line 1867 | ✅ Implemented + called |

Table: `pacs_tax_area_assocs` (maps `wash_prop_owner_tax_area_assoc`).  
Composite unique index on `(PacsPropId, PropValYear, SupNum, PacsOwnerId, TaxAreaId)`.  
Called from `SeedAllAsync` at line 128 on the current-year PACS snapshot.

**Gates at seal:**
- `dotnet build TerraFusion.sln`: Build succeeded, 0 errors
- `pnpm run type-check`: EXIT 0

---

## WAVE 3A — ParcelCount Stub Elimination ✅ SEALED (scoped) `1afaf12a3`

**Scope:** Replace `89_247` hardcoded literals in **production** frontend components with a live `useParcelCount()` hook backed by the `/api/government/stats` endpoint.  
**Owner:** Copilot  
**Sealed:** `1afaf12a3`

### Result

| Artifact | Status |
|----------|--------|
| `useParcelCount.ts` | ✅ Created — `apiFetch('/government/stats')`, 5 min stale time |
| `TrustRegistry.tsx` L97, L124 | ✅ Wired — `parcelCount` from hook, `SAMPLE_CONNECTORS` moved inside component |
| `AVMStudio.tsx` L55, L56 | ✅ Wired — derived `pipeline` array overrides stage 0–1 `recordsProcessed` |
| `GeometryHealth.tsx` L39 | ✅ Wired — `overallScore` memo + JSX Total Parcels display use live count |
| `AdminDashboard.tsx` L159–164 | ✅ Wired — `DataQualityPanel` calls hook; all 6 `total` fields use live count |
| `AdminDashboard.tsx` L280, L308 | ✅ Normalized to `89_247` — static historical rows (2026 study period + CAMA scrape job); not live KPIs |
| `TerraExportModule.tsx` L54, L73 | ✅ Wired — `useEffect` updates parcels layer features + `exp-001` featureCount on stats arrival |
| Bare `89247` in production pages | ✅ Clean — source sweep confirmed 0 matches |
| CARD-10 test fixtures | ✅ Untouched — 7 `__tests__/` files exempt |

### Proof ledger

```text
W3A — SEALED (scoped proof)
Proven:
  - source replacement complete (bare 89247 sweep: 0 hits in production pages)
  - type-check EXIT 0
  - dashboard vitest 23/23
  - UI token ratchet 790 ≤ 812 (improved 22)
Not yet proven:
  - full frontend vitest green (broad run timed out)
  - live browser smoke across all five updated screens vs /api/government/stats
```

### Open follow-on cards

- **W3C** (bounded): live smoke of the five touched surfaces against a running `/api/government/stats` backend. Verify loading / live / fallback (`?? 89_247`) behavior. Gate: must pass before full-suite vitest is counted as proven.
- **Full frontend vitest**: run to completion once before W3B is considered integration-ready.

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

| Wave | Lane | Owner | Key Deliverable | Status |
|------|------|-------|----------------|--------|
| Gate 0 | — | Human | Merge PR #706 or new card | Deferred |
| 1A | Forge F1 completion | Copilot | IncomeApproach L221 guard + vitest | ✅ `a35a2e32a` |
| 1B | Atlas F2 wiring | Copilot | PropertyAtlas → live boundary/layer panels | ✅ `c96ef3eeb` |
| 1C | AuditService E2E | Copilot | 0 audit rows bug fixed | ✅ `4e77ce758` |
| 2A | Dais tool pipeline | Copilot | invokeTool → result display for all categories | ✅ `5b6a9f495` |
| 2B B1 | PacsTaxAreaAssoc | Copilot | PacsTaxAreaAssoc entity + migration + seeder | ✅ Proof-sealed |
| 2B B2 | Stats endpoint | Copilot | GET /api/government/stats | ✅ Done |
| 3A | ParcelCount stub elimination | Copilot | useParcelCount() hook, 5 prod files | ✅ SEALED (scoped) `1afaf12a3` — full vitest TBD |
| 3C | W3A live smoke | Copilot | 5 surfaces vs `/api/government/stats`; loading/fallback behavior | 🔲 Before W3B integration |
| 3B | Management Dashboard | Copilot | Live API + SignalR wiring | 🔲 After W3C |

**Hard rules (Copilot-only model):**
- Single owner per card. Copilot is the only execution agent.
- One bounded card at a time. No card opens until the previous seals.
- All gates must pass before any card is declared done (no "probably works").
- Test fixtures (89247 without underscore in `__tests__/` files) are **exempt** from stub elimination per CARD-10 policy.
- Task card closes only when acceptance evidence is posted, not when the agent says "done".

---

## alpha.html Truth Table Target State (end of Phase 34)

| Tab | Current | Target after Phase 34 |
|-----|---------|----------------------|
| Forge | ✅ MWUX (year selector, sub-tab data) | ✅ MWUX (L221 guard; all sub-tab panels guarded) |
| Atlas | ✅ MWUX (boundary/layers) | ✅ MWUX (result panels live; flood zone honest stub) |
| Dais | ✅ MWUX (tool cards visible) | ✅ MWUX (result display panels wired) |
| Dossier | ⚠️ MWUX (seed required) | ⚠️ MWUX (unchanged — seed pre-condition remains) |
| Dashboard | ⚠️ (mock data) | ✅ MWUX (live API + SignalR) |
| ParcelCount KPIs | ⚠️ (89_247 stub) | ✅ MWUX (live hook, ?? fallback) — full smoke TBD |

---

## Save State — 2026-03-27 end of W3A

```text
Branch:   fix/workbench-loading-aria
HEAD:     1afaf12a3 — feat(stats): replace 89_247 hardcoded stubs with useParcelCount() live hook (W3A)
Tree:     Clean

What is true now:
  - useParcelCount() hook exists at src/hooks/useParcelCount.ts
  - 5 production surfaces consume live /api/government/stats instead of frozen 89_247
  - Static historical rows (AdminDashboard L280/L308) explicitly left as 89_247 named stubs
  - Bare 89247 source sweep: 0 hits in production pages
  - Test fixtures in __tests__/: untouched per CARD-10
  - type-check EXIT 0, ratchet 790, dashboard vitest 23/23
  - Full frontend vitest: NOT yet proven green (broad run timed out)

Where we stopped:
  W3A sealed with scoped proof. Co-founder accepted the seal with labeling correction:
  "W3A passed for scoped proof" — not full vitest green.

Active variables:
  - full frontend vitest: must run to completion before W3B is integration-ready
  - W3C: bounded live smoke of 5 W3A surfaces against running backend
    (loading / live / fallback ?? 89_247 behavior)
  - W3B: Management Dashboard live API + SignalR — opens after W3C

Next smallest step:
  W3C — run pnpm --filter terrafusion-frontend vitest run to completion,
  capture summary line. Then open bounded live smoke card for the 5 surfaces.

Unhandled risks:
  - /api/government/stats may 404 if backend not running with --seed-pacs (CARD-14 pre-condition)
  - ?? 89_247 fallback is correct behavior; live smoke must verify it fires on fetch failure
  - PR #706 still unmerged — Gate Zero is still a human decision
```
