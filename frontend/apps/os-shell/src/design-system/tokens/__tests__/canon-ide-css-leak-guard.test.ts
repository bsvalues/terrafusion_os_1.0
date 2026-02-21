import { assertNoRawColorLeaks } from '@tools/ui-tokens/leak-guard';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('canon-ide.css leak guard', () => {
  it('contains no raw color values', () => {
    const file = resolve(__dirname, '../../../../src/styles/canon-ide.css');
    const content = readFileSync(file, 'utf8');
    assertNoRawColorLeaks(content, { label: 'canon-ide.css' });
  });
});
