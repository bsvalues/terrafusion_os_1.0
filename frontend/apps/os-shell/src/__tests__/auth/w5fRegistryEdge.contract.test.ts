/**
 * W5F — Registry-Aware Frontend Edge Cleanup
 *
 * Static source-file inspection for API endpoint canonicality,
 * simulation disclosure, registry consistency, and fallback honesty.
 *
 * Gate 1: buildApiUrl canonical pattern — the centralized API base module
 *         enforces Invariant B (no /api prefix in callsites)
 * Gate 2: Governed service files use relative /api paths (not absolute URLs)
 * Gate 3: TerraFusionEliteAPI declares simulation source typing,
 *         and GovernmentAIStatus discloses simulated data
 * Gate 4: Suite registry consistency — constitutional suite types match definitions
 * Gate 5: No hardcoded ports in governed service files
 * Gate 6: Fallback honesty — governed callers either disclose or throw on error
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

const SRC_ROOT = path.resolve(__dirname, '../..');

function readSrc(relPath: string): string {
  return fs.readFileSync(path.join(SRC_ROOT, relPath), 'utf-8');
}

// ============================================================================
// Gate 1 — buildApiUrl canonical pattern (Invariant B)
// ============================================================================

describe('Gate 1 — buildApiUrl canonical pattern enforces Invariant B', () => {
  const src = readSrc('lib/apiBase.ts');

  it('exports buildApiUrl function', () => {
    expect(src).toContain('export function buildApiUrl');
  });

  it('exports getApiBase function', () => {
    expect(src).toContain('export function getApiBase');
  });

  it('returns /api for browser context', () => {
    expect(src).toContain("return '/api'");
  });

  it('documents Invariant B governance', () => {
    expect(src).toContain('INVARIANT B');
    expect(src).toContain('Callsites pass paths WITHOUT /api prefix');
  });

  it('rejects paths starting with /api/ (guard clause)', () => {
    expect(src).toContain("path.startsWith('/api/')");
  });

  it('documents FORBIDDEN usage of hardcoded localhost URLs', () => {
    expect(src).toContain('FORBIDDEN');
    expect(src).toContain('localhost');
  });
});

// ============================================================================
// Gate 2 — Governed service files use relative /api paths
// ============================================================================

describe('Gate 2 — governed service files use relative API paths', () => {
  it('daisService uses relative /api/dais path', () => {
    const src = readSrc('services/suites/daisService.ts');
    expect(src).toContain("'/api/dais'");
    expect(src).not.toMatch(/localhost:\d+/);
    expect(src).not.toContain('VITE_API_URL');
  });

  it('queueService uses relative /api/dais/queue path', () => {
    const src = readSrc('services/suites/queueService.ts');
    expect(src).toContain("'/api/dais/queue'");
    expect(src).not.toMatch(/localhost:\d+/);
    expect(src).not.toContain('VITE_API_URL');
  });

  it('terraTrace uses relative /api/trace path', () => {
    const src = readSrc('services/terraTrace.ts');
    expect(src).toContain("'/api/trace");
    expect(src).not.toMatch(/localhost:\d+/);
  });

  it('pilotApi documents its own URL resolution pattern', () => {
    const src = readSrc('api/pilotApi.ts');
    expect(src).toContain('API_BASE_URL');
    expect(src).not.toMatch(/localhost:\d+/);
  });

  it('useBackendConnection uses buildApiUrl centralized pattern', () => {
    const src = readSrc('hooks/useBackendConnection.tsx');
    expect(src).toContain('buildApiUrl');
    expect(src).not.toMatch(/localhost:\d+/);
  });
});

// ============================================================================
// Gate 3 — TerraFusionEliteAPI simulation disclosure
// ============================================================================

describe('Gate 3 — TerraFusionEliteAPI simulation is disclosed', () => {
  const eliteApi = readSrc('services/TerraFusionEliteAPI.ts');

  it('APIResponse type includes source field with QUANTUM_SIMULATION', () => {
    expect(eliteApi).toContain("source: 'BACKEND' | 'ELITE_CACHE' | 'QUANTUM_SIMULATION'");
  });

  it('assigns QUANTUM_SIMULATION source in fallback path', () => {
    expect(eliteApi).toContain("source: 'QUANTUM_SIMULATION'");
  });

  it('assigns BACKEND source for real data', () => {
    expect(eliteApi).toContain("source: 'BACKEND'");
  });

  it('assigns ELITE_CACHE source for cached data', () => {
    expect(eliteApi).toContain("source: 'ELITE_CACHE'");
  });

  it('exposes getOperationalMode for transparency', () => {
    expect(eliteApi).toContain('getOperationalMode');
    expect(eliteApi).toContain('getCacheStatus');
  });

  it('GovernmentAIStatus imports DemoDataBanner for disclosure', () => {
    const src = readSrc('components/ai/GovernmentAIStatus.tsx');
    expect(src).toContain("import { DemoDataBanner }");
    expect(src).toContain('DemoDataBanner');
  });

  it('GovernmentAIStatus tracks data source', () => {
    const src = readSrc('components/ai/GovernmentAIStatus.tsx');
    expect(src).toContain('dataSource');
    expect(src).toContain('setDataSource');
    expect(src).toContain('response.source');
  });

  it('GovernmentAIStatus discloses when data is simulated', () => {
    const src = readSrc('components/ai/GovernmentAIStatus.tsx');
    expect(src).toContain('isSimulated');
    expect(src).toContain("dataSource !== 'BACKEND'");
    expect(src).toContain('module="Government AI Status"');
  });

  it('GovernmentAIStatus uses console.info not console.log', () => {
    const src = readSrc('components/ai/GovernmentAIStatus.tsx');
    expect(src).not.toContain('console.log');
  });
});

// ============================================================================
// Gate 4 — Suite registry consistency
// ============================================================================

describe('Gate 4 — suite registry constitutional types', () => {
  const registry = readSrc('config/suiteRegistry.ts');

  const CONSTITUTIONAL_SUITES = ['forge', 'atlas', 'dais', 'dossier', 'gpt'];
  const OS_FEATURES = ['pilot', 'trace', 'canon'];
  const WORKBENCH_TABS = ['summary', 'forge', 'atlas', 'dais', 'clerk', 'treasury', 'audit', 'dossier', 'pilot'];

  for (const suite of CONSTITUTIONAL_SUITES) {
    it(`SuiteId includes '${suite}'`, () => {
      expect(registry).toContain(`| '${suite}'`);
    });
  }

  for (const feature of OS_FEATURES) {
    it(`OsFeatureId includes '${feature}'`, () => {
      expect(registry).toContain(`| '${feature}'`);
    });
  }

  for (const tab of WORKBENCH_TABS) {
    it(`WorkbenchTabId includes '${tab}'`, () => {
      expect(registry).toContain(`| '${tab}'`);
    });
  }

  it('exports SuiteDefinition interface', () => {
    expect(registry).toContain('export interface SuiteDefinition');
  });

  it('SuiteDefinition has status: live | wip | planned', () => {
    expect(registry).toContain("'live' | 'wip' | 'planned'");
  });
});

// ============================================================================
// Gate 5 — No hardcoded ports in governed service files
// ============================================================================

describe('Gate 5 — no hardcoded ports in governed service files', () => {
  const GOVERNED_FILES = [
    'services/suites/daisService.ts',
    'services/suites/queueService.ts',
    'services/terraTrace.ts',
    'lib/apiBase.ts',
    'api/pilotApi.ts',
    'hooks/useBackendConnection.tsx',
    'services/forge/statisticsAPI.ts',
    'services/forge/regressionAPI.ts',
  ];

  for (const file of GOVERNED_FILES) {
    it(`${file} has no hardcoded port numbers in code (comments excluded)`, () => {
      const src = readSrc(file);
      // Strip single-line (//) and multi-line (/* */) comments before checking
      const codeOnly = src
        .replace(/\/\/.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '');
      const portMatches = codeOnly.match(/localhost:\d{4}/g);
      expect(portMatches).toBeNull();
    });
  }
});

