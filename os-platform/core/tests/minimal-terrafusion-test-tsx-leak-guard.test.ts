import { describe, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { assertNoRawColorLeaks } from '../../../tools/ui-tokens/leak-guard';

describe('MinimalTerraFusionTest.tsx colour-token leak guard', () => {
  it('contains no raw colour literals', () => {
    const abs = resolve(
      __dirname,
      '../../../frontend/apps/os-shell/src/components/emergency/MinimalTerraFusionTest.tsx',
    );
    const src = readFileSync(abs, 'utf-8');
    assertNoRawColorLeaks(src, { label: 'MinimalTerraFusionTest.tsx' });
  });
});
