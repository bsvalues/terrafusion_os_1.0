/**
 * Suite Window Layout Tests
 *
 * Verifies that suite home pages use layout classes compatible with
 * windowed rendering inside the Desktop OS shell.
 *
 * Key invariant: Suite homes must NOT use `min-h-screen` because they
 * are rendered inside Desktop windows (800x600+). They should use
 * `h-full flex flex-col` to fill their container.
 *
 * @module pages/suites/__tests__/suiteWindowLayout.test
 * @vitest-environment jsdom
 * @see docs/governance/slice-7.1-desktop-visual-polish/
 */

import fs from 'fs';
import path from 'path';

const SUITES_DIR = path.resolve(__dirname, '..');

/**
 * Read the source of a suite home file and return it as a string.
 */
function readSuiteSource(filename: string): string {
  return fs.readFileSync(path.join(SUITES_DIR, filename), 'utf-8');
}

// ============================================================================
// Task 1: Suite home pages should NOT use min-h-screen
// ============================================================================

describe('Suite home page layout classes', () => {
  const SUITE_FILES = [
    'ForgeSuiteHome.tsx',
    'AtlasSuiteHome.tsx',
    'DaisSuiteHome.tsx',
    'DossierSuiteHome.tsx',
    'GptSuiteHome.tsx',
  ];

  describe.each(SUITE_FILES)('%s', (filename) => {
    it('should NOT contain min-h-screen on the root container', () => {
      const source = readSuiteSource(filename);
      // The root return should not use min-h-screen
      const rootDivMatch = source.match(
        /return\s*\(\s*<div\s+className='([^']*)'/
      );
      expect(rootDivMatch).not.toBeNull();
      const rootClasses = rootDivMatch![1];
      expect(rootClasses).not.toContain('min-h-screen');
    });

    it('should have a valid root container class', () => {
      const source = readSuiteSource(filename);
      const rootDivMatch = source.match(
        /return\s*\(\s*<div\s+className='([^']*)'/
      );
      expect(rootDivMatch).not.toBeNull();
      // Root container should have some layout class (flex or padding)
      const rootClasses = rootDivMatch![1];
      expect(rootClasses.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// Task 2: ModuleLoader should NOT have overflow-auto
// ============================================================================

describe('ModuleLoader overflow', () => {
  it('should use overflow-hidden instead of overflow-auto', () => {
    const moduleLoaderPath = path.resolve(
      __dirname,
      '../../../shell/desktop/ModuleLoader.tsx'
    );
    const source = fs.readFileSync(moduleLoaderPath, 'utf-8');
    // The module loader wrapper div should NOT have overflow-auto
    expect(source).toContain('overflow-hidden');
    expect(source).not.toMatch(/className='w-full h-full overflow-auto'/);
  });
});

// ============================================================================
// Task 3: Default window size should be 1024x700
// ============================================================================

describe('Default window size', () => {
  it('should be 1024x700', () => {
    const storePath = path.resolve(
      __dirname,
      '../../../stores/desktopStore.ts'
    );
    const source = fs.readFileSync(storePath, 'utf-8');
    expect(source).toContain('width: 1024');
    expect(source).toContain('height: 700');
  });
});
