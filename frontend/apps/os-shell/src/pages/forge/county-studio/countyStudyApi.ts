// frontend/apps/os-shell/src/pages/forge/county-studio/countyStudyApi.ts
// Thin API wrapper over apiFetchJson. All paths are relative (no /api prefix —
// that is prepended by apiFetchJson per the apiBase INVARIANT B).
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
    apiFetchJson(`${BASE}/studies`),

  get: (studyId: string): Promise<CountyStudySessionDto> =>
    apiFetchJson(`${BASE}/studies/${studyId}`),

  create: (body: {
    countyId: string;
    taxYear: number;
    studyType: string;
    name: string;
    description?: string;
  }): Promise<CountyStudySessionDto> =>
    apiFetchJson(`${BASE}/studies`, { method: 'POST', body: JSON.stringify(body) }),

  updateStatus: (studyId: string, status: string): Promise<CountyStudySessionDto> =>
    apiFetchJson(`${BASE}/studies/${studyId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};

// ── Segment Sets ──────────────────────────────────────────────────────────────

/**
 * Result payload from POST /county-study/studies/:id/derive-segments.
 * Matches the backend record SegmentDerivationResult in
 * TerraFusion.Core.Services.ICountyStudySegmentDerivationService.
 */
export interface SegmentDerivationResult {
  segmentSetId: string;
  segmentCount: number;
  totalParcels: number;
  segmentsWithRatios: number;
  segmentsWithIaaoExceptions: number;
}

export const segmentSetApi = {
  list: (studyId: string): Promise<CountySegmentSetDto[]> =>
    apiFetchJson(`${BASE}/studies/${studyId}/segment-sets`),

  segments: (segmentSetId: string): Promise<CountySegmentDto[]> =>
    apiFetchJson(`${BASE}/segment-sets/${segmentSetId}/segments`),

  /**
   * Triggers the backend derivation pipeline: reads canonical TerraFusion data
   * (Properties + CamaCharacteristics + qualified ComparableSales), groups by
   * (neighborhood × building type × quality grade), writes a new baseline
   * CountySegmentSet with per-segment IAAO metrics, and points the study's
   * ActiveSegmentSetId at it. Each invocation creates a new versioned set.
   */
  derive: (studyId: string): Promise<SegmentDerivationResult> =>
    apiFetchJson(`${BASE}/studies/${studyId}/derive-segments`, { method: 'POST' }),
};

// ── Cohorts ───────────────────────────────────────────────────────────────────

export const cohortApi = {
  list: (studyId: string): Promise<CountyCohortDto[]> =>
    apiFetchJson(`${BASE}/studies/${studyId}/cohorts`),

  get: (cohortId: string): Promise<CountyCohortDto> =>
    apiFetchJson(`${BASE}/cohorts/${cohortId}`),

  create: (body: {
    studyId: string;
    name: string;
    selectionType: string;
    definition: string;
    parcelCount: number;
    isHybrid: boolean;
  }): Promise<CountyCohortDto> =>
    apiFetchJson(`${BASE}/cohorts`, { method: 'POST', body: JSON.stringify(body) }),
};

// ── Scenarios ─────────────────────────────────────────────────────────────────

export const scenarioApi = {
  list: (studyId: string): Promise<CountyScenarioDto[]> =>
    apiFetchJson(`${BASE}/studies/${studyId}/scenarios`),

  get: (scenarioId: string): Promise<CountyScenarioDto> =>
    apiFetchJson(`${BASE}/scenarios/${scenarioId}`),

  preview: (scenarioId: string): Promise<ScenarioImpactPreviewDto> =>
    apiFetchJson(`${BASE}/scenarios/${scenarioId}/preview`),

  create: (body: {
    studyId: string;
    countyId: string;
    cohortId: string;
    name: string;
    adjustmentType: string;
    parametersJson: string;
  }): Promise<CountyScenarioDto> =>
    apiFetchJson(`${BASE}/scenarios`, { method: 'POST', body: JSON.stringify(body) }),

  save: (scenarioId: string): Promise<CountyScenarioDto> =>
    apiFetchJson(`${BASE}/scenarios/${scenarioId}/save`, { method: 'POST' }),

  promote: (body: {
    studyId: string;
    countyId: string;
    scenarioId: string;
    notes?: string;
  }): Promise<void> =>
    apiFetchJson(`${BASE}/scenarios/promote`, { method: 'POST', body: JSON.stringify(body) }),
};

// ── Exception Sets ────────────────────────────────────────────────────────────

export const exceptionApi = {
  list: (studyId: string): Promise<unknown[]> =>
    apiFetchJson(`${BASE}/studies/${studyId}/exceptions`),
};
