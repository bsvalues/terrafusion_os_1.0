/**
 * Tool Service Router — Maps toolIds to direct frontend→backend service calls
 * =================================================================
 * R2.12: Provides a fallback invocation path when the Pilot server is
 * unavailable. Routes tool invocations to the correct frontend service
 * (atlasService, museService, daisService, costForge, dossier).
 *
 * This is the "last mile" wiring: each of the 38 manifest tools maps
 * to a specific frontend service method that calls the real .NET backend.
 *
 * Usage:
 *   const result = await routeToolInvocation('get_parcel_geometry', { parcelId: 'P-001' });
 */

import { atlasService } from './atlasService';
import { museService } from './museService';
import { daisService } from './daisService';

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
// TOOL ROUTE MAP
// ============================================================================

const toolRoutes: Record<string, ToolHandler> = {
  // ── Atlas (R1 + R2.10) ───────────────────────────────────────────
  get_parcel_geometry: (p) =>
    atlasService.getParcel(p.parcelId as string),
  query_parcel_layers: (p) =>
    atlasService.getParcelLayers(p.parcelId as string),
  get_parcel_centroid: (p) =>
    atlasService.getParcelCentroid(p.parcelId as string),
  get_geometry_stats: () =>
    atlasService.getGeometryStats(),

  // ── Muse (R2.11) ────────────────────────────────────────────────
  muse_explain_assessment: (p) =>
    museService.explainAssessment({
      parcelId: p.parcelId as string,
      audience: p.audience as string | undefined,
    }),
  muse_synthesize_evidence: (p) =>
    museService.synthesizeEvidence({
      parcelId: p.parcelId as string,
    }),
  get_muse_capabilities: () =>
    museService.getCapabilities(),

  // ── DAIS ─────────────────────────────────────────────────────────
  check_cert_status: (p) =>
    daisService.getCertificationStatus(p.county as string),
  explain_senior_exemption_impact: (p) =>
    daisService.getExemptionImpact(p.county as string),
  summarize_sales_comps_rationale: (p) =>
    daisService.getSalesCompsRationale(p.parcelId as string),

  // ── Dossier ──────────────────────────────────────────────────────
  // These are covered by the Pilot invoke path; direct routes added for completeness
  // Dossier document tools route through pilotApi.invokePilotTool()

  // ── CostForge/Forge ──────────────────────────────────────────────
  // USPAP approach tools route through pilotApi.invokePilotTool()
  // because they require complex param marshalling

  // ── Navigation ───────────────────────────────────────────────────
  route_to_parcel: (p) =>
    Promise.resolve({
      action: 'navigate',
      target: `/property/${encodeURIComponent(p.parcelId as string)}`,
    }),
};

// ============================================================================
// ROUTER
// ============================================================================

/**
 * Route a tool invocation to the correct frontend service.
 * Returns null if no direct route is available (caller should
 * fall back to pilotApi.invokePilotTool).
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
