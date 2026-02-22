import { assertNoRawColorLeaks } from '@tools/ui-tokens/leak-guard';
import { resolve } from 'path';

describe('terrafusion-os.css — no raw color leaks', () => {
  it('contains zero raw colour literals', () => {
    const file = resolve(__dirname, '../../../../src/styles/terrafusion-os.css');
    assertNoRawColorLeaks(file);
  });
});
