# TerraFusion OS — Full Remediation Plan v1
## Date: March 16, 2026
## Branch: `phase-7-county-ops-visual-governance`
## Auditor: TerraFusion Elite Government OS Engineering Agent

---

## TOOLS & CONSTRAINTS

| Tool | Status | Best For |
|------|--------|----------|
| **Copilot (Claude Opus 4.6)** | Available now | Interactive editing, complex refactors, contract tests, type work, multi-file coordination |
| **Claude Code (Claude Desktop)** | Available now | Large autonomous tasks, bulk sweeps, cross-file analysis, backend .NET work |
| **Codex (VS Code Insiders)** | Out until 3/18 | Batch operations, parallel file edits, mechanical transforms (console sweep, type fixes) |

**Strategy**: Use Copilot + Claude Code for Weeks 1–2. Reserve Codex for mechanical bulk work starting 3/18.

**Codex operating rule**: When Codex is assigned a slice in this plan, use the bounded prompt frames in [`CODEX_DIRECTIVE_PACK_v1.md`](./CODEX_DIRECTIVE_PACK_v1.md). Codex stays in recon, execution, and review lanes; scope, governance exceptions, architecture, and merge judgment stay with the human operator.

---

## AUDIT CALIBRATION (Ground Truth vs. Report)

The original audit was directionally correct but overstated several claims. Validated findings:

| Claim | Audit Said | Actual | Delta |
|-------|-----------|--------|-------|
| Console statements | 999 across 224 files | 200+ in os-shell (rest in QUARANTINE/archive) | Actionable scope ~200 |
| TODO comments | 42 critical | 152 total (8 critical RAG stubs confirmed) | More than reported |
| Workbench tab stubs | 8 stub pages | 0 stubs — all tabs have real MWUX governed tools | Audit wrong |
| describe.skip/it.skip | 40+ | 0 found | Audit wrong (likely counted quarantined tests) |
| @ts-ignore | 5 | 6 (Recharts + Chrome APIs) | Close |
| `any` types | 50+ | 200+ | Worse than reported |
| marketplace/ | Empty directory | Directory doesn't exist at all | Worse |
| Backend AI stubs | 11 methods | 3 confirmed bare returns in Orchestrator | Overstated |
| PropertyValuation stubs | Hardcoded 425000m | Has real implementation structure | Partially wrong |

**Key insight**: The frontend Workbench tabs (Forge, Atlas, Dais, Clerk, Treasury, Audit, Dossier, Pilot) are NOT stubs. They are fully implemented MWUX governed tool surfaces. The screenshots confirm real interactive tools with write-lane enforcement, risk level badges, and confirmation gates.

---

## REVISED SCORECARD

| Domain | Architecture | Implementation | Production-Ready |
|--------|-------------|----------------|-----------------|
| Shell/Launcher/Policy | 100% | 95% | 90% |
| Workbench Tabs (MWUX) | 100% | 85% | 70% |
| Frontend Standalone Pages | 95% | 50% | 30% |
| Backend API/Services | 85% | 55% | 40% |
| AI Swarm | 90% | 20% | 10% |
| Database/Migrations | 80% | 70% | 60% |
| Testing | 85% | 70% | 60% |
| CI/CD & Deployment | 80% | 45% | 30% |
| **OVERALL** | **~90%** | **~55%** | **~42%** |

---

## PHASE STRUCTURE: 6 WAVES

### WAVE 0: HYGIENE SWEEP (Mar 16–18)
**Goal**: Remove noise, establish clean baselines.
**Tools**: Copilot + Claude Code (Codex joins 3/18)

| # | Task | Files | Tool | Status |
|---|------|-------|------|--------|
| 0.1 | Commit 48 pending changes (clean working tree) | 48 files | Copilot | |
| 0.2 | Console.log sweep — replace with structured logger or remove | ~200 in os-shell | Codex (3/18) or Claude Code | |
| 0.3 | Create `useLogger()` hook to replace console.log in key paths | 1 new file | Copilot | |
| 0.4 | Audit `any` types — triage into fixable/Recharts-compat/test-only | grep results | Claude Code (research) | |
| 0.5 | Fix 6 @ts-ignore with proper type assertions | 2 files | Copilot | |

**Exit Criteria**:
- `git status` clean
- Console statements < 50 (monitoring/debug-only, gated behind `import.meta.env.DEV`)
- @ts-ignore count = 0

