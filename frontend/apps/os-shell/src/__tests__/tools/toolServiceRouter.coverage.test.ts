/**
 * Tool Service Router Coverage Test
 * =================================================================
 * R3.2 Condition 1: Asserts every manifest tool has exactly one route
 * decision in toolRoutes. Fails if manifest adds a tool without a
 * corresponding route, or if a route exists without a manifest entry.
 *
 * This is the gatekeeper: no tool can be silently unrouted.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { hasDirectRoute, getDirectRouteToolIds } from '../../services/toolServiceRouter';

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

// ============================================================================
// Tests
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
    // toolRoutes is a Record<string, ToolHandler>, so by construction
    // each key can only have one handler. But verify no duplicates in
    // the manifest itself.
    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const id of manifestToolIds) {
      if (seen.has(id)) duplicates.push(id);
      seen.add(id);
    }
    expect(duplicates).toEqual([]);
  });

  it('alias tools should have distinct route entries', () => {
    // Aliases documented in toolServiceRouter.ts header
    const aliases = [
      { alias: 'draft_value_change_notice', canonical: 'draft_notice' },
      { alias: 'draft_boe_appeal_response', canonical: 'draft_appeal_response' },
    ];

    for (const { alias, canonical } of aliases) {
      expect(hasDirectRoute(alias)).toBe(true);
      expect(hasDirectRoute(canonical)).toBe(true);
      // Both should be in the route list (separate entries)
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
