// frontend/apps/os-shell/src/pages/forge/county-studio/countyStudyApi.ts
// Thin API wrapper over apiFetchJson. All paths are relative (no /api prefix —
// that is prepended by apiFetchJson per the apiBase INVARIANT B).
import { apiFetchJson } from '@/lib/apiBase';
import { getCountyStudyScope, requireCountyStudyScope } from './countyStudyScope';
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
  CountyStatisticsCompatDto,
  CountySegmentDetailDto,
  SegmentActionContextDto,
  SegmentDiagnosisDto,
  CountyDiagnosisDto,
  CountyAdjustmentSetDto,
  AdjustmentSetApprovalState,
} from './types/countyStudio.types';

const BASE = '/county-study';

function headerRecord(headers?: HeadersInit): Record<string, string> {
  if (!headers) return {};
  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }
  return headers;
}

function withCountyStudyHeaders(init?: RequestInit): RequestInit {
  const scope = getCountyStudyScope();
  return {
    ...init,
    headers: {
      ...scope.headers,
      ...headerRecord(init?.headers),
    },
  };
}

function mapStudyType(studyType: string): string {
  switch (studyType) {
    case 'RatioStudy':
    case 'MassAppraisal':
    case 'IncomeApproach':
    case 'CostApproach':
      return studyType;
    case 'EquityStudy':
    case 'CustomStudy':
      throw new Error(`County Studio study type "${studyType}" is not wired to the live backend contract.`);
    default:
      throw new Error(`Unsupported County Studio study type "${studyType}".`);
  }
}

function mapSelectionType(selectionType: string): string {
  switch (selectionType) {
    case 'Visual':
      return 'Lasso';
    case 'RuleBased':
      return 'Rule';
    case 'Hybrid':
      return 'Hybrid';
    case 'Manual':
      throw new Error('Manual parcel-list cohorts are not yet wired on this surface.');
    default:
      throw new Error(`Unsupported County Studio selection type "${selectionType}".`);
  }
}

function mapScenarioAdjustment(adjustmentType: string, parametersJson: string): { adjustmentType: string; parameters: string } {
  const parsed = JSON.parse(parametersJson) as { magnitude?: number };
  const magnitude = Number(parsed?.magnitude ?? 0);

  switch (adjustmentType) {
    case 'PercentageIncrease':
      return {
        adjustmentType: 'TotalValuePercent',
        parameters: JSON.stringify({ magnitude: Math.abs(magnitude) }),
      };
    case 'PercentageDecrease':
      return {
        adjustmentType: 'TotalValuePercent',
        parameters: JSON.stringify({ magnitude: -Math.abs(magnitude) }),
      };
    case 'FlatDollarIncrease':
      return {
        adjustmentType: 'ImprovementValueFlat',
        parameters: JSON.stringify({ magnitude: Math.abs(magnitude) }),
      };
    case 'FlatDollarDecrease':
      return {
        adjustmentType: 'ImprovementValueFlat',
        parameters: JSON.stringify({ magnitude: -Math.abs(magnitude) }),
      };
    case 'CustomFormula':
      throw new Error('Custom formula scenarios are not wired to the governed County Studio backend.');
    default:
      return {
        adjustmentType,
        parameters: parametersJson,
      };
  }
}

// ── Studies ───────────────────────────────────────────────────────────────────

export const studyApi = {
  list: (): Promise<CountyStudySessionDto[]> =>
    (() => {
      const scope = requireCountyStudyScope();
      return apiFetchJson(
        `${BASE}/studies?countyId=${encodeURIComponent(scope.countyId)}`,
        withCountyStudyHeaders(),
      );
    })(),

  get: (studyId: string): Promise<CountyStudySessionDto> =>
    apiFetchJson(`${BASE}/studies/${studyId}`, withCountyStudyHeaders()),

  create: (body: {
    countyId: string;
    taxYear: number;
    studyType: string;
    name: string;
    description?: string;
    baselineVersion?: string | null;
  }): Promise<CountyStudySessionDto> =>
    (() => {
      const scope = requireCountyStudyScope();
      if (body.countyId !== scope.countyId) {
        throw new Error('County Studio cannot create studies outside the active county scope.');
      }
      return apiFetchJson(`${BASE}/studies`, withCountyStudyHeaders({
        method: 'POST',
        body: JSON.stringify({
          countyId: scope.countyId,
          taxYear: body.taxYear,
          studyType: mapStudyType(body.studyType),
          baselineVersion: body.baselineVersion ?? null,
        }),
      }));
    })(),

  updateStatus: (studyId: string, status: string): Promise<CountyStudySessionDto> =>
    apiFetchJson(`${BASE}/studies/${studyId}/status`, withCountyStudyHeaders({
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })),
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
    apiFetchJson(`${BASE}/studies/${studyId}/segment-sets`, withCountyStudyHeaders()),

  segments: (segmentSetId: string): Promise<CountySegmentDto[]> =>
    apiFetchJson(`${BASE}/segment-sets/${segmentSetId}/segments`, withCountyStudyHeaders()),

  /**
   * Triggers the backend derivation pipeline: reads canonical TerraFusion data
   * (Properties + CamaCharacteristics + qualified ComparableSales), groups by
   * (neighborhood × building type × quality grade), writes a new baseline
   * CountySegmentSet with per-segment IAAO metrics, and points the study's
   * ActiveSegmentSetId at it. Each invocation creates a new versioned set.
   */
  derive: (studyId: string): Promise<SegmentDerivationResult> =>
    apiFetchJson(`${BASE}/studies/${studyId}/derive-segments`, withCountyStudyHeaders({ method: 'POST' })),
};

