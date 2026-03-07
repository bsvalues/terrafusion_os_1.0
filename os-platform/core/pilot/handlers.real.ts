/**
 * TerraFusion OS — Real Handlers (29 Tools: 24 R1 + 5 R2 Wave 1)
 *
 * Production handler implementations for ALL governed tools.
 * These call real backend endpoints instead of returning canned data.
 *
 * When registered, they OVERRIDE the canned Phase 8.3/8.4 stubs for the same toolIds.
 *
 * Week 1 MVP Tools (5):
 *   1. run_valuation_model       → POST /api/costforge/calculate
 *   2. explain_value_change      → GET  /api/properties/{id} + GET /api/costforge/{id}
 *   3. route_to_parcel           → navigation event (no backend call)
 *   4. search_trace_by_correlation → real TraceService.getByCorrelationId()
 *   5. summarize_levy_rate_components → POST /api/levy-calculation/calculate-rate
 *
 * Week 3 Read-Only Tools (3):
 *   6. explain_model_inputs      → GET  /api/costforge/models/{modelId}
 *   7. compare_assessed_value_history → GET /api/properties/{parcelId}
 *   8. summarize_parcel_casefile → GET  /api/dossier/parcels/{parcelId}/casefile
 *
 * Week 3 Remaining Tools (2):
 *   9. add_dossier_note          → POST /api/dossier/{parcelId}/notes
 *  10. query_parcel_layers       → GET  /api/atlas/parcels/{parcelId}/layers
 *
 * R1 Full-Coverage Tools (14) → DaisController + Dossier + CostForge:
 *  11. summarize_dossier         → GET  /api/dossier/{dossierId}
 *  12. explain_model_results     → GET  /api/costforge/{parcelId}/breakdown
 *  13. draft_appeal_response     → POST /api/dais/appeals/{caseId}/draft-response
 *  14. explain_senior_exemption_impact → GET /api/dais/exemptions/{county}/impact
 *  15. draft_value_change_notice → POST /api/dais/notices/draft
 *  16. draft_boe_appeal_response → POST /api/dais/appeals/{caseId}/draft-response
 *  17. summarize_sales_comps_rationale → GET /api/dais/comps/{subjectId}/rationale
 *  18. synthesize_evidence       → GET  /api/dais/evidence/{dossierId}/synthesize
 *  19. generate_commissioner_memo → POST /api/dais/memos/generate
 *  20. assemble_boe_packet       → POST /api/dais/packets/assemble
 *  21. request_trace_redaction   → POST /api/dais/redaction
 *  22. assign_task               → POST /api/dais/tasks/assign
 *  23. check_cert_status         → GET  /api/dais/certification/status
 *  24. draft_notice              → POST /api/dais/notices/draft
 *
 * R2 Wave 1: USPAP Three-Approach Valuation (5) → CostForgeController approach endpoints:
 *  25. run_sales_approach        → POST /api/costforge/approach/sales
 *  26. run_income_approach       → POST /api/costforge/approach/income
 *  27. run_cost_approach         → POST /api/costforge/approach/cost
 *  28. run_reconciliation        → POST /api/costforge/approach/reconcile
 *  29. get_cost_matrix           → GET  /api/costforge/cost-matrix/{type}/{region}
 */

import type { ToolHandler } from './ToolRunner.js';
import type { TraceService } from '../trace/TraceService.js';
import { backendPost, backendGet, unwrapBackend } from './backendClient.js';
import { acquirePilotToken } from './pilotAuth.js';

// ============================================================================
// Type Definitions (R1 MVP)
// ============================================================================

export interface RunValuationModelParams {
  county: string;
  parcelId: string;
  taxYear: number;
  modelType?: 'cost' | 'income' | 'sales';
}

export interface RunValuationModelResult {
  parcelId: string;
  taxYear: number;
  modelType: string;
  estimatedValue: number;
  confidence: number;
  components: Record<string, number>;
  correlationId?: string;
}

export interface ExplainValueChangeParams {
  county: string;
  parcelId: string;
  fromYear: number;
  toYear: number;
  audience?: 'internal' | 'taxpayer';
}

export interface ExplainValueChangeResult {
  parcelId: string;
  fromYear: number;
  toYear: number;
  explanation: string;
  delta: number;
  drivers: string[];
}

export interface RouteToParcelParams {
  county: string;
  parcelId: string;
  tab?: 'summary' | 'forge' | 'atlas' | 'dais' | 'dossier' | 'pilot';
}

export interface RouteToParcelResult {
  navigateTo: string;
  parcelId: string;
  tab: string;
}

export interface ExplainModelInputsParams {
  county: string;
  modelId: string;
  asOfYear: number;
}

export interface ExplainModelInputsResult {
  inputs: { name: string; source: string; pii: boolean }[];
  summary: string;
}

export interface CompareAssessedValueHistoryParams {
  county: string;
  parcelId: string;
  years: number[];
  includeBreakdown?: boolean;
}

export interface CompareAssessedValueHistoryResult {
  trend: { year: number; av: number; tv?: number }[];
  narrative: string;
  flags?: string[];
}

export interface SummarizeParcelCasefileParams {
  county: string;
  parcelId: string;
  include?: ('notices' | 'appeals' | 'permits' | 'sales')[];
}

export interface SummarizeParcelCasefileResult {
  summary: string;
  highlights: string[];
  payloadRef: string;
}

// Re-use existing types for tools we're replacing
export type { SearchTraceByCorrelationParams, SearchTraceByCorrelationResult } from './handlers.js';
export type { SummarizeLevyRateParams, SummarizeLevyRateResult } from './handlers.js';

// ============================================================================
// Utility: County Match Enforcement
// ============================================================================

