# EXECUTION_BOARD_WAVE0_WAVE2

## Purpose
This board governs the **next unblocked phases through Wave 2**. It is an execution artifact, not a brainstorming note. Use it to track ownership, scope boundaries, exit criteria, proof commands, evidence, and daily operator progress.

## Scope Lock
- [x] Scope is limited to the **next unblocked phases through Wave 2**.
- [x] The **Muse-first pilot slice remains sealed on committed code only**.
- [x] No staged-cache proof may be claimed unless a lawful non-empty staged slice exists.
- [x] Property Workbench real-host truth is an OS-owned boundary; suite domain content remains separate.
- [x] Waves 3-5 remain blocked until this board reaches the entry-gate review.

## Operating Rules
- [ ] Do not reopen the Muse-only implementation lane.
- [ ] Do not claim broader suite truth from narrow targeted proofs.
- [ ] Do not allow opportunistic refactors during root-cause phases.
- [ ] Do not introduce fake replacement surfaces to make tests pass.
- [ ] Do not open later waves until the entry-gate review explicitly allows it.

## Role Ownership Model

### Copilot
Owns repo recon, workflow/doc reconciliation, frontend host wiring, Workbench routing, tab-shell behavior, targeted Vitest proof loops, and evidence capture for UI truth.

### Claude Code
Owns backend truth, controller/service verification, contract validation, API reachability, data-path classification, and any backend implementation lane explicitly opened by proof.

### Codex
Owns bounded audits, mechanical scans, doc drift checks, inventory passes, proof packaging, and handoff packs. Codex is **not** the decider and does **not** own architecture or scope changes.

---

# Board Status

## Global Proof Floor
Run these at every phase boundary:

```bash
pnpm run type-check
node --test os-platform/core/tests/phase83-tools.test.mjs
```

Run these whenever backend or cross-stack truth is touched:

```bash
dotnet build TerraFusion.sln --configuration Release
dotnet test TerraFusion.sln
```

## Current Posture
- [x] Muse-first seal is **committed-code proof only**.
- [x] No lawful staged/cache proof exists right now.
- [x] Phase 2 is closed via bounded real-host harness stabilization.
- [x] Wave 0 inventory/debt ledger is explicitly closed.
- [x] Wave 1 auth/context threading is the single immediate next implementation lane.
- [x] Planning scope is locked through Wave 2 only.

## Immediate Next-Lane Rule
- If Wave 0 inventory/debt ledger is not explicitly closed, do Wave 0 next.
- If Wave 0 is already explicitly closed, proceed to Wave 1 auth/context threading.
- Current repo state: `WAVE0_DEBT_LEDGER_v1.md` is published, so Wave 1 auth/context threading is next.

---

# Phase 1 — Workflow Truth Reconciliation

**Primary owner:** Copilot  
**Secondary owner:** Codex  
**Claude Code involvement:** only if backend workflow docs are directly implicated

## Status
Closed.

## Goal
Make the workflow canon match the actual repo and proof posture before any new execution starts.

## Inputs
- `.governance/workflow/plan.md`
- `.governance/workflow/progress.md`
- `.governance/workflow/REMEDIATION_PLAN_v1.md`
- `.github/AGENT_ENTRYPOINT.md`
- session save-state for Muse-only committed-code seal
- current Phase 2 closure note

## Deliverables
- [x] Reconciled `plan.md`
- [x] Reconciled `progress.md`
- [x] Updated `REMEDIATION_PLAN_v1.md` or an explicit stale/superseded note
- [x] Proof-posture note stating:
  - [x] Muse-first = committed-code proof only
  - [x] No staged-cache proof exists
  - [x] Phase 2 is closed via bounded real-host harness stabilization

## Exit Criteria
- [x] Workflow docs agree on sequence
- [x] No doc still implies stale R3/vector ordering for this lane
- [x] Proof boundary is stated once, clearly, and matches session memory
- [x] Blocked later waves are explicitly marked blocked

## Proof Commands
```bash
pnpm run type-check
node --test os-platform/core/tests/phase83-tools.test.mjs
git diff -- .governance/workflow .github/AGENT_ENTRYPOINT.md
```

## Evidence
- [x] Diff captured
- [x] Commands recorded
- [x] Canon alignment note attached

