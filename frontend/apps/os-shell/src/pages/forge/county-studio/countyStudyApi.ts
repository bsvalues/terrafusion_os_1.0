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
  SegmentDiagnosisDto,
  CountyDiagnosisDto,
  CountyAdjustmentSetDto,
  AdjustmentSetApprovalState,
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

  compare: (scenarioIdA: string, compareWithId: string): Promise<ScenarioCompareDto> =>
    apiFetchJson(`${BASE}/scenarios/${scenarioIdA}/compare?compareWithId=${compareWithId}`),

  promote: (body: {
    scenarioId:     string;
    effectiveScope: string;   // JSON: { scenarioId, cohortId }
  }): Promise<CountyAdjustmentSetDto> =>
    apiFetchJson(`${BASE}/scenarios/promote`, { method: 'POST', body: JSON.stringify(body) }),
};

// ── Adjustment Sets ───────────────────────────────────────────────────────────

export const adjustmentSetApi = {
  list: (studyId: string): Promise<CountyAdjustmentSetDto[]> =>
    apiFetchJson(`${BASE}/studies/${studyId}/adjustment-sets`),

  updateApprovalState: (
    adjustmentSetId: string,
    newState: AdjustmentSetApprovalState,
    rollbackReason?: string,
  ): Promise<CountyAdjustmentSetDto> =>
    apiFetchJson(`${BASE}/adjustment-sets/${adjustmentSetId}/approval-state`, {
      method: 'PATCH',
      body: JSON.stringify({ newState, rollbackReason }),
    }),
};

// ── Scenario Compare ──────────────────────────────────────────────────────────

export interface ScenarioCompareRowDto {
  metricLabel: string;
  baseline: number;
  afterA: number;
  afterB: number;
  deltaAMinusB: number;
  winner: 'A' | 'B' | 'Tie';
}

export interface ScenarioCompareDto {
  scenarioA: CountyScenarioDto;
  scenarioB: CountyScenarioDto;
  rows: ScenarioCompareRowDto[];
}

// ── Exception Sets ────────────────────────────────────────────────────────────

export interface CountyExceptionSetDto {
  exceptionSetId: string;
  studyId: string;
  sourceScenarioId: string;
  reasonCode: string;   // LowSample | SegmentInstability | Outlier | EdgeEffect | Heterogeneity | ManualFlag
  parcelCount: number;
  destination: string;  // Dais | Dossier | Internal
  status: string;       // Created | Dispatched | Resolved
  assignedTo: string | null;
  notes: string | null;
  createdAt: string;    // ISO date string
  createdBy: string;
}

export const exceptionApi = {
  list: (studyId: string): Promise<CountyExceptionSetDto[]> =>
    apiFetchJson(`${BASE}/studies/${studyId}/exceptions`),

  updateStatus: (id: string, newStatus: string): Promise<CountyExceptionSetDto> =>
    apiFetchJson(`${BASE}/exceptions/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ newStatus }),
    }),

  assign: (id: string, assignTo: string): Promise<CountyExceptionSetDto> =>
    apiFetchJson(`${BASE}/exceptions/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ assignTo }),
    }),

  addNote: (id: string, noteText: string): Promise<CountyExceptionSetDto> =>
    apiFetchJson(`${BASE}/exceptions/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ noteText }),
    }),

  dispatch: (id: string, _dto: CountyExceptionSetDto): Promise<CountyExceptionSetDto> =>
    exceptionApi.updateStatus(id, 'Dispatched'),
};

// ── Rollups (Task B — drill lattice) ──────────────────────────────────────────

export const rollupApi = {
  /**
   * GET /county-study/studies/:id/city-rollup
   * Returns one row per Benton city; backend resolves city via
* CamaCharacteristic.City (source-normalized).
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

// ── Evidence Packet (Task H — DOR-defensible export) ─────────────────────────

export interface EvidenceExceptionItem {
  exceptionSetId: string;
  reasonCode: string;
  parcelCount: number;
  destination: string;
  status: string;
  assignedTo: string | null;
  notes: string | null;
  createdAt: string;
}

export interface EvidenceScenarioSection {
  scenarioId: string;
  adjustmentType: string;
  parameters: string;
  rationale: string;
  status: string;
  createdAt: string;
  createdBy: string;
}

export interface EvidenceAiFindingSummary {
  code: string;
  category: string;
  summary: string;
  evidenceStrength: number;
}

export interface EvidenceAiSection {
  overallClass: string;
  overallConfidence: number;
  healthySegmentCount: number;
  problemSegmentCount: number;
  narrative: string;
  topFindings: EvidenceAiFindingSummary[];
}

export interface EvidencePacketDto {
  studyId: string;
  countyName: string;
  taxYear: number;
  studyType: string;
  studyStatus: string;
  exportedAt: string;
  exportedBy: string;
  medianRatio: number | null;
  cod: number | null;
  prd: number | null;
  complianceStatus: string;
  parcelCount: number;
  ratioCount: number;
  criticalSegments: number;
  warningSegments: number;
  healthySegments: number;
  primaryScenario: EvidenceScenarioSection | null;
  aiDiagnosis: EvidenceAiSection | null;
  exceptions: EvidenceExceptionItem[];
}

export const evidencePacketApi = {
  get: (studyId: string, scenarioId?: string): Promise<EvidencePacketDto> => {
    const qs = scenarioId ? `?scenarioId=${scenarioId}` : '';
    return apiFetchJson(`${BASE}/studies/${studyId}/evidence-packet${qs}`);
  },
};

// ── AI Diagnosis (Task E — Fix #6 — deterministic classification + actions) ──

export const diagnosisApi = {
  /**
   * GET /county-study/segments/:segmentId/diagnosis
   * Returns the deterministic diagnosis for a segment: classification,
   * findings, recommended actions, narrative. 404 when segment missing,
   * 409 when the segment has no derived metrics.
   */
  segment: (segmentId: string): Promise<SegmentDiagnosisDto> =>
    apiFetchJson(`${BASE}/segments/${segmentId}/diagnosis`),

  /**
   * GET /county-study/studies/:studyId/diagnosis
   * Returns the county-level diagnosis: aggregate class, top-5 problem
   * segments with their individual diagnoses, cross-segment patterns.
   * 409 when the study has no active segment set.
   */
  county: (studyId: string): Promise<CountyDiagnosisDto> =>
    apiFetchJson(`${BASE}/studies/${studyId}/diagnosis`),
};
