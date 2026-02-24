import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assertNoRawColorLeaks } from '../../../tools/ui-tokens/leak-guard';

/**
 * Phase 125 leak guard — Overview.mdx
 * Docs tend to regress via inline styles, svg snippets, and "example" colors.
 */
describe('Overview.mdx leak guard', () => {
  it('contains no raw color values', () => {
    const repoRoot = process.cwd();

    const rel = 'frontend/apps/os-shell/src/design-system/tokens/Overview.mdx';

    const filePath = path.join(repoRoot, rel);
    expect(fs.existsSync(filePath), `Expected file to exist: ${filePath}`).toBe(true);

    const content = fs.readFileSync(filePath, 'utf8');
    assertNoRawColorLeaks(content, { label: 'Overview.mdx' });
  });
});
