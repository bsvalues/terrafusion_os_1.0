import fs from 'node:fs';
import path from 'node:path';
import { assertNoRawColorLeaks } from '../../../tools/ui-tokens/leak-guard';

/**
 * Leak guard for TerraForgeGen2.tsx (Phase 124).
 * Forge surfaces are high-risk for hardcoded status colors + neutral alphas.
 */
describe('TerraForgeGen2.tsx leak guard', () => {
  it('contains no raw color values', () => {
    const repoRoot = process.cwd();

    const rel = 'frontend/apps/os-shell/src/pages/gen2/TerraForgeGen2.tsx';

    const filePath = path.join(repoRoot, rel);
    expect(fs.existsSync(filePath), `Expected file to exist: ${filePath}`).toBe(true);

    const content = fs.readFileSync(filePath, 'utf8');
    assertNoRawColorLeaks(content, { label: 'TerraForgeGen2.tsx' });
  });
});
