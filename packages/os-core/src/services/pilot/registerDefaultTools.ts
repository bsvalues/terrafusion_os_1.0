/**
 * Default Tool Definitions - Government-grade property assessment tools
 *
 * Each tool defines:
 * - suite: Logical grouping (atlas, dais, forge, etc.)
 * - writeLane: Isolation lane for write operations
 * - risk: read_only | write_low | write_high | irreversible
 * - requiredPermissions: RBAC permissions needed
 * - handler: Actual execution logic
 */

import { ToolRegistry } from './ToolRegistry';
import type { ToolDefinition } from './ToolRunner';

// ════════════════════════════════════════════════════════════════════════════
// ATLAS SUITE - Parcel and GIS operations
// ════════════════════════════════════════════════════════════════════════════

const atlasParcelRead: ToolDefinition = {
  id: 'atlas.parcel.read',
  suite: 'atlas',
  writeLane: 'atlas:read',
  risk: 'read_only',
  requiredPermissions: ['parcel:read'],
  handler: async (params: { parcelId: string }) => {
    // TODO: Wire to real GIS data source
    return {
      parcelId: params.parcelId,
      status: 'found',
      acres: 2.5,
      zoning: 'R-1',
      mock: true,
    };
  },
};

// API base for the .NET Kernel (port 5000 by default, configurable)
const API_BASE = process.env.TERRAFUSION_API_BASE ?? 'http://localhost:5000';

interface ParcelWorkbenchParams {
  parcelId: string;
  taxYear?: number;
  era?: string;
}

// ── Output schema contracts (camelCase wire keys; nullable fields present as null, never omitted) ──

interface GeometryFacet {
  tfParcelId: string;
  countyId: string;
  geomWkt: string;
  centroidLat: number;
  centroidLon: number;
  areaSqFt: number;
  lastSyncedAt: string;
  sourceServiceUrl: string;
  isActive: boolean;
}

interface OwnerEntry {
  tfOwnerId: string;
  // CAUTION: acctId is emitted as a JSON number from int64.
  // Valid JSON, but can exceed Number.MAX_SAFE_INTEGER (2^53-1).
  acctId: number;
  displayName: string;
  pctOwnership: number | null;
  isPrimary: boolean;
  confidentialFlag: boolean;
  webSuppression: boolean;
}

interface OwnerCurrentFacet {
  tfParcelId: string;
  countyId: string;
  taxYear: number;
  owners: OwnerEntry[];
}

interface WsdorEntry {
  tfAssessmentWsdorId: string;
  tfOwnerId: string;
  ownerDisplayName: string;
  assessedVal: number | null;
  marketVal: number | null;
  appraisedVal: number | null;
  taxableClassified: number | null;
  taxableNonClassified: number | null;
  landTaxableClassified: number | null;
  landTaxableNonClassified: number | null;
  imprvTaxableClassified: number | null;
  imprvTaxableNonClassified: number | null;
  stateValueClassified: number | null;
  stateValueNonClassified: number | null;
  boeStatus: string | null;
  disasterProrationPct: number | null;
  snrFrzImprvHs: number | null;
  snrFrzLandHs: number | null;
}

interface WsdorRollFacet {
  tfParcelId: string;
  countyId: string;
  assessmentYear: number;
  entries: WsdorEntry[];
  assessedValTotal: number | null;
  marketValTotal: number | null;
}

interface ParcelWorkbenchResult {
  parcelId: string;
  geometry: GeometryFacet | null;
  ownerCurrent: OwnerCurrentFacet | null;
  wsdorRoll: WsdorRollFacet | null;
  errors: string[];
}

const FACET_TIMEOUT_MS = 8_000;

async function fetchFacet<T>(url: string): Promise<{ data: T | null; error: string | null }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FACET_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (res.status === 404) return { data: null, error: null };
    if (!res.ok) return { data: null, error: `HTTP ${res.status} from ${url}` };
    return { data: (await res.json()) as T, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message ?? String(err) };
  } finally {
    clearTimeout(timeoutId);
  }
}

const atlasParcelWorkbench: ToolDefinition = {
  id: 'atlas.parcel.workbench',
  suite: 'atlas',
  writeLane: 'atlas:read',
  risk: 'read_only',
  requiredPermissions: ['parcel:read'],
  handler: async (params: ParcelWorkbenchParams): Promise<ParcelWorkbenchResult> => {
    const { parcelId, taxYear, era } = params;
    const year = taxYear ?? new Date().getFullYear();
    const eraParam = era ? `&era=${encodeURIComponent(era)}` : '';
    const encodedParcelId = encodeURIComponent(parcelId);

    const [geom, owner, wsdor] = await Promise.all([
      fetchFacet<GeometryFacet>(`${API_BASE}/api/parcels/${encodedParcelId}/geometry`),
      fetchFacet<OwnerCurrentFacet>(`${API_BASE}/api/parcels/${encodedParcelId}/owner-current?taxYear=${year}${eraParam}`),
      fetchFacet<WsdorRollFacet>(`${API_BASE}/api/parcels/${encodedParcelId}/wsdor-roll?taxYear=${year}${eraParam}`),
    ]);

    const errors: string[] = [];
    if (geom.error) errors.push(`geometry: ${geom.error}`);
    if (owner.error) errors.push(`ownerCurrent: ${owner.error}`);
    if (wsdor.error) errors.push(`wsdorRoll: ${wsdor.error}`);

    return {
      parcelId,
      geometry: geom.data,
      ownerCurrent: owner.data,
      wsdorRoll: wsdor.data,
      errors,
    };
  },
};

