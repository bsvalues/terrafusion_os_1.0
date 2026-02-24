import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assertNoRawColorLeaks } from '../../../tools/ui-tokens/leak-guard';

/**
 * Leak guard for TerraDossierGen2.tsx (Phase 123).
 * Gen2 surfaces are high-risk for raw hex/rgba regressions.
 */
describe('TerraDossierGen2.tsx leak guard', () => {
  it('contains no raw color values', () => {
    const filePath = path.join(
      process.cwd(),
      'frontend/apps/os-shell/src/pages/gen2/TerraDossierGen2.tsx'
    );
    expect(fs.existsSync(filePath), `Expected file to exist: ${filePath}`).toBe(true);
    const content = fs.readFileSync(filePath, 'utf8');
    assertNoRawColorLeaks(content, { label: 'TerraDossierGen2.tsx' });
  });
});
