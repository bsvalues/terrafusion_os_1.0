import { assertNoRawColorLeaks } from '@tools/ui-tokens/leak-guard';
import { resolve } from 'path';

describe('Alert.stories.tsx — no raw color leaks', () => {
  it('contains zero raw colour literals', () => {
    const file = resolve(__dirname, '../../../../src/components/ui/Alert.stories.tsx');
    assertNoRawColorLeaks(file);
  });
});
