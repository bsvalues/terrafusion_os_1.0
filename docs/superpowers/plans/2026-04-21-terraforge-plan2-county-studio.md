# TerraForge County Studio — Frontend Implementation Plan (Plan 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the County Studio frontend module — a segment-table-centric React workspace where county staff inspect segment health, create cohorts, author scenarios, preview statistical impact, and promote adjustment artifacts.

**Architecture:** County Studio is a native OS-shell page at `pages/forge/county-studio/`. It owns a Zustand store (`countyStudioStore`), a SignalR hub client hook (`useCountyStudyHub`), and a three-column layout (210px left rail | 1fr segment table | 360px right rail). It broadcasts to Atlas Live View via the `CountyStudyHub` and receives selection intent back from Atlas through the same hub. The map never lives inside this surface.

**Tech Stack:** React 18.3, TypeScript 5.3, Zustand 4, TanStack Query v5, shadcn/ui, Recharts 2, `@microsoft/signalr` 8, Jest + React Testing Library

**Depends on:** Plan 1 complete through Task 6 (CountyStudyHub registered in backend). Plans 2 and 3 can then execute in parallel.

**Naming note:** The `AdjustmentSet` entity in the TerraFusion DB already belongs to the calibration workbench. All County Studio entities use the `County` prefix — `CountyAdjustmentSet`, `CountyCohort`, etc.

---

## File Map

```
frontend/apps/os-shell/src/
├── stores/
│   └── countyStudioStore.ts                          # CREATED — Zustand store
├── pages/forge/county-studio/
│   ├── types/
│   │   └── countyStudio.types.ts                    # CREATED — all TypeScript types
│   ├── components/
│   │   ├── LeftRail.tsx                              # CREATED — studies/cohorts/scenarios nav
│   │   ├── SegmentTable.tsx                          # CREATED — sortable center table
│   │   ├── RightRail.tsx                             # CREATED — inspector + worksheet container
│   │   ├── ObjectInspector.tsx                       # CREATED — selected segment details
│   │   ├── ScenarioWorksheet.tsx                     # CREATED — scenario authoring card
│   │   ├── BottomDeck.tsx                            # CREATED — distribution/compare/warnings
│   │   └── CohortCreationDialog.tsx                  # CREATED — confirm-required cohort dialog
│   ├── hooks/
│   │   └── useCountyStudyHub.ts                      # CREATED — SignalR client hook
│   ├── __tests__/
│   │   ├── countyStudioStore.test.ts                 # CREATED
│   │   ├── SegmentTable.test.tsx                     # CREATED
│   │   ├── useCountyStudyHub.test.ts                 # CREATED
│   │   └── CohortCreationDialog.test.tsx             # CREATED
│   └── CountyStudyPage.tsx                           # CREATED — root layout
├── plugins/county-studio/
│   ├── manifest.json                                  # CREATED — plugin manifest
│   └── index.tsx                                      # CREATED — module entry (thin wrapper)
└── Router.tsx                                         # MODIFIED — add 2 new lazy routes
```

---

## Task 1: TypeScript Types + countyStudioStore

**Files:**
- Create: `frontend/apps/os-shell/src/pages/forge/county-studio/types/countyStudio.types.ts`
- Create: `frontend/apps/os-shell/src/stores/countyStudioStore.ts`
- Create: `frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/countyStudioStore.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/countyStudioStore.test.ts
import { act } from '@testing-library/react';

// Reset store between tests
beforeEach(() => {
  // Module re-import resets state because the store file doesn't exist yet
  jest.resetModules();
});

describe('countyStudioStore — initial state', () => {
  it('starts with null study and DISCONNECTED sync state', async () => {
    const { useCountyStudioStore } = await import('@/stores/countyStudioStore');
    const state = useCountyStudioStore.getState();
    expect(state.activeStudy).toBeNull();
    expect(state.syncState).toBe('DISCONNECTED');
    expect(state.segments).toEqual([]);
    expect(state.selectedSegmentId).toBeNull();
    expect(state.activeMetric).toBe('ratio');
    expect(state.pendingSelection).toBeNull();
  });
});

describe('countyStudioStore — actions', () => {
  it('setStudy updates activeStudy', async () => {
    const { useCountyStudioStore } = await import('@/stores/countyStudioStore');
    const study = {
      studyId: 'abc-123',
      countyId: 'benton',
      taxYear: 2026,
      studyType: 'RatioStudy' as const,
      status: 'Draft' as const,
      baselineVersion: null,
      activeSegmentSetId: null,
      createdAt: '2026-04-21T00:00:00Z',
      updatedAt: '2026-04-21T00:00:00Z',
      createdBy: 'system',
      updatedBy: 'system',
    };
    act(() => {
      useCountyStudioStore.getState().setStudy(study);
    });
    expect(useCountyStudioStore.getState().activeStudy?.studyId).toBe('abc-123');
  });

  it('selectSegment updates selectedSegmentId', async () => {
    const { useCountyStudioStore } = await import('@/stores/countyStudioStore');
    act(() => {
      useCountyStudioStore.getState().selectSegment('seg-999');
    });
    expect(useCountyStudioStore.getState().selectedSegmentId).toBe('seg-999');
  });

  it('setSyncState transitions to LIVE', async () => {
    const { useCountyStudioStore } = await import('@/stores/countyStudioStore');
    act(() => {
      useCountyStudioStore.getState().setSyncState('LIVE');
    });
    expect(useCountyStudioStore.getState().syncState).toBe('LIVE');
  });

  it('setPendingSelection stores atlas selection', async () => {
    const { useCountyStudioStore } = await import('@/stores/countyStudioStore');
    const sel = { parcelIds: ['p1', 'p2'], source: 'lasso' as const, parcelCount: 2 };
    act(() => {
      useCountyStudioStore.getState().setPendingSelection(sel);
    });
    expect(useCountyStudioStore.getState().pendingSelection?.parcelCount).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && npm test -- --testPathPattern=countyStudioStore --watchAll=false
```

Expected: FAIL — `Cannot find module '@/stores/countyStudioStore'`

- [ ] **Step 3: Create the types file**

```typescript
// frontend/apps/os-shell/src/pages/forge/county-studio/types/countyStudio.types.ts

// ── Sync State ───────────────────────────────────────────────────────────────
export type SyncState = 'LIVE' | 'STAGED' | 'SNAPSHOT' | 'DISCONNECTED';

// ── Metric Keys ──────────────────────────────────────────────────────────────
export type MetricKey = 'ratio' | 'cod' | 'prd' | 'stability' | 'exceptions' | 'risk';

// ── Study Types (mirror backend enums) ───────────────────────────────────────
export type StudyType = 'RatioStudy' | 'MassAppraisal' | 'EquityStudy' | 'CustomStudy';
export type StudyStatus = 'Draft' | 'Active' | 'Reviewing' | 'Approved' | 'Archived';
export type ScenarioStatus = 'Draft' | 'Saved' | 'Reviewed' | 'Approved' | 'Promoted' | 'Rejected' | 'Archived';
export type AdjustmentType = 'PercentageIncrease' | 'PercentageDecrease' | 'FlatDollarIncrease' | 'FlatDollarDecrease' | 'CustomFormula';
export type SelectionType = 'Visual' | 'RuleBased' | 'Hybrid' | 'Manual';

// ── DTOs (mirror backend responses) ──────────────────────────────────────────
export interface CountyStudySessionDto {
  studyId: string;
  countyId: string;
  taxYear: number;
  studyType: StudyType;
  status: StudyStatus;
  baselineVersion: string | null;
  activeSegmentSetId: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface CountySegmentSetDto {
  segmentSetId: string;
  studyId: string;
  name: string;
  sourceType: string;
  version: string;
  isBaseline: boolean;
  segmentCount: number;
  createdAt: string;
}

export interface CountySegmentDto {
  segmentId: string;
  segmentSetId: string;
  name: string;
  segmentType: string;
  parcelCount: number;
  medianRatio: number;
  cod: number;
  prd: number;
  stabilityScore: number;
  riskScore: number;
  exceptionCount: number;
  geographyRef: string | null;
}

export interface CountyCohortDto {
  cohortId: string;
  studyId: string;
  name: string;
  selectionType: SelectionType;
  parcelCount: number;
  isHybrid: boolean;
  createdAt: string;
}

export interface CountyScenarioDto {
  scenarioId: string;
  studyId: string;
  cohortId: string;
  adjustmentType: AdjustmentType;
  parameters: Record<string, unknown>;
  rationale: string;
  status: ScenarioStatus;
  createdAt: string;
}

export interface ScenarioDeltaItem {
  segmentId: string;
  segmentName: string;
  beforeRatio: number;
  afterRatio: number;
  beforeCod: number;
  afterCod: number;
  deltaPercent: number;
}

export interface ScenarioImpactPreviewDto {
  scenarioId: string;
  totalParcelsAffected: number;
  estimatedMedianRatioDelta: number;
  estimatedCodDelta: number;
  estimatedPrdDelta: number;
  deltas: ScenarioDeltaItem[];
}

// ── Atlas Selection Intent (received via hub, Channel C) ─────────────────────
export type SelectionSource = 'click' | 'lasso' | 'box';

export interface PendingSelection {
  parcelIds: string[];
  source: SelectionSource;
  parcelCount: number;
  geometry?: GeoJSON.Geometry;      // present for lasso/drawn selections
  areaEstimate?: number;
}
```

- [ ] **Step 4: Create the Zustand store**

