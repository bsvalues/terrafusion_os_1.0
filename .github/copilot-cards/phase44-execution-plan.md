# Phase 44 — Copilot Execution Plan
**Tranches**: 2B (Workbench Tab Truth Audit) + GPT Module Conflict Resolution  
**Branch**: `feat/phase44-tab-truth-gpt-fix` (create from `feat/r0-surface-honesty`)  
**Execution model**: Cards executed in sequence. Card A first, proof gate before Card B.  
**Agent**: GitHub Copilot (write). Claude: Proof-gate reviewer only — no parallel write passes.

---

## Card 44-A — Tranche 2B: Workbench Tab Truth Audit

### Slice
Tranche 2B — WorkbenchTab truthState gate for RESERVED FUTURE verticals (TerraClerk, TerraTreasury, TerraAudit).

### Why
The Property Workbench declares 9 tabs, 3 of which belong to OS verticals that are **RESERVED FUTURE** per the TerraFusion OS identity constitution:
- `clerk` → TerraClerk (County Clerk) — RESERVED FUTURE
- `treasury` → TerraTreasury (County Treasurer) — RESERVED FUTURE  
- `audit` → TerraAudit (County Auditor) — RESERVED FUTURE

All three are currently marked `enabled: true` with no disclosure. The underlying tab components (`PropertyClerk.tsx`, `PropertyTreasury.tsx`, `PropertyAudit.tsx`) exist and define `invokeTool` calls, but their backend verticals are not yet built. Clicking these tabs presents live-looking content from unbuilt office verticals — a surface honesty violation.

**Tranche 2B DoD** (from backlog):
- Every workbench tab has a declared truthState or is confirmed live
- Clerk, Treasury, Audit tracked separately — they are inter-vertical, not intra-assessor
- QueuedModuleSurface rendered for queued tabs (consistent with Phase 42 canon)

### Source of Truth
- OS identity canon: `CLAUDE.md` / `terrafusion-identity.md` — Clerk, Treasury, Audit are RESERVED FUTURE
- Phase 42 canon: `QueuedModuleSurface` is the correct queued-state render
- `WORKBENCH_TABS` at `PropertyWorkbench.tsx:102-111` — no truthState today
- `WorkbenchTab` interface at `PropertyWorkbench.tsx:53-58` — no truthState field today

### Current State
```typescript
// PropertyWorkbench.tsx:53-58
interface WorkbenchTab {
  id: WorkbenchTabSlug;
  label: string;
  icon: string;
  path: string;
  enabled: boolean;
  // ← NO truthState field
}

// PropertyWorkbench.tsx:102-111
const WORKBENCH_TABS: WorkbenchTab[] = [
  { id: 'summary',  label: 'Summary',  icon: '📊', path: '',         enabled: true },
  { id: 'forge',    label: 'Forge',    icon: '🔥', path: 'forge',    enabled: true },
  { id: 'atlas',    label: 'Atlas',    icon: '🗺️', path: 'atlas',    enabled: true },
  { id: 'dais',     label: 'Dais',     icon: '📋', path: 'dais',     enabled: true },
  { id: 'clerk',    label: 'Clerk',    icon: '📜', path: 'clerk',    enabled: true },  // ← LIE: RESERVED FUTURE
  { id: 'treasury', label: 'Treasury', icon: '💰', path: 'treasury', enabled: true },  // ← LIE: RESERVED FUTURE
  { id: 'audit',    label: 'Audit',    icon: '🔍', path: 'audit',    enabled: true },  // ← LIE: RESERVED FUTURE
  { id: 'dossier',  label: 'Dossier',  icon: '📁', path: 'dossier',  enabled: true },
  { id: 'pilot',    label: 'Pilot',    icon: '🎮', path: 'pilot',    enabled: true },
];

// Tab content at PropertyWorkbench.tsx:~565-575
<main className="flex-1 overflow-auto p-2">
  <LiquidPanel variant="interactive" radius="md" className="min-h-full">
    <ErrorBoundary>
      <Suspense fallback={<TabLoader />}>
        <Outlet context={{ parcelId, propertyData, workMode }} />
      </Suspense>
    </ErrorBoundary>
  </LiquidPanel>
</main>
```

