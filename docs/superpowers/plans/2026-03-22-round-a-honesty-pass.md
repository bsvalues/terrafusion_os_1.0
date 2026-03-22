# Round A — Honesty Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate unsupported data claims from all four mounted workbench tabs (PropertyDais, PropertyForge, PropertyAtlas, PropertySummary) by adding `WorkbenchSourceBadge` disclosure and removing fixture-backed numerical claims presented without disclosure.

**Architecture:** Hub-and-spoke. Stream 0 builds shared infra (`WorkbenchSourceBadge` + `useSourceDisclosure`) directly on main and merges before any stream begins. Streams 1–4 work in isolated git worktrees in parallel after Stream 0 merges, then merge back to main in priority order: dais → forge → atlas → summary.

**Tech Stack:** React 18, TypeScript 5.3, Vitest (test command: `npm test` or `npx vitest run` from `frontend/`), Testing Library, `FreshData<T>` envelope from `src/lib/freshData.ts`, shadcn `Badge` (`variant="outline"`) from `src/components/ui/badge.tsx`, `BentoCard` from `src/ui/materials/BentoCard`.

---

## File Structure

```
# Stream 0 — new files (on main branch, no worktree needed)
frontend/apps/os-shell/src/components/workbench/WorkbenchSourceBadge.tsx   (CREATE)
frontend/apps/os-shell/src/hooks/useSourceDisclosure.ts                     (CREATE)
frontend/apps/os-shell/src/components/workbench/index.ts                    (MODIFY — add export)
frontend/apps/os-shell/src/__tests__/workbench/WorkbenchSourceBadge.test.tsx (CREATE)
frontend/apps/os-shell/src/__tests__/hooks/useSourceDisclosure.test.ts      (CREATE)

# Stream 1 (worktree: ../tf-honesty-dais, branch: honesty/dais)
frontend/apps/os-shell/src/pages/workbench/tabs/PropertyDais.tsx            (MODIFY)
frontend/apps/os-shell/src/__tests__/workbench/PropertyDais.honesty.contract.test.tsx (CREATE)

# Stream 2 (worktree: ../tf-honesty-forge, branch: honesty/forge)
frontend/apps/os-shell/src/pages/workbench/tabs/PropertyForge.tsx           (MODIFY)
frontend/apps/os-shell/src/__tests__/workbench/PropertyForge.honesty.contract.test.tsx (CREATE)

# Stream 3 (worktree: ../tf-honesty-atlas, branch: honesty/atlas)
frontend/apps/os-shell/src/pages/workbench/tabs/PropertyAtlas.tsx           (MODIFY)
frontend/apps/os-shell/src/__tests__/workbench/PropertyAtlas.honesty.contract.test.tsx (CREATE)

# Stream 4 (worktree: ../tf-honesty-summary, branch: honesty/summary)
frontend/apps/os-shell/src/pages/workbench/tabs/PropertySummary.tsx        (MODIFY)
frontend/apps/os-shell/src/__tests__/workbench/PropertySummary.honesty.contract.test.tsx (CREATE)
```

---

## STREAM 0 — Shared Infra (main branch directly — no worktree)

> **Stream 0 runs on the main branch.** No separate worktree is needed.
> **Must merge and gate before any stream worktree opens.**
> All commands run from the repo root `C:/Users/bsval/terrafusion_os_1.0/` unless noted.

---

### Task 0.1: `useSourceDisclosure` hook

**Files:**
- Create: `frontend/apps/os-shell/src/hooks/useSourceDisclosure.ts`
- Create: `frontend/apps/os-shell/src/__tests__/hooks/useSourceDisclosure.test.ts`

- [ ] **Step 1: Write the failing test**

Create `frontend/apps/os-shell/src/__tests__/hooks/useSourceDisclosure.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { useSourceDisclosure } from '../../hooks/useSourceDisclosure';
import type { FreshData } from '../../lib/freshData';

function makeFresh<T>(overrides: Partial<FreshData<T>> = {}): FreshData<T> {
  return {
    data: null,
    isLoading: false,
    error: null,
    lastUpdated: null,
    source: 'unavailable',
    isStale: false,
    ...overrides,
  };
}

describe('useSourceDisclosure', () => {
  it('returns unavailable when data is null', () => {
    const result = useSourceDisclosure(null);
    expect(result.source).toBe('unavailable');
    expect(result.label).toBe('Unavailable');
    expect(result.variant).toBe('muted');
  });

  it('returns unavailable when FreshData source is unavailable', () => {
    const result = useSourceDisclosure(makeFresh({ source: 'unavailable' }));
    expect(result.source).toBe('unavailable');
    expect(result.variant).toBe('muted');
  });

  it('returns live when source is live and not stale', () => {
    const result = useSourceDisclosure(makeFresh({ source: 'live', isStale: false, data: {} }));
    expect(result.source).toBe('live');
    expect(result.label).toBe('Live');
    expect(result.variant).toBe('success');
  });

  it('returns live when source is polled and not stale', () => {
    const result = useSourceDisclosure(makeFresh({ source: 'polled', isStale: false, data: {} }));
    expect(result.source).toBe('live');
    expect(result.label).toBe('Live');
  });

  it('returns fallback when source is live but isStale', () => {
    const result = useSourceDisclosure(makeFresh({ source: 'live', isStale: true, data: {} }));
    expect(result.source).toBe('fallback');
    expect(result.label).toBe('Demo data');
    expect(result.variant).toBe('warning');
  });

  it('returns fallback when source is fallback', () => {
    const result = useSourceDisclosure(makeFresh({ source: 'fallback', data: {} }));
    expect(result.source).toBe('fallback');
    expect(result.label).toBe('Demo data');
    expect(result.variant).toBe('warning');
  });

  it('returns partial when live and liveFields < totalFields', () => {
    const result = useSourceDisclosure(
      makeFresh({ source: 'live', isStale: false, data: {} }),
      { liveFields: 3, totalFields: 8 },
    );
    expect(result.source).toBe('partial');
    expect(result.label).toBe('Partial — 3 of 8 fields live');
    expect(result.variant).toBe('warning');
  });

  it('returns live (not partial) when liveFields equals totalFields', () => {
    const result = useSourceDisclosure(
      makeFresh({ source: 'live', isStale: false, data: {} }),
      { liveFields: 5, totalFields: 5 },
    );
    expect(result.source).toBe('live');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && npx vitest run apps/os-shell/src/__tests__/hooks/useSourceDisclosure.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `useSourceDisclosure`**

Create `frontend/apps/os-shell/src/hooks/useSourceDisclosure.ts`:

```typescript
import type { FreshData } from '../lib/freshData';