## Blockers / Notes
- [ ] None

---

# Phase 2 — Real-Host Closure Record

**Primary owner:** Copilot  
**Secondary owner:** Codex  
**Claude Code involvement:** only if root cause crosses backend/API boundary

## Status
Closed.

## Closure Basis
bounded real-host harness stabilization

## Scope
Property Workbench real-host truth restoration only

## Explicit Non-Scope
- Atlas product rewrite
- suite-home rebuild
- broad frontend reclassification
- Dais/Forge/Dossier feature expansion

## Goal
Record the bounded Phase 2 closure without allowing it to drift back into product-work language.

## Allowed Outcomes
- [ ] A. Harness/provider gap
- [ ] B. Lazy import/export resolution defect
- [ ] C. Real host regression in `PropertyAtlas.tsx` / Workbench integration

## Inputs
- `frontend/apps/os-shell/src/__tests__/workbench/workbenchRealHosting.gate.test.tsx`
- `frontend/apps/os-shell/src/pages/workbench/PropertyWorkbench.tsx`
- `frontend/apps/os-shell/src/pages/workbench/PropertyWorkbenchWindow.tsx`
- `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyAtlas.tsx`
- `frontend/apps/os-shell/src/context/workbenchTabContext.tsx`
- router/module registry files

## Deliverables
- [x] Root-cause classification note
- [x] Bounded fix plan if not trivially repairable in place
- [x] No unrelated cleanup in diff

## Exit Criteria
- [x] Failure was reproduced
- [x] Failure was classified as A, B, or C
- [x] Evidence captured the lazy-host failure path without reopening suite product scope
- [x] Scope of repair is bounded to the actual cause
- [x] Muse lane remains explicitly closed and untouched

## Exit Evidence
- `workbenchRealHosting.gate.test.tsx` passes `15/15`
- the harness no longer masks the real-host failure
- all probe code is removed
- workflow artifacts use the same closure wording

## Proof Commands
```bash
pnpm run type-check
node --test os-platform/core/tests/phase83-tools.test.mjs
pnpm exec vitest run \
  frontend/apps/os-shell/src/__tests__/workbench/workbenchRealHosting.gate.test.tsx \
  frontend/apps/os-shell/src/__tests__/workbench/PropertyAtlas.test.tsx \
  frontend/apps/os-shell/src/__tests__/workflows/contextPreservation.contract.test.tsx
```

## Evidence
- [ ] Repro log captured
- [ ] Classification note attached
- [ ] Diff bounded to actual cause

## Blockers / Notes
- [ ] None

---

# Phase 3 — Forge Rehost Lane F1: Comparable Sales

**Primary owner:** Copilot  
**Secondary owner:** Claude Code  
**Codex involvement:** evidence packaging and bounded audit only

## Goal
Close the first live Forge rehost item as a real Workbench-hosted parcel-bound surface.

## Inputs
- `ComparableSalesPanel.tsx`
- `comparableSalesService.ts`
- `PropertyForge.tsx`
- relevant suite/workbench routing files
- relevant backend endpoints/services used by comparable sales

## Deliverables
- [ ] Comparable Sales host path wired through Workbench
- [ ] Parcel context preserved
- [ ] Benton/current parcel filtering proven
- [ ] Backend contract classified as real / blocked / partial

## Exit Criteria
- [ ] Renders inside Forge/Workbench host
- [ ] Route handoff preserves parcel/workbench context
- [ ] No fake replacement surface introduced
- [ ] Service reachability is proven or bounded with evidence
- [ ] Any blocker is explicit and minimal

## Proof Commands
```bash
pnpm run type-check
node --test os-platform/core/tests/phase83-tools.test.mjs
pnpm exec vitest run \
  frontend/apps/os-shell/src/__tests__/workflows/contextPreservation.contract.test.tsx \
  frontend/apps/os-shell/src/__tests__/auth/w5eUIContractProof.contract.test.ts
dotnet build TerraFusion.sln --configuration Release
dotnet test TerraFusion.sln
```

## Phase-Specific Proof Requirement
- [ ] Add or run a targeted Comparable Sales host proof in the os-shell suite
- [ ] Add or run a targeted backend/service proof if comparable sales API is not already covered

