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
  CityRollupRowDto,
  NeighborhoodRollupRowDto,
  CountyHealthSummaryDto,
  CountySegmentDetailDto,
  SegmentActionContextDto,
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

// ── Rollups (Task B — drill lattice) ──────────────────────────────────────────

export const rollupApi = {
  /**
   * GET /county-study/studies/:id/city-rollup
   * Returns one row per Benton city; backend resolves city via
   * CamaCharacteristic.City (PacsCanonicalizer-normalized).
   */
  cities: (studyId: string): Promise<CityRollupRowDto[]> =>
    apiFetchJson(`${BASE}/studies/${studyId}/city-rollup`),

  /**
   * GET /county-study/studies/:id/neighborhood-rollup?city=:city
   * Returns one row per neighborhood; optional city filter narrows to a city.
   */
  neighborhoods: (studyId: string, city?: string): Promise<NeighborhoodRollupRowDto[]> => {
    const qs = city ? `?city=${encodeURIComponent(city)}` : '';
    return apiFetchJson(`${BASE}/studies/${studyId}/neighborhood-rollup${qs}`);
  },
};

// ── Health Summary (Task C — chief appraiser's Monday-morning screen) ────────

export const healthApi = {
  /**
   * GET /county-study/studies/:id/health-summary
   * Returns the county health summary: overall parcel-weighted IAAO metrics,
   * compliance tier, severity counts, and the top 5 segments by composite
   * risk. Returns 409 when the study has no active segment set (callers
   * should surface the "derive first" CTA, not a red error).
   */
  summary: (studyId: string): Promise<CountyHealthSummaryDto> =>
    apiFetchJson(`${BASE}/studies/${studyId}/health-summary`),
};

// ── Inspector (Task D — segment detail + action-context for ObjectInspector) ──

export const inspectorApi = {
  /**
   * GET /county-study/segments/:segmentId/detail
   * Returns IAAO core + Benton Method extras (PRB / VEI / classification /
   * equity score) + YoY history + warnings for a single segment. Throws on
   * 404 when the segment does not exist.
   */
  detail: (segmentId: string): Promise<CountySegmentDetailDto> =>
    apiFetchJson(`${BASE}/segments/${segmentId}/detail`),

  /**
   * GET /county-study/segments/:segmentId/action-context
   * Returns the pre-scoped handoff bundle for the 5 correction surfaces.
   * DeeplinkQuery is null on any handoff target that does not yet consume
   * URL parameters — the Inspector renders those buttons as honest-disabled.
   */
  actionContext: (segmentId: string): Promise<SegmentActionContextDto> =>
    apiFetchJson(`${BASE}/segments/${segmentId}/action-context`),
};