export type DisclosureSource = 'live' | 'partial' | 'fallback' | 'unavailable';

export interface DisclosureResult {
  source: DisclosureSource;
  label: string;
  /** Design-system badge severity.
   *  live → success, partial → warning, fallback → warning, unavailable → muted */
  variant: 'success' | 'warning' | 'muted';
}

const UNAVAILABLE: DisclosureResult = {
  source: 'unavailable',
  label: 'Unavailable',
  variant: 'muted',
};

export function useSourceDisclosure(
  data: FreshData<unknown> | null,
  opts?: { liveFields?: number; totalFields?: number },
): DisclosureResult {
  if (data === null) return UNAVAILABLE;

  const { source, isStale } = data;

  if (source === 'unavailable') return UNAVAILABLE;

  if (source === 'live' || source === 'polled') {
    if (isStale) {
      return { source: 'fallback', label: 'Demo data', variant: 'warning' };
    }
    const { liveFields, totalFields } = opts ?? {};
    if (liveFields != null && totalFields != null && liveFields < totalFields) {
      return {
        source: 'partial',
        label: `Partial — ${liveFields} of ${totalFields} fields live`,
        variant: 'warning',
      };
    }
    return { source: 'live', label: 'Live', variant: 'success' };
  }

  // source === 'fallback'
  return { source: 'fallback', label: 'Demo data', variant: 'warning' };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd frontend && npx vitest run apps/os-shell/src/__tests__/hooks/useSourceDisclosure.test.ts
```

Expected: 8 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/apps/os-shell/src/hooks/useSourceDisclosure.ts \
        frontend/apps/os-shell/src/__tests__/hooks/useSourceDisclosure.test.ts
git commit -m "feat(honesty): useSourceDisclosure — maps FreshData envelope to badge props"
```

---

### Task 0.2: `WorkbenchSourceBadge` component

**Files:**
- Create: `frontend/apps/os-shell/src/components/workbench/WorkbenchSourceBadge.tsx`
- Create: `frontend/apps/os-shell/src/__tests__/workbench/WorkbenchSourceBadge.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `frontend/apps/os-shell/src/__tests__/workbench/WorkbenchSourceBadge.test.tsx`:

```typescript
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorkbenchSourceBadge } from '../../components/workbench/WorkbenchSourceBadge';

