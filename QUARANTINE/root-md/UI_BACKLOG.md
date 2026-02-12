# TerraFusion OS UI/UX Implementation Backlog
## Zone B | February 2026 | Priority-Ranked  

---

## 📊 CURRENT STATE

**UI Infrastructure**: ✅ Mature (Desktop Shell, routing, 725 tests passing)  
**Backend Integration**: ⚠️ **Partial** (tool execution → correlationId display gap)  
**Zone A Status**: 🔒 **Frozen** until 2026-02-21 (intake docs/templates)  
**Zone B Status**: 🟢 **Open** for shipping (7 green gates + proof layer)

**Key Gap**: Tool invocation workflows lack **observability-first error UX** (correlationId display, trace query hints, failure debugging ergonomics).

---

## 🎯 SUCCESS CRITERIA (Restated from Plan)

1. ✅ **UI restart is immediate** (Zone B) via vertical slices
2. ✅ **No Zone A drift** (freeze guard blocks Write-lane)
3. ✅ **Contracts are stable** (UI_CONTRACT.md versioned, backward-compatible)
4. ✅ **Observability-first UX**: correlationId visible/copyable from all failure surfaces
5. ✅ **Regression immunity**: existing 7 suites remain green + new UI suite added
6. ✅ **Deployment-ready**: same gates, health checks, trace ergonomics

---

## 📋 BACKLOG (Prioritized 7–10 Day Plan)

### **PHASE 1: UI Shell + Navigation + Guardrails** (Days 1–2)

**Objective**: Establish the error boundary + correlationId display contract

#### **P0 - Immediate (Critical Path)**

- [ ] **1.1 Global Error Boundary Enhancement**
  - **File**: [frontend/apps/os-shell/src/contexts/ErrorContext.tsx](frontend/apps/os-shell/src/contexts/ErrorContext.tsx)
  - **Changes**:
    - Add `correlationId` field to error state
    - Render "Copy correlationId" button
    - Show `pnpm run trace:query --correlation <id>` hint (dev-only)
  - **Test**: Trigger error → verify correlationId displayed + copyable
  - **Estimate**: 3 hours

- [ ] **1.2 Error UI Component Library**
  - **File**: `frontend/apps/os-shell/src/components/errors/` (new)
  - **Components**:
    - `<ErrorDisplay />`: correlationId block + user-safe message
    - `<CorrelationIdBadge />`: reusable correlationId widget
    - `<TraceQueryHint />`: dev-mode hint component
  - **Storybook**: Add stories for all error codes (use [UI_CONTRACT.md](UI_CONTRACT.md) error codes)
  - **Test**: Component tests + visual regression
  - **Estimate**: 4 hours

- [ ] **1.3 API Client Error Handling**
  - **File**: [frontend/apps/os-shell/src/api/pilotApi.ts](frontend/apps/os-shell/src/api/pilotApi.ts)
  - **Changes**:
    - Ensure `catch` blocks extract `correlationId` from error responses
    - Add retry logic with correlationId tracking
    - Emit client-side traces (e.g., "user_cancelled")
  - **Test**: Mock API failures → verify correlationId extraction
  - **Estimate**: 2 hours

#### **P1 - High (Foundation)**

- [ ] **1.4 Navigation Audit**
  - **Files**: [Router.tsx](frontend/apps/os-shell/src/Router.tsx), [MainNavigation.tsx](frontend/apps/os-shell/src/components/navigation/MainNavigation.tsx)
  - **Action**: Verify all routes have error boundaries + loading states
  - **Document**: Create route →  component → error handling map
  - **Estimate**: 2 hours

- [ ] **1.5 Dev-Mode Tooling Integration**
  - **File**: `frontend/apps/os-shell/src/dev-tools/` (new)
  - **Feature**: "Recent Errors" widget with trace query links
  - **Storage**: Session storage for last 10 correlationIds
  - **UI**: Floating panel (dev-only)
  - **Estimate**: 3 hours

**Phase 1 Done When**: App shell navigable + error boundary shows correlationId on any failure

