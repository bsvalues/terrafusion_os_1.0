# Slice 35: Debt Sweep + TerraCanon IDE Charter + AI Swarm Scale Charter

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents
> available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`)
> syntax for tracking.

**Goal:** Close the 5 known-debt items (WF-1, WF-2, WF-3, IV-1, IV-2) as bounded mechanical
lanes, then charter Phase B (TerraCanon IDE) and Phase D (AI Swarm Scale) as post-assessor
product initiatives with defined scope, file maps, and proof gates.

**Architecture:** Three sequential lanes. Each lane is gated by the prior lane's closure.
Lane 1 (debt) uses parallel read-only subagents followed by a single writer per sub-lane.
Lanes 2 and 3 (TerraCanon, AI Swarm) open only after explicit human go/no-go following Lane 1.
No lane 2 or 3 file is touched during lane 1 execution.

**Conventions:** HEAD at `70eee4e1e`. Branch `post-r3/w5f-registry-edge-cleanup`.
All proof commands must pass before any checkpoint commit.

---

## Multi-Agent Parallel Execution Model

```text
LANE 1 — Debt Sweep (immediate; human go = this document + founder instruction)
    │
    ├── PHASE 35-A: WF-1 + WF-3  (parallel recon → single writer)
    │      │
    │      ├── SubAgent HT-A1 (read-only): audit Slice 22 git history → exact commit hash
    │      ├── SubAgent HT-A2 (read-only): audit Slice 23 git history → exact commit hash
    │      ├── SubAgent HT-B1 (read-only): enumerate ReactDOMTestUtils.act usages + React 18 pattern
    │      └── @tf-writer (single): patch progress.md hashes + fix act() imports
    │
    ├── PHASE 35-B: WF-2 Console Noise  (parallel recon → single writer)
    │      │
    │      ├── SubAgent CN-A (read-only): console.* inventory in services/ + api/
    │      ├── SubAgent CN-B (read-only): console.* inventory in components/
    │      ├── SubAgent CN-C (read-only): console.* inventory in pages/ + shell/
    │      ├── SubAgent CN-D (read-only): console.* inventory in hooks/ + stores/
    │      └── @tf-writer (single): remove noise, promote errors, patch per bucket rules
    │
    └── PHASE 35-C: IV-1 + IV-2  (parallel recon → single writer)
           │
           ├── SubAgent IV-A1 (read-only): trace income save/fetch wiring in IncomeApproach + IncomeValuationPanel
           ├── SubAgent IV-A2 (read-only): confirm IncomeForgeModule.tsx orphan status + safe archive path
           └── @tf-writer (single): wire persistence gap + archive orphan

LANE 2 — TerraCanon IDE  (post-debt; requires explicit human go/no-go + GATE-35-1)
    │
    ├── PHASE 35-D: TerraCanon Recon  (parallel; 8 read-only subagents)
    │      ├── SubAgent TC-A: Monaco editor integration surface audit
    │      ├── SubAgent TC-B: AI service wiring points audit
    │      ├── SubAgent TC-C: File system / workspace API surface audit
    │      ├── SubAgent TC-D: Existing canonical IDE shell (TerraCanon stubs) audit
    │      ├── SubAgent TC-E: Build pipeline integration points audit
    │      ├── SubAgent TC-F: TerraTrace + TerraPilot wiring contract audit
    │      ├── SubAgent TC-G: Security surface (code execution sandbox) audit
    │      └── synthesis → @tf-charter: write TerraCanon bounded charter
    │
    └── PHASE 35-E: TerraCanon Implementation  (sequenced per charter)
           └── @tf-writer: implement per charter — single-writer isolation enforced

LANE 3 — AI Swarm Scale  (post-debt; requires explicit human go/no-go + GATE-35-2)
    │
    ├── PHASE 35-F: Swarm Recon  (parallel; 6 read-only subagents)
    │      ├── SubAgent SW-A: Current agent hierarchy + agent count audit
    │      ├── SubAgent SW-B: Coordination protocol audit (message passing, routing)
    │      ├── SubAgent SW-C: Agent tool allowlist + permission model coverage audit
    │      ├── SubAgent SW-D: Throughput + concurrency bottleneck audit
    │      ├── SubAgent SW-E: TerraTrace swarm event coverage audit
    │      └── synthesis → @tf-charter: write AI Swarm Scale bounded charter
    │
    └── PHASE 35-G: Swarm Scale Implementation  (sequenced per charter)
           └── @tf-writer: implement per charter — single-writer isolation enforced
