import { assertNoRawColorLeaks } from '@tools/ui-tokens/leak-guard';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('terrafusion-brand-compliant.css leak guard', () => {
  it('contains no raw color values', () => {
    const file = resolve(__dirname, '../../../../src/styles/terrafusion-brand-compliant.css');
    const content = readFileSync(file, 'utf8');
    assertNoRawColorLeaks(content, { label: 'terrafusion-brand-compliant.css' });
  });
});