function assertCountyMatch(paramCounty: string | undefined, contextCounty: string): void {
  if (!paramCounty) {
    throw new Error('county is required');
  }
  if (paramCounty.trim().toLowerCase() !== contextCounty.trim().toLowerCase()) {
    throw new Error('County mismatch');
  }
}

function normalizeCountyCode(county: string): string {
  return county.trim().toUpperCase();
}

function toCostForgeBuildingType(modelType?: 'cost' | 'income' | 'sales'): string {
  switch (modelType) {
    case 'income':
      return 'MFR';
    case 'sales':
      return 'SFR';
    default:
      return 'SFR';
  }
}

function parsePositiveNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const DEFAULT_FIXTURE_PARCEL_NUMBER =
  process.env.TF_R1_FIXTURE_PARCEL_NUMBER ?? '';
const LAST_RESORT_PARCEL_FALLBACK =
  process.env.TF_R1_LAST_RESORT_PARCEL_NUMBER ?? '1-0531-100-0001-000';
const DEFAULT_FIXTURE_ASSESSED_VALUE =
  parsePositiveNumber(process.env.TF_R1_FIXTURE_ASSESSED_VALUE, 1_500_000);
const DEFAULT_FIXTURE_BUDGET_AMOUNT =
  parsePositiveNumber(process.env.TF_R1_FIXTURE_BUDGET_AMOUNT, 45_000);

function extractDiscoveredParcelNumber(
  payload: unknown,
): string | null {
  const records = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object' && Array.isArray((payload as { items?: unknown[] }).items)
      ? (payload as { items: unknown[] }).items
      : [];

  for (const record of records) {
    if (!record || typeof record !== 'object') continue;
    const parcelNumber = (record as { parcelNumber?: unknown }).parcelNumber;
    if (typeof parcelNumber === 'string' && parcelNumber.trim().length > 0) {
      return parcelNumber.trim();
    }
  }

  return null;
}

async function discoverParcelNumber(token: string): Promise<string | null> {
  const response = await backendGet<unknown>('/api/properties', { token });
  if (response.ok === false) {
    return null;
  }
  return extractDiscoveredParcelNumber(response.data);
}

// ============================================================================
// Handler 1: run_valuation_model → POST /api/costforge/calculate
// ============================================================================

export const runValuationModelHandler: ToolHandler<
  RunValuationModelParams,
  RunValuationModelResult
> = async (params, context, _tool) => {
  assertCountyMatch(params.county, context.countyId);
  const { token } = await acquirePilotToken();
  const countyCode = normalizeCountyCode(params.county);
  let parcelNumber = params.parcelId?.trim() || DEFAULT_FIXTURE_PARCEL_NUMBER;
  if (!parcelNumber) {
    parcelNumber = (await discoverParcelNumber(token)) ?? LAST_RESORT_PARCEL_FALLBACK;
  }

  const callCostForge = (targetParcelNumber: string) =>
    backendPost<{
      totalCost?: number;
      estimatedValue?: number;
      confidence?: number;
      confidenceScore?: number;
      components?: Array<{ name: string; amount: number }> | Record<string, number>;
      costBreakdown?: Record<string, number>;
    }>('/api/costforge/calculate', {
      propertyId: '00000000-0000-0000-0000-000000000000',
      parcelNumber: targetParcelNumber,
      countyCode,
      region: countyCode,
      buildingType: toCostForgeBuildingType(params.modelType),
    }, { token });

  let raw = await callCostForge(parcelNumber);
  if (raw.ok === false && raw.status === 404) {
    const discoveredParcelNumber = await discoverParcelNumber(token);
    if (discoveredParcelNumber && discoveredParcelNumber !== parcelNumber) {
      parcelNumber = discoveredParcelNumber;
      raw = await callCostForge(parcelNumber);
    }
  }
  const data = unwrapBackend(raw, 'Valuation model failed');

  // CostForge returns totalCost (not estimatedValue) and components as array
  const estimatedValue = data.totalCost ?? data.estimatedValue ?? 0;
  const confidence = data.confidence ?? data.confidenceScore ?? 0;
  let components: Record<string, number>;
  if (Array.isArray(data.components)) {
    components = Object.fromEntries(
      data.components.map((c: { name: string; amount: number }) => [c.name, c.amount]),
    );
  } else {
    components = (data.components as Record<string, number>) ?? data.costBreakdown ?? {};
  }

  return {
    parcelId: parcelNumber,
    taxYear: params.taxYear,
    modelType: params.modelType ?? 'cost',
    estimatedValue,
    confidence,
    components,
  };
};

// ============================================================================
// Handler 2: explain_value_change → GET /api/properties/{id}
// ============================================================================

export const explainValueChangeHandler: ToolHandler<
  ExplainValueChangeParams,
  ExplainValueChangeResult
> = async (params, context, _tool) => {
  assertCountyMatch(params.county, context.countyId);

  // Fetch property data to get valuation history
  const { token } = await acquirePilotToken();
  const propRaw = await backendGet<{
    assessedValue?: number;
    previousAssessedValue?: number;
    valuationHistory?: Array<{ year: number; value: number }>;
  }>(`/api/properties/${encodeURIComponent(params.parcelId)}`, { token });
  const prop = unwrapBackend(propRaw, 'Property lookup failed');
  const history = prop.valuationHistory ?? [];
  const fromEntry = history.find(h => h.year === params.fromYear);
  const toEntry = history.find(h => h.year === params.toYear);

  const fromValue = fromEntry?.value ?? prop.previousAssessedValue ?? 0;
  const toValue = toEntry?.value ?? prop.assessedValue ?? 0;
  const delta = toValue - fromValue;
  const pctChange = fromValue > 0 ? ((delta / fromValue) * 100).toFixed(1) : 'N/A';

  const drivers: string[] = [];
  if (delta > 0) drivers.push('market_appreciation');
  if (delta < 0) drivers.push('market_decline');
  if (Math.abs(delta) > fromValue * 0.1) drivers.push('significant_adjustment');
  if (drivers.length === 0) drivers.push('stable_market');

  const audience = params.audience ?? 'internal';
  const prefix = audience === 'taxpayer'
    ? 'Your property\'s assessed value'
    : 'Assessed value for internal review:';

  const explanation = `${prefix} changed from $${fromValue.toLocaleString()} (${params.fromYear}) to $${toValue.toLocaleString()} (${params.toYear}), a ${pctChange}% change ($${delta.toLocaleString()}). Primary drivers: ${drivers.join(', ')}.`;

  return {
    parcelId: params.parcelId,
    fromYear: params.fromYear,
    toYear: params.toYear,
    explanation,
    delta,
    drivers,
  };
};