```

---

## LANE 1: Debt Sweep

> **Authorization:** OPEN — founder go/no-go satisfied by this document.
> No additional gate required for Lane 1.

---

### Phase 35-A: WF-1 + WF-3 (Docs + Test Harness Hygiene)

| Field | Value |
|-------|-------|
| **Type** | Documentation + test hygiene |
| **Allowed reads** | `.governance/workflow/progress.md`, git history, `frontend/apps/os-shell/src/__tests__/**/*.tsx?` |
| **Allowed writes** | `.governance/workflow/progress.md` (hash fields only), `frontend/apps/os-shell/src/__tests__/**` act() imports |
| **Forbidden** | Any production source file, any test logic changes |
| **Checkpoint** | `CP-35-A` |

#### Pre-phase gate

- [ ] `git status --short` — expect clean tree

#### SubAgent HT-A1 — Slice 22 commit hash recon

**Read:** `git log --oneline --all -- frontend/apps/os-shell/src/components/Trace/traceToOsAction.ts`

```bash
# Expected: returns the commit that added traceToOsAction.ts
git log --oneline --all -- frontend/apps/os-shell/src/components/Trace/traceToOsAction.ts
git log --oneline --all -- frontend/apps/os-shell/src/__tests__/trace/trace.jumpActions.test.tsx
```

Report: earliest commit hash introducing Slice 22 artifacts.

#### SubAgent HT-A2 — Slice 23 commit hash recon

**Read:** `git log --oneline --all -- frontend/apps/os-shell/src/services/policyEngine.ts`

```bash
git log --oneline --all -- frontend/apps/os-shell/src/services/policyEngine.ts
git log --oneline --all -- frontend/apps/os-shell/src/components/Trace/PolicyPanel/PolicyPanel.tsx
```

Report: earliest commit hash introducing Slice 23 artifacts.

#### SubAgent HT-B1 — ReactDOMTestUtils.act enumeration

**Read:** All test files matching `src/__tests__/**/*.tsx?`

```bash
# Find all occurrences
grep -rn "react-dom/test-utils\|ReactDOMTestUtils" frontend/apps/os-shell/src/__tests__/
# Find the React 18 pattern used in passing tests
grep -rn "from 'react'" frontend/apps/os-shell/src/__tests__/ | grep "act" | head -5
```

Report: list of files + line numbers needing migration. Confirm React 18 `import { act } from 'react'` pattern.

#### @tf-writer — Phase 35-A implementation

**Step A.1: Backfill Slice 22 commit hashes in progress.md**

Using hash from HT-A1, replace all `Pending` commit fields in the Slice 22 table.
Pattern to find: `| ✅ 1.1 | Jump Actions tests (TDD) | Pending |`
Replace each `Pending` in the Slice 22 commit column with the actual hash.

**Step A.2: Backfill Slice 23 commit hashes in progress.md**

Using hash from HT-A2, replace all `Pending` commit fields in the Slice 23 table.

**Step A.3: Fix ReactDOMTestUtils.act imports**

```typescript
// Before (deprecated):
import { act } from 'react-dom/test-utils';
// or: import ReactDOMTestUtils from 'react-dom/test-utils';

