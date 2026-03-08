/**
 * Tool Service Router — Maps toolIds to direct frontend→backend service calls
 * =================================================================
 * R3.2: All 38 manifest tools have a route decision. Each tool maps to a
 * specific frontend service method that calls the real .NET backend.
 *
 * When the Pilot server is unavailable, routeToolInvocation() provides
 * a direct fallback path. If a backend returns 501, the error propagates
 * honestly (no fake success).
 *
 * ALIAS POLICY:
 * Some tools share backend endpoints with different parameter defaults.
 * Each alias gets its own route entry with explicit param marshalling.
 *
 * | Alias Tool               | Canonical Tool        | Shared Backend                        | Rationale                                |
 * |--------------------------|-----------------------|---------------------------------------|------------------------------------------|
 * | draft_value_change_notice| draft_notice          | POST /api/muse/draft/notice           | Same endpoint, noticeType='value_change' |
 * | draft_boe_appeal_response| draft_appeal_response | POST /api/muse/draft/appeal-response  | Same endpoint, BOE context               |
 *
 * Usage:
 *   const result = await routeToolInvocation('get_parcel_geometry', { parcelId: 'P-001' });
 */

import { atlasService } from './atlasService';
import { museService } from './museService';
import { daisService } from './daisService';
import { dossierService, type DocumentType } from './dossierService';
import { costForgeApiService } from './costForgeApiService';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ToolInvocationResult {
  ok: boolean;
  toolId: string;
  data?: unknown;
  error?: string;
}

export type ToolParams = Record<string, unknown>;

type ToolHandler = (params: ToolParams) => Promise<unknown>;

// ============================================================================
// TOOL ROUTE MAP — 38/38 manifest tools
// ============================================================================