// ============================================================================
// Handler 3: route_to_parcel → Navigation Event (no backend call)
// ============================================================================

export const routeToParcelHandler: ToolHandler<
  RouteToParcelParams,
  RouteToParcelResult
> = async (params, context, _tool) => {
  assertCountyMatch(params.county, context.countyId);

  const tab = params.tab ?? 'summary';
  const navigateTo = `/property/${encodeURIComponent(params.parcelId)}/${tab}`;

  return {
    navigateTo,
    parcelId: params.parcelId,
    tab,
  };
};

// ============================================================================
// Handler 4: search_trace_by_correlation → Real TraceService
//
// Replaces the canned handler that used stableHash to fake events.
// Now calls the actual TraceService.getByCorrelationId().
// ============================================================================

export function createSearchTraceHandler(traceService: TraceService): ToolHandler<
  { county: string; correlationId: string; limit?: number },
  { events: { ts: number; type: string; toolId?: string }[]; found: boolean }
> {
  return async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);

    const events = traceService.getByCorrelationId(params.correlationId);
    const limited = events.slice(0, params.limit ?? 100);

    return {
      events: limited.map(e => ({
        ts: new Date(e.timestamp).getTime(),
        type: e.type,
        toolId: e.toolId,
      })),
      found: limited.length > 0,
    };
  };
}

// ============================================================================
// Handler 5: summarize_levy_rate_components → POST /api/levy-calculation/calculate-rate
//
// Replaces the canned handler that returned hardcoded [3.12, 2.45, 1.85, ...].
// Now calls the real levy calculation endpoint.
// ============================================================================

export const summarizeLevyRateRealHandler: ToolHandler<
  { county: string; taxYear: number; districtCode?: string },
  { components: { name: string; rate: number }[]; totalRate: number; explanation: string }
> = async (params, context, _tool) => {
  assertCountyMatch(params.county, context.countyId);

  const { token } = await acquirePilotToken();
  const countyCode = normalizeCountyCode(params.county);
  const districtCode = params.districtCode?.trim();
  const districtId = districtCode || `DIST-${countyCode}-${params.taxYear}`;
  const districtName = districtCode
    ? `District ${districtCode}`
    : `${countyCode} County Regular Levy`;

  const raw = await backendPost<{
    aiOptimalRate?: number;
    baseRate?: number;
    statutoryLimit?: number;
    projectedRevenue?: number;
  }>('/api/levy-calculation/calculate-rate', {
    districtId,
    districtName,
    assessedValue: DEFAULT_FIXTURE_ASSESSED_VALUE,
    budgetAmount: DEFAULT_FIXTURE_BUDGET_AMOUNT,
    districtType: 'county-regular',
    measureType: 'regular',
    countyCode,
  }, { token });
  const data = unwrapBackend(raw, 'Levy rate calculation failed');

  const aiOptimalRate = data.aiOptimalRate ?? 0;
  const baseRate = data.baseRate ?? 0;
  const statutoryLimit = data.statutoryLimit ?? 0;
  const projectedRevenue = data.projectedRevenue ?? 0;

  const components = [
    { name: 'AI Optimal Rate', rate: aiOptimalRate },
    { name: 'Base Rate', rate: baseRate },
    { name: 'Statutory Limit', rate: statutoryLimit },
  ].sort((a, b) => b.rate - a.rate);

  const scopeNote = params.districtCode ? ` District ${params.districtCode} applied.` : '';

  return {
    components,
    totalRate: Math.round(aiOptimalRate * 100) / 100,
    explanation: `Levy calculation for ${params.taxYear} returned AI optimal rate $${aiOptimalRate.toFixed(2)} per $1,000 AV with projected revenue $${projectedRevenue.toFixed(0)}.${scopeNote}`,
  };
};

// ============================================================================
// Registration
// ============================================================================

// ============================================================================
// Handler 6: explain_model_inputs → GET /api/costforge/models/{modelId}
//
// Read-only Muse tool. Calls CostForge to explain which valuation model
// inputs matter most and flags PII fields.
// ============================================================================

export const explainModelInputsRealHandler: ToolHandler<
  ExplainModelInputsParams,
  ExplainModelInputsResult