---

### WAVE 1: AUTH CONTEXT & CORE WIRING (Mar 18–21)
**Goal**: Thread real auth through all surfaces. Kill hardcoded user IDs.
**Tools**: Copilot (primary) + Codex (bulk replacements)

| # | Task | Files | Tool |
|---|------|-------|------|
| 1.1 | Implement `useAuthContext()` hook with RBAC claims | 1 new hook | Copilot |
| 1.2 | Wire auth to PropertyWorkbench (replace `[]` roles) | PropertyWorkbench.tsx | Copilot |
| 1.3 | Wire auth to GPTManagementDashboard (replace hardcoded user ID) | GPTManagementDashboard.tsx | Copilot |
| 1.4 | Wire auth to ResearchPortal (replace `phd-researcher-001`) | ResearchPortal.tsx | Copilot |
| 1.5 | Wire auth to QuantumModuleManager (replace permission stub) | QuantumModuleManager.ts | Copilot |
| 1.6 | Wire `useTodaysWork` to real backend task API | useTodaysWork.ts + contract test | Copilot |
| 1.7 | Wire `useBudgetData` to R2 backend | useBudgetData.ts + contract test | Copilot |

**Exit Criteria**:
- Zero hardcoded user IDs in production code
- Auth context flows from shell → workbench → suite tabs
- Contract tests for each wired hook

---

### WAVE 2: RAG & GPT API COMPLETION (Mar 21–28)
**Goal**: Complete the 8 stubbed RAG API endpoints. Make TerraGPT functional.
**Tools**: Copilot (frontend), Claude Code (backend endpoints)

| # | Task | Files | Tool |
|---|------|-------|------|
| 2.1 | Define RAG API contract types (request/response) | os-platform/core/types/ | Copilot |
| 2.2 | Implement RAG dataset CRUD endpoints (backend) | Backend service + controller | Claude Code |
| 2.3 | Wire RAGDatasetManager.tsx to real endpoints (8 TODOs) | RAGDatasetManager.tsx | Copilot |
| 2.4 | Wire GPTManagementDashboard to real backend | GPTManagementDashboard.tsx | Copilot |
| 2.5 | Implement SystemGptAtlasPanel tests (18 TODOs) | SystemGptAtlasPanel.test.tsx | Copilot |
| 2.6 | CoPilot conversation persistence (Redis/DB) | CoPilotController.cs | Claude Code |

**Exit Criteria**:
- RAG CRUD operations work end-to-end
- GPT Atlas panel tests all pass
- CoPilot conversations persist across sessions

---

### WAVE 3: STANDALONE PAGE COMPLETION (Mar 28 – Apr 7)
**Goal**: Complete standalone Forge, Atlas, Dais pages beyond the Workbench tab level.
**Tools**: All three (Copilot for components, Claude Code for backend, Codex for mechanical)

**3A: Forge Standalone Pages**
| # | Task | Files | Tool |
|---|------|-------|------|
| 3A.1 | Dais ManagementDashboard — wire operational rollup (Phase 19 Tranche 13 spec exists) | ManagementDashboard.tsx | Copilot |
| 3A.2 | Regression Studio — complete from Tranche 1C foundation | RegressionStudio.tsx | Copilot |
| 3A.3 | Regression Control Panel — complete coefficients view | RegressionControlPanel.tsx | Copilot |
| 3A.4 | Segment Discovery Dashboard — wire to backend discovery service | SegmentDiscoveryDashboard.tsx | Copilot |

**3B: Atlas Standalone Pages**
| # | Task | Files | Tool |
|---|------|-------|------|
| 3B.1 | GeoEquityDashboard — complete visualization layer | GeoEquityDashboard.tsx | Copilot |
| 3B.2 | SchoolDistrictWidget — wire to real district data | SchoolDistrictWidget.tsx | Copilot |
| 3B.3 | SentimentHeatMapWidget — wire to real sentiment data | SentimentHeatMapWidget.tsx | Copilot |

**3C: Dais/Dossier Standalone Pages**
| # | Task | Files | Tool |
|---|------|-------|------|
| 3C.1 | Implement Phase 19 Tranches 2-13 UI surfaces (specs exist for each) | Multiple dais/ pages | Copilot + Claude Code |
| 3C.2 | PacketAssembly — wire to dossier backend | PacketAssembly.tsx | Copilot |