const toolRoutes: Record<string, ToolHandler> = {
  // ── OS suite ────────────────────────────────────────────────────
  route_to_parcel: (p) =>
    Promise.resolve({
      action: 'navigate',
      target: `/property/${encodeURIComponent(p.parcelId as string)}`,
    }),

  request_trace_redaction: (p) =>
    daisService.requestTraceRedaction({
      traceId: p.traceId as string,
      reason: p.reason as string,
      fields: (p.fields as string[]) ?? [],
    }),

  search_trace_by_correlation: (p) =>
    // Trace search is frontend-local (telemetry store), not a backend call.
    // Returns a stub directing the caller to use the telemetry store directly.
    Promise.resolve({
      action: 'trace_search',
      correlationId: p.correlationId as string,
      note: 'Use getTelemetryStore().searchByCorrelation() for client-side trace lookup',
    }),

  get_muse_capabilities: () =>
    museService.getCapabilities(),

  // ── Atlas suite ─────────────────────────────────────────────────
  get_parcel_geometry: (p) =>
    atlasService.getParcel(p.parcelId as string),

  query_parcel_layers: (p) =>
    atlasService.getParcelLayers(p.parcelId as string),

  get_parcel_centroid: (p) =>
    atlasService.getParcelCentroid(p.parcelId as string),

  get_geometry_stats: () =>
    atlasService.getGeometryStats(),

  // ── DAIS suite ──────────────────────────────────────────────────
  assign_task: (p) =>
    daisService.assignTask({
      taskType: p.taskType as string,
      assigneeId: p.assigneeId as string,
      parcelId: p.parcelId as string | undefined,
      priority: p.priority as string | undefined,
      description: p.description as string | undefined,
    }),

  check_cert_status: (p) =>
    daisService.getCertificationStatus(p.year as number | undefined),

  assemble_boe_packet: (p) =>
    daisService.assembleBoePacket({
      caseId: p.caseId as string,
      parcelId: p.parcelId as string,
      includeSections: p.includeSections as string[] | undefined,
    }),

  draft_notice: (p) =>
    museService.draftNotice({
      parcelId: p.parcelId as string,
      noticeType: p.noticeType as string | undefined,
      taxYear: p.taxYear as number | undefined,
    }),

  draft_appeal_response: (p) =>
    museService.draftAppealResponse({
      parcelId: p.parcelId as string,
      caseId: p.caseId as string,
      assessedValue: p.assessedValue as number,
    }),

  explain_senior_exemption_impact: (p) =>
    daisService.getExemptionImpact(p.county as string),

  generate_commissioner_memo: (p) =>
    museService.generateMemo({
      topic: p.topic as string,
      context: p.context as string | undefined,
    }),

  summarize_levy_rate_components: (p) =>
    daisService.getLevyRateComponents({
      taxYear: p.taxYear as number | undefined,
      districtId: p.districtId as string | undefined,
    }),

  // Alias: draft_value_change_notice → draft_notice with noticeType='value_change'
  draft_value_change_notice: (p) =>
    museService.draftNotice({
      parcelId: p.parcelId as string,
      noticeType: 'value_change',
      taxYear: p.taxYear as number | undefined,
    }),

  // Alias: draft_boe_appeal_response → draft_appeal_response (BOE context)
  draft_boe_appeal_response: (p) =>
    museService.draftAppealResponse({
      parcelId: p.parcelId as string,
      caseId: p.caseId as string,
      assessedValue: p.assessedValue as number,
    }),

  summarize_sales_comps_rationale: (p) =>
    daisService.getSalesCompsRationale(p.parcelId as string),

  // ── Forge suite ─────────────────────────────────────────────────
  run_valuation_model: (p) =>
    costForgeApiService.runCostCalculation({
      propertyId: p.propertyId as string | undefined,
      parcelNumber: p.parcelNumber as string | undefined,
      region: p.region as string,
      buildingType: p.buildingType as string,
      additionalParameters: p.additionalParameters as Record<string, unknown> | undefined,
    }),

  explain_value_change: (p) =>
    museService.explainValueChange({
      parcelId: p.parcelId as string,
      fromYear: p.fromYear as number | undefined,
      toYear: p.toYear as number | undefined,
      fromValue: p.fromValue as number | undefined,
      toValue: p.toValue as number | undefined,
      audience: p.audience as 'taxpayer' | 'appraiser' | 'commissioner' | 'internal' | undefined,
    }),

  explain_model_results: (p) =>
    costForgeApiService.getCostBreakdown(p.propertyId as string),

  compare_assessed_value_history: (p) =>
    costForgeApiService.getModelInputs(p.propertyId as string),

  explain_model_inputs: (p) =>
    costForgeApiService.getModelInputs(p.propertyId as string),

  run_sales_approach: (p) =>
    costForgeApiService.runSalesApproach({
      subjectParcelId: p.subjectParcelId as string,
      comparables: p.comparables as Array<{
        parcelId: string; salePrice: number; saleDate: string;
        adjustments?: Record<string, number>;
      }>,
      adjustmentRates: p.adjustmentRates as Record<string, number> | undefined,
    }),

  run_income_approach: (p) =>
    costForgeApiService.runIncomeApproach({
      parcelId: p.parcelId as string,
      grossIncome: p.grossIncome as number,
      vacancyRate: p.vacancyRate as number,
      operatingExpenses: p.operatingExpenses as number,
      capitalizationRate: p.capitalizationRate as number,
      incomeType: p.incomeType as string | undefined,
    }),

  run_cost_approach: (p) =>
    costForgeApiService.runCostApproach({
      parcelId: p.parcelId as string,
      buildingType: p.buildingType as string,
      squareFeet: p.squareFeet as number,
      yearBuilt: p.yearBuilt as number,
      quality: p.quality as string,
      condition: p.condition as string,
      region: p.region as string,
      landValue: p.landValue as number | undefined,
    }),

  run_reconciliation: (p) =>
    costForgeApiService.runReconciliation({
      parcelId: p.parcelId as string,
      propertyType: p.propertyType as string,
      approaches: p.approaches as {
        salesComparison?: { value: number; confidence: number };
        incomeCapitalization?: { value: number; confidence: number };
        costApproach?: { value: number; confidence: number };
      },
      reconciliationMethod: p.reconciliationMethod as string | undefined,
    }),

  get_cost_matrix: (p) =>
    costForgeApiService.getCostMatrix(
      p.buildingType as string,
      p.region as string,
    ),

  muse_explain_assessment: (p) =>
    museService.explainAssessment({
      parcelId: p.parcelId as string,
      audience: p.audience as string | undefined,
    }),

  muse_synthesize_evidence: (p) =>
    museService.synthesizeEvidence({
      parcelId: p.parcelId as string,
    }),

  // ── Dossier suite ───────────────────────────────────────────────
  summarize_dossier: (p) =>
    dossierService.getDetails(p.parcelId as string),

  synthesize_evidence: (p) =>
    dossierService.getEvidenceSnapshot(p.parcelId as string),

  summarize_parcel_casefile: (p) =>
    dossierService.getCasefile(p.parcelId as string),

  search_dossier_documents: (p) =>
    dossierService.searchDocuments({
      parcelId: p.parcelId as string | undefined,
      query: p.query as string | undefined,
      type: (p.type as DocumentType | 'all' | undefined),
      limit: p.limit as number | undefined,
    }),

  upload_dossier_document: (p) =>
    dossierService.uploadDocument(
      p.parcelId as string,
      p.file as File,
      ((p.documentType as string | undefined) ?? 'report') as DocumentType,
      p.name as string | undefined,
    ),

  get_document_chain_of_custody: (p) =>
    dossierService.getDocumentChain(
      p.parcelId as string,
      p.documentId as string,
    ),

  add_dossier_note: (p) =>
    dossierService.addNote(p.parcelId as string, {
      content: p.content as string,
      category: p.category as string | undefined,
      visibility: p.visibility as string | undefined,
    }),
};

