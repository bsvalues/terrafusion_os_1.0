# TerraFusion OS - Full UI/UX Implementation Plan
## Zone B Restart | February 2026 | Observability-First Architecture

---

## 🎯 EXECUTIVE SUMMARY

**Objective**: Resume UI/UX development in Zone B with **vertical slice methodology**, **observability-first error UX**, and **correlationId-driven debugging workflows**.

**Constraints**:
- ✅ Zone B: Open for shipping (7 green gates + proof layer)
- 🔒 Zone A: Frozen until 2026-02-21 (Wave 1 intake ops)
- ✅ No Zone A drift (freeze guard enforced)
- ✅ Contracts stable + versioned

**Key Result**: Ship **correlationId-first error UX** across all major workflows, enabling **<5-minute failure debugging** for operators.

---

## 📐 ARCHITECTURE CONTEXT

### **Current State (Post-Orientation Audit)**

| Layer | Status | Location | Notes |
|-------|--------|----------|-------|
| **UI Shell** | ✅ Mature | [frontend/apps/os-shell/src](frontend/apps/os-shell/src) | Desktop Shell, routing, 725 tests passing |
| **Backend Runtime** | ✅ Production | [os-platform/core](os-platform/core) | ToolRunner, TraceService, correlationId support |
| **Trace Store** | ✅ Operational | [os-platform/core/trace](os-platform/core/trace) | Event-sourced, correlationId-indexed |
| **API Integration** | ⚠️ **Partial** | [frontend/apps/os-shell/src/api](frontend/apps/os-shell/src/api) | **Gap**: correlationId display contract incomplete |

**Gap Analysis**:
- ✅ Tool execution mechanics: working
- ✅ Trace emission: working
- ❌ **UI exposure of correlationId**: missing
- ❌ **Trace query ergonomics**: not wired to UI

**Opportunity**: Excellent trace infrastructure exists but lacks UI visibility. Operators cannot currently:
1. See correlationId when operations fail
2. Copy correlationId to query traces
3. Understand error context without diving into logs

---

## 🗂️ DOCUMENTATION HIERARCHY

This plan is composed of 3 documents:

1. **UI_CONTRACT.md** ([UI_CONTRACT.md](UI_CONTRACT.md))
   - **Purpose**: Frozen interface between UI ↔ backend
   - **Scope**: API request/response formats, error codes, trace query endpoints
   - **Audience**: All developers (frontend + backend)

2. **UI_BACKLOG.md** ([UI_BACKLOG.md](UI_BACKLOG.md))
   - **Purpose**: Prioritized, time-boxed implementation tasks (7–10 days)
   - **Scope**: 4 phases, P0/P1 tasks, test strategy, TODO capture
   - **Audience**: Implementation team

3. **This Document (UI_IMPLEMENTATION_PLAN.md)**
   - **Purpose**: Holistic plan, execution logic, kickoff sequence
   - **Scope**: Cross-cutting concerns, governance, success criteria
   - **Audience**: Project leads, architects, stakeholders

---

## ✅ SUCCESS CRITERIA (From User Request)

### **1. UI/UX Restart is Immediate**
- ✅ Work begins in Zone B (no Wave 1 dependencies)
- ✅ Progress via **vertical slices** (route → UI → API → trace → tests)
- ✅ Each slice is independently shippable

### **2. No Zone A Drift**
- ✅ Freeze guard continues to hard-block intake lane changes
- ✅ CI enforcement: any Wave 1 file modification → build fails
- ✅ Zone split validated on every PR

### **3. Contracts are Stable**
- ✅ [UI_CONTRACT.md](UI_CONTRACT.md) versioned (v1.0)
- ✅ Interface is **backward-compatible**
- ✅ Deprecation process documented

### **4. Observability-First UX**
- ✅ **correlationId visible/copyable** from all failure surfaces
- ✅ `pnpm run trace:query` workflow integrated into dev UX
- ✅ Error codes → user-safe messages

### **5. Regression Immunity**
- ✅ Existing 7 suites remain green on every PR:
  - `type-check`
  - `phase83-tools`
  - `doctor`
  - `error-trace-ergonomics`
  - `wave1-intake-invariants`
  - `wave1-trace`
  - `freeze-guard`
- ✅ New `ui-observability` suite added without slowing fast path