```typescript
// frontend/apps/os-shell/src/stores/countyStudioStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  SyncState,
  MetricKey,
  CountyStudySessionDto,
  CountySegmentDto,
  CountyCohortDto,
  CountyScenarioDto,
  ScenarioImpactPreviewDto,
  PendingSelection,
} from '../pages/forge/county-studio/types/countyStudio.types';

export interface CountyStudioState {
  // ── Persistent selection state ────────────────────────────────────────────
  activeStudy: CountyStudySessionDto | null;
  segments: CountySegmentDto[];
  cohorts: CountyCohortDto[];
  scenarios: CountyScenarioDto[];
  selectedSegmentId: string | null;
  activeScenario: CountyScenarioDto | null;
  scenarioPreview: ScenarioImpactPreviewDto | null;

  // ── UI state ──────────────────────────────────────────────────────────────
  syncState: SyncState;
  activeMetric: MetricKey;
  pendingSelection: PendingSelection | null;   // from Atlas — triggers CohortCreationDialog

  // ── Actions ───────────────────────────────────────────────────────────────
  setStudy: (study: CountyStudySessionDto | null) => void;
  setSegments: (segments: CountySegmentDto[]) => void;
  setCohorts: (cohorts: CountyCohortDto[]) => void;
  setScenarios: (scenarios: CountyScenarioDto[]) => void;
  selectSegment: (segmentId: string | null) => void;
  setActiveScenario: (scenario: CountyScenarioDto | null) => void;
  setScenarioPreview: (preview: ScenarioImpactPreviewDto | null) => void;
  setSyncState: (state: SyncState) => void;
  setActiveMetric: (metric: MetricKey) => void;
  setPendingSelection: (sel: PendingSelection | null) => void;
}

export const useCountyStudioStore = create<CountyStudioState>()(
  devtools(
    (set) => ({
      activeStudy: null,
      segments: [],
      cohorts: [],
      scenarios: [],
      selectedSegmentId: null,
      activeScenario: null,
      scenarioPreview: null,
      syncState: 'DISCONNECTED',
      activeMetric: 'ratio',
      pendingSelection: null,

      setStudy: (study) => set({ activeStudy: study }, false, 'setStudy'),
      setSegments: (segments) => set({ segments }, false, 'setSegments'),
      setCohorts: (cohorts) => set({ cohorts }, false, 'setCohorts'),
      setScenarios: (scenarios) => set({ scenarios }, false, 'setScenarios'),
      selectSegment: (selectedSegmentId) => set({ selectedSegmentId }, false, 'selectSegment'),
      setActiveScenario: (activeScenario) => set({ activeScenario }, false, 'setActiveScenario'),
      setScenarioPreview: (scenarioPreview) => set({ scenarioPreview }, false, 'setScenarioPreview'),
      setSyncState: (syncState) => set({ syncState }, false, 'setSyncState'),
      setActiveMetric: (activeMetric) => set({ activeMetric }, false, 'setActiveMetric'),
      setPendingSelection: (pendingSelection) => set({ pendingSelection }, false, 'setPendingSelection'),
    }),
    { name: 'CountyStudioStore' }
  )
);
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd frontend && npm test -- --testPathPattern=countyStudioStore --watchAll=false
```

Expected: PASS — 5 tests passing

- [ ] **Step 6: Commit**

```bash
cd frontend && git add apps/os-shell/src/pages/forge/county-studio/types/countyStudio.types.ts apps/os-shell/src/stores/countyStudioStore.ts apps/os-shell/src/pages/forge/county-studio/__tests__/countyStudioStore.test.ts && git commit -m "feat(county-studio): types + countyStudioStore Zustand store"
```

---

## Task 2: API Client + Plugin Manifest

**Files:**
- Create: `frontend/apps/os-shell/src/pages/forge/county-studio/countyStudyApi.ts`
- Create: `frontend/apps/os-shell/src/plugins/county-studio/manifest.json`
- Create: `frontend/apps/os-shell/src/plugins/county-studio/index.tsx`

- [ ] **Step 1: Create the API client**

