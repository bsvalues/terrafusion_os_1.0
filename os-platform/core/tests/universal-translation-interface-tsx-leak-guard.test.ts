import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'vitest';
import { assertNoRawColorLeaks } from '../../../tools/ui-tokens/leak-guard';

/**
 * UniversalTranslationInterface.tsx — MUI styled-components + sx props
 * with purple info overlays, indigo shadows, and white/black alpha.
 * This guard ensures we never regress to raw rgba() literals.
 */
describe('UniversalTranslationInterface.tsx leak guard', () => {
  it('contains no raw color values', () => {
    const file = path.join(
      process.cwd(),
      'frontend/apps/os-shell/src/components/consciousness/UniversalTranslationInterface.tsx'
    );
    const content = fs.readFileSync(file, 'utf8');
    assertNoRawColorLeaks(content, { label: 'UniversalTranslationInterface.tsx' });
  });
});