// After (React 18 canonical):
import { act } from 'react';
```

Apply to all files identified by HT-B1.

- [ ] **Step A.1:** Backfill Slice 22 `Pending` → actual commit hash in progress.md
- [ ] **Step A.2:** Backfill Slice 23 `Pending` → actual commit hash in progress.md
- [ ] **Step A.3:** Migrate `react-dom/test-utils` act imports → `from 'react'`

#### Phase 35-A proof commands

- [ ] `pnpm run type-check` — 0 errors
- [ ] `node --test os-platform/core/tests/phase83-tools.test.mjs` — all pass
- [ ] `pnpm vitest run frontend/apps/os-shell/src/__tests__/trace/ frontend/apps/os-shell/src/__tests__/policy/` — all pass, zero act() deprecation warnings
- [ ] `grep -n "react-dom/test-utils" frontend/apps/os-shell/src/__tests__/` — 0 results

#### Phase 35-A checkpoint

`CP-35-A` — commit message: `fix(debt): WF-1 backfill Slice 22/23 commit hashes + WF-3 migrate ReactDOMTestUtils.act`

---

### Phase 35-B: WF-2 Console Noise Sweep

| Field | Value |
|-------|-------|
| **Type** | Mechanical production code cleanup |
| **Scope** | `frontend/apps/os-shell/src/**` excluding `__tests__/` and `*.test.*` |
| **Allowed writes** | Any production `.ts`/`.tsx` in the os-shell package |
| **Forbidden** | Test files, governance docs, backend files |
| **Checkpoint** | `CP-35-B` |

> **Baseline:** 724 `console.` occurrences in production code (measured 2026-03-19).

#### Pre-phase gate

- [ ] `CP-35-A` closed
- [ ] `pnpm run type-check` — 0 errors

#### SubAgent CN-A — services/ + api/ inventory

```bash
grep -rn "console\.\(log\|debug\|info\|warn\|error\)" \
  frontend/apps/os-shell/src/services/ \
  frontend/apps/os-shell/src/api/
```

Report: file, line, level, message type (noise/signal).
Classify each as: `REMOVE` (debug/log noise) | `PROMOTE` (error path using log) | `KEEP` (genuine error.log).

#### SubAgent CN-B — components/ inventory

```bash
grep -rn "console\.\(log\|debug\|info\|warn\|error\)" \
  frontend/apps/os-shell/src/components/
```

Report same classification.

#### SubAgent CN-C — pages/ + shell/ inventory

```bash
grep -rn "console\.\(log\|debug\|info\|warn\|error\)" \
  frontend/apps/os-shell/src/pages/ \
  frontend/apps/os-shell/src/shell/
```

Report same classification.

#### SubAgent CN-D — hooks/ + stores/ + config/ inventory

```bash
grep -rn "console\.\(log\|debug\|info\|warn\|error\)" \
  frontend/apps/os-shell/src/hooks/ \
  frontend/apps/os-shell/src/stores/ \
  frontend/apps/os-shell/src/config/
```

Report same classification.

#### @tf-writer — Phase 35-B rules

Apply these rules consistently across all subagent findings:

| Rule | Action |
|------|--------|
| `console.log(...)` — debug trace | **REMOVE** |
| `console.debug(...)` | **REMOVE** |
| `console.info(...)` | **REMOVE** |
| `console.warn(...)` on non-error path | **REMOVE** |
| `console.warn(...)` on degraded-state path | **KEEP** |
| `console.error(...)` on caught error | **KEEP** |
| `console.error(...)` with `error.message` payload | **KEEP** |
| `console.log(...)` in catch block | **PROMOTE** to `console.error(...)` |

**Do not:** add `logger` abstractions, add error reporting services, or make architectural changes.
**Only:** remove/promote inline `console.*` calls. Keep each diff minimal and local.

- [ ] **Step B.1:** Apply REMOVE/PROMOTE/KEEP to services/ + api/ findings
- [ ] **Step B.2:** Apply REMOVE/PROMOTE/KEEP to components/ findings
- [ ] **Step B.3:** Apply REMOVE/PROMOTE/KEEP to pages/ + shell/ findings
- [ ] **Step B.4:** Apply REMOVE/PROMOTE/KEEP to hooks/ + stores/ + config/ findings

#### Phase 35-B proof commands

- [ ] `pnpm run type-check` — 0 errors
- [ ] `node --test os-platform/core/tests/phase83-tools.test.mjs` — all pass
- [ ] `pnpm vitest run frontend/apps/os-shell` — no new failures vs pre-sweep baseline
- [ ] Console count: `grep -rc "console\." frontend/apps/os-shell/src --include="*.ts" --include="*.tsx" | grep -v "__tests__\|\.test\." | awk -F: '{s+=$2}END{print s}'` — must be ≤ 200 (from ~724 baseline)

#### Phase 35-B checkpoint

`CP-35-B` — commit message: `fix(debt): WF-2 console noise sweep — remove/promote ~500 console.* calls`

---

### Phase 35-C: IV-1 + IV-2 (Income Valuation Persistence + Archive)

| Field | Value |
|-------|-------|
| **Type** | Product / frontend + archive |
| **Allowed writes** | `frontend/apps/os-shell/src/pages/workbench/tabs/forge/IncomeApproach.tsx` · `frontend/apps/os-shell/src/components/forge/income/IncomeValuationPanel.tsx` · `frontend/apps/os-shell/src/services/incomeValuationService.ts` · targeted test files |
| **Forbidden** | Backend files, Dais files, non-Forge suite files |
| **Checkpoint** | `CP-35-C` |

#### Pre-phase gate

- [ ] `CP-35-B` closed
- [ ] `pnpm run type-check` — 0 errors

#### SubAgent IV-A1 — Income valuation save/fetch wiring audit

**Read:**
```bash
# Find where saveIncomeValuationRecord + fetchValuationRecord are called
grep -rn "saveIncomeValuationRecord\|fetchValuationRecord\|saveValuation\|persistValuation" \
  frontend/apps/os-shell/src/
# Find incomeValuationService exports
grep -n "export" frontend/apps/os-shell/src/services/incomeValuationService.ts
# Find current IncomeValuationPanel implementation
cat frontend/apps/os-shell/src/components/forge/income/IncomeValuationPanel.tsx
```

Report:
1. Whether save/fetch is called after backend `calculateValuation` response
2. Whether the saved record ID is threaded to the UI for retrieval
3. Whether the proof test (`IncomeValuationPanel.test.tsx`) asserts the full call chain

#### SubAgent IV-A2 — IncomeForgeModule orphan audit

**Read:**
```bash
# Confirm zero imports
grep -rn "IncomeForgeModule" frontend/apps/os-shell/src/
# Confirm file location
ls frontend/apps/os-shell/src/pages/suites/modules/IncomeForgeModule.tsx
```

Report: confirm zero live imports, state the safe archive path.

#### @tf-writer — Phase 35-C implementation

**IV-1: Close the persistence gap (if IV-A1 reports a gap)**

If `saveIncomeValuationRecord` is not called after the calculate response:

```typescript
// In IncomeValuationPanel.tsx — after successful calculateValuation():
const saveId = await incomeValuationService.saveIncomeValuationRecord({
  parcelId,
  taxYear,
  ...valuationResult,
});
setLastSavedId(saveId);
```

Ensure the proof test asserts `saveIncomeValuationRecord` is called after the calculate mock resolves.

**IV-2: Archive IncomeForgeModule.tsx**

```bash
# Move to ARCHIVE (do not delete — preserve for audit trail)
git mv frontend/apps/os-shell/src/pages/suites/modules/IncomeForgeModule.tsx \
       frontend/apps/os-shell/src/pages/suites/modules/ARCHIVE/IncomeForgeModule.archived.tsx
```

Add a one-line header comment to the archived file:
```typescript
// ARCHIVED 2026-03-19: No live imports. Forge income authority is IncomeApproach.tsx + IncomeValuationPanel.tsx. See CP-35-C.
```

- [ ] **Step C.1:** Wire `saveIncomeValuationRecord` call in `IncomeValuationPanel` if gap found
- [ ] **Step C.2:** Update proof test to assert save call after calculate
- [ ] **Step C.3:** Archive `IncomeForgeModule.tsx` with header comment

#### Phase 35-C proof commands

- [ ] `pnpm run type-check` — 0 errors
- [ ] `node --test os-platform/core/tests/phase83-tools.test.mjs` — all pass
- [ ] `pnpm vitest run frontend/apps/os-shell/src/__tests__/workbench/IncomeValuationPanel.test.tsx frontend/apps/os-shell/src/__tests__/workbench/incomeValuationService.test.ts` — all pass
- [ ] `grep -rn "IncomeForgeModule" frontend/apps/os-shell/src/ | grep -v "ARCHIVE"` — 0 results

#### Phase 35-C checkpoint

`CP-35-C` — commit message: `fix(debt): IV-1 wire income valuation persistence + IV-2 archive IncomeForgeModule orphan`

---

## LANE 2: TerraCanon IDE

> **Gate:** `GATE-35-1` — Requires explicit human go/no-go AFTER `CP-35-C`.
> Do NOT open this lane while Lane 1 is in progress.

### What TerraCanon Is

TerraCanon is the OS's own creation/development/maintenance environment. It is not "VS Code for TerraFusion" — it IS TerraFusion developing itself. Monaco-based, AI-integrated, connected to TerraPilot, with full TerraTrace audit of every edit action. It replaces VS Code for TerraFusion Platform development.

### Phase 35-D: TerraCanon Recon (Parallel, Read-Only)

| Field | Value |
|-------|-------|
| **Type** | Read-only reconnaissance — planning only |
| **Entry gate** | `GATE-35-1` (human explicit go) |
| **Allowed writes** | None — recon only |
| **Output** | Synthesis report → TerraCanon bounded charter |

#### SubAgent TC-A — Monaco integration surface audit

```bash
# Find any existing Monaco usage
grep -rn "monaco\|@monaco-editor\|MonacoEditor" frontend/ --include="*.ts" --include="*.tsx" --include="*.json" -l
# Find TerraCanon stubs
find . -path "*/canon*" -not -path "*/node_modules/*" -not -path "*/QUARANTINE/*" -not -path "*ARCHIVE*"
find . -name "*canon*" -not -path "*/node_modules/*" -not -path "*/QUARANTINE/*"
```

Report: existing Monaco imports, TerraCanon stub files, current editor primitive surface.

#### SubAgent TC-B — AI service wiring points audit

```bash
# Find current AI/LLM service wiring
grep -rn "openai\|anthropic\|llm\|completion\|chatCompletion\|streaming" \
  frontend/apps/os-shell/src/services/ frontend/apps/os-shell/src/api/ --include="*.ts" -l
# Find TerraPilot explain pipeline
grep -rn "pilotApi\|MuseService\|explain" frontend/apps/os-shell/src/api/ --include="*.ts"
```

Report: existing AI wiring, gaps for in-editor Muse integration.

#### SubAgent TC-C — File system / workspace API audit

```bash
# Find any existing file API / workspace API
grep -rn "FileSystem\|workspace\|readFile\|writeFile\|openFile" \
  frontend/apps/os-shell/src/ --include="*.ts" --include="*.tsx" -l | head -10
# OS-level file primitives
grep -rn "TerraFileSystem\|WorkspaceAPI\|CanonWorkspace" \
  os-platform/ frontend/apps/os-shell/src/ --include="*.ts" -l
```

Report: whether a file-system abstraction exists or needs to be built.

#### SubAgent TC-D — Existing TerraCanon stubs audit

```bash
# Read any existing canon route/shell stubs
cat frontend/apps/os-shell/src/pages/canon*.tsx 2>/dev/null || echo "NOT FOUND"
grep -rn "TerraCanon\|terra-canon\|canon" frontend/apps/os-shell/src/config/ --include="*.ts" --include="*.tsx"
# Check route registrations
grep -n "canon" frontend/apps/os-shell/src/router*.tsx 2>/dev/null
grep -n "/canon" frontend/apps/os-shell/src/App.tsx 2>/dev/null
```

Report: what stub surfaces exist for the `/canon` route.

#### SubAgent TC-E — Build pipeline integration points audit

```bash
# Check tsconfig for path aliases that would support canon modules
cat tsconfig.core.json | grep -A5 '"paths"'
# Check if there's a canon package in pnpm-workspace
grep "canon" pnpm-workspace.yaml package.json
```

Report: whether a dedicated `packages/canon` workspace makes sense vs. in-shell module.

#### SubAgent TC-F — TerraTrace + TerraPilot wiring contract audit

```bash
# What trace events should an IDE emit?
grep -n "artifact_created\|artifact_published\|tool_invoked" \
  frontend/apps/os-shell/src/services/terraTrace.ts
# Pilot explain contract
cat frontend/apps/os-shell/src/api/pilotApi.ts
```

Report: required trace events for editor actions (file_opened, file_saved, code_executed, explain_requested).

#### SubAgent TC-G — Security surface audit (code execution sandbox)

```bash
# Find any existing sandbox / eval / code execution patterns
grep -rn "eval\|Function(\|sandbox\|Worker\|iframe" \
  frontend/apps/os-shell/src/ --include="*.ts" --include="*.tsx" | grep -v "test\|comment"
# Find any CSP headers
grep -rn "Content-Security-Policy\|csp\|sandbox" backend/src/ --include="*.cs" -l
```

Report: existing sandbox primitives, CSP posture, risks for an in-browser code execution surface.

#### @tf-charter — TerraCanon bounded charter synthesis

After all TC subagents report, synthesize a charter containing:

1. **Bounded scope** — minimum viable TerraCanon: Monaco + file open/save + TerraPilot explain + TerraTrace audit
2. **File map** — exact files to create/modify
3. **Proof gates** — what tests prove the MVP contract
4. **Security gates** — sandbox requirements before any code execution is enabled
5. **Phase sequencing** — TC Phase 1 (shell wiring) → TC Phase 2 (AI integration) → TC Phase 3 (code execution sandbox)

Write charter to: `docs/superpowers/plans/2026-03-19-terracanon-charter.md`

---

### Phase 35-E: TerraCanon Implementation

> **Gate:** Charter from Phase 35-D accepted by founder.
> Implementation plan is the charter document. Execute per charter sequencing.

**Pre-implementation invariants:**
- `/canon` route must first exist as a stub before any Monaco embedding
- All editor actions (file_opened, file_saved, ai_explain_requested) must emit TerraTrace events
- Code execution requires isolated sandbox — NO `eval()` in main thread — Phase 3 only
- County data isolation: TerraCanon operates within county session scope

---

## LANE 3: AI Swarm Scale

> **Gate:** `GATE-35-2` — Requires explicit human go/no-go AFTER `CP-35-C`.
> Lanes 2 and 3 may be chartered in parallel (both are recon-only) but implementation
> phases are not simultaneous — one active writer at a time.

### What AI Swarm Scale Means

The current AI Swarm has a hierarchical agent architecture. Scale means:
1. Coordination protocol hardened for 1,008+ concurrent agents
2. TerraTrace coverage of every swarm event (dispatch, delegate, complete, fail, abort)
3. Tool allowlist enforcement at coordinator level (not just leaf level)
4. Throughput proven under synthetic county workload

### Phase 35-F: AI Swarm Recon (Parallel, Read-Only)

| Field | Value |
|-------|-------|
| **Type** | Read-only reconnaissance — planning only |
| **Entry gate** | `GATE-35-2` (human explicit go) |
| **Allowed writes** | None — recon only |
| **Output** | Synthesis report → AI Swarm Scale bounded charter |

#### SubAgent SW-A — Agent hierarchy + count audit

```bash
# Find current swarm topology
find os-platform/ai-systems/ -name "*.ts" -not -path "*/node_modules/*" | head -20
grep -rn "coordinator\|dispatcher\|orchestrat\|swarm\|AgentPool" \
  os-platform/ --include="*.ts" -l
```

Report: current agent hierarchy depth, coordinator patterns, total defined agent types.

#### SubAgent SW-B — Coordination protocol audit

```bash
# Find message passing / routing primitives
grep -rn "dispatch\|delegate\|broadcast\|route\|AgentMessage\|TaskQueue" \
  os-platform/ --include="*.ts" | head -20
# Find concurrency primitives
grep -rn "Promise.all\|Promise.allSettled\|queue\|semaphore\|throttle" \
  os-platform/ --include="*.ts" | head -10
```

Report: current coordination protocol, queue depth limits, back-pressure mechanisms.

#### SubAgent SW-C — Tool allowlist coverage audit

```bash
# Find tool allowlist definitions
grep -rn "allowedTools\|toolAllowlist\|ToolPolicy\|allowlist" \
  frontend/apps/os-shell/src/services/pilotRbac.ts \
  os-platform/ --include="*.ts"
# Find which agents have allowlists vs. open tool access
grep -rn "toolAllowlist\|writesTo\|riskLevel" os-platform/ --include="*.ts" | head -10
```

Report: which agents have tool allowlists enforced vs. unconstrained, gap count.

#### SubAgent SW-D — Throughput + concurrency bottleneck audit

```bash
# Find sequential bottlenecks (awaits in loops)
grep -rn "for.*await\|await.*for\|forEach.*async" \
  os-platform/ --include="*.ts" | head -10
# Find timeout/retry policies
grep -rn "timeout\|retry\|backoff" os-platform/ --include="*.ts" | head -10
```

Report: top 5 throughput bottlenecks for scale.

#### SubAgent SW-E — TerraTrace swarm event coverage audit

```bash
# Find swarm-related trace events
grep -rn "emitToolInvoked\|emitToolSucceeded\|emitToolFailed\|swarm\|dispatch" \
  os-platform/ frontend/apps/os-shell/src/services/terraTrace.ts --include="*.ts"
# What swarm events are NOT traced?
grep -rn "runAgent\|executeAgent\|delegateTask" os-platform/ --include="*.ts" | \
  grep -v "emit\|trace" | head -10
```

Report: swarm events with trace coverage vs. untraced paths.

#### @tf-charter — AI Swarm Scale bounded charter synthesis

After all SW subagents report, synthesize a charter containing:

1. **Bounded scope** — minimum viable scale: coordinator hardening + TerraTrace coverage gaps + tool allowlist enforcement at coordinator level
2. **File map** — exact files to create/modify
3. **Proof gates** — what tests prove the scale contract (synthetic workload, trace coverage, allowlist enforcement)
4. **Phase sequencing** — SW Phase 1 (trace coverage) → SW Phase 2 (coordinator hardening) → SW Phase 3 (synthetic scale test)

Write charter to: `docs/superpowers/plans/2026-03-19-aiswarm-charter.md`

---

### Phase 35-G: AI Swarm Scale Implementation

> **Gate:** Charter from Phase 35-F accepted by founder.
> Implementation plan is the charter document. Execute per charter sequencing.

**Pre-implementation invariants:**
- Every swarm event (dispatch, complete, fail, abort) MUST emit a TerraTrace event before any coordinator logic changes
- Tool allowlist enforcement must be proven at coordinator level before any scale-out work
- Scale benchmarks use synthetic workload only — no production county data in test runs
- County isolation remains intact: swarm tasks never cross county boundaries

---

## Gate Summary

| Gate | Trigger | What Opens |
|------|---------|-----------|
| Lane 1 open | This document + founder instruction | Phase 35-A (WF-1 + WF-3) |
| `CP-35-A` closed | WF-1/WF-3 proven | Phase 35-B (WF-2) |
| `CP-35-B` closed | WF-2 ≤ 200 console hits proven | Phase 35-C (IV-1 + IV-2) |
| `CP-35-C` closed | IV-1/IV-2 proven | Lane 1 complete; GATE-35-1 and GATE-35-2 unblocked |
| `GATE-35-1` | Explicit human go | Phase 35-D (TerraCanon Recon) |
| `GATE-35-2` | Explicit human go | Phase 35-F (AI Swarm Recon) |
| Charter accepted | Founder review of 35-D synthesis | Phase 35-E (TerraCanon Implementation) |
| Charter accepted | Founder review of 35-F synthesis | Phase 35-G (AI Swarm Scale Implementation) |

---

## Write Authority

| Agent | Phase | Authorized writes |
|-------|-------|------------------|
| `@tf-writer` | 35-A | `progress.md` (Slice 22/23 hash fields only) · `__tests__/**` act() imports |
| `@tf-writer` | 35-B | Any production `.ts`/`.tsx` in `frontend/apps/os-shell/src/` (not `__tests__/`) |
| `@tf-writer` | 35-C | `IncomeApproach.tsx` · `IncomeValuationPanel.tsx` · `incomeValuationService.ts` · targeted test files · `IncomeForgeModule.tsx` (archive move only) |
| `@tf-charter` | 35-D | `docs/superpowers/plans/2026-03-19-terracanon-charter.md` (new) |
| `@tf-charter` | 35-F | `docs/superpowers/plans/2026-03-19-aiswarm-charter.md` (new) |
| `@tf-writer` | 35-E | Per TerraCanon charter file map |
| `@tf-writer` | 35-G | Per AI Swarm Scale charter file map |
| `@tf-checkpoint` | Any | `progress.md` closure sections + `plan.md` checkpoint notes |
| All other agents | All | Read-only. No file writes. |

**Rule:** One active writer lane at a time. `@tf-writer` runs alone in each phase.

---

## Known Constraints and Non-Authorizations

- **TerraCanon code execution sandbox** is Phase 35-E Phase 3 only — no `eval()` or unboxed execution in Phase 1 or 2
- **AI Swarm Scale does not include new agent types** — it hardens existing coordination and adds trace coverage
- **No new product verticals** (TerraClerk, TerraTreasury, etc.) are opened by this slice
- **County 2 Onboarding** (option A from post-assessor charter) remains a separate future slice
- **Phase 9B → 10 → 11** (Backend Explain, HITL Drafter, Sovereign Deploy) are tracked in `2026-03-18-phase9b-10-11-explain-hitl-sovereign.md` and are not reopened here

---

## Document Status

- [x] Debt sweep (Lane 1) fully specified — immediate, no additional gate
- [x] TerraCanon (Lane 2) charter recon defined — gated on `GATE-35-1`
- [x] AI Swarm Scale (Lane 3) charter recon defined — gated on `GATE-35-2`
- [x] Multi-agent parallel model defined for all three lanes
- [x] Single-writer isolation preserved per phase
- [x] Security constraints explicit (sandbox, PII, county isolation)
- [x] All gates named and ordered
