import { describe, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { assertNoRawColorLeaks } from '../../../tools/ui-tokens/leak-guard';

describe('Marketplace.tsx leak guard', () => {
  it('contains no raw color values', () => {
    const abs = resolve(
      __dirname,
      '../../../frontend/apps/os-shell/src/components/Marketplace.tsx',
    );
    const src = readFileSync(abs, 'utf-8');
    assertNoRawColorLeaks(src, { label: 'Marketplace.tsx' });
  });
});