describe('WorkbenchSourceBadge', () => {
  it('renders Live badge for live source', () => {
    render(<WorkbenchSourceBadge source="live" />);
    const badge = screen.getByTestId('workbench-source-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Live');
    expect(badge).toHaveAttribute('data-source', 'live');
  });

  it('renders Demo data badge for fallback source', () => {
    render(<WorkbenchSourceBadge source="fallback" />);
    const badge = screen.getByTestId('workbench-source-badge');
    expect(badge).toHaveTextContent('Demo data');
    expect(badge).toHaveAttribute('data-source', 'fallback');
  });

  it('renders Unavailable badge for unavailable source', () => {
    render(<WorkbenchSourceBadge source="unavailable" />);
    expect(screen.getByTestId('workbench-source-badge')).toHaveTextContent('Unavailable');
  });

  it('renders partial label with field counts', () => {
    render(<WorkbenchSourceBadge source="partial" liveFields={3} totalFields={8} />);
    expect(screen.getByTestId('workbench-source-badge')).toHaveTextContent(
      'Partial — 3 of 8 fields live',
    );
  });

  it('renders partial label without counts when counts omitted', () => {
    render(<WorkbenchSourceBadge source="partial" />);
    expect(screen.getByTestId('workbench-source-badge')).toHaveTextContent('Partial');
  });

  it('accepts className prop', () => {
    render(<WorkbenchSourceBadge source="live" className="ml-2" />);
    expect(screen.getByTestId('workbench-source-badge')).toHaveClass('ml-2');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && npx vitest run apps/os-shell/src/__tests__/workbench/WorkbenchSourceBadge.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `WorkbenchSourceBadge`**

Create `frontend/apps/os-shell/src/components/workbench/WorkbenchSourceBadge.tsx`:

```typescript
import React from 'react';
import { Badge } from '../ui/badge';
import type { DisclosureSource } from '../../hooks/useSourceDisclosure';

export type { DisclosureSource };

interface WorkbenchSourceBadgeProps {
  source: DisclosureSource;
  /** Only used when source is 'partial' */
  liveFields?: number;
  totalFields?: number;
  className?: string;
}

const SOURCE_STYLE: Record<DisclosureSource, React.CSSProperties> = {
  live:        { color: 'hsl(142 76% 36%)', borderColor: 'hsl(142 76% 36% / 0.4)' },
  partial:     { color: 'hsl(38 92% 50%)',  borderColor: 'hsl(38 92% 50% / 0.4)' },
  fallback:    { color: 'hsl(38 92% 50%)',  borderColor: 'hsl(38 92% 50% / 0.4)' },
  unavailable: { color: 'hsl(215 16% 47%)', borderColor: 'hsl(215 16% 47% / 0.4)' },
};

function getLabel(
  source: DisclosureSource,
  liveFields?: number,
  totalFields?: number,
): string {
  if (source === 'partial') {
    return liveFields != null && totalFields != null
      ? `Partial — ${liveFields} of ${totalFields} fields live`
      : 'Partial';
  }
  const LABELS: Record<Exclude<DisclosureSource, 'partial'>, string> = {
    live: 'Live',
    fallback: 'Demo data',
    unavailable: 'Unavailable',
  };
  return LABELS[source];
}

export function WorkbenchSourceBadge({
  source,
  liveFields,
  totalFields,
  className,
}: WorkbenchSourceBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={className}
      style={SOURCE_STYLE[source]}
      data-testid="workbench-source-badge"
      data-source={source}
    >
      {getLabel(source, liveFields, totalFields)}
    </Badge>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd frontend && npx vitest run apps/os-shell/src/__tests__/workbench/WorkbenchSourceBadge.test.tsx
```

Expected: 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/apps/os-shell/src/components/workbench/WorkbenchSourceBadge.tsx \
        frontend/apps/os-shell/src/__tests__/workbench/WorkbenchSourceBadge.test.tsx
git commit -m "feat(honesty): WorkbenchSourceBadge — inline source disclosure pill for workbench tab headers"
```

---

### Task 0.3: Export from workbench index

**Files:**
- Modify: `frontend/apps/os-shell/src/components/workbench/index.ts`

- [ ] **Step 1: Add export**

Append to the end of `frontend/apps/os-shell/src/components/workbench/index.ts`:

```typescript
export { WorkbenchSourceBadge, type DisclosureSource } from './WorkbenchSourceBadge';
```

- [ ] **Step 2: Run type-check to verify no regressions**

```bash
cd frontend && npm run type-check
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/apps/os-shell/src/components/workbench/index.ts
git commit -m "feat(honesty): export WorkbenchSourceBadge from workbench index"
```

---

### Task 0.4: Stream 0 proof wall + create parallel worktrees

- [ ] **Step 1: Run targeted tests**

```bash
cd frontend && npx vitest run \
  apps/os-shell/src/__tests__/hooks/useSourceDisclosure.test.ts \
  apps/os-shell/src/__tests__/workbench/WorkbenchSourceBadge.test.tsx
```

Expected: 14 tests PASS, 0 failures.

- [ ] **Step 2: Type-check**

```bash
cd frontend && npm run type-check
```

Expected: 0 errors.

- [ ] **Step 3: Run Phase 8 tools regression (from repo root)**

```bash
# Run from C:/Users/bsval/terrafusion_os_1.0/ — NOT from inside frontend/
node --test os-platform/core/tests/phase83-tools.test.mjs
```

Expected: PASS.

- [ ] **Step 4: Create all 4 worktrees from updated main**

```bash
# Run from repo root. -b creates new branches.
git worktree add ../tf-honesty-dais    -b honesty/dais
git worktree add ../tf-honesty-forge   -b honesty/forge
git worktree add ../tf-honesty-atlas   -b honesty/atlas
git worktree add ../tf-honesty-summary -b honesty/summary
```

**Streams 1–4 can now run in parallel in their respective worktrees.**

---

## STREAM 1 — PropertyDais Honesty Pass

> **Worktree:** `../tf-honesty-dais` (branch `honesty/dais`)
> All commands run from `../tf-honesty-dais/` (the worktree root) or `../tf-honesty-dais/frontend/`.

---

### Task 1.1: Claim Mapper — inventory PropertyDais

**Files:**
- Read: `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyDais.tsx` (full file)

- [ ] **Step 1: Read the full file**

```bash
cat frontend/apps/os-shell/src/pages/workbench/tabs/PropertyDais.tsx
```

- [ ] **Step 2: Produce claim inventory**

For every value rendered to the UI, classify:

| Rendered text / value | Source | Verdict |
|----------------------|--------|---------|
| Queue stat counts (pending/processing/etc.) at **idle** | hardcoded or none | ❌ if hardcoded |
| Queue stat counts after `get_queue_statistics` invocation | tool result | ✅ live |
| Any numeric/string defaults shown before first invocation | hardcoded | ❌ unsupported |

**Rule:** A tool-invocation tab is honest at the result level. It is dishonest if it shows hardcoded example values in `status === 'idle'` state without disclosure. Find and list every hardcoded value shown when `status === 'idle'`.

- [ ] **Step 3: Write exact strings to assert absent**

Write down every hardcoded string rendered at idle state (e.g., `"847"`, `"Queue: 1,204"`, etc.). These become `expect(screen.queryByText(/EXACT/)).not.toBeInTheDocument()` assertions in Task 1.2.

---

### Task 1.2: Write failing honesty contract test

**Files:**
- Create: `frontend/apps/os-shell/src/__tests__/workbench/PropertyDais.honesty.contract.test.tsx`

- [ ] **Step 1: Write the test (fill in CLAIM strings from Task 1.1)**

```typescript
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../context/workbenchTabContext', () => ({
  useWorkbenchTab: () => ({
    parcelId: 'TEST-001',
    propertyData: { parcelId: 'TEST-001', address: '123 Test St', owner: 'Test Owner' },
  }),
}));
vi.mock('../../../api/pilotApi', () => ({ invokeTool: vi.fn() }));
vi.mock('../../../stores/propertyStore', () => ({
  usePropertyStore: vi.fn(() => null),
}));
vi.mock('../../../runtime/env', () => ({
  getEnv: () => ({ VITE_API_URL: 'http://localhost:5000' }),
}));
vi.mock('../../../components/dais/AppealDeadlinePanel', () => ({
  default: () => <div data-testid="mock-appeal-deadline" />,
}));
vi.mock('../../../components/dais/AppealHearingPanel', () => ({
  default: () => <div data-testid="mock-appeal-hearing" />,
}));
vi.mock('../../../components/dais/AppealNoticePanel', () => ({
  default: () => <div data-testid="mock-appeal-notice" />,
}));
vi.mock('../../../components/dais/AppealCertificationPanel', () => ({
  default: () => <div data-testid="mock-appeal-certification" />,
}));

import { PropertyDais } from '../../../pages/workbench/tabs/PropertyDais';

describe('PropertyDais source honesty contract', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders WorkbenchSourceBadge on the Queue Statistics card at idle state', () => {
    render(<MemoryRouter><PropertyDais /></MemoryRouter>);

    // Badge must be present — source should be unavailable before any tool invocation
    const badge = screen.getByTestId('workbench-source-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute('data-source', 'unavailable');
  });

  it('does not display hardcoded queue counts at idle without disclosure', () => {
    render(<MemoryRouter><PropertyDais /></MemoryRouter>);

    // The component must not render a result panel in success state without a tool call.
    // This is the baseline assertion — fill in specific strings from Task 1.1 inventory below.
    expect(screen.queryByTestId('result-panel-success')).not.toBeInTheDocument();

    // From Task 1.1 inventory — for each hardcoded idle-state string found, add:
    // expect(screen.queryByText(/HARDCODED_CLAIM/)).not.toBeInTheDocument();
    //
    // Example (replace with real strings after claim inventory):
    // expect(screen.queryByText(/847 parcels pending/i)).not.toBeInTheDocument();
  });

  it('does not invoke the queue tool on mount without user action', async () => {
    render(<MemoryRouter><PropertyDais /></MemoryRouter>);

    const { invokeTool } = await import('../../../api/pilotApi');
    expect(vi.mocked(invokeTool)).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd ../tf-honesty-dais/frontend && npx vitest run apps/os-shell/src/__tests__/workbench/PropertyDais.honesty.contract.test.tsx
```

Expected: FAIL — `workbench-source-badge` not found.

---

### Task 1.3: Patch PropertyDais

**Files:**
- Modify: `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyDais.tsx`

- [ ] **Step 1: Add WorkbenchSourceBadge import**

Add to the imports:

```typescript
import { WorkbenchSourceBadge } from '../../../components/workbench/WorkbenchSourceBadge';
```

- [ ] **Step 2: Add badge to Queue Statistics card header**

Locate the Queue Statistics card (the card that displays `get_queue_statistics` results). In its card header or title area, add exactly one badge. Identify the state variable tracking the `get_queue_statistics` invocation (e.g., `queueState`) and write:

```tsx
<WorkbenchSourceBadge
  source={queueState.status === 'success' ? 'live' : 'unavailable'}
  className="ml-2"
/>
```

Adapt `queueState` to match the actual variable name in the file.

- [ ] **Step 3: Remove hardcoded idle-state values**

For each string flagged as "unsupported" in Task 1.1:
- If shown only when `status === 'idle'`: remove or replace with `—`
- If shown as a placeholder/example while idle: remove entirely
- Do NOT change tool result rendering — those values are live after invocation

- [ ] **Step 4: Run the contract test to verify it passes**

```bash
cd ../tf-honesty-dais/frontend && npx vitest run apps/os-shell/src/__tests__/workbench/PropertyDais.honesty.contract.test.tsx
```

Expected: 3 tests PASS.

---

### Task 1.4: Dais proof wall + ops note + merge

- [ ] **Step 1: Run targeted proof wall (from worktree root)**

```bash
cd ../tf-honesty-dais

# Test
cd frontend && npx vitest run apps/os-shell/src/__tests__/workbench/PropertyDais.honesty.contract.test.tsx
cd ..

# Type-check
cd frontend && npm run type-check
cd ..

# Phase 8 tools regression — run from worktree ROOT (not inside frontend/)
node --test os-platform/core/tests/phase83-tools.test.mjs
```

Expected: all PASS, 0 TS errors.

- [ ] **Step 2: Commit**

```bash
git add frontend/apps/os-shell/src/pages/workbench/tabs/PropertyDais.tsx \
        frontend/apps/os-shell/src/__tests__/workbench/PropertyDais.honesty.contract.test.tsx
git commit -m "feat(honesty/dais): WorkbenchSourceBadge on Queue Statistics; remove idle-state unsupported claims"
```

- [ ] **Step 3: Write ops evidence note**

Create `os-platform/core/pilot/ops/honesty-dais-round-a-2026-03-22.md`:

```markdown
---
date: 2026-03-22
stream: honesty/dais
round: A
status: complete
---

## PropertyDais Honesty Pass — Round A

**Claims removed:** [list exact strings removed]
**Badge added:** WorkbenchSourceBadge on Queue Statistics card header
**Source at idle:** unavailable
**Source after get_queue_statistics success:** live
**Contract test:** src/__tests__/workbench/PropertyDais.honesty.contract.test.tsx
**Proof wall:** PASS
```

- [ ] **Step 4: Merge to main (first stream to merge)**

```bash
cd C:/Users/bsval/terrafusion_os_1.0
git merge honesty/dais --no-ff -m "seal(honesty/dais): round-a complete"
```

---

## STREAM 2 — PropertyForge Honesty Pass

> **Worktree:** `../tf-honesty-forge` (branch `honesty/forge`)

---

### Task 2.1: Claim Mapper — inventory PropertyForge

**Files:**
- Read: `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyForge.tsx` (full file)
- Read: `frontend/apps/os-shell/src/pages/workbench/tabs/forge/ForgeOverview.tsx` (full file)
- Read: `frontend/apps/os-shell/src/pages/workbench/tabs/forge/Reconciliation.tsx` (full file)

- [ ] **Step 1: Read all sub-tab files**

```bash
cat frontend/apps/os-shell/src/pages/workbench/tabs/forge/ForgeOverview.tsx
cat frontend/apps/os-shell/src/pages/workbench/tabs/forge/Reconciliation.tsx
```

- [ ] **Step 2: Produce claim inventory**

Focus areas:
- **ForgeOverview:** Valuation summary cards — are numbers from tool results or hardcoded?
- **Reconciliation:** "Final indicated value" — computed/tool result or hardcoded?

Classify each rendered value: ✅ live (tool result) | ❌ unsupported (hardcoded at idle) | ⚠ needs badge.

- [ ] **Step 3: Count how many cards will get badges**

Note this count — the contract test uses `getAllByTestId` if more than one badge renders.

---

### Task 2.2: Write failing honesty contract test

**Files:**
- Create: `frontend/apps/os-shell/src/__tests__/workbench/PropertyForge.honesty.contract.test.tsx`

- [ ] **Step 1: Write the test**

```typescript
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../context/workbenchTabContext', () => ({
  useWorkbenchTab: () => ({
    parcelId: 'TEST-001',
    propertyData: { parcelId: 'TEST-001', address: '123 Test St', owner: 'Test Owner' },
  }),
}));
vi.mock('../../../api/pilotApi', () => ({ invokeTool: vi.fn() }));
vi.mock('../../../stores/propertyStore', () => ({
  usePropertyStore: vi.fn(() => null),
}));
vi.mock('../../../runtime/env', () => ({
  getEnv: () => ({ VITE_API_URL: 'http://localhost:5000' }),
}));

