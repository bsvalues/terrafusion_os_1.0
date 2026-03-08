/**
 * Tool Service Router Coverage Test
 * =================================================================
 * R4.5: Expanded from 6 tests to full 38-tool coverage.
 *
 * R3.2 Condition 1: Asserts every manifest tool has exactly one route
 * decision in toolRoutes. Fails if manifest adds a tool without a
 * corresponding route, or if a route exists without a manifest entry.
 *
 * Additional coverage (R4.5):
 *   - Per-suite tool counts match expected ranges
 *   - Alias tools resolve correctly with distinct route entries
 *   - routeToolInvocation returns proper response shapes
 *   - SUITE_INFO has entries for every suite present in manifest
 *   - No orphaned routes or orphaned tools
 *   - PropertyPilot SUITE_ORDER covers all manifest suites
 *
 * This is the gatekeeper: no tool can be silently unrouted.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  hasDirectRoute,
  getDirectRouteToolIds,
  getDirectRouteCount,
  routeToolInvocation,
  SUITE_INFO,
  groupToolsBySuite,
} from '../../services/toolServiceRouter';

// ============================================================================
// Load canonical manifest
// ============================================================================

const MANIFEST_PATH = resolve(
  __dirname,
  '../../../../../../tools/registry/terrapilot.tools.json'
);

interface ManifestTool {
  toolId: string;
  suite: string;
  risk: string;
  mode: string;
  displayName: string;
  [key: string]: unknown;
}

interface ToolManifest {
  version: string;
  tools: ManifestTool[];
}

let manifest: ToolManifest;

try {
  manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
} catch {
  // If manifest can't be loaded (e.g., in CI without full repo), skip gracefully
  manifest = { version: '0.0.0', tools: [] };
}

const manifestToolIds = manifest.tools.map((t) => t.toolId);
const routedToolIds = getDirectRouteToolIds();

// Group manifest tools by suite for suite-level assertions
const manifestBySuite: Record<string, ManifestTool[]> = {};
for (const tool of manifest.tools) {
  if (!manifestBySuite[tool.suite]) manifestBySuite[tool.suite] = [];
  manifestBySuite[tool.suite].push(tool);
}

const manifestSuiteIds = Object.keys(manifestBySuite).sort();

// ============================================================================
// R3.2 — Core Bidirectional Coverage
// ============================================================================

describe('toolServiceRouter coverage (R3.2)', () => {
  it('should have the same count as the manifest', () => {
    expect(routedToolIds.length).toBe(manifest.tools.length);
    expect(routedToolIds.length).toBe(38);
  });

  it('every manifest tool should have a direct route', () => {
    const missingRoutes = manifestToolIds.filter((id) => !hasDirectRoute(id));
    expect(missingRoutes).toEqual([]);
  });

  it('every routed tool should exist in the manifest', () => {
    const orphanRoutes = routedToolIds.filter(
      (id) => !manifestToolIds.includes(id)
    );
    expect(orphanRoutes).toEqual([]);
  });

  it('no manifest tool should map to more than one conflicting handler', () => {
    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const id of manifestToolIds) {
      if (seen.has(id)) duplicates.push(id);
      seen.add(id);
    }
    expect(duplicates).toEqual([]);
  });

  it('alias tools should have distinct route entries', () => {
    const aliases = [
      { alias: 'draft_value_change_notice', canonical: 'draft_notice' },
      { alias: 'draft_boe_appeal_response', canonical: 'draft_appeal_response' },
    ];

    for (const { alias, canonical } of aliases) {
      expect(hasDirectRoute(alias)).toBe(true);
      expect(hasDirectRoute(canonical)).toBe(true);
      expect(routedToolIds).toContain(alias);
      expect(routedToolIds).toContain(canonical);
    }
  });

  it('hasDirectRoute returns true for all 38 tools', () => {
    for (const toolId of manifestToolIds) {
      expect(hasDirectRoute(toolId)).toBe(true);
    }
  });
});

// ============================================================================
// R4.5 — Suite-Level Assertions
// ============================================================================

describe('toolServiceRouter suite coverage (R4.5)', () => {
  // Expected tool counts per suite (from canonical manifest)
  // forge: 12, atlas: 4, dais: 10, dossier: 8, os: 4
  const EXPECTED_SUITE_COUNTS: Record<string, { min: number; max: number }> = {
    forge:   { min: 9,  max: 14 },
    atlas:   { min: 3,  max: 8 },
    dais:    { min: 8,  max: 12 },
    dossier: { min: 5,  max: 10 },
    os:      { min: 3,  max: 6 },
  };

  it('manifest has exactly 5 suites', () => {
    expect(manifestSuiteIds).toEqual(['atlas', 'dais', 'dossier', 'forge', 'os']);
  });

  it.each(Object.entries(EXPECTED_SUITE_COUNTS))(
    'suite "%s" tool count is in expected range [%p]',
    (suite, range) => {
      const count = manifestBySuite[suite]?.length ?? 0;
      expect(count).toBeGreaterThanOrEqual(range.min);
      expect(count).toBeLessThanOrEqual(range.max);
    }
  );

  it('forge suite has ~12 tools (3 USPAP approaches + reconciliation + cost matrix + valuation + explain + comps + muse)', () => {
    const forgeTools = manifestBySuite['forge'] ?? [];
    expect(forgeTools.length).toBe(12);
    const forgeIds = forgeTools.map((t) => t.toolId);
    // Must include the three USPAP approaches
    expect(forgeIds).toContain('run_sales_approach');
    expect(forgeIds).toContain('run_income_approach');
    expect(forgeIds).toContain('run_cost_approach');
    expect(forgeIds).toContain('run_reconciliation');
    expect(forgeIds).toContain('get_cost_matrix');
    expect(forgeIds).toContain('run_valuation_model');
    expect(forgeIds).toContain('explain_value_change');
    expect(forgeIds).toContain('explain_model_results');
    expect(forgeIds).toContain('compare_assessed_value_history');
    expect(forgeIds).toContain('explain_model_inputs');
    expect(forgeIds).toContain('summarize_sales_comps_rationale');
    expect(forgeIds).toContain('muse_explain_assessment');
  });

  it('atlas suite has 4 tools (geometry, layers, centroid, stats)', () => {
    const atlasTools = manifestBySuite['atlas'] ?? [];
    expect(atlasTools.length).toBe(4);
    const atlasIds = atlasTools.map((t) => t.toolId);
    expect(atlasIds).toContain('get_parcel_geometry');
    expect(atlasIds).toContain('query_parcel_layers');
    expect(atlasIds).toContain('get_parcel_centroid');
    expect(atlasIds).toContain('get_geometry_stats');
  });

  it('dais suite has 10 tools (workflow + notices + aliases)', () => {
    const daisTools = manifestBySuite['dais'] ?? [];
    expect(daisTools.length).toBe(10);
    const daisIds = daisTools.map((t) => t.toolId);
    expect(daisIds).toContain('assign_task');
    expect(daisIds).toContain('check_cert_status');
    expect(daisIds).toContain('assemble_boe_packet');
    expect(daisIds).toContain('draft_notice');
    expect(daisIds).toContain('draft_appeal_response');
    expect(daisIds).toContain('draft_value_change_notice');
    expect(daisIds).toContain('draft_boe_appeal_response');
    expect(daisIds).toContain('explain_senior_exemption_impact');
    expect(daisIds).toContain('generate_commissioner_memo');
    expect(daisIds).toContain('summarize_levy_rate_components');
  });

  it('dossier suite has 8 tools (casefile + evidence + documents + notes + muse)', () => {
    const dossierTools = manifestBySuite['dossier'] ?? [];
    expect(dossierTools.length).toBe(8);
    const dossierIds = dossierTools.map((t) => t.toolId);
    expect(dossierIds).toContain('summarize_dossier');
    expect(dossierIds).toContain('synthesize_evidence');
    expect(dossierIds).toContain('summarize_parcel_casefile');
    expect(dossierIds).toContain('search_dossier_documents');
    expect(dossierIds).toContain('upload_dossier_document');
    expect(dossierIds).toContain('get_document_chain_of_custody');
    expect(dossierIds).toContain('add_dossier_note');
    expect(dossierIds).toContain('muse_synthesize_evidence');
  });

  it('os suite has 4 tools (routing + redaction + trace + muse capabilities)', () => {
    const osTools = manifestBySuite['os'] ?? [];
    expect(osTools.length).toBe(4);
    const osIds = osTools.map((t) => t.toolId);
    expect(osIds).toContain('route_to_parcel');
    expect(osIds).toContain('request_trace_redaction');
    expect(osIds).toContain('search_trace_by_correlation');
    expect(osIds).toContain('get_muse_capabilities');
  });
});

// ============================================================================
// R4.5 — SUITE_INFO Consistency
// ============================================================================

describe('SUITE_INFO completeness (R4.5)', () => {
  it('every manifest suite has a matching SUITE_INFO entry', () => {
    const missingSuites = manifestSuiteIds.filter((s) => !SUITE_INFO[s]);
    expect(missingSuites).toEqual([]);
  });

  it('every SUITE_INFO entry has required fields', () => {
    for (const [key, info] of Object.entries(SUITE_INFO)) {
      expect(info.id).toBe(key);
      expect(typeof info.name).toBe('string');
      expect(info.name.length).toBeGreaterThan(0);
      expect(typeof info.description).toBe('string');
      expect(info.description.length).toBeGreaterThan(0);
      expect(typeof info.icon).toBe('string');
      expect(typeof info.color).toBe('string');
    }
  });

  it('groupToolsBySuite groups all manifest tools correctly', () => {
    const grouped = groupToolsBySuite(manifest.tools);
    for (const suite of manifestSuiteIds) {
      expect(grouped[suite]).toBeDefined();
      expect(grouped[suite].length).toBe(manifestBySuite[suite].length);
    }
    // Total across groups should equal total tools
    const totalGrouped = Object.values(grouped).reduce((sum, arr) => sum + arr.length, 0);
    expect(totalGrouped).toBe(38);
  });

  it('each SUITE_INFO entry with manifest tools has at least one tool', () => {
    for (const suite of manifestSuiteIds) {
      const count = manifestBySuite[suite]?.length ?? 0;
      expect(count).toBeGreaterThanOrEqual(1);
      expect(SUITE_INFO[suite]).toBeDefined();
    }
  });

  it('PropertyPilot SUITE_ORDER covers all manifest suites', () => {
    // SUITE_ORDER from PropertyPilot.tsx
    const SUITE_ORDER = ['forge', 'atlas', 'dais', 'dossier', 'os', 'pilot', 'gpt'];
    for (const suite of manifestSuiteIds) {
      expect(SUITE_ORDER).toContain(suite);
    }
  });
});

// ============================================================================
// R4.5 — Alias Tool Verification
// ============================================================================

describe('alias tool resolution (R4.5)', () => {
  const ALIASES = [
    {
      alias: 'draft_value_change_notice',
      canonical: 'draft_notice',
      suite: 'dais',
    },
    {
      alias: 'draft_boe_appeal_response',
      canonical: 'draft_appeal_response',
      suite: 'dais',
    },
  ];

  it.each(ALIASES)(
    'alias "$alias" and canonical "$canonical" are both routed',
    ({ alias, canonical }) => {
      expect(hasDirectRoute(alias)).toBe(true);
      expect(hasDirectRoute(canonical)).toBe(true);
    }
  );

  it.each(ALIASES)(
    'alias "$alias" is a separate manifest entry (not a router-only redirect)',
    ({ alias }) => {
      expect(manifestToolIds).toContain(alias);
    }
  );

  it.each(ALIASES)(
    'alias "$alias" has the same suite as canonical "$canonical"',
    ({ alias, canonical, suite }) => {
      const aliasTool = manifest.tools.find((t) => t.toolId === alias);
      const canonicalTool = manifest.tools.find((t) => t.toolId === canonical);
      expect(aliasTool?.suite).toBe(suite);
      expect(canonicalTool?.suite).toBe(suite);
    }
  );
});

// ============================================================================
// R4.5 — routeToolInvocation Response Shape
// ============================================================================

describe('routeToolInvocation response shape (R4.5)', () => {
  it('returns { ok: false } for unknown toolId', async () => {
    const result = await routeToolInvocation('nonexistent_tool_xyz', {});
    expect(result.ok).toBe(false);
    expect(result.toolId).toBe('nonexistent_tool_xyz');
    expect(typeof result.error).toBe('string');
    expect(result.error).toContain('No direct route');
  });

  it('route_to_parcel returns a navigation action synchronously', async () => {
    const result = await routeToolInvocation('route_to_parcel', {
      parcelId: 'P-TEST-001',
    });
    expect(result.ok).toBe(true);
    expect(result.toolId).toBe('route_to_parcel');
    expect(result.data).toBeDefined();
    const data = result.data as { action: string; target: string };
    expect(data.action).toBe('navigate');
    expect(data.target).toContain('P-TEST-001');
  });

  it('search_trace_by_correlation returns a trace_search action', async () => {
    const result = await routeToolInvocation('search_trace_by_correlation', {
      correlationId: 'corr-test-123',
    });
    expect(result.ok).toBe(true);
    expect(result.toolId).toBe('search_trace_by_correlation');
    const data = result.data as { action: string; correlationId: string };
    expect(data.action).toBe('trace_search');
    expect(data.correlationId).toBe('corr-test-123');
  });

  it('result always has toolId field matching the request', async () => {
    // Test with a tool that resolves locally (no network)
    const result = await routeToolInvocation('route_to_parcel', {
      parcelId: 'X',
    });
    expect(result.toolId).toBe('route_to_parcel');

    const result2 = await routeToolInvocation('does_not_exist', {});
    expect(result2.toolId).toBe('does_not_exist');
  });
});

// ============================================================================
// R4.5 — getDirectRouteCount consistency
// ============================================================================

describe('getDirectRouteCount consistency (R4.5)', () => {
  it('getDirectRouteCount matches getDirectRouteToolIds length', () => {
    expect(getDirectRouteCount()).toBe(routedToolIds.length);
  });

  it('getDirectRouteCount equals 38', () => {
    expect(getDirectRouteCount()).toBe(38);
  });
});

// ============================================================================
// R4.5 — Per-Tool Route Existence (exhaustive 38-tool enumeration)
// ============================================================================

describe('per-tool route existence (R4.5)', () => {
  // Enumerate all 38 tool IDs from the manifest for explicit per-tool checks
  const ALL_TOOL_IDS = [
    // OS suite (4)
    'route_to_parcel',
    'request_trace_redaction',
    'search_trace_by_correlation',
    'get_muse_capabilities',
    // Atlas suite (4)
    'get_parcel_geometry',
    'query_parcel_layers',
    'get_parcel_centroid',
    'get_geometry_stats',
    // DAIS suite (10)
    'assign_task',
    'check_cert_status',
    'assemble_boe_packet',
    'draft_notice',
    'draft_appeal_response',
    'explain_senior_exemption_impact',
    'generate_commissioner_memo',
    'summarize_levy_rate_components',
    'draft_value_change_notice',
    'draft_boe_appeal_response',
    // Forge suite (12)
    'run_valuation_model',
    'explain_value_change',
    'explain_model_results',
    'compare_assessed_value_history',
    'explain_model_inputs',
    'run_sales_approach',
    'run_income_approach',
    'run_cost_approach',
    'run_reconciliation',
    'get_cost_matrix',
    'muse_explain_assessment',
    'summarize_sales_comps_rationale',
    // Dossier suite (8)
    'summarize_dossier',
    'synthesize_evidence',
    'summarize_parcel_casefile',
    'search_dossier_documents',
    'upload_dossier_document',
    'get_document_chain_of_custody',
    'add_dossier_note',
    'muse_synthesize_evidence',
  ];

  it('enumerated tool list has exactly 38 entries', () => {
    expect(ALL_TOOL_IDS.length).toBe(38);
  });

  it('enumerated tool list matches manifest exactly', () => {
    const sorted = [...ALL_TOOL_IDS].sort();
    const manifestSorted = [...manifestToolIds].sort();
    expect(sorted).toEqual(manifestSorted);
  });

  it.each(ALL_TOOL_IDS)('tool "%s" has a direct route', (toolId) => {
    expect(hasDirectRoute(toolId)).toBe(true);
  });

  it.each(ALL_TOOL_IDS)('tool "%s" exists in the manifest', (toolId) => {
    expect(manifestToolIds).toContain(toolId);
  });
});
