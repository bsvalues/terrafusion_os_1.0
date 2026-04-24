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
  CityRollupRowDto,
  NeighborhoodRollupRowDto,
  DrillLevel,
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
  cityRollup: LoadStatus;
  neighborhoodRollup: LoadStatus;
}

export interface CountyStudioLoadErrors {
  segments: string | null;
  cohorts: string | null;
  scenarios: string | null;
  cityRollup: string | null;
  neighborhoodRollup: string | null;
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

  /**
   * Presence events received from peers on the same study.
   * Bounded ring buffer — oldest entries drop when size exceeds PEER_HISTORY_MAX.
   * Consumers: peer-count badge, "3 others viewing" indicator, LeftRail segment
   * hover highlights from remote actors.
   */
  peerPresence: PeerPresenceEvent[];

  /**
   * Projection overlays received from peers (metric-overlay / scenario-delta /
   * cohort-shade / edge-warnings / clear). Atlas Live View is typically the
   * broadcaster; Studio subscribes to reflect the same map state. Bounded.
   */
  incomingProjections: ProjectionEvent[];

  // ── Drill-lattice state (Task B) ───────────────────────────────────────
  /**
   * Current drill level — governs which table the center panel renders.
   *   'county'       — CityRollupTable visible, selectedCity/selectedNeighborhood null.
   *   'city'         — NeighborhoodRollupTable filtered to selectedCity.
   *   'neighborhood' — SegmentTable filtered to segments with GeographyRef === selectedNeighborhood.
   * Transitions are enforced by drillTo* actions so callers cannot leave the
   * store in an inconsistent state (e.g. level=city with no selectedCity).
   */
  drillLevel: DrillLevel;
  selectedCity: string | null;
  selectedNeighborhood: string | null;

  cityRollup: CityRollupRowDto[];
  neighborhoodRollup: NeighborhoodRollupRowDto[];

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

  /** Append a peer presence event. Ring-buffered (keeps last PEER_HISTORY_MAX). */
  pushPeerPresence: (event: PeerPresenceEvent) => void;
  /** Append a projection event received from a peer. Ring-buffered. */
  pushIncomingProjection: (event: ProjectionEvent) => void;
  /** Clear all incoming projections (e.g. on 'projection:clear'). */
  clearIncomingProjections: () => void;

  // ── Drill-lattice setters / transitions ────────────────────────────────
  setCityRollup: (rows: CityRollupRowDto[]) => void;
  setNeighborhoodRollup: (rows: NeighborhoodRollupRowDto[]) => void;
  /**
   * Collapse drill back to the county view (CityRollupTable). Clears both
   * selectedCity and selectedNeighborhood so the "stale selection" class of
   * bug (e.g. filtered segment table showing no rows after breadcrumb click)
   * is mechanically impossible.
   */
  drillToCounty: () => void;
  /**
   * Advance drill to a specific city. Sets selectedCity and clears any
   * stale selectedNeighborhood. Also clears selectedSegmentId so the
   * RightRail's ObjectInspector doesn't show a detail for a segment that
   * isn't in the new scope.
   */
  drillToCity: (city: string) => void;
  /**
   * Advance drill to a specific neighborhood within a city. Both city and
   * neighborhood are required so the state machine can never land at
   * drillLevel='neighborhood' without a parent city.
   */
  drillToNeighborhood: (city: string, neighborhoodCode: string) => void;
}

export interface PeerPresenceEvent {
  type: 'presence:segment-hover' | 'presence:segment-select' | string;
  segmentId?: string;
  actorId?: string;
  at: number;  // epoch ms, assigned by receiver
}

export interface ProjectionEvent {
  type: string;  // 'metric-overlay' | 'scenario-delta' | 'cohort-shade' | 'edge-warnings' | 'clear' | ...
  payload: unknown;
  at: number;  // epoch ms, assigned by receiver
}

/** Upper bound on peer-event ring buffers. Keeps memory predictable during long sessions. */
export const PEER_HISTORY_MAX = 20;

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

      loadStatus: { segments: 'idle', cohorts: 'idle', scenarios: 'idle', cityRollup: 'idle', neighborhoodRollup: 'idle' },
      loadErrors: { segments: null, cohorts: null, scenarios: null, cityRollup: null, neighborhoodRollup: null },

      peerPresence: [],
      incomingProjections: [],

      drillLevel: 'county',
      selectedCity: null,
      selectedNeighborhood: null,
      cityRollup: [],
      neighborhoodRollup: [],

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

      pushPeerPresence: (event) =>
        set(
          (s) => {
            const next = [...s.peerPresence, event];
            // Ring-buffer: drop oldest when size exceeds max.
            return {
              peerPresence: next.length > PEER_HISTORY_MAX ? next.slice(-PEER_HISTORY_MAX) : next,
            };
          },
          false,
          `pushPeerPresence/${event.type}`
        ),

      pushIncomingProjection: (event) =>
        set(
          (s) => {
            // Handle the 'clear' semantic from the Rust atlas kernel (projection:clear).
            if (event.type === 'clear' || event.type === 'projection:clear') {
              return { incomingProjections: [] };
            }
            const next = [...s.incomingProjections, event];
            return {
              incomingProjections: next.length > PEER_HISTORY_MAX ? next.slice(-PEER_HISTORY_MAX) : next,
            };
          },
          false,
          `pushIncomingProjection/${event.type}`
        ),

      clearIncomingProjections: () =>
        set({ incomingProjections: [] }, false, 'clearIncomingProjections'),

      setCityRollup: (cityRollup) => set({ cityRollup }, false, 'setCityRollup'),
      setNeighborhoodRollup: (neighborhoodRollup) =>
        set({ neighborhoodRollup }, false, 'setNeighborhoodRollup'),

      drillToCounty: () =>
        set(
          {
            drillLevel: 'county',
            selectedCity: null,
            selectedNeighborhood: null,
            selectedSegmentId: null,
          },
          false,
          'drillToCounty'
        ),
      drillToCity: (city) =>
        set(
          {
            drillLevel: 'city',
            selectedCity: city,
            selectedNeighborhood: null,
            selectedSegmentId: null,
          },
          false,
          `drillToCity/${city}`
        ),
      drillToNeighborhood: (city, neighborhoodCode) =>
        set(
          {
            drillLevel: 'neighborhood',
            selectedCity: city,
            selectedNeighborhood: neighborhoodCode,
            selectedSegmentId: null,
          },
          false,
          `drillToNeighborhood/${city}/${neighborhoodCode}`
        ),
    }),
    { name: 'CountyStudioStore' }
  )
);
