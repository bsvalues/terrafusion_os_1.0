import fs from 'node:fs';
import path from 'node:path';
import { assertNoRawColorLeaks } from '../../../tools/ui-tokens/leak-guard';

/**
 * Phase 138 leak guard — suiteRegistry.ts
 */
describe('suiteRegistry.ts leak guard', () => {
  it('contains no raw color values', () => {
    const repoRoot = process.cwd();
    const rel =
      'frontend/apps/os-shell/src/config/suiteRegistry.ts';

    const filePath = path.join(repoRoot, rel);
    expect(fs.existsSync(filePath), `Expected file to exist: ${filePath}`).toBe(true);

    const content = fs.readFileSync(filePath, 'utf8');
    assertNoRawColorLeaks(content, { label: 'suiteRegistry.ts' });
  });
});