---

### **PHASE 2: First End-to-End Workflow Slice** (Days 3–5)

**Objective**: Wire ONE complete tool execution → result/error → correlationId flow

#### **P0 - Critical Path**

- [ ] **2.1 Choose Pilot Workflow (Read-Only First)**
  - **Candidate**: Tool listing (`/pilot` route) → view tool details
  - **Why**: Read-only, low risk, demonstrates trace ergonomics
  - **File**: [frontend/apps/os-shell/src/pages/PilotConsole.tsx](frontend/apps/os-shell/src/pages/PilotConsole.tsx) (enhance existing)
  - **Estimate**: 1 hour (decision + spike)

- [ ] **2.2 Tool Invocation Component**
  - **File**: `frontend/apps/os-shell/src/components/pilot/ToolInvoker.tsx` (new)
  - **Features**:
    - Form for tool arguments (dynamic based on tool schema)
    - Loading state with cancel button
    - Success state with result display
    - Error state with `<ErrorDisplay correlationId={...} />`
  - **Contract**: Adheres to [UI_CONTRACT.md](UI_CONTRACT.md)
  - **Test**: E2E test: invoke tool → success → verify result displayed
  - **Estimate**: 6 hours

- [ ] **2.3 Tool Execution Error Flow**
  - **Scenario**: Invoke tool with missing confirmation → capture error
  - **Verify**:
    - ✅ `CONFIRMATION_REQUIRED` error shown
    - ✅ correlationId displayed + copyable
    - ✅ User-safe message: "This action requires confirmation"
    - ✅ Trace query hint visible (dev-only)
  - **Test**: E2E test: induce error → verify correlationId → query trace via CLI
  - **Estimate**: 4 hours

- [ ] **2.4 Trace Query Integration**
  - **File**: `frontend/apps/os-shell/src/hooks/useTraceQuery.ts` (new)
  - **Purpose**: Fetch trace chain for a correlationId
  - **UI**: Add "View Trace" button next to correlationId in error display
  - **Implementation**: Call `/api/pilot/trace/:correlationId` → render event chain
  - **Test**: Unit + integration
  - **Estimate**: 4 hours

#### **P1 - High**

- [ ] **2.5 Success State UX Polish**
  - **File**: `frontend/apps/os-shell/src/components/pilot/ToolResultDisplay.tsx` (new)
  - **Features**:
    - Syntax-highlighted JSON for result payloads
    - Execution time badge
    - "Re-run" button
  - **Estimate**: 3 hours

- [ ] **2.6 Loading State + Cancel**
  - **Feature**: Show spinner + "Cancel" button during tool execution
  - **Behavior**: Cancel → abort fetch → show "Operation cancelled" with correlationId
  - **Estimate**: 2 hours

**Phase 2 Done When**: ONE workflow is production-grade: tool list → invoke → result/error → correlationId visible

---

### **PHASE 3: Failure/Edge States + UX Polish** (Days 6–7)

**Objective**: Make failures *debuggable in under 5 minutes*

#### **P0 - Critical**

- [ ] **3.1 Empty State Components**
  - **Files**: `frontend/apps/os-shell/src/components/empty-states/` (new)
  - **Use Cases**: No tools available, no results, no trace events
  - **Design**: Consistent iconography + helpful hints
  - **Estimate**: 3 hours

- [ ] **3.2 Validation Surfaces**
  - **Feature**: Client-side validation for tool arguments
  - **Behavior**: Show inline errors before submission
  - **Reduces**: Unnecessary API calls + improves UX
  - **Estimate**: 4 hours

- [ ] **3.3 Retry Logic + Circuit Breaker**
  - **File**: [frontend/apps/os-shell/src/api/pilotApi.ts](frontend/apps/os-shell/src/api/pilotApi.ts) (enhance)
  - **Features**:
    - Exponential backoff for retries
    - Circuit breaker pattern for repeated failures
    - correlationId persisted across retries
  - **Estimate**: 3 hours

#### **P1 - High**