## Evidence
- [ ] Host proof attached
- [ ] Backend truth note attached
- [ ] Workbench routing evidence attached

## Blockers / Notes
- [ ] None

---

# Phase 4 — Forge Rehost Lane F2: Income Valuation

**Primary owner:** Claude Code  
**Secondary owner:** Copilot  
**Codex involvement:** evidence packaging and bounded audit only

## Goal
Close Income Valuation as the second rehost proof lane, with truthful calculation and retrieval behavior.

## Inputs
- `IncomeApproach.tsx`
- `IncomeValuationPanel.tsx`
- `incomeValuationService.ts`
- `PropertyForge.tsx`
- `CostForgeController.cs`
- persistence/service layer used by income valuation

## Deliverables
- [ ] Income Valuation renders in host
- [ ] Calculation path is truthful
- [ ] Persistence/retrieval path is truthful
- [ ] UI and backend contracts align

## Exit Criteria
- [ ] Host renders correctly in Workbench/Forge
- [ ] Calculation path does not rely on hidden stub behavior
- [ ] Persistence/retrieval is proven or explicitly blocked
- [ ] Parcel-bound context is preserved
- [ ] No scope bleed into unrelated Forge surfaces

## Proof Commands
```bash
pnpm run type-check
node --test os-platform/core/tests/phase83-tools.test.mjs
dotnet build TerraFusion.sln --configuration Release
dotnet test TerraFusion.sln
pnpm exec vitest run \
  frontend/apps/os-shell/src/__tests__/workflows/contextPreservation.contract.test.tsx
```

## Phase-Specific Proof Requirement
- [ ] Add or run a targeted Income Valuation host proof
- [ ] Add or run a targeted backend/service proof for calculation + retrieval

## Evidence
- [ ] Host proof attached
- [ ] Calculation/retrieval proof attached
- [ ] Contract alignment note attached

## Blockers / Notes
- [ ] None

---

# Phase 5 — Wave 0 Hygiene Recalibration

**Primary owner:** Codex  
**Secondary owner:** Copilot  
**Claude Code involvement:** only for backend inventory slices explicitly assigned

## Goal
Inventory debt honestly before any mechanical cleanup.

## Status
Closed as an inventory-only lane. `WAVE0_DEBT_LEDGER_v1.md` is the explicit closure artifact.

## Scope
- [ ] Governed production code only
- [ ] Categorize debt before editing
- [ ] No mass cleanup by default

## Debt Buckets
- [ ] Production code fix now
- [ ] Test-only
- [ ] Compat/generated
- [ ] Archived/deferred
- [ ] Blocked by later wave

## Deliverables
- [x] Debt ledger
- [x] Governed counts snapshot
- [x] Recommended cleanup queue with priorities
- [x] Explicit do-now / do-later / do-not-touch boundaries

## Exit Criteria
- [x] No blind cleanup landed
- [x] `any` usage and similar debt are categorized
- [x] Repo counts are refreshed from current truth
- [x] Cleanup candidates are bounded and phase-linked

## Proof Commands
```bash
pnpm run type-check
node --test os-platform/core/tests/phase83-tools.test.mjs
git grep -n "\bany\b" -- frontend/apps/os-shell os-platform/core backend || true
git diff --stat
```

## Evidence
- [x] Debt ledger attached
- [x] Counts snapshot attached
- [x] Cleanup queue attached

## Blockers / Notes
- [ ] None

---

# Phase 6 — Wave 1 Auth Context and Core Wiring

**Primary owner:** Copilot  
**Secondary owner:** Claude Code  
**Codex involvement:** audit only

## Goal
Thread real session/role/auth context through the named surfaces and remove placeholder posture.

## Status
Current immediate next lane.

## Named Surfaces
- [ ] `useAuthContext.ts`
- [ ] `PropertyWorkbench.tsx`
- [ ] `GPTManagementDashboard.tsx`
- [ ] `ResearchPortal.tsx`
- [ ] `QuantumModuleManager.ts`
- [ ] `useTodaysWork.ts`
- [ ] `useBudgetData.ts`

## Deliverables
- [ ] Real auth/session/role flow on each named surface
- [ ] No hardcoded user/role placeholders on governed paths
- [ ] Explicit mapping of which surfaces consume which context fields