### Goal State
```typescript
// WorkbenchTab interface — add optional truthState
interface WorkbenchTab {
  id: WorkbenchTabSlug;
  label: string;
  icon: string;
  path: string;
  enabled: boolean;
  truthState?: 'queued';  // ← ADD
}

// WORKBENCH_TABS — mark RESERVED FUTURE verticals
const WORKBENCH_TABS: WorkbenchTab[] = [
  { id: 'summary',  label: 'Summary',  icon: '📊', path: '',         enabled: true },
  { id: 'forge',    label: 'Forge',    icon: '🔥', path: 'forge',    enabled: true },
  { id: 'atlas',    label: 'Atlas',    icon: '🗺️', path: 'atlas',    enabled: true },
  { id: 'dais',     label: 'Dais',     icon: '📋', path: 'dais',     enabled: true },
  { id: 'clerk',    label: 'Clerk',    icon: '📜', path: 'clerk',    enabled: true, truthState: 'queued' },
  { id: 'treasury', label: 'Treasury', icon: '💰', path: 'treasury', enabled: true, truthState: 'queued' },
  { id: 'audit',    label: 'Audit',    icon: '🔍', path: 'audit',    enabled: true, truthState: 'queued' },
  { id: 'dossier',  label: 'Dossier',  icon: '📁', path: 'dossier',  enabled: true },
  { id: 'pilot',    label: 'Pilot',    icon: '🎮', path: 'pilot',    enabled: true },
];

// Component: derive currentTabConfig (add to useMemo section)
const currentTabConfig = useMemo(
  () => WORKBENCH_TABS.find((t) => t.id === currentTabId),
  [currentTabId]
);

// Tab content render — intercept before Outlet
<main className="flex-1 overflow-auto p-2">
  <LiquidPanel variant="interactive" radius="md" className="min-h-full">
    <ErrorBoundary>
      <Suspense fallback={<TabLoader />}>
        {currentTabConfig?.truthState === 'queued' ? (
          <QueuedModuleSurface
            name={currentTabConfig.label}
            description={`${currentTabConfig.label} tools are reserved for a future TerraFusion vertical. This surface is not yet active.`}
            moduleId={currentTabConfig.id}
          />
        ) : (
          <Outlet context={{ parcelId, propertyData, workMode }} />
        )}
      </Suspense>
    </ErrorBoundary>
  </LiquidPanel>
</main>
```

### Allowed Files
```
frontend/apps/os-shell/src/pages/workbench/PropertyWorkbench.tsx
```

### Forbidden Files
```
frontend/apps/os-shell/src/pages/workbench/tabs/PropertyClerk.tsx
frontend/apps/os-shell/src/pages/workbench/tabs/PropertyTreasury.tsx
frontend/apps/os-shell/src/pages/workbench/tabs/PropertyAudit.tsx
frontend/apps/os-shell/src/components/suites/QueuedModuleSurface.tsx
frontend/apps/os-shell/src/contracts/workbench.ts  (WorkbenchTabSlug must NOT change)
```

### Required Changes

**Step 1** — Add import for `QueuedModuleSurface` at top of `PropertyWorkbench.tsx`:
```typescript
import QueuedModuleSurface from '../../components/suites/QueuedModuleSurface';
```
Place it after the existing local imports block (after the `useAuthContext` import line).

**Step 2** — Add `truthState?: 'queued'` to the `WorkbenchTab` interface (line ~53-58):
```typescript
interface WorkbenchTab {
  id: WorkbenchTabSlug;
  label: string;
  icon: string;
  path: string;
  enabled: boolean;
  truthState?: 'queued';
}
```

**Step 3** — Add `truthState: 'queued'` to clerk, treasury, audit entries in `WORKBENCH_TABS`:
```typescript
  { id: 'clerk',    label: 'Clerk',    icon: '📜', path: 'clerk',    enabled: true, truthState: 'queued' },
  { id: 'treasury', label: 'Treasury', icon: '💰', path: 'treasury', enabled: true, truthState: 'queued' },
  { id: 'audit',    label: 'Audit',    icon: '🔍', path: 'audit',    enabled: true, truthState: 'queued' },
```

**Step 4** — Add `currentTabConfig` derivation inside the component body, near the `currentTabId` useMemo (after line ~244):
```typescript
const currentTabConfig = useMemo(
  () => WORKBENCH_TABS.find((t) => t.id === currentTabId),
  [currentTabId]
);
```

**Step 5** — Replace the `<Outlet />` render in the `<main>` section with the conditional render:
```typescript
{currentTabConfig?.truthState === 'queued' ? (
  <QueuedModuleSurface
    name={currentTabConfig.label}
    description={`${currentTabConfig.label} tools are reserved for a future TerraFusion vertical. This surface is not yet active.`}
    moduleId={currentTabConfig.id}
  />
) : (
  <Outlet context={{ parcelId, propertyData, workMode }} />
)}
```
The `<Suspense fallback={<TabLoader />}>` wrapper is kept around this conditional block.