- [ ] **3.4 Accessibility Pass**
  - **Scope**: Error displays, correlationId badges, tool invocation forms
  - **Tools**: `@axe-core/playwright`, `jest-axe`
  - **Target**: WCAG 2.1 AA compliance
  - **Estimate**: 4 hours

- [ ] **3.5 UX Instrumentation**
  - **Feature**: Emit client-side trace events for:
    - Button clicks (tool actions)
    - Form submissions
    - Errors displayed
    - correlationId copied
  - **Purpose**: Full observability of user workflows
  - **Estimate**: 2 hours

**Phase 3 Done When**: Failures are debuggable with clear UX/trace → no guessing required

---

### **PHASE 4: Expand to Remaining Screens** (Days 8–10)

**Objective**: Repeat slice pattern for additional workflows

#### **P0 - MVP Expansion**

- [ ] **4.1 Tool Discovery UI**
  - **Route**: `/pilot/tools`
  - **Features**: Search, filter, tool cards with risk badges
  - **Estimate**: 6 hours

- [ ] **4.2 Governance Dashboard Integration**
  - **Route**: `/pilot/dashboard`
  - **Features**: Tool usage metrics, recent errors (correlationId links)
  - **Data Source**: Trace store aggregations
  - **Estimate**: 8 hours

- [ ] **4.3 Trace History View**
  - **Route**: `/pilot/traces`
  - **Features**: Table of recent traces with correlationId search
  - **Estimate**: 5 hours

#### **P1 - Post-MVP**

- [ ] **4.4 Additional Workflows**
  - **Candidates**:
    - GPT Studio (`/gpt-studio`) → integrate correlationId error handling
    - System Diagnostics (`/monitoring`) → add trace query hooks
  - **Pattern**: Reuse `<ToolInvoker />` + `<ErrorDisplay />` components
  - **Estimate**: 3 hours per workflow

**Phase 4 Done When**: All major workflows have observability-first error UX

---

## 🧪 TEST STRATEGY

### **New UI Test Suite** (add to existing 7 suites)

**Suite Name**: `ui-observability`

**Tests**:
1. **Error Display Contract**
   - ✅ correlationId visible on all error types
   - ✅ Copy button works
   - ✅ Trace query hint shown (dev-only)

2. **E2E Workflow**
   - ✅ Invoke tool → success → result displayed
   - ✅ Invoke tool → error → correlationId displayed → copy → query trace CLI
   - ✅ Cancel tool execution → correlationId shown

3. **Component Tests**
   - ✅ `<ErrorDisplay />` renders all error codes
   - ✅ `<CorrelationIdBadge />` copies to clipboard
   - ✅ `<ToolInvoker />` handles loading/success/error states

**Test Commands** (per PR):
```bash
# Existing gates (must remain green)
pnpm run type-check
node --test os-platform/core/tests/phase83-tools.test.mjs
pnpm run doctor

# New UI suite
pnpm run test:ui-observability  # (to be created)
```

---

## 📝 TODO CAPTURE (From Grep Scan)

### **High Priority (Block Workflows)**

