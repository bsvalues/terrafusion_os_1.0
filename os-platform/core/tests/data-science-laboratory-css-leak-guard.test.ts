import { describe, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { assertNoRawColorLeaks } from '../../../tools/ui-tokens/leak-guard';

describe('DataScienceLaboratory.css leak guard', () => {
  it('contains no raw color values', () => {
    const abs = resolve(
      __dirname,
      '../../../frontend/apps/os-shell/src/applications/terra-levy/components/analytics/DataScienceLaboratory.css',
    );
    const src = readFileSync(abs, 'utf-8');
    assertNoRawColorLeaks(src, { label: 'DataScienceLaboratory.css' });
  });
});