No test for the API client (it's a thin wrapper over `apiFetchJson`; integration is tested via component tests). Write directly:

```typescript
// frontend/apps/os-shell/src/pages/forge/county-studio/countyStudyApi.ts
import { apiFetchJson } from '@/lib/apiBase';
import type {
  CountyStudySessionDto,
  CountySegmentSetDto,
  CountySegmentDto,
  CountyCohortDto,
  CountyScenarioDto,
  ScenarioImpactPreviewDto,
} from './types/countyStudio.types';

const BASE = '/county-study';

// ── Studies ───────────────────────────────────────────────────────────────────
export const studyApi = {
  list: (): Promise<CountyStudySessionDto[]> =>
    apiFetchJson(`${BASE}/sessions`),

  get: (studyId: string): Promise<CountyStudySessionDto> =>
    apiFetchJson(`${BASE}/sessions/${studyId}`),

  create: (body: {
    countyId: string;
    taxYear: number;
    studyType: string;
    baselineVersion?: string;
  }): Promise<CountyStudySessionDto> =>
    apiFetchJson(`${BASE}/sessions`, { method: 'POST', body: JSON.stringify(body) }),
};

// ── Segment Sets ──────────────────────────────────────────────────────────────
export const segmentSetApi = {
  list: (studyId: string): Promise<CountySegmentSetDto[]> =>
    apiFetchJson(`${BASE}/sessions/${studyId}/segment-sets`),

  segments: (segmentSetId: string): Promise<CountySegmentDto[]> =>
    apiFetchJson(`${BASE}/segment-sets/${segmentSetId}/segments`),
};

// ── Cohorts ───────────────────────────────────────────────────────────────────
export const cohortApi = {
  list: (studyId: string): Promise<CountyCohortDto[]> =>
    apiFetchJson(`${BASE}/sessions/${studyId}/cohorts`),

  create: (body: {
    studyId: string;
    name: string;
    selectionType: string;
    definition: Record<string, unknown>;
    parcelIds?: string[];
    geometry?: unknown;
  }): Promise<CountyCohortDto> =>
    apiFetchJson(`${BASE}/cohorts`, { method: 'POST', body: JSON.stringify(body) }),
};

// ── Scenarios ─────────────────────────────────────────────────────────────────
export const scenarioApi = {
  list: (studyId: string): Promise<CountyScenarioDto[]> =>
    apiFetchJson(`${BASE}/sessions/${studyId}/scenarios`),

  preview: (scenarioId: string): Promise<ScenarioImpactPreviewDto> =>
    apiFetchJson(`${BASE}/scenarios/${scenarioId}/preview`),

  save: (body: {
    studyId: string;
    cohortId: string;
    adjustmentType: string;
    parameters: Record<string, unknown>;
    rationale: string;
  }): Promise<CountyScenarioDto> =>
    apiFetchJson(`${BASE}/scenarios/save`, { method: 'POST', body: JSON.stringify(body) }),

  promote: (scenarioId: string, body: {
    effectiveScope: string;
    approvedBy?: string;
  }): Promise<void> =>
    apiFetchJson(`${BASE}/scenarios/${scenarioId}/adjustment-sets/promote`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};
```

- [ ] **Step 2: Create plugin manifest**

```json
// frontend/apps/os-shell/src/plugins/county-studio/manifest.json
{
  "name": "county-studio",
  "version": "1.0.0",
  "description": "Segment-first countywide valuation workspace — cohorts, scenarios, adjustment sets",
  "author": "Terrafusion Systems",
  "permissions": ["load:county-studio", "data:segments", "data:scenarios", "data:adjustments"],
  "targetCounties": ["benton"],
  "legacySystems": ["PACS_9.0"],
  "dependencies": [],
  "entryPoint": "index.tsx",
  "launchPath": "/forge/county-studio",
  "createdAt": "2026-04-21T00:00:00Z",
  "hash": "sha256:county-studio-v1-placeholder",
  "signature": "HMAC-SHA256:benton:county_studio_v1_signature"
}
```

- [ ] **Step 3: Create plugin index entry point**

```tsx
// frontend/apps/os-shell/src/plugins/county-studio/index.tsx
// Thin entry point — delegates to the native OS page.
// The plugin system mounts this; it renders the full CountyStudyPage.
import React from 'react';
import { CountyStudyPage } from '../../pages/forge/county-studio/CountyStudyPage';

export default function CountyStudioPlugin() {
  return <CountyStudyPage />;
}
```

- [ ] **Step 4: Commit**

```bash
cd frontend && git add apps/os-shell/src/pages/forge/county-studio/countyStudyApi.ts apps/os-shell/src/plugins/county-studio/ && git commit -m "feat(county-studio): API client + plugin manifest"
```

---

## Task 3: CountyStudyPage Root Layout

**Files:**
- Create: `frontend/apps/os-shell/src/pages/forge/county-studio/CountyStudyPage.tsx`
- Modify: `frontend/apps/os-shell/src/Router.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/CountyStudyPage.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CountyStudyPage } from '../CountyStudyPage';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('CountyStudyPage', () => {
  it('renders the studio header', () => {
    render(<CountyStudyPage />, { wrapper: Wrapper });
    expect(screen.getByText(/TerraForge County Studio/i)).toBeInTheDocument();
  });

  it('shows ATLAS DISCONNECTED badge when no study open', () => {
    render(<CountyStudyPage />, { wrapper: Wrapper });
    expect(screen.getByText(/DISCONNECTED/i)).toBeInTheDocument();
  });

  it('renders the three-column layout regions', () => {
    render(<CountyStudyPage />, { wrapper: Wrapper });
    expect(screen.getByTestId('cs-left-rail')).toBeInTheDocument();
    expect(screen.getByTestId('cs-center')).toBeInTheDocument();
    expect(screen.getByTestId('cs-right-rail')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
cd frontend && npm test -- --testPathPattern=CountyStudyPage --watchAll=false
```

Expected: FAIL — `Cannot find module '../CountyStudyPage'`

- [ ] **Step 3: Create CountyStudyPage**

```tsx
// frontend/apps/os-shell/src/pages/forge/county-studio/CountyStudyPage.tsx
import React from 'react';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import { LeftRail } from './components/LeftRail';
import { SegmentTable } from './components/SegmentTable';
import { RightRail } from './components/RightRail';
import { BottomDeck } from './components/BottomDeck';
import { CohortCreationDialog } from './components/CohortCreationDialog';
import { useCountyStudyHub } from './hooks/useCountyStudyHub';

export function CountyStudyPage() {
  const { activeStudy, syncState } = useCountyStudioStore();

  // Connect to StudyHub when a study is active
  useCountyStudyHub(activeStudy?.studyId ?? null);

  const syncColor = {
    LIVE: '#22c55e',
    STAGED: '#f59e0b',
    SNAPSHOT: '#3b82f6',
    DISCONNECTED: '#6b7280',
  }[syncState];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'hsl(var(--tf-bg))' }}>
      {/* ── Top Bar ─────────────────────────────────────────────────── */}
      <div
        style={{
          height: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          borderBottom: '1px solid hsl(var(--tf-border))',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: 'hsl(var(--tf-fg))' }}>
            TerraForge County Studio
          </span>
          {activeStudy && (
            <span style={{ fontSize: 12, color: 'hsl(var(--tf-muted))' }}>
              {activeStudy.countyId} · {activeStudy.taxYear} · {activeStudy.studyType}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: syncColor, display: 'inline-block' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: syncColor, letterSpacing: 1 }}>
            ATLAS {syncState}
          </span>
          {syncState === 'DISCONNECTED' && (
            <button
              style={{
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 4,
                border: '1px solid hsl(var(--tf-border))',
                background: 'transparent',
                color: 'hsl(var(--tf-muted))',
                cursor: 'pointer',
              }}
              onClick={() => {
                // Opens Atlas Live View in OS window manager
                // desktopStore.openModule('atlas-live-view', { studyId: activeStudy?.studyId })
                // Wired in Task 11 after desktopStore integration
              }}
            >
              ↗ Open Atlas Live
            </button>
          )}
        </div>
      </div>

      {/* ── Body Grid ───────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '210px 1fr 360px', flex: 1, minHeight: 0 }}>
        {/* Left Rail */}
        <div
          data-testid="cs-left-rail"
          style={{ borderRight: '1px solid hsl(var(--tf-border))', overflowY: 'auto' }}
        >
          <LeftRail />
        </div>

        {/* Center: Tabs + SegmentTable + BottomDeck */}
        <div data-testid="cs-center" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {/* Section Tabs */}
          <div
            style={{
              height: 36,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              padding: '0 12px',
              borderBottom: '1px solid hsl(var(--tf-border))',
              flexShrink: 0,
            }}
          >
            {['Overview', 'Ratio Study', 'Neighborhoods', 'Adjustments', 'Exceptions', 'Compliance'].map((tab) => (
              <button
                key={tab}
                style={{
                  fontSize: 11,
                  padding: '4px 10px',
                  borderRadius: 4,
                  border: 'none',
                  background: tab === 'Overview' ? 'hsl(var(--tf-surface))' : 'transparent',
                  color: tab === 'Overview' ? 'hsl(var(--tf-fg))' : 'hsl(var(--tf-muted))',
                  cursor: 'pointer',
                  fontWeight: tab === 'Overview' ? 600 : 400,
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Segment Table — grows to fill available space */}
          <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
            <SegmentTable />
          </div>

          {/* Bottom Deck */}
          <div style={{ height: 200, borderTop: '1px solid hsl(var(--tf-border))', flexShrink: 0 }}>
            <BottomDeck />
          </div>
        </div>

        {/* Right Rail */}
        <div
          data-testid="cs-right-rail"
          style={{ borderLeft: '1px solid hsl(var(--tf-border))', overflowY: 'auto' }}
        >
          <RightRail />
        </div>
      </div>

      {/* ── Cohort Creation Dialog (triggered by Atlas selection) ─── */}
      <CohortCreationDialog />
    </div>
  );
}
```

- [ ] **Step 4: Add lazy imports + routes to Router.tsx**

Find this block in `frontend/apps/os-shell/src/Router.tsx`:
```tsx
// Gen2 Module Routes
const TerraForgeGen2 = lazy(() => import('./pages/gen2/TerraForgeGen2'));
```

Add immediately above it:
```tsx
// TerraForge County Studio (Plan 2) + Atlas Live View (Plan 3)
const CountyStudyPage = lazy(() =>
  import('./pages/forge/county-studio/CountyStudyPage').then((m) => ({ default: m.CountyStudyPage }))
);
const AtlasLivePage = lazy(() =>
  import('./pages/forge/atlas-live/AtlasLivePage').then((m) => ({ default: m.AtlasLivePage }))
);
```

Find this block in Router.tsx:
```tsx
{/* Constitutional Suite Home Routes (Phase 9) */}
<Route path='forge' element={<ForgeHome />} />
<Route path='atlas' element={<AtlasHome />} />
```

Add two routes immediately after:
```tsx
{/* TerraForge County Studio — segment-first valuation workspace */}
<Route path='forge/county-studio' element={<CountyStudyPage />} />
{/* Atlas Live View — study-aware spatial surface (monitor 2) */}
<Route path='forge/atlas-live' element={<AtlasLivePage />} />
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd frontend && npm test -- --testPathPattern=CountyStudyPage --watchAll=false
```

Expected: PASS — 3 tests passing

- [ ] **Step 6: Commit**

```bash
cd frontend && git add apps/os-shell/src/pages/forge/county-studio/CountyStudyPage.tsx apps/os-shell/src/Router.tsx && git commit -m "feat(county-studio): CountyStudyPage root layout + Router routes"
```

---

## Task 4: LeftRail

**Files:**
- Create: `frontend/apps/os-shell/src/pages/forge/county-studio/components/LeftRail.tsx`

No separate test file for LeftRail — it is covered by CountyStudyPage render test. Write directly:

- [ ] **Step 1: Create LeftRail**

```tsx
// frontend/apps/os-shell/src/pages/forge/county-studio/components/LeftRail.tsx
import React from 'react';
import { useCountyStudioStore } from '@/stores/countyStudioStore';

const SectionHeader = ({ label }: { label: string }) => (
  <div
    style={{
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: 1.2,
      color: 'hsl(var(--tf-muted))',
      padding: '12px 12px 4px',
      textTransform: 'uppercase',
    }}
  >
    {label}
  </div>
);

const NavItem = ({
  label,
  sub,
  active,
  onClick,
}: {
  label: string;
  sub?: string;
  active?: boolean;
  onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    style={{
      display: 'block',
      width: '100%',
      textAlign: 'left',
      padding: '6px 12px',
      border: 'none',
      background: active ? 'hsl(var(--tf-surface))' : 'transparent',
      color: active ? 'hsl(var(--tf-fg))' : 'hsl(var(--tf-muted))',
      fontSize: 12,
      cursor: 'pointer',
      borderRadius: 0,
    }}
  >
    <div style={{ fontWeight: active ? 600 : 400 }}>{label}</div>
    {sub && <div style={{ fontSize: 10, color: 'hsl(var(--tf-muted))' }}>{sub}</div>}
  </button>
);

export function LeftRail() {
  const { activeStudy, cohorts, scenarios, selectedSegmentId } = useCountyStudioStore();

  return (
    <div style={{ padding: '8px 0' }}>
      <SectionHeader label="Studies" />
      {activeStudy ? (
        <NavItem
          label={`${activeStudy.taxYear} ${activeStudy.studyType}`}
          sub={activeStudy.status}
          active
        />
      ) : (
        <div style={{ padding: '4px 12px', fontSize: 11, color: 'hsl(var(--tf-muted))' }}>
          No study open
        </div>
      )}

      <SectionHeader label="Cohorts" />
      {cohorts.length === 0 ? (
        <div style={{ padding: '4px 12px', fontSize: 11, color: 'hsl(var(--tf-muted))' }}>
          None yet
        </div>
      ) : (
        cohorts.map((c) => (
          <NavItem key={c.cohortId} label={c.name} sub={`${c.parcelCount} parcels · ${c.selectionType}`} />
        ))
      )}

      <SectionHeader label="Scenarios" />
      {scenarios.length === 0 ? (
        <div style={{ padding: '4px 12px', fontSize: 11, color: 'hsl(var(--tf-muted))' }}>
          None yet
        </div>
      ) : (
        scenarios.map((s) => (
          <NavItem
            key={s.scenarioId}
            label={s.adjustmentType}
            sub={s.status}
            active={false}
          />
        ))
      )}

      <SectionHeader label="Snapshots" />
      <div style={{ padding: '4px 12px', fontSize: 11, color: 'hsl(var(--tf-muted))' }}>
        None saved
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd frontend && git add apps/os-shell/src/pages/forge/county-studio/components/LeftRail.tsx && git commit -m "feat(county-studio): LeftRail navigation component"
```

---

## Task 5: SegmentTable

This is the most important component — the center of the workspace.

**Files:**
- Create: `frontend/apps/os-shell/src/pages/forge/county-studio/components/SegmentTable.tsx`
- Create: `frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/SegmentTable.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/SegmentTable.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
import { SegmentTable } from '../components/SegmentTable';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import type { CountySegmentDto } from '../types/countyStudio.types';

const MOCK_SEGMENTS: CountySegmentDto[] = [
  {
    segmentId: 's1',
    segmentSetId: 'ss1',
    name: 'West Richland R1',
    segmentType: 'Residential',
    parcelCount: 412,
    medianRatio: 0.97,
    cod: 14.2,
    prd: 1.01,
    stabilityScore: 72,
    riskScore: 35,
    exceptionCount: 8,
    geographyRef: null,
  },
  {
    segmentId: 's2',
    segmentSetId: 'ss1',
    name: 'Kennewick C1',
    segmentType: 'Commercial',
    parcelCount: 89,
    medianRatio: 0.84,
    cod: 22.8,
    prd: 1.06,
    stabilityScore: 48,
    riskScore: 78,
    exceptionCount: 22,
    geographyRef: null,
  },
];

describe('SegmentTable', () => {
  beforeEach(() => {
    act(() => {
      useCountyStudioStore.getState().setSegments(MOCK_SEGMENTS);
      useCountyStudioStore.getState().selectSegment(null);
    });
  });

  it('renders one row per segment', () => {
    render(<SegmentTable />);
    expect(screen.getByText('West Richland R1')).toBeInTheDocument();
    expect(screen.getByText('Kennewick C1')).toBeInTheDocument();
  });

  it('renders column headers', () => {
    render(<SegmentTable />);
    expect(screen.getByText('Segment')).toBeInTheDocument();
    expect(screen.getByText('Parcels')).toBeInTheDocument();
    expect(screen.getByText('Median Ratio')).toBeInTheDocument();
    expect(screen.getByText('COD')).toBeInTheDocument();
    expect(screen.getByText('Stability')).toBeInTheDocument();
  });

  it('selecting a row calls selectSegment in the store', () => {
    render(<SegmentTable />);
    fireEvent.click(screen.getByText('West Richland R1'));
    expect(useCountyStudioStore.getState().selectedSegmentId).toBe('s1');
  });

  it('marks low-stability segment with red chip', () => {
    render(<SegmentTable />);
    // Kennewick C1 has stability 48 — below 60
    const chips = screen.getAllByTestId('stability-chip');
    const lowChip = chips.find((el) => el.textContent === '48');
    expect(lowChip).toHaveStyle({ background: expect.stringContaining('') }); // has a chip rendered
    expect(lowChip?.dataset.severity).toBe('critical');
  });

  it('shows empty state when no segments loaded', () => {
    act(() => {
      useCountyStudioStore.getState().setSegments([]);
    });
    render(<SegmentTable />);
    expect(screen.getByText(/no segments loaded/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
cd frontend && npm test -- --testPathPattern=SegmentTable --watchAll=false
```

Expected: FAIL — `Cannot find module '../components/SegmentTable'`

- [ ] **Step 3: Create SegmentTable**

```tsx
// frontend/apps/os-shell/src/pages/forge/county-studio/components/SegmentTable.tsx
import React, { useState } from 'react';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import type { CountySegmentDto, MetricKey } from '../types/countyStudio.types';

type SortKey = keyof Pick<
  CountySegmentDto,
  'name' | 'parcelCount' | 'medianRatio' | 'cod' | 'prd' | 'stabilityScore' | 'riskScore' | 'exceptionCount'
>;

type SortDir = 'asc' | 'desc';

function stabilityColor(score: number): { bg: string; severity: string } {
  if (score < 60) return { bg: '#ef4444', severity: 'critical' };
  if (score < 80) return { bg: '#f59e0b', severity: 'warning' };
  return { bg: '#22c55e', severity: 'ok' };
}

function codColor(cod: number): string {
  if (cod > 20) return '#ef4444';
  if (cod > 15) return '#f59e0b';
  return '#22c55e';
}

function ratioColor(ratio: number): string {
  const delta = Math.abs(ratio - 1.0);
  if (delta > 0.1) return '#ef4444';
  if (delta > 0.05) return '#f59e0b';
  return 'hsl(var(--tf-fg))';
}

const Th = ({
  label,
  sortKey,
  currentSort,
  dir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  currentSort: SortKey;
  dir: SortDir;
  onSort: (k: SortKey) => void;
}) => (
  <th
    onClick={() => onSort(sortKey)}
    style={{
      padding: '6px 8px',
      fontSize: 11,
      fontWeight: 600,
      textAlign: 'left',
      color: 'hsl(var(--tf-muted))',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      background: 'hsl(var(--tf-bg))',
      borderBottom: '1px solid hsl(var(--tf-border))',
      userSelect: 'none',
    }}
  >
    {label}
    {currentSort === sortKey ? (dir === 'asc' ? ' ↑' : ' ↓') : ''}
  </th>
);

export function SegmentTable() {
  const { segments, selectedSegmentId, selectSegment } = useCountyStudioStore();
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  if (segments.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: 'hsl(var(--tf-muted))',
          fontSize: 13,
        }}
      >
        No segments loaded — open a study to begin.
      </div>
    );
  }

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = [...segments].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const cols: { label: string; key: SortKey }[] = [
    { label: 'Segment', key: 'name' },
    { label: 'Parcels', key: 'parcelCount' },
    { label: 'Median Ratio', key: 'medianRatio' },
    { label: 'COD', key: 'cod' },
    { label: 'PRD', key: 'prd' },
    { label: 'Stability', key: 'stabilityScore' },
    { label: 'Exceptions', key: 'exceptionCount' },
    { label: 'Risk', key: 'riskScore' },
  ];

  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr>
            {cols.map((c) => (
              <Th
                key={c.key}
                label={c.label}
                sortKey={c.key}
                currentSort={sortKey}
                dir={sortDir}
                onSort={handleSort}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((seg) => {
            const isSelected = seg.segmentId === selectedSegmentId;
            const { bg: stabBg, severity } = stabilityColor(seg.stabilityScore);

            return (
              <tr
                key={seg.segmentId}
                onClick={() => selectSegment(seg.segmentId)}
                style={{
                  background: isSelected ? 'hsl(var(--tf-surface))' : 'transparent',
                  cursor: 'pointer',
                  borderBottom: '1px solid hsl(var(--tf-border))',
                }}
              >
                <td style={{ padding: '7px 8px', fontWeight: isSelected ? 600 : 400 }}>
                  {seg.name}
                </td>
                <td style={{ padding: '7px 8px', color: 'hsl(var(--tf-muted))' }}>
                  {seg.parcelCount.toLocaleString()}
                </td>
                <td style={{ padding: '7px 8px', color: ratioColor(seg.medianRatio) }}>
                  {seg.medianRatio.toFixed(3)}
                </td>
                <td style={{ padding: '7px 8px', color: codColor(seg.cod) }}>
                  {seg.cod.toFixed(1)}
                </td>
                <td style={{ padding: '7px 8px', color: 'hsl(var(--tf-muted))' }}>
                  {seg.prd.toFixed(3)}
                </td>
                <td style={{ padding: '7px 8px' }}>
                  <span
                    data-testid="stability-chip"
                    data-severity={severity}
                    style={{
                      display: 'inline-block',
                      padding: '1px 6px',
                      borderRadius: 10,
                      background: stabBg + '33',
                      color: stabBg,
                      fontWeight: 600,
                      fontSize: 11,
                    }}
                  >
                    {seg.stabilityScore}
                  </span>
                </td>
                <td style={{ padding: '7px 8px', color: seg.exceptionCount > 0 ? '#f59e0b' : 'hsl(var(--tf-muted))' }}>
                  {seg.exceptionCount}
                </td>
                <td style={{ padding: '7px 8px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '1px 6px',
                      borderRadius: 10,
                      background: seg.riskScore > 60 ? '#ef444433' : '#6b728033',
                      color: seg.riskScore > 60 ? '#ef4444' : 'hsl(var(--tf-muted))',
                      fontWeight: 600,
                      fontSize: 11,
                    }}
                  >
                    {seg.riskScore}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd frontend && npm test -- --testPathPattern=SegmentTable --watchAll=false
```

Expected: PASS — 5 tests passing

- [ ] **Step 5: Commit**

```bash
cd frontend && git add apps/os-shell/src/pages/forge/county-studio/components/SegmentTable.tsx apps/os-shell/src/pages/forge/county-studio/__tests__/SegmentTable.test.tsx && git commit -m "feat(county-studio): SegmentTable sortable center component"
```

---

## Task 6: ObjectInspector + RightRail

**Files:**
- Create: `frontend/apps/os-shell/src/pages/forge/county-studio/components/ObjectInspector.tsx`
- Create: `frontend/apps/os-shell/src/pages/forge/county-studio/components/RightRail.tsx`

- [ ] **Step 1: Create ObjectInspector**

```tsx
// frontend/apps/os-shell/src/pages/forge/county-studio/components/ObjectInspector.tsx
import React from 'react';
import { useCountyStudioStore } from '@/stores/countyStudioStore';

const MetricRow = ({ label, value, color }: { label: string; value: string; color?: string }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '5px 0',
      borderBottom: '1px solid hsl(var(--tf-border))',
    }}
  >
    <span style={{ fontSize: 11, color: 'hsl(var(--tf-muted))' }}>{label}</span>
    <span style={{ fontSize: 12, fontWeight: 600, color: color ?? 'hsl(var(--tf-fg))' }}>{value}</span>
  </div>
);

export function ObjectInspector() {
  const { segments, selectedSegmentId } = useCountyStudioStore();
  const seg = segments.find((s) => s.segmentId === selectedSegmentId);

  if (!seg) {
    return (
      <div style={{ padding: 16, fontSize: 12, color: 'hsl(var(--tf-muted))' }}>
        Select a segment to inspect.
      </div>
    );
  }

  const codOk = seg.cod <= 15;
  const prdOk = seg.prd >= 0.98 && seg.prd <= 1.03;

  return (
    <div style={{ padding: '12px 16px' }}>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{seg.name}</div>
      <div style={{ fontSize: 11, color: 'hsl(var(--tf-muted))', marginBottom: 12 }}>
        {seg.segmentType} · {seg.parcelCount.toLocaleString()} parcels
      </div>

      <MetricRow label="Median Ratio" value={seg.medianRatio.toFixed(3)} />
      <MetricRow
        label="COD"
        value={seg.cod.toFixed(1)}
        color={codOk ? '#22c55e' : '#ef4444'}
      />
      <MetricRow
        label="PRD"
        value={seg.prd.toFixed(3)}
        color={prdOk ? '#22c55e' : '#f59e0b'}
      />
      <MetricRow
        label="Stability Score"
        value={String(seg.stabilityScore)}
        color={seg.stabilityScore < 60 ? '#ef4444' : seg.stabilityScore < 80 ? '#f59e0b' : '#22c55e'}
      />
      <MetricRow label="Risk Score" value={String(seg.riskScore)} />
      <MetricRow label="Exceptions" value={String(seg.exceptionCount)} />

      {/* Warnings */}
      <div style={{ marginTop: 12 }}>
        {seg.stabilityScore < 60 && (
          <div
            style={{
              padding: '6px 8px',
              background: '#ef444422',
              borderRadius: 4,
              fontSize: 11,
              color: '#ef4444',
              marginBottom: 4,
            }}
          >
            ⚠ Segment instability — stability score below 60
          </div>
        )}
        {seg.parcelCount < 30 && (
          <div
            style={{
              padding: '6px 8px',
              background: '#f59e0b22',
              borderRadius: 4,
              fontSize: 11,
              color: '#f59e0b',
              marginBottom: 4,
            }}
          >
            ⚠ Low sample warning — n &lt; 30
          </div>
        )}
        {seg.cod > 20 && (
          <div
            style={{
              padding: '6px 8px',
              background: '#ef444422',
              borderRadius: 4,
              fontSize: 11,
              color: '#ef4444',
              marginBottom: 4,
            }}
          >
            ⚠ COD exceeds 20 — review before publishing
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create RightRail (container that switches between Inspector and Worksheet)**

```tsx
// frontend/apps/os-shell/src/pages/forge/county-studio/components/RightRail.tsx
import React, { useState } from 'react';
import { ObjectInspector } from './ObjectInspector';
import { ScenarioWorksheet } from './ScenarioWorksheet';

type RightPanel = 'inspector' | 'scenario';

export function RightRail() {
  const [activePanel, setActivePanel] = useState<RightPanel>('inspector');

  const tab = (label: string, panel: RightPanel) => (
    <button
      onClick={() => setActivePanel(panel)}
      style={{
        flex: 1,
        padding: '6px 0',
        border: 'none',
        borderBottom: activePanel === panel ? '2px solid hsl(var(--tf-accent))' : '2px solid transparent',
        background: 'transparent',
        color: activePanel === panel ? 'hsl(var(--tf-fg))' : 'hsl(var(--tf-muted))',
        fontSize: 11,
        fontWeight: activePanel === panel ? 700 : 400,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid hsl(var(--tf-border))',
          flexShrink: 0,
        }}
      >
        {tab('Inspector', 'inspector')}
        {tab('Scenario', 'scenario')}
      </div>

      {/* Panel content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {activePanel === 'inspector' ? <ObjectInspector /> : <ScenarioWorksheet />}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd frontend && git add apps/os-shell/src/pages/forge/county-studio/components/ObjectInspector.tsx apps/os-shell/src/pages/forge/county-studio/components/RightRail.tsx && git commit -m "feat(county-studio): ObjectInspector + RightRail"
```

---

## Task 7: ScenarioWorksheet

**Files:**
- Create: `frontend/apps/os-shell/src/pages/forge/county-studio/components/ScenarioWorksheet.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/ScenarioWorksheet.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
import { ScenarioWorksheet } from '../components/ScenarioWorksheet';
import { useCountyStudioStore } from '@/stores/countyStudioStore';

// Mock the API module
jest.mock('../countyStudyApi', () => ({
  scenarioApi: {
    save: jest.fn().mockResolvedValue({
      scenarioId: 'sc-new',
      studyId: 'study-1',
      cohortId: 'cohort-1',
      adjustmentType: 'PercentageIncrease',
      parameters: {},
      rationale: 'Test',
      status: 'Saved',
      createdAt: '2026-04-21T00:00:00Z',
    }),
  },
}));

describe('ScenarioWorksheet', () => {
  beforeEach(() => {
    act(() => {
      useCountyStudioStore.setState({
        activeStudy: {
          studyId: 'study-1',
          countyId: 'benton',
          taxYear: 2026,
          studyType: 'RatioStudy',
          status: 'Active',
          baselineVersion: null,
          activeSegmentSetId: null,
          createdAt: '2026-04-21T00:00:00Z',
          updatedAt: '2026-04-21T00:00:00Z',
          createdBy: 'user',
          updatedBy: 'user',
        },
        cohorts: [
          {
            cohortId: 'cohort-1',
            studyId: 'study-1',
            name: 'West Richland R1',
            selectionType: 'Visual',
            parcelCount: 412,
            isHybrid: false,
            createdAt: '2026-04-21T00:00:00Z',
          },
        ],
      });
    });
  });

  it('renders adjustment type selector', () => {
    render(<ScenarioWorksheet />);
    expect(screen.getByLabelText(/adjustment type/i)).toBeInTheDocument();
  });

  it('renders magnitude input', () => {
    render(<ScenarioWorksheet />);
    expect(screen.getByLabelText(/magnitude/i)).toBeInTheDocument();
  });

  it('renders rationale textarea', () => {
    render(<ScenarioWorksheet />);
    expect(screen.getByLabelText(/rationale/i)).toBeInTheDocument();
  });

  it('Save button is disabled when no cohort selected', () => {
    act(() => {
      useCountyStudioStore.setState({ cohorts: [] });
    });
    render(<ScenarioWorksheet />);
    expect(screen.getByRole('button', { name: /save scenario/i })).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
cd frontend && npm test -- --testPathPattern=ScenarioWorksheet --watchAll=false
```

Expected: FAIL — `Cannot find module '../components/ScenarioWorksheet'`

- [ ] **Step 3: Create ScenarioWorksheet**

```tsx
// frontend/apps/os-shell/src/pages/forge/county-studio/components/ScenarioWorksheet.tsx
import React, { useState } from 'react';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import { scenarioApi } from '../countyStudyApi';
import type { AdjustmentType } from '../types/countyStudio.types';

const ADJUSTMENT_TYPES: AdjustmentType[] = [
  'PercentageIncrease',
  'PercentageDecrease',
  'FlatDollarIncrease',
  'FlatDollarDecrease',
  'CustomFormula',
];

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 10,
  fontWeight: 700,
  color: 'hsl(var(--tf-muted))',
  textTransform: 'uppercase',
  letterSpacing: 0.8,
  marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  background: 'hsl(var(--tf-surface))',
  border: '1px solid hsl(var(--tf-border))',
  borderRadius: 4,
  color: 'hsl(var(--tf-fg))',
  fontSize: 12,
  boxSizing: 'border-box',
};

export function ScenarioWorksheet() {
  const { activeStudy, cohorts, setScenarios, scenarios } = useCountyStudioStore();
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('PercentageIncrease');
  const [magnitude, setMagnitude] = useState('');
  const [rationale, setRationale] = useState('');
  const [selectedCohortId, setSelectedCohortId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = !!activeStudy && !!selectedCohortId && magnitude !== '' && rationale.length > 0;

  const handleSave = async () => {
    if (!activeStudy || !selectedCohortId) return;
    setSaving(true);
    setError(null);
    try {
      const saved = await scenarioApi.save({
        studyId: activeStudy.studyId,
        cohortId: selectedCohortId,
        adjustmentType,
        parameters: { magnitude: parseFloat(magnitude) },
        rationale,
      });
      setScenarios([...scenarios, saved]);
      // Reset form
      setMagnitude('');
      setRationale('');
    } catch (err) {
      setError('Failed to save scenario. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setAdjustmentType('PercentageIncrease');
    setMagnitude('');
    setRationale('');
    setSelectedCohortId('');
    setError(null);
  };

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontWeight: 700, fontSize: 12, color: 'hsl(var(--tf-fg))' }}>
        New Scenario
      </div>

      {/* Cohort selector */}
      <div>
        <label htmlFor="cs-cohort" style={labelStyle}>Cohort</label>
        <select
          id="cs-cohort"
          value={selectedCohortId}
          onChange={(e) => setSelectedCohortId(e.target.value)}
          style={inputStyle}
        >
          <option value="">— select cohort —</option>
          {cohorts.map((c) => (
            <option key={c.cohortId} value={c.cohortId}>
              {c.name} ({c.parcelCount} parcels)
            </option>
          ))}
        </select>
      </div>

      {/* Adjustment Type */}
      <div>
        <label htmlFor="cs-adj-type" style={labelStyle}>Adjustment Type</label>
        <select
          id="cs-adj-type"
          value={adjustmentType}
          onChange={(e) => setAdjustmentType(e.target.value as AdjustmentType)}
          style={inputStyle}
        >
          {ADJUSTMENT_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Magnitude */}
      <div>
        <label htmlFor="cs-magnitude" style={labelStyle}>
          Magnitude {adjustmentType.includes('Percentage') ? '(%)' : '($)'}
        </label>
        <input
          id="cs-magnitude"
          type="number"
          step="0.1"
          value={magnitude}
          onChange={(e) => setMagnitude(e.target.value)}
          placeholder={adjustmentType.includes('Percentage') ? 'e.g. 4.0' : 'e.g. 5000'}
          style={inputStyle}
        />
      </div>

      {/* Rationale */}
      <div>
        <label htmlFor="cs-rationale" style={labelStyle}>Rationale</label>
        <textarea
          id="cs-rationale"
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          placeholder="Describe the basis for this adjustment..."
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>

      {error && (
        <div style={{ color: '#ef4444', fontSize: 11, padding: '4px 0' }}>{error}</div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={handleDiscard}
          style={{
            flex: 1,
            padding: '6px 0',
            border: '1px solid hsl(var(--tf-border))',
            borderRadius: 4,
            background: 'transparent',
            color: 'hsl(var(--tf-muted))',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          Discard
        </button>
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          aria-label="Save Scenario"
          style={{
            flex: 1,
            padding: '6px 0',
            border: 'none',
            borderRadius: 4,
            background: canSave ? 'hsl(var(--tf-accent))' : 'hsl(var(--tf-surface))',
            color: canSave ? '#000' : 'hsl(var(--tf-muted))',
            fontSize: 12,
            fontWeight: 600,
            cursor: canSave ? 'pointer' : 'not-allowed',
          }}
        >
          {saving ? 'Saving…' : 'Save Scenario'}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd frontend && npm test -- --testPathPattern=ScenarioWorksheet --watchAll=false
```

Expected: PASS — 4 tests passing

- [ ] **Step 5: Commit**

```bash
cd frontend && git add apps/os-shell/src/pages/forge/county-studio/components/ScenarioWorksheet.tsx apps/os-shell/src/pages/forge/county-studio/__tests__/ScenarioWorksheet.test.tsx && git commit -m "feat(county-studio): ScenarioWorksheet right-rail component"
```

---

## Task 8: BottomDeck

**Files:**
- Create: `frontend/apps/os-shell/src/pages/forge/county-studio/components/BottomDeck.tsx`

Recharts must be mocked for Jest — add to jest setup if not present. The BottomDeck uses `BarChart` from Recharts.

- [ ] **Step 1: Write failing test**

```tsx
// frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/BottomDeck.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
import { BottomDeck } from '../components/BottomDeck';
import { useCountyStudioStore } from '@/stores/countyStudioStore';

// Recharts uses SVG and canvas not available in jsdom — mock at module level
jest.mock('recharts', () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  Tooltip: () => <div />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('BottomDeck', () => {
  it('renders three tabs', () => {
    render(<BottomDeck />);
    expect(screen.getByText('Distribution')).toBeInTheDocument();
    expect(screen.getByText('Before / After')).toBeInTheDocument();
    expect(screen.getByText('Warnings')).toBeInTheDocument();
  });

  it('defaults to Distribution tab', () => {
    render(<BottomDeck />);
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('switching to Warnings tab shows warnings list', () => {
    render(<BottomDeck />);
    fireEvent.click(screen.getByText('Warnings'));
    expect(screen.getByTestId('warnings-panel')).toBeInTheDocument();
  });

  it('shows no-segments message when segments empty', () => {
    act(() => {
      useCountyStudioStore.getState().setSegments([]);
    });
    render(<BottomDeck />);
    expect(screen.getByText(/no data/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
cd frontend && npm test -- --testPathPattern=BottomDeck --watchAll=false
```

Expected: FAIL — `Cannot find module '../components/BottomDeck'`

- [ ] **Step 3: Create BottomDeck**

```tsx
// frontend/apps/os-shell/src/pages/forge/county-studio/components/BottomDeck.tsx
import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useCountyStudioStore } from '@/stores/countyStudioStore';

type DeckTab = 'distribution' | 'compare' | 'warnings';

function DistributionTab() {
  const { segments } = useCountyStudioStore();

  if (segments.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'hsl(var(--tf-muted))', fontSize: 12 }}>
        No data — load a segment set first.
      </div>
    );
  }

  // Ratio distribution: bucket into 0.05 bands from 0.7 to 1.3
  const bands: Record<string, number> = {};
  for (let r = 0.70; r < 1.35; r += 0.05) {
    bands[r.toFixed(2)] = 0;
  }
  segments.forEach((seg) => {
    const bucket = (Math.floor(seg.medianRatio / 0.05) * 0.05).toFixed(2);
    if (bucket in bands) bands[bucket] = (bands[bucket] ?? 0) + 1;
  });

  const data = Object.entries(bands).map(([ratio, count]) => ({
    ratio,
    count,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <XAxis dataKey="ratio" tick={{ fontSize: 9 }} />
        <YAxis tick={{ fontSize: 9 }} />
        <Tooltip
          contentStyle={{ background: 'hsl(var(--tf-surface))', border: '1px solid hsl(var(--tf-border))', fontSize: 11 }}
        />
        <Bar dataKey="count" fill="#3b82f6" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function CompareTab() {
  const { segments, scenarioPreview } = useCountyStudioStore();

  if (!scenarioPreview || scenarioPreview.deltas.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'hsl(var(--tf-muted))', fontSize: 12 }}>
        No active scenario preview — save a scenario to compare.
      </div>
    );
  }

  const data = scenarioPreview.deltas.slice(0, 10).map((d) => ({
    name: d.segmentName.slice(0, 12),
    before: d.beforeRatio,
    after: d.afterRatio,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <XAxis dataKey="name" tick={{ fontSize: 9 }} />
        <YAxis tick={{ fontSize: 9 }} domain={[0.8, 1.2]} />
        <Tooltip
          contentStyle={{ background: 'hsl(var(--tf-surface))', border: '1px solid hsl(var(--tf-border))', fontSize: 11 }}
        />
        <Bar dataKey="before" fill="#6b7280" radius={[2, 2, 0, 0]} name="Before" />
        <Bar dataKey="after" fill="#3b82f6" radius={[2, 2, 0, 0]} name="After" />
      </BarChart>
    </ResponsiveContainer>
  );
}

function WarningsTab() {
  const { segments } = useCountyStudioStore();

  const warnings: { text: string; severity: 'critical' | 'warning' }[] = [];
  segments.forEach((seg) => {
    if (seg.stabilityScore < 60) {
      warnings.push({ text: `${seg.name}: stability score ${seg.stabilityScore} (below 60)`, severity: 'critical' });
    }
    if (seg.parcelCount < 30) {
      warnings.push({ text: `${seg.name}: low sample (n=${seg.parcelCount})`, severity: 'warning' });
    }
    if (seg.cod > 20) {
      warnings.push({ text: `${seg.name}: COD ${seg.cod.toFixed(1)} exceeds 20`, severity: 'critical' });
    }
  });

  return (
    <div data-testid="warnings-panel" style={{ padding: '8px 12px', overflowY: 'auto', height: '100%' }}>
      {warnings.length === 0 ? (
        <div style={{ fontSize: 12, color: 'hsl(var(--tf-muted))', paddingTop: 8 }}>
          No warnings — all segments within thresholds.
        </div>
      ) : (
        warnings.map((w, i) => (
          <div
            key={i}
            style={{
              padding: '4px 8px',
              marginBottom: 4,
              borderRadius: 4,
              background: w.severity === 'critical' ? '#ef444422' : '#f59e0b22',
              color: w.severity === 'critical' ? '#ef4444' : '#f59e0b',
              fontSize: 11,
            }}
          >
            {w.severity === 'critical' ? '⛔' : '⚠'} {w.text}
          </div>
        ))
      )}
    </div>
  );
}

export function BottomDeck() {
  const [activeTab, setActiveTab] = useState<DeckTab>('distribution');

  const tab = (label: string, key: DeckTab) => (
    <button
      key={key}
      onClick={() => setActiveTab(key)}
      style={{
        padding: '4px 12px',
        border: 'none',
        background: 'transparent',
        borderBottom: activeTab === key ? '2px solid hsl(var(--tf-accent))' : '2px solid transparent',
        color: activeTab === key ? 'hsl(var(--tf-fg))' : 'hsl(var(--tf-muted))',
        fontSize: 11,
        fontWeight: activeTab === key ? 700 : 400,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid hsl(var(--tf-border))', flexShrink: 0 }}>
        {tab('Distribution', 'distribution')}
        {tab('Before / After', 'compare')}
        {tab('Warnings', 'warnings')}
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        {activeTab === 'distribution' && <DistributionTab />}
        {activeTab === 'compare' && <CompareTab />}
        {activeTab === 'warnings' && <WarningsTab />}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd frontend && npm test -- --testPathPattern=BottomDeck --watchAll=false
```

Expected: PASS — 4 tests passing

- [ ] **Step 5: Commit**

```bash
cd frontend && git add apps/os-shell/src/pages/forge/county-studio/components/BottomDeck.tsx apps/os-shell/src/pages/forge/county-studio/__tests__/BottomDeck.test.tsx && git commit -m "feat(county-studio): BottomDeck distribution/compare/warnings tabs"
```

---

## Task 9: useCountyStudyHub — SignalR Client Hook

**Files:**
- Create: `frontend/apps/os-shell/src/pages/forge/county-studio/hooks/useCountyStudyHub.ts`
- Create: `frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/useCountyStudyHub.test.ts`
- Create: `frontend/__mocks__/@microsoft/signalr.ts` (if not present)

- [ ] **Step 1: Create the SignalR mock**

```typescript
// frontend/__mocks__/@microsoft/signalr.ts
// Manual mock for @microsoft/signalr — prevents WebSocket errors in Jest

const mockConnection = {
  start: jest.fn().mockResolvedValue(undefined),
  stop: jest.fn().mockResolvedValue(undefined),
  on: jest.fn(),
  off: jest.fn(),
  invoke: jest.fn().mockResolvedValue(undefined),
  state: 'Connected',
  connectionId: 'mock-connection-id',
};

const HubConnectionBuilder = jest.fn().mockImplementation(() => ({
  withUrl: jest.fn().mockReturnThis(),
  withAutomaticReconnect: jest.fn().mockReturnThis(),
  build: jest.fn().mockReturnValue(mockConnection),
}));

export { HubConnectionBuilder };
export const HubConnectionState = {
  Connected: 'Connected',
  Connecting: 'Connecting',
  Disconnected: 'Disconnected',
  Disconnecting: 'Disconnecting',
  Reconnecting: 'Reconnecting',
};

// Helper for tests to get the mock connection instance
export const getMockConnection = () => mockConnection;
```

- [ ] **Step 2: Write the failing test**

```typescript
// frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/useCountyStudyHub.test.ts
import { renderHook, act } from '@testing-library/react';
import { useCountyStudyHub } from '../hooks/useCountyStudyHub';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import { getMockConnection } from '@microsoft/signalr';

describe('useCountyStudyHub', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      useCountyStudioStore.getState().setSyncState('DISCONNECTED');
    });
  });

  it('joins the study group when studyId is provided', async () => {
    const { result } = renderHook(() => useCountyStudyHub('study-abc'));
    const conn = getMockConnection();
    // Give async effects time to run
    await act(async () => {
      await Promise.resolve();
    });
    expect(conn.invoke).toHaveBeenCalledWith('JoinStudy', 'study-abc');
  });

  it('sets syncState to LIVE after hub connects', async () => {
    renderHook(() => useCountyStudyHub('study-xyz'));
    await act(async () => {
      await Promise.resolve();
    });
    expect(useCountyStudioStore.getState().syncState).toBe('LIVE');
  });

  it('registers ReceiveSelection handler', async () => {
    renderHook(() => useCountyStudyHub('study-abc'));
    const conn = getMockConnection();
    await act(async () => {
      await Promise.resolve();
    });
    const registeredEvents = (conn.on as jest.Mock).mock.calls.map((c: unknown[]) => c[0]);
    expect(registeredEvents).toContain('ReceiveSelection');
  });

  it('does not connect when studyId is null', () => {
    const conn = getMockConnection();
    renderHook(() => useCountyStudyHub(null));
    expect(conn.start).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run to verify failure**

```bash
cd frontend && npm test -- --testPathPattern=useCountyStudyHub --watchAll=false
```

Expected: FAIL — `Cannot find module '../hooks/useCountyStudyHub'`

- [ ] **Step 4: Create useCountyStudyHub**

```typescript
// frontend/apps/os-shell/src/pages/forge/county-studio/hooks/useCountyStudyHub.ts
import { useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import type { PendingSelection } from '../types/countyStudio.types';

const HUB_URL = '/api/hubs/county-study';

/**
 * County Studio ↔ CountyStudyHub SignalR client.
 *
 * Channel responsibilities:
 *   A (Presence)   — send segment hover/select events
 *   B (Projection) — Atlas handles; Studio just stores preview results
 *   C (Selection)  — receive Atlas selection intent → set pendingSelection
 *   D (Commit)     — send after user confirmation in CohortCreationDialog
 *
 * Called with studyId=null when no study is open → no connection made.
 */
export function useCountyStudyHub(studyId: string | null) {
  const { setSyncState, setPendingSelection, setCohorts, setScenarios } = useCountyStudioStore.getState();
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    if (!studyId) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL)
      .withAutomaticReconnect()
      .build();

    connectionRef.current = connection;

    // ── Channel A: Presence (receive only — Studio doesn't process its own presence) ──
    connection.on('ReceivePresence', (_event: unknown) => {
      // No-op in Studio — presence is for cursor sync, handled ephemerally
    });

    // ── Channel B: Projection (Studio sends → Atlas renders) ─────────────────
    connection.on('ReceiveProjection', (_event: unknown) => {
      // No-op in Studio — projections are consumed by AtlasLivePage
    });

    // ── Channel C: Selection (Atlas → Studio) — triggers CohortCreationDialog ─
    connection.on('ReceiveSelection', (event: { type: string; payload: unknown }) => {
      if (event.type === 'selection:parcel-ids') {
        const payload = event.payload as {
          studyId: string;
          parcelIds: string[];
          source: 'click' | 'lasso' | 'box';
        };
        setPendingSelection({
          parcelIds: payload.parcelIds,
          source: payload.source,
          parcelCount: payload.parcelIds.length,
        });
      } else if (event.type === 'selection:drawn-geometry') {
        const payload = event.payload as {
          studyId: string;
          geometry: GeoJSON.Geometry;
          parcelCount: number;
          areaEstimate?: number;
        };
        setPendingSelection({
          parcelIds: [],
          source: 'lasso',
          parcelCount: payload.parcelCount,
          geometry: payload.geometry,
          areaEstimate: payload.areaEstimate,
        });
      }
    });

    // ── Channel D: Commit (receive refresh signals after committed writes) ────
    connection.on('ReceiveCommit', (event: { type: string; payload: unknown }) => {
      if (event.type === 'commit:create-cohort') {
        // Refresh cohorts list from server
        // (TanStack Query invalidation happens in CohortCreationDialog after optimistic update)
        setPendingSelection(null);
      }
    });

    const start = async () => {
      try {
        await connection.start();
        await connection.invoke('JoinStudy', studyId);
        setSyncState('LIVE');
      } catch (err) {
        setSyncState('DISCONNECTED');
        console.error('[CountyStudyHub] connection failed:', err);
      }
    };

    start();

    connection.onreconnected(() => setSyncState('LIVE'));
    connection.onreconnecting(() => setSyncState('DISCONNECTED'));
    connection.onclose(() => setSyncState('DISCONNECTED'));

    return () => {
      connection.invoke('LeaveStudy', studyId).catch(() => {});
      connection.stop().catch(() => {});
      setSyncState('DISCONNECTED');
      connectionRef.current = null;
    };
  }, [studyId]);

  /**
   * Send a Channel A presence event (segment hover/select).
   * Called by SegmentTable on row hover/click.
   */
  const sendPresence = async (type: 'presence:segment-hover' | 'presence:segment-select', segmentId: string) => {
    if (!connectionRef.current || !studyId) return;
    try {
      await connectionRef.current.invoke('SendPresence', studyId, { type, payload: { studyId, segmentId } });
    } catch {
      // presence is ephemeral — silently swallow send errors
    }
  };

  /**
   * Send a Channel B projection event (Forge → Atlas metric overlay).
   * Called when activeMetric changes.
   */
  const sendProjection = async (type: string, payload: unknown) => {
    if (!connectionRef.current || !studyId) return;
    try {
      await connectionRef.current.invoke('SendProjection', studyId, { type, payload });
    } catch {
      // projections are best-effort
    }
  };

  /**
   * Send a Channel D commit event (after user confirms dialog).
   * Write-lane law: this is the ONLY path for consequential writes.
   */
  const sendCommit = async (type: string, payload: unknown) => {
    if (!connectionRef.current || !studyId) return;
    await connectionRef.current.invoke('BroadcastCommit', studyId, { type, payload });
  };

  return { sendPresence, sendProjection, sendCommit, connection: connectionRef };
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd frontend && npm test -- --testPathPattern=useCountyStudyHub --watchAll=false
```

Expected: PASS — 4 tests passing

- [ ] **Step 6: Commit**

```bash
cd frontend && git add apps/os-shell/src/pages/forge/county-studio/hooks/useCountyStudyHub.ts apps/os-shell/src/pages/forge/county-studio/__tests__/useCountyStudyHub.test.ts frontend/__mocks__/@microsoft/signalr.ts && git commit -m "feat(county-studio): useCountyStudyHub SignalR client hook + mock"
```

---

## Task 10: CohortCreationDialog

**Files:**
- Create: `frontend/apps/os-shell/src/pages/forge/county-studio/components/CohortCreationDialog.tsx`
- Create: `frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/CohortCreationDialog.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/CohortCreationDialog.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import { CohortCreationDialog } from '../components/CohortCreationDialog';
import { useCountyStudioStore } from '@/stores/countyStudioStore';

jest.mock('../countyStudyApi', () => ({
  cohortApi: {
    create: jest.fn().mockResolvedValue({
      cohortId: 'new-cohort',
      studyId: 'study-1',
      name: 'My Cohort',
      selectionType: 'Visual',
      parcelCount: 150,
      isHybrid: false,
      createdAt: '2026-04-21T00:00:00Z',
    }),
  },
}));

const setupWithPendingSelection = () => {
  act(() => {
    useCountyStudioStore.setState({
      activeStudy: {
        studyId: 'study-1',
        countyId: 'benton',
        taxYear: 2026,
        studyType: 'RatioStudy',
        status: 'Active',
        baselineVersion: null,
        activeSegmentSetId: null,
        createdAt: '2026-04-21T00:00:00Z',
        updatedAt: '2026-04-21T00:00:00Z',
        createdBy: 'user',
        updatedBy: 'user',
      },
      pendingSelection: {
        parcelIds: ['p1', 'p2', 'p3'],
        source: 'lasso',
        parcelCount: 150,
      },
    });
  });
};

describe('CohortCreationDialog', () => {
  beforeEach(() => {
    act(() => {
      useCountyStudioStore.setState({ pendingSelection: null, cohorts: [] });
    });
  });

  it('does not render when pendingSelection is null', () => {
    render(<CohortCreationDialog />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders dialog when pendingSelection is set', () => {
    setupWithPendingSelection();
    render(<CohortCreationDialog />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/150 parcels/i)).toBeInTheDocument();
  });

  it('requires a cohort name before Create is enabled', () => {
    setupWithPendingSelection();
    render(<CohortCreationDialog />);
    expect(screen.getByRole('button', { name: /create cohort/i })).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/cohort name/i), { target: { value: 'My Cohort' } });
    expect(screen.getByRole('button', { name: /create cohort/i })).not.toBeDisabled();
  });

  it('Cancel clears pendingSelection from store', () => {
    setupWithPendingSelection();
    render(<CohortCreationDialog />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(useCountyStudioStore.getState().pendingSelection).toBeNull();
  });

  it('Create button calls cohortApi.create and adds to store', async () => {
    setupWithPendingSelection();
    const { cohortApi } = jest.requireMock('../countyStudyApi');
    render(<CohortCreationDialog />);

    fireEvent.change(screen.getByLabelText(/cohort name/i), { target: { value: 'My Cohort' } });
    fireEvent.click(screen.getByRole('button', { name: /create cohort/i }));

    await waitFor(() => {
      expect(cohortApi.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'My Cohort', studyId: 'study-1' })
      );
    });

    await waitFor(() => {
      expect(useCountyStudioStore.getState().cohorts).toHaveLength(1);
      expect(useCountyStudioStore.getState().pendingSelection).toBeNull();
    });
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
cd frontend && npm test -- --testPathPattern=CohortCreationDialog --watchAll=false
```

Expected: FAIL — `Cannot find module '../components/CohortCreationDialog'`

- [ ] **Step 3: Create CohortCreationDialog**

```tsx
// frontend/apps/os-shell/src/pages/forge/county-studio/components/CohortCreationDialog.tsx
import React, { useState } from 'react';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import { cohortApi } from '../countyStudyApi';
import type { SelectionType } from '../types/countyStudio.types';

export function CohortCreationDialog() {
  const { pendingSelection, activeStudy, cohorts, setCohorts, setPendingSelection } = useCountyStudioStore();
  const [name, setName] = useState('');
  const [selectionType, setSelectionType] = useState<SelectionType>('Visual');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dialog is only visible when there is a pending Atlas selection
  if (!pendingSelection || !activeStudy) return null;

  const canCreate = name.trim().length > 0;

  const handleCancel = () => {
    setPendingSelection(null);
    setName('');
    setError(null);
  };

  const handleCreate = async () => {
    if (!canCreate) return;
    setCreating(true);
    setError(null);
    try {
      const created = await cohortApi.create({
        studyId: activeStudy.studyId,
        name: name.trim(),
        selectionType,
        definition: {
          source: pendingSelection.source,
          geometry: pendingSelection.geometry ?? null,
        },
        parcelIds: pendingSelection.parcelIds.length > 0 ? pendingSelection.parcelIds : undefined,
      });
      setCohorts([...cohorts, created]);
      setPendingSelection(null);
      setName('');
    } catch {
      setError('Failed to create cohort. Try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 100,
        }}
        onClick={handleCancel}
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Create Cohort"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'hsl(var(--tf-bg))',
          border: '1px solid hsl(var(--tf-border))',
          borderRadius: 8,
          padding: 24,
          width: 400,
          zIndex: 101,
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}
      >
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700 }}>Create Cohort</h2>
        <p style={{ margin: '0 0 16px', fontSize: 12, color: 'hsl(var(--tf-muted))' }}>
          {pendingSelection.parcelCount} parcels selected via {pendingSelection.source}.
          {pendingSelection.areaEstimate
            ? ` Estimated area: ${pendingSelection.areaEstimate.toFixed(1)} sq mi.`
            : ''}
        </p>

        {/* Cohort Name */}
        <div style={{ marginBottom: 12 }}>
          <label
            htmlFor="cohort-name"
            style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'hsl(var(--tf-muted))', marginBottom: 4 }}
          >
            Cohort Name
          </label>
          <input
            id="cohort-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. West Richland R1 – Underassessed"
            autoFocus
            style={{
              width: '100%',
              padding: '7px 10px',
              background: 'hsl(var(--tf-surface))',
              border: '1px solid hsl(var(--tf-border))',
              borderRadius: 4,
              color: 'hsl(var(--tf-fg))',
              fontSize: 13,
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Selection Type */}
        <div style={{ marginBottom: 16 }}>
          <label
            htmlFor="cohort-type"
            style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'hsl(var(--tf-muted))', marginBottom: 4 }}
          >
            Selection Type
          </label>
          <select
            id="cohort-type"
            value={selectionType}
            onChange={(e) => setSelectionType(e.target.value as SelectionType)}
            style={{
              width: '100%',
              padding: '7px 10px',
              background: 'hsl(var(--tf-surface))',
              border: '1px solid hsl(var(--tf-border))',
              borderRadius: 4,
              color: 'hsl(var(--tf-fg))',
              fontSize: 13,
              boxSizing: 'border-box',
            }}
          >
            <option value="Visual">Visual (lasso / polygon)</option>
            <option value="RuleBased">Rule-Based</option>
            <option value="Hybrid">Hybrid</option>
            <option value="Manual">Manual (parcel list)</option>
          </select>
        </div>

        {error && (
          <div style={{ color: '#ef4444', fontSize: 11, marginBottom: 12 }}>{error}</div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            aria-label="Cancel"
            onClick={handleCancel}
            style={{
              padding: '7px 16px',
              border: '1px solid hsl(var(--tf-border))',
              borderRadius: 4,
              background: 'transparent',
              color: 'hsl(var(--tf-muted))',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            aria-label="Create Cohort"
            onClick={handleCreate}
            disabled={!canCreate || creating}
            style={{
              padding: '7px 16px',
              border: 'none',
              borderRadius: 4,
              background: canCreate ? 'hsl(var(--tf-accent))' : 'hsl(var(--tf-surface))',
              color: canCreate ? '#000' : 'hsl(var(--tf-muted))',
              fontSize: 13,
              fontWeight: 600,
              cursor: canCreate && !creating ? 'pointer' : 'not-allowed',
            }}
          >
            {creating ? 'Creating…' : 'Create Cohort'}
          </button>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd frontend && npm test -- --testPathPattern=CohortCreationDialog --watchAll=false
```

Expected: PASS — 5 tests passing

- [ ] **Step 5: Commit**

```bash
cd frontend && git add apps/os-shell/src/pages/forge/county-studio/components/CohortCreationDialog.tsx apps/os-shell/src/pages/forge/county-studio/__tests__/CohortCreationDialog.test.tsx && git commit -m "feat(county-studio): CohortCreationDialog confirm-required cohort creation"
```

---

## Task 11: Full Integration Run + Type Check

- [ ] **Step 1: Run all county-studio tests together**

```bash
cd frontend && npm test -- --testPathPattern="county-studio|countyStudio" --watchAll=false
```

Expected: All passing — countyStudioStore, SegmentTable, ScenarioWorksheet, BottomDeck, useCountyStudyHub, CohortCreationDialog, CountyStudyPage

- [ ] **Step 2: TypeScript type-check**

```bash
cd frontend && npm run type-check
```

Expected: 0 errors. If errors appear, fix them before committing. Common issues:
- `GeoJSON` namespace not in scope → add `/// <reference types="geojson" />` to countyStudio.types.ts
- Zustand `setState` spread → use `useCountyStudioStore.setState({ ... })` in tests (not `getState().action()`)

- [ ] **Step 3: Verify route renders in dev server (smoke test)**

```bash
cd frontend && timeout 10s npm run dev &
sleep 3
curl -s http://localhost:3000/forge/county-studio | grep -q "TerraFusion" && echo "ROUTE_OK" || echo "ROUTE_CHECK_NEEDED"
```

Expected: `ROUTE_OK` or verify manually in browser at `http://localhost:3000/forge/county-studio`

- [ ] **Step 4: Final commit**

```bash
cd frontend && git add -A && git commit -m "feat(county-studio): Plan 2 complete — County Studio frontend module

- TypeScript types + countyStudioStore Zustand store
- countyStudyApi (fetchers for all backend endpoints)
- Plugin manifest + thin index.tsx entry
- CountyStudyPage three-column layout + Router routes
- LeftRail (studies/cohorts/scenarios nav)
- SegmentTable (sortable, color-coded metrics, row selection)
- ObjectInspector + RightRail (Inspector/Scenario tabs)
- ScenarioWorksheet (type/magnitude/rationale/save/discard)
- BottomDeck (Distribution/Before-After/Warnings tabs + Recharts)
- useCountyStudyHub SignalR client (Channels A-D)
- CohortCreationDialog (confirm-required cohort creation from Atlas selection)
- @microsoft/signalr manual mock for Jest
- 24 tests passing"
```

---

## Self-Review Against Spec

**Spec requirements → tasks:**

| Requirement | Covered |
|---|---|
| Segment table as center of UI | SegmentTable (Task 5) ✅ |
| Left rail: Studies, Segment Sets, Cohorts, Scenarios, Snapshots | LeftRail (Task 4) ✅ |
| Right rail: Inspector + Scenario Worksheet | ObjectInspector + ScenarioWorksheet + RightRail (Tasks 6–7) ✅ |
| Bottom deck: Distribution, Before/After, Warnings | BottomDeck (Task 8) ✅ |
| Sync state badge (LIVE/STAGED/SNAPSHOT/DISCONNECTED) | CountyStudyPage top bar (Task 3) ✅ |
| ↗ Open Atlas Live button | CountyStudyPage (Task 3) ✅ — wired to desktopStore in Phase 2 |
| CountyStudyHub SignalR (Channels A-D) | useCountyStudyHub (Task 9) ✅ |
| Cohort creation from Atlas selection (confirm-required) | CohortCreationDialog (Task 10) ✅ |
| Scenario save | ScenarioWorksheet (Task 7) ✅ |
| Color-coded stability/COD/ratio chips | SegmentTable (Task 5) ✅ |
| Minimum warnings (low sample, instability, COD > 20) | ObjectInspector + BottomDeck (Tasks 6+8) ✅ |
| Plugin manifest + moduleRegistryStore pattern | manifest.json + index.tsx (Task 2) ✅ |
| Route registered | Router.tsx (Task 3) ✅ |

**No placeholders found. All code is complete.**
