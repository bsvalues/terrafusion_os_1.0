/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS — Suite Write-Lane Compliance Test
 *
 * Enforces Article III of the TerraFusion Suite Constitution:
 * Each suite home may ONLY import from its own domain.
 * No cross-suite component or module imports allowed.
 *
 * Static analysis test — reads source files, checks import paths.
 * ═══════════════════════════════════════════════════════════════
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, '..', '..', '..');
const SUITES_DIR = resolve(REPO, 'frontend/apps/os-shell/src/pages/suites');

// ============================================================================
// Constitutional Write-Lane Map
// Each suite ID maps to its allowed import domains (path fragments).
// Imports from shared infrastructure (@/components/ui, @/components/workbench,
// lucide-react, react, react-router-dom) are always allowed.
// ============================================================================

const SUITE_HOMES = [
  {
    id: 'forge',
    file: 'ForgeSuiteHome.tsx',
    // Forge may import from ./modules/ (local), valuation-domain paths
    forbiddenDomains: ['atlas', 'dais', 'dossier', 'gpt'],
  },
  {
    id: 'atlas',
    file: 'AtlasSuiteHome.tsx',
    forbiddenDomains: ['forge', 'dais', 'dossier', 'gpt'],
  },
  {
    id: 'dais',
    file: 'DaisSuiteHome.tsx',
    forbiddenDomains: ['forge', 'atlas', 'dossier', 'gpt'],
  },
  {
    id: 'dossier',
    file: 'DossierSuiteHome.tsx',
    forbiddenDomains: ['forge', 'atlas', 'dais', 'gpt'],
  },
  {
    id: 'gpt',
    file: 'GptSuiteHome.tsx',
    // GPT may import from @/features/gpt, @/components/gpt (own domain)
    forbiddenDomains: ['forge', 'atlas', 'dais', 'dossier'],
  },
];

/**
 * Extract all import paths from a TypeScript source file.
 * Matches: import ... from 'path' and import('path')
 */
function extractImports(source) {
  const imports = [];

  // Static imports: import ... from 'path'
  const staticRe = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
  let m;
  while ((m = staticRe.exec(source)) !== null) {
    imports.push(m[1]);
  }

  // Dynamic imports: import('path')
  const dynamicRe = /import\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((m = dynamicRe.exec(source)) !== null) {
    imports.push(m[1]);
  }

  return imports;
}

/**
 * Check if an import path references another suite's domain.
 * We look for suite names as directory segments in the import path.
 * Skip shared infrastructure (ui, workbench, lib, hooks, services, stores, context, contracts).
 */
function isCrossSuiteImport(importPath, forbiddenDomains) {
  // Normalize to lowercase for comparison
  const lower = importPath.toLowerCase();

  // Skip external packages (no path separators, or starts with package name)
  if (!lower.startsWith('.') && !lower.startsWith('@/') && !lower.startsWith('~/')) {
    return false;
  }

  // Skip shared infrastructure paths
  const sharedPaths = [
    '/components/ui/',
    '/components/workbench/',
    '/components/errors/',
    '/lib/',
    '/hooks/',
    '/services/',
    '/stores/',
    '/context/',
    '/contracts/',
    '/config/',
    '/utils/',
    '/types/',
  ];
  if (sharedPaths.some((sp) => lower.includes(sp))) {
    return false;
  }

  // Check if the import path references a forbidden suite's domain
  for (const domain of forbiddenDomains) {
    // Match suite name as a directory segment: /suites/ForgeSuiteHome, /forge/, etc.
    // Case-insensitive check for the suite domain name in the path
    const domainPatterns = [
      `/${domain}/`,           // directory segment
      `/${domain}suiteHome`,   // direct suite home reference (case-insensitive)
      `/suites/${domain}`,     // suites subdirectory
    ];

    for (const pattern of domainPatterns) {
      if (lower.includes(pattern.toLowerCase())) {
        return { importPath, violatedDomain: domain };
      }
    }
  }

  return false;
}

// ============================================================================
// Tests
// ============================================================================

describe('Suite Write-Lane Compliance (Article III)', () => {
  for (const suite of SUITE_HOMES) {
    it(`${suite.id} suite home (${suite.file}) has no cross-suite imports`, () => {
      const filePath = resolve(SUITES_DIR, suite.file);
      const source = readFileSync(filePath, 'utf-8');
      const imports = extractImports(source);
      const violations = [];

      for (const imp of imports) {
        const result = isCrossSuiteImport(imp, suite.forbiddenDomains);
        if (result) {
          violations.push(result);
        }
      }

      assert.equal(
        violations.length,
        0,
        `${suite.id} suite has ${violations.length} cross-suite import(s):\n` +
          violations.map((v) => `  - "${v.importPath}" references forbidden domain "${v.violatedDomain}"`).join('\n')
      );
    });
  }

  it('all 5 constitutional suites have home files', () => {
    for (const suite of SUITE_HOMES) {
      const filePath = resolve(SUITES_DIR, suite.file);
      try {
        readFileSync(filePath);
      } catch {
        assert.fail(`Missing suite home: ${suite.file}`);
      }
    }
  });
});