### **6. Deployment-Ready**
- ✅ Same gates apply to UI PRs
- ✅ Health checks include UI reachability
- ✅ Trace ergonomics ship with UI changes

---

## 📋 PHASED IMPLEMENTATION PLAN

### **Phase 1: UI Shell + Navigation + Guardrails** (Days 1–2)

**Goal**: Establish the **correlationId display contract** in error boundaries.

**Deliverables**:
1. **Enhanced Error Boundary** ([frontend/apps/os-shell/src/contexts/ErrorContext.tsx](frontend/apps/os-shell/src/contexts/ErrorContext.tsx))
   - Add correlationId to error state
   - Render "Copy correlationId" button
   - Show trace query hint (dev-only)
   
2. **Error UI Component Library** (`frontend/apps/os-shell/src/components/errors/`)
   - `<ErrorDisplay />`: correlationId block + user-safe message
   - `<CorrelationIdBadge />`: reusable widget
   - `<TraceQueryHint />`: dev-mode hint

3. **API Client Hardening** ([frontend/apps/os-shell/src/api/pilotApi.ts](frontend/apps/os-shell/src/api/pilotApi.ts))
   - Ensure `catch` blocks extract correlationId
   - Add retry logic with correlationId tracking

**Tests**:
- Component tests for error UI
- E2E: Trigger error → verify correlationId displayed + copyable

**Done When**: App shell navigable + error boundary shows correlationId on any failure

**Estimate**: 14 hours (1.75 days)

---

### **Phase 2: First End-to-End Workflow Slice** (Days 3–5)

**Goal**: Wire **ONE** complete tool execution → result/error → correlationId flow.

**Workflow**: Tool Listing (`/pilot`) → View Tool → Invoke → Result/Error

**Deliverables**:
1. **Tool Invocation Component** (`frontend/apps/os-shell/src/components/pilot/ToolInvoker.tsx`)
   - Dynamic form for tool arguments
   - Loading state with cancel button
   - Success state with result display
   - Error state with `<ErrorDisplay />`

2. **Tool Execution Error Flow**
   - Test: Invoke tool with missing confirmation → `CONFIRMATION_REQUIRED` error
   - Verify: correlationId displayed, copyable, trace query hint shown

3. **Trace Query Integration** (`frontend/apps/os-shell/src/hooks/useTraceQuery.ts`)
   - Call `/api/pilot/trace/:correlationId`
   - Render event chain
   - Add "View Trace" button to error display

**Tests**:
- E2E: Invoke tool → success → result displayed
- E2E: Invoke tool → error → correlationId displayed → copy → query trace CLI

**Done When**: ONE workflow is production-grade in behavior (not visuals)

**Estimate**: 19 hours (2.4 days)

---

### **Phase 3: Failure/Edge States + UX Polish** (Days 6–7)

**Goal**: Make failures **debuggable in under 5 minutes** without guessing.

**Deliverables**:
1. **Empty State Components** (`frontend/apps/os-shell/src/components/empty-states/`)
   - No tools available
   - No results
   - No trace events

2. **Validation Surfaces**
   - Client-side validation for tool arguments
   - Inline errors before submission

3. **Retry Logic + Circuit Breaker** ([pilotApi.ts](frontend/apps/os-shell/src/api/pilotApi.ts))
   - Exponential backoff
   - Circuit breaker pattern
   - correlationId persisted across retries

4. **Accessibility Pass**
   - WCAG 2.1 AA compliance
   - `@axe-core/playwright` + `jest-axe`

5. **UX Instrumentation**
   - Emit client-side traces for button clicks, form submissions, errors displayed

**Tests**:
- Component tests for empty states
- E2E: Retry flow with correlationId tracking
- Accessibility audit

**Done When**: Failures are debuggable with clear UX/trace → no guessing

**Estimate**: 16 hours (2 days)

---

### **Phase 4: Expand to Remaining Screens** (Days 8–10)

**Goal**: Repeat slice pattern for additional workflows.

**Scope**:
1. **Tool Discovery UI** (`/pilot/tools`)
   - Search, filter, tool cards with risk badges

2. **Governance Dashboard** (`/pilot/dashboard`)
   - Tool usage metrics
   - Recent errors (correlationId links)

