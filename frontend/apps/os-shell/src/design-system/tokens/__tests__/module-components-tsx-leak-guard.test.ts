import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { assertNoRawColorLeaks } from '@tools/ui-tokens/leak-guard';

describe('moduleComponents.tsx leak guard', () => {
  it('contains no raw color values', () => {
    const file = resolve(__dirname, '../../../../src/config/moduleComponents.tsx');
    const content = readFileSync(file, 'utf8');
    assertNoRawColorLeaks(content, { label: 'moduleComponents.tsx' });
  });
});