### Do Not Do
- Do NOT disable tabs (`enabled: false`) — they must remain navigable so the QueuedModuleSurface renders
- Do NOT modify `WorkbenchTabSlug` type in `contracts/workbench.ts` — the slug values are locked
- Do NOT touch `PropertyClerk.tsx`, `PropertyTreasury.tsx`, `PropertyAudit.tsx` — those are sealed from this card
- Do NOT add truthState to summary, forge, atlas, dais, dossier, or pilot — those are Assessor vertical tabs (live)
- Do NOT change `QueuedModuleSurface.tsx` — use it as-is

### Proof Gates
```bash
pnpm run type-check
node --test os-platform/core/tests/phase83-tools.test.mjs
```

Both must exit 0. If either fails, STOP — do not commit.

### Expected Evidence
- `pnpm run type-check` exits 0
- `phase83-tools.test.mjs` exits 0
- Changed files: exactly **1** (`PropertyWorkbench.tsx`)
- What the user will notice: Clicking the Clerk, Treasury, or Audit workbench tabs shows the "TerraFusion Queued" surface instead of the placeholder tool panels. Summary, Forge, Atlas, Dais, Dossier, and Pilot tabs are unchanged.

### Stop Condition
This card closes when:
1. Both proof gates pass (exit 0)
2. Screenshot confirms QueuedModuleSurface renders for at least one of clerk/treasury/audit tab
3. Evidence posted — changed file + one sentence of what changed + gate results

**Do not open Card 44-B until 44-A evidence is posted.**

---

## Card 44-B — GPT Module PlaceholderModule Resolution

### Slice
GPT module launchers: resolve `gpt-management` and `gpt-rag` conflict (declared live, renders as placeholder); convert four queued GPT modules from `PlaceholderModule` (legacy) to `QueuedModuleSurface` (Phase 42 canon).

### Why
**Conflict** (unreconciled, discovered in Phase 44 pre-read):
- `gpt-management` and `gpt-rag`: declared `status: 'live'` in `GptSuiteHome.tsx` and rendered via real components (`GPTManagementDashboard`, `RAGDatasetManager`) inside the suite UI — but when launched as **standalone modules** they hit the `moduleComponents.tsx` switch and render as `PlaceholderModule`. 
- This produces a split reality: live in suite context, fake when launched standalone.

**Canon upgrade**:
- `gpt-studio`, `gpt-marketplace`, `gpt-builder`, `gpt-analytics`: correctly declared `status: 'queued'` in GptSuiteHome, but their switch cases use `PlaceholderModule` (the old Phase 39 pattern). Phase 42 established `QueuedModuleSurface` as the canonical queued render. These 4 cases should be upgraded to stay consistent.

### Source of Truth
- `GptSuiteHome.tsx:16-17` — imports `GPTManagementDashboard` from `'../../components/gpt/GPTManagementDashboard'` and `RAGDatasetManager` from `'../../components/gpt/RAGDatasetManager'`
- `GptSuiteHome.tsx:166-173` — renders these components in `renderWorkspacePanel()` when `status: 'live'`
- `moduleComponents.tsx:1036-1091` — `gpt-management` and `gpt-rag` currently `PlaceholderModule`
- `moduleComponents.tsx:1010-1034` — `gpt-studio`, `gpt-marketplace` currently `PlaceholderModule`
- `moduleComponents.tsx:1049-1073` — `gpt-builder`, `gpt-analytics` currently `PlaceholderModule`
- Phase 42 canon: `QueuedModuleSurface` is the correct pattern for `status: 'queued'` modules

### Current State
```typescript
// moduleComponents.tsx:1036 — gpt-management (CONFLICT: live in suite, placeholder standalone)
case 'gpt-management':
  return (
    <PlaceholderModule
      name='GPT Management'
      icon='⚙️'
      description='GPT administration — API key management, usage quotas, model configuration, and access control.'
      status='placeholder'
      domain='ai'
      scope='system'
      launchSurface='GPT suite → Standalone window'
    />
  );

// moduleComponents.tsx:1075 — gpt-rag (CONFLICT: live in suite, placeholder standalone)
case 'gpt-rag':
  return (
    <PlaceholderModule
      name='GPT RAG'
      icon='📚'
      description='Retrieval-Augmented Generation — document indexing, vector search, and context-aware AI responses over county data.'
      status='placeholder'
      domain='ai'
      scope='county-wide'
      launchSurface='GPT suite → Standalone window'
    />
  );

// gpt-studio, gpt-marketplace, gpt-builder, gpt-analytics: same PlaceholderModule pattern (legacy)
```

