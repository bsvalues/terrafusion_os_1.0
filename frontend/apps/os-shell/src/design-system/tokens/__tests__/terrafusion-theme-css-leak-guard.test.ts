import { assertNoRawColorLeaks } from '@tools/ui-tokens/leak-guard';
import { resolve } from 'path';

describe('terrafusion-theme.css – token-leak guard', () => {
  it('contains zero raw color literals', () => {
    assertNoRawColorLeaks(resolve(__dirname, '../../../../src/styles/terrafusion-theme.css'));
  });
});