import { PropertyForge } from '../../../pages/workbench/tabs/PropertyForge';

describe('PropertyForge source honesty contract', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders at least one WorkbenchSourceBadge', () => {
    render(<MemoryRouter><PropertyForge /></MemoryRouter>);
    // Use getAllByTestId — multiple badges may render across sub-tabs
    const badges = screen.getAllByTestId('workbench-source-badge');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('all badges show unavailable at idle before any tool invocation', () => {
    render(<MemoryRouter><PropertyForge /></MemoryRouter>);
    const badges = screen.getAllByTestId('workbench-source-badge');
    for (const badge of badges) {
      expect(badge).toHaveAttribute('data-source', 'unavailable');
    }
  });

  it('does not invoke valuation tools on mount without user action', async () => {
    render(<MemoryRouter><PropertyForge /></MemoryRouter>);
    const { invokeTool } = await import('../../../api/pilotApi');
    expect(vi.mocked(invokeTool)).not.toHaveBeenCalled();
  });

  it('does not display hardcoded final indicated values at idle', () => {
    render(<MemoryRouter><PropertyForge /></MemoryRouter>);
    // Baseline: no result-panel success state without a tool call
    expect(screen.queryByTestId('result-panel-success')).not.toBeInTheDocument();
    // From Task 2.1 inventory — add specific string assertions here:
    // expect(screen.queryByText(/\$425,000/)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd ../tf-honesty-forge/frontend && npx vitest run apps/os-shell/src/__tests__/workbench/PropertyForge.honesty.contract.test.tsx
```

Expected: FAIL.

---

### Task 2.3: Patch PropertyForge

**Files:**
- Modify: `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyForge.tsx`
- Modify sub-tab files as needed (ForgeOverview.tsx, Reconciliation.tsx) based on claim inventory

- [ ] **Step 1: Add import to relevant sub-tab files**

In each file that gets a badge:

```typescript
import { WorkbenchSourceBadge } from '../../../../components/workbench/WorkbenchSourceBadge';
```

(Note: adjust relative path depth based on file location — ForgeOverview.tsx is one level deeper than PropertyForge.tsx.)

- [ ] **Step 2: Add badge to each identified card header**

One badge per card that has unsupported claims. Example for ForgeOverview:

```tsx
<WorkbenchSourceBadge
  source={overviewState.status === 'success' ? 'live' : 'unavailable'}
  className="ml-2"
/>
```

Adapt the state variable name to match what the file actually uses.

- [ ] **Step 3: Remove hardcoded idle-state values**

Based on Task 2.1 inventory — replace hardcoded numbers at idle with `—` or remove.

- [ ] **Step 4: Run contract test to verify it passes**

```bash
cd ../tf-honesty-forge/frontend && npx vitest run apps/os-shell/src/__tests__/workbench/PropertyForge.honesty.contract.test.tsx
```

Expected: 4 tests PASS.

---

### Task 2.4: Forge proof wall + ops note + merge

- [ ] **Step 1: Run proof wall**

```bash
cd ../tf-honesty-forge

cd frontend && npx vitest run apps/os-shell/src/__tests__/workbench/PropertyForge.honesty.contract.test.tsx
cd ..

cd frontend && npm run type-check
cd ..

# Phase 8 tools regression — from worktree ROOT
node --test os-platform/core/tests/phase83-tools.test.mjs
```

- [ ] **Step 2: Commit**

```bash
git add frontend/apps/os-shell/src/pages/workbench/tabs/PropertyForge.tsx \
        frontend/apps/os-shell/src/pages/workbench/tabs/forge/ \
        frontend/apps/os-shell/src/__tests__/workbench/PropertyForge.honesty.contract.test.tsx
git commit -m "feat(honesty/forge): WorkbenchSourceBadge on valuation cards; remove idle-state unsupported claims"
```

- [ ] **Step 3: Write ops evidence note**

Create `os-platform/core/pilot/ops/honesty-forge-round-a-2026-03-22.md` (same structure as Dais note).

- [ ] **Step 4: Merge (after dais merges to main)**

```bash
cd C:/Users/bsval/terrafusion_os_1.0
git merge honesty/forge --no-ff -m "seal(honesty/forge): round-a complete"
```

---

## STREAM 3 — PropertyAtlas Honesty Pass

> **Worktree:** `../tf-honesty-atlas` (branch `honesty/atlas`)

---

### Task 3.1: Claim Mapper — inventory PropertyAtlas

**Files:**
- Read: `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyAtlas.tsx` (full file)

- [ ] **Step 1: Read the full file**

```bash
cat frontend/apps/os-shell/src/pages/workbench/tabs/PropertyAtlas.tsx
```

- [ ] **Step 2: Produce claim inventory**

Known focus areas:
- **FEMA flood zone** (`flood.zone`, `flood.risk`) — shown at idle or only after `query_parcel_layers`?
- **Aerial imagery** (`aerial.date`, `aerial.resolution`) — same question
- **Geometry sketch** — JSDoc says "deterministic preview sketch" not real GIS; is this disclosed in UI?

Classify each: ✅ live (tool result) | ❌ unsupported (hardcoded at idle) | ⚠ needs badge.

---

### Task 3.2: Write failing honesty contract test

**Files:**
- Create: `frontend/apps/os-shell/src/__tests__/workbench/PropertyAtlas.honesty.contract.test.tsx`

- [ ] **Step 1: Write the test**

```typescript
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../context/workbenchTabContext', () => ({
  useWorkbenchTab: () => ({
    parcelId: 'TEST-001',
    propertyData: { parcelId: 'TEST-001', address: '123 Test St', owner: 'Test Owner' },
  }),
}));
vi.mock('../../../api/pilotApi', () => ({ invokeTool: vi.fn() }));
vi.mock('../../../stores/propertyStore', () => ({
  usePropertyStore: vi.fn(() => null),
}));
vi.mock('../../../runtime/env', () => ({
  getEnv: () => ({ VITE_API_URL: 'http://localhost:5000' }),
}));