3. **Trace History View** (`/pilot/traces`)
   - Table of recent traces
   - correlationId search

4. **Additional Workflows** (Post-MVP)
   - GPT Studio (`/gpt-studio`)
   - System Diagnostics (`/monitoring`)

**Pattern**: Reuse `<ToolInvoker />` + `<ErrorDisplay />` components

**Tests**:
- E2E for each new workflow
- Regression suite remains green

**Done When**: All major workflows have observability-first error UX

**Estimate**: 19 hours (2.4 days)

---

## 📊 TOTAL EFFORT ESTIMATE

| Phase | Estimate | Deliverables |
|-------|----------|--------------|
| **Phase 1** | 14 hours (1.75 days) | Error boundary + correlationId UX |
| **Phase 2** | 19 hours (2.4 days) | First workflow slice |
| **Phase 3** | 16 hours (2 days) | Failure states + UX polish |
| **Phase 4** | 19 hours (2.4 days) | Remaining workflows |
| **Total** | **68 hours (8.5 days)** | Full UI/UX coverage |

**Buffer**: +1.5 days (12 hours) for unknowns → **Total: 10 days**

---

## 🚀 KICKOFF SEQUENCE (Execution Logic)

### **Day 0: Orientation & Alignment**

1. **Read Governance Docs**
   - [AGENTS.md](AGENTS.md): § Debugging Workflows, § TOOL GOVERNANCE RULES
   - [.github/copilot-instructions.md](.github/copilot-instructions.md): § PORT RULES, § FRONTEND PATHS
   - [UI_CONTRACT.md](UI_CONTRACT.md): Full interface spec

2. **Verify Zone B Readiness**
   ```bash
   pnpm run type-check      # ✅ Should pass
   pnpm run doctor          # ✅ Should pass
   node --test os-platform/core/tests/phase83-tools.test.mjs  # ✅ Should pass
   ```

3. **Confirm Freeze Guard Active**
   ```bash
   # Attempt to modify a Zone A file (should fail)
   echo "test" >> submissions/templates/wave1-template.md
   git add submissions/templates/wave1-template.md
   git commit -m "test: verify freeze guard"
   # Expected: CI fails with "Zone A modification detected"
   git reset HEAD~1  # Undo test commit
   ```

4. **Create Feature Branch**
   ```bash
   git checkout -b ui/phase1-error-boundary
   ```

---

### **Day 1–2: Phase 1 Implementation**

**Workflow**:
1. **Write Tests First**
   ```bash
   # Create test file
   touch frontend/apps/os-shell/src/__tests__/ui-observability/error-display.test.tsx
   ```

   ```tsx
   // frontend/apps/os-shell/src/__tests__/ui-observability/error-display.test.tsx
   import { render, screen, fireEvent } from '@testing-library/react';
   import { ErrorDisplay } from '@/components/errors/ErrorDisplay';

   describe('ErrorDisplay', () => {
     const mockError = {
       correlationId: 'corr-12345',
       status: 'error' as const,
       error: {
         code: 'CONFIRMATION_REQUIRED',
         message: 'This action requires confirmation'
       },
       executionTime: 150,
       timestamp: '2026-02-04T10:00:00Z'
     };

     it('displays correlationId', () => {
       render(<ErrorDisplay error={mockError} />);
       expect(screen.getByText('corr-12345')).toBeInTheDocument();
     });

     it('has copyable correlationId button', () => {
       render(<ErrorDisplay error={mockError} />);
       const copyButton = screen.getByRole('button', { name: /copy/i });
       fireEvent.click(copyButton);
       // Verify clipboard API called
     });

     it('shows user-safe error message', () => {
       render(<ErrorDisplay error={mockError} />);
       expect(screen.getByText(/requires confirmation/i)).toBeInTheDocument();
     });

     it('shows trace query hint in dev mode', () => {
       process.env.NODE_ENV = 'development';
       render(<ErrorDisplay error={mockError} />);
       expect(screen.getByText(/pnpm run trace:query/i)).toBeInTheDocument();
     });
   });
   ```

2. **Implement Components**
   - Create `<ErrorDisplay />`, `<CorrelationIdBadge />`, `<TraceQueryHint />`
   - Enhance [ErrorContext.tsx](frontend/apps/os-shell/src/contexts/ErrorContext.tsx)

