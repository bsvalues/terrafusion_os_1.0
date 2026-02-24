import fs from 'node:fs';
import path from 'node:path';
import { assertNoRawColorLeaks } from '../../../tools/ui-tokens/leak-guard';

describe('AccessibilityCompliance.test.tsx leak guard', () => {
  it('contains no raw color values (hex, rgba, or raw hsl without var())', () => {
    const file = path.join(
      process.cwd(),
      'frontend/apps/os-shell/src/tests/accessibility/AccessibilityCompliance.test.tsx'
    );
    const content = fs.readFileSync(file, 'utf8');
    assertNoRawColorLeaks(content, { label: 'AccessibilityCompliance.test.tsx' });
  });
});