import { PropertyAtlas } from '../../../pages/workbench/tabs/PropertyAtlas';

describe('PropertyAtlas source honesty contract', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders WorkbenchSourceBadge at idle state showing unavailable', () => {
    render(<MemoryRouter><PropertyAtlas /></MemoryRouter>);
    const badge = screen.getByTestId('workbench-source-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute('data-source', 'unavailable');
  });

  it('discloses that full GIS geometry is not available on this route', () => {
    render(<MemoryRouter><PropertyAtlas /></MemoryRouter>);
    expect(screen.getByTestId('atlas-geometry-disclosure')).toBeInTheDocument();
  });

  it('does not display hardcoded layer data at idle without disclosure', () => {
    render(<MemoryRouter><PropertyAtlas /></MemoryRouter>);
    // Baseline: no tool result rendered without invocation
    expect(screen.queryByTestId('result-panel-success')).not.toBeInTheDocument();
    // From Task 3.1 inventory — add specific string assertions:
    // expect(screen.queryByText(/Zone AE/i)).not.toBeInTheDocument();
    // expect(screen.queryByText(/0\.3m resolution/i)).not.toBeInTheDocument();
  });

  it('does not invoke query_parcel_layers on mount', async () => {
    render(<MemoryRouter><PropertyAtlas /></MemoryRouter>);
    const { invokeTool } = await import('../../../api/pilotApi');
    expect(vi.mocked(invokeTool)).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd ../tf-honesty-atlas/frontend && npx vitest run apps/os-shell/src/__tests__/workbench/PropertyAtlas.honesty.contract.test.tsx
```

Expected: FAIL.

---

### Task 3.3: Patch PropertyAtlas

**Files:**
- Modify: `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyAtlas.tsx`

- [ ] **Step 1: Add imports**

```typescript
import { WorkbenchSourceBadge } from '../../../components/workbench/WorkbenchSourceBadge';
```

- [ ] **Step 2: Add badge to the map/layer card header**

```tsx
<WorkbenchSourceBadge
  source={queryState.status === 'success' ? 'live' : 'unavailable'}
  className="ml-2"
/>
```

Adapt `queryState` to the actual variable name.

- [ ] **Step 3: Add geometry disclosure element**

In the map preview/sketch area, add:

```tsx
<p
  data-testid="atlas-geometry-disclosure"
  style={{ fontSize: 11, color: 'hsl(215 16% 47%)', marginTop: 4 }}
>
  Layer preview — full GIS geometry not yet available on this route
</p>
```

- [ ] **Step 4: Remove hardcoded idle-state layer values**

Any hardcoded flood zone or aerial values shown before `query_parcel_layers` is invoked: replace with `—` or remove.

- [ ] **Step 5: Run contract test to verify it passes**

```bash
cd ../tf-honesty-atlas/frontend && npx vitest run apps/os-shell/src/__tests__/workbench/PropertyAtlas.honesty.contract.test.tsx
```

Expected: 4 tests PASS.

---

### Task 3.4: Atlas proof wall + ops note + merge

- [ ] **Step 1: Run proof wall**

```bash
cd ../tf-honesty-atlas

cd frontend && npx vitest run apps/os-shell/src/__tests__/workbench/PropertyAtlas.honesty.contract.test.tsx
cd ..

cd frontend && npm run type-check
cd ..

node --test os-platform/core/tests/phase83-tools.test.mjs
```

- [ ] **Step 2: Commit**

```bash
git add frontend/apps/os-shell/src/pages/workbench/tabs/PropertyAtlas.tsx \
        frontend/apps/os-shell/src/__tests__/workbench/PropertyAtlas.honesty.contract.test.tsx
git commit -m "feat(honesty/atlas): WorkbenchSourceBadge + geometry disclosure; remove idle-state layer claims"
```

- [ ] **Step 3: Write ops evidence note**

Create `os-platform/core/pilot/ops/honesty-atlas-round-a-2026-03-22.md`.

- [ ] **Step 4: Merge (after forge merges to main)**

```bash
cd C:/Users/bsval/terrafusion_os_1.0
git merge honesty/atlas --no-ff -m "seal(honesty/atlas): round-a complete"
```

---

## STREAM 4 — PropertySummary Honesty Pass

> **Worktree:** `../tf-honesty-summary` (branch `honesty/summary`)

---

### Task 4.1: Claim Mapper — inventory PropertySummary

**Files:**
- Read: `frontend/apps/os-shell/src/pages/workbench/tabs/PropertySummary.tsx` (full file)

- [ ] **Step 1: Read the full file**

```bash
cat frontend/apps/os-shell/src/pages/workbench/tabs/PropertySummary.tsx
```

- [ ] **Step 2: Produce claim inventory**

Known facts:
- `valuationSource = propertyData.source || 'Unknown'` — source is tracked
- `assessments` and `appeals` come from `usePropertyStore` — live, snapshot, or fixture?
- Is `valuationSource` displayed anywhere in the UI? If not, it must be.

Classify: which fields are store-backed (potentially live) vs hardcoded vs fixture.

---

### Task 4.2: Write failing honesty contract test

**Files:**
- Create: `frontend/apps/os-shell/src/__tests__/workbench/PropertySummary.honesty.contract.test.tsx`

- [ ] **Step 1: Write the test**

```typescript
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const MOCK_PROPERTY = {
  parcelId: 'TEST-001',
  address: '123 Test St',
  owner: 'Test Owner',
  propertyType: 'residential',
  source: 'snapshot' as const,
  marketValue: 350000,
  assessedValue: 315000,
};

vi.mock('../../../context/workbenchTabContext', () => ({
  useWorkbenchTab: () => ({ parcelId: 'TEST-001', propertyData: MOCK_PROPERTY }),
}));
vi.mock('../../../stores/propertyStore', () => ({
  usePropertyStore: vi.fn((selector: (s: unknown) => unknown) =>
    selector({
      activeParcel: { ...MOCK_PROPERTY, city: 'Kennewick', zip: '99336', assessmentYear: 2025 },
      assessments: [],
      appeals: [],
    }),
  ),
}));

import { PropertySummary } from '../../../pages/workbench/tabs/PropertySummary';

describe('PropertySummary source honesty contract', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders WorkbenchSourceBadge indicating the data source', () => {
    render(<MemoryRouter><PropertySummary /></MemoryRouter>);
    const badge = screen.getByTestId('workbench-source-badge');
    expect(badge).toBeInTheDocument();
    // snapshot source maps to fallback (not live)
    expect(badge).toHaveAttribute('data-source', 'fallback');
  });

  it('does not claim assessment values are live when source is snapshot', () => {
    render(<MemoryRouter><PropertySummary /></MemoryRouter>);
    // No 'Live' badge when the source is snapshot
    expect(screen.queryByText('Live')).not.toBeInTheDocument();
  });

  it('badge switches to live when propertyData.source is live', () => {
    vi.mocked(
      // re-import after mock to get the updated context
      require('../../../context/workbenchTabContext').useWorkbenchTab
    ).mockReturnValueOnce({
      parcelId: 'TEST-001',
      propertyData: { ...MOCK_PROPERTY, source: 'live' },
    });

    render(<MemoryRouter><PropertySummary /></MemoryRouter>);
    expect(screen.getByTestId('workbench-source-badge')).toHaveAttribute('data-source', 'live');
  });
});
```

> **Note on the third test:** If the mock pattern above doesn't work cleanly (require vs import), simplify to two tests only — the first two are the required honesty assertions. The third is aspirational.

- [ ] **Step 2: Run to verify it fails**

```bash
cd ../tf-honesty-summary/frontend && npx vitest run apps/os-shell/src/__tests__/workbench/PropertySummary.honesty.contract.test.tsx
```

Expected: FAIL.

---

### Task 4.3: Patch PropertySummary

**Files:**
- Modify: `frontend/apps/os-shell/src/pages/workbench/tabs/PropertySummary.tsx`

- [ ] **Step 1: Add imports**

```typescript
import { WorkbenchSourceBadge } from '../../../components/workbench/WorkbenchSourceBadge';
import type { DisclosureSource } from '../../../hooks/useSourceDisclosure';
```

- [ ] **Step 2: Map `valuationSource` to `DisclosureSource`**

In the component body, after the existing `valuationSource` assignment:

```typescript
const disclosureSource: DisclosureSource =
  valuationSource === 'live' || valuationSource === 'polled' ? 'live' :
  valuationSource === 'unavailable' ? 'unavailable' :
  'fallback'; // 'snapshot', 'fixture', 'Unknown', etc.
