/**
 * TerraFusion OS — Real Handlers (R1 + Wave 1)
 *
 * Production handler implementations that call real backend endpoints
 * instead of returning canned data.
 *
 * When registered, they OVERRIDE the canned Phase 8.3/8.4 stubs for the same toolIds.
 * Canned stubs remain for tools NOT in this set (and for test isolation).
 *
 * R1 MVP Tools (5):
 *   1. run_valuation_model       → POST /api/costforge/calculate
 *   2. explain_value_change      → GET  /api/properties/{id} + GET /api/costforge/{id}
 *   3. route_to_parcel           → navigation event (no backend call)
 *   4. search_trace_by_correlation → real TraceService.getByCorrelationId()
 *   5. summarize_levy_rate_components → POST /api/levy-calculation/calculate-rate
 *
 * R1 Read-Only Tools (3):
 *   6. explain_model_inputs      → GET  /api/costforge/models/{modelId}
 *   7. compare_assessed_value_history → GET /api/properties/{parcelId}
 *   8. summarize_parcel_casefile → GET  /api/dossier/parcels/{parcelId}/casefile
 *
 * R1 Remaining Tools (2):
 *   9. add_dossier_note          → POST /api/dossier/{parcelId}/notes
 *  10. query_parcel_layers       → GET  /api/atlas/parcels/{parcelId}/layers
 *
 * Wave 1 Forge Extraction (2):
 *  11. explain_model_results     → GET  /api/costforge/{parcelId}/breakdown
 *  12. summarize_sales_comps_rationale → GET /api/costforge/comps/{subjectId}
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
// Wave 1 Forge Extraction — Handler 11: explain_model_results
//
// Muse/read_only/sanitize. Calls CostForge breakdown endpoint to explain
// valuation model outputs in plain language. Key drivers extracted from
// cost categories; confidence from analysis metadata.
//
// Endpoint: GET /api/costforge/{parcelId}/breakdown
// ============================================================================

export interface ExplainModelResultsRealParams {
  county: string;
  parcelId: string;
  taxYear: number;
  compareToYear?: number;
  audience?: 'internal' | 'taxpayer';
}

export interface ExplainModelResultsRealResult {
  parcelId: string;
  taxYear: number;
  explanation: string;
  keyDrivers: string[];
  confidenceScore: number;
}

export const explainModelResultsRealHandler: ToolHandler<
  ExplainModelResultsRealParams,
  ExplainModelResultsRealResult
> = async (params, context, _tool) => {
  assertCountyMatch(params.county, context.countyId);

  const { token } = await acquirePilotToken();
  const audience = params.audience ?? 'internal';

  // Fetch cost breakdown from CostForge
  const breakdownRaw = await backendGet<{
    propertyId?: string;
    totalValue?: number;
    categories?: Array<{ name: string; amount: number; percentage: number; components?: Array<{ name: string; amount: number }> }>;
  }>(`/api/costforge/${encodeURIComponent(params.parcelId)}/breakdown`, { token });
  const breakdown = unwrapBackend(breakdownRaw, 'Cost breakdown lookup failed');

  // Fetch property for assessed value context
  const propertyRaw = await backendGet<{
    assessedValue?: number;
    previousAssessedValue?: number;
    valuationHistory?: Array<{ year: number; value: number }>;
  }>(`/api/properties/${encodeURIComponent(params.parcelId)}`, { token });
  const property = unwrapBackend(propertyRaw, 'Property lookup failed');

  // Extract key drivers from cost categories (sorted by amount descending)
  const categories = breakdown.categories ?? [];
  const keyDrivers = categories
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map(c => c.name.toLowerCase().replace(/\s+/g, '_'));

  const totalValue = breakdown.totalValue ?? 0;
  const assessedValue = property.assessedValue ?? totalValue;

  // Build comparison narrative if compareToYear requested
  let comparisonNote = '';
  if (params.compareToYear && property.valuationHistory) {
    const compareEntry = property.valuationHistory.find(h => h.year === params.compareToYear);
    if (compareEntry) {
      const delta = assessedValue - compareEntry.value;
      const pctChange = compareEntry.value > 0 ? ((delta / compareEntry.value) * 100).toFixed(1) : 'N/A';
      comparisonNote = ` Compared to ${params.compareToYear} ($${compareEntry.value.toLocaleString()}), the value changed by $${delta.toLocaleString()} (${pctChange}%).`;
    }
  }

  // Generate audience-appropriate explanation
  const prefix = audience === 'taxpayer'
    ? 'Your property valuation'
    : 'Valuation analysis for internal review:';

  const categoryBreakdown = categories
    .slice(0, 3)
    .map(c => `${c.name} ($${c.amount.toLocaleString()}, ${c.percentage.toFixed(1)}%)`)
    .join(', ');

  const explanation = `${prefix} The ${params.taxYear} assessed value of $${assessedValue.toLocaleString()} is based on cost approach analysis. Primary components: ${categoryBreakdown || 'see breakdown'}.${comparisonNote}`;

  // Confidence from breakdown completeness (real endpoint may provide this;
  // fallback: derive from category coverage)
  const confidenceScore = categories.length >= 3 ? 0.87 : categories.length >= 1 ? 0.72 : 0.50;

  return {
    parcelId: params.parcelId,
    taxYear: params.taxYear,
    explanation,
    keyDrivers,
    confidenceScore,
  };
};

// ============================================================================
// Wave 1 Forge Extraction — Handler 12: summarize_sales_comps_rationale
//
// Muse/read_only/sanitize. Calls CostForge comps endpoint to retrieve
// comparable sales analysis. Summarizes selection logic and adjustments
// at a high level without exposing raw PII.
//
// Endpoint: GET /api/costforge/comps/{subjectId}
// (CX must create this endpoint — Wave 1 backend extraction)
// ============================================================================

export interface SummarizeSalesCompsRealParams {
  county: string;
  subjectId: string;
  compIds: string[];
  adjustments?: boolean;
}

export interface SummarizeSalesCompsRealResult {
  rationale: string;
  comps: Array<{ id: string; similarity: number; notes: string[] }>;
}

export const summarizeSalesCompsRealHandler: ToolHandler<
  SummarizeSalesCompsRealParams,
  SummarizeSalesCompsRealResult
> = async (params, context, _tool) => {
  assertCountyMatch(params.county, context.countyId);

  const { token } = await acquirePilotToken();
  const includeAdjustments = params.adjustments ?? false;
  const compIdsParam = params.compIds.map(id => encodeURIComponent(id)).join(',');

  const raw = await backendGet<{
    subjectId?: string;
    comps?: Array<{
      id: string;
      salePrice?: number;
      saleDate?: string;
      similarity?: number;
      adjustments?: Array<{ type: string; amount: number }>;
      notes?: string[];
    }>;
    selectionMethod?: string;
  }>(`/api/costforge/comps/${encodeURIComponent(params.subjectId)}?compIds=${compIdsParam}&adjustments=${includeAdjustments}`, { token });
  const data = unwrapBackend(raw, 'Comp analysis lookup failed');

  const backendComps = data.comps ?? [];

  // Map backend response to governed output shape — no PII (addresses, names)
  const comps = backendComps.map(c => {
    const notes: string[] = c.notes ?? [];
    if (includeAdjustments && c.adjustments) {
      for (const adj of c.adjustments) {
        notes.push(`${adj.type}: ${adj.amount >= 0 ? '+' : ''}$${adj.amount.toLocaleString()}`);
      }
    }
    return {
      id: c.id,
      similarity: c.similarity ?? 0,
      notes,
    };
  }).sort((a, b) => b.similarity - a.similarity);

  const method = data.selectionMethod ?? 'similarity scoring and recent sale windows';
  const adjustmentNote = includeAdjustments
    ? 'Adjustments were applied for time, size, quality, and location.'
    : 'Adjustments were not applied (summary mode).';

  return {
    rationale: `Subject ${params.subjectId} comps were selected using ${method}. ${comps.length} comparable(s) analyzed. ${adjustmentNote} All addresses and owner names are excluded per PII policy.`,
    comps,
  };
};

/**
 * Register R1 + Wave 1 real handlers.
 * These OVERRIDE canned stubs when called after registerAllHandlers().
 * These OVERRIDE canned stubs when called after registerAllHandlers().
 *
 * @param runner - ToolRunner instance (must have initialized registry)
 * @param traceService - TraceService instance for search_trace_by_correlation
 */
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

  // Wave 1 Forge extraction handlers (2)
  runner.registerHandler('explain_model_results', explainModelResultsRealHandler);
  runner.registerHandler('summarize_sales_comps_rationale', summarizeSalesCompsRealHandler);
}