### Goal State
```typescript
// Lazy imports to add near line ~250 (after existing lazy component section):
const GPTManagementDashboard = lazy(() =>
  import('../components/gpt/GPTManagementDashboard').then((m) => ({ default: m.GPTManagementDashboard }))
);

const RAGDatasetManager = lazy(() =>
  import('../components/gpt/RAGDatasetManager').then((m) => ({ default: m.RAGDatasetManager }))
);

// gpt-management case — replace PlaceholderModule with live component
case 'gpt-management':
  return (
    <Suspense fallback={<ModuleLoadingFallback />}>
      <GPTManagementDashboard />
    </Suspense>
  );

// gpt-rag case — replace PlaceholderModule with live component
case 'gpt-rag':
  return (
    <Suspense fallback={<ModuleLoadingFallback />}>
      <RAGDatasetManager />
    </Suspense>
  );

// gpt-studio, gpt-marketplace, gpt-builder, gpt-analytics — upgrade from PlaceholderModule to QueuedModuleSurface
case 'gpt-studio':
  return (
    <QueuedModuleSurface
      name='GPT Studio'
      description='Interactive GPT prompt studio — prompt engineering, template management, and AI workflow design.'
      moduleId='gpt-studio'
      suiteAccentVar='--tf-suite-gpt'
    />
  );

case 'gpt-marketplace':
  return (
    <QueuedModuleSurface
      name='GPT Marketplace'
      description='GPT model & prompt marketplace — browse, install, and manage AI models and prompt templates.'
      moduleId='gpt-marketplace'
      suiteAccentVar='--tf-suite-gpt'
    />
  );

case 'gpt-builder':
  return (
    <QueuedModuleSurface
      name='GPT Builder'
      description='Custom GPT builder — create domain-specific AI agents for county workflows with no-code configuration.'
      moduleId='gpt-builder'
      suiteAccentVar='--tf-suite-gpt'
    />
  );

case 'gpt-analytics':
  return (
    <QueuedModuleSurface
      name='GPT Analytics'
      description='GPT usage analytics — token consumption, model performance, cost tracking, and ROI metrics.'
      moduleId='gpt-analytics'
      suiteAccentVar='--tf-suite-gpt'
    />
  );
```

### Allowed Files
```
frontend/apps/os-shell/src/config/moduleComponents.tsx
```

### Forbidden Files
```
frontend/apps/os-shell/src/pages/suites/GptSuiteHome.tsx      (already live, do not touch)
frontend/apps/os-shell/src/components/gpt/GPTManagementDashboard.tsx
frontend/apps/os-shell/src/components/gpt/RAGDatasetManager.tsx
frontend/apps/os-shell/src/components/suites/QueuedModuleSurface.tsx
```

### Required Changes

**Step 1** — Add two lazy imports in the lazy components section (~line 250):
```typescript
// GPT Live Modules (R3 — registered live in GptSuiteHome)
const GPTManagementDashboard = lazy(() =>
  import('../components/gpt/GPTManagementDashboard').then((m) => ({ default: m.GPTManagementDashboard }))
);
const RAGDatasetManager = lazy(() =>
  import('../components/gpt/RAGDatasetManager').then((m) => ({ default: m.RAGDatasetManager }))
);
```

**Step 2** — Replace the `gpt-management` case (line ~1036-1048):
```typescript
case 'gpt-management':
  return (
    <Suspense fallback={<ModuleLoadingFallback />}>
      <GPTManagementDashboard />
    </Suspense>
  );
```

**Step 3** — Replace the `gpt-rag` case (line ~1075-1087):
```typescript
case 'gpt-rag':
  return (
    <Suspense fallback={<ModuleLoadingFallback />}>
      <RAGDatasetManager />
    </Suspense>
  );
```

**Step 4** — Replace the `gpt-studio` case (line ~1010-1022):
```typescript
case 'gpt-studio':
  return (
    <QueuedModuleSurface
      name='GPT Studio'
      description='Interactive GPT prompt studio — prompt engineering, template management, and AI workflow design.'
      moduleId='gpt-studio'
      suiteAccentVar='--tf-suite-gpt'
    />
  );
```

**Step 5** — Replace the `gpt-marketplace` case (line ~1023-1035):
```typescript
case 'gpt-marketplace':
  return (
    <QueuedModuleSurface
      name='GPT Marketplace'
      description='GPT model & prompt marketplace — browse, install, and manage AI models and prompt templates.'
      moduleId='gpt-marketplace'
      suiteAccentVar='--tf-suite-gpt'
    />
  );
```

