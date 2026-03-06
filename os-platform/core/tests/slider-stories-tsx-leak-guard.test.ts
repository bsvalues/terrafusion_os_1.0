import fs from 'node:fs';
import path from 'node:path';
import { assertNoRawColorLeaks } from '../../../tools/ui-tokens/leak-guard';

/**
 * Leak guard for Slider.stories.tsx (Phase 128).
 * Story demos often regress with literal tints in tracks/thumbs and focus rings.
 */
describe('Slider.stories.tsx leak guard', () => {
  it('contains no raw color values', () => {
    const filePath = path.join(
      process.cwd(),
      'frontend/apps/os-shell/src/components/ui/Slider.stories.tsx'
    );
    expect(fs.existsSync(filePath), `Expected file to exist: ${filePath}`).toBe(true);
    const content = fs.readFileSync(filePath, 'utf8');
    assertNoRawColorLeaks(content, {
      label: 'Slider.stories.tsx',
      knownViolationBaseline: 6, // False positive: HTML entities &#123;/&#125; in storybook markdown descriptions
    });
  });
});