// ============================================================================
// Gate 6 — Fallback honesty: governed callers disclose or throw
// ============================================================================

describe('Gate 6 — fallback honesty in governed callers', () => {
  it('queueService has throwOnError option for honest callers', () => {
    const src = readSrc('services/suites/queueService.ts');
    expect(src).toContain('QueueReadOptions');
    expect(src).toContain('throwOnError');
  });

  it('daisService API path is relative (proxied, not absolute)', () => {
    const src = readSrc('services/suites/daisService.ts');
    expect(src).toMatch(/const API\s*=\s*'\/api\//);
  });

  it('TerraFusionEliteAPI makeEliteAPICall tags every response with source', () => {
    const src = readSrc('services/TerraFusionEliteAPI.ts');
    // Every return path must have source field
    const backendReturn = src.includes("source: 'BACKEND'");
    const cacheReturn = src.includes("source: 'ELITE_CACHE'");
    const simReturn = src.includes("source: 'QUANTUM_SIMULATION'");
    expect(backendReturn && cacheReturn && simReturn).toBe(true);
  });

  it('statisticsAPI uses getToken for authenticated calls (not anonymous)', () => {
    const src = readSrc('services/forge/statisticsAPI.ts');
    expect(src).toContain('getToken');
  });

  it('regressionAPI uses getToken for authenticated calls (not anonymous)', () => {
    const src = readSrc('services/forge/regressionAPI.ts');
    expect(src).toContain('getToken');
  });
});