// ── Cohorts ───────────────────────────────────────────────────────────────────

export const cohortApi = {
  list: (studyId: string): Promise<CountyCohortDto[]> =>
    apiFetchJson(`${BASE}/studies/${studyId}/cohorts`, withCountyStudyHeaders()),

  get: (cohortId: string): Promise<CountyCohortDto> =>
    apiFetchJson(`${BASE}/cohorts/${cohortId}`, withCountyStudyHeaders()),

  create: (body: {
    studyId: string;
    name: string;
    selectionType: string;
    definition: string;
    parcelCount: number;
    isHybrid: boolean;
  }): Promise<CountyCohortDto> =>
    apiFetchJson(`${BASE}/cohorts`, withCountyStudyHeaders({
      method: 'POST',
      body: JSON.stringify({
        ...body,
        selectionType: mapSelectionType(body.selectionType),
      }),
    })),
};

// ── Scenarios ─────────────────────────────────────────────────────────────────

export const scenarioApi = {
  list: (studyId: string): Promise<CountyScenarioDto[]> =>
    apiFetchJson(`${BASE}/studies/${studyId}/scenarios`, withCountyStudyHeaders()),

  get: (scenarioId: string): Promise<CountyScenarioDto> =>
    apiFetchJson(`${BASE}/scenarios/${scenarioId}`, withCountyStudyHeaders()),

  preview: (scenarioId: string): Promise<ScenarioImpactPreviewDto> =>
    apiFetchJson(`${BASE}/scenarios/${scenarioId}/preview`, withCountyStudyHeaders()),

  create: (body: {
    studyId: string;
    countyId: string;
    cohortId: string;
    name: string;
    adjustmentType: string;
    parametersJson: string;
    rationale?: string;
  }): Promise<CountyScenarioDto> =>
    (() => {
      const scope = requireCountyStudyScope();
      if (body.countyId !== scope.countyId) {
        throw new Error('County Studio cannot create scenarios outside the active county scope.');
      }
      const mappedScenario = mapScenarioAdjustment(body.adjustmentType, body.parametersJson);
      return apiFetchJson(`${BASE}/scenarios`, withCountyStudyHeaders({
        method: 'POST',
        body: JSON.stringify({
          studyId: body.studyId,
          cohortId: body.cohortId,
          adjustmentType: mappedScenario.adjustmentType,
          parameters: mappedScenario.parameters,
          rationale: body.rationale ?? body.name,
        }),
      }));
    })(),

  save: (scenarioId: string): Promise<CountyScenarioDto> =>
    apiFetchJson(`${BASE}/scenarios/${scenarioId}/save`, withCountyStudyHeaders({ method: 'POST' })),

  compare: (scenarioIdA: string, compareWithId: string): Promise<ScenarioCompareDto> =>
    apiFetchJson(
      `${BASE}/scenarios/${scenarioIdA}/compare?compareWithId=${compareWithId}`,
      withCountyStudyHeaders(),
    ),

  promote: (body: {
    scenarioId:     string;
    effectiveScope: string;   // JSON: { scenarioId, cohortId }
  }): Promise<CountyAdjustmentSetDto> =>
    apiFetchJson(`${BASE}/scenarios/promote`, withCountyStudyHeaders({ method: 'POST', body: JSON.stringify(body) })),
};

// ── Adjustment Sets ───────────────────────────────────────────────────────────

export const adjustmentSetApi = {
  list: (studyId: string): Promise<CountyAdjustmentSetDto[]> =>
    apiFetchJson(`${BASE}/studies/${studyId}/adjustment-sets`, withCountyStudyHeaders()),

  updateApprovalState: (
    adjustmentSetId: string,
    newState: AdjustmentSetApprovalState,
    rollbackReason?: string,
  ): Promise<CountyAdjustmentSetDto> =>
    apiFetchJson(`${BASE}/adjustment-sets/${adjustmentSetId}/approval-state`, withCountyStudyHeaders({
      method: 'PATCH',
      body: JSON.stringify({ newState, rollbackReason }),
    })),
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
    apiFetchJson(`${BASE}/studies/${studyId}/exceptions`, withCountyStudyHeaders()),

  updateStatus: (id: string, newStatus: string): Promise<CountyExceptionSetDto> =>
    apiFetchJson(`${BASE}/exceptions/${id}/status`, withCountyStudyHeaders({
      method: 'PATCH',
      body: JSON.stringify({ newStatus }),
    })),

  assign: (id: string, assignTo: string): Promise<CountyExceptionSetDto> =>
    apiFetchJson(`${BASE}/exceptions/${id}/assign`, withCountyStudyHeaders({
      method: 'PATCH',
      body: JSON.stringify({ assignTo }),
    })),

  addNote: (id: string, noteText: string): Promise<CountyExceptionSetDto> =>
    apiFetchJson(`${BASE}/exceptions/${id}/notes`, withCountyStudyHeaders({
      method: 'POST',
      body: JSON.stringify({ noteText }),
    })),

  dispatch: (id: string, _dto: CountyExceptionSetDto): Promise<CountyExceptionSetDto> =>
    exceptionApi.updateStatus(id, 'Dispatched'),
};