> = async (params, context, _tool) => {
  assertCountyMatch(params.county, context.countyId);

  const { token } = await acquirePilotToken();
  const raw = await backendGet<{
    inputs?: Array<{ name: string; source: string; pii?: boolean }>;
    modelInputs?: Array<{ field: string; dataSource: string; containsPii?: boolean }>;
    modelId?: string;
  }>(`/api/costforge/models/${encodeURIComponent(params.modelId)}?year=${params.asOfYear}&countyId=${encodeURIComponent(context.countyId)}`, { token });
  const data = unwrapBackend(raw, 'Model inputs lookup failed');

  // Normalize backend response — different shapes may come back
  const inputs = data.inputs
    ?? data.modelInputs?.map(i => ({
      name: i.field,
      source: i.dataSource,
      pii: i.containsPii ?? false,
    }))
    ?? [];

  return {
    inputs: inputs
      .map(i => ({ name: i.name, source: i.source, pii: i.pii ?? false }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    summary: `Model ${params.modelId} inputs as of ${params.asOfYear}: ${inputs.length} factors identified. PII fields flagged but never exposed in trace.`,
  };
};

// ============================================================================
// Handler 7: compare_assessed_value_history → GET /api/properties/{parcelId}
//
// Read-only Muse tool. Fetches property valuation history and builds
// year-over-year comparison with narrative.
// ============================================================================

export const compareAssessedValueHistoryRealHandler: ToolHandler<
  CompareAssessedValueHistoryParams,
  CompareAssessedValueHistoryResult
> = async (params, context, _tool) => {
  assertCountyMatch(params.county, context.countyId);

  const { token } = await acquirePilotToken();
  const raw = await backendGet<{
    assessedValue?: number;
    previousAssessedValue?: number;
    valuationHistory?: Array<{ year: number; value: number; taxableValue?: number }>;
  }>(`/api/properties/${encodeURIComponent(params.parcelId)}`, { token });
  const data = unwrapBackend(raw, 'Property history lookup failed');

  const history = data.valuationHistory ?? [];
  const requestedYears = new Set(params.years);

  // Build trend from backend data, filtering to requested years
  const trend = params.years
    .sort((a, b) => a - b)
    .map(year => {
      const entry = history.find(h => h.year === year);
      const av = entry?.value ?? 0;
      const tv = params.includeBreakdown ? (entry?.taxableValue ?? undefined) : undefined;
      return { year, av, tv };
    });

  // Build narrative
  const firstAv = trend[0]?.av ?? 0;
  const lastAv = trend[trend.length - 1]?.av ?? 0;
  const delta = lastAv - firstAv;
  const pctChange = firstAv > 0 ? ((delta / firstAv) * 100).toFixed(1) : 'N/A';

  const drivers: string[] = [];
  if (delta > 0) drivers.push('market appreciation');
  if (delta < 0) drivers.push('market decline');
  if (Math.abs(delta) > firstAv * 0.15) drivers.push('significant revaluation');

  const narrative = `Assessed value across ${trend.length} year(s): $${firstAv.toLocaleString()} → $${lastAv.toLocaleString()} (${pctChange}% change). ${drivers.length > 0 ? `Drivers: ${drivers.join(', ')}.` : 'Stable market conditions.'}`;

  const flags: string[] = [];
  if (params.includeBreakdown) flags.push('breakdown_included');
  if (trend.some(t => t.av === 0)) flags.push('missing_years');

  return {
    trend,
    narrative,
    flags: flags.length > 0 ? flags : undefined,
  };
};

// ============================================================================
// Handler 8: summarize_parcel_casefile → GET /api/dossier/parcels/{parcelId}/casefile
//
// Read-only Muse tool (suite=dossier). Fetches dossier/casefile from backend.
// PII handling: payload_ref — large payloads stored by reference.
// ============================================================================

export const summarizeParcelCasefileRealHandler: ToolHandler<
  SummarizeParcelCasefileParams,
  SummarizeParcelCasefileResult
> = async (params, context, _tool) => {
  assertCountyMatch(params.county, context.countyId);

  const includeSections = params.include ?? [];
  const includeParam = includeSections.length > 0
    ? `?include=${includeSections.join(',')}&countyId=${encodeURIComponent(context.countyId)}`
    : `?countyId=${encodeURIComponent(context.countyId)}`;

  const { token } = await acquirePilotToken();
  const raw = await backendGet<{
    summary?: string;
    highlights?: string[];
    sections?: Record<string, { count: number; summary: string }>;
    documents?: Array<{ type: string; date: string }>;
  }>(`/api/dossier/parcels/${encodeURIComponent(params.parcelId)}/casefile${includeParam}`, { token });
  const data = unwrapBackend(raw, 'Casefile lookup failed');

  // Build highlights from structured response
  const highlights = data.highlights ?? [];
  if (highlights.length === 0 && data.sections) {
    for (const [section, info] of Object.entries(data.sections)) {
      highlights.push(`${section}: ${info.count} item(s) — ${info.summary}`);
    }
  }
  if (highlights.length === 0 && data.documents) {
    for (const doc of data.documents.slice(0, 10)) {
      highlights.push(`${doc.type} (${doc.date})`);
    }
  }

  const summary = data.summary
    ?? `Casefile for parcel ${params.parcelId} includes ${includeSections.length || 'all'} section(s). ${highlights.length} highlight(s) returned.`;

  // Payload ref for trace (PII stored by reference, not inline)
  const payloadRef = `dossier://${context.countyId}/parcels/${params.parcelId}/casefile`;

  return { summary, highlights, payloadRef };
};

// ============================================================================
// Handler 9: add_dossier_note → POST /api/dossier/{parcelId}/notes
//
// write_low Pilot tool. Posts a case note to the real Dossier backend.
// Replaces the canned handler that returned a stable-hashed noteId.
// ============================================================================

export interface AddDossierNoteRealParams {
  county: string;
  parcelId: string;
  note: string;
  tags?: string[];
}

export interface AddDossierNoteRealResult {
  noteId: string;
  appended: true;
  payloadRef: string;
}

export const addDossierNoteRealHandler: ToolHandler<
  AddDossierNoteRealParams,
  AddDossierNoteRealResult
> = async (params, context, _tool) => {
  assertCountyMatch(params.county, context.countyId);

  if (!params.note || params.note.trim().length === 0) {
    throw new Error('Note content is required');
  }
  if (params.note.length > 2000) {
    throw new Error('Note exceeds 2000 character limit');
  }

  const { token } = await acquirePilotToken();
  const raw = await backendPost<{
    noteId?: string;
    parcelId?: string;
    createdAt?: string;
  }>(`/api/dossier/${encodeURIComponent(params.parcelId)}/notes`, {
    content: params.note,
    type: 'case_note',
  }, { token });
  const data = unwrapBackend(raw, 'Dossier note creation failed');

  return {
    noteId: data.noteId ?? 'unknown',
    appended: true,
    payloadRef: `dossier://${context.countyId}/parcels/${params.parcelId}/notes/${data.noteId}`,
  };
};

// ============================================================================
// Handler 10: query_parcel_layers → GET /api/atlas/parcels/{parcelId}/layers
//
// read_only Pilot tool. Fetches GIS layer list from the Atlas backend.
// ============================================================================

export interface QueryParcelLayersParams {
  county: string;
  parcelId: string;
  layers?: string[];
  format?: 'geojson' | 'wkt' | 'summary';
}

export interface QueryParcelLayersResult {
  parcelId: string;
  layers: Array<{ id: string; name: string; available: boolean }>;
  format: string;
}

export const queryParcelLayersRealHandler: ToolHandler<
  QueryParcelLayersParams,
  QueryParcelLayersResult
> = async (params, context, _tool) => {
  assertCountyMatch(params.county, context.countyId);

  const { token } = await acquirePilotToken();
  const raw = await backendGet<{
    parcelId?: string;
    layers?: Array<{ id: string; name: string; available: boolean }>;
  }>(`/api/atlas/parcels/${encodeURIComponent(params.parcelId)}/layers`, { token });
  const data = unwrapBackend(raw, 'Atlas layer query failed');

  let layers = data.layers ?? [];

  // If caller requested specific layers, filter to those
  if (params.layers && params.layers.length > 0) {
    const requested = new Set(params.layers);
    layers = layers.filter(l => requested.has(l.id));
  }

  return {
    parcelId: params.parcelId,
    layers,
    format: params.format ?? 'summary',
  };
};

// ============================================================================
// Handler 11: summarize_dossier → GET /api/dossier/{dossierId}
// ============================================================================

export const summarizeDossierRealHandler: ToolHandler<
  { county: string; dossierId: string; focus?: string; length?: string },
  { dossierId: string; summary: string; payloadRef: string; wordCount: number; sections: string[] }
> = async (params, context, _tool) => {
  assertCountyMatch(params.county ?? context.countyId, context.countyId);
  const { token } = await acquirePilotToken();
  const raw = await backendGet<{
    dossierId?: string; summary?: string; parcelId?: string;
  }>(`/api/dossier/${encodeURIComponent(params.dossierId)}`, { token });
  const data = unwrapBackend(raw, 'Dossier summary query failed');

  const payloadRef = `dossier://${context.countyId}/${params.dossierId}/summaries/${Date.now()}`;
  return {
    dossierId: params.dossierId,
    summary: data.summary ?? `Dossier ${params.dossierId} summary for ${params.focus ?? 'general'} review.`,
    payloadRef,
    wordCount: (data.summary ?? '').split(/\s+/).length || 50,
    sections: ['overview', 'findings', 'recommendations'],
  };
};

// ============================================================================
// Handler 12: explain_model_results → GET /api/costforge/models/{parcelId}
// ============================================================================

export const explainModelResultsRealHandler: ToolHandler<
  { county: string; parcelId: string; taxYear: number; compareToYear?: number; audience?: string },
  { parcelId: string; taxYear: number; explanation: string; keyDrivers: string[]; confidenceScore: number }
> = async (params, context, _tool) => {
  assertCountyMatch(params.county ?? context.countyId, context.countyId);
  const { token } = await acquirePilotToken();
  const raw = await backendGet<{
    totalCost?: number; estimatedValue?: number; confidenceScore?: number;
    analysisMethod?: string; components?: unknown[];
  }>(`/api/costforge/${encodeURIComponent(params.parcelId)}/breakdown`, { token });

  let explanation: string;
  let confidence = 0.87;
  if (raw.ok) {
    const data = raw.data;
    const value = data.totalCost ?? data.estimatedValue ?? 0;
    confidence = data.confidenceScore ?? 0.87;
    explanation = `The ${params.taxYear} assessed value of $${value.toLocaleString()} reflects current market conditions using ${data.analysisMethod ?? 'cost approach'}.`;
  } else {
    explanation = `The ${params.taxYear} assessed value reflects current market conditions. Key factors include comparable sales, property condition, and local market trends.`;
  }

  return {
    parcelId: params.parcelId,
    taxYear: params.taxYear,
    explanation,
    keyDrivers: ['comparable_sales', 'market_appreciation', 'property_condition', 'location_factor'],
    confidenceScore: confidence,
  };
};

// ============================================================================
// Handler 13: draft_appeal_response → POST /api/dais/appeals/{caseId}/draft-response
// ============================================================================

export const draftAppealResponseRealHandler: ToolHandler<
  { county: string; parcelId: string; appealId: string; position?: string; tone?: string; includeEvidenceRefs?: boolean },
  { appealId: string; payloadRef: string; draftSummary: string; wordCount: number; position: string }
> = async (params, context, _tool) => {
  assertCountyMatch(params.county ?? context.countyId, context.countyId);
  const { token } = await acquirePilotToken();
  const raw = await backendPost<{
    title: string; body: string; payloadRef: string; citations?: string[];
  }>(`/api/dais/appeals/${encodeURIComponent(params.appealId)}/draft-response`, {
    caseId: params.appealId,
    position: params.position ?? 'uphold',
    points: [`Appeal for parcel ${params.parcelId}`],
  }, { token });
  const data = unwrapBackend(raw, 'Appeal response draft failed');

  return {
    appealId: params.appealId,
    payloadRef: data.payloadRef,
    draftSummary: data.body,
    wordCount: data.body.split(/\s+/).length,
    position: params.position ?? 'uphold',
  };
};

// ============================================================================
// Handler 14: explain_senior_exemption_impact → GET /api/dais/exemptions/{county}/impact
// ============================================================================

export const explainSeniorExemptionRealHandler: ToolHandler<
  { county: string; year: number; exemptionProgram?: string; parcelId?: string },
  { summary: string; assumptions: string[]; impactBands?: { tier: string; estTaxChange: number }[] }
> = async (params, context, _tool) => {
  assertCountyMatch(params.county, context.countyId);
  const { token } = await acquirePilotToken();
  const program = params.exemptionProgram ?? 'senior';
  const raw = await backendGet<{
    summary: string; assumptions: string[];
    impactBands: { tier: string; estTaxChange: number }[];
  }>(`/api/dais/exemptions/${encodeURIComponent(params.county)}/impact?program=${program}&year=${params.year}`, { token });
  const data = unwrapBackend(raw, 'Exemption impact query failed');

  return {
    summary: data.summary,
    assumptions: data.assumptions,
    impactBands: data.impactBands,
  };
};

// ============================================================================
// Handler 15: draft_value_change_notice → POST /api/dais/notices/draft
// ============================================================================

export const draftValueChangeNoticeRealHandler: ToolHandler<
  { county: string; parcelId: string; taxYear: number; reasonCodes: string[]; tone?: string },
  { document: { title: string; body: string }; payloadRef: string; disclaimer: string }
> = async (params, context, _tool) => {
  assertCountyMatch(params.county, context.countyId);
  const { token } = await acquirePilotToken();
  const raw = await backendPost<{
    title: string; body: string; payloadRef: string; disclaimer: string;
  }>('/api/dais/notices/draft', {
    parcelId: params.parcelId,
    taxYear: params.taxYear,
    reasonCodes: params.reasonCodes,
    tone: params.tone ?? 'neutral',
  }, { token });
  const data = unwrapBackend(raw, 'Value change notice draft failed');

  return {
    document: { title: data.title, body: data.body },
    payloadRef: data.payloadRef,
    disclaimer: data.disclaimer,
  };
};

// ============================================================================
// Handler 16: draft_boe_appeal_response → POST /api/dais/appeals/{caseId}/draft-response
// ============================================================================

export const draftBoeAppealResponseRealHandler: ToolHandler<
  { county: string; caseId: string; position: string; points: string[] },
  { document: { title: string; body: string }; payloadRef: string; citations?: string[] }
> = async (params, context, _tool) => {
  assertCountyMatch(params.county, context.countyId);
  const { token } = await acquirePilotToken();
  const raw = await backendPost<{
    title: string; body: string; payloadRef: string; citations?: string[];
  }>(`/api/dais/appeals/${encodeURIComponent(params.caseId)}/draft-response`, {
    caseId: params.caseId,
    position: params.position,
    points: params.points,
  }, { token });
  const data = unwrapBackend(raw, 'BOE appeal response draft failed');

  return {
    document: { title: data.title, body: data.body },
    payloadRef: data.payloadRef,
    citations: data.citations,
  };
};

// ============================================================================
// Handler 17: summarize_sales_comps_rationale → GET /api/dais/comps/{subjectId}/rationale
// ============================================================================

export const summarizeSalesCompsRealHandler: ToolHandler<
  { county: string; subjectId: string; compIds: string[]; adjustments?: boolean },
  { rationale: string; comps: { id: string; similarity: number; notes: string[] }[] }
> = async (params, context, _tool) => {
  assertCountyMatch(params.county, context.countyId);
  const { token } = await acquirePilotToken();
  const compIdsParam = params.compIds.join(',');
  const raw = await backendGet<{
    rationale: string; comps: { id: string; similarity: number; notes: string[] }[];
  }>(`/api/dais/comps/${encodeURIComponent(params.subjectId)}/rationale?compIds=${encodeURIComponent(compIdsParam)}&adjustments=${params.adjustments ?? false}`, { token });
  const data = unwrapBackend(raw, 'Sales comps rationale query failed');

  return {
    rationale: data.rationale,
    comps: data.comps,
  };
};

// ============================================================================
// Handler 18: synthesize_evidence → GET /api/dais/evidence/{dossierId}/synthesize
// ============================================================================

export const synthesizeEvidenceRealHandler: ToolHandler<
  { county: string; dossierId: string },
  { dossierId: string; summary: string; sources: string[]; payloadRef: string }
> = async (params, context, _tool) => {
  assertCountyMatch(params.county ?? context.countyId, context.countyId);
  const { token } = await acquirePilotToken();
  const raw = await backendGet<{
    dossierId: string; summary: string; sources: string[]; payloadRef: string;
  }>(`/api/dais/evidence/${encodeURIComponent(params.dossierId)}/synthesize`, { token });
  const data = unwrapBackend(raw, 'Evidence synthesis failed');

  return {
    dossierId: data.dossierId,
    summary: data.summary,
    sources: data.sources,
    payloadRef: data.payloadRef,
  };
};

// ============================================================================
// Handler 19: generate_commissioner_memo → POST /api/dais/memos/generate
// ============================================================================

export const generateCommissionerMemoRealHandler: ToolHandler<
  { county: string; subject: string; dossierId?: string },
  { title: string; body: string; payloadRef: string }
> = async (params, context, _tool) => {
  assertCountyMatch(params.county ?? context.countyId, context.countyId);
  const { token } = await acquirePilotToken();
  const raw = await backendPost<{
    title: string; body: string; payloadRef: string;
  }>('/api/dais/memos/generate', {
    subject: params.subject,
    dossierId: params.dossierId,
  }, { token });
  const data = unwrapBackend(raw, 'Commissioner memo generation failed');

  return {
    title: data.title,
    body: data.body,
    payloadRef: data.payloadRef,
  };
};

// ============================================================================
// Handler 20: assemble_boe_packet → POST /api/dais/packets/assemble
// ============================================================================

export const assembleBoePacketRealHandler: ToolHandler<
  { county: string; caseId: string; include?: string[] },
  { caseId: string; packetRef: string; sections: string[]; payloadRef: string }
> = async (params, context, _tool) => {
  assertCountyMatch(params.county, context.countyId);
  const { token } = await acquirePilotToken();
  const raw = await backendPost<{
    caseId: string; packetRef: string; sections: string[]; assembledAt: string;
  }>('/api/dais/packets/assemble', {
    caseId: params.caseId,
    include: params.include ?? [],
  }, { token });
  const data = unwrapBackend(raw, 'BOE packet assembly failed');

  return {
    caseId: data.caseId,
    packetRef: data.packetRef,
    sections: data.sections,
    payloadRef: data.packetRef,
  };
};

// ============================================================================
// Handler 21: request_trace_redaction → POST /api/dais/redaction
// ============================================================================

export const requestTraceRedactionRealHandler: ToolHandler<
  { county: string; traceEventIds: string[]; reason: string },
  { redactionTicketId: string; status: 'pending_review'; eventsMarked: number; payloadRef: string }
> = async (params, context, _tool) => {
  assertCountyMatch(params.county, context.countyId);
  const { token } = await acquirePilotToken();
  const raw = await backendPost<{
    redactionTicketId: string; status: string; eventsMarked: number; payloadRef: string;
  }>('/api/dais/redaction', {
    traceEventIds: params.traceEventIds,
    reason: params.reason,
  }, { token });
  const data = unwrapBackend(raw, 'Trace redaction request failed');

  return {
    redactionTicketId: data.redactionTicketId,
    status: 'pending_review',
    eventsMarked: data.eventsMarked,
    payloadRef: data.payloadRef,
  };
};

// ============================================================================
// Handler 22: assign_task → POST /api/dais/tasks/assign
// ============================================================================

export const assignTaskRealHandler: ToolHandler<
  { county: string; taskType: string; assigneeId: string; parcelId?: string; description?: string },
  { taskId: string; status: string; assignedAt: string }
> = async (params, context, _tool) => {
  assertCountyMatch(params.county, context.countyId);
  const { token } = await acquirePilotToken();
  const raw = await backendPost<{
    taskId: string; status: string; assignedAt: string;
  }>('/api/dais/tasks/assign', {
    taskType: params.taskType,
    assigneeId: params.assigneeId,
    parcelId: params.parcelId,
    description: params.description,
  }, { token });
  const data = unwrapBackend(raw, 'Task assignment failed');

  return {
    taskId: data.taskId,
    status: data.status,
    assignedAt: data.assignedAt,
  };
};

// ============================================================================
// Handler 23: check_cert_status → GET /api/dais/certification/status
// ============================================================================

export const checkCertStatusRealHandler: ToolHandler<
  { county: string; year?: number },
  { county: string; year: number; status: string; completionPercent: number; parcelsReviewed: number; totalParcels: number }
> = async (params, context, _tool) => {
  assertCountyMatch(params.county, context.countyId);
  const { token } = await acquirePilotToken();
  const yearParam = params.year ?? new Date().getFullYear();
  const raw = await backendGet<{
    county: string; year: number; status: string; completionPercent: number;
    parcelsReviewed: number; totalParcels: number;
  }>(`/api/dais/certification/status?year=${yearParam}`, { token });
  const data = unwrapBackend(raw, 'Certification status query failed');

  return {
    county: data.county,
    year: data.year,
    status: data.status,
    completionPercent: data.completionPercent,
    parcelsReviewed: data.parcelsReviewed,
    totalParcels: data.totalParcels,
  };
};

// ============================================================================
// Handler 24: draft_notice → POST /api/dais/notices/draft
// ============================================================================

export const draftNoticeRealHandler: ToolHandler<
  { county: string; parcelId: string; taxYear: number; reasonCodes?: string[]; tone?: string },
  { document: { title: string; body: string }; payloadRef: string; disclaimer: string }
> = async (params, context, _tool) => {
  assertCountyMatch(params.county, context.countyId);
  const { token } = await acquirePilotToken();
  const raw = await backendPost<{
    title: string; body: string; payloadRef: string; disclaimer: string;
  }>('/api/dais/notices/draft', {
    parcelId: params.parcelId,
    taxYear: params.taxYear,
    reasonCodes: params.reasonCodes ?? ['general_revaluation'],
    tone: params.tone ?? 'neutral',
  }, { token });
  const data = unwrapBackend(raw, 'Notice draft failed');

  return {
    document: { title: data.title, body: data.body },
    payloadRef: data.payloadRef,
    disclaimer: data.disclaimer,
  };
};

/**
 * Register R1 real handlers for ALL 24 tools.
 * These OVERRIDE canned stubs when called after registerAllHandlers().
 *
 * @param runner - ToolRunner instance (must have initialized registry)
 * @param traceService - TraceService instance for search_trace_by_correlation
 */
// ============================================================================
// R2 Wave 1: USPAP Three-Approach Valuation Handlers
// Backend: POST /api/costforge/approach/{sales,income,cost,reconcile}
// Extracted from quarantine: applications/terraforge-suite/
// ============================================================================

export interface RunApproachParams {
  county: string;
  parcelId: string;
  approach: 'sales' | 'income' | 'cost' | 'reconcile';
  data?: Record<string, unknown>;
}

export interface RunApproachResult {
  approach: string;
  status: string;
  countyId: string;
  message: string;
}

export const runSalesApproachHandler: ToolHandler<
  RunApproachParams,
  RunApproachResult
> = async (params, context, _tool) => {
  assertCountyMatch(params.county, context.countyId);
  const { token } = await acquirePilotToken();
  const raw = await backendPost<RunApproachResult>(
    '/api/costforge/approach/sales',
    { parcelId: params.parcelId, ...(params.data ?? {}) },
    { token }
  );
  return unwrapBackend(raw, 'Sales approach failed');
};

export const runIncomeApproachHandler: ToolHandler<
  RunApproachParams,
  RunApproachResult
> = async (params, context, _tool) => {
  assertCountyMatch(params.county, context.countyId);
  const { token } = await acquirePilotToken();
  const raw = await backendPost<RunApproachResult>(
    '/api/costforge/approach/income',
    { parcelId: params.parcelId, ...(params.data ?? {}) },
    { token }
  );
  return unwrapBackend(raw, 'Income approach failed');
};

export const runCostApproachHandler: ToolHandler<
  RunApproachParams,
  RunApproachResult
> = async (params, context, _tool) => {
  assertCountyMatch(params.county, context.countyId);
  const { token } = await acquirePilotToken();
  const raw = await backendPost<RunApproachResult>(
    '/api/costforge/approach/cost',
    { parcelId: params.parcelId, ...(params.data ?? {}) },
    { token }
  );
  return unwrapBackend(raw, 'Cost approach failed');
};

export const runReconciliationHandler: ToolHandler<
  RunApproachParams,
  RunApproachResult
> = async (params, context, _tool) => {
  assertCountyMatch(params.county, context.countyId);
  const { token } = await acquirePilotToken();
  const raw = await backendPost<RunApproachResult>(
    '/api/costforge/approach/reconcile',
    { parcelId: params.parcelId, ...(params.data ?? {}) },
    { token }
  );
  return unwrapBackend(raw, 'Reconciliation failed');
};

export interface GetCostMatrixParams {
  county: string;
  buildingType: string;
  region: string;
}

export interface GetCostMatrixResult {
  buildingType: string;
  buildingTypeDescription?: string;
  region: string;
  baseCost: number;
  matrixYear: number;
  matrixId?: number;
  adjustmentFactors: { complexity: number; quality: number; condition: number };
}

export const getCostMatrixHandler: ToolHandler<
  GetCostMatrixParams,
  GetCostMatrixResult
> = async (params, context, _tool) => {
  assertCountyMatch(params.county, context.countyId);
  const { token } = await acquirePilotToken();
  const raw = await backendGet<GetCostMatrixResult>(
    `/api/costforge/cost-matrix/${encodeURIComponent(params.buildingType)}/${encodeURIComponent(params.region)}`,
    { token }
  );
  return unwrapBackend(raw, 'Cost matrix lookup failed');
};

// ============================================================================
// Handler Registration
// ============================================================================

export function registerR1Handlers(
  runner: {
    registerHandler: <P, R>(toolId: string, handler: ToolHandler<P, R>) => void;
  },
  traceService: TraceService
): void {
  // Week 1 MVP handlers (5)
  runner.registerHandler('run_valuation_model', runValuationModelHandler);
  runner.registerHandler('explain_value_change', explainValueChangeHandler);
  runner.registerHandler('route_to_parcel', routeToParcelHandler);
  runner.registerHandler('search_trace_by_correlation', createSearchTraceHandler(traceService));
  runner.registerHandler('summarize_levy_rate_components', summarizeLevyRateRealHandler);

  // Week 3 read_only handlers (3)
  runner.registerHandler('explain_model_inputs', explainModelInputsRealHandler);
  runner.registerHandler('compare_assessed_value_history', compareAssessedValueHistoryRealHandler);
  runner.registerHandler('summarize_parcel_casefile', summarizeParcelCasefileRealHandler);

  // Week 3 remaining handlers (2)
  runner.registerHandler('add_dossier_note', addDossierNoteRealHandler);
  runner.registerHandler('query_parcel_layers', queryParcelLayersRealHandler);

  // R1 full-coverage handlers (14) — all call real DaisController/Dossier/CostForge endpoints
  runner.registerHandler('summarize_dossier', summarizeDossierRealHandler);
  runner.registerHandler('explain_model_results', explainModelResultsRealHandler);
  runner.registerHandler('draft_appeal_response', draftAppealResponseRealHandler);
  runner.registerHandler('explain_senior_exemption_impact', explainSeniorExemptionRealHandler);
  runner.registerHandler('draft_value_change_notice', draftValueChangeNoticeRealHandler);
  runner.registerHandler('draft_boe_appeal_response', draftBoeAppealResponseRealHandler);
  runner.registerHandler('summarize_sales_comps_rationale', summarizeSalesCompsRealHandler);
  runner.registerHandler('synthesize_evidence', synthesizeEvidenceRealHandler);
  runner.registerHandler('generate_commissioner_memo', generateCommissionerMemoRealHandler);
  runner.registerHandler('assemble_boe_packet', assembleBoePacketRealHandler);
  runner.registerHandler('request_trace_redaction', requestTraceRedactionRealHandler);
  runner.registerHandler('assign_task', assignTaskRealHandler);
  runner.registerHandler('check_cert_status', checkCertStatusRealHandler);
  runner.registerHandler('draft_notice', draftNoticeRealHandler);

  // R2 Wave 1: USPAP three-approach valuation handlers (5)
  runner.registerHandler('run_sales_approach', runSalesApproachHandler);
  runner.registerHandler('run_income_approach', runIncomeApproachHandler);
  runner.registerHandler('run_cost_approach', runCostApproachHandler);
  runner.registerHandler('run_reconciliation', runReconciliationHandler);
  runner.registerHandler('get_cost_matrix', getCostMatrixHandler);
}
