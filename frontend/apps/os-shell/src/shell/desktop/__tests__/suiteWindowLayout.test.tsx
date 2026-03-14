/**
 * Suite Window Layout Compliance Tests
 *
 * Verifies that all suite home components use correct layout patterns
 * for rendering inside Desktop windows (not standalone pages).
 *
 * CANONICAL SPEC (Part 1):
 *   Suites must use `h-full flex flex-col` (not `min-h-screen`).
 *   Independent scroll regions via `flex-1 min-h-0`.
 *
 * @module shell/desktop/__tests__/suiteWindowLayout.test
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Constants
// ============================================================================

const SUITE_DIR = path.resolve(__dirname, '../../../pages/suites');

const SUITE_FILES = [
  'ForgeSuiteHome.tsx',
  'AtlasSuiteHome.tsx',
  'DaisSuiteHome.tsx',
  'DossierSuiteHome.tsx',
  'GptSuiteHome.tsx',
  'SuiteHome.tsx',
];

// ============================================================================
// Tests
// ============================================================================

describe('Suite Window Layout Compliance', () => {
  const suiteContents: Record<string, string> = {};

  beforeAll(() => {
    for (const file of SUITE_FILES) {
      const filePath = path.join(SUITE_DIR, file);
      suiteContents[file] = fs.readFileSync(filePath, 'utf-8');
    }
  });

  it.each(SUITE_FILES)('%s has h-full flex flex-col on root container', (file) => {
    const content = suiteContents[file];
    expect(content).toMatch(/h-full\s+flex\s+flex-col|h-full.*flex.*flex-col/);
  });

  it.each(SUITE_FILES)('%s does NOT use min-h-screen', (file) => {
    const content = suiteContents[file];
    expect(content).not.toContain('min-h-screen');
  });

  it.each(SUITE_FILES)('%s has flex-1 min-h-0 for scroll containment', (file) => {
    const content = suiteContents[file];
    expect(content).toMatch(/flex-1.*min-h-0|min-h-0.*flex-1/);
  });

  it('ModuleLoader.tsx has overflow-hidden', () => {
    const loaderPath = path.resolve(__dirname, '../ModuleLoader.tsx');
    const content = fs.readFileSync(loaderPath, 'utf-8');
    expect(content).toContain('overflow-hidden');
  });
});
