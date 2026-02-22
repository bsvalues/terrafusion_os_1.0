import { assertNoRawColorLeaks } from '@tools/ui-tokens/leak-guard';
import { resolve } from 'path';

describe('ApplicationLauncher.tsx – raw-color leak guard', () => {
  it('contains zero disallowed raw color literals', () => {
    assertNoRawColorLeaks(
      resolve(__dirname, '../../../../components/ApplicationLauncher.tsx'),
    );
  });
});
