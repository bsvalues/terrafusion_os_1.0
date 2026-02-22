import { assertNoRawColorLeaks } from '@tools/ui-tokens/leak-guard';
import { resolve } from 'path';

describe('LoadingStates.tsx – token-leak guard', () => {
  it('contains zero raw color literals', () => {
    assertNoRawColorLeaks(
      resolve(__dirname, '../../../../src/components/common/LoadingStates.tsx')
    );
  });
});