**Exit Criteria**:
- Every standalone page renders real data or properly shows "loading" → "data"
- Zero "Coming Soon" or placeholder text in production routes
- All pages pass type-check

---

### WAVE 4: BACKEND SERVICE COMPLETION (Apr 7–18)
**Goal**: Replace backend stubs with real logic. Backend-first approach.
**Tools**: Claude Code (primary for .NET), Copilot (contract definitions)

| # | Task | Files | Tool |
|---|------|-------|------|
| 4.1 | Replace AiDataStubs.cs with real EF Core data access | AiDataStubs.cs + migrations | Claude Code |
| 4.2 | AISwarmIntelligenceOrchestrator — implement 3 stub methods | AISwarmIntelligenceOrchestrator.cs | Claude Code |
| 4.3 | Security framework engines — implement or defer with clear status | AdvancedSecurityFrameworkService.cs | Claude Code |
| 4.4 | PILT agent stubs — implement document generation | 2 agent files | Claude Code |
| 4.5 | AdvancedAnalyticsEngine — implement helper methods | AdvancedAnalyticsEngine.cs | Claude Code |
| 4.6 | AIAssistantService — implement real analysis pipeline | AIAssistantService.cs | Claude Code |

**Exit Criteria**:
- Zero `TODO: Replace with real` comments in backend services
- Backend test coverage for each replaced stub
- `dotnet build` clean, `dotnet test` passing

---

### WAVE 5: INFRASTRUCTURE & QUALITY (Apr 18–28)
**Goal**: CI/CD, testing floor, deployment readiness.
**Tools**: All three

| # | Task | Files | Tool |
|---|------|-------|------|
| 5.1 | Type safety sweep — reduce `any` types by 80% | ~100 files | Codex (bulk) |
| 5.2 | Backend test expansion — AI services, security, valuation | New test files | Claude Code |
| 5.3 | Docker strategy — canonicalize to 3 Dockerfiles (dev/staging/prod) | Dockerfiles | Copilot |
| 5.4 | Deployment scripts — create or restore deploy-phase-beta.sh | scripts/ | Copilot |
| 5.5 | Phase execution tracking — connect specs to CI/CD | .github/workflows/ | Copilot |
| 5.6 | TerraLevy hooks — replace mock quantum projections/research with real data | terra-levy hooks | Copilot |

**Exit Criteria**:
- `any` types < 40 (from 200+)
- Backend test count doubles
- Deployment scripts exist and execute
- `pnpm run type-check` PASS with zero suppressions

---

## TOOL ASSIGNMENT MATRIX

| Task Type | Best Tool | Why |
|-----------|-----------|-----|
| Interactive component edits | **Copilot** | File context, preview, iterative refinement |
| Contract test writing | **Copilot** | Needs conversation context, test patterns |
| Bulk find-and-replace | **Codex** | Parallel file edits, mechanical transforms inside a bounded prompt pack |
| Console.log sweep | **Codex** | 200+ locations, mechanical, and suited to execution-mode proof loops |
| `any` type fixing | **Codex** | Repetitive, per-file, and safer when constrained to approved files plus proof commands |
| Backend .NET service impl | **Claude Code** | Large file context, autonomous work |
| Cross-file refactors | **Claude Code** | Multi-file reasoning |
| Auth context threading | **Copilot** | Needs understanding of component tree |
| RAG endpoint backend | **Claude Code** | .NET controller + service pattern |
| CI/CD workflow edits | **Copilot** | Governance rules, allowed scope |
| Type definitions | **Copilot** | os-platform/core/types/ is allowed scope |
| Research/investigation | **Claude Code** | Autonomous exploration |

For Codex task framing, see [`CODEX_DIRECTIVE_PACK_v1.md`](./CODEX_DIRECTIVE_PACK_v1.md) for the standard `Objective` → `Output` operator contract and the TerraFusion-specific recon, execution, and review prompts.

---

## DAILY CADENCE

### Week 1 (Mar 16–18): Wave 0 — Hygiene
- **Mon 3/16**: Commit pending changes, start console sweep research
- **Tue 3/17**: Create useLogger hook, begin console replacement (Claude Code)
- **Wed 3/18**: Codex available — finish console sweep, fix @ts-ignore

### Week 2 (Mar 18–21): Wave 1 — Auth Context
- **Thu 3/19**: useAuthContext hook, wire to PropertyWorkbench
- **Fri 3/20**: Wire to GPT, Research, QuantumModuleManager
- **Sat 3/21**: Wire useTodaysWork + useBudgetData to backend contracts

