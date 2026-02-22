import { resolve } from 'path';
import { assertNoRawColorLeaks } from '@tools/ui-tokens/leak-guard';

describe('components/styles/terrafusion-tokens.css — no raw color leaks', () => {
  it('contains zero raw colour literals', () => {
    const file = resolve(
      __dirname,
      '../../../../src/components/styles/terrafusion-tokens.css',
    );
    assertNoRawColorLeaks(file);
  });
});
