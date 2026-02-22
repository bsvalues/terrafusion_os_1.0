import { assertNoRawColorLeaks } from '@tools/ui-tokens/leak-guard';
import { resolve } from 'path';

describe('terrafusion-quantum-animations.css — no raw color leaks', () => {
  it('contains zero raw colour literals', () => {
    const file = resolve(__dirname, '../../../../src/styles/terrafusion-quantum-animations.css');
    assertNoRawColorLeaks(file);
  });
});