// ============================================================================
// ROUTER
// ============================================================================

/**
 * Route a tool invocation to the correct frontend service.
 * Returns { ok: false } if no direct route is available (caller should
 * fall back to pilotApi.invokePilotTool).
 *
 * If the backend returns a non-2xx response (including 501 for stubs),
 * the error is propagated honestly — no fake success.
 */
export async function routeToolInvocation(
  toolId: string,
  params: ToolParams
): Promise<ToolInvocationResult> {
  const handler = toolRoutes[toolId];

  if (!handler) {
    return {
      ok: false,
      toolId,
      error: `No direct route for tool: ${toolId}. Use Pilot invoke path.`,
    };
  }

  try {
    const data = await handler(params);
    return { ok: true, toolId, data };
  } catch (err) {
    return {
      ok: false,
      toolId,
      error: err instanceof Error ? err.message : 'Tool invocation failed',
    };
  }
}

/**
 * Check if a tool has a direct frontend route (vs. requiring Pilot server).
 */
export function hasDirectRoute(toolId: string): boolean {
  return toolId in toolRoutes;
}

/**
 * Get all tool IDs that have direct frontend routes.
 */
export function getDirectRouteToolIds(): string[] {
  return Object.keys(toolRoutes);
}

/**
 * Get the count of tools with direct routes.
 */
export function getDirectRouteCount(): number {
  return Object.keys(toolRoutes).length;
}

// ============================================================================
// SUITE METADATA (for UI grouping)
// ============================================================================

export interface SuiteInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export const SUITE_INFO: Record<string, SuiteInfo> = {
  forge: {
    id: 'forge',
    name: 'CostForge',
    description: 'Valuation models, cost analysis, and USPAP approaches',
    icon: '⚒️',
    color: 'purple',
  },
  atlas: {
    id: 'atlas',
    name: 'TerraAtlas',
    description: 'GIS geometry, parcel boundaries, and spatial queries',
    icon: '🗺️',
    color: 'cyan',
  },
  dais: {
    id: 'dais',
    name: 'DAIS',
    description: 'District assessment, certification, and compliance',
    icon: '📊',
    color: 'amber',
  },
  dossier: {
    id: 'dossier',
    name: 'Dossier',
    description: 'Property case files, documents, and evidence',
    icon: '📁',
    color: 'indigo',
  },
  os: {
    id: 'os',
    name: 'OS',
    description: 'System navigation and platform operations',
    icon: '🖥️',
    color: 'slate',
  },
  pilot: {
    id: 'pilot',
    name: 'Pilot',
    description: 'Tool orchestration and governance',
    icon: '🎮',
    color: 'emerald',
  },
  gpt: {
    id: 'gpt',
    name: 'GPT',
    description: 'AI assistant and natural language processing',
    icon: '🤖',
    color: 'pink',
  },
};

/**
 * Group tools by suite for UI display.
 */
export function groupToolsBySuite<T extends { suite: string }>(
  tools: T[]
): Record<string, T[]> {
  const grouped: Record<string, T[]> = {};
  for (const tool of tools) {
    if (!grouped[tool.suite]) grouped[tool.suite] = [];
    grouped[tool.suite].push(tool);
  }
  return grouped;
}
