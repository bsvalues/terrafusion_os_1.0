import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { assertNoRawColorLeaks } from '../../../tools/ui-tokens/leak-guard';

describe('HeroSections.css leak guard', () => {
  it('contains no raw color values', () => {
    const abs = resolve(
      __dirname,
      '../../../frontend/apps/os-shell/src/components/brand/HeroSections.css'
    );
    const src = readFileSync(abs, 'utf-8');
    assertNoRawColorLeaks(src, { label: 'HeroSections.css' });
  });
});
