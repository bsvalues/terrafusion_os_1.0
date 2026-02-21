import { resolve } from 'path';
import { assertNoRawColorLeaks } from '@tools/ui-tokens/leak-guard';

describe('ImmersiveDashboard.css – token-leak guard', () => {
  it('contains zero raw color literals', () => {
    assertNoRawColorLeaks(
      resolve(__dirname, '../../../../src/applications/terra-levy/components/immersive/dashboard/ImmersiveDashboard.css'),
    );
  });
});