### Week 3 (Mar 21–28): Wave 2 — RAG & GPT
- **Mon-Wed**: RAG contract types + backend endpoints
- **Thu-Fri**: Frontend wiring (8 RAG TODOs)
- **Sat**: GPT Atlas tests, CoPilot persistence

### Week 4 (Mar 28 – Apr 4): Wave 3A — Forge + Dais Standalone
- Complete Dais ManagementDashboard (Tranche 13)
- Complete Regression Studio/ControlPanel
- Segment Discovery Dashboard

### Week 5 (Apr 4–11): Wave 3B/C — Atlas + Dossier Standalone
- GeoEquity, SchoolDistrict, SentimentHeatMap
- Phase 19 Tranche UI surfaces
- PacketAssembly

### Week 6 (Apr 11–18): Wave 4 — Backend Stubs
- AiDataStubs → real EF Core
- Orchestrator stubs → real logic
- PILT agents, analytics, AI assistant

### Week 7 (Apr 18–25): Wave 5 — Quality & Infrastructure
- Type safety sweep (Codex bulk)
- Backend test expansion
- Docker canonicalization
- Deployment scripts

### Week 8 (Apr 25–28): Stabilization
- Full regression test pass
- Screenshot round (8 gates)
- Evidence collection for all waves

---

## RISK REGISTER

| Risk | Mitigation |
|------|-----------|
| Codex tokens run out again | Shift mechanical work to Claude Code; queue for next token reset |
| Backend .NET changes break build | Run `dotnet build` after every change; don't touch files outside allowed scope |
| Console sweep introduces regressions | Gate behind `import.meta.env.DEV` rather than delete; run full test suite |
| Auth context breaks existing surfaces | Feature-flag with `useAuthContext ?? fallbackMock` until wiring complete |
| Phase 19 specs don't map to UI | Specs define contracts first; UI implements against contracts (already proven pattern) |
| Copilot context limits | Use session memory for cross-conversation state; save wave progress |

---

## GOVERNANCE COMPLIANCE

All work MUST pass before merge:
```bash
pnpm run type-check                                    # Core boundary
node --test os-platform/core/tests/phase83-tools.test.mjs  # Tool contracts
```

All new types go to: `os-platform/core/types/`
All new tools go to: `tools/registry/`
No modifications to: `**/ARCHIVE/**`, `specialized/**`, `applications/**`, `os-platform/ai-systems/ai-systems/ai-swarm/**`

---

## VERIFICATION COMMANDS (Run After Each Wave)

```bash
# Wave 0 exit
git grep -c "console\." frontend/apps/os-shell/src/ | wc -l  # Target: < 50
git grep "@ts-ignore" frontend/apps/os-shell/src/              # Target: 0

# Wave 1 exit
git grep "hardcoded\|phd-researcher\|TODO.*auth\|TODO.*user ID" frontend/apps/os-shell/src/  # Target: 0

# Wave 2 exit
git grep "TODO.*API\|TODO.*endpoint\|TODO.*Implement" frontend/apps/os-shell/src/components/gpt/  # Target: 0

# Wave 3 exit
# Navigate all routes in dev — no "Coming Soon" / placeholder text

# Wave 4 exit
git grep "TODO.*Replace\|stub\|TEMPORARY" backend/src/  # Target: 0
dotnet test

# Wave 5 exit
git grep ": any" frontend/apps/os-shell/src/ | wc -l  # Target: < 40
pnpm run type-check  # PASS
```

---

## WHAT'S ALREADY DONE WELL (Don't Touch)

- Shell/Launcher/Desktop — 95% complete (157+ tests)
- Policy Engine — Full export/import, DI seams (64+ tests)
- TerraTrace — Jump actions, audit trail, history mode
- Compositor — Stable, no jitter
- MWUX Workbench Tabs — All 9 tabs (Summary, Forge, Atlas, Dais, Clerk, Treasury, Audit, Dossier, Pilot) have real governed tool surfaces
- Module Registry — Metadata, lazy loading
- Configuration — Clean appsettings
- Database Schema — 20+ DbSets, EF Core migrations
- Governance Workflow — progress.md tracking, evidence collection
- Vitest suite — 4911/4911 (100%) as of Phase 17.5C
