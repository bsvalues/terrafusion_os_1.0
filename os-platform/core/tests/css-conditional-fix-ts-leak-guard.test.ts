import fs from 'node:fs';
import path from 'node:path';
import { assertNoRawColorLeaks } from '../../../tools/ui-tokens/leak-guard';

/**
 * Phase 146 leak guard — css-conditional-fix.ts
 */
describe('css-conditional-fix.ts leak guard', () => {
  it('contains no raw color values', () => {
    const repoRoot = process.cwd();
    const rel = 'frontend/apps/os-shell/src/styles/css-conditional-fix.ts';

    const filePath = path.join(repoRoot, rel);
    expect(fs.existsSync(filePath), `Expected file to exist: ${filePath}`).toBe(true);

    const content = fs.readFileSync(filePath, 'utf8');
    assertNoRawColorLeaks(content, { label: 'css-conditional-fix.ts' });
  });
});
