import { resolve } from 'path';
import { assertNoRawColorLeaks } from '@tools/ui-tokens/leak-guard';

describe('terraflow-tokens.css – no raw color leaks', () => {
  it('contains zero raw rgba/hsla/hex violations', () => {
    const file = resolve(
      __dirname,
      '../../../../src/design/terraflow-tokens.css',
    );
    assertNoRawColorLeaks(file);
  });
});
