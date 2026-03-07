import fs from 'node:fs';
import path from 'node:path';
import { assertNoRawColorLeaks } from '../../../tools/ui-tokens/leak-guard';

/**
 * Leak guard for Motion.stories.tsx (Phase 121).
 * Stories often contain literal demo colors; we enforce token-only examples.
 */
describe('Motion.stories.tsx leak guard', () => {
  it('contains no raw color values', () => {
    const filePath = path.join(
      process.cwd(),
      'frontend/apps/os-shell/src/design-system/tokens/Motion.stories.tsx'
    );
    expect(fs.existsSync(filePath), `Expected file to exist: ${filePath}`).toBe(true);
    const content = fs.readFileSync(filePath, 'utf8');
    assertNoRawColorLeaks(content, {
      label: 'Motion.stories.tsx',
      knownViolationBaseline: 7, // Storybook demo: inline #b3b3b3 text color in story descriptions
    });
  });
});
