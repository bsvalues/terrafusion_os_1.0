import { resolve } from 'path';
import { assertNoRawColorLeaks } from '@tools/ui-tokens/leak-guard';

describe('terrafusion-self-healing.css — no raw color leaks', () => {
  it('contains zero raw colour literals', () => {
    const file = resolve(
      __dirname,
      '../../../../src/styles/terrafusion-self-healing.css',
    );
    assertNoRawColorLeaks(file);
  });
});
