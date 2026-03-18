/**
 * W6B — Dais Launch Honesty Contract Tests
 *
 * Static source-file inspection.
 * Verifies:
 *   - unresolved Dais standalone cards are marked coming-soon at the card seam
 *   - coming-soon cards are disabled and do not launch from SuiteModuleGrid
 *   - real Dais standalone cards remain launchable
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

const SRC_ROOT = path.resolve(__dirname, '../..');

function readSrc(relPath: string): string {
  return fs.readFileSync(path.join(SRC_ROOT, relPath), 'utf-8');
}

describe('Gate 1 — Dais unresolved standalone cards are explicit at the suite seam', () => {
  const src = readSrc('pages/suites/DaisSuiteHome.tsx');

  it('marks TerraCert as coming-soon instead of fully live', () => {
    expect(src).toMatch(/id:\s*'terra-cert'[\s\S]*availability:\s*'coming-soon'/);
  });

  it('marks TerraNotice as coming-soon instead of fully live', () => {
    expect(src).toMatch(/id:\s*'terra-notice'[\s\S]*availability:\s*'coming-soon'/);
  });

  it('keeps Management and TerraQueue as launchable live cards', () => {
    expect(src).toMatch(/\{[^}]*id:\s*'management-dashboard'[^}]*moduleId:\s*'management-dashboard'[^}]*\}/);
    expect(src).toMatch(/\{[^}]*id:\s*'terra-queue'[^}]*moduleId:\s*'terra-queue'[^}]*\}/);
  });
});

describe('Gate 2 — SuiteModuleGrid disables coming-soon cards instead of launching them', () => {
  const src = readSrc('components/suites/SuiteModuleGrid.tsx');

  it('supports explicit availability on suite module definitions', () => {
    expect(src).toContain("availability?: 'live' | 'coming-soon'");
  });

  it('short-circuits launches for coming-soon cards', () => {
    expect(src).toMatch(/if \(mod\.availability === 'coming-soon'\) \{\s*return;\s*\}/);
  });

  it('renders disabled buttons for coming-soon cards', () => {
    expect(src).toContain('disabled={isComingSoon}');
    expect(src).toContain('aria-disabled={isComingSoon}');
    expect(src).toContain("data-coming-soon={isComingSoon ? 'true' : 'false'}");
  });

  it('renders explicit Coming Soon status text in the card UI', () => {
    expect(src).toContain('Coming Soon');
    expect(src).toContain('Launch disabled until the standalone module is implemented.');
  });
});