**Step 6** — Replace the `gpt-builder` case (line ~1049-1061):
```typescript
case 'gpt-builder':
  return (
    <QueuedModuleSurface
      name='GPT Builder'
      description='Custom GPT builder — create domain-specific AI agents for county workflows with no-code configuration.'
      moduleId='gpt-builder'
      suiteAccentVar='--tf-suite-gpt'
    />
  );
```

**Step 7** — Replace the `gpt-analytics` case (line ~1062-1074):
```typescript
case 'gpt-analytics':
  return (
    <QueuedModuleSurface
      name='GPT Analytics'
      description='GPT usage analytics — token consumption, model performance, cost tracking, and ROI metrics.'
      moduleId='gpt-analytics'
      suiteAccentVar='--tf-suite-gpt'
    />
  );
```

### Do Not Do
- Do NOT modify `GptSuiteHome.tsx` — it already renders correctly; the fix is in the module switch only
- Do NOT change the switch case IDs — `gpt-management`, `gpt-rag` etc. must remain
- Do NOT modify `document-manager`, `terra-miner`, or `legislative-pulse` — out of scope for this card
- Do NOT add `GPTManagementDashboard` or `RAGDatasetManager` as non-lazy direct imports — must be lazy

### Proof Gates
```bash
pnpm run type-check
node --test os-platform/core/tests/phase83-tools.test.mjs
```

Both must exit 0.

### Expected Evidence
- `pnpm run type-check` exits 0
- `phase83-tools.test.mjs` exits 0
- Changed files: exactly **1** (`moduleComponents.tsx`)
- What the user will notice: Opening `gpt-management` or `gpt-rag` as a standalone module window now renders the real GPT Management Dashboard / RAG Dataset Manager instead of a placeholder screen. GPT Studio, Marketplace, Builder, Analytics now show the canonical queued surface with the GPT blue accent instead of the old placeholder.

### Stop Condition
This card closes when:
1. Both proof gates pass (exit 0)
2. Commit message follows format: `feat(phase44b): resolve GPT standalone module conflict + queued surface upgrade`
3. Evidence posted: changed file + gate results + one sentence of what changed

---

## Phase 44 Commit Plan

**Card 44-A commit:**
```
feat(phase44a): workbench tab truth audit — clerk/treasury/audit queued disclosure

Matrix row: Tranche 2B — RESERVED FUTURE verticals (TerraClerk, TerraTreasury, TerraAudit)
Surface registry: all 3 tabs now route to QueuedModuleSurface instead of live-looking placeholders

Evidence:
- type-check: exit 0
- phase83-tools: pass
- Changed files: PropertyWorkbench.tsx (1 file)

Government: FISMA compliance
AI-Collaboration: Copilot
```

**Card 44-B commit:**
```
feat(phase44b): resolve GPT standalone conflict + upgrade queued GPT modules to canon surface

Matrix row: gpt-management / gpt-rag — R3 live components now render standalone
Canon upgrade: gpt-studio/marketplace/builder/analytics PlaceholderModule → QueuedModuleSurface

Evidence:
- type-check: exit 0
- phase83-tools: pass
- Changed files: moduleComponents.tsx (1 file)

Government: FISMA compliance
AI-Collaboration: Copilot
```

---

## Surface Matrix Delta (after Phase 44)

| Module | Before Phase 44 | After Phase 44 |
|--------|----------------|----------------|
| Workbench Clerk tab | R2 proof-gap (no disclosure) | R1 queued-safe (QueuedModuleSurface) |
| Workbench Treasury tab | R2 proof-gap (no disclosure) | R1 queued-safe (QueuedModuleSurface) |
| Workbench Audit tab | R2 proof-gap (no disclosure) | R1 queued-safe (QueuedModuleSurface) |
| gpt-management (standalone) | R0 conflict (live in suite, placeholder standalone) | R3 live (consistent) |
| gpt-rag (standalone) | R0 conflict (live in suite, placeholder standalone) | R3 live (consistent) |
| gpt-studio | PlaceholderModule (legacy) | R1 queued-safe (QueuedModuleSurface) |
| gpt-marketplace | PlaceholderModule (legacy) | R1 queued-safe (QueuedModuleSurface) |
| gpt-builder | PlaceholderModule (legacy) | R1 queued-safe (QueuedModuleSurface) |
| gpt-analytics | PlaceholderModule (legacy) | R1 queued-safe (QueuedModuleSurface) |