3. **Run Tests**
   ```bash
   pnpm test frontend/apps/os-shell/src/__tests__/ui-observability/
   ```

4. **Manual Verification**
   - Start dev server: `pnpm run dev:os:shell`
   - Open browser: `http://localhost:${TF_FRONTEND_PORT:-3102}`
   - Trigger error → verify correlationId displayed + copyable

5. **Commit**
   ```bash
   git add .
   git commit -m "feat(ui): global error boundary with correlationId display

   Evidence:
   - Tests: ErrorDisplay component tests passing (5/5)
   - Gates: type-check + phase83-tools green
   - UI: correlationId visible + copyable on all errors

   Government: FISMA compliance  
   AI-Collaboration: GitHub_Copilot"
   ```

6. **PR + Merge**
   - Create PR
   - Wait for CI (all 7 gates + new UI suite)
   - Merge when green

---

### **Day 3–5: Phase 2 Implementation**

**Workflow**: Same pattern as Phase 1

1. **Choose Workflow** (e.g., Tool Invocation)
2. **Write E2E Test**
   ```bash
   touch frontend/apps/os-shell/src/__tests__/e2e/tool-invocation.test.ts
   ```

3. **Implement `<ToolInvoker />`**
4. **Wire to Backend API**
5. **Test Success/Error Flows**
6. **Commit + PR**

---

### **Day 6–7: Phase 3 Implementation**

**Workflow**: Same pattern

1. **Empty States**
2. **Validation Surfaces**
3. **Retry Logic**
4. **Accessibility Audit**
5. **Commit + PR**

---

### **Day 8–10: Phase 4 Implementation**

**Workflow**: Repeat slice pattern for remaining workflows

1. **Tool Discovery UI**
2. **Governance Dashboard**
3. **Trace History View**
4. **Commit + PR for each workflow**

---

## 🧪 TEST STRATEGY (Comprehensive)

### **New Test Suite: `ui-observability`**

**Location**: `frontend/apps/os-shell/src/__tests__/ui-observability/`

**Coverage**:
1. **Component Tests**
   - `error-display.test.tsx`: All error codes + correlationId UI
   - `correlation-id-badge.test.tsx`: Copy functionality
   - `tool-invoker.test.tsx`: Loading/success/error states

2. **E2E Tests**
   - `tool-execution-success.test.ts`: Invoke tool → success → result displayed
   - `tool-execution-error.test.ts`: Invoke tool → error → correlationId displayed → copy → query trace
   - `tool-cancel.test.ts`: Cancel tool execution → correlationId shown

3. **Accessibility Tests**
   - `error-a11y.test.ts`: WCAG 2.1 AA compliance for error surfaces

**Run Commands**:
```bash
# Component tests
pnpm test frontend/apps/os-shell/src/__tests__/ui-observability/

# E2E tests
pnpm run test:e2e frontend/apps/os-shell/src/__tests__/e2e/

# Full suite (all 8 suites)
pnpm run test:all
```

**CI Integration**:
```yaml
# .github/workflows/ui-tests.yml
name: UI Observability Tests
on: [push, pull_request]
jobs:
  ui-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test frontend/apps/os-shell/src/__tests__/ui-observability/
      - run: pnpm run test:e2e
```

---

## 🔐 GOVERNANCE & GATES

### **PR Checklist (Every PR)**

- [ ] ✅ All 7 existing gates pass:
  - `pnpm run type-check`
  - `node --test os-platform/core/tests/phase83-tools.test.mjs`
  - `pnpm run doctor`
  - `error-trace-ergonomics`
  - `wave1-intake-invariants`
  - `wave1-trace`
  - `freeze-guard`

- [ ] ✅ New `ui-observability` suite passes
- [ ] ✅ correlationId displayed on all error surfaces
- [ ] ✅ [UI_CONTRACT.md](UI_CONTRACT.md) adhered
- [ ] ✅ No Zone A drift (freeze guard verified)
- [ ] ✅ Screenshots attached (success + error states)

### **Post-Merge Verification**

```bash
# After merge to main
git pull origin main
pnpm run test:all          # All suites green
pnpm run doctor            # Health check
pnpm run dev:os:shell      # Manual smoke test
```

---

## 📅 MILESTONE TRACKING

