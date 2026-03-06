import fs from 'node:fs';
import path from 'node:path';
import { assertNoRawColorLeaks } from '../../../tools/ui-tokens/leak-guard';

/**
 * Phase 142 leak guard — Button.stories.tsx
 */
describe('Button.stories.tsx leak guard', () => {
  it('contains no raw color values', () => {
    const repoRoot = process.cwd();
    const rel = 'frontend/apps/os-shell/src/components/ui/Button.stories.tsx';

    const filePath = path.join(repoRoot, rel);
    expect(fs.existsSync(filePath), `Expected file to exist: ${filePath}`).toBe(true);

    const content = fs.readFileSync(filePath, 'utf8');
    assertNoRawColorLeaks(content, {
      label: 'Button.stories.tsx',
      knownViolationBaseline: 12, // Storybook demo: inline background colors and usage guideline examples
    });
  });
});