const atlasParcelSearch: ToolDefinition = {
  id: 'atlas.parcel.search',
  suite: 'atlas',
  writeLane: 'atlas:read',
  risk: 'read_only',
  requiredPermissions: ['parcel:read'],
  handler: async (params: { query: string; limit?: number }) => {
    // TODO: Wire to real search index
    return {
      query: params.query,
      results: [],
      total: 0,
      mock: true,
    };
  },
};

// ════════════════════════════════════════════════════════════════════════════
// DAIS SUITE - Workflow and document operations
// ════════════════════════════════════════════════════════════════════════════

const daisWorkflowRead: ToolDefinition = {
  id: 'dais.workflow.read',
  suite: 'dais',
  writeLane: 'dais:read',
  risk: 'read_only',
  requiredPermissions: ['workflow:read'],
  handler: async (params: { workflowId: string }) => {
    return {
      workflowId: params.workflowId,
      status: 'pending',
      steps: [],
      mock: true,
    };
  },
};

const daisWorkflowAdvance: ToolDefinition = {
  id: 'dais.workflow.advance',
  suite: 'dais',
  writeLane: 'dais:workflow',
  risk: 'write_low',
  requiredPermissions: ['workflow:write'],
  handler: async (params: { workflowId: string; step: string }) => {
    return {
      workflowId: params.workflowId,
      advancedTo: params.step,
      success: true,
      mock: true,
    };
  },
};

// ════════════════════════════════════════════════════════════════════════════
// FORGE SUITE - Valuation and assessment operations
// ════════════════════════════════════════════════════════════════════════════

const forgeValuationRead: ToolDefinition = {
  id: 'forge.valuation.read',
  suite: 'forge',
  writeLane: 'forge:read',
  risk: 'read_only',
  requiredPermissions: ['valuation:read'],
  handler: async (params: { valuationId: string }) => {
    return {
      valuationId: params.valuationId,
      assessedValue: 250000,
      taxYear: 2026,
      mock: true,
    };
  },
};

const forgeValuationCommit: ToolDefinition = {
  id: 'forge.valuation.commit',
  suite: 'forge',
  writeLane: 'forge:valuation',
  risk: 'write_high',
  requiredPermissions: ['valuation:commit'],
  handler: async (params: { parcelId: string; value: number; notes?: string }) => {
    // This is write_high - requires _confirmationToken
    return {
      committed: true,
      valuationId: `val-${Date.now()}`,
      parcelId: params.parcelId,
      value: params.value,
      mock: true,
    };
  },
};

const forgeValuationFinalize: ToolDefinition = {
  id: 'forge.valuation.finalize',
  suite: 'forge',
  writeLane: 'forge:valuation',
  risk: 'irreversible',
  requiredPermissions: ['valuation:finalize', 'valuation:commit'],
  handler: async (params: { valuationId: string; certify: boolean }) => {
    // This is irreversible - requires _confirmationToken
    return {
      finalized: true,
      valuationId: params.valuationId,
      certified: params.certify,
      timestamp: new Date().toISOString(),
      mock: true,
    };
  },
};

// ════════════════════════════════════════════════════════════════════════════
// REGISTRATION
// ════════════════════════════════════════════════════════════════════════════

/**
 * Register all default tools with the registry
 */
export function registerDefaultTools(): void {
  // Atlas suite
  ToolRegistry.register(atlasParcelRead);
  ToolRegistry.register(atlasParcelSearch);
  ToolRegistry.register(atlasParcelWorkbench);

  // Dais suite
  ToolRegistry.register(daisWorkflowRead);
  ToolRegistry.register(daisWorkflowAdvance);

  // Forge suite
  ToolRegistry.register(forgeValuationRead);
  ToolRegistry.register(forgeValuationCommit);
  ToolRegistry.register(forgeValuationFinalize);
}

/**
 * Get tool definitions for documentation/schema generation
 */
export const defaultTools = {
  atlasParcelRead,
  atlasParcelSearch,
  atlasParcelWorkbench,
  daisWorkflowRead,
  daisWorkflowAdvance,
  forgeValuationRead,
  forgeValuationCommit,
  forgeValuationFinalize,
};