## Exit Criteria
- [ ] Session/role propagates end to end on each named surface
- [ ] Role-gated Workbench behavior remains intact
- [ ] No new fake fallback posture
- [ ] Contracts/tests cover the propagation path

## Proof Commands
```bash
pnpm run type-check
node --test os-platform/core/tests/phase83-tools.test.mjs
pnpm exec vitest run \
  frontend/apps/os-shell/src/__tests__/workflows/contextPreservation.contract.test.tsx \
  frontend/apps/os-shell/src/__tests__/auth/w5eUIContractProof.contract.test.ts
dotnet build TerraFusion.sln --configuration Release
```

## Phase-Specific Proof Requirement
- [ ] Add or run targeted auth/context tests for all changed surfaces

## Evidence
- [ ] Context flow map attached
- [ ] Targeted proof results attached
- [ ] Placeholder removal diff reviewed

## Blockers / Notes
- [ ] None

---

# Phase 7 — Wave 2 Backend Truth Inventory

**Primary owner:** Claude Code  
**Secondary owner:** Codex  
**Copilot involvement:** consult only

## Goal
Document what backend GPT/RAG surfaces are real before any frontend wiring expands.

## Initial Targets
- [ ] `RAGController.cs`
- [ ] `CoPilotController.cs`
- [ ] Directly called service classes and persistence paths behind them

## Deliverables
- [ ] Backend truth matrix: real / stubbed / partial / missing
- [ ] Safe frontend contract sheet
- [ ] Explicit do-not-wire-yet list

## Exit Criteria
- [ ] Frontend can point to a written backend truth source of truth
- [ ] Every inspected endpoint is classified
- [ ] Response shapes and failure modes are documented
- [ ] Missing implementation is bounded, not hand-waved

## Proof Commands
```bash
dotnet build TerraFusion.sln --configuration Release
dotnet test TerraFusion.sln
pnpm run type-check
node --test os-platform/core/tests/phase83-tools.test.mjs
```

## Phase-Specific Proof Requirement
- [ ] Add or run targeted backend tests where contract truth is disputed or missing

## Evidence
- [ ] Backend truth matrix attached
- [ ] Frontend-safe contract note attached
- [ ] Missing/partial list attached

## Blockers / Notes
- [ ] None

---

# Phase 8 — Wave 2 Frontend GPT/RAG Wiring

**Primary owner:** Copilot  
**Secondary owner:** Claude Code  
**Codex involvement:** bounded audit only

## Goal
Wire frontend GPT/RAG surfaces only to confirmed backend truth.

## Targets
- [ ] `RAGDatasetManager.tsx`
- [ ] `GPTManagementDashboard.tsx`
- [ ] `SystemGptAtlasPanel.tsx`

## Deliverables
- [ ] Frontend wiring aligned to confirmed backend contracts
- [ ] TODO-backed gaps either closed or explicitly blocked
- [ ] No fake success state for unavailable backend capabilities

## Exit Criteria
- [ ] All touched surfaces call only confirmed contracts
- [ ] TODO-backed proof gaps are reduced with evidence
- [ ] Unavailable features render honestly
- [ ] Atlas/GPT panel behavior does not reintroduce host truth drift

## Proof Commands
```bash
pnpm run type-check
node --test os-platform/core/tests/phase83-tools.test.mjs
pnpm exec vitest run \
  frontend/apps/os-shell/src/__tests__/ui-observability/GovernanceRailAndConsole.test.tsx \
  frontend/apps/os-shell/src/__tests__/workbench/PropertyAtlas.test.tsx
dotnet build TerraFusion.sln --configuration Release
dotnet test TerraFusion.sln
```

## Phase-Specific Proof Requirement
- [ ] Add or run targeted tests for each newly wired GPT/RAG surface

## Evidence
- [ ] Wiring diff attached
- [ ] TODO-gap disposition attached
- [ ] Honest-unavailable-state proof attached

## Blockers / Notes
- [ ] None

---

# Phase 9 — Entry Gate Review Before Waves 3-5

**Primary owner:** Codex  
**Secondary input:** Copilot + Claude Code jointly

## Goal
Stop and decide whether later waves may open.

