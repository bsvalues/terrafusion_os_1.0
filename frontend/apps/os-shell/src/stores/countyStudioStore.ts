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
  activeStudy: CountyStudySessionDto | null;
  segments: CountySegmentDto[];
  cohorts: CountyCohortDto[];
  scenarios: CountyScenarioDto[];
  selectedSegmentId: string | null;
  activeScenario: CountyScenarioDto | null;
  scenarioPreview: ScenarioImpactPreviewDto | null;
  syncState: SyncState;
  activeMetric: MetricKey;
  pendingSelection: PendingSelection | null;

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
