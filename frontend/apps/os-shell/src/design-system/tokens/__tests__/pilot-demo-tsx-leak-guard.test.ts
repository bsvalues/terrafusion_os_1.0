import { assertNoRawColorLeaks } from '@tools/ui-tokens/leak-guard';
import { resolve } from 'path';

describe('PilotDemo.tsx – token-leak guard', () => {
  it('contains zero raw color literals', () => {
    assertNoRawColorLeaks(resolve(__dirname, '../../../../src/pages/PilotDemo.tsx'));
  });
});