## Required Green Conditions
- [ ] Workflow canon matches reality
- [ ] Atlas real-host issue is resolved or bounded with explicit proof
- [ ] F1 Comparable Sales proof is closed or bounded honestly
- [ ] F2 Income Valuation proof is closed or bounded honestly
- [ ] Wave 0 debt ledger exists
- [ ] Wave 1 auth/context threading is proven
- [ ] Wave 2 backend truth exists before Wave 2 frontend expansion claims are made

## Deliverables
- [ ] Go / no-go review note
- [ ] List of waves still blocked
- [ ] Recommended next lane if go
- [ ] Bounded blocker list if no-go

## Exit Criteria
- [ ] No ambiguous posture remains
- [ ] Later-wave opening is evidence-based, not optimism-based

## Proof Commands
```bash
pnpm run type-check
node --test os-platform/core/tests/phase83-tools.test.mjs
dotnet build TerraFusion.sln --configuration Release
dotnet test TerraFusion.sln
git diff --stat
```

## Evidence
- [ ] Review note attached
- [ ] Go/no-go decision recorded
- [ ] Blocked-wave list updated

## Blockers / Notes
- [ ] None

---

# Ownership Matrix

| Phase | Copilot | Claude Code | Codex |
|---|---|---|---|
| 1. Workflow truth reconciliation | Lead | Consult | Audit/support |
| 2. Atlas root-cause classification | Lead | Consult if backend implicated | Audit |
| 3. Forge F1 Comparable Sales | Lead UI | Lead backend if needed | Evidence/audit |
| 4. Forge F2 Income Valuation | Support UI | Lead | Evidence/audit |
| 5. Wave 0 hygiene recalibration | Support | Consult | Lead |
| 6. Wave 1 auth/context wiring | Lead | Support if backend auth implicated | Audit |
| 7. Wave 2 backend truth inventory | Consult | Lead | Support/package |
| 8. Wave 2 frontend GPT/RAG wiring | Lead | Support/verify | Audit |
| 9. Entry gate review | Joint input | Joint input | Lead |

---

# Daily Operator Log

Use one entry per working session.

## Operator Session Template

**Date:** YYYY-MM-DD  
**Operator:** Copilot / Claude Code / Codex / Human  
**Phase:** Phase X — Name  
**Branch / Commit:**  
**Scope for this session:**  
**Out-of-scope guardrails:**  

### Planned Actions
- [ ] Action 1
- [ ] Action 2
- [ ] Action 3

### Files Touched
- [ ] `path/to/file`
- [ ] `path/to/file`
- [ ] `path/to/file`

### Commands Run
```bash
# paste exact commands here
```

### Results
- [ ] Type-check result recorded
- [ ] Targeted proofs recorded
- [ ] Backend proof recorded if applicable
- [ ] Evidence artifact saved

### Evidence Summary
- Proofs passed:
- Proofs failed:
- New blocker(s):
- Blocker classification:
- Diff shape:

### Exit Check
- [ ] Stayed inside assigned phase
- [ ] Did not expand scope
- [ ] Did not reopen sealed Muse lane
- [ ] Did not claim proof beyond executed commands
- [ ] Next step is evidence-backed

### Next Exact Move
- [ ] Describe the single next exact move

### Handoff Note
Paste a concise, evidence-only handoff for the next operator.

---

# Quick Handoff Prompts

## Copilot Handoff Prompt
> Execute only the assigned phase. Stay inside touched files. Preserve the committed-code Muse seal. Run the listed proof commands and report only evidence-backed conclusions.

## Claude Code Handoff Prompt
> Execute only the backend portion of the assigned phase. Classify contract truth before implementing. Do not infer frontend-safe behavior without proof. Return explicit blockers if the contract is partial or missing.

## Codex Handoff Prompt
> Perform bounded audit, drift scan, and evidence packaging only. Do not expand scope, alter roadmap order, or make architectural decisions. Report mismatches, debt buckets, and proof completeness.

---

# Final Gate Reminder
- [ ] Do not open Waves 3-5 until Phase 9 explicitly says go.
- [ ] Do not confuse committed-code proof with staged-cache proof.
- [ ] Do not let Atlas host truth drift back into vague language.
- [ ] Do not let Wave 0 become an excuse for mass cleanup.