// ── Rollups (Task B — drill lattice) ──────────────────────────────────────────

export const rollupApi = {
  /**
   * GET /county-study/studies/:id/city-rollup
   * Returns one row per county city; backend resolves city via
* CamaCharacteristic.City (source-normalized).
   */
  cities: (studyId: string): Promise<CityRollupRowDto[]> =>
    apiFetchJson(`${BASE}/studies/${studyId}/city-rollup`, withCountyStudyHeaders()),

  /**
   * GET /county-study/studies/:id/neighborhood-rollup?city=:city
   * Returns one row per neighborhood; optional city filter narrows to a city.
   */
  neighborhoods: (studyId: string, city?: string): Promise<NeighborhoodRollupRowDto[]> => {
    const qs = city ? `?city=${encodeURIComponent(city)}` : '';
    return apiFetchJson(`${BASE}/studies/${studyId}/neighborhood-rollup${qs}`, withCountyStudyHeaders());
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
    apiFetchJson(`${BASE}/studies/${studyId}/health-summary`, withCountyStudyHeaders()),

  /**
   * GET /county-study/studies/:id/statistics-compat
   * Returns the explicit County Studio Statistics Compat lens using
   * statistics_ratio_study_compat_v1. This is not the Operational Health
   * rollup and must not be used interchangeably with health-summary.
   */
  statisticsCompat: (studyId: string): Promise<CountyStatisticsCompatDto> =>
    apiFetchJson(`${BASE}/studies/${studyId}/statistics-compat`, withCountyStudyHeaders()),
};

// ── Inspector (Task D — segment detail + action-context for ObjectInspector) ──

export const inspectorApi = {
  /**
   * GET /county-study/segments/:segmentId/detail
   * Returns IAAO core + legacy equity extras (PRB / VEI / classification /
   * equity score) + YoY history + warnings for a single segment. Throws on
   * 404 when the segment does not exist.
   */
  detail: (segmentId: string): Promise<CountySegmentDetailDto> =>
    apiFetchJson(`${BASE}/segments/${segmentId}/detail`, withCountyStudyHeaders()),

  /**
   * GET /county-study/segments/:segmentId/action-context
   * Returns the pre-scoped handoff bundle for the 5 correction surfaces.
   * DeeplinkQuery is null on any handoff target that does not yet consume
   * URL parameters — the Inspector renders those buttons as honest-disabled.
   */
  actionContext: (segmentId: string): Promise<SegmentActionContextDto> =>
    apiFetchJson(`${BASE}/segments/${segmentId}/action-context`, withCountyStudyHeaders()),
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

export interface EvidenceSegmentSignal {
  segmentId: string;
  segmentName: string;
  neighborhoodCode: string | null;
  revalArea: number | null;
  parcelCount: number;
  medianRatio: number | null;
  cod: number | null;
  prd: number | null;
  riskScore: number;
  exceptionCount: number;
  ratioCount: number | null;
  salesCount: number | null;
  prb: number | null;
  weightedMeanRatio: number | null;
  yoyMedianRatioDelta: number | null;
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
  topRiskSegments: EvidenceSegmentSignal[];
  exceptions: EvidenceExceptionItem[];
}

export const evidencePacketApi = {
  get: (studyId: string, scenarioId?: string): Promise<EvidencePacketDto> => {
    const qs = scenarioId ? `?scenarioId=${scenarioId}` : '';
    return apiFetchJson(`${BASE}/studies/${studyId}/evidence-packet${qs}`, withCountyStudyHeaders());
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
    apiFetchJson(`${BASE}/segments/${segmentId}/diagnosis`, withCountyStudyHeaders()),

  /**
   * GET /county-study/studies/:studyId/diagnosis
   * Returns the county-level diagnosis: aggregate class, top-5 problem
   * segments with their individual diagnoses, cross-segment patterns.
   * 409 when the study has no active segment set.
   */
  county: (studyId: string): Promise<CountyDiagnosisDto> =>
    apiFetchJson(`${BASE}/studies/${studyId}/diagnosis`, withCountyStudyHeaders()),
};