1. **SystemGPT Mode Integration** ([systemDiagnosticsApi.ts:357](frontend/apps/os-shell/src/api/systemDiagnosticsApi.ts#L357))
   - **Issue**: Error handling lacks correlationId
   - **Fix**: Wrap in standard error response format
   - **Estimate**: 1 hour

2. **GPT Studio Live Data** ([SystemGptAtlasPanel.test.tsx:297](frontend/apps/os-shell/src/features/gpt/components/__tests__/SystemGptAtlasPanel.test.tsx#L297))
   - **Issue**: Multiple TODOs for live data integration
   - **Fix**: Wire to backend API + add correlationId error handling
   - **Estimate**: 4 hours

3. **QuantumModuleManager Context** ([QuantumModuleManager.ts:240](frontend/apps/os-shell/src/services/QuantumModuleManager.ts#L240))
   - **Issue**: Hardcoded defaults for countyId, permissions, securityLevel
   - **Fix**: Get from user session/auth context
   - **Estimate**: 2 hours

### **Medium Priority (UX Polish)**

4. **MetricsCollector Storage** ([MetricsCollector.ts:719](frontend/apps/os-shell/src/services/monitoring/MetricsCollector.ts#L719))
   - **Issue**: TODO for indexedDB + API storage backends
   - **Fix**: Implement persistence layer
   - **Estimate**: 6 hours

5. **Desktop Context Menu** ([DesktopContextMenu.tsx:137](frontend/apps/os-shell/src/shell/desktop/DesktopContextMenu.tsx#L137))
   - **Issue**: "About TerraFusion" dialog not implemented
   - **Fix**: Create modal component
   - **Estimate**: 2 hours

### **Low Priority (Nice-to-Have)**

6. **Async Test Timing** ([gpt-studio-smoke.test.tsx:76](frontend/apps/os-shell/src/__tests__/smoke/gpt-studio-smoke.test.tsx#L76))
   - **Issue**: Flaky test due to React state timing
   - **Fix**: Use proper async waiters
   - **Estimate**: 1 hour

---

## 🔄 GIT STRATEGY (Per PR)

**Branch Naming**: `ui/<phase>-<feature>`

**Example Commits**:
```bash
# Phase 1
git commit -m "feat(ui): global error boundary with correlationId display

Evidence:
- Tests: ErrorDisplay component tests passing
- Gates: type-check + phase83-tools green
- UI: correlationId visible + copyable on all errors

Government: FISMA compliance
AI-Collaboration: GitHub_Copilot"

# Phase 2
git commit -m "feat(ui): tool invocation workflow with trace integration

Evidence:
- Tests: E2E tool execution flow passing
- Gates: doctor + UI observability suite green
- Contract: UI_CONTRACT.md v1.0 adhered

Government: FISMA compliance
AI-Collaboration: GitHub_Copilot"
```

**PR Template**:
```markdown
## Phase X: [Feature Name]

### Changes
- [Summary of changes]

### Contract Adherence
- ✅ UI_CONTRACT.md v1.0 followed
- ✅ correlationId displayed on all error surfaces
- ✅ Trace query workflow tested

### Tests
- [x] Component tests
- [x] E2E workflow test
- [x] Existing 7 suites remain green

### Screenshots
[Include screenshots of:
 1. Success state
 2. Error state with correlationId
 3. Dev-mode trace query hint]

### Post-Wave 1 Readiness
Zone B changes only. No Wave 1 drift. Freeze guard verified.
```

---

## 📅 MILESTONE TIMELINE

| Phase | Days | Deliverable | Success Metric |
|-------|------|-------------|----------------|
| **Phase 1** | 1-2 | Error boundary + correlationId UX | correlationId visible on all errors |
| **Phase 2** | 3-5 | First workflow slice (tool invocation) | ONE end-to-end workflow production-grade |
| **Phase 3** | 6-7 | Failure states + UX polish | Failures debuggable in <5 min |
| **Phase 4** | 8-10 | Remaining workflows | All major surfaces have correlationId UX |

**Total Duration**: 7–10 days (depending on scope of Phase 4)

---

## 🚨 RISKS & MITIGATIONS

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Zone A Drift** | High | Freeze guard blocks write-lane changes; CI fails fast |
| **Breaking UI Contract** | Medium | Version contract; add deprecation warnings |
| **Regression in Existing Tests** | High | Run full suite on every PR; no merge on red |
| **correlationId Not Captured** | High | Enforce in API client; add integration test |
| **Performance Degradation** | Medium | Monitor trace query latency; add caching layer |

---

## 🏛️ THE TERRAFUSION WAY

**Observability-First UX**: Every failure is an opportunity for system introspection. correlationId is not a debug tool—it's a first-class UX element.

**Vertical Slices**: Ship complete workflows (route → UI → API → trace) rather than horizontal layers. Each slice is independently deployable and testable.

**Regression Immunity**: Existing gates remain green. New features add new suites without slowing the fast path.

**Government. Transcended.**
