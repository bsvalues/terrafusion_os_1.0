import { resolve } from 'path';
import { assertNoRawColorLeaks } from '@tools/ui-tokens/leak-guard';

describe('QuantumNavigation.css – no raw color leaks', () => {
  it('contains zero raw rgba/hsla/hex violations', () => {
    const file = resolve(
      __dirname,
      '../../../../src/components/navigation/QuantumNavigation.css',
    );
    assertNoRawColorLeaks(file);
  });
});
