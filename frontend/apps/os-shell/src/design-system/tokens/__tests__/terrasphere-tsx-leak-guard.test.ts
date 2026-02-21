import { resolve } from 'path';
import { assertNoRawColorLeaks } from '@tools/ui-tokens/leak-guard';

describe('TerraSphere.tsx – token-leak guard', () => {
  it('contains zero raw color literals', () => {
    assertNoRawColorLeaks(
      resolve(__dirname, '../../../../src/ui/brand/TerraSphere.tsx'),
    );
  });
});
