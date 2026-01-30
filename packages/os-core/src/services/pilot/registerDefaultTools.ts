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
  daisWorkflowRead,
  daisWorkflowAdvance,
  forgeValuationRead,
  forgeValuationCommit,
  forgeValuationFinalize,
};