```

- [ ] **Step 3: Add badge near the top of the rendered output**

Above the first `BentoGrid` or in a header row:

```tsx
<div className="flex items-center justify-between px-4 pt-2 pb-1">
  <span className="text-xs" style={{ color: 'hsl(215 16% 47%)' }}>Property data</span>
  <WorkbenchSourceBadge source={disclosureSource} />
</div>
```

- [ ] **Step 4: Run contract test to verify it passes**

```bash
cd ../tf-honesty-summary/frontend && npx vitest run apps/os-shell/src/__tests__/workbench/PropertySummary.honesty.contract.test.tsx
```

Expected: at least 2 of 3 tests PASS (see note on third test).

---

### Task 4.4: Summary proof wall + ops note + merge

- [ ] **Step 1: Run proof wall**

```bash
cd ../tf-honesty-summary

cd frontend && npx vitest run apps/os-shell/src/__tests__/workbench/PropertySummary.honesty.contract.test.tsx
cd ..

cd frontend && npm run type-check
cd ..

node --test os-platform/core/tests/phase83-tools.test.mjs
```

- [ ] **Step 2: Commit**

```bash
git add frontend/apps/os-shell/src/pages/workbench/tabs/PropertySummary.tsx \
        frontend/apps/os-shell/src/__tests__/workbench/PropertySummary.honesty.contract.test.tsx
