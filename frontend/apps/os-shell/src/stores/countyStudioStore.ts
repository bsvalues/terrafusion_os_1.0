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

/**
 * Per-resource load status.
 *   idle    — never fetched (no study active yet)
 *   loading — request in flight
 *   success — latest response is real data (count may legitimately be zero)
 *   error   — last fetch failed; see matching errors.* string for the message
 */
export type LoadStatus = 'idle' | 'loading' | 'success' | 'error';

export interface CountyStudioLoadState {
  segments: LoadStatus;
  cohorts: LoadStatus;
  scenarios: LoadStatus;
}

export interface CountyStudioLoadErrors {
  segments: string | null;
  cohorts: string | null;
  scenarios: string | null;
}

export interface CountyStudioState {
  activeStudy: CountyStudySessionDto | null;
  segments: CountySegmentDto[];
  cohorts: CountyCohortDto[];
  scenarios: CountyScenarioDto[];
  selectedSegmentId: string | null;
  activeCohortId: string | null;
  activeScenario: CountyScenarioDto | null;
  scenarioPreview: ScenarioImpactPreviewDto | null;
  syncState: SyncState;
  activeMetric: MetricKey;
  pendingSelection: PendingSelection | null;

  /** Per-resource load status. Consumers read this to distinguish loading / empty-success / error. */
  loadStatus: CountyStudioLoadState;
  /** Per-resource error message (null unless the matching loadStatus === 'error'). */
  loadErrors: CountyStudioLoadErrors;

  setStudy: (study: CountyStudySessionDto | null) => void;
  setSegments: (segments: CountySegmentDto[]) => void;
  setCohorts: (cohorts: CountyCohortDto[]) => void;
  setScenarios: (scenarios: CountyScenarioDto[]) => void;
  selectSegment: (segmentId: string | null) => void;
  setActiveCohort: (cohortId: string | null) => void;
  setActiveScenario: (scenario: CountyScenarioDto | null) => void;
  setScenarioPreview: (preview: ScenarioImpactPreviewDto | null) => void;
  setSyncState: (state: SyncState) => void;
  setActiveMetric: (metric: MetricKey) => void;
  setPendingSelection: (sel: PendingSelection | null) => void;

  /** Set one resource's load status. Passing 'error' also accepts an error message. */
  setLoadStatus: (
    resource: keyof CountyStudioLoadState,
    status: LoadStatus,
    errorMessage?: string
  ) => void;
}

export const useCountyStudioStore = create<CountyStudioState>()(
  devtools(
    (set) => ({
      activeStudy: null,
      segments: [],
      cohorts: [],
      scenarios: [],
      selectedSegmentId: null,
      activeCohortId: null,
      activeScenario: null,
      scenarioPreview: null,
      syncState: 'DISCONNECTED',
      activeMetric: 'ratio',
      pendingSelection: null,

      loadStatus: { segments: 'idle', cohorts: 'idle', scenarios: 'idle' },
      loadErrors: { segments: null, cohorts: null, scenarios: null },

      setStudy: (study) => set({ activeStudy: study }, false, 'setStudy'),
      setSegments: (segments) => set({ segments }, false, 'setSegments'),
      setCohorts: (cohorts) => set({ cohorts }, false, 'setCohorts'),
      setScenarios: (scenarios) => set({ scenarios }, false, 'setScenarios'),
      selectSegment: (selectedSegmentId) => set({ selectedSegmentId }, false, 'selectSegment'),
      setActiveCohort: (activeCohortId) => set({ activeCohortId }, false, 'setActiveCohort'),
      setActiveScenario: (activeScenario) => set({ activeScenario }, false, 'setActiveScenario'),
      setScenarioPreview: (scenarioPreview) => set({ scenarioPreview }, false, 'setScenarioPreview'),
      setSyncState: (syncState) => set({ syncState }, false, 'setSyncState'),
      setActiveMetric: (activeMetric) => set({ activeMetric }, false, 'setActiveMetric'),
      setPendingSelection: (pendingSelection) => set({ pendingSelection }, false, 'setPendingSelection'),

      setLoadStatus: (resource, status, errorMessage) =>
        set(
          (s) => ({
            loadStatus: { ...s.loadStatus, [resource]: status },
            loadErrors: {
              ...s.loadErrors,
              [resource]: status === 'error' ? (errorMessage ?? 'Unknown error') : null,
            },
          }),
          false,
          `setLoadStatus/${resource}/${status}`
        ),
    }),
    { name: 'CountyStudioStore' }
  )
);