| Milestone | Target Date | Deliverable | Owner | Status |
|-----------|-------------|-------------|-------|--------|
| **Kickoff** | Feb 4, 2026 | Docs reviewed, branch created | [Team] | ✅ Done |
| **Phase 1 Complete** | Feb 6, 2026 | Error boundary + correlationId UX | [Frontend] | 🟡 In Progress |
| **Phase 2 Complete** | Feb 9, 2026 | First workflow slice | [Frontend] | ⚪ Not Started |
| **Phase 3 Complete** | Feb 11, 2026 | Failure states + UX polish | [Frontend] | ⚪ Not Started |
| **Phase 4 Complete** | Feb 14, 2026 | Remaining workflows | [Frontend] | ⚪ Not Started |

---

## 🚨 RISKS & MITIGATIONS

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Zone A Drift** | 🔴 High | Low | Freeze guard enforced; CI fails fast |
| **Breaking UI Contract** | 🟡 Medium | Medium | Version contract; deprecation warnings |
| **Regression in Existing Tests** | 🔴 High | Medium | Run full suite on every PR; no merge on red |
| **correlationId Not Captured** | 🔴 High | Low | Enforce in API client; add integration test |
| **Performance Degradation** | 🟡 Medium | Low | Monitor trace query latency; add caching |
| **Scope Creep (Phase 4)** | 🟡 Medium | High | Timebox Phase 4; defer post-MVP workflows |

---

## 📊 SUCCESS METRICS

### **Quantitative**

- ✅ **100% of error surfaces** display correlationId
- ✅ **<5 minutes** to debug failures (from error → trace query → root cause)
- ✅ **0 regressions** in existing 7 test suites
- ✅ **>=95% WCAG 2.1 AA compliance** for error UX

### **Qualitative**

- ✅ Operators report improved debuggability
- ✅ Frontend team velocity increases (reusable components)
- ✅ No Zone A incidents during implementation

---

## 🔄 POST-WAVE 1 INTEGRATION (After 2026-02-21)

**Unfreeze Actions**:
1. **Integrate Wave 1 Ergonomics** into intake workflow UI
   - correlationId-driven support
   - Doctor readiness checks exposed as operator UI hints
   - "Dry-run" and "preflight" hooks in operator console

2. **Zone A UI Surfaces**
   - Apply same observability-first UX to intake forms
   - Wire to IntakeHandler traces

3. **Validation**
   - Run preflight: `pwsh scripts/wave1-preflight.ps1`
   - Dry-run intake scenarios: `node scripts/wave1-dryrun.mjs`

---

## 📚 RELATED DOCUMENTATION

- **Backend Contract**: [os-platform/core/api/PilotController.ts](os-platform/core/api/PilotController.ts)
- **Error Handling**: [AGENTS.md § Debugging Workflows](AGENTS.md)
- **Trace Schema**: [os-platform/core/trace/schema.ts](os-platform/core/trace/schema.ts)
- **Wave 1 Dry-Run**: `scripts/wave1-dryrun.mjs`
- **UI Contract**: [UI_CONTRACT.md](UI_CONTRACT.md)
- **Backlog**: [UI_BACKLOG.md](UI_BACKLOG.md)

---

## 🏛️ THE TERRAFUSION WAY

**Observability-First UX**: Every failure is a gateway to complete system introspection. correlationId is not a debug tool—it's a first-class citizen of the error experience.

**Vertical Slices**: Ship complete workflows (route → UI → API → trace) rather than horizontal layers. Each slice is independently deployable and testable.

**Regression Immunity**: Existing gates remain green. New features add new suites without slowing the fast path.

**Zone Discipline**: Zone B open, Zone A frozen. No exceptions. No drift. No scope expansion into frozen territory.

**Government. Transcended.**

---

## ✅ READY TO SHIP

This plan is **executable immediately**. All prerequisites are met:
- ✅ Zone B: Open for shipping
- ✅ Backend: correlationId support operational
- ✅ Trace Store: Event-sourced, queryable
- ✅ UI Shell: Mature infrastructure
- ✅ Contracts: Defined + versioned
- ✅ Tests: Strategy documented

**Next Action**: Kickoff Phase 1 → create feature branch → write first test → implement → PR → merge.

**Let's go. 🚀**
