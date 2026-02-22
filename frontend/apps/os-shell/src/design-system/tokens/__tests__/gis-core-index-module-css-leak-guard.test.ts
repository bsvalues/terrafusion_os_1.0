import { assertNoRawColorLeaks } from '@tools/ui-tokens/leak-guard';
import { resolve } from 'path';

describe('gis-core/index.module.css — no raw color leaks', () => {
  it('contains zero raw colour literals', () => {
    const file = resolve(__dirname, '../../../../src/plugins/gis-core/index.module.css');
    assertNoRawColorLeaks(file);
  });
});
