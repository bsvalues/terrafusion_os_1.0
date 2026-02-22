import { resolve } from 'path';
import { assertNoRawColorLeaks } from '@tools/ui-tokens/leak-guard';

describe('terrafusion-advanced-architecture.css – no raw color leaks', () => {
  it('contains zero raw rgba/hsla/hex violations', () => {
    const file = resolve(
      __dirname,
      '../../../../src/styles/terrafusion-advanced-architecture.css',
    );
    assertNoRawColorLeaks(file);
  });
});
