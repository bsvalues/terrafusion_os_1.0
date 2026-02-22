import { resolve } from 'path';
import { assertNoRawColorLeaks } from '@tools/ui-tokens/leak-guard';

describe('ResearchPortal.tsx – no raw color leaks', () => {
  it('contains zero raw rgba/hsla/hex violations', () => {
    const file = resolve(
      __dirname,
      '../../../../src/components/research/ResearchPortal.tsx',
    );
    assertNoRawColorLeaks(file);
  });
});
