import fs from 'node:fs';
import path from 'node:path';
import { assertNoRawColorLeaks } from '../../../tools/ui-tokens/leak-guard';

describe('terrafusion-tokens.css leak guard', () => {
  it('contains no raw color values', () => {
    const file = path.join(
      process.cwd(),
      'frontend/apps/os-shell/src/styles/terrafusion-tokens.css'
    );
    const content = fs.readFileSync(file, 'utf8');
    assertNoRawColorLeaks(content, { label: 'terrafusion-tokens.css' });
  });
});