git commit -m "feat(honesty/summary): WorkbenchSourceBadge; disclose snapshot vs live source"
```

- [ ] **Step 3: Write ops evidence note**

Create `os-platform/core/pilot/ops/honesty-summary-round-a-2026-03-22.md`.

- [ ] **Step 4: Merge (last stream)**

```bash
cd C:/Users/bsval/terrafusion_os_1.0
git merge honesty/summary --no-ff -m "seal(honesty/summary): round-a complete"
```

---

## Round A Mainline Gate

> Run from repo root after all five merges land on main: shared + dais + forge + atlas + summary.

- [ ] **Step 1: Full vitest run**

```bash
cd frontend && npm test
```

Expected: 0 failures, skipped ≤ 222.

- [ ] **Step 2: Type-check**

```bash
cd frontend && npm run type-check
```

Expected: 0 errors.

- [ ] **Step 3: Phase 8 tools regression**

```bash
# From repo root
node --test os-platform/core/tests/phase83-tools.test.mjs
```

Expected: PASS.

- [ ] **Step 4: Quality gate**

```bash
cd frontend && npm run quality
```

Expected: lint + format check PASS. (`npm run quality` = `npm run lint && npm run format:check`)

- [ ] **Step 5: Snyk ceiling check**

```bash
cd frontend && npx snyk test --severity-threshold=medium 2>&1 | tail -5
```

Expected: findings count ≤ 71.

- [ ] **Step 6: Phase seal commit**

```bash
git commit --allow-empty -m "seal(cp28): round-a honesty pass complete — WorkbenchSourceBadge deployed across all 4 workbench tabs"
```

**Round A is sealed. Round B plan will be written when this gate passes.